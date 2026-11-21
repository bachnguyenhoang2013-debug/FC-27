import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trophy,
  Upload,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { UserProfile, LibertadoresBasketOffer } from '../types/game';
import { PackTier } from './PackOpeningModal';
import {
  getDaily6AMCycleKey,
  getCountdownToNext6AM,
  getLibertadoresOfficialUnlockMs,
  isLibertadoresEventUnlocked,
  formatCountdownToTargetMs,
  normalizeLibertadoresState,
} from '../utils/dateUtils';
import { resourceRewardAnimService } from '../services/resourceRewardAnim';
import {
  useLibertadoresAssets,
  refreshLibertadoresAssetsStatus,
  LIBERTADORES_TOKEN_SMALL_FALLBACK,
  LIBERTADORES_TOKEN_LARGE_FALLBACK,
} from '../data/libertadoresAssets';
import {
  LIBERTADORES_STREAK_MILESTONES,
  SOUTH_AMERICA_90_PACK_COST_TOKENS,
  TRIVIA_SECONDS_PER_QUESTION,
  TRIVIA_QUESTIONS_PER_DAY,
  TRIVIA_TOKENS_PER_CORRECT,
  CHAPTER_2_REQUIRED_CAREER_MATCHES,
  CHAPTER_2_MIN_RANDOM_TOKENS,
  CHAPTER_2_MAX_RANDOM_TOKENS,
  rollRandomLibertadoresBasket,
  pickDailyLibertadoresQuestions,
} from '../data/conmebolLibertadoresData';

export type LibertadoresChapterId = 'main' | 'training' | 'trivia' | 'rewards';

export type FeaturedEventDestination =
  | 'toty26'
  | 'future_stars'
  | 'icons'
  | 'star_pass'
  | 'shop_conmebol';

interface ConmebolLibertadoresModalProps {
  user: UserProfile;
  initialChapter?: LibertadoresChapterId;
  onUpdateUser: (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenPackTier: (tier: PackTier, customName?: string) => void;
  onGoToCareer: () => void;
  onGoToShopGiftcode: () => void;
  onNavigateFeaturedEvent: (dest: FeaturedEventDestination) => void;
  onClose: () => void;
  embedded?: boolean;
}

const GOLD_CONFETTI_COLORS = ['#f5d97e', '#d4af37', '#b6821f', '#ffffff', '#78500d'];

export const ConmebolLibertadoresModal: React.FC<ConmebolLibertadoresModalProps> = ({
  user,
  initialChapter = 'main',
  onUpdateUser,
  onOpenPackTier,
  onGoToCareer,
  onGoToShopGiftcode,
  onNavigateFeaturedEvent,
  onClose,
  embedded = false,
}) => {
  const { getAsset } = useLibertadoresAssets();
  const [activeChapter, setActiveChapter] = useState<LibertadoresChapterId>(initialChapter);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [notice, setNotice] = useState<{ text: string; kind: 'gold' | 'error' } | null>(null);
  const [showFeaturedDrawer, setShowFeaturedDrawer] = useState<boolean>(false);

  // Chapter 1 Random Spin Machine state
  const [isSpinningMachine, setIsSpinningMachine] = useState<boolean>(false);
  const [previewBasket, setPreviewBasket] = useState<LibertadoresBasketOffer | null>(null);

  // Chapter 2 Random 50-150 Token Roll animation state
  const [isRollingTraining, setIsRollingTraining] = useState<boolean>(false);
  const [rollingNumberDisplay, setRollingNumberDisplay] = useState<number>(100);

  // Chapter 3 Trivia active quiz state
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(TRIVIA_SECONDS_PER_QUESTION * 1000);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionLocked, setQuestionLocked] = useState<boolean>(false);
  const [sessionAnswers, setSessionAnswers] = useState<Array<'correct' | 'wrong' | 'timeout'>>([]);

  // Discreet untouched file uploader ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAssets, setIsUploadingAssets] = useState<boolean>(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Suppress global resource reward modal while 5-second Trivia timer is actively running
  useEffect(() => {
    resourceRewardAnimService.setSuppressed('libertadores_trivia', quizStarted);
    return () => {
      resourceRewardAnimService.setSuppressed('libertadores_trivia', false);
    };
  }, [quizStarted]);

  const showToast = (text: string, kind: 'gold' | 'error' = 'gold') => {
    setNotice({ text, kind });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  const fireGoldConfetti = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 85,
        origin: { y: 0.55 },
        colors: GOLD_CONFETTI_COLORS,
      });
    } catch {
      // ignore
    }
  };

  const cycleKey = getDaily6AMCycleKey(new Date(nowMs));
  const libState = useMemo(
    () => normalizeLibertadoresState(user.libertadoresState, cycleKey),
    [user.libertadoresState, cycleKey]
  );

  const officialUnlockMs = useMemo(
    () => getLibertadoresOfficialUnlockMs(new Date(nowMs)),
    [nowMs]
  );
  const isUnlocked = isLibertadoresEventUnlocked(libState, nowMs);
  const unlockTicketsCount = user.unlockTickets ?? 0;
  const libertadoresTokens = user.libertadoresTokens ?? 0;

  const dailyQuestions = useMemo(
    () => pickDailyLibertadoresQuestions(cycleKey, libState.triviaQuestionIds),
    [cycleKey, libState.triviaQuestionIds]
  );

  // Initialize first random basket in Chapter 1 if unlocked and none rolled yet
  useEffect(() => {
    if (isUnlocked && !libState.currentBasketOffer) {
      const firstOffer = rollRandomLibertadoresBasket();
      onUpdateUser((prev) => {
        const norm = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
        if (norm.currentBasketOffer) return {};
        return {
          libertadoresState: {
            ...norm,
            currentBasketOffer: firstOffer,
          },
        };
      });
    }
  }, [isUnlocked, libState.currentBasketOffer, onUpdateUser]);

  // Chapter 3 strict 5-second per question countdown
  useEffect(() => {
    if (!quizStarted || libState.triviaCompleted || questionLocked) return;

    const startWall = performance.now();
    const durationMs = TRIVIA_SECONDS_PER_QUESTION * 1000;
    setTimeLeftMs(durationMs);

    const timerId = window.setInterval(() => {
      const elapsed = performance.now() - startWall;
      const remain = Math.max(0, durationMs - elapsed);
      setTimeLeftMs(remain);
      if (remain <= 0) {
        window.clearInterval(timerId);
        handleAnswerTrivia(-1);
      }
    }, 50);

    return () => window.clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, currentQIdx, questionLocked, libState.triviaCompleted]);

  const handleUnlockEarlyWithTicket = () => {
    soundService.playClick();
    if (unlockTicketsCount < 1) {
      showToast(
        'Bạn chưa có Vé Mở Khóa! Nhập code passticketadmin tại Cửa Hàng để nhận 1 Vé Mở Khóa.',
        'error'
      );
      return;
    }

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    fireGoldConfetti();
    const initialBasket = rollRandomLibertadoresBasket();

    onUpdateUser((prev) => {
      if ((prev.unlockTickets ?? 0) < 1) return {};
      const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
      return {
        unlockTickets: (prev.unlockTickets ?? 0) - 1,
        libertadoresState: {
          ...cur,
          unlockedEarly: true,
          currentBasketOffer: cur.currentBasketOffer ?? initialBasket,
        },
      };
    });

    showToast('Đã dùng 1 Vé Mở Khóa! Mở khóa sớm thành công sự kiện CONMEBOL Libertadores!');
  };

  // Chapter 1: Spin random basket machine
  const handleSpinBasketMachine = () => {
    if (isSpinningMachine) return;
    soundService.playClick();
    setIsSpinningMachine(true);

    const currentId = libState.currentBasketOffer?.id;
    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks += 1;
      setPreviewBasket(rollRandomLibertadoresBasket());
      if (ticks >= 10) {
        window.clearInterval(interval);
        const finalBasket = rollRandomLibertadoresBasket(currentId);
        setPreviewBasket(null);
        setIsSpinningMachine(false);
        soundService.playCoins();
        onUpdateUser((prev) => {
          const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
          return {
            libertadoresState: {
              ...cur,
              currentBasketOffer: finalBasket,
            },
          };
        });
      }
    }, 85);
  };

  // Chapter 1: Purchase current random basket with Libertadores Tokens
  const handlePurchaseBasket = () => {
    const offer = libState.currentBasketOffer;
    if (!offer || isSpinningMachine) return;
    soundService.playClick();

    if (offer.purchased) {
      showToast('Giỏ hàng này đã mua! Hãy bấm Quay Máy Random để làm mới giỏ hàng.', 'error');
      return;
    }

    if (libertadoresTokens < offer.costTokens) {
      showToast(
        `Không đủ Token CONMEBOL Libertadores! Cần thêm ${
          offer.costTokens - libertadoresTokens
        } Token (kiếm tại Chương Luyện Tập & Trivia).`,
        'error'
      );
      return;
    }

    soundService.playConfirmSelection();
    fireGoldConfetti();

    onUpdateUser((prev) => {
      const curTokens = prev.libertadoresTokens ?? 0;
      const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
      const activeOffer = cur.currentBasketOffer;
      if (!activeOffer || activeOffer.purchased || curTokens < activeOffer.costTokens) {
        return {};
      }

      return {
        libertadoresTokens: curTokens - activeOffer.costTokens,
        gems:
          activeOffer.rewardType === 'gems'
            ? prev.gems + activeOffer.rewardAmount
            : prev.gems,
        tickets:
          activeOffer.rewardType === 'tickets'
            ? (prev.tickets ?? 0) + activeOffer.rewardAmount
            : prev.tickets,
        coins:
          activeOffer.rewardType === 'coins'
            ? prev.coins + activeOffer.rewardAmount
            : prev.coins,
        libertadoresState: {
          ...cur,
          currentBasketOffer: {
            ...activeOffer,
            purchased: true,
          },
        },
      };
    });

    showToast(`Mua thành công: ${offer.label}!`);
  };

  // Chapter 2: Claim random 50-150 Libertadores Tokens after 3 daily Career matches (counts +1 toward Chapter 4 streak!)
  const handleRollTrainingReward = () => {
    if (isRollingTraining) return;
    soundService.playClick();

    if (libState.dailyTrainingClaimed) {
      showToast('Bạn đã nhận phần thưởng Luyện Tập hôm nay! Làm mới lúc 06:00 sáng.', 'error');
      return;
    }

    if (libState.dailyCareerMatches < CHAPTER_2_REQUIRED_CAREER_MATCHES) {
      showToast(
        `Hãy hoàn thành đủ ${CHAPTER_2_REQUIRED_CAREER_MATCHES} trận Đấu Sự Nghiệp hằng ngày (${libState.dailyCareerMatches}/${CHAPTER_2_REQUIRED_CAREER_MATCHES})!`,
        'error'
      );
      return;
    }

    setIsRollingTraining(true);
    let step = 0;
    const rollInterval = window.setInterval(() => {
      step += 1;
      const previewVal =
        Math.floor(
          Math.random() * (CHAPTER_2_MAX_RANDOM_TOKENS - CHAPTER_2_MIN_RANDOM_TOKENS + 1)
        ) + CHAPTER_2_MIN_RANDOM_TOKENS;
      setRollingNumberDisplay(previewVal);

      if (step >= 12) {
        window.clearInterval(rollInterval);
        const finalTokens =
          Math.floor(
            Math.random() * (CHAPTER_2_MAX_RANDOM_TOKENS - CHAPTER_2_MIN_RANDOM_TOKENS + 1)
          ) + CHAPTER_2_MIN_RANDOM_TOKENS;
        setRollingNumberDisplay(finalTokens);
        setIsRollingTraining(false);
        soundService.playPackOpenFanfare();
        fireGoldConfetti();

        onUpdateUser((prev) => {
          const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
          if (
            cur.dailyTrainingClaimed ||
            cur.dailyCareerMatches < CHAPTER_2_REQUIRED_CAREER_MATCHES
          ) {
            return {};
          }
          return {
            libertadoresTokens: (prev.libertadoresTokens ?? 0) + finalTokens,
            libertadoresState: {
              ...cur,
              dailyTrainingClaimed: true,
              lastTrainingRollAmount: finalTokens,
              totalTrainingRolls: cur.totalTrainingRolls + 1,
            },
          };
        });

        showToast(
          `Nhận thành công +${finalTokens} Token CONMEBOL Libertadores & +1 tiến độ Chuỗi Chương 4!`
        );
      }
    }, 75);
  };

  // Chapter 3: Start & Answer Trivia (5 questions, 5s each, +20 Token per right answer)
  const handleStartTrivia = () => {
    soundService.playClick();
    if (libState.triviaCompleted) {
      showToast('Bạn đã hoàn thành 5 câu hỏi Trivia hôm nay! Quay lại lúc 06:00 sáng mai.', 'error');
      return;
    }
    const startIndex = Math.min(4, libState.triviaAnsweredCount ?? 0);
    const savedIds = dailyQuestions.map((q) => q.id);
    onUpdateUser((prev) => {
      const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
      return {
        libertadoresState: {
          ...cur,
          triviaQuestionIds: savedIds,
        },
      };
    });
    setCurrentQIdx(startIndex);
    setSelectedOption(null);
    setQuestionLocked(false);
    setTimeLeftMs(TRIVIA_SECONDS_PER_QUESTION * 1000);
    setQuizStarted(true);
  };

  const handleAnswerTrivia = (optionIdx: number) => {
    if (questionLocked || libState.triviaCompleted) return;
    setQuestionLocked(true);
    setSelectedOption(optionIdx);

    const activeQ = dailyQuestions[currentQIdx];
    const isCorrect = optionIdx >= 0 && optionIdx === activeQ.correctIndex;
    const earned = isCorrect ? TRIVIA_TOKENS_PER_CORRECT : 0;

    if (isCorrect) {
      soundService.playCoins();
    } else {
      soundService.playClick();
    }

    const nextAnswered = currentQIdx + 1;
    const isLastQuestion = nextAnswered >= TRIVIA_QUESTIONS_PER_DAY;

    setSessionAnswers((prev) => [
      ...prev,
      optionIdx < 0 ? 'timeout' : isCorrect ? 'correct' : 'wrong',
    ]);

    onUpdateUser((prev) => {
      const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
      if (cur.triviaCompleted) return {};
      return {
        libertadoresTokens: (prev.libertadoresTokens ?? 0) + earned,
        libertadoresState: {
          ...cur,
          triviaQuestionIds: dailyQuestions.map((q) => q.id),
          triviaAnsweredCount: nextAnswered,
          triviaCorrectCount: cur.triviaCorrectCount + (isCorrect ? 1 : 0),
          triviaTokensEarned: cur.triviaTokensEarned + earned,
          triviaCompleted: isLastQuestion,
        },
      };
    });

    window.setTimeout(() => {
      if (isLastQuestion) {
        setQuizStarted(false);
        setQuestionLocked(false);
        if (isCorrect || libState.triviaCorrectCount > 0) {
          fireGoldConfetti();
        }
      } else {
        setCurrentQIdx((idx) => idx + 1);
        setSelectedOption(null);
        setQuestionLocked(false);
        setTimeLeftMs(TRIVIA_SECONDS_PER_QUESTION * 1000);
      }
    }, 1350);
  };

  // Chapter 4: Claim Milestone along Streak Track
  const handleClaimStreakMilestone = (rollsRequired: number) => {
    soundService.playClick();
    const milestone = LIBERTADORES_STREAK_MILESTONES.find(
      (m) => m.rollsRequired === rollsRequired
    );
    if (!milestone) return;

    if (libState.claimedStreakMilestones.includes(rollsRequired)) {
      showToast('Bạn đã nhận mốc phần thưởng này rồi!', 'error');
      return;
    }

    if (libState.totalTrainingRolls < rollsRequired) {
      showToast(
        `Cần đạt ${rollsRequired} lần random tại Chương 2 Luyện Tập (Hiện có ${libState.totalTrainingRolls}/${rollsRequired}).`,
        'error'
      );
      return;
    }

    soundService.playConfirmSelection();
    soundService.playPackOpenFanfare();
    fireGoldConfetti();

    const r = milestone.rewards;
    onUpdateUser((prev) => {
      const cur = normalizeLibertadoresState(prev.libertadoresState, getDaily6AMCycleKey());
      if (
        cur.claimedStreakMilestones.includes(rollsRequired) ||
        cur.totalTrainingRolls < rollsRequired
      ) {
        return {};
      }
      return {
        libertadoresTokens: (prev.libertadoresTokens ?? 0) + (r.libertadoresTokens ?? 0),
        gems: prev.gems + (r.gems ?? 0),
        coins: prev.coins + (r.coins ?? 0),
        tickets: (prev.tickets ?? 0) + (r.tickets ?? 0),
        libertadoresState: {
          ...cur,
          claimedStreakMilestones: [...cur.claimedStreakMilestones, rollsRequired],
        },
      };
    });

    if (r.southAmericaPack90Plus) {
      onOpenPackTier(
        'CONMEBOL_SOUTH_AMERICA_90_PLUS',
        'MỐC 10 CHUỖI CONMEBOL · CẦU THỦ NAM MỸ 90+'
      );
      return;
    }

    showToast(`Nhận mốc ${milestone.title}: ${milestone.rewardSummary}!`);
  };

  // Chapter 4: Purchase 90+ South American Player Pack (300 Libertadores Tokens)
  const handleOpenSouthAmericaPack = () => {
    soundService.playClick();
    if (libertadoresTokens < SOUTH_AMERICA_90_PACK_COST_TOKENS) {
      showToast(
        `Không đủ Token CONMEBOL Libertadores! Cần ${SOUTH_AMERICA_90_PACK_COST_TOKENS} Token (Hiện có ${libertadoresTokens}).`,
        'error'
      );
      return;
    }

    soundService.playPackTear();
    onUpdateUser((prev) => {
      const curTokens = prev.libertadoresTokens ?? 0;
      if (curTokens < SOUTH_AMERICA_90_PACK_COST_TOKENS) return {};
      return {
        libertadoresTokens: curTokens - SOUTH_AMERICA_90_PACK_COST_TOKENS,
      };
    });

    onOpenPackTier(
      'CONMEBOL_SOUTH_AMERICA_90_PLUS',
      'PACK CẦU THỦ NAM MỸ 90+ · CONMEBOL LIBERTADORES'
    );
  };

  // Optional byte-for-byte untouched uploader for user's original PNG / ZIP files
  const handleSyncOriginalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingAssets(true);
    let synced = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Read error'));
          reader.readAsDataURL(file);
        });
        const resp = await fetch('/api/libertadores-assets/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, dataBase64 }),
        });
        const json = await resp.json();
        if (json?.ok) {
          synced += typeof json.zipImported === 'number' ? json.zipImported : 1;
        }
      } catch {
        // ignore single file failure
      }
    }

    await refreshLibertadoresAssetsStatus();
    setIsUploadingAssets(false);
    e.target.value = '';
    if (synced > 0) {
      soundService.playCoins();
      showToast(`Đã đồng bộ nguyên bản ${synced} tệp ảnh gốc CONMEBOL Libertadores!`);
    } else {
      showToast('Không tìm thấy tên tệp khớp quy tắc ảnh CONMEBOL Libertadores.', 'error');
    }
  };

  const chapterBgUrl =
    activeChapter === 'main'
      ? getAsset('bgMain')
      : activeChapter === 'training'
      ? getAsset('bgChapter2')
      : activeChapter === 'trivia'
      ? getAsset('bgChapter3')
      : getAsset('bgRewards');

  const displayedBasket = previewBasket ?? libState.currentBasketOffer;

  const getBasketCurrencyIcon = (type: 'gems' | 'tickets' | 'coins') => {
    if (type === 'gems') return '/assets/aistudio/currencysmall_CASH_b2121428.png';
    if (type === 'tickets') {
      return '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png';
    }
    return '/assets/aistudio/currencysmall_COIN_ec777114.png';
  };

  return (
    <div
      className={
        embedded
          ? 'relative w-full h-full bg-[#060503] text-[#fdf6df] flex flex-col overflow-hidden select-none font-cruyff'
          : 'fixed inset-0 z-50 bg-[#060503] text-[#fdf6df] flex flex-col overflow-hidden select-none font-cruyff'
      }
    >
      {/* Hidden input for optional byte-for-byte untouched PNG/MP4/MP3/ZIP sync */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.mp4,.mp3,.zip"
        multiple
        onChange={handleSyncOriginalFiles}
        className="hidden"
      />

      {/* Full-bleed Untouched Chapter / Entrance Background (Zero Overlay / Zero Filter) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={isUnlocked ? chapterBgUrl : getAsset('bgMain')}
          alt="CONMEBOL Libertadores Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Toast Notification (Metallic Gold / Bronze) */}
      {notice && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 border-2 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_10px_35px_rgba(0,0,0,0.9)] ${
            notice.kind === 'gold'
              ? 'bg-[#1c1306] border-[#e6c35c] text-[#fbe59b]'
              : 'bg-[#260b0b] border-amber-500/80 text-amber-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* TOP CONMEBOL LIBERTADORES HEADER BAR */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2.5 bg-[#090704]/95 border-b border-[#d4af37]/45">
        <div className="flex items-center gap-3 min-w-0">
          {!embedded && (
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1a1207] hover:bg-[#2b1e0c] border border-[#d4af37]/60 text-[#f5d97e] font-cruyff font-black text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>TRỞ LẠI</span>
            </button>
          )}

          <img
            src={getAsset('eventLogo')}
            alt="CONMEBOL Libertadores"
            className="h-9 sm:h-11 w-auto object-contain shrink-0 pointer-events-none"
          />

          <div className="min-w-0">
            <h1 className="font-cruyff font-black text-base sm:text-xl text-white uppercase tracking-wider leading-none truncate">
              CONMEBOL LIBERTADORES
            </h1>
            <span className="text-[10px] sm:text-xs font-bold text-[#e5c158] uppercase tracking-widest block mt-0.5 truncate">
              LA GLORIA ETERNA · SỰ KIỆN NAM MỸ
            </span>
          </div>
        </div>

        {/* Currencies & Sync Strip */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Token CONMEBOL Libertadores */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1b1307] border border-[#e5c158]/75"
            title="Token CONMEBOL Libertadores"
          >
            <img
              src={getAsset('tokenSmall')}
              alt="Token Libertadores"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
              }}
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="font-mono font-black text-xs sm:text-sm text-[#fbe59b] tabular-nums">
              {libertadoresTokens.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold uppercase text-[#d4af37] hidden sm:inline">
              TOKEN
            </span>
          </div>

          {/* Vé Mở Khóa Trước Sự Kiện */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1b1307] border border-[#d4af37]/65"
            title="Vé Mở Khóa Trước Sự Kiện"
          >
            <img
              src={getAsset('unlockTicket')}
              alt="Vé Mở Khóa"
              className="w-6 h-5 object-contain shrink-0"
            />
            <span className="font-mono font-black text-xs sm:text-sm text-[#fff1b8] tabular-nums">
              {unlockTicketsCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold uppercase text-[#d4af37] hidden md:inline">
              VÉ MỞ KHÓA
            </span>
          </div>

          {/* Kim Cương */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#120d06] border border-[#d4af37]/35">
            <img
              src="/assets/aistudio/currencysmall_CASH_b2121428.png"
              alt="Kim Cương"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="font-mono font-bold text-xs text-white tabular-nums">
              {user.gems.toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Vé Quay */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#120d06] border border-[#d4af37]/35">
            <img
              src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
              alt="Vé Quay"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="font-mono font-bold text-xs text-white tabular-nums">
              {(user.tickets ?? 0).toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Xu */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#120d06] border border-[#d4af37]/35">
            <img
              src="/assets/aistudio/currencysmall_COIN_ec777114.png"
              alt="Xu"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="font-mono font-bold text-xs text-[#f5d97e] tabular-nums">
              {user.coins.toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Untouched PNG / MP4 / MP3 / ZIP Sync Trigger */}
          <button
            type="button"
            disabled={isUploadingAssets}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1207] hover:bg-[#2c1f0c] border border-[#d4af37]/50 text-[10px] font-bold uppercase text-[#e5c158] cursor-pointer transition-colors"
            title="Đồng bộ nguyên bản tệp gốc PNG / MP4 / MP3 / ZIP CONMEBOL Libertadores (không chỉnh sửa)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">
              {isUploadingAssets ? 'ĐANG TẢI...' : 'FILE GỐC'}
            </span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* PRE-11/11 EARLY UNLOCK GATE SCREEN (WHEN LOCKED)                       */}
      {/* ===================================================================== */}
      {!isUnlocked ? (
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 border-2 border-[#d4af37]/75 bg-[#0c0905]/85 overflow-hidden">
            {/* Left Entrance Poster (Untouched Aspect Ratio, Zero Filter) */}
            <div className="md:col-span-5 bg-[#070503]/80 border-b md:border-b-0 md:border-r border-[#d4af37]/40 p-5 flex flex-col items-center justify-center relative">
              <img
                src={getAsset('entranceBanner')}
                alt="CONMEBOL Libertadores Entrance"
                className="w-full max-w-[260px] h-auto object-contain"
              />
              <div className="mt-3 px-3 py-1 bg-[#1e1508] border border-[#d4af37]/65 text-[11px] font-mono font-black uppercase tracking-widest text-[#fbe59b] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#e5c158]" />
                <span>MỞ KHÓA CHÍNH THỨC: 11/11</span>
              </div>
            </div>

            {/* Right Early Unlock Controls */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#241909] border border-[#d4af37]/60 text-xs font-mono font-bold uppercase tracking-widest text-[#f5d97e]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    TỰ ĐỘNG MỞ SAU: {formatCountdownToTargetMs(officialUnlockMs, nowMs)}
                  </span>
                </div>

                <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                  SỰ KIỆN CONMEBOL LIBERTADORES
                </h2>

                <p className="text-xs sm:text-sm text-[#e8dcc2] leading-relaxed">
                  Sự kiện chính thức mở khóa vào lúc <strong className="text-[#fbe59b]">00:00 ngày 11/11</strong>.
                  Huấn Luyện Viên sở hữu <strong className="text-[#fbe59b]">Vé Mở Khóa</strong> có thể mở khóa
                  trước toàn bộ <strong className="text-[#fbe59b]">4 chương sự kiện</strong> ngay lập tức:
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 bg-[#140e06] border border-[#d4af37]/35">
                    <div className="font-black text-[#fbe59b] uppercase">1. CHƯƠNG CHÍNH</div>
                    <div className="text-[#cbb994] text-[11px] mt-0.5">
                      Máy quay random giỏ Kim Cương, Vé Quay, Xu &amp; Sự kiện nổi bật
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#140e06] border border-[#d4af37]/35">
                    <div className="font-black text-[#fbe59b] uppercase">2. LUYỆN TẬP</div>
                    <div className="text-[#cbb994] text-[11px] mt-0.5">
                      Đá 3 trận Sự Nghiệp/ngày nhận random 50–150 Token &amp; tích chuỗi
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#140e06] border border-[#d4af37]/35">
                    <div className="font-black text-[#fbe59b] uppercase">3. TRIVIA 5 GIÂY</div>
                    <div className="text-[#cbb994] text-[11px] mt-0.5">
                      5 câu hỏi lịch sử Libertadores mỗi ngày (+20 Token/câu)
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#140e06] border border-[#d4af37]/35">
                    <div className="font-black text-[#fbe59b] uppercase">4. PHẦN THƯỞNG</div>
                    <div className="text-[#cbb994] text-[11px] mt-0.5">
                      Chuỗi mốc từ Chương 2 &amp; Pack Cầu Thủ Nam Mỹ 90+ (300 Token)
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Balance & Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-[#d4af37]/30">
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#171006] border border-[#d4af37]/50">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getAsset('unlockTicket')}
                      alt="Vé Mở Khóa"
                      className="w-9 h-7 object-contain shrink-0"
                    />
                    <div>
                      <div className="text-xs font-black uppercase text-[#fbe59b]">
                        VÉ MỞ KHÓA TRƯỚC SỰ KIỆN
                      </div>
                      <div className="text-[11px] text-[#cbb994]">
                        Yêu cầu mở sớm: 1 Vé Mở Khóa
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-black text-base px-2.5 py-0.5 border ${
                      unlockTicketsCount >= 1
                        ? 'bg-[#2b1f0a] border-[#f5d97e] text-[#fbe59b]'
                        : 'bg-black/70 border-white/20 text-gray-400'
                    }`}
                  >
                    {unlockTicketsCount} / 1
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleUnlockEarlyWithTicket}
                  className={`w-full py-3.5 px-5 font-cruyff font-black text-sm sm:text-base uppercase tracking-wider border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                    unlockTicketsCount >= 1
                      ? 'bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] hover:brightness-110 border-[#fff3bd] text-[#120c04] shadow-[0_0_28px_rgba(230,195,92,0.45)] active:scale-[0.99]'
                      : 'bg-[#1c1409] hover:bg-[#261b0c] border-[#d4af37]/45 text-[#d4af37]'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  <span>MỞ KHÓA SỚM NGAY (1 VÉ MỞ KHÓA)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onGoToShopGiftcode();
                  }}
                  className="w-full py-2.5 px-4 bg-[#120d06] hover:bg-[#1f160a] border border-[#d4af37]/45 text-xs font-cruyff font-bold uppercase tracking-wider text-[#f5d97e] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>ĐẾN CỬA HÀNG · NHẬP GIFTCODE NHẬN VÉ MỞ KHÓA</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ================================================================= */}
          {/* 4 CHAPTER NAVIGATION TABS (CHÍNH · LUYỆN TẬP · TRIVIA · PHẦN THƯỞNG) */}
          {/* ================================================================= */}
          <nav className="relative z-20 grid grid-cols-2 sm:grid-cols-4 border-b border-[#d4af37]/50 divide-x divide-y sm:divide-y-0 divide-[#d4af37]/35 bg-[#0d0904]/95 shrink-0">
            {(
              [
                {
                  id: 'main',
                  num: 'CHƯƠNG 01',
                  label: 'CHÍNH',
                  badge: libState.currentBasketOffer && !libState.currentBasketOffer.purchased ? 'GIỎ HÀNG' : undefined,
                },
                {
                  id: 'training',
                  num: 'CHƯƠNG 02',
                  label: 'LUYỆN TẬP',
                  badge:
                    !libState.dailyTrainingClaimed &&
                    libState.dailyCareerMatches >= CHAPTER_2_REQUIRED_CAREER_MATCHES
                      ? 'NHẬN QUÀ'
                      : `${Math.min(CHAPTER_2_REQUIRED_CAREER_MATCHES, libState.dailyCareerMatches)}/${CHAPTER_2_REQUIRED_CAREER_MATCHES}`,
                },
                {
                  id: 'trivia',
                  num: 'CHƯƠNG 03',
                  label: 'TRIVIA',
                  badge: libState.triviaCompleted ? 'ĐÃ XONG' : '5 CÂU',
                },
                {
                  id: 'rewards',
                  num: 'CHƯƠNG 04',
                  label: 'PHẦN THƯỞNG',
                  badge: `CHUỖI ${libState.totalTrainingRolls}`,
                },
              ] as Array<{
                id: LibertadoresChapterId;
                num: string;
                label: string;
                badge?: string;
              }>
            ).map((tab) => {
              const active = activeChapter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundService.playTabSwitch();
                    setActiveChapter(tab.id);
                  }}
                  className={`py-3 px-4 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-t from-[#3b280c] via-[#211607] to-[#120c04] border-b-2 border-b-[#f5d97e] text-[#fff4cc]'
                      : 'text-[#bfa77a] hover:text-white hover:bg-[#1a1207]/80'
                  }`}
                >
                  <div className="text-left">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#d4af37]">
                      {tab.num}
                    </span>
                    <span className="font-cruyff font-black text-sm sm:text-base uppercase tracking-wider">
                      {tab.label}
                    </span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-black uppercase border ${
                        active
                          ? 'bg-[#e6c35c] text-[#120c04] border-[#fff3bd]'
                          : 'bg-[#191208] text-[#e5c158] border-[#d4af37]/45'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ================================================================= */}
          {/* CHAPTER CONTENT BODY                                              */}
          {/* ================================================================= */}
          <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
              {/* ------------------------------------------------------------- */}
              {/* CHƯƠNG 1: CHÍNH (MÁY QUAY RANDOM GIỎ HÀNG + SỰ KIỆN NỔI BẬT)   */}
              {/* ------------------------------------------------------------- */}
              {activeChapter === 'main' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left 7 Cols: Random Basket Spin Machine */}
                  <div className="lg:col-span-7 border-2 border-[#d4af37]/75 bg-[#0d0904]/72 p-5 sm:p-6 flex flex-col justify-between gap-5">
                    <div className="flex items-start justify-between gap-3 border-b border-[#d4af37]/35 pb-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAsset('tokenLarge')}
                          alt="CONMEBOL Token"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = LIBERTADORES_TOKEN_LARGE_FALLBACK;
                          }}
                          className="w-12 h-12 object-contain shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158] block">
                            CHƯƠNG CHÍNH · VÒNG QUAY THƯƠNG GIA NAM MỸ
                          </span>
                          <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                            MÁY QUAY GIỎ HÀNG RANDOM
                          </h2>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-[#1e1508] border border-[#d4af37]/60 font-mono text-[11px] font-bold text-[#fbe59b]">
                        KIM CƯƠNG · VÉ QUAY · XU
                      </span>
                    </div>

                    {/* Slot / Machine Display Screen */}
                    <div className="relative border-2 border-[#e6c35c]/80 bg-gradient-to-b from-[#1e1508] via-[#0c0804] to-[#1a1207] p-5 flex flex-col items-center justify-center text-center min-h-[230px]">
                      {/* 3 Category Indicator Lamps */}
                      <div className="grid grid-cols-3 gap-2 w-full max-w-md mb-4">
                        {(
                          [
                            { id: 'gems', label: 'KIM CƯƠNG' },
                            { id: 'tickets', label: 'VÉ QUAY' },
                            { id: 'coins', label: 'COIN (XU)' },
                          ] as const
                        ).map((lamp) => {
                          const lit = displayedBasket?.rewardType === lamp.id;
                          return (
                            <div
                              key={lamp.id}
                              className={`py-1 px-2 border text-[10px] font-mono font-black uppercase tracking-wider transition-all ${
                                lit
                                  ? 'bg-[#e6c35c] text-[#120c04] border-[#fff5c2] shadow-[0_0_16px_rgba(230,195,92,0.65)]'
                                  : 'bg-[#120c05] text-[#8f7952] border-[#d4af37]/25'
                              }`}
                            >
                              {lamp.label}
                            </div>
                          );
                        })}
                      </div>

                      {displayedBasket ? (
                        <div
                          className={`flex flex-col items-center gap-2.5 transition-transform ${
                            isSpinningMachine ? 'scale-95 opacity-85' : 'scale-100'
                          }`}
                        >
                          <div className="w-20 h-20 bg-[#140e06] border-2 border-[#d4af37]/75 flex items-center justify-center p-2.5 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                            <img
                              src={getBasketCurrencyIcon(displayedBasket.rewardType)}
                              alt={displayedBasket.label}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="font-cruyff font-black text-lg sm:text-xl text-[#fff4cc] uppercase tracking-wide">
                            {displayedBasket.label}
                          </div>

                          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#261b0a] border border-[#e5c158]/75">
                            <span className="text-xs uppercase font-bold text-[#e5c158]">
                              GIÁ GIỎ HÀNG:
                            </span>
                            <img
                              src={getAsset('tokenSmall')}
                              alt="Token"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                              }}
                              className="w-4 h-4 object-contain"
                            />
                            <span className="font-mono font-black text-sm text-[#fbe59b] tabular-nums">
                              {displayedBasket.costTokens} TOKEN
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-[#cbb994]">
                          Nhấn nút Quay Random bên dưới để hiển thị giỏ hàng ưu đãi!
                        </div>
                      )}
                    </div>

                    {/* Spin & Purchase Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isSpinningMachine}
                        onClick={handleSpinBasketMachine}
                        className="py-3.5 px-4 bg-[#1d1408] hover:bg-[#2b1e0c] border-2 border-[#d4af37]/80 text-[#fbe59b] font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${isSpinningMachine ? 'animate-spin' : ''}`}
                        />
                        <span>
                          {isSpinningMachine ? 'ĐANG QUAY GIỎ HÀNG...' : 'QUAY RANDOM GIỎ HÀNG MỚI'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={
                          isSpinningMachine ||
                          !libState.currentBasketOffer ||
                          libState.currentBasketOffer.purchased
                        }
                        onClick={handlePurchaseBasket}
                        className={`py-3.5 px-4 border-2 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          libState.currentBasketOffer?.purchased
                            ? 'bg-[#161109] border-white/15 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] hover:brightness-110 border-[#fff3bd] text-[#120c04] cursor-pointer shadow-[0_0_24px_rgba(230,195,92,0.35)]'
                        }`}
                      >
                        {libState.currentBasketOffer?.purchased ? (
                          <span>ĐÃ MUA GIỎ HÀNG NÀY</span>
                        ) : (
                          <>
                            <span>MUA GIỎ HÀNG</span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <img
                                src={getAsset('tokenSmall')}
                                alt=""
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                                }}
                                className="w-4 h-4 object-contain"
                              />
                              {libState.currentBasketOffer?.costTokens ?? 0}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right 5 Cols: Untouched Entrance Banner Showcase + Featured Events Button */}
                  <div className="lg:col-span-5 border-2 border-[#d4af37]/65 bg-[#0d0904]/72 p-5 sm:p-6 flex flex-col justify-between gap-4">
                    <div className="flex flex-col items-center text-center border-b border-[#d4af37]/30 pb-4">
                      <img
                        src={getAsset('entranceBanner')}
                        alt="Entrance CONMEBOL Libertadores"
                        className="h-44 sm:h-52 w-auto object-contain"
                      />
                      <p className="text-xs text-[#dfd0b0] mt-3 leading-relaxed">
                        Thu thập <strong className="text-[#fbe59b]">Token CONMEBOL Libertadores</strong> mỗi ngày
                        từ Chương Luyện Tập (50–150 Token) và Chương Trivia (tối đa 100 Token) để mua giỏ tài nguyên
                        và mở Pack Cầu Thủ Nam Mỹ 90+!
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                        <div className="p-2.5 bg-[#161006]/85 border border-[#d4af37]/35">
                          <span className="block text-[10px] text-[#bfa77a] uppercase">
                            CHUỖI RANDOM CHƯƠNG 2
                          </span>
                          <span className="text-base font-black text-[#fbe59b]">
                            {libState.totalTrainingRolls} LẦN
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#161006]/85 border border-[#d4af37]/35">
                          <span className="block text-[10px] text-[#bfa77a] uppercase">
                            LÀM MỚI HẰNG NGÀY
                          </span>
                          <span className="text-base font-black text-[#e5c158]">
                            {getCountdownToNext6AM(new Date(nowMs))}
                          </span>
                        </div>
                      </div>

                      {/* Button to display other featured events */}
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setShowFeaturedDrawer(true);
                        }}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#2c1e0a] via-[#473010] to-[#2c1e0a] hover:brightness-115 border-2 border-[#f5d97e] text-[#fff4cc] font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-[#f5d97e]" />
                          <span>HIỂN THỊ CÁC SỰ KIỆN NỔI BẬT KHÁC</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#f5d97e]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          onNavigateFeaturedEvent('shop_conmebol');
                        }}
                        className="w-full py-2.5 px-4 bg-[#171006]/90 hover:bg-[#241909] border border-[#d4af37]/60 text-[#fbe59b] font-cruyff font-bold text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                      >
                        <span>SIÊU GÓI CONMEBOL 2 (30.000 GEMS) &amp; 100 TOKEN (3.000 GEMS)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* CHƯƠNG 2: LUYỆN TẬP (3 TRẬN SỰ NGHIỆP -> RANDOM 50-150 TOKEN) */}
              {/* ------------------------------------------------------------- */}
              {activeChapter === 'training' && (
                <div className="max-w-4xl mx-auto space-y-5">
                  <div className="border-2 border-[#d4af37]/75 bg-[#0c0904]/72 p-5 sm:p-7 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/35 pb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158] block">
                          CHƯƠNG 02 · NHIỆM VỤ HẰNG NGÀY (RESET 06:00 SÁNG)
                        </span>
                        <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase tracking-wide mt-0.5">
                          LUYỆN TẬP CONMEBOL LIBERTADORES
                        </h2>
                      </div>
                      <div className="px-3 py-1.5 bg-[#1b1307] border border-[#d4af37]/60 font-mono text-xs font-bold text-[#fbe59b]">
                        LÀM MỚI SAU: {getCountdownToNext6AM(new Date(nowMs))}
                      </div>
                    </div>

                    {/* 3 Daily Match Quest Frames + Reward Frame Using Untouched `khung nhiệm vụ.png` at Exact Proportions */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {[1, 2, 3].map((matchIndex) => {
                        const completed = libState.dailyCareerMatches >= matchIndex;
                        return (
                          <div
                            key={matchIndex}
                            className="relative w-full aspect-[142/106] flex flex-col items-center justify-center p-3"
                          >
                            <img
                              src={getAsset('questFrame')}
                              alt={`Nhiệm vụ trận ${matchIndex}`}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                            />
                            <img
                              src={getAsset('eventLogo')}
                              alt="CONMEBOL Libertadores"
                              className="relative z-10 w-10 h-10 object-contain"
                            />
                            <span className="relative z-10 mt-1 font-cruyff font-black text-xs uppercase text-white">
                              TRẬN SỰ NGHIỆP {matchIndex}/3
                            </span>
                            <span
                              className={`relative z-10 mt-0.5 text-[10px] font-mono font-bold uppercase ${
                                completed ? 'text-emerald-300' : 'text-[#fbe59b]'
                              }`}
                            >
                              {completed ? 'ĐÃ HOÀN THÀNH ✓' : 'CHƯA ĐÁ'}
                            </span>
                          </div>
                        );
                      })}

                      {/* 4th Untouched Quest Frame: Random 50-150 Token Reward */}
                      <div className="relative w-full aspect-[142/106] flex flex-col items-center justify-center p-3">
                        <img
                          src={getAsset('questFrame')}
                          alt="Phần thưởng nhiệm vụ"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                        />
                        <img
                          src={getAsset('tokenLarge')}
                          alt="Token CONMEBOL Libertadores"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = LIBERTADORES_TOKEN_LARGE_FALLBACK;
                          }}
                          className="relative z-10 w-11 h-11 object-contain"
                        />
                        <span className="relative z-10 mt-1 font-mono font-black text-xs text-[#fbe59b] tabular-nums">
                          {isRollingTraining
                            ? `+${rollingNumberDisplay} TOKEN`
                            : libState.dailyTrainingClaimed && libState.lastTrainingRollAmount
                            ? `ĐÃ NHẬN +${libState.lastTrainingRollAmount}`
                            : '50 – 150 TOKEN'}
                        </span>
                        <span className="relative z-10 text-[10px] font-bold uppercase text-white/85">
                          +1 CHUỖI CHƯƠNG 4
                        </span>
                      </div>
                    </div>

                    {/* Quest Description, Progress Bar & Action */}
                    <div className="p-4 sm:p-5 bg-[#0e0a05]/80 border border-[#d4af37]/50 flex flex-col md:flex-row items-center justify-between gap-5">
                      <div className="flex-1 w-full">
                        <div className="font-cruyff font-black text-lg sm:text-xl text-white uppercase tracking-wide">
                          CHƠI 3 TRẬN ĐẤU HẰNG NGÀY SỰ NGHIỆP
                        </div>
                        <p className="text-xs sm:text-sm text-[#e5d6b5] mt-1">
                          Hoàn thành 3 trận Đấu Sự Nghiệp trong ngày để mở lượt quay ngẫu nhiên{' '}
                          <strong className="text-[#fbe59b]">50–150 Token CONMEBOL Libertadores</strong>.
                          Mỗi lần nhận random được tính <strong className="text-[#fbe59b]">+1 vào chuỗi Chương 4</strong>!
                        </p>
                        <div className="mt-3 max-w-md">
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#fbe59b] mb-1">
                            <span>TIẾN ĐỘ HÔM NAY</span>
                            <span>
                              {Math.min(
                                CHAPTER_2_REQUIRED_CAREER_MATCHES,
                                libState.dailyCareerMatches
                              )}{' '}
                              / {CHAPTER_2_REQUIRED_CAREER_MATCHES} TRẬN
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-black/80 border border-[#d4af37]/45 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#b8841e] to-[#fbe59b] transition-all duration-300"
                              style={{
                                width: `${
                                  (Math.min(
                                    CHAPTER_2_REQUIRED_CAREER_MATCHES,
                                    libState.dailyCareerMatches
                                  ) /
                                    CHAPTER_2_REQUIRED_CAREER_MATCHES) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2.5 shrink-0 min-w-[220px] w-full md:w-auto">
                        {libState.dailyTrainingClaimed ? (
                          <button
                            type="button"
                            onClick={() => setActiveChapter('rewards')}
                            className="w-full py-3 px-4 bg-[#1c1408] hover:bg-[#2a1e0c] border border-[#d4af37]/65 text-xs font-cruyff font-black uppercase tracking-wider text-[#fbe59b] cursor-pointer"
                          >
                            XEM CHUỖI CHƯƠNG 4 ({libState.totalTrainingRolls}) →
                          </button>
                        ) : libState.dailyCareerMatches >= CHAPTER_2_REQUIRED_CAREER_MATCHES ? (
                          <button
                            type="button"
                            disabled={isRollingTraining}
                            onClick={handleRollTrainingReward}
                            className="w-full py-3.5 px-5 bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] hover:brightness-110 border-2 border-[#fff3bd] text-[#120c04] font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                          >
                            {isRollingTraining
                              ? 'ĐANG QUAY SỐ...'
                              : 'QUAY NHẬN 50–150 TOKEN'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              soundService.playClick();
                              onGoToCareer();
                            }}
                            className="w-full py-3.5 px-5 bg-gradient-to-r from-[#2c1e0a] via-[#473010] to-[#2c1e0a] hover:brightness-115 border-2 border-[#f5d97e] text-[#fff4cc] font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                          >
                            ĐẾN ĐẤU SỰ NGHIỆP NGAY →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Footer Linkage Summary */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#150f06]/85 border border-[#d4af37]/40 text-xs">
                      <span className="text-[#dfd0b0]">
                        Tổng số lần Random Chương 2 đã tích lũy vào{' '}
                        <strong className="text-[#fbe59b]">Chuỗi Phần Thưởng Chương 4</strong>:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setActiveChapter('rewards');
                        }}
                        className="px-3 py-1 bg-[#261a09] hover:bg-[#38270e] border border-[#e5c158] font-mono font-black text-[#fbe59b] uppercase cursor-pointer"
                      >
                        {libState.totalTrainingRolls} LẦN RANDOM · XEM MỐC →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* CHƯƠNG 3: TRIVIA (5 CÂU HỎI / NGÀY · 5 GIÂY / CÂU · 20 TOKEN) */}
              {/* ------------------------------------------------------------- */}
              {activeChapter === 'trivia' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Untouched Intro Banner (`ảnh giới thiệu chương 3.png`) */}
                  <div className="border-2 border-[#d4af37]/70 bg-[#0b0804]/75 flex items-center justify-center overflow-hidden">
                    <img
                      src={getAsset('triviaIntroBanner')}
                      alt="Extra Time: Trivia Time CONMEBOL Libertadores"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>

                  {/* Trivia Interactive Panel */}
                  <div className="border-2 border-[#d4af37]/75 bg-[#0d0904]/75 p-5 sm:p-6">
                    {!quizStarted ? (
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={getAsset('minigameLogo')}
                            alt="Minigame CONMEBOL Libertadores"
                            className="w-20 h-20 object-contain shrink-0"
                          />
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158] block">
                              MINIGAME CÂU HỎI HẰNG NGÀY · CONMEBOL LIBERTADORES
                            </span>
                            <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase">
                              THỬ THÁCH TRÍ TUỆ NAM MỸ (5 GIÂY / CÂU)
                            </h3>
                            <p className="text-xs sm:text-sm text-[#dfd0b0] max-w-xl">
                              Trả lời <strong className="text-[#fbe59b]">5 câu hỏi mỗi ngày</strong> về các mùa giải
                              CONMEBOL Libertadores. Mỗi câu có đúng{' '}
                              <strong className="text-[#fbe59b]">5 giây suy nghĩ</strong> và thưởng ngay{' '}
                              <strong className="text-[#fbe59b]">+20 Token CONMEBOL Libertadores</strong> khi trả lời đúng!
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2.5 shrink-0 min-w-[220px]">
                          <div className="w-full px-3.5 py-2 bg-[#171006] border border-[#d4af37]/50 text-center font-mono text-xs">
                            <span className="block text-[10px] text-[#bfa77a] uppercase">
                              KẾT QUẢ HÔM NAY
                            </span>
                            <span className="font-black text-sm text-[#fbe59b]">
                              {libState.triviaCorrectCount}/{TRIVIA_QUESTIONS_PER_DAY} ĐÚNG · +
                              {libState.triviaTokensEarned} TOKEN
                            </span>
                          </div>

                          {libState.triviaCompleted ? (
                            <div className="w-full py-3 px-4 bg-[#191208] border border-[#d4af37]/40 text-center font-cruyff font-bold text-xs uppercase text-[#bfa77a]">
                              HOÀN THÀNH HÔM NAY · RESET {getCountdownToNext6AM(new Date(nowMs))}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleStartTrivia}
                              className="w-full py-3.5 px-5 bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] hover:brightness-110 border-2 border-[#fff3bd] text-[#120c04] font-cruyff font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_0_24px_rgba(230,195,92,0.4)]"
                            >
                              {libState.triviaAnsweredCount > 0
                                ? `TIẾP TỤC CÂU ${libState.triviaAnsweredCount + 1}/5`
                                : 'BẮT ĐẦU 5 CÂU HỎI NGAY'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Active 5-Second Timed Question View */
                      (() => {
                        const q = dailyQuestions[currentQIdx] || dailyQuestions[0];
                        const pct = Math.max(
                          0,
                          Math.min(100, (timeLeftMs / (TRIVIA_SECONDS_PER_QUESTION * 1000)) * 100)
                        );
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={getAsset('minigameLogo')}
                                  alt=""
                                  className="w-9 h-9 object-contain"
                                />
                                <span className="font-cruyff font-black text-sm sm:text-base uppercase text-[#fbe59b]">
                                  CÂU HỎI {currentQIdx + 1} / {TRIVIA_QUESTIONS_PER_DAY} · +
                                  {TRIVIA_TOKENS_PER_CORRECT} TOKEN
                                </span>
                              </div>
                              <div
                                className={`px-3 py-1 border font-mono font-black text-sm tabular-nums ${
                                  timeLeftMs <= 2000
                                    ? 'bg-[#3a1208] border-amber-400 text-amber-200 animate-pulse'
                                    : 'bg-[#1c1407] border-[#e6c35c] text-[#fbe59b]'
                                }`}
                              >
                                {(timeLeftMs / 1000).toFixed(1)}s / 5.0s
                              </div>
                            </div>

                            {/* 5-Second Countdown Bar */}
                            <div className="w-full h-2.5 bg-black border border-[#d4af37]/45 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#9e6b12] via-[#e6c35c] to-[#fff2b2] transition-all duration-75"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="p-4 bg-[#161006] border border-[#d4af37]/50">
                              <p className="font-cruyff font-bold text-base sm:text-lg text-white leading-snug">
                                {q.question}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {q.options.map((opt, idx) => {
                                const isRightOpt = idx === q.correctIndex;
                                const isPicked = selectedOption === idx;
                                let btnClass =
                                  'bg-[#150f06] hover:bg-[#261b0a] border-[#d4af37]/55 text-[#fdf6df]';
                                if (questionLocked) {
                                  if (isRightOpt) {
                                    btnClass =
                                      'bg-[#2e2208] border-[#fbe59b] text-[#fff6cc] ring-2 ring-[#fbe59b]';
                                  } else if (isPicked) {
                                    btnClass =
                                      'bg-[#2b0f0c] border-amber-600/80 text-amber-200 opacity-90';
                                  } else {
                                    btnClass =
                                      'bg-[#0f0b05] border-white/10 text-gray-500 opacity-65';
                                  }
                                }

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    disabled={questionLocked}
                                    onClick={() => handleAnswerTrivia(idx)}
                                    className={`p-3.5 border-2 text-left font-cruyff font-bold text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${btnClass}`}
                                  >
                                    <span>
                                      <strong className="text-[#e5c158] mr-2 font-mono">
                                        {String.fromCharCode(65 + idx)}.
                                      </strong>
                                      {opt}
                                    </span>
                                    {questionLocked && isRightOpt && (
                                      <CheckCircle2 className="w-4 h-4 text-[#fbe59b] shrink-0" />
                                    )}
                                    {questionLocked && isPicked && !isRightOpt && (
                                      <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {questionLocked && (
                              <div className="p-3 bg-[#1b1307] border border-[#e5c158]/65 text-xs text-[#fbe59b]">
                                {selectedOption === -1 ? (
                                  <strong>Hết 5 giây! </strong>
                                ) : selectedOption === q.correctIndex ? (
                                  <strong>Chính xác (+20 Token)! </strong>
                                ) : (
                                  <strong>Chưa chính xác! </strong>
                                )}
                                <span className="text-[#e8dcc2]">{q.fact}</span>
                              </div>
                            )}

                            {sessionAnswers.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                {sessionAnswers.map((res, i) => (
                                  <span
                                    key={i}
                                    className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${
                                      res === 'correct'
                                        ? 'bg-[#2b1f09] border-[#fbe59b] text-[#fbe59b]'
                                        : 'bg-black/70 border-white/20 text-gray-400'
                                    }`}
                                  >
                                    C{i + 1}: {res === 'correct' ? '+20' : '0'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* CHƯƠNG 4: PHẦN THƯỞNG (CHUỖI MỐC CHƯƠNG 2 + PACK NAM MỸ 90+)  */}
              {/* ------------------------------------------------------------- */}
              {activeChapter === 'rewards' && (
                <div className="space-y-6">
                  {/* Top Track: Milestone Streak from Chapter 2 Random Rolls */}
                  <div className="border-2 border-[#d4af37]/75 bg-[#0c0904]/70 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/35 pb-3.5 mb-5">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158] block">
                          CHUỖI TÍCH LŨY TỪ CHƯƠNG 2 LUYỆN TẬP
                        </span>
                        <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                          CHUỖI PHẦN THƯỞNG MỐC CONMEBOL LIBERTADORES
                        </h2>
                      </div>
                      <div className="px-3.5 py-1.5 bg-[#1e1508] border border-[#e6c35c]/75 font-mono text-xs font-black text-[#fbe59b]">
                        ĐÃ RANDOM CHƯƠNG 2: {libState.totalTrainingRolls} LẦN
                      </div>
                    </div>

                    {/* 6 Milestone Cards Using Untouched `milestoneFrame` & `rewardBoxLogo` */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                      {LIBERTADORES_STREAK_MILESTONES.map((ms) => {
                        const claimed = libState.claimedStreakMilestones.includes(
                          ms.rollsRequired
                        );
                        const ready =
                          !claimed && libState.totalTrainingRolls >= ms.rollsRequired;
                        return (
                          <div
                            key={ms.rollsRequired}
                            className="flex flex-col items-center justify-between gap-2"
                          >
                            {/* Untouched Milestone Frame (`khung nhận phần thưởng mốc.png`) with Untouched Gift Box (`logo phần thưởng conmebol libertadores.png`) centered above pointer arrow */}
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center pb-[16%]">
                              <img
                                src={getAsset('milestoneFrame')}
                                alt={ms.title}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                              />
                              <img
                                src={getAsset('rewardBoxLogo')}
                                alt="Phần thưởng CONMEBOL"
                                className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 object-contain pointer-events-none select-none"
                              />
                            </div>

                            <div className="w-full text-center space-y-1">
                              <div className="text-[11px] font-cruyff font-black text-[#fbe59b] leading-tight min-h-[28px] flex items-center justify-center gap-1 px-1">
                                {ms.rewards.libertadoresTokens ? (
                                  <img
                                    src={getAsset('tokenSmall')}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                                    }}
                                    className="w-3.5 h-3.5 object-contain shrink-0"
                                  />
                                ) : null}
                                <span>{ms.rewardSummary}</span>
                              </div>
                              <div className="text-[11px] font-mono font-bold text-[#e5c158]">
                                MỐC {ms.rollsRequired} LẦN
                              </div>
                              <button
                                type="button"
                                disabled={!ready}
                                onClick={() => handleClaimStreakMilestone(ms.rollsRequired)}
                                className={`w-full py-1.5 px-2 border text-[11px] font-cruyff font-black uppercase tracking-wider transition-all ${
                                  claimed
                                    ? 'bg-[#141009] border-white/15 text-gray-500 cursor-default'
                                    : ready
                                    ? 'bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] border-[#fff3bd] text-[#120c04] cursor-pointer'
                                    : 'bg-[#171108] border-[#d4af37]/30 text-[#9c8456] cursor-not-allowed'
                                }`}
                              >
                                {claimed
                                  ? 'ĐÃ NHẬN'
                                  : ready
                                  ? 'NHẬN MỐC'
                                  : `${libState.totalTrainingRolls}/${ms.rollsRequired}`}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Showcase: Pack Cầu Thủ Nam Mỹ 90+ (Giá 300 Token) */}
                  <div className="border-2 border-[#e6c35c]/80 bg-[#0c0904]/70 p-5 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-4 flex items-center justify-center">
                      <img
                        src={getAsset('storePack')}
                        alt="Pack Cầu Thủ Nam Mỹ 90+"
                        className="w-44 sm:w-52 h-auto object-contain"
                      />
                    </div>

                    <div className="md:col-span-8 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#241909] border border-[#e5c158]/70 text-xs font-mono font-bold uppercase text-[#fbe59b]">
                        <span>ĐỘC QUYỀN CHƯƠNG PHẦN THƯỞNG · OVR 90+</span>
                      </div>

                      <h3 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                        PACK CẦU THỦ NAM MỸ 90+
                      </h3>

                      <p className="text-xs sm:text-sm text-[#e5d6b5] leading-relaxed">
                        Chiêu mộ ngẫu nhiên <strong className="text-[#fbe59b]">1 Ngôi Sao hoặc Huyền Thoại Nam Mỹ OVR 90+</strong>{' '}
                        (Argentina, Brazil, Uruguay... gồm Pelé, Ronaldo Nazário, Ronaldinho, Lionel Messi,
                        Vinícius Júnior, Roberto Carlos, Kaká, Federico Valverde, Lautaro Martínez, Garrincha...)
                        với hiệu ứng mở thẻ chuẩn mùa thẻ!
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                          type="button"
                          onClick={handleOpenSouthAmericaPack}
                          className="py-3.5 px-6 bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] hover:brightness-110 border-2 border-[#fff3bd] text-[#120c04] font-cruyff font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-2.5 cursor-pointer shadow-[0_0_28px_rgba(230,195,92,0.45)] active:scale-[0.99]"
                        >
                          <span>MỞ PACK NAM MỸ 90+</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#1a1205] text-[#fbe59b] font-mono text-sm">
                            <img
                              src={getAsset('tokenSmall')}
                              alt="Token"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                              }}
                              className="w-4 h-4 object-contain"
                            />
                            {SOUTH_AMERICA_90_PACK_COST_TOKENS}
                          </span>
                        </button>

                        <div className="text-xs font-mono text-[#cbb994]">
                          Đang có:{' '}
                          <strong className="text-[#fbe59b]">
                            {libertadoresTokens.toLocaleString('vi-VN')} / {SOUTH_AMERICA_90_PACK_COST_TOKENS} Token
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* ===================================================================== */}
      {/* MODAL HIỂN THỊ CÁC SỰ KIỆN NỔI BẬT KHÁC (FROM CHAPTER 1 BUTTON)        */}
      {/* ===================================================================== */}
      {showFeaturedDrawer && (
        <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full border-2 border-[#e6c35c] bg-[#0d0904] p-5 sm:p-6 space-y-4 shadow-[0_0_50px_rgba(212,175,55,0.35)]">
            <div className="flex items-center justify-between border-b border-[#d4af37]/40 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158] block">
                  TRUNG TÂM CHIẾN DỊCH
                </span>
                <h3 className="font-cruyff font-black text-xl text-white uppercase">
                  CÁC SỰ KIỆN NỔI BẬT KHÁC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFeaturedDrawer(false)}
                className="px-3 py-1 bg-[#1e1508] hover:bg-[#2e200c] border border-[#d4af37]/60 text-xs font-bold uppercase text-[#fbe59b] cursor-pointer"
              >
                ĐÓNG ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    dest: 'toty26',
                    title: 'TEAM OF THE YEAR 2026 (TOTY 26)',
                    desc: 'Thu thập Token & Mảnh Siêu Sao đổi huyền thoại UTOTY',
                  },
                  {
                    dest: 'future_stars',
                    title: 'FUTURE STARS 2026',
                    desc: 'Săn lùng dàn sao trẻ tài năng OVR 98–104',
                  },
                  {
                    dest: 'icons',
                    title: 'BIÊN NIÊN SỬ ICONS',
                    desc: 'Chinh phục huyền thoại bóng đá thế giới OVR cao',
                  },
                  {
                    dest: 'star_pass',
                    title: 'STAR PASS MÙA GIẢI',
                    desc: 'Tích lũy Star Points mở chuỗi quà cấp độ',
                  },
                  {
                    dest: 'shop_conmebol',
                    title: 'SIÊU GÓI CONMEBOL 2 (30.000 GEMS) · GÓI 100 TOKEN (3.000 GEMS)',
                    desc: 'Sở hữu Icons CONMEBOL Libertadores 102–106 & 100 Token tại Cửa Hàng',
                  },
                ] as Array<{
                  dest: FeaturedEventDestination;
                  title: string;
                  desc: string;
                }>
              ).map((ev) => (
                <button
                  key={ev.dest}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setShowFeaturedDrawer(false);
                    onNavigateFeaturedEvent(ev.dest);
                  }}
                  className="p-3.5 bg-[#161006] hover:bg-[#251a0a] border border-[#d4af37]/55 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-cruyff font-black text-sm text-[#fbe59b] uppercase">
                      {ev.title}
                    </div>
                    <div className="text-xs text-[#cbb994] mt-0.5">{ev.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#e5c158] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
