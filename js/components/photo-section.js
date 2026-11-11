import { esc, imgTag, clipVideoTag, playClip } from '../dom.js';
import { douyinSearch, xhsSearch } from '../links.js';
import { openStory } from './story.js';

export const shotImg = (place, shot) => shot.img || place.hero;
const num = i => String(i + 1).padStart(2, '0');

export function moreLinks(shot) {
  const kw = esc(shot.searchZh);
  return `<a class="btn btn-pri" href="${esc(douyinSearch(shot.searchZh))}" target="_blank" rel="noopener" data-copy="${kw}">Xem thêm video mẫu</a>
    <a class="btn btn-sec" href="${esc(xhsSearch(shot.searchZh))}" target="_blank" rel="noopener" data-copy="${kw}">Xem thêm ảnh mẫu</a>`;
}

export function clipBoxHtml(s) {
  if (!s.clip) return '';
  return `<div class="vbox" data-clip="${esc(s.clip)}"><div class="vmedia"><button type="button" class="vplay" data-play aria-label="Phát clip: ${esc(s.clipTitle)}">${imgTag(s.clip + '-poster', 900, '')}<span class="vplay-ico" aria-hidden="true">▶</span>${s.clipDur ? `<span class="vdur">${esc(s.clipDur)}</span>` : ''}</button></div>
      <p class="vcap">${esc(s.clipTitle)}</p></div>`;
}

export function photoSectionHtml(place) {
  const P = place.photo, shots = P.shots;
  let h = `<section class="psec" data-sec="chup-anh" aria-labelledby="h-chup-anh-${esc(place.id)}">
    <div class="psec-intro"><span class="eyebrow">Bộ ảnh ${esc(place.name)} · ${shots.length} khung</span>
      <h2 class="psec-h" id="h-chup-anh-${esc(place.id)}">${esc(P.headline)}</h2>
      ${P.bestTime ? `<p class="psec-tip"><b>Giờ đẹp</b><span>${esc(P.bestTime)}</span></p>` : ''}</div>
    <button type="button" class="psec-lead" data-story="0" aria-label="Xem toàn màn hình khung 01: ${esc(shots[0].title)}">${imgTag(shotImg(place, shots[0]), 900, '')}<span class="psec-num">01</span><span class="psec-exp" aria-hidden="true">⤢</span></button>
    <div class="psec-strip">${shots.map((s, i) => `<button type="button" data-story="${i}" aria-label="Khung ${num(i)}: ${esc(s.title)}">${imgTag(shotImg(place, s), 160, '')}<span>${num(i)}</span></button>`).join('')}</div>`;
  shots.forEach((s, i) => {
    h += `<article class="pframe"><span class="pframe-k">Khung ${num(i)}</span><h3 class="pframe-h">${esc(s.title)}</h3>
      <div class="pcols"><div><b>Đứng ở đâu</b>${esc(s.where)}</div><div><b>Cầm máy</b>${esc(s.camera)}</div><div><b>Dáng</b>${esc(s.pose)}</div></div>
      ${clipBoxHtml(s)}
      <div class="pmore">${moreLinks(s)}</div></article>`;
  });
  return h + '</section>';
}

export function mountPhotoSection(root, place) {
  for (const b of root.querySelectorAll('[data-story]')) b.addEventListener('click', () => { b.focus(); openStory(place, +b.dataset.story); });
  for (const b of root.querySelectorAll('.vbox [data-play]')) {
    b.addEventListener('click', () => {
      const media = b.closest('.vmedia');
      media.innerHTML = clipVideoTag(b.closest('.vbox').dataset.clip);
      playClip(media)?.focus();
    });
  }
}
