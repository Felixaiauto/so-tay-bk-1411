import { test, expect } from '@playwright/test';

test('không gọi tài nguyên ngoài', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const ext = [];
  page.on('request', r => { if (!r.url().startsWith(origin)) ext.push(r.url()); });
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('#tabs a')).toHaveCount(3);
  await page.waitForLoadState('networkidle');
  expect(ext).toEqual([]);
});

test('đợt 1: 3 tab, chuyển tab theo hash, đánh dấu tab hiện tại', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('#tabs a')).toHaveText(['Lịch trình', 'Chuẩn bị', 'Trợ giúp']);
  await page.locator('#tabs a[data-v="tro-giup"]').click();
  await expect(page).toHaveURL(/#tro-giup$/);
  await expect(page.locator('#tabs a[data-v="tro-giup"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('h1')).toHaveText('Trợ giúp');
});

test('hash địa điểm khi chưa bật đợt 2 → về Lịch trình', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung');
  await expect(page.locator('#tabs a[data-v="lich-trinh"]')).toHaveAttribute('aria-current', 'page');
});

test('chân trang có ngày kiểm tra giá vé và nguồn ảnh', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40');
  await expect(page.locator('.foot')).toContainText('kiểm tra ngày 11/11/2026');
  await page.locator('.foot summary').click();
  await expect(page.locator('#credList li').first()).toContainText('Wikimedia Commons');
});
