'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const MD2TeX = require('../../markdown-to-latex/src/md2tex.js');
const Article2MD = require('../src/article2md.js');
const Pipeline = require('../src/pipeline.js');
const { tweet, quoted } = require('./fixtures/article.js');

const IMG = path.join(__dirname, '../../markdown-to-latex/tests/fixtures/images');
const bytesFor = {
  'https://pbs.twimg.com/media/cover.jpg': fs.readFileSync(path.join(IMG, 'wide.jpg')),
  'https://pbs.twimg.com/media/photo.png': fs.readFileSync(path.join(IMG, 'photo.png')),
  'https://pbs.twimg.com/tweet_video_thumb/anim.gif': fs.readFileSync(path.join(IMG, 'animated.gif'))
};

function deps(extra) {
  return Object.assign({
    MD2TeX, Article2MD,
    fetchJson: async url => {
      if (url.endsWith('/status/999')) return { code: 200, tweet };
      const id = url.split('/').pop();
      return quoted[id] ? { code: 200, tweet: quoted[id] } : { code: 404, message: 'NOT_FOUND', tweet: null };
    },
    fetchBytes: async url => { if (!bytesFor[url]) throw new Error('404'); return new Uint8Array(bytesFor[url]); },
    convertImage: async b => b // pretend conversion
  }, extra || {});
}

test('statusIdFromUrl understands the usual links', () => {
  const f = Article2MD.statusIdFromUrl;
  assert.deepStrictEqual(f('https://x.com/ada/status/999'), { handle: 'ada', id: '999' });
  assert.deepStrictEqual(f('https://twitter.com/ada/status/999?s=20'), { handle: 'ada', id: '999' });
  assert.deepStrictEqual(f('https://x.com/i/status/999'), { handle: null, id: '999' });
  assert.strictEqual(f('https://x.com/ada'), null);
  assert.strictEqual(f('https://x.com/i/article/2075141930652962816'), null);
});

test('Markdown keeps structure, math, code, links and citations', () => {
  const r = Article2MD.build(tweet, { quoted });
  const md = r.markdown;
  assert.match(md, /^# Why attention works$/m);
  assert.match(md, /^## Key ideas$/m);
  assert.match(md, /^# References$/m);
  assert.match(md, /\[original paper\]\(https:\/\/arxiv\.org\/abs\/1706\.03762\)\[1\]/);
  assert.match(md, /\*\*details\*\*/);
  assert.match(md, /Energy is \$E = mc\^2\$/);            // typed math untouched
  assert.match(md, /costs \\\$5 and a sandwich \\\$10/);    // currency is not math
  assert.match(md, /snake\\_case\\_names/);
  assert.match(md, /^\$\$\\int_0\^1 x\^2\\,dx = \\frac\{1\}\{3\}\$\$$/m);
  assert.match(md, /\$\$\na\^2 \+ b\^2 = c\^2\n\$\$/);      // LaTeX entity
  assert.match(md, /Scaled by \\\(\\sqrt\{d_k\}\\\)/);
  assert.match(md, /```\ndef attention[\s\S]*# \$not math\$\n {4}return w @ v\n```/);
  assert.match(md, /\| Model \| Score \|/);
  assert.match(md, /> \*\*Alan Turing\*\* \(@alan\)/);
  assert.match(md, /\n1\. original paper — <https:\/\/arxiv\.org\/abs\/1706\.03762>\n2\. follow-up/);
  assert.strictEqual((md.match(/\)\[1\]/g) || []).length, 2, 'same URL reuses its number');
  assert.deepStrictEqual(r.images.map(i => i.file), ['images/fig-001.jpg', 'images/fig-002.png', 'images/fig-003.gif']);
  assert.match(md, /Animated GIF.*video\.twimg\.com/);
  // Markdown specials in plain text are neutralised
  assert.match(md, /^#1 hashtag, 1\. not a list, \\> not a quote, \\<script\\>/m);
  assert.deepStrictEqual(r.warnings, []);
});

test('citations: inline mode adds no reference list', () => {
  const md = Article2MD.build(tweet, { quoted, citations: 'inline' }).markdown;
  assert.ok(!/## References/.test(md));
  assert.ok(!/\)\[1\]/.test(md));
});

test('not an article -> clear error', () => {
  assert.throws(() => Article2MD.build({ text: 'hello' }), /not an X Article/);
});

test('mathRanges follows pandoc rules for $', () => {
  const f = s => Article2MD.mathRanges(s).map(([a, b]) => s.slice(a, b));
  assert.deepStrictEqual(f('costs $5 and $10 total'), []);
  assert.deepStrictEqual(f('so $x_1$ and $y$ ok'), ['$x_1$', '$y$']);
  assert.deepStrictEqual(f('$$a$$ then \\(b\\) then \\[c\\]'), ['$$a$$', '\\(b\\)', '\\[c\\]']);
  assert.deepStrictEqual(f('$ not math $'), []);
});

test('full pipeline produces tex + picture files', async () => {
  const p = await Pipeline.buildProject('https://x.com/ada/status/999', deps());
  assert.match(p.tex, /\\begin\{document\}/);
  assert.match(p.tex, /Attention/);
  assert.ok(p.tex.includes('E = mc^2'));
  assert.deepStrictEqual(Object.keys(p.files).sort().length, 3);
  assert.ok(Object.keys(p.files).every(k => k.startsWith('images/')));
  assert.strictEqual(Pipeline.fileStem(p.title), 'Attention-Equations-a-100-test');
});

test('a failed picture download is reported, not fatal', async () => {
  const p = await Pipeline.buildProject('https://x.com/ada/status/999', deps({
    fetchBytes: async url => { if (url.includes('photo.png')) throw new Error('boom'); return new Uint8Array(bytesFor[url]); }
  }));
  assert.ok(p.warnings.some(w => /could not be downloaded/.test(w.message)));
  assert.strictEqual(Object.keys(p.files).length, 2);
});

test('plain posts and bad links give helpful errors', async () => {
  await assert.rejects(Pipeline.buildProject('https://x.com/ada', deps()), /post link/);
  await assert.rejects(Pipeline.buildProject('https://x.com/ada/status/999', deps({ fetchJson: async () => ({ tweet: { text: 'hi' } }) })), /normal post/);
  await assert.rejects(Pipeline.buildProject('https://x.com/ada/status/1', deps({ fetchJson: async () => ({ code: 404, message: 'NOT_FOUND', tweet: null }) })), /not found/);
});
