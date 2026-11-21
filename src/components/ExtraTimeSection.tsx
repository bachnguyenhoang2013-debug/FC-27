import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { ExtraTimePickOption, PlayerCard, UserProfile } from '../types/game';
import { totyFeaturedPlayers, STARTER_OWNED_IDS } from '../data/mockData';
import {
  EXTRA_TIME_ASSETS,
  EXTRA_TIME_GEM_EXCHANGE_REWARD,
  EXTRA_TIME_GEM_EXCHANGE_TOKENS,
  EXTRA_TIME_QUESTIONS_PER_DAY,
  EXTRA_TIME_SECONDS_PER_QUESTION,
  EXTRA_TIME_SHOP_RESET_GEMS,
  EXTRA_TIME_SPECIAL_PICK_EXTRA_COST,
  EXTRA_TIME_TOKEN_PACK_GEMS,
  EXTRA_TIME_TOKEN_PACK_REWARD,
  EXTRA_TIME_TOKENS_PER_CORRECT,
  PremierLeagueTriviaQuestion,
  getExtraTimeMarketTokenPrice,
  pickRandomPremierLeagueQuestions,
  rollDailyExtraTimePickOptions,
  rollRandomMarketScoutPlayers,
  rollSpecialExtraTimePickOptions,
} from '../data/extraTimeData';
import { getMarketBuyPrice } from './TransferMarketModal';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
  normalizeExtraTimeState,
} from '../utils/dateUtils';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';
import { resourceRewardAnimService } from '../services/resourceRewardAnim';
import { addOwnedPlayerCopies } from '../utils/squadUtils';

export type ExtraTimeChapterTab = 'picks' | 'shop' | 'quest';
export type ExtraTimePickEntrance = 'daily' | 'special';

interface ExtraTimeSectionProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
}

export const ExtraTimeSection: React.FC<ExtraTimeSectionProps> = ({
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<ExtraTimeChapterTab>('picks');
  const [activePickEntrance, setActivePickEntrance] =
    useState<ExtraTimePickEntrance>('daily');
  const [selectedDailySlot, setSelectedDailySlot] = useState<number>(0);
  const [selectedSpecialSlot, setSelectedSpecialSlot] = useState<number>(0);

  const [cycleKey, setCycleKey] = useState<string>(() => getDaily6AMCycleKey());
  const [resetCountdown, setResetCountdown] = useState<string>(() =>
    getCountdownToNext6AM()
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const nextKey = getDaily6AMCycleKey();
      setCycleKey((prev) => (prev === nextKey ? prev : nextKey));
      setResetCountdown(getCountdownToNext6AM());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const extraState = useMemo(
    () => normalizeExtraTimeState(user.extraTime, cycleKey),
    [user.extraTime, cycleKey]
  );

  const extraTimeTokens = user.extraTimeTokens ?? 0;

  const ownedSet = useMemo(
    () =>
      new Set(
        user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS
      ),
    [user.ownedPlayerIds]
  );

  const playerMap = useMemo(() => {
    const m = new Map<string, PlayerCard>();
    totyFeaturedPlayers.forEach((p) => {
      if (!m.has(p.id)) m.set(p.id, p);
    });
    return m;
  }, []);

  // Extra Time Shop random market scout lineup
  const [shopRandomPlayers, setShopRandomPlayers] = useState<PlayerCard[]>(() =>
    rollRandomMarketScoutPlayers(ownedSet, 6)
  );

  const [walkoutCard, setWalkoutCard] = useState<PlayerCard | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    tone: 'gold' | 'error';
  } | null>(null);

  const showToast = (text: string, tone: 'gold' | 'error' = 'gold') => {
    setToast({ text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Premier League 20-question daily quiz session
  const [quizSession, setQuizSession] = useState<{
    questions: PremierLeagueTriviaQuestion[];
    currentIndex: number;
    selectedIndex: number | null;
    correctCount: number;
    tokensEarned: number;
    isPractice: boolean;
    finished: boolean;
  } | null>(null);
  const quizSessionRef = useRef(quizSession);
  quizSessionRef.current = quizSession;
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(
    EXTRA_TIME_SECONDS_PER_QUESTION
  );

  const quizActive = Boolean(quizSession && !quizSession.finished);

  useEffect(() => {
    resourceRewardAnimService.setSuppressed('extra_time_quiz', quizActive);
    return () => {
      resourceRewardAnimService.setSuppressed('extra_time_quiz', false);
    };
  }, [quizActive]);

  // 7-second countdown timer per question (pure countdown; timeout handled outside setState updater)
  useEffect(() => {
    if (!quizSession || quizSession.finished || quizSession.selectedIndex !== null) {
      return;
    }
    if (questionTimeLeft <= 0) {
      soundService.playTabSwitch();
      handleSelectQuizAnswer(-1);
      return;
    }
    const timer = window.setTimeout(() => {
      setQuestionTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    questionTimeLeft,
    quizSession?.currentIndex,
    quizSession?.selectedIndex,
    quizSession?.finished,
  ]);

  // ========== CHAPTER 1: PICKS HANDLERS ==========
  const handleStartDailyPick = () => {
    soundService.playClick();
    if (extraState.dailyPickClaimed) {
      showToast('Bạn đã nhận Lựa Chọn Hằng Ngày hôm nay! Quay lại lúc 06:00 sáng mai.', 'error');
      return;
    }
    if (extraState.dailyPickOptions.length === 3) {
      setActivePickEntrance('daily');
      return;
    }
    const rolled = rollDailyExtraTimePickOptions();
    setSelectedDailySlot(0);
    setActivePickEntrance('daily');
    onUpdateUser((prev) => {
      const cur = normalizeExtraTimeState(prev.extraTime, getDaily6AMCycleKey());
      if (cur.dailyPickOptions.length === 3 || cur.dailyPickClaimed) return {};
      return {
        extraTime: {
          ...cur,
          dailyPickOptions: rolled,
          dailyPickChosenIndex: null,
          dailyPickClaimed: false,
        },
      };
    });
  };

  const handleConfirmDailyPick = () => {
    if (
      extraState.dailyPickClaimed ||
      extraState.dailyPickOptions.length !== 3
    ) {
      return;
    }
    const chosen = extraState.dailyPickOptions[selectedDailySlot];
    if (!chosen || !chosen.playerId) return;
    const rewardPlayer = playerMap.get(chosen.playerId);
    if (!rewardPlayer) return;

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const cur = normalizeExtraTimeState(prev.extraTime, getDaily6AMCycleKey());
      if (cur.dailyPickClaimed) return {};
      const nextOwned = addOwnedPlayerCopies(
        prev.ownedPlayerIds ?? STARTER_OWNED_IDS,
        [rewardPlayer.id]
      );
      const nextTradeable = Array.from(
        new Set([...(prev.tradeablePlayerIds ?? []), rewardPlayer.id])
      );
      return {
        ownedPlayerIds: nextOwned,
        tradeablePlayerIds: nextTradeable,
        extraTime: {
          ...cur,
          dailyPickChosenIndex: selectedDailySlot,
          dailyPickClaimed: true,
        },
      };
    });

    if (rewardPlayer.ovr >= 90) {
      setWalkoutCard({ ...rewardPlayer, isTradeable: true });
    } else {
      showToast(
        `Đã nhận ${rewardPlayer.name} (${rewardPlayer.ovr} OVR · ${chosen.packTierLabel}) từ Lựa Chọn Hằng Ngày!`
      );
    }
  };

  const hasPendingSpecialPick =
    extraState.specialPickOptions.length === 3 && !extraState.specialPickClaimed;

  const handleStartSpecialPick = () => {
    soundService.playClick();
    setActivePickEntrance('special');
    if (hasPendingSpecialPick) return;

    if (extraTimeTokens < EXTRA_TIME_SPECIAL_PICK_EXTRA_COST) {
      showToast(
        `Không đủ Token Hiệp Phụ! Cần ${EXTRA_TIME_SPECIAL_PICK_EXTRA_COST.toLocaleString(
          'vi-VN'
        )} Token Hiệp Phụ để mở Lựa Chọn Đặc Biệt.`,
        'error'
      );
      return;
    }

    const rolled = rollSpecialExtraTimePickOptions();
    setSelectedSpecialSlot(0);
    onUpdateUser((prev) => {
      const activeCycle = getDaily6AMCycleKey();
      const cur = normalizeExtraTimeState(prev.extraTime, activeCycle);
      const curTokens = prev.extraTimeTokens ?? 0;
      if (curTokens < EXTRA_TIME_SPECIAL_PICK_EXTRA_COST) return {};

      return {
        extraTimeTokens: curTokens - EXTRA_TIME_SPECIAL_PICK_EXTRA_COST,
        extraTime: {
          ...cur,
          specialPickOptions: rolled,
          specialPickChosenIndex: null,
          specialPickClaimed: false,
        },
      };
    });
  };

  const handleConfirmSpecialPick = () => {
    if (
      extraState.specialPickClaimed ||
      extraState.specialPickOptions.length !== 3
    ) {
      return;
    }
    const chosen = extraState.specialPickOptions[selectedSpecialSlot];
    if (!chosen) return;

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 95, spread: 85, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    if (chosen.kind === 'coins') {
      const amount = chosen.amount ?? 20000;
      onUpdateUser((prev) => {
        const cur = normalizeExtraTimeState(prev.extraTime, getDaily6AMCycleKey());
        if (cur.specialPickClaimed) return {};
        return {
          coins: prev.coins + amount,
          extraTime: {
            ...cur,
            specialPickChosenIndex: selectedSpecialSlot,
            specialPickClaimed: true,
          },
        };
      });
      showToast(`Đã nhận +${amount.toLocaleString('vi-VN')} Xu từ Lựa Chọn Đặc Biệt!`);
      return;
    }

    if (chosen.kind === 'shards') {
      const amount = chosen.amount ?? 100;
      onUpdateUser((prev) => {
        const cur = normalizeExtraTimeState(prev.extraTime, getDaily6AMCycleKey());
        if (cur.specialPickClaimed) return {};
        return {
          totyShards: (prev.totyShards ?? 0) + amount,
          extraTime: {
            ...cur,
            specialPickChosenIndex: selectedSpecialSlot,
            specialPickClaimed: true,
          },
        };
      });
      showToast(`Đã nhận +${amount} Mảnh Trao Đổi từ Lựa Chọn Đặc Biệt!`);
      return;
    }

    if (chosen.kind === 'player' && chosen.playerId) {
      const rewardPlayer = playerMap.get(chosen.playerId);
      if (!rewardPlayer) return;
      onUpdateUser((prev) => {
        const cur = normalizeExtraTimeState(prev.extraTime, getDaily6AMCycleKey());
        if (cur.specialPickClaimed) return {};
        const nextOwned = addOwnedPlayerCopies(
          prev.ownedPlayerIds ?? STARTER_OWNED_IDS,
          [rewardPlayer.id]
        );
        const nextTradeable = Array.from(
          new Set([...(prev.tradeablePlayerIds ?? []), rewardPlayer.id])
        );
        return {
          ownedPlayerIds: nextOwned,
          tradeablePlayerIds: nextTradeable,
          extraTime: {
            ...cur,
            specialPickChosenIndex: selectedSpecialSlot,
            specialPickClaimed: true,
          },
        };
      });
      setWalkoutCard({ ...rewardPlayer, isTradeable: true });
    }
  };

  // ========== CHAPTER 2: SHOP HANDLERS ==========
  const handleExchangeGems = () => {
    soundService.playClick();
    if (extraTimeTokens < EXTRA_TIME_GEM_EXCHANGE_TOKENS) {
      showToast(
        `Chưa đủ Token Hiệp Phụ! Cần ${EXTRA_TIME_GEM_EXCHANGE_TOKENS.toLocaleString(
          'vi-VN'
        )} Token (hiện có ${extraTimeTokens.toLocaleString('vi-VN')}).`,
        'error'
      );
      return;
    }
    soundService.playConfirmSelection();
    try {
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.65 } });
    } catch {
      // ignore
    }
    onUpdateUser((prev) => {
      const curTokens = prev.extraTimeTokens ?? 0;
      if (curTokens < EXTRA_TIME_GEM_EXCHANGE_TOKENS) return {};
      return {
        extraTimeTokens: curTokens - EXTRA_TIME_GEM_EXCHANGE_TOKENS,
        gems: prev.gems + EXTRA_TIME_GEM_EXCHANGE_REWARD,
      };
    });
    showToast(
      `Trao đổi thành công 10.000 Token Hiệp Phụ → +${EXTRA_TIME_GEM_EXCHANGE_REWARD} Kim Cương!`
    );
  };

  const handleBuyExtraTimeTokens = () => {
    soundService.playClick();
    if (user.gems < EXTRA_TIME_TOKEN_PACK_GEMS) {
      showToast(
        `Chưa đủ Kim Cương! Cần ${EXTRA_TIME_TOKEN_PACK_GEMS.toLocaleString(
          'vi-VN'
        )} Kim Cương (hiện có ${user.gems.toLocaleString('vi-VN')}).`,
        'error'
      );
      return;
    }
    soundService.playConfirmSelection();
    try {
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
    } catch {
      // ignore
    }
    onUpdateUser((prev) => {
      if (prev.gems < EXTRA_TIME_TOKEN_PACK_GEMS) return {};
      return {
        gems: prev.gems - EXTRA_TIME_TOKEN_PACK_GEMS,
        extraTimeTokens: (prev.extraTimeTokens ?? 0) + EXTRA_TIME_TOKEN_PACK_REWARD,
      };
    });
    showToast(
      `Đổi thành công ${EXTRA_TIME_TOKEN_PACK_GEMS} Kim Cương → +${EXTRA_TIME_TOKEN_PACK_REWARD.toLocaleString(
        'vi-VN'
      )} Token Hiệp Phụ!`
    );
  };

  const handleRefreshShopRandom = () => {
    soundService.playClick();
    if (user.gems < EXTRA_TIME_SHOP_RESET_GEMS) {
      showToast(
        `Không đủ Kim Cương! Cần ${EXTRA_TIME_SHOP_RESET_GEMS.toLocaleString(
          'vi-VN'
        )} Kim Cương để reset Cửa Hàng Hiệp Phụ.`,
        'error'
      );
      return;
    }
    soundService.playConfirmSelection();
    onUpdateUser((prev) => {
      if (prev.gems < EXTRA_TIME_SHOP_RESET_GEMS) return {};
      return {
        gems: prev.gems - EXTRA_TIME_SHOP_RESET_GEMS,
      };
    });
    setShopRandomPlayers(rollRandomMarketScoutPlayers(ownedSet, 6));
    showToast(
      `Đã dùng ${EXTRA_TIME_SHOP_RESET_GEMS} Kim Cương reset danh sách 6 cầu thủ ngẫu nhiên!`
    );
  };

  const handleBuyRandomMarketPlayer = (player: PlayerCard) => {
    soundService.playClick();
    const tokenPrice = getExtraTimeMarketTokenPrice(player);
    if (extraTimeTokens < tokenPrice) {
      showToast(
        `Không đủ Token Hiệp Phụ! Cần ${tokenPrice.toLocaleString('vi-VN')} Token (Giá TTCN ÷ 40).`,
        'error'
      );
      return;
    }

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    onUpdateUser((prev) => {
      const curTokens = prev.extraTimeTokens ?? 0;
      if (curTokens < tokenPrice) return {};
      const nextOwned = addOwnedPlayerCopies(
        prev.ownedPlayerIds ?? STARTER_OWNED_IDS,
        [player.id]
      );
      const nextTradeable = Array.from(
        new Set([...(prev.tradeablePlayerIds ?? []), player.id])
      );
      return {
        extraTimeTokens: curTokens - tokenPrice,
        ownedPlayerIds: nextOwned,
        tradeablePlayerIds: nextTradeable,
      };
    });

    // Replace claimed player slot with a new random player
    const updatedOwned = new Set(ownedSet);
    updatedOwned.add(player.id);
    const replacement = rollRandomMarketScoutPlayers(updatedOwned, 1)[0];
    if (replacement) {
      setShopRandomPlayers((prev) =>
        prev.map((item) => (item.id === player.id ? replacement : item))
      );
    }

    if (player.ovr >= 90) {
      setWalkoutCard({ ...player, isTradeable: true });
    } else {
      showToast(
        `Chiêu mộ thành công ${player.name} (${player.ovr} OVR) với ${tokenPrice.toLocaleString(
          'vi-VN'
        )} Token Hiệp Phụ!`
      );
    }
  };

  // ========== CHAPTER 3: PREMIER LEAGUE 20-QUESTION QUIZ ==========
  const handleStartQuiz = (isPractice: boolean = false) => {
    soundService.playClick();
    const remainingQuestions = isPractice
      ? EXTRA_TIME_QUESTIONS_PER_DAY
      : Math.max(0, EXTRA_TIME_QUESTIONS_PER_DAY - extraState.questAnsweredCount);
    if (!isPractice && (extraState.questCompleted || remainingQuestions <= 0)) {
      return;
    }
    const picked = pickRandomPremierLeagueQuestions(remainingQuestions);
    setQuestionTimeLeft(EXTRA_TIME_SECONDS_PER_QUESTION);
    setQuizSession({
      questions: picked,
      currentIndex: 0,
      selectedIndex: null,
      correctCount: isPractice ? 0 : extraState.questCorrectCount,
      tokensEarned: isPractice ? 0 : extraState.questTokensEarned,
      isPractice,
      finished: false,
    });
  };

  const handleSelectQuizAnswer = (optionIdx: number) => {
    const cur = quizSessionRef.current;
    if (!cur || cur.finished || cur.selectedIndex !== null) return;
    const q = cur.questions[cur.currentIndex];
    if (!q) return;

    const isCorrect = optionIdx === q.correctIndex;
    if (isCorrect) {
      soundService.playCoins();
    } else {
      soundService.playTabSwitch();
    }
    const addedTokens = isCorrect ? EXTRA_TIME_TOKENS_PER_CORRECT : 0;

    const nextSession = {
      ...cur,
      selectedIndex: optionIdx,
      correctCount: cur.correctCount + (isCorrect ? 1 : 0),
      tokensEarned: cur.tokensEarned + addedTokens,
    };
    quizSessionRef.current = nextSession;
    setQuizSession(nextSession);

    if (!cur.isPractice) {
      onUpdateUser((prev) => {
        const activeCycle = getDaily6AMCycleKey();
        const st = normalizeExtraTimeState(prev.extraTime, activeCycle);
        if (st.questCompleted || st.questAnsweredCount >= EXTRA_TIME_QUESTIONS_PER_DAY) {
          return {};
        }
        const nextAnswered = st.questAnsweredCount + 1;
        const nextCorrect = st.questCorrectCount + (isCorrect ? 1 : 0);
        const nextEarned = st.questTokensEarned + addedTokens;
        const completedNow = nextAnswered >= EXTRA_TIME_QUESTIONS_PER_DAY;
        return {
          extraTimeTokens: (prev.extraTimeTokens ?? 0) + addedTokens,
          extraTime: {
            ...st,
            questAnsweredCount: nextAnswered,
            questCorrectCount: nextCorrect,
            questTokensEarned: nextEarned,
            questCompleted: completedNow,
            questQuestionIds: [...st.questQuestionIds, q.id],
          },
        };
      });
    }
  };

  const handleNextQuizQuestion = () => {
    soundService.playClick();
    const cur = quizSessionRef.current;
    if (!cur || cur.selectedIndex === null) return;

    const isLast = cur.currentIndex + 1 >= cur.questions.length;
    if (isLast) {
      if (!cur.isPractice) {
        try {
          confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
      const nextSession = { ...cur, finished: true };
      quizSessionRef.current = nextSession;
      setQuizSession(nextSession);
      return;
    }

    setQuestionTimeLeft(EXTRA_TIME_SECONDS_PER_QUESTION);
    const nextSession = {
      ...cur,
      currentIndex: cur.currentIndex + 1,
      selectedIndex: null,
    };
    quizSessionRef.current = nextSession;
    setQuizSession(nextSession);
  };

  const renderPickOptionCard = (
    opt: ExtraTimePickOption,
    idx: number,
    isPicked: boolean,
    isClaimed: boolean,
    onSelect: () => void
  ) => {
    const player =
      opt.kind === 'player' && opt.playerId ? playerMap.get(opt.playerId) : null;
    return (
      <button
        key={opt.id}
        type="button"
        disabled={isClaimed}
        onClick={() => {
          if (isClaimed) return;
          soundService.playClick();
          onSelect();
        }}
        className={`relative aspect-[3/4.1] w-full max-w-[230px] mx-auto flex flex-col items-center justify-between p-4 transition-all duration-200 overflow-hidden ${
          isClaimed ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1'
        } ${
          isPicked
            ? 'scale-[1.03] shadow-[0_0_28px_rgba(16,185,129,0.55)] ring-2 ring-emerald-300'
            : 'opacity-90 hover:opacity-100'
        }`}
      >
        {/* Official 1-of-3 Extra Time Frame Image (Unpicked vs Picked) */}
        <img
          src={
            isPicked
              ? EXTRA_TIME_ASSETS.framePicked
              : EXTRA_TIME_ASSETS.frameUnpicked
          }
          alt={isPicked ? 'Đã chọn' : 'Chưa chọn'}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
        />

        <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
          <span
            className={
              opt.packTierLabel === 'Gói A'
                ? 'text-yellow-300'
                : opt.packTierLabel === 'Gói B'
                ? 'text-cyan-300'
                : 'text-slate-200'
            }
          >
            {opt.kind === 'player'
              ? opt.packTierLabel || 'CẦU THỦ'
              : opt.kind === 'shards'
              ? 'MẢNH TRAO ĐỔI'
              : 'TÀI NGUYÊN'}
          </span>
          <span className={isPicked ? 'text-emerald-300' : 'text-slate-400'}>
            {isPicked ? 'ĐÃ CHỌN' : `LỰA CHỌN #${idx + 1}`}
          </span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full my-2">
          {player ? (
            <FCCard player={player} size="sm" showStats={false} />
          ) : opt.kind === 'coins' ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <img
                src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                alt="Xu"
                className="w-16 h-16 object-contain drop-shadow-[0_0_16px_rgba(250,204,21,0.5)]"
              />
              <div className="font-mono font-black text-2xl text-yellow-300 tabular-nums">
                +{(opt.amount ?? 0).toLocaleString('vi-VN')}
              </div>
              <div className="text-xs font-black uppercase text-amber-100">
                XU VÀNG
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-300/70 flex items-center justify-center">
                <Trophy className="w-9 h-9 text-cyan-300" />
              </div>
              <div className="font-mono font-black text-2xl text-cyan-300 tabular-nums">
                +{(opt.amount ?? 0).toLocaleString('vi-VN')}
              </div>
              <div className="text-xs font-black uppercase text-cyan-100">
                MẢNH TRAO ĐỔI
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 w-full text-center pt-1 border-t border-white/15">
          <div className="font-black text-xs text-white uppercase truncate">
            {opt.label}
          </div>
          {player && (
            <div className="text-[10px] text-slate-300 truncate">
              {player.position} · {player.club}
            </div>
          )}
        </div>
      </button>
    );
  };

  const currentQuestion = quizSession
    ? quizSession.questions[quizSession.currentIndex]
    : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#060d18] text-white font-cruyff select-none">
      {/* Official Extra Time Background */}
      <img
        src={EXTRA_TIME_ASSETS.bgMain}
        alt="Background Hiệp Phụ"
        className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#040a14]/85 via-[#071525]/65 to-[#030812]/92 pointer-events-none" />

      {/* Toast Notice */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 border-2 text-xs sm:text-sm font-black uppercase tracking-wider shadow-2xl ${
            toast.tone === 'error'
              ? 'bg-rose-950/95 border-rose-400 text-rose-100'
              : 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* EXTRA TIME HEADER */}
      <div className="relative z-10 px-4 sm:px-6 py-3.5 border-b border-cyan-400/30 bg-[#050d1a]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={EXTRA_TIME_ASSETS.tokenLarge}
            alt="Hiệp Phụ"
            className="w-11 h-11 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                SỰ KIỆN CHÍNH KHU PHỨC HỢP
              </span>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                · Reset 06:00: {resetCountdown}
              </span>
            </div>
            <h2 className="font-black text-lg sm:text-xl text-white uppercase tracking-wider truncate">
              HIỆP PHỤ · EXTRA TIME
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#09182c] border border-cyan-400/60">
          <img
            src={EXTRA_TIME_ASSETS.tokenSmall}
            alt="Token Hiệp Phụ"
            className="w-5 h-5 object-contain shrink-0"
          />
          <div className="leading-tight">
            <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">
              Token Hiệp Phụ
            </div>
            <div className="font-mono font-black text-base text-white tabular-nums">
              {extraTimeTokens.toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      {/* 3-CHAPTER NAVIGATION */}
      <nav className="relative z-10 grid grid-cols-3 border-b border-white/15 bg-[#06101f]/95 shrink-0 divide-x divide-white/10">
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveTab('picks');
          }}
          className={`py-3 px-3 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'picks'
              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
              : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
          <span className="truncate">Chương 1: Lựa Chọn</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveTab('shop');
          }}
          className={`py-3 px-3 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'shop'
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400'
              : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="truncate">Chương 2: Cửa Hàng</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveTab('quest');
          }}
          className={`py-3 px-3 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'quest'
              ? 'bg-amber-500/20 text-yellow-200 border-yellow-400'
              : 'text-slate-300 hover:text-white border-transparent hover:bg-white/5'
          }`}
        >
          <Trophy className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="truncate">
            Chương 3: Quest ({extraState.questAnsweredCount}/
            {EXTRA_TIME_QUESTIONS_PER_DAY})
          </span>
        </button>
      </nav>

      {/* CHAPTER BODY */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ================= CHAPTER 1: LỰA CHỌN (2 SEPARATE ENTRANCES) ================= */}
        {activeTab === 'picks' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* 2 Separate Entrances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entrance 1: Lựa Chọn Hằng Ngày */}
              <div
                onClick={() => {
                  soundService.playClick();
                  setActivePickEntrance('daily');
                }}
                className={`p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  activePickEntrance === 'daily'
                    ? 'bg-[#081a2d]/95 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.28)]'
                    : 'bg-[#05101d]/85 border-white/20 hover:border-cyan-400/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                      ENTRANCE 1 · RESET 06:00 SÁNG
                    </div>
                    <h3 className="font-black text-lg text-white uppercase mt-0.5">
                      LỰA CHỌN HẰNG NGÀY (1 TRONG 3)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Chọn 1 trong 3 cầu thủ ngẫu nhiên mỗi ngày (phong cách Hiệp Phụ FC Mobile).
                    </p>
                  </div>
                  <img
                    src={EXTRA_TIME_ASSETS.framePicked}
                    alt="1 trong 3"
                    className="w-10 h-14 object-contain shrink-0"
                  />
                </div>

                <div className="text-[11px] font-mono text-cyan-200 border-t border-white/10 pt-2.5 flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                  <span>• Cầu thủ Gói C: 95%</span>
                  <span>• Cầu thủ Gói B: 5%</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartDailyPick();
                  }}
                  className={`w-full py-2.5 px-4 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    extraState.dailyPickClaimed
                      ? 'bg-slate-800 text-slate-400 border border-white/15'
                      : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                  }`}
                >
                  {extraState.dailyPickClaimed
                    ? `ĐÃ NHẬN HÔM NAY · RESET ${resetCountdown}`
                    : extraState.dailyPickOptions.length === 3
                    ? 'ĐANG CHỜ CHỌN 1 TRONG 3'
                    : 'MỞ LỰA CHỌN HẰNG NGÀY (MIỄN PHÍ)'}
                </button>
              </div>

              {/* Entrance 2: Lựa Chọn Đặc Biệt */}
              <div
                onClick={() => {
                  soundService.playClick();
                  setActivePickEntrance('special');
                }}
                className={`p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  activePickEntrance === 'special'
                    ? 'bg-[#09211d]/95 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.28)]'
                    : 'bg-[#051412]/85 border-white/20 hover:border-emerald-400/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      ENTRANCE 2 · PHẦN THƯỞNG ĐẶC BIỆT
                    </div>
                    <h3 className="font-black text-lg text-white uppercase mt-0.5">
                      LỰA CHỌN ĐẶC BIỆT (1 TRONG 3)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Chọn 1 trong 3 phần thưởng cao cấp: Xu, Mảnh Trao Đổi, Gói B hoặc Gói A 100+ OVR.
                    </p>
                  </div>
                  <img
                    src={EXTRA_TIME_ASSETS.tokenLarge}
                    alt="Đặc Biệt"
                    className="w-12 h-12 object-contain shrink-0"
                  />
                </div>

                <div className="text-[11px] font-mono text-emerald-200 border-t border-white/10 pt-2.5 grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums">
                  <span>• 20.000 Xu: 20%</span>
                  <span>• 100 Mảnh: 20%</span>
                  <span>• 50.000 Xu: 20%</span>
                  <span>• Gói B (90–99): 39%</span>
                  <span className="text-yellow-300 col-span-2">• Gói A (100+ OVR): 1%</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSpecialPick();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  {hasPendingSpecialPick
                    ? 'ĐANG CHỜ CHỌN 1 TRONG 3'
                    : `MỞ LỰA CHỌN ĐẶC BIỆT (${EXTRA_TIME_SPECIAL_PICK_EXTRA_COST.toLocaleString(
                        'vi-VN'
                      )} TOKEN HIỆP PHỤ)`}
                </button>
              </div>
            </div>

            {/* Active 1-of-3 Extra Time Pick Stage */}
            {activePickEntrance === 'daily' && (
              <div className="p-5 sm:p-6 bg-[#040c18]/92 border-2 border-cyan-400/70 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-cyan-200 uppercase">
                      BÀN CHỌN 1 TRONG 3 · LỰA CHỌN HẰNG NGÀY
                    </h4>
                    <p className="text-xs text-slate-300">
                      Chạm vào khung thẻ để chọn 1 cầu thủ bạn muốn nhận (Gói C: 95% · Gói B: 5%).
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-300 tabular-nums">
                    Reset: {resetCountdown}
                  </span>
                </div>

                {extraState.dailyPickOptions.length === 3 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {extraState.dailyPickOptions.map((opt, idx) => {
                        const isPicked = extraState.dailyPickClaimed
                          ? extraState.dailyPickChosenIndex === idx
                          : selectedDailySlot === idx;
                        return renderPickOptionCard(
                          opt,
                          idx,
                          isPicked,
                          extraState.dailyPickClaimed,
                          () => setSelectedDailySlot(idx)
                        );
                      })}
                    </div>

                    {!extraState.dailyPickClaimed ? (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleConfirmDailyPick}
                          className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-105 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_0_24px_rgba(34,211,238,0.45)]"
                        >
                          XÁC NHẬN NHẬN LỰA CHỌN #{selectedDailySlot + 1}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        Bạn đã nhận phần thưởng Hằng Ngày hôm nay. Quay lại sau {resetCountdown} (06:00 sáng).
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center space-y-4">
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto opacity-75">
                      {[0, 1, 2].map((slotIdx) => (
                        <img
                          key={slotIdx}
                          src={EXTRA_TIME_ASSETS.frameUnpicked}
                          alt="Slot chưa mở"
                          className="w-full aspect-[3/4.1] object-contain mx-auto"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartDailyPick}
                      className="px-7 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      MỞ NGAY 3 LỰA CHỌN HẰNG NGÀY (MIỄN PHÍ)
                    </button>
                  </div>
                )}
              </div>
            )}

            {activePickEntrance === 'special' && (
              <div className="p-5 sm:p-6 bg-[#04120f]/92 border-2 border-emerald-400/75 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-emerald-200 uppercase">
                      BÀN CHỌN 1 TRONG 3 · LỰA CHỌN ĐẶC BIỆT
                    </h4>
                    <p className="text-xs text-slate-300">
                      Chạm khung thẻ để chọn 1 phần thưởng duy nhất trong 3 ô đã mở.
                    </p>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 tabular-nums">
                    Token hiện có: {extraTimeTokens.toLocaleString('vi-VN')}
                  </div>
                </div>

                {extraState.specialPickOptions.length === 3 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {extraState.specialPickOptions.map((opt, idx) => {
                        const isPicked = extraState.specialPickClaimed
                          ? extraState.specialPickChosenIndex === idx
                          : selectedSpecialSlot === idx;
                        return renderPickOptionCard(
                          opt,
                          idx,
                          isPicked,
                          extraState.specialPickClaimed,
                          () => setSelectedSpecialSlot(idx)
                        );
                      })}
                    </div>

                    {!extraState.specialPickClaimed ? (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleConfirmSpecialPick}
                          className="px-8 py-3 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-105 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_0_24px_rgba(16,185,129,0.45)]"
                        >
                          XÁC NHẬN NHẬN LỰA CHỌN ĐẶC BIỆT #{selectedSpecialSlot + 1}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          Đã nhận phần thưởng! Bạn có thể mở lượt mới ngay bằng Token Hiệp Phụ.
                        </div>
                        <button
                          type="button"
                          onClick={handleStartSpecialPick}
                          className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                        >
                          MỞ LƯỢT ĐẶC BIỆT MỚI (
                          {EXTRA_TIME_SPECIAL_PICK_EXTRA_COST.toLocaleString('vi-VN')} TOKEN)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center space-y-4">
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto opacity-80">
                      {[0, 1, 2].map((slotIdx) => (
                        <img
                          key={slotIdx}
                          src={
                            slotIdx === 1
                              ? EXTRA_TIME_ASSETS.framePicked
                              : EXTRA_TIME_ASSETS.frameUnpicked
                          }
                          alt="Slot đặc biệt"
                          className="w-full aspect-[3/4.1] object-contain mx-auto"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartSpecialPick}
                      className="px-7 py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      {`MỞ LỰA CHỌN ĐẶC BIỆT (${EXTRA_TIME_SPECIAL_PICK_EXTRA_COST.toLocaleString(
                        'vi-VN'
                      )} TOKEN HIỆP PHỤ)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= CHAPTER 2: CỬA HÀNG HIỆP PHỤ ================= */}
        {activeTab === 'shop' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Currency Exchanges: 10,000 Token -> 400 Kim Cương & 50 Kim Cương -> 1,000 Token Hiệp Phụ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Reward 1A: 10,000 Token -> 400 Kim Cương */}
              <div className="p-5 bg-[#061526]/92 border-2 border-cyan-400/75 flex flex-col justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2 shrink-0 bg-black/50 p-3 border border-white/15">
                    <img
                      src={EXTRA_TIME_ASSETS.tokenLarge}
                      alt="10.000 Token Hiệp Phụ"
                      className="w-10 h-10 object-contain"
                    />
                    <span className="font-black text-cyan-300 text-lg">→</span>
                    <img
                      src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                      alt="400 Kim Cương"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                      QUY ĐỔI KIM CƯƠNG
                    </div>
                    <h3 className="font-black text-base text-white uppercase">
                      10.000 TOKEN → +400 KIM CƯƠNG
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Đổi Token Hiệp Phụ lấy Kim Cương trực tiếp.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExchangeGems}
                  disabled={extraTimeTokens < EXTRA_TIME_GEM_EXCHANGE_TOKENS}
                  className={`w-full px-4 py-2.5 font-black text-xs uppercase tracking-wider transition-all cursor-pointer tabular-nums ${
                    extraTimeTokens >= EXTRA_TIME_GEM_EXCHANGE_TOKENS
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : 'bg-slate-800 text-slate-400 border border-white/15 cursor-not-allowed'
                  }`}
                >
                  ĐỔI 400 KIM CƯƠNG ({EXTRA_TIME_GEM_EXCHANGE_TOKENS.toLocaleString('vi-VN')} TOKEN)
                </button>
              </div>

              {/* Reward 1B: 50 Kim Cương -> 1,000 Token Hiệp Phụ */}
              <div className="p-5 bg-[#061c22]/92 border-2 border-emerald-400/75 flex flex-col justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2 shrink-0 bg-black/50 p-3 border border-white/15">
                    <img
                      src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                      alt="50 Kim Cương"
                      className="w-10 h-10 object-contain"
                    />
                    <span className="font-black text-emerald-300 text-lg">→</span>
                    <img
                      src={EXTRA_TIME_ASSETS.tokenLarge}
                      alt="1.000 Token Hiệp Phụ"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      MUA TOKEN HIỆP PHỤ
                    </div>
                    <h3 className="font-black text-base text-white uppercase">
                      50 KIM CƯƠNG → +1.000 TOKEN HIỆP PHỤ
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Hiện có: {user.gems.toLocaleString('vi-VN')} Kim Cương
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBuyExtraTimeTokens}
                  disabled={user.gems < EXTRA_TIME_TOKEN_PACK_GEMS}
                  className={`w-full px-4 py-2.5 font-black text-xs uppercase tracking-wider transition-all cursor-pointer tabular-nums flex items-center justify-center gap-2 ${
                    user.gems >= EXTRA_TIME_TOKEN_PACK_GEMS
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800 text-slate-400 border border-white/15 cursor-not-allowed'
                  }`}
                >
                  <img
                    src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                  <span>
                    ĐỔI +1.000 TOKEN ({EXTRA_TIME_TOKEN_PACK_GEMS} KIM CƯƠNG)
                  </span>
                </button>
              </div>
            </div>

            {/* Reward 2: Random Market Players at Market Price / 40 */}
            <div className="p-5 bg-[#05101d]/92 border border-white/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    CẦU THỦ RANDOM THỊ TRƯỜNG CHUYỂN NHƯỢNG
                  </div>
                  <h3 className="font-black text-base sm:text-lg text-white uppercase">
                    TRAO ĐỔI CẦU THỦ RANDOM (SỐ TOKEN = GIÁ TTCN ÷ 40)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Mức giá Token Hiệp Phụ được tính đúng bằng Giá Thị Trường Chuyển Nhượng chia 40 lần.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshShopRandom}
                  className={`px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer tabular-nums ${
                    user.gems >= EXTRA_TIME_SHOP_RESET_GEMS
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-white/20'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Cửa Hàng</span>
                  <img
                    src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                    alt="Kim Cương"
                    className="w-4 h-4 object-contain"
                  />
                  <span>{EXTRA_TIME_SHOP_RESET_GEMS}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shopRandomPlayers.map((player) => {
                  const marketCoins = getMarketBuyPrice(player);
                  const tokenCost = getExtraTimeMarketTokenPrice(player);
                  const isOwned = ownedSet.has(player.id);
                  const canAfford = !isOwned && extraTimeTokens >= tokenCost;

                  return (
                    <div
                      key={player.id}
                      className="p-4 bg-[#071528]/95 border border-white/15 hover:border-cyan-400/70 transition-all flex flex-col items-center justify-between gap-3"
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-slate-300">
                        <span>
                          {player.position} · OVR {player.ovr}
                        </span>
                        <span className="text-cyan-300">
                          {isOwned ? 'ĐÃ SỞ HỮU' : 'GIAO DỊCH ĐƯỢC'}
                        </span>
                      </div>

                      <FCCard player={player} size="sm" showStats={false} />

                      <div className="w-full text-center space-y-1 border-t border-white/10 pt-2">
                        <div className="font-black text-sm text-white uppercase truncate">
                          {player.name}
                        </div>
                        <div className="text-[11px] font-mono text-amber-200 tabular-nums">
                          Giá TTCN: {marketCoins.toLocaleString('vi-VN')} Xu
                        </div>
                        <div className="text-xs font-mono font-black text-cyan-300 tabular-nums flex items-center justify-center gap-1">
                          <img
                            src={EXTRA_TIME_ASSETS.tokenSmall}
                            alt=""
                            className="w-4 h-4 object-contain"
                          />
                          <span>
                            {tokenCost.toLocaleString('vi-VN')} Token Hiệp Phụ (÷40)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleBuyRandomMarketPlayer(player)}
                        className={`w-full py-2 px-3 font-black text-xs uppercase tracking-wider cursor-pointer transition-all tabular-nums ${
                          isOwned
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 cursor-not-allowed'
                            : canAfford
                            ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                            : 'bg-slate-800 text-slate-400 border border-white/15 cursor-not-allowed'
                        }`}
                      >
                        {isOwned
                          ? 'ĐÃ CÓ TRONG CLB'
                          : `ĐỔI (${tokenCost.toLocaleString('vi-VN')} TOKEN)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= CHAPTER 3: QUEST HẰNG NGÀY (20 CÂU PREMIER LEAGUE · 7s/CÂU) ================= */}
        {activeTab === 'quest' && (
          <div className="max-w-3xl mx-auto">
            {!quizSession ? (
              <div className="p-6 bg-[#071525]/92 border-2 border-yellow-400/75 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-yellow-300">
                      PREMIER LEAGUE TRIVIA · RESET 06:00 SÁNG
                    </div>
                    <h3 className="font-black text-xl text-white uppercase mt-0.5">
                      QUEST HẰNG NGÀY · 20 CÂU HỎI NGOẠI HẠNG ANH
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Mỗi câu chỉ có <strong className="text-yellow-300">7 giây</strong> để trả lời. Mỗi câu đúng nhận ngay <strong className="text-cyan-300">+500 Token Hiệp Phụ</strong> (tối đa 10.000 Token/ngày).
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300 tabular-nums">
                    <div>Reset sau:</div>
                    <div className="font-black text-yellow-300 text-sm">
                      {resetCountdown}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center bg-black/45 p-4 border border-white/10 tabular-nums">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">
                      Đã Trả Lời Hôm Nay
                    </div>
                    <div className="font-mono font-black text-lg text-white">
                      {extraState.questAnsweredCount}/{EXTRA_TIME_QUESTIONS_PER_DAY}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">
                      Số Câu Đúng
                    </div>
                    <div className="font-mono font-black text-lg text-emerald-300">
                      {extraState.questCorrectCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">
                      Token Đã Nhận
                    </div>
                    <div className="font-mono font-black text-lg text-cyan-300">
                      +{extraState.questTokensEarned.toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {!extraState.questCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleStartQuiz(false)}
                      className="px-7 py-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:brightness-105 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>
                        {extraState.questAnsweredCount > 0
                          ? `TIẾP TỤC (${
                              EXTRA_TIME_QUESTIONS_PER_DAY -
                              extraState.questAnsweredCount
                            } CÂU CÒN LẠI)`
                          : 'BẮT ĐẦU 20 CÂU HỎI PREMIER LEAGUE'}
                      </span>
                    </button>
                  ) : (
                    <>
                      <div className="w-full text-center text-xs font-bold text-emerald-300 uppercase">
                        Bạn đã hoàn thành 20/20 câu hỏi Premier League hôm nay! Quay lại vào 06:00 sáng mai.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartQuiz(true)}
                        className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Chơi Luyện Tập Thêm (Không Thưởng)
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : quizSession.finished ? (
              <div className="p-6 bg-[#071525]/95 border-2 border-emerald-400 text-center space-y-5">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
                <div>
                  <div className="text-xs font-black uppercase text-emerald-300 tracking-widest">
                    {quizSession.isPractice
                      ? 'HOÀN THÀNH LUYỆN TẬP'
                      : 'HOÀN THÀNH QUEST PREMIER LEAGUE'}
                  </div>
                  <h3 className="font-black text-2xl text-white uppercase mt-1">
                    ĐÚNG {quizSession.correctCount}/{EXTRA_TIME_QUESTIONS_PER_DAY} CÂU
                  </h3>
                  {!quizSession.isPractice && (
                    <div className="font-mono font-black text-xl text-cyan-300 mt-2 tabular-nums">
                      +{quizSession.tokensEarned.toLocaleString('vi-VN')} TOKEN HIỆP PHỤ
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setQuizSession(null)}
                  className="px-7 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  QUAY LẠI QUEST HẰNG NGÀY
                </button>
              </div>
            ) : (
              currentQuestion && (
                <div className="p-5 sm:p-6 bg-[#061220]/95 border-2 border-cyan-400/80 space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-cyan-300 uppercase tabular-nums">
                      CÂU {quizSession.currentIndex + 1} /{' '}
                      {quizSession.questions.length}
                      {quizSession.isPractice ? ' · LUYỆN TẬP' : ''}
                    </span>

                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-4 h-4 ${
                          questionTimeLeft <= 2
                            ? 'text-rose-400 animate-pulse'
                            : 'text-yellow-300'
                        }`}
                      />
                      <span
                        className={`font-mono font-black text-lg tabular-nums ${
                          questionTimeLeft <= 2 ? 'text-rose-400' : 'text-yellow-300'
                        }`}
                      >
                        {questionTimeLeft}s
                      </span>
                    </div>
                  </div>

                  {/* 7-second Countdown Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        questionTimeLeft <= 2 ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                      style={{
                        width: `${
                          (questionTimeLeft / EXTRA_TIME_SECONDS_PER_QUESTION) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <h4 className="font-black text-base sm:text-lg text-white leading-snug">
                    {currentQuestion.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((optText, idx) => {
                      const answered = quizSession.selectedIndex !== null;
                      const isCorrectOpt = idx === currentQuestion.correctIndex;
                      const isSelectedOpt = idx === quizSession.selectedIndex;

                      let btnStyle =
                        'bg-[#0a1d35] hover:bg-[#102c4f] border-white/20 text-white';
                      if (answered) {
                        if (isCorrectOpt) {
                          btnStyle =
                            'bg-emerald-900/90 border-emerald-400 text-emerald-100';
                        } else if (isSelectedOpt) {
                          btnStyle =
                            'bg-rose-900/90 border-rose-400 text-rose-100';
                        } else {
                          btnStyle = 'bg-slate-900/70 border-white/10 text-slate-400';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={answered}
                          onClick={() => handleSelectQuizAnswer(idx)}
                          className={`p-3.5 border text-left font-bold text-sm flex items-center justify-between gap-2 transition-all ${
                            answered ? 'cursor-default' : 'cursor-pointer'
                          } ${btnStyle}`}
                        >
                          <span>
                            <strong className="mr-2 font-mono text-cyan-300">
                              {String.fromCharCode(65 + idx)}.
                            </strong>
                            {optText}
                          </span>
                          {answered && isCorrectOpt && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                          )}
                          {answered && isSelectedOpt && !isCorrectOpt && (
                            <XCircle className="w-4 h-4 text-rose-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSession.selectedIndex !== null && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <span className="text-xs font-bold uppercase text-cyan-200">
                        {quizSession.selectedIndex === currentQuestion.correctIndex
                          ? `Chính xác! +${
                              quizSession.isPractice
                                ? 0
                                : EXTRA_TIME_TOKENS_PER_CORRECT
                            } Token Hiệp Phụ`
                          : quizSession.selectedIndex === -1
                          ? 'Hết 7 giây! Chưa nhận được Token câu này.'
                          : 'Chưa chính xác!'}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextQuizQuestion}
                        className="px-6 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                      >
                        {quizSession.currentIndex + 1 >=
                        quizSession.questions.length
                          ? 'XEM KẾT QUẢ'
                          : 'CÂU TIẾP THEO'}
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Player Walkout Reveal */}
      {walkoutCard && (
        <PackOpeningModal
          fixedPlayer={walkoutCard}
          autoStartWalkout
          skipResourceBonus
          packTheme="UTOTY"
          onClose={() => setWalkoutCard(null)}
          onPlayerClaimed={() => {}}
        />
      )}
    </div>
  );
};
