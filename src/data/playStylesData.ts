import { TacticalPlayStyleId } from '../types/game';

/**
 * Generates a high-resolution 3D brushed-gold diamond PlayStyle+ emblem SVG data URI
 * so PlayStyle icons never break or fail to load anywhere in the application.
 */
function makeGoldPlayStyleBadgeUri(glyphMarkup: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="rimOuter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF9CE"/>
        <stop offset="28%" stop-color="#F6CE55"/>
        <stop offset="55%" stop-color="#C98A12"/>
        <stop offset="80%" stop-color="#FFE484"/>
        <stop offset="100%" stop-color="#7B4E03"/>
      </linearGradient>
      <linearGradient id="rimInner" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#8A5806"/>
        <stop offset="45%" stop-color="#F7D364"/>
        <stop offset="100%" stop-color="#FFF7C2"/>
      </linearGradient>
      <radialGradient id="goldFace" cx="50%" cy="44%" r="58%">
        <stop offset="0%" stop-color="#FFFBE0"/>
        <stop offset="26%" stop-color="#F8D668"/>
        <stop offset="65%" stop-color="#D99B1D"/>
        <stop offset="100%" stop-color="#9B6508"/>
      </radialGradient>
      <linearGradient id="sheenDiag" x1="15%" y1="5%" x2="85%" y2="85%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55"/>
        <stop offset="42%" stop-color="#FFFFFF" stop-opacity="0"/>
        <stop offset="58%" stop-color="#5E3A00" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#FFF2B0" stop-opacity="0.35"/>
      </linearGradient>
      <pattern id="carbon" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#18181B"/>
        <polygon points="0,3 3,0 6,3 3,6" fill="#27272A"/>
        <circle cx="3" cy="3" r="0.8" fill="#09090B"/>
      </pattern>
      <filter id="dropGlow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.55"/>
      </filter>
    </defs>
    <g filter="url(#dropGlow)">
      <polygon points="24,12 96,12 114,44 60,108 6,44" fill="url(#rimOuter)" stroke="#694102" stroke-width="1.5"/>
      <polygon points="27,16 93,16 109,44.5 60,102.5 11,44.5" fill="url(#rimInner)"/>
      <polygon points="30,20 90,20 104,45 60,97 16,45" fill="url(#goldFace)" stroke="#8C5A08" stroke-width="1"/>
      <polygon points="30,20 90,20 104,45 60,97 16,45" fill="url(#sheenDiag)"/>
    </g>
    <g fill="url(#carbon)" stroke="#FFF2AD" stroke-width="1.4" stroke-linejoin="round">
      ${glyphMarkup}
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PLAYSTYLE_ICONS: Record<TacticalPlayStyleId, string> = {
  // 3 clockwise passing triangle arrows (Tiki-Taka)
  tiki_taka: makeGoldPlayStyleBadgeUri(`
    <path d="M52,32 L65,23 L65,28 L93,28 L82,53 L77,50 L84,35 L65,35 L65,40 Z"/>
    <path d="M44,59 L26,31 L48,31 L45,36 L35,36 L49,56 L53,53 L47,67 L35,61 Z"/>
    <path d="M76,52 L85,66 L80,63 L62,88 L49,72 L54,68 L62,78 L74,60 L69,57 Z"/>
  `),
  // Fortress shield & defensive double-wall (Phòng Ngự)
  phong_ngu: makeGoldPlayStyleBadgeUri(`
    <path d="M60,26 L84,34 L84,54 C84,70 73,82 60,89 C47,82 36,70 36,54 L36,34 Z"/>
    <rect x="46" y="45" width="28" height="7" fill="#F6D365" stroke="#18181B" stroke-width="1"/>
    <rect x="49" y="56" width="22" height="7" fill="#F6D365" stroke="#18181B" stroke-width="1"/>
  `),
  // Fast vertical twin counter-attack sprint arrows (Phản Công)
  phan_cong: makeGoldPlayStyleBadgeUri(`
    <path d="M46,27 L62,43 L54,43 L54,78 L40,78 L40,43 L32,43 Z"/>
    <path d="M75,35 L89,49 L82,49 L82,84 L68,84 L68,49 L61,49 Z"/>
  `),
  // 4 inward pressing arrows converging on center ball (High Press)
  high_press: makeGoldPlayStyleBadgeUri(`
    <circle cx="60" cy="54" r="9"/>
    <path d="M60,23 L69,35 L63,35 L63,41 L57,41 L57,35 L51,35 Z"/>
    <path d="M60,85 L51,73 L57,73 L57,67 L63,67 L63,73 L69,73 Z"/>
    <path d="M27,54 L39,45 L39,51 L46,51 L46,57 L39,57 L39,63 Z"/>
    <path d="M93,54 L81,63 L81,57 L74,57 L74,51 L81,51 L81,45 Z"/>
  `),
  // Sweeping wing cross trajectory + aerial header ball (Tạt Cánh Đánh Đầu)
  tat_canh_danh_dau: makeGoldPlayStyleBadgeUri(`
    <path d="M28,68 C34,40 54,28 76,36 L79,29 L89,43 L72,47 L74,42 C56,36 41,46 36,70 Z"/>
    <circle cx="68" cy="64" r="11"/>
    <path d="M52,79 L68,74 L84,79 L78,86 L58,86 Z"/>
  `),
  // Solo 1v1 skill star & slalom lightning dribble (Đơn Lẻ)
  don_le: makeGoldPlayStyleBadgeUri(`
    <polygon points="60,24 65,37 79,37 68,45 72,58 60,50 48,58 52,45 41,37 55,37"/>
    <path d="M44,64 L76,64 L54,77 L78,77 L56,90 L48,84 L62,76 L42,76 Z"/>
  `),
};

export interface TacticalPlayStyleDef {
  id: TacticalPlayStyleId;
  name: string;
  shortName: string;
  iconUrl: string;
  tagline: string;
  philosophy: string;
  strengths: [string, string, string];
  weaknesses: [string, string, string];
  strongAgainst: TacticalPlayStyleId[];
  weakAgainst: TacticalPlayStyleId[];
  recommendedFormations: string[];
  // Match Engine Gameplay Modifiers
  engine: {
    attBonus: number;
    defBonus: number;
    possWinBonus: number;
    shootProbBonus: number;
    goalConvBonus: number;
    concedeMod: number;
    pressInterceptBonus: number;
    staminaDrainMult: number;
    ballPattern: 'short_center' | 'deep_block' | 'direct_counter' | 'aggressive_press' | 'wide_cross';
  };
  commentaryBuildUp: string[];
  commentarySpecial: string[];
}

export const TACTICAL_PLAYSTYLES: readonly TacticalPlayStyleDef[] = [
  {
    id: 'tiki_taka',
    name: 'Tiki-Taka',
    shortName: 'Tiki-Taka',
    iconUrl: PLAYSTYLE_ICONS.tiki_taka,
    tagline: 'Đập nhả tam giác cự ly ngắn · Làm chủ khu trung tuyến',
    philosophy:
      'Kiểm soát bóng vượt trội bằng chuỗi chuyền ngắn một chạm liên tục ở trung lộ, kéo giãn khối đội hình đối phương trước khi tung đường chọc khe quyết định.',
    strengths: [
      'Kiểm soát bóng vượt trội (+8% tỷ lệ cầm bóng) và điều tiết nhịp độ trận đấu ổn định.',
      'Phối hợp chọc khe trung lộ sắc bén (+5% tỷ lệ chuyển hóa cơ hội trong vòng cấm).',
      'Tiết kiệm thể lực cầu thủ nhờ bắt đối phương phải chạy theo bóng (-12% hao hụt thể lực).',
    ],
    weaknesses: [
      'Dễ mất bóng nguy hiểm ở sân nhà khi gặp đối thủ áp sát tầm cao (High Press).',
      'Hàng thủ dâng cao dễ lộ khoảng trống sau lưng trước các pha Phản Công tốc độ.',
      'Thiếu phương án bóng bổng trực diện khi trung lộ bị phong tỏa dày đặc.',
    ],
    strongAgainst: ['phong_ngu', 'tat_canh_danh_dau', 'don_le'],
    weakAgainst: ['high_press', 'phan_cong'],
    recommendedFormations: ['4-3-3 Holding', '4-3-3 Attack', '4-1-2-1-2 Narrow'],
    engine: {
      attBonus: 2.2,
      defBonus: 0.6,
      possWinBonus: 0.075,
      shootProbBonus: 0.02,
      goalConvBonus: 0.045,
      concedeMod: 0.015,
      pressInterceptBonus: 0.02,
      staminaDrainMult: 0.88,
      ballPattern: 'short_center',
    },
    commentaryBuildUp: [
      'Chuỗi đập nhả Tiki-Taka một chạm cực kỳ ăn ý ở khu vực trung tuyến!',
      'Các cầu thủ đan bóng tam giác liên tục khiến hàng thủ đối phương bị kéo giãn!',
    ],
    commentarySpecial: [
      'Đường chọc khe xé toang trung lộ đúng thương hiệu Tiki-Taka!',
    ],
  },
  {
    id: 'phong_ngu',
    name: 'Phòng Ngự Kiên Cố',
    shortName: 'Phòng Ngự',
    iconUrl: PLAYSTYLE_ICONS.phong_ngu,
    tagline: 'Khối bê tông lùi sâu · Bọc lót kín kẽ trước khung thành',
    philosophy:
      'Thiết lập hai lớp phòng ngự lùi sâu kỷ luật trước vòng 16m50, khóa chặt khoảng trống sau lưng hậu vệ và hóa giải tối đa các pha đua tốc độ lẫn tạt cánh.',
    strengths: [
      'Tăng mạnh chỉ số Phòng Ngự toàn đội (+4.2 DEF) và bọc lót vòng cấm cực kỳ chắc chắn.',
      'Giảm mạnh tỷ lệ ghi bàn của đối phương (-7% khả năng thủng lưới), khắc chế Phản Công & Tạt Cánh.',
      'Giữ cự ly đội hình thấp giúp bảo toàn thể lực ổn định suốt 90 phút (-15% hao thể lực).',
    ],
    weaknesses: [
      'Nhường quyền kiểm soát bóng cho đối thủ (-9% tỷ lệ cầm bóng), chịu sức ép liên tục.',
      'Ít quân số tham gia tấn công nên giảm số lượng cú sút tạo ra mỗi hiệp.',
      'Dễ bị Tiki-Taka đan bóng tìm kẽ hở hoặc kỹ thuật Đơn Lẻ đột phá 1 đấu 1 gây đột biến.',
    ],
    strongAgainst: ['phan_cong', 'tat_canh_danh_dau'],
    weakAgainst: ['tiki_taka', 'high_press', 'don_le'],
    recommendedFormations: ['5-3-2', '5-4-1', '4-2-3-1 Wide'],
    engine: {
      attBonus: -1.8,
      defBonus: 4.2,
      possWinBonus: -0.065,
      shootProbBonus: -0.045,
      goalConvBonus: 0.01,
      concedeMod: -0.065,
      pressInterceptBonus: -0.04,
      staminaDrainMult: 0.85,
      ballPattern: 'deep_block',
    },
    commentaryBuildUp: [
      'Khối phòng ngự hai tầng giữ cự ly cực kỳ kỷ luật trước vòng cấm địa!',
      'Hàng thủ bọc lót kín kẽ, khóa chặt mọi khoảng trống tiếp cận cầu môn!',
    ],
    commentarySpecial: [
      'Pha truy cản chuẩn xác ngay trong vòng cấm từ hệ thống Phòng Ngự Kiên Cố!',
    ],
  },
  {
    id: 'phan_cong',
    name: 'Phản Công Chớp Nhoáng',
    shortName: 'Phản Công',
    iconUrl: PLAYSTYLE_ICONS.phan_cong,
    tagline: 'Chuyển trạng thái thần tốc · Phất bóng dài xé toang bẫy việt vị',
    philosophy:
      'Thu hút đối phương dâng cao rồi tung đường chuyền vượt tuyến tốc độ cao cho các tiền đạo bứt tốc khai thác khoảng trống mênh mông phía sau hàng thủ.',
    strengths: [
      'Sát thương chuyển trạng thái cực cao (+7.5% tỷ lệ dứt điểm thành bàn khi phản công).',
      'Khắc chế trực tiếp các đội dâng cao như High Press và Tiki-Taka bằng bóng dài vượt tuyến.',
      'Tốc độ đưa bóng từ sân nhà đến vòng cấm đối phương nhanh nhất trên sân.',
    ],
    weaknesses: [
      'Bế tắc và thiếu khoảng trống bứt tốc khi gặp đối thủ chơi Phòng Ngự lùi sâu.',
      'Tỷ lệ kiểm soát bóng thấp (-5% cầm bóng), phụ thuộc nhiều vào độ chính xác của đường chuyền dài.',
      'Nếu mất bóng giữa chừng khi chuyển trạng thái, tuyến giữa dễ bị chia cắt.',
    ],
    strongAgainst: ['high_press', 'tiki_taka'],
    weakAgainst: ['phong_ngu', 'don_le'],
    recommendedFormations: ['4-3-3 False 9', '4-2-2-2', '3-5-2'],
    engine: {
      attBonus: 3.1,
      defBonus: 1.2,
      possWinBonus: -0.035,
      shootProbBonus: 0.05,
      goalConvBonus: 0.075,
      concedeMod: -0.01,
      pressInterceptBonus: 0.01,
      staminaDrainMult: 1.04,
      ballPattern: 'direct_counter',
    },
    commentaryBuildUp: [
      'Pha chuyển trạng thái Phản Công thần tốc chỉ sau 2 đường phất bóng dọc biên!',
      'Tiền đạo bứt tốc xé gió đón đường chuyền vượt tuyến sau lưng hàng thủ!',
    ],
    commentarySpecial: [
      'Đòn Phản Công sắc như dao cạo khiến hàng thủ dâng cao không kịp lùi về!',
    ],
  },
  {
    id: 'high_press',
    name: 'High Press (Gegenpress)',
    shortName: 'High Press',
    iconUrl: PLAYSTYLE_ICONS.high_press,
    tagline: 'Vây ráp tầm cao nghẹt thở · Đoạt bóng ngay phần sân đối phương',
    philosophy:
      'Đẩy toàn bộ đội hình lên vây ráp quyết liệt ngay khi đối phương vừa có bóng, ép đối thủ mắc sai lầm sát vòng cấm để dứt điểm tức thì.',
    strengths: [
      'Tỷ lệ cướp bóng ngay trên phần sân đối phương cực cao (+14% khả năng đánh chặn tầm cao).',
      'Tạo ra số lượng pha dứt điểm áp đảo (+6% tần suất sút), bóp nghẹt Tiki-Taka và lối đá Đơn Lẻ.',
      'Gia tăng sức ép liên tục khiến hàng thủ đối phương lúng túng ở hiệp 1.',
    ],
    weaknesses: [
      'Tiêu hao thể lực cực nhanh (+38% tốc độ tụt Stamina), dễ hụt hơi ở 20 phút cuối trận nếu không thay người.',
      'Hàng thủ dâng rất cao nên cực kỳ nhạy cảm trước các pha Phản Công hoặc Tạt Cánh chuyển biên nhanh.',
      'Cự ly đội hình dễ bị kéo giãn nếu đối phương thoát pressing thành công.',
    ],
    strongAgainst: ['tiki_taka', 'phong_ngu', 'don_le'],
    weakAgainst: ['phan_cong', 'tat_canh_danh_dau'],
    recommendedFormations: ['4-3-3 Attack', '4-2-4', '3-4-3 Flat'],
    engine: {
      attBonus: 3.4,
      defBonus: -0.8,
      possWinBonus: 0.045,
      shootProbBonus: 0.065,
      goalConvBonus: 0.03,
      concedeMod: 0.04,
      pressInterceptBonus: 0.14,
      staminaDrainMult: 1.38,
      ballPattern: 'aggressive_press',
    },
    commentaryBuildUp: [
      'Hệ thống High Press vây ráp nghẹt thở ngay bên phần sân đối phương!',
      'Cầu thủ tuyến đầu ập vào quyết liệt không cho hậu vệ đối thủ thời gian xử lý!',
    ],
    commentarySpecial: [
      'Cướp bóng tầm cao thành công nhờ lối chơi High Press rực lửa!',
    ],
  },
  {
    id: 'tat_canh_danh_dau',
    name: 'Tạt Cánh Đánh Đầu',
    shortName: 'Tạt Cánh',
    iconUrl: PLAYSTYLE_ICONS.tat_canh_danh_dau,
    tagline: 'Khoét sâu hai hành lang biên · Không chiến uy lực trong vòng cấm',
    philosophy:
      'Dồn bóng tốc độ ra hai biên để hậu vệ cánh và tiền đạo cánh liên tục treo bóng xoáy vào khu vực 5m50 cho trung phong bật cao đánh đầu dứt điểm.',
    strengths: [
      'Khai thác tối đa khoảng trống hai biên, vượt qua tuyến giữa chật chội của High Press dễ dàng.',
      'Tăng mạnh tần suất nhồi bóng vào vòng cấm (+5.5% cơ hội dứt điểm & không chiến cận thành).',
      'Rất lợi hại khi sở hữu tiền đạo cắm (ST/CF) và cầu thủ chạy cánh (LW/RW/LM/RM) OVR cao.',
    ],
    weaknesses: [
      'Hiệu quả giảm khi gặp khối Phòng Ngự lùi sâu có trung vệ cao to bọc lót kín khu 5m50.',
      'Tuyến giữa mỏng hơn dễ bị Tiki-Taka kiểm soát bóng và chia cắt nguồn cung cấp bóng ra biên.',
      'Hai hậu vệ biên dâng cao tạt bóng dễ để lộ khoảng trống ở nách trung vệ khi mất bóng.',
    ],
    strongAgainst: ['high_press'],
    weakAgainst: ['phong_ngu', 'tiki_taka'],
    recommendedFormations: ['4-4-2 Flat', '4-3-3 Wide', '3-4-3 Diamond'],
    engine: {
      attBonus: 2.6,
      defBonus: 0.2,
      possWinBonus: 0.01,
      shootProbBonus: 0.055,
      goalConvBonus: 0.05,
      concedeMod: 0.02,
      pressInterceptBonus: 0.0,
      staminaDrainMult: 1.12,
      ballPattern: 'wide_cross',
    },
    commentaryBuildUp: [
      'Bóng được mở tốc độ ra sát đường biên ngang chuẩn bị cho pha treo bóng xoáy vào trong!',
      'Hai hành lang cánh liên tục khuấy đảo tạo cơ hội Tạt Cánh Đánh Đầu nguy hiểm!',
    ],
    commentarySpecial: [
      'Quả tạt chuẩn từng centimet vào vòng cấm mở ra cơ hội không chiến dũng mãnh!',
    ],
  },
  {
    id: 'don_le',
    name: 'Đơn Lẻ (Đột Phá Cá Nhân)',
    shortName: 'Đơn Lẻ',
    iconUrl: PLAYSTYLE_ICONS.don_le,
    tagline: 'Kỹ thuật rê dắt 1 đấu 1 · Siêu sao tự tạo siêu phẩm đột biến',
    philosophy:
      'Tạo không gian cô lập 1 đấu 1 cho các ngôi sao giàu kỹ thuật tự do rê bóng qua người, ngoặt bóng cứa lòng và xuyên thủng hàng thủ đối phương bằng khoảnh khắc thiên tài.',
    strengths: [
      'Tăng mạnh khả năng đột phá cá nhân và dứt điểm hiểm hóc (+3.6 ATT & +6.5% tỷ lệ chuyển hóa bàn thắng).',
      'Phá vỡ khối Phòng Ngự Kiên Cố và bắt bài lối đá Phản Công nhờ khả năng giữ bóng độc lập.',
      'Phát huy tối đa sức mạnh của các siêu sao có chỉ số Rê Bóng (DRI) và Kỹ Thuật 5 sao.',
    ],
    weaknesses: [
      'Dễ bị vây ráp mất bóng nếu gặp hệ thống High Press ập vào bọc lót 2-3 người cùng lúc.',
      'Thiếu sự gắn kết chuyền bóng tập thể khi đối đầu Tiki-Taka kiểm soát thế trận.',
      'Tiêu hao thể lực khá lớn ở các mũi nhọn tấn công (+16% hao hụt Stamina).',
    ],
    strongAgainst: ['phong_ngu', 'phan_cong'],
    weakAgainst: ['high_press', 'tiki_taka'],
    recommendedFormations: ['4-3-3 Attack', '4-2-3-1 Narrow', '4-2-4'],
    engine: {
      attBonus: 3.6,
      defBonus: -0.2,
      possWinBonus: 0.015,
      shootProbBonus: 0.045,
      goalConvBonus: 0.065,
      concedeMod: 0.015,
      pressInterceptBonus: 0.01,
      staminaDrainMult: 1.16,
      ballPattern: 'short_center',
    },
    commentaryBuildUp: [
      'Pha xử lý kỹ thuật cá nhân Đơn Lẻ qua liền hai hậu vệ cực kỳ ngẫu hứng!',
      'Ngôi sao tấn công tự tin cầm bóng đột phá 1 đấu 1 thẳng vào vòng cấm!',
    ],
    commentarySpecial: [
      'Khoảnh khắc thiên tài Đơn Lẻ! Rê bóng lắt léo mở ra góc sút không thể cản phá!',
    ],
  },
];

export const PLAYSTYLE_MAP: Record<TacticalPlayStyleId, TacticalPlayStyleDef> =
  TACTICAL_PLAYSTYLES.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<TacticalPlayStyleId, TacticalPlayStyleDef>);

export const getPlayStyleDef = (
  id?: TacticalPlayStyleId | string | null
): TacticalPlayStyleDef => {
  if (id && id in PLAYSTYLE_MAP) {
    return PLAYSTYLE_MAP[id as TacticalPlayStyleId];
  }
  return PLAYSTYLE_MAP.tiki_taka;
};

/**
 * Deterministically assigns a realistic playstyle to an AI club or opponent based on its ID/name/OVR
 */
export const getOpponentPlayStyle = (
  seedKey: string,
  ovr = 90
): TacticalPlayStyleId => {
  const lower = seedKey.toLowerCase();
  if (
    lower.includes('man city') ||
    lower.includes('barca') ||
    lower.includes('barcelona') ||
    lower.includes('arsenal')
  ) {
    return 'tiki_taka';
  }
  if (
    lower.includes('psg') ||
    lower.includes('santos') ||
    lower.includes('al nassr') ||
    lower.includes('miami')
  ) {
    return 'don_le';
  }
  if (
    lower.includes('liverpool') ||
    lower.includes('bayern') ||
    lower.includes('tottenham') ||
    lower.includes('newcastle')
  ) {
    return 'high_press';
  }
  if (
    lower.includes('real madrid') ||
    lower.includes('man utd') ||
    lower.includes('chelsea') ||
    lower.includes('leverkusen')
  ) {
    return 'phan_cong';
  }
  if (
    lower.includes('atletico') ||
    lower.includes('inter') ||
    lower.includes('juventus') ||
    lower.includes('everton') ||
    lower.includes('forest')
  ) {
    return 'phong_ngu';
  }
  if (
    lower.includes('west ham') ||
    lower.includes('brentford') ||
    lower.includes('villa') ||
    lower.includes('ac milan')
  ) {
    return 'tat_canh_danh_dau';
  }

  let hash = ovr * 17;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) >>> 0;
  }
  const allIds: TacticalPlayStyleId[] = [
    'tiki_taka',
    'phong_ngu',
    'phan_cong',
    'high_press',
    'tat_canh_danh_dau',
    'don_le',
  ];
  return allIds[hash % allIds.length];
};

export interface PlayStyleMatchupResult {
  status: 'advantage' | 'disadvantage' | 'neutral';
  advantage: 'user' | 'opp' | 'neutral';
  ovrSwing: number; // +2.8 OVR if countering opponent, -2.4 OVR if countered, 0 if neutral
  goalProbSwing: number; // Additional goal probability modifier
  label: string;
  detail: string;
  summaryText: string;
}

export const evaluatePlayStyleMatchup = (
  userStyleId: TacticalPlayStyleId | undefined,
  oppStyleId: TacticalPlayStyleId | undefined
): PlayStyleMatchupResult => {
  const userDef = getPlayStyleDef(userStyleId);
  const oppDef = getPlayStyleDef(oppStyleId);

  if (userDef.id === oppDef.id) {
    const detail = `Hai đội cùng vận hành ${userDef.name} — bản lĩnh cá nhân và OVR sẽ phân định thắng bại.`;
    return {
      status: 'neutral',
      advantage: 'neutral',
      ovrSwing: 0,
      goalProbSwing: 0,
      label: 'Đồng Phong Cách',
      detail,
      summaryText: detail,
    };
  }

  if (userDef.strongAgainst.includes(oppDef.id)) {
    const detail = `Khắc chế chiến thuật (+2.8 OVR): ${userDef.name} khắc chế trực tiếp ${oppDef.name}!`;
    return {
      status: 'advantage',
      advantage: 'user',
      ovrSwing: 2.8,
      goalProbSwing: 0.012,
      label: `Khắc Chế (+3 OVR Chiến Thuật)`,
      detail,
      summaryText: detail,
    };
  }

  if (userDef.weakAgainst.includes(oppDef.id) || oppDef.strongAgainst.includes(userDef.id)) {
    const detail = `Bị khắc chế (-2.4 OVR): ${oppDef.name} của đối thủ khai thác điểm yếu của ${userDef.name}.`;
    return {
      status: 'disadvantage',
      advantage: 'opp',
      ovrSwing: -2.4,
      goalProbSwing: -0.01,
      label: `Bị Khắc Chế (-2 OVR Chiến Thuật)`,
      detail,
      summaryText: detail,
    };
  }

  const detail = `Thế trận cân bằng: ${userDef.name} đối đầu sòng phẳng với ${oppDef.name}.`;
  return {
    status: 'neutral',
    advantage: 'neutral',
    ovrSwing: 0,
    goalProbSwing: 0,
    label: 'Thế Trận Cân Bằng',
    detail,
    summaryText: detail,
  };
};
