"""Phục vụ dự án dưới /so-tay/ giống GitHub Pages project page. Dùng: python tools/serve.py 8765"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIX = "/so-tay"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
        ".webmanifest": "application/manifest+json", ".webp": "image/webp",
        ".woff2": "font/woff2", ".mp4": "video/mp4", ".png": "image/png",
    }

    def translate_path(self, path):
        p = path.split("?", 1)[0].split("#", 1)[0]
        if p == PREFIX:
            p = "/"
        elif p.startswith(PREFIX + "/"):
            p = p[len(PREFIX):]
        else:
            return os.path.join(ROOT, "__khong_ton_tai__")
        return super().translate_path(p)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128  # mặc định 5 làm Windows từ chối kết nối khi trình duyệt tải song song nhiều module


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = functools.partial(Handler, directory=ROOT)
    print(f"http://127.0.0.1:{port}{PREFIX}/")
    Server(("127.0.0.1", port), handler).serve_forever()
