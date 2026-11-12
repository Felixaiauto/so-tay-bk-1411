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
  await expect(page.locator('.story .st-pills')).toHaveCount(0); // khung 01 không có clip
  await page.locator('.st-next').click();
  await expect(page.locator('.story .st-pills [data-vid]')).toHaveText('▶ Xem video');
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
  await expect(page.locator('.ptile')).toHaveCount(9);
  await expect(page.locator('.pgroup').first().locator('.pg-name')).toHaveText('Cố Cung');
  await expect(page.locator('.pgroup').first().locator('.pg-time')).toHaveText('08:30');
  const co = page.locator('.pgroup', { hasText: 'Cố Cung' }).locator('.ptile');
  await expect(co).toHaveCount(3);
  await expect(co.nth(0).locator('.ptile-clip')).toHaveCount(0);
  await expect(co.nth(1).locator('.ptile-clip')).toHaveText('▶');
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
  await st.locator('[data-next]').click(); // phím ← → bị khóa khi xem video; nút › vẫn chuyển khung
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

test('hai clip inline: phát clip B thì clip A dừng và về poster; mở story thì clip inline dừng', async ({ page }) => {
  await page.goto(PLACE);
  await expect(page.locator('.pframe')).toHaveCount(3);
  // mỗi điểm chỉ có tối đa 1 clip trong dữ liệu thật; nhân bản khối .vbox sang khung 3 để có hai clip inline (cùng handler ủy quyền)
  await page.evaluate(() => {
    const a = document.querySelectorAll('.pframe')[1].querySelector('.vbox');
    const b = a.cloneNode(true);
    b.id = 'vbox-b';
    document.querySelectorAll('.pframe')[2].append(b);
  });
  const A = page.locator('.pframe').nth(1).locator('.vbox');
  const B = page.locator('#vbox-b');
  await A.locator('.vplay').click();
  const hA = await A.locator('video').elementHandle();
  await expect(A.locator('video')).toHaveCount(1);
  await B.locator('.vplay').click();
  await expect(B.locator('video')).toHaveCount(1);
  expect(await hA.evaluate(e => e.paused)).toBe(true);
  expect(await hA.evaluate(e => e.isConnected)).toBe(false);
  await expect(A.locator('video')).toHaveCount(0);
  await expect(A.locator('.vplay')).toHaveCount(1); // về poster + ▶, bấm phát lại được
  // mở story từ trang: clip inline B dừng
  const hB = await B.locator('video').elementHandle();
  await page.locator('.psec-strip button').first().click();
  await expect(page.locator('.story')).toHaveCount(1);
  expect(await hB.evaluate(e => e.paused)).toBe(true);
  await expect(page.locator('.vbox video')).toHaveCount(0);
});

test('story: đang xem video, phím ← → không chuyển khung và không gỡ video', async ({ page }) => {
  await page.goto(PLACE);
  await page.locator('.psec-strip button').nth(1).click();
  const st = page.locator('.story');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await st.locator('.st-pills [data-vid]').click();
  await expect(st.locator('.st-vid video')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await expect(st.locator('.st-vid video')).toHaveCount(1);
  // focus đang ở chính video: vẫn không chuyển khung
  await st.locator('.st-vid video').focus();
  await page.keyboard.press('ArrowRight');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 2/3');
  await expect(st.locator('.st-vid video')).toHaveCount(1);
  // đóng video thì phím chuyển khung hoạt động lại
  await st.locator('[data-vclose]').click();
  await page.keyboard.press('ArrowRight');
  await expect(st.locator('.st-hd span')).toHaveText('Cố Cung · Khung 3/3');
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
