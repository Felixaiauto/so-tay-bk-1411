import { esc, imgTag } from '../dom.js';
import { placesOnDay } from '../places.js';
import { dowShort } from '../time.js';
import { openStory } from '../components/story.js';
import { shotImg } from '../components/photo-section.js';

const num = i => String(i + 1).padStart(2, '0');

export function renderPhotos(ctx) {
  const { data, viewDate } = ctx;
  let h = `<h1 class="view-h">Chụp ảnh</h1>
    <nav class="days" aria-label="Chọn ngày"><div class="days-in">${data.days.map(d =>
      `<button type="button" class="day" data-date="${d.date}" aria-pressed="${d.date === viewDate}"><b>${+d.date.slice(8)}</b><span>${dowShort(d.date)}</span></button>`).join('')}</div></nav>`;
  const groups = placesOnDay(data, viewDate);
  if (!groups.length) return h + '<p class="sub pnone">Ngày này không có điểm chụp ảnh.</p>';
  h += '<div class="pgroups">';
  for (const { place: p, s, optional } of groups) {
    h += `<section class="pgroup"><h2 class="eyebrow"><span class="pg-name">${esc(p.name)}</span><span class="eb-sub pg-time">${esc(s)}${optional ? ', dự phòng' : ''}</span></h2>
      <div class="pgrid">${p.photo.shots.map((shot, i) =>
        `<button type="button" class="ptile" data-place="${esc(p.id)}" data-i="${i}" aria-label="${esc(p.name)} · khung ${num(i)}: ${esc(shot.title)}${shot.clip ? ' · có video' : ''}">${imgTag(shotImg(p, shot), 900, '')}${shot.clip ? '<span class="ptile-clip" aria-hidden="true">▶</span>' : ''}<span class="ptile-n">${num(i)}</span></button>`).join('')}</div></section>`;
  }
  return h + '</div>';
}

export function mountPhotos(root, ctx) {
  for (const b of root.querySelectorAll('.day')) b.addEventListener('click', () => ctx.setViewDate(b.dataset.date));
  for (const b of root.querySelectorAll('.ptile')) {
    b.addEventListener('click', () => { b.focus(); openStory(ctx.data.places.find(p => p.id === b.dataset.place), +b.dataset.i); });
  }
}
