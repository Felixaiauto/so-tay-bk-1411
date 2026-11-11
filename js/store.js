const KEY = 'bk-store-v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
export const get = (ns, id) => !!(load()[ns] || {})[id];
export function set(ns, id, val) {
  const s = load();
  (s[ns] ||= {})[id] = !!val;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bộ nhớ đầy/chặn: bỏ qua */ }
}
