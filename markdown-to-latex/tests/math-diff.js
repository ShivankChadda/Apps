#!/usr/bin/env node
/*
 * Differential test of the math validator against real TeX.
 * For many valid and randomly corrupted formulas, compare "does the converter let it through?"
 * with "does pdfLaTeX accept it?".
 *
 * A formula the converter lets through but TeX rejects is a false accept. There are two kinds:
 *   - recoverable: TeX reports an error but carries on and still produces a PDF (an unknown or misspelled
 *     command such as \fra, a primitive used without its number such as \time). The converter cannot tell
 *     these from good input without a list of every command in every package, so it lets them through and
 *     the helper's recovery run reports them. They are counted and do not fail the test.
 *   - fatal: TeX gives up (runaway argument, unmatched braces, "Missing $" cascades, an unfinished
 *     \begin ...). The validator must prevent these; any of them fails the test.
 * Rejecting a formula TeX would take is only a loss of fidelity and is counted too.
 *
 *   node tests/math-diff.js [--count=400] [--seed=3]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const I = require('../src/md2tex.js')._internals;

const arg = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? +a.split('=')[1] : d; };
let seed = arg('seed', 3);
const rng = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const pick = l => l[Math.floor(rng() * l.length)];

const VALID = [
  'E = mc^2', 'a_1 + b_2', '\\frac{a}{b}', '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', '\\int_0^\\infty e^{-x^2}\\,dx', 'x_{i,j}^{2}', '\\sqrt{x^2 + y^2}',
  '\\alpha + \\beta \\leq \\gamma', '\\left( \\frac{a}{b} \\right)^2', '\\mathbb{R}^n', '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1', 'f(x) = x^2 + 2x + 1', 'O(n \\log n)',
  '\\binom{n}{k} = \\frac{n!}{k!(n-k)!}', '\\vec{v} \\cdot \\vec{w}', 'A \\subseteq B', 'x \\in \\{1, 2, 3\\}', '\\mathrm{d}x', '\\text{if } x > 0', 'a^{b^c}', 'a_{b_c}',
  '\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}', '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}', 'x\'', 'f\'(x)', '\\overline{AB}', '\\hat{x}_i', '\\prod_{k=1}^{m} k',
  '\\begin{cases} 1 & x > 0 \\\\ 0 & \\text{otherwise} \\end{cases}', '10^{-6}', 'a \\times b', '\\ell^2', '\\forall x \\exists y', 'p \\Rightarrow q', '|x|', '\\|x\\|', 'a_b^c', 'a^b_c', '{a_b}_c',
  'user_id', 'x_i_j', 'a^b^c', 'x^', '_a', 'a & b', '$', '{', '}', '\\left(', 'x_{', '\\frac{a}', '\\unknowncommand', 'a b c', ''
];
const CHARS = ['^', '_', '{', '}', '\\', '$', '&', '#', '(', ')', ' ', 'x', '1', ','];
function mutate(s) {
  const k = Math.floor(rng() * 4);
  const i = Math.floor(rng() * (s.length + 1));
  if (k === 0) return s.slice(0, i) + s.slice(i + 1);
  if (k === 1) return s.slice(0, i) + pick(CHARS) + s.slice(i);
  if (k === 2) return s.slice(0, i) + s.slice(i, i + 1).repeat(2) + s.slice(i + 1);
  return s.slice(0, i) + pick(CHARS) + s.slice(i + 1);
}

const count = arg('count', 400);
const snippets = [];
while (snippets.length < count) {
  let s = pick(VALID);
  const m = Math.floor(rng() * 3);
  for (let j = 0; j < m; j++) s = mutate(s);
  snippets.push(s);
}
snippets.push(...VALID);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathdiff-'));
function compile(extraArgs) {
  return spawnSync('pdflatex', ['-interaction=nonstopmode', '-no-shell-escape'].concat(extraArgs, ['t.tex']), { cwd: dir, timeout: 60000 });
}
/** { ok } when TeX takes the formula; otherwise { ok: false, error, fatal } where fatal means no PDF came out even without -halt-on-error. */
function texRun(body) {
  fs.writeFileSync(path.join(dir, 't.tex'), '\\documentclass{article}\\usepackage{amsmath,amssymb}\\begin{document}\n$' + body + '$\n\\end{document}\n');
  const strict = compile(['-halt-on-error', '-draftmode']);
  if (strict.status === 0) return { ok: true };
  const m = /^! (.*)$/m.exec((strict.stdout || '').toString());
  const error = m ? m[1] : 'unknown error';
  try { fs.unlinkSync(path.join(dir, 't.pdf')); } catch (e) { /* none yet */ }
  compile([]);
  const fatal = !fs.existsSync(path.join(dir, 't.pdf'));
  return { ok: false, error, fatal };
}

let fatal = 0, recoverable = 0, undefinedCommand = 0, falseReject = 0, bothOk = 0, bothReject = 0;
const seen = new Set();
for (const s of snippets) {
  if (seen.has(s)) continue; seen.add(s);
  const v = I.sanitizeMath(s, false);
  const ours = v.ok;
  const tex = texRun(ours ? v.tex.replace(/\n/g, ' ') : s.replace(/%/g, '\\%').replace(/#/g, '\\#'));
  if (ours && !tex.ok) {
    if (tex.fatal) { fatal++; console.log('FATAL FALSE ACCEPT (would break the build): ' + JSON.stringify(s) + '  -> ' + tex.error); }
    else if (/^Undefined control sequence/.test(tex.error)) undefinedCommand++;
    else recoverable++;
  }
  else if (!ours && tex.ok) { falseReject++; if (falseReject <= 12) console.log('  rejected but TeX takes it: ' + JSON.stringify(s)); }
  else if (ours) bothOk++; else bothReject++;
}
console.log('\n' + seen.size + ' formulas: ' + bothOk + ' accepted by both, ' + bothReject + ' rejected by both, ' + falseReject +
  ' rejected needlessly; let through but TeX complains: ' + undefinedCommand + ' unknown commands + ' + recoverable +
  ' other recoverable (expected); ' + fatal + ' FATAL');
process.exit(fatal ? 1 : 0);
