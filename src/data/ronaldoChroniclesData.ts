import { PlayerCard } from '../types/game';

export const RONALDO_CHRONICLES_FRAME =
  '/assets/aistudio/khung_th__bi_n_ni_n_s__ronaldo_f3992fff.png';

export type RonaldoChronicleClubId =
  | 'sporting'
  | 'man_utd'
  | 'real_madrid'
  | 'juventus'
  | 'al_nassr';

export interface RonaldoQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface RonaldoChronicleStage {
  order: number;
  clubId: RonaldoChronicleClubId;
  clubName: string;
  eraLabel: string;
  subtitle: string;
  accentColor: string;
  player: PlayerCard;
  questionBank: RonaldoQuizQuestion[];
}

const PORTUGAL_FLAG = 'https://flagcdn.com/w80/pt.png';

export const RONALDO_CHRONICLES_STAGES: RonaldoChronicleStage[] = [
  {
    order: 1,
    clubId: 'sporting',
    clubName: 'Sporting CP',
    eraLabel: '2002 – 2003 · Khởi Nguồn Thiên Tài',
    subtitle: 'Chương 1: Cậu bé vàng học viện Alcochete & số áo 28 định mệnh',
    accentColor: '#10b981',
    player: {
      id: 'ronaldo_chronicles_sporting_100',
      name: 'Ronaldo',
      fullName: 'Cristiano Ronaldo (Sporting CP)',
      ovr: 100,
      position: 'RW',
      club: 'Sporting CP',
      nation: 'Bồ Đào Nha',
      nationFlag: PORTUGAL_FLAG,
      league: 'Liga Portugal',
      cardType: 'RONALDO_CHRONICLES',
      pac: 102,
      sho: 95,
      pas: 94,
      dri: 103,
      def: 46,
      phy: 84,
      avatarUrl: '/assets/aistudio/ronaldo_sporting_lisbon_2d7db40a.png',
      avatarFallbackUrl: '/assets/aistudio/ronaldo_sporting_lisbon_2d7db40a.png',
      skillMoves: 5,
      weakFoot: 4,
      foot: 'Phải',
      workRate: 'Cao/Thấp',
      height: '187 cm',
      skillBoost: 'Rê Bóng Tốc Độ',
      traits: ['Nghệ Sĩ Đảo Chân', 'Tốc Độ Bùng Nổ', 'Sút Xa'],
      isExchangeExclusive: true,
      isUntradeableOnly: true,
      isTradeable: false,
    },
    questionBank: [
      {
        id: 'scp_1',
        question: 'Cristiano Ronaldo khoác số áo bao nhiêu khi thi đấu cho đội một Sporting CP?',
        options: ['Số 28', 'Số 7', 'Số 17', 'Số 9'],
        correctIndex: 0,
      },
      {
        id: 'scp_2',
        question: 'Năm nào Cristiano Ronaldo gia nhập học viện trẻ của Sporting CP?',
        options: ['1995', '1997', '1999', '2001'],
        correctIndex: 1,
      },
      {
        id: 'scp_3',
        question: 'Trước khi chuyển tới Sporting CP ở tuổi 12, Ronaldo từng tập luyện tại CLB quê hương Madeira nào?',
        options: ['Marítimo', 'CD Nacional', 'Boavista', 'Braga'],
        correctIndex: 1,
      },
      {
        id: 'scp_4',
        question: 'Ronaldo ghi cú đúp trong trận ra mắt giải VĐQG Bồ Đào Nha (Primeira Liga) vào lưới đội bóng nào tháng 10/2002?',
        options: ['FC Porto', 'Benfica', 'Moreirense', 'Vitória Guimarães'],
        correctIndex: 2,
      },
      {
        id: 'scp_5',
        question: 'Trận giao hữu khai trương sân vận động nào năm 2003 khiến Sir Alex Ferguson lập tức quyết định chiêu mộ Ronaldo?',
        options: ['Estádio do Dragão', 'Estádio José Alvalade', 'Estádio da Luz', 'Sân Municipal de Braga'],
        correctIndex: 1,
      },
      {
        id: 'scp_6',
        question: 'Trong trận giao hữu tháng 8/2003, Sporting CP đã đánh bại Manchester United với tỷ số bao nhiêu?',
        options: ['2-0', '3-1', '4-2', '1-0'],
        correctIndex: 1,
      },
      {
        id: 'scp_7',
        question: 'Vị HLV người Romania nào là người đôn Ronaldo lên đội một Sporting CP và đặt nhiều niềm tin ở mùa 2002/03?',
        options: ['László Bölöni', 'Fernando Santos', 'Carlos Queiroz', 'José Peseiro'],
        correctIndex: 0,
      },
      {
        id: 'scp_8',
        question: 'Ở mùa giải 2002/03, Ronaldo ra sân chính thức khoảng bao nhiêu trận và ghi bao nhiêu bàn cho đội một Sporting CP?',
        options: ['31 trận, 5 bàn', '12 trận, 1 bàn', '50 trận, 20 bàn', '18 trận, 10 bàn'],
        correctIndex: 0,
      },
      {
        id: 'scp_9',
        question: 'Tên trung tâm đào tạo trẻ trứ danh của Sporting CP nơi Ronaldo trưởng thành có tên là gì?',
        options: ['Seixal', 'Alcochete', 'Olival', 'Valdebebas'],
        correctIndex: 1,
      },
      {
        id: 'scp_10',
        question: 'Ronaldo sinh ra tại thành phố Funchal thuộc hòn đảo nào của Bồ Đào Nha?',
        options: ['Azores', 'Madeira', 'Lisbon', 'Faro'],
        correctIndex: 1,
      },
      {
        id: 'scp_11',
        question: 'Vì lý do gì Sporting CP từng giữ một người bạn thân cùng quê làm chỗ dựa tinh thần giúp Ronaldo ở lại học viện lúc nhỏ?',
        options: ['José Semedo', 'Nani', 'João Moutinho', 'Quaresma'],
        correctIndex: 0,
      },
      {
        id: 'scp_12',
        question: 'Trước khi lên đội một, cầu thủ chạy cánh đồng hương nào thường đá cặp cánh đối diện với Ronaldo ở tuyến trẻ Sporting CP?',
        options: ['Ricardo Quaresma', 'Simão Sabrosa', 'Luis Figo', 'Deco'],
        correctIndex: 0,
      },
      {
        id: 'scp_13',
        question: 'Năm 2020, Sporting CP đã quyết định đặt tên Học viện của mình thành gì để vinh danh anh?',
        options: ['Academia Cristiano Ronaldo', 'Estádio CR7', 'Sporting 28 Academy', 'Centro Madeira'],
        correctIndex: 0,
      },
      {
        id: 'scp_14',
        question: 'Ronaldo rời Sporting CP để gia nhập Manchester United vào kỳ chuyển nhượng mùa hè năm nào?',
        options: ['2002', '2003', '2004', '2005'],
        correctIndex: 1,
      },
    ],
  },
  {
    order: 2,
    clubId: 'man_utd',
    clubName: 'Manchester United',
    eraLabel: '2003 – 2009 & 2021 – 2022 · Nhà Vua Old Trafford',
    subtitle: 'Chương 2: Số 7 huyền thoại, Quả Bóng Vàng 2008 & 3 chức vô địch Ngoại Hạng Anh liên tiếp',
    accentColor: '#ef4444',
    player: {
      id: 'ronaldo_chronicles_manutd_100',
      name: 'Ronaldo',
      fullName: 'Cristiano Ronaldo (Man Utd)',
      ovr: 100,
      position: 'LW',
      club: 'Manchester United',
      nation: 'Bồ Đào Nha',
      nationFlag: PORTUGAL_FLAG,
      league: 'Premier League',
      cardType: 'RONALDO_CHRONICLES',
      pac: 101,
      sho: 100,
      pas: 95,
      dri: 102,
      def: 47,
      phy: 90,
      avatarUrl: '/assets/aistudio/ronaldo_manchester_united_45046842.png',
      avatarFallbackUrl: '/assets/aistudio/ronaldo_manchester_united_45046842.png',
      skillMoves: 5,
      weakFoot: 4,
      foot: 'Phải',
      workRate: 'Cao/Thấp',
      height: '187 cm',
      skillBoost: 'Dứt Điểm Sấm Sét',
      traits: ['Sút Phạt Knuckleball', 'Bật Nhảy Đánh Đầu', 'Chuyên Gia Sút Xa'],
      isExchangeExclusive: true,
      isUntradeableOnly: true,
      isTradeable: false,
    },
    questionBank: [
      {
        id: 'mu_1',
        question: 'Khi đến Manchester United năm 2003, Ronaldo nhận chiếc áo số 7 ngay sau khi huyền thoại nào chuyển sang Real Madrid?',
        options: ['Eric Cantona', 'David Beckham', 'George Best', 'Ryan Giggs'],
        correctIndex: 1,
      },
      {
        id: 'mu_2',
        question: 'Mùa giải 2007/08 rực rỡ, Ronaldo ghi bao nhiêu bàn thắng trên mọi đấu trường cho Manchester United?',
        options: ['31 bàn', '38 bàn', '42 bàn', '46 bàn'],
        correctIndex: 2,
      },
      {
        id: 'mu_3',
        question: 'Ronaldo đã giành Quả Bóng Vàng (Ballon d’Or) đầu tiên trong sự nghiệp vào năm nào trong màu áo Quỷ Đỏ?',
        options: ['2007', '2008', '2009', '2006'],
        correctIndex: 1,
      },
      {
        id: 'mu_4',
        question: 'Trận chung kết Champions League 2008 tại Moscow, Ronaldo ghi bàn bằng đầu vào lưới CLB nào?',
        options: ['Arsenal', 'Liverpool', 'Chelsea', 'Barcelona'],
        correctIndex: 2,
      },
      {
        id: 'mu_5',
        question: 'Danh hiệu đầu tiên của Ronaldo cùng Manchester United là Cúp FA năm 2004 sau khi đánh bại đội bóng nào ở chung kết?',
        options: ['Millwall', 'Arsenal', 'Chelsea', 'Cardiff City'],
        correctIndex: 0,
      },
      {
        id: 'mu_6',
        question: 'Cú sút xa 40 mét giành giải FIFA Puskás đầu tiên năm 2009 của Ronaldo được ghi vào lưới CLB nào tại Champions League?',
        options: ['Sporting CP', 'Benfica', 'FC Porto', 'AS Roma'],
        correctIndex: 2,
      },
      {
        id: 'mu_7',
        question: 'Trong mùa 2007/08, Ronaldo đoạt Chiếc Giày Vàng Ngoại Hạng Anh với bao nhiêu bàn thắng (38 vòng)?',
        options: ['28 bàn', '31 bàn', '34 bàn', '25 bàn'],
        correctIndex: 1,
      },
      {
        id: 'mu_8',
        question: 'Ronaldo vào sân từ ghế dự bị trong trận ra mắt Premier League tháng 8/2003 gặp đối thủ nào tại Old Trafford?',
        options: ['Bolton Wanderers', 'Portsmouth', 'Aston Villa', 'Newcastle United'],
        correctIndex: 0,
      },
      {
        id: 'mu_9',
        question: 'Trong nhiệm kỳ đầu (2003–2009), Ronaldo giành tổng cộng bao nhiêu chức vô địch Premier League cùng Man Utd?',
        options: ['2 lần', '3 lần', '4 lần', '1 lần'],
        correctIndex: 1,
      },
      {
        id: 'mu_10',
        question: 'Tháng 1/2008, Ronaldo ghi cú hat-trick đầu tiên cho Man Utd (cũng là hat-trick duy nhất giai đoạn đầu) vào lưới đội nào?',
        options: ['Newcastle United', 'Tottenham', 'Fulham', 'Blackburn Rovers'],
        correctIndex: 0,
      },
      {
        id: 'mu_11',
        question: 'Khi tái hợp Manchester United vào năm 2021, Ronaldo lập cú đúp ngay trận ra mắt trở lại vào lưới CLB nào?',
        options: ['Leeds United', 'Newcastle United', 'West Ham', 'Watford'],
        correctIndex: 1,
      },
      {
        id: 'mu_12',
        question: 'Bàn thắng đá phạt kiểu Knuckleball kinh điển vào tháng 1/2008 ở Old Trafford được Ronaldo thực hiện trước đối thủ nào?',
        options: ['Portsmouth', 'Arsenal', 'Aston Villa', 'Everton'],
        correctIndex: 0,
      },
      {
        id: 'mu_13',
        question: 'Ở Premier League 2021/22, Ronaldo đứng thứ mấy trong cuộc đua Vua phá lưới giải đấu với 18 bàn thắng?',
        options: ['Thứ 3', 'Thứ 1', 'Thứ 5', 'Thứ 2'],
        correctIndex: 0,
      },
      {
        id: 'mu_14',
        question: 'Trong trận bán kết Champions League 2008/09 gặp Arsenal trên sân Emirates, Ronaldo ghi siêu phẩm đá phạt từ cự ly xa vào thủ môn nào?',
        options: ['Jens Lehmann', 'Manuel Almunia', 'Łukasz Fabiański', 'David Seaman'],
        correctIndex: 1,
      },
    ],
  },
  {
    order: 3,
    clubId: 'real_madrid',
    clubName: 'Real Madrid',
    eraLabel: '2009 – 2018 · Hoàng Đế Bernabéu',
    subtitle: 'Chương 3: 450 bàn sau 438 trận, 4 chức vô địch Champions League & 4 Quả Bóng Vàng',
    accentColor: '#f59e0b',
    player: {
      id: 'ronaldo_chronicles_realmadrid_100',
      name: 'Ronaldo',
      fullName: 'Cristiano Ronaldo (Real Madrid)',
      ovr: 100,
      position: 'LW',
      club: 'Real Madrid',
      nation: 'Bồ Đào Nha',
      nationFlag: PORTUGAL_FLAG,
      league: 'LaLiga EA SPORTS',
      cardType: 'RONALDO_CHRONICLES',
      pac: 102,
      sho: 104,
      pas: 96,
      dri: 102,
      def: 46,
      phy: 93,
      avatarUrl: '/assets/aistudio/ronaldo_real_madrid_a4e1e2e5.png',
      avatarFallbackUrl: '/assets/aistudio/ronaldo_real_madrid_a4e1e2e5.png',
      skillMoves: 5,
      weakFoot: 4,
      foot: 'Phải',
      workRate: 'Cao/Thấp',
      height: '187 cm',
      skillBoost: 'Sát Thủ Toàn Diện',
      traits: ['Xe Đạp Chổng Ngược', 'Vua Phá Lưới C1', 'Dứt Điểm Cận Thành'],
      isExchangeExclusive: true,
      isUntradeableOnly: true,
      isTradeable: false,
    },
    questionBank: [
      {
        id: 'rm_1',
        question: 'Trong mùa giải đầu tiên 2009/10 tại Real Madrid (khi Raúl còn giữ số 7), Ronaldo mặc áo số mấy?',
        options: ['Số 9', 'Số 10', 'Số 11', 'Số 17'],
        correctIndex: 0,
      },
      {
        id: 'rm_2',
        question: 'Ronaldo giữ kỷ lục chân sút vĩ đại nhất lịch sử Real Madrid với tổng cộng bao nhiêu bàn thắng chính thức?',
        options: ['411 bàn', '450 bàn', '438 bàn', '472 bàn'],
        correctIndex: 1,
      },
      {
        id: 'rm_3',
        question: 'Ronaldo lập kỷ lục ghi nhiều bàn nhất trong 1 mùa giải UEFA Champions League (2013/14) với bao nhiêu bàn?',
        options: ['15 bàn', '16 bàn', '17 bàn', '14 bàn'],
        correctIndex: 2,
      },
      {
        id: 'rm_4',
        question: 'Trong giai đoạn khoác áo Real Madrid (2009–2018), Ronaldo giành thêm bao nhiêu Quả Bóng Vàng?',
        options: ['3 lần', '4 lần', '5 lần', '2 lần'],
        correctIndex: 1,
      },
      {
        id: 'rm_5',
        question: 'Cú "xe đạp chổng ngược" đi vào lịch sử của Ronaldo năm 2018 được ghi vào lưới đội bóng nào?',
        options: ['Bayern Munich', 'Juventus', 'PSG', 'Atlético Madrid'],
        correctIndex: 1,
      },
      {
        id: 'rm_6',
        question: 'Tam tấu tấn công lừng danh BBC tại Real Madrid gồm Bale, Benzema và ai?',
        options: ['Bellingham', 'Cristiano Ronaldo', 'Casemiro', 'Carvajal'],
        correctIndex: 1,
      },
      {
        id: 'rm_7',
        question: 'Ronaldo ghi cú đúp trong trận chung kết Champions League 2017 (4-1) tại Cardiff trước đối thủ nào?',
        options: ['Liverpool', 'Atlético Madrid', 'Juventus', 'Bayern Munich'],
        correctIndex: 2,
      },
      {
        id: 'rm_8',
        question: 'Trong 9 năm ở Real Madrid, Ronaldo vô địch UEFA Champions League tổng cộng mấy lần?',
        options: ['3 lần', '4 lần', '5 lần', '2 lần'],
        correctIndex: 1,
      },
      {
        id: 'rm_9',
        question: 'Mùa giải LaLiga 2014/15, Ronaldo đoạt Pichichi và Chiếc Giày Vàng Châu Âu với kỷ lục cá nhân bao nhiêu bàn tại giải VĐQG?',
        options: ['46 bàn', '48 bàn', '50 bàn', '42 bàn'],
        correctIndex: 1,
      },
      {
        id: 'rm_10',
        question: 'Năm 2015, Ronaldo ghi 5 bàn trong 1 trận đấu duy nhất tại LaLiga vào lưới đội nào (thắng 9-1)?',
        options: ['Granada', 'Espanyol', 'Rayo Vallecano', 'Celta Vigo'],
        correctIndex: 0,
      },
      {
        id: 'rm_11',
        question: 'Trận chung kết Champions League 2016 tại San Siro, Ronaldo thực hiện thành công lượt sút luân lưu quyết định trước đội nào?',
        options: ['Barcelona', 'Atlético Madrid', 'Bayern Munich', 'Manchester City'],
        correctIndex: 1,
      },
      {
        id: 'rm_12',
        question: 'Lễ ra mắt kỷ lục thế giới của Ronaldo tại sân Santiago Bernabéu năm 2009 thu hút khoảng bao nhiêu khán giả?',
        options: ['45.000 người', '80.000 người', '25.000 người', '60.000 người'],
        correctIndex: 1,
      },
      {
        id: 'rm_13',
        question: 'Ronaldo có màn ăn mừng "Calma, Calma" biểu tượng trên sân Nou Camp của Barcelona vào năm nào?',
        options: ['2010', '2012', '2015', '2017'],
        correctIndex: 1,
      },
      {
        id: 'rm_14',
        question: 'Tổng số lần ra sân chính thức của Ronaldo cho Real Madrid trước khi sang Juventus là bao nhiêu trận?',
        options: ['438 trận', '450 trận', '399 trận', '500 trận'],
        correctIndex: 0,
      },
    ],
  },
  {
    order: 4,
    clubId: 'juventus',
    clubName: 'Juventus',
    eraLabel: '2018 – 2021 · Ông Hoàng Serie A',
    subtitle: 'Chương 4: 101 bàn thắng cho Lão Bà, 2 Scudetto & Capocannoniere 2020/21',
    accentColor: '#e2e8f0',
    player: {
      id: 'ronaldo_chronicles_juventus_100',
      name: 'Ronaldo',
      fullName: 'Cristiano Ronaldo (Juventus)',
      ovr: 100,
      position: 'ST',
      club: 'Juventus',
      nation: 'Bồ Đào Nha',
      nationFlag: PORTUGAL_FLAG,
      league: 'Serie A',
      cardType: 'RONALDO_CHRONICLES',
      pac: 98,
      sho: 103,
      pas: 94,
      dri: 99,
      def: 46,
      phy: 95,
      avatarUrl: '/assets/aistudio/ronaldo_juventus_5d36603e.png',
      avatarFallbackUrl: '/assets/aistudio/ronaldo_juventus_5d36603e.png',
      skillMoves: 5,
      weakFoot: 4,
      foot: 'Phải',
      workRate: 'Cao/Thấp',
      height: '187 cm',
      skillBoost: 'Không Chiến Thần Sầu',
      traits: ['Bật Nhảy 2m56', 'Bản Năng Sát Thủ', 'Lãnh Đạo'],
      isExchangeExclusive: true,
      isUntradeableOnly: true,
      isTradeable: false,
    },
    questionBank: [
      {
        id: 'juv_1',
        question: 'Juventus đã chiêu mộ Cristiano Ronaldo từ Real Madrid vào mùa hè năm 2018 với mức phí chuyển nhượng khoảng bao nhiêu?',
        options: ['80 triệu Euro', '100 triệu Euro', '120 triệu Euro', '65 triệu Euro'],
        correctIndex: 1,
      },
      {
        id: 'juv_2',
        question: 'Ronaldo ghi tổng cộng bao nhiêu bàn thắng chính thức trong 3 mùa khoác áo Juventus?',
        options: ['88 bàn', '101 bàn', '115 bàn', '92 bàn'],
        correctIndex: 1,
      },
      {
        id: 'juv_3',
        question: 'Tại lượt về vòng 1/8 Champions League 2018/19, Ronaldo lập cú hat-trick ngược dòng (3-0) giúp Juventus loại đối thủ nào?',
        options: ['Barcelona', 'Atlético Madrid', 'Ajax', 'Porto'],
        correctIndex: 1,
      },
      {
        id: 'juv_4',
        question: 'Cú bật nhảy cao tới 2,56 mét (lơ lửng trên không) đánh đầu ghi bàn tháng 12/2019 của Ronaldo là vào lưới CLB Serie A nào?',
        options: ['Sampdoria', 'AC Milan', 'Napoli', 'Lazio'],
        correctIndex: 0,
      },
      {
        id: 'juv_5',
        question: 'Ronaldo giành danh hiệu Vua phá lưới Serie A (Capocannoniere) mùa giải 2020/21 với bao nhiêu bàn?',
        options: ['25 bàn', '29 bàn', '31 bàn', '36 bàn'],
        correctIndex: 1,
      },
      {
        id: 'juv_6',
        question: 'Ronaldo trở thành cầu thủ đầu tiên trong lịch sử giành danh hiệu Vua phá lưới ở 3 giải VĐQG hàng đầu nào?',
        options: ['Anh, Tây Ban Nha, Ý', 'Anh, Đức, Ý', 'Tây Ban Nha, Pháp, Ý', 'Anh, Bồ Đào Nha, Ý'],
        correctIndex: 0,
      },
      {
        id: 'juv_7',
        question: 'Ronaldo ghi bàn thắng đầu tiên cho Juventus ở Serie A bằng cú đúp vào lưới đội bóng nào tháng 9/2018?',
        options: ['Sassuolo', 'Chievo', 'Torino', 'Udinese'],
        correctIndex: 0,
      },
      {
        id: 'juv_8',
        question: 'Trong 3 năm ở Turin, Ronaldo cùng Juventus giành được bao nhiêu chức vô địch Serie A (Scudetto)?',
        options: ['1 lần', '2 lần', '3 lần', '0 lần'],
        correctIndex: 1,
      },
      {
        id: 'juv_9',
        question: 'Mùa giải Serie A 2019/20, Ronaldo ghi bàn trong bao nhiêu trận liên tiếp tại giải đấu (san bằng kỷ lục giải đấu)?',
        options: ['9 trận', '11 trận', '14 trận', '7 trận'],
        correctIndex: 1,
      },
      {
        id: 'juv_10',
        question: 'Ronaldo lập hat-trick đầu tiên tại Serie A vào tháng 1/2020 trước CLB nào trên sân nhà Allianz Stadium?',
        options: ['Cagliari', 'Bologna', 'Fiorentina', 'Genoa'],
        correctIndex: 0,
      },
      {
        id: 'juv_11',
        question: 'Cầu thủ chạy cánh người Colombia và đội trưởng nào đã gắn bó sát cánh cùng Ronaldo tại Juventus giai đoạn 2018–2021?',
        options: ['Cuadrado & Chiellini', 'Kaka & Maldini', 'Insigne & Immobile', 'Džeko & Totti'],
        correctIndex: 0,
      },
      {
        id: 'juv_12',
        question: 'Cột mốc 100 bàn cho Juventus được Ronaldo chạm tới sau chỉ bao nhiêu mùa giải (nhanh nhất lịch sử CLB)?',
        options: ['3 mùa giải', '5 mùa giải', '4 mùa giải', '2 mùa giải'],
        correctIndex: 0,
      },
      {
        id: 'juv_13',
        question: 'Danh hiệu cuối cùng Ronaldo giành được với Juventus năm 2021 là chiếc cúp quốc nội nào?',
        options: ['Coppa Italia', 'Europa League', 'Scudetto 2021', 'Champions League'],
        correctIndex: 0,
      },
      {
        id: 'juv_14',
        question: 'Vị HLV nào dẫn dắt Juventus vô địch Serie A mùa đầu tiên Ronaldo chuyển đến (2018/19)?',
        options: ['Massimiliano Allegri', 'Maurizio Sarri', 'Andrea Pirlo', 'Antonio Conte'],
        correctIndex: 0,
      },
    ],
  },
  {
    order: 5,
    clubId: 'al_nassr',
    clubName: 'Al-Nassr',
    eraLabel: '2023 – Nay · Kỷ Lục Gia Bất Tử',
    subtitle: 'Chương 5: Thủ quân Riyadh, Kỷ lục 35 bàn 1 mùa Saudi Pro League & Cột mốc 900+ bàn',
    accentColor: '#eab308',
    player: {
      id: 'ronaldo_chronicles_alnassr_100',
      name: 'Ronaldo',
      fullName: 'Cristiano Ronaldo (Al-Nassr)',
      ovr: 100,
      position: 'ST',
      club: 'Al-Nassr',
      nation: 'Bồ Đào Nha',
      nationFlag: PORTUGAL_FLAG,
      league: 'Saudi Pro League',
      cardType: 'RONALDO_CHRONICLES',
      pac: 97,
      sho: 104,
      pas: 95,
      dri: 98,
      def: 46,
      phy: 94,
      avatarUrl: '/assets/aistudio/ronaldo_al_nassr_e7a49c1a.png',
      avatarFallbackUrl: '/assets/aistudio/ronaldo_al_nassr_e7a49c1a.png',
      skillMoves: 5,
      weakFoot: 4,
      foot: 'Phải',
      workRate: 'Cao/Thấp',
      height: '187 cm',
      skillBoost: 'Vua Phá Lưới Toàn Cầu',
      traits: ['Dứt Điểm Một Chạm', 'Đá Phạt Đẳng Cấp', 'Thủ Lĩnh Sân Cỏ'],
      isExchangeExclusive: true,
      isUntradeableOnly: true,
      isTradeable: false,
    },
    questionBank: [
      {
        id: 'aln_1',
        question: 'Cristiano Ronaldo chính thức ra mắt CLB Al-Nassr của Ả Rập Xê Út vào đầu năm nào?',
        options: ['Tháng 1/2022', 'Tháng 1/2023', 'Tháng 8/2023', 'Tháng 1/2024'],
        correctIndex: 1,
      },
      {
        id: 'aln_2',
        question: 'Sân vận động sân nhà của CLB Al-Nassr mang tên gì?',
        options: ['Al-Awwal Park', 'Kingdom Arena', 'King Abdullah Sports City', 'Lusail Stadium'],
        correctIndex: 0,
      },
      {
        id: 'aln_3',
        question: 'Ở mùa giải Saudi Pro League 2023/24, Ronaldo phá kỷ lục giải đấu khi ghi tổng cộng bao nhiêu bàn thắng?',
        options: ['29 bàn', '31 bàn', '35 bàn', '40 bàn'],
        correctIndex: 2,
      },
      {
        id: 'aln_4',
        question: 'Trong năm dương lịch 2023 (tính cả Al-Nassr và ĐT Bồ Đào Nha), Ronaldo dẫn đầu thế giới với bao nhiêu bàn?',
        options: ['48 bàn', '54 bàn', '50 bàn', '60 bàn'],
        correctIndex: 1,
      },
      {
        id: 'aln_5',
        question: 'Tháng 2/2023, Ronaldo ghi cả 4 bàn (poker) cho Al-Nassr trong trận thắng 4-0 trước đối thủ nào?',
        options: ['Al-Wehda', 'Al-Hilal', 'Al-Ittihad', 'Al-Ahli'],
        correctIndex: 0,
      },
      {
        id: 'aln_6',
        question: 'Tháng 8/2023, Ronaldo lập cú đúp giúp Al-Nassr đánh bại Al-Hilal để vô địch giải đấu nào?',
        options: ['Arab Club Champions Cup', 'AFC Champions League', 'King Cup', 'UEFA Super Cup'],
        correctIndex: 0,
      },
      {
        id: 'aln_7',
        question: 'Ronaldo trở thành cầu thủ đầu tiên trong lịch sử giành danh hiệu Vua phá lưới ở mấy giải VĐQG khác nhau sau mùa 2023/24?',
        options: ['3 giải đấu', '4 giải đấu (Anh, TBN, Ý, Saudi)', '5 giải đấu', '2 giải đấu'],
        correctIndex: 1,
      },
      {
        id: 'aln_8',
        question: 'Ngôi sao tấn công người Senegal nào chuyển từ Bayern Munich sang sát cánh cùng Ronaldo tại Al-Nassr năm 2023?',
        options: ['Sadio Mané', 'Mohamed Salah', 'Riyad Mahrez', 'Karim Benzema'],
        correctIndex: 0,
      },
      {
        id: 'aln_9',
        question: 'Tiền vệ trung tâm người Croatia á quân World Cup 2018 nào là đồng đội của Ronaldo tại Al-Nassr?',
        options: ['Luka Modrić', 'Marcelo Brozović', 'Mateo Kovačić', 'Ivan Rakitić'],
        correctIndex: 1,
      },
      {
        id: 'aln_10',
        question: 'Thủ đô nơi đóng quân của CLB Al-Nassr là thành phố nào của Ả Rập Xê Út?',
        options: ['Jeddah', 'Riyadh', 'Dammam', 'Mecca'],
        correctIndex: 1,
      },
      {
        id: 'aln_11',
        question: 'Với việc khoác áo Al-Nassr và ghi bàn đều đặn đến năm 2024–2025, Ronaldo đã vượt qua cột mốc vĩ đại nào của sự nghiệp?',
        options: ['700 bàn chính thức', '800 bàn chính thức', '900 bàn thắng chính thức', '1200 bàn thắng'],
        correctIndex: 2,
      },
      {
        id: 'aln_12',
        question: 'Hai màu áo truyền thống đặc trưng của CLB Al-Nassr là màu gì?',
        options: ['Vàng & Xanh dương', 'Đỏ & Trắng', 'Xanh lá & Trắng', 'Đen & Bạc'],
        correctIndex: 0,
      },
      {
        id: 'aln_13',
        question: 'Ronaldo đeo băng gì ngay từ những trận đấu chính thức đầu tiên cho Al-Nassr?',
        options: ['Băng đội trưởng', 'Băng đội phó', 'Không mang băng', 'Áo số 9'],
        correctIndex: 0,
      },
      {
        id: 'aln_14',
        question: 'Ở Saudi Pro League 2023/24, ngoài 35 bàn thắng, Ronaldo còn có bao nhiêu pha kiến tạo trong 31 lần ra sân?',
        options: ['5 kiến tạo', '11 kiến tạo', '2 kiến tạo', '20 kiến tạo'],
        correctIndex: 1,
      },
    ],
  },
];

export const ronaldoChroniclesPlayers: PlayerCard[] = RONALDO_CHRONICLES_STAGES.map(
  (s) => s.player
);

/**
 * Randomly picks `count` (default 10) distinct questions for the given Ronaldo club stage
 * and shuffles their 4 answer choices while maintaining exact `correctIndex`.
 */
export function pickRandomRonaldoQuestions(
  clubId: RonaldoChronicleClubId,
  count: number = 10
): RonaldoQuizQuestion[] {
  const stage =
    RONALDO_CHRONICLES_STAGES.find((s) => s.clubId === clubId) ??
    RONALDO_CHRONICLES_STAGES[0];
  const pool = [...stage.questionBank];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length)).map((q) => {
    const indexed = q.options.map((opt, idx) => ({
      opt,
      isCorrect: idx === q.correctIndex,
    }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    const nextCorrect = indexed.findIndex((item) => item.isCorrect);
    return {
      id: q.id,
      question: q.question,
      options: [
        indexed[0].opt,
        indexed[1].opt,
        indexed[2].opt,
        indexed[3].opt,
      ] as [string, string, string, string],
      correctIndex: nextCorrect >= 0 ? nextCorrect : 0,
    };
  });
}
