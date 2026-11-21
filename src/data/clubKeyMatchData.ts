import { ClubKeyMatchDifficultyId } from '../types/game';

export const DAILY_MAX_CLUB_MATCHES = 2;

export const CLUB_KEY_MATCH_ASSETS = {
  mediumBg: '/assets/aistudio/default_KEYMATCHCUSTOM_MEDIUM_BG_21d60d22.png',
  difficultyBg: '/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_BG__1__87671226.png',
  leftTeamBg: '/assets/aistudio/default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_LEF__1__3994f18d.png',
  rightTeamBg: '/assets/aistudio/default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_RIG_3994f18d.png',
  tileNormal: '/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_TILEBG_NOR_f094d98e.png',
  tilePressed: '/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_TILEBG_PRESS_4d0864c8.png',
  tileSelected: '/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_TILEBG_SEL_8c5b67ca.png',
  clubTokenIcon: '/assets/aistudio/club_token_908dbb4a.png',
  clubFrame: '/assets/aistudio/myteam_FRAME_CLUB_9d6af476.png',
  spinTicketIcon: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  smallSpinTicketIcon: '/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png',
  coinIcon: '/assets/aistudio/currencysmall_COIN_ec777114.png',
} as const;

export interface ClubDifficultyConfig {
  id: ClubKeyMatchDifficultyId;
  label: string;
  subtitle: string;
  opponentOvr: number;
  winTokens: number;
  drawTokens: number;
  lossTokens: number;
  winCoins: number;
  drawCoins: number;
  lossCoins: number;
  accentText: string;
  accentBorder: string;
}

export const CLUB_DIFFICULTIES: ClubDifficultyConfig[] = [
  {
    id: 'amateur',
    label: 'Nghiệp Dư',
    subtitle: 'Mức Dễ · Khởi động nhẹ nhàng',
    opponentOvr: 76,
    winTokens: 80,
    drawTokens: 40,
    lossTokens: 20,
    winCoins: 15000,
    drawCoins: 8000,
    lossCoins: 4000,
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-400/70',
  },
  {
    id: 'professional',
    label: 'Chuyên Nghiệp',
    subtitle: 'Mức Vừa · Cân tài cân sức',
    opponentOvr: 86,
    winTokens: 160,
    drawTokens: 80,
    lossTokens: 35,
    winCoins: 28000,
    drawCoins: 14000,
    lossCoins: 7000,
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-400/70',
  },
  {
    id: 'world_class',
    label: 'Thế Giới',
    subtitle: 'Mức Khó · Cường độ đỉnh cao',
    opponentOvr: 95,
    winTokens: 300,
    drawTokens: 140,
    lossTokens: 60,
    winCoins: 45000,
    drawCoins: 22000,
    lossCoins: 10000,
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400/80',
  },
  {
    id: 'legendary',
    label: 'Huyền Thoại',
    subtitle: 'Cực Khó · Thưởng Token tối đa',
    opponentOvr: 104,
    winTokens: 500,
    drawTokens: 220,
    lossTokens: 90,
    winCoins: 75000,
    drawCoins: 35000,
    lossCoins: 15000,
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-400/85',
  },
];

export interface FeaturedMatchClub {
  id: string;
  name: string;
  shortName: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  baseOvr: number;
  keyPlayers: string[];
}

export interface FeaturedKeyMatchFixture {
  id: string;
  competition: string;
  headline: string;
  stadium: string;
  kickoffLocal: string;
  homeClub: FeaturedMatchClub;
  awayClub: FeaturedMatchClub;
}

export const FEATURED_KEY_MATCHES: FeaturedKeyMatchFixture[] = [
  {
    id: 'key_el_clasico',
    competition: 'LaLiga · Siêu Kinh Điển',
    headline: 'El Clásico Tâm Điểm Hôm Nay',
    stadium: 'Santiago Bernabéu',
    kickoffLocal: '02:00 · Trực tiếp tâm điểm',
    homeClub: {
      id: 'club_real_madrid',
      name: 'Real Madrid',
      shortName: 'RMA',
      country: 'Tây Ban Nha',
      primaryColor: '#FEBE10',
      secondaryColor: '#00529F',
      baseOvr: 94,
      keyPlayers: ['Mbappé', 'Vinícius Jr.', 'Bellingham', 'Valverde', 'Courtois'],
    },
    awayClub: {
      id: 'club_barcelona',
      name: 'FC Barcelona',
      shortName: 'BAR',
      country: 'Tây Ban Nha',
      primaryColor: '#A50044',
      secondaryColor: '#004D98',
      baseOvr: 93,
      keyPlayers: ['Lamine Yamal', 'Lewandowski', 'Raphinha', 'Pedri', 'Cubarsí'],
    },
  },
  {
    id: 'key_epl_titan',
    competition: 'Ngoại Hạng Anh · Đại Chiến Đỉnh Bảng',
    headline: 'Tâm Điểm Ngoại Hạng Anh Hôm Nay',
    stadium: 'Etihad Stadium',
    kickoffLocal: '23:30 · Trực tiếp tâm điểm',
    homeClub: {
      id: 'club_man_city',
      name: 'Manchester City',
      shortName: 'MCI',
      country: 'Anh',
      primaryColor: '#6CABDD',
      secondaryColor: '#1C2C5B',
      baseOvr: 94,
      keyPlayers: ['Haaland', 'De Bruyne', 'Rodri', 'Foden', 'Gvardiol'],
    },
    awayClub: {
      id: 'club_liverpool',
      name: 'Liverpool FC',
      shortName: 'LIV',
      country: 'Anh',
      primaryColor: '#C8102E',
      secondaryColor: '#F6EB61',
      baseOvr: 93,
      keyPlayers: ['Salah', 'Luis Díaz', 'Mac Allister', 'Van Dijk', 'Alisson'],
    },
  },
  {
    id: 'key_ucl_classic',
    competition: 'UEFA Champions League · Tứ Kết Lượt Về',
    headline: 'Đêm Huyền Diệu Châu Âu Hôm Nay',
    stadium: 'Allianz Arena',
    kickoffLocal: '02:00 · Trực tiếp tâm điểm',
    homeClub: {
      id: 'club_bayern',
      name: 'Bayern München',
      shortName: 'BAY',
      country: 'Đức',
      primaryColor: '#DC052D',
      secondaryColor: '#FFFFFF',
      baseOvr: 93,
      keyPlayers: ['Harry Kane', 'Musiala', 'Olise', 'Kimmich', 'Neuer'],
    },
    awayClub: {
      id: 'club_arsenal',
      name: 'Arsenal FC',
      shortName: 'ARS',
      country: 'Anh',
      primaryColor: '#EF0107',
      secondaryColor: '#FFFFFF',
      baseOvr: 92,
      keyPlayers: ['Saka', 'Ødegaard', 'Havertz', 'Declan Rice', 'Saliba'],
    },
  },
  {
    id: 'key_derby_italia',
    competition: 'Serie A · Derby Della Madonnina',
    headline: 'Đại Chiến Thành Milan Hôm Nay',
    stadium: 'San Siro',
    kickoffLocal: '01:45 · Trực tiếp tâm điểm',
    homeClub: {
      id: 'club_inter',
      name: 'Inter Milan',
      shortName: 'INT',
      country: 'Ý',
      primaryColor: '#010E80',
      secondaryColor: '#000000',
      baseOvr: 92,
      keyPlayers: ['Lautaro Martínez', 'Marcus Thuram', 'Barella', 'Bastoni', 'Sommer'],
    },
    awayClub: {
      id: 'club_ac_milan',
      name: 'AC Milan',
      shortName: 'MIL',
      country: 'Ý',
      primaryColor: '#FB090B',
      secondaryColor: '#000000',
      baseOvr: 90,
      keyPlayers: ['Rafael Leão', 'Pulisic', 'Reijnders', 'Theo Hernández', 'Maignan'],
    },
  },
  {
    id: 'key_english_derby',
    competition: 'Ngoại Hạng Anh · Super Sunday',
    headline: 'Đại Chiến Nước Anh Hôm Nay',
    stadium: 'Old Trafford',
    kickoffLocal: '22:30 · Trực tiếp tâm điểm',
    homeClub: {
      id: 'club_man_utd',
      name: 'Manchester United',
      shortName: 'MUN',
      country: 'Anh',
      primaryColor: '#DA291C',
      secondaryColor: '#FBE122',
      baseOvr: 89,
      keyPlayers: ['Bruno Fernandes', 'Garnacho', 'Mainoo', 'Dorgu', 'Onana'],
    },
    awayClub: {
      id: 'club_chelsea',
      name: 'Chelsea FC',
      shortName: 'CHE',
      country: 'Anh',
      primaryColor: '#034694',
      secondaryColor: '#FFFFFF',
      baseOvr: 90,
      keyPlayers: ['Cole Palmer', 'Enzo Fernández', 'Caicedo', 'Pedro Neto', 'Colwill'],
    },
  },
  {
    id: 'key_ucl_psg_juve',
    competition: 'UEFA Champions League · Vòng Phân Hạng',
    headline: 'Tâm Điểm Champions League Hôm Nay',
    stadium: 'Parc des Princes',
    kickoffLocal: '02:00 · Trực tiếp tâm điểm',
    homeClub: {
      id: 'club_psg',
      name: 'Paris Saint-Germain',
      shortName: 'PSG',
      country: 'Pháp',
      primaryColor: '#004170',
      secondaryColor: '#DA291C',
      baseOvr: 92,
      keyPlayers: ['Dembélé', 'Doué', 'Vitinha', 'Hakimi', 'Nuno Mendes'],
    },
    awayClub: {
      id: 'club_juventus',
      name: 'Juventus',
      shortName: 'JUV',
      country: 'Ý',
      primaryColor: '#FFFFFF',
      secondaryColor: '#111827',
      baseOvr: 90,
      keyPlayers: ['Vlahović', 'Yıldız', 'Koopmeiners', 'Bremer', 'Di Gregorio'],
    },
  },
];

/**
 * Deterministically picks today's Featured Key Match based on the 06:00 AM daily cycleKey.
 * Updates automatically every morning at 06:00 AM local time!
 */
export function getDailyFeaturedKeyMatch(cycleKey: string): {
  todayMatch: FeaturedKeyMatchFixture;
  nextMatch: FeaturedKeyMatchFixture;
} {
  let hash = 0;
  for (let i = 0; i < cycleKey.length; i++) {
    hash = (hash * 31 + cycleKey.charCodeAt(i)) >>> 0;
  }
  const idx = hash % FEATURED_KEY_MATCHES.length;
  const nextIdx = (idx + 1) % FEATURED_KEY_MATCHES.length;
  return {
    todayMatch: FEATURED_KEY_MATCHES[idx],
    nextMatch: FEATURED_KEY_MATCHES[nextIdx],
  };
}

export const CLUB_EXCHANGE_ITEMS = {
  spinTicket: {
    id: 'club_ex_ticket_1',
    costTokens: 50,
    ticketAmount: 1,
  },
  thuram102: {
    id: 'toty26_hm_thuram_102',
    costTokens: 5000,
  },
  suker101: {
    id: 'toty26_hm_suker_101',
    costTokens: 3000,
  },
  yamal102: {
    id: 'ballon_dor_yamal_102',
    costTokens: 5000,
  },
  messi102: {
    id: 'ballon_dor_messi_102',
    costTokens: 5000,
  },
  rodri102: {
    id: 'ballon_dor_rodri_102',
    costTokens: 5000,
  },
  mbappe103: {
    id: 'ballon_dor_mbappe_103',
    costTokens: 7000,
  },
  kane104: {
    id: 'ballon_dor_kane_104',
    costTokens: 10000,
  },
} as const;
