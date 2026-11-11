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
