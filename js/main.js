import { bjNow } from './time.js';
import { parseHash } from './router.js';
import { overlayOpen } from './overlay.js';
import { esc } from './dom.js';
import { renderItinerary, mountItinerary, defaultViewDate } from './views/lich-trinh.js';
import { renderPrep, mountPrep } from './views/chuan-bi.js';
import { renderHelp, mountHelp } from './views/tro-giup.js';
import { initOffline, notifyVersion } from './offline.js';

export const FEATURES = { places: false, photos: false, afterTour: false };
export const enabledTabs = f => ['lich-trinh', ...(f.places && f.photos ? ['dia-diem', 'chup-anh'] : []), 'chuan-bi', 'tro-giup'];

const ICONS = {
  'lich-trinh': '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  'dia-diem': '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'chup-anh': '<path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  'chuan-bi': '<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M9 8V6a3 3 0 0 1 6 0v2M4 13h16"/>',
  'tro-giup': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5"/>',
};
const LABELS = { 'lich-trinh': 'Lịch trình', 'dia-diem': 'Địa điểm', 'chup-anh': 'Chụp ảnh', 'chuan-bi': 'Chuẩn bị', 'tro-giup': 'Trợ giúp' };
const VIEWS = {
  'lich-trinh': [renderItinerary, mountItinerary],
  'chuan-bi': [renderPrep, mountPrep],
  'tro-giup': [renderHelp, mountHelp],
};

const NOW_PARAM = new URLSearchParams(location.search).get('now');
const state = { data: null, viewDate: null };
const app = document.getElementById('app');

function render() {
  const now = bjNow(NOW_PARAM);
  const route = parseHash(location.hash);
  const view = enabledTabs(FEATURES).includes(route.view) && VIEWS[route.view] ? route.view : 'lich-trinh';
  state.viewDate ||= defaultViewDate(state.data.tour, now);
  const ctx = {
    data: state.data, now, viewDate: state.viewDate, route, features: FEATURES,
    setViewDate: d => { const y = scrollY; state.viewDate = d; render(); scrollTo(0, y); },
  };
  const [r, m] = VIEWS[view];
  app.innerHTML = r(ctx);
  m(app, ctx);
  for (const a of document.querySelectorAll('#tabs a')) {
    if (a.dataset.v === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

function renderChrome(data) {
  document.getElementById('tabs').innerHTML = enabledTabs(FEATURES).map(v =>
    `<li><a href="#${v}" data-v="${v}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[v]}</svg>${LABELS[v]}</a></li>`).join('');
  const [y, m, d] = data.tour.checkedOn.split('-');
  document.getElementById('checkedOn').textContent = `Giờ mở cửa và giá vé kiểm tra ngày ${+d}/${+m}/${y}. Xem lại trên kênh chính thức trước khi đi.`;
  document.getElementById('credList').innerHTML = data.credits.map(c =>
    `<li>${esc(c.title)} · ${esc(c.author || 'không rõ tác giả')} · ${esc(c.license)}${c.personalUseOnly ? ' · chỉ dùng cá nhân' : ''} · <a href="${esc(c.url)}" target="_blank" rel="noopener">${c.url.includes('wikimedia') ? 'Wikimedia Commons' : 'Nguồn'}</a></li>`).join('');
}

async function boot() {
  const bar = document.getElementById('offline-bar');
  initOffline(bar);
  try {
    state.data = await (await fetch('./data/tour.json')).json();
  } catch {
    app.innerHTML = '<p class="boot">Chưa tải được dữ liệu. Mở lại khi có mạng (wifi ở Việt Nam) để lưu sổ tay vào máy.</p>';
    return;
  }
  renderChrome(state.data);
  render();
  notifyVersion(state.data.version, bar);
  addEventListener('hashchange', () => { if (!overlayOpen()) { render(); scrollTo(0, 0); } });
  const tick = () => {
    if (overlayOpen() || parseHash(location.hash).view !== 'lich-trinh') return;
    const y = scrollY; render(); scrollTo(0, y);
  };
  setInterval(tick, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
}

boot();
