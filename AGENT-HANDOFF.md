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
- **CURRENT WORK (updated session 2):** branch `agent/claude/real-browser-smoke-and-provider-contract` @ `c5b8307` (+ this handoff commit), unmerged. `main` is `034142e`. Earlier: v0.1 imported into the public GitHub repository on `main`. Verify latest commit and create a new `agent/<name>/<task>` branch before any further feature changes; do not assume that a future agent's branch has merged.
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