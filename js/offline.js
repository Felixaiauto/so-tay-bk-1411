const BAR_OK_MS = 4000;
let hideTimer = null;

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
  const app = names.includes('app-' + A.app.version) ? await caches.open('app-' + A.app.version) : null;
  const media = names.includes('media-' + A.media.version) ? await caches.open('media-' + A.media.version) : null;
  let missing = 0;
  for (const f of A.app.files) if (!app || !(await app.match(f))) missing++;
  for (const f of A.media.files) if (!media || !(await media.match(f))) missing++;
  return { state: missing ? 'missing' : 'saved', done: total - missing, total };
}

export function initOffline(bar) {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  const retry = async () => {
    show(bar, '<span>Đang lưu lại…</span>');
    const reg = await sw.ready;
    reg.active?.postMessage({ type: 'retry' });
  };
  sw.addEventListener('message', e => {
    const m = e.data || {};
    if (m.type === 'progress') show(bar, `<span>Đang lưu ${m.done}/${m.total}…</span><progress max="${m.total}" value="${m.done}"></progress>`);
    else if (m.type === 'saved') flash(bar, 'Đã lưu ✓ dùng được khi không có mạng');
    else if (m.type === 'partial') {
      show(bar, `<span>Lưu chưa xong · ${m.done}/${m.total} tệp</span><button type="button" data-retry>Thử lại</button>`, 'warn');
      bar.querySelector('[data-retry]').addEventListener('click', retry);
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
