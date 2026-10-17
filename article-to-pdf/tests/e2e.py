#!/usr/bin/env python3
"""End-to-end test: loads the extension in Chromium, runs it on a local page, checks the PDF.
Needs: pip install playwright, Chromium, pdflatex, pdftotext.   python3 tests/e2e.py"""
import glob, http.server, os, subprocess, sys, tempfile, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FIX = ROOT / "tests" / "fixture"
dl = Path(tempfile.mkdtemp(prefix="a2p-dl-"))
before = set(glob.glob(str(dl / "*")))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(FIX), **k)
    def log_message(self, *a): pass
web = http.server.ThreadingHTTPServer(("127.0.0.1", 8123), Quiet)
threading.Thread(target=web.serve_forever, daemon=True).start()
helper = subprocess.Popen([sys.executable, str(ROOT / "helper" / "helper.py")], stdout=subprocess.DEVNULL)
time.sleep(1)

try:
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            tempfile.mkdtemp(), executable_path=os.environ.get("CHROME", "/opt/pw-browsers/chromium"),
            args=[f"--disable-extensions-except={ROOT}", f"--load-extension={ROOT}", "--headless=new"],
        )
        sw = ctx.service_workers[0] if ctx.service_workers else ctx.wait_for_event("serviceworker")
        page = ctx.new_page()
        ctx.new_cdp_session(page).send("Browser.setDownloadBehavior", {"behavior": "allow", "downloadPath": str(dl)})
        page.goto("http://127.0.0.1:8123/article.html")
        tab_id = sw.evaluate("""async () => (await chrome.tabs.query({url: 'http://127.0.0.1:8123/*'}))[0].id""")
        result = sw.evaluate("(id) => makePdf(id, true)", tab_id)
        print("result:", result)
        time.sleep(2)
        print("downloads api:", sw.evaluate("chrome.downloads.search({}).then(r => r.map(d => [d.state, d.error, d.filename]))"))
        ctx.close()
finally:
    helper.terminate(); web.shutdown()

new = sorted(set(glob.glob(str(dl / "*"))) - before)
print("downloads:", new)
pdfs = [f for f in new if f.endswith(".pdf")]
assert pdfs, "no PDF was downloaded"
text = subprocess.run(["pdftotext", pdfs[0], "-"], capture_output=True, text=True).stdout
print(text)
for must in ["Speirling defies gravity", "Jane Doe", "How the fan works", "vacuum cleaner", "2,000 kg", "The car on the ceiling"]:
    assert must in text, f"missing: {must}"
for must_not in ["Privacy", "Jobs", "tiny icon"]:
    assert must_not not in text, f"boilerplate leaked: {must_not}"
print("images in pdf:", subprocess.run(["pdfimages", "-list", pdfs[0]], capture_output=True, text=True).stdout)
print("E2E PASS")
