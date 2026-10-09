/*!
 * Minimal ZIP writer (store method, no compression) so the page can offer
 * "Download project" without any library. Works in browsers and Node.
 *
 *   const bytes = MD2Zip.create([{ name: 'main.tex', data: Uint8Array }, { name: 'images/a.png', data: bytes }]);
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MD2Zip = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let table = null;
  function crc32(bytes) {
    if (!table) {
      table = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  const utf8 = s => new TextEncoder().encode(s);

  function dosDateTime(d) {
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time, date };
  }

  /** files: [{ name, data: Uint8Array | string }]  ->  Uint8Array (a .zip file) */
  function create(files, when) {
    const stamp = dosDateTime(when || new Date());
    const chunks = [];
    const central = [];
    let offset = 0;
    const push = bytes => { chunks.push(bytes); offset += bytes.length; };

    for (const f of files) {
      const name = utf8(f.name.replace(/\\/g, '/').replace(/^\/+/, ''));
      const data = typeof f.data === 'string' ? utf8(f.data) : f.data;
      const crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);              // version needed
      local.setUint16(6, 0x0800, true);          // UTF-8 names
      local.setUint16(8, 0, true);               // stored
      local.setUint16(10, stamp.time, true);
      local.setUint16(12, stamp.date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      local.setUint16(28, 0, true);
      const headerOffset = offset;
      push(new Uint8Array(local.buffer)); push(name); push(data);

      const entry = new DataView(new ArrayBuffer(46));
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(8, 0x0800, true);
      entry.setUint16(10, 0, true);
      entry.setUint16(12, stamp.time, true);
      entry.setUint16(14, stamp.date, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, data.length, true);
      entry.setUint32(24, data.length, true);
      entry.setUint16(28, name.length, true);
      entry.setUint32(42, headerOffset, true);
      central.push(new Uint8Array(entry.buffer), name);
    }

    const centralStart = offset;
    central.forEach(push);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, offset - centralStart, true);
    end.setUint32(16, centralStart, true);
    push(new Uint8Array(end.buffer));

    const out = new Uint8Array(offset);
    let pos = 0;
    for (const c of chunks) { out.set(c, pos); pos += c.length; }
    return out;
  }

  return { create, crc32 };
});
