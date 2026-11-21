import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  RONALDO_CHRONICLES_FRAME,
  RONALDO_CHRONICLES_STAGES,
  RonaldoChronicleStage,
  RonaldoQuizQuestion,
  pickRandomRonaldoQuestions,
} from '../data/ronaldoChroniclesData';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
  normalizeRonaldoChroniclesState,
} from '../utils/dateUtils';
import { resolveClubCrestUrls } from '../utils/clubCrests';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';

interface RonaldoChroniclesChapterProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
}

export const RonaldoChroniclesChapter: React.FC<RonaldoChroniclesChapterProps> = ({
  user,
  onUpdateUser,
}) => {
  const [cycleKey, setCycleKey] = useState<string>(() => getDaily6AMCycleKey());
  const [resetCountdown, setResetCountdown] = useState<string>(() =>
    getCountdownToNext6AM()
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setCycleKey(getDaily6AMCycleKey());
      setResetCountdown(getCountdownToNext6AM());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const ronaldoState = useMemo(
    () =>
      normalizeRonaldoChroniclesState(user.ronaldoChronicles, user.ownedPlayerIds),
    [user.ronaldoChronicles, user.ownedPlayerIds]
  );

  const claimedSet = useMemo(
    () => new Set(ronaldoState.claimedClubIds),
    [ronaldoState.claimedClubIds]
  );

  const activeStageIndex = RONALDO_CHRONICLES_STAGES.findIndex(
    (st) => !claimedSet.has(st.clubId)
  );
  const allCompleted = activeStageIndex === -1;
  const activeStage: RonaldoChronicleStage | null = allCompleted
    ? null
    : RONALDO_CHRONICLES_STAGES[activeStageIndex];

  const playedThisCycle = ronaldoState.lastAttemptCycleKey === cycleKey;
  const canStartDailyChallenge = Boolean(activeStage && !playedThisCycle);

  // Active Quiz Session state
  const QUESTION_TIME_LIMIT = 5;
  const [quizSession, setQuizSession] = useState<{
    stage: RonaldoChronicleStage;
    questions: RonaldoQuizQuestion[];
    currentIndex: number;
    selectedIndex: number | null;
    correctCount: number;
    isPractice: boolean;
    finished: boolean;
  } | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);

  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(null);
  const [inspectedCard, setInspectedCard] = useState<PlayerCard | null>(null);

  // Strict 5-second timer per question
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
  }, [quizSession?.stage.clubId, quizSession?.currentIndex, quizSession?.selectedIndex, quizSession?.finished]);

  const handleStartQuiz = (
    stage: RonaldoChronicleStage,
    isPractice: boolean = false
  ) => {
    soundService.playClick();
    const picked = pickRandomRonaldoQuestions(stage.clubId, 10);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setQuizSession({
      stage,
      questions: picked,
      currentIndex: 0,
      selectedIndex: null,
      correctCount: 0,
      isPractice,
      finished: false,
    });
  };

  const handleAnswerOption = (optionIdx: number) => {
    if (!quizSession || quizSession.selectedIndex !== null) return;
    const currentQ = quizSession.questions[quizSession.currentIndex];
    const isCorrect = optionIdx === currentQ.correctIndex;
    if (isCorrect) {
      soundService.playClick();
    } else {
      soundService.playTabSwitch();
    }
    setQuizSession((prev) =>
      prev
        ? {
            ...prev,
            selectedIndex: optionIdx,
            correctCount: prev.correctCount + (isCorrect ? 1 : 0),
          }
        : null
    );
  };

  const handleNextOrFinish = () => {
    if (!quizSession || quizSession.selectedIndex === null) return;
    soundService.playClick();

    const isLast = quizSession.currentIndex + 1 >= quizSession.questions.length;
    if (!isLast) {
      setQuestionTimeLeft(QUESTION_TIME_LIMIT);
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

    const finalCorrect = quizSession.correctCount;
    const passed = finalCorrect > 7; // Strictly > 7 (tức 8, 9, hoặc 10/10 câu đúng)

    if (!quizSession.isPractice) {
      const targetStage = quizSession.stage;
      onUpdateUser((prev) => {
        const curState = normalizeRonaldoChroniclesState(
          prev.ronaldoChronicles,
          prev.ownedPlayerIds
        );
        const owned = new Set(prev.ownedPlayerIds || []);
        const nextClaimed = new Set(curState.claimedClubIds);

        if (passed) {
          owned.add(targetStage.player.id);
          nextClaimed.add(targetStage.clubId);
        }

        const orderedClaimed = RONALDO_CHRONICLES_STAGES.map((s) => s.clubId).filter(
          (id) => nextClaimed.has(id)
        );

        return {
          ownedPlayerIds: Array.from(owned),
          ronaldoChronicles: {
            claimedClubIds: orderedClaimed,
            lastAttemptCycleKey: getDaily6AMCycleKey(),
            lastAttemptClubId: targetStage.clubId,
            lastAttemptCorrect: finalCorrect,
            lastAttemptPassed: passed,
          },
        };
      });

      if (passed) {
        setWalkoutRewardCard(quizSession.stage.player);
      }
    }

    setQuizSession((prev) => (prev ? { ...prev, finished: true } : null));
  };

  const getCrest = (clubName: string) => resolveClubCrestUrls(clubName, undefined, false)[0];

  const lastAttemptStage = ronaldoState.lastAttemptClubId
    ? RONALDO_CHRONICLES_STAGES.find((s) => s.clubId === ronaldoState.lastAttemptClubId)
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-5 font-cruyff">
      {/* HERO HEADER BANNER */}
      <div className="bg-slate-950/95 border-2 border-amber-400/80 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_0_28px_rgba(250,204,21,0.18)]">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={RONALDO_CHRONICLES_FRAME}
            alt="Biên Niên Sử Ronaldo"
            className="w-14 h-14 object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                CRISTIANO RONALDO · OVR 100
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                {ronaldoState.claimedClubIds.length}/5 CLB ĐÃ SỞ HỮU
              </span>
            </div>
            <h2 className="font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-1">
              BIÊN NIÊN SỬ RONALDO · HÀNH TRÌNH QUA CÁC CÂU LẠC BỘ
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Mỗi ngày chinh phục <strong className="text-amber-300">10 câu hỏi ngẫu nhiên</strong> (<strong className="text-rose-300">5 giây/câu</strong>) theo thứ tự từ CLB đầu tiên đến CLB cuối cùng (Reset <strong className="text-cyan-300">06:00 sáng</strong> mỗi ngày). Trả lời đúng <strong className="text-emerald-300">trên 7 câu (≥ 8/10)</strong> để nhận Ronaldo 100 OVR của CLB đó!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-slate-900/95 border border-cyan-400/45 px-4 py-2.5">
          <Clock className="w-5 h-5 text-cyan-300 shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase text-cyan-200 tracking-wider">
              Reset Hằng Ngày · 06:00 Sáng
            </div>
            <div className="font-mono font-black text-base text-white tabular-nums">
              {resetCountdown}
            </div>
          </div>
        </div>
      </div>

      {/* 5 CHRONOLOGICAL CLUB TIMELINE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {RONALDO_CHRONICLES_STAGES.map((stage, idx) => {
          const isClaimed = claimedSet.has(stage.clubId);
          const isCurrent = !allCompleted && idx === activeStageIndex;
          const isLockedFuture = !isClaimed && !isCurrent;
          const crestUrl = getCrest(stage.clubName);

          return (
            <div
              key={stage.clubId}
              className={`p-3.5 bg-slate-950/92 border-2 flex flex-col items-center text-center transition-all ${
                isClaimed
                  ? 'border-emerald-400/80 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                  : isCurrent
                  ? 'border-amber-400 shadow-[0_0_24px_rgba(250,204,21,0.3)]'
                  : 'border-white/15 opacity-75'
              }`}
            >
              <div className="w-full flex items-center justify-between gap-1 pb-2 mb-2 border-b border-white/10">
                <span className="font-black text-[10px] uppercase tracking-wider text-amber-300">
                  CHẶNG {stage.order}/5
                </span>
                {isClaimed ? (
                  <span className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 font-black text-[9px] uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ NHẬN
                  </span>
                ) : isCurrent ? (
                  playedThisCycle ? (
                    <span className="px-1.5 py-0.5 bg-cyan-400 text-slate-950 font-black text-[9px] uppercase">
                      CHỜ 06:00
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] uppercase">
                      HÔM NAY
                    </span>
                  )
                ) : (
                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 font-black text-[9px] uppercase flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> KHÓA
                  </span>
                )}
              </div>

              <div
                onClick={() => {
                  soundService.playClick();
                  setInspectedCard(stage.player);
                }}
                className="cursor-pointer hover:scale-[1.03] transition-transform"
                title="Chạm để xem chỉ số thẻ 100 OVR"
              >
                <FCCard player={stage.player} size="sm" showStats={false} />
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                {crestUrl && (
                  <img
                    src={crestUrl}
                    alt={stage.clubName}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 object-contain shrink-0"
                  />
                )}
                <span className="font-black text-sm text-white uppercase">
                  {stage.clubName}
                </span>
              </div>
              <div className="text-[10px] text-amber-200/90 font-bold mt-0.5">
                {stage.eraLabel}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 min-h-[28px]">
                {stage.subtitle}
              </div>

              {isClaimed && allCompleted && (
                <button
                  type="button"
                  onClick={() => handleStartQuiz(stage, true)}
                  className="mt-2 w-full py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-200 cursor-pointer transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Ôn Tập 10 Câu
                </button>
              )}

              {isLockedFuture && (
                <div className="mt-2 w-full py-1 bg-slate-900 border border-white/10 text-[10px] font-bold text-slate-400 uppercase">
                  Mở sau CLB #{stage.order - 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ACTIVE QUIZ ARENA / DAILY CHALLENGE PANEL */}
      {quizSession ? (
        <div className="bg-slate-950/95 border-2 border-amber-400 p-5 sm:p-6 space-y-5 shadow-[0_0_32px_rgba(250,204,21,0.22)]">
          {!quizSession.finished ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
                <div className="flex items-center gap-3">
                  {getCrest(quizSession.stage.clubName) && (
                    <img
                      src={getCrest(quizSession.stage.clubName)}
                      alt={quizSession.stage.clubName}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      {quizSession.isPractice
                        ? 'CHẾ ĐỘ ÔN TẬP (KHÔNG TÍNH THƯỞNG)'
                        : `THỬ THÁCH HÔM NAY · CHẶNG ${quizSession.stage.order}/5`}
                    </div>
                    <h3 className="font-black text-lg text-white uppercase">
                      Cristiano Ronaldo tại {quizSession.stage.clubName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 tabular-nums flex-wrap">
                  <span
                    className={`px-3 py-1 border text-xs font-black flex items-center gap-1.5 ${
                      quizSession.selectedIndex !== null
                        ? 'bg-slate-900 border-white/20 text-slate-300'
                        : questionTimeLeft <= 2
                        ? 'bg-rose-950/90 border-rose-400 text-rose-200 animate-pulse'
                        : 'bg-amber-950/90 border-amber-400 text-amber-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {questionTimeLeft}s / 5s
                  </span>
                  <span className="px-3 py-1 bg-slate-900 border border-white/20 text-xs font-black text-white">
                    CÂU {quizSession.currentIndex + 1} / {quizSession.questions.length}
                  </span>
                  <span className="px-3 py-1 bg-emerald-950/90 border border-emerald-400/60 text-xs font-black text-emerald-300">
                    ĐÚNG: {quizSession.correctCount} (CẦN &gt; 7)
                  </span>
                </div>
              </div>

              {/* 5-second per-question countdown bar */}
              <div className="w-full h-2 bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-linear ${
                    questionTimeLeft <= 2 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 to-amber-400'
                  }`}
                  style={{ width: `${Math.max(0, (questionTimeLeft / QUESTION_TIME_LIMIT) * 100)}%` }}
                />
              </div>

              {/* Progress bar across 10 questions */}
              <div className="grid grid-cols-10 gap-1.5">
                {quizSession.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-2 ${
                      idx < quizSession.currentIndex
                        ? 'bg-emerald-400'
                        : idx === quizSession.currentIndex
                        ? 'bg-amber-400'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Current Question */}
              {(() => {
                const currentQ = quizSession.questions[quizSession.currentIndex];
                const answered = quizSession.selectedIndex !== null;
                return (
                  <div className="space-y-4">
                    <div className="p-4 sm:p-5 bg-slate-900/95 border border-amber-400/40 text-base sm:text-lg font-bold text-white leading-relaxed">
                      <span className="text-amber-300 mr-2 font-black">
                        Câu {quizSession.currentIndex + 1}:
                      </span>
                      {currentQ.question}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.options.map((optText, optIdx) => {
                        const isSelected = quizSession.selectedIndex === optIdx;
                        const isCorrectOption = optIdx === currentQ.correctIndex;
                        let cardClass =
                          'bg-slate-900/90 border-white/20 hover:border-amber-300 text-white';
                        if (answered) {
                          if (isCorrectOption) {
                            cardClass =
                              'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.3)]';
                          } else if (isSelected && !isCorrectOption) {
                            cardClass =
                              'bg-rose-950/90 border-rose-500 text-rose-200';
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
                            className={`p-3.5 border-2 text-left flex items-center justify-between gap-3 transition-all rounded-none ${cardClass} ${
                              answered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-7 h-7 bg-black/50 border border-white/20 flex items-center justify-center font-black text-xs text-amber-300 shrink-0">
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
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/15">
                        <div className="text-xs font-bold">
                          {quizSession.selectedIndex === currentQ.correctIndex ? (
                            <span className="text-emerald-300">
                              Chính xác! Tiếp tục giữ vững phong độ nhé.
                            </span>
                          ) : quizSession.selectedIndex === -1 ? (
                            <span className="text-rose-300">
                              Hết 5 giây! Đáp án đúng là:{' '}
                              <strong className="text-emerald-300">
                                {currentQ.options[currentQ.correctIndex]}
                              </strong>
                            </span>
                          ) : (
                            <span className="text-rose-300">
                              Chưa chính xác! Đáp án đúng là:{' '}
                              <strong className="text-emerald-300">
                                {currentQ.options[currentQ.correctIndex]}
                              </strong>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleNextOrFinish}
                          className="py-2.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer rounded-none"
                        >
                          {quizSession.currentIndex + 1 >= quizSession.questions.length
                            ? 'Xem Kết Quả Cuối Cùng'
                            : 'Câu Tiếp Theo →'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            /* QUIZ FINISHED SUMMARY */
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              {quizSession.correctCount > 7 ? (
                <Trophy className="w-14 h-14 text-amber-300" />
              ) : (
                <XCircle className="w-14 h-14 text-rose-400" />
              )}

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-amber-300">
                  KẾT QUẢ {quizSession.stage.clubName.toUpperCase()} ·{' '}
                  {quizSession.isPractice ? 'ÔN TẬP' : 'THỬ THÁCH NGÀY'}
                </div>
                <h3 className="font-black text-2xl sm:text-3xl text-white uppercase mt-1">
                  BẠN TRẢ LỜI ĐÚNG {quizSession.correctCount} / 10 CÂU HỎI
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl mx-auto">
                  {quizSession.correctCount > 7
                    ? quizSession.isPractice
                      ? `Xuất sắc! Bạn đã vượt mốc trên 7 câu hỏi cho chặng ${quizSession.stage.clubName}.`
                      : `Chúc mừng! Đạt ${quizSession.correctCount}/10 (>7 câu) — Thẻ Cristiano Ronaldo ${quizSession.stage.clubName} (100 OVR) đã được thêm vào Đội Hình! Câu lạc bộ tiếp theo sẽ mở khóa lúc 06:00 sáng ngày mai.`
                    : `Rất tiếc! Bạn cần trả lời đúng trên 7 câu hỏi (từ 8/10 trở lên) để nhận thẻ Ronaldo ${quizSession.stage.clubName} 100 OVR. Hệ thống sẽ reset lượt trả lời lúc 06:00 sáng ngày mai (${resetCountdown}).`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setQuizSession(null);
                }}
                className="py-2.5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
              >
                Quay Lại Lộ Trình Biên Niên Sử Ronaldo
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STANDBY ACTION PANEL */
        <div className="bg-slate-950/95 border-2 border-amber-400/75 p-5 flex flex-col md:flex-row items-center justify-between gap-5">
          {allCompleted ? (
            <>
              <div className="flex items-center gap-4">
                <Trophy className="w-12 h-12 text-amber-300 shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                    HOÀN THÀNH TOÀN BỘ 5 CHẶNG SỰ NGHIỆP
                  </div>
                  <h3 className="font-black text-xl text-white uppercase">
                    BẠN ĐÃ SƯU TẬP ĐỦ 5/5 RONALDO BIÊN NIÊN SỬ (100 OVR)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Từ Sporting CP, Manchester United, Real Madrid, Juventus đến Al-Nassr — bạn có thể nhấn &ldquo;Ôn Tập 10 Câu&rdquo; trên từng CLB bất cứ lúc nào.
                  </p>
                </div>
              </div>
            </>
          ) : activeStage && canStartDailyChallenge ? (
            <>
              <div className="flex items-center gap-4 min-w-0">
                <FCCard player={activeStage.player} size="sm" showStats={false} />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400/20 border border-amber-400 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" />
                    CHẶNG HÔM NAY ({activeStage.order}/5) · {activeStage.clubName.toUpperCase()}
                  </div>
                  <h3 className="font-black text-lg sm:text-xl text-white uppercase">
                    Trả Lời 10 Câu Hỏi Ngẫu Nhiên · Nhận Ronaldo {activeStage.clubName} 100 OVR
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Điều kiện nhận thưởng: Trả lời đúng <strong className="text-emerald-300">trên 7 câu (8–10/10 câu)</strong> · Thời gian <strong className="text-amber-300">5 giây / câu</strong>. Nhận kèm hiệu ứng Walkout Biên Niên Sử Icons!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartQuiz(activeStage, false)}
                className="w-full md:w-auto py-3.5 px-7 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-105 border border-yellow-100 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 cursor-pointer rounded-none shadow-[0_0_24px_rgba(250,204,21,0.4)]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Bắt Đầu 10 Câu Hỏi Hôm Nay</span>
              </button>
            </>
          ) : (
            activeStage && (
              <>
                <div className="flex items-center gap-4 min-w-0">
                  <FCCard player={activeStage.player} size="sm" showStats={false} />
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-[10px] font-black uppercase tracking-wider mb-1">
                      <Clock className="w-3 h-3" />
                      ĐÃ THAM GIA LƯỢT HÔM NAY · RESET LÚC 06:00 SÁNG
                    </div>
                    <h3 className="font-black text-lg text-white uppercase">
                      {ronaldoState.lastAttemptPassed
                        ? `Hôm nay đã hoàn thành ${lastAttemptStage?.clubName || 'chặng vừa rồi'} (${ronaldoState.lastAttemptCorrect ?? 8}/10) · Chặng tiếp theo: ${activeStage.clubName}`
                        : `Chặng ${activeStage.clubName}: Lần thử hôm nay đạt ${ronaldoState.lastAttemptCorrect ?? 0}/10 (Cần > 7 câu)`}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Mỗi ngày mở 1 câu lạc bộ theo thứ tự. Vui lòng quay lại sau{' '}
                      <strong className="text-cyan-300 font-mono">{resetCountdown}</strong>{' '}
                      (06:00 sáng) để chinh phục <strong className="text-amber-300">{activeStage.clubName}</strong>!
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3 bg-slate-900 border border-cyan-400/50 text-center shrink-0">
                  <div className="text-[10px] font-bold uppercase text-cyan-300">
                    Mở Khóa Sau (06:00)
                  </div>
                  <div className="font-mono font-black text-xl text-white tabular-nums">
                    {resetCountdown}
                  </div>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* Inspect 100 OVR Ronaldo Card Modal */}
      {inspectedCard && (
        <div
          onClick={() => setInspectedCard(null)}
          className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-950 border-2 border-amber-400 p-5 flex flex-col items-center gap-3 text-center rounded-none"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
              <span className="px-2 py-0.5 bg-rose-950/90 border border-rose-400/65 text-rose-200">
                KHÔNG GIAO DỊCH
              </span>
              <span className="px-2 py-0.5 bg-amber-950/90 border border-yellow-400/70 text-yellow-200">
                BIÊN NIÊN SỬ RONALDO · OVR 100
              </span>
            </div>
            <FCCard player={inspectedCard} size="hero" showStats={true} />
            <div className="font-black text-xl text-white uppercase">
              {inspectedCard.fullName || inspectedCard.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {inspectedCard.ovr} · {inspectedCard.position} · {inspectedCard.club} · {inspectedCard.nation}
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

      {/* Walkout Celebration identical to Icons Chronicles Exchange */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`BIÊN NIÊN SỬ RONALDO · ${walkoutRewardCard.club.toUpperCase()} (100 OVR)`}
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
