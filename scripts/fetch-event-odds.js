#!/usr/bin/env node
/* NBA Prop Intel — read-only The Odds API CLI.
   Dependency-free. Fetches event lists (0 credits) or per-event player-prop odds,
   normalizes through odds-adapter.js, and writes a provenance-stamped local snapshot.
   Key comes only from ODDS_API_KEY. It is never printed, logged, stored, or put in source_url.
   This is a research snapshot tool, not a live feed and not wired into the board UI. */
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeEventOdds } = require('../odds-adapter.js');

const EVENTS_PATH = '/v4/sports/basketball_nba/events';
const ORIGIN = 'https://api.the-odds-api.com';
const ALLOWED_MARKETS = new Set(['player_points', 'player_rebounds', 'player_assists']);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MAX_COST = 3;
const DEFAULT_REGIONS = 'us';

const USAGE = `Usage:
  ODDS_API_KEY must be set in the environment. It is never written to output or snapshots.

  node scripts/fetch-event-odds.js --list
      GET ${ORIGIN}${EVENTS_PATH}
      0 credits. Prints the current NBA event list.

  node scripts/fetch-event-odds.js --event <id> --markets <keys> [--regions us] [--max-cost 3]
      GET ${ORIGIN}${EVENTS_PATH}/<id>/odds?regions=...&markets=...&oddsFormat=american
      Cost = (number of markets) × (number of regions) credits.
      Refuses before any request if that cost exceeds --max-cost (default ${DEFAULT_MAX_COST}).
      Allowed markets: player_points, player_rebounds, player_assists (comma-separated).
      Writes data/snapshots/<eventId>-<collectedAt>.snapshot.json
      Snapshots are local-only (git-ignored) until provider terms are reviewed.

Exit codes: 0 success; 1 provider/HTTP error or no verified quote; 2 usage, missing key, or cost cap.
`;

function splitCsv(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const out = {
    help: false,
    list: false,
    event: null,
    markets: null,
    regions: DEFAULT_REGIONS,
    maxCost: DEFAULT_MAX_COST,
    unknown: [],
    missingValue: null,
  };
  const needVal = new Set(['--event', '--markets', '--regions', '--max-cost']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--list') out.list = true;
    else if (needVal.has(a)) {
      const v = argv[i + 1];
      if (v == null || String(v).startsWith('--')) {
        out.missingValue = a;
        continue;
      }
      i += 1;
      if (a === '--event') out.event = v;
      else if (a === '--markets') out.markets = v;
      else if (a === '--regions') out.regions = v;
      else if (a === '--max-cost') out.maxCost = Number(v);
    } else {
      out.unknown.push(a);
    }
  }
  return out;
}

function redact(text, key) {
  let s = String(text ?? '');
  if (key) s = s.split(key).join('[REDACTED]');
  // Never let the provider's query-parameter name leak into output either.
  s = s.replace(/apiKey=/gi, 'credential=');
  s = s.replace(/apiKey/gi, 'credential');
  return s;
}

function headerGet(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    return headers.get(name) ?? headers.get(name.toLowerCase()) ?? headers.get(name.toUpperCase());
  }
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === want) return v;
  }
  return null;
}

function publicEventsUrl() {
  return ORIGIN + EVENTS_PATH;
}

function publicOddsUrl(eventId, regions, markets) {
  const u = new URL(ORIGIN + EVENTS_PATH + '/' + encodeURIComponent(eventId) + '/odds');
  u.searchParams.set('regions', regions);
  u.searchParams.set('markets', markets);
  u.searchParams.set('oddsFormat', 'american');
  return u.toString();
}

function authorizedUrl(publicUrl, key) {
  const u = new URL(publicUrl);
  u.searchParams.set('apiKey', key);
  return u.toString();
}

function quotaFrom(headers) {
  const last = headerGet(headers, 'x-requests-last');
  const remaining = headerGet(headers, 'x-requests-remaining');
  return {
    'x-requests-last': last == null ? null : String(last),
    'x-requests-remaining': remaining == null ? null : String(remaining),
  };
}

function defaultWriteFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function print(stream, text, key) {
  stream(redact(text, key));
}

function providerMessage(status, bodyText) {
  const raw = String(bodyText ?? '').trim();
  let msg = raw;
  try {
    const j = JSON.parse(raw);
    msg = j.message || j.error_code || j.error || raw;
  } catch {
    /* use raw text */
  }
  return `Provider HTTP ${status}: ${msg}`;
}

async function run({ argv, env, fetchImpl, now, writeFile } = {}) {
  const args = parseArgs(argv || []);
  const envObj = env || {};
  const key = envObj.ODDS_API_KEY;
  const doFetch = fetchImpl || globalThis.fetch;
  const stamp = now || (() => new Date().toISOString());
  const write = writeFile || defaultWriteFile;
  const out = (s) => print((t) => console.log(t), s, key);
  const err = (s) => print((t) => console.error(t), s, key);

  if (args.help) {
    out(USAGE);
    return 0;
  }
  if (args.unknown.length) {
    err(`Unknown argument: ${args.unknown.join(', ')}`);
    err(USAGE);
    return 2;
  }
  if (args.missingValue) {
    err(`Missing value for ${args.missingValue}`);
    err(USAGE);
    return 2;
  }
  if (args.list && args.event) {
    err('Use either --list or --event, not both.');
    return 2;
  }
  if (!args.list && !args.event) {
    err(USAGE);
    return 2;
  }
  if (!key) {
    err('Missing ODDS_API_KEY environment variable. No request was made.');
    return 2;
  }
  if (typeof doFetch !== 'function') {
    err('No fetch implementation available.');
    return 2;
  }

  const collectedAt = stamp();

  if (args.list) {
    const sourceUrl = publicEventsUrl();
    let resp;
    try {
      resp = await doFetch(authorizedUrl(sourceUrl, key));
    } catch (e) {
      err(`Network error on event list: ${e && e.message ? e.message : e}`);
      return 1;
    }
    const bodyText = await resp.text();
    const quota = quotaFrom(resp.headers);
    if (resp.status === 401 || resp.status === 422 || resp.status === 429 || !resp.ok) {
      err(providerMessage(resp.status, bodyText));
      return 1;
    }
    out(bodyText);
    if (quota['x-requests-last'] != null || quota['x-requests-remaining'] != null) {
      out(`quota x-requests-last=${quota['x-requests-last']} x-requests-remaining=${quota['x-requests-remaining']}`);
    }
    return 0;
  }

  const marketList = splitCsv(args.markets);
  const regionList = splitCsv(args.regions);
  if (!args.event || !marketList.length || !regionList.length) {
    err('An event fetch requires --event <id> and --markets <keys> (and a non-empty --regions).');
    err(USAGE);
    return 2;
  }
  const badMarkets = marketList.filter((m) => !ALLOWED_MARKETS.has(m));
  if (badMarkets.length) {
    err(`Unsupported market(s): ${badMarkets.join(', ')}. Allowed: ${[...ALLOWED_MARKETS].join(', ')}.`);
    return 2;
  }
  if (!Number.isFinite(args.maxCost) || args.maxCost < 0) {
    err('--max-cost must be a non-negative number.');
    return 2;
  }
  const cost = marketList.length * regionList.length;
  if (cost > args.maxCost) {
    err(
      `Refusing request: cost ${cost} (markets ${marketList.length} × regions ${regionList.length}) exceeds --max-cost ${args.maxCost}. No request was made.`
    );
    return 2;
  }

  const markets = marketList.join(',');
  const regions = regionList.join(',');
  const sourceUrl = publicOddsUrl(args.event, regions, markets);
  let resp;
  try {
    resp = await doFetch(authorizedUrl(sourceUrl, key));
  } catch (e) {
    err(`Network error on event odds: ${e && e.message ? e.message : e}`);
    return 1;
  }
  const bodyText = await resp.text();
  const quota = quotaFrom(resp.headers);
  if (resp.status === 401 || resp.status === 422 || resp.status === 429 || !resp.ok) {
    err(providerMessage(resp.status, bodyText));
    return 1;
  }

  let raw;
  try {
    raw = JSON.parse(bodyText);
  } catch {
    err('Provider returned a non-JSON body.');
    return 1;
  }

  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.bookmakers) || raw.bookmakers.length === 0) {
    out('No verified quote available');
    return 1;
  }

  const normalized = normalizeEventOdds(raw, { collectedAt, sourceUrl });
  const snapshot = {
    meta: {
      provider: 'the-odds-api',
      eventId: args.event,
      collectedAt,
      sourceUrl,
      markets,
      regions,
      oddsFormat: 'american',
      estimatedCost: cost,
    },
    quotes: normalized.quotes,
    rejected: normalized.rejected,
    quota,
  };

  if (normalized.quotes.length === 0 && (!normalized.rejected || !normalized.rejected.length)) {
    out('No verified quote available');
    return 1;
  }

  const dest = path.join(ROOT, 'data', 'snapshots', `${args.event}-${collectedAt}.snapshot.json`);
  write(dest, JSON.stringify(snapshot, null, 2));
  out(`Wrote ${dest}`);
  out(`quotes=${normalized.quotes.length} rejected=${normalized.rejected.length} estimatedCost=${cost} x-requests-last=${quota['x-requests-last']} x-requests-remaining=${quota['x-requests-remaining']}`);
  return 0;
}

module.exports = { run, parseArgs, USAGE, publicEventsUrl, publicOddsUrl, ALLOWED_MARKETS };

if (require.main === module) {
  run({ argv: process.argv.slice(2), env: process.env })
    .then((code) => {
      process.exit(typeof code === 'number' ? code : 1);
    })
    .catch((e) => {
      const key = process.env.ODDS_API_KEY;
      console.error(redact(e && e.stack ? e.stack : String(e), key));
      process.exit(1);
    });
}
