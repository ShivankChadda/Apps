#!/usr/bin/env node
/*
 * Stress test: documents that are legal Markdown but hostile to TeX, built with every installed engine.
 *   - control characters and terminal colour codes (TeX stops on "invalid character")
 *   - single lines of 100,000+ characters (TeX reads at most about 200,000 per line)
 *   - code blocks and quotes taller than a TeX box may be (16383pt)
 *   - a large mixed document
 *
 *   node tests/stress.js [--engines=xelatex,pdflatex] [--only=name]
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const MD2TeX = require('../src/md2tex.js');

const args = process.argv.slice(2);
const flag = name => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? a.split('=')[1] : null; };
const engines = (flag('engines') || 'xelatex,lualatex,pdflatex').split(',')
  .filter(e => spawnSync('sh', ['-c', 'command -v ' + e]).status === 0);
if (!engines.length) { console.log('No TeX engine found; skipping stress tests.'); process.exit(0); }

const numbered = (n, make) => Array.from({ length: n }, (_, i) => make(i)).join('\n');
const words = Array.from({ length: 30000 }, (_, i) => 'word' + (i % 97)).join(' ');                 // about 200,000 characters
const row = i => 'line ' + i + ': the quick brown fox jumps over the lazy dog ' + (i * 7919 % 1000);

const cases = {
  'control characters': [
    '# Control characters', '',
    'Inline ANSI: \u001b[32mgreen\u001b[0m text, NUL:\u0000: DEL:\u007f: BEL:\u0007: FF:\u000c: VT:\u000b: BS:\u0008: C1:\u0085\u009f: end.', '',
    '```', '$ ls \u001b[1;34mdir\u001b[0m   \u0000 \u007f \u0007 tab:\t:', '```', '',
    '- item with \u001b[31mred\u001b[0m', '',
    '| a | b\u001b[0m |', '|---|---|', '| \u0000 | \u007f |', '',
    'Inline `code \u001b[0m` and math $x\u0000^2$.', ''
  ].join('\n'),
  'one-line paragraph (200 KB)': '# T\n\n' + words + '\n',
  'one-line table cell (200 KB)': '# T\n\n| a | b |\n|---|---|\n| ' + words + ' | y |\n',
  'one-line list item (200 KB)': '- ' + words + '\n',
  'one-line quote (200 KB)': '> ' + words + '\n',
  'one-line code (60 KB, no spaces)': '# T\n\n```\n' + 'x'.repeat(60000) + '\n```\n',
  'one-line code (200 KB, words)': '# T\n\n```json\n' + words + '\n```\n',
  'code block of 3000 lines': '# T\n\n```\n' + numbered(3000, row) + '\n```\n',
  'quote of 1200 paragraphs': '# T\n\n' + numbered(1200, i => '> ' + row(i) + '\n>') + '\n',
  'table of 3000 rows': '# T\n\n| a | b |\n|---|---|\n' + numbered(3000, i => '| ' + row(i) + ' | x |') + '\n',
  'list of 5000 items': numbered(5000, i => '- ' + row(i)) + '\n',
  'large mixed document (about 500 KB)': (() => {
    const base = ['readme-style.md', 'chat-style.md', 'report.md'].map(f => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')).join('\n\n');
    return Array.from({ length: 20 }, (_, i) => base.replace(/^# /gm, '## ').replace(/^(#+) (.*)$/gm, '$1 $2 ' + i)).join('\n\n');
  })()
};

const only = flag('only');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2tex-stress-'));
let failed = 0;
console.log('case'.padEnd(40) + engines.map(e => e.padEnd(12)).join(''));
for (const [name, md] of Object.entries(cases)) {
  if (only && name.indexOf(only) < 0) continue;
  let line = name.padEnd(40);
  for (const engine of engines) {
    const r = MD2TeX.convert(md, { engine, fileName: 'stress.md' });
    fs.readdirSync(dir).filter(f => f.startsWith('main.')).forEach(f => fs.rmSync(path.join(dir, f)));
    fs.writeFileSync(path.join(dir, 'main.tex'), r.tex);
    const t0 = Date.now();
    let status = 'ok';
    for (let pass = 1; pass <= 2 && status === 'ok'; pass++) {
      const p = spawnSync(engine, ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', '-no-shell-escape', 'main.tex'],
        { cwd: dir, encoding: 'utf8', timeout: 600000, env: Object.assign({}, process.env, { openin_any: 'p', openout_any: 'p' }), maxBuffer: 1 << 28 });
      if (p.status !== 0) {
        failed++;
        const err = (p.stdout.split('\n').find(l => /^[^\s:]+:\d+:|^!/.test(l))) || 'unknown error';
        status = 'FAIL';
        console.log('  ' + name + ' / ' + engine + ': ' + err);
      }
    }
    line += (status + ' ' + ((Date.now() - t0) / 1000).toFixed(1) + 's').padEnd(12);
  }
  console.log(line);
}
console.log(failed ? '\n' + failed + ' build(s) FAILED' : '\nall stress builds succeeded');
process.exit(failed ? 1 : 0);
