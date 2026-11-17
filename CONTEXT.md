# CONTEXT.md

## Course
- CM2023 Lab B:2, in pairs. Code is shown at the oral exam, not submitted.
- Submit: reflection + test report + README + SPEC + LLM_PROCESS, one day before the presentation.
- Test on the Android Emulator. A browser preview doesn't count.

## Libraries
Only Expo, expo-router, AsyncStorage, NetInfo and Jest. Ask before adding anything else.

## APIs
- **Forecast:** `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&hourly=..&daily=..&timezone=auto`
  - Data comes as parallel arrays (`time[]`, `temperature_2m[]`, …).
  - `weather_code` uses WMO codes.
- **Place search:** `https://geocode.maps.co/search?q=..&api_key=..`
  - Returns an array. `lat`/`lon` are strings.
  - Needs a free key. Keep it in `.env`, which is not committed.
- The KTH test server uses SMHI's format, so we don't use it.
