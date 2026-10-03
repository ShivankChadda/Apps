#!/bin/sh
# Double-click this file on macOS to start the Markdown to LaTeX converter with PDF export.
cd "$(dirname "$0")" || exit 1
./start.sh
echo
printf "Press Return to close this window. "
read -r _
