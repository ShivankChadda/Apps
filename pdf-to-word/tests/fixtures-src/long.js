const browserLib = require('../browser.js');
const path = require('path');
let seed = 5; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const W = 'the committee reviewed several proposals for regional rail upgrades and concluded that incremental investment would deliver better outcomes than a single large programme although costs remain uncertain because supply chains are volatile'.split(' ');
const sent = () => { const n = 9 + Math.floor(rnd() * 9); const w = Array.from({ length: n }, () => W[Math.floor(rnd() * W.length)]); w[0] = w[0][0].toUpperCase() + w[0].slice(1); return w.join(' ') + '.'; };
const para = (s = 5) => Array.from({ length: s }, sent).join(' ');
let html = '<style>@page{size:Letter;margin:1in} body{font:11pt/1.35 "Liberation Serif";margin:0} p{text-align:justify;margin:0 0 8pt} h1{font:bold 17pt "Liberation Sans";margin:16pt 0 6pt} h2{font:bold 13pt "Liberation Sans";margin:12pt 0 4pt} table{border-collapse:collapse;width:100%;font:9pt "Liberation Sans"} td,th{border:.6pt solid #444;padding:3pt 5pt}</style>';
for (let c = 1; c <= 20; c++) {
  html += `<h1 style="break-before:page">${c}. Chapter ${c}</h1>`;
  for (let s = 1; s <= 3; s++) {
    html += `<h2>${c}.${s} Section</h2><p>${para(6)}</p><p>${para(5)}</p>`;
    html += '<ul>' + [1, 2, 3].map(() => `<li>${sent()}</li>`).join('') + '</ul>';
    if (s === 2) html += '<table><tr><th>Item</th><th>Value</th><th>Share</th></tr>' + [1, 2, 3, 4].map((i) => `<tr><td>Row ${i}</td><td>${Math.floor(rnd() * 9000)}</td><td>${Math.floor(rnd() * 100)}%</td></tr>`).join('') + '</table>';
  }
}
(async () => {
  const b = await browserLib.launch();
  const p = await b.newPage(); await p.setContent('<meta charset=utf8><body>' + html);
  await p.pdf({ path: path.join(__dirname, '..', 'fixtures', 'long.pdf'), preferCSSPageSize: true, printBackground: true });
  await b.close();
})();
