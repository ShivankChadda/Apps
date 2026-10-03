'use strict';
/*
 * Node-side helpers for pictures referenced by a Markdown file (used by the CLI and the tests).
 * The web app does the same two jobs in the browser:
 *   - resolve "images/foo.png" to a file the user provided, and report whether it must be
 *     re-encoded (16-bit/interlaced PNG, GIF, SVG, WebP, ... → plain 8-bit PNG);
 *   - write the finished files next to the .tex / into the zip / to the compile helper.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const MD2TeX = require('../src/md2tex.js');

/** resolveAsset() implementation for MD2TeX.convert(): files are looked up relative to baseDir. */
function makeResolver(baseDir) {
  const root = path.resolve(baseDir);
  return key => {
    const full = path.resolve(root, key);
    if (!full.startsWith(root + path.sep) || !fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
    const head = fs.readFileSync(full).subarray(0, 4096);
    const info = MD2TeX.sniffImage(head);
    const ext = info.format === 'unknown' ? path.extname(full).slice(1).toLowerCase() : info.format;
    return { id: full, name: path.basename(full), ext, convert: info.normalize && info.format !== 'pdf' };
  };
}

/** Write one asset reported by MD2TeX.convert() to `dest` (decoding data: URIs, normalising pictures). */
function writeAsset(asset, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let source = asset.id;
  let tmp = null;
  if (asset.dataUri) {
    tmp = dest + '.src';
    fs.writeFileSync(tmp, Buffer.from(asset.dataUri.replace(/^data:[^,]*,/, ''), 'base64'));
    source = tmp;
  }
  if (asset.convert) {
    const r = spawnSync('convert', [source + '[0]', '-background', 'white', '-alpha', 'remove', '-alpha', 'off', '-depth', '8', dest]);
    if (r.status !== 0) spawnSync('convert', [source + '[0]', '-depth', '8', dest]);
  } else if (tmp) {
    fs.renameSync(tmp, dest);
    tmp = null;
  } else {
    fs.copyFileSync(source, dest);
  }
  if (tmp) fs.rmSync(tmp, { force: true });
}

module.exports = { makeResolver, writeAsset };
