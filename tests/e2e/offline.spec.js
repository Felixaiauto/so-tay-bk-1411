import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const savedAndControlled = async page => {
  await expect(page.locator('#offline-bar')).toContainText('Đã lưu ✓', { timeout: 45_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
};

test('lưu lần đầu rồi chạy khi mất mạng', async ({ page, context }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await savedAndControlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  const w = await page.locator('.hero-img').evaluate(i => i.complete && i.naturalWidth);
  expect(w).toBeGreaterThan(0);
  await page.locator('#tabs a[data-v="tro-giup"]').click();
  await expect(page.locator('.sos a')).toHaveCount(3);
  await page.locator('[data-embassy]').click();
  await expect(page.getByRole('dialog')).toContainText('越南大使馆');
  await context.setOffline(false);
});

test('?now vẫn mở được khi mất mạng (bỏ qua query khi khớp trang)', async ({ page, context }) => {
  await page.goto('./');
  await savedAndControlled(page);
  await context.setOffline(true);
  await page.goto('./?now=2026-11-18T21:00');
  await expect(page.locator('.live')).toHaveText('Chuyến đi đã kết thúc');
  await context.setOffline(false);
});

test('activate chỉ dọn kho cũ của site này, không xóa kho của site khác', async ({ page }) => {
  await page.goto('./icons/icon-192.png'); // cùng origin, chưa nạp app nên chưa có SW
  await page.evaluate(async () => {
    for (const name of ['other-site-v1', 'bk-so-tay--app-cu', 'bk-site-khac--app-1']) {
      await (await caches.open(name)).put('/x', new Response('x'));
    }
  });
  await page.goto('./');
  await savedAndControlled(page);
  await page.reload();
  await expect(page.locator('.hero-title')).toBeVisible();
  const keys = await page.evaluate(() => caches.keys());
  expect(keys).toContain('other-site-v1');
  expect(keys).toContain('bk-site-khac--app-1');
  expect(keys).not.toContain('bk-so-tay--app-cu');
  expect(keys.filter(k => k.startsWith('bk-so-tay--')).sort()).toEqual([
    expect.stringMatching(/^bk-so-tay--app-/), expect.stringMatching(/^bk-so-tay--media-/),
  ]);
});

test('Thử lại lưu nốt phần còn thiếu sau khi lần đầu thiếu một tệp', async ({ page, context }) => {
  let block = true;
  await context.route('**/img/olympic-160.webp', r => (block ? r.fulfill({ status: 404, body: 'x' }) : r.continue()));
  await page.goto('./');
  const bar = page.locator('#offline-bar');
  await expect(bar).toContainText('Lưu chưa xong', { timeout: 45_000 });
  await expect(bar.locator('[data-retry]')).toBeVisible();
  block = false;
  await bar.locator('[data-retry]').click();
  await expect(bar).toContainText('Đã lưu ✓', { timeout: 30_000 });
});

test('Thử lại cài lại SW khi lần cài đầu hỏng vì thiếu tệp app', async ({ page, context }) => {
  let block = true;
  await context.route('**/fonts/barlow-condensed-latin-5048d7.woff2', r => (block ? r.fulfill({ status: 404, body: 'x' }) : r.continue()));
  await page.goto('./');
  const bar = page.locator('#offline-bar');
  await expect(bar).toContainText('Lưu chưa xong', { timeout: 45_000 });
  await expect(bar.locator('[data-retry]')).toBeVisible();
  block = false;
  await bar.locator('[data-retry]').click();
  await expect(bar).toContainText('Đã lưu ✓', { timeout: 30_000 });
});

test('thanh lưu không che thẻ tài xế và không đè dải ngày', async ({ page, context }) => {
  await context.route('**/img/olympic-160.webp', r => r.fulfill({ status: 404, body: 'x' }));
  await page.goto('./?now=2026-11-14T08:00');
  const bar = page.locator('#offline-bar');
  await expect(bar).toContainText('Lưu chưa xong', { timeout: 45_000 });
  // Thanh đang hiện: dải ngày dính nằm dưới thanh, không bị che.
  await page.evaluate(() => scrollTo(0, 700));
  const { barBottom, daysTop } = await page.evaluate(() => ({
    barBottom: document.getElementById('offline-bar').getBoundingClientRect().bottom,
    daysTop: document.querySelector('.days').getBoundingClientRect().top,
  }));
  expect(daysTop).toBeGreaterThanOrEqual(barBottom - 1);
  // Mở thẻ tài xế: thanh phải ẩn, nút × bấm được.
  await page.locator('[data-driver="d14-3"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(bar).toBeHidden();
  await page.locator('.ov-close').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(bar).toBeVisible(); // đóng thẻ xong thanh hiện lại
});

test('đã lưu sẵn + chạy như app cài: báo "Đã lưu ✓" một lần khi mở lại', async ({ page }) => {
  await page.addInitScript(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = q => (String(q).includes('display-mode: standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : mm(q));
  });
  await page.goto('./');
  await savedAndControlled(page);
  await page.reload();
  const bar = page.locator('#offline-bar');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText('Đã lưu ✓');
  await expect(bar).toBeHidden({ timeout: 8000 }); // tự tắt sau vài giây
});

test('đã lưu sẵn nhưng mở trong trình duyệt thường: không báo gì', async ({ page }) => {
  await page.goto('./');
  await savedAndControlled(page);
  await page.reload();
  await expect(page.locator('.hero-title')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('#offline-bar')).toBeHidden();
});

test('tour.json trả về trang lạ (portal wifi) thì dùng bản đã lưu, không ghi đè kho', async ({ page, context }) => {
  await page.goto('./');
  await savedAndControlled(page);
  await context.route('**/data/tour.json', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<html>wifi login</html>' }));
  await page.reload();
  await expect(page.locator('.hero-title')).toBeVisible();
  await expect(page.locator('.day')).toHaveCount(5);
  const v = await page.evaluate(async () => {
    const k = (await caches.keys()).find(n => /-app-/.test(n));
    return (await (await (await caches.open(k)).match('./data/tour.json')).json()).version;
  });
  expect(typeof v).toBe('string');
});

// Giả lập đăng bản mới bằng máy chủ riêng (trình duyệt tự kiểm tra sw.js không đi qua context.route):
// khi bật v2, sw.js có thêm một dòng (khác byte) và assets.js đổi media.version (kho media mới).
const MIME = { '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.html': 'text/html', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4' };
const NEW_MEDIA = 'zz-update-test';
async function startSite() {
  const root = path.resolve(import.meta.dirname, '../..');
  const state = { v2: false, fail: null };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/so-tay') p = '/';
    else if (p.startsWith('/so-tay/')) p = p.slice('/so-tay'.length);
    else { res.writeHead(404); return res.end(); }
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    const rel = '.' + p;
    if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile() || (state.v2 && state.fail === rel)) { res.writeHead(404); return res.end('x'); }
    let body = fs.readFileSync(f);
    if (state.v2 && p === '/sw.js') body = Buffer.concat([body, Buffer.from('\n// v2\n')]);
    if (state.v2 && p === '/assets.js') body = Buffer.from(body.toString('utf8').replace(/("media":\s*\{\s*"version":\s*")[^"]*/, `$1${NEW_MEDIA}`));
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { state, url: `http://127.0.0.1:${server.address().port}/so-tay/`, close: () => server.close() };
}
// Chạy reg.update() rồi trả trạng thái cuối của bản đang cài: 'redundant' (hủy) hoặc 'activated'.
const runUpdate = page => page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  const done = new Promise(res => reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w.addEventListener('statechange', () => { if (w.state === 'redundant' || w.state === 'activated') res(w.state); });
  }, { once: true }));
  await reg.update();
  return Promise.race([done, new Promise(res => setTimeout(() => res('timeout'), 50_000))]);
});
const cacheKeys = page => page.evaluate(() => caches.keys());

test('cập nhật nền thiếu một tệp media thì hủy cài, giữ nguyên bản cũ và vẫn chạy offline', async ({ page, context }) => {
  const site = await startSite();
  await page.goto(site.url);
  await savedAndControlled(page);
  const before = (await cacheKeys(page)).sort();
  expect(before.some(k => k.includes(NEW_MEDIA))).toBe(false);
  Object.assign(site.state, { v2: true, fail: './img/thien-dan-900.webp' });
  expect(await runUpdate(page)).toBe('redundant');
  // Kho cũ còn nguyên (activate không chạy nên không xóa gì), bản cũ vẫn là bản đang chạy.
  const after = await cacheKeys(page);
  for (const k of before) expect(after).toContain(k);
  expect(await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return [!!r.active, !r.waiting]; })).toEqual([true, true]);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero-title')).toBeVisible();
  const w = await page.locator('.hero-img').evaluate(i => i.complete && i.naturalWidth);
  expect(w).toBeGreaterThan(0);
  await context.setOffline(false);
  site.close();
});

test('cập nhật nền đủ tệp thì kích hoạt, dọn kho cũ; trang chỉ nạp lại khi hiện lại và không mở thẻ', async ({ page }) => {
  const site = await startSite();
  await page.goto(site.url);
  await savedAndControlled(page);
  const before = (await cacheKeys(page)).filter(k => /-media-/.test(k));
  site.state.v2 = true;
  await page.locator('#tabs a[data-v="tro-giup"]').click();
  await page.locator('[data-embassy]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => {
    window.__marker = 1; window.__cc = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { window.__cc = true; });
  });
  expect(await runUpdate(page)).toBe('activated');
  await page.waitForFunction(() => window.__cc === true, null, { timeout: 10_000 });
  const keys = await cacheKeys(page);
  expect(keys.some(k => k.includes(NEW_MEDIA))).toBe(true);
  for (const k of before) expect(keys).not.toContain(k);
  // Đang mở thẻ: dù trang hiện lại cũng chưa nạp lại.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__marker)).toBe(1);
  // Đóng thẻ rồi trang hiện lại: nạp lại đúng một lần.
  await page.locator('.ov-close').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await Promise.all([
    page.waitForNavigation(),
    page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))),
  ]);
  await expect(page.locator('#tabs a').first()).toBeVisible();
  expect(await page.evaluate(() => window.__marker)).toBeUndefined();
  site.close();
});

test('lần cài đầu không nạp lại trang khi bản mới nhận quyền điều khiển', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { window.__marker = 1; });
  await savedAndControlled(page);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__marker)).toBe(1);
});

test('đã lưu rồi mất mạng: clip mẫu vẫn phát được (SW trả 206 theo Range)', async ({ page, context }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung/chup-anh');
  await savedAndControlled(page);
  await context.setOffline(true);
  await page.reload();
  const box = page.locator('.vbox').first();
  await expect(box).toBeVisible();
  await box.locator('.vplay').click();
  const v = box.locator('video');
  await expect(v).toHaveAttribute('src', './video/co-cung-2.mp4');
  await page.waitForFunction(() => { const e = document.querySelector('.vbox video'); return e && !e.error && e.readyState >= 2; }, null, { timeout: 15_000 });
  expect(await v.evaluate(e => e.error)).toBeNull();
  expect(await v.evaluate(e => e.duration)).toBeGreaterThan(5);
  await context.setOffline(false);
});
