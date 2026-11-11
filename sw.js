// version: 9721350304-c1e853b2cf
/* Service worker sổ tay Bắc Kinh. Đường dẫn tương đối theo vị trí sw.js. */
importScripts('./assets.js', './sw-range.js');

const A = self.ASSETS;
// Tiền tố kho theo đường dẫn phạm vi SW, để nhiều site chung một origin github.io không xóa nhầm kho của nhau.
// Giữ phép biến đổi này đồng bộ với cachePrefix() trong js/offline.js (SW không import được module ES).
const P = 'bk' + new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi, '-') + '-';
const APP = P + 'app-' + A.app.version;
const MEDIA = P + 'media-' + A.media.version;
const TOTAL = A.app.files.length + A.media.files.length;

async function post(msg) {
  const cs = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of cs) c.postMessage(msg);
}

async function fill(name, files, counter) {
  const cache = await caches.open(name);
  const failed = [];
  for (const f of files) {
    let ok = !!(await cache.match(f));
    for (let i = 0; i < 3 && !ok; i++) {
      try {
        const r = await fetch(f, { cache: 'reload' });
        if (r.ok) { await cache.put(f, r); ok = true; }
        else await r.arrayBuffer(); // phải đọc hết thân phản hồi lỗi, nếu không Chromium treo các fetch kế tiếp trong SW
      } catch (e) { /* thử lại */ }
    }
    counter.done++;
    if (!ok) failed.push(f);
    post({ type: 'progress', done: counter.done, total: TOTAL });
  }
  return failed;
}

async function fillAll() {
  const counter = { done: 0 };
  const appFailed = await fill(APP, A.app.files, counter);
  const mediaFailed = await fill(MEDIA, A.media.files, counter);
  const failed = appFailed.concat(mediaFailed);
  await post(failed.length ? { type: 'partial', done: TOTAL - failed.length, total: TOTAL, failed } : { type: 'saved', total: TOTAL });
  if (appFailed.length) throw new Error('Thiếu tệp app: ' + appFailed.join(', '));
}

let filling = null; // chặn hai lượt lưu chạy chồng nhau (cài đặt + bấm Thử lại)
const fillAllOnce = () => (filling ||= fillAll().finally(() => { filling = null; }));

self.addEventListener('install', e => {
  e.waitUntil(fillAllOnce().then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith(P) && k !== APP && k !== MEDIA) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'retry') e.waitUntil(fillAllOnce().catch(() => {}));
});

async function networkFirst(req, ms) {
  const cache = await caches.open(APP);
  let timer;
  try {
    const r = await Promise.race([
      fetch(req, { cache: 'no-store' }),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), ms); }),
    ]);
    if (r.ok) { await cache.put('./data/tour.json', r.clone()); return r; }
    await r.arrayBuffer().catch(() => {}); // đọc bỏ thân phản hồi lỗi
  } catch (e) { /* mạng chậm/bị chặn: dùng bản đã lưu */ } finally { clearTimeout(timer); }
  return (await cache.match('./data/tour.json')) || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
}

// Chỉ tìm trong hai kho của site này (không tra cứu toàn cục).
async function fromCaches(req) {
  for (const name of [APP, MEDIA]) {
    const r = await (await caches.open(name)).match(req, { ignoreSearch: true });
    if (r) return r;
  }
  return undefined;
}

async function rangeFromCache(req) {
  const cached = await fromCaches(req.url);
  if (!cached) return fetch(req);
  const blob = await cached.blob();
  const r = parseRange(req.headers.get('range'), blob.size);
  if (!r) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + blob.size } });
  return new Response(blob.slice(r.start, r.end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': 'bytes ' + r.start + '-' + r.end + '/' + blob.size,
      'Content-Length': String(r.end - r.start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fromCaches('./index.html').then(r => r || fetch(req)));
    return;
  }
  if (url.pathname.endsWith('/data/tour.json')) { e.respondWith(networkFirst(req, 3000)); return; }
  if (req.headers.has('range')) { e.respondWith(rangeFromCache(req)); return; }
  e.respondWith(fromCaches(req).then(r => r || fetch(req)));
});
