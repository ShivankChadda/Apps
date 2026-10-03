#!/bin/sh
# Starts the Markdown to LaTeX converter with PDF export (macOS / Linux).
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 serve.py "$@"
elif command -v python >/dev/null 2>&1 && python -c 'import sys; sys.exit(sys.version_info[0] < 3)' 2>/dev/null; then
  exec python serve.py "$@"
fi
echo "Python 3 was not found."
echo "Install it from https://www.python.org/downloads/ and run this again,"
echo "or simply open index.html in your browser (everything works except the PDF button)."
exit 1
