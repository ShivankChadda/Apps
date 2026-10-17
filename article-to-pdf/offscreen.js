/* Built-in PDF writer: a page laid out like a LaTeX article (Latin Modern, justified text,
 * same title block). Runs in an offscreen document because it needs a full browser page. */
const FONTS = {
  'lmroman10-regular.otf': 0, 'lmroman10-bold.otf': 0, 'lmroman10-italic.otf': 0,
  'lmroman10-bolditalic.otf': 0, 'lmmono10-regular.otf': 0,
};
const LINK = '#000080'; // hyperref's blue!50!black
const TEXT_W = 453;     // A4 less 2.5 cm margins, in points
const IMG_H = 245;      // 0.35 of the text height, like the LaTeX version

const ASCII_FOR = { '≈': '~', '≤': '<=', '≥': '>=', '≠': '!=', ' ': ' ', ' ': ' ',
  ' ': ' ', '‑': '-', '​': '', '‌': '', '‍': '', '﻿': '' };

/* Keep what Latin Modern can draw; fall back to the nearest ASCII, else drop. */
function clean(s) {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ASCII_FOR[ch] !== undefined) out += ASCII_FOR[ch];
    else if (ch === '\n' || ch === '\t' || (c >= 32 && c < 0x250) || (c >= 0x2010 && c <= 0x2027)
      || (c >= 0x2030 && c <= 0x203a) || c === 0x20ac || c === 0x2122 || (c >= 0x2190 && c <= 0x2193)
      || c === 0x2212 || c === 0x221a || c === 0x221e) out += ch;
    else out += ch.normalize('NFKD').replace(/[^\x20-\x7e¡-ɏ]/g, '');
  }
  return out;
}

async function loadFonts() {
  if (pdfMake.vfs && pdfMake.vfs['lmroman10-regular.otf']) return;
  const vfs = {};
  for (const name of Object.keys(FONTS)) {
    const buf = new Uint8Array(await (await fetch(chrome.runtime.getURL(`vendor/fonts/${name}`))).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    vfs[name] = btoa(bin);
  }
  pdfMake.vfs = vfs;
  pdfMake.fonts = {
    LM: { normal: 'lmroman10-regular.otf', bold: 'lmroman10-bold.otf', italics: 'lmroman10-italic.otf', bolditalics: 'lmroman10-bolditalic.otf' },
    LMMono: { normal: 'lmmono10-regular.otf', bold: 'lmmono10-regular.otf', italics: 'lmmono10-regular.otf', bolditalics: 'lmmono10-regular.otf' },
  };
}

function runsToText(runs, size) {
  const parts = runs.map((r) => {
    const t = { text: clean(r.s) };
    if (r.b) t.bold = true;
    if (r.i) t.italics = true;
    if (r.u) t.decoration = 'underline';
    if (r.code) { t.font = 'LMMono'; t.fontSize = (size || 11) * 0.9; }
    if (r.sup || r.sub) t.fontSize = (size || 11) * 0.7;
    if (r.href) { t.link = r.href; t.color = LINK; }
    return t;
  }).filter((t) => t.text);
  return parts.length ? parts : [{ text: ' ' }];
}

const rule = (w = 0.5, after = 0) => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: TEXT_W, y2: 0, lineWidth: w }], margin: [0, 4, 0, after] });

function listNode(l) {
  const items = l.items.map((it) => {
    const para = { text: runsToText(it.runs), alignment: 'justify' };
    return it.children.length ? { stack: [para, ...it.children.map(listNode)] } : para;
  });
  return { [l.ordered ? 'ol' : 'ul']: items, margin: [14, 0, 0, 6.5] };
}

function blockNodes(blocks, images) {
  const out = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'h': {
        const size = b.level === 1 ? 12.5 : 11;
        out.push({ text: runsToText(b.runs, size), fontSize: size, bold: true, italics: b.level === 3, margin: [0, 8, 0, 4] });
        break;
      }
      case 'p': out.push({ text: runsToText(b.runs), alignment: 'justify', margin: [0, 0, 0, 6.5] }); break;
      case 'img': {
        const img = images[b.id];
        if (img) {
          out.push({ image: `data:image/jpeg;base64,${img}`, fit: [TEXT_W, IMG_H], alignment: 'center', margin: [0, 8, 0, b.caption ? 3 : 8] });
          if (b.caption) out.push({ text: runsToText(b.caption, 9), fontSize: 9, italics: true, alignment: 'center', margin: [0, 0, 0, 8] });
        } else if (b.caption) {
          out.push({ text: runsToText(b.caption, 9), fontSize: 9, italics: true, margin: [0, 0, 0, 6.5] });
        }
        break;
      }
      case 'list': out.push(listNode(b)); break;
      case 'quote': out.push({ stack: blockNodes(b.blocks, images), margin: [22, 0, 22, 0] }); break;
      case 'pre': out.push({ text: b.lines.map(clean).join('\n') || ' ', font: 'LMMono', fontSize: 9.5, preserveLeadingSpaces: true, margin: [22, 0, 22, 6.5] }); break;
      case 'table': {
        const w = Math.max(...b.rows.map((r) => r.length));
        out.push({
          table: { headerRows: 1, keepWithHeaderRows: 1, dontBreakRows: true, widths: Array(w).fill('*'), body: b.rows.map((r) => Array.from({ length: w }, (_, i) => ({ text: runsToText(r[i] || [], 10) }))) },
          layout: { hLineWidth: (i, n) => (i === 0 || i === n.table.body.length ? 0.6 : 0), vLineWidth: () => 0 },
          fontSize: 10, margin: [0, 2, 0, 8],
        });
        break;
      }
      case 'hr': out.push(rule(0.5, 4)); break;
    }
  }
  return out;
}

function buildDoc({ meta, blocks, images }) {
  const byline = [meta.author, meta.date, meta.site].filter(Boolean).map(clean).join('  ·  ');
  return {
    info: { title: clean(meta.title || 'Untitled'), author: clean(meta.author || ''), subject: meta.url },
    pageSize: 'A4', pageMargins: [70.9, 70.9, 70.9, 70.9],
    defaultStyle: { font: 'LM', fontSize: 11, lineHeight: 0.87 },
    footer: (page) => ({ text: String(page), alignment: 'center', fontSize: 11, margin: [0, 24, 0, 0] }),
    content: [
      { text: clean(meta.title || 'Untitled'), fontSize: 18.5, bold: true, lineHeight: 1.0, margin: [0, 0, 0, 12] },
      ...(byline ? [{ text: byline, fontSize: 9, color: '#808080', margin: [0, 0, 0, 6] }] : []),
      rule(0.5, 12),
      ...blockNodes(blocks, images),
      rule(0.5, 4),
      { text: [{ text: 'Source: ' }, { text: meta.url, link: meta.url, color: LINK }], fontSize: 9 },
    ],
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.target !== 'offscreen' || msg.type !== 'render-pdf') return;
  (async () => {
    await loadFonts();
    const buf = await new Promise((resolve) => pdfMake.createPdf(buildDoc(msg)).getBuffer(resolve));
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    reply({ ok: true, pdf: btoa(bin) });
  })().catch((e) => reply({ ok: false, error: String(e && e.message || e) }));
  return true;
});
