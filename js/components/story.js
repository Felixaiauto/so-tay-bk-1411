import { esc, imgTag, clipVideoTag, playClip, stopClip } from '../dom.js';
import { openOverlay } from '../overlay.js';

export const shotImg = (place, shot) => shot.img || place.hero;
// Mọi ảnh mẫu của một khung: ảnh bìa trước, sau đó các ảnh thêm (shot.more).
export const shotImgs = (place, shot) => [shotImg(place, shot), ...(shot.more || [])];

// i = khung, j = ảnh trong khung. Thanh tiến độ: mỗi khung một vạch, vạch khung hiện tại đầy dần theo ảnh.
export function storyInner(place, i, j = 0) {
  const shots = place.photo.shots, s = shots[i], n = shots.length;
  const imgs = shotImgs(place, s), m = imgs.length;
  const first = i === 0 && j === 0, last = i === n - 1 && j === m - 1;
  return `<div class="st-img">${imgTag(imgs[j], 900, s.title, '', 'eager')}</div>
    <div class="st-prog" aria-hidden="true">${shots.map((_, k) => k < i || (k === i && m === 1) ? '<i class="on"></i>'
      : k === i ? `<i class="part" style="--p:${((j + 1) / m).toFixed(3)}"></i>` : '<i></i>').join('')}</div>
    <div class="st-hd"><span>${esc(place.name)} · Khung ${i + 1}/${n}${m > 1 ? ` · ảnh ${j + 1}/${m}` : ''}</span><button type="button" class="st-x" data-close aria-label="Đóng">×</button></div>
    <button type="button" class="st-nav st-prev" data-prev aria-label="Ảnh trước"${first ? ' disabled' : ''}>‹</button>
    <button type="button" class="st-nav st-next" data-next aria-label="Ảnh sau"${last ? ' disabled' : ''}>›</button>
    <div class="st-bt"><h2 class="st-h">${esc(s.title)}</h2>
      <dl class="st-dl"><dt>Đứng</dt><dd>${esc(s.where)}</dd><dt>Máy</dt><dd>${esc(s.camera)}</dd><dt>Dáng</dt><dd>${esc(s.pose)}</dd></dl>
      ${s.clip ? '<div class="st-pills"><button type="button" data-vid>▶ Xem video</button></div>' : ''}</div>`;
}

export function openStory(place, start = 0) {
  const shots = place.photo.shots, n = shots.length;
  const count = k => shotImgs(place, shots[k]).length;
  let i = Math.max(0, Math.min(start, n - 1)), j = 0;
  let root;
  const stopVid = () => stopClip(root);
  const closeVid = () => {
    stopVid();
    root.querySelector('.st-vid')?.remove();
    root.classList.remove('is-vid');
  };
  const openVid = () => {
    closeVid();
    const wrap = document.createElement('div');
    wrap.className = 'st-vid';
    wrap.innerHTML = `${clipVideoTag(place.photo.shots[i].clip, ' autoplay')}<button type="button" class="st-vx" data-vclose>Đóng video</button>`;
    root.querySelector('.st-img').after(wrap);
    root.classList.add('is-vid');
    playClip(wrap);
    wrap.querySelector('[data-vclose]').focus();
  };
  // Lùi/tới từng ảnh; hết ảnh của khung thì sang khung kề.
  const go = d => {
    let k = i, m = j + d;
    if (m >= count(k)) { k += 1; m = 0; } else if (m < 0) { k -= 1; m = k >= 0 ? count(k) - 1 : 0; }
    if (k < 0 || k >= n) return;
    stopVid();
    i = k; j = m;
    const clean = root.classList.contains('is-clean');
    root.classList.remove('is-vid');
    root.innerHTML = storyInner(place, i, j);
    root.classList.toggle('is-clean', clean);
    root.focus();
  };
  const onKey = e => {
    if (root.classList.contains('is-vid') || e.target?.tagName === 'VIDEO') return;
    if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
  };
  const ov = openOverlay(`<div class="story" data-story-root tabindex="-1">${storyInner(place, i)}</div>`, {
    label: `Ảnh mẫu ${place.name}`, cls: 'ov-story',
    onClose: () => { stopVid(); document.removeEventListener('keydown', onKey); },
  });
  root = ov.el.querySelector('[data-story-root]');
  document.addEventListener('keydown', onKey);
  root.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { ov.close(); return; }
    if (e.target.closest('[data-prev]')) { go(-1); return; }
    if (e.target.closest('[data-next]')) { go(1); return; }
    if (e.target.closest('[data-vid]')) { openVid(); return; }
    if (e.target.closest('[data-vclose]')) { closeVid(); root.querySelector('[data-vid]')?.focus(); return; }
    if (e.target.closest('a, button, .st-bt, .st-vid')) return;
    const r = root.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (x < 1 / 3) go(-1);
    else if (x > 2 / 3) go(1);
    else root.classList.toggle('is-clean');
  });
  return { ov, current: () => i };
}
