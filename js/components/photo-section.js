import { esc, imgTag } from '../dom.js';
import { openStory, shotImg } from './story.js';

export { shotImg, shotImgs } from './story.js';
// Nhãn "+N" khi khung có thêm ảnh mẫu ngoài ảnh bìa.
export const moreBadge = s => (s.more?.length ? `<b class="nmore" aria-hidden="true">+${s.more.length}</b>` : '');
const moreLabel = s => (s.more?.length ? `, ${s.more.length + 1} ảnh` : '');
const num = i => String(i + 1).padStart(2, '0');

export function photoSectionHtml(place) {
  const P = place.photo, shots = P.shots;
  let h = `<section class="psec" data-sec="chup-anh" aria-labelledby="h-chup-anh-${esc(place.id)}">
    <div class="psec-intro"><span class="eyebrow">${shots.length} khung hình ở ${esc(place.name)}</span>
      <h2 class="psec-h" id="h-chup-anh-${esc(place.id)}">${esc(P.headline)}</h2>
      ${P.bestTime ? `<p class="psec-tip"><b>Giờ đẹp</b><span>${esc(P.bestTime)}</span></p>` : ''}</div>
    <button type="button" class="psec-lead" data-story="0" aria-label="Xem toàn màn hình khung 01: ${esc(shots[0].title)}${moreLabel(shots[0])}">${imgTag(shotImg(place, shots[0]), 900, '', '', 'eager')}${moreBadge(shots[0])}<span class="psec-num">01</span><span class="psec-exp" aria-hidden="true">⤢</span></button>
    ${shots.length < 2 ? '' : `<div class="psec-strip">${shots.map((s, i) => `<button type="button" data-story="${i}" aria-label="Khung ${num(i)}: ${esc(s.title)}${moreLabel(s)}">${imgTag(shotImg(place, s), 160, '')}${moreBadge(s)}<span>${num(i)}</span></button>`).join('')}</div>`}`;
  shots.forEach((s, i) => {
    h += `<article class="pframe"><span class="pframe-k">Khung ${num(i)}</span><h3 class="pframe-h">${esc(s.title)}</h3>
      <div class="pcols"><div><b>Đứng ở đâu</b>${esc(s.where)}</div><div><b>Cầm máy</b>${esc(s.camera)}</div><div><b>Dáng</b>${esc(s.pose)}</div></div></article>`;
  });
  return h + '</section>';
}

export function mountPhotoSection(root, place) {
  for (const b of root.querySelectorAll('[data-story]')) b.addEventListener('click', () => { b.focus(); openStory(place, +b.dataset.story); });
}
