'use strict';
/* nba-prop-intel.html must be exactly what scripts/build-single-file.js produces from index.html + styles.css +
   odds-adapter.js + verify-quote.js + app.js, so the single-file build cannot drift from the multi-file app. */
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
const { build } = require('../scripts/build-single-file.js');
test('nba-prop-intel.html is in sync with the multi-file sources (adapter + verify helpers inlined before app)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'nba-prop-intel.html'), 'utf8');
  assert.equal(html, build(), 'run: node scripts/build-single-file.js');
  const ia = html.indexOf('root.PropIntelAdapter = api'), iv = html.indexOf('root.PropIntelVerify = api'), ip = html.indexOf("const KEY='j-nba-prop-intel-v0.1'");
  assert.ok(ia > 0 && iv > ia && ip > iv, 'adapter, then verify helpers, then app script');
  assert.doesNotMatch(html, /<script src=|<link rel="stylesheet"/);
});
