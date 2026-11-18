import { Coordinates, Place } from '@/Shared/Types';

// ---- Calc_IsSamePlace ----
// Two places are the same favourite if they're closer than ~1 km (0.01° latitude ≈ 1.1 km).
// Not exact equality: "Stockholm" from the quick picks and from a search have slightly different coordinates.
// Not the search's 10 km rule: Årsta and Östberga are 2 km apart, and you should be able to save both.
const SAME_PLACE_DEGREES = 0.01;

export function Calc_IsSamePlace(a: Coordinates, b: Coordinates): boolean {
  return Math.abs(a.latitude - b.latitude) < SAME_PLACE_DEGREES &&
    Math.abs(a.longitude - b.longitude) < SAME_PLACE_DEGREES;
}

// ---- Calc_IsFavourite (W-03) ----
// Is this place already in the list? Decides if the star is filled.
export function Calc_IsFavourite(favourites: Place[], place: Coordinates): boolean {
  return favourites.some((favourite) => Calc_IsSamePlace(favourite, place));
}

// ---- Calc_ToggleFavourite (W-03) ----
// Tapping the star: remove the place if it's there, otherwise add it at the end.
// Returns a NEW list and never changes the old one, so React sees that something changed.
export function Calc_ToggleFavourite(favourites: Place[], place: Place): Place[] {
  if (Calc_IsFavourite(favourites, place)) {
    return favourites.filter((favourite) => !Calc_IsSamePlace(favourite, place));
  }
  return [...favourites, place];
}
