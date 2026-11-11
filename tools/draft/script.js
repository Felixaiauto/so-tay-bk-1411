<script>
(function(){
"use strict";
var TMIN=-5,TMAX=16;

/* ---------- Dữ liệu tour: lấy từ file lịch trình của khách ---------- */
var DAYS=[
 {d:14,dow:"Thứ Bảy",lo:1,hi:15,wx:"Nắng",stops:[
  {s:"08:30",k:"move",title:"Hạ cánh Bắc Kinh"},
  {s:"09:00",e:"11:30",k:"move",title:"Nhập cảnh, di chuyển vào trung tâm"},
  {s:"11:45",e:"12:45",k:"meal",kind:"Ăn trưa",title:"Đô Nhất Xứ · thiêu mại",zh:"都一处烧麦馆",sub:"Thiêu mại tôm, thiêu mại thịt, bánh hấp · 前门大街38号 (Tiền Môn)",ph:"thieu-mai",phcap:"Thiêu mại. Ảnh minh họa món, không phải ảnh của quán."},
  {s:"13:15",e:"14:30",k:"sight",title:"Thiên Đàn",place:"thien-dan"},
  {s:"14:45",e:"15:15",k:"cafe",kind:"Cà phê",title:"Quán Đàn GUANTAN",zh:"观坛",sub:"Góc nhìn sang Thiên Đàn. Dự phòng: Soloist Coffee ở 杨梅竹斜街"},
  {s:"15:30",e:"17:00",k:"sight",title:"Bảo tàng Lịch sử Tự nhiên",place:"bao-tang-tu-nhien",flag:"Nếu vé và giờ cho phép"},
  {s:"17:15",e:"19:30",k:"sight",title:"Phố Tiền Môn",place:"tien-mon"},
  {s:"17:45",e:"19:00",k:"meal",kind:"Ăn tối",title:"Tứ Quý Dân Phúc · vịt quay",zh:"四季民福烤鸭店",sub:"Vịt quay Bắc Kinh, rau xào, canh · chi nhánh Tiền Môn",flag:"Chưa chốt chi nhánh"},
  {s:"19:30",e:"20:00",k:"cafe",kind:"Cà phê",title:"Soloist Coffee",sub:"Tùy sức, có thể bỏ qua để về nghỉ sớm",ph:"ngo-duong-mai-truc",phcap:"Ngõ Dương Mai Trúc, nơi có quán."}
 ]},
 {d:15,dow:"Chủ Nhật",lo:2,hi:13,wx:"Có mây",stops:[
  {s:"07:45",e:"09:00",k:"move",title:"Xe đưa đi Universal"},
  {s:"09:00",e:"12:00",k:"sight",title:"Universal Bắc Kinh · buổi sáng",place:"universal",sub:"Chơi các trò đông khách trước"},
  {s:"12:00",e:"13:00",k:"meal",kind:"Ăn trưa",title:"Nhà hàng trong Universal",sub:"Cơm gà, mì, món hấp · chọn quán tại khu đang chơi"},
  {s:"13:00",e:"17:30",k:"sight",title:"Universal Bắc Kinh · buổi chiều",place:"universal",sub:"Tham quan, xem show, chơi tiếp"},
  {s:"17:30",e:"18:00",k:"cafe",kind:"Cà phê",title:"Quán đồ uống tại CityWalk",sub:"Chọn quán theo vị trí ra cổng"},
  {s:"18:00",e:"19:00",k:"meal",kind:"Ăn tối",title:"Bubba Gump Shrimp",zh:"阿甘虾餐厅",sub:"Tôm, hải sản, salad · 环球城市大道 (CityWalk)"},
  {s:"19:00",e:"20:15",k:"move",title:"Xe đưa về khách sạn"}
 ]},
 {d:16,dow:"Thứ Hai",lo:-2,hi:4,wx:"Rét đậm, sáng sớm có thể mưa tuyết",stops:[
  {s:"07:00",e:"09:00",k:"move",title:"Xe đưa đi Mộ Điền Dụ"},
  {s:"09:00",e:"11:45",k:"sight",title:"Vạn Lý Trường Thành · Mộ Điền Dụ",place:"mo-dien-du",sub:"Lên bằng cáp treo"},
  {s:"11:45",e:"12:30",k:"meal",kind:"Ăn trưa",title:"Hâm Song Tuyền · quán nông gia",zh:"鑫双泉农家院",sub:"Gà hầm, rau, canh · khu Hoài Nhu",flag:"Cần xác minh chi nhánh"},
  {s:"12:30",e:"14:45",k:"move",title:"Xe về lại thành phố"},
  {s:"14:45",e:"16:30",k:"sight",title:"Di Hòa Viên",place:"di-hoa-vien",sub:"Khu ngoài trời"},
  {s:"16:30",e:"17:00",k:"cafe",kind:"Cà phê",title:"Cà phê gần Tây Uyển",sub:"Nếu kịp giờ",flag:"Chưa chốt quán"},
  {s:"17:30",e:"19:00",k:"meal",kind:"Ăn tối",title:"Nhà hàng khu Tây Uyển",sub:"Mì bò, rau, món hấp",flag:"Chưa chốt quán"}
 ]},
 {d:17,dow:"Thứ Ba",lo:-4,hi:10,wx:"Nắng",stops:[
  {s:"08:30",e:"11:15",k:"sight",title:"Cố Cung",place:"co-cung"},
  {s:"11:15",e:"11:45",k:"cafe",kind:"Cà phê",title:"Cà phê Giác Lâu",zh:"故宫角楼咖啡",sub:"Cà phê chủ đề Cố Cung, có thể phải xếp hàng"},
  {s:"11:45",e:"12:30",k:"meal",kind:"Ăn trưa",title:"Phúc Vinh Ký",zh:"福荣记",sub:"Dimsum, bánh cuốn, món hấp · 宝钞胡同63号",flag:"Cần xác minh địa chỉ",ph:"dimsum",phcap:"Dimsum. Ảnh minh họa món, không phải ảnh của quán."},
  {s:"12:30",e:"13:15",k:"sight",title:"Công viên Cảnh Sơn",place:"canh-son"},
  {s:"13:15",e:"14:15",k:"move",title:"Di chuyển lên khu Olympic"},
  {s:"14:15",e:"16:15",k:"sight",title:"Bảo tàng Khoa học",place:"bao-tang-khoa-hoc",flag:"Kiểm tra ngày mở cửa"},
  {s:"16:30",e:"17:15",k:"sight",title:"Khu Olympic",place:"khu-olympic"},
  {s:"17:30",e:"19:00",k:"meal",kind:"Ăn tối",title:"Kim Đỉnh Hiên",zh:"金鼎轩",sub:"Há cảo, sườn hấp, cháo, rau · khu Bắc Thần",flag:"Chưa chốt chi nhánh",ph:"dimsum",phcap:"Dimsum. Ảnh minh họa món, không phải ảnh của quán."}
 ]},
 {d:18,dow:"Thứ Tư",lo:-2,hi:8,wx:"Nắng",stops:[
  {s:"08:30",e:"10:00",k:"sight",title:"Bảo tàng Lịch sử Tự nhiên",place:"bao-tang-tu-nhien",flag:"Nếu ngày 14 chưa đi"},
  {s:"10:15",e:"11:15",k:"sight",title:"Dạo khu trung tâm, mua quà",place:"tien-mon"},
  {s:"11:30",e:"12:45",k:"meal",kind:"Ăn trưa",title:"Đô Nhất Xứ · thiêu mại",zh:"都一处烧麦馆",sub:"Thiêu mại, món hấp, canh · 前门大街38号",ph:"thieu-mai",phcap:"Thiêu mại. Ảnh minh họa món, không phải ảnh của quán."},
  {s:"13:00",e:"14:00",k:"cafe",kind:"Cà phê",title:"Soloist Coffee Co.",sub:"Ngõ 杨梅竹斜街. Dự phòng: quán gần Tiền Môn, ngồi tới 15:00",ph:"ngo-duong-mai-truc",phcap:"Ngõ Dương Mai Trúc, nơi có quán."},
  {s:"15:00",e:"16:00",k:"move",title:"Lên xe ra sân bay",sub:"Sân bay PEK hoặc PKX tùy vé"},
  {s:"17:30",e:"18:15",k:"meal",kind:"Ăn nhẹ",title:"Ăn nhẹ tại sân bay",sub:"Mì, cơm gà, bánh bao"},
  {s:"20:30",k:"move",title:"Bay về Việt Nam"}
 ]}
];

var PLACES=[
 {id:"thien-dan",name:"Thiên Đàn",zh:"天坛",when:"14/11 · 13:15–14:30",dur:"75 phút",ticket:"10–28 tệ",req:"Mua vé",buy:"WeChat 天坛公园 hoặc quầy vé",
  tag:"Đàn tế trời của hoàng đế Minh, Thanh",
  story:["Thiên Đàn xây năm 1420 dưới thời Vĩnh Lạc, cùng đợt với Cố Cung. Mỗi năm vào ngày đông chí, hoàng đế rời cung ra đây tế trời và cầu mùa màng. Dân thường không được bước vào cho tới năm 1918.",
   "Công trình chính là Kỳ Niên Điện: tòa điện tròn ba tầng mái ngói lam, cao 38 mét, dựng bằng gỗ ghép mộng. 28 cây cột bên trong có ý nghĩa riêng: 4 cột giữa là bốn mùa, 12 cột vòng trong là 12 tháng, 12 cột vòng ngoài là 12 canh giờ. Tòa điện hiện nay được dựng lại cuối thế kỷ 19 sau một trận sét đánh.",
   "Hình tròn tượng trưng cho trời, hình vuông cho đất. Vì vậy tường phía bắc của khuôn viên uốn cong, tường phía nam vuông góc."],
  route:["Vào cổng Đông (东门), đi dọc Trường Lang 72 gian, nơi người già Bắc Kinh ngồi đánh bài và hát.",
   "Tới Kỳ Niên Điện (祈年殿), đi một vòng quanh nền đá ba tầng. 25–30 phút.",
   "Đi theo Đan Bệ Kiều, con đường lát đá cao dài 360 mét, về phía nam.",
   "Hoàng Khung Vũ và Hồi Âm Bích: bức tường tròn truyền tiếng nói từ đầu này sang đầu kia.",
   "Hoàn Khâu: đàn tế lộ thiên ba tầng, số phiến đá mỗi vòng đều là bội số của 9. Ra cổng Nam."],
  photo:["Đứng chính giữa bậc thềm phía nam Kỳ Niên Điện để lấy trọn ba tầng mái. Giờ đoàn tới, nắng chiếu đúng mặt chính.",
   "Lùi sang góc đông nam hoặc tây nam của sân để tránh dòng người ở trục giữa.",
   "Đan Bệ Kiều cho ảnh đối xứng có hàng bách cổ thụ hai bên."],
  wear:"Mái ngói lam và trời xanh làm nền, nên áo khoác đỏ, trắng kem hoặc be sẽ nổi nhất. Tránh xanh dương vì dễ chìm vào nền.",
  notes:["Khu công viên mở tới tối, nhưng các điện chính đóng lúc 17:00 và ngừng bán vé sớm hơn khoảng một tiếng.","Chốt với tài xế cổng đón trước khi vào, vì cổng Đông và cổng Nam cách nhau khá xa."]},
 {id:"bao-tang-tu-nhien",name:"Bảo tàng Lịch sử Tự nhiên",zh:"国家自然博物馆",when:"14/11 · 15:30–17:00 (hoặc 18/11 · 08:30–10:00)",dur:"90 phút",ticket:"Miễn phí khu thường",req:"Phải đặt lịch",buy:"Trang chính thức hoặc WeChat 国家自然博物馆, đặt trước 1–3 ngày",
  tag:"Khủng long và hóa thạch, ngay cạnh Thiên Đàn",
  story:["Đây là bảo tàng tự nhiên cấp quốc gia của Trung Quốc, tiền thân thành lập năm 1951 và mang tên hiện nay từ năm 2023. Bảo tàng nằm sát cổng Tây của Thiên Đàn nên rất tiện ghép chung một buổi.",
   "Phần được xem nhiều nhất là sảnh bò sát cổ, với bộ xương khủng long Mã Môn Khê dài hơn 20 mét cùng các hóa thạch tìm thấy ở Trung Quốc. Các tầng còn lại kể về động vật, thực vật và nguồn gốc loài người."],
  route:["Qua cổng soát vé bằng hộ chiếu, đúng khung giờ đã đặt.",
   "Đi thẳng tới sảnh bò sát cổ xem khủng long trước khi đông. 30–40 phút.",
   "Xem tiếp sảnh động vật và sảnh nguồn gốc loài người.",
   "Còn giờ thì ghé sảnh thực vật trước khi ra."],
  photo:["Lùi ra xa để chụp trọn chiều dài bộ xương khủng long.","Trong nhà ánh sáng yếu, nên giữ máy chắc tay và không bật đèn flash."],
  wear:"Trong bảo tàng sưởi ấm. Mặc nhiều lớp mỏng để cởi áo khoác cầm tay.",
  notes:["Đóng cửa thứ Hai. Mở 9:00–17:00, ngừng nhận khách lúc 16:30.","Đặt chỗ theo tên thật và khung giờ, mỗi khách một suất gắn với số hộ chiếu."]},
 {id:"tien-mon",name:"Phố Tiền Môn",zh:"前门大街",when:"14/11 · 17:15–19:30 và 18/11 · 10:15–15:00",dur:"Tự do",ticket:"Miễn phí",req:"Không cần mua vé",buy:"—",
  tag:"Phố đi bộ cổ ngay phía nam Thiên An Môn",
  story:["Tiền Môn là tên dân gian của Chính Dương Môn, cổng chính phía nam của nội thành Bắc Kinh, xây năm 1419. Con phố chạy từ cổng về phía nam từng là khu buôn bán sầm uất nhất kinh thành, vì quan lại và thương nhân vào thành đều qua đây.",
   "Nhiều cửa hiệu trên phố có tuổi đời vài trăm năm. Quán thiêu mại Đô Nhất Xứ mở năm 1738, tương truyền được vua Càn Long ban tên. Tiệm thuốc Đồng Nhân Đường có từ năm 1669.",
   "Rẽ vào các ngõ nhỏ như Đại Sách Lan và Dương Mai Trúc Tà Nhai sẽ thấy không khí khác hẳn: nhà thấp, quán cà phê nhỏ và tiệm sách."],
  route:["Bắt đầu từ lầu Tiễn Lâu ở đầu phố phía bắc, đi dọc phố đi bộ về phía nam.",
   "Rẽ phải vào Đại Sách Lan (大栅栏) xem các tiệm lâu đời.",
   "Đi tiếp vào ngõ Dương Mai Trúc (杨梅竹斜街), nơi có Soloist Coffee.",
   "Quay lại phố chính để ăn tối. Cả vòng khoảng 1,5 km."],
  photo:["Lầu Tiễn Lâu lên đèn sau 17:00, chụp từ giữa phố đi bộ nhìn về phía bắc.","Cổng bài lâu năm gian sơn màu ở đầu phố.","Ngõ Dương Mai Trúc buổi chiều có nắng xiên qua tường gạch xám."],
  wear:"Tối 14/11 nhiệt độ xuống gần 1°C. Cần áo khoác dày, khăn và găng tay khi dạo phố.",
  notes:["Quà dễ mua: bánh kẹo truyền thống, trà, giày vải. Giá ở phố chính cao hơn trong ngõ."]},
 {id:"universal",name:"Universal Bắc Kinh",zh:"北京环球影城",when:"15/11 · 09:00–17:30",dur:"Cả ngày",ticket:"Từ 350 tệ, tùy ngày",req:"Mua trước",buy:"Ứng dụng hoặc trang chính thức của Universal Beijing Resort",
  tag:"Công viên chủ đề, bảy khu trò chơi",
  story:["Universal Bắc Kinh mở cửa tháng 9 năm 2021 ở quận Thông Châu, phía đông thành phố. Công viên có bảy khu chủ đề, trong đó khu Kung Fu Panda là khu đầu tiên trên thế giới và nằm hoàn toàn trong nhà.",
   "Bên ngoài cổng là phố CityWalk, vào tự do không cần vé, tập trung nhà hàng và cửa hàng lưu niệm."],
  route:["Tới cổng trước giờ mở, qua soát vé bằng hộ chiếu.",
   "Buổi sáng đi các trò đông nhất trước: khu Harry Potter, rồi tàu lượn ở khu Transformers.",
   "Giữa trưa vào khu Kung Fu Panda trong nhà để ăn và sưởi ấm.",
   "Buổi chiều: khu Jurassic World, khu Minions, xem show.",
   "17:30 ra CityWalk uống nước và ăn tối."],
  photo:["Quả địa cầu Universal ở lối vào, chụp sớm khi chưa đông.","Lâu đài Hogwarts nhìn từ lối vào làng Hogsmeade.","Mái nhà phủ tuyết giả ở làng Hogsmeade hợp với trời mùa đông."],
  wear:"Đi bộ cả ngày ngoài trời ở 2–13°C. Mang giày thể thao êm, áo khoác có túi kéo khóa và túi đeo chéo nhỏ gọn để gửi đồ nhanh khi chơi.",
  notes:["Ngày 15/11 là Chủ Nhật nên sẽ đông. Xem thời gian chờ từng trò trên ứng dụng của công viên.","Giờ mở và đóng cửa thay đổi theo ngày, xem trên ứng dụng tối hôm trước."]},
 {id:"mo-dien-du",name:"Vạn Lý Trường Thành · Mộ Điền Dụ",zh:"慕田峪长城",when:"16/11 · 09:00–11:45",dur:"2 giờ 45 phút",ticket:"45 tệ vé cổng (xe trung chuyển và cáp treo tính riêng)",req:"Mua trước",buy:"Mua online hoặc tại quầy bằng hộ chiếu",
  tag:"Đoạn trường thành đá hoa cương giữa rừng núi Hoài Nhu",
  story:["Mộ Điền Dụ cách trung tâm Bắc Kinh khoảng 70 km về phía đông bắc. Đoạn thành hiện nay được xây lại đầu thời Minh, từ năm 1368, trên nền thành cũ từ thế kỷ 6, rồi được gia cố thêm vào thế kỷ 16.",
   "Điểm khác các đoạn thành khác là tường chắn có lỗ châu mai ở cả hai mặt, nên lính có thể đánh trả từ cả hai phía. Phần mở cho khách dài hơn 2 km với hơn 20 vọng lâu, và ít người hơn nhiều so với Bát Đạt Lĩnh."],
  route:["Từ bãi xe đi bộ tới trạm, lên xe trung chuyển khoảng 7 phút.",
   "Lên cáp treo ở cổng Bắc, khoảng 10 phút là tới vọng lâu số 14.",
   "Đi về phía tây qua các vọng lâu 15, 16, 17. Đoạn này thoải và cảnh mở rộng nhất.",
   "Còn sức thì đi tiếp tới vọng lâu 20, đoạn cuối rất dốc. Cả đi và về mất 60–90 phút.",
   "Quay lại vọng lâu 14 trước 11:15 để kịp cáp treo xuống."],
  photo:["Từ vọng lâu 15–16 nhìn ngược về phía đông: tường thành uốn theo sống núi.","Chụp qua khung cửa vòm của vọng lâu để có khung ảnh tự nhiên.","Nếu sáng có tuyết, mặt thành trắng nổi rõ trên nền núi xám."],
  wear:"Tường đá xám và núi mùa đông trơ cành, nên màu đỏ, vàng mù tạt hoặc cam sẽ nổi bật. Bắt buộc có áo chắn gió, mũ len, găng tay và giày đế bám. Không đi giày cao gót hoặc đế trơn.",
  notes:["Trên thành gió mạnh, cảm giác lạnh hơn nhiệt độ thực vài độ. Dự báo −2 đến 4°C.","Sáng sớm có thể mưa tuyết, bậc đá trơn. Bám tay vịn khi xuống dốc.","Từ 16/11 khu này chuyển sang giờ mùa thấp điểm, mở khoảng 8:00–17:30.","Xe trung chuyển khoảng 15 tệ, cáp treo khứ hồi khoảng 140 tệ."]},
 {id:"di-hoa-vien",name:"Di Hòa Viên",zh:"颐和园",when:"16/11 · 14:45–16:30",dur:"1 giờ 45 phút",ticket:"20 tệ vé cổng; 50 tệ vé liên thông",req:"Mua vé",buy:"WeChat 颐和园 hoặc quầy vé",
  tag:"Vườn ngự uyển mùa hè của nhà Thanh",
  story:["Vua Càn Long cho xây khu vườn này năm 1750 để mừng thọ mẹ. Năm 1860 liên quân Anh Pháp đốt phá gần hết. Từ Hy Thái hậu cho dựng lại năm 1888, tương truyền bằng tiền dành cho hải quân, và đặt tên là Di Hòa Viên.",
   "Ba phần tư diện tích là mặt nước hồ Côn Minh. Trên bờ bắc là núi Vạn Thọ với Phật Hương Các. Dọc bờ hồ có Trường Lang dài 728 mét, xà ngang vẽ hàng nghìn bức tranh không bức nào giống nhau."],
  route:["Vào Đông Cung Môn (东宫门), qua điện Nhân Thọ nơi Từ Hy thiết triều.",
   "Ra bờ hồ Côn Minh, đi Trường Lang tới chân Phật Hương Các. 35–40 phút.",
   "Quay lại theo bờ hồ về phía nam, qua tượng Trâu Đồng.",
   "Tới cầu Thập Thất Khổng (cầu 17 nhịp) khoảng 16:00, lúc nắng chiều vàng nhất.",
   "Ra cổng Tân Kiến Cung Môn (新建宫门) ngay gần cầu."],
  photo:["Cầu 17 nhịp chụp từ bờ đông, nắng chiều chiếu ngang thân cầu.","Phật Hương Các nhìn qua mặt hồ từ bờ phía đông.","Trường Lang cho ảnh phối cảnh sâu, đứng lệch một bên để thấy hàng cột chạy dài."],
  wear:"Nắng chiều thấp và ấm màu, hợp áo khoác đỏ đô, be hoặc lạc đà. Gió từ hồ thổi rất lạnh, cần khăn quàng và găng tay.",
  notes:["Mặt trời lặn khoảng 17:00. Sau 16:30 trời tối nhanh và lạnh hẳn.","Vé cổng chỉ vào khu ngoài trời. Lên Phật Hương Các cần vé liên thông và các điện đóng sớm hơn cổng vườn.","Hẹn tài xế đón ở cổng Tân Kiến Cung Môn để khỏi quay lại cổng Đông."]},
 {id:"co-cung",name:"Cố Cung",zh:"故宫",when:"17/11 · 08:30–11:15",dur:"2 giờ 45 phút",ticket:"40 tệ",req:"Bắt buộc đặt trước",buy:"Trang chính thức của Bảo tàng Cố Cung hoặc tiểu chương trình WeChat, bằng số hộ chiếu",
  tag:"Tử Cấm Thành, nơi ở của 24 hoàng đế",
  story:["Cố Cung xây từ năm 1406 đến 1420 dưới thời Vĩnh Lạc. Trong gần 500 năm, 24 hoàng đế nhà Minh và nhà Thanh sống và trị vì ở đây, cho tới khi Phổ Nghi thoái vị năm 1912. Năm 1925 cung điện trở thành bảo tàng.",
   "Khu cung rộng khoảng 72 hecta, chia làm hai phần. Ngoại triều ở phía nam là nơi cử hành đại lễ, với ba tòa điện lớn trên nền đá trắng. Nội đình ở phía bắc là nơi vua và hậu cung sinh hoạt.",
   "Mọi thứ đều theo quy tắc: ngói vàng chỉ dành cho vua, cửa lớn đóng 9 hàng 9 đinh vàng, và số 9 lặp lại khắp nơi vì là con số lớn nhất của bậc đế vương."],
  route:["Vào từ Ngọ Môn (午门) ở phía nam. Đây là lối vào duy nhất, đi một chiều từ nam lên bắc.",
   "Qua cầu Kim Thủy và Thái Hòa Môn tới sân Thái Hòa Điện, tòa điện gỗ lớn nhất.",
   "Đi tiếp Trung Hòa Điện, Bảo Hòa Điện rồi qua Càn Thanh Môn vào nội đình.",
   "Còn giờ thì rẽ sang phía đông xem Cửu Long Bích và Trân Bảo Quán (vé riêng 10 tệ).",
   "Qua Ngự Hoa Viên, ra Thần Vũ Môn ở phía bắc. Cà phê Giác Lâu nằm ngay ngoài cổng, Cảnh Sơn ở bên kia đường."],
  photo:["Sân Thái Hòa Điện chụp từ bậc thềm Thái Hòa Môn, lúc 8:30–9:00 còn vắng.","Các lối đi tường đỏ hai bên ở phía đông nội đình ít người và rất ăn ảnh.","Giác Lâu (lầu góc) soi bóng xuống hào nước, chụp từ bên ngoài sau khi ra cổng bắc."],
  wear:"Tường đỏ và ngói vàng làm nền, nên trắng, kem, be hoặc đen sẽ nổi nhất. Áo đỏ dễ lẫn vào tường. Sáng sớm khoảng −3°C và sân đá rất rộng, cần áo dày, mũ, găng tay và miếng dán giữ nhiệt.",
  notes:["Không bán vé tại cổng. Vé mở bán trước 7 ngày, lúc 20:00 giờ Bắc Kinh, và gắn với số hộ chiếu.","Mang hộ chiếu gốc. Soát vé bằng chính hộ chiếu đã dùng để đặt.","Đóng cửa thứ Hai. Mùa đông mở 8:30–16:30, ngừng nhận khách lúc 15:30.","Hàng kiểm tra an ninh ở khu Thiên An Môn có thể mất 30–45 phút, nên có mặt từ 7:45."]},
 {id:"canh-son",name:"Công viên Cảnh Sơn",zh:"景山公园",when:"17/11 · 12:30–13:15",dur:"45 phút",ticket:"2 tệ",req:"Mua tại cổng",buy:"Quầy vé hoặc WeChat",
  tag:"Ngọn đồi nhìn xuống toàn bộ mái ngói Cố Cung",
  story:["Cảnh Sơn là đồi nhân tạo, đắp bằng đất đào hào quanh Cố Cung từ thời Vĩnh Lạc. Theo phong thủy, ngọn đồi chắn gió bắc và che chở cho hoàng cung.",
   "Năm 1644, khi quân khởi nghĩa tràn vào Bắc Kinh, vua Sùng Trinh, hoàng đế cuối cùng của nhà Minh, đã treo cổ ở sườn đông ngọn đồi này."],
  route:["Vào cổng Nam, đối diện Thần Vũ Môn của Cố Cung.",
   "Leo bậc đá lên Vạn Xuân Đình trên đỉnh, mất 10–15 phút.",
   "Đứng ở lan can phía nam nhìn xuống trục chính của Cố Cung.",
   "Xuống theo sườn đông nếu muốn xem nơi vua Sùng Trinh tự vẫn."],
  photo:["Toàn cảnh Cố Cung từ Vạn Xuân Đình. Buổi trưa nhìn về nam bị ngược sáng, nên chụp người đứng lệch sang bên và đo sáng theo mặt.","Nhìn về bắc thấy Cổ Lâu trên trục thành phố, hướng này thuận sáng."],
  wear:"Giữ nguyên trang phục ở Cố Cung. Leo dốc sẽ nóng người, mở bớt áo khoác khi leo và cài lại trên đỉnh vì gió.",
  notes:["Bậc đá dốc, người lớn tuổi nên đi chậm và nghỉ ở các đình giữa đường."]},
 {id:"bao-tang-khoa-hoc",name:"Bảo tàng Khoa học",zh:"中国科学技术馆",when:"17/11 · 14:15–16:15",dur:"2 giờ",ticket:"30 tệ khu chính",req:"Đặt trước",buy:"Trang chính thức hoặc WeChat 中国科学技术馆",
  tag:"Bảo tàng khoa học quốc gia, trong khu Olympic",
  story:["Bảo tàng Khoa học và Công nghệ Trung Quốc chuyển về tòa nhà hiện nay trong công viên Olympic năm 2009. Phần lớn hiện vật cho phép chạm và thử, nên hợp với gia đình có trẻ em.",
   "Tầng một kể về các phát minh cổ của Trung Quốc như la bàn, giấy và kỹ thuật in. Các tầng trên nói về vật lý, đời sống, và chương trình vũ trụ với mô hình tàu Thần Châu."],
  route:["Qua cổng bằng hộ chiếu và mã đặt vé.",
   "Tầng 1: sảnh Hoa Hạ chi quang về khoa học cổ đại. 30 phút.",
   "Tầng 2: khu Khám phá và phát hiện với các thí nghiệm vật lý tương tác.",
   "Tầng 4: khu hàng không vũ trụ. Ra cổng trước 16:15 để kịp đi bộ sang khu Olympic."],
  photo:["Sảnh giữa thông tầng với mô hình treo lơ lửng.","Khu vũ trụ có mô hình khoang tàu kích thước thật."],
  wear:"Trong nhà sưởi ấm, mặc nhiều lớp mỏng để cởi áo khoác.",
  notes:["Ngày 17/11 là thứ Ba. Bảo tàng có ngày nghỉ cố định trong tuần, cần xem lịch mở cửa trên kênh chính thức trước khi đặt vé.","Mở 9:30–17:00, ngừng nhận khách lúc 16:30.","Phải đặt vé online trước, bằng tên thật."]},
 {id:"khu-olympic",name:"Khu Olympic",zh:"奥林匹克公园",when:"17/11 · 16:30–17:15",dur:"45 phút",ticket:"Miễn phí (khu bên ngoài)",req:"Không cần mua vé",buy:"—",
  tag:"Tổ Chim và Khối Nước lúc lên đèn",
  story:["Đây là nơi tổ chức Thế vận hội mùa hè 2008 và lễ khai mạc Thế vận hội mùa đông 2022, khiến Bắc Kinh thành thành phố đầu tiên đăng cai cả hai kỳ.",
   "Sân vận động quốc gia được gọi là Tổ Chim vì bộ khung thép đan chéo. Bên cạnh là trung tâm bơi lội Khối Nước với lớp vỏ như bong bóng xà phòng. Khu này nằm trên phần kéo dài của trục chính Bắc Kinh, thẳng hàng với Cố Cung."],
  route:["Từ Bảo tàng Khoa học đi bộ về phía nam dọc quảng trường trung tâm, khoảng 15–20 phút.",
   "Dừng giữa hai công trình: Tổ Chim bên trái, Khối Nước bên phải.",
   "Chờ tới khoảng 17:00 khi đèn bật rồi ra điểm hẹn xe."],
  photo:["Đứng giữa quảng trường để lấy cả hai công trình trong một khung.","Mặt trời lặn khoảng 17:00. Mười lăm phút sau đó trời xanh đậm và đèn đã sáng, là lúc đẹp nhất."],
  wear:"Quảng trường trống và gió lùa mạnh. Cài kín áo, đội mũ và đeo găng tay.",
  notes:["Vào bên trong Tổ Chim hoặc Khối Nước cần mua vé riêng và không nằm trong lịch."]}
];

var PIMG={"thien-dan": ["thien-dan", "Kỳ Niên Điện, Thiên Đàn"], "bao-tang-tu-nhien": ["tu-nhien", "Hóa thạch khủng long trong Bảo tàng Lịch sử Tự nhiên"], "tien-mon": ["ngo-duong-mai-truc", "Ngõ Dương Mai Trúc, khu Tiền Môn"], "universal": ["universal", "Cổng vào Universal Bắc Kinh"], "mo-dien-du": ["mo-dien-du", "Trường Thành đoạn Mộ Điền Dụ"], "di-hoa-vien": ["di-hoa-vien", "Cầu Thập Thất Khổng, Di Hòa Viên"], "co-cung": ["co-cung", "Thái Hòa Điện, Cố Cung"], "canh-son": ["canh-son", "Cố Cung nhìn từ đỉnh Cảnh Sơn"], "bao-tang-khoa-hoc": ["khoa-hoc", "Sảnh chính Bảo tàng Khoa học"], "khu-olympic": ["olympic", "Tổ Chim và Khối Nước lúc lên đèn"]};
var CRED={"thien-dan": {"title": "Temple of Heaven - Hall of Prayer for Good Harvests 01.jpg", "artist": "xiquinhosilva", "lic": "CC BY 2.0", "page": "https://commons.wikimedia.org/wiki/File:Temple_of_Heaven_-_Hall_of_Prayer_for_Good_Harvests_01.jpg"}, "tu-nhien": {"title": "Psittacosaurus IMG 5151 Beijing Museum of Natural History.jpg", "artist": "Bjoertvedt", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Psittacosaurus_IMG_5151_Beijing_Museum_of_Natural_History.jpg"}, "ngo-duong-mai-truc": {"title": "Yangmeizhu Xiejie (20240210151543).jpg", "artist": "N509FZ", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Yangmeizhu_Xiejie_(20240210151543).jpg"}, "universal": {"title": "Entrance of Universal Studios Beijing (20210907121707).jpg", "artist": "N509FZ", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Entrance_of_Universal_Studios_Beijing_(20210907121707).jpg"}, "mo-dien-du": {"title": "The Mutianyu section of the Great Wall of China.jpg", "artist": "Lloyd Tudor", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:The_Mutianyu_section_of_the_Great_Wall_of_China.jpg"}, "di-hoa-vien": {"title": "Peking Sommerpalast Seventeen Arch Bridge-20071020-RM-123138.jpg", "artist": "Ermell", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Peking_Sommerpalast_Seventeen_Arch_Bridge-20071020-RM-123138.jpg"}, "co-cung": {"title": "Hall of Supreme Harmony (Forbidden City) 1.jpg", "artist": "EditQ", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Hall_of_Supreme_Harmony_(Forbidden_City)_1.jpg"}, "canh-son": {"title": "Views of the Forbidden City from Jingshan Park 3.jpg", "artist": "EditQ", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Views_of_the_Forbidden_City_from_Jingshan_Park_3.jpg"}, "khoa-hoc": {"title": "China Science and Technology Museum main hall 14 Aug 2010.jpg", "artist": "Jason Quinn", "lic": "CC BY 3.0", "page": "https://commons.wikimedia.org/wiki/File:China_Science_and_Technology_Museum_main_hall_14_Aug_2010.jpg"}, "olympic": {"title": "Water Cube (red dots version) & Bird's Nest.jpg", "artist": "Alberto Alerigi", "lic": "CC BY 2.0", "page": "https://commons.wikimedia.org/wiki/File:Water_Cube_(red_dots_version)_%26_Bird%27s_Nest.jpg"}, "thieu-mai": {"title": "Shaomai stuffed with three delicacies (20180331174303).jpg", "artist": "N509FZ", "lic": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Shaomai_stuffed_with_three_delicacies_(20180331174303).jpg"}, "dimsum": {"title": "Dim sum at Shi-Art Chinese Cuisine.jpg", "artist": "StoppedTime", "lic": "CC0", "page": "https://commons.wikimedia.org/wiki/File:Dim_sum_at_Shi-Art_Chinese_Cuisine.jpg"}};
var CHECKS=["Hộ chiếu còn hạn trên 6 tháng và visa Trung Quốc","Ảnh chụp trang hộ chiếu và visa lưu trong điện thoại","Alipay hoặc WeChat Pay đã liên kết thẻ quốc tế, thử trước khi đi","Một ít tiền mặt nhân dân tệ, mệnh giá nhỏ","Áo khoác dày chắn gió và áo giữ nhiệt mặc trong","Mũ len, găng tay, khăn quàng","Giày đế bám, đã đi quen chân","Miếng dán giữ nhiệt cho ngày 16 và 17","Kem dưỡng ẩm, son dưỡng: trời rất khô","Ổ cắm chuyển đổi đa năng (điện 220V)","Sạc dự phòng có ghi rõ dung lượng, để trong hành lý xách tay","Thuốc cá nhân đủ dùng 5 ngày","Bình giữ nhiệt nhỏ"];

var TICKETS=[["14/11","Thiên Đàn","天坛","10–28 tệ","Mua vé","WeChat 天坛公园 hoặc quầy vé",""],
 ["15/11","Universal Studios","北京环球影城","Từ 350 tệ, tùy ngày","Mua trước","","warn"],
 ["16/11","Trường Thành Mộ Điền Dụ","慕田峪长城","45 tệ vé cổng","Mua trước","","warn"],
 ["16/11","Di Hòa Viên","颐和园","20 tệ vé cổng; 50 tệ vé liên thông","Mua vé","WeChat 颐和园 hoặc quầy vé",""],
 ["17/11","Cố Cung","故宫","40 tệ","Bắt buộc đặt trước","","wall"],
 ["17/11","Cảnh Sơn","景山公园","2 tệ","Mua tại cổng","Quầy vé hoặc WeChat","ok"],
 ["17/11","Bảo tàng Khoa học","中国科学技术馆","30 tệ khu chính","Đặt trước","","warn"],
 ["18/11","Bảo tàng Lịch sử Tự nhiên","国家自然博物馆","Miễn phí khu thường","Phải đặt lịch","","wall"],
 ["14–18/11","Tiền Môn, Thập Sát Hải, khu Olympic bên ngoài","","Miễn phí","Không cần mua vé","","ok"]];

/* ---------- Tiện ích ---------- */
var $=function(id){return document.getElementById(id)};
function pad(n){return n<10?"0"+n:""+n}
function mins(t){var p=t.split(":");return +p[0]*60+ +p[1]}
function bjNow(){var u=new Date(Date.now()+8*3600e3);return {y:u.getUTCFullYear(),m:u.getUTCMonth()+1,d:u.getUTCDate(),min:u.getUTCHours()*60+u.getUTCMinutes()}}
function dayIndexNow(){var n=bjNow();if(n.y!==2026||n.m!==11)return n.y<2026||(n.y===2026&&n.m<11)?-1:99;if(n.d<14)return -1;if(n.d>18)return 99;return n.d-14}
function placeById(id){for(var i=0;i<PLACES.length;i++)if(PLACES[i].id===id)return PLACES[i];return null}
function pic(k,alt){return '<img class="ph" src="img/'+k+'.jpg" width="900" height="600" alt="'+(alt||"")+'">'}
function pct(v){return ((v-TMIN)/(TMAX-TMIN)*100).toFixed(1)}
function tbar(lo,hi){return '<span class="trange" role="img" aria-label="Từ '+lo+' đến '+hi+' độ C"><i style="left:'+pct(lo)+'%;width:'+(pct(hi)-pct(lo)).toFixed(1)+'%"></i><em style="left:'+pct(0)+'%"></em></span>'}
function deg(lo,hi){return (lo<0?"−"+(-lo):lo)+" đến "+hi+"°C"}

var curDay=Math.max(0,Math.min(4,dayIndexNow()===99?4:dayIndexNow()));
if(dayIndexNow()<0)curDay=0;

/* ---------- Thẻ "tiếp theo" ---------- */
function renderNext(){
  var di=dayIndexNow(),n=bjNow(),el=$("nextCard"),h;
  if(di<0){
    var left=Math.ceil((Date.UTC(2026,10,14)-Date.UTC(n.y,n.m-1,n.d))/864e5);
    h='<span class="lab">Còn '+left+' ngày nữa khởi hành</span><span class="what">08:30 thứ Bảy 14/11 · hạ cánh Bắc Kinh</span><span class="when">Bữa đầu tiên: thiêu mại Đô Nhất Xứ ở Tiền Môn lúc 11:45</span>';
  }else if(di===99){
    h='<span class="lab">Chuyến đi đã kết thúc</span><span class="what">Cảm ơn bạn đã đi cùng đoàn</span><span class="when">Mời bạn để lại đánh giá ở mục Sau tour</span>';
  }else{
    var st=DAYS[di].stops,cur=null,nx=null;
    for(var i=0;i<st.length;i++){var a=mins(st[i].s),b=st[i].e?mins(st[i].e):a+20;if(n.min>=a&&n.min<b&&!cur)cur=st[i];if(a>n.min&&!nx)nx=st[i]}
    if(cur)h='<span class="lab">Đang diễn ra · ngày '+DAYS[di].d+'/11</span><span class="what">'+cur.title+'</span><span class="when">'+cur.s+(cur.e?"–"+cur.e:"")+(nx?" · tiếp theo "+nx.s+" "+nx.title:"")+'</span>';
    else if(nx)h='<span class="lab">Tiếp theo · ngày '+DAYS[di].d+'/11</span><span class="what">'+nx.s+' · '+nx.title+'</span><span class="when">Giờ Bắc Kinh, nhanh hơn Việt Nam 1 tiếng</span>';
    else h='<span class="lab">Hết lịch hôm nay</span><span class="what">Nghỉ ngơi, giữ ấm</span><span class="when">'+(di<4?"Ngày mai bắt đầu lúc "+DAYS[di+1].stops[0].s:"Chúc bạn bay về an toàn")+'</span>';
  }
  el.innerHTML=h;
}

/* ---------- Lịch trình ---------- */
function renderItin(){
  var di=dayIndexNow(),n=bjNow(),D=DAYS[curDay],h='<h2 class="vh">Lịch trình</h2><div class="days" role="tablist" aria-label="Chọn ngày">';
  DAYS.forEach(function(x,i){h+='<button class="day" role="tab" type="button" data-i="'+i+'" aria-selected="'+(i===curDay)+'"><b>'+x.d+'</b><span>'+x.dow.replace("Thứ ","T.").replace("Chủ Nhật","CN").replace("T.Bảy","T.7").replace("T.Hai","T.2").replace("T.Ba","T.3").replace("T.Tư","T.4")+'</span></button>'});
  h+='</div><div class="dayhead"><p class="d">Ngày '+(curDay+1)+' · '+D.dow+' '+D.d+'/11</p><div class="wx"><b>'+deg(D.lo,D.hi)+'</b>'+tbar(D.lo,D.hi)+'</div><p class="sub">'+D.wx+'. Vạch mảnh trên thanh là mốc 0°C.</p></div><div class="rail">';
  var seen={};
  D.stops.forEach(function(s){
    var a=mins(s.s),b=s.e?mins(s.e):a+20,st="";
    if(di===curDay){if(n.min>=b)st=" past";else if(n.min>=a)st=" now"}else if(di>curDay)st=" past";
    var p=s.place?placeById(s.place):null;
    h+='<div class="stop '+(s.k==="move"?"move":"")+st+'"><div class="t">'+s.s+(s.e?'<small>'+s.e+'</small>':'')+'</div><div class="b">';
    if(s.kind)h+='<span class="kind">'+s.kind+'</span>';
    h+='<h3>'+s.title+'</h3>';
    if(s.zh)h+='<span class="zhname" lang="zh">'+s.zh+'</span>';
    if(s.sub)h+='<p>'+s.sub+'</p>';
    var pk=s.ph,pc=s.phcap||"";
    if(!pk&&p&&PIMG[p.id]&&!seen[p.id]){pk=PIMG[p.id][0];pc=PIMG[p.id][1];seen[p.id]=1}
    if(pk)h+=pic(pk,pc)+(pc?'<span class="phcap">'+pc+'</span>':'');
    var r="";
    if(s.flag)r+='<span class="pill warn">'+s.flag+'</span>';
    if(p)r+='<a class="lnk" href="#dd-'+p.id+'">Xem địa điểm này</a>';
    if(r)h+='<div class="row">'+r+'</div>';
    h+='</div></div>';
  });
  h+='</div>';
  $("v-lich-trinh").innerHTML=h;
}

/* ---------- Địa điểm ---------- */
function renderPlaces(){
  var h='<h2 class="vh">Địa điểm</h2><p class="sub">Câu chuyện, lối tự tham quan, góc chụp, dáng đứng và trang phục cho từng nơi trong lịch.</p>'+poseLib()+'<div class="plist">';
  PLACES.forEach(function(p,i){h+='<a class="pl" href="#dd-'+p.id+'"><img src="img/'+PIMG[p.id][0]+'.jpg" width="88" height="88" alt=""><span><h3>'+p.name+' <span class="han" lang="zh" style="color:var(--wall);font-weight:600">'+p.zh+'</span></h3><p>'+p.when+'</p><p>'+p.tag+'</p></span><span class="go" aria-hidden="true">›</span></a>'});
  $("v-dia-diem").innerHTML=h+'</div>';
}
function li(a){return a.map(function(x){return '<li>'+x+'</li>'}).join("")}
function renderPlace(p){
  var h='<a class="lnk back" href="#dia-diem">‹ Tất cả địa điểm</a><h2 class="vh">'+p.name+'</h2><p class="sub">'+p.tag+'</p>'
  +'<figure class="hero">'+pic(PIMG[p.id][0],PIMG[p.id][1])+'<figcaption class="phcap">'+PIMG[p.id][1]+'</figcaption></figure>'
  +'<div class="showcard"><span class="big" lang="zh">'+p.zh+'</span><span class="cap">Đưa màn hình này cho tài xế hoặc người địa phương khi cần hỏi đường.</span></div>'
  +'<div class="facts"><div class="fact"><span>Trong lịch</span><b>'+p.when+'</b></div><div class="fact"><span>Thời gian ở lại</span><b>'+p.dur+'</b></div><div class="fact"><span>Vé mỗi người (tham khảo)</span><b>'+p.ticket+'</b></div><div class="fact"><span>Cách mua</span><b>'+p.req+'</b></div></div>'
  +(p.buy&&p.buy!=="—"?'<p class="sub">Nơi mua vé: '+p.buy+'</p>':'')
  +'<div class="sec"><h3>Câu chuyện</h3>'+p.story.map(function(x){return '<p>'+x+'</p>'}).join("")+'</div>'
  +'<div class="sec"><h3>Tự tham quan</h3><ol>'+li(p.route)+'</ol></div>'
  +'<div class="sec photo"><h3>Góc chụp và dáng đứng</h3>'+shotsHtml(p.id)+'<span class="eyebrow">Mẹo thêm</span><ul>'+li(p.photo)+'</ul></div>'
  +'<div class="sec"><h3>Mặc gì lên hình</h3><p>'+p.wear+'</p></div>'
  +'<div class="sec"><h3>Lưu ý</h3>'+p.notes.map(function(x){return '<p class="note">'+x+'</p>'}).join("")+'</div>';
  $("v-place").innerHTML=h;
}

/* ---------- Góc chụp và dáng đứng ---------- */
var POSE={dung:["dung","Đứng nghiêng 45°, tay đút túi"],quaylung:["dung","Quay lưng ngắm cảnh"],buoc:["buoc","Bước đi tự nhiên"],ngoai:["buoc","Bước đi, ngoái đầu qua vai"],giotay:["giotay","Một tay giơ cao hoặc chạm vật"],dangtay:["dangtay","Dang rộng hai tay"],ngoi:["ngoi","Ngồi bậc thềm, một chân duỗi"],tua:["tua","Tựa nhẹ vào lan can hoặc tường"],nhom:["nhom","Cả nhóm đứng so le"]};
var FIG={
 dung:"M20 17L20 46M20 23L12 40M20 23L28 40M20 46L15 77M20 46L25 77",
 buoc:"M20 17L21 46M20 23L11 37M20 23L30 39M21 46L11 76M21 46L31 75",
 giotay:"M20 17L20 46M20 23L32 7M20 23L12 40M20 46L15 77M20 46L25 77",
 dangtay:"M20 17L20 46M20 24L3 13M20 24L37 13M20 46L12 77M20 46L28 77",
 ngoi:"M18 17L18 44M18 24L29 38M18 44L33 46L33 70",
 tua:"M17 17L22 46M18 24L33 31M22 46L17 77M22 46L31 76"};
var PROP={ngoi:"M4 50L24 50L24 77",tua:"M30 32L40 32M36 32L36 77"};
function fig(pose,cx,base,h){
  if(pose==="nhom")return fig("dung",cx-h*0.36,base,h*0.9)+fig("giotay",cx,base,h)+fig("dung",cx+h*0.33,base,h*0.62);
  var s=h/80,hx=pose==="ngoi"?18:(pose==="tua"?17:20);
  return '<g transform="translate('+(cx-20*s).toFixed(1)+','+(base-78*s).toFixed(1)+') scale('+s.toFixed(3)+')" fill="none" stroke-linecap="round" stroke-linejoin="round">'
   +(PROP[pose]?'<path d="'+PROP[pose]+'" stroke="var(--muted)" stroke-width="3"/>':'')
   +'<path d="'+FIG[pose]+'" stroke="var(--ink)" stroke-width="5"/><circle cx="'+hx+'" cy="9" r="7" fill="var(--ink)"/></g>';
}
function n1(v){return v.toFixed(1)}
var LM={
 thap:function(x,y,w,h){var c=x+w/2,o="";for(var i=0;i<3;i++){var ty=y+h*(0.6-0.19*i),tw=w*(0.92-0.2*i),th=h*0.15;o+='<path d="M'+n1(c-tw/2)+' '+n1(ty+th)+'Q'+n1(c)+' '+n1(ty-th*0.7)+' '+n1(c+tw/2)+' '+n1(ty+th)+'Z"/>'}
   return o+'<circle cx="'+n1(c)+'" cy="'+n1(y+h*0.12)+'" r="'+n1(w*0.04)+'"/><rect x="'+n1(x+w*0.22)+'" y="'+n1(y+h*0.75)+'" width="'+n1(w*0.56)+'" height="'+n1(h*0.1)+'"/><path d="M'+n1(x+w*0.06)+' '+n1(y+h*0.9)+'H'+n1(x+w*0.94)+'M'+n1(x)+' '+n1(y+h)+'H'+n1(x+w)+'"/>'},
 dien:function(x,y,w,h){return '<path d="M'+n1(x)+' '+n1(y+h*0.46)+'Q'+n1(x+w*0.12)+' '+n1(y+h*0.4)+' '+n1(x+w*0.22)+' '+n1(y+h*0.1)+'H'+n1(x+w*0.78)+'Q'+n1(x+w*0.88)+' '+n1(y+h*0.4)+' '+n1(x+w)+' '+n1(y+h*0.46)+'Z"/><rect x="'+n1(x+w*0.12)+'" y="'+n1(y+h*0.46)+'" width="'+n1(w*0.76)+'" height="'+n1(h*0.34)+'"/><rect x="'+n1(x+w*0.02)+'" y="'+n1(y+h*0.8)+'" width="'+n1(w*0.96)+'" height="'+n1(h*0.2)+'"/>'},
 tuong:function(x,y,w,h){var p=[[0,.85],[.28,.58],[.5,.72],[.8,.25],[1,.36]],d="",o="";p.forEach(function(q,i){d+=(i?"L":"M")+n1(x+w*q[0])+" "+n1(y+h*q[1])});[1,3].forEach(function(i){o+='<rect x="'+n1(x+w*p[i][0]-5)+'" y="'+n1(y+h*p[i][1]-10)+'" width="10" height="10"/>'});return '<path d="'+d+'" fill="none" stroke-width="5"/>'+o},
 cau:function(x,y,w,h){var yb=y+h*0.75,o='<path d="M'+n1(x)+' '+n1(yb)+'Q'+n1(x+w/2)+' '+n1(y+h*0.05)+' '+n1(x+w)+' '+n1(yb)+'Z"/>';for(var i=0;i<7;i++){var c=x+w*(0.14+0.12*i),r=w*0.045;o+='<path d="M'+n1(c-r)+' '+n1(yb)+'A'+n1(r)+' '+n1(r)+' 0 0 1 '+n1(c+r)+' '+n1(yb)+'" fill="var(--surface)"/>'}return o+'<path d="M'+n1(x-4)+' '+n1(yb)+'H'+n1(x+w+4)+'"/>'},
 pho:function(x,y,w,h){var o='<path fill="none" d="M'+n1(x)+' '+n1(y+h)+'L'+n1(x+w*0.43)+' '+n1(y+h*0.3)+'M'+n1(x+w)+' '+n1(y+h)+'L'+n1(x+w*0.57)+' '+n1(y+h*0.3)+'M'+n1(x)+' '+n1(y)+'L'+n1(x+w*0.43)+' '+n1(y+h*0.22)+'M'+n1(x+w)+' '+n1(y)+'L'+n1(x+w*0.57)+' '+n1(y+h*0.22);[0.08,0.2,0.3,0.37].forEach(function(t){var k=t/0.43;o+='M'+n1(x+w*t)+' '+n1(y+h*0.22*k)+'V'+n1(y+h-h*0.7*k)+'M'+n1(x+w-w*t)+' '+n1(y+h*0.22*k)+'V'+n1(y+h-h*0.7*k)});return o+'"/>'},
 mai:function(x,y,w,h){var o="";for(var r=0;r<3;r++){var n=3+r,cw=w/n,yy=y+h*(0.2+0.3*r);for(var i=0;i<n;i++){var a=x+cw*i+cw*0.08;o+='<path d="M'+n1(a)+' '+n1(yy+h*0.16)+'L'+n1(a+cw*0.42)+' '+n1(yy)+'L'+n1(a+cw*0.84)+' '+n1(yy+h*0.16)+'Z"/>'}}return o},
 khoi:function(x,y,w,h){return '<rect x="'+n1(x)+'" y="'+n1(y)+'" width="'+n1(w)+'" height="'+n1(h)+'" rx="6"/>'},
 tron:function(x,y,w,h){var r=Math.min(w,h*0.8)/2,c=x+w/2,cy=y+r;return '<circle cx="'+n1(c)+'" cy="'+n1(cy)+'" r="'+n1(r)+'"/><ellipse cx="'+n1(c)+'" cy="'+n1(cy)+'" rx="'+n1(r*1.18)+'" ry="'+n1(r*0.3)+'" fill="none"/><path d="M'+n1(c-r*0.5)+' '+n1(y+h)+'H'+n1(c+r*0.5)+'M'+n1(c)+' '+n1(cy+r)+'V'+n1(y+h)+'"/>'},
 svd:function(x,y,w,h){var c=x+w/2,cy=y+h/2;return '<ellipse cx="'+n1(c)+'" cy="'+n1(cy)+'" rx="'+n1(w/2)+'" ry="'+n1(h/2)+'"/><path fill="none" d="M'+n1(x+w*0.1)+' '+n1(y+h*0.25)+'L'+n1(x+w*0.6)+' '+n1(y+h)+'M'+n1(x+w*0.3)+' '+n1(y+h*0.05)+'L'+n1(x+w*0.9)+' '+n1(y+h*0.8)+'M'+n1(x+w*0.9)+' '+n1(y+h*0.25)+'L'+n1(x+w*0.4)+' '+n1(y+h)+'M'+n1(x+w*0.7)+' '+n1(y+h*0.05)+'L'+n1(x+w*0.1)+' '+n1(y+h*0.8)+'"/>'},
 vom:function(x,y,w,h){return ''}
};
function frame(sh){
  var W=sh.o==="d"?108:144,H=sh.o==="d"?144:108,b=sh.box,pp=sh.at;
  var o='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Bố cục khung hình: '+sh.t+'"><rect x="1" y="1" width="'+(W-2)+'" height="'+(H-2)+'" rx="8" fill="var(--surface)" stroke="var(--muted)" stroke-width="2"/>'
   +'<path d="M'+W/3+' 4V'+(H-4)+'M'+2*W/3+' 4V'+(H-4)+'M4 '+H/3+'H'+(W-4)+'M4 '+2*H/3+'H'+(W-4)+'" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 3"/>'
   +'<g stroke="var(--wall)" fill="var(--wall-soft)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+LM[sh.lm](W*b[0]/100,H*b[1]/100,W*b[2]/100,H*b[3]/100)+'</g>';
  if(sh.lm==="vom")o+='<path fill-rule="evenodd" fill="var(--ink)" opacity=".82" d="M3 3H'+(W-3)+'V'+(H-3)+'H3ZM'+W*0.22+' '+(H-3)+'V'+H*0.42+'A'+W*0.28+' '+W*0.28+' 0 0 1 '+W*0.78+' '+H*0.42+'V'+(H-3)+'Z"/>';
  return o+fig(POSE[sh.p][0],W*pp[0]/100,H*pp[1]/100,H*pp[2]/100)+'</svg>';
}
/* [tiêu đề, d=dọc|n=ngang, hình nền, [x,y,rộng,cao %], dáng, [tâm x, chân y, cao %], đứng ở đâu, máy, dáng] */
var SHOTS={
"thien-dan":[
 ["Toàn thân với Kỳ Niên Điện","d","thap",[18,8,64,50],"ngoai",[50,95,30],"Chính giữa lối đá phía nam, cách bậc thềm khoảng 30 mét.","Máy dọc, hạ ngang hông và ngửa nhẹ để mái điện vươn cao.","Bước chậm về phía điện rồi ngoái đầu qua vai. Chụp liên tiếp khi đang bước."],
 ["Bán thân, điện lệch một bên","n","thap",[52,10,42,70],"dung",[28,128,95],"Góc tây nam của sân, nơi ít người đi ngang.","Máy ngang tầm mắt. Người chụp lùi xa rồi zoom 2x để điện to ra sau lưng.","Xoay người 45°, một tay giữ khăn quàng, mắt nhìn về phía điện."],
 ["Con đường Đan Bệ Kiều","d","pho",[6,6,88,74],"dangtay",[50,94,26],"Giữa đường lát đá, hai hàng bách ở hai bên.","Máy dọc, hạ thấp gần mặt đất để con đường hút về xa.","Dang hai tay, mặt hơi ngửa lên trời. Hợp với ảnh quay lưng."]],
"bao-tang-tu-nhien":[
 ["Nhỏ bé bên bộ xương khủng long","n","khoi",[30,10,62,56],"giotay",[20,96,36],"Đứng sát chân bệ trưng bày, lệch về một đầu của bộ xương.","Máy ngang, hạ thấp và ngửa lên để thấy độ cao. Tắt flash.","Một tay chỉ lên cao, mặt ngước theo tay."],
 ["Ngắm hiện vật qua tủ kính","d","khoi",[46,22,46,50],"quaylung",[28,96,60],"Đứng nghiêng cạnh tủ kính có đèn.","Máy dọc, chụp ngang từ bên hông để ánh đèn tủ chiếu lên mặt.","Hơi cúi về phía tủ kính, tay đặt hờ lên mép tủ, không nhìn máy."]],
"tien-mon":[
 ["Giữa phố, lầu Tiễn Lâu sau lưng","d","dien",[20,10,60,36],"buoc",[50,95,36],"Giữa phố đi bộ, quay lưng về phía bắc. Đẹp nhất lúc lên đèn, 17:15–17:30.","Máy dọc, cao ngang ngực. Chờ khoảng trống giữa dòng người.","Bước thẳng về phía máy, mắt nhìn sang một bên phố."],
 ["Tựa tường gạch trong ngõ","n","pho",[4,6,60,84],"tua",[78,96,70],"Ngõ Dương Mai Trúc, chọn đoạn tường gạch xám có nắng xiên.","Máy ngang tầm mắt, để con ngõ chạy sâu vào một bên khung hình.","Tựa vai vào tường, một chân co nhẹ, tay cầm cốc cà phê."],
 ["Cả nhóm dưới cổng bài lâu","n","dien",[10,6,80,50],"nhom",[50,96,34],"Đầu phía bắc của phố, đứng lùi ra để lấy hết cổng.","Máy ngang, hạ thấp ngang hông để cổng cao lên.","Đứng so le trước sau, người thấp đứng trước. Mỗi người nhìn một hướng tự nhiên hơn xếp hàng ngang."]],
"universal":[
 ["Quả địa cầu ở cổng","d","tron",[20,8,60,52],"dangtay",[50,95,30],"Trước quả địa cầu, tới trước 9:00 khi chưa đông.","Máy dọc, hạ thấp ngang gối và ngửa lên để lấy trọn quả cầu.","Dang hai tay hoặc bật nhảy. Chụp liên tiếp rồi chọn tấm đẹp nhất."],
 ["Lâu đài ở phía xa","d","dien",[30,8,60,34],"quaylung",[34,95,48],"Lối vào làng trong khu Harry Potter, lâu đài nằm cuối đường.","Máy dọc, ngang tầm vai người mẫu, để người lệch sang một bên.","Quay lưng về máy, ngước nhìn lâu đài. Khăn quàng hoặc mũ là đạo cụ tốt."],
 ["Cả nhóm trên phố CityWalk","n","khoi",[8,10,84,40],"nhom",[50,96,42],"Phố CityWalk lúc 17:30, đèn bảng hiệu đã bật.","Máy ngang, đo sáng theo mặt người để nền đèn không cháy.","Khoác vai nhau bước về phía máy, vừa đi vừa cười."]],
"mo-dien-du":[
 ["Tường thành uốn lượn sau lưng","n","tuong",[30,8,68,62],"dung",[20,97,74],"Vọng lâu 15–16, đứng sát tường chắn, nhìn ngược về phía đông.","Máy ngang tầm mắt, để người chiếm một phần ba trái và tường thành chạy chéo phần còn lại.","Xoay người 45°, tay đút túi áo, mắt nhìn theo dãy núi."],
 ["Bước lên bậc đá","d","tuong",[4,6,92,56],"ngoai",[50,94,34],"Đoạn dốc giữa hai vọng lâu. Người chụp đứng thấp hơn 5–6 bậc.","Máy dọc, ngửa lên theo hướng dốc.","Bước lên một bậc rồi ngoái lại nhìn máy, tay vịn nhẹ tường."],
 ["Bóng người trong cửa vòm","d","vom",[0,0,100,100],"dung",[50,95,44],"Bên trong vọng lâu, người mẫu đứng ngay khung cửa vòm nhìn ra núi.","Máy dọc, chạm vào vùng trời sáng để đo sáng. Người sẽ thành bóng đen rõ nét.","Đứng nghiêng, một tay chạm thành cửa. Dáng càng rõ đường nét càng đẹp."]],
"di-hoa-vien":[
 ["Cầu 17 nhịp trong nắng chiều","n","cau",[6,30,66,40],"quaylung",[82,97,60],"Bờ đông hồ, phía nam chân cầu, khoảng 16:00.","Máy ngang tầm mắt, để cầu chạy ngang hai phần ba khung hình.","Quay lưng hoặc nghiêng người nhìn về cầu, hai tay đút túi áo khoác."],
 ["Trường Lang hun hút","d","pho",[6,4,88,78],"ngoai",[42,95,34],"Giữa hành lang, đứng lệch tâm một chút để thấy hàng cột.","Máy dọc, cao ngang ngực, giữ thẳng để cột không bị nghiêng.","Bước chậm ra xa máy rồi ngoái lại."],
 ["Ngồi lan can đá bên hồ","n","thap",[8,14,30,48],"ngoi",[70,96,56],"Bờ hồ Côn Minh, chọn chỗ thấy Phật Hương Các ở xa.","Máy ngang, hạ ngang tầm người ngồi.","Ngồi nghiêng, một chân duỗi, mắt nhìn ra hồ."]],
"co-cung":[
 ["Một mình giữa sân Thái Hòa Điện","d","dien",[10,10,80,34],"buoc",[50,94,26],"Trục giữa, ngay sau Thái Hòa Môn. Chụp lúc 8:30–9:00 khi sân còn trống.","Máy dọc, hạ thấp ngang hông để nền gạch kéo dài về phía điện.","Bước về phía điện, áo khoác mở. Ảnh quay lưng cho cảm giác sân rộng nhất."],
 ["Tường đỏ","n","khoi",[-4,-4,108,74],"tua",[30,97,80],"Các lối đi dài ở phía đông nội đình, chọn đoạn tường có nắng.","Máy ngang ngực, chụp song song với tường, người ở một phần ba trái.","Tựa nhẹ vai vào tường, mặt quay ra nắng. Áo trắng hoặc kem nổi nhất."],
 ["Cánh cửa đinh vàng","d","khoi",[8,-4,84,90],"giotay",[50,97,62],"Trước một cánh cổng lớn sơn đỏ có hàng đinh vàng.","Máy dọc, ngang tầm mắt, lấy cửa kín khung hình.","Một tay chạm lên đinh cửa, mặt nghiêng nhìn theo tay."]],
"canh-son":[
 ["Cố Cung trải dưới chân","n","mai",[4,34,92,50],"dung",[78,128,100],"Lan can phía nam của Vạn Xuân Đình.","Máy ngang. Buổi trưa ngược sáng nên chạm vào mặt người để đo sáng.","Đứng nghiêng ở mép phải khung hình, mắt nhìn xuống các mái ngói."],
 ["Tựa lan can trên đỉnh đồi","d","mai",[4,40,92,34],"tua",[40,96,62],"Góc đông nam của đình, tựa vào lan can đá.","Máy dọc, cao ngang ngực.","Tựa khuỷu tay lên lan can, người xoay nửa về phía Cố Cung."]],
"bao-tang-khoa-hoc":[
 ["Ngước nhìn giữa sảnh thông tầng","d","khoi",[14,6,72,46],"giotay",[50,95,34],"Giữa sảnh chính, dưới mô hình treo.","Máy dọc, hạ thấp ngang gối và ngửa hẳn lên.","Ngước mặt, một tay chỉ lên mô hình."],
 ["Đang chơi với thí nghiệm","n","khoi",[54,24,40,50],"nhom",[30,96,54],"Bên một mô hình tương tác ở tầng 2.","Máy ngang, đứng ngang tầm trẻ em. Chụp khi mọi người đang chăm chú.","Không cần nhìn máy. Ảnh lúc đang thử nghiệm tự nhiên hơn ảnh đứng tạo dáng."]],
"khu-olympic":[
 ["Tổ Chim lúc lên đèn","n","svd",[44,22,52,46],"quaylung",[22,97,64],"Giữa quảng trường trung tâm, 17:00–17:15.","Máy ngang, chạm vào công trình để đo sáng và giữ chắc tay vì trời tối.","Quay lưng hoặc nghiêng người nhìn về sân vận động."],
 ["Dang tay giữa quảng trường","d","svd",[14,14,72,26],"dangtay",[50,95,34],"Trục giữa quảng trường, công trình ở phía xa sau lưng.","Máy dọc, hạ thấp ngang hông.","Dang rộng tay, áo khoác mở để gió thổi."]]
};
function shotsHtml(id){
  var a=SHOTS[id]||[],h="";
  a.forEach(function(s){var sh={t:s[0],o:s[1],lm:s[2],box:s[3],p:s[4],at:s[5]};
    h+='<div class="shot"><div class="fr '+(s[1]==="d"?"doc":"ngang")+'">'+frame(sh)+'<span class="phcap">'+(s[1]==="d"?"Máy dọc":"Máy ngang")+'</span></div><div class="tx"><h4>'+s[0]+'</h4><dl><dt>Đứng ở đâu</dt><dd>'+s[6]+'</dd><dt>Cầm máy</dt><dd>'+s[7]+'</dd><dt>Dáng: '+POSE[s[4]][1]+'</dt><dd>'+s[8]+'</dd></dl></div></div>'});
  return h;
}
function poseLib(){
  var h='<div class="card"><span class="eyebrow">Dáng chụp dễ làm</span><div class="poses">';
  Object.keys(POSE).forEach(function(k){h+='<div><svg viewBox="0 0 60 84" aria-hidden="true">'+fig(POSE[k][0],30,82,k==="nhom"?62:78)+'</svg><span>'+POSE[k][1]+'</span></div>'});
  return h+'</div><p class="sub">Mặc áo dày nên dáng dễ bị cứng. Đứng chân trước chân sau, xoay người 45° so với máy, cằm hơi hạ và nhìn ra xa thay vì nhìn thẳng ống kính. Khăn quàng, mũ hoặc cốc cà phê giúp tay có việc để làm.</p></div>';
}

/* ---------- Chuẩn bị ---------- */
var done={};
try{done=JSON.parse(localStorage.getItem("bk-checks")||"{}")||{}}catch(e){done={}}
function renderPrep(){
  var h='<h2 class="vh">Chuẩn bị</h2>'
  +'<div class="card"><span class="eyebrow">Thời tiết 5 ngày</span>';
  DAYS.forEach(function(x){h+='<div class="wxrow"><span class="dd">'+x.d+'/11</span>'+tbar(x.lo,x.hi)+'<span class="tt">'+(x.lo<0?"−"+(-x.lo):x.lo)+' / '+x.hi+'°C</span><span class="wxnote">'+x.wx+'</span></div>'});
  h+='<p class="sub">Dự báo lúc lập lịch. Ngày 16 và 17 lạnh nhất, xuống dưới 0°C. Mặt trời lặn khoảng 17:00.</p></div>'
  +'<div class="card"><span class="eyebrow">Trang phục chung</span><p>Mặc theo lớp: áo giữ nhiệt, áo len hoặc nỉ, áo khoác dày chắn gió bên ngoài. Trong nhà và trên xe sưởi rất ấm nên cần lớp ngoài dễ cởi.</p><p>Chọn một áo khoác màu sáng hoặc màu nổi cho ảnh ngoài trời. Mùa này cây trơ cành và trời xanh nhạt, màu đỏ, kem, vàng mù tạt lên hình đẹp hơn đen và xám.</p></div>'
  +'<div class="card"><span class="eyebrow">Danh sách cần mang</span><div class="checks">';
  CHECKS.forEach(function(c,i){h+='<label class="chk"><input type="checkbox" id="chk-'+i+'" data-i="'+i+'"'+(done[i]?" checked":"")+'><span>'+c+'</span></label>'});
  h+='</div><p class="sub">Đánh dấu được lưu trên máy này.</p></div>'
  +'<div class="card"><span class="eyebrow">Lưu ý về Bắc Kinh</span><dl class="kv">'
  +'<dt>Múi giờ</dt><dd>Nhanh hơn Việt Nam 1 tiếng. Mọi giờ trong lịch là giờ Bắc Kinh.</dd>'
  +'<dt>Hộ chiếu</dt><dd>Mang theo hằng ngày. Vé tham quan gắn với số hộ chiếu và cổng soát bằng hộ chiếu gốc.</dd>'
  +'<dt>Thanh toán</dt><dd>Hầu hết quán và quầy vé quét mã Alipay hoặc WeChat Pay. Tiền mặt vẫn dùng được nhưng khó thối lẻ.</dd>'
  +'<dt>Ứng dụng</dt><dd>Google, Facebook và Instagram không mở được bằng wifi tại Trung Quốc. Lưu sẵn những gì cần xem.</dd>'
  +'<dt>Điện</dt><dd>220V. Ổ cắm chấu dẹt hai chân và ba chân chéo.</dd>'
  +'<dt>Nước uống</dt><dd>Không uống nước vòi. Khách sạn có ấm đun, nên mang bình giữ nhiệt.</dd>'
  +'<dt>Nhà vệ sinh</dt><dd>Điểm tham quan thường là bệt xổm và không có giấy. Mang khăn giấy theo người.</dd>'
  +'<dt>An ninh</dt><dd>Ga tàu điện, bảo tàng và khu Thiên An Môn đều soi chiếu túi xách. Tính thêm thời gian xếp hàng.</dd>'
  +'<dt>Bàn ăn</dt><dd>Không cắm đũa dựng đứng vào bát cơm. Món ăn thường gọi chung và xoay bàn.</dd>'
  +'</dl></div>';
  $("v-chuan-bi").innerHTML=h;
}

/* ---------- Vé & hỗ trợ ---------- */
function renderHelp(){
  var h='<h2 class="vh">Vé &amp; hỗ trợ</h2>'
  +'<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Thông tin của bạn</span><span class="pill">Dữ liệu mẫu</span></div><dl class="kv">'
  +'<dt>Khách sạn</dt><dd>Tên và địa chỉ khách sạn · công ty nhập</dd><dt>Phòng</dt><dd>Số phòng · hiện sau khi khách nhập số điện thoại</dd><dt>Xe</dt><dd>Xe 7 chỗ · biển số do công ty nhập</dd><dt>Tài xế</dt><dd>Tên và số điện thoại tài xế</dd><dt>Hotline</dt><dd>Số trực 24/7 của công ty landtour</dd></dl></div>'
  +'<div class="showcard"><span class="cap">Đưa cho tài xế taxi khi cần tự về khách sạn</span><span class="big" lang="zh" style="font-size:26px">请送我到这家酒店</span><span class="cap">Nghĩa là: xin chở tôi tới khách sạn này. Tên và địa chỉ khách sạn bằng tiếng Trung sẽ hiện ngay bên dưới.</span></div>'
  +'<div class="card"><span class="eyebrow">Vé từng điểm</span><div>';
  TICKETS.forEach(function(t){h+='<div class="tk"><div class="row" style="justify-content:space-between"><h3>'+t[1]+(t[2]?' <span class="han" lang="zh" style="color:var(--wall)">'+t[2]+'</span>':'')+'</h3><span class="pill '+t[6]+'">'+t[4]+'</span></div><p>'+t[0]+' · '+t[3]+(t[5]?' · '+t[5]:'')+'</p></div>'});
  h+='</div><p class="sub">Giá mỗi người, tham khảo. Mã vé và xác nhận đặt chỗ sẽ hiện ở đây khi công ty nhập.</p></div>'
  +'<span class="eyebrow">Số khẩn cấp tại Trung Quốc</span><div class="sos"><div><b>110</b><span>Công an</span></div><div><b>120</b><span>Cấp cứu</span></div><div><b>119</b><span>Cứu hỏa</span></div></div>'
  +'<div class="card"><span class="eyebrow">Đại sứ quán Việt Nam tại Bắc Kinh</span><p>Số 32 đường Quang Hoa, quận Triều Dương</p><span class="zhname" lang="zh">朝阳区光华路32号 越南大使馆</span></div>'
  +'<div class="card"><span class="eyebrow">Câu hay dùng, đưa màn hình cho người đối diện</span><div>'
  +'<div class="phr"><b lang="zh">洗手间在哪里?</b><span>Nhà vệ sinh ở đâu?</span></div>'
  +'<div class="phr"><b lang="zh">可以用支付宝吗?</b><span>Tôi trả bằng Alipay được không?</span></div>'
  +'<div class="phr"><b lang="zh">不要辣,谢谢。</b><span>Xin đừng cho cay, cảm ơn.</span></div>'
  +'<div class="phr"><b lang="zh">请帮我叫一辆出租车。</b><span>Xin gọi giúp tôi một chiếc taxi.</span></div>'
  +'<div class="phr"><b lang="zh">我迷路了,请帮我打这个电话。</b><span>Tôi bị lạc, xin gọi giúp số điện thoại này.</span></div>'
  +'</div></div>';
  $("v-ho-tro").innerHTML=h;
}

/* ---------- Sau tour ---------- */
var rate={tour:0,xe:0},sent=false,asked={};
function starRow(key,label){var h='<div class="sec"><span class="eyebrow">'+label+'</span><div class="stars" role="group" aria-label="'+label+'">';for(var i=1;i<=5;i++)h+='<button class="star'+(rate[key]>=i?" on":"")+'" type="button" data-k="'+key+'" data-n="'+i+'" aria-label="'+i+' sao" aria-pressed="'+(rate[key]===i)+'">★</button>';return h+'</div></div>'}
function renderAfter(){
  var tours=[["thuong-hai","Thượng Hải – Hàng Châu – Ô Trấn","5 ngày 4 đêm · phố Bến Thượng Hải, Tây Hồ, cổ trấn sông nước"],["truong-gia-gioi","Trương Gia Giới – Phượng Hoàng Cổ Trấn","6 ngày 5 đêm · núi đá sa thạch, cầu kính, phố cổ bên sông"],["thanh-do","Thành Đô – Cửu Trại Câu","6 ngày 5 đêm · gấu trúc, hồ nước nhiều màu trên cao nguyên"]];
  var h='<h2 class="vh">Sau tour</h2><div class="card"><h3>Chuyến đi của bạn thế nào?</h3>'+starRow("tour","Chấm điểm tour")+starRow("xe","Chấm điểm tài xế")
  +'<label class="eyebrow" for="fb">Góp ý thêm</label><textarea id="fb" placeholder="Điều bạn thích nhất, điều nên làm tốt hơn"></textarea>'
  +'<button class="btn" type="button" id="sendFb">Gửi đánh giá</button>'
  +(sent?'<p class="note">Đây là bản mẫu nên đánh giá chưa được gửi đi. Ở bản thật, đánh giá về thẳng công ty landtour.</p>':'')+'</div>'
  +'<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Tour khác của công ty</span><span class="pill">Gói mẫu</span></div><div>';
  tours.forEach(function(t){h+='<div class="tour"><h3>'+t[1]+'</h3><p>'+t[2]+'</p><p>Giá và lịch khởi hành do công ty nhập. Khách cũ được ưu đãi riêng.</p><button class="btn ghost" type="button" data-ask="'+t[0]+'">Nhận tư vấn</button>'+(asked[t[0]]?'<p class="note">Bản mẫu: ở bản thật, yêu cầu tư vấn kèm tên và số điện thoại của khách được gửi cho công ty.</p>':'')+'</div>'});
  $("v-sau-tour").innerHTML=h+'</div></div>';
}

/* ---------- Điều hướng ---------- */
var VIEWS=["lich-trinh","dia-diem","chuan-bi","ho-tro","sau-tour"];
function route(){
  var hsh=(location.hash||"").replace("#",""),view="lich-trinh",p=null;
  if(hsh.indexOf("dd-")===0){p=placeById(hsh.slice(3));view=p?"place":"dia-diem"}
  else if(VIEWS.indexOf(hsh)>=0)view=hsh;
  if(p)renderPlace(p);
  var all=document.querySelectorAll(".view");
  for(var i=0;i<all.length;i++)all[i].classList.toggle("on",all[i].id==="v-"+view);
  var nav=document.querySelectorAll(".nav a"),act=view==="place"?"dia-diem":view;
  for(var j=0;j<nav.length;j++){if(nav[j].getAttribute("data-v")===act)nav[j].setAttribute("aria-current","page");else nav[j].removeAttribute("aria-current")}
  $("nextCard").hidden=view!=="lich-trinh";document.body.classList.toggle("sub",view!=="lich-trinh");
  if(route.last!==undefined&&route.last!==hsh)window.scrollTo(0,0);
  route.last=hsh;
}

document.addEventListener("click",function(e){
  var t=e.target.closest?e.target.closest("button"):null;if(!t)return;
  if(t.classList.contains("day")){curDay=+t.getAttribute("data-i");renderItin();return}
  if(t.classList.contains("star")){rate[t.getAttribute("data-k")]=+t.getAttribute("data-n");renderAfter();return}
  if(t.id==="sendFb"){var v=$("fb").value;sent=true;renderAfter();$("fb").value=v;return}
  if(t.hasAttribute("data-ask")){var v2=$("fb").value;asked[t.getAttribute("data-ask")]=true;renderAfter();$("fb").value=v2;return}
  if(t.id==="zaloBtn"){var hint=$("zaloHint");hint.hidden=!hint.hidden;t.setAttribute("aria-expanded",String(!hint.hidden))}
});
document.addEventListener("change",function(e){
  var t=e.target;if(!t||t.type!=="checkbox"||!t.hasAttribute("data-i"))return;
  done[t.getAttribute("data-i")]=t.checked;
  try{localStorage.setItem("bk-checks",JSON.stringify(done))}catch(err){}
});
window.addEventListener("hashchange",route);

var keep=[],cl="";
Object.keys(CRED).forEach(function(k){var im=new Image();im.src="img/"+k+".jpg";keep.push(im);var c=CRED[k];cl+='<li>'+c.title+' · '+(c.artist||"không rõ tác giả")+' · '+c.lic+' · đã cắt và nén · <a href="'+c.page+'" target="_blank" rel="noopener">Wikimedia Commons</a></li>'});
$("credList").innerHTML=cl;
renderNext();renderItin();renderPlaces();renderPrep();renderHelp();renderAfter();route();
setInterval(function(){renderNext();if(dayIndexNow()===curDay)renderItin()},60000);
})();
</script>