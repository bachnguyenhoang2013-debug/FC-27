export type PixelHairStyle =
  | 'short'
  | 'fade'
  | 'curly'
  | 'afro'
  | 'long'
  | 'ponytail'
  | 'bald'
  | 'spiky';

export interface PixelPlayerData {
  skinTone: string;
  hairTone: string;
  hairStyle: PixelHairStyle;
  hairLabel: string;
  bootTone: string;
  bootLabel: string;
  hasBeard?: boolean;
  hasHeadband?: boolean;
  headbandColor?: string;
  jerseyNumber: number;
  skillMoveName: string;
  heightScale: number;
}

export interface PixelPlayerStatsSummary extends PixelPlayerData {
  apexSpeedMs: number;
  rouletteBasePct: number;
}

interface CuratedPixelPreset {
  skinTone: string;
  hairTone: string;
  hairStyle: PixelHairStyle;
  hairLabel: string;
  bootTone: string;
  bootLabel: string;
  hasBeard?: boolean;
  hasHeadband?: boolean;
  headbandColor?: string;
  jerseyNumber?: number;
}

const CURATED_PRESETS: Array<{ match: string[]; preset: CuratedPixelPreset }> = [
  {
    match: ['ronaldinho'],
    preset: {
      skinTone: '#c68642',
      hairTone: '#18181b',
      hairStyle: 'ponytail',
      hairLabel: 'Tóc xoăn buộc đuôi ngựa',
      bootTone: '#facc15',
      bootLabel: 'Vàng Tiempo',
      hasHeadband: true,
      headbandColor: '#f8fafc',
      jerseyNumber: 10,
    },
  },
  {
    match: ['mbappe', 'mbappé'],
    preset: {
      skinTone: '#8d5524',
      hairTone: '#18181b',
      hairStyle: 'fade',
      hairLabel: 'Cắt Fade gọn',
      bootTone: '#fb7185',
      bootLabel: 'Hồng Mercurial',
      jerseyNumber: 9,
    },
  },
  {
    match: ['garrincha'],
    preset: {
      skinTone: '#c68642',
      hairTone: '#18181b',
      hairStyle: 'short',
      hairLabel: 'Tóc cổ điển rẽ ngôi',
      bootTone: '#09090b',
      bootLabel: 'Đen Cổ Điển',
      jerseyNumber: 7,
    },
  },
  {
    match: ['haaland'],
    preset: {
      skinTone: '#f5cfa0',
      hairTone: '#eab308',
      hairStyle: 'ponytail',
      hairLabel: 'Tóc vàng buộc sau',
      bootTone: '#38bdf8',
      bootLabel: 'Xanh Băng',
      jerseyNumber: 9,
    },
  },
  {
    match: ['cristiano ronaldo', 'ronaldo'],
    preset: {
      skinTone: '#e0ac69',
      hairTone: '#18181b',
      hairStyle: 'spiky',
      hairLabel: 'Vuốt dựng CR7',
      bootTone: '#facc15',
      bootLabel: 'Vàng CR7',
      jerseyNumber: 7,
    },
  },
  {
    match: ['messi'],
    preset: {
      skinTone: '#f1c27d',
      hairTone: '#3f2314',
      hairStyle: 'short',
      hairLabel: 'Tóc nâu gọn',
      bootTone: '#facc15',
      bootLabel: 'Vàng F50',
      hasBeard: true,
      jerseyNumber: 10,
    },
  },
  {
    match: ['neymar'],
    preset: {
      skinTone: '#c68642',
      hairTone: '#18181b',
      hairStyle: 'spiky',
      hairLabel: 'Mohawk Kỹ Thuật',
      bootTone: '#4ade80',
      bootLabel: 'Xanh Future',
      jerseyNumber: 10,
    },
  },
  {
    match: ['hakimi'],
    preset: {
      skinTone: '#d69e66',
      hairTone: '#18181b',
      hairStyle: 'fade',
      hairLabel: 'Undercut Fade',
      bootTone: '#38bdf8',
      bootLabel: 'Xanh Tốc Độ',
      jerseyNumber: 2,
    },
  },
  {
    match: ['fullkrug', 'füllkrug'],
    preset: {
      skinTone: '#f1c27d',
      hairTone: '#713f12',
      hairStyle: 'short',
      hairLabel: 'Nâu ngắn cổ điển',
      bootTone: '#f8fafc',
      bootLabel: 'Trắng Copa',
      hasBeard: true,
      jerseyNumber: 11,
    },
  },
  {
    match: ['nicolas jackson', 'jackson'],
    preset: {
      skinTone: '#7c4722',
      hairTone: '#18181b',
      hairStyle: 'fade',
      hairLabel: 'Fade ngắn',
      bootTone: '#38bdf8',
      bootLabel: 'Xanh Neon',
      jerseyNumber: 15,
    },
  },
  {
    match: ['mukhtar'],
    preset: {
      skinTone: '#c68642',
      hairTone: '#18181b',
      hairStyle: 'fade',
      hairLabel: 'Fade có râu quai nón',
      bootTone: '#facc15',
      bootLabel: 'Vàng Predator',
      hasBeard: true,
      jerseyNumber: 10,
    },
  },
  {
    match: ['paredes'],
    preset: {
      skinTone: '#f1c27d',
      hairTone: '#27272a',
      hairStyle: 'short',
      hairLabel: 'Undercut nâu đậm',
      bootTone: '#38bdf8',
      bootLabel: 'Xanh Albiceleste',
      hasBeard: true,
      jerseyNumber: 16,
    },
  },
  {
    match: ['calo'],
    preset: {
      skinTone: '#e0ac69',
      hairTone: '#27272a',
      hairStyle: 'short',
      hairLabel: 'Tóc Ý cắt ngắn',
      bootTone: '#facc15',
      bootLabel: 'Vàng Serie A',
      hasBeard: true,
      jerseyNumber: 4,
    },
  },
  {
    match: ['vinicius', 'vinícius', 'vini jr'],
    preset: {
      skinTone: '#7c4722',
      hairTone: '#18181b',
      hairStyle: 'curly',
      hairLabel: 'Tóc xoăn ngắn',
      bootTone: '#facc15',
      bootLabel: 'Vàng Mercurial',
      jerseyNumber: 7,
    },
  },
  {
    match: ['gullit'],
    preset: {
      skinTone: '#8d5524',
      hairTone: '#18181b',
      hairStyle: 'afro',
      hairLabel: 'Dreadlocks Huyền Thoại',
      bootTone: '#09090b',
      bootLabel: 'Đen Icon',
      hasBeard: true,
      jerseyNumber: 10,
    },
  },
  {
    match: ['pele', 'pelé'],
    preset: {
      skinTone: '#7c4722',
      hairTone: '#18181b',
      hairStyle: 'short',
      hairLabel: 'Tóc ngắn Vua Bóng Đá',
      bootTone: '#09090b',
      bootLabel: 'Đen Cổ Điển',
      jerseyNumber: 10,
    },
  },
  {
    match: ['zidane'],
    preset: {
      skinTone: '#e0ac69',
      hairTone: '#27272a',
      hairStyle: 'bald',
      hairLabel: 'Đầu trọc Huyền Thoại',
      bootTone: '#f8fafc',
      bootLabel: 'Trắng Predator',
      jerseyNumber: 5,
    },
  },
  {
    match: ['van der sar'],
    preset: {
      skinTone: '#f5cfa0',
      hairTone: '#713f12',
      hairStyle: 'short',
      hairLabel: 'Vàng nâu gọn',
      bootTone: '#09090b',
      bootLabel: 'Đen Thủ Môn',
      jerseyNumber: 1,
    },
  },
  {
    match: ['ishowspeed', 'speed'],
    preset: {
      skinTone: '#7c4722',
      hairTone: '#18181b',
      hairStyle: 'afro',
      hairLabel: 'Tóc xoăn Speed',
      bootTone: '#4ade80',
      bootLabel: 'Xanh Welcome',
      jerseyNumber: 7,
    },
  },
  {
    match: ['quang hai', 'quang hải', 'cong phuong', 'công phượng', 'hoang duc', 'hoàng đức', 'tien linh', 'tiến linh', 'van hau', 'văn hậu'],
    preset: {
      skinTone: '#e8b989',
      hairTone: '#18181b',
      hairStyle: 'short',
      hairLabel: 'Tóc đen Việt Nam',
      bootTone: '#ef4444',
      bootLabel: 'Đỏ Sao Vàng',
    },
  },
];

const HAIR_LABEL_MAP: Record<PixelHairStyle, string> = {
  short: 'Cắt ngắn gọn',
  fade: 'Undercut Fade',
  curly: 'Xoăn nghệ sĩ',
  afro: 'Xoăn xù Afro',
  long: 'Tóc dài lãng tử',
  ponytail: 'Buộc đuôi ngựa',
  bald: 'Đầu trọc',
  spiky: 'Vuốt dựng thể thao',
};

const POS_DEFAULT_NUMBERS: Record<string, number> = {
  GK: 1,
  RB: 2,
  LB: 3,
  CB: 4,
  CDM: 6,
  RW: 7,
  CM: 8,
  ST: 9,
  CAM: 10,
  LW: 11,
  CF: 10,
  LM: 11,
  RM: 7,
  LWB: 3,
  RWB: 2,
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const normalizeKey = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function resolvePixelPlayerProfile(input: {
  id?: string;
  cardId?: string;
  name: string;
  position?: string;
  pos?: string;
  ovr: number;
  pac?: number;
  dri?: number;
  skillMoves?: number;
  nation?: string;
  height?: string;
  number?: number;
  pixelData?: Partial<PixelPlayerData>;
}): PixelPlayerStatsSummary {
  const pac = input.pac ?? input.ovr;
  const dri = input.dri ?? input.ovr;
  const ovr = input.ovr ?? 85;
  const skillMoves = input.skillMoves ?? 3;
  const posStr = (input.position || input.pos || 'CM').toUpperCase();

  // Exact Đấu Đỉnh Cao speed & Roulette duel base % matching apexMatchEngine.ts
  const apexSpeedMs = Number(
    clamp(4.9 + (pac - 60) * 0.12 + (ovr - 75) * 0.072, 4.9, 12.6).toFixed(1)
  );
  const atkSkillRating =
    dri * 0.52 + pac * 0.18 + ovr * 0.30 + (skillMoves - 3) * 5.5;
  const rouletteBasePct = Math.round(
    clamp(0.54 + (atkSkillRating - 88) * 0.015, 0.22, 0.91) * 100
  );

  // Height scale (168cm -> 0.95, 180cm -> 1.0, 195cm -> 1.07)
  let heightScale = 1.0;
  if (input.height) {
    const cmMatch = input.height.match(/(\d{3})/);
    if (cmMatch) {
      const cm = parseInt(cmMatch[1], 10);
      heightScale = Number(clamp(0.94 + ((cm - 165) / 35) * 0.14, 0.94, 1.08).toFixed(2));
    }
  }

  const nameLower = (input.name || '').toLowerCase();
  const nameNorm = normalizeKey(input.name || '');

  // Check curated stars first
  let matchedPreset: CuratedPixelPreset | undefined;
  for (const entry of CURATED_PRESETS) {
    if (entry.match.some((kw) => nameLower.includes(kw) || nameNorm.includes(normalizeKey(kw)))) {
      matchedPreset = entry.preset;
      break;
    }
  }

  const seedStr = input.cardId || input.id || input.name || 'fc_player';
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const hairTones = ['#18181b', '#27272a', '#451a03', '#713f12', '#d4d4d8'];
  const fallbackStyles: PixelHairStyle[] = ['short', 'fade', 'curly', 'spiky', 'short', 'fade'];

  const nationLower = (input.nation || '').toLowerCase();
  let defaultSkin = skinTones[seed % skinTones.length];
  let defaultHairTone = hairTones[(seed >> 2) % hairTones.length];
  let defaultHairStyle = fallbackStyles[(seed >> 4) % fallbackStyles.length];

  if (
    nationLower.includes('việt') ||
    nationLower.includes('vietnam') ||
    nationLower.includes('hàn') ||
    nationLower.includes('nhật')
  ) {
    defaultSkin = '#e8b989';
    defaultHairTone = '#18181b';
    defaultHairStyle = 'short';
  } else if (
    nationLower.includes('na uy') ||
    nationLower.includes('đan mạch') ||
    nationLower.includes('thụy') ||
    nationLower.includes('hà lan') ||
    nationLower.includes('anh') ||
    nationLower.includes('đức')
  ) {
    defaultSkin = seed % 2 === 0 ? '#f5cfa0' : '#f1c27d';
    defaultHairTone = seed % 3 === 0 ? '#eab308' : '#713f12';
  } else if (
    nationLower.includes('senegal') ||
    nationLower.includes('cameroon') ||
    nationLower.includes('nigeria') ||
    nationLower.includes('bờ biển ngà')
  ) {
    defaultSkin = '#7c4722';
    defaultHairTone = '#18181b';
    defaultHairStyle = seed % 2 === 0 ? 'fade' : 'curly';
  }

  const defaultBoot =
    ovr >= 103
      ? { color: '#facc15', label: 'Vàng Siêu Sao' }
      : ovr >= 98
      ? { color: '#38bdf8', label: 'Xanh Băng UTOTY' }
      : { color: '#09090b', label: 'Đen Cổ Điển' };

  const skinTone = input.pixelData?.skinTone || matchedPreset?.skinTone || defaultSkin;
  const hairStyle =
    input.pixelData?.hairStyle || matchedPreset?.hairStyle || defaultHairStyle;
  const hairTone = input.pixelData?.hairTone || matchedPreset?.hairTone || defaultHairTone;
  const hairLabel =
    input.pixelData?.hairLabel || matchedPreset?.hairLabel || HAIR_LABEL_MAP[hairStyle];
  const bootTone = input.pixelData?.bootTone || matchedPreset?.bootTone || defaultBoot.color;
  const bootLabel = input.pixelData?.bootLabel || matchedPreset?.bootLabel || defaultBoot.label;
  const jerseyNumber =
    input.number ||
    input.pixelData?.jerseyNumber ||
    matchedPreset?.jerseyNumber ||
    POS_DEFAULT_NUMBERS[posStr] ||
    ((seed % 29) + 2);

  return {
    skinTone,
    hairTone,
    hairStyle,
    hairLabel,
    bootTone,
    bootLabel,
    hasBeard: input.pixelData?.hasBeard ?? matchedPreset?.hasBeard ?? false,
    hasHeadband: input.pixelData?.hasHeadband ?? matchedPreset?.hasHeadband ?? false,
    headbandColor:
      input.pixelData?.headbandColor ?? matchedPreset?.headbandColor ?? '#f8fafc',
    jerseyNumber,
    skillMoveName:
      input.pixelData?.skillMoveName ||
      (posStr === 'GK' ? 'Đẩy bóng nhanh' : 'Roulette 360°'),
    heightScale: input.pixelData?.heightScale ?? heightScale,
    apexSpeedMs,
    rouletteBasePct,
  };
}
