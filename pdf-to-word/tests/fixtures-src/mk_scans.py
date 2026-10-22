"""Makes the scanned, text-layer-over-scan, rotated and password-protected test PDFs from report.pdf.
Needs: poppler's pdftoppm, reportlab, Pillow, pypdf. Run from tests/fixtures-src."""
import glob, subprocess
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PIL import Image
from pypdf import PdfReader, PdfWriter
subprocess.run(['pdftoppm', '-r', '110', '-f', '2', '-l', '2', '-png', '../fixtures/report.pdf', 'scan'], check=True)
im = Image.open(sorted(glob.glob('scan-*.png'))[0]).convert('L').rotate(0.6, fillcolor=255)
im.save('scan_g.png')
c = canvas.Canvas('../fixtures/scan.pdf', pagesize=letter)
for _ in range(2):
    c.drawImage('scan_g.png', 0, 0, width=letter[0], height=letter[1]); c.showPage()
c.save()
c = canvas.Canvas('../fixtures/ocr.pdf', pagesize=letter)
c.drawImage('scan_g.png', 0, 0, width=letter[0], height=letter[1])
t = c.beginText(72, 700); t.setTextRenderMode(3); t.setFont('Helvetica', 11)
for line in ['Concluded supply several several upgrades regional different lows outcomes.', 'New incremental incremental demand rail regional signalling passenger committee.']:
    t.textLine(line)
c.drawText(t); c.showPage(); c.save()
w = PdfWriter(); w.add_page(PdfReader('../fixtures/invoice.pdf').pages[0]); w.pages[0].rotate(90); w.write('../fixtures/rot90.pdf')
w = PdfWriter()
for p in PdfReader('../fixtures/report.pdf').pages: w.add_page(p)
w.encrypt('secret'); w.write('../fixtures/locked.pdf')
