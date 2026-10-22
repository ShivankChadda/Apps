/* main.js: the pipeline, from PDF bytes to a Word file. */
const P2W = (() => {
  'use strict';

  const alnum = (s) => (s.match(/[\p{L}\p{N}]/gu) || []).length;

  /* Every letter and digit that went in should come out (or be accounted for). */
  function ledger(pages, doc) {
    let inn = 0, rot = 0;
    for (const p of pages) {
      for (const f of p.frags) inn += alnum(f.s);
      for (const r of p.rotated) rot += alnum(r.s);
    }
    let out = 0;
    const count = (p) => {
      for (const r of p.runs || []) if (!r.tab) out += alnum(r.text);
      if (p.marker && p.list && p.marker.kind === 'num') out += alnum(p.marker.text);
    };
    for (const b of doc.blocks) {
      if (b.type === 'p') count(b);
      else if (b.type === 'table') for (const c of b.cells) for (const q of c.blocks) if (q.type === 'p') count(q);
    }
    return { charsIn: inn, charsOut: out, rotated: rot, lost: Math.max(0, inn - out) };
  }

  function titleOf(doc) {
    for (const b of doc.blocks) if (b.type === 'p' && b.heading) return b.lines.map((l) => l.text).join(' ').slice(0, 200);
    const p = doc.blocks.find((b) => b.type === 'p');
    return p ? p.lines.map((l) => l.text).join(' ').slice(0, 80) : '';
  }

  function stats(doc, pages) {
    const s = { pages: pages.length, fragments: 0, lines: 0, paragraphs: 0, headings: 0, listItems: 0, tables: 0, pictures: 0, links: 0, columns: 1, tabbed: 0, headers: doc.header.length + doc.footer.length, rotated: 0 };
    for (const p of pages) { s.fragments += p.frags.length + (p.removed || 0); s.links += p.links.length; s.rotated += p.rotated.length; }
    const countP = (b) => {
      s.paragraphs++; s.lines += b.lines.length;
      if (b.heading) s.headings++;
      if (b.list) s.listItems++;
      if (b.lines.some((l) => l.parts) || b.leader) s.tabbed++;
    };
    for (const b of doc.blocks) {
      if (b.type === 'p') countP(b);
      else if (b.type === 'table') { s.tables++; for (const c of b.cells) for (const q of c.blocks) { if (q.type === 'p') countP(q); else if (q.type === 'img') s.pictures++; } }
      else if (b.type === 'img') s.pictures++;
    }
    for (const lp of doc.laid) for (const band of lp.bands) if (band.kind === 'cols') s.columns = Math.max(s.columns, band.cols.length);
    return s;
  }

  function cloneForAnalysis(pages) {
    return pages.map((p) => ({
      ...p,
      frags: p.frags.map((f) => ({ ...f })),
      rules: p.rules.map((r) => ({ ...r })),
      fills: p.fills.map((f) => ({ ...f })),
      bullets: p.bullets.map((b) => ({ ...b })),
      images: p.images.map((i) => ({ ...i })),
    }));
  }

  /* Geometry for the on-screen x-ray: everything the analysis found, per page. */
  function overlayFor(doc, session) {
    const out = session.pages.map((p) => ({ num: p.num, w: p.w, h: p.h, rotation: p.rotation, frags: [], rotated: p.rotated.map((r) => ({ x: r.x, y: r.y, fs: r.fs, s: r.s })), lines: [], paras: [], tables: [], images: [], gutters: [] }));
    session.pages.forEach((p, i) => {
      for (const f of p.frags) out[i].frags.push({ x0: f.x0, y0: f.top, x1: f.x1, y1: f.bot, base: f.base, fs: f.fs, s: Layout.cleanText(f.s), bg: f.bg || '#ffffff', bold: f.bold });
    });
    const addLine = (l) => { const o = out[l.page - 1]; if (o) o.lines.push({ x0: l.x0, y0: l.top, x1: l.x1, y1: l.bot, base: l.base }); };
    const addPara = (p, inTable, id) => {
      const byPage = new Map();
      for (const l of p.lines) { addLine(l); if (!byPage.has(l.page)) byPage.set(l.page, []); byPage.get(l.page).push(l); }
      const kind = p.heading ? (p.heading === 'title' ? 'T' : 'H' + p.heading) : p.list ? 'LI' : 'P';
      for (const [pg, ls] of byPage) {
        const o = out[pg - 1];
        if (!o) continue;
        o.paras.push({ id, x0: Math.min(...ls.map((l) => (p.marker && p.markerX != null && l === p.lines[0] ? Math.min(l.x0, p.markerX) : l.x0))), y0: Math.min(...ls.map((l) => l.top)), x1: Math.max(...ls.map((l) => l.x1)), y1: Math.max(...ls.map((l) => l.bot)), kind, inTable: !!inTable });
      }
    };
    doc.blocks.forEach((b, bi) => {
      if (b.type === 'p') addPara(b, false, bi);
      else if (b.type === 'table') {
        const byPage = new Map();
        for (const c of b.cells) { const pg = c.page || b.page; if (!byPage.has(pg)) byPage.set(pg, []); byPage.get(pg).push(c); }
        for (const [pg, cs] of byPage) {
          const o2 = out[pg - 1];
          if (o2) o2.tables.push({ id: bi, x0: Math.min(...cs.map((c) => c.x0)), y0: Math.min(...cs.map((c) => c.y0)), x1: Math.max(...cs.map((c) => c.x1)), y1: Math.max(...cs.map((c) => c.y1)), ruled: b.ruled, cells: cs.map((c) => ({ x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 })) });
        }
        const o = out[b.page - 1];
        for (const c of b.cells) for (const q of c.blocks) { if (q.type === 'p') addPara(q, true, bi); else if (q.type === 'img' && o) o.images.push({ id: bi, x0: q.x0, y0: q.top, x1: q.x1, y1: q.bot }); }
      } else if (b.type === 'img') {
        const o = out[b.page - 1];
        if (o) o.images.push({ id: bi, x0: b.x0, y0: b.top, x1: b.x1, y1: b.bot });
      }
    });
    doc.laid.forEach((lp, i) => {
      for (const band of lp.bands) {
        if (band.kind !== 'cols') continue;
        for (const g of band.gutters) out[i].gutters.push({ x0: g.x0, x1: g.x1, y0: band.top, y1: band.bot });
      }
    });
    return out;
  }

  /* Step 1: read the PDF (slow, done once). */
  async function open(data, options = {}, onProgress) {
    const t0 = performance.now();
    const pdf = await Extract.open(data, { askPassword: options.askPassword });
    if (onProgress) onProgress('open', 0, pdf.numPages, { pdf });
    const pages = await Extract.extractAll(pdf, { onProgress: (i, n) => onProgress && onProgress('read', i, n), keepCanvas: false });
    return { pdf, pages, numPages: pdf.numPages, readMs: performance.now() - t0 };
  }

  /* Step 2: analyse and write the Word file (fast, repeated when settings change). */
  const tick = () => new Promise((r) => setTimeout(r, 0));
  async function build(session, options = {}, onStage) {
    const t0 = performance.now();
    if (onStage) { onStage('build'); await tick(); }
    const pages = cloneForAnalysis(session.pages);
    const doc = Analyze.analyze(pages, options);
    doc.title = titleOf(doc);
    if (onStage) { onStage('write'); await tick(); }
    const blob = await Docx.toBlob(doc, options);
    return { doc, blob, stats: stats(doc, pages), ledger: ledger(pages, doc), overlay: overlayFor(doc, session), ms: performance.now() - t0 };
  }

  async function convert(data, options = {}, onProgress) {
    const session = await open(data, options, onProgress);
    if (onProgress) onProgress('analyse', 0, 1);
    const r = await build(session, options);
    return { ...r, pages: session.pages, session, numPages: session.numPages, ms: r.ms + session.readMs };
  }

  return { open, build, convert, stats, ledger, titleOf };
})();
