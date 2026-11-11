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
# TEST REPORT — 2026-11-11 session 2 (Claude)
**Environment:** Linux container, Python 3.12.3, Node v22.23.4, Playwright 1.63.0 with Chromium 153.0.8010.12 (headless, `--no-sandbox`). Branch `agent/claude/real-browser-smoke-and-provider-contract`.

| Check | Command | Result |
|---|---|---|
| JS syntax | `node --check app.js` and `node --check odds-adapter.js` | PASS |
| Real `file://` page load, 390px and 1280px: render, add, exact-line hit rate, review append, reload, JSON export, no overflow, no page errors | `python3 smoke_test.py` (unmodified baseline `app.js`, then fixed `app.js`) | PASS both times |
| Real `http://127.0.0.1` load, **native localStorage persisted across a full browser close/reopen** | `python3 real_browser_test.py` | PASS |
| Push handling on exact line (line 20, values incl. three 20s → L5 2/3 decided, L10 3/5) | same | PASS |
| Corrupted storage → **new save preserved raw data in backup key** | same | PASS on fix; **FAIL (2 of 11) on original `app.js`**, i.e. the defect was reproduced and the test guards it |
| Backup impossible (quota error injected) → save refuses, raw data untouched | same | PASS |
| Malformed imports (not JSON, wrong schema, record missing fields) rejected with message, dataset unchanged | exploratory probe (not committed) | PASS |
| Adapter unit tests against MOCK fixtures | `node --test tests/adapter.test.js` | PASS 10/10 |
| Secret/PII scan of working tree | regex grep (keys, tokens, emails) | none found |

**Still NOT tested:** Android Chrome / real device; screen reader; any live provider call (none made, no key exists); import of valid-but-large payloads; concurrent tabs writing localStorage; the `index.html` UI consuming the adapter (not wired).
**Exploratory notes:** an import of a valid export with 0 records replaced the dataset with 0 records after confirmation (by design, see KNOWN-ISSUES #6). A saved record with 8 games displays a card heading "Last 20" with the same 8-game result (KNOWN-ISSUES #9).
