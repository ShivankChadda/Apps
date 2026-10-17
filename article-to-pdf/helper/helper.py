#!/usr/bin/env python3
"""Local helper for the Article to PDF extension: receives LaTeX, returns a PDF.

    python3 helper.py            # listens on 127.0.0.1:8765

Safety: it only listens on this computer, only answers requests that come from a browser
extension (a web page's own Origin is refused), and runs pdflatex with shell escape off and
file reading limited to the job's own folder.
"""
import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 8765
MAX_BODY = 80 * 1024 * 1024
SAFE_NAME = re.compile(r"^img\d{1,3}\.jpg$")


def compile_tex(tex, files):
    work = Path(tempfile.mkdtemp(prefix="a2p-"))
    try:
        (work / "article.tex").write_text(tex, encoding="utf-8")
        for name, b64 in files.items():
            if SAFE_NAME.match(name):
                (work / name).write_bytes(base64.b64decode(b64))
        env = dict(os.environ, openin_any="p", openout_any="p")  # paranoid: no files outside the job
        for _ in range(2):  # twice, so hyperref's bookkeeping settles
            r = subprocess.run(
                ["pdflatex", "-no-shell-escape", "-interaction=nonstopmode", "-halt-on-error", "article.tex"],
                cwd=work, env=env, capture_output=True, text=True, timeout=120,
            )
            if r.returncode:
                log = (work / "article.log").read_text(errors="ignore") if (work / "article.log").exists() else r.stdout
                lines = [l for l in log.splitlines() if l.startswith("!")]
                raise RuntimeError("; ".join(lines[:3]) or "pdflatex failed")
        return (work / "article.pdf").read_bytes()
    finally:
        shutil.rmtree(work, ignore_errors=True)


class Handler(BaseHTTPRequestHandler):
    def _cors_ok(self):
        origin = self.headers.get("Origin", "")
        return origin.startswith("chrome-extension://") or origin.startswith("moz-extension://")

    def _send(self, code, body=b"", ctype="application/json"):
        self.send_response(code)
        origin = self.headers.get("Origin", "")
        if self._cors_ok():
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if not self._cors_ok():
            return self._send(403)
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self.headers["Origin"])
        self.send_header("Access-Control-Allow-Methods", "POST, GET")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        self._send(200, b'{"ok":true}')

    def do_POST(self):
        if self.path != "/compile" or not self._cors_ok():
            return self._send(403, b'{"error":"refused"}')
        n = int(self.headers.get("Content-Length", 0))
        if n > MAX_BODY:
            return self._send(413, b'{"error":"too large"}')
        try:
            job = json.loads(self.rfile.read(n))
            pdf = compile_tex(job["tex"], job.get("files", {}))
        except Exception as e:  # report to the extension, which saves the .tex instead
            return self._send(422, json.dumps({"error": str(e)}).encode())
        self._send(200, pdf, "application/pdf")

    def log_message(self, fmt, *args):
        print("  ", fmt % args)


if __name__ == "__main__":
    if not shutil.which("pdflatex"):
        raise SystemExit("pdflatex not found. Install TeX Live / MacTeX / MiKTeX first (see README).")
    print(f"Article to PDF helper running on http://127.0.0.1:{PORT}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
