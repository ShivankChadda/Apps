// Password-protected PDF: wrong password, then the right one; scanned PDF note; bad file.
const browserLib = require('./browser.js');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
(async () => {
  const server = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(fs.readFileSync(path.join(root, 'index.html'))); }).listen(0, '127.0.0.1');
  await new Promise((r) => server.on('listening', r));
  const browser = await browserLib.launch();
  const pg = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await pg.goto(`http://127.0.0.1:${server.address().port}/`);
  await pg.setInputFiles('#file', path.join(__dirname, 'fixtures/locked.pdf'));
  await pg.waitForSelector('#pw.open');
  await pg.fill('#pwInput', 'wrong'); await pg.click('#pwForm button[type=submit]');
  await pg.waitForFunction(() => document.querySelector('#pwMsg').textContent.includes('did not work'));
  console.log('wrong password -> prompt again:', await pg.textContent('#pwMsg'));
  await pg.fill('#pwInput', 'secret'); await pg.click('#pwForm button[type=submit]');
  await pg.waitForSelector('#bench:not([hidden])', { timeout: 30000 });
  console.log('opened:', await pg.textContent('#caseMeta'));
  // scan
  await pg.setInputFiles('#file2', path.join(__dirname, 'fixtures/scan.pdf'));
  await pg.waitForFunction(() => document.querySelector('#caseName').textContent === 'scan.pdf', null, { timeout: 30000 });
  await pg.waitForTimeout(500);
  console.log('scan notes:', await pg.textContent('#notes'));
  console.log('scan verdict:', await pg.textContent('#verdict'));
  // not a pdf
  fs.writeFileSync('/tmp/not.pdf', 'hello this is not a pdf');
  await pg.setInputFiles('#file2', '/tmp/not.pdf');
  await pg.waitForTimeout(1500);
  console.log('toast:', await pg.textContent('#toast'));
  console.log('errors:', errs.length ? errs : 'none');
  await browser.close(); server.close();
})();
