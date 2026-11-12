#!/usr/bin/env node
/* Turns one or more CLI snapshots into a board import file (schema j-nba-prop-intel v0.1) using the SAME rules as the
   app's "Add quotes to the board" button (verify-quote.js snapshotToRecords: pregame only, fresh only, main line,
   one card per player/side, fixed book order, no invented logs). No network, no key.
   Usage: node scripts/snapshot-to-board.js data/snapshots/<file>.snapshot.json [...] [--out data/board-import.json]
   The output must stay under data/ (git-ignored). Import it with the board's Import button (replaces the board after
   a confirmation), or skip this script and use "Add quotes to the board" in the app (adds without replacing). */
'use strict';
const fs = require('fs'); const path = require('path');
const V = require('../verify-quote.js');
const ROOT = path.resolve(__dirname, '..');
function run({ argv, now = () => new Date().toISOString(), readFile = f => fs.readFileSync(f, 'utf8'), writeFile = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); }, log = console.log, err = console.error }) {
  const files = []; let out = path.join(ROOT, 'data', 'board-import.json');
  for (let i = 0; i < argv.length; i++) { if (argv[i] === '--out') out = path.resolve(argv[++i] || ''); else files.push(argv[i]); }
  if (!files.length) { err('Usage: node scripts/snapshot-to-board.js <snapshot.json> [...] [--out data/board-import.json]'); return 2; }
  if (!path.resolve(out).startsWith(path.join(ROOT, 'data') + path.sep)) { err('Refused: --out must be inside data/ (git-ignored).'); return 2; }
  const t = now(); let records = []; let mock = false;
  for (const f of files) {
    const p = V.parseSnapshotText(readFile(f), path.basename(f));
    if (!p.ok) { err(`${path.basename(f)}: ${p.error}`); return 1; }
    const r = V.snapshotToRecords(p.snapshot, { now: t }); mock = mock || r.mock;
    log(`${path.basename(f)}: ${r.records.length} cards (skipped: ${r.skipped.started} quotes for started games, ${r.skipped.stale} stale sides)`);
    records = V.mergeImported(records, r.records, t).records;
  }
  if (!records.length) { err('No fresh pregame quotes: nothing written. Re-run scripts/fetch-event-odds.js, then try again.'); return 1; }
  writeFile(out, JSON.stringify({ schema: 'j-nba-prop-intel', version: '0.1', exportedAt: t, records }, null, 1) + '\n');
  log(`Wrote ${records.length} ${mock ? 'MOCK (DEMO ONLY) ' : ''}records to ${path.relative(ROOT, out)}`);
  return 0;
}
if (require.main === module) process.exitCode = run({ argv: process.argv.slice(2) });
module.exports = { run };
