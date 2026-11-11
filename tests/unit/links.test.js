import test from 'node:test';
import assert from 'node:assert/strict';
import { amapLink, telHref } from '../../js/links.js';

const enc = encodeURIComponent;
test('Amap không có tọa độ: tìm theo tên đầy đủ ở Bắc Kinh', () => {
  assert.equal(amapLink({ zh: '故宫', zhFull: '故宫博物院', lat: null, lng: null }),
    `https://uri.amap.com/search?keyword=${enc('故宫博物院')}&city=${enc('北京')}&callnative=1`);
});
test('Amap có tọa độ: chỉ đường bằng xe', () => {
  assert.equal(amapLink({ zh: '故宫', lat: 39.913, lng: 116.397 }),
    `https://uri.amap.com/navigation?to=116.397,39.913,${enc('故宫')}&mode=car&callnative=1`);
});
test('telHref', () => {
  assert.equal(telHref('+86 138-0000 0000'), 'tel:+8613800000000');
  assert.equal(telHref(''), '');
});
