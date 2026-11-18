# EXAM_NOTES.md

Short stories and "why" answers worth telling at the oral exam. Add one line whenever something interesting happens.

## Bugs our tests found
| Date | Function | What happened |
|---|---|---|
| 2026-11-18 | `Calc_DaylightChange` | A 10-second loss rounded to `-0` in JavaScript, so the screen would show "−0 min". A test caught it. Fix: `minutes === 0 ? 0 : minutes`. |

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

## Good "why" answers
- **Why `unknown` for API JSON?** TypeScript won't let us read a field until we've checked it, so bad data can't sneak past the parser.
- **Why not `new Date()` in `Calc_GroupByDay`?** The times are the city's local time. `new Date()` would move them into the phone's time zone.
- **Why gusts, not average wind?** A gust is what knocks you over or breaks your umbrella.
- **Why do helpers return levels/objects, not text?** The screen decides the wording. The helpers stay pure and easy to test (W-18).
- **Why a pattern in `Validate_Coordinates`, not just `Number()`?** `Number('')` is 0 and `Number('1e2')` is 100, so empty or odd text would slip through.
- **Why is "no places found" not an error in `Parse_Places`?** An empty list is a valid answer. The ViewModel decides to show "not found".
- **Why do tests use saved responses?** They're fast, they work offline and give the same result every time. Jest even fakes `fetch`.
