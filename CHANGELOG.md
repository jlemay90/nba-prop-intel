# CHANGELOG
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

### 2026-11-11 — Verdict persistence fix (agent/scoob, branch `agent/scoob/verdict-persistence`, commit `c78970a3a1ed070acf2914b571f0e0408d6bde00`)
- **Defect found by real-code inspection + Node reproduction:** `normalRecord()` in `app.js` only accepted the stale lowercase verdicts `['watch','research','pass']`, so the form's framework verdicts LEAN / PASS / VALUE GONE were silently rewritten to HOLD on every save, load, and import. The documented smoke tests never set a verdict, so they never caught it.
- **Fix (one line, `app.js` + single-file `nba-prop-intel.html`):** accept `['HOLD','LEAN','PASS','VALUE GONE']`; map legacy lowercase values (`watch`/`research` → HOLD, `pass` → PASS); anything else still defaults to HOLD.
- **Verified:** `node --check app.js` PASS; Node harness over all eight verdict inputs PASS (LEAN→LEAN, PASS→PASS, VALUE GONE→VALUE GONE, legacy mappings correct, unknown→HOLD).
- **Added `verdict_test.py`:** real HTTP page-load regression test (390px + 1280px) covering save → reload (native localStorage) → detail view → JSON export → import of PASS / VALUE GONE / legacy `pass`. Requires Playwright + Chromium; see TEST-REPORT for run status.
- **Baseline protected:** `v0.1.0-original` tag verified pointing at `aec1f1df1313b343f0453d7af97efe2135a97509`; HEAD at session start `034142e912f708027a2d1946a9d6a9c60210e511`. No merge, no deploy, no spend.
- **Provider research (no code change):** BALLDONTLIE props need GOAT $39.99/mo and game logs need ALL-STAR $9.99/mo; The Odds API Starter free tier (500 credits/mo) returns live player-prop odds with no payment method confirmed by third parties only. Recommended PoC contract documented in AGENT-HANDOFF.md. No key obtained, no account created.