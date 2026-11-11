import { fmtDM } from './time.js';

export function placeWindows(data, id) {
  const byDate = new Map();
  for (const d of data.days) {
    for (const s of d.stops) {
      if (s.place !== id) continue;
      const e = s.e || s.s;
      const w = byDate.get(d.date);
      if (!w) byDate.set(d.date, { date: d.date, s: s.s, e, optional: !!s.optional });
      else {
        if (s.s < w.s) w.s = s.s;
        if (e > w.e) w.e = e;
        w.optional = w.optional && !!s.optional;
      }
    }
  }
  return [...byDate.values()];
}

export function whenText(data, id) {
  const ws = placeWindows(data, id);
  const fmt = w => `${fmtDM(w.date)} · ${w.s}–${w.e}`;
  const main = ws.filter(w => !w.optional).map(fmt).join(' và ');
  const opt = ws.filter(w => w.optional).map(fmt).join(', ');
  return main + (opt ? ` (dự phòng ${opt})` : '');
}

export function placesByDay(data) {
  const seen = new Set();
  const groups = [];
  for (const d of data.days) {
    const places = [];
    for (const s of d.stops) {
      if (!s.place || s.optional || seen.has(s.place)) continue;
      seen.add(s.place);
      places.push(data.places.find(p => p.id === s.place));
    }
    if (places.length) groups.push({ date: d.date, places });
  }
  return groups;
}
