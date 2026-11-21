import { KickoffEventState, UserProfile } from '../types/game';
import { STARTER_OWNED_IDS } from './mockData';

export const KICKOFF_TOTAL_DAYS = 7;
export const KICKOFF_QUESTS_PER_DAY = 5;
export const KICKOFF_UNLOCK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours per day
export const KICKOFF_QUEST_GEMS_REWARD = 200;
export const KICKOFF_QUEST_STAR_POINTS_REWARD = 50;
export const KICKOFF_DAY_STAR_POINTS_REWARD = 50;

export const KICKOFF_ASSETS = {
  questFrame: '/assets/aistudio/khung_nhi_m_v__m_c_kh_i___u_69def374.png',
  ticketRewardArt:
    '/assets/aistudio/_nh_hi_n_th__ph_n_th__ng_v__quay_m_c_kh_i___u_9ff47727.png',
  coinRewardArt:
    '/assets/aistudio/_nh_hi_n_th__ph_n_th__ng_coin_m_c_kh_i___u_bead28fa.png',
  diamondRewardArt:
    '/assets/aistudio/_nh_hi_n_th__ph_n_th__ng_kim_c__ng_m_c_kh_i___u_fa372a4b.png',
  gemSmallIcon: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  coinSmallIcon: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  ticketLargeIcon: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  starPassIcon: '/assets/aistudio/logo_star_pass_02de823e.png',
} as const;

export type KickoffActionRoute =
  | 'claim_only'
  | 'tickets'
  | 'career'
  | 'ranked'
  | 'team'
  | 'tactics'
  | 'club'
  | 'shop'
  | 'star_pass'
  | 'icons'
  | 'toty'
  | 'ginga';

export type KickoffDayRewardType = 'tickets' | 'coins' | 'gems';

export interface KickoffQuestConfig {
  id: string;
  day: number;
  title: string;
  subtitle: string;
  target: number;
  actionRoute: KickoffActionRoute;
  actionLabel: string;
  getProgress: (user: UserProfile, state: KickoffEventState) => number;
}

export interface KickoffDayConfig {
  day: number;
  title: string;
  titleEn?: string;
  unlockHoursOffset: number;
  milestoneReward: {
    type: KickoffDayRewardType;
    amount: number;
    starPoints: number;
    label: string;
    labelEn?: string;
    shortBadge: string;
    shortBadgeEn?: string;
    cardImageUrl: string;
  };
  quests: KickoffQuestConfig[];
}

export const createInitialKickoffState = (nowMs: number = Date.now()): KickoffEventState => ({
  startedAt: nowMs,
  claimedQuestIds: [],
  claimedDayRewards: [],
  spinsOpened: 0,
  careerMatches: 0,
  rankedMatches: 0,
  clubMatches: 0,
  squadEdits: 0,
  trainingUpgrades: 0,
  shopActions: 0,
  playStyleChanges: 0,
  iconActions: 0,
  totyTokensEarned: 0,
});

export const normalizeKickoffState = (
  raw?: KickoffEventState | null,
  nowMs: number = Date.now()
): KickoffEventState => {
  if (!raw || typeof raw.startedAt !== 'number' || raw.startedAt <= 0) {
    return createInitialKickoffState(nowMs);
  }
  return {
    startedAt: raw.startedAt,
    claimedQuestIds: Array.isArray(raw.claimedQuestIds) ? raw.claimedQuestIds : [],
    claimedDayRewards: Array.isArray(raw.claimedDayRewards) ? raw.claimedDayRewards : [],
    spinsOpened: Math.max(0, raw.spinsOpened ?? 0),
    careerMatches: Math.max(0, raw.careerMatches ?? 0),
    rankedMatches: Math.max(0, raw.rankedMatches ?? 0),
    clubMatches: Math.max(0, raw.clubMatches ?? 0),
    squadEdits: Math.max(0, raw.squadEdits ?? 0),
    trainingUpgrades: Math.max(0, raw.trainingUpgrades ?? 0),
    shopActions: Math.max(0, raw.shopActions ?? 0),
    playStyleChanges: Math.max(0, raw.playStyleChanges ?? 0),
    iconActions: Math.max(0, raw.iconActions ?? 0),
    totyTokensEarned: Math.max(0, raw.totyTokensEarned ?? 0),
  };
};

const getTotalRankedPlayed = (user: UserProfile, state: KickoffEventState): number => {
  const rk = user.rankedState;
  const lifetimeRanked = (rk?.wins ?? 0) + (rk?.draws ?? 0) + (rk?.losses ?? 0);
  return Math.max(lifetimeRanked, state.rankedMatches ?? 0);
};

const getTotalSpinsOpened = (user: UserProfile, state: KickoffEventState): number =>
  Math.max(user.ticketsOpenedCount ?? 0, state.spinsOpened ?? 0);

const getTotalCareerPlayed = (user: UserProfile, state: KickoffEventState): number =>
  Math.max(user.careerMatchesPlayed ?? 0, state.careerMatches ?? 0);

const getTotalClubPlayed = (user: UserProfile, state: KickoffEventState): number =>
  Math.max(user.clubDaily?.matchesPlayed ?? 0, state.clubMatches ?? 0);

const getOwnedPlayerCount = (user: UserProfile): number =>
  Math.max(STARTER_OWNED_IDS.length, user.ownedPlayerIds?.length ?? STARTER_OWNED_IDS.length);

export const KICKOFF_DAYS: KickoffDayConfig[] = [
  {
    day: 1,
    title: 'NGÀY 1 · RA MẮT CLB',
    titleEn: 'DAY 1 · CLUB DEBUT',
    unlockHoursOffset: 0,
    milestoneReward: {
      type: 'tickets',
      amount: 10,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '10 Vé Quay + 50 Star Point',
      labelEn: '10 Spin Tickets + 50 Star Points',
      shortBadge: '10 VÉ QUAY + 50 SP',
      shortBadgeEn: '10 TICKETS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.ticketRewardArt,
    },
    quests: [
      {
        id: 'd1_q1',
        day: 1,
        title: 'Đăng nhập & nhậm chức Huấn Luyện Viên CLB',
        subtitle: 'Bắt đầu hành trình 7 ngày Khởi Động',
        target: 1,
        actionRoute: 'claim_only',
        actionLabel: 'Sẵn sàng',
        getProgress: () => 1,
      },
      {
        id: 'd1_q2',
        day: 1,
        title: 'Mở 1 Vé Quay hoặc Gói Cầu Thủ bất kỳ',
        subtitle: 'Chiêu mộ tân binh đầu tiên cho đội bóng',
        target: 1,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd1_q3',
        day: 1,
        title: 'Vào Đội Hình sắp xếp cầu thủ hoặc Huấn Luyện CLB',
        subtitle: 'Kiểm tra sơ đồ chiến thuật hoặc nâng cấp CLB',
        target: 1,
        actionRoute: 'team',
        actionLabel: 'Vào Đội Hình',
        getProgress: (user, st) =>
          Math.max(
            st.squadEdits ?? 0,
            st.trainingUpgrades ?? 0,
            user.trainingLevel ?? 0,
            user.activeFormationId && user.activeFormationId !== '4-3-3-attack' ? 1 : 0
          ),
      },
      {
        id: 'd1_q4',
        day: 1,
        title: 'Thi đấu 1 trận Đấu Sự Nghiệp Ngoại Hạng Anh',
        subtitle: 'Ra sân vòng đấu chính thức cùng CLB',
        target: 1,
        actionRoute: 'career',
        actionLabel: 'Đấu Sự Nghiệp',
        getProgress: (user, st) => getTotalCareerPlayed(user, st),
      },
      {
        id: 'd1_q5',
        day: 1,
        title: 'Nhận quà miễn phí hoặc giao dịch 1 lần tại Cửa Hàng',
        subtitle: 'Ghé Cửa Hàng nhận gói tiếp tế hoặc nhập Giftcode',
        target: 1,
        actionRoute: 'shop',
        actionLabel: 'Vào Cửa Hàng',
        getProgress: (user, st) =>
          Math.max(
            st.shopActions ?? 0,
            user.redeemedCodes?.length ?? 0,
            user.dailyCheckInClaimed ? 1 : 0
          ),
      },
    ],
  },
  {
    day: 2,
    title: 'NGÀY 2 · CHIẾN THUẬT',
    titleEn: 'DAY 2 · TACTICS',
    unlockHoursOffset: 6,
    milestoneReward: {
      type: 'tickets',
      amount: 20,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '20 Vé Quay + 50 Star Point',
      labelEn: '20 Spin Tickets + 50 Star Points',
      shortBadge: '20 VÉ QUAY + 50 SP',
      shortBadgeEn: '20 TICKETS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.ticketRewardArt,
    },
    quests: [
      {
        id: 'd2_q1',
        day: 2,
        title: 'Mở tích lũy 3 Vé Quay Siêu Sao',
        subtitle: 'Săn cầu thủ OVR cao tại mục Vé Quay',
        target: 3,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd2_q2',
        day: 2,
        title: 'Thi đấu 1 trận Đấu Xếp Hạng Trực Tuyến',
        subtitle: 'Tranh tài 60 giây tích lũy Sao xếp hạng',
        target: 1,
        actionRoute: 'ranked',
        actionLabel: 'Đấu Xếp Hạng',
        getProgress: (user, st) => getTotalRankedPlayed(user, st),
      },
      {
        id: 'd2_q3',
        day: 2,
        title: 'Thiết lập hoặc đổi Phong Cách Chơi cho CLB',
        subtitle: 'Chọn Tiki-Taka, Gegenpress, Phản Công hoặc Phòng Ngự',
        target: 1,
        actionRoute: 'tactics',
        actionLabel: 'Chọn Phong Cách',
        getProgress: (user, st) =>
          Math.max(st.playStyleChanges ?? 0, user.playStyle ? 1 : 0),
      },
      {
        id: 'd2_q4',
        day: 2,
        title: 'Nâng cấp Huấn Luyện CLB đạt Cấp 2 trở lên',
        subtitle: 'Tăng chỉ số toàn đội bằng ngân sách Xu',
        target: 2,
        actionRoute: 'team',
        actionLabel: 'Huấn Luyện CLB',
        getProgress: (user, st) =>
          Math.max(user.trainingLevel ?? 0, st.trainingUpgrades ?? 0),
      },
      {
        id: 'd2_q5',
        day: 2,
        title: 'Thi đấu tích lũy 2 trận Đấu Sự Nghiệp',
        subtitle: 'Chinh phục bảng xếp hạng Premier League',
        target: 2,
        actionRoute: 'career',
        actionLabel: 'Đấu Sự Nghiệp',
        getProgress: (user, st) => getTotalCareerPlayed(user, st),
      },
    ],
  },
  {
    day: 3,
    title: 'NGÀY 3 · TĂNG TỐC',
    titleEn: 'DAY 3 · MOMENTUM',
    unlockHoursOffset: 12,
    milestoneReward: {
      type: 'tickets',
      amount: 20,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '20 Vé Quay + 50 Star Point',
      labelEn: '20 Spin Tickets + 50 Star Points',
      shortBadge: '20 VÉ QUAY + 50 SP',
      shortBadgeEn: '20 TICKETS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.ticketRewardArt,
    },
    quests: [
      {
        id: 'd3_q1',
        day: 3,
        title: 'Sở hữu ít nhất 20 cầu thủ trong danh sách CLB',
        subtitle: 'Mở rộng chiều sâu đội hình từ Vé Quay hoặc Cửa Hàng',
        target: 20,
        actionRoute: 'tickets',
        actionLabel: 'Chiêu Mộ',
        getProgress: (user) => getOwnedPlayerCount(user),
      },
      {
        id: 'd3_q2',
        day: 3,
        title: 'Mở tích lũy 6 Vé Quay Siêu Sao',
        subtitle: 'Tích lũy lượt quay nhận siêu sao mùa giải',
        target: 6,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd3_q3',
        day: 3,
        title: 'Thi đấu 1 trận Tâm Điểm CLB (45 giây)',
        subtitle: 'Vào Đội Hình → CLB Tâm Điểm nhận Token CLB',
        target: 1,
        actionRoute: 'club',
        actionLabel: 'Đấu CLB 45s',
        getProgress: (user, st) =>
          Math.max(getTotalClubPlayed(user, st), (user.clubTokens ?? 0) > 0 ? 1 : 0),
      },
      {
        id: 'd3_q4',
        day: 3,
        title: 'Thi đấu tích lũy 2 trận Đấu Xếp Hạng',
        subtitle: 'Thử sức chiến thuật và dùng Emoji Chat trong trận',
        target: 2,
        actionRoute: 'ranked',
        actionLabel: 'Đấu Xếp Hạng',
        getProgress: (user, st) => getTotalRankedPlayed(user, st),
      },
      {
        id: 'd3_q5',
        day: 3,
        title: 'Đạt tổng cộng 200 Star Point trong Star Pass',
        subtitle: 'Hoàn thành nhiệm vụ & trận đấu để tích Star Point',
        target: 200,
        actionRoute: 'star_pass',
        actionLabel: 'Xem Star Pass',
        getProgress: (user) => user.starPass?.points ?? 0,
      },
    ],
  },
  {
    day: 4,
    title: 'NGÀY 4 · NGÂN SÁCH VÀNG',
    titleEn: 'DAY 4 · GOLDEN TREASURY',
    unlockHoursOffset: 18,
    milestoneReward: {
      type: 'coins',
      amount: 5_000_000,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '5.000.000 Coin + 50 Star Point',
      labelEn: '5,000,000 Coins + 50 Star Points',
      shortBadge: '5 TRIỆU COIN + 50 SP',
      shortBadgeEn: '5M COINS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.coinRewardArt,
    },
    quests: [
      {
        id: 'd4_q1',
        day: 4,
        title: 'Mở tích lũy 10 Vé Quay Siêu Sao',
        subtitle: 'Quay 1 vé hoặc 10 vé liên tiếp tại Vòng Quay',
        target: 10,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd4_q2',
        day: 4,
        title: 'Thi đấu tích lũy 3 trận Đấu Sự Nghiệp',
        subtitle: 'Nhận thưởng Xu gấp 3 lần mỗi vòng đấu Sự Nghiệp',
        target: 3,
        actionRoute: 'career',
        actionLabel: 'Đấu Sự Nghiệp',
        getProgress: (user, st) => getTotalCareerPlayed(user, st),
      },
      {
        id: 'd4_q3',
        day: 4,
        title: 'Nâng cấp Huấn Luyện CLB đạt Cấp 5 trở lên',
        subtitle: 'Cứ mỗi 5 cấp Huấn Luyện tăng +1 OVR toàn đội',
        target: 5,
        actionRoute: 'team',
        actionLabel: 'Huấn Luyện CLB',
        getProgress: (user, st) =>
          Math.max(user.trainingLevel ?? 0, st.trainingUpgrades ?? 0),
      },
      {
        id: 'd4_q4',
        day: 4,
        title: 'Tham gia Biên Niên Sử Huyền Thoại tại mục Icons',
        subtitle: 'Trả lời câu hỏi hằng ngày hoặc trao đổi Icons',
        target: 1,
        actionRoute: 'icons',
        actionLabel: 'Vào Mục Icons',
        getProgress: (user, st) =>
          Math.max(
            st.iconActions ?? 0,
            user.iconChroniclesDaily?.quizCompleted ? 1 : 0,
            (user.iconTokens ?? 0) > 0 ? 1 : 0
          ),
      },
      {
        id: 'd4_q5',
        day: 4,
        title: 'Thi đấu tích lũy 3 trận Đấu Xếp Hạng',
        subtitle: 'Leo bậc xếp hạng nhận Kim Cương thăng hạng',
        target: 3,
        actionRoute: 'ranked',
        actionLabel: 'Đấu Xếp Hạng',
        getProgress: (user, st) => getTotalRankedPlayed(user, st),
      },
    ],
  },
  {
    day: 5,
    title: 'NGÀY 5 · BỨT PHÁ ĐỘI HÌNH',
    titleEn: 'DAY 5 · SQUAD BREAKTHROUGH',
    unlockHoursOffset: 24,
    milestoneReward: {
      type: 'gems',
      amount: 2_500,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '2.500 Kim Cương + 50 Star Point',
      labelEn: '2,500 Gems + 50 Star Points',
      shortBadge: '2.500 GEMS + 50 SP',
      shortBadgeEn: '2,500 GEMS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.diamondRewardArt,
    },
    quests: [
      {
        id: 'd5_q1',
        day: 5,
        title: 'Mở tích lũy 15 Vé Quay Siêu Sao',
        subtitle: 'Bổ sung dàn sao TOTY, EURO 2024 & Future Stars',
        target: 15,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd5_q2',
        day: 5,
        title: 'Sở hữu ít nhất 23 cầu thủ trong danh sách CLB',
        subtitle: 'Sưu tầm cầu thủ đa dạng vị trí trên sân',
        target: 23,
        actionRoute: 'tickets',
        actionLabel: 'Chiêu Mộ',
        getProgress: (user) => getOwnedPlayerCount(user),
      },
      {
        id: 'd5_q3',
        day: 5,
        title: 'Tích lũy ít nhất 20 Token TOTY từ các chế độ',
        subtitle: 'Nhận Token TOTY từ Sự Kiện TOTY 26 hoặc Đấu Sự Nghiệp',
        target: 20,
        actionRoute: 'toty',
        actionLabel: 'Sự Kiện TOTY',
        getProgress: (user, st) =>
          Math.max(user.totyTokens ?? 0, st.totyTokensEarned ?? 0),
      },
      {
        id: 'd5_q4',
        day: 5,
        title: 'Thi đấu tích lũy 4 trận Đấu Sự Nghiệp',
        subtitle: 'Duy trì phong độ đỉnh cao tại Ngoại Hạng Anh',
        target: 4,
        actionRoute: 'career',
        actionLabel: 'Đấu Sự Nghiệp',
        getProgress: (user, st) => getTotalCareerPlayed(user, st),
      },
      {
        id: 'd5_q5',
        day: 5,
        title: 'Thi đấu tích lũy 4 trận Đấu Xếp Hạng',
        subtitle: 'Khẳng định bản lĩnh Huấn Luyện Viên trực tuyến',
        target: 4,
        actionRoute: 'ranked',
        actionLabel: 'Đấu Xếp Hạng',
        getProgress: (user, st) => getTotalRankedPlayed(user, st),
      },
    ],
  },
  {
    day: 6,
    title: 'NGÀY 6 · ĐẲNG CẤP CHÂU LỤC',
    titleEn: 'DAY 6 · CONTINENTAL CLASS',
    unlockHoursOffset: 30,
    milestoneReward: {
      type: 'gems',
      amount: 5_000,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '5.000 Kim Cương + 50 Star Point',
      labelEn: '5,000 Gems + 50 Star Points',
      shortBadge: '5.000 GEMS + 50 SP',
      shortBadgeEn: '5,000 GEMS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.diamondRewardArt,
    },
    quests: [
      {
        id: 'd6_q1',
        day: 6,
        title: 'Mở tích lũy 22 Vé Quay Siêu Sao',
        subtitle: 'Tận dụng nguồn Vé Quay từ phần thưởng Khởi Động',
        target: 22,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd6_q2',
        day: 6,
        title: 'Nâng cấp Huấn Luyện CLB đạt Cấp 8 trở lên',
        subtitle: 'Dùng Xu thưởng nâng tầm sức mạnh CLB',
        target: 8,
        actionRoute: 'team',
        actionLabel: 'Huấn Luyện CLB',
        getProgress: (user, st) =>
          Math.max(user.trainingLevel ?? 0, st.trainingUpgrades ?? 0),
      },
      {
        id: 'd6_q3',
        day: 6,
        title: 'Giành ít nhất 1 trận thắng Đấu Xếp Hạng (hoặc đấu 5 trận)',
        subtitle: 'Chiến thắng trận cầu 60 giây kịch tính',
        target: 1,
        actionRoute: 'ranked',
        actionLabel: 'Đấu Xếp Hạng',
        getProgress: (user, st) =>
          Math.max(
            user.rankedState?.wins ?? 0,
            getTotalRankedPlayed(user, st) >= 5 ? 1 : 0
          ),
      },
      {
        id: 'd6_q4',
        day: 6,
        title: 'Thi đấu tích lũy 2 trận Tâm Điểm CLB (45 giây)',
        subtitle: 'Hoàn thành thử thách câu lạc bộ nhận Token CLB',
        target: 2,
        actionRoute: 'club',
        actionLabel: 'Đấu CLB 45s',
        getProgress: (user, st) =>
          Math.max(getTotalClubPlayed(user, st), Math.floor((user.clubTokens ?? 0) / 15)),
      },
      {
        id: 'd6_q5',
        day: 6,
        title: 'Đạt tổng cộng 800 Star Point trong Star Pass',
        subtitle: 'Mở khóa hàng loạt mốc quà giá trị tại Star Pass',
        target: 800,
        actionRoute: 'star_pass',
        actionLabel: 'Xem Star Pass',
        getProgress: (user) => user.starPass?.points ?? 0,
      },
    ],
  },
  {
    day: 7,
    title: 'NGÀY 7 · SIÊU SAO KHỞI ĐẦU',
    titleEn: 'DAY 7 · KICKOFF SUPERSTAR',
    unlockHoursOffset: 36,
    milestoneReward: {
      type: 'gems',
      amount: 10_000,
      starPoints: KICKOFF_DAY_STAR_POINTS_REWARD,
      label: '10.000 Kim Cương + 50 Star Point',
      labelEn: '10,000 Gems + 50 Star Points',
      shortBadge: '10.000 GEMS + 50 SP',
      shortBadgeEn: '10,000 GEMS + 50 SP',
      cardImageUrl: KICKOFF_ASSETS.diamondRewardArt,
    },
    quests: [
      {
        id: 'd7_q1',
        day: 7,
        title: 'Mở tích lũy 30 Vé Quay Siêu Sao',
        subtitle: 'Chinh phục mốc chiêu mộ siêu sao tuần lễ Khởi Động',
        target: 30,
        actionRoute: 'tickets',
        actionLabel: 'Mở Vé Quay',
        getProgress: (user, st) => getTotalSpinsOpened(user, st),
      },
      {
        id: 'd7_q2',
        day: 7,
        title: 'Đạt OVR Đội Hình từ 86 trở lên (hoặc Huấn Luyện Cấp 10)',
        subtitle: 'Xây dựng đội hình chính thức giàu sức cạnh tranh',
        target: 86,
        actionRoute: 'team',
        actionLabel: 'Nâng Đội Hình',
        getProgress: (user) =>
          (user.trainingLevel ?? 0) >= 10 ? 86 : user.ovr ?? 0,
      },
      {
        id: 'd7_q3',
        day: 7,
        title: 'Thi đấu tích lũy 5 trận Đấu Sự Nghiệp',
        subtitle: 'Khẳng định vị thế ứng viên vô địch giải đấu',
        target: 5,
        actionRoute: 'career',
        actionLabel: 'Đấu Sự Nghiệp',
        getProgress: (user, st) => getTotalCareerPlayed(user, st),
      },
      {
        id: 'd7_q4',
        day: 7,
        title: 'Thi đấu tích lũy 5 trận Đấu Xếp Hạng',
        subtitle: 'Hoàn tất chuỗi thử thách đối kháng trực tuyến',
        target: 5,
        actionRoute: 'ranked',
        actionLabel: 'Đấu Xếp Hạng',
        getProgress: (user, st) => getTotalRankedPlayed(user, st),
      },
      {
        id: 'd7_q5',
        day: 7,
        title: 'Sở hữu ít nhất 26 cầu thủ trong danh sách CLB',
        subtitle: 'Hoàn thiện bộ khung đội hình chính & dự bị',
        target: 26,
        actionRoute: 'tickets',
        actionLabel: 'Chiêu Mộ',
        getProgress: (user) => getOwnedPlayerCount(user),
      },
    ],
  },
];

export const isKickoffDayUnlocked = (
  state: KickoffEventState,
  day: number,
  nowMs: number = Date.now()
): boolean => {
  if (day <= 1) return true;
  const requiredAt = state.startedAt + (day - 1) * KICKOFF_UNLOCK_INTERVAL_MS;
  return nowMs >= requiredAt;
};

export const getKickoffDayUnlockTimestamp = (
  state: KickoffEventState,
  day: number
): number => {
  if (day <= 1) return state.startedAt;
  return state.startedAt + (day - 1) * KICKOFF_UNLOCK_INTERVAL_MS;
};

export const getNextLockedKickoffDayInfo = (
  state: KickoffEventState,
  nowMs: number = Date.now()
): { nextDay: number; unlockAt: number; remainingMs: number } | null => {
  for (let d = 2; d <= KICKOFF_TOTAL_DAYS; d++) {
    const unlockAt = getKickoffDayUnlockTimestamp(state, d);
    if (nowMs < unlockAt) {
      return {
        nextDay: d,
        unlockAt,
        remainingMs: Math.max(0, unlockAt - nowMs),
      };
    }
  }
  return null;
};

export const formatKickoffCountdown = (remainingMs: number): string => {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
    secs
  ).padStart(2, '0')}`;
};

export const isKickoffCompleted = (state?: KickoffEventState | null): boolean => {
  if (!state) return false;
  const claimedDays = new Set(state.claimedDayRewards ?? []);
  const claimedQuests = new Set(state.claimedQuestIds ?? []);
  for (const dayCfg of KICKOFF_DAYS) {
    if (!claimedDays.has(dayCfg.day)) return false;
    for (const q of dayCfg.quests) {
      if (!claimedQuests.has(q.id)) return false;
    }
  }
  return true;
};

export const countReadyKickoffClaims = (
  user: UserProfile,
  nowMs: number = Date.now()
): number => {
  const st = normalizeKickoffState(user.kickoffState, nowMs);
  if (isKickoffCompleted(st)) return 0;

  const claimedQuests = new Set(st.claimedQuestIds);
  const claimedDays = new Set(st.claimedDayRewards);
  let readyCount = 0;

  for (const dayCfg of KICKOFF_DAYS) {
    if (!isKickoffDayUnlocked(st, dayCfg.day, nowMs)) continue;

    let completedInDay = 0;
    for (const q of dayCfg.quests) {
      const isClaimed = claimedQuests.has(q.id);
      const prog = Math.min(q.target, Math.max(0, q.getProgress(user, st)));
      const isDone = isClaimed || prog >= q.target;
      if (isDone) completedInDay += 1;
      if (isDone && !isClaimed) {
        readyCount += 1;
      }
    }

    if (completedInDay >= KICKOFF_QUESTS_PER_DAY && !claimedDays.has(dayCfg.day)) {
      readyCount += 1;
    }
  }

  return readyCount;
};
