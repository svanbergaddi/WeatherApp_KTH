import { ReactNode, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { useSettingsViewModel } from '@/Settings/SettingsViewModel';
import { Device_GetLocation } from '@/Shared/Location';
import { NIGHT_THEME, SEASON_THEMES, ThemeContext } from '@/Shared/Theme';
import { AppError, Coordinates } from '@/Shared/Types';
import { Calc_Season, Calc_ThemeMode, Parse_SunTimes, SunTimes } from '@/Theme/ThemeHelpers';
import { API_GetSunTimes } from '@/Theme/ThemeService';

const ONE_MINUTE_MS = 60 * 1000;
const DEFAULT_LATITUDE = 59; // no place known yet: assume the north (it's a Nordic app) for the season

// ---- Main process for the theme (W-27, W-28, W-29) ----
// Decides WHICH palette the whole app uses, and hands it to every screen through ThemeContext.
// Screens only call useAppTheme() and never know why it's night or winter.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themeChoice } = useSettingsViewModel().settings;
  const forecast = useForecastViewModel();

  const [phoneLocation, setPhoneLocation] = useState<Coordinates | null>(null);
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  // ---- Process_Start: ask where the phone is, once ----
  useEffect(() => {
    Device_GetLocation().then(setPhoneLocation);
  }, []); // [] = run once

  // ---- Which place's sun decides the theme? The phone's location, else the city you're viewing ----
  const sunPlace: Coordinates | null = phoneLocation ?? forecast.place;
  // Rounded to 0.1° (~10 km), so small GPS changes don't fetch the sun times again.
  const sunPlaceKey = sunPlace === null ? null : `${sunPlace.latitude.toFixed(1)},${sunPlace.longitude.toFixed(1)}`;
  // The phone's date: when it changes (after midnight), fetch the new day's sun times.
  const phoneDay = new Date(nowMs).toDateString();

  // ---- Process_LoadSunTimes: fetch today's sunrise/sunset for that place ----
  // Runs again only when the place (rounded) or the day changes. If it fails, we keep the old sun times:
  // the theme is a nice extra and must never show an error.
  useEffect(() => {
    if (sunPlace === null) return;
    const controller = new AbortController();

    API_GetSunTimes(sunPlace.latitude, sunPlace.longitude, controller.signal)
      .then((json) => setSunTimes(Parse_SunTimes(json)))
      .catch((error) => {
        if (!(error instanceof AppError && error.kind === 'cancelled')) console.warn('Sun times failed', error);
      });

    return () => controller.abort(); // the place changed again before the answer came: drop the old request
  }, [sunPlaceKey, phoneDay]);

  // ---- Process_Tick: update "now" every minute, and when the app comes back to the screen ----
  // So the switch to night happens on time, not only the next time something else redraws.
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), ONE_MINUTE_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNowMs(Date.now());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []); // [] = set up once

  // ---- Process_PickPalette: night, or the season's light theme ----
  const mode = Calc_ThemeMode(nowMs, sunTimes, themeChoice);
  const season = Calc_Season(new Date(nowMs).getMonth() + 1, sunPlace?.latitude ?? DEFAULT_LATITUDE);
  const theme = mode === 'night' ? NIGHT_THEME : SEASON_THEMES[season];

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
