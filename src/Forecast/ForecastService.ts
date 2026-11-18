import { API_FetchJson } from '@/Shared/HttpClient';
import { Storage_Load, Storage_Save } from '@/Shared/Storage';
import { Forecast, Place } from '@/Shared/Types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Only the fields we show are requested. Everything else Open-Meteo offers is ignored (oral Q3).
const CURRENT_FIELDS = [
  'temperature_2m', 'apparent_temperature', 'weather_code', 'wind_speed_10m',
  'wind_gusts_10m', 'relative_humidity_2m', 'precipitation', 'is_day',
];
const HOURLY_FIELDS = [
  'temperature_2m', 'apparent_temperature', 'weather_code', 'precipitation',
  'precipitation_probability', 'wind_speed_10m', 'wind_gusts_10m',
];
const DAILY_FIELDS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_min',
  'precipitation_sum', 'wind_speed_10m_max', 'wind_gusts_10m_max', 'sunrise', 'sunset',
  'daylight_duration',
];

// Gets the raw forecast JSON for one place. Parse it with Parse_Forecast.
// past_days=1 gives us yesterday too, so we can compare daylight (W-26).
export function API_GetForecast(latitude: number, longitude: number, signal?: AbortSignal): Promise<unknown> {
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=${CURRENT_FIELDS.join(',')}` +
    `&hourly=${HOURLY_FIELDS.join(',')}` +
    `&daily=${DAILY_FIELDS.join(',')}` +
    `&timezone=auto&wind_speed_unit=ms&past_days=1&forecast_days=7`;
  return API_FetchJson(url, signal);
}

// ---- Cache: the last forecast we showed, so there is something to show offline (W-09) ----

const CACHE_KEY = 'lastForecast';

export type CachedForecast = {
  place: Place;
  forecast: Forecast;
  savedAt: string; // ISO time, shown as "last updated"
};

export function Storage_SaveForecast(place: Place, forecast: Forecast): Promise<void> {
  const entry: CachedForecast = { place, forecast, savedAt: new Date().toISOString() };
  return Storage_Save(CACHE_KEY, entry);
}

export function Storage_LoadForecast(): Promise<CachedForecast | null> {
  return Storage_Load<CachedForecast>(CACHE_KEY);
}
