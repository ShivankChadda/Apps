// node tests/probe.js <fixture> '<js expression using doc, pages>'
const browserLib = require('./browser.js');
const serve = require('./server');
const fs = require('fs'), path = require('path');
(async () => {
  const name = process.argv[2], expr = process.argv[3];
  const { server, port } = await serve();
  const browser = await browserLib.launch();
  const pg = await browser.newPage();
  pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
  pg.on('console', (m) => { if (m.type() !== 'error') console.log('[page]', m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/tests/harness.html`);
  const file = fs.existsSync(name) ? name : path.join(__dirname, 'fixtures', name + '.pdf');
  const b64 = fs.readFileSync(file).toString('base64');
  const out = await pg.evaluate(async ({ b64, expr }) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const r = await P2W.convert(bin, {});
    const doc = r.doc, pages = r.pages;
    return String(await eval(expr));
  }, { b64, expr });
  console.log(out);
  await browser.close(); server.close();
})();
