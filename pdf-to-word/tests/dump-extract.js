const browserLib = require('./browser.js');
const serve = require('./server');
const fs = require('fs');
(async () => {
  const { server, port } = await serve();
  const browser = await browserLib.launch();
  const pg = await browser.newPage();
  pg.on('console', (m) => console.log('[page]', m.text()));
  pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await pg.goto(`http://127.0.0.1:${port}/tests/harness.html`);
  const name = process.argv[2] || 'tables', pageNo = +(process.argv[3] || 1);
  const b64 = fs.readFileSync(`fixtures/${name}.pdf`).toString('base64');
  const res = await pg.evaluate(async ({ b64, pageNo }) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const pdf = await Extract.open(bin);
    const p = await Extract.extractPage(pdf, pageNo, {});
    for (const im of p.images) if (im.crop) im.crop = { ext: im.crop.ext, wPx: im.crop.wPx, hPx: im.crop.hPx, bytes: im.crop.data.length };
    return p;
  }, { b64, pageNo });
  const brief = (a) => a.map((o) => JSON.stringify(o, (k, v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v)).join('\n');
  console.log('size', res.w, res.h, 'frags', res.frags.length, 'rot', res.rotated.length, 'rules', res.rules.length, 'fills', res.fills.length, 'marks', res.marks.length, 'images', res.images.length, 'links', res.links.length, res.warnings);
  console.log(brief(res.frags.slice(0, +(process.argv[4] || 12))));
  console.log('RULES'); console.log(brief(res.rules.slice(0, 12)));
  console.log('FILLS'); console.log(brief(res.fills.slice(0, 8)));
  console.log('IMAGES'); console.log(brief(res.images));
  console.log('LINKS'); console.log(brief(res.links));
  await browser.close(); server.close();
})();
