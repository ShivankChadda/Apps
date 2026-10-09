'use strict';
(function () {
  const $ = s => document.querySelector(s);
  const HELPER_PORTS = Array.from({ length: 20 }, (_, i) => 8765 + i);
  const ENGINE_ORDER = ['xelatex', 'lualatex', 'pdflatex', 'tectonic'];

  const state = { project: null, stem: 'x-article', helper: null, pdfBytes: null, pdfUrl: null, busy: false };

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
      $('#pdf').src = state.pdfUrl; $('#pdf').hidden = false; $('#dl-pdf').hidden = false;
      if (data.recovered) addNote('warn', 'LaTeX reported errors; the PDF skips the parts it could not process.');
      setStatus('PDF ready (' + data.engine + ', ' + data.seconds + ' s).');
    } catch (e) {
      setStatus('Could not reach the helper: ' + (e && e.message ? e.message : e), true);
    } finally { setBusy(false); }
  }

  // ------------------------------------------------------------------- UI
  function addNote(level, message) {
    const li = document.createElement('li'); li.className = level; li.textContent = message; $('#notes').appendChild(li);
  }
  function setBusy(b) {
    state.busy = b;
    ['#go', '#dl-zip', '#dl-tex', '#mk-pdf', '#dl-pdf'].forEach(s => { $(s).disabled = b; });
  }

  async function convert(url) {
    setBusy(true); $('#notes').textContent = ''; $('#result').hidden = true; $('#pdf').hidden = true; $('#dl-pdf').hidden = true;
    state.pdfBytes = null; state.project = null;
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
      project.warnings.forEach(w => addNote(w.level === 'info' ? 'info' : 'warn', w.message));
      $('#title').textContent = project.title;
      $('#meta').textContent = [project.author, project.date, Object.keys(project.files).length + ' pictures', project.stats.links + ' links']
        .filter(Boolean).join(' · ');
      $('#result').hidden = false;
      describeHelper();
      setStatus('Done. Download the project, or press Create PDF.');
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
    $('#dl-pdf').addEventListener('click', () => download(state.stem + '.pdf', state.pdfBytes, 'application/pdf'));
    const u = new URLSearchParams(location.search).get('u');
    if (u) { $('#url').value = u; convert(u); }
  }
  init();
})();
