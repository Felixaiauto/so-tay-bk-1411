import { esc } from '../dom.js';
import { tempRange } from '../hero.js';
import { fmtDM } from '../time.js';
import { get, set } from '../store.js';

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

export function installGuideHtml() {
  const steps = isIOS()
    ? ['Mở link này bằng Safari, đang có wifi.', 'Bấm nút Chia sẻ (ô vuông có mũi tên lên) → "Thêm vào MH chính".',
       'Mở sổ tay từ biểu tượng vừa tạo, giữ wifi, chờ hiện "Đã lưu ✓".', 'Bật chế độ máy bay, mở lại biểu tượng để thử.']
    : ['Mở link này bằng Chrome, đang có wifi.', 'Bấm menu ⋮ → "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".',
       'Mở sổ tay từ biểu tượng vừa tạo, giữ wifi, chờ hiện "Đã lưu ✓".', 'Bật chế độ máy bay, mở lại biểu tượng để thử.'];
  return `<div class="card install"><span class="eyebrow">Lưu sổ tay vào máy trước khi bay</span><ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>`;
}

function tbar(lo, hi, min, max) {
  const p = v => ((v - min) / (max - min)) * 100;
  return `<span class="trange" role="img" aria-label="Từ ${lo} đến ${hi} độ C"><i style="left:${p(lo).toFixed(1)}%;width:${(p(hi) - p(lo)).toFixed(1)}%"></i><em style="left:${p(0).toFixed(1)}%"></em></span>`;
}
const checks = (ns, items) => items.map(it =>
  `<label class="chk"><input type="checkbox" data-ns="${ns}" data-id="${esc(it.id)}"${get(ns, it.id) ? ' checked' : ''}><span>${esc(it.text)}</span></label>`).join('');

export function renderPrep(ctx) {
  const d = ctx.data;
  const temps = d.days.flatMap(x => [x.lo, x.hi]);
  const min = Math.min(...temps, 0) - 1, max = Math.max(...temps) + 1;
  let h = '<h1 class="view-h">Chuẩn bị</h1><div class="stack">';
  if (!isStandalone()) h += installGuideHtml();
  h += `<div class="card"><span class="eyebrow">Việc cần làm trước chuyến</span><div class="checks">${checks('prep', d.prepTasks)}</div></div>`;
  h += `<div class="card"><span class="eyebrow">Thời tiết 5 ngày</span>${d.days.map(x =>
    `<div class="wxrow"><span class="dd">${fmtDM(x.date)}</span>${tbar(x.lo, x.hi, min, max)}<span class="tt">${tempRange(x.lo, x.hi)}</span><span class="wxnote">${esc(x.wx)}</span></div>`).join('')}
    <p class="sub">Mặt trời lặn khoảng 17:00.</p></div>`;
  h += `<div class="card"><span class="eyebrow">Trang phục chung</span>${d.wearGeneral.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
  h += `<div class="card"><span class="eyebrow">Danh sách cần mang</span><div class="checks">${checks('pack', d.checklist)}</div></div>`;
  h += `<div class="card"><span class="eyebrow">Lưu ý về Bắc Kinh</span><dl class="kv">${d.prepNotes.map(n => `<div><dt>${esc(n.k)}</dt><dd>${esc(n.v)}</dd></div>`).join('')}</dl></div>`;
  return h + '</div>';
}

export function mountPrep(root) {
  for (const i of root.querySelectorAll('input[data-ns]')) i.addEventListener('change', () => set(i.dataset.ns, i.dataset.id, i.checked));
}
