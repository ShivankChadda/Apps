/* text.js: lines -> paragraphs, with markers, alignment, tab stops and leader dots. */
const Text = (() => {
  'use strict';
  const { median, sum } = Layout;

  const BULLET = /^([•●○◦▪■□▫‣⁃◆◇▶►➢➤✓✔❖·∙])\s*/;
  const DASH = /^([–—−-])\s+(?=\S)/;
  const NUM = /^(\(?)(\d{1,3})([.)])\s+(?=\S)/;
  const ALPHA = /^(\(?)([A-Za-z])([.)])\s+(?=\S)/;
  const ROMAN = /^(\(?)([ivxlcdm]{2,6}|[IVXLCDM]{2,6})([.)])\s+(?=\S)/;

  function romanValue(s) {
    const m = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    let t = 0;
    s = s.toLowerCase();
    for (let i = 0; i < s.length; i++) { const v = m[s[i]], n = m[s[i + 1]]; t += n > v ? -v : v; }
    return t;
  }

  /* Does the line start with a list marker? Returns {kind, text, value, fmt, len} or null. */
  function detectMarker(line) {
    if (line.parts || line.leaderish) return null;
    if (line.bullet) return { kind: 'bullet', text: line.bullet.shape === 'circle' ? 'o' : line.bullet.shape === 'square' ? '▪' : '•', len: 0, shape: line.bullet };
    const t = line.text;
    let m = BULLET.exec(t);
    if (m && (m[0].length < t.length)) return { kind: 'bullet', text: m[1], len: m[0].length };
    m = DASH.exec(t);
    if (m) return { kind: 'bullet', text: m[1], len: m[0].length };
    m = NUM.exec(t);
    if (m) return { kind: 'num', text: m[0].trim(), value: +m[2], fmt: 'decimal', open: m[1], close: m[3], len: m[0].length };
    m = ROMAN.exec(t);
    if (m) return { kind: 'num', text: m[0].trim(), value: romanValue(m[2]), fmt: m[2] === m[2].toLowerCase() ? 'lowerRoman' : 'upperRoman', open: m[1], close: m[3], len: m[0].length };
    m = ALPHA.exec(t);
    if (m) {
      const ch = m[2];
      return { kind: 'num', text: m[0].trim(), value: ch.toLowerCase().charCodeAt(0) - 96, fmt: ch === ch.toLowerCase() ? 'lowerLetter' : 'upperLetter', open: m[1], close: m[3], len: m[0].length, weak: true };
    }
    return null;
  }

  /* Remove the first n characters of text from a run list. */
  function dropChars(runs, n) {
    const out = [];
    let left = n;
    for (const r of runs) {
      if (left <= 0) { out.push(r); continue; }
      if (r.text.length <= left) { left -= r.text.length; continue; }
      out.push({ ...r, text: r.text.slice(left) });
      left = 0;
    }
    return out;
  }

  /* x where the item text starts, given the marker length */
  function markerTextX(line, len) {
    // walk fragments, counting characters
    let count = 0;
    const frags = line.frags;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      const s = f.s.replace(/\s+/g, ' ');
      if (count + s.length >= len && i + 1 < frags.length && count + s.trim().length >= len - 1) {
        const nx = frags.slice(i + 1).find((g) => g.s.trim());
        if (nx && nx.x0 - f.x1 > 0.1 * f.fs) return nx.x0;
        return f.x1;
      }
      if (count + s.length > len) {
        // marker is a prefix of this fragment: estimate with average character width
        const w = (f.x1 - f.x0) / Math.max(1, s.length);
        return f.x0 + w * (len - count);
      }
      count += s.length;
    }
    return line.x0 + 0.5 * line.fs * len;
  }

  /* ---------- leader dots (tables of contents) ---------- */

  const LEADER = /\s*(?:\.\s?){4,}\s*|\s*(?:…\s?){2,}\s*|\s*(?:·\s?){4,}\s*|\s*_{5,}\s*(?=\S)/;
  function splitLeader(runs) {
    const flat = runs.map((r) => r.text).join('');
    const m = LEADER.exec(flat);
    if (!m || m.index === 0) return null;
    const rest = flat.slice(m.index + m[0].length);
    if (!rest.trim() || rest.length > 12) return null;                 // dots are only a leader when a short page number follows
    const a = m.index, b = m.index + m[0].length;
    const out = [];
    let pos = 0;
    let inserted = false;
    for (const r of runs) {
      const s = pos, e = pos + r.text.length;
      if (e <= a || s >= b) {
        if (s >= b && !inserted) { out.push({ ...r, text: '\t', tab: true, leader: 'dot' }); inserted = true; }
        out.push(r);
      } else {
        if (s < a) out.push({ ...r, text: r.text.slice(0, a - s) });
        if (!inserted) { out.push({ ...r, text: '\t', tab: true, leader: 'dot', underline: false }); inserted = true; }
        if (e > b) out.push({ ...r, text: r.text.slice(b - s) });
      }
      pos = e;
    }
    if (!inserted) return null;
    return out;
  }

  /* ---------- paragraphs ---------- */

  function firstWordWidth(line) {
    const f = line.frags[0];
    const words = line.text.split(' ');
    const w0 = words[0] || '';
    if (!w0) return line.fs * 3;
    const perChar = line.width / Math.max(1, line.text.length);
    return w0.length * perChar;
  }

  const isMono = (l) => l.runs.length > 0 && l.runs.every((r) => !r.text.trim() || r.mono);
  const TERMINAL = /[.!?:;"”’')\]…]$/;

  /*
   * lines: ordered top to bottom (one column, or one table cell)
   * ref:   {left, right}  reference edges of the column the text lives in
   * ctx:   {leadingRatio}
   */
  function buildParagraphs(lines, ref, ctx, opts = {}) {
    if (!lines.length) return [];
    const L = ref.left, R = ref.right;
    const colW = Math.max(10, R - L);
    // is the block justified? (most multi-line paragraphs end flush right)
    const longLines = lines.filter((l) => l.chars >= 30 && !l.parts);
    const flush = longLines.filter((l) => Math.abs(l.x1 - R) <= 2.2).length;
    const justified = longLines.length >= 4 && flush >= 0.55 * longLines.length;
    const lastRight = (l) => l.x1;

    const groups = [];
    let cur = null;
    const closeCur = () => { if (cur) groups.push(cur); cur = null; };

    lines.forEach((l) => { if (l.refLeft === undefined) l.refLeft = ref.left; });
    lines.forEach((line, i) => {
      if (line.leaderish === undefined) { const m = LEADER.exec(line.text); line.leaderish = !!(m && m.index > 0 && line.text.slice(m.index + m[0].length).trim().length <= 12 && line.text.slice(m.index + m[0].length).trim().length > 0); }
      const prev = cur ? cur[cur.length - 1] : null;
      let isNew = !cur;
      let marker = null;
      if (!isNew) {
        const dy = line.base - prev.base;
        const fsR = Math.max(line.fs, prev.fs);
        const ownLeading = cur.length >= 2 ? median(cur.slice(1).map((l, k) => l.base - cur[k].base)) : 0;
        const exp = ownLeading || (prev.fs * (ctx.leadingRatio || 1.2));
        const sameSize = Math.abs(line.fs - prev.fs) <= 0.12 * fsR;
        const prevCentered = Math.abs((prev.x0 + prev.x1) / 2 - (L + R) / 2) < 3 && prev.x0 - L > 0.04 * colW;
        const lineCentered = Math.abs((line.x0 + line.x1) / 2 - (L + R) / 2) < 3 && line.x0 - L > 0.04 * colW;
        if (line.parts || prev.parts || line.leaderish || prev.leaderish) isNew = true;
        else if (isMono(line) && isMono(prev)) isNew = true;
        else if (prev.x1 >= R - 2.5 && line.x1 >= R - 2.5 && prev.x0 - L > 0.2 * colW && line.x0 - L > 0.2 * colW) isNew = true;
        else if (ownLeading ? dy > 1.28 * ownLeading + 0.4 : (dy > 1.42 * exp || dy > exp + 0.9 * fsR)) isNew = true;
        else if (!sameSize) isNew = true;
        else if ((prev.bold > 0.75) !== (line.bold > 0.75) && (prev.bold > 0.75 ? prev.chars < 90 : line.chars < 90)) isNew = true;
        else if (!line.noMarker && detectMarker(line) && !(detectMarker(line).weak && prev.chars > 0 && !TERMINAL.test(prev.text) && prev.x1 > R - 0.2 * colW)) isNew = true;
        else if (prevCentered && lineCentered && Math.abs(prev.x0 - line.x0) > 3 && prev.width < 0.85 * colW) isNew = true;
        else if (prevCentered !== lineCentered && (prev.width < 0.7 * colW)) isNew = true;
        else if (line.x0 - prev.x0 >= 0.9 * line.fs && line.x0 - prev.x0 < 6 * line.fs && cur.length === 1 && prev.x1 < R - 2.5 * line.fs && !detectMarker(prev)) {
          // indented line after a short unindented line: new paragraph only if the previous line was not wrapping
          isNew = true;
        } else if (prev.x0 - line.x0 >= 0.9 * line.fs && cur.length >= 1 && prev.x1 < R - 2.5 * line.fs) isNew = true;
        else if (line.x0 - prev.x0 >= 0.9 * line.fs && prev.x1 < R - 0.25 * colW && cur.length > 1) isNew = true;
        else if (justified && R - lastRight(prev) > firstWordWidth(line) + 0.5 * line.fs) isNew = true;
        else if (!justified && !prevCentered && R - lastRight(prev) > firstWordWidth(line) + 0.5 * line.fs + Math.max(1.5 * line.fs, 0.08 * colW)) isNew = true;
        else if (!justified && R - lastRight(prev) > 0.3 * colW && TERMINAL.test(prev.text) && !prevCentered) isNew = true;
      }
      if (isNew) { closeCur(); cur = [line]; } else cur.push(line);
    });
    closeCur();

    return groups.map((g) => makeParagraph(g, ref, ctx, justified, opts));
  }

  function rebuild(lines, ref, ctx, opts, justified) { return makeParagraph(lines, ref, ctx, !!justified, opts || {}); }
  /* re-create a paragraph in place (used when a would-be list item turns out to be plain text) */
  function remake(p) {
    const np = makeParagraph(p.lines, p.ref, p._ctx, p.justified, p._opts || {});
    for (const k of Object.keys(p)) if (!(k in np) && k !== 'block' && k !== 'colIndex' && k !== 'columns') delete p[k];
    Object.assign(p, np);
  }

  function makeParagraph(g, ref, ctx, justified, opts) {
    const L = ref.left, R = ref.right, colW = Math.max(10, R - L);
    const first = g[0];
    const marker = first.noMarker ? null : detectMarker(first);
    const p = {
      type: 'p', lines: g, page: first.page, justified, _ctx: ctx, _opts: opts,
      top: Math.min(...g.map((l) => l.top)), bot: Math.max(...g.map((l) => l.bot)),
      x0: Math.min(...g.map((l) => l.x0)), x1: Math.max(...g.map((l) => l.x1)),
      firstBase: first.base, lastBase: g[g.length - 1].base,
      fs: first.fs, ref,
      bold: sum(g.map((l) => l.bold * l.chars)) / Math.max(1, sum(g.map((l) => l.chars))),
      italic: sum(g.map((l) => l.italic * l.chars)) / Math.max(1, sum(g.map((l) => l.chars))),
      chars: sum(g.map((l) => l.chars)),
      caps: g.every((l) => l.caps),
      mono: g.every((l) => l.runs.every((r) => !r.text.trim() || r.mono)),
    };
    p.leading = g.length >= 2 ? median(g.slice(1).map((l, k) => l.base - g[k].base)) : 0;
    // lines that came from another column or page are measured from their own column's left edge
    const baseOf = (l) => (l.refLeft !== undefined ? l.refLeft : ref.left);
    const gn = g.map((l) => ({ x0: L + (l.x0 - baseOf(l)), x1: L + (l.x1 - baseOf(l)) }));
    const px0 = Math.min(...gn.map((l) => l.x0)), px1 = Math.max(...gn.map((l) => l.x1));
    p.nx0 = px0; p.nx1 = px1;
    p.firstX = gn[0].x0;
    p.restX = g.length > 1 ? median(gn.slice(1).map((l) => l.x0)) : gn[0].x0;
    if (marker && !first.parts) {
      p.marker = marker;
      const r0 = first.runs[0] || {};
      marker.style = { bold: !!r0.bold, italic: !!r0.italic, color: r0.color || null, size: r0.size || first.fs, face: r0.face || 'Arial' };
      p.markerX = marker.shape ? marker.shape.x0 : first.x0;
      p.textX = marker.shape ? first.x0 : markerTextX(first, marker.len);
      if (marker.shape) marker.style.face = marker.text === 'o' ? 'Courier New' : marker.style.face;
      if (g.length > 1 && Math.abs(p.restX - p.textX) < 0.8 * first.fs) p.restX = p.textX;
    }

    // alignment
    const n = g.length;
    const cC = (L + R) / 2;
    const centers = gn.map((l) => (l.x0 + l.x1) / 2);
    const nonLast = gn.slice(0, -1);
    const spread = Math.max(...gn.map((l) => l.x0)) - Math.min(...gn.map((l) => l.x0));
    if (opts.noJustify && false) p.align = 'left';
    else if (!opts.noJustify && n >= 3 && nonLast.every((l) => Math.abs(l.x1 - px1) <= 2.2) && spread <= 4 && (n >= 4 || Math.abs(px1 - R) <= 14)) p.align = 'both';
    else if (!opts.noJustify && n === 2 && Math.abs(gn[0].x1 - R) <= 1.2 && Math.abs(gn[0].x0 - gn[1].x0) <= 3) p.align = 'both';
    else if (gn.every((l, k) => Math.abs(centers[k] - cC) <= 3.5) && (n >= 2 ? (gn.some((l) => l.x0 - L > 0.04 * colW) && spread > 4) : px0 - L > 0.04 * colW)) p.align = 'center';
    else if (gn.every((l) => Math.abs(l.x1 - R) <= 2.5) && px0 - L > 0.12 * colW && (n === 1 || spread > 4)) p.align = 'right';
    else if (n >= 2 && gn.every((l) => Math.abs(l.x1 - px1) <= 2.5) && gn.some((l) => l.x0 - L > 0.12 * colW) && Math.abs(px1 - R) <= 4 && spread > 4) p.align = 'right';
    else p.align = 'left';
    if (first.parts) p.align = 'left';
    if (opts.cell) p.align = opts.cell(p) || p.align;

    // runs
    p.runs = joinLines(g, p.marker, opts.fixHyphens !== false);
    // leaders / tabs
    p.tabs = [];
    if (g.length === 1) {
      const lead = splitLeader(p.runs);
      if (lead) { p.runs = lead; p.tabs.push({ pos: g[0].x1 - ref.left, type: 'right', leader: 'dot' }); p.leader = true; }
    }
    if (first.parts) {
      first.parts.forEach((part, k) => {
        if (!k) return;
        const cx = (part.x0 + part.x1) / 2;
        if (part.x1 >= R - 4 && part.x0 - L > 0.3 * colW) p.tabs.push({ pos: part.x1 - L, type: 'right' });
        else if (Math.abs(cx - cC) <= 4 && k === 1 && first.parts.length === 3) p.tabs.push({ pos: cx - L, type: 'center' });
        else p.tabs.push({ pos: part.x0 - L, type: 'left' });
      });
    }
    return p;
  }

  /* Join the runs of several lines into one paragraph. */
  function joinLines(g, marker, fixHyphens) {
    const runs = [];
    g.forEach((line, i) => {
      let lr = line.runs.map((r) => ({ ...r }));
      if (i === 0 && marker) lr = dropChars(lr, marker.len);
      if (!lr.length) return;
      if (runs.length) {
        const last = runs[runs.length - 1];
        const lastCh = last.text.slice(-1), firstCh = lr[0].text.charAt(0);
        const beforeHyphen = last.text.slice(-2, -1);
        if (fixHyphens && lastCh === '-' && /[A-Za-zÀ-ɏ]/.test(beforeHyphen) && /[a-zß-ɏ]/.test(firstCh)) {
          last.text = last.text.slice(0, -1);
        } else if (/\d[:\/]$/.test(last.text) && /^\d/.test(lr[0].text)) {
          /* a time or date split at the colon or slash: no space */
        } else if (!/\s$/.test(last.text) && !/^\s/.test(lr[0].text)) {
          last.text += ' ';
        }
      }
      runs.push(...lr);
    });
    // merge neighbours with identical style
    const out = [];
    for (const r of runs) {
      const l = out[out.length - 1];
      if (l && !l.tab && !r.tab && l.bold === r.bold && l.italic === r.italic && l.face === r.face && l.size === r.size && !!l.underline === !!r.underline && !!l.strike === !!r.strike
        && l.sup === r.sup && l.sub === r.sub && (l.url || null) === (r.url || null) && (l.spacing || 0) === (r.spacing || 0) && Layout.colorDist(l.color, r.color) <= 30) l.text += r.text;
      else out.push(r);
    }
    return out;
  }

  return { buildParagraphs, rebuild, remake, detectMarker, splitLeader, joinLines };
})();
