import { API_FetchJson } from '@/Shared/HttpClient';

// Today's sunrise, sunset and daylight for one place (W-27). Parse it with Parse_SunTimes.
// timeformat=unixtime: real moments (seconds since 1970), easy to compare with the phone's clock.
// timezone=auto: "today" is the place's own today.
export function API_GetSunTimes(latitude: number, longitude: number, signal?: AbortSignal): Promise<unknown> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&daily=sunrise,sunset,daylight_duration&timeformat=unixtime&timezone=auto&forecast_days=1';
  return API_FetchJson(url, signal);
}
