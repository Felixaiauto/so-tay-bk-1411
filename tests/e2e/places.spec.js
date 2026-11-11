import { test, expect } from '@playwright/test';

const NOW = './?now=2026-11-17T09:40';

test('danh sách: 10 địa điểm nhóm theo ngày, có khung giờ', async ({ page }) => {
  await page.goto(`${NOW}#dia-diem`);
  await expect(page.locator('.pl')).toHaveCount(10);
  await expect(page.locator('.pl', { hasText: 'Bảo tàng Lịch sử Tự nhiên' }).locator('.pl-when'))
    .toHaveText('14/11 · 15:30–17:00 (dự phòng 18/11 · 08:30–10:00)');
});

test('chi tiết Cố Cung: ảnh, 2 nút, 3 ô, các mục', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  await expect(page.locator('.pacts a.btn-pri')).toHaveAttribute('href', /^https:\/\/uri\.amap\.com\//);
  await expect(page.locator('.pfacts')).toContainText('17/11 · 08:30–11:15');
  await expect(page.locator('.pfacts')).toContainText('40 tệ');
  for (const k of ['cau-chuyen', 'tham-quan', 'mac-gi', 'luu-y']) await expect(page.locator(`[data-sec="${k}"]`)).toHaveCount(1);
  await expect(page.locator('.swatches li')).toHaveText(['Trắng', 'Kem', 'Be', 'Đen']);
});

test('dải mục dính: bấm "Lưu ý" cuộn tới mục đó', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await page.locator('.pchips button[data-goto="luu-y"]').click();
  await expect(page.locator('[data-sec="luu-y"]')).toBeInViewport();
});

test('thẻ tài xế của địa điểm có tên đầy đủ và chỗ xuống xe', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await page.locator('[data-driver-place]').click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('故宫博物院');
  await expect(dlg).toContainText('Gùgōng Bówùyuàn');
  await expect(dlg.locator('.drv-gate')).toBeVisible();
  await page.goBack();
  await expect(dlg).toHaveCount(0);
  await expect(page).toHaveURL(/#dd-co-cung$/);
});

test('lịch trình dẫn sang địa điểm; nút quay lại về danh sách', async ({ page }) => {
  await page.goto(NOW);
  await page.locator('a.stop-row[href="#dd-co-cung"]').click();
  await expect(page.locator('.hero-title')).toHaveText('Cố Cung');
  await page.locator('.hero-back').click();
  await expect(page.locator('.pl')).toHaveCount(10);
});

test('địa điểm không tồn tại → danh sách', async ({ page }) => {
  await page.goto(`${NOW}#dd-khong-co`);
  await expect(page.locator('.pl')).toHaveCount(10);
});

test('dải mục dính nằm dưới thanh lưu offline, không bị che', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await page.evaluate(() => scrollTo(0, 900));
  // Đặt --bar-h rồi đo trong cùng một lượt chạy, để offline.js không chen vào giữa chừng.
  const top = await page.evaluate(() => {
    document.body.classList.add('has-bar');
    document.body.style.setProperty('--bar-h', '48px');
    return document.querySelector('.pchips').getBoundingClientRect().top;
  });
  expect(top).toBeGreaterThanOrEqual(48);
  const secTop = await page.evaluate(() => {
    document.body.style.setProperty('--bar-h', '48px');
    document.querySelector('[data-sec="luu-y"]').scrollIntoView({ block: 'start', behavior: 'instant' });
    return document.querySelector('[data-sec="luu-y"] .sec-h').getBoundingClientRect().top;
  });
  expect(secTop).toBeGreaterThanOrEqual(48 + 44);
});

test('chép từ khóa hiện thông báo trạng thái', async ({ page }) => {
  await page.goto(`${NOW}#dd-co-cung`);
  await page.evaluate(() => { const b = document.createElement('button'); b.dataset.copy = 'x'; document.body.appendChild(b); b.click(); });
  await expect(page.locator('#toast[role="status"]')).toContainText('Đã chép từ khóa');
});
