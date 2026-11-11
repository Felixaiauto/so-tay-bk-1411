import { overlayOpen } from './overlay.js';

const BAR_OK_MS = 4000;
const RETRY_STALL_MS = 20_000;
let hideTimer = null;
let stallTimer = null;

// Tiền tố tên kho theo thư mục của trang (trùng với phạm vi SW). Giữ đồng bộ với hằng P trong sw.js.
export const cachePrefix = () => 'bk' + new URL('./', location.href).pathname.replace(/[^a-z0-9]/gi, '-') + '-';

// Thanh cố định ở đầu màn hình: khi hiện, đẩy nội dung và dải ngày dính xuống dưới thanh (class has-bar + biến --bar-h).
let watching = false;
function sync(bar) {
  const vis = !bar.hidden;
  document.body.classList.toggle('has-bar', vis);
  if (!vis) document.body.style.setProperty('--bar-h', '0px');
  else if (bar.offsetHeight) document.body.style.setProperty('--bar-h', bar.offsetHeight + 'px'); // đang bị ẩn do mở thẻ thì offsetHeight = 0: giữ nguyên
  if (!watching && typeof ResizeObserver === 'function') {
    watching = true;
    new ResizeObserver(() => sync(bar)).observe(bar);
  }
}
function show(bar, html, cls = '') {
  clearTimeout(hideTimer);
  bar.className = `offline-bar ${cls}`;
  bar.innerHTML = html;
  bar.hidden = false;
  sync(bar);
}
function flash(bar, text, cls = 'ok') {
  show(bar, `<span>${text}</span>`, cls);
  hideTimer = setTimeout(() => { bar.hidden = true; sync(bar); }, BAR_OK_MS);
}
const isStandalone = () => !!(matchMedia?.('(display-mode: standalone)').matches || navigator.standalone);
const SAVED_TEXT = 'Đã lưu ✓ dùng được khi không có mạng';

export async function checkSaved(A = self.ASSETS) {
  if (!('caches' in self) || !A || !A.app.files.length) return { state: 'unsupported', done: 0, total: 0 };
  const total = A.app.files.length + A.media.files.length;
  const names = await caches.keys();
  const P = cachePrefix();
  const appName = P + 'app-' + A.app.version;
  const mediaName = P + 'media-' + A.media.version;
  const app = names.includes(appName) ? await caches.open(appName) : null;
  const media = names.includes(mediaName) ? await caches.open(mediaName) : null;
  let missing = 0;
  for (const f of A.app.files) if (!app || !(await app.match(f))) missing++;
  for (const f of A.media.files) if (!media || !(await media.match(f))) missing++;
  return { state: missing ? 'missing' : 'saved', done: total - missing, total };
}

export function initOffline(bar) {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  const showPartial = (done, total) => {
    show(bar, `<span>Lưu chưa xong · ${done}/${total} tệp</span><button type="button" data-retry>Thử lại</button>`, 'warn');
    bar.querySelector('[data-retry]').addEventListener('click', retry);
  };
  // Quá 20 giây không có tin tiến độ nào: hiện lại nút Thử lại thay vì treo ở "Đang lưu lại…".
  const armStall = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(async () => {
      stallTimer = null;
      const s = await checkSaved().catch(() => ({ done: 0, total: 0 }));
      showPartial(s.done, s.total);
    }, RETRY_STALL_MS);
  };
  const retry = async () => {
    show(bar, '<span>Đang lưu lại…</span>');
    armStall();
    try {
      const reg = await sw.getRegistration();
      if (reg && (reg.installing || reg.waiting)) await reg.update(); // đang cập nhật: để bản mới tự cài
      else if (reg && reg.active) reg.active.postMessage({ type: 'retry' });
      else await sw.register('./sw.js', { updateViaCache: 'none' }); // cài lần đầu hỏng sẽ xóa đăng ký: cài lại, tiếp tục từ phần đã lưu
    } catch { /* đồng hồ 20 giây sẽ hiện lại nút */ }
  };
  // Bản mới vừa nhận quyền điều khiển: nạp lại trang để dùng mã mới, nhưng không giật màn hình đang xem.
  // Chờ lần trang hiện lại (visibilitychange) hoặc chuyển tab (hashchange); đang mở thẻ thì chờ tiếp; chỉ nạp một lần.
  let hadController = !!sw.controller;
  let wantReload = false;
  let reloaded = false;
  const maybeReload = () => {
    if (!wantReload || reloaded || document.visibilityState !== 'visible' || overlayOpen()) return;
    reloaded = true;
    location.reload();
  };
  sw.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; } // lần cài đầu: bản đầu tiên nhận quyền, không cần nạp lại
    wantReload = true;
  });
  document.addEventListener('visibilitychange', maybeReload);
  addEventListener('hashchange', maybeReload);
  sw.addEventListener('message', e => {
    const m = e.data || {};
    if (m.type === 'progress') {
      if (stallTimer) armStall();
      show(bar, `<span>Đang lưu ${m.done}/${m.total}…</span><progress max="${m.total}" value="${m.done}"></progress>`);
    } else if (m.type === 'saved') {
      clearTimeout(stallTimer); stallTimer = null;
      flash(bar, SAVED_TEXT);
      navigator.storage?.persist?.().catch?.(() => {}); // xin giữ dữ liệu, kết quả không cần dùng
    } else if (m.type === 'partial') {
      clearTimeout(stallTimer); stallTimer = null;
      showPartial(m.done, m.total);
    }
  });
  sw.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  (async () => {
    const reg = await sw.getRegistration();
    if (!reg || !reg.active) {
      if (!navigator.onLine) show(bar, '<span>Chưa lưu · cần mạng để lưu lần đầu</span>', 'warn');
      return; // lần cài đầu: tin nhắn tiến độ sẽ tới
    }
    const s = await checkSaved();
    if (s.state === 'saved') { if (isStandalone()) flash(bar, SAVED_TEXT); return; } // mở lại app đã cài: báo một lần mỗi lần mở trang
    if (s.state !== 'missing') return;
    if (navigator.onLine) reg.active.postMessage({ type: 'retry' });
    else show(bar, `<span>Lưu chưa đủ · ${s.done}/${s.total} · cần mạng</span>`, 'warn');
  })();
}

export function notifyVersion(v, bar) {
  const K = 'bk-tour-version';
  let prev = null;
  try { prev = localStorage.getItem(K); localStorage.setItem(K, v); } catch { /* bỏ qua */ }
  if (prev && prev !== v) flash(bar, 'Đã cập nhật sổ tay');
}
