# CHANGELOG
## 2026-11-11 (session 5) — branch `agent/grok-bot/real-props-from-snapshot` (Grok Bot)
- **Owner request (J, t72u + t73u):** remove the fake numbers and fill the board with real props "by using the system".
- **Removed** the three seeded synthetic props (Sample Lead Guard / Sample Wing / Sample Center) from `app.js`. A fresh board starts empty and writes nothing. `load()` drops saved demo records (`demo:true` or ids `demo-one/two/three`), saves the cleaned list only if saving isn't blocked, and never touches non-demo records. Badge: `NO PROPS YET` / `YOUR RESEARCH RECORDS` / `INCLUDES SYNTHETIC DEMOS`. Empty-board copy rewritten.
- **Added** **Add quotes to the board** (board hero; multiple files): CLI snapshot(s) → `parseSnapshotText` → `snapshotToRecords` → `mergeImported` → save. One card per player/side at the main line, fixed book order, fresh pregame quotes only, no invented logs/injury/notes, HOLD, stable ids (re-add refreshes the price). MOCK snapshots produce DEMO ONLY cards with separate ids that can never refresh a real card. The loaded quotes also feed the Verify quote panel.
- **Added** `scripts/snapshot-to-board.js` (same rules, writes a v0.1 board file under git-ignored `data/` only) and `tests/snapshot-to-board.test.js` (9 tests).
- **Changed** `smoke_test.py` and `real_browser_test.py` to expect an empty first load. The demo-card cases now import a clearly named test demo export. New cases: legacy seeds dropped, add-quotes path, refresh in place, keyed-file refusal, MOCK → DEMO ONLY, single-file add.
- **Live fill (not committed):** 3 credits, 3 games, 84 real cards. See TEST-REPORT.
- Schema `j-nba-prop-intel` 0.1, localStorage key, `MANIFEST.sha256`, tag, `main` unchanged. Rollback: `agent/grok-bot/verify-quote-panel` @ `c1dfb30`.
## 2026-11-11 (session 4) — branch `agent/grok-bot/verify-quote-panel` (Grok Bot)
- **Added** read-only **VERIFY QUOTE** panel in the research-file dialog (`openDetails()` in `app.js`). The user loads a CLI `.snapshot.json`; the panel calls `PropIntelAdapter.findQuotes` with the record's exact player/market/side/line and shows OK / STALE / UNAVAILABLE, or "NO SNAPSHOT LOADED" before any file is picked. Never shows the record's stored odds/sportsbook (incl. DEMO illustration values) as verified; no nearest line; no synthetic fallback. Snapshot kept in memory for the page session only (reused across cards); never persisted. No network call, no key in the browser.
- **Added** `verify-quote.js` (pure helpers: `parseSnapshotText`, `verifyRecord`, `renderPanelBody`). Refuses invalid JSON, raw Odds API bodies, board exports, any malformed quote, and any file whose `source_url`/`sourceUrl` contains an API key (whole file refused, nothing loaded).
- **Changed** `index.html` now loads `odds-adapter.js` and `verify-quote.js` before `app.js`. `odds-adapter.js` header comment updated (code unchanged). `styles.css`: small `.vq-*` rules matching existing chips.
- **Added** `scripts/build-single-file.js`; `nba-prop-intel.html` regenerated from sources (adapter + verify helpers inlined before the app). The builder reproduces the previous committed single-file build byte-for-byte from the previous sources. `tests/build-sync.test.js` guards drift.
- **Added** `fixtures/MOCK-snapshot.json` (synthetic, CLI shape, derived from `fixtures/MOCK-event-odds.json` via `normalizeEventOdds`; a test proves the derivation). Named without the git-ignored `.snapshot.json` suffix on purpose. The live snapshot under `data/snapshots/` stays untracked.
- **Added** `tests/verify-quote.test.js` (12 tests) and 12 new real-browser cases in `real_browser_test.py` (390px, fixed clock 2026-11-11T23:00Z).
- **Not changed:** verdict logic, demo seed data, schema `j-nba-prop-intel` 0.1, localStorage key, `MANIFEST.sha256`, tag `v0.1.0-original`, `main`. KNOWN-ISSUES #9 deliberately **not** fixed (owner declined 2026-11-11).
- Rollback: check out `agent/grok-bot/odds-cli` @ `855254b` (the parent of this branch); nothing on `main` changed.
## 2026-11-11 (session 3) — branch `agent/grok-bot/odds-cli` (Grok Bot)
- **Added** `scripts/fetch-event-odds.js`: dependency-free read-only The Odds API CLI. Exports `run({argv, env, fetchImpl, now, writeFile})` for tests. Key from `ODDS_API_KEY` only; redacted from all output. `--list` (0 credits) and `--event` with `--markets` / `--regions` / `--max-cost` (default 3; refuses before fetch if markets × regions exceeds the cap). Writes `data/snapshots/<eventId>-<collectedAt>.snapshot.json` via `normalizeEventOdds`. Board UI is unchanged and still does not load the adapter.
- **Added** `tests/fetch-cli.test.js` covering the seven offline acceptance cases (and a few guards). Command that passes on Node 24: `node --test tests/*.js` (a bare `node --test tests/` is treated as a module path on Node 24 and fails).
- **Fixed** `.gitignore`: session 2 accidentally joined `test-results/` and `data/` into one path `test-results/data/`, so top-level `data/` was not ignored. They are separate entries again.
- **Docs**: usage in README; contract note in ARCHITECTURE; evidence in TEST-REPORT; next task in AGENT-HANDOFF.
- `MANIFEST.sha256` is still not regenerated. Independently checked: its hashes also do **not** match the git blobs at tag `v0.1.0-original` (archival Drive-era checksums). The tag itself is untouched.
- No merge, no deploy, no purchase. A live provider call was completed later in this same session (see the live-call TEST-REPORT section); the key was not committed.
- **Live verification (later same session):** free-tier The Odds API `--list` (14 events, 0 credits) and one `--event --markets player_points --regions us` (Celtics at Raptors) returned 256 real quotes, 0 rejected, 6 US books, 499 credits remaining. Snapshot git-ignored; key not committed. See TEST-REPORT and KNOWN-ISSUES #11.

## 2026-11-11 — v0.1 ORIGINAL WORK (ChatGPT)
- Built `index.html`, `styles.css`, `app.js` as standalone source-backed manual research prototype.
- Added three conspicuously synthetic demo records, independent role-based review append, filters, detail pane, old-price and missing-source flags, data export/import with validation.
- Computed raw implied odds and strictly line-specific last-N hits with push exclusion.
- Added docs, multi-agent handoff and browser test harness.
- Fixed `crypto.randomUUID` incompatibility in non-secure preview contexts by adding CSPRNG UUID v4 fallback.
- Current original and only working candidate: v0.1 archive. **No accepted previous stable Git reference; not deployed to live Hub.**

### 2026-11-11 — Multi-agent repo bootstrap staging
- Added root AGENTS.md to direct coding agents to the living AGENT-HANDOFF.md.
- Added mandatory NEXT AGENT action order and exit checklist to AGENT-HANDOFF.md.
- Code and demo behavior unchanged. Repository/publication status must be verified before claiming GitHub baseline.

### 2026-11-11 — GitHub public publication
- Repository target: `jlemay90/nba-prop-intel` (owner directed PUBLIC).
- Imported original v0.1 code, screenshots, tests, and docs; added `.gitignore` and a living agent start contract.
- This is a code publication, not a production deployment, not an odds-feed integration, and not live J Hub navigation.

## 2026-11-11 (session 2) — branch `agent/claude/real-browser-smoke-and-provider-contract` (Claude)
- **Fixed** (KNOWN-ISSUES #7): `app.js` `load()`/`save()` no longer lets a new save overwrite unreadable saved data; raw copy kept under `j-nba-prop-intel-v0.1-corrupt-backup-<timestamp>`; saving blocks if the copy cannot be made. `nba-prop-intel.html` inline script re-synced from `app.js`.
- **Added** `odds-adapter.js` (read-only provider contract, not loaded by the UI), `fixtures/MOCK-*.json` (synthetic), `tests/adapter.test.js` (10 tests), `real_browser_test.py` (11 real-navigation tests).
- **Changed** `smoke_test.py`: Chromium path now optional via `CHROMIUM_PATH`; uses `sys.executable` instead of `python`. Behavior otherwise unchanged.
- **Docs**: provider assessment (DECISIONS), data contract (ARCHITECTURE), test evidence (TEST-REPORT), issue status (KNOWN-ISSUES), next task (AGENT-HANDOFF).
- `MANIFEST.sha256` is intentionally NOT regenerated: it records the ORIGINAL v0.1 import (`v0.1.0-original`). `app.js`, `nba-prop-intel.html`, `smoke_test.py` hashes now differ by design.
