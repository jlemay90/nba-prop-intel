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

# TEST REPORT — 2026-11-11 (agent/scoob, branch `agent/scoob/verdict-persistence`)
**Environment:** Python 3.12, Node 24.22, Playwright (pip venv) + Chromium 1181 downloaded from the Playwright CDN, Linux VM. App served over real HTTP (`python -m http.server 8137`) and loaded via `file://` — both real page loads with native `localStorage`, NOT inline injection.

### Passed checks
- `node --check app.js` — PASS.
- Node harness over `normalRecord()` verdict inputs — PASS for all 8 values (HOLD/LEAN/PASS/VALUE GONE preserved; legacy `watch`/`research` → HOLD, `pass` → PASS; unknown → HOLD). This harness reproduced the defect before the fix (LEAN/PASS/VALUE GONE → HOLD) and verified it after.
- **`verdict_test.py` (new) — FULL PASS, real browser, HTTP, native storage:**
  - MOBILE LOAD PASS: 390×844, 3 demo cards, no horizontal overflow.
  - ADD PASS: form record with verdict LEAN saved, total 4.
  - RELOAD+DETAIL PASS: after real reload, total still 4; detail view REVIEW VERDICT reads "LEAN — LEAN unless the line moves."
  - EXPORT PASS: exported JSON record verdict is LEAN.
  - IMPORT PASS: imported PASS and VALUE GONE survive; legacy lowercase `pass` migrates to PASS.
  - DESKTOP PASS: 1280×800, 3 imported records, no horizontal overflow.
  - Zero uncaught page exceptions throughout.
- **`smoke_test.py` (documented suite, unmodified logic; only the Chromium path and a `python`→`python3` shim changed for this environment) — PASS:**
  - MOBILE PASS: initial demo, no overflow, add/edit persistence, hit rates, dialog, agent review, export; console exceptions: [].
  - DESKTOP PASS: initial render, no horizontal overflow.
  - Note: `file://` navigation WORKED in this environment (the original report's `ERR_BLOCKED_BY_ADMINISTRATOR` did not reproduce here), so the file-load path was genuinely exercised.

### NOT tested / limitations (this session)
- Cloud-browser page-load attempts FAILED for environment reasons, not app reasons, and were abandoned after two routes: (1) Muse file-hosting URL for the single-file build was refused by the browser's organization policy ("This page is blocked"); (2) jsDelivr serves GitHub `.html` as `text/plain`, so the page displayed as source text instead of rendering. Neither failure implicates the app.
- Local Playwright setup note: `/tmp` is a 512 MB tmpfs — the Chromium download (~181 MB) repeatedly failed there with write errors until the download was moved to the home filesystem. The venv and browser now live at `~/workspace/.pw-venv` and `~/workspace/.pw-chromium` (not committed). The repo's `verdict_test.py` points at that Chromium path; a future agent with Playwright's own browser installed should adjust `executable_path` or remove it.
- No Android Chrome QA, no screenreader audit, no live API connection, no accuracy audit against real NBA boxes, no Hub embed. Push/whole-number/DNP/malformed-import/storage-corruption cases from the original "Next test" list remain open.
- `verdict_test.py` covers the verdict fix only; it does not re-run the full smoke suite (that is `smoke_test.py`, which passed separately above).

---

# TEST REPORT — 2026-11-12 (agent/scoob, branch `agent/scoob/verdict-persistence`)
**Environment:** Python 3.12, Node 24.22, Playwright (pip venv) + Chromium 1181, Linux VM. App served over real HTTP (`python -m http.server 8138`), real page loads with native `localStorage`.

### Passed checks
- `node --check odds-adapter.js` — PASS. Node harness over `normalizeEventOdds` with the committed `ok` fixture — PASS, exact contract row (provider the-odds-api, book draftkings, event "New York Knicks @ Boston Celtics — 2026-11-12T23:00:00Z", player Jayson Tatum, market player_points, side Over, line 26.5, price -110, source_url `fixtures/odds-api-mock.json#ok`, collected_at, last_update, mock true).
- **`odds_adapter_test.py` (new) — FULL PASS, real browser, HTTP, native storage:**
  - MOCK OK PASS: fresh-timestamp fixture row renders with the exact contract fields + MOCK badge.
  - NO-MARKET PASS: UNAVAILABLE ("No line posted yet"), no fabricated line.
  - STALE PASS: HOLD with stale reason, row fields still shown.
  - NO-KEY PASS: live mode refuses (NO_KEY), zero API calls observed.
  - QUOTA PASS: stubbed 429 → UNAVAILABLE ("quota exhausted"), dummy key never appears in page text.
  - COMMITTED FIXTURE PASS: real `fixtures/odds-api-mock.json` loads, mock flagged, fail-closed by age (OK or HOLD depending on run time).
  - SINGLE-FILE PASS: `nba-prop-intel.html` carries the panel and adapter.
  - Zero uncaught page exceptions throughout.
- **Regression — `verdict_test.py` FULL PASS** (all six checks: mobile load, add LEAN, reload+detail, export, import, desktop). **`smoke_test.py` PASS** (mobile + desktop, no console exceptions). The odds panel did not break any existing flow.
- One 404 in the HTTP log during the adapter run: `/favicon.ico` (no favicon shipped) — cosmetic only.

### NOT tested / limitations (this session)
- No live Odds API call was made — no key exists. CORS from the static page, the exact live response shape, and per-event book coverage remain unconfirmed until the owner creates a free account and pastes a key. If CORS blocks the browser call, the outcome is "server-side fetch required," not a proxy workaround.
- The committed fixture's `ok` scenario is a dated snapshot (2026-11-12 16:00Z); viewed more than 60 minutes after that, it correctly reports HOLD. That is the fail-closed rule working, not a defect.
- No Android Chrome QA, no screenreader audit, no accuracy audit against real NBA boxes, no Hub embed. Push/whole-number/DNP/malformed-import/storage-corruption cases from the original "Next test" list remain open.