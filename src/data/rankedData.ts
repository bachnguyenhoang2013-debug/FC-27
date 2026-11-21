import {
  RankedTierId,
  RankedSeasonState,
  RankedMatchHistoryItem,
} from '../types/game';

/**
 * 18 Untouched User-Uploaded Ranked Assets in /public/assets/aistudio/
 * STRICTLY PRESERVED AS-IS WITHOUT ANY MODIFICATION.
 */
export const RANKED_ASSETS = {
  background: '/assets/aistudio/background___u_x_p_h_ng_696f58f9.png',
  rewardFrame: '/assets/aistudio/khung_hi_n_th__ph_n_th__ng___u_x_p_h_ng_9a3c19b0.png',
  amateur: [
    '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png',
    '/assets/aistudio/logo_t_p_s__c_p_2_d6986a22.png',
    '/assets/aistudio/logo_t_p_s__c_p_3_bbdf7a7d.png',
  ] as [string, string, string],
  pro: [
    '/assets/aistudio/logo_chuy_n_nghi_p_c_p_1_704548f5.png',
    '/assets/aistudio/logo_chuy_n_nghi_p_c_p_2_e3f36fec.png',
    '/assets/aistudio/logo_chuy_n_nghi_p_c_p_3_f9139d8f.png',
  ] as [string, string, string],
  talent: [
    '/assets/aistudio/logo_t_i_n_ng_c_p_1_6834cb78.png',
    '/assets/aistudio/logo_t_i_n_ng_c_p_2_c8f05c26.png',
    '/assets/aistudio/logo_t_i_n_ng_c_p_3_eda08e57.png',
  ] as [string, string, string],
  world: [
    '/assets/aistudio/logo_th__gi_i_c_p_1_793d437a.png',
    '/assets/aistudio/logo_th__gi_i_c_p_2_112d52ac.png',
    '/assets/aistudio/logo_th__gi_i_c_p_3_98ac4c74.png',
  ] as [string, string, string],
  legendary: [
    '/assets/aistudio/logo_huy_n_tho_i_c_p_1_7e85e9bf.png',
    '/assets/aistudio/logo_huy_n_tho_i_c_p_2_b70b3a2b.png',
    '/assets/aistudio/logo_huy_n_tho_i_c_p_3_08905b13.png',
  ] as [string, string, string],
  champion: '/assets/aistudio/logo_nh__v____ch_21db442c.png',
};

export interface RankedTierDefinition {
  id: RankedTierId;
  index: number; // 0..5
  name: string;
  accentText: string;
  accentBorder: string;
  logos: [string, string, string];
  minTotalStars: number;
  botMinOvr: number;
  botMaxOvr: number;
  winGems: number;
  cannotDemote?: boolean;
  uniquePromotionReward: {
    tickets: number;
    gems: number;
  } | null;
}

export const RANKED_TIERS: RankedTierDefinition[] = [
  {
    id: 'amateur',
    index: 0,
    name: 'Tập Sự',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400/50',
    logos: RANKED_ASSETS.amateur,
    minTotalStars: 0,
    botMinOvr: 85,
    botMaxOvr: 90,
    winGems: 400,
    uniquePromotionReward: null,
  },
  {
    id: 'pro',
    index: 1,
    name: 'Chuyên Nghiệp',
    accentText: 'text-slate-200',
    accentBorder: 'border-slate-300/60',
    logos: RANKED_ASSETS.pro,
    minTotalStars: 9,
    botMinOvr: 90,
    botMaxOvr: 95,
    winGems: 400,
    uniquePromotionReward: {
      tickets: 10,
      gems: 1000,
    },
  },
  {
    id: 'talent',
    index: 2,
    name: 'Tài Năng',
    accentText: 'text-yellow-300',
    accentBorder: 'border-yellow-400/65',
    logos: RANKED_ASSETS.talent,
    minTotalStars: 18,
    botMinOvr: 95,
    botMaxOvr: 100,
    winGems: 400,
    uniquePromotionReward: {
      tickets: 10,
      gems: 2000,
    },
  },
  {
    id: 'world',
    index: 3,
    name: 'Thế Giới',
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-400/65',
    logos: RANKED_ASSETS.world,
    minTotalStars: 27,
    botMinOvr: 100,
    botMaxOvr: 105,
    winGems: 400,
    uniquePromotionReward: {
      tickets: 15,
      gems: 5000,
    },
  },
  {
    id: 'legendary',
    index: 4,
    name: 'Huyền Thoại',
    accentText: 'text-fuchsia-300',
    accentBorder: 'border-fuchsia-400/65',
    logos: RANKED_ASSETS.legendary,
    minTotalStars: 36,
    botMinOvr: 105,
    botMaxOvr: 110,
    winGems: 400,
    uniquePromotionReward: {
      tickets: 20,
      gems: 7000,
    },
  },
  {
    id: 'champion',
    index: 5,
    name: 'Nhà Vô Địch',
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-400/75',
    logos: [
      RANKED_ASSETS.champion,
      RANKED_ASSETS.champion,
      RANKED_ASSETS.champion,
    ],
    minTotalStars: 45,
    botMinOvr: 110,
    botMaxOvr: 115,
    winGems: 800,
    cannotDemote: true,
    uniquePromotionReward: {
      tickets: 50,
      gems: 10000,
    },
  },
];

export const CHAMPION_STAR_FLOOR = 45;
export const RANKED_SEASON_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface ResolvedRankInfo {
  tier: RankedTierDefinition;
  tierIndex: number;
  step: 1 | 2 | 3; // 3 bậc trong mỗi cấp độ: Cấp 1 -> Cấp 2 -> Cấp 3
  starsInStep: number; // 0, 1, 2 (hoặc 3 tại Nhà Vô Địch Cấp 3)
  extraChampionStars: number;
  totalStars: number;
  logoUrl: string;
  fullLabel: string;
  shortLabel: string;
  isChampion: boolean;
}

export function createInitialRankedSeasonState(
  seasonNumber: number = 1,
  now: number = Date.now()
): RankedSeasonState {
  return {
    seasonNumber,
    seasonStartedAt: now,
    seasonEndsAt: now + RANKED_SEASON_DURATION_MS,
    totalStars: 0, // Bắt đầu ở Tập sự Cấp 1 (0/3 sao)
    highestStars: 0,
    hasReachedChampion: false,
    claimedTierRewards: [],
    wins: 0,
    draws: 0,
    losses: 0,
    winStreak: 0,
    recentMatches: [],
  };
}

/**
 * Normalizes RankedSeasonState and enforces automatic 30-day season reset back to Tập sự Cấp 1.
 */
export function normalizeRankedSeasonState(
  raw?: RankedSeasonState | null,
  now: number = Date.now()
): RankedSeasonState {
  if (!raw || typeof raw.seasonEndsAt !== 'number') {
    return createInitialRankedSeasonState(1, now);
  }

  // 30-day season expired -> reset season!
  if (now >= raw.seasonEndsAt) {
    const nextSeasonNum = Math.max(1, (raw.seasonNumber ?? 1) + 1);
    return createInitialRankedSeasonState(nextSeasonNum, now);
  }

  const hasReachedChampion = Boolean(
    raw.hasReachedChampion || (raw.totalStars ?? 0) >= CHAMPION_STAR_FLOOR
  );
  const clampedStars = hasReachedChampion
    ? Math.max(CHAMPION_STAR_FLOOR, Math.floor(raw.totalStars ?? CHAMPION_STAR_FLOOR))
    : Math.max(0, Math.floor(raw.totalStars ?? 0));

  return {
    seasonNumber: Math.max(1, raw.seasonNumber ?? 1),
    seasonStartedAt: raw.seasonStartedAt ?? now,
    seasonEndsAt: raw.seasonEndsAt,
    totalStars: clampedStars,
    highestStars: Math.max(clampedStars, raw.highestStars ?? 0),
    hasReachedChampion,
    claimedTierRewards: Array.isArray(raw.claimedTierRewards)
      ? raw.claimedTierRewards
      : [],
    wins: Math.max(0, raw.wins ?? 0),
    draws: Math.max(0, raw.draws ?? 0),
    losses: Math.max(0, raw.losses ?? 0),
    winStreak: Math.max(0, raw.winStreak ?? 0),
    recentMatches: Array.isArray(raw.recentMatches)
      ? raw.recentMatches.slice(0, 15)
      : [],
  };
}

export function resolveRankFromStars(
  rawStars: number,
  hasReachedChampion: boolean = false
): ResolvedRankInfo {
  const effectiveStars = hasReachedChampion
    ? Math.max(CHAMPION_STAR_FLOOR, Math.floor(rawStars))
    : Math.max(0, Math.floor(rawStars));

  if (effectiveStars >= CHAMPION_STAR_FLOOR) {
    const tier = RANKED_TIERS[5]; // Nhà Vô Địch
    const offset = effectiveStars - CHAMPION_STAR_FLOOR;
    let step: 1 | 2 | 3 = 1;
    let starsInStep = 0;
    let extraChampionStars = 0;

    if (offset < 3) {
      step = 1;
      starsInStep = offset;
    } else if (offset < 6) {
      step = 2;
      starsInStep = offset - 3;
    } else {
      step = 3;
      starsInStep = 3;
      extraChampionStars = offset - 6;
    }

    return {
      tier,
      tierIndex: 5,
      step,
      starsInStep,
      extraChampionStars,
      totalStars: effectiveStars,
      logoUrl: RANKED_ASSETS.champion,
      fullLabel:
        extraChampionStars > 0
          ? `${tier.name} · Cấp 3 (+${extraChampionStars}★)`
          : `${tier.name} · Cấp ${step}`,
      shortLabel: `${tier.name} ${step}`,
      isChampion: true,
    };
  }

  // Tiers 0..4 (Tập Sự, Chuyên Nghiệp, Tài Năng, Thế Giới, Huyền Thoại) — 9 stars per tier (3 bậc x 3 sao)
  const tierIndex = Math.min(4, Math.floor(effectiveStars / 9));
  const tier = RANKED_TIERS[tierIndex];
  const rem = effectiveStars % 9;
  const step = (Math.floor(rem / 3) + 1) as 1 | 2 | 3;
  const starsInStep = rem % 3;

  return {
    tier,
    tierIndex,
    step,
    starsInStep,
    extraChampionStars: 0,
    totalStars: effectiveStars,
    logoUrl: tier.logos[step - 1],
    fullLabel: `${tier.name} · Cấp ${step}`,
    shortLabel: `${tier.name} ${step}`,
    isChampion: false,
  };
}

export interface RankedOutcomeSummary {
  nextRankedState: RankedSeasonState;
  prevRank: ResolvedRankInfo;
  nextRank: ResolvedRankInfo;
  starDelta: number;
  protectedAtChampionFloor: boolean;
  winGems: number;
  unlockedPromotionRewards: Array<{
    tierId: RankedTierId;
    tierName: string;
    logoUrl: string;
    tickets: number;
    gems: number;
  }>;
  totalGemsAwarded: number;
  totalTicketsAwarded: number;
  promotedTier: boolean;
  promotedStep: boolean;
  demoted: boolean;
}

export function applyRankedMatchOutcome(
  currentRaw: RankedSeasonState | undefined,
  result: 'W' | 'D' | 'L',
  matchInfo: {
    opponentName: string;
    opponentTeamName: string;
    opponentLogo: string;
    opponentOvr: number;
    isBot: boolean;
    userGoals: number;
    oppGoals: number;
    dateStr: string;
  },
  now: number = Date.now()
): RankedOutcomeSummary {
  const prevState = normalizeRankedSeasonState(currentRaw, now);
  const prevRank = resolveRankFromStars(
    prevState.totalStars,
    prevState.hasReachedChampion
  );

  const wasChampion = prevState.hasReachedChampion || prevState.totalStars >= CHAMPION_STAR_FLOOR;

  let nextStars = prevState.totalStars;
  let protectedAtChampionFloor = false;

  if (result === 'W') {
    nextStars = prevState.totalStars + 1;
  } else if (result === 'L') {
    if (wasChampion) {
      if (prevState.totalStars <= CHAMPION_STAR_FLOOR) {
        nextStars = CHAMPION_STAR_FLOOR;
        protectedAtChampionFloor = true;
      } else {
        nextStars = Math.max(CHAMPION_STAR_FLOOR, prevState.totalStars - 1);
      }
    } else {
      nextStars = Math.max(0, prevState.totalStars - 1);
    }
  }

  const nextHasReachedChampion = wasChampion || nextStars >= CHAMPION_STAR_FLOOR;
  const nextRank = resolveRankFromStars(nextStars, nextHasReachedChampion);
  const starDelta = nextStars - prevState.totalStars;

  // Per-win Gems: 800 if in Nhà Vô Địch, 400 for normal Ranked wins
  const winGems = result === 'W' ? (wasChampion ? 800 : 400) : 0;

  // Check unique one-time promotion rewards for newly reached tiers this season
  const claimedSet = new Set<RankedTierId>(prevState.claimedTierRewards);
  const unlockedPromotionRewards: RankedOutcomeSummary['unlockedPromotionRewards'] = [];

  for (const t of RANKED_TIERS) {
    if (
      t.uniquePromotionReward &&
      t.index <= nextRank.tierIndex &&
      !claimedSet.has(t.id)
    ) {
      claimedSet.add(t.id);
      unlockedPromotionRewards.push({
        tierId: t.id,
        tierName: t.name,
        logoUrl: t.logos[0],
        tickets: t.uniquePromotionReward.tickets,
        gems: t.uniquePromotionReward.gems,
      });
    }
  }

  const promoTickets = unlockedPromotionRewards.reduce((sum, r) => sum + r.tickets, 0);
  const promoGems = unlockedPromotionRewards.reduce((sum, r) => sum + r.gems, 0);
  const totalGemsAwarded = winGems + promoGems;
  const totalTicketsAwarded = promoTickets;

  const historyItem: RankedMatchHistoryItem = {
    id: `rk_${now}_${Math.random().toString(36).slice(2, 7)}`,
    date: matchInfo.dateStr,
    opponentName: matchInfo.opponentName,
    opponentTeamName: matchInfo.opponentTeamName,
    opponentLogo: matchInfo.opponentLogo,
    opponentOvr: matchInfo.opponentOvr,
    isBot: matchInfo.isBot,
    userGoals: matchInfo.userGoals,
    oppGoals: matchInfo.oppGoals,
    result,
    starDelta,
    gemsEarned: totalGemsAwarded,
    ticketsEarned: totalTicketsAwarded,
  };

  const nextRankedState: RankedSeasonState = {
    ...prevState,
    totalStars: nextStars,
    highestStars: Math.max(prevState.highestStars, nextStars),
    hasReachedChampion: nextHasReachedChampion,
    claimedTierRewards: Array.from(claimedSet),
    wins: prevState.wins + (result === 'W' ? 1 : 0),
    draws: prevState.draws + (result === 'D' ? 1 : 0),
    losses: prevState.losses + (result === 'L' ? 1 : 0),
    winStreak: result === 'W' ? prevState.winStreak + 1 : 0,
    recentMatches: [historyItem, ...prevState.recentMatches].slice(0, 15),
  };

  return {
    nextRankedState,
    prevRank,
    nextRank,
    starDelta,
    protectedAtChampionFloor,
    winGems,
    unlockedPromotionRewards,
    totalGemsAwarded,
    totalTicketsAwarded,
    promotedTier: nextRank.tierIndex > prevRank.tierIndex,
    promotedStep:
      nextRank.tierIndex > prevRank.tierIndex ||
      (nextRank.tierIndex === prevRank.tierIndex && nextRank.step > prevRank.step),
    demoted:
      nextRank.tierIndex < prevRank.tierIndex ||
      (nextRank.tierIndex === prevRank.tierIndex && nextRank.step < prevRank.step),
  };
}

export function formatRankedSeasonCountdown(
  seasonEndsAt: number,
  now: number = Date.now()
): string {
  const diffMs = Math.max(0, seasonEndsAt - now);
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = String(Math.floor((totalSec % 86400) / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSec % 60).padStart(2, '0');
  return `${days} ngày ${hours}:${mins}:${secs}`;
}

export interface GeneratedRankedBot {
  coachName: string;
  teamName: string;
  shortName: string;
  badgeUrl: string;
  ovr: number;
  rankLogoUrl: string;
  rankLabel: string;
  roster: Array<{
    name: string;
    shortName: string;
    pos: string;
    ovr: number;
  }>;
}

const BOT_COACH_NAMES = [
  'HLV Minh Quân',
  'HLV Hoàng Nam',
  'HLV Đức Anh',
  'HLV Quốc Bảo',
  'HLV Tuấn Kiệt',
  'HLV Gia Huy',
  'HLV Đăng Khoa',
  'HLV Thành Đạt',
  'HLV Nhật Minh',
  'HLV Alex Vũ',
  'HLV Hải Đăng',
  'HLV Trọng Hiếu',
  'HLV Bảo Long',
  'HLV Quang Vinh',
  'HLV Khải Phong',
  'HLV Thiên Ân',
];

const BOT_CLUB_NAMES: Array<{ name: string; short: string }> = [
  { name: 'Sài Gòn Galacticos', short: 'SGG' },
  { name: 'Hà Nội Phượng Hoàng', short: 'HNP' },
  { name: 'Đà Nẵng United', short: 'DNU' },
  { name: 'Royal Dragon FC', short: 'RDF' },
  { name: 'Thăng Long Stars', short: 'TLS' },
  { name: 'Bình Dương Titans', short: 'BDT' },
  { name: 'Hải Phòng Athletic', short: 'HPA' },
  { name: 'Valhalla Eleven', short: 'VLH' },
  { name: 'Cần Thơ Warriors', short: 'CTW' },
  { name: 'Golden Lions VN', short: 'GLV' },
  { name: 'Apex Legends FC', short: 'APX' },
  { name: 'Nha Trang Mariners', short: 'NTM' },
  { name: 'Stormbreaker XI', short: 'STB' },
  { name: 'Imperial Crown FC', short: 'ICF' },
];

const BOT_LOGO_URLS = [
  'https://crests.football-data.org/57.png',
  'https://crests.football-data.org/65.png',
  'https://crests.football-data.org/64.png',
  'https://crests.football-data.org/61.png',
  'https://crests.football-data.org/66.png',
  'https://crests.football-data.org/86.png',
  'https://crests.football-data.org/81.png',
  'https://crests.football-data.org/5.png',
  'https://crests.football-data.org/524.png',
  'https://crests.football-data.org/108.png',
  'https://crests.football-data.org/98.png',
  'https://crests.football-data.org/4.png',
  '/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png',
  '/assets/aistudio/POTM_LaLiga_Card_8bfc3918.png',
];

const BOT_PLAYER_SURNAMES: Record<string, string[]> = {
  LW: ['Vinícius Jr', 'Nico Williams', 'Mbappé', 'Raphinha', 'Gakpo', 'Leão'],
  ST: ['Haaland', 'Harry Kane', 'Ronaldo', 'Lautaro', 'Isak', 'Gyökeres'],
  RW: ['Lamine Yamal', 'Salah', 'Saka', 'Bale', 'Olise', 'Foden'],
  CM1: ['Bellingham', 'Musiala', 'De Bruyne', 'Pedri', 'Wirtz', 'Olmo'],
  CDM: ['Rodri', 'Kanté', 'Declan Rice', 'Valverde', 'Xhaka', 'Tchouaméni'],
  CM2: ['Kroos', 'Fabián Ruiz', 'Cole Palmer', 'Modrić', 'Barella', 'Vitinha'],
  LB: ['Theo Hernández', 'Cucurella', 'Davies', 'Grimaldo', 'Dimarco', 'Gvardiol'],
  CB1: ['Van Dijk', 'Saliba', 'Rüdiger', 'Akanji', 'Bastoni', 'Gabriel'],
  CB2: ['Maldini', 'Ruben Dias', 'Guéhi', 'De Vrij', 'Araujo', 'Militao'],
  RB: ['Kyle Walker', 'Carvajal', 'Hakimi', 'Alexander-Arnold', 'Koundé', 'Frimpong'],
  GK: ['Courtois', 'Maignan', 'Mamardashvili', 'Donnarumma', 'Alisson', 'Diogo Costa'],
};

/**
 * Generates a Ranked Bot for the player's current tier (reduced by 5 OVR):
 * - Tập sự (tierIndex 0): random OVR 85–90
 * - Each higher tier: +5 OVR (Chuyên nghiệp 90–95, Tài năng 95–100, Thế giới 100–105, Huyền thoại 105–110, Nhà vô địch 110–115)
 * - Random coach name, club name, and club crest logo.
 */
export function generateRandomRankedBot(
  tierIndex: number,
  step: 1 | 2 | 3 = 1
): GeneratedRankedBot {
  const safeTierIdx = Math.max(0, Math.min(5, tierIndex));
  const tier = RANKED_TIERS[safeTierIdx];
  const minOvr = tier.botMinOvr;
  const maxOvr = tier.botMaxOvr;
  const botOvr =
    minOvr + Math.floor(Math.random() * (maxOvr - minOvr + 1));

  const coachName =
    BOT_COACH_NAMES[Math.floor(Math.random() * BOT_COACH_NAMES.length)];
  const clubPick =
    BOT_CLUB_NAMES[Math.floor(Math.random() * BOT_CLUB_NAMES.length)];
  const badgeUrl =
    BOT_LOGO_URLS[Math.floor(Math.random() * BOT_LOGO_URLS.length)];

  const pickName = (pool: string[]) =>
    pool[Math.floor(Math.random() * pool.length)];

  const slots: Array<{ key: string; pos: string }> = [
    { key: 'LW', pos: 'LW' },
    { key: 'ST', pos: 'ST' },
    { key: 'RW', pos: 'RW' },
    { key: 'CM1', pos: 'CM' },
    { key: 'CDM', pos: 'CDM' },
    { key: 'CM2', pos: 'CM' },
    { key: 'LB', pos: 'LB' },
    { key: 'CB1', pos: 'CB' },
    { key: 'CB2', pos: 'CB' },
    { key: 'RB', pos: 'RB' },
    { key: 'GK', pos: 'GK' },
  ];

  const roster = slots.map((s) => {
    const full = pickName(BOT_PLAYER_SURNAMES[s.key] || ['Star']);
    const variance = Math.floor(Math.random() * 3) - 1; // -1..+1 around botOvr
    return {
      name: full,
      shortName: full.split(' ').pop() || full,
      pos: s.pos,
      ovr: Math.max(80, botOvr + variance),
    };
  });

  const botStep = ([1, 2, 3] as const)[
    Math.min(2, Math.max(0, step - 1))
  ];

  return {
    coachName,
    teamName: clubPick.name,
    shortName: clubPick.short,
    badgeUrl,
    ovr: botOvr,
    rankLogoUrl: tier.logos[botStep - 1],
    rankLabel: `${tier.name} · Cấp ${botStep}`,
    roster,
  };
}
