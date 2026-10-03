#!/usr/bin/env node
/*
 * Fuzz test: random Markdown assembled from hostile fragments.
 *   - the converter must never throw and must always emit balanced braces / environments
 *   - with --compile=N, N of the documents are also built with XeLaTeX and must not fail
 *
 *   node tests/fuzz.js [--docs=3000] [--compile=60] [--seed=1] [--engine=xelatex]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const MD2TeX = require('../src/md2tex.js');

const arg = (name, d) => { const a = process.argv.find(x => x.startsWith('--' + name + '=')); return a ? a.split('=')[1] : d; };
const DOCS = +arg('docs', 3000);
const COMPILE = +arg('compile', 0);
const ENGINE = arg('engine', 'xelatex');
let seed = +arg('seed', 1);
const rng = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const pick = list => list[Math.floor(rng() * list.length)];

const FRAGMENTS = [
  '# Title', '## Section', '### Sub *em*', '#### Deep `code`', '##### Five', 'Heading\n=====', 'Setext\n------', 'plain words here', 'word', '*em*', '**strong**', '***both***', '_u_', '__b__',
  '`code`', '``a`b``', '`', '~~del~~', '~', '[link](http://x.com/a_b?c=d&e=f#g%20h)', '[ref][1]', '[ref]', '[1]: http://example.com "T"', '![img](pic.png)', '![](a b.png)', '![x](https://e.com/i.png)',
  '<b>', '</b>', '<i>', '<br>', '<br/>', '<!-- c -->', '<!--', '-->', '<div align="center">', '</div>', '<p>', '<img src="a.png" width="50%">', '<details><summary>S</summary>', '</details>', '<a href="http://x.y">', '</a>',
  '<unknown attr="1">', '<', '>', '<<', '&amp;', '&lt;', '&#128512;', '&nope;', '&',
  '$x^2$', '$$', '$$x$$', '$', '\\(', '\\)', '\\[', '\\]', '$5', '$10', '50%', '%', '#', '_', '__', '^', '{', '}', '{{', '}}', '\\', '\\\\', '\\\\\\', '|', '||', '"', "'", "''", '...', '--', '---', '-->', '<--',
  '→', '⇒', '≤', '✓', '★', '©', 'é', 'ñ', 'ß', '😀', '👨‍👩‍👧', '中文', 'Привет', 'αβγδ', 'α', 'مرحبا', ' ', '​', '­', '️', '﻿',
  '- item', '* item', '+ item', '1. item', '2) item', '- [ ] task', '- [x] done', '  - nested', '    - deeper', '> quote', '> > nested', '> [!NOTE]', '>', '    indented code', '\tcode with tab',
  '```', '```py', '~~~', '````', '| a | b |', '|---|---|', '|:--|--:|', '| 1 | 2 |', '| x |', '|', '---', '***', '___', '- - -',
  '[^1]', '[^1]: note', '[^x]: other\n    more', '\\newline', '\\newpage', '\\begin{x}', '\\end{x}', '\\begin{align}', '\\end{align}', '\\input{a}', '\\verb|x|', '{\\bf x}', '\\textbf{', '\\%', '\\#', '\\$',
  '$$\n', '\n$$', '```\n', '\n```', '\n\n', '\n', '  \n', '\\\n', 'a'.repeat(60), 'x_y_z_'.repeat(8), 'https://example.com/' + 'p/'.repeat(30), 'www.example.org', '<https://auto.link/x_y>', 'user@example.com'
];

function randomDoc() {
  const n = 3 + Math.floor(rng() * 70);
  const lines = [];
  if (rng() < 0.15) lines.push('---\ntitle: ' + pick(['T', '"Q: x"', 'A & B', '#', '[x', '$y$']) + '\nauthor: ' + pick(['A', 'B; C', '[x, y]', '']) + '\n---');
  for (let i = 0; i < n; i++) {
    let line = '';
    const parts = 1 + Math.floor(rng() * 4);
    for (let k = 0; k < parts; k++) line += pick(FRAGMENTS) + pick([' ', '', ' ', '\n']);
    lines.push(line);
    if (rng() < 0.35) lines.push('');
  }
  return lines.join('\n');
}

function balanced(tex) {
  const src = tex.replace(/\\begin\{mdverb\}[\s\S]*?\n\\end\{mdverb\}/g, '').replace(/\\[\\{}%$&#_^~]/g, '').replace(/%.*$/gm, '');
  let depth = 0;
  for (const c of src) { if (c === '{') depth++; else if (c === '}') { depth--; if (depth < 0) return 'closing brace without opening'; } }
  if (depth !== 0) return 'unbalanced braces (' + depth + ')';
  const stack = [];
  for (const m of src.matchAll(/\\(begin|end)\{([^}]+)\}/g)) {
    if (m[1] === 'begin') stack.push(m[2]);
    else if (stack.pop() !== m[2]) return 'mismatched \\end{' + m[2] + '}';
  }
  return stack.length ? 'unclosed environment ' + stack[stack.length - 1] : null;
}

const classes = ['article', 'report', 'book'];
const resolve = key => (/^(pic|a)\.png$/.test(key) ? { id: key, name: key, ext: 'png' } : null);
let failures = 0;
const toCompile = [];
const t0 = Date.now();
for (let i = 0; i < DOCS; i++) {
  const md = randomDoc();
  const opts = { documentClass: classes[i % 3], engine: ENGINE, hardBreaks: i % 5 === 0, titlePage: i % 7 === 0 ? 'yes' : 'auto', resolveAsset: resolve, fileName: 'fuzz.md' };
  let r;
  try { r = MD2TeX.convert(md, opts); } catch (e) { failures++; console.log('THROW on doc ' + i + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); fs.writeFileSync(path.join(os.tmpdir(), 'fuzz-throw-' + i + '.md'), md); continue; }
  const bad = balanced(r.tex);
  if (bad) { failures++; console.log('UNBALANCED (' + bad + ') on doc ' + i); fs.writeFileSync(path.join(os.tmpdir(), 'fuzz-bad-' + i + '.md'), md); }
  if (toCompile.length < COMPILE && i % Math.max(1, Math.floor(DOCS / Math.max(COMPILE, 1))) === 0) toCompile.push({ i, md, opts });
}
console.log(DOCS + ' documents converted in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, ' + failures + ' problem(s)');

let compileFailures = 0;
if (COMPILE) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fuzz-compile-'));
  fs.writeFileSync(path.join(dir, 'pic.png'), fs.readFileSync(path.join(__dirname, 'fixtures', 'images', 'tiny.png')));
  fs.mkdirSync(path.join(dir, 'images'));
  for (const { i, md, opts } of toCompile) {
    const r = MD2TeX.convert(md, opts);
    r.assets.forEach(a => fs.copyFileSync(path.join(__dirname, 'fixtures', 'images', 'tiny.png'), path.join(dir, a.texPath)));
    fs.readdirSync(dir).filter(f => f.startsWith('main.')).forEach(f => fs.rmSync(path.join(dir, f))); // no stale .aux/.toc from the previous document
    fs.writeFileSync(path.join(dir, 'main.tex'), r.tex);
    const p = spawnSync(ENGINE, ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', '-no-shell-escape', 'main.tex'], { cwd: dir, encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { openin_any: 'p', openout_any: 'p' }) });
    if (p.status !== 0) {
      compileFailures++;
      const err = (p.stdout.split('\n').filter(l => /^[^\s:]+:\d+:|^!/.test(l))[0]) || 'unknown error';
      console.log('COMPILE FAIL doc ' + i + ': ' + err);
      const keep = path.join(os.tmpdir(), 'fuzz-fail-' + i + '.md');
      fs.writeFileSync(keep, md); fs.writeFileSync(path.join(os.tmpdir(), 'fuzz-fail-' + i + '.tex'), r.tex);
    }
  }
  console.log(toCompile.length + ' documents compiled with ' + ENGINE + ', ' + compileFailures + ' failure(s)');
}
process.exit(failures || compileFailures ? 1 : 0);
