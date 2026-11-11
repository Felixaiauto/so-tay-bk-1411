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
