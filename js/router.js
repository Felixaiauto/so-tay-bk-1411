export const TABS = ['lich-trinh', 'dia-diem', 'chup-anh', 'chuan-bi', 'tro-giup'];
export function parseHash(hash) {
  const h = String(hash || '').replace(/^#/, '');
  const m = h.match(/^dd-([a-z0-9-]+)(?:\/(chup-anh))?$/);
  if (m) return { view: 'place', id: m[1], section: m[2] || null };
  return { view: TABS.includes(h) ? h : 'lich-trinh', id: null, section: null };
}
