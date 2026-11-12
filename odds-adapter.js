/* NBA Prop Intel — read-only Odds API adapter (mock-first, key-gated).
 * Contract: AGENT-HANDOFF.md, "READ-ONLY DATA CONTRACT — The Odds API PoC".
 * The Odds API, Starter free tier ($0, 500 credits/mo, live player-prop odds).
 * No live call ever runs without a user-pasted key. Mock mode needs no key
 * and no network. Every failure mode is fail-closed: missing/stale/quota
 * data yields UNAVAILABLE or HOLD, never a fabricated line. The key lives
 * only in this device's localStorage and never appears in a row, a URL
 * stored on a record, or an export.
 */
(function (global) {
  'use strict';

  var PROVIDER = 'the-odds-api';
  var BASE = 'https://api.the-odds-api.com/v4/sports/basketball_nba';
  var KEY_STORAGE = 'j-nba-prop-intel-odds-key';
  var MOCK_FIXTURE_URL = 'fixtures/odds-api-mock.json';
  var STALE_MINUTES = 60;

  var NO_LINE = 'No line posted yet — check back closer to tip-off.';
  var STALE_LINE = 'Line may be stale/suspended — do not use.';
  var QUOTA_LINE = 'Odds quota exhausted — resets monthly. No line shown.';
  var NO_KEY_LINE = 'Paste your free Odds API key first — live mode never runs without one.';
  var SHAPE_LINE = 'Unexpected response shape — treated as no line.';

  function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
  function toISO(d) { return d instanceof Date && Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString(); }
  function parseDate(s) { var d = new Date(s); return Number.isFinite(d.getTime()) ? d : null; }

  /* Remove the apiKey query parameter from a URL before storing or showing it. */
  function stripKey(url) {
    return String(url || '')
      .replace(/([?&])apiKey=[^&]*(&|$)/, function (m, pre, post) { return post === '&' ? pre : ''; })
      .replace(/[?&]$/, '');
  }

  /* Does a /markets response mention player_points? true/false, or null when
   * the shape is unrecognized (caller then proceeds to the odds call, which
   * is the ground truth). Never throws. */
  function hasPlayerPoints(payload) {
    try {
      var s = JSON.stringify(payload);
      if (typeof s !== 'string') return null;
      if (s.indexOf('player_points') === -1) {
        // A parseable response with no mention of the market.
        if (isObject(payload) || Array.isArray(payload)) return false;
        return null;
      }
      return true;
    } catch (e) { return null; }
  }

  /* Normalize one odds-endpoint response into the contract row.
   * opts: { eventId, sourceUrl, collectedAt (ISO), now (Date), mock (bool) }
   * Returns { status: 'OK'|'HOLD'|'UNAVAILABLE', row (when OK/HOLD), reason }. */
  function normalizeEventOdds(payload, opts) {
    opts = opts || {};
    var now = opts.now instanceof Date ? opts.now : new Date();
    var collectedAt = opts.collectedAt || toISO(now);
    var sourceUrl = stripKey(opts.sourceUrl || '');
    var mock = !!opts.mock;

    function unavailable(reason) { return { status: 'UNAVAILABLE', reason: reason }; }

    if (!isObject(payload) || !Array.isArray(payload.bookmakers) || !payload.bookmakers.length) {
      return unavailable(NO_LINE);
    }
    var book = null, market = null;
    for (var i = 0; i < payload.bookmakers.length; i++) {
      var b = payload.bookmakers[i];
      if (!isObject(b) || !Array.isArray(b.markets)) continue;
      for (var j = 0; j < b.markets.length; j++) {
        var m = b.markets[j];
        if (isObject(m) && m.key === 'player_points' && Array.isArray(m.outcomes) && m.outcomes.length) {
          book = b; market = m; break;
        }
      }
      if (book) break;
    }
    if (!book || !market) return unavailable(NO_LINE);

    var outcome = market.outcomes[0];
    if (!isObject(outcome) || typeof outcome.name !== 'string' || !outcome.name.trim() ||
        typeof outcome.description !== 'string' || !outcome.description.trim() ||
        !isFiniteNumber(outcome.price) || !isFiniteNumber(outcome.point)) {
      return unavailable(SHAPE_LINE);
    }

    var home = typeof payload.home_team === 'string' ? payload.home_team : '';
    var away = typeof payload.away_team === 'string' ? payload.away_team : '';
    var commence = typeof payload.commence_time === 'string' ? payload.commence_time : '';
    var event = (away && home) ? (away + ' @ ' + home + ' — ' + commence)
      : (opts.eventId ? ('Event ' + opts.eventId) : 'Event unknown');

    var lastUpdate = parseDate(book.last_update);
    var row = {
      provider: PROVIDER,
      book: String(book.key || book.title || 'unknown'),
      event: event,
      player: outcome.name.trim(),
      market: 'player_points',
      side: outcome.description.trim(),
      line: outcome.point,
      price: outcome.price,
      source_url: sourceUrl,
      collected_at: collectedAt,
      last_update: lastUpdate ? lastUpdate.toISOString() : '',
      mock: mock
    };

    if (!lastUpdate) return { status: 'HOLD', row: row, reason: 'Line freshness unknown — do not use.' };
    if ((now.getTime() - lastUpdate.getTime()) / 60000 > STALE_MINUTES) {
      return { status: 'HOLD', row: row, reason: STALE_LINE };
    }
    return { status: 'OK', row: row, reason: '' };
  }

  /* True when a stored row is older than the freshness window. */
  function isStaleRow(row, now) {
    var d = parseDate(row && row.collected_at);
    if (!d) return true;
    var at = now instanceof Date ? now : new Date();
    return (at.getTime() - d.getTime()) / 60000 > STALE_MINUTES;
  }

  function quotaFromHeaders(headers) {
    try {
      if (headers && typeof headers.get === 'function') {
        var remaining = headers.get('x-requests-remaining');
        return remaining !== null && String(remaining).trim() === '0';
      }
    } catch (e) {}
    return false;
  }

  /* Live path. opts: { apiKey, eventId, fetchImpl, now }.
   * Returns the same {status,row,reason} shape; never throws for HTTP or
   * network failures — those are UNAVAILABLE. Refuses without a key. */
  async function fetchEventOdds(opts) {
    opts = opts || {};
    var now = opts.now instanceof Date ? opts.now : new Date();
    var apiKey = typeof opts.apiKey === 'string' ? opts.apiKey.trim() : '';
    var eventId = typeof opts.eventId === 'string' ? opts.eventId.trim() : '';
    var fetchImpl = opts.fetchImpl || (typeof globalThis.fetch === 'function' ? globalThis.fetch : null);

    if (!apiKey) return { status: 'NO_KEY', reason: NO_KEY_LINE };
    if (!eventId) return { status: 'UNAVAILABLE', reason: 'Pick an event first.' };
    if (!fetchImpl) return { status: 'UNAVAILABLE', reason: 'No network fetch available in this environment.' };

    var marketsUrl = BASE + '/events/' + encodeURIComponent(eventId) +
      '/markets?apiKey=' + encodeURIComponent(apiKey) + '&regions=us';
    var oddsUrl = BASE + '/events/' + encodeURIComponent(eventId) +
      '/odds?apiKey=' + encodeURIComponent(apiKey) +
      '&regions=us&markets=player_points&oddsFormat=american&dateFormat=iso';

    try {
      var marketsRes = await fetchImpl(marketsUrl);
      if (marketsRes.status === 401 || marketsRes.status === 429 || quotaFromHeaders(marketsRes.headers)) {
        return { status: 'UNAVAILABLE', reason: QUOTA_LINE };
      }
      if (!marketsRes.ok) return { status: 'UNAVAILABLE', reason: 'Odds service returned an error.' };
      var marketsPayload = await marketsRes.json();
      var has = hasPlayerPoints(marketsPayload);
      if (has === false) return { status: 'UNAVAILABLE', reason: NO_LINE };

      var oddsRes = await fetchImpl(oddsUrl);
      if (oddsRes.status === 401 || oddsRes.status === 429 || quotaFromHeaders(oddsRes.headers)) {
        return { status: 'UNAVAILABLE', reason: QUOTA_LINE };
      }
      if (!oddsRes.ok) return { status: 'UNAVAILABLE', reason: 'Odds service returned an error.' };
      var oddsPayload = await oddsRes.json();
      return normalizeEventOdds(oddsPayload, {
        eventId: eventId, sourceUrl: oddsUrl, collectedAt: toISO(now), now: now, mock: false
      });
    } catch (e) {
      return { status: 'UNAVAILABLE', reason: 'Could not reach the odds service (check network / CORS). If the browser blocks this call, live fetch needs a server-side step.' };
    }
  }

  /* Mock path. opts: { fetchImpl, now }. Loads the committed fixture and
   * normalizes the named scenario ('ok' | 'noMarket' | 'stale'). */
  async function fetchMock(scenario, opts) {
    opts = opts || {};
    var now = opts.now instanceof Date ? opts.now : new Date();
    var fetchImpl = opts.fetchImpl || (typeof globalThis.fetch === 'function' ? globalThis.fetch : null);
    if (!fetchImpl) return { status: 'UNAVAILABLE', reason: 'No network fetch available in this environment.' };
    try {
      var res = await fetchImpl(MOCK_FIXTURE_URL);
      if (!res.ok) return { status: 'UNAVAILABLE', reason: 'Mock fixture could not be loaded.' };
      var fixture = await res.json();
      var scenarios = (fixture && fixture.scenarios) || {};
      var payload = scenarios[scenario];
      if (!payload) return { status: 'UNAVAILABLE', reason: 'Unknown mock scenario.' };
      return normalizeEventOdds(payload, {
        eventId: payload.id || 'mock-event', sourceUrl: MOCK_FIXTURE_URL + '#' + scenario,
        collectedAt: toISO(now), now: now, mock: true
      });
    } catch (e) {
      return { status: 'UNAVAILABLE', reason: 'Mock fixture could not be loaded.' };
    }
  }

  /* Key storage — localStorage only, this device only. */
  function storage() {
    try { return global.localStorage || null; } catch (e) { return null; }
  }
  function getStoredKey() {
    var s = storage();
    try { return s ? (s.getItem(KEY_STORAGE) || '') : ''; } catch (e) { return ''; }
  }
  function setStoredKey(key) {
    var s = storage();
    try { if (s) s.setItem(KEY_STORAGE, String(key || '')); return true; } catch (e) { return false; }
  }
  function clearStoredKey() {
    var s = storage();
    try { if (s) s.removeItem(KEY_STORAGE); return true; } catch (e) { return false; }
  }

  /* ---- Browser UI: binds the #oddsPanel section when present. ---- */
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderResult(doc, result) {
    var box = doc.getElementById('oddsResult');
    if (!box) return;
    var status = result.status;
    if (status === 'NO_KEY' || status === 'UNAVAILABLE') {
      box.innerHTML = '<p class="odds-status ' + escapeHTML(status.toLowerCase()) + '">' +
        escapeHTML(status) + ' — ' + escapeHTML(result.reason || '') + '</p>';
      return;
    }
    var row = result.row;
    var stale = isStaleRow(row, new Date());
    var badge = row.mock ? '<span class="odds-badge mock">MOCK</span>' : '<span class="odds-badge live">LIVE</span>';
    var statusLine = status === 'HOLD'
      ? '<p class="odds-status hold">HOLD — ' + escapeHTML(result.reason || '') + '</p>'
      : '<p class="odds-status ok">OK — line is fresh (under ' + STALE_MINUTES + ' min old).</p>';
    if (stale && status === 'OK') {
      statusLine = '<p class="odds-status hold">HOLD — shown more than ' + STALE_MINUTES + ' min after collection; do not use.</p>';
    }
    var fields = [['Provider', row.provider], ['Book', row.book], ['Event', row.event],
      ['Player', row.player], ['Market', row.market], ['Side', row.side],
      ['Line', String(row.line)], ['Price', (row.price > 0 ? '+' : '') + String(row.price)],
      ['Source', row.source_url], ['Collected at', row.collected_at],
      ['Book last update', row.last_update || 'unknown']];
    box.innerHTML = badge + statusLine + '<dl class="odds-row">' +
      fields.map(function (f) {
        var v = f[0] === 'Source' && row.source_url
          ? '<a href="' + escapeHTML(row.source_url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(row.source_url) + ' ↗</a>'
          : escapeHTML(f[1]);
        return '<div><dt>' + escapeHTML(f[0]) + '</dt><dd>' + v + '</dd></div>';
      }).join('') + '</dl>';
  }

  function initOddsPanel(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) return false;
    var panel = doc.getElementById('oddsPanel');
    if (!panel) return false;
    var mode = doc.getElementById('oddsMode');
    var scenario = doc.getElementById('oddsScenario');
    var eventId = doc.getElementById('oddsEventId');
    var keyInput = doc.getElementById('oddsKey');
    var fetchBtn = doc.getElementById('oddsFetchBtn');
    var clearBtn = doc.getElementById('oddsClearKeyBtn');
    if (!mode || !scenario || !eventId || !keyInput || !fetchBtn) return false;

    var stored = getStoredKey();
    if (stored) keyInput.value = stored;

    function syncMode() {
      var isMock = mode.value === 'mock';
      scenario.disabled = !isMock;
      eventId.disabled = isMock;
      keyInput.disabled = isMock;
      if (clearBtn) clearBtn.disabled = isMock;
    }
    mode.addEventListener('change', syncMode);
    syncMode();

    fetchBtn.addEventListener('click', async function () {
      var result;
      if (mode.value === 'mock') {
        result = await fetchMock(scenario.value);
      } else {
        var typed = keyInput.value.trim();
        var key = typed || getStoredKey();
        if (typed) setStoredKey(typed);
        result = await fetchEventOdds({ apiKey: key, eventId: eventId.value });
      }
      renderResult(doc, result);
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearStoredKey();
        keyInput.value = '';
        var box = doc.getElementById('oddsResult');
        if (box) box.innerHTML = '<p class="odds-status">Key forgotten on this device.</p>';
      });
    }
    return true;
  }

  var api = {
    PROVIDER: PROVIDER,
    KEY_STORAGE: KEY_STORAGE,
    MOCK_FIXTURE_URL: MOCK_FIXTURE_URL,
    STALE_MINUTES: STALE_MINUTES,
    stripKey: stripKey,
    hasPlayerPoints: hasPlayerPoints,
    normalizeEventOdds: normalizeEventOdds,
    isStaleRow: isStaleRow,
    fetchEventOdds: fetchEventOdds,
    fetchMock: fetchMock,
    getStoredKey: getStoredKey,
    setStoredKey: setStoredKey,
    clearStoredKey: clearStoredKey,
    initOddsPanel: initOddsPanel
  };

  global.OddsAdapter = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

// Auto-bind when the panel exists (browser only, after DOM parse).
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.OddsAdapter.initOddsPanel(document); });
  } else {
    window.OddsAdapter.initOddsPanel(document);
  }
}
