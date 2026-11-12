# TEST REPORT — 2026-11-11
**Environment:** Python 3.13, Node 22.16, Chromium system browser (headless) via Playwright. Source delivered as static HTML/CSS/JS.

### Passed checks
- `node --check app.js` — JavaScript parses.
- Headless Chromium **inline-injection** smoke test, viewport 390×844: seeded demo rendered, 3 cards; no horizontal overflow.
- Mobile form created a test record from ten entered values; line-specific result was Over 20.5: 6 hits/10 (60%).
- Open detail view displayed 6/10. Appended an independent agent review and confirmed it appeared.
- Tested in-page state re-init with a mocked `localStorage` shim; 4 records and 1 agent review remained.
- Export download returned a valid JSON `schema: j-nba-prop-intel` with the 4 expected records.
- Headless Chromium **inline-injection** desktop test, viewport 1280×800: 3 demo records, no horizontal overflow.
- In tested flows, no uncaught page JavaScript exceptions.

### NOT tested / limitations
- Browser navigation to `file://` and `localhost` both returned `ERR_BLOCKED_BY_ADMINISTRATOR` in this execution environment, so a real file/network-hosted page load was **not** tested.
- In smoke tests, the HTML/CSS/JS were injected directly and `localStorage` was shimmed to an in-memory Map; this is not an end-to-end proof of native persistence across browser sessions.
- No mobile Android device QA, full screenreader audit, actual live API connection, paid-provider integration, accuracy audit against real NBA boxes, or live Hub embed.
- No external deployment or automatic agent sync.

### Next test
Serve the static folder in a normal authorized browser and rerun `smoke_test.py` with working localhost navigation, then verify Android Chrome and persisted edits after full restart. Add test cases for whole-number pushes, DNP filtering, historical line movement, malformed imports and storage corruption.

---
# TEST REPORT — 2026-11-11 session 2 (Claude)
**Environment:** Linux container, Python 3.12.3, Node v22.23.4, Playwright 1.63.0 with Chromium 153.0.8010.12 (headless, `--no-sandbox`). Branch `agent/claude/real-browser-smoke-and-provider-contract`.

| Check | Command | Result |
|---|---|---|
| JS syntax | `node --check app.js` and `node --check odds-adapter.js` | PASS |
| Real `file://` page load, 390px and 1280px: render, add, exact-line hit rate, review append, reload, JSON export, no overflow, no page errors | `python3 smoke_test.py` (unmodified baseline `app.js`, then fixed `app.js`) | PASS both times |
| Real `http://127.0.0.1` load, **native localStorage persisted across a full browser close/reopen** | `python3 real_browser_test.py` | PASS |
| Push handling on exact line (line 20, values incl. three 20s → L5 2/3 decided, L10 3/5) | same | PASS |
| Corrupted storage → **new save preserved raw data in backup key** | same | PASS on fix; **FAIL (2 of 11) on original `app.js`**, i.e. the defect was reproduced and the test guards it |
| Backup impossible (quota error injected) → save refuses, raw data untouched | same | PASS |
| Malformed imports (not JSON, wrong schema, record missing fields) rejected with message, dataset unchanged | exploratory probe (not committed) | PASS |
| Adapter unit tests against MOCK fixtures | `node --test tests/adapter.test.js` | PASS 10/10 |
| Secret/PII scan of working tree | regex grep (keys, tokens, emails) | none found |

**Still NOT tested:** Android Chrome / real device; screen reader; any live provider call (none made, no key exists); import of valid-but-large payloads; concurrent tabs writing localStorage; the `index.html` UI consuming the adapter (not wired).
**Exploratory notes:** an import of a valid export with 0 records replaced the dataset with 0 records after confirmation (by design, see KNOWN-ISSUES #6). A saved record with 8 games displays a card heading "Last 20" with the same 8-game result (KNOWN-ISSUES #9).

---
# TEST REPORT — 2026-11-11 session 3 (Grok Bot)
**Environment:** Linux container, Python 3.13.5, Node v24.22.1, Playwright (project-local venv, not committed) driving `/usr/bin/google-chrome` headless via `CHROMIUM_PATH`. Branch `agent/grok-bot/odds-cli`, based on `agent/claude/real-browser-smoke-and-provider-contract` @ `c55bf13`. Session 2 tests were re-run and independently confirmed before this change, then again after.

| Check | Command | Result |
|---|---|---|
| JS syntax | `node --check app.js` `odds-adapter.js` `scripts/fetch-event-odds.js` | PASS |
| Adapter unit tests | `node --test tests/adapter.test.js` | PASS 10/10 (unchanged) |
| CLI offline acceptance | `node --test tests/*.js` (26 tests: 10 adapter + 16 CLI) | PASS 26/26 |
| Acceptance (1)–(7) | no key → exit 2, zero fetches; `--list` only `/events`; event URL has `oddsFormat=american` and requested markets, quota from headers; `TESTKEY123` / `apiKey` absent from snapshot and stdout/stderr; HTTP 401/422/429 → exit 1, message, no snapshot; `--max-cost` exceeded → exit 2, zero fetches; empty bookmakers → "No verified quote available", no snapshot | PASS |
| Extra guards | key echoed in a 401 body is redacted; default max-cost 3; cost equal to cap is allowed; unsupported market refused before fetch | PASS |
| Real `file://` + `http://127.0.0.1` smoke (390px and 1280px) | `CHROMIUM_PATH=/usr/bin/google-chrome python3 smoke_test.py` | PASS (MOBILE and DESKTOP) |
| Real-browser regression including corruption backup | `CHROMIUM_PATH=/usr/bin/google-chrome python3 real_browser_test.py` | PASS 11/11 |
| Secret/PII scan of new files | regex (keys, tokens, private key blocks) | only the documented fake `TESTKEY123` inside tests, never in snapshots or CLI output |
| Live Odds API `--list` and one `--event` call | no `ODDS_API_KEY` at the time that table was written | later completed — see session 3 live call section below |
| `node --test tests/` (bare directory, as written in the session-2 handoff) | Node v24.22.1 treats `tests/` as a module path and fails | use `node --test tests/*.js` instead |
| `J_Sports_Prop_Framework.md` (ChatGPT Library) | searched this computer; not present | **NOT ACCESSIBLE** this session |

**Still NOT tested:** Android Chrome / real device; screen reader; any live provider call; import of valid-but-large payloads; concurrent tabs; UI consumption of the adapter or snapshots. Generated `mobile-preview.png` / `desktop-preview.png` from smoke_test were discarded and not committed (originals remain in the Drive archive only).

---
# TEST REPORT — 2026-11-11 session 3 live call (Grok Bot)
**Environment:** same branch `agent/grok-bot/odds-cli` @ `fffa71f`, Node v24.22.1, `ODDS_API_KEY` set in the environment (value never printed, logged, or written to the repo). Snapshot path is git-ignored. America/Chicago.

| Check | Command | Result |
|---|---|---|
| Live `--list` (0 credits) | `node scripts/fetch-event-odds.js --list` | PASS, exit 0. 14 NBA events. stdout quota: `x-requests-last=0` `x-requests-remaining=500`. stderr empty. No `apiKey` in output. |
| Live one-event player-points (1 credit) | `node scripts/fetch-event-odds.js --event 37f4c00ff7ec01d5aa7c33dd1ac84bbc --markets player_points --regions us` | PASS, exit 0. Event: Boston Celtics at Toronto Raptors, `commence_time` 2026-11-12T00:10:00Z. Snapshot written (git-ignored) with `collectedAt` 2026-11-11T23:35:07.440Z. `quotes=256` `rejected=0` `estimatedCost=1` `x-requests-last=1` `x-requests-remaining=499`. 15 players, 6 books: betmgm, betonlineag, betrivers, bovada, draftkings, fanduel. Market on quotes is `Points` (mapped from `player_points`). All 256 quotes carry the 10 required provenance fields. `sourceUrl` is the request URL with no credential. CLI does not print the raw HTTP status; success is inferred from exit 0 + snapshot. |
| Key leakage | inspected stdout, stderr, and snapshot for `apiKey` and the key itself | none found |
| Snapshot committed? | `git status` shows `data/` ignored | not committed, as required |

**Still NOT tested:** `player_rebounds` and `player_assists` live; `--list` then a second event (not done, to conserve credits); Android Chrome; UI consumption of the snapshot; provider terms review.

---
# TEST REPORT — 2026-11-11 session 4 (Grok Bot) — Verify quote panel
**Environment:** Linux box, Node v24.22.1, Python 3.13.5, Playwright 1.65.0 in `/tmp/pw-venv` (not committed) driving `/usr/bin/google-chrome` headless via `CHROMIUM_PATH`. Branch `agent/grok-bot/verify-quote-panel` from `agent/grok-bot/odds-cli` @ `855254b`. Final run 2026-11-11 ~7:03 PM America/Chicago.
**Baseline before editing (on `855254b`):** `node --test tests/*.js` 26/26, `real_browser_test.py` 11/11, `smoke_test.py` MOBILE+DESKTOP PASS.

| Check | Command | Result |
|---|---|---|
| JS syntax | `node --check` on `app.js`, `odds-adapter.js`, `verify-quote.js`, `scripts/fetch-event-odds.js`, `scripts/build-single-file.js` | PASS |
| Unit tests | `node --test tests/*.js` | **PASS 39/39** (10 adapter + 16 CLI unchanged + 12 verify-quote + 1 build-sync) |
| Single-file build in sync | `node scripts/build-single-file.js --check` | PASS |
| Smoke, real `file://`, 390px + 1280px | `CHROMIUM_PATH=/usr/bin/google-chrome python3 smoke_test.py` | PASS (MOBILE and DESKTOP) |
| Real-browser regression | `CHROMIUM_PATH=/usr/bin/google-chrome python3 real_browser_test.py` | **PASS 23/23** (original 11 + 12 new) |

New real-browser cases (390px, `page.clock.set_fixed_time('2026-11-11T23:00:00Z')`, committed `fixtures/MOCK-snapshot.json`): (a) demo research file shows the panel with "NO SNAPSHOT LOADED", no status, no "Illustration only"/-110, no horizontal overflow; raw Odds API body refused with an error; (b) MOCK vs demo Sample Lead Guard → UNAVAILABLE, MOCK FIXTURE label, demo price not shown; (c) non-demo Mock Player Alpha Over 24.5 Points → OK, mockbook_a -115, "10 min ago", event shown, record's +175 / book not shown, snapshot reused from a previous card; (c2) Over 25.5 → STALE "older than 30 minutes" with mockbook_b; (d) Over 25 → UNAVAILABLE "No verified quote available", no 24.5/25.5 prices; (e) Sample Wing 3PT made → UNAVAILABLE "no verified provider key yet"; snapshot/quotes absent from localStorage; a file with `apiKey=` in a `source_url` refused, prior snapshot unloaded, key not echoed; no browser request to the-odds-api.com (only the 5 local files); single-file `nba-prop-intel.html` from `file://` works standalone (UNAVAILABLE vs demo); no uncaught page errors.

**Manual, not committed:** loaded the git-ignored live snapshot (`37f4c00f…-2026-11-11T23:35:07.440Z`, Celtics at Raptors) against a temporary record "Immanuel Quickley Over 17.5 Points" at about 7:02 PM America/Chicago → **STALE** (all 6 books' quotes about 87 min old, e.g. fanduel -106, draftkings -120, betmgm -115), as expected after tip-off. The screenshot was viewed and discarded. No new API call was made this session (499 credits remain as of session 3).
**Secret scan:** only the fake `FAKEKEY000` / `TESTKEY123` strings inside tests; the session's key value was not found anywhere in the tree.
**NOT tested:** Android Chrome / real device; screen reader; keyboard activation of the "Load snapshot file" label (same pattern as the existing Import label); live snapshots for `player_rebounds` / `player_assists`; `browser_smoke_inline.py` (legacy, hardcoded `/usr/lib/chromium`, not run). Generated preview PNGs and `smoke-export.json` were deleted, not committed.

