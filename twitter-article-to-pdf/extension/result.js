'use strict';
(function () {
  const $ = s => document.querySelector(s);
  const HELPER_PORTS = Array.from({ length: 20 }, (_, i) => 8765 + i);
  const ENGINE_ORDER = ['xelatex', 'lualatex', 'pdflatex', 'tectonic'];

  const state = { project: null, stem: 'x-article', helper: null, pdfBytes: null, pdfUrl: null, busy: false, latexPdf: false, imageUrls: [] };

  // ---------------------------------------------------------------- helpers
  const setStatus = (msg, isError) => { const el = $('#status'); el.textContent = msg || ''; el.className = isError ? 'err' : ''; };

  function download(name, bytes, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function bytesToBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function base64ToBytes(b64) {
    const bin = atob(b64); const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    try { return await res.json(); } catch (e) { throw new Error('The article service answered with HTTP ' + res.status + '.'); }
  }
  async function fetchBytes(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return new Uint8Array(await res.arrayBuffer());
  }

  /** GIF / WebP / odd PNG -> plain 8-bit PNG on white (LaTeX cannot read the originals). */
  async function convertImage(bytes) {
    const bmp = await createImageBitmap(new Blob([bytes]));
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, bmp.width, bmp.height);
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return new Uint8Array(await blob.arrayBuffer());
  }

  // ------------------------------------------------------------ local helper
  async function findHelper() {
    for (const port of HELPER_PORTS) {
      const base = 'http://127.0.0.1:' + port;
      try {
        const t = await fetch(base + '/api/token', { headers: { 'X-Extension-Id': chrome.runtime.id }, signal: AbortSignal.timeout(1200) });
        if (t.status === 403 && port === HELPER_PORTS[0]) { /* helper is running but this extension is not allowed */ state.helperDenied = true; }
        if (!t.ok) continue;
        const token = (await t.json()).token;
        const s = await fetch(base + '/api/status', { headers: { 'X-MD2LaTeX-Token': token }, signal: AbortSignal.timeout(5000) });
        const info = await s.json();
        if (info.ok) return { base, token, engines: info.engines.map(e => e.id) };
      } catch (e) { /* nothing on this port */ }
    }
    return null;
  }

  function describeHelper() {
    const el = $('#helper');
    if (state.helper) {
      el.textContent = 'PDF helper found (' + state.helper.engines.join(', ') + ').';
      return;
    }
    el.textContent = state.helperDenied
      ? 'A helper is running but did not accept this extension. Restart it with the command below.'
      : 'No PDF helper found. Download the project (.zip) and upload it to Overleaf, or start the helper (command below) and press Create PDF.';
  }

  async function createPdf() {
    if (!state.project) return;
    state.helper = await findHelper();
    describeHelper();
    if (!state.helper) { setStatus('The PDF helper is not reachable.', true); return; }
    const want = ENGINE_ORDER.find(e => state.helper.engines.indexOf(e) >= 0);
    if (!want) { setStatus('The helper did not find a LaTeX program on this computer.', true); return; }
    const files = {};
    Object.keys(state.project.files).forEach(k => { files[k] = bytesToBase64(state.project.files[k]); });
    setBusy(true); setStatus('Building the PDF…');
    try {
      const res = await fetch(state.helper.base + '/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-MD2LaTeX-Token': state.helper.token },
        body: JSON.stringify({ tex: state.project.tex, engine: want, files })
      });
      const data = await res.json();
      if (!data.ok) {
        setStatus((data.error || 'The PDF could not be built.') + (data.hint ? ' ' + data.hint : ''), true);
        (data.errors || []).slice(0, 5).forEach(e => addNote('warn', 'LaTeX: ' + (e.message || e)));
        return;
      }
      state.pdfBytes = base64ToBytes(data.pdf);
      if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
      state.pdfUrl = URL.createObjectURL(new Blob([state.pdfBytes], { type: 'application/pdf' }));
      state.latexPdf = true;
      $('#pdf').src = state.pdfUrl; $('#pdf').hidden = false; $('#dl-pdf').hidden = false;
      if (data.recovered) addNote('warn', 'LaTeX reported errors; the PDF skips the parts it could not process.');
      setStatus('LaTeX PDF ready (' + data.engine + ', ' + data.seconds + ' s). Press Download PDF.');
    } catch (e) {
      setStatus('Could not reach the helper: ' + (e && e.message ? e.message : e), true);
    } finally { setBusy(false); }
  }

  // --------------------------------------------------------- PDF (Chrome prints it)
  const PAPER = { a4: [8.27, 11.69], letter: [8.5, 11] };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function prettyDate(iso) {
    const d = new Date(iso + 'T00:00:00Z');
    return isNaN(d) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }

  /** Put the article into #print-root; resolves when pictures and fonts are ready. */
  async function layoutArticle(project) {
    state.imageUrls.forEach(u => URL.revokeObjectURL(u)); state.imageUrls = [];
    const out = XRender.toHtml(project.markdown, {
      marked: self.marked, katex: self.katex, mathRanges: Article2MD.mathRanges,
      imageUrl: file => {
        const bytes = project.images[file];
        if (!bytes) return '';
        const url = URL.createObjectURL(new Blob([bytes]));
        state.imageUrls.push(url);
        return url;
      }
    });
    const head = '<header class="doc-head"><div class="doc-title">' + esc(project.title) + '</div>' +
      (project.author ? '<p class="doc-author">' + esc(project.author) + '</p>' : '') +
      (project.date ? '<p class="doc-date">' + esc(prettyDate(project.date)) + '</p>' : '') +
      (project.source ? '<p class="doc-source"><a href="' + esc(project.source) + '">' + esc(project.source) + '</a></p>' : '') + '</header>';
    const root = $('#print-root');
    root.dataset.font = $('#font').value;
    root.dataset.theme = $('#print').checked ? 'print' : 'color';
    root.style.setProperty('--fs', $('#size').value + 'pt');
    root.innerHTML = head + out.html;
    if (out.mathErrors) addNote('warn', out.mathErrors + ' formula(s) could not be typeset and are shown as source text.');

    const imgs = Array.from(root.querySelectorAll('img'));
    await Promise.all(imgs.map(img => img.decode().catch(() => { addNote('warn', 'A picture could not be displayed and is missing from the PDF.'); })));
    await Promise.all(['400 12pt "LM Roman"', 'italic 400 12pt "LM Roman"', '700 12pt "LM Roman"', '700 12pt "LM Sans"', '12pt "LM Mono"']
      .map(f => document.fonts.load(f).catch(() => {})));
    await document.fonts.ready;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  async function printToPdfBytes(project) {
    const [w, h] = PAPER[$('#paper').value] || PAPER.a4;
    const tab = await chrome.tabs.getCurrent();
    const target = { tabId: tab.id };
    const oldTitle = document.title;
    document.title = project.title;
    await chrome.debugger.attach(target, '1.3');
    try {
      const footer = '<div style="font-family:Georgia,serif;font-size:8px;color:#555;width:100%;padding:0 0.85in;display:flex;justify-content:space-between;box-sizing:border-box">' +
        '<span class="title" style="max-width:80%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span><span class="pageNumber"></span></div>';
      const res = await chrome.debugger.sendCommand(target, 'Page.printToPDF', {
        printBackground: true, displayHeaderFooter: true, preferCSSPageSize: false,
        paperWidth: w, paperHeight: h, marginTop: 0.8, marginBottom: 0.85, marginLeft: 0.85, marginRight: 0.85,
        headerTemplate: '<span></span>', footerTemplate: footer, transferMode: 'ReturnAsBase64'
      });
      return base64ToBytes(res.data);
    } finally {
      document.title = oldTitle;
      try { await chrome.debugger.detach(target); } catch (e) { /* already detached */ }
    }
  }

  function showPdf(bytes) {
    state.pdfBytes = bytes; state.latexPdf = false;
    if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
    state.pdfUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    $('#pdf').src = state.pdfUrl; $('#pdf').hidden = false;
    $('#dl-pdf').hidden = false; $('#print-pdf').hidden = true;
  }

  async function makePdf(project) {
    setStatus('Typesetting the PDF…');
    await layoutArticle(project);
    try {
      showPdf(await printToPdfBytes(project));
      return true;
    } catch (e) {
      addNote('warn', 'Chrome would not export the PDF automatically (' + (e && e.message ? e.message : e) + '). Use Print… and choose "Save as PDF".');
      $('#print-pdf').hidden = false;
      return false;
    }
  }

  // ------------------------------------------------------------------- UI
  function addNote(level, message) {
    const li = document.createElement('li'); li.className = level; li.textContent = message; $('#notes').appendChild(li);
  }
  function addLatexNote(level, message) {
    const li = document.createElement('li'); li.className = level; li.textContent = message; $('#latex-notes').appendChild(li);
  }
  function setBusy(b) {
    state.busy = b;
    ['#go', '#dl-zip', '#dl-tex', '#mk-pdf', '#dl-pdf', '#print-pdf'].forEach(s => { $(s).disabled = b; });
  }

  async function convert(url) {
    setBusy(true); $('#notes').textContent = ''; $('#latex-notes').textContent = ''; $('#result').hidden = true; $('#pdf').hidden = true; $('#dl-pdf').hidden = true; $('#print-pdf').hidden = true;
    state.pdfBytes = null; state.project = null; state.latexPdf = false;
    try {
      state.helper = await findHelper();
      const engine = state.helper ? (ENGINE_ORDER.find(e => state.helper.engines.indexOf(e) >= 0) || 'xelatex') : 'xelatex';
      const project = await XPipeline.buildProject(url, {
        MD2TeX: self.MD2TeX, Article2MD: self.Article2MD,
        fetchJson, fetchBytes, convertImage,
        citations: $('#citations').value,
        texOptions: {
          engine: engine === 'tectonic' ? 'xelatex' : engine,
          font: $('#font').value, paper: $('#paper').value, fontSize: Number($('#size').value),
          toc: $('#toc').checked, theme: $('#print').checked ? 'print' : 'color'
        },
        onProgress: setStatus
      });
      state.project = project;
      state.stem = XPipeline.fileStem(project.title);
      project.warnings.forEach(w => (w.scope === 'latex' ? addLatexNote : addNote)(w.level === 'info' ? 'info' : 'warn', w.message));
      $('#title').textContent = project.title;
      $('#meta').textContent = [project.author, project.date, Object.keys(project.files).length + ' pictures', project.stats.links + ' links']
        .filter(Boolean).join(' · ');
      $('#result').hidden = false;
      describeHelper();
      const ok = await makePdf(project);
      if (ok) {
        download(state.stem + '.pdf', state.pdfBytes, 'application/pdf');
        setStatus('Done. The PDF was downloaded; press Download PDF to save it again.');
      } else {
        setStatus('The article is ready, but the PDF needs one more step (see the note above).', true);
      }
    } catch (e) {
      setStatus(e && e.message ? e.message : String(e), true);
    } finally { setBusy(false); }
  }

  function projectZip() {
    const p = state.project;
    const entries = [{ name: 'main.tex', data: new TextEncoder().encode(p.tex) }, { name: 'article.md', data: new TextEncoder().encode(p.markdown) }];
    Object.keys(p.files).forEach(k => entries.push({ name: k, data: p.files[k] }));
    return MD2Zip.create(entries);
  }

  function init() {
    $('#cmd').textContent = 'python3 serve.py --allow-extension ' + chrome.runtime.id;
    $('#form').addEventListener('submit', e => { e.preventDefault(); convert($('#url').value.trim()); });
    $('#dl-zip').addEventListener('click', () => download(state.stem + '.zip', projectZip(), 'application/zip'));
    $('#dl-tex').addEventListener('click', () => download(state.stem + '.tex', new TextEncoder().encode(state.project.tex), 'application/x-tex'));
    $('#mk-pdf').addEventListener('click', createPdf);
    $('#dl-pdf').addEventListener('click', () => download(state.stem + (state.latexPdf ? '-latex' : '') + '.pdf', state.pdfBytes, 'application/pdf'));
    $('#print-pdf').addEventListener('click', () => window.print());
    const u = new URLSearchParams(location.search).get('u');
    if (u) { $('#url').value = u; convert(u); }
  }
  init();
})();
