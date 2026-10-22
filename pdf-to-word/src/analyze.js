/* analyze.js: pages -> one document model (headings, lists, tables, pictures, spacing, margins). */
const Analyze = (() => {
  'use strict';
  const { median, sum } = Layout;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = (v) => Math.round(v * 10) / 10;

  const normKey = (s) => s.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const PAGE_NO = /^(?:[-–—\s]*(?:page|p\.|pg\.?)?\s*#+\s*(?:(?:of|\/)\s*#+)?[-–—\s]*)$/;

  function modeOf(values, weights, bin = 1.5) {
    const m = new Map();
    values.forEach((v, i) => { const k = Math.round(v / bin); m.set(k, (m.get(k) || 0) + (weights ? weights[i] : 1)); });
    let best = null, bw = -1;
    for (const [k, w] of m) if (w > bw) { best = k; bw = w; }
    return best === null ? 0 : best * bin;
  }

  /* ---------- headers, footers, page numbers ---------- */

  function detectHeaderFooter(pages, opts) {
    const n = pages.length;
    if (n < 2) return null;
    const info = [];
    const bodyKeys = new Set();
    for (const p of pages) {
      const frags = p.frags.filter((f) => f.s.trim()).map((f) => ({ ...f, s: Layout.cleanText(f.s) }));
      const rows = Layout.buildRows(p.frags.filter((f) => f.s.trim()));
      const cand = [];
      for (const r of rows) {
        const text = r.segs.map((s) => s.frags.map((f) => Layout.cleanText(f.s)).join(' ')).join(' ').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        const zone = r.base < p.h * 0.1 ? 'top' : r.base > p.h * 0.9 ? 'bottom' : null;
        if (!zone) { bodyKeys.add(normKey(text)); continue; }
        if (r.segs.length >= 4) continue;          // four or more cells in a row: a table header, not a running head
        cand.push({ row: r, text, key: normKey(text), zone, y: r.base });
      }
      info.push(cand);
    }
    const counts = new Map();
    info.forEach((cand, pi) => {
      for (const c of cand) {
        const k = c.zone + '|' + c.key;
        if (!counts.has(k)) counts.set(k, []);
        counts.get(k).push({ page: pi, c });
      }
    });
    const need = Math.max(2, Math.ceil(n * 0.4));
    const hits = new Map();
    for (const [k, arr] of counts) {
      const pagesHit = new Set(arr.map((a) => a.page));
      const pageNumberOnly = PAGE_NO.test(k.split('|')[1]) && /#/.test(k.split('|')[1]);
      if (pagesHit.size < need && !pageNumberOnly) continue;
      if (!pageNumberOnly && bodyKeys.has(k.split('|')[1])) continue;     // the same row also sits in the body of another page
      // same height on the pages it appears
      const ys = arr.map((a) => a.c.y);
      if (Math.max(...ys) - Math.min(...ys) > 8 && !PAGE_NO.test(k.split('|')[1])) continue;
      hits.set(k, arr);
    }
    if (!hits.size) return null;
    const remove = new Set();
    const header = [], footer = [];
    const done = new Set();
    for (const [k, arr] of hits) {
      const zone = k.split('|')[0];
      // representative: prefer a page after the first
      const rep = arr.find((a) => a.page > 0) || arr[0];
      for (const a of arr) for (const f of a.c.row.frags) remove.add(f);
      const row = rep.c.row;
      const dest = zone === 'top' ? header : footer;
      dest.push({ row, page: pages[rep.page], pageIndex: rep.page, text: rep.c.text, key: rep.c.key, y: rep.c.y, pagesHit: new Set(arr.map((a) => a.page)) });
    }
    // drop from the pages
    const origFrag = new Set();
    pages.forEach((p, pi) => {
      const rowsHere = info[pi];
      const kill = new Set();
      for (const c of rowsHere) if (hits.has(c.zone + '|' + c.key)) for (const f of c.row.frags) kill.add(f);
      p.removed = kill.size;
      p.frags = p.frags.filter((f) => !kill.has(f));
    });
    header.sort((a, b) => a.y - b.y); footer.sort((a, b) => a.y - b.y);
    const firstHas = (list) => list.some((x) => x.pagesHit.has(0));
    const diffFirst = !firstHas(header) && !firstHas(footer) && header.concat(footer).every((x) => x.pagesHit.size >= 0.7 * (n - 1));
    return { header, footer, diffFirst, total: n };
  }

  /* Replace page numbers by field codes. */
  function fieldize(runs, pageNum, total, key) {
    const pure = PAGE_NO.test(key);
    if (!pure && !/\bpage\b|\bof\b/.test(key)) return runs;
    const out = [];
    let seen = 0;
    for (const r of runs) {
      if (r.tab) { out.push(r); continue; }
      const parts = r.text.split(/(\d+)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^\d+$/.test(part)) {
          seen++;
          const v = +part;
          if (seen === 2 && v === total) { out.push({ ...r, text: String(v), field: 'NUMPAGES' }); continue; }
          if (seen === 1) { out.push({ ...r, text: String(v), field: 'PAGE' }); continue; }
        }
        out.push({ ...r, text: part });
      }
    }
    return out;
  }

  /* ---------- document analysis ---------- */

  function analyze(pages, options = {}) {
    const opts = { fixedPages: false, fixHyphens: true, headers: true, columns: true, tables: true, ...options };
    const total = pages.length;
    const scanned = pages.filter((p) => !p.frags.some((f) => f.s.trim()));
    const notes = [];

    const hf = opts.headers ? detectHeaderFooter(pages, opts) : null;
    const laid = pages.map((p) => Layout.layoutPage(p, opts));

    /* page text edges and body statistics */
    const allFlowLines = [];
    laid.forEach((lp, i) => {
      const lines = [];
      for (const b of lp.blocks) if (b.kind === 'flow') lines.push(...b.lines);
      lp.flowLines = lines;
      allFlowLines.push(...lines);
    });
    const sizeW = new Map();
    for (const l of allFlowLines) { const k = Math.round(l.fs * 2) / 2; sizeW.set(k, (sizeW.get(k) || 0) + l.chars); }
    for (const lp of laid) for (const b of lp.blocks) if (b.kind === 'table') for (const c of b.table.cells) for (const l of c.lines) { const k = Math.round(l.fs * 2) / 2; sizeW.set(k, (sizeW.get(k) || 0) + l.chars * 0.5); }
    let bodyFs = 11, bw = -1;
    for (const [k, w] of sizeW) if (w > bw) { bw = w; bodyFs = k; }
    const ratios = [];
    for (const lp of laid) for (const b of lp.blocks) if (b.kind === 'flow') {
      for (let i = 1; i < b.lines.length; i++) {
        const a = b.lines[i - 1], c = b.lines[i];
        if (Math.abs(a.fs - c.fs) < 0.3 && !a.parts && !c.parts) { const dy = c.base - a.base; if (dy > 0.85 * a.fs && dy < 1.9 * a.fs) ratios.push(dy / a.fs); }
      }
    }
    const leadingRatio = ratios.length ? median(ratios) : 1.2;

    const wq = (vals, wts, q) => {
      const idx = vals.map((v, i) => i).sort((i, j) => vals[i] - vals[j]);
      const tot = wts.reduce((x, y) => x + y, 0);
      let acc = 0;
      for (const i of idx) { acc += wts[i]; if (acc >= q * tot) return vals[i]; }
      return vals[idx[idx.length - 1]];
    };
    const pageStats = laid.map((lp) => {
      const all = lp.flowLines.filter((l) => l.chars >= 12);
      const use = all.length >= 3 ? all : lp.flowLines.filter((l) => l.chars >= 4);
      if (!use.length) return null;
      const w = use.map((l) => l.chars);
      return { left: wq(use.map((l) => l.x0), w, 0.05), right: wq(use.map((l) => l.x1), w, 0.95) };
    });
    // a table that is wider than the text pulls the margins out to meet it
    laid.forEach((lp, i) => {
      const tb = lp.blocks.filter((b) => b.kind === 'table').map((b) => b.table);
      if (!tb.length) return;
      const lo = Math.min(...tb.map((t) => t.x0)), hi = Math.max(...tb.map((t) => t.x1));
      if (!pageStats[i]) { pageStats[i] = { left: lo, right: hi }; return; }
      // borders sit a cell-padding outside the text; only a table that really overhangs moves the margin
      const OVER = 12;
      if (lo < pageStats[i].left - OVER) pageStats[i].left = lo;
      if (hi > pageStats[i].right + OVER) pageStats[i].right = hi;
    });
    const known = pageStats.filter(Boolean);
    const noText = !known.length && pages.some((p) => p.images.length);
    const gLeft = known.length ? median(known.map((s) => s.left)) : noText ? 18 : 72;
    const gRight = known.length ? median(known.map((s) => s.right)) : (pages[0] ? pages[0].w - (noText ? 18 : 72) : 540);
    pageStats.forEach((s, i) => { if (!s) pageStats[i] = { left: gLeft, right: gRight }; });
    const ctx = { leadingRatio, bodyFs };

    /* paragraphs and blocks in reading order */
    const items = [];
    const tableDefs = [];
    laid.forEach((lp, pi) => {
      const st = pageStats[pi];
      for (const b of lp.blocks) {
        if (b.kind === 'flow') {
          let ref;
          if (b.col) {
            ref = { left: modeOf(b.lines.map((l) => l.x0), b.lines.map((l) => l.chars)), right: Math.max(...b.lines.map((l) => l.x1)) };
            const longs = b.lines.filter((l) => l.chars >= 30);
            if (longs.length >= 3) ref.right = modeOf(longs.map((l) => l.x1).filter((x) => x >= Math.max(...longs.map((l) => l.x1)) - 12), null, 1.5) || ref.right;
            ref.right = Math.max(ref.right, ...b.lines.filter((l) => l.chars >= 30).map((l) => l.x1).sort((a, c) => c - a).slice(0, 1));
          } else ref = { left: st.left, right: st.right };
          const paras = Text.buildParagraphs(b.lines, ref, ctx, { fixHyphens: opts.fixHyphens });
          for (const p of paras) { p.block = b; p.colIndex = b.colIndex; p.columns = b.columns || 1; items.push(p); }
        } else if (b.kind === 'table') {
          const t = buildTable(b.table, b.col ? { left: b.col.x0, right: b.col.x1 } : st, ctx, opts, lp.num);
          t.page = lp.num; items.push(t);
        } else if (b.kind === 'image') {
          const im = b.img;
          items.push({ type: 'img', page: lp.num, img: im, x0: im.x0, x1: im.x1, top: im.y0, bot: im.y1, ref: { left: st.left, right: st.right } });
        }
      }
    });

    /* join paragraphs that continue across a column or page break */
    const merged = [];
    for (const it of items) {
      const prev = merged[merged.length - 1];
      if (!opts.fixedPages && prev && prev.type === 'p' && it.type === 'p' && canContinue(prev, it, bodyFs)) {
        const lines = prev.lines.concat(it.lines);
        const p = Text.rebuild(lines, prev.ref, ctx, opts, prev.justified);
        p.block = prev.block; p.colIndex = prev.colIndex; p.columns = prev.columns;
        p.pieces = (prev.pieces || [prev]).concat(it.pieces || [it]);
        p.joined = true;
        merged[merged.length - 1] = p;
        continue;
      }
      merged.push(it);
    }
    items.length = 0; items.push(...merged);

    /* a table that runs over a page break is one table */
    mergeTables(items, pages);
    for (const it of items) if (it.type === 'table') fitColumns(it);

    /* headings and title */
    classifyHeadings(items, bodyFs, laid);
    /* lists */
    groupLists(items);
    for (const it of items) if (it.type === 'table') for (const c of it.cells) groupLists(c.blocks);

    /* shading and rules around paragraphs */
    decorate(items, pages, laid);

    /* spacing, indent */
    computeSpacing(items, ctx, bodyFs, opts);

    /* header and footer paragraphs */
    let header = [], footer = [];
    if (hf) {
      const mk = (list, zone) => list.map((h) => {
        const lp = h.page;
        const st = pageStats[h.pageIndex];
        const line = Layout.rowToLine(h.row, h.row.segs, lp.num);
        const ref = { left: st.left, right: st.right };
        const ps = Text.buildParagraphs([line], ref, ctx, { fixHyphens: false });
        const p = ps[0];
        p.runs = fieldize(p.runs, lp.num, total, h.key);
        return { p, y: h.y };
      });
      header = mk(hf.header, 'top'); footer = mk(hf.footer, 'bottom');
    }

    /* page setup: one section per run of equally sized pages */
    const p0 = pages[0] || { w: 612, h: 792 };
    const sameSize = (p, q) => Math.abs(p.w - q.w) < 3 && Math.abs(p.h - q.h) < 3;
    const groups = [];
    pages.forEach((p, i) => {
      const g = groups[groups.length - 1];
      if (g && sameSize(pages[g.pages[0]], p)) g.pages.push(i); else groups.push({ pages: [i] });
    });
    const hdrBottom = header.length ? Math.max(...hf.header.map((h) => h.row.bot)) : 0;
    const marginsFor = (idx, pw, ph) => {
      const edgeTop = [], edgeBot = [], lefts = [], rights = [];
      for (const i of idx) {
        const lp = laid[i];
        const els = [];
        for (const b of lp.blocks) {
          if (b.kind === 'flow') els.push(...b.lines.map((l) => [l.top, l.bot]));
          else if (b.kind === 'table') els.push([b.table.y0, b.table.y1]);
          else if (b.kind === 'image') els.push([b.img.y0, b.img.y1]);
        }
        if (els.length) { edgeTop.push(Math.min(...els.map((e) => e[0]))); edgeBot.push(lp.h - Math.max(...els.map((e) => e[1]))); }
        lefts.push(pageStats[i].left); rights.push(pageStats[i].right);
      }
      const m = {
        l: clamp(median(lefts), 18, pw * 0.4), r: clamp(pw - median(rights), 18, pw * 0.4),
        t: clamp(edgeTop.length ? Math.min(...edgeTop) : 72, 24, 72), b: clamp(edgeBot.length ? Math.min(...edgeBot) : 72, 36, 72),
      };
      if (header.length) m.t = Math.max(m.t, hdrBottom + 4);
      return m;
    };
    const sections = groups.map((g) => ({ pages: g.pages, w: pages[g.pages[0]].w, h: pages[g.pages[0]].h, margins: marginsFor(g.pages, pages[g.pages[0]].w, pages[g.pages[0]].h) }));
    const margins = sections[0].margins;
    const hdrDist = header.length ? clamp(Math.min(...hf.header.map((h) => h.row.top)), 6, margins.t) : 36;
    const ftrDist = footer.length ? clamp(p0.h - Math.max(...hf.footer.map((h) => h.row.bot)), 6, margins.b) : 36;

    // pages that end early (cover pages, contents, chapter ends) keep their page break
    const lastBot = laid.map((lp) => {
      let m = 0;
      for (const b of lp.blocks) {
        if (b.kind === 'flow') for (const l of b.lines) m = Math.max(m, l.bot);
        else if (b.kind === 'table') m = Math.max(m, b.table.y1);
        else if (b.kind === 'image') m = Math.max(m, b.img.y1);
      }
      return m;
    });
    if (!opts.fixedPages) {
      const secOf = (pg) => sections.find((s) => s.pages.includes(pg - 1)) || sections[0];
      for (let i = 1; i < items.length; i++) {
        if (items[i].page === items[i - 1].page || items[i].joined) continue;
        const prevPage = items[i - 1].page;
        const sec = secOf(prevPage);
        const usable = sec.h - sec.margins.t - sec.margins.b;
        const bot = lastBot[prevPage - 1];
        if (bot && (sec.h - sec.margins.b) - bot > 0.28 * usable && items[i].page > prevPage) items[i].pageBreak = true;
      }
    }
    if (items.length) {
      const f0 = items[0];
      const gap = Math.round(f0.top - margins.t);
      if (gap > 2) f0.before = Math.max(f0.before || 0, gap);
    }
    const doc = {
      page: { w: p0.w, h: p0.h, margins, hdrDist, ftrDist },
      sections, header, footer, diffFirst: !!(hf && hf.diffFirst),
      blocks: items, bodyFs, leadingRatio,
      pagesInfo: pages.map((p) => ({ w: p.w, h: p.h })),
      scannedPages: scanned.map((p) => p.num),
      notes,
    };
    doc.laid = laid;
    return doc;
  }

  /* ---------- continuation across a column or page ---------- */

  function canContinue(a, b, bodyFs) {
    if (a.page === b.page && a.block === b.block) return false;
    if (a.marker && !a.lines.length) return false;
    if (b.marker) return false;
    if (a.lines.some((l) => l.parts) || b.lines.some((l) => l.parts)) return false;
    if (a.leader || b.leader) return false;
    if (Math.abs(a.fs - b.fs) > 0.12 * a.fs) return false;
    if (Math.abs(a.fs - bodyFs) > 0.15 * bodyFs) return false;
    if (a.bold > 0.7 !== b.bold > 0.7) return false;
    const aText = a.lines[a.lines.length - 1].text, bText = b.lines[0].text;
    const wrapped = !/[.!?:;"”)\]…]$/.test(aText) || /-$/.test(aText);
    const lowerStart = /^[a-zß-ɏ0-9(\[]/.test(bText);
    if (!(wrapped && lowerStart)) return false;
    const last = a.lines[a.lines.length - 1];
    if (last.x1 < a.ref.left + 0.55 * (a.ref.right - a.ref.left)) return false;
    if (b.firstX - b.ref.left > 0.9 * b.fs + (a.restX - a.ref.left)) return false;
    return true;
  }

  /* ---------- tables across pages ---------- */

  function cellText(c) { return c.blocks.filter((b) => b.type === 'p').map((b) => b.lines.map((l) => l.text).join(' ')).join(' ').trim(); }

  /* An unruled table has no drawn column edges to respect. Short text that wrapped only because its
     column was narrow gets the room back from columns that have more than they use. */
  function fitColumns(t) {
    if (t.ruled || t.C < 2) return;
    const C = t.C, FIT = 1.06, pad = 2 * t.padL + 2;
    const w = [], natural = new Array(C).fill(0), joined = new Array(C).fill(0);
    for (let c = 0; c < C; c++) w.push(t.xs[c + 1] - t.xs[c]);
    for (const cell of t.cells) {
      if (cell.c1 - cell.c0 !== 1) continue;
      for (const b of cell.blocks) {
        if (b.type !== 'p' || !b.lines.length) continue;
        const lw = b.lines.map((l) => l.x1 - l.x0);
        const widest = Math.max(...lw);
        const whole = sum(lw) + (lw.length - 1) * 0.28 * b.fs;
        natural[cell.c0] = Math.max(natural[cell.c0], widest);
        joined[cell.c0] = Math.max(joined[cell.c0], lw.length > 1 && lw.length <= 3 && whole <= 170 ? whole : widest);
      }
    }
    const grow = [], give = [];
    let need = 0, spare = 0;
    for (let c = 0; c < C; c++) {
      const want = joined[c] * FIT + pad, keep = natural[c] * FIT + pad;
      grow.push(Math.max(0, want - w[c]));
      give.push(grow[c] > 0 ? 0 : Math.max(0, w[c] - keep - 2));
      need += grow[c]; spare += give[c];
    }
    if (need < 1 || need > spare) return;
    const k = need / spare;
    const nw = w.map((x, c) => x + grow[c] - give[c] * k);
    const xs = [t.xs[0]];
    for (let c = 0; c < C; c++) xs.push(xs[c] + nw[c]);
    t.xs = xs;
  }

  function mergeTables(items, pages) {
    for (let i = 0; i + 1 < items.length; i++) {
      const t1 = items[i], t2 = items[i + 1];
      if (t1.type !== 'table' || t2.type !== 'table' || t2.page !== (t1.lastPage || t1.page) + 1 || t1.C !== t2.C) continue;
      const pg1 = pages[(t1.lastPage || t1.page) - 1], pg2 = pages[t2.page - 1];
      if (!pg1 || !pg2) continue;
      if (t2.top > 0.3 * pg2.h || (t1.lastBot || t1.bot) < 0.6 * pg1.h) continue;
      if (t1.xs.some((x, k) => Math.abs(x - t2.xs[k]) > (t1.ruled && t2.ruled ? 3 : 30))) continue;
      // a repeated header row is not repeated in Word: mark the first row as a header instead
      const row0 = (t) => t.cells.filter((c) => c.r0 === 0).sort((p, q) => p.c0 - q.c0).map(cellText).join('|');
      let skip = 0;
      if (row0(t1) && row0(t1) === row0(t2)) { skip = Math.max(...t2.cells.filter((c) => c.r0 === 0).map((c) => c.r1)); t1.headerRows = Math.max(t1.headerRows || 0, Math.max(...t1.cells.filter((c) => c.r0 === 0).map((c) => c.r1))); }
      const off = t1.R - skip;
      for (const c of t2.cells) {
        if (c.r0 < skip) continue;
        t1.cells.push({ ...c, r0: c.r0 + off, r1: c.r1 + off });
      }
      const base = t1.ys[t1.ys.length - 1];
      for (let r = skip; r < t2.R; r++) t1.ys.push(base + (t2.ys[r + 1] - t2.ys[skip]));
      t1.R = t1.ys.length - 1;
      t1.lastPage = t2.page; t1.lastBot = t2.bot;
      t1.cells.sort((p, q) => (p.r0 - q.r0) || (p.c0 - q.c0));
      items.splice(i + 1, 1);
      i--;
    }
  }

  /* ---------- headings ---------- */

  function classifyHeadings(items, bodyFs, laid) {
    const cand = [];
    items.forEach((p, idx) => {
      if (p.type !== 'p' || p.leader || p.mono) return;
      if (p.lines.some((l) => l.parts)) return;
      if (p.marker && p.marker.kind === 'num' && !p.marker.weak && (p.fs >= bodyFs * 1.12 || p.bold >= 0.85) && p.lines.length <= 3) { p.lines[0].noMarker = true; Text.remake(p); }
      if (p.marker) return;
      const nl = p.lines.length;
      const text = p.lines.map((l) => l.text).join(' ');
      if (nl > 3 || text.length > 160 || /[,;]$/.test(text)) return;
      const bigger = p.fs >= bodyFs * 1.12 && (p.bold >= 0.5 || p.fs >= bodyFs * 1.3);
      const boldOnly = p.bold >= 0.85 && p.fs >= bodyFs * 0.94 && text.length <= 110 && !/[.!?]$/.test(text);
      const capsOnly = p.caps && text.length <= 80 && p.fs >= bodyFs * 0.94 && p.bold >= 0.5 && nl <= 2;
      if (!(bigger || boldOnly || capsOnly)) return;
      if (bigger && /[.]$/.test(text) && text.split(' ').length > 14) return;
      p.hc = { bigger, size: Math.round(p.fs * 2) / 2 };
      cand.push({ p, idx });
    });
    if (!cand.length) return;
    if (cand.length > Math.max(12, 0.45 * items.filter((i) => i.type === 'p').length)) {
      // too many "headings": treat only the bigger ones as such
      cand.splice(0, cand.length, ...cand.filter((c) => c.p.hc.bigger));
    }
    const sizes = [...new Set(cand.filter((c) => c.p.hc.bigger).map((c) => c.p.hc.size))].sort((a, b) => b - a);
    // merge sizes closer than 6%
    const groups = [];
    for (const s of sizes) { const g = groups[groups.length - 1]; if (g && g.min / s < 1.06) { g.min = s; g.sizes.push(s); } else groups.push({ max: s, min: s, sizes: [s] }); }
    const levelOf = (s) => groups.findIndex((g) => g.sizes.includes(s)) + 1;
    // title: a single, much larger paragraph near the top of the first page
    let titleDone = false;
    const first = cand.find((c) => c.p.page === items.find((i) => i.type === 'p').page);
    if (groups.length && first) {
      const top = groups[0];
      const members = cand.filter((c) => c.p.hc.bigger && levelOf(c.p.hc.size) === 1);
      const nextSize = groups[1] ? groups[1].max : bodyFs;
      if (members.length === 1 && members[0].p.page === first.p.page && top.max >= 1.35 * nextSize && top.max >= 1.6 * bodyFs) {
        members[0].p.heading = 'title'; titleDone = true;
      }
    }
    const shift = titleDone ? 1 : 0;
    const depthOf = (p) => { const m = /^(\d+(?:\.\d+)*)\.?\s/.exec(p.lines[0].text); return m ? m[1].split('.').length : 0; };
    const minDepth = new Map();
    for (const c of cand) if (c.p.hc.bigger) { const k = levelOf(c.p.hc.size); const d = depthOf(c.p); if (d) minDepth.set(k, Math.min(minDepth.get(k) || 99, d)); }
    for (const c of cand) {
      if (c.p.heading) continue;
      let level;
      if (c.p.hc.bigger) level = levelOf(c.p.hc.size) - shift;
      else level = groups.length - shift + 1;
      if (c.p.hc.bigger) {
        const d = depthOf(c.p), base = minDepth.get(levelOf(c.p.hc.size));
        if (d && base && d > base) level = Math.min(level + d - base, 6);
      }
      c.p.heading = clamp(level, 1, 6);
    }
    // a "heading" followed by nothing but more headings at the very end of a doc is fine; a lone bold line that
    // ends a paragraph-like block is probably emphasis
    for (const c of cand) {
      const p = c.p;
      if (p.heading && p.heading !== 'title' && !p.hc.bigger) {
        const next = items[c.idx + 1];
        if (!next || next.type !== 'p' && next.type !== 'table') { if (p.chars < 6) p.heading = 0; }
      }
    }
  }

  /* ---------- lists ---------- */

  function groupLists(items) {
    const isItem = (p) => p && p.type === 'p' && p.marker && !p.heading;
    let listId = 0;
    let i = 0;
    while (i < items.length) {
      if (!isItem(items[i])) { i++; continue; }
      // gather consecutive items (allow continuation paragraphs that are indented text of the item)
      const run = [];
      let j = i;
      while (j < items.length && isItem(items[j])) { run.push(items[j]); j++; }
      // split run into lists by marker kind at the shallowest level
      const minX = Math.min(...run.map((p) => p.markerX));
      const lvlX = [...new Set(run.map((p) => Math.round(p.markerX / 4) * 4))].sort((a, b) => a - b);
      // merge levels closer than 7pt
      const levels = [];
      for (const x of lvlX) { const l = levels[levels.length - 1]; if (l !== undefined && x - l < 7) continue; levels.push(x); }
      const levelOf = (p) => { let k = 0; for (let q = 0; q < levels.length; q++) if (p.markerX >= levels[q] - 3.5) k = q; return Math.min(k, 7); };
      let cur = null;
      const lists = [];
      for (const p of run) {
        const lvl = levelOf(p);
        p.level = lvl;
        const top = lvl === 0;
        if (!cur || (top && (cur.kind !== p.marker.kind || (p.marker.kind === 'num' && (cur.fmt !== p.marker.fmt || (p.marker.value !== cur.last + 1)))) )) {
          cur = { id: ++listId, kind: p.marker.kind, fmt: p.marker.fmt, items: [], last: p.marker.value, levelsInfo: {} };
          lists.push(cur);
        }
        if (top && p.marker.kind === 'num') cur.last = p.marker.value;
        cur.items.push(p);
        if (!cur.levelsInfo[lvl]) cur.levelsInfo[lvl] = p.marker;
      }
      for (const L of lists) {
        const weakOnly = L.items.length === 1 && L.items[0].marker.kind === 'num' && (L.items[0].marker.weak || L.items[0].marker.value !== 1) && !(L.items[0].marker.value === 1 && false);
        if (L.items.length === 1 && L.items[0].marker.kind === 'num' && (L.items[0].marker.weak || L.items[0].marker.fmt !== 'decimal')) {
          for (const p of L.items) { p.lines[0].noMarker = true; Text.remake(p); }
          continue;
        }
        for (const p of L.items) p.list = L;
      }
      i = j;
    }
  }

  /* ---------- shading and borders ---------- */

  function decorate(items, pages, laid) {
    const byPage = new Map(pages.map((p) => [p.num, p]));
    for (const it of items) {
      if (it.type !== 'p') continue;
      const page = byPage.get(it.page);
      if (!page) continue;
      if (it.joined) continue;
      const w = it.x1 - it.x0, h = it.bot - it.top;
      let pick = null;
      for (const f of page.fills) {
        const fw = f.x1 - f.x0, fh = f.y1 - f.y0;
        if (fw * fh > 0.7 * page.w * page.h) continue;
        if (f.x0 <= it.x0 + 2 && f.x1 >= it.x1 - 2 && f.y0 <= it.top + 2 && f.y1 >= it.bot - 2 && fw < page.w * 0.97) pick = f;
      }
      if (pick && pick.color.toLowerCase() !== '#ffffff') it.shade = pick.color;
    }
    // rules just under (or over) a paragraph become paragraph borders
    const taken = new Set();
    for (const lp of laid) {
      const page = byPage.get(lp.num);
      const ps = items.filter((p) => p.type === 'p' && p.page === lp.num && !p.joined);
      for (const r of page.rules.filter((q) => !q.h && q.y1 - q.y0 >= 8)) {
        if (lp.tables.some((t) => r.x >= t.x0 - 4 && r.x <= t.x1 + 4 && r.y0 >= t.y0 - 4 && r.y1 <= t.y1 + 4)) continue;
        let best = null;
        for (const p of ps) {
          if (r.x > p.x0 + 1 || r.x < p.x0 - 16) continue;
          const ov = Math.min(r.y1, p.bot) - Math.max(r.y0, p.top);
          if (ov >= 0.6 * (p.bot - p.top) && r.y1 - r.y0 <= (p.bot - p.top) + 26) { best = p; break; }
        }
        if (best && !best.borderLeft) { best.borderLeft = { w: r.w, color: r.color, space: Math.max(0, best.x0 - r.x - r.w / 2) }; taken.add(r); }
      }
    }
    for (const lp of laid) {
      const page = byPage.get(lp.num);
      const inTable = (r) => lp.tables.some((t) => r.y >= t.y0 - 2 && r.y <= t.y1 + 2 && r.x0 >= t.x0 - 4 && r.x1 <= t.x1 + 4);
      const ps = items.filter((p) => p.type === 'p' && p.page === lp.num && !p.joined);
      for (const r of page.rules.filter((q) => q.h && q.x1 - q.x0 >= 40 && q.w <= 3.2)) {
        if (inTable(r) || taken.has(r)) continue;
        let best = null, bd = 1e9, where = 'b';
        for (const p of ps) {
          if (r.x0 > p.x1 + 4 || r.x1 < p.x0 - 4) continue;
          const db = r.y - p.bot, dt = p.top - r.y;
          if (db >= -3 && db <= 0.9 * p.fs && db < bd) { best = p; bd = db; where = 'b'; }
          if (dt >= -2 && dt <= 0.9 * p.fs && dt < bd) { best = p; bd = dt; where = 't'; }
        }
        if (best && r.x1 - r.x0 >= 0.4 * (best.ref.right - best.ref.left)) {
          if (where === 'b' && !best.borderBottom) { best.borderBottom = { w: r.w, color: r.color, space: clamp(r.y - best.bot, 0, 12) }; taken.add(r); }
          else if (where === 't' && !best.borderTop) { best.borderTop = { w: r.w, color: r.color, space: clamp(best.top - r.y, 0, 12) }; taken.add(r); }
        }
      }
    }
  }

  /* ---------- tables ---------- */

  function buildTable(t, st, ctx, opts, pageNum) {
    const R = t.ys.length - 1, C = t.xs.length - 1;
    // cell padding estimate
    const padsL = [], padsR = [], padsT = [], padsB = [];
    for (const c of t.cells) {
      if (!c.lines.length) continue;
      padsL.push(Math.min(...c.lines.map((l) => l.x0)) - c.x0);
      padsT.push(Math.min(...c.lines.map((l) => l.top)) - c.y0);
      padsB.push(c.y1 - Math.max(...c.lines.map((l) => l.bot)));
      padsR.push(c.x1 - Math.max(...c.lines.map((l) => l.x1)));
    }
    const q25 = (v) => { const s = v.filter((x) => x >= 0).sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) * 0.25)] : 0; };
    const padL = clamp(q25(padsL) || 4, 1, 14);
    const padT = clamp(q25(padsT) - 1, 0, 10), padB = clamp(q25(padsB) - 1, 0, 10);
    // numbers line up on their right edge, labels on their left: decide once per column from the cells that agree
    const colAlign = new Map();
    for (let col = 0; col < C; col++) {
      const ls = [];
      for (const c of t.cells) {
        if (c.c0 !== col || c.c1 !== col + 1) continue;
        for (const l of c.lines) if (l.chars >= 1 && !l.parts) ls.push(l);
      }
      if (ls.length < 3) continue;
      const sd = (v) => { const m = v.reduce((x, y) => x + y, 0) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - m) * (y - m), 0) / v.length); };
      const sl = sd(ls.map((l) => l.x0)), sr = sd(ls.map((l) => l.x1)), sc = sd(ls.map((l) => (l.x0 + l.x1) / 2));
      const best = Math.min(sl, sr, sc);
      if (best > 2.2) continue;
      if (Math.max(sl, sr, sc) - best < 1) continue;       // equal-width cells: the edges can't say which side they hug
      colAlign.set(col, best === sl ? 'left' : best === sr ? 'right' : 'center');
    }
    const cells = t.cells.map((c) => {
      const ref = { left: c.x0 + padL, right: c.x1 - padL };
      const cellFn = (p) => {
        if (c.c1 - c.c0 === 1 && colAlign.has(c.c0) && p.lines.length === 1 && !p.lines[0].parts) {
          const al = colAlign.get(c.c0);
          const gl = p.nx0 - c.x0, gr = c.x1 - p.nx1;
          // a cell that clearly sits on the other side keeps its own alignment (a header over numbers, say)
          if (al === 'right' && gr > gl + 12) return null;
          if (al === 'left' && gl > gr + 12) return null;
          return al;
        }
        if (p.lines.length > 1 && (p.lines.every((l) => l.x1 > ref.right - 3) || Math.max(...p.lines.map((l) => l.x0)) - Math.min(...p.lines.map((l) => l.x0)) <= 4)) return null;
        const gl = p.x0 - c.x0, gr = c.x1 - p.x1;
        if (Math.abs(gl - gr) <= 3.5 && gl > padL + 5) return 'center';
        if (gr <= padL + 5 && gl > padL + 7) return 'right';
        return null;
      };
      const paras = Text.buildParagraphs(c.lines, ref, ctx, { cell: cellFn, fixHyphens: opts.fixHyphens, noJustify: true });
      const blocks = [...paras];
      for (const im of c.images) blocks.push({ type: 'img', page: pageNum, img: im, x0: im.x0, x1: im.x1, top: im.y0, bot: im.y1, ref });
      blocks.sort((a, b) => (a.top - b.top));
      // vertical alignment
      let valign = 'top';
      if (c.lines.length) {
        const tt = Math.min(...c.lines.map((l) => l.top)) - c.y0, bb = c.y1 - Math.max(...c.lines.map((l) => l.bot));
        const textH = Math.max(...c.lines.map((l) => l.bot)) - Math.min(...c.lines.map((l) => l.top));
        const H = c.y1 - c.y0;
        if (H > textH * 1.35 && Math.abs(tt - bb) <= 0.12 * H && tt > 3) valign = 'center';
        else if (H > textH * 1.35 && tt > Math.max(8, bb * 2.5)) valign = 'bottom';
      }
      return { ...c, blocks, valign, ref };
    });
    cells.forEach((c) => { c.page = pageNum; });
    return { type: 'table', ruled: t.ruled, xs: t.xs, ys: t.ys, R, C, cells, padL, padT, padB, x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1, top: t.y0, bot: t.y1, ref: { left: st.left, right: st.right } };
  }

  /* ---------- spacing ---------- */

  function spacingFor(blocks, ctx, firstOnPage) {
    let prev = null;
    for (const b of blocks) {
      if (b.type === 'p') {
        if (!b.pieces) b.pieces = [b];
        const own = b.leading || 0;
        const lead = own || b.fs * ctx.leadingRatio;
        b.lineHeight = own ? own : 0;
        let before = 0;
        const samePage = prev && (prev.page === b.page);
        if (prev && samePage && prev.type === 'p' && prev.lastBase < b.firstBase) {
          before = b.firstBase - prev.lastBase - lead;
        } else if (prev && samePage && (prev.type === 'table' || prev.type === 'img') && prev.bot < b.top) {
          before = b.top - prev.bot - 1;
        }
        b.before = before >= 1.5 ? Math.round(Math.min(before, 120)) : 0;
        if (prev && prev.type === 'p' && prev.page === b.page && b.before === 0 && prev.lastBase >= b.firstBase) b.before = 0;
      } else if (b.type === 'img') {
        let before = 0;
        if (prev && prev.page === b.page && prev.type === 'p' && b.top > prev.bot) before = b.top - prev.bot - 2;
        else if (prev && prev.page === b.page && (prev.type === 'img' || prev.type === 'table') && b.top > prev.bot) before = b.top - prev.bot;
        b.before = before >= 1.5 ? Math.round(Math.min(before, 120)) : 0;
      } else if (b.type === 'table') {
        let before = 0;
        if (prev && prev.page === b.page && prev.type === 'p' && b.top > prev.bot) before = b.top - prev.bot - 2;
        b.before = before >= 3 ? Math.round(Math.min(before, 120)) : 0;
      }
      prev = b;
    }
  }

  function computeSpacing(items, ctx, bodyFs, opts) {
    spacingFor(items, ctx);
    // a document that starts part-way down the page keeps that gap
    items.startGap = 0;
    for (const it of items) {
      if (it.type === 'table') {
        // spacing before a table lives in a thin paragraph in docx.js; inside cells compute per cell
        for (const c of it.cells) spacingFor(c.blocks, ctx);
      }
    }
    // indents
    const setInd = (p) => {
      const ref = p.ref;
      let left = (p.restX - ref.left), first = (p.firstX - p.restX);
      if (p.marker && p.textX != null) { left = p.textX - ref.left; first = -(p.textX - p.markerX); }
      if (p.align === 'center' || p.align === 'right') { left = 0; first = 0; }
      let right = 0;
      if (p.align === 'left' || p.align === 'both') {
        const gap = ref.right - (p.nx1 !== undefined ? p.nx1 : p.x1);
        if (p.lines.length >= 3 && gap > 18) right = gap;
      }
      p.ind = { left: Math.max(0, left), first: Math.abs(first) < 1 ? 0 : first, right };
      if (p.ind.left < 0.5) p.ind.left = 0;
      if (p.ind.left + p.ind.first < 0) { p.ind.first = -p.ind.left; }
    };
    for (const it of items) {
      if (it.type === 'p') setInd(it);
      else if (it.type === 'table') for (const c of it.cells) for (const b of c.blocks) if (b.type === 'p') setInd(b);
    }
  }

  return { analyze, detectHeaderFooter };
})();
