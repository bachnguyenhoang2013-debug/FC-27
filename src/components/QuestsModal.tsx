import React, { useEffect, useMemo, useState } from 'react';
import {
  Target,
  CheckCircle2,
  X,
  Coins,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
} from 'lucide-react';
import { DailyQuest } from '../types/game';
import { soundService } from '../services/sound';
import { useLanguage } from '../i18n/language';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
} from '../utils/dateUtils';
import {
  CALENDAR_ASSETS,
  formatCalendarDateKey,
  getCalendarRewardForDate,
} from '../data/calendarData';

export type QuestsModalTabId = 'quests' | 'calendar';

interface QuestsModalProps {
  quests: DailyQuest[];
  calendarClaimedDates: string[];
  calendarUnlockTicketClaimed?: boolean;
  initialTab?: QuestsModalTabId;
  onClose: () => void;
  onClaimQuest: (questId: string) => void;
  onClaimCalendarToday: () => void;
  onClaimCalendarUnlockTicket?: () => void;
}

const WEEKDAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAYS_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const QuestsModal: React.FC<QuestsModalProps> = ({
  quests,
  calendarClaimedDates,
  calendarUnlockTicketClaimed = false,
  initialTab = 'quests',
  onClose,
  onClaimQuest,
  onClaimCalendarToday,
  onClaimCalendarUnlockTicket,
}) => {
  const { t, locale, isEn } = useLanguage();
  const [activeTab, setActiveTab] = useState<QuestsModalTabId>(initialTab);
  const [now, setNow] = useState<Date>(() => new Date());

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1..12
  const currentDay = now.getDate();

  const [viewYear, setViewYear] = useState<number>(currentYear);
  const [viewMonth, setViewMonth] = useState<number>(currentMonth);
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const todayMidnightKey = useMemo(() => getDaily6AMCycleKey(now), [now]);
  const midnightCountdown = useMemo(() => getCountdownToNext6AM(now), [now]);

  const claimedDateSet = useMemo(
    () => new Set(calendarClaimedDates),
    [calendarClaimedDates]
  );

  const isTodayClaimed = claimedDateSet.has(todayMidnightKey);
  const completedCount = quests.filter((q) => q.completed).length;
  const readyQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;

  const todayReward = useMemo(
    () => getCalendarRewardForDate(currentYear, currentMonth, currentDay),
    [currentYear, currentMonth, currentDay]
  );

  const daysInViewMonth = useMemo(
    () => new Date(viewYear, viewMonth, 0).getDate(),
    [viewYear, viewMonth]
  );

  const firstDayMondayOffset = useMemo(() => {
    const jsDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    return (jsDay + 6) % 7;
  }, [viewYear, viewMonth]);

  const clampedSelectedDay = Math.min(selectedDay, daysInViewMonth);
  const selectedDateKey = formatCalendarDateKey(viewYear, viewMonth, clampedSelectedDay);
  const selectedReward = useMemo(
    () => getCalendarRewardForDate(viewYear, viewMonth, clampedSelectedDay),
    [viewYear, viewMonth, clampedSelectedDay]
  );
  const isSelectedToday = selectedDateKey === todayMidnightKey;
  const isSelectedPast = selectedDateKey < todayMidnightKey;
  const isSelectedClaimed = claimedDateSet.has(selectedDateKey);

  const claimedThisViewMonthCount = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}-`;
    let count = 0;
    claimedDateSet.forEach((d) => {
      if (d.startsWith(prefix)) count += 1;
    });
    return count;
  }, [claimedDateSet, viewYear, viewMonth]);

  const handlePrevMonth = () => {
    soundService.playClick();
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
      setSelectedDay(1);
    } else {
      const nextMonth = viewMonth - 1;
      setViewMonth(nextMonth);
      setSelectedDay(nextMonth === currentMonth && viewYear === currentYear ? currentDay : 20);
    }
  };

  const handleNextMonth = () => {
    soundService.playClick();
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
      setSelectedDay(1);
    } else {
      const nextMonth = viewMonth + 1;
      setViewMonth(nextMonth);
      setSelectedDay(nextMonth === currentMonth && viewYear === currentYear ? currentDay : 1);
    }
  };

  const handleJumpToday = () => {
    soundService.playClick();
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setSelectedDay(currentDay);
  };

  const handleTriggerClaimToday = () => {
    if (isTodayClaimed) return;
    soundService.playCoins();
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setSelectedDay(currentDay);
    onClaimCalendarToday();
  };

  const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
  const monthTitle = isEn
    ? `${MONTH_NAMES_EN[viewMonth - 1]} ${viewYear}`
    : `Tháng ${String(viewMonth).padStart(2, '0')} / ${viewYear}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none font-cruyff">
      <div
        className={`relative w-full max-w-4xl border-2 rounded-2xl p-4 sm:p-6 flex flex-col max-h-[92vh] font-cruyff overflow-hidden transition-colors ${
          activeTab === 'calendar'
            ? 'bg-[#12042b] border-fuchsia-400/70 shadow-[0_0_55px_rgba(192,132,252,0.3)]'
            : 'bg-[#050b1d] border-cyan-400/60 shadow-[0_0_50px_rgba(34,211,238,0.22)]'
        }`}
      >
        {/* Dynamic Backdrop: Calendar Purple Geometric Image vs Daily Quests Stadium Night */}
        {activeTab === 'calendar' ? (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <img
              src={CALENDAR_ASSETS.background}
              alt=""
              className="w-full h-full object-cover opacity-80 select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#13052e]/80 via-[#1a073d]/60 to-[#0c0320]/90" />
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full blur-2xl opacity-70 bg-sky-500/30" />
            <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full blur-2xl opacity-45 bg-cyan-500/20" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d285e]/75 via-[#08193d]/45 to-transparent" />
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/15">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                activeTab === 'calendar'
                  ? 'bg-[#1c0940]/90 border-fuchsia-300/60 shadow-[0_0_16px_rgba(217,70,239,0.35)]'
                  : 'bg-slate-900/90 border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.3)]'
              }`}
            >
              {activeTab === 'calendar' ? (
                <CalendarIcon className="w-5 h-5 text-fuchsia-200" />
              ) : (
                <svg viewBox="0 0 28 28" className="w-6 h-6">
                  <defs>
                    <linearGradient id="fv26QuestChevron" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="55%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M8 4 L20 14 L8 24 L8 19 L14 14 L8 9 Z"
                    fill="url(#fv26QuestChevron)"
                  />
                  <line x1="7" y1="9" x2="18" y2="9" stroke="#050b1d" strokeWidth="1.4" />
                  <line x1="7" y1="14" x2="20" y2="14" stroke="#050b1d" strokeWidth="1.4" />
                  <line x1="7" y1="19" x2="18" y2="19" stroke="#050b1d" strokeWidth="1.4" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-cruyff font-black text-lg sm:text-xl text-white uppercase italic tracking-wider truncate">
                {activeTab === 'calendar'
                  ? t('LỊCH QUÀ TẶNG BẤT NGỜ', 'SURPRISE REWARD CALENDAR')
                  : t('NHIỆM VỤ HÀNG NGÀY & STAR PASS', 'DAILY QUESTS & STAR PASS')}
              </h2>
              {activeTab === 'calendar' ? (
                <p className="text-xs text-purple-100/90 font-cruyff tabular-nums">
                  {t('Làm mới lúc 06:00 mỗi ngày', 'Resets daily at 06:00 AM')}
                  <span aria-hidden="true"> · </span>
                  {t('Còn lại', 'Time left')}{' '}
                  <span className="text-cyan-300 font-bold">{midnightCountdown}</span>
                </p>
              ) : (
                <p className="text-xs text-sky-200/85 font-cruyff tabular-nums">
                  {t('Hoàn thành', 'Completed')}{' '}
                  <span className="text-yellow-300 font-black">
                    {completedCount}/{quests.length}
                  </span>{' '}
                  {t('mục tiêu hôm nay', 'goals today')}
                  <span aria-hidden="true"> · </span>
                  {t('Reset', 'Resets')}{' '}
                  <span className="text-cyan-300 font-bold">
                    {t('06:00 sáng', '06:00 AM')}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Segmented Tab Switcher + Close Button */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/15">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveTab('quests');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-cruyff font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'quests'
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span>{t('Nhiệm Vụ', 'Quests')}</span>
                {readyQuestsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black tabular-nums ${
                      activeTab === 'quests'
                        ? 'bg-slate-950 text-cyan-300'
                        : 'bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {readyQuestsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveTab('calendar');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-cruyff font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'bg-gradient-to-r from-cyan-300 via-fuchsia-200 to-amber-200 text-slate-950 shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{t('Lịch', 'Calendar')}</span>
                {(!isTodayClaimed || !calendarUnlockTicketClaimed) && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 text-[10px] font-mono font-black tabular-nums">
                    {(!isTodayClaimed ? 1 : 0) + (!calendarUnlockTicketClaimed ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              aria-label={t('Đóng', 'Close')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-gray-200 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        {activeTab === 'quests' ? (
          <div className="relative z-10 mt-4 space-y-3 overflow-y-auto pr-1">
            {quests.map((q) => {
              const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.maxProgress)) * 100));
              return (
                <div
                  key={q.id}
                  className="rounded-xl bg-[#0a142d]/85 backdrop-blur-md border border-cyan-300/30 shadow-[0_8px_24px_rgba(2,6,23,0.65)] overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-300 shrink-0" />
                        <h3 className="font-cruyff font-bold text-sm sm:text-base text-white">
                          {q.title}
                        </h3>
                        {q.completed && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <span className="font-mono text-xs text-cyan-200 font-black tabular-nums">
                        {q.progress}/{q.maxProgress}
                      </span>
                    </div>

                    <div className="mt-2.5 h-2 bg-slate-950/90 rounded-full overflow-hidden border border-cyan-300/20">
                      <svg className="w-full h-full block" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={`questProg_${q.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="50%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#fde047" />
                          </linearGradient>
                        </defs>
                        <rect
                          x="0"
                          y="0"
                          width={`${pct}%`}
                          height="100%"
                          fill={`url(#questProg_${q.id})`}
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="px-3.5 sm:px-4 py-2.5 border-t-2 border-dashed border-sky-200/35 bg-[#071128]/90 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums">
                      {q.reward.type === 'gems' && (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> +{q.reward.amount}{' '}
                          {t('Kim Cương', 'Gems')}
                        </span>
                      )}
                      {q.reward.type === 'coins' && (
                        <span className="text-yellow-300 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" /> +
                          {q.reward.amount.toLocaleString(locale)} {t('Xu', 'Coins')}
                        </span>
                      )}
                      {q.reward.type === 'pass' && (
                        <span className="text-sky-200 flex items-center gap-1.5">
                          <img
                            src="/assets/aistudio/currencysmall_XP_24b56012.png"
                            alt="XP"
                            className="w-4 h-4 object-contain"
                          />
                          +{q.reward.amount} Star Pass EXP
                        </span>
                      )}
                    </div>

                    <div>
                      {q.claimed ? (
                        <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
                          {t('Đã nhận (1/1)', 'Claimed (1/1)')}
                        </span>
                      ) : q.completed ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (q.claimed) return;
                            soundService.playCoins();
                            onClaimQuest(q.id);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-yellow-300 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-95 shadow-md shadow-yellow-500/25 cursor-pointer whitespace-nowrap border border-yellow-100"
                        >
                          {t('Nhận Thưởng', 'Claim')}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300/80 whitespace-nowrap">
                          {t('Chưa xong', 'In Progress')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative z-10 mt-4 overflow-y-auto pr-1 flex flex-col gap-4">
            {/* Top Calendar Subbar: Sequence Info + Month Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
              <div className="text-xs text-purple-100/95 leading-relaxed">
                <span className="font-bold text-white">
                  {t('Thứ tự quà bất ngờ:', 'Surprise reward order:')}
                </span>{' '}
                <span className="text-cyan-200 font-semibold">
                  {t('500 Kim Cương', '500 Gems')}
                </span>
                <span aria-hidden="true"> → </span>
                <span className="text-amber-300 font-semibold">
                  {t('50.000 Coin', '50,000 Coins')}
                </span>
                <span aria-hidden="true"> → </span>
                <span className="text-rose-200 font-semibold">
                  {t('2 Vé Quay', '2 Spin Tickets')}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="text-yellow-300 font-bold">
                  {viewMonth === 10
                    ? t('Đặc biệt 20/10: 5 Vé Quay', 'Oct 20 Special: 5 Spin Tickets')
                    : t(
                        'Sự kiện phụ 11/11 (Libertadores) & 18/11 (Champions Juventus): 5 Vé Quay',
                        'Side Events 11/11 (Libertadores) & 18/11 (Champions Juventus): 5 Spin Tickets'
                      )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isViewingCurrentMonth && (
                  <button
                    type="button"
                    onClick={handleJumpToday}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-cyan-200 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    {t('Hôm nay', 'Today')}
                  </button>
                )}

                <div className="flex items-center gap-1 bg-black/45 border border-white/20 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label={t('Tháng trước', 'Previous month')}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-purple-100 hover:text-white cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white tabular-nums min-w-[128px] text-center">
                    {monthTitle}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label={t('Tháng sau', 'Next month')}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-purple-100 hover:text-white cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Special Calendar Bonus Gift: +1 CONMEBOL Libertadores Unlock Ticket */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#241908]/95 via-[#3b280d]/90 to-[#1a1206]/95 border border-[#e6c35c]/75 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_24px_rgba(212,175,55,0.28)]">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={CALENDAR_ASSETS.unlockTicketIcon}
                  alt="Vé Mở Khóa CONMEBOL Libertadores"
                  className="w-11 h-11 object-contain shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-black uppercase tracking-widest text-[#f5d97e]">
                    {t('QUÀ TẶNG THÊM TỪ LỊCH SỰ KIỆN', 'CALENDAR EVENT BONUS GIFT')}
                  </div>
                  <div className="font-cruyff font-black text-sm sm:text-base text-white uppercase truncate">
                    {t(
                      'TẶNG +1 VÉ MỞ KHÓA CONMEBOL LIBERTADORES',
                      'BONUS +1 CONMEBOL LIBERTADORES UNLOCK TICKET'
                    )}
                  </div>
                  <p className="text-[11px] text-[#e8d7b0]">
                    {t(
                      'Dùng để mở khóa sớm sự kiện phụ CONMEBOL Libertadores ngay hôm nay trước ngày 11/11.',
                      'Use to unlock the CONMEBOL Libertadores side event early before Nov 11.'
                    )}
                  </p>
                </div>
              </div>

              {calendarUnlockTicketClaimed ? (
                <span className="px-4 py-2 rounded-lg bg-white/10 border border-[#d4af37]/40 text-xs font-cruyff font-black uppercase tracking-wider text-emerald-300 whitespace-nowrap">
                  {t('ĐÃ NHẬN +1 VÉ MỞ KHÓA', 'CLAIMED +1 UNLOCK TICKET')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playCoins();
                    if (onClaimCalendarUnlockTicket) {
                      onClaimCalendarUnlockTicket();
                    }
                  }}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#f5d97e] via-[#e6c35c] to-[#c9972b] hover:brightness-110 text-[#120c04] border border-[#fff4cc] font-cruyff font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(245,217,126,0.45)] cursor-pointer whitespace-nowrap"
                >
                  {t('NHẬN NGAY +1 VÉ MỞ KHÓA', 'CLAIM +1 UNLOCK TICKET')}
                </button>
              )}
            </div>

            {/* Main 2-Column Layout: Spotlight Card (Left) + Monthly Calendar Image Grid (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT SPOTLIGHT PANEL: TODAY / SELECTED DAY DETAIL */}
              <div className="lg:col-span-4 flex flex-col items-center text-center bg-black/40 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/15">
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300 tabular-nums">
                  {isSelectedToday
                    ? t(
                        `HÔM NAY · ${String(currentDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`,
                        `TODAY · ${String(currentDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`
                      )
                    : t(
                        `NGÀY ${String(clampedSelectedDay).padStart(2, '0')}/${String(viewMonth).padStart(2, '0')}/${viewYear}`,
                        `DATE ${String(clampedSelectedDay).padStart(2, '0')}/${String(viewMonth).padStart(2, '0')}/${viewYear}`
                      )}
                </div>

                {/* Uploaded Calendar Reward Card Frame (131x135 native, inner dark card: left 27.5%, right 6.1%, top 5.9%, bottom 7.4%) */}
                <div className="relative w-44 sm:w-48 aspect-[131/135] my-3 -ml-[10.5%]">
                  <img
                    src={CALENDAR_ASSETS.rewardFrame}
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)]"
                  />

                  {/* Exact Dark-Card Interior Safe Box */}
                  <div className="absolute left-[27.5%] right-[6.1%] top-[5.9%] bottom-[7.4%] flex flex-col items-center justify-center">
                    <span className="absolute top-1.5 right-2 font-mono text-[11px] font-black text-white/90 tabular-nums leading-none">
                      {String(clampedSelectedDay).padStart(2, '0')}/{String(viewMonth).padStart(2, '0')}
                    </span>

                    {/* Reveal icon if claimed OR if special 20/10 (20/11) holiday; otherwise show Surprise Gift Box */}
                    {isSelectedClaimed || selectedReward.isSpecialHoliday ? (
                      <div className="flex flex-col items-center justify-center text-center px-1.5 pt-2">
                        <img
                          src={selectedReward.iconUrl}
                          alt={isEn ? selectedReward.labelEn : selectedReward.labelVi}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto drop-shadow-[0_6px_16px_rgba(0,0,0,0.75)]"
                        />
                        <span className="mt-1.5 font-mono text-xs sm:text-sm font-black text-yellow-300 tabular-nums leading-none">
                          +{selectedReward.amount.toLocaleString(locale)}
                        </span>
                        <span className="text-[10px] font-bold text-white/90 leading-tight mt-0.5">
                          {isEn ? selectedReward.labelEn : selectedReward.labelVi}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center px-1.5 pt-2">
                        <img
                          src={CALENDAR_ASSETS.mysteryBox}
                          alt={t('Quà Bất Ngờ', 'Surprise Gift')}
                          className={`w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto drop-shadow-[0_6px_18px_rgba(250,204,21,0.45)] ${
                            isSelectedPast ? 'grayscale opacity-55' : ''
                          }`}
                        />
                        <span className="mt-1.5 font-cruyff text-xs font-black text-amber-200 uppercase tracking-wider leading-tight">
                          {isSelectedPast
                            ? t('Đã Qua Ngày', 'Missed')
                            : t('Quà Bất Ngờ ?', 'Surprise ?')}
                        </span>
                      </div>
                    )}

                    {isSelectedClaimed && (
                      <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Date Title & Status Explanation */}
                <h3 className="font-cruyff font-black text-sm sm:text-base text-white uppercase tracking-wide leading-snug">
                  {selectedReward.isSpecialHoliday
                    ? isEn
                      ? selectedReward.holidayTitleEn
                      : selectedReward.holidayTitleVi
                    : isSelectedClaimed
                    ? isEn
                      ? selectedReward.labelEn
                      : selectedReward.labelVi
                    : t('Phần Thưởng Bất Ngờ Hàng Ngày', 'Daily Surprise Reward')}
                </h3>

                {selectedReward.isSpecialHoliday && (
                  <p className="mt-1 text-xs font-semibold text-yellow-300 leading-snug">
                    {isEn ? selectedReward.holidayReasonEn : selectedReward.holidayReasonVi}
                  </p>
                )}

                <p className="mt-1.5 text-xs text-purple-100/85 leading-relaxed">
                  {isSelectedClaimed
                    ? t(
                        'Bạn đã mở và nhận phần thưởng của ngày này thành công.',
                        'You have already opened and claimed the reward for this date.'
                      )
                    : isSelectedToday
                    ? t(
                        'Nhấn nút bên dưới để mở hộp quà bất ngờ hôm nay trước 06:00 sáng!',
                        'Press the button below to claim today’s surprise gift before 06:00 AM!'
                      )
                    : isSelectedPast
                    ? t(
                        'Lưu ý: Phần thưởng từ ngày trước đã qua sẽ không được nhận lại.',
                        'Note: Unclaimed rewards from previous days cannot be claimed.'
                      )
                    : t(
                        'Phần thưởng ngày này sẽ mở khóa đúng vào lúc 06:00 của ngày đó.',
                        'This date’s reward unlocks at 06:00 AM on that calendar day.'
                      )}
                </p>

                {/* Primary Claim Action (Always bound strictly to Today before 00:00) */}
                <div className="w-full mt-4 pt-3 border-t border-white/15 flex flex-col gap-2">
                  {!isTodayClaimed ? (
                    <button
                      type="button"
                      onClick={handleTriggerClaimToday}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-300 via-cyan-300 to-yellow-300 hover:brightness-105 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_6px_22px_rgba(52,211,153,0.35)] active:scale-98 cursor-pointer transition-all whitespace-nowrap"
                    >
                      {todayReward.isSpecialHoliday
                        ? t('NHẬN NGAY 5 VÉ QUAY HÔM NAY', 'CLAIM 5 TICKETS TODAY')
                        : t('MỞ QUÀ BẤT NGỜ HÔM NAY', 'CLAIM TODAY SURPRISE')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 border border-white/20 text-emerald-300 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider cursor-not-allowed whitespace-nowrap"
                    >
                      {t('ĐÃ NHẬN QUÀ HÔM NAY', 'CLAIMED TODAY')}
                    </button>
                  )}

                  <div className="text-[11px] text-purple-200/80 tabular-nums">
                    {t('Đã nhận trong tháng:', 'Claimed this month:')}{' '}
                    <span className="font-bold text-white">
                      {claimedThisViewMonthCount}/{daysInViewMonth}
                    </span>
                    <span aria-hidden="true"> · </span>
                    {t('Reset 06:00', 'Resets 06:00')}
                  </div>
                </div>
              </div>

              {/* RIGHT CALENDAR GRID PANEL */}
              <div className="lg:col-span-8 bg-black/35 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-white/15">
                {/* Weekday Header Row (offset pl-[21%] so labels center directly over each dark card body) */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5 text-center">
                  {(isEn ? WEEKDAYS_EN : WEEKDAYS_VI).map((wd) => (
                    <div
                      key={wd}
                      className="pl-[21%] text-[11px] font-cruyff font-black uppercase tracking-wider text-purple-200/90 py-1"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Days Grid Using Uploaded Frame Asset (131x135 native, inner dark card: left 27.5%, right 6.1%, top 5.9%, bottom 7.4%) */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: firstDayMondayOffset }).map((_, emptyIdx) => (
                    <div key={`empty_${emptyIdx}`} className="aspect-[131/135]" aria-hidden="true" />
                  ))}

                  {Array.from({ length: daysInViewMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const cellDateKey = formatCalendarDateKey(viewYear, viewMonth, dayNum);
                    const cellReward = getCalendarRewardForDate(viewYear, viewMonth, dayNum);
                    const isCellToday = cellDateKey === todayMidnightKey;
                    const isCellPast = cellDateKey < todayMidnightKey;
                    const isCellClaimed = claimedDateSet.has(cellDateKey);
                    const isCellSelected = dayNum === clampedSelectedDay;

                    return (
                      <button
                        key={cellDateKey}
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setSelectedDay(dayNum);
                          if (isCellToday && !isCellClaimed) {
                            soundService.playCoins();
                            onClaimCalendarToday();
                          }
                        }}
                        title={
                          isCellPast && !isCellClaimed
                            ? t(
                                `Ngày ${dayNum}/${viewMonth}: Đã qua — không thể nhận phần thưởng ngày trước`,
                                `Day ${dayNum}/${viewMonth}: Missed — past rewards cannot be claimed`
                              )
                            : isCellToday && !isCellClaimed
                            ? t(
                                `Ngày ${dayNum}/${viewMonth}: Nhấn để nhận quà bất ngờ hôm nay`,
                                `Day ${dayNum}/${viewMonth}: Click to claim today's surprise reward`
                              )
                            : `${dayNum}/${viewMonth}/${viewYear}`
                        }
                        className={`group relative aspect-[131/135] transition-transform cursor-pointer focus-visible:outline-none ${
                          isCellToday && !isCellClaimed
                            ? 'scale-[1.04]'
                            : 'hover:scale-[1.03]'
                        } ${isCellPast && !isCellClaimed ? 'opacity-45 grayscale' : ''}`}
                      >
                        {/* Uploaded Calendar Card Frame */}
                        <img
                          src={CALENDAR_ASSETS.rewardFrame}
                          alt=""
                          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                        />

                        {/* Exact Dark-Card Interior Safe Box (aligned to x:36..122, y:8..124 of 131x135 PNG) */}
                        <div
                          className={`absolute left-[27.5%] right-[6.1%] top-[5.9%] bottom-[7.4%] rounded-[18%] flex flex-col items-center justify-center ${
                            isCellToday && !isCellClaimed
                              ? 'ring-2 ring-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.5)]'
                              : isCellSelected
                              ? 'ring-2 ring-cyan-300/90'
                              : ''
                          }`}
                        >
                          {/* Day Number */}
                          <span
                            className={`absolute top-1 right-1.5 z-10 font-mono text-[9px] sm:text-[11px] font-black tabular-nums leading-none ${
                              isCellToday
                                ? 'text-emerald-300'
                                : cellReward.isSpecialHoliday
                                ? 'text-yellow-300'
                                : 'text-white/90'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {/* Centered Reward / Mystery Content */}
                          <div className="relative z-10 flex flex-col items-center justify-center text-center pt-1.5">
                            {isCellClaimed || cellReward.isSpecialHoliday ? (
                              <>
                                <img
                                  src={cellReward.iconUrl}
                                  alt=""
                                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain mx-auto drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]"
                                />
                                <span
                                  className={`mt-0.5 font-mono text-[9px] sm:text-[10px] font-black tabular-nums leading-none ${
                                    cellReward.isSpecialHoliday
                                      ? 'text-yellow-300'
                                      : 'text-cyan-200'
                                  }`}
                                >
                                  {cellReward.shortAmountLabel}
                                </span>
                              </>
                            ) : (
                              <>
                                <img
                                  src={CALENDAR_ASSETS.mysteryBox}
                                  alt=""
                                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain mx-auto drop-shadow-[0_3px_8px_rgba(0,0,0,0.75)]"
                                />
                                <span className="mt-0.5 font-mono text-[9px] sm:text-[10px] font-black text-amber-200 leading-none">
                                  {isCellPast ? '—' : '?'}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Status Corner Indicator */}
                          {isCellClaimed ? (
                            <span className="absolute bottom-0.5 right-1 z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                            </span>
                          ) : isCellPast ? (
                            <span className="absolute bottom-0.5 right-1 z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-800/90 text-slate-400 flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Legend Note */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-100/85">
                  <span>
                    {t(
                      'Lưu ý: Phần thưởng từ ngày trước sẽ không được nhận khi qua 06:00 sáng.',
                      'Note: Rewards from previous days cannot be claimed once 06:00 AM passes.'
                    )}
                  </span>
                  <span className="text-yellow-300 font-semibold">
                    {t(
                      '11/11 CONMEBOL Libertadores · 18/11 Champions Juventus: 5 Vé Quay',
                      '11/11 CONMEBOL Libertadores · 18/11 Champions Juventus: 5 Tickets'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
