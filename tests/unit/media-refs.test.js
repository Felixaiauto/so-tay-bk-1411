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

test('ảnh khung chụp đã gán đều có 2 cỡ và có nguồn ghi "chỉ dùng cá nhân"', () => {
  const shots = data.places.flatMap(p => p.photo.shots).filter(s => s.img);
  assert.ok(shots.length >= 15, `mới có ${shots.length} khung có ảnh mẫu`);
  for (const s of shots) {
    assert.ok(exists(`img/${s.img}-160.webp`) && exists(`img/${s.img}-900.webp`), s.img);
    const c = data.credits.find(x => x.file === s.img);
    assert.ok(c && c.url && (c.personalUseOnly === true || /^(CC|Unsplash|Pexels)/.test(c.license)), `thiếu nguồn cho ${s.img}`);
  }
});

test('ảnh mẫu thêm của khung (shot.more) có đủ 2 cỡ, không trùng, có nguồn (dùng cá nhân hoặc giấy phép CC)', () => {
  for (const s of data.places.flatMap(p => p.photo.shots)) {
    if (s.more === undefined) continue;
    assert.ok(Array.isArray(s.more), `more của ${s.id} phải là mảng`);
    assert.equal(new Set([s.img, ...s.more]).size, s.more.length + 1, `ảnh trùng trong ${s.id}`);
    for (const f of s.more) {
      assert.ok(exists(`img/${f}-160.webp`) && exists(`img/${f}-900.webp`), f);
      const c = data.credits.find(x => x.file === f);
      assert.ok(c && (c.personalUseOnly === true || (c.url && /^(CC|Unsplash|Pexels)/.test(c.license))), `thiếu nguồn cho ${f}`);
    }
  }
});

test('đã bỏ video: không khung nào còn clip, không còn thư mục video', () => {
  assert.equal(data.places.flatMap(p => p.photo.shots).filter(s => 'clip' in s).length, 0);
  assert.ok(!exists('video'));
});
