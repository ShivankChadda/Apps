/* layout.js: turn the loose pieces of one page into reading-ordered blocks.
 *
 * A PDF stores text as positioned fragments with no notion of lines, paragraphs, columns or
 * tables. This file recovers that structure from geometry alone:
 *
 *   fragments -> rows (same baseline) -> segments (split at wide gaps)
 *   ruled tables   from line art (grid of rules, with merged cells)
 *   gutters        tall empty vertical strips between text; they mark columns and loose tables
 *   blocks         flow text, tables and pictures in reading order
 */
const Layout = (() => {
  'use strict';

  const median = (a) => {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  /* ---------- text clean-up ---------- */

  const LIG = { 'ﬀ': 'ff', 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬃ': 'ffi', 'ﬄ': 'ffl', 'ﬅ': 'st', 'ﬆ': 'st' };
  const BULLET_PUA = { '': '•', '': '▪', '': '➢', '': '✓', '': '■', '': '❑', '': '❖', '': '◦', '': '°' };
  function cleanText(s) {
    return s
      .replace(/[ﬀ-ﬆ]/g, (c) => LIG[c])
      .replace(/[   ]/g, ' ')
      .replace(/­/g, '')
      .replace(/[-]/g, (c) => BULLET_PUA[c] || '•')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  }

  /* ---------- rows and segments ---------- */

  function buildRows(frags) {
    const fr = frags.slice().sort((a, b) => (a.base - b.base) || (a.x0 - b.x0));
    const rows = [];
    for (const f of fr) {
      const ymid = f.base - 0.3 * f.fs;
      let best = null, bd = Infinity;
      for (let i = rows.length - 1; i >= 0 && i >= rows.length - 10; i--) {
        const r = rows[i];
        const tol = 0.5 * Math.min(f.fs, r.fs);
        const d = Math.abs(ymid - r.ymid);
        if (d <= tol && d < bd) { best = r; bd = d; }
      }
      if (!best) {
        rows.push({ frags: [f], ymid, fs: f.fs, big: f.fs });
      } else {
        best.frags.push(f);
        if (f.fs >= best.big * 0.85) { best.ymid = (best.ymid * (best.frags.length - 1) + ymid) / best.frags.length; }
        if (f.fs > best.big) best.big = f.fs;
        best.fs = Math.min(best.fs, f.fs) < best.big * 0.6 ? best.big : Math.max(best.fs, f.fs);
      }
    }
    for (const r of rows) {
      r.frags.sort((a, b) => a.x0 - b.x0);
      r.base = median(r.frags.filter((f) => f.fs >= r.big * 0.85).map((f) => f.base));
      r.fs = r.big;
      r.top = r.base - 0.82 * r.fs;
      r.bot = r.base + 0.24 * r.fs;
      r.segs = makeSegments(r);
    }
    rows.sort((a, b) => a.base - b.base);
    return rows;
  }

  function makeSegments(row) {
    const segs = [];
    let cur = null;
    for (const f of row.frags) {
      if (cur) {
        const gap = f.x0 - cur.x1;
        const G = Math.max(0.85 * Math.max(f.fs, cur.fs), 5);
        if (gap <= G) { cur.frags.push(f); cur.x1 = Math.max(cur.x1, f.x1); cur.fs = Math.max(cur.fs, f.fs); continue; }
      }
      cur = { frags: [f], x0: f.x0, x1: f.x1, fs: f.fs, row };
      segs.push(cur);
    }
    // a justified line with few long words has wide gaps everywhere: keep it as one piece
    if (segs.length >= 3) {
      const words = segs.map((s) => s.frags.map((f) => f.s).join(' ').trim());
      const alpha = words.every((w) => /^[^\s\d]{3,}$/.test(w));
      if (alpha) {
        const gaps = [];
        for (let i = 1; i < segs.length; i++) gaps.push(segs[i].x0 - segs[i - 1].x1);
        const mean = sum(gaps) / gaps.length;
        const sd = Math.sqrt(sum(gaps.map((g) => (g - mean) * (g - mean))) / gaps.length);
        if (mean > 0 && sd / mean < 0.14) {
          const one = { frags: segs.flatMap((s) => s.frags), x0: segs[0].x0, x1: segs[segs.length - 1].x1, fs: Math.max(...segs.map((s) => s.fs)), row };
          segs.length = 0; segs.push(one);
        }
      }
    }
    for (const s of segs) {
      s.chars = sum(s.frags.map((f) => f.s.replace(/\s/g, '').length));
      s.cx = (s.x0 + s.x1) / 2;
    }
    return segs;
  }

  const rowChars = (r) => sum(r.segs.map((s) => s.chars));

  /* ---------- gutters: tall empty strips with text on both sides ---------- */

  function findStrips(rows, minW) {
    const strips = [];
    let active = [];
    let xmin = 1e9, xmax = -1e9;
    for (const r of rows) if (!r.barrier) for (const s of r.segs) { if (s.x0 < xmin) xmin = s.x0; if (s.x1 > xmax) xmax = s.x1; }
    if (xmax - xmin < 2 * minW) return [];
    const free = (segs) => {
      // complement of the occupied intervals within the text extent
      const occ = segs.map((s) => [s.x0 - 0.4, s.x1 + 0.4]).sort((a, b) => a[0] - b[0]);
      const m = [];
      for (const o of occ) { if (m.length && o[0] <= m[m.length - 1][1]) m[m.length - 1][1] = Math.max(m[m.length - 1][1], o[1]); else m.push(o.slice()); }
      const f = [];
      let prev = xmin;
      for (const o of m) { if (o[0] > prev) f.push([prev, o[0]]); prev = Math.max(prev, o[1]); }
      if (xmax > prev) f.push([prev, xmax]);
      return f;
    };
    rows.forEach((row, i) => {
      const F = free(row.segs);
      const next = [];
      for (const s of active) {
        let kept = false;
        for (const f of F) {
          const a = Math.max(s.x0, f[0]), b = Math.min(s.x1, f[1]);
          if (b - a >= minW) { next.push({ x0: a, x1: b, start: s.start, last: i }); kept = true; }
        }
        if (!kept) strips.push(s);
      }
      for (const f of F) {
        if (f[1] - f[0] < minW) continue;
        if (next.some((n) => n.x0 <= f[0] + 1 && n.x1 >= f[1] - 1)) continue;
        next.push({ x0: f[0], x1: f[1], start: i, last: i });
      }
      // drop duplicates (same range)
      active = next.filter((n, k) => !next.some((m, j) => j < k && Math.abs(m.x0 - n.x0) < 0.5 && Math.abs(m.x1 - n.x1) < 0.5 && m.start <= n.start));
    });
    strips.push(...active);
    return strips;
  }

  /* A strip is a gutter when both sides hold enough text. Returns bands of rows. */
  function findBands(rows, fsBody) {
    if (rows.length < 3) return [];
    const minW = Math.max(7, 0.6 * fsBody);
    const raw = findStrips(rows, minW).filter((s) => s.last - s.start + 1 >= 3);
    const good = [];
    for (const s of raw) {
      let left = 0, right = 0, leftChars = 0, rightChars = 0;
      for (let i = s.start; i <= s.last; i++) {
        let l = 0, r = 0;
        for (const g of rows[i].segs) { if (g.x1 <= s.x0 + 1) { l += g.chars; } else if (g.x0 >= s.x1 - 1) { r += g.chars; } }
        if (l) left++; if (r) right++; leftChars += l; rightChars += r;
      }
      const n = s.last - s.start + 1;
      if (left >= 3 && right >= 3 && left >= 0.3 * n && right >= 0.3 * n) good.push({ ...s, n, left, right });
    }
    good.sort((a, b) => b.n - a.n);
    const bands = [];
    const claimed = new Array(rows.length).fill(-1);
    for (const s of good) {
      // overlap with existing bands?
      let hit = null, overlap = 0;
      for (const b of bands) {
        const a = Math.max(b.start, s.start), z = Math.min(b.last, s.last);
        if (z >= a) { const o = z - a + 1; if (o > overlap) { overlap = o; hit = b; } }
      }
      if (hit && overlap >= 0.6 * Math.max(s.n, hit.last - hit.start + 1)) {
        if (!hit.gutters.some((g) => g.x0 < s.x1 && g.x1 > s.x0)) hit.gutters.push({ x0: s.x0, x1: s.x1 });
        continue;
      }
      let a = s.start, z = s.last;
      if (hit) {
        // trim to rows nobody claimed
        const free = [];
        let run = null;
        for (let i = s.start; i <= s.last; i++) {
          if (claimed[i] === -1) { if (!run) run = [i, i]; else run[1] = i; } else { if (run) free.push(run); run = null; }
        }
        if (run) free.push(run);
        free.sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]));
        if (!free.length || free[0][1] - free[0][0] + 1 < 3) continue;
        [a, z] = free[0];
      }
      const band = { start: a, last: z, gutters: [{ x0: s.x0, x1: s.x1 }] };
      bands.push(band);
      for (let i = a; i <= z; i++) claimed[i] = bands.length - 1;
    }
    bands.sort((p, q) => p.start - q.start);
    for (const b of bands) b.gutters.sort((p, q) => p.x0 - q.x0);
    return bands;
  }

  /* ---------- lines, runs ---------- */

  const dark = (c) => {
    if (!c) return true;
    const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum < 48 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
  };
  const colorDist = (a, b) => {
    if (!a || !b) return a === b ? 0 : 999;
    return Math.abs(parseInt(a.slice(1, 3), 16) - parseInt(b.slice(1, 3), 16)) + Math.abs(parseInt(a.slice(3, 5), 16) - parseInt(b.slice(3, 5), 16)) + Math.abs(parseInt(a.slice(5, 7), 16) - parseInt(b.slice(5, 7), 16));
  };

  function dominantFs(frags) {
    const w = new Map();
    for (const f of frags) { const k = Math.round(f.fs * 2) / 2; w.set(k, (w.get(k) || 0) + f.s.length); }
    let best = 0, bw = -1;
    for (const [k, v] of w) if (v > bw || (v === bw && k > best)) { best = k; bw = v; }
    return best;
  }

  /* Merge fragments into style runs; add spaces where the geometry shows a gap. */
  function buildRuns(frags, lineFs, lineBase) {
    const runs = [];
    let prev = null, pendingPlain = false;
    for (const f of frags) {
      let text = f.s.replace(/\s+/g, ' ');
      if (!text.trim() && !prev) continue;
      if (prev) {
        const gap = f.x0 - prev.x1;
        const needs = gap > 0.14 * Math.min(f.fs, prev.fs) && !/\s$/.test(prev.s) && !/^\s/.test(text);
        if (needs) {
          const last0 = runs[runs.length - 1];
          const styledNext = !!(f.underline || f.url), styledPrev = !!(prev.underline || prev.url);
          if (last0 && styledNext && !styledPrev) last0.text += ' ';
          else if (last0 && styledPrev && !styledNext) text = ' ' + text, pendingPlain = true;
          else text = ' ' + text;
        }
      }
      const small = f.fs < 0.85 * lineFs;
      const sup = small && f.base < lineBase - 0.17 * lineFs;
      const sub = small && !sup && f.base > lineBase + 0.1 * lineFs;
      const color = dark(f.color) ? null : f.color;
      const size = (sup || sub) ? Math.round(lineFs * 2) / 2 : Math.round(f.fs * 2) / 2;
      const last = runs[runs.length - 1];
      if (last && last.bold === f.bold && last.italic === f.italic && last.face === f.face && last.size === size
        && !!last.underline === !!f.underline && !!last.strike === !!f.strike && last.sup === sup && last.sub === sub
        && (last.url || null) === (f.url || null) && (last.spacing || 0) === (f.spacing || 0) && colorDist(last.color, color) <= 30) {
        last.text += text;
      } else {
        runs.push({ text, bold: !!f.bold, italic: !!f.italic, face: f.face, size, color, underline: !!f.underline, strike: !!f.strike, sup, sub, url: f.url || null, mono: !!f.mono, serif: !!f.serif, spacing: f.spacing || 0 });
      }
      prev = f;
    }
    return runs;
  }

  function makeLine(frags, page) {
    frags = frags.slice().sort((a, b) => a.x0 - b.x0);
    const fs = dominantFs(frags);
    const bigs = frags.filter((f) => f.fs >= fs * 0.85);
    const base = median(bigs.map((f) => f.base));
    const runs = buildRuns(frags, fs, base);
    if (runs.length) { runs[0].text = runs[0].text.replace(/^\s+/, ''); runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, ''); }
    const text = runs.map((r) => r.text).join('');
    const chars = text.replace(/\s/g, '').length;
    const boldChars = sum(runs.filter((r) => r.bold).map((r) => r.text.replace(/\s/g, '').length));
    const italChars = sum(runs.filter((r) => r.italic).map((r) => r.text.replace(/\s/g, '').length));
    const upper = text.replace(/[^A-Za-z]/g, '');
    return {
      page, frags, runs, text, chars, fs, base,
      x0: Math.min(...frags.map((f) => f.x0)), x1: Math.max(...frags.map((f) => f.x1)),
      top: base - 0.82 * fs, bot: base + 0.24 * fs,
      bold: chars ? boldChars / chars : 0, italic: chars ? italChars / chars : 0,
      caps: upper.length >= 3 && upper === upper.toUpperCase(),
      width: Math.max(...frags.map((f) => f.x1)) - Math.min(...frags.map((f) => f.x0)),
    };
  }

  /* A flow row may hold several parts far apart (left text, right page number): tabs. */
  function rowToLine(row, segs, page, noTabs) {
    const parts = [];
    for (const s of segs) {
      const last = parts[parts.length - 1];
      const T = noTabs ? 1e9 : Math.max(1.4 * s.fs, 16);
      if (last && s.x0 - last.x1 <= T) { last.frags.push(...s.frags); last.x1 = Math.max(last.x1, s.x1); } else parts.push({ frags: s.frags.slice(), x0: s.x0, x1: s.x1 });
    }
    const all = parts.flatMap((p) => p.frags);
    const line = makeLine(all, page);
    if (parts.length > 1) {
      line.parts = parts.map((p) => {
        const l = makeLine(p.frags, page);
        return { x0: l.x0, x1: l.x1, runs: l.runs, text: l.text };
      });
      // rebuild runs with tabs between parts
      const runs = [];
      line.parts.forEach((p, i) => {
        if (i) runs.push({ text: '\t', tab: true, size: line.fs, face: p.runs[0] ? p.runs[0].face : 'Arial', bold: false, italic: false, color: null, sup: false, sub: false });
        runs.push(...p.runs.map((r) => ({ ...r })));
      });
      line.runs = runs;
      line.text = runs.map((r) => r.text).join('');
    }
    return line;
  }

  /* ---------- underline and strike-through from line art ---------- */

  function consumeTextRules(page) {
    const hs = page.rules.filter((r) => r.h && r.w <= 1.6);
    for (const f of page.frags) {
      const fw = f.x1 - f.x0;
      if (fw < 2) continue;
      for (const r of hs) {
        if (r.used) continue;
        const len = r.x1 - r.x0;
        if (len < fw * 0.8 || len > fw + 8) continue;
        if (r.x0 > f.x1 - fw * 0.3 || r.x1 < f.x0 + fw * 0.3) continue;
        const dy = r.y - f.base;
        if (dy > 0.04 * f.fs && dy < 0.3 * f.fs) { f.underline = true; r.used = true; }
        else if (dy < -0.18 * f.fs && dy > -0.45 * f.fs && len <= fw + 2) { f.strike = true; r.used = true; }
      }
    }
    // underline drawn across several fragments (links and words broken apart)
    for (const r of hs) {
      if (r.used) continue;
      const hits = page.frags.filter((f) => !f.underline && f.x1 > r.x0 + 1 && f.x0 < r.x1 - 1 && (r.y - f.base) > 0.04 * f.fs && (r.y - f.base) < 0.3 * f.fs);
      if (hits.length && hits.every((f) => f.x0 >= r.x0 - 3 && f.x1 <= r.x1 + 3)) { hits.forEach((f) => { f.underline = true; }); r.used = true; }
    }
    page.rules = page.rules.filter((r) => !r.used);
  }

  /* ---------- ruled tables ---------- */

  function mergeRules(rules, horizontal) {
    const key = horizontal ? 'y' : 'x';
    const lo = horizontal ? 'x0' : 'y0', hi = horizontal ? 'x1' : 'y1';
    const list = rules.filter((r) => !!r.h === horizontal && r[hi] - r[lo] >= 3).map((r) => ({ ...r })).sort((a, b) => (a[key] - b[key]) || (a[lo] - b[lo]));
    const out = [];
    for (const r of list) {
      let merged = false;
      for (let i = out.length - 1; i >= 0 && i >= out.length - 40; i--) {
        const o = out[i];
        if (Math.abs(o[key] - r[key]) <= 1.3 && r[lo] <= o[hi] + 2.2 && r[hi] >= o[lo] - 2.2) {
          o[lo] = Math.min(o[lo], r[lo]); o[hi] = Math.max(o[hi], r[hi]);
          o.w = Math.max(o.w, r.w);
          merged = true; break;
        }
      }
      if (!merged) out.push(r);
    }
    return out;
  }

  function cluster1d(values, tol) {
    const v = values.slice().sort((a, b) => a - b);
    const out = [];
    for (const x of v) {
      const last = out[out.length - 1];
      if (last && x - last.max <= tol) { last.max = x; last.sum += x; last.n++; } else out.push({ min: x, max: x, sum: x, n: 1 });
    }
    return out.map((c) => c.sum / c.n);
  }

  function detectRuledTables(page) {
    if (page.rules.length > 6000) return [];
    const hs = mergeRules(page.rules, true), vs = mergeRules(page.rules, false);
    if (hs.length + vs.length < 3) return [];
    const segs = [...hs.map((s) => ({ s, h: true })), ...vs.map((s) => ({ s, h: false }))];
    const parent = segs.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    const tol = 2.6;
    for (let i = 0; i < segs.length; i++) {
      if (!segs[i].h) continue;
      const h = segs[i].s;
      for (let j = 0; j < segs.length; j++) {
        if (segs[j].h) continue;
        const v = segs[j].s;
        if (v.x >= h.x0 - tol && v.x <= h.x1 + tol && h.y >= v.y0 - tol && h.y <= v.y1 + tol) union(i, j);
      }
    }
    const comps = new Map();
    segs.forEach((s, i) => { const r = find(i); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(s); });
    const tables = [];
    for (const comp of comps.values()) {
      const ch = comp.filter((c) => c.h).map((c) => c.s), cv = comp.filter((c) => !c.h).map((c) => c.s);
      if (ch.length < 2 || cv.length < 2) continue;
      const ys = cluster1d([...ch.map((h) => h.y), ...cv.map((v) => v.y0), ...cv.map((v) => v.y1)], 2.2);
      const xs = cluster1d([...cv.map((v) => v.x), ...ch.map((h) => h.x0), ...ch.map((h) => h.x1)], 2.2);
      if (ys.length < 2 || xs.length < 2) continue;
      const bbox = { x0: xs[0], x1: xs[xs.length - 1], y0: ys[0], y1: ys[ys.length - 1] };
      if (bbox.x1 - bbox.x0 < 18 || bbox.y1 - bbox.y0 < 10) continue;
      if (ys.length === 2 && xs.length === 2 && bbox.x1 - bbox.x0 > 0.85 * page.w && bbox.y1 - bbox.y0 > 0.85 * page.h) continue; // page frame
      const R = ys.length - 1, C = xs.length - 1;
      if (R * C > 2500) continue;
      // edge coverage
      const vcov = (x, ya, yb) => {
        let best = null, cov = 0;
        const parts = [];
        for (const v of cv) if (Math.abs(v.x - x) <= 2.4) parts.push([Math.max(v.y0, ya), Math.min(v.y1, yb), v]);
        parts.sort((p, q) => p[0] - q[0]);
        let reach = ya;
        for (const p of parts) { if (p[1] <= p[0]) continue; if (p[0] <= reach + 2.4) { cov += Math.max(0, p[1] - Math.max(reach, p[0])); reach = Math.max(reach, p[1]); } if (!best || p[2].w > best.w) best = p[2]; }
        return cov / Math.max(1, yb - ya) >= 0.6 ? { w: best ? best.w : 0.7, color: best ? best.color : '#000000' } : null;
      };
      const hcov = (y, xa, xb) => {
        let best = null, cov = 0;
        const parts = [];
        for (const h of ch) if (Math.abs(h.y - y) <= 2.4) parts.push([Math.max(h.x0, xa), Math.min(h.x1, xb), h]);
        parts.sort((p, q) => p[0] - q[0]);
        let reach = xa;
        for (const p of parts) { if (p[1] <= p[0]) continue; if (p[0] <= reach + 2.4) { cov += Math.max(0, p[1] - Math.max(reach, p[0])); reach = Math.max(reach, p[1]); } if (!best || p[2].w > best.w) best = p[2]; }
        return cov / Math.max(1, xb - xa) >= 0.6 ? { w: best ? best.w : 0.7, color: best ? best.color : '#000000' } : null;
      };
      // walls[r][c].right / .bottom
      const right = [], bottom = [];
      for (let r = 0; r < R; r++) { right.push([]); bottom.push([]); for (let c = 0; c < C; c++) { right[r].push(vcov(xs[c + 1], ys[r], ys[r + 1])); bottom[r].push(hcov(ys[r + 1], xs[c], xs[c + 1])); } }
      const topW = [], leftW = [];
      for (let c = 0; c < C; c++) topW.push(hcov(ys[0], xs[c], xs[c + 1]));
      for (let r = 0; r < R; r++) leftW.push(vcov(xs[0], ys[r], ys[r + 1]));
      // merge cells without a wall between them
      const id = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => r * C + c));
      const par = id.flat().map((x) => x);
      const f2 = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        if (c + 1 < C && !right[r][c]) { const a = f2(r * C + c), b = f2(r * C + c + 1); if (a !== b) par[a] = b; }
        if (r + 1 < R && !bottom[r][c]) { const a = f2(r * C + c), b = f2((r + 1) * C + c); if (a !== b) par[a] = b; }
      }
      const groups = new Map();
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const g = f2(r * C + c); if (!groups.has(g)) groups.set(g, []); groups.get(g).push([r, c]); }
      const cells = [];
      let ok = true;
      for (const g of groups.values()) {
        const r0 = Math.min(...g.map((p) => p[0])), r1 = Math.max(...g.map((p) => p[0])), c0 = Math.min(...g.map((p) => p[1])), c1 = Math.max(...g.map((p) => p[1]));
        if ((r1 - r0 + 1) * (c1 - c0 + 1) !== g.length) { ok = false; break; }
        cells.push({ r0, c0, r1: r1 + 1, c1: c1 + 1 });
      }
      if (!ok) {
        cells.length = 0;
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) cells.push({ r0: r, c0: c, r1: r + 1, c1: c + 1 });
      }
      for (const cell of cells) {
        cell.x0 = xs[cell.c0]; cell.x1 = xs[cell.c1]; cell.y0 = ys[cell.r0]; cell.y1 = ys[cell.r1];
        cell.borders = {
          t: cell.r0 === 0 ? topW[cell.c0] : bottom[cell.r0 - 1][cell.c0],
          b: bottom[cell.r1 - 1][cell.c0],
          l: cell.c0 === 0 ? leftW[cell.r0] : right[cell.r0][cell.c0 - 1],
          r: right[cell.r0][cell.c1 - 1],
        };
        cell.lines = []; cell.images = [];
      }
      cells.sort((p, q) => (p.r0 - q.r0) || (p.c0 - q.c0));
      tables.push({ ruled: true, xs, ys, cells, ...bbox });
    }
    return tables;
  }

  /* shading: the last filled rectangle that covers most of a cell */
  function applyFills(table, fills) {
    for (const cell of table.cells) {
      const area = (cell.x1 - cell.x0) * (cell.y1 - cell.y0);
      let pick = null;
      const cx = (cell.x0 + cell.x1) / 2;
      for (const f of fills) {
        const w = Math.min(f.x1, cell.x1) - Math.max(f.x0, cell.x0), h = Math.min(f.y1, cell.y1) - Math.max(f.y0, cell.y0);
        if (w > 0 && h > 0 && w * h >= 0.7 * area) pick = f;
        else if (!table.ruled && w > 0 && h >= 0.6 * Math.min(cell.y1 - cell.y0, f.y1 - f.y0) && cx >= f.x0 && cx <= f.x1 && f.y1 - f.y0 < 2.5 * (cell.y1 - cell.y0)) pick = f;
      }
      cell.fill = pick && !/^#(f[b-f]|e[f]){3}/i.test(pick.color) && pick.color.toLowerCase() !== '#ffffff' ? pick.color : null;
      cell.fillRect = cell.fill ? pick : null;
      if (pick && cell.fill && !table.ruled && table.cells.length <= 6 && pick.y1 > cell.y1 + 6 && pick.y0 >= cell.y0 - 14 && pick.y0 <= cell.y1) { cell.y1 = pick.y1; table.ys[table.ys.length - 1] = Math.max(table.ys[table.ys.length - 1], pick.y1); table.y1 = Math.max(table.y1, pick.y1); }
    }
  }

  /* ---------- classify a band of gutters: text columns or a loose table ---------- */

  function bandColumns(band, rows) {
    const gs = band.gutters;
    const edges = [-1e9, ...gs.map((g) => (g.x0 + g.x1) / 2), 1e9];
    const cols = [];
    for (let i = 0; i + 1 < edges.length; i++) cols.push({ lo: edges[i], hi: edges[i + 1], segs: [] });
    for (let i = band.start; i <= band.last; i++) {
      for (const s of rows[i].segs) {
        const k = cols.findIndex((c) => s.cx >= c.lo && s.cx < c.hi);
        if (k >= 0) cols[k].segs.push(s);
      }
    }
    for (const c of cols) {
      c.x0 = c.segs.length ? Math.min(...c.segs.map((s) => s.x0)) : c.lo;
      c.x1 = c.segs.length ? Math.max(...c.segs.map((s) => s.x1)) : c.hi;
    }
    return cols;
  }

  function classifyBand(cols) {
    const stats = cols.map((c) => {
      // judge whole lines, not the pieces a justified line breaks into
      const byRow = new Map();
      for (const s of c.segs) { if (!byRow.has(s.row)) byRow.set(s.row, []); byRow.get(s.row).push(s); }
      const lines = [...byRow.values()].map((ss) => ({ x0: Math.min(...ss.map((s) => s.x0)), x1: Math.max(...ss.map((s) => s.x1)), chars: sum(ss.map((s) => s.chars)) }));
      const n = lines.length;
      const wCol = Math.max(1, c.x1 - c.x0);
      const full = lines.filter((l) => l.x1 - l.x0 >= 0.8 * wCol && l.chars >= 18).length;
      return { n, avgChars: n ? sum(lines.map((l) => l.chars)) / n : 0, fullFrac: n ? full / n : 0, maxChars: n ? Math.max(...lines.map((l) => l.chars)) : 0 };
    });
    if (cols.length === 2 && stats.some((s) => s.maxChars <= 4)) return 'marker';
    if (stats.some((s) => s.n < 3)) return 'table';
    return stats.every((s) => s.avgChars >= 22 && s.fullFrac >= 0.4) ? 'cols' : 'table';
  }

  /* ---------- the page ---------- */

  const barrier = (y, w) => ({ barrier: true, frags: [], base: y, top: y, bot: y, fs: 10, big: 10, segs: [{ x0: -1e4, x1: 1e4, cx: 0, chars: 0, frags: [], fs: 10 }] });

  /* Cut a loose-table band at large vertical gaps and drop heading-like rows at its edges. */
  /* Returns the list of row ranges that should each be re-examined as a table. */
  function refineTableBand(band, rows) {
    const idx = [];
    for (let i = band.start; i <= band.last; i++) if (!rows[i].barrier) idx.push(i);
    const colOf = (seg) => band.cols.findIndex((c) => seg.cx >= c.lo && seg.cx < c.hi);
    const nCols = (i) => new Set(rows[i].segs.map(colOf)).size;
    const aligned = idx.filter((i) => nCols(i) >= 2).length / Math.max(1, idx.length);
    band.aligned = aligned >= 0.5;
    if (!band.aligned) return { runs: [[idx[0], idx[idx.length - 1]]], cut: false };
    const pitches = [null];
    for (let k = 1; k < idx.length; k++) pitches.push(rows[idx[k]].base - rows[idx[k - 1]].base);
    const med = median(pitches.slice(1)) || 12;
    const bodyFs = median(idx.map((i) => rows[i].fs));
    // rows that stand apart: a single column of text with extra space above (a heading), or sentence-like text
    const prose = (i) => {
      const segs = rows[i].segs;
      if (segs.length < 3) return false;
      const txt = segs.map((g) => g.frags.map((f) => f.s).join(' ').trim());
      return txt.slice(1).every((t) => /^[a-z]/.test(t));
    };
    const apart = idx.map((i, k) => prose(i) || (nCols(i) < 2 && (k === 0 || k === idx.length - 1 || pitches[k] > 1.3 * med || rows[i].fs > 1.1 * bodyFs || rows[i].frags.every((f) => f.bold))));
    const runs = [];
    let cur = null;
    idx.forEach((i, k) => {
      if (apart[k]) { if (cur) runs.push(cur); cur = null; return; }
      if (cur) cur[1] = i; else cur = [i, i];
      // a big vertical gap also separates two tables
      const next = idx[k + 1];
      if (next !== undefined && !apart[k + 1] && pitches[k + 1] > 1.9 * med && pitches[k + 1] > rows[next].fs * 2.4) { runs.push(cur); cur = null; }
    });
    if (cur) runs.push(cur);
    const kept = runs.filter((r) => r[1] - r[0] + 1 >= 2);
    const cutAnything = apart.some(Boolean) || runs.length > 1;
    return { runs: kept, cut: cutAnything };
  }

  function subRow(row, segs) {
    const r = { ...row, segs: [] };
    r.segs = segs.map((s) => ({ ...s, row: r }));
    r.frags = segs.flatMap((s) => s.frags);
    return r;
  }

  function rowsToBlocks(rows, env, depth) {
    const { page, fsBody, opts } = env;
    const blocks = [];
    const accepted = [];
    const accept = (lo, hi, guard) => {
      const sub = rows.slice(lo, hi + 1);
      const bands = findBands(sub, fsBody);
      for (const band of bands) {
        band.start += lo; band.last += lo;
        const cols = bandColumns(band, rows);
        const kind = classifyBand(cols);
        band.cols = cols; band.kind = kind;
        if (kind === 'marker') continue;
        const n = rows.slice(band.start, band.last + 1).filter((r) => !r.barrier).length;
        if (kind === 'cols') { if (n >= 6) accepted.push(band); continue; }
        const ref = refineTableBand(band, rows);
        if (!ref.cut || guard >= 4) {
          if (ref.runs.length) { band.aligned = band.aligned !== false; accepted.push(band); }
          continue;
        }
        for (const [a, z] of ref.runs) if (z - a + 1 >= 3) accept(a, z, guard + 1);
        for (const [a, z] of ref.runs) if (z - a + 1 === 2) {
          // two-row blocks: only when both rows have two or more columns
          accept(a, z, guard + 1);
        }
      }
    };
    if (!(opts.columns === false || depth > 1)) accept(0, rows.length - 1, 0);
    const inBand = new Array(rows.length).fill(null);
    const elems = [];
    for (const band of accepted) {
      const rs = rows.slice(band.start, band.last + 1).filter((r) => !r.barrier);
      band.top = Math.min(...rs.map((r) => r.top)); band.bot = Math.max(...rs.map((r) => r.bot));
      band.x0 = Math.min(...band.cols.map((c) => c.x0)); band.x1 = Math.max(...band.cols.map((c) => c.x1));
      for (let i = band.start; i <= band.last; i++) inBand[i] = band;
      env.out.bands.push(band);
      elems.push({ kind: 'band', top: band.top, bot: band.bot, x0: band.x0, band });
    }
    rows.forEach((r, i) => {
      if (inBand[i] || r.barrier) return;
      elems.push({ kind: 'row', top: r.top, bot: r.bot, x0: r.segs[0] ? r.segs[0].x0 : 0, row: r });
    });
    for (const t of env.tables || []) elems.push({ kind: 'table', top: t.y0, bot: t.y1, x0: t.x0, table: t });
    // pictures that sit inside a column of a band travel with that column
    const colImages = new Map();
    for (const im of env.images || []) {
      let placed = false;
      for (const b of accepted) {
        if (b.kind !== 'cols') continue;
        const cx = (im.x0 + im.x1) / 2, cy = (im.y0 + im.y1) / 2;
        if (cy >= b.top - 6 && cy <= b.bot + 6 && cx >= b.x0 - 6 && cx <= b.x1 + 6) {
          const k = b.cols.findIndex((c) => cx >= c.lo && cx < c.hi);
          if (k >= 0) { const key = b.cols[k]; if (!colImages.has(key)) colImages.set(key, []); colImages.get(key).push(im); placed = true; break; }
        }
      }
      if (!placed) elems.push({ kind: 'image', top: im.y0, bot: im.y1, x0: im.x0, im });
    }
    elems.sort((a, b) => (a.top - b.top) || (a.x0 - b.x0));

    let flow = null;
    const flush = () => { if (flow && flow.lines.length) blocks.push(flow); flow = null; };
    for (const e of elems) {
      if (e.kind === 'row') {
        if (!flow) flow = { kind: 'flow', lines: [], page: page.num };
        flow.lines.push(rowToLine(e.row, e.row.segs, page.num, depth > 0));
      } else if (e.kind === 'image') {
        flush();
        blocks.push({ kind: 'image', img: e.im, page: page.num });
      } else if (e.kind === 'table') {
        flush();
        blocks.push({ kind: 'table', table: e.table, page: page.num });
      } else if (e.kind === 'band') {
        flush();
        const b = e.band;
        if (b.kind === 'cols') {
          b.cols.forEach((c, k) => {
            const byRow = new Map();
            for (const s of c.segs) { if (!byRow.has(s.row)) byRow.set(s.row, []); byRow.get(s.row).push(s); }
            const colRows = [...byRow.entries()].sort((p, q) => p[0].base - q[0].base).map(([row, segs]) => subRow(row, segs));
            const sub = rowsToBlocks(colRows, { page, fsBody, opts, images: colImages.get(c) || [], tables: [], out: env.out }, depth + 1);
            for (const sb of sub) {
              if (sb.kind === 'flow' || sb.kind === 'table') { sb.columns = b.cols.length; sb.colIndex = k; sb.col = { x0: c.x0, x1: c.x1 }; }
              blocks.push(sb);
            }
          });
        } else {
          blocks.push({ kind: 'table', table: looseTable(b, rows, page), page: page.num });
        }
      }
    }
    flush();
    return blocks;
  }

  function layoutPage(page, opts = {}) {
    const frags = page.frags.filter((f) => f.s.trim());
    for (const f of frags) f.s = cleanText(f.s);
    page.frags = frags.filter((f) => f.s.trim());
    // links
    for (const f of page.frags) {
      const cx = (f.x0 + f.x1) / 2, cy = f.base - 0.3 * f.fs;
      for (const l of page.links) if (cx >= l.x0 && cx <= l.x1 && cy >= l.y0 - 1 && cy <= l.y1 + 1) { f.url = l.url; break; }
    }
    consumeTextRules(page);

    const out = { num: page.num, w: page.w, h: page.h, blocks: [], tables: [], bands: [], rawFrags: page.frags };
    const fsBody = dominantFs(page.frags) || 10;

    // pictures: drop page-size backgrounds when there is text
    let images = (page.images || []).filter((im) => im.crop);
    // a figure swallows the labels, lines and shapes that were drawn inside it
    for (const im of images.filter((i) => i.figure)) {
      const inside = (x, y) => x >= im.x0 && x <= im.x1 && y >= im.y0 && y <= im.y1;
      page.frags = page.frags.filter((f) => !inside((f.x0 + f.x1) / 2, f.base - 0.3 * f.fs));
      page.rules = page.rules.filter((r) => !(r.h ? inside((r.x0 + r.x1) / 2, r.y) : inside(r.x, (r.y0 + r.y1) / 2)));
      page.fills = page.fills.filter((f) => !inside((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2));
      images = images.filter((o) => o === im || o.figure || !inside((o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2));
    }
    if (page.frags.length) images = images.filter((im) => (im.x1 - im.x0) * (im.y1 - im.y0) < 0.8 * page.w * page.h);

    /* ruled tables claim the text inside them */
    const ruled = opts.tables === false ? [] : detectRuledTables(page);
    const claimed = new Set();
    for (const t of ruled) {
      applyFills(t, page.fills);
      for (const f of page.frags) {
        const cx = (f.x0 + f.x1) / 2, cy = f.base - 0.3 * f.fs;
        if (cx < t.x0 - 1.5 || cx > t.x1 + 1.5 || cy < t.y0 - 1.5 || cy > t.y1 + 1.5) continue;
        const cell = t.cells.find((c) => cx >= c.x0 - 1 && cx <= c.x1 + 1 && cy >= c.y0 - 1 && cy <= c.y1 + 1);
        if (cell) { (cell.frags = cell.frags || []).push(f); claimed.add(f); }
      }
      for (const cell of t.cells) {
        const rows = buildRows(cell.frags || []);
        cell.lines = rows.map((r) => rowToLine(r, r.segs, page.num, true));
      }
      for (const im of images) {
        const cx = (im.x0 + im.x1) / 2, cy = (im.y0 + im.y1) / 2;
        if (cx < t.x0 || cx > t.x1 || cy < t.y0 || cy > t.y1) continue;
        const cell = t.cells.find((c) => cx >= c.x0 && cx <= c.x1 && cy >= c.y0 && cy <= c.y1);
        if (cell) { cell.images.push(im); im.taken = true; }
      }
      out.tables.push(t);
    }
    images = images.filter((im) => !im.taken);

    const rest = page.frags.filter((f) => !claimed.has(f));
    const rows = buildRows(rest);
    // tables and wide pictures separate what is above them from what is below
    for (const t of ruled) rows.push(barrier((t.y0 + t.y1) / 2));
    for (const im of images) if (im.x1 - im.x0 > 0.55 * page.w) rows.push(barrier((im.y0 + im.y1) / 2));
    rows.sort((a, b) => a.base - b.base);

    const env = { page, fsBody, opts, images, tables: ruled, out };
    out._rows = rows;
    out.blocks = rowsToBlocks(rows, env, 0);

    /* bullets drawn as little shapes instead of text */
    if (page.bullets && page.bullets.length) {
      const all = [];
      const collect = (blocks) => { for (const b of blocks) { if (b.kind === 'flow') all.push(...b.lines); else if (b.kind === 'table') for (const c of b.table.cells) all.push(...c.lines); } };
      collect(out.blocks);
      for (const line of all) {
        if (line.parts) continue;
        for (const s of page.bullets) {
          if (s.used) continue;
          const cy = (s.y0 + s.y1) / 2;
          if (Math.abs(cy - (line.base - 0.3 * line.fs)) > 0.4 * line.fs) continue;
          if (s.x1 > line.x0 - 0.1 * line.fs || s.x1 < line.x0 - 4 * line.fs) continue;
          if (s.y1 - s.y0 > 0.95 * line.fs) continue;
          line.bullet = s; s.used = true; break;
        }
      }
    }
    return out;
  }

  /* A table inferred from alignment (no ruling lines). */
  function looseTable(band, rows, page) {
    const cols = band.cols;
    const bounds = [band.x0 - 2, ...band.gutters.map((g) => (g.x0 + g.x1) / 2), band.x1 + 4];
    // rows of text -> table rows
    const items = [];
    const byRow = new Map();
    cols.forEach((c, k) => { for (const s of c.segs) { if (!byRow.has(s.row)) byRow.set(s.row, []); byRow.get(s.row).push({ s, k }); } });
    for (const [row, list] of byRow) items.push({ row, list });
    items.sort((a, b) => a.row.base - b.row.base);
    const hr = mergeRules(page.rules, true).filter((r) => r.x1 - r.x0 >= 0.5 * (band.x1 - band.x0));
    const trows = [];
    if (band.aligned === false) trows.push(items);
    else {
      const colsOf = (it) => new Set(it.list.map((e) => e.k));
      items.forEach((it, i) => {
        let join = false;
        if (i > 0) {
          const first = trows[trows.length - 1][0];
          const pitch = it.row.base - items[i - 1].row.base;
          const a = colsOf(it), f = colsOf(first);
          const sub = a.size < f.size && [...a].every((k) => f.has(k));
          const ruleBetween = hr.some((r) => r.y > items[i - 1].row.base && r.y < it.row.top + 1 && r.x0 < band.x1 && r.x1 > band.x0);
          join = sub && pitch < 1.55 * it.row.fs && !ruleBetween;
        }
        if (join) trows[trows.length - 1].push(it); else trows.push([it]);
      });
    }
    const R = trows.length, C = cols.length;
    const ys = [];
    trows.forEach((tr, r) => {
      const top = Math.min(...tr.map((it) => it.row.top)), bot = Math.max(...tr.map((it) => it.row.bot));
      if (r === 0) ys.push(top - 2);
      if (r + 1 < R) {
        const nextTop = Math.min(...trows[r + 1].map((it) => it.row.top));
        ys.push((bot + nextTop) / 2);
      } else ys.push(bot + 2);
    });
    const cells = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const cell = { r0: r, c0: c, r1: r + 1, c1: c + 1, x0: bounds[c], x1: bounds[c + 1], y0: ys[r], y1: ys[r + 1], lines: [], images: [], borders: {}, fill: null };
      const bySeg = new Map();
      for (const it of trows[r]) for (const e of it.list) if (e.k === c) { if (!bySeg.has(it.row)) bySeg.set(it.row, []); bySeg.get(it.row).push(e.s); }
      cell.lines = [...bySeg.entries()].sort((p, q) => p[0].base - q[0].base).map(([row, segs]) => rowToLine(row, segs, page.num, true));
      cells.push(cell);
    }
    const t = { ruled: false, xs: bounds, ys, cells, x0: bounds[0], x1: bounds[bounds.length - 1], y0: ys[0], y1: ys[ys.length - 1] };
    // borders from rules, shading from fills
    for (const cell of cells) {
      const rb = (y) => { const h = hr.find((r) => Math.abs(r.y - y) < 4 && r.x0 <= cell.x1 && r.x1 >= cell.x0); return h ? { w: h.w, color: h.color } : null; };
      cell.borders.t = rb(cell.y0); cell.borders.b = rb(cell.y1);
    }
    applyFills(t, page.fills);
    // the edges of a table follow the shading behind its cells
    const C2 = cols.length;
    const firstC = cells.find((c) => c.c0 === 0 && c.fillRect), lastC = cells.find((c) => c.c1 === C2 && c.fillRect);
    if (firstC && bounds[0] - firstC.fillRect.x0 > 0 && bounds[0] - firstC.fillRect.x0 <= 60) bounds[0] = firstC.fillRect.x0;
    if (lastC && lastC.fillRect.x1 - bounds[C2] > 0 && lastC.fillRect.x1 - bounds[C2] <= 160) bounds[C2] = lastC.fillRect.x1;
    for (let k = 1; k < C2; k++) {
      const left = cells.find((c) => c.c1 === k && c.fillRect);
      if (left) { const e = left.fillRect.x1; if (Math.abs(e - bounds[k]) <= 30 && e > bounds[k - 1] + 10) bounds[k] = e; }
    }
    for (const cell of cells) { cell.x0 = bounds[cell.c0]; cell.x1 = bounds[cell.c1]; }
    t.x0 = bounds[0]; t.x1 = bounds[C2];
    return t;
  }

  return { layoutPage, buildRows, makeLine, rowToLine, cleanText, median, sum, dominantFs, dark, colorDist, _debug: { findStrips, findBands } };
})();
