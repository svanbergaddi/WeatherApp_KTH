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

// display_name is long: "Reykjavíkurborg, Höfuðborgarsvæðið, Ísland".
// We keep the first part (the place) and the last part (the country): "Reykjavíkurborg, Ísland".
// The country tells apart places with the same name (Paris, France vs Paris, Texas).
function Format_PlaceName(displayName: string): string {
  const parts = displayName.split(',').map((part) => part.trim());
  if (parts.length === 1) return parts[0];
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}

// maps.co often returns the same city twice (once as a city, once as a boundary).
// After shortening, those look identical in the list, so we keep only the first one.
function Calc_RemoveDuplicates(places: Place[]): Place[] {
  const seenNames = new Set<string>();
  return places.filter((place) => {
    if (seenNames.has(place.name)) return false;
    seenNames.add(place.name);
    return true;
  });
}

function parseError(fieldName: string): AppError {
  return new AppError('parse', `maps.co sent a missing or wrong "${fieldName}".`);
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
