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
