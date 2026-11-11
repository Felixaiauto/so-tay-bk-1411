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
