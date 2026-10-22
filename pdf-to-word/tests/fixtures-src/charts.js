const browserLib = require('../browser.js');
const path = require('path');
const bars = [42, 67, 55, 88, 73, 95];
const barSvg = `<svg width="440" height="220" viewBox="0 0 440 220" font-family="Liberation Sans" font-size="11">
 <line x1="50" y1="20" x2="50" y2="180" stroke="#333"/><line x1="50" y1="180" x2="420" y2="180" stroke="#333"/>
 ${[0, 25, 50, 75, 100].map((v) => `<line x1="50" y1="${180 - v * 1.6}" x2="420" y2="${180 - v * 1.6}" stroke="#ddd"/><text x="44" y="${184 - v * 1.6}" text-anchor="end">${v}</text>`).join('')}
 ${bars.map((v, i) => `<rect x="${68 + i * 58}" y="${180 - v * 1.6}" width="36" height="${v * 1.6}" fill="${['#2455a4', '#e0a100', '#2e8b57'][i % 3]}"/><text x="${86 + i * 58}" y="198" text-anchor="middle">Q${i + 1}</text>`).join('')}
 <text x="235" y="214" text-anchor="middle" font-weight="bold">Quarter</text></svg>`;
const pts = [30, 55, 40, 72, 60, 90, 80];
const lineSvg = `<svg width="440" height="200" viewBox="0 0 440 200" font-family="Liberation Sans" font-size="11">
 <line x1="40" y1="10" x2="40" y2="170" stroke="#333"/><line x1="40" y1="170" x2="420" y2="170" stroke="#333"/>
 <polyline fill="none" stroke="#c0392b" stroke-width="2.5" points="${pts.map((v, i) => `${60 + i * 55},${170 - v * 1.5}`).join(' ')}"/>
 ${pts.map((v, i) => `<circle cx="${60 + i * 55}" cy="${170 - v * 1.5}" r="4" fill="#c0392b"/><text x="${60 + i * 55}" y="188" text-anchor="middle">M${i + 1}</text>`).join('')}
 <text x="14" y="95" transform="rotate(-90 14 95)" text-anchor="middle">Score</text></svg>`;
const arc = (a0, a1, r = 70, cx = 90, cy = 90) => { const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`; };
const pieSvg = `<svg width="300" height="180" viewBox="0 0 300 180" font-family="Liberation Sans" font-size="11">
 <path d="${arc(0, 2.2)}" fill="#2455a4"/><path d="${arc(2.2, 3.9)}" fill="#e0a100"/><path d="${arc(3.9, 5.4)}" fill="#2e8b57"/><path d="${arc(5.4, 6.2832)}" fill="#c0392b"/>
 <text x="200" y="60">Rail 35%</text><text x="200" y="85">Bus 27%</text><text x="200" y="110">Tram 24%</text><text x="200" y="135">Other 14%</text></svg>`;
const html = `<style>@page{size:Letter;margin:1in} body{font:11pt/1.35 "Liberation Serif";margin:0} p{text-align:justify;margin:0 0 8pt} h1{font:bold 17pt "Liberation Sans";margin:0 0 8pt}
 .cap{font:italic 9pt "Liberation Sans";text-align:center;color:#444;margin:2pt 0 12pt} .fig{text-align:center}
 table{border-collapse:collapse;width:100%;font:10pt "Liberation Sans"} td,th{padding:4pt 6pt;text-align:left} tr:nth-child(odd) td{background:#eef1f4} th{background:#223;color:#fff}
 .box{background:#fff4e8;border:1pt solid #ff5a1f;padding:8pt;margin:10pt 0}</style>
<h1>Performance charts</h1>
<p>The first chart shows delivered milestones per quarter and the second tracks the monthly satisfaction score across the year. Both are drawn as vector graphics and carry their own labels.</p>
<div class="fig">${barSvg}</div><div class="cap">Figure 1. Milestones delivered per quarter</div>
<p>Satisfaction rose steadily after the second month, with a dip in the middle of the year that coincided with the timetable change.</p>
<div class="fig">${lineSvg}</div><div class="cap">Figure 2. Monthly satisfaction score</div>
<div class="fig">${pieSvg}</div><div class="cap">Figure 3. Share of trips by mode</div>
<div class="box">A shaded call-out box with a border, which must stay text and must not be taken for a chart.</div>
<table><tr><th>Mode</th><th>Trips</th><th>Share</th></tr><tr><td>Rail</td><td>12,400</td><td>35%</td></tr><tr><td>Bus</td><td>9,600</td><td>27%</td></tr><tr><td>Tram</td><td>8,500</td><td>24%</td></tr><tr><td>Other</td><td>4,900</td><td>14%</td></tr><tr><td>Total</td><td>35,400</td><td>100%</td></tr></table>`;
(async () => {
  const b = await browserLib.launch();
  const p = await b.newPage(); await p.setContent('<meta charset=utf8><body>' + html);
  await p.pdf({ path: path.join(__dirname, '..', 'fixtures', 'charts.pdf'), preferCSSPageSize: true, printBackground: true });
  await b.close();
})();
