'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { run } = require('../scripts/fetch-event-odds.js');

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'MOCK-event-odds.json');
const MOCK = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const KEY = 'TESTKEY123';
const NOW = '2026-11-11T22:00:00.000Z';
const EVENT_ID = 'mock-event-0001';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  const headerMap = {};
  for (const [k, v] of Object.entries(headers)) headerMap[k.toLowerCase()] = String(v);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return headerMap[String(name).toLowerCase()] ?? null;
      },
    },
    async text() {
      return text;
    },
    async json() {
      return JSON.parse(text);
    },
  };
}

async function capture(fn) {
  const out = { stdout: '', stderr: '' };
  const ol = console.log;
  const oe = console.error;
  const ow = console.warn;
  const join = (a) => a.map((x) => (typeof x === 'string' ? x : String(x))).join(' ');
  console.log = (...a) => {
    out.stdout += join(a) + '\n';
  };
  console.error = (...a) => {
    out.stderr += join(a) + '\n';
  };
  console.warn = (...a) => {
    out.stderr += join(a) + '\n';
  };
  try {
    out.code = await fn();
  } finally {
    console.log = ol;
    console.error = oe;
    console.warn = ow;
  }
  return out;
}

function makeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url: String(url), opts });
    return handler(String(url), opts, calls);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

function writtenStore() {
  const files = {};
  const writeFile = (p, content) => {
    files[p] = content;
  };
  return { files, writeFile };
}

function allOutput(cap, files) {
  return cap.stdout + cap.stderr + Object.values(files).join('\n');
}

function assertNoSecret(text) {
  assert.doesNotMatch(text, /TESTKEY123/);
  assert.doesNotMatch(text, /apiKey/i);
}

test('(1) no key → exit 2, zero fetch calls', async () => {
  const fetchImpl = makeFetch(() => {
    throw new Error('fetch should not be called');
  });
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({ argv: ['--list'], env: {}, fetchImpl, now: () => NOW, writeFile })
  );
  assert.equal(cap.code, 2);
  assert.equal(fetchImpl.calls.length, 0);
  assert.equal(Object.keys(files).length, 0);
  assert.match(cap.stderr, /Missing ODDS_API_KEY/);
  assert.doesNotMatch(allOutput(cap, files), /apiKey/i);
});

test('(1b) no key also refuses --event, zero fetch calls', async () => {
  const fetchImpl = makeFetch(() => {
    throw new Error('fetch should not be called');
  });
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points'],
      env: {},
      fetchImpl,
      now: () => NOW,
      writeFile: () => {},
    })
  );
  assert.equal(cap.code, 2);
  assert.equal(fetchImpl.calls.length, 0);
});

test('(2) --list hits only the /events URL', async () => {
  const events = [{ id: EVENT_ID, home_team: 'Mock Home', away_team: 'Mock Away' }];
  const fetchImpl = makeFetch(() =>
    jsonResponse(events, { headers: { 'x-requests-last': '0', 'x-requests-remaining': '500' } })
  );
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({ argv: ['--list'], env: { ODDS_API_KEY: KEY }, fetchImpl, now: () => NOW, writeFile })
  );
  assert.equal(cap.code, 0);
  assert.equal(fetchImpl.calls.length, 1);
  const url = fetchImpl.calls[0].url;
  assert.match(url, /https:\/\/api\.the-odds-api\.com\/v4\/sports\/basketball_nba\/events(\?|$)/);
  assert.doesNotMatch(url, /\/odds/);
  assert.doesNotMatch(cap.stdout + cap.stderr, /TESTKEY123/);
  assert.doesNotMatch(cap.stdout + cap.stderr, /apiKey/i);
  assert.match(cap.stdout, /mock-event-0001/);
  assert.equal(Object.keys(files).length, 0);
});

test('(3) event call URL contains oddsFormat=american and requested markets; cost read from header', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse(MOCK, {
      headers: { 'x-requests-last': '2', 'x-requests-remaining': '498' },
    })
  );
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points,player_rebounds', '--regions', 'us'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 0);
  assert.equal(fetchImpl.calls.length, 1);
  const url = fetchImpl.calls[0].url;
  assert.match(url, /oddsFormat=american/);
  assert.match(url, /markets=player_points%2Cplayer_rebounds|markets=player_points,player_rebounds/);
  assert.match(url, /\/events\/mock-event-0001\/odds/);
  assert.equal(Object.keys(files).length, 1);
  const dest = Object.keys(files)[0];
  assert.match(dest, /data\/snapshots\/mock-event-0001-2026-11-11T22:00:00\.000Z\.snapshot\.json$/);
  const snap = JSON.parse(files[dest]);
  assert.equal(snap.quota['x-requests-last'], '2');
  assert.equal(snap.quota['x-requests-remaining'], '498');
  assert.equal(snap.meta.oddsFormat, 'american');
  assert.equal(snap.meta.markets, 'player_points,player_rebounds');
  assert.equal(snap.meta.estimatedCost, 2);
  assert.ok(Array.isArray(snap.quotes));
  assert.ok(snap.quotes.length > 0);
  assert.match(cap.stdout, /x-requests-last=2/);
  assert.match(cap.stdout, /x-requests-remaining=498/);
  assertNoSecret(allOutput(cap, files));
  assert.doesNotMatch(JSON.stringify(snap), /TESTKEY123/);
  assert.doesNotMatch(snap.meta.sourceUrl, /apiKey/i);
  assert.doesNotMatch(snap.meta.sourceUrl, /TESTKEY123/);
});

test('(4) with key TESTKEY123, snapshot and all stdout/stderr contain neither the key nor apiKey', async () => {
  const fetchImpl = makeFetch((url) => {
    // The authorized request URL may carry the key; output and snapshot must not.
    assert.match(url, /TESTKEY123/);
    return jsonResponse(MOCK, { headers: { 'x-requests-last': '1', 'x-requests-remaining': '499' } });
  });
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 0);
  const combined = allOutput(cap, files);
  assertNoSecret(combined);
  const snap = JSON.parse(Object.values(files)[0]);
  assert.equal(snap.meta.sourceUrl.includes('TESTKEY123'), false);
  assert.equal(/apiKey/i.test(JSON.stringify(snap)), false);
  for (const q of snap.quotes) {
    assert.equal(q.source_url, snap.meta.sourceUrl);
    assert.equal(q.collected_at, NOW);
  }
});

async function httpErrorCase(status) {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ message: `provider said ${status}`, error_code: 'ERR' }, { status })
  );
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 1, `status ${status} should exit 1`);
  assert.equal(Object.keys(files).length, 0, `status ${status} must not write a snapshot`);
  assert.match(cap.stderr, new RegExp(`Provider HTTP ${status}`));
  assert.match(cap.stderr, new RegExp(`provider said ${status}`));
  assertNoSecret(allOutput(cap, files));
}

test('(5) HTTP 401 → exit 1, provider message shown, no snapshot', async () => {
  await httpErrorCase(401);
});

test('(5) HTTP 422 → exit 1, provider message shown, no snapshot', async () => {
  await httpErrorCase(422);
});

test('(5) HTTP 429 → exit 1, provider message shown, no snapshot', async () => {
  await httpErrorCase(429);
});

test('(5b) HTTP 401 body that echoes the key is redacted', async () => {
  const fetchImpl = makeFetch(() =>
    jsonResponse({ message: `Invalid credential TESTKEY123` }, { status: 401 })
  );
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 1);
  assert.equal(Object.keys(files).length, 0);
  assert.doesNotMatch(cap.stderr, /TESTKEY123/);
  assert.match(cap.stderr, /\[REDACTED\]/);
});

test('(6) --max-cost exceeded → exit 2 before any fetch', async () => {
  const fetchImpl = makeFetch(() => {
    throw new Error('fetch should not be called');
  });
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: [
        '--event',
        EVENT_ID,
        '--markets',
        'player_points,player_rebounds,player_assists',
        '--regions',
        'us,au',
        '--max-cost',
        '3',
      ],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  // 3 markets × 2 regions = 6 > 3
  assert.equal(cap.code, 2);
  assert.equal(fetchImpl.calls.length, 0);
  assert.equal(Object.keys(files).length, 0);
  assert.match(cap.stderr, /cost 6/);
  assert.match(cap.stderr, /No request was made/);
});

test('(6b) default --max-cost is 3: 3 markets × 2 regions refused with no flag', async () => {
  const fetchImpl = makeFetch(() => {
    throw new Error('fetch should not be called');
  });
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points,player_rebounds,player_assists', '--regions', 'us,au'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile: () => {},
    })
  );
  assert.equal(cap.code, 2);
  assert.equal(fetchImpl.calls.length, 0);
});

test('(6c) cost equal to --max-cost is allowed and does fetch', async () => {
  const fetchImpl = makeFetch(() => jsonResponse(MOCK));
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points,player_rebounds,player_assists', '--max-cost', '3'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 0);
  assert.equal(fetchImpl.calls.length, 1);
  assert.ok(Object.keys(files).length === 1);
});

test('(7) response with no bookmakers → prints "No verified quote available", writes no snapshot', async () => {
  const empty = { id: EVENT_ID, home_team: 'A', away_team: 'B', commence_time: NOW, bookmakers: [] };
  const fetchImpl = makeFetch(() => jsonResponse(empty));
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 1);
  assert.equal(Object.keys(files).length, 0);
  assert.match(cap.stdout, /No verified quote available/);
  assertNoSecret(allOutput(cap, files));
});

test('(7b) response missing bookmakers array also prints the no-quote message, no snapshot', async () => {
  const fetchImpl = makeFetch(() => jsonResponse({ id: EVENT_ID }));
  const { files, writeFile } = writtenStore();
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_points'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile,
    })
  );
  assert.equal(cap.code, 1);
  assert.equal(Object.keys(files).length, 0);
  assert.match(cap.stdout, /No verified quote available/);
});

test('unsupported market is refused before fetch (protects credits)', async () => {
  const fetchImpl = makeFetch(() => {
    throw new Error('fetch should not be called');
  });
  const cap = await capture(() =>
    run({
      argv: ['--event', EVENT_ID, '--markets', 'player_threes'],
      env: { ODDS_API_KEY: KEY },
      fetchImpl,
      now: () => NOW,
      writeFile: () => {},
    })
  );
  assert.equal(cap.code, 2);
  assert.equal(fetchImpl.calls.length, 0);
  assert.match(cap.stderr, /Unsupported market/);
});

test('fixture used by the CLI remains labelled MOCK / SYNTHETIC', () => {
  const raw = fs.readFileSync(FIXTURE, 'utf8');
  assert.match(raw, /_MOCK/);
  assert.match(raw, /SYNTHETIC/);
  assert.doesNotMatch(raw, /TESTKEY123/);
});
