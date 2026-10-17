importScripts('tex.js'); // LaTeX output, used when the optional helper is running

const HELPER = 'http://127.0.0.1:8765';
const MAX_IMAGES = 25;

function status(text, extra) {
  chrome.runtime.sendMessage({ type: 'status', text, ...extra }).catch(() => {}); // popup may be closed
}

const slug = (s) => (s || 'article').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'article';

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/* Downloads one picture and re-encodes it as a JPEG LaTeX can read. null if it can't. */
async function fetchImage(url) {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    const resp = await fetch(url, { signal: ctl.signal });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const bmp = await createImageBitmap(await resp.blob());
    if (bmp.width < 120 || bmp.height < 80) return null; // icons, tracking pixels
    const k = Math.min(1, 1400 / bmp.width);
    const canvas = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
    const g = canvas.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.height); // JPEG has no transparency
    g.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const jpg = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
    return toBase64(new Uint8Array(await jpg.arrayBuffer()));
  } catch (e) {
    return null; // SVG, blocked, timed out: the article simply has no picture there
  }
}

async function download(bytes, mime, filename) {
  const url = `data:${mime};base64,${toBase64(bytes)}`;
  await chrome.downloads.download({ url, filename, saveAs: false });
}

async function helperIsUp() {
  try { return (await fetch(`${HELPER}/`, { signal: AbortSignal.timeout(800) })).ok; } catch (e) { return false; }
}

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['BLOBS'], justification: 'Lay out and write the PDF' });
}

/* Built-in writer: no LaTeX needed. */
async function builtInPdf(meta, blocks, files) {
  await ensureOffscreen();
  const images = {};
  for (const [name, b64] of Object.entries(files)) images[name.replace(/\D/g, '')] = b64;
  const r = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'render-pdf', meta, blocks, images });
  if (!r || !r.ok) throw new Error(`PDF writer failed: ${r && r.error}`);
  return Uint8Array.from(atob(r.pdf), (c) => c.charCodeAt(0));
}

async function makePdf(tabId, withImages) {
  status('Reading the article…');
  await chrome.scripting.executeScript({ target: { tabId }, files: ['vendor/Readability.js', 'blocks.js', 'content/extract.js'] });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => { try { return window.__articleToPdf(); } catch (e) { return { error: e.message }; } },
  });
  if (result && result.error) throw new Error(result.error);

  const { meta, blocks, images } = result;
  const files = {};
  if (withImages && images.length) {
    const wanted = images.slice(0, MAX_IMAGES);
    for (let i = 0; i < wanted.length; i++) {
      status(`Fetching pictures (${i + 1}/${wanted.length})…`);
      const b64 = await fetchImage(wanted[i].url);
      if (b64) files[`img${wanted[i].id}.jpg`] = b64;
    }
  }
  const name = slug(meta.title);
  const pics = Object.keys(files).length ? ` (${Object.keys(files).length} pictures)` : '';

  // Real LaTeX if the optional helper is running...
  if (await helperIsUp()) {
    status('Typesetting with LaTeX…');
    const tex = TeX.assemble(meta, TeX.renderBlocks(blocks));
    const resp = await fetch(`${HELPER}/compile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tex, files }),
    }).catch(() => null);
    if (resp && resp.ok) {
      await download(new Uint8Array(await resp.arrayBuffer()), 'application/pdf', `${name}.pdf`);
      return { ok: true, title: meta.title, text: `Saved ${name}.pdf${pics}, typeset with LaTeX.` };
    }
    status('LaTeX failed, using the built-in layout…');
  }

  // ...otherwise the built-in LaTeX-style layout.
  status('Laying out the PDF…');
  await download(await builtInPdf(meta, blocks, files), 'application/pdf', `${name}.pdf`);
  return { ok: true, title: meta.title, text: `Saved ${name}.pdf${pics}.` };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type !== 'make-pdf') return;
  makePdf(msg.tabId, msg.images !== false)
    .then(reply)
    .catch((e) => reply({ ok: false, text: e.message }));
  return true; // async reply
});

// Same thing from the right-click menu on a page
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'a2p', title: 'Save article as PDF', contexts: ['page'] });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'a2p') return;
  chrome.action.setBadgeText({ text: '…', tabId: tab.id });
  const r = await makePdf(tab.id, true).catch((e) => ({ ok: false, text: e.message }));
  chrome.action.setBadgeText({ text: r.ok ? '✓' : '!', tabId: tab.id });
});
