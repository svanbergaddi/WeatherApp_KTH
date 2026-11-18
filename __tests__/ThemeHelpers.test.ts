import { AppError } from '@/Shared/Types';
import { Calc_Season, Calc_Spread, Calc_ThemeMode, Parse_SunTimes, SunTimes } from '@/Theme/ThemeHelpers';
import longyearbyenJson from './fixtures/openmeteo-suntimes-longyearbyen.json';
import stockholmJson from './fixtures/openmeteo-suntimes-stockholm.json';

const MINUTE = 60 * 1000;

// Real answers from Open-Meteo for 18 Nov 2026.
// Stockholm: sunrise 07:48, sunset 15:16 (local). Longyearbyen (Svalbard): polar night, 0 s daylight.
const stockholm = Parse_SunTimes(stockholmJson);
const longyearbyen = Parse_SunTimes(longyearbyenJson);

describe('Parse_SunTimes', () => {
  test('seconds from the API become milliseconds (like Date.now())', () => {
    expect(stockholm).toEqual({
      date: 1794956400000,
      sunriseMs: 1794984513000,
      sunsetMs: 1795011390000,
      daylightSeconds: 26868.43,
    });
  });

  test('polar night: no daylight', () => {
    expect(longyearbyen.daylightSeconds).toBe(0);
  });

  test('a broken answer gives a parse error', () => {
    expect(() => Parse_SunTimes({ daily: { sunrise: 'soon' } })).toThrow(AppError);
    expect(() => Parse_SunTimes(null)).toThrow(AppError);
  });
});

describe('Calc_ThemeMode', () => {
  const { sunriseMs, sunsetMs } = stockholm;

  test('"Always light" and "Always night" ignore the sun', () => {
    expect(Calc_ThemeMode(sunsetMs + 5 * 60 * MINUTE, stockholm, 'light')).toBe('light');
    expect(Calc_ThemeMode(sunriseMs + 60 * MINUTE, stockholm, 'night')).toBe('night');
  });

  test('auto, daytime: light', () => {
    expect(Calc_ThemeMode(sunriseMs + 3 * 60 * MINUTE, stockholm, 'auto')).toBe('light');
  });

  test('auto: still light for the first 30 minutes after sunset, night from exactly 30', () => {
    expect(Calc_ThemeMode(sunsetMs + 29 * MINUTE, stockholm, 'auto')).toBe('light');
    expect(Calc_ThemeMode(sunsetMs + 30 * MINUTE, stockholm, 'auto')).toBe('night');
  });

  test('auto: night until sunrise, light from sunrise', () => {
    expect(Calc_ThemeMode(sunriseMs - 1 * MINUTE, stockholm, 'auto')).toBe('night');
    expect(Calc_ThemeMode(sunriseMs, stockholm, 'auto')).toBe('light');
  });

  test('auto, polar night: night all day, even at noon', () => {
    const noon = longyearbyen.date + 12 * 60 * MINUTE;
    expect(Calc_ThemeMode(noon, longyearbyen, 'auto')).toBe('night');
  });

  test('auto, polar night: also night at 00:15', () => {
    // In polar night the API gives sunrise = sunset = midnight. Without the polar-night rule,
    // 00:15 would be "less than 30 min after sunset" and wrongly count as light. (Found by a mutation test.)
    expect(Calc_ThemeMode(longyearbyen.date + 15 * MINUTE, longyearbyen, 'auto')).toBe('night');
  });

  test('auto, midnight sun: light all day, even at midnight', () => {
    const midsummer: SunTimes = { date: 0, sunriseMs: 0, sunsetMs: 0, daylightSeconds: 86_400 };
    expect(Calc_ThemeMode(23 * 60 * MINUTE, midsummer, 'auto')).toBe('light');
  });

  test('auto without sun times (no location yet, or offline): light', () => {
    expect(Calc_ThemeMode(Date.now(), null, 'auto')).toBe('light');
  });
});

describe('Calc_Season', () => {
  test('northern hemisphere: Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn', () => {
    expect([12, 1, 2].map((m) => Calc_Season(m, 59))).toEqual(['winter', 'winter', 'winter']);
    expect([3, 4, 5].map((m) => Calc_Season(m, 59))).toEqual(['spring', 'spring', 'spring']);
    expect([6, 7, 8].map((m) => Calc_Season(m, 59))).toEqual(['summer', 'summer', 'summer']);
    expect([9, 10, 11].map((m) => Calc_Season(m, 59))).toEqual(['autumn', 'autumn', 'autumn']);
  });

  test('southern hemisphere is flipped: December in Sydney is summer', () => {
    expect(Calc_Season(12, -33.9)).toBe('summer');
    expect(Calc_Season(4, -33.9)).toBe('autumn');
  });

  test('the equator (0) counts as north', () => {
    expect(Calc_Season(1, 0)).toBe('winter');
  });
});

describe('Calc_Spread', () => {
  test('always between 0 and 1', () => {
    for (let i = 0; i < 200; i++) {
      const value = Calc_Spread(i, 3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test('the same index gives the same number every time (the scene never jumps)', () => {
    expect(Calc_Spread(7, 1)).toBe(Calc_Spread(7, 1));
  });

  test('20 snowflakes all get different start positions', () => {
    const positions = Array.from({ length: 20 }, (_, i) => Calc_Spread(i, 1));
    expect(new Set(positions).size).toBe(20);
  });
});
