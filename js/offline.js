const BAR_OK_MS = 4000;
const RETRY_STALL_MS = 20_000;
let hideTimer = null;
let stallTimer = null;

// Tiền tố tên kho theo thư mục của trang (trùng với phạm vi SW). Giữ đồng bộ với hằng P trong sw.js.
export const cachePrefix = () => 'bk' + new URL('./', location.href).pathname.replace(/[^a-z0-9]/gi, '-') + '-';

function show(bar, html, cls = '') {
  clearTimeout(hideTimer);
  bar.className = `offline-bar ${cls}`;
  bar.innerHTML = html;
  bar.hidden = false;
}
function flash(bar, text, cls = 'ok') {
  show(bar, `<span>${text}</span>`, cls);
  hideTimer = setTimeout(() => { bar.hidden = true; }, BAR_OK_MS);
}

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
  sw.addEventListener('message', e => {
    const m = e.data || {};
    if (m.type === 'progress') {
      if (stallTimer) armStall();
      show(bar, `<span>Đang lưu ${m.done}/${m.total}…</span><progress max="${m.total}" value="${m.done}"></progress>`);
    } else if (m.type === 'saved') {
      clearTimeout(stallTimer); stallTimer = null;
      flash(bar, 'Đã lưu ✓ dùng được khi không có mạng');
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
    if (s.state !== 'missing') return;
    if (navigator.onLine) reg.active.postMessage({ type: 'retry' });
    else show(bar, `<span>Lưu chưa đủ · ${s.done}/${s.total} · cần mạng</span>`, 'warn');
  })();
}

export function notifyVersion(v, bar) {
  const K = 'bk-tour-version';
  let prev = null;
  try { prev = localStorage.getItem(K); localStorage.setItem(K, v); } catch { /* bỏ qua */ }
  if (prev && prev !== v) flash(bar, 'Đã cập nhật lịch');
}
