#!/usr/bin/env node
/* Builds index.html (a complete page for your own computer) and dist/artifact.html (the same page without the
   document wrapper, ready to publish) from the files in src/. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, 'src', f), 'utf8');

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const JSZIP = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Display:wght@800;900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';

const sample = fs.readFileSync(path.join(root, 'src', 'sample.pdf')).toString('base64');
const js = ['extract.js', 'layout.js', 'text.js', 'analyze.js', 'docx.js', 'preview.js', 'main.js', 'app.js']
  .map((f) => `/* ---- ${f} ---- */\n` + read(f)).join('\n').replace('__SAMPLE_B64__', sample);
if (/<\/script/i.test(js)) throw new Error('a source file contains a closing script tag');
const css = read('style.css');
const body = read('index.template.html');

const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><rect x="2" y="7" width="30" height="20" rx="2" fill="#ff5a1f" stroke="#0f1720" stroke-width="2.4"/><rect x="8" y="7" width="4" height="20" fill="#0f1720"/><rect x="22" y="7" width="4" height="20" fill="#0f1720"/><rect x="14" y="13" width="6" height="8" fill="#fff" stroke="#0f1720" stroke-width="1.6"/></svg>';
const title = 'Black Box';
const desc = 'Turn a PDF into an editable Word document with the headings, lists and tables intact.';
const core = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>
${css}
</style>
${body}
<script src="${PDFJS}"></script>
<script src="${JSZIP}"></script>
<script>
${js}
</script>
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), core);

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${desc}">
<meta name="theme-color" content="#ff5a1f">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}: PDF to Word">
<meta property="og:description" content="${desc} Runs in your browser. Nothing is uploaded.">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}">
${core.split('\n<div class="app"')[0]}
</head>
<body>
<div class="app"${core.split('\n<div class="app"')[1]}
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), full);
console.log('index.html', Math.round(full.length / 1024) + ' KB;', 'dist/artifact.html', Math.round(core.length / 1024) + ' KB');
