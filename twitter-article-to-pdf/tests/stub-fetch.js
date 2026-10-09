'use strict';
// Preloaded with `node --require` so the CLI can be tested without touching X.
const fs = require('fs');
const path = require('path');
const { tweet, quoted } = require('./fixtures/article.js');
const IMG = path.join(__dirname, '..', '..', 'markdown-to-latex', 'tests', 'fixtures', 'images');
const FILES = { 'cover.jpg': 'wide.jpg', 'photo.png': 'photo.png', 'anim.gif': 'animated.gif' };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
globalThis.fetch = async url => {
  const u = String(url);
  if (u.startsWith('https://api.fxtwitter.com/')) {
    const id = u.split('/').pop();
    if (id === '999') return json(200, { code: 200, tweet });
    if (id === '777') return json(200, { code: 200, tweet: { id: '777', text: 'just a post' } });
    return quoted[id] ? json(200, { code: 200, tweet: quoted[id] }) : json(404, { code: 404, message: 'NOT_FOUND', tweet: null });
  }
  const f = FILES[u.split('/').pop()];
  if (f) return new Response(fs.readFileSync(path.join(IMG, f)), { status: 200 });
  return new Response('no', { status: 404 });
};
