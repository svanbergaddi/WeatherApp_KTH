import { Place } from '@/Shared/Types';

// Cities shown on the empty home screen (W-22).
// Coordinates are written here, so tapping one needs no maps.co call: it's instant and saves our rate limit.
export const QUICK_PICK_CITIES: Place[] = [
  { name: 'Stockholm', latitude: 59.3293, longitude: 18.0686 },
  { name: 'Gothenburg', latitude: 57.7089, longitude: 11.9746 },
  { name: 'Malmö', latitude: 55.605, longitude: 13.0038 },
  { name: 'Copenhagen', latitude: 55.6761, longitude: 12.5683 },
  { name: 'Reykjavík', latitude: 64.1466, longitude: -21.9426 },
  { name: 'Hafnarfjörður', latitude: 64.0671, longitude: -21.9377 },
  { name: 'Akureyri', latitude: 65.6885, longitude: -18.1262 },
];
