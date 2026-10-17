/* Runs inside the page. Finds the article and returns { meta, body, images }. */
window.__articleToPdf = function () {
  const meta = (name) => {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? (el.getAttribute('content') || '').trim() : '';
  };
  const host = location.hostname.replace(/^www\./, '');
  let title = '', byline = '', root = null;

  // X / Twitter long-form articles are a single-page app, not a normal document.
  // These selectors are from memory and have not been checked against the live site.
  if (host === 'x.com' || host === 'twitter.com') {
    const body = document.querySelector('[data-testid="twitterArticleRichTextView"]');
    const head = document.querySelector('[data-testid="twitter-article-title"]');
    if (body) {
      root = body; title = head ? head.textContent.trim() : '';
      const who = document.querySelector('[data-testid="User-Name"]');
      byline = who ? who.textContent.replace(/@.*$/, '').trim() : '';
    }
  }

  if (!root) {
    const art = new Readability(document.cloneNode(true)).parse();
    if (art && art.content) {
      const doc = new DOMParser().parseFromString(art.content, 'text/html');
      root = doc.body; title = art.title || ''; byline = art.byline || '';
    }
  }
  if (!root) { // last resort
    root = document.querySelector('article') || document.querySelector('main');
    if (!root) throw new Error('No article found on this page.');
  }

  // The page's own headline beats <title>, which usually carries " | Site name".
  // (Readability rewrites h1 as h2 in its output, so read it from the live page.)
  const h1 = document.querySelector('article h1, main h1, h1');
  if (h1 && h1.textContent.trim()) title = h1.textContent.trim().replace(/\s+/g, ' ');
  title = title || meta('og:title') || document.title;
  const { body, images } = TeX.domToTex(root, { title, byline });
  if (body.length < 200) throw new Error('Found very little text on this page. Is it an article?');

  return {
    meta: {
      title,
      author: byline.replace(/^by\s+/i, '') || meta('author') || meta('article:author'),
      date: (meta('article:published_time') || meta('date') || meta('og:updated_time')).slice(0, 10),
      site: meta('og:site_name') || host,
      url: location.href,
    },
    body,
    images,
  };
};
