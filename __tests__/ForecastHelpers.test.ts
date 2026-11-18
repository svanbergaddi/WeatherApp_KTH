import { Calc_DaylightChange, Calc_GroupByDay, Calc_WhatToWear, Calc_WindWarning, Parse_Forecast } from '@/Forecast/ForecastHelpers';
import { AppError, HourlyPoint } from '@/Shared/Types';
import reykjavik from './fixtures/openmeteo-reykjavik.json';

// A fresh copy of the saved response for each test, so breaking it in one test can't affect another.
// `any` is on purpose (the one exception to STYLE.md): the tests break the JSON in ways the types would forbid.
function copyOfFixture(): any {
  return JSON.parse(JSON.stringify(reykjavik));
}

// Runs Parse_Forecast and returns the error it throws (or fails the test if it doesn't throw).
function errorFrom(json: unknown): AppError {
  try {
    Parse_Forecast(json);
  } catch (error) {
    return error as AppError;
  }
  throw new Error('Expected Parse_Forecast to throw, but it did not.');
}

describe('Parse_Forecast: valid response', () => {
  const forecast = Parse_Forecast(copyOfFixture());

  test('keeps the time zone', () => {
    expect(forecast.timezone).toBe('Atlantic/Reykjavik');
  });

  test('gives one row per hour and per day (8 days incl. yesterday)', () => {
    expect(forecast.hourly).toHaveLength(192);
    expect(forecast.daily).toHaveLength(8);
  });

  test('renames current fields and turns is_day into a boolean', () => {
    expect(forecast.current).toEqual({
      time: '2026-11-17T15:30',
      temperatureC: 1.1,
      feelsLikeC: -5.6,
      weatherCode: 3,
      windSpeedMs: 7.6,
      windGustsMs: 12.8,
      humidityPercent: 64,
      precipitationMm: 0,
      isDay: true,
    });
  });

  test('turns hourly columns into rows (position 0 in every column = first hour)', () => {
    expect(forecast.hourly[0]).toEqual({
      time: '2026-11-16T00:00',
      temperatureC: -5,
      feelsLikeC: -10.8,
      weatherCode: 1,
      precipitationMm: 0,
      precipitationChancePercent: 0,
      windSpeedMs: 5,
      windGustsMs: 8.2,
    });
  });

  test('daily[0] is yesterday and daily[1] is today', () => {
    expect(forecast.daily[0].date).toBe('2026-11-16');
    expect(forecast.daily[1]).toEqual({
      date: '2026-11-17',
      minC: -1,
      maxC: 2.1,
      feelsLikeMinC: -6.9,
      weatherCode: 3,
      precipitationMm: 0,
      windMaxMs: 11.4,
      windGustsMaxMs: 18,
      sunrise: '2026-11-17T10:03',
      sunset: '2026-11-17T16:21',
      daylightSeconds: 22737,
    });
  });

  test('is_day 0 becomes false', () => {
    const json = copyOfFixture();
    json.current.is_day = 0;
    expect(Parse_Forecast(json).current.isDay).toBe(false);
  });
});

describe('Parse_Forecast: broken response gives a parse error', () => {
  test('not an object at all', () => {
    for (const bad of [null, undefined, 'hello', 42, []]) {
      expect(errorFrom(bad).kind).toBe('parse');
    }
  });

  test('missing daily block', () => {
    const json = copyOfFixture();
    delete json.daily;
    const error = errorFrom(json);
    expect(error).toBeInstanceOf(AppError);
    expect(error.kind).toBe('parse');
    expect(error.message).toContain('"daily"');
  });

  test('a column shorter than time', () => {
    const json = copyOfFixture();
    json.hourly.temperature_2m.pop();
    expect(errorFrom(json).message).toContain('hourly.temperature_2m');
  });

  test('a null value inside a column', () => {
    const json = copyOfFixture();
    json.daily.temperature_2m_max[3] = null;
    expect(errorFrom(json).message).toContain('daily.temperature_2m_max');
  });

  test('a number sent as text', () => {
    const json = copyOfFixture();
    json.current.temperature_2m = '1.1';
    expect(errorFrom(json).message).toContain('current.temperature_2m');
  });

  test('missing time zone', () => {
    const json = copyOfFixture();
    delete json.timezone;
    expect(errorFrom(json).kind).toBe('parse');
  });
});

describe('Calc_GroupByDay', () => {
  // A tiny hour with only the time set; the other values don't matter for grouping.
  function hourAt(time: string): HourlyPoint {
    return {
      time, temperatureC: 0, feelsLikeC: 0, weatherCode: 0, precipitationMm: 0,
      precipitationChancePercent: 0, windSpeedMs: 0, windGustsMs: 0,
    };
  }

  test('normal day: the real response gives 8 days of 24 hours, in order', () => {
    const days = Calc_GroupByDay(Parse_Forecast(copyOfFixture()).hourly);
    expect(Object.keys(days)).toHaveLength(8);
    expect(Object.keys(days)[0]).toBe('2026-11-16');
    expect(days['2026-11-17']).toHaveLength(24);
    expect(days['2026-11-17'][0].time).toBe('2026-11-17T00:00');
    expect(days['2026-11-17'][23].time).toBe('2026-11-17T23:00');
  });

  test('close to midnight: 23:00 stays on its day, 00:00 starts the next day', () => {
    const days = Calc_GroupByDay([hourAt('2026-11-17T22:00'), hourAt('2026-11-17T23:00'), hourAt('2026-11-18T00:00')]);
    expect(days['2026-11-17'].map((h) => h.time)).toEqual(['2026-11-17T22:00', '2026-11-17T23:00']);
    expect(days['2026-11-18'].map((h) => h.time)).toEqual(['2026-11-18T00:00']);
  });

  test('no hours gives no days', () => {
    expect(Calc_GroupByDay([])).toEqual({});
  });
});

describe('Calc_WindWarning', () => {
  test('calm: no warning', () => {
    expect(Calc_WindWarning(0)).toBe('none');
    expect(Calc_WindWarning(8)).toBe('none');
  });

  test('strong gusts', () => {
    expect(Calc_WindWarning(17)).toBe('strong');
  });

  test('storm gusts', () => {
    expect(Calc_WindWarning(30)).toBe('storm');
  });

  test('exactly at the limit counts as that level', () => {
    expect(Calc_WindWarning(13.9)).toBe('none');
    expect(Calc_WindWarning(14)).toBe('strong');
    expect(Calc_WindWarning(20.9)).toBe('strong');
    expect(Calc_WindWarning(21)).toBe('storm');
  });

  test('real response: today in Reykjavík (gusts 18 m/s) is strong', () => {
    const today = Parse_Forecast(copyOfFixture()).daily[1];
    expect(Calc_WindWarning(today.windGustsMaxMs)).toBe('strong');
  });
});

describe('Calc_WhatToWear', () => {
  test('cold + windy, no rain: winter jacket, hat, gloves', () => {
    expect(Calc_WhatToWear(-8, 0, 18)).toEqual({ layer: 'winterJacket', hat: true, gloves: true, rainGear: 'none' });
  });

  test('warm + rain, calm: t-shirt and umbrella', () => {
    expect(Calc_WhatToWear(20, 3, 5)).toEqual({ layer: 'tShirt', hat: false, gloves: false, rainGear: 'umbrella' });
  });

  test('rain + strong gusts: rain jacket instead of umbrella', () => {
    expect(Calc_WhatToWear(8, 3, 14).rainGear).toBe('rainJacket');
  });

  test('temperature limits: exactly at a limit gets the lighter clothes', () => {
    expect(Calc_WhatToWear(18, 0, 0).layer).toBe('tShirt');
    expect(Calc_WhatToWear(17.9, 0, 0).layer).toBe('lightJacket');
    expect(Calc_WhatToWear(10, 0, 0).layer).toBe('lightJacket');
    expect(Calc_WhatToWear(0, 0, 0)).toEqual({ layer: 'jacket', hat: true, gloves: false, rainGear: 'none' });
    expect(Calc_WhatToWear(-0.1, 0, 0).layer).toBe('winterJacket');
    expect(Calc_WhatToWear(5, 0, 0).hat).toBe(false);
  });

  test('rain limit: 0.4 mm is dry, 0.5 mm needs rain gear', () => {
    expect(Calc_WhatToWear(12, 0.4, 0).rainGear).toBe('none');
    expect(Calc_WhatToWear(12, 0.5, 0).rainGear).toBe('umbrella');
  });

  test('real response: today in Reykjavík (feels like -6.9 °C, dry, gusts 18 m/s)', () => {
    const today = Parse_Forecast(copyOfFixture()).daily[1];
    expect(Calc_WhatToWear(today.feelsLikeMinC, today.precipitationMm, today.windGustsMaxMs))
      .toEqual({ layer: 'winterJacket', hat: true, gloves: true, rainGear: 'none' });
  });
});

describe('Calc_DaylightChange', () => {
  test('gaining daylight (spring): positive minutes', () => {
    expect(Calc_DaylightChange(40_000, 39_700)).toBe(5);
  });

  test('losing daylight (autumn): negative minutes', () => {
    expect(Calc_DaylightChange(39_700, 40_000)).toBe(-5);
  });

  test('rounds to whole minutes, and a tiny change shows as 0 (not -0)', () => {
    expect(Calc_DaylightChange(40_100, 40_000)).toBe(2); // 1.67 min
    expect(Calc_DaylightChange(40_000, 40_010)).toBe(0); // -0.17 min
  });

  test('polar night and midnight sun: no change', () => {
    expect(Calc_DaylightChange(0, 0)).toBe(0);
    expect(Calc_DaylightChange(86_400, 86_400)).toBe(0);
  });

  test('real response: Reykjavík lost about 6 minutes since yesterday', () => {
    const daily = Parse_Forecast(copyOfFixture()).daily;
    expect(Calc_DaylightChange(daily[1].daylightSeconds, daily[0].daylightSeconds)).toBe(-6);
  });
});
