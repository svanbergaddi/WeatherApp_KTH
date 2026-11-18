import { Parse_Places, Validate_Coordinates } from '@/Search/SearchHelpers';
import { AppError } from '@/Shared/Types';
import reykjavik from './fixtures/mapsco-reykjavik.json';

// Runs a function and returns the AppError it throws (or fails the test if it doesn't throw).
function errorFrom(run: () => unknown): AppError {
  try {
    run();
  } catch (error) {
    return error as AppError;
  }
  throw new Error('Expected an error, but nothing was thrown.');
}

// A small fake maps.co place with only the fields we read.
function fakePlace(displayName: string, lat: string, lon: string) {
  return { display_name: displayName, lat, lon };
}

describe('Parse_Places', () => {
  test('valid: the real response gives Reykjavík with number coordinates', () => {
    expect(Parse_Places(reykjavik)).toEqual([
      { name: 'Reykjavíkurborg, Ísland', latitude: 64.145981, longitude: -21.9422367 },
    ]);
  });

  test('lat/lon as strings become numbers', () => {
    const [place] = Parse_Places([fakePlace('Akureyri, Ísland', '65.68', '-18.09')]);
    expect(typeof place.latitude).toBe('number');
    expect(place.longitude).toBe(-18.09);
  });

  test('empty list: no places, no error', () => {
    expect(Parse_Places([])).toEqual([]);
  });

  test('a name without commas is kept as it is', () => {
    expect(Parse_Places([fakePlace('Ísland', '65', '-18')])[0].name).toBe('Ísland');
  });

  test('the same place twice is shown once', () => {
    const places = Parse_Places([
      fakePlace('Malmö, Skåne, Sverige', '55.60', '13.00'),
      fakePlace('Malmö, Malmö kommun, Sverige', '55.61', '13.01'),
    ]);
    expect(places).toHaveLength(1);
    expect(places[0].latitude).toBe(55.6);
  });

  test('broken response gives a parse error', () => {
    expect(errorFrom(() => Parse_Places({ error: 'oops' })).kind).toBe('parse');
    expect(errorFrom(() => Parse_Places([fakePlace('X', 'abc', '1')])).kind).toBe('parse');
    expect(errorFrom(() => Parse_Places([{ display_name: 'X', lat: 1, lon: 2 }])).kind).toBe('parse');
    expect(errorFrom(() => Parse_Places([null])).kind).toBe('parse');
  });
});

describe('Validate_Coordinates', () => {
  test('valid numbers', () => {
    expect(Validate_Coordinates('59.33', '18.06')).toEqual({ latitude: 59.33, longitude: 18.06 });
    expect(Validate_Coordinates(' -21.94 ', '64')).toEqual({ latitude: -21.94, longitude: 64 });
  });

  test('59,33 with a comma is read as 59.33', () => {
    expect(Validate_Coordinates('59,33', '18,06')).toEqual({ latitude: 59.33, longitude: 18.06 });
  });

  test('out of range', () => {
    expect(errorFrom(() => Validate_Coordinates('91', '0')).message).toContain('Latitude');
    expect(errorFrom(() => Validate_Coordinates('0', '-180.5')).message).toContain('Longitude');
  });

  test('exactly at the edge is allowed', () => {
    expect(Validate_Coordinates('90', '-180')).toEqual({ latitude: 90, longitude: -180 });
  });

  test('letters, empty and tricky text are rejected', () => {
    for (const bad of ['abc', '', '   ', '59.3.3', '1e2', '0x10', '59,33,1']) {
      expect(errorFrom(() => Validate_Coordinates(bad, '18')).kind).toBe('invalidInput');
    }
  });
});
