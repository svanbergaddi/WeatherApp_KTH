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
