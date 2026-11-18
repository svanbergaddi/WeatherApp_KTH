import { Calc_CompareCities, Format_ComparisonSentences } from '@/Compare/CompareHelpers';
import { Parse_Forecast } from '@/Forecast/ForecastHelpers';
import { Forecast } from '@/Shared/Types';
import reykjavikJson from './fixtures/openmeteo-reykjavik.json';

// Reykjavík now: 1.1 °C, feels −5.6 °C, gusts 12.8 m/s. Today: 0 mm rain, 22 737 s daylight.
const reykjavik = Parse_Forecast(reykjavikJson);

// A made-up "warmer, calmer, rainier, lighter" city, built from Reykjavík with a few values changed.
function cityLike(changes: { temperatureC?: number; feelsLikeC?: number; windGustsMs?: number; rainMm?: number; daylightSeconds?: number }): Forecast {
  const copy: Forecast = JSON.parse(JSON.stringify(reykjavik));
  if (changes.temperatureC !== undefined) copy.current.temperatureC = changes.temperatureC;
  if (changes.feelsLikeC !== undefined) copy.current.feelsLikeC = changes.feelsLikeC;
  if (changes.windGustsMs !== undefined) copy.current.windGustsMs = changes.windGustsMs;
  if (changes.rainMm !== undefined) copy.daily[1].precipitationMm = changes.rainMm;
  if (changes.daylightSeconds !== undefined) copy.daily[1].daylightSeconds = changes.daylightSeconds;
  return copy;
}

describe('Calc_CompareCities', () => {
  test('the same city on both sides: every difference is 0 (not −0)', () => {
    expect(Calc_CompareCities(reykjavik, reykjavik)).toEqual({
      temperatureDiffC: 0, feelsLikeDiffC: 0, gustsDiffMs: 0, rainTodayDiffMm: 0, daylightTodayDiffMinutes: 0,
    });
  });

  test('right minus left: a warmer, calmer, rainier city with more daylight on the right', () => {
    const warmer = cityLike({ temperatureC: 5.3, feelsLikeC: 2.4, windGustsMs: 4, rainMm: 3.2, daylightSeconds: 22_737 + 3600 });
    expect(Calc_CompareCities(reykjavik, warmer)).toEqual({
      temperatureDiffC: 4.2, // 5.3 − 1.1
      feelsLikeDiffC: 8, // 2.4 − (−5.6)
      gustsDiffMs: -8.8, // 4 − 12.8: the right city is calmer
      rainTodayDiffMm: 3.2,
      daylightTodayDiffMinutes: 60,
    });
  });

  test('swapping the sides flips every sign', () => {
    const warmer = cityLike({ temperatureC: 5.3 });
    expect(Calc_CompareCities(warmer, reykjavik).temperatureDiffC).toBe(-4.2);
  });

  test('floating-point noise is rounded away (2.1 − 1.9 is 0.2, not 0.20000000000000018)', () => {
    const left = cityLike({ temperatureC: 1.9 });
    const right = cityLike({ temperatureC: 2.1 });
    expect(Calc_CompareCities(left, right).temperatureDiffC).toBe(0.2);
  });

  test('a tiny difference rounds to 0, not −0', () => {
    const right = cityLike({ temperatureC: 1.08 }); // 1.08 − 1.1 = −0.02 → rounds to −0
    expect(Object.is(Calc_CompareCities(reykjavik, right).temperatureDiffC, 0)).toBe(true);
  });

  test('"today" is daily[1], not daily[0] (yesterday)', () => {
    const copy = cityLike({});
    copy.daily[0].precipitationMm = 99; // yesterday's rain must not count
    expect(Calc_CompareCities(reykjavik, copy).rainTodayDiffMm).toBe(0);
  });
});

describe('Format_ComparisonSentences', () => {
  const same = { temperatureDiffC: 0, feelsLikeDiffC: 0, gustsDiffMs: 0, rainTodayDiffMm: 0, daylightTodayDiffMinutes: 0 };

  test('right warmer, left windier, right lighter (signs are right − left)', () => {
    const diff = { ...same, temperatureDiffC: 4.2, gustsDiffMs: -8.8, daylightTodayDiffMinutes: 60 };
    expect(Format_ComparisonSentences('Reykjavík, Iceland', 'Stockholm, Stockholm County', diff)).toEqual([
      'Stockholm is 4° warmer than Reykjavík',
      'Reykjavík is windier: gusts 9 m/s stronger',
      'Stockholm gets 60 min more daylight today',
    ]);
  });

  test('small differences say "about the same"', () => {
    const diff = { ...same, temperatureDiffC: -0.6, gustsDiffMs: 1.5 };
    expect(Format_ComparisonSentences('A', 'B', diff)).toEqual([
      'About the same temperature',
      'About as windy',
      'Same amount of daylight today',
    ]);
  });

  test('left warmer', () => {
    expect(Format_ComparisonSentences('Malmö', 'Akureyri', { ...same, temperatureDiffC: -7 })[0]).toBe('Malmö is 7° warmer than Akureyri');
  });
});
