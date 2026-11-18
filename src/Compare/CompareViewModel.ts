import { useEffect, useMemo, useRef, useState } from 'react';
import { Calc_CompareCities } from '@/Compare/CompareHelpers';
import { Parse_Forecast } from '@/Forecast/ForecastHelpers';
import { API_GetForecast } from '@/Forecast/ForecastService';
import { useForecastViewModel } from '@/Forecast/ForecastViewModel';
import { Format_ErrorMessage } from '@/Shared/FormatHelpers';
import { AppError, Forecast, Place } from '@/Shared/Types';

export type Side = 'left' | 'right';

type Slot = {
  status: 'empty' | 'loading' | 'ready' | 'error';
  place: Place | null;
  forecast: Forecast | null;
  message: string | null;
};

const EMPTY_SLOT: Slot = { status: 'empty', place: null, forecast: null, message: null };

// ---- Main process for Compare (W-25) ----
// A plain hook, not a shared Context: only the Compare screen uses it.
export function useCompareViewModel() {
  const [slots, setSlots] = useState<Record<Side, Slot>>({ left: EMPTY_SLOT, right: EMPTY_SLOT });
  const [activeSide, setActiveSide] = useState<Side>('right'); // where the next picked city goes

  // Race guard (W-20) for EACH side separately, so loading the right city never cancels the left one.
  const controllersRef = useRef<Record<Side, AbortController | null>>({ left: null, right: null });
  const requestIdsRef = useRef<Record<Side, number>>({ left: 0, right: 0 });

  // Change one side and keep the other as it is.
  function updateSlot(side: Side, slot: Slot): void {
    setSlots((previous) => ({ ...previous, [side]: slot }));
  }

  // ---- Process_Start: the left side starts with the city you're viewing on home ----
  // Its forecast is already loaded, so we reuse it: no extra API call.
  const shownForecast = useForecastViewModel();
  useEffect(() => {
    if (shownForecast.place !== null && shownForecast.forecast !== null) {
      updateSlot('left', { status: 'ready', place: shownForecast.place, forecast: shownForecast.forecast, message: null });
    }
    // When the screen closes, cancel anything still loading.
    return () => {
      controllersRef.current.left?.abort();
      controllersRef.current.right?.abort();
    };
  }, []); // [] = run once, when the screen opens

  // ---- Process_LoadSide: fetch → parse → show, for one side ----
  // No cache here: Compare is a quick look, the offline cache belongs to the home screen.
  async function Process_LoadSide(side: Side, place: Place): Promise<void> {
    controllersRef.current[side]?.abort();
    const controller = new AbortController();
    controllersRef.current[side] = controller;
    const requestId = ++requestIdsRef.current[side];

    updateSlot(side, { status: 'loading', place, forecast: null, message: null });

    try {
      const json = await API_GetForecast(place.latitude, place.longitude, controller.signal);
      const forecast = Parse_Forecast(json);
      if (requestId !== requestIdsRef.current[side]) return; // a newer city was picked for this side

      updateSlot(side, { status: 'ready', place, forecast, message: null });
    } catch (error) {
      if (error instanceof AppError && error.kind === 'cancelled') return;
      if (requestId !== requestIdsRef.current[side]) return;

      updateSlot(side, { status: 'error', place, forecast: null, message: Format_ErrorMessage(error) });
    }
  }

  // ---- Process_PickCity: a city was picked (search or quick pick) → it goes into the active side ----
  function Process_PickCity(place: Place): void {
    Process_LoadSide(activeSide, place);
  }

  // ---- Process_ChooseSide: tapping a side makes it the one the next city goes into ----
  function Process_ChooseSide(side: Side): void {
    setActiveSide(side);
  }

  // The differences, only when BOTH sides have a forecast. Recalculated only when one of them changes.
  const comparison = useMemo(
    () => (slots.left.forecast !== null && slots.right.forecast !== null
      ? Calc_CompareCities(slots.left.forecast, slots.right.forecast)
      : null),
    [slots.left.forecast, slots.right.forecast],
  );

  return { slots, activeSide, comparison, Process_PickCity, Process_ChooseSide };
}
