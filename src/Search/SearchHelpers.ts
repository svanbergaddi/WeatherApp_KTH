import { AppError, Coordinates, Place } from '@/Shared/Types';

// ---- Parse_Places (W-08, W-11) ----
// Translates maps.co's JSON into a list of our own Place.
// maps.co sends an ARRAY of places, and lat/lon come as TEXT ("64.1459810"), so we turn them into numbers.
// No match gives an empty list, not an error: the ViewModel decides to show "not found".
export function Parse_Places(json: unknown): Place[] {
  if (!Array.isArray(json)) throw parseError('response');

  const places = json.map((item, i) => Parse_Place(item, i));
  return Calc_RemoveDuplicates(places);
}

function Parse_Place(item: unknown, index: number): Place {
  if (typeof item !== 'object' || item === null) throw parseError(`place ${index}`);
  const place = item as Record<string, unknown>;

  if (typeof place.display_name !== 'string') throw parseError(`place ${index} display_name`);
  if (typeof place.lat !== 'string' || typeof place.lon !== 'string') throw parseError(`place ${index} lat/lon`);

  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) throw parseError(`place ${index} lat/lon`);

  return { name: Format_PlaceName(place.display_name), latitude, longitude };
}

// display_name is long: "Birmingham, Oakland County, Michigan, United States".
// We keep the place, the region and the country: "Birmingham, Michigan, United States".
// The country alone isn't enough: there are five Birminghams in the United States.
function Format_PlaceName(displayName: string): string {
  const parts = displayName.split(',').map((part) => part.trim());
  if (parts.length <= 3) return parts.join(', ');
  const [place, region, country] = [parts[0], parts[parts.length - 2], parts[parts.length - 1]];
  return `${place}, ${region}, ${country}`;
}

// maps.co often returns the same city twice (once as a city, once as its municipality, a few km apart).
// Two results closer than ~10 km are the same city, so we keep only the first one.
// (Not by name: "Birmingham, Alabama" and "Birmingham, Michigan" are different cities.)
function Calc_RemoveDuplicates(places: Place[]): Place[] {
  const kept: Place[] = [];
  for (const place of places) {
    if (!kept.some((keptPlace) => isSameCity(keptPlace, place))) kept.push(place);
  }
  return kept;
}

// Closer than 0.1° in both latitude and longitude (0.1° latitude ≈ 11 km) counts as the same city.
const SAME_CITY_DEGREES = 0.1;

function isSameCity(a: Place, b: Place): boolean {
  return Math.abs(a.latitude - b.latitude) < SAME_CITY_DEGREES &&
    Math.abs(a.longitude - b.longitude) < SAME_CITY_DEGREES;
}

function parseError(fieldName: string): AppError {
  return new AppError('parse', `maps.co sent a missing or wrong "${fieldName}".`);
}

// ---- Calc_LocalMatches (W-21) ----
// maps.co only matches WHOLE words ("Reykjav" finds nothing), so while typing we first look in our own city list.
// A city matches if its name STARTS with what was typed, ignoring case and accents:
// "reykjav", "Malmo" and "hafnarfjordur" all match.
export function Calc_LocalMatches(query: string, cities: Place[]): Place[] {
  const typed = toSearchKey(query.trim());
  if (typed === '') return [];
  return cities.filter((city) => toSearchKey(city.name).startsWith(typed));
}

// Lowercase and swap Nordic letters for plain ones, so people can type without special keys.
const LETTER_SWAPS: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', å: 'a', æ: 'ae', é: 'e', è: 'e', í: 'i', ó: 'o', ö: 'o', ø: 'o',
  ú: 'u', ü: 'u', ý: 'y', ð: 'd', þ: 'th',
};

function toSearchKey(text: string): string {
  return Array.from(text.toLowerCase(), (letter) => LETTER_SWAPS[letter] ?? letter).join('');
}

// ---- Calc_MergeSuggestions (W-21) ----
// Our own matches first (instant, the Nordic cities we care about), then maps.co's results.
// A maps.co place that is the same city as one of ours (same ~10 km rule as above) is left out.
export function Calc_MergeSuggestions(local: Place[], remote: Place[]): Place[] {
  const newRemote = remote.filter((place) => !local.some((city) => isSameCity(city, place)));
  return [...local, ...newRemote];
}

// ---- Validate_Coordinates (W-13) ----
// Checks what the user typed in the two fields (latitude and longitude).
// Returns the numbers, or throws AppError('invalidInput') with a message the screen can show as is.
//
// A comma is accepted as a decimal point ("59,33" → 59.33), because Swedes and Icelanders type it that way.
// That's safe because latitude and longitude have separate fields, so a comma can't mean "next number".
//
// We use a pattern, not just Number(), because Number('') is 0 and Number('1e2') is 100.
// Allowed: optional minus, digits, optionally a decimal part. E.g. "59", "-21.94", "59,33".
const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

export function Validate_Coordinates(latitudeText: string, longitudeText: string): Coordinates {
  const latitude = readCoordinate(latitudeText, 'Latitude');
  const longitude = readCoordinate(longitudeText, 'Longitude');

  if (latitude < -90 || latitude > 90) {
    throw new AppError('invalidInput', 'Latitude must be between -90 and 90.');
  }
  if (longitude < -180 || longitude > 180) {
    throw new AppError('invalidInput', 'Longitude must be between -180 and 180.');
  }
  return { latitude, longitude };
}

function readCoordinate(text: string, label: string): number {
  const cleaned = text.trim().replace(',', '.');
  if (!NUMBER_PATTERN.test(cleaned)) {
    throw new AppError('invalidInput', `${label} must be a number, like 59.33.`);
  }
  return Number(cleaned);
}
