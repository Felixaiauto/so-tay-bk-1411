// Chạy một lần: node tools/port_draft.mjs  → ghi data/tour.json
// Sau đó data/tour.json là nguồn sự thật, sửa tay; KHÔNG chạy lại script này đè lên.
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('./draft/script.js', import.meta.url), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(src.slice(src.indexOf('var TMIN'), src.indexOf('/* ---------- Tiện ích')), ctx);
vm.runInContext(src.match(/var POSE=\{[^\n]*\};/)[0], ctx);
const s0 = src.indexOf('var SHOTS={');
vm.runInContext(src.slice(s0, src.indexOf('\n};', s0) + 3), ctx);
const { DAYS, PLACES, PIMG, CRED, CHECKS, POSE, SHOTS } = ctx;

const HERO_DAY = { 14: 'thien-dan', 15: 'universal', 16: 'mo-dien-du', 17: 'co-cung', 18: 'tien-mon' };
const FOOD = new Set(['thieu-mai', 'dimsum']);
const STOP_EXTRA = {
  'Đô Nhất Xứ · thiêu mại': { addressZh: '北京市东城区前门大街38号', addressVi: 'Số 38 phố Tiền Môn, quận Đông Thành' },
};
const SW_CC = [{ hex: '#FFFFFF', name: 'Trắng' }, { hex: '#EFE3C8', name: 'Kem' }, { hex: '#D8C3A0', name: 'Be' }, { hex: '#1E1A16', name: 'Đen' }];
const PLACE_EXTRA = {
  'thien-dan': { zhFull: '天坛公园', pinyin: 'Tiāntán Gōngyuán', addressZh: '北京市东城区天坛东里甲1号', addressVi: 'Số 1A Thiên Đàn Đông Lý, quận Đông Thành',
    dropOffZh: '请在天坛东门下车', dropOffVi: 'Cho tôi xuống ở cổng Đông Thiên Đàn',
    swatches: [{ hex: '#B4301C', name: 'Đỏ' }, { hex: '#F4EEDF', name: 'Trắng kem' }, { hex: '#D8C3A0', name: 'Be' }],
    headline: 'Ba tầng mái lam giữa trời đông', bestTime: '13:30–14:30, nắng chiếu thẳng mặt chính Kỳ Niên Điện.' },
  'bao-tang-tu-nhien': { zhFull: '国家自然博物馆', pinyin: 'Guójiā Zìrán Bówùguǎn', addressZh: '北京市东城区天桥南大街126号', addressVi: 'Số 126 phố Thiên Kiều Nam, quận Đông Thành',
    dropOffZh: '', dropOffVi: '', swatches: [],
    headline: 'Nhỏ bé bên bộ xương khủng long', bestTime: 'Vào sảnh bò sát cổ ngay khi qua cổng, trước khi đông.' },
  'tien-mon': { zhFull: '前门大街', pinyin: 'Qiánmén Dàjiē', addressZh: '北京市东城区前门大街', addressVi: 'Phố Tiền Môn, quận Đông Thành',
    dropOffZh: '请在前门箭楼附近下车', dropOffVi: 'Cho tôi xuống gần lầu Tiễn Lâu, đầu phố Tiền Môn', swatches: [],
    headline: 'Phố cổ lên đèn', bestTime: '17:15–17:45, lầu Tiễn Lâu vừa lên đèn.' },
  'universal': { zhFull: '北京环球度假区', pinyin: 'Běijīng Huánqiú Dùjiàqū', addressZh: '北京市通州区北京环球度假区', addressVi: 'Khu Universal Bắc Kinh, quận Thông Châu',
    dropOffZh: '请在环球影城主题公园入口下车', dropOffVi: 'Cho tôi xuống ở cổng vào công viên Universal', swatches: [],
    headline: 'Một ngày ở công viên chủ đề', bestTime: 'Trước 9:00 ở quả địa cầu; 17:30 phố CityWalk lên đèn.' },
  'mo-dien-du': { zhFull: '慕田峪长城', pinyin: 'Mùtiányù Chángchéng', addressZh: '北京市怀柔区渤海镇慕田峪村', addressVi: 'Thôn Mộ Điền Dụ, trấn Bột Hải, quận Hoài Nhu',
    dropOffZh: '请在慕田峪长城游客中心下车', dropOffVi: 'Cho tôi xuống ở trung tâm du khách Mộ Điền Dụ',
    swatches: [{ hex: '#C0392B', name: 'Đỏ' }, { hex: '#D4A017', name: 'Vàng mù tạt' }, { hex: '#E67E22', name: 'Cam' }],
    headline: 'Tường thành uốn theo sống núi', bestTime: '9:30–10:30, nắng xiên làm rõ từng lỗ châu mai.' },
  'di-hoa-vien': { zhFull: '颐和园', pinyin: 'Yíhéyuán', addressZh: '北京市海淀区新建宫门路19号', addressVi: 'Số 19 đường Tân Kiến Cung Môn, quận Hải Điến',
    dropOffZh: '请在颐和园东宫门下车', dropOffVi: 'Cho tôi xuống ở cổng Đông Cung Môn',
    swatches: [{ hex: '#7B1E1E', name: 'Đỏ đô' }, { hex: '#D8C3A0', name: 'Be' }, { hex: '#B08850', name: 'Lạc đà' }],
    headline: 'Cầu 17 nhịp trong nắng chiều', bestTime: 'Khoảng 16:00, trước khi mặt trời lặn lúc 17:00.' },
  'co-cung': { zhFull: '故宫博物院', pinyin: 'Gùgōng Bówùyuàn', addressZh: '北京市东城区景山前街4号', addressVi: 'Số 4 phố Cảnh Sơn Tiền, quận Đông Thành',
    dropOffZh: '请在天安门东附近下车，我从午门进故宫', dropOffVi: 'Cho tôi xuống gần Thiên An Môn phía đông, tôi đi bộ vào Ngọ Môn',
    swatches: SW_CC, headline: 'Tường đỏ, ngói vàng và một sân đá trống', bestTime: 'Tới 8:30, vào thẳng sân Thái Hòa Điện trước khi đông.' },
  'canh-son': { zhFull: '景山公园', pinyin: 'Jǐngshān Gōngyuán', addressZh: '北京市西城区景山西街44号', addressVi: 'Số 44 phố Cảnh Sơn Tây, quận Tây Thành',
    dropOffZh: '请在景山公园南门下车', dropOffVi: 'Cho tôi xuống ở cổng Nam công viên Cảnh Sơn',
    swatches: SW_CC, headline: 'Cả Tử Cấm Thành dưới chân', bestTime: 'Giữa trưa nhìn về nam bị ngược sáng: đo sáng theo mặt người.' },
  'bao-tang-khoa-hoc': { zhFull: '中国科学技术馆', pinyin: 'Zhōngguó Kēxué Jìshù Guǎn', addressZh: '北京市朝阳区北辰东路5号', addressVi: 'Số 5 đường Bắc Thần Đông, quận Triều Dương',
    dropOffZh: '', dropOffVi: '', swatches: [],
    headline: 'Khoa học để chạm vào', bestTime: 'Đầu giờ chiều, sảnh giữa còn vắng.' },
  'khu-olympic': { zhFull: '奥林匹克公园（鸟巢）', pinyin: 'Àolínpǐkè Gōngyuán (Niǎocháo)', addressZh: '北京市朝阳区国家体育场南路1号', addressVi: 'Số 1 đường Sân vận động Quốc gia Nam, quận Triều Dương',
    dropOffZh: '请在鸟巢附近下车', dropOffVi: 'Cho tôi xuống gần sân vận động Tổ Chim', swatches: [],
    headline: 'Tổ Chim lúc lên đèn', bestTime: '17:00–17:15, đèn vừa bật, trời xanh đậm.' },
};
const SEARCH = {
  'thien-dan': ['天坛 祈年殿 拍照 机位', '天坛 祈年殿 人像', '天坛 丹陛桥 拍照'],
  'bao-tang-tu-nhien': ['国家自然博物馆 恐龙 拍照', '国家自然博物馆 拍照'],
  'tien-mon': ['前门大街 箭楼 拍照', '杨梅竹斜街 拍照', '前门 五牌楼 拍照'],
  'universal': ['北京环球影城 地球 拍照', '北京环球 霍格沃茨 拍照', '北京环球城市大道 拍照'],
  'mo-dien-du': ['慕田峪长城 拍照 机位', '慕田峪长城 台阶 拍照', '长城 敌楼 窗口 剪影'],
  'di-hoa-vien': ['颐和园 十七孔桥 拍照', '颐和园 长廊 拍照', '颐和园 昆明湖 佛香阁 拍照'],
  'co-cung': ['故宫 太和殿 机位', '故宫 红墙 拍照', '故宫 门钉 拍照'],
  'canh-son': ['景山公园 万春亭 故宫全景', '景山 万春亭 拍照'],
  'bao-tang-khoa-hoc': ['中国科技馆 拍照', '中国科技馆 亲子 拍照'],
  'khu-olympic': ['鸟巢 夜景 拍照', '奥林匹克公园 鸟巢 水立方 拍照'],
};
const CHECK_IDS = ['ho-chieu', 'anh-ho-chieu', 'vi-dien-tu', 'tien-mat', 'ao-khoac', 'mu-gang', 'giay', 'mieng-dan', 'kem-duong', 'o-cam', 'sac-du-phong', 'thuoc', 'binh-giu-nhiet'];
if (CHECK_IDS.length !== CHECKS.length) throw new Error('CHECKS đổi độ dài: cập nhật CHECK_IDS');

const days = DAYS.map(D => {
  const used = new Set();
  const stops = D.stops.map((s, i) => {
    let thumb = s.ph || (s.place ? PIMG[s.place][0] : '');
    if (used.has(thumb)) thumb = ''; else if (thumb) used.add(thumb);
    const airport = D.d === 18 && s.k === 'move' && s.title.startsWith('Lên xe ra sân bay');
    return {
      id: `d${D.d}-${i + 1}`, s: s.s, e: s.e || '', k: s.k, kind: s.kind || '', title: s.title, zh: s.zh || '',
      sub: airport ? '' : (s.sub || ''), place: s.place || '', flag: s.flag || '',
      optional: D.d === 18 && s.place === 'bao-tang-tu-nhien', airport,
      thumb, thumbNote: thumb && FOOD.has(thumb) ? 'Ảnh minh họa món' : '',
      addressZh: '', addressVi: '', lat: null, lng: null, ...(STOP_EXTRA[s.title] || {}),
    };
  });
  return { date: `2026-11-${D.d}`, lo: D.lo, hi: D.hi, wx: D.wx, heroPlace: HERO_DAY[D.d], stops };
});

const places = PLACES.map(P => {
  const X = PLACE_EXTRA[P.id];
  return {
    id: P.id, name: P.name, zh: P.zh, zhFull: X.zhFull, pinyin: X.pinyin, tag: P.tag,
    hero: PIMG[P.id][0], heroAlt: PIMG[P.id][1],
    dur: P.dur, ticket: P.ticket, req: P.req, buy: P.buy === '—' ? '' : P.buy,
    addressZh: X.addressZh, addressVi: X.addressVi, dropOffZh: X.dropOffZh, dropOffVi: X.dropOffVi, lat: null, lng: null,
    story: P.story, route: P.route, wear: P.wear, wearSwatches: X.swatches, notes: P.notes,
    photo: {
      headline: X.headline, bestTime: X.bestTime,
      shots: (SHOTS[P.id] || []).map((s, i) => ({
        id: `${P.id}-${i + 1}`, title: s[0], img: '', where: s[6], camera: s[7], pose: s[8], poseKey: s[4],
        clip: '', clipDur: '', clipTitle: '', searchZh: SEARCH[P.id][i],
      })),
    },
  };
});

const out = {
  version: '2026-11-12a',
  tour: { id: 'bac-kinh-2026-11', title: 'Bắc Kinh', start: '2026-11-14', end: '2026-11-18', brand: 'Landtour Mẫu', checkedOn: '2026-11-11' },
  contacts: {
    hotel: { name: '', zh: '', addressZh: '', addressVi: '', lat: null, lng: null, phone: '' },
    driver: { name: '', phone: '', plate: '' },
    hotline: '', zalo: '',
    flightBack: { airport: '', time: '' },
    embassy: { name: 'Đại sứ quán Việt Nam', zh: '越南大使馆', addressZh: '北京市朝阳区光华路32号', addressVi: 'Số 32 đường Quang Hoa, quận Triều Dương', lat: null, lng: null, phone: '' },
  },
  days, places,
  prepTasks: [
    { id: 'ho-chieu-goc', text: 'Vé tham quan công ty tour đã đặt theo số hộ chiếu: mang hộ chiếu gốc mỗi ngày' },
    { id: 'luu-offline', text: 'Đã thêm sổ tay vào Màn hình chính, mở từ biểu tượng và thấy "Đã lưu ✓"' },
    { id: 'amap-offline', text: 'Đã tải bản đồ offline Bắc Kinh trong Amap (高德地图)' },
    { id: 'app-tq', text: 'Đã cài Xiaohongshu và Douyin (không bắt buộc)' },
  ],
  checklist: CHECKS.map((text, i) => ({ id: CHECK_IDS[i], text })),
  wearGeneral: [
    'Mặc theo lớp: áo giữ nhiệt, áo len hoặc nỉ, áo khoác dày chắn gió bên ngoài. Trong nhà và trên xe sưởi rất ấm nên cần lớp ngoài dễ cởi.',
    'Chọn một áo khoác màu sáng hoặc màu nổi cho ảnh ngoài trời. Mùa này cây trơ cành và trời xanh nhạt, màu đỏ, kem, vàng mù tạt lên hình đẹp hơn đen và xám.',
  ],
  prepNotes: [
    { k: 'Múi giờ', v: 'Nhanh hơn Việt Nam 1 tiếng. Mọi giờ trong lịch là giờ Bắc Kinh.' },
    { k: 'Hộ chiếu', v: 'Mang theo hằng ngày. Vé tham quan gắn với số hộ chiếu và cổng soát bằng hộ chiếu gốc.' },
    { k: 'Thanh toán', v: 'Hầu hết quán và quầy vé quét mã Alipay hoặc WeChat Pay. Tiền mặt vẫn dùng được nhưng khó thối lẻ.' },
    { k: 'Ứng dụng', v: 'Google, Facebook và Instagram không mở được bằng wifi tại Trung Quốc. Lưu sẵn những gì cần xem.' },
    { k: 'Điện', v: '220V. Ổ cắm chấu dẹt hai chân và ba chân chéo.' },
    { k: 'Nước uống', v: 'Không uống nước vòi. Khách sạn có ấm đun, nên mang bình giữ nhiệt.' },
    { k: 'Nhà vệ sinh', v: 'Điểm tham quan thường là bệt xổm và không có giấy. Mang khăn giấy theo người.' },
    { k: 'An ninh', v: 'Ga tàu điện, bảo tàng và khu Thiên An Môn đều soi chiếu túi xách. Tính thêm thời gian xếp hàng.' },
    { k: 'Bàn ăn', v: 'Không cắm đũa dựng đứng vào bát cơm. Món ăn thường gọi chung và xoay bàn.' },
  ],
  phrases: [
    { zh: '洗手间在哪里?', vi: 'Nhà vệ sinh ở đâu?' },
    { zh: '可以用支付宝吗?', vi: 'Tôi trả bằng Alipay được không?' },
    { zh: '不要辣,谢谢。', vi: 'Xin đừng cho cay, cảm ơn.' },
    { zh: '请帮我叫一辆出租车。', vi: 'Xin gọi giúp tôi một chiếc taxi.' },
    { zh: '我迷路了,请帮我打这个电话。', vi: 'Tôi bị lạc, xin gọi giúp số điện thoại này.' },
  ],
  poses: Object.entries(POSE).map(([id, [fig, label]]) => ({ id, label, fig })),
  afterTour: {
    tours: [
      { id: 'thuong-hai', title: 'Thượng Hải – Hàng Châu – Ô Trấn', desc: '5 ngày 4 đêm · phố Bến Thượng Hải, Tây Hồ, cổ trấn sông nước' },
      { id: 'truong-gia-gioi', title: 'Trương Gia Giới – Phượng Hoàng Cổ Trấn', desc: '6 ngày 5 đêm · núi đá sa thạch, cầu kính, phố cổ bên sông' },
      { id: 'thanh-do', title: 'Thành Đô – Cửu Trại Câu', desc: '6 ngày 5 đêm · gấu trúc, hồ nước nhiều màu trên cao nguyên' },
    ],
  },
  credits: Object.entries(CRED).map(([file, c]) => ({ file, title: c.title, author: c.artist || '', license: c.lic, url: c.page, personalUseOnly: false })),
};

fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../data/tour.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log('Đã ghi data/tour.json:', days.length, 'ngày,', places.length, 'địa điểm');
