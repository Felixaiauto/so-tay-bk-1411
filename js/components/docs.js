import { esc } from '../dom.js';
import { openOverlay } from '../overlay.js';
import { docsSupported, listDocs, addDoc, removeDoc, renameDoc, keepData } from '../docs-store.js';

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const urls = new Map(); // id → object URL, giữ qua các lần vẽ lại để ảnh không nháy
const urlOf = d => {
  if (!urls.has(d.id)) urls.set(d.id, URL.createObjectURL(new Blob([d.buf], { type: d.type })));
  return urls.get(d.id);
};
const forget = id => { const u = urls.get(id); if (u) URL.revokeObjectURL(u); urls.delete(id); };

export function docsHtml() {
  // Trên iPhone, Safari và app đã thêm vào màn hình chính có kho riêng: thêm ở đâu thì chỉ thấy ở đó.
  const iosNote = isIOS() && !isStandalone()
    ? '<p class="docs-note docs-warn">Trên iPhone, hãy mở sổ tay từ biểu tượng ở màn hình chính rồi mới thêm giấy tờ. Ảnh thêm trong Safari sẽ không hiện trong app.</p>' : '';
  return `<section class="card docs" data-docs aria-labelledby="h-docs">
    <h2 class="eyebrow" id="h-docs">Giấy tờ của tôi</h2>
    <p class="docs-note">Ảnh chỉ lưu trong máy này, không gửi lên mạng. Dùng cho tờ khai nhập cảnh, vé máy bay, đặt phòng. Chạm ảnh để mở to khi cần quét mã.</p>
    ${iosNote}
    <div class="docs-grid" data-docs-list></div>
    <label class="btn btn-sec docs-add"><input type="file" accept="image/*" multiple class="sr" data-docs-input>Thêm ảnh giấy tờ</label>
    <p class="docs-msg" role="status" hidden></p>
  </section>`;
}

function openDocViewer(d, onChange) {
  let lock = null;
  const wake = async () => { try { lock = (await navigator.wakeLock?.request('screen')) || null; } catch { lock = null; } };
  const onVis = () => { if (document.visibilityState === 'visible') wake(); };
  const ov = openOverlay(`<div class="docv">
      <button type="button" class="ov-close" data-close aria-label="Đóng">×</button>
      <img src="${urlOf(d)}" alt="${esc(d.name)}">
      <div class="docv-bar">
        <label>Tên ảnh<input type="text" data-name maxlength="40" value="${esc(d.name)}" enterkeyhint="done"></label>
        <button type="button" class="btn btn-sec" data-del>Xóa</button>
      </div>
    </div>`, {
    label: d.name, cls: 'ov-doc',
    onClose: () => { document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); },
  });
  wake();
  document.addEventListener('visibilitychange', onVis);
  const name = ov.el.querySelector('[data-name]');
  name.addEventListener('change', async () => {
    const v = name.value.trim();
    if (v && v !== d.name) { d.name = v; await renameDoc(d.id, v); onChange(); }
  });
  ov.el.addEventListener('click', async e => {
    if (e.target.closest('[data-close]')) { ov.close(); return; }
    if (e.target.closest('[data-del]')) {
      if (!confirm(`Xóa "${d.name}" khỏi máy này?`)) return;
      await removeDoc(d.id);
      forget(d.id);
      ov.close(onChange);
    }
  });
}

export function mountDocs(root) {
  const sec = root.querySelector('[data-docs]');
  if (!sec) return;
  const list = sec.querySelector('[data-docs-list]'), input = sec.querySelector('[data-docs-input]'), msg = sec.querySelector('.docs-msg');
  const say = t => { msg.textContent = t; msg.hidden = !t; };
  if (!docsSupported()) {
    sec.querySelector('.docs-add').hidden = true;
    say('Máy này không lưu được ảnh trong sổ tay. Hãy lưu ảnh giấy tờ vào album ảnh.');
    return;
  }
  let docs = [];
  const refresh = async () => {
    try { docs = await listDocs(); } catch { say('Chưa mở được kho giấy tờ trên máy này.'); return; }
    list.innerHTML = docs.map(d => `<button type="button" class="doc" data-doc="${esc(d.id)}" aria-label="Mở ${esc(d.name)}"><img src="${urlOf(d)}" alt=""><span>${esc(d.name)}</span></button>`).join('');
  };
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-doc]');
    const d = b && docs.find(x => x.id === b.dataset.doc);
    if (d) { b.focus(); openDocViewer(d, () => { refresh(); say(''); }); }
  });
  input.addEventListener('change', async () => {
    const files = [...input.files].filter(f => f.type.startsWith('image/'));
    const skipped = input.files.length - files.length;
    input.value = '';
    let n = 0;
    for (const f of files) {
      try { await addDoc(await f.arrayBuffer(), f.type, `Giấy tờ ${docs.length + n + 1}`); n += 1; } catch { /* báo chung bên dưới */ }
    }
    if (n) keepData();
    await refresh();
    say([n ? `Đã lưu ${n} ảnh vào máy.` : 'Chưa lưu được ảnh nào.', skipped ? `Bỏ qua ${skipped} tệp không phải ảnh. Tệp PDF thì chụp màn hình rồi thêm ảnh.` : ''].filter(Boolean).join(' '));
  });
  refresh();
}
