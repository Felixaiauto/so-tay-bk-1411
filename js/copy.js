let timer = null;

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { // vùng thông báo tạo một lần, rỗng, rồi mới điền chữ để trình đọc màn hình đọc ra
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.hidden = true;
    document.body.appendChild(el);
  }
  clearTimeout(timer);
  el.hidden = false;
  el.textContent = '';
  timer = setTimeout(() => {
    el.textContent = msg;
    timer = setTimeout(() => { el.hidden = true; el.textContent = ''; }, 3000);
  }, 0);
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
