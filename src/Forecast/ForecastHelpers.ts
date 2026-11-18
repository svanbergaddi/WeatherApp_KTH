import { AppError, CurrentWeather, DailySummary, Forecast, HourlyPoint, Outfit, WindWarning } from '@/Shared/Types';

// A JSON object we have checked is an object, but whose fields we have not checked yet.
type JsonObject = Record<string, unknown>;

// ---- Parse_Forecast (W-05, W-11) ----
// Translates Open-Meteo's JSON into our own Forecast model.
// This is the ONLY place in the app that knows Open-Meteo's field names.
// If anything looks wrong, it throws AppError('parse') instead of returning half-broken data.
export function Parse_Forecast(json: unknown): Forecast {
  const root = readObject(json, 'response');

  return {
    timezone: readString(root.timezone, 'timezone'),
    current: Parse_Current(readObject(root.current, 'current')),
    hourly: Parse_Hourly(readObject(root.hourly, 'hourly')),
    daily: Parse_Daily(readObject(root.daily, 'daily')),
  };
}

// `current` is already one object, so we only rename the fields (and turn is_day 0/1 into a boolean).
function Parse_Current(current: JsonObject): CurrentWeather {
  return {
    time: readString(current.time, 'current.time'),
    temperatureC: readNumber(current.temperature_2m, 'current.temperature_2m'),
    feelsLikeC: readNumber(current.apparent_temperature, 'current.apparent_temperature'),
    weatherCode: readNumber(current.weather_code, 'current.weather_code'),
    windSpeedMs: readNumber(current.wind_speed_10m, 'current.wind_speed_10m'),
    windGustsMs: readNumber(current.wind_gusts_10m, 'current.wind_gusts_10m'),
    humidityPercent: readNumber(current.relative_humidity_2m, 'current.relative_humidity_2m'),
    precipitationMm: readNumber(current.precipitation, 'current.precipitation'),
    isDay: readNumber(current.is_day, 'current.is_day') === 1,
  };
}

// Open-Meteo sends COLUMNS (one array per field). We turn them into ROWS (one object per hour).
// Position i in every array belongs to the same hour, so every array must be as long as `time`.
function Parse_Hourly(hourly: JsonObject): HourlyPoint[] {
  const times = readStringArray(hourly.time, 'hourly.time');
  const count = times.length;

  const temperature = readNumberArray(hourly.temperature_2m, 'hourly.temperature_2m', count);
  const feelsLike = readNumberArray(hourly.apparent_temperature, 'hourly.apparent_temperature', count);
  const weatherCode = readNumberArray(hourly.weather_code, 'hourly.weather_code', count);
  const precipitation = readNumberArray(hourly.precipitation, 'hourly.precipitation', count);
  const precipitationChance = readNumberArray(hourly.precipitation_probability, 'hourly.precipitation_probability', count);
  const windSpeed = readNumberArray(hourly.wind_speed_10m, 'hourly.wind_speed_10m', count);
  const windGusts = readNumberArray(hourly.wind_gusts_10m, 'hourly.wind_gusts_10m', count);

  return times.map((time, i) => ({
    time,
    temperatureC: temperature[i],
    feelsLikeC: feelsLike[i],
    weatherCode: weatherCode[i],
    precipitationMm: precipitation[i],
    precipitationChancePercent: precipitationChance[i],
    windSpeedMs: windSpeed[i],
    windGustsMs: windGusts[i],
  }));
}

// Same columns-to-rows idea as Parse_Hourly, one row per day. daily[0] is yesterday (past_days=1).
function Parse_Daily(daily: JsonObject): DailySummary[] {
  const dates = readStringArray(daily.time, 'daily.time');
  const count = dates.length;

  const min = readNumberArray(daily.temperature_2m_min, 'daily.temperature_2m_min', count);
  const max = readNumberArray(daily.temperature_2m_max, 'daily.temperature_2m_max', count);
  const feelsLikeMin = readNumberArray(daily.apparent_temperature_min, 'daily.apparent_temperature_min', count);
  const weatherCode = readNumberArray(daily.weather_code, 'daily.weather_code', count);
  const precipitation = readNumberArray(daily.precipitation_sum, 'daily.precipitation_sum', count);
  const windMax = readNumberArray(daily.wind_speed_10m_max, 'daily.wind_speed_10m_max', count);
  const windGustsMax = readNumberArray(daily.wind_gusts_10m_max, 'daily.wind_gusts_10m_max', count);
  const sunrise = readStringArray(daily.sunrise, 'daily.sunrise', count);
  const sunset = readStringArray(daily.sunset, 'daily.sunset', count);
  const daylight = readNumberArray(daily.daylight_duration, 'daily.daylight_duration', count);

  return dates.map((date, i) => ({
    date,
    minC: min[i],
    maxC: max[i],
    feelsLikeMinC: feelsLikeMin[i],
    weatherCode: weatherCode[i],
    precipitationMm: precipitation[i],
    windMaxMs: windMax[i],
    windGustsMaxMs: windGustsMax[i],
    sunrise: sunrise[i],
    sunset: sunset[i],
    daylightSeconds: daylight[i],
  }));
}

// ---- Calc_GroupByDay (W-02, W-07) ----
// Puts the hours into one list per day, so a screen can ask for "the hours of 2026-11-17".
// Result: { "2026-11-16": [24 hours], "2026-11-17": [24 hours], ... }
//
// The date is the first 10 characters of the time ("2026-11-17T23:00" → "2026-11-17").
// We deliberately do NOT use new Date(): the times are already the CITY's local time (timezone=auto),
// and new Date() would move them into the PHONE's time zone. Then 23:00 in Reykjavík could
// land on the next day for a phone in Stockholm.
export function Calc_GroupByDay(hourly: HourlyPoint[]): Record<string, HourlyPoint[]> {
  const days: Record<string, HourlyPoint[]> = {};

  for (const hour of hourly) {
    const date = hour.time.slice(0, 10);
    if (days[date] === undefined) days[date] = [];
    days[date].push(hour);
  }

  return days;
}

// ---- Calc_WindWarning (W-23) ----
// Gusts, not the average wind, decide the warning: a gust is what knocks you over or takes your umbrella.
// Limits from the Beaufort scale:
//   14 m/s = Beaufort 7, "near gale": hard to walk against.
//   21 m/s = Beaufort 9, "strong gale": things start to break.
// A gust exactly AT a limit counts as that level (>=).
const STRONG_GUSTS_MS = 14;
const STORM_GUSTS_MS = 21;

export function Calc_WindWarning(gustsMs: number): WindWarning {
  if (gustsMs >= STORM_GUSTS_MS) return 'storm';
  if (gustsMs >= STRONG_GUSTS_MS) return 'strong';
  return 'none';
}

// ---- Calc_WhatToWear (W-24) ----
// Uses the FEELS-LIKE temperature, because Open-Meteo has already counted the wind chill into it.
//   feels-like ≥ 18 °C → t-shirt     10 to 18 → light jacket     0 to 10 → jacket     below 0 → winter jacket
//   hat below 5 °C, gloves below 0 °C
// Rain from 0.5 mm. In strong gusts an umbrella breaks, so we say rain jacket instead (same limit as Calc_WindWarning).
const TSHIRT_FROM_C = 18;
const LIGHT_JACKET_FROM_C = 10;
const JACKET_FROM_C = 0;
const HAT_BELOW_C = 5;
const GLOVES_BELOW_C = 0;
const RAIN_FROM_MM = 0.5;

export function Calc_WhatToWear(feelsLikeC: number, precipitationMm: number, gustsMs: number): Outfit {
  let layer: Outfit['layer'];
  if (feelsLikeC >= TSHIRT_FROM_C) layer = 'tShirt';
  else if (feelsLikeC >= LIGHT_JACKET_FROM_C) layer = 'lightJacket';
  else if (feelsLikeC >= JACKET_FROM_C) layer = 'jacket';
  else layer = 'winterJacket';

  let rainGear: Outfit['rainGear'] = 'none';
  if (precipitationMm >= RAIN_FROM_MM) {
    rainGear = gustsMs >= STRONG_GUSTS_MS ? 'rainJacket' : 'umbrella';
  }

  return {
    layer,
    hat: feelsLikeC < HAT_BELOW_C,
    gloves: feelsLikeC < GLOVES_BELOW_C,
    rainGear,
  };
}

// ---- Calc_DaylightChange (W-26) ----
// How many minutes of daylight today gained (+) or lost (−) compared with yesterday.
// Open-Meteo gives daylight in seconds, so: (today − yesterday) / 60, rounded to whole minutes.
// The screen gets daily[1] (today) and daily[0] (yesterday), which is why we ask for past_days=1.
// Midnight sun and polar night work too: both days are 0 s or 86 400 s, so the change is 0.
export function Calc_DaylightChange(todaySeconds: number, yesterdaySeconds: number): number {
  const minutes = Math.round((todaySeconds - yesterdaySeconds) / 60);
  // Math.round(-0.2) gives -0 in JavaScript, which would show as "−0 min". Turn it into a plain 0.
  return minutes === 0 ? 0 : minutes;
}

// ---- Small checkers ----
// The JSON is `unknown`, so TypeScript won't let us read a field until we have checked its type.
// Each checker either returns the value with a real type, or throws a parse error that names the field.

function parseError(fieldName: string): AppError {
  return new AppError('parse', `Open-Meteo sent a missing or wrong "${fieldName}".`);
}

function readObject(value: unknown, fieldName: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw parseError(fieldName);
  return value as JsonObject;
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') throw parseError(fieldName);
  return value;
}

// null counts as wrong too: we would rather show an error than a wrong number.
function readNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) throw parseError(fieldName);
  return value;
}

// `expectedLength` makes sure every column has one value per row.
function readStringArray(value: unknown, fieldName: string, expectedLength?: number): string[] {
  if (!Array.isArray(value)) throw parseError(fieldName);
  if (expectedLength !== undefined && value.length !== expectedLength) throw parseError(fieldName);
  return value.map((item) => readString(item, fieldName));
}

function readNumberArray(value: unknown, fieldName: string, expectedLength: number): number[] {
  if (!Array.isArray(value) || value.length !== expectedLength) throw parseError(fieldName);
  return value.map((item) => readNumber(item, fieldName));
}
