import { Place } from '@/Shared/Types';

// A quick-pick city: a Place, plus the address parts we need to name it like a maps.co result.
export type QuickPickCity = Place & {
  region: string | null; // null when maps.co has none (Icelandic towns)
  country: string;
  countryCode: string; // lowercase, like maps.co's country_code
};

// Cities shown on the empty home screen (W-22), and matched first while typing (W-21).
// Coordinates are written here, so tapping one needs no maps.co call: it's instant and saves our rate limit.
// Region and country are copied from maps.co's English answer, so names follow the same rule
// as search results: "Stockholm, Stockholm County" at home, "Reykjavík, Iceland" from Sweden.
export const QUICK_PICK_CITIES: QuickPickCity[] = [
  { name: 'Stockholm', latitude: 59.3293, longitude: 18.0686, region: 'Stockholm County', country: 'Sweden', countryCode: 'se' },
  { name: 'Gothenburg', latitude: 57.7089, longitude: 11.9746, region: 'Västra Götaland County', country: 'Sweden', countryCode: 'se' },
  { name: 'Malmö', latitude: 55.605, longitude: 13.0038, region: 'Skåne County', country: 'Sweden', countryCode: 'se' },
  { name: 'Copenhagen', latitude: 55.6761, longitude: 12.5683, region: 'Capital Region of Denmark', country: 'Denmark', countryCode: 'dk' },
  { name: 'Reykjavík', latitude: 64.1466, longitude: -21.9426, region: null, country: 'Iceland', countryCode: 'is' },
  { name: 'Hafnarfjörður', latitude: 64.0671, longitude: -21.9377, region: null, country: 'Iceland', countryCode: 'is' },
  { name: 'Akureyri', latitude: 65.6885, longitude: -18.1262, region: null, country: 'Iceland', countryCode: 'is' },
];
