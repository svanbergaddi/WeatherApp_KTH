import { QuickPickCity } from '@/Search/QuickPickCities';
import { AppError, Coordinates, Place } from '@/Shared/Types';

// ---- Parse_Places (W-08, W-11) ----
// Translates maps.co's JSON into a list of our own Place.
// maps.co sends an ARRAY of places, and lat/lon come as TEXT ("64.1459810"), so we turn them into numbers.
// No match gives an empty list, not an error: the ViewModel decides to show "not found".
// `homeCountryCode` is the phone's country ("se"): places there don't show the country. null = unknown.
export function Parse_Places(json: unknown, homeCountryCode: string | null = null): Place[] {
  if (!Array.isArray(json)) throw parseError('response');

  const found = json.map((item, i) => Parse_Place(item, i));
  const unique = Calc_RemoveDuplicates(found);
  return Calc_ShortNames(unique, homeCountryCode);
}

// A place from maps.co before we've chosen how much of its address to show.
type FoundPlace = Coordinates & {
  placeName: string; // "Östbergahöjden"
  details: AddressPart[]; // the address levels we MAY add, in the order we add them
  country: string | null; // "United States"
  countryCode: string | null; // "us"
};

// One level of the address. `level` is its size (1 = suburb, 2 = town, 3 = region), used to print them small → big.
type AddressPart = { level: number; text: string };

function Parse_Place(item: unknown, index: number): FoundPlace {
  if (typeof item !== 'object' || item === null) throw parseError(`place ${index}`);
  const place = item as Record<string, unknown>;

  if (typeof place.display_name !== 'string') throw parseError(`place ${index} display_name`);
  if (typeof place.lat !== 'string' || typeof place.lon !== 'string') throw parseError(`place ${index} lat/lon`);

  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) throw parseError(`place ${index} lat/lon`);

  const placeName = place.display_name.split(',')[0].trim();
  const fields = typeof place.address === 'object' && place.address !== null
    ? (place.address as Record<string, unknown>)
    : {};

  return {
    placeName,
    details: Parse_AddressDetails(placeName, fields),
    country: firstText(fields, ['country']),
    countryCode: firstText(fields, ['country_code']),
    latitude,
    longitude,
  };
}

// ---- How much of the address do we show? ----
// maps.co's `address` has the same named levels for every place (we never read display_name's parts,
// because they include postcodes like "125 31", and nobody wants those):
//
//   level 1  suburb   `suburb`                                     Östberga
//   level 2  town     `city` / `town` / `village` / `municipality` Stockholm
//   level 3  region   `state` / `county`                           Stockholm County, Texas
//   +        country  `country` — only for places ABROAD           United States
//
// We show as LITTLE as possible: the place + the town it's in ("Östbergahöjden, Stockholm").
// If the place IS the town, the region instead ("Stockholm, Stockholm County", "Paris, Texas").
// More levels are only added when two results would otherwise look the same (Calc_ShortNames).
function Parse_AddressDetails(placeName: string, fields: Record<string, unknown>): AddressPart[] {
  const suburb = firstText(fields, ['suburb']);
  const town = firstText(fields, ['city', 'town', 'village', 'municipality']);
  const region = firstText(fields, ['state', 'county']);

  // The order we ADD levels in: town first, then suburb, then region.
  // If the place is itself the town, a suburb inside it means nothing ("Stockholm, Norrmalm"), so skip both.
  const placeIsTown = town === placeName;
  const order: (AddressPart | null)[] = placeIsTown
    ? [part(3, region)]
    : [part(2, town), part(1, suburb), part(3, region)];

  // Drop missing levels, and levels that just repeat the place name ("Paris, Paris").
  return order.filter((detail): detail is AddressPart => detail !== null && detail.text !== placeName);
}

function part(level: number, text: string | null): AddressPart | null {
  return text === null ? null : { level, text };
}

// ---- Calc_ShortNames ----
// Everyone starts with ONE detail. While two results have the same name, both get one more detail.
//   "Årsta, Stockholm" / "Årsta, Uppsala"                    → already different, done
//   two "Östbergahöjden, Stockholm"                          → "Östbergahöjden, Östberga, Stockholm" / "…, Älvsjö, Stockholm"
function Calc_ShortNames(places: FoundPlace[], homeCountryCode: string | null): Place[] {
  const detailCounts = places.map(() => 1);

  for (let round = 0; round < 3; round++) {
    const names = places.map((place, i) => Format_PlaceName(place, detailCounts[i], homeCountryCode));
    let anyGrew = false;
    places.forEach((place, i) => {
      const isClash = names.filter((name) => name === names[i]).length > 1;
      if (isClash && detailCounts[i] < place.details.length) {
        detailCounts[i]++;
        anyGrew = true;
      }
    });
    if (!anyGrew) break;
  }

  return places.map((place, i) => ({
    name: Format_PlaceName(place, detailCounts[i], homeCountryCode),
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

// The place name + its first `count` details, printed small → big: "Östbergahöjden, Östberga, Stockholm".
// The country is added at the end when the place is abroad ("Birmingham, Alabama, United States"),
// or when we don't know the phone's country (then we can't tell what "abroad" is, so we always show it).
function Format_PlaceName(place: FoundPlace, count: number, homeCountryCode: string | null): string {
  const shown = place.details.slice(0, count).sort((a, b) => a.level - b.level);
  const parts = [place.placeName, ...shown.map((detail) => detail.text)];

  const isAbroad = homeCountryCode === null || place.countryCode !== homeCountryCode;
  if (isAbroad && place.country !== null && place.country !== parts[parts.length - 1]) parts.push(place.country);

  return parts.join(', ');
}

// The first of these fields that holds some text, or null if none does.
function firstText(fields: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return null;
}

// maps.co often returns the same city twice (once as a city, once as its municipality, a few km apart).
// Two results closer than ~10 km are the same city, so we keep only the first one.
// (Not by name: "Birmingham, Alabama" and "Birmingham, Michigan" are different cities.)
function Calc_RemoveDuplicates(places: FoundPlace[]): FoundPlace[] {
  const kept: FoundPlace[] = [];
  for (const place of places) {
    if (!kept.some((keptPlace) => isSameCity(keptPlace, place))) kept.push(place);
  }
  return kept;
}

// Closer than 0.1° in both latitude and longitude (0.1° latitude ≈ 11 km) counts as the same city.
const SAME_CITY_DEGREES = 0.1;

function isSameCity(a: Coordinates, b: Coordinates): boolean {
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
// Matches are named with the SAME rule as maps.co results (Format_PlaceName): the city IS the town,
// so it shows its region, plus the country if it's abroad. "Reykjavík, Iceland" from Sweden.
export function Calc_LocalMatches(query: string, cities: QuickPickCity[], homeCountryCode: string | null): Place[] {
  const typed = toSearchKey(query.trim());
  if (typed === '') return [];

  return cities
    .filter((city) => toSearchKey(city.name).startsWith(typed))
    .map((city) => {
      const asFound: FoundPlace = {
        placeName: city.name,
        details: city.region === null ? [] : [{ level: 3, text: city.region }],
        country: city.country,
        countryCode: city.countryCode,
        latitude: city.latitude,
        longitude: city.longitude,
      };
      return { name: Format_PlaceName(asFound, 1, homeCountryCode), latitude: city.latitude, longitude: city.longitude };
    });
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

// ---- Calc_SortByDistance (W-21) ----
// Closest place first, when we know where the phone is. "Årsta" → Årsta, Stockholm before Årsta, Uppsala.
// Without a location (no permission) the list keeps maps.co's order.
// Returns a NEW list: .sort() changes the list it's called on, so we copy it first with [...places].
export function Calc_SortByDistance(places: Place[], from: Coordinates | null): Place[] {
  if (from === null) return places;
  return [...places].sort((a, b) => Calc_DistanceKm(from, a) - Calc_DistanceKm(from, b));
}

// Distance along the Earth's surface (the "haversine" formula), in km.
// A flat-map distance would be wrong this far north: one degree of longitude is only ~55 km in Stockholm.
const EARTH_RADIUS_KM = 6371;

export function Calc_DistanceKm(a: Coordinates, b: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeChange = toRadians(b.latitude - a.latitude);
  const longitudeChange = toRadians(b.longitude - a.longitude);

  const h = Math.sin(latitudeChange / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(longitudeChange / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
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
