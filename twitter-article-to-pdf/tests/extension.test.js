'use strict';
/*
 * End-to-end test of the Chrome extension in a real Chromium, with a real serve.py helper.
 * X and image servers are replaced by canned responses (see tests/fixtures/article.js).
 * Optional: needs Playwright + Chromium (skipped otherwise); the PDF step also needs a TeX engine.
 *
 *     NODE_PATH=$(npm root -g) node --test tests/extension.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { tweet, quoted } = require('./fixtures/article.js');

let playwright = null;
try { playwright = require('playwright'); } catch (e) { /* optional */ }
const skip = playwright ? false : 'Playwright is not installed';
const hasTeX = spawnSync('sh', ['-c', 'command -v xelatex || command -v pdflatex || command -v lualatex']).status === 0;

const EXT = path.join(__dirname, '..', 'extension');
const IMG = path.join(__dirname, '..', '..', 'markdown-to-latex', 'tests', 'fixtures', 'images');
const EXT_ID = 'iinfmgkelaedmeofmcmemognfhifaidn';
const IMAGES = { 'cover.jpg': ['wide.jpg', 'image/jpeg'], 'photo.png': ['photo.png', 'image/png'], 'anim.gif': ['animated.gif', 'image/gif'] };

let context = null; let helper = null; let userDir = null;

async function startHelper() {
  const serve = path.join(__dirname, '..', '..', 'markdown-to-latex', 'serve.py');
  const proc = spawn('python3', [serve, '--no-browser', '--port', '8765', '--allow-extension', EXT_ID], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('helper did not start')), 60000);
    proc.stdout.on('data', d => { if (/is running at/.test(String(d))) { clearTimeout(t); resolve(); } });
    proc.on('exit', c => reject(new Error('helper exited ' + c)));
  });
  return proc;
}

test.before(async () => {
  if (!playwright) return;
  userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'x2pdf-ext-'));
  context = await playwright.chromium.launchPersistentContext(userDir, {
    headless: false,
    args: ['--headless=new', '--no-sandbox', '--disable-extensions-except=' + EXT, '--load-extension=' + EXT]
  });
  await context.route('https://api.fxtwitter.com/**', route => {
    const url = route.request().url();
    const id = url.split('/').pop();
    const body = id === '999' ? { code: 200, message: 'OK', tweet } : (quoted[id] ? { code: 200, tweet: quoted[id] } : { code: 404, message: 'NOT_FOUND', tweet: null });
    route.fulfill({ status: body.code, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
  await context.route('https://pbs.twimg.com/**', route => {
    const name = route.request().url().split('/').pop();
    const hit = IMAGES[name];
    if (!hit) return route.fulfill({ status: 404, body: 'no' });
    route.fulfill({ status: 200, contentType: hit[1], headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(path.join(IMG, hit[0])) });
  });
  helper = await startHelper();
});

test.after(async () => {
  if (context) await context.close();
  if (helper) helper.kill();
  if (userDir) fs.rmSync(userDir, { recursive: true, force: true });
});

async function openPage(search) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('chrome-extension://' + EXT_ID + '/result.html' + (search || ''));
  return { page, errors };
}

test('the extension loads with the pinned id', { skip }, async () => {
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 20000 });
  assert.equal(new URL(sw.url()).host, EXT_ID);
});

test('Convert makes the PDF by itself: no LaTeX, no helper, nothing to click', { skip }, async () => {
  const { page, errors } = await openPage();       // note: no helper involved; this page never presses Create PDF
  const pdfDownload = page.waitForEvent('download', { timeout: 120000 });
  await page.fill('#url', 'https://x.com/ada/status/999');
  await page.click('#go');
  const download = await pdfDownload;
  assert.equal(download.suggestedFilename(), 'Attention-Equations-a-100-test.pdf');
  const pdfPath = path.join(userDir, 'direct.pdf');
  await download.saveAs(pdfPath);
  assert.equal(fs.readFileSync(pdfPath).subarray(0, 5).toString(), '%PDF-');
  const text = spawnSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' }).stdout;
  assert.match(text, /Attention & “Equations”: a 100% \[test\]/);
  assert.match(text, /Why attention works/);
  assert.match(text, /original paper/);
  assert.match(text, /a sandwich \$10/);                      // currency stayed text
  assert.match(text, /def attention\(q, k, v\):/);            // code
  assert.match(text, /References/);
  assert.match(text, /arxiv\.org\/abs\/1706\.03762/);
  const pages = Number((/Pages:\s+(\d+)/.exec(spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8' }).stdout) || [])[1]);
  assert.ok(pages >= 2 && pages <= 6, 'page count ' + pages);
  const images = spawnSync('pdfimages', ['-list', pdfPath], { encoding: 'utf8' }).stdout.split('\n').filter(l => /^\s*\d+\s+\d+\s+image/.test(l));
  assert.ok(images.length >= 3, 'pictures in the PDF: ' + images.length);   // cover, photo, gif poster
  const fonts = spawnSync('pdffonts', [pdfPath], { encoding: 'utf8' }).stdout;
  assert.match(fonts, /KaTeX/, 'formulas are set in the math fonts');
  assert.deepEqual(errors, []);
  await page.close();
});

test('converts an article and offers the project zip with pictures', { skip }, async () => {
  const { page, errors } = await openPage('?u=' + encodeURIComponent('https://x.com/ada/status/999'));
  await page.waitForSelector('#result:not([hidden])', { timeout: 120000 });
  await page.waitForFunction(() => !document.querySelector('#go').disabled, null, { timeout: 120000 });
  assert.match(await page.textContent('#title'), /Attention/);
  assert.match(await page.textContent('#meta'), /3 pictures/);
  await page.click('.latex summary');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dl-zip')]);
  const zipPath = path.join(userDir, 'out.zip');
  await download.saveAs(zipPath);
  const names = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean).sort();
  assert.deepEqual(names, ['article.md', 'images/fig-001.jpg', 'images/fig-002.png', 'images/fig-003.png', 'main.tex']);
  const tex = spawnSync('unzip', ['-p', zipPath, 'main.tex'], { encoding: 'utf8' }).stdout;
  assert.ok(tex.includes('E = mc^2') && tex.includes('\\href{https://arxiv.org/abs/1706.03762}'));
  const gif = spawnSync('unzip', ['-p', zipPath, 'images/fig-003.png'], { encoding: null }).stdout;
  assert.equal(gif.subarray(1, 4).toString(), 'PNG', 'the GIF was re-encoded as PNG in the browser');
  assert.deepEqual(errors, []);
  await page.close();
});

test('a link that is not an article gives a readable message', { skip }, async () => {
  const { page } = await openPage('?u=' + encodeURIComponent('https://x.com/ada/status/12345'));
  await page.waitForFunction(() => /not found/i.test(document.querySelector('#status').textContent), null, { timeout: 60000 });
  assert.equal(await page.isHidden('#result'), true);
  await page.close();
});

test('Create PDF works through the local helper', { skip: skip || (hasTeX ? false : 'No TeX engine installed') }, async () => {
  const { page } = await openPage('?u=' + encodeURIComponent('https://x.com/ada/status/999'));
  await page.waitForSelector('#result:not([hidden])', { timeout: 120000 });
  await page.waitForFunction(() => !document.querySelector('#go').disabled, null, { timeout: 120000 });
  await page.click('.latex summary');
  await page.click('#mk-pdf');
  await page.waitForFunction(() => /LaTeX PDF ready/.test(document.querySelector('#status').textContent), null, { timeout: 240000 });
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dl-pdf')]);
  assert.match(download.suggestedFilename(), /-latex\.pdf$/);
  const pdfPath = path.join(userDir, 'out.pdf');
  await download.saveAs(pdfPath);
  const head = fs.readFileSync(pdfPath).subarray(0, 5).toString();
  assert.equal(head, '%PDF-');
  const text = spawnSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' }).stdout;
  assert.match(text, /Why attention works/);
  assert.match(text, /References/);
  await page.close();
});
