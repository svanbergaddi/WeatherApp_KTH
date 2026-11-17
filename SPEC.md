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

## 6. End-of-session ritual
1. Update the log below.
2. Tick requirements we can both explain.
3. Add new decisions to Section 5.
4. Fill in the oral exam map.
5. Write in docs/LLM_PROCESS.md and docs/REFLECTION.md.

## 7. Oral exam map
| Q | Where in the code | Test |
|---|---|---|
| 1 API request | | |
| 2 Parsing | | |
| 5 Search → screen | | |
| 12 Race condition | | |
| 26 This file → code | | |
_(add the rest as we go)_

## 8. AI usage
| What | Tool | How |
|---|---|---|
| Plan + first drafts of these files | Claude | We edited them |

## 9. Session log
| Date | What we did | Next |
|---|---|---|
| 2026-11-16 | Plan + context files | Set up the Expo project |
