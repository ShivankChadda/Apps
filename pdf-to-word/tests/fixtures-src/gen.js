// Builds the HTML fixtures (deterministic text) and prints each one to PDF with Chromium.
const fs = require('fs');
const path = require('path');
const browserLib = require('../browser.js');

let seed = 7;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const W = ('the committee reviewed several proposals for regional rail upgrades and concluded that incremental '
  + 'investment would deliver better outcomes than a single large programme although costs remain uncertain '
  + 'because supply chains are volatile and labour markets tight across the northern corridor while '
  + 'passenger demand continues to recover slowly from earlier lows and freight volumes shift towards '
  + 'electrified routes which require different maintenance regimes new signalling and careful scheduling').split(' ');
function sentence(min = 9, max = 18) {
  const n = min + Math.floor(rnd() * (max - min));
  const w = Array.from({ length: n }, () => W[Math.floor(rnd() * W.length)]);
  w[0] = w[0][0].toUpperCase() + w[0].slice(1);
  return w.join(' ') + '.';
}
const para = (s = 4) => Array.from({ length: s }, () => sentence()).join(' ');

const css = `
@page { size: Letter; margin: 0.9in 1in; }
body { font-family: "Liberation Serif", serif; font-size: 11pt; line-height: 1.3; color: #111; margin: 0; }
p { margin: 0 0 9pt; text-align: justify; }
h1 { font-size: 17pt; margin: 18pt 0 6pt; }
h2 { font-size: 13.5pt; margin: 14pt 0 5pt; }
h3 { font-size: 11.5pt; margin: 10pt 0 4pt; font-style: italic; }
a { color: #1155cc; }
`;

const fixtures = {};

// 1. report ---------------------------------------------------------------
fixtures.report = {
  header: true,
  html: `<style>${css}
  .title { font-size: 26pt; font-weight: bold; text-align: center; margin: 24pt 0 6pt; }
  .sub { text-align: center; font-style: italic; font-size: 13pt; margin-bottom: 4pt; color: #444 }
  .by { text-align: center; margin-bottom: 22pt; }
  blockquote { margin: 6pt 36pt 12pt; padding-left: 10pt; border-left: 3pt solid #999; font-style: italic; text-align: left }
  pre { font-family: "Liberation Mono", monospace; font-size: 9.5pt; background: #f1f1f1; padding: 6pt 8pt; margin: 6pt 0 12pt; line-height: 1.25 }
  ul, ol { margin: 0 0 9pt; padding-left: 26pt; } li { margin-bottom: 2pt; }
  .red { color: #c0392b; } .blue { color: #2455a4; font-weight: bold }
  </style>
  <div class="title">Regional Rail Review</div>
  <div class="sub">Findings from the northern corridor study</div>
  <div class="by">Prepared by A. Hartley and M. Okonkwo &middot; 14 March 2026</div>
  <h1>1. Introduction</h1>
  <p>${para(5)} The report is available at <a href="https://example.org/rail-review">example.org/rail-review</a>.<sup>1</sup></p>
  <p>${para(4)} Some words are <b>bold</b>, some are <i>italic</i>, a few are <span class="red">red</span> and one phrase is <span class="blue">bold blue</span>. Water is H<sub>2</sub>O.</p>
  <h2>1.1 Scope</h2>
  <p>${para(6)}</p>
  <ul><li>Electrification of the two busiest branch lines</li><li>Signalling replacement
     <ul><li>Fixed block sections</li><li>Moving block trials</li></ul></li><li>Station accessibility upgrades</li></ul>
  <h2>1.2 Method</h2>
  <p>${para(5)}</p>
  <ol><li>Collect passenger counts for each station.</li><li>Model peak and off-peak demand separately.</li><li>Compare options against the do-nothing baseline.</li></ol>
  <blockquote>${para(2)}</blockquote>
  <h1>2. Results</h1>
  <p>${para(7)}</p>
  <h3>Sample calculation</h3>
  <pre>total = sum(costs) / years\nif total &gt; budget:\n    flag("over budget")</pre>
  <p><img id="im" width="300" height="150" style="display:block;margin:6pt auto"></p>
  <p style="text-align:center;font-size:9.5pt;color:#555">Figure 1. Weekly boardings by station group</p>
  <p>${para(8)}</p>
  <p>${para(8)}</p>
  <h1>3. Conclusions</h1>
  <p>${para(6)}</p>
  <p>${para(6)}</p>
  <script>
   const c=document.createElement('canvas');c.width=600;c.height=300;const x=c.getContext('2d');
   x.fillStyle='#f4f6fa';x.fillRect(0,0,600,300);
   const cols=['#2455a4','#c0392b','#2e8b57','#e0a100'];
   for(let i=0;i<8;i++){x.fillStyle=cols[i%4];const h=40+((i*53)%170);x.fillRect(30+i*66,270-h,48,h);}
   x.strokeStyle='#333';x.lineWidth=2;x.strokeRect(20,10,560,262);
   document.getElementById('im').src=c.toDataURL();
  </script>`,
};

// 2. two column paper -----------------------------------------------------
fixtures.paper = {
  html: `<style>${css}
  @page { margin: 0.8in 0.75in; }
  body { font-size: 10pt; line-height: 1.25 }
  .t { font-size: 20pt; font-weight: bold; text-align: center; margin: 4pt 0 6pt }
  .au { text-align: center; font-size: 11pt; margin-bottom: 10pt }
  .abs { margin: 0 30pt 12pt; font-size: 9.5pt }
  .cols { column-count: 2; column-gap: 22pt; }
  .cols p { margin-bottom: 6pt } h1 { font-size: 12pt; margin: 10pt 0 4pt } h2 { font-size: 10.5pt; margin: 8pt 0 3pt }
  table { border-collapse: collapse; width: 100%; font-size: 9pt; margin: 4pt 0 8pt }
  td, th { padding: 2pt 4pt; text-align: right } th:first-child, td:first-child { text-align: left }
  thead th { border-top: 1pt solid #000; border-bottom: 0.6pt solid #000 } tbody tr:last-child td { border-bottom: 1pt solid #000 }
  .cap { font-size: 8.5pt; text-align: left; margin-bottom: 8pt } .ref { font-size: 8.5pt; text-align: left; margin-bottom: 3pt; padding-left: 14pt; text-indent: -14pt }
  </style>
  <div class="t">Incremental Investment in Rail Corridors</div>
  <div class="au">A. Hartley &nbsp;&nbsp; M. Okonkwo &nbsp;&nbsp; S. Brandt</div>
  <div class="abs"><b>Abstract.</b> ${para(5)}</div>
  <div class="cols">
   <h1>1 Introduction</h1><p>${para(7)}</p><p>${para(6)}</p>
   <h1>2 Related Work</h1><p>${para(8)}</p>
   <h2>2.1 Cost models</h2><p>${para(6)}</p>
   <table><thead><tr><th>Option</th><th>Cost (M)</th><th>Delay (d)</th><th>Score</th></tr></thead>
     <tbody><tr><td>Baseline</td><td>0.0</td><td>412</td><td>1.00</td></tr><tr><td>Incremental</td><td>31.4</td><td>188</td><td>1.74</td></tr><tr><td>Single programme</td><td>96.2</td><td>240</td><td>1.31</td></tr></tbody></table>
   <p class="cap">Table 1. Comparison of options.</p>
   <p>${para(8)}</p>
   <h1>3 Method</h1><p>${para(9)}</p><p>${para(7)}</p>
   <h1>4 Discussion</h1><p>${para(9)}</p><p>${para(8)}</p>
   <h1>References</h1>
   <p class="ref">[1] Hartley, A. Rail investment under uncertainty. <i>Journal of Transport</i>, 2024.</p>
   <p class="ref">[2] Brandt, S. and Okonkwo, M. Signalling costs revisited. <i>Rail Review</i>, 2025.</p>
   <p class="ref">[3] Okonkwo, M. Corridor demand after the pandemic. <i>Transport Studies</i>, 2023.</p>
  </div>`,
};

// 3. invoice ---------------------------------------------------------------
fixtures.invoice = {
  html: `<style>${css}
  body { font-family: "Carlito", "Liberation Sans", sans-serif; font-size: 10.5pt; line-height: 1.3 }
  .top { display: flex; justify-content: space-between; margin-bottom: 18pt }
  .brand { font-size: 22pt; font-weight: bold; color: #0b5d7a } .right { text-align: right }
  table.items { border-collapse: collapse; width: 100% } table.items th { background: #0b5d7a; color: #fff; text-align: left; padding: 5pt 6pt; border: 0.75pt solid #0b5d7a }
  table.items td { border: 0.75pt solid #999; padding: 5pt 6pt } td.n, th.n { text-align: right }
  table.items tr:nth-child(even) td { background: #eef5f8 }
  .tot { width: 40%; margin-left: auto; margin-top: 10pt; border-collapse: collapse } .tot td { padding: 3pt 6pt; text-align: right } .tot tr:last-child td { font-weight: bold; border-top: 1.5pt solid #000; font-size: 12pt }
  .foot { margin-top: 28pt; font-size: 9pt; color: #555 }
  </style>
  <div class="top"><div><div class="brand">Northfield Supply Co.</div>12 Mill Lane<br>Leeds LS1 4AB<br>VAT GB 123 4567 89</div>
   <div class="right"><b style="font-size:16pt">INVOICE</b><br>No. 2026-0412<br>Date: 3 March 2026<br>Due: 2 April 2026</div></div>
  <p style="text-align:left"><b>Bill to</b><br>Hartley &amp; Sons Ltd<br>4 Station Road<br>York YO1 6GA</p>
  <table class="items"><thead><tr><th>Description</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr></thead><tbody>
   <tr><td>Signal cable, 500 m drum</td><td class="n">4</td><td class="n">1,240.00</td><td class="n">4,960.00</td></tr>
   <tr><td>Junction boxes (weatherproof), pack of 20</td><td class="n">12</td><td class="n">86.50</td><td class="n">1,038.00</td></tr>
   <tr><td>Fixings and brackets, mixed</td><td class="n">30</td><td class="n">14.25</td><td class="n">427.50</td></tr>
   <tr><td colspan="3">Delivery to depot (two drops), including pallets and a long description that wraps onto a second line</td><td class="n">180.00</td></tr>
   <tr><td>Inspection visit</td><td class="n">1</td><td class="n">250.00</td><td class="n">250.00</td></tr></tbody></table>
  <table class="tot"><tr><td>Subtotal</td><td>6,855.50</td></tr><tr><td>VAT 20%</td><td>1,371.10</td></tr><tr><td>Total due</td><td>8,226.60</td></tr></table>
  <div class="foot">Payment by bank transfer to Northfield Supply Co., sort code 12-34-56, account 00012345. Please quote the invoice number.</div>`,
};

// 4. contents + chapters ---------------------------------------------------
const toc = [['Executive summary', 3], ['1. Introduction', 4], ['1.1 Background', 4], ['1.2 Objectives', 6], ['2. Corridor analysis', 7], ['3. Costs and delivery', 11], ['Appendix A. Data sources', 15]];
fixtures.toc = {
  html: `<style>${css}
  .toc div { display: flex; margin: 0 0 5pt; overflow: hidden } .toc .l { white-space: nowrap } .toc .d { flex: 1; overflow: hidden; white-space: nowrap; padding-left: 4pt; letter-spacing: 1pt } .toc .d::after { content: ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ." } .toc .p { padding-left: 4pt }
  .toc .s { padding-left: 18pt }
  </style>
  <h1 style="font-size:22pt;margin-top:10pt">Contents</h1>
  <div class="toc">${toc.map(([t, p]) => `<div class="${/^\d\.\d/.test(t) ? 's' : ''}"><span class="l">${t}</span><span class="d"></span><span class="p">${p}</span></div>`).join('')}</div>
  <div style="break-before:page"></div>
  <h1>Executive summary</h1><p>${para(6)}</p>
  <h1>1. Introduction</h1><p>${para(5)}</p><h2>1.1 Background</h2><p>${para(5)}</p>`,
};

// 5. tables ----------------------------------------------------------------
fixtures.tables = {
  html: `<style>${css}
  body { font-family: "Liberation Sans", sans-serif; font-size: 10pt }
  table { border-collapse: collapse; margin: 6pt 0 16pt; width: 100% } td, th { padding: 4pt 6pt; vertical-align: top; text-align: left }
  .grid td, .grid th { border: 0.75pt solid #444 } .grid th { background: #dde4ee }
  .open td, .open th { border: none } .open th { border-bottom: 1pt solid #000 }
  .zebra tr:nth-child(odd) td { background: #f0f0f0 } .zebra th { background: #333; color: #fff }
  .num td:nth-child(n+2), .num th:nth-child(n+2) { text-align: right }
  h2 { font-size: 12pt; margin: 6pt 0 2pt } p { text-align: left }
  </style>
  <h2>A. Fully ruled with merged cells</h2>
  <table class="grid"><tr><th rowspan="2">Region</th><th colspan="2">2025</th><th colspan="2">2026</th></tr>
   <tr><th>Q1</th><th>Q2</th><th>Q1</th><th>Q2</th></tr>
   <tr><td>North</td><td>120</td><td>134</td><td>141</td><td>150</td></tr>
   <tr><td>South</td><td>98</td><td>101</td><td>110</td><td>113</td></tr>
   <tr><td colspan="5">Figures in thousands of passengers. Source: operator returns, wrapped here so the cell has two lines of text in it.</td></tr></table>
  <h2>B. No borders, header rule only</h2>
  <table class="open num"><tr><th>Station</th><th>Boardings</th><th>Change</th><th>Share</th></tr>
   <tr><td>Central</td><td>18,204</td><td>+4.2%</td><td>31%</td></tr><tr><td>Riverside</td><td>9,311</td><td>-1.0%</td><td>16%</td></tr>
   <tr><td>Harbour</td><td>7,880</td><td>+12.5%</td><td>13%</td></tr><tr><td>University</td><td>6,452</td><td>+0.3%</td><td>11%</td></tr></table>
  <h2>C. Zebra stripes, no lines</h2>
  <table class="zebra"><tr><th>Task</th><th>Owner</th><th>Status</th></tr>
   <tr><td>Survey platforms</td><td>Hartley</td><td>Done</td></tr><tr><td>Draft costings</td><td>Okonkwo</td><td>In progress</td></tr>
   <tr><td>Review with operators</td><td>Brandt</td><td>Not started</td></tr><tr><td>Publish findings</td><td>Hartley</td><td>Not started</td></tr></table>
  <h2>D. Key and value list</h2>
  <table class="open"><tr><td style="width:120pt"><b>Project</b></td><td>Northern corridor study</td></tr><tr><td><b>Client</b></td><td>Regional Transport Authority</td></tr><tr><td><b>Duration</b></td><td>14 months</td></tr></table>`,
};

// 6. resume with sidebar ----------------------------------------------------
fixtures.resume = {
  html: `<style>${css}
  @page { margin: 0.5in } body { font-family: "Liberation Sans", sans-serif; font-size: 10pt; line-height: 1.35 }
  .wrap { display: grid; grid-template-columns: 170pt 1fr; gap: 24pt } .side { background: #1d3557; color: #fff; padding: 16pt 12pt; min-height: 9.6in }
  .side h3 { font-size: 10pt; letter-spacing: 1pt; text-transform: uppercase; margin: 14pt 0 4pt; font-style: normal; border-bottom: 0.75pt solid #a8c0e0 }
  .side p { text-align: left; margin: 0 0 3pt } h1 { font-size: 26pt; margin: 8pt 0 0 } .role { font-size: 12pt; color: #1d3557; margin-bottom: 12pt }
  .job { margin-bottom: 10pt } .job h2 { font-size: 11pt; margin: 0 } .job .when { color: #666; font-size: 9pt } ul { margin: 3pt 0; padding-left: 14pt } p { text-align:left }
  </style>
  <div class="wrap"><div class="side"><h3>Contact</h3><p>alex.rivera@example.org</p><p>+44 20 7946 0000</p><p>Leeds, UK</p><h3>Skills</h3><p>Project delivery</p><p>Rail systems</p><p>Cost modelling</p><p>Stakeholder reports</p><h3>Languages</h3><p>English</p><p>Spanish</p></div>
  <div><h1>Alex Rivera</h1><div class="role">Senior Transport Planner</div>
  <p>${para(3)}</p>
  <div class="job"><h2>Transport Planner, Northern Rail Authority</h2><div class="when">2021 - present</div><ul><li>Led the corridor study covering twelve stations and two branch lines</li><li>Built the demand model used in the 2025 investment case</li><li>Presented findings to the board and three local councils</li></ul></div>
  <div class="job"><h2>Analyst, Regional Transport Authority</h2><div class="when">2017 - 2021</div><ul><li>Maintained the passenger count database</li><li>Produced quarterly performance reports</li></ul></div>
  <div class="job"><h2>Education</h2><div class="when">2013 - 2017</div><p>BSc Civil Engineering, University of Leeds</p></div></div></div>`,
};

const fsx = require('fs');
fixtures.sample = { header: true, html: fsx.readFileSync(path.join(__dirname, 'sample.html'), 'utf8') };

(async () => {
  const browser = await browserLib.launch();
  const only = process.argv.slice(2);
  for (const [name, f] of Object.entries(fixtures)) {
    if (only.length && !only.includes(name)) continue;
    const pg = await browser.newPage();
    await pg.setContent(`<!doctype html><meta charset=utf8><body>${f.html}</body>`);
    await pg.waitForTimeout(150);
    const header = f.header ? {
      displayHeaderFooter: true,
      headerTemplate: name === 'sample' ? `<div style="font-size:8pt;font-family:Liberation Sans;width:100%;padding:0 0.9in;display:flex;justify-content:space-between;color:#5a6672"><span>Black Box case file</span><span>Incident P2W-0412</span></div>` : `<div style="font-size:8.5pt;font-family:Liberation Serif;width:100%;padding:0 1in;display:flex;justify-content:space-between"><span>Regional Rail Review</span><span>Confidential draft</span></div>`,
      footerTemplate: name === 'sample' ? `<div style="font-size:8pt;font-family:Liberation Sans;width:100%;text-align:center;color:#5a6672">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>` : `<div style="font-size:8.5pt;font-family:Liberation Serif;width:100%;text-align:center">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    } : {};
    await pg.pdf({ path: path.join(__dirname, '..', 'fixtures', name + '.pdf'), preferCSSPageSize: true, printBackground: true, ...header });
    await pg.close();
    console.log('wrote', name);
  }
  await browser.close();
})();
