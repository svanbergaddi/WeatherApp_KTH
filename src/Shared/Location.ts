import * as Location from 'expo-location';
import { PhoneLocation } from '@/Shared/Types';

const MAX_AGE_MS = 10 * 60 * 1000; // a position from the last 10 minutes is good enough

// ---- Device_GetLocation ----
// Asks the phone where we are, and which country that is. Used to sort search results by distance
// and to show the country only for places abroad (W-21), and later for the night theme (W-27).
// Returns null if the user said no or the phone can't tell: location is a bonus, so it must never break the app.
export async function Device_GetLocation(): Promise<PhoneLocation | null> {
  try {
    // Asks the user the first time only. After that the phone remembers the answer.
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;

    // The last known position is instant. Only if there is none (or it's old) do we ask for a new one,
    // with low accuracy: knowing the city is enough, and it saves battery.
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: MAX_AGE_MS });
    const position = lastKnown ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const { latitude, longitude } = position.coords;

    return { latitude, longitude, countryCode: await Device_GetCountryCode(latitude, longitude) };
  } catch (error) {
    console.warn('Device_GetLocation failed', error);
    return null;
  }
}

// Which country these coordinates are in, using the phone's own map service (no maps.co call).
// Lowercase ("se") to match maps.co's country_code. null if it can't tell (e.g. offline).
async function Device_GetCountryCode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address?.isoCountryCode?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}
