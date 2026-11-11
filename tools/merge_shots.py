"""Gộp ảnh mẫu đã duyệt trong .superpowers/staging2 vào img/ và data/tour.json. Chạy lại an toàn (ghi đè)."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import img  # noqa: E402  (tools/img.py)

ROOT = os.path.dirname(HERE)
STAGE = os.path.join(ROOT, ".superpowers", "staging2")
DATA = os.path.join(ROOT, "data", "tour.json")
# Ghi chú quy trình trong trường author của manifest: không đưa vào chân trang công khai.
NOTES = ("via", "bing", "anonymous", "uncredited", "unknown", "poster")


def main():
    manifest = json.load(open(os.path.join(STAGE, "manifest.json"), encoding="utf-8"))["shots"]
    data = json.load(open(DATA, encoding="utf-8"))
    shots = {s["id"]: s for p in data["places"] for s in p["photo"]["shots"]}
    credits = [c for c in data["credits"] if c["file"] not in shots]
    used = 0
    for m in manifest:
        if not m.get("file") or m["id"] not in shots:
            continue
        img.make(os.path.join(STAGE, m["file"]), m["id"])
        shots[m["id"]]["img"] = m["id"]
        author = m.get("author", "")
        if any(k in author.lower() for k in NOTES):
            author = ""
        credits.append({"file": m["id"], "title": m.get("site", "") or "Ảnh sưu tầm", "author": author,
                        "license": "không rõ (dùng cá nhân)", "url": m.get("sourcePage", ""), "personalUseOnly": True})
        used += 1
    data["credits"] = credits
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(f"Đã gộp {used}/{len(shots)} ảnh mẫu")


if __name__ == "__main__":
    main()
