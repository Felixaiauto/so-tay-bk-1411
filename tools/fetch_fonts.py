"""Tải woff2 từ Google Fonts MỘT LẦN lúc soạn, ghi css/fonts.css trỏ tệp nội bộ. Lúc chạy trang không gọi Google."""
import hashlib
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = ("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600"
       "&family=Be+Vietnam+Pro:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
KEEP = {"vietnamese", "latin-ext", "latin"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    os.makedirs(os.path.join(ROOT, "fonts"), exist_ok=True)
    css = get(URL).decode("utf-8")
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face\s*\{[^}]*\})", css)
    saved, out = {}, []
    for subset, block in blocks:
        if subset not in KEEP:
            continue
        fam = re.search(r"font-family: '([^']+)'", block).group(1)
        italic = "font-style: italic" in block
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        if url not in saved:
            slug = fam.lower().replace(" ", "-") + ("-italic" if italic else "")
            name = f"{slug}-{subset}-{hashlib.sha1(url.encode()).hexdigest()[:6]}.woff2"
            with open(os.path.join(ROOT, "fonts", name), "wb") as f:
                f.write(get(url))
            saved[url] = name
        out.append(f"/* {subset} */\n" + block.replace(url, f"../fonts/{saved[url]}"))
    with open(os.path.join(ROOT, "css", "fonts.css"), "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print(f"{len(out)} @font-face, {len(saved)} tệp woff2")


if __name__ == "__main__":
    main()
