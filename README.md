# NBA Prop Intel — J Command Hub research lab (v0.1)

**Canonical source and living multi-agent handoff:** https://github.com/jlemay90/nba-prop-intel. Start each agent session at `AGENT-HANDOFF.md`, followed by `AGENTS.md`. The older ZIP is a historical fallback, not a parallel source of truth.

**Status:** Working static prototype; manual source-backed research only. No paid API, real-time odds, cloud sync, or production Hub embed is connected. As of 2026-11-11 (America/Chicago).

## Run it
Open `index.html` in a browser with the adjacent `styles.css` and `app.js` files, or serve the folder as static files (e.g., `python -m http.server 8000`). A local web server is preferred on browsers that restrict local-file storage. On Android, host on a private HTTPS endpoint to use across devices after implementing authentication and a backend.

## Read-only odds CLI

A dependency-free Node script fetches The Odds API event list (0 credits) or one event's player-prop odds, normalizes them with `odds-adapter.js`, and writes a local provenance-stamped snapshot. The key must come from the `ODDS_API_KEY` environment variable. It is never printed, logged, stored, or written into `source_url`. Snapshots land in `data/snapshots/` and are git-ignored until provider terms are reviewed.

```bash
# Event list (0 credits)
node scripts/fetch-event-odds.js --list

# One event, one market, US region (1 credit). Cost = markets × regions.
# Refuses before any request if that cost exceeds --max-cost (default 3).
node scripts/fetch-event-odds.js --event <eventId> --markets player_points --regions us
```

Allowed markets: `player_points`, `player_rebounds`, `player_assists`. Offline tests (fake fetch, no network): `node --test tests/*.js`. A live call was made once in session 3 (see TEST-REPORT). MOCK fixtures and synthetic demo props are not real odds. This CLI is not a live feed, and the browser never runs it or calls the provider.

### Verify a price in the board (read-only)
1. Run the CLI above for one event; it writes `data/snapshots/<eventId>-<collectedAt>.snapshot.json` (git-ignored, stays on your device).
2. Open the board, tap **Open research** on a card, and in **VERIFY QUOTE** tap **Load snapshot file** and pick that file.
3. The panel shows **OK** (fresh exact quotes, ≤30 min since the provider's update), **STALE** (exact quotes, all older), or **UNAVAILABLE** (no exact player/market/side/line match, or a market such as 3PT made with no verified provider key). It never falls back to the record's own price or a nearby line, and it is a price check, not a pick.

The file stays in memory for that page session only (it is reused when you open another card) and is never saved into your records or exports. Files with an API key in a source URL are refused. `fixtures/MOCK-snapshot.json` is a synthetic test file that shows how it works.

## What works
- Mobile-first prop board with market, state and keyword filters.
- Create/edit/delete research records; quote capture time, book, line, odds, stat logs, injury status and linked source evidence.
- Last-5/10/20 line-specific hit rates, including push exclusion, sample sizes, mean/median, raw implied probability from American odds.
- Freshness flags (older than 30m quote), source-presence checks, incomplete injury/rotation checks, and stale/past games.
- Independent role-based agent review append log, with citations and timestamps.
- Local device persistence, import/export JSON; import validates schema and requires confirmation before replacement.
- Three conspicuously fictional, synthetic demo records. A real record is never classified as researched solely from synthetic data.

## Standing research authority
The owner already has a canonical **J’s Sports Prop Framework — MLB and NBA** in the ChatGPT Library at `/J_Sports_Prop_Framework.md` (Oct 22, 2026). Use its method and verdicts `HOLD`, `LEAN`, `PASS`, `VALUE GONE` rather than establishing competing rules. The dated Oct 22 NBA slate inside that file is historic and must NOT be presented as current.

## Explicit limits
1. No real/current odds, box scores, injured-player statuses or matchup data have been fetched into this app. Do not treat synthetic demos as real props.
2. Entered URLs and notes are user/agent claims. This prototype checks **presence**, not authenticity or truth; `Checklist complete` is a minimum completeness label, **not verified accuracy** or a profitability signal.
3. Last-N percentage is descriptive: it is not a projected probability and cannot by itself justify expected-value/edge claims. Implied probability contains sportsbook margin.
4. Browser storage is device/browser-scoped; export your JSON file. No security boundary prevents a person with browser access from opening records. Do not add sensitive Hub account data.
5. No backtest or settlement tracking, automated source refresh, calendar synchronization, or app deployment. Automatic odds/injury refresh, deduplicated market IDs, and calibrated forecasting are future work.
6. Manual JSON export/import is not an authenticated machine-to-machine agent collaboration protocol. Never expose user API keys in frontend code.

## Proposed production architecture (not implemented)
- Frontend: mobile PWA with an optional `NBA Prop Intel` entry in the existing Hub. Keep Hub home minimal; avoid unrelated daily task noise.
- Backend: auth-gated read/write API and Postgres normalized `games`, `players`, `market_quotes`, `stat_game_logs`, `injury_reports`, `research_reviews`, `projections`, `backtests`.
- Data providers: BALLDONTLIE NBA API for NBA logs and optional props (see limitations), or The Odds API NBA event markets for current/historical price snapshots. NBA official injury-report page for verification. Verify rate limits and plan fees before implementing.
- Quotes: store each `(provider, event, player, market, line, side, sportsbook, captured_at)` and original response reference; do not rewrite historical snapshots.
- Research: dedicated stats, injury/rotation, opponent, price and adversarial reviews; append-only with provenance. Require approval for changing forecasts and any publishing.
- Hub interface: navigation tile + high-level project status + source pointer. NBA data lives with NBA app; no duplicate canonical research store in the Hub or Zeus memory.

## Data & interoperability
Export format is `schema: j-nba-prop-intel`, `version: 0.1`, `exportedAt: ISO8601`, `records: [...]`. New agents should append `reviews` with role, stance, source, timestamp, agent and notes. For live multi-agent sync, introduce a server-owned append-only review endpoint with auth, idempotency keys, timestamps and conflict rules. Do not merge competing JSON exports by overwriting a whole record.

## First production acceptance checks
1. A source quote retrieved live at time T is displayed with its exact side/line/price/book and source timestamp.
2. 10 real last-game values match a named official/source game log at those dates, with DNP excluded and push logic correct.
3. Official injury status is linked to the exact report revision; stale reports block readiness.
4. Two independent agent reviews can disagree and both remain visible, without overwrites.
5. Close/reopen/mobile readback and JSON export/import round-trip match the original data.
6. Missing feed, subscription limit or data conflict produces `Unavailable`, not fabricated estimates.
7. A security review confirms per-owner access restrictions, data retention and keys on backend only.

## Sources
- BALLDONTLIE NBA API: https://docs.balldontlie.io/ (live player props endpoint explicitly does **not** store historic snapshots)
- The Odds API basketball/NBA markets: https://the-odds-api.com/sports/nba-odds.html
- The Odds API historical odds docs: https://the-odds-api.com/liveapi/guides/v4/
- NBA official 2026–27 injury reports: https://official.nba.com/nba-injury-report-2026-27-season/

Neither this project nor its data is a sportsbook; no wagers are placed by the app.