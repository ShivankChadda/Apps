/*!
 * render — article Markdown -> print-ready HTML (math typeset with KaTeX), used for the one-click PDF.
 *
 *   XRender.toHtml(markdown, { marked, katex, imageUrl: file => url, mathRanges })
 *     -> { html, math, mathErrors }
 *
 * Pure string work (no DOM), so it runs in Node tests and in the extension page. The result is meant
 * for an element styled by extension/print.css; Chrome turns that into the PDF.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.XRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const MAX_MATH = 6000; // characters; anything longer is shown as plain text

  function stripFrontMatter(md) {
    const m = /^---\n[\s\S]*?\n---\n+/.exec(md);
    return m ? md.slice(m[0].length) : md;
  }

  function safeUrl(u) {
    return /^(https?:|mailto:|#)/i.test(String(u || '').trim()) ? String(u).trim() : '';
  }

  function toHtml(markdown, deps) {
    const { marked, katex, mathRanges } = deps;
    const imageUrl = deps.imageUrl || (f => f);
    const stats = { math: 0, mathErrors: 0 };

    function typeset(tex, display) {
      stats.math++;
      if (tex.length > MAX_MATH) { stats.mathErrors++; return '<code class="math-fallback">' + esc(tex) + '</code>'; }
      try {
        return katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore', trust: false, output: 'html' });
      } catch (e) {
        stats.mathErrors++; // keep the author's source visible rather than dropping the formula
        return '<code class="math-fallback">' + esc((display ? '$$' : '$') + tex + (display ? '$$' : '$')) + '</code>';
      }
    }

    const mathBlock = {
      name: 'mathBlock', level: 'block',
      start(src) { const m = /(^|\n)(?= {0,3}(?:\$\$|\\\[))/.exec(src); return m ? m.index + m[1].length : undefined; },
      tokenizer(src) {
        let m = /^ {0,3}\$\$((?:(?!\$\$)[\s\S])*?)\$\$[ \t]*(?:\n+|$)/.exec(src);
        if (!m) m = /^ {0,3}\\\[((?:(?!\\\])[\s\S])*?)\\\][ \t]*(?:\n+|$)/.exec(src);
        if (m && m[1].trim()) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
        return undefined;
      },
      renderer(t) { return '<div class="math-display">' + typeset(t.text, true) + '</div>\n'; }
    };

    const mathInline = {
      name: 'mathInline', level: 'inline',
      // not a "$" that is escaped with a backslash
      start(src) { const m = /(?<!\\)\$|\\[(\[]/.exec(src); return m ? m.index : undefined; },
      tokenizer(src) {
        const first = mathRanges(src)[0];
        if (!first || first[0] !== 0) return undefined;
        const raw = src.slice(first[0], first[1]);
        let display = false; let text;
        if (raw.startsWith('$$')) { display = true; text = raw.slice(2, -2); }
        else if (raw.startsWith('\\[')) { display = true; text = raw.slice(2, -2); }
        else if (raw.startsWith('\\(')) text = raw.slice(2, -2);
        else text = raw.slice(1, -1);
        if (!text.trim()) return undefined;
        return { type: 'mathInline', raw, text: text.trim(), display };
      },
      renderer(t) { return typeset(t.text, t.display); }
    };

    const renderer = {
      // raw HTML in the article is shown as text, never interpreted
      html(token) { return esc(token.text || token.raw || ''); },
      link(token) {
        const href = safeUrl(token.href);
        const inner = this.parser.parseInline(token.tokens);
        return href ? '<a href="' + esc(href) + '">' + inner + '</a>' : inner;
      },
      image(token) {
        const src = imageUrl(token.href);
        if (!src) return '<span class="missing-image">[' + esc(token.text || 'picture unavailable') + ']</span>';
        return '<img src="' + esc(src) + '" alt="' + esc(token.text || '') + '">';
      },
      paragraph(token) {
        const inner = this.parser.parseInline(token.tokens);
        // a paragraph that is only a picture becomes a figure (with its alt text as caption)
        const m = /^<img src="([^"]*)" alt="([^"]*)">$/.exec(inner.trim());
        if (m) return '<figure><img src="' + m[1] + '" alt="' + m[2] + '">' + (m[2] ? '<figcaption>' + m[2] + '</figcaption>' : '') + '</figure>\n';
        return '<p>' + inner + '</p>\n';
      }
    };

    const md = new marked.Marked({ gfm: true, breaks: false, extensions: [mathBlock, mathInline], renderer });
    const html = md.parse(stripFrontMatter(markdown));
    return { html, math: stats.math, mathErrors: stats.mathErrors };
  }

  return { toHtml, esc };
});
