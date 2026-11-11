import { tripPhase, currentAndNext, firstStop, daysUntil, dowOf, fmtDM, remainingText, stopWindow } from './time.js';

export const deg = n => (n < 0 ? '−' + -n : String(n));
export const stopLabel = s => (s.kind ? `${s.title} · ${s.kind}` : s.title);

export function heroState(data, now, viewDate) {
  const T = data.tour, days = data.days, n = days.length;
  const di = days.findIndex(d => d.date === viewDate);
  const day = days[di];
  const placeOf = id => data.places.find(p => p.id === id);
  const dayHero = placeOf(day.heroPlace);
  const dayLine = `${dowOf(day.date)} ${fmtDM(day.date)} · ${deg(day.lo)} / ${day.hi}°C · Ngày ${di + 1}/${n}`;
  const mk = (o) => ({ img: dayHero.hero, label: '', title: '', zh: '', sub: dayLine, kind: 'day', cta: '', ...o });
  const base = mk({ title: dayHero.name, zh: dayHero.zh });
  const ended = mk({ label: 'Chuyến đi đã kết thúc', title: 'Cảm ơn anh chị đã đi cùng đoàn', sub: '', kind: 'ended', cta: 'Chuyến đi thế nào?' });

  const phase = tripPhase(T, now);
  if (phase === 'before') {
    if (viewDate !== T.start) return base;
    const f = firstStop(day);
    return mk({ label: `Còn ${daysUntil(T.start, now)} ngày nữa khởi hành`, title: T.title,
      sub: `${f.s} ${dowOf(day.date).toLowerCase()} ${fmtDM(day.date)} · ${f.title}`, kind: 'before' });
  }
  if (phase === 'after') return viewDate === T.end ? ended : base;
  if (viewDate !== now.date) return base;

  const { cur, next } = currentAndNext(day, now.min);
  if (cur) {
    const p = cur.place && cur.k === 'sight' ? placeOf(cur.place) : null;
    if (p) return mk({ img: p.hero, label: `Đang diễn ra · còn ${remainingText(stopWindow(cur)[1] - now.min)}`, title: p.name, zh: p.zh, kind: 'now' });
    return mk({ label: 'Đang diễn ra', title: stopLabel(cur), zh: cur.zh, kind: 'now' });
  }
  if (next) {
    const p = next.place && next.k === 'sight' ? placeOf(next.place) : null;
    return mk({ img: p ? p.hero : dayHero.hero, label: `Tiếp theo · ${next.s}`, title: stopLabel(next), zh: next.zh || (p ? p.zh : ''), kind: 'next' });
  }
  if (di === n - 1) return ended;
  return mk({ label: 'Hết lịch hôm nay', title: 'Nghỉ ngơi, giữ ấm', sub: `Mai bắt đầu lúc ${firstStop(days[di + 1]).s}`, kind: 'rest' });
}
