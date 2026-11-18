import { CityComparison, Forecast } from '@/Shared/Types';

// ---- Calc_CompareCities (W-25) ----
// The differences between two cities, always RIGHT minus LEFT:
// temperatureDiffC = +4 means the right city is 4 °C warmer, −4 means 4 °C colder.
// "Now" uses each city's current weather. "Today" is daily[1] (daily[0] is yesterday, past_days=1),
// and it's each city's OWN today: the API gives every city its local dates (timezone=auto).
export function Calc_CompareCities(left: Forecast, right: Forecast): CityComparison {
  const leftToday = left.daily[1];
  const rightToday = right.daily[1];

  return {
    temperatureDiffC: roundToTenth(right.current.temperatureC - left.current.temperatureC),
    feelsLikeDiffC: roundToTenth(right.current.feelsLikeC - left.current.feelsLikeC),
    gustsDiffMs: roundToTenth(right.current.windGustsMs - left.current.windGustsMs),
    rainTodayDiffMm: roundToTenth(rightToday.precipitationMm - leftToday.precipitationMm),
    daylightTodayDiffMinutes: roundToWhole((rightToday.daylightSeconds - leftToday.daylightSeconds) / 60),
  };
}

// One decimal is enough to show, and hides floating-point noise like 2.1 − 1.9 = 0.20000000000000018.
// A tiny difference can round to −0, which would show as "−0" (the same bug we had in Calc_DaylightChange),
// so −0 is turned into a plain 0.
function roundToTenth(value: number): number {
  const rounded = Math.round(value * 10) / 10;
  return rounded === 0 ? 0 : rounded;
}

function roundToWhole(value: number): number {
  const rounded = Math.round(value);
  return rounded === 0 ? 0 : rounded;
}

// ---- Format_ComparisonSentences (W-25) ----
// The differences as plain sentences, so nobody has to work out what "+4.2" means:
//   "Stockholm is 4° warmer than Reykjavík" · "Reykjavík is windier: gusts 9 m/s stronger" · …
// Small differences say "about the same", so the user isn't told 0.3° is a difference worth reading.
// Only the first part of each name is used ("Årsta, Stockholm" → "Årsta") to keep the sentences short.
const SAME_TEMPERATURE_C = 1;
const SAME_GUSTS_MS = 2;

export function Format_ComparisonSentences(leftName: string, rightName: string, diff: CityComparison): string[] {
  const left = leftName.split(',')[0];
  const right = rightName.split(',')[0];
  const sentences: string[] = [];

  // Every difference is right − left: positive means the RIGHT city has more.
  if (Math.abs(diff.temperatureDiffC) < SAME_TEMPERATURE_C) {
    sentences.push('About the same temperature');
  } else {
    const [warmer, colder] = diff.temperatureDiffC > 0 ? [right, left] : [left, right];
    sentences.push(`${warmer} is ${Math.round(Math.abs(diff.temperatureDiffC))}° warmer than ${colder}`);
  }

  if (Math.abs(diff.gustsDiffMs) < SAME_GUSTS_MS) {
    sentences.push('About as windy');
  } else {
    const windier = diff.gustsDiffMs > 0 ? right : left;
    sentences.push(`${windier} is windier: gusts ${Math.round(Math.abs(diff.gustsDiffMs))} m/s stronger`);
  }

  if (diff.daylightTodayDiffMinutes === 0) {
    sentences.push('Same amount of daylight today');
  } else {
    const lighter = diff.daylightTodayDiffMinutes > 0 ? right : left;
    sentences.push(`${lighter} gets ${Math.abs(diff.daylightTodayDiffMinutes)} min more daylight today`);
  }

  return sentences;
}
