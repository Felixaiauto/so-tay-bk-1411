"""Sinh assets.js (danh sách tệp cần lưu offline + VERSION theo nội dung). Chạy trước mỗi lần đăng: python tools/gen_assets.py"""
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_FILES = ["index.html", "manifest.webmanifest", "assets.js"]
APP_DIRS = ["css", "js", "data", "fonts", "icons"]
MEDIA_DIRS = ["img", "video"]


def walk(root, dirs):
    out = []
    for d in dirs:
        base = os.path.join(root, d)
        for dp, dns, fns in os.walk(base):
            dns[:] = sorted(x for x in dns if not x.startswith("."))
            for fn in sorted(fns):
                if fn.startswith("."):
                    continue
                out.append(os.path.relpath(os.path.join(dp, fn), root).replace(os.sep, "/"))
    return sorted(out)


def digest(root, rels):
    h = hashlib.sha256()
    for rel in rels:
        if rel == "assets.js":
            continue
        h.update(rel.encode())
        with open(os.path.join(root, rel), "rb") as f:
            h.update(f.read())
    return h.hexdigest()[:10]


def build(root=ROOT):
    app_rel = [f for f in APP_FILES if os.path.exists(os.path.join(root, f))] + walk(root, APP_DIRS)
    media_rel = walk(root, MEDIA_DIRS)
    return {
        "app": {"version": digest(root, app_rel), "files": ["./"] + ["./" + r for r in app_rel]},
        "media": {"version": digest(root, media_rel), "files": ["./" + r for r in media_rel]},
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # console Windows cp1252 không in được tiếng Việt
    a = build()
    with open(os.path.join(ROOT, "assets.js"), "w", encoding="utf-8") as f:
        f.write("self.ASSETS = " + json.dumps(a, ensure_ascii=False, indent=1) + ";\n")
    print(f"app {a['app']['version']} ({len(a['app']['files'])} tệp) · media {a['media']['version']} ({len(a['media']['files'])} tệp)")


if __name__ == "__main__":
    main()
