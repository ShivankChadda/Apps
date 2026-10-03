/*!
 * md2tex — Markdown → LaTeX converter.
 *
 * Runs in the browser (window.MD2TeX) and in Node (require). It is a pure function:
 *   MD2TeX.convert(markdownText, options) -> { tex, warnings, assets, meta, stats, ... }
 *
 * Parsing is done by the vendored `marked` lexer (GFM tables, task lists, strikethrough,
 * autolinks, ...). Math, footnotes and a few LaTeX-friendly extras are added as lexer
 * extensions; everything is then rendered to LaTeX by the code below.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../vendor/marked.umd.js'), require('./tables.js'), require('./preamble.js'));
  } else {
    root.MD2TeX = factory(root.marked, root.MD2TeXTables, root.MD2TeXPreamble);
  }
})(typeof self !== 'undefined' ? self : this, function (markedLib, T, P) {
  'use strict';

  const VERSION = '1.0.0';

  const DEFAULTS = {
    documentClass: 'article', // article | report | book
    paper: 'a4',              // a4 | letter
    fontSize: 11,             // 10 | 11 | 12
    font: 'latinmodern',      // latinmodern | times | palatino
    margins: 'normal',        // narrow | normal | wide
    lineSpacing: 1,           // 1 | 1.15 | 1.25 | 1.66
    paragraphStyle: 'spaced', // spaced | indented
    engine: 'xelatex',        // xelatex | lualatex | pdflatex
    titlePage: 'auto',        // auto | yes | no
    toc: true,
    tocDepth: 3,              // number of heading levels listed in the table of contents
    numbering: 'auto',        // auto | yes | no
    headerFooter: true,
    pageBreaks: 'none',       // none | sections
    theme: 'color',           // color | print
    codeLineNumbers: false,
    hardBreaks: false,        // treat single newlines as line breaks
    stripMdToc: true,         // drop a hand-written "Table of contents" section
    title: '', subtitle: '', author: '',
    dateMode: 'auto',         // auto | today | none | custom
    dateText: '',
    extraPreamble: '',
    fileName: '',
    resolveAsset: null        // (path) => { id, name, ext, convert?, dataUri? } | null
  };

  const oneOf = (v, list, d) => (list.indexOf(v) >= 0 ? v : d);
  const num = (v, list, d) => { const n = Number(v); return list.indexOf(n) >= 0 ? n : d; };

  function normalizeOptions(user) {
    const o = Object.assign({}, DEFAULTS, user || {});
    o.documentClass = oneOf(o.documentClass, ['article', 'report', 'book'], 'article');
    o.paper = oneOf(o.paper, ['a4', 'letter'], 'a4');
    o.fontSize = num(o.fontSize, [10, 11, 12], 11);
    o.font = oneOf(o.font, ['latinmodern', 'times', 'palatino'], 'latinmodern');
    o.margins = oneOf(o.margins, ['narrow', 'normal', 'wide'], 'normal');
    o.lineSpacing = num(o.lineSpacing, [1, 1.15, 1.25, 1.66], 1);
    o.paragraphStyle = oneOf(o.paragraphStyle, ['spaced', 'indented'], 'spaced');
    o.engine = oneOf(o.engine, ['xelatex', 'lualatex', 'pdflatex'], 'xelatex');
    o.titlePage = oneOf(String(o.titlePage), ['auto', 'yes', 'no'], 'auto');
    o.tocDepth = num(o.tocDepth, [1, 2, 3, 4], 3);
    o.numbering = oneOf(String(o.numbering), ['auto', 'yes', 'no'], 'auto');
    o.pageBreaks = oneOf(o.pageBreaks, ['none', 'sections'], 'none');
    o.theme = oneOf(o.theme, ['color', 'print'], 'color');
    o.dateMode = oneOf(o.dateMode, ['auto', 'today', 'none', 'custom'], 'auto');
    ['toc', 'headerFooter', 'codeLineNumbers', 'hardBreaks', 'stripMdToc'].forEach(k => { o[k] = !!o[k]; });
    ['title', 'subtitle', 'author', 'dateText', 'extraPreamble', 'fileName'].forEach(k => { o[k] = o[k] == null ? '' : String(o[k]); });
    return o;
  }

  // =====================================================================
  //  Small text helpers
  // =====================================================================

  const TEX_ESC = {
    '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#',
    '^': '\\textasciicircum{}', '_': '\\_', '%': '\\%', '~': '\\textasciitilde{}'
  };
  const RE_TEX_SPECIAL = /[\\{}$&#^_%~]/g;
  const escapeAscii = s => s.replace(RE_TEX_SPECIAL, c => TEX_ESC[c]);

  function slugify(text) {
    return String(text).toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\p{M}\- _]/gu, '')
      .replace(/ /g, '-');
  }
  const labelFromSlug = slug => 'sec:' + slug.replace(/[^A-Za-z0-9-]/g, c => 'x' + c.codePointAt(0).toString(16));

  function humanize(name) {
    const base = String(name || '').replace(/^.*[\\/]/, '').replace(/\.[A-Za-z0-9]+$/, '');
    const words = base.replace(/[_\-.]+/g, ' ').trim();
    return words ? words.replace(/\b([a-z])/g, (m, c) => c.toUpperCase()) : '';
  }

  /** Expand tabs to the next multiple of 4 columns (what an editor shows). */
  function expandTabs(line) {
    if (line.indexOf('\t') < 0) return line;
    let out = '';
    for (const ch of line) out += ch === '\t' ? ' '.repeat(4 - (out.length % 4)) : ch;
    return out;
  }

  // Very long unbreakable tokens (identifiers, hashes, paths) would run into the margin: give TeX break
  // points. Ordinary long words are left alone so TeX can hyphenate them properly.
  function breakLongWord(w) {
    if (w.length < 36 && !/[_\/.:=,;?&-]/.test(w)) return w;
    let out = '';
    let run = 0;
    for (const ch of w) {
      out += ch; run++;
      if ((run >= 8 && '_/.-:=,;?&'.indexOf(ch) >= 0) || run >= 24) { out += '\u0002'; run = 0; }
    }
    return out;
  }

  /**
   * Look at the first bytes of an image file. Returns what the host app needs to decide whether the
   * picture can go into LaTeX as it is or must be re-encoded to a plain 8-bit PNG first
   * (16-bit or interlaced PNG, GIF, WebP, SVG, BMP, TIFF, CMYK JPEG).
   */
  function sniffImage(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const u32 = o => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
    const ascii = (o, n) => String.fromCharCode.apply(null, Array.from(b.slice(o, o + n)));
    const info = { format: 'unknown', width: 0, height: 0, bitDepth: 0, interlaced: false, normalize: true };
    if (b.length >= 26 && b[0] === 0x89 && ascii(1, 3) === 'PNG') {
      info.format = 'png'; info.width = u32(16); info.height = u32(20); info.bitDepth = b[24]; info.interlaced = b[28] === 1;
      info.normalize = info.bitDepth > 8 || info.interlaced;
    } else if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
      info.format = 'jpg'; info.normalize = false;
      for (let o = 2; o + 9 < b.length;) {
        if (b[o] !== 0xff) { o++; continue; }
        const m = b[o + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          info.height = (b[o + 5] << 8) | b[o + 6]; info.width = (b[o + 7] << 8) | b[o + 8];
          info.normalize = b[o + 9] === 4 || m === 0xc9 || m === 0xca; // CMYK or arithmetic coding
          break;
        }
        o += 2 + ((b[o + 2] << 8) | b[o + 3]);
      }
    } else if (ascii(0, 4) === '%PDF') { info.format = 'pdf'; info.normalize = false; }
    else if (ascii(0, 3) === 'GIF') { info.format = 'gif'; info.width = b[6] | (b[7] << 8); info.height = b[8] | (b[9] << 8); }
    else if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') info.format = 'webp';
    else if (ascii(0, 2) === 'BM') info.format = 'bmp';
    else if (ascii(0, 2) === 'II' || ascii(0, 2) === 'MM') info.format = 'tiff';
    else if (/<svg[\s>]/i.test(ascii(0, Math.min(b.length, 2048)))) info.format = 'svg';
    return info;
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function prettyDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m || +m[2] < 1 || +m[2] > 12) return s;
    return MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
  }

  const countWords = s => { const m = String(s).match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu); return m ? m.length : 0; };

  /** Plain text of an inline token list (for slugs, PDF bookmarks, alt text, widths). */
  function plainOf(tokens) {
    let s = '';
    for (const t of tokens || []) {
      switch (t.type) {
        case 'text': s += t.tokens ? plainOf(t.tokens) : T.decodeEntities(t.text != null ? t.text : t.raw || ''); break;
        case 'escape': s += t.text; break;
        case 'codespan': s += t.text; break;
        case 'strong': case 'em': case 'del': case 'link': s += plainOf(t.tokens); break;
        case 'image': s += t.text || plainOf(t.tokens); break;
        case 'br': s += ' '; break;
        case 'inlineMath': s += t.text; break;
        case 'footnoteRef': break;
        case 'html': break;
        default: if (t.tokens) s += plainOf(t.tokens); else if (t.text) s += t.text;
      }
    }
    return s.replace(T.RE_INVISIBLE, '').replace(/\s+/g, ' ').trim();
  }

  /** Make a string safe inside hyperref's PDF-string mode (bookmarks / metadata). */
  function pdfString(s) {
    return String(s)
      .replace(T.RE_INVISIBLE, '')
      .replace(/[\\{}$&#^_%~]/g, c => ({ '\\': '\\textbackslash{}', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}' }[c] || '\\' + c))
      .replace(/\s+/g, ' ').trim();
  }

  /** Percent-encode what a URL cannot contain; keep existing %XX sequences. */
  function cleanUrl(u) {
    return String(u).trim()
      .replace(/%(?![0-9A-Fa-f]{2})/g, '%25')
      .replace(/[^\x21-\x7e]|["<>\\^`{|}$]/gu, ch =>
        Array.from(new TextEncoder().encode(ch)).map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join(''));
  }
  const texUrl = u => u.replace(/[%#&]/g, c => '\\' + c);

  // =====================================================================
  //  Front matter (a small YAML subset) and footnote definitions
  // =====================================================================

  function unquote(v) {
    v = v.trim();
    if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
      return v.slice(1, -1).replace(/\\(["\\nt])/g, (m, c) => ({ n: '\n', t: '\t' }[c] || c));
    }
    if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") return v.slice(1, -1).replace(/''/g, "'");
    return v.replace(/\s+#.*$/, '');
  }

  function splitFlow(s) {
    const parts = []; let cur = ''; let q = null; let depth = 0;
    for (const ch of s) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === '[' || ch === '{') depth++;
      if (ch === ']' || ch === '}') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    return parts.map(p => unquote(p));
  }

  function scalar(v) {
    v = v.trim();
    if (/^\[.*\]$/.test(v)) return splitFlow(v.slice(1, -1));
    if (/^\{.*\}$/.test(v)) {
      const map = {};
      splitFlow(v.slice(1, -1)).forEach(kv => { const m = /^([^:]+):\s*(.*)$/.exec(kv); if (m) map[m[1].trim().toLowerCase()] = m[2]; });
      return map;
    }
    return unquote(v);
  }

  function parseYamlLite(text) {
    const lines = text.split('\n');
    const out = {};
    let i = 0;
    const indentOf = l => l.match(/^ */)[0].length;
    while (i < lines.length) {
      const line = lines[i];
      const m = /^([A-Za-z_][\w\- ]*?)\s*:(?:\s+(.*)|\s*)$/.exec(line);
      if (!m || /^\s/.test(line)) { i++; continue; }
      const key = m[1].trim().toLowerCase();
      const rest = (m[2] || '').trim();
      i++;
      if (/^[|>][+-]?$/.test(rest)) {
        const folded = rest[0] === '>';
        const buf = [];
        while (i < lines.length && (lines[i].trim() === '' || /^\s/.test(lines[i]))) buf.push(lines[i++]);
        const ind = Math.min.apply(null, buf.filter(l => l.trim()).map(indentOf).concat([1e9]));
        const body = buf.map(l => l.slice(Math.min(ind, indentOf(l)))).join('\n').replace(/\s+$/, '');
        out[key] = folded ? body.replace(/(?<!\n)\n(?!\n)/g, ' ') : body;
      } else if (rest === '') {
        const block = [];
        while (i < lines.length && (lines[i].trim() === '' || /^\s/.test(lines[i]) || /^-\s/.test(lines[i]))) block.push(lines[i++]);
        const items = [];
        let current = null;
        for (const l of block) {
          if (!l.trim()) continue;
          const li = /^\s*-\s+(.*)$/.exec(l);
          if (li) {
            if (current !== null) items.push(current);
            const kv = /^([A-Za-z_][\w\- ]*?)\s*:\s*(.*)$/.exec(li[1]);
            current = kv ? { [kv[1].trim().toLowerCase()]: unquote(kv[2]) } : unquote(li[1]);
          } else {
            const kv = /^\s+([A-Za-z_][\w\- ]*?)\s*:\s*(.*)$/.exec(l);
            if (kv) {
              if (current === null) current = {};
              if (typeof current === 'object') current[kv[1].trim().toLowerCase()] = unquote(kv[2]);
            }
          }
        }
        if (current !== null) items.push(current);
        out[key] = items.length === 1 && !/^\s*-/.test(block.find(l => l.trim()) || '') ? items[0] : items;
      } else {
        out[key] = scalar(rest);
      }
    }
    return out;
  }

  function splitFrontMatter(src) {
    const m = /^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/.exec(src);
    if (!m) return { meta: {}, body: src };
    const meta = parseYamlLite(m[1]);
    if (!Object.keys(meta).length) return { meta: {}, body: src };
    return { meta, body: src.slice(m[0].length) };
  }

  function extractFootnotes(src) {
    const lines = src.split('\n');
    const out = [];
    const defs = new Map();
    let fence = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (fence) {
        out.push(line);
        if (f && f[1][0] === fence[0] && f[1].length >= fence.length && /^ {0,3}(`{3,}|~{3,})\s*$/.test(line)) fence = null;
        continue;
      }
      if (f) { fence = f[1]; out.push(line); continue; }
      const m = /^ {0,3}\[\^([^\]\s]+)\]:[ \t]*(.*)$/.exec(line);
      if (!m) { out.push(line); continue; }
      const body = [m[2]];
      let j = i + 1;
      while (j < lines.length) {
        if (/^( {2,}|\t)\S/.test(lines[j])) { body.push(lines[j].replace(/^( {1,4}|\t)/, '')); j++; }
        else if (lines[j].trim() === '' && j + 1 < lines.length && /^( {2,}|\t)\S/.test(lines[j + 1])) { body.push(''); j++; }
        else break;
      }
      defs.set(m[1], body.join('\n').trim());
      i = j - 1;
    }
    return { src: out.join('\n'), defs };
  }

  // =====================================================================
  //  Math: lexer extensions and sanitising
  // =====================================================================

  // Commands that must never reach LaTeX from a Markdown file: file access, shell access,
  // catcode tricks and ways to build those commands indirectly. (The helper server
  // additionally compiles with restricted file access; this is defence in depth.)
  const RE_MATH_BLOCKED = new RegExp(
    '\\\\(?:input|include|includeonly|import|subimport|openin|openout|read|readline|write|immediate|catcode|' +
    'csname|endcsname|scantokens|newwrite|newread|closein|closeout|special|pdfliteral|directlua|luaexec|' +
    'ShellEscape|usepackage|RequirePackage|documentclass|makeatletter|makeatother|verbatiminput|lstinputlisting|' +
    'InputIfFileExists|detokenize|lowercase|uppercase|lccode|uccode|outer|long|jobname|string)(?![A-Za-z])|' +
    '\\\\[A-Za-z]*@|\\^\\^|\\\\begin\\{document\\}|\\\\end\\{document\\}');

  function sanitizeMath(s) {
    if (RE_MATH_BLOCKED.test(s)) return { ok: false, tex: '' };
    // `%` starts a LaTeX comment and `#` is a macro parameter: escape them unless already escaped.
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') { out += c + (s[i + 1] || ''); i++; continue; }
      if (c === '%' || c === '#') { out += '\\' + c; continue; }
      out += c;
    }
    // Unicode math symbols typed directly: translate them to commands
    out = out.replace(/[^\x00-\x7f]/gu, (ch, at, whole) => {
      // a control word must not run into a following letter: add a space only when one follows
      const gap = /[A-Za-z]/.test(whole[at + ch.length] || '') ? ' ' : '';
      if (T.GREEK[ch]) return T.GREEK[ch] + (/[A-Za-z]$/.test(T.GREEK[ch]) ? gap : '');
      if (T.MATH_SYMBOLS[ch]) return T.MATH_SYMBOLS[ch] + (/[A-Za-z]$/.test(T.MATH_SYMBOLS[ch]) ? gap : '');
      if (T.SUPERSCRIPTS[ch]) return '^{' + T.SUPERSCRIPTS[ch] + '}';
      if (T.SUBSCRIPTS[ch]) return '_{' + T.SUBSCRIPTS[ch] + '}';
      if (ch === '\u00A0') return '~';
      return ch;
    });
    return { ok: true, tex: out.replace(/\n[ \t]*\n+/g, '\n') };
  }

  function findClosingDollar(src) {
    for (let i = 1; i < src.length; i++) {
      const c = src[i];
      if (c === '\\') { i++; continue; }
      if (c === '\n' && /^\n[ \t]*\n/.test(src.slice(i))) return -1;
      if (c === '$') {
        if (i === 1) return -1;
        if (/\s/.test(src[i - 1])) return -1;
        if (/[0-9]/.test(src[i + 1] || '')) return -1;
        return i;
      }
    }
    return -1;
  }

  const MATH_ENVS = 'equation|align|gather|multline|flalign|alignat|eqnarray|displaymath';

  const mathBlockExt = {
    name: 'mathBlock', level: 'block',
    start(src) {
      const m = new RegExp('(^|\\n)(?= {0,3}(?:\\$\\$|\\\\\\[|\\\\begin\\{(?:' + MATH_ENVS + ')\\*?\\}))').exec(src);
      return m ? m.index + m[1].length : undefined;
    },
    tokenizer(src) {
      let m = /^ {0,3}\$\$((?:(?!\$\$)[\s\S])*?)\$\$[ \t]*(?:\n+|$)/.exec(src);
      if (m && m[1].trim()) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
      m = /^ {0,3}\\\[((?:(?!\\\])[\s\S])*?)\\\][ \t]*(?:\n+|$)/.exec(src);
      if (m && m[1].trim()) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
      m = new RegExp('^ {0,3}(\\\\begin\\{(' + MATH_ENVS + ')(\\*?)\\}[\\s\\S]*?\\\\end\\{\\2\\3\\})[ \\t]*(?:\\n+|$)').exec(src);
      if (m) return { type: 'mathBlock', raw: m[0], text: m[1].trim(), env: m[2] + m[3] };
    }
  };

  const inlineMathExt = {
    name: 'inlineMath', level: 'inline',
    start(src) { const i = src.search(/\$|\\[(\[]/); return i < 0 ? undefined : i; },
    tokenizer(src) {
      let m;
      if (src.startsWith('$$')) {
        m = /^\$\$((?:(?!\$\$)[\s\S])+?)\$\$/.exec(src);
        if (m && m[1].trim()) return { type: 'inlineMath', raw: m[0], text: m[1].trim(), display: true };
        return undefined;
      }
      if (src[0] === '$') {
        if (!src[1] || /\s/.test(src[1])) return undefined;
        const end = findClosingDollar(src);
        if (end > 1) return { type: 'inlineMath', raw: src.slice(0, end + 1), text: src.slice(1, end), display: false };
        return undefined;
      }
      if (src.startsWith('\\(')) {
        m = /^\\\(([\s\S]+?)\\\)/.exec(src);
        if (m && m[1].trim()) return { type: 'inlineMath', raw: m[0], text: m[1].trim(), display: false };
      } else if (src.startsWith('\\[')) {
        m = /^\\\[([\s\S]+?)\\\]/.exec(src);
        if (m && m[1].trim()) return { type: 'inlineMath', raw: m[0], text: m[1].trim(), display: true };
      }
      return undefined;
    }
  };

  const footnoteRefExt = {
    name: 'footnoteRef', level: 'inline',
    start(src) { const i = src.indexOf('[^'); return i < 0 ? undefined : i; },
    tokenizer(src) {
      const m = /^\[\^([^\]\s]+)\]/.exec(src);
      if (m) return { type: 'footnoteRef', raw: m[0], id: m[1] };
      return undefined;
    }
  };

  function makeLexer(o) {
    const m = new markedLib.Marked({ gfm: true, breaks: o.hardBreaks, extensions: [mathBlockExt, inlineMathExt, footnoteRefExt] });
    return src => m.lexer(src);
  }

  // =====================================================================
  //  Language names understood by the fancyvrb setup are irrelevant (no
  //  highlighting) — but a few fence languages get special treatment.
  // =====================================================================
  const DIAGRAM_LANGS = new Set(['mermaid', 'plantuml', 'dot', 'graphviz', 'puml', 'd2']);

  const HTML_INLINE = {
    b: ['\\textbf{', '}'], strong: ['\\textbf{', '}'],
    i: ['\\emph{', '}'], em: ['\\emph{', '}'], cite: ['\\emph{', '}'], var: ['\\emph{', '}'], dfn: ['\\emph{', '}'],
    u: ['\\underline{', '}'], ins: ['\\underline{', '}'],
    s: ['\\sout{', '}'], strike: ['\\sout{', '}'], del: ['\\sout{', '}'],
    code: ['\\texttt{', '}'], tt: ['\\texttt{', '}'], kbd: ['\\texttt{', '}'], samp: ['\\texttt{', '}'],
    sup: ['\\textsuperscript{', '}'], sub: ['\\textsubscript{', '}'],
    mark: ['\\colorbox{yellow!35}{', '}'], small: ['{\\small ', '}'], big: ['{\\large ', '}']
  };
  const HTML_BLOCK_TAGS = new Set(['p', 'div', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main', 'center',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'ul', 'ol', 'dl', 'dt', 'dd', 'blockquote', 'details', 'figure', 'figcaption',
    'form', 'fieldset', 'address']);

  const attrOf = (attrs, name) => {
    const m = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(attrs || '');
    return m ? T.decodeEntities(m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]) : '';
  };

  // =====================================================================
  //  The converter
  // =====================================================================

  function convert(markdown, userOptions) {
    const o = normalizeOptions(userOptions);
    const lex = makeLexer(o);

    const warnings = [];
    const warned = new Set();
    const warn = (code, message, level) => {
      const key = code + '|' + message;
      if (warned.has(key)) return;
      warned.add(key);
      warnings.push({ code, level: level || 'warn', message });
    };
    const counts = { emojiRemoved: 0, unsupported: new Set(), relativeLinks: 0, htmlDropped: 0, linksStripped: 0, remoteImages: new Set(), missingImages: new Set() };
    const uses = { lists: false, tables: false, code: false, quote: false, images: false, strike: false, rule: false };
    const needs = { cyrillic: false, greekText: false, codeWide: false };
    const stats = { words: 0, headings: 0, tables: 0, codeBlocks: 0, images: 0, footnotes: 0, math: 0, links: 0, lists: 0 };
    const assets = new Map();       // id -> asset record
    const assetNames = new Set();   // used tex file names
    const footnoteUsed = new Map(); // id -> label
    let inFootnote = false;

    // ---------------------------------------------------------------- preprocessing
    let src = String(markdown == null ? '' : markdown).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const fm = splitFrontMatter(src);
    const meta = fm.meta;
    src = fm.body;
    const fnx = extractFootnotes(src);
    src = fnx.src;
    const footnoteDefs = fnx.defs;

    let tokens = lex(src).filter(t => t.type !== 'space' && t.type !== 'def');

    // -------------------------------------------------------- text → LaTeX (inline)
    const ARROWS = { '->': '\\ensuremath{\\rightarrow}', '<-': '\\ensuremath{\\leftarrow}', '=>': '\\ensuremath{\\Rightarrow}', '<->': '\\ensuremath{\\leftrightarrow}', '<=>': '\\ensuremath{\\Leftrightarrow}' };
    const RE_OPENING_CONTEXT = /^$|[\s(\[{<\u2014\u2013\-\/\u201C\u2018]$/;
    const RE_GREEK_RUN = /^[\u0370-\u03FF\u1F00-\u1FFF]+/;

    function noteScripts(ch) {
      for (const [name, re] of T.SCRIPTS) {
        if (re.test(ch)) {
          if (name === 'Cyrillic') needs.cyrillic = true;
          else if (name === 'Greek') needs.greekText = true;
          counts.unsupported.add(name);
          return;
        }
      }
    }

    /** Escape + typographic clean-up for running text. `st.prev` carries the previous visible character. */
    function texText(raw, st) {
      let s = T.decodeEntities(raw).replace(T.RE_INVISIBLE, '');
      s = s.replace(/-{2,3}/g, m => (m.length === 3 ? '\u2014' : m.length === 2 ? '\u2013' : m));
      s = s.replace(/\.\.\./g, '\u2026');
      s = s.replace(/(^|\s)(<->|<=>|->|=>|<-)(?=\s|$)/g, (m, a, arrow) => a + '\u0001' + arrow + '\u0001');
      s = s.replace(/\S{16,}/g, breakLongWord);
      let out = '';
      let prev = st.prev || '';
      let removed = false;
      const chars = Array.from(s);
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch === '\u0002') { out += '\\allowbreak{}'; continue; }
        if (ch === '\u0001') {
          // arrow marker: the arrow text sits between two markers
          const end = chars.indexOf('\u0001', i + 1);
          const arrow = chars.slice(i + 1, end).join('');
          out += ARROWS[arrow] || escapeAscii(arrow);
          prev = '>'; i = end; continue;
        }
        if (ch === '"') {
          out += RE_OPENING_CONTEXT.test(prev) ? '\u201C' : '\u201D';
          prev = out.slice(-1); continue;
        }
        if (ch === "'") {
          const next = chars[i + 1] || '';
          // 'tis 'twas 'til 'em 'cause rock 'n' roll '90s: a leading apostrophe, not an opening quote
          const elision = /^(?:tis|twas|til|em|cause|n['\u2019]|[0-9])/i.test(chars.slice(i + 1, i + 8).join(''));
          if (RE_OPENING_CONTEXT.test(prev) && !elision && !(prev === '' && next === '')) out += '\u2018';
          else out += '\u2019';
          prev = out.slice(-1); continue;
        }
        const cp = ch.codePointAt(0);
        if (cp < 0x80) {
          out += TEX_ESC[ch] || ch;
          prev = ch; continue;
        }
        if (T.GREEK[ch]) {
          const run = RE_GREEK_RUN.exec(chars.slice(i).join(''));
          if (run && run[0].length <= 2) { out += '\\ensuremath{' + T.GREEK[ch] + '}'; prev = 'x'; continue; }
          needs.greekText = true; counts.unsupported.add('Greek'); out += ch; prev = ch; continue;
        }
        if (T.MATH_SYMBOLS[ch]) { out += '\\ensuremath{' + T.MATH_SYMBOLS[ch] + '}'; prev = 'x'; continue; }
        if (T.SUPERSCRIPTS[ch]) { out += '\\textsuperscript{' + T.SUPERSCRIPTS[ch] + '}'; prev = 'x'; continue; }
        if (T.SUBSCRIPTS[ch]) { out += '\\textsubscript{' + T.SUBSCRIPTS[ch] + '}'; prev = 'x'; continue; }
        if (Object.prototype.hasOwnProperty.call(T.TEXT_SYMBOLS, ch)) { out += T.TEXT_SYMBOLS[ch]; prev = ch === '\u00A0' ? ' ' : 'x'; continue; }
        if (!T.PASS_THROUGH_PICTOGRAPHIC.has(ch) && T.RE_EMOJI.test(ch)) { counts.emojiRemoved++; removed = true; continue; }
        if (o.engine === 'pdflatex' && !T.pdftexSupports(cp)) { counts.unsupported.add('characters pdfLaTeX cannot show'); noteScripts(ch); out += ch; prev = ch; continue; }
        if (cp > 0x24f) noteScripts(ch);
        out += ch; prev = ch;
      }
      st.prev = prev;
      out = out.replace(/ {2,}/g, ' ');
      return removed ? out.replace(/ +([,.;:!?)\]])/g, '$1') : out;
    }

    /** Text inside \texttt{...}: no typography, ASCII fallbacks for glyphs Latin Modern Mono lacks. */
    function codeText(s, allowBreaks) {
      let out = '';
      for (const ch of s.replace(T.RE_INVISIBLE, '')) {
        if (Object.prototype.hasOwnProperty.call(T.CODE_TRANSLIT, ch)) { out += escapeAscii(T.CODE_TRANSLIT[ch]); continue; }
        const cp = ch.codePointAt(0);
        if (cp >= 0x80) {
          if (!T.PASS_THROUGH_PICTOGRAPHIC.has(ch) && T.RE_EMOJI.test(ch)) { counts.emojiRemoved++; continue; }
          if (cp > 0x24f && !(cp >= 0x2010 && cp <= 0x2027)) { needs.codeWide = true; noteScripts(ch); }
        }
        out += TEX_ESC[ch] || ch;
      }
      if (allowBreaks) {
        out = out.split(' ').map(w => (w.length > 14 ? w.replace(/(\\_|\/|\.|-|:|=|,|;)(?=.)/g, '$1\\allowbreak{}') : w)).join(' ');
      }
      return out;
    }

    // ------------------------------------------------------------------ images
    function sanitizeFileName(name) {
      const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^\.+/, '').slice(-80) || 'image';
      return cleaned;
    }

    function registerImage(href, alt, title) {
      stats.images++;
      uses.images = true;
      const info = { src: href || '', alt: alt || '', title: title || '', texPath: null, remote: false, label: href || '', width: '' };
      const h = (href || '').trim();
      if (!h) return info;
      if (/^https?:\/\//i.test(h) || /^\/\//.test(h)) {
        info.remote = true;
        counts.remoteImages.add(h);
        return info;
      }
      let res = null;
      if (/^data:image\//i.test(h)) {
        const m = /^data:image\/([a-z0-9.+-]+);base64,/i.exec(h);
        if (m) {
          const ext = m[1].toLowerCase().replace('jpeg', 'jpg').replace('svg+xml', 'svg');
          res = { id: 'data:' + h.length + ':' + h.slice(-24), name: 'embedded-image.' + ext, ext, dataUri: h };
          info.label = 'embedded image';
        }
      } else if (typeof o.resolveAsset === 'function') {
        let key = h.split(/[?#]/)[0];
        try { key = decodeURIComponent(key); } catch (e) { /* keep as is */ }
        res = o.resolveAsset(key);
      }
      if (!res) {
        counts.missingImages.add(h);
        return info;
      }
      let rec = assets.get(res.id);
      if (!rec) {
        let ext = (res.ext || (/\.([A-Za-z0-9]+)$/.exec(res.name || '') || [])[1] || 'png').toLowerCase().replace('jpeg', 'jpg');
        const convert = res.convert || !['png', 'jpg', 'pdf'].includes(ext);
        if (convert) ext = 'png';
        let base = sanitizeFileName((res.name || 'image').replace(/\.[A-Za-z0-9]+$/, ''));
        let name = base + '.' + ext;
        for (let n = 2; assetNames.has(name); n++) name = base + '-' + n + '.' + ext;
        assetNames.add(name);
        rec = { id: res.id, source: h, texPath: 'images/' + name, ext, convert: !!convert, originalExt: (res.ext || '').toLowerCase(), dataUri: res.dataUri || null, name: res.name };
        assets.set(res.id, rec);
      }
      info.texPath = rec.texPath;
      return info;
    }

    // ------------------------------------------------------------------ inline tokens
    function newInlineContext(mode) { return { mode, st: { prev: '' }, html: [] }; }

    function renderInline(toks, mode) {
      const ic = newInlineContext(mode);
      let out = inline(toks, ic);
      while (ic.html.length) out += ic.html.pop()[1];
      // a line break at the very start or end of a block would make LaTeX fail ("no line here to end")
      return out.replace(/^(?:\s|\\newline)+/, '').replace(/(?:\s|\\newline)+$/, '');
    }

    function inline(toks, ic) {
      let out = '';
      for (const t of toks || []) out += inlineToken(t, ic);
      return out;
    }

    function figureArgs(info) {
      const alt = info.alt || '';
      const altTex = texText(alt, { prev: '' });
      const label = codeText(info.label || info.src || '', true);
      return { alt: altTex, label };
    }

    function inlineImage(info) {
      const a = figureArgs(info);
      if (!info.texPath) return '\\textit{[' + (a.alt || 'image') + ']}';
      return '\\mdinlineimage{' + info.texPath + '}{' + (a.alt || 'image') + '}{' + a.label + '}';
    }

    function inlineToken(t, ic) {
      switch (t.type) {
        case 'text':
          if (t.tokens) return inline(t.tokens, ic);
          return texText(t.text != null ? t.text : t.raw, ic.st);
        case 'escape': {
          ic.st.prev = t.text;
          return TEX_ESC[t.text] || t.text;
        }
        case 'strong': return '\\textbf{' + inline(t.tokens, ic) + '}';
        case 'em': return '\\emph{' + inline(t.tokens, ic) + '}';
        case 'del':
          if (ic.mode === 'heading' || ic.mode === 'caption') return inline(t.tokens, ic);
          uses.strike = true;
          return '\\sout{' + inline(t.tokens, ic) + '}';
        case 'codespan': {
          ic.st.prev = 'x';
          return '\\texttt{' + codeText(t.text, true) + '}';
        }
        case 'br':
          if (ic.mode === 'heading' || ic.mode === 'caption') return ' ';
          ic.st.prev = '';
          return ic.mode === 'cell' ? '\\newline ' : '\\newline\n';
        case 'link': return renderLink(t, ic);
        case 'image': {
          const info = registerImage(t.href, plainOf(t.tokens) || t.text, t.title);
          return inlineImage(info);
        }
        case 'html': return htmlInline(t.raw, ic);
        case 'inlineMath': return renderInlineMath(t, ic);
        case 'footnoteRef': return renderFootnoteRef(t, ic);
        case 'checkbox': return '';
        default:
          if (t.tokens) return inline(t.tokens, ic);
          return t.text != null ? texText(t.text, ic.st) : (t.raw ? texText(t.raw, ic.st) : '');
      }
    }

    function renderInlineMath(t, ic) {
      stats.math++;
      const safe = sanitizeMath(t.text);
      if (!safe.ok) {
        warn('math-blocked', 'A formula used a LaTeX command that is not allowed for safety (file access or low-level commands) and was shown as plain text.');
        ic.st.prev = 'x';
        return '\\texttt{' + codeText(t.raw, true) + '}';
      }
      ic.st.prev = 'x';
      if (t.display && ic.mode === 'body') return '\n\\[' + fixMultiline(safe.tex) + '\\]\n';
      return '$' + safe.tex.replace(/\n/g, ' ') + '$';
    }

    /** `\\` or `&` outside any environment would fail in plain \[ \]; wrap in gathered/aligned. */
    function fixMultiline(body) {
      const stripped = body.replace(/\\begin\{([^}]*)\}[\s\S]*?\\end\{\1\}/g, '');
      if (/\\\\|(^|[^\\])&/.test(stripped)) {
        const env = /(^|[^\\])&/.test(stripped) ? 'aligned' : 'gathered';
        return '\\begin{' + env + '}\n' + body + '\n\\end{' + env + '}';
      }
      return body;
    }

    function renderLink(t, ic) {
      const href = (t.href || '').trim();
      const text = plainOf(t.tokens);
      if (!href || ic.mode === 'heading' || ic.mode === 'caption') {
        if (href && (ic.mode === 'heading' || ic.mode === 'caption')) counts.linksStripped++;
        return inline(t.tokens, ic);
      }
      stats.links++;
      if (href[0] === '#') {
        let frag = href.slice(1);
        try { frag = decodeURIComponent(frag); } catch (e) { /* keep */ }
        const label = headingLabels.get(slugify(frag)) || headingLabels.get(frag.toLowerCase());
        const inner = inline(t.tokens, ic);
        return label ? '\\hyperref[' + label + ']{' + inner + '}' : inner;
      }
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href);
      if (!scheme || !/^(https?|ftp|mailto|tel)$/i.test(scheme[1])) {
        if (!scheme) counts.relativeLinks++;
        return inline(t.tokens, ic);
      }
      const url = texUrl(cleanUrl(href));
      ic.st.prev = 'x';
      const bare = href.replace(/^mailto:/i, '');
      if (/^(https?|ftp):/i.test(href) && (t.autolink || text === href)) {
        return '\\url{' + url + '}';
      }
      if (/^mailto:/i.test(href) && (t.autolink || text === bare)) return '\\href{' + url + '}{' + escapeAscii(bare) + '}';
      return '\\href{' + url + '}{' + inline(t.tokens, ic) + '}';
    }

    function renderFootnoteRef(t, ic) {
      if (ic.mode === 'heading' || ic.mode === 'caption' || inFootnote) {
        warn('footnote-context', 'A footnote inside a heading, caption or another footnote was removed (LaTeX cannot place it there).');
        return '';
      }
      if (!footnoteDefs.has(t.id)) {
        warn('footnote-missing', 'Footnote [^' + t.id + '] is used but never defined.');
        return texText(t.raw, ic.st);
      }
      const lab = 'fn:' + t.id.replace(/[^A-Za-z0-9]/g, c => 'x' + c.codePointAt(0).toString(16));
      if (footnoteUsed.has(t.id)) return '\\textsuperscript{\\ref{' + lab + '}}';
      footnoteUsed.set(t.id, lab);
      stats.footnotes++;
      inFootnote = true;
      const body = lex(footnoteDefs.get(t.id)).filter(x => x.type !== 'space' && x.type !== 'def')
        .map(x => (x.tokens ? renderInline(x.tokens, 'footnote') : escapeAscii(x.text || ''))).join('\\par ');
      inFootnote = false;
      return '\\footnote{\\label{' + lab + '}' + body + '}';
    }

    // inline HTML --------------------------------------------------------
    function htmlInline(raw, ic) {
      const tag = raw.trim();
      if (tag.startsWith('<!--')) return '';
      const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>$/.exec(tag);
      if (!m) { counts.htmlDropped++; return ''; }
      const closing = m[1] === '/';
      const name = m[2].toLowerCase();
      const attrs = m[3] || '';
      if (name === 'br') return ic.mode === 'heading' ? ' ' : (ic.mode === 'cell' ? '\\newline ' : '\\newline\n');
      if (name === 'img' && !closing) {
        const info = registerImage(attrOf(attrs, 'src'), attrOf(attrs, 'alt'), attrOf(attrs, 'title'));
        return inlineImage(info);
      }
      if (name === 'a') {
        if (closing) {
          const idx = lastIndex(ic.html, 'a');
          if (idx < 0) return '';
          let out = '';
          while (ic.html.length > idx) out += ic.html.pop()[1];
          return out;
        }
        const href = attrOf(attrs, 'href');
        const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href);
        if (href && scheme && /^(https?|ftp|mailto|tel)$/i.test(scheme[1]) && ic.mode !== 'heading' && ic.mode !== 'caption') {
          ic.html.push(['a', '}']);
          return '\\href{' + texUrl(cleanUrl(href)) + '}{';
        }
        ic.html.push(['a', '']);
        return '';
      }
      const fmt = HTML_INLINE[name];
      if (!fmt) { if (!HTML_BLOCK_TAGS.has(name) && name !== 'span') counts.htmlDropped++; return ''; }
      if (name === 'del' || name === 's' || name === 'strike') uses.strike = true;
      if (closing) {
        const idx = lastIndex(ic.html, name);
        if (idx < 0) return '';
        let out = '';
        while (ic.html.length > idx) out += ic.html.pop()[1];
        return out;
      }
      if (ic.mode === 'heading' && (name === 'del' || name === 's' || name === 'strike' || name === 'mark' || name === 'u' || name === 'ins')) {
        ic.html.push([name, '']);
        return '';
      }
      ic.html.push([name, fmt[1]]);
      return fmt[0];
    }
    const lastIndex = (stack, name) => { for (let i = stack.length - 1; i >= 0; i--) if (stack[i][0] === name) return i; return -1; };

    // ------------------------------------------------------------------ headings
    const headingLabels = new Map(); // slug -> latex label
    const headingInfo = new Map();   // token -> { level, label, numberedManually }

    function walkTokens(toks, fn) {
      for (const t of toks || []) {
        fn(t);
        if (t.type === 'list') for (const it of t.items) walkTokens(it.tokens, fn);
        else if (t.type === 'table') { t.header.forEach(c => walkTokens(c.tokens, fn)); t.rows.forEach(r => r.forEach(c => walkTokens(c.tokens, fn))); }
        else if (t.tokens) walkTokens(t.tokens, fn);
      }
    }

    // ---------------------------------------------------- Markdown TOC removal
    function stripMarkdownToc(list) {
      const out = [];
      let removed = 0;
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (t.type === 'heading' && /^(table of contents|contents|toc|inhaltsverzeichnis|sommaire|índice|indice)$/i.test(plainOf(t.tokens))) {
          const next = list[i + 1];
          if (next && next.type === 'list') {
            let total = 0; let internal = 0;
            walkTokens([next], x => {
              if (x.type === 'link') { total++; if ((x.href || '').startsWith('#')) internal++; }
            });
            if (total > 0 && internal / total >= 0.6) { i++; removed++; continue; }
          }
        }
        out.push(t);
      }
      if (removed) warn('md-toc', 'Removed the hand-written table of contents; a real one is generated by LaTeX.', 'info');
      return out;
    }
    if (o.stripMdToc) tokens = stripMarkdownToc(tokens);

    // ---------------------------------------------------- metadata & title
    function inlineFromString(str) {
      const blocks = lex(String(str)).filter(t => t.type !== 'space' && t.type !== 'def');
      if (blocks.length === 1 && blocks[0].tokens) return blocks[0].tokens;
      const flat = [];
      blocks.forEach(b => { if (b.tokens) flat.push(...b.tokens, { type: 'text', raw: ' ', text: ' ' }); });
      return flat;
    }

    const asList = v => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
    const flatName = v => (v && typeof v === 'object' ? (v.name || Object.keys(v).map(k => v[k]).join(' ')) : String(v));

    let titleTokens = null;
    let consumedH1 = false;
    const userTitle = o.title.trim();
    const metaTitle = userTitle || (typeof meta.title === 'string' ? meta.title.trim() : '');
    const firstIdx = tokens.findIndex(t => t.type !== 'space');
    const firstTok = firstIdx >= 0 ? tokens[firstIdx] : null;
    if (metaTitle) {
      titleTokens = inlineFromString(metaTitle);
      if (firstTok && firstTok.type === 'heading' && firstTok.depth === 1 &&
          plainOf(firstTok.tokens).toLowerCase() === plainOf(titleTokens).toLowerCase()) {
        tokens.splice(firstIdx, 1);
        consumedH1 = true;
      }
    } else if (firstTok && firstTok.type === 'heading' && firstTok.depth === 1) {
      let h1s = 0;
      tokens.forEach(t => { if (t.type === 'heading' && t.depth === 1) h1s++; });
      if (h1s === 1) {
        titleTokens = firstTok.tokens;
        tokens.splice(firstIdx, 1);
        consumedH1 = true;
      }
    }
    const shift = consumedH1 ? 1 : 0;

    // ---------------------------------------------------- outline (levels, labels)
    const docClass = o.documentClass;
    const topCmds = docClass === 'article'
      ? ['section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph', 'subparagraph']
      : ['chapter', 'section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph'];
    const usedSlugs = new Map();
    let prevLevel = 0;
    let manualNumbered = 0;
    let headingCount = 0;
    const outline = [];
    const RE_MANUAL_NUM = /^(?:\d+(?:\.\d+)*[.)]?|[IVXLC]+\.|[A-Z][.)])\s+\S/;
    tokens.forEach(t => {
      if (t.type !== 'heading') return;
      const shifted = Math.max(1, t.depth - shift);
      const level = Math.min(shifted, prevLevel + 1);
      prevLevel = level;
      const plain = plainOf(t.tokens);
      let slug = slugify(plain);
      const n = usedSlugs.get(slug) || 0;
      usedSlugs.set(slug, n + 1);
      const uniq = n ? slug + '-' + n : slug;
      const label = labelFromSlug(uniq || 'section');
      if (!headingLabels.has(uniq)) headingLabels.set(uniq, label);
      if (!headingLabels.has(slug)) headingLabels.set(slug, label);
      headingCount++;
      if (RE_MANUAL_NUM.test(plain)) manualNumbered++;
      headingInfo.set(t, { level: Math.min(level, 6), label, plain });
      outline.push({ t, level: Math.min(level, 6), plain });
    });
    // headings nested inside quotes/lists are not sections; they are rendered as bold lines.

    // numbering
    let numbered;
    if (o.numbering === 'yes') numbered = true;
    else if (o.numbering === 'no') numbered = false;
    else {
      const top = outline.filter(h => h.level === 1);
      const pool = top.length >= 2 ? top : outline;      // the top-level sections decide
      const manual = pool.length >= 2 && pool.filter(h => RE_MANUAL_NUM.test(h.plain)).length / pool.length >= 0.6;
      numbered = !manual;
      if (manual) warn('numbering-auto', 'Your headings already start with numbers, so LaTeX heading numbers were turned off. You can change this under “Numbering”.', 'info');
    }

    // When LaTeX numbers the headings, hand-typed numbers that form a 1, 2, 3 ... sequence among
    // siblings ("### 1. Setup", "### 2. Usage") would be printed twice ("2.1 1. Setup"): drop them.
    if (numbered) {
      const groups = new Map();
      const parents = [];
      outline.forEach(h => {
        parents.length = h.level;           // ancestors are the last headings of the lower levels
        const key = h.level + ':' + parents.slice(0, h.level - 1).map(x => (x ? x.id : 0)).join('/');
        h.id = h.t;
        parents[h.level - 1] = { id: outline.indexOf(h) + 1 };
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(h);
      });
      let stripped = 0;
      groups.forEach(list => {
        if (list.length < 2) return;
        const nums = list.map(h => { const m = /^(\d+(?:\.\d+)*)[.)]\s+\S/.exec(h.plain); return m ? m[1] : null; });
        if (nums.some(x => x === null)) return;
        const last = nums.map(x => parseInt(x.split('.').pop(), 10));
        if (!last.every((v, i) => i === 0 || v === last[i - 1] + 1)) return;
        list.forEach(h => {
          const first = h.t.tokens && h.t.tokens[0];
          if (first && first.type === 'text') {
            const text = first.text.replace(/^\s*\d+(?:\.\d+)*[.)]\s+/, '');
            if (text !== first.text) { first.text = text; first.raw = text; stripped++; }
          }
        });
      });
      if (stripped) warn('numbers-stripped', 'Removed hand-typed numbers from ' + stripped + ' heading' + (stripped === 1 ? '' : 's') + ' (LaTeX numbers them itself). Choose “No” under Numbering to keep your own.', 'info');
    }

    // ------------------------------------------------------------- block rendering
    function renderBlocks(list, bc) {
      const out = [];
      for (const t of list) {
        const s = renderBlock(t, bc);
        if (s !== '' && s != null) out.push(s);
      }
      return out.join('\n\n');
    }

    const RE_PAGEBREAK = /^\\(?:newpage|pagebreak|clearpage)(?:\{\})?$/;

    function renderBlock(t, bc) {
      switch (t.type) {
        case 'space': case 'def': return '';
        case 'heading': return renderHeading(t, bc);
        case 'paragraph': return renderParagraph(t, bc);
        case 'text': return t.tokens ? renderInline(t.tokens, 'body').trim() : escapeAscii(t.text || '');
        case 'list': return renderList(t, bc);
        case 'blockquote': return renderQuote(t, bc);
        case 'code': return renderCode(t, bc);
        case 'table': return renderTable(t, bc);
        case 'hr': uses.rule = true; return '\\mdrule';
        case 'html': return renderHtmlBlock(t.raw || t.text || '', bc);
        case 'mathBlock': return renderMathBlock(t);
        case 'checkbox': return '';
        default:
          if (t.tokens) return renderInline(t.tokens, 'body').trim();
          return t.text ? texText(t.text, { prev: '' }) : '';
      }
    }

    function needsPdfString(content) { return /\\(?![&%$#_{}])/.test(content); }

    function renderHeading(t, bc) {
      stats.headings++;
      const plain = plainOf(t.tokens);
      stats.words += countWords(plain);
      let content = renderInline(t.tokens, 'heading').replace(/\s*\\newline\s*/g, ' ').trim();
      if (!bc.top) {
        return '\\par\\medskip\\noindent\\textbf{' + content + '}\\par\\smallskip';
      }
      const info = headingInfo.get(t);
      let arg = content;
      if (needsPdfString(content)) arg = '\\texorpdfstring{' + content + '}{' + pdfString(plain) + '}';
      const cmd = topCmds[Math.min(info.level, 6) - 1];
      let pre = '';
      if (o.pageBreaks === 'sections' && info.level === 1 && docClass === 'article' && bc.seenSection) pre = '\\clearpage\n';
      bc.seenSection = true;
      const keep = cmd === 'chapter' ? '' : '\\needspace{5\\baselineskip}\n';
      return pre + keep + '\\' + cmd + '{' + arg + '}\\label{' + info.label + '}';
    }

    function imageOnlyParagraph(toks) {
      const imgs = [];
      for (const t of toks) {
        if (t.type === 'image') imgs.push(t);
        else if (t.type === 'link' && t.tokens && t.tokens.length === 1 && t.tokens[0].type === 'image') imgs.push(t.tokens[0]);
        else if (t.type === 'text' && !t.text.trim()) continue;
        else if (t.type === 'br') continue;
        else if (t.type === 'html' && /^<img\b/i.test(t.raw.trim())) imgs.push({ type: 'htmlimg', raw: t.raw });
        else if (t.type === 'html' && /^<\/?(?:p|div|center|a|br)\b/i.test(t.raw.trim())) continue;
        else return null;
      }
      return imgs.length ? imgs : null;
    }

    /** HTML width="320" / "50%" / "8cm" → a TeX length for \\mdimgw (images are never enlarged). */
    function widthTex(v) {
      const m = /^\s*(\d+(?:\.\d+)?)\s*(px|pt|cm|mm|in|%)?\s*$/i.exec(v || '');
      if (!m || !(+m[1] > 0)) return '';
      const n = +m[1];
      switch ((m[2] || 'px').toLowerCase()) {
        case '%': return (Math.min(n, 100) / 100).toFixed(2) + '\\linewidth';
        case 'px': return (n * 0.75).toFixed(1) + 'pt';
        default: return n + (m[2] || 'pt').toLowerCase();
      }
    }

    function figureTex(info, withCaption, width) {
      const a = figureArgs(info);
      let cap = '';
      if (withCaption) {
        const c = (info.title || info.alt || '').trim();
        const fileLike = /^[\w .\-()]+\.(png|jpe?g|gif|svg|webp|pdf)$/i.test(c);
        const generic = /^(image|img|picture|pic|screenshot|figure|fig|photo|logo|diagram)\s*\d*$/i.test(c);
        if (c && !fileLike && !generic) {
          const ic = newInlineContext('caption');
          cap = inline(inlineFromString(c), ic);
        }
      }
      const fig = '\\mdfigure{' + (info.texPath || '') + '}{' + (a.alt || '') + '}{' + a.label + '}{' + cap + '}';
      return width ? '{\\renewcommand{\\mdimgw}{' + width + '}' + fig + '}' : fig;
    }

    function renderParagraph(t, bc) {
      const plain = plainOf(t.tokens);
      if (RE_PAGEBREAK.test(t.raw.trim())) return '\\clearpage';
      stats.words += countWords(plain);
      const imgs = imageOnlyParagraph(t.tokens || []);
      if (imgs) {
        const infos = imgs.map(im => {
          if (im.type === 'htmlimg') {
            const m = /^<img\b([^>]*)>/i.exec(im.raw.trim());
            const img = registerImage(attrOf(m ? m[1] : '', 'src'), attrOf(m ? m[1] : '', 'alt'), attrOf(m ? m[1] : '', 'title'));
            img.width = widthTex(attrOf(m ? m[1] : '', 'width'));
            return img;
          }
          return registerImage(im.href, plainOf(im.tokens) || im.text, im.title);
        });
        const allPresent = infos.every(i => i.texPath);
        if (infos.length === 1 || allPresent) return infos.map(i => figureTex(i, true, i.width)).join('\n\n');
        // a row of unavailable images (typically README badges): list their descriptions inline
        return infos.map(i => '\\textit{[' + (texText(i.alt, { prev: '' }) || 'image') + ']}').join(' ');
      }
      let s = renderInline(t.tokens, 'body').trim();
      if (/^\[/.test(s)) s = '{}' + s;
      return s;
    }

    function renderMathBlock(t) {
      stats.math++;
      const safe = sanitizeMath(t.text);
      if (!safe.ok) {
        warn('math-blocked', 'A formula used a LaTeX command that is not allowed for safety (file access or low-level commands) and was shown as text.');
        return codeBlockTex(t.text, '');
      }
      if (t.env) return safe.tex;
      return '\\[\n' + fixMultiline(safe.tex.trim()) + '\n\\]';
    }

    function renderParagraphsOf(list, bc) { return renderBlocks(list, bc); }

    // ------------------------------------------------------------------ lists
    function renderList(t, bc) {
      uses.lists = true; stats.lists++;
      const env = t.ordered ? 'enumerate' : 'itemize';
      const opts = [];
      if (t.ordered && t.start !== '' && Number(t.start) !== 1 && Number.isFinite(Number(t.start))) opts.push('start=' + Number(t.start));
      if (t.loose) opts.push('itemsep=0.7em');
      const depth = (bc.listDepth || 0) + 1;
      const inner = Object.assign({}, bc, { top: false, listDepth: depth, nested: true });
      if (depth > 9) {
        warn('list-depth', 'A list was nested deeper than 9 levels; deeper levels were flattened.');
        return renderBlocks(t.items.flatMap(it => it.tokens), inner);
      }
      const lines = ['\\begin{' + env + '}' + (opts.length ? '[' + opts.join(',') + ']' : '')];
      for (const item of t.items) lines.push(renderListItem(item, inner, t.ordered));
      lines.push('\\end{' + env + '}');
      return lines.join('\n');
    }

    function renderListItem(item, bc, ordered) {
      let label = item.task ? (item.checked ? '[$\\boxtimes$]' : '[$\\square$]') : '';
      const parts = [];
      for (const c of item.tokens || []) {
        if (c.type === 'checkbox') continue;
        if (c.type === 'space') continue;
        if (c.type === 'text') {
          const s = renderInline(c.tokens || [{ type: 'text', raw: c.text, text: c.text }], 'body').trim();
          stats.words += countWords(plainOf(c.tokens));
          if (s) parts.push(s);
          continue;
        }
        const s = renderBlock(c, bc);
        if (s) parts.push(s);
      }
      let body = parts.join(item.loose ? '\n\n' : '\n');
      if (/^\[/.test(body)) body = '{}' + body;
      return '\\item' + label + (body ? ' ' + body : '');
    }

    // ------------------------------------------------------------- blockquotes
    const ALERT_LABELS = { note: 'Note', tip: 'Tip', important: 'Important', warning: 'Warning', caution: 'Caution', info: 'Info', success: 'Success', question: 'Question', danger: 'Danger', bug: 'Bug', example: 'Example', quote: 'Quote', abstract: 'Summary', todo: 'To do', failure: 'Failure' };

    function renderQuote(t, bc) {
      uses.quote = true;
      let kids = t.tokens.filter(x => x.type !== 'space');
      let heading = '';
      const first = kids[0];
      if (first && first.type === 'paragraph' && first.tokens && first.tokens[0] && first.tokens[0].type === 'text') {
        const m = /^\[!([A-Za-z]+)\][+-]?[ \t]*(.*)?(?:\n|$)/.exec(first.tokens[0].text);
        if (m) {
          const key = m[1].toLowerCase();
          heading = ALERT_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1));
          const custom = (m[2] || '').trim();
          if (custom) heading = custom;
          const rest = first.tokens[0].text.slice(m[0].length);
          const toks = [Object.assign({}, first.tokens[0], { text: rest, raw: rest }), ...first.tokens.slice(1)];
          if (!toks[0].text.trim()) toks.shift();      // nothing left of the first line
          if (toks[0] && toks[0].type === 'br') toks.shift(); // the line break that followed the marker
          kids = toks.length ? [Object.assign({}, first, { tokens: toks }), ...kids.slice(1)] : kids.slice(1);
        }
      }
      const inner = Object.assign({}, bc, { top: false, nested: true });
      let body = renderBlocks(kids, inner);
      if (heading) body = '\\textbf{' + escapeAscii(heading) + '}' + (body ? '\\par\n' + body : '');
      return '\\begin{mdquote}\n' + body + '\n\\end{mdquote}';
    }

    // ------------------------------------------------------------------- code
    function codeBlockTex(text, lang) {
      uses.code = true;
      let code = text.replace(/\r/g, '').split('\n').map(expandTabs).join('\n').replace(/\n+$/, '').replace(/^\n+/, '');
      if (!code.trim()) return '';
      code = Array.from(code).map(ch => {
        if (Object.prototype.hasOwnProperty.call(T.CODE_TRANSLIT, ch)) return T.CODE_TRANSLIT[ch];
        const cp = ch.codePointAt(0);
        if (cp >= 0x80) {
          if (!T.PASS_THROUGH_PICTOGRAPHIC.has(ch) && T.RE_EMOJI.test(ch)) { counts.emojiRemoved++; return ''; }
          if (T.RE_INVISIBLE_1.test(ch)) return '';
          if (cp > 0x24f && !(cp >= 0x2010 && cp <= 0x2027)) { needs.codeWide = true; noteScripts(ch); }
        }
        return ch;
      }).join('');
      code = code.replace(/\\end\{mdverb\}/g, '\\end {mdverb}');
      let longest = 0;
      for (const line of code.split('\n')) for (const w of line.split(/\s+/)) if (w.length > longest) longest = w.length;
      const opt = longest > 60 ? '[breakanywhere=true]' : '';
      stats.codeBlocks++;
      return '\\begin{mdcode}\n\\begin{mdverb}' + opt + '\n' + code + '\n\\end{mdverb}\n\\end{mdcode}';
    }

    function renderCode(t) {
      const lang = (t.lang || '').trim().split(/\s+/)[0].toLowerCase();
      if (lang === 'math' || lang === 'latex-math') return renderMathBlock({ text: t.text });
      if (DIAGRAM_LANGS.has(lang)) warn('diagram', 'Diagram code blocks (' + lang + ') cannot be drawn; they are shown as code. Export the diagram as an image and reference it instead.');
      return codeBlockTex(t.text, lang);
    }

    // ------------------------------------------------------------------ tables
    function hasBreak(toks) {
      for (const t of toks || []) {
        if (t.type === 'br') return true;
        if (t.type === 'html' && /^<br\b/i.test(t.raw.trim())) return true;
        if (t.tokens && hasBreak(t.tokens)) return true;
      }
      return false;
    }

    function renderTable(t, bc) {
      uses.tables = true; stats.tables++;
      const n = t.header.length;
      const rows = t.rows;
      const aligns = t.align || [];
      const cellTex = (c, head) => {
        let s = renderInline(c.tokens, 'cell').trim();
        stats.words += countWords(plainOf(c.tokens));
        if (/^[\[*]/.test(s)) s = '{}' + s;
        return head && s ? '\\textbf{' + s + '}' : s;
      };
      const all = [t.header].concat(rows);
      const plain = all.map(r => r.map(c => plainOf(c.tokens)));
      const multiline = all.some(r => r.some(c => hasBreak(c.tokens)));
      const maxLen = Array(n).fill(0), sumLen = Array(n).fill(0), longest = Array(n).fill(0);
      plain.forEach(r => r.forEach((txt, i) => {
        maxLen[i] = Math.max(maxLen[i], txt.length);
        sumLen[i] += txt.length;
        for (const w of txt.split(/\s+/)) if (w.length > longest[i]) longest[i] = w.length;
        if (longest[i] < 1) longest[i] = 1;
      }));
      const natural = !multiline && maxLen.reduce((a, b) => a + Math.min(b, 80), 0) + 3 * n <= (n >= 5 ? 70 : 78);
      let colSpec;
      let setup = '';
      if (natural) {
        colSpec = '@{}' + aligns.map((a, i) => (a === 'right' ? 'r' : a === 'center' ? 'c' : 'l')).join('') + '@{}';
        if (aligns.length < n) colSpec = '@{}' + 'l'.repeat(n) + '@{}';
      } else {
        const w = maxLen.map((m, i) => {
          const avg = sumLen[i] / Math.max(1, plain.length);
          return Math.min(60, Math.max(6, 0.4 * avg + 0.6 * m, Math.min(longest[i], 24)));
        });
        const total = w.reduce((a, b) => a + b, 0);
        let fr = w.map(x => Math.max(0.07, x / total));
        const fsum = fr.reduce((a, b) => a + b, 0);
        fr = fr.map(x => Math.floor((x / fsum) * 1000) / 1000);
        fr[fr.indexOf(Math.max(...fr))] += Math.round((1 - fr.reduce((a, b) => a + b, 0)) * 1000) / 1000;
        const rag = a => (a === 'right' ? '\\raggedleft' : a === 'center' ? '\\centering' : '\\raggedright');
        colSpec = '@{}' + fr.map((f, i) => '>{' + rag(aligns[i]) + '\\arraybackslash}p{' + f.toFixed(3) + '\\mdtw}').join('') + '@{}';
        setup = '\\setlength{\\mdtw}{\\dimexpr\\linewidth-' + (2 * (n - 1)) + '\\tabcolsep\\relax}\n';
      }
      const headCells = t.header.map(c => cellTex(c, true));
      const hasHead = headCells.some(x => x);
      const head = hasHead ? headCells.join(' & ') + ' \\\\\n' : '';
      const body = rows.map(r => r.map(c => cellTex(c, false)).join(' & ') + ' \\\\').join('\n');
      const size = n >= 7 ? '\\footnotesize\n' : n >= 4 ? '\\small\n' : '';
      const nested = bc.nested;
      let tex = '\\begingroup\n' + size + setup + '\\rowcolors{2}{mdshade}{white}\n';
      if (!nested) {
        tex += '\\begin{longtable}{' + colSpec + '}\n\\toprule\n' + head + '\\midrule\n\\endfirsthead\n\\toprule\n' + head + '\\midrule\n\\endhead\n' +
          '\\bottomrule\n\\endfoot\n\\bottomrule\n\\endlastfoot\n' + body + '\n\\end{longtable}';
      } else {
        tex += '\\par\\medskip\\noindent\\hfill\\begin{tabular}{' + colSpec + '}\n\\toprule\n' + head + '\\midrule\n' + body + '\n\\bottomrule\n\\end{tabular}\\hfill\\null\\par\\medskip';
      }
      return tex + '\n\\endgroup';
    }

    // -------------------------------------------------------------- HTML blocks
    const IMG_MARK = '\u0003';
    const RE_IMG_MARK = /\u0003(\d+)\u0003/g;

    function renderHtmlBlock(raw, bc) {
      const trimmed = raw.trim();
      const cm = /^<!--([\s\S]*?)-->$/.exec(trimmed);
      if (cm) return /^\s*(page-?break|new-?page|clear-?page)\s*$/i.test(cm[1]) ? '\\clearpage' : '';
      const out = [];
      const ic = newInlineContext('body');
      const imgs = [];      // pictures waiting in `buf` as numbered placeholders
      const stack = [];     // open block elements: { name, center }
      const isCentered = a => /align\s*=\s*["']?center/i.test(a) || /text-align\s*:\s*center/i.test(a);
      let buf = '';
      let wrap = null;      // set by <h1>…<h6>/<summary>, applied to the text until the element closes

      const flush = () => {
        let t = buf;
        while (ic.html.length) t += ic.html.pop()[1];
        buf = '';
        ic.st.prev = '';
        t = t.replace(/[ \t]*\n[ \t]*/g, ' ').replace(/ {2,}/g, ' ').replace(/^(?:\s|\\newline)+/, '').replace(/(?:\s|\\newline)+$/, '');
        if (!t) return;
        const ids = [];
        t.replace(RE_IMG_MARK, (m, n) => { ids.push(+n); return m; });
        if (ids.length && !t.replace(RE_IMG_MARK, '').replace(/\\newline/g, '').trim()) {
          // nothing but pictures: show them as figures (a row of unavailable badges becomes a text line)
          const infos = ids.map(n => imgs[n]);
          if (infos.length === 1 || infos.every(i => i.texPath)) out.push(infos.map(i => figureTex(i, false, i.width)).join('\n\n'));
          else out.push(infos.map(i => '\\textit{[' + (texText(i.alt, { prev: '' }) || 'image') + ']}').join(' '));
          return;
        }
        t = t.replace(RE_IMG_MARK, (m, n) => inlineImage(imgs[+n]));
        const piece = wrap ? wrap[0] + t + wrap[1] : t;
        out.push(stack.some(e => e.center) ? '\\begin{center}\n' + piece + '\n\\end{center}' : piece);
      };
      const HEADING_WRAP = { h1: '\\LARGE', h2: '\\Large', h3: '\\large', h4: '', h5: '', h6: '' };
      const openElement = (name, attrs) => stack.push({ name, center: name === 'center' || isCentered(attrs) });
      const closeElement = name => { const i = stack.map(e => e.name).lastIndexOf(name); if (i >= 0) stack.length = i; };

      const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|[^<]+|</g;
      let m;
      while ((m = re.exec(raw))) {
        const tok = m[0];
        if (tok.startsWith('<!--')) {
          if (/^<!--\s*(page-?break|new-?page|clear-?page)\s*-->$/i.test(tok)) { flush(); out.push('\\clearpage'); }
          continue;
        }
        if (!m[2]) {
          if (tok === '<') { buf += '<'; continue; }
          buf += texText(tok.replace(/\s+/g, ' '), ic.st);
          continue;
        }
        const closing = m[1] === '/';
        const name = m[2].toLowerCase();
        const attrs = m[3] || '';
        if (/page-?break|break-(?:after|before)\s*:\s*page/i.test(attrs) && !closing) { flush(); out.push('\\clearpage'); continue; }
        if (name === 'pre') {
          if (!closing) {
            const end = raw.toLowerCase().indexOf('</pre>', re.lastIndex);
            const inner = raw.slice(re.lastIndex, end < 0 ? raw.length : end).replace(/<[^>]+>/g, '');
            flush();
            const c = codeBlockTex(T.decodeEntities(inner), '');
            if (c) out.push(c);
            re.lastIndex = end < 0 ? raw.length : end + 6;
          }
          continue;
        }
        if (name === 'hr') { flush(); uses.rule = true; out.push('\\mdrule'); continue; }
        if (name === 'br') {
          // a picture followed by <br> is a logo/banner: give it its own line
          if (buf && !buf.replace(RE_IMG_MARK, '').replace(/\\newline|\s/g, '')) flush();
          else buf += '\\newline ';
          continue;
        }
        if (name === 'img' && !closing) {
          const img = registerImage(attrOf(attrs, 'src'), attrOf(attrs, 'alt'), attrOf(attrs, 'title'));
          img.width = widthTex(attrOf(attrs, 'width'));
          imgs.push(img);
          buf += IMG_MARK + (imgs.length - 1) + IMG_MARK;
          continue;
        }
        if (/^h[1-6]$/.test(name)) {
          flush();
          if (closing) { wrap = null; closeElement(name); } else { wrap = ['{\\bfseries' + (HEADING_WRAP[name] || '') + ' ', '\\par}']; openElement(name, attrs); }
          continue;
        }
        if (name === 'summary') { flush(); wrap = closing ? null : ['\\textbf{', '}']; continue; }
        if (name === 'li') { flush(); if (!closing) buf = '\\textbullet\\ '; continue; }
        if (name === 'td' || name === 'th') { buf += ' \\quad '; continue; }
        if (HTML_BLOCK_TAGS.has(name)) { flush(); if (closing) closeElement(name); else openElement(name, attrs); continue; }
        buf += htmlInline(tok, ic);
      }
      flush();
      return out.join('\n\n');
    }

    // ----------------------------------------------- abstract (rendered first: footnote order)
    const abstractSrc = typeof meta.abstract === 'string' ? meta.abstract.trim() : '';
    let abstractTex = '';
    if (abstractSrc) {
      abstractTex = renderBlocks(lex(abstractSrc).filter(x => x.type !== 'space' && x.type !== 'def'), { top: false });
    }

    // ------------------------------------------------------------------- body
    const bodyBc = { top: true, seenSection: false };
    const body = renderBlocks(tokens, bodyBc);

    // ------------------------------------------------------------ front matter
    const splitAuthors = v => (typeof v === 'string' ? v.split(/\s*;\s*|\s+and\s+(?=[A-Z])/) : v);
    const authorList = asList(splitAuthors(o.author || meta.authors || meta.author)).map(flatName).filter(Boolean);
    const subtitleSrc = (o.subtitle || (typeof meta.subtitle === 'string' ? meta.subtitle : '')).trim();
    const keywords = asList(meta.keywords || meta.tags).map(String).join(', ');

    let dateTex = '';
    const metaDate = typeof meta.date === 'string' ? meta.date.trim() : '';
    if (o.dateMode === 'custom' && o.dateText.trim()) dateTex = renderInline(inlineFromString(o.dateText), 'body');
    else if (o.dateMode === 'none') dateTex = '';
    else if (o.dateMode === 'today' || !metaDate || /^(today|\\today)$/i.test(metaDate)) dateTex = '\\today';
    else dateTex = renderInline(inlineFromString(prettyDate(metaDate)), 'body');

    let hasTitle = !!titleTokens;
    let titleTex = hasTitle ? renderInline(titleTokens, 'heading') : '';
    let titlePlain = hasTitle ? plainOf(titleTokens) : '';
    const wantsTitlePage = o.titlePage === 'yes' || (o.titlePage === 'auto' && hasTitle && stats.words >= 1500);
    if (!hasTitle && wantsTitlePage) {
      const fallback = humanize(o.fileName) || 'Untitled document';
      titleTex = escapeAscii(fallback); titlePlain = fallback; hasTitle = true;
    }
    const subtitleTex = subtitleSrc ? renderInline(inlineFromString(subtitleSrc), 'heading') : '';
    const authorParts = authorList.map(a => renderInline(inlineFromString(a), 'heading'));
    const authorTex = authorParts.length <= 1 ? (authorParts[0] || '')
      : authorParts.slice(0, -1).join(', ') + ' and ' + authorParts[authorParts.length - 1];
    const authorPlain = authorList.join(', ');
    const useTitlePage = hasTitle && wantsTitlePage;
    const titleLines = [];
    if (hasTitle) {
      if (useTitlePage) {
        titleLines.push('\\begin{titlepage}', '\\thispagestyle{empty}', '\\centering', '\\vspace*{0.16\\textheight}',
          '{\\sffamily\\bfseries\\fontsize{26}{32}\\selectfont\\color{mdaccent} ' + titleTex + '\\par}');
        if (subtitleTex) titleLines.push('\\vspace{1em}', '{\\sffamily\\Large\\color{mdmuted} ' + subtitleTex + '\\par}');
        if (authorTex || dateTex) titleLines.push('\\vspace{2.5em}', '{\\color{mdrule}\\rule{0.3\\linewidth}{1pt}\\par}', '\\vspace{2.5em}');
        if (authorTex) titleLines.push('{\\large ' + authorTex + '\\par}');
        if (authorTex && dateTex) titleLines.push('\\vspace{0.6em}');
        if (dateTex) titleLines.push('{\\large ' + dateTex + '\\par}');
        titleLines.push('\\vfill', '\\end{titlepage}');
      } else {
        titleLines.push('\\thispagestyle{plain}', '\\begin{center}',
          '{\\sffamily\\bfseries\\LARGE\\color{mdaccent} ' + titleTex + '\\par}');
        if (subtitleTex) titleLines.push('\\vspace{0.5em}', '{\\sffamily\\large\\color{mdmuted} ' + subtitleTex + '\\par}');
        if (authorTex) titleLines.push('\\vspace{0.8em}', '{\\large ' + authorTex + '\\par}');
        if (dateTex) titleLines.push('\\vspace{0.3em}', '{\\normalsize ' + dateTex + '\\par}');
        titleLines.push('\\end{center}', '\\vspace{0.8em}');
      }
    }
    if (abstractTex) {
      if (docClass === 'book') titleLines.push('\\chapter*{Abstract}', abstractTex);
      else titleLines.push('\\begin{abstract}', abstractTex, '\\end{abstract}');
    }
    const showToc = o.toc && headingCount >= 3;
    if (o.toc && !showToc && headingCount > 0) warn('toc-short', 'No table of contents: it needs at least 3 headings.', 'info');
    if (showToc) {
      if (docClass !== 'article' && titleLines.length) titleLines.push('\\clearpage'); // chapters-style classes: contents on its own page
      titleLines.push('\\tableofcontents');
      if (useTitlePage || headingCount > 14) titleLines.push('\\clearpage');
      else titleLines.push('\\bigskip');
    }

    // ------------------------------------------------------------- the preamble
    const book = docClass !== 'article';
    const tocLevels = o.tocDepth;
    const tocdepth = book ? tocLevels - 1 : tocLevels;
    const secnumdepth = numbered ? (book ? 2 : 3) : (book ? -1 : 0);
    const footerTitle = titlePlain.length > 70 ? titlePlain.slice(0, 67).replace(/\s+\S*$/, '') + '…' : titlePlain;
    const shortTitleTex = hasTitle ? (titlePlain.length > 70 ? escapeAscii(footerTitle) : titleTex.replace(/\\(?:newline|\\)\s*/g, ' ')) : '';
    const texName = (o.fileName ? o.fileName.replace(/^.*[\\/]/, '').replace(/\.[A-Za-z0-9]+$/, '') : 'document') + '.tex';

    // Image notices (one line each, however many pictures are affected)
    const listUrls = set => {
      const arr = Array.from(set);
      return arr.slice(0, 3).map(u => u.length > 60 ? u.slice(0, 57) + '…' : u).join(', ') + (arr.length > 3 ? ' and ' + (arr.length - 3) + ' more' : '');
    };
    if (counts.missingImages.size) {
      const n = counts.missingImages.size;
      warn('missing-image', n + ' image' + (n === 1 ? ' was' : 's were') + ' not found (' + listUrls(counts.missingImages) + '). Add ' + (n === 1 ? 'it' : 'them') + ' with “Add images”; until then a placeholder box is shown.');
    }
    if (counts.remoteImages.size) {
      const n = counts.remoteImages.size;
      warn('remote-image', n + ' online image' + (n === 1 ? '' : 's') + ' (' + listUrls(counts.remoteImages) + ') cannot be downloaded here, so ' + (n === 1 ? 'it appears' : 'they appear') + ' as a placeholder. Save the picture next to your Markdown file and reference it by file name.');
    }

    // Missing-glyph notices
    const scripts = Array.from(counts.unsupported);
    if (counts.emojiRemoved) warn('emoji', counts.emojiRemoved + ' emoji/pictograph' + (counts.emojiRemoved === 1 ? ' was' : 's were') + ' removed: LaTeX cannot typeset colour emoji. (Common symbols such as ✓ ✗ → ★ were converted instead.)', 'info');
    scripts.forEach(name => {
      if (name === 'characters pdfLaTeX cannot show') warn('pdftex-chars', 'Some characters cannot be typeset by pdfLaTeX and will be skipped. Choose XeLaTeX or LuaLaTeX in the engine setting for full Unicode support.');
      else if (name === 'Cyrillic' || name === 'Greek') {
        if (o.engine === 'pdflatex') warn('script-' + name, name + ' text needs XeLaTeX or LuaLaTeX; pdfLaTeX will skip those letters.');
        else warn('script-' + name, name + ' text detected: the preamble switches to a font that has these letters (TeX Gyre Termes, Times New Roman or DejaVu Serif, whichever is installed).', 'info');
      } else warn('script-' + name, name + ' text detected. LaTeX needs a font that contains these characters: add a \\setmainfont{…} line (and for CJK, xeCJK) under “Extra LaTeX” in the advanced settings.');
    });
    if (counts.relativeLinks) warn('relative-links', counts.relativeLinks + ' link' + (counts.relativeLinks === 1 ? '' : 's') + ' to other files cannot work in a PDF, so only the link text was kept.', 'info');
    if (counts.linksStripped) warn('heading-links', 'Links inside headings or captions were replaced by their text (they break the table of contents).', 'info');
    if (counts.htmlDropped) warn('html', counts.htmlDropped + ' unsupported HTML tag' + (counts.htmlDropped === 1 ? ' was' : 's were') + ' ignored (their text was kept).', 'info');
    if (stats.headings === 0 && stats.words > 300) warn('no-headings', 'The document has no headings, so the table of contents is empty. Add # headings to structure it.', 'info');

    const spec = {
      sourceName: o.fileName, texName, engine: o.engine, docClass, fontSize: o.fontSize, paper: o.paper, font: o.font,
      margins: o.margins, lineSpacing: o.lineSpacing, paragraphStyle: o.paragraphStyle, theme: o.theme,
      headerFooter: o.headerFooter, secnumdepth, tocdepth, toc: showToc, uses, needs, codeLineNumbers: o.codeLineNumbers,
      extraPreamble: o.extraPreamble,
      meta: {
        titlePlain: pdfString(titlePlain), authorPlain: pdfString(authorPlain), keywordsPlain: pdfString(keywords),
        footerTitleTex: o.headerFooter ? shortTitleTex : ''
      }
    };
    const preamble = P.buildPreamble(spec);

    const bodyTex = body.trim() || titleLines.length ? body : '\\mbox{}';
    if (!body.trim() && !titleLines.length) warn('empty', 'The Markdown file is empty, so the PDF has a single blank page.', 'info');
    const tex = [preamble, '', '\\begin{document}', '', titleLines.join('\n'), titleLines.length ? '' : null, bodyTex, '', '\\end{document}', '']
      .filter(x => x !== null).join('\n').replace(/\n{4,}/g, '\n\n\n');

    return {
      tex,
      warnings,
      assets: Array.from(assets.values()),
      meta: { title: titlePlain, author: authorPlain, date: dateTex, subtitle: subtitleSrc, hasTitle, titlePage: useTitlePage },
      stats: Object.assign({}, stats, { emoji: counts.emojiRemoved }),
      resolved: { numbered, titlePage: useTitlePage, tocEntries: headingCount, engine: o.engine, documentClass: docClass },
      texName,
      version: VERSION
    };
  }

  return {
    convert, sniffImage, DEFAULTS, version: VERSION,
    _internals: { parseYamlLite, splitFrontMatter, extractFootnotes, sanitizeMath, cleanUrl, slugify, plainOf, pdfString, escapeAscii, humanize, countWords, normalizeOptions }
  };
});
