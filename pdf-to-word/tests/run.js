// node tests/run.js <fixture|path.pdf> [--opts json]  -> tests/out/<name>.docx + .json outline
const browserLib = require('./browser.js');
const serve = require('./server');
const fs = require('fs'), path = require('path');
(async () => {
  const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const optIdx = process.argv.indexOf('--opts');
  const opts = optIdx > 0 ? JSON.parse(process.argv[optIdx + 1]) : {};
  const { server, port } = await serve();
  const browser = await browserLib.launch();
  for (const name of names) {
    const file = fs.existsSync(name) ? name : path.join(__dirname, 'fixtures', name + '.pdf');
    const base = path.basename(file, '.pdf');
    const pg = await browser.newPage();
    pg.on('console', (m) => console.log('[page]', m.text()));
    pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await pg.goto(`http://127.0.0.1:${port}/tests/harness.html`);
    const b64 = fs.readFileSync(file).toString('base64');
    const res = await pg.evaluate(async ({ b64, opts }) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const r = await P2W.convert(bin, opts);
      const buf = new Uint8Array(await r.blob.arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      const outline = [];
      const pdesc = (b, ind = '') => {
        const t = b.lines.map((l) => l.text).join(' ⏎ ');
        return `${ind}${b.heading ? 'H' + b.heading : b.list ? 'LI' + (b.level || 0) : 'P'} [${b.align}] pg${b.page} L${Math.round(b.ind.left)}/${Math.round(b.ind.first)} b${b.before} ${Math.round(b.fs * 10) / 10}pt${b.bold > 0.6 ? ' bold' : ''} “${t.slice(0, 150)}”`;
      };
      for (const b of r.doc.blocks) {
        if (b.type === 'p') outline.push(pdesc(b));
        else if (b.type === 'img') outline.push(`IMG pg${b.page} ${Math.round(b.x1 - b.x0)}x${Math.round(b.bot - b.top)}`);
        else if (b.type === 'table') {
          outline.push(`TABLE pg${b.page} ${b.R}x${b.C} ${b.ruled ? 'ruled' : 'loose'} cells=${b.cells.length}`);
          for (const c of b.cells) outline.push(`   [r${c.r0}-${c.r1} c${c.c0}-${c.c1}${c.fill ? ' ' + c.fill : ''}${c.valign !== 'top' ? ' ' + c.valign : ''}] ` + c.blocks.map((q) => q.type === 'p' ? `(${q.align}) ` + q.lines.map((l) => l.text).join(' ⏎ ') : 'IMG').join(' | '));
        }
      }
      return { b64: btoa(s), stats: r.stats, ledger: r.ledger, ms: Math.round(r.ms), outline, header: r.doc.header.map((h) => h.p.runs.map((x) => x.field ? '{' + x.field + '}' : x.text).join('')), footer: r.doc.footer.map((h) => h.p.runs.map((x) => x.field ? '{' + x.field + '}' : x.text).join('')), page: r.doc.page, bodyFs: r.doc.bodyFs };
    }, { b64, opts });
    fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'out', base + '.docx'), Buffer.from(res.b64, 'base64'));
    fs.writeFileSync(path.join(__dirname, 'out', base + '.outline.txt'), res.outline.join('\n'));
    console.log(`== ${base}: ${res.ms}ms`, JSON.stringify(res.stats), JSON.stringify(res.ledger));
    console.log('page', JSON.stringify(res.page, (k, v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v), 'bodyFs', res.bodyFs, 'header', res.header, 'footer', res.footer);
    if (!process.argv.includes('--quiet')) console.log(res.outline.join('\n'));
    await pg.close();
  }
  await browser.close(); server.close();
})();
