#!/bin/sh
# usage: compare.sh name [dpi]  -> out/<name>-cmp-N.png (original left, Word result right)
set -e
cd "$(dirname "$0")/out"
n="$1"; dpi="${2:-70}"
rm -f "$n".pdf "$n"-o-*.png "$n"-r-*.png "$n"-cmp-*.png
timeout 180 soffice --headless --convert-to pdf "$n.docx" >/dev/null 2>&1
pdftoppm -r "$dpi" -png "../fixtures/$n.pdf" "$n-o" 
pdftoppm -r "$dpi" -png "$n.pdf" "$n-r"
python3 - "$n" <<'PY'
import sys, glob
from PIL import Image
n = sys.argv[1]
o = sorted(glob.glob(f"{n}-o-*.png")); r = sorted(glob.glob(f"{n}-r-*.png"))
print("orig pages", len(o), "result pages", len(r))
for i in range(max(len(o), len(r))):
    a = Image.open(o[i]) if i < len(o) else None
    b = Image.open(r[i]) if i < len(r) else None
    w = (a.width if a else b.width) + (b.width if b else a.width) + 30
    h = max(a.height if a else 0, b.height if b else 0)
    im = Image.new("RGB", (w, h), (120, 120, 130))
    if a: im.paste(a, (0, 0))
    if b: im.paste(b, ((a.width if a else b.width) + 30, 0))
    im.save(f"{n}-cmp-{i+1}.png")
PY
ls "$n"-cmp-*.png
