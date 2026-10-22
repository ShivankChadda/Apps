# Black Box: PDF to Word

Turn a PDF back into an editable Word document (`.docx`) without the formatting looking like it survived a plane crash. It runs entirely in your browser: nothing is uploaded, and the converter contains no AI. It reads where every piece of text sits on the page and rebuilds the structure from that. The page shows the original on the left and the recovered document on the right, with a download button above them.

## Use it

**Hosted:** once GitHub Pages is on for this repository (below) it lives at `https://shivankchadda.github.io/Apps/pdf-to-word/`. Send anyone that link. They need no account and nothing is uploaded.

**Locally:** open **`index.html`** in a browser (it needs an internet connection to fetch pdf.js, JSZip and the fonts).

Drop a PDF on the tray, then press **Download .docx**. The page opens with a sample so you can see the result first. Hover a block on either side to find it on the other, and use **Show structure** to label every block in the result. Settings (page breaks, tables, columns, headers) are under **Options** and re-run instantly.

## Publish it

The built page is a single static file, so any static host works. For GitHub Pages: **Settings, Pages, Build and deployment, Source: Deploy from a branch**, pick the default branch and the `/ (root)` folder, then Save. The site is live a minute later. Rebuild with `node tools/build.js` and commit `index.html` after any change to `src/`.

## What comes out

- Headings as real Word heading styles, and a title when there is one
- Bullets and numbers as real Word lists, with levels
- Tables, including merged cells, borders, shading, and tables that run over a page break
- Tables inferred from alignment when the PDF has no ruling lines
- Two or more columns read in the right order (as one flowing column in Word)
- Bold, italic, underline, colour, sizes, superscripts, hyperlinks, letter spacing
- Tab stops with dot leaders (tables of contents), right-aligned page numbers
- Repeated headers and footers moved into Word's header and footer, with page-number fields
- Paragraph shading and borders, pictures, and charts drawn from vector shapes (kept as pictures)
- Landscape and portrait pages as separate sections
- A ledger: every letter and digit that went in is counted again on the way out

## What it will not do

- **Scanned pages.** A scan is a picture of text. Reading it needs OCR, which is machine learning, so scanned pages are placed in the Word file as pictures. A PDF that already has a text layer over the scan works normally.
- Text that wraps around a picture is flattened (picture first, then text).
- Rotated text inside an upright page is set aside and counted in the manifest. A page whose text all runs sideways is turned first.
- Fonts that are not on your computer are swapped by Word. Sizes, weights and colours still come across.
- Pages break where Word puts them. **Keep every page break** starts each original page on a new page.

## How it works

1. **Read** (`src/extract.js`). pdf.js gives every text fragment with its position, font, size and the drawing operators. Colours are sampled from a render of the page, and pictures and chart regions are cropped from it.
2. **Rebuild** (`src/layout.js`, `src/text.js`, `src/analyze.js`).
   - Fragments on one baseline form rows; wide gaps split rows into segments.
   - Ruling lines form tables with merged cells. Tall empty strips between text (gutters) mark columns and loose tables, and a text-versus-table test tells the two apart.
   - Lines become paragraphs by vertical gaps, indents, justification and list markers; sizes and weights give headings; markers become lists.
   - Headers, footers, shading, borders, margins and spacing are worked out last.
3. **Write** (`src/docx.js`). The model is written as a `.docx` package with JSZip: styles, numbering, tables, header and footer parts, sections.

`src/preview.js` draws the recovered document on screen, and `src/app.js` is the bench.

## Develop

```
npm install        # pdf.js, JSZip and Playwright for the tests
npm run build      # src/*  ->  index.html (and dist/artifact.html, the same page without the document wrapper)
npm run regress    # convert every fixture, diff the outline against tests/baseline, validate the .docx files
npm run e2e        # drive the built page in Chromium under a strict content security policy
```

`tests/fixtures-src` holds the scripts that make the test PDFs (Chromium, LibreOffice and ReportLab as producers, plus scans, a rotated page and a locked file). `tests/compare.sh <name>` converts a fixture, opens the result in LibreOffice and puts the original and the Word version side by side in `tests/out`. After a change you have checked by eye, `npm run regress -- --accept` records the new outlines.

pdf.js (Apache 2.0) and JSZip (MIT) are loaded from cdnjs.
