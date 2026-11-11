import { esc, zh, imgTag } from '../dom.js';
import { heroState, deg } from '../hero.js';
import { stopStatus, dowShort, dowOf, fmtDM, currentAndNext } from '../time.js';
import { openDriverCard } from '../components/driver-card.js';

const KIND = { sight: 'Tham quan', meal: 'Ăn', cafe: 'Cà phê', move: 'Di chuyển' };

export const defaultViewDate = (t, now) => (now.date < t.start ? t.start : now.date > t.end ? t.end : now.date);

function airportSub(data) {
  const f = data.contacts.flightBack || {};
  return f.airport ? `Sân bay ${f.airport}${f.time ? ' · bay ' + f.time : ''}` : 'Sân bay PEK hoặc PKX tùy vé';
}

function stopRow(data, s, ctx, status, isNow) {
  const p = s.place ? data.places.find(x => x.id === s.place) : null;
  const sub = s.airport ? airportSub(data) : s.sub;
  const flags = (s.optional ? '<span class="pill">Dự phòng</span>' : '') + (s.flag ? `<span class="pill">${esc(s.flag)}</span>` : '');
  const inner = `<span class="stop-t">${esc(s.s)}${s.e ? `<small>${esc(s.e)}</small>` : ''}</span>
    <span class="stop-b">
      <span class="stop-k">${esc(s.kind || KIND[s.k])}</span>
      <span class="stop-title">${esc(s.title)}</span>
      ${s.zh ? `<span class="stop-zh">${zh(s.zh)}</span>` : ''}
      ${sub ? `<span class="stop-sub">${esc(sub)}</span>` : ''}
      ${s.thumb && s.thumbNote ? `<span class="stop-note">${esc(s.thumbNote)}</span>` : ''}
      ${flags ? `<span class="stop-flags">${flags}</span>` : ''}
      ${s.addressZh ? '<span class="stop-drv">Thẻ tài xế ›</span>' : ''}
    </span>
    ${s.thumb ? imgTag(s.thumb, 160, '', 'stop-thumb') : '<span></span>'}`;
  let row;
  if (p && ctx.features.places) row = `<a class="stop-row" href="#dd-${esc(p.id)}">${inner}</a>`;
  else if (s.addressZh) row = `<button type="button" class="stop-row" data-driver="${esc(s.id)}">${inner}</button>`;
  else row = `<div class="stop-row">${inner}</div>`;
  const cls = `stop stop-${s.k}${status === 'past' ? ' is-past' : ''}${isNow ? ' is-now' : ''}`;
  return `<li class="${cls}"${isNow ? ' aria-current="true"' : ''}>${row}</li>`;
}

export function renderItinerary(ctx) {
  const { data, now, viewDate } = ctx;
  const h = heroState(data, now, viewDate);
  const day = data.days.find(d => d.date === viewDate);
  const isToday = viewDate === now.date;
  const { cur } = isToday ? currentAndNext(day, now.min) : { cur: null };

  let out = `<header class="hero">${imgTag(h.img, 900, '', 'hero-img', 'eager')}
    <div class="hero-top"><span>${esc(data.tour.brand)}</span><span>${esc(data.tour.title)}</span></div>
    <div class="hero-in">
      ${h.label ? `<span class="live${h.kind === 'now' ? ' is-now' : ''}">${esc(h.label)}</span>` : ''}
      <h1 class="hero-title">${esc(h.title)}</h1>
      ${h.zh ? `<p class="hero-zh">${zh(h.zh)}</p>` : ''}
      ${h.sub ? `<p class="hero-sub">${esc(h.sub)}</p>` : ''}
      ${h.cta && ctx.features.afterTour ? `<a class="hero-cta" href="#sau-tour" data-after>${esc(h.cta)}</a>` : ''}
      <p class="hero-tz">Giờ Bắc Kinh · nhanh hơn Việt Nam 1 tiếng</p>
    </div></header>`;

  out += `<nav class="days" aria-label="Chọn ngày"><div class="days-in">${data.days.map(d =>
    `<button type="button" class="day" data-date="${d.date}" aria-pressed="${d.date === viewDate}"><b>${+d.date.slice(8)}</b><span>${dowShort(d.date)}</span></button>`).join('')}</div></nav>`;

  const rows = day.stops.map(s => ({ s, st: stopStatus(s, viewDate, now) }));
  let list;
  if (isToday) {
    const past = rows.filter(r => r.st === 'past' && r.s !== cur);
    const rest = rows.filter(r => !past.includes(r));
    list = (past.length ? `<details class="past"${ctx.ui?.pastOpen ? ' open' : ''}><summary>Đã qua (${past.length})</summary><ol>${past.map(r => stopRow(data, r.s, ctx, 'past', false)).join('')}</ol></details>` : '')
      + (rest.length ? `<span class="eyebrow">Tiếp theo hôm nay</span><ol>${rest.map(r => stopRow(data, r.s, ctx, r.st, r.s === cur)).join('')}</ol>` : '');
  } else {
    list = `<span class="eyebrow">${esc(dowOf(day.date))} ${fmtDM(day.date)} · ${deg(day.lo)} đến ${day.hi}°C · ${esc(day.wx)}</span>
      <ol>${rows.map(r => stopRow(data, r.s, ctx, r.st, false)).join('')}</ol>`;
  }
  out += `<section class="stops" aria-label="Lịch trong ngày">${list}</section>`;
  return out;
}

export function mountItinerary(root, ctx) {
  for (const b of root.querySelectorAll('.day')) b.addEventListener('click', () => ctx.setViewDate(b.dataset.date));
  const past = root.querySelector('details.past');
  if (past && ctx.ui) past.addEventListener('toggle', () => { ctx.ui.pastOpen = past.open; });
  for (const b of root.querySelectorAll('[data-driver]')) {
    b.addEventListener('click', () => {
      const s = ctx.data.days.flatMap(d => d.stops).find(x => x.id === b.dataset.driver);
      openDriverCard({ zh: s.zh, zhFull: s.zh, name: s.title, addressZh: s.addressZh, addressVi: s.addressVi, lat: s.lat, lng: s.lng }, ctx.data.contacts.hotel);
    });
  }
}
