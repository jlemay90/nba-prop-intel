/* NBA Prop Intel — read-only "Verify quote" helpers (v0.2-dev). Pure functions: no network, no keys, no storage.
   Parses a CLI snapshot ({meta, quotes, rejected, quota} written by scripts/fetch-event-odds.js) that the USER
   provides, and matches one research record through PropIntelAdapter.findQuotes (exact player/market/side/line only).
   Never reads a record's own odds/sportsbook and never synthesizes a quote. Loaded snapshots are held in memory only. */
(function (root) {
  'use strict';
  const A = (typeof module !== 'undefined' && module.exports) ? require('./odds-adapter.js') : root.PropIntelAdapter;
  const MAX_BYTES = 5000000;
  const KEY_RE = /api[_-]?key\s*=|[?&]key=/i; // a credential in a URL query string
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isoOk = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
  const isAmerican = n => Number.isInteger(n) && Math.abs(n) >= 100 && Math.abs(n) <= 100000;
  const fmtOdd = n => `${n > 0 ? '+' : ''}${n}`;
  const safeURL = s => { try { const u = new URL(String(s)); return u.protocol === 'https:' && !KEY_RE.test(u.search) ? u.href : ''; } catch { return ''; } };
  const when = s => isoOk(s) ? new Date(s).toLocaleString() : 'not recorded';

  function quoteProblem(q) {
    if (!q || typeof q !== 'object' || Array.isArray(q)) return 'not an object';
    const missing = A.QUOTE_REQUIRED.filter(f => q[f] == null || q[f] === '');
    if (missing.length) return 'missing ' + missing.join(',');
    if (q.provider !== A.PROVIDER_ODDS) return 'unknown provider';
    if (typeof q.event !== 'object' || !q.event.id) return 'missing event id';
    if (!['Over', 'Under'].includes(q.side)) return 'unsupported side';
    if (typeof q.line !== 'number' || !(q.line >= 0)) return 'invalid line';
    if (!isAmerican(q.price)) return 'price not American odds';
    if (!isoOk(q.collected_at) || !isoOk(q.provider_updated_at)) return 'missing/invalid timestamps';
    if (!safeURL(q.source_url)) return 'source_url missing or not a credential-free https URL';
    return '';
  }

  /* text: file contents. Returns { ok:true, snapshot:{name, meta, quotes, mock, rejectedCount} } or { ok:false, error }.
     Fails closed: any credential, malformed quote, or non-snapshot shape refuses the WHOLE file (no partial quotes). */
  function parseSnapshotText(text, name) {
    const fail = error => ({ ok: false, error });
    if (typeof text !== 'string' || !text.trim()) return fail('File is empty.');
    if (text.length > MAX_BYTES) return fail('Snapshot must be under 5 MB.');
    let obj; try { obj = JSON.parse(text); } catch { return fail('File is not valid JSON.'); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('Not a snapshot: expected an object with meta and quotes.');
    // Credential check first, on every source_url / sourceUrl anywhere in the file.
    const urls = []; (function walk(v, k) { if (Array.isArray(v)) v.forEach(x => walk(x)); else if (v && typeof v === 'object') Object.keys(v).forEach(key => walk(v[key], key)); else if ((k === 'source_url' || k === 'sourceUrl') && v != null) urls.push(String(v)); })(obj);
    if (urls.some(u => KEY_RE.test(u))) return fail('Refused: a source URL in this file contains an API key. Delete the file and re-run the CLI; no quotes were loaded.');
    if (Array.isArray(obj.bookmakers) && !('quotes' in obj)) return fail('This is a raw Odds API response, not a CLI snapshot. Run scripts/fetch-event-odds.js and load the .snapshot.json it writes.');
    if (obj.schema === 'j-nba-prop-intel') return fail('This is a research-board export, not an odds snapshot. Use Import on the board for that file.');
    if (!obj.meta || typeof obj.meta !== 'object' || !Array.isArray(obj.quotes)) return fail('Not a snapshot: expected {meta, quotes, ...} from scripts/fetch-event-odds.js.');
    if (obj.meta.provider !== A.PROVIDER_ODDS || !isoOk(obj.meta.collectedAt)) return fail('Not a snapshot: meta.provider must be "the-odds-api" and meta.collectedAt an ISO time.');
    const bad = obj.quotes.map((q, i) => [i, quoteProblem(q)]).filter(x => x[1]);
    if (bad.length) return fail(`Refused: ${bad.length} quote(s) are malformed (first: #${bad[0][0]} ${bad[0][1]}). No quotes were loaded.`);
    return { ok: true, snapshot: { name: String(name || 'snapshot'), meta: obj.meta, quotes: obj.quotes,
      mock: !!(obj._MOCK || obj.meta.mock), rejectedCount: Array.isArray(obj.rejected) ? obj.rejected.length : 0 } };
  }

  /* Verify one record against a loaded snapshot. Uses ONLY player/market/side/line from the record. */
  function verifyRecord(snapshot, record, opts) {
    if (!snapshot) return { status: 'NOT_LOADED', quotes: [], reason: 'No snapshot loaded' };
    const res = A.findQuotes(snapshot.quotes, { player: record.player, market: record.market, side: record.side, line: record.line }, opts);
    return { status: res.status, quotes: res.status === 'UNAVAILABLE' ? [] : res.quotes, reason: res.reason };
  }

  function localDate(iso) { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

  /* HTML for the panel body (everything below the heading + file control). state: {snapshot, error}. */
  function renderPanelBody(state, record, opts) {
    const o = opts || {}; const now = o.now ? Date.parse(o.now) : Date.now();
    const s = state || {};
    const out = [];
    if (s.error) out.push(`<p class="vq-error" role="alert">${esc(s.error)}</p>`);
    if (!s.snapshot) {
      out.push(`<p class="vq-empty"><span class="vq-status vq-none">NO SNAPSHOT LOADED</span> No search has run. Load a <code>.snapshot.json</code> written by <code>scripts/fetch-event-odds.js</code> (git-ignored under <code>data/snapshots/</code>) to check this exact player, market, side and line.</p>`);
      return out.join('');
    }
    const sn = s.snapshot, m = sn.meta;
    out.push(`<p class="vq-meta">${sn.mock ? '<span class="vq-status vq-mock">MOCK FIXTURE · NOT REAL ODDS</span> ' : ''}File: ${esc(sn.name)} · ${sn.quotes.length} quotes · collected ${esc(when(m.collectedAt))}${m.eventId ? ` · event ${esc(m.eventId)}` : ''}</p>`);
    const v = verifyRecord(sn, record, o);
    const want = `${esc(record.player)} · ${esc(record.side)} ${esc(record.line)} ${esc(record.market)}`;
    if (v.status === 'UNAVAILABLE') {
      out.push(`<p><span class="vq-status vq-unavailable" data-status="UNAVAILABLE">UNAVAILABLE</span> ${esc(v.reason)} for ${want}. Exact match only — no nearest line, no fuzzy name, no substitute price.</p>`);
      return out.join('');
    }
    out.push(v.status === 'OK'
      ? `<p><span class="vq-status vq-ok" data-status="OK">OK</span> ${v.quotes.length} fresh exact quote(s) for ${want} (provider update ≤ 30 min old). This verifies a price only; it is not a pick.</p>`
      : `<p><span class="vq-status vq-stale" data-status="STALE">STALE</span> ${esc(v.reason)}. Exact quotes shown for reference only; re-run the CLI before relying on any price.</p>`);
    const ev = v.quotes[0].event || {};
    if (ev.commence_time && isoOk(ev.commence_time) && localDate(ev.commence_time) !== record.gameDate) out.push(`<p class="vq-warn">Event starts ${esc(when(ev.commence_time))}, which is not the record's game date ${esc(record.gameDate)}. Confirm this is the same game.</p>`);
    out.push('<ul class="vq-quotes">' + v.quotes.map(q => {
      const age = Math.round((now - Date.parse(q.provider_updated_at)) / 60000); const url = safeURL(q.source_url); const e = q.event || {};
      return `<li class="vq-quote"><strong>${esc(q.book)}</strong> ${esc(fmtOdd(q.price))} · ${esc(q.side)} ${esc(q.line)} ${esc(q.market)}<br><small>Provider updated ${esc(when(q.provider_updated_at))} (${age} min ago) · collected ${esc(when(q.collected_at))} · ${esc(e.away_team)} at ${esc(e.home_team)}${e.commence_time ? `, starts ${esc(when(e.commence_time))}` : ''} · ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Request URL (no key) ↗</a>` : 'source not shown'}</small></li>`;
    }).join('') + '</ul>');
    return out.join('');
  }

  /* ---- Snapshot -> board records ("Add quotes to the board"). Pure; caller saves. ----
     Rule (documented in ARCHITECTURE): per event + player + market, take the MAIN line = the line quoted by the most
     book/side pairs (tie -> lower line). One record per side offered at that line. Price comes from the first book in
     BOOK_ORDER that has an exact quote (a fixed order, NOT the best price). Only pregame events (commence_time > now).
     freshOnly (default true): only quotes findQuotes calls OK (provider update <= 30 min). Never invents logs,
     injury, role or matchup notes. A MOCK snapshot produces demo:true records (labelled DEMO ONLY), never live-looking. */
  const BOOK_ORDER = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers', 'espnbet', 'fanatics', 'bovada', 'betonlineag'];
  const bookRank = b => { const i = BOOK_ORDER.indexOf(b); return i < 0 ? BOOK_ORDER.length : i; };
  const slug = s => A.normName(s).replace(/ /g, '-');
  const chicagoDate = iso => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  function recordId(q) { return `odds-${String(q.event.id).replace(/[^A-Za-z0-9-]/g, '').slice(0, 40)}-${slug(q.player)}-${slug(q.market)}-${q.side.toLowerCase()}-${q.line}`.slice(0, 100); }

  function snapshotToRecords(snapshot, opts) {
    const o = opts || {}; const nowIso = o.now || new Date().toISOString(); const now = Date.parse(nowIso);
    const freshOnly = o.freshOnly !== false;
    const res = { records: [], skipped: { started: 0, stale: 0 }, mock: !!(snapshot && snapshot.mock) };
    if (!snapshot || !Array.isArray(snapshot.quotes)) return res;
    const groups = new Map();
    for (const q of snapshot.quotes) {
      if (!(Date.parse(q.event.commence_time) > now)) { res.skipped.started++; continue; }
      const k = [q.event.id, A.normName(q.player), q.market].join('|');
      if (!groups.has(k)) groups.set(k, []); groups.get(k).push(q);
    }
    for (const qs of groups.values()) {
      const count = new Map(); for (const q of qs) count.set(q.line, (count.get(q.line) || 0) + 1);
      const main = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
      for (const side of ['Over', 'Under']) {
        const atLine = qs.filter(q => q.line === main && q.side === side); if (!atLine.length) continue;
        const f = A.findQuotes(atLine, { player: atLine[0].player, market: atLine[0].market, side, line: main }, { now: nowIso });
        if (f.status !== 'OK' && (freshOnly || f.status !== 'STALE')) { res.skipped.stale++; continue; }
        const q = [...f.quotes].sort((a, b) => bookRank(a.book) - bookRank(b.book) || a.book.localeCompare(b.book))[0];
        const ev = q.event; const others = new Set(atLine.map(x => x.book)).size;
        const reason = (res.mock ? 'MOCK FIXTURE — synthetic test data, not real odds. ' : '') +
          `Imported from a The Odds API snapshot (${q.book}, provider update ${q.provider_updated_at}; ${others} book(s) quote this line). ` +
          `Game: ${ev.away_team} at ${ev.home_team}, starts ${ev.commence_time}. This is a price, not a pick. ` +
          'Still needed before any decision: player team, injury/minutes, and a source-linked game log.';
        res.records.push({ id: (res.mock ? 'mock-' : '') + recordId(q), demo: res.mock, player: q.player, team: '', opponent: '', gameDate: chicagoDate(ev.commence_time),
          market: q.market, side: q.side, line: q.line, odds: q.price, sportsbook: q.book, oddsCaptured: q.provider_updated_at, oddsSource: q.source_url,
          recentGames: [], statSource: '', roleNotes: '', injuryStatus: 'unknown', injuryChecked: '', injurySource: '', matchupNotes: '',
          verdict: 'HOLD', reviewer: res.mock ? 'MOCK fixture import' : 'Odds API snapshot import', reason, reviews: [], createdAt: nowIso, updatedAt: nowIso });
      }
    }
    return res;
  }

  /* Adds new records and refreshes the price fields of records with the same id. Never removes or alters any other record. */
  function mergeImported(existing, incoming, nowIso) {
    const out = existing.slice(); const byId = new Map(out.map((r, i) => [r.id, i])); let added = 0, updated = 0; const fresh = [];
    for (const r of incoming) {
      const hit = byId.has(r.id) && byId.get(r.id) >= 0 ? out[byId.get(r.id)] : null;
      if (hit && !!hit.demo !== !!r.demo) continue; // synthetic data never refreshes a real record (or vice versa)
      if (hit) { const cur = hit; out[byId.get(r.id)] = { ...cur, odds: r.odds, sportsbook: r.sportsbook, oddsCaptured: r.oddsCaptured, oddsSource: r.oddsSource, updatedAt: nowIso || r.updatedAt }; updated++; }
      else if (byId.get(r.id) === -1) { const i = fresh.findIndex(x => x.id === r.id); if (!!fresh[i].demo === !!r.demo) fresh[i] = r; } // same prop twice in one batch: later file wins
      else { fresh.push(r); byId.set(r.id, -1); added++; }
    }
    return { records: fresh.concat(out), added, updated };
  }

  const api = { parseSnapshotText, verifyRecord, renderPanelBody, quoteProblem, snapshotToRecords, mergeImported, BOOK_ORDER, MAX_BYTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PropIntelVerify = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
