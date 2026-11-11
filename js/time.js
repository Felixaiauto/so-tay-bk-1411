const TZ_MS = 8 * 3600e3;
const NOW_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function bjNow(nowParam, realNow = Date.now()) {
  let ms = realNow;
  const m = nowParam && NOW_RE.exec(nowParam);
  if (m) ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - TZ_MS;
  const u = new Date(ms + TZ_MS);
  return { date: u.toISOString().slice(0, 10), min: u.getUTCHours() * 60 + u.getUTCMinutes() };
}

export const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export function stopWindow(stop) { const a = toMin(stop.s); return [a, stop.e ? toMin(stop.e) : a + 20]; }

export function tripPhase(tourMeta, now) {
  if (now.date < tourMeta.start) return 'before';
  if (now.date > tourMeta.end) return 'after';
  return 'during';
}
export const daysUntil = (dateStr, now) => Math.round((Date.parse(dateStr) - Date.parse(now.date)) / 864e5);

export function currentAndNext(day, nowMin) {
  let cur = null, next = null;
  for (const s of day.stops) {
    if (s.optional) continue;
    const [a, b] = stopWindow(s);
    if (nowMin >= a && nowMin < b && (!cur || a >= stopWindow(cur)[0])) cur = s;
    if (!next && a > nowMin) next = s;
  }
  return { cur, next };
}
export const firstStop = day => day.stops.find(s => !s.optional);

export function stopStatus(stop, viewDate, now) {
  if (viewDate < now.date) return 'past';
  if (viewDate > now.date) return 'future';
  const [a, b] = stopWindow(stop);
  if (now.min >= b) return 'past';
  if (now.min >= a) return 'now';
  return 'future';
}

const DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const wd = d => new Date(d + 'T00:00:00Z').getUTCDay();
export const dowOf = d => DOW[wd(d)];
export const dowShort = d => (wd(d) === 0 ? 'CN' : 'T.' + (wd(d) + 1));
export const fmtDM = d => `${+d.slice(8, 10)}/${+d.slice(5, 7)}`;
export function remainingText(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h} giờ ${m} phút` : `${m} phút`;
}
