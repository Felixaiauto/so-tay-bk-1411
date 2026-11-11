import { esc, imgTag } from '../dom.js';
import { placesByDay } from '../places.js';
import { fmtDM, dowOf } from '../time.js';
import { openStory } from '../components/story.js';
import { shotImg } from '../components/photo-section.js';

export function renderPhotos(ctx) {
  const d = ctx.data;
  let h = `<h1 class="view-h">Chụp ảnh</h1><div class="stack">`;
  for (const g of placesByDay(d)) {
    h += `<section class="pday"><span class="eyebrow">${esc(dowOf(g.date))} ${fmtDM(g.date)}</span>${g.places.map(p =>
      `<article class="pcover"><button type="button" class="pcover-img" data-open-story="${esc(p.id)}" aria-label="Xem bộ ảnh ${esc(p.name)} · ${p.photo.shots.length} khung">${imgTag(shotImg(p, p.photo.shots[0]), 900, '')}<span class="pcover-n">${p.photo.shots.length} khung</span></button>
        <div class="pcover-b"><h2 class="pcover-h">${esc(p.photo.headline)}</h2><p class="sub">${esc(p.name)}</p><a class="link" href="#dd-${esc(p.id)}/chup-anh">Xem chỉ dẫn đầy đủ</a></div></article>`).join('')}</section>`;
  }
  return h + '</div>';
}

export function mountPhotos(root, ctx) {
  for (const b of root.querySelectorAll('[data-open-story]')) {
    b.addEventListener('click', () => { b.focus(); openStory(ctx.data.places.find(p => p.id === b.dataset.openStory), 0); });
  }
}
