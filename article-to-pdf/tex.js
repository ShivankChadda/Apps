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

  function runTex(runs) {
    return runs.map((r) => {
      if (r.s === '\n') return '\\newline ';
      let x = esc(r.s);
      if (!x.trim()) return x;
      if (r.code) x = `\\texttt{${x}}`;
      if (r.b) x = `\\textbf{${x}}`;
      if (r.i) x = `\\textit{${x}}`;
      if (r.u) x = `\\underline{${x}}`;
      if (r.sup) x = `\\textsuperscript{${x}}`;
      if (r.sub) x = `\\textsubscript{${x}}`;
      if (r.href) x = `\\href{${urlEsc(r.href)}}{${x}}`;
      return x;
    }).join('');
  }

  function listTex(l) {
    const env = l.ordered ? 'enumerate' : 'itemize';
    const items = l.items.map((it) => `\\item ${runTex(it.runs)}${it.children.map((c) => '\n' + listTex(c)).join('')}`);
    return `\\begin{${env}}\n${items.join('\n')}\n\\end{${env}}`;
  }

  /* blocks -> LaTeX body */
  function renderBlocks(blocks) {
    return blocks.map((b) => {
      switch (b.type) {
        case 'h': return b.level === 1 ? `\\section*{${runTex(b.runs)}}`
          : b.level === 2 ? `\\subsection*{${runTex(b.runs)}}` : `\\subsubsection*{${runTex(b.runs)}}`;
        case 'p': return runTex(b.runs);
        case 'img': return b.caption ? `\\articleimagecap{${b.id}}{${runTex(b.caption)}}` : `\\articleimage{${b.id}}`;
        case 'list': return listTex(b);
        case 'quote': return `\\begin{quote}\n${renderBlocks(b.blocks)}\n\\end{quote}`;
        case 'pre': return `\\begin{quote}\\ttfamily\\small\n${b.lines.map((l) => esc(l).replace(/ /g, '~')).join('\\newline\n')}\n\\end{quote}`;
        case 'table': {
          const w = Math.max(...b.rows.map((r) => r.length));
          const spec = `p{${(0.95 / w).toFixed(2)}\\linewidth}`.repeat(w);
          const lines = b.rows.map((r) => r.map(runTex).concat(Array(w - r.length).fill('')).join(' & ') + ' \\\\');
          return `\\begin{center}\\small\\begin{tabular}{${spec}}\\hline\n${lines.join('\n')}\n\\hline\\end{tabular}\\end{center}`;
        }
        case 'hr': return '\\medskip\\hrule\\medskip';
        default: return '';
      }
    }).filter(Boolean).join('\n\n');
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

  root.TeX = { esc, urlEsc, renderBlocks, assemble };
})(typeof self !== 'undefined' ? self : this);
