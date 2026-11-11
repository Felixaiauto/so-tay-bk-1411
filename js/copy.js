let timer = null;

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => { el.hidden = true; }, 3000);
}

export function copyText(s) {
  try { navigator.clipboard?.writeText(s)?.catch(() => {}); } catch { /* không có quyền: bỏ qua */ }
}

document.addEventListener('click', e => {
  const a = e.target.closest('[data-copy]');
  if (!a) return;
  copyText(a.dataset.copy);
  toast('Đã chép từ khóa · dán vào ô tìm kiếm nếu app không tự tìm');
});
