import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Clock,
  Eye,
  Play,
  Swords,
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import { iconChronicles97Players, STARTER_OWNED_IDS } from '../data/mockData';
import {
  ICON_CHRONICLES_QUIZ_POOL,
  LegendDailyQuizPack,
} from '../data/iconChroniclesQuizData';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
  normalizeIconChroniclesDaily,
} from '../utils/dateUtils';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';

const QUIZ_QUESTION_COUNT = 8;
const QUESTION_TIME_LIMIT_MS = 5000;
const CHAPTER_4_TARGET_MATCHES = 5;
const CHAPTER_4_TOKEN_REWARD = 30;
const CHAPTER_5_EXCHANGE_COST = 60;

interface IconChroniclesChaptersProps {
  chapter: 3 | 4 | 5;
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onGoToRanked: () => void;
  onSwitchChapter: (chapter: 3 | 4 | 5) => void;
}

export const IconChroniclesChapters: React.FC<IconChroniclesChaptersProps> = ({
  chapter,
  user,
  onUpdateUser,
  onGoToRanked,
  onSwitchChapter,
}) => {
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [toast, setToast] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  // Chapter 3 Quiz State
  const [quizPhase, setQuizPhase] = useState<'idle' | 'playing' | 'summary'>('idle');
  const [activeLegendPack, setActiveLegendPack] =
    useState<LegendDailyQuizPack | null>(null);
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [remainingMs, setRemainingMs] = useState<number>(QUESTION_TIME_LIMIT_MS);
  const [selectedOptIdx, setSelectedOptIdx] = useState<number | null>(null);
  const [isLockedAnswer, setIsLockedAnswer] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [accumulatedRemainingSec, setAccumulatedRemainingSec] =
    useState<number>(0);

  // Chapter 5 Reward State
  const [inspectedCard, setInspectedCard] = useState<PlayerCard | null>(null);
  const [walkoutRewardCard, setWalkoutRewardCard] =
    useState<PlayerCard | null>(null);

  const notify = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3000);
  };

  // Live 1s clock for 06:00 AM daily reset countdown
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const currentCycleKey = useMemo(
    () => getDaily6AMCycleKey(new Date(nowTick)),
    [nowTick]
  );
  const resetCountdown = useMemo(
    () => getCountdownToNext6AM(new Date(nowTick)),
    [nowTick]
  );

  const dailyProgress = useMemo(
    () => normalizeIconChroniclesDaily(user.iconChroniclesDaily, currentCycleKey),
    [user.iconChroniclesDaily, currentCycleKey]
  );

  const iconTokens = user.iconTokens ?? 0;

  const ownedSet = useMemo(
    () =>
      new Set(
        user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS
      ),
    [user.ownedPlayerIds]
  );

  // Resolve persisted legend if quiz was already finished today
  const completedLegendPack = useMemo(() => {
    if (!dailyProgress.quizLegendId) return null;
    return (
      ICON_CHRONICLES_QUIZ_POOL.find(
        (p) => p.legendId === dailyProgress.quizLegendId
      ) || ICON_CHRONICLES_QUIZ_POOL[0]
    );
  }, [dailyProgress.quizLegendId]);

  // Ref for question deadline so 5.0s countdown never drifts
  const deadlineRef = useRef<number>(0);
  const advanceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const finishDailyQuiz = (
    finalCorrect: number,
    finalRemainingSec: number,
    legendPack: LegendDailyQuizPack
  ) => {
    const roundedRemaining = Math.round(finalRemainingSec * 10) / 10;
    // Formula: take total remaining time (seconds) divided by 5, rounded to nearest integer
    const rawTokens = Math.round(roundedRemaining / 5);
    const earnedTokens =
      finalCorrect > 0 && roundedRemaining > 0 ? Math.max(1, rawTokens) : 0;

    setQuizPhase('summary');
    soundService.playPackOpenFanfare();
    if (earnedTokens > 0) {
      try {
        confetti({ particleCount: 95, spread: 90, origin: { y: 0.55 } });
      } catch {
        // ignore
      }
    }

    onUpdateUser((prev) => {
      const cyc = getDaily6AMCycleKey();
      const curDaily = normalizeIconChroniclesDaily(prev.iconChroniclesDaily, cyc);
      if (curDaily.quizCompleted) return {};
      return {
        iconTokens: (prev.iconTokens ?? 0) + earnedTokens,
        iconChroniclesDaily: {
          ...curDaily,
          cycleKey: cyc,
          quizLegendId: legendPack.legendId,
          quizCompleted: true,
          quizCorrectCount: finalCorrect,
          quizRemainingSeconds: roundedRemaining,
          quizTokensEarned: earnedTokens,
        },
      };
    });

    notify(
      `Hoàn thành Chương 3: Đúng ${finalCorrect}/8 câu · Dư ${roundedRemaining.toFixed(
        1
      )}s → Nhận +${earnedTokens} Token Icon!`
    );
  };

  const startQuestionTimer = () => {
    deadlineRef.current = performance.now() + QUESTION_TIME_LIMIT_MS;
    setRemainingMs(QUESTION_TIME_LIMIT_MS);
    setSelectedOptIdx(null);
    setIsLockedAnswer(false);
  };

  const handleStartDailyQuiz = () => {
    if (dailyProgress.quizCompleted) return;
    soundService.playClick();
    // Pick 1 random Legend for today's 8-question journey
    const randomPack =
      ICON_CHRONICLES_QUIZ_POOL[
        Math.floor(Math.random() * ICON_CHRONICLES_QUIZ_POOL.length)
      ] || ICON_CHRONICLES_QUIZ_POOL[0];
    setActiveLegendPack(randomPack);
    setQuestionIdx(0);
    setCorrectCount(0);
    setAccumulatedRemainingSec(0);
    setQuizPhase('playing');
    startQuestionTimer();
  };

  const handleAnswerOrTimeout = (
    chosenIdx: number | null,
    capturedRemainingMs: number
  ) => {
    if (!activeLegendPack || isLockedAnswer) return;
    setIsLockedAnswer(true);
    setSelectedOptIdx(chosenIdx);

    const currentQ = activeLegendPack.questions[questionIdx];
    const isCorrect =
      chosenIdx !== null && currentQ && chosenIdx === currentQ.correctIndex;
    const remSec = isCorrect
      ? Math.max(0, Math.min(5, capturedRemainingMs / 1000))
      : 0;

    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextRemSec = accumulatedRemainingSec + remSec;

    if (isCorrect) {
      soundService.playCoins();
    } else {
      soundService.playClick();
    }

    setCorrectCount(nextCorrect);
    setAccumulatedRemainingSec(nextRemSec);

    advanceTimeoutRef.current = window.setTimeout(() => {
      if (questionIdx + 1 < QUIZ_QUESTION_COUNT) {
        setQuestionIdx((prev) => prev + 1);
        startQuestionTimer();
      } else {
        finishDailyQuiz(nextCorrect, nextRemSec, activeLegendPack);
      }
    }, 750);
  };

  // Active 5-second per-question ticker
  useEffect(() => {
    if (quizPhase !== 'playing' || isLockedAnswer || !activeLegendPack) return;
    const timerId = window.setInterval(() => {
      const left = Math.max(0, deadlineRef.current - performance.now());
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(timerId);
        handleAnswerOrTimeout(null, 0);
      }
    }, 60);
    return () => window.clearInterval(timerId);
  }, [quizPhase, isLockedAnswer, questionIdx, activeLegendPack]);

  // Chapter 4 Claim Handler (5 Ranked Matches -> 30 Token Icon)
  const handleClaimChapter4Moments = () => {
    if (dailyProgress.momentsClaimed) return;
    if (dailyProgress.rankedMatchesPlayed < CHAPTER_4_TARGET_MATCHES) {
      soundService.playClick();
      notify(
        `Bạn đã chơi ${dailyProgress.rankedMatchesPlayed}/${CHAPTER_4_TARGET_MATCHES} trận Đấu Xếp Hạng hôm nay. Hãy hoàn thành đủ 5 trận để nhận 30 Token Icon!`,
        'error'
      );
      return;
    }

    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 100, spread: 95, origin: { y: 0.55 } });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const cyc = getDaily6AMCycleKey();
      const curDaily = normalizeIconChroniclesDaily(prev.iconChroniclesDaily, cyc);
      if (
        curDaily.momentsClaimed ||
        curDaily.rankedMatchesPlayed < CHAPTER_4_TARGET_MATCHES
      ) {
        return {};
      }
      return {
        iconTokens: (prev.iconTokens ?? 0) + CHAPTER_4_TOKEN_REWARD,
        iconChroniclesDaily: {
          ...curDaily,
          momentsClaimed: true,
        },
      };
    });

    notify(
      `Nhận thưởng Chương 4: Khoảnh Khắc thành công (+${CHAPTER_4_TOKEN_REWARD} Token Icon)!`
    );
  };

  // Chapter 5 Exchange Handler (Token Icon -> 10 Icon 97 OVR players)
  const handleExchange97Icon = (targetCard: PlayerCard) => {
    if (ownedSet.has(targetCard.id)) {
      soundService.playClick();
      notify(`Bạn đã sở hữu Huyền Thoại ${targetCard.name} (97 OVR) trong CLB!`, 'error');
      return;
    }
    if (iconTokens < CHAPTER_5_EXCHANGE_COST) {
      soundService.playClick();
      notify(
        `Chưa đủ Token Icon! Cần ${CHAPTER_5_EXCHANGE_COST} Token Icon (hiện có ${iconTokens}). Hãy làm Chương 3 & Chương 4 mỗi ngày!`,
        'error'
      );
      return;
    }

    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.52 } });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const curTokens = prev.iconTokens ?? 0;
      if (curTokens < CHAPTER_5_EXCHANGE_COST) return {};
      const curOwned = prev.ownedPlayerIds?.length
        ? prev.ownedPlayerIds
        : STARTER_OWNED_IDS;
      if (curOwned.includes(targetCard.id)) return {};
      return {
        iconTokens: curTokens - CHAPTER_5_EXCHANGE_COST,
        ownedPlayerIds: [...curOwned, targetCard.id],
      };
    });

    setWalkoutRewardCard(targetCard);
    notify(
      `Đổi thành công Huyền Thoại ${targetCard.name} (97 OVR · Icons)!`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-cruyff">
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 border font-bold text-sm rounded-none ${
            toast.tone === 'success'
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-rose-950 border-rose-400 text-rose-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* ======================================================== */}
      {/* CHƯƠNG 3: HÀNH TRÌNH (DAILY 8-QUESTION x 5S LEGEND QUIZ) */}
      {/* ======================================================== */}
      {chapter === 3 && (
        <section className="bg-slate-950/92 border-2 border-amber-400/80 p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.75)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-white/15">
            <div className="flex items-center gap-4">
              <img
                src="/assets/aistudio/logo_c_u_h_i_h_ng_ng_y_bi_n_ni_n_s__icons_6ca967f8.png"
                alt="Chương 3 Hành Trình"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-[0_0_16px_rgba(250,204,21,0.55)]"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Biên Niên Sử Icons · Chương 3: Hành Trình
                </div>
                <h2 className="font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                  THỬ THÁCH TRÍ NHỚ HUYỀN THOẠI HẰNG NGÀY (8 CÂU × 5 GIÂY)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Làm mới lúc 06:00 AM mỗi ngày · Ngẫu nhiên 1 Huyền Thoại · Số Token Icon nhận = (Tổng thời gian còn dư của câu đúng ÷ 5) làm tròn
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-amber-200 shrink-0">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Reset 06:00 AM sau: {resetCountdown}</span>
              </span>
              <span>·</span>
              <span className="text-yellow-300">
                Token Icon hiện có: {iconTokens}
              </span>
            </div>
          </div>

          {/* Quiz Body */}
          {dailyProgress.quizCompleted && quizPhase !== 'playing' ? (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 bg-slate-900/90 border border-amber-400/40 p-5 flex flex-col items-center text-center">
                {completedLegendPack && (
                  <img
                    src={completedLegendPack.avatarUrl}
                    alt={completedLegendPack.legendName}
                    referrerPolicy="no-referrer"
                    className="w-32 h-32 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]"
                  />
                )}
                <div className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-300">
                  Đã Hoàn Thành Hành Trình Hôm Nay
                </div>
                <div className="font-black text-2xl text-white uppercase mt-1">
                  {completedLegendPack?.legendName || 'Huyền Thoại'}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {completedLegendPack?.legendTitle}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900/90 border border-white/15 p-5 space-y-3">
                  <h3 className="font-black text-lg text-amber-300 uppercase">
                    TỔNG KẾT PHẦN THƯỞNG CHƯƠNG 3 HÔM NAY
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-950 border border-white/10 p-3">
                      <div className="text-xs text-slate-400 uppercase">Số câu trả lời đúng</div>
                      <div className="font-black text-xl text-white tabular-nums mt-0.5">
                        {dailyProgress.quizCorrectCount} / {QUIZ_QUESTION_COUNT} câu
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-white/10 p-3">
                      <div className="text-xs text-slate-400 uppercase">Tổng thời gian còn dư</div>
                      <div className="font-black text-xl text-amber-300 tabular-nums mt-0.5">
                        {dailyProgress.quizRemainingSeconds.toFixed(1)} giây
                      </div>
                    </div>
                    <div className="bg-slate-950 border border-amber-400/50 p-3">
                      <div className="text-xs text-amber-200 uppercase">Token Icon nhận được</div>
                      <div className="font-black text-xl text-emerald-300 tabular-nums mt-0.5">
                        +{dailyProgress.quizTokensEarned} Token Icon
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 tabular-nums">
                    Công thức quy đổi: {dailyProgress.quizRemainingSeconds.toFixed(1)}s còn dư ÷ 5 ={' '}
                    {(dailyProgress.quizRemainingSeconds / 5).toFixed(2)} → Làm tròn thành{' '}
                    <strong className="text-yellow-300">
                      {dailyProgress.quizTokensEarned} Token Icon
                    </strong>
                    . Quay lại vào 06:00 AM sáng mai để nhận thử thách Huyền Thoại mới!
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onSwitchChapter(4);
                    }}
                    className="py-3 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer rounded-none"
                  >
                    <span>Sang Chương 4: Khoảnh Khắc (+30 Token Icon)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onSwitchChapter(5);
                    }}
                    className="py-3 px-5 bg-slate-900 hover:bg-slate-800 border border-amber-400/60 text-amber-200 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer rounded-none"
                  >
                    <span>Đổi Cầu Thủ Icon 97 OVR (Chương 5)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : quizPhase === 'playing' && activeLegendPack ? (
            <div className="mt-6 max-w-4xl mx-auto space-y-5">
              {/* Top Legend & Live 5s Timer Header */}
              <div className="bg-slate-900 border border-amber-400/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activeLegendPack.avatarUrl}
                    alt={activeLegendPack.legendName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-contain shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold uppercase text-amber-300">
                      Huyền Thoại Hôm Nay · Câu {questionIdx + 1} / {QUIZ_QUESTION_COUNT}
                    </div>
                    <div className="font-black text-xl text-white uppercase">
                      {activeLegendPack.legendName} ({activeLegendPack.position} ·{' '}
                      {activeLegendPack.nation})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 tabular-nums">
                  <div className="text-right">
                    <div className="text-[11px] uppercase text-slate-400">
                      Thời gian dư tích lũy
                    </div>
                    <div className="font-black text-base text-emerald-300">
                      {accumulatedRemainingSec.toFixed(1)}s
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-slate-950 border border-amber-400 text-center min-w-[96px]">
                    <div className="text-[10px] uppercase text-amber-200">Đếm ngược</div>
                    <div
                      className={`font-black text-xl ${
                        remainingMs <= 1800 ? 'text-rose-400' : 'text-yellow-300'
                      }`}
                    >
                      {(remainingMs / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>
              </div>

              {/* 5-second visual progress bar */}
              <div className="w-full h-2.5 bg-slate-900 border border-white/15 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    remainingMs <= 1800 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (remainingMs / QUESTION_TIME_LIMIT_MS) * 100)
                    )}%`,
                  }}
                />
              </div>

              {/* Question Card */}
              {activeLegendPack.questions[questionIdx] && (
                <div className="bg-slate-900/95 border border-white/20 p-5 sm:p-6 space-y-5">
                  <h3 className="font-black text-lg sm:text-xl text-white leading-snug">
                    Câu {questionIdx + 1}:{' '}
                    {activeLegendPack.questions[questionIdx].question}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeLegendPack.questions[questionIdx].options.map(
                      (optionText, optIdx) => {
                        const correctIdx =
                          activeLegendPack.questions[questionIdx].correctIndex;
                        const isSelected = selectedOptIdx === optIdx;
                        const isRightOption = optIdx === correctIdx;

                        let btnStyle =
                          'bg-slate-950 hover:bg-slate-800 border-white/25 text-white';
                        if (isLockedAnswer) {
                          if (isRightOption) {
                            btnStyle =
                              'bg-emerald-950/90 border-emerald-400 text-emerald-200';
                          } else if (isSelected && !isRightOption) {
                            btnStyle =
                              'bg-rose-950/90 border-rose-400 text-rose-200';
                          } else {
                            btnStyle =
                              'bg-slate-950/60 border-white/10 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isLockedAnswer}
                            onClick={() =>
                              handleAnswerOrTimeout(
                                optIdx,
                                Math.max(0, deadlineRef.current - performance.now())
                              )
                            }
                            className={`py-3.5 px-4 border-2 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-3 transition-colors cursor-pointer rounded-none ${btnStyle}`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}. {optionText}
                            </span>
                            {isLockedAnswer && isRightOption && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            {isLockedAnswer && isSelected && !isRightOption && (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Idle Pre-Start View */
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900/90 border border-white/15 p-5 space-y-3">
                  <h3 className="font-black text-lg text-amber-300 uppercase">
                    THỂ LỆ CHƯƠNG 3: HÀNH TRÌNH HUYỀN THOẠI
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-200">
                    <li>
                      1. Hệ thống chọn ngẫu nhiên <strong>1 Huyền Thoại</strong> mỗi ngày (làm mới vào <strong>06:00 AM</strong>).
                    </li>
                    <li>
                      2. Gồm <strong>8 câu hỏi trắc nghiệm</strong> liên tiếp, mỗi câu có đúng <strong>5.0 giây</strong> suy nghĩ.
                    </li>
                    <li>
                      3. Trả lời đúng càng nhanh, số giây còn dư càng nhiều. Khi hết 8 câu, tổng thời gian còn dư sẽ chia cho <strong>5</strong> và <strong>làm tròn</strong> thành số <strong>Token Icon</strong> thưởng hằng ngày (tối đa 8 Token Icon/ngày).
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleStartDailyQuiz}
                  className="py-3.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center gap-2.5 cursor-pointer rounded-none shadow-[0_0_24px_rgba(251,191,36,0.4)]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Bắt Đầu 8 Câu Hỏi Hôm Nay</span>
                </button>
              </div>

              <div className="lg:col-span-5 bg-slate-900/85 border border-amber-400/40 p-5 flex flex-col items-center text-center">
                <img
                  src="/assets/aistudio/logo_c_u_h_i_h_ng_ng_y_bi_n_ni_n_s__icons_6ca967f8.png"
                  alt="Câu Hỏi Hằng Ngày"
                  className="w-24 h-24 object-contain drop-shadow-[0_0_22px_rgba(251,191,36,0.55)]"
                />
                <div className="mt-3 font-black text-lg text-white uppercase">
                  1 HUYỀN THOẠI NGẪU NHIÊN / NGÀY
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Pelé · Ronaldo R9 · Zidane · Beckham · Puskás · Buffon · Roberto Carlos · Shevchenko
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* CHƯƠNG 4: KHOẢNH KHẮC (5 RANKED MATCHES -> 30 TOKEN ICON) */}
      {/* ======================================================== */}
      {chapter === 4 && (
        <section className="bg-slate-950/92 border-2 border-amber-400/80 p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.75)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-white/15">
            <div className="flex items-center gap-4">
              <img
                src="/assets/aistudio/logo_tr_n___u_bi_n_ni_n_s__icons_06d8089b.png"
                alt="Chương 4 Khoảnh Khắc"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-[0_0_16px_rgba(250,204,21,0.55)]"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Biên Niên Sử Icons · Chương 4: Khoảnh Khắc
                </div>
                <h2 className="font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                  THI ĐẤU 5 TRẬN XẾP HẠNG HẰNG NGÀY · NHẬN 30 TOKEN ICON
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Hoàn thành đủ 5 trận Đấu Xếp Hạng trong ngày (làm mới lúc 06:00 AM) để nhận trọn 30 Token Icon
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-amber-200 shrink-0">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Reset 06:00 AM sau: {resetCountdown}</span>
              </span>
              <span>·</span>
              <span className="text-yellow-300">
                Token Icon hiện có: {iconTokens}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-5">
              {/* 5 Ranked Matches Milestone Tracker */}
              <div className="bg-slate-900/90 border border-white/15 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-white uppercase">
                    Tiến độ trận Đấu Xếp Hạng hôm nay
                  </span>
                  <span className="font-black text-lg text-amber-300 tabular-nums">
                    {Math.min(
                      CHAPTER_4_TARGET_MATCHES,
                      dailyProgress.rankedMatchesPlayed
                    )}{' '}
                    / {CHAPTER_4_TARGET_MATCHES} trận
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {Array.from({ length: CHAPTER_4_TARGET_MATCHES }, (_, idx) => {
                    const matchNum = idx + 1;
                    const done = dailyProgress.rankedMatchesPlayed >= matchNum;
                    return (
                      <div
                        key={matchNum}
                        className={`p-3 border text-center transition-colors ${
                          done
                            ? 'bg-emerald-950/75 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950 border-white/15 text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase">
                          Trận {matchNum}
                        </div>
                        <div className="mt-1 flex items-center justify-center">
                          {done ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Swords className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onGoToRanked();
                  }}
                  className="py-3.5 px-6 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer rounded-none"
                >
                  <Swords className="w-4 h-4" />
                  <span>Thi Đấu Xếp Hạng Ngay</span>
                </button>

                <button
                  type="button"
                  disabled={
                    dailyProgress.momentsClaimed ||
                    dailyProgress.rankedMatchesPlayed < CHAPTER_4_TARGET_MATCHES
                  }
                  onClick={handleClaimChapter4Moments}
                  className={`py-3.5 px-6 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 rounded-none transition-colors ${
                    dailyProgress.momentsClaimed
                      ? 'bg-emerald-950 border border-emerald-400 text-emerald-300 cursor-default'
                      : dailyProgress.rankedMatchesPlayed >= CHAPTER_4_TARGET_MATCHES
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-[0_0_24px_rgba(251,191,36,0.45)]'
                      : 'bg-slate-800 border border-white/15 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>
                    {dailyProgress.momentsClaimed
                      ? 'Đã Nhận 30 Token Icon Hôm Nay'
                      : `Nhận ${CHAPTER_4_TOKEN_REWARD} Token Icon`}
                  </span>
                </button>
              </div>
            </div>

            {/* Reward Highlight Box */}
            <div className="lg:col-span-4 bg-slate-900/90 border-2 border-amber-400/60 p-5 flex flex-col items-center text-center">
              <img
                src="/assets/aistudio/logo_ph_n_th__ng_bi_n_ni_n_s__icons_2e69c3ae.png"
                alt="30 Token Icon"
                className="w-20 h-20 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.55)]"
              />
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-300">
                Phần Thưởng Hằng Ngày
              </div>
              <div className="font-black text-3xl text-yellow-300 uppercase mt-1 tabular-nums">
                +30 TOKEN ICON
              </div>
              <p className="text-xs text-slate-300 mt-1.5">
                Dùng Token Icon tại Chương 5: Phần Thưởng để chiêu mộ 10 Huyền Thoại Icon 97 OVR độc quyền!
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* CHƯƠNG 5: PHẦN THƯỞNG (10 ICON 97 OVR PLAYERS EXCHANGE)  */}
      {/* ======================================================== */}
      {chapter === 5 && (
        <section className="bg-slate-950/92 border-2 border-amber-400/80 p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.75)] space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-white/15">
            <div className="flex items-center gap-4">
              <img
                src="/assets/aistudio/logo_ph_n_th__ng_bi_n_ni_n_s__icons_2e69c3ae.png"
                alt="Chương 5 Phần Thưởng"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-[0_0_16px_rgba(250,204,21,0.55)]"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Biên Niên Sử Icons · Chương 5: Phần Thưởng
                </div>
                <h2 className="font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                  ĐỔI TOKEN ICON NHẬN 10 HUYỀN THOẠI ICON 97 OVR ĐỘC QUYỀN
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  David Luiz · Garrincha · Park Ji-Sung · Kewell · Tim Howard · Nakata · Agüero · Walcott · Pepe · Shevchenko
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-900 border-2 border-amber-400 flex items-center gap-3 shrink-0">
              <img
                src="/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png"
                alt="Token Icon"
                className="w-7 h-7 object-contain"
              />
              <div>
                <div className="text-[10px] font-bold uppercase text-amber-200">
                  Số dư Token Icon
                </div>
                <div className="font-black text-xl text-yellow-300 tabular-nums leading-none">
                  {iconTokens} Token
                </div>
              </div>
            </div>
          </div>

          {/* 10 Icon 97 OVR Players Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {iconChronicles97Players.map((legend) => {
              const isOwned = ownedSet.has(legend.id);
              const canAfford = iconTokens >= CHAPTER_5_EXCHANGE_COST;

              return (
                <div
                  key={legend.id}
                  className="bg-slate-900/90 border border-white/15 hover:border-amber-400/80 p-3.5 flex flex-col items-center text-center transition-colors"
                >
                  <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-slate-300 mb-1.5">
                    <span>
                      {legend.position} · {legend.nation}
                    </span>
                    <span className={isOwned ? 'text-emerald-300' : 'text-amber-300'}>
                      {isOwned ? 'Đã đổi' : '97 OVR'}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      soundService.playClick();
                      setInspectedCard(legend);
                    }}
                    className="cursor-pointer"
                  >
                    <FCCard player={legend} size="sm" showStats={false} />
                  </div>

                  <div className="mt-2.5 w-full">
                    <div className="font-black text-sm text-white uppercase truncate">
                      {legend.name}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                      PAC {legend.pac} · SHO {legend.sho} · PAS {legend.pas} · DRI{' '}
                      {legend.dri}
                    </div>
                  </div>

                  <div className="mt-3 w-full space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setInspectedCard(legend);
                      }}
                      className="w-full py-1.5 px-2 bg-slate-950 hover:bg-white/10 border border-white/20 text-[10px] font-bold uppercase text-slate-200 flex items-center justify-center gap-1 cursor-pointer rounded-none"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Xem chỉ số</span>
                    </button>

                    <button
                      type="button"
                      disabled={isOwned}
                      onClick={() => handleExchange97Icon(legend)}
                      className={`w-full py-2 px-2 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 rounded-none transition-colors ${
                        isOwned
                          ? 'bg-emerald-950 border border-emerald-400/70 text-emerald-300 cursor-default'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-amber-200 cursor-pointer'
                      }`}
                    >
                      {isOwned ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã Sở Hữu</span>
                        </>
                      ) : (
                        <span>Đổi {CHAPTER_5_EXCHANGE_COST} Token Icon</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Inspect 97 OVR Icon Modal */}
      {inspectedCard && (
        <div
          onClick={() => setInspectedCard(null)}
          className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-950 border-2 border-amber-400 p-5 flex flex-col items-center gap-3 text-center rounded-none"
          >
            <FCCard player={inspectedCard} size="hero" showStats={true} />
            <div className="font-black text-xl text-white uppercase">
              {inspectedCard.fullName || inspectedCard.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {inspectedCard.ovr} · {inspectedCard.position} ·{' '}
              {inspectedCard.nation} · Thuận chân {inspectedCard.foot || 'Phải'}
            </div>
            <div className="w-full grid grid-cols-6 gap-1.5 bg-slate-900 border border-white/15 p-2.5 text-center tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">PAC</div>
                <div className="font-black text-sm text-amber-300">{inspectedCard.pac}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">SHO</div>
                <div className="font-black text-sm text-amber-300">{inspectedCard.sho}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PAS</div>
                <div className="font-black text-sm text-amber-300">{inspectedCard.pas}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DRI</div>
                <div className="font-black text-sm text-amber-300">{inspectedCard.dri}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DEF</div>
                <div className="font-black text-sm text-amber-300">{inspectedCard.def}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PHY</div>
                <div className="font-black text-sm text-amber-300">{inspectedCard.phy}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInspectedCard(null)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Walkout Celebration when claiming a 97 OVR Icon */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`BIÊN NIÊN SỬ ICONS · ${walkoutRewardCard.name} (97 OVR)`}
          isTicketSpin={false}
          autoStartWalkout={true}
          skipResourceBonus={true}
          isIconChroniclesExchange={true}
          ticketsRemaining={user.tickets ?? 0}
          spinCount={1}
          onUseTicket={() => false}
          onClose={() => setWalkoutRewardCard(null)}
          onPlayerClaimed={() => setWalkoutRewardCard(null)}
        />
      )}
    </div>
  );
};
