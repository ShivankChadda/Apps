#!/usr/bin/env node
/*
 * Compile test: converts Markdown fixtures to LaTeX and builds them with every TeX engine that is
 * installed. Fails (exit code 1) on any TeX error. Warnings that point at lost content are reported.
 *
 *   node tests/compile.js                         all fixtures, all installed engines
 *   node tests/compile.js tests/fixtures/a.md     one fixture
 *   node tests/compile.js --engines=xelatex       choose engines
 *   node tests/compile.js --opts='{"font":"times","documentClass":"report"}'
 *   node tests/compile.js --keep                  keep the build folders and print their paths
 *   node tests/compile.js --png                   also rasterise page 1-3 of each PDF (needs pdftoppm)
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const MD2TeX = require('../src/md2tex.js');
const { makeResolver, writeAsset } = require('../tools/asset-writer.js');

const args = process.argv.slice(2);
const flag = name => args.find(a => a.startsWith('--' + name + '='));
const has = name => args.includes('--' + name);
const files = args.filter(a => !a.startsWith('--'));
const ALL_ENGINES = ['xelatex', 'lualatex', 'pdflatex'];
const wanted = flag('engines') ? flag('engines').split('=')[1].split(',') : ALL_ENGINES;
const extraOpts = flag('opts') ? JSON.parse(flag('opts').slice(7)) : {};

const which = cmd => { const r = spawnSync('sh', ['-c', 'command -v ' + cmd], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
const engines = wanted.filter(e => which(e));
if (!engines.length) { console.log('No TeX engine found (looked for ' + wanted.join(', ') + '); skipping compile tests.'); process.exit(has('require') ? 1 : 0); }

const fixtureDir = path.join(__dirname, 'fixtures');
const targets = files.length ? files : fs.readdirSync(fixtureDir).filter(f => f.endsWith('.md')).map(f => path.join(fixtureDir, f));

function build(mdPath, engine, opts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2tex-'));
  const srcDir = path.dirname(path.resolve(mdPath));
  const result = MD2TeX.convert(fs.readFileSync(mdPath, 'utf8'), Object.assign({
    engine, fileName: path.basename(mdPath),
    resolveAsset: makeResolver(srcDir)
  }, opts));
  fs.writeFileSync(path.join(dir, 'main.tex'), result.tex);
  for (const a of result.assets) {
    writeAsset(a, path.join(dir, a.texPath));
  }
  let log = '';
  let ok = true;
  for (let pass = 1; pass <= 2; pass++) {
    const r = spawnSync(engine, ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', '-no-shell-escape', 'main.tex'],
      { cwd: dir, encoding: 'utf8', env: Object.assign({}, process.env, { openin_any: 'p', openout_any: 'p', shell_escape: 'f' }), timeout: 180000 });
    log = (r.stdout || '') + (r.stderr || '');
    if (r.status !== 0) { ok = false; break; }
  }
  const pdf = path.join(dir, 'main.pdf');
  const pages = ok && fs.existsSync(pdf) ? (spawnSync('pdfinfo', [pdf], { encoding: 'utf8' }).stdout.match(/Pages:\s+(\d+)/) || [])[1] : null;
  return { dir, ok, log, pages, result };
}

let failed = 0;
const rows = [];
for (const md of targets) {
  for (const engine of engines) {
    const t0 = Date.now();
    const b = build(md, engine, extraOpts);
    const errors = b.log.split('\n').filter(l => /^!|^[^\s:]+:\d+:/.test(l)).slice(0, 4);
    const missing = (b.log.match(/Missing character: There is no [^\n]+/g) || []).length;
    const omitted = (b.log.match(/Unsupported character omitted/g) || []).length;
    const overfull = (b.log.match(/Overfull \\hbox \(([\d.]+)pt too wide/g) || []).filter(m => parseFloat(m.match(/\(([\d.]+)pt/)[1]) > 20).length;
    const headh = /headheight is too small/.test(b.log);
    const status = b.ok ? 'ok' : 'FAIL';
    if (!b.ok) failed++;
    rows.push([path.basename(md), engine, status, b.pages || '-', missing, omitted, overfull, headh ? 'headheight' : '', ((Date.now() - t0) / 1000).toFixed(1) + 's']);
    if (!b.ok) { console.log('\n--- ' + path.basename(md) + ' / ' + engine + ' FAILED ---\n' + errors.join('\n')); console.log('build dir: ' + b.dir); }
    else if (has('keep')) console.log('kept: ' + b.dir + '  (' + path.basename(md) + ' / ' + engine + ')');
    if (b.ok && has('png')) spawnSync('pdftoppm', ['-r', '70', '-png', '-f', '1', '-l', '3', path.join(b.dir, 'main.pdf'), path.join(b.dir, 'page')]);
    if (b.ok && !has('keep')) fs.rmSync(b.dir, { recursive: true, force: true });
  }
}
const head = ['fixture', 'engine', 'status', 'pages', 'missing-glyph', 'omitted', 'overfull>20pt', 'notes', 'time'];
const widths = head.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
const fmt = r => r.map((c, i) => String(c).padEnd(widths[i])).join('  ');
console.log('\n' + fmt(head) + '\n' + widths.map(w => '-'.repeat(w)).join('  '));
rows.forEach(r => console.log(fmt(r)));
console.log('\n' + (failed ? failed + ' build(s) FAILED' : 'all ' + rows.length + ' builds succeeded'));
process.exit(failed ? 1 : 0);
