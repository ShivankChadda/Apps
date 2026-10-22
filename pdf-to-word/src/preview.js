/* preview.js: show the recovered document on screen the way Word will lay it out (roughly). */
const Preview = (() => {
  'use strict';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const px = (v) => (Math.round(v * 100) / 100) + 'px';

  function roman(n) {
    const map = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    let out = '';
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
  }
  function letters(n) { let s = ''; while (n > 0) { n--; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); } return s; }
  function formatNum(n, fmt) {
    switch (fmt) {
      case 'lowerLetter': return letters(n);
      case 'upperLetter': return letters(n).toUpperCase();
      case 'lowerRoman': return roman(n);
      case 'upperRoman': return roman(n).toUpperCase();
      default: return String(n);
    }
  }

  const fontStack = (r) => {
    const f = r.face || 'Arial';
    const tail = r.mono ? 'monospace' : /times|georgia|garamond|cambria|palatino|serif|book/i.test(f) && !/sans/i.test(f) ? 'serif' : 'sans-serif';
    return `'${f.replace(/['"]/g, '')}', ${tail}`;
  };

  function renderRuns(runs, k, base) {
    let out = '';
    for (const r of runs) {
      if (r.tab) continue;
      let st = '';
      if (r.face && r.face !== base.face) st += `font-family:${fontStack(r)};`;
      let size = r.size || base.size;
      if (r.sup || r.sub) st += `font-size:${px(size * k * 0.62)};vertical-align:${r.sup ? 'super' : 'sub'};line-height:0;`;
      else if (Math.abs(size - base.size) >= 0.25) st += `font-size:${px(size * k)};`;
      if (r.bold !== base.bold) st += `font-weight:${r.bold ? 700 : 400};`;
      if (r.italic !== base.italic) st += `font-style:${r.italic ? 'italic' : 'normal'};`;
      if ((r.color || null) !== (base.color || null)) st += `color:${r.color || 'inherit'};`;
      if (r.underline) st += 'text-decoration:underline;';
      if (r.strike) st += 'text-decoration:line-through;';
      if (r.spacing) st += `letter-spacing:${px(r.spacing * k)};`;
      let t = esc(r.text);
      if (r.field) t = r.field === 'PAGE' ? '1' : '1';
      let html = st ? `<span style="${st}">${t}</span>` : t;
      if (r.url) html = `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      out += html;
    }
    return out;
  }

  function borderCss(side, b, k) { return `border-${side}:${px(Math.max(0.6, b.w * k))} solid ${b.color || 'currentColor'};`; }

  function render(doc, opts = {}) {
    const k = opts.scale || 1;
    const urls = [];
    const listState = new Map();
    const defaults = doc.defaults || { face: 'Arial', size: doc.bodyFs || 11, bold: false, italic: false, color: null };
    const baseFor = (p) => {
      if (p.heading) {
        const f = doc.headingBase && doc.headingBase[p.heading === 'title' ? 'Title' : 'Heading' + p.heading];
        if (f) return f;
      }
      return defaults;
    };

    const markerText = (p) => {
      const L = p.list;
      if (!L) return '';
      let st = listState.get(L);
      if (!st) { st = { counters: [] }; listState.set(L, st); }
      const lvl = p.level || 0;
      const info = L.levelsInfo[lvl] || L.levelsInfo[0] || p.marker;
      if (info.kind === 'bullet') {
        for (let i = lvl + 1; i < 9; i++) st.counters[i] = undefined;
        return ({ '·': '•', '∙': '•', '●': '•', '-': '–', '−': '–', '—': '–' })[info.text] || info.text;
      }
      st.counters[lvl] = st.counters[lvl] === undefined ? (p.marker.value || 1) : st.counters[lvl] + 1;
      for (let i = lvl + 1; i < 9; i++) st.counters[i] = undefined;
      return `${info.open || ''}${formatNum(st.counters[lvl], info.fmt)}${info.close || '.'}`;
    };

    const para = (p, tag, bi) => {
      const base = baseFor(p);
      let st = '';
      const ind = p.ind || { left: 0, first: 0, right: 0 };
      if (p.before) st += `margin-top:${px(p.before * k)};`;
      if (ind.left) st += `margin-left:${px(ind.left * k)};`;
      if (ind.right) st += `margin-right:${px(ind.right * k)};`;
      if (ind.first) st += `text-indent:${px(ind.first * k)};`;
      st += `text-align:${{ both: 'justify', left: 'left', right: 'right', center: 'center' }[p.align || 'left']};`;
      st += `line-height:${p.lineHeight ? px(p.lineHeight * k) : 1.18};`;
      if (base.size !== defaults.size) st += `font-size:${px(base.size * k)};`;
      if (base.face !== defaults.face) st += `font-family:${fontStack({ face: base.face })};`;
      if (base.bold) st += 'font-weight:700;';
      if (base.italic) st += 'font-style:italic;';
      if (base.color) st += `color:${base.color};`;
      if (p.shade) st += `background:${p.shade};`;
      if (p.borderLeft) st += borderCss('left', p.borderLeft, k) + `padding-left:${px((p.borderLeft.space || 4) * k)};`;
      if (p.borderTop) st += borderCss('top', p.borderTop, k);
      if (p.borderBottom) st += borderCss('bottom', p.borderBottom, k);
      let label = p.heading === 'title' ? 'TITLE' : p.heading ? 'H' + p.heading : p.list ? 'LI' : 'P';
      let cls = 'pv-p' + (p.heading ? ' pv-h' : '') + (p.list ? ' pv-li' : '');
      let inner;
      const hasTabs = (p.runs || []).some((r) => r.tab);
      if (hasTabs) {
        const segs = [[]];
        const tabs = [];
        for (const r of p.runs) { if (r.tab) { segs.push([]); tabs.push(r); } else segs[segs.length - 1].push(r); }
        const leader = (p.tabs || []).some((t) => t.leader);
        if (leader) {
          inner = '<span class="pv-flex">' + segs.map((s, i) => `<span>${renderRuns(s, k, base)}</span>` + (i < segs.length - 1 ? '<span class="pv-leader"></span>' : '')).join('') + '</span>';
        } else {
          inner = '<span class="pv-tabs">' + segs.map((s, i) => {
            const t = (p.tabs || [])[i - 1];
            if (!i || !t) return `<span>${renderRuns(s, k, base)}</span>`;
            const pos = (t.pos - (ind.left || 0)) * k;
            if (t.type === 'right') return `<span class="pv-abs" style="right:0;text-align:right">${renderRuns(s, k, base)}</span>`;
            if (t.type === 'center') return `<span class="pv-abs" style="left:${px(pos)};transform:translateX(-50%)">${renderRuns(s, k, base)}</span>`;
            return `<span class="pv-abs" style="left:${px(pos)}">${renderRuns(s, k, base)}</span>`;
          }).join('') + '</span>';
        }
      } else inner = renderRuns(p.runs || [], k, base);
      if (p.list) {
        const hang = Math.max(0, -(ind.first || 0)) * k;
        const mk = markerText(p);
        st += `text-indent:${px(-hang)};`;
        inner = `<span class="pv-mk" style="width:${px(hang)}">${esc(mk)}</span>` + inner;
      }
      if (!inner) inner = '&nbsp;';
      return `<${tag} class="${cls}" data-tag="${label}"${bi !== undefined ? ` data-b="${bi}"` : ''} style="${st}">${inner}</${tag}>`;
    };

    const image = (b, k2, maxW, bi) => {
      const im = b.img;
      let w = im.x1 - im.x0, h = im.y1 - im.y0;
      if (maxW && w > maxW) { h = h * maxW / w; w = maxW; }
      const blob = new Blob([im.crop.data], { type: 'image/' + im.crop.ext });
      const url = URL.createObjectURL(blob);
      urls.push(url);
      const ref = b.ref || { left: 0, right: w };
      const cx = (im.x0 + im.x1) / 2, mid = (ref.left + ref.right) / 2;
      let jc = 'left', ml = 0;
      if (Math.abs(cx - mid) < 6) jc = 'center'; else if (im.x1 >= ref.right - 4 && im.x0 > ref.left + 0.25 * (ref.right - ref.left)) jc = 'right'; else ml = Math.max(0, im.x0 - ref.left);
      return `<p class="pv-p pv-img" data-tag="IMG"${bi !== undefined ? ` data-b="${bi}"` : ''} style="margin-top:${px((b.before || 0) * k2)};margin-left:${px(ml * k2)};text-align:${jc}"><img alt="" src="${url}" style="width:${px(w * k2)};height:${px(h * k2)}"></p>`;
    };

    const table = (t, bi) => {
      const widths = [];
      for (let c = 0; c < t.C; c++) widths.push(Math.max(1, t.xs[c + 1] - t.xs[c]));
      const total = widths.reduce((a, b) => a + b, 0);
      let h = `<table class="pv-tbl" data-tag="TABLE" data-b="${bi}" style="width:${px(total * k)};margin-left:${px(Math.max(-40, t.x0 - t.ref.left) * k)};margin-top:${px((t.before || 0) * k)}"><colgroup>` + widths.map((w) => `<col style="width:${px(w * k)}">`).join('') + '</colgroup>';
      const byRow = Array.from({ length: t.R }, () => []);
      for (const c of t.cells) byRow[c.r0].push(c);
      for (let r = 0; r < t.R; r++) {
        h += `<tr style="height:${px((t.ys[r + 1] - t.ys[r]) * k)}">`;
        for (const c of byRow[r].sort((a, b) => a.c0 - b.c0)) {
          let st = `padding:${px(t.padT * k)} ${px(Math.max(1, t.padL - 3) * k)} ${px(t.padB * k)} ${px(t.padL * k)};vertical-align:${c.valign === 'center' ? 'middle' : c.valign === 'bottom' ? 'bottom' : 'top'};`;
          if (c.fill) st += `background:${c.fill};`;
          if (c.borders) for (const [side, key] of [['top', 't'], ['left', 'l'], ['bottom', 'b'], ['right', 'r']]) if (c.borders[key]) st += borderCss(side, c.borders[key], k);
          h += `<td colspan="${c.c1 - c.c0}" rowspan="${c.r1 - c.r0}" style="${st}">`;
          for (const b of c.blocks) h += b.type === 'p' ? para(b, 'div') : image(b, k, (c.x1 - c.x0) - 2 * t.padL);
          if (!c.blocks.length) h += '&nbsp;';
          h += '</td>';
        }
        h += '</tr>';
      }
      return h + '</table>';
    };

    const pg = doc.page, m = pg.margins;
    let html = '';
    if (doc.header.length) html += '<div class="pv-hf pv-hdr" data-tag="HEADER">' + doc.header.map((h) => para({ ...h.p, before: 0, ind: { left: 0, first: 0, right: 0 } }, 'div')).join('') + '</div>';
    doc.blocks.forEach((b, bi) => {
      if (b.pageBreak) html += '<div class="pv-pb" aria-hidden="true"><span>page break</span></div>';
      if (b.type === 'p') html += para(b, 'p', bi);
      else if (b.type === 'img') html += image(b, k, pg.w - m.l - m.r, bi);
      else if (b.type === 'table') html += table(b, bi);
    });
    if (doc.footer.length) html += '<div class="pv-hf pv-ftr" data-tag="FOOTER">' + doc.footer.map((h) => para({ ...h.p, before: 0, ind: { left: 0, first: 0, right: 0 } }, 'div')).join('') + '</div>';
    const sheetStyle = `width:${px(pg.w * k)};padding:${px(m.t * k)} ${px(m.r * k)} ${px(m.b * k)} ${px(m.l * k)};font-family:${fontStack({ face: defaults.face })};font-size:${px(defaults.size * k)};`;
    return { html: `<div class="pv-sheet" style="${sheetStyle}">${html}</div>`, urls };
  }

  return { render };
})();
