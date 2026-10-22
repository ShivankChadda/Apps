from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import random
random.seed(3)
W = ('the committee reviewed several proposals for regional rail upgrades and concluded that incremental investment would deliver better outcomes than a single large programme although costs remain uncertain because supply chains are volatile and labour markets tight').split()
def sent(n=14):
    w=[random.choice(W) for _ in range(n)]; w[0]=w[0].capitalize(); return ' '.join(w)+'.'
def para(n=4): return ' '.join(sent(random.randint(9,18)) for _ in range(n))

d = Document()
sec = d.sections[0]
sec.left_margin = sec.right_margin = Inches(1); sec.top_margin = Inches(1); sec.bottom_margin = Inches(0.9)
st = d.styles['Normal']; st.font.name = 'Calibri'; st.font.size = Pt(11)
st.paragraph_format.space_after = Pt(8); st.paragraph_format.line_spacing = 1.15
# header / footer
hp = sec.header.paragraphs[0]; hp.text = 'Quarterly Operations Review\tAcme Rail Ltd'; 
fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
def field(p, instr):
    r = p.add_run(); f1 = OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'), 'begin'); r._r.append(f1)
    r2 = p.add_run(); it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve'); it.text = instr; r2._r.append(it)
    r3 = p.add_run(); f2 = OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'), 'end'); r3._r.append(f2)
fp.add_run('Page '); field(fp, 'PAGE'); fp.add_run(' of '); field(fp, 'NUMPAGES')

t = d.add_paragraph('Quarterly Operations Review'); t.style = d.styles['Title']
sub = d.add_paragraph('Northern region, fiscal quarter three'); sub.alignment = WD_ALIGN_PARAGRAPH.LEFT
sub.runs[0].italic = True; sub.runs[0].font.size = Pt(13); sub.runs[0].font.color.rgb = RGBColor(0x55,0x55,0x55)
d.add_heading('1. Summary', level=1)
p = d.add_paragraph(para(4)); p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p = d.add_paragraph('Key points: ')
r = p.add_run('on-time performance'); r.bold = True
p.add_run(' improved while '); r = p.add_run('cancellations'); r.italic = True
p.add_run(' fell; see '); 
# hyperlink
def link(p, url, text):
    part = p.part; rid = part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    h = OxmlElement('w:hyperlink'); h.set(qn('r:id'), rid)
    r = OxmlElement('w:r'); rp = OxmlElement('w:rPr'); c = OxmlElement('w:color'); c.set(qn('w:val'), '0563C1'); rp.append(c)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rp.append(u); r.append(rp)
    tt = OxmlElement('w:t'); tt.text = text; r.append(tt); h.append(r); p._p.append(h)
link(p, 'https://example.org/q3-report', 'the full dashboard'); p.add_run('.')
d.add_heading('1.1 Highlights', level=2)
for s in ['Punctuality reached 91.4 percent across all routes', 'Customer complaints fell for the third quarter running', 'Three stations completed accessibility upgrades']:
    d.add_paragraph(s, style='List Bullet')
d.add_paragraph('Actions for the next quarter:')
for s in ['Finalise the timetable change', 'Agree the maintenance window with the operators', 'Publish the revised service pledge']:
    d.add_paragraph(s, style='List Number')
d.add_heading('2. Performance by route', level=1)
d.add_paragraph(para(3)).alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
tb = d.add_table(rows=1, cols=4); tb.style = 'Table Grid'; tb.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = tb.rows[0].cells
for c, txt in zip(hdr, ['Route', 'Trains', 'On time', 'Delay (min)']):
    c.text = ''; r = c.paragraphs[0].add_run(txt); r.bold = True
    sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:fill'), 'D9E2F3'); c._tc.get_or_add_tcPr().append(sh)
for row in [('Leeds - York', '1,204', '92.1%', '1.8'), ('York - Hull', '688', '89.7%', '2.9'), ('Leeds - Sheffield', '1,012', '90.3%', '2.2'), ('Hull - Scarborough', '412', '94.0%', '1.1')]:
    cells = tb.add_row().cells
    for i, (c, v) in enumerate(zip(cells, row)):
        c.text = v
        if i: c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
d.add_paragraph('Table 1. Route performance, quarter three.').runs[0].font.size = Pt(9)
d.add_heading('3. Outlook', level=1)
for _ in range(3):
    d.add_paragraph(para(5)).alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
d.add_heading('3.1 Risks', level=2)
for _ in range(2):
    d.add_paragraph(para(5)).alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
d.save('wordlike.docx')
