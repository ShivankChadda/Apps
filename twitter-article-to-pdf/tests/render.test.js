'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const marked = require('../../markdown-to-latex/vendor/marked.umd.js');
const katex = require('../extension/vendor/katex/katex.min.js');
const Article2MD = require('../src/article2md.js');
const XRender = require('../src/render.js');
const { tweet, quoted } = require('./fixtures/article.js');

const render = (md, extra) => XRender.toHtml(md, Object.assign({ marked, katex, mathRanges: Article2MD.mathRanges, imageUrl: f => 'blob:' + f }, extra));

test('typed math is typeset, currency and code are not', () => {
  const r = render('Energy $E = mc^2$ costs \\$5 and \\$10.\n\n`$not math$`\n\n$$\\int_0^1 x^2 dx$$\n\nand \\(a_1\\)');
  assert.equal(r.math, 3);
  assert.equal(r.mathErrors, 0);
  assert.match(r.html, /class="katex"/);
  assert.match(r.html, /math-display/);
  assert.match(r.html, /<code>\$not math\$<\/code>/);
  assert.match(r.html, /costs \$5 and \$10/);
});

test('underscores and stars inside math do not become emphasis', () => {
  const r = render('so $x_1 + y_2 * z_3$ holds');
  assert.ok(!/<em>/.test(r.html));
  assert.equal(r.math, 1);
});

test('broken formulas stay visible as source', () => {
  const r = render('bad $\\frac{1$ here');
  assert.equal(r.mathErrors, 1);
  assert.match(r.html, /math-fallback/);
  assert.match(r.html, /\\frac\{1/);
});

test('raw HTML and unsafe links are neutralised', () => {
  const r = render('<script>alert(1)</script>\n\ntext <img src=x onerror=alert(1)> [x](javascript:alert(1)) [ok](https://example.org/a?b=1)');
  assert.ok(!/<script/i.test(r.html));
  assert.ok(!/javascript:/i.test(r.html));
  assert.ok(!/<img src=x/i.test(r.html), 'inline raw HTML is escaped too');
  assert.match(r.html, /<a href="https:\/\/example\.org\/a\?b=1">ok<\/a>/);
});

test('pictures become figures with captions; missing ones are marked', () => {
  const r = render('![A caption](images/a.png)\n\n![](images/b.png)\n\n![gone](images/c.png)', { imageUrl: f => (f.endsWith('c.png') ? '' : 'blob:' + f) });
  assert.match(r.html, /<figure><img src="blob:images\/a\.png" alt="A caption"><figcaption>A caption<\/figcaption><\/figure>/);
  assert.match(r.html, /<figure><img src="blob:images\/b\.png" alt=""><\/figure>/);
  assert.match(r.html, /missing-image/);
});

test('the whole fixture article renders: headings, lists, table, quote, references', () => {
  const md = Article2MD.build(tweet, { quoted }).markdown;
  const r = render(md);
  assert.match(r.html, /<h1[^>]*>Why attention works<\/h1>/);
  assert.match(r.html, /<h2[^>]*>Key ideas<\/h2>/);
  assert.match(r.html, /<table>/);
  assert.match(r.html, /<blockquote>/);
  assert.match(r.html, /<h1[^>]*>References<\/h1>/);
  assert.match(r.html, /<ol>/);
  assert.equal(r.mathErrors, 0);
  assert.ok(r.math >= 4);
  assert.ok(!/title: /.test(r.html), 'front matter is not printed');
});
