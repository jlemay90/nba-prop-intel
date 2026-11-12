'use strict';
/* Unit tests for verify-quote.js (read-only Verify quote panel helpers). MOCK data only; no network. */
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
const A = require('../odds-adapter.js'); const V = require('../verify-quote.js');
const FIX = path.join(__dirname, '..', 'fixtures');
const snapText = fs.readFileSync(path.join(FIX, 'MOCK-snapshot.json'), 'utf8');
const snap = JSON.parse(snapText);
const NOW = '2026-11-11T23:00:00Z'; // mockbook_a updated 22:50Z (fresh), mockbook_b 20:00Z (stale)
const rec = (o) => ({ player: 'Mock Player Alpha', market: 'Points', side: 'Over', line: 24.5, gameDate: '2026-11-11', odds: 175, sportsbook: 'Record Book Should Not Appear', demo: false, ...o });
const loaded = () => V.parseSnapshotText(snapText, 'MOCK-snapshot.json').snapshot;

test('MOCK snapshot fixture is exactly normalizeEventOdds(MOCK-event-odds.json) in CLI shape', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(FIX, 'MOCK-event-odds.json'), 'utf8'));
  const n = A.normalizeEventOdds(raw, { collectedAt: snap.meta.collectedAt, sourceUrl: snap.meta.sourceUrl });
  assert.deepEqual(snap.quotes, n.quotes); assert.deepEqual(snap.rejected, n.rejected);
  assert.ok(snap.meta && snap.quota && snap._MOCK && snap.meta.mock === true);
});
test('parseSnapshotText accepts the CLI snapshot shape and flags MOCK', () => {
  const r = V.parseSnapshotText(snapText, 'MOCK-snapshot.json');
  assert.equal(r.ok, true); assert.equal(r.snapshot.quotes.length, 4); assert.equal(r.snapshot.mock, true);
});
test('parseSnapshotText refuses invalid JSON, empty, arrays, raw Odds API bodies and board exports', () => {
  for (const t of ['', '{bad json', '[]', 'null', '42']) assert.equal(V.parseSnapshotText(t).ok, false, t);
  const raw = fs.readFileSync(path.join(FIX, 'MOCK-event-odds.json'), 'utf8');
  const r = V.parseSnapshotText(raw); assert.equal(r.ok, false); assert.match(r.error, /raw Odds API response/);
  assert.match(V.parseSnapshotText(JSON.stringify({ schema: 'j-nba-prop-intel', version: '0.1', records: [] })).error, /research-board export/);
  assert.match(V.parseSnapshotText(JSON.stringify({ meta: {}, quotes: [] })).error, /meta.provider/);
  assert.match(V.parseSnapshotText(JSON.stringify({ quotes: [] })).error, /expected \{meta, quotes/);
});
test('parseSnapshotText refuses a file whose source_url or sourceUrl contains an API key (no quotes loaded)', () => {
  const k1 = JSON.parse(snapText); k1.quotes[2].source_url += '&apiKey=FAKEKEY000';
  const k2 = JSON.parse(snapText); k2.meta.sourceUrl += '&apikey=FAKEKEY000';
  const k3 = JSON.parse(snapText); k3.quotes[0].source_url += '&api_key=FAKEKEY000';
  for (const o of [k1, k2, k3]) { const r = V.parseSnapshotText(JSON.stringify(o)); assert.equal(r.ok, false); assert.match(r.error, /API key/); assert.equal(r.snapshot, undefined); assert.doesNotMatch(r.error, /FAKEKEY000/); }
});
test('parseSnapshotText refuses the whole file if any quote is malformed (never partially loads or repairs)', () => {
  const mut = [q => { delete q.price; }, q => { q.price = 1.91; }, q => { q.provider_updated_at = 'yesterday'; }, q => { q.side = 'Yes'; }, q => { q.source_url = 'http://x.test/a'; }, q => { q.provider = 'made-up'; }];
  for (const m of mut) { const o = JSON.parse(snapText); m(o.quotes[1]); const r = V.parseSnapshotText(JSON.stringify(o)); assert.equal(r.ok, false); assert.match(r.error, /malformed/); }
});
test('verifyRecord: OK for a fresh exact match; uses only player/market/side/line', () => {
  const v = V.verifyRecord(loaded(), rec(), { now: NOW });
  assert.equal(v.status, 'OK'); assert.equal(v.quotes.length, 1); assert.equal(v.quotes[0].book, 'mockbook_a'); assert.equal(v.quotes[0].price, -115);
});
test('verifyRecord: STALE when exact quotes exist but all are older than 30 minutes', () => {
  assert.equal(V.verifyRecord(loaded(), rec({ line: 25.5 }), { now: NOW }).status, 'STALE');
  assert.equal(V.verifyRecord(loaded(), rec(), { now: '2026-11-11T23:30:00Z' }).status, 'STALE');
});
test('verifyRecord: UNAVAILABLE for mismatched line (no nearest), unknown player, unmapped market; NOT_LOADED with no file', () => {
  const s = loaded();
  const a = V.verifyRecord(s, rec({ line: 25 }), { now: NOW }); assert.equal(a.status, 'UNAVAILABLE'); assert.equal(a.quotes.length, 0);
  assert.equal(V.verifyRecord(s, rec({ player: 'Sample Lead Guard' }), { now: NOW }).status, 'UNAVAILABLE');
  const u = V.verifyRecord(s, rec({ market: '3PT made', line: 2.5 }), { now: NOW }); assert.equal(u.status, 'UNAVAILABLE'); assert.match(u.reason, /no verified provider key/);
  assert.equal(V.verifyRecord(null, rec()).status, 'NOT_LOADED');
});
test('renderPanelBody: empty state does not claim a search ran or show any price', () => {
  const h = V.renderPanelBody({}, rec(), { now: NOW });
  assert.match(h, /NO SNAPSHOT LOADED/); assert.doesNotMatch(h, /UNAVAILABLE|data-status="OK"|STALE/); assert.doesNotMatch(h, /\+175|Record Book/);
});
test('renderPanelBody: OK shows book, price, timestamps, event and key-free source; never the record price/book', () => {
  const h = V.renderPanelBody({ snapshot: loaded() }, rec(), { now: NOW });
  assert.match(h, /data-status="OK"/); assert.match(h, /mockbook_a/); assert.match(h, /-115/); assert.match(h, /Mock Away Team at Mock Home Team/);
  assert.match(h, /MOCK FIXTURE/); assert.match(h, /href="https:\/\/api\.the-odds-api\.com\//); assert.match(h, /10 min ago/);
  assert.doesNotMatch(h, /\+175|Record Book|apiKey/i);
});
test('renderPanelBody: STALE shows reason and the stale exact quote; UNAVAILABLE shows reason and no prices', () => {
  const st = V.renderPanelBody({ snapshot: loaded() }, rec({ line: 25.5 }), { now: NOW });
  assert.match(st, /data-status="STALE"/); assert.match(st, /older than 30 minutes/); assert.match(st, /mockbook_b/);
  const un = V.renderPanelBody({ snapshot: loaded() }, rec({ market: '3PT made', line: 2.5 }), { now: NOW });
  assert.match(un, /data-status="UNAVAILABLE"/); assert.match(un, /no verified provider key yet/); assert.doesNotMatch(un, /vq-quote|mockbook|[+-]1\d\d\b/);
});
test('renderPanelBody: shows the load error and escapes HTML from file contents', () => {
  assert.match(V.renderPanelBody({ error: 'File is not valid JSON.' }, rec()), /role="alert">File is not valid JSON\./);
  const o = JSON.parse(snapText); o.quotes[0].book = '<img src=x onerror=alert(1)>';
  const h = V.renderPanelBody({ snapshot: V.parseSnapshotText(JSON.stringify(o)).snapshot }, rec(), { now: NOW });
  assert.doesNotMatch(h, /<img/); assert.match(h, /&lt;img/);
});
