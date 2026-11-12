'use strict';
/* snapshot -> board records (verify-quote.js snapshotToRecords / mergeImported) and scripts/snapshot-to-board.js. MOCK only. */
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
const V = require('../verify-quote.js'); const CLI = require('../scripts/snapshot-to-board.js');
const FIX = path.join(__dirname, '..', 'fixtures'); const SNAP = path.join(FIX, 'MOCK-snapshot.json');
const text = fs.readFileSync(SNAP, 'utf8'); const NOW = '2026-11-11T23:00:00Z';
const snap = (mut) => { const o = JSON.parse(text); if (mut) mut(o); const p = V.parseSnapshotText(JSON.stringify(o)); assert.ok(p.ok, p.error); return p.snapshot; };
const REAL = o => { delete o._MOCK; delete o.meta.mock; }; // same synthetic numbers, but treated as non-mock to test the real path

test('one card per player/market/side at the main line; no duplicate cards per book', () => {
  const r = V.snapshotToRecords(snap(REAL), { now: NOW });
  const keys = r.records.map(x => [x.player, x.market, x.side, x.line].join('|'));
  assert.deepEqual(keys.sort(), ['Mock Player Alpha|Points|Over|24.5', 'Mock Player Alpha|Points|Under|24.5', 'Mock Player Beta|Points|Over|6.5']);
  assert.equal(new Set(r.records.map(x => x.id)).size, 3);
});
test('main line = most book/side quotes; price from fixed BOOK_ORDER, not the best price', () => {
  const s = snap(o => { REAL(o); const q = o.quotes[0]; o.quotes.push({ ...q, book: 'zzbook', price: 150 }, { ...q, book: 'draftkings', price: -130 }); });
  const over = V.snapshotToRecords(s, { now: NOW }).records.find(x => x.player === 'Mock Player Alpha' && x.side === 'Over');
  assert.equal(over.line, 24.5); assert.equal(over.sportsbook, 'draftkings'); assert.equal(over.odds, -130);
});
test('records carry real provenance and invent nothing (no logs, injury unknown, HOLD, empty notes)', () => {
  for (const x of V.snapshotToRecords(snap(REAL), { now: NOW }).records) {
    assert.equal(x.demo, false); assert.deepEqual(x.recentGames, []); assert.equal(x.injuryStatus, 'unknown'); assert.equal(x.verdict, 'HOLD');
    assert.equal(x.roleNotes, ''); assert.equal(x.matchupNotes, ''); assert.equal(x.statSource, ''); assert.equal(x.team, ''); assert.equal(x.opponent, '');
    assert.equal(x.gameDate, '2026-11-11'); // 00:30Z on 11-12 = 6:30 PM America/Chicago on 11-11
    assert.match(x.oddsSource, /^https:\/\/api\.the-odds-api\.com\//); assert.doesNotMatch(x.oddsSource, /key/i);
    assert.match(x.reason, /not a pick/); assert.match(x.reason, /game log/); assert.ok(x.oddsCaptured && x.sportsbook && Number.isInteger(x.odds));
  }
});
test('MOCK snapshot produces demo:true records flagged MOCK (never live-looking)', () => {
  const r = V.snapshotToRecords(snap(), { now: NOW });
  assert.equal(r.mock, true); assert.ok(r.records.length && r.records.every(x => x.demo === true && /^MOCK FIXTURE/.test(x.reason)));
});
test('fresh only: stale sides and started games are skipped, never substituted', () => {
  const stale = V.snapshotToRecords(snap(REAL), { now: '2026-11-11T23:30:00Z' });
  assert.equal(stale.records.length, 0); assert.equal(stale.skipped.stale, 3);
  const started = V.snapshotToRecords(snap(REAL), { now: '2026-11-12T00:31:00Z' });
  assert.equal(started.records.length, 0); assert.equal(started.skipped.started, 4);
});
test('stable ids: re-import refreshes the price in place and keeps user edits; other records untouched', () => {
  const first = V.snapshotToRecords(snap(REAL), { now: NOW }).records;
  const mine = { id: 'user-1', demo: false, player: 'My Own Prop', odds: -110 };
  const edited = { ...first[0], recentGames: [30, 22], reason: 'my notes', reviews: [{ id: 'r' }] };
  const again = V.snapshotToRecords(snap(o => { REAL(o); o.quotes[0].price = -125; }), { now: NOW }).records;
  const m = V.mergeImported([mine, edited, ...first.slice(1)], again, NOW);
  assert.equal(m.added, 0); assert.equal(m.updated, 3); assert.equal(m.records.length, 4);
  const r0 = m.records.find(x => x.id === first[0].id);
  assert.equal(r0.odds, -125); assert.deepEqual(r0.recentGames, [30, 22]); assert.equal(r0.reason, 'my notes'); assert.equal(r0.reviews.length, 1);
  assert.deepEqual(m.records.find(x => x.id === 'user-1'), mine);
});
test('snapshot-to-board CLI writes a v0.1 board file under data/, refuses keyed snapshots and paths outside data/', () => {
  const writes = {}; const logs = [];
  const base = { now: () => NOW, writeFile: (f, s) => { writes[f] = s; }, log: m => logs.push(m), err: m => logs.push(m) };
  assert.equal(CLI.run({ ...base, argv: [SNAP] }), 0);
  const [f, s] = Object.entries(writes)[0]; assert.match(f, /data[\\/]board-import\.json$/);
  const o = JSON.parse(s); assert.equal(o.schema, 'j-nba-prop-intel'); assert.equal(o.version, '0.1'); assert.equal(o.records.length, 3);
  const keyed = JSON.parse(text); keyed.quotes[0].source_url += '&apiKey=FAKEKEY000';
  assert.equal(CLI.run({ ...base, argv: ['k.json'], readFile: () => JSON.stringify(keyed) }), 1);
  assert.ok(logs.some(m => /API key/.test(m)) && !logs.some(m => /FAKEKEY000/.test(m)));
  assert.equal(CLI.run({ ...base, argv: [SNAP, '--out', '/tmp/board.json'] }), 2);
  assert.equal(CLI.run({ ...base, argv: [SNAP], now: () => '2026-11-12T05:00:00Z' }), 1); // nothing fresh -> nothing written
});
test('a MOCK snapshot can never refresh a real record (separate ids, demo/non-demo never merge)', () => {
  const real = V.snapshotToRecords(snap(REAL), { now: NOW }).records; const mock = V.snapshotToRecords(snap(), { now: NOW }).records;
  assert.ok(mock.every(m => m.id.startsWith('mock-') && !real.some(r => r.id === m.id)));
  const forged = mock.map(m => ({ ...m, id: m.id.slice(5), odds: 999 }));
  const m = V.mergeImported(real, forged, NOW); assert.equal(m.updated, 0); assert.ok(m.records.filter(x => !x.demo).every(x => x.odds !== 999));
});
test('the same prop twice in one batch yields one card (later snapshot wins)', () => {
  const a = V.snapshotToRecords(snap(REAL), { now: NOW }).records; const b = a.map(x => ({ ...x, odds: x.odds - 5 }));
  const m = V.mergeImported([], a.concat(b), NOW); assert.equal(m.records.length, 3); assert.equal(m.added, 3);
  assert.deepEqual(m.records.map(x => x.odds), b.map(x => x.odds));
});
