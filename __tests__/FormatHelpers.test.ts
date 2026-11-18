import {
  Format_DayName, Format_DaylightChange, Format_DaylightLength, Format_ErrorMessage, Format_LastUpdated, Format_Outfit,
  Format_Temperature,
  Format_Time, Format_Weather, Format_WindWarning,
} from '@/Shared/FormatHelpers';
import { AppError } from '@/Shared/Types';

describe('Format_ErrorMessage', () => {
  test('every error kind gets its own message', () => {
    expect(Format_ErrorMessage(new AppError('network', 'x'))).toBe('No internet connection.');
    expect(Format_ErrorMessage(new AppError('timeout', 'x'))).toContain('slow');
    expect(Format_ErrorMessage(new AppError('parse', 'x'))).toBe("Couldn't read the weather data.");
    expect(Format_ErrorMessage(new AppError('notFound', 'x'))).toBe('No place found with that name.');
  });

  test('http: 429 says wait, other statuses show the number', () => {
    expect(Format_ErrorMessage(new AppError('http', 'x', 429))).toContain('Too many requests');
    expect(Format_ErrorMessage(new AppError('http', 'x', 500))).toContain('500');
  });

  test('invalidInput shows the message from the Validate_ function as it is', () => {
    const error = new AppError('invalidInput', 'Latitude must be between -90 and 90.');
    expect(Format_ErrorMessage(error)).toBe('Latitude must be between -90 and 90.');
  });

  test('cancelled is never shown', () => {
    expect(Format_ErrorMessage(new AppError('cancelled', 'x'))).toBe('');
  });

  test('an unexpected error (not an AppError) still gives a friendly message, never a crash', () => {
    expect(Format_ErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(Format_ErrorMessage('just a string')).toBe('Something went wrong. Please try again.');
    expect(Format_ErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });
});

describe('Format_Temperature', () => {
  test('rounds to whole degrees', () => {
    expect(Format_Temperature(3.6)).toBe('4°');
    expect(Format_Temperature(-5.6)).toBe('-6°');
  });

  test('a small minus rounds to 0°, not -0°', () => {
    expect(Format_Temperature(-0.4)).toBe('0°');
  });
});

describe('Format_Time', () => {
  test('cuts the clock time out of a local date-time', () => {
    expect(Format_Time('2026-11-18T14:00')).toBe('14:00');
    expect(Format_Time('2026-11-17T10:03')).toBe('10:03');
  });
});

describe('Format_DayName', () => {
  test('today says "Today"', () => {
    expect(Format_DayName('2026-11-18', '2026-11-18')).toBe('Today');
  });

  test('other days: short weekday + day of month', () => {
    expect(Format_DayName('2026-11-19', '2026-11-18')).toBe('Thu 19');
    expect(Format_DayName('2026-11-23', '2026-11-18')).toBe('Mon 23');
    expect(Format_DayName('2026-12-01', '2026-11-18')).toBe('Tue 1');
  });
});

describe('Format_Weather', () => {
  test('known codes get an icon and words', () => {
    expect(Format_Weather(3)).toEqual({ icon: '☁️', label: 'Overcast' });
    expect(Format_Weather(73).label).toBe('Snow');
  });

  test('clear at night shows a moon, cloudy at night does not change', () => {
    expect(Format_Weather(0, false)).toEqual({ icon: '🌙', label: 'Clear' });
    expect(Format_Weather(3, false).icon).toBe('☁️');
  });

  test('an unknown code never crashes', () => {
    expect(Format_Weather(42)).toEqual({ icon: '❔', label: 'Unknown' });
  });
});

describe('Format_Outfit', () => {
  test('cold: layer + hat + gloves', () => {
    expect(Format_Outfit({ layer: 'winterJacket', hat: true, gloves: true, rainGear: 'none' })).toBe('Winter jacket + hat + gloves');
  });

  test('rain: umbrella, or a rain jacket when it is too windy', () => {
    expect(Format_Outfit({ layer: 'tShirt', hat: false, gloves: false, rainGear: 'umbrella' })).toBe('T-shirt + umbrella');
    expect(Format_Outfit({ layer: 'jacket', hat: false, gloves: false, rainGear: 'rainJacket' }))
      .toBe('Jacket + rain jacket (too windy for an umbrella)');
  });
});

describe('Format_WindWarning', () => {
  test('no warning gives null (nothing is shown)', () => {
    expect(Format_WindWarning('none', 8)).toBeNull();
  });

  test('strong and storm gusts', () => {
    expect(Format_WindWarning('strong', 17.6)).toBe('Strong gusts up to 18 m/s');
    expect(Format_WindWarning('storm', 25)).toBe('Storm gusts up to 25 m/s');
  });
});

describe('Format_DaylightChange', () => {
  test('more, less, or the same', () => {
    expect(Format_DaylightChange(3)).toBe('3 min more daylight than yesterday');
    expect(Format_DaylightChange(-6)).toBe('6 min less daylight than yesterday');
    expect(Format_DaylightChange(0)).toBe('Same daylight as yesterday');
  });
});

describe('Format_LastUpdated', () => {
  test('shows the phone clock time with two digits', () => {
    const fiveOverNine = new Date(2026, 10, 18, 9, 5).toISOString(); // 09:05 phone time
    expect(Format_LastUpdated(fiveOverNine)).toBe('Last updated 09:05');
  });
});

describe('Format_DaylightLength', () => {
  test('hours and minutes', () => {
    expect(Format_DaylightLength(22_737)).toBe('6 h 19 min of daylight'); // Reykjavík, 17 Nov
    expect(Format_DaylightLength(3_600)).toBe('1 h 0 min of daylight');
  });

  test('polar night and midnight sun get their own words', () => {
    expect(Format_DaylightLength(0)).toBe('No sunrise today (polar night)');
    expect(Format_DaylightLength(86_400)).toBe('The sun never sets today (midnight sun)');
  });
});
