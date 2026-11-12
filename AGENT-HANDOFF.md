# NBA PROP INTEL — LIVING AGENT HANDOFF

> **MANDATORY: YOUR NEXT ASSIGNMENT IS BELOW.** Do not stop at summarizing this document or ask the owner to choose a task already assigned. First verify the repository and existing baseline. Then complete exactly one bounded improvement, test it, and write the next agent's assignment back into this same file. Never treat this document as a one-time prompt.

## VERIFIED BOOTSTRAP — 2026-11-11 (America/Chicago)
- **GitHub public repository:** https://github.com/jlemay90/nba-prop-intel (verified accessible by GitHub connector).
- **Default branch:** `main`; **first imported original-source commit:** `aec1f1df1313b343f0453d7af97efe2135a97509`.
- **Immutable original tag:** `v0.1.0-original` (pushed and verified via GitHub connector). The initial README-only repository commit was `f8ec5103d28103c0fdb15fe1cabd36f65f8cae6c`.
- **Code imported and independently read back:** `index.html`, `styles.css`, `app.js`, single-file `nba-prop-intel.html`, Python tests, and living docs. Original preview PNGs remain in the dated Drive source archive; they have **not** been committed to GitHub. `MANIFEST.sha256` includes archival screenshot hashes.
- **Fresh test results:** `node --check app.js` PASS; `python browser_smoke_inline.py` PASS at 390px and 1280px (render, add, strict 6/10 hit rate, review append, JSON export, zero uncaught page errors); Python syntax/compile PASS. Actual `file://`/localhost navigation and Android Chrome end-to-end remain **NOT TESTED** after the original environment restriction.
- **Security boundary:** No credentials or private Hub records were imported. Three sample props remain **SYNTHETIC**. This is an app-code publication only—no production deploy, real odds API, automatic agent worker, or J Hub UI embed.
- **Next agent deliverable (precise):** Commit a branch containing either (A) evidence from true browser loads + one targeted fix, or (B) a provider assessment and a minimal tested read-only data adapter contract. Update this exact handoff with next task, branch/commit, actual test results, limitations and required approval; do not merge/deploy without approval.

## SESSION 2 REPORT — Claude, 2026-11-11 (America/Chicago)
**What changed | Exact commit/branch | Tests & evidence | Still unknown | Next agent do X | Acceptance test | Permissions needed**

- **Branch:** `agent/claude/real-browser-smoke-and-provider-contract` (from `main` @ `034142e`). **Work commit: `c5b8307f69515e3f3c8816f92c7795f37b98363a`.** This handoff text is committed on top of it in a later commit on the same branch (`git log` shows it). **Not merged. Not deployed. Not pushed unless the "Push status" line below says otherwise.**
- **Refs:** ORIGINAL = tag `v0.1.0-original` → `aec1f1d` (verified untouched, resolves to tag object `4103086…`). PREVIOUS STABLE = none (no accepted release). CURRENT = the branch above.
- **What changed (bounded):**
  1. *Real-browser verification* (the prior blocker): real `file://` and `http://127.0.0.1` loads at 390px and 1280px, plus native localStorage persistence across a full browser restart, all PASS.
  2. *First reproducible defect fixed:* corrupted saved data was destroyed by the next save (KNOWN-ISSUES #7). `app.js` now copies the raw string to `j-nba-prop-intel-v0.1-corrupt-backup-<ms>` before any write and blocks saving if that copy fails. `nba-prop-intel.html` re-synced.
  3. *Provider assessment + read-only contract:* `odds-adapter.js` (offline, not wired into the UI) + MOCK fixtures + 10 unit tests. Assessment is in DECISIONS.md; contract in ARCHITECTURE.md.
- **Tests (clean clone of `c5b8307`):** `node --check` PASS; `node --test tests/adapter.test.js` 10/10; `python3 real_browser_test.py` 11/11 (2 of these FAIL on the original `app.js`, proving the regression guard); `python3 smoke_test.py` mobile+desktop PASS. Details and commands in TEST-REPORT.md.
- **Still unknown / not done:** no live provider call was ever made (no key); whether The Odds API's free tier returns player-prop outcomes; provider terms for storing odds in a public repo; Android Chrome on a real device; an official NBA.com stats source was not researched; issue #9 (misleading "Last 20" label) reproduced but not fixed; the UI does not use the adapter yet. **No live feed, deployment or integration exists; nothing here may be described as one.**
- **Push status:** this container has no GitHub credentials, so the branch exists only in this session's local clone unless the owner/another agent pushes it. (See Permissions.) If the branch is not on GitHub, the work is NOT preserved there.


## SESSION 3 REPORT — Grok Bot, 2026-11-11 (America/Chicago)
**What changed | Exact commit/branch | Tests & evidence | Still unknown | Next agent do X | Acceptance test | Permissions needed**

- **Branch:** `agent/grok-bot/odds-cli`, created from `agent/claude/real-browser-smoke-and-provider-contract` @ `c55bf13` (which itself is based on `main` @ `034142e`). **Work is on this branch only. Not merged. Not deployed. No purchase. No live API call.** Session 2's unmerged work was reused, not re-implemented. The branch will be pushed to GitHub so the next agent can continue from it.
- **Refs:** ORIGINAL = tag `v0.1.0-original` → commit `aec1f1df1313b343f0453d7af97efe2135a97509` (verified untouched this session; annotated tag object `4103086268f58d1a2eee2f0c9d4fb7c43944e351`). PREVIOUS STABLE = none (no accepted release). CURRENT = this branch (commit SHA recorded in the line immediately below after the work commit exists).
- **Work commit:** `296ba0713fc1122320aa3564985b7e5f98e7d9f7` ("Add read-only Odds API CLI with offline tests; fix data/ gitignore"). This handoff text is the next commit on the same branch (`git log` shows it).
- **What changed (bounded, UI untouched):**
  1. *Read-only odds CLI* as assigned: `scripts/fetch-event-odds.js` exports `run({argv, env, fetchImpl, now, writeFile})`. Key from `env.ODDS_API_KEY` only. `--list` → `GET https://api.the-odds-api.com/v4/sports/basketball_nba/events` (0 credits). `--event <id> --markets … --regions us [--max-cost N]` → `GET …/events/<id>/odds?regions=…&markets=…&oddsFormat=american`. Refuses before any request if markets × regions > `--max-cost` (default 3). Records `x-requests-last` / `x-requests-remaining`. Calls `normalizeEventOdds` with `collectedAt = now()` and `sourceUrl` = request URL minus the key. Writes `data/snapshots/<eventId>-<collectedAt>.snapshot.json` as `{meta, quotes, rejected, quota}`. HTTP 401/422/429 → exit 1, provider message, no snapshot. No bookmakers → prints "No verified quote available", no snapshot. The key and the string `apiKey` are redacted from stdout, stderr, and snapshot contents (including a provider body that echoes the key).
  2. *Offline tests:* `tests/fetch-cli.test.js` covers acceptance (1)–(7) plus redaction, default cap, cap-equal-allowed, and unsupported-market refusal.
  3. *`.gitignore` repair:* session 2 accidentally stored `test-results/data/` as a single path, so top-level `data/` was not ignored. Split into `test-results/` and `data/`. `*.snapshot.json` was already present.
  4. *Docs:* README usage, ARCHITECTURE contract note, CHANGELOG, TEST-REPORT, KNOWN-ISSUES, DECISIONS, this handoff.
- **Tests (this session, after the change):** `node --check` on `app.js`, `odds-adapter.js`, `scripts/fetch-event-odds.js` PASS; `node --test tests/*.js` PASS 26/26 (10 adapter + 16 CLI); `CHROMIUM_PATH=/usr/bin/google-chrome python3 smoke_test.py` PASS (mobile 390px and desktop 1280px); `CHROMIUM_PATH=/usr/bin/google-chrome python3 real_browser_test.py` PASS 11/11. Session 2 tests were also re-run on the parent branch before editing and passed. Details in TEST-REPORT.md. On Node v24.22.1, a bare `node --test tests/` does **not** work (Node loads the directory as a module); use `node --test tests/*.js`.
- **Baseline observations:** The immutable tag was not moved. `MANIFEST.sha256` checksums do not match the git blobs at `v0.1.0-original` (e.g. tagged `app.js` is `41ddc47c…`, manifest lists `2965170e…`). Treated as archival Drive-era hashes; manifest was not regenerated and the tag was not rewritten. Preview PNGs are still not in the repo.
- **Still unknown / not done:** provider terms for storing odds (snapshots stay git-ignored); Android Chrome on a real device; official NBA.com stats source still unresearched; KNOWN-ISSUES #9 (misleading "Last 20" label) still not fixed; the UI still does not use the adapter or snapshots; live calls for `player_rebounds`/`player_assists` not made; `J_Sports_Prop_Framework.md` was not on this computer and was **not accessible** this session. **Live call completed later in session 3:** free-tier `--list` (14 events, 0 credits, 500 remaining) and one `--event` `player_points` `regions=us` for Celtics at Raptors returned 256 verified quotes, 0 rejected, 6 books, 15 players, 499 credits remaining. This resolves the first half of KNOWN-ISSUES #11. Details in TEST-REPORT.md. **No live feed, deployment, or UI integration exists; nothing here may be described as one. The board does not consume this snapshot.**
- **Push status:** pending push of `agent/grok-bot/odds-cli` to `origin` (credentials available this session). If you are reading this on GitHub, the push succeeded.

## SESSION 4 REPORT — Grok Bot, 2026-11-11 (America/Chicago)
**What changed | Exact commit/branch | Tests & evidence | Still unknown | Next agent do X | Acceptance test | Permissions needed**

- **Owner decisions this session (J, 2026-11-11):** J **declined** the assigned KNOWN-ISSUES #9 label fix ("Don't worry about that cuz eventually there will be a last 20"). #9 stays open and deferred; it was **not** implemented. J then authorized the next best step ("Yeah go ahead and give me the next best step and do it"), so this session built the already-queued **Verify quote** panel instead.
- **Branch:** `agent/grok-bot/verify-quote-panel`, created from `agent/grok-bot/odds-cli` @ `855254b5822ec836ad286b9fff86b0106e3e5c1a`. **Work commit: `c370580579dd50885e68d67eba11536483f6c077`.** This handoff text is the next commit on the same branch (`git log` shows it). Pushed to `origin` (no force-push). **Not merged. Not deployed. No purchase. No new API call.**
- **Refs:** ORIGINAL = tag `v0.1.0-original` → commit `aec1f1df1313b343f0453d7af97efe2135a97509` (verified untouched). PREVIOUS STABLE = none (no accepted release). `main` = `034142e912f708027a2d1946a9d6a9c60210e511` (verified untouched). CURRENT = this branch.
- **What changed (bounded):**
  1. *Read-only VERIFY QUOTE panel* in the research-file dialog (`openDetails()` in `app.js`). The user picks a CLI `.snapshot.json` (file picker only; a static page cannot list git-ignored `data/snapshots/`, so no auto-discovery or relative fetch was added). Matching only via `PropIntelAdapter.findQuotes` on the record's player/market/side/line. States: NO SNAPSHOT LOADED (no search ran), OK, STALE, UNAVAILABLE. The record's stored odds/sportsbook (incl. DEMO illustration values) are never used; no nearest line; no synthetic fallback. MOCK snapshots are labelled "MOCK FIXTURE · NOT REAL ODDS". Snapshot held in memory for the page session, reused across cards, never persisted. No browser network call to the provider; no key in the frontend.
  2. *`verify-quote.js`* pure helpers (`parseSnapshotText`, `verifyRecord`, `renderPanelBody`), Node-testable. Fails closed (whole file refused) on invalid JSON, raw Odds API body, board export, any malformed quote, or any `source_url`/`sourceUrl` containing an API key.
  3. *Build:* `index.html` loads `odds-adapter.js` → `verify-quote.js` → `app.js`. `nba-prop-intel.html` is now generated by `node scripts/build-single-file.js` (inlines CSS + adapter + helpers + app); `tests/build-sync.test.js` fails on drift. The builder reproduces the previous committed single file byte-for-byte from the previous sources.
  4. *Fixture:* `fixtures/MOCK-snapshot.json` (synthetic, CLI shape, proven equal to `normalizeEventOdds(fixtures/MOCK-event-odds.json)`). The live 173 KB snapshot stays untracked.
  5. *Docs:* ARCHITECTURE (UI now loads adapter; panel behavior; superseded "no live call" lines annotated), README (how to verify a price), CHANGELOG, KNOWN-ISSUES (#9 deferred by owner; new #14, #15), DECISIONS, TEST-REPORT.
- **Tests (final run, ~7:03 PM America/Chicago):** `node --check` on all 5 JS files PASS; `node --test tests/*.js` **39/39** (10 adapter + 16 CLI + 12 verify-quote + 1 build-sync); `node scripts/build-single-file.js --check` in sync; `CHROMIUM_PATH=/usr/bin/google-chrome python3 smoke_test.py` MOBILE + DESKTOP PASS; `CHROMIUM_PATH=/usr/bin/google-chrome python3 real_browser_test.py` **23/23** (original 11 + 12 new, 390px, fixed clock, MOCK only). Manual: the live git-ignored Celtics–Raptors snapshot against a temporary "Immanuel Quickley Over 17.5 Points" record → STALE (6 books, ~87 min old), as expected after tip-off. Details in TEST-REPORT.
- **Still unknown / not done:** #9 (deferred by owner); the panel does not check that the quote's game is the record's game (KNOWN-ISSUES #14: warning only); Android Chrome real device; screen reader; keyboard activation of the file-picker label; `player_rebounds`/`player_assists` live; provider terms for storing odds; `browser_smoke_inline.py` not updated or run (legacy). The panel verifies a price only. It is **not** a pick, a live feed, or an auto-refresh.
- **Push status:** `agent/grok-bot/verify-quote-panel` pushed to `origin`. If you are reading this on GitHub, the push succeeded.

## SESSION 5 REPORT — Grok Bot, 2026-11-11 (America/Chicago)
**What changed | Exact commit/branch | Tests & evidence | Still unknown | Next agent do X | Acceptance test | Permissions needed**

- **Owner requests (J, 2026-11-11):** t72u "Can we just get rid of the fake numbers?", then t73u "No you should add the real props by using the system." Done: seeds removed, and the board is filled from real Odds API snapshots (CLI → adapter → records). An empty-board-only version was started, then stopped per t73u; it was never pushed.
- **Branch:** `agent/grok-bot/real-props-from-snapshot`, from `agent/grok-bot/verify-quote-panel` @ `c1dfb3049631925cd7d5abffb77df86df8045e52`. **Work commit: `1101fd57e1f985d96e29a322e4d4a4b6de5edadf`.** This handoff is the next commit. Pushed to `origin`, no force-push. **Not merged, not deployed.**
- **Refs:** ORIGINAL `v0.1.0-original` → `aec1f1d…` untouched; `main` = `034142e…` untouched; PREVIOUS STABLE none.
- **What changed:**
  1. No seeded sample props. A fresh board is empty and writes nothing. `load()` drops saved demo records (`demo:true` or ids `demo-one/two/three`), and non-demo records are untouched. A demo record arriving by Import is still labelled DEMO ONLY until the next load drops it.
  2. **Add quotes to the board** button (board hero, multiple files). Rules are in ARCHITECTURE: one card per player/side at the main line, fixed book order, fresh pregame quotes only, no invented logs/injury/team/notes, HOLD, stable ids so re-adding refreshes the price. MOCK snapshots give DEMO ONLY cards that can never refresh a real card.
  3. `scripts/snapshot-to-board.js`: same rules offline; writes a board file under git-ignored `data/` only.
- **Live fill (3 credits; 496 remain):** about 7:18 PM CT, player_points, US books. Magic at Jazz (24 cards), Warriors at Rockets (30), Thunder at Blazers (30) = **84 real cards**, cross-checked against the raw snapshots with 0 mismatches. Tomorrow's two games had no props posted yet (0 credits). Files on the box, git-ignored, not committed: `data/snapshots/{423255883d0e…,f41d186dc7a7…,d4f288eeb013…}-2026-11-12T01:18:3*.snapshot.json` and `data/board-2026-11-11.json`. These prices go stale after ~7:46 PM CT, and the games start at 8:10–9:10 PM CT.
- **Tests:** `node --test tests/*.js` 48/48; `node scripts/build-single-file.js --check` in sync; `smoke_test.py` MOBILE+DESKTOP PASS; `real_browser_test.py` 36/36. Details in TEST-REPORT.
- **Still not done:** team/opponent unknown on imported cards (#16); no game logs/injury (still manual or paid); moved lines leave old cards (#17); finished-game cards are not cleaned up; no hosted copy, so J has to open a local file; Android not tested.

## NEXT AGENT — ACTION ORDER (refresh after EVERY session)

**Task (execute, do not ask which):** Close KNOWN-ISSUES #14 (event-date guard for the Verify quote panel), as specified in the archived session-4 order below, with these updates: `verifyRecord()` / `renderPanelBody()` are in `verify-quote.js` (search for `function verifyRecord`). Reuse the existing `chicagoDate()` helper in that file (America/Chicago, already used by `snapshotToRecords`) to drop exact-match quotes whose event start date ≠ `record.gameDate`; if none remain, return UNAVAILABLE `Quote is for a different game date (event <date>, record <gameDate>)`. Keep `findQuotes` unchanged. Cards created by "Add quotes to the board" already carry the Chicago event date, so they must still verify OK against their own snapshot. Branch from `agent/grok-bot/real-props-from-snapshot` (or `main` if merged): `agent/<name>/verify-event-date`.

**Acceptance:** as in the archived session-4 order (MOCK record with `gameDate` 2026-11-11 → OK; 2026-11-12 → UNAVAILABLE with no prices; TZ-independence test; one real-browser case at 390px), plus: an imported card (Add quotes from the de-flagged MOCK temp file, as in `real_browser_test.py`) still shows Verify OK. All existing tests stay green: `node --test tests/*.js` (48 + new), `real_browser_test.py` (36 + new), `smoke_test.py`, `node scripts/build-single-file.js --check`. Do not re-add seed data. Do not commit snapshots or board files. Do not implement #9.

**Task after that (queue, not next session):** clean up finished games: an opt-in "Remove past-game imported cards" action, only for records whose reviewer is `Odds API snapshot import` and whose `gameDate` is before today, after a confirmation. Needs J's OK, since it deletes records.

**Current blockers:** (a) no verified free source for game logs (BALLDONTLIE ALL-STAR is paid); (b) provider terms for storing odds unreviewed, so snapshots stay git-ignored; (c) `J_Sports_Prop_Framework.md` not accessible from this box; (d) `MANIFEST.sha256` ≠ git blobs at the tag (do not rewrite); (e) the Odds API key exists only in Grok Bot's environment (not Vault, not repo); (f) no hosted copy: J opens a local file.

**Permissions / decisions needed from J (nothing below was done or assumed):**
1. Approve (or not) merging `agent/grok-bot/real-props-from-snapshot` into `main` (it contains sessions 2–5).
2. Hosting: whether to publish the static board (e.g. GitHub Pages) so J can open it on his phone. That is a deploy and needs approval. Snapshots would still be loaded from his device, never hosted.
3. Provider terms review before storing any snapshots in Git (default: no).
4. Game logs: approve BALLDONTLIE ALL-STAR $9.99/mo or keep entering them by hand. No GOAT trial without a decision.
5. Whether to save the Odds API key in Settings › Vault for other agents (never in the repo).

**MUST NOT change:** schema `j-nba-prop-intel` 0.1 and localStorage key `j-nba-prop-intel-v0.1`; tag `v0.1.0-original`; DEMO ONLY labelling for any demo record; no seeded fake props; no secrets, family or Hub records, committed snapshots or board files; no paid plan, deployment or merge without approval; `MANIFEST.sha256`.

---
## ARCHIVED — action order issued to session 5 (session 5 did the owner's new request instead; #14 carried forward above)


**Task (execute, do not ask which):** Close KNOWN-ISSUES #14: the Verify quote panel must not report **OK** (or STALE) for a quote from a different game than the record. Today `verifyRecord()` in `verify-quote.js` returns whatever `findQuotes` returns and `renderPanelBody()` only shows a warning when the event's start date differs from the record's `gameDate`. Change `verifyRecord()` so that, after `findQuotes`, exact-match quotes whose event start date (in **America/Chicago**, the owner's zone, computed with `Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago'})`, not the browser's zone) differs from `record.gameDate` are excluded. If none remain, return `UNAVAILABLE` with reason `Quote is for a different game date (event <date>, record <gameDate>)`. Keep `odds-adapter.js` `findQuotes` unchanged (its contract and its 10 tests stay as they are). Then remove the now-redundant warning or keep it only for the informational case. Rebuild `nba-prop-intel.html` with `node scripts/build-single-file.js`.

**Files:** `verify-quote.js` (`verifyRecord`, `renderPanelBody`, ~lines 55–90); `tests/verify-quote.test.js`; `real_browser_test.py` (verify block near the end); `nba-prop-intel.html` (regenerate, never hand-edit); update `KNOWN-ISSUES.md` (#14), `CHANGELOG.md`, `TEST-REPORT.md`, `ARCHITECTURE.md` (Verify quote section), and this handoff. Branch from `agent/grok-bot/verify-quote-panel` (or `main` if it has been merged): `agent/<name>/verify-event-date`.

**Acceptance:**
- Unit: with `fixtures/MOCK-snapshot.json` (event `commence_time` 2026-11-12T00:30:00Z = 2026-11-11 6:30 PM America/Chicago) and `now` 2026-11-11T23:00:00Z, a record `Mock Player Alpha / Points / Over / 24.5` with `gameDate` `2026-11-11` is **OK**; the same record with `gameDate` `2026-11-12` is **UNAVAILABLE** with the different-game reason and renders no prices. Add a test proving the date uses America/Chicago independent of `process.env.TZ` (e.g. run the check with TZ=UTC and TZ=Asia/Tokyo).
- Real browser (390px, fixed clock as in the existing block): a non-demo record with the matching player/market/side/line but `gameDate` 2026-11-12 → UNAVAILABLE, no mockbook prices shown. All existing cases still pass: `node --test tests/*.js` (39 + new), `real_browser_test.py` (23 + new), `smoke_test.py` MOBILE+DESKTOP, `node scripts/build-single-file.js --check`.
- No change to schema `j-nba-prop-intel` 0.1, localStorage key `j-nba-prop-intel-v0.1`, demo labelling, verdict logic, `findQuotes`, `MANIFEST.sha256`, tag `v0.1.0-original`, or `main`. Still no network call or key in the browser. Do not implement KNOWN-ISSUES #9 (owner declined 2026-11-11).

**Task after that (queue, not next session):** Owner decision first: whether a user-confirmed "copy this OK quote into the record" action is wanted (it would write verified book/price/`provider_updated_at`/key-free `source_url` into the existing record fields, so it changes what records contain; no schema change). Do not build it without J saying yes.

**Current blockers:** (a) no verified free source for real game logs — BALLDONTLIE `/v1/stats` needs paid ALL-STAR; (b) provider terms for storing/redistributing odds unreviewed (keep snapshots local/git-ignored); (c) `J_Sports_Prop_Framework.md` (ChatGPT Library) not accessible from this box; (d) `MANIFEST.sha256` does not match git blobs at `v0.1.0-original` — do not retag or rewrite it; (e) the Odds API key lives only in the session-3/4 agent environment, not in the repo or Vault; other agents do not have it (the next task does not need it).

**Permissions / decisions needed from J (nothing below was done or assumed):**
1. Approve (or not) merging `agent/grok-bot/verify-quote-panel` into `main`. It contains session 2 (`agent/claude/real-browser-smoke-and-provider-contract`), session 3 (`agent/grok-bot/odds-cli`), and this panel; merging it supersedes the earlier merge requests. Do not merge without that approval.
2. Say whether to review the provider's terms before storing any snapshots in Git (default: keep them git-ignored).
3. Decide on game logs: approve **BALLDONTLIE ALL-STAR $9.99/mo (per league)**, or continue manual entry. Do NOT start the 7-day GOAT trial (requires a payment method) without a decision.
4. Whether to save the Odds API key in Settings › Vault so other agents can run the CLI. Never in this public repo or GitHub Actions.

**MUST NOT change:** the `j-nba-prop-intel` JSON export schema/version `0.1` and localStorage key `j-nba-prop-intel-v0.1` (any change needs a tested migration); the tag `v0.1.0-original`; the synthetic-demo labelling; no secrets, family or Hub records in this public repo; no committed live snapshots; no paid plan, deployment, or merge without approval; `MANIFEST.sha256` (records the original import / archival hashes).

---
## ARCHIVED — action order issued to session 4 (owner declined #9 on 2026-11-11; session 4 built the queued Verify quote panel instead; kept for history)


**Task (execute, do not ask which):** Fix KNOWN-ISSUES #9: do not label hit-rate windows as "Last 10" / "Last 20" (or "L10" / "L20") when fewer games were entered. Show the **actual selected game count**. Do this in `render()` and `openDetails()` (and `performance()` only if needed) in `app.js`, and re-sync the inline script in `nba-prop-intel.html`. Add a regression test in `real_browser_test.py`. Do not change the JSON schema or localStorage key. Do not start the "Verify quote" panel in this session (that is the task after this one).

**Files:** `app.js` (labels are around the `stats=[5,10,20].map` card template in `render()`, currently near line 45, and the `L${x}` string in `openDetails()`, currently near line 53); `nba-prop-intel.html` (keep the inlined `app.js` identical); `real_browser_test.py`; update `KNOWN-ISSUES.md` (#9), `CHANGELOG.md`, `TEST-REPORT.md`, and this handoff. Branch from `agent/grok-bot/odds-cli` (or `main` if that branch has been merged): `agent/<name>/label-sample-size`.

**Repro (already observed, session 2):** a record with 8 games such as `20, 21, 19, 20, 25, 10, 20, 22` (line 20) shows a "Last 20" cell whose decided count equals the Last 10 result, because `performance(r, 20)` only has 8 values to slice. The app correctly flags "Insufficient verified log" when fewer than 10 games are present, but the window **label** overstates the sample.

**Acceptance:**
- In a real browser test at 390px, add a non-demo record with exactly 8 game-log values. The card must not display the text "Last 20". Each visible window label must use the actual number of games used in that window (for 8 games: Last 5 stays "Last 5"; the 10- and 20-game windows should read as last-8, or equivalent wording that includes the selected count — not "Last 10" or "Last 20").
- The detail view must not show `L20` / `L10` as if those full windows existed; it must also show the selected count.
- Push handling stays correct: for line 20 and values `20, 21, 19, 20, 25, 10, 20, 22`, L5 is `2/3 decided` (three 20s in the first five are pushes). Existing `python3 real_browser_test.py` cases (including that L5 assertion and the corruption-backup tests) and `python3 smoke_test.py` still PASS. `node --test tests/*.js` still PASS 26/26. `node --check app.js` PASS.
- `nba-prop-intel.html` matches `app.js` for the changed functions (no drift). Schema `j-nba-prop-intel` version `0.1` and localStorage key `j-nba-prop-intel-v0.1` unchanged. Synthetic demos still labelled DEMO ONLY. Tag `v0.1.0-original` untouched.

**Task after that (queue, not this session):** a read-only "Verify quote" panel in the detail view that consumes a snapshot from `data/snapshots/` (or a file the user provides) through `odds-adapter.js` `findQuotes`. Missing/stale/unmatched quotes must show UNAVAILABLE or STALE, never a synthetic fallback. Still no live key in the browser.

**Current blockers:** (a) ~~no Odds API key / live CLI untested~~ **resolved session 3:** live `--list` and one `player_points` call succeeded (see TEST-REPORT); key is in this agent's environment only, not in the repo or Vault, and not automatically available to other agents; (b) no verified free source for real game logs — BALLDONTLIE `/v1/stats` needs paid ALL-STAR; (c) provider terms for storing/redistributing odds unreviewed (keep snapshots local/git-ignored); (d) `J_Sports_Prop_Framework.md` (ChatGPT Library) was not accessible this session; (e) `MANIFEST.sha256` does not match git blobs at `v0.1.0-original` — do not retag or rewrite it.

**Permissions / decisions needed from J (nothing below was done or assumed):**
1. Approve (or not) merging branch `agent/grok-bot/odds-cli` into `main`. That branch already contains session 2 (`agent/claude/real-browser-smoke-and-provider-contract`) plus this session's CLI. Do not merge without that approval. Session 2 also asked about merging its branch alone; merging this one supersedes that if approved.
2. ~~Create a free Odds API key and run the live acceptance~~ **done session 3** (results in TEST-REPORT). The key stays outside the repo. Other agents do not automatically have it. A Vault save was not completed from this chat; if other agents should use it, J adds it in Settings › Vault or provides it in those chats. Do not put it in this public repo.
3. Say whether to review the provider's terms before storing any snapshots in Git (default: keep them git-ignored).
4. Decide on game logs: approve **BALLDONTLIE ALL-STAR $9.99/mo (per league)**, or continue manual entry. Do NOT start the 7-day GOAT trial (requires a payment method) without a decision.

**MUST NOT change:** the `j-nba-prop-intel` JSON export schema/version `0.1` and localStorage key `j-nba-prop-intel-v0.1` (any change needs a tested migration); the tag `v0.1.0-original`; the synthetic-demo labelling; no secrets, family or Hub records in this public repo; no paid plan, deployment, or merge without approval; `MANIFEST.sha256` (records the original import / archival hashes).

---
## ARCHIVED — action order issued to session 3 (completed by Grok Bot, 2026-11-11; kept for history)
(session 2's "next agent" assignment, original text below, unchanged)

## NEXT AGENT — ACTION ORDER (refresh after EVERY session)

**Task (execute, do not ask which):** Build the smallest *real* read-only odds fetcher: a dependency-free Node CLI that calls The Odds API and writes a provenance-stamped snapshot using the existing adapter. Do not touch the board UI in this task.

**Files:** create `scripts/fetch-event-odds.js` and `tests/fetch-cli.test.js`; reuse `odds-adapter.js` (`normalizeEventOdds`) and `fixtures/MOCK-event-odds.json`; add a short usage block to `README.md`. `.gitignore` already ignores `data/` and `*.snapshot.json`. Branch from `agent/claude/real-browser-smoke-and-provider-contract` (or `main` if it has been merged): `agent/<name>/odds-cli`.

**Design (fixed):** export `run({argv, env, fetchImpl, now, writeFile})` so tests inject a fake fetch. Key from `env.ODDS_API_KEY` only; never print, log, store, or put it in `source_url`. Commands: `--list` → `GET https://api.the-odds-api.com/v4/sports/basketball_nba/events` (0 credits); `--event <id> --markets player_points[,player_rebounds,player_assists] --regions us [--max-cost N]` → `GET …/events/<id>/odds?regions=…&markets=…&oddsFormat=american`. Refuse before any request if markets × regions > `--max-cost` (default 3). Record `x-requests-last` / `x-requests-remaining` headers. Run `normalizeEventOdds` with `collectedAt = now()` and `sourceUrl` = request URL minus `apiKey`. Write `data/snapshots/<eventId>-<collectedAt>.snapshot.json` containing `{meta, quotes, rejected, quota}`.

**Acceptance — offline (automated, must pass with `node --test tests/`):** (1) no key → exit code 2, zero fetch calls; (2) `--list` hits only the `/events` URL; (3) event call URL contains `oddsFormat=american` and the requested markets, cost read from header; (4) with key `TESTKEY123`, the written snapshot and all stdout/stderr contain neither the key nor `apiKey`; (5) HTTP 401/422/429 → exit 1, provider message shown, no snapshot written; (6) `--max-cost` exceeded → exit 2 before any fetch; (7) response with no bookmakers → prints "No verified quote available", writes no snapshot. Existing `node --test tests/adapter.test.js`, `python3 real_browser_test.py`, `python3 smoke_test.py` must still pass.
**Acceptance — live (needs owner key; otherwise record NOT TESTED, do not block the offline work):** run `--list` (0 credits) then ONE call `--markets player_points --regions us` for a single event (1 credit). Record in TEST-REPORT.md: HTTP status, `x-requests-remaining`, bookmaker count, number of `player_points` quotes, and any rejected reasons. This resolves KNOWN-ISSUES #11 first half. Never paste a key into any file or doc.

**Task after that (queue, not this session):** fix KNOWN-ISSUES #9 (show selected game count; label windows by actual sample size) in `render()`/`performance()` of `app.js`, with a regression test in `real_browser_test.py`; then a read-only "Verify quote" panel in the detail view that consumes a snapshot.

**Current blockers:** (a) no Odds API key exists; (b) no verified free source for real game logs — BALLDONTLIE `/v1/stats` needs paid ALL-STAR; (c) this container cannot push to GitHub; (d) provider terms for storing/redistributing odds unreviewed (keep snapshots local/git-ignored); (e) `J_Sports_Prop_Framework.md` (ChatGPT Library) was not accessible to this session, so the framework wording above is taken from this handoff only.

**Permissions / decisions needed from J (nothing below was done or assumed):**
1. Create a **free** key at the-odds-api.com (site states no card required) and keep it outside the repo (env var). Free, no spend.
2. Say whether to review the provider's terms before storing any snapshots in Git (default: keep them git-ignored).
3. Decide on game logs: approve **BALLDONTLIE ALL-STAR $9.99/mo (per league)**, or continue manual entry of logs. Do NOT start the 7-day GOAT trial (requires a payment method) without a decision.
4. Approve (or not) merging branch `agent/claude/real-browser-smoke-and-provider-contract` into `main`; and push it so it exists on GitHub.

**MUST NOT change:** the `j-nba-prop-intel` JSON export schema/version `0.1` and localStorage key `j-nba-prop-intel-v0.1` (any change needs a tested migration); the tag `v0.1.0-original`; the synthetic-demo labelling; no secrets, family or Hub records in this public repo; no paid plan, deployment, or merge without approval; `MANIFEST.sha256` (records the original import).


---
## ARCHIVED — action order issued to session 2 (completed by Claude, 2026-11-11; kept for history)
(original text below, unchanged)

**Owner's priority:** Turn the existing mobile-first NBA player-prop research board into a properly sourced, useful research tool. Preserve the already-written code. Allow evidence-based analysis, compare lines/odds, investigate opposing explanations, and pass knowledge between agents. Integrate with J Command Hub as an optional Projects link without changing Hub's main home screen or duplicating its canonical records.

**Current assignment (NEXT AGENT MUST EXECUTE):** Run a real page-load/browser smoke test at 390px and desktop (not just inline injection). Repair the first reproducible functional defect if one is found; otherwise complete a source-backed comparison of available NBA player-stat and event-specific prop-odds providers, document one read-only API contract with exact fields and no-data/stale-data behavior, and commit the smallest reversible change on your own branch. Do **not** rebuild the board, re-import the ZIP, request the owner to choose between these steps, buy an API plan, or claim a live feed is running.

1. **Inspect, do not reinvent.** Verify `https://github.com/jlemay90/nba-prop-intel`, record actual default branch and HEAD SHA; read `AGENTS.md`, this handoff, README, architecture, decisions, known issues, tests, app source and the shared [app-continuity skill](https://github.com/jlemay90/j-god-agent/blob/main/.agents/skills/app-continuity/SKILL.md). Read the owner's canonical ChatGPT Library `J_Sports_Prop_Framework.md` when available. If access is missing, say so; do not fabricate content.
2. **Confirm baseline and protect public data.** Verify files and tests, check secret/personal-data exposure, identify ORIGINAL tag/commit, PREVIOUS STABLE tag/commit if one exists and CURRENT branch/HEAD. Do not relabel untested work as stable. Protect branch history; no forced pushes.
3. **Test the real app.** Run `node --check app.js` and the documented browser smoke scripts in a supported environment. Check at 390px and desktop widths, add/edit/inspect props, exact-line last-N hit rates, append independent reviews, and JSON export/import. Record command, date, environment, and PASS/FAIL/NOT TESTED. If navigation is blocked, retain original inline-only caveat.
4. **Choose one real, read-only input.** Compare a current prop-odds provider (e.g. BALLDONTLIE or The Odds API) and an official/statistical source for game logs; verify current access tiers, historical snapshots, geographic availability, request quotas, provider licensing and cost. Select one bounded proof-of-concept *without committing paid spend*. Propose the exact endpoint and data contract. Only implement when credentials/access are actually available; otherwise create a testable mocked contract clearly labeled mock, with a documented no-data path.
5. **Guard against fiction.** Never display synthetic sample data as real odds. Every real quote must show `provider`, `book`, `event`, `player`, `market`, `side`, `line`, `price`, `source_url`, `collected_at`; every statistical sample must show dates, selected game count, DNP/push treatment and source. Missing/conflicting/stale inputs yield UNAVAILABLE or HOLD, not simulated certainty.
6. **Leave the next agent a real task.** Before ending, update the **NEXT AGENT — ACTION ORDER** with (a) one next executable task, (b) source files/line numbers, (c) exact acceptance test, (d) current blockers and permissions, and (e) what MUST NOT change. Update CHANGELOG, TEST-REPORT and KNOWN-ISSUES as applicable. Commit to your own branch; provide branch and commit SHA; request owner approval before merge/deploy or new paid services.

**Definition of done for this session:** The repo and actual source are inspectable, current HEAD SHA and baseline provenance are recorded, test results are reproducible, safety/privacy checks documented, and a named next step appears at the top of this same handoff. If you cannot finish, record the precise blocker and an immediately actionable recovery step; do not mark a milestone complete.

**No-go actions:** No secret commits, financial/parenting/Hub records, fake picks, unapproved wagering, automatic bets, paid API subscriptions, production deploys, unrelated Zeus changes, destructive history edits, or unreviewed merges. GitHub repository is PUBLIC at owner's direction. Research verdicts use HOLD / LEAN / PASS / VALUE GONE. Historical hit percentages are not calibrated predictive probabilities.

**Session exit format:** `What changed | Exact commit/branch | Tests & evidence | Still unknown | Next agent do X | Acceptance test | Permissions needed`.

---

# AGENT HANDOFF — NBA Prop Intel
**Version:** v0.1 · **Date:** 2026-11-11 America/Chicago · **Author:** ChatGPT GPT-6 · **Status:** manual local working prototype, not production or deployed.

## Read this first
**EXISTING CANONICAL RESEARCH RULEBOOK:** ChatGPT Library file `/J_Sports_Prop_Framework.md`, last established Oct 22, 2026. Locate/read it before all NBA prop analyses; do not overwrite or fork the standing method. It requires role/minutes scenarios, mechanisms, opposite thesis, line-price discipline, proper combo distributions and `HOLD / LEAN / PASS / VALUE GONE` verdicts. Its dated Oct 22 slate review is NOT current data. The library file is a framework, while this project has its own code and handoff.

The user's goal is to **easily see key NBA player props and have each properly researched**, improving the system iteratively with independent AI agents. The user explicitly allows beneficial integration with the existing **J Command Hub**. Preserve all source/line/timestamp evidence and prior agent findings. DO NOT claim fake examples are real, or that past hit rate equals prediction probability.

## Identity & versioning
- Canonical SOURCE HOME: the PUBLIC GitHub repository `https://github.com/jlemay90/nba-prop-intel` (initial v0.1 files published from original recovered source). The earlier ZIP in Google Drive remains an immutable historical fallback, not the ongoing handoff location. Verify file hashes against `MANIFEST.sha256`. The standalone `nba-prop-intel.html` is a convenience build.
- **ORIGINAL:** First code-bearing GitHub commit on main after v0.1 import; obtain its actual SHA from Git history (the earlier November 11 source ZIP remains the archival prior artifact).
- **PREVIOUS STABLE:** unavailable; no accepted user-reviewed production release.
- **CURRENT WORK (updated session 5):** branch `agent/grok-bot/real-props-from-snapshot` (includes sessions 2–4) @ work commit `1101fd57e1f985d96e29a322e4d4a4b6de5edadf`, unmerged. (Session 4: `agent/grok-bot/verify-quote-panel` @ `c1dfb30`.) (Session 3: `agent/grok-bot/odds-cli` @ `855254b`.) `main` is still `034142e`. Earlier: v0.1 imported into the public GitHub repository on `main`. Verify latest commit and create a new `agent/<name>/<task>` branch before any further feature changes; do not assume that a future agent's branch has merged.
- Global app-continuity rule in `https://github.com/jlemay90/j-god-agent/blob/main/.agents/skills/app-continuity/SKILL.md`; read before making new changes.

## Source code
`index.html` UI and entry form; `styles.css` responsive styling; `app.js` normalizer, data-store, calculations, review log, import/export; `browser_smoke_inline.py` headless injected browser smoke test; `README.md` for users; `PROJECT-OVERVIEW.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `CHANGELOG.md`, `KNOWN-ISSUES.md`, `TEST-REPORT.md` are canonical documents. Avoid creating duplicate manuals.

## What actually works
All current operations are **local**: sample props, entry/edit/delete, last-5/10/20 strict line outcome rates, raw implied bookmaker probability, source-presence/time flags, independent agent review append, JSON export/import. Tested with Chromium inline injection, simulated localStorage and exported JSON. Syntax checked with Node. Read TEST-REPORT for exact evidence and test limitations.

## What is NOT done
No real NBA player-prop quotes have been ingested; no scheduled research agents or server-side API, no auth, no live injury sync, no historical outcome tracking, no Hub production UI integration, no spend, no bet placement, and no automatic cross-device continuity. Hub project index capture may exist separately; verify with live Hub readback, not assumption. Do not report any of those as completed.

## Integration boundary
Hub is the navigation/project system of record; this app owns its NBA research records. Preserve existing J Hub homepage and Zeus/Telegram workflow, never send NBA examples into parenting/finance data, and never create duplicate daily automation or storage. Initial Hub integration should be **one opt-in project pointer and next action**, not a heavy homepage redesign. Authenticate any future read/write APIs and restrict permissions.

## Source strategy (verified documentation; no subscription selected)
1. NBA official injury-report 2026–27 https://official.nba.com/nba-injury-report-2026-27-season/
2. BALLDONTLIE NBA API docs https://docs.balldontlie.io/ — V2 player props are live and **not historically stored**; opening prop history may require a higher tier.
3. The Odds API NBA docs https://the-odds-api.com/sports/nba-odds.html — event-specific player prop markets; historical requests have plan restrictions: https://the-odds-api.com/liveapi/guides/v4/
Check contract/pricing quotas and CORS/source rules before adding network requests. Keep credentials server-side.

## Recommended multi-agent lanes
- **Source/odds agent:** gather exact book, game, market, line, sides, snapshot time, price and immutable source ID.
- **Statistics agent:** independent game log with dates, minutes, starting role, DNP exclusion and correct last-N denominators.
- **Availability agent:** official injury report revision and likely rotation effects, clear confirmed vs inferred.
- **Matchup agent:** pace, opponent scheme, team rotations, game context, blowout or foul-risk counterexamples.
- **Skeptical auditor:** disprove weak rationale; check timestamp leakage, data conflicts and unsupported claims.
- **Evaluation agent:** record frozen pregame predictions and actual outcomes, source-linked; audit calibration and odds value using only out-of-sample history.
Each output should contain `checked_at`, `source_url`, `facts`, `inference`, `unknowns`, `counterargument`, `agent`, `record_id`. Append; never overwrite a conflicting review without preserving history.

## Smallest next engineering action
Implement **one real read-only prop data connector** behind a server-side key with a single-game acceptance test. Match a named current player/game/market/side/line to the provider's exact snapshot, show its provenance and lack-of-coverage behavior. Do not build a scoring/ranking model until live lines and logs are trustworthy.

## Acceptance & rollback
- Source quote matches real provider response and time. Retry with a missing market → clear "No verified quote available". No synthetic fallback in live mode.
- Existing local JSON import/export retains format or ships tested migration; fixture tests and mobile interaction continue to pass.
- All agent reviews remain visible through conflict cases; no truth upgrades from missing source fields.
- Any new integration stays optional; revert to previous archived v0.1 files if tests fail. Merge/deploy, paid API plan, credentials and new persistent backend need owner-approved scope.

## The next agent should report
Original/current/stable refs; read docs; exact change; concrete tests/evidence; newly found issues; rollback; what was not done. Update the existing AGENT-HANDOFF.md after change and preserve historical snapshots. User should not need to restate this context.