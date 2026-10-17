importScripts('tex.js');

const HELPER = 'http://127.0.0.1:8765';
const MAX_IMAGES = 25;

function status(text, extra) {
  chrome.runtime.sendMessage({ type: 'status', text, ...extra }).catch(() => {}); // popup may be closed
}

const slug = (s) => (s || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'article';

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

async function makePdf(tabId, withImages) {
  status('Reading the article…');
  await chrome.scripting.executeScript({ target: { tabId }, files: ['vendor/Readability.js', 'tex.js', 'content/extract.js'] });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => { try { return window.__articleToPdf(); } catch (e) { return { error: e.message }; } },
  });
  const error = result && result.error;
  if (error) throw new Error(error);

  const { meta, body, images } = result;
  const files = {};
  if (withImages && images.length) {
    const wanted = images.slice(0, MAX_IMAGES);
    for (let i = 0; i < wanted.length; i++) {
      status(`Fetching pictures (${i + 1}/${wanted.length})…`);
      const b64 = await fetchImage(wanted[i].url);
      if (b64) files[`img${wanted[i].id}.jpg`] = b64;
    }
  }

  const tex = TeX.assemble(meta, body);
  const name = slug(meta.title);

  status('Typesetting with LaTeX…');
  let resp;
  try {
    resp = await fetch(`${HELPER}/compile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex, files }),
    });
  } catch (e) {
    // helper not running: hand over the LaTeX so the work isn't lost
    await download(new TextEncoder().encode(tex), 'application/x-tex', `${name}.tex`);
    return { ok: true, title: meta.title, text: 'Helper not running, so I saved the .tex instead. Start the helper (see README) for a PDF.' };
  }
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    await download(new TextEncoder().encode(tex), 'application/x-tex', `${name}.tex`);
    throw new Error(`LaTeX failed: ${err.error || resp.status}. The .tex was saved so you can inspect it.`);
  }
  await download(new Uint8Array(await resp.arrayBuffer()), 'application/pdf', `${name}.pdf`);
  return { ok: true, title: meta.title, text: `Saved ${name}.pdf to Downloads` + (Object.keys(files).length ? ` (${Object.keys(files).length} pictures).` : '.') };
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
