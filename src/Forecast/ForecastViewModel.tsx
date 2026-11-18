import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calc_DaylightChange, Calc_GroupByDay, Calc_HoursFromNow, Calc_SunProgress, Calc_WhatToWear, Calc_WindWarning,
  Parse_Forecast,
} from '@/Forecast/ForecastHelpers';
import { API_GetForecast, Storage_LoadForecast, Storage_SaveForecast } from '@/Forecast/ForecastService';
import { useSettingsViewModel } from '@/Settings/SettingsViewModel';
import { Format_ErrorMessage } from '@/Shared/FormatHelpers';
import { AppError, DailySummary, Forecast, HourlyPoint, Outfit, Place, WindWarning } from '@/Shared/Types';

// Everything the screens show, already calculated. The screens only display these values.
export type ForecastView = {
  today: DailySummary;
  week: DailySummary[]; // today + the next 6 days (W-06)
  todayHours: HourlyPoint[]; // all 24 hours of today
  hoursLeftToday: HourlyPoint[]; // from the current hour on: what the home screen shows (W-07)
  windWarningNow: WindWarning; // W-23
  outfitToday: Outfit; // W-24
  daylightChangeMinutes: number; // W-26
  sunProgress: number | null; // W-30: 0 = sunrise … 1 = sunset, null = the sun is down
};

// Everything the day detail screen shows for ONE day (W-02), already calculated.
export type DayView = {
  day: DailySummary;
  isToday: boolean;
  todayDate: string; // to name the day ("Today", "Thu 19")
  hours: HourlyPoint[]; // that day hour by hour; for today only the hours left
  windWarning: WindWarning; // from the day's strongest gust
  outfit: Outfit;
  daylightChangeMinutes: number; // compared with the day before
};

type ForecastState = {
  status: 'empty' | 'loading' | 'ready' | 'error';
  place: Place | null;
  forecast: Forecast | null;
  message: string | null; // error or offline note, shown above the data
  savedAt: string | null; // set when we show cached data: "last updated …" (W-09)
};

const EMPTY_STATE: ForecastState = { status: 'empty', place: null, forecast: null, message: null, savedAt: null };

// ---- Why a Context? ----
// The forecast is used on several screens: home shows it, the Favourites tab loads a place into it,
// and the day detail screen (W-02) shows one of its days. A Context keeps ONE forecast for the whole app
// (same pattern as FavouritesViewModel). ForecastProvider is in src/app/_layout.tsx.
type ForecastViewModel = ReturnType<typeof useForecastState>;
const ForecastContext = createContext<ForecastViewModel | null>(null);

export function ForecastProvider({ children }: { children: ReactNode }) {
  const viewModel = useForecastState();
  return <ForecastContext.Provider value={viewModel}>{children}</ForecastContext.Provider>;
}

// Screens call this to get the shared forecast + the Process_ functions.
export function useForecastViewModel(): ForecastViewModel {
  const viewModel = useContext(ForecastContext);
  if (viewModel === null) throw new Error('useForecastViewModel must be used inside ForecastProvider');
  return viewModel;
}

// ---- Main process for the forecast ----
// The state and the Process_ functions. Only ForecastProvider calls this; screens use useForecastViewModel().
function useForecastState() {
  const [state, setState] = useState<ForecastState>(EMPTY_STATE);

  // W-20 race guard, two parts:
  // 1. controllerRef cancels the old network request when a new place is picked.
  // 2. requestIdRef numbers every request. When an answer arrives, we only use it if it's still the newest.
  //    (Cancelling alone isn't enough: an answer may already have arrived just before we cancelled.)
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // ---- Process_LoadForecast: fetch → parse → show → save the cache ----
  async function Process_LoadForecast(place: Place): Promise<void> {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    // Show "loading". Keep the old forecast only if it's for the same place, so we never show the wrong city.
    setState((previous) => ({
      status: 'loading',
      place,
      forecast: isSamePlace(previous.place, place) ? previous.forecast : null,
      message: null,
      savedAt: isSamePlace(previous.place, place) ? previous.savedAt : null,
    }));

    try {
      const json = await API_GetForecast(place.latitude, place.longitude, controller.signal);
      const forecast = Parse_Forecast(json);
      if (requestId !== requestIdRef.current) return; // a newer request took over

      setState({ status: 'ready', place, forecast, message: null, savedAt: null });
      await Storage_SaveForecast(place, forecast);
    } catch (error) {
      if (error instanceof AppError && error.kind === 'cancelled') return; // we cancelled it ourselves
      if (requestId !== requestIdRef.current) return;

      // Offline or server error: fall back to the cache if it's for this place (W-09). Never crash (W-15).
      const cached = await Storage_LoadForecast();
      if (requestId !== requestIdRef.current) return;

      const message = Format_ErrorMessage(error);
      if (cached !== null && isSamePlace(cached.place, place)) {
        setState({ status: 'ready', place, forecast: cached.forecast, message, savedAt: cached.savedAt });
      } else {
        setState({ status: 'error', place, forecast: null, message, savedAt: null });
      }
    }
  }

  // ---- Process_Refresh: load the same place again (pull to refresh, refresh timer) ----
  function Process_Refresh(): void {
    if (state.place !== null) Process_LoadForecast(state.place);
  }

  // ---- Process_Start: on app start, show the cache at once, then refresh it ----
  useEffect(() => {
    async function Process_Start(): Promise<void> {
      const cached = await Storage_LoadForecast();
      // If the user already picked a place while we were reading the cache, don't overwrite it.
      if (cached === null || requestIdRef.current !== 0) return;

      setState({ status: 'ready', place: cached.place, forecast: cached.forecast, message: null, savedAt: cached.savedAt });
      Process_LoadForecast(cached.place);
    }
    Process_Start();

    // When the screen closes, cancel any request still running.
    return () => controllerRef.current?.abort();
  }, []); // [] = run once, when the app opens

  // ---- Process_AutoRefresh: reload the shown place every N minutes (W-04) ----
  // The timer is set up again whenever the setting changes ([refreshMinutes] below), and the old one
  // is stopped first (the "return" cleanup), so there's never more than one timer running.
  // placeRef: the timer runs later, so it reads the CURRENT place from a ref, not the place at setup time.
  const { refreshMinutes } = useSettingsViewModel().settings;
  const placeRef = useRef<Place | null>(null);
  placeRef.current = state.place;

  useEffect(() => {
    if (refreshMinutes === 0) return; // 0 = never
    const timer = setInterval(() => {
      if (placeRef.current !== null) Process_LoadForecast(placeRef.current);
    }, refreshMinutes * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshMinutes]);

  // Recalculate the screen values only when the forecast changes.
  const view = useMemo(() => (state.forecast === null ? null : Process_BuildView(state.forecast)), [state.forecast]);

  // ---- Process_GetDay: everything the day detail screen needs for one date (W-02) ----
  // null if there's no forecast yet, or the date isn't in it (an old link, or the forecast moved on a day).
  function Process_GetDay(date: string): DayView | null {
    return state.forecast === null ? null : Process_BuildDayView(state.forecast, date);
  }

  return { ...state, view, Process_LoadForecast, Process_Refresh, Process_GetDay };
}

// ---- Process_BuildDayView: the same helpers as the home screen, for one chosen day ----
export function Process_BuildDayView(forecast: Forecast, date: string): DayView | null {
  const index = forecast.daily.findIndex((day) => day.date === date);
  if (index === -1) return null;

  const day = forecast.daily[index];
  const dayBefore = forecast.daily[index - 1] ?? day; // daily[0] has no day before: then "no change"
  const todayDate = forecast.daily[1].date;
  const isToday = date === todayDate;
  const allHours = Calc_GroupByDay(forecast.hourly)[date] ?? [];

  return {
    day,
    isToday,
    todayDate,
    hours: isToday ? Calc_HoursFromNow(allHours, forecast.current.time) : allHours,
    windWarning: Calc_WindWarning(day.windGustsMaxMs),
    outfit: Calc_WhatToWear(day.feelsLikeMinC, day.precipitationMm, day.windGustsMaxMs),
    daylightChangeMinutes: Calc_DaylightChange(day.daylightSeconds, dayBefore.daylightSeconds),
  };
}

// ---- Process_BuildView: runs the helpers in order to get everything the screen shows ----
// daily[0] is yesterday (past_days=1), so today is daily[1].
function Process_BuildView(forecast: Forecast): ForecastView {
  const yesterday = forecast.daily[0];
  const today = forecast.daily[1];
  const hoursByDay = Calc_GroupByDay(forecast.hourly);

  return {
    today,
    week: forecast.daily.slice(1),
    todayHours: hoursByDay[today.date] ?? [],
    hoursLeftToday: Calc_HoursFromNow(hoursByDay[today.date] ?? [], forecast.current.time),
    windWarningNow: Calc_WindWarning(forecast.current.windGustsMs),
    outfitToday: Calc_WhatToWear(today.feelsLikeMinC, today.precipitationMm, today.windGustsMaxMs),
    daylightChangeMinutes: Calc_DaylightChange(today.daylightSeconds, yesterday.daylightSeconds),
    // Uses the forecast's "now", which updates with every refresh (W-04). Good enough for an arc.
    sunProgress: Calc_SunProgress(forecast.current.time, today.sunrise, today.sunset),
  };
}

// Two places are the same if they have the same coordinates (names can differ: "Reykjavík" vs "Reykjavíkurborg").
function isSamePlace(a: Place | null, b: Place): boolean {
  return a !== null && a.latitude === b.latitude && a.longitude === b.longitude;
}
