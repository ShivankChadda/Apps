#!/usr/bin/env node
'use strict';
/* Writes tests/fixtures/symbols.md: one document that contains every symbol the converter translates,
 * so the compile tests prove each mapped LaTeX command really exists (amssymb and unicode-math). */
const fs = require('fs');
const path = require('path');
const T = require('../src/tables.js');

const chunk = (arr, n) => arr.reduce((acc, x, i) => { (acc[Math.floor(i / n)] = acc[Math.floor(i / n)] || []).push(x); return acc; }, []);
const para = (title, chars) => '## ' + title + '\n\n' + chunk(chars, 16).map(c => c.join(' ')).join('\n\n') + '\n';
const visible = chars => chars.filter(c => !/^[\u00A0\u2002-\u200A\u202F\u00AD‑]$/.test(c));

const parts = ['---\ntitle: Symbol coverage\n---\n'];
parts.push(para('Math symbols', Object.keys(T.MATH_SYMBOLS)));
parts.push(para('Greek letters', Object.keys(T.GREEK)));
parts.push(para('Superscripts', Object.keys(T.SUPERSCRIPTS).map(c => 'x' + c)));
parts.push(para('Subscripts', Object.keys(T.SUBSCRIPTS).map(c => 'x' + c)));
parts.push(para('Text symbols', visible(Object.keys(T.TEXT_SYMBOLS))));
parts.push('## Spaces\n\nnon\u00A0breaking, en\u2002space, thin\u2009space, narrow\u202Fspace, non‑breaking hyphen, soft\u00ADhyphen.\n');
fs.writeFileSync(path.join(__dirname, '..', 'tests', 'fixtures', 'symbols.md'), parts.join('\n'));
console.log('symbols.md written');
