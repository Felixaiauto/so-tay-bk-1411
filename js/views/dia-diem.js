import { esc, zh, imgTag } from '../dom.js';
import { whenText, placesByDay } from '../places.js';
import { fmtDM, dowOf } from '../time.js';
import { amapLink } from '../links.js';
import { openDriverCard } from '../components/driver-card.js';
import { photoSectionHtml, mountPhotoSection } from '../components/photo-section.js';

const SECS = [['cau-chuyen', 'Câu chuyện'], ['tham-quan', 'Tham quan'], ['chup-anh', 'Chụp ảnh'], ['mac-gi', 'Mặc gì'], ['luu-y', 'Lưu ý']];

export function renderPlaces(ctx) {
  const d = ctx.data;
  let h = '<h1 class="view-h">Địa điểm</h1><div class="stack">';
  for (const g of placesByDay(d)) {
    h += `<section><span class="eyebrow">${esc(dowOf(g.date))} ${fmtDM(g.date)}</span><ul class="plist">${g.places.map(p =>
      `<li><a class="pl" href="#dd-${esc(p.id)}">${imgTag(p.hero, 160, '', 'pl-img')}<span class="pl-b"><span class="pl-name">${esc(p.name)} ${zh(p.zh)}</span><span class="pl-when">${esc(whenText(d, p.id))}</span><span class="pl-tag">${esc(p.tag)}</span></span><span class="pl-go" aria-hidden="true">›</span></a></li>`).join('')}</ul></section>`;
  }
  return h + '</div>';
}

export function renderPlace(ctx) {
  const d = ctx.data;
  const p = d.places.find(x => x.id === ctx.route.id);
  if (!p) return renderPlaces(ctx);
  return `<header class="hero hero-place">${imgTag(p.hero, 900, p.heroAlt, 'hero-img', 'eager')}
    <a class="hero-back" href="#dia-diem" aria-label="Tất cả địa điểm">‹</a>
    <div class="hero-in"><h1 class="hero-title">${esc(p.name)}</h1><p class="hero-zh">${zh(p.zh)}</p><p class="hero-sub">${esc(p.tag)}</p></div></header>
  <div class="pacts">
    <a class="btn btn-pri" href="${esc(amapLink(p))}" target="_blank" rel="noopener">Chỉ đường<small>Mở Amap 高德</small></a>
    <button type="button" class="btn btn-sec" data-driver-place>Thẻ tài xế<small>Đưa màn hình</small></button>
  </div>
  <div class="pfacts">
    <div><span>Trong lịch</span><b>${esc(whenText(d, p.id))}</b></div>
    <div><span>Vé / người</span><b>${esc(p.ticket)}</b></div>
    <div><span>Cách mua</span><b>${esc(p.req)}</b></div>
  </div>
  ${p.buy ? `<p class="sub pbuy">Nơi mua vé: ${esc(p.buy)}</p>` : ''}
  <nav class="pchips" aria-label="Mục trong trang">${SECS.map(([k, l]) => `<button type="button" data-goto="${k}">${l}</button>`).join('')}</nav>
  <div class="psecs">
    <section data-sec="cau-chuyen" class="ptxt"><h2 class="sec-h">Câu chuyện</h2>${p.story.map(x => `<p>${esc(x)}</p>`).join('')}</section>
    <section data-sec="tham-quan" class="ptxt"><h2 class="sec-h">Tham quan</h2><ol class="route">${p.route.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
    ${photoSectionHtml(p)}
    <section data-sec="mac-gi" class="ptxt"><h2 class="sec-h">Mặc gì lên hình</h2>${p.wearSwatches.length
      ? `<ul class="swatches">${p.wearSwatches.map(s => `<li><i style="background:${esc(s.hex)}" aria-hidden="true"></i>${esc(s.name)}</li>`).join('')}</ul>` : ''}<p>${esc(p.wear)}</p></section>
    <section data-sec="luu-y" class="ptxt"><h2 class="sec-h">Lưu ý</h2>${p.notes.map(x => `<p class="note">${esc(x)}</p>`).join('')}</section>
  </div>`;
}

export function mountPlace(root, ctx) {
  const p = ctx.data.places.find(x => x.id === ctx.route.id);
  if (!p) return;
  root.querySelector('[data-driver-place]').addEventListener('click', () => openDriverCard(p, ctx.data.contacts.hotel));
  for (const b of root.querySelectorAll('[data-goto]')) {
    b.addEventListener('click', () => root.querySelector(`[data-sec="${b.dataset.goto}"]`)?.scrollIntoView({ block: 'start' }));
  }
  mountPhotoSection(root, p);
  if (ctx.route.section === 'chup-anh') requestAnimationFrame(() => root.querySelector('[data-sec="chup-anh"]')?.scrollIntoView({ block: 'start' }));
}
