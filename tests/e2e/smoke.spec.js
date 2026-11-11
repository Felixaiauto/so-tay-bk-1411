import { test, expect } from '@playwright/test';

test('trang mở được dưới /so-tay/', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Sổ tay đoàn Bắc Kinh');
});
