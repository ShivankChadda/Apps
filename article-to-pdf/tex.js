/* Shared LaTeX helpers. Loaded in the page (to turn the article's DOM into LaTeX)
 * and in the service worker (to wrap that body in a full document). */
(function (root) {
  const SPECIAL = {
    '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_',
    '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
    '\u00a0': '~', '\u2009': '\\,', '\u202f': '\\,', '\u200b': '', '\u200c': '', '\u200d': '',
    '\ufeff': '', '\u2011': '-', '\u2212': '$-$', '\u00d7': '$\\times$', '\u2248': '$\\approx$',
    '\u2264': '$\\leq$', '\u2265': '$\\geq$', '\u2192': '$\\rightarrow$', '\u2190': '$\\leftarrow$',
    '\u00b5': '\\textmu{}', '\u03bc': '\\textmu{}', '\u2022': '\\textbullet{}',
    '\u00b2': '\\textsuperscript{2}', '\u00b3': '\\textsuperscript{3}', '\u2082': '\\textsubscript{2}',
    '\u20ac': '\\texteuro{}', '\u2026': '\\ldots{}', '\u00b0': '\\textdegree{}',
  };
  const KEEP = '\u2013\u2014\u2018\u2019\u201c\u201d\u2020\u2021\u2030'; // dashes, curly quotes: fine in T1

  function esc(text) {
    let out = '';
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (SPECIAL[ch] !== undefined) out += SPECIAL[ch];
      else if (c < 0x180 || KEEP.includes(ch)) out += (c < 32 && ch !== '\n' && ch !== '\t') ? '' : ch;
      else out += ch.normalize('NFKD').replace(/[^\x00-\x7f]/g, ''); // closest ASCII, else dropped
    }
    return out;
  }

  const urlEsc = (u) => u.replace(/[\\{}\s]/g, '').replace(/%/g, '\\%').replace(/#/g, '\\#');

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'BUTTON', 'FORM', 'INPUT',
    'SELECT', 'TEXTAREA', 'NAV', 'ASIDE', 'AUDIO', 'VIDEO', 'CANVAS', 'TEMPLATE']);
  const HEADING = { H1: 'section', H2: 'section', H3: 'subsection', H4: 'subsubsection',
    H5: 'paragraph', H6: 'paragraph' };

  /* Converts the children of `rootEl` to a LaTeX body.
   * Returns { body, images: [{id, url, alt}] }. */
  function domToTex(rootEl, opts) {
    opts = opts || {};
    const images = [];
    const title = (opts.title || '').trim().toLowerCase();

    function inline(node) {
      let out = '';
      for (const n of node.childNodes) out += inlineNode(n);
      return out;
    }

    function inlineNode(n) {
      if (n.nodeType === 3) return esc(n.nodeValue.replace(/\s+/g, ' '));
      if (n.nodeType !== 1 || SKIP.has(n.tagName.toUpperCase())) return '';
      const t = n.tagName.toUpperCase();
      if (t === 'IMG') return ''; // images are handled at block level
      if (t === 'BR') return '\\newline ';
      const inner = inline(n);
      if (!inner.trim()) return inner;
      switch (t) {
        case 'STRONG': case 'B': return `\\textbf{${inner}}`;
        case 'EM': case 'I': case 'CITE': return `\\textit{${inner}}`;
        case 'U': return `\\underline{${inner}}`;
        case 'CODE': case 'KBD': case 'SAMP': return `\\texttt{${inner}}`;
        case 'SUP': return `\\textsuperscript{${inner}}`;
        case 'SUB': return `\\textsubscript{${inner}}`;
        case 'A': {
          const href = n.getAttribute('href') || '';
          return /^https?:\/\//i.test(href) ? `\\href{${urlEsc(href)}}{${inner}}` : inner;
        }
        default: return inner;
      }
    }

    function imageMacro(img, caption) {
      const url = img.currentSrc || img.src || img.getAttribute('src') || '';
      if (!/^https?:\/\//i.test(url)) return '';
      const id = images.length + 1;
      images.push({ id, url, alt: img.getAttribute('alt') || '' });
      const cap = (caption || '').trim();
      return cap ? `\\articleimagecap{${id}}{${cap}}` : `\\articleimage{${id}}`;
    }

    function list(el, depth) {
      const env = el.tagName.toUpperCase() === 'OL' ? 'enumerate' : 'itemize';
      const items = [];
      for (const li of el.children) {
        if (li.tagName.toUpperCase() !== 'LI') continue;
        let text = '', nested = '';
        for (const c of li.childNodes) {
          const ct = c.nodeType === 1 ? c.tagName.toUpperCase() : '';
          if (ct === 'UL' || ct === 'OL') nested += '\n' + list(c, depth + 1);
          else if (ct === 'P' || ct === 'DIV') text += ' ' + inline(c);
          else text += inlineNode(c);
        }
        text = text.trim();
        if (text || nested) items.push(`\\item ${text}${nested}`);
      }
      if (!items.length) return '';
      return `\\begin{${env}}\n${items.join('\n')}\n\\end{${env}}`;
    }

    function table(el) {
      const rows = [...el.querySelectorAll('tr')]
        .map((r) => [...r.children].filter((c) => /^(TD|TH)$/i.test(c.tagName)).map((c) => inline(c).trim()))
        .filter((r) => r.some(Boolean));
      if (!rows.length) return '';
      const w = Math.max(...rows.map((r) => r.length));
      const spec = `p{${(0.95 / w).toFixed(2)}\\linewidth}`.repeat(w);
      const lines = rows.map((r) => r.concat(Array(w - r.length).fill('')).join(' & ') + ' \\\\');
      return `\\begin{center}\\small\\begin{tabular}{${spec}}\\hline\n${lines.join('\n')}\n\\hline\\end{tabular}\\end{center}`;
    }

    const INLINE_TAGS = new Set(['A', 'STRONG', 'B', 'EM', 'I', 'U', 'CODE', 'KBD', 'SAMP', 'SUP', 'SUB',
      'SPAN', 'SMALL', 'MARK', 'ABBR', 'CITE', 'TIME', 'BR', 'LABEL']);

    function blocks(node) {
      const out = [];
      let run = ''; // loose text and inline elements between blocks
      const flush = () => { if (run.trim()) out.push(run.trim()); run = ''; };

      for (const n of node.childNodes) {
        if (n.nodeType === 3) { run += esc(n.nodeValue.replace(/\s+/g, ' ')); continue; }
        if (n.nodeType !== 1) continue;
        const t = n.tagName.toUpperCase();
        if (SKIP.has(t)) continue;
        if (INLINE_TAGS.has(t)) {
          // an inline wrapper around a lone image is a figure (linked images)
          const img = n.querySelector && n.querySelector('img');
          if (img && !n.textContent.trim()) { flush(); const m = imageMacro(img); if (m) out.push(m); }
          else run += inlineNode(n);
          continue;
        }
        flush();
        if (HEADING[t]) {
          const text = inline(n).trim();
          const repeatsTitle = !out.length && (t === 'H1' || t === 'H2')
            && n.textContent.trim().replace(/\s+/g, ' ').toLowerCase() === title;
          if (text && !repeatsTitle) {
            out.push(HEADING[t] === 'paragraph' ? `\\paragraph*{${text}}` : `\\${HEADING[t]}*{${text}}`);
          }
        } else if (t === 'P') {
          const plain = n.textContent.trim();
          if (!out.some((x) => !x.startsWith('\\section')) && plain.length < 100
              && (/^by\s/i.test(plain) || (opts.byline && plain === opts.byline))) continue; // repeated byline
          const imgs = n.querySelectorAll('img');
          const text = inline(n).trim();
          if (text) out.push(text);
          if (imgs.length && !text) imgs.forEach((i) => { const m = imageMacro(i); if (m) out.push(m); });
        } else if (t === 'IMG') {
          const m = imageMacro(n); if (m) out.push(m);
        } else if (t === 'FIGURE') {
          const cap = n.querySelector('figcaption');
          const img = n.querySelector('img');
          if (img) { const m = imageMacro(img, cap ? inline(cap) : ''); if (m) out.push(m); }
          else if (cap && cap.textContent.trim()) out.push(`{\\small\\itshape ${inline(cap)}}`);
        } else if (t === 'UL' || t === 'OL') {
          const l = list(n, 0); if (l) out.push(l);
        } else if (t === 'BLOCKQUOTE') {
          const inner = blocks(n).join('\n\n');
          if (inner) out.push(`\\begin{quote}\n${inner}\n\\end{quote}`);
        } else if (t === 'PRE') {
          const lines = n.textContent.replace(/\s+$/, '').split('\n').map((l) => esc(l).replace(/ /g, '~'));
          out.push(`\\begin{quote}\\ttfamily\\small\n${lines.join('\\newline\n')}\n\\end{quote}`);
        } else if (t === 'TABLE') {
          const tb = table(n); if (tb) out.push(tb);
        } else if (t === 'HR') {
          out.push('\\medskip\\hrule\\medskip');
        } else if (t === 'FIGCAPTION') {
          /* handled with its figure */
        } else {
          // DIV, SECTION, ARTICLE, MAIN, …: descend
          out.push(...blocks(n));
        }
      }
      flush();
      return out;
    }

    return { body: blocks(rootEl).join('\n\n'), images };
  }

  const PREAMBLE = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern,microtype,textcomp,graphicx,parskip,xcolor}
\usepackage[margin=2.5cm]{geometry}
\usepackage[colorlinks=true,urlcolor=blue!50!black,linkcolor=black]{hyperref}
\usepackage{titlesec}
\titleformat{\section}{\large\bfseries}{}{0pt}{}
\titleformat{\subsection}{\normalsize\bfseries}{}{0pt}{}
\titleformat{\subsubsection}{\normalsize\bfseries\itshape}{}{0pt}{}
\setlength{\parindent}{0pt}
\sloppy
% a picture is shown only if its file was delivered
\newcommand{\articleimage}[1]{\IfFileExists{img#1.jpg}{\par\medskip\begin{center}\includegraphics[width=\linewidth,height=0.35\textheight,keepaspectratio]{img#1.jpg}\end{center}\medskip}{}}
\newcommand{\articleimagecap}[2]{\IfFileExists{img#1.jpg}{\par\medskip\begin{center}\includegraphics[width=\linewidth,height=0.35\textheight,keepaspectratio]{img#1.jpg}\\[3pt]{\footnotesize\itshape #2}\end{center}\medskip}{{\small\itshape #2}\par}}
`;

  function assemble(meta, body) {
    const byline = [meta.author, meta.date, meta.site].filter(Boolean).map(esc).join(' \\textperiodcentered{} ');
    return PREAMBLE + '\\begin{document}\n'
      + `{\\LARGE\\bfseries ${esc(meta.title || 'Untitled')}\\par}\n\\bigskip\n`
      + (byline ? `{\\small\\color{gray} ${byline}\\par}\n` : '')
      + '\\bigskip\\hrule\\bigskip\n\n' + body
      + `\n\n\\bigskip\\hrule\\medskip\n{\\small Source: \\url{${urlEsc(meta.url || '')}}\\par}\n\\end{document}\n`;
  }

  root.TeX = { esc, urlEsc, domToTex, assemble };
})(typeof self !== 'undefined' ? self : this);
