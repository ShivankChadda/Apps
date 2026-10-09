/*!
 * Character tables for the Markdown → LaTeX converter.
 *
 *  - HTML entity decoding
 *  - Unicode symbols that Latin Modern / T1 cannot typeset on their own, mapped
 *    to LaTeX commands (math symbols, Greek, arrows, check marks, ...)
 *  - A few "draw with ASCII instead" substitutions for code blocks
 *  - Emoji detection
 *
 * Every LaTeX command used below exists in amsmath/amssymb (and in unicode-math),
 * which the generated preamble always loads. tests/ compiles all of them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MD2TeXTables = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------------ entities
  const LATIN1 = ('nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn ' +
    'sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc ' +
    'Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute ' +
    'Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml ' +
    'aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ' +
    'ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml').split(' ');

  const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  LATIN1.forEach((name, i) => { ENTITIES[name] = String.fromCharCode(160 + i); });

  const MORE_ENTITIES = {
    OElig: 'Œ', oelig: 'œ', Scaron: 'Š', scaron: 'š', Yuml: 'Ÿ', fnof: 'ƒ', circ: 'ˆ', tilde: '˜',
    ensp: '\u2002', emsp: '\u2003', thinsp: '\u2009', zwnj: '\u200C', zwj: '\u200D', lrm: '\u200E', rlm: '\u200F',
    ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', sbquo: '‚', ldquo: '“', rdquo: '”', bdquo: '„',
    dagger: '†', Dagger: '‡', bull: '•', hellip: '…', permil: '‰', prime: '′', Prime: '″', lsaquo: '‹', rsaquo: '›',
    oline: '‾', frasl: '⁄', euro: '€', trade: '™', larr: '←', uarr: '↑', rarr: '→', darr: '↓', harr: '↔',
    crarr: '↵', lArr: '⇐', uArr: '⇑', rArr: '⇒', dArr: '⇓', hArr: '⇔', forall: '∀', part: '∂', exist: '∃',
    empty: '∅', nabla: '∇', isin: '∈', notin: '∉', ni: '∋', prod: '∏', sum: '∑', minus: '−', lowast: '∗',
    radic: '√', prop: '∝', infin: '∞', ang: '∠', and: '∧', or: '∨', cap: '∩', cup: '∪', int: '∫', there4: '∴',
    sim: '∼', cong: '≅', asymp: '≈', ne: '≠', equiv: '≡', le: '≤', ge: '≥', sub: '⊂', sup: '⊃', nsub: '⊄',
    sube: '⊆', supe: '⊇', oplus: '⊕', otimes: '⊗', perp: '⊥', sdot: '⋅', lceil: '⌈', rceil: '⌉', lfloor: '⌊',
    rfloor: '⌋', lang: '⟨', rang: '⟩', loz: '◊', spades: '♠', clubs: '♣', hearts: '♥', diams: '♦',
    check: '✓', star: '☆', starf: '★', cross: '✗',
    Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η', Theta: 'Θ', Iota: 'Ι',
    Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν', Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ',
    Upsilon: 'Υ', Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι',
    kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigmaf: 'ς', sigma: 'σ',
    tau: 'τ', upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω'
  };
  Object.assign(ENTITIES, MORE_ENTITIES);

  /** Decode HTML character references (&amp; &#169; &#xA9; ...). Unknown names are left alone. */
  function decodeEntities(str) {
    if (str.indexOf('&') < 0) return str;
    return str.replace(/&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([A-Za-z][A-Za-z0-9]{1,31}));/g, (m, dec, hex, name) => {
      if (name) return Object.prototype.hasOwnProperty.call(ENTITIES, name) ? ENTITIES[name] : m;
      const cp = dec ? parseInt(dec, 10) : parseInt(hex, 16);
      if (!cp || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return '�';
      return String.fromCodePoint(cp);
    });
  }

  // ------------------------------------------------------------ symbols (math)
  // value = LaTeX math-mode command(s); the converter wraps it in \ensuremath{...}
  const MATH_SYMBOLS = {
    // arrows
    '←': '\\leftarrow', '→': '\\rightarrow', '↑': '\\uparrow', '↓': '\\downarrow', '↔': '\\leftrightarrow',
    '↕': '\\updownarrow', '⇐': '\\Leftarrow', '⇒': '\\Rightarrow', '⇑': '\\Uparrow', '⇓': '\\Downarrow',
    '⇔': '\\Leftrightarrow', '↦': '\\mapsto', '↗': '\\nearrow', '↘': '\\searrow', '↙': '\\swarrow',
    '↖': '\\nwarrow', '↩': '\\hookleftarrow', '↪': '\\hookrightarrow', '⟵': '\\longleftarrow',
    '⟶': '\\longrightarrow', '⟷': '\\longleftrightarrow', '⟸': '\\Longleftarrow', '⟹': '\\Longrightarrow',
    '⟺': '\\Longleftrightarrow', '➔': '\\rightarrow', '➜': '\\rightarrow', '➞': '\\rightarrow',
    '➡': '\\rightarrow', '⬅': '\\leftarrow', '⬆': '\\uparrow', '⬇': '\\downarrow', '⇄': '\\rightleftarrows',
    '⇆': '\\leftrightarrows', '↻': '\\circlearrowright', '↺': '\\circlearrowleft', '↵': '\\hookleftarrow',
    '⤴': '\\nearrow', '⤵': '\\searrow',
    // relations and operators
    '≤': '\\leq', '≥': '\\geq', '≠': '\\neq', '≈': '\\approx', '≡': '\\equiv', '≅': '\\cong', '∼': '\\sim',
    '≃': '\\simeq', '≪': '\\ll', '≫': '\\gg', '≺': '\\prec', '≻': '\\succ', '∝': '\\propto', '≔': ':=',
    '≲': '\\lesssim', '≳': '\\gtrsim', '≦': '\\leqq', '≧': '\\geqq', '⩽': '\\leqslant', '⩾': '\\geqslant',
    '∓': '\\mp', '⋅': '\\cdot', '∘': '\\circ', '∗': '\\ast', '⊕': '\\oplus', '⊗': '\\otimes', '⊙': '\\odot',
    '⊖': '\\ominus', '∞': '\\infty', '∂': '\\partial', '∇': '\\nabla', '∑': '\\sum', '∏': '\\prod', '∫': '\\int',
    '∬': '\\iint', '∮': '\\oint', '√': '\\surd', '∈': '\\in', '∉': '\\notin', '∋': '\\ni', '⊂': '\\subset',
    '⊃': '\\supset', '⊆': '\\subseteq', '⊇': '\\supseteq', '⊄': '\\not\\subset', '∪': '\\cup', '∩': '\\cap',
    '∖': '\\setminus', '∅': '\\varnothing', '∀': '\\forall', '∃': '\\exists', '∄': '\\nexists', '¬': '\\neg',
    '∧': '\\wedge', '∨': '\\vee', '⊢': '\\vdash', '⊨': '\\models', '⊤': '\\top', '⊥': '\\bot', '∴': '\\therefore',
    '∵': '\\because', '∥': '\\parallel', '∠': '\\angle', '∣': '\\mid', '⋯': '\\cdots', '⋮': '\\vdots',
    '⋱': '\\ddots', '⌈': '\\lceil', '⌉': '\\rceil', '⌊': '\\lfloor', '⌋': '\\rfloor', '⟨': '\\langle',
    '⟩': '\\rangle', '−': '-', '∕': '/', '∙': '\\cdot', '⋆': '\\star', '†': '\\dagger', '‡': '\\ddagger',
    '′': "^{\\prime}", '″': "^{\\prime\\prime}", '‴': "^{\\prime\\prime\\prime}",
    'ℓ': '\\ell', 'ℏ': '\\hslash', 'ℵ': '\\aleph', 'ℜ': '\\Re', 'ℑ': '\\Im', '℘': '\\wp',
    'ℝ': '\\mathbb{R}', 'ℕ': '\\mathbb{N}', 'ℤ': '\\mathbb{Z}', 'ℚ': '\\mathbb{Q}', 'ℂ': '\\mathbb{C}',
    'ℙ': '\\mathbb{P}', '𝔼': '\\mathbb{E}',
    // check marks, crosses, stars, shapes, suits
    '✓': '\\checkmark', '✔': '\\checkmark', '✅': '\\checkmark', '☑': '\\boxtimes', '✗': '\\times',
    '✘': '\\times', '✕': '\\times', '✖': '\\times', '❌': '\\times', '❎': '\\times', '☒': '\\boxtimes',
    '☐': '\\square', '★': '\\bigstar', '☆': '\\star', '⭐': '\\bigstar', '🌟': '\\bigstar', '■': '\\blacksquare',
    '□': '\\square', '▪': '\\blacksquare', '▫': '\\square', '◼': '\\blacksquare', '◻': '\\square',
    '◾': '\\blacksquare', '◽': '\\square', '●': '\\bullet', '○': '\\circ', '◯': '\\bigcirc', '⚫': '\\bullet',
    '⚪': '\\circ', '◆': '\\blacklozenge', '◇': '\\lozenge', '◊': '\\lozenge', '▲': '\\blacktriangle',
    '△': '\\triangle', '▼': '\\blacktriangledown', '▽': '\\triangledown', '▶': '\\blacktriangleright',
    '►': '\\blacktriangleright', '▷': '\\triangleright', '◀': '\\blacktriangleleft', '◄': '\\blacktriangleleft',
    '◁': '\\triangleleft', '♠': '\\spadesuit', '♥': '\\heartsuit', '♦': '\\diamondsuit', '♣': '\\clubsuit',
    '❤': '\\heartsuit', '♀': '\\female', '♂': '\\male'
  };
  // \female / \male are not in amssymb; give them portable definitions instead.
  delete MATH_SYMBOLS['♀']; delete MATH_SYMBOLS['♂'];

  // super / subscripts
  const SUPERSCRIPTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ⁱ': 'i' };
  const SUBSCRIPTS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')', 'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ₙ': 'n', 'ₘ': 'm' };

  // Greek (math-mode names). Upper-case letters identical to Latin ones use \mathrm.
  const GREEK = {
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon', 'ϵ': '\\epsilon',
    'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta', 'ϑ': '\\vartheta', 'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda',
    'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'ο': 'o', 'π': '\\pi', 'ϖ': '\\varpi', 'ρ': '\\rho', 'ς': '\\varsigma',
    'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\varphi', 'ϕ': '\\phi', 'χ': '\\chi', 'ψ': '\\psi',
    'ω': '\\omega', 'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda', 'Ξ': '\\Xi', 'Π': '\\Pi',
    'Σ': '\\Sigma', 'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega', 'Α': '\\mathrm{A}', 'Β': '\\mathrm{B}',
    'Ε': '\\mathrm{E}', 'Ζ': '\\mathrm{Z}', 'Η': '\\mathrm{H}', 'Ι': '\\mathrm{I}', 'Κ': '\\mathrm{K}',
    'Μ': '\\mathrm{M}', 'Ν': '\\mathrm{N}', 'Ο': '\\mathrm{O}', 'Ρ': '\\mathrm{P}', 'Τ': '\\mathrm{T}',
    'Υ': '\\mathrm{Y}', 'Χ': '\\mathrm{X}'
  };

  // ------------------------------------------------------------- text symbols
  // value = LaTeX text-mode replacement (works in pdfLaTeX T1 and in XeLaTeX/LuaLaTeX)
  const TEXT_SYMBOLS = {
    '•': '\\textbullet{}', '‣': '\\textbullet{}', '◦': '\\ensuremath{\\circ}', '⁃': '\\textendash{}',
    '‐': '-', '‑': '\\mbox{-}', '‒': '\\textendash{}', '―': '\\textemdash{}',
    '\u00A0': '~', '\u2002': '\\ ', '\u2003': '\\quad{}', '\u2009': '\\,', '\u200A': '\\,', '\u202F': '\\,',
    '\u2007': '\\ ', '\u2008': '\\ ', '\u2005': '\\ ', '\u2004': '\\ ', '\u2006': '\\,',
    '\u00AD': '\\-', '℃': '\\ensuremath{^{\\circ}}C', '℉': '\\ensuremath{^{\\circ}}F',
    '№': 'No.', '℗': '(P)', '℠': '\\textsuperscript{SM}', '⁄': '/', '‾': '\\textasciimacron{}',
    '❓': '?', '❔': '?', '❗': '!', '❕': '!', '‼': '!!', '⁉': '?!',
    '⚠': '\\textbf{(!)}', 'ℹ': '\\textbf{i}', '➕': '+', '➖': '-', '➗': '\\ensuremath{\\div}',
    '✱': '*', '✲': '*', '✳': '*', '❖': '\\ensuremath{\\blacklozenge}', '❯': '\\ensuremath{\\rangle}',
    '❮': '\\ensuremath{\\langle}'
  };

  // Characters pdfLaTeX (T1 + utf8 + textcomp) renders without help. Everything outside
  // this set that is not mapped above is reported to the user.
  function pdftexSupports(cp) {
    return (cp >= 0x20 && cp < 0x7f) || (cp >= 0xa0 && cp <= 0x17f) ||
      (cp >= 0x2010 && cp <= 0x2027) || (cp >= 0x2030 && cp <= 0x203a) || cp === 0x20ac || cp === 0x2122 ||
      cp === 0x2013 || cp === 0x2014 || cp === 0x0a || cp === 0x09 || cp === 0x0d;
  }

  // ------------------------------------------------------------- code blocks
  // Latin Modern Mono has no box-drawing or arrow glyphs; draw them with ASCII instead.
  const CODE_TRANSLIT = {
    '─': '-', '━': '-', '┄': '-', '┈': '-', '╌': '-', '│': '|', '┃': '|', '┆': '|', '┊': '|', '╎': '|',
    '┌': '+', '┍': '+', '┎': '+', '┏': '+', '┐': '+', '┑': '+', '┒': '+', '┓': '+', '└': '`', '┕': '`',
    '┖': '`', '┗': '`', '┘': "'", '┙': "'", '┚': "'", '┛': "'", '├': '|', '┝': '|', '┞': '|', '┟': '|',
    '┠': '|', '┡': '|', '┢': '|', '┣': '|', '┤': '|', '┥': '|', '┦': '|', '┧': '|', '┨': '|', '┩': '|',
    '┪': '|', '┫': '|', '┬': '+', '┭': '+', '┮': '+', '┯': '+', '┰': '+', '┱': '+', '┲': '+', '┳': '+',
    '┴': '+', '┵': '+', '┶': '+', '┷': '+', '┸': '+', '┹': '+', '┺': '+', '┻': '+', '┼': '+', '╋': '+',
    '═': '=', '║': '|', '╔': '+', '╗': '+', '╚': '+', '╝': '+', '╠': '|', '╣': '|', '╦': '+', '╩': '+',
    '╬': '+', '╒': '+', '╓': '+', '╕': '+', '╖': '+', '╘': '+', '╙': '+', '╛': '+', '╜': '+', '╞': '|',
    '╟': '|', '╡': '|', '╢': '|', '╤': '+', '╥': '+', '╧': '+', '╨': '+', '╪': '+', '╫': '+',
    '╭': '+', '╮': '+', '╯': '+', '╰': '+', '█': '#', '▓': '#', '▒': '+', '░': '.',
    '→': '->', '←': '<-', '↔': '<->', '⇒': '=>', '⇐': '<=', '⇔': '<=>', '⟶': '-->', '⟵': '<--',
    '↑': '^', '↓': 'v', '▶': '>', '►': '>', '◀': '<', '◄': '<', '▲': '^', '▼': 'v', '↦': '|->',
    '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~=', '×': 'x', '÷': '/', '−': '-', '•': '*', '·': '.',
    '✓': '[x]', '✔': '[x]', '✅': '[x]', '☑': '[x]', '✗': '[ ]', '✘': '[ ]', '❌': '[ ]', '☐': '[ ]',
    '\u00A0': ' ', '\u2002': ' ', '\u2003': ' ', '\u2009': ' ', '\u202F': ' '
  };

  // ------------------------------------------------------------------- emoji
  // Extended_Pictographic also contains © ® ™ and a few arrows; those are handled by the
  // maps above (or pass through) before this test is applied.
  const RE_EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}\u20E3]/u;
  const RE_INVISIBLE = /[\u200B\u200C\u200D\u2060\uFEFF\uFE0E\uFE0F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g; // for .replace()
  const RE_INVISIBLE_1 = new RegExp(RE_INVISIBLE.source);                                               // for .test() (no lastIndex state)
  const PASS_THROUGH_PICTOGRAPHIC = new Set(['©', '®', '™', '‼', '⁉']);

  // Scripts a Latin Modern based document cannot show without extra fonts.
  const SCRIPTS = [
    ['Cyrillic', /\p{Script=Cyrillic}/u],
    ['Greek', /\p{Script=Greek}/u],
    ['Chinese/Japanese/Korean', /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u],
    ['Arabic', /\p{Script=Arabic}/u],
    ['Hebrew', /\p{Script=Hebrew}/u],
    ['Devanagari', /\p{Script=Devanagari}/u],
    ['Thai', /\p{Script=Thai}/u]
  ];

  return {
    ENTITIES, decodeEntities, MATH_SYMBOLS, SUPERSCRIPTS, SUBSCRIPTS, GREEK, TEXT_SYMBOLS, CODE_TRANSLIT,
    RE_EMOJI, RE_INVISIBLE, RE_INVISIBLE_1, PASS_THROUGH_PICTOGRAPHIC, SCRIPTS, pdftexSupports
  };
});
