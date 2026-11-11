import { test, expect } from '@playwright/test';

const PLACE = './?now=2026-11-17T09:40#dd-co-cung';

test('mục chụp ảnh: tiêu đề, giờ đẹp, ảnh 01, dải 3 ảnh, 3 khung có 3 cột', async ({ page }) => {
  await page.goto(PLACE);
  const s = page.locator('[data-sec="chup-anh"]');
  await expect(s.locator('.psec-h')).toHaveText('Tường đỏ, ngói vàng và một sân đá trống');
  await expect(s.locator('.psec-tip')).toContainText('Giờ đẹp');
  await expect(s.locator('.psec-num')).toHaveText('01');
  await expect(s.locator('.psec-strip button')).toHaveCount(3);
  await expect(s.locator('.pframe')).toHaveCount(3);
  await expect(s.locator('.pframe').first().locator('.pcols b')).toHaveText(['Đứng ở đâu', 'Cầm máy', 'Dáng']);
  await expect(s).not.toContainText('sưu tầm');
});

test('nút xem thêm: tiếng Việt, đúng app, chép từ khóa', async ({ page, context }) => {
  await context.route(/douyin\.com|xiaohongshu\.com/, r => r.abort());
  await page.goto(PLACE);
  const f = page.locator('.pframe').first();
  await expect(f.locator('.pmore a').nth(0)).toHaveText('Xem thêm video mẫu');
  await expect(f.locator('.pmore a').nth(0)).toHaveAttribute('href', /^https:\/\/www\.douyin\.com\/search\//);
  await expect(f.locator('.pmore a').nth(1)).toHaveText('Xem thêm ảnh mẫu');
  await expect(f.locator('.pmore a').nth(1)).toHaveAttribute('href', /^https:\/\/www\.xiaohongshu\.com\/search_result\?keyword=/);
  const popup = page.waitForEvent('popup');
  await f.locator('.pmore a').nth(1).click();
  await (await popup).close();
  await expect(page.locator('#toast')).toHaveText('Đã chép từ khóa · dán vào ô tìm kiếm nếu app không tự tìm');
});

test('story: mở từ dải ảnh, chạm phải/trái, giữa ẩn chữ, phím, Back đóng', async ({ page }) => {
  await page.goto(PLACE);
  await page.locator('.psec-strip button').nth(1).click();
  const st = page.locator('.story');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  const box = await st.boundingBox();
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height * 0.3);
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 3/3');
  await page.mouse.click(box.x + box.width * 0.1, box.y + box.height * 0.3);
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.3);
  await expect(st).toHaveClass(/is-clean/);
  await page.keyboard.press('ArrowRight');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 3/3');
  await expect(st.locator('[data-next]')).toBeDisabled();
  await page.goBack();
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(page).toHaveURL(/#dd-co-cung$/);
});

test('story: Esc đóng, focus trở về ảnh đã chạm', async ({ page }) => {
  await page.goto(PLACE);
  const lead = page.locator('.psec-lead');
  await lead.click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 1/3');
  await page.keyboard.press('Escape');
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(lead).toBeFocused();
});

test('#dd-…/chup-anh cuộn thẳng tới mục chụp ảnh', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-co-cung/chup-anh');
  await expect(page.locator('[data-sec="chup-anh"] .psec-h')).toBeInViewport();
});

test('story: sau khi chuyển khung, Shift+Tab không thoát khỏi overlay', async ({ page }) => {
  await page.goto(PLACE);
  await page.locator('.psec-strip button').first().click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 1/3');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.querySelector('.overlay').contains(document.activeElement))).toBe(true);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.querySelector('.overlay').contains(document.activeElement))).toBe(true);
});

test('tab Chụp ảnh: thư viện 9 dáng, 10 bộ ảnh theo ngày, mở story, dẫn tới chỉ dẫn đầy đủ', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#chup-anh');
  await expect(page.locator('.poses > div')).toHaveCount(9);
  await expect(page.locator('.pcover')).toHaveCount(10);
  await page.locator('[data-open-story="mo-dien-du"]').click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Vạn Lý Trường Thành · Mộ Điền Dụ · Khung 1/3');
  await page.keyboard.press('Escape');
  await page.locator('.pcover', { hasText: 'Cố Cung' }).locator('a.link').click();
  await expect(page).toHaveURL(/#dd-co-cung\/chup-anh$/);
  await expect(page.locator('[data-sec="chup-anh"] .psec-h')).toBeInViewport();
});
