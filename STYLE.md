# STYLE.md

## Who writes what
| Tier | Examples | Who |
|---|---|---|
| Core | Helpers (parse, group by day, wind, wear, daylight), coordinate check | We write it. AI only helps and reviews. |
| Support | Services, ViewModels, tests | Shared. AI drafts small pieces we can explain. |
| Boilerplate | Screen layout, styling, config | AI can write it. |

## When we're stuck on Core code
The AI goes one step at a time: explain the idea → ask questions → pseudocode → empty function with TODOs → review our code. Full solution only if we ask.

## Structure: one folder per section
Each section has the same four layers:

| File | Role | Rule |
|---|---|---|
| `XScreen.tsx` | View | Only shows data and passes taps to the ViewModel |
| `XViewModel.ts` | Main process | Calls the steps in order and holds the state. No logic of its own. |
| `XService.ts` | Functions | Talks to the API or storage |
| `XHelpers.ts` | Helpers | Small pure functions with no fetch and no state. Easy to test. |

Sections: `Search`, `Forecast`, `Compare`, `Favourites`, `Settings`, plus `Shared` (HttpClient, Storage, Theme, Types).

## Naming
- **UpperCamelCase** for files, components, types and folders: `ForecastHelpers.ts`, `DayRow`, `Forecast`.
- **Functions: `Prefix_VerbNoun`**, so the reader knows what kind of work the function does from its name alone:

| Prefix | Means | Examples |
|---|---|---|
| `API_` | Calls an external API | `API_GetForecast`, `API_SearchPlaces` |
| `Parse_` | Raw JSON → our model | `Parse_Forecast`, `Parse_Places` |
| `Calc_` | Pure calculation | `Calc_GroupByDay`, `Calc_WindWarning`, `Calc_WhatToWear`, `Calc_DaylightChange` |
| `Validate_` | Checks user input | `Validate_Coordinates` |
| `Format_` | Model → text on screen | `Format_Temperature`, `Format_Time` |
| `Storage_` | Saves/loads on the phone | `Storage_SaveForecast`, `Storage_LoadFavourites` |
| `Process_` | Main process in a ViewModel: runs the steps in order | `Process_SearchCity`, `Process_RefreshForecast` |

  This is a guideline, not a law. Exceptions: React hooks must start with lowercase `use…` (`useForecastViewModel`), and small inline functions don't need a prefix.
- Variables are lowerCamelCase: `windSpeedMs`, `isLoading`.

## Easy to navigate (Ctrl+click)
Read a `Process_` function in a ViewModel, then Ctrl+click into the steps.
- Import functions directly from their own file. No `index.ts` files that only re-export.
- Call functions by name, not through objects or string lookups.
- Use TypeScript types everywhere so VS Code can follow every call.
- Put units in names: `temperatureC`, `windSpeedMs`.
- TypeScript, no `any`. Comments explain *why*.
- Colours and spacing come from `Shared/Theme.ts`.
