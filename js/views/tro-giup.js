import { esc } from '../dom.js';
import { telHref } from '../links.js';
import { openOverlay } from '../overlay.js';
import { openDriverCard, hotelTarget, hasHotel } from '../components/driver-card.js';

// Xe của đoàn: biển số to để tìm xe ở bãi đỗ; gọi điện hoặc gọi WeChat (SIM khách thường không gọi thoại được).
export function carHtml(d) {
  if (!d || !(d.plate || d.phone)) return '';
  const who = [d.nameVi && `<b>${esc(d.nameVi)}</b>`, d.zh && `<span lang="zh-CN">${esc(d.zh)}</span>`].filter(Boolean).join(' ');
  const acts = [
    d.phone && `<a class="btn btn-pri" href="${telHref(d.phone)}">Gọi điện</a>`,
    '<button type="button" class="btn btn-sec" data-wechat>Gọi WeChat</button>',
  ].filter(Boolean).join('');
  return `<section class="card car" aria-labelledby="h-car"><h2 class="eyebrow" id="h-car">Xe của đoàn</h2>
    ${d.plate ? `<p class="plate"><span class="sr">Biển số </span>${esc(d.plate)}</p>` : ''}
    ${who ? `<p class="car-drv">Tài xế ${who}</p>` : ''}
    ${d.phone ? `<p class="car-ids">${esc(d.phone)}</p>` : ''}
    <div class="car-acts">${acts}</div>
    <p class="car-note" role="status" hidden></p></section>`;
}

export function renderHelp(ctx) {
  const c = ctx.data.contacts;
  let h = '<h1 class="view-h">Trợ giúp</h1><div class="stack">';
  h += hasHotel(c.hotel)
    ? `<button type="button" class="help-big" data-hotel><span class="eyebrow">Về khách sạn</span><b lang="zh-CN">${esc(c.hotel.zh)}</b><span class="sub">${esc(c.hotel.name)} · mở thẻ cho tài xế</span></button>`
    : '';
  h += carHtml(c.driver);
  const rows = [];
  if (hasHotel(c.hotel) && c.hotel.phone) rows.push(`<a class="help-row" href="${telHref(c.hotel.phone)}"><b>Gọi khách sạn</b><span>${esc(c.hotel.phone)}</span></a>`);
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
  // Khách và tài xế ở chung nhóm WeChat của đoàn: mở WeChat, gọi từ nhóm.
  root.querySelector('[data-wechat]')?.addEventListener('click', () => {
    const note = root.querySelector('.car-note');
    const g = c.wechatGroup ? `nhóm "${c.wechatGroup}"` : 'nhóm WeChat của đoàn';
    note.textContent = `Trong WeChat, mở ${g}, chạm ảnh đại diện của tài xế rồi chọn Gọi thoại.`;
    note.hidden = false;
    location.href = 'weixin://';
  });
  root.querySelector('[data-embassy]')?.addEventListener('click', () => openDriverCard({ ...c.embassy, zhFull: c.embassy.zh }, c.hotel));
  for (const b of root.querySelectorAll('[data-phrase]')) {
    b.addEventListener('click', () => {
      const p = ctx.data.phrases[+b.dataset.phrase];
      const ov = openOverlay(`<div class="phr-big"><button type="button" class="ov-close" data-close aria-label="Đóng">×</button><p lang="zh-CN">${esc(p.zh)}</p><span>${esc(p.vi)}</span></div>`, { label: 'Câu giao tiếp', cls: 'ov-phrase' });
      ov.el.addEventListener('click', e => { if (e.target.closest('[data-close]')) ov.close(); });
    });
  }
}
