"""Gộp 4 clip mẫu đã duyệt trong .superpowers/staging2 vào video/, img/ và data/tour.json. Chạy lại an toàn (ghi đè).
mp4 chép nguyên byte; poster (jpg tải về = dữ liệu không tin cậy) chỉ đọc bằng Pillow qua tools/img.py."""
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import img  # noqa: E402  (tools/img.py)

ROOT = os.path.dirname(HERE)
STAGE = os.path.join(ROOT, ".superpowers", "staging2")
DATA = os.path.join(ROOT, "data", "tour.json")
VIDEO = os.path.join(ROOT, "video")
# Tiêu đề tiếng Việt ngắn cho từng clip (tự viết từ ghi chú trong manifest).
TITLES = {
    "co-cung-2": "Tạo dáng bên tường đỏ Cố Cung",
    "thien-dan-2": "Tựa lan can, Kỳ Niên Điện phía sau",
    "universal-1": "Các dáng chụp bên quả địa cầu",
    "di-hoa-vien-3": "Ngồi lan can bên hồ, Phật Hương Các phía xa",
}


def dur(sec):
    s = int(round(sec))
    return f"{s // 60}:{s % 60:02d}"


def main():
    manifest = json.load(open(os.path.join(STAGE, "manifest.json"), encoding="utf-8"))["videos"]
    data = json.load(open(DATA, encoding="utf-8"))
    shots = {s["id"]: s for p in data["places"] for s in p["photo"]["shots"]}
    clip_files = {m["id"] + ".mp4" for m in manifest if m["id"] in shots}
    credits = [c for c in data["credits"] if c["file"] not in clip_files]
    os.makedirs(VIDEO, exist_ok=True)
    used = 0
    for m in manifest:
        sid = m["id"]
        if sid not in shots:
            continue
        shutil.copyfile(os.path.join(STAGE, m["file"]), os.path.join(VIDEO, sid + ".mp4"))
        img.make(os.path.join(STAGE, m["poster"]), sid + "-poster")
        os.remove(os.path.join(ROOT, "img", f"{sid}-poster-160.webp"))  # poster chỉ dùng cỡ 900
        s = shots[sid]
        s["clip"] = sid
        s["clipDur"] = dur(m["durationSec"])
        s["clipTitle"] = TITLES[sid]
        credits.append({"file": sid + ".mp4", "title": m.get("site", "") or "Video sưu tầm", "author": m.get("author", ""),
                        "license": "không rõ (dùng cá nhân)", "url": m.get("sourcePage", ""), "personalUseOnly": True})
        used += 1
    data["credits"] = credits
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(f"Đã gộp {used}/{len(manifest)} clip mẫu")


if __name__ == "__main__":
    main()
