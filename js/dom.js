const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => MAP[c]);
export const zh = s => (s ? `<span lang="zh-CN" class="han">${esc(s)}</span>` : '');
export const imgTag = (name, size, alt = '', cls = '', loading = 'lazy') =>
  `<img src="./img/${esc(name)}-${size}.webp" alt="${esc(alt)}" class="${cls}" loading="${loading}" decoding="async">`;

// Thẻ video clip mẫu: poster cùng tên, chỉ tải khi bấm phát (preload none).
export const clipVideoTag = (clip, extra = '') =>
  `<video src="./video/${esc(clip)}.mp4" poster="./img/${esc(clip)}-poster-900.webp" playsinline muted controls preload="none"${extra}></video>`;
export const playClip = el => { const v = el.querySelector('video'); if (v) v.play().catch(() => {}); return v; };
export const stopClip = el => { for (const v of el.querySelectorAll('video')) { v.pause(); v.removeAttribute('src'); v.load(); } };
