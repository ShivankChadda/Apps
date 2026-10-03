#!/usr/bin/env python3
"""Markdown -> LaTeX converter: local helper.

Run this file to open the converter in your browser *and* turn on "Create PDF":

    python3 serve.py            (macOS / Linux)
    py serve.py                 (Windows)

It serves index.html on http://127.0.0.1:8765 and, when a TeX engine is installed
(XeLaTeX, LuaLaTeX, pdfLaTeX or Tectonic), compiles the generated LaTeX into a PDF.
Everything stays on your computer: the server only listens on 127.0.0.1.

Python 3.7+, standard library only.
"""
import argparse
import base64
import glob
import hmac
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(APP_DIR, "index.html")
TOKEN_META = '<meta name="md2latex-token" content="">'
MAX_BODY = 256 * 1024 * 1024          # request size limit (LaTeX + pictures)
MAX_FILES = 400
ALLOWED_ASSET_EXT = {".png", ".jpg", ".jpeg", ".pdf"}
ENGINES = ["xelatex", "lualatex", "pdflatex", "tectonic"]
ENGINE_LABELS = {
    "xelatex": "XeLaTeX",
    "lualatex": "LuaLaTeX",
    "pdflatex": "pdfLaTeX",
    "tectonic": "Tectonic",
}
IS_WINDOWS = os.name == "nt"


# --------------------------------------------------------------------------- engines
def extra_search_dirs():
    """TeX distributions often live outside PATH (especially when started from a GUI)."""
    home = os.path.expanduser("~")
    dirs = [
        "/Library/TeX/texbin", "/usr/texbin", "/opt/homebrew/bin", "/usr/local/bin",
        os.path.join(home, ".cargo", "bin"), os.path.join(home, ".local", "bin"),
    ]
    patterns = [
        "/usr/local/texlive/*/bin/*", "/opt/texlive/*/bin/*", os.path.join(home, "texlive", "*", "bin", "*"),
        "C:\\texlive\\*\\bin\\*", "C:\\Program Files\\MiKTeX*\\miktex\\bin\\x64",
        "C:\\Program Files (x86)\\MiKTeX*\\miktex\\bin",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "MiKTeX*", "miktex", "bin", "x64"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "MiKTeX", "miktex", "bin", "x64"),
    ]
    for pattern in patterns:
        dirs.extend(sorted(glob.glob(pattern), reverse=True))
    return [d for d in dirs if d and os.path.isdir(d)]


def find_executable(name):
    path = shutil.which(name)
    if path:
        return path
    for d in extra_search_dirs():
        for candidate in (name, name + ".exe"):
            full = os.path.join(d, candidate)
            if os.path.isfile(full) and os.access(full, os.X_OK):
                return full
    return None


def child_env():
    """Environment for TeX: add the usual TeX folders to PATH and restrict file access."""
    env = dict(os.environ)
    env["PATH"] = os.pathsep.join(extra_search_dirs() + [env.get("PATH", "")])
    # Paranoid mode: a document may only read/write below its own folder (and the TeX trees).
    env["openin_any"] = "p"
    env["openout_any"] = "p"
    env["shell_escape"] = "f"
    return env


def popen_kwargs():
    kwargs = {"stdin": subprocess.DEVNULL, "stdout": subprocess.PIPE, "stderr": subprocess.STDOUT, "env": child_env()}
    if IS_WINDOWS:
        kwargs["creationflags"] = 0x08000000  # CREATE_NO_WINDOW
    return kwargs


def detect_engines():
    found = []
    for engine in ENGINES:
        path = find_executable(engine)
        if not path:
            continue
        try:
            out = subprocess.run([path, "--version"], timeout=20, **popen_kwargs()).stdout.decode("utf-8", "replace")
        except Exception:
            continue
        first = (out.strip().splitlines() or [""])[0][:120]
        found.append({
            "id": engine, "label": ENGINE_LABELS[engine], "path": path, "version": first,
            "miktex": "miktex" in out.lower(),
        })
    return found


# ----------------------------------------------------------------------- compiling
HINTS = [
    (re.compile(r"libpng error|PNG error|readpng|unable to load picture|JPEG error|image inclusion", re.I),
     lambda m: "A picture could not be read (damaged, or a PNG/JPEG variant LaTeX cannot handle). "
               "Re-save it as a plain PNG or JPG and add it again."),
    (re.compile(r"File [`']([^']+?)\.(sty|cls)' not found"),
     lambda m: "Your TeX installation is missing the package \u201c%s\u201d. Install it with your TeX package manager "
               "(MiKTeX Console, or `tlmgr install %s`), or install a full TeX distribution." % (m.group(1), m.group(1))),
    (re.compile(r"[Ff]ont ([^\n]+?) not found|The font \"([^\"]+)\" cannot be found"),
     lambda m: "A font could not be found. Pick \u201cClassic (Latin Modern)\u201d under Font, or install the font."),
    (re.compile(r"Unicode char[^\n]*not set up|Unicode character[^\n]*not set up"),
     lambda m: "pdfLaTeX cannot typeset a character in the document. Choose XeLaTeX or LuaLaTeX as the engine."),
    (re.compile(r"Emergency stop|no output PDF file produced", re.I),
     lambda m: "LaTeX stopped early. See the first error below."),
    (re.compile(r"Undefined control sequence"),
     lambda m: "A command is unknown to LaTeX, usually a typo in a formula or a command from a package that is not loaded. "
               "Fix it in your Markdown, or define it under Advanced \u2192 Extra LaTeX."),
]


# "file:line: message" lines of a log written with -file-line-error (the file may be a package, not main.tex)
FILE_LINE_ERROR = re.compile(r"^(?:\./)?[^\s:]+\.(?:tex|sty|cls|def|fd|cfg|clo|ltx):(\d+): (.*)$")


def parse_errors(log):
    """Every distinct error in a TeX log, in order. The same log may be passed in twice (the .log file
    followed by the console output), so repeats are dropped. `context` is the text TeX had read when it
    stopped; for "Undefined control sequence" it ends with the offending command."""
    errors, seen = [], set()
    lines = log.splitlines()
    for i, line in enumerate(lines):
        m = FILE_LINE_ERROR.match(line)
        if m:
            msg, lineno = m.group(2), int(m.group(1))
        elif line.startswith("! "):
            msg, lineno = line[2:], None
        else:
            continue
        before = ""
        for follow in lines[i + 1:i + 12]:
            ln = re.match(r"^l\.(\d+) ?(.*)$", follow)
            if ln:
                if lineno is None:
                    lineno = int(ln.group(1))
                before = ln.group(2).strip()
                break
        key = (lineno, msg, before)
        if key in seen:
            continue
        seen.add(key)
        errors.append({"line": lineno, "message": msg[:200], "context": before[-160:]})
    return errors


def count_errors(log):
    return len(parse_errors(log))


def summarize_log(log):
    """The first few errors (with a line number and context) of a TeX log, and a hint about the likely cause."""
    errors = parse_errors(log)[:5]
    if not errors:
        # driver-level failures (xdvipdfmx / pdfTeX / Lua) do not use the "file:line:" format
        for line in log.splitlines():
            if re.search(r"libpng error|\*\* ERROR \*\*|xdvipdfmx:fatal|pdfTeX error|Error \d+ \(driver return code\)|"
                         r"PNG error|JPEG|readpng|image inclusion|unable to load picture", line, re.I):
                errors.append({"line": None, "message": line.strip()[:200], "context": ""})
                if len(errors) >= 3:
                    break
    hint = None
    for pattern, make in HINTS:
        m = pattern.search(log)
        if m:
            hint = make(m)
            break
    return errors, hint


def count_warnings(log):
    return {
        "missing_glyphs": len(re.findall(r"Missing character: There is no", log)),
        "omitted_chars": len(re.findall(r"Unsupported character omitted", log)),
        "overfull": len([1 for m in re.finditer(r"Overfull \\hbox \(([\d.]+)pt too wide", log) if float(m.group(1)) > 20]),
    }


def needs_rerun(log):
    return bool(re.search(r"Rerun to get|Please \(re\)run|Please rerun|Label\(s\) may have changed|"
                          r"rerunfilecheck Warning: File .* has changed", log))


def safe_asset_path(rel):
    """Only plain relative paths like images/foo.png may be written."""
    if not isinstance(rel, str) or not rel or len(rel) > 200:
        return None
    if "\\" in rel or rel.startswith("/") or re.match(r"^[A-Za-z]:", rel) or "\x00" in rel:
        return None
    parts = rel.split("/")
    if any(p in ("", ".", "..") or p.startswith(".") for p in parts):
        return None
    if os.path.splitext(parts[-1])[1].lower() not in ALLOWED_ASSET_EXT:
        return None
    if not re.match(r"^[A-Za-z0-9._\-/]+$", rel):
        return None
    return rel


OPTION_ERROR = re.compile(r"(unrecogni[sz]ed|unknown|invalid|unsupported|unexpected) (command[- ]line )?(option|argument)|"
                          r"option .{0,40} (is )?not (recogni[sz]ed|supported)|Found argument", re.I)


def flag_sets(engine_info, halt=True):
    """Command lines to try, safest first. Distributions differ in the options they accept.
    With halt=False LaTeX keeps going after an error, which can still produce a usable PDF."""
    path = engine_info["path"]
    h = ["-halt-on-error"] if halt else []
    if engine_info.get("miktex"):
        # MiKTeX: its own spelling for "no shell escape"; packages may be installed on demand
        return [
            [path, "--interaction=nonstopmode"] + [x.replace("-halt", "--halt") for x in h] + ["--disable-write18", "--enable-installer", "main.tex"],
            [path, "--interaction=nonstopmode"] + [x.replace("-halt", "--halt") for x in h] + ["--disable-write18", "main.tex"],
        ]
    return [
        [path, "-interaction=nonstopmode"] + h + ["-file-line-error", "-no-shell-escape", "main.tex"],
        [path, "-interaction=nonstopmode"] + h + ["-file-line-error", "main.tex"],
        [path, "-interaction=nonstopmode"] + h + ["main.tex"],
    ]


def run_engine_once(engine_info, work, timeout, start=0, halt=True):
    """One typesetting pass. Starts at flag set `start` and moves on while the engine rejects an option.
    Returns (process, output, index_of_the_flag_set_that_was_accepted)."""
    sets = flag_sets(engine_info, halt)
    result = None
    for index in range(start, len(sets)):
        proc = subprocess.run(sets[index], cwd=work, timeout=timeout, **popen_kwargs())
        output = proc.stdout.decode("utf-8", "replace")
        result = (proc, output, index)
        # a rejected option makes the engine quit at once with a short message
        if proc.returncode != 0 and len(output) < 4000 and OPTION_ERROR.search(output) and index + 1 < len(sets):
            continue
        break
    return result


COMPILE_LOCK = threading.Lock()


def run_compile(engine_info, tex, files):
    """Build `tex` with the chosen engine. Returns a JSON-serialisable dict."""
    started = time.time()
    work = tempfile.mkdtemp(prefix="md2latex-")
    try:
        with open(os.path.join(work, "main.tex"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(tex)
        for rel, b64 in (files or {}).items():
            safe = safe_asset_path(rel)
            if not safe:
                return {"ok": False, "error": "Rejected an unsafe picture path: %r" % rel[:80], "errors": [], "log": ""}
            target = os.path.join(work, *safe.split("/"))
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as fh:
                fh.write(base64.b64decode(b64))

        engine = engine_info["id"]
        path = engine_info["path"]
        timeout = 900 if engine_info.get("miktex") or engine == "tectonic" else 240
        log = ""
        passes = 0

        if engine == "tectonic":
            cmd = [path, "-X", "compile", "--untrusted", "--keep-logs", "--outdir", work, "main.tex"]
            proc = subprocess.run(cmd, cwd=work, timeout=timeout, **popen_kwargs())
            log = proc.stdout.decode("utf-8", "replace")
            if proc.returncode != 0 and re.search(r"(unrecognized|unexpected) (subcommand|argument)|Found argument", log):
                proc = subprocess.run([path, "main.tex"], cwd=work, timeout=timeout, **popen_kwargs())
                log = proc.stdout.decode("utf-8", "replace")
            passes = 1
            ok = proc.returncode == 0
        else:
            ok = True
            flags = 0
            for passes in range(1, 4):
                proc, log, flags = run_engine_once(engine_info, work, timeout, flags)
                texlog = os.path.join(work, "main.log")
                if os.path.exists(texlog):
                    with open(texlog, "r", encoding="utf-8", errors="replace") as fh:
                        log = fh.read() + "\n" + log
                if proc.returncode != 0:
                    ok = False
                    break
                if passes >= 2 and not needs_rerun(log):
                    break
                if passes >= 3:
                    break

        pdf_path = os.path.join(work, "main.pdf")
        recovered = None
        if not ok and engine != "tectonic":
            # Salvage run: let LaTeX continue past errors. A PDF with one garbled formula is more useful than none.
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            first_errors, first_hint = summarize_log(log)
            for passes in range(1, 3):
                proc, slog, flags = run_engine_once(engine_info, work, timeout, flags, halt=False)
                texlog = os.path.join(work, "main.log")
                if os.path.exists(texlog):
                    with open(texlog, "r", encoding="utf-8", errors="replace") as fh:
                        slog = fh.read() + "\n" + slog
                log = slog
            if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
                errors, hint = summarize_log(log)
                recovered = {"errors": errors or first_errors, "hint": hint or first_hint,
                             "count": count_errors(log) or len(first_errors)}
                ok = True
        if not ok or not os.path.exists(pdf_path):
            errors, hint = summarize_log(log)
            return {"ok": False, "error": (errors[0]["message"] if errors else "The PDF could not be built."),
                    "errors": errors, "hint": hint, "log": log[-60000:], "engine": engine,
                    "seconds": round(time.time() - started, 1)}
        with open(pdf_path, "rb") as fh:
            pdf = fh.read()
        out = {"ok": True, "pdf": base64.b64encode(pdf).decode("ascii"), "engine": engine, "passes": passes,
               "seconds": round(time.time() - started, 1), "warnings": count_warnings(log), "log": log[-60000:]}
        if recovered:
            out["recovered"] = recovered
        return out
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "The build took too long and was stopped.", "errors": [],
                "hint": "On a first run MiKTeX/Tectonic download packages; try again once they are installed.", "log": ""}
    except Exception as exc:  # never drop the connection without an answer
        return {"ok": False, "error": "Internal error: %s" % exc, "errors": [], "log": ""}
    finally:
        shutil.rmtree(work, ignore_errors=True)


# ------------------------------------------------------------------------- server
class Handler(BaseHTTPRequestHandler):
    server_version = "md2latex"
    protocol_version = "HTTP/1.1"

    # -- helpers
    def log_message(self, fmt, *args):  # keep the terminal quiet
        if os.environ.get("MD2LATEX_DEBUG"):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _allowed_hosts(self):
        port = self.server.server_address[1]
        return {"127.0.0.1:%d" % port, "localhost:%d" % port, "[::1]:%d" % port}

    def _security_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")

    def _send(self, status, body, content_type, extra=None):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        if status >= 400:
            # the request body may be unread: do not reuse this connection
            self.send_header("Connection", "close")
            self.close_connection = True
        self._security_headers()
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _json(self, status, obj):
        self._send(status, json.dumps(obj), "application/json; charset=utf-8")

    def _guard(self):
        """Reject DNS-rebinding and cross-site requests. Returns True when the request may proceed."""
        host = (self.headers.get("Host") or "").lower()
        if host not in self._allowed_hosts():
            self._json(403, {"ok": False, "error": "Forbidden host."})
            return False
        origin = self.headers.get("Origin")
        if origin and origin.lower() not in {"http://" + h for h in self._allowed_hosts()}:
            self._json(403, {"ok": False, "error": "Forbidden origin."})
            return False
        if self.headers.get("Sec-Fetch-Site", "same-origin") not in ("same-origin", "none"):
            self._json(403, {"ok": False, "error": "Cross-site requests are not allowed."})
            return False
        return True

    def _token_ok(self):
        supplied = self.headers.get("X-MD2LaTeX-Token", "")
        if not hmac.compare_digest(supplied.encode("utf-8"), self.server.token.encode("utf-8")):
            self._json(403, {"ok": False, "error": "Missing or wrong session token. Reload the page."})
            return False
        return True

    # -- routes
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        if not self._guard():
            return
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            try:
                with open(INDEX, "r", encoding="utf-8") as fh:
                    html = fh.read()
            except OSError:
                self._send(500, "index.html is missing next to serve.py", "text/plain; charset=utf-8")
                return
            html = html.replace(TOKEN_META, '<meta name="md2latex-token" content="%s">' % self.server.token, 1)
            csp = ("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
                   "img-src 'self' data: blob:; connect-src 'self'; frame-src blob:; object-src blob:; "
                   "font-src 'self'; base-uri 'none'; form-action 'none'")
            self._send(200, html, "text/html; charset=utf-8", {"Content-Security-Policy": csp})
        elif path == "/api/status":
            if not self._token_ok():
                return
            if "refresh=1" in self.path:
                self.server.engines = detect_engines()
            self._json(200, {"ok": True, "engines": self.server.engines, "platform": sys.platform,
                             "python": sys.version.split()[0], "maxBodyMB": MAX_BODY // (1024 * 1024)})
        elif path == "/favicon.ico":
            self._send(204, b"", "image/x-icon")
        else:
            self._send(404, "Not found", "text/plain; charset=utf-8")

    def do_POST(self):
        if not self._guard():
            return
        path = self.path.split("?", 1)[0]
        if path != "/api/compile":
            self._send(404, "Not found", "text/plain; charset=utf-8")
            return
        if not self._token_ok():
            return
        if not (self.headers.get("Content-Type", "").split(";")[0].strip().lower() == "application/json"):
            self._json(415, {"ok": False, "error": "Expected application/json."})
            return
        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._json(411, {"ok": False, "error": "Content-Length required."})
            return
        if length <= 0 or length > MAX_BODY:
            self._json(413, {"ok": False, "error": "Request too large (limit %d MB)." % (MAX_BODY // (1024 * 1024))})
            return
        try:
            req = json.loads(self.rfile.read(length).decode("utf-8"))
            tex = req["tex"]
            engine_id = req.get("engine") or ""
            files = req.get("files") or {}
            if not isinstance(tex, str) or not isinstance(files, dict) or len(files) > MAX_FILES:
                raise ValueError("bad shape")
        except Exception:
            self._json(400, {"ok": False, "error": "Malformed request."})
            return
        engine = next((e for e in self.server.engines if e["id"] == engine_id), None) or (self.server.engines or [None])[0]
        if engine is None:
            self._json(200, {"ok": False, "error": "No TeX engine was found on this computer.", "errors": [],
                             "hint": "Install MiKTeX (Windows), MacTeX (macOS), TeX Live (Linux) or Tectonic, then restart serve.py."})
            return
        with COMPILE_LOCK:
            result = run_compile(engine, tex, files)
        self._json(200 if result.get("ok") else 422, result)


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, addr, handler, engines):
        super().__init__(addr, handler)
        self.token = secrets.token_urlsafe(24)
        self.engines = engines


def make_server(port, engines, tries=20):
    last = None
    for p in range(port, port + tries):
        try:
            return Server(("127.0.0.1", p), Handler, engines)
        except OSError as exc:
            last = exc
    raise last


def main(argv=None):
    ap = argparse.ArgumentParser(description="Markdown -> LaTeX converter with PDF export (local only).")
    ap.add_argument("--port", type=int, default=8765, help="port to listen on (default 8765)")
    ap.add_argument("--no-browser", action="store_true", help="do not open a browser window")
    args = ap.parse_args(argv)

    if not os.path.exists(INDEX):
        print("index.html not found next to serve.py - run `node tools/build.js` first.", file=sys.stderr)
        return 1
    print("Looking for a TeX installation ...")
    engines = detect_engines()
    server = make_server(args.port, engines)
    url = "http://127.0.0.1:%d/" % server.server_address[1]
    print()
    print("  Markdown -> LaTeX converter is running at:  %s" % url)
    if engines:
        print("  PDF export: ON  (%s)" % ", ".join("%s" % e["label"] for e in engines))
    else:
        print("  PDF export: OFF - no TeX engine found. You can still download the .tex file.")
        print("  Install MiKTeX (Windows), MacTeX (macOS), TeX Live (Linux) or Tectonic to enable it.")
    print("  Press Ctrl+C to stop.\n")
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
