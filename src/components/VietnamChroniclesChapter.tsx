import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  VIETNAM_CHRONICLES_ASSETS,
  VIETNAM_CHRONICLES_ENTRIES,
  VIETNAM_QUESTION_TIME_LIMIT,
  VIETNAM_SHARDS_PER_CORRECT,
  VietnamQuizQuestion,
  pickRandomVietnamQuestions,
} from '../data/vietnamChroniclesData';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
  normalizeVietnamChroniclesState,
} from '../utils/dateUtils';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';

interface VietnamChroniclesChapterProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onShowToast?: (text: string, tone?: 'gold' | 'error') => void;
}

export const VietnamChroniclesChapter: React.FC<VietnamChroniclesChapterProps> = ({
  user,
  onUpdateUser,
  onShowToast,
}) => {
  const [cycleKey, setCycleKey] = useState<string>(() => getDaily6AMCycleKey());
  const [resetCountdown, setResetCountdown] = useState<string>(() =>
    getCountdownToNext6AM()
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextKey = getDaily6AMCycleKey();
      setCycleKey((prev) => (prev === nextKey ? prev : nextKey));
      setResetCountdown(getCountdownToNext6AM());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const vnState = useMemo(
    () => normalizeVietnamChroniclesState(user.vietnamChronicles, cycleKey),
    [user.vietnamChronicles, cycleKey]
  );

  const vietnamShards = user.vietnamShards ?? 0;
  const ownedSet = useMemo(
    () => new Set(user.ownedPlayerIds || []),
    [user.ownedPlayerIds]
  );

  const [quizSession, setQuizSession] = useState<{
    questions: VietnamQuizQuestion[];
    currentIndex: number;
    selectedIndex: number | null;
    correctCount: number;
    shardsEarned: number;
    isPractice: boolean;
    finished: boolean;
  } | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(
    VIETNAM_QUESTION_TIME_LIMIT
  );

  const [inspectedEntry, setInspectedEntry] = useState<
    (typeof VIETNAM_CHRONICLES_ENTRIES)[number] | null
  >(null);
  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(
    null
  );

  // Strict 5-second countdown timer per question
  useEffect(() => {
    if (!quizSession || quizSession.finished || quizSession.selectedIndex !== null) {
      return;
    }
    const timer = window.setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          soundService.playTabSwitch();
          setQuizSession((cur) => {
            if (!cur || cur.finished || cur.selectedIndex !== null) return cur;
            return { ...cur, selectedIndex: -1 };
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quizSession?.currentIndex, quizSession?.selectedIndex, quizSession?.finished]);

  const handleStartQuiz = (isPractice: boolean = false) => {
    soundService.playClick();
    if (!isPractice && vnState.quizCompleted) {
      onShowToast?.(
        `Bạn đã hoàn thành 10 câu hỏi hôm nay! Reset lúc 06:00 sáng (${resetCountdown}).`,
        'error'
      );
      return;
    }
    const picked = pickRandomVietnamQuestions(10);
    setQuestionTimeLeft(VIETNAM_QUESTION_TIME_LIMIT);
    setQuizSession({
      questions: picked,
      currentIndex: 0,
      selectedIndex: null,
      correctCount: 0,
      shardsEarned: 0,
      isPractice,
      finished: false,
    });
  };

  const handleAnswerOption = (optionIdx: number) => {
    if (!quizSession || quizSession.selectedIndex !== null) return;
    const currentQ = quizSession.questions[quizSession.currentIndex];
    const isCorrect = optionIdx === currentQ.correctIndex;
    const gainedShards = isCorrect && !quizSession.isPractice ? VIETNAM_SHARDS_PER_CORRECT : 0;

    if (isCorrect) {
      soundService.playCoins();
    } else {
      soundService.playTabSwitch();
    }

    if (gainedShards > 0) {
      onUpdateUser((prev) => ({
        vietnamShards: (prev.vietnamShards ?? 0) + gainedShards,
      }));
    }

    setQuizSession((prev) =>
      prev
        ? {
            ...prev,
            selectedIndex: optionIdx,
            correctCount: prev.correctCount + (isCorrect ? 1 : 0),
            shardsEarned: prev.shardsEarned + gainedShards,
          }
        : null
    );
  };

  const handleNextOrFinish = () => {
    if (!quizSession || quizSession.selectedIndex === null) return;
    soundService.playClick();

    const isLast = quizSession.currentIndex + 1 >= quizSession.questions.length;
    if (!isLast) {
      setQuestionTimeLeft(VIETNAM_QUESTION_TIME_LIMIT);
      setQuizSession((prev) =>
        prev
          ? {
              ...prev,
              currentIndex: prev.currentIndex + 1,
              selectedIndex: null,
            }
          : null
      );
      return;
    }

    if (!quizSession.isPractice) {
      const finalCorrect = quizSession.correctCount;
      const finalShards = quizSession.shardsEarned;
      const qIds = quizSession.questions.map((q) => q.id);

      onUpdateUser((prev) => ({
        vietnamChronicles: {
          cycleKey: getDaily6AMCycleKey(),
          quizCompleted: true,
          quizCorrectCount: finalCorrect,
          quizShardsEarned: finalShards,
          questionIds: qIds,
        },
      }));

      if (finalShards > 0) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#dc2626', '#facc15', '#ffffff'],
          });
        } catch {
          // ignore
        }
        onShowToast?.(
          `Hoàn thành Biên Niên Sử Việt Nam: +${finalShards} Mảnh Việt Nam (${finalCorrect}/10 câu đúng)!`,
          'gold'
        );
      }
    }

    setQuizSession((prev) => (prev ? { ...prev, finished: true } : null));
  };

  const handleExchangePlayer = (entry: (typeof VIETNAM_CHRONICLES_ENTRIES)[number]) => {
    soundService.playClick();
    if (vietnamShards < entry.shardCost) {
      onShowToast?.(
        `Cần ${entry.shardCost} Mảnh Việt Nam để đổi ${entry.player.name} (Hiện có: ${vietnamShards})`,
        'error'
      );
      return;
    }

    soundService.playPackOpenFanfare();
    try {
      confetti({
        particleCount: 110,
        spread: 95,
        origin: { y: 0.52 },
        colors: ['#dc2626', '#facc15', '#fbbf24', '#ffffff'],
      });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const curShards = prev.vietnamShards ?? 0;
      if (curShards < entry.shardCost) return {};
      const owned = new Set(prev.ownedPlayerIds || []);
      owned.add(entry.player.id);
      return {
        vietnamShards: curShards - entry.shardCost,
        ownedPlayerIds: Array.from(owned),
      };
    });

    setInspectedEntry(null);
    setWalkoutRewardCard(entry.player);
    onShowToast?.(
      `Đổi thành công ${entry.player.name} (${entry.player.ovr} OVR · ${entry.player.position}) với ${entry.shardCost} Mảnh Việt Nam!`,
      'gold'
    );
  };

  const ownedCount = VIETNAM_CHRONICLES_ENTRIES.filter((e) =>
    ownedSet.has(e.player.id)
  ).length;

  return (
    <div className="space-y-6 font-cruyff">
      {/* HERO BANNER */}
      <section className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#3a0707]/95 via-[#580c0c]/90 to-[#1f0606]/95 border-2 border-yellow-400/85 shadow-[0_0_32px_rgba(220,38,38,0.35)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-black/55 border-2 border-yellow-300/80 flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(250,204,21,0.35)]">
            <img
              src={VIETNAM_CHRONICLES_ASSETS.frame}
              alt="Biên Niên Sử Việt Nam"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-yellow-400 text-red-950 text-[10px] font-black uppercase rounded">
                TỰ HÀO VIỆT NAM · RENDERZ +33 OVR
              </span>
              <span className="px-2 py-0.5 bg-red-950/90 border border-yellow-400/60 text-yellow-200 text-[10px] font-black uppercase rounded">
                ĐÃ SỞ HỮU {ownedCount}/{VIETNAM_CHRONICLES_ENTRIES.length} CẦU THỦ
              </span>
            </div>
            <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
              BIÊN NIÊN SỬ VIỆT NAM · CHIẾN BINH SAO VÀNG
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90">
              Mỗi ngày trả lời <strong className="text-yellow-300">10 câu hỏi ngẫu nhiên</strong> về bóng đá Việt Nam (<strong className="text-rose-300">5 giây/câu</strong>) để nhận <strong className="text-emerald-300">50 Mảnh Việt Nam / câu đúng</strong>. Dùng Mảnh (&gt; 250 Mảnh) đổi 5 ngôi sao Việt Nam chuẩn RenderZ +33 OVR!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-black/65 border border-yellow-400/65 flex items-center gap-2.5">
            <img
              src={VIETNAM_CHRONICLES_ASSETS.shardsIcon}
              alt="Mảnh Việt Nam"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-yellow-200 font-bold">
                Mảnh Việt Nam
              </div>
              <div className="font-mono font-black text-lg text-yellow-300 tabular-nums">
                {vietnamShards.toLocaleString('vi-VN')} Mảnh
              </div>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-black/65 border border-cyan-400/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-cyan-200 font-bold">
                Reset 06:00
              </div>
              <div className="font-mono font-black text-sm text-white tabular-nums">
                {resetCountdown}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DAILY 10-QUESTION VIETNAM FOOTBALL QUIZ (5s / QUESTION, +50 SHARDS / CORRECT) */}
      <section className="p-4 sm:p-6 rounded-2xl bg-slate-950/90 border-2 border-red-500/75 shadow-[0_0_28px_rgba(220,38,38,0.25)] space-y-4 backdrop-blur-md">
        {quizSession ? (
          !quizSession.finished ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
                <div className="flex items-center gap-3">
                  <img
                    src={VIETNAM_CHRONICLES_ASSETS.crest}
                    alt="Việt Nam"
                    className="w-9 h-9 object-contain shrink-0"
                  />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                      {quizSession.isPractice
                        ? 'ÔN TẬP KIẾN THỨC (KHÔNG TÍNH MẢNH)'
                        : 'THỬ THÁCH HẰNG NGÀY · +50 MẢNH / CÂU ĐÚNG'}
                    </div>
                    <h4 className="font-black text-base sm:text-lg text-white uppercase">
                      Câu Hỏi Bóng Đá Việt Nam
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap tabular-nums">
                  <span
                    className={`px-3 py-1 border text-xs font-black flex items-center gap-1.5 rounded-lg ${
                      quizSession.selectedIndex !== null
                        ? 'bg-slate-900 border-white/20 text-slate-300'
                        : questionTimeLeft <= 2
                        ? 'bg-rose-950 border-rose-400 text-rose-200 animate-pulse'
                        : 'bg-red-950 border-yellow-400 text-yellow-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {questionTimeLeft}s / 5s
                  </span>
                  <span className="px-3 py-1 bg-slate-900 border border-white/20 text-xs font-black text-white rounded-lg">
                    CÂU {quizSession.currentIndex + 1} / {quizSession.questions.length}
                  </span>
                  <span className="px-3 py-1 bg-emerald-950 border border-emerald-400/60 text-xs font-black text-emerald-300 rounded-lg">
                    ĐÚNG: {quizSession.correctCount} · +{quizSession.shardsEarned} MẢNH
                  </span>
                </div>
              </div>

              {/* 5-second countdown progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-linear ${
                    questionTimeLeft <= 2
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-yellow-400 to-red-500'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      (questionTimeLeft / VIETNAM_QUESTION_TIME_LIMIT) * 100
                    )}%`,
                  }}
                />
              </div>

              {/* 10-question progress */}
              <div className="grid grid-cols-10 gap-1.5">
                {quizSession.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-1.5 rounded-full ${
                      idx < quizSession.currentIndex
                        ? 'bg-emerald-400'
                        : idx === quizSession.currentIndex
                        ? 'bg-yellow-400'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {(() => {
                const currentQ = quizSession.questions[quizSession.currentIndex];
                const answered = quizSession.selectedIndex !== null;
                return (
                  <div className="space-y-4">
                    <div className="p-4 sm:p-5 bg-slate-900/95 border border-yellow-400/40 rounded-xl text-base sm:text-lg font-bold text-white leading-relaxed">
                      <span className="text-yellow-300 mr-2 font-black">
                        Câu {quizSession.currentIndex + 1}:
                      </span>
                      {currentQ.question}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.options.map((optText, optIdx) => {
                        const isSelected = quizSession.selectedIndex === optIdx;
                        const isCorrectOption = optIdx === currentQ.correctIndex;
                        let cardClass =
                          'bg-slate-900/90 border-white/20 hover:border-yellow-300 text-white';
                        if (answered) {
                          if (isCorrectOption) {
                            cardClass =
                              'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.3)]';
                          } else if (isSelected && !isCorrectOption) {
                            cardClass = 'bg-rose-950/90 border-rose-500 text-rose-200';
                          } else {
                            cardClass =
                              'bg-slate-900/50 border-white/10 text-slate-400 opacity-65';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={answered}
                            onClick={() => handleAnswerOption(optIdx)}
                            className={`p-3.5 border-2 rounded-xl text-left flex items-center justify-between gap-3 transition-all ${cardClass} ${
                              answered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-black/55 border border-white/20 flex items-center justify-center font-black text-xs text-yellow-300 shrink-0">
                                {['A', 'B', 'C', 'D'][optIdx]}
                              </span>
                              <span className="font-bold text-sm">{optText}</span>
                            </div>
                            {answered && isCorrectOption && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            {answered && isSelected && !isCorrectOption && (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15">
                        <div className="text-xs font-bold">
                          {quizSession.selectedIndex === currentQ.correctIndex ? (
                            <span className="text-emerald-300">
                              Chính xác!{' '}
                              {!quizSession.isPractice && (
                                <strong className="text-yellow-300">
                                  +{VIETNAM_SHARDS_PER_CORRECT} Mảnh Việt Nam
                                </strong>
                              )}
                            </span>
                          ) : quizSession.selectedIndex === -1 ? (
                            <span className="text-rose-300">
                              Hết 5 giây! Đáp án đúng:{' '}
                              <strong className="text-emerald-300">
                                {currentQ.options[currentQ.correctIndex]}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-rose-300">
                              Chưa đúng! Đáp án chính xác:{' '}
                              <strong className="text-emerald-300">
                                {currentQ.options[currentQ.correctIndex]}
                              </strong>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleNextOrFinish}
                          className="py-2.5 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          {quizSession.currentIndex + 1 >= quizSession.questions.length
                            ? 'Xem Tổng Kết Mảnh'
                            : 'Câu Tiếp Theo →'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4 space-y-3">
              <Trophy className="w-12 h-12 text-yellow-300" />
              <div className="text-xs font-black uppercase tracking-widest text-yellow-300">
                {quizSession.isPractice
                  ? 'HOÀN THÀNH ÔN TẬP'
                  : 'KẾT QUẢ BIÊN NIÊN SỬ VIỆT NAM HÔM NAY'}
              </div>
              <h4 className="font-black text-2xl text-white uppercase">
                ĐÚNG {quizSession.correctCount} / 10 CÂU
                {!quizSession.isPractice && ` · +${quizSession.shardsEarned} MẢNH VIỆT NAM`}
              </h4>
              <p className="text-xs text-slate-300 max-w-lg">
                {quizSession.isPractice
                  ? 'Bạn đã ôn tập xong 10 câu hỏi bóng đá Việt Nam.'
                  : `Tổng cộng ${quizSession.shardsEarned} Mảnh Việt Nam đã được cộng trực tiếp vào kho của bạn! Bộ 10 câu hỏi mới sẽ mở lại lúc 06:00 sáng (${resetCountdown}).`}
              </p>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setQuizSession(null);
                }}
                className="py-2.5 px-6 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Quay Lại Đổi Cầu Thủ Việt Nam
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-red-950/90 border-2 border-yellow-400/75 flex items-center justify-center shrink-0">
                <img
                  src={VIETNAM_CHRONICLES_ASSETS.shardsIcon}
                  alt="Mảnh Việt Nam"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-500/20 border border-yellow-400 text-yellow-300 text-[10px] font-black uppercase tracking-wider rounded mb-1">
                  <Sparkles className="w-3 h-3" />
                  {vnState.quizCompleted
                    ? `ĐÃ HOÀN THÀNH HÔM NAY (${vnState.quizCorrectCount}/10 · +${vnState.quizShardsEarned} MẢNH)`
                    : 'SẴN SÀNG HÔM NAY · TỐI ĐA +500 MẢNH / NGÀY'}
                </div>
                <h4 className="font-black text-lg text-white uppercase">
                  Trả Lời 10 Câu Hỏi Ngẫu Nhiên Bóng Đá Việt Nam (5 Giây / Câu)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Mỗi câu trả lời đúng nhận ngay <strong className="text-yellow-300">50 Mảnh Việt Nam</strong>. Lượt hỏi mới sẽ tự động làm mới lúc <strong className="text-cyan-300">06:00 sáng</strong> mỗi ngày.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              {!vnState.quizCompleted ? (
                <button
                  type="button"
                  onClick={() => handleStartQuiz(false)}
                  className="w-full md:w-auto py-3 px-6 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:brightness-110 text-white border-2 border-yellow-300 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(239,68,68,0.45)]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu 10 Câu (+50 Mảnh/Câu)</span>
                </button>
              ) : (
                <>
                  <div className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-400/45 text-center">
                    <div className="text-[10px] text-cyan-300 font-bold uppercase">
                      Mở Lượt Mới Lúc 06:00
                    </div>
                    <div className="font-mono font-black text-sm text-white">
                      {resetCountdown}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartQuiz(true)}
                    className="py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/25 text-amber-200 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ôn Tập 10 Câu</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SHARD EXCHANGE SECTION (ALL > 250 SHARDS) */}
      <section className="p-4 sm:p-6 rounded-2xl bg-black/75 border-2 border-yellow-400/55 backdrop-blur-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/15">
          <div>
            <h4 className="font-cruyff font-black text-lg text-yellow-300 uppercase tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span>Đổi Cầu Thủ Việt Nam Bằng Mảnh (Từ 2.600 Mảnh · RenderZ +33 OVR)</span>
            </h4>
            <p className="text-xs text-slate-300">
              Chỉ số OVR và vị trí giữ chuẩn RenderZ FC Mobile cộng thêm +33 OVR. Bấm vào thẻ để xem chi tiết hoặc đổi trực tiếp.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-red-950/90 border border-yellow-400/60 text-xs font-black text-yellow-300">
            Kho của bạn: {vietnamShards.toLocaleString('vi-VN')} Mảnh Việt Nam
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VIETNAM_CHRONICLES_ENTRIES.map((entry) => {
            const isOwned = ownedSet.has(entry.player.id);
            const canAfford = vietnamShards >= entry.shardCost;
            return (
              <div
                key={entry.player.id}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center gap-2.5 transition-all ${
                  isOwned
                    ? 'bg-emerald-950/35 border-emerald-400/75'
                    : canAfford
                    ? 'bg-gradient-to-b from-red-950/80 to-slate-950/95 border-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.18)]'
                    : 'bg-slate-950/90 border-white/15'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-black uppercase">
                  <span className="text-amber-300">
                    RenderZ {entry.renderzBaseOvr} + 33
                  </span>
                  <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-400/60 text-rose-200 text-[9px]">
                    KHÔNG GIAO DỊCH
                  </span>
                </div>

                <div
                  onClick={() => {
                    soundService.playClick();
                    setInspectedEntry(entry);
                  }}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <FCCard player={entry.player} size="sm" showStats={false} />
                </div>

                <div className="w-full">
                  <div className="font-black text-sm text-white uppercase truncate">
                    {entry.player.name}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {entry.player.club} · {entry.player.position} · {entry.player.ovr} OVR
                  </div>
                </div>

                {isOwned ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ĐÃ SỞ HỮU TRONG CLB</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleExchangePlayer(entry)}
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 cursor-pointer shadow'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <img
                      src={VIETNAM_CHRONICLES_ASSETS.shardsIcon}
                      alt=""
                      className="w-4 h-4 object-contain"
                    />
                    <span>Đổi {entry.shardCost.toLocaleString('vi-VN')} Mảnh</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* INSPECT PLAYER MODAL */}
      {inspectedEntry && (
        <div
          onClick={() => setInspectedEntry(null)}
          className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-950 border-2 border-yellow-400 rounded-2xl p-5 flex flex-col items-center gap-3 text-center shadow-[0_0_40px_rgba(220,38,38,0.4)]"
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
              {inspectedEntry.highlightNote}
            </div>
            <FCCard player={inspectedEntry.player} size="hero" showStats={true} />
            <div className="font-black text-xl text-white uppercase">
              {inspectedEntry.player.fullName || inspectedEntry.player.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {inspectedEntry.player.ovr} · {inspectedEntry.player.position} ·{' '}
              {inspectedEntry.player.club} · Kỹ thuật {inspectedEntry.player.skillMoves}★
            </div>
            <div className="w-full grid grid-cols-6 gap-1.5 bg-slate-900 border border-white/15 p-2.5 rounded-xl text-center tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">PAC</div>
                <div className="font-black text-sm text-yellow-300">{inspectedEntry.player.pac}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">SHO</div>
                <div className="font-black text-sm text-yellow-300">{inspectedEntry.player.sho}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PAS</div>
                <div className="font-black text-sm text-yellow-300">{inspectedEntry.player.pas}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DRI</div>
                <div className="font-black text-sm text-yellow-300">{inspectedEntry.player.dri}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DEF</div>
                <div className="font-black text-sm text-yellow-300">{inspectedEntry.player.def}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PHY</div>
                <div className="font-black text-sm text-yellow-300">{inspectedEntry.player.phy}</div>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={vietnamShards < inspectedEntry.shardCost}
                onClick={() => handleExchangePlayer(inspectedEntry)}
                className={`py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider ${
                  vietnamShards >= inspectedEntry.shardCost
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                Đổi {inspectedEntry.shardCost.toLocaleString('vi-VN')} Mảnh
              </button>
              <button
                type="button"
                onClick={() => setInspectedEntry(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALKOUT REWARD MODAL ON EXCHANGE */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`BIÊN NIÊN SỬ VIỆT NAM · ${walkoutRewardCard.name} (${walkoutRewardCard.ovr} OVR)`}
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
