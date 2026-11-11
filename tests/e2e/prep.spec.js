import { test, expect } from '@playwright/test';

test('hướng dẫn lưu máy hiện khi mở bằng trình duyệt (Android)', async ({ page }) => {
  await page.goto('./?now=2026-11-12T10:00#chuan-bi');
  const g = page.locator('.install');
  await expect(g).toContainText('Lưu sổ tay vào máy trước khi bay');
  await expect(g.locator('li')).toHaveCount(4);
  await expect(g).toContainText('Chrome');
});

test('việc cần làm và đồ cần mang được lưu sau khi tải lại', async ({ page }) => {
  await page.goto('./?now=2026-11-12T10:00#chuan-bi');
  await expect(page.locator('input[data-ns="prep"]')).toHaveCount(4);
  await page.locator('input[data-id="luu-offline"]').check();
  await page.locator('input[data-id="ho-chieu"]').check();
  await page.reload();
  await expect(page.locator('input[data-id="luu-offline"]')).toBeChecked();
  await expect(page.locator('input[data-id="ho-chieu"]')).toBeChecked();
  await expect(page.locator('input[data-id="amap-offline"]')).not.toBeChecked();
});

test('thời tiết 5 ngày', async ({ page }) => {
  await page.goto('./?now=2026-11-12T10:00#chuan-bi');
  await expect(page.locator('.wxrow')).toHaveCount(5);
  await expect(page.locator('.wxrow').nth(3)).toContainText('−4 / 10°C');
});
