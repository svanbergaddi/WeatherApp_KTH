# PLAN.md

Expo + TypeScript · Open-Meteo + maps.co · aiming for A

## Steps
1. **Setup:** look at both APIs in the browser, save one response of each, create the Expo project, get the maps.co key.
2. **Data:** types → API calls → parsers → group by day → cache. Write tests as we go.
3. **State:** reducer for loading/success/error, favourites, settings. Ignore old responses after a new search.
4. **UI:** theme first, then Home, Detail, Favourites, Settings. Design the loading, error and offline states. Check landscape.
5. **Test:** run Jest, break the code once per key test to check that it fails, then go through 20 UX scenarios on the emulator.
6. **Docs:** README, test report, finish SPEC, LLM_PROCESS, reflection. Practise the oral questions (always starts with Q26).

## Theme plan (W-27, W-28, W-29)
**Themes.** One dark "Nordic night" theme (navy + aurora green/teal). Four light themes, one per season. Colours are picked in Phase 4 with a mockup.

**Seasons** (northern hemisphere; flip for latitude < 0):
Dec–Feb winter · Mar–May spring · Jun–Aug summer · Sep–Nov autumn

**New `Theme/` section:**
| File | Functions |
|---|---|
| `ThemeViewModel.ts` | `Process_UpdateTheme`: picks the theme and stores it for all screens |
| `ThemeService.ts` | `Device_GetLocation`, `API_GetSunTimes` (Open-Meteo `daily=sunrise,sunset,daylight_duration`) |
| `ThemeHelpers.ts` | `Calc_ThemeMode(now, sunTimes, setting)` → `light` / `night`, `Calc_Season(date, latitude)` |

**`Process_UpdateTheme` steps:**
1. Setting is "Always light" or "Always night"? → use it and stop.
2. Get the phone location. If permission is denied or there's no GPS → use the viewed city. If there's no city either (first launch) → light theme for the current season.
3. Get today's sunrise/sunset for that place (cache it for the day, so it also works offline).
4. `Calc_ThemeMode`: night if now is after sunset + 30 min or before sunrise.
5. `Calc_Season` picks which light theme to use.

**When it runs:** app opens · app comes back from the background · viewed city changes · a timer set to the next switch time.

**Edge cases:** midnight sun (no sunset → always light) · polar night (no sunrise → always night). Check `daylight_duration` = 0 or 24 h · location permission denied · offline.

**Scenes (W-30):** one component per theme in `Theme/Scenes/`: `NightScene`, `WinterScene`, `SpringScene`, `SummerScene`, `AutumnScene`. Drawn with react-native-svg (Boilerplate tier). The daylight arc uses `Calc_SunProgress(now, sunrise, sunset)` → 0–1 (Core, tested: before sunrise · midday · after sunset).

**Unit tests:** `Calc_ThemeMode`: before sunset+30 · after · after sunrise · polar night · midnight sun · setting overrides. `Calc_Season`: 17 Nov north = autumn · January south = summer · 1 Dec boundary.

## Testing
**Unit tests (Jest, `npm test`).** Only for `Parse_`, `Calc_` and `Validate_` functions. Write each test together with its function, not at the end.
- Tests go in `__tests__/` (e.g. `ForecastHelpers.test.ts`).
- Tests use saved real API responses in `__tests__/fixtures/` and never call the internet.

| Function | Test cases |
|---|---|
| `Parse_Forecast` | valid response · missing `daily` block · `null` value |
| `Parse_Places` | valid · empty list · `lat`/`lon` as strings |
| `Validate_Coordinates` | valid · out of range · letters · `59,33` with comma |
| `Calc_GroupByDay` | normal day · close to midnight |
| `Calc_WindWarning` | calm · strong gusts · exactly at the limit |
| `Calc_WhatToWear` | cold + windy · warm + rain |
| `Calc_DaylightChange` | gaining daylight · losing daylight |

**Mutation test.** Break each key function on purpose once, check that a test fails, then undo the change. Write down what you broke.

**UX scenarios.** Run at least 20 on the Android Emulator. Use airplane mode for the offline cases. Write them in `docs/TEST_REPORT.md` as: start state · action · expected · result.

## UX scenario ideas
Search city · no results · empty search · valid coordinates · invalid coordinates · open day detail · pull to refresh · add favourite · remove favourite · open favourite · first launch offline · offline with cache · lose network while refreshing · network comes back · API error · timeout · two fast searches · rotate screen · change units · change refresh rate · restart the app

## Watch out for
- maps.co allows about 1 request per second, so search on submit.
- Group days by the date string, not `new Date()`, to avoid timezone bugs.
