/* Runs in the page. Turns the article's DOM into a plain list of blocks, which the two
 * renderers (LaTeX in tex.js, built-in PDF in offscreen.js) both consume.
 *
 * block  = {type:'h', level:1|2|3, runs} | {type:'p', runs} | {type:'img', id, caption}
 *        | {type:'list', ordered, items:[{runs, children:[block]}]} | {type:'quote', blocks}
 *        | {type:'pre', lines} | {type:'table', rows:[[runs]]} | {type:'hr'}
 * run    = {s, b?, i?, u?, code?, sup?, sub?, href?}   ('\n' is a line break)
 */
(function (root) {
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'BUTTON', 'FORM', 'INPUT',
    'SELECT', 'TEXTAREA', 'NAV', 'ASIDE', 'AUDIO', 'VIDEO', 'CANVAS', 'TEMPLATE']);
  const HEADING = { H1: 1, H2: 1, H3: 2, H4: 3, H5: 3, H6: 3 };
  const INLINE_TAGS = new Set(['A', 'STRONG', 'B', 'EM', 'I', 'U', 'CODE', 'KBD', 'SAMP', 'SUP', 'SUB',
    'SPAN', 'SMALL', 'MARK', 'ABBR', 'CITE', 'TIME', 'BR', 'LABEL']);
  const STYLE = { STRONG: 'b', B: 'b', EM: 'i', I: 'i', CITE: 'i', U: 'u', CODE: 'code', KBD: 'code', SAMP: 'code', SUP: 'sup', SUB: 'sub' };

  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  function runsOf(node, style, out) {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { out.push({ s: n.nodeValue.replace(/\s+/g, ' '), ...style }); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName.toUpperCase();
      if (SKIP.has(t) || t === 'IMG') continue;
      if (t === 'BR') { out.push({ s: '\n' }); continue; }
      let st = style;
      if (STYLE[t]) st = { ...style, [STYLE[t]]: true };
      if (t === 'A' && /^https?:\/\//i.test(n.getAttribute('href') || '')) st = { ...st, href: n.getAttribute('href') };
      runsOf(n, st, out);
    }
    return out;
  }

  /* trim, collapse doubled spaces across runs, drop empties; [] when there is no visible text */
  function tidy(runs) {
    const out = [];
    for (const r of runs) {
      let s = r.s;
      const prev = out[out.length - 1];
      if ((!prev || prev.s === '\n' || /\s$/.test(prev.s)) && r.s !== '\n') s = s.replace(/^ /, '');
      if (r.s === '\n' && prev) prev.s = prev.s.replace(/ $/, '');
      if (s) out.push({ ...r, s });
    }
    while (out.length && out[out.length - 1].s === '\n') out.pop();
    if (out.length) out[out.length - 1].s = out[out.length - 1].s.replace(/ $/, '');
    const kept = out.filter((r) => r.s !== '');
    return kept.some((r) => r.s.trim()) ? kept : [];
  }

  const inlineRuns = (node) => tidy(runsOf(node, {}, []));
  const plain = (runs) => runs.map((r) => r.s).join('');

  function domToBlocks(rootEl, opts) {
    opts = opts || {};
    const images = [];
    const title = norm(opts.title || '').toLowerCase();

    function image(img, caption) {
      const url = img.currentSrc || img.src || img.getAttribute('src') || '';
      if (!/^https?:\/\//i.test(url)) return null;
      const id = images.length + 1;
      images.push({ id, url, alt: img.getAttribute('alt') || '' });
      return { type: 'img', id, caption: caption && caption.length ? caption : null };
    }

    function list(el) {
      const items = [];
      for (const li of el.children) {
        if (li.tagName.toUpperCase() !== 'LI') continue;
        let runs = [], children = [];
        for (const c of li.childNodes) {
          const ct = c.nodeType === 1 ? c.tagName.toUpperCase() : '';
          if (ct === 'UL' || ct === 'OL') { const l = list(c); if (l) children.push(l); }
          else if (ct === 'P' || ct === 'DIV') { runs.push({ s: ' ' }); runsOf(c, {}, runs); }
          else if (c.nodeType === 3) runs.push({ s: c.nodeValue.replace(/\s+/g, ' ') });
          else if (c.nodeType === 1 && !SKIP.has(ct)) runsOf({ childNodes: [c] }, {}, runs);
        }
        runs = tidy(runs);
        if (runs.length || children.length) items.push({ runs, children });
      }
      return items.length ? { type: 'list', ordered: el.tagName.toUpperCase() === 'OL', items } : null;
    }

    function table(el) {
      const rows = [...el.querySelectorAll('tr')]
        .map((r) => [...r.children].filter((c) => /^(TD|TH)$/i.test(c.tagName)).map(inlineRuns))
        .filter((r) => r.some((c) => c.length));
      return rows.length ? { type: 'table', rows } : null;
    }

    function blocks(node) {
      const out = [];
      let run = [];
      const flush = () => { const r = tidy(run); if (r.length) out.push({ type: 'p', runs: r }); run = []; };
      const push = (b) => { if (b) out.push(b); };

      for (const n of node.childNodes) {
        if (n.nodeType === 3) { run.push({ s: n.nodeValue.replace(/\s+/g, ' ') }); continue; }
        if (n.nodeType !== 1) continue;
        const t = n.tagName.toUpperCase();
        if (SKIP.has(t)) continue;
        if (INLINE_TAGS.has(t)) {
          const img = n.querySelector && n.querySelector('img');
          if (img && !n.textContent.trim()) { flush(); push(image(img)); } // linked picture
          else runsOf({ childNodes: [n] }, {}, run);
          continue;
        }
        flush();
        if (HEADING[t]) {
          const runs = inlineRuns(n);
          const repeatsTitle = !out.length && (t === 'H1' || t === 'H2') && norm(n.textContent).toLowerCase() === title;
          if (runs.length && !repeatsTitle) out.push({ type: 'h', level: HEADING[t], runs });
        } else if (t === 'P') {
          const runs = inlineRuns(n);
          const text = plain(runs);
          const onlyHeadings = out.every((b) => b.type === 'h');
          if (onlyHeadings && text.length < 100 && (/^by\s/i.test(text) || (opts.byline && text === opts.byline))) continue; // repeated byline
          if (runs.length) out.push({ type: 'p', runs });
          else n.querySelectorAll('img').forEach((i) => push(image(i)));
        } else if (t === 'IMG') {
          push(image(n));
        } else if (t === 'FIGURE') {
          const cap = n.querySelector('figcaption');
          const img = n.querySelector('img');
          const capRuns = cap ? inlineRuns(cap) : [];
          if (img) push(image(img, capRuns));
          else if (capRuns.length) out.push({ type: 'p', runs: capRuns.map((r) => ({ ...r, i: true })) });
        } else if (t === 'UL' || t === 'OL') {
          push(list(n));
        } else if (t === 'BLOCKQUOTE') {
          const inner = blocks(n);
          if (inner.length) out.push({ type: 'quote', blocks: inner });
        } else if (t === 'PRE') {
          out.push({ type: 'pre', lines: n.textContent.replace(/\s+$/, '').split('\n') });
        } else if (t === 'TABLE') {
          push(table(n));
        } else if (t === 'HR') {
          out.push({ type: 'hr' });
        } else if (t === 'FIGCAPTION') {
          /* handled with its figure */
        } else {
          out.push(...blocks(n)); // DIV, SECTION, ARTICLE, MAIN, …: descend
        }
      }
      flush();
      return out;
    }

    return { blocks: blocks(rootEl), images };
  }

  root.Blocks = { domToBlocks, plain };
})(typeof self !== 'undefined' ? self : this);
