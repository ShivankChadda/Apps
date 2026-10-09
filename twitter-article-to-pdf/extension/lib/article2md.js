/*!
 * article2md — turn an X (Twitter) Article into Markdown that markdown-to-latex understands.
 *
 * Works in the browser (window.Article2MD) and in Node (require). Pure and synchronous: it never
 * touches the network. The caller fetches the post JSON (FxTwitter format, see README), the
 * pictures and any quoted posts, and passes them in.
 *
 *   Article2MD.build(tweet, { quoted: { '<id>': tweet }, citations: 'references' })
 *     -> { markdown, images: [{ file, url, alt }], title, warnings, stats }
 *
 * The article body is Draft.js "content_state": blocks (paragraphs, headings, lists, code ...) with
 * inline style ranges and entity ranges, plus an entity map (links, pictures, embedded posts,
 * Markdown / LaTeX snippets). Offsets are UTF-16 code units, exactly like JavaScript strings.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Article2MD = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HEADINGS = { 'header-one': 1, 'header-two': 2, 'header-three': 3, 'header-four': 4, 'header-five': 5, 'header-six': 6 };

  // ------------------------------------------------------------------ small helpers
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  function statusIdFromUrl(url) {
    const m = /(?:x|twitter)\.com\/(?:([A-Za-z0-9_]{1,30})|i)\/(?:web\/)?status(?:es)?\/(\d+)/i.exec(String(url || ''));
    return m ? { handle: m[1] && m[1] !== 'i' ? m[1] : null, id: m[2] } : null;
  }

  /** Normalise the many shapes entityMap can take (array of {key,value}, or an object keyed by number). */
  function entityLookup(entityMap) {
    const map = new Map();
    if (Array.isArray(entityMap)) {
      entityMap.forEach((e, i) => {
        if (isObj(e) && 'value' in e) map.set(String(e.key != null ? e.key : i), e.value);
        else map.set(String(i), e);
      });
    } else if (isObj(entityMap)) {
      Object.keys(entityMap).forEach(k => map.set(String(k), entityMap[k] && entityMap[k].value ? entityMap[k].value : entityMap[k]));
    }
    return map;
  }

  /** Pull a usable text field out of an entity's data, whatever X called it. */
  function entityText(data) {
    if (!isObj(data)) return '';
    for (const k of ['markdown', 'latex', 'text', 'content', 'code', 'tex']) {
      if (typeof data[k] === 'string' && data[k].trim()) return data[k];
    }
    return '';
  }

  /** Math the author typed: $..$, $$..$$, \(..\), \[..\]. Returns sorted [start, end) ranges. Pandoc's rules for `$`. */
  function mathRanges(text) {
    const ranges = [];
    const n = text.length;
    let i = 0;
    while (i < n) {
      const c = text[i];
      if (c === '\\' && (text[i + 1] === '(' || text[i + 1] === '[')) {
        const close = text[i + 1] === '(' ? '\\)' : '\\]';
        const j = text.indexOf(close, i + 2);
        if (j > i + 2) { ranges.push([i, j + 2]); i = j + 2; continue; }
      }
      if (c === '\\') { i += 2; continue; }
      if (c === '$') {
        if (text[i + 1] === '$') {
          const j = text.indexOf('$$', i + 2);
          if (j > i + 2) { ranges.push([i, j + 2]); i = j + 2; continue; }
          i += 2; continue;
        }
        const next = text[i + 1];
        if (next && !/\s/.test(next)) {
          let j = i + 1;
          while (j < n) {
            if (text[j] === '\\') { j += 2; continue; }
            if (text[j] === '$' && !/\s/.test(text[j - 1]) && !/[0-9]/.test(text[j + 1] || '')) break;
            if (text[j] === '\n') { j = -1; break; }
            j++;
          }
          if (j > i + 1 && j < n) { ranges.push([i, j + 1]); i = j + 1; continue; }
        }
      }
      i++;
    }
    return ranges;
  }

  /** Escape characters Markdown would otherwise act on. */
  function escapeMd(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/([*_`\[\]<>~|$])/g, '\\$1')
      .replace(/&(?=[#A-Za-z0-9]+;)/g, '\\&');
  }

  /** A line that would start a Markdown block gets a backslash so it stays a plain paragraph. */
  function protectLineStart(s) {
    return s.replace(/^(\s*)(#{1,6}(?=\s|$)|[-+](?=\s)|\d+[.)](?=\s)|>|={3,}$|-{3,}$)/, (m, sp, tok) => sp + (/^\d/.test(tok) ? tok.replace(/([.)])$/, '\\$1') : '\\' + tok));
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
  }

  function isoDate(s) {
    const d = new Date(s);
    if (isNaN(d)) return '';
    return d.toISOString().slice(0, 10);
  }

  function yamlString(s) {
    return JSON.stringify(String(s == null ? '' : s).replace(/\s+/g, ' ').trim());
  }

  function extOf(url) {
    const m = /\.([A-Za-z0-9]{2,5})(?:[?#]|$)/.exec(String(url));
    const fm = /[?&]format=([A-Za-z0-9]+)/.exec(String(url));
    return ((fm && fm[1]) || (m && m[1]) || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  }

  // ------------------------------------------------------------------ media
  function indexMedia(article) {
    const byId = new Map();
    const add = m => {
      if (!isObj(m)) return;
      [m.media_id, m.id, m.media_key].forEach(k => { if (k != null) byId.set(String(k), m); });
      const info = m.media_info;
      if (isObj(info) && info.id_str) byId.set(String(info.id_str), m);
    };
    (article.media_entities || []).forEach(add);
    add(article.cover_media);
    return byId;
  }

  /** What to draw for one media entity: a picture URL (images, and posters of videos/GIFs) plus a link for videos. */
  function describeMedia(m) {
    const info = isObj(m) && isObj(m.media_info) ? m.media_info : (m || {});
    const out = { image: null, video: null, alt: '' };
    out.alt = info.alt_text || info.ext_alt_text || info.alt || '';
    out.image = info.original_img_url || info.preview_image && (info.preview_image.original_img_url || info.preview_image.url) ||
      info.media_url_https || info.media_url || info.url || null;
    if (info.__typename === 'ApiVideo' || info.__typename === 'ApiGif' || info.video_info) {
      const variants = (info.video_info && info.video_info.variants || []).filter(v => /mp4/.test(v.content_type || '') && v.url);
      variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      out.video = variants.length ? variants[0].url : null;
      out.isGif = info.__typename === 'ApiGif' || info.type === 'animated_gif';
    }
    return out;
  }

  // ------------------------------------------------------------------ inline rendering
  /**
   * Render one block's text with inline styles, links and typed math.
   * `refs` collects link targets for the numbered reference list.
   */
  function renderInline(block, entities, ctx) {
    const text = block.text || '';
    if (!text) return '';
    const n = text.length;
    const bold = new Uint8Array(n), ital = new Uint8Array(n), strike = new Uint8Array(n), code = new Uint8Array(n);
    const linkAt = new Array(n).fill(null);
    const mathAt = new Uint8Array(n);

    (block.inlineStyleRanges || []).forEach(r => {
      const style = String(r.style || '').toLowerCase();
      const arr = style === 'bold' ? bold : style === 'italic' ? ital : style.startsWith('strike') ? strike : style === 'code' ? code : null;
      if (!arr) return;
      for (let i = r.offset; i < Math.min(n, r.offset + r.length); i++) arr[i] = 1;
    });
    (block.entityRanges || []).forEach(r => {
      const ent = entities.get(String(r.key));
      if (!ent) return;
      const type = String(ent.type || '').toUpperCase();
      if (type === 'LINK') {
        const data = ent.data || {};
        const url = data.url || data.href || '';
        if (url) for (let i = r.offset; i < Math.min(n, r.offset + r.length); i++) linkAt[i] = { url };
      }
    });
    mathRanges(text).forEach(([s, e]) => { for (let i = s; i < e; i++) mathAt[i] = 1; });

    // Cut the text wherever the formatting changes.
    const sig = i => [bold[i], ital[i], strike[i], code[i], mathAt[i], linkAt[i] ? linkAt[i].url : ''].join('|');
    const runs = [];
    let start = 0;
    for (let i = 1; i <= n; i++) {
      if (i === n || sig(i) !== sig(start)) { runs.push([start, i]); start = i; }
    }

    // Math must stay in one piece even when something (e.g. a link) cuts through it.
    let out = '';
    let lastLink = null; let linkBuf = '';
    const flushLink = () => {
      if (lastLink == null) return;
      const label = linkBuf.trim() ? linkBuf : escapeMd(lastLink);
      out += '[' + label + '](' + lastLink.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20') + ')' + ctx.cite(lastLink, linkBuf);
      lastLink = null; linkBuf = '';
    };
    const emit = (piece, link) => {
      if (link) {
        if (lastLink !== null && lastLink !== link.url) flushLink();
        lastLink = link.url; linkBuf += piece;
      } else {
        flushLink();
        out += piece;
      }
    };

    runs.forEach(([s, e]) => {
      const raw = text.slice(s, e);
      let piece;
      if (mathAt[s]) {
        piece = raw; // typed LaTeX is passed through untouched
      } else if (code[s]) {
        piece = '`' + raw.replace(/`/g, "'") + '`';
      } else {
        // keep the spaces outside the markers, otherwise Markdown refuses to bold " word "
        const lead = /^\s*/.exec(raw)[0], trail = /\s*$/.exec(raw.slice(lead.length))[0];
        let core = raw.slice(lead.length, raw.length - trail.length);
        if (core) {
          core = escapeMd(core);
          if (strike[s]) core = '~~' + core + '~~';
          if (bold[s] && ital[s]) core = '***' + core + '***';
          else if (bold[s]) core = '**' + core + '**';
          else if (ital[s]) core = '*' + core + '*';
        }
        piece = lead + core + trail;
      }
      emit(piece, linkAt[s]);
    });
    flushLink();
    return out.replace(/[ \t]*\n/g, '  \n'); // soft line breaks inside a block become hard breaks
  }

  // ------------------------------------------------------------------ main
  function build(tweet, options) {
    const opts = Object.assign({ quoted: {}, citations: 'references', includeCover: true }, options || {});
    const warnings = [];
    const stats = { blocks: 0, images: 0, links: 0, embeddedPosts: 0, math: 0, codeBlocks: 0 };
    const article = tweet && tweet.article;
    if (!isObj(article) || !isObj(article.content)) {
      throw new Error('This post is not an X Article (no article body was found).');
    }
    const blocks = article.content.blocks || [];
    const entities = entityLookup(article.content.entityMap);
    const media = indexMedia(article);

    // pictures -------------------------------------------------------
    const images = [];
    const imageByUrl = new Map();
    function addImage(url, alt) {
      if (!url) return null;
      let rec = imageByUrl.get(url);
      if (!rec) {
        const file = 'images/fig-' + String(images.length + 1).padStart(3, '0') + '.' + extOf(url);
        rec = { file, url, alt: alt || '' };
        images.push(rec); imageByUrl.set(url, rec);
      }
      return rec;
    }
    const cleanAlt = a => String(a || '').replace(/[\[\]\r\n]+/g, ' ').trim();

    // links ---------------------------------------------------------
    const refs = []; const refIndex = new Map();
    const ctx = {
      cite(url, label) {
        stats.links++;
        if (opts.citations !== 'references') return '';
        if (/^(mailto:|#)/i.test(url)) return '';
        let i = refIndex.get(url);
        if (!i) { refs.push({ url, label: String(label || '').trim() }); i = refs.length; refIndex.set(url, i); }
        return '[' + i + ']'; // plain brackets: \\[ .. \\] would be read as display math
      }
    };

    function figure(m, caption) {
      const d = describeMedia(m);
      const lines = [];
      if (d.image) {
        const rec = addImage(d.image, d.alt);
        stats.images++;
        lines.push('![' + cleanAlt(caption || d.alt) + '](' + rec.file + ')');
      }
      if (d.video) {
        const label = d.isGif ? 'Animated GIF' : 'Video';
        lines.push('*' + label + ' (not playable on paper):* [' + hostOf(d.video) + '](' + d.video.replace(/\(/g, '%28').replace(/\)/g, '%29') + ')');
      }
      if (!lines.length) warnings.push('A picture or video in the article could not be found and was left out.');
      return lines.join('\n\n');
    }

    function embeddedPost(id) {
      const t = opts.quoted && opts.quoted[id];
      stats.embeddedPosts++;
      const url = t && t.url ? t.url : 'https://x.com/i/status/' + id;
      if (!t) {
        warnings.push('An embedded post (' + id + ') could not be loaded; only its link is kept.');
        return '> *Embedded post:* [' + url + '](' + url + ')';
      }
      const who = t.author ? '**' + escapeMd(t.author.name || t.author.screen_name || '') + '** (@' + escapeMd(t.author.screen_name || '') + ')' : '**Embedded post**';
      const body = String(t.text || (t.raw_text && t.raw_text.text) || '').split(/\n+/).map(l => '> ' + escapeMd(l).replace(/^>\s*/, '')).join('\n>\n');
      return '> ' + who + (t.created_at ? ' · ' + isoDate(t.created_at) : '') + '\n>\n' + body + '\n>\n> [' + url + '](' + url + ')';
    }

    function atomic(block) {
      const out = [];
      const ranges = block.entityRanges || [];
      ranges.forEach(r => {
        const ent = entities.get(String(r.key));
        if (!ent) return;
        const type = String(ent.type || '').toUpperCase();
        const data = ent.data || {};
        if (type === 'MEDIA') {
          (data.mediaItems || []).forEach(mi => {
            const m = media.get(String(mi.mediaId)) || media.get(String(mi.localMediaId));
            out.push(m ? figure(m, mi.caption || data.caption) : (warnings.push('A picture could not be found in the article data and was left out.'), ''));
          });
        } else if (type === 'TWEET') {
          out.push(embeddedPost(String(data.tweetId)));
        } else if (type === 'DIVIDER') {
          out.push('---');
        } else if (type === 'LATEX' || type === 'MATH' || type === 'EQUATION') {
          const tex = entityText(data).trim().replace(/^\$\$?|\$\$?$/g, '').trim();
          stats.math++;
          out.push('$$\n' + tex + '\n$$');
        } else if (type === 'MARKDOWN' || type === 'CODE') {
          const md = entityText(data);
          if (/^\s*```/.test(md)) stats.codeBlocks++;
          if (/\$\$/.test(md)) stats.math++;
          out.push(md.trim());
        } else if (type === 'LINK') {
          // a link on its own line
          const url = data.url || data.href;
          if (url) out.push('[' + escapeMd(url) + '](' + url + ')' + ctx.cite(url, url));
        } else {
          warnings.push('Unsupported element "' + type + '" was skipped.');
        }
      });
      if (!ranges.length && block.text && block.text.trim()) out.push(escapeMd(block.text.trim()));
      return out.filter(Boolean).join('\n\n');
    }

    // body ----------------------------------------------------------
    const pieces = []; // { kind, text }
    const orderedCount = []; // per depth
    let codeLines = null;
    const flushCode = () => {
      if (!codeLines) return;
      const body = codeLines.join('\n');
      const fence = /```/.test(body) ? '~~~~' : '```';
      pieces.push({ kind: 'block', text: fence + '\n' + body + '\n' + fence });
      stats.codeBlocks++;
      codeLines = null;
    };

    if (opts.includeCover && article.cover_media) {
      const d = describeMedia(article.cover_media);
      if (d.image) { pieces.push({ kind: 'block', text: figure(article.cover_media, '') }); }
    }

    blocks.forEach(block => {
      stats.blocks++;
      const type = block.type || 'unstyled';
      if (type !== 'code-block') flushCode();
      if (type !== 'ordered-list-item') orderedCount.length = 0;

      if (type === 'code-block') {
        if (!codeLines) codeLines = [];
        codeLines.push(block.text || '');
        return;
      }
      if (type === 'atomic') {
        const t = atomic(block);
        if (t) pieces.push({ kind: 'block', text: t });
        return;
      }
      const inline = renderInline(block, entities, ctx);
      if (!inline.trim()) return; // blank paragraphs are just spacing in the editor
      if (HEADINGS[type]) {
        pieces.push({ kind: 'block', heading: HEADINGS[type], text: inline.replace(/\s*\n\s*/g, ' ').replace(/^\*\*(.*)\*\*$/, '$1') });
      } else if (type === 'unordered-list-item') {
        const depth = Math.min(block.depth || 0, 5);
        pieces.push({ kind: 'item', list: 'ul', text: '    '.repeat(depth) + '- ' + inline.replace(/\n/g, '\n' + '    '.repeat(depth + 1)) });
      } else if (type === 'ordered-list-item') {
        const depth = Math.min(block.depth || 0, 5);
        orderedCount.length = depth + 1;
        orderedCount[depth] = (orderedCount[depth] || 0) + 1;
        pieces.push({ kind: 'item', list: 'ol', text: '    '.repeat(depth) + orderedCount[depth] + '. ' + inline.replace(/\n/g, '\n' + '    '.repeat(depth + 1)) });
      } else if (type === 'blockquote') {
        pieces.push({ kind: 'quote', text: '> ' + inline.replace(/\n/g, '\n> ') });
      } else {
        if (type !== 'unstyled' && type !== 'paragraph') warnings.push('Unknown block type "' + type + '" was treated as a paragraph.');
        pieces.push({ kind: 'block', text: protectLineStart(inline) });
      }
    });
    flushCode();

    // The shallowest heading becomes "#" (a top-level section) whichever level the author used,
    // so a reference list or a later heading never lands one level too deep.
    const depths = pieces.filter(p => p.heading).map(p => p.heading);
    const top = depths.length ? Math.min.apply(null, depths) : 1;
    pieces.forEach(p => { if (p.heading) p.text = '#'.repeat(Math.min(6, p.heading - top + 1)) + ' ' + p.text; });

    // Consecutive list items / quote lines stay together; everything else is separated by a blank line.
    let body = '';
    pieces.forEach((p, i) => {
      const prev = pieces[i - 1];
      if (i === 0) body = p.text;
      else if (p.kind === 'item' && prev.kind === 'item' && p.list === prev.list) body += '\n' + p.text;
      else if (p.kind === 'quote' && prev.kind === 'quote') body += '\n>\n' + p.text;
      else body += '\n\n' + p.text;
    });

    if (refs.length) {
      body += '\n\n# References\n\n' + refs.map((r, i) => {
        const label = r.label && r.label !== r.url && r.label.length < 90 ? escapeMd(r.label) + ' — ' : '';
        return (i + 1) + '. ' + label + '<' + r.url + '>';
      }).join('\n');
    }

    // front matter ---------------------------------------------------
    const author = tweet.author || {};
    const authorName = author.name ? author.name + (author.screen_name ? ' (@' + author.screen_name + ')' : '') : (author.screen_name ? '@' + author.screen_name : '');
    const date = isoDate(article.created_at || tweet.created_at || tweet.created_timestamp * 1000);
    const source = tweet.url || (author.screen_name && tweet.id ? 'https://x.com/' + author.screen_name + '/status/' + tweet.id : '');
    const title = (article.title || '').trim() || 'X Article';
    const abstract = [article.preview_text && article.preview_text.trim(), source ? 'Source: ' + source : ''].filter(Boolean).join('\n\n');
    const front = ['---', 'title: ' + yamlString(title), authorName ? 'author: ' + yamlString(authorName) : null,
      date ? 'date: ' + date : null,
      abstract ? 'abstract: |\n' + abstract.split('\n').map(l => '  ' + l).join('\n') : null, '---'].filter(Boolean).join('\n');

    return { markdown: front + '\n\n' + body + '\n', images, title, author: authorName, date, source, warnings, stats };
  }

  /** Ids of embedded posts, so the caller can fetch them before calling build(). */
  function embeddedPostIds(tweet) {
    const article = tweet && tweet.article;
    if (!article || !article.content) return [];
    const ids = [];
    entityLookup(article.content.entityMap).forEach(ent => {
      if (ent && String(ent.type).toUpperCase() === 'TWEET' && ent.data && ent.data.tweetId) ids.push(String(ent.data.tweetId));
    });
    return Array.from(new Set(ids));
  }

  return { build, embeddedPostIds, statusIdFromUrl, mathRanges, escapeMd };
});
