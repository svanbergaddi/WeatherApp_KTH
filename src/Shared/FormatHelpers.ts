import { AppError, Outfit, WindWarning } from '@/Shared/Types';

// All Format_ functions: model → the exact text on screen. Pure, so they're easy to test,
// and the screens stay simple (they only place the text, they never build it).

// ---- Format_Temperature: 3.6 → "4°" ----
// Whole degrees: nobody feels the difference between 3.6 and 4. −0.4 rounds to −0, shown as "0°".
export function Format_Temperature(celsius: number): string {
  const rounded = Math.round(celsius);
  return `${rounded === 0 ? 0 : rounded}°`;
}

// ---- Format_Time: "2026-11-18T14:00" → "14:00" ----
// The time is already the city's local time (timezone=auto), so we only cut it out of the text.
// No new Date(): that would move it into the phone's time zone (see Calc_GroupByDay).
export function Format_Time(localDateTime: string): string {
  return localDateTime.slice(11, 16);
}

// ---- Format_DayName: "2026-11-19" → "Thu 19", or "Today" ----
// The weekday comes from the date alone, calculated in UTC, so the phone's time zone can't shift it.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Format_DayName(date: string, todayDate: string): string {
  if (date === todayDate) return 'Today';
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]} ${day}`;
}

// ---- Format_Weather: WMO weather code → icon + words (W-06) ----
// Open-Meteo sends a number (WMO code) for the weather. This table turns it into something people read.
// Clear and mainly clear get a moon at night.
type WeatherText = { icon: string; label: string };

const WEATHER_CODES: Record<number, WeatherText> = {
  0: { icon: '☀️', label: 'Clear' },
  1: { icon: '🌤️', label: 'Mainly clear' },
  2: { icon: '⛅', label: 'Partly cloudy' },
  3: { icon: '☁️', label: 'Overcast' },
  45: { icon: '🌫️', label: 'Fog' },
  48: { icon: '🌫️', label: 'Freezing fog' },
  51: { icon: '🌦️', label: 'Light drizzle' },
  53: { icon: '🌦️', label: 'Drizzle' },
  55: { icon: '🌧️', label: 'Heavy drizzle' },
  56: { icon: '🌧️', label: 'Freezing drizzle' },
  57: { icon: '🌧️', label: 'Freezing drizzle' },
  61: { icon: '🌦️', label: 'Light rain' },
  63: { icon: '🌧️', label: 'Rain' },
  65: { icon: '🌧️', label: 'Heavy rain' },
  66: { icon: '🌧️', label: 'Freezing rain' },
  67: { icon: '🌧️', label: 'Freezing rain' },
  71: { icon: '🌨️', label: 'Light snow' },
  73: { icon: '🌨️', label: 'Snow' },
  75: { icon: '❄️', label: 'Heavy snow' },
  77: { icon: '🌨️', label: 'Snow grains' },
  80: { icon: '🌦️', label: 'Rain showers' },
  81: { icon: '🌧️', label: 'Rain showers' },
  82: { icon: '🌧️', label: 'Heavy rain showers' },
  85: { icon: '🌨️', label: 'Snow showers' },
  86: { icon: '❄️', label: 'Heavy snow showers' },
  95: { icon: '⛈️', label: 'Thunderstorm' },
  96: { icon: '⛈️', label: 'Thunderstorm with hail' },
  99: { icon: '⛈️', label: 'Thunderstorm with hail' },
};

export function Format_Weather(weatherCode: number, isDay: boolean = true): WeatherText {
  const weather = WEATHER_CODES[weatherCode] ?? { icon: '❔', label: 'Unknown' };
  if (!isDay && (weatherCode === 0 || weatherCode === 1)) return { icon: '🌙', label: weather.label };
  return weather;
}

// ---- Format_Outfit: Outfit → "Winter jacket + hat + gloves" (W-24) ----
const LAYER_TEXT: Record<Outfit['layer'], string> = {
  tShirt: 'T-shirt',
  lightJacket: 'Light jacket',
  jacket: 'Jacket',
  winterJacket: 'Winter jacket',
};

export function Format_Outfit(outfit: Outfit): string {
  const parts = [LAYER_TEXT[outfit.layer]];
  if (outfit.hat) parts.push('hat');
  if (outfit.gloves) parts.push('gloves');
  if (outfit.rainGear === 'umbrella') parts.push('umbrella');
  if (outfit.rainGear === 'rainJacket') parts.push('rain jacket (too windy for an umbrella)');
  return parts.join(' + ');
}

// ---- Format_WindWarning: → "Strong gusts up to 18 m/s", or null when there's nothing to warn about (W-23) ----
export function Format_WindWarning(warning: WindWarning, gustsMs: number): string | null {
  if (warning === 'none') return null;
  const strength = warning === 'storm' ? 'Storm' : 'Strong';
  return `${strength} gusts up to ${Math.round(gustsMs)} m/s`;
}

// ---- Format_DaylightChange: −6 → "6 min less daylight than yesterday" (W-26) ----
export function Format_DaylightChange(minutes: number): string {
  if (minutes === 0) return 'Same daylight as yesterday';
  const word = minutes > 0 ? 'more' : 'less';
  return `${Math.abs(minutes)} min ${word} daylight than yesterday`;
}

// ---- Format_LastUpdated: ISO time → "Last updated 14:05" (W-09) ----
// savedAt is a real moment (ISO, UTC), so here new Date() is RIGHT: we want the phone's own clock time.
export function Format_LastUpdated(savedAtIso: string): string {
  const saved = new Date(savedAtIso);
  const hours = String(saved.getHours()).padStart(2, '0');
  const minutes = String(saved.getMinutes()).padStart(2, '0');
  return `Last updated ${hours}:${minutes}`;
}

// ---- Format_ErrorMessage (W-15) ----
// Turns any error into one short sentence for the user.
// Every AppError kind gets its own message, so the user knows if it's their connection, the server, or their input.
export function Format_ErrorMessage(error: unknown): string {
  if (!(error instanceof AppError)) return 'Something went wrong. Please try again.';

  switch (error.kind) {
    case 'network':
      return 'No internet connection.';
    case 'timeout':
      return 'The weather service is slow right now. Please try again.';
    case 'http':
      if (error.status === 429) return 'Too many requests. Wait a second and try again.';
      return `The weather service had a problem (error ${error.status}).`;
    case 'parse':
      return "Couldn't read the weather data.";
    case 'notFound':
      return 'No place found with that name.';
    case 'invalidInput':
      return error.message; // Validate_ functions already write a message meant for the user
    case 'cancelled':
      return ''; // never shown: a newer request replaced this one
  }
}
