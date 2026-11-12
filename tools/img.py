"""Ảnh → WebP 2 cỡ: <ten>-900.webp là bản lớn (tối đa 1600×2000, không phóng to; tên giữ "900" cho khỏi đổi code), <ten>-160.webp là ô vuông nhỏ.
  python tools/img.py <tep-anh> <ten>        : một ảnh có sẵn
  python tools/img.py --commons              : tải lại ảnh Wikimedia trong credits (bỏ qua nguồn "chỉ dùng cá nhân" và URL không phải /wiki/File:) rồi chuyển
Tệp tải về đặt trong thư mục tạm riêng (dữ liệu không tin cậy), không đặt trong repo."""
import json
import os
import sys
import tempfile
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "img")
UA = "so-tay-bac-kinh/1.0 (personal trip handbook)"


def make(src, name):
    os.makedirs(OUT, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    big = im.copy()
    big.thumbnail((1600, 2000), Image.LANCZOS)
    big.save(os.path.join(OUT, f"{name}-900.webp"), "WEBP", quality=84, method=6)
    ImageOps.fit(im, (160, 160), Image.LANCZOS).save(os.path.join(OUT, f"{name}-160.webp"), "WEBP", quality=75, method=6)
    print(name, big.size)


def commons(data=None):
    if data is None:
        data = json.load(open(os.path.join(ROOT, "data", "tour.json"), encoding="utf-8"))
    base = os.path.join(tempfile.gettempdir(), "so-tay-raw")
    for c in data["credits"]:
        if c.get("personalUseOnly") or "/wiki/File:" not in c.get("url", ""):
            continue
        title = urllib.parse.unquote(c["url"].split("/wiki/File:", 1)[1])
        url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(title) + "?width=1600"
        d = os.path.join(base, c["file"])
        os.makedirs(d, exist_ok=True)
        dst = os.path.join(d, "src.jpg")
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r, open(dst, "wb") as f:
            f.write(r.read())
        make(dst, c["file"])


if __name__ == "__main__":
    if sys.argv[1:] == ["--commons"]:
        commons()
    elif len(sys.argv) == 3:
        make(sys.argv[1], sys.argv[2])
    else:
        sys.exit(__doc__)
