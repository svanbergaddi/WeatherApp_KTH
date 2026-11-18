# EXAM_NOTES.md

Short stories and "why" answers worth telling at the oral exam. Add one line whenever something interesting happens.

## Bugs our tests found
| Date | Function | What happened |
|---|---|---|
| 2026-11-18 | `Calc_DaylightChange` | A 10-second loss rounded to `-0` in JavaScript, so the screen would show "−0 min". A test caught it. Fix: `minutes === 0 ? 0 : minutes`. |

## Things we found by testing against the real API
| Date | Found | What we did |
|---|---|---|
| 2026-11-18 | "Birmingham" returns 6 places, but we only showed 2. We shortened names to "place, country", so all 5 US ones became "Birmingham, United States" and the duplicate filter removed 4. | Names now keep the region. Duplicates are found by distance (< ~10 km), not by name. Saved the real response as a test (`mapsco-birmingham.json`). |
| 2026-11-18 | "Älvsjö" showed as "Älvsjö, 125 31, Sverige". maps.co's display_name contains postcodes, so "second-to-last part" wasn't always the region. | Names are now built from maps.co's `address` object (city, county/state, country by field name), not by position in the text. Saved as a test (`mapsco-alvsjo.json`). |
| 2026-11-18 | "Reykjavik" showed without ", Iceland". Our own quick-pick city came first with a bare name, and the merge removed maps.co's properly named result as a duplicate. | Quick-pick cities now store region + country, and are named with the same `Format_PlaceName` rule. One rule for every name in the list. |
| 2026-11-18 | Pausing mid-word ("Birming") showed "No place found", even though the place exists. | "No place found" now only shows after Enter. |
| 2026-11-18 | maps.co only matches whole words: "Reykjav" finds nothing, and "Stockh" finds a street in Germany. Suggestions after 2 letters (W-21) can't come from maps.co alone. | We mix them: our own cities that start with the typed letters show at once, and maps.co's results are added after the pause. |

## Mutation tests (broke the code on purpose, a test failed)
| Function | What we broke | Tests that failed |
|---|---|---|
| `Parse_Forecast` | removed the length check | 1 |
| `Parse_Forecast` | flipped `is_day` (`=== 0`) | 2 |
| `Calc_GroupByDay` | `slice(0, 13)` instead of `slice(0, 10)` | 2 |
| `Calc_WindWarning` | `>` instead of `>=` | 1 |
| `Calc_WhatToWear` | swapped umbrella and rain jacket | 3 |
| `Calc_DaylightChange` | swapped today and yesterday | 4 |
| `Validate_Coordinates` | latitude limit 900 instead of 90 | 1 |
| `Parse_Places` | removed the duplicate filter | 1 |
| `Format_ErrorMessage` | checked for 430 instead of 429 | 1 |
| `Calc_LocalMatches` | `includes` instead of `startsWith` | 2 |
| `Calc_LocalMatches` | removed the ð → d swap | 1 |
| `Parse_Places` | duplicates by name again (the old bug) | 2 |
| `Parse_Places` | county before state in the region | 2 |
| `Calc_ShortNames` | never add a level on a clash | 1 |
| `Format_PlaceName` | print levels in the order added, not small → big | 1 |
| `Calc_SortByDistance` | farthest first instead of closest | 1 |
| `Format_PlaceName` | show the country at home instead of abroad | 5 |
| `Calc_LocalMatches` | dropped the quick-pick region | 3 |

## Good "why" answers
- **Why `unknown` for API JSON?** TypeScript won't let us read a field until we've checked it, so bad data can't sneak past the parser.
- **Why not `new Date()` in `Calc_GroupByDay`?** The times are the city's local time. `new Date()` would move them into the phone's time zone.
- **Why gusts, not average wind?** A gust is what knocks you over or breaks your umbrella.
- **Why do helpers return levels/objects, not text?** The screen decides the wording. The helpers stay pure and easy to test (W-18).
- **Why a pattern in `Validate_Coordinates`, not just `Number()`?** `Number('')` is 0 and `Number('1e2')` is 100, so empty or odd text would slip through.
- **Why is "no places found" not an error in `Parse_Places`?** An empty list is a valid answer. The ViewModel decides to show "not found", and only after Enter, because while typing a half word finds nothing.
- **How do you name search results?** As short as possible, then only as long as needed. Everyone starts with the place + its town ("Årsta, Stockholm"), or + the region if the place is the town ("Paris, Texas"). If two results still look the same, both get one more level (suburb, then region, then country). We read named address fields, never the long text, so postcodes never show.
- **Why are same-name places within 10 km merged?** For a weather app they have the same forecast, and maps.co often returns one place twice (e.g. a locality and a road with the same name).
- **When is the country shown?** Only for places outside the phone's country. The phone's country comes from `reverseGeocodeAsync` (the phone's own map service, no maps.co call). If we don't know it (no permission), the country is always shown, because we can't tell what "abroad" is.
- **Why the haversine formula and not plain Pythagoras on lat/lon?** The Earth is round. This far north one degree of longitude is only ~55 km (Stockholm) but one degree of latitude is ~111 km, so a flat distance would sort wrongly.
- **What if the user says no to location?** `Device_GetLocation` returns null, and the list keeps maps.co's order. Location is a bonus, never required.
- **Why is the location in a ref, not state?** The screen never shows it. It's only read when the next list is sorted, so changing it shouldn't redraw the screen.
- **Why did unit tests miss the Birmingham bug?** The saved response only had one Reykjavík, so no test had two places with the same name. Testing against the real API found it, and now it's a saved test case.
- **How do two fast searches never show the wrong city? (W-20)** Each new search cancels the old request (AbortController) and gets a number. When an answer arrives, it's only used if its number is still the newest. Cancelling alone isn't enough, because an answer may already have arrived just before we cancelled.
- **What happens offline? (W-09)** The fetch fails as `network`, and the ViewModel loads the cache. If the cache is for the same place, it shows it with "No internet connection" + "last updated". Otherwise it shows the error state.
- **Why does the screen never call a helper?** The ViewModel (main process) calls the helpers in order and hands the screen finished values. The screen only displays them.
- **Can the user type coordinates? (W-01, W-13)** Yes. Home search takes a place name OR latitude + longitude. `Validate_Coordinates` checks those two fields, and that's where "Latitude must be between -90 and 90" comes from. maps.co results never go through it.
- **Why both a typing pause and a 1-second gap?** The pause (400 ms) waits for the user to stop typing. The gap respects maps.co's limit of about 1 request/second, so we don't get 429 errors.
- **Why do tests use saved responses?** They're fast, they work offline and give the same result every time. Jest even fakes `fetch`.
