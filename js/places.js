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

export function placesOnDay(data, date) {
  const day = data.days.find(d => d.date === date);
  const out = [];
  if (!day) return out;
  const byId = new Map();
  for (const s of day.stops) {
    if (!s.place) continue;
    const g = byId.get(s.place);
    if (!g) {
      const place = data.places.find(p => p.id === s.place);
      if (!place) continue;
      const r = { place, s: s.s, optional: !!s.optional };
      byId.set(s.place, r);
      out.push(r);
    } else {
      if (s.s < g.s) g.s = s.s;
      g.optional = g.optional && !!s.optional;
    }
  }
  return out;
}
