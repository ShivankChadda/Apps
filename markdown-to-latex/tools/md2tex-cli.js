#!/usr/bin/env node
/* Command-line front end: node tools/md2tex-cli.js input.md [-o output.tex] [--key=value ...] */
'use strict';
const fs = require('fs');
const path = require('path');
const MD2TeX = require('../src/md2tex.js');
const { makeResolver, writeAsset } = require('./asset-writer.js');

function usage() {
  console.error('Usage: md2tex-cli.js input.md [-o output.tex] [--engine=xelatex|lualatex|pdflatex] [--class=article|report|book]\n' +
    '       [--font=latinmodern|times|palatino] [--paper=a4|letter] [--size=10|11|12] [--theme=color|print] [--no-toc] [--no-numbering]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (!args.length || args.includes('-h') || args.includes('--help')) usage();
let input = null; let output = null;
const opts = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-o') output = args[++i];
  else if (a === '--no-toc') opts.toc = false;
  else if (a === '--no-numbering') opts.numbering = 'no';
  else if (a === '--no-header') opts.headerFooter = false;
  else if (a === '--title-page') opts.titlePage = 'yes';
  else if (a.startsWith('--')) {
    const [k, v] = a.slice(2).split('=');
    const map = { class: 'documentClass', size: 'fontSize', spacing: 'lineSpacing', pagebreaks: 'pageBreaks' };
    opts[map[k] || k] = v;
  } else input = a;
}
if (!input) usage();

const dir = path.dirname(path.resolve(input));
opts.fileName = path.basename(input);
// Images next to the Markdown file are picked up automatically.
opts.resolveAsset = makeResolver(dir);
const result = MD2TeX.convert(fs.readFileSync(input, 'utf8'), opts);
const out = output || input.replace(/\.[^.]*$/, '') + '.tex';
fs.writeFileSync(out, result.tex);
for (const a of result.assets) {
  writeAsset(a, path.join(path.dirname(path.resolve(out)), a.texPath));
}
for (const w of result.warnings) console.error((w.level === 'info' ? 'note: ' : 'warning: ') + w.message);
console.error('wrote ' + out + ' (' + result.stats.words + ' words, ' + result.stats.headings + ' headings)');
