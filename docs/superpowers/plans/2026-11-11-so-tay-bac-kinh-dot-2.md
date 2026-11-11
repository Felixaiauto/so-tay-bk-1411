# Sổ tay Bắc Kinh — Đợt 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bật tab Địa điểm (danh sách + chi tiết) và tab Chụp ảnh (mục ảnh kiểu tạp chí, story toàn màn hình, thư viện dáng), dùng ảnh mẫu sưu tầm — thanh dưới thành 5 tab.

**Architecture:** Tiếp nối đợt 1 (đọc plan đợt 1 nếu cần hiểu khung). Logic thuần mới ở `js/places.js` (khung giờ của từng địa điểm, nhóm theo ngày) có unit test. Giao diện mới là các module chuỗi-HTML: `views/dia-diem.js`, `views/chup-anh.js`, `components/photo-section.js`, `components/story.js`, `components/poses.js`, `copy.js`. Ảnh mẫu đã được tìm sẵn vào `.superpowers/staging/` và được gộp vào repo bằng `tools/merge_shots.py`.

**Tech Stack:** như đợt 1 (JS module thuần, `node:test`, Playwright Chromium, Python + Pillow).

**Spec:** `docs/superpowers/specs/2026-11-11-so-tay-bac-kinh-design.md` (bản 2), mục 5.2, 5.3, 5.4.

## Global Constraints

- Mọi Global Constraints của plan đợt 1 vẫn áp dụng (đường dẫn `./`, không tài nguyên ngoài lúc chạy, màu, font, cỡ chữ ≥ 14/12px, vùng chạm ≥ 44px, `lang="zh-CN"` cho chữ Hán, overlay đóng bằng Back/Esc/×).
- Thanh dưới chuyển từ 3 sang **5 tab** trong cùng một commit: Lịch trình · Địa điểm · Chụp ảnh · Chuẩn bị · Trợ giúp. Không bao giờ hiện 4 tab.
- Mục Chụp ảnh **không** hiện dòng chữ giải thích ("nguồn sưu tầm", "xem offline", "clip 15 giây"). Nguồn ảnh chỉ ở chân trang.
- Hai nút xem thêm ghi tiếng Việt: **Xem thêm video mẫu** (Douyin) và **Xem thêm ảnh mẫu** (Xiaohongshu); bấm thì đồng thời chép `searchZh` và hiện thông báo "Đã chép từ khóa · dán vào ô tìm kiếm nếu app không tự tìm" trong 3 giây.
- Story: không tự chuyển khung; vùng chạm chia 3 (trái lùi · giữa ẩn/hiện chữ · phải sang), có nút ‹ › nhìn thấy; phím ← →; Esc/Back/× đóng.
- Ảnh khung chưa có ảnh mẫu (`shot.img` rỗng) dùng ảnh lớn của địa điểm (`place.hero`).
- Ảnh sưu tầm trong `credits` có `personalUseOnly: true`.
- Commit kết thúc bằng trailer `Co-Authored-By: <model thực sự viết> <noreply@anthropic.com>`.

## File Structure

```
js/places.js                    placeWindows, whenText, placesByDay (thuần, có test)
js/copy.js                      chép từ khóa + toast (side-effect: lắng nghe [data-copy])
js/components/poses.js          thư viện dáng SVG (chuyển từ bản nháp)
js/components/photo-section.js  mục Chụp ảnh trong trang địa điểm; shotImg, moreLinks
js/components/story.js          story toàn màn hình
js/views/dia-diem.js            renderPlaces, renderPlace, mountPlace
js/views/chup-anh.js            renderPhotos, mountPhotos
js/main.js                      (sửa) FEATURES, VIEWS, route 'place'
css/styles.css                  (thêm) khối CSS đợt 2
tools/merge_shots.py            gộp ảnh staging → img/ + data/tour.json
tests/unit/places.test.js  tests/e2e/places.spec.js  tests/e2e/photos.spec.js
```

---

### Task 1: Khung giờ và nhóm địa điểm theo ngày (`js/places.js`)

**Files:**
- Create: `js/places.js`, `tests/unit/places.test.js`

**Interfaces:**
- Consumes: `fmtDM` từ `js/time.js`; `data/tour.json`.
- Produces: `placeWindows(data, id) → [{date, s, e, optional}]` (gộp các mục cùng ngày: giờ bắt đầu nhỏ nhất – kết thúc lớn nhất; `optional` chỉ true nếu mọi mục ngày đó optional), `whenText(data, id) → string`, `placesByDay(data) → [{date, places: Place[]}]` (mỗi địa điểm xuất hiện một lần, ở ngày đầu tiên nó có mục không-dự-phòng; ngày không có địa điểm mới thì bỏ).

- [ ] **Step 1: Viết test**

`tests/unit/places.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { placeWindows, whenText, placesByDay } from '../../js/places.js';

const data = JSON.parse(fs.readFileSync(new URL('../../data/tour.json', import.meta.url), 'utf8'));

test('một khung', () => assert.equal(whenText(data, 'co-cung'), '17/11 · 08:30–11:15'));
test('hai mục cùng ngày được gộp', () => {
  assert.deepEqual(placeWindows(data, 'universal'), [{ date: '2026-11-15', s: '09:00', e: '17:30', optional: false }]);
  assert.equal(whenText(data, 'universal'), '15/11 · 09:00–17:30');
});
test('hai ngày', () => assert.equal(whenText(data, 'tien-mon'), '14/11 · 17:15–19:30 và 18/11 · 10:15–11:15'));
test('ngày dự phòng ghi trong ngoặc', () =>
  assert.equal(whenText(data, 'bao-tang-tu-nhien'), '14/11 · 15:30–17:00 (dự phòng 18/11 · 08:30–10:00)'));
test('nhóm theo ngày, mỗi điểm một lần, đủ 10 điểm', () => {
  const g = placesByDay(data);
  assert.deepEqual(g.map(x => [x.date, x.places.map(p => p.id)]), [
    ['2026-11-14', ['thien-dan', 'bao-tang-tu-nhien', 'tien-mon']],
    ['2026-11-15', ['universal']],
    ['2026-11-16', ['mo-dien-du', 'di-hoa-vien']],
    ['2026-11-17', ['co-cung', 'canh-son', 'bao-tang-khoa-hoc', 'khu-olympic']],
  ]);
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `node --test tests/unit/places.test.js` → Expected: FAIL — `Cannot find module …/js/places.js`.

- [ ] **Step 3: Viết `js/places.js`**

```js
import { fmtDM } from './time.js';

export function placeWindows(data, id) {
  const byDate = new Map();
  for (const d of data.days) {
    for (const s of d.stops) {
      if (s.place !== id) continue;
      const e = s.e || s.s;
      const w = byDate.get(d.date);
      if (!w) byDate.set(d.date, { date: d.date, s: s.s, e, optional: !!s.optional });
      else {
        if (s.s < w.s) w.s = s.s;
        if (e > w.e) w.e = e;
        w.optional = w.optional && !!s.optional;
      }
    }
  }
  return [...byDate.values()];
}

export function whenText(data, id) {
  const ws = placeWindows(data, id);
  const fmt = w => `${fmtDM(w.date)} · ${w.s}–${w.e}`;
  const main = ws.filter(w => !w.optional).map(fmt).join(' và ');
  const opt = ws.filter(w => w.optional).map(fmt).join(', ');
  return main + (opt ? ` (dự phòng ${opt})` : '');
}

export function placesByDay(data) {
  const seen = new Set();
  const groups = [];
  for (const d of data.days) {
    const places = [];
    for (const s of d.stops) {
      if (!s.place || s.optional || seen.has(s.place)) continue;
      seen.add(s.place);
      places.push(data.places.find(p => p.id === s.place));
    }
    if (places.length) groups.push({ date: d.date, places });
  }
  return groups;
}
```

- [ ] **Step 4: Chạy — PASS**

Run: `npm test` → Expected: tất cả PASS.

- [ ] **Step 5: Commit**

```bash
git add js/places.js tests/unit/places.test.js
git commit -m "feat: khung giờ và nhóm địa điểm theo ngày

Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: Gộp ảnh mẫu sưu tầm vào repo

**Files:**
- Create: `tools/merge_shots.py`
- Modify: `tests/unit/media-refs.test.js` (thêm ảnh khung), `data/tour.json` (sinh: `shots[].img`, `credits`), `img/<shot-id>-160.webp`, `img/<shot-id>-900.webp` (sinh)

**Interfaces:**
- Consumes: `.superpowers/staging/shots.json` (mảng `{id, file|null, personInPhoto, sourcePage, imageUrl, title, author, license, note}`) và `.superpowers/staging/shots/<file>`; `make(src, name)` từ `tools/img.py`.
- Produces: `places[].photo.shots[].img = "<shot-id>"` cho khung có ảnh; mục `credits` mới `{file: shot-id, …, personalUseOnly: true}`.

- [ ] **Step 1: Mở rộng test (fail)**

Thêm vào cuối `tests/unit/media-refs.test.js`:
```js
test('ảnh khung chụp đã gán đều có 2 cỡ và có nguồn ghi "chỉ dùng cá nhân"', () => {
  const shots = data.places.flatMap(p => p.photo.shots).filter(s => s.img);
  assert.ok(shots.length >= 15, `mới có ${shots.length} khung có ảnh mẫu`);
  for (const s of shots) {
    assert.ok(exists(`img/${s.img}-160.webp`) && exists(`img/${s.img}-900.webp`), s.img);
    const c = data.credits.find(x => x.file === s.img);
    assert.ok(c && c.personalUseOnly === true && c.url, `thiếu nguồn cho ${s.img}`);
  }
});
```

Run: `node --test tests/unit/media-refs.test.js` → Expected: FAIL `mới có 0 khung có ảnh mẫu`.

- [ ] **Step 2: Viết `tools/merge_shots.py`**

```python
"""Gộp ảnh mẫu đã duyệt trong .superpowers/staging vào img/ và data/tour.json. Chạy lại an toàn (ghi đè)."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import img  # noqa: E402  (tools/img.py)

ROOT = os.path.dirname(HERE)
STAGE = os.path.join(ROOT, ".superpowers", "staging")
DATA = os.path.join(ROOT, "data", "tour.json")


def main():
    manifest = json.load(open(os.path.join(STAGE, "shots.json"), encoding="utf-8"))
    data = json.load(open(DATA, encoding="utf-8"))
    shots = {s["id"]: s for p in data["places"] for s in p["photo"]["shots"]}
    credits = [c for c in data["credits"] if c["file"] not in shots]
    used = 0
    for m in manifest:
        if not m.get("file") or m["id"] not in shots:
            continue
        img.make(os.path.join(STAGE, "shots", m["file"]), m["id"])
        shots[m["id"]]["img"] = m["id"]
        credits.append({"file": m["id"], "title": m.get("title", ""), "author": m.get("author", ""),
                        "license": m.get("license", ""), "url": m.get("sourcePage", ""), "personalUseOnly": True})
        used += 1
    data["credits"] = credits
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Đã gộp {used}/{len(shots)} ảnh mẫu")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Duyệt nhanh rồi chạy**

Mở `.superpowers/staging/shots.json`, xem từng ảnh được chọn bằng Read tool. Ảnh nào sai địa điểm/xấu/có watermark: đặt `"file": null` cho mục đó trong manifest (khung sẽ dùng ảnh địa điểm). Rồi:
```bash
python tools/merge_shots.py
npm test
```
Expected: `Đã gộp N/25 ảnh mẫu` (N ≥ 15) và tất cả PASS. Nếu N < 15: báo DONE_WITH_CONCERNS kèm danh sách khung thiếu, hạ ngưỡng trong test xuống đúng N (ghi rõ trong report).

- [ ] **Step 4: Commit**

```bash
git add tools/merge_shots.py tests/unit/media-refs.test.js data/tour.json img
git commit -m "feat(data): ảnh mẫu cho các khung chụp (dùng cá nhân, có nguồn)

Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: Tab Địa điểm (danh sách + chi tiết) và chép từ khóa

**Files:**
- Create: `js/copy.js`, `js/views/dia-diem.js`, `js/components/photo-section.js` (bản tối thiểu: chỉ `shotImg`, `photoSectionHtml` trả `''`, `mountPhotoSection` rỗng — Task 4 thay), `tests/e2e/places.spec.js`
- Modify: `js/main.js`, `css/styles.css` (nối thêm khối "Đợt 2 — địa điểm")

**Interfaces:**
- Consumes: `whenText`, `placesByDay` (Task 1); `openDriverCard` (đợt 1); `amapLink`; `esc`, `zh`, `imgTag`.
- Produces: `renderPlaces(ctx)`, `renderPlace(ctx)`, `mountPlace(root, ctx)`; route `#dd-<id>` và `#dd-<id>/chup-anh` (cuộn tới `[data-sec="chup-anh"]`); `toast(msg)`, `copyText(s)`; mọi phần tử có `data-copy="<kw>"` khi bấm sẽ chép `kw` và hiện toast.
- `FEATURES.places = true` nhưng `FEATURES.photos` vẫn `false` ở task này → thanh dưới vẫn 3 tab (truy cập bằng hash). Task 5 bật `photos`.

- [ ] **Step 1: Viết e2e (fail)**

`tests/e2e/places.spec.js`:
```js
import { test, expect } from '@playwright/test';

const NOW = './?now=2026-11-17T09:40';

test('danh sách: 10 địa điểm nhóm theo ngày, có khung giờ', async ({ page }) => {
  await page.goto(`${NOW}#dia-diem`);
  await expect(page.locator('.pl')).toHaveCount(10);
  await expect(page.locator('.pl', { hasText: 'Bảo tàng Lịch sử Tự nhiên' }).locator('.pl-when'))
    .toHaveText('14/11 · 15:30–17:00 (dự phòng 18/11 · 08:30–10:00)');
});

test('chi tiết Cố Cung: ảnh, 2 nút, 3 ô, các mục', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  await expect(page.locator('.pacts a.btn-pri')).toHaveAttribute('href', /^https:\/\/uri\.amap\.com\//);
  await expect(page.locator('.pfacts')).toContainText('17/11 · 08:30–11:15');
  await expect(page.locator('.pfacts')).toContainText('40 tệ');
  for (const k of ['cau-chuyen', 'tham-quan', 'mac-gi', 'luu-y']) await expect(page.locator(`[data-sec="${k}"]`)).toHaveCount(1);
  await expect(page.locator('.swatches li')).toHaveText(['Trắng', 'Kem', 'Be', 'Đen']);
});

test('dải mục dính: bấm "Lưu ý" cuộn tới mục đó', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await page.locator('.pchips button[data-goto="luu-y"]').click();
  await expect(page.locator('[data-sec="luu-y"]')).toBeInViewport();
});

test('thẻ tài xế của địa điểm có tên đầy đủ và chỗ xuống xe', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await page.locator('[data-driver-place]').click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('故宫博物院');
  await expect(dlg).toContainText('Gùgōng Bówùyuàn');
  await expect(dlg.locator('.drv-gate')).toBeVisible();
  await page.goBack();
  await expect(dlg).toHaveCount(0);
  await expect(page).toHaveURL(/#dd-co-cung$/);
});

test('lịch trình dẫn sang địa điểm; nút quay lại về danh sách', async ({ page }) => {
  await page.goto(NOW);
  await page.locator('a.stop-row[href="#dd-co-cung"]').click();
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  await page.locator('.hero-back').click();
  await expect(page.locator('.pl')).toHaveCount(10);
});

test('địa điểm không tồn tại → danh sách', async ({ page }) => {
  await page.goto(`${NOW}#dd-khong-co`);
  await expect(page.locator('.pl')).toHaveCount(10);
});
```

Run: `npx playwright test tests/e2e/places.spec.js` → Expected: FAIL.

- [ ] **Step 2: Viết `js/copy.js`**

```js
let timer = null;

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => { el.hidden = true; }, 3000);
}

export function copyText(s) {
  try { navigator.clipboard?.writeText(s)?.catch(() => {}); } catch { /* không có quyền: bỏ qua */ }
}

document.addEventListener('click', e => {
  const a = e.target.closest('[data-copy]');
  if (!a) return;
  copyText(a.dataset.copy);
  toast('Đã chép từ khóa · dán vào ô tìm kiếm nếu app không tự tìm');
});
```

- [ ] **Step 3: Viết `js/components/photo-section.js` tối thiểu**

```js
export const shotImg = (place, shot) => shot.img || place.hero;
export const photoSectionHtml = () => '';
export const mountPhotoSection = () => {};
```

- [ ] **Step 4: Viết `js/views/dia-diem.js`**

```js
import { esc, zh, imgTag } from '../dom.js';
import { whenText, placesByDay } from '../places.js';
import { fmtDM, dowOf } from '../time.js';
import { amapLink } from '../links.js';
import { openDriverCard } from '../components/driver-card.js';
import { photoSectionHtml, mountPhotoSection } from '../components/photo-section.js';

const SECS = [['cau-chuyen', 'Câu chuyện'], ['tham-quan', 'Tham quan'], ['chup-anh', 'Chụp ảnh'], ['mac-gi', 'Mặc gì'], ['luu-y', 'Lưu ý']];

export function renderPlaces(ctx) {
  const d = ctx.data;
  let h = '<h1 class="view-h">Địa điểm</h1><div class="stack">';
  for (const g of placesByDay(d)) {
    h += `<section><span class="eyebrow">${esc(dowOf(g.date))} ${fmtDM(g.date)}</span><ul class="plist">${g.places.map(p =>
      `<li><a class="pl" href="#dd-${esc(p.id)}">${imgTag(p.hero, 160, '', 'pl-img')}<span class="pl-b"><span class="pl-name">${esc(p.name)} ${zh(p.zh)}</span><span class="pl-when">${esc(whenText(d, p.id))}</span><span class="pl-tag">${esc(p.tag)}</span></span><span class="pl-go" aria-hidden="true">›</span></a></li>`).join('')}</ul></section>`;
  }
  return h + '</div>';
}

export function renderPlace(ctx) {
  const d = ctx.data;
  const p = d.places.find(x => x.id === ctx.route.id);
  if (!p) return renderPlaces(ctx);
  return `<header class="hero hero-place">${imgTag(p.hero, 900, p.heroAlt, 'hero-img', 'eager')}
    <a class="hero-back" href="#dia-diem" aria-label="Tất cả địa điểm">‹</a>
    <div class="hero-in"><h1 class="hero-title">${esc(p.name)}</h1><p class="hero-zh">${zh(p.zh)}</p><p class="hero-sub">${esc(p.tag)}</p></div></header>
  <div class="pacts">
    <a class="btn btn-pri" href="${esc(amapLink(p))}" target="_blank" rel="noopener">Chỉ đường<small>Mở Amap 高德</small></a>
    <button type="button" class="btn btn-sec" data-driver-place>Thẻ tài xế<small>Đưa màn hình</small></button>
  </div>
  <div class="pfacts">
    <div><span>Trong lịch</span><b>${esc(whenText(d, p.id))}</b></div>
    <div><span>Vé / người</span><b>${esc(p.ticket)}</b></div>
    <div><span>Cách mua</span><b>${esc(p.req)}</b></div>
  </div>
  ${p.buy ? `<p class="sub pbuy">Nơi mua vé: ${esc(p.buy)}</p>` : ''}
  <nav class="pchips" aria-label="Mục trong trang">${SECS.map(([k, l]) => `<button type="button" data-goto="${k}">${l}</button>`).join('')}</nav>
  <div class="psecs">
    <section data-sec="cau-chuyen" class="ptxt"><h2 class="sec-h">Câu chuyện</h2>${p.story.map(x => `<p>${esc(x)}</p>`).join('')}</section>
    <section data-sec="tham-quan" class="ptxt"><h2 class="sec-h">Tham quan</h2><ol class="route">${p.route.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
    ${photoSectionHtml(p)}
    <section data-sec="mac-gi" class="ptxt"><h2 class="sec-h">Mặc gì lên hình</h2>${p.wearSwatches.length
      ? `<ul class="swatches">${p.wearSwatches.map(s => `<li><i style="background:${esc(s.hex)}" aria-hidden="true"></i>${esc(s.name)}</li>`).join('')}</ul>` : ''}<p>${esc(p.wear)}</p></section>
    <section data-sec="luu-y" class="ptxt"><h2 class="sec-h">Lưu ý</h2>${p.notes.map(x => `<p class="note">${esc(x)}</p>`).join('')}</section>
  </div>`;
}

export function mountPlace(root, ctx) {
  const p = ctx.data.places.find(x => x.id === ctx.route.id);
  if (!p) return;
  root.querySelector('[data-driver-place]').addEventListener('click', () => openDriverCard(p, ctx.data.contacts.hotel));
  for (const b of root.querySelectorAll('[data-goto]')) {
    b.addEventListener('click', () => root.querySelector(`[data-sec="${b.dataset.goto}"]`)?.scrollIntoView({ block: 'start' }));
  }
  mountPhotoSection(root, p);
  if (ctx.route.section === 'chup-anh') requestAnimationFrame(() => root.querySelector('[data-sec="chup-anh"]')?.scrollIntoView({ block: 'start' }));
}
```

- [ ] **Step 5: Sửa `js/main.js`**

1. Thêm import ở đầu:
```js
import './copy.js';
import { renderPlaces, renderPlace, mountPlace } from './views/dia-diem.js';
```
2. Đổi `FEATURES`:
```js
export const FEATURES = { places: true, photos: false, afterTour: false };
```
3. Thêm vào `VIEWS`:
```js
  'dia-diem': [renderPlaces, () => {}],
  'place': [renderPlace, mountPlace],
```
4. Trong `render()`, thay dòng tính `view` và vòng `for` đánh dấu tab bằng:
```js
  const tabs = enabledTabs(FEATURES);
  const view = route.view === 'place'
    ? (FEATURES.places ? 'place' : 'lich-trinh')
    : (tabs.includes(route.view) || (route.view === 'dia-diem' && FEATURES.places)) && VIEWS[route.view] ? route.view : 'lich-trinh';
  const current = view === 'place' ? 'dia-diem' : view;
```
và trong vòng đánh dấu tab dùng `current` thay cho `view`.

- [ ] **Step 6: Nối CSS vào cuối `css/styles.css`**

```css
/* ===== Đợt 2 — địa điểm ===== */
.plist{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.pl{display:grid;grid-template-columns:88px 1fr auto;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px;text-decoration:none}
.pl-img{width:88px;height:88px;border-radius:10px;object-fit:cover;background:var(--line)}
.pl-b{display:flex;flex-direction:column;gap:2px;min-width:0}
.pl-name{font:700 18px/1.25 var(--f-display)}
.pl-name .han{font:600 14px var(--f-han);color:var(--red)}
.pl-when{font-size:14px;color:var(--gold);font-weight:600}
.pl-tag{font-size:14px;color:var(--muted)}
.pl-go{font-size:22px;color:var(--muted)}
.hero-place{height:260px}
.hero-back{position:absolute;z-index:2;top:12px;left:12px;width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.4);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;text-decoration:none}
.pacts{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 16px 0}
.pacts .btn{flex-direction:column;gap:0;line-height:1.25}
.btn small{display:block;font-size:12px;font-weight:500;opacity:.85}
.pfacts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 16px 0}
.pfacts div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px 10px;min-width:0}
.pfacts span{display:block;font-size:12px;color:var(--muted)}
.pfacts b{display:block;font-size:14px;line-height:1.3;overflow-wrap:anywhere}
.pbuy{padding:8px 16px 0}
.pchips{position:sticky;top:0;z-index:4;display:flex;gap:6px;overflow-x:auto;padding:10px 16px;background:var(--paper);scrollbar-width:none}
.pchips::-webkit-scrollbar{display:none}
.pchips button{flex:none;font-size:14px;font-weight:600;padding:0 14px;min-height:44px;border-radius:99px;border:1px solid var(--line);background:var(--card)}
.psecs{display:flex;flex-direction:column;gap:22px;padding:6px 16px 0}
[data-sec]{scroll-margin-top:72px}
.sec-h{font:700 24px/1.15 var(--f-display);margin-bottom:8px}
.ptxt p{font-size:16px;margin-bottom:8px}
.route{list-style:decimal;padding-left:22px;display:flex;flex-direction:column;gap:8px;font-size:16px}
.swatches{display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:10px}
.swatches li{display:flex;align-items:center;gap:6px;font-size:14px}
.swatches i{width:24px;height:24px;border-radius:50%;border:1px solid var(--line)}
.note{border-left:3px solid var(--gold);background:var(--gold-soft);border-radius:0 10px 10px 0;padding:10px 12px;font-size:15px}
.toast{position:fixed;left:16px;right:16px;bottom:calc(84px + var(--safe-b));z-index:60;max-width:528px;margin:0 auto;background:var(--ink);color:var(--paper);border-radius:12px;padding:12px 14px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.toast[hidden]{display:none}
```

- [ ] **Step 7: Chạy — PASS**

```bash
npx playwright test tests/e2e/places.spec.js
npm run e2e
```
Expected: `places.spec` PASS; các spec đợt 1 vẫn PASS (thanh dưới vẫn 3 tab).

- [ ] **Step 8: Commit**

```bash
git add js/copy.js js/views/dia-diem.js js/components/photo-section.js js/main.js css/styles.css tests/e2e/places.spec.js
git commit -m "feat: tab Địa điểm (danh sách, chi tiết, dải mục, thẻ tài xế)

Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: Mục Chụp ảnh kiểu tạp chí và story toàn màn hình

**Files:**
- Modify: `js/components/photo-section.js` (thay toàn bộ), `css/styles.css` (nối khối "Đợt 2 — chụp ảnh")
- Create: `js/components/story.js`, `tests/e2e/photos.spec.js`

**Interfaces:**
- Consumes: `openOverlay` (đợt 1), `douyinSearch`, `xhsSearch`, `esc`, `imgTag`; `[data-copy]` (Task 3).
- Produces: `shotImg(place, shot)`, `moreLinks(shot) → string`, `photoSectionHtml(place) → string` (section `data-sec="chup-anh"`), `mountPhotoSection(root, place)`, `openStory(place, start) → { ov, current() }`, `storyInner(place, i) → string`. Đợt 3 sẽ chèn khối video vào mỗi khung và nút ▶ trong story.

- [ ] **Step 1: Viết e2e (fail)**

`tests/e2e/photos.spec.js`:
```js
import { test, expect } from '@playwright/test';

const PLACE = './?now=2026-11-17T09:40#dd-co-cung';

test('mục chụp ảnh: tiêu đề, giờ đẹp, ảnh 01, dải 3 ảnh, 3 khung có 3 cột', async ({ page }) => {
  await page.goto(PLACE);
  const s = page.locator('[data-sec="chup-anh"]');
  await expect(s.locator('.psec-h')).toHaveText('Tường đỏ, ngói vàng và một sân đá trống');
  await expect(s.locator('.psec-tip')).toContainText('Giờ đẹp');
  await expect(s.locator('.psec-num')).toHaveText('01');
  await expect(s.locator('.psec-strip button')).toHaveCount(3);
  await expect(s.locator('.pframe')).toHaveCount(3);
  await expect(s.locator('.pframe').first().locator('.pcols b')).toHaveText(['Đứng ở đâu', 'Cầm máy', 'Dáng']);
  await expect(s).not.toContainText('sưu tầm');
});

test('nút xem thêm: tiếng Việt, đúng app, chép từ khóa', async ({ page, context }) => {
  await context.route(/douyin\.com|xiaohongshu\.com/, r => r.abort());
  await page.goto(PLACE);
  const f = page.locator('.pframe').first();
  await expect(f.locator('.pmore a').nth(0)).toHaveText('Xem thêm video mẫu');
  await expect(f.locator('.pmore a').nth(0)).toHaveAttribute('href', /^https:\/\/www\.douyin\.com\/search\//);
  await expect(f.locator('.pmore a').nth(1)).toHaveText('Xem thêm ảnh mẫu');
  await expect(f.locator('.pmore a').nth(1)).toHaveAttribute('href', /^https:\/\/www\.xiaohongshu\.com\/search_result\?keyword=/);
  const popup = page.waitForEvent('popup');
  await f.locator('.pmore a').nth(1).click();
  await (await popup).close();
  await expect(page.locator('#toast')).toHaveText('Đã chép từ khóa · dán vào ô tìm kiếm nếu app không tự tìm');
});

test('story: mở từ dải ảnh, chạm phải/trái, giữa ẩn chữ, phím, Back đóng', async ({ page }) => {
  await page.goto(PLACE);
  await page.locator('.psec-strip button').nth(1).click();
  const st = page.locator('.story');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  const box = await st.boundingBox();
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height * 0.3);
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 3/3');
  await page.mouse.click(box.x + box.width * 0.1, box.y + box.height * 0.3);
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.3);
  await expect(st).toHaveClass(/is-clean/);
  await page.keyboard.press('ArrowRight');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 3/3');
  await expect(st.locator('[data-next]')).toBeDisabled();
  await page.goBack();
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(page).toHaveURL(/#dd-co-cung$/);
});

test('story: Esc đóng, focus trở về ảnh đã chạm', async ({ page }) => {
  await page.goto(PLACE);
  const lead = page.locator('.psec-lead');
  await lead.click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 1/3');
  await page.keyboard.press('Escape');
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(lead).toBeFocused();
});

test('#dd-…/chup-anh cuộn thẳng tới mục chụp ảnh', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung/chup-anh');
  await expect(page.locator('[data-sec="chup-anh"] .psec-h')).toBeInViewport();
});
```

Run: `npx playwright test tests/e2e/photos.spec.js` → Expected: FAIL.

- [ ] **Step 2: Viết `js/components/photo-section.js`**

```js
import { esc, imgTag } from '../dom.js';
import { douyinSearch, xhsSearch } from '../links.js';
import { openStory } from './story.js';

export const shotImg = (place, shot) => shot.img || place.hero;
const num = i => String(i + 1).padStart(2, '0');

export function moreLinks(shot) {
  const kw = esc(shot.searchZh);
  return `<a class="btn btn-pri" href="${esc(douyinSearch(shot.searchZh))}" target="_blank" rel="noopener" data-copy="${kw}">Xem thêm video mẫu</a>
    <a class="btn btn-sec" href="${esc(xhsSearch(shot.searchZh))}" target="_blank" rel="noopener" data-copy="${kw}">Xem thêm ảnh mẫu</a>`;
}

export function photoSectionHtml(place) {
  const P = place.photo, shots = P.shots;
  let h = `<section class="psec" data-sec="chup-anh" aria-labelledby="h-chup-anh-${esc(place.id)}">
    <div class="psec-intro"><span class="eyebrow">Bộ ảnh ${esc(place.name)} · ${shots.length} khung</span>
      <h2 class="psec-h" id="h-chup-anh-${esc(place.id)}">${esc(P.headline)}</h2>
      ${P.bestTime ? `<p class="psec-tip"><b>Giờ đẹp</b><span>${esc(P.bestTime)}</span></p>` : ''}</div>
    <button type="button" class="psec-lead" data-story="0" aria-label="Xem toàn màn hình khung 01: ${esc(shots[0].title)}">${imgTag(shotImg(place, shots[0]), 900, '')}<span class="psec-num">01</span><span class="psec-exp" aria-hidden="true">⤢</span></button>
    <div class="psec-strip">${shots.map((s, i) => `<button type="button" data-story="${i}" aria-label="Khung ${num(i)}: ${esc(s.title)}">${imgTag(shotImg(place, s), 160, '')}<span>${num(i)}</span></button>`).join('')}</div>`;
  shots.forEach((s, i) => {
    h += `<article class="pframe"><span class="pframe-k">Khung ${num(i)}</span><h3 class="pframe-h">${esc(s.title)}</h3>
      <div class="pcols"><div><b>Đứng ở đâu</b>${esc(s.where)}</div><div><b>Cầm máy</b>${esc(s.camera)}</div><div><b>Dáng</b>${esc(s.pose)}</div></div>
      <div class="pmore">${moreLinks(s)}</div></article>`;
  });
  return h + '</section>';
}

export function mountPhotoSection(root, place) {
  for (const b of root.querySelectorAll('[data-story]')) b.addEventListener('click', () => openStory(place, +b.dataset.story));
}
```

- [ ] **Step 3: Viết `js/components/story.js`**

```js
import { esc, imgTag } from '../dom.js';
import { openOverlay } from '../overlay.js';
import { xhsSearch } from '../links.js';

const shotImg = (place, shot) => shot.img || place.hero;

export function storyInner(place, i) {
  const shots = place.photo.shots, s = shots[i], n = shots.length;
  return `<div class="st-img">${imgTag(shotImg(place, s), 900, s.title, '', 'eager')}</div>
    <div class="st-prog" aria-hidden="true">${shots.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="st-hd"><span>${esc(place.name)} · Khung ${i + 1}/${n}</span><button type="button" class="st-x" data-close aria-label="Đóng">×</button></div>
    <button type="button" class="st-nav st-prev" data-prev aria-label="Khung trước"${i === 0 ? ' disabled' : ''}>‹</button>
    <button type="button" class="st-nav st-next" data-next aria-label="Khung sau"${i === n - 1 ? ' disabled' : ''}>›</button>
    <div class="st-bt"><h2 class="st-h">${esc(s.title)}</h2>
      <dl class="st-dl"><dt>Đứng</dt><dd>${esc(s.where)}</dd><dt>Máy</dt><dd>${esc(s.camera)}</dd><dt>Dáng</dt><dd>${esc(s.pose)}</dd></dl>
      <div class="st-pills"><a href="${esc(xhsSearch(s.searchZh))}" target="_blank" rel="noopener" data-copy="${esc(s.searchZh)}">Thêm ảnh mẫu</a></div></div>`;
}

export function openStory(place, start = 0) {
  const n = place.photo.shots.length;
  let i = Math.max(0, Math.min(start, n - 1));
  let root;
  const go = d => {
    const j = i + d;
    if (j < 0 || j >= n) return;
    i = j;
    const clean = root.classList.contains('is-clean');
    root.innerHTML = storyInner(place, i);
    root.classList.toggle('is-clean', clean);
    root.focus();
  };
  const onKey = e => { if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); };
  const ov = openOverlay(`<div class="story" data-story-root tabindex="-1">${storyInner(place, i)}</div>`, {
    label: `Ảnh mẫu ${place.name}`, cls: 'ov-story',
    onClose: () => document.removeEventListener('keydown', onKey),
  });
  root = ov.el.querySelector('[data-story-root]');
  document.addEventListener('keydown', onKey);
  root.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { ov.close(); return; }
    if (e.target.closest('[data-prev]')) { go(-1); return; }
    if (e.target.closest('[data-next]')) { go(1); return; }
    if (e.target.closest('a, button, .st-bt')) return;
    const r = root.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 1 / 3) go(-1);
    else if (x > 2 / 3) go(1);
    else root.classList.toggle('is-clean');
  });
  return { ov, current: () => i };
}
```

- [ ] **Step 4: Nối CSS vào cuối `css/styles.css`**

```css
/* ===== Đợt 2 — chụp ảnh ===== */
.psec{display:flex;flex-direction:column;gap:12px}
.psec-h{font:700 26px/1.12 var(--f-display);margin-top:4px}
.psec-tip{display:flex;gap:8px;align-items:flex-start;font-size:15px;margin-top:6px}
.psec-tip b{flex:none;font-size:12px;font-weight:700;background:var(--gold-soft);color:var(--gold);border-radius:99px;padding:2px 8px;margin-top:2px}
.psec-lead{position:relative;display:block;width:100%;border-radius:6px;overflow:hidden;background:var(--line)}
.psec-lead img{width:100%;aspect-ratio:4/5;object-fit:cover}
.psec-num{position:absolute;right:12px;bottom:4px;font:italic 600 54px/1 var(--f-display);color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.psec-exp{position:absolute;left:10px;top:10px;width:36px;height:36px;border-radius:9px;background:rgba(0,0,0,.45);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px}
.psec-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.psec-strip button{position:relative;border-radius:6px;overflow:hidden;min-height:44px}
.psec-strip img{width:100%;aspect-ratio:1;object-fit:cover;background:var(--line)}
.psec-strip span{position:absolute;left:6px;bottom:4px;color:#fff;font:italic 600 18px/1 var(--f-display);text-shadow:0 1px 6px rgba(0,0,0,.6)}
.pframe{display:flex;flex-direction:column;gap:8px;padding-top:14px;border-top:1px solid var(--line)}
.pframe-k{font:italic 600 15px var(--f-display);color:var(--gold)}
.pframe-h{font:700 20px/1.2 var(--f-display)}
.pcols{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pcols div{font-size:14px;line-height:1.45;border-top:2px solid var(--ink);padding-top:6px;min-width:0}
.pcols b{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:2px}
.pmore{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pmore .btn{font-size:14px;min-height:48px}
@media (max-width:380px){.pcols{grid-template-columns:1fr}}
/* story */
.ov-story{background:#000}
.story{position:relative;height:100%;min-height:100vh;color:#fff;overflow:hidden;outline:none}
.st-img{position:absolute;inset:0}
.st-img img{width:100%;height:100%;object-fit:cover}
.st-img::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 20%,rgba(0,0,0,0) 42%,rgba(10,7,4,.92) 100%);transition:opacity .2s}
.st-prog{position:absolute;top:10px;left:12px;right:12px;display:flex;gap:4px;z-index:2}
.st-prog i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35)}
.st-prog i.on{background:#fff}
.st-hd{position:absolute;top:18px;left:14px;right:8px;z-index:2;display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:600}
.st-x{width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,.4);color:#fff;font-size:26px}
.st-nav{position:absolute;top:40%;z-index:2;width:44px;height:64px;border-radius:12px;background:rgba(0,0,0,.25);color:#fff;font-size:30px}
.st-nav[disabled]{opacity:.25}
.st-prev{left:6px}.st-next{right:6px}
.st-bt{position:absolute;left:16px;right:16px;bottom:calc(20px + var(--safe-b));z-index:2;display:flex;flex-direction:column;gap:8px}
.st-h{font:700 26px/1.12 var(--f-display)}
.st-dl{display:grid;grid-template-columns:64px 1fr;gap:4px 10px;font-size:14px}
.st-dl dt{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-hi);font-weight:700;padding-top:2px}
.st-pills{display:flex;gap:8px;flex-wrap:wrap}
.st-pills a,.st-pills button{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:99px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3)}
.story.is-clean .st-bt,.story.is-clean .st-hd span,.story.is-clean .st-nav{opacity:0;pointer-events:none}
.story.is-clean .st-img::after{opacity:0}
@media (prefers-reduced-motion:reduce){.st-img::after{transition:none}}
```

- [ ] **Step 5: Chạy — PASS**

```bash
npx playwright test tests/e2e/photos.spec.js
npm run e2e
```
Expected: tất cả PASS.

- [ ] **Step 6: Commit**

```bash
git add js/components/photo-section.js js/components/story.js css/styles.css tests/e2e/photos.spec.js
git commit -m "feat: mục Chụp ảnh kiểu tạp chí và story toàn màn hình

Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Tab Chụp ảnh, thư viện dáng, bật 5 tab

**Files:**
- Create: `js/components/poses.js`, `js/views/chup-anh.js`
- Modify: `js/main.js` (FEATURES.photos = true; VIEWS thêm 'chup-anh'), `css/styles.css` (nối khối "Đợt 2 — tab chụp ảnh"), `tests/e2e/shell.spec.js` (3 → 5 tab), `tests/e2e/photos.spec.js` (thêm test tab)

**Interfaces:**
- Consumes: `placesByDay` (Task 1), `openStory`, `shotImg` (Task 4), `data.poses[] = {id, label, fig}`.
- Produces: `poseLibraryHtml(poses) → string`, `renderPhotos(ctx)`, `mountPhotos(root, ctx)`.

- [ ] **Step 1: Sửa/viết e2e (fail)**

Trong `tests/e2e/shell.spec.js`:
- test "không gọi tài nguyên ngoài": đổi `toHaveCount(3)` thành `toHaveCount(5)`.
- đổi tên test "đợt 1: 3 tab…" thành "5 tab, chuyển tab theo hash, đánh dấu tab hiện tại" và đổi kỳ vọng nhãn thành:
```js
  await expect(page.locator('#tabs a')).toHaveText(['Lịch trình', 'Địa điểm', 'Chụp ảnh', 'Chuẩn bị', 'Trợ giúp']);
```
- thay test "hash địa điểm khi chưa bật đợt 2 → về Lịch trình" bằng:
```js
test('hash địa điểm → trang địa điểm, tab Địa điểm được đánh dấu', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung');
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  await expect(page.locator('#tabs a[data-v="dia-diem"]')).toHaveAttribute('aria-current', 'page');
});
```

Nối vào cuối `tests/e2e/photos.spec.js`:
```js
test('tab Chụp ảnh: thư viện 9 dáng, 10 bộ ảnh theo ngày, mở story, dẫn tới chỉ dẫn đầy đủ', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#chup-anh');
  await expect(page.locator('.poses > div')).toHaveCount(9);
  await expect(page.locator('.pcover')).toHaveCount(10);
  await page.locator('[data-open-story="mo-dien-du"]').click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Vạn Lý Trường Thành · Mộ Điền Dụ · Khung 1/3');
  await page.keyboard.press('Escape');
  await page.locator('.pcover', { hasText: 'Cố Cung' }).locator('a.link').click();
  await expect(page).toHaveURL(/#dd-co-cung\/chup-anh$/);
  await expect(page.locator('[data-sec="chup-anh"] .psec-h')).toBeInViewport();
});
```

Run: `npm run e2e` → Expected: FAIL (shell + tab Chụp ảnh).

- [ ] **Step 2: Viết `js/components/poses.js` (nét vẽ chuyển nguyên từ bản nháp)**

```js
import { esc } from '../dom.js';

const FIG = {
  dung: 'M20 17L20 46M20 23L12 40M20 23L28 40M20 46L15 77M20 46L25 77',
  buoc: 'M20 17L21 46M20 23L11 37M20 23L30 39M21 46L11 76M21 46L31 75',
  giotay: 'M20 17L20 46M20 23L32 7M20 23L12 40M20 46L15 77M20 46L25 77',
  dangtay: 'M20 17L20 46M20 24L3 13M20 24L37 13M20 46L12 77M20 46L28 77',
  ngoi: 'M18 17L18 44M18 24L29 38M18 44L33 46L33 70',
  tua: 'M17 17L22 46M18 24L33 31M22 46L17 77M22 46L31 76',
};
const PROP = { ngoi: 'M4 50L24 50L24 77', tua: 'M30 32L40 32M36 32L36 77' };

function fig(pose, cx, base, h) {
  if (pose === 'nhom') return fig('dung', cx - h * 0.36, base, h * 0.9) + fig('giotay', cx, base, h) + fig('dung', cx + h * 0.33, base, h * 0.62);
  const s = h / 80, hx = pose === 'ngoi' ? 18 : pose === 'tua' ? 17 : 20;
  return `<g transform="translate(${(cx - 20 * s).toFixed(1)},${(base - 78 * s).toFixed(1)}) scale(${s.toFixed(3)})" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + (PROP[pose] ? `<path d="${PROP[pose]}" stroke="var(--muted)" stroke-width="3"/>` : '')
    + `<path d="${FIG[pose]}" stroke="var(--ink)" stroke-width="5"/><circle cx="${hx}" cy="9" r="7" fill="var(--ink)"/></g>`;
}

export function poseLibraryHtml(poses) {
  return `<div class="card"><span class="eyebrow">Dáng chụp dễ làm</span><div class="poses">${poses.map(p =>
    `<div><svg viewBox="0 0 60 84" aria-hidden="true">${fig(p.fig, 30, 82, p.id === 'nhom' ? 62 : 78)}</svg><span>${esc(p.label)}</span></div>`).join('')}</div>
    <p class="sub">Mặc áo dày nên dáng dễ bị cứng. Đứng chân trước chân sau, xoay người 45° so với máy, cằm hơi hạ và nhìn ra xa thay vì nhìn thẳng ống kính. Khăn quàng, mũ hoặc cốc cà phê giúp tay có việc để làm.</p></div>`;
}
```

- [ ] **Step 3: Viết `js/views/chup-anh.js`**

```js
import { esc, imgTag } from '../dom.js';
import { placesByDay } from '../places.js';
import { fmtDM, dowOf } from '../time.js';
import { poseLibraryHtml } from '../components/poses.js';
import { openStory } from '../components/story.js';
import { shotImg } from '../components/photo-section.js';

export function renderPhotos(ctx) {
  const d = ctx.data;
  let h = `<h1 class="view-h">Chụp ảnh</h1><div class="stack">${poseLibraryHtml(d.poses)}`;
  for (const g of placesByDay(d)) {
    h += `<section class="pday"><span class="eyebrow">${esc(dowOf(g.date))} ${fmtDM(g.date)}</span>${g.places.map(p =>
      `<article class="pcover"><button type="button" class="pcover-img" data-open-story="${esc(p.id)}" aria-label="Xem bộ ảnh ${esc(p.name)}">${imgTag(shotImg(p, p.photo.shots[0]), 900, '')}<span class="pcover-n">${p.photo.shots.length} khung</span></button>
        <div class="pcover-b"><h2 class="pcover-h">${esc(p.photo.headline)}</h2><p class="sub">${esc(p.name)}</p><a class="link" href="#dd-${esc(p.id)}/chup-anh">Xem chỉ dẫn đầy đủ</a></div></article>`).join('')}</section>`;
  }
  return h + '</div>';
}

export function mountPhotos(root, ctx) {
  for (const b of root.querySelectorAll('[data-open-story]')) {
    b.addEventListener('click', () => openStory(ctx.data.places.find(p => p.id === b.dataset.openStory), 0));
  }
}
```

- [ ] **Step 4: Sửa `js/main.js`**

```js
import { renderPhotos, mountPhotos } from './views/chup-anh.js';
```
`FEATURES` thành `{ places: true, photos: true, afterTour: false }`; thêm `'chup-anh': [renderPhotos, mountPhotos],` vào `VIEWS`.

- [ ] **Step 5: Nối CSS**

```css
/* ===== Đợt 2 — tab chụp ảnh ===== */
.poses{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 8px}
.poses div{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}
.poses svg{width:54px;height:76px}
.poses span{font-size:13px;line-height:1.3;color:var(--muted)}
.pday{display:flex;flex-direction:column;gap:12px}
.pcover{display:flex;flex-direction:column;gap:8px}
.pcover-img{position:relative;display:block;width:100%;border-radius:6px;overflow:hidden;background:var(--line)}
.pcover-img img{width:100%;aspect-ratio:3/2;object-fit:cover}
.pcover-n{position:absolute;right:10px;bottom:10px;font-size:12px;font-weight:600;background:rgba(0,0,0,.55);color:#fff;border-radius:99px;padding:3px 10px}
.pcover-h{font:700 22px/1.15 var(--f-display)}
.pcover-b .link{display:inline-flex;align-items:center;min-height:44px}
```

- [ ] **Step 6: Chạy toàn bộ — PASS**

```bash
npm test && npm run e2e
```
Expected: tất cả PASS, thanh dưới 5 tab.

- [ ] **Step 7: Commit**

```bash
git add js/components/poses.js js/views/chup-anh.js js/main.js css/styles.css tests/e2e/shell.spec.js tests/e2e/photos.spec.js
git commit -m "feat: tab Chụp ảnh, thư viện dáng, thanh dưới 5 tab

Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: Đăng cập nhật đợt 2

**Files:**
- Modify: `data/tour.json` (`version` tăng, ví dụ `2026-11-12c`), `assets.js` (sinh lại)

- [ ] **Step 1:** Tăng `version` trong `data/tour.json`; chạy `python tools/gen_assets.py`, `npm test`, `npm run test:py`, `npm run e2e` — tất cả PASS (gồm `offline.spec.js` với ảnh mới).
- [ ] **Step 2:** Commit `chore: đăng đợt 2` và `git push` (repo/host đã được anh chọn ở đợt 1). Kiểm tra URL thật trả 200 cho `index.html`, `assets.js`, một ảnh khung mới.
- [ ] **Step 3:** Nhắn anh: mở lại biểu tượng sổ tay khi có wifi → thấy "Đã cập nhật lịch" và 5 tab.

## Self-review (đã chạy)

- Phủ spec: §5.2 danh sách + chi tiết (T3) · §5.3 mục Chụp ảnh, nút xem thêm + chép từ khóa, story chia 3 vùng, phím, Back/Esc (T3, T4) · §5.4 tab Chụp ảnh + thư viện dáng + "Xem chỉ dẫn đầy đủ" (T5) · ảnh sưu tầm có nguồn, `personalUseOnly` (T2) · không bao giờ 4 tab (T3 giữ 3, T5 bật 5 trong một commit).
- Tên nhất quán: `shotImg`, `openStory(place, start)`, `photoSectionHtml(place)`, `mountPhotoSection(root, place)`, `placesByDay`, `whenText` dùng giống nhau ở T1–T5. `story.js` tự định nghĩa `shotImg` cục bộ để tránh vòng import với `photo-section.js`.
- Đợt 3 (video, thẻ Sau tour) ở plan riêng; điểm nối: khối video trong `.pframe`, nút ▶ trong `.st-pills`, `FEATURES.afterTour`.
