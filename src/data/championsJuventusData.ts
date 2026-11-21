import { PlayerCard } from '../types/game';

export const CHAMPIONS_JUVENTUS_ASSETS = {
  bg: '/assets/aistudio/champions26_BG_CHAMPIONS_JUV_81189821.png',
  logo: '/assets/aistudio/champions26_che_CHAMPIONS_DRAFT_LOGO_0d865102.png',
  btnBg: '/assets/aistudio/champions26_BTN_CHAMPIONS26_4afbb338.png',
  clubLogo: '/assets/aistudio/Juventus_52bc0155.png',
  videoWalkoutIntro:
    '/assets/aistudio/animation_juventus_qu_c_gia__v__tr___c_u_l_c_b__029b7a10.mp4',
  videoStageLoop: '/assets/aistudio/animation_juventus_loop_c223035a.mp4',
  audioWalkoutIntro:
    '/assets/aistudio/_m_thanh_animation_juventus_qu_c_gia__v__tr___c_u_l_c_b__56e07a72.mp3',
  audioStageLoop: '/assets/aistudio/_m_thanh_animation_juventus_loop_8e7e4e43.mp3',
} as const;

const ICON_CREST_URL =
  '/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png';

const makeJuventusCard = (params: {
  id: string;
  name: string;
  ovr: number;
  position: PlayerCard['position'];
  nation: string;
  flagCode: string;
  imageUrl: string;
  isIcon?: boolean;
}): PlayerCard => {
  const { id, name, ovr, position, nation, flagCode, imageUrl, isIcon } = params;
  const baseStat = Math.max(82, ovr - 4);
  const isGk = position === 'GK';
  const isDef = position === 'CB' || position === 'LB' || position === 'RB';
  return {
    id,
    name,
    ovr,
    position,
    club: isIcon ? 'Icons' : 'Juventus',
    clubLogo: isIcon ? ICON_CREST_URL : CHAMPIONS_JUVENTUS_ASSETS.clubLogo,
    nation,
    nationFlag: `https://flagcdn.com/w80/${flagCode}.png`,
    league: isIcon ? 'Icons' : 'Serie A',
    cardType: 'CHAMPIONS_JUVENTUS',
    pac: isGk ? ovr - 8 : isDef ? ovr - 3 : ovr - 1,
    sho: isGk ? ovr - 12 : isDef ? ovr - 14 : ovr - 1,
    pas: isGk ? ovr - 6 : ovr - 2,
    dri: isGk ? ovr - 8 : isDef ? ovr - 7 : ovr,
    def: isGk ? ovr - 14 : isDef ? ovr + 1 : Math.max(55, baseStat - 20),
    phy: isGk ? ovr - 4 : isDef ? ovr - 1 : baseStat,
    avatarUrl: imageUrl,
    customFrameUrl: imageUrl,
    frameIncludesPortrait: true,
    hideOvrAndPos: true,
    frameIsComplete: true,
    skillMoves: isGk ? 1 : ovr >= 102 ? 5 : 4,
    weakFoot: ovr >= 102 ? 5 : 4,
  };
};

// Gói A (1%): Cầu thủ Champions: Juventus 102–106 OVR (CLB: Icons)
export const championsJuventusPoolA: PlayerCard[] = [
  makeJuventusCard({
    id: 'juventus_106_chiellini',
    name: 'Chiellini',
    ovr: 106,
    position: 'CB',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/106_Chiellini_9d033fce.png',
    isIcon: true,
  }),
  makeJuventusCard({
    id: 'juventus_105_buffon',
    name: 'Buffon',
    ovr: 105,
    position: 'GK',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/105_Buffon_97185a75.png',
    isIcon: true,
  }),
  makeJuventusCard({
    id: 'juventus_104_del_piero',
    name: 'Del Piero',
    ovr: 104,
    position: 'CAM',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/104_Del_piero_e343167c.png',
    isIcon: true,
  }),
  makeJuventusCard({
    id: 'juventus_103_pirlo',
    name: 'Pirlo',
    ovr: 103,
    position: 'CM',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/103_Pirlo_28d2b75f.png',
    isIcon: true,
  }),
  makeJuventusCard({
    id: 'juventus_102_nedved',
    name: 'Nedvěd',
    ovr: 102,
    position: 'LW',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/102_Nedved_d1ae206b.png',
    isIcon: true,
  }),
];

// Gói B (25%): Cầu thủ Champions: Juventus 92–101 OVR
export const championsJuventusPoolB: PlayerCard[] = [
  makeJuventusCard({
    id: 'juventus_101_bremer',
    name: 'Bremer',
    ovr: 101,
    position: 'CB',
    nation: 'Brazil',
    flagCode: 'br',
    imageUrl: '/assets/aistudio/101_bremer_d4726ca7.png',
  }),
  makeJuventusCard({
    id: 'juventus_100_kolo_muani',
    name: 'Kolo Muani',
    ovr: 100,
    position: 'CF',
    nation: 'Pháp',
    flagCode: 'fr',
    imageUrl: '/assets/aistudio/100_kolo_muani_8632bb7e.png',
  }),
  makeJuventusCard({
    id: 'juventus_99_yildiz',
    name: 'Yıldız',
    ovr: 99,
    position: 'LW',
    nation: 'Thổ Nhĩ Kỳ',
    flagCode: 'tr',
    imageUrl: '/assets/aistudio/99_yildiz_36b9b980.png',
  }),
  makeJuventusCard({
    id: 'juventus_98_mckennie',
    name: 'McKennie',
    ovr: 98,
    position: 'CM',
    nation: 'Mỹ',
    flagCode: 'us',
    imageUrl: '/assets/aistudio/98_McKennie_3d110567.png',
  }),
  makeJuventusCard({
    id: 'juventus_97_kelly',
    name: 'Kelly',
    ovr: 97,
    position: 'CB',
    nation: 'Anh',
    flagCode: 'gb-eng',
    imageUrl: '/assets/aistudio/97_kelly_d5d1ae8a.png',
  }),
  makeJuventusCard({
    id: 'juventus_96_woltemade',
    name: 'Woltemade',
    ovr: 96,
    position: 'ST',
    nation: 'Đức',
    flagCode: 'de',
    imageUrl: '/assets/aistudio/96_woltemade_d8e4c454.png',
  }),
  makeJuventusCard({
    id: 'juventus_95_pinsoglio',
    name: 'Pinsoglio',
    ovr: 95,
    position: 'GK',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/95_pinsoglio_a5d71829.png',
  }),
  makeJuventusCard({
    id: 'juventus_94_kalulu',
    name: 'Kalulu',
    ovr: 94,
    position: 'CB',
    nation: 'Pháp',
    flagCode: 'fr',
    imageUrl: '/assets/aistudio/94_kalulu_21471bbd.png',
  }),
  makeJuventusCard({
    id: 'juventus_93_thuram',
    name: 'Thuram',
    ovr: 93,
    position: 'CM',
    nation: 'Pháp',
    flagCode: 'fr',
    imageUrl: '/assets/aistudio/93_thuram_f90f8545.png',
  }),
  makeJuventusCard({
    id: 'juventus_92_gatti',
    name: 'Gatti',
    ovr: 92,
    position: 'CB',
    nation: 'Ý',
    flagCode: 'it',
    imageUrl: '/assets/aistudio/92_gatti_571e1ab3.png',
  }),
];

export const championsJuventusAllPlayers: PlayerCard[] = [
  ...championsJuventusPoolA,
  ...championsJuventusPoolB,
];
