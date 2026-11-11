# NBA PROP INTEL — LIVING AGENT HANDOFF

> **MANDATORY: YOUR NEXT ASSIGNMENT IS BELOW.** Do not stop at summarizing this document or ask the owner to choose a task already assigned. First verify the repository and existing baseline. Then complete exactly one bounded improvement, test it, and write the next agent's assignment back into this same file. Never treat this document as a one-time prompt.

## NEXT AGENT — ACTION ORDER (refresh after EVERY session)

**Owner's priority:** Turn the existing mobile-first NBA player-prop research board into a properly sourced, useful research tool. Preserve the already-written code. Allow evidence-based analysis, compare lines/odds, investigate opposing explanations, and pass knowledge between agents. Integrate with J Command Hub as an optional Projects link without changing Hub's main home screen or duplicating its canonical records.

**Current assignment:** Establish a verified, reproducible v0.1 Git baseline, then plan the smallest legitimate read-only real-data provider connection. *If the public repository already contains the baseline when you start, skip setup and move to the next uncompleted step rather than recreating anything.*

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
- **CURRENT WORK:** v0.1 imported into the public GitHub repository on `main`. Verify latest commit and create a new `agent/<name>/<task>` branch before any further feature changes; do not assume that a future agent's branch has merged.
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