// Kho ảnh giấy tờ riêng của từng máy (IndexedDB). Không gửi đi đâu, không nằm trong bộ nhớ đệm của service worker.
// Lưu ArrayBuffer + kiểu ảnh thay vì Blob cho chắc chạy trên Safari cũ.
const DB = 'so-tay-giay-to', STORE = 'docs';
let dbp = null;

const open = () => (dbp ??= new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => { dbp = null; rej(r.error); };
}));

async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

export const docsSupported = () => typeof indexedDB !== 'undefined';
export const listDocs = async () => (await tx('readonly', s => s.getAll())).sort((a, b) => a.added - b.added);
export const addDoc = (buf, type, name) => {
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return tx('readwrite', s => s.add({ id, buf, type, name, added: Date.now() }));
};
export const removeDoc = id => tx('readwrite', s => s.delete(id));
export const renameDoc = (id, name) => tx('readwrite', s => {
  const r = s.get(id);
  r.onsuccess = () => { if (r.result) s.put({ ...r.result, name }); };
});
// Xin trình duyệt giữ dữ liệu lâu dài (không tự xóa khi máy thiếu chỗ). Bỏ qua nếu không hỗ trợ.
export const keepData = () => navigator.storage?.persist?.().catch(() => false);
