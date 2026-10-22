from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem, PageBreak, FrameBreak, Image, KeepTogether
import random
random.seed(11)
W = ('the study examined bridge inspection intervals across forty regional authorities and found that structured data collection improved maintenance planning while manual records often lacked consistent dates measurements and responsible engineers').split()
def sent(n=14):
    w=[random.choice(W) for _ in range(n)]; w[0]=w[0].capitalize(); return ' '.join(w)+'.'
def para(n=4): return ' '.join(sent(random.randint(9,17)) for _ in range(n))
ss = getSampleStyleSheet()
body = ParagraphStyle('b', parent=ss['BodyText'], fontName='Times-Roman', fontSize=10.5, leading=14, alignment=TA_JUSTIFY, spaceAfter=6)
h1 = ParagraphStyle('h1', parent=ss['Heading1'], fontName='Helvetica-Bold', fontSize=16, spaceBefore=12, spaceAfter=6)
h2 = ParagraphStyle('h2', parent=ss['Heading2'], fontName='Helvetica-Bold', fontSize=12.5, spaceBefore=8, spaceAfter=4)
title = ParagraphStyle('t', parent=ss['Title'], fontName='Helvetica-Bold', fontSize=24, alignment=TA_CENTER, spaceAfter=4)
small = ParagraphStyle('s', parent=body, fontSize=8.5, leading=11, alignment=TA_LEFT, textColor=colors.HexColor('#555555'))
def decor(c, d):
    c.saveState(); c.setFont('Helvetica', 8); c.setFillColor(colors.HexColor('#666666'))
    c.drawString(2*cm, A4[1]-1.2*cm, 'Bridge Inspection Study'); c.drawRightString(A4[0]-2*cm, A4[1]-1.2*cm, 'Draft v0.3')
    c.drawCentredString(A4[0]/2, 1.1*cm, 'Page %d' % d.page); c.restoreState()
doc = BaseDocTemplate('rl.pdf', pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
full = Frame(2*cm, 2*cm, A4[0]-4*cm, A4[1]-4*cm, id='full')
colw = (A4[0]-4*cm-0.8*cm)/2
f1 = Frame(2*cm, 2*cm, colw, A4[1]-4*cm, id='c1'); f2 = Frame(2*cm+colw+0.8*cm, 2*cm, colw, A4[1]-4*cm, id='c2')
doc.addPageTemplates([PageTemplate('one', [full], onPage=decor), PageTemplate('two', [f1, f2], onPage=decor)])
s = []
s.append(Paragraph('Bridge Inspection Intervals', title))
s.append(Paragraph('A review of forty regional authorities', ParagraphStyle('sub', parent=body, alignment=TA_CENTER, fontName='Times-Italic', fontSize=12)))
s.append(Spacer(1, 10))
s.append(Paragraph('1. Introduction', h1)); s.append(Paragraph(para(5), body)); s.append(Paragraph(para(4), body))
s.append(Paragraph('1.1 Scope', h2)); s.append(Paragraph(para(4), body))
s.append(ListFlowable([ListItem(Paragraph(x, body)) for x in ['Inspection frequency by structure type','Record keeping and data quality','Cost per inspection','Time to repair after a defect is found']], bulletType='bullet', start='•', leftIndent=18))
s.append(Paragraph('Steps followed:', body))
s.append(ListFlowable([ListItem(Paragraph(x, body)) for x in ['Collect the inspection logs','Normalise dates and units','Compare intervals against guidance']], bulletType='1', leftIndent=20))
s.append(Paragraph('2. Results', h1))
data = [['Authority','Bridges','Median interval (months)','Backlog'],['North Riding','412','22','14%'],['West Dale','188','30','31%'],['Marsh Valley','97','18','6%'],['Total / mean','697','23','17%']]
t = Table(data, colWidths=[5*cm,3*cm,5*cm,3*cm])
t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),0.6,colors.black),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dbe4f0')),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTNAME',(0,1),(-1,-1),'Helvetica'),('ALIGN',(1,1),(-1,-1),'RIGHT'),('FONTNAME',(0,-1),(-1,-1),'Helvetica-Bold')]))
s.append(t); s.append(Spacer(1,6)); s.append(Paragraph('Table 1. Inspection intervals by authority.', small))
s.append(Paragraph(para(5), body)); s.append(Paragraph(para(4), body))
from reportlab.platypus import NextPageTemplate
s.append(NextPageTemplate('two')); s.append(PageBreak())
s.append(Paragraph('3. Discussion', h1))
for _ in range(7): s.append(Paragraph(para(5), body))
s.append(Paragraph('3.1 Limits', h2))
for _ in range(4): s.append(Paragraph(para(5), body))
doc.build(s)
