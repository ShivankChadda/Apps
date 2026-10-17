const msg = document.getElementById('msg');
const go = document.getElementById('go');
const say = (t, err) => { msg.textContent = t; msg.className = err ? 'err' : ''; };

chrome.runtime.onMessage.addListener((m) => { if (m.type === 'status') say(m.text); });

go.addEventListener('click', async () => {
  go.disabled = true;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const r = await chrome.runtime.sendMessage({
    type: 'make-pdf', tabId: tab.id, images: document.getElementById('img').checked,
  });
  say(r.text, !r.ok);
  go.disabled = false;
});
