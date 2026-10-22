/* docx.js: write the document model as a Word (.docx) package with JSZip. */
const Docx = (() => {
  'use strict';

  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    + 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    + 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  const esc = (s) => String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tw = (pt) => Math.round(pt * 20);
  const hexc = (c) => c.replace('#', '').toUpperCase();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function build(doc, options = {}) {
    const ctx = {
      rels: [],            // {id, type, target, external}
      media: [],           // {name, data}
      nextRel: 10,
      nextDocPr: 1,
      links: new Map(),
      numbering: [],       // abstract definitions
      lists: new Map(),    // list object -> numId
    };
    const addRel = (type, target, external) => { const id = 'rId' + (ctx.nextRel++); ctx.rels.push({ id, type, target, external }); return id; };

    /* defaults and heading styles come from what the PDF actually uses */
    const defaults = pickDefaults(doc);
    const headStyles = headingStyles(doc);
    doc.defaults = defaults; doc.headingBase = headStyles;

    const body = [];
    let prevType = null;
    let lastPage = doc.blocks.length ? doc.blocks[0].page : 1;
    const fixed = !!options.fixedPages;
    const parts = {};
    const refsXml = headerFooterParts(doc, ctx, addRel, parts, defaults, headStyles);
    const sections = doc.sections && doc.sections.length ? doc.sections : [{ pages: [0], w: doc.page.w, h: doc.page.h, margins: doc.page.margins }];
    const secOf = (pg) => Math.max(0, sections.findIndex((s) => s.pages.includes(pg - 1)));
    let curSec = doc.blocks.length ? secOf(doc.blocks[0].page) : 0;
    doc.blocks.forEach((b, idx) => {
      const sIdx = secOf(b.page);
      let newSection = false;
      if (idx > 0 && sIdx !== curSec) {
        body.push(sectionBreak(doc, sections[curSec], curSec === 0 ? refsXml : '', curSec === 0 && doc.diffFirst));
        curSec = sIdx; newSection = true;
        if (prevType === 'table') { /* the break paragraph already separates the tables */ }
      }
      const pageBreak = !newSection && ((fixed && b.page !== lastPage && idx > 0) || !!b.pageBreak);
      lastPage = b.page;
      if (b.type === 'table') {
        if (prevType === 'table') body.push(spacer(1));
        if (b.before >= 3 || pageBreak) body.push(spacer(Math.max(b.before, 1), pageBreak));
        body.push(tableXml(b, defaults, ctx, addRel, headStyles));
      } else if (b.type === 'img') {
        body.push(imageParagraph(b, ctx, addRel, pageBreak));
      } else {
        body.push(paragraphXml(b, defaults, ctx, addRel, headStyles, { pageBreak }));
      }
      prevType = b.type;
    });
    if (prevType === 'table' || !body.length) body.push(spacer(1));

    const fontTableXml = fontTablePart(doc);
    const sect = sectPrXml(sections[curSec], curSec === 0 ? refsXml : '', curSec === 0 && doc.diffFirst, doc);

    const documentXml = XML + `<w:document ${NS}><w:body>${body.join('')}${sect}</w:body></w:document>`;

    /* numbering */
    const numberingXml = numberingPart(ctx);

    const rels = [
      { id: 'rId1', type: 'styles', target: 'styles.xml' },
      { id: 'rId2', type: 'settings', target: 'settings.xml' },
      { id: 'rId3', type: 'numbering', target: 'numbering.xml' },
      { id: 'rId4', type: 'fontTable', target: 'fontTable.xml' },
      ...ctx.rels,
    ];
    const relType = (t) => (/^https?:|^http/.test(t) ? t : 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + t);
    const relsXml = XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + rels.map((r) => `<Relationship Id="${r.id}" Type="${relType(r.type)}" Target="${esc(r.target)}"${r.external ? ' TargetMode="External"' : ''}/>`).join('') + '</Relationships>';

    const exts = new Set(ctx.media.map((m) => m.ext));
    let ct = XML + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + (exts.has('png') ? '<Default Extension="png" ContentType="image/png"/>' : '')
      + (exts.has('jpeg') ? '<Default Extension="jpeg" ContentType="image/jpeg"/>' : '')
      + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
      + '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
      + '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
      + '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>';
    for (const name of Object.keys(parts)) {
      ct += `<Override PartName="/word/${name}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${name.startsWith('header') ? 'header' : 'footer'}+xml"/>`;
    }
    ct += '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';

    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const title = esc(doc.title || '');
    const core = XML + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" '
      + 'xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      + `<dc:title>${title}</dc:title><dc:creator>Black Box</dc:creator><cp:lastModifiedBy>Black Box</cp:lastModifiedBy>`
      + `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
    const app = XML + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Black Box</Application></Properties>';
    const rootRels = XML + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
      + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>';

    const zip = new JSZip();
    zip.file('[Content_Types].xml', ct);
    zip.file('_rels/.rels', rootRels);
    zip.file('docProps/core.xml', core);
    zip.file('docProps/app.xml', app);
    zip.file('word/document.xml', documentXml);
    zip.file('word/_rels/document.xml.rels', relsXml);
    zip.file('word/styles.xml', stylesPart(defaults, headStyles));
    zip.file('word/settings.xml', XML + `<w:settings ${NS}><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`);
    zip.file('word/numbering.xml', numberingXml);
    zip.file('word/fontTable.xml', fontTableXml);
    for (const [name, xml] of Object.entries(parts)) zip.file('word/' + name, xml);
    for (const m of ctx.media) zip.file('word/media/' + m.name, m.data);
    return zip;
  }

  async function toBlob(doc, options) {
    const zip = build(doc, options);
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  async function toBytes(doc, options) {
    return build(doc, options).generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  }

  /* The font table tells Word what kind of font each name is, so a missing one is replaced by a similar one. */
  function fontTablePart(doc) {
    const kinds = new Map();
    const scan = (runs) => { for (const r of runs || []) if (r.face && !kinds.has(r.face)) kinds.set(r.face, r.mono ? 'modern' : r.serif ? 'roman' : 'swiss'); };
    for (const b of doc.blocks) {
      if (b.type === 'p') scan(b.runs);
      else if (b.type === 'table') for (const c of b.cells) for (const q of c.blocks) if (q.type === 'p') scan(q.runs);
    }
    for (const h of [...doc.header, ...doc.footer]) scan(h.p.runs);
    let x = XML + `<w:fonts ${NS}>`;
    for (const [name, fam] of kinds) x += `<w:font w:name="${esc(name)}"><w:charset w:val="00"/><w:family w:val="${fam}"/><w:pitch w:val="${fam === 'modern' ? 'fixed' : 'variable'}"/></w:font>`;
    return x + '</w:fonts>';
  }

  /* ---------- defaults and styles ---------- */

  function allRuns(doc) {
    const runs = [];
    const take = (p) => { if (p.type === 'p') runs.push({ p, runs: p.runs }); };
    for (const b of doc.blocks) {
      if (b.type === 'table') for (const c of b.cells) c.blocks.forEach(take);
      else take(b);
    }
    return runs;
  }

  function pickDefaults(doc) {
    const faces = new Map();
    let colorW = new Map();
    for (const { p, runs } of allRuns(doc)) {
      if (p.heading) continue;
      for (const r of runs) {
        if (r.tab || !r.text.trim()) continue;
        const k = r.face + '|' + r.size;
        faces.set(k, (faces.get(k) || 0) + r.text.length);
      }
    }
    let best = 'Arial|11', bw = -1;
    for (const [k, w] of faces) if (w > bw) { best = k; bw = w; }
    const [face, size] = best.split('|');
    return { face, size: +size || doc.bodyFs || 11, bold: false, italic: false, color: null };
  }

  function headingStyles(doc) {
    const by = new Map();
    for (const { p, runs } of allRuns(doc)) {
      if (!p.heading) continue;
      const key = p.heading === 'title' ? 'Title' : 'Heading' + p.heading;
      if (!by.has(key)) by.set(key, new Map());
      for (const r of runs) {
        if (r.tab || !r.text.trim()) continue;
        const k = [r.face, r.size, r.bold ? 1 : 0, r.italic ? 1 : 0, r.color || ''].join('|');
        by.get(key).set(k, (by.get(key).get(k) || 0) + r.text.length);
      }
    }
    const out = {};
    for (const [key, m] of by) {
      let best = null, bw = -1;
      for (const [k, w] of m) if (w > bw) { best = k; bw = w; }
      const [face, size, bold, italic, color] = best.split('|');
      out[key] = { face, size: +size, bold: bold === '1', italic: italic === '1', color: color || null };
    }
    return out;
  }

  function stylesPart(d, heads) {
    const rpr = (f) => `<w:rPr><w:rFonts w:ascii="${esc(f.face)}" w:hAnsi="${esc(f.face)}" w:eastAsia="${esc(f.face)}" w:cs="${esc(f.face)}"/>${f.bold ? '<w:b/><w:bCs/>' : ''}${f.italic ? '<w:i/><w:iCs/>' : ''}${f.color ? `<w:color w:val="${hexc(f.color)}"/>` : ''}<w:sz w:val="${Math.round(f.size * 2)}"/><w:szCs w:val="${Math.round(f.size * 2)}"/></w:rPr>`;
    let x = XML + `<w:styles ${NS}>`;
    x += `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${esc(d.face)}" w:hAnsi="${esc(d.face)}" w:eastAsia="${esc(d.face)}" w:cs="${esc(d.face)}"/><w:sz w:val="${Math.round(d.size * 2)}"/><w:szCs w:val="${Math.round(d.size * 2)}"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>`
      + '<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>';
    x += '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>';
    x += '<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>';
    x += '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>';
    x += '<w:style w:type="numbering" w:default="1" w:styleId="NoList"><w:name w:val="No List"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/></w:style>';
    const mk = (id, name, lvl, f) => {
      const ff = f || { ...d, bold: true, size: d.size + 2 };
      return `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/>`
        + `<w:pPr><w:keepNext/><w:keepLines/>${lvl === null ? '' : `<w:outlineLvl w:val="${lvl}"/>`}</w:pPr>${rpr(ff)}</w:style>`;
    };
    x += mk('Title', 'Title', null, heads.Title);
    for (let i = 1; i <= 6; i++) x += mk('Heading' + i, 'heading ' + i, i - 1, heads['Heading' + i]);
    x += '<w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/></w:style>';
    x += '<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/></w:style>';
    x += '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="39"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style>';
    return x + '</w:styles>';
  }

  /* ---------- runs and paragraphs ---------- */

  function rPr(run, base) {
    let x = '';
    if (run.face && run.face !== base.face) x += `<w:rFonts w:ascii="${esc(run.face)}" w:hAnsi="${esc(run.face)}" w:eastAsia="${esc(run.face)}" w:cs="${esc(run.face)}"/>`;
    if (!!run.bold !== !!base.bold) x += run.bold ? '<w:b/><w:bCs/>' : '<w:b w:val="0"/><w:bCs w:val="0"/>';
    if (!!run.italic !== !!base.italic) x += run.italic ? '<w:i/><w:iCs/>' : '<w:i w:val="0"/><w:iCs w:val="0"/>';
    if (run.strike) x += '<w:strike/>';
    if ((run.color || null) !== (base.color || null)) x += `<w:color w:val="${run.color ? hexc(run.color) : 'auto'}"/>`;
    if (run.spacing) x += `<w:spacing w:val="${Math.round(run.spacing * 20)}"/>`;
    if (run.size && Math.abs(run.size - base.size) >= 0.25) x += `<w:sz w:val="${Math.round(run.size * 2)}"/><w:szCs w:val="${Math.round(run.size * 2)}"/>`;
    if (run.underline) x += '<w:u w:val="single"/>';
    if (run.sup) x += '<w:vertAlign w:val="superscript"/>'; else if (run.sub) x += '<w:vertAlign w:val="subscript"/>';
    return x ? `<w:rPr>${x}</w:rPr>` : '';
  }

  function runXml(run, base) {
    const pr = rPr(run, base);
    if (run.tab) return `<w:r>${pr}<w:tab/></w:r>`;
    if (run.field) return `<w:fldSimple w:instr=" ${run.field} "><w:r>${pr}<w:t>${esc(run.text)}</w:t></w:r></w:fldSimple>`;
    if (!run.text) return '';
    return `<w:r>${pr}<w:t xml:space="preserve">${esc(run.text)}</w:t></w:r>`;
  }

  function runsXml(runs, base, addRel, ctx) {
    let out = '';
    let i = 0;
    while (i < runs.length) {
      const r = runs[i];
      if (r.url) {
        let j = i;
        let inner = '';
        while (j < runs.length && runs[j].url === r.url) { inner += runXml(runs[j], base); j++; }
        let id = ctx.links.get(r.url);
        if (!id) { id = addRel('hyperlink', r.url, true); ctx.links.set(r.url, id); }
        out += `<w:hyperlink r:id="${id}" w:history="1">${inner}</w:hyperlink>`;
        i = j;
      } else { out += runXml(r, base); i++; }
    }
    return out;
  }

  function border(tag, b, space) {
    const sz = clamp(Math.round(b.w * 8), 2, 96);
    return `<w:${tag} w:val="single" w:sz="${sz}" w:space="${Math.round(space || 0)}" w:color="${b.color ? hexc(b.color) : 'auto'}"/>`;
  }

  function paragraphXml(p, defaults, ctx, addRel, heads, o = {}) {
    const styleId = p.heading === 'title' ? 'Title' : p.heading ? 'Heading' + p.heading : null;
    const base = styleId && heads[styleId] ? heads[styleId] : defaults;
    let ppr = '';
    if (styleId) ppr += `<w:pStyle w:val="${styleId}"/>`;
    if (p.heading && p.heading !== 'title') ppr += '';
    if (o.pageBreak || p.pageBreak) ppr += '<w:pageBreakBefore/>';
    if (p.list) ppr += `<w:numPr><w:ilvl w:val="${p.level || 0}"/><w:numId w:val="${listNumId(p.list, ctx, defaults)}"/></w:numPr>`;
    if (p.borderTop || p.borderBottom || p.borderLeft) {
      ppr += '<w:pBdr>' + (p.borderTop ? border('top', p.borderTop, p.borderTop.space) : '') + (p.borderLeft ? border('left', p.borderLeft, p.borderLeft.space) : '') + (p.borderBottom ? border('bottom', p.borderBottom, p.borderBottom.space) : '') + '</w:pBdr>';
    }
    if (p.shade) ppr += `<w:shd w:val="clear" w:color="auto" w:fill="${hexc(p.shade)}"/>`;
    if (p.tabs && p.tabs.length) {
      ppr += '<w:tabs>' + p.tabs.map((t) => `<w:tab w:val="${t.type}"${t.leader ? ` w:leader="${t.leader}"` : ''} w:pos="${tw(t.pos)}"/>`).join('') + '</w:tabs>';
    }
    const line = p.lineHeight || 0;
    ppr += `<w:spacing w:before="${tw(p.before || 0)}" w:after="0"${line ? ` w:line="${tw(line)}" w:lineRule="atLeast"` : ''}/>`;
    const ind = p.ind || {};
    if (ind.left || ind.right || ind.first) {
      let a = '';
      if (ind.left) a += ` w:left="${tw(ind.left)}"`;
      if (ind.right) a += ` w:right="${tw(ind.right)}"`;
      if (ind.first > 0.5) a += ` w:firstLine="${tw(ind.first)}"`; else if (ind.first < -0.5) a += ` w:hanging="${tw(-ind.first)}"`;
      ppr += `<w:ind${a}/>`;
    }
    const jc = { left: null, center: 'center', right: 'right', both: 'both' }[p.align || 'left'];
    if (jc) ppr += `<w:jc w:val="${jc}"/>`;
    return `<w:p><w:pPr>${ppr}</w:pPr>${runsXml(p.runs || [], base, addRel, ctx)}</w:p>`;
  }

  function spacer(pt, pageBreak) {
    return `<w:p><w:pPr>${pageBreak ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="0" w:after="0" w:line="${tw(Math.max(pt, 1))}" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr></w:pPr></w:p>`;
  }

  /* ---------- lists ---------- */

  function listNumId(list, ctx, defaults) {
    if (ctx.lists.has(list)) return ctx.lists.get(list);
    const id = ctx.numbering.length + 1;
    ctx.numbering.push(list);
    ctx.lists.set(list, id);
    return id;
  }

  function numberingPart(ctx) {
    let x = XML + `<w:numbering ${NS}>`;
    ctx.numbering.forEach((L, i) => {
      const id = i + 1;
      x += `<w:abstractNum w:abstractNumId="${id}"><w:multiLevelType w:val="hybridMultilevel"/>`;
      const levels = L.levelsInfo;
      let lastIndent = 0;
      for (let lvl = 0; lvl < 9; lvl++) {
        const m = levels[lvl];
        const sample = L.items.find((p) => (p.level || 0) === lvl);
        let numFmt = 'bullet', text, start = 1, left = 360 * (lvl + 1) * 2, hang = 360;
        if (m) {
          if (m.kind === 'num') {
            numFmt = m.fmt;
            text = `${m.open || ''}%${lvl + 1}${m.close || '.'}`;
            start = m.value || 1;
          } else {
            numFmt = 'bullet';
            text = ({ '·': '•', '∙': '•', '●': '•', '-': '–', '−': '–', '—': '–' })[m.text] || m.text;
          }
        } else {
          const first = levels[0];
          if (first && first.kind === 'num') { numFmt = lvl % 3 === 0 ? 'decimal' : lvl % 3 === 1 ? 'lowerLetter' : 'lowerRoman'; text = `%${lvl + 1}.`; } else text = lvl % 2 ? '–' : '•';
        }
        if (sample && sample.textX != null) {
          left = tw(sample.textX - sample.ref.left); hang = tw(sample.textX - sample.markerX);
          if (hang < 120) hang = 240;
          if (left < hang) left = hang;
        }
        const st = m && m.style;
        const font = numFmt === 'bullet' ? (st ? st.face : 'Arial') : (st ? st.face : null);
        let rpr = '';
        if (font) rpr += `<w:rFonts w:ascii="${esc(font)}" w:hAnsi="${esc(font)}" w:cs="${esc(font)}" w:hint="default"/>`;
        if (st && st.bold) rpr += '<w:b/>';
        if (st && st.italic) rpr += '<w:i/>';
        if (st && st.color) rpr += `<w:color w:val="${hexc(st.color)}"/>`;
        if (st && st.size) rpr += `<w:sz w:val="${Math.round(st.size * 2)}"/>`;
        x += `<w:lvl w:ilvl="${lvl}"><w:start w:val="${start}"/><w:numFmt w:val="${numFmt}"/><w:lvlText w:val="${esc(text)}"/><w:lvlJc w:val="left"/>`
          + `<w:pPr><w:ind w:left="${left}" w:hanging="${hang}"/></w:pPr>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}</w:lvl>`;
      }
      x += '</w:abstractNum>';
    });
    ctx.numbering.forEach((L, i) => { x += `<w:num w:numId="${i + 1}"><w:abstractNumId w:val="${i + 1}"/></w:num>`; });
    return x + '</w:numbering>';
  }

  /* ---------- pictures ---------- */

  function drawingXml(img, wPt, hPt, ctx, addRel) {
    const name = 'image' + (ctx.media.length + 1) + '.' + img.crop.ext;
    ctx.media.push({ name, data: img.crop.data, ext: img.crop.ext });
    const rid = addRel('image', 'media/' + name, false);
    const cx = Math.round(wPt * 12700), cy = Math.round(hPt * 12700);
    const id = ctx.nextDocPr++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Picture ${id}" descr="Picture recovered from the PDF"/>`
      + '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>'
      + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
      + `<pic:nvPicPr><pic:cNvPr id="${id}" name="${esc(name)}"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>`
      + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }

  function imageParagraph(b, ctx, addRel, pageBreak) {
    const im = b.img;
    let w = im.x1 - im.x0, h = im.y1 - im.y0;
    const avail = Math.max(40, (b.ref.right - b.ref.left));
    let maxW = avail + (im.x0 < b.ref.left ? b.ref.left - im.x0 : 0);
    if (w > maxW) { h = h * maxW / w; w = maxW; }
    const cx = (im.x0 + im.x1) / 2, mid = (b.ref.left + b.ref.right) / 2;
    let jc = null, left = 0;
    if (Math.abs(cx - mid) < 6) jc = 'center';
    else if (im.x1 >= b.ref.right - 4 && im.x0 > b.ref.left + 0.25 * avail) jc = 'right';
    else left = Math.max(0, im.x0 - b.ref.left);
    const ppr = `${pageBreak ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="${tw(b.before || 0)}" w:after="0"/>${left > 1 ? `<w:ind w:left="${tw(left)}"/>` : ''}${jc ? `<w:jc w:val="${jc}"/>` : ''}`;
    return `<w:p><w:pPr>${ppr}</w:pPr>${drawingXml(im, w, h, ctx, addRel)}</w:p>`;
  }

  /* ---------- tables ---------- */

  function tableXml(t, defaults, ctx, addRel, heads) {
    const widths = [];
    for (let c = 0; c < t.C; c++) widths.push(Math.max(1, t.xs[c + 1] - t.xs[c]));
    const total = widths.reduce((a, b) => a + b, 0);
    const indent = Math.max(-72, t.x0 - t.ref.left);
    let x = '<w:tbl><w:tblPr>'
      + `<w:tblW w:w="${tw(total)}" w:type="dxa"/><w:tblInd w:w="${tw(indent)}" w:type="dxa"/><w:tblLayout w:type="fixed"/>`
      + `<w:tblCellMar><w:top w:w="${tw(t.padT)}" w:type="dxa"/><w:left w:w="${tw(t.padL)}" w:type="dxa"/><w:bottom w:w="${tw(t.padB)}" w:type="dxa"/><w:right w:w="${tw(Math.max(1, t.padL - 3))}" w:type="dxa"/></w:tblCellMar>`
      + '<w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr>';
    x += '<w:tblGrid>' + widths.map((w) => `<w:gridCol w:w="${tw(w)}"/>`).join('') + '</w:tblGrid>';
    // grid occupancy
    const owner = Array.from({ length: t.R }, () => new Array(t.C).fill(null));
    for (const cell of t.cells) for (let r = cell.r0; r < cell.r1; r++) for (let c = cell.c0; c < cell.c1; c++) owner[r][c] = cell;
    for (let r = 0; r < t.R; r++) {
      const rowH = t.ys[r + 1] - t.ys[r];
      x += `<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="${tw(Math.max(rowH, 4))}" w:hRule="atLeast"/>${r < (t.headerRows || 0) ? '<w:tblHeader/>' : ''}</w:trPr>`;
      let c = 0;
      while (c < t.C) {
        const cell = owner[r][c];
        if (!cell) { x += `<w:tc><w:tcPr><w:tcW w:w="${tw(widths[c])}" w:type="dxa"/></w:tcPr><w:p/></w:tc>`; c++; continue; }
        const span = cell.c1 - cell.c0;
        const w = widths.slice(cell.c0, cell.c1).reduce((a, b) => a + b, 0);
        let pr = `<w:tcW w:w="${tw(w)}" w:type="dxa"/>`;
        if (span > 1) pr += `<w:gridSpan w:val="${span}"/>`;
        const rs = cell.r1 - cell.r0;
        if (rs > 1) pr += cell.r0 === r ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>';
        const origin = cell.r0 === r;
        if (origin && cell.borders) {
          const b = cell.borders;
          const bx = (b.t ? border('top', b.t) : '') + (b.l ? border('left', b.l) : '') + (b.b ? border('bottom', b.b) : '') + (b.r ? border('right', b.r) : '');
          if (bx) pr += `<w:tcBorders>${bx}</w:tcBorders>`;
        }
        if (cell.fill) pr += `<w:shd w:val="clear" w:color="auto" w:fill="${hexc(cell.fill)}"/>`;
        if (cell.valign && cell.valign !== 'top') pr += `<w:vAlign w:val="${cell.valign === 'center' ? 'center' : 'bottom'}"/>`;
        let inner = '';
        if (origin) {
          for (const b of cell.blocks) {
            if (b.type === 'p') inner += paragraphXml(b, defaults, ctx, addRel, heads);
            else if (b.type === 'img') {
              const im = b.img;
              let w2 = im.x1 - im.x0, h2 = im.y1 - im.y0;
              const maxW = Math.max(20, w - 2 * t.padL);
              if (w2 > maxW) { h2 = h2 * maxW / w2; w2 = maxW; }
              inner += `<w:p><w:pPr><w:spacing w:before="${tw(b.before || 0)}" w:after="0"/></w:pPr>${drawingXml(im, w2, h2, ctx, addRel)}</w:p>`;
            }
          }
        }
        if (!inner) inner = '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:rPr><w:sz w:val="4"/><w:szCs w:val="4"/></w:rPr></w:pPr></w:p>';
        x += `<w:tc><w:tcPr>${pr}</w:tcPr>${inner}</w:tc>`;
        c = cell.c1;
      }
      x += '</w:tr>';
    }
    return x + '</w:tbl>';
  }

  /* ---------- sections: page size, margins, header and footer ---------- */

  function headerFooterParts(doc, ctx, addRel, parts, defaults, heads) {
    let refs = '';
    const mkPart = (name, kind, items, empty) => {
      let body = '';
      if (!empty) {
        items.forEach((it, i) => {
          const p = it.p;
          p.before = i ? Math.max(0, Math.round(it.y - items[i - 1].y - (p.fs * 1.2))) : 0;
          p.lineHeight = 0;
          p.ind = p.ind || { left: Math.max(0, p.restX - p.ref.left), first: 0, right: 0 };
          if (p.align === 'center' || p.align === 'right') p.ind = { left: 0, first: 0, right: 0 };
          body += paragraphXml(p, defaults, ctx, addRel, heads);
        });
      }
      if (!body) body = '<w:p/>';
      const tag = kind === 'header' ? 'hdr' : 'ftr';
      parts[name] = XML + `<w:${tag} ${NS}>${body}</w:${tag}>`;
      return addRel(kind, name, false);
    };
    if (doc.header.length) {
      refs += `<w:headerReference w:type="default" r:id="${mkPart('header1.xml', 'header', doc.header, false)}"/>`;
      if (doc.diffFirst) refs += `<w:headerReference w:type="first" r:id="${mkPart('header2.xml', 'header', [], true)}"/>`;
    }
    if (doc.footer.length) {
      refs += `<w:footerReference w:type="default" r:id="${mkPart('footer1.xml', 'footer', doc.footer, false)}"/>`;
      if (doc.diffFirst) refs += `<w:footerReference w:type="first" r:id="${mkPart('footer2.xml', 'footer', [], true)}"/>`;
    }
    return refs;
  }

  function sectPrXml(sec, refs, titlePg, doc) {
    const m = sec.margins;
    return `<w:sectPr>${refs}<w:pgSz w:w="${tw(sec.w)}" w:h="${tw(sec.h)}"${sec.w > sec.h ? ' w:orient="landscape"' : ''}/>`
      + `<w:pgMar w:top="${tw(m.t)}" w:right="${tw(m.r)}" w:bottom="${tw(m.b)}" w:left="${tw(m.l)}" w:header="${tw(doc.page.hdrDist)}" w:footer="${tw(doc.page.ftrDist)}" w:gutter="0"/>`
      + `${titlePg && refs ? '<w:titlePg/>' : ''}</w:sectPr>`;
  }

  function sectionBreak(doc, sec, refs, titlePg) {
    return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/>${sectPrXml(sec, refs, titlePg, doc)}</w:pPr></w:p>`;
  }

  return { build, toBlob, toBytes, esc };
})();
