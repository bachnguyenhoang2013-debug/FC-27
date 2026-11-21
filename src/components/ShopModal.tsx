import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Copy } from 'lucide-react';
import { soundService } from '../services/sound';
import { UserProfile, ShopItem, PlayerCard } from '../types/game';
import { PackOpeningModal, PackTier } from './PackOpeningModal';
import { FCCard } from './FCCard';
import { TopSectionHeader } from './TopSectionHeader';
import { getDaily6AMCycleKey } from '../utils/dateUtils';
import { normalizeKickoffState } from '../data/kickoffData';
import { useLibertadoresAssets } from '../data/libertadoresAssets';
import { addOwnedPlayerCopies } from '../utils/squadUtils';
import {
  STARTER_OWNED_IDS,
  zidaneBallonDor106,
  kakaBallonDor106,
  ronaldinhoGift97,
  shopFeaturedOffers,
  ShopFeaturedOffer,
} from '../data/mockData';

interface GiftCodeDefinition {
  code: string;
  title: string;
  description: string;
  rewards: {
    coins?: number;
    gems?: number;
    tickets?: number;
    totyTokens?: number;
    totyShards?: number;
    minigameTickets?: number;
    packTier?: PackTier;
  };
}

const SHOP_GIFT_CODES: GiftCodeDefinition[] = [
  {
    code: 'FCMOBILE26',
    title: 'Quà Khởi Động FC Mobile 26',
    description: 'Bộ quà tiếp tế Xu, Kim Cương và Vé Quay dành cho mọi Huấn Luyện Viên.',
    rewards: { coins: 150000, gems: 500, tickets: 2 },
  },
  {
    code: 'TOTY2026',
    title: 'Đại Tiệc Team Of The Year',
    description: 'Nhận ngay Token TOTY, Mảnh TOTY và Vé Quay sự kiện mùa giải.',
    rewards: { totyTokens: 100, totyShards: 50, tickets: 3 },
  },
  {
    code: 'UTOTYVIP',
    title: 'Đặc Quyền Siêu Sao UTOTY',
    description: 'Tăng tốc chiêu mộ siêu sao với Kim Cương, Mảnh TOTY và Vé Minigame.',
    rewards: { gems: 1200, totyShards: 80, minigameTickets: 1 },
  },
  {
    code: 'SHARDS26',
    title: 'Tiếp Tế Mảnh Ghép TOTY',
    description: 'Bổ sung Mảnh TOTY để đổi cầu thủ OVR cao trong sự kiện TOTY.',
    rewards: { totyShards: 120, gems: 300 },
  },
  {
    code: 'PREMIERLEAGUE',
    title: 'Chinh Phục Ngoại Hạng Anh',
    description: 'Ngân sách nâng cấp huấn luyện CLB và chinh phục 38 vòng đấu Sự Nghiệp.',
    rewards: { coins: 250000, tickets: 2, totyTokens: 50 },
  },
  {
    code: 'SUPERPACK90',
    title: 'Gói Quà Siêu Sao TOTY 90–95',
    description: 'Mở ngay lập tức 1 Gói Cầu Thủ TOTY OVR 90–95 kèm thưởng Xu.',
    rewards: { coins: 100000, packTier: 'TOTY_90_95' },
  },
];

export type TopStoreTab =
  | 'recommended'
  | 'featured_players'
  | 'packs'
  | 'tickets'
  | 'resources'
  | 'giftcode';

interface ShopModalProps {
  user: UserProfile;
  initialTopTab?: TopStoreTab;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onClose: () => void;
  onOpenTickets?: () => void;
  onOpenShards?: () => void;
  onOpenPackTierDirectly?: (tier: PackTier) => void;
  onOpenPackDirectly?: () => void;
  onOpenWalkoutForPlayer?: (player: PlayerCard, customTitle?: string) => void;
}

export const defaultShopItems: ShopItem[] = [
  {
    id: 'shop_offer_ginga_pack_100',
    name: 'Pack Cầu Thủ 100+ OVR Ginga',
    category: 'packs',
    description: 'Cam kết nhận 1 cầu thủ Ginga 26 OVR 100–106 (Bao gồm Kaká 106 & Mascherano 105 Icons)',
    costType: 'gems',
    costAmount: 22000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'GINGA_100_OVR',
    badge: '100+ GINGA',
    image: '/assets/aistudio/khung_th__c_u_th__ginga_g_i_a_69452143.png',
    featured: true,
  },
  {
    id: 'shop_offer_ginga_pack_92_106',
    name: 'Pack Cầu Thủ Ginga 92–106 OVR',
    category: 'packs',
    description: 'Nhận ngay 1 cầu thủ Nam Mỹ Ginga 26 (OVR 92–106)',
    costType: 'gems',
    costAmount: 12000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'GINGA_92_106',
    badge: '92–106 GINGA',
    image: '/assets/aistudio/khung_th__c_u_th__ginga_g_i_b_v__c_4028dd25.png',
    featured: true,
  },
  {
    id: 'shop_match_skip_pass_1',
    name: 'Vé Pass Trận Đấu',
    category: 'tickets',
    description: 'Bỏ qua ngay 1 trận Đấu Sự Nghiệp hoặc Đấu Xếp Hạng (Bot) & nhận trọn vẹn phần thưởng thắng trận',
    costType: 'gems',
    costAmount: 1000,
    rewardType: 'matchSkipPasses',
    rewardAmount: 1,
    badge: 'PASS TRẬN',
    image: '/assets/aistudio/currencylarge_passticket_7f00b085.png',
    featured: true,
  },
  {
    id: 'shop_match_skip_pass_5',
    name: 'Bộ 5 Vé Pass Trận Đấu',
    category: 'tickets',
    description: 'Tiết kiệm 10% · Nhận 5 Vé Pass bỏ qua trận Đấu Sự Nghiệp / Xếp Hạng',
    costType: 'gems',
    costAmount: 4500,
    rewardType: 'matchSkipPasses',
    rewardAmount: 5,
    badge: '-10% PASS',
    image: '/assets/aistudio/currencylarge_passticket_7f00b085.png',
    featured: true,
  },
  {
    id: 'shop_offer_conmebol_100_103',
    name: 'Gói CONMEBOL Libertadores 1 (100–103 + 102–106)',
    category: 'packs',
    description: 'Nhận 1 Cầu Thủ Hỗn Hợp 100–103 & 1 Icons CONMEBOL Libertadores 102–106',
    costType: 'gems',
    costAmount: 45000,
    rewardType: 'pack',
    rewardAmount: 2,
    packTier: 'CONMEBOL_100_103',
    badge: 'x2 CẦU THỦ',
    image:
      '/assets/aistudio/g_i_c_a_h_ng_conmebol_libertadores_30000_kim_c__ng_54d3ec32.png',
    isFullCardArt: true,
    featured: true,
  },
  {
    id: 'shop_offer_conmebol_2_102_plus',
    name: 'Gói CONMEBOL Libertadores 2 (102+)',
    category: 'packs',
    description:
      'Cam kết 1 Icons CONMEBOL Libertadores 102–106 (Hulk · Maicon · Riquelme · Carlos Alberto · Marcelo · Zé Roberto · Milito · Ramires · Pato · Tevez)',
    costType: 'gems',
    costAmount: 30000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'CONMEBOL_2_102_PLUS',
    badge: '102+ ICONS LIBERTADORES',
    image: '/assets/aistudio/storepack_5c9df418.png',
    featured: true,
  },
  {
    id: 'shop_offer_conmebol_tokens_100',
    name: 'Gói 100 Token CONMEBOL Libertadores',
    category: 'resources',
    description: 'Nhận ngay 100 Token CONMEBOL Libertadores dùng cho Vòng Quay & Đổi Quà',
    costType: 'gems',
    costAmount: 3000,
    rewardType: 'libertadoresTokens',
    rewardAmount: 100,
    badge: '+100 TOKEN',
    image: '/assets/aistudio/currencylarge_conmebol_libertadores_TOKEN_35860ba9.png',
    featured: true,
  },
  {
    id: 'shop_offer_signature_token_1',
    name: 'Gói 1 Token Chữ Ký',
    category: 'resources',
    description: 'Nhận 1 Token Chữ Ký dùng cho Hành Trình Chữ Ký (Đổi Siêu Sao 106 OVR)',
    costType: 'gems',
    costAmount: 2000,
    rewardType: 'signatureTokens',
    rewardAmount: 1,
    badge: '1 TOKEN',
    image: '/assets/aistudio/token_ch__k__7d3f14d9.png',
    featured: true,
  },
  {
    id: 'shop_offer_extra_time_tokens_1000',
    name: 'Gói 1.000 Token Hiệp Phụ',
    category: 'resources',
    description: 'Đổi 50 Kim Cương lấy ngay 1.000 Token Hiệp Phụ dùng trong Khu Phức Hợp',
    costType: 'gems',
    costAmount: 50,
    rewardType: 'extraTimeTokens',
    rewardAmount: 1000,
    badge: '+1.000 TOKEN HP',
    image: '/assets/aistudio/currencylarge_hi_p_ph__20b8b201.png',
    featured: true,
  },
  {
    id: 'shop_offer_starter_97',
    name: 'Gói Cầu Thủ Khởi Đầu 97 OVR (Čech · Florenzi · Ribéry)',
    category: 'packs',
    description: 'Nhận 1 trong 3: Petr Čech, Florenzi, Ribéry (97 OVR) · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 8000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'STARTER_97',
    badge: '97 OVR',
    image: '/assets/aistudio/ribery_97_ovr_1c56c6eb.png',
    featured: true,
  },
  {
    id: 'shop_offer_netherlands_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Hà Lan (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Hà Lan OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 6500,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'NETHERLANDS_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/storepack_ANS26_NLD_PACK_F_33706c6f.png',
    featured: true,
  },
  {
    id: 'shop_offer_italy_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Italy (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Italy OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 6500,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'ITALY_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/storepack_ANS26_ITA_PACK_F_f8ed357d.png',
    featured: true,
  },
  {
    id: 'shop_offer_spain_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Tây Ban Nha (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Tây Ban Nha OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 6500,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'SPAIN_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/storepack_ANS26_ESP_PACK_F_ab76c063.png',
    featured: true,
  },
  {
    id: 'shop_offer_england_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Anh (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Anh OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 6500,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'ENGLAND_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/storepack_ANS26_ENG_PACK_F_924d2e02.png',
    featured: true,
  },
  {
    id: 'shop_offer_brazil_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Brazil (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Brazil OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 6500,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'BRAZIL_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/storepack_ANS26_BRA_PACK_F_4bab219d.png',
    featured: true,
  },
  {
    id: 'shop_offer_portugal_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Bồ Đào Nha (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Bồ Đào Nha OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 6500,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'PORTUGAL_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/storepack_ANS26_PRT_PACK_F_4cb3ea30.png',
    featured: true,
  },
  {
    id: 'shop_offer_premier_league_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Premier League (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Premier League OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 7000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'PREMIER_LEAGUE_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/g_i__u___i_c_u_th__premier_league_ovr_90-100_ac276e83.png',
    featured: true,
  },
  {
    id: 'shop_offer_future_stars_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Future Stars (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Future Stars OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 7000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'FUTURE_STARS_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/g_i__u___i_c_u_th__Future_Stars_ovr_90-100_b8742a43.png',
    featured: true,
  },
  {
    id: 'shop_offer_france_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Pháp (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Pháp OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 7000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'FRANCE_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/g_i__u___i_c_u_th__ph_p_ovr_90-100_772347b0.png',
    featured: true,
  },
  {
    id: 'shop_offer_argentina_90_100',
    name: 'Gói Ưu Đãi Cầu Thủ Argentina (90–100)',
    category: 'packs',
    description: '100% Cầu thủ Argentina OVR 90–100 · Animation đúng mùa thẻ',
    costType: 'gems',
    costAmount: 7000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'ARGENTINA_90_100',
    badge: '90–100 OVR',
    image: '/assets/aistudio/g_i__u___i_c_u_th__argentina_ovr_90-100_348297dd.png',
    featured: true,
  },
  {
    id: 'shop_offer_tickets_20',
    name: 'Gói Ưu Đãi 20 Vé Quay',
    category: 'tickets',
    description: 'Ưu đãi đặc biệt 200% Value · Nhận 20 Vé Quay',
    costType: 'gems',
    costAmount: 4000,
    rewardType: 'tickets',
    rewardAmount: 20,
    badge: '200% VALUE',
    image: '/assets/aistudio/g_i__u___i_20_v__quay_839bcf00.png',
    isFullCardArt: true,
    featured: true,
  },
  {
    id: 'shop_offer_tickets_10',
    name: 'Gói Ưu Đãi 10 Vé Quay',
    category: 'tickets',
    description: 'Ưu đãi đặc biệt 143% Value · Nhận 10 Vé Quay',
    costType: 'gems',
    costAmount: 2800,
    rewardType: 'tickets',
    rewardAmount: 10,
    badge: '143% VALUE',
    image: '/assets/aistudio/g_i__u___i_10_v__quay_5b150b31.png',
    isFullCardArt: true,
    featured: true,
  },
  {
    id: 'shop_ticket_free_daily',
    name: 'Điểm Danh Vé Quay Hằng Ngày',
    category: 'tickets',
    description: 'Giới hạn ngày: 1 · Làm mới lúc 06:00 sáng',
    costType: 'free',
    costAmount: 0,
    rewardType: 'tickets',
    rewardAmount: 2,
    badge: 'MIỄN PHÍ',
    image: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
    featured: true,
  },
  {
    id: 'shop_ticket_1',
    name: 'Gói Vé Quay Đơn',
    category: 'tickets',
    description: '1 lượt mở tại mục Vé Quay',
    costType: 'gems',
    costAmount: 400,
    rewardType: 'tickets',
    rewardAmount: 1,
    image: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
    featured: true,
  },
  {
    id: 'shop_ticket_5',
    name: 'Bộ 5 Vé Quay Ưu Đãi',
    category: 'tickets',
    description: 'Tiết kiệm 10% Kim Cương',
    costType: 'gems',
    costAmount: 1800,
    rewardType: 'tickets',
    rewardAmount: 5,
    badge: '-10%',
    image: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
    featured: true,
  },
  {
    id: 'shop_ticket_10',
    name: 'Bộ 10 Vé Quay Siêu Sao',
    category: 'tickets',
    description: 'Dùng mở 10 vé liên tiếp',
    costType: 'gems',
    costAmount: 3400,
    rewardType: 'tickets',
    rewardAmount: 10,
    badge: '-15%',
    image: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
    featured: true,
  },
  {
    id: 'shop_ticket_25',
    name: 'Rương 25 Vé Quay',
    category: 'tickets',
    description: 'Tiết kiệm 2.000 Kim Cương',
    costType: 'gems',
    costAmount: 8000,
    rewardType: 'tickets',
    rewardAmount: 25,
    badge: '-20%',
    image: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    id: 'shop_ticket_50',
    name: 'Đại Kiện 50 Vé Quay',
    category: 'tickets',
    description: 'Đủ 5 lần mở 10 vé liên tiếp',
    costType: 'gems',
    costAmount: 15200,
    rewardType: 'tickets',
    rewardAmount: 50,
    badge: '-25%',
    image: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    id: 'shop_pack_utoty_icon',
    name: 'Gói UTOTY & TOTY26 HM 100+',
    category: 'packs',
    description: 'Cam kết 100% OVR 100–104+',
    costType: 'gems',
    costAmount: 20000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'UTOTY',
    badge: '100–104+',
    image: '/assets/aistudio/storepack_S11_F_676265b6.png',
    featured: true,
  },
  {
    id: 'shop_pack_a',
    name: 'Gói A · Siêu Sao TOTY (91–104+)',
    category: 'packs',
    description: 'Cam kết Siêu Sao & hiệu ứng Walkout',
    costType: 'gems',
    costAmount: 10000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'A',
    badge: '91–104+',
    image: '/assets/aistudio/storepack_S11_d9617be0.png',
    featured: true,
  },
  {
    id: 'shop_pack_b',
    name: 'Gói B · Tinh Anh TOTY (81–90)',
    category: 'packs',
    description: 'Cầu thủ Tinh Anh kèm thưởng Xu',
    costType: 'gems',
    costAmount: 4000,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'B',
    badge: '81–90',
    image: '/assets/aistudio/storepack_S11_d9617be0.png',
  },
  {
    id: 'shop_pack_c',
    name: 'Gói C · Tiêu Chuẩn (60–80)',
    category: 'packs',
    description: 'Mở nhanh cầu thủ thế giới & ĐTVN',
    costType: 'gems',
    costAmount: 1200,
    rewardType: 'pack',
    rewardAmount: 1,
    packTier: 'C',
    badge: '60–80',
    image: '/assets/aistudio/storepack_S11_d9617be0.png',
  },
  {
    id: 'shop_coins_5m',
    name: 'Túi 5.000.000 Xu',
    category: 'resources',
    description: 'Ngân sách huấn luyện & mua cầu thủ',
    costType: 'gems',
    costAmount: 12000,
    rewardType: 'coins',
    rewardAmount: 5000000,
    image: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    id: 'shop_coins_25m',
    name: 'Rương 25.000.000 Xu',
    category: 'resources',
    description: 'Nâng cấp toàn đội & săn sao OVR cao',
    costType: 'gems',
    costAmount: 48000,
    rewardType: 'coins',
    rewardAmount: 25000000,
    badge: 'ƯU ĐÃI',
    image: '/assets/aistudio/currencysmall_COIN_ec777114.png',
    featured: true,
  },
  {
    id: 'shop_coins_100m',
    name: 'Kho Báu 100.000.000 Xu',
    category: 'resources',
    description: 'Mua đứt siêu sao trên Chuyển Nhượng',
    costType: 'gems',
    costAmount: 160000,
    rewardType: 'coins',
    rewardAmount: 100000000,
    badge: 'VIP',
    image: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    id: 'shop_energy_full',
    name: 'Bình Hồi Phục 100 Thể Lực',
    category: 'resources',
    description: 'Làm đầy ngay 100 điểm Năng Lượng',
    costType: 'gems',
    costAmount: 600,
    rewardType: 'energy',
    rewardAmount: 100,
    image: '/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png',
  },
  {
    id: 'shop_special_starter',
    name: 'Gói Tiếp Tế Tân Thủ UTOTY',
    category: 'special',
    description: 'Nhận 3 Vé Quay + 100.000 Xu (1 lần)',
    costType: 'free',
    costAmount: 0,
    rewardType: 'tickets',
    rewardAmount: 3,
    badge: 'QUÀ TÂN THỦ',
    image: '/assets/aistudio/storepack_S11_F_676265b6.png',
    featured: true,
  },
];

type SideFilterId = 'all' | 'hot_offers' | 'featured' | 'vouchers' | 'packs_only' | 'free_only';

export const ShopModal: React.FC<ShopModalProps> = ({
  user,
  initialTopTab,
  onUpdateUser,
  onClose,
  onOpenTickets,
  onOpenShards,
  onOpenPackTierDirectly,
  onOpenPackDirectly,
  onOpenWalkoutForPlayer,
}) => {
  const { getAsset: getLibertadoresAsset } = useLibertadoresAssets();
  const [topTab, setTopTab] = useState<TopStoreTab>(initialTopTab ?? 'recommended');
  const [sideFilter, setSideFilter] = useState<SideFilterId>('all');
  const [codeInput, setCodeInput] = useState<string>('');
  const [fallbackWalkout, setFallbackWalkout] = useState<{
    player: PlayerCard;
    title: string;
  } | null>(null);
  const [lastRedeemedSummary, setLastRedeemedSummary] = useState<{
    code: string;
    title: string;
    rewardTexts: string[];
  } | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fc_shop_claimed_free');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const redeemedCodeSet = new Set(
    (user.redeemedCodes ?? []).map((c) => c.toUpperCase())
  );

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 2600);
  };

  const getFreeClaimStorageKey = (item: ShopItem) =>
    item.id === 'shop_ticket_free_daily'
      ? `${item.id}_${getDaily6AMCycleKey()}`
      : item.id;

  const freeReadyCount = useMemo(() => {
    return defaultShopItems.filter(
      (i) => i.costType === 'free' && !purchasedIds.includes(getFreeClaimStorageKey(i))
    ).length;
  }, [purchasedIds]);

  const handleRedeemGiftCode = (rawInput?: string) => {
    soundService.playClick();
    const normalized = (rawInput ?? codeInput).trim().toUpperCase();

    if (!normalized) {
      showNotice('Vui lòng nhập mã Giftcode trước khi xác nhận!', 'error');
      return;
    }

    if (normalized === 'PASSTICKETADMIN') {
      onUpdateUser((prev) => ({
        unlockTickets: (prev.unlockTickets ?? 0) + 1,
      }));
      setCodeInput('');
      setLastRedeemedSummary({
        code: 'PASSTICKETADMIN',
        title: 'Mã Admin Vé Mở Khóa Sự Kiện',
        rewardTexts: ['+1 Vé Mở Khóa Trước Sự Kiện'],
      });
      try {
        confetti({
          particleCount: 95,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#f5d97e', '#d4af37', '#b6821f', '#ffffff'],
        });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +1 Vé Mở Khóa Trước Sự Kiện!');
      return;
    }

    if (normalized === 'STAFF2026FCMANAGER') {
      onUpdateUser((prev) => ({
        tickets: (prev.tickets ?? 0) + 1000,
      }));
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +1.000 Vé Quay!');
      return;
    }

    if (normalized === 'PROMANAGERFC2026') {
      onUpdateUser((prev) => ({
        totyShards: (prev.totyShards ?? 0) + 1000,
      }));
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 95, spread: 85, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +1.000 Mảnh Siêu Sao!');
      return;
    }

    if (normalized === 'MANAGERWORLD2026') {
      onUpdateUser((prev) => ({
        gems: prev.gems + 100000,
      }));
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +100.000 Kim Cương!');
      return;
    }

    if (normalized === 'COINMASTERFCMANAGER2026') {
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      if (onOpenPackTierDirectly) {
        soundService.playPackTear();
        onClose();
        onOpenPackTierDirectly('MIXED_100_PLUS');
        return;
      }
      soundService.playCoins();
      showNotice('Đã kích hoạt Gói Pack Hỗn Hợp 100+!');
      return;
    }

    if (normalized === '1000SHARDSVIETNAM') {
      if (redeemedCodeSet.has('1000SHARDSVIETNAM')) {
        showNotice('Mã quà tặng này đã được sử dụng trên tài khoản này!', 'error');
        return;
      }
      onUpdateUser((prev) => ({
        vietnamShards: (prev.vietnamShards ?? 0) + 1000,
        redeemedCodes: Array.from(
          new Set([...(prev.redeemedCodes ?? []), '1000SHARDSVIETNAM'])
        ),
      }));
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 95, spread: 85, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +1.000 Mảnh Việt Nam!');
      return;
    }

    if (normalized === 'DAILYBOOOSTERADMIN') {
      const dailyKey = `DAILYBOOOSTERADMIN_${getDaily6AMCycleKey()}`;
      if (redeemedCodeSet.has(dailyKey.toUpperCase())) {
        showNotice(
          'Bạn đã nhận quà hôm nay từ mã này! Làm mới lúc 06:00 sáng mỗi ngày.',
          'error'
        );
        return;
      }
      onUpdateUser((prev) => ({
        gems: prev.gems + 10000,
        redeemedCodes: Array.from(
          new Set([...(prev.redeemedCodes ?? []), dailyKey])
        ),
      }));
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +10.000 Kim Cương hôm nay (reset 06:00 sáng)!');
      return;
    }

    if (normalized === 'VIETNGON1115') {
      if (redeemedCodeSet.has('VIETNGON1115')) {
        showNotice('Mã quà tặng này đã được sử dụng trên tài khoản này!', 'error');
        return;
      }
      onUpdateUser((prev) => ({
        gems: prev.gems + 100000,
        redeemedCodes: Array.from(
          new Set([...(prev.redeemedCodes ?? []), 'VIETNGON1115'])
        ),
      }));
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      soundService.playCoins();
      showNotice('Nhận thành công +100.000 Kim Cương!');
      return;
    }

    if (normalized === 'ZIDANEISYOURS') {
      if (redeemedCodeSet.has('ZIDANEISYOURS')) {
        showNotice('Mã quà tặng này đã được sử dụng trên tài khoản này!', 'error');
        return;
      }
      onUpdateUser((prev) => {
        const curOwned = prev.ownedPlayerIds?.length
          ? prev.ownedPlayerIds
          : STARTER_OWNED_IDS;
        return {
          ownedPlayerIds: addOwnedPlayerCopies(curOwned, [zidaneBallonDor106.id]),
          redeemedCodes: Array.from(
            new Set([...(prev.redeemedCodes ?? []), 'ZIDANEISYOURS'])
          ),
        };
      });
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 110, spread: 95, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      const walkoutTitle = "CHỮ KÝ HUYỀN THOẠI · ZIDANE 106 OVR (BALLON D'OR)";
      if (onOpenWalkoutForPlayer) {
        soundService.playPackTear();
        onClose();
        onOpenWalkoutForPlayer(zidaneBallonDor106, walkoutTitle);
      } else {
        soundService.playPackTear();
        setFallbackWalkout({ player: zidaneBallonDor106, title: walkoutTitle });
      }
      return;
    }

    if (normalized === 'KAKAISYOURS') {
      if (redeemedCodeSet.has('KAKAISYOURS')) {
        showNotice('Mã quà tặng này đã được sử dụng trên tài khoản này!', 'error');
        return;
      }
      onUpdateUser((prev) => {
        const curOwned = prev.ownedPlayerIds?.length
          ? prev.ownedPlayerIds
          : STARTER_OWNED_IDS;
        return {
          ownedPlayerIds: addOwnedPlayerCopies(curOwned, [kakaBallonDor106.id]),
          redeemedCodes: Array.from(
            new Set([...(prev.redeemedCodes ?? []), 'KAKAISYOURS'])
          ),
        };
      });
      setCodeInput('');
      setLastRedeemedSummary(null);
      try {
        confetti({ particleCount: 110, spread: 95, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      const walkoutTitle = "CHỮ KÝ HUYỀN THOẠI · KAKÁ 106 OVR (BALLON D'OR)";
      if (onOpenWalkoutForPlayer) {
        soundService.playPackTear();
        onClose();
        onOpenWalkoutForPlayer(kakaBallonDor106, walkoutTitle);
      } else {
        soundService.playPackTear();
        setFallbackWalkout({ player: kakaBallonDor106, title: walkoutTitle });
      }
      return;
    }

    if (normalized === 'SUPERPACK') {
      const curOwnedSnapshot = user.ownedPlayerIds?.length
        ? user.ownedPlayerIds
        : STARTER_OWNED_IDS;
      const shouldShowDinhoWalkout = !curOwnedSnapshot.includes(ronaldinhoGift97.id);
      onUpdateUser((prev) => {
        const curOwned = prev.ownedPlayerIds?.length
          ? prev.ownedPlayerIds
          : STARTER_OWNED_IDS;
        return {
          gems: prev.gems + 1000000,
          ownedPlayerIds: addOwnedPlayerCopies(curOwned, [ronaldinhoGift97.id]),
        };
      });
      setCodeInput('');
      setLastRedeemedSummary({
        code: 'SUPERPACK',
        title: 'Mã Siêu Quà Tặng Vô Hạn',
        rewardTexts: [
          '+1.000.000 Kim Cương',
          '+Ronaldinho 97 OVR (RW · Ravenna FC · Serie C)',
        ],
      });
      try {
        confetti({ particleCount: 130, spread: 100, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
      if (shouldShowDinhoWalkout) {
        soundService.playPackTear();
        setFallbackWalkout({
          player: ronaldinhoGift97,
          title: 'QUÀ MÃ SUPERPACK · RONALDINHO 97 OVR',
        });
      } else {
        soundService.playCoins();
      }
      showNotice(
        'Nhận thành công +1.000.000 Kim Cương & Ronaldinho 97 OVR (Sử dụng vô hạn)!'
      );
      return;
    }

    const matched = SHOP_GIFT_CODES.find(
      (item) => item.code.toUpperCase() === normalized
    );
    if (!matched) {
      soundService.playTrophy();
      showNotice(`Mã "${normalized}" không hợp lệ hoặc không tồn tại!`, 'error');
      return;
    }

    if (redeemedCodeSet.has(matched.code.toUpperCase())) {
      showNotice(
        `Mã "${matched.code}" đã được sử dụng trên tài khoản này!`,
        'error'
      );
      return;
    }

    const r = matched.rewards;
    const nextRedeemed = Array.from(
      new Set([...(user.redeemedCodes ?? []), matched.code.toUpperCase()])
    );
    const rewardParts: string[] = [];

    if (r.coins) rewardParts.push(`+${r.coins.toLocaleString('vi-VN')} Xu`);
    if (r.gems) rewardParts.push(`+${r.gems.toLocaleString('vi-VN')} Kim Cương`);
    if (r.tickets) rewardParts.push(`+${r.tickets} Vé Quay`);
    if (r.totyTokens) rewardParts.push(`+${r.totyTokens} Token TOTY`);
    if (r.totyShards) rewardParts.push(`+${r.totyShards} Mảnh TOTY`);
    if (r.minigameTickets) rewardParts.push(`+${r.minigameTickets} Vé Minigame`);
    if (r.packTier) rewardParts.push('1 Gói Cầu Thủ TOTY 90–95');

    onUpdateUser({
      coins: user.coins + (r.coins ?? 0),
      gems: user.gems + (r.gems ?? 0),
      tickets: (user.tickets ?? 0) + (r.tickets ?? 0),
      totyTokens: (user.totyTokens ?? 0) + (r.totyTokens ?? 0),
      totyShards: (user.totyShards ?? 0) + (r.totyShards ?? 0),
      minigameTickets: (user.minigameTickets ?? 0) + (r.minigameTickets ?? 0),
      redeemedCodes: nextRedeemed,
    });

    setCodeInput('');
    setLastRedeemedSummary({
      code: matched.code,
      title: matched.title,
      rewardTexts: rewardParts,
    });

    try {
      confetti({ particleCount: 80, spread: 75, origin: { y: 0.55 } });
    } catch {
      // ignore
    }

    if (r.packTier && onOpenPackTierDirectly) {
      soundService.playPackTear();
      onClose();
      onOpenPackTierDirectly(r.packTier);
      return;
    }

    soundService.playCoins();
    showNotice(`Nhập mã ${matched.code} thành công! Nhận ${rewardParts.join(', ')}`);
  };

  const handleBuyItem = (item: ShopItem) => {
    soundService.playClick();

    const claimKey = getFreeClaimStorageKey(item);
    if (item.costType === 'free' && purchasedIds.includes(claimKey)) {
      showNotice(
        'Bạn đã nhận phần quà này hôm nay (làm mới lúc 06:00 sáng)!',
        'error'
      );
      return;
    }

    if (item.costType === 'gems' && user.gems < item.costAmount) {
      soundService.playTrophy();
      showNotice(
        `Không đủ Kim Cương! Cần thêm ${(
          item.costAmount - user.gems
        ).toLocaleString('vi-VN')} Kim Cương.`,
        'error'
      );
      return;
    }

    if (item.costType === 'coins' && user.coins < item.costAmount) {
      showNotice(
        `Không đủ Xu! Cần thêm ${(
          item.costAmount - user.coins
        ).toLocaleString('vi-VN')} Xu.`,
        'error'
      );
      return;
    }

    const curKickoff = normalizeKickoffState(user.kickoffState);
    const updatedUser: Partial<UserProfile> = {
      gems: item.costType === 'gems' ? user.gems - item.costAmount : user.gems,
      coins: item.costType === 'coins' ? user.coins - item.costAmount : user.coins,
      kickoffState: {
        ...curKickoff,
        shopActions: (curKickoff.shopActions ?? 0) + 1,
      },
    };

    if (item.rewardType === 'pack' && item.packTier) {
      onUpdateUser(updatedUser);
      soundService.playPackTear();
      onClose();
      if (onOpenPackTierDirectly) {
        onOpenPackTierDirectly(item.packTier);
      } else if (onOpenPackDirectly) {
        onOpenPackDirectly();
      }
      return;
    }

    if (item.rewardType === 'tickets') {
      updatedUser.tickets = (user.tickets || 0) + item.rewardAmount;
    } else if (item.rewardType === 'gingaTickets') {
      updatedUser.gingaTickets = (user.gingaTickets || 0) + item.rewardAmount;
    } else if (item.rewardType === 'matchSkipPasses') {
      updatedUser.matchSkipPasses = (user.matchSkipPasses ?? 0) + item.rewardAmount;
    } else if (item.rewardType === 'coins') {
      updatedUser.coins = (updatedUser.coins ?? user.coins) + item.rewardAmount;
    } else if (item.rewardType === 'energy') {
      updatedUser.energy = Math.min(user.maxEnergy, user.energy + item.rewardAmount);
    } else if (item.rewardType === 'gems') {
      updatedUser.gems = (updatedUser.gems ?? user.gems) + item.rewardAmount;
    } else if (item.rewardType === 'libertadoresTokens') {
      updatedUser.libertadoresTokens = (user.libertadoresTokens ?? 0) + item.rewardAmount;
    } else if (item.rewardType === 'signatureTokens') {
      updatedUser.signatureTokens = (user.signatureTokens ?? 0) + item.rewardAmount;
    } else if (item.rewardType === 'extraTimeTokens') {
      updatedUser.extraTimeTokens = (user.extraTimeTokens ?? 0) + item.rewardAmount;
    }

    if (item.id === 'shop_special_starter') {
      updatedUser.coins = (updatedUser.coins ?? user.coins) + 100000;
    }

    onUpdateUser(updatedUser);
    soundService.playConfirmSelection();

    if (item.costType === 'free') {
      const nextPurchased = [...purchasedIds, claimKey];
      setPurchasedIds(nextPurchased);
      try {
        localStorage.setItem('fc_shop_claimed_free', JSON.stringify(nextPurchased));
      } catch {
        // ignore
      }
    }

    showNotice(`Mua thành công: ${item.name}!`);
  };

  const ownedPlayerSet = useMemo(
    () =>
      new Set(
        user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS
      ),
    [user.ownedPlayerIds]
  );

  const handleExchangeFeaturedPlayer = (offer: ShopFeaturedOffer) => {
    soundService.playClick();
    if (ownedPlayerSet.has(offer.player.id)) {
      showNotice(
        `${offer.player.name} (${offer.player.ovr} OVR) đã có trong Kho CLB của bạn!`,
        'error'
      );
      return;
    }

    const currentShards = user.totyShards ?? 0;
    if (currentShards < offer.shardCost) {
      soundService.playTrophy();
      showNotice(
        `Chưa đủ Mảnh! Cần thêm ${(offer.shardCost - currentShards).toLocaleString(
          'vi-VN'
        )} Mảnh để đổi ${offer.player.name}.`,
        'error'
      );
      return;
    }

    onUpdateUser((prev) => {
      const curOwned = prev.ownedPlayerIds?.length
        ? prev.ownedPlayerIds
        : STARTER_OWNED_IDS;
      const curKickoff = normalizeKickoffState(prev.kickoffState);
      return {
        totyShards: Math.max(0, (prev.totyShards ?? 0) - offer.shardCost),
        ownedPlayerIds: addOwnedPlayerCopies(curOwned, [offer.player.id]),
        kickoffState: {
          ...curKickoff,
          shopActions: (curKickoff.shopActions ?? 0) + 1,
        },
      };
    });

    try {
      confetti({ particleCount: 110, spread: 95, origin: { y: 0.55 } });
    } catch {
      // ignore
    }

    soundService.playPackTear();
    setFallbackWalkout({
      player: offer.player,
      title: `CẦU THỦ NỔI BẬT · ${offer.player.name.toUpperCase()} (${offer.player.ovr} OVR)`,
    });
    showNotice(
      `Chiêu mộ thành công ${offer.player.name} (${offer.player.ovr} OVR) bằng ${offer.shardCost.toLocaleString(
        'vi-VN'
      )} Mảnh!`
    );
  };

  const displayedItems = useMemo(() => {
    let base = defaultShopItems;
    if (topTab === 'packs') {
      base = defaultShopItems.filter((i) => i.category === 'packs');
    } else if (topTab === 'tickets') {
      base = defaultShopItems.filter((i) => i.category === 'tickets');
    } else if (topTab === 'resources') {
      base = defaultShopItems.filter(
        (i) =>
          i.category === 'resources' ||
          i.category === 'special' ||
          i.rewardType === 'matchSkipPasses'
      );
    }

    if (sideFilter === 'hot_offers') {
      base = base.filter((i) => i.id.startsWith('shop_offer_'));
    } else if (sideFilter === 'featured') {
      base = base.filter((i) => i.featured);
    } else if (sideFilter === 'vouchers') {
      base = base.filter(
        (i) =>
          i.rewardType === 'tickets' ||
          i.rewardType === 'gingaTickets' ||
          i.rewardType === 'matchSkipPasses'
      );
    } else if (sideFilter === 'packs_only') {
      base = base.filter((i) => i.rewardType === 'pack');
    } else if (sideFilter === 'free_only') {
      base = base.filter((i) => i.costType === 'free');
    }

    return base;
  }, [topTab, sideFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-cruyff">
      {/* Subtle Stadium Pitch Background */}
      <img
        src="/assets/aistudio/ic_launcher_background_efb9615c.png"
        alt="Store Stadium Background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/85 to-black/95 pointer-events-none" />

      {/* Toast Notice */}
      {notification && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[75] px-5 py-2.5 border font-bold text-sm rounded-none ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-rose-950 border-rose-400 text-rose-200'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Top Section Header (Matching Store Sketch) */}
      <TopSectionHeader
        title="CỬA HÀNG"
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        onClickTickets={() => {
          if (onOpenTickets) {
            onClose();
            onOpenTickets();
          }
        }}
        onClickShards={() => {
          if (onOpenShards) {
            onClose();
            onOpenShards();
          }
        }}
      />

      {/* Top Horizontal Category Tabs — Border Divided, Sharp Corners, No Logos */}
      <nav className="relative z-10 w-full grid grid-cols-2 sm:grid-cols-6 border-b border-white/25 divide-x divide-y sm:divide-y-0 divide-white/25 bg-slate-900/95 shrink-0">
        {(
          [
            { id: 'recommended', label: 'ĐỀ XUẤT', count: freeReadyCount },
            { id: 'featured_players', label: 'CẦU THỦ NỔI BẬT', count: 0 },
            { id: 'tickets', label: 'VÉ QUAY & VOUCHER', count: 0 },
            { id: 'packs', label: 'GÓI CẦU THỦ', count: 0 },
            { id: 'resources', label: 'TÀI NGUYÊN & QUÀ', count: 0 },
            { id: 'giftcode', label: 'MÃ QUÀ TẶNG', count: 0 },
          ] as Array<{ id: TopStoreTab; label: string; count: number }>
        ).map((tab) => {
          const isActive = topTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundService.playTabSwitch();
                setTopTab(tab.id);
                setSideFilter('all');
              }}
              className={`py-3 px-3 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none whitespace-nowrap flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-t from-emerald-900/65 to-slate-900 text-white border-b-2 border-b-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-mono font-bold tabular-nums leading-none">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Store Workspace */}
      {topTab === 'featured_players' ? (
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-5">
            {/* Header Strip */}
            <div className="p-4 sm:p-5 border border-white/25 bg-gradient-to-r from-slate-950 via-indigo-950/75 to-slate-950 flex flex-wrap items-center justify-between gap-4 rounded-none">
              <div>
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest block">
                  CHIÊU MỘ BẰNG MẢNH · CỬA HÀNG ĐẶC BIỆT
                </span>
                <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                  CẦU THỦ NỔI BẬT (OVR 100–106)
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Đổi Mảnh Trao Đổi để nhận ngay các siêu sao Rivals độc quyền kèm hiệu ứng Walkout trao đổi cầu thủ.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 border border-yellow-400/50 bg-black/70 flex items-center gap-2.5 rounded-none">
                  <img
                    src="/assets/aistudio/currencylarge_STAR_SHARD_3dbbba71.png"
                    alt="Mảnh"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 object-contain"
                  />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block leading-none">
                      Mảnh hiện có
                    </span>
                    <span className="font-mono font-black text-lg text-yellow-300 tabular-nums leading-tight">
                      {(user.totyShards ?? 0).toLocaleString('vi-VN')} MẢNH
                    </span>
                  </div>
                </div>

                {onOpenShards && (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onClose();
                      onOpenShards();
                    }}
                    className="px-4 py-3 border border-cyan-400/60 bg-cyan-950/50 hover:bg-cyan-500 hover:text-slate-950 text-cyan-200 font-cruyff font-black text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-none"
                  >
                    ĐỔI THÊM MẢNH
                  </button>
                )}
              </div>
            </div>

            {/* 7 Featured Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shopFeaturedOffers.map((offer) => {
                const { player, shardCost } = offer;
                const isOwned = ownedPlayerSet.has(player.id);
                const canAfford = (user.totyShards ?? 0) >= shardCost;

                return (
                  <div
                    key={player.id}
                    className="border border-white/25 bg-gradient-to-b from-slate-900/95 via-indigo-950/70 to-black flex flex-col justify-between transition-colors hover:border-cyan-400/80 rounded-none"
                  >
                    {/* Card Title Header */}
                    <div className="p-3 border-b border-white/15 bg-black/40 text-center">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-950/90 border border-purple-400/50 text-[10px] font-mono font-black text-purple-200 tabular-nums">
                          {player.ovr} OVR · {player.position}
                        </span>
                        <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-400/50 text-[9px] font-cruyff font-black uppercase tracking-wider text-rose-200">
                          KHÔNG GIAO DỊCH
                        </span>
                      </div>
                      <h3 className="font-cruyff font-black text-base text-white uppercase tracking-wide truncate">
                        {player.name}
                      </h3>
                      <p className="text-[11px] text-slate-300 truncate">
                        {player.club} · {player.league} · {player.nation}
                      </p>
                    </div>

                    {/* Visual Card Frame (already bakes OVR, POS, Portrait) */}
                    <div className="py-4 px-3 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.16)_0%,_rgba(15,23,42,0.5)_75%)]">
                      <FCCard player={player} size="md" showStats={false} />
                    </div>

                    {/* Core Stats Grid */}
                    <div className="grid grid-cols-6 border-t border-white/15 divide-x divide-white/15 bg-black/60 text-center py-2 px-1 tabular-nums">
                      <div>
                        <span className="block text-[9px] text-slate-400">PAC</span>
                        <span className="font-mono font-bold text-xs text-white">{player.pac}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">SHO</span>
                        <span className="font-mono font-bold text-xs text-white">{player.sho}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">PAS</span>
                        <span className="font-mono font-bold text-xs text-white">{player.pas}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">DRI</span>
                        <span className="font-mono font-bold text-xs text-white">{player.dri}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">DEF</span>
                        <span className="font-mono font-bold text-xs text-white">{player.def}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">PHY</span>
                        <span className="font-mono font-bold text-xs text-white">{player.phy}</span>
                      </div>
                    </div>

                    {/* Exchange Action Bar */}
                    <button
                      type="button"
                      disabled={isOwned}
                      onClick={() => handleExchangeFeaturedPlayer(offer)}
                      className={`w-full py-3 px-4 border-t border-white/25 font-mono font-black text-sm flex items-center justify-center gap-2 transition-colors rounded-none tabular-nums ${
                        isOwned
                          ? 'bg-emerald-950/75 text-emerald-300 cursor-default font-cruyff text-xs uppercase tracking-wider'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 cursor-pointer'
                      }`}
                    >
                      {isOwned ? (
                        <span>ĐÃ SỞ HỮU TRONG CLB</span>
                      ) : (
                        <>
                          <img
                            src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
                            alt="Mảnh"
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 object-contain"
                          />
                          <span>{shardCost.toLocaleString('vi-VN')} MẢNH</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : topTab === 'giftcode' ? (
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 border border-white/25 divide-y lg:divide-y-0 lg:divide-x divide-white/25 bg-slate-950/90">
            {/* Left: Enter Code */}
            <div className="lg:col-span-5 p-5 flex flex-col justify-between gap-4 rounded-none">
              <div>
                <h2 className="font-cruyff font-black text-xl text-white uppercase tracking-wide border-b border-white/20 pb-2.5">
                  NHẬP MÃ GIFTCODE
                </h2>
                <p className="text-xs text-slate-300 mt-2">
                  Nhập mã quà tặng để nhận Vé Quay, Kim Cương, Xu và Mảnh Siêu Sao TOTY.
                </p>

                <div className="mt-4 flex flex-col gap-2.5">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRedeemGiftCode();
                    }}
                    placeholder="NHẬP MÃ TẠI ĐÂY..."
                    className="w-full px-3.5 py-2.5 bg-black/80 border border-white/30 focus:border-emerald-400 focus:outline-none font-mono font-bold text-sm text-white uppercase tracking-wider rounded-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRedeemGiftCode()}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider border border-emerald-300 cursor-pointer rounded-none"
                  >
                    XÁC NHẬN NHẬN QUÀ
                  </button>
                </div>
              </div>

              {lastRedeemedSummary && (
                <div className="p-3 border border-emerald-400/60 bg-emerald-950/40 text-xs text-emerald-200 rounded-none">
                  <div className="font-bold uppercase">
                    Đã kích hoạt: {lastRedeemedSummary.code}
                  </div>
                  <div className="text-slate-200 mt-1">
                    {lastRedeemedSummary.rewardTexts.join(' · ')}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Public Codes List */}
            <div className="lg:col-span-7 p-5 flex flex-col gap-3 rounded-none">
              <h3 className="font-cruyff font-black text-base text-white uppercase tracking-wider border-b border-white/20 pb-2.5">
                DANH SÁCH MÃ TÂN THỦ &amp; SỰ KIỆN ({SHOP_GIFT_CODES.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHOP_GIFT_CODES.map((gc) => {
                  const used = redeemedCodeSet.has(gc.code.toUpperCase());
                  return (
                    <div
                      key={gc.code}
                      className="p-3 border border-white/20 bg-black/60 flex flex-col justify-between gap-2 rounded-none"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-sm text-emerald-300">
                            {gc.code}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400">
                            {used ? 'Đã dùng' : 'Khả dụng'}
                          </span>
                        </div>
                        <div className="font-cruyff font-bold text-xs text-white mt-1">
                          {gc.title}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {gc.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={used}
                        onClick={() => handleRedeemGiftCode(gc.code)}
                        className={`w-full py-2 border text-xs font-cruyff font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-none ${
                          used
                            ? 'border-white/10 bg-white/5 text-slate-500 cursor-default'
                            : 'border-emerald-400/60 bg-emerald-950/50 hover:bg-emerald-500 hover:text-slate-950 text-emerald-200 cursor-pointer transition-colors'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{used ? 'ĐÃ NHẬN MÃ NÀY' : 'SỬ DỤNG NGAY'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Vertical Sub-Navigation (Matching Store Sketch Left Column) */}
          <aside className="w-full md:w-52 bg-slate-950/95 border-b md:border-b-0 md:border-r border-white/20 flex md:flex-col divide-x md:divide-x-0 md:divide-y divide-white/15 overflow-x-auto md:overflow-y-auto shrink-0">
            {(
              [
                { id: 'all', label: 'NỔI BẬT' },
                { id: 'hot_offers', label: 'GÓI ƯU ĐÃI' },
                { id: 'vouchers', label: 'VÉ QUAY SỰ KIỆN' },
                { id: 'packs_only', label: 'SIÊU GÓI TOTY' },
                { id: 'featured', label: 'BÁN CHẠY NHẤT' },
                { id: 'free_only', label: 'QUÀ MIỄN PHÍ' },
              ] as Array<{ id: SideFilterId; label: string }>
            ).map((sub) => {
              const active = sideFilter === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setSideFilter(sub.id);
                  }}
                  className={`py-3.5 px-4 text-left font-cruyff font-black text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer rounded-none ${
                    active
                      ? 'bg-gradient-to-r from-cyan-950/80 to-emerald-950/60 text-white border-b-2 border-b-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </aside>

          {/* Right Grid of Vertical Sharp-Cornered Offer Tiles (Matching Store Sketch) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5">
            {displayedItems.length === 0 ? (
              <div className="p-8 border border-white/20 bg-slate-900/60 text-center text-sm text-slate-300 rounded-none">
                Không có vật phẩm nào trong bộ lọc này. Hãy chọn mục khác ở thanh bên trái.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {displayedItems.map((item) => {
                  const claimKey = getFreeClaimStorageKey(item);
                  const isClaimedFree =
                    item.costType === 'free' && purchasedIds.includes(claimKey);
                  const isPack = item.rewardType === 'pack';

                  const isConmebolOffer =
                    item.packTier === 'CONMEBOL_100_103' ||
                    item.packTier === 'CONMEBOL_2_102_PLUS' ||
                    item.rewardType === 'libertadoresTokens';

                  return (
                    <div
                      key={item.id}
                      className={`border flex flex-col justify-between transition-colors rounded-none ${
                        isConmebolOffer
                          ? 'bg-gradient-to-b from-[#1a1206] via-[#0d0904] to-[#050403] border-[#d4af37]/70 hover:border-[#fbe59b]'
                          : isPack
                          ? 'bg-gradient-to-b from-blue-950/90 via-indigo-950/85 to-slate-950 border-blue-400/45 hover:border-yellow-300'
                          : 'bg-gradient-to-b from-emerald-900/75 via-teal-950/85 to-slate-950 border-emerald-400/45 hover:border-emerald-300'
                      }`}
                    >
                      {/* Top Header & Description */}
                      <div className="p-3 text-center">
                        <h3 className="font-cruyff font-bold text-sm text-white leading-snug line-clamp-2 min-h-[38px] flex items-center justify-center">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                        {isPack && (
                          <span className="mt-1 inline-block px-2 py-0.5 bg-rose-950/80 border border-rose-400/50 text-[9px] font-cruyff font-black uppercase tracking-wider text-rose-200">
                            KHÔNG GIAO DỊCH
                          </span>
                        )}
                      </div>

                      {/* Middle Quantity / Tier Band */}
                      <div
                        className={`border-y px-3 py-1 flex items-center justify-between text-xs font-mono font-black text-white tabular-nums ${
                          isConmebolOffer
                            ? 'border-[#d4af37]/45 bg-[#241908]/85'
                            : 'border-white/20 bg-white/10'
                        }`}
                      >
                        <span>
                          {item.rewardType === 'coins'
                            ? `+${(item.rewardAmount / 1000000).toFixed(0)}M XU`
                            : item.rewardType === 'tickets'
                            ? `x${item.rewardAmount} VÉ`
                            : item.rewardType === 'gingaTickets'
                            ? `x${item.rewardAmount} VÉ GINGA`
                            : item.rewardType === 'matchSkipPasses'
                            ? `x${item.rewardAmount} VÉ PASS (Có: ${user.matchSkipPasses ?? 0})`
                            : item.rewardType === 'energy'
                            ? `+${item.rewardAmount} EN`
                            : item.rewardType === 'libertadoresTokens'
                            ? `+${item.rewardAmount} TOKEN`
                            : item.rewardType === 'signatureTokens'
                            ? `+${item.rewardAmount} TOKEN CHỮ KÝ`
                            : item.rewardType === 'extraTimeTokens'
                            ? `+${item.rewardAmount.toLocaleString('vi-VN')} TOKEN HIỆP PHỤ`
                            : item.packTier === 'GINGA_100_OVR'
                            ? 'x1 GINGA 100+'
                            : item.packTier === 'GINGA_92_106'
                            ? 'x1 GINGA 92–106'
                            : item.packTier === 'CONMEBOL_100_103'
                            ? 'x2 CẦU THỦ'
                            : item.packTier === 'CONMEBOL_2_102_PLUS'
                            ? 'x1 CẦU THỦ 102+'
                            : 'x1 GÓI'}
                        </span>
                        {item.badge && (
                          <span
                            className={`uppercase font-cruyff text-[11px] ${
                              isConmebolOffer ? 'text-[#f5d97e]' : 'text-yellow-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Center Item Artwork */}
                      {item.packTier === 'STARTER_97' ? (
                        <div className="py-3 px-2 flex-1 flex flex-col items-center justify-center min-h-[195px] relative overflow-hidden bg-gradient-to-b from-amber-500/15 via-indigo-950/60 to-slate-950">
                          <div className="relative flex items-end justify-center w-full h-36">
                            <img
                              src="/assets/aistudio/cech_97_ovr_e37ae560.png"
                              alt="Petr Čech 97"
                              className="w-24 h-28 object-contain -mr-6 opacity-95 drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]"
                            />
                            <img
                              src="/assets/aistudio/ribery_97_ovr_1c56c6eb.png"
                              alt="Franck Ribéry 97"
                              className="w-28 h-34 object-contain z-10 drop-shadow-[0_10px_18px_rgba(250,204,21,0.45)]"
                            />
                            <img
                              src="/assets/aistudio/florenzi_97_ovr_e5047792.png"
                              alt="Alessandro Florenzi 97"
                              className="w-24 h-28 object-contain -ml-6 opacity-95 drop-shadow-[0_8px_14px_rgba(0,0,0,0.85)]"
                            />
                          </div>
                          <div className="mt-1 px-2 py-0.5 bg-amber-400/20 border border-amber-300/60 text-[10px] font-cruyff font-black text-amber-200 uppercase tracking-wider">
                            ČECH · RIBÉRY · FLORENZI
                          </div>
                        </div>
                      ) : isConmebolOffer ? (
                        <div className="flex-1 flex items-center justify-center bg-[#080603] min-h-[210px] overflow-hidden">
                          <img
                            src={
                              item.rewardType === 'libertadoresTokens'
                                ? getLibertadoresAsset('tokenLarge')
                                : item.packTier === 'CONMEBOL_2_102_PLUS'
                                ? getLibertadoresAsset('storePack')
                                : getLibertadoresAsset('storeOffer30k')
                            }
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className={
                              item.rewardType === 'libertadoresTokens'
                                ? 'w-28 h-28 object-contain drop-shadow-[0_8px_18px_rgba(212,175,55,0.45)]'
                                : 'w-full h-56 object-contain'
                            }
                          />
                        </div>
                      ) : item.isFullCardArt ? (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#135c47] via-[#0e6b40] to-[#0a522e] min-h-[195px] overflow-hidden">
                          <img
                            src={
                              item.image ||
                              '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png'
                            }
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-52 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="py-4 px-4 flex-1 flex items-center justify-center min-h-[195px]">
                          <img
                            src={
                              item.image ||
                              '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png'
                            }
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className={
                              isPack
                                ? 'w-32 h-40 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.75)]'
                                : 'w-24 h-24 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)]'
                            }
                          />
                        </div>
                      )}

                      {/* Bottom Price Action Bar */}
                      <button
                        type="button"
                        disabled={isClaimedFree}
                        onClick={() => handleBuyItem(item)}
                        className={`w-full py-2.5 px-3 border-t border-white/25 font-mono font-black text-sm flex items-center justify-center gap-1.5 transition-colors rounded-none tabular-nums ${
                          isClaimedFree
                            ? 'bg-slate-900/90 text-slate-500 cursor-default font-cruyff text-xs uppercase'
                            : item.costType === 'free'
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer font-cruyff text-xs uppercase'
                            : 'bg-black/45 hover:bg-emerald-500/30 text-white cursor-pointer'
                        }`}
                      >
                        {isClaimedFree ? (
                          <span>ĐÃ NHẬN</span>
                        ) : item.costType === 'free' ? (
                          <span>NHẬN MIỄN PHÍ</span>
                        ) : (
                          <>
                            <img
                              src={
                                item.costType === 'gems'
                                  ? '/assets/aistudio/currencysmall_CASH_b2121428.png'
                                  : '/assets/aistudio/currencysmall_COIN_ec777114.png'
                              }
                              alt="Giá"
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 object-contain"
                            />
                            <span>{item.costAmount.toLocaleString('vi-VN')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      {fallbackWalkout && (
        <PackOpeningModal
          fixedPlayer={fallbackWalkout.player}
          packTier="UTOTY"
          packTheme="UTOTY"
          packName={fallbackWalkout.title}
          isTicketSpin={false}
          autoStartWalkout={true}
          isIconChroniclesExchange={true}
          skipResourceBonus={true}
          onClose={() => setFallbackWalkout(null)}
          onPlayerClaimed={() => {}}
        />
      )}
    </div>
  );
};
