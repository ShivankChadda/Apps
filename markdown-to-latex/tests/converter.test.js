'use strict';
// Unit tests for the converter. Run with:  node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const MD2TeX = require('../src/md2tex.js');
const T = require('../src/tables.js');

const convert = (md, opts) => MD2TeX.convert(md, opts);
/** Everything after \begin{document} (title block, contents and body). */
const body = (md, opts) => { const t = convert(md, opts).tex; return t.slice(t.indexOf('\\begin{document}') + 16, t.lastIndexOf('\\end{document}')).trim(); };
const has = (md, re, opts) => assert.match(body(md, opts), re);
const lacks = (md, re, opts) => assert.doesNotMatch(body(md, opts), re);

test('escapes every LaTeX special character', () => {
  has('50% of $5 & #tag_name ~tilde ^caret {braces} back\\\\slash', /50\\% of \\\$5 \\& \\#tag\\_name \\textasciitilde\{\}tilde \\textasciicircum\{\}caret \\\{braces\\\} back\\textbackslash\{\}slash/);
});

test('raw LaTeX in text is shown, not executed', () => {
  has('\\input{secret} \\begin{document} \\textbf{x}', /\\textbackslash\{\}input\\\{secret\\\} \\textbackslash\{\}begin\\\{document\\\}/);
});

test('smart quotes, dashes, ellipsis and elisions', () => {
  const b = body('"double" and \'single\', it\'s, \'tis, rock \'n\' roll, a -- b --- c... ');
  assert.match(b, /\u201Cdouble\u201D and \u2018single\u2019, it\u2019s, \u2019tis, rock \u2019n\u2019 roll, a \u2013 b \u2014 c\u2026/);
});

test('quotes next to inline markup open and close correctly', () => {
  has('He said "**hello**" and \'*hi*\'.', /\u201C\\textbf\{hello\}\u201D and \u2018\\emph\{hi\}\u2019/);
});

test('inline formatting', () => {
  has('*a* **b** ***c*** ~~d~~ `e`', /\\emph\{a\} \\textbf\{b\} \\emph\{\\textbf\{c\}\} \\sout\{d\} \\texttt\{e\}/);
});

test('inline code is escaped and may break inside long identifiers', () => {
  has('`a_b & c`', /\\texttt\{a\\_b \\& c\}/);
  has('`some_very_long_identifier_name_here`', /\\allowbreak\{\}/);
});

test('links: href, autolink, internal, relative, unsafe', () => {
  has('[x](https://e.com/a_b?x=1&y=2#f%20g)', /\\href\{https:\/\/e\.com\/a_b\?x=1\\&y=2\\#f\\%20g\}\{x\}/);
  has('<https://e.com/p>', /\\url\{https:\/\/e\.com\/p\}/);
  has('[rel](./other.md)', /^rel$/m);
  has('[js](javascript:alert(1))', /^js$/m);
  has('## Intro\n\n[go](#intro)\n\n## Other', /\\hyperref\[sec:intro\]\{go\}/);
  has('[nowhere](#nope)', /^nowhere$/m);
  has('[m](mailto:me@example.com)', /\\href\{mailto:me@example\.com\}\{m\}/);
});

test('URLs are percent-encoded where needed', () => {
  assert.equal(MD2TeX._internals.cleanUrl('https://e.com/a b{c}|d^e`f"g'), 'https://e.com/a%20b%7Bc%7D%7Cd%5Ee%60f%22g');
  assert.equal(MD2TeX._internals.cleanUrl('https://e.com/100%'), 'https://e.com/100%25');
  assert.equal(MD2TeX._internals.cleanUrl('https://e.com/ok%20ok'), 'https://e.com/ok%20ok');
});

test('lists: nesting, start number, tasks, leading bracket', () => {
  const b = body('- a\n  - b\n    1. c\n\n3. x\n4. y\n\n- [ ] todo\n- [x] done\n- [bracket] item');
  assert.match(b, /\\begin\{itemize\}\n\\item a\n\\begin\{itemize\}\n\\item b\n\\begin\{enumerate\}\n\\item c/);
  assert.match(b, /\\begin\{enumerate\}\[start=3\]/);
  assert.match(b, /\\item\[\$\\square\$\] todo/);
  assert.match(b, /\\item\[\$\\boxtimes\$\] done/);
  assert.match(b, /\\item \{\}\[bracket\] item/);
});

test('task markers survive in loose lists', () => {
  has('- [ ] one\n\n- [x] two\n', /\\item\[\$\\square\$\] one[\s\S]*\\item\[\$\\boxtimes\$\] two/);
});

test('empty list items and deep nesting do not break the output', () => {
  has('-\n- \n- x', /\\item\n\\item\n\\item x|\\item\n\\item \n\\item x/);
  const deep = Array.from({ length: 12 }, (_, i) => '  '.repeat(i) + '- level ' + (i + 1)).join('\n');
  const r = convert(deep);
  assert.ok(r.warnings.some(w => w.code === 'list-depth'));
});

test('tables: alignment, header, escaped pipes, natural width vs wrapped columns', () => {
  const small = body('| a | b | c |\n|:--|:-:|--:|\n| 1 | 2 \\| 3 | 4 |');
  assert.match(small, /\\begin\{longtable\}\{@\{\}lcr@\{\}\}/);
  assert.match(small, /\\textbf\{a\} & \\textbf\{b\} & \\textbf\{c\} \\\\/);
  assert.match(small, /1 & 2 \| 3 & 4 \\\\/);
  const wide = body('| Name | Description |\n|---|---|\n| x | ' + 'long text '.repeat(20) + ' |');
  assert.match(wide, /p\{0\.\d{3}\\mdtw\}/);
  assert.match(wide, /\\setlength\{\\mdtw\}/);
});

test('tables with line breaks use wrapping columns; cells starting with [ or * are protected', () => {
  const b = body('| a | b |\n|---|---|\n| x<br>y | [z |\n| *k | m |');
  assert.match(b, /\\mdtw/);
  assert.match(b, /\\newline y/);
  assert.match(b, /& \{\}\[z/);
});

test('tables inside lists and quotes avoid longtable', () => {
  const b = body('- item\n\n  | a | b |\n  |---|---|\n  | 1 | 2 |');
  assert.match(b, /\\begin\{tabular\}/);
  assert.doesNotMatch(b, /longtable/);
});

test('code blocks: verbatim environment, tabs, ASCII fallbacks, emoji, terminator guard', () => {
  const b = body('```js\nconst a = 1;\t// tab\nab\tc\n```\n\n```\n\u251C\u2500\u2500 a \u2192 b \u2713 \uD83D\uDE80\n```\n\n```\n\\end{mdverb}\n```');
  assert.match(b, /\\begin\{mdcode\}\n\\begin\{mdverb\}\nconst a = 1;    \/\/ tab\nab  c\n\\end\{mdverb\}\n\\end\{mdcode\}/);
  assert.match(b, /\|-- a -> b \[x\] \n/);
  assert.match(b, /\\end \{mdverb\}/);
  assert.equal((b.match(/\\end\{mdverb\}/g) || []).length, 3); // one real terminator per block; the text inside was neutralised
});

test('very long code tokens switch on break-anywhere', () => {
  has('```\n' + 'a'.repeat(100) + '\n```', /\\begin\{mdverb\}\[breakanywhere=true\]/);
});

test('math: inline, display, delimiters, environments', () => {
  has('Inline $a_1 + b_2$ and \\(x^2\\)', /\$a_1 \+ b_2\$ and \$x\^2\$/);
  has('$$\nE = mc^2\n$$', /\\\[\nE = mc\^2\n\\\]/);
  has('\\[\ny = x\n\\]', /\\\[\ny = x\n\\\]/);
  has('\\begin{align}\na &= b \\\\\nc &= d\n\\end{align}', /\\begin\{align\}[\s\S]*\\end\{align\}/);
  has('$$ a = b \\\\ c = d $$', /\\begin\{gathered\}/);
  has('$$\na &= b \\\\\nc &= d\n$$', /\\begin\{aligned\}/);
});

test('math: currency and escaped dollars stay text', () => {
  const b = body('I paid $5 and $10, or $3.50 total. Escaped \\$x\\$ too. Between $5-$10.');
  assert.match(b, /\\\$5 and \\\$10, or \\\$3\.50 total/);
  assert.match(b, /Escaped \\\$x\\\$ too/);
  assert.match(b, /Between \\\$5-\\\$10\./);
  assert.doesNotMatch(b, /(?<!\\)\$[^$]*\$/);
});

test('math: dangerous commands are refused, % and # are escaped, Unicode is translated', () => {
  const r = convert('$\\input{/etc/passwd}$ and $\\write18{ls}$ and $^^5cinput{x}$');
  assert.ok(r.warnings.some(w => w.code === 'math-blocked'));
  assert.doesNotMatch(r.tex.slice(r.tex.indexOf('\\begin{document}')), /\$\\input|\$\\write|\$\^\^/);
  has('$50% + a#b$', /\$50\\% \+ a\\#b\$/);
  has('$\u03B1 + \u03B2 \u2264 \u03B3$', /\$\\alpha \+ \\beta \\leq \\gamma\$/);
  has('$\u03B1x$', /\$\\alpha x\$/);
  assert.equal(MD2TeX._internals.sanitizeMath('\\csname x\\endcsname').ok, false);
  assert.equal(MD2TeX._internals.sanitizeMath('\\frac{a}{b}').ok, true);
});

test('footnotes: numbering follows reading order, repeated and missing references', () => {
  const r = convert('A[^1] B[^2] C[^1] D[^zzz]\n\n[^1]: First.\n[^2]: Second\n    continued.');
  const b = r.tex.slice(r.tex.indexOf('\\begin{document}'));
  assert.match(b, /A\\footnote\{\\label\{fn:1\}First\.\}/);
  assert.match(b, /B\\footnote\{\\label\{fn:2\}Second\ncontinued\.\}/);
  assert.match(b, /C\\textsuperscript\{\\ref\{fn:1\}\}/);
  assert.match(b, /D\[\\textasciicircum\{\}zzz\]/);
  assert.ok(r.warnings.some(w => w.code === 'footnote-missing'));
});

test('footnote in a heading is dropped with a note', () => {
  const r = convert('# Title[^a]\n\n[^a]: note');
  assert.ok(r.warnings.some(w => w.code === 'footnote-context'));
  assert.doesNotMatch(r.tex, /\\footnote/);
});

test('front matter: title, subtitle, authors, date, abstract, keywords', () => {
  const r = convert('---\ntitle: "My *Title*"\nsubtitle: Sub\nauthor:\n  - Ann\n  - Bob\n  - Cy\ndate: 2026-03-04\nkeywords: [a, b]\nabstract: |\n  Short.\n---\n\n# H\n\ntext');
  const b = r.tex;
  assert.match(b, /My \\emph\{Title\}/);
  assert.match(b, /Ann, Bob and Cy/);
  assert.match(b, /March 4, 2026/);
  assert.match(b, /\\begin\{abstract\}\nShort\.\n\\end\{abstract\}/);
  assert.match(b, /pdftitle=\{My Title\}/);
  assert.match(b, /pdfauthor=\{Ann, Bob, Cy\}/);
  assert.match(b, /pdfkeywords=\{a, b\}/);
  assert.equal(r.meta.title, 'My Title');
});

test('a single leading H1 becomes the title and the rest moves up one level', () => {
  const r = convert('# The Title\n\n## One\n\n### Two\n\ntext');
  assert.match(r.tex, /\\section\{One\}/);
  assert.match(r.tex, /\\subsection\{Two\}/);
  assert.doesNotMatch(r.tex, /\\section\{The Title\}/);
  assert.equal(r.meta.title, 'The Title');
});

test('several H1s: no title is invented, H1 stays a section', () => {
  const r = convert('# A\n\ntext\n\n# B\n\ntext');
  assert.match(r.tex, /\\section\{A\}/);
  assert.match(r.tex, /\\section\{B\}/);
  assert.equal(r.meta.hasTitle, false);
});

test('title from front matter replaces an identical first H1', () => {
  const r = convert('---\ntitle: Same\n---\n\n# Same\n\n## Part\n\ntext');
  assert.doesNotMatch(r.tex, /\\section\{Same\}/);
  assert.match(r.tex, /\\section\{Part\}/);
});

test('UI title/author/date options override the document', () => {
  const r = convert('---\ntitle: Doc\nauthor: Someone\n---\n# A\n\n## B\n\n## C', { title: 'Mine', author: 'Me', dateMode: 'custom', dateText: 'Spring' });
  assert.match(r.tex, /\{\\sffamily\\bfseries\\LARGE\\color\{mdaccent\} Mine\\par\}/);
  assert.match(r.tex, /\{\\large Me\\par\}/);
  assert.match(r.tex, /Spring/);
});

test('heading levels per class, skipped levels are clamped', () => {
  const md = '## One\n\n#### Four\n\n### Three';
  const art = convert(md).tex;
  assert.match(art, /\\section\{One\}/);
  assert.match(art, /\\subsection\{Four\}/); // jump 2 -> 4 becomes 1 -> 2
  const rep = convert(md, { documentClass: 'report' }).tex;
  assert.match(rep, /\\chapter\{One\}/);
  assert.match(rep, /\\section\{Four\}/);
});

test('headings: code/math get a PDF-safe bookmark text, links are stripped', () => {
  has('## A `code` b\n\n### [link](https://e.com) here', /\\texorpdfstring\{A \\texttt\{code\} b\}\{A code b\}/);
  has('## A\n\n### [link](https://e.com) here', /\\subsection\{link here\}/);
});

test('numbering: automatic off for hand-numbered documents, hand-typed numbers stripped otherwise', () => {
  const manual = convert('## 1. Intro\n\ntext\n\n## 2. Methods\n\ntext\n\n## 3. End\n\ntext');
  assert.match(manual.tex, /\\setcounter\{secnumdepth\}\{0\}/);
  assert.match(manual.tex, /\\section\{1\. Intro\}/);
  const partial = convert('# T\n\n## Overview\n\n### 1. Setup\n\n### 2. Usage\n\n### 3. Tips\n\n## Other');
  assert.match(partial.tex, /\\subsection\{Setup\}/);
  assert.match(partial.tex, /\\subsection\{Usage\}/);
  assert.ok(partial.warnings.some(w => w.code === 'numbers-stripped'));
  const forcedOff = convert('## A\n\ntext\n\n## B', { numbering: 'no' });
  assert.match(forcedOff.tex, /secnumdepth\}\{0\}/);
  const forcedOn = convert('## 1. A\n\ntext\n\n## 2. B', { numbering: 'yes' });
  assert.match(forcedOn.tex, /secnumdepth\}\{3\}/);
});

test('a hand-written table of contents section is removed', () => {
  const r = convert('# Doc\n\n## Table of Contents\n\n- [A](#a)\n- [B](#b)\n\n## A\n\nx\n\n## B\n\ny');
  assert.doesNotMatch(r.tex, /Table of Contents/);
  assert.ok(r.warnings.some(w => w.code === 'md-toc'));
  const kept = convert('# Doc\n\n## Table of Contents\n\n- [A](#a)\n- [B](#b)\n\n## A\n\nx\n\n## B\n\ny', { stripMdToc: false });
  assert.match(kept.tex, /Table of Contents/);
});

test('table of contents needs at least three headings', () => {
  assert.doesNotMatch(convert('## A\n\nx\n\n## B\n\ny').tex, /\\tableofcontents/);
  assert.match(convert('## A\n\nx\n\n## B\n\ny\n\n## C\n\nz').tex, /\\tableofcontents/);
  assert.doesNotMatch(convert('## A\n\nx\n\n## B\n\ny\n\n## C\n\nz', { toc: false }).tex, /\\tableofcontents/);
});

test('images: found, missing, remote, embedded, converted', () => {
  const resolve = key => ({ 'a.png': { id: 'A', name: 'a.png', ext: 'png' }, 'b.gif': { id: 'B', name: 'b.gif', ext: 'gif' }, 'c.png': { id: 'C', name: 'c.png', ext: 'png', convert: true } }[key] || null);
  const r = convert('![Alt text](a.png "Caption")\n\n![](b.gif)\n\n![x](c.png)\n\n![gone](nope.png)\n\n![r](https://e.com/x.png)\n\n![d](data:image/png;base64,AAAA)', { resolveAsset: resolve });
  assert.match(r.tex, /\\mdfigure\{images\/a\.png\}\{Alt text\}\{[^}]*\}\{Caption\}/);
  assert.match(r.tex, /\\mdfigure\{images\/b\.png\}/); // gif is re-encoded to png
  assert.match(r.tex, /\\mdfigure\{images\/c\.png\}/);
  assert.match(r.tex, /\\mdfigure\{\}\{gone\}/);
  assert.match(r.tex, /\\mdfigure\{\}\{r\}/);
  assert.match(r.tex, /\\mdfigure\{images\/embedded-image\.png\}/);
  const byId = Object.fromEntries(r.assets.map(a => [a.id, a]));
  assert.equal(byId.A.convert, false);
  assert.equal(byId.B.convert, true);
  assert.equal(byId.C.convert, true);
  assert.ok(r.assets.some(a => a.dataUri));
  assert.ok(r.warnings.some(w => w.code === 'missing-image' && /nope\.png/.test(w.message)));
  assert.ok(r.warnings.some(w => w.code === 'remote-image'));
  assert.match(r.tex, /\\usepackage\[export\]\{adjustbox\}/);
});

test('file names are made LaTeX-safe and unique', () => {
  const resolve = key => ({ id: key, name: key.replace(/^.*\//, ''), ext: 'png' });
  const r = convert('![](<a/my image (1).png>)\n\n![](<b/my image (1).png>)', { resolveAsset: resolve });
  const paths = r.assets.map(a => a.texPath);
  assert.deepEqual(paths, ['images/my_image_1_.png', 'images/my_image_1_-2.png']);
});

test('images: HTML width attribute and inline use', () => {
  const resolve = () => ({ id: 'A', name: 'a.png', ext: 'png' });
  const r = convert('<p align="center"><img src="a.png" width="320"></p>\n\nText ![i](a.png) inline.', { resolveAsset: resolve });
  assert.match(r.tex, /\{\\renewcommand\{\\mdimgw\}\{240\.0pt\}\\mdfigure/);
  assert.match(r.tex, /Text \\mdinlineimage\{images\/a\.png\}/);
});

test('HTML: comments vanish, formatting maps, details/summary, page breaks', () => {
  const b = body('<!-- hidden -->\n\n<b>bold</b> <i>it</i> <kbd>Ctrl</kbd> H<sub>2</sub>O x<sup>2</sup> a<br>b\n\n<details>\n<summary>More</summary>\n\nInside\n\n</details>\n\n<!-- pagebreak -->\n\nafter\n\n\\newpage\n\nend');
  assert.doesNotMatch(b, /hidden/);
  assert.match(b, /\\textbf\{bold\} \\emph\{it\} \\texttt\{Ctrl\} H\\textsubscript\{2\}O x\\textsuperscript\{2\} a\\newline\nb/);
  assert.match(b, /\\textbf\{More\}/);
  assert.equal((b.match(/\\clearpage/g) || []).length, 2);
});

test('HTML: unbalanced tags never unbalance the braces', () => {
  const r = convert('<b>never closed and <i>nested\n\n</u> stray close');
  assertBalanced(r.tex);
});

test('HTML headings with images keep the picture on its own line', () => {
  const r = convert('<h1 align="center"><img src="logo.png" width="200"><br>Name</h1>', { resolveAsset: () => ({ id: 'L', name: 'logo.png', ext: 'png' }) });
  assert.match(r.tex, /\\mdfigure\{images\/logo\.png\}/);
  assert.match(r.tex, /\\begin\{center\}\n\{\\bfseries\\LARGE Name\\par\}\n\\end\{center\}/);
  assert.doesNotMatch(r.tex, /\\newline Name/);
});

test('block quotes and GitHub alerts', () => {
  has('> quote\n>\n> > nested', /\\begin\{mdquote\}\nquote\n\n\\begin\{mdquote\}\nnested\n\\end\{mdquote\}\n\\end\{mdquote\}/);
  has('> [!WARNING]\n> Careful', /\\begin\{mdquote\}\n\\textbf\{Warning\}\\par\nCareful/);
  has('> [!TIP] My title\n> Body', /\\textbf\{My title\}\\par\nBody/);
});

test('alerts survive hard line breaks mode', () => {
  const r = convert('> [!NOTE]\n> text', { hardBreaks: true });
  assert.doesNotMatch(r.tex, /\\par\n\\newline/);
});

test('horizontal rules and manual page breaks', () => {
  has('a\n\n---\n\nb', /\\mdrule/);
  has('\\newpage', /\\clearpage/);
});

test('hard line breaks', () => {
  has('one  \ntwo\\\nthree', /one\\newline\ntwo\\newline\nthree/);
  has('one\ntwo', /one\ntwo/, { hardBreaks: false });
  has('one\ntwo', /one\\newline\ntwo/, { hardBreaks: true });
});

test('long unbreakable tokens get break points, ordinary words do not', () => {
  has('see some_extremely_long_identifier_without_any_spaces_at_all here', /\\allowbreak\{\}/);
  lacks('Donaudampfschifffahrtsgesellschaft', /allowbreak/);
});

test('Unicode: symbols are translated, emoji removed, scripts reported', () => {
  const r = convert('Arrows \u2192 \u21D2 and \u2264 \u2713 \u2605 \u03B1 \u00E9 \uD83D\uDE80 \u041F\u0440\u0438\u0432\u0435\u0442 \u4F60\u597D');
  assert.match(r.tex, /\\ensuremath\{\\rightarrow\} \\ensuremath\{\\Rightarrow\}/);
  assert.match(r.tex, /\\ensuremath\{\\leq\} \\ensuremath\{\\checkmark\} \\ensuremath\{\\bigstar\} \\ensuremath\{\\alpha\} \u00E9/);
  assert.doesNotMatch(r.tex.slice(r.tex.indexOf('\\begin{document}')), /\uD83D/);
  assert.ok(r.warnings.some(w => w.code === 'emoji'));
  assert.ok(r.warnings.some(w => w.code === 'script-Cyrillic'));
  assert.ok(r.warnings.some(w => w.code.startsWith('script-Chinese')));
  assert.match(r.tex, /\\setmainfont/); // Cyrillic switches to a font that has it
});

test('Unicode: invisible characters and entities', () => {
  has('zero\u200Bwidth soft\u00ADhyphen nb\u00A0sp &copy; &#9731; &amp;', /zerowidth soft\\-hyphen nb~sp \u00A9 \\&/);
});

test('emoji removal leaves tidy spacing', () => {
  has('Great \uD83D\uDE80, fine', /Great, fine/);
  has('## \uD83D\uDE80 Launch\n\n## B\n\n## C', /\\section\{Launch\}/);
});

test('pdfLaTeX target reports characters it cannot show', () => {
  const r = convert('\u4F60\u597D', { engine: 'pdflatex' });
  assert.ok(r.warnings.some(w => w.code === 'pdftex-chars'));
  assert.match(r.tex, /% !TEX program = pdflatex/);
});

test('options reach the preamble', () => {
  const t = convert('## A\n\nx\n\n## B\n\ny\n\n## C\n\nz', { documentClass: 'report', paper: 'letter', fontSize: 12, font: 'times', margins: 'wide', lineSpacing: 1.25, paragraphStyle: 'indented', theme: 'print', headerFooter: false, engine: 'lualatex', codeLineNumbers: true, extraPreamble: '\\usepackage{lipsum}' }).tex;
  assert.match(t, /^% !TEX program = lualatex/);
  assert.match(t, /\\documentclass\[12pt,letterpaper,openany\]\{report\}/);
  assert.match(t, /\\usepackage\[letterpaper,margin=3\.2cm\]\{geometry\}/);
  assert.match(t, /TeX Gyre Termes/);
  assert.match(t, /\\setstretch\{1\.25\}/);
  assert.doesNotMatch(t, /\\usepackage\{parskip\}/);
  assert.match(t, /\[table,gray\]\{xcolor\}/);
  assert.match(t, /hidelinks/);
  assert.match(t, /\\pagestyle\{plain\}/);
  assert.match(t, /\\usepackage\{lipsum\}/);
  assert.match(t, /\\titlespacing\{\\section\}/); // no star: paragraphs are indented
});

test('packages are loaded only when the document needs them', () => {
  const plain = convert('Just text.').tex;
  for (const pkg of ['longtable', 'fvextra', 'framed', 'graphicx', 'enumitem', 'ulem']) assert.doesNotMatch(plain, new RegExp('usepackage(\\[[^\\]]*\\])?\\{[^}]*' + pkg));
  assert.match(convert('| a |\n|---|\n| b |').tex, /booktabs,longtable,array/);
  assert.match(convert('```\nx\n```').tex, /\\usepackage\{fvextra\}/);
  assert.match(convert('- x').tex, /\\usepackage\{enumitem\}/);
  assert.match(convert('~~x~~').tex, /ulem/);
});

test('title page: automatic for long documents, forced and suppressed by option', () => {
  const longDoc = '# Title\n\n## A\n\n' + 'word '.repeat(1600) + '\n\n## B\n\nx\n\n## C\n\ny';
  assert.match(convert(longDoc).tex, /\\begin\{titlepage\}/);
  assert.doesNotMatch(convert(longDoc, { titlePage: 'no' }).tex, /\\begin\{titlepage\}/);
  assert.match(convert('# Title\n\nshort', { titlePage: 'yes' }).tex, /\\begin\{titlepage\}/);
  assert.doesNotMatch(convert('# Title\n\nshort').tex, /\\begin\{titlepage\}/);
  assert.match(convert('text', { titlePage: 'yes', fileName: 'my-notes_2026.md' }).tex, /My Notes 2026/);
});

test('degenerate input still yields a compilable document', () => {
  for (const md of ['', '   \n\n\t\n', '\uFEFF', '\r\n\r\n']) {
    const r = convert(md);
    assert.match(r.tex, /\\begin\{document\}\n+\\mbox\{\}\n+\\end\{document\}/);
    assertBalanced(r.tex);
  }
  assert.doesNotThrow(() => convert(null));
  assert.doesNotThrow(() => convert(undefined));
});

test('CRLF line endings and a byte-order mark are handled', () => {
  const r = convert('\uFEFF# Title\r\n\r\n## A\r\n\r\ntext\r\n');
  assert.equal(r.meta.title, 'Title');
  assert.doesNotMatch(r.tex, /\r/);
});

test('conversion is deterministic and does not mutate shared state', () => {
  const md = fs.readFileSync(path.join(__dirname, 'fixtures', 'torture.md'), 'utf8');
  const strip = s => s.replace(/\\today/g, '');
  assert.equal(strip(convert(md).tex), strip(convert(md).tex));
});

test('sniffImage recognises formats and flags what must be re-encoded', () => {
  const png = (depth, interlace) => { const b = new Uint8Array(33); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); b.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8); b.set([0, 0, 1, 0, 0, 0, 0, 128], 16); b[24] = depth; b[25] = 6; b[28] = interlace; return b; };
  assert.deepEqual(MD2TeX.sniffImage(png(8, 0)), { format: 'png', width: 256, height: 128, bitDepth: 8, interlaced: false, normalize: false });
  assert.equal(MD2TeX.sniffImage(png(16, 0)).normalize, true);
  assert.equal(MD2TeX.sniffImage(png(8, 1)).normalize, true);
  assert.equal(MD2TeX.sniffImage(Uint8Array.from(Buffer.from('GIF89a\x10\x00\x20\x00', 'latin1'))).format, 'gif');
  assert.equal(MD2TeX.sniffImage(Uint8Array.from(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).format, 'svg');
  assert.equal(MD2TeX.sniffImage(Uint8Array.from(Buffer.from('%PDF-1.4'))).normalize, false);
  assert.equal(MD2TeX.sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 100, 0, 200, 3])).format, 'jpg');
  assert.equal(MD2TeX.sniffImage(Uint8Array.from([1, 2, 3, 4, 5])).format, 'unknown');
});

test('front matter parser handles lists, block scalars, quotes and flow collections', () => {
  const y = MD2TeX._internals.parseYamlLite('title: "A: b"\ntags: [x, "y z"]\nauthors:\n  - name: Ann\n    org: X\n  - Bob\nabstract: >\n  folded\n  text\nnote: \'it\'\'s\'\n');
  assert.equal(y.title, 'A: b');
  assert.deepEqual(y.tags, ['x', 'y z']);
  assert.deepEqual(y.authors, [{ name: 'Ann', org: 'X' }, 'Bob']);
  assert.equal(y.abstract, 'folded text');
  assert.equal(y.note, "it's");
});

test('a horizontal rule at the top is not mistaken for front matter', () => {
  const r = convert('---\n\nSome text\n\n---\n\nMore');
  assert.match(r.tex, /Some text/);
});

test('every symbol in the tables is exercised by the symbols fixture', () => {
  const md = fs.readFileSync(path.join(__dirname, 'fixtures', 'symbols.md'), 'utf8');
  const missing = [];
  for (const table of [T.MATH_SYMBOLS, T.GREEK, T.SUPERSCRIPTS, T.SUBSCRIPTS, T.TEXT_SYMBOLS]) {
    for (const ch of Object.keys(table)) if (!md.includes(ch) && !/^[\u00A0\u2002-\u200A\u202F\u00AD\u2011]$/.test(ch)) missing.push(ch);
  }
  assert.deepEqual(missing, [], 'add these to tests/fixtures/symbols.md: ' + missing.join(' '));
});

// ---------------------------------------------------------------------------------------------
// Structural sanity of the generated LaTeX for every fixture (no TeX needed).
function assertBalanced(tex) {
  const src = tex
    .replace(/\\begin\{mdverb\}[\s\S]*?\n\\end\{mdverb\}/g, '')   // verbatim content is not LaTeX
    .replace(/\\[\\{}%$&#_^~]/g, '').replace(/%.*$/gm, '');
  let depth = 0;
  for (const c of src) { if (c === '{') depth++; else if (c === '}') depth--; assert.ok(depth >= 0, 'closing brace without opening'); }
  assert.equal(depth, 0, 'unbalanced braces');
  const stack = [];
  for (const m of src.matchAll(/\\(begin|end)\{([^}]+)\}/g)) {
    if (m[1] === 'begin') stack.push(m[2]);
    else assert.equal(stack.pop(), m[2], 'mismatched \\end{' + m[2] + '}');
  }
  assert.deepEqual(stack, [], 'unclosed environments');
}

const fixtureDir = path.join(__dirname, 'fixtures');
for (const f of fs.readdirSync(fixtureDir).filter(n => n.endsWith('.md'))) {
  test('fixture ' + f + ': balanced braces and environments for every document class', () => {
    const md = fs.readFileSync(path.join(fixtureDir, f), 'utf8');
    for (const documentClass of ['article', 'report', 'book']) {
      const r = convert(md, { documentClass, titlePage: 'yes', engine: 'xelatex' });
      assertBalanced(r.tex);
      assert.match(r.tex, /\\end\{document\}\n$/);
    }
  });
}
