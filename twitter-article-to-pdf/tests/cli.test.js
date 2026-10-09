'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'x2pdf.js');
const STUB = path.join(__dirname, 'stub-fetch.js');
const hasTeX = spawnSync('sh', ['-c', 'command -v xelatex || command -v lualatex || command -v pdflatex']).status === 0;
const hasConvert = spawnSync('sh', ['-c', 'command -v convert']).status === 0;
const run = args => spawnSync('node', ['--require', STUB, CLI, ...args], { encoding: 'utf8', timeout: 300000 });

test('--no-pdf writes the .tex, the .md and the pictures', { skip: hasConvert ? false : 'ImageMagick not installed' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'x2pdf-cli-'));
  const r = run(['https://x.com/ada/status/999', '-o', dir, '--no-pdf']);
  assert.equal(r.status, 0, r.stderr);
  const stem = 'Attention-Equations-a-100-test';
  assert.ok(fs.existsSync(path.join(dir, stem + '.tex')));
  assert.ok(fs.existsSync(path.join(dir, stem + '.md')));
  assert.deepEqual(fs.readdirSync(path.join(dir, 'images')).sort(), ['fig-001.jpg', 'fig-002.png', 'fig-003.png']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('builds a real PDF', { skip: hasTeX && hasConvert ? false : 'needs a TeX engine and ImageMagick' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'x2pdf-cli-'));
  const r = run(['https://x.com/ada/status/999', '-o', dir]);
  assert.equal(r.status, 0, r.stderr);
  const pdf = path.join(dir, 'Attention-Equations-a-100-test.pdf');
  assert.equal(fs.readFileSync(pdf).subarray(0, 5).toString(), '%PDF-');
  const text = spawnSync('pdftotext', [pdf, '-'], { encoding: 'utf8' }).stdout;
  if (text) { assert.match(text, /Why attention works/); assert.match(text, /arxiv\.org\/abs\/1706\.03762/); }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a normal post is explained, not crashed on', () => {
  const r = run(['https://x.com/ada/status/777', '--no-pdf', '-o', os.tmpdir() + '/x2pdf-never']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /normal post, not an X Article/);
});

test('bad arguments print usage', () => {
  assert.equal(run([]).status, 2);
  assert.equal(run(['--bogus']).status, 1);
});
