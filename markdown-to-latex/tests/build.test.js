'use strict';
// Checks the generated single-file page and the ZIP writer. Run with: node --test tests/build.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { build } = require('../tools/build.js');
const MD2Zip = require('../src/zip.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('index.html is up to date with src/ (run: node tools/build.js)', () => {
  assert.equal(html, build());
});

test('every inline script parses and cannot break out of its <script> element', () => {
  const scripts = [...html.matchAll(/<script>\n\/\/ ([^\n]+)\n([\s\S]*?)\n<\/script>/g)];
  assert.equal(scripts.length, 6);
  for (const [, name, code] of scripts) {
    assert.doesNotThrow(() => new vm.Script(code, { filename: name }), name);
    assert.doesNotMatch(code, /<\/script/i, name);
    assert.doesNotMatch(code, /<!--/, name);
  }
});

test('the example document is embedded unchanged (including $$ math fences)', () => {
  const m = /const SAMPLE_MD = ("(?:[^"\\]|\\.)*");/.exec(html);
  assert.ok(m, 'SAMPLE_MD not found');
  assert.equal(JSON.parse(m[1]), fs.readFileSync(path.join(root, 'examples', 'sample.md'), 'utf8'));
});

test('the page needs no network: no external scripts, styles, fonts or images', () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']?stylesheet/i);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:/i);
  assert.doesNotMatch(html, /@import|url\(\s*["']?https?:/i);
});

test('the token placeholder the helper replaces is present exactly once', () => {
  assert.equal(html.split('<meta name="md2latex-token" content="">').length, 2);
});

test('CRC-32 matches the standard check value', () => {
  assert.equal(MD2Zip.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('ZIP files open with a standard unzip tool and keep names and bytes', () => {
  const png = Uint8Array.from({ length: 70000 }, (_, i) => (i * 7 + 3) & 255);
  const bytes = MD2Zip.create([
    { name: 'notes.tex', data: '\\documentclass{article}\n% \u00e9\u00e8 \u4f60\u597d\n' },
    { name: 'images/photo.png', data: png },
    { name: 'empty.txt', data: new Uint8Array(0) }
  ], new Date(2026, 9, 3, 12, 30, 10));
  const file = path.join(os.tmpdir(), 'md2latex-zip-test-' + process.pid + '.zip');
  fs.writeFileSync(file, bytes);
  const py = spawnSync('python3', ['-c', `
import sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
names = z.namelist()
assert names == ['notes.tex', 'images/photo.png', 'empty.txt'], names
assert z.read('notes.tex').decode('utf-8').startswith('\\\\documentclass')
assert z.read('images/photo.png') == bytes((i * 7 + 3) & 255 for i in range(70000))
assert z.read('empty.txt') == b''
print('ok')
`, file], { encoding: 'utf8' });
  assert.equal(py.stdout.trim(), 'ok', py.stderr);
  const unzip = spawnSync('unzip', ['-t', file], { encoding: 'utf8' });
  if (unzip.status !== null && unzip.error === undefined) assert.match(unzip.stdout, /No errors detected/);
  fs.rmSync(file, { force: true });
});
