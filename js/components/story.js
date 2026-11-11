import { esc, imgTag } from '../dom.js';
import { openOverlay } from '../overlay.js';
import { xhsSearch } from '../links.js';

const shotImg = (place, shot) => shot.img || place.hero;

export function storyInner(place, i) {
  const shots = place.photo.shots, s = shots[i], n = shots.length;
  return `<div class="st-img">${imgTag(shotImg(place, s), 900, s.title, '', 'eager')}</div>
    <div class="st-prog" aria-hidden="true">${shots.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="st-hd"><span>${esc(place.name)} · Khung ${i + 1}/${n}</span><button type="button" class="st-x" data-close aria-label="Đóng">×</button></div>
    <button type="button" class="st-nav st-prev" data-prev aria-label="Khung trước"${i === 0 ? ' disabled' : ''}>‹</button>
    <button type="button" class="st-nav st-next" data-next aria-label="Khung sau"${i === n - 1 ? ' disabled' : ''}>›</button>
    <div class="st-bt"><h2 class="st-h">${esc(s.title)}</h2>
      <dl class="st-dl"><dt>Đứng</dt><dd>${esc(s.where)}</dd><dt>Máy</dt><dd>${esc(s.camera)}</dd><dt>Dáng</dt><dd>${esc(s.pose)}</dd></dl>
      <div class="st-pills"><a href="${esc(xhsSearch(s.searchZh))}" target="_blank" rel="noopener" data-copy="${esc(s.searchZh)}">Thêm ảnh mẫu</a></div></div>`;
}

export function openStory(place, start = 0) {
  const n = place.photo.shots.length;
  let i = Math.max(0, Math.min(start, n - 1));
  let root;
  const go = d => {
    const j = i + d;
    if (j < 0 || j >= n) return;
    i = j;
    const clean = root.classList.contains('is-clean');
    root.innerHTML = storyInner(place, i);
    root.classList.toggle('is-clean', clean);
    root.focus();
  };
  const onKey = e => { if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); };
  const ov = openOverlay(`<div class="story" data-story-root tabindex="-1">${storyInner(place, i)}</div>`, {
    label: `Ảnh mẫu ${place.name}`, cls: 'ov-story',
    onClose: () => document.removeEventListener('keydown', onKey),
  });
  root = ov.el.querySelector('[data-story-root]');
  document.addEventListener('keydown', onKey);
  root.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { ov.close(); return; }
    if (e.target.closest('[data-prev]')) { go(-1); return; }
    if (e.target.closest('[data-next]')) { go(1); return; }
    if (e.target.closest('a, button, .st-bt')) return;
    const r = root.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 1 / 3) go(-1);
    else if (x > 2 / 3) go(1);
    else root.classList.toggle('is-clean');
  });
  return { ov, current: () => i };
}
