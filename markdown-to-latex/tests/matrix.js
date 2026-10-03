#!/usr/bin/env node
/*
 * Option-matrix compile test: builds one rich fixture with many option combinations on every
 * installed engine, so no combination of settings can produce a broken .tex file.
 *   node tests/matrix.js [--engines=xelatex,pdflatex] [--fixture=tests/fixtures/chat-style.md] [--keep]
 */
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

const fixture = (process.argv.find(a => a.startsWith('--fixture=')) || '').slice(10) || path.join(__dirname, 'fixtures', 'smoke.md');
const passthrough = process.argv.slice(2).filter(a => a.startsWith('--engines=') || a === '--keep' || a === '--png');

const combos = [
  {},
  { documentClass: 'report' },
  { documentClass: 'book', titlePage: 'yes' },
  { font: 'times' },
  { font: 'palatino', fontSize: 12 },
  { paper: 'letter', margins: 'narrow', fontSize: 10 },
  { margins: 'wide', lineSpacing: 1.25, paragraphStyle: 'indented' },
  { theme: 'print', headerFooter: false },
  { toc: false, numbering: 'no' },
  { numbering: 'yes', tocDepth: 4, pageBreaks: 'sections' },
  { titlePage: 'yes', codeLineNumbers: true, hardBreaks: true },
  { titlePage: 'no', title: 'Overridden *title*', subtitle: 'A subtitle', author: 'Me; You', dateMode: 'custom', dateText: 'Spring 2027' },
  { dateMode: 'none', extraPreamble: '\\usepackage{lipsum}\n% custom line' },
  { documentClass: 'report', font: 'times', theme: 'print', lineSpacing: 1.66, tocDepth: 2 }
];

let failed = 0;
combos.forEach((opts, i) => {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'compile.js'), fixture, '--opts=' + JSON.stringify(opts), ...passthrough], { encoding: 'utf8' });
  const lines = r.stdout.split('\n').filter(l => /\s(ok|FAIL)\s/.test(l) && !/^status/.test(l));
  const status = r.status === 0 ? 'ok  ' : 'FAIL';
  if (r.status !== 0) { failed++; console.log(r.stdout.split('\n').filter(l => /FAILED|error|!|\.tex:/.test(l)).slice(0, 8).join('\n')); }
  console.log(status + ' ' + JSON.stringify(opts) + '  ->  ' + lines.map(l => l.trim().split(/\s+/).slice(1, 4).join(':')).join('  '));
});
console.log('\n' + (failed ? failed + ' combination(s) FAILED' : 'all ' + combos.length + ' combinations compiled on every engine'));
process.exit(failed ? 1 : 0);
