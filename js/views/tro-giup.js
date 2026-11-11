import { esc } from '../dom.js';
import { telHref } from '../links.js';
import { openOverlay } from '../overlay.js';
import { openDriverCard, hotelTarget, hasHotel } from '../components/driver-card.js';

export function renderHelp(ctx) {
  const c = ctx.data.contacts;
  let h = '<h1 class="view-h">Trợ giúp</h1><div class="stack">';
  h += hasHotel(c.hotel)
    ? `<button type="button" class="help-big" data-hotel><span class="eyebrow">Về khách sạn</span><b lang="zh-CN">${esc(c.hotel.zh)}</b><span class="sub">${esc(c.hotel.name)} · mở thẻ cho tài xế</span></button>`
    : '';
  const rows = [];
  if (c.driver?.phone) rows.push(`<a class="help-row" href="${telHref(c.driver.phone)}"><b>Gọi tài xế</b><span>${esc([c.driver.name, c.driver.plate, c.driver.phone].filter(Boolean).join(' · '))}</span></a>`);
  if (c.hotline) rows.push(`<a class="help-row" href="${telHref(c.hotline)}"><b>Gọi hotline</b><span>${esc(c.hotline)}</span></a>`);
  if (c.zalo) rows.push(`<a class="help-row" href="${esc(c.zalo)}" target="_blank" rel="noopener"><b>Nhóm Zalo của đoàn</b><span>Mở Zalo</span></a>`);
  if (rows.length) h += `<div class="card help-list">${rows.join('')}</div>`;
  h += `<section><span class="eyebrow">Khẩn cấp tại Trung Quốc</span><div class="sos">${[['110', 'Công an'], ['120', 'Cấp cứu'], ['119', 'Cứu hỏa']]
    .map(([n, l]) => `<a href="tel:${n}"><b>${n}</b><span>${l}</span></a>`).join('')}</div></section>`;
  h += `<section class="card"><span class="eyebrow">Câu hay dùng</span>${ctx.data.phrases
    .map((p, i) => `<button type="button" class="phr" data-phrase="${i}"><b lang="zh-CN">${esc(p.zh)}</b><span>${esc(p.vi)}</span><i class="chev" aria-hidden="true">›</i></button>`).join('')}</section>`;
  const e = c.embassy;
  h += `<button type="button" class="card help-emb" data-embassy><span class="eyebrow">${esc(e.name)}</span><span>${esc(e.addressVi)}</span><span class="zhline" lang="zh-CN">${esc(e.addressZh)} ${esc(e.zh)}</span><span class="link">Mở thẻ cho tài xế</span><i class="chev" aria-hidden="true">›</i></button>`;
  return h + '</div>';
}

export function mountHelp(root, ctx) {
  const c = ctx.data.contacts;
  root.querySelector('[data-hotel]')?.addEventListener('click', () => openDriverCard(hotelTarget(c.hotel), null));
  root.querySelector('[data-embassy]')?.addEventListener('click', () => openDriverCard({ ...c.embassy, zhFull: c.embassy.zh }, c.hotel));
  for (const b of root.querySelectorAll('[data-phrase]')) {
    b.addEventListener('click', () => {
      const p = ctx.data.phrases[+b.dataset.phrase];
      const ov = openOverlay(`<div class="phr-big"><button type="button" class="ov-close" data-close aria-label="Đóng">×</button><p lang="zh-CN">${esc(p.zh)}</p><span>${esc(p.vi)}</span></div>`, { label: 'Câu giao tiếp', cls: 'ov-phrase' });
      ov.el.addEventListener('click', e => { if (e.target.closest('[data-close]')) ov.close(); });
    });
  }
}
