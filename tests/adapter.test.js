'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
const A = require('../odds-adapter.js');
const load = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', f), 'utf8'));
const META = { collectedAt: '2026-11-11T22:55:00Z', sourceUrl: 'https://api.the-odds-api.com/v4/sports/basketball_nba/events/mock-event-0001/odds?regions=us&markets=player_points,player_rebounds&oddsFormat=american' };
const NOW = '2026-11-11T23:00:00Z';
const raw = load('MOCK-event-odds.json');

test('normalizeEventOdds: every accepted quote carries all 10 required provenance fields', () => {
  const { quotes } = A.normalizeEventOdds(raw, META);
  assert.ok(quotes.length >= 3);
  for (const q of quotes) for (const f of A.QUOTE_REQUIRED) assert.ok(q[f] != null && q[f] !== '', `missing ${f}`);
});
test('normalizeEventOdds: rejects decimal price, missing player, unmapped market, missing last_update — never defaults', () => {
  const { quotes, rejected } = A.normalizeEventOdds(raw, META);
  const reasons = rejected.map(r => r.reason).join(' | ');
  assert.match(reasons, /American odds/); assert.match(reasons, /Missing required fields: player/);
  assert.match(reasons, /Unmapped market key/); assert.match(reasons, /last_update/);
  assert.equal(quotes.some(q => q.player === 'Mock Player Gamma'), false);
});
test('normalizeEventOdds: refuses sourceUrl containing an API key, and malformed responses', () => {
  assert.match(A.normalizeEventOdds(raw, { ...META, sourceUrl: META.sourceUrl + '&apiKey=SECRET' }).rejected[0].reason, /API key/);
  assert.equal(A.normalizeEventOdds({}, META).quotes.length, 0);
  assert.equal(A.normalizeEventOdds(raw, {}).quotes.length, 0);
});
test('findQuotes OK: exact player/market/side/line, fresh by provider last_update', () => {
  const { quotes } = A.normalizeEventOdds(raw, META);
  const r = A.findQuotes(quotes, { player: 'mock player alpha', market: 'Points', side: 'Over', line: 24.5 }, { now: NOW });
  assert.equal(r.status, 'OK'); assert.equal(r.quotes.length, 1); assert.equal(r.quotes[0].book, 'mockbook_a'); assert.equal(r.quotes[0].price, -115);
});
test('findQuotes STALE: exact quote exists but provider last_update is older than 30 minutes', () => {
  const { quotes } = A.normalizeEventOdds(raw, META);
  const r = A.findQuotes(quotes, { player: 'Mock Player Alpha', market: 'Points', side: 'Over', line: 25.5 }, { now: NOW });
  assert.equal(r.status, 'STALE'); assert.ok(r.quotes.length === 1);
});
test('findQuotes UNAVAILABLE: no nearest-line fallback; missing market says "No verified quote available"', () => {
  const { quotes } = A.normalizeEventOdds(raw, META);
  const r = A.findQuotes(quotes, { player: 'Mock Player Alpha', market: 'Points', side: 'Over', line: 25 }, { now: NOW });
  assert.equal(r.status, 'UNAVAILABLE'); assert.equal(r.reason, 'No verified quote available'); assert.equal(r.quotes.length, 0);
  assert.equal(A.findQuotes(quotes, { player: 'Nobody Real', market: 'Points', side: 'Over', line: 1.5 }, { now: NOW }).status, 'UNAVAILABLE');
});
test('findQuotes UNAVAILABLE: unmapped markets are not guessed', () => {
  const { quotes } = A.normalizeEventOdds(raw, META);
  const r = A.findQuotes(quotes, { player: 'Mock Player Alpha', market: '3PT made', side: 'Over', line: 2.5 }, { now: NOW });
  assert.equal(r.status, 'UNAVAILABLE'); assert.match(r.reason, /no verified provider key/);
});
const SMETA = { collectedAt: '2026-11-11T22:56:00Z', sourceUrl: 'https://api.balldontlie.io/v1/stats?player_ids[]=1&seasons[]=2026' };
test('normalizeGameLog: excludes in-progress and zero-minute rows; handles mm:ss; newest first; records window', () => {
  const g = A.normalizeGameLog(load('MOCK-stats-rows.json').data, 'Points', 10, SMETA);
  assert.deepEqual(g.games.map(x => x.value), [22, 30, 25, 18]); assert.deepEqual(g.games.map(x => x.date), ['2026-11-09', '2026-11-07', '2026-11-03', '2026-11-01']);
  assert.equal(g.selected_count, 4); assert.equal(g.status, 'PARTIAL');
  assert.equal(g.games[1].minutes, 31.5);
  assert.deepEqual(g.window, { newest: '2026-11-09', oldest: '2026-11-01' });
  assert.ok(g.excluded.some(e => /Participation unverified/.test(e.reason)) && g.excluded.some(e => /not final/.test(e.reason)));
  assert.match(g.dnp_treatment, /UNVERIFIED/); assert.match(g.push_treatment, /pushes/);
});
test('normalizeGameLog: respects n and sums combo markets; refuses unsupported market / missing source', () => {
  const rows = load('MOCK-stats-rows.json').data;
  const g = A.normalizeGameLog(rows, 'PRA', 2, SMETA);
  assert.deepEqual(g.games.map(x => x.value), [34, 41]); assert.equal(g.status, 'OK');
  assert.equal(A.normalizeGameLog(rows, 'Dunks', 5, SMETA).status, 'UNAVAILABLE');
  assert.equal(A.normalizeGameLog(rows, 'Points', 5, {}).status, 'UNAVAILABLE');
  assert.equal(A.normalizeGameLog([], 'Points', 5, SMETA).status, 'UNAVAILABLE');
});
test('fixtures are labelled MOCK and contain no key-like secrets', () => {
  for (const f of ['MOCK-event-odds.json', 'MOCK-stats-rows.json']) { const t = fs.readFileSync(path.join(__dirname, '..', 'fixtures', f), 'utf8'); assert.match(t, /"_MOCK"/); assert.doesNotMatch(t, /apikey|authorization/i); }
});
