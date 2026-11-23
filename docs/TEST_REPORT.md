# TEST_REPORT.md

Weather app, CM2023 Lab B:2. Two kinds of testing: automated unit tests (Jest) and manual UX scenarios (W-16, W-17).

> **Results are filled in by me after running the tests myself.** The AI wrote the scenarios and the expected results, never the results (SPEC.md §1).

## 1. Automated tests (W-16)

Run from the project folder:

```
npm test
```

| Test file | What it covers | Requirements |
|---|---|---|
| `ForecastHelpers.test.ts` | `Parse_Forecast` (valid response, missing block, short column, `null`, number as text) · `Calc_GroupByDay` (midnight) · `Calc_HoursFromNow` · `Calc_WindWarning` (limits) · `Calc_WhatToWear` (limits, rain + wind) · `Calc_DaylightChange` (−0 bug) · `Calc_SunProgress` (polar night) | W-05, W-07, W-11, W-23, W-24, W-26, W-30 |
| `SearchHelpers.test.ts` | `Parse_Places` (real Reykjavík, Birmingham, Älvsjö, Årsta responses; short names; no postcodes; country only abroad) · `Validate_Coordinates` (range, comma, letters, `1e2`) · `Calc_LocalMatches` · `Calc_MergeSuggestions` · `Calc_SortByDistance` · `Calc_DistanceKm` | W-08, W-11, W-13, W-21 |
| `FormatHelpers.test.ts` | Every `Format_` function: error messages for each error kind, temperature (−0), time, day name, weather codes, outfit, wind warning, daylight | W-06, W-15, W-19 |
| `ForecastViewModel.test.ts` | `Process_BuildDayView`: future day, today from now, first day, unknown date | W-02 |
| `FavouritesHelpers.test.ts` | Same place within 1 km, add/remove, no duplicates, old list unchanged | W-03 |
| `SettingsHelpers.test.ts` | `Parse_Settings`: defaults, broken or missing field, wrong types | W-04 |
| `CompareHelpers.test.ts` | `Calc_CompareCities` (right − left, rounding, −0, today not yesterday) · `Format_ComparisonSentences` | W-25 |
| `ThemeHelpers.test.ts` | `Parse_SunTimes` (real Stockholm + polar-night Longyearbyen) · `Calc_ThemeMode` (30 min after sunset, sunrise, polar night incl. 00:15, midnight sun) · `Calc_Season` (both hemispheres) · `Calc_Spread` | W-27, W-28, W-30 |

All tests use saved real API responses in `__tests__/fixtures/`. Jest also replaces `fetch`, so a test can never call the internet.

**Result:** _date: 23.11 · passed:  / 139 out of 139

**Mutation tests:** the code is broken on purpose, one line at a time, to check that a test fails, and then the change is undone. Re-run at least two yourself and note them here:

| Function | What I broke | Tests that failed |
|---|---|---|
| | | |
| | | |

## 2. UX scenarios (W-17)

Run on the Android Emulator (`npx expo start`, press `a`) or the phone (`npx expo start --tunnel` on eduroam).
Offline cases: airplane mode on the phone, or the emulator's network turned off.

| # | Start state | Action | Expected | Result | Pass |
|---|---|---|---|---|---|
| 1 | Home, online | Type `Gothenburg`, press Enter | The forecast for Gothenburg opens: now card, today's hours, 7 days (W-01, W-08) |  |P|
| 2 | Home, online | Type `Ha` | "Hafnarfjörður, Iceland" appears at once, before maps.co answers (W-21) | |P |
| 3 | Home, online | Type `Birmingham` and wait | 6 Birminghams, each with its region and country, e.g. "Birmingham, Alabama, United States" (W-21) | 7 Birmingham cities pop up, each on distinct with the state and country| P|
| 4 | Home, online | Type `Birming` and wait | No error. Only after Enter does "No place found" show (W-21) | |P |
| 5 | Home, online | Type `xqzwv`, press Enter | "No place found with that name." No crash, no blank screen (W-15) | |P |
| 6 | Home | Press Enter with an empty field, then with 1 letter | Nothing happens, no error (W-21) |The first letter stays in there after pressing enter |P |
| 7 | Home, location allowed | Type `Årsta` and wait | The Årsta closest to you is first. Names have no postcodes (W-21) |Was also showed to work when typing Birmingham also, shows England's Birmingham first, then the US cities |P |
| 8 | Home | Tap the quick pick `Reykjavík` | Its forecast opens instantly (W-22) | |P |
| 9 | Home | "Use coordinates instead" → `59,33` and `18,06` → Go | The forecast for "59.33 and 18.06" opens. The comma works as a decimal point (W-13) |Works, it does not give a city name (Stockholm central) but has the same forecast if looked at both place name and coordinates in the compare window. |P |
| 10 | Home | "Use coordinates instead" → `91` and `abc` → Go | "Latitude must be between -90 and 90." No forecast is loaded (W-13) | |P |
| 11 | Home with a forecast | Tap a day in the 7-day list | Day detail opens: summary + 24 hours. Back returns to home (W-02) | | P|
| 12 | Home with a forecast | Pull down | A spinner shows, the old data stays visible, the screen stays usable (W-14) | | P|
| 13 | Home, Reykjavík shown | Tap Reykjavík, then Stockholm quickly | Stockholm's forecast ends up on screen, never Reykjavík's (W-20) | |P |
| 14 | Home, a city shown | Tap ☆ → open Favourites | The star turns ★, the city is in the Favourites list (W-03) | |P |
| 15 | Favourites with 2 cities | Tap one, then come back and tap ✕ on the other | The tapped city opens on home. The removed one disappears (W-03) | |P |
| 16 | Stockholm shown, online | Airplane mode on → pull down | Orange banner "No internet connection. Showing saved data. Last updated HH:MM", data still shown (W-09) | |P |
| 17 | Scenario 16 | Airplane mode off → "Try again" | The banner disappears, fresh data shows (W-09) | |P |
| 18 | Airplane mode on | Tap a quick pick you have not opened before | Red banner with the error and "Try again". Never the old city's weather, never a crash (W-15, W-20) | | P|
| 19 | A city shown | Close the app completely, open it again | The last city shows at once, then updates (W-09) | | P|
| 20 | Home and day detail | Turn the phone sideways | Two columns, nothing cut off, everything scrolls (W-10) | |P |
| 21 | Settings | Pick "Every 15 minutes", close and reopen the app | "Every 15 minutes" is still ticked (W-04) | |P |
| 22 | Settings | Theme → "Always night" | The whole app turns dark: screens, tab bar, header, status bar. The aurora scene shows (W-29) | | P|
| 23 | Settings, theme "Auto" | Open the app more than 30 min after sunset | Nordic night by itself (within a minute if the app is open) (W-27) |Sunrise was at 8:00 and the app was in the Nordic night mode when I was working on it from 7:30-8:00, then it changed at sunrise at exactly 8:00 to autumn theme. | P|
| 24 | Settings, Scene preview | Tap through all 5 scenes. Then turn on Reduce Motion in the phone's settings | Every scene animates. With Reduce Motion, everything stands still (W-28, W-30) | |P |
| 25 | A city shown | Open Compare → tap the right side → pick Reykjavík | Left = your city, right = Reykjavík. Table filled, plus sentences like "X is 4° warmer than Y" (W-25) | | P|

**The unique features in scenarios:** suggestions (2–4, 7), wind warning + what to wear + daylight (look at the "now" card in 1), compare (25), themes and scenes (22–24).
