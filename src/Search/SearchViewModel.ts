import { useEffect, useRef, useState } from 'react';
import { QUICK_PICK_CITIES } from '@/Search/QuickPickCities';
import {
  Calc_LocalMatches, Calc_MergeSuggestions, Calc_SortByDistance, Parse_Places, Validate_Coordinates,
} from '@/Search/SearchHelpers';
import { API_SearchPlaces } from '@/Search/SearchService';
import { Format_ErrorMessage } from '@/Shared/FormatHelpers';
import { Device_GetLocation } from '@/Shared/Location';
import { AppError, Place, PhoneLocation } from '@/Shared/Types';

const MIN_LETTERS = 2; // W-21: suggestions start after 2 letters
const TYPING_PAUSE_MS = 400; // W-21: wait until the user stops typing
const MIN_GAP_BETWEEN_REQUESTS_MS = 1000; // maps.co allows about 1 request per second

type SearchState = {
  query: string;
  suggestions: Place[];
  isSearching: boolean;
  message: string | null; // "No place found", "No internet connection", a coordinate error …
};

const EMPTY_STATE: SearchState = { query: '', suggestions: [], isSearching: false, message: null };

// ---- Main process for search ----
// `onPlaceSelected` is what happens when the user picks a place. The home screen passes
// the forecast ViewModel's Process_LoadForecast, so Search doesn't need to know about forecasts.
export function useSearchViewModel(onPlaceSelected: (place: Place) => void) {
  const [state, setState] = useState<SearchState>(EMPTY_STATE);

  // Same W-20 race guard as the forecast: cancel the old request + only use the newest answer.
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestAtRef = useRef(0); // time of the last maps.co call, in ms
  const phoneLocationRef = useRef<PhoneLocation | null>(null); // null = unknown (no permission yet, or said no)

  // ---- Process_Start: ask where the phone is, once, when the screen opens ----
  // A ref, not state: the screen doesn't show the location, it's only used to sort the next list.
  useEffect(() => {
    Device_GetLocation().then((location) => {
      phoneLocationRef.current = location;
    });
    // When the screen closes, stop everything still running.
    return () => Process_CancelPending();
  }, []); // [] = run once, when the screen opens

  // The phone's country ("se"), or null if unknown. Places there don't show the country in their name.
  function Process_HomeCountry(): string | null {
    return phoneLocationRef.current?.countryCode ?? null;
  }

  // Our own cities that start with the typed letters, named like maps.co results, closest first.
  function Process_LocalMatches(text: string): Place[] {
    return Process_Sort(Calc_LocalMatches(text, QUICK_PICK_CITIES, Process_HomeCountry()));
  }

  // Closest first if we know where the phone is, otherwise unchanged.
  function Process_Sort(places: Place[]): Place[] {
    return Calc_SortByDistance(places, phoneLocationRef.current);
  }

  // ---- Process_TypeQuery: runs on every key press (W-21) ----
  function Process_TypeQuery(text: string): void {
    Process_CancelPending();

    if (text.trim().length < MIN_LETTERS) {
      setState({ query: text, suggestions: [], isSearching: false, message: null });
      return;
    }

    // Our own matching cities show at once ("Ha" → Hafnarfjörður). maps.co's results are added after the pause.
    const localMatches = Process_LocalMatches(text);
    setState({ query: text, suggestions: localMatches, isSearching: false, message: null });

    // Wait for a typing pause. If the last call was very recent, wait a bit longer (rate limit).
    const msSinceLastRequest = Date.now() - lastRequestAtRef.current;
    const waitMs = Math.max(TYPING_PAUSE_MS, MIN_GAP_BETWEEN_REQUESTS_MS - msSinceLastRequest);
    typingTimerRef.current = setTimeout(() => Process_FetchSuggestions(text, false), waitMs);
  }

  // ---- Process_FetchSuggestions: maps.co → Parse_Places → merge with our own matches → show the list ----
  // Returns the places too, so Process_SubmitQuery can pick the first one.
  // `isFinalSearch`: true after Enter. Only then is "No place found" shown, because while typing
  // a half word ("Birming") finds nothing on maps.co, and that doesn't mean the place doesn't exist.
  async function Process_FetchSuggestions(text: string, isFinalSearch: boolean): Promise<Place[]> {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    lastRequestAtRef.current = Date.now();

    const localMatches = Process_LocalMatches(text);
    setState((previous) => ({ ...previous, isSearching: true, message: null }));

    try {
      const json = await API_SearchPlaces(text.trim(), controller.signal);
      const remotePlaces = Parse_Places(json, Process_HomeCountry());
      const places = Process_Sort(Calc_MergeSuggestions(localMatches, remotePlaces));
      if (requestId !== requestIdRef.current) return []; // the user typed more since then

      const showNotFound = isFinalSearch && places.length === 0;
      const message = showNotFound ? Format_ErrorMessage(new AppError('notFound', text)) : null;
      setState((previous) => ({ ...previous, suggestions: places, isSearching: false, message }));
      return places;
    } catch (error) {
      if (error instanceof AppError && error.kind === 'cancelled') return [];
      if (requestId !== requestIdRef.current) return [];

      // maps.co failed (offline, 429 …): keep our own matches so the user can still pick one.
      setState((previous) => ({ ...previous, suggestions: localMatches, isSearching: false, message: Format_ErrorMessage(error, 'search') }));
      return localMatches;
    }
  }

  // ---- Process_SubmitQuery: the user pressed Enter ----
  // Search right away (no typing pause) and open the first match.
  async function Process_SubmitQuery(): Promise<void> {
    if (state.query.trim().length < MIN_LETTERS) return;
    Process_CancelPending();

    const places = await Process_FetchSuggestions(state.query, true);
    if (places.length > 0) Process_SelectPlace(places[0]);
  }

  // ---- Process_SelectPlace: a suggestion or a quick-pick city was tapped (W-22) ----
  function Process_SelectPlace(place: Place): void {
    Process_CancelPending();
    setState(EMPTY_STATE);
    onPlaceSelected(place);
  }

  // ---- Process_SearchCoordinates: the user typed latitude + longitude (W-13) ----
  function Process_SearchCoordinates(latitudeText: string, longitudeText: string): void {
    try {
      const { latitude, longitude } = Validate_Coordinates(latitudeText, longitudeText);
      Process_SelectPlace({ name: `${latitude}, ${longitude}`, latitude, longitude });
    } catch (error) {
      setState((previous) => ({ ...previous, message: Format_ErrorMessage(error) }));
    }
  }

  // ---- Process_CancelPending: stop a waiting timer and any request still running ----
  function Process_CancelPending(): void {
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    controllerRef.current?.abort();
    requestIdRef.current++; // any answer still on its way is now old
  }

  return { ...state, Process_TypeQuery, Process_SubmitQuery, Process_SelectPlace, Process_SearchCoordinates };
}
