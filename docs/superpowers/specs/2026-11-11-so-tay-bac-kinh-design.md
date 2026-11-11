# Sổ tay đoàn Bắc Kinh — thiết kế lại (bản dùng thật cho chuyến 14–18/11/2026)

Ngày: 11/11/2026 · Bản 2 (đã sửa theo đợt rà soát) · Trạng thái: chờ anh duyệt spec

## 0. Việc gấp ngoài app

- ~~Vé Cố Cung 17/11, Universal 15/11~~ — **đã xong (11/11): công ty tour đã đặt toàn bộ vé.** Mục 5.6 bỏ các ô đặt vé, thay bằng một dòng nhắc mang hộ chiếu gốc.

## 1. Mục tiêu, ràng buộc, mốc thời gian

- Trang sổ tay cho đoàn của anh dùng trong chuyến Bắc Kinh 14–18/11/2026. Về sau làm lại thành bản demo chào công ty landtour.
- Ở Trung Quốc, đoàn dùng SIM Trung Quốc hoặc wifi khách sạn, tức là sau tường lửa. Trang **offline-first**: lưu vào máy khi còn ở Việt Nam, sau đó chạy không cần mạng.
- Cả đoàn dùng iPhone (Safari) và Android (Chrome).
- **Hạn chót: đăng lên mạng trước tối 12/11**, để cả đoàn kịp lưu vào máy ngày 13/11.
- Ba tính năng nổi bật: **Lịch trình sống theo giờ**, **Thẻ tài xế kèm bản đồ**, **Chụp ảnh và trang phục**.
- Ngoài phạm vi: màn hình phía công ty, backend, đăng nhập, bản PDF dự phòng, landing page bán hàng, dark mode.

### Thứ tự làm (3 đợt, mỗi đợt đều đăng lên được)
1. **Đợt 1, bắt buộc:**
   - Phần lưu offline (mục 7).
   - Tab Lịch trình.
   - Thẻ tài xế.
   - Tab Trợ giúp.
   - Tab Chuẩn bị.
2. **Đợt 2:**
   - Danh sách và chi tiết địa điểm.
   - Mục Chụp ảnh kèm story, chưa có video.
   - Tab Chụp ảnh.
3. **Đợt 3:**
   - Video, tối đa khoảng 5 clip.
   - Thẻ "Sau tour" cuối ngày 18.

**Dời sau chuyến:**
- Tô sáng mục đang đọc khi cuộn.
- Vuốt xuống để đóng story.
- Hướng dẫn cài đặt có hình minh họa (lần này chỉ dùng chữ).

## 2. Kiến trúc

Trang tĩnh, JavaScript thuần, không framework. Đăng lên **GitHub Pages** dạng project page, tức nằm dưới `/<repo>/`.

```
d:\Landtour\
├─ index.html
├─ .nojekyll                  để GitHub Pages không xử lý các thư mục/tệp đặc biệt
├─ css/styles.css
├─ js/app.js                  render, router #hash, logic giờ Bắc Kinh, story, overlay
├─ data/tour.json
├─ img/                       WebP: <ten>-160.webp (thumb), <ten>-900.webp (hero/story)
├─ video/                     <ten>.mp4 (H.264 480p, ≤15 s, không tiếng) + <ten>-poster.webp
├─ fonts/                     woff2 tự host
├─ sw.js
├─ assets.js                  danh sách tệp cần lưu — SINH BẰNG SCRIPT, không gõ tay
├─ manifest.webmanifest
├─ icons/                     192, 512, apple-touch-icon 180
└─ tools/gen-assets.py        quét thư mục, ghi assets.js (APP_ASSETS, MEDIA_ASSETS, hai VERSION)
```

- **Mọi đường dẫn đều tương đối (`./…`)**: trong HTML, CSS, `assets.js`, manifest (`start_url: "./"`, `scope: "./"`), và lúc đăng ký service worker (`register("./sw.js")`).
- Lúc chạy không gọi tài nguyên nào bên ngoài: không Google Fonts, không CDN, không link ảnh Wikimedia.
- **Font**, subset `latin` + `latin-ext` + `vietnamese`:
  - Playfair Display 600, 700, Italic 600 (số khung "01").
  - Be Vietnam Pro 400, 500, 600, 700.
  - Barlow Condensed 600, 700.
  - Phải có `latin-ext` để pinyin có dấu thanh (ō, ǎ).
- Chữ Hán dùng font hệ thống (PingFang SC, Noto Sans SC, Microsoft YaHei). Mọi đoạn chữ Hán đặt `lang="zh-CN"`.
- **Route:** `#lich-trinh` (mặc định), `#dia-diem`, `#dd-<id>`, `#dd-<id>/chup-anh`, `#chup-anh`, `#chuan-bi`, `#tro-giup`.
- **Overlay** (story, thẻ tài xế, câu phóng to) mở bằng `history.pushState`. Nút Back của Android và cử chỉ vuốt lùi của iOS chỉ đóng overlay. Khi overlay đang mở, nút × gọi `history.back()`.
- Dung lượng dự kiến: code, dữ liệu và font khoảng 1 MB; ảnh khoảng 3 MB; clip khoảng 8 MB (5 clip). Tổng khoảng 12 MB.

## 3. Hướng thị giác (đã chốt bằng mockup)

Hướng **B "Tạp chí ảnh"**, có thêm dải ngày của hướng A. Mockup nằm trong `.superpowers/brainstorm/497-1794381439/content/`: `b-with-days-v4.html`, `place-and-driver.html`, `photo-section-c-v2.html`.

- **Màu** (độ tương phản đã kiểm tra trên nền kem `#F5F0E6`):
  - Chữ chính `#1E1A16`. Chữ phụ `#6E6253` (5.2:1).
  - Nhãn vàng ngói **`#7A5C22`** (5.5:1). Màu `#8B6B2E` của mockup chỉ đạt 4.36:1 nên không dùng cho chữ.
  - Vàng sáng `#F2C14E` chỉ dùng trên nền tối `#1E1A16` (10.3:1).
  - Mặt thẻ `#FFFDF8`, viền `#E3D9C6`.
  - Đỏ son `#B4301C` (6.2:1 trên nền trắng) chỉ dùng cho: ô ngày đang chọn, chấm "đang diễn ra", hành động chính, thẻ tài xế.
- **Chữ:**
  - Tiêu đề Playfair Display. Thân bài Be Vietnam Pro.
  - Số trên ô ngày và số giờ: Barlow Condensed, `font-variant-numeric: tabular-nums`.
  - Thân bài ≥ 14px. Nhãn phụ ≥ 12px.
- **Dải ngày giữ y nguyên kiểu A** như anh chọn:
  - Ô trắng, viền `#D3DAE2`, bo góc 12px.
  - Ngày đang chọn tô nền đỏ son, chữ trắng.
  - Viền nhạt (1.4:1) được chấp nhận, vì số ngày cỡ lớn và vị trí đã đủ để nhận ra ô là nút bấm. Thêm `aria-selected` và viền focus rõ.
- **Ảnh lớn** có lớp phủ gradient tối ở đáy để chữ trắng đọc được.
- **Thanh điều hướng dưới:** nền tối dạng viên thuốc, mục đang chọn màu `#F2C14E`. Chừa `env(safe-area-inset-bottom)` cho vùng thanh Home của iPhone.
- Vùng chạm ≥ 44×44px. Viền focus luôn hiện rõ. Tôn trọng `prefers-reduced-motion`.
- **Ô màu gợi ý trang phục** luôn có tên màu bên cạnh (ví dụ "Trắng · Kem · Be · Đen"), không chỉ hiện ô màu.

## 4. Điều hướng

Thanh dưới có 5 tab: **Lịch trình · Địa điểm · Chụp ảnh · Chuẩn bị · Trợ giúp**. Không có nút nổi.

Chân trang của mọi tab, giữ lại từ bản nháp:
- "Giờ mở cửa và giá vé kiểm tra ngày 11/11/2026. Xem lại trên kênh chính thức trước khi đi."
- Mục mở rộng **Nguồn ảnh**, liệt kê từ `credits`.

## 5. Màn hình

### 5.1 Lịch trình (`#lich-trinh`) — đợt 1
- **Ảnh lớn**, cao khoảng 280px, tràn ngang màn hình. Hai dòng trên cùng là "Landtour Mẫu" và "Bắc Kinh".
- **Nội dung ảnh lớn theo trạng thái** (giờ Bắc Kinh, mục 5.1a):

| Trạng thái | Ảnh | Nhãn | Tiêu đề | Dòng phụ |
|---|---|---|---|---|
| Trước 14/11 | `heroPlace` ngày 14 | "Còn n ngày nữa khởi hành" | "Bắc Kinh" | "08:30 thứ Bảy 14/11 · hạ cánh" |
| Đang xem hôm nay, mục hiện tại là tham quan | ảnh của điểm | "Đang diễn ra · còn X giờ Y phút" | tên điểm + chữ Hán | thứ/ngày · nhiệt độ · "Ngày n/5" |
| Đang xem hôm nay, mục hiện tại là ăn, cà phê hoặc di chuyển | `heroPlace` của ngày | "Đang diễn ra" | tên mục (ví dụ "Phúc Vinh Ký · Ăn trưa") | như trên |
| Đang xem hôm nay, đang ở giữa hai mục | ảnh của mục kế tiếp nếu là điểm tham quan, không thì `heroPlace` | "Tiếp theo · 11:15" | tên mục kế | như trên |
| Đang xem hôm nay, đã hết lịch | `heroPlace` | "Hết lịch hôm nay" | "Nghỉ ngơi, giữ ấm" | "Mai bắt đầu lúc 07:45" |
| Đang xem một ngày khác hôm nay | `heroPlace` của ngày đó | không có nhãn | tên điểm chính của ngày | thứ/ngày · nhiệt độ · "Ngày n/5" |
| Sau 18/11 20:30 | `heroPlace` ngày 18 | "Chuyến đi đã kết thúc" | "Cảm ơn anh chị đã đi cùng đoàn" | nút "Chuyến đi thế nào?" cuộn tới thẻ Sau tour |

- Dòng chữ nhỏ dưới tiêu đề luôn có: "Giờ Bắc Kinh · nhanh hơn Việt Nam 1 tiếng".
- **Dải 5 ngày** (14–18) đặt ngay dưới ảnh, dính lên đầu màn hình khi cuộn.
  - Mặc định chọn hôm nay. Trước chuyến chọn ngày 14, sau chuyến chọn ngày 18.
  - Bấm sang ngày khác thì ảnh lớn và danh sách đổi theo.
- **Danh sách các mục trong ngày** theo kiểu B:
  - Mỗi dòng: giờ (Playfair), **nhãn loại** ("Ăn trưa", "Cà phê", "Tham quan", "Di chuyển"), tên mục, một dòng mô tả, ảnh nhỏ 54px bên phải nếu có.
  - Ảnh món ăn có chú thích nhỏ "Ảnh minh họa món" như bản nháp.
  - Nhãn "Tiếp theo hôm nay" chỉ hiện khi đang xem hôm nay.
  - Mục đã qua hiện mờ. Mục có `flag` hiện thẻ nhỏ.
  - Mục `optional` hiện nhãn "Dự phòng" và **không bao giờ** được tính là "đang diễn ra" hay "tiếp theo".
  - Chạm vào mục có `place` thì mở trang địa điểm. Chạm vào quán có `addressZh` thì mở thẻ tài xế của quán.
- **Cuối ngày 18:** thẻ "Chuyến đi thế nào?". Đây là nội dung Sau tour của bản mẫu: chấm sao, góp ý, ba tour gợi ý, giữ thông báo "Đây là bản mẫu nên đánh giá chưa được gửi đi". Làm ở đợt 3.

### 5.1a Logic giờ
- `bjNow()` = `Date.now()` + 8 giờ, đọc các thành phần bằng UTC.
- Mục thiếu giờ kết thúc `e` coi như kéo dài 20 phút. Mục cuối "Bay về Việt Nam" 20:30 cũng vậy.
- Làm mới mỗi phút, và làm mới ngay khi `visibilitychange` báo trang hiện lại, vì iOS dừng bộ đếm khi app chạy nền.
- **Tham số kiểm thử** `?now=2026-11-17T09:40` được hiểu là **giờ Bắc Kinh**, chỉ dùng khi kiểm thử. Service worker khớp trang mà bỏ qua phần query string, nên tham số này vẫn chạy khi offline.

### 5.2 Địa điểm (`#dia-diem`, `#dd-<id>`) — đợt 2
- **Danh sách:** thẻ ảnh của 10 điểm, xếp theo ngày. Mỗi thẻ có ảnh 88px, tên, chữ Hán, khung giờ (tính từ `days`), dòng giới thiệu ngắn.
- **Chi tiết**, theo `place-and-driver.html`:
  - Ảnh lớn kèm tên, chữ Hán, dòng giới thiệu, nút quay lại.
  - Hai nút lớn: **Chỉ đường** (đỏ son) và **Thẻ tài xế**.
  - Ba ô thông tin nhanh: Trong lịch, Vé / người, Cách mua. Ghi chú "Nơi mua vé" nằm dưới ba ô này.
  - **Dải mục dính** trên đầu: Câu chuyện · Tham quan · Chụp ảnh · Mặc gì · Lưu ý. Bấm là cuộn tới mục đó. (Tô sáng mục đang đọc khi cuộn: dời sau chuyến.)
  - Các mục: Câu chuyện, Tham quan (danh sách đánh số), Chụp ảnh (5.3), Mặc gì (đoạn văn kèm ô màu có tên), Lưu ý.

### 5.3 Mục Chụp ảnh trong trang địa điểm (kiểu C, bản gọn) — đợt 2, video ở đợt 3
- **Mở đầu:**
  - Nhãn "Bộ ảnh <tên> · n khung", tiêu đề `photo.headline`.
  - Nhãn "Giờ đẹp" kèm `photo.bestTime`.
- **Ảnh mẫu khung 01** cỡ lớn, đánh số "01" in nghiêng, có nút phóng to (`aria-label="Xem toàn màn hình"`). Bên dưới là dải ảnh nhỏ của tất cả các khung.
- **Mỗi khung:**
  - Nhãn "Khung 0n", tiêu đề.
  - Ba cột chỉ dẫn: **Đứng ở đâu · Cầm máy · Dáng**.
  - Khối video (nếu có `clip`): ảnh chờ `clip-poster` có nút ▶, thời lượng lấy từ `clipDur`, và một dòng `clipTitle`. Bấm mới phát. Thẻ video có `playsinline muted controls preload="none"`.
  - Hai nút tiếng Việt:
    - **Xem thêm video mẫu:** mở trang tìm kiếm Douyin.
    - **Xem thêm ảnh mẫu:** mở trang tìm kiếm Xiaohongshu.
    - Khi bấm, trang **đồng thời chép `searchZh` vào bộ nhớ tạm** và hiện thông báo nhỏ "Đã chép từ khóa · dán vào ô tìm kiếm nếu app không tự tìm" trong 3 giây.
- Màn hình **không hiện** dòng chữ giải thích nào. Nguồn ảnh và clip nằm ở chân trang.
- **Story toàn màn hình** (chạm vào ảnh bất kỳ):
  - Ảnh mẫu chiếm cả màn hình, thanh tiến độ n vạch, "Tên · Khung i/n", nút ×.
  - Đáy ảnh có tiêu đề, ba dòng rút gọn (Đứng / Máy / Dáng), nút **▶ Xem video** (nếu có) và **Thêm ảnh mẫu**.
  - **Vùng chạm chia ba theo chiều ngang:** phần ba bên trái lùi khung, phần ba ở giữa ẩn/hiện lớp chữ, phần ba bên phải sang khung. Thêm hai nút ‹ › nhìn thấy được ở hai mép.
  - Không tự chuyển khung theo thời gian.
  - Đóng bằng ×, nút Back hoặc phím Esc. Phím ← → để chuyển khung. Khi mở, focus được giữ bên trong story; khi đóng, focus trả về ảnh đã chạm.
  - Story của một điểm chỉ duyệt các khung của điểm đó.

### 5.4 Tab Chụp ảnh (`#chup-anh`) — đợt 2
- Đầu trang: thẻ "Dáng chụp dễ làm", gồm thư viện 9 dáng vẽ SVG lấy từ bản nháp và đoạn mẹo mặc áo dày.
- Mục lục kiểu tạp chí, nhóm theo ngày. Mỗi điểm hiện ảnh bìa (khung 01), tên bộ ảnh, số khung.
  - Chạm ảnh bìa thì mở story của điểm đó.
  - Nút "Xem chỉ dẫn đầy đủ" chuyển tới `#dd-<id>/chup-anh`.
- Không có nội dung riêng: mọi thứ đọc từ `places[].photo.shots`.

### 5.5 Thẻ tài xế (overlay toàn màn hình) — đợt 1
- **Nền trắng, gồm:**
  - Câu 请带我去这里 kèm dịch tiếng Việt.
  - Khung viền đỏ son: tên chữ Hán cỡ khoảng 40px, pinyin, `addressZh` cỡ khoảng 19px, `addressVi`.
  - Dòng `dropOffZh` / `dropOffVi` (nếu có).
  - Hai nút: **Mở Amap** và **Về khách sạn** (ẩn nếu chưa có thông tin khách sạn).
- **Giữ màn hình sáng** bằng `navigator.wakeLock` nếu máy hỗ trợ. Xin lại quyền này khi `visibilitychange` báo trang hiện lại. Không hỗ trợ thì bỏ qua, không báo gì.
- **Mở được từ:** trang địa điểm, quán trong lịch (nếu có `addressZh`), Trợ giúp → Về khách sạn, Trợ giúp → Đại sứ quán.
- **Liên kết Amap**, mở được cả trong app và trên web:
  - Có tọa độ: `https://uri.amap.com/navigation?to=<lng>,<lat>,<tên chữ Hán>&mode=car&callnative=1`.
  - Không có tọa độ: `https://uri.amap.com/search?keyword=<tên chữ Hán>&city=北京&callnative=1`.
  - Tọa độ lưu theo hệ **GCJ-02**. Nếu nguồn là WGS-84 (OSM, Wikipedia) thì chuyển đổi bằng công thức chuẩn trong `tools/` lúc soạn dữ liệu.
- **Cổng xuống xe** của từng điểm phải kiểm tra lại, đặc biệt Cố Cung: khách vào ở Ngọ Môn (午门), xe thường thả ở phía Thiên An Môn hoặc Đông Hoa Môn rồi đi bộ. Ghi đúng điểm xe dừng được.

### 5.6 Chuẩn bị (`#chuan-bi`) — đợt 1
- Thời tiết 5 ngày (thanh nhiệt độ của bản nháp, đổi sang màu B).
- **Việc cần làm trước chuyến**, có ô đánh dấu, lưu bằng localStorage theo `id` cố định:
  1. Đã có vé Cố Cung 17/11 (theo số hộ chiếu).
  2. Đã có vé Universal 15/11.
  3. Vé Mộ Điền Dụ, Bảo tàng Tự nhiên, Bảo tàng Khoa học (đặt trước 1–3 ngày).
  4. Đã "Thêm vào Màn hình chính" và mở từ biểu tượng thấy "Đã lưu ✓".
  5. Tải bản đồ offline Bắc Kinh trong Amap.
  6. Cài app Xiaohongshu và Douyin (không bắt buộc).
- Trang phục chung, danh sách cần mang (giữ của bản nháp, chuyển sang `id` cố định), lưu ý về Bắc Kinh.

### 5.7 Trợ giúp (`#tro-giup`) — đợt 1
Thứ tự từ trên xuống:
1. **Về khách sạn:** mở thẻ tài xế của khách sạn.
2. **Gọi tài xế**, **Gọi hotline**, **Nhóm Zalo**. Số điện thoại lưu dạng quốc tế (`+86…`, `+84…`) để `tel:` gọi đúng khi đang ở Trung Quốc. Dòng nào chưa có dữ liệu thì ẩn.
3. **Khẩn cấp:** 110 · 120 · 119 (`tel:`).
4. **Câu giao tiếp hay dùng** (5 câu của bản nháp). Chạm vào câu nào thì phóng to toàn màn hình (overlay).
5. **Đại sứ quán Việt Nam:** địa chỉ, nút mở thẻ tài xế (dùng `contacts.embassy`).

Danh sách vé từng điểm của bản nháp bị bỏ, vì đã có trong từng trang địa điểm.

## 6. Dữ liệu (`data/tour.json`)

```jsonc
{
  "version": "2026-11-12a",
  "tour": { "id": "bac-kinh-2026-11", "title": "Bắc Kinh", "start": "2026-11-14", "end": "2026-11-18",
            "brand": "Landtour Mẫu", "checkedOn": "2026-11-11" },
  "contacts": {
    "hotel":   { "name": "", "zh": "", "addressZh": "", "addressVi": "", "lat": null, "lng": null, "phone": "" },
    "driver":  { "name": "", "phone": "", "plate": "" },
    "hotline": "", "zalo": "",
    "flightBack": { "airport": "PEK|PKX", "time": "" },
    "embassy": { "name": "Đại sứ quán Việt Nam", "zh": "越南大使馆", "addressZh": "朝阳区光华路32号", "addressVi": "Số 32 đường Quang Hoa, quận Triều Dương", "lat": null, "lng": null, "phone": "" }
  },
  "days": [ { "date": "2026-11-14", "lo": 1, "hi": 15, "wx": "Nắng", "heroPlace": "thien-dan",
              "stops": [ { "id": "d14-1", "s": "13:15", "e": "14:30", "k": "sight|meal|cafe|move", "kind": "Ăn trưa",
                           "title": "", "zh": "", "sub": "", "place": "thien-dan", "flag": "", "optional": false,
                           "thumb": "", "thumbNote": "Ảnh minh họa món",
                           "addressZh": "", "addressVi": "", "lat": null, "lng": null } ] } ],
  "places": [ { "id": "co-cung", "name": "Cố Cung", "zh": "故宫", "zhFull": "故宫博物院", "pinyin": "Gùgōng Bówùyuàn",
                "tag": "", "hero": "co-cung", "dur": "", "ticket": "", "req": "", "buy": "",
                "addressZh": "", "addressVi": "", "dropOffZh": "", "dropOffVi": "", "lat": null, "lng": null,
                "story": [], "route": [], "wear": "", "wearSwatches": [ { "hex": "#FFFFFF", "name": "Trắng" } ], "notes": [],
                "photo": { "headline": "", "bestTime": "",
                           "shots": [ { "id": "co-cung-1", "title": "", "img": "co-cung-shot1", "where": "", "camera": "", "pose": "",
                                        "clip": "co-cung-shot1", "clipDur": "0:15", "clipTitle": "", "searchZh": "故宫 太和殿 机位" } ] } } ],
  "prepTasks": [ { "id": "ve-co-cung", "text": "" } ],
  "checklist": [ { "id": "ho-chieu", "text": "" } ],
  "phrases":   [ { "zh": "", "vi": "" } ],
  "poses":     [ { "id": "dung", "label": "Đứng nghiêng 45°, tay đút túi", "fig": "dung" } ],
  "afterTour": { "tours": [ { "id": "", "title": "", "desc": "" } ] },
  "credits":   [ { "file": "", "title": "", "author": "", "license": "", "url": "", "personalUseOnly": true } ]
}
```

- **Quy ước tên trường:**
  - `zh` = tên chữ Hán ngắn. `zhFull` = tên đầy đủ in trên thẻ tài xế (không có thì dùng `zh`).
  - `img`, `clip`, `hero`, `thumb` = tên gốc, **không có đuôi tệp**. Code tự ghép `-160.webp`, `-900.webp`, `.mp4`, `-poster.webp`.
- `poses[].fig` trỏ tới nét vẽ SVG (FIG/PROP) chuyển nguyên từ bản nháp sang `app.js`. Dữ liệu chỉ giữ nhãn và tên dáng.
- **Không lưu những thứ tính được:** thứ trong tuần (tính từ `date`), khung giờ của địa điểm (tính từ các `stops` có `place` trùng).
- **Sân bay về** chỉ lưu ở `contacts.flightBack`. Mục cuối ngày 18 đọc từ đó.
- `personalUseOnly: true` đánh dấu ảnh và clip sưu tầm trên mạng, chỉ dùng cho đoàn. Khi làm bản demo thương mại thì lọc theo cờ này để thay.
- **Liên kết tìm kiếm** (mã hóa URL):
  - Douyin: `https://www.douyin.com/search/<searchZh>`.
  - Xiaohongshu: `https://www.xiaohongshu.com/search_result?keyword=<searchZh>`.

## 7. Lưu offline (service worker)

### 7.1 Hai kho lưu
- `app-<APP_VERSION>`: HTML, CSS, JS, `tour.json`, font, icon, manifest, cả `./` lẫn `./index.html`.
- `media-<MEDIA_VERSION>`: toàn bộ ảnh, poster và clip.
- `tools/gen-assets.py` sinh hai danh sách và tính VERSION theo nội dung tệp. Sửa lịch chỉ đổi `APP_VERSION`, nên chỉ tải lại vài trăm KB chứ không tải lại ảnh và video.

### 7.2 Lưu lần đầu và báo tiến độ
- `install`: tải **từng tệp một** (không dùng `cache.addAll`). Sau mỗi tệp, gửi `{done, total}` tới **mọi** trang qua `clients.matchAll({ includeUncontrolled: true })`, vì lần cài đầu tiên trang chưa nằm dưới quyền service worker.
- Tệp nào lỗi thì thử lại 2 lần. Nếu vẫn lỗi:
  - Lỗi ở kho `app`: `install` thất bại.
  - Lỗi ở kho `media`: ghi nhận danh sách tệp lỗi, `install` vẫn thành công.
- **Thanh trạng thái ở đầu trang** có 4 trạng thái:
  - "Đang lưu i/n…"
  - "Đã lưu ✓ dùng được khi không có mạng" (hiện 4 giây rồi ẩn)
  - "Lưu chưa xong · i/n tệp · **Thử lại**"
  - "Chưa lưu · cần mạng để lưu lần đầu"
- **Kiểm tra trạng thái "đã lưu"** bằng cách đối chiếu trực tiếp kho lưu với danh sách tệp mỗi lần mở trang, không tin cờ trong localStorage. Nếu iOS đã xóa kho lưu thì thanh báo hiện lại.

### 7.3 Phục vụ
- Trang (`navigate`): lấy từ kho lưu, **bỏ qua query string** (`ignoreSearch`). Không có trong kho thì tải qua mạng.
- `tour.json`: **network-first với giới hạn 3 giây**; quá giờ hoặc lỗi thì dùng bản trong kho. Sau tường lửa, request treo sẽ không làm trang đứng.
- Các tệp còn lại: cache-first.
- **Video:** nếu request có header `Range`, service worker cắt Blob trong kho và trả `206 Partial Content` kèm `Content-Range`, `Accept-Ranges`, `Content-Length`. Thiếu bước này thì iPhone không phát được video offline.

### 7.4 Cập nhật
- Đăng lại sau khi chạy `gen-assets.py`. Service worker mới cài các tệp đã đổi (`skipWaiting` + `clients.claim`), rồi xóa kho của phiên bản cũ.
- Trang so sánh `tour.json.version` và hiện "Đã cập nhật lịch" một lần.

### 7.5 Cài lên màn hình chính — thứ tự đúng cho iPhone
- Trên iOS, app ở màn hình chính có **bộ nhớ riêng, tách khỏi Safari**. Lưu trong Safari không làm biểu tượng có sẵn nội dung. Vì vậy hướng dẫn gửi nhóm (bằng chữ, hiện trong app và ghi trong tin nhắn Zalo) là:
  1. Mở link bằng Safari (iPhone) hoặc Chrome (Android), đang có wifi ở Việt Nam.
  2. iPhone: Chia sẻ → Thêm vào MH chính. Android: menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào MH chính.
  3. **Mở từ biểu tượng vừa tạo**, giữ wifi, chờ hiện "Đã lưu ✓".
  4. Bật chế độ máy bay, mở lại biểu tượng để thử.
- Trong app, khi đang mở bằng trình duyệt (không phải `display-mode: standalone`), đầu trang Chuẩn bị hiện khung hướng dẫn này.
- Manifest: `display: standalone`, `theme_color #1E1A16`, `background_color #F5F0E6`, `short_name "Bắc Kinh"`, `start_url "./"`, `scope "./"`.

## 8. Nội dung cần anh cung cấp

| Mục | Dùng ở | Nếu chưa có |
|---|---|---|
| Khách sạn: tên và địa chỉ tiếng Trung | Trợ giúp, nút "Về khách sạn" | Ẩn nút, hiện "Chưa có thông tin khách sạn" |
| Tài xế: tên, số điện thoại, biển số | Trợ giúp | Ẩn dòng |
| Hotline công ty | Trợ giúp | Ẩn dòng |
| Link nhóm Zalo | Trợ giúp | Ẩn dòng |
| Sân bay về (PEK/PKX), giờ bay | Lịch ngày 18 | "PEK hoặc PKX tùy vé" |
| 4 quán chưa chốt | Lịch, thẻ tài xế quán | Không có thẻ tài xế cho quán đó, giữ nhãn cờ |

## 9. Nội dung em tự chuẩn bị

- **Ảnh mẫu khoảng 25 khung:**
  - Tìm trên mạng, chỉ dùng cá nhân, ghi `credits`.
  - Khung nào không có ảnh người tạo dáng thì dùng ảnh cảnh của điểm.
  - Nén WebP 160px và 900px.
- **Tối đa khoảng 5 clip ở đợt 3:** ưu tiên Cố Cung, Mộ Điền Dụ, Di Hòa Viên, Thiên Đàn, Universal. Khung không có clip chỉ có hai nút xem thêm.
- **Cho 10 điểm và các quán đã chốt:** `addressZh`, `addressVi`, tọa độ GCJ-02, cổng xuống xe (`dropOff`), `zhFull`, `pinyin`.
- **`searchZh`** cho từng khung, `headline` và `bestTime` cho từng bộ ảnh, `wearSwatches` có tên màu.
- **Sửa dữ liệu của bản nháp:**
  - Bỏ bảng vé (trong đó có dòng "Thập Sát Hải" không có trong lịch).
  - Bảo tàng Tự nhiên: ngày 14 là chính, ngày 18 đánh dấu `optional`.
  - Bỏ trùng ảnh dimsum ngày 17 và ảnh ngõ Dương Mai Trúc.
  - Kiểm tra giá vé Universal, ngày nghỉ của Bảo tàng Khoa học, giờ mùa thấp điểm của Mộ Điền Dụ.

## 10. Kiểm thử

- **Logic giờ:** dùng `?now=` theo giờ Bắc Kinh, mỗi trạng thái trong bảng 5.1 ít nhất một lần:
  - `2026-11-12T10:00`
  - `2026-11-17T09:40`
  - `2026-11-17T11:20`
  - `2026-11-17T12:10`
  - `2026-11-17T21:00`
  - `2026-11-18T09:00` (mục dự phòng không được hiện "đang diễn ra")
  - `2026-11-18T21:00`
  - `2026-11-20T10:00`
- **Offline:** Playwright trên Chromium.
  1. Mở trang một lần, chờ "Đã lưu ✓".
  2. Chuyển sang offline rồi tải lại.
  3. Đi qua 5 tab, một trang địa điểm, story (cả ba vùng chạm và nút Back), thẻ tài xế, phát video (đợt 3).
  4. Chụp màn hình gửi anh.
- **Thử lỗi:** xóa một tệp media để kiểm tra trạng thái "Lưu chưa xong · Thử lại".
- **Thử cập nhật:** sửa `tour.json` và chạy lại `gen-assets.py`. Lần mở sau chỉ được tải lại kho `app`.
- **WebKit / iPhone:** Playwright WebKit có thể không hỗ trợ đầy đủ service worker, nên **iPhone thật là bài kiểm tra quyết định**.
- **Bố cục:** kiểm tra ở 360, 390 và 430 px. Không có cuộn ngang, chữ ≥ 12px, vùng chạm ≥ 44px.
- **Trên máy thật (anh làm, xong trước 13/11):** đi đúng 4 bước ở mục 7.5 trên một iPhone và một Android, rồi bật chế độ máy bay đi một vòng.

## 11. Rủi ro

- **iOS xóa bộ nhớ:** iOS có thể xóa bộ nhớ của web app không dùng tới sau khoảng 7 ngày. Chuyến đi chỉ cách 3 ngày, và thanh trạng thái sẽ báo nếu bị xóa. Trước khi bay, mở lại app một lần.
- **Liên kết Douyin và Xiaohongshu:** có thể dẫn tới trang bắt đăng nhập hoặc tải app. Đã có cách giảm thiểu: chép sẵn từ khóa vào bộ nhớ tạm.
- **Wake Lock** có thể không chạy trong app ở màn hình chính trên iOS đời cũ. Hậu quả chỉ là màn hình tự tắt, không ảnh hưởng gì khác.
- **Tọa độ và cổng xuống xe** do em soạn có thể sai lệch vài chục mét. Thẻ chữ Hán vẫn là thứ chính để tài xế đọc.
- **Hạn chót 12/11:** nếu trễ thì dừng ở đợt 1 hoặc đợt 2 và đăng luôn. Mỗi đợt đều dùng được độc lập.
