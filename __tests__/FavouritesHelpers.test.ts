import { Calc_IsFavourite, Calc_IsSamePlace, Calc_ToggleFavourite } from '@/Favourites/FavouritesHelpers';

const stockholm = { name: 'Stockholm', latitude: 59.3293, longitude: 18.0686 };
const stockholmFromSearch = { name: 'Stockholm, Stockholm County', latitude: 59.3251, longitude: 18.0711 }; // ~0.5 km away
const arsta = { name: 'Årsta, Stockholm', latitude: 59.2988, longitude: 18.0448 }; // ~3.5 km from Stockholm
const reykjavik = { name: 'Reykjavík', latitude: 64.1466, longitude: -21.9426 };

describe('Calc_IsSamePlace', () => {
  test('quick pick and search result for the same city are the same place', () => {
    expect(Calc_IsSamePlace(stockholm, stockholmFromSearch)).toBe(true);
  });

  test('a suburb 3 km away is a different place (so you can save both)', () => {
    expect(Calc_IsSamePlace(stockholm, arsta)).toBe(false);
  });
});

describe('Calc_ToggleFavourite', () => {
  test('adds a new place at the end', () => {
    expect(Calc_ToggleFavourite([stockholm], reykjavik)).toEqual([stockholm, reykjavik]);
  });

  test('removes a place that is already there', () => {
    expect(Calc_ToggleFavourite([stockholm, reykjavik], reykjavik)).toEqual([stockholm]);
  });

  test('the same city from a search removes the saved quick pick (no duplicates)', () => {
    expect(Calc_ToggleFavourite([stockholm, reykjavik], stockholmFromSearch)).toEqual([reykjavik]);
  });

  test('toggling twice gives the original list back', () => {
    const list = [stockholm];
    expect(Calc_ToggleFavourite(Calc_ToggleFavourite(list, arsta), arsta)).toEqual(list);
  });

  test('does not change the list it was given', () => {
    const list = [stockholm];
    Calc_ToggleFavourite(list, reykjavik);
    expect(list).toEqual([stockholm]);
  });
});

describe('Calc_IsFavourite', () => {
  test('true for a saved place, false otherwise, false for an empty list', () => {
    expect(Calc_IsFavourite([stockholm], stockholmFromSearch)).toBe(true);
    expect(Calc_IsFavourite([stockholm], reykjavik)).toBe(false);
    expect(Calc_IsFavourite([], stockholm)).toBe(false);
  });
});
