#!/usr/bin/env python3
"""End-to-end test: loads the extension in Chromium, runs it on a local page, checks the PDF.
Runs twice: without the helper (built-in layout) and with it (real LaTeX).
Needs: pip install playwright, Chromium, pdflatex, pdftotext.   python3 tests/e2e.py"""
import glob, http.server, os, subprocess, sys, tempfile, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FIX = ROOT / "tests" / "fixture"

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(FIX), **k)
    def log_message(self, *a): pass

web = http.server.ThreadingHTTPServer(("127.0.0.1", 8123), Quiet)
threading.Thread(target=web.serve_forever, daemon=True).start()

def run(with_helper):
    dl = Path(tempfile.mkdtemp(prefix="a2p-dl-"))
    helper = subprocess.Popen([sys.executable, str(ROOT / "helper" / "helper.py")], stdout=subprocess.DEVNULL) if with_helper else None
    time.sleep(1)
    try:
        with sync_playwright() as p:
            ctx = p.chromium.launch_persistent_context(
                tempfile.mkdtemp(), executable_path=os.environ.get("CHROME", "/opt/pw-browsers/chromium"),
                args=[f"--disable-extensions-except={ROOT}", f"--load-extension={ROOT}", "--headless=new"])
            sw = ctx.service_workers[0] if ctx.service_workers else ctx.wait_for_event("serviceworker")
            page = ctx.new_page()
            ctx.new_cdp_session(page).send("Browser.setDownloadBehavior", {"behavior": "allow", "downloadPath": str(dl)})
            page.goto("http://127.0.0.1:8123/article.html")
            tab_id = sw.evaluate("async () => (await chrome.tabs.query({url: 'http://127.0.0.1:8123/*'}))[0].id")
            result = sw.evaluate("(id) => makePdf(id, true)", tab_id)
            time.sleep(2)
            ctx.close()
    finally:
        if helper: helper.terminate()
    print("result:", result)
    pdfs = glob.glob(str(dl / "*.pdf"))
    assert pdfs, "no PDF was downloaded"
    assert ("typeset with LaTeX" in result["text"]) == with_helper, result["text"]
    text = subprocess.run(["pdftotext", pdfs[0], "-"], capture_output=True, text=True).stdout
    for must in ["Speirling defies gravity", "Jane Doe", "How the fan works", "vacuum cleaner", "2,000 kg",
                 "The car on the ceiling", "fan_rpm = 5000", "Source: http://127.0.0.1:8123/article.html"]:
        assert must in text, f"missing: {must}"
    for must_not in ["Privacy", "Jobs", "tiny icon", "\\textbf", "documentclass"]:
        assert must_not not in text, f"leaked: {must_not}"
    imgs = subprocess.run(["pdfimages", "-list", pdfs[0]], capture_output=True, text=True).stdout
    assert "jpeg" in imgs, "picture missing"
    fonts = subprocess.run(["pdffonts", pdfs[0]], capture_output=True, text=True).stdout
    print(fonts)
    kept = Path(os.environ.get("KEEP_DIR", "/tmp")) / f"a2p-{'latex' if with_helper else 'builtin'}.pdf"
    kept.write_bytes(Path(pdfs[0]).read_bytes()); print("kept", kept)

try:
    run(False); run(True)
    print("E2E PASS")
finally:
    web.shutdown()
