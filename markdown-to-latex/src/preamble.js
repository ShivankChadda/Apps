/*!
 * LaTeX preamble builder for the Markdown → LaTeX converter.
 *
 * Produces everything before \begin{document}. The result compiles with XeLaTeX,
 * LuaLaTeX and pdfLaTeX; packages are only loaded when the document needs them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MD2TeXPreamble = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MARGINS = { narrow: '1.9cm', normal: '2.5cm', wide: '3.2cm' };

  /** Nested \IfFontExistsTF chain: first font that exists wins, otherwise `last`. */
  function fontChain(names, action, last) {
    let out = last || '';
    for (let i = names.length - 1; i >= 0; i--) {
      out = '\\IfFontExistsTF{' + names[i] + '}{' + action(names[i]) + '}{' + out + '}';
    }
    return out;
  }

  const FONT_FAMILIES = {
    latinmodern: null,
    times: { main: 'TeX Gyre Termes', sans: 'TeX Gyre Heros', math: 'TeX Gyre Termes Math' },
    palatino: { main: 'TeX Gyre Pagella', sans: 'TeX Gyre Heros', math: 'TeX Gyre Pagella Math' }
  };

  const ADDON_OPTIONS = { mhchem: '[version=4]' };
  const loadAddon = pkg => '\\IfFileExists{' + pkg + '.sty}{\\usepackage' + (ADDON_OPTIONS[pkg] || '') + '{' + pkg + '}}{}';

  /**
   * Packages for commands that formulas use but plain LaTeX lacks (see MATH_ADDONS in md2tex.js).
   * unicode-math wants amsmath, mathtools and the like loaded before it ("early"). Two packages depend on
   * whether unicode-math is active (`uni`): bm does not work with it (\bm becomes \mathbfit), and mathrsfs
   * is not needed because unicode-math has \mathscr.
   */
  function mathAddons(s, which) {
    const fam = FONT_FAMILIES[s.font];
    const pkgs = s.uses.mathPkgs || [];
    const lines = [];
    for (const pkg of pkgs) {
      if (which === 'early' && pkg !== 'bm' && pkg !== 'mathrsfs') lines.push(loadAddon(pkg));
      else if (which === 'uni' && pkg === 'bm') lines.push('\\providecommand{\\bm}[1]{\\mathbfit{#1}}');
      else if (which === 'plain' && (pkg === 'bm' || pkg === 'mathrsfs')) lines.push(loadAddon(pkg));
    }
    return lines;
  }

  function fontBlock(s) {
    const fam = FONT_FAMILIES[s.font];
    const lines = [];
    lines.push('%% ---------- Engine, encoding and fonts ----------');
    lines.push('\\usepackage{iftex}');
    lines.push('\\ifPDFTeX');
    lines.push('  \\usepackage[T1]{fontenc}');
    lines.push('  \\usepackage[utf8]{inputenc}');
    lines.push('  \\usepackage{textcomp}');
    lines.push('  % Never abort on a character pdfLaTeX cannot typeset: skip it and warn instead.');
    lines.push('  \\makeatletter');
    lines.push('  \\@ifundefined{UTFviii@undefined@err}{}{%');
    lines.push('    \\def\\UTFviii@undefined@err#1{\\PackageWarning{md2latex}{Unsupported character omitted}}}');
    lines.push('  \\makeatother');
    if (s.font === 'times') {
      lines.push('  \\usepackage{mathptmx}');
      lines.push('  \\usepackage[scaled=.92]{helvet}');
      lines.push('  \\renewcommand{\\ttdefault}{lmtt}');
    } else if (s.font === 'palatino') {
      lines.push('  \\usepackage{mathpazo}');
      lines.push('  \\usepackage[scaled=.92]{helvet}');
      lines.push('  \\renewcommand{\\ttdefault}{lmtt}');
    } else {
      lines.push('  \\usepackage{lmodern}');
    }
    lines.push('\\else');
    lines.push('  \\usepackage{fontspec}');
    const wide = s.needs.cyrillic || s.needs.greekText;
    if (fam) {
      lines.push('  % Falls back to Latin Modern when the font is not installed.');
      const mains = wide ? [fam.main, 'TeX Gyre Termes', 'Times New Roman', 'DejaVu Serif', 'Noto Serif'] : [fam.main];
      lines.push('  ' + fontChain(mains, n => '\\setmainfont{' + n + '}', ''));
      lines.push('  \\IfFontExistsTF{' + fam.sans + '}{\\setsansfont{' + fam.sans + '}[Scale=0.92]}{}');
    } else if (wide) {
      lines.push('  % Latin Modern has no Greek or Cyrillic glyphs: switch to a font that does.');
      lines.push('  ' + fontChain(['TeX Gyre Termes', 'Times New Roman', 'DejaVu Serif', 'Noto Serif'], n => '\\setmainfont{' + n + '}', ''));
    }
    if (s.needs.codeWide) {
      lines.push('  % Code contains symbols Latin Modern Mono lacks: prefer DejaVu Sans Mono when available.');
      lines.push('  \\IfFontExistsTF{DejaVu Sans Mono}{\\setmonofont{DejaVu Sans Mono}[Scale=MatchLowercase]}{}');
    }
    lines.push('\\fi');
    lines.push('');
    lines.push('%% ---------- Mathematics ----------');
    lines.push('\\usepackage{amsmath}');
    mathAddons(s, 'early').forEach(l => lines.push(l));
    if (fam) {
      lines.push('\\newif\\ifmdunimath');
      lines.push('\\ifPDFTeX\\else\\IfFontExistsTF{' + fam.math + '}{\\mdunimathtrue}{}\\fi');
      lines.push('\\ifmdunimath');
      lines.push('  \\usepackage{unicode-math}');
      lines.push('  \\setmathfont{' + fam.math + '}');
      mathAddons(s, 'uni').forEach(l => lines.push('  ' + l));
      lines.push('  % A few shapes (star, black triangles, black lozenge) are missing from the TeX Gyre math fonts.');
      lines.push('  % unicode-math defines its symbols when the document starts, so the replacements run after it.');
      lines.push('  \\IfFontExistsTF{DejaVu Sans}{%');
      lines.push('    \\newfontfamily\\mdsymfont{DejaVu Sans}%');
      lines.push('    \\AtBeginDocument{%');
      lines.push('      \\renewcommand{\\bigstar}{\\text{\\mdsymfont\\char"2605}}%');
      lines.push('      \\renewcommand{\\blacklozenge}{\\text{\\mdsymfont\\char"29EB}}%');
      lines.push('      \\renewcommand{\\blacktriangle}{\\text{\\mdsymfont\\char"25B2}}%');
      lines.push('      \\renewcommand{\\blacktriangledown}{\\text{\\mdsymfont\\char"25BC}}%');
      lines.push('      \\renewcommand{\\triangledown}{\\text{\\mdsymfont\\char"25BD}}}%');
      lines.push('  }{%');
      lines.push('    \\AtBeginDocument{%');
      lines.push('      \\renewcommand{\\bigstar}{\\star}%');
      lines.push('      \\renewcommand{\\blacklozenge}{\\blacksquare}%');
      lines.push('      \\renewcommand{\\blacktriangle}{\\bigtriangleup}%');
      lines.push('      \\renewcommand{\\blacktriangledown}{\\bigtriangledown}%');
      lines.push('      \\renewcommand{\\triangledown}{\\bigtriangledown}}%');
      lines.push('  }');
      lines.push('  % amssymb spellings that unicode-math names differently');
      lines.push('  \\providecommand{\\square}{\\mdlgwhtsquare}');
      lines.push('  \\providecommand{\\blacksquare}{\\mdlgblksquare}');
      lines.push('  \\providecommand{\\lozenge}{\\mdlgwhtlozenge}');
      lines.push('  \\providecommand{\\blacklozenge}{\\mdlgblklozenge}');
      lines.push('  \\providecommand{\\circlearrowleft}{\\acwopencirclearrow}');
      lines.push('  \\providecommand{\\circlearrowright}{\\cwopencirclearrow}');
      lines.push('\\else');
      lines.push('  \\usepackage{amssymb}');
      mathAddons(s, 'plain').forEach(l => lines.push('  ' + l));
      lines.push('\\fi');
    } else {
      lines.push('\\usepackage{amssymb}');
      mathAddons(s, 'plain').forEach(l => lines.push(l));
    }
    return lines.join('\n');
  }

  function colorBlock(s) {
    const print = s.theme === 'print';
    return [
      '%% ---------- Colours ----------',
      '\\usepackage[table' + (print ? ',gray' : '') + ']{xcolor}',
      '\\definecolor{mdaccent}{HTML}{1F3A5F}',
      '\\definecolor{mdlink}{HTML}{1A5FB4}',
      '\\definecolor{mdmuted}{HTML}{57606A}',
      '\\definecolor{mdrule}{HTML}{C9D1D9}',
      '\\definecolor{mdbar}{HTML}{AEB8C4}',
      '\\definecolor{mdshade}{HTML}{F6F8FA}',
      '\\colorlet{shadecolor}{mdshade}'
    ].join('\n');
  }

  function layoutBlock(s) {
    const lines = ['%% ---------- Page layout and typography ----------'];
    lines.push('\\usepackage[' + (s.paper === 'letter' ? 'letterpaper' : 'a4paper') + ',margin=' + (MARGINS[s.margins] || MARGINS.normal) + ']{geometry}');
    lines.push('\\usepackage{microtype}');
    if (s.paragraphStyle !== 'indented') lines.push('\\usepackage{parskip}');
    if (s.lineSpacing && s.lineSpacing !== 1) {
      lines.push('\\usepackage{setspace}');
      lines.push('\\setstretch{' + s.lineSpacing + '}');
    }
    lines.push('\\emergencystretch=3em');
    lines.push('% A line break after text that came out empty (characters the engine had to skip) must not stop the build.');
    lines.push('\\makeatletter');
    lines.push('\\DeclareRobustCommand{\\newline}{\\leavevmode\\@normalcr\\relax}');
    lines.push('\\makeatother');
    lines.push('\\widowpenalty=10000 \\clubpenalty=10000');
    lines.push('\\raggedbottom');
    return lines.join('\n');
  }

  function headingBlock(s) {
    const book = s.docClass !== 'article';
    const lines = ['%% ---------- Headings and numbering ----------', '\\usepackage{titlesec}', '\\usepackage{needspace}'];
    if (book) {
      lines.push('\\titleformat{\\chapter}[display]{\\sffamily\\bfseries\\color{mdaccent}}{\\Large\\chaptertitlename\\ \\thechapter}{0.4em}{\\Huge}');
      lines.push('\\titlespacing*{\\chapter}{0pt}{-1em}{1.6em}');
    }
    const star = s.paragraphStyle === 'indented' ? '' : '*';
    lines.push(
      '\\titleformat{\\section}{\\sffamily\\Large\\bfseries\\color{mdaccent}}{\\thesection}{0.75em}{}',
      '\\titleformat{\\subsection}{\\sffamily\\large\\bfseries\\color{mdaccent}}{\\thesubsection}{0.75em}{}',
      '\\titleformat{\\subsubsection}{\\sffamily\\normalsize\\bfseries\\color{mdaccent}}{\\thesubsubsection}{0.75em}{}',
      '\\titleformat{\\paragraph}[hang]{\\sffamily\\normalsize\\bfseries}{\\theparagraph}{0.75em}{}',
      '\\titleformat{\\subparagraph}[hang]{\\sffamily\\normalsize\\itshape\\bfseries}{\\thesubparagraph}{0.75em}{}',
      '\\titlespacing' + star + '{\\section}{0pt}{2.2ex plus 0.6ex minus 0.2ex}{1ex plus 0.2ex}',
      '\\titlespacing' + star + '{\\subsection}{0pt}{1.9ex plus 0.5ex minus 0.2ex}{0.8ex plus 0.2ex}',
      '\\titlespacing' + star + '{\\subsubsection}{0pt}{1.6ex plus 0.4ex minus 0.2ex}{0.6ex plus 0.2ex}',
      '\\titlespacing' + star + '{\\paragraph}{0pt}{1.4ex plus 0.3ex}{0.5ex}',
      '\\titlespacing' + star + '{\\subparagraph}{0pt}{1.2ex plus 0.3ex}{0.5ex}'
    );
    lines.push('\\setcounter{secnumdepth}{' + s.secnumdepth + '}');
    lines.push('\\setcounter{tocdepth}{' + s.tocdepth + '}');
    return lines.join('\n');
  }

  function tocBlock(s) {
    const book = s.docClass !== 'article';
    const L = ['%% ---------- Table of contents ----------', '\\usepackage{tocloft}'];
    L.push('\\renewcommand{\\cfttoctitlefont}{\\sffamily\\Large\\bfseries\\color{mdaccent}}');
    L.push('\\renewcommand{\\cftaftertoctitle}{}');
    L.push('\\setlength{\\cftbeforetoctitleskip}{0pt}');
    L.push('\\setlength{\\cftaftertoctitleskip}{1em}');
    L.push('\\renewcommand{\\cftdotsep}{2.2}');
    if (book) {
      L.push('\\renewcommand{\\cftchapfont}{\\bfseries}', '\\renewcommand{\\cftchappagefont}{\\bfseries}',
        '\\setlength{\\cftbeforechapskip}{0.6em}',
        '\\setlength{\\cftchapindent}{0em}', '\\setlength{\\cftchapnumwidth}{2.6em}',
        '\\setlength{\\cftsecindent}{2.6em}', '\\setlength{\\cftsecnumwidth}{3.4em}',
        '\\setlength{\\cftsubsecindent}{6em}', '\\setlength{\\cftsubsecnumwidth}{4.2em}',
        '\\setlength{\\cftsubsubsecindent}{10.2em}', '\\setlength{\\cftsubsubsecnumwidth}{5em}');
    } else {
      L.push('\\renewcommand{\\cftsecfont}{\\bfseries}', '\\renewcommand{\\cftsecpagefont}{\\bfseries}',
        '\\renewcommand{\\cftsecleader}{\\hfill}',
        '\\setlength{\\cftbeforesecskip}{0.5em}',
        '\\setlength{\\cftsecindent}{0em}', '\\setlength{\\cftsecnumwidth}{2.6em}',
        '\\setlength{\\cftsubsecindent}{2.6em}', '\\setlength{\\cftsubsecnumwidth}{3.4em}',
        '\\setlength{\\cftsubsubsecindent}{6em}', '\\setlength{\\cftsubsubsecnumwidth}{4.2em}',
        '\\setlength{\\cftparaindent}{10.2em}', '\\setlength{\\cftparanumwidth}{5em}');
    }
    return L.join('\n');
  }

  function listBlock() {
    return [
      '%% ---------- Lists ----------',
      '\\usepackage{enumitem}',
      '\\setlistdepth{9}',
      '\\renewlist{itemize}{itemize}{9}',
      '\\renewlist{enumerate}{enumerate}{9}',
      '\\setlist[itemize,1]{label=\\textbullet}',
      '\\setlist[itemize,2]{label=\\textendash}',
      '\\setlist[itemize,3]{label=\\textasteriskcentered}',
      '\\setlist[itemize,4,5,6,7,8,9]{label=\\textperiodcentered}',
      '\\setlist[enumerate]{label=\\arabic*.}',
      '\\setlist{leftmargin=*,itemsep=0.2em,parsep=0.3em,topsep=0.3em}'
    ].join('\n');
  }

  function tableBlock() {
    return [
      '%% ---------- Tables ----------',
      '\\usepackage{booktabs,longtable,array}',
      '\\newlength{\\mdtw}',
      '\\renewcommand{\\arraystretch}{1.22}',
      '\\setlength{\\LTpre}{0.5\\baselineskip}',
      '\\setlength{\\LTpost}{0.5\\baselineskip}'
    ].join('\n');
  }

  function codeBlock(s) {
    const opts = ['fontsize=\\small', 'breaklines=true'];
    if (s.codeLineNumbers) opts.push('numbers=left', 'numbersep=8pt', 'numberblanklines=false');
    return [
      '%% ---------- Code blocks ----------',
      '\\usepackage{fancyvrb}',
      '\\usepackage{fvextra}',
      '\\usepackage{framed}',
      '\\DefineVerbatimEnvironment{mdverb}{Verbatim}{' + opts.join(',') + '}',
      '\\newenvironment{mdcode}{\\par\\vspace{0.25\\baselineskip}\\begin{snugshade}}{\\end{snugshade}\\par\\vspace{0.25\\baselineskip}}'
    ].join('\n');
  }

  function quoteBlock(s) {
    const lines = ['%% ---------- Block quotes ----------'];
    if (!s.uses.code) lines.push('\\usepackage{framed}');
    // \if@newlist: a quote that is the very first thing in a list would otherwise stop LaTeX with "perhaps a missing \item"
    lines.push(
      '\\makeatletter',
      '\\newenvironment{mdquote}{%',
      '  \\if@newlist\\leavevmode\\fi',
      '  \\def\\FrameCommand{{\\color{mdbar}\\vrule width 3pt}\\hspace{0.9em}}%',
      '  \\MakeFramed{\\advance\\hsize-\\width\\FrameRestore}}%',
      ' {\\endMakeFramed}',
      '\\makeatother'
    );
    return lines.join('\n');
  }

  function imageBlock() {
    return [
      '%% ---------- Images ----------',
      '\\usepackage{graphicx}',
      '\\usepackage[export]{adjustbox}',
      '\\usepackage{caption}',
      '\\captionsetup{font=small,labelfont={bf,sf},labelsep=colon,skip=6pt}',
      '\\newcommand{\\mdimgw}{\\linewidth}',
      '\\newcommand{\\mdmissing}[2]{\\fbox{\\parbox{0.85\\linewidth}{\\centering\\small\\color{mdmuted}Image not available\\\\[2pt]\\texttt{#2}\\\\[2pt]#1}}}',
      '\\newcommand{\\mdimage}[3]{%',
      '  \\if\\relax\\detokenize{#1}\\relax\\mdmissing{#2}{#3}\\else',
      '  \\IfFileExists{#1}{\\includegraphics[max width=\\mdimgw,max height=0.42\\textheight]{#1}}{\\mdmissing{#2}{#3}}\\fi}',
      '\\newcommand{\\mdinlineimage}[3]{%',
      '  \\if\\relax\\detokenize{#1}\\relax\\textit{[#2]}\\else',
      '  \\IfFileExists{#1}{\\raisebox{-0.2em}{\\includegraphics[max height=1.2em,max width=0.35\\linewidth]{#1}}}{\\textit{[#2]}}\\fi}',
      '\\newcommand{\\mdfigure}[4]{%',
      '  \\par\\medskip\\noindent\\begin{minipage}{\\linewidth}\\centering',
      '  \\mdimage{#1}{#2}{#3}\\par',
      '  \\if\\relax\\detokenize{#4}\\relax\\else\\captionof{figure}{#4}\\fi',
      '  \\end{minipage}\\par\\medskip}'
    ].join('\n');
  }

  function headerFooterBlock(s) {
    const book = s.docClass !== 'article';
    const lines = ['%% ---------- Running header and footer ----------'];
    if (!s.headerFooter) {
      lines.push('\\pagestyle{plain}');
      return lines.join('\n');
    }
    const foot = s.meta.footerTitleTex
      ? '\\fancyfoot[L]{\\small\\sffamily\\color{mdmuted}' + s.meta.footerTitleTex + '}'
      : '';
    lines.push('\\usepackage{fancyhdr}');
    lines.push('\\pagestyle{fancy}');
    lines.push('\\fancyhf{}');
    lines.push('\\setlength{\\headheight}{14pt}');
    lines.push('\\renewcommand{\\headrulewidth}{0.4pt}');
    lines.push('\\renewcommand{\\headrule}{{\\color{mdrule}\\hrule width\\headwidth height\\headrulewidth \\vskip-\\headrulewidth}}');
    lines.push(book ? '\\renewcommand{\\chaptermark}[1]{\\markboth{#1}{}}' : '\\renewcommand{\\sectionmark}[1]{\\markboth{#1}{}}');
    lines.push('\\fancyhead[L]{\\small\\sffamily\\color{mdmuted}\\nouppercase{\\leftmark}}');
    if (foot) lines.push(foot);
    lines.push('\\fancyfoot[R]{\\small\\sffamily\\color{mdmuted}\\thepage}');
    lines.push('\\fancypagestyle{plain}{\\fancyhf{}\\renewcommand{\\headrulewidth}{0pt}' + (foot ? foot : '') + '\\fancyfoot[R]{\\small\\sffamily\\color{mdmuted}\\thepage}}');
    return lines.join('\n');
  }

  function hyperrefBlock(s) {
    const print = s.theme === 'print';
    const opts = print
      ? 'hidelinks'
      : 'colorlinks=true,linkcolor=mdlink,urlcolor=mdlink,citecolor=mdlink';
    const lines = ['%% ---------- Links and PDF metadata (load last) ----------'];
    lines.push('\\usepackage[' + opts + ',bookmarksnumbered=true,breaklinks=true,unicode=true]{hyperref}');
    const meta = [];
    if (s.meta.titlePlain) meta.push('pdftitle={' + s.meta.titlePlain + '}');
    if (s.meta.authorPlain) meta.push('pdfauthor={' + s.meta.authorPlain + '}');
    if (s.meta.keywordsPlain) meta.push('pdfkeywords={' + s.meta.keywordsPlain + '}');
    meta.push('pdfcreator={Markdown to LaTeX converter}');
    lines.push('\\hypersetup{' + meta.join(',') + '}');
    lines.push('\\urlstyle{same}');
    return lines.join('\n');
  }

  function buildPreamble(s) {
    const book = s.docClass !== 'article';
    const classOpts = [s.fontSize + 'pt', s.paper === 'letter' ? 'letterpaper' : 'a4paper'];
    if (s.docClass === 'book') classOpts.push('oneside', 'openany');
    if (s.docClass === 'report') classOpts.push('openany');

    const out = [];
    out.push('% !TEX program = ' + s.engine);
    out.push('% !TEX encoding = UTF-8 Unicode');
    out.push('%');
    out.push('% ' + '-'.repeat(74));
    out.push('%  Generated by the Markdown → LaTeX converter');
    if (s.sourceName) out.push('%  Source : ' + s.sourceName.replace(/[\r\n]+/g, ' '));
    out.push('%  Build  : ' + s.engine + ' ' + (s.texName || 'document.tex') + '    (run it twice so the table of contents is complete)');
    out.push('%  Engines: XeLaTeX or LuaLaTeX recommended; pdfLaTeX also works for Western-language text.');
    out.push('% ' + '-'.repeat(74));
    out.push('\\documentclass[' + classOpts.join(',') + ']{' + s.docClass + '}');
    out.push('');
    out.push(fontBlock(s));
    out.push('');
    out.push(layoutBlock(s));
    out.push('');
    out.push(colorBlock(s));
    out.push('');
    out.push(headingBlock(s));
    if (s.toc) { out.push(''); out.push(tocBlock(s)); }
    if (s.uses.lists) { out.push(''); out.push(listBlock()); }
    if (s.uses.tables) { out.push(''); out.push(tableBlock()); }
    if (s.uses.code) { out.push(''); out.push(codeBlock(s)); }
    if (s.uses.quote) { out.push(''); out.push(quoteBlock(s)); }
    if (s.uses.images) { out.push(''); out.push(imageBlock()); }
    if (s.uses.strike) { out.push(''); out.push('%% ---------- Strikethrough ----------'); out.push('\\usepackage[normalem]{ulem}'); }
    if (s.uses.rule) {
      out.push('');
      out.push('%% ---------- Horizontal rule ----------');
      out.push('\\newcommand{\\mdrule}{\\par\\vspace{0.4\\baselineskip}\\noindent{\\color{mdrule}\\rule{\\linewidth}{0.6pt}}\\par\\vspace{0.4\\baselineskip}}');
    }
    out.push('');
    out.push(headerFooterBlock(s));
    out.push('');
    out.push(hyperrefBlock(s));
    if (s.extraPreamble && s.extraPreamble.trim()) {
      out.push('');
      out.push('%% ---------- Your extra preamble ----------');
      out.push(s.extraPreamble.replace(/\s+$/, ''));
    }
    return out.join('\n');
  }

  return { buildPreamble, MARGINS, FONT_FAMILIES };
});
