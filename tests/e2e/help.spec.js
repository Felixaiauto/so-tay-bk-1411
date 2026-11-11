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

test('chưa có dữ liệu xe: không hiện khối "Xe của đoàn"', async ({ page }) => {
  await go(page);
  await expect(page.locator('.car')).toHaveCount(0);
});

// Dữ liệu giả cho nhánh đã điền liên hệ (dữ liệu thật anh chưa gửi).
async function withContacts(context, patch) {
  const fs = await import('node:fs');
  const data = JSON.parse(fs.readFileSync('data/tour.json', 'utf8'));
  Object.assign(data.contacts, patch);
  await context.route('**/data/tour.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) }));
}

test('xe của đoàn: biển số to, tên tài xế, gọi điện và gọi WeChat qua nhóm của đoàn', async ({ page, context }) => {
  await withContacts(context, { driver: { zh: '王强', nameVi: 'Vương Cường', phone: '+86 138 0000 1234', plate: '京A·12345' }, wechatGroup: 'Đoàn Bắc Kinh 14/11' });
  await go(page);
  const car = page.locator('.car');
  await expect(car.locator('.plate')).toHaveText('Biển số 京A·12345');
  expect(await car.locator('.plate').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(40);
  await expect(car).toContainText('Vương Cường');
  await expect(car).toContainText('王强');
  await expect(car.getByRole('link', { name: 'Gọi điện' })).toHaveAttribute('href', 'tel:+8613800001234');
  await car.getByRole('button', { name: 'Gọi WeChat' }).click();
  await expect(car.locator('.car-note')).toContainText('nhóm "Đoàn Bắc Kinh 14/11"');
  await expect(car.locator('.car-note')).toContainText('Gọi thoại');
});

test('chỉ có biển số: hiện biển số, không có nút gọi điện, vẫn gọi WeChat qua nhóm', async ({ page, context }) => {
  await withContacts(context, { driver: { zh: '', nameVi: '', phone: '', plate: '京B·88888' } });
  await go(page);
  await expect(page.locator('.car .plate')).toContainText('京B·88888');
  await expect(page.locator('.car a.btn')).toHaveCount(0);
  await page.locator('.car [data-wechat]').click();
  await expect(page.locator('.car-note')).toContainText('nhóm WeChat của đoàn');
});

test('có khách sạn: nút "Về khách sạn" mở thẻ tài xế chữ Trung', async ({ page, context }) => {
  await withContacts(context, { hotel: { name: 'Khách sạn Thử', zh: '测试酒店', addressZh: '北京市东城区测试路1号', addressVi: 'Số 1 đường Thử', lat: null, lng: null, phone: '' } });
  await go(page);
  await page.locator('[data-hotel]').click();
  await expect(page.getByRole('dialog')).toContainText('北京市东城区测试路1号');
});
