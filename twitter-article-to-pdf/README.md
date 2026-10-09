# X Article → LaTeX PDF

Turn an **X (Twitter) Article** into a clean **LaTeX document and PDF** for reading: title block, headings, lists, quotes, code, **pictures**, **math**, embedded posts, and **links as numbered references** at the end (so the sources survive on paper).

It reuses the converter in [`../markdown-to-latex`](../markdown-to-latex/): the article is turned into Markdown, then into LaTeX. Two front ends share the same code:

| | What you do | Output |
|---|---|---|
| **Script** (`bin/x2pdf.js`) | `node bin/x2pdf.js https://x.com/<user>/status/<id>` | folder with `.tex`, `.md`, `images/` and the PDF |
| **Chrome extension** (`extension/`) | click the toolbar button on an article | `.zip` project (Overleaf-ready), `.tex`, and a PDF when the helper runs |

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
- **Not verified against a live article.** I could not find a public article to test with. The data format was taken from FxEmbed's published schema, and the tests use a synthetic article that covers every block and entity type we handle. Unknown block or entity types are skipped with a note in the result, not a crash. If a real article renders wrong, save its JSON (`https://api.fxtwitter.com/<user>/status/<id>`) and use it as a new test fixture.
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

1. Open `chrome://extensions`, switch on **Developer mode**, **Load unpacked**, choose the `extension/` folder. (It has no build step; `extension/lib` is committed.)
2. Open an article on x.com and click the extension's toolbar button. A page opens with the link filled in and converts it.
3. **Download project (.zip)** works with nothing else installed: upload it to [Overleaf](https://www.overleaf.com) (compiler: XeLaTeX), or compile it yourself.
4. **Create PDF** builds the PDF on your own computer through the converter's helper. Start it once with this extension's id, which is fixed:

```sh
cd ../markdown-to-latex
python3 serve.py --allow-extension iinfmgkelaedmeofmcmemognfhifaidn
```

The helper only listens on `127.0.0.1`, and accepts this extension only when it is started with `--allow-extension`; websites and other extensions are refused.

## Development

```sh
npm test                    # converter + CLI tests, and checks extension/lib is in sync
npm run build               # copy shared sources into extension/lib (run after editing src/ or ../markdown-to-latex/src)
npm run test:extension      # real Chromium + real helper (needs Playwright; PDF step needs a TeX engine)
```

```
src/article2md.js   article JSON  -> Markdown (blocks, styles, math, links, media)
src/pipeline.js     link -> fetch -> Markdown -> LaTeX project (shared by script and extension)
bin/x2pdf.js        command line
extension/          Chrome (Manifest V3) extension
tests/              unit, CLI and browser tests; fixtures/article.js is the synthetic article
```
