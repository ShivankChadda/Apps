/* app.js: the bench. Drop a PDF, watch it come back together, take the Word file. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SAMPLE_B64 = '__SAMPLE_B64__';
  const WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const state = {
    busy: false, job: 0, session: null, result: null, name: 'document.pdf', page: 1,
    s: 1, layers: { lines: true, blocks: true, tables: true, frags: false },
    hover: null, raf: 0, drawQueued: false, renderToken: 0, urls: [], rebuildTimer: 0, rebuildToken: 0, workerFallback: false,
    cssW: 0, k: 1, dpr: 1,
  };
  const colors = {};

  /* ---------- small helpers ---------- */

  const storeGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const storeSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  const fmtBytes = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  const fmtN = (n) => n.toLocaleString('en-US');
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (u) => u * u * (3 - 2 * u);
  const caseNo = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return 'P2W-' + String(h).padStart(4, '0'); };

  let toastTimer = 0;
  function toast(msg, ms = 3600) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function readColors() {
    const cs = getComputedStyle(root);
    for (const k of ['debris', 'line', 'block', 'head', 'list', 'table', 'image']) colors[k] = cs.getPropertyValue('--c-' + k).trim() || '#888';
    colors.orange = cs.getPropertyValue('--orange').trim() || '#ff5a1f';
    colors.ink = cs.getPropertyValue('--ink').trim() || '#111';
  }

  /* ---------- theme ---------- */

  function applyTheme(t) { if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme'); }
  applyTheme(storeGet('bb-theme'));
  $('#themeBtn').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next); storeSet('bb-theme', next);
    readColors(); requestDraw();
  });
  readColors();

  /* ---------- flight log ---------- */

  let logT0 = performance.now();
  function stamp() {
    const ms = Math.max(0, performance.now() - logT0);
    const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms % 1000);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(3, '0');
  }
  function log(who, msg, cls = '') {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    const t = document.createElement('span'); t.className = 't'; t.textContent = stamp();
    const w = document.createElement('span'); w.className = 'w' + (who === 'CVR' ? ' cvr' : ''); w.textContent = who;
    const m = document.createElement('span'); m.className = 'm'; m.textContent = msg;
    li.append(t, w, m);
    $('#logList').appendChild(li);
    const box = $('#logBox');
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- file in ---------- */

  const tray = $('#tray');
  function setStage(name, detail) {
    const order = ['read', 'build', 'write'];
    const at = order.indexOf(name);
    $$('#stages li').forEach((li, i) => { li.classList.toggle('done', i < at); li.classList.toggle('on', i === at); });
    if (detail !== undefined) $('#stRead').textContent = detail;
    const pct = name === 'done' ? 100 : [8, 62, 88][at] || 0;
    if (name === 'done') $$('#stages li').forEach((li) => { li.classList.add('done'); li.classList.remove('on'); });
    $('#barFill').style.width = pct + '%';
    $('.bar').setAttribute('aria-valuenow', String(pct));
  }

  function askPassword(reason) {
    return new Promise((resolve) => {
      const dlg = $('#pw'), input = $('#pwInput');
      $('#pwMsg').textContent = reason === 2 ? 'That password did not work. Try again.' : 'This PDF is password protected. Enter the password to open it. It stays in this tab.';
      input.value = '';
      dlg.classList.add('open');
      input.focus();
      const done = (v) => { dlg.classList.remove('open'); $('#pwForm').onsubmit = null; $('#pwCancel').onclick = null; resolve(v); };
      $('#pwForm').onsubmit = (e) => { e.preventDefault(); done(input.value); };
      $('#pwCancel').onclick = () => done(null);
    });
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }

  function setupWorker() {
    try {
      const blob = new Blob(['importScripts("' + WORKER_URL + '");'], { type: 'text/javascript' });
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    } catch (e) { pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL; }
  }

  async function openPdf(bytes, onProgress) {
    try {
      return await P2W.open(bytes.slice(), { askPassword }, onProgress);
    } catch (e) {
      if (!state.workerFallback && /worker/i.test(String(e && e.message))) {
        state.workerFallback = true;
        await loadScript(WORKER_URL);
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
        return P2W.open(bytes.slice(), { askPassword }, onProgress);
      }
      throw e;
    }
  }

  const optionsFromUI = () => ({
    fixedPages: $('#optFixed').checked, fixHyphens: $('#optHyphen').checked,
    tables: $('#optTables').checked, columns: $('#optColumns').checked, headers: $('#optHeaders').checked,
  });

  function resetBench() {
    cancelAnimationFrame(state.raf);
    for (const u of state.urls) URL.revokeObjectURL(u);
    state.urls = [];
    if (state.session && state.session.pdf && state.session.pdf.destroy) { try { state.session.pdf.destroy(); } catch (e) { /* already gone */ } }
    state.session = null; state.result = null; state.hover = null;
    $('#logList').textContent = '';
    $('#notes').textContent = '';
    $('#paper').textContent = '';
  }

  async function handleBytes(bytes, name, opts = {}) {
    if (opts.initial && state.busy) return;
    const job = ++state.job;
    state.busy = true;
    tray.classList.toggle('busy', !opts.initial);
    resetBench();
    state.name = name;
    state.sample = !!opts.sample;
    logT0 = performance.now();
    $('#trayFile').textContent = 'Receiving ' + name;
    setStage('read', '');
    log('FDR', 'Wreckage received: ' + name + ' (' + fmtBytes(bytes.length) + ').');
    await tick();
    let session = null;
    try {
      session = await openPdf(bytes, (stage, i, n) => {
        if (job !== state.job) return;
        if (stage === 'open') log('FDR', 'Opened. ' + n + (n === 1 ? ' page.' : ' pages.'));
        if (stage === 'read') { setStage('read', i + ' / ' + n); $('#barFill').style.width = (8 + 50 * i / n) + '%'; }
      });
      if (job !== state.job) { try { session.pdf.destroy(); } catch (e) { /* superseded */ } return; }
      const result = await P2W.build(session, optionsFromUI(), (st) => { if (job === state.job) setStage(st); });
      if (job !== state.job) { try { session.pdf.destroy(); } catch (e) { /* superseded */ } return; }
      state.session = session; state.result = result; state.page = 1;
      setStage('done');
      showResult(opts.initial ? 'initial' : 'user');
    } catch (e) {
      if (job === state.job) { if (opts.initial) { console.warn('Sample did not load', e); $('#bench').hidden = true; } else fail(e); }
    } finally {
      if (job === state.job) { state.busy = false; tray.classList.remove('busy'); }
    }
  }

  function fail(e) {
    const msg = String((e && e.message) || e);
    let human = 'Recovery failed: ' + msg;
    if (/Invalid PDF|InvalidPDF|not a PDF|Missing PDF/i.test(msg)) human = 'That file is not a readable PDF. Black Box only reads PDFs.';
    else if (/password/i.test(msg) || (e && e.name === 'PasswordException')) human = 'The PDF is password protected and no password was given.';
    else if (/destroy|cancel/i.test(msg)) human = 'Recovery cancelled.';
    toast(human, 6000);
    $('#bench').hidden = true;
    console.error(e);
  }

  /* ---------- results ---------- */

  function flavor(r) {
    const lines = [
      'No neural network was consulted. One wrote the code.',
      'Passengers lost: ' + r.ledger.lost + '. Please remain seated.',
      'Formatting survived the crash. Brace for editing.',
      'Black box located. Contents readable.',
    ];
    let h = 0;
    for (const c of state.name) h = (h * 7 + c.charCodeAt(0)) % 97;
    return lines[h % lines.length];
  }

  function showResult(mode) {
    const first = mode === 'user';
    const r = state.result, s = r.stats;
    $('#bench').hidden = false;
    $('#caseNo').textContent = '';
    const no = document.createElement('b'); no.textContent = caseNo(state.name);
    $('#caseNo').append(no);
    $('#benchTag').hidden = !state.sample;
    $('#caseName').textContent = state.name;
    $('#caseMeta').textContent = s.pages + (s.pages === 1 ? ' page' : ' pages') + ' · ' + fmtN(s.fragments) + ' fragments · recovered in ' + ((r.ms + (state.session.readMs || 0)) / 1000).toFixed(1) + ' s';
    writeLog(first);
    renderTiles(s);
    renderLedger(r.ledger);
    renderNotes();
    $('#pageNo').textContent = state.page + ' / ' + s.pages;
    $('#prevPg').disabled = $('#nextPg').disabled = s.pages < 2;
    renderPaper();
    renderPage().then(() => {
      if (first) play();
      else { setScrub(1); if (mode === 'initial') state.pendingPlay = true; }
    });
    if (first) setTimeout(() => $('#bench').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 60);
  }

  function writeLog(first) {
    const r = state.result, s = r.stats, doc = r.doc;
    const tables = doc.blocks.filter((b) => b.type === 'table');
    const ruled = tables.filter((t) => t.ruled).length;
    log('FDR', fmtN(s.fragments) + ' text fragments read, ' + s.pictures + (s.pictures === 1 ? ' picture' : ' pictures') + ', ' + s.links + (s.links === 1 ? ' link.' : ' links.'));
    if (doc.scannedPages.length) log('FDR', 'Pages ' + doc.scannedPages.join(', ') + ' hold no text. Set as pictures.', 'bad');
    if (s.columns > 1) log('FDR', 'Columns found, up to ' + s.columns + ' across. Reading order restored.', 'ok');
    log('FDR', s.paragraphs + ' paragraphs rebuilt from ' + fmtN(s.lines) + ' lines.');
    if (s.headings) log('FDR', s.headings + (s.headings === 1 ? ' heading' : ' headings') + ' found. Styles applied.');
    if (s.listItems) log('FDR', s.listItems + ' list items turned into real Word lists.');
    if (tables.length) log('FDR', tables.length + (tables.length === 1 ? ' table' : ' tables') + ' found (' + ruled + ' ruled, ' + (tables.length - ruled) + ' from alignment).', 'ok');
    if (s.headers) log('FDR', 'Repeated header and footer lifted out of the pages. Page numbers are fields.');
    if (s.rotated) log('FDR', s.rotated + ' pieces of sideways text set aside.', 'bad');
    const L = r.ledger;
    if (L.charsIn === 0) log('FDR', 'Nothing to count. This PDF holds no text.', 'bad');
    else if (L.lost === 0) log('FDR', 'Ledger balanced: ' + fmtN(L.charsIn) + ' letters and digits in, ' + fmtN(L.charsOut) + ' out.', 'ok');
    else log('FDR', L.lost + ' letters or digits could not be placed.', 'bad');
    log('CVR', first ? flavor(r) : 'Settings changed. Rebuilt in ' + Math.round(r.ms) + ' ms.');
  }

  function renderTiles(s) {
    const items = [['Pages', s.pages], ['Fragments', s.fragments], ['Lines', s.lines], ['Paragraphs', s.paragraphs], ['Headings', s.headings], ['List items', s.listItems], ['Tables', s.tables], ['Pictures', s.pictures], ['Links', s.links]];
    const box = $('#tiles');
    box.textContent = '';
    for (const [label, n] of items) {
      const d = document.createElement('div'); d.className = 'tile';
      const b = document.createElement('b'); b.textContent = fmtN(n);
      const sp = document.createElement('span'); sp.textContent = label;
      d.append(b, sp); box.appendChild(d);
    }
  }

  function renderLedger(L) {
    $('#ledIn').textContent = fmtN(L.charsIn);
    $('#ledOut').textContent = fmtN(L.charsOut);
    const segs = $('#segs');
    segs.textContent = '';
    const ratio = L.charsIn ? Math.min(1, L.charsOut / L.charsIn) : 0;
    for (let i = 0; i < 32; i++) {
      const el = document.createElement('i');
      if (L.charsIn === 0) { segs.appendChild(el); continue; }
      el.className = i < Math.round(ratio * 32) ? 'f' : (L.lost ? 'x' : 'f');
      segs.appendChild(el);
    }
    const v = $('#verdict');
    if (L.charsIn === 0) { v.className = 'verdict bad'; v.textContent = 'No text to count.'; }
    else if (!L.lost) { v.className = 'verdict good'; v.textContent = 'Ledger balanced. No passengers lost.' + (L.rotated ? ' ' + L.rotated + ' characters of sideways text were set aside.' : ''); }
    else { v.className = 'verdict bad'; v.textContent = L.lost + ' letters or digits could not be placed.'; }
  }

  function renderNotes() {
    const box = $('#notes');
    box.textContent = '';
    const doc = state.result.doc;
    const add = (tag, msg) => {
      const d = document.createElement('div'); d.className = 'note';
      const b = document.createElement('b'); b.textContent = tag;
      const p = document.createElement('span'); p.textContent = msg;
      d.append(b, p); box.appendChild(d);
    };
    const n = state.session.numPages;
    if (doc.scannedPages.length === n) add('Scan', 'All ' + n + (n === 1 ? ' page is a scan.' : ' pages are scans.') + ' Reading pictures of text needs OCR, which is the one thing this tool refuses to do. Each page is placed in the Word file as a picture.');
    else if (doc.scannedPages.length) add('Scan', 'Page' + (doc.scannedPages.length > 1 ? 's ' : ' ') + doc.scannedPages.join(', ') + ' hold no text, so ' + (doc.scannedPages.length > 1 ? 'they were' : 'it was') + ' placed as ' + (doc.scannedPages.length > 1 ? 'pictures.' : 'a picture.'));
    if (state.result.ledger.rotated) add('Sideways', state.result.ledger.rotated + ' characters of rotated text were left out. They are listed in the log, not in the Word file.');
    for (const p of state.session.pages) for (const w of p.warnings) add('Page ' + p.num, w);
  }

  /* ---------- the recovered document ---------- */

  function renderPaper() {
    const wrap = $('#paperWrap');
    const doc = state.result.doc;
    for (const u of state.urls) URL.revokeObjectURL(u);
    state.urls = [];
    const avail = Math.max(240, wrap.clientWidth - 36 - ($('#paper').classList.contains('xray') ? 34 : 0));
    const k = clamp(avail / doc.page.w, 0.3, 1.25);
    const out = Preview.render(doc, { scale: k });
    state.urls = out.urls;
    $('#paper').innerHTML = out.html;
  }

  /* ---------- the wreckage ---------- */

  const cur = () => state.result.overlay[state.page - 1];

  async function renderPage() {
    const token = ++state.renderToken;
    const ov = cur();
    const viewer = $('#viewer');
    const avail = Math.max(240, viewer.clientWidth - 36);
    const cssW = Math.min(avail, 900);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const k = cssW / ov.w;
    state.cssW = cssW; state.k = k; state.dpr = dpr;
    const sheet = $('#sheet');
    sheet.style.width = cssW + 'px';
    sheet.style.height = Math.round(ov.h * k) + 'px';
    const pc = $('#pageCv'), oc = $('#ovCv');
    pc.width = oc.width = Math.round(cssW * dpr);
    pc.height = oc.height = Math.round(ov.h * k * dpr);
    $('#spin').hidden = false;
    $('#pageNo').textContent = state.page + ' / ' + state.result.stats.pages;
    try {
      const page = await state.session.pdf.getPage(state.page);
      if (token !== state.renderToken) return;
      const vp = page.getViewport(ov.rotation === undefined ? { scale: (cssW * dpr) / ov.w } : { scale: (cssW * dpr) / ov.w, rotation: ov.rotation });
      const ctx = pc.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, pc.width, pc.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    } catch (e) { /* page rendering is decoration; the Word file does not depend on it */ }
    if (token !== state.renderToken) return;
    $('#spin').hidden = true;
    draw();
  }

  const rand = (i, j) => { let x = Math.sin(i * 12.9898 + j * 78.233 + state.page * 3.17) * 43758.5453; return x - Math.floor(x); };

  function requestDraw() { if (state.drawQueued) return; state.drawQueued = true; requestAnimationFrame(() => { state.drawQueued = false; draw(); }); }

  function draw() {
    if (!state.result) return;
    const oc = $('#ovCv');
    const ctx = oc.getContext('2d');
    const ov = cur();
    const k = state.k * state.dpr;
    ctx.clearRect(0, 0, oc.width, oc.height);
    const s = state.s;
    const crashRaw = 1 - clamp(s / 0.55, 0, 1);
    const crash = ease(crashRaw);
    const reveal = s < 0.55 ? 0 : (s - 0.55) / 0.45;
    const a1 = clamp(reveal * 3, 0, 1), a2 = clamp(reveal * 3 - 1, 0, 1), a3 = clamp(reveal * 3 - 2, 0, 1);

    if (crash > 0.002) drawDebris(ctx, ov, k, crash, oc);
    const L = state.layers;
    if (L.frags && crash < 0.5) {
      ctx.lineWidth = Math.max(1, state.dpr);
      ctx.strokeStyle = colors.debris; ctx.globalAlpha = 0.8 * (1 - crash);
      for (const f of ov.frags) ctx.strokeRect(f.x0 * k, f.y0 * k, (f.x1 - f.x0) * k, (f.y1 - f.y0) * k);
      ctx.globalAlpha = 1;
    }
    if (L.tables && a3 > 0) {
      ctx.globalAlpha = a3;
      for (const g of ov.gutters) {
        ctx.fillStyle = hatch(ctx);
        ctx.fillRect(g.x0 * k, g.y0 * k, (g.x1 - g.x0) * k, (g.y1 - g.y0) * k);
        label(ctx, 'GUTTER', g.x0 * k, g.y0 * k, colors.line, k);
      }
      for (const t of ov.tables) {
        ctx.strokeStyle = colors.table; ctx.lineWidth = 2.5 * state.dpr;
        ctx.strokeRect(t.x0 * k, t.y0 * k, (t.x1 - t.x0) * k, (t.y1 - t.y0) * k);
        ctx.lineWidth = state.dpr; ctx.setLineDash([4 * state.dpr, 3 * state.dpr]);
        for (const c of t.cells) ctx.strokeRect(c.x0 * k, c.y0 * k, (c.x1 - c.x0) * k, (c.y1 - c.y0) * k);
        ctx.setLineDash([]);
        label(ctx, t.ruled ? 'TABLE' : 'TABLE (ALIGNED)', t.x0 * k, t.y0 * k, colors.table, k);
      }
      for (const im of ov.images) {
        ctx.strokeStyle = colors.image; ctx.lineWidth = 2.5 * state.dpr; ctx.setLineDash([6 * state.dpr, 4 * state.dpr]);
        ctx.strokeRect(im.x0 * k, im.y0 * k, (im.x1 - im.x0) * k, (im.y1 - im.y0) * k); ctx.setLineDash([]);
        label(ctx, 'PICTURE', im.x0 * k, im.y0 * k, colors.image, k);
      }
      ctx.globalAlpha = 1;
    }
    if (L.blocks && a2 > 0) {
      ctx.globalAlpha = a2;
      for (const p of ov.paras) {
        const c = p.kind[0] === 'H' || p.kind === 'T' ? colors.head : p.kind === 'LI' ? colors.list : colors.block;
        ctx.fillStyle = c; ctx.globalAlpha = 0.09 * a2;
        ctx.fillRect(p.x0 * k - 2, p.y0 * k - 1, (p.x1 - p.x0) * k + 4, (p.y1 - p.y0) * k + 2);
        ctx.globalAlpha = a2; ctx.strokeStyle = c; ctx.lineWidth = 1.4 * state.dpr;
        ctx.strokeRect(p.x0 * k - 2, p.y0 * k - 1, (p.x1 - p.x0) * k + 4, (p.y1 - p.y0) * k + 2);
        if (state.cssW >= 520 || (p.kind !== 'P' && p.kind !== 'LI')) label(ctx, p.kind, p.x0 * k - 2, p.y0 * k - 1, c, k);
      }
      ctx.globalAlpha = 1;
    }
    if (L.lines && a1 > 0) {
      ctx.globalAlpha = a1; ctx.strokeStyle = colors.line; ctx.lineWidth = 2 * state.dpr; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const l of ov.lines) { ctx.moveTo(l.x0 * k, (l.base + 1.6) * k); ctx.lineTo(l.x1 * k, (l.base + 1.6) * k); }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (state.hover !== null) {
      ctx.fillStyle = colors.orange; ctx.strokeStyle = colors.orange; ctx.lineWidth = 3 * state.dpr;
      const boxes = [...ov.paras.filter((p) => p.id === state.hover), ...ov.tables.filter((t) => t.id === state.hover), ...ov.images.filter((i) => i.id === state.hover)];
      const joined = boxes.length > 1 && ov.tables.some((t) => t.id === state.hover) ? boxes.filter((b) => b.cells) : boxes;
      for (const b of joined) {
        ctx.globalAlpha = 0.2; ctx.fillRect(b.x0 * k - 3, b.y0 * k - 2, (b.x1 - b.x0) * k + 6, (b.y1 - b.y0) * k + 4);
        ctx.globalAlpha = 1; ctx.strokeRect(b.x0 * k - 3, b.y0 * k - 2, (b.x1 - b.x0) * k + 6, (b.y1 - b.y0) * k + 4);
      }
    }
    updateScrubLabel();
  }

  let hatchPattern = null;
  function hatch(ctx) {
    const c = document.createElement('canvas'); c.width = c.height = 12;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,199,44,0.22)'; g.fillRect(0, 0, 12, 12);
    g.strokeStyle = colors.line; g.lineWidth = 2; g.beginPath(); g.moveTo(-2, 14); g.lineTo(14, -2); g.stroke();
    return ctx.createPattern(c, 'repeat');
  }

  function label(ctx, text, x, y, color, k) {
    const fs = Math.max(7, (state.cssW < 520 ? 7 : 9) * state.dpr);
    ctx.font = '500 ' + fs + 'px "IBM Plex Mono", ui-monospace, monospace';
    const w = ctx.measureText(text).width + 8 * state.dpr / 1.5;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - fs - 4, w, fs + 4);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x + 3 * state.dpr / 1.5, y - 3);
  }

  function drawDebris(ctx, ov, k, c, oc) {
    const W = oc.width, H = oc.height;
    // blank out the real text, then throw the fragments about
    for (const f of ov.frags) {
      ctx.fillStyle = f.bg || '#fff';
      ctx.fillRect((f.x0 - 1) * k, (f.y0 - 0.5) * k, (f.x1 - f.x0 + 2) * k, (f.y1 - f.y0 + 1) * k);
    }
    ov.frags.forEach((f, i) => {
      const r1 = rand(i, 1), r2 = rand(i, 2), r3 = rand(i, 3);
      const cx = ((f.x0 + f.x1) / 2) * k, cy = ((f.y0 + f.y1) / 2) * k;
      const dx = (r1 - 0.5) * 2 * W * 0.46 * c;
      const dy = (0.1 + r2 * 0.9) * H * 0.42 * c * (r3 > 0.2 ? 1 : -0.5);
      const rot = (r3 - 0.5) * 2.4 * c;
      const w = Math.max(6, (f.x1 - f.x0) * k), h = Math.max(6, (f.y1 - f.y0) * k);
      ctx.save();
      ctx.translate(cx + dx, cy + dy); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.strokeStyle = colors.debris; ctx.lineWidth = Math.max(1, state.dpr);
      ctx.fillRect(-w / 2 - 2, -h / 2, w + 4, h); ctx.strokeRect(-w / 2 - 2, -h / 2, w + 4, h);
      ctx.fillStyle = '#10161d';
      const fs = Math.max(6, f.fs * k * 0.92);
      ctx.font = (f.bold ? '600 ' : '400 ') + fs + 'px "IBM Plex Sans", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(f.s).width;
      if (tw > 0) { const sx = (w) / tw; ctx.save(); ctx.scale(Math.min(1.4, sx), 1); ctx.fillText(f.s, -w / 2 / Math.min(1.4, sx), 0); ctx.restore(); }
      ctx.restore();
    });
  }

  /* timeline: 0 = wreckage, about half = assembled, 1 = full structure */
  const STAGES = [[0.04, 'Wreckage'], [0.55, 'Assembling'], [0.7, 'Lines'], [0.86, 'Blocks'], [1.01, 'Structure']];
  function updateScrubLabel() {
    const s = state.s;
    const name = (STAGES.find((x) => s < x[0]) || STAGES[STAGES.length - 1])[1];
    if ($('#scrubOut').textContent !== name) $('#scrubOut').textContent = name;
  }
  function setScrub(s) {
    state.s = clamp(s, 0, 1);
    $('#scrub').value = String(Math.round(state.s * 1000));
    requestDraw();
  }
  function cancelPlay() { cancelAnimationFrame(state.raf); state.raf = 0; }
  function play() {
    cancelPlay();
    if (reduceMotion) { setScrub(1); return; }
    const t0 = performance.now(), dur = 5200;
    setScrub(0);
    const step = (now) => {
      const u = clamp((now - t0) / dur, 0, 1);
      setScrub(u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
      if (u < 1) state.raf = requestAnimationFrame(step);
    };
    state.raf = requestAnimationFrame(step);
  }

  /* ---------- hover: wreckage <-> recovery ---------- */

  const kindName = { T: 'Title', H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3', H4: 'Heading 4', H5: 'Heading 5', H6: 'Heading 6', LI: 'List item', P: 'Paragraph' };
  function hitTest(x, y) {
    const ov = cur();
    let best = null, ba = Infinity;
    for (const p of ov.paras) if (x >= p.x0 - 2 && x <= p.x1 + 2 && y >= p.y0 - 1 && y <= p.y1 + 1) { const a = (p.x1 - p.x0) * (p.y1 - p.y0); if (a < ba) { ba = a; best = { id: p.id, text: (kindName[p.kind] || 'Paragraph') + (p.inTable ? ' in a table' : '') }; } }
    if (best) return best;
    for (const im of ov.images) if (x >= im.x0 && x <= im.x1 && y >= im.y0 && y <= im.y1) return { id: im.id, text: 'Picture' };
    for (const t of ov.tables) if (x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1) return { id: t.id, text: 'Table' };
    return null;
  }

  function setHover(id, from) {
    if (state.hover === id) return;
    state.hover = id;
    $$('#paper .pv-hot').forEach((e) => e.classList.remove('pv-hot'));
    if (id !== null) {
      const els = $$('#paper [data-b="' + id + '"]');
      els.forEach((e) => e.classList.add('pv-hot'));
      if (from === 'ov' && els[0]) revealInPaper(els[0]);
    }
    requestDraw();
  }

  function revealInPaper(el) {
    const w = $('#paperWrap');
    const r = el.getBoundingClientRect(), wr = w.getBoundingClientRect();
    if (r.top < wr.top + 8) w.scrollBy({ top: r.top - wr.top - 28, behavior: reduceMotion ? 'auto' : 'smooth' });
    else if (r.bottom > wr.bottom - 8) w.scrollBy({ top: r.bottom - wr.bottom + 28, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- download ---------- */

  async function save() {
    if (!state.result) return;
    const name = state.name.replace(/\.pdf$/i, '') + '.docx';
    const blob = state.result.blob;
    try {
      if (window.claude && window.claude.use) {
        const dl = await window.claude.use('downloads');
        if (dl) {
          try { await dl.save({ filename: name, data: blob }); toast('Saved ' + name + '. You can go back to not needing AI now.'); return; }
          catch (e) { if (e && e.code === 'declined') return; /* otherwise fall through to a plain download */ }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      toast('Saved ' + name + '. You can go back to not needing AI now.');
    } catch (e) { toast('Could not save the file here: ' + (e && e.message ? e.message : e), 6000); }
  }

  /* ---------- settings ---------- */

  function scheduleRebuild() {
    if (!state.session) return;
    clearTimeout(state.rebuildTimer);
    $('#rebuildNote').textContent = 'Rebuilding...';
    state.rebuildTimer = setTimeout(async () => {
      const token = ++state.rebuildToken;
      try {
        const r = await P2W.build(state.session, optionsFromUI());
        if (token !== state.rebuildToken) return;
        state.result = r; state.hover = null;
        state.page = Math.min(state.page, r.stats.pages);
        logT0 = logT0 || performance.now();
        writeLog(false);
        renderTiles(r.stats); renderLedger(r.ledger); renderNotes(); renderPaper(); await renderPage();
        $('#rebuildNote').textContent = 'Rebuilt in ' + Math.round(r.ms) + ' ms';
      } catch (e) { $('#rebuildNote').textContent = 'Rebuild failed: ' + e.message; }
    }, 220);
  }

  /* ---------- wiring ---------- */

  async function fromFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { toast('That is not a PDF. Black Box only reads PDFs.'); return; }
    const buf = new Uint8Array(await file.arrayBuffer());
    handleBytes(buf, file.name);
  }
  $('#file').addEventListener('change', (e) => { fromFile(e.target.files[0]); e.target.value = ''; });
  $('#file2').addEventListener('change', (e) => { fromFile(e.target.files[0]); e.target.value = ''; });
  function sampleBytes() {
    const bin = atob(SAMPLE_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  $('#sampleBtn').addEventListener('click', () => handleBytes(sampleBytes(), 'incident-report-sample.pdf', { sample: true }));

  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; dragDepth++; tray.classList.add('over'); });
  window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) tray.classList.remove('over'); });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; tray.classList.remove('over');
    fromFile(e.dataTransfer.files[0]);
  });

  $('#dlBtn').addEventListener('click', save);
  $('#prevPg').addEventListener('click', () => { if (state.page > 1) { state.page--; state.hover = null; renderPage(); } });
  $('#nextPg').addEventListener('click', () => { if (state.result && state.page < state.result.stats.pages) { state.page++; state.hover = null; renderPage(); } });
  $('#scrub').addEventListener('input', (e) => { cancelPlay(); setScrub(+e.target.value / 1000); });
  $('#rewindBtn').addEventListener('click', play);
  $$('.chip[data-layer]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.layer;
    state.layers[k] = !state.layers[k];
    b.setAttribute('aria-pressed', String(state.layers[k]));
    if (state.s < 1 && k !== 'frags') { cancelPlay(); setScrub(1); }
    requestDraw();
  }));
  $('#xrayBtn').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    $('#paper').classList.toggle('xray', on);
    if (state.result) renderPaper();
  });
  ['#optFixed', '#optHyphen', '#optTables', '#optColumns', '#optHeaders'].forEach((s) => $(s).addEventListener('change', scheduleRebuild));

  const ovc = $('#ovCv');
  ovc.addEventListener('mousemove', (e) => {
    if (!state.result) return;
    const r = ovc.getBoundingClientRect();
    const x = (e.clientX - r.left) / state.k, y = (e.clientY - r.top) / state.k;
    const hit = state.s > 0.55 ? hitTest(x, y) : null;
    const tip = $('#tip');
    if (hit) { tip.hidden = false; tip.textContent = hit.text; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; } else tip.hidden = true;
    setHover(hit ? hit.id : null, 'ov');
  });
  ovc.addEventListener('mouseleave', () => { $('#tip').hidden = true; setHover(null, 'ov'); });
  $('#paper').addEventListener('mouseover', (e) => {
    const el = e.target.closest && e.target.closest('[data-b]');
    setHover(el ? +el.dataset.b : null, 'paper');
  });
  $('#paper').addEventListener('mouseleave', () => setHover(null, 'paper'));

  const tabW = $('#tabWreck'), tabR = $('#tabRecov'), grid = $('#benchGrid');
  const setView = (v) => { grid.dataset.view = v; tabW.setAttribute('aria-selected', String(v === 'wreck')); tabR.setAttribute('aria-selected', String(v === 'recov')); if (state.result) { if (v === 'wreck') renderPage(); else renderPaper(); } };
  tabW.addEventListener('click', () => setView('wreck'));
  tabR.addEventListener('click', () => setView('recov'));

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state.result && !$('#bench').hidden) { renderPaper(); renderPage(); } }, 180);
  });

  if (typeof pdfjsLib !== 'undefined') {
    setupWorker();
    // the bench opens with the sample already on it, and the crash plays when it scrolls into view
    handleBytes(sampleBytes(), 'incident-report-sample.pdf', { initial: true, sample: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries, ob) => {
        if (entries.some((e) => e.isIntersecting) && state.pendingPlay) { state.pendingPlay = false; play(); ob.disconnect(); }
      }, { threshold: 0.3 }).observe($('#benchGrid'));
    }
  } else console.warn('pdf.js did not load');
})();
