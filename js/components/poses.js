import { esc } from '../dom.js';

const FIG = {
  dung: 'M20 17L20 46M20 23L12 40M20 23L28 40M20 46L15 77M20 46L25 77',
  buoc: 'M20 17L21 46M20 23L11 37M20 23L30 39M21 46L11 76M21 46L31 75',
  giotay: 'M20 17L20 46M20 23L32 7M20 23L12 40M20 46L15 77M20 46L25 77',
  dangtay: 'M20 17L20 46M20 24L3 13M20 24L37 13M20 46L12 77M20 46L28 77',
  ngoi: 'M18 17L18 44M18 24L29 38M18 44L33 46L33 70',
  tua: 'M17 17L22 46M18 24L33 31M22 46L17 77M22 46L31 76',
};
const PROP = { ngoi: 'M4 50L24 50L24 77', tua: 'M30 32L40 32M36 32L36 77' };

function fig(pose, cx, base, h) {
  if (pose === 'nhom') return fig('dung', cx - h * 0.36, base, h * 0.9) + fig('giotay', cx, base, h) + fig('dung', cx + h * 0.33, base, h * 0.62);
  const s = h / 80, hx = pose === 'ngoi' ? 18 : pose === 'tua' ? 17 : 20;
  return `<g transform="translate(${(cx - 20 * s).toFixed(1)},${(base - 78 * s).toFixed(1)}) scale(${s.toFixed(3)})" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + (PROP[pose] ? `<path d="${PROP[pose]}" stroke="var(--muted)" stroke-width="3"/>` : '')
    + `<path d="${FIG[pose]}" stroke="var(--ink)" stroke-width="5"/><circle cx="${hx}" cy="9" r="7" fill="var(--ink)"/></g>`;
}

export function poseLibraryHtml(poses) {
  return `<div class="card"><span class="eyebrow">Dáng chụp dễ làm</span><div class="poses">${poses.map(p =>
    `<div><svg viewBox="0 0 60 84" aria-hidden="true">${fig(p.fig, 30, 82, p.id === 'nhom' ? 62 : 78)}</svg><span>${esc(p.label)}</span></div>`).join('')}</div>
    <p class="sub">Mặc áo dày nên dáng dễ bị cứng. Đứng chân trước chân sau, xoay người 45° so với máy, cằm hơi hạ và nhìn ra xa thay vì nhìn thẳng ống kính. Khăn quàng, mũ hoặc cốc cà phê giúp tay có việc để làm.</p></div>`;
}
