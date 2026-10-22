// node tests/dump-layout.js <fixture> [page]  -> block / line geometry after layout
const browserLib = require('./browser.js');
const serve = require('./server');
const fs = require('fs'), path = require('path');
(async () => {
  const name = process.argv[2], pageNo = +(process.argv[3] || 1);
  const { server, port } = await serve();
  const browser = await browserLib.launch();
  const pg = await browser.newPage();
  pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await pg.goto(`http://127.0.0.1:${port}/tests/harness.html`);
  const file = fs.existsSync(name) ? name : path.join(__dirname, 'fixtures', name + '.pdf');
  const b64 = fs.readFileSync(file).toString('base64');
  const lines = await pg.evaluate(async ({ b64, pageNo }) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const pdf = await Extract.open(bin);
    const page = await Extract.extractPage(pdf, pageNo, {});
    const lp = Layout.layoutPage(page, {});
    const r = (v) => Math.round(v * 10) / 10;
    const out = [];
    out.push(`page ${page.w}x${page.h} frags=${page.frags.length} rules=${page.rules.length} fills=${page.fills.length} bullets=${page.bullets.length} images=${page.images.length}`);
    out.push('bands: ' + lp.bands.map((b) => `${b.kind}[${b.start}-${b.last}] gutters=${b.gutters.map((g) => r(g.x0) + '-' + r(g.x1)).join(',')} top=${r(b.top)} bot=${r(b.bot)}`).join(' | '));
    const L = (l, ind) => `${ind}x ${r(l.x0)}-${r(l.x1)} base ${r(l.base)} fs ${r(l.fs)}${l.bold > 0.6 ? ' B' : ''}${l.parts ? ' PARTS' + l.parts.length : ''}${l.bullet ? ' •' : ''} “${l.text.slice(0, 90)}”`;
    for (const b of lp.blocks) {
      if (b.kind === 'flow') { out.push(`FLOW${b.col ? ' col' + b.colIndex + '/' + b.columns + ' ' + r(b.col.x0) + '-' + r(b.col.x1) : ''} (${b.lines.length} lines)`); b.lines.forEach((l) => out.push(L(l, '   '))); }
      else if (b.kind === 'table') { const t = b.table; out.push(`TABLE ${t.ruled ? 'ruled' : 'loose'} xs=${t.xs.map(r)} ys=${t.ys.map(r)}`); t.cells.forEach((c) => { out.push(`   cell r${c.r0}-${c.r1} c${c.c0}-${c.c1} fill=${c.fill}`); c.lines.forEach((l) => out.push(L(l, '      '))); }); }
      else out.push(`IMAGE ${r(b.img.x0)},${r(b.img.y0)} ${r(b.img.x1)},${r(b.img.y1)}`);
    }
    return out;
  }, { b64, pageNo });
  console.log(lines.join('\n'));
  await browser.close(); server.close();
})();
