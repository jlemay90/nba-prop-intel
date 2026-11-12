#!/usr/bin/env node
/* Rebuilds the convenience single-file build nba-prop-intel.html from index.html + styles.css + odds-adapter.js +
   verify-quote.js + app.js so the two entry points cannot drift. Usage: node scripts/build-single-file.js [--check]
   --check exits 1 if nba-prop-intel.html is out of date (used by tests/build-sync.test.js). */
'use strict';
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
function build() {
  let html = read('index.html');
  const swap = (tag, body) => { if (!html.includes(tag)) throw Error('Missing in index.html: ' + tag); html = html.split(tag).join(body); };
  swap('<link rel="stylesheet" href="styles.css">', `<style>${read('styles.css')}\n</style>`);
  swap('<script src="odds-adapter.js" defer></script>', `<script>\n${read('odds-adapter.js').trimEnd()}\n</script>`);
  swap('<script src="verify-quote.js" defer></script>', `<script>\n${read('verify-quote.js').trimEnd()}\n</script>`);
  swap('<script src="app.js" defer></script>', `<script>\n${read('app.js').trimEnd()}\n</script>`);
  return html;
}
if (require.main === module) {
  const out = build(); const target = path.join(ROOT, 'nba-prop-intel.html');
  if (process.argv.includes('--check')) { const same = fs.readFileSync(target, 'utf8') === out; console.log(same ? 'nba-prop-intel.html is in sync' : 'nba-prop-intel.html is OUT OF DATE: run node scripts/build-single-file.js'); process.exit(same ? 0 : 1); }
  fs.writeFileSync(target, out); console.log('Wrote nba-prop-intel.html');
}
module.exports = { build };
