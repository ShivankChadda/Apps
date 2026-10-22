/* extract.js: read geometry out of a PDF with pdf.js.
 *
 * For every page this produces plain data (no pdf.js objects), all in "page points" with the
 * origin at the top-left corner and y growing downwards:
 *   frags    text runs with position, size, font traits and colour
 *   rules    horizontal and vertical lines (stroked lines and thin filled rectangles)
 *   fills    filled rectangles (cell shading, boxes)
 *   marks    other vector drawing (curves, diagonals) used to spot charts
 *   images   picture boxes, cropped from a render of the page
 *   links    link rectangles with their target address
 */
const Extract = (() => {
  'use strict';

  const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  const pt = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const rgbArg = (a) => hex(a[0], a[1], a[2]);
  const cmyk = (c, m, y, k) => hex(255 * (1 - Math.min(1, c + k)), 255 * (1 - Math.min(1, m + k)), 255 * (1 - Math.min(1, y + k)));

  /* ---------- fonts ---------- */

  const STYLE_WORDS = /(bold|black|heavy|semibold|demibold|extrabold|ultrabold|italic|oblique|regular|roman|light|medium|thin|book|condensed|narrow|ital|reg)$/i;
  const KNOWN = {
    liberationserif: 'Times New Roman', tinos: 'Times New Roman', timesnewroman: 'Times New Roman', times: 'Times New Roman', timesroman: 'Times New Roman',
    liberationsans: 'Arial', arimo: 'Arial', arial: 'Arial', helvetica: 'Arial', helveticaneue: 'Arial',
    liberationmono: 'Courier New', cousine: 'Courier New', couriernew: 'Courier New', courier: 'Courier New',
    carlito: 'Calibri', calibri: 'Calibri', caladea: 'Cambria', cambria: 'Cambria',
    dejavusans: 'DejaVu Sans', dejavuserif: 'DejaVu Serif', dejavusansmono: 'DejaVu Sans Mono',
    symbol: 'Symbol', zapfdingbats: 'Wingdings', wingdings: 'Wingdings',
    nimbusromnol: 'Times New Roman', nimbusrom: 'Times New Roman', nimbussanl: 'Arial', nimbussan: 'Arial', nimbusmonl: 'Courier New', nimbusmon: 'Courier New', nimbusmonops: 'Courier New',
    texgyretermes: 'Times New Roman', texgyreheros: 'Arial', texgyrecursor: 'Courier New', texgyrepagella: 'Palatino Linotype', termes: 'Times New Roman', heros: 'Arial',
    cmr: 'Times New Roman', cmbx: 'Times New Roman', cmti: 'Times New Roman', cmsl: 'Times New Roman', cmmi: 'Times New Roman', cmss: 'Arial', cmtt: 'Courier New', cmcsc: 'Times New Roman',
    lmroman: 'Times New Roman', latinmodernroman: 'Times New Roman', lmsans: 'Arial', lmmono: 'Courier New',
    palatino: 'Palatino Linotype', palladio: 'Palatino Linotype', urwpalladiol: 'Palatino Linotype', bookman: 'Bookman Old Style', urwbookmanl: 'Bookman Old Style', newcenturyschlbk: 'Century Schoolbook', centuryschlbk: 'Century Schoolbook', c059: 'Century Schoolbook',
    avantgarde: 'Century Gothic', urwgothicl: 'Century Gothic', zapfchancery: 'Monotype Corsiva', utopia: 'Georgia',
    georgia: 'Georgia', verdana: 'Verdana', tahoma: 'Tahoma', trebuchetms: 'Trebuchet MS', palatinolinotype: 'Palatino Linotype', bookantiqua: 'Book Antiqua',
    garamond: 'Garamond', centurygothic: 'Century Gothic', comicsansms: 'Comic Sans MS', segoeui: 'Segoe UI', consolas: 'Consolas', lucidaconsole: 'Lucida Console',
  };

  function fontTraits(rawName, pdfFont, cssFamily) {
    let name = String(rawName || (pdfFont && pdfFont.name) || '').replace(/^[A-Z]{6}\+/, '');
    const low = name.toLowerCase();
    let bold = /bold|black|heavy|semibold|demibold|extrabold|ultrabold|\.b$|medi(?!um)|^cmbx|^cmssbx|bx\d/.test(low) || !!(pdfFont && pdfFont.bold);
    let italic = /italic|oblique|ital\b|-it$|,it$|^cmti|^cmsl|^cmmi|^cmssi/.test(low) || !!(pdfFont && pdfFont.italic);
    // family name: drop style suffixes, keep readable spaces
    let base = name.split(/[-,]/)[0].replace(/(PSMT|PS|MT)$/, '');
    let rest = name.split(/[-,]/).slice(1).join('');
    while (STYLE_WORDS.test(base) && base.length > 6 && !KNOWN[base.toLowerCase()]) base = base.replace(STYLE_WORDS, '');
    const key = base.toLowerCase().replace(/[^a-z]/g, '').replace(/^(cm[a-z]+)\d*$/, '$1');
    let family = KNOWN[key];
    if (!family) { const hit = Object.keys(KNOWN).find((k) => k.length >= 7 && key.startsWith(k)); if (hit) family = KNOWN[hit]; }
    if (!family) {
      family = base.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim();
      if (!family || /^g_d\d|^f\d+$/i.test(family)) family = '';
    }
    const mono = /mono|courier|consolas|typewriter|^cmtt|^lmmono/i.test(name) || !!(pdfFont && pdfFont.isMonospace) || /monospace/.test(cssFamily || '');
    const serif = /serif|times|georgia|garamond|cambria|palatino|minion|bookman|caladea|tinos|charter|nimbusrom|^cm(r|bx|ti|sl|mi)|lmroman|termes|utopia|century/i.test(name) && !/sans/i.test(name)
      || (!!(pdfFont && pdfFont.isSerifFont) && !/sans/i.test(name));
    if (!family) family = mono ? 'Courier New' : serif ? 'Times New Roman' : 'Arial';
    return { family, bold, italic, mono, serif, raw: name, extra: rest };
  }

  /* Letter-spaced text comes out of pdf.js as "I N C I D E N T"; put the letters back together. */
  let measureCtx = null;
  function unspace(f) {
    const toks = f.s.split(' ');
    if (toks.length < 4 || toks.filter((t) => t.length === 1).length < 0.8 * toks.length) return;
    const collapsed = toks.join('');
    if (!measureCtx) { try { measureCtx = document.createElement('canvas').getContext('2d'); } catch (e) { measureCtx = false; } }
    f.s = collapsed; f.letterSpaced = true;
    if (!measureCtx) return;
    f.fontCss = (f.bold ? 'bold ' : '') + (f.italic ? 'italic ' : '') + f.fs + 'px "' + f.face + '", sans-serif';
    measureCtx.font = f.fontCss;
    const w0 = measureCtx.measureText(collapsed).width;
    const ls = (f.x1 - f.x0 - w0) / Math.max(1, collapsed.length - 1);
    if (ls > 0.2 && ls < f.fs * 1.5) f.spacing = Math.round(ls * 10) / 10;
  }

  /* ---------- page extraction ---------- */

  /* Text that reads sideways on the whole page (a landscape page saved rotated): turn the page, then read it. */
  async function extractPage(pdf, num, opts = {}) {
    if (opts.autoRotate === false) return extractPageAt(pdf, num, opts);
    const page = await pdf.getPage(num);
    const vp = page.getViewport({ scale: 1 });
    let weights = { 0: 0, 90: 0, 180: 0, 270: 0 };
    try {
      const tc = await page.getTextContent();
      for (const it of tc.items) {
        if (typeof it.str !== 'string' || !it.str.trim()) continue;
        const m = mul(vp.transform, it.transform);
        const ang = Math.round(Math.atan2(-m[1], m[0]) * 180 / Math.PI / 90) * 90;
        weights[((ang % 360) + 360) % 360] += it.str.trim().length;
      }
    } catch (e) { /* fall back to the page as it is */ }
    const total = weights[0] + weights[90] + weights[180] + weights[270];
    let best = 0;
    for (const a of [90, 180, 270]) if (weights[a] > weights[best]) best = a;
    if (best !== 0 && total && weights[best] >= 0.7 * total) {
      const r = await extractPageAt(pdf, num, opts, ((page.rotate || 0) + best) % 360);
      r.warnings.push('The text on page ' + num + ' ran sideways, so the page was turned to read it.');
      return r;
    }
    return extractPageAt(pdf, num, opts);
  }

  async function extractPageAt(pdf, num, opts = {}, rotation) {
    const page = await pdf.getPage(num);
    const vp = page.getViewport(rotation === undefined ? { scale: 1 } : { scale: 1, rotation });
    const W = vp.width, H = vp.height;
    const OPS = pdfjsLib.OPS;
    const out = {
      num, w: W, h: H, frags: [], rotated: [], rules: [], fills: [], marks: [], bullets: [], images: [], links: [],
      warnings: [], rawChars: 0, rotation,
    };

    /* operator list: lines, fills, pictures */
    let opList = null;
    try { opList = await page.getOperatorList(); } catch (e) { out.warnings.push('Could not read drawing operators: ' + e.message); }
    if (opList) scanOperators(opList, vp, out, OPS);

    /* text */
    const tc = await page.getTextContent({ includeMarkedContent: false });
    const fontCache = {};
    const fontFor = (id) => {
      if (fontCache[id]) return fontCache[id];
      let pf = null;
      try { if (page.commonObjs.has(id)) pf = page.commonObjs.get(id); } catch (e) { /* not resolved */ }
      const st = tc.styles[id] || {};
      fontCache[id] = fontTraits(pf && pf.name, pf, st.fontFamily);
      fontCache[id].asc = typeof st.ascent === 'number' && st.ascent > 0.3 ? st.ascent : 0.85;
      fontCache[id].desc = typeof st.descent === 'number' && st.descent < 0 ? -st.descent : 0.2;
      return fontCache[id];
    };
    for (const it of tc.items) {
      if (typeof it.str !== 'string' || it.str === '' || !it.str.trim()) continue;
      const m = mul(vp.transform, it.transform);
      const fsy = Math.hypot(m[2], m[3]);
      const fsx = Math.hypot(m[0], m[1]);
      if (!(fsy > 0.5)) continue;
      const font = fontFor(it.fontName);
      const upright = m[3] < 0 && Math.abs(m[1]) < 0.03 * fsx && Math.abs(m[2]) < 0.03 * fsy;
      const width = (it.width || 0) * (vp.scale || 1);
      out.rawChars += it.str.replace(/\s/g, '').length;
      if (!upright) {
        const ang = Math.atan2(-m[1], m[0]) * 180 / Math.PI;
        out.rotated.push({ s: it.str, x: m[4], y: m[5], fs: fsy, angle: ang, w: width });
        continue;
      }
      const frag = {
        s: it.str, x0: m[4], x1: m[4] + width, base: m[5], fs: fsy,
        top: m[5] - font.asc * fsy, bot: m[5] + font.desc * fsy,
        bold: font.bold, italic: font.italic, mono: font.mono, serif: font.serif, face: font.family,
        color: null, page: num,
      };
      unspace(frag);
      out.frags.push(frag);
    }

    /* links */
    try {
      const ann = await page.getAnnotations({ intent: 'display' });
      for (const a of ann) {
        const url = a.url || a.unsafeUrl;
        if (a.subtype !== 'Link' || !url || !a.rect) continue;
        const r = vp.convertToViewportRectangle(a.rect);
        out.links.push({ x0: Math.min(r[0], r[2]), x1: Math.max(r[0], r[2]), y0: Math.min(r[1], r[3]), y1: Math.max(r[1], r[3]), url });
      }
    } catch (e) { /* links are optional */ }

    findFigures(out);

    /* render once: colours of the text and crops of pictures */
    const needRender = out.frags.length || out.images.length;
    if (needRender && opts.render !== false) {
      try { await rasterise(page, vp, out, opts, rotation); } catch (e) { out.warnings.push('Could not render page ' + num + ': ' + e.message); }
    }
    if (typeof page.cleanup === 'function') page.cleanup();
    return out;
  }

  /* Walk the drawing operators keeping track of the transformation matrix. */
  function scanOperators(opList, vp, out, OPS) {
    const { fnArray: fn, argsArray: args } = opList;
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    let fill = '#000000', stroke = '#000000', lw = 1;
    let path = [];                       // list of subpaths, each {pts:[[x,y]...], closed, rect:[x,y,w,h]|null, curve:boolean}
    let cur = null;
    const W = vp.width, H = vp.height;
    const full = (m) => mul(vp.transform, m);
    const pushPath = () => { if (cur && cur.pts.length) path.push(cur); cur = null; };

    const sizeOf = (m) => Math.hypot(m[0], m[1]);

    const paintPath = (doFill, doStroke) => {
      pushPath();
      const M = full(ctm);
      const lwPt = lw * (sizeOf(M) || 1);
      for (const sp of path) {
        const P = sp.pts.map(([x, y]) => pt(M, x, y));
        const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const axis = (a, b) => Math.abs(a[0] - b[0]) < 0.6 || Math.abs(a[1] - b[1]) < 0.6;
        const isRect = sp.rect || (!sp.curve && P.length >= 4 && P.length <= 5 && P.every((p, i) => axis(p, P[(i + 1) % P.length])));
        if (isRect) {
          const w = x1 - x0, h = y1 - y0;
          if (doFill) {
            if (w < 0.1 && h < 0.1) continue;
            if (Math.min(w, h) <= 3 && Math.max(w, h) >= 5) {
              if (w >= h) out.rules.push({ h: true, x0, x1, y: (y0 + y1) / 2, w: Math.max(h, 0.3), color: fill });
              else out.rules.push({ h: false, y0, y1, x: (x0 + x1) / 2, w: Math.max(w, 0.3), color: fill });
            } else if (w >= 2 && h >= 2 && w <= 9 && h <= 9) {
              out.bullets.push({ x0, y0, x1, y1, shape: 'square', filled: true });
            } else if (w > 3 && h > 3 && !(w > W * 0.98 && h > H * 0.98)) {
              out.fills.push({ x0, y0, x1, y1, color: fill });
            }
          }
          if (doStroke && w > 0.5 && h > 0.5) {
            const c = stroke, t = Math.max(lwPt, 0.3);
            out.rules.push({ h: true, x0, x1, y: y0, w: t, color: c }, { h: true, x0, x1, y: y1, w: t, color: c },
              { h: false, y0, y1, x: x0, w: t, color: c }, { h: false, y0, y1, x: x1, w: t, color: c });
          } else if (doStroke) {
            const horizontal = w >= h;
            const len = Math.max(w, h);
            if (len >= 4) {
              if (horizontal) out.rules.push({ h: true, x0, x1, y: (y0 + y1) / 2, w: Math.max(lwPt, 0.3), color: stroke });
              else out.rules.push({ h: false, y0, y1, x: (x0 + x1) / 2, w: Math.max(lwPt, 0.3), color: stroke });
            }
          }
          continue;
        }
        // lines and polylines
        if (doStroke && !sp.curve) {
          let diag = false;
          for (let i = 0; i + 1 < P.length; i++) {
            const a = P[i], b = P[i + 1];
            const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
            if (dy < 0.6 && dx >= 4) out.rules.push({ h: true, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y: (a[1] + b[1]) / 2, w: Math.max(lwPt, 0.3), color: stroke });
            else if (dx < 0.6 && dy >= 4) out.rules.push({ h: false, y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]), x: (a[0] + b[0]) / 2, w: Math.max(lwPt, 0.3), color: stroke });
            else if (dx >= 0.6 && dy >= 0.6) diag = true;
          }
          if (diag) out.marks.push({ x0, y0, x1, y1 });
        } else if (sp.curve && x1 - x0 >= 2 && y1 - y0 >= 2 && x1 - x0 <= 9 && y1 - y0 <= 9 && Math.abs((x1 - x0) - (y1 - y0)) < 2) {
          out.bullets.push({ x0, y0, x1, y1, shape: doFill ? 'disc' : 'circle', filled: doFill });
        } else if (x1 - x0 > 1 || y1 - y0 > 1) {
          out.marks.push({ x0, y0, x1, y1, filled: doFill });
        }
      }
      path = []; cur = null;
    };

    for (let i = 0; i < fn.length; i++) {
      const f = fn[i], a = args[i];
      switch (f) {
        case OPS.save: stack.push({ ctm, fill, stroke, lw }); break;
        case OPS.restore: { const s = stack.pop(); if (s) ({ ctm, fill, stroke, lw } = s); break; }
        case OPS.transform: ctm = mul(ctm, a); break;
        case OPS.paintFormXObjectBegin:
          stack.push({ ctm, fill, stroke, lw });
          if (a && a[0]) ctm = mul(ctm, a[0]);
          break;
        case OPS.paintFormXObjectEnd: { const s = stack.pop(); if (s) ({ ctm, fill, stroke, lw } = s); break; }
        case OPS.setLineWidth: lw = a[0]; break;
        case OPS.setFillRGBColor: fill = rgbArg(a); break;
        case OPS.setStrokeRGBColor: stroke = rgbArg(a); break;
        case OPS.setFillGray: fill = hex(a[0] * 255, a[0] * 255, a[0] * 255); break;
        case OPS.setStrokeGray: stroke = hex(a[0] * 255, a[0] * 255, a[0] * 255); break;
        case OPS.setFillCMYKColor: fill = cmyk(a[0], a[1], a[2], a[3]); break;
        case OPS.setStrokeCMYKColor: stroke = cmyk(a[0], a[1], a[2], a[3]); break;
        case OPS.setGState:
          for (const kv of a[0] || []) if (kv[0] === 'LW') lw = kv[1];
          break;
        case OPS.constructPath: {
          const ops = a[0], c = a[1];
          let k = 0;
          for (const op of ops) {
            if (op === OPS.moveTo) { pushPath(); cur = { pts: [[c[k], c[k + 1]]], closed: false, rect: null, curve: false }; k += 2; }
            else if (op === OPS.lineTo) { if (!cur) cur = { pts: [[c[k], c[k + 1]]], curve: false }; else cur.pts.push([c[k], c[k + 1]]); k += 2; }
            else if (op === OPS.curveTo) { if (cur) { cur.pts.push([c[k + 4], c[k + 5]]); cur.curve = true; } k += 6; }
            else if (op === OPS.curveTo2 || op === OPS.curveTo3) { if (cur) { cur.pts.push([c[k + 2], c[k + 3]]); cur.curve = true; } k += 4; }
            else if (op === OPS.closePath) { if (cur) cur.closed = true; }
            else if (op === OPS.rectangle) {
              pushPath();
              const x = c[k], y = c[k + 1], w = c[k + 2], h = c[k + 3];
              path.push({ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true, rect: [x, y, w, h], curve: false });
              k += 4;
            }
          }
          break;
        }
        case OPS.stroke: paintPath(false, true); break;
        case OPS.closeStroke: paintPath(false, true); break;
        case OPS.fill: case OPS.eoFill: paintPath(true, false); break;
        case OPS.fillStroke: case OPS.eoFillStroke: case OPS.closeFillStroke: case OPS.closeEOFillStroke: paintPath(true, true); break;
        case OPS.endPath: case OPS.clip: case OPS.eoClip: path = []; cur = null; break;
        case OPS.paintImageXObject: case OPS.paintInlineImageXObject: case OPS.paintImageMaskXObject: {
          const M = full(ctm);
          const c = [pt(M, 0, 0), pt(M, 1, 0), pt(M, 0, 1), pt(M, 1, 1)];
          const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
          out.images.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), mask: f === OPS.paintImageMaskXObject });
          break;
        }
        default: break;
      }
    }
  }

  /* Charts and diagrams are made of loose vector shapes. Find the clusters, keep each one as a picture,
     and leave its labels out of the text. */
  /* the box a piece of rotated text covers */
  function rotSpan(r) {
    const a = ((Math.round(r.angle / 90) * 90) % 360 + 360) % 360;
    if (a === 90) return { x0: r.x - r.fs, x1: r.x + 2, y0: r.y - r.w, y1: r.y };
    if (a === 270) return { x0: r.x - 2, x1: r.x + r.fs, y0: r.y, y1: r.y + r.w };
    if (a === 180) return { x0: r.x - r.w, x1: r.x, y0: r.y - r.fs, y1: r.y + 2 };
    return { x0: r.x, x1: r.x + r.w, y0: r.y - r.fs, y1: r.y + 2 };
  }

  function findFigures(out) {
    const W = out.w, H = out.h;
    const els = [];
    for (const m of out.marks) els.push({ box: m, kind: 'mark' });
    for (const s of out.bullets) els.push({ box: s, kind: 'dot' });
    for (const f of out.fills) {
      const w = f.x1 - f.x0, h = f.y1 - f.y0;
      if (w > 0.3 * W || h > 0.4 * H || w < 2.5 || h < 2.5) continue;
      els.push({ box: f, kind: 'fill' });
    }
    if (els.length < 4 || els.length > 2500) return;
    const parent = els.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const G = 26;
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const a = els[i].box, b = els[j].box;
        if (a.x0 - G <= b.x1 && b.x0 - G <= a.x1 && a.y0 - G <= b.y1 && b.y0 - G <= a.y1) parent[find(i)] = find(j);
      }
    }
    const groups = new Map();
    els.forEach((e, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(e); });
    const found = [];
    for (const g of groups.values()) {
      const marks = g.filter((e) => e.kind === 'mark'), fills = g.filter((e) => e.kind === 'fill'), dots = g.filter((e) => e.kind === 'dot');
      const bx = { x0: Math.min(...g.map((e) => e.box.x0)), y0: Math.min(...g.map((e) => e.box.y0)), x1: Math.max(...g.map((e) => e.box.x1)), y1: Math.max(...g.map((e) => e.box.y1)) };
      const w = bx.x1 - bx.x0, h = bx.y1 - bx.y0;
      if (w < 60 || h < 40 || w > 0.97 * W && h > 0.9 * H) continue;
      let ok = marks.length >= 3 || (marks.length >= 1 && dots.length >= 4);
      if (!ok && fills.length >= 5) {
        const hs = fills.map((e) => e.box.y1 - e.box.y0), ws = fills.map((e) => e.box.x1 - e.box.x0);
        const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
        const sd = (a) => Math.sqrt(mean(a.map((v) => (v - mean(a)) ** 2)));
        const varied = sd(hs) > 0.15 * mean(hs) || sd(ws) > 0.15 * mean(ws);
        let touching = 0;
        for (const e of fills) if (fills.some((o) => o !== e && Math.abs(o.box.x0 - e.box.x1) < 1.2 && o.box.y0 < e.box.y1 && o.box.y1 > e.box.y0)) touching++;
        ok = varied && touching < 0.5 * fills.length;
      }
      if (!ok) continue;
      found.push(bx);
    }
    // axes and gridlines belong to the chart; so do short labels set smaller than the body text
    const sizes = new Map();
    for (const f of out.frags) { const k = Math.round(f.fs * 2) / 2; sizes.set(k, (sizes.get(k) || 0) + f.s.length); }
    let body = 11, bw = -1;
    for (const [k, v] of sizes) if (v > bw) { bw = v; body = k; }
    for (const bx of found) {
      for (let pass = 0; pass < 3; pass++) {
        for (const r of out.rules) {
          const rb = r.h ? { x0: r.x0, x1: r.x1, y0: r.y - 1, y1: r.y + 1 } : { x0: r.x - 1, x1: r.x + 1, y0: r.y0, y1: r.y1 };
          if (rb.x0 <= bx.x1 + 16 && rb.x1 >= bx.x0 - 16 && rb.y0 <= bx.y1 + 16 && rb.y1 >= bx.y0 - 16 && (rb.x1 - rb.x0) < 0.6 * W && (rb.y1 - rb.y0) < 0.5 * H) {
            bx.x0 = Math.min(bx.x0, rb.x0); bx.x1 = Math.max(bx.x1, rb.x1); bx.y0 = Math.min(bx.y0, rb.y0); bx.y1 = Math.max(bx.y1, rb.y1);
          }
        }
        const ex = 40;
        for (const f of out.frags) {
          const cx = (f.x0 + f.x1) / 2, cy = f.base - 0.3 * f.fs;
          const inside = cx >= bx.x0 && cx <= bx.x1 && cy >= bx.y0 && cy <= bx.y1;
          const near = f.x1 >= bx.x0 - ex && f.x0 <= bx.x1 + ex && f.bot >= bx.y0 - ex && f.top <= bx.y1 + ex;
          const label = f.s.length <= 28 && f.fs <= 0.95 * body && !/^(figure|fig\.|table|source|chart)\b/i.test(f.s.trim());
          if (inside || (near && label)) { bx.x0 = Math.min(bx.x0, f.x0 - 2); bx.x1 = Math.max(bx.x1, f.x1 + 2); bx.y0 = Math.min(bx.y0, f.top - 1); bx.y1 = Math.max(bx.y1, f.bot + 1); }
        }
        for (const r of out.rotated) {
          const sp = rotSpan(r);
          if (sp.x1 >= bx.x0 - ex && sp.x0 <= bx.x1 + ex && sp.y1 >= bx.y0 - ex && sp.y0 <= bx.y1 + ex) { bx.x0 = Math.min(bx.x0, sp.x0); bx.x1 = Math.max(bx.x1, sp.x1); bx.y0 = Math.min(bx.y0, sp.y0); bx.y1 = Math.max(bx.y1, sp.y1); }
        }
      }
    }
    for (const bx of found) {
      bx.x0 = Math.max(0, bx.x0 - 3); bx.y0 = Math.max(0, bx.y0 - 3); bx.x1 = Math.min(W, bx.x1 + 3); bx.y1 = Math.min(H, bx.y1 + 3);
      // text inside is part of the picture, but never a long paragraph
      const inFrags = out.frags.filter((f) => { const cx = (f.x0 + f.x1) / 2, cy = f.base - 0.3 * f.fs; return cx >= bx.x0 && cx <= bx.x1 && cy >= bx.y0 && cy <= bx.y1; });
      if (inFrags.some((f) => f.s.length > 90)) continue;
      out.rotated = out.rotated.filter((r) => { const sp = rotSpan(r); return !(sp.x0 >= bx.x0 - 2 && sp.x1 <= bx.x1 + 2 && sp.y0 >= bx.y0 - 2 && sp.y1 <= bx.y1 + 2); });
      out.images.push({ x0: bx.x0, y0: bx.y0, x1: bx.x1, y1: bx.y1, figure: true });
    }
  }

  /* Render the page once, then read text colours and crop pictures from the pixels. */
  async function rasterise(page, vp0, out, opts, rotation) {
    const maxPx = opts.maxPixels || 7e6;
    const scale = Math.max(0.75, Math.min(2, Math.sqrt(maxPx / (vp0.width * vp0.height))));
    const vp = page.getViewport(rotation === undefined ? { scale } : { scale, rotation });
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    const px = img.data, CW = cv.width, CH = cv.height;

    // colours
    for (const f of out.frags) {
      if (!f.s.trim()) continue;
      const x0 = Math.max(0, Math.floor(f.x0 * scale)), x1 = Math.min(CW - 1, Math.ceil(f.x1 * scale));
      const y0 = Math.max(0, Math.floor((f.base - f.fs * 0.72) * scale)), y1 = Math.min(CH - 1, Math.ceil((f.base + f.fs * 0.04) * scale));
      if (x1 <= x0 || y1 <= y0) continue;
      const hist = new Map();
      let n = 0;
      const stepX = Math.max(1, Math.floor((x1 - x0) / 400));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x += stepX) {
          const o = (y * CW + x) * 4;
          const k = ((px[o] >> 4) << 8) | ((px[o + 1] >> 4) << 4) | (px[o + 2] >> 4);
          const e = hist.get(k);
          if (e) { e[0]++; e[1] += px[o]; e[2] += px[o + 1]; e[3] += px[o + 2]; } else hist.set(k, [1, px[o], px[o + 1], px[o + 2]]);
          n++;
        }
      }
      if (!n) continue;
      let be = null;
      for (const e of hist.values()) if (!be || e[0] > be[0]) be = e;
      const bg = [be[1] / be[0], be[2] / be[0], be[3] / be[0]];
      let far = 0;
      const cand = [];
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x += stepX) {
          const o = (y * CW + x) * 4;
          const d = Math.abs(px[o] - bg[0]) + Math.abs(px[o + 1] - bg[1]) + Math.abs(px[o + 2] - bg[2]);
          if (d > far) far = d;
          cand.push(o, d);
        }
      }
      f.bg = hex(bg[0], bg[1], bg[2]);
      if (f.letterSpaced) restoreWordBreaks(f, px, CW, CH, scale, bg);
      if (far < 90) continue;
      let r = 0, g = 0, b = 0, cnt = 0;
      for (let j = 0; j < cand.length; j += 2) {
        if (cand[j + 1] >= far * 0.88) { r += px[cand[j]]; g += px[cand[j] + 1]; b += px[cand[j] + 2]; cnt++; }
      }
      if (cnt) f.color = hex(r / cnt, g / cnt, b / cnt);
    }

    // pictures
    const keep = [];
    for (const im of out.images) {
      const w = im.x1 - im.x0, h = im.y1 - im.y0;
      if (w < 6 || h < 6) continue;
      keep.push(im);
    }
    out.images = keep;
    for (const im of out.images) {
      const sx = Math.max(0, Math.floor(im.x0 * scale)), sy = Math.max(0, Math.floor(im.y0 * scale));
      const sw = Math.min(CW - sx, Math.ceil((im.x1 - im.x0) * scale)), sh = Math.min(CH - sy, Math.ceil((im.y1 - im.y0) * scale));
      if (sw < 2 || sh < 2) continue;
      im.crop = await cropToImage(cv, sx, sy, sw, sh, px, CW);
    }
    if (!out.frags.length) {
      const full = await cropToImage(cv, 0, 0, cv.width, cv.height, px, CW);
      out.images = [{ x0: 0, y0: 0, x1: vp0.width, y1: vp0.height, crop: full, scan: true }];
    }
    out.pageCanvasScale = scale;
    if (opts.keepCanvas) out.canvas = cv;
    else { cv.width = 1; cv.height = 1; }
  }

  /* Letter-spaced words: the gaps between ink columns tell word breaks from letter gaps. */
  function restoreWordBreaks(f, px, CW, CH, scale, bg) {
    const x0 = Math.max(0, Math.floor(f.x0 * scale) - 1), x1 = Math.min(CW - 1, Math.ceil(f.x1 * scale) + 1);
    const y0 = Math.max(0, Math.floor((f.base - f.fs * 0.8) * scale)), y1 = Math.min(CH - 1, Math.ceil((f.base + f.fs * 0.2) * scale));
    const runs = [];
    let cur = null;
    for (let x = x0; x <= x1; x++) {
      let ink = false;
      for (let y = y0; y <= y1 && !ink; y++) {
        const o = (y * CW + x) * 4;
        if (Math.abs(px[o] - bg[0]) + Math.abs(px[o + 1] - bg[1]) + Math.abs(px[o + 2] - bg[2]) > 90) ink = true;
      }
      if (ink) { if (cur) cur[1] = x; else { cur = [x, x]; runs.push(cur); } } else cur = null;
    }
    if (runs.length !== f.s.length) return;
    const gaps = runs.slice(1).map((r, i) => r[0] - runs[i][1] - 1);
    const sorted = gaps.slice().sort((a, b) => a - b);
    const med = sorted[sorted.length >> 1] || 1;
    let out = f.s[0];
    for (let i = 1; i < f.s.length; i++) {
      if (gaps[i - 1] > Math.max(2 * med, med + 0.22 * f.fs * scale)) out += ' ';
      out += f.s[i];
    }
    if (out !== f.s && measureCtx && f.fontCss) {
      measureCtx.font = f.fontCss;
      const ls = (f.x1 - f.x0 - measureCtx.measureText(out).width) / Math.max(1, out.length - 1);
      if (ls > 0.2 && ls < f.fs * 1.5) f.spacing = Math.round(ls * 10) / 10;
    }
    f.s = out;
  }

  async function cropToImage(cv, sx, sy, sw, sh, px, CW) {
    const c2 = document.createElement('canvas');
    c2.width = sw; c2.height = sh;
    c2.getContext('2d').drawImage(cv, sx, sy, sw, sh, 0, 0, sw, sh);
    // few colours (charts, logos, screenshots) stay lossless; photographs become JPEG
    const seen = new Set();
    const stepY = Math.max(1, Math.floor(sh / 40)), stepX = Math.max(1, Math.floor(sw / 40));
    for (let y = 0; y < sh && seen.size < 400; y += stepY) {
      for (let x = 0; x < sw; x += stepX) {
        const o = ((sy + y) * CW + sx + x) * 4;
        seen.add((px[o] << 16) | (px[o + 1] << 8) | px[o + 2]);
      }
    }
    const photo = seen.size >= 400 && sw * sh > 120000;
    const type = photo ? 'image/jpeg' : 'image/png';
    const blob = await new Promise((res) => c2.toBlob(res, type, 0.9));
    const buf = new Uint8Array(await blob.arrayBuffer());
    c2.width = 1; c2.height = 1;
    return { data: buf, ext: photo ? 'jpeg' : 'png', wPx: sw, hPx: sh };
  }

  /* ---------- whole document ---------- */

  async function open(data, opts = {}) {
    const task = pdfjsLib.getDocument({ data, isEvalSupported: false, useSystemFonts: true, ...(opts.getDocument || {}) });
    if (opts.askPassword) {
      task.onPassword = (update, reason) => {
        Promise.resolve(opts.askPassword(reason)).then((p) => { if (p == null) task.destroy(); else update(p); });
      };
    }
    return task.promise;
  }

  async function extractAll(pdf, opts = {}) {
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      if (opts.onProgress) opts.onProgress(i, pdf.numPages);
      pages.push(await extractPage(pdf, i, opts));
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    return pages;
  }

  return { open, extractPage, extractAll, fontTraits };
})();
