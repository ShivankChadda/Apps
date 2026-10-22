#!/bin/sh
# Re-run every fixture and compare the document outline with the saved baseline.
#   tests/regress.sh          show differences
#   tests/regress.sh --accept record the current outlines as the new baseline
cd "$(dirname "$0")/.."
names="report paper invoice toc tables resume wordlike sample rl charts word2 ocr scan long"
node tests/run.js $names --quiet >/tmp/regress.log 2>&1 || { cat /tmp/regress.log; exit 1; }
grep -E "^==" /tmp/regress.log | sed 's/{.*//'
status=0
for n in $names; do
  if [ "$1" = "--accept" ]; then cp tests/out/$n.outline.txt tests/baseline/$n.outline.txt; continue; fi
  if [ -f tests/baseline/$n.outline.txt ]; then
    if ! diff -q tests/baseline/$n.outline.txt tests/out/$n.outline.txt >/dev/null; then
      echo "--- $n changed"; diff tests/baseline/$n.outline.txt tests/out/$n.outline.txt | head -${LINES_MAX:-20}; status=1
    fi
  fi
done
python3 tests/validate-docx.py $(for n in $names; do echo tests/out/$n.docx; done) | tail -1
[ "$1" = "--accept" ] && echo "baseline updated"
exit $status
