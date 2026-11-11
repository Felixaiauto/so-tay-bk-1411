import { test, expect } from '@playwright/test';

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
