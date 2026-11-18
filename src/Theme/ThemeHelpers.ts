import { AppError, Settings } from '@/Shared/Types';

// Today's sun for one place, as real moments (milliseconds since 1970, like Date.now()).
// Moments, not local clock text: then "is it after sunset?" is a plain number comparison with the phone's clock,
// whatever time zone the phone or the place is in.
export type SunTimes = {
  date: number; // start of that local day, ms (to notice when a new day starts)
  sunriseMs: number;
  sunsetMs: number;
  daylightSeconds: number; // 0 = polar night, 86 400 = midnight sun
};

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type ThemeMode = 'light' | 'night';

// ---- Parse_SunTimes ----
// Open-Meteo with timeformat=unixtime sends SECONDS since 1970. We use milliseconds (like Date.now()), so × 1000.
export function Parse_SunTimes(json: unknown): SunTimes {
  const daily = typeof json === 'object' && json !== null ? (json as Record<string, unknown>).daily : undefined;
  if (typeof daily !== 'object' || daily === null) throw sunError('daily');
  const fields = daily as Record<string, unknown>;

  const first = (key: string): number => {
    const list = fields[key];
    if (!Array.isArray(list) || typeof list[0] !== 'number') throw sunError(`daily.${key}`);
    return list[0];
  };

  return {
    date: first('time') * 1000,
    sunriseMs: first('sunrise') * 1000,
    sunsetMs: first('sunset') * 1000,
    daylightSeconds: first('daylight_duration'),
  };
}

function sunError(fieldName: string): AppError {
  return new AppError('parse', `Open-Meteo sent a missing or wrong "${fieldName}" for the sun times.`);
}

// ---- Calc_ThemeMode (W-27, W-29) ----
// "Always light" / "Always night" are what they say. "Auto" follows the sun:
//   night from 30 minutes after sunset, until sunrise.
// Polar night (no daylight) is night all day, midnight sun (24 h daylight) is light all day:
// in both, sunrise and sunset don't mean anything, so we decide on daylight_duration instead.
// Without sun times (no location, offline on first start) Auto stays light.
const NIGHT_STARTS_AFTER_SUNSET_MS = 30 * 60 * 1000;

export function Calc_ThemeMode(nowMs: number, sun: SunTimes | null, choice: Settings['themeChoice']): ThemeMode {
  if (choice === 'light') return 'light';
  if (choice === 'night') return 'night';
  if (sun === null) return 'light';

  if (sun.daylightSeconds <= 0) return 'night'; // polar night
  if (sun.daylightSeconds >= 86_400) return 'light'; // midnight sun

  const isBeforeSunrise = nowMs < sun.sunriseMs;
  const isLateEvening = nowMs >= sun.sunsetMs + NIGHT_STARTS_AFTER_SUNSET_MS;
  return isBeforeSunrise || isLateEvening ? 'night' : 'light';
}

// ---- Calc_Season (W-28) ----
// Meteorological seasons: Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn.
// South of the equator (latitude < 0) they're the other way round: December is summer in Sydney.
// month: 1 = January … 12 = December.
const NORTHERN_SEASONS: Season[] = [
  'winter', 'winter', 'spring', 'spring', 'spring', 'summer', // Jan–Jun
  'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', // Jul–Dec
];
const OPPOSITE: Record<Season, Season> = { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' };

export function Calc_Season(month: number, latitude: number): Season {
  const northern = NORTHERN_SEASONS[month - 1];
  return latitude < 0 ? OPPOSITE[northern] : northern;
}

// ---- Calc_Spread (W-30) ----
// A number between 0 and 1 for each snowflake/leaf/star, always the same for the same index.
// Used for where it starts, how fast it falls, when it starts. Not Math.random(): that would give
// new numbers on every redraw, and the whole scene would jump around.
// Multiplying by 37 (a prime that shares nothing with 100) spreads the indexes evenly over 0–99.
export function Calc_Spread(index: number, salt: number): number {
  return ((index * 37 + salt * 61) % 100) / 100;
}
