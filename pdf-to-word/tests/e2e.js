// node tests/e2e.js [--csp] [--dark] [--mobile] [--file path.pdf] [--shots prefix]
// Drives the built page in Chromium: drop a PDF, wait for the recovery, take screenshots.
const browserLib = require('./browser.js');
const http = require('http'), fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const root = path.resolve(__dirname, '..');
const csp = "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://cdn.tailwindcss.com https://code.jquery.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob: 'self'; media-src data: blob:; connect-src 'self'; worker-src blob: 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const skeleton = (body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;

(async () => {
  const server = http.createServer((q, r) => {
    if (q.url.startsWith('/artifact')) {
      const body = fs.readFileSync(path.join(root, 'dist', 'artifact.html'), 'utf8');
      r.writeHead(200, { 'content-type': 'text/html', ...(flag('--csp') ? { 'content-security-policy': csp } : {}) });
      return r.end(skeleton(body));
    }
    r.writeHead(404); r.end();
  }).listen(0, '127.0.0.1');
  await new Promise((r) => server.on('listening', r));
  const port = server.address().port;
  const browser = await browserLib.launch();
  const ctx = await browser.newContext({
    viewport: flag('--mobile') ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: flag('--mobile') ? 2 : 1,
    colorScheme: flag('--dark') ? 'dark' : 'light',
    acceptDownloads: true,
  });
  const pg = await ctx.newPage();
  const problems = [];
  pg.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || /Content Security|violat|Refused/i.test(t)) problems.push(m.type() + ': ' + t); });
  pg.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  pg.on('response', (r) => { if (r.status() >= 400) problems.push('http ' + r.status() + ' ' + r.url()); });
  await pg.goto(`http://127.0.0.1:${port}/artifact`);
  await pg.waitForTimeout(800);
  const prefix = val('--shots', 'tests/out/shot');
  fs.mkdirSync(path.dirname(prefix), { recursive: true });
  if (flag('--idle')) await pg.screenshot({ path: `${prefix}-idle.png`, fullPage: true });
  if (val('--file')) await pg.setInputFiles('#file', val('--file')); else await pg.click('#sampleBtn');
  await pg.waitForSelector('#bench:not([hidden])', { timeout: 60000 });
  await pg.waitForTimeout(600);
  const info = await pg.evaluate(() => ({ name: document.querySelector('#caseName').textContent, meta: document.querySelector('#caseMeta').textContent, verdict: document.querySelector('#verdict').textContent }));
  console.log(JSON.stringify(info, null, 1));
  await pg.evaluate(() => { document.querySelector('#bench').scrollIntoView(); });
  await pg.waitForTimeout(2800);
  await pg.screenshot({ path: `${prefix}-bench.png` });
  await pg.screenshot({ path: `${prefix}-full.png`, fullPage: true });
  // download
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 15000 }).catch(() => null), pg.click('#dlBtn')]);
  if (dl) { const p = path.join(root, 'tests/out', 'downloaded.docx'); await dl.saveAs(p); console.log('downloaded', dl.suggestedFilename(), fs.statSync(p).size, 'bytes'); } else console.log('no download event');
  console.log('PROBLEMS:', problems.length ? '\n' + problems.join('\n') : 'none');
  await browser.close(); server.close();
})();
