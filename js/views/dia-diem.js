import { esc, zh, imgTag } from '../dom.js';
import { placeWindows, placesByDay } from '../places.js';
import { fmtDM, dowOf } from '../time.js';
import { amapLink } from '../links.js';
import { openDriverCard } from '../components/driver-card.js';
import { photoSectionHtml, mountPhotoSection } from '../components/photo-section.js';

const SECS = [['cau-chuyen', 'Câu chuyện'], ['tham-quan', 'Tham quan'], ['chup-anh', 'Chụp ảnh'], ['mac-gi', 'Mặc gì'], ['luu-y', 'Lưu ý']];

const span = w => `${w.s}–${w.e}`;

// Dòng giờ của một điểm trong nhóm ngày `date`: giờ của ngày đó, các lần khác (ghé lại, dự phòng) ở dòng phụ.
function listWhen(data, id, date) {
  const ws = placeWindows(data, id);
  const here = ws.find(w => w.date === date);
  const other = ws.filter(w => w !== here).map(w => `${w.optional ? 'Dự phòng' : 'Ghé lại'} ${fmtDM(w.date)}, ${span(w)}`);
  return { time: here ? span(here) : '', other: other.join('; ') };
}

export function renderPlaces(ctx) {
  const d = ctx.data;
  let h = '<h1 class="view-h">Địa điểm</h1><div class="stack places">';
  for (const g of placesByDay(d)) {
    h += `<section><h2 class="eyebrow">${esc(dowOf(g.date))} ${fmtDM(g.date)}</h2><ul class="plist">${g.places.map(p => {
      const w = listWhen(d, p.id, g.date);
      return `<li><a class="pl" href="#dd-${esc(p.id)}">${imgTag(p.hero, 160, '', 'pl-img')}<span class="pl-b"><span class="pl-name">${esc(p.name)}</span>${p.zh ? `<span class="pl-zh" lang="zh-CN">${esc(p.zh)}</span>` : ''}<span class="pl-when">${esc(w.time)}</span>${w.other ? `<span class="pl-alt">${esc(w.other)}</span>` : ''}<span class="pl-tag">${esc(p.tag)}</span></span><span class="pl-go" aria-hidden="true">›</span></a></li>`;
    }).join('')}</ul></section>`;
  }
  return h + '</div>';
}

// Ô "Trong lịch": mỗi lần ghé là ngày rồi giờ trên hai dòng; ngày dự phòng ghi nhỏ.
const factWhen = (data, id) => placeWindows(data, id).map(w => w.optional
  ? `<small>Dự phòng ${fmtDM(w.date)}, <span class="nw">${span(w)}</span></small>`
  : `<b>${fmtDM(w.date)}</b><b class="nw">${span(w)}</b>`).join('');

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
    <div class="pf-when"><span>Trong lịch</span>${factWhen(d, p.id)}</div>
    <div><span>Vé / người</span><b>${esc(p.ticket)}</b></div>
    <div class="pf-req"><span>Cách mua</span><b>${esc(p.req)}</b></div>
  </div>
  <nav class="pchips" aria-label="Mục trong trang">${SECS.map(([k, l]) => `<button type="button" data-goto="${k}">${l}</button>`).join('')}</nav>
  <div class="psecs">
    <section data-sec="cau-chuyen" class="ptxt"><h2 class="sec-h">Câu chuyện</h2>${p.story.map(x => `<p>${esc(x)}</p>`).join('')}</section>
    <section data-sec="tham-quan" class="ptxt"><h2 class="sec-h">Tham quan</h2><ol class="route">${p.route.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
    ${photoSectionHtml(p)}
    <section data-sec="mac-gi" class="pwear"><h2 class="sec-h">Mặc gì lên hình</h2>${p.wearSwatches.length
      ? `<ul class="swatches">${p.wearSwatches.map(s => `<li><i style="background:${esc(s.hex)}" aria-hidden="true"></i>${esc(s.name)}</li>`).join('')}</ul>` : ''}<p>${esc(p.wear)}</p></section>
    <section data-sec="luu-y" class="ptxt"><h2 class="sec-h">Lưu ý</h2>${[...(p.buy ? [`Mua vé: ${p.buy}.`] : []), ...p.notes].map(x => `<p class="note">${esc(x)}</p>`).join('')}</section>
  </div>`;
}

let spy = null;

// Dải mục: nút của mục đang thấy trên màn được đánh dấu (aria-current), bấm nút cũng đặt luôn.
function mountChips(root) {
  spy?.disconnect();
  const nav = root.querySelector('.pchips');
  const btns = [...nav.querySelectorAll('[data-goto]')];
  const secs = btns.map(b => root.querySelector(`[data-sec="${b.dataset.goto}"]`)).filter(Boolean);
  let lockUntil = 0;
  const mark = k => {
    for (const b of btns) {
      if (b.dataset.goto === k) {
        b.setAttribute('aria-current', 'true');
        const l = b.offsetLeft - 16, r = b.offsetLeft + b.offsetWidth + 16;
        if (l < nav.scrollLeft || r > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = l;
      } else b.removeAttribute('aria-current');
    }
  };
  for (const b of btns) {
    b.addEventListener('click', () => {
      lockUntil = performance.now() + 700;
      mark(b.dataset.goto);
      root.querySelector(`[data-sec="${b.dataset.goto}"]`)?.scrollIntoView({ block: 'start' });
    });
  }
  if (!('IntersectionObserver' in window)) return;
  const seen = new Set();
  spy = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target);
    if (performance.now() < lockUntil) return;
    const top = secs.find(x => seen.has(x));
    if (top) mark(top.dataset.sec);
    else if (secs[0] && secs[0].getBoundingClientRect().top > innerHeight * 0.45) mark('');
  }, { rootMargin: '-80px 0px -55% 0px' });
  for (const x of secs) spy.observe(x);
}

export function mountPlace(root, ctx) {
  const p = ctx.data.places.find(x => x.id === ctx.route.id);
  if (!p) return;
  root.querySelector('[data-driver-place]').addEventListener('click', () => openDriverCard(p, ctx.data.contacts.hotel));
  mountChips(root);
  mountPhotoSection(root, p);
  if (ctx.route.section === 'chup-anh') requestAnimationFrame(() => root.querySelector('[data-sec="chup-anh"]')?.scrollIntoView({ block: 'start' }));
}
