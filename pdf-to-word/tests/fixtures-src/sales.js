// A report the way point-of-sale exports print it: a centred title, an unruled table with a shaded header that repeats
// on every page, numbers right-aligned, a date column narrow enough to wrap, and a bold total row.
const browserLib = require('../browser.js');
const path = require('path');
let seed = 11; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const names = ['Apple', 'Beans', 'Carrot', 'Dates', 'Eggplant', 'Fig', 'Garlic', 'Ginger', 'Herbs', 'Iceberg lettuce', 'Jackfruit', 'Kale', 'Lemon', 'Mango', 'Napa cabbage', 'Okra', 'Papaya', 'Quince', 'Radish', 'Spinach', 'Tomato', 'Ugli fruit', 'Vanilla pods', 'Watermelon', 'Yam', 'Zucchini'];
const money = (n) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let rows = '', totQ = 0, totA = 0;
for (let i = 0; i < 64; i++) {
  const q = Math.round(rnd() * 900000) / 100 + 10, avg = Math.round(rnd() * 20000) / 100 + 5, amt = q * avg;
  totQ += q; totA += amt;
  const d = `${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}/${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}/2025`;
  const t = `${String(1 + Math.floor(rnd() * 11)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')} ${rnd() < 0.5 ? 'AM' : 'PM'}`;
  rows += `<tr><td>${names[i % names.length]}${i >= names.length ? ' ' + (1 + Math.floor(i / names.length)) : ''}</td><td class="n">${q.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td class="n">${money(amt)}</td><td class="n">${money(avg)}</td><td class="d">${d} ${t}</td></tr>`;
}
rows += `<tr class="tot"><td>TOTAL</td><td class="n">${totQ.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td class="n">${money(totA)}</td><td></td><td></td></tr>`;
const html = `<meta charset=utf8><style>
@page{size:A4;margin:36pt 16pt 36pt 40pt} body{font:8pt "Liberation Sans";margin:0}
h1{font-size:14pt;font-weight:normal;text-align:center;margin:0 0 6pt} h2{font-size:11pt;font-weight:normal;text-align:center;margin:0 0 4pt} p{text-align:center;margin:0 0 18pt}
table{border-collapse:collapse;width:100%} thead{display:table-header-group} th{background:#ececec;font-weight:normal;padding:6pt 4pt;text-align:right} th:first-child,th:last-child{text-align:left}
td{padding:6pt 4pt;border-bottom:.5pt solid #ddd;vertical-align:top} td.n{text-align:right} td.d{width:58pt} tr.tot td{font-weight:bold}
</style><body><h1>Fresh Produce Traders Private Limited</h1><h2>Sales by Item</h2><p>From 01/06/2025 To 30/09/2025</p>
<table><thead><tr><th>Item Name</th><th>Quantity Sold</th><th>Amount</th><th>Average Price</th><th>Created Time</th></tr></thead><tbody>${rows}</tbody></table>`;
(async () => {
  const b = await browserLib.launch();
  const p = await b.newPage(); await p.setContent(html);
  await p.pdf({ path: path.join(__dirname, '..', 'fixtures', 'sales.pdf'), preferCSSPageSize: true, printBackground: true });
  await b.close();
})();
