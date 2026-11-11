import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHash } from '../../js/router.js';

test('rỗng → lich-trinh', () => assert.deepEqual(parseHash(''), { view: 'lich-trinh', id: null, section: null }));
test('tab', () => assert.equal(parseHash('#tro-giup').view, 'tro-giup'));
test('lạ → lich-trinh', () => assert.equal(parseHash('#abc').view, 'lich-trinh'));
test('địa điểm', () => assert.deepEqual(parseHash('#dd-co-cung'), { view: 'place', id: 'co-cung', section: null }));
test('mục chụp ảnh', () => assert.deepEqual(parseHash('#dd-co-cung/chup-anh'), { view: 'place', id: 'co-cung', section: 'chup-anh' }));
