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
    assert.ok(c && c.personalUseOnly === true && c.url, `thiếu nguồn cho ${s.img}`);
  }
});
