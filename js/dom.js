const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => MAP[c]);
export const zh = s => (s ? `<span lang="zh-CN" class="han">${esc(s)}</span>` : '');
export const imgTag = (name, size, alt = '', cls = '', loading = 'lazy') =>
  `<img src="./img/${esc(name)}-${size}.webp" alt="${esc(alt)}" class="${cls}" loading="${loading}" decoding="async">`;

