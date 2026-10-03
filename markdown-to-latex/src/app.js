/* Markdown to LaTeX: page logic. Depends on marked, MD2TeX and MD2Zip (inlined before this file). */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const MD2TeX = window.MD2TeX;
  const MD2Zip = window.MD2Zip;
  const SAMPLE_MD = /*__SAMPLE_MD__*/ '';

  // ------------------------------------------------------------------ state
  const OPTION_KEYS_NOT_SAVED = ['title', 'subtitle', 'author', 'dateText'];
  const defaults = () => {
    const d = Object.assign({}, MD2TeX.DEFAULTS);
    delete d.resolveAsset; delete d.fileName;
    return d;
  };
  const state = {
    options: defaults(),
    fileName: '', sourcePath: '', source: '', hasDoc: false,
    images: [],                // { id, name, rel, relLower, file, info }
    result: null,
    texOverride: null,
    notes: [],                 // notes from this page (file reading, pictures, build)
    helper: { mode: 'checking', token: '', engines: [] },
    autoPdf: true,
    pdf: { status: 'idle', url: null, bytes: null, error: null, recovered: null, seq: 0, stale: false },
    assetCache: new Map(),
    previewUrls: new Map(),
    activeTab: 'pdf'
  };

  // -------------------------------------------------------------- utilities
  const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.now = (...a) => { clearTimeout(t); fn(...a); }; return d; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtBytes = n => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB');
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');
  const extOf = name => ((/\.([A-Za-z0-9]+)$/.exec(name) || [])[1] || '').toLowerCase();
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage may be unavailable */ } };
  const load = key => { try { return localStorage.getItem(key); } catch (e) { return null; } };

  function bytesToBase64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function dataUriToBytes(uri) {
    const bin = atob(uri.slice(uri.indexOf(',') + 1));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---------------------------------------------------------------- options
  function readControl(el) {
    if (el.type === 'checkbox') {
      if (el.dataset.on) return el.checked ? el.dataset.on : el.dataset.off;
      return el.checked;
    }
    if (el.dataset.type === 'number') return Number(el.value);
    return el.value;
  }
  function writeControl(el, value) {
    if (el.type === 'checkbox') el.checked = el.dataset.on ? value === el.dataset.on : !!value;
    else el.value = String(value);
  }
  function loadOptions() {
    try {
      const saved = JSON.parse(load('md2latex.options.v1') || '{}');
      Object.keys(saved).forEach(k => { if (k in state.options && OPTION_KEYS_NOT_SAVED.indexOf(k) < 0) state.options[k] = saved[k]; });
    } catch (e) { /* ignore corrupt settings */ }
    const auto = load('md2latex.autopdf.v1');
    if (auto !== null) state.autoPdf = auto === '1';
  }
  function saveOptions() {
    const o = Object.assign({}, state.options);
    OPTION_KEYS_NOT_SAVED.forEach(k => delete o[k]);
    save('md2latex.options.v1', JSON.stringify(o));
  }
  function syncOptionControls() {
    $$('[data-opt]').forEach(el => writeControl(el, state.options[el.dataset.opt]));
    $('#date-text-wrap').hidden = state.options.dateMode !== 'custom';
    $('#o-tocDepth').disabled = !state.options.toc;
    $('#auto-pdf') && ($('#auto-pdf').checked = state.autoPdf);
    updateEngineHint();
  }

  // ------------------------------------------------------- files and images
  async function readText(file) {
    const buf = await file.arrayBuffer();
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^\uFEFF/, '');
    } catch (e) {
      addNote('info', 'This file is not UTF-8; it was read as Western European (Windows-1252). If accents look wrong, re-save it as UTF-8.');
      return new TextDecoder('windows-1252').decode(buf);
    }
  }
  const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'pdf', 'tif', 'tiff'];
  const TEXT_EXT = ['md', 'markdown', 'mdown', 'mkd', 'txt'];

  async function collectDropped(dt) {
    const out = [];
    const entries = [];
    if (dt.items && dt.items.length && dt.items[0].webkitGetAsEntry) {
      for (const it of Array.from(dt.items)) { const e = it.kind === 'file' ? it.webkitGetAsEntry() : null; if (e) entries.push(e); }
    }
    const walk = async (entry, prefix) => {
      if (entry.isFile) {
        const file = await new Promise((res, rej) => entry.file(res, rej));
        out.push({ file, rel: prefix + file.name });
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        let batch;
        do {
          batch = await new Promise((res, rej) => reader.readEntries(res, rej));
          for (const e of batch) await walk(e, prefix + entry.name + '/');
        } while (batch.length);
      }
    };
    if (entries.length) { for (const e of entries) await walk(e, ''); }
    else Array.from(dt.files || []).forEach(f => out.push({ file: f, rel: f.webkitRelativePath || f.name }));
    return out;
  }

  async function addImageFile(file, rel) {
    const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    const info = MD2TeX.sniffImage(head);
    const relNorm = rel.replace(/\\/g, '/');
    const rec = { id: 'img' + (state.images.length + 1) + '-' + Math.random().toString(36).slice(2, 6), name: file.name, rel: relNorm, relLower: relNorm.toLowerCase(), file, info };
    state.images = state.images.filter(i => i.relLower !== rec.relLower);
    state.images.push(rec);
    state.assetCache.clear();
  }

  async function ingest(list) {
    const items = list.filter(x => x && x.file);
    const texts = items.filter(x => TEXT_EXT.indexOf(extOf(x.file.name)) >= 0);
    const images = items.filter(x => IMAGE_EXT.indexOf(extOf(x.file.name)) >= 0);
    state.notes = state.notes.filter(n => !n.transient);
    for (const im of images) await addImageFile(im.file, im.rel);
    if (texts.length) {
      const pick = texts.find(t => /\.(md|markdown|mdown|mkd)$/i.test(t.file.name)) || texts[0];
      if (texts.length > 1) addNote('info', 'You added ' + texts.length + ' text files; only one document is converted at a time. Using “' + pick.file.name + '”.', true);
      state.source = await readText(pick.file);
      state.fileName = pick.file.name;
      state.sourcePath = pick.rel;
      state.hasDoc = true;
      state.texOverride = null;
      $('#paste-text').value = '';
    } else if (!images.length && items.length) {
      addNote('warn', 'That file type is not supported. Please choose a Markdown (.md) or text file.', true);
    }
    renderImages();
    scheduleConvert.now();
  }

  const dirOf = p => (p.indexOf('/') >= 0 ? p.slice(0, p.lastIndexOf('/') + 1) : '');
  function normalizePath(p) {
    const out = [];
    p.replace(/\\/g, '/').split('/').forEach(seg => { if (seg === '..') out.pop(); else if (seg && seg !== '.') out.push(seg); });
    return out.join('/');
  }

  /** Find the picture a Markdown path refers to: exact path next to the document, then any path ending the same way, then the file name. */
  function resolveAsset(key) {
    if (!state.images.length) return null;
    const k = normalizePath(key).toLowerCase();
    const base = k.slice(k.lastIndexOf('/') + 1);
    const withDir = normalizePath(dirOf(state.sourcePath) + key).toLowerCase();
    let rec = state.images.find(i => i.relLower === withDir) ||
      state.images.find(i => i.relLower === k) ||
      state.images.find(i => i.relLower.endsWith('/' + k));
    if (!rec) {
      const same = state.images.filter(i => i.name.toLowerCase() === base);
      if (same.length === 1) rec = same[0];
    }
    if (!rec) return null;
    const fmt = rec.info.format === 'unknown' ? extOf(rec.name) : rec.info.format;
    return { id: rec.id, name: rec.name, ext: fmt === 'jpeg' ? 'jpg' : fmt, convert: rec.info.normalize && fmt !== 'pdf' };
  }

  async function toPng(blob) {
    const type = blob.type || '';
    let source, w, h, release = () => {};
    const isSvg = type.indexOf('svg') >= 0 || /\.svg$/i.test(blob.name || '');
    if (!isSvg && window.createImageBitmap) {
      try { source = await createImageBitmap(blob); w = source.width; h = source.height; release = () => source.close && source.close(); } catch (e) { source = null; }
    }
    if (!source) {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      try { await img.decode(); } finally { /* revoked below */ }
      source = img; w = img.naturalWidth || 800; h = img.naturalHeight || 600;
      release = () => URL.revokeObjectURL(url);
      if (isSvg && w < 800) { const f = 1200 / w; w = Math.round(w * f); h = Math.round(h * f); }
    }
    const scale = Math.min(1, 4096 / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    release();
    const out = await new Promise(res => canvas.toBlob(res, 'image/png'));
    if (!out) throw new Error('could not encode PNG');
    return new Uint8Array(await out.arrayBuffer());
  }

  async function assetBytes(asset) {
    const key = asset.id + (asset.convert ? ':png' : '');
    if (state.assetCache.has(key)) return state.assetCache.get(key);
    let blob;
    if (asset.dataUri) blob = new Blob([dataUriToBytes(asset.dataUri)], { type: 'image/' + (asset.originalExt || 'png') });
    else { const rec = state.images.find(i => i.id === asset.id); if (!rec) throw new Error('picture missing'); blob = rec.file; }
    const bytes = asset.convert ? await toPng(blob) : new Uint8Array(await blob.arrayBuffer());
    state.assetCache.set(key, bytes);
    return bytes;
  }

  /** Map texPath -> bytes for every picture the document uses (pictures that cannot be read are skipped). */
  async function collectAssets() {
    const files = {};
    const failed = [];
    for (const a of (state.result ? state.result.assets : [])) {
      try { files[a.texPath] = await assetBytes(a); } catch (e) { failed.push(a.source || a.name); }
    }
    if (failed.length) addNote('warn', 'These pictures could not be read and were left out: ' + failed.join(', ') + '.', true);
    return files;
  }

  function renderImages() {
    const ul = $('#image-list');
    const used = new Set((state.result ? state.result.assets : []).map(a => a.id));
    ul.innerHTML = '';
    state.images.forEach(rec => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="nm" title="' + esc(rec.rel) + '">' + esc(rec.rel) + '</span><span class="tag' + (used.has(rec.id) ? '' : ' unused') + '">' + (used.has(rec.id) ? 'used' : 'not used') + '</span>';
      const rm = document.createElement('button');
      rm.className = 'btn link'; rm.type = 'button'; rm.textContent = '✕'; rm.title = 'Remove ' + rec.name; rm.setAttribute('aria-label', 'Remove ' + rec.name);
      rm.addEventListener('click', () => { state.images = state.images.filter(i => i !== rec); state.assetCache.clear(); renderImages(); scheduleConvert.now(); });
      li.appendChild(rm);
      ul.appendChild(li);
    });
  }

  // ----------------------------------------------------------------- notes
  function addNote(level, message, transient) {
    if (!state.notes.some(n => n.message === message)) state.notes.push({ level, message, transient: !!transient });
  }

  // ------------------------------------------------------------- converting
  const scheduleConvert = debounce(convertNow, 180);

  function convertNow() {
    if (!state.hasDoc) { renderAll(); return; }
    const t0 = performance.now();
    try {
      const opts = Object.assign({}, state.options, { fileName: state.fileName, resolveAsset });
      state.result = MD2TeX.convert(state.source, opts);
      state.convertMs = performance.now() - t0;
      state.error = null;
    } catch (err) {
      console.error(err);
      state.result = null;
      state.error = err;
    }
    renderAll();
    if (state.result) schedulePdf();
  }

  // ------------------------------------------------------------------ tabs
  function selectTab(name) {
    state.activeTab = name;
    ['pdf', 'tex', 'preview', 'notes'].forEach(n => {
      const on = n === name;
      $('#tab-' + n).setAttribute('aria-selected', on ? 'true' : 'false');
      $('#tab-' + n).tabIndex = on ? 0 : -1;
      $('#pane-' + n).hidden = !on;
    });
    if (name === 'preview') renderPreview();
  }

  const currentTex = () => (state.texOverride != null ? state.texOverride : (state.result ? state.result.tex : ''));

  // --------------------------------------------------------------- rendering
  function renderAll() {
    const has = !!state.result;
    $('#empty').hidden = state.hasDoc;
    $('#work').hidden = !state.hasDoc;
    $('#actions').hidden = !state.hasDoc;
    $('#dropzone').hidden = state.hasDoc;
    $('#filecard').hidden = !state.hasDoc;
    if (state.hasDoc) {
      $('#file-name').textContent = state.fileName || 'pasted text';
      const words = has ? state.result.stats.words : 0;
      $('#file-sub').textContent = fmtBytes(new Blob([state.source]).size) + ' · ' + words.toLocaleString() + ' words';
      document.title = (state.fileName || 'Document') + ' · Markdown to LaTeX';
    } else document.title = 'Markdown to LaTeX';

    if (state.hasDoc) {
      if (has) {
        const s = state.result.stats;
        const bits = [plural(s.words, 'word'), plural(s.headings, 'heading')];
        if (s.tables) bits.push(plural(s.tables, 'table'));
        if (s.codeBlocks) bits.push(plural(s.codeBlocks, 'code block'));
        if (s.images) bits.push(plural(s.images, 'picture'));
        $('#h-out').textContent = state.result.meta.title || state.fileName || 'Your document';
        $('#out-sub').textContent = bits.join(' · ') + (state.result.resolved.titlePage ? ' · with title page' : '');
      } else {
        $('#h-out').textContent = 'Could not convert';
        $('#out-sub').textContent = state.error ? String(state.error.message || state.error) : '';
      }
    } else {
      $('#h-out').textContent = 'Result';
      $('#out-sub').textContent = 'Choose a file to begin.';
    }

    $('#btn-tex').disabled = !has;
    $('#btn-zip').disabled = !has;
    $('#btn-pdf').hidden = state.helper.mode !== 'ready';
    $('#btn-pdf').textContent = state.pdf.status === 'ready' ? 'Rebuild PDF' : 'Create PDF';
    $('#btn-pdf').disabled = !has || state.pdf.status === 'building';
    $('#btn-pdf-dl').hidden = state.pdf.status !== 'ready';

    // LaTeX pane
    const texBox = $('#tex');
    if (has && texBox.readOnly) texBox.value = currentTex();
    $('#reset-tex').hidden = state.texOverride == null;
    $('#tex-note').textContent = state.texOverride != null
      ? 'You edited the LaTeX. Changes in the settings no longer update it until you go back to the generated version.'
      : 'Generated LaTeX. Compile it with XeLaTeX, LuaLaTeX or pdfLaTeX (twice, for the table of contents).';

    renderNotes();
    renderPdfPane();
    renderHelperChip();
    renderImages();
    updateEngineHint();
    if (state.activeTab === 'preview' && !$('#pane-preview').hidden) renderPreview();
  }

  function renderNotes() {
    const list = [];
    if (state.result) state.result.warnings.forEach(w => list.push({ level: w.level === 'info' ? 'info' : 'warn', message: w.message }));
    state.notes.forEach(n => list.push(n));
    const ul = $('#notes-list');
    ul.innerHTML = '';
    if (!list.length) ul.innerHTML = '<li class="info"><span class="ic">✓</span><span>Nothing to report: everything in your document was understood.</span></li>';
    list.forEach(n => {
      const li = document.createElement('li');
      li.className = n.level;
      li.innerHTML = '<span class="ic">' + (n.level === 'warn' ? '!' : n.level === 'error' ? '×' : 'i') + '</span><span></span>';
      li.lastChild.textContent = n.message;
      ul.appendChild(li);
    });
    const warnCount = list.filter(n => n.level === 'warn' || n.level === 'error').length;
    const badge = $('#notes-badge');
    badge.hidden = !warnCount;
    badge.textContent = warnCount;
  }

  const ENGINE_NAMES = { xelatex: 'XeLaTeX', lualatex: 'LuaLaTeX', pdflatex: 'pdfLaTeX', tectonic: 'Tectonic' };

  /** Which installed engine builds the PDF for the engine chosen in the settings. */
  function compileEngine() {
    const have = state.helper.engines.map(e => e.id);
    const want = state.options.engine;
    if (have.indexOf(want) >= 0) return want;
    if (want === 'xelatex' && have.indexOf('tectonic') >= 0) return 'tectonic';
    return have[0] || want;
  }
  function updateEngineHint() {
    const hint = $('#engine-hint');
    if (state.helper.mode !== 'ready') { hint.textContent = 'Which program builds the PDF. XeLaTeX or LuaLaTeX handle every language.'; return; }
    const used = compileEngine();
    const same = used === state.options.engine || (used === 'tectonic' && state.options.engine === 'xelatex');
    hint.textContent = same ? 'This computer will build the PDF with ' + ENGINE_NAMES[used] + '.'
      : ENGINE_NAMES[state.options.engine] + ' is not installed here; the PDF will be built with ' + ENGINE_NAMES[used] + ' instead.';
  }

  function renderHelperChip() {
    const chip = $('#helper-chip');
    const text = $('#helper-text');
    chip.className = 'chip';
    const m = state.helper.mode;
    if (m === 'ready') { chip.classList.add('ready'); text.textContent = 'PDF export on · ' + ENGINE_NAMES[compileEngine()]; }
    else if (m === 'noengine') { chip.classList.add('warn'); text.textContent = 'No LaTeX engine found'; }
    else if (m === 'none') text.textContent = 'PDF export is off';
    else text.textContent = 'Checking PDF export…';
    $('#auto-label').hidden = m !== 'ready';
    const st = $('#help-status');
    if (st) {
      st.innerHTML = m === 'ready' ? '<b style="color:var(--ok)">✓ Connected.</b> Found: ' + esc(state.helper.engines.map(e => e.label).join(', ')) + '.'
        : m === 'noengine' ? '<b style="color:var(--warn)">The helper is running but found no LaTeX engine.</b> Install one, then restart <code>serve.py</code>.'
        : m === 'none' ? 'Right now this page runs without the helper, so only the .tex download works.' : '';
    }
  }

  function setupNoticeHtml() {
    const m = state.helper.mode;
    const lead = m === 'noengine'
      ? '<h3>The helper is running, but no LaTeX engine was found</h3><p>Install <b>MiKTeX</b> (Windows), <b>MacTeX</b> (macOS) or <b>TeX Live</b> (Linux), then restart <code>serve.py</code>. Meanwhile you can still use the options below.</p>'
      : '<h3>PDF export is off</h3><p>This page converts your Markdown into LaTeX instantly. Turning that LaTeX into a PDF needs a LaTeX engine, which a web page cannot include. Pick the way that suits you:</p>';
    return '<div class="callout">' + lead + '<div class="routes">' +
      '<div class="route"><h4>A · Build it on this computer</h4><p>Install MiKTeX / MacTeX / TeX Live, then run <code>python3 serve.py</code> (Windows: <code>py serve.py</code>) in this folder.</p></div>' +
      '<div class="route"><h4>B · Use Overleaf (nothing to install)</h4><p>Click <b>Download project (.zip)</b> and upload it at overleaf.com.</p></div>' +
      '<div class="route"><h4>C · Print the quick preview</h4><p>Open the <b>Quick preview</b> tab and print it from your browser.</p></div>' +
      '</div><p style="margin-top:10px"><button class="btn small" type="button" data-open-help>More detail</button></p></div>';
  }

  function errorListHtml(errors) {
    if (!errors || !errors.length) return '';
    return '<ul>' + errors.map(x => '<li>' + (x.line ? 'LaTeX line ' + x.line + ': ' : '') + esc(x.message) +
      (x.context ? '<br><code>' + (x.context.slice(0, 3) === '...' ? '' : '…') + esc(x.context) + '</code>' : '') + '</li>').join('') + '</ul>';
  }

  function renderPdfPane() {
    const msg = $('#pdf-msg');
    const frame = $('#pdf-frame');
    if (!state.hasDoc) { msg.innerHTML = ''; frame.hidden = true; return; }
    const p = state.pdf;
    const m = state.helper.mode;
    if (m !== 'ready') {
      frame.hidden = true;
      msg.innerHTML = m === 'checking' ? '<div class="building"><div class="spinner"></div><span>Checking for PDF export…</span></div>' : setupNoticeHtml();
      return;
    }
    let html = '';
    if (p.status === 'error') {
      const e = p.error || {};
      html += '<div class="callout error"><h3>The PDF could not be built</h3><p>' + esc(e.error || 'Unknown problem.') + '</p>' +
        (e.hint ? '<p><b>What to try:</b> ' + esc(e.hint) + '</p>' : '') + errorListHtml(e.errors) +
        (e.log ? '<details><summary>Show the full LaTeX log</summary><pre>' + esc(e.log) + '</pre></details>' : '') +
        '<p style="margin-top:8px">The <b>LaTeX</b> tab still has your document; you can download it and open it in your own editor.</p></div>';
    } else if (p.status === 'idle') {
      html += '<div class="callout">Click <b>Create PDF</b> to typeset this document.</div>';
    } else if (p.status === 'building') {
      html += '<div class="building"><div class="spinner"></div><span>Building the PDF with ' + esc(ENGINE_NAMES[compileEngine()]) + '…</span></div>';
    } else if (p.status === 'ready') {
      if (p.recovered) {
        const r = p.recovered;
        const count = r.count || (r.errors ? r.errors.length : 0);
        html += '<div class="callout warn"><h3>The PDF was built, but LaTeX reported ' + (count === 1 ? 'a problem' : (count || 'some') + ' problems') + '</h3>' +
          '<p>LaTeX skipped what it could not process, so a formula or a few characters may be missing or garbled in the PDF. The grey text shows where LaTeX stopped.</p>' +
          (r.hint ? '<p><b>What to try:</b> ' + esc(r.hint) + '</p>' : '') + errorListHtml(r.errors) + '</div>';
      }
      if (p.warnings && (p.warnings.missing_glyphs || p.warnings.omitted_chars)) {
        html += '<div class="callout warn"><b>' + (p.warnings.missing_glyphs + p.warnings.omitted_chars) + ' character(s) could not be shown</b> because the font has no symbol for them (see the Notes tab, or choose XeLaTeX / LuaLaTeX).</div>';
      }
    }
    if (p.url && p.status !== 'error') {
      html += '<p class="muted-note">Nothing showing? Some browsers and phones cannot display a PDF inside a page. <a href="' + p.url + '" target="_blank" rel="noopener">Open the PDF in a new tab</a>, or use <b>Download PDF</b>.</p>';
    }
    msg.innerHTML = html;
    if (p.url) {
      if (frame.dataset.url !== p.url) { frame.dataset.url = p.url; frame.src = p.url + '#view=FitH'; }
      frame.hidden = false;
      frame.classList.toggle('stale', p.status === 'building' || !!p.stale);
    } else frame.hidden = true;
  }

  // ----------------------------------------------------------------- preview
  function previewHtml() {
    const I = MD2TeX._internals;
    const fm = I.splitFrontMatter(state.source.replace(/\r\n?/g, '\n'));
    const fn = I.extractFootnotes(fm.body);
    let body = fn.src;
    const order = [];
    body = body.replace(/\[\^([^\]\s]+)\]/g, (m, id) => {
      if (!fn.defs.has(id)) return m;
      if (order.indexOf(id) < 0) order.push(id);
      return '<sup>' + (order.indexOf(id) + 1) + '</sup>';
    });
    const previewMarked = new window.marked.Marked({ gfm: true, breaks: state.options.hardBreaks });
    let html = previewMarked.parse(body);
    if (order.length) {
      html += '<hr><ol style="font-size:.9em">' + order.map(id => '<li>' + previewMarked.parseInline(fn.defs.get(id)) + '</li>').join('') + '</ol>';
    }
    const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    doc.querySelectorAll('script,style,link,meta,base,iframe,object,embed,form,input:not([type=checkbox])').forEach(n => n.remove());
    doc.querySelectorAll('*').forEach(n => {
      Array.from(n.attributes).forEach(a => { if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
      if (n.tagName === 'A') { const h = n.getAttribute('href') || ''; if (/^\s*(javascript|data|vbscript):/i.test(h)) n.removeAttribute('href'); n.setAttribute('rel', 'noopener'); }
    });
    doc.querySelectorAll('blockquote > p:first-child').forEach(p => {
      const m = /^\s*\[!([A-Za-z]+)\]\s*/.exec(p.textContent);
      if (!m) return;
      p.innerHTML = p.innerHTML.replace(/^\s*\[!([A-Za-z]+)\]\s*(<br>)?/, (x, kind) => '<b>' + kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase() + '</b><br>');
    });
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      const rec = /^https?:|^data:/i.test(src) ? null : resolveRecord(src);
      if (rec) img.setAttribute('src', previewUrl(rec));
      else { const s = doc.createElement('em'); s.textContent = '[' + (img.getAttribute('alt') || 'image') + ']'; img.replaceWith(s); }
    });
    const m = state.result ? state.result.meta : {};
    const head = (m.hasTitle ? '<h1 class="doc-title">' + esc(m.title) + '</h1>' : '') + (m.author ? '<p class="doc-author">' + esc(m.author) + '</p>' : '');
    const css = 'body{font:16px/1.6 Georgia,"Times New Roman",serif;max-width:46em;margin:2em auto;padding:0 1.2em;color:#111}h1,h2,h3,h4{font-family:system-ui,sans-serif;line-height:1.25}' +
      'h1.doc-title{text-align:center;margin-bottom:.2em}p.doc-author{text-align:center;color:#555}pre{background:#f4f5f7;padding:.8em 1em;overflow:auto;border-radius:6px;font-size:.88em}' +
      'code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em}table{border-collapse:collapse;margin:1em 0}th,td{border-top:1px solid #bbb;border-bottom:1px solid #bbb;padding:.35em .7em}th{border-bottom:2px solid #333}' +
      'blockquote{margin:1em 0;padding:.1em 1em;border-left:4px solid #bbb;color:#444}img{max-width:100%;height:auto}@media print{body{margin:0;max-width:none}}@page{margin:2cm}';
    return '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\'"><style>' + css + '</style><body>' + head + doc.body.innerHTML + '</body>';
  }
  function resolveRecord(src) {
    const r = resolveAsset(decodeURIComponentSafe(src.split(/[?#]/)[0]));
    return r ? state.images.find(i => i.id === r.id) : null;
  }
  const decodeURIComponentSafe = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  function previewUrl(rec) {
    if (!state.previewUrls.has(rec.id)) state.previewUrls.set(rec.id, URL.createObjectURL(rec.file));
    return state.previewUrls.get(rec.id);
  }
  function renderPreview() {
    if (!state.hasDoc) return;
    $('#preview-frame').srcdoc = previewHtml();
  }

  // ------------------------------------------------------------- PDF building
  const schedulePdf = debounce(() => { if (state.helper.mode === 'ready' && state.autoPdf) buildPdf(); else markStale(); }, 900);
  function markStale() { if (state.pdf.url) { state.pdf.stale = true; renderPdfPane(); } }

  async function buildPdf() {
    if (state.helper.mode !== 'ready' || !state.result) return;
    const seq = ++state.pdf.seq;
    state.pdf.status = 'building';
    state.pdf.error = null;
    state.notes = state.notes.filter(n => !n.fromBuild);
    renderPdfPane(); renderAllButtons();
    try {
      const files = {};
      const assets = await collectAssets();
      Object.keys(assets).forEach(k => { files[k] = bytesToBase64(assets[k]); });
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-MD2LaTeX-Token': state.helper.token },
        body: JSON.stringify({ tex: currentTex(), engine: compileEngine(), files })
      });
      const data = await res.json();
      if (seq !== state.pdf.seq) return;                  // a newer build replaced this one
      if (!data.ok) {
        state.pdf.status = 'error'; state.pdf.error = data;
      } else {
        if (state.pdf.url) URL.revokeObjectURL(state.pdf.url);
        const bytes = dataUriToBytes('x,' + data.pdf);
        state.pdf.bytes = bytes;
        state.pdf.url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        state.pdf.status = 'ready'; state.pdf.stale = false;
        state.pdf.warnings = data.warnings; state.pdf.seconds = data.seconds; state.pdf.engine = data.engine;
        state.pdf.recovered = data.recovered || null;
        if (data.recovered) state.notes.push({ level: 'warn', fromBuild: true, message: 'LaTeX reported errors while building the PDF and skipped the parts it could not process. See the message above the PDF.' });
        if (data.warnings && data.warnings.missing_glyphs) state.notes.push({ level: 'warn', fromBuild: true, message: data.warnings.missing_glyphs + ' character(s) are missing from the chosen font and do not appear in the PDF. Choose XeLaTeX or LuaLaTeX, or add a font under “Extra LaTeX” (see the README).' });
        if (data.warnings && data.warnings.omitted_chars) state.notes.push({ level: 'warn', fromBuild: true, message: data.warnings.omitted_chars + ' character(s) cannot be typeset by pdfLaTeX and were skipped. Choose XeLaTeX or LuaLaTeX.' });
        if (data.warnings && data.warnings.overfull) state.notes.push({ level: 'info', fromBuild: true, message: data.warnings.overfull + ' line(s) stick out into the margin (usually long words or URLs).' });
      }
    } catch (err) {
      if (seq !== state.pdf.seq) return;
      state.pdf.status = 'error';
      state.pdf.error = { error: 'Could not reach the helper (' + (err && err.message ? err.message : err) + '). Is serve.py still running?', errors: [] };
    }
    renderNotes(); renderPdfPane(); renderAllButtons();
    $('#out-sub').textContent = $('#out-sub').textContent.replace(/ · PDF in [\d.]+ s$/, '') + (state.pdf.status === 'ready' ? ' · PDF in ' + state.pdf.seconds + ' s' : '');
  }
  function renderAllButtons() {
    const has = !!state.result;
    $('#btn-pdf').hidden = state.helper.mode !== 'ready';
    $('#btn-pdf').textContent = state.pdf.status === 'ready' ? 'Rebuild PDF' : 'Create PDF';
    $('#btn-pdf').disabled = !has || state.pdf.status === 'building';
    $('#btn-pdf-dl').hidden = state.pdf.status !== 'ready';
  }

  // ------------------------------------------------------------------ helper
  async function initHelper() {
    const meta = $('meta[name="md2latex-token"]');
    const token = meta ? meta.getAttribute('content') : '';
    if (!token || location.protocol === 'file:') { state.helper = { mode: 'none', token: '', engines: [] }; renderAll(); return; }
    try {
      const res = await fetch('/api/status', { headers: { 'X-MD2LaTeX-Token': token }, cache: 'no-store' });
      const data = await res.json();
      state.helper = { mode: data.engines && data.engines.length ? 'ready' : 'noengine', token, engines: data.engines || [] };
      // a pdfLaTeX-only installation must also get pdfLaTeX-compatible LaTeX
      const ids = state.helper.engines.map(e => e.id);
      if (state.helper.mode === 'ready' && ids.indexOf(state.options.engine) < 0 && ids.indexOf('tectonic') < 0 && ids.length === 1) {
        state.options.engine = ids[0];
        syncOptionControls();
      }
    } catch (e) {
      state.helper = { mode: 'none', token: '', engines: [] };
    }
    renderAll();
    if (state.result) schedulePdf.now();
  }

  // --------------------------------------------------------------- downloads
  const fileStem = () => (state.result ? state.result.texName.replace(/\.tex$/, '') : 'document');
  function downloadTex() { if (state.result) download(fileStem() + '.tex', currentTex(), 'application/x-tex;charset=utf-8'); }
  async function downloadZip() {
    if (!state.result) return;
    const assets = await collectAssets();
    const files = [{ name: fileStem() + '.tex', data: currentTex() }];
    Object.keys(assets).forEach(k => files.push({ name: k, data: assets[k] }));
    download(fileStem() + '.zip', MD2Zip.create(files), 'application/zip');
  }
  function downloadPdf() { if (state.pdf.bytes) download(fileStem() + '.pdf', state.pdf.bytes, 'application/pdf'); }
  async function copyTex() {
    const text = currentTex();
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const box = $('#tex'); box.select(); document.execCommand('copy'); }
    const btn = $('#copy-tex'); const old = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = old; }, 1400);
  }

  // ------------------------------------------------------------------ events
  function bind() {
    const fileInput = $('#file-input');
    const pick = () => { fileInput.value = ''; fileInput.click(); };
    $('#dropzone').addEventListener('click', pick);
    $('#dropzone').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    $('#replace-btn').addEventListener('click', pick);
    fileInput.addEventListener('change', () => ingest(Array.from(fileInput.files).map(f => ({ file: f, rel: f.name }))));
    $('#add-images').addEventListener('click', () => { $('#image-input').value = ''; $('#image-input').click(); });
    $('#image-input').addEventListener('change', e => ingest(Array.from(e.target.files).map(f => ({ file: f, rel: f.name }))));
    $('#add-folder').addEventListener('click', () => { $('#folder-input').value = ''; $('#folder-input').click(); });
    $('#folder-input').addEventListener('change', e => ingest(Array.from(e.target.files).map(f => ({ file: f, rel: f.webkitRelativePath || f.name }))));

    let depth = 0;
    const overlay = $('#drop-overlay');
    window.addEventListener('dragenter', e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') >= 0) { depth++; overlay.hidden = false; $('#dropzone').classList.add('over'); } });
    window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) { overlay.hidden = true; $('#dropzone').classList.remove('over'); } });
    window.addEventListener('dragover', e => { e.preventDefault(); });
    window.addEventListener('drop', async e => {
      e.preventDefault(); depth = 0; overlay.hidden = true; $('#dropzone').classList.remove('over');
      if (!e.dataTransfer) return;
      ingest(await collectDropped(e.dataTransfer));
    });

    $('#paste-text').addEventListener('input', e => {
      state.source = e.target.value; state.fileName = 'pasted.md'; state.sourcePath = 'pasted.md'; state.hasDoc = !!state.source.trim(); state.texOverride = null;
      scheduleConvert();
    });
    const loadExample = () => {
      state.source = SAMPLE_MD; state.fileName = 'example.md'; state.sourcePath = 'example.md'; state.hasDoc = true; state.texOverride = null;
      state.notes = []; $('#paste-text').value = '';
      scheduleConvert.now();
    };
    $('#example-btn').addEventListener('click', loadExample);
    $('#example-btn-2').addEventListener('click', loadExample);

    $$('[data-opt]').forEach(el => {
      const handler = () => {
        state.options[el.dataset.opt] = readControl(el);
        if (el.dataset.opt === 'dateMode') $('#date-text-wrap').hidden = state.options.dateMode !== 'custom';
        if (el.dataset.opt === 'toc') $('#o-tocDepth').disabled = !state.options.toc;
        saveOptions(); updateEngineHint(); scheduleConvert();
      };
      el.addEventListener(el.tagName === 'TEXTAREA' || el.type === 'text' ? 'input' : 'change', handler);
    });

    const tabs = ['pdf', 'tex', 'preview', 'notes'];
    tabs.forEach((n, i) => {
      const t = $('#tab-' + n);
      t.addEventListener('click', () => selectTab(n));
      t.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          selectTab(next); $('#tab-' + next).focus();
        }
      });
    });

    $('#btn-tex').addEventListener('click', downloadTex);
    $('#btn-zip').addEventListener('click', downloadZip);
    $('#btn-pdf').addEventListener('click', () => buildPdf());
    $('#btn-pdf-dl').addEventListener('click', downloadPdf);
    $('#copy-tex').addEventListener('click', copyTex);
    $('#edit-tex').addEventListener('click', () => {
      const box = $('#tex');
      box.readOnly = false; box.focus();
      $('#edit-tex').hidden = true;
      $('#tex-note').textContent = 'Editing: your changes are used for downloads and for the PDF.';
    });
    $('#tex').addEventListener('input', e => { state.texOverride = e.target.value; $('#reset-tex').hidden = false; schedulePdf(); });
    $('#reset-tex').addEventListener('click', () => {
      state.texOverride = null; const box = $('#tex'); box.readOnly = true; $('#edit-tex').hidden = false;
      renderAll(); schedulePdf();
    });
    $('#print-preview').addEventListener('click', () => { const f = $('#preview-frame'); f.contentWindow.focus(); f.contentWindow.print(); });

    const dlg = $('#help-dialog');
    const openHelp = () => { renderHelperChip(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };
    $('#helper-chip').addEventListener('click', openHelp);
    $('#help-close').addEventListener('click', () => (dlg.close ? dlg.close() : dlg.removeAttribute('open')));
    document.addEventListener('click', e => { if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-open-help')) openHelp(); });

    $('#auto-pdf').addEventListener('change', e => { state.autoPdf = e.target.checked; save('md2latex.autopdf.v1', state.autoPdf ? '1' : '0'); if (state.autoPdf) schedulePdf(); });

    const theme = $('#theme-btn');
    const savedTheme = load('md2latex.theme.v1');
    if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
    theme.addEventListener('click', () => {
      const cur = document.documentElement.dataset.theme;
      const dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = dark ? 'light' : 'dark';
      save('md2latex.theme.v1', document.documentElement.dataset.theme);
    });
  }

  // ------------------------------------------------------------------- start
  loadOptions();
  syncOptionControls();
  bind();
  selectTab('pdf');
  renderAll();
  initHelper();

  window.__md2latex = { state, convertNow, buildPdf, resolveAsset, selectTab, ingest };
})();
