"""Biểu tượng: nền #1E1A16, chữ 北京 màu #F2C14E, khung ấn đỏ son. Cần font Microsoft YaHei (Windows)."""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = next(p for p in ["C:/Windows/Fonts/msyhbd.ttc", "C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simhei.ttf"] if os.path.exists(p))


def icon(size, path):
    im = Image.new("RGB", (size, size), "#1E1A16")
    d = ImageDraw.Draw(im)
    pad = size * 0.22
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size * 0.06, outline="#B4301C", width=max(2, size // 40))
    f = ImageFont.truetype(FONT, int(size * 0.24))
    d.text((size / 2, size / 2), "北京", font=f, fill="#F2C14E", anchor="mm")
    im.save(path)


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "icons"), exist_ok=True)
    icon(192, os.path.join(ROOT, "icons", "icon-192.png"))
    icon(512, os.path.join(ROOT, "icons", "icon-512.png"))
    icon(180, os.path.join(ROOT, "icons", "apple-touch-icon.png"))
    print("ok")
