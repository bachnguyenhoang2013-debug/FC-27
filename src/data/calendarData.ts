import { getDaily6AMCycleKey } from '../utils/dateUtils';

export type CalendarRewardType = 'gems' | 'coins' | 'tickets';

export interface CalendarDailyReward {
  type: CalendarRewardType;
  amount: number;
  shortAmountLabel: string;
  labelVi: string;
  labelEn: string;
  iconUrl: string;
  isSpecialHoliday?: boolean;
  holidayTitleVi?: string;
  holidayTitleEn?: string;
  holidayReasonVi?: string;
  holidayReasonEn?: string;
  bonusUnlockTickets?: number;
}

export const CALENDAR_ASSETS = {
  background: '/assets/aistudio/background_l_ch_696f58f9.png',
  rewardFrame: '/assets/aistudio/khung_hi_n_ph_n_th__ng_l_ch_b0f4b1cf.png',
  mysteryBox: '/assets/aistudio/logo_ph_n_th__ng_bi_n_ni_n_s__icons_2e69c3ae.png',
  gemsIcon: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  coinsIcon: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  ticketsIcon: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  unlockTicketIcon: '/assets/aistudio/v__m__kh_a_tr__c_s__ki_n_27573358.png',
} as const;

const SEQUENTIAL_CALENDAR_REWARDS: readonly CalendarDailyReward[] = [
  {
    type: 'gems',
    amount: 500,
    shortAmountLabel: '500',
    labelVi: '500 Kim Cương',
    labelEn: '500 Gems',
    iconUrl: CALENDAR_ASSETS.gemsIcon,
  },
  {
    type: 'coins',
    amount: 50000,
    shortAmountLabel: '50K',
    labelVi: '50.000 Coin',
    labelEn: '50,000 Coins',
    iconUrl: CALENDAR_ASSETS.coinsIcon,
  },
  {
    type: 'tickets',
    amount: 2,
    shortAmountLabel: 'x2',
    labelVi: '2 Vé Quay',
    labelEn: '2 Spin Tickets',
    iconUrl: CALENDAR_ASSETS.ticketsIcon,
  },
];

/**
 * Formats a (year, month 1..12, day 1..31) tuple into YYYY-MM-DD.
 */
export function formatCalendarDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Resolves the surprise reward for a given calendar date:
 * - Follows the 3-day sequential cycle: 500 Gems -> 50,000 Coins -> 2 Tickets
 * - Special event overrides (5 Spin Tickets):
 *   - 20/10: Special Gift
 *   - 11/11: Side Event CONMEBOL Libertadores
 *   - 18/11: Side Event Champions Juventus
 */
export function getCalendarRewardForDate(
  _year: number,
  month: number,
  day: number
): CalendarDailyReward {
  if (month === 10 && day === 20) {
    return {
      type: 'tickets',
      amount: 5,
      shortAmountLabel: 'x5',
      labelVi: '5 Vé Quay',
      labelEn: '5 Spin Tickets',
      iconUrl: CALENDAR_ASSETS.ticketsIcon,
      isSpecialHoliday: true,
      holidayTitleVi: 'Quà Đặc Biệt 20/10',
      holidayTitleEn: 'Oct 20 Special Gift',
      holidayReasonVi: 'Sự kiện đặc biệt ngày 20/10 — Nhận 5 Vé Quay.',
      holidayReasonEn: 'October 20 special reward — Grants 5 Spin Tickets.',
    };
  }

  if (month === 11 && day === 11) {
    return {
      type: 'tickets',
      amount: 5,
      shortAmountLabel: 'x5+Vé',
      labelVi: '5 Vé Quay + 1 Vé Mở Khóa CONMEBOL',
      labelEn: '5 Spin Tickets + 1 CONMEBOL Unlock Ticket',
      iconUrl: CALENDAR_ASSETS.unlockTicketIcon,
      isSpecialHoliday: true,
      bonusUnlockTickets: 1,
      holidayTitleVi: 'Sự Kiện Phụ CONMEBOL Libertadores',
      holidayTitleEn: 'CONMEBOL Libertadores Side Event',
      holidayReasonVi: 'Tặng thêm 1 Vé Mở Khóa CONMEBOL Libertadores & 5 Vé Quay.',
      holidayReasonEn: 'Grants +1 CONMEBOL Libertadores Unlock Ticket & 5 Spin Tickets.',
    };
  }

  if (month === 11 && day === 18) {
    return {
      type: 'tickets',
      amount: 5,
      shortAmountLabel: 'x5',
      labelVi: '5 Vé Quay',
      labelEn: '5 Spin Tickets',
      iconUrl: CALENDAR_ASSETS.ticketsIcon,
      isSpecialHoliday: true,
      holidayTitleVi: 'Sự Kiện Phụ Champions Juventus',
      holidayTitleEn: 'Champions Juventus Side Event',
      holidayReasonVi: 'Ngày 18/11: Sự kiện phụ Champions Juventus — Thưởng 5 Vé Quay.',
      holidayReasonEn: 'Nov 18: Champions Juventus side event — Grants 5 Spin Tickets.',
    };
  }

  const cycleIndex = (Math.max(1, day) - 1) % SEQUENTIAL_CALENDAR_REWARDS.length;
  return SEQUENTIAL_CALENDAR_REWARDS[cycleIndex];
}

export function isTodayCalendarClaimed(
  claimedDates?: string[],
  now: Date = new Date()
): boolean {
  if (!Array.isArray(claimedDates) || claimedDates.length === 0) return false;
  const todayKey = getDaily6AMCycleKey(now);
  return claimedDates.includes(todayKey);
}
