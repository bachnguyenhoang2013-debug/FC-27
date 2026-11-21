import { LibertadoresBasketOffer } from '../types/game';

export interface LibertadoresTriviaQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  fact: string;
}

export interface LibertadoresStreakMilestone {
  rollsRequired: number;
  title: string;
  rewardSummary: string;
  rewards: {
    libertadoresTokens?: number;
    gems?: number;
    coins?: number;
    tickets?: number;
    southAmericaPack90Plus?: boolean;
  };
}

/**
 * Chapter 1 Random Spin Machine Basket Pool:
 * Randomly reveals a shopping basket of Gems (Kim Cương), Spin Tickets (Vé Quay), or Coins (Xu)
 * purchasable for a specific amount of CONMEBOL Libertadores Tokens.
 */
export const LIBERTADORES_RANDOM_BASKET_POOL: Array<
  Omit<LibertadoresBasketOffer, 'purchased'>
> = [
  {
    id: 'basket_gems_600',
    rewardType: 'gems',
    rewardAmount: 600,
    label: 'Giỏ Kim Cương Tinh Anh · 600 Kim Cương',
    costTokens: 60,
  },
  {
    id: 'basket_gems_1500',
    rewardType: 'gems',
    rewardAmount: 1500,
    label: 'Giỏ Kim Cương Vàng · 1.500 Kim Cương',
    costTokens: 130,
  },
  {
    id: 'basket_gems_3000',
    rewardType: 'gems',
    rewardAmount: 3000,
    label: 'Đại Giỏ Kim Cương Libertadores · 3.000 Kim Cương',
    costTokens: 240,
  },
  {
    id: 'basket_tickets_2',
    rewardType: 'tickets',
    rewardAmount: 2,
    label: 'Giỏ Vé Quay Nam Mỹ · 2 Vé Quay',
    costTokens: 75,
  },
  {
    id: 'basket_tickets_4',
    rewardType: 'tickets',
    rewardAmount: 4,
    label: 'Giỏ Vé Quay Huyền Thoại · 4 Vé Quay',
    costTokens: 140,
  },
  {
    id: 'basket_tickets_7',
    rewardType: 'tickets',
    rewardAmount: 7,
    label: 'Đại Giỏ Vé Quay Vô Địch · 7 Vé Quay',
    costTokens: 230,
  },
  {
    id: 'basket_coins_250k',
    rewardType: 'coins',
    rewardAmount: 250000,
    label: 'Giỏ Ngân Sách CLB · 250.000 Xu',
    costTokens: 50,
  },
  {
    id: 'basket_coins_750k',
    rewardType: 'coins',
    rewardAmount: 750000,
    label: 'Giỏ Kho Báu Vàng · 750.000 Xu',
    costTokens: 110,
  },
  {
    id: 'basket_coins_1800k',
    rewardType: 'coins',
    rewardAmount: 1800000,
    label: 'Đại Giỏ Ngân Quỹ Libertadores · 1.800.000 Xu',
    costTokens: 210,
  },
];

export function rollRandomLibertadoresBasket(
  excludeId?: string
): LibertadoresBasketOffer {
  const candidates = LIBERTADORES_RANDOM_BASKET_POOL.filter((b) => b.id !== excludeId);
  const pool = candidates.length > 0 ? candidates : LIBERTADORES_RANDOM_BASKET_POOL;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...picked,
    purchased: false,
  };
}

/**
 * Chapter 3 Daily Trivia Bank:
 * 5 questions per day, 5 seconds per question, +20 Token CONMEBOL Libertadores per correct answer.
 */
export const LIBERTADORES_TRIVIA_BANK: LibertadoresTriviaQuestion[] = [
  {
    id: 'lib_q1',
    question: 'CLB nào đang giữ kỷ lục vô địch CONMEBOL Libertadores nhiều lần nhất lịch sử (7 danh hiệu)?',
    options: ['Boca Juniors', 'Independiente', 'River Plate', 'Peñarol'],
    correctIndex: 1,
    fact: 'CA Independiente (Argentina) giữ kỷ lục 7 lần vô địch và toàn thắng cả 7 trận chung kết.',
  },
  {
    id: 'lib_q2',
    question: 'Giải đấu CONMEBOL Copa Libertadores được tổ chức lần đầu tiên vào năm nào?',
    options: ['1955', '1960', '1964', '1970'],
    correctIndex: 1,
    fact: 'Mùa giải đầu tiên diễn ra năm 1960 với chức vô địch thuộc về Peñarol (Uruguay).',
  },
  {
    id: 'lib_q3',
    question: 'Vua phá lưới vĩ đại nhất mọi thời đại của đấu trường CONMEBOL Libertadores (54 bàn) là ai?',
    options: ['Alberto Spencer', 'Gabriel Barbosa', 'Juan Román Riquelme', 'Pelé'],
    correctIndex: 0,
    fact: 'Huyền thoại người Ecuador Alberto Spencer ghi tới 54 bàn thắng tại Copa Libertadores.',
  },
  {
    id: 'lib_q4',
    question: 'Huyền thoại Pelé đã cùng CLB nào của Brazil 2 lần đăng quang Copa Libertadores (1962, 1963)?',
    options: ['Flamengo', 'Palmeiras', 'Santos', 'São Paulo'],
    correctIndex: 2,
    fact: 'Pelé dẫn dắt Santos thống trị Nam Mỹ hai năm liên tiếp 1962 và 1963.',
  },
  {
    id: 'lib_q5',
    question: 'Trận chung kết lịch sử năm 2018 giữa River Plate và Boca Juniors có tên gọi kinh điển là gì?',
    options: ['El Clásico', 'Superclásico', 'Derby Paulista', 'Clásico del Río'],
    correctIndex: 1,
    fact: 'River Plate đánh bại đại kình địch Boca Juniors trong trận chung kết Superclásico 2018.',
  },
  {
    id: 'lib_q6',
    question: 'CLB nào lần đầu tiên trong lịch sử giành chức vô địch CONMEBOL Libertadores vào năm 2023 tại sân Maracanã?',
    options: ['Fluminense', 'Boca Juniors', 'Athletico Paranaense', 'Internacional'],
    correctIndex: 0,
    fact: 'Fluminense đánh bại Boca Juniors 2-1 sau hiệp phụ ngay tại Maracanã năm 2023.',
  },
  {
    id: 'lib_q7',
    question: 'CLB nào lên ngôi vô địch CONMEBOL Libertadores mùa giải 2024 dù chơi thiếu người từ phút đầu tiên?',
    options: ['Atlético Mineiro', 'Botafogo', 'River Plate', 'Flamengo'],
    correctIndex: 1,
    fact: 'Botafogo thắng Atlético Mineiro 3-1 ở chung kết 2024 để lần đầu lên đỉnh Nam Mỹ.',
  },
  {
    id: 'lib_q8',
    question: 'Từ năm nào trận chung kết CONMEBOL Libertadores chuyển từ thể thức lượt đi - lượt về sang 1 trận duy nhất?',
    options: ['2017', '2019', '2021', '2022'],
    correctIndex: 1,
    fact: 'Chung kết năm 2019 tại Lima (Flamengo thắng River Plate 2-1) là chung kết 1 lượt đầu tiên.',
  },
  {
    id: 'lib_q9',
    question: 'Boca Juniors đã giành được tổng cộng bao nhiêu chức vô địch CONMEBOL Libertadores tính đến nay?',
    options: ['4 lần', '5 lần', '6 lần', '7 lần'],
    correctIndex: 2,
    fact: 'Boca Juniors sở hữu 6 chiếc cúp Libertadores, chỉ xếp sau Independiente (7 lần).',
  },
  {
    id: 'lib_q10',
    question: 'Khẩu hiệu danh giá gắn liền với chiếc cúp vô địch CONMEBOL Libertadores là gì?',
    options: ['La Gloria Eterna', 'Joga Bonito', 'El Sueño Sudamericano', 'Rey de Copas'],
    correctIndex: 0,
    fact: '"La Gloria Eterna" (Vinh Quang Vĩnh Cửu) là khẩu hiệu chính thức của giải đấu.',
  },
  {
    id: 'lib_q11',
    question: 'Quốc gia nào sở hữu tổng số danh hiệu vô địch CONMEBOL Libertadores nhiều nhất cấp CLB?',
    options: ['Uruguay', 'Colombia', 'Argentina & Brazil (cùng dẫn đầu)', 'Chile'],
    correctIndex: 2,
    fact: 'Các CLB Argentina và Brazil tạo nên cuộc đua song mã thống trị bảng vàng Libertadores.',
  },
  {
    id: 'lib_q12',
    question: 'CLB nào của Uruguay từng 5 lần vô địch CONMEBOL Libertadores?',
    options: ['Nacional', 'Peñarol', 'Danubio', 'Defensor Sporting'],
    correctIndex: 1,
    fact: 'Peñarol đã 5 lần bước lên đỉnh vinh quang Nam Mỹ (1960, 1961, 1966, 1982, 1987).',
  },
  {
    id: 'lib_q13',
    question: 'HLV Abel Ferreira đã giúp CLB nào bảo vệ thành công ngôi vương Libertadores 2 mùa liên tiếp 2020 & 2021?',
    options: ['Flamengo', 'Grêmio', 'Palmeiras', 'Corinthians'],
    correctIndex: 2,
    fact: 'Palmeiras vô địch 2 mùa liên tiếp 2020 và 2021 dưới thời HLV Abel Ferreira.',
  },
  {
    id: 'lib_q14',
    question: 'Vòng bảng chính thức của CONMEBOL Libertadores hiện đại có bao nhiêu đội tham dự?',
    options: ['16 đội', '24 đội', '32 đội', '36 đội'],
    correctIndex: 2,
    fact: 'Vòng bảng gồm 32 CLB chia làm 8 bảng đấu (mỗi bảng 4 đội).',
  },
  {
    id: 'lib_q15',
    question: 'CLB Atlético Nacional vô địch Libertadores năm 1989 và 2016 đến từ quốc gia nào?',
    options: ['Colombia', 'Ecuador', 'Paraguay', 'Peru'],
    correctIndex: 0,
    fact: 'Atlético Nacional là niềm tự hào lớn của bóng đá Colombia với 2 chức vô địch Nam Mỹ.',
  },
];

export function pickDailyLibertadoresQuestions(
  cycleKey: string,
  savedIds?: string[]
): LibertadoresTriviaQuestion[] {
  if (savedIds && savedIds.length === 5) {
    const mapped = savedIds
      .map((id) => LIBERTADORES_TRIVIA_BANK.find((q) => q.id === id))
      .filter((q): q is LibertadoresTriviaQuestion => Boolean(q));
    if (mapped.length === 5) return mapped;
  }

  // Deterministic daily shuffle seeded by cycleKey + random salt on first open
  let hash = 0;
  for (let i = 0; i < cycleKey.length; i++) {
    hash = (hash * 31 + cycleKey.charCodeAt(i)) >>> 0;
  }
  const copy = [...LIBERTADORES_TRIVIA_BANK];
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 5);
}

/**
 * Chapter 4 Milestone Streak Track (fed by each daily random roll in Chapter 2):
 * "mỗi lần random sẽ được tính vào chuỗi chương 4"
 */
export const LIBERTADORES_STREAK_MILESTONES: LibertadoresStreakMilestone[] = [
  {
    rollsRequired: 1,
    title: 'Mốc 1 Lần Random',
    rewardSummary: '+100 Token Libertadores',
    rewards: { libertadoresTokens: 100 },
  },
  {
    rollsRequired: 2,
    title: 'Mốc 2 Lần Random',
    rewardSummary: '+600 Kim Cương',
    rewards: { gems: 600 },
  },
  {
    rollsRequired: 3,
    title: 'Mốc 3 Lần Random',
    rewardSummary: '+3 Vé Quay',
    rewards: { tickets: 3 },
  },
  {
    rollsRequired: 5,
    title: 'Mốc 5 Lần Random',
    rewardSummary: '+200 Token & +300.000 Xu',
    rewards: { libertadoresTokens: 200, coins: 300000 },
  },
  {
    rollsRequired: 7,
    title: 'Mốc 7 Lần Random',
    rewardSummary: '+5 Vé Quay & +1.200 Kim Cương',
    rewards: { tickets: 5, gems: 1200 },
  },
  {
    rollsRequired: 10,
    title: 'Mốc 10 Lần Random',
    rewardSummary: 'Pack Nam Mỹ 90+ & +300 Token',
    rewards: { southAmericaPack90Plus: true, libertadoresTokens: 300 },
  },
];

export const SOUTH_AMERICA_90_PACK_COST_TOKENS = 300;
export const TRIVIA_SECONDS_PER_QUESTION = 5;
export const TRIVIA_QUESTIONS_PER_DAY = 5;
export const TRIVIA_TOKENS_PER_CORRECT = 20;
export const CHAPTER_2_REQUIRED_CAREER_MATCHES = 3;
export const CHAPTER_2_MIN_RANDOM_TOKENS = 50;
export const CHAPTER_2_MAX_RANDOM_TOKENS = 150;
