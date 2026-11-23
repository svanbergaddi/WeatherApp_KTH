# SPEC.md — Weather App (Lab B:2)

## 1. AI instructions
- Read SPEC.md, STYLE.md and CONTEXT.md first.
- If our request conflicts with these files, tell us. We decide.
- Don't write Core code for us (see STYLE.md). Help step by step instead.
- Never tick requirements, write test results, REFLECTION.md or LLM_PROCESS.md.
- Everything in English.
- Remind us of the end-of-session ritual (Section 6) when we finish.

## 2. Project
React Native (Expo) + TypeScript · Open-Meteo + geocode.maps.co · Android Emulator · Target grade: A
Solo project: _[name]_ · Presentation: _[date]_
Code: https://github.com/svanbergaddi/WeatherApp_KTH

## 3. Requirements
| ID | Requirement | Done |
|---|---|---|
| W-01 | Home: search by place name or coordinates, show current weather + 7 days | x |
| W-02 | Detail screen for a selected day (temp, condition, wind, rain…) | x |
| W-03 | Favourites + a favourites screen | x |
| W-04 | Settings: refresh rate + UI preferences | x |
| W-05 | Fetch forecast from Open-Meteo | x |
| W-06 | Temperature + weather icon for each of 7 days | x |
| W-07 | Hourly for today, daily for the rest | x |
| W-08 | Place name → coordinates via maps.co | x |
| W-09 | Cache last data. Offline: show message + cached data | x |
| W-10 | Works in portrait and landscape | x |
| W-11 | Separate parser: JSON → our own model | x |
| W-12 | Forecast in a scrollable list | x |
| W-13 | Coordinate input only accepts valid numbers | x |
| W-14 | Network calls never block the UI | x |
| W-15 | All errors handled: no crash, no blank screen | x |
| W-16 | Passing tests: parsing, error state, data transformation | x |
| W-17 | 20 UX scenarios in the test report | x |
| W-18 | Clear layers: network, parsing, state, UI | x |
| W-19 | Designed UI incl. loading/error/offline states | x |
| W-20 | Two fast searches never show the wrong city | x |
| W-21 | Suggestions pop up after typing 2+ letters (wait ~400 ms after typing stops) | x |
| W-22 | Empty home screen shows quick-pick cities: Stockholm, Gothenburg, Malmö, Copenhagen, Reykjavík, Hafnarfjörður, Akureyri | x |

**What makes our app different: weather for the Nordics**
| ID | Requirement | Done |
|---|---|---|
| W-23 | Wind: "feels like" temperature + a clear warning when gusts are strong | x |
| W-24 | What to wear: one line from temp, wind and rain ("Jacket + hat, no umbrella") |  |
| W-25 | Compare two cities side by side | x |
| W-26 | Daylight: sunrise, sunset and minutes gained/lost since yesterday |  |
| W-27 | Auto theme: "Nordic night" from 30 min after sunset until sunrise, using the phone's location (falls back to the viewed city) | x |
| W-28 | Seasonal light themes (winter, spring, summer, autumn) chosen by date + hemisphere | x |
| W-29 | Settings: theme = Auto (default) / Always light / Always night | x |
| W-30 | Animated scene per theme (aurora, snow, birches, sea, leaves) + daylight arc. Animations stop when "reduce motion" is on. | x |

## 4. Component specs
One spec per section (its ViewModel = the main process), written before building it. Small helpers are covered by their tests instead.
Only Forecast followed this from the start. The other sections' specs were written afterwards, from the finished code, and say so.
I forgot about these half way through but felt like this was a great summary of the most important functionalities

```
### Name (file)
- Does:
- In / out:
- Edge cases:
- Tests:
- Reqs:
```

### `Parse_Forecast` (`src/Forecast/ForecastHelpers.ts`)
- Does: turns Open-Meteo JSON into our `Forecast` model
- In / out: raw JSON → `Forecast` or a parse error
- Edge cases: missing `daily` block, `null` values
- Tests: valid response, missing field
- Reqs: W-05, W-11

### Forecast: `useForecastViewModel` (`src/Forecast/ForecastViewModel.tsx`)
- Does: main process for the forecast. On start it shows the cached forecast, then refreshes it. `Process_LoadForecast(place)` runs fetch → parse → show → save the cache. It hands the screen ready-made values (wind warning, outfit, daylight change, today's hours, 7 days).
- In / out: a `Place` → state `{ status, place, forecast, view, message, savedAt }`
- Edge cases: offline (show the cache + a message), a new place picked while loading (cancel the old request, ignore old answers), no cache + error (error state, never the wrong city)
- Tests: `Format_ErrorMessage` with Jest. The hook by hand on the phone (see docs/TEST_REPORT.md).
- Reqs: W-01, W-09, W-14, W-15, W-20

### Search: `useSearchViewModel` (`src/Search/SearchViewModel.ts`) _(written afterwards)_
- Does: suggestions while typing: our own cities at once, maps.co after a 400 ms pause (at least 1 s between calls). Enter opens the first match. Picking a place hands it on (`onPlaceSelected`). Also the coordinate input.
- In / out: typed text → `{ query, suggestions, isSearching, message }`; a picked `Place` → `onPlaceSelected(place)`
- Edge cases: fewer than 2 letters (no search), half a word (no "not found" until Enter), same city twice (one shown), same name in different places (more detail, never a postcode), maps.co down (keep our own matches), no location permission (maps.co's order)
- Tests: `Parse_Places`, `Validate_Coordinates`, `Calc_LocalMatches`, `Calc_MergeSuggestions`, `Calc_SortByDistance`. UX 1–10.
- Reqs: W-08, W-13, W-20, W-21, W-22

### Favourites: `FavouritesProvider` (`src/Favourites/FavouritesViewModel.tsx`) _(written afterwards)_
- Does: one shared list of saved places, loaded when the app starts. The star adds or removes a place, and the list is saved on the phone.
- In / out: a `Place` → the updated list (saved); `Process_IsFavourite(place)` → true/false
- Edge cases: the same city from a quick pick and from a search (within 1 km = the same favourite), a tap before the saved list is loaded (ignored, so the save can't be wiped), a broken save (empty list)
- Tests: `Calc_IsSamePlace`, `Calc_ToggleFavourite`, `Calc_IsFavourite`. UX 14–15.
- Reqs: W-03

### Settings: `SettingsProvider` (`src/Settings/SettingsViewModel.tsx`) _(written afterwards)_
- Does: one shared copy of the settings (refresh rate, theme choice), with defaults until the saved ones are read. A change is saved at once.
- In / out: `Process_ChangeSetting(key, value)` → updated `Settings` (saved)
- Edge cases: first start (defaults), a broken or old save (each field checked, a bad field gets its default), a change before loading (ignored)
- Tests: `Parse_Settings`. UX 21–22.
- Reqs: W-04, W-29

### Compare: `useCompareViewModel` (`src/Compare/CompareViewModel.ts`) _(written afterwards)_
- Does: two cities side by side. The left starts with the city shown on home (no extra API call). A picked city goes into the active side. The differences are calculated when both are ready.
- In / out: a `Place` + the active side → `{ slots, activeSide, comparison }`
- Edge cases: one side still loading or failed (the other side still works), a new city picked while one side loads (its own race guard), tiny differences ("about the same", never −0)
- Tests: `Calc_CompareCities`, `Format_ComparisonSentences`. UX 25.
- Reqs: W-25

### Theme: `ThemeProvider` (`src/Theme/ThemeViewModel.tsx`) _(written afterwards)_
- Does: picks the palette for the whole app: Nordic night from 30 min after sunset until sunrise (Auto), otherwise the season's light palette. Fetches the sun times for the phone's location (else the viewed city) and checks the clock every minute.
- In / out: theme choice + place + now → one `AppTheme` for every screen
- Edge cases: polar night (always night), midnight sun (always light), no location and no city (light), sun times failed (keep the old ones, never an error), a new day (fetch again), southern hemisphere (seasons flipped)
- Tests: `Parse_SunTimes`, `Calc_ThemeMode`, `Calc_Season`, `Calc_SunProgress`, `Calc_Spread`. UX 22–24.
- Reqs: W-27, W-28, W-29, W-30

## 5. Decisions
| Date | Decision | Why |
|---|---|---|
| 2026-11-16 | Expo + TypeScript | Used it in B:1, no Mac for iOS |
| 2026-11-16 | Open-Meteo | Gives hourly + daily directly, no key |
| 2026-11-17 | Quick-pick cities have hardcoded coordinates | No search call needed, so they're instant and save maps.co requests |
| 2026-11-17 | Night theme uses phone location, falls back to viewed city | Feels right where you are, still works without permission |
| 2026-11-17 | Night ends at sunrise | Simple rule, easy to explain and test |
| 2026-11-17 | Sun times from Open-Meteo, not calculated ourselves | We already use the API. Solar maths would be a lot of code to defend. |
| 2026-11-17 | react-native-svg for scenes, built-in `Animated` for motion | Expo's standard drawing library. No animation library needed. |
| 2026-11-18 | Every failure becomes one `AppError` with a `kind` | Screens only handle one error type and pick a message from the kind |
| 2026-11-18 | Ask Open-Meteo for `past_days=1` | Gives yesterday's daylight, so we can show minutes gained/lost (W-26) |
| 2026-11-18 | maps.co key in `.env` (`EXPO_PUBLIC_`), not in the code | Keeps it off GitHub. It still ends up inside the app, which is OK for a free lab key. |
| 2026-11-18 | `null`, a missing field, or arrays of different lengths → the whole forecast is a parse error | Better to show an error than a wrong number. Simple to test. |
| 2026-11-18 | Group hours by the first 10 characters of the time, not `new Date()` | Times are already the city's local time. `new Date()` would move them into the phone's time zone. |
| 2026-11-18 | Wind warning uses gusts: strong ≥ 14 m/s, storm ≥ 21 m/s | Beaufort 7 and 9. Gusts are what knock you over, not the average wind. |
| 2026-11-18 | What to wear uses feels-like (≥18 t-shirt, ≥10 light jacket, ≥0 jacket, else winter jacket; hat <5, gloves <0; rain ≥0.5 mm) | Feels-like already includes wind chill. Umbrella → rain jacket when gusts are strong, because umbrellas break. |
| 2026-11-18 | Place name = as short as possible: place + town ("Östbergahöjden, Stockholm"), or place + region if the place is the town ("Paris, Texas"). Add suburb → region → country only when two results would look the same. Built from maps.co's `address` fields, never postcodes. Duplicates = closer than ~10 km. | Consistent and short. Earlier tries were too long or showed postcodes ("Älvsjö, 125 31, Sverige") or hid places (4 of 5 US Birminghams). |
| 2026-11-18 | "No place found" only after Enter, not while typing | A half word ("Birming") finds nothing on maps.co, but the place exists |
| 2026-11-18 | Coordinates: two separate fields, comma accepted as decimal point, checked with a pattern | Nordic users type "59,33". `Number('')` is 0, so `Number()` alone isn't enough. |
| 2026-11-18 | Race guard = cancel the old request + a request number | Cancelling stops the download. The number ignores an answer that already arrived. |
| 2026-11-18 | On error, show the cache only if it's for the same place, else an error state | Old data for the right city is fine (W-09). Data for the wrong city never is (W-20). |
| 2026-11-18 | ViewModels are React hooks (`useForecastViewModel`) | The screen just calls the hook. State lives in one place. |
| 2026-11-18 | Search waits 400 ms after typing, and at least 1 s between maps.co calls | W-21 typing pause + maps.co's limit of about 1 request/second (avoids 429) |
| 2026-11-18 | Keep coordinate input, but hidden until you tap "Use coordinates instead" | The PDF asks for it (home screen, "city name or coordinates", "only valid floating-point values"). City search stays the main feature. |
| 2026-11-18 | Suggestions = our own cities that start with the typed letters (instant, accents ignored) + maps.co results, same city within ~10 km shown once | maps.co only matches whole words. This way "Ha" finds Hafnarfjörður at once, and any other city still works. |
| 2026-11-18 | With location permission, search results are sorted closest first (haversine distance). Without it, maps.co's order. | "Årsta" should give your Årsta first. Location is a bonus: saying no never breaks search. |
| 2026-11-18 | Location is asked for when the search screen opens, using the last known position if it's under 10 min old, with low accuracy | Fast, and saves battery. Knowing the city is enough. |
| 2026-11-18 | Place names in English (maps.co `accept-language=en`) | The app is in English. Before, it mixed "Sverige" with "United States". |
| 2026-11-18 | Country shown only for places abroad (phone's country from `reverseGeocodeAsync`); always shown if we don't know the phone's country | "Årsta, Stockholm" needs no ", Sweden". "Birmingham, Iowa" is clearer with ", United States". |
| 2026-11-18 | Quick-pick cities store region + country and are named with the same rule as maps.co results; buttons still show the short name | Our cities hid maps.co's "Reykjavik, Iceland" as a duplicate and only had a bare name |
| 2026-11-18 | Favourites and forecast are shared with React Context (one Provider each in `_layout.tsx`) | Several screens use them. With plain hooks, each screen would get its own copy and they'd drift apart. |
| 2026-11-18 | Same favourite = closer than ~1 km | Quick pick and search give slightly different coordinates for one city, but Årsta and Östberga (2 km) are different places |
| 2026-11-18 | Settings: refresh Never/15/30/60 min (default 30), theme Auto/Light/Night (default Auto). Shared Context, saved on the phone. | W-04 + W-29. Defaults make the app work before anything is chosen. |
| 2026-11-18 | Saved settings are checked field by field (`Parse_Settings`); a broken or missing field gets its default | Storage only holds text. An old or broken save must never crash the app or wipe the other setting. |
| 2026-11-18 | English only for now. Maybe later: a translations file + a language setting (Svenska, Íslenska) | Not a lab requirement. maps.co already takes a language, so place names would follow. |
| 2026-11-18 | Compare: two slots, the left starts with the city shown on home (reused, no API call), differences are right − left | One fixed direction is easy to explain and test. Each side has its own race guard. |
| 2026-11-18 | All colours in `Shared/Theme.ts` (light + Nordic night) via `useAppTheme()`. "Auto" = light until the Theme section adds sunset. | Switching theme only swaps the palette, the screens don't change |
| 2026-11-18 | Weather icons are emoji from a WMO-code table (`Format_Weather`) | No icon library needed. The illustrated scenes come later with react-native-svg. |
| 2026-11-18 | Home shows the hours LEFT today (from the current hour), 7 days, and the "now" card. Landscape = two columns. | W-07, W-10. Past hours aren't useful. |
| 2026-11-18 | Day detail reads the SHARED forecast (no new API call); a date not in the forecast shows a message + Back | Always matches the home screen. An old link never crashes. |
| 2026-11-18 | Demos on eduroam: `npx expo start --tunnel` or the Android emulator | eduroam isolates devices, so the phone can't reach the laptop directly |
| 2026-11-18 | Compare = a table (each label once, two value columns) + the differences as sentences ("Stockholm is 4° warmer than Reykjavík"); "about the same" under 1° / 2 m/s | Easier to read than "+4.2". Tiny differences aren't worth reading. |
| 2026-11-18 | Settings has an About card crediting Open-Meteo (CC BY 4.0) and OpenStreetMap (ODbL) | Both licences require credit in the app |
| 2026-11-18 | Sun times as Unix timestamps (`timeformat=unixtime`), compared with the phone's clock | "Is it 30 min after sunset?" becomes a number comparison, no time zone conversion |
| 2026-11-18 | Polar night (0 s daylight) = night all day, midnight sun (24 h) = light all day, decided on `daylight_duration` | In polar night the API gives sunrise = sunset = midnight, which means nothing |
| 2026-11-18 | Theme: phone location, else the viewed city, else light. Sun times fetched again when the place (rounded to ~10 km) or the day changes; the clock ticks every minute and when the app comes back | Switches on time without fetching all the time. A failed fetch keeps the old sun times and never shows an error. |
| 2026-11-18 | Seasonal light palettes: winter ice blue, spring birch green, summer sea blue, autumn rust | W-28 |
| 2026-11-18 | Scenes: static picture in react-native-svg + moving parts as `Animated.View`s with the native driver (move, turn, scale, fade only) | Smooth on the UI thread. Animating SVG properties would run on the JS thread and stutter. |
| 2026-11-18 | Reduce motion checked once per scene (`useReduceMotion`) and passed down; every loop then stands still at a natural spot | W-30. One listener instead of one per snowflake. |
| 2026-11-18 | Particle positions from `Calc_Spread(index)`, not `Math.random()` | The scene looks the same on every redraw instead of jumping |
| 2026-11-18 | Daylight arc on the "now" card from `Calc_SunProgress` (the city's local times, 0 = sunrise … 1 = sunset, null = sun down / polar) | W-30. Same local-text trick as the rest of the forecast. |
| 2026-11-18 | Settings has a Scene preview (all 5 scenes); only on that screen, never saved, doesn't change the theme | Otherwise only today's season can be shown at the exam |
| 2026-11-18 | Error messages name the service that failed (`Format_ErrorMessage(error, 'search')`): "The place search had a problem" vs "The weather service…" | Found while writing the test report: a maps.co error was blamed on the weather service |
| 2026-11-18 | Compare: search at the top (suggestions above the keyboard); picking a place closes the keyboard (both screens) | Found on the iPhone: at the bottom, the keyboard covered the suggestions |
| 2026-11-23 | Claude set up a template draft for docs/LLM_PROCESS.md from our sessions | My decision. I worked from the template and filled in the sections myself. REFLECTION.md is written by me alone. |
| 2026-11-18 | Tests use saved real responses (`__tests__/fixtures/`), never the network | Tests are fast and give the same result every time |

## 6. End-of-session ritual
1. Update the log below.
2. Tick requirements I can explain.
3. Add new decisions to Section 5.
4. Fill in the oral exam map.
5. Write in docs/LLM_PROCESS.md and docs/REFLECTION.md.

## 7. Oral exam map
The 30 questions from the lab PDF. The exam always opens with **Q26**. Paths are under `src/`. Tests are in `__tests__/` (`describe` name). "UX n" = scenario n in docs/TEST_REPORT.md.

**Data & networking**
| Q | Where in the code | Test |
|---|---|---|
| 1 API request | `API_GetForecast` (Forecast/ForecastService.ts) → `API_FetchJson` (Shared/HttpClient.ts). Returns raw JSON (`unknown`) or throws `AppError`. Also `API_SearchPlaces`, `API_GetSunTimes`. | UX 1. Every error kind checked live against the real servers. |
| 2 Parsing | `Parse_Forecast` → `Parse_Current/Hourly/Daily` + `readNumberArray` (Forecast/ForecastHelpers.ts). `Parse_Places` (Search/SearchHelpers.ts). | `Parse_Forecast: valid response` · `Parse_Places` |
| 3 Fields used / ignored | `CURRENT_FIELDS`, `HOURLY_FIELDS`, `DAILY_FIELDS` (Forecast/ForecastService.ts) → our model in Shared/Types.ts. maps.co: only `display_name`, `lat`, `lon`, `address` (`Parse_Place`). | `renames current fields…` |
| 4 HTTP 200, field missing | `readObject` / `readNumberArray` throw `AppError('parse')` → caught in `Process_LoadForecast` → cache or error banner | `Parse_Forecast: broken response gives a parse error` |
| 5 Search → screen | `SearchBox` → `Process_SubmitQuery` / `Process_FetchSuggestions` (Search/SearchViewModel.ts) → `API_SearchPlaces` → `Parse_Places` → `Process_SelectPlace` → `Process_LoadForecast` (Forecast/ForecastViewModel.tsx) → `Parse_Forecast` → state → `Process_BuildView` → `SearchScreen` → `CurrentWeatherCard` | UX 1, 2 |
| 6 Caching | `Storage_SaveForecast` / `Storage_LoadForecast` (Forecast/ForecastService.ts, key `lastForecast`): saved after every load, read on start (`Process_Start`) and on errors. Refreshed by `Process_AutoRefresh` (setting) and pull-to-refresh. Favourites + settings also saved. | UX 16, 19, 21 · `Parse_Settings` |

**State management**
| Q | Where in the code | Test |
|---|---|---|
| 7 Where data lives | `useState<ForecastState>` in `useForecastState` (Forecast/ForecastViewModel.tsx), shared through `ForecastProvider` in app/_layout.tsx | |
| 8 New city searched | `Process_LoadForecast`: old forecast kept only if `isSamePlace`, else cleared → spinner | UX 13, 18 |
| 9 UI knows about new data | `setState` → Context value changes → every screen calling `useForecastViewModel()` redraws. `view` = `useMemo(Process_BuildView)` | |
| 10 Preserved after leaving | Last forecast (shown at once by `Process_Start`), favourites, settings: all in AsyncStorage. Not saved: search text, Compare. | UX 19, 21 |
| 11 Loading / stale data | `status: 'loading'` set in `Process_LoadForecast`. `SearchScreen`: spinner (first load) or `RefreshControl` (reload). Stale answers dropped by `requestIdRef`. | UX 12 |
| 12 Race condition | `controllerRef` (cancel old request) + `requestIdRef` (only the newest answer counts) in `Process_LoadForecast`. Same in SearchViewModel and per side in CompareViewModel. | UX 13 (by hand) |

**Error handling**
| Q | Where in the code | Test |
|---|---|---|
| 13 Timeout | `API_FetchJson`: 10 s timer → `AppError('timeout')` → `Format_ErrorMessage` "…is slow right now" → `StatusBanner` | `Format_ErrorMessage` tests |
| 14 Network vs API error | `API_FetchJson` (Shared/HttpClient.ts): `fetch` throws → `network` / `timeout` / `cancelled`; `!response.ok` → `http` with status | `Format_ErrorMessage` tests · checked live against the real servers |
| 15 Offline, first start | No cache → `status: 'error'` → red `StatusBanner` "No internet connection." + Try again (Search/SearchScreen.tsx) | UX 18 |
| 16 Offline, second start | `Process_Start` shows the cache → refresh fails → catch block keeps the cache + orange banner "Last updated HH:MM" | UX 16, 19 |
| 17 Error state → UI | `ForecastState.status` + `message` (ForecastViewModel.tsx), kinds in `AppErrorKind` (Shared/Types.ts) → `Format_ErrorMessage` → `StatusBanner` | `Format_ErrorMessage` tests |
| 18 Hardest error case | _(your pick)_ Suggestion: the catch block of `Process_LoadForecast` (offline fallback + race guard + "never the wrong city") | UX 16, 18 |

**Architecture**
| Q | Where in the code | Test |
|---|---|---|
| 19 MVVM layers | View: `*Screen.tsx` + `Components/`. ViewModel: `*ViewModel.ts(x)` (`Process_` functions). Model: Shared/Types.ts + `*Service.ts` (`API_`, `Storage_`) + `*Helpers.ts` (`Parse_`, `Calc_`, `Format_`). See README. | |
| 20 No network in the View | Screens only call ViewModels. The network is in Services, so the cache, race guard and errors live in one place and can be tested. | |
| 21 Testable logic | `*Helpers.ts` are pure functions → `__tests__/` with saved responses. Hooks are harder, so `Process_BuildDayView` was exported to test it. | all 8 test files |
| 22 Navigation | expo-router: files in `app/` (`(tabs)/`, `day/[date].tsx`). `router.push` in `DailyList`, `router.navigate('/')` in `FavouritesScreen`. ViewModels never navigate: that's a View concern, and it keeps them screen-independent. | UX 11, 15 |
| 23 Requirement → code | e.g. W-23: `Calc_WindWarning` (ForecastHelpers.ts) → `windWarningNow` in `Process_BuildView` → badge in `CurrentWeatherCard` | `Calc_WindWarning` |
| 24 Add hourly forecast | Already there: `HOURLY_FIELDS` → `HourlyPoint` → `Parse_Hourly` → `Calc_GroupByDay` → `HourlyStrip` / `HourlyList`. A new field = one line in each layer. | `Calc_GroupByDay`, `Calc_HoursFromNow` |

**AI & LLM usage**
| Q | Where | Test |
|---|---|---|
| 25 An AI function, line by line | _(your pick, study it)_ e.g. `Calc_HoursFromNow` or `Calc_SortByDistance` | its tests |
| 26 **Opening:** SPEC → requirement → code | §1 of this file, then e.g. W-20 → `Process_LoadForecast` (ForecastViewModel.tsx) | UX 13 |
| 27 Where I pushed back | docs/LLM_PROCESS.md | |
| 28 How I verified AI code | Tests + mutation tests (docs/TEST_REPORT.md). E.g. the −0 bug, the polar night 00:15 test. | `Calc_DaylightChange`, `Calc_ThemeMode` |
| 29 Most effective prompt | _(your answer)_ docs/LLM_PROCESS.md | |
| 30 Do differently | _(your answer)_ docs/REFLECTION.md | |

## 8. AI usage
| What | Tool | How |
|---|---|---|
| Plan + first drafts of these files | Claude | We edited them |
| Expo setup + data layer (Types, HttpClient, Storage, Services) | Claude | Support code. We checked it in Postman. |
| `Calc_GroupByDay` (Core) + its tests | Claude | We asked for it. 1 mutation checked (caught). |
| `Calc_WindWarning` (Core) + its tests | Claude | We asked for it. 1 mutation checked (caught). |
| `Calc_WhatToWear` (Core) + its tests | Claude | We asked for it. 1 mutation checked (caught). |
| `useForecastViewModel`, `Format_ErrorMessage`, temporary test buttons on the home screen | Claude | Support code, step 3 |
| `useSearchViewModel`, quick-pick list, search controls on the test screen | Claude | Support code, step 3 |
| docs/LLM_PROCESS.md template draft | Claude | I used the draft to create my LLM_PROCESS file and fill into the sections set up in that draft|
| docs/TEST_REPORT.md: test file map + 25 UX scenarios with expected results (results left empty for us) | Claude | We run the scenarios and fill in Result/Pass ourselves |
| Scenes (W-30): 5 animated scenes, SceneBanner, FallingParticles, useLoop/useReduceMotion, DaylightArc, `Calc_SunProgress` + `Calc_Spread` + tests | Claude | UI + Core helpers with tests |
| Theme section: ThemeHelpers (`Parse_SunTimes`, `Calc_ThemeMode`, `Calc_Season`) + tests, ThemeService, ThemeViewModel, seasonal palettes | Claude | Core + Support. 3 mutations checked; one showed a weak test, fixed. |
| Step 4 part 3: designed Compare, Favourites, Settings screens; `Format_ComparisonSentences` + `Format_Duration` + tests | Claude | UI + Support |
| Step 4 part 2: day detail (`Process_GetDay`/`Process_BuildDayView` + tests, `Format_DaylightLength` + tests, DaySummaryCard, HourlyList) | Claude | UI + Support |
| Step 4 part 1: Theme.ts, Format_ helpers + tests, `Calc_HoursFromNow`, Card/StatusBanner/SearchBox, CurrentWeatherCard/HourlyStrip/DailyList, home screen, themed tabs | Claude | Boilerplate (UI) + Support. Format_ and Calc_ have tests. |
| Compare (`Calc_CompareCities`, ViewModel, test screen) | Claude | Step 3. 2 mutations checked (caught). |
| Settings (Service, `Parse_Settings`, shared ViewModel, auto-refresh timer, test screen) | Claude | Step 3. 1 mutation checked (caught). |
| Favourites (Service, Helpers, shared ViewModel, test screens), forecast made shared | Claude | Step 3. 2 mutations checked (caught). |
| English place names, country only abroad, re-saved maps.co test responses in English | Claude | Our idea. 1 mutation checked (caught). |
| expo-location, `Device_GetLocation`, `Calc_SortByDistance` + `Calc_DistanceKm` (Core) + their tests | Claude | Our idea: closest result first. 1 mutation checked (caught). |
| `Calc_LocalMatches`, `Calc_MergeSuggestions` (Core) + their tests | Claude | We chose the design. 2 mutations checked (caught). |
| `Format_ErrorMessage` tests | Claude | We asked for them. 1 mutation checked (caught). |
| `Parse_Places`, `Validate_Coordinates` (Core) + their tests | Claude | We asked for them. 2 mutations checked (caught). |
| `Calc_DaylightChange` (Core) + its tests | Claude | We asked for it. A test found a real bug (−0); fixed. 1 mutation checked (caught). |
| `Parse_Forecast` tests | Claude | We asked for them. 2 mutations checked (both caught). |
| `Parse_Forecast` (Core) | Claude | We asked for the full solution, to keep the style consistent. We must be able to explain every line. |

## 9. Session log
| Date | What we did | Next |
|---|---|---|
| 2026-11-16 | Plan + context files | Set up the Expo project |
| 2026-11-17 | Expo project, routes, placeholder screens, Jest | Data layer |
| 2026-11-18 | Data layer + saved API responses, checked in Postman, `.env` key. All Core helpers (Forecast + Search) with 42 tests. | Step 3: ViewModels, starting with `ForecastViewModel` |
| 2026-11-18 | Step 3: ViewModels for Forecast, Search, Favourites, Settings, Compare (shared ones via Context). Search: own cities + maps.co, short names, closest first, English. expo-location. 88 tests. | Try everything on the phone. Then the Theme section or step 4 (UI). |
| 2026-11-18 | Step 4: all screens designed (home, day detail, compare, favourites, settings), themed light/night, landscape, every state. 116 tests. | Theme section (W-27, W-28, W-30), then step 5 (test report) and step 6 (docs) |
| 2026-11-18 | Theme section: auto Nordic night (30 min after sunset → sunrise, polar night/midnight sun), seasonal palettes by month. Scenes (W-30): 5 animated scenes, reduce motion, daylight arc, scene preview in Settings. Seasons kept by month (not temperature). | Step 5: test report |
| 2026-11-18 | Step 5: docs/TEST_REPORT.md (25 UX scenarios, results for me to fill in). Fixes: search errors name the place search; Compare search moved to the top (keyboard covered it on iPhone). 139 tests. | Run the scenarios, step 6: docs |
| 2026-11-23 | Step 6: README.md (architecture) was generated and the TEST_REPORT.md was updated after performing all the tests. A LLM_PROCESS.md draft was set up and I filled it out| 
| 2026-11-23 | Step 7: The reflections were written| 