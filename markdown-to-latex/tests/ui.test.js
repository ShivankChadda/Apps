'use strict';
/*
 * End-to-end test of the web page in a real (headless) browser, talking to a real serve.py.
 * Optional: it needs Playwright and a Chromium build.
 *
 *     npm i -g playwright && npx playwright install chromium
 *     NODE_PATH=$(npm root -g) node --test tests/ui.test.js
 *
 * Without Playwright every test is skipped.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

let playwright = null;
try { playwright = require('playwright'); } catch (e) { /* optional dependency */ }
const skip = playwright ? false : 'Playwright is not installed';
const root = path.join(__dirname, '..');
const fileUrl = 'file://' + path.join(root, 'index.html');
const hasTeX = spawnSync('sh', ['-c', 'command -v xelatex || command -v pdflatex || command -v lualatex']).status === 0;

let browser = null;
let server = null;
let helperUrl = '';

test.before(async () => {
  if (!playwright) return;
  browser = await playwright.chromium.launch();
  server = spawn('python3', [path.join(root, 'serve.py'), '--no-browser', '--port', '8791'], { cwd: root });
  helperUrl = await new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error('serve.py did not start: ' + out)), 30000);
    server.stdout.on('data', d => { out += d; const m = /running at:\s+(http:\/\/\S+)/.exec(out); if (m) { clearTimeout(timer); resolve(m[1]); } });
    server.on('exit', () => reject(new Error('serve.py exited: ' + out)));
  });
});
test.after(async () => {
  if (browser) await browser.close();
  if (server) server.kill();
});

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1360, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', e => page.problems.push('pageerror: ' + e.message));
  // the helper answers 422 on purpose when a document does not compile; the browser logs that
  page.on('console', m => { if (m.type() === 'error' && !/status of 422/.test(m.text())) page.problems.push('console: ' + m.text()); });
  return page;
}
async function download(page, selector) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(selector)]);
  return fs.readFileSync(await dl.path());
}
const pyZip = (file, member) => spawnSync('python3', ['-c', `
import sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
if len(sys.argv) > 2:
    sys.stdout.buffer.write(z.read(sys.argv[2]))
else:
    print("\\n".join(z.namelist()))
`, file].concat(member ? [member] : []), { encoding: member ? 'buffer' : 'utf8' });

test('without the helper (file://) the page converts and offers downloads', { skip }, async () => {
  const page = await newPage();
  await page.goto(fileUrl);
  assert.match(await page.textContent('#helper-text'), /PDF export is off/);
  await page.click('#example-btn-2');
  await page.waitForSelector('#work:not([hidden])');
  await page.click('#tab-tex');
  const tex = await page.inputValue('#tex');
  assert.match(tex, /\\documentclass\[11pt,a4paper\]\{article\}/);
  assert.match(tex, /Study Notes on Binary Search/);
  assert.equal(await page.isHidden('#btn-pdf'), true);
  await page.click('#tab-pdf');
  assert.match(await page.textContent('#pdf-msg'), /PDF export is off/);

  const texFile = await download(page, '#btn-tex');
  assert.equal(texFile.toString('utf8'), tex);

  const zipPath = path.join(os.tmpdir(), 'md2latex-ui-' + process.pid + '.zip');
  fs.writeFileSync(zipPath, await download(page, '#btn-zip'));
  assert.match(pyZip(zipPath).stdout, /example\.tex/);
  assert.deepEqual(page.problems, []);
});

test('pasting Markdown works and the quick preview shows it', { skip }, async () => {
  const page = await newPage();
  await page.goto(fileUrl);
  await page.click('#paste-box summary');
  await page.fill('#paste-text', '# Pasted title\n\n## Part one\n\nHello **world** with $x^2$.\n\n> [!NOTE]\n> remember\n');
  await page.waitForFunction(() => window.__md2latex.state.result && /Pasted title/.test(window.__md2latex.state.result.tex));
  await page.click('#tab-preview');
  const frame = page.frameLocator('#preview-frame');
  await frame.locator('h1.doc-title').waitFor();
  assert.match(await frame.locator('body').innerText(), /Hello world/);
  assert.match(await frame.locator('blockquote').innerText(), /Note/);
  // the Print button asks the preview (and only the preview) to print
  const printed = await page.evaluate(() => {
    const preview = document.querySelector('#preview-frame').contentWindow;
    let calls = 0;
    preview.print = () => { calls++; };
    document.querySelector('#print-preview').click();
    return calls;
  });
  assert.equal(printed, 1);
  assert.deepEqual(page.problems, []);
});

test('files saved as UTF-8 (with or without BOM), UTF-16 or Windows-1252 are all read correctly', { skip }, async () => {
  const text = '# Café → naïve\n\nZürich — über “quotes”.\n';
  const be = Buffer.from('\uFEFF' + text, 'utf16le');
  for (let i = 0; i < be.length; i += 2) { const t = be[i]; be[i] = be[i + 1]; be[i + 1] = t; }      // to big endian
  const variants = {
    'utf8.md': Buffer.from(text, 'utf8'),
    'utf8-bom.md': Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]),
    'utf16le.md': Buffer.from('\uFEFF' + text, 'utf16le'),
    'utf16be.md': be,
    'latin1.md': Buffer.from('# Café naïve\n\nZürich über\n', 'latin1')
  };
  const page = await newPage();
  await page.goto(fileUrl);
  for (const [name, buffer] of Object.entries(variants)) {
    await page.evaluate(() => { window.__md2latex.state.hasDoc = false; });
    await page.setInputFiles('#file-input', { name, mimeType: 'text/markdown', buffer });
    await page.waitForFunction(n => window.__md2latex.state.fileName === n && window.__md2latex.state.result, name);
    const source = await page.evaluate(() => window.__md2latex.state.source);
    assert.match(source, /^# Café /, name);
    assert.match(source, /Zürich/, name);
    assert.doesNotMatch(source, /[\u0000\ufffd\uFEFFÿþ]/, name + ' has no stray bytes');
    const tex = await page.evaluate(() => window.__md2latex.state.result.tex);
    assert.match(tex, /Café/, name);
  }
  assert.deepEqual(page.problems, []);
});

test('settings change the generated LaTeX and are remembered', { skip }, async () => {
  const page = await newPage();
  await page.goto(fileUrl);
  await page.click('#example-btn-2');
  await page.waitForSelector('#work:not([hidden])');
  await page.selectOption('#o-font', 'times');
  await page.selectOption('#o-documentClass', 'report');
  await page.selectOption('#o-paper', 'letter');
  await page.uncheck('#o-toc');
  await page.waitForFunction(() => /report/.test(window.__md2latex.state.result.tex.split('\n').find(l => l.startsWith('\\documentclass'))));
  await page.click('#tab-tex');
  const tex = await page.inputValue('#tex');
  assert.match(tex, /\\documentclass\[11pt,letterpaper,openany\]\{report\}/);
  assert.match(tex, /TeX Gyre Termes/);
  assert.match(tex, /\\chapter\{/);
  assert.doesNotMatch(tex, /\\tableofcontents/);
  await page.reload();
  assert.equal(await page.inputValue('#o-font'), 'times');
  assert.equal(await page.inputValue('#o-documentClass'), 'report');
  assert.equal(await page.isChecked('#o-toc'), false);
});

test('a folder with pictures: matched by path, re-encoded when LaTeX cannot read them', { skip }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2latex-folder-'));
  fs.copyFileSync(path.join(__dirname, 'fixtures', 'torture.md'), path.join(dir, 'torture.md'));
  fs.cpSync(path.join(__dirname, 'fixtures', 'images'), path.join(dir, 'images'), { recursive: true });
  const page = await newPage();
  await page.goto(fileUrl);
  await page.setInputFiles('#folder-input', dir);
  await page.waitForFunction(() => window.__md2latex.state.result && window.__md2latex.state.result.assets.length >= 6);
  const info = await page.evaluate(() => window.__md2latex.state.result.assets.map(a => ({ path: a.texPath, convert: a.convert })));
  const byPath = Object.fromEntries(info.map(a => [a.path, a.convert]));
  assert.equal(byPath['images/photo.png'], true, '16-bit PNG must be re-encoded');
  assert.equal(byPath['images/wide.jpg'], false, 'plain JPEG is used as it is');
  assert.equal(byPath['images/animated.png'], true, 'GIF becomes PNG');
  assert.equal(byPath['images/vector.png'], true, 'SVG becomes PNG');
  const names = await page.$$eval('#image-list .nm', els => els.map(e => e.textContent));
  assert.ok(names.some(n => n.endsWith('images/photo.png')));

  const zipPath = path.join(os.tmpdir(), 'md2latex-ui-folder-' + process.pid + '.zip');
  fs.writeFileSync(zipPath, await download(page, '#btn-zip'));
  const png = pyZip(zipPath, 'images/photo.png').stdout;
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG');
  assert.equal(png[24], 8, 'bit depth of the re-encoded picture');
  const svgAsPng = pyZip(zipPath, 'images/vector.png').stdout;
  assert.equal(svgAsPng.subarray(1, 4).toString('latin1'), 'PNG');
  assert.deepEqual(page.problems, []);
});

test('very wide windows and phones: no horizontal scrolling', { skip }, async () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1100 }, { width: 1900, height: 1000 }]) {
    const page = await newPage(viewport);
    await page.goto(fileUrl);
    await page.click('#example-btn-2');
    await page.waitForSelector('#work:not([hidden])');
    for (const tab of ['tex', 'notes', 'preview', 'pdf']) {
      await page.click('#tab-' + tab);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 1, 'horizontal overflow of ' + overflow + 'px at ' + viewport.width + ' in tab ' + tab);
    }
    await page.context().close();
  }
});

test('dark mode can be switched and is remembered', { skip }, async () => {
  const page = await newPage();
  await page.goto(fileUrl);
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click('#theme-btn');
  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.notEqual(before, after);
  await page.reload();
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), after);
});

test('with the helper: PDF is built, downloaded, errors are explained, and it recovers', { skip: skip || (hasTeX ? false : 'no TeX engine installed') }, async () => {
  const page = await newPage();
  await page.goto(helperUrl);
  await page.waitForFunction(() => /PDF export on/.test(document.querySelector('#helper-text').textContent), null, { timeout: 20000 });
  await page.click('#example-btn-2');
  await page.waitForFunction(() => window.__md2latex.state.pdf.status === 'ready', null, { timeout: 90000 });

  const pdf = await download(page, '#btn-pdf-dl');
  assert.equal(pdf.subarray(0, 4).toString('latin1'), '%PDF');
  const pdfPath = path.join(os.tmpdir(), 'md2latex-ui-' + process.pid + '.pdf');
  fs.writeFileSync(pdfPath, pdf);
  const info = spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  if (info.status === 0) {
    assert.match(info.stdout, /Title:\s+Study Notes on Binary Search/);
    assert.match(info.stdout, /Author:\s+Ada Student/);
    assert.match(spawnSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' }).stdout, /Binary search finds an item/);
  }

  // a LaTeX error that LaTeX can step over: the PDF is still built, and the problem is explained
  await page.click('#tab-tex');
  await page.click('#edit-tex');
  const generated = await page.inputValue('#tex');
  await page.fill('#tex', generated.replace('\\begin{document}', '\\begin{document}\n\\thiscommanddoesnotexist'));
  await page.click('#tab-pdf');
  await page.waitForFunction(() => window.__md2latex.state.pdf.status === 'ready' && window.__md2latex.state.pdf.recovered, null, { timeout: 90000 });
  let message = await page.textContent('#pdf-msg');
  assert.match(message, /The PDF was built, but LaTeX reported/);
  assert.match(message, /Undefined control sequence/);
  assert.match(message, /LaTeX line \d+/);
  assert.ok(await page.isVisible('#pdf-frame'));
  assert.ok(await page.isVisible('#btn-pdf-dl'));

  // an error that stops LaTeX altogether: no PDF, and the cause is named
  await page.click('#tab-tex');
  await page.fill('#tex', generated.replace('\\begin{document}', '\\usepackage{nosuchpackagexyz}\n\\begin{document}'));
  await page.click('#tab-pdf');
  await page.waitForFunction(() => window.__md2latex.state.pdf.status === 'error', null, { timeout: 90000 });
  message = await page.textContent('#pdf-msg');
  assert.match(message, /could not be built/);
  assert.match(message, /nosuchpackagexyz/);

  // going back to the generated version builds again
  await page.click('#tab-tex');
  await page.click('#reset-tex');
  await page.waitForFunction(() => window.__md2latex.state.pdf.status === 'ready' && !window.__md2latex.state.pdf.recovered, null, { timeout: 90000 });
  assert.doesNotMatch(await page.textContent('#pdf-msg'), /reported/);
  assert.deepEqual(page.problems, []);
});

test('with the helper: a document with pictures and symbols builds with every engine', { skip: skip || (hasTeX ? false : 'no TeX engine installed') }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2latex-folder-'));
  fs.copyFileSync(path.join(__dirname, 'fixtures', 'torture.md'), path.join(dir, 'torture.md'));
  fs.cpSync(path.join(__dirname, 'fixtures', 'images'), path.join(dir, 'images'), { recursive: true });
  const page = await newPage();
  await page.goto(helperUrl);
  await page.waitForFunction(() => /PDF export on/.test(document.querySelector('#helper-text').textContent), null, { timeout: 20000 });
  await page.setInputFiles('#folder-input', dir);
  await page.click('summary:has-text("Advanced")');
  for (const engine of ['xelatex', 'lualatex', 'pdflatex']) {
    await page.selectOption('#o-engine', engine);
    await page.waitForFunction(e => window.__md2latex.state.pdf.status === 'ready' && window.__md2latex.state.pdf.engine === e, engine, { timeout: 120000 });
  }
  assert.deepEqual(page.problems, []);
});

test('the helper refuses requests from other web pages', { skip: skip || (hasTeX ? false : 'no TeX engine installed') }, async () => {
  const page = await newPage();
  await page.goto('http://example.invalid/', { waitUntil: 'commit' }).catch(() => {});
  const ctx = await browser.newContext();
  const evil = await ctx.newPage();
  await evil.route('http://evil.test/', route => route.fulfill({ contentType: 'text/html', body: '<html><body>evil</body></html>' }));
  await evil.goto('http://evil.test/');
  const result = await evil.evaluate(async url => {
    try {
      const r = await fetch(url + 'api/compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tex: 'x' }) });
      return 'status ' + r.status;
    } catch (e) { return 'blocked: ' + e.message; }
  }, helperUrl);
  assert.match(result, /blocked|status 403/);
});
