import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { UserProfile, PlayerCard } from '../types/game';
import {
  GINGA_ASSETS,
  gingaPlayers,
  gingaPackBPlayers,
  GINGA_MILESTONES,
  GINGA_STREAK_REWARDS,
  getDailyGingaQuests,
} from '../data/gingaData';
import {
  getDaily6AMCycleKey,
  getCountdownToNext6AM,
  normalizeGingaState,
  formatTodayVN,
} from '../utils/dateUtils';
import { FCCard } from './FCCard';
import { PackTier } from './PackOpeningModal';

export type GingaChapterId = 'main' | 'festival';

interface GingaEventModalProps {
  user: UserProfile;
  initialChapter?: GingaChapterId;
  onUpdateUser: (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenPackTier: (tier: PackTier, customName?: string) => void;
  onGoToCareer: () => void;
  onGoToRanked: () => void;
  onGoToSpin: () => void;
  onClose: () => void;
}

const GINGA_CONFETTI_COLORS = ['#22c55e', '#eab308', '#38bdf8', '#ffffff', '#f59e0b'];

export const GingaEventModal: React.FC<GingaEventModalProps> = ({
  user,
  initialChapter = 'main',
  onUpdateUser,
  onOpenPackTier,
  onGoToCareer,
  onGoToRanked,
  onGoToSpin,
  onClose,
}) => {
  const [activeChapter, setActiveChapter] = useState<GingaChapterId>(initialChapter);
  const [notice, setNotice] = useState<{ text: string; kind: 'gold' | 'error' } | null>(null);
  const [cycleKey, setCycleKey] = useState<string>(() => getDaily6AMCycleKey());
  const [countdown6AM, setCountdown6AM] = useState<string>(() => getCountdownToNext6AM());
  const [inspectingPlayer, setInspectingPlayer] = useState<PlayerCard | null>(null);

  useEffect(() => {
    setActiveChapter(initialChapter);
  }, [initialChapter]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextKey = getDaily6AMCycleKey();
      setCycleKey((prev) => (prev === nextKey ? prev : nextKey));
      setCountdown6AM(getCountdownToNext6AM());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const gingaTokens = user.gingaTokens ?? 0;
  const gingaShards = user.gingaShards ?? 0;
  const normalTickets = user.tickets ?? 0;

  const gingaState = useMemo(
    () => normalizeGingaState(user.gingaState, cycleKey),
    [user.gingaState, cycleKey]
  );

  const dailyQuests = useMemo(() => getDailyGingaQuests(cycleKey), [cycleKey]);

  const showToast = (text: string, kind: 'gold' | 'error' = 'gold') => {
    setNotice({ text, kind });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: GINGA_CONFETTI_COLORS,
      });
    } catch {
      // ignore
    }
  };

  // 7-Day Ginga Streak Claim (Strictly 1 claim per 06:00 AM daily cycle)
  const alreadyClaimedStreakToday = gingaState.lastStreakClaimDate === cycleKey;
  const nextStreakDay = Math.min(7, gingaState.streakDaysClaimed.length + 1);

  const handleClaimStreakDay = (day: number) => {
    soundService.playClick();
    if (gingaState.streakDaysClaimed.includes(day)) {
      showToast('Bạn đã nhận quà ngày này rồi!', 'error');
      return;
    }
    if (alreadyClaimedStreakToday) {
      showToast(`Hôm nay bạn đã điểm danh Ginga rồi! Reset lúc 06:00 sáng (${countdown6AM}).`, 'error');
      return;
    }
    if (day !== nextStreakDay) {
      showToast(`Hãy nhận Ngày ${nextStreakDay} theo thứ tự chuỗi 7 ngày!`, 'error');
      return;
    }

    const dayItem = GINGA_STREAK_REWARDS.find((d) => d.day === day);
    if (!dayItem) return;

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    fireConfetti();

    onUpdateUser((prev) => {
      const curState = normalizeGingaState(prev.gingaState, cycleKey);
      if (curState.lastStreakClaimDate === cycleKey || curState.streakDaysClaimed.includes(day)) {
        return {};
      }
      return {
        tickets: (prev.tickets ?? 0) + dayItem.rewardTickets,
        gingaTokens: (prev.gingaTokens ?? 0) + dayItem.rewardTokens,
        gems: (prev.gems ?? 0) + dayItem.rewardGems,
        gingaState: {
          ...curState,
          streakDaysClaimed: [...curState.streakDaysClaimed, day],
          lastStreakClaimDate: cycleKey,
        },
      };
    });

    showToast(
      `Điểm danh Ginga Ngày ${day}: +${dayItem.rewardTickets} Vé Quay, +${dayItem.rewardTokens} Token${
        dayItem.rewardGems > 0 ? `, +${dayItem.rewardGems} Kim Cương` : ''
      }!`
    );
  };

  // Shard Exchange: 50 Mảnh Ginga -> 5,000 Coin / 200 Gems / 1 Vé Ginga
  const handleExchangeShards = (choice: 'coins' | 'gems' | 'ticket') => {
    soundService.playClick();
    if (gingaShards < 50) {
      showToast('Bạn cần ít nhất 50 Mảnh Ginga để quy đổi!', 'error');
      return;
    }

    soundService.playConfirmSelection();
    onUpdateUser((prev) => {
      const shards = prev.gingaShards ?? 0;
      if (shards < 50) return {};
      const patch: Partial<UserProfile> = {
        gingaShards: shards - 50,
      };
      if (choice === 'coins') {
        patch.coins = (prev.coins ?? 0) + 5000;
      } else if (choice === 'gems') {
        patch.gems = (prev.gems ?? 0) + 200;
      } else {
        patch.tickets = (prev.tickets ?? 0) + 1;
      }
      return patch;
    });
    fireConfetti();
    showToast(
      `Đổi thành công 50 Mảnh Ginga lấy ${
        choice === 'coins' ? '5,000 Coins' : choice === 'gems' ? '200 Kim Cương' : '1 Vé Quay'
      }!`
    );
  };

  // Excess Tokens Exchange: 100 Token Ginga -> 50 Kim Cương
  const handleExchangeExcessTokens = () => {
    soundService.playClick();
    if (gingaTokens < 100) {
      showToast('Bạn cần ít nhất 100 Token Ginga dư để đổi!', 'error');
      return;
    }
    soundService.playConfirmSelection();
    onUpdateUser((prev) => {
      const tokens = prev.gingaTokens ?? 0;
      if (tokens < 100) return {};
      const curState = normalizeGingaState(prev.gingaState, cycleKey);
      return {
        gingaTokens: tokens - 100,
        gems: (prev.gems ?? 0) + 50,
        gingaState: {
          ...curState,
          excessTokensExchangedCount: (curState.excessTokensExchangedCount ?? 0) + 1,
        },
      };
    });
    fireConfetti();
    showToast('Đã đổi 100 Token Ginga dư lấy 50 Kim Cương!');
  };

  // Daily Random Festival Quest Claim (resets at 06:00 AM)
  const handleClaimDailyQuest = (questId: string) => {
    soundService.playClick();
    const quest = dailyQuests.find((q) => q.id === questId);
    if (!quest) return;

    const claimedIds = gingaState.dailyQuestClaimedIds ?? [];
    if (claimedIds.includes(questId)) {
      showToast('Bạn đã nhận thưởng yêu cầu này hôm nay!', 'error');
      return;
    }
    const progress = quest.getProgress(user, gingaState.matchesPlayedToday);
    if (progress < quest.target) {
      showToast('Chưa hoàn thành yêu cầu hằng ngày này!', 'error');
      return;
    }

    soundService.playConfirmSelection();
    fireConfetti();
    onUpdateUser((prev) => {
      const curState = normalizeGingaState(prev.gingaState, cycleKey);
      const curClaimed = curState.dailyQuestClaimedIds ?? [];
      if (curClaimed.includes(questId)) return {};
      return {
        gingaTokens: (prev.gingaTokens ?? 0) + quest.rewardTokens,
        gingaShards: (prev.gingaShards ?? 0) + quest.rewardShards,
        gingaState: {
          ...curState,
          dailyQuestClaimedIds: [...curClaimed, questId],
        },
      };
    });
    showToast(`Hoàn thành yêu cầu: +${quest.rewardTokens} Token Ginga & +${quest.rewardShards} Mảnh!`);
  };

  // Festival Milestone Claim
  const handleClaimMilestone = (
    mId: number,
    reqTokens: number,
    rewardType: 'tickets' | 'gems' | 'pack',
    amount: number
  ) => {
    soundService.playClick();
    if (gingaTokens < reqTokens) {
      showToast(`Cần đạt ${reqTokens} Token Ginga để mở khóa mốc này!`, 'error');
      return;
    }
    if (gingaState.claimedMilestones.includes(mId)) {
      showToast('Bạn đã nhận phần thưởng mốc này rồi!', 'error');
      return;
    }

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    fireConfetti();

    onUpdateUser((prev) => {
      const curState = normalizeGingaState(prev.gingaState, cycleKey);
      if (curState.claimedMilestones.includes(mId)) return {};
      const patch: Partial<UserProfile> = {
        gingaState: {
          ...curState,
          claimedMilestones: [...curState.claimedMilestones, mId],
        },
      };
      if (rewardType === 'tickets') {
        patch.tickets = (prev.tickets ?? 0) + amount;
      } else if (rewardType === 'gems') {
        patch.gems = (prev.gems ?? 0) + amount;
      }
      return patch;
    });

    if (rewardType === 'pack') {
      onClose();
      onOpenPackTier('GINGA_100_OVR', 'PACK CẦU THỦ 100 OVR GINGA');
      return;
    }

    showToast(`Đã nhận Phần Thưởng Mốc ${mId} thành công!`);
  };

  const maxMilestoneTokens = GINGA_MILESTONES[GINGA_MILESTONES.length - 1]?.tokensRequired ?? 1500;
  const milestoneBarPercent = Math.min(100, Math.round((gingaTokens / maxMilestoneTokens) * 100));

  return (
    <div className="fixed inset-0 z-50 w-full h-full flex flex-col overflow-hidden bg-[#06180e] select-none font-cruyff animate-fadeIn">
      {/* Full-Screen Ginga Background (Vibrant Animated Ginga Artwork) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-85 bg-cover bg-center z-0 animate-ginga-drift"
        style={{ backgroundImage: `url(${GINGA_ASSETS.bg})` }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-25 bg-cover bg-center z-0 mix-blend-screen"
        style={{ backgroundImage: `url(${GINGA_ASSETS.boxBg})` }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/50 via-black/25 to-black/75" />

      {/* Top Fullscreen Header Bar (Broadcast Style) */}
      <header className="relative z-10 px-4 sm:px-6 py-3.5 bg-[#04140b]/92 border-b border-emerald-400/45 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl shadow-[0_6px_28px_rgba(0,0,0,0.45)]">
        <div className="h-[2px] absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-400 via-yellow-300 to-teal-400" />
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-yellow-400/20 to-emerald-500/30 border border-yellow-300/75 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(234,179,8,0.35)]">
            <img
              src={GINGA_ASSETS.pointIcon}
              alt="Ginga 26"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-cruyff font-black text-lg sm:text-2xl text-white tracking-wider uppercase italic truncate">
                SỰ KIỆN GINGA 26
              </h2>
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded-sm tracking-wider">
                CARNIVAL · NAM MỸ
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-emerald-200/90 font-semibold mt-0.5">
              <span>Nghệ thuật Joga Bonito · Làm mới chuỗi lúc 06:00</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/55 border border-yellow-400/35 rounded text-yellow-300 font-mono tabular-nums">
                <Clock className="w-3 h-3" />
                {countdown6AM}
              </span>
            </div>
          </div>
        </div>

        {/* Currencies HUD + Close */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/65 border border-emerald-400/45 rounded-lg text-xs font-bold text-emerald-100">
            <img src={GINGA_ASSETS.pointIcon} alt="Token Ginga" className="w-4 h-4 object-contain" />
            <span>
              Token: <strong className="text-yellow-300 font-mono tabular-nums">{gingaTokens.toLocaleString('vi-VN')}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/65 border border-emerald-400/45 rounded-lg text-xs font-bold text-emerald-100">
            <img src={GINGA_ASSETS.normalTicketIcon} alt="Vé Quay" className="w-4 h-4 object-contain" />
            <span>
              Vé Quay: <strong className="text-emerald-300 font-mono tabular-nums">{normalTickets}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/65 border border-amber-400/45 rounded-lg text-xs font-bold text-amber-100">
            <img src={GINGA_ASSETS.shardsIcon} alt="Mảnh Ginga" className="w-4 h-4 object-contain" />
            <span>
              Mảnh Ginga: <strong className="text-amber-300 font-mono tabular-nums">{gingaShards}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            aria-label="Đóng sự kiện Ginga"
            className="w-9 h-9 rounded-lg bg-red-600/90 hover:bg-red-500 text-white border border-white/75 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs (2 Chapters: Chương Chính & Chương 1: Lễ Hội) */}
      <nav className="relative z-10 grid grid-cols-2 border-b border-emerald-400/35 bg-[#030e08]/85 backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('main');
          }}
          className={`relative py-3.5 px-3 text-center font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer border-b-[3px] ${
            activeChapter === 'main'
              ? 'bg-gradient-to-t from-emerald-500/20 to-transparent text-yellow-300 border-yellow-400'
              : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          Chương Chính · Cầu Thủ &amp; Điểm Danh 7 Ngày
        </button>
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('festival');
          }}
          className={`relative py-3.5 px-3 text-center font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer border-b-[3px] ${
            activeChapter === 'festival'
              ? 'bg-gradient-to-t from-emerald-500/20 to-transparent text-yellow-300 border-yellow-400'
              : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          Chương 1: Lễ Hội · Nhiệm Vụ &amp; Mốc Token
        </button>
      </nav>

      {/* Notice Toast */}
      {notice && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-5 py-2.5 border text-xs font-black uppercase tracking-wider rounded-lg shadow-2xl animate-bounce ${
            notice.kind === 'error'
              ? 'bg-red-950/95 border-red-400 text-red-100'
              : 'bg-emerald-950/95 border-yellow-300 text-yellow-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Main Scrollable Content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 pb-8">
          {activeChapter === 'main' && (
            <>
              {/* Top Vé Quay Ginga Banner */}
              <section className="relative overflow-hidden p-4 sm:p-6 rounded-xl bg-gradient-to-r from-[#042413]/92 via-[#07341b]/88 to-[#06180f]/92 border border-yellow-300/55 shadow-[0_14px_40px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row items-center justify-between gap-5 backdrop-blur-xl">
                <div className="h-[2px] absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-400 via-emerald-300 to-cyan-400" />
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-black/55 border border-yellow-300/60 flex items-center justify-center p-2 shadow-[0_0_20px_rgba(234,179,8,0.35)]">
                    <img
                      src={GINGA_ASSETS.normalTicketIcon}
                      alt="Vé Quay"
                      className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.65)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-cruyff font-black text-lg sm:text-2xl text-white uppercase italic tracking-wide">
                        Vé Quay Ginga 26
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-300/60 text-emerald-200 text-[10px] font-black uppercase rounded">
                        <ShieldCheck className="w-3 h-3" />
                        Sử Dụng Vé Quay Bình Thường
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-100/90 font-semibold">
                      <strong className="text-yellow-300">Gói A (1%):</strong> 106 Kaká (Icons), 105 Mascherano (Icons), 104 Valverde, 103 Caicedo, 102 Gabriel Martinelli
                    </p>
                    <p className="text-xs text-slate-200/85">
                      <strong className="text-emerald-300">Gói B (24%):</strong> Cầu thủ Nam Mỹ Ginga 92–101 OVR ·{' '}
                      <strong className="text-cyan-300">Gói C (75%):</strong> Cầu thủ hỗn hợp ≤ 91 OVR
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-black/60 border border-emerald-400/50 text-center w-full sm:w-auto">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                      Vé Quay hiện có
                    </div>
                    <div className="text-lg font-mono font-black text-yellow-300">
                      {normalTickets} Vé
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onGoToSpin();
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-yellow-400 via-emerald-400 to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl border-2 border-white shadow-[0_0_24px_rgba(52,211,153,0.55)] cursor-pointer hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Đến Vòng Quay Ginga</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>

              {/* Package A Players (with FCCard + Icons crest for Kaka & Mascherano) */}
              <section className="p-4 sm:p-5 rounded-2xl bg-black/65 border border-yellow-400/45 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                  <h3 className="font-cruyff font-black text-base sm:text-lg text-yellow-300 uppercase tracking-wide flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <span>Gói A Đặc Biệt Ginga (106 – 102 OVR · Tỷ Lệ 1%)</span>
                  </h3>
                  <span className="text-xs text-emerald-200 font-semibold">
                    Bấm vào thẻ để xem chỉ số chi tiết · Kaká & Mascherano là Ginga Icons
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
                  {gingaPlayers.map((player) => (
                    <div key={player.id} className="flex flex-col items-center gap-2">
                      <div className="cursor-pointer transition-transform hover:scale-105">
                        <FCCard
                          player={player}
                          size="sm"
                          onClick={() => {
                            soundService.playClick();
                            setInspectingPlayer(player);
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-black text-white">{player.name}</div>
                        <div className="text-[10px] font-bold text-yellow-300 uppercase">
                          {player.cardType === 'GINGA_ICON' ? 'GINGA ICONS' : 'GINGA 26'} · {player.ovr} {player.position}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Package B South American Ginga Showcase */}
              <section className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-emerald-400/40 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <h3 className="font-cruyff font-black text-base sm:text-lg text-emerald-300 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>Gói B: Dàn Sao Nam Mỹ Ginga (101 – 92 OVR · Tỷ Lệ 24%)</span>
                  </h3>
                  <span className="text-xs text-slate-300 font-semibold">
                    {gingaPackBPlayers.length} cầu thủ Nam Mỹ trong Album & Đổi Mảnh
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 justify-items-center">
                  {gingaPackBPlayers.map((player) => (
                    <div key={player.id} className="flex flex-col items-center gap-1">
                      <div className="cursor-pointer transition-transform hover:scale-105">
                        <FCCard
                          player={player}
                          size="xs"
                          onClick={() => {
                            soundService.playClick();
                            setInspectingPlayer(player);
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white/90 text-center truncate max-w-[90px]">
                        {player.ovr} {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 7-Day Ginga Streak Check-In (With Item Icons & 06:00 AM Reset Timer) */}
              <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#062314]/92 via-slate-950/90 to-black/92 border-2 border-emerald-400/50 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-cruyff font-black text-base sm:text-lg text-white uppercase tracking-wide">
                      Chuỗi Điểm Danh 7 Ngày Ginga
                    </h3>
                    <p className="text-xs text-emerald-200/85">
                      Mỗi ngày nhận 1 mốc quà · Làm mới lượt nhận kế tiếp vào lúc 06:00 sáng hằng ngày
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="px-2.5 py-1 bg-black/70 border border-emerald-400/40 rounded-lg text-emerald-300">
                      {formatTodayVN()}
                    </span>
                    <span className="px-2.5 py-1 bg-black/70 border border-yellow-400/40 rounded-lg text-yellow-300 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      06:00 sau {countdown6AM}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {GINGA_STREAK_REWARDS.map((item) => {
                    const claimed = gingaState.streakDaysClaimed.includes(item.day);
                    const canClaim = !claimed && !alreadyClaimedStreakToday && item.day === nextStreakDay;
                    const waitingNextDay = !claimed && alreadyClaimedStreakToday && item.day === nextStreakDay;
                    return (
                      <button
                        key={item.day}
                        type="button"
                        disabled={!canClaim}
                        onClick={() => handleClaimStreakDay(item.day)}
                        className={`relative p-3 rounded-xl border-2 flex flex-col items-center justify-between gap-2 transition-all ${
                          claimed
                            ? 'bg-emerald-900/45 border-emerald-500/50 opacity-85 cursor-not-allowed'
                            : canClaim
                            ? 'bg-gradient-to-b from-emerald-600/90 to-teal-800/95 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.45)] cursor-pointer hover:scale-[1.03]'
                            : waitingNextDay
                            ? 'bg-amber-950/60 border-amber-400/50 cursor-not-allowed opacity-90'
                            : 'bg-slate-900/85 border-white/15 opacity-65 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="font-cruyff font-black text-xs text-white uppercase">
                            Ngày {item.day}
                          </span>
                          {claimed && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                        </div>

                        {/* Item Images */}
                        <div className="flex items-center justify-center gap-1.5 py-1">
                          <div className="relative w-10 h-10 rounded-lg bg-black/45 border border-white/15 p-1 flex items-center justify-center">
                            <img
                              src={item.primaryIconUrl}
                              alt={`Vật phẩm ngày ${item.day}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="relative w-8 h-8 rounded-lg bg-black/45 border border-white/15 p-1 flex items-center justify-center">
                            <img
                              src={item.secondaryIconUrl}
                              alt={`Quà phụ ngày ${item.day}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        <div className="text-[10px] leading-tight font-bold text-yellow-200 text-center space-y-0.5">
                          <div>+{item.rewardTickets} Vé · +{item.rewardTokens} Token</div>
                          {item.rewardGems > 0 && (
                            <div className="text-cyan-300">+{item.rewardGems} Kim Cương</div>
                          )}
                        </div>

                        <div
                          className={`w-full py-1 rounded text-[10px] font-black uppercase ${
                            claimed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : canClaim
                              ? 'bg-yellow-400 text-slate-950'
                              : waitingNextDay
                              ? 'bg-amber-500/20 text-amber-200'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {claimed ? 'Đã Nhận' : canClaim ? 'Nhận Ngay' : waitingNextDay ? 'Chờ 06:00' : 'Chưa Mở'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Shard Exchange (50 Shards -> Coins / Gems / Ticket) & Excess Tokens Exchange */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/90 border-2 border-emerald-400/45 flex flex-col justify-between gap-4 backdrop-blur-md">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-cruyff font-black text-sm sm:text-base text-yellow-300 uppercase tracking-wide flex items-center gap-2">
                        <img src={GINGA_ASSETS.shardsIcon} alt="Mảnh" className="w-5 h-5 object-contain" />
                        <span>Trao Đổi Mảnh Ginga (50 Mảnh / Lần)</span>
                      </h4>
                      <span className="text-xs font-mono font-black text-amber-300">
                        Đang có: {gingaShards}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Cứ 50 Mảnh Ginga có thể quy đổi 5,000 Coins, 200 Kim Cương hoặc 1 Vé Quay.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleExchangeShards('coins')}
                      className="py-2.5 px-2 bg-gradient-to-b from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase rounded-xl border border-white cursor-pointer flex flex-col items-center gap-1"
                    >
                      <img src={GINGA_ASSETS.coinsIcon} alt="Coins" className="w-6 h-6 object-contain" />
                      <span>5,000 Coins</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExchangeShards('gems')}
                      className="py-2.5 px-2 bg-gradient-to-b from-cyan-400 to-sky-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase rounded-xl border border-white cursor-pointer flex flex-col items-center gap-1"
                    >
                      <img src={GINGA_ASSETS.gemsIcon} alt="Gems" className="w-6 h-6 object-contain" />
                      <span>200 Gems</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExchangeShards('ticket')}
                      className="py-2.5 px-2 bg-gradient-to-b from-emerald-400 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase rounded-xl border border-white cursor-pointer flex flex-col items-center gap-1"
                    >
                      <img src={GINGA_ASSETS.normalTicketIcon} alt="Vé Quay" className="w-6 h-6 object-contain" />
                      <span>1 Vé Quay</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/90 border-2 border-emerald-400/45 flex flex-col justify-between gap-4 backdrop-blur-md">
                  <div>
                    <h4 className="font-cruyff font-black text-sm sm:text-base text-emerald-300 uppercase tracking-wide flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                      <span>Trao Đổi Token Ginga Dư</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Cứ 100 Token Ginga dư có thể quy đổi ngay 50 Kim Cương.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/50 border border-white/10">
                    <div className="flex items-center gap-2">
                      <img src={GINGA_ASSETS.pointIcon} alt="Token" className="w-8 h-8 object-contain" />
                      <span className="text-sm font-black text-white">100 Token</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                    <div className="flex items-center gap-2">
                      <img src={GINGA_ASSETS.gemsIcon} alt="Kim Cương" className="w-8 h-8 object-contain" />
                      <span className="text-sm font-black text-cyan-300">50 Kim Cương</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExchangeExcessTokens}
                    className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-white shadow-md cursor-pointer"
                  >
                    Đổi 100 Token Ginga Dư → 50 Kim Cương (Hiện có: {gingaTokens})
                  </button>
                </div>
              </section>
            </>
          )}

          {activeChapter === 'festival' && (
            <>
              {/* Randomized Daily Festival Quests (Resets at 06:00 AM) + Match Progress */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 3 Daily Random Requests */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-950/90 border-2 border-emerald-400/50 backdrop-blur-md space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-cruyff font-black text-base sm:text-lg text-yellow-300 uppercase tracking-wide">
                        Yêu Cầu Hằng Ngày Lễ Hội Ginga
                      </h3>
                      <p className="text-xs text-slate-300">
                        Random 3 nhiệm vụ mới mỗi ngày vào lúc 06:00 sáng
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-black/75 border border-yellow-400/40 rounded-lg text-xs font-mono font-bold text-yellow-300 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Random sau {countdown6AM}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dailyQuests.map((q) => {
                      const claimed = (gingaState.dailyQuestClaimedIds ?? []).includes(q.id);
                      const progress = q.getProgress(user, gingaState.matchesPlayedToday);
                      const pct = Math.min(100, Math.round((progress / Math.max(1, q.target)) * 100));
                      const canClaim = !claimed && progress >= q.target;

                      return (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-black/55 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-400/40 p-1.5 shrink-0 flex items-center justify-center">
                              <img src={q.iconUrl} alt={q.title} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs sm:text-sm text-white truncate">
                                {q.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                                <span className="text-yellow-300">+{q.rewardTokens} Token Ginga</span>
                                <span className="text-amber-300">+{q.rewardShards} Mảnh</span>
                              </div>
                              <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-yellow-400 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="text-xs font-mono font-bold text-emerald-300">
                              {progress}/{q.target}
                            </span>
                            <button
                              type="button"
                              disabled={!canClaim}
                              onClick={() => handleClaimDailyQuest(q.id)}
                              className={`px-4 py-2 rounded-lg text-xs font-black uppercase border cursor-pointer transition-all ${
                                claimed
                                  ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40 cursor-not-allowed'
                                  : canClaim
                                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 border-white hover:brightness-110'
                                  : 'bg-slate-800 text-slate-400 border-white/10 cursor-not-allowed'
                              }`}
                            >
                              {claimed ? 'Đã Nhận' : canClaim ? 'Nhận' : 'Chưa Đạt'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Match Rewards Box (Career & Ranked up to 5 matches/day) */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-[#062917]/95 via-slate-950/92 to-black/95 border-2 border-emerald-400/50 flex flex-col justify-between gap-4 backdrop-blur-md">
                  <div className="space-y-3">
                    <h3 className="font-cruyff font-black text-base sm:text-lg text-white uppercase tracking-wide">
                      Thưởng Trận Đấu Lễ Hội (5 Trận/Ngày)
                    </h3>
                    <p className="text-xs text-emerald-100/85 leading-relaxed">
                      Mỗi trận <strong className="text-white">Đấu Xếp Hạng</strong> hoặc{' '}
                      <strong className="text-white">Sự Nghiệp</strong> trong ngày sẽ nhận trực tiếp Token Ginga (tối đa 5 trận/ngày, reset lúc 06:00 sáng):
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-emerald-900/45 border border-emerald-400/40">
                        <div className="text-[10px] font-bold text-emerald-300 uppercase">Thắng</div>
                        <div className="text-sm font-black text-yellow-300 mt-0.5">+200 Token</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-900/45 border border-sky-400/40">
                        <div className="text-[10px] font-bold text-sky-300 uppercase">Hòa</div>
                        <div className="text-sm font-black text-yellow-300 mt-0.5">+100 Token</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-900/45 border border-rose-400/40">
                        <div className="text-[10px] font-bold text-rose-300 uppercase">Thua</div>
                        <div className="text-sm font-black text-yellow-300 mt-0.5">+50 Token</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/55 border border-white/10">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">Số trận đã ghi nhận hôm nay:</span>
                        <span className="font-mono text-yellow-300">
                          {gingaState.matchesPlayedToday} / 5 trận
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-yellow-400 transition-all"
                          style={{ width: `${Math.min(100, (gingaState.matchesPlayedToday / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        onClose();
                        onGoToCareer();
                      }}
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl border border-white cursor-pointer transition-colors"
                    >
                      Đấu Sự Nghiệp →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        onClose();
                        onGoToRanked();
                      }}
                      className="py-3 px-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase rounded-xl border border-white cursor-pointer transition-colors"
                    >
                      Đấu Xếp Hạng →
                    </button>
                  </div>
                </div>
              </section>

              {/* Ginga Token Milestone Reward Chain (With Item Artwork) */}
              <section className="p-5 rounded-2xl bg-black/75 border-2 border-yellow-300/50 backdrop-blur-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-cruyff font-black text-base sm:text-lg text-yellow-300 uppercase tracking-wide flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>Chuỗi Mốc Phần Thưởng Token Ginga</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Tích lũy Token Ginga để mở khóa toàn bộ 5 mốc quà — Mốc 5 mở trực tiếp Pack Cầu Thủ 100 OVR Ginga!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-400/50 text-xs font-black text-yellow-300">
                    <img src={GINGA_ASSETS.pointIcon} alt="Token" className="w-5 h-5 object-contain" />
                    <span>{gingaTokens.toLocaleString('vi-VN')} / 1,500 Token</span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="h-3 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-amber-500 transition-all duration-500"
                    style={{ width: `${milestoneBarPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {GINGA_MILESTONES.map((m) => {
                    const claimed = gingaState.claimedMilestones.includes(m.id);
                    const ready = gingaTokens >= m.tokensRequired && !claimed;
                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl border-2 flex flex-col justify-between gap-3 text-center transition-all ${
                          claimed
                            ? 'bg-emerald-950/55 border-emerald-500/50 opacity-85'
                            : ready
                            ? 'bg-gradient-to-b from-emerald-900/95 to-slate-950 border-yellow-300 shadow-[0_0_24px_rgba(234,179,8,0.45)]'
                            : 'bg-slate-900/90 border-white/20'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black/65 text-emerald-300 rounded">
                              Mốc {m.id}
                            </span>
                            <span className="text-[11px] font-mono font-black text-yellow-300 inline-flex items-center gap-1">
                              <img src={GINGA_ASSETS.pointIcon} alt="" className="w-3.5 h-3.5 object-contain" />
                              {m.tokensRequired}
                            </span>
                          </div>

                          {/* Milestone Reward Artwork */}
                          <div className="relative h-20 flex items-center justify-center">
                            {m.secondaryIconUrl ? (
                              <div className="relative w-16 h-20 flex items-center justify-center">
                                <img
                                  src={m.iconUrl}
                                  alt={m.rewardLabel}
                                  className="w-full h-full object-contain drop-shadow-md"
                                />
                                <img
                                  src={m.secondaryIconUrl}
                                  alt="Kaká 106"
                                  className="absolute inset-0 w-12 h-14 m-auto object-contain drop-shadow-lg"
                                />
                              </div>
                            ) : (
                              <img
                                src={m.iconUrl}
                                alt={m.rewardLabel}
                                className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]"
                              />
                            )}
                          </div>

                          <div>
                            <h4 className="font-cruyff font-black text-sm text-white leading-tight">
                              {m.rewardLabel}
                            </h4>
                            <p className="text-[11px] text-slate-300 mt-0.5">{m.rewardSubLabel}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() =>
                            handleClaimMilestone(m.id, m.tokensRequired, m.rewardType, m.rewardAmount)
                          }
                          className={`w-full py-2.5 font-black text-xs uppercase rounded-xl border transition-all ${
                            claimed
                              ? 'bg-emerald-900/50 text-emerald-300 border-emerald-600 cursor-not-allowed'
                              : ready
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 border-white hover:brightness-110 shadow-md cursor-pointer'
                              : 'bg-slate-800 text-slate-400 border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {claimed
                            ? 'Đã Nhận'
                            : ready
                            ? m.rewardType === 'pack'
                              ? 'Mở Pack Ngay'
                              : 'Nhận Thưởng'
                            : `Còn ${Math.max(0, m.tokensRequired - gingaTokens)} Token`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Player Card Inspection Modal */}
      {inspectingPlayer && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setInspectingPlayer(null)}
        >
          <div
            className="relative max-w-md w-full bg-gradient-to-b from-[#072616] to-slate-950 border border-yellow-300/70 rounded-xl p-5 flex flex-col items-center gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInspectingPlayer(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <FCCard player={inspectingPlayer} size="lg" showStats />
            <div className="text-center space-y-1">
              <h4 className="font-cruyff font-black text-lg text-white">
                {inspectingPlayer.fullName || inspectingPlayer.name}
              </h4>
              <p className="text-xs text-emerald-300 font-bold">
                {inspectingPlayer.club} · {inspectingPlayer.nation} · {inspectingPlayer.position} ({inspectingPlayer.ovr} OVR)
              </p>
            </div>
            <div className="grid grid-cols-6 gap-2 w-full text-center bg-black/50 p-3 rounded-lg border border-white/10">
              <div>
                <div className="text-[10px] text-slate-400">PAC</div>
                <div className="text-sm font-black text-white tabular-nums">{inspectingPlayer.pac}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">SHO</div>
                <div className="text-sm font-black text-white tabular-nums">{inspectingPlayer.sho}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PAS</div>
                <div className="text-sm font-black text-white tabular-nums">{inspectingPlayer.pas}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DRI</div>
                <div className="text-sm font-black text-white tabular-nums">{inspectingPlayer.dri}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DEF</div>
                <div className="text-sm font-black text-white tabular-nums">{inspectingPlayer.def}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PHY</div>
                <div className="text-sm font-black text-white tabular-nums">{inspectingPlayer.phy}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
