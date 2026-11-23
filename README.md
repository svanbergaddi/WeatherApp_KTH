# Weather: a Nordic weather app

CM2023 Lab B:2 · React Native (Expo SDK 58) + TypeScript · Open-Meteo (forecast) + geocode.maps.co (place search)

**Code:** https://github.com/svanbergaddi/WeatherApp_KTH

Search any place and get the current weather, today hour by hour, and 7 days. What makes it Nordic: a wind and gust warning, what to wear, daylight gained or lost since yesterday, comparing two cities, and a theme that turns into **Nordic night** after sunset, with an animated scene for every season.

## Run it

```
npm install
npx expo start            # then press a (Android emulator) or scan the QR code with Expo Go
npx expo start --tunnel   # on eduroam / public Wi-Fi, where the phone can't reach the laptop
npm test                  # 139 unit tests, no internet needed
npm run typecheck
```

Place search needs a free key from geocode.maps.co: copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_GEOCODE_KEY`.

## Architecture: MVVM, one folder per section

The app is split into **sections** (Search, Forecast, Compare, Favourites, Settings, Theme). Every section has the same layers, each in its own file:

| File | Layer | Responsibility | Rule |
|---|---|---|---|
| `XScreen.tsx` + `Components/` | **View** | Draws the screen and passes taps on | No logic and no network: only shows what the ViewModel gives it |
| `XViewModel.ts(x)` | **ViewModel** | The "main process": runs the steps in order and holds the state | Its `Process_` functions call the Service and the Helpers; it never draws anything |
| `XService.ts` | **Model: data access** | Talks to the outside world | `API_` functions (network), `Storage_` functions (the phone's storage) |
| `XHelpers.ts` | **Model: logic** | Pure functions: JSON → our model, calculations, input checks, text for the screen | `Parse_`, `Calc_`, `Validate_`, `Format_`; no network, no state, so they're unit tested |

`Shared/Types.ts` is **our own data model** (`Forecast`, `Place`, `AppError`…). The `Parse_` functions are the only code that knows the APIs' JSON shapes. Everything after them uses our types.

**Function names say what kind of work they do:** `API_GetForecast`, `Parse_Forecast`, `Calc_WindWarning`, `Format_Temperature`, `Process_LoadForecast`. From any screen you can Ctrl+click down through the layers.

### How the layers connect: searching for a city

```
SearchScreen (View)
  └─ SearchBox → useSearchViewModel().Process_SelectPlace(place)          Search/SearchViewModel.ts
        └─ useForecastViewModel().Process_LoadForecast(place)             Forecast/ForecastViewModel.tsx
              ├─ API_GetForecast(lat, lon)        → raw JSON              Forecast/ForecastService.ts
              │     └─ API_FetchJson               (timeout, cancel, typed errors)   Shared/HttpClient.ts
              ├─ Parse_Forecast(json)             → Forecast              Forecast/ForecastHelpers.ts
              ├─ setState(ready)                  → every screen using the forecast redraws
              ├─ Storage_SaveForecast             → cache for offline     Forecast/ForecastService.ts
              └─ Process_BuildView                → Calc_WindWarning, Calc_WhatToWear, Calc_DaylightChange, …
SearchScreen redraws → CurrentWeatherCard, HourlyStrip, DailyList (Forecast/Components/)
```

**Shared state:** the forecast, favourites, settings and theme are used by several screens, so each is a **React Context** with one copy for the whole app. The providers wrap the app in `src/app/_layout.tsx`, in this order: Settings → Forecast → Theme → Favourites. Each one can read the ones outside it. Search and Compare are plain hooks, because only their own screen uses them.

**Errors:** every failure becomes an `AppError` with a `kind` (`network`, `timeout`, `http`, `parse`, `notFound`, `invalidInput`, `cancelled`). `Format_ErrorMessage` turns it into one sentence, and `StatusBanner` shows it. With saved data the app shows the cache plus "Last updated HH:MM", and it never shows a blank screen.

**Race condition (two fast searches):** `Process_LoadForecast` cancels the previous request (`AbortController`) and numbers each request (`requestIdRef`). Only the newest answer is shown.

## Main files

| Section | Files | What they do |
|---|---|---|
| **app/** (routes) | `_layout.tsx`, `(tabs)/_layout.tsx`, `(tabs)/*.tsx`, `day/[date].tsx` | expo-router: one file per address. They only point to a screen. The root layout holds the providers. |
| **Search** (home) | `SearchScreen`, `Components/SearchBox`, `SearchViewModel`, `SearchService`, `SearchHelpers`, `QuickPickCities` | Search field with suggestions after 2 letters (our own cities instantly + maps.co), quick picks, hidden coordinate input. Short place names ("Årsta, Stockholm"), closest first. The home screen shows the forecast. |
| **Forecast** | `ForecastViewModel`, `ForecastService`, `ForecastHelpers`, `DayDetailScreen`, `Components/` (`CurrentWeatherCard`, `HourlyStrip`, `DailyList`, `DaySummaryCard`, `HourlyList`, `DaylightArc`) | Loading, cache, auto-refresh, the race guard. Parsing, grouping hours by day, wind warning, what to wear, daylight. Day detail. |
| **Compare** | `CompareScreen`, `CompareViewModel`, `CompareHelpers` | Two cities side by side, with the differences as sentences |
| **Favourites** | `FavouritesScreen`, `FavouritesViewModel`, `FavouritesService`, `FavouritesHelpers` | Save, remove and open places, stored on the phone |
| **Settings** | `SettingsScreen`, `SettingsViewModel`, `SettingsService`, `SettingsHelpers` | Refresh rate, theme choice, scene preview, data credits |
| **Theme** | `ThemeViewModel`, `ThemeService`, `ThemeHelpers`, `Scenes/` | Nordic night from 30 min after sunset until sunrise (phone location, else the viewed city), seasonal light palettes, five animated scenes that stop when reduce motion is on |
| **Shared** | `Types`, `HttpClient`, `Storage`, `Location`, `Theme`, `FormatHelpers`, `Components/` (`Card`, `StatusBanner`) | Our data model, network and storage wrappers, phone location, all colours, all screen text formatting |

## Tests

`__tests__/` has one test file per Helpers file. They use **saved real API responses** (`__tests__/fixtures/`), so they never call the internet (Jest also replaces `fetch`). The test plan, the UX scenarios and the mutation tests are in `docs/TEST_REPORT.md`.

## Project documents

| File | What |
|---|---|
| `SPEC.md` | Requirements W-01 to W-30, AI instructions, decisions, oral exam map, AI usage, session log |
| `STYLE.md` | Naming, folder structure, who writes what |
| `CONTEXT.md` · `PLAN.md` · `AGENTS.md` | Course facts and allowed libraries · the plan · rules for the AI assistant |
| `docs/TEST_REPORT.md` · `docs/LLM_PROCESS.md` · `docs/REFLECTION.md` | Test report · how AI was used · reflection |

## Data

Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Place search by geocode.maps.co, map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).
