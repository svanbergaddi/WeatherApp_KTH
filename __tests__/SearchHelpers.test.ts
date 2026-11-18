import { QUICK_PICK_CITIES } from '@/Search/QuickPickCities';
import {
  Calc_DistanceKm, Calc_LocalMatches, Calc_MergeSuggestions, Calc_SortByDistance, Parse_Places, Validate_Coordinates,
} from '@/Search/SearchHelpers';
import arsta from './fixtures/mapsco-arsta.json';
import { AppError } from '@/Shared/Types';
import alvsjo from './fixtures/mapsco-alvsjo.json';
import birmingham from './fixtures/mapsco-birmingham.json';
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
function fakePlace(displayName: string, lat: string, lon: string, address?: Record<string, string>) {
  return { display_name: displayName, lat, lon, address };
}

describe('Parse_Places', () => {
  test('valid: the real response gives Reykjavik (in English) with number coordinates', () => {
    const [place] = Parse_Places(reykjavik, 'se');
    expect(place.name).toBe('Reykjavik, Iceland');
    expect(place.latitude).toBeCloseTo(64.15, 1);
    expect(place.longitude).toBeCloseTo(-21.94, 1);
  });

  test('real response, phone in Sweden: places abroad show region + country (all 6 Birminghams kept)', () => {
    expect(Parse_Places(birmingham, 'se').map((place) => place.name)).toEqual([
      'Birmingham, England, United Kingdom',
      'Birmingham, Alabama, United States',
      'Birmingham, Michigan, United States',
      'Birmingham, Iowa, United States',
      'Birmingham, Missouri, United States',
      'Birmingham, Pennsylvania, United States',
    ]);
  });

  test('real response, phone in the US: US places drop the country, the UK one keeps it', () => {
    const names = Parse_Places(birmingham, 'us').map((place) => place.name);
    expect(names[0]).toBe('Birmingham, England, United Kingdom');
    expect(names[1]).toBe('Birmingham, Alabama');
  });

  test('real response, phone in Sweden: a place inside a town shows the town, no country, never a postcode', () => {
    expect(Parse_Places(alvsjo, 'se').map((place) => place.name)).toEqual([
      'Älvsjö, Stockholm',
      'Älvsjö, Norrtälje kommun',
      'Älvsjö, Stenberga',
      'Älvsjö, Flens kommun',
    ]);
  });

  test('no location (we don\'t know the home country): the country is always shown', () => {
    expect(Parse_Places(alvsjo, null)[0].name).toBe('Älvsjö, Stockholm, Sweden');
  });

  test('same name in the same town: one more level (the suburb) is added to tell them apart', () => {
    const places = Parse_Places([
      fakePlace('Östbergahöjden, …', '59.28', '18.04', { suburb: 'Östberga', city: 'Stockholm', county: 'Stockholms län' }),
      fakePlace('Östbergahöjden, …', '59.45', '18.04', { suburb: 'Älvsjö', city: 'Stockholm', county: 'Stockholms län' }),
      fakePlace('Årsta, …', '59.80', '17.60', { suburb: 'Årsta', city: 'Stockholm', county: 'Stockholms län' }),
    ]);
    expect(places.map((place) => place.name)).toEqual([
      'Östbergahöjden, Östberga, Stockholm', // printed small → big, even though the suburb was added last
      'Östbergahöjden, Älvsjö, Stockholm',
      'Årsta, Stockholm', // no clash, so it stays short (and the suburb "Årsta" = the place is never shown)
    ]);
  });

  test('a city that IS the town never shows a suburb inside it', () => {
    const [place] = Parse_Places([
      fakePlace('Stockholm, …', '59.33', '18.07', { suburb: 'Norrmalm', city: 'Stockholm', county: 'Stockholms län' }),
    ]);
    expect(place.name).toBe('Stockholm, Stockholms län');
  });

  test('no address object: just the place name', () => {
    expect(Parse_Places([fakePlace('Akureyri, 600, Ísland', '65.68', '-18.09')])[0].name).toBe('Akureyri');
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

  test('same name but far apart: both are kept', () => {
    const places = Parse_Places([
      fakePlace('Paris, …', '48.85', '2.35', { city: 'Paris', state: 'Île-de-France', country: 'France' }),
      fakePlace('Paris, …', '33.66', '-95.55', { city: 'Paris', county: 'Lamar County', state: 'Texas', country: 'United States' }),
    ]);
    expect(places.map((place) => place.name)).toEqual(['Paris, Île-de-France, France', 'Paris, Texas, United States']);
  });

  test('the same place twice (a few km apart) is shown once', () => {
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

describe('Calc_LocalMatches', () => {
  // Phone in Sweden unless a test says otherwise.
  const names = (query: string, home: string | null = 'se') =>
    Calc_LocalMatches(query, QUICK_PICK_CITIES, home).map((city) => city.name);

  test('cities that start with the typed letters', () => {
    expect(names('Ha')).toEqual(['Hafnarfjörður, Iceland']);
    expect(names('Co')).toEqual(['Copenhagen, Capital Region of Denmark, Denmark']);
  });

  test('ignores case and accents: half words and plain letters work', () => {
    expect(names('reykjav')).toEqual(['Reykjavík, Iceland']);
    expect(names('malmo')).toEqual(['Malmö, Skåne County']);
    expect(names('HAFNARFJORDUR')).toEqual(['Hafnarfjörður, Iceland']);
  });

  test('named with the same rule as maps.co results: region at home, + country abroad', () => {
    expect(names('Stockholm', 'se')).toEqual(['Stockholm, Stockholm County']);
    expect(names('Stockholm', 'is')).toEqual(['Stockholm, Stockholm County, Sweden']);
    expect(names('Reykjavík', 'is')).toEqual(['Reykjavík']); // at home, and Icelandic towns have no region
    expect(names('Stockholm', null)).toEqual(['Stockholm, Stockholm County, Sweden']); // home unknown: always the country
  });

  test('only the start of the name counts', () => {
    expect(names('holm')).toEqual([]); // inside "Stockholm", not at the start
  });

  test('no match and empty text give no cities', () => {
    expect(names('xq')).toEqual([]);
    expect(names('   ')).toEqual([]);
  });
});

describe('Calc_MergeSuggestions', () => {
  const malmoLocal = { name: 'Malmö', latitude: 55.605, longitude: 13.0038 };

  test('our own matches come first, then maps.co results', () => {
    const london = { name: 'London, United Kingdom', latitude: 51.5, longitude: -0.12 };
    expect(Calc_MergeSuggestions([malmoLocal], [london])).toEqual([malmoLocal, london]);
  });

  test('a maps.co place within ~10 km of our city is the same city, so it is left out', () => {
    const malmoRemote = { name: 'Malmö, Sverige', latitude: 55.6052931, longitude: 13.0001566 };
    const malmoMunicipality = { name: 'Malmö kommun, Sverige', latitude: 55.5836011, longitude: 13.0027658 };
    expect(Calc_MergeSuggestions([malmoLocal], [malmoRemote, malmoMunicipality])).toEqual([malmoLocal]);
  });

  test('no local matches: only maps.co results', () => {
    const akron = { name: 'Akron, United States', latitude: 41.08, longitude: -81.52 };
    expect(Calc_MergeSuggestions([], [akron])).toEqual([akron]);
  });
});

describe('Calc_DistanceKm', () => {
  test('Stockholm to Gothenburg is about 400 km', () => {
    const stockholm = { latitude: 59.3293, longitude: 18.0686 };
    const gothenburg = { latitude: 57.7089, longitude: 11.9746 };
    expect(Calc_DistanceKm(stockholm, gothenburg)).toBeGreaterThan(390);
    expect(Calc_DistanceKm(stockholm, gothenburg)).toBeLessThan(405);
  });

  test('the same point is 0 km', () => {
    expect(Calc_DistanceKm({ latitude: 64.15, longitude: -21.94 }, { latitude: 64.15, longitude: -21.94 })).toBe(0);
  });
});

describe('Calc_SortByDistance', () => {
  const uppsala = { latitude: 59.8586, longitude: 17.6389 };
  const stockholm = { latitude: 59.3293, longitude: 18.0686 };

  test('real "Årsta" search: the closest Årsta comes first', () => {
    const places = Parse_Places(arsta, 'se');
    expect(Calc_SortByDistance(places, uppsala)[0].name).toBe('Årsta, Uppsala');
    expect(Calc_SortByDistance(places, stockholm)[0].name).toBe('Årsta, Stockholm');
  });

  test('no location (no permission): the order stays as maps.co sent it', () => {
    const places = Parse_Places(arsta, 'se');
    expect(Calc_SortByDistance(places, null)).toEqual(places);
  });

  test('does not change the list it was given', () => {
    const places = Parse_Places(arsta, 'se');
    const copyBefore = [...places];
    Calc_SortByDistance(places, uppsala);
    expect(places).toEqual(copyBefore);
  });
});
