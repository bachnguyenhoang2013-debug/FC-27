import { BundesligaDailyProgress, PlayerCard } from '../types/game';

export const BUNDESLIGA_ASSETS = {
  welcomeImage: '/assets/aistudio/welcome_image_bundesliga_8d3204fb.png',
  eventLogo: '/assets/aistudio/logo_bundesliga_draft_and_event_5b30f34c.png',
  bg1: '/assets/aistudio/background_bundesliga_1_6104f156.jpg',
  bg2: '/assets/aistudio/background_bundesliga_2_1f9b1c9a.jpg',
} as const;

export const BUNDESLIGA_DAILY_GOAL_TARGET = 5;

export function normalizeBundesligaState(
  state: BundesligaDailyProgress | undefined | null,
  cycleKey: string
): BundesligaDailyProgress {
  if (!state || state.cycleKey !== cycleKey) {
    return {
      cycleKey,
      goalsScoredToday: 0,
      rewardClaimedToday: false,
    };
  }
  return {
    cycleKey,
    goalsScoredToday: Math.max(0, Number(state.goalsScoredToday) || 0),
    rewardClaimedToday: Boolean(state.rewardClaimedToday),
  };
}

export function isBundesligaPlayer(card?: Partial<PlayerCard> | null): boolean {
  if (!card) return false;
  if (card.cardType === 'BUNDESLIGA') return true;
  return (card.league || '').toLowerCase().includes('bundesliga');
}

const makeBundesligaCard = (params: {
  id: string;
  name: string;
  ovr: number;
  position: PlayerCard['position'];
  club: string;
  nation: string;
  imageUrl: string;
}): PlayerCard => {
  const { id, name, ovr, position, club, nation, imageUrl } = params;
  const baseStat = Math.max(82, ovr - 4);
  const isGk = position === 'GK';
  const isDef = position === 'CB' || position === 'LB' || position === 'RB';
  return {
    id,
    name,
    ovr,
    position,
    club,
    nation,
    league: 'Bundesliga',
    cardType: 'BUNDESLIGA',
    pac: isGk ? ovr - 8 : isDef ? ovr - 3 : ovr - 1,
    sho: isGk ? ovr - 12 : isDef ? ovr - 14 : ovr - 1,
    pas: isGk ? ovr - 6 : ovr - 2,
    dri: isGk ? ovr - 8 : isDef ? ovr - 7 : ovr,
    def: isGk ? ovr - 14 : isDef ? ovr + 1 : position === 'CDM' ? ovr : Math.max(55, baseStat - 20),
    phy: isGk ? ovr - 4 : isDef ? ovr - 1 : baseStat,
    avatarUrl: imageUrl,
    customFrameUrl: imageUrl,
    frameIncludesPortrait: true,
    hideOvrAndPos: true,
    frameIsComplete: true,
    skillMoves: isGk ? 1 : 4,
    weakFoot: 4,
  };
};

// Gói A (1%): Cầu thủ Bundesliga 102–106 OVR
export const bundesligaPoolA: PlayerCard[] = [
  makeBundesligaCard({
    id: 'bundesliga_106_kimmich',
    name: 'Kimmich',
    ovr: 106,
    position: 'CDM',
    club: 'FC Bayern Munich',
    nation: 'Đức',
    imageUrl: '/assets/aistudio/106_kimmich_77a17b61.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_105_olise',
    name: 'Olise',
    ovr: 105,
    position: 'RW',
    club: 'FC Bayern Munich',
    nation: 'Pháp',
    imageUrl: '/assets/aistudio/105_olise_9a6bd0f5.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_104_mittelstadt',
    name: 'Mittelstädt',
    ovr: 104,
    position: 'LB',
    club: 'VfB Stuttgart',
    nation: 'Đức',
    imageUrl: '/assets/aistudio/104_Mittelstadt_7c906575.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_103_kane',
    name: 'Kane',
    ovr: 103,
    position: 'ST',
    club: 'FC Bayern Munich',
    nation: 'Anh',
    imageUrl: '/assets/aistudio/103_kane_7de12e2c.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_102_nusa',
    name: 'Nusa',
    ovr: 102,
    position: 'LM',
    club: 'RB Leipzig',
    nation: 'Na Uy',
    imageUrl: '/assets/aistudio/102_nusa_d2a32a7a.png',
  }),
];

// Gói B (25%): Cầu thủ Bundesliga 92–101 OVR
export const bundesligaPoolB: PlayerCard[] = [
  makeBundesligaCard({
    id: 'bundesliga_101_schick',
    name: 'Schick',
    ovr: 101,
    position: 'CAM',
    club: 'Bayer Leverkusen',
    nation: 'CH Séc',
    imageUrl: '/assets/aistudio/101_schick_f2772ab0.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_100_gruda',
    name: 'Gruda',
    ovr: 100,
    position: 'CAM',
    club: 'RB Leipzig',
    nation: 'Đức',
    imageUrl: '/assets/aistudio/100_Gruda_9180db9c.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_99_upamecano',
    name: 'Upamecano',
    ovr: 99,
    position: 'CB',
    club: 'FC Bayern Munich',
    nation: 'Pháp',
    imageUrl: '/assets/aistudio/99_upamecano_d992194e.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_98_nmecha',
    name: 'Nmecha',
    ovr: 98,
    position: 'CM',
    club: 'Borussia Dortmund',
    nation: 'Đức',
    imageUrl: '/assets/aistudio/98_nmecha_486700b6.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_97_pavlovic',
    name: 'Pavlovic',
    ovr: 97,
    position: 'CDM',
    club: 'FC Bayern Munich',
    nation: 'Đức',
    imageUrl: '/assets/aistudio/97_pavlovis_21975072.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_96_schlotterbeck',
    name: 'Schlotterbeck',
    ovr: 96,
    position: 'CB',
    club: 'Borussia Dortmund',
    nation: 'Đức',
    imageUrl: '/assets/aistudio/96_schlotterbeck_e0617d1b.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_95_vandevoordt',
    name: 'Vandevoordt',
    ovr: 95,
    position: 'GK',
    club: 'RB Leipzig',
    nation: 'Bỉ',
    imageUrl: '/assets/aistudio/95_Vandevoordt_77541b6a.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_94_nkunku',
    name: 'Nkunku',
    ovr: 94,
    position: 'ST',
    club: 'RB Leipzig',
    nation: 'Pháp',
    imageUrl: '/assets/aistudio/94_nkunku_e611cb3d.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_93_grull',
    name: 'Grüll',
    ovr: 93,
    position: 'LW',
    club: 'Werder Bremen',
    nation: 'Áo',
    imageUrl: '/assets/aistudio/93_grull_d4d660ac.png',
  }),
  makeBundesligaCard({
    id: 'bundesliga_92_aleix_garcia',
    name: 'Aleix García',
    ovr: 92,
    position: 'CM',
    club: 'Bayer Leverkusen',
    nation: 'Tây Ban Nha',
    imageUrl: '/assets/aistudio/92_Aleix_Garcia_6d58e14f.png',
  }),
];

export const bundesligaAllPlayers: PlayerCard[] = [...bundesligaPoolA, ...bundesligaPoolB];
