# ARCHITECTURE — v0.1

## Current, built
`index.html` static mobile-first UI → `app.js` data validator, derived metrics, entry/filters/agent notes, JSON import/export → browser `localStorage` key `j-nba-prop-intel-v0.1` → `styles.css` responsive design. No dependencies, external API calls, authentication or servers. Illustrative records seeded at first use. Data is device-local; a deleted profile or different phone will not see it. Static sample numbers are synthetic.

### Data schema
JSON root `schema: "j-nba-prop-intel"`, `version: "0.1"`, `exportedAt`, `records[]`.
Each record: `id`, `demo`, `player`, `team`, `opponent`, `gameDate`, `market`, `side`, `line`, `odds`, `sportsbook`, `oddsCaptured`, `oddsSource`, `recentGames` (newest first), `statSource`, `roleNotes`, `injuryStatus`, `injuryChecked`, `injurySource`, `matchupNotes`, `verdict`, `reviewer`, `reason`, `reviews[]`, `createdAt`, `updatedAt`.
Each review: `id`, `role`, `verdict`, `agent`, `source`, `notes`, `timestamp`.

### Derived calculations
- `implied(-110) = 110/(110+100) = 52.38%`, `implied(+115) = 100/215 = 46.51%`. These are *raw* bookmaker implied percentages and include vig.
- Over hit only for `value > line`, under hit only `value < line`; `value === line` is a push excluded from the decided-game denominator. Last-N windows use up to N supplied observations. DNPs must be omitted by data entry.
- Checklist-complete flags only indicate **completeness of required fields and recency**, *not* independent verification of the content. In particular, URL presence does not prove provenance, and agent reviews can still be wrong.

## Proposed production, not built
- Auth-gated backend + Postgres for normalized immutable per-provider snapshots and research runs.
- BALLDONTLIE or The Odds API keyed on server side for current NBA odds and logs, respecting provider access tiers. NBA injury page revision captured with date/time and URL.
- Data validation/reconciliation layer, source-specific throttles and caching, freshness rules, alerts for changes, deterministic statistical calculations, and blinded historical backtesting.
- Hub integration: opt-in navigation entry + project summary; full records remain in the NBA app. Authorized Zeus/agents access an audited restricted research API (never personal Hub data by default).
- Version control in a project-specific repository if available; otherwise preserve an immutable archive with checksums until migration.