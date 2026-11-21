import { PlayerCard, TicketSpinTheme } from '../types/game';
import { PackTier } from '../components/PackOpeningModal';

export interface PlayerOddsItem {
  player: PlayerCard;
  weight: number;
  percent: number;
}

export interface TierOddsBracket {
  label: string;
  ovrRange: string;
  percent: number;
  color: string;
  badge: string;
}

/**
 * Filters base TOTY/UTOTY pool (excludes special event themes).
 */
export function filterTotyBasePool(allPlayers: PlayerCard[]): PlayerCard[] {
  return allPlayers.filter(
    (p) =>
      !p.isExchangeExclusive &&
      !p.isUntradeableOnly &&
      p.cardType !== 'FUTURE_STARS' &&
      p.cardType !== 'LALIGA' &&
      p.cardType !== 'EURO_2024' &&
      p.cardType !== 'CONMEBOL_LIBERTADORES' &&
      p.cardType !== 'GINGA' &&
      p.cardType !== 'GINGA_ICON' &&
      p.cardType !== 'BUNDESLIGA' &&
      p.cardType !== 'CHAMPIONS_JUVENTUS' &&
      p.cardType !== 'BALLON_DOR' &&
      p.cardType !== 'RONALDO_CHRONICLES' &&
      p.cardType !== 'VIETNAM_CHRONICLES' &&
      p.cardType !== 'WELCOME'
  );
}

export type NationalOfferCountry =
  | 'FRANCE'
  | 'ARGENTINA'
  | 'NETHERLANDS'
  | 'ITALY'
  | 'SPAIN'
  | 'ENGLAND'
  | 'BRAZIL'
  | 'PORTUGAL';

/**
 * Filters deduplicated OVR 90-100 pool for National Store Offer Packs.
 */
export function filterNationalOfferPool(
  allPlayers: PlayerCard[],
  country: NationalOfferCountry
): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.isUntradeableOnly ||
      p.cardType === 'VIETNAM_CHRONICLES' ||
      p.ovr < 90 ||
      p.ovr > 100 ||
      seen.has(p.id)
    ) {
      return false;
    }
    const n = (p.nation || '').toLowerCase();
    const matchesNation =
      country === 'FRANCE'
        ? n.includes('pháp') || n.includes('france')
        : country === 'ARGENTINA'
        ? n.includes('argentina')
        : country === 'NETHERLANDS'
        ? n.includes('hà lan') || n.includes('netherlands')
        : country === 'ITALY'
        ? n === 'ý' || n.includes('italy')
        : country === 'SPAIN'
        ? n.includes('tây ban nha') || n.includes('spain')
        : country === 'ENGLAND'
        ? n === 'anh' || n.includes('england')
        : country === 'BRAZIL'
        ? n.includes('brazil')
        : n.includes('bồ đào nha') || n.includes('portugal');
    if (!matchesNation) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters the 3 exclusive Starter 97 OVR Store Pack players (Čech, Florenzi, Ribéry).
 */
export function filterStarter97OfferPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (!p.id.startsWith('starter_97_') || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

const SOUTH_AMERICAN_NATIONS = [
  'argentina',
  'brazil',
  'uruguay',
  'colombia',
  'chile',
  'ecuador',
  'paraguay',
  'peru',
  'venezuela',
  'bolivia',
];

/**
 * Filters deduplicated OVR 90+ South American players for CONMEBOL Libertadores Chapter 4 Pack (300 Tokens).
 */
export function filterSouthAmerica90PlusPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.isUntradeableOnly ||
      p.cardType === 'VIETNAM_CHRONICLES' ||
      p.ovr < 90 ||
      seen.has(p.id)
    )
      return false;
    const nat = (p.nation || '').toLowerCase();
    if (!SOUTH_AMERICAN_NATIONS.some((sa) => nat.includes(sa))) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters deduplicated CONMEBOL Libertadores season cards (102-106 OVR: Hulk, Riquelme, Zé Roberto, Milito, Alexandre Pato).
 */
export function filterConmebolLibertadoresSeasonPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (p.cardType !== 'CONMEBOL_LIBERTADORES' || p.ovr < 102 || p.ovr > 106 || seen.has(p.id)) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters deduplicated Mixed 100-103 OVR players across seasons for Slot 1 of CONMEBOL Libertadores 1 Pack.
 */
export function filterMixed100To103Pool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.isUntradeableOnly ||
      p.cardType === 'CONMEBOL_LIBERTADORES' ||
      p.cardType === 'VIETNAM_CHRONICLES' ||
      p.ovr < 100 ||
      p.ovr > 103 ||
      seen.has(p.id)
    ) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Legacy helper alias returning combined candidates for CONMEBOL Libertadores 1 odds preview.
 */
export function filterConmebol100To103Pool(allPlayers: PlayerCard[]): PlayerCard[] {
  return [
    ...filterConmebolLibertadoresSeasonPool(allPlayers),
    ...filterMixed100To103Pool(allPlayers),
  ];
}

/**
 * Filters deduplicated OVR 90-100 pool for Premier League Store Offer Pack.
 */
export function filterPremierLeagueOfferPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.isUntradeableOnly ||
      p.cardType === 'VIETNAM_CHRONICLES' ||
      p.ovr < 90 ||
      p.ovr > 100 ||
      seen.has(p.id)
    ) {
      return false;
    }
    const lg = (p.league || '').toLowerCase();
    if (!lg.includes('premier league')) return false;
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters deduplicated OVR 90-100 pool for Future Stars Store Offer Pack.
 */
export function filterFutureStarsOfferPool(fsPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return fsPlayers.filter((p) => {
    if (p.isExchangeExclusive || p.ovr < 90 || p.ovr > 100 || seen.has(p.id)) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Checks whether a card belongs to Bundesliga (either Bundesliga event or league === 'Bundesliga').
 */
export function isBundesligaCard(player: PlayerCard): boolean {
  if (player.cardType === 'BUNDESLIGA') return true;
  return (player.league || '').toLowerCase().includes('bundesliga');
}

export function isChampionsJuventusCard(player: PlayerCard): boolean {
  return player.cardType === 'CHAMPIONS_JUVENTUS';
}

/**
 * Filters deduplicated Mixed < 91 OVR pool for Bundesliga & Champions: Juventus Spin Pool C (74%).
 */
export function filterBundesligaMixedUnder91Pool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.isUntradeableOnly ||
      p.cardType === 'WELCOME' ||
      p.cardType === 'VIETNAM_CHRONICLES' ||
      p.ovr >= 91 ||
      seen.has(p.id)
    ) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters deduplicated 88+ OVR Bundesliga players for the daily Bundesliga Event 88+ Pack.
 */
export function filterBundesliga88PlusPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.isUntradeableOnly ||
      p.ovr < 88 ||
      !isBundesligaCard(p) ||
      seen.has(p.id)
    ) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters classic TOTY Icons & UTOTY Icon legends (100-104 OVR).
 */
export function filterTotyIconsPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      (p.cardType !== 'TOTY_ICON' && p.cardType !== 'UTOTY_ICON') ||
      seen.has(p.id)
    ) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Filters standard TOTY cards strictly from 104 OVR downwards (cardType === 'TOTY', ovr <= 104, non-Icon).
 */
export function filterNormalTotyPool(allPlayers: PlayerCard[]): PlayerCard[] {
  const seen = new Set<string>();
  return allPlayers.filter((p) => {
    if (
      p.isExchangeExclusive ||
      p.cardType !== 'TOTY' ||
      p.ovr > 104 ||
      seen.has(p.id)
    ) {
      return false;
    }
    seen.add(p.id);
    return true;
  });
}

/**
 * Calculates drop weight inversely proportional to OVR:
 * Higher OVR = Much Lower Weight = Lower Drop Chance.
 */
export function calculatePlayerWeight(player: PlayerCard, minOvr: number, maxOvr: number): number {
  const span = Math.max(1, maxOvr - minOvr + 1);
  const diff = Math.max(1, maxOvr + 1 - player.ovr);
  const normalized = diff / span;
  const weight = Math.max(1, Math.round(1000 * Math.pow(normalized, 2.6)));
  return weight;
}

/**
 * Compute odds for a given pack tier and player pool
 */
export function calculatePackOdds(
  pool: PlayerCard[],
  tier: PackTier,
  packTheme: TicketSpinTheme = 'UTOTY'
): {
  items: PlayerOddsItem[];
  brackets: TierOddsBracket[];
  totalWeight: number;
} {
  if (pool.length === 0) {
    return { items: [], brackets: [], totalWeight: 0 };
  }

  const minOvr = Math.min(...pool.map((p) => p.ovr));
  const maxOvr = Math.max(...pool.map((p) => p.ovr));

  const weightedList = pool.map((p) => ({
    player: p,
    weight: calculatePlayerWeight(p, minOvr, maxOvr),
  }));

  const totalWeight = weightedList.reduce((acc, cur) => acc + cur.weight, 0);

  const items: PlayerOddsItem[] = weightedList
    .map((item) => ({
      ...item,
      percent: totalWeight > 0 ? Number(((item.weight / totalWeight) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.player.ovr - a.player.ovr);

  const sumPct = (arr: PlayerOddsItem[]) =>
    Number(arr.reduce((acc, cur) => acc + cur.percent, 0).toFixed(1));

  let brackets: TierOddsBracket[] = [];

  if (
    tier === 'A' ||
    tier === 'MIXED_100_PLUS' ||
    tier === 'GINGA_100_OVR' ||
    tier === 'GINGA_92_106' ||
    tier === 'GINGA_PACK_A' ||
    tier === 'BUNDESLIGA_88_PLUS'
  ) {
    if (tier === 'BUNDESLIGA_88_PLUS') {
      const tier102_106 = items.filter((i) => i.player.ovr >= 102);
      const tier95_101 = items.filter((i) => i.player.ovr >= 95 && i.player.ovr <= 101);
      const tier88_94 = items.filter((i) => i.player.ovr < 95);

      brackets = [
        ...(tier102_106.length > 0
          ? [
              {
                label: 'Siêu Sao Bundesliga Đỉnh Cao',
                ovrRange: 'OVR 102 - 106',
                percent: sumPct(tier102_106),
                color: 'text-red-300 border-red-400/60 bg-red-500/20',
                badge: 'CỰC HIẾM · BUNDESLIGA',
              },
            ]
          : []),
        ...(tier95_101.length > 0
          ? [
              {
                label: 'Ngôi Sao Bundesliga Hàng Đầu',
                ovrRange: 'OVR 95 - 101',
                percent: sumPct(tier95_101),
                color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
                badge: 'RẤT HIẾM · BUNDESLIGA',
              },
            ]
          : []),
        ...(tier88_94.length > 0
          ? [
              {
                label: 'Cầu Thủ Bundesliga 88 - 94 OVR',
                ovrRange: 'OVR 88 - 94',
                percent: sumPct(tier88_94),
                color: 'text-rose-200 border-rose-400/45 bg-rose-500/10',
                badge: 'PACK BUNDESLIGA 88+',
              },
            ]
          : []),
      ];
    } else if (tier === 'A' && packTheme === 'CHAMPIONS_JUVENTUS') {
      const tier105_106 = items.filter((i) => i.player.ovr >= 105);
      const tier102_104 = items.filter((i) => i.player.ovr >= 102 && i.player.ovr <= 104);

      brackets = [
        {
          label: 'Huyền Thoại Champions: Juventus (Chiellini · Buffon)',
          ovrRange: 'OVR 105 - 106',
          percent: sumPct(tier105_106),
          color: 'text-yellow-300 border-yellow-400/60 bg-amber-500/20',
          badge: 'CỰC HIẾM · GÓI A JUVENTUS',
        },
        {
          label: 'Biểu Tượng Champions: Juventus (Del Piero · Pirlo · Nedvěd)',
          ovrRange: 'OVR 102 - 104',
          percent: sumPct(tier102_104),
          color: 'text-amber-200 border-amber-400/55 bg-zinc-900/70',
          badge: 'RẤT HIẾM · WALKOUT JUVENTUS',
        },
      ];
    } else if (tier === 'A' && packTheme === 'BUNDESLIGA') {
      const tier105_106 = items.filter((i) => i.player.ovr >= 105);
      const tier102_104 = items.filter((i) => i.player.ovr >= 102 && i.player.ovr <= 104);

      brackets = [
        {
          label: 'Siêu Sao Bundesliga Tối Thượng (Kimmich · Olise)',
          ovrRange: 'OVR 105 - 106',
          percent: sumPct(tier105_106),
          color: 'text-yellow-300 border-yellow-400/60 bg-red-500/20',
          badge: 'CỰC HIẾM · GÓI A BUNDESLIGA',
        },
        {
          label: 'Ngôi Sao Bundesliga Gói A (Mittelstädt · Kane · Nusa)',
          ovrRange: 'OVR 102 - 104',
          percent: sumPct(tier102_104),
          color: 'text-red-300 border-red-400/55 bg-red-500/15',
          badge: 'RẤT HIẾM · WALKOUT BUNDESLIGA',
        },
      ];
    } else if (tier === 'GINGA_100_OVR' || tier === 'GINGA_92_106' || tier === 'GINGA_PACK_A') {
      const tier105_106 = items.filter((i) => i.player.ovr >= 105);
      const tier102_104 = items.filter((i) => i.player.ovr >= 102 && i.player.ovr <= 104);
      const tierLower = items.filter((i) => i.player.ovr < 102);

      brackets = [
        {
          label: 'Ginga Icons Đỉnh Cao (Kaká · Mascherano)',
          ovrRange: 'OVR 105 - 106',
          percent: sumPct(tier105_106),
          color: 'text-yellow-300 border-yellow-400/55 bg-yellow-500/15',
          badge: 'CỰC HIẾM · GÓI A GINGA',
        },
        {
          label: 'Ngôi Sao Ginga Gói A (Valverde · Caicedo · Martinelli)',
          ovrRange: 'OVR 102 - 104',
          percent: sumPct(tier102_104),
          color: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/15',
          badge: 'RẤT HIẾM · WALKOUT GINGA',
        },
        ...(tierLower.length > 0
          ? [
              {
                label: 'Cầu Thủ Nam Mỹ Ginga Bổ Sung',
                ovrRange: tier === 'GINGA_100_OVR' ? 'OVR 100 - 101' : 'OVR 92 - 101',
                percent: sumPct(tierLower),
                color: 'text-lime-200 border-lime-400/45 bg-lime-500/10',
                badge: 'GÓI B NAM MỸ GINGA',
              },
            ]
          : []),
      ];
    } else if (tier === 'MIXED_100_PLUS') {
      const tier103_104 = items.filter((i) => i.player.ovr >= 103);
      const tier101_102 = items.filter((i) => i.player.ovr >= 101 && i.player.ovr <= 102);
      const tier100 = items.filter((i) => i.player.ovr === 100);

      brackets = [
        {
          label: 'Siêu Sao Hỗn Hợp Đa Mùa Đỉnh Cao',
          ovrRange: 'OVR 103 - 104',
          percent: sumPct(tier103_104),
          color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
          badge: 'CỰC HIẾM · WALKOUT',
        },
        {
          label: 'Siêu Sao Hỗn Hợp Đa Mùa Hàng Đầu',
          ovrRange: 'OVR 101 - 102',
          percent: sumPct(tier101_102),
          color: 'text-purple-300 border-purple-400/50 bg-purple-500/15',
          badge: 'RẤT HIẾM · WALKOUT',
        },
        {
          label: 'Ngôi Sao Hỗn Hợp Đa Mùa 100 OVR',
          ovrRange: 'OVR 100',
          percent: sumPct(tier100),
          color: 'text-cyan-300 border-cyan-400/45 bg-cyan-500/10',
          badge: 'CÓ ANIMATION',
        },
      ];
    } else if (packTheme === 'FUTURE_STARS') {
      const tier102Plus = items.filter((i) => i.player.ovr >= 102);
      const tier100_101 = items.filter((i) => i.player.ovr >= 100 && i.player.ovr <= 101);
      const tier98_99 = items.filter((i) => i.player.ovr >= 98 && i.player.ovr <= 99);
      const tierLower = items.filter((i) => i.player.ovr <= 97);

      brackets = [
        {
          label: 'Siêu Sao Future Stars Tối Thượng',
          ovrRange: 'OVR 102 - 104',
          percent: sumPct(tier102Plus),
          color: 'text-fuchsia-300 border-fuchsia-400/50 bg-fuchsia-500/15',
          badge: 'CỰC HIẾM',
        },
        {
          label: 'Thần Đồng Future Stars 100+',
          ovrRange: 'OVR 100 - 101',
          percent: sumPct(tier100_101),
          color: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/15',
          badge: 'RẤT HIẾM',
        },
        {
          label: 'Ngôi Sao Trẻ Đột Phá',
          ovrRange: 'OVR 98 - 99',
          percent: sumPct(tier98_99),
          color: 'text-sky-300 border-sky-400/40 bg-sky-500/10',
          badge: 'HIẾM',
        },
        {
          label: 'Future Stars Tiêu Biểu',
          ovrRange: 'OVR 96 - 97',
          percent: sumPct(tierLower),
          color: 'text-indigo-200 border-indigo-400/40 bg-indigo-500/10',
          badge: 'CÓ ANIMATION',
        },
      ];
    } else if (packTheme === 'TOTY') {
      const tier103_104 = items.filter((i) => i.player.ovr >= 103 && i.player.ovr <= 104);
      const tier101_102 = items.filter((i) => i.player.ovr >= 101 && i.player.ovr <= 102);
      const tier100 = items.filter((i) => i.player.ovr <= 100);

      brackets = [
        {
          label: 'Siêu Sao TOTY Bình Thường Đỉnh Cao',
          ovrRange: 'OVR 103 - 104',
          percent: sumPct(tier103_104),
          color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
          badge: 'CỰC HIẾM · WALKOUT',
        },
        {
          label: 'Siêu Sao TOTY Bình Thường Hàng Đầu',
          ovrRange: 'OVR 101 - 102',
          percent: sumPct(tier101_102),
          color: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
          badge: 'RẤT HIẾM · WALKOUT',
        },
        {
          label: 'Ngôi Sao TOTY Bình Thường 100 OVR',
          ovrRange: 'OVR 100',
          percent: sumPct(tier100),
          color: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
          badge: 'HIẾM · WALKOUT',
        },
      ];
    } else if (packTheme === 'GINGA' || packTheme === 'GINGA_W1B') {
      const isWeek1B = packTheme === 'GINGA_W1B';
      const tier105_106 = items.filter((i) => i.player.ovr >= 105);
      const tier102_104 = items.filter((i) => i.player.ovr >= 102 && i.player.ovr <= 104);

      brackets = [
        {
          label: isWeek1B
            ? 'Ginga Tuần 1 B Icons (Pizarro 106 · Marcelo 105)'
            : 'Ginga Icons (Kaká 106 · Mascherano 105)',
          ovrRange: 'OVR 105 - 106',
          percent: sumPct(tier105_106),
          color: 'text-yellow-300 border-yellow-400/55 bg-yellow-500/15',
          badge: 'CỰC HIẾM · GINGA ICONS',
        },
        {
          label: isWeek1B
            ? 'Siêu Sao Ginga Tuần 1 B (Batistuta · Muñoz · Lucas Paquetá)'
            : 'Siêu Sao Gói A Ginga (Valverde · Caicedo · Martinelli)',
          ovrRange: 'OVR 102 - 104',
          percent: sumPct(tier102_104),
          color: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/15',
          badge: 'HIẾM · WALKOUT GINGA',
        },
      ];
    } else {
      // UTOTY & TOTY26_HM Gói A: OVR 100 - 104 (1%)
      const tier103_104 = items.filter((i) => i.player.ovr >= 103);
      const tier101_102 = items.filter((i) => i.player.ovr >= 101 && i.player.ovr <= 102);
      const tier100 = items.filter((i) => i.player.ovr <= 100);

      brackets = [
        {
          label: 'Siêu Huyền Thoại / Icon / TOTY26_HM',
          ovrRange: 'OVR 103 - 104',
          percent: sumPct(tier103_104),
          color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
          badge: 'CỰC HIẾM · WALKOUT',
        },
        {
          label: 'Siêu Sao UTOTY & TOTY26_HM Hàng Đầu',
          ovrRange: 'OVR 101 - 102',
          percent: sumPct(tier101_102),
          color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
          badge: 'RẤT HIẾM · WALKOUT',
        },
        {
          label: 'Ngôi Sao UTOTY & TOTY26_HM 100 OVR',
          ovrRange: 'OVR 100',
          percent: sumPct(tier100),
          color: 'text-blue-300 border-blue-500/40 bg-blue-500/10',
          badge: 'HIẾM · WALKOUT',
        },
      ];
    }
  } else if (tier === 'CONMEBOL_2_102_PLUS') {
    const tier105_106 = items.filter((i) => i.player.ovr >= 105);
    const tier104 = items.filter((i) => i.player.ovr === 104);
    const tier102_103 = items.filter((i) => i.player.ovr >= 102 && i.player.ovr <= 103);

    brackets = [
      {
        label: 'Icons CONMEBOL Đỉnh Cao (Hulk · Maicon · Riquelme · Carlos Alberto)',
        ovrRange: 'OVR 105 - 106',
        percent: sumPct(tier105_106),
        color: 'text-amber-200 border-amber-400/60 bg-amber-500/20',
        badge: 'CỰC HIẾM · WALKOUT LIBERTADORES',
      },
      {
        label: 'Icons CONMEBOL Biểu Tượng (Zé Roberto · Marcelo)',
        ovrRange: 'OVR 104',
        percent: sumPct(tier104),
        color: 'text-yellow-300 border-yellow-400/50 bg-yellow-500/15',
        badge: 'RẤT HIẾM · WALKOUT LIBERTADORES',
      },
      {
        label: 'Icons CONMEBOL Siêu Sao (Milito · Ramires · Pato · Tevez)',
        ovrRange: 'OVR 102 - 103',
        percent: sumPct(tier102_103),
        color: 'text-orange-200 border-orange-400/45 bg-orange-500/12',
        badge: 'CAM KẾT 102+ · WALKOUT LIBERTADORES',
      },
    ];
  } else if (tier === 'CONMEBOL_100_103') {
    brackets = [
      {
        label: 'Thẻ 1: Cầu Thủ Hỗn Hợp Đa Mùa 100–103',
        ovrRange: 'OVR 100 - 103 (100% Nhận 1 Thẻ)',
        percent: 100,
        color: 'text-cyan-200 border-cyan-400/50 bg-cyan-500/12',
        badge: 'CAM KẾT THẺ HỖN HỢP',
      },
      {
        label: 'Thẻ 2: Cầu Thủ CONMEBOL Libertadores 102–106',
        ovrRange: 'OVR 102 - 106 (100% Nhận 1 Thẻ)',
        percent: 100,
        color: 'text-amber-200 border-amber-400/60 bg-amber-500/20',
        badge: 'CAM KẾT MÙA LIBERTADORES',
      },
    ];
  } else if (tier === 'CONMEBOL_SOUTH_AMERICA_90_PLUS') {
    const tier102Plus = items.filter((i) => i.player.ovr >= 102);
    const tier97_101 = items.filter((i) => i.player.ovr >= 97 && i.player.ovr <= 101);
    const tier90_96 = items.filter((i) => i.player.ovr <= 96);

    brackets = [
      {
        label: 'Siêu Sao & Mùa CONMEBOL Libertadores Nam Mỹ',
        ovrRange: 'OVR 102 - 106',
        percent: sumPct(tier102Plus),
        color: 'text-amber-200 border-amber-400/60 bg-amber-500/18',
        badge: 'CỰC HIẾM · WALKOUT',
      },
      {
        label: 'Danh Thủ Nam Mỹ Hàng Đầu',
        ovrRange: 'OVR 97 - 101',
        percent: sumPct(tier97_101),
        color: 'text-yellow-300 border-yellow-400/45 bg-yellow-500/12',
        badge: 'HIẾM · WALKOUT',
      },
      {
        label: 'Tuyển Thủ Nam Mỹ 90+',
        ovrRange: 'OVR 90 - 96',
        percent: sumPct(tier90_96),
        color: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10',
        badge: 'CAM KẾT 90+',
      },
    ];
  } else if (tier === 'STARTER_97') {
    brackets = [
      {
        label: 'Bộ Ba Khởi Đầu: Petr Čech · Florenzi · Ribéry',
        ovrRange: 'OVR 97 (100% Cam Kết)',
        percent: 100,
        color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
        badge: '33.33% MỖI CẦU THỦ · ANIMATION ĐÚNG MÙA',
      },
    ];
  } else if (
    tier === 'STARPASS_95_PLUS' ||
    tier === 'MIXED_83_PLUS' ||
    tier === 'MIXED_86_PLUS' ||
    tier === 'MIXED_90_PLUS' ||
    tier === 'MIXED_94_PLUS' ||
    tier === 'MIXED_98_PLUS'
  ) {
    if (tier === 'STARPASS_95_PLUS') {
      const tier101Plus = items.filter((i) => i.player.ovr >= 101);
      const tier98_100 = items.filter((i) => i.player.ovr >= 98 && i.player.ovr <= 100);
      const tier95_97 = items.filter((i) => i.player.ovr >= 95 && i.player.ovr <= 97);

      brackets = [
        {
          label: 'Siêu Sao Star Pass Đỉnh Cao',
          ovrRange: 'OVR 101 - 104',
          percent: sumPct(tier101Plus),
          color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
          badge: 'CỰC HIẾM · WALKOUT',
        },
        {
          label: 'Ngôi Sao Star Pass Hàng Đầu',
          ovrRange: 'OVR 98 - 100',
          percent: sumPct(tier98_100),
          color: 'text-purple-300 border-purple-400/50 bg-purple-500/15',
          badge: 'RẤT HIẾM · WALKOUT',
        },
        {
          label: 'Tuyển Thủ Star Pass 95+ OVR',
          ovrRange: 'OVR 95 - 97',
          percent: sumPct(tier95_97),
          color: 'text-cyan-300 border-cyan-400/45 bg-cyan-500/12',
          badge: 'CÓ ANIMATION',
        },
      ];
    } else {
      const tier101Plus = items.filter((i) => i.player.ovr >= 101);
      const tier96_100 = items.filter((i) => i.player.ovr >= 96 && i.player.ovr <= 100);
      const tierLower = items.filter((i) => i.player.ovr < 96);

      brackets = [
        ...(tier101Plus.length > 0
          ? [
              {
                label: 'Siêu Sao Hỗn Hợp Đỉnh Cao',
                ovrRange: 'OVR 101+',
                percent: sumPct(tier101Plus),
                color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
                badge: 'CỰC HIẾM · WALKOUT',
              },
            ]
          : []),
        ...(tier96_100.length > 0
          ? [
              {
                label: 'Ngôi Sao Hỗn Hợp Hàng Đầu',
                ovrRange: 'OVR 96 - 100',
                percent: sumPct(tier96_100),
                color: 'text-purple-300 border-purple-400/50 bg-purple-500/15',
                badge: 'RẤT HIẾM · WALKOUT',
              },
            ]
          : []),
        ...(tierLower.length > 0
          ? [
              {
                label: 'Cầu Thủ Hỗn Hợp Nền Tảng',
                ovrRange:
                  tier === 'MIXED_83_PLUS'
                    ? 'OVR 83 - 95'
                    : tier === 'MIXED_86_PLUS'
                    ? 'OVR 86 - 95'
                    : tier === 'MIXED_90_PLUS'
                    ? 'OVR 90 - 95'
                    : tier === 'MIXED_94_PLUS'
                    ? 'OVR 94 - 95'
                    : 'OVR 98+',
                percent: sumPct(tierLower),
                color: 'text-cyan-300 border-cyan-400/45 bg-cyan-500/12',
                badge: 'CHUỖI BALLON D’OR',
              },
            ]
          : []),
      ];
    }
  } else if (tier === 'STARPASS_85_94') {
    const tier92_94 = items.filter((i) => i.player.ovr >= 92 && i.player.ovr <= 94);
    const tier89_91 = items.filter((i) => i.player.ovr >= 89 && i.player.ovr <= 91);
    const tier85_88 = items.filter((i) => i.player.ovr >= 85 && i.player.ovr <= 88);

    brackets = [
      {
        label: 'Ngôi Sao Star Pass Tinh Anh',
        ovrRange: 'OVR 92 - 94',
        percent: sumPct(tier92_94),
        color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
        badge: 'RẤT HIẾM · WALKOUT (90+)',
      },
      {
        label: 'Tuyển Thủ Star Pass Ưu Tú',
        ovrRange: 'OVR 89 - 91',
        percent: sumPct(tier89_91),
        color: 'text-cyan-300 border-cyan-400/45 bg-cyan-500/12',
        badge: 'HIẾM',
      },
      {
        label: 'Cầu Thủ Star Pass 85-88 OVR',
        ovrRange: 'OVR 85 - 88',
        percent: sumPct(tier85_88),
        color: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10',
        badge: 'TIÊU CHUẨN',
      },
    ];
  } else if (
    tier === 'B' ||
    tier === 'MIXED_90_99' ||
    tier === 'FRANCE_90_100' ||
    tier === 'ARGENTINA_90_100' ||
    tier === 'NETHERLANDS_90_100' ||
    tier === 'ITALY_90_100' ||
    tier === 'SPAIN_90_100' ||
    tier === 'ENGLAND_90_100' ||
    tier === 'BRAZIL_90_100' ||
    tier === 'PORTUGAL_90_100' ||
    tier === 'PREMIER_LEAGUE_90_100' ||
    tier === 'FUTURE_STARS_90_100'
  ) {
    if (
      tier === 'FRANCE_90_100' ||
      tier === 'ARGENTINA_90_100' ||
      tier === 'NETHERLANDS_90_100' ||
      tier === 'ITALY_90_100' ||
      tier === 'SPAIN_90_100' ||
      tier === 'ENGLAND_90_100' ||
      tier === 'BRAZIL_90_100' ||
      tier === 'PORTUGAL_90_100' ||
      tier === 'PREMIER_LEAGUE_90_100' ||
      tier === 'FUTURE_STARS_90_100'
    ) {
      const offerTitle =
        tier === 'FRANCE_90_100'
          ? 'Pháp'
          : tier === 'ARGENTINA_90_100'
          ? 'Argentina'
          : tier === 'NETHERLANDS_90_100'
          ? 'Hà Lan'
          : tier === 'ITALY_90_100'
          ? 'Italy'
          : tier === 'SPAIN_90_100'
          ? 'Tây Ban Nha'
          : tier === 'ENGLAND_90_100'
          ? 'Anh'
          : tier === 'BRAZIL_90_100'
          ? 'Brazil'
          : tier === 'PORTUGAL_90_100'
          ? 'Bồ Đào Nha'
          : tier === 'PREMIER_LEAGUE_90_100'
          ? 'Premier League'
          : 'Future Stars';
      const tier98_100 = items.filter((i) => i.player.ovr >= 98);
      const tier94_97 = items.filter((i) => i.player.ovr >= 94 && i.player.ovr <= 97);
      const tier90_93 = items.filter((i) => i.player.ovr <= 93);

      brackets = [
        {
          label: `Siêu Sao ${offerTitle} Đỉnh Cao`,
          ovrRange: 'OVR 98 - 100',
          percent: sumPct(tier98_100),
          color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
          badge: 'CỰC HIẾM · ANIMATION GÓI B',
        },
        {
          label: `Ngôi Sao ${offerTitle} Hàng Đầu`,
          ovrRange: 'OVR 94 - 97',
          percent: sumPct(tier94_97),
          color: 'text-sky-300 border-sky-400/45 bg-sky-500/12',
          badge: 'HIẾM · ANIMATION GÓI B',
        },
        {
          label: `Tuyển Thủ ${offerTitle} Tinh Anh`,
          ovrRange: 'OVR 90 - 93',
          percent: sumPct(tier90_93),
          color: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10',
          badge: 'ANIMATION CẦU THỦ GÓI B',
        },
      ];
    } else if (tier === 'MIXED_90_99') {
      const tier97_99 = items.filter((i) => i.player.ovr >= 97);
      const tier94_96 = items.filter((i) => i.player.ovr >= 94 && i.player.ovr <= 96);
      const tier90_93 = items.filter((i) => i.player.ovr <= 93);

      brackets = [
        {
          label: 'Siêu Sao Hỗn Hợp Đa Mùa Cận Đỉnh',
          ovrRange: 'OVR 97 - 99',
          percent: sumPct(tier97_99),
          color: 'text-amber-300 border-amber-400/50 bg-amber-500/15',
          badge: 'RẤT HIẾM · WALKOUT',
        },
        {
          label: 'Ngôi Sao Hỗn Hợp Đa Mùa Ưu Tú',
          ovrRange: 'OVR 94 - 96',
          percent: sumPct(tier94_96),
          color: 'text-cyan-300 border-cyan-400/45 bg-cyan-500/12',
          badge: 'HIẾM · WALKOUT',
        },
        {
          label: 'Tuyển Thủ Hỗn Hợp Đa Mùa Tinh Anh',
          ovrRange: 'OVR 90 - 93',
          percent: sumPct(tier90_93),
          color: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10',
          badge: 'CÓ ANIMATION',
        },
      ];
    } else if (packTheme === 'CHAMPIONS_JUVENTUS') {
      const tier98_101 = items.filter((i) => i.player.ovr >= 98);
      const tier95_97 = items.filter((i) => i.player.ovr >= 95 && i.player.ovr <= 97);
      const tier92_94 = items.filter((i) => i.player.ovr <= 94);

      brackets = [
        {
          label: 'Ngôi Sao Champions: Juventus Cận Đỉnh',
          ovrRange: 'OVR 98 - 101',
          percent: sumPct(tier98_101),
          color: 'text-yellow-300 border-yellow-400/55 bg-amber-500/15',
          badge: 'RẤT HIẾM · JUVENTUS',
        },
        {
          label: 'Cầu Thủ Champions: Juventus Ưu Tú',
          ovrRange: 'OVR 95 - 97',
          percent: sumPct(tier95_97),
          color: 'text-amber-200 border-amber-400/45 bg-zinc-900/70',
          badge: 'HIẾM · WALKOUT JUVENTUS',
        },
        {
          label: 'Cầu Thủ Champions: Juventus Tinh Anh',
          ovrRange: 'OVR 92 - 94',
          percent: sumPct(tier92_94),
          color: 'text-zinc-200 border-zinc-400/40 bg-zinc-800/50',
          badge: 'GÓI B · CÓ ANIMATION',
        },
      ];
    } else if (packTheme === 'FUTURE_STARS') {
      const tier94_95 = items.filter((i) => i.player.ovr >= 94);
      const tier92_93 = items.filter((i) => i.player.ovr >= 92 && i.player.ovr <= 93);
      const tier90_91 = items.filter((i) => i.player.ovr <= 91);

      brackets = [
        {
          label: 'Future Stars Tinh Anh Cao Cấp',
          ovrRange: 'OVR 94 - 95',
          percent: sumPct(tier94_95),
          color: 'text-fuchsia-300 border-fuchsia-400/45 bg-fuchsia-500/10',
          badge: 'RẤT HIẾM · ANIMATION',
        },
        {
          label: 'Future Stars Triển Vọng',
          ovrRange: 'OVR 92 - 93',
          percent: sumPct(tier92_93),
          color: 'text-cyan-300 border-cyan-400/45 bg-cyan-500/10',
          badge: 'HIẾM · ANIMATION',
        },
        {
          label: 'Future Stars Khởi Đầu',
          ovrRange: 'OVR 90 - 91',
          percent: sumPct(tier90_91),
          color: 'text-indigo-200 border-indigo-400/40 bg-indigo-500/10',
          badge: 'CÓ ANIMATION',
        },
      ];
    } else if (packTheme === 'BUNDESLIGA') {
      const tier98_101 = items.filter((i) => i.player.ovr >= 98);
      const tier95_97 = items.filter((i) => i.player.ovr >= 95 && i.player.ovr <= 97);
      const tier92_94 = items.filter((i) => i.player.ovr <= 94);

      brackets = [
        {
          label: 'Ngôi Sao Bundesliga Cận Đỉnh',
          ovrRange: 'OVR 98 - 101',
          percent: sumPct(tier98_101),
          color: 'text-yellow-300 border-yellow-400/50 bg-red-500/15',
          badge: 'RẤT HIẾM · BUNDESLIGA',
        },
        {
          label: 'Cầu Thủ Bundesliga Ưu Tú',
          ovrRange: 'OVR 95 - 97',
          percent: sumPct(tier95_97),
          color: 'text-red-300 border-red-400/45 bg-red-500/12',
          badge: 'HIẾM · WALKOUT BUNDESLIGA',
        },
        {
          label: 'Cầu Thủ Bundesliga Tinh Anh',
          ovrRange: 'OVR 92 - 94',
          percent: sumPct(tier92_94),
          color: 'text-rose-200 border-rose-400/40 bg-rose-500/10',
          badge: 'GÓI B · CÓ ANIMATION',
        },
      ];
    } else if (packTheme === 'GINGA' || packTheme === 'GINGA_W1B') {
      const tier98_101 = items.filter((i) => i.player.ovr >= 98);
      const tier95_97 = items.filter((i) => i.player.ovr >= 95 && i.player.ovr <= 97);
      const tier92_94 = items.filter((i) => i.player.ovr <= 94);

      brackets = [
        {
          label: 'Cầu Thủ Nam Mỹ Ginga Cận Đỉnh',
          ovrRange: 'OVR 98 - 101',
          percent: sumPct(tier98_101),
          color: 'text-yellow-300 border-yellow-400/50 bg-yellow-500/12',
          badge: 'RẤT HIẾM · GINGA NAM MỸ',
        },
        {
          label: 'Cầu Thủ Nam Mỹ Ginga Ưu Tú',
          ovrRange: 'OVR 95 - 97',
          percent: sumPct(tier95_97),
          color: 'text-emerald-300 border-emerald-400/45 bg-emerald-500/12',
          badge: 'HIẾM · WALKOUT GINGA',
        },
        {
          label: 'Cầu Thủ Nam Mỹ Ginga Tinh Anh',
          ovrRange: 'OVR 92 - 94',
          percent: sumPct(tier92_94),
          color: 'text-lime-200 border-lime-400/40 bg-lime-500/10',
          badge: 'GÓI B · CÓ ANIMATION',
        },
      ];
    } else {
      // Gói B UTOTY: OVR 90 - 99 (24%)
      const tier97_99 = items.filter((i) => i.player.ovr >= 97);
      const tier94_96 = items.filter((i) => i.player.ovr >= 94 && i.player.ovr <= 96);
      const tier90_93 = items.filter((i) => i.player.ovr <= 93);

      brackets = [
        {
          label: 'Siêu Sao TOTY Cận Đỉnh',
          ovrRange: 'OVR 97 - 99',
          percent: sumPct(tier97_99),
          color: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
          badge: 'RẤT HIẾM · WALKOUT',
        },
        {
          label: 'Cầu Thủ Ưu Tú TOTY',
          ovrRange: 'OVR 94 - 96',
          percent: sumPct(tier94_96),
          color: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10',
          badge: 'HIẾM · WALKOUT',
        },
        {
          label: 'Cầu Thủ Tinh Anh TOTY',
          ovrRange: 'OVR 90 - 93',
          percent: sumPct(tier90_93),
          color: 'text-slate-300 border-slate-400/40 bg-slate-500/10',
          badge: 'CÓ ANIMATION',
        },
      ];
    }
  } else if (packTheme === 'BUNDESLIGA' || packTheme === 'CHAMPIONS_JUVENTUS') {
    const tier86_90 = items.filter((i) => i.player.ovr >= 86);
    const tier80_85 = items.filter((i) => i.player.ovr >= 80 && i.player.ovr <= 85);
    const tierUnder80 = items.filter((i) => i.player.ovr < 80);

    brackets = [
      {
        label: 'Cầu Thủ Hỗn Hợp 86 - 90 OVR',
        ovrRange: 'OVR 86 - 90',
        percent: sumPct(tier86_90),
        color: 'text-red-300 border-red-400/45 bg-red-500/12',
        badge: 'GÓI C HỖN HỢP',
      },
      {
        label: 'Cầu Thủ Hỗn Hợp 80 - 85 OVR',
        ovrRange: 'OVR 80 - 85',
        percent: sumPct(tier80_85),
        color: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
        badge: 'GÓI C HỖN HỢP',
      },
      {
        label: 'Cầu Thủ Hỗn Hợp Dưới 80 OVR',
        ovrRange: 'OVR 60 - 79',
        percent: sumPct(tierUnder80),
        color: 'text-zinc-300 border-zinc-500/40 bg-zinc-800/40',
        badge: 'PHỔ BIẾN · KHÔNG ANIMATION',
      },
    ];
  } else if (packTheme === 'GINGA' || packTheme === 'GINGA_W1B') {
    const tier87_89 = items.filter((i) => i.player.ovr >= 87);
    const tier84_86 = items.filter((i) => i.player.ovr >= 84 && i.player.ovr <= 86);
    const tierUnder84 = items.filter((i) => i.player.ovr <= 83);

    brackets = [
      {
        label: 'Cầu Thủ Nam Mỹ Ginga 87 - 89 OVR',
        ovrRange: 'OVR 87 - 89',
        percent: sumPct(tier87_89),
        color: 'text-emerald-300 border-emerald-400/45 bg-emerald-500/12',
        badge: 'GÓI C NAM MỸ',
      },
      {
        label: 'Cầu Thủ Nam Mỹ Ginga 84 - 86 OVR',
        ovrRange: 'OVR 84 - 86',
        percent: sumPct(tier84_86),
        color: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
        badge: 'GÓI C NAM MỸ',
      },
      {
        label: 'Cầu Thủ Nam Mỹ Ginga 82 - 83 OVR',
        ovrRange: 'OVR 82 - 83',
        percent: sumPct(tierUnder84),
        color: 'text-lime-200 border-lime-400/40 bg-lime-500/10',
        badge: 'PHỔ BIẾN · KHÔNG ANIMATION',
      },
    ];
  } else {
    // Gói C: Dưới 90 OVR (60 - 89 cho TOTY & EURO 2024; 60 - 80 cho Future Stars/LALIGA) - Không Animation
    const has81Plus = items.some((i) => i.player.ovr >= 81);
    if (has81Plus) {
      const tier85_89 = items.filter((i) => i.player.ovr >= 85);
      const tier80_84 = items.filter((i) => i.player.ovr >= 80 && i.player.ovr <= 84);
      const tier75_79 = items.filter((i) => i.player.ovr >= 75 && i.player.ovr <= 79);
      const tier60_74 = items.filter((i) => i.player.ovr <= 74);

      brackets = [
        {
          label: 'Cầu Thủ TOTY Cao Cấp (Dưới 90)',
          ovrRange: 'OVR 85 - 89',
          percent: sumPct(tier85_89),
          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
          badge: 'HIẾM · KHÔNG ANIMATION',
        },
        {
          label: 'Cầu Thủ Trụ Cột Mùa TOTY',
          ovrRange: 'OVR 80 - 84',
          percent: sumPct(tier80_84),
          color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
          badge: 'KHÁ',
        },
        {
          label: 'Tuyển Thủ Mùa TOTY',
          ovrRange: 'OVR 75 - 79',
          percent: sumPct(tier75_79),
          color: 'text-slate-300 border-slate-400/40 bg-slate-500/10',
          badge: 'TIÊU CHUẨN',
        },
        {
          label: 'Cầu Thủ Mùa TOTY Khởi Đầu',
          ovrRange: 'OVR 60 - 74',
          percent: sumPct(tier60_74),
          color: 'text-zinc-400 border-zinc-600/40 bg-zinc-800/40',
          badge: 'PHỔ BIẾN',
        },
      ];
    } else {
      const tier79_80 = items.filter((i) => i.player.ovr >= 79);
      const tier77_78 = items.filter((i) => i.player.ovr >= 77 && i.player.ovr <= 78);
      const tier75_76 = items.filter((i) => i.player.ovr >= 75 && i.player.ovr <= 76);
      const tier60_74 = items.filter((i) => i.player.ovr <= 74);

      brackets = [
        {
          label: 'Cầu Thủ Mùa TOTY (79 - 80)',
          ovrRange: 'OVR 79 - 80',
          percent: sumPct(tier79_80),
          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
          badge: 'HIẾM',
        },
        {
          label: 'Cầu Thủ Mùa TOTY & Quốc Tế',
          ovrRange: 'OVR 77 - 78',
          percent: sumPct(tier77_78),
          color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
          badge: 'KHÁ',
        },
        {
          label: 'Tuyển Thủ Mùa TOTY',
          ovrRange: 'OVR 75 - 76',
          percent: sumPct(tier75_76),
          color: 'text-slate-300 border-slate-400/40 bg-slate-500/10',
          badge: 'TIÊU CHUẨN',
        },
        {
          label: 'Cầu Thủ Mùa TOTY Khởi Đầu',
          ovrRange: 'OVR 60 - 74',
          percent: sumPct(tier60_74),
          color: 'text-zinc-400 border-zinc-600/40 bg-zinc-800/40',
          badge: 'PHỔ BIẾN',
        },
      ];
    }
  }

  return { items, brackets, totalWeight };
}

/**
 * Weighted random draw algorithm:
 * Picks a player according to weights where higher OVR players have much lower probability.
 */
export function drawWeightedPlayer(pool: PlayerCard[], _tier: PackTier): PlayerCard {
  if (pool.length === 0) {
    throw new Error('Pool cannot be empty');
  }

  const minOvr = Math.min(...pool.map((p) => p.ovr));
  const maxOvr = Math.max(...pool.map((p) => p.ovr));

  const weightedItems = pool.map((p) => ({
    player: p,
    weight: calculatePlayerWeight(p, minOvr, maxOvr),
  }));

  const totalWeight = weightedItems.reduce((acc, cur) => acc + cur.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of weightedItems) {
    if (random < item.weight) {
      return item.player;
    }
    random -= item.weight;
  }

  return pool.reduce((prev, curr) => (prev.ovr < curr.ovr ? prev : curr), pool[0]);
}

/**
 * Official FC Mobile TOTY Ticket Spin Probability distribution:
 * - Gói C (OVR dưới 90): 75% (0.75) -> Không có animation
 * - Gói B (OVR 90 - 99): 24% (0.24) -> Có animation
 * - Gói A (OVR 100 - 104): 1% (0.01) -> Có animation
 */
export const TICKET_PACK_RATES = {
  C: { label: 'Gói C (Dưới 90 OVR)', percent: 75, badge: '75%' },
  B: { label: 'Gói B (90-99 OVR)', percent: 24, badge: '24%' },
  A: { label: 'Gói A (100-104 OVR)', percent: 1, badge: '1%' },
} as const;

/**
 * Rolls the TOTY pack tier when spending a Spin Ticket (Vé Quay):
 * 75% chance of Tier C (< 90 OVR)
 * 24% chance of Tier B (90-99 OVR)
 * 1% chance of Tier A (100-104 OVR)
 */
export function rollTierFromTicket(): PackTier {
  const rand = Math.random() * 100;
  if (rand < 1.0) {
    return 'A'; // 1%
  } else if (rand < 25.0) {
    return 'B'; // 24% (1.0 to 24.999)
  } else {
    return 'C'; // 75% (25.0 to 100.0)
  }
}

/**
 * Rolls both tier and weighted player from TOTY / UTOTY ticket spin:
 * 1. Tier chosen by exact 75% C (<90) / 24% B (90-99) / 1% A (100-104).
 * 2. Player chosen inside UTOTY/TOTY tier by inverse OVR weight.
 */
export function drawPlayerFromTicket(allPlayers: PlayerCard[]): {
  player: PlayerCard;
  tier: PackTier;
} {
  const totyPool = filterTotyBasePool(allPlayers);
  const tier = rollTierFromTicket();
  let pool: PlayerCard[];
  if (tier === 'A') {
    pool = totyPool.filter((p) => p.ovr >= 100 && p.ovr <= 104);
    if (pool.length === 0) pool = totyPool.filter((p) => p.ovr >= 100);
  } else if (tier === 'B') {
    pool = totyPool.filter((p) => p.ovr >= 90 && p.ovr <= 99);
  } else {
    pool = totyPool.filter((p) => p.ovr < 90);
  }

  if (pool.length === 0) pool = totyPool.length > 0 ? totyPool : allPlayers;
  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}

/**
 * Rolls both tier and weighted player from regular TOTY ticket spin (OVR <= 104, non-Icon):
 * - Gói C (75%): Cầu thủ dưới 90 OVR -> Không có animation
 * - Gói B (24%): Cầu thủ TOTY 90-99 OVR
 * - Gói A (1%): Cầu thủ TOTY 100-104 OVR
 */
export function drawNormalTotyFromTicket(allPlayers: PlayerCard[]): {
  player: PlayerCard;
  tier: PackTier;
} {
  const totyPool = filterTotyBasePool(allPlayers);
  const normalToty = filterNormalTotyPool(allPlayers);
  const tier = rollTierFromTicket();
  let pool: PlayerCard[];
  if (tier === 'A') {
    pool = normalToty.filter((p) => p.ovr >= 100 && p.ovr <= 104);
    if (pool.length === 0) pool = totyPool.filter((p) => p.ovr >= 100 && p.ovr <= 104);
  } else if (tier === 'B') {
    pool = normalToty.filter((p) => p.ovr >= 90 && p.ovr <= 99);
    if (pool.length === 0) pool = totyPool.filter((p) => p.ovr >= 90 && p.ovr <= 99);
  } else {
    pool = totyPool.filter((p) => p.ovr < 90);
  }

  if (pool.length === 0) pool = normalToty.length > 0 ? normalToty : totyPool;
  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}

/**
 * Rolls both tier and weighted player from Future Stars ticket spin:
 * - Gói C (80%): Cầu thủ mùa TOTY (OVR 60 - 80) -> Không có animation
 * - Gói B (19%): Cầu thủ Future Stars (OVR 90 - 95) -> Có animation & âm thanh Future Stars
 * - Gói A (1%): Cầu thủ Future Stars (OVR 96 - 104) -> Có animation & âm thanh Future Stars
 */
export function drawFutureStarsFromTicket(
  allPlayers: PlayerCard[],
  futureStarsPool: PlayerCard[]
): {
  player: PlayerCard;
  tier: PackTier;
} {
  const rand = Math.random() * 100;
  const tier: PackTier = rand < 1.0 ? 'A' : rand < 20.0 ? 'B' : 'C';
  const totyPool = filterTotyBasePool(allPlayers);
  let pool: PlayerCard[];

  if (tier === 'A') {
    pool = futureStarsPool.filter((p) => p.ovr >= 96);
    if (pool.length === 0) pool = futureStarsPool;
  } else if (tier === 'B') {
    pool = futureStarsPool.filter((p) => p.ovr >= 90 && p.ovr <= 95);
    if (pool.length === 0) pool = futureStarsPool;
  } else {
    pool = totyPool.filter((p) => p.ovr <= 80);
    if (pool.length === 0) pool = allPlayers.filter((p) => p.ovr <= 80);
  }

  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}

/**
 * Guaranteed Pool B (every 20 spins) or Pool A (every 250 spins) player draw
 * matching the currently selected TicketSpinTheme.
 */
export function drawGuaranteedPoolPlayerForTheme(
  theme: TicketSpinTheme,
  poolGroup: 'A' | 'B',
  allPlayers: PlayerCard[],
  extraPools: {
    futureStarsPool: PlayerCard[];
    gingaPool?: PlayerCard[];
    gingaW1BPool?: PlayerCard[];
    bundesligaPool?: PlayerCard[];
    juventusPool?: PlayerCard[];
  }
): { player: PlayerCard; tier: PackTier } {
  const totyBase = filterTotyBasePool(allPlayers);

  if (poolGroup === 'A') {
    let poolA: PlayerCard[] = [];
    if (theme === 'CHAMPIONS_JUVENTUS') {
      poolA = (extraPools.juventusPool ?? []).filter((p) => p.ovr >= 102 && p.ovr <= 106);
    } else if (theme === 'BUNDESLIGA') {
      poolA = (extraPools.bundesligaPool ?? []).filter((p) => p.ovr >= 102 && p.ovr <= 106);
    } else if (theme === 'GINGA_W1B') {
      poolA = (extraPools.gingaW1BPool ?? []).filter((p) => p.ovr >= 102 && p.ovr <= 106);
    } else if (theme === 'GINGA') {
      poolA = (extraPools.gingaPool ?? []).filter((p) => p.ovr >= 102 && p.ovr <= 106);
    } else if (theme === 'TOTY') {
      poolA = filterNormalTotyPool(allPlayers).filter((p) => p.ovr >= 100 && p.ovr <= 104);
    } else if (theme === 'FUTURE_STARS') {
      poolA = extraPools.futureStarsPool.filter((p) => p.ovr >= 96);
    } else {
      poolA = totyBase.filter((p) => p.ovr >= 100 && p.ovr <= 104);
    }
    if (poolA.length === 0) {
      poolA = totyBase.filter((p) => p.ovr >= 100 && p.ovr <= 104);
    }
    if (poolA.length === 0) {
      poolA = totyBase.length > 0 ? totyBase : allPlayers;
    }
    return {
      player: drawWeightedPlayer(poolA, 'A'),
      tier: 'A',
    };
  }

  let poolB: PlayerCard[] = [];
  if (theme === 'CHAMPIONS_JUVENTUS') {
    poolB = (extraPools.juventusPool ?? []).filter((p) => p.ovr >= 92 && p.ovr <= 101);
  } else if (theme === 'BUNDESLIGA') {
    poolB = (extraPools.bundesligaPool ?? []).filter((p) => p.ovr >= 92 && p.ovr <= 101);
  } else if (theme === 'GINGA_W1B') {
    poolB = (extraPools.gingaW1BPool ?? []).filter((p) => p.ovr >= 92 && p.ovr <= 101);
  } else if (theme === 'GINGA') {
    poolB = (extraPools.gingaPool ?? []).filter((p) => p.ovr >= 92 && p.ovr <= 101);
  } else if (theme === 'FUTURE_STARS') {
    poolB = extraPools.futureStarsPool.filter((p) => p.ovr >= 90 && p.ovr <= 95);
  } else if (theme === 'TOTY') {
    poolB = filterNormalTotyPool(allPlayers).filter((p) => p.ovr >= 90 && p.ovr <= 99);
  } else {
    poolB = totyBase.filter((p) => p.ovr >= 90 && p.ovr <= 99);
  }
  if (poolB.length === 0) {
    poolB = totyBase.filter((p) => p.ovr >= 90 && p.ovr <= 99);
  }
  if (poolB.length === 0) {
    poolB = totyBase.length > 0 ? totyBase : allPlayers;
  }
  return {
    player: drawWeightedPlayer(poolB, 'B'),
    tier: 'B',
  };
}

/**
 * Champions: Juventus Ticket Spin Probability distribution:
 * - Gói A (1%): Cầu thủ Champions: Juventus 102 - 106 OVR
 * - Gói B (25%): Cầu thủ Champions: Juventus 92 - 101 OVR
 * - Gói C (74%): Cầu thủ hỗn hợp dưới 91 OVR (< 91) -> Không có animation
 */
export const CHAMPIONS_JUVENTUS_PACK_RATES = {
  C: { label: 'Gói C (Hỗn Hợp Dưới 91 OVR)', percent: 74, badge: '74%' },
  B: { label: 'Gói B (Champions: Juventus 92-101 OVR)', percent: 25, badge: '25%' },
  A: { label: 'Gói A (Champions: Juventus 102-106 OVR)', percent: 1, badge: '1%' },
} as const;

export function drawChampionsJuventusFromTicket(
  allPlayers: PlayerCard[],
  juventusPool: PlayerCard[]
): {
  player: PlayerCard;
  tier: PackTier;
} {
  const rand = Math.random() * 100;
  const tier: PackTier = rand < 1.0 ? 'A' : rand < 26.0 ? 'B' : 'C';
  let pool: PlayerCard[];

  if (tier === 'A') {
    pool = juventusPool.filter((p) => p.ovr >= 102 && p.ovr <= 106);
    if (pool.length === 0) pool = juventusPool;
  } else if (tier === 'B') {
    pool = juventusPool.filter((p) => p.ovr >= 92 && p.ovr <= 101);
    if (pool.length === 0) pool = juventusPool;
  } else {
    pool = filterBundesligaMixedUnder91Pool(allPlayers);
    if (pool.length === 0) {
      pool = allPlayers.filter(
        (p) =>
          !p.isExchangeExclusive &&
          !p.isUntradeableOnly &&
          p.cardType !== 'WELCOME' &&
          p.cardType !== 'VIETNAM_CHRONICLES' &&
          p.ovr < 91
      );
    }
  }

  if (pool.length === 0) pool = allPlayers;
  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}

/**
 * Bundesliga Ticket Spin Probability distribution:
 * - Gói A (1%): Cầu thủ Bundesliga 102 - 106 OVR
 * - Gói B (25%): Cầu thủ Bundesliga 92 - 101 OVR
 * - Gói C (74%): Cầu thủ hỗn hợp dưới 91 OVR (< 91) -> Không có animation
 */
export const BUNDESLIGA_PACK_RATES = {
  C: { label: 'Gói C (Hỗn Hợp Dưới 91 OVR)', percent: 74, badge: '74%' },
  B: { label: 'Gói B (Bundesliga 92-101 OVR)', percent: 25, badge: '25%' },
  A: { label: 'Gói A (Bundesliga 102-106 OVR)', percent: 1, badge: '1%' },
} as const;

export function drawBundesligaFromTicket(
  allPlayers: PlayerCard[],
  bundesligaPool: PlayerCard[]
): {
  player: PlayerCard;
  tier: PackTier;
} {
  const rand = Math.random() * 100;
  const tier: PackTier = rand < 1.0 ? 'A' : rand < 26.0 ? 'B' : 'C';
  let pool: PlayerCard[];

  if (tier === 'A') {
    pool = bundesligaPool.filter((p) => p.ovr >= 102 && p.ovr <= 106);
    if (pool.length === 0) pool = bundesligaPool;
  } else if (tier === 'B') {
    pool = bundesligaPool.filter((p) => p.ovr >= 92 && p.ovr <= 101);
    if (pool.length === 0) pool = bundesligaPool;
  } else {
    pool = filterBundesligaMixedUnder91Pool(allPlayers);
    if (pool.length === 0) {
      pool = allPlayers.filter(
        (p) =>
          !p.isExchangeExclusive &&
          !p.isUntradeableOnly &&
          p.cardType !== 'WELCOME' &&
          p.cardType !== 'VIETNAM_CHRONICLES' &&
          p.ovr < 91
      );
    }
  }

  if (pool.length === 0) pool = allPlayers;
  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}

export function drawGingaFromTicket(
  allPlayers: PlayerCard[],
  gingaPool: PlayerCard[]
): {
  player: PlayerCard;
  tier: PackTier;
} {
  const rand = Math.random() * 100;
  const tier: PackTier = rand < 1.0 ? 'A' : rand < 25.0 ? 'B' : 'C';
  let pool: PlayerCard[];

  if (tier === 'A') {
    pool = gingaPool.filter((p) => p.ovr >= 102 && p.ovr <= 106);
    if (pool.length === 0) pool = gingaPool;
  } else if (tier === 'B') {
    pool = gingaPool.filter((p) => p.ovr >= 92 && p.ovr <= 101);
    if (pool.length === 0) pool = gingaPool;
  } else {
    pool = gingaPool.filter(
      (p) => !p.isExchangeExclusive && !p.isUntradeableOnly && p.ovr < 90
    );
    if (pool.length === 0) {
      pool = allPlayers.filter(
        (p) =>
          !p.isExchangeExclusive &&
          !p.isUntradeableOnly &&
          p.cardType !== 'WELCOME' &&
          p.cardType !== 'VIETNAM_CHRONICLES' &&
          p.ovr <= 91
      );
    }
  }

  if (pool.length === 0) pool = allPlayers;
  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}

export function drawGingaWeek1BFromTicket(
  allPlayers: PlayerCard[],
  gingaWeek1BPool: PlayerCard[]
): {
  player: PlayerCard;
  tier: PackTier;
} {
  return drawGingaFromTicket(allPlayers, gingaWeek1BPool);
}

export function drawLibertadoresFromTicket(
  allPlayers: PlayerCard[]
): {
  player: PlayerCard;
  tier: PackTier;
} {
  const rand = Math.random() * 100;
  const tier: PackTier = rand < 1.0 ? 'A' : rand < 25.0 ? 'B' : 'C';
  let pool: PlayerCard[];

  const libSeason = filterConmebolLibertadoresSeasonPool(allPlayers);
  if (tier === 'A') {
    pool = libSeason.filter((p) => p.ovr >= 102 && p.ovr <= 106);
    if (pool.length === 0) pool = libSeason;
  } else if (tier === 'B') {
    pool = allPlayers.filter(
      (p) =>
        !p.isExchangeExclusive &&
        !p.isUntradeableOnly &&
        p.cardType !== 'VIETNAM_CHRONICLES' &&
        p.ovr >= 90 &&
        p.ovr <= 101
    );
    if (pool.length === 0) pool = filterSouthAmerica90PlusPool(allPlayers);
  } else {
    pool = allPlayers.filter(
      (p) =>
        !p.isExchangeExclusive &&
        !p.isUntradeableOnly &&
        p.cardType !== 'VIETNAM_CHRONICLES' &&
        p.ovr < 90
    );
  }

  if (pool.length === 0) pool = allPlayers;
  const player = drawWeightedPlayer(pool, tier);
  return { player, tier };
}


