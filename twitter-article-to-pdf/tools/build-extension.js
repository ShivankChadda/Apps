#!/usr/bin/env node
/* Copies the shared converter files into extension/lib so the extension can be loaded unpacked as it is.
 *   node tools/build-extension.js          copy
 *   node tools/build-extension.js --check  exit 1 if extension/lib is out of date
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const md = path.resolve(root, '..', 'markdown-to-latex');
const FILES = [
  [path.join(md, 'vendor/marked.umd.js'), 'marked.umd.js'],
  [path.join(md, 'src/tables.js'), 'tables.js'],
  [path.join(md, 'src/preamble.js'), 'preamble.js'],
  [path.join(md, 'src/md2tex.js'), 'md2tex.js'],
  [path.join(md, 'src/zip.js'), 'zip.js'],
  [path.join(root, 'src/article2md.js'), 'article2md.js'],
  [path.join(root, 'src/pipeline.js'), 'pipeline.js']
];
const check = process.argv.includes('--check');
const out = path.join(root, 'extension/lib');
fs.mkdirSync(out, { recursive: true });
let stale = 0;
for (const [src, name] of FILES) {
  const data = fs.readFileSync(src);
  const dest = path.join(out, name);
  const same = fs.existsSync(dest) && fs.readFileSync(dest).equals(data);
  if (!same) { stale++; if (!check) fs.writeFileSync(dest, data); }
}
if (check) { if (stale) { console.error(stale + ' file(s) in extension/lib are out of date: run node tools/build-extension.js'); process.exit(1); } }
else console.log('extension/lib updated (' + stale + ' changed, ' + (FILES.length - stale) + ' unchanged)');
