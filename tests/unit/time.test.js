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
