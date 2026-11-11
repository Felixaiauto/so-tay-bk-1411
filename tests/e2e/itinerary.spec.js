import { test, expect } from '@playwright/test';

const go = (page, now, hash = '') => page.goto(`./?now=${now}${hash}`);
const cases = [
  ['2026-11-12T10:00', 'Còn 2 ngày nữa khởi hành', 'Bắc Kinh'],
  ['2026-11-17T09:40', 'Đang diễn ra · còn 1 giờ 35 phút', 'Cố Cung'],
  ['2026-11-17T11:20', 'Đang diễn ra', 'Cà phê Giác Lâu · Cà phê'],
  ['2026-11-17T16:20', 'Tiếp theo · 16:30', 'Khu Olympic'],
  ['2026-11-17T21:00', 'Hết lịch hôm nay', 'Nghỉ ngơi, giữ ấm'],
  ['2026-11-18T09:00', 'Tiếp theo · 10:15', 'Dạo khu trung tâm, mua quà'],
  ['2026-11-18T21:00', 'Chuyến đi đã kết thúc', 'Cảm ơn anh chị đã đi cùng đoàn'],
  ['2026-11-20T10:00', 'Chuyến đi đã kết thúc', 'Cảm ơn anh chị đã đi cùng đoàn'],
];
for (const [now, label, title] of cases) {
  test(`ảnh lớn lúc ${now}`, async ({ page }) => {
    await go(page, now);
    await expect(page.locator('.live')).toHaveText(label);
    await expect(page.locator('.hero-title')).toHaveText(title);
    await expect(page.locator('.hero-tz')).toHaveText('Giờ Bắc Kinh · nhanh hơn Việt Nam 1 tiếng');
  });
}

test('mặc định chọn hôm nay; bấm ngày 16 đổi ảnh và danh sách', async ({ page }) => {
  await go(page, '2026-11-17T09:40');
  await expect(page.locator('.day[aria-pressed="true"] b')).toHaveText('17');
  await page.locator('.day[data-date="2026-11-16"]').click();
  await expect(page.locator('.day[aria-pressed="true"] b')).toHaveText('16');
  await expect(page.locator('.hero-title')).toHaveText('Vạn Lý Trường Thành · Mộ Điền Dụ');
  await expect(page.locator('.live')).toHaveCount(0);
  await expect(page.locator('.stop-title').first()).toHaveText('Xe đưa đi Mộ Điền Dụ');
});

test('hôm nay: mục đã qua gom vào "Đã qua", mục hiện tại có chấm đỏ', async ({ page }) => {
  await go(page, '2026-11-17T12:40');
  await expect(page.locator('details.past summary')).toContainText('Đã qua');
  await expect(page.locator('.stop.is-now .stop-title')).toHaveText('Công viên Cảnh Sơn');
});

test('"Đã qua" giữ trạng thái mở sau khi vẽ lại', async ({ page }) => {
  await go(page, '2026-11-17T12:40');
  await page.locator('details.past summary').click();
  await expect(page.locator('details.past')).toHaveAttribute('open', '');
  // Clicking the summary focuses it, and the tick skips re-render while focus is inside #app; blur so the re-render really happens.
  await page.evaluate(() => {
    document.activeElement?.blur();
    document.querySelector('details.past').dataset.old = '1';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('details.past[data-old]')).toHaveCount(0); // node was replaced
  await expect(page.locator('details.past')).toHaveAttribute('open', '');
});

test('mục dự phòng ngày 18 có nhãn và không là đang diễn ra', async ({ page }) => {
  await go(page, '2026-11-18T09:00');
  const opt = page.locator('.stop', { hasText: 'Bảo tàng Lịch sử Tự nhiên' });
  await expect(opt.locator('.pill', { hasText: 'Dự phòng' })).toBeVisible();
  await expect(page.locator('.stop.is-now')).toHaveCount(0);
});

test('ảnh món có chú thích minh họa; sân bay lấy từ contacts', async ({ page }) => {
  await go(page, '2026-11-14T08:00');
  await expect(page.locator('.stop', { hasText: 'Đô Nhất Xứ' }).locator('.stop-note')).toHaveText('Ảnh minh họa món');
  await page.locator('.day[data-date="2026-11-18"]').click();
  await expect(page.locator('.stop', { hasText: 'Lên xe ra sân bay' }).locator('.stop-sub')).toHaveText('Sân bay PEK hoặc PKX tùy vé');
});

test('quán có địa chỉ mở thẻ tài xế', async ({ page }) => {
  await go(page, '2026-11-14T08:00');
  await page.locator('[data-driver="d14-3"]').click();
  await expect(page.getByRole('dialog')).toContainText('北京市东城区前门大街38号');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('không cuộn ngang ở 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const h of ['', '#chuan-bi', '#tro-giup']) {
    await go(page, '2026-11-17T09:40', h);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, h || 'lich-trinh').toBeLessThanOrEqual(0);
  }
});
