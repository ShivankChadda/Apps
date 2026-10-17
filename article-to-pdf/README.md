# Article to PDF (LaTeX) — Chrome extension

Click the toolbar button on an article and get a typeset PDF in your Downloads folder: title block, headings, lists, quotes, tables, links and the article's pictures, with menus, ads and footers left out.

## Set up (once)

Open `chrome://extensions`, switch on **Developer mode**, click **Load unpacked** and pick this `article-to-pdf` folder (the one that contains `manifest.json`). That is all.

## Use

Open an article, click the extension's button, then **Save article as PDF**. (Right-click on the page → *Save article as PDF* does the same.) The PDF goes to your Downloads folder.

## Two ways the PDF is made

| | Built-in (default) | Real LaTeX (optional) |
|---|---|---|
| Needs | nothing | LaTeX installed ([MacTeX](https://www.tug.org/mactex/), [MiKTeX](https://miktex.org/download), or TeX Live) and `python3 helper/helper.py` running |
| Look | laid out like a LaTeX article: Latin Modern font, justified text, same title block, pictures, links, page numbers. It is **not typeset by TeX**, so line breaks can differ slightly and there is no hyphenation | true LaTeX output |

The extension checks for the helper on every click and uses real LaTeX when it is there, the built-in layout when it is not.

## What to know

- **Permissions:** the extension asks for access to all websites, because it has to read whichever page you click it on and download that page's pictures. It sends nothing anywhere except, if running, to the helper on `127.0.0.1`.
- **Safety of the optional helper:** it listens only on your computer and only answers browser extensions (a web page's own requests are refused). `pdflatex` runs with shell escape off and cannot read files outside its job folder.
- **Limits:** pictures are converted to JPEG (SVG pictures are skipped, and so are tiny icons); at most 25 per article. Letters outside Latin scripts (Greek, Chinese, emoji) are dropped in both modes. Maths on the page is kept as plain text, and superscripts and subscripts are shown smaller but not raised in the built-in layout.
- **X (Twitter) articles:** there is code for them, but its page selectors were written from memory and have **not** been tested against the live site. If one comes out empty or messy, tell me and send the page's HTML.
- **Not tested:** the popup button and the right-click item in a real, visible Chrome window. The test below drives the same code path through the extension's service worker.

## Test

`python3 tests/e2e.py` loads the extension in Chromium and runs it on a local sample article (`tests/fixture/`) twice, once without the helper (built-in layout) and once with it (real LaTeX). Each PDF is checked for its text, the picture, and that the menus and footer are not in it. Needs `pip install playwright`, Chromium, `pdflatex` and `pdftotext`/`pdfimages`/`pdffonts` (poppler).

## Credits

[Mozilla Readability](https://github.com/mozilla/readability) (Apache-2.0) finds the article; [pdfmake](http://pdfmake.org) (MIT) writes the built-in PDF; the Latin Modern fonts are under the [GUST Font License](vendor/fonts/GUST-FONT-LICENSE.TXT).
