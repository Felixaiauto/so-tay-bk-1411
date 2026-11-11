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
  await expect(page.locator('.poses')).toHaveCount(0);
  await expect(page.locator('.pcover')).toHaveCount(10);
  await page.locator('[data-open-story="mo-dien-du"]').click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Vạn Lý Trường Thành · Mộ Điền Dụ · Khung 1/3');
  await page.keyboard.press('Escape');
  await page.locator('.pcover', { hasText: 'Cố Cung' }).locator('a.link').click();
  await expect(page).toHaveURL(/#dd-co-cung\/chup-anh$/);
  await expect(page.locator('[data-sec="chup-anh"] .psec-h')).toBeInViewport();
});

test('Chụp ảnh: Esc đóng story, focus trở về ảnh bìa đã chạm', async ({ page }) => {
  await page.goto('./?now=2026-11-17T09:40#chup-anh');
  const cover = page.locator('.pcover-img').first();
  await cover.click();
  await expect(page.locator('.story')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(cover).toBeFocused();
});

test('story trên màn hình thấp: ‹ › nằm trên khối chữ và vẫn bấm được', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 520 });
  await page.goto(PLACE);
  await page.locator('.psec-strip button').first().click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 1/3');
  const bt = await page.locator('.st-bt').evaluate(e => ({ h: e.getBoundingClientRect().height, vh: innerHeight, over: getComputedStyle(e).overflowY }));
  expect(bt.h).toBeLessThanOrEqual(bt.vh * 0.55 + 1);
  expect(bt.over).toBe('auto');
  await page.locator('.st-next').click({ trial: true }); // báo lỗi nếu có phần tử khác che
  await page.locator('.st-next').click();
  await expect(page.locator('.story .st-hd span')).toHaveText('Cố Cung · Khung 2/3');
});

test('khung có clip: khối video có poster, ▶ to, thời lượng, một dòng tiêu đề; bấm mới phát', async ({ page }) => {
  await page.goto(PLACE);
  await expect(page.locator('.pframe').first().locator('.vbox')).toHaveCount(0);
  await expect(page.locator('.pframe .vbox')).toHaveCount(1);
  const box = page.locator('.pframe').nth(1).locator('.vbox');
  await expect(box.locator('img')).toHaveAttribute('src', './img/co-cung-2-poster-900.webp');
  await expect(box.locator('.vdur')).toHaveText('0:12');
  await expect(box.locator('.vcap')).toHaveText('Tạo dáng bên tường đỏ Cố Cung');
  await expect(box).not.toContainText(/offline|ngoại tuyến|giây/i);
  await expect(box.locator('video')).toHaveCount(0);
  const play = box.locator('.vplay');
  const ico = await box.locator('.vplay-ico').boundingBox();
  expect(ico.width).toBeGreaterThanOrEqual(56);
  expect(ico.height).toBeGreaterThanOrEqual(56);
  const pb = await play.boundingBox();
  expect(pb.width).toBeGreaterThanOrEqual(44);
  expect(pb.height).toBeGreaterThanOrEqual(44);
  expect(await box.evaluate(e => [getComputedStyle(e).backgroundColor, getComputedStyle(e).borderRadius])).toEqual(['rgb(30, 26, 22)', '12px']);
  await play.click();
  const v = box.locator('video');
  await expect(v).toHaveCount(1);
  await expect(v).toHaveAttribute('src', './video/co-cung-2.mp4');
  await expect(v).toHaveAttribute('poster', './img/co-cung-2-poster-900.webp');
  await expect(v).toHaveAttribute('preload', 'none');
  await expect(v).toHaveAttribute('controls', '');
  await expect(v).toHaveAttribute('playsinline', '');
  expect(await v.evaluate(e => e.muted)).toBe(true);
  await expect(box.locator('.vplay')).toHaveCount(0);
});

test('story: khung có clip hiện ▶ Xem video; bấm thì video phủ ảnh, chuyển khung hoặc đóng thì video dừng và gỡ', async ({ page }) => {
  await page.goto(PLACE);
  await page.locator('.psec-strip button').first().click();
  const st = page.locator('.story');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 1/3');
  await expect(st.locator('[data-vid]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  const pill = st.locator('.st-pills [data-vid]');
  await expect(pill).toHaveText('▶ Xem video');
  expect((await pill.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await pill.click();
  const v = st.locator('.st-vid video');
  await expect(v).toHaveCount(1);
  await expect(v).toHaveAttribute('src', './video/co-cung-2.mp4');
  for (const a of ['controls', 'autoplay', 'playsinline']) await expect(v).toHaveAttribute(a, '');
  expect(await v.evaluate(e => e.muted)).toBe(true);
  // chạm vào video không làm story chuyển khung
  const vb = await v.boundingBox();
  await page.mouse.click(vb.x + vb.width * 0.9, vb.y + vb.height * 0.3);
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  // nút đóng video: về lại ảnh, nút ▶ Xem video còn
  await st.locator('[data-vclose]').click();
  await expect(st.locator('.st-vid')).toHaveCount(0);
  await expect(pill).toBeVisible();
  // mở lại, rồi chuyển khung: video phải dừng và gỡ
  await pill.click();
  const h = await st.locator('.st-vid video').elementHandle();
  await page.keyboard.press('ArrowRight');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 3/3');
  await expect(st.locator('.st-vid')).toHaveCount(0);
  expect(await h.evaluate(e => e.paused)).toBe(true);
  expect(await h.evaluate(e => e.isConnected)).toBe(false);
  // đóng story khi video đang chạy: video dừng
  await page.keyboard.press('ArrowLeft');
  await st.locator('[data-vid]').click();
  const h2 = await st.locator('.st-vid video').elementHandle();
  await page.keyboard.press('Escape');
  await expect(page.locator('.story')).toHaveCount(0);
  expect(await h2.evaluate(e => e.paused)).toBe(true);
});
