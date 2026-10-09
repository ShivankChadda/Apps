# X Article → LaTeX PDF

Turn an **X (Twitter) Article** into a clean **LaTeX document and PDF** for reading: title block, headings, lists, quotes, code, **pictures**, **math**, embedded posts, and **links as numbered references** at the end (so the sources survive on paper).

It reuses the converter in [`../markdown-to-latex`](../markdown-to-latex/): the article is turned into Markdown, then into LaTeX. Two front ends share the same code:

| | What you do | Output |
|---|---|---|
| **Script** (`bin/x2pdf.js`) | `node bin/x2pdf.js https://x.com/<user>/status/<id>` | folder with `.tex`, `.md`, `images/` and the PDF |
| **Chrome extension** (`extension/`) | click the toolbar button on an article | **a PDF, made inside Chrome with nothing else installed**; also the LaTeX project (`.zip`, `.tex`) |

## What is kept

| In the article | In the PDF |
|---|---|
| Title, author, date, link back to the post | title block + abstract |
| Headings, bold, italic, strikethrough, inline code | the same; heading levels are normalised so the top level is a section |
| Bulleted / numbered / nested lists, block quotes, dividers | lists, quotes, rules |
| Code blocks | listings (`$…$` inside code is left alone) |
| **Pictures** (cover and inline) | figures, full resolution; GIF/WebP are re-encoded as PNG |
| **Math**: `$x^2$`, `$$…$$`, `\( … \)`, `\[ … \]` typed in the text, and LaTeX / Markdown blocks | real LaTeX math |
| **Links** | clickable, plus `[1]`, `[2]` … and a *References* list (`--citations inline` turns the list off) |
| Embedded posts | quoted blocks with author, date and link |
| Videos and GIFs | poster picture + a link to the video |

### Limits you should know about

- **Equations that the author pasted as pictures stay pictures.** Nothing reads them back into LaTeX. X has no documented equation editor; only math *typed as text* (or delivered as a LaTeX/Markdown block) becomes real LaTeX math. Currency such as "$5 and $10" is not mistaken for math.
- **Public articles only.** The post is read through the free [FxTwitter](https://github.com/FxEmbed/FxEmbed) API (`api.fxtwitter.com`), so **the article's link is sent to that third-party service** and nothing private (protected accounts, login-only content) is reachable. Pictures come from `pbs.twimg.com`.
- **Tested on one real article** (17 pictures, lists, quotes, bold/italic; no equations or code) plus a synthetic one covering every block and entity type handled, including math, code, tables and embedded posts. Typed-math handling in real articles is untested. If an article renders wrong, save its JSON (`https://api.fxtwitter.com/<user>/status/<id>`) and use it as a new test fixture.
- Link the **post** (`…/status/<id>`), not `x.com/i/article/<id>`: the latter does not say which post it belongs to.

## Script

Needs Node 18+, and for the PDF a LaTeX engine (see the [converter README](../markdown-to-latex/README.md#2-get-real-pdfs-on-your-computer-recommended)). ImageMagick (`convert`) is only needed for GIF/WebP pictures.

```sh
node bin/x2pdf.js https://x.com/<user>/status/<id>            # -> ./<article title>/ with .tex .md images/ .pdf
node bin/x2pdf.js <link> -o out --font palatino --paper letter --toc
node bin/x2pdf.js <link> --no-pdf                              # skip LaTeX, just write the project
node bin/x2pdf.js --json saved.json                            # use a saved FxTwitter response
```

Run `node bin/x2pdf.js --help` for every option.

## Chrome extension

1. Open `chrome://extensions`, switch on **Developer mode**, **Load unpacked**, choose the `extension/` folder (the one that contains `manifest.json`). It has no build step.
2. Open an article on x.com and click the extension's toolbar button. A tab opens with the link filled in, converts the article and **downloads the PDF by itself**; a preview and a *Download PDF* button stay on the page. You can also paste a link there.
3. While the PDF is made, Chrome shows a banner saying the extension is *debugging this browser*. That is how the extension asks Chrome to print its own page to PDF (`debugger` permission); the banner disappears a second later. If it ever fails (for example because DevTools is open on that tab), a *Print…* button appears: choose **Save as PDF**.

The PDF is typeset by Chrome, not by TeX: Latin Modern fonts (the LaTeX look), math with KaTeX, figures with captions, numbered link references, A4 or Letter, optional grayscale. Nothing needs installing, and it works offline once the article and pictures are downloaded.

### Optional: a PDF from a real TeX engine

Under *LaTeX source and real-LaTeX PDF* on the same page:

- **Download project (.zip)** / **Download .tex**: the LaTeX source with pictures, ready for [Overleaf](https://www.overleaf.com) (compiler: XeLaTeX) or your own TeX.
- **Create PDF with LaTeX** builds it on your computer through the converter's helper. Install LaTeX, then start the helper once with this extension's fixed id:

```sh
cd ../markdown-to-latex
python3 serve.py --allow-extension iinfmgkelaedmeofmcmemognfhifaidn      # Windows: py serve.py ...
```

The helper only listens on `127.0.0.1` and accepts this extension only when started with `--allow-extension`; websites and other extensions are refused.

## Development

```sh
npm test                    # converter, renderer and CLI tests, and checks extension/lib is in sync
npm run build               # copy shared sources into extension/lib (run after editing src/ or ../markdown-to-latex/src)
npm run test:extension      # real Chromium + real helper (needs Playwright; PDF step needs a TeX engine)
```

```
src/article2md.js   article JSON  -> Markdown (blocks, styles, math, links, media)
src/render.js       Markdown -> print HTML with KaTeX math (the extension's PDF)
src/pipeline.js     link -> fetch -> Markdown -> LaTeX project (shared by script and extension)
bin/x2pdf.js        command line
extension/          Chrome (Manifest V3) extension; vendor/katex and fonts/ are third-party files (MIT / GUST licences included)
tests/              unit, CLI and browser tests; fixtures/article.js is the synthetic article
```
