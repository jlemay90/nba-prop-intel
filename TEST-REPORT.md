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