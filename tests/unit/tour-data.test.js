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
