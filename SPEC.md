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
Team: _[name]_, _[name]_ · Presentation: _[date]_

## 3. Requirements
| ID | Requirement | Done |
|---|---|---|
| W-01 | Home: search by place name or coordinates, show current weather + 7 days | ☐ |
| W-02 | Detail screen for a selected day (temp, condition, wind, rain…) | ☐ |
| W-03 | Favourites + a favourites screen | ☐ |
| W-04 | Settings: refresh rate + UI preferences | ☐ |
| W-05 | Fetch forecast from Open-Meteo | ☐ |
| W-06 | Temperature + weather icon for each of 7 days | ☐ |
| W-07 | Hourly for today, daily for the rest | ☐ |
| W-08 | Place name → coordinates via maps.co | ☐ |
| W-09 | Cache last data. Offline: show message + cached data | ☐ |
| W-10 | Works in portrait and landscape | ☐ |
| W-11 | Separate parser: JSON → our own model | ☐ |
| W-12 | Forecast in a scrollable list | ☐ |
| W-13 | Coordinate input only accepts valid numbers | ☐ |
| W-14 | Network calls never block the UI | ☐ |
| W-15 | All errors handled: no crash, no blank screen | ☐ |
| W-16 | Passing tests: parsing, error state, data transformation | ☐ |
| W-17 | 20 UX scenarios in the test report | ☐ |
| W-18 | Clear layers: network, parsing, state, UI | ☐ |
| W-19 | Designed UI incl. loading/error/offline states | ☐ |
| W-20 | Two fast searches never show the wrong city | ☐ |
| W-21 | Suggestions pop up after typing 2+ letters (wait ~400 ms after typing stops) | ☐ |
| W-22 | Empty home screen shows quick-pick cities: Stockholm, Gothenburg, Malmö, Copenhagen, Reykjavík, Hafnarfjörður, Akureyri | ☐ |

**What makes our app different: weather for the Nordics**
| ID | Requirement | Done |
|---|---|---|
| W-23 | Wind: "feels like" temperature + a clear warning when gusts are strong | ☐ |
| W-24 | What to wear: one line from temp, wind and rain ("Jacket + hat, no umbrella") | ☐ |
| W-25 | Compare two cities side by side | ☐ |
| W-26 | Daylight: sunrise, sunset and minutes gained/lost since yesterday | ☐ |
| W-27 | Auto theme: "Nordic night" from 30 min after sunset until sunrise, using the phone's location (falls back to the viewed city) | ☐ |
| W-28 | Seasonal light themes (winter, spring, summer, autumn) chosen by date + hemisphere | ☐ |
| W-29 | Settings: theme = Auto (default) / Always light / Always night | ☐ |
| W-30 | Animated scene per theme (aurora, snow, birches, sea, leaves) + daylight arc. Animations stop when "reduce motion" is on. | ☐ |

## 4. Component specs
Write one before coding each part.

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
| 2026-11-18 | Place name = first + last part of display_name ("Reykjavíkurborg, Ísland"); duplicates removed | Short, but the country tells apart same-name places |
| 2026-11-18 | Coordinates: two separate fields, comma accepted as decimal point, checked with a pattern | Nordic users type "59,33". `Number('')` is 0, so `Number()` alone isn't enough. |
| 2026-11-18 | Tests use saved real responses (`__tests__/fixtures/`), never the network | Tests are fast and give the same result every time |

## 6. End-of-session ritual
1. Update the log below.
2. Tick requirements we can both explain.
3. Add new decisions to Section 5.
4. Fill in the oral exam map.
5. Write in docs/LLM_PROCESS.md and docs/REFLECTION.md.

## 7. Oral exam map
| Q | Where in the code | Test |
|---|---|---|
| 1 API request | `API_GetForecast` (Forecast/ForecastService.ts) → `API_FetchJson` (Shared/HttpClient.ts) | |
| 2 Parsing | `Parse_Forecast` (Forecast/ForecastHelpers.ts) | `__tests__/ForecastHelpers.test.ts` (12 tests) |
| 5 Search → screen | | |
| 12 Race condition | | |
| 26 This file → code | | |
_(add the rest as we go)_

## 8. AI usage
| What | Tool | How |
|---|---|---|
| Plan + first drafts of these files | Claude | We edited them |
| Expo setup + data layer (Types, HttpClient, Storage, Services) | Claude | Support code. We checked it in Postman. |
| `Calc_GroupByDay` (Core) + its tests | Claude | We asked for it. 1 mutation checked (caught). |
| `Calc_WindWarning` (Core) + its tests | Claude | We asked for it. 1 mutation checked (caught). |
| `Calc_WhatToWear` (Core) + its tests | Claude | We asked for it. 1 mutation checked (caught). |
| `Parse_Places`, `Validate_Coordinates` (Core) + their tests | Claude | We asked for them. 2 mutations checked (caught). |
| `Calc_DaylightChange` (Core) + its tests | Claude | We asked for it. A test found a real bug (−0); fixed. 1 mutation checked (caught). |
| `Parse_Forecast` tests | Claude | We asked for them. 2 mutations checked (both caught). |
| `Parse_Forecast` (Core) | Claude | We asked for the full solution, to keep the style consistent. We must be able to explain every line. |

## 9. Session log
| Date | What we did | Next |
|---|---|---|
| 2026-11-16 | Plan + context files | Set up the Expo project |
| 2026-11-17 | Expo project, routes, placeholder screens, Jest | Data layer |
| 2026-11-18 | Data layer + saved API responses, checked in Postman, `.env` key | Write `Parse_Forecast` + its tests |
