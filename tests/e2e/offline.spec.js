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
