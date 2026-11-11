import { test, expect } from '@playwright/test';

const go = page => page.goto('./?now=2026-11-17T09:40#tro-giup');

test('khẩn cấp gọi được', async ({ page }) => {
  await go(page);
  await expect(page.locator('.sos a')).toHaveCount(3);
  await expect(page.locator('.sos a').first()).toHaveAttribute('href', 'tel:110');
});

test('chưa có khách sạn: không hiện khối "Về khách sạn", không có nút', async ({ page }) => {
  await go(page);
  await expect(page.locator('h1')).toHaveText('Trợ giúp');
  await expect(page.locator('#app')).not.toContainText('Về khách sạn');
  await expect(page.locator('[data-hotel]')).toHaveCount(0);
});

test('thẻ tài xế đại sứ quán: mở, Amap, nút Back đóng mà không rời trang', async ({ page }) => {
  await go(page);
  await page.locator('[data-embassy]').click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('越南大使馆');
  await expect(dlg).toContainText('北京市朝阳区光华路32号');
  await expect(dlg.locator('a.btn-pri')).toHaveAttribute('href', /^https:\/\/uri\.amap\.com\/search\?keyword=/);
  await expect(page.locator('.tabbar')).toBeHidden();
  await page.goBack();
  await expect(dlg).toHaveCount(0);
  await expect(page).toHaveURL(/#tro-giup$/);
  await expect(page.locator('.tabbar')).toBeVisible();
});

test('câu giao tiếp phóng to, Esc và × đều đóng', async ({ page }) => {
  await go(page);
  await page.locator('[data-phrase="0"]').click();
  await expect(page.getByRole('dialog')).toContainText('洗手间在哪里?');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-phrase="1"]').click();
  await page.getByRole('dialog').locator('[data-close]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#tro-giup$/);
});
