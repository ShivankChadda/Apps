# Article to PDF (LaTeX) — Chrome extension

Click the toolbar button on an article and get a typeset PDF in your Downloads folder: title block, headings, lists, quotes, tables, links and the article's pictures, with menus, ads and footers left out.

It has two parts, both on your own computer:

1. **The extension** reads the page you are looking at (in your own browser, so logins and bot checks are not a problem), finds the article with Mozilla's Readability, and writes it as LaTeX.
2. **The helper** (`helper/helper.py`) turns that LaTeX into a PDF with `pdflatex`. A browser extension cannot run LaTeX itself.

## Set up (once)

1. Install a LaTeX program: [MacTeX](https://www.tug.org/mactex/) (Mac), [MiKTeX](https://miktex.org/download) (Windows) or `sudo apt install texlive-latex-base texlive-latex-recommended texlive-fonts-recommended texlive-latex-extra` (Linux). The command `pdflatex` must work in a terminal.
2. Open `chrome://extensions`, switch on **Developer mode**, click **Load unpacked** and pick this `article-to-pdf` folder.

## Use

1. Start the helper and leave it running: `python3 helper/helper.py` (needs Python 3, nothing else).
2. Open an article, click the extension's button, then **Save article as PDF**. (Right-click on the page → *Save article as PDF* does the same.)

If the helper is not running you still get the `.tex` file, so nothing is lost.

## What to know

- **Permissions:** the extension asks for access to all websites, because it has to read whichever page you click it on and download that page's pictures. It sends nothing anywhere except to the helper on `127.0.0.1`.
- **Safety of the helper:** it listens only on your computer and only answers browser extensions (a web page's own requests are refused). `pdflatex` runs with shell escape off and cannot read files outside its job folder.
- **Limits:** pictures are converted to JPEG (SVG pictures are skipped, and so are tiny icons); at most 25 per article. Letters outside Latin scripts (Greek capitals, Chinese, emoji) are dropped, because `pdflatex` cannot set them. Maths on the page is kept as plain text.
- **X (Twitter) articles:** there is code for them, but its page selectors were written from memory and have **not** been tested against the live site. If one comes out empty or messy, tell me and send the page's HTML.
- **Not tested:** the popup button and the right-click item in a real, visible Chrome window. The test below drives the same code path through the extension's service worker.

## Test

`python3 tests/e2e.py` loads the extension in Chromium, runs it on a local sample article (`tests/fixture/`) and checks the PDF's text, that the pictures are in, and that the menus and footer are not. Needs `pip install playwright`, Chromium, `pdflatex` and `pdftotext`.
