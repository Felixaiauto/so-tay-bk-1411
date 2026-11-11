import { esc } from '../dom.js';
import { openOverlay } from '../overlay.js';
import { amapLink } from '../links.js';

export const hasHotel = h => !!(h && h.zh && h.addressZh);
export const hotelTarget = h => ({ zh: h.zh, zhFull: h.zh, name: h.name, addressZh: h.addressZh, addressVi: h.addressVi, lat: h.lat, lng: h.lng });

export function driverCardHtml(t, showHotel) {
  const py = [t.pinyin, t.name].filter(Boolean).join(' · ');
  return `<div class="drv">
    <button type="button" class="ov-close" data-close aria-label="Đóng">×</button>
    <p class="drv-hint">Đưa màn hình này cho tài xế</p>
    <p class="drv-say"><span lang="zh-CN">请带我去这里</span><small>Xin chở tôi tới đây</small></p>
    <div class="drv-dest">
      <p class="drv-name" lang="zh-CN">${esc(t.zhFull || t.zh)}</p>
      ${py ? `<p class="drv-py">${esc(py)}</p>` : ''}
      ${t.addressZh ? `<p class="drv-addr" lang="zh-CN">${esc(t.addressZh)}</p>` : ''}
      ${t.addressVi ? `<p class="drv-vi">${esc(t.addressVi)}</p>` : ''}
    </div>
    ${t.dropOffZh ? `<p class="drv-gate"><span lang="zh-CN">${esc(t.dropOffZh)}</span><small>${esc(t.dropOffVi)}</small></p>` : ''}
    <div class="drv-acts">
      <a class="btn btn-pri" href="${esc(amapLink(t))}" target="_blank" rel="noopener">Mở Amap</a>
      ${showHotel ? '<button type="button" class="btn btn-sec" data-hotel-card>Về khách sạn</button>' : ''}
    </div>
  </div>`;
}

export function openDriverCard(target, hotel) {
  let lock = null;
  const wake = async () => { try { lock = (await navigator.wakeLock?.request('screen')) || null; } catch { lock = null; } };
  const onVis = () => { if (document.visibilityState === 'visible') wake(); };
  const showHotel = hasHotel(hotel) && hotel.addressZh !== target.addressZh;
  const ov = openOverlay(driverCardHtml(target, showHotel), {
    label: 'Thẻ tài xế', cls: 'ov-driver',
    onClose: () => { document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); },
  });
  wake();
  document.addEventListener('visibilitychange', onVis);
  ov.el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) ov.close();
    else if (e.target.closest('[data-hotel-card]')) {
      ov.el.innerHTML = driverCardHtml(hotelTarget(hotel), false);
      ov.el.querySelector('[data-close]').focus();
    }
  });
  return ov;
}
