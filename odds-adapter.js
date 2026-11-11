/* NBA Prop Intel — read-only data adapter CONTRACT (v0.2-dev). Pure functions, no network, no keys.
   Normalizes (a) The Odds API v4 event-odds responses into verified-quote records and
   (b) BALLDONTLIE /v1/stats rows into game-log samples. Not loaded by index.html yet.
   Fetching belongs in a server-side wrapper (keys never in this public repo or the browser). */
(function (root) {
  'use strict';
  const PROVIDER_ODDS = 'the-odds-api';
  const PROVIDER_STATS = 'balldontlie';
  /* Only market keys verified in provider docs on 2026-11-11 are enabled. Others stay UNMAPPED until
     confirmed via GET /v4/sports/basketball_nba/events/{id}/markets (do not guess keys). */
  const MARKET_KEYS = { Points: 'player_points', Rebounds: 'player_rebounds', Assists: 'player_assists' };
  const UNMAPPED_MARKETS = ['3PT made', 'PRA', 'PR', 'PA', 'RA', 'Steals', 'Blocks'];
  const STAT_FIELDS = { Points: ['pts'], Rebounds: ['reb'], Assists: ['ast'], '3PT made': ['fg3m'], Steals: ['stl'], Blocks: ['blk'],
    PRA: ['pts', 'reb', 'ast'], PR: ['pts', 'reb'], PA: ['pts', 'ast'], RA: ['reb', 'ast'] };
  const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // matches app's existing 30-minute quote rule
  const QUOTE_REQUIRED = ['provider', 'book', 'event', 'player', 'market', 'side', 'line', 'price', 'source_url', 'collected_at'];

  const normName = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const isAmerican = n => Number.isInteger(n) && Math.abs(n) >= 100 && Math.abs(n) <= 100000;
  const isoOk = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
  const marketFromKey = key => Object.keys(MARKET_KEYS).find(k => MARKET_KEYS[k] === key) || null;

  /* raw: parsed JSON of GET /v4/sports/basketball_nba/events/{eventId}/odds?regions=..&markets=..&oddsFormat=american
     meta: { collectedAt: ISO time the request was made, sourceUrl: request URL WITHOUT apiKey }
     Returns { quotes, rejected:[{reason,...}] }. A quote missing any required field is rejected, never defaulted. */
  function normalizeEventOdds(raw, meta) {
    const out = { quotes: [], rejected: [] };
    const m = meta || {};
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.bookmakers)) { out.rejected.push({ reason: 'Malformed response: no bookmakers array' }); return out; }
    if (!isoOk(m.collectedAt) || !m.sourceUrl) { out.rejected.push({ reason: 'meta.collectedAt (ISO) and meta.sourceUrl are required' }); return out; }
    if (/apikey=/i.test(m.sourceUrl)) { out.rejected.push({ reason: 'sourceUrl must not contain the API key' }); return out; }
    const event = { id: raw.id, home_team: raw.home_team, away_team: raw.away_team, commence_time: raw.commence_time };
    for (const bk of raw.bookmakers) for (const mk of (bk.markets || [])) {
      const market = marketFromKey(mk.key);
      if (!market) { out.rejected.push({ reason: 'Unmapped market key', market_key: mk.key, book: bk.key }); continue; }
      for (const o of (mk.outcomes || [])) {
        const q = { provider: PROVIDER_ODDS, book: bk.key, event, player: o.description, market, side: o.name, line: o.point, price: o.price,
          source_url: m.sourceUrl, collected_at: m.collectedAt, provider_updated_at: mk.last_update || null };
        const missing = QUOTE_REQUIRED.filter(f => q[f] == null || q[f] === '' || (f === 'event' && !event.id));
        if (missing.length) { out.rejected.push({ reason: 'Missing required fields: ' + missing.join(','), book: bk.key }); continue; }
        if (!['Over', 'Under'].includes(q.side)) { out.rejected.push({ reason: 'Unsupported side', side: q.side, book: bk.key }); continue; }
        if (typeof q.line !== 'number' || !(q.line >= 0)) { out.rejected.push({ reason: 'Invalid line', book: bk.key }); continue; }
        if (!isAmerican(q.price)) { out.rejected.push({ reason: 'Price not American odds (request oddsFormat=american)', price: q.price, book: bk.key }); continue; }
        if (!isoOk(q.provider_updated_at)) { out.rejected.push({ reason: 'Missing market last_update (needed to judge staleness)', book: bk.key }); continue; }
        out.quotes.push(q);
      }
    }
    return out;
  }

  /* Exact player/market/side/line match only (no fuzzy names, no nearest line).
     Staleness uses the provider's market-level last_update, not our fetch time.
     Status: OK (>=1 fresh exact quote) | STALE (exact quotes exist, all too old) | UNAVAILABLE (none). Never synthesizes. */
  function findQuotes(quotes, want, opts) {
    const o = opts || {}; const now = o.now ? Date.parse(o.now) : Date.now(); const maxAge = o.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    if (UNMAPPED_MARKETS.includes(want.market)) return { status: 'UNAVAILABLE', quotes: [], reason: `Market "${want.market}" has no verified provider key yet` };
    const hits = (quotes || []).filter(q => normName(q.player) === normName(want.player) && q.market === want.market && q.side === want.side && q.line === Number(want.line));
    if (!hits.length) return { status: 'UNAVAILABLE', quotes: [], reason: 'No verified quote available' };
    const fresh = hits.filter(q => now - Date.parse(q.provider_updated_at) <= maxAge);
    if (!fresh.length) return { status: 'STALE', quotes: hits, reason: `All matching quotes older than ${Math.round(maxAge / 60000)} minutes` };
    return { status: 'OK', quotes: fresh, reason: '' };
  }

  /* rows: BALLDONTLIE GET /v1/stats `data` array for one player (any order). Requires ALL-STAR tier or higher (paid).
     The provider does NOT classify DNP/inactive and says zero or missing minutes do not establish non-participation, so
     rows with no positive minutes are EXCLUDED and counted as unverified participation, never silently scored as 0.
     Returns { games (newest first, length<=n), selected_count, excluded, dnp_treatment, push_treatment, source, window }. */
  function normalizeGameLog(rows, market, n, meta) {
    const m = meta || {}; const fields = STAT_FIELDS[market];
    const res = { provider: PROVIDER_STATS, market, requested_n: n, games: [], selected_count: 0, excluded: [],
      dnp_treatment: 'Rows with minutes missing/0 are excluded as UNVERIFIED participation (provider gives no DNP status).',
      push_treatment: 'Outcomes equal to the line are pushes and excluded from hit-rate denominators (app performance() behavior).',
      source_url: m.sourceUrl || null, collected_at: m.collectedAt || null };
    if (!fields) { res.status = 'UNAVAILABLE'; res.reason = `Unsupported market "${market}"`; return res; }
    if (!m.sourceUrl || !isoOk(m.collectedAt)) { res.status = 'UNAVAILABLE'; res.reason = 'meta.sourceUrl and meta.collectedAt required'; return res; }
    if (!Array.isArray(rows)) { res.status = 'UNAVAILABLE'; res.reason = 'Malformed rows'; return res; }
    const parsed = [];
    for (const r of rows) {
      const g = r && r.game; const date = g && g.date;
      if (!g || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { res.excluded.push({ reason: 'Missing game date' }); continue; }
      if (g.status_state !== 'final') { res.excluded.push({ date, game_id: g.id, reason: 'Game not final' }); continue; }
      const mins = parseFloat(String(r.min ?? '').split(':')[0]) + (String(r.min ?? '').includes(':') ? parseFloat(String(r.min).split(':')[1]) / 60 : 0);
      if (!(mins > 0)) { res.excluded.push({ date, game_id: g.id, reason: 'Participation unverified (minutes missing or 0)' }); continue; }
      const vals = fields.map(f => r[f]);
      if (vals.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0)) { res.excluded.push({ date, game_id: g.id, reason: 'Stat field missing/invalid' }); continue; }
      parsed.push({ date, game_id: g.id, minutes: Math.round(mins * 10) / 10, value: vals.reduce((a, b) => a + b, 0) });
    }
    parsed.sort((a, b) => b.date.localeCompare(a.date) || b.game_id - a.game_id);
    res.games = parsed.slice(0, n); res.selected_count = res.games.length;
    res.status = res.selected_count ? (res.selected_count < n ? 'PARTIAL' : 'OK') : 'UNAVAILABLE';
    if (res.status === 'UNAVAILABLE') res.reason = 'No verified games in sample';
    res.window = res.games.length ? { newest: res.games[0].date, oldest: res.games[res.games.length - 1].date } : null;
    return res;
  }

  const api = { PROVIDER_ODDS, PROVIDER_STATS, MARKET_KEYS, UNMAPPED_MARKETS, DEFAULT_MAX_AGE_MS, QUOTE_REQUIRED, normName, normalizeEventOdds, findQuotes, normalizeGameLog };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PropIntelAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
