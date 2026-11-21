import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  CraftCardDrop,
  CraftLeagueId,
  CraftPositionId,
} from '../types/game';
import { PackTier } from './PackOpeningModal';
import { TopSectionHeader } from './TopSectionHeader';
import {
  CraftingCardBadge,
  normalizeCraftInventory,
  rollRandomCraftCardDrop,
} from './CraftingCardBadge';
import {
  getDaily6AMCycleKey,
  getCountdownToNext6AM,
  normalizeTotyDailyStreak,
  formatSevenDayCountdown,
} from '../utils/dateUtils';
import { soundService } from '../services/sound';

interface TotyDailyStreakModalProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenRewardPack: (tier: PackTier, customName: string) => void;
  onClickGems?: () => void;
  onClickTickets?: () => void;
  onClickShards?: () => void;
  onClose: () => void;
}

const STREAK_REWARDS: Array<{
  day: number;
  title: string;
  amountText: string;
  subText: string;
  iconSrc: string;
}> = [
  {
    day: 1,
    title: 'NGÀY 01',
    amountText: '+2 Vé Quay',
    subText: 'Vé Quay Siêu Sao',
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    day: 2,
    title: 'NGÀY 02',
    amountText: '+700.000 Xu',
    subText: 'Ngân sách Huấn luyện & Chuyển nhượng',
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    day: 3,
    title: 'NGÀY 03',
    amountText: '+100 Mảnh TOTY',
    subText: 'Đổi tại mục Mảnh Siêu Sao TOTY',
    iconSrc: '/assets/aistudio/currencylarge_ANS26_SHARDS_38324d2e.png',
  },
  {
    day: 4,
    title: 'NGÀY 04',
    amountText: '+100 Token TOTY',
    subText: 'Dùng trong Sự Kiện TOTY',
    iconSrc: '/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png',
  },
  {
    day: 5,
    title: 'NGÀY 05',
    amountText: '+2 Vé Minigame',
    subText: 'Tham gia Khu Trò Chơi TOTY',
    iconSrc: '/assets/aistudio/v__minigame_ch__ng_5_4a6d531e.png',
  },
  {
    day: 6,
    title: 'NGÀY 06',
    amountText: '+7 Thẻ Ghép',
    subText: 'Thẻ Giải Đấu & Vị Trí Ngẫu Nhiên',
    iconSrc: '/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png',
  },
  {
    day: 7,
    title: 'NGÀY 07',
    amountText: 'Gói 90–99 OVR',
    subText: 'Mở ngay 1 Siêu Sao Hỗn Hợp 90–99',
    iconSrc: '/assets/aistudio/storepack_S11_F_676265b6.png',
  },
];

export const TotyDailyStreakModal: React.FC<TotyDailyStreakModalProps> = ({
  user,
  onUpdateUser,
  onOpenRewardPack,
  onClickGems,
  onClickTickets,
  onClickShards,
  onClose,
}) => {
  const [clockNowMs, setClockNowMs] = useState<number>(() => Date.now());
  const [daily6AMCountdown, setDaily6AMCountdown] = useState<string>(() =>
    getCountdownToNext6AM()
  );
  const [notice, setNotice] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [revealedDay6Cards, setRevealedDay6Cards] = useState<CraftCardDrop[] | null>(
    null
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setClockNowMs(now);
      setDaily6AMCountdown(getCountdownToNext6AM(new Date(now)));
      if (user.totyDailyStreak && now >= user.totyDailyStreak.eventEndsAt) {
        onUpdateUser({
          totyDailyStreak: normalizeTotyDailyStreak(null, now),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user.totyDailyStreak, onUpdateUser]);

  const totyStreak = useMemo(
    () => normalizeTotyDailyStreak(user.totyDailyStreak, clockNowMs),
    [user.totyDailyStreak, clockNowMs]
  );

  const currentCycleKey = getDaily6AMCycleKey(new Date(clockNowMs));
  const sevenDayCountdown = formatSevenDayCountdown(
    totyStreak.eventEndsAt,
    clockNowMs
  );

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 2800);
  };

  const handleClaimDay = (dayNumber: number) => {
    const nowMs = Date.now();
    const cycleKey = getDaily6AMCycleKey(new Date(nowMs));
    const currentStreak = normalizeTotyDailyStreak(user.totyDailyStreak, nowMs);
    const expectedDay = currentStreak.claimedDays + 1;

    if (dayNumber !== expectedDay) {
      soundService.playClick();
      if (dayNumber <= currentStreak.claimedDays) {
        showToast(
          `Bạn đã nhận phần thưởng Ngày ${dayNumber} trong chuỗi 7 ngày này!`,
          'error'
        );
      } else {
        showToast(
          `Hãy nhận lần lượt theo thứ tự từng ngày (tiếp theo là Ngày ${expectedDay})!`,
          'error'
        );
      }
      return;
    }

    if (currentStreak.lastClaimCycleKey === cycleKey) {
      soundService.playClick();
      showToast(
        `Đã nhận thưởng hôm nay! Ngày tiếp theo mở lúc 06:00 sáng (còn ${daily6AMCountdown}).`,
        'error'
      );
      return;
    }

    const updatedStreak = {
      ...currentStreak,
      claimedDays: dayNumber,
      lastClaimCycleKey: cycleKey,
    };

    if (dayNumber === 1) {
      soundService.playCoins();
      onUpdateUser({
        tickets: (user.tickets ?? 0) + 2,
        totyDailyStreak: updatedStreak,
      });
      showToast('Chuỗi Hằng Ngày (Ngày 1/7): Đã nhận +2 Vé Quay!');
    } else if (dayNumber === 2) {
      soundService.playCoins();
      onUpdateUser({
        coins: user.coins + 700000,
        totyDailyStreak: updatedStreak,
      });
      showToast('Chuỗi Hằng Ngày (Ngày 2/7): Đã nhận +700.000 Xu!');
    } else if (dayNumber === 3) {
      soundService.playCoins();
      onUpdateUser({
        totyShards: (user.totyShards ?? 0) + 100,
        totyDailyStreak: updatedStreak,
      });
      showToast('Chuỗi Hằng Ngày (Ngày 3/7): Đã nhận +100 Mảnh TOTY!');
    } else if (dayNumber === 4) {
      soundService.playCoins();
      onUpdateUser({
        totyTokens: (user.totyTokens ?? 0) + 100,
        totyDailyStreak: updatedStreak,
      });
      showToast('Chuỗi Hằng Ngày (Ngày 4/7): Đã nhận +100 Token TOTY!');
    } else if (dayNumber === 5) {
      soundService.playCoins();
      onUpdateUser({
        minigameTickets: (user.minigameTickets ?? 0) + 2,
        totyDailyStreak: updatedStreak,
      });
      showToast('Chuỗi Hằng Ngày (Ngày 5/7): Đã nhận +2 Vé Minigame TOTY!');
    } else if (dayNumber === 6) {
      const nextInv = normalizeCraftInventory(user.craftInventory);
      const rolledDrops: CraftCardDrop[] = [];
      for (let i = 0; i < 7; i++) {
        const drop = rollRandomCraftCardDrop();
        rolledDrops.push(drop);
        if (drop.kind === 'league') {
          const lid = drop.id as CraftLeagueId;
          nextInv.leagues[lid] = (nextInv.leagues[lid] ?? 0) + 1;
        } else {
          const pid = drop.id as CraftPositionId;
          nextInv.positions[pid] = (nextInv.positions[pid] ?? 0) + 1;
        }
      }
      soundService.playPackOpenFanfare();
      try {
        confetti({ particleCount: 85, spread: 85, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      onUpdateUser({
        craftInventory: nextInv,
        totyDailyStreak: updatedStreak,
      });
      setRevealedDay6Cards(rolledDrops);
      showToast('Chuỗi Hằng Ngày (Ngày 6/7): Đã nhận 7 Thẻ Ghép Tài Năng!');
    } else if (dayNumber === 7) {
      soundService.playPackTear();
      onUpdateUser({
        totyDailyStreak: updatedStreak,
      });
      onClose();
      onOpenRewardPack('MIXED_90_99', 'GÓI CẦU THỦ HỖN HỢP 90-99');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-cruyff">
      {/* Background Stadium Scrim */}
      <img
        src="/assets/aistudio/2026-01-15_TOTY__2048__97ef4195.jpg"
        alt="TOTY Daily Streak Background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-black/95 pointer-events-none" />

      {/* Notice Banner */}
      {notice && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[75] px-5 py-2.5 border font-bold text-sm rounded-none ${
            notice.tone === 'success'
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-rose-950 border-rose-400 text-rose-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Top Section Header */}
      <TopSectionHeader
        title="CHUỖI HẰNG NGÀY TOTY"
        subtitle="Điểm danh liên tiếp 7 ngày · Mở khóa ngày mới lúc 06:00 sáng mỗi ngày"
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        onClickGems={onClickGems}
        onClickTickets={onClickTickets}
        onClickShards={onClickShards}
      />

      {/* Info Summary Strip (Bordered, Sharp Corners, No Logos) */}
      <div className="relative z-10 w-full border-b border-white/20 bg-slate-900/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3 text-slate-200">
          <span>
            Tiến độ hiện tại:{' '}
            <strong className="text-yellow-300 font-mono tabular-nums">
              {totyStreak.claimedDays}/7 NGÀY
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Mở ngày tiếp theo (06:00):{' '}
            <strong className="text-emerald-300 font-mono tabular-nums">
              {daily6AMCountdown}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Chu kỳ 7 ngày làm mới sau:{' '}
            <strong className="text-cyan-300 font-mono tabular-nums">
              {sevenDayCountdown}
            </strong>
          </span>
        </div>

        <div className="text-xs text-slate-300">
          {totyStreak.lastClaimCycleKey === currentCycleKey
            ? 'Đã nhận thưởng hôm nay'
            : totyStreak.claimedDays >= 7
            ? 'Đã hoàn tất trọn bộ 7/7 ngày'
            : `Sẵn sàng nhận Ngày ${totyStreak.claimedDays + 1}`}
        </div>
      </div>

      {/* Main 7-Day Sharp-Cornered Bordered Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 border border-white/25 divide-y sm:divide-y-0 sm:divide-x divide-white/25 bg-slate-950/85">
          {STREAK_REWARDS.map((item) => {
            const isClaimed = item.day <= totyStreak.claimedDays;
            const isNextDay = item.day === totyStreak.claimedDays + 1;
            const alreadyClaimedToday =
              totyStreak.lastClaimCycleKey === currentCycleKey;
            const canClaimNow = isNextDay && !alreadyClaimedToday;

            return (
              <div
                key={item.day}
                className={`flex flex-col justify-between rounded-none transition-colors ${
                  canClaimNow
                    ? 'bg-gradient-to-b from-amber-900/50 via-slate-900/90 to-slate-950 ring-1 ring-inset ring-yellow-400'
                    : isClaimed
                    ? 'bg-emerald-950/30 opacity-85'
                    : 'bg-slate-950/75'
                }`}
              >
                {/* Day Header Band */}
                <div
                  className={`px-3 py-2.5 border-b border-white/20 text-center font-cruyff font-black text-sm tracking-wider uppercase ${
                    canClaimNow
                      ? 'bg-yellow-400 text-slate-950'
                      : isClaimed
                      ? 'bg-emerald-900/60 text-emerald-200'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {item.title}
                </div>

                {/* Reward Content */}
                <div className="p-4 flex-1 flex flex-col items-center justify-center text-center min-h-[210px]">
                  <div className="w-20 h-20 flex items-center justify-center mb-3">
                    <img
                      src={item.iconSrc}
                      alt={item.amountText}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="font-cruyff font-black text-base text-white uppercase tracking-wide">
                    {item.amountText}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {item.subText}
                  </p>
                </div>

                {/* Action Footer Band */}
                <button
                  type="button"
                  disabled={!canClaimNow}
                  onClick={() => handleClaimDay(item.day)}
                  className={`w-full py-3 px-2 border-t border-white/25 font-cruyff font-black text-xs uppercase tracking-wider transition-colors rounded-none whitespace-nowrap ${
                    isClaimed
                      ? 'bg-emerald-950/70 text-emerald-300 cursor-default'
                      : canClaimNow
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 cursor-pointer'
                      : isNextDay && alreadyClaimedToday
                      ? 'bg-slate-900 text-amber-300 cursor-not-allowed'
                      : 'bg-slate-900/80 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isClaimed
                    ? 'ĐÃ NHẬN'
                    : canClaimNow
                    ? 'NHẬN NGAY'
                    : isNextDay && alreadyClaimedToday
                    ? 'MỞ LÚC 06:00'
                    : 'CHƯA MỞ'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day 6 7-Card Reveal Modal */}
      {revealedDay6Cards && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-950 border border-yellow-400 p-6 rounded-none">
            <h3 className="font-cruyff font-black text-xl text-yellow-300 uppercase tracking-wider text-center border-b border-white/20 pb-3">
              PHẦN THƯỞNG NGÀY 06 · 7 THẺ GHÉP TÀI NĂNG SÁNG GIÁ
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              {revealedDay6Cards.map((drop, idx) => (
                <div
                  key={`${drop.kind}_${drop.id}_${idx}`}
                  className="p-3 border border-white/20 bg-slate-900 flex flex-col items-center justify-center rounded-none"
                >
                  <CraftingCardBadge kind={drop.kind} id={drop.id} size="md" />
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setRevealedDay6Cards(null);
                }}
                className="px-8 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-sm uppercase tracking-wider border border-yellow-200 cursor-pointer rounded-none"
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
