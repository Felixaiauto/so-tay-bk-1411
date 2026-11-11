const enc = encodeURIComponent;
export function amapLink(t) {
  const name = t.zhFull || t.zh;
  if (t.lat != null && t.lng != null) return `https://uri.amap.com/navigation?to=${t.lng},${t.lat},${enc(name)}&mode=car&callnative=1`;
  return `https://uri.amap.com/search?keyword=${enc(name)}&city=${enc('北京')}&callnative=1`;
}
export const telHref = n => (n ? 'tel:' + String(n).replace(/[^\d+]/g, '') : '');
