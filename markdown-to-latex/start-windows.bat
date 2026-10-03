@echo off
rem Double-click this file on Windows to start the Markdown to LaTeX converter with PDF export.
setlocal
cd /d "%~dp0"
set "PYCMD="
where py >nul 2>nul && set "PYCMD=py -3"
if not defined PYCMD where python >nul 2>nul && set "PYCMD=python"
if not defined PYCMD goto nopython
%PYCMD% serve.py
goto end
:nopython
echo Python 3 was not found.
echo Install it from https://www.python.org/downloads/ (tick "Add python.exe to PATH"),
echo then run this file again. Or just open index.html in your browser:
echo everything works except the PDF button.
:end
echo.
pause
