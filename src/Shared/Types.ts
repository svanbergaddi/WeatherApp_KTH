// Our own data model. It does not depend on how any API shapes its JSON:
// the Parse_ functions translate API JSON into these types.

export type Place = {
  name: string;
  latitude: number;
  longitude: number;
};

// What the user typed in the coordinate fields, after Validate_Coordinates checked it (W-13).
export type Coordinates = {
  latitude: number;
  longitude: number;
};

// Where the phone is. countryCode is lowercase like maps.co's ("se"), or null if the phone couldn't tell.
export type PhoneLocation = Coordinates & {
  countryCode: string | null;
};

export type CurrentWeather = {
  time: string; // local time, e.g. "2026-11-17T08:15"
  temperatureC: number;
  feelsLikeC: number;
  weatherCode: number; // WMO code, e.g. 3 = overcast
  windSpeedMs: number;
  windGustsMs: number;
  humidityPercent: number;
  precipitationMm: number;
  isDay: boolean;
};

export type HourlyPoint = {
  time: string; // local time, e.g. "2026-11-17T14:00"
  temperatureC: number;
  feelsLikeC: number;
  weatherCode: number;
  precipitationMm: number;
  precipitationChancePercent: number;
  windSpeedMs: number;
  windGustsMs: number;
};

export type DailySummary = {
  date: string; // local date, e.g. "2026-11-17"
  minC: number;
  maxC: number;
  feelsLikeMinC: number;
  weatherCode: number;
  precipitationMm: number;
  windMaxMs: number;
  windGustsMaxMs: number;
  sunrise: string; // local time
  sunset: string; // local time
  daylightSeconds: number;
};

export type Forecast = {
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyPoint[]; // includes yesterday (past_days=1)
  daily: DailySummary[]; // daily[0] is yesterday, daily[1] is today
};

// The user's choices on the Settings screen, saved on the phone.
export type Settings = {
  refreshMinutes: 0 | 15 | 30 | 60; // W-04: how often the forecast updates by itself. 0 = never.
  themeChoice: 'auto' | 'light' | 'night'; // W-29: auto = Nordic night after sunset (W-27)
};

// Two cities side by side (W-25). Every difference is RIGHT minus LEFT, so +3 means the right city has 3 more.
export type CityComparison = {
  temperatureDiffC: number; // now
  feelsLikeDiffC: number; // now
  gustsDiffMs: number; // now
  rainTodayDiffMm: number; // today's total
  daylightTodayDiffMinutes: number; // today
};

// How worried the user should be about the wind gusts (W-23). The screen turns it into text and colour.
export type WindWarning = 'none' | 'strong' | 'storm';

// What to wear (W-24). The screen turns it into one line, e.g. "Winter jacket + hat + gloves".
export type Outfit = {
  layer: 'tShirt' | 'lightJacket' | 'jacket' | 'winterJacket';
  hat: boolean;
  gloves: boolean;
  rainGear: 'none' | 'umbrella' | 'rainJacket';
};

// Every expected failure in the app is one of these kinds.
// The screens turn the kind into a message for the user.
export type AppErrorKind =
  | 'network' // no connection, or the server could not be reached
  | 'timeout' // the server took too long
  | 'cancelled' // we aborted the request ourselves (a newer search started)
  | 'http' // the server answered with an error status (4xx / 5xx)
  | 'parse' // the JSON did not look like we expected
  | 'notFound' // the search found no places
  | 'invalidInput'; // the user typed something we cannot use

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status?: number; // only for 'http'

  constructor(kind: AppErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = status;
  }
}
