import {
  ManagerConfig,
  ManagerContractState,
  ManagerTierId,
  TacticalPlayStyleId,
} from '../types/game';

export const MANAGER_CARD_FRAME_URL = encodeURI(
  '/assets/aistudio/managers/khung thẻ huấn luyện viên.png'
);

export interface ManagerContractOption {
  days: number;
  label: string;
  discountPct: number;
  badge?: string;
}

export const MANAGER_CONTRACT_OPTIONS: readonly ManagerContractOption[] = [
  { days: 3, label: '3 ngày', discountPct: 0 },
  { days: 7, label: '7 ngày', discountPct: 12, badge: '-12%' },
  { days: 14, label: '14 ngày', discountPct: 22, badge: '-22%' },
  { days: 30, label: '30 ngày', discountPct: 35, badge: 'TỐI ƯU -35%' },
];

export const MANAGER_TIER_META: Record<
  ManagerTierId,
  {
    label: string;
    stars: number;
    maxBonus: number;
    accentHex: string;
    borderClass: string;
    badgeBgClass: string;
    textClass: string;
  }
> = {
  legendary: {
    label: 'Huyền Thoại 5★',
    stars: 5,
    maxBonus: 10,
    accentHex: '#FACC15',
    borderClass: 'border-amber-400/60',
    badgeBgClass: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
    textClass: 'text-amber-300',
  },
  elite: {
    label: 'Tinh Anh 4★',
    stars: 4,
    maxBonus: 8,
    accentHex: '#38BDF8',
    borderClass: 'border-sky-400/50',
    badgeBgClass: 'bg-sky-400/15 text-sky-300 border-sky-400/40',
    textClass: 'text-sky-300',
  },
  gold: {
    label: 'Vàng 3★',
    stars: 3,
    maxBonus: 6,
    accentHex: '#34D399',
    borderClass: 'border-emerald-400/50',
    badgeBgClass: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40',
    textClass: 'text-emerald-300',
  },
  silver: {
    label: 'Bạc 2★',
    stars: 2,
    maxBonus: 4,
    accentHex: '#94A3B8',
    borderClass: 'border-slate-400/40',
    badgeBgClass: 'bg-slate-400/15 text-slate-300 border-slate-400/35',
    textClass: 'text-slate-300',
  },
};

const portrait = (fileName: string) => encodeURI(`/assets/aistudio/managers/${fileName}`);

export const MANAGER_CATALOG: ManagerConfig[] = [
  // ================= HUYỀN THOẠI 5★ (Max +10 OVR) =================
  {
    id: 'mgr_hansi_flick',
    name: 'Hansi Flick',
    nationality: 'Đức',
    tier: 'legendary',
    tierLabel: 'Huyền Thoại 5★',
    stars: 5,
    rating: 96,
    portraitUrl: portrait('Hansi Flick.png'),
    favoritePlayStyleId: 'high_press',
    favoriteFormationIds: ['4-2-3-1-wide', '4-2-1-3', '4-3-3-attack'],
    philosophy: 'Áp sát tầm cao nghẹt thở, chuyển trạng thái chớp nhoáng và bẫy việt vị dâng cao.',
    baseDailyGemCost: 180,
    ovrBreakdown: { base: 2, formationMatch: 4, playStyleMatch: 4 },
    maxOvrBonus: 10,
  },
  {
    id: 'mgr_luis_enrique',
    name: 'Luis Enrique',
    nationality: 'Tây Ban Nha',
    tier: 'legendary',
    tierLabel: 'Huyền Thoại 5★',
    stars: 5,
    rating: 95,
    portraitUrl: portrait('Luis Enrique.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-3-3-holding', '4-3-3-attack', '4-3-3-false-9'],
    philosophy: 'Kiểm soát bóng chủ động bằng những tam giác phối hợp tốc độ và pressing ngay khi mất bóng.',
    baseDailyGemCost: 175,
    ovrBreakdown: { base: 2, formationMatch: 4, playStyleMatch: 4 },
    maxOvrBonus: 10,
  },
  {
    id: 'mgr_xabi_alonso',
    name: 'Xabi Alonso',
    nationality: 'Tây Ban Nha',
    tier: 'legendary',
    tierLabel: 'Huyền Thoại 5★',
    stars: 5,
    rating: 95,
    portraitUrl: portrait('Xabi Alonso.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['3-4-2-1', '3-4-3-diamond', '4-2-3-1-narrow'],
    philosophy: 'Luân chuyển bóng từ tuyến dưới cực kỳ chính xác, tận dụng tối đa cặp wingback và hai số 10.',
    baseDailyGemCost: 175,
    ovrBreakdown: { base: 2, formationMatch: 4, playStyleMatch: 4 },
    maxOvrBonus: 10,
  },
  {
    id: 'mgr_mikel_arteta',
    name: 'Mikel Arteta',
    nationality: 'Tây Ban Nha',
    tier: 'legendary',
    tierLabel: 'Huyền Thoại 5★',
    stars: 5,
    rating: 94,
    portraitUrl: portrait('Mikel Arteta.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-3-3-holding', '4-2-3-1-wide', '4-3-3-flat'],
    philosophy: 'Kỷ luật vị trí tuyệt đối ở từng mét vuông sân, kết hợp kiểm soát bóng và bóng chết sắc bén.',
    baseDailyGemCost: 165,
    ovrBreakdown: { base: 2, formationMatch: 4, playStyleMatch: 4 },
    maxOvrBonus: 10,
  },
  {
    id: 'mgr_mourinho',
    name: 'José Mourinho',
    nationality: 'Bồ Đào Nha',
    tier: 'legendary',
    tierLabel: 'Huyền Thoại 5★',
    stars: 5,
    rating: 95,
    portraitUrl: portrait('Mourinho.png'),
    favoritePlayStyleId: 'phan_cong',
    favoriteFormationIds: ['4-2-3-1-wide', '4-4-2-holding', '5-2-1-2'],
    philosophy: 'Khối phòng ngự thực dụng tối đa, tung đòn phản công trực diện kết liễu chỉ với 2 đường chuyền.',
    baseDailyGemCost: 170,
    ovrBreakdown: { base: 2, formationMatch: 4, playStyleMatch: 4 },
    maxOvrBonus: 10,
  },
  {
    id: 'mgr_simeone',
    name: 'Diego Simeone',
    nationality: 'Argentina',
    tier: 'legendary',
    tierLabel: 'Huyền Thoại 5★',
    stars: 5,
    rating: 94,
    portraitUrl: portrait('Simeone.png'),
    favoritePlayStyleId: 'phong_ngu',
    favoriteFormationIds: ['4-4-2-holding', '5-3-2-wingback', '3-5-2-midfield'],
    philosophy: 'Tinh thần chiến binh Cholismo, khóa chặt mọi khoảng trống trước khung thành rồi phản kích.',
    baseDailyGemCost: 165,
    ovrBreakdown: { base: 2, formationMatch: 4, playStyleMatch: 4 },
    maxOvrBonus: 10,
  },

  // ================= TINH ANH 4★ (Max +8 OVR) =================
  {
    id: 'mgr_kompany',
    name: 'Vincent Kompany',
    nationality: 'Bỉ',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 90,
    portraitUrl: portrait('Kompany.png'),
    favoritePlayStyleId: 'high_press',
    favoriteFormationIds: ['4-2-3-1-wide', '4-2-1-3', '4-3-3-attack'],
    philosophy: 'Chủ động cầm bóng tấn công tốc độ cao và tái chiếm bóng ngay trên phần sân đối phương.',
    baseDailyGemCost: 120,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_maresca',
    name: 'Enzo Maresca',
    nationality: 'Ý',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 89,
    portraitUrl: portrait('Maresca.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-2-3-1-wide', '4-2-3-1-narrow', '4-3-3-holding'],
    philosophy: 'Đẩy hậu vệ biên bó vào trung lộ tạo ưu thế quân số và kiểm soát nhịp độ tuyệt đối.',
    baseDailyGemCost: 115,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_de_zerbi',
    name: 'Roberto De Zerbi',
    nationality: 'Ý',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 89,
    portraitUrl: portrait('De Zerbi.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-2-3-1-wide', '4-2-2-2-box', '4-2-1-3'],
    philosophy: 'Mời gọi pressing ngay trước vòng cấm nhà trước khi chọc khe thoát vây dọc trung lộ.',
    baseDailyGemCost: 115,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_postecoglou',
    name: 'Ange Postecoglou',
    nationality: 'Úc',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 88,
    portraitUrl: portrait('Postecoglou.png'),
    favoritePlayStyleId: 'high_press',
    favoriteFormationIds: ['4-3-3-attack', '4-2-1-3', '4-2-4-ultra'],
    philosophy: 'Tấn công rực lửa không lùi bước, luôn dâng cao đội hình tạo mưa bàn thắng.',
    baseDailyGemCost: 110,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_lampard',
    name: 'Frank Lampard',
    nationality: 'Anh',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 88,
    portraitUrl: portrait('Lampard.png'),
    favoritePlayStyleId: 'phan_cong',
    favoriteFormationIds: ['4-3-3-attack', '4-2-3-1-narrow', '4-3-1-2'],
    philosophy: 'Khuyến khích các tiền vệ băng lên dứt điểm tuyến hai kết hợp chuyển trạng thái nhanh.',
    baseDailyGemCost: 105,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_carrick',
    name: 'Michael Carrick',
    nationality: 'Anh',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 87,
    portraitUrl: portrait('Carrick.png'),
    favoritePlayStyleId: 'phan_cong',
    favoriteFormationIds: ['4-2-3-1-wide', '4-4-1-1-attack', '4-3-3-holding'],
    philosophy: 'Điều tiết nhịp bóng điềm tĩnh từ tuyến giữa và tung đường chuyền xẻ nách tinh tế.',
    baseDailyGemCost: 100,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_luis_castro',
    name: 'Luís Castro',
    nationality: 'Bồ Đào Nha',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 87,
    portraitUrl: portrait('Luis Castro.png'),
    favoritePlayStyleId: 'don_le',
    favoriteFormationIds: ['4-2-3-1-narrow', '4-3-3-attack', '4-2-4-ultra'],
    philosophy: 'Giải phóng sự sáng tạo và đột phá 1v1 của các ngôi sao tấn công hàng đầu.',
    baseDailyGemCost: 100,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },
  {
    id: 'mgr_koller',
    name: 'Marcel Koller',
    nationality: 'Thụy Sĩ',
    tier: 'elite',
    tierLabel: 'Tinh Anh 4★',
    stars: 4,
    rating: 87,
    portraitUrl: portrait('Koller.png'),
    favoritePlayStyleId: 'tat_canh_danh_dau',
    favoriteFormationIds: ['4-3-3-flat', '4-4-2-flat', '4-1-3-2'],
    philosophy: 'Tối ưu chiều rộng đội hình, đẩy bóng ra hai hành lang biên để tạt bóng không chiến.',
    baseDailyGemCost: 95,
    ovrBreakdown: { base: 2, formationMatch: 3, playStyleMatch: 3 },
    maxOvrBonus: 8,
  },

  // ================= VÀNG 3★ (Max +6 OVR) =================
  {
    id: 'mgr_rohl',
    name: 'Danny Röhl',
    nationality: 'Đức',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 84,
    portraitUrl: portrait('Rohl.png'),
    favoritePlayStyleId: 'high_press',
    favoriteFormationIds: ['4-2-3-1-wide', '3-4-2-1'],
    philosophy: 'Pressing năng lượng cao và khai thác khoảng trống ngay sau khi đoạt bóng.',
    baseDailyGemCost: 70,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_schneider',
    name: 'Alexander Schneider',
    nationality: 'Đức',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 83,
    portraitUrl: portrait('Schneider.png'),
    favoritePlayStyleId: 'phong_ngu',
    favoriteFormationIds: ['5-3-2-wingback', '5-4-1-fortress'],
    philosophy: 'Tổ chức phòng ngự khu vực chặt chẽ, bảo toàn tỷ số và phản công nhanh.',
    baseDailyGemCost: 65,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_medina',
    name: 'Alexander Medina',
    nationality: 'Uruguay',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 83,
    portraitUrl: portrait('Medina.png'),
    favoritePlayStyleId: 'phan_cong',
    favoriteFormationIds: ['4-2-2-2-box', '4-4-2-holding'],
    philosophy: 'Lối chơi Nam Mỹ giàu nhiệt huyết, chuyển trạng thái dọc sân cực nhanh.',
    baseDailyGemCost: 65,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_sabau',
    name: 'Ioan Sabău',
    nationality: 'Romania',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 82,
    portraitUrl: portrait('Sabau.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-1-4-1-control', '4-3-3-flat'],
    philosophy: 'Ưu tiên giữ cự ly trung tuyến và phối hợp ít chạm để giữ quyền chủ động.',
    baseDailyGemCost: 60,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_bucchi',
    name: 'Cristian Bucchi',
    nationality: 'Ý',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 82,
    portraitUrl: portrait('Bucchi.png'),
    favoritePlayStyleId: 'tat_canh_danh_dau',
    favoriteFormationIds: ['3-5-2-midfield', '4-4-2-flat'],
    philosophy: 'Khai thác hai biên với những quả tạt sớm vào cặp tiền đạo mạnh không chiến.',
    baseDailyGemCost: 60,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_diez',
    name: 'Julio Diez',
    nationality: 'Tây Ban Nha',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 82,
    portraitUrl: portrait('Diez.png'),
    favoritePlayStyleId: 'don_le',
    favoriteFormationIds: ['4-1-2-1-2-narrow', '4-3-2-1-christmas'],
    philosophy: 'Tạo điều kiện cho nhạc trưởng và tiền đạo tự do đột phá qua người.',
    baseDailyGemCost: 60,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_baptista',
    name: 'Júlio Baptista',
    nationality: 'Brazil',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 83,
    portraitUrl: portrait('Baptista.png'),
    favoritePlayStyleId: 'don_le',
    favoriteFormationIds: ['4-2-2-2-box', '4-2-4-ultra'],
    philosophy: 'Đậm chất Samba phóng khoáng, dồn bóng cho các ngôi sao tự tạo siêu phẩm.',
    baseDailyGemCost: 65,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },
  {
    id: 'mgr_flores',
    name: 'Quique Flores',
    nationality: 'Tây Ban Nha',
    tier: 'gold',
    tierLabel: 'Vàng 3★',
    stars: 3,
    rating: 83,
    portraitUrl: portrait('Flores.png'),
    favoritePlayStyleId: 'phong_ngu',
    favoriteFormationIds: ['5-2-2-1-counter', '5-3-2-wingback'],
    philosophy: 'Xây dựng hàng thủ nhiều lớp chắc chắn trước khi tung đường chuyền dài phản công.',
    baseDailyGemCost: 65,
    ovrBreakdown: { base: 2, formationMatch: 2, playStyleMatch: 2 },
    maxOvrBonus: 6,
  },

  // ================= BẠC 2★ (Max +4 OVR) =================
  {
    id: 'mgr_moskal',
    name: 'Kazimierz Moskal',
    nationality: 'Ba Lan',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 78,
    portraitUrl: portrait('Moskal.png'),
    favoritePlayStyleId: 'tat_canh_danh_dau',
    favoriteFormationIds: ['4-4-2-flat', '4-1-3-2'],
    philosophy: 'Thực dụng đơn giản, đưa bóng nhanh ra hai biên để dứt điểm trong vòng cấm.',
    baseDailyGemCost: 35,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_carille',
    name: 'Fábio Carille',
    nationality: 'Brazil',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 79,
    portraitUrl: portrait('Carille.png'),
    favoritePlayStyleId: 'phong_ngu',
    favoriteFormationIds: ['4-4-2-holding', '4-5-1-attack'],
    philosophy: 'Ưu tiên giữ sạch lưới với cự ly đội hình thấp và kỷ luật chiến thuật cao.',
    baseDailyGemCost: 40,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_wolyniec',
    name: 'John Wolyniec',
    nationality: 'Mỹ',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 77,
    portraitUrl: portrait('Wolyniec.png'),
    favoritePlayStyleId: 'high_press',
    favoriteFormationIds: ['3-1-4-2', '4-2-3-1-wide'],
    philosophy: 'Chú trọng thể lực và tinh thần pressing liên tục suốt trận.',
    baseDailyGemCost: 35,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_kohnen',
    name: 'Martin Kohnen',
    nationality: 'Đức',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 77,
    portraitUrl: portrait('Kohnen.png'),
    favoritePlayStyleId: 'phan_cong',
    favoriteFormationIds: ['4-1-2-1-2-wide', '4-2-2-2-wide'],
    philosophy: 'Thu hồi bóng khu trung tuyến và chuyển nhanh cho bộ đôi tiền đạo.',
    baseDailyGemCost: 35,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_euvrard',
    name: 'Olivier Euvrard',
    nationality: 'Pháp',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 78,
    portraitUrl: portrait('Euvrard.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-3-3-flat', '4-1-4-1-control'],
    philosophy: 'Giữ nhịp trận đấu bằng các đường chuyền an toàn ở khu vực giữa sân.',
    baseDailyGemCost: 38,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_tholot',
    name: 'Didier Tholot',
    nationality: 'Pháp',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 78,
    portraitUrl: portrait('Tholot.png'),
    favoritePlayStyleId: 'tat_canh_danh_dau',
    favoriteFormationIds: ['3-4-3-flat', '4-4-2-flat'],
    philosophy: 'Linh hoạt chuyển đổi giữa 3 và 4 hậu vệ để mở không gian tạt cánh.',
    baseDailyGemCost: 38,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_gourvennec',
    name: 'Jocelyn Gourvennec',
    nationality: 'Pháp',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 79,
    portraitUrl: portrait('Gourvennec.png'),
    favoritePlayStyleId: 'phan_cong',
    favoriteFormationIds: ['4-4-1-1-attack', '4-3-1-2'],
    philosophy: 'Cân bằng hai tuyến và chớp thời cơ phản công nhanh qua vị trí hộ công.',
    baseDailyGemCost: 40,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
  {
    id: 'mgr_yamashita',
    name: 'Takashi Yamashita',
    nationality: 'Nhật Bản',
    tier: 'silver',
    tierLabel: 'Bạc 2★',
    stars: 2,
    rating: 78,
    portraitUrl: portrait('Yamashita.png'),
    favoritePlayStyleId: 'tiki_taka',
    favoriteFormationIds: ['4-3-3-false-9', '3-4-2-1'],
    philosophy: 'Chuyền ngắn tốc độ, di chuyển không bóng linh hoạt và giữ kỷ luật đội hình.',
    baseDailyGemCost: 38,
    ovrBreakdown: { base: 1, formationMatch: 2, playStyleMatch: 1 },
    maxOvrBonus: 4,
  },
];

export const MANAGER_MAP: Record<string, ManagerConfig> = MANAGER_CATALOG.reduce(
  (acc, mgr) => {
    acc[mgr.id] = mgr;
    return acc;
  },
  {} as Record<string, ManagerConfig>
);

export const getManagerById = (managerId?: string | null): ManagerConfig | null => {
  if (!managerId) return null;
  return MANAGER_MAP[managerId] ?? null;
};

export const getManagerContractGemCost = (
  manager: ManagerConfig,
  days: number
): number => {
  const option = MANAGER_CONTRACT_OPTIONS.find((opt) => opt.days === days);
  const discountPct = option ? option.discountPct : 0;
  const rawCost = manager.baseDailyGemCost * Math.max(1, days);
  const discounted = rawCost * (1 - discountPct / 100);
  return Math.max(20, Math.round(discounted / 10) * 10);
};

export const getActiveManagerContract = (
  contract: ManagerContractState | null | undefined,
  nowMs: number = Date.now()
): { contract: ManagerContractState; manager: ManagerConfig; remainingMs: number } | null => {
  if (!contract || !contract.managerId) return null;
  const manager = getManagerById(contract.managerId);
  if (!manager) return null;
  const remainingMs = contract.expiresAt - nowMs;
  if (remainingMs <= 0) return null;
  return { contract, manager, remainingMs };
};

export interface ManagerBonusEvaluation {
  isActive: boolean;
  isExpired: boolean;
  manager: ManagerConfig | null;
  contract: ManagerContractState | null;
  remainingMs: number;
  baseBonus: number;
  formationBonus: number;
  playStyleBonus: number;
  totalBonus: number; // Always clamped 0..10
  maxBonus: number;
  formationMatched: boolean;
  playStyleMatched: boolean;
}

export const evaluateManagerBonus = ({
  activeManager,
  formationId,
  playStyleId,
  nowMs = Date.now(),
}: {
  activeManager?: ManagerContractState | null;
  formationId?: string | null;
  playStyleId?: TacticalPlayStyleId | string | null;
  nowMs?: number;
}): ManagerBonusEvaluation => {
  if (!activeManager || !activeManager.managerId) {
    return {
      isActive: false,
      isExpired: false,
      manager: null,
      contract: null,
      remainingMs: 0,
      baseBonus: 0,
      formationBonus: 0,
      playStyleBonus: 0,
      totalBonus: 0,
      maxBonus: 0,
      formationMatched: false,
      playStyleMatched: false,
    };
  }

  const manager = getManagerById(activeManager.managerId);
  if (!manager) {
    return {
      isActive: false,
      isExpired: false,
      manager: null,
      contract: null,
      remainingMs: 0,
      baseBonus: 0,
      formationBonus: 0,
      playStyleBonus: 0,
      totalBonus: 0,
      maxBonus: 0,
      formationMatched: false,
      playStyleMatched: false,
    };
  }

  const remainingMs = activeManager.expiresAt - nowMs;
  if (remainingMs <= 0) {
    return {
      isActive: false,
      isExpired: true,
      manager,
      contract: activeManager,
      remainingMs: 0,
      baseBonus: 0,
      formationBonus: 0,
      playStyleBonus: 0,
      totalBonus: 0,
      maxBonus: manager.maxOvrBonus,
      formationMatched: false,
      playStyleMatched: false,
    };
  }

  const formationMatched = Boolean(
    formationId && manager.favoriteFormationIds.includes(formationId)
  );
  const playStyleMatched = Boolean(
    playStyleId && manager.favoritePlayStyleId === playStyleId
  );

  const baseBonus = manager.ovrBreakdown.base;
  const formationBonus = formationMatched ? manager.ovrBreakdown.formationMatch : 0;
  const playStyleBonus = playStyleMatched ? manager.ovrBreakdown.playStyleMatch : 0;
  const totalBonus = Math.min(10, Math.max(0, baseBonus + formationBonus + playStyleBonus));

  return {
    isActive: true,
    isExpired: false,
    manager,
    contract: activeManager,
    remainingMs,
    baseBonus,
    formationBonus,
    playStyleBonus,
    totalBonus,
    maxBonus: manager.maxOvrBonus,
    formationMatched,
    playStyleMatched,
  };
};

export const formatRemainingContract = (remainingMs: number): string => {
  if (remainingMs <= 0) return 'Đã hết hạn';
  const totalMinutes = Math.floor(remainingMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  if (days >= 1) {
    return `${days} ngày ${hours} giờ`;
  }
  if (hours >= 1) {
    return `${hours} giờ ${mins} phút`;
  }
  return `${Math.max(1, mins)} phút`;
};
