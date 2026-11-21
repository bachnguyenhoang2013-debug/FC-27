export interface LegendQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface LegendDailyQuizPack {
  legendId: string;
  legendName: string;
  legendTitle: string;
  nation: string;
  position: string;
  avatarUrl: string;
  questions: LegendQuizQuestion[];
}

export const ICON_CHRONICLES_QUIZ_POOL: LegendDailyQuizPack[] = [
  {
    legendId: 'quiz_pele',
    legendName: 'Pelé',
    legendTitle: 'Vua Bóng Đá · Huyền Thoại Brazil',
    nation: 'Brazil',
    position: 'CF',
    avatarUrl: '/assets/aistudio/pele_245f51bd.png',
    questions: [
      {
        id: 'pele_1',
        question: 'Pelé đã vô địch FIFA World Cup tổng cộng bao nhiêu lần?',
        options: ['2 lần', '3 lần', '4 lần', '1 lần'],
        correctIndex: 1,
      },
      {
        id: 'pele_2',
        question: 'Pelé thi đấu phần lớn sự nghiệp đỉnh cao cho CLB nào của Brazil?',
        options: ['Flamengo', 'Santos', 'Palmeiras', 'Corinthians'],
        correctIndex: 1,
      },
      {
        id: 'pele_3',
        question: 'Pelé lần đầu vô địch World Cup năm 1958 khi bao nhiêu tuổi?',
        options: ['17 tuổi', '20 tuổi', '21 tuổi', '19 tuổi'],
        correctIndex: 0,
      },
      {
        id: 'pele_4',
        question: 'Số áo biểu tượng gắn liền với Pelé ở đội tuyển Brazil là số mấy?',
        options: ['Số 9', 'Số 7', 'Số 10', 'Số 11'],
        correctIndex: 2,
      },
      {
        id: 'pele_5',
        question: 'Cuối sự nghiệp, Pelé sang Mỹ khoác áo CLB nào?',
        options: ['LA Galaxy', 'New York Cosmos', 'Inter Miami', 'Seattle Sounders'],
        correctIndex: 1,
      },
      {
        id: 'pele_6',
        question: 'Tại chung kết World Cup 1958, Pelé lập cú đúp vào lưới đội tuyển nào?',
        options: ['Thụy Điển', 'Pháp', 'Đức', 'Ý'],
        correctIndex: 0,
      },
      {
        id: 'pele_7',
        question: 'Biệt danh nổi tiếng nhất toàn cầu của Pelé là gì?',
        options: ['Hoàng Đế', 'Vua Bóng Đá (O Rei)', 'Người Ngoài Hành Tinh', 'Thiên Nga Trắng'],
        correctIndex: 1,
      },
      {
        id: 'pele_8',
        question: 'Kỳ World Cup cuối cùng mà Pelé đăng quang cùng Brazil diễn ra năm nào?',
        options: ['1962', '1966', '1970', '1974'],
        correctIndex: 2,
      },
    ],
  },
  {
    legendId: 'quiz_r9',
    legendName: 'Ronaldo Nazário',
    legendTitle: 'Người Ngoài Hành Tinh · R9',
    nation: 'Brazil',
    position: 'ST',
    avatarUrl: '/assets/aistudio/ronaldo_1776958779148_536f1756.png',
    questions: [
      {
        id: 'r9_1',
        question: 'Biệt danh huyền thoại của Ronaldo Nazário là gì?',
        options: ['O Fenômeno (Người Ngoài Hành Tinh)', 'El Niño', 'O Rei', 'El Pistolero'],
        correctIndex: 0,
      },
      {
        id: 'r9_2',
        question: 'Ronaldo Nazário lập cú đúp ở chung kết World Cup 2002 trước đội tuyển nào?',
        options: ['Pháp', 'Đức', 'Ý', 'Hà Lan'],
        correctIndex: 1,
      },
      {
        id: 'r9_3',
        question: 'Ronaldo Nazário đã giành được bao nhiêu danh hiệu Quả Bóng Vàng?',
        options: ['1 lần', '2 lần', '3 lần', '4 lần'],
        correctIndex: 1,
      },
      {
        id: 'r9_4',
        question: 'CLB châu Âu đầu tiên mà Ronaldo R9 khoác áo là đội nào?',
        options: ['Ajax', 'PSV Eindhoven', 'Barcelona', 'Porto'],
        correctIndex: 1,
      },
      {
        id: 'r9_5',
        question: 'Tại World Cup 2002, Ronaldo R9 giành danh hiệu cá nhân nào với 8 bàn thắng?',
        options: ['Găng Tay Vàng', 'Chiếc Giày Vàng', 'Cầu Thủ Trẻ Xuất Sắc', 'Fair Play'],
        correctIndex: 1,
      },
      {
        id: 'r9_6',
        question: 'Ronaldo R9 từng khoác áo cả hai kình địch nào tại Tây Ban Nha?',
        options: ['Real Madrid & Atlético', 'Barcelona & Real Madrid', 'Valencia & Sevilla', 'Barcelona & Espanyol'],
        correctIndex: 1,
      },
      {
        id: 'r9_7',
        question: 'Ở Milan, Ronaldo R9 từng thi đấu cho những đội bóng nào?',
        options: ['Chỉ Inter Milan', 'Chỉ AC Milan', 'Cả Inter Milan và AC Milan', 'Juventus'],
        correctIndex: 2,
      },
      {
        id: 'r9_8',
        question: 'Năm 1997, ở tuổi 21, Ronaldo R9 lập kỷ lục gì tại lễ trao giải Ballon d’Or?',
        options: ['Thủ môn đầu tiên đoạt giải', 'Cầu thủ trẻ nhất lịch sử đoạt Quả Bóng Vàng', 'Hậu vệ đoạt giải', 'Đoạt giải không cần ghi bàn'],
        correctIndex: 1,
      },
    ],
  },
  {
    legendId: 'quiz_zidane',
    legendName: 'Zinedine Zidane',
    legendTitle: 'Nhạc Trưởng Tài Hoa · Zizou',
    nation: 'Pháp',
    position: 'CAM',
    avatarUrl: '/assets/aistudio/zidane_1786897202347_8dbc8c67.png',
    questions: [
      {
        id: 'zid_1',
        question: 'Zinedine Zidane ghi bao nhiêu bàn bằng đầu ở chung kết World Cup 1998?',
        options: ['1 bàn', '2 bàn', '3 bàn', '0 bàn'],
        correctIndex: 1,
      },
      {
        id: 'zid_2',
        question: 'Zidane tung cú vô-lê chân trái kinh điển ở chung kết Champions League 2002 vào lưới đội nào?',
        options: ['Bayern Munich', 'Bayer Leverkusen', 'Juventus', 'Valencia'],
        correctIndex: 1,
      },
      {
        id: 'zid_3',
        question: 'Trước khi gia nhập Real Madrid năm 2001, Zidane khoác áo CLB nào tại Serie A?',
        options: ['AC Milan', 'Juventus', 'Inter Milan', 'AS Roma'],
        correctIndex: 1,
      },
      {
        id: 'zid_4',
        question: 'Zidane đoạt danh hiệu Quả Bóng Vàng vào năm nào?',
        options: ['1996', '1998', '2000', '2002'],
        correctIndex: 1,
      },
      {
        id: 'zid_5',
        question: 'Kỹ thuật xoay người 360 độ thương hiệu của Zidane thường được gọi là gì?',
        options: ['Elastico', 'Roulette (Marseille Turn)', 'Rabona', 'Trivela'],
        correctIndex: 1,
      },
      {
        id: 'zid_6',
        question: 'Zidane cùng đội tuyển Pháp vô địch EURO vào năm nào?',
        options: ['EURO 1996', 'EURO 2000', 'EURO 2004', 'EURO 2008'],
        correctIndex: 1,
      },
      {
        id: 'zid_7',
        question: 'Số áo huyền thoại của Zidane tại Real Madrid là số mấy?',
        options: ['Số 5', 'Số 10', 'Số 8', 'Số 7'],
        correctIndex: 0,
      },
      {
        id: 'zid_8',
        question: 'Trên cương vị HLV Real Madrid, Zidane vô địch Champions League bao nhiêu mùa liên tiếp?',
        options: ['2 mùa liên tiếp', '3 mùa liên tiếp', '4 mùa liên tiếp', '1 mùa'],
        correctIndex: 1,
      },
    ],
  },
  {
    legendId: 'quiz_beckham',
    legendName: 'David Beckham',
    legendTitle: 'Vua Đá Phạt · Số 7 Huyền Thoại',
    nation: 'Anh',
    position: 'RM',
    avatarUrl: '/assets/aistudio/beckham_f2928295.png',
    questions: [
      {
        id: 'bec_1',
        question: 'David Beckham trưởng thành từ thế hệ vàng "Class of 92" của CLB nào?',
        options: ['Liverpool', 'Arsenal', 'Manchester United', 'Chelsea'],
        correctIndex: 2,
      },
      {
        id: 'bec_2',
        question: 'Năm 1999, Beckham cùng Man United giành kỳ tích lịch sử nào?',
        options: ['Cú ăn ba (Treble)', 'Bất bại cả mùa', 'Vô địch Europa League', 'Siêu cúp Ý'],
        correctIndex: 0,
      },
      {
        id: 'bec_3',
        question: 'Năm 2003, Beckham rời Man United để gia nhập "Dải Ngân Hà" nào?',
        options: ['Barcelona', 'Real Madrid', 'Juventus', 'Bayern Munich'],
        correctIndex: 1,
      },
      {
        id: 'bec_4',
        question: 'Tại Real Madrid, David Beckham mang chiếc áo số mấy?',
        options: ['Số 7', 'Số 23', 'Số 10', 'Số 11'],
        correctIndex: 1,
      },
      {
        id: 'bec_5',
        question: 'Sở trường nổi bật nhất làm nên thương hiệu David Beckham là gì?',
        options: ['Tạt bóng & sút phạt xoáy vòng cung', 'Xoạc bóng phòng ngự', 'Bắt phạt đền', 'Chạy nước rút 100m'],
        correctIndex: 0,
      },
      {
        id: 'bec_6',
        question: 'Năm 2007, Beckham sang giải MLS (Mỹ) thi đấu cho CLB nào?',
        options: ['New York Red Bulls', 'LA Galaxy', 'Chicago Fire', 'DC United'],
        correctIndex: 1,
      },
      {
        id: 'bec_7',
        question: 'Beckham giải nghệ năm 2013 sau khi vô địch Ligue 1 cùng đội bóng nào?',
        options: ['AS Monaco', 'Olympique Lyon', 'Paris Saint-Germain', 'Marseille'],
        correctIndex: 2,
      },
      {
        id: 'bec_8',
        question: 'Bàn sút phạt phút bù giờ năm 2001 đưa tuyển Anh dự World Cup 2002 của Beckham ghi vào lưới đội nào?',
        options: ['Đức', 'Hy Lạp', 'Thụy Điển', 'Bồ Đào Nha'],
        correctIndex: 1,
      },
    ],
  },
  {
    legendId: 'quiz_puskas',
    legendName: 'Ferenc Puskás',
    legendTitle: 'Thiếu Tá Phi Nước Đại · Chân Trái Thần Sầu',
    nation: 'Hungary',
    position: 'ST',
    avatarUrl: '/assets/aistudio/puskas_dae454a7.png',
    questions: [
      {
        id: 'pus_1',
        question: 'Ferenc Puskás là huyền thoại vĩ đại nhất của nền bóng đá quốc gia nào?',
        options: ['Áo', 'Hungary', 'Tiệp Khắc', 'Ba Lan'],
        correctIndex: 1,
      },
      {
        id: 'pus_2',
        question: 'Giải thưởng FIFA Puskás hàng năm được trao cho hạng mục nào?',
        options: ['Thủ môn xuất sắc nhất', 'Bàn thắng đẹp nhất năm', 'HLV hay nhất năm', 'Vua phá lưới châu Âu'],
        correctIndex: 1,
      },
      {
        id: 'pus_3',
        question: 'Puskás tạo nên cặp song sát huyền thoại cùng Alfredo Di Stéfano tại CLB nào?',
        options: ['Barcelona', 'Real Madrid', 'AC Milan', 'Benfica'],
        correctIndex: 1,
      },
      {
        id: 'pus_4',
        question: 'Tại chung kết Cúp C1 năm 1960 trước Eintracht Frankfurt, Puskás ghi bao nhiêu bàn?',
        options: ['2 bàn', '3 bàn', '4 bàn', '5 bàn'],
        correctIndex: 2,
      },
      {
        id: 'pus_5',
        question: 'Chân thuận sở hữu lực sút sấm sét của Ferenc Puskás là chân nào?',
        options: ['Chân trái', 'Chân phải', 'Chỉ đánh đầu', 'Không sút xa'],
        correctIndex: 0,
      },
      {
        id: 'pus_6',
        question: 'Đội tuyển Hungary của Puskás thập niên 1950 nổi tiếng với biệt danh nào?',
        options: ['Cơn Lốc Màu Da Cam', 'Magical Magyars (Đội Vàng Hungary)', 'Những Chú Sư Tử', 'Cỗ Xe Tăng'],
        correctIndex: 1,
      },
      {
        id: 'pus_7',
        question: 'Puskás giành giải Vua phá lưới La Liga (Pichichi) tổng cộng bao nhiêu lần?',
        options: ['1 lần', '2 lần', '4 lần', '6 lần'],
        correctIndex: 2,
      },
      {
        id: 'pus_8',
        question: 'Cùng Hungary, Puskás đã giành Huy chương Vàng Thế vận hội (Olympic) vào năm nào?',
        options: ['1948', '1952', '1956', '1960'],
        correctIndex: 1,
      },
    ],
  },
  {
    legendId: 'quiz_buffon',
    legendName: 'Gianluigi Buffon',
    legendTitle: 'Người Nhện Nước Ý · Superman',
    nation: 'Ý',
    position: 'GK',
    avatarUrl: '/assets/aistudio/buffon_3370c894.png',
    questions: [
      {
        id: 'buf_1',
        question: 'Gianluigi Buffon vô địch FIFA World Cup cùng đội tuyển Ý vào năm nào?',
        options: ['2002', '2006', '2010', '1998'],
        correctIndex: 1,
      },
      {
        id: 'buf_2',
        question: 'Buffon bắt đầu và kết thúc sự nghiệp chuyên nghiệp trong màu áo CLB nào?',
        options: ['Parma', 'Juventus', 'AC Milan', 'Fiorentina'],
        correctIndex: 0,
      },
      {
        id: 'buf_3',
        question: 'CLB mà Buffon gắn bó lâu nhất và giành 10 chức vô địch Serie A là đội nào?',
        options: ['Inter Milan', 'AS Roma', 'Juventus', 'Napoli'],
        correctIndex: 2,
      },
      {
        id: 'buf_4',
        question: 'Mùa giải 2018/19, Buffon chuyển sang thi đấu một mùa cho CLB nào ngoài nước Ý?',
        options: ['Real Madrid', 'Paris Saint-Germain', 'Chelsea', 'Bayern Munich'],
        correctIndex: 1,
      },
      {
        id: 'buf_5',
        question: 'Tại World Cup 2006, Buffon chỉ để thủng lưới bao nhiêu bàn từ bóng sống của đối phương?',
        options: ['0 bàn (chỉ 1 phản lưới & 1 phạt đền)', '3 bàn', '4 bàn', '5 bàn'],
        correctIndex: 0,
      },
      {
        id: 'buf_6',
        question: 'Năm 1999, trước khi tới Juventus, Buffon vô địch UEFA Cup cùng đội bóng nào?',
        options: ['Lazio', 'Parma', 'Sampdoria', 'Udinese'],
        correctIndex: 1,
      },
      {
        id: 'buf_7',
        question: 'Buffon giữ kỷ lục giữ sạch lưới liên tiếp tại Serie A trong bao nhiêu phút?',
        options: ['750 phút', '860 phút', '974 phút', '640 phút'],
        correctIndex: 2,
      },
      {
        id: 'buf_8',
        question: 'Năm 2006, Buffon về đích ở vị trí thứ mấy trong cuộc bầu chọn Quả Bóng Vàng?',
        options: ['Thứ nhất', 'Thứ hai (sau Fabio Cannavaro)', 'Thứ tư', 'Thứ năm'],
        correctIndex: 1,
      },
    ],
  },
  {
    legendId: 'quiz_carlos',
    legendName: 'Roberto Carlos',
    legendTitle: 'Cú Sút Quả Chuối Huyền Thoại · LB',
    nation: 'Brazil',
    position: 'LB',
    avatarUrl: '/assets/aistudio/roberto_carlos_2dcbffa9.png',
    questions: [
      {
        id: 'rc_1',
        question: 'Roberto Carlos thi đấu ở vị trí sở trường nào?',
        options: ['Hậu vệ trái (LB)', 'Trung vệ (CB)', 'Tiền đạo cắm (ST)', 'Thủ môn (GK)'],
        correctIndex: 0,
      },
      {
        id: 'rc_2',
        question: 'Cú sút phạt "quả chuối" lịch sử năm 1997 của Roberto Carlos được ghi vào lưới tuyển nào?',
        options: ['Anh', 'Pháp', 'Đức', 'Argentina'],
        correctIndex: 1,
      },
      {
        id: 'rc_3',
        question: 'Roberto Carlos giành 3 chức vô địch Champions League trong màu áo CLB nào?',
        options: ['Inter Milan', 'Real Madrid', 'Barcelona', 'Fenerbahçe'],
        correctIndex: 1,
      },
      {
        id: 'rc_4',
        question: 'Roberto Carlos cùng tuyển Brazil vô địch World Cup vào năm nào?',
        options: ['1994', '1998', '2002', '2006'],
        correctIndex: 2,
      },
      {
        id: 'rc_5',
        question: 'Trước khi gia nhập Real Madrid năm 1996, Roberto Carlos thi đấu cho CLB Ý nào?',
        options: ['Inter Milan', 'Juventus', 'AC Milan', 'AS Roma'],
        correctIndex: 0,
      },
      {
        id: 'rc_6',
        question: 'Ở chung kết Champions League 2002, Roberto Carlos là người tạt bóng kiến tạo cho ai ghi siêu phẩm vô-lê?',
        options: ['Raúl González', 'Zinedine Zidane', 'Luís Figo', 'Fernando Morientes'],
        correctIndex: 1,
      },
      {
        id: 'rc_7',
        question: 'Chân thuận tạo nên những cú đại bác sấm sét của Roberto Carlos là chân nào?',
        options: ['Chân trái', 'Chân phải', 'Không sút xa', 'Chỉ đánh đầu'],
        correctIndex: 0,
      },
      {
        id: 'rc_8',
        question: 'Số áo quen thuộc nhất của Roberto Carlos tại Real Madrid là số mấy?',
        options: ['Số 3', 'Số 6', 'Số 2', 'Số 12'],
        correctIndex: 0,
      },
    ],
  },
  {
    legendId: 'quiz_shevchenko',
    legendName: 'Andriy Shevchenko',
    legendTitle: 'Linh Dương Đông Âu · Quả Bóng Vàng 2004',
    nation: 'Ukraine',
    position: 'ST',
    avatarUrl: '/assets/aistudio/shevchenko_classics_529ad638.png',
    questions: [
      {
        id: 'shev_1',
        question: 'Andriy Shevchenko là biểu tượng bóng đá của quốc gia nào?',
        options: ['Ba Lan', 'Ukraine', 'Croatia', 'Séc'],
        correctIndex: 1,
      },
      {
        id: 'shev_2',
        question: 'Shevchenko giành danh hiệu Quả Bóng Vàng châu Âu vào năm nào?',
        options: ['2001', '2003', '2004', '2006'],
        correctIndex: 2,
      },
      {
        id: 'shev_3',
        question: 'Shevchenko ghi quả luân lưu quyết định giúp CLB nào vô địch Champions League 2003?',
        options: ['Dynamo Kyiv', 'AC Milan', 'Chelsea', 'Juventus'],
        correctIndex: 1,
      },
      {
        id: 'shev_4',
        question: 'Shevchenko trưởng thành và bùng nổ đầu sự nghiệp tại CLB nào?',
        options: ['Shakhtar Donetsk', 'Dynamo Kyiv', 'Spartak Moscow', 'CSKA'],
        correctIndex: 1,
      },
      {
        id: 'shev_5',
        question: 'Số áo huyền thoại của Shevchenko tại AC Milan là số mấy?',
        options: ['Số 7', 'Số 9', 'Số 10', 'Số 11'],
        correctIndex: 0,
      },
      {
        id: 'shev_6',
        question: 'Năm 2006, Shevchenko chuyển từ AC Milan sang thi đấu cho CLB Ngoại Hạng Anh nào?',
        options: ['Arsenal', 'Manchester United', 'Chelsea', 'Liverpool'],
        correctIndex: 2,
      },
      {
        id: 'shev_7',
        question: 'Shevchenko là cầu thủ ghi nhiều bàn thắng nhất lịch sử trận derby thành phố nào?',
        options: ['Derby Madrid', 'Derby della Madonnina (Milan)', 'Derby Bắc London', 'El Clásico'],
        correctIndex: 1,
      },
      {
        id: 'shev_8',
        question: 'Tại World Cup 2006, Shevchenko mang băng đội trưởng đưa Ukraine lọt tới vòng nào?',
        options: ['Vòng bảng', 'Tứ kết', 'Chung kết', 'Bán kết'],
        correctIndex: 1,
      },
    ],
  },
];

/**
 * Deterministically picks one Legend Quiz Pack per 06:00 AM daily cycle key (plus user seed).
 */
export function getDailyLegendQuizPack(
  cycleKey: string,
  preferredLegendId?: string
): LegendDailyQuizPack {
  if (preferredLegendId) {
    const found = ICON_CHRONICLES_QUIZ_POOL.find((p) => p.legendId === preferredLegendId);
    if (found) return found;
  }
  let hash = 0;
  for (let i = 0; i < cycleKey.length; i++) {
    hash = (hash * 31 + cycleKey.charCodeAt(i)) >>> 0;
  }
  const idx = hash % ICON_CHRONICLES_QUIZ_POOL.length;
  return ICON_CHRONICLES_QUIZ_POOL[idx] || ICON_CHRONICLES_QUIZ_POOL[0];
}
