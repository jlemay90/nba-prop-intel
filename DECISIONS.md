# DECISION LOG
2026-11-11 · **OWNER** · Build a continuously improvable NBA props research guide/app with other-agent handoff. Accept J Command Hub integration if beneficial.

2026-11-11 · **IMPLEMENTATION RECOMMENDATION** · Begin with a separate phone-first static board and portable source+handoff archive, not by modifying live Hub/Zeus. Lower risk; no unapproved new vendor subscription or source overwrite. Hub can index it and later embed an opt-in navigation tile.

2026-11-11 · **IMPLEMENTATION RECOMMENDATION** · Synthetic demo data is clearly marked; source URLs and dates required for a minimum-completeness status. No live odds until a supported API is connected. This is a deliberate evidence-quality safeguard, not full verification.

2026-11-11 · **OPEN** · Select final data provider, paid plan, access/usage budget and deployment/auth destination. No cost, account connection, deployment or API key approved yet.

2026-11-11 · **OPEN** · Whether the final interface shows ranked props and, if so, how the ranking is validated and calibrated. No proof of predictive advantage exists in v0.1.

2026-11-11 · **VERIFIED EXISTING USER FRAMEWORK** · Located `/J_Sports_Prop_Framework.md` in ChatGPT Library. Standing sports prop method supersedes any conflicting proposed methods here; use its HOLD / LEAN / PASS / VALUE GONE verdicts. The Oct 22 slate is historic, never current odds.

2026-11-11 · **AGENT (Claude) — PROVIDER ASSESSMENT (sources read this session)** · No purchase made; no key exists.
- **Odds / props → The Odds API (proposed proof-of-concept).** Official pricing page lists a free Starter plan (500 credits/month, "all betting markets", "most bookmakers") then $30/20K, $59/100K, $119/5M, $249/15M. Player props come from the per-event endpoint; NBA props are US and AU bookmakers only. Cost = markets × regions per event call; historical odds (incl. props from 2023-05-03) are paid-only at 10×. Budget example: 3 markets × 1 region × 10 games = 30 credits per refresh, so ≈16 full-slate refreshes per month on the free plan. **UNVERIFIED:** whether a free key actually returns player-prop outcomes (needs one live call by the owner); provider terms of use for storing/redistributing odds in a public repo were not reviewed.
- **Odds / props alternative → BALLDONTLIE.** Official docs: Player Props and Betting Odds require GOAT ($39.99/mo per league); props are live only and not historically stored (opening-line history is a separate endpoint); 7-day GOAT trial requires a payment method. Not recommended first: costs money and the free proof-of-concept exists elsewhere.
- **Game logs → BALLDONTLIE `/v1/stats`.** Official docs: free tier covers only Teams/Players/Games; Game Player Stats needs ALL-STAR ($9.99/mo per league; 60 req/min). Free tier 5 req/min. **Cheapest verified route to real logs costs money → owner decision.** An official NBA.com stats source was **not researched** this session and is UNVERIFIED (undocumented endpoints, terms unknown); do not assume it is usable.
- Third-party blog pricing conflicted with official docs (e.g. All-Access $499.99 vs $299.99 on the official page); official provider pages govern.
- **Decision:** implement a provider-agnostic, offline-testable contract first (`odds-adapter.js`); wire UI only after a real response is captured. Keep keys server-side/CLI only.

2026-11-11 · **AGENT (Claude) — DEFECT FIX** · Corrupted saved data was preserved on load but destroyed by the next save (reproduced). Now the raw string is copied to `j-nba-prop-intel-v0.1-corrupt-backup-<epoch ms>` before any write; if that copy fails, saving is blocked. Smallest reversible change in `app.js`; single-file build re-synced.
