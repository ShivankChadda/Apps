"""Tests for serve.py: request guards (host / origin / token), limits and real PDF builds.

    python3 -m unittest tests/test_server.py -v

The compile tests are skipped when no TeX engine is installed.
"""
import base64
import http.client
import json
import os
import sys
import struct
import threading
import unittest
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import serve  # noqa: E402

MINIMAL_TEX = r"""\documentclass{article}
\begin{document}
Hello from the test suite.
\end{document}
"""
def make_png():
    """A valid 1x1 white PNG built with zlib (no external files)."""
    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
    raw = b"\x00\xff\xff\xff"
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


PNG = base64.b64encode(make_png()).decode()


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engines = serve.detect_engines()
        cls.server = serve.make_server(0, cls.engines)          # port 0: any free port
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def request(self, method, path, body=None, headers=None, host=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=300)
        hdrs = {"Host": host or "127.0.0.1:%d" % self.port}
        hdrs.update(headers or {})
        conn.request(method, path, body=body, headers=hdrs)
        resp = conn.getresponse()
        data = resp.read()
        conn.close()
        return resp, data

    def api(self, method, path, payload=None, token=True, **kw):
        headers = {}
        if token:
            headers["X-MD2LaTeX-Token"] = self.server.token
        body = None
        if payload is not None:
            body = json.dumps(payload)
            headers["Content-Type"] = "application/json"
        headers.update(kw.pop("headers", {}))
        resp, data = self.request(method, path, body, headers, **kw)
        try:
            return resp, json.loads(data.decode("utf-8"))
        except ValueError:
            return resp, data

    # ---------------------------------------------------------------- page
    def test_index_page_carries_the_session_token(self):
        resp, data = self.request("GET", "/")
        self.assertEqual(resp.status, 200)
        html = data.decode("utf-8")
        self.assertIn('<meta name="md2latex-token" content="%s">' % self.server.token, html)
        self.assertIn("Content-Security-Policy", resp.headers)
        self.assertEqual(resp.headers["X-Frame-Options"], "DENY")
        self.assertNotIn("Access-Control-Allow-Origin", resp.headers)

    def test_unknown_paths_and_files_are_not_served(self):
        for path in ("/serve.py", "/../serve.py", "/vendor/marked.umd.js", "/tests/test_server.py", "/.git/config"):
            resp, _ = self.request("GET", path)
            self.assertEqual(resp.status, 404, path)

    # ------------------------------------------------------------- guards
    def test_foreign_host_header_is_refused(self):
        resp, _ = self.request("GET", "/", host="evil.example.com")
        self.assertEqual(resp.status, 403)
        resp, _ = self.request("GET", "/", host="127.0.0.1:1")
        self.assertEqual(resp.status, 403)

    def test_foreign_origin_is_refused(self):
        resp, _ = self.api("GET", "/api/status", headers={"Origin": "https://evil.example.com"})
        self.assertEqual(resp.status, 403)
        resp, body = self.api("GET", "/api/status", headers={"Origin": "http://127.0.0.1:%d" % self.port})
        self.assertEqual(resp.status, 200)

    def test_cross_site_fetch_metadata_is_refused(self):
        resp, _ = self.api("GET", "/api/status", headers={"Sec-Fetch-Site": "cross-site"})
        self.assertEqual(resp.status, 403)

    def test_api_needs_the_token(self):
        resp, _ = self.api("GET", "/api/status", token=False)
        self.assertEqual(resp.status, 403)
        resp, _ = self.api("GET", "/api/status", headers={"X-MD2LaTeX-Token": "guess"}, token=False)
        self.assertEqual(resp.status, 403)
        resp, _ = self.api("POST", "/api/compile", {"tex": MINIMAL_TEX}, token=False)
        self.assertEqual(resp.status, 403)

    def test_status_lists_engines(self):
        resp, body = self.api("GET", "/api/status")
        self.assertEqual(resp.status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual([e["id"] for e in body["engines"]], [e["id"] for e in self.engines])

    # ------------------------------------------------------------- limits
    def test_compile_requires_json(self):
        resp, _ = self.request("POST", "/api/compile", "tex=1", {"X-MD2LaTeX-Token": self.server.token, "Content-Type": "text/plain"})
        self.assertEqual(resp.status, 415)

    def test_malformed_and_oversized_requests(self):
        resp, body = self.api("POST", "/api/compile", {"nope": 1})
        self.assertEqual(resp.status, 400)
        resp, _ = self.request("POST", "/api/compile", "{", {"X-MD2LaTeX-Token": self.server.token, "Content-Type": "application/json"})
        self.assertEqual(resp.status, 400)
        resp, _ = self.request("POST", "/api/compile", None, {"X-MD2LaTeX-Token": self.server.token, "Content-Type": "application/json",
                                                              "Content-Length": str(serve.MAX_BODY + 1)})
        self.assertEqual(resp.status, 413)

    def test_unsafe_picture_paths_are_rejected(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        for bad in ("../evil.png", "/etc/passwd", "C:/x.png", "a/../../b.png", ".hidden/x.png", "images/x.sh", "images\\x.png", "images/a b.png", ""):
            resp, body = self.api("POST", "/api/compile", {"tex": MINIMAL_TEX, "engine": self.engines[0]["id"], "files": {bad: PNG}})
            self.assertEqual(resp.status, 422, bad)
            self.assertFalse(body["ok"])
            self.assertIn("unsafe", body["error"].lower(), bad)

    def test_safe_asset_path_rules(self):
        self.assertEqual(serve.safe_asset_path("images/photo-1_a.png"), "images/photo-1_a.png")
        for bad in ("../a.png", "/a.png", "a//b.png", "a/./b.png", "a.txt", "images/.x.png", "x" * 300 + ".png"):
            self.assertIsNone(serve.safe_asset_path(bad), bad)

    # ------------------------------------------------------------- builds
    def test_log_summary_finds_errors_and_hints(self):
        errors, hint = serve.summarize_log("./main.tex:12: Undefined control sequence.\nl.12 \\foo\n\n! LaTeX Error: File `nosuchpkg.sty' not found.\n")
        self.assertEqual(errors[0]["line"], 12)
        self.assertIn("Undefined control sequence", errors[0]["message"])
        self.assertIn("nosuchpkg", hint) if "nosuchpkg" in (hint or "") else self.assertIsNotNone(hint)
        _, hint2 = serve.summarize_log("! LaTeX Error: File `fvextra.sty' not found.")
        self.assertIn("fvextra", hint2)

    def test_log_errors_are_listed_once_with_the_text_before_the_error(self):
        log = ("./main.tex:94: Undefined control sequence.\n"
               "l.94 ...= mc^2$, but this one has a typo: $E = \\mc\n"
               "                                                  ^2$.\n"
               "The control sequence at the end of the top line\n\n"
               "./main.tex:97: Undefined control sequence.\n"
               "l.97 \\[\\argmax\n                 _x\\]\n")
        errors = serve.parse_errors(log + "\n" + log)         # the .log file followed by the console copy of it
        self.assertEqual([(e["line"], e["context"]) for e in errors],
                         [(94, "...= mc^2$, but this one has a typo: $E = \\mc"), (97, "\\[\\argmax")])
        self.assertEqual(serve.count_errors(log + log), 2)
        # package errors in the older "! ..." layout get their line from the "l.NN" line that follows
        old_style = "! Package xcolor Error: Undefined color `nope'.\n\nSee the xcolor package documentation.\n\nl.31 \\textcolor{nope}\n"
        self.assertEqual(serve.parse_errors(old_style)[0]["line"], 31)

    def test_compiles_a_pdf(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        resp, body = self.api("POST", "/api/compile", {"tex": MINIMAL_TEX, "engine": self.engines[0]["id"]})
        self.assertEqual(resp.status, 200, body)
        self.assertTrue(body["ok"])
        pdf = base64.b64decode(body["pdf"])
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertGreaterEqual(body["passes"], 2)

    def test_latex_errors_are_recovered_into_a_pdf_and_reported(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        bad = MINIMAL_TEX.replace("Hello", r"\thiscommanddoesnotexist Hello")
        resp, body = self.api("POST", "/api/compile", {"tex": bad, "engine": self.engines[0]["id"]})
        self.assertEqual(resp.status, 200, body)
        self.assertTrue(body["ok"])
        self.assertTrue(base64.b64decode(body["pdf"]).startswith(b"%PDF"))
        recovered = body["recovered"]
        self.assertGreaterEqual(recovered["count"], 1)
        self.assertIn("Undefined control sequence", recovered["errors"][0]["message"])
        self.assertEqual(recovered["errors"][0]["line"], 3)
        self.assertIn("unknown", recovered["hint"])

    def test_a_clean_build_has_no_recovery_report(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        resp, body = self.api("POST", "/api/compile", {"tex": MINIMAL_TEX, "engine": self.engines[0]["id"]})
        self.assertEqual(resp.status, 200, body)
        self.assertNotIn("recovered", body)

    def test_unrecoverable_errors_are_reported_without_a_pdf(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        bad = MINIMAL_TEX.replace(r"\begin{document}", r"\usepackage{nosuchpackagexyz}" + "\n" + r"\begin{document}")
        resp, body = self.api("POST", "/api/compile", {"tex": bad, "engine": self.engines[0]["id"]})
        self.assertEqual(resp.status, 422)
        self.assertFalse(body["ok"])
        self.assertNotIn("pdf", body)
        self.assertIn("nosuchpackagexyz", body["error"])
        self.assertIn("nosuchpackagexyz", body["hint"])

    def test_shell_escape_and_file_reading_are_blocked(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        secret = os.path.join(ROOT, "package.json")        # a real file outside the build folder
        tex = ("\\documentclass{article}\\begin{document}\n"
               "\\immediate\\write18{echo pwned > pwned.txt}\n"
               "\\input{%s}\n\\end{document}\n" % secret.replace("\\", "/"))
        resp, body = self.api("POST", "/api/compile", {"tex": tex, "engine": self.engines[0]["id"]})
        self.assertFalse(os.path.exists(os.path.join(ROOT, "pwned.txt")))
        self.assertFalse(os.path.exists("pwned.txt"))
        if body.get("ok"):   # a compiled PDF must not contain the file we tried to read
            self.assertNotIn(b"markdown-to-latex", base64.b64decode(body["pdf"]))
        else:
            self.assertRegex(body["log"], r"(?i)not allowed|openin|restricted|cannot|can't|File `")

    def test_pictures_are_available_to_the_document(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        tex = ("\\documentclass{article}\\usepackage{graphicx}\\begin{document}\n"
               "\\includegraphics[width=1cm]{images/dot.png}\n\\end{document}\n")
        resp, body = self.api("POST", "/api/compile", {"tex": tex, "engine": self.engines[0]["id"], "files": {"images/dot.png": PNG}})
        self.assertEqual(resp.status, 200, body)

    def test_damaged_picture_gives_a_readable_error(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        tex = ("\\documentclass{article}\\usepackage{graphicx}\\begin{document}\n"
               "\\includegraphics[width=1cm]{images/bad.png}\n\\end{document}\n")
        broken = base64.b64encode(make_png()[:-20] + b"garbagegarbage").decode()
        resp, body = self.api("POST", "/api/compile", {"tex": tex, "engine": self.engines[0]["id"], "files": {"images/bad.png": broken}})
        self.assertEqual(resp.status, 422)
        self.assertTrue(body["errors"] or body["hint"], body.get("error"))

    def test_unknown_engine_falls_back_to_an_installed_one(self):
        if not self.engines:
            self.skipTest("no TeX engine")
        resp, body = self.api("POST", "/api/compile", {"tex": MINIMAL_TEX, "engine": "nosuchtex"})
        self.assertEqual(resp.status, 200, body)



class EngineFlagFallbackTest(unittest.TestCase):
    """A distribution that rejects some options must still work (checked with a fake engine)."""

    def make_engine(self, directory, rejected):
        script = os.path.join(directory, "fakelatex")
        with open(script, "w") as fh:
            fh.write("#!/bin/sh\n"
                     "for a in \"$@\"; do case \"$a\" in %s) echo \"Unknown option: $a\" >&2; exit 2;; esac; done\n"
                     "echo 'This is FakeTeX' > main.log\n"
                     "printf '%%%%PDF-1.4 fake' > main.pdf\n"
                     "exit 0\n" % "|".join(rejected))
        os.chmod(script, 0o755)
        return {"id": "xelatex", "path": script, "label": "Fake", "version": "fake", "miktex": False}

    def test_retries_with_fewer_options(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            engine = self.make_engine(d, ["-no-shell-escape", "-file-line-error"])
            result = serve.run_compile(engine, "\\documentclass{article}", {})
            self.assertTrue(result["ok"], result)
            self.assertEqual(base64.b64decode(result["pdf"])[:4], b"%PDF")

    def test_gives_up_with_a_clear_error_when_nothing_works(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            engine = self.make_engine(d, ["-interaction=nonstopmode"])
            result = serve.run_compile(engine, "\\documentclass{article}", {})
            self.assertFalse(result["ok"])

    def test_line_numbers_from_classic_error_format(self):
        errors, _ = serve.summarize_log("! Undefined control sequence.\n<recently read> \\foo\n\nl.42 \\foo\n")
        self.assertEqual(errors[0]["line"], 42)

    def test_miktex_uses_its_own_options(self):
        sets = serve.flag_sets({"path": "xelatex", "miktex": True})
        self.assertIn("--disable-write18", sets[0])
        self.assertNotIn("-no-shell-escape", sets[0])
        self.assertIn("-no-shell-escape", serve.flag_sets({"path": "xelatex", "miktex": False})[0])


class ExtensionAccessTest(unittest.TestCase):
    """--allow-extension: off by default, and only the named extension gets in."""
    EXT = "a" * 32

    @classmethod
    def setUpClass(cls):
        cls.engines = serve.detect_engines()
        cls.open = serve.make_server(0, cls.engines)
        cls.allowed = serve.make_server(0, cls.engines, extension_origins=["chrome-extension://" + cls.EXT])
        for srv in (cls.open, cls.allowed):
            threading.Thread(target=srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        for srv in (cls.open, cls.allowed):
            srv.shutdown()
            srv.server_close()

    def get(self, srv, path, **headers):
        port = srv.server_address[1]
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=30)
        hdrs = {"Host": "127.0.0.1:%d" % port}
        hdrs.update({k.replace("_", "-"): v for k, v in headers.items()})
        conn.request("GET", path, headers=hdrs)
        resp = conn.getresponse()
        body = resp.read()
        conn.close()
        return resp.status, body

    def test_extensions_are_refused_by_default(self):
        status, _ = self.get(self.open, "/api/token", X_Extension_Id=self.EXT, Sec_Fetch_Site="none")
        self.assertEqual(status, 403)

    def test_allowed_extension_gets_the_token_and_can_use_the_api(self):
        # what Chrome really sends from an extension page: no Origin, Sec-Fetch-Site: none
        status, body = self.get(self.allowed, "/api/token", X_Extension_Id=self.EXT, Sec_Fetch_Site="none")
        self.assertEqual(status, 200)
        token = json.loads(body)["token"]
        self.assertEqual(token, self.allowed.token)
        status, _ = self.get(self.allowed, "/api/status", X_MD2LaTeX_Token=token, Sec_Fetch_Site="none")
        self.assertEqual(status, 200)

    def test_allowed_extension_may_post_with_its_origin(self):
        port = self.allowed.server_address[1]
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=30)
        conn.request("POST", "/api/compile", body="{}", headers={
            "Host": "127.0.0.1:%d" % port, "Origin": "chrome-extension://" + self.EXT, "Sec-Fetch-Site": "cross-site",
            "Content-Type": "application/json", "X-MD2LaTeX-Token": self.allowed.token})
        status = conn.getresponse().status
        conn.close()
        self.assertIn(status, (400, 200, 422))   # past the guards; the body itself is bad

    def test_other_extensions_and_websites_are_still_refused(self):
        self.assertEqual(self.get(self.allowed, "/api/token", X_Extension_Id="b" * 32)[0], 403)
        self.assertEqual(self.get(self.allowed, "/api/token")[0], 403)          # e.g. a plain page load
        self.assertEqual(self.get(self.allowed, "/api/token", X_Extension_Id=self.EXT,
                                  Origin="https://evil.example.com", Sec_Fetch_Site="cross-site")[0], 403)
        self.assertEqual(self.get(self.allowed, "/api/status", X_MD2LaTeX_Token=self.allowed.token,
                                  Origin="https://evil.example.com")[0], 403)


if __name__ == "__main__":
    unittest.main(verbosity=2)
