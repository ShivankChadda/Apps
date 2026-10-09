# Markdown → LaTeX

Turn a Markdown (`.md`) file into a clean, well-organised **LaTeX document** and a **printable PDF**. It runs entirely on your own computer: a web page you open in your browser, plus an optional small helper that builds the PDF.

What you get from a plain `.md` file:

- a title block (or a full title page), abstract and a real **table of contents**
- numbered headings, running header and page numbers
- lists, task lists, **tables** (they wrap and split across pages), **code blocks**, quotes and callouts
- **math** (`$x^2$`, `$$…$$`, `\( … \)`), **footnotes**, links (also between sections), **pictures**
- sensible typography: curly quotes, dashes, symbols such as → ≤ ✓ ★, and no stray emoji boxes
- the **`.tex` source**, so you can edit it, keep it, or send it to Overleaf

## Quick start

### 1. Just try it (no installation)

Open **`index.html`** in your browser (double-click it). Drop your `.md` file on the page. You can read the LaTeX, **download the `.tex`** (or a **.zip** with your pictures), and use the *Quick preview* tab to print a rough PDF from the browser.

### 2. Get real PDFs on your computer (recommended)

A PDF is made from the LaTeX by a LaTeX program. Install one once:

| Your computer | Install | Notes |
|---|---|---|
| Windows | [MiKTeX](https://miktex.org/download) | installs missing packages automatically (first PDF takes a few minutes) |
| macOS | [MacTeX](https://www.tug.org/mactex/) (or the smaller *BasicTeX*) | |
| Linux | `sudo apt install texlive-xetex texlive-latex-extra texlive-fonts-recommended` | or TeX Live from [tug.org](https://www.tug.org/texlive/) |
| any | [Tectonic](https://tectonic-typesetting.github.io/) | small single program, downloads packages on demand |

Then start the helper. It needs [Python 3](https://www.python.org/downloads/) (nothing else):

- **Windows:** double-click `start-windows.bat`
- **macOS:** double-click `start-mac.command` (if macOS refuses, run `sh start-mac.command` once in Terminal)
- **Linux / terminal:** `./start.sh` or `python3 serve.py`

Your browser opens the converter with **Create PDF** switched on. Drop a file and the PDF appears within a few seconds; it updates when you change a setting.

### 3. No LaTeX on your computer? Use Overleaf

Click **Download project (.zip)**, then on [overleaf.com](https://www.overleaf.com) choose *New Project → Upload Project*. In the project menu set the compiler to **XeLaTeX**. (Overleaf is a third-party website, so your document is uploaded to it.)

## Using the page

1. **Add your file**: drag the `.md` onto the box, click it, or *Paste Markdown instead*. *Try an example* shows what the tool can do. UTF-8, UTF-16 and Windows-1252 text files are all read correctly.
2. **Add pictures** if your Markdown has `![…](images/photo.png)`: use *Add pictures* or *Add a folder* (pick the folder that holds the `.md` and the images), or drag the whole folder onto the page. Files are matched by path, then by file name. GIF, WebP, SVG and 16-bit PNG pictures are converted to ordinary PNG automatically because LaTeX cannot read them directly.
3. **Look and layout**: document type (article / report / book), paper, font, size, margins, line spacing, title page, contents, heading numbers, colours (or print-friendly grayscale), code line numbers.
4. **Result tabs**: *PDF*, *LaTeX* (editable before you build), *Quick preview*, and *Notes* (everything the converter changed or could not do, in plain words).

### Front matter

Start the file with this block to set the title block (all parts optional):

```yaml
---
title: My Report
subtitle: Third quarter
author: Ada Lovelace; Alan Turing
date: 2026-10-03          # or leave out for today's date
abstract: |
  A short summary that appears under the title.
---
```

Without front matter, a single top-level `# Heading` at the start becomes the title and every other heading moves up one level. Hand-typed numbers in headings (`## 1. Introduction`) are detected, so you don't get "1 1. Introduction".

### Handy extras

- `\newpage` on its own line, `<!-- pagebreak -->` or `<div style="page-break-after: always"></div>` starts a new page.
- GitHub callouts work: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` …
- A hand-written "Table of contents" list of links is replaced by a real one.
- Long code blocks and tables break across pages; short ones are kept together, and a heading never ends up alone at the bottom of a page.

## What is converted how

| In your Markdown | In the LaTeX / PDF |
|---|---|
| `# … ######` | `\section` … (or `\chapter` … for report/book), with PDF bookmarks |
| `**bold**`, `*italic*`, `~~strike~~`, `` `code` `` | `\textbf`, `\emph`, `\sout`, `\texttt` |
| GFM tables | `booktabs` tables; wide ones get wrapping columns; long ones use `longtable` |
| fenced code | shaded, line-wrapping verbatim box (no syntax colours); box-drawing characters become ASCII |
| `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, `\begin{align}…` | real math; currency such as `$5 and $10` stays text. Commands plain LaTeX lacks (`\bm`, `\cancel`, `\coloneqq`, `\ket`, `\ce{H2O}`, `\SI{3}{m}`, `\mathscr`) load the package behind them, when your TeX has it |
| `[^1]` footnotes | LaTeX footnotes |
| `![alt](pic.png "caption")` | numbered figure with caption (width limited to the page; never enlarged) |
| raw HTML (`<br>`, `<b>`, `<img>`, `<details>`, centred blocks …) | the common parts are converted, the rest keeps its text |
| emoji | removed (LaTeX cannot print colour emoji); ✓ ✗ ★ → ⚠ and similar are converted to proper symbols |
| Greek, Cyrillic | work with XeLaTeX/LuaLaTeX (a suitable font is chosen); CJK, Arabic, Hebrew need a font, see below |

## Troubleshooting

**The PDF button says "PDF export is off".** You opened `index.html` directly. Start the helper (see Quick start 2) and use the address it prints.

**"No LaTeX engine found".** Install MiKTeX / MacTeX / TeX Live / Tectonic, then restart the helper.

**"The PDF was built, but LaTeX reported problems".** LaTeX stumbled over something (most often a formula with a command it does not know, such as a typo like `\fra`, or `\argmax`, which LaTeX does not define) and skipped it. The PDF is still made, with that spot missing or garbled. The message lists where LaTeX stopped; fix the formula in your Markdown and add the file again, or define the command under *Advanced → Extra LaTeX*, e.g. `\DeclareMathOperator{\argmax}{arg\,max}`.

**A formula shows up as plain text.** The converter checks every formula before it reaches LaTeX. One with unbalanced braces, a stray `$` or `&`, a `\frac` missing its second part, a doubled `^`/`_`, or a `\left` without `\right` would stop the whole build, so it is printed as text instead and the *Notes* tab says so. Fix it in the Markdown to get real math.

**"Package … not found".** Your TeX installation is minimal. On MiKTeX it installs the package for you; on TeX Live run `tlmgr install <name>` or install the "latex-extra" collection.

**Some characters are missing in the PDF (boxes or gaps).** The font has no glyph for them. Use XeLaTeX or LuaLaTeX (Advanced → LaTeX engine). For Chinese/Japanese/Korean, Arabic, Hebrew and similar scripts add a font under *Advanced → Extra LaTeX*, for example:

```latex
\usepackage{xeCJK}
\setCJKmainfont{Noto Serif CJK SC}      % any CJK font installed on your computer
```

**A picture shows "Image not available".** It was not found: add it with *Add pictures* (the Notes tab lists the missing names). Pictures that are web links (`https://…`) are not downloaded; save them next to your Markdown file instead.

**The Times / Palatino font looks like the classic one.** Those fonts (TeX Gyre) are not installed; LaTeX falls back to the classic look. Install your distribution's "tex-gyre" fonts to get them.

**Blank or missing PDF preview in the page.** Some browsers and phones cannot show a PDF inside a page; use the link *Open the PDF in a new tab* or *Download PDF*.

## Privacy and safety

- Your Markdown is converted inside the page; nothing is sent to the internet. The page contains no external scripts, fonts or images.
- The optional helper listens on `127.0.0.1` only, answers only to this page (host and origin checks plus a secret token created each time you start it) and serves nothing but `index.html`.
- By default the helper refuses everything except its own page. `python3 serve.py --allow-extension <id>` additionally lets one named Chrome extension (such as [`twitter-article-to-pdf`](../twitter-article-to-pdf/README.md)) ask for a PDF; websites and other extensions are still refused.
- LaTeX is compiled in a temporary folder with shell commands disabled and file access limited to that folder, and the temporary files are deleted afterwards. Math from your Markdown is screened so it cannot read other files.
- Still, treat `.md` files from strangers like any other downloaded document, and be aware that *Extra LaTeX* and the editable LaTeX tab run whatever you type.

## For developers

```
node tools/build.js                       # rebuild index.html from src/ (needed after editing src/)
node --test tests/converter.test.js tests/build.test.js   # unit tests (no TeX needed)
python3 -m unittest tests/test_server.py  # helper tests
node tests/compile.js                     # build every fixture with every installed TeX engine
node tests/matrix.js                      # build one fixture with 14 combinations of settings
node tests/fuzz.js --docs=4000 --compile=240   # hostile random documents (add --engine=pdflatex)
node tests/math-diff.js --count=800       # formula validator versus real pdfLaTeX
node tests/stress.js                      # control characters, 200 KB lines, 3000-line code blocks, ...
NODE_PATH=$(npm root -g) node --test tests/ui.test.js     # browser tests (needs Playwright)
node tools/md2tex-cli.js notes.md -o notes.tex --font=times --class=report   # command line
```

```
index.html        the app: one self-contained file (generated)
serve.py          optional helper: serves index.html and builds PDFs (Python 3 standard library only)
src/              md2tex.js (converter), preamble.js (LaTeX template), tables.js (symbols), zip.js, app.js, style.css
vendor/           marked 18.0.14 (MIT) used as the Markdown parser
tests/            unit, compile, option-matrix, helper and browser tests with fixtures
tools/            build script, command-line converter
examples/         sample.md shown by "Try an example"
```

The generated LaTeX compiles with XeLaTeX, LuaLaTeX and pdfLaTeX and loads only the packages a document needs: `fontspec`/`inputenc`, `geometry`, `microtype`, `parskip`, `xcolor`, `titlesec`, `tocloft`, `fancyhdr`, `enumitem`, `booktabs`, `longtable`, `fvextra`/`framed`, `graphicx`/`adjustbox`/`caption`, `hyperref`, … all part of TeX Live and MiKTeX.

### What has been tested

Everything above was exercised on Linux with TeX Live 2023 (XeLaTeX, LuaLaTeX, pdfLaTeX) and headless Chromium:

- 14 fixture documents × 3 engines, and 14 setting combinations × 3 engines;
- 40,000+ randomly assembled hostile Markdown documents (the converter must never throw and must always emit balanced LaTeX), about 2,000 of them built with XeLaTeX, LuaLaTeX or pdfLaTeX;
- inputs that are legal Markdown but hostile to TeX: terminal colour codes and control characters, single lines of 200 KB, a 3,000-line code block, a 1,200-paragraph quote (`tests/stress.js`);
- more than 4,000 valid and deliberately damaged formulas compared with what real pdfLaTeX accepts (`tests/math-diff.js`): nothing that stops LaTeX gets through; misspelled commands do, by design, because only LaTeX knows every command;
- helper security checks, the page end to end in a real browser (9 tests), and the generated PDFs looked at page by page.

The Windows/macOS start scripts, MiKTeX/MacTeX command-line handling and Tectonic support follow those programs' documentation but have not been run on those systems.

## License notes

The Markdown parser in `vendor/` is [marked](https://github.com/markedjs/marked) (MIT, see `vendor/marked.LICENSE.md`).
