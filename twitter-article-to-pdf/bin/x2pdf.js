#!/usr/bin/env node
/* x2pdf — turn an X (Twitter) Article into a LaTeX document and a PDF.
 *
 *   node bin/x2pdf.js https://x.com/<user>/status/<id> [-o folder] [options]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const MD2TeX = require('../../markdown-to-latex/src/md2tex.js');
const Article2MD = require('../src/article2md.js');
const Pipeline = require('../src/pipeline.js');

const USAGE = `Usage: x2pdf.js <article link> [-o folder] [options]
       x2pdf.js --json post.json [-o folder]      (use a saved FxTwitter response; pictures are still downloaded)

  -o, --out <folder>      where to write the files (default: ./<article title>)
  --engine <name>         xelatex | lualatex | pdflatex | tectonic (default: first one installed)
  --no-pdf                only write the .tex file, the pictures and the .md file
  --font <name>           latinmodern | times | palatino
  --paper <a4|letter>     --size <10|11|12>     --toc            add a table of contents
  --citations <mode>      references (default: numbered list at the end) | inline (links only)
  --print                 grayscale links, for printing
  -h, --help`;

function parseArgs(argv) {
  const o = { tex: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { if (i + 1 >= argv.length) throw new Error('Missing value after ' + a); return argv[++i]; };
    if (a === '-h' || a === '--help') o.help = true;
    else if (a === '-o' || a === '--out') o.out = val();
    else if (a === '--json') o.json = val();
    else if (a === '--engine') o.engine = val();
    else if (a === '--no-pdf') o.noPdf = true;
    else if (a === '--font') o.tex.font = val();
    else if (a === '--paper') o.tex.paper = val();
    else if (a === '--size') o.tex.fontSize = val();
    else if (a === '--toc') o.tex.toc = true;
    else if (a === '--print') o.tex.theme = 'print';
    else if (a === '--citations') o.citations = val();
    else if (a.startsWith('-')) throw new Error('Unknown option ' + a);
    else if (!o.url) o.url = a;
    else throw new Error('Unexpected argument ' + a);
  }
  return o;
}

async function http(url, what) {
  const res = await fetch(url, { headers: { 'User-Agent': 'x2pdf (+local script)', Accept: '*/*' }, redirect: 'follow' });
  if (!res.ok && res.status !== 404) throw new Error(what + ' failed: HTTP ' + res.status);
  return res;
}

/** Re-encode GIF/WebP/odd PNGs as plain PNG with ImageMagick, when it is installed. */
function convertImage(bytes) {
  const r = spawnSync('convert', ['-[0]', '-background', 'white', '-alpha', 'remove', '-alpha', 'off', '-depth', '8', 'png:-'],
    { input: Buffer.from(bytes), maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 || !r.stdout.length) throw new Error('ImageMagick "convert" is needed for this picture format');
  return new Uint8Array(r.stdout);
}

function findEngine(wanted) {
  const list = wanted ? [wanted] : ['xelatex', 'lualatex', 'pdflatex', 'tectonic'];
  for (const e of list) {
    const r = spawnSync(e, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return e;
  }
  return null;
}

function compile(engine, dir, texName) {
  const args = engine === 'tectonic'
    ? [texName]
    : ['-interaction=nonstopmode', '-no-shell-escape', texName];
  let last = null;
  for (let pass = 0; pass < (engine === 'tectonic' ? 1 : 2); pass++) {
    last = spawnSync(engine, args, { cwd: dir, encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024,
      env: Object.assign({}, process.env, { openin_any: 'p', openout_any: 'p', shell_escape: 'f' }) });
  }
  const pdf = path.join(dir, texName.replace(/\.tex$/, '.pdf'));
  const log = (last.stdout || '') + (last.stderr || '');
  const errors = (log.match(/^! .*$/gm) || []).slice(0, 5);
  return { ok: fs.existsSync(pdf), pdf, errors, status: last.status };
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || (!o.url && !o.json)) { console.log(USAGE); process.exit(o.help ? 0 : 2); }

  const engine = o.noPdf ? (o.engine || 'xelatex') : findEngine(o.engine);
  if (!o.noPdf && !engine) {
    console.error('No TeX engine found (xelatex, lualatex, pdflatex, tectonic). Install one, or run with --no-pdf and upload the folder to Overleaf.');
    process.exit(3);
  }

  const savedJson = o.json ? JSON.parse(fs.readFileSync(o.json, 'utf8')) : null;
  const fetchJson = async url => {
    if (savedJson && /\/status\/\d+$/.test(url) && !fetchJson.used) { fetchJson.used = true; return savedJson; }
    return (await http(url, 'Loading the post')).json();
  };
  const project = await Pipeline.buildProject(o.url || (savedJson.tweet && savedJson.tweet.url) || 'https://x.com/i/status/' + (savedJson.tweet && savedJson.tweet.id), {
    MD2TeX, Article2MD,
    fetchJson,
    fetchBytes: async url => new Uint8Array(await (await http(url, 'Downloading a picture')).arrayBuffer()),
    convertImage,
    citations: o.citations,
    texOptions: Object.assign({ engine: engine === 'tectonic' ? 'xelatex' : engine }, o.tex),
    onProgress: m => console.error(m)
  });

  const stem = Pipeline.fileStem(project.title);
  const dir = path.resolve(o.out || stem);
  fs.mkdirSync(path.join(dir, 'images'), { recursive: true });
  fs.writeFileSync(path.join(dir, stem + '.tex'), project.tex);
  fs.writeFileSync(path.join(dir, stem + '.md'), project.markdown);
  for (const [rel, bytes] of Object.entries(project.files)) fs.writeFileSync(path.join(dir, rel), bytes);

  for (const w of project.warnings) console.error((w.level === 'info' ? 'note: ' : 'warning: ') + w.message);
  console.error('Wrote ' + path.join(dir, stem + '.tex') + ' (' + Object.keys(project.files).length + ' pictures, ' + project.stats.links + ' links)');

  if (!o.noPdf) {
    console.error('Building the PDF with ' + engine + '…');
    const r = compile(engine, dir, stem + '.tex');
    if (r.ok) console.error((r.status === 0 ? 'Done: ' : 'PDF written, but LaTeX reported errors: ') + r.pdf);
    else console.error('LaTeX could not build a PDF.\n' + r.errors.join('\n'));
    if (r.errors.length && r.ok) console.error(r.errors.join('\n'));
    if (!r.ok) process.exit(4);
  }
}

main().catch(e => { console.error('Error: ' + (e && e.message ? e.message : e)); process.exit(1); });
