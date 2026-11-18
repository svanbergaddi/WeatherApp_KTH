import { Parse_Forecast } from '@/Forecast/ForecastHelpers';
import { Process_BuildDayView } from '@/Forecast/ForecastViewModel';
import reykjavikJson from './fixtures/openmeteo-reykjavik.json';

// The saved Reykjavík forecast: daily[0] = 2026-11-16 (yesterday), daily[1] = 2026-11-17 (today), "now" = 15:30.
const forecast = Parse_Forecast(reykjavikJson);

describe('Process_BuildDayView (day detail, W-02)', () => {
  test('a future day: all 24 hours, not today', () => {
    const dayView = Process_BuildDayView(forecast, '2026-11-19');
    expect(dayView?.isToday).toBe(false);
    expect(dayView?.day.date).toBe('2026-11-19');
    expect(dayView?.hours).toHaveLength(24);
  });

  test('today: only the hours left (from 15:00, because now is 15:30)', () => {
    const dayView = Process_BuildDayView(forecast, '2026-11-17');
    expect(dayView?.isToday).toBe(true);
    expect(dayView?.hours[0].time).toBe('2026-11-17T15:00');
    expect(dayView?.hours).toHaveLength(9); // 15:00 … 23:00
  });

  test('daylight change is compared with the day before', () => {
    expect(Process_BuildDayView(forecast, '2026-11-17')?.daylightChangeMinutes).toBe(-6);
  });

  test('the first day has no day before: no change instead of a crash', () => {
    expect(Process_BuildDayView(forecast, '2026-11-16')?.daylightChangeMinutes).toBe(0);
  });

  test('a date that is not in the forecast gives null (the screen shows a message)', () => {
    expect(Process_BuildDayView(forecast, '2027-01-01')).toBeNull();
  });
});
