import { ExtraTimePickOption, PlayerCard } from '../types/game';
import { totyFeaturedPlayers } from './mockData';
import { getMarketBuyPrice } from '../components/TransferMarketModal';

export const EXTRA_TIME_ASSETS = {
  tokenSmall: '/assets/aistudio/currencysmall_hi_p_ph__0bf0c435.png',
  tokenLarge: '/assets/aistudio/currencylarge_hi_p_ph__20b8b201.png',
  bgMain: '/assets/aistudio/background_hi_p_ph__5f2cf3b9.png',
  frameUnpicked: '/assets/aistudio/khung_ph_n_th__ng_1_trong_3_hi_p_ph__ch_a_ch_n_de12c49c.png',
  framePicked: '/assets/aistudio/khung_ph_n_th__ng_1_trong_3_hi_p_ph_____ch_n_52e7bdab.png',
} as const;

export const EXTRA_TIME_QUESTIONS_PER_DAY = 20;
export const EXTRA_TIME_SECONDS_PER_QUESTION = 7;
export const EXTRA_TIME_TOKENS_PER_CORRECT = 500;
export const EXTRA_TIME_GEM_EXCHANGE_TOKENS = 10000;
export const EXTRA_TIME_GEM_EXCHANGE_REWARD = 400;
export const EXTRA_TIME_SHOP_RESET_GEMS = 100;
export const EXTRA_TIME_TOKEN_PACK_GEMS = 50;
export const EXTRA_TIME_TOKEN_PACK_REWARD = 1000;
export const EXTRA_TIME_SPECIAL_PICK_EXTRA_COST = 2500;

export interface PremierLeagueTriviaQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export const PREMIER_LEAGUE_TRIVIA_BANK: PremierLeagueTriviaQuestion[] = [
  {
    id: 'pl_q01',
    question: 'Giải Ngoại Hạng Anh (Premier League) chính thức được thành lập vào năm nào?',
    options: ['1990', '1992', '1994', '1988'],
    correctIndex: 1,
  },
  {
    id: 'pl_q02',
    question: 'Câu lạc bộ nào giành chức vô địch Premier League mùa giải đầu tiên (1992–93)?',
    options: ['Arsenal', 'Blackburn Rovers', 'Manchester United', 'Liverpool'],
    correctIndex: 2,
  },
  {
    id: 'pl_q03',
    question: 'Ai là cầu thủ giữ kỷ lục ghi nhiều bàn thắng nhất lịch sử Premier League (260 bàn)?',
    options: ['Harry Kane', 'Wayne Rooney', 'Alan Shearer', 'Mohamed Salah'],
    correctIndex: 2,
  },
  {
    id: 'pl_q04',
    question: 'Câu lạc bộ nào vô địch Premier League mùa giải 2003–04 với thành tích bất bại (The Invincibles)?',
    options: ['Chelsea', 'Arsenal', 'Manchester United', 'Newcastle United'],
    correctIndex: 1,
  },
  {
    id: 'pl_q05',
    question: 'Cầu thủ nào giữ kỷ lục ghi nhiều bàn nhất trong 1 mùa Premier League (36 bàn, 2022–23)?',
    options: ['Mohamed Salah', 'Erling Haaland', 'Cristiano Ronaldo', 'Alan Shearer'],
    correctIndex: 1,
  },
  {
    id: 'pl_q06',
    question: 'Câu lạc bộ nào gây chấn động lịch sử khi vô địch Premier League 2015–16 với tỷ lệ cược 5000-1?',
    options: ['Leicester City', 'Tottenham Hotspur', 'West Ham United', 'Southampton'],
    correctIndex: 0,
  },
  {
    id: 'pl_q07',
    question: 'HLV nào giành nhiều chức vô địch Premier League nhất lịch sử (13 lần)?',
    options: ['Arsène Wenger', 'Pep Guardiola', 'Sir Alex Ferguson', 'José Mourinho'],
    correctIndex: 2,
  },
  {
    id: 'pl_q08',
    question: 'Sân vận động nào là sân nhà của Liverpool FC?',
    options: ['Old Trafford', 'Anfield', 'Stamford Bridge', 'Goodison Park'],
    correctIndex: 1,
  },
  {
    id: 'pl_q09',
    question: 'Ai là người giữ kỷ lục có nhiều pha kiến tạo nhất lịch sử Premier League (162 kiến tạo)?',
    options: ['Kevin De Bruyne', 'Cesc Fàbregas', 'Ryan Giggs', 'Frank Lampard'],
    correctIndex: 2,
  },
  {
    id: 'pl_q10',
    question: 'Thủ môn nào giữ kỷ lục giữ sạch lưới nhiều trận nhất lịch sử Premier League (202 trận)?',
    options: ['David De Gea', 'Petr Čech', 'Edwin van der Sar', 'Alisson Becker'],
    correctIndex: 1,
  },
  {
    id: 'pl_q11',
    question: 'Đội bóng nào trở thành CLB đầu tiên vô địch Premier League 4 mùa liên tiếp (2020–2024)?',
    options: ['Manchester United', 'Liverpool', 'Chelsea', 'Manchester City'],
    correctIndex: 3,
  },
  {
    id: 'pl_q12',
    question: 'Sân vận động nào được mệnh danh là "Nhà hát của những giấc mơ"?',
    options: ['Emirates Stadium', 'Old Trafford', 'Etihad Stadium', 'Tottenham Hotspur Stadium'],
    correctIndex: 1,
  },
  {
    id: 'pl_q13',
    question: 'Ai là cầu thủ châu Á đầu tiên giành Chiếc Giày Vàng Premier League (mùa 2021–22)?',
    options: ['Park Ji-sung', 'Kaoru Mitoma', 'Son Heung-min', 'Shinji Okazaki'],
    correctIndex: 2,
  },
  {
    id: 'pl_q14',
    question: 'Thierry Henry đã giành tổng cộng bao nhiêu danh hiệu Chiếc Giày Vàng Premier League?',
    options: ['2 lần', '3 lần', '4 lần', '5 lần'],
    correctIndex: 2,
  },
  {
    id: 'pl_q15',
    question: 'Đội bóng nào sở hữu kỷ lục giành 100 điểm trong một mùa giải Premier League (2017–18)?',
    options: ['Liverpool', 'Chelsea', 'Manchester City', 'Arsenal'],
    correctIndex: 2,
  },
  {
    id: 'pl_q16',
    question: 'Ai là cầu thủ ghi bàn thắng "93:20" nổi tiếng giúp Man City vô địch Premier League 2011–12?',
    options: ['Carlos Tévez', 'Sergio Agüero', 'Edin Džeko', 'David Silva'],
    correctIndex: 1,
  },
  {
    id: 'pl_q17',
    question: 'Trận Derby Bắc London là cuộc đối đầu giữa hai CLB nào?',
    options: [
      'Arsenal và Chelsea',
      'Chelsea và Tottenham',
      'Arsenal và Tottenham Hotspur',
      'West Ham và Arsenal',
    ],
    correctIndex: 2,
  },
  {
    id: 'pl_q18',
    question: 'Sân Stamford Bridge là sân nhà của câu lạc bộ nào?',
    options: ['Fulham', 'Chelsea', 'West Ham United', 'Crystal Palace'],
    correctIndex: 1,
  },
  {
    id: 'pl_q19',
    question: 'HLV José Mourinho trong lần đầu dẫn dắt Chelsea (2004–05) giúp đội bóng chỉ thủng lưới bao nhiêu bàn cả mùa?',
    options: ['15 bàn', '20 bàn', '25 bàn', '12 bàn'],
    correctIndex: 0,
  },
  {
    id: 'pl_q20',
    question: 'Ai là cầu thủ trẻ nhất từng ra sân tại Premier League (15 tuổi 181 ngày, Arsenal 2022)?',
    options: ['Harvey Elliott', 'Ethan Nwaneri', 'Wayne Rooney', 'Jude Bellingham'],
    correctIndex: 1,
  },
  {
    id: 'pl_q21',
    question: 'Cristiano Ronaldo đã giành Quả Bóng Vàng đầu tiên (2008) khi đang khoác áo CLB Premier League nào?',
    options: ['Chelsea', 'Arsenal', 'Manchester United', 'Liverpool'],
    correctIndex: 2,
  },
  {
    id: 'pl_q22',
    question: 'Cầu thủ nào giữ kỷ lục ghi bàn ở 11 trận Premier League liên tiếp (mùa 2015–16)?',
    options: ['Ruud van Nistelrooy', 'Jamie Vardy', 'Mohamed Salah', 'Harry Kane'],
    correctIndex: 1,
  },
  {
    id: 'pl_q23',
    question: 'Biệt danh của câu lạc bộ Newcastle United là gì?',
    options: ['The Toffees', 'The Magpies (Chích Chòe)', 'The Hammers', 'The Villans'],
    correctIndex: 1,
  },
  {
    id: 'pl_q24',
    question: 'Tiền vệ nào là đội trưởng vĩ đại của Liverpool nhưng chưa từng vô địch Premier League?',
    options: ['Jordan Henderson', 'Steven Gerrard', 'Xabi Alonso', 'James Milner'],
    correctIndex: 1,
  },
  {
    id: 'pl_q25',
    question: 'Ai là cầu thủ ghi nhiều bàn từ đá phạt trực tiếp nhất lịch sử Premier League (18 bàn)?',
    options: ['James Ward-Prowse', 'Cristiano Ronaldo', 'David Beckham', 'Gianfranco Zola'],
    correctIndex: 2,
  },
  {
    id: 'pl_q26',
    question: 'Tiền vệ nào của Manchester United từng giữ kỷ lục ghi bàn nhanh thứ hai lịch sử cho "Quỷ Đỏ" với 498 trận Premier League?',
    options: ['Roy Keane', 'Paul Scholes', 'Michael Carrick', 'Nemanja Matić'],
    correctIndex: 1,
  },
  {
    id: 'pl_q27',
    question: 'Mỗi mùa giải Premier League chuẩn có bao nhiêu đội tham dự và tổng cộng mấy vòng đấu?',
    options: ['18 đội · 34 vòng', '20 đội · 38 vòng', '22 đội · 42 vòng', '20 đội · 36 vòng'],
    correctIndex: 1,
  },
  {
    id: 'pl_q28',
    question: 'Sân vận động Goodison Park là sân nhà lâu đời của CLB thành phố Liverpool nào?',
    options: ['Liverpool', 'Everton', 'Tranmere Rovers', 'Aston Villa'],
    correctIndex: 1,
  },
  {
    id: 'pl_q29',
    question: 'Ai đã ghi bàn thắng nhanh nhất lịch sử Premier League (7,69 giây, Southampton vs Watford 2019)?',
    options: ['Shane Long', 'Alan Shearer', 'Christian Eriksen', 'Philip Billing'],
    correctIndex: 0,
  },
  {
    id: 'pl_q30',
    question: 'Mohamed Salah cùng CLB nào giành 4 danh hiệu Chiếc Giày Vàng Premier League (2018, 2019, 2022, 2025)?',
    options: ['Chelsea', 'Manchester City', 'Liverpool', 'Arsenal'],
    correctIndex: 2,
  },
];

export function pickRandomPremierLeagueQuestions(
  count: number = EXTRA_TIME_QUESTIONS_PER_DAY
): PremierLeagueTriviaQuestion[] {
  const pool = [...PREMIER_LEAGUE_TRIVIA_BANK];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * Computes Extra Time Token price as Transfer Market Coin Price / 40.
 */
export function getExtraTimeMarketTokenPrice(player: PlayerCard): number {
  const marketCoins = getMarketBuyPrice(player);
  return Math.max(1, Math.round(marketCoins / 40));
}

function getEligiblePoolForTier(tier: 'C' | 'B' | 'A'): PlayerCard[] {
  const seen = new Set<string>();
  const eligible = totyFeaturedPlayers.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    if (p.isUntradeableOnly || p.isExchangeExclusive) return false;
    if (p.cardType === 'WELCOME') return false;
    if (tier === 'C') return p.ovr < 90;
    if (tier === 'B') return p.ovr >= 90 && p.ovr <= 99;
    return p.ovr >= 100;
  });
  if (eligible.length > 0) return eligible;
  return totyFeaturedPlayers.filter((p) => !p.isUntradeableOnly && !p.isExchangeExclusive);
}

function pickRandomUnusedPlayer(tier: 'C' | 'B' | 'A', usedIds: Set<string>): PlayerCard {
  const pool = getEligiblePoolForTier(tier);
  const unused = pool.filter((p) => !usedIds.has(p.id));
  const source = unused.length > 0 ? unused : pool;
  const chosen = source[Math.floor(Math.random() * source.length)] || totyFeaturedPlayers[0];
  usedIds.add(chosen.id);
  return chosen;
}

/**
 * Daily 1-of-3 Extra Time Pick:
 * - 95% Pack C (OVR < 90)
 * - 5% Pack B (OVR 90-99)
 */
export function rollDailyExtraTimePickOptions(): ExtraTimePickOption[] {
  const usedIds = new Set<string>();
  const options: ExtraTimePickOption[] = [];

  for (let i = 0; i < 3; i++) {
    const roll = Math.random() * 100;
    const tier: 'C' | 'B' = roll < 95 ? 'C' : 'B';
    const player = pickRandomUnusedPlayer(tier, usedIds);
    options.push({
      id: `et_daily_${Date.now()}_${i}_${player.id}`,
      kind: 'player',
      packTierLabel: tier === 'B' ? 'Gói B' : 'Gói C',
      playerId: player.id,
      label: `${player.name} (${player.ovr} OVR)`,
    });
  }
  return options;
}

/**
 * Special 1-of-3 Extra Time Pick:
 * - 20% 20,000 Coin
 * - 20% 100 Mảnh Trao Đổi (totyShards)
 * - 20% 50,000 Coin
 * - 39% Cầu Thủ Gói B (90-99 OVR)
 * - 1% Cầu Thủ Gói A (100+ OVR)
 */
export function rollSpecialExtraTimePickOptions(): ExtraTimePickOption[] {
  const usedIds = new Set<string>();
  const usedResources = new Set<string>();
  const options: ExtraTimePickOption[] = [];

  for (let i = 0; i < 3; i++) {
    const roll = Math.random() * 100;
    if (roll < 20) {
      if (!usedResources.has('coins_20k')) {
        usedResources.add('coins_20k');
        options.push({
          id: `et_spec_${Date.now()}_${i}_coins20k`,
          kind: 'coins',
          amount: 20000,
          label: '20.000 Xu',
        });
        continue;
      }
    }
    if (roll < 40) {
      if (!usedResources.has('shards_100')) {
        usedResources.add('shards_100');
        options.push({
          id: `et_spec_${Date.now()}_${i}_shards100`,
          kind: 'shards',
          amount: 100,
          label: '100 Mảnh Trao Đổi',
        });
        continue;
      }
    }
    if (roll < 60) {
      if (!usedResources.has('coins_50k')) {
        usedResources.add('coins_50k');
        options.push({
          id: `et_spec_${Date.now()}_${i}_coins50k`,
          kind: 'coins',
          amount: 50000,
          label: '50.000 Xu',
        });
        continue;
      }
    }
    if (roll < 99) {
      const player = pickRandomUnusedPlayer('B', usedIds);
      options.push({
        id: `et_spec_${Date.now()}_${i}_${player.id}`,
        kind: 'player',
        packTierLabel: 'Gói B',
        playerId: player.id,
        label: `${player.name} (${player.ovr} OVR)`,
      });
    } else {
      const player = pickRandomUnusedPlayer('A', usedIds);
      options.push({
        id: `et_spec_${Date.now()}_${i}_${player.id}`,
        kind: 'player',
        packTierLabel: 'Gói A',
        playerId: player.id,
        label: `${player.name} (${player.ovr} OVR)`,
      });
    }
  }
  return options;
}

/**
 * Draws random Transfer Market players across OVR tiers for the Extra Time Shop
 * (price in Extra Time Tokens = Market Coin Price / 40).
 */
export function rollRandomMarketScoutPlayers(ownedIds: Set<string>, count: number = 6): PlayerCard[] {
  const seen = new Set<string>();
  const marketPool = totyFeaturedPlayers.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    if (p.isUntradeableOnly || p.isExchangeExclusive || p.cardType === 'WELCOME') return false;
    return !ownedIds.has(p.id);
  });

  const fallbackPool =
    marketPool.length >= count
      ? marketPool
      : totyFeaturedPlayers.filter((p) => !p.isUntradeableOnly && !p.isExchangeExclusive);

  const buckets = [
    fallbackPool.filter((p) => p.ovr <= 79),
    fallbackPool.filter((p) => p.ovr >= 80 && p.ovr <= 85),
    fallbackPool.filter((p) => p.ovr >= 86 && p.ovr <= 89),
    fallbackPool.filter((p) => p.ovr >= 90 && p.ovr <= 94),
    fallbackPool.filter((p) => p.ovr >= 95 && p.ovr <= 99),
    fallbackPool.filter((p) => p.ovr >= 100),
  ];

  const picked: PlayerCard[] = [];
  const pickedIds = new Set<string>();

  for (const bucket of buckets) {
    if (picked.length >= count) break;
    const avail = bucket.filter((p) => !pickedIds.has(p.id));
    if (avail.length > 0) {
      const p = avail[Math.floor(Math.random() * avail.length)];
      picked.push(p);
      pickedIds.add(p.id);
    }
  }

  while (picked.length < count && pickedIds.size < fallbackPool.length) {
    const avail = fallbackPool.filter((p) => !pickedIds.has(p.id));
    if (avail.length === 0) break;
    const p = avail[Math.floor(Math.random() * avail.length)];
    picked.push(p);
    pickedIds.add(p.id);
  }

  return picked;
}
