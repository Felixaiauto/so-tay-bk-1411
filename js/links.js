const enc = encodeURIComponent;
export function amapLink(t) {
  const name = t.zhFull || t.zh;
  if (t.lat != null && t.lng != null) return `https://uri.amap.com/navigation?to=${t.lng},${t.lat},${enc(name)}&mode=car&callnative=1`;
  return `https://uri.amap.com/search?keyword=${enc(name)}&city=${enc('北京')}&callnative=1`;
}
export const douyinSearch = kw => `https://www.douyin.com/search/${enc(kw)}`;
export const xhsSearch = kw => `https://www.xiaohongshu.com/search_result?keyword=${enc(kw)}`;
export const telHref = n => (n ? 'tel:' + String(n).replace(/[^\d+]/g, '') : '');
