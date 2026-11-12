import { test, expect } from '@playwright/test';

const PLACE = './?now=2026-11-17T09:40#dd-co-cung';

// Các test ở đây kiểm hành vi, không phụ thuộc số ảnh mẫu thật: bỏ hết shot.more (ảnh anh gửi thêm dần).
async function baseData() {
  const fs = await import('node:fs');
  const data = JSON.parse(fs.readFileSync('data/tour.json', 'utf8'));
  for (const p of data.places) for (const s of p.photo.shots) delete s.more;
  return data;
}
const serve = (context, data) =>
  context.route('**/data/tour.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) }));
test.beforeEach(async ({ context }) => { await serve(context, await baseData()); });

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

test('không còn nút tìm trên Douyin / Xiaohongshu ở khung và story', async ({ page }) => {
  await page.goto(PLACE);
  await expect(page.locator('.pframe')).toHaveCount(3);
  await expect(page.locator('a[href*="douyin.com"], a[href*="xiaohongshu.com"]')).toHaveCount(0);
  await page.locator('.psec-strip button').first().click();
  await expect(page.locator('.story a[href*="xiaohongshu.com"]')).toHaveCount(0);
  await expect(page.locator('.story video, .story [data-vid]')).toHaveCount(0); // đã bỏ video
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

test('tab Chụp ảnh: dải ngày, các điểm trong ngày, ô khung, mở story, đổi ngày dùng chung với Lịch trình', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#chup-anh');
  await expect(page.locator('.pcover')).toHaveCount(0);
  await expect(page.locator('.day')).toHaveCount(5);
  await expect(page.locator('.day[data-date="2026-11-17"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pgroup')).toHaveCount(4);
  await expect(page.locator('.ptile')).toHaveCount(8);
  await expect(page.locator('.pgroup').first().locator('.pg-name')).toHaveText('Cố Cung');
  await expect(page.locator('.pgroup').first().locator('.pg-time')).toHaveText('08:30');
  const co = page.locator('.pgroup', { hasText: 'Cố Cung' }).locator('.ptile');
  await expect(co).toHaveCount(3);
  await expect(page.locator('.ptile-clip')).toHaveCount(0);
  await expect(co.nth(1).locator('.ptile-n')).toHaveText('02');
  await expect(co.nth(1)).toHaveAttribute('aria-label', /^Cố Cung · khung 02: .+/);
  expect((await co.nth(1).boundingBox()).height).toBeGreaterThanOrEqual(44);
  await co.nth(1).click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await page.keyboard.press('Escape');
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(co.nth(1)).toBeFocused();
  await page.locator('.day[data-date="2026-11-16"]').click();
  await expect(page.locator('.day[data-date="2026-11-16"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ptile')).toHaveCount(7);
  await expect(page.locator('.pgroup')).toHaveCount(2);
  await expect(page.locator('.pgroup .pg-name')).toHaveText(['Vạn Lý Trường Thành · Mộ Điền Dụ', 'Di Hòa Viên']);
  await expect(page.locator('.pgroup .pg-time')).toHaveText(['09:00', '14:45']);
  await page.locator('#tabs a[data-v="lich-trinh"]').click();
  await expect(page.locator('.day[data-date="2026-11-16"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.day[data-date="2026-11-18"]').click();
  await page.locator('#tabs a[data-v="chup-anh"]').click();
  await expect(page.locator('.day[data-date="2026-11-18"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pgroup .pg-time').first()).toHaveText('08:30, dự phòng');
});

test('story trên màn hình thấp: ‹ › nằm trên khối chữ và vẫn bấm được', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 520 });
  await page.goto(PLACE);
  await page.locator('.psec-strip button').first().click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 1/3');
  await page.locator('.st-guide').click();
  const bt = await page.locator('.st-bt').evaluate(e => ({ h: e.getBoundingClientRect().height, vh: innerHeight, over: getComputedStyle(e).overflowY }));
  expect(bt.h).toBeLessThanOrEqual(bt.vh * 0.55 + 1);
  expect(bt.over).toBe('auto');
  await page.locator('.st-next').click({ trial: true }); // báo lỗi nếu có phần tử khác che
  await page.locator('.st-next').click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 2/3');
});

test('tab Chụp ảnh: điểm có số ảnh lẻ thì ô đầu chiếm cả hàng', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#chup-anh');
  const co = page.locator('.pgroup', { hasText: 'Cố Cung' }).locator('.ptile'); // 3 ảnh
  const [a, b, c] = [await co.nth(0).boundingBox(), await co.nth(1).boundingBox(), await co.nth(2).boundingBox()];
  expect(a.width).toBeGreaterThan(b.width * 1.8);
  expect(Math.abs(b.y - c.y)).toBeLessThan(1);
  const cs = page.locator('.pgroup', { hasText: 'Cảnh Sơn' }).locator('.ptile'); // 2 ảnh
  expect(Math.abs((await cs.nth(0).boundingBox()).width - (await cs.nth(1).boundingBox()).width)).toBeLessThan(1);
});

// Dữ liệu giả: khung 01 của Cố Cung có thêm 2 ảnh (mượn ảnh khung 02, 03) — kiểm nhiều ảnh mỗi khung.
async function withMore(context) {
  const data = await baseData();
  data.places.find(p => p.id === 'co-cung').photo.shots[0].more = ['co-cung-2', 'co-cung-3'];
  await context.unroute('**/data/tour.json');
  await serve(context, data);
}

test('khung nhiều ảnh: nhãn +N, story xem hết ảnh trong khung rồi sang khung sau', async ({ page, context }) => {
  await withMore(context);
  await page.goto(PLACE);
  const s = page.locator('[data-sec="chup-anh"]');
  await expect(s.locator('.psec-lead .nmore')).toHaveText('+2');
  await expect(s.locator('.psec-strip button').first().locator('.nmore')).toHaveText('+2');
  await expect(s.locator('.psec-strip button').nth(1).locator('.nmore')).toHaveCount(0);
  await s.locator('.psec-lead').click();
  const st = page.locator('.story');
  const hd = st.locator('.st-hd span');
  await expect(hd).toHaveText('Cố Cung · Khung 1/3 · ảnh 1/3');
  await expect(st.locator('.st-prev')).toBeDisabled();
  await expect(st.locator('.st-prog i.part')).toHaveCount(1);
  await st.locator('.st-next').click();
  await expect(hd).toHaveText('Cố Cung · Khung 1/3 · ảnh 2/3');
  await expect(st.locator('.st-img img')).toHaveAttribute('src', /co-cung-2-900\.webp/);
  await page.keyboard.press('ArrowRight');
  await expect(hd).toHaveText('Cố Cung · Khung 1/3 · ảnh 3/3');
  await st.locator('.st-next').click();
  await expect(hd).toHaveText('Cố Cung · Khung 2/3');
  await expect(st.locator('.st-prog i.on')).toHaveCount(2);
  await st.locator('.st-prev').click();
  await expect(hd).toHaveText('Cố Cung · Khung 1/3 · ảnh 3/3');
});

test('tab Chụp ảnh: ô khung nhiều ảnh có +N, mở story từ ảnh đầu của khung', async ({ page, context }) => {
  await withMore(context);
  await page.goto('./?now=2026-11-17T09:40#chup-anh');
  const co = page.locator('.pgroup', { hasText: 'Cố Cung' }).locator('.ptile');
  await expect(co.first().locator('.nmore')).toHaveText('+2');
  await expect(co.first()).toHaveAttribute('aria-label', /3 ảnh/);
  await co.first().click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 1/3 · ảnh 1/3');
});

test('điểm chỉ có 1 khung: không hiện dải ảnh nhỏ lặp lại ảnh lớn', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#dd-bao-tang-khoa-hoc');
  const s = page.locator('[data-sec="chup-anh"]');
  await expect(s.locator('.psec-lead')).toHaveCount(1);
  await expect(s.locator('.psec-strip')).toHaveCount(0);
  await expect(s.locator('.pframe')).toHaveCount(1);
});

test('story: hướng dẫn chụp ẩn sẵn, ảnh hiện trọn; nút Hướng dẫn chụp bật/tắt và giữ khi chuyển ảnh', async ({ page }) => {
  await page.goto(PLACE);
  await page.locator('.psec-strip button').first().click();
  const st = page.locator('.story'), btn = st.locator('.st-guide');
  await expect(st.locator('.st-bt')).toBeHidden();
  await expect(st.locator('.st-img img')).toHaveCSS('object-fit', 'contain');
  await expect(btn).toHaveText('Hướng dẫn chụp');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.click();
  await expect(st.locator('.st-bt')).toBeVisible();
  await expect(st.locator('.st-h')).toHaveText('Một mình giữa sân Thái Hòa Điện');
  await expect(btn).toHaveText('Ẩn hướng dẫn');
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(btn).toBeFocused();
  await st.locator('.st-next').click();
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await expect(st.locator('.st-bt')).toBeVisible();
  await st.locator('.st-guide').click();
  await expect(st.locator('.st-bt')).toBeHidden();
  expect((await st.locator('.st-guide').boundingBox()).height).toBeGreaterThanOrEqual(44);
});
