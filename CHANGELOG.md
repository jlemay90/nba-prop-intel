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

## 2026-11-11 (session 2) — branch `agent/claude/real-browser-smoke-and-provider-contract` (Claude)
- **Fixed** (KNOWN-ISSUES #7): `app.js` `load()`/`save()` no longer lets a new save overwrite unreadable saved data; raw copy kept under `j-nba-prop-intel-v0.1-corrupt-backup-<timestamp>`; saving blocks if the copy cannot be made. `nba-prop-intel.html` inline script re-synced from `app.js`.
- **Added** `odds-adapter.js` (read-only provider contract, not loaded by the UI), `fixtures/MOCK-*.json` (synthetic), `tests/adapter.test.js` (10 tests), `real_browser_test.py` (11 real-navigation tests).
- **Changed** `smoke_test.py`: Chromium path now optional via `CHROMIUM_PATH`; uses `sys.executable` instead of `python`. Behavior otherwise unchanged.
- **Docs**: provider assessment (DECISIONS), data contract (ARCHITECTURE), test evidence (TEST-REPORT), issue status (KNOWN-ISSUES), next task (AGENT-HANDOFF).
- `MANIFEST.sha256` is intentionally NOT regenerated: it records the ORIGINAL v0.1 import (`v0.1.0-original`). `app.js`, `nba-prop-intel.html`, `smoke_test.py` hashes now differ by design.
