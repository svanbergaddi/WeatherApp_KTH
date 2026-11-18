// Our own data model. It does not depend on how any API shapes its JSON:
// the Parse_ functions translate API JSON into these types.

export type Place = {
  name: string;
  latitude: number;
  longitude: number;
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
