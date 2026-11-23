# LLM_PROCESS.md

How I used an AI assistant to build the Weather app (CM2023 Lab B:2), 16–23 November 2026.

> This document was drafted by Claude at my request, from what happened in our sessions. I have read it, and the parts marked _[me]_ are mine to fill in.

## 1. Tools

| Tool | Used for |
|---|---|
| **Claude** (Anthropic, Claude Opus 5.5, in the Claude desktop app) | Planning, writing code and tests, explaining code, finding bugs |
| **Postman** | Checking both APIs myself before using them in code, and saving real responses as test data |
| **iPhone with Expo Go** | Trying every step on a real phone |

## 2. How I set the AI up

Before any code, I had the AI draft four context files, which it re-reads at the start of every session:

- **SPEC.md:** requirements W-01 to W-30, decisions, an AI usage table, a session log, and the oral exam map.
- **STYLE.md:** naming rules, the MVVM folder structure, and who writes what.
- **CONTEXT.md:** course facts, the allowed libraries, and API notes.
- **AGENTS.md:** rules for the AI. It should act as a tutor, not write Core code, never tick requirements or write test results, and only use English.

The first drafts were too long and detailed for me to read and maintain, so I asked for them to be shortened.

**Code tiers (STYLE.md):**
- **Core:** parsers, calculations and validation. Planned to be written by me, with the AI using a "hint ladder": idea → questions → pseudocode → skeleton → review → full solution only if asked.
- **Support:** services, ViewModels and tests. Shared.
- **Boilerplate:** UI and config. The AI could write it.

**Naming rules I asked for:** UpperCamelCase files, and functions named `Prefix_VerbNoun` (`API_GetForecast`, `Parse_Forecast`, `Calc_WindWarning`, `Process_LoadForecast`…). That style comes from my UIPath background, where a main process calls named sequences. I also asked for code I can navigate by Ctrl+clicking from one function to the next.

## 3. What I asked for, and what the AI did

| Phase | My input and decisions | What the AI did |
|---|---|---|
| Plan | Chose Expo + TypeScript, Open-Meteo + geocode.maps.co, and the higher grade. Asked for suggestions after 2 letters and quick-pick Nordic cities. Asked what would make the app worth using over other weather apps. | Wrote the plan. Proposed four unique features (wind feels-like + gust warning, what to wear, compare two cities, daylight), all of which I accepted. |
| Themes | My idea: a "Nordic night" theme that switches on automatically 30 minutes after sunset where I am, plus seasonal light themes. Decided night ends at sunrise, and that the phone's location is used with the viewed city as a fallback. | Planned it, showed palettes, and suggested react-native-svg for illustrated scenes when I asked for more complex graphics. |
| Setup + data layer | Checked both APIs in Postman myself and saved the real responses. | Set up the Expo project, the HTTP client with typed errors, storage, and the API calls. Checked every error type against the real servers. |
| Core helpers | We started on `Parse_Forecast` with the hint ladder. I found the guiding questions too vague and not about understanding the code, and asked the AI to write it instead, so the style stays consistent. | Wrote `Parse_Forecast`, then all the other Core helpers I asked for, each with tests. Logged each one in SPEC.md as AI-written Core code. |
| ViewModels (step 3) | Approved each design. Decided English only for now (no translations), and to keep the coordinate input, but hidden. | Wrote the ViewModels for Forecast, Search, Favourites, Settings and Compare. Explained why some are shared (React Context) and some aren't. |
| UI (step 4) | Asked for Compare to show the cities side by side. | Designed all the screens, every loading/error/offline state, and landscape. |
| Theme + scenes | Asked for a scene preview, so I can show all five scenes at the exam. Decided seasons stay by month rather than by temperature. | Wrote the sunset logic, the seasonal palettes, five animated scenes, the reduce-motion support, and the daylight arc. |
| Test report (step 5) | I run the scenarios and fill in the results myself. | Wrote 25 UX scenarios with expected results, and left the result columns empty. |

## 4. Where I steered the design

These came from me, mostly from using the app on my phone and noticing something wrong:

- **Search names should be short and consistent.** When I typed "Älvsjö", I couldn't tell which result was mine, and postcodes were showing. I suggested looking at the structure of the API's JSON to decide the output, and showing only as much as needed: "Östbergahöjden, Stockholm", with more detail only when two results look the same.
- **Closest first:** with location access, a search like "Årsta" should show the nearest Årsta first.
- **Country, in English:** "Birmingham, Alabama" should say the country, but only for places abroad, and place names should be in English.
- **Missing country for Reykjavík:** I asked why it didn't show. The cause was that our own quick-pick list hid the API's properly named result.
- **The coordinate input should be hidden,** but still there for the exam.
- **Compare side by side,** and moving its search to the top, because the iPhone keyboard covered the suggestions.

## 5. How I checked the AI's work

- **Unit tests:** 139 tests in 8 files, all using saved real API responses (`__tests__/fixtures/`), so they never call the internet.
- **Mutation tests:** the code was broken on purpose once per key function to check that a test fails. Once, a broken rule (polar night in the night theme) made **no** test fail. That showed a test was too weak, and a new test was added for that exact case.
- **Testing against the real APIs** found bugs the unit tests had missed:
  - maps.co only matches whole words, so "Reykjav" finds nothing. The fix mixes our own cities with maps.co results.
  - "Birmingham" returned 6 places, but only 2 were shown.
  - Postcodes appeared in place names.
  - "No place found" showed while I was still typing.
  - A search error was described as a weather-service error.
- **Using the app on my iPhone** found:
  - an old version still running after a library install, which needed a clean restart
  - the keyboard covering the Compare search
  - the app timing out on a "Public" Wi-Fi network, and later eduroam, which isolates devices. The fix was `--tunnel` or the Android emulator.
- **Type checking and builds:** after each change the AI ran the TypeScript check, the tests and an Android/iOS build before telling me it was done.

## 6. Who wrote what

| Part | Written by | My part |
|---|---|---|
| Context files, plan | AI drafts | I set the goals, shortened them, and made the decisions |
| Support code (HTTP, storage, services, ViewModels) | AI | I approved the designs and tested in the app |
| **Core helpers** (`Parse_`, `Calc_`, `Validate_`, `Format_`) | **AI, at my request** (planned as mine) | I decided the rules e.g. place names, closest first, seasons by month |
| UI, themes, scenes | AI | I decided what they should do and how they should look, and tested on the phone |
| Unit tests | AI, at my request | I re-run them and re-do mutation tests myself |
| UX scenarios: results | **Me** | Went through all the scenarios and confirmed that it worked |
| REFLECTION.md | **Me** | |



## 7. What worked and what didn't

**Worked well:**
- Fixed naming rules (`Prefix_VerbNoun`) made the AI's code easy to follow with Ctrl+click.
- Asking the AI to log decisions and AI usage as we went, instead of reconstructing them at the end.
- Testing against the real APIs and on the real phone after every step.
- Saving real API responses as test data.

**Didn't work as planned:**
- The first context files were far too long.
- The pop up of the name when searching was inconsistent, sometimes the only way to distinguish where the forecast was located was the post code. 

## 8. My own notes 

- How I studied the AI-written code before the exam: We broke the process into steps (which can be followed in spec md), which enabled me to see the core function off the code be built, and then once that was up and functioning we added the code for each view step by step which helped with building a mind map for the code. 
- A place where I disagreed with the AI or changed its suggestion: I wanted to have the context file well structured, shorter and more readable. I specified afterwards how I wanted the naming pop up conventions to be but managed to structure it in a way I liked, closest first, city-(state)-country, doesn't show country if it is the country you are in. I wanted the coordinate menu to be less visible since that is not likely to be a popular feature even though it was required. 
