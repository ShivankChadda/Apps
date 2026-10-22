// Finds Playwright and a Chromium to drive it (works with a normal install or the preinstalled one).
const fs = require('fs');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const exe = ['/opt/pw-browsers/chromium'].find((p) => fs.existsSync(p));
module.exports = {
  chromium: pw.chromium,
  launch: () => pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--no-sandbox'] }),
};
