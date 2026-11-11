# Sổ tay Bắc Kinh — Đợt 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đăng được bản sổ tay chạy offline gồm Lịch trình (sống theo giờ Bắc Kinh), Thẻ tài xế, Trợ giúp, Chuẩn bị — đủ dùng thật ở Trung Quốc — trước tối 12/11/2026.

**Architecture:** Trang tĩnh, JavaScript thuần dạng ES module, không có bước build. Logic thuần (giờ, trạng thái ảnh lớn, liên kết, router, lưu đánh dấu) tách thành module riêng, kiểm thử bằng `node --test`. Giao diện render bằng chuỗi HTML trong `js/views/*`. Service worker lưu 2 kho (`app-*`, `media-*`) theo danh sách tệp do `tools/gen_assets.py` sinh ra. Dữ liệu chuyển một lần từ bản nháp sang `data/tour.json` bằng `tools/port_draft.mjs`.

**Tech Stack:** HTML/CSS/JS (ES2020, module), Service Worker + Cache API, Node 24 `node:test`, Python 3.12 (Pillow, urllib, unittest), Playwright 1.65 (Chromium), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-11-so-tay-bac-kinh-design.md` (bản 2). Đọc spec trước khi làm bất kỳ task nào.

## Global Constraints

- Mọi đường dẫn tương đối `./…` (trang chạy dưới `/<repo>/` trên GitHub Pages). Không có đường dẫn bắt đầu bằng `/`.
- Lúc chạy **không** gọi tài nguyên ngoài (không Google Fonts, CDN, ảnh Wikimedia). Liên kết ra ngoài chỉ là `<a href>` do người dùng bấm (Amap, Zalo, `tel:`).
- Màu: nền `#F5F0E6`, mặt thẻ `#FFFDF8`, chữ `#1E1A16`, chữ phụ `#6E6253`, viền `#E3D9C6`, nhãn vàng `#7A5C22`, vàng sáng `#F2C14E` (chỉ trên nền `#1E1A16`), đỏ son `#B4301C`. Ô ngày: nền `#FFFFFF`, viền `#D3DAE2`, số `#131B25`, thứ `#566373`.
- Font: Playfair Display 600/700/Italic 600 (tiêu đề), Be Vietnam Pro 400–700 (thân bài), Barlow Condensed 600/700 (số ngày/giờ trên ô ngày). Subset latin + latin-ext + vietnamese. Chữ Hán dùng font hệ thống, mọi đoạn chữ Hán có `lang="zh-CN"`.
- Thân bài ≥ 14px, nhãn phụ ≥ 12px, vùng chạm ≥ 44×44px, viền focus luôn hiện.
- Giờ Bắc Kinh = UTC+8, tính từ đồng hồ máy. Tham số kiểm thử `?now=YYYY-MM-DDTHH:MM` hiểu là giờ Bắc Kinh.
- Đợt 1 thanh dưới có **3 tab**: Lịch trình · Chuẩn bị · Trợ giúp. Địa điểm + Chụp ảnh bật cùng nhau ở đợt 2 (không bao giờ hiện 4 tab).
- Overlay (thẻ tài xế, câu phóng to) mở bằng `history.pushState`; Back/Esc/× đều đóng overlay, không thoát trang.
- Commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Structure

```
d:\Landtour\
├─ index.html                 khung trang, thanh offline, main, footer, tabbar
├─ .nojekyll  .gitignore  package.json  playwright.config.js
├─ manifest.webmanifest
├─ assets.js                  SINH bởi tools/gen_assets.py (self.ASSETS)
├─ sw.js                      service worker
├─ sw-range.js                parseRange() cho video (classic script, importScripts)
├─ css/fonts.css              SINH bởi tools/fetch_fonts.py
├─ css/styles.css             token + component
├─ js/
│  ├─ main.js                 boot, render theo route, tabs, tick mỗi phút
│  ├─ router.js               parseHash(), TABS
│  ├─ time.js                 bjNow, stopWindow, currentAndNext, firstStop, stopStatus, dowOf…
│  ├─ hero.js                 heroState(), deg(), stopLabel()
│  ├─ links.js                amapLink, douyinSearch, xhsSearch, telHref
│  ├─ store.js                get/set dấu tích localStorage
│  ├─ dom.js                  esc, zh, imgTag
│  ├─ overlay.js              openOverlay, overlayOpen
│  ├─ offline.js              initOffline, checkSaved, notifyVersion
│  ├─ components/driver-card.js
│  └─ views/lich-trinh.js  views/chuan-bi.js  views/tro-giup.js
├─ data/tour.json             SINH lần đầu bởi tools/port_draft.mjs, sau đó sửa tay
├─ img/  fonts/  icons/
├─ tools/
│  ├─ draft/script.js         bản sao JS của bản nháp (nguồn dữ liệu)
│  ├─ port_draft.mjs  serve.py  gen_assets.py  fetch_fonts.py  img.py  make_icons.py
└─ tests/
   ├─ unit/*.test.js          node --test
   ├─ py/test_gen_assets.py   python -m unittest
   └─ e2e/*.spec.js           playwright
```

---

### Task 1: Khung repo, máy chủ thử, bộ kiểm thử

**Files:**
- Create: `.gitignore`, `.nojekyll`, `package.json`, `playwright.config.js`, `tools/serve.py`, `index.html` (tạm), `tests/e2e/smoke.spec.js`

**Interfaces:**
- Produces: máy chủ `python tools/serve.py 8765` phục vụ dự án tại `http://127.0.0.1:8765/so-tay/` (giả lập project page GitHub). Lệnh `npm test` (unit), `npm run e2e` (Playwright).

- [ ] **Step 1: Khởi tạo git và các tệp cấu hình**

```bash
cd /d/Landtour && git init -b main
```

`.gitignore`:
```
node_modules/
.superpowers/
test-results/
playwright-report/
__pycache__/
```

`.nojekyll`: tệp rỗng.

`package.json`:
```json
{
  "name": "so-tay-bac-kinh",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/unit/",
    "test:py": "python -m unittest discover -s tests/py -v",
    "e2e": "playwright test",
    "serve": "python tools/serve.py 8765"
  },
  "devDependencies": {
    "@playwright/test": "1.65.0"
  }
}
```

`playwright.config.js`:
```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:8765/so-tay/', serviceWorkers: 'allow' },
  webServer: {
    command: 'python tools/serve.py 8765',
    url: 'http://127.0.0.1:8765/so-tay/',
    reuseExistingServer: true,
  },
  projects: [{ name: 'android', use: { ...devices['Pixel 7'] } }],
});
```

`tools/serve.py`:
```python
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


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = functools.partial(Handler, directory=ROOT)
    print(f"http://127.0.0.1:{port}{PREFIX}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
```

`index.html` (tạm, Task 6 thay):
```html
<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><title>Sổ tay đoàn Bắc Kinh</title></head>
<body><main id="app">Đang dựng</main></body></html>
```

- [ ] **Step 2: Viết smoke test**

`tests/e2e/smoke.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('trang mở được dưới /so-tay/', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Sổ tay đoàn Bắc Kinh');
});
```

- [ ] **Step 3: Cài và chạy**

```bash
npm install
npx playwright install chromium
npm run e2e
```
Expected: `1 passed`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore .nojekyll package.json package-lock.json playwright.config.js tools/serve.py index.html tests/e2e/smoke.spec.js docs/
git commit -m "chore: khung repo, máy chủ thử /so-tay/, Playwright

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Chuyển dữ liệu bản nháp sang `data/tour.json`

**Files:**
- Create: `tools/draft/script.js` (bản sao), `tools/port_draft.mjs`, `data/tour.json` (sinh ra), `tests/unit/tour-data.test.js`

**Interfaces:**
- Produces: `data/tour.json` đúng schema spec §6. Các trường mọi task sau dùng: `version`, `tour.{id,title,start,end,brand,checkedOn}`, `contacts.{hotel,driver,hotline,zalo,flightBack,embassy}`, `days[].{date,lo,hi,wx,heroPlace,stops[]}`, `stops[].{id,s,e,k,kind,title,zh,sub,place,flag,optional,airport,thumb,thumbNote,addressZh,addressVi,lat,lng}`, `places[].{id,name,zh,zhFull,pinyin,tag,hero,heroAlt,dur,ticket,req,buy,addressZh,addressVi,dropOffZh,dropOffVi,lat,lng,story,route,wear,wearSwatches,notes,photo}`, `prepTasks[]`, `checklist[]`, `wearGeneral[]`, `prepNotes[]`, `phrases[]`, `poses[]`, `afterTour.tours[]`, `credits[]`.

- [ ] **Step 1: Sao bản nháp vào repo**

```bash
mkdir -p tools/draft
cp "C:/Users/Admin/AppData/Local/Temp/claude/99d3df085d8d54dc/13fb58a3-9f54-4f2e-9079-c01b3e1b69b3/scratchpad/script.js" tools/draft/script.js
```
Nếu tệp không còn: đọc lại artifact `https://claude.ai/artifact/6DdzuyA8UnxMWe8oDXutKx` bằng `mcp__claude-artifacts__read_artifact`, cắt khối `<script>…</script>` lưu vào `tools/draft/script.js`.

- [ ] **Step 2: Viết test schema (sẽ fail vì chưa có tour.json)**

`tests/unit/tour-data.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync(new URL('../../data/tour.json', import.meta.url), 'utf8'));
const placeIds = new Set(data.places.map(p => p.id));
const allStops = data.days.flatMap(d => d.stops);

test('5 ngày liên tiếp 14–18/11', () => {
  assert.deepEqual(data.days.map(d => d.date), ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18']);
  assert.equal(data.tour.start, '2026-11-14');
  assert.equal(data.tour.end, '2026-11-18');
  assert.match(data.version, /^\d{4}-\d{2}-\d{2}[a-z]$/);
});

test('điểm dừng: id duy nhất, giờ HH:MM, loại hợp lệ, theo thứ tự giờ', () => {
  const ids = allStops.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of allStops) {
    assert.match(s.s, /^\d{2}:\d{2}$/, s.id);
    if (s.e) assert.match(s.e, /^\d{2}:\d{2}$/, s.id);
    assert.ok(['sight', 'meal', 'cafe', 'move'].includes(s.k), s.id);
  }
  for (const d of data.days) {
    const t = d.stops.map(s => s.s);
    assert.deepEqual(t, [...t].sort(), d.date);
  }
});

test('tham chiếu địa điểm tồn tại', () => {
  for (const d of data.days) assert.ok(placeIds.has(d.heroPlace), d.date);
  for (const s of allStops) if (s.place) assert.ok(placeIds.has(s.place), s.id);
});

test('chỉ Bảo tàng Tự nhiên ngày 18 là dự phòng', () => {
  const opt = allStops.filter(s => s.optional).map(s => s.id);
  assert.equal(opt.length, 1);
  const s = allStops.find(x => x.optional);
  assert.equal(s.place, 'bao-tang-tu-nhien');
  assert.ok(s.id.startsWith('d18-'));
});

test('không trùng ảnh nhỏ trong cùng ngày', () => {
  for (const d of data.days) {
    const t = d.stops.map(s => s.thumb).filter(Boolean);
    assert.equal(new Set(t).size, t.length, d.date);
  }
});

test('mục ra sân bay đánh dấu airport và không có sub cứng', () => {
  const a = allStops.filter(s => s.airport);
  assert.equal(a.length, 1);
  assert.equal(a[0].sub, '');
});

test('địa điểm có đủ thông tin thẻ tài xế và bộ ảnh', () => {
  assert.equal(data.places.length, 10);
  for (const p of data.places) {
    assert.ok(p.zhFull && p.pinyin && p.addressZh && p.addressVi, p.id);
    assert.ok(p.hero, p.id);
    assert.ok(p.photo.shots.length >= 2, p.id);
    for (const s of p.photo.shots) assert.ok(s.id && s.title && s.searchZh, s.id);
  }
});

test('danh sách việc và đồ cần mang có id cố định duy nhất', () => {
  for (const key of ['prepTasks', 'checklist']) {
    const ids = data[key].map(x => x.id);
    assert.ok(ids.length > 0, key);
    assert.equal(new Set(ids).size, ids.length, key);
    for (const x of data[key]) assert.match(x.id, /^[a-z0-9-]+$/, key);
  }
});

test('liên hệ: đại sứ quán có địa chỉ chữ Hán', () => {
  assert.equal(data.contacts.embassy.zh, '越南大使馆');
  assert.ok(data.contacts.embassy.addressZh);
  assert.ok('hotel' in data.contacts && 'driver' in data.contacts && 'flightBack' in data.contacts);
});
```

- [ ] **Step 3: Chạy để thấy fail**

Run: `npm test`
Expected: FAIL — `ENOENT … data/tour.json`.

- [ ] **Step 4: Viết script chuyển dữ liệu**

`tools/port_draft.mjs`:
```js
// Chạy một lần: node tools/port_draft.mjs  → ghi data/tour.json
// Sau đó data/tour.json là nguồn sự thật, sửa tay; KHÔNG chạy lại script này đè lên.
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('./draft/script.js', import.meta.url), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(src.slice(src.indexOf('var TMIN'), src.indexOf('/* ---------- Tiện ích')), ctx);
vm.runInContext(src.match(/var POSE=\{[^\n]*\};/)[0], ctx);
const s0 = src.indexOf('var SHOTS={');
vm.runInContext(src.slice(s0, src.indexOf('\n};', s0) + 3), ctx);
const { DAYS, PLACES, PIMG, CRED, CHECKS, POSE, SHOTS } = ctx;

const HERO_DAY = { 14: 'thien-dan', 15: 'universal', 16: 'mo-dien-du', 17: 'co-cung', 18: 'tien-mon' };
const FOOD = new Set(['thieu-mai', 'dimsum']);
const STOP_EXTRA = {
  'Đô Nhất Xứ · thiêu mại': { addressZh: '北京市东城区前门大街38号', addressVi: 'Số 38 phố Tiền Môn, quận Đông Thành' },
};
const SW_CC = [{ hex: '#FFFFFF', name: 'Trắng' }, { hex: '#EFE3C8', name: 'Kem' }, { hex: '#D8C3A0', name: 'Be' }, { hex: '#1E1A16', name: 'Đen' }];
const PLACE_EXTRA = {
  'thien-dan': { zhFull: '天坛公园', pinyin: 'Tiāntán Gōngyuán', addressZh: '北京市东城区天坛东里甲1号', addressVi: 'Số 1A Thiên Đàn Đông Lý, quận Đông Thành',
    dropOffZh: '请在天坛东门下车', dropOffVi: 'Cho tôi xuống ở cổng Đông Thiên Đàn',
    swatches: [{ hex: '#B4301C', name: 'Đỏ' }, { hex: '#F4EEDF', name: 'Trắng kem' }, { hex: '#D8C3A0', name: 'Be' }],
    headline: 'Ba tầng mái lam giữa trời đông', bestTime: '13:30–14:30, nắng chiếu thẳng mặt chính Kỳ Niên Điện.' },
  'bao-tang-tu-nhien': { zhFull: '国家自然博物馆', pinyin: 'Guójiā Zìrán Bówùguǎn', addressZh: '北京市东城区天桥南大街126号', addressVi: 'Số 126 phố Thiên Kiều Nam, quận Đông Thành',
    dropOffZh: '', dropOffVi: '', swatches: [],
    headline: 'Nhỏ bé bên bộ xương khủng long', bestTime: 'Vào sảnh bò sát cổ ngay khi qua cổng, trước khi đông.' },
  'tien-mon': { zhFull: '前门大街', pinyin: 'Qiánmén Dàjiē', addressZh: '北京市东城区前门大街', addressVi: 'Phố Tiền Môn, quận Đông Thành',
    dropOffZh: '请在前门箭楼附近下车', dropOffVi: 'Cho tôi xuống gần lầu Tiễn Lâu, đầu phố Tiền Môn', swatches: [],
    headline: 'Phố cổ lên đèn', bestTime: '17:15–17:45, lầu Tiễn Lâu vừa lên đèn.' },
  'universal': { zhFull: '北京环球度假区', pinyin: 'Běijīng Huánqiú Dùjiàqū', addressZh: '北京市通州区北京环球度假区', addressVi: 'Khu Universal Bắc Kinh, quận Thông Châu',
    dropOffZh: '请在环球影城主题公园入口下车', dropOffVi: 'Cho tôi xuống ở cổng vào công viên Universal', swatches: [],
    headline: 'Một ngày ở công viên chủ đề', bestTime: 'Trước 9:00 ở quả địa cầu; 17:30 phố CityWalk lên đèn.' },
  'mo-dien-du': { zhFull: '慕田峪长城', pinyin: 'Mùtiányù Chángchéng', addressZh: '北京市怀柔区渤海镇慕田峪村', addressVi: 'Thôn Mộ Điền Dụ, trấn Bột Hải, quận Hoài Nhu',
    dropOffZh: '请在慕田峪长城游客中心下车', dropOffVi: 'Cho tôi xuống ở trung tâm du khách Mộ Điền Dụ',
    swatches: [{ hex: '#C0392B', name: 'Đỏ' }, { hex: '#D4A017', name: 'Vàng mù tạt' }, { hex: '#E67E22', name: 'Cam' }],
    headline: 'Tường thành uốn theo sống núi', bestTime: '9:30–10:30, nắng xiên làm rõ từng lỗ châu mai.' },
  'di-hoa-vien': { zhFull: '颐和园', pinyin: 'Yíhéyuán', addressZh: '北京市海淀区新建宫门路19号', addressVi: 'Số 19 đường Tân Kiến Cung Môn, quận Hải Điến',
    dropOffZh: '请在颐和园东宫门下车', dropOffVi: 'Cho tôi xuống ở cổng Đông Cung Môn',
    swatches: [{ hex: '#7B1E1E', name: 'Đỏ đô' }, { hex: '#D8C3A0', name: 'Be' }, { hex: '#B08850', name: 'Lạc đà' }],
    headline: 'Cầu 17 nhịp trong nắng chiều', bestTime: 'Khoảng 16:00, trước khi mặt trời lặn lúc 17:00.' },
  'co-cung': { zhFull: '故宫博物院', pinyin: 'Gùgōng Bówùyuàn', addressZh: '北京市东城区景山前街4号', addressVi: 'Số 4 phố Cảnh Sơn Tiền, quận Đông Thành',
    dropOffZh: '请在天安门东附近下车，我从午门进故宫', dropOffVi: 'Cho tôi xuống gần Thiên An Môn phía đông, tôi đi bộ vào Ngọ Môn',
    swatches: SW_CC, headline: 'Tường đỏ, ngói vàng và một sân đá trống', bestTime: 'Tới 8:30, vào thẳng sân Thái Hòa Điện trước khi đông.' },
  'canh-son': { zhFull: '景山公园', pinyin: 'Jǐngshān Gōngyuán', addressZh: '北京市西城区景山西街44号', addressVi: 'Số 44 phố Cảnh Sơn Tây, quận Tây Thành',
    dropOffZh: '请在景山公园南门下车', dropOffVi: 'Cho tôi xuống ở cổng Nam công viên Cảnh Sơn',
    swatches: SW_CC, headline: 'Cả Tử Cấm Thành dưới chân', bestTime: 'Giữa trưa nhìn về nam bị ngược sáng: đo sáng theo mặt người.' },
  'bao-tang-khoa-hoc': { zhFull: '中国科学技术馆', pinyin: 'Zhōngguó Kēxué Jìshù Guǎn', addressZh: '北京市朝阳区北辰东路5号', addressVi: 'Số 5 đường Bắc Thần Đông, quận Triều Dương',
    dropOffZh: '', dropOffVi: '', swatches: [],
    headline: 'Khoa học để chạm vào', bestTime: 'Đầu giờ chiều, sảnh giữa còn vắng.' },
  'khu-olympic': { zhFull: '奥林匹克公园（鸟巢）', pinyin: 'Àolínpǐkè Gōngyuán (Niǎocháo)', addressZh: '北京市朝阳区国家体育场南路1号', addressVi: 'Số 1 đường Sân vận động Quốc gia Nam, quận Triều Dương',
    dropOffZh: '请在鸟巢附近下车', dropOffVi: 'Cho tôi xuống gần sân vận động Tổ Chim', swatches: [],
    headline: 'Tổ Chim lúc lên đèn', bestTime: '17:00–17:15, đèn vừa bật, trời xanh đậm.' },
};
const SEARCH = {
  'thien-dan': ['天坛 祈年殿 拍照 机位', '天坛 祈年殿 人像', '天坛 丹陛桥 拍照'],
  'bao-tang-tu-nhien': ['国家自然博物馆 恐龙 拍照', '国家自然博物馆 拍照'],
  'tien-mon': ['前门大街 箭楼 拍照', '杨梅竹斜街 拍照', '前门 五牌楼 拍照'],
  'universal': ['北京环球影城 地球 拍照', '北京环球 霍格沃茨 拍照', '北京环球城市大道 拍照'],
  'mo-dien-du': ['慕田峪长城 拍照 机位', '慕田峪长城 台阶 拍照', '长城 敌楼 窗口 剪影'],
  'di-hoa-vien': ['颐和园 十七孔桥 拍照', '颐和园 长廊 拍照', '颐和园 昆明湖 佛香阁 拍照'],
  'co-cung': ['故宫 太和殿 机位', '故宫 红墙 拍照', '故宫 门钉 拍照'],
  'canh-son': ['景山公园 万春亭 故宫全景', '景山 万春亭 拍照'],
  'bao-tang-khoa-hoc': ['中国科技馆 拍照', '中国科技馆 亲子 拍照'],
  'khu-olympic': ['鸟巢 夜景 拍照', '奥林匹克公园 鸟巢 水立方 拍照'],
};
const CHECK_IDS = ['ho-chieu', 'anh-ho-chieu', 'vi-dien-tu', 'tien-mat', 'ao-khoac', 'mu-gang', 'giay', 'mieng-dan', 'kem-duong', 'o-cam', 'sac-du-phong', 'thuoc', 'binh-giu-nhiet'];
if (CHECK_IDS.length !== CHECKS.length) throw new Error('CHECKS đổi độ dài: cập nhật CHECK_IDS');

const days = DAYS.map(D => {
  const used = new Set();
  const stops = D.stops.map((s, i) => {
    let thumb = s.ph || (s.place ? PIMG[s.place][0] : '');
    if (used.has(thumb)) thumb = ''; else if (thumb) used.add(thumb);
    const airport = D.d === 18 && s.k === 'move' && s.title.startsWith('Lên xe ra sân bay');
    return {
      id: `d${D.d}-${i + 1}`, s: s.s, e: s.e || '', k: s.k, kind: s.kind || '', title: s.title, zh: s.zh || '',
      sub: airport ? '' : (s.sub || ''), place: s.place || '', flag: s.flag || '',
      optional: D.d === 18 && s.place === 'bao-tang-tu-nhien', airport,
      thumb, thumbNote: thumb && FOOD.has(thumb) ? 'Ảnh minh họa món' : '',
      addressZh: '', addressVi: '', lat: null, lng: null, ...(STOP_EXTRA[s.title] || {}),
    };
  });
  return { date: `2026-11-${D.d}`, lo: D.lo, hi: D.hi, wx: D.wx, heroPlace: HERO_DAY[D.d], stops };
});

const places = PLACES.map(P => {
  const X = PLACE_EXTRA[P.id];
  return {
    id: P.id, name: P.name, zh: P.zh, zhFull: X.zhFull, pinyin: X.pinyin, tag: P.tag,
    hero: PIMG[P.id][0], heroAlt: PIMG[P.id][1],
    dur: P.dur, ticket: P.ticket, req: P.req, buy: P.buy === '—' ? '' : P.buy,
    addressZh: X.addressZh, addressVi: X.addressVi, dropOffZh: X.dropOffZh, dropOffVi: X.dropOffVi, lat: null, lng: null,
    story: P.story, route: P.route, wear: P.wear, wearSwatches: X.swatches, notes: P.notes,
    photo: {
      headline: X.headline, bestTime: X.bestTime,
      shots: (SHOTS[P.id] || []).map((s, i) => ({
        id: `${P.id}-${i + 1}`, title: s[0], img: '', where: s[6], camera: s[7], pose: s[8], poseKey: s[4],
        clip: '', clipDur: '', clipTitle: '', searchZh: SEARCH[P.id][i],
      })),
    },
  };
});

const out = {
  version: '2026-11-12a',
  tour: { id: 'bac-kinh-2026-11', title: 'Bắc Kinh', start: '2026-11-14', end: '2026-11-18', brand: 'Landtour Mẫu', checkedOn: '2026-11-11' },
  contacts: {
    hotel: { name: '', zh: '', addressZh: '', addressVi: '', lat: null, lng: null, phone: '' },
    driver: { name: '', phone: '', plate: '' },
    hotline: '', zalo: '',
    flightBack: { airport: '', time: '' },
    embassy: { name: 'Đại sứ quán Việt Nam', zh: '越南大使馆', addressZh: '北京市朝阳区光华路32号', addressVi: 'Số 32 đường Quang Hoa, quận Triều Dương', lat: null, lng: null, phone: '' },
  },
  days, places,
  prepTasks: [
    { id: 'ho-chieu-goc', text: 'Vé tham quan công ty tour đã đặt theo số hộ chiếu: mang hộ chiếu gốc mỗi ngày' },
    { id: 'luu-offline', text: 'Đã thêm sổ tay vào Màn hình chính, mở từ biểu tượng và thấy "Đã lưu ✓"' },
    { id: 'amap-offline', text: 'Đã tải bản đồ offline Bắc Kinh trong Amap (高德地图)' },
    { id: 'app-tq', text: 'Đã cài Xiaohongshu và Douyin (không bắt buộc)' },
  ],
  checklist: CHECKS.map((text, i) => ({ id: CHECK_IDS[i], text })),
  wearGeneral: [
    'Mặc theo lớp: áo giữ nhiệt, áo len hoặc nỉ, áo khoác dày chắn gió bên ngoài. Trong nhà và trên xe sưởi rất ấm nên cần lớp ngoài dễ cởi.',
    'Chọn một áo khoác màu sáng hoặc màu nổi cho ảnh ngoài trời. Mùa này cây trơ cành và trời xanh nhạt, màu đỏ, kem, vàng mù tạt lên hình đẹp hơn đen và xám.',
  ],
  prepNotes: [
    { k: 'Múi giờ', v: 'Nhanh hơn Việt Nam 1 tiếng. Mọi giờ trong lịch là giờ Bắc Kinh.' },
    { k: 'Hộ chiếu', v: 'Mang theo hằng ngày. Vé tham quan gắn với số hộ chiếu và cổng soát bằng hộ chiếu gốc.' },
    { k: 'Thanh toán', v: 'Hầu hết quán và quầy vé quét mã Alipay hoặc WeChat Pay. Tiền mặt vẫn dùng được nhưng khó thối lẻ.' },
    { k: 'Ứng dụng', v: 'Google, Facebook và Instagram không mở được bằng wifi tại Trung Quốc. Lưu sẵn những gì cần xem.' },
    { k: 'Điện', v: '220V. Ổ cắm chấu dẹt hai chân và ba chân chéo.' },
    { k: 'Nước uống', v: 'Không uống nước vòi. Khách sạn có ấm đun, nên mang bình giữ nhiệt.' },
    { k: 'Nhà vệ sinh', v: 'Điểm tham quan thường là bệt xổm và không có giấy. Mang khăn giấy theo người.' },
    { k: 'An ninh', v: 'Ga tàu điện, bảo tàng và khu Thiên An Môn đều soi chiếu túi xách. Tính thêm thời gian xếp hàng.' },
    { k: 'Bàn ăn', v: 'Không cắm đũa dựng đứng vào bát cơm. Món ăn thường gọi chung và xoay bàn.' },
  ],
  phrases: [
    { zh: '洗手间在哪里?', vi: 'Nhà vệ sinh ở đâu?' },
    { zh: '可以用支付宝吗?', vi: 'Tôi trả bằng Alipay được không?' },
    { zh: '不要辣,谢谢。', vi: 'Xin đừng cho cay, cảm ơn.' },
    { zh: '请帮我叫一辆出租车。', vi: 'Xin gọi giúp tôi một chiếc taxi.' },
    { zh: '我迷路了,请帮我打这个电话。', vi: 'Tôi bị lạc, xin gọi giúp số điện thoại này.' },
  ],
  poses: Object.entries(POSE).map(([id, [fig, label]]) => ({ id, label, fig })),
  afterTour: {
    tours: [
      { id: 'thuong-hai', title: 'Thượng Hải – Hàng Châu – Ô Trấn', desc: '5 ngày 4 đêm · phố Bến Thượng Hải, Tây Hồ, cổ trấn sông nước' },
      { id: 'truong-gia-gioi', title: 'Trương Gia Giới – Phượng Hoàng Cổ Trấn', desc: '6 ngày 5 đêm · núi đá sa thạch, cầu kính, phố cổ bên sông' },
      { id: 'thanh-do', title: 'Thành Đô – Cửu Trại Câu', desc: '6 ngày 5 đêm · gấu trúc, hồ nước nhiều màu trên cao nguyên' },
    ],
  },
  credits: Object.entries(CRED).map(([file, c]) => ({ file, title: c.title, author: c.artist || '', license: c.lic, url: c.page, personalUseOnly: false })),
};

fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../data/tour.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log('Đã ghi data/tour.json:', days.length, 'ngày,', places.length, 'địa điểm');
```

- [ ] **Step 5: Chạy script rồi chạy test**

```bash
node tools/port_draft.mjs
npm test
```
Expected: `Đã ghi data/tour.json: 5 ngày, 10 địa điểm`, rồi tất cả test `tour-data` PASS.

- [ ] **Step 6: Kiểm tra nhanh địa chỉ chữ Hán và cổng xuống xe**

Dùng WebSearch (mode standard) kiểm tra 3 mục chưa chắc: địa chỉ `天坛东里甲1号` của Thiên Đàn; điểm thả khách hợp lý cho Cố Cung (天安门东 / 东华门 / 南池子); tên trung tâm du khách Mộ Điền Dụ. Nếu khác, sửa trực tiếp trong `data/tour.json` (không chạy lại port script). Chạy lại `npm test`.

- [ ] **Step 7: Commit**

```bash
git add tools/draft/script.js tools/port_draft.mjs data/tour.json tests/unit/tour-data.test.js
git commit -m "feat(data): chuyển dữ liệu bản nháp sang data/tour.json theo schema mới

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Logic giờ và trạng thái ảnh lớn (`time.js`, `hero.js`)

**Files:**
- Create: `js/time.js`, `js/hero.js`, `tests/unit/time.test.js`, `tests/unit/hero.test.js`

**Interfaces:**
- Consumes: `data/tour.json` (Task 2).
- Produces:
  - `bjNow(nowParam?: string, realNow?: number) → { date: 'YYYY-MM-DD', min: number }`
  - `toMin(t: 'HH:MM') → number`, `stopWindow(stop) → [start, end]` (thiếu `e` ⇒ +20 phút)
  - `tripPhase(tourMeta, now) → 'before'|'during'|'after'`, `daysUntil(dateStr, now) → number`
  - `currentAndNext(day, nowMin) → { cur, next }` (bỏ qua `optional`; nhiều mục chồng giờ ⇒ mục bắt đầu muộn nhất)
  - `firstStop(day)` (mục không optional đầu tiên), `stopStatus(stop, viewDate, now) → 'past'|'now'|'future'`
  - `dowOf(date) → 'Thứ Bảy'`, `dowShort(date) → 'T.7'|'CN'`, `fmtDM(date) → '17/11'`, `remainingText(mins) → '1 giờ 35 phút'`
  - `heroState(data, now, viewDate) → { img, label, title, zh, sub, kind, cta }`, `deg(n) → '−4'`, `stopLabel(stop) → 'Tên · Loại'`

- [ ] **Step 1: Viết test `time.test.js`**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { bjNow, stopWindow, currentAndNext, firstStop, stopStatus, dowOf, dowShort, fmtDM, remainingText, daysUntil, tripPhase } from '../../js/time.js';

test('bjNow đọc ?now theo giờ Bắc Kinh', () => {
  assert.deepEqual(bjNow('2026-11-17T09:40'), { date: '2026-11-17', min: 580 });
});
test('bjNow từ đồng hồ máy: 17:30 UTC = 01:30 hôm sau ở Bắc Kinh', () => {
  assert.deepEqual(bjNow(null, Date.UTC(2026, 10, 16, 17, 30)), { date: '2026-11-17', min: 90 });
});
test('bjNow bỏ qua ?now sai định dạng', () => {
  assert.deepEqual(bjNow('hom-nay', Date.UTC(2026, 10, 17, 1, 40)), { date: '2026-11-17', min: 580 });
});

const day = { stops: [
  { s: '08:00', e: '09:00', k: 'sight', title: 'X', optional: true },
  { s: '08:30', e: '11:15', k: 'sight', title: 'A' },
  { s: '11:15', e: '11:45', k: 'cafe', title: 'B' },
  { s: '17:15', e: '19:30', k: 'sight', title: 'C' },
  { s: '17:45', e: '19:00', k: 'meal', title: 'D' },
  { s: '20:30', k: 'move', title: 'E' },
] };
const T = s => s?.title ?? null;

test('stopWindow: thiếu giờ kết thúc = +20 phút', () => assert.deepEqual(stopWindow({ s: '20:30' }), [1230, 1250]));
test('đang trong A, tiếp theo B', () => { const r = currentAndNext(day, 600); assert.equal(T(r.cur), 'A'); assert.equal(T(r.next), 'B'); });
test('chồng giờ: chọn mục bắt đầu muộn nhất (D)', () => { const r = currentAndNext(day, 1080); assert.equal(T(r.cur), 'D'); assert.equal(T(r.next), 'E'); });
test('mục dự phòng không bao giờ là đang diễn ra', () => { const r = currentAndNext(day, 500); assert.equal(r.cur, null); assert.equal(T(r.next), 'A'); });
test('hết lịch', () => assert.deepEqual(currentAndNext(day, 1300), { cur: null, next: null }));
test('firstStop bỏ qua dự phòng', () => assert.equal(firstStop(day).title, 'A'));
test('stopStatus', () => {
  const now = { date: '2026-11-17', min: 600 };
  assert.equal(stopStatus(day.stops[1], '2026-11-17', now), 'now');
  assert.equal(stopStatus(day.stops[2], '2026-11-17', now), 'future');
  assert.equal(stopStatus(day.stops[2], '2026-11-16', now), 'past');
  assert.equal(stopStatus(day.stops[1], '2026-11-18', now), 'future');
});
test('định dạng ngày giờ', () => {
  assert.equal(dowOf('2026-11-14'), 'Thứ Bảy');
  assert.equal(dowShort('2026-11-15'), 'CN');
  assert.equal(dowShort('2026-11-17'), 'T.3');
  assert.equal(fmtDM('2026-11-07'), '7/11');
  assert.equal(remainingText(95), '1 giờ 35 phút');
  assert.equal(remainingText(35), '35 phút');
  assert.equal(daysUntil('2026-11-14', { date: '2026-11-12' }), 2);
});
test('tripPhase', () => {
  const t = { start: '2026-11-14', end: '2026-11-18' };
  assert.equal(tripPhase(t, { date: '2026-11-13' }), 'before');
  assert.equal(tripPhase(t, { date: '2026-11-18' }), 'during');
  assert.equal(tripPhase(t, { date: '2026-11-19' }), 'after');
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npm test`
Expected: FAIL — `Cannot find module …/js/time.js`.

- [ ] **Step 3: Viết `js/time.js`**

```js
const TZ_MS = 8 * 3600e3;
const NOW_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function bjNow(nowParam, realNow = Date.now()) {
  let ms = realNow;
  const m = nowParam && NOW_RE.exec(nowParam);
  if (m) ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - TZ_MS;
  const u = new Date(ms + TZ_MS);
  return { date: u.toISOString().slice(0, 10), min: u.getUTCHours() * 60 + u.getUTCMinutes() };
}

export const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export function stopWindow(stop) { const a = toMin(stop.s); return [a, stop.e ? toMin(stop.e) : a + 20]; }

export function tripPhase(tourMeta, now) {
  if (now.date < tourMeta.start) return 'before';
  if (now.date > tourMeta.end) return 'after';
  return 'during';
}
export const daysUntil = (dateStr, now) => Math.round((Date.parse(dateStr) - Date.parse(now.date)) / 864e5);

export function currentAndNext(day, nowMin) {
  let cur = null, next = null;
  for (const s of day.stops) {
    if (s.optional) continue;
    const [a, b] = stopWindow(s);
    if (nowMin >= a && nowMin < b && (!cur || a >= stopWindow(cur)[0])) cur = s;
    if (!next && a > nowMin) next = s;
  }
  return { cur, next };
}
export const firstStop = day => day.stops.find(s => !s.optional);

export function stopStatus(stop, viewDate, now) {
  if (viewDate < now.date) return 'past';
  if (viewDate > now.date) return 'future';
  const [a, b] = stopWindow(stop);
  if (now.min >= b) return 'past';
  if (now.min >= a) return 'now';
  return 'future';
}

const DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const wd = d => new Date(d + 'T00:00:00Z').getUTCDay();
export const dowOf = d => DOW[wd(d)];
export const dowShort = d => (wd(d) === 0 ? 'CN' : 'T.' + (wd(d) + 1));
export const fmtDM = d => `${+d.slice(8, 10)}/${+d.slice(5, 7)}`;
export function remainingText(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h} giờ ${m} phút` : `${m} phút`;
}
```

- [ ] **Step 4: Chạy test time — PASS**

Run: `node --test tests/unit/time.test.js`
Expected: tất cả PASS.

- [ ] **Step 5: Viết test `hero.test.js` (dùng dữ liệu thật)**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bjNow } from '../../js/time.js';
import { heroState, deg } from '../../js/hero.js';

const data = JSON.parse(fs.readFileSync(new URL('../../data/tour.json', import.meta.url), 'utf8'));
const H = (nowStr, view) => { const now = bjNow(nowStr); return heroState(data, now, view ?? now.date); };

test('deg', () => { assert.equal(deg(-4), '−4'); assert.equal(deg(10), '10'); });
test('trước chuyến', () => {
  const h = H('2026-11-12T10:00', '2026-11-14');
  assert.equal(h.label, 'Còn 2 ngày nữa khởi hành');
  assert.equal(h.title, 'Bắc Kinh');
  assert.equal(h.sub, '08:30 thứ bảy 14/11 · Hạ cánh Bắc Kinh');
  assert.equal(h.img, 'thien-dan');
});
test('trước chuyến, xem ngày khác: không nhãn', () => assert.equal(H('2026-11-12T10:00', '2026-11-16').label, ''));
test('đang ở Cố Cung', () => {
  const h = H('2026-11-17T09:40');
  assert.equal(h.label, 'Đang diễn ra · còn 1 giờ 35 phút');
  assert.equal(h.title, 'Cố Cung');
  assert.equal(h.zh, '故宫');
  assert.equal(h.img, 'co-cung');
  assert.equal(h.sub, 'Thứ Ba 17/11 · −4 / 10°C · Ngày 4/5');
});
test('đang uống cà phê: ảnh của ngày, tên kèm loại', () => {
  const h = H('2026-11-17T11:20');
  assert.equal(h.label, 'Đang diễn ra');
  assert.equal(h.title, 'Cà phê Giác Lâu · Cà phê');
  assert.equal(h.img, 'co-cung');
});
test('giữa hai mục: tiếp theo là điểm tham quan', () => {
  const h = H('2026-11-17T16:20');
  assert.equal(h.label, 'Tiếp theo · 16:30');
  assert.equal(h.title, 'Khu Olympic');
  assert.equal(h.img, 'olympic');
});
test('hết lịch hôm nay: mai bắt đầu bỏ qua mục dự phòng', () => {
  const h = H('2026-11-17T21:00');
  assert.equal(h.label, 'Hết lịch hôm nay');
  assert.equal(h.sub, 'Mai bắt đầu lúc 10:15');
});
test('ngày 18 lúc 9:00: dự phòng không phải đang diễn ra', () => {
  const h = H('2026-11-18T09:00');
  assert.equal(h.label, 'Tiếp theo · 10:15');
  assert.equal(h.img, 'ngo-duong-mai-truc');
});
test('kết thúc chuyến', () => {
  for (const n of ['2026-11-18T21:00', '2026-11-20T10:00']) {
    const h = H(n, '2026-11-18');
    assert.equal(h.label, 'Chuyến đi đã kết thúc');
    assert.equal(h.cta, 'Chuyến đi thế nào?');
  }
});
test('xem ngày khác hôm nay: ảnh chính của ngày, không nhãn', () => {
  const h = H('2026-11-17T09:40', '2026-11-16');
  assert.equal(h.label, '');
  assert.equal(h.title, 'Vạn Lý Trường Thành · Mộ Điền Dụ');
  assert.equal(h.img, 'mo-dien-du');
});
```

- [ ] **Step 6: Chạy, thấy fail**

Run: `node --test tests/unit/hero.test.js`
Expected: FAIL — `Cannot find module …/js/hero.js`.

- [ ] **Step 7: Viết `js/hero.js`**

```js
import { tripPhase, currentAndNext, firstStop, daysUntil, dowOf, fmtDM, remainingText, stopWindow } from './time.js';

export const deg = n => (n < 0 ? '−' + -n : String(n));
export const stopLabel = s => (s.kind ? `${s.title} · ${s.kind}` : s.title);

export function heroState(data, now, viewDate) {
  const T = data.tour, days = data.days, n = days.length;
  const di = days.findIndex(d => d.date === viewDate);
  const day = days[di];
  const placeOf = id => data.places.find(p => p.id === id);
  const dayHero = placeOf(day.heroPlace);
  const dayLine = `${dowOf(day.date)} ${fmtDM(day.date)} · ${deg(day.lo)} / ${day.hi}°C · Ngày ${di + 1}/${n}`;
  const mk = (o) => ({ img: dayHero.hero, label: '', title: '', zh: '', sub: dayLine, kind: 'day', cta: '', ...o });
  const base = mk({ title: dayHero.name, zh: dayHero.zh });
  const ended = mk({ label: 'Chuyến đi đã kết thúc', title: 'Cảm ơn anh chị đã đi cùng đoàn', sub: '', kind: 'ended', cta: 'Chuyến đi thế nào?' });

  const phase = tripPhase(T, now);
  if (phase === 'before') {
    if (viewDate !== T.start) return base;
    const f = firstStop(day);
    return mk({ label: `Còn ${daysUntil(T.start, now)} ngày nữa khởi hành`, title: T.title,
      sub: `${f.s} ${dowOf(day.date).toLowerCase()} ${fmtDM(day.date)} · ${f.title}`, kind: 'before' });
  }
  if (phase === 'after') return viewDate === T.end ? ended : base;
  if (viewDate !== now.date) return base;

  const { cur, next } = currentAndNext(day, now.min);
  if (cur) {
    const p = cur.place && cur.k === 'sight' ? placeOf(cur.place) : null;
    if (p) return mk({ img: p.hero, label: `Đang diễn ra · còn ${remainingText(stopWindow(cur)[1] - now.min)}`, title: p.name, zh: p.zh, kind: 'now' });
    return mk({ label: 'Đang diễn ra', title: stopLabel(cur), zh: cur.zh, kind: 'now' });
  }
  if (next) {
    const p = next.place && next.k === 'sight' ? placeOf(next.place) : null;
    return mk({ img: p ? p.hero : dayHero.hero, label: `Tiếp theo · ${next.s}`, title: stopLabel(next), zh: next.zh || (p ? p.zh : ''), kind: 'next' });
  }
  if (di === n - 1) return ended;
  return mk({ label: 'Hết lịch hôm nay', title: 'Nghỉ ngơi, giữ ấm', sub: `Mai bắt đầu lúc ${firstStop(days[di + 1]).s}`, kind: 'rest' });
}
```

- [ ] **Step 8: Chạy toàn bộ unit — PASS**

Run: `npm test`
Expected: tất cả PASS.

- [ ] **Step 9: Commit**

```bash
git add js/time.js js/hero.js tests/unit/time.test.js tests/unit/hero.test.js
git commit -m "feat: logic giờ Bắc Kinh và trạng thái ảnh lớn đầu trang

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Liên kết, router, lưu dấu tích (`links.js`, `router.js`, `store.js`)

**Files:**
- Create: `js/links.js`, `js/router.js`, `js/store.js`, `tests/unit/links.test.js`, `tests/unit/router.test.js`, `tests/unit/store.test.js`

**Interfaces:**
- Produces:
  - `amapLink(t: {zh, zhFull?, lat?, lng?}) → string`, `douyinSearch(kw) → string`, `xhsSearch(kw) → string`, `telHref(n) → 'tel:+86…' | ''`
  - `TABS: string[]`, `parseHash(hash) → { view, id, section }`
  - `get(ns, id) → boolean`, `set(ns, id, val)` (khóa localStorage `bk-store-v1`)

- [ ] **Step 1: Viết test**

`tests/unit/links.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { amapLink, douyinSearch, xhsSearch, telHref } from '../../js/links.js';

const enc = encodeURIComponent;
test('Amap không có tọa độ: tìm theo tên đầy đủ ở Bắc Kinh', () => {
  assert.equal(amapLink({ zh: '故宫', zhFull: '故宫博物院', lat: null, lng: null }),
    `https://uri.amap.com/search?keyword=${enc('故宫博物院')}&city=${enc('北京')}&callnative=1`);
});
test('Amap có tọa độ: chỉ đường bằng xe', () => {
  assert.equal(amapLink({ zh: '故宫', lat: 39.913, lng: 116.397 }),
    `https://uri.amap.com/navigation?to=116.397,39.913,${enc('故宫')}&mode=car&callnative=1`);
});
test('Douyin, Xiaohongshu', () => {
  assert.equal(douyinSearch('故宫 机位'), `https://www.douyin.com/search/${enc('故宫 机位')}`);
  assert.equal(xhsSearch('故宫 机位'), `https://www.xiaohongshu.com/search_result?keyword=${enc('故宫 机位')}`);
});
test('telHref', () => {
  assert.equal(telHref('+86 138-0000 0000'), 'tel:+8613800000000');
  assert.equal(telHref(''), '');
});
```

`tests/unit/router.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHash } from '../../js/router.js';

test('rỗng → lich-trinh', () => assert.deepEqual(parseHash(''), { view: 'lich-trinh', id: null, section: null }));
test('tab', () => assert.equal(parseHash('#tro-giup').view, 'tro-giup'));
test('lạ → lich-trinh', () => assert.equal(parseHash('#abc').view, 'lich-trinh'));
test('địa điểm', () => assert.deepEqual(parseHash('#dd-co-cung'), { view: 'place', id: 'co-cung', section: null }));
test('mục chụp ảnh', () => assert.deepEqual(parseHash('#dd-co-cung/chup-anh'), { view: 'place', id: 'co-cung', section: 'chup-anh' }));
```

`tests/unit/store.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) };
const { get, set } = await import('../../js/store.js');

test('mặc định false, lưu và đọc lại theo namespace', () => {
  assert.equal(get('prep', 'luu-offline'), false);
  set('prep', 'luu-offline', true);
  assert.equal(get('prep', 'luu-offline'), true);
  assert.equal(get('pack', 'luu-offline'), false);
  set('prep', 'luu-offline', false);
  assert.equal(get('prep', 'luu-offline'), false);
});
test('dữ liệu hỏng không làm vỡ', () => {
  mem.set('bk-store-v1', '{hong');
  assert.equal(get('prep', 'x'), false);
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npm test`
Expected: FAIL — thiếu `links.js`, `router.js`, `store.js`.

- [ ] **Step 3: Viết 3 module**

`js/links.js`:
```js
const enc = encodeURIComponent;
export function amapLink(t) {
  const name = t.zhFull || t.zh;
  if (t.lat != null && t.lng != null) return `https://uri.amap.com/navigation?to=${t.lng},${t.lat},${enc(name)}&mode=car&callnative=1`;
  return `https://uri.amap.com/search?keyword=${enc(name)}&city=${enc('北京')}&callnative=1`;
}
export const douyinSearch = kw => `https://www.douyin.com/search/${enc(kw)}`;
export const xhsSearch = kw => `https://www.xiaohongshu.com/search_result?keyword=${enc(kw)}`;
export const telHref = n => (n ? 'tel:' + String(n).replace(/[^\d+]/g, '') : '');
```

`js/router.js`:
```js
export const TABS = ['lich-trinh', 'dia-diem', 'chup-anh', 'chuan-bi', 'tro-giup'];
export function parseHash(hash) {
  const h = String(hash || '').replace(/^#/, '');
  const m = h.match(/^dd-([a-z0-9-]+)(?:\/(chup-anh))?$/);
  if (m) return { view: 'place', id: m[1], section: m[2] || null };
  return { view: TABS.includes(h) ? h : 'lich-trinh', id: null, section: null };
}
```

`js/store.js`:
```js
const KEY = 'bk-store-v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export const get = (ns, id) => !!(load()[ns] || {})[id];
export function set(ns, id, val) {
  const s = load();
  (s[ns] ||= {})[id] = !!val;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bộ nhớ đầy/chặn: bỏ qua */ }
}
```

- [ ] **Step 4: Chạy — PASS**

Run: `npm test`
Expected: tất cả PASS.

- [ ] **Step 5: Commit**

```bash
git add js/links.js js/router.js js/store.js tests/unit/links.test.js tests/unit/router.test.js tests/unit/store.test.js
git commit -m "feat: liên kết Amap/Douyin/Xiaohongshu/tel, router hash, lưu dấu tích

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Font tự host, ảnh WebP, biểu tượng

**Files:**
- Create: `tools/fetch_fonts.py`, `tools/img.py`, `tools/make_icons.py`, `css/fonts.css` (sinh), `fonts/*.woff2` (sinh), `img/*-160.webp` và `img/*-900.webp` (sinh), `icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png` (sinh), `tests/unit/media-refs.test.js`

**Interfaces:**
- Consumes: `data/tour.json` (`places[].hero`, `days[].stops[].thumb`, `credits[]`).
- Produces: ảnh `./img/<ten>-160.webp` (vuông 160) và `./img/<ten>-900.webp` (rộng ≤ 900); `css/fonts.css` chỉ trỏ `../fonts/*.woff2`. Lệnh làm ảnh tái dùng ở đợt 2: `python tools/img.py <tep-anh> <ten>`.

- [ ] **Step 1: Viết test (fail)**

`tests/unit/media-refs.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const exists = p => fs.existsSync(new URL(p, root));
const data = JSON.parse(fs.readFileSync(new URL('data/tour.json', root), 'utf8'));

test('mọi ảnh được tham chiếu đều có 2 cỡ WebP', () => {
  const names = new Set([...data.places.map(p => p.hero), ...data.days.flatMap(d => d.stops.map(s => s.thumb)).filter(Boolean)]);
  for (const n of names) {
    assert.ok(exists(`img/${n}-160.webp`), `${n}-160`);
    assert.ok(exists(`img/${n}-900.webp`), `${n}-900`);
  }
});
test('fonts.css chỉ trỏ tệp nội bộ, có Playfair nghiêng và subset vietnamese', () => {
  const css = fs.readFileSync(new URL('css/fonts.css', root), 'utf8');
  assert.ok(!/https?:/.test(css), 'có URL ngoài');
  assert.match(css, /Playfair Display[\s\S]*font-style: italic/);
  for (const m of css.matchAll(/url\(\.\.\/fonts\/([^)]+)\)/g)) assert.ok(exists(`fonts/${m[1]}`), m[1]);
  for (const fam of ['Playfair Display', 'Be Vietnam Pro', 'Barlow Condensed']) assert.ok(css.includes(fam), fam);
});
test('có đủ biểu tượng', () => {
  for (const f of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) assert.ok(exists(f), f);
});
```

Run: `node --test tests/unit/media-refs.test.js` → Expected: FAIL.

- [ ] **Step 2: Viết `tools/fetch_fonts.py`**

```python
"""Tải woff2 từ Google Fonts MỘT LẦN lúc soạn, ghi css/fonts.css trỏ tệp nội bộ. Lúc chạy trang không gọi Google."""
import hashlib
import os
import re
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
```

Run: `mkdir -p css && python tools/fetch_fonts.py`
Expected: in ra số `@font-face` (khoảng 27) và số tệp woff2.

- [ ] **Step 3: Viết `tools/img.py`**

```python
"""Ảnh → WebP 2 cỡ.
  python tools/img.py <tep-anh> <ten>        : một ảnh có sẵn
  python tools/img.py --commons              : tải lại toàn bộ ảnh trong credits (Wikimedia) rồi chuyển
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
    big.thumbnail((900, 1400), Image.LANCZOS)
    big.save(os.path.join(OUT, f"{name}-900.webp"), "WEBP", quality=78, method=6)
    ImageOps.fit(im, (160, 160), Image.LANCZOS).save(os.path.join(OUT, f"{name}-160.webp"), "WEBP", quality=75, method=6)
    print(name, big.size)


def commons():
    data = json.load(open(os.path.join(ROOT, "data", "tour.json"), encoding="utf-8"))
    base = os.path.join(tempfile.gettempdir(), "so-tay-raw")
    for c in data["credits"]:
        title = urllib.parse.unquote(c["url"].split("/wiki/File:", 1)[1])
        url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(title) + "?width=1400"
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
```

Run: `python tools/img.py --commons`
Expected: 12 dòng `<ten> (900, …)`; thư mục `img/` có 24 tệp.

- [ ] **Step 4: Viết `tools/make_icons.py`**

```python
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
```

Run: `python tools/make_icons.py` → Expected: `ok`.

- [ ] **Step 5: Chạy test — PASS**

Run: `npm test`
Expected: tất cả PASS (gồm `media-refs`).

- [ ] **Step 6: Commit**

```bash
git add tools/fetch_fonts.py tools/img.py tools/make_icons.py css/fonts.css fonts img icons tests/unit/media-refs.test.js
git commit -m "feat: font tự host, ảnh WebP 2 cỡ, biểu tượng app

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Khung trang, CSS, overlay, điều hướng 3 tab

**Files:**
- Create: `js/dom.js`, `js/overlay.js`, `js/main.js`, `js/offline.js` (bản tối thiểu, Task 10 hoàn thiện), `css/styles.css`, `manifest.webmanifest`
- Modify: `index.html` (thay toàn bộ)
- Test: `tests/e2e/shell.spec.js`
- Create tạm để module import được (Task 7–9 thay nội dung): `js/views/lich-trinh.js`, `js/views/chuan-bi.js`, `js/views/tro-giup.js`

**Interfaces:**
- Consumes: `bjNow` (Task 3), `parseHash` (Task 4), `data/tour.json`.
- Produces:
  - `esc(s)`, `zh(s) → '<span lang="zh-CN" class="han">…</span>'`, `imgTag(name, size, alt?, cls?, loading?='lazy')`
  - `openOverlay(html, { label, cls, onClose }) → { el, close(after?) }`, `overlayOpen() → boolean`
  - Hợp đồng view: mỗi view export `render<X>(ctx) → string` và `mount<X>(root, ctx)`. `ctx = { data, now, viewDate, route, features, setViewDate(date) }`.
  - `FEATURES = { places, photos, afterTour }` trong `main.js`; `enabledTabs(FEATURES)`.
  - `initOffline(barEl)`, `notifyVersion(version, barEl)` từ `offline.js`.

- [ ] **Step 1: Viết e2e (fail)**

`tests/e2e/shell.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('không gọi tài nguyên ngoài', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const ext = [];
  page.on('request', r => { if (!r.url().startsWith(origin)) ext.push(r.url()); });
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('#tabs a')).toHaveCount(3);
  await page.waitForLoadState('networkidle');
  expect(ext).toEqual([]);
});

test('đợt 1: 3 tab, chuyển tab theo hash, đánh dấu tab hiện tại', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('#tabs a')).toHaveText(['Lịch trình', 'Chuẩn bị', 'Trợ giúp']);
  await page.locator('#tabs a[data-v="tro-giup"]').click();
  await expect(page).toHaveURL(/#tro-giup$/);
  await expect(page.locator('#tabs a[data-v="tro-giup"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('h1')).toHaveText('Trợ giúp');
});

test('hash địa điểm khi chưa bật đợt 2 → về Lịch trình', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung');
  await expect(page.locator('#tabs a[data-v="lich-trinh"]')).toHaveAttribute('aria-current', 'page');
});

test('chân trang có ngày kiểm tra giá vé và nguồn ảnh', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('.foot')).toContainText('kiểm tra ngày 11/11/2026');
  await page.locator('.foot summary').click();
  await expect(page.locator('#credList li').first()).toContainText('Wikimedia Commons');
});
```

Run: `npm run e2e` → Expected: FAIL (khung chưa có).

- [ ] **Step 2: Viết `index.html`**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1E1A16">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Bắc Kinh">
<title>Sổ tay đoàn Bắc Kinh</title>
<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
<link rel="icon" href="./icons/icon-192.png">
<link rel="stylesheet" href="./css/fonts.css">
<link rel="stylesheet" href="./css/styles.css">
<script src="./assets.js"></script>
<script type="module" src="./js/main.js"></script>
</head>
<body>
<div id="offline-bar" class="offline-bar" role="status" aria-live="polite" hidden></div>
<main id="app" class="app"><p class="boot">Đang mở sổ tay…</p></main>
<footer class="foot">
  <span id="checkedOn"></span>
  <details><summary>Nguồn ảnh</summary><ul id="credList"></ul></details>
</footer>
<nav class="tabbar" aria-label="Mục chính"><ul id="tabs"></ul></nav>
</body>
</html>
```

Tạo `assets.js` tạm (Task 10 sinh tự động):
```js
self.ASSETS = { app: { version: 'dev', files: [] }, media: { version: 'dev', files: [] } };
```

`manifest.webmanifest`:
```json
{
  "name": "Sổ tay đoàn Bắc Kinh",
  "short_name": "Bắc Kinh",
  "lang": "vi",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#F5F0E6",
  "theme_color": "#1E1A16",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: Viết `js/dom.js` và `js/overlay.js`**

`js/dom.js`:
```js
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => MAP[c]);
export const zh = s => (s ? `<span lang="zh-CN" class="han">${esc(s)}</span>` : '');
export const imgTag = (name, size, alt = '', cls = '', loading = 'lazy') =>
  `<img src="./img/${esc(name)}-${size}.webp" alt="${esc(alt)}" class="${cls}" loading="${loading}" decoding="async">`;
```

`js/overlay.js`:
```js
const stack = [];
const FOCUSABLE = 'button, a[href], input, [tabindex]:not([tabindex="-1"])';

export function openOverlay(html, { label = '', cls = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = `overlay ${cls}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', label);
  el.innerHTML = html;
  document.body.appendChild(el);
  document.body.classList.add('has-overlay');
  const entry = { el, prevFocus: document.activeElement, onClose, after: null };
  stack.push(entry);
  history.pushState({ ov: stack.length }, '');
  (el.querySelector('[data-autofocus]') || el.querySelector(FOCUSABLE))?.focus();
  return { el, close: after => { entry.after = after || null; history.back(); } };
}

export const overlayOpen = () => stack.length > 0;

window.addEventListener('popstate', () => {
  const e = stack.pop();
  if (!e) return;
  e.el.remove();
  if (!stack.length) document.body.classList.remove('has-overlay');
  e.onClose?.();
  e.prevFocus?.focus?.();
  e.after?.();
});

document.addEventListener('keydown', ev => {
  if (!stack.length) return;
  const top = stack[stack.length - 1].el;
  if (ev.key === 'Escape') { ev.preventDefault(); history.back(); return; }
  if (ev.key !== 'Tab') return;
  const f = [...top.querySelectorAll(FOCUSABLE)];
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
  else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
});
```

- [ ] **Step 4: Viết `js/offline.js` tối thiểu (Task 10 thay bằng bản đầy đủ)**

```js
export function initOffline() {}
export function notifyVersion() {}
```

- [ ] **Step 5: Viết view tạm để trang chạy được**

`js/views/lich-trinh.js`:
```js
export const defaultViewDate = (t, now) => (now.date < t.start ? t.start : now.date > t.end ? t.end : now.date);
export const renderItinerary = () => '<h1 class="view-h">Lịch trình</h1>';
export const mountItinerary = () => {};
```
`js/views/chuan-bi.js`:
```js
export const renderPrep = () => '<h1 class="view-h">Chuẩn bị</h1>';
export const mountPrep = () => {};
```
`js/views/tro-giup.js`:
```js
export const renderHelp = () => '<h1 class="view-h">Trợ giúp</h1>';
export const mountHelp = () => {};
```

- [ ] **Step 6: Viết `js/main.js`**

```js
import { bjNow } from './time.js';
import { parseHash } from './router.js';
import { overlayOpen } from './overlay.js';
import { esc } from './dom.js';
import { renderItinerary, mountItinerary, defaultViewDate } from './views/lich-trinh.js';
import { renderPrep, mountPrep } from './views/chuan-bi.js';
import { renderHelp, mountHelp } from './views/tro-giup.js';
import { initOffline, notifyVersion } from './offline.js';

export const FEATURES = { places: false, photos: false, afterTour: false };
export const enabledTabs = f => ['lich-trinh', ...(f.places && f.photos ? ['dia-diem', 'chup-anh'] : []), 'chuan-bi', 'tro-giup'];

const ICONS = {
  'lich-trinh': '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  'dia-diem': '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'chup-anh': '<path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  'chuan-bi': '<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M9 8V6a3 3 0 0 1 6 0v2M4 13h16"/>',
  'tro-giup': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5"/>',
};
const LABELS = { 'lich-trinh': 'Lịch trình', 'dia-diem': 'Địa điểm', 'chup-anh': 'Chụp ảnh', 'chuan-bi': 'Chuẩn bị', 'tro-giup': 'Trợ giúp' };
const VIEWS = {
  'lich-trinh': [renderItinerary, mountItinerary],
  'chuan-bi': [renderPrep, mountPrep],
  'tro-giup': [renderHelp, mountHelp],
};

const NOW_PARAM = new URLSearchParams(location.search).get('now');
const state = { data: null, viewDate: null };
const app = document.getElementById('app');

function render() {
  const now = bjNow(NOW_PARAM);
  const route = parseHash(location.hash);
  const view = enabledTabs(FEATURES).includes(route.view) && VIEWS[route.view] ? route.view : 'lich-trinh';
  state.viewDate ||= defaultViewDate(state.data.tour, now);
  const ctx = {
    data: state.data, now, viewDate: state.viewDate, route, features: FEATURES,
    setViewDate: d => { const y = scrollY; state.viewDate = d; render(); scrollTo(0, y); },
  };
  const [r, m] = VIEWS[view];
  app.innerHTML = r(ctx);
  m(app, ctx);
  for (const a of document.querySelectorAll('#tabs a')) {
    if (a.dataset.v === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

function renderChrome(data) {
  document.getElementById('tabs').innerHTML = enabledTabs(FEATURES).map(v =>
    `<li><a href="#${v}" data-v="${v}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[v]}</svg>${LABELS[v]}</a></li>`).join('');
  const [y, m, d] = data.tour.checkedOn.split('-');
  document.getElementById('checkedOn').textContent = `Giờ mở cửa và giá vé kiểm tra ngày ${+d}/${+m}/${y}. Xem lại trên kênh chính thức trước khi đi.`;
  document.getElementById('credList').innerHTML = data.credits.map(c =>
    `<li>${esc(c.title)} · ${esc(c.author || 'không rõ tác giả')} · ${esc(c.license)}${c.personalUseOnly ? ' · chỉ dùng cá nhân' : ''} · <a href="${esc(c.url)}" target="_blank" rel="noopener">${c.url.includes('wikimedia') ? 'Wikimedia Commons' : 'Nguồn'}</a></li>`).join('');
}

async function boot() {
  const bar = document.getElementById('offline-bar');
  initOffline(bar);
  try {
    state.data = await (await fetch('./data/tour.json')).json();
  } catch {
    app.innerHTML = '<p class="boot">Chưa tải được dữ liệu. Mở lại khi có mạng (wifi ở Việt Nam) để lưu sổ tay vào máy.</p>';
    return;
  }
  renderChrome(state.data);
  render();
  notifyVersion(state.data.version, bar);
  addEventListener('hashchange', () => { if (!overlayOpen()) { render(); scrollTo(0, 0); } });
  const tick = () => {
    if (overlayOpen() || parseHash(location.hash).view !== 'lich-trinh') return;
    const y = scrollY; render(); scrollTo(0, y);
  };
  setInterval(tick, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
}

boot();
```

- [ ] **Step 7: Viết `css/styles.css` (toàn bộ, dùng chung cho đợt 1)**

```css
:root{
  --paper:#F5F0E6; --card:#FFFDF8; --ink:#1E1A16; --muted:#6E6253; --line:#E3D9C6;
  --gold:#7A5C22; --gold-hi:#F2C14E; --gold-soft:#F6ECCD; --red:#B4301C; --red-soft:#F3DCD6;
  --frost:#2C6591; --day-line:#D3DAE2; --day-ink:#131B25; --day-muted:#566373; --ok:#1F6B45; --warn-bg:#5A3A0A;
  --f-display:"Playfair Display",Georgia,serif;
  --f-body:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --f-num:"Barlow Condensed","Arial Narrow",sans-serif;
  --f-han:"PingFang SC","Noto Sans SC","Microsoft YaHei","Hiragino Sans GB",sans-serif;
  --safe-b:env(safe-area-inset-bottom,0px);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.55 var(--f-body)}
h1,h2,h3,h4,p,ol,ul,dl,dd,figure{margin:0}
ol,ul{padding:0;list-style:none}
a{color:inherit}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:inherit}
img{display:block;max-width:100%}
:focus-visible{outline:3px solid var(--frost);outline-offset:2px;border-radius:6px}
.han,[lang="zh-CN"]{font-family:var(--f-han)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.app{max-width:560px;margin:0 auto;padding-bottom:calc(104px + var(--safe-b));min-height:70vh}
.boot{padding:40px 20px;color:var(--muted)}
.eyebrow{display:block;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.sub{font-size:14px;color:var(--muted)}
.view-h{font:700 32px/1.1 var(--f-display);padding:28px 16px 12px}
.stack{display:flex;flex-direction:column;gap:14px;padding:0 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px}
.pill{display:inline-flex;align-items:center;font-size:12px;font-weight:600;line-height:1.3;padding:3px 9px;border-radius:99px;background:var(--gold-soft);color:var(--gold)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:52px;padding:10px 16px;border-radius:14px;font-weight:600;font-size:16px;text-decoration:none;text-align:center}
.btn-pri{background:var(--red);color:#fff}
.btn-sec{background:#fff;border:1.5px solid var(--ink)}

/* ảnh lớn */
.hero{position:relative;height:300px;color:#fff;overflow:hidden;background:#2a2420}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,0) 30%,rgba(20,14,8,.88) 100%)}
.hero-top{position:absolute;z-index:1;top:14px;left:18px;right:18px;display:flex;justify-content:space-between;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
.hero-in{position:absolute;z-index:1;left:18px;right:18px;bottom:16px;display:flex;flex-direction:column;gap:2px;align-items:flex-start}
.live{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.18);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:4px 10px;border-radius:99px;margin-bottom:4px}
.live::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--gold-hi)}
.live.is-now::before{background:#FF6A4D}
.hero-title{font:700 38px/1.05 var(--f-display);text-wrap:balance}
.hero-zh{font-size:16px;opacity:.92}
.hero-sub{font-size:14px;opacity:.95}
.hero-tz{font-size:12px;opacity:.78;margin-top:2px}
.hero-cta{margin-top:8px;background:var(--gold-hi);color:var(--ink);font-weight:600;font-size:14px;padding:10px 16px;border-radius:99px;text-decoration:none}

/* dải ngày — giữ y nguyên kiểu A */
.days{position:sticky;top:0;z-index:4;background:var(--paper);padding:12px 16px 8px}
.days-in{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.day{background:#fff;border:1px solid var(--day-line);border-radius:12px;padding:6px 0 7px;min-height:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.day b{font:700 26px/1 var(--f-num);color:var(--day-ink)}
.day span{font-size:12px;color:var(--day-muted);font-weight:500}
.day[aria-pressed="true"]{background:var(--red);border-color:var(--red)}
.day[aria-pressed="true"] b,.day[aria-pressed="true"] span{color:#fff}

/* danh sách trong ngày */
.stops{padding:4px 16px 0}
.stops .eyebrow{padding:14px 0 2px}
.past summary{cursor:pointer;padding:12px 0 4px;font-size:14px;font-weight:600;color:var(--muted);min-height:44px}
.stop-row{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;width:100%;padding:12px 0;border-bottom:1px solid var(--line);text-decoration:none;text-align:left}
.stop-t{font:600 18px/1.15 var(--f-display);font-variant-numeric:tabular-nums}
.stop-t small{display:block;font:500 13px/1.3 var(--f-body);color:var(--muted)}
.stop-b{display:flex;flex-direction:column;gap:2px;min-width:0}
.stop-k{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
.stop-title{font-weight:600;font-size:16px;line-height:1.3}
.stop-zh{font-size:14px;color:var(--red);font-weight:600}
.stop-sub{font-size:14px;color:var(--muted)}
.stop-note{font-size:12px;color:var(--muted);font-style:italic}
.stop-flags{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.stop-thumb{width:58px;height:58px;border-radius:10px;object-fit:cover;background:var(--line)}
.stop-move .stop-title{font-weight:500;color:var(--muted);font-size:15px}
.stop.is-past{opacity:.55}
.stop.is-now .stop-t::before{content:"";display:block;width:10px;height:10px;border-radius:50%;background:var(--red);box-shadow:0 0 0 4px var(--red-soft);margin-bottom:6px}
.stop-drv{font-size:13px;font-weight:600;color:var(--red)}

/* overlay */
body.has-overlay{overflow:hidden}
body.has-overlay .tabbar{display:none}
.overlay{position:fixed;inset:0;z-index:30;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch}
.ov-close{position:absolute;top:12px;right:12px;width:48px;height:48px;border-radius:50%;background:#F1ECE2;font-size:26px;line-height:1;display:flex;align-items:center;justify-content:center}

/* thẻ tài xế */
.drv{position:relative;min-height:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:14px;padding:20px 18px calc(20px + var(--safe-b))}
.drv-hint{font-size:14px;color:var(--muted);padding-right:56px;min-height:48px;display:flex;align-items:center}
.drv-say{font:700 28px/1.3 var(--f-han)}
.drv-say small{display:block;font:500 14px/1.4 var(--f-body);color:var(--muted)}
.drv-dest{border:3px solid var(--red);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:6px}
.drv-name{font:800 40px/1.15 var(--f-han);color:var(--red);overflow-wrap:anywhere}
.drv-py{font-size:14px;color:var(--muted)}
.drv-addr{font:600 21px/1.4 var(--f-han);margin-top:6px;overflow-wrap:anywhere}
.drv-vi{font-size:14px;color:var(--muted)}
.drv-gate{background:var(--paper);border-radius:12px;padding:12px;font:600 19px/1.4 var(--f-han)}
.drv-gate small{display:block;font:500 14px/1.4 var(--f-body);color:var(--muted)}
.drv-acts{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.drv-acts .btn:only-child{grid-column:1/3}

/* trợ giúp */
.help-big{display:flex;flex-direction:column;gap:4px;background:var(--red);color:#fff;border-radius:16px;padding:18px;min-height:96px}
.help-big .eyebrow{color:#fff;opacity:.85}
.help-big b{font:700 26px/1.25 var(--f-han)}
.help-big .sub{color:#fff;opacity:.9}
.help-list{padding:4px 16px}
.help-row{display:flex;flex-direction:column;gap:2px;padding:12px 0;min-height:56px;border-bottom:1px solid var(--line);text-decoration:none}
.help-row:last-child{border-bottom:0}
.help-row b{font-size:16px}
.help-row span{font-size:14px;color:var(--muted)}
.sos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.sos a{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 6px;text-align:center;text-decoration:none;min-height:72px}
.sos b{display:block;font:700 34px/1 var(--f-num);color:var(--red);font-variant-numeric:tabular-nums}
.sos span{font-size:13px;color:var(--muted)}
.phr{display:flex;flex-direction:column;gap:2px;width:100%;padding:12px 0;border-bottom:1px solid var(--line);min-height:56px}
.phr:last-child{border-bottom:0}
.phr b{font:600 22px/1.3 var(--f-han);color:var(--red)}
.phr span{font-size:14px;color:var(--muted)}
.help-emb{width:100%}
.help-emb .zhline{font:600 16px/1.4 var(--f-han);color:var(--red)}
.link{font-size:14px;font-weight:600;color:var(--red);text-decoration:underline;text-underline-offset:3px}
.phr-big{position:relative;min-height:100%;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:72px 22px 40px;max-width:560px;margin:0 auto}
.phr-big p{font:700 44px/1.3 var(--f-han);color:var(--red);overflow-wrap:anywhere}
.phr-big span{font-size:18px;color:var(--muted)}

/* chuẩn bị */
.install ol{list-style:decimal;padding-left:22px;display:flex;flex-direction:column;gap:6px;font-size:15px}
.checks{display:flex;flex-direction:column}
.chk{display:grid;grid-template-columns:26px 1fr;gap:12px;align-items:start;padding:11px 0;border-bottom:1px solid var(--line);cursor:pointer;font-size:15px;min-height:44px}
.chk:last-child{border-bottom:0}
.chk input{width:22px;height:22px;margin:1px 0 0;accent-color:var(--red)}
.chk input:checked+span{color:var(--muted);text-decoration:line-through}
.wxrow{display:grid;grid-template-columns:48px 1fr 84px;gap:10px;align-items:center;font-size:14px;padding:6px 0}
.wxrow .dd{font:600 20px/1 var(--f-num)}
.wxrow .tt{font-variant-numeric:tabular-nums;font-weight:600;color:var(--frost);text-align:right;white-space:nowrap}
.wxnote{grid-column:2/4;font-size:13px;color:var(--muted);margin-top:-4px}
.trange{position:relative;height:6px;border-radius:3px;background:var(--line)}
.trange i{position:absolute;top:0;bottom:0;border-radius:3px;background:var(--frost)}
.trange em{position:absolute;top:-3px;bottom:-3px;width:1.5px;background:var(--muted);opacity:.6}
.kv{display:grid;grid-template-columns:104px 1fr;gap:8px 12px;font-size:15px}
.kv dt{color:var(--muted);font-size:14px}

/* thanh lưu offline */
.offline-bar{position:fixed;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:var(--ink);color:var(--paper);font-size:14px}
.offline-bar[hidden]{display:none}
.offline-bar progress{flex:1;max-width:160px;height:6px;accent-color:var(--gold-hi)}
.offline-bar.ok{background:var(--ok);color:#fff}
.offline-bar.warn{background:var(--warn-bg);color:#fff}
.offline-bar button{color:var(--gold-hi);font-weight:700;min-height:44px;padding:0 6px}

/* chân trang + thanh tab */
.foot{max-width:560px;margin:0 auto;padding:24px 16px calc(110px + var(--safe-b));font-size:13px;color:var(--muted);display:flex;flex-direction:column;gap:8px;text-align:center}
.foot summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center;justify-content:center}
.foot ul{display:flex;flex-direction:column;gap:6px;text-align:left;padding-left:18px;list-style:disc}
.foot a{overflow-wrap:anywhere}
.tabbar{position:fixed;left:12px;right:12px;bottom:calc(10px + var(--safe-b));z-index:10;max-width:536px;margin:0 auto}
.tabbar ul{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:var(--ink);border-radius:99px;padding:6px;box-shadow:0 8px 24px rgba(30,26,22,.25)}
.tabbar a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:52px;border-radius:99px;text-decoration:none;color:#BFB3A0;font-size:12px;font-weight:500}
.tabbar svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.tabbar a[aria-current="page"]{color:var(--gold-hi);font-weight:600}
@media (max-width:360px){.hero-title{font-size:32px}.drv-name{font-size:34px}.phr-big p{font-size:36px}}
```

- [ ] **Step 8: Chạy e2e — PASS**

Run: `npm run e2e`
Expected: `smoke` + 4 test `shell` PASS.

- [ ] **Step 9: Commit**

```bash
git add index.html assets.js manifest.webmanifest css/styles.css js/dom.js js/overlay.js js/offline.js js/main.js js/views tests/e2e/shell.spec.js
git commit -m "feat: khung trang, CSS kiểu B, overlay có Back/Esc, thanh 3 tab

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Thẻ tài xế + tab Trợ giúp

**Files:**
- Create: `js/components/driver-card.js`, `tests/e2e/help.spec.js`
- Modify: `js/views/tro-giup.js` (thay toàn bộ)

**Interfaces:**
- Consumes: `openOverlay` (Task 6), `amapLink`, `telHref` (Task 4), `esc` (Task 6).
- Produces: `openDriverCard(target, hotel|null)`, `hotelTarget(hotel)`, `hasHotel(hotel) → boolean`, `driverCardHtml(target, showHotel)`. `target = { zh, zhFull?, pinyin?, name?, addressZh?, addressVi?, dropOffZh?, dropOffVi?, lat?, lng? }`.

- [ ] **Step 1: Viết e2e (fail)**

`tests/e2e/help.spec.js`:
```js
import { test, expect } from '@playwright/test';

const go = page => page.goto('./?now=2026-11-17T09:40#tro-giup');

test('khẩn cấp gọi được', async ({ page }) => {
  await go(page);
  await expect(page.locator('.sos a')).toHaveCount(3);
  await expect(page.locator('.sos a').first()).toHaveAttribute('href', 'tel:110');
});

test('chưa có khách sạn: hiện thông báo, không có nút', async ({ page }) => {
  await go(page);
  await expect(page.getByText('Chưa có thông tin khách sạn')).toBeVisible();
  await expect(page.locator('[data-hotel]')).toHaveCount(0);
});

test('thẻ tài xế đại sứ quán: mở, Amap, nút Back đóng mà không rời trang', async ({ page }) => {
  await go(page);
  await page.locator('[data-embassy]').click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('越南大使馆');
  await expect(dlg).toContainText('北京市朝阳区光华路32号');
  await expect(dlg.locator('a.btn-pri')).toHaveAttribute('href', /^https:\/\/uri\.amap\.com\/search\?keyword=/);
  await expect(page.locator('.tabbar')).toBeHidden();
  await page.goBack();
  await expect(dlg).toHaveCount(0);
  await expect(page).toHaveURL(/#tro-giup$/);
  await expect(page.locator('.tabbar')).toBeVisible();
});

test('câu giao tiếp phóng to, Esc và × đều đóng', async ({ page }) => {
  await go(page);
  await page.locator('[data-phrase="0"]').click();
  await expect(page.getByRole('dialog')).toContainText('洗手间在哪里?');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-phrase="1"]').click();
  await page.getByRole('dialog').locator('[data-close]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#tro-giup$/);
});
```

Run: `npx playwright test tests/e2e/help.spec.js` → Expected: FAIL.

- [ ] **Step 2: Viết `js/components/driver-card.js`**

```js
import { esc } from '../dom.js';
import { openOverlay } from '../overlay.js';
import { amapLink } from '../links.js';

export const hasHotel = h => !!(h && h.zh && h.addressZh);
export const hotelTarget = h => ({ zh: h.zh, zhFull: h.zh, name: h.name, addressZh: h.addressZh, addressVi: h.addressVi, lat: h.lat, lng: h.lng });

export function driverCardHtml(t, showHotel) {
  const py = [t.pinyin, t.name].filter(Boolean).join(' · ');
  return `<div class="drv">
    <button type="button" class="ov-close" data-close aria-label="Đóng">×</button>
    <p class="drv-hint">Đưa màn hình này cho tài xế</p>
    <p class="drv-say"><span lang="zh-CN">请带我去这里</span><small>Xin chở tôi tới đây</small></p>
    <div class="drv-dest">
      <p class="drv-name" lang="zh-CN">${esc(t.zhFull || t.zh)}</p>
      ${py ? `<p class="drv-py">${esc(py)}</p>` : ''}
      ${t.addressZh ? `<p class="drv-addr" lang="zh-CN">${esc(t.addressZh)}</p>` : ''}
      ${t.addressVi ? `<p class="drv-vi">${esc(t.addressVi)}</p>` : ''}
    </div>
    ${t.dropOffZh ? `<p class="drv-gate"><span lang="zh-CN">${esc(t.dropOffZh)}</span><small>${esc(t.dropOffVi)}</small></p>` : ''}
    <div class="drv-acts">
      <a class="btn btn-pri" href="${esc(amapLink(t))}" target="_blank" rel="noopener">Mở Amap</a>
      ${showHotel ? '<button type="button" class="btn btn-sec" data-hotel-card>Về khách sạn</button>' : ''}
    </div>
  </div>`;
}

export function openDriverCard(target, hotel) {
  let lock = null;
  const wake = async () => { try { lock = (await navigator.wakeLock?.request('screen')) || null; } catch { lock = null; } };
  const onVis = () => { if (document.visibilityState === 'visible') wake(); };
  const showHotel = hasHotel(hotel) && hotel.addressZh !== target.addressZh;
  const ov = openOverlay(driverCardHtml(target, showHotel), {
    label: 'Thẻ tài xế', cls: 'ov-driver',
    onClose: () => { document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); },
  });
  wake();
  document.addEventListener('visibilitychange', onVis);
  ov.el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) ov.close();
    else if (e.target.closest('[data-hotel-card]')) {
      ov.el.innerHTML = driverCardHtml(hotelTarget(hotel), false);
      ov.el.querySelector('[data-close]').focus();
    }
  });
  return ov;
}
```

- [ ] **Step 3: Viết `js/views/tro-giup.js`**

```js
import { esc } from '../dom.js';
import { telHref } from '../links.js';
import { openOverlay } from '../overlay.js';
import { openDriverCard, hotelTarget, hasHotel } from '../components/driver-card.js';

export function renderHelp(ctx) {
  const c = ctx.data.contacts;
  let h = '<h1 class="view-h">Trợ giúp</h1><div class="stack">';
  h += hasHotel(c.hotel)
    ? `<button type="button" class="help-big" data-hotel><span class="eyebrow">Về khách sạn</span><b lang="zh-CN">${esc(c.hotel.zh)}</b><span class="sub">${esc(c.hotel.name)} · mở thẻ cho tài xế</span></button>`
    : '<div class="card"><span class="eyebrow">Về khách sạn</span><p class="sub">Chưa có thông tin khách sạn</p></div>';
  const rows = [];
  if (c.driver?.phone) rows.push(`<a class="help-row" href="${telHref(c.driver.phone)}"><b>Gọi tài xế</b><span>${esc([c.driver.name, c.driver.plate, c.driver.phone].filter(Boolean).join(' · '))}</span></a>`);
  if (c.hotline) rows.push(`<a class="help-row" href="${telHref(c.hotline)}"><b>Gọi hotline</b><span>${esc(c.hotline)}</span></a>`);
  if (c.zalo) rows.push(`<a class="help-row" href="${esc(c.zalo)}" target="_blank" rel="noopener"><b>Nhóm Zalo của đoàn</b><span>Mở Zalo</span></a>`);
  if (rows.length) h += `<div class="card help-list">${rows.join('')}</div>`;
  h += `<section><span class="eyebrow">Khẩn cấp tại Trung Quốc</span><div class="sos">${[['110', 'Công an'], ['120', 'Cấp cứu'], ['119', 'Cứu hỏa']]
    .map(([n, l]) => `<a href="tel:${n}"><b>${n}</b><span>${l}</span></a>`).join('')}</div></section>`;
  h += `<section class="card"><span class="eyebrow">Câu hay dùng · chạm để phóng to</span>${ctx.data.phrases
    .map((p, i) => `<button type="button" class="phr" data-phrase="${i}"><b lang="zh-CN">${esc(p.zh)}</b><span>${esc(p.vi)}</span></button>`).join('')}</section>`;
  const e = c.embassy;
  h += `<button type="button" class="card help-emb" data-embassy><span class="eyebrow">${esc(e.name)}</span><span>${esc(e.addressVi)}</span><span class="zhline" lang="zh-CN">${esc(e.addressZh)} ${esc(e.zh)}</span><span class="link">Mở thẻ cho tài xế</span></button>`;
  return h + '</div>';
}

export function mountHelp(root, ctx) {
  const c = ctx.data.contacts;
  root.querySelector('[data-hotel]')?.addEventListener('click', () => openDriverCard(hotelTarget(c.hotel), null));
  root.querySelector('[data-embassy]')?.addEventListener('click', () => openDriverCard({ ...c.embassy, zhFull: c.embassy.zh }, c.hotel));
  for (const b of root.querySelectorAll('[data-phrase]')) {
    b.addEventListener('click', () => {
      const p = ctx.data.phrases[+b.dataset.phrase];
      const ov = openOverlay(`<div class="phr-big"><button type="button" class="ov-close" data-close aria-label="Đóng">×</button><p lang="zh-CN">${esc(p.zh)}</p><span>${esc(p.vi)}</span></div>`, { label: 'Câu giao tiếp', cls: 'ov-phrase' });
      ov.el.addEventListener('click', e => { if (e.target.closest('[data-close]')) ov.close(); });
    });
  }
}
```

- [ ] **Step 4: Chạy — PASS**

Run: `npx playwright test tests/e2e/help.spec.js`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add js/components/driver-card.js js/views/tro-giup.js tests/e2e/help.spec.js
git commit -m "feat: thẻ tài xế toàn màn hình và tab Trợ giúp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Tab Lịch trình (ảnh lớn, dải ngày, danh sách)

**Files:**
- Modify: `js/views/lich-trinh.js` (thay toàn bộ)
- Test: `tests/e2e/itinerary.spec.js`

**Interfaces:**
- Consumes: `heroState`, `deg` (Task 3); `stopStatus`, `dowShort`, `dowOf`, `fmtDM`, `currentAndNext` (Task 3); `openDriverCard` (Task 7); `esc`, `zh`, `imgTag` (Task 6).
- Produces: `defaultViewDate(tourMeta, now)`, `renderItinerary(ctx)`, `mountItinerary(root, ctx)`. Đợt 2/3 sẽ dùng `ctx.features.places` (dòng địa điểm thành link `#dd-<id>`) và `ctx.features.afterTour`.

- [ ] **Step 1: Viết e2e (fail)**

`tests/e2e/itinerary.spec.js`:
```js
import { test, expect } from '@playwright/test';

const go = (page, now, hash = '') => page.goto(`./?now=${now}${hash}`);
const cases = [
  ['2026-11-12T10:00', 'Còn 2 ngày nữa khởi hành', 'Bắc Kinh'],
  ['2026-11-17T09:40', 'Đang diễn ra · còn 1 giờ 35 phút', 'Cố Cung'],
  ['2026-11-17T11:20', 'Đang diễn ra', 'Cà phê Giác Lâu · Cà phê'],
  ['2026-11-17T16:20', 'Tiếp theo · 16:30', 'Khu Olympic'],
  ['2026-11-17T21:00', 'Hết lịch hôm nay', 'Nghỉ ngơi, giữ ấm'],
  ['2026-11-18T09:00', 'Tiếp theo · 10:15', 'Dạo khu trung tâm, mua quà'],
  ['2026-11-18T21:00', 'Chuyến đi đã kết thúc', 'Cảm ơn anh chị đã đi cùng đoàn'],
  ['2026-11-20T10:00', 'Chuyến đi đã kết thúc', 'Cảm ơn anh chị đã đi cùng đoàn'],
];
for (const [now, label, title] of cases) {
  test(`ảnh lớn lúc ${now}`, async ({ page }) => {
    await go(page, now);
    await expect(page.locator('.live')).toHaveText(label);
    await expect(page.locator('.hero-title')).toHaveText(title);
    await expect(page.locator('.hero-tz')).toHaveText('Giờ Bắc Kinh · nhanh hơn Việt Nam 1 tiếng');
  });
}

test('mặc định chọn hôm nay; bấm ngày 16 đổi ảnh và danh sách', async ({ page }) => {
  await go(page, '2026-11-17T09:40');
  await expect(page.locator('.day[aria-pressed="true"] b')).toHaveText('17');
  await page.locator('.day[data-date="2026-11-16"]').click();
  await expect(page.locator('.day[aria-pressed="true"] b')).toHaveText('16');
  await expect(page.locator('.hero-title')).toHaveText('Vạn Lý Trường Thành · Mộ Điền Dụ');
  await expect(page.locator('.live')).toHaveCount(0);
  await expect(page.locator('.stop-title').first()).toHaveText('Xe đưa đi Mộ Điền Dụ');
});

test('hôm nay: mục đã qua gom vào "Đã qua", mục hiện tại có chấm đỏ', async ({ page }) => {
  await go(page, '2026-11-17T12:40');
  await expect(page.locator('details.past summary')).toContainText('Đã qua');
  await expect(page.locator('.stop.is-now .stop-title')).toHaveText('Công viên Cảnh Sơn');
});

test('mục dự phòng ngày 18 có nhãn và không là đang diễn ra', async ({ page }) => {
  await go(page, '2026-11-18T09:00');
  const opt = page.locator('.stop', { hasText: 'Bảo tàng Lịch sử Tự nhiên' });
  await expect(opt.locator('.pill', { hasText: 'Dự phòng' })).toBeVisible();
  await expect(page.locator('.stop.is-now')).toHaveCount(0);
});

test('ảnh món có chú thích minh họa; sân bay lấy từ contacts', async ({ page }) => {
  await go(page, '2026-11-14T08:00');
  await expect(page.locator('.stop', { hasText: 'Đô Nhất Xứ' }).locator('.stop-note')).toHaveText('Ảnh minh họa món');
  await page.locator('.day[data-date="2026-11-18"]').click();
  await expect(page.locator('.stop', { hasText: 'Lên xe ra sân bay' }).locator('.stop-sub')).toHaveText('Sân bay PEK hoặc PKX tùy vé');
});

test('quán có địa chỉ mở thẻ tài xế', async ({ page }) => {
  await go(page, '2026-11-14T08:00');
  await page.locator('[data-driver="d14-3"]').click();
  await expect(page.getByRole('dialog')).toContainText('北京市东城区前门大街38号');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('không cuộn ngang ở 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const h of ['', '#chuan-bi', '#tro-giup']) {
    await go(page, '2026-11-17T09:40', h);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, h || 'lich-trinh').toBeLessThanOrEqual(0);
  }
});
```

Run: `npx playwright test tests/e2e/itinerary.spec.js` → Expected: FAIL.

- [ ] **Step 2: Viết `js/views/lich-trinh.js`**

```js
import { esc, zh, imgTag } from '../dom.js';
import { heroState, deg } from '../hero.js';
import { stopStatus, dowShort, dowOf, fmtDM, currentAndNext } from '../time.js';
import { openDriverCard } from '../components/driver-card.js';

const KIND = { sight: 'Tham quan', meal: 'Ăn', cafe: 'Cà phê', move: 'Di chuyển' };

export const defaultViewDate = (t, now) => (now.date < t.start ? t.start : now.date > t.end ? t.end : now.date);

function airportSub(data) {
  const f = data.contacts.flightBack || {};
  return f.airport ? `Sân bay ${f.airport}${f.time ? ' · bay ' + f.time : ''}` : 'Sân bay PEK hoặc PKX tùy vé';
}

function stopRow(data, s, ctx, status, isNow) {
  const p = s.place ? data.places.find(x => x.id === s.place) : null;
  const sub = s.airport ? airportSub(data) : s.sub;
  const flags = (s.optional ? '<span class="pill">Dự phòng</span>' : '') + (s.flag ? `<span class="pill">${esc(s.flag)}</span>` : '');
  const inner = `<span class="stop-t">${esc(s.s)}${s.e ? `<small>${esc(s.e)}</small>` : ''}</span>
    <span class="stop-b">
      <span class="stop-k">${esc(s.kind || KIND[s.k])}</span>
      <span class="stop-title">${esc(s.title)}</span>
      ${s.zh ? `<span class="stop-zh">${zh(s.zh)}</span>` : ''}
      ${sub ? `<span class="stop-sub">${esc(sub)}</span>` : ''}
      ${s.thumb && s.thumbNote ? `<span class="stop-note">${esc(s.thumbNote)}</span>` : ''}
      ${flags ? `<span class="stop-flags">${flags}</span>` : ''}
      ${s.addressZh ? '<span class="stop-drv">Thẻ tài xế ›</span>' : ''}
    </span>
    ${s.thumb ? imgTag(s.thumb, 160, '', 'stop-thumb') : '<span></span>'}`;
  let row;
  if (p && ctx.features.places) row = `<a class="stop-row" href="#dd-${esc(p.id)}">${inner}</a>`;
  else if (s.addressZh) row = `<button type="button" class="stop-row" data-driver="${esc(s.id)}">${inner}</button>`;
  else row = `<div class="stop-row">${inner}</div>`;
  const cls = `stop stop-${s.k}${status === 'past' ? ' is-past' : ''}${isNow ? ' is-now' : ''}`;
  return `<li class="${cls}"${isNow ? ' aria-current="true"' : ''}>${row}</li>`;
}

export function renderItinerary(ctx) {
  const { data, now, viewDate } = ctx;
  const h = heroState(data, now, viewDate);
  const day = data.days.find(d => d.date === viewDate);
  const isToday = viewDate === now.date;
  const { cur } = isToday ? currentAndNext(day, now.min) : { cur: null };

  let out = `<header class="hero">${imgTag(h.img, 900, '', 'hero-img', 'eager')}
    <div class="hero-top"><span>${esc(data.tour.brand)}</span><span>${esc(data.tour.title)}</span></div>
    <div class="hero-in">
      ${h.label ? `<span class="live${h.kind === 'now' ? ' is-now' : ''}">${esc(h.label)}</span>` : ''}
      <h1 class="hero-title">${esc(h.title)}</h1>
      ${h.zh ? `<p class="hero-zh">${zh(h.zh)}</p>` : ''}
      ${h.sub ? `<p class="hero-sub">${esc(h.sub)}</p>` : ''}
      ${h.cta && ctx.features.afterTour ? `<a class="hero-cta" href="#sau-tour" data-after>${esc(h.cta)}</a>` : ''}
      <p class="hero-tz">Giờ Bắc Kinh · nhanh hơn Việt Nam 1 tiếng</p>
    </div></header>`;

  out += `<nav class="days" aria-label="Chọn ngày"><div class="days-in">${data.days.map(d =>
    `<button type="button" class="day" data-date="${d.date}" aria-pressed="${d.date === viewDate}"><b>${+d.date.slice(8)}</b><span>${dowShort(d.date)}</span></button>`).join('')}</div></nav>`;

  const rows = day.stops.map(s => ({ s, st: stopStatus(s, viewDate, now) }));
  let list;
  if (isToday) {
    const past = rows.filter(r => r.st === 'past' && r.s !== cur);
    const rest = rows.filter(r => !past.includes(r));
    list = (past.length ? `<details class="past"><summary>Đã qua (${past.length})</summary><ol>${past.map(r => stopRow(data, r.s, ctx, 'past', false)).join('')}</ol></details>` : '')
      + (rest.length ? `<span class="eyebrow">Tiếp theo hôm nay</span><ol>${rest.map(r => stopRow(data, r.s, ctx, r.st, r.s === cur)).join('')}</ol>` : '');
  } else {
    list = `<span class="eyebrow">${esc(dowOf(day.date))} ${fmtDM(day.date)} · ${deg(day.lo)} đến ${day.hi}°C · ${esc(day.wx)}</span>
      <ol>${rows.map(r => stopRow(data, r.s, ctx, r.st, false)).join('')}</ol>`;
  }
  out += `<section class="stops" aria-label="Lịch trong ngày">${list}</section>`;
  return out;
}

export function mountItinerary(root, ctx) {
  for (const b of root.querySelectorAll('.day')) b.addEventListener('click', () => ctx.setViewDate(b.dataset.date));
  for (const b of root.querySelectorAll('[data-driver]')) {
    b.addEventListener('click', () => {
      const s = ctx.data.days.flatMap(d => d.stops).find(x => x.id === b.dataset.driver);
      openDriverCard({ zh: s.zh, zhFull: s.zh, name: s.title, addressZh: s.addressZh, addressVi: s.addressVi, lat: s.lat, lng: s.lng }, ctx.data.contacts.hotel);
    });
  }
}
```

- [ ] **Step 3: Chạy — PASS**

Run: `npx playwright test tests/e2e/itinerary.spec.js`
Expected: tất cả PASS. Nếu test "không cuộn ngang" fail, sửa CSS gây tràn (thường do chữ Hán dài không xuống dòng — thêm `overflow-wrap:anywhere` vào phần tử đó).

- [ ] **Step 4: Commit**

```bash
git add js/views/lich-trinh.js tests/e2e/itinerary.spec.js
git commit -m "feat: tab Lịch trình sống theo giờ Bắc Kinh, dải ngày kiểu A

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Tab Chuẩn bị

**Files:**
- Modify: `js/views/chuan-bi.js` (thay toàn bộ)
- Test: `tests/e2e/prep.spec.js`

**Interfaces:**
- Consumes: `get`, `set` (Task 4), `deg` (Task 3), `fmtDM` (Task 3), `esc` (Task 6).
- Produces: `renderPrep(ctx)`, `mountPrep(root)`, `isStandalone() → boolean`, `installGuideHtml() → string`.

- [ ] **Step 1: Viết e2e (fail)**

`tests/e2e/prep.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('hướng dẫn lưu máy hiện khi mở bằng trình duyệt (Android)', async ({ page }) => {
  await page.goto('./?now=2026-11-12T10:00#chuan-bi');
  const g = page.locator('.install');
  await expect(g).toContainText('Lưu sổ tay vào máy trước khi bay');
  await expect(g.locator('li')).toHaveCount(4);
  await expect(g).toContainText('Chrome');
});

test('việc cần làm và đồ cần mang được lưu sau khi tải lại', async ({ page }) => {
  await page.goto('./?now=2026-11-12T10:00#chuan-bi');
  await expect(page.locator('input[data-ns="prep"]')).toHaveCount(4);
  await page.locator('input[data-id="luu-offline"]').check();
  await page.locator('input[data-id="ho-chieu"]').check();
  await page.reload();
  await expect(page.locator('input[data-id="luu-offline"]')).toBeChecked();
  await expect(page.locator('input[data-id="ho-chieu"]')).toBeChecked();
  await expect(page.locator('input[data-id="amap-offline"]')).not.toBeChecked();
});

test('thời tiết 5 ngày', async ({ page }) => {
  await page.goto('./?now=2026-11-12T10:00#chuan-bi');
  await expect(page.locator('.wxrow')).toHaveCount(5);
  await expect(page.locator('.wxrow').nth(3)).toContainText('−4 / 10°C');
});
```

Run: `npx playwright test tests/e2e/prep.spec.js` → Expected: FAIL.

- [ ] **Step 2: Viết `js/views/chuan-bi.js`**

```js
import { esc } from '../dom.js';
import { deg } from '../hero.js';
import { fmtDM } from '../time.js';
import { get, set } from '../store.js';

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

export function installGuideHtml() {
  const steps = isIOS()
    ? ['Mở link này bằng Safari, đang có wifi.', 'Bấm nút Chia sẻ (ô vuông có mũi tên lên) → "Thêm vào MH chính".',
       'Mở sổ tay từ biểu tượng vừa tạo, giữ wifi, chờ hiện "Đã lưu ✓".', 'Bật chế độ máy bay, mở lại biểu tượng để thử.']
    : ['Mở link này bằng Chrome, đang có wifi.', 'Bấm menu ⋮ → "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".',
       'Mở sổ tay từ biểu tượng vừa tạo, giữ wifi, chờ hiện "Đã lưu ✓".', 'Bật chế độ máy bay, mở lại biểu tượng để thử.'];
  return `<div class="card install"><span class="eyebrow">Lưu sổ tay vào máy trước khi bay</span><ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <p class="sub">Ở Trung Quốc nhiều trang nước ngoài bị chặn. Làm xong 4 bước này, sổ tay chạy không cần mạng.</p></div>`;
}

function tbar(lo, hi, min, max) {
  const p = v => ((v - min) / (max - min)) * 100;
  return `<span class="trange" role="img" aria-label="Từ ${lo} đến ${hi} độ C"><i style="left:${p(lo).toFixed(1)}%;width:${(p(hi) - p(lo)).toFixed(1)}%"></i><em style="left:${p(0).toFixed(1)}%"></em></span>`;
}
const checks = (ns, items) => items.map(it =>
  `<label class="chk"><input type="checkbox" data-ns="${ns}" data-id="${esc(it.id)}"${get(ns, it.id) ? ' checked' : ''}><span>${esc(it.text)}</span></label>`).join('');

export function renderPrep(ctx) {
  const d = ctx.data;
  const temps = d.days.flatMap(x => [x.lo, x.hi]);
  const min = Math.min(...temps, 0) - 1, max = Math.max(...temps) + 1;
  let h = '<h1 class="view-h">Chuẩn bị</h1><div class="stack">';
  if (!isStandalone()) h += installGuideHtml();
  h += `<div class="card"><span class="eyebrow">Việc cần làm trước chuyến</span><div class="checks">${checks('prep', d.prepTasks)}</div></div>`;
  h += `<div class="card"><span class="eyebrow">Thời tiết 5 ngày</span>${d.days.map(x =>
    `<div class="wxrow"><span class="dd">${fmtDM(x.date)}</span>${tbar(x.lo, x.hi, min, max)}<span class="tt">${deg(x.lo)} / ${x.hi}°C</span><span class="wxnote">${esc(x.wx)}</span></div>`).join('')}
    <p class="sub">Dự báo lúc lập lịch. Vạch mảnh là mốc 0°C. Mặt trời lặn khoảng 17:00.</p></div>`;
  h += `<div class="card"><span class="eyebrow">Trang phục chung</span>${d.wearGeneral.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
  h += `<div class="card"><span class="eyebrow">Danh sách cần mang</span><div class="checks">${checks('pack', d.checklist)}</div><p class="sub">Đánh dấu được lưu trên máy này.</p></div>`;
  h += `<div class="card"><span class="eyebrow">Lưu ý về Bắc Kinh</span><dl class="kv">${d.prepNotes.map(n => `<dt>${esc(n.k)}</dt><dd>${esc(n.v)}</dd>`).join('')}</dl></div>`;
  return h + '</div>';
}

export function mountPrep(root) {
  for (const i of root.querySelectorAll('input[data-ns]')) i.addEventListener('change', () => set(i.dataset.ns, i.dataset.id, i.checked));
}
```

- [ ] **Step 3: Chạy — PASS**

Run: `npx playwright test tests/e2e/prep.spec.js`
Expected: 3 PASS.

- [ ] **Step 4: Commit**

```bash
git add js/views/chuan-bi.js tests/e2e/prep.spec.js
git commit -m "feat: tab Chuẩn bị với việc cần làm, hướng dẫn lưu máy, thời tiết

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Lưu offline (service worker, danh sách tệp, thanh trạng thái)

**Files:**
- Create: `tools/gen_assets.py`, `sw.js`, `sw-range.js`, `tests/py/test_gen_assets.py`, `tests/unit/sw-range.test.js`, `tests/e2e/offline.spec.js`
- Modify: `js/offline.js` (thay toàn bộ), `assets.js` (sinh lại)

**Interfaces:**
- Consumes: mọi tệp tĩnh của các task trước.
- Produces:
  - `assets.js`: `self.ASSETS = { app: { version, files: ['./', './index.html', …] }, media: { version, files: ['./img/…'] } }`
  - Tin nhắn SW → trang: `{type:'progress', done, total}`, `{type:'saved', total}`, `{type:'partial', done, total, failed:[]}`; trang → SW: `{type:'retry'}`
  - `parseRange(header, size) → {start, end} | null`
  - `checkSaved(A?) → Promise<{state:'saved'|'missing'|'unsupported', done, total}>`

- [ ] **Step 1: Viết test Python cho gen_assets (fail)**

`tests/py/test_gen_assets.py`:
```python
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "tools"))
import gen_assets  # noqa: E402


def touch(root, rel, content=b"x"):
    p = os.path.join(root, *rel.split("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(content)


class GenAssetsTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        for rel in ["index.html", "manifest.webmanifest", "assets.js", "css/styles.css", "js/main.js", "js/views/a.js",
                    "data/tour.json", "fonts/a.woff2", "icons/icon-192.png", "img/a-160.webp", "img/a-900.webp",
                    "video/v.mp4", "tools/serve.py", "tests/x.js", "img/.DS_Store"]:
            touch(self.root, rel)

    def test_lists(self):
        a = gen_assets.build(self.root)
        self.assertEqual(a["app"]["files"][:2], ["./", "./index.html"])
        self.assertIn("./assets.js", a["app"]["files"])
        self.assertIn("./js/views/a.js", a["app"]["files"])
        self.assertNotIn("./tools/serve.py", a["app"]["files"])
        self.assertEqual(a["media"]["files"], ["./img/a-160.webp", "./img/a-900.webp", "./video/v.mp4"])

    def test_version_follows_content_and_media_is_separate(self):
        a1 = gen_assets.build(self.root)
        touch(self.root, "data/tour.json", b"changed")
        a2 = gen_assets.build(self.root)
        self.assertNotEqual(a1["app"]["version"], a2["app"]["version"])
        self.assertEqual(a1["media"]["version"], a2["media"]["version"])

    def test_assets_js_content_does_not_affect_version(self):
        a1 = gen_assets.build(self.root)
        touch(self.root, "assets.js", b"self.ASSETS = {}")
        self.assertEqual(a1["app"]["version"], gen_assets.build(self.root)["app"]["version"])


if __name__ == "__main__":
    unittest.main()
```

Run: `npm run test:py` → Expected: FAIL — `No module named 'gen_assets'`.

- [ ] **Step 2: Viết `tools/gen_assets.py`**

```python
"""Sinh assets.js (danh sách tệp cần lưu offline + VERSION theo nội dung). Chạy trước mỗi lần đăng: python tools/gen_assets.py"""
import hashlib
import json
import os

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
    a = build()
    with open(os.path.join(ROOT, "assets.js"), "w", encoding="utf-8") as f:
        f.write("self.ASSETS = " + json.dumps(a, ensure_ascii=False, indent=1) + ";\n")
    print(f"app {a['app']['version']} ({len(a['app']['files'])} tệp) · media {a['media']['version']} ({len(a['media']['files'])} tệp)")


if __name__ == "__main__":
    main()
```

Run: `npm run test:py` → Expected: 3 PASS.

- [ ] **Step 3: Viết test parseRange (fail) và `sw-range.js`**

`tests/unit/sw-range.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../../sw-range.js', import.meta.url), 'utf8'), ctx);
const R = (h, size = 100) => { const r = ctx.parseRange(h, size); return r && { start: r.start, end: r.end }; };

test('bytes=0-', () => assert.deepEqual(R('bytes=0-'), { start: 0, end: 99 }));
test('đoạn giữa', () => assert.deepEqual(R('bytes=10-19'), { start: 10, end: 19 }));
test('đuôi', () => assert.deepEqual(R('bytes=-10'), { start: 90, end: 99 }));
test('vượt cuối bị cắt', () => assert.deepEqual(R('bytes=90-200'), { start: 90, end: 99 }));
test('ngoài phạm vi', () => assert.equal(R('bytes=100-'), null));
test('sai định dạng', () => { assert.equal(R('items=0-1'), null); assert.equal(R(''), null); });
```

`sw-range.js`:
```js
/* Classic script: dùng trong sw.js qua importScripts và trong test qua vm. */
function parseRange(header, size) {
  var m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!m || (m[1] === '' && m[2] === '')) return null;
  var start, end;
  if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start >= size || start > end) return null;
  return { start: start, end: end };
}
```

Run: `npm test` → Expected: PASS (gồm `sw-range`).

- [ ] **Step 4: Viết `sw.js`**

```js
/* Service worker sổ tay Bắc Kinh. Đường dẫn tương đối theo vị trí sw.js. */
importScripts('./assets.js', './sw-range.js');

const A = self.ASSETS;
const APP = 'app-' + A.app.version;
const MEDIA = 'media-' + A.media.version;
const TOTAL = A.app.files.length + A.media.files.length;

async function post(msg) {
  const cs = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of cs) c.postMessage(msg);
}

async function fill(name, files, counter) {
  const cache = await caches.open(name);
  const failed = [];
  for (const f of files) {
    let ok = !!(await cache.match(f));
    for (let i = 0; i < 3 && !ok; i++) {
      try {
        const r = await fetch(f, { cache: 'reload' });
        if (r.ok) { await cache.put(f, r); ok = true; }
      } catch (e) { /* thử lại */ }
    }
    counter.done++;
    if (!ok) failed.push(f);
    post({ type: 'progress', done: counter.done, total: TOTAL });
  }
  return failed;
}

async function fillAll() {
  const counter = { done: 0 };
  const appFailed = await fill(APP, A.app.files, counter);
  const mediaFailed = await fill(MEDIA, A.media.files, counter);
  const failed = appFailed.concat(mediaFailed);
  await post(failed.length ? { type: 'partial', done: TOTAL - failed.length, total: TOTAL, failed } : { type: 'saved', total: TOTAL });
  if (appFailed.length) throw new Error('Thiếu tệp app: ' + appFailed.join(', '));
}

self.addEventListener('install', e => {
  e.waitUntil(fillAll().then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== APP && k !== MEDIA) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'retry') e.waitUntil(fillAll().catch(() => {}));
});

async function networkFirst(req, ms) {
  const cache = await caches.open(APP);
  try {
    const r = await Promise.race([
      fetch(req, { cache: 'no-store' }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
    ]);
    if (r.ok) { await cache.put('./data/tour.json', r.clone()); return r; }
  } catch (e) { /* mạng chậm/bị chặn: dùng bản đã lưu */ }
  return (await cache.match('./data/tour.json')) || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
}

async function rangeFromCache(req) {
  const cached = await caches.match(req.url, { ignoreSearch: true });
  if (!cached) return fetch(req);
  const buf = await cached.arrayBuffer();
  const r = parseRange(req.headers.get('range'), buf.byteLength);
  if (!r) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + buf.byteLength } });
  return new Response(buf.slice(r.start, r.end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': 'bytes ' + r.start + '-' + r.end + '/' + buf.byteLength,
      'Content-Length': String(r.end - r.start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html', { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }
  if (url.pathname.endsWith('/data/tour.json')) { e.respondWith(networkFirst(req, 3000)); return; }
  if (req.headers.has('range')) { e.respondWith(rangeFromCache(req)); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
```

- [ ] **Step 5: Viết `js/offline.js` đầy đủ**

```js
const BAR_OK_MS = 4000;
let hideTimer = null;

function show(bar, html, cls = '') {
  clearTimeout(hideTimer);
  bar.className = `offline-bar ${cls}`;
  bar.innerHTML = html;
  bar.hidden = false;
}
function flash(bar, text, cls = 'ok') {
  show(bar, `<span>${text}</span>`, cls);
  hideTimer = setTimeout(() => { bar.hidden = true; }, BAR_OK_MS);
}

export async function checkSaved(A = self.ASSETS) {
  if (!('caches' in self) || !A || !A.app.files.length) return { state: 'unsupported', done: 0, total: 0 };
  const total = A.app.files.length + A.media.files.length;
  const names = await caches.keys();
  const app = names.includes('app-' + A.app.version) ? await caches.open('app-' + A.app.version) : null;
  const media = names.includes('media-' + A.media.version) ? await caches.open('media-' + A.media.version) : null;
  let missing = 0;
  for (const f of A.app.files) if (!app || !(await app.match(f))) missing++;
  for (const f of A.media.files) if (!media || !(await media.match(f))) missing++;
  return { state: missing ? 'missing' : 'saved', done: total - missing, total };
}

export function initOffline(bar) {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  const retry = async () => {
    show(bar, '<span>Đang lưu lại…</span>');
    const reg = await sw.ready;
    reg.active?.postMessage({ type: 'retry' });
  };
  sw.addEventListener('message', e => {
    const m = e.data || {};
    if (m.type === 'progress') show(bar, `<span>Đang lưu ${m.done}/${m.total}…</span><progress max="${m.total}" value="${m.done}"></progress>`);
    else if (m.type === 'saved') flash(bar, 'Đã lưu ✓ dùng được khi không có mạng');
    else if (m.type === 'partial') {
      show(bar, `<span>Lưu chưa xong · ${m.done}/${m.total} tệp</span><button type="button" data-retry>Thử lại</button>`, 'warn');
      bar.querySelector('[data-retry]').addEventListener('click', retry);
    }
  });
  sw.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  (async () => {
    const reg = await sw.getRegistration();
    if (!reg || !reg.active) {
      if (!navigator.onLine) show(bar, '<span>Chưa lưu · cần mạng để lưu lần đầu</span>', 'warn');
      return; // lần cài đầu: tin nhắn tiến độ sẽ tới
    }
    const s = await checkSaved();
    if (s.state !== 'missing') return;
    if (navigator.onLine) reg.active.postMessage({ type: 'retry' });
    else show(bar, `<span>Lưu chưa đủ · ${s.done}/${s.total} · cần mạng</span>`, 'warn');
  })();
}

export function notifyVersion(v, bar) {
  const K = 'bk-tour-version';
  let prev = null;
  try { prev = localStorage.getItem(K); localStorage.setItem(K, v); } catch { /* bỏ qua */ }
  if (prev && prev !== v) flash(bar, 'Đã cập nhật lịch');
}
```

- [ ] **Step 6: Sinh `assets.js`**

Run: `python tools/gen_assets.py`
Expected: `app <hash> (~25 tệp) · media <hash> (24 tệp)`.

- [ ] **Step 7: Viết e2e offline (Chromium)**

`tests/e2e/offline.spec.js`:
```js
import { test, expect } from '@playwright/test';

const savedAndControlled = async page => {
  await expect(page.locator('#offline-bar')).toContainText('Đã lưu ✓', { timeout: 45_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
};

test('lưu lần đầu rồi chạy khi mất mạng', async ({ page, context }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await savedAndControlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  const w = await page.locator('.hero-img').evaluate(i => i.complete && i.naturalWidth);
  expect(w).toBeGreaterThan(0);
  await page.locator('#tabs a[data-v="tro-giup"]').click();
  await expect(page.locator('.sos a')).toHaveCount(3);
  await page.locator('[data-embassy]').click();
  await expect(page.getByRole('dialog')).toContainText('越南大使馆');
  await context.setOffline(false);
});

test('?now vẫn mở được khi mất mạng (bỏ qua query khi khớp trang)', async ({ page, context }) => {
  await page.goto('./');
  await savedAndControlled(page);
  await context.setOffline(true);
  await page.goto('./?now=2026-11-18T21:00');
  await expect(page.locator('.live')).toHaveText('Chuyến đi đã kết thúc');
  await context.setOffline(false);
});
```

- [ ] **Step 8: Chạy toàn bộ**

```bash
npm test && npm run test:py && npm run e2e
```
Expected: tất cả PASS. Nếu `setOffline` không chặn được request của service worker ở bản Chromium đang dùng, thay bằng `await context.route('**/*', r => r.abort())` sau khi đã lưu, rồi chạy lại.

- [ ] **Step 9: Kiểm tra tay trạng thái "Lưu chưa xong"**

Thêm tạm một dòng `"./img/khong-co.webp"` vào mảng `media.files` trong `assets.js`. Chạy `npm run serve`, mở `http://127.0.0.1:8765/so-tay/` bằng Chrome ở cửa sổ ẩn danh. Expected: thanh "Lưu chưa xong · n/n+1 tệp · Thử lại"; trang vẫn dùng được. Sau đó chạy lại `python tools/gen_assets.py` để xóa dòng tạm.

- [ ] **Step 10: Commit**

```bash
git add tools/gen_assets.py sw.js sw-range.js js/offline.js assets.js tests/py/test_gen_assets.py tests/unit/sw-range.test.js tests/e2e/offline.spec.js
git commit -m "feat: lưu offline 2 kho, tiến độ thật, thử lại, video Range 206

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Đăng lên mạng và thử trên máy thật

**Files:**
- Create: `docs/huong-dan-gui-nhom.md` (tin nhắn mẫu gửi Zalo)
- Modify: `data/tour.json` (điền `contacts` khi anh gửi), `assets.js` (sinh lại)

**Interfaces:**
- Consumes: toàn bộ đợt 1.
- Produces: URL công khai `https://<tai-khoan>.github.io/so-tay-bac-kinh/`.

- [ ] **Step 1: Hỏi anh 2 quyết định trước khi đăng (DỪNG, chờ trả lời)**

1. Repo GitHub **công khai** (GitHub Pages miễn phí yêu cầu repo công khai) sẽ để lộ: số điện thoại tài xế/hotline, tên khách sạn, và ảnh sưu tầm "chỉ dùng cá nhân" (đợt 2). Phương án: (a) chấp nhận, (b) không điền số điện thoại vào web, chỉ gửi trong nhóm Zalo, (c) dùng Cloudflare Pages tải thẳng thư mục (repo không công khai; cần tài khoản Cloudflare).
2. Anh đã có dữ liệu mục 8 của spec chưa (khách sạn, tài xế, hotline, Zalo, chuyến bay về)?

- [ ] **Step 2: Điền dữ liệu liên hệ đã có vào `data/tour.json`, đổi `version`**

Số điện thoại dạng quốc tế (`+86…`, `+84…`). Tăng `version` (ví dụ `2026-11-12b`). Chạy:
```bash
npm test && python tools/gen_assets.py
```

- [ ] **Step 3: Đăng (theo lựa chọn ở Step 1)**

GitHub Pages: anh tạo repo trống `so-tay-bac-kinh` trên github.com (không thêm README), rồi:
```bash
git remote add origin https://github.com/<tai-khoan>/so-tay-bac-kinh.git
git push -u origin main
```
Trên GitHub: Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save. Chờ 1–2 phút.

- [ ] **Step 4: Kiểm tra URL thật**

```bash
for p in "" index.html sw.js assets.js data/tour.json css/fonts.css manifest.webmanifest; do curl -s -o /dev/null -w "%{http_code} $p\n" "https://<tai-khoan>.github.io/so-tay-bac-kinh/$p"; done
```
Expected: toàn `200`. Chạy e2e offline trên URL thật:
```bash
npx playwright test tests/e2e/offline.spec.js --config playwright.config.js -g "lưu lần đầu" 
```
(tạm đổi `baseURL` sang URL thật bằng biến môi trường nếu cần; không commit thay đổi đó.)

- [ ] **Step 5: Viết tin nhắn mẫu gửi nhóm**

`docs/huong-dan-gui-nhom.md`:
```markdown
📒 Sổ tay đoàn Bắc Kinh 14–18/11: <URL>

Làm NGAY khi còn ở Việt Nam, đang có wifi (mất 1–2 phút):
iPhone: mở link bằng Safari → nút Chia sẻ → "Thêm vào MH chính" → mở sổ tay TỪ BIỂU TƯỢNG vừa tạo → chờ hiện "Đã lưu ✓".
Android: mở link bằng Chrome → menu ⋮ → "Cài đặt ứng dụng"/"Thêm vào màn hình chính" → mở từ biểu tượng → chờ "Đã lưu ✓".
Thử: bật chế độ máy bay, mở lại biểu tượng — vẫn xem được là xong.
Sang Trung Quốc chỉ cần mở biểu tượng, không cần mạng.
```

- [ ] **Step 6: Anh thử trên iPhone và Android thật (DỪNG, chờ kết quả)**

Theo đúng 4 bước của tin nhắn mẫu, rồi bật chế độ máy bay và đi qua: Lịch trình (bấm đổi ngày), Chuẩn bị (tích một ô, mở lại vẫn còn), Trợ giúp (mở thẻ đại sứ quán, bấm Back). Báo lại máy nào lỗi ở bước nào.

- [ ] **Step 7: Commit**

```bash
git add data/tour.json assets.js docs/huong-dan-gui-nhom.md
git commit -m "chore: dữ liệu liên hệ, đăng đợt 1, tin nhắn hướng dẫn nhóm

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

## Self-review (đã chạy)

- **Phủ spec đợt 1:** §2 kiến trúc (T1, T5, T6, T10) · §3 thị giác (T6 CSS) · §4 điều hướng 3 tab + chân trang (T6) · §5.1 Lịch trình + bảng trạng thái + 5.1a (T3, T8) · §5.5 thẻ tài xế, Amap, Wake Lock (T4, T7) · §5.6 Chuẩn bị (T9) · §5.7 Trợ giúp (T7) · §6 dữ liệu (T2) · §7 offline đủ 7.1–7.5 (T10, hướng dẫn ở T9/T11) · §8 dữ liệu anh cung cấp (T11) · §10 kiểm thử (unit T3/T4/T10, e2e T6–T10, máy thật T11). Đợt 2 (§5.2–5.4) và đợt 3 (video, thẻ Sau tour) nằm ở hai kế hoạch riêng.
- **Tên/kiểu nhất quán:** `heroState(data, now, viewDate)`, `ctx.data`, `openDriverCard(target, hotel)`, `FEATURES.places/photos/afterTour`, `enabledTabs`, `parseRange` — dùng giống nhau ở mọi task.
- **Không placeholder:** các view tạm ở Task 6 Step 5 là mã chạy được, được thay ở Task 7–9 (ghi rõ).
