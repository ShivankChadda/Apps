/*!
 * pipeline — X Article URL -> LaTeX project (main.tex + pictures), shared by the CLI and the extension.
 *
 * Everything environment-specific is injected, so the same code runs in Node and in the browser:
 *
 *   const project = await Pipeline.buildProject(url, {
 *     MD2TeX, Article2MD,                 // the two converters
 *     fetchJson(url)  -> object           // GET + parse JSON
 *     fetchBytes(url) -> Uint8Array       // GET binary
 *     convertImage(bytes, info) -> Uint8Array   // re-encode GIF/WebP/odd PNGs as plain PNG (optional)
 *     texOptions: { ... }                 // forwarded to MD2TeX.convert
 *     onProgress(message)
 *   });
 *   -> { tex, files: { 'images/fig-001.jpg': Uint8Array }, markdown, title, warnings, stats }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.XPipeline = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const API = 'https://api.fxtwitter.com';

  async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
    });
    await Promise.all(workers);
    return out;
  }

  async function loadTweet(url, fetchJson, A2M) {
    const ref = A2M.statusIdFromUrl(url);
    if (!ref) {
      throw new Error('That does not look like a post link. Open the article on x.com and copy its address (it contains /status/<number>).');
    }
    const data = await fetchJson(API + '/' + (ref.handle || 'i') + '/status/' + ref.id);
    if (!data || !data.tweet) {
      throw new Error((data && data.message === 'NOT_FOUND' ? 'The post was not found (deleted, private, or the link is wrong).' : 'Could not load the post' + (data && data.message ? ' (' + data.message + ')' : '') + '.'));
    }
    return data.tweet;
  }

  async function buildProject(url, deps) {
    const { MD2TeX, Article2MD: A2M } = deps;
    const say = deps.onProgress || (() => {});
    const warnings = [];

    say('Loading the article…');
    const tweet = await loadTweet(url, deps.fetchJson, A2M);
    if (!tweet.article) {
      throw new Error('This post is a normal post, not an X Article. Open the full article page (the one with a title and a long body) and try again.');
    }

    const quoted = {};
    const ids = A2M.embeddedPostIds(tweet);
    if (ids.length) say('Loading ' + ids.length + ' embedded post' + (ids.length > 1 ? 's' : '') + '…');
    await mapLimit(ids, 4, async id => {
      try {
        const data = await deps.fetchJson(API + '/i/status/' + id);
        if (data && data.tweet) quoted[id] = data.tweet;
      } catch (e) { /* reported by Article2MD as "could not be loaded" */ }
    });

    say('Converting the text…');
    const md = A2M.build(tweet, { quoted, citations: (deps.citations || 'references') });
    md.warnings.forEach(w => warnings.push({ level: 'warn', message: w }));

    say('Downloading ' + md.images.length + ' picture' + (md.images.length === 1 ? '' : 's') + '…');
    const bytesByFile = new Map();
    await mapLimit(md.images, 4, async img => {
      try {
        const bytes = await deps.fetchBytes(img.url);
        if (!bytes || !bytes.length) throw new Error('empty');
        bytesByFile.set(img.file, bytes);
      } catch (e) {
        warnings.push({ level: 'warn', message: 'A picture could not be downloaded and was left out: ' + img.url });
      }
    });

    const resolveAsset = key => {
      const bytes = bytesByFile.get(key);
      if (!bytes) return null;
      const info = MD2TeX.sniffImage(bytes.subarray(0, 4096));
      const ext = info.format === 'unknown' ? (/\.([a-z0-9]+)$/i.exec(key) || [])[1] || 'jpg' : info.format;
      return { id: key, name: key.split('/').pop(), ext, convert: info.normalize && info.format !== 'pdf' };
    };

    say('Typesetting…');
    const result = MD2TeX.convert(md.markdown, Object.assign({
      documentClass: 'article', fileName: 'article.md', toc: false, pageBreaks: 'none'
    }, deps.texOptions || {}, { resolveAsset }));
    result.warnings.forEach(w => warnings.push({ level: w.level || 'warn', message: w.message }));

    const files = {};
    for (const a of result.assets) {
      let bytes = bytesByFile.get(a.id);
      if (!bytes) continue;
      try {
        if (a.convert) {
          if (!deps.convertImage) throw new Error('no image converter available');
          bytes = await deps.convertImage(bytes, a);
        }
        files[a.texPath] = bytes;
      } catch (e) {
        warnings.push({ level: 'warn', message: 'A picture (' + a.name + ') could not be converted for LaTeX and was left out.' });
      }
    }

    return { tex: result.tex, files, markdown: md.markdown, title: md.title, author: md.author, date: md.date,
      source: md.source, warnings, stats: Object.assign({}, md.stats, { words: result.stats && result.stats.words }) };
  }

  /** A safe base name for downloads: "my-article-title". */
  function fileStem(title) {
    const s = String(title || 'x-article').normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return s || 'x-article';
  }

  return { buildProject, loadTweet, fileStem, API };
});
