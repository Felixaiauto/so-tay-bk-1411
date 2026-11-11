import { test, expect } from '@playwright/test';

test('không gọi tài nguyên ngoài', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const ext = [];
  page.on('request', r => { if (!r.url().startsWith(origin)) ext.push(r.url()); });
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('#tabs a')).toHaveCount(5);
  await page.waitForLoadState('networkidle');
  expect(ext).toEqual([]);
});

test('5 tab, chuyển tab theo hash, đánh dấu tab hiện tại', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('#tabs a')).toHaveText(['Lịch trình', 'Địa điểm', 'Chụp ảnh', 'Chuẩn bị', 'Trợ giúp']);
  await page.locator('#tabs a[data-v="tro-giup"]').click();
  await expect(page).toHaveURL(/#tro-giup$/);
  await expect(page.locator('#tabs a[data-v="tro-giup"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('h1')).toHaveText('Trợ giúp');
});

test('hash địa điểm → trang địa điểm, tab Địa điểm được đánh dấu', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung');
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  await expect(page.locator('#tabs a[data-v="dia-diem"]')).toHaveAttribute('aria-current', 'page');
});

test('chân trang có ngày kiểm tra giá vé và nguồn ảnh', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('.foot')).toContainText('kiểm tra ngày 11/11/2026');
  await page.locator('.foot summary').click();
  await expect(page.locator('#credList li').first()).toContainText('Wikimedia Commons');
});

test('nguồn ảnh: không lặp "dùng cá nhân" khi giấy phép đã ghi sẵn', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#credList li').first()).toBeAttached(); // danh sách điền sau khi tải dữ liệu
  const items = await page.locator('#credList li').allTextContents();
  for (const t of items) expect(t.match(/dùng cá nhân/g)?.length ?? 0).toBeLessThanOrEqual(1);
  expect(items.some(t => /không rõ \(dùng cá nhân\) · (?!chỉ dùng)/.test(t))).toBe(true);
});

test('dòng kiểm tra giá vé chỉ ở Lịch trình và Địa điểm; nguồn ảnh ở mọi màn', async ({ page }) => {
  for (const [h, shown] of [['', true], ['#dia-diem', true], ['#dd-co-cung', true], ['#chup-anh', false], ['#chuan-bi', false], ['#tro-giup', false]]) {
    await page.goto(`./?now=2026-11-17T09:40${h}`);
    await expect(page.locator('#tabs a')).toHaveCount(5);
    if (shown) await expect(page.locator('#checkedOn')).toBeVisible(); else await expect(page.locator('#checkedOn')).toBeHidden();
    await expect(page.locator('.foot summary')).toBeVisible();
  }
});
