import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Info,
  Lock,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  VIETNAM_CHRONICLES_CATALOG,
  VIETNAM_CREST_URL,
  VIETNAM_QUIZ_QUESTIONS_PER_DAY,
  VIETNAM_QUIZ_SECONDS_PER_QUESTION,
  VIETNAM_SHARDS_PER_CORRECT,
  VietnamChroniclesCatalogItem,
  VietnamQuizQuestion,
  pickRandomVietnamQuestions,
} from '../data/vietnamChroniclesData';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
  normalizeVietnamChroniclesState,
} from '../utils/dateUtils';
import { TopSectionHeader } from './TopSectionHeader';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';

export type VietnamChroniclesTab = 'quiz' | 'exchange';

interface VietnamChroniclesModalProps {
  user: UserProfile;
  initialTab?: VietnamChroniclesTab;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenShop?: () => void;
  onOpenTickets?: () => void;
  onClose: () => void;
  embedded?: boolean;
}

export const VietnamChroniclesModal: React.FC<VietnamChroniclesModalProps> = ({
  user,
  initialTab = 'quiz',
  onUpdateUser,
  onOpenShop,
  onOpenTickets,
  onClose,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<VietnamChroniclesTab>(initialTab);
  const [posFilter, setPosFilter] = useState<'ALL' | 'ATT' | 'MID' | 'DEF' | 'GK'>('ALL');

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

  const vnState = useMemo(
    () => normalizeVietnamChroniclesState(user.vietnamChronicles, cycleKey),
    [user.vietnamChronicles, cycleKey]
  );

  const playedToday = vnState.lastAttemptCycleKey === cycleKey;
  const vietnamShards = user.vietnamShards ?? 0;
  const ownedSet = useMemo(() => new Set(user.ownedPlayerIds ?? []), [user.ownedPlayerIds]);

  const ownedVietnamCount = useMemo(
    () => VIETNAM_CHRONICLES_CATALOG.filter((item) => ownedSet.has(item.player.id)).length,
    [ownedSet]
  );

  // Active 10-question, 5-second-per-question Quiz Session
  const [quizSession, setQuizSession] = useState<{
    questions: VietnamQuizQuestion[];
    currentIndex: number;
    selectedIndex: number | null;
    correctCount: number;
    isPractice: boolean;
    finished: boolean;
    shardsEarned: number;
  } | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(
    VIETNAM_QUIZ_SECONDS_PER_QUESTION
  );

  const [inspectedItem, setInspectedItem] = useState<VietnamChroniclesCatalogItem | null>(null);
  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 3200);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

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
  }, [
    quizSession?.currentIndex,
    quizSession?.selectedIndex,
    quizSession?.finished,
  ]);

  const handleStartQuiz = (isPractice: boolean = false) => {
    soundService.playClick();
    const picked = pickRandomVietnamQuestions(VIETNAM_QUIZ_QUESTIONS_PER_DAY);
    setQuestionTimeLeft(VIETNAM_QUIZ_SECONDS_PER_QUESTION);
    setQuizSession({
      questions: picked,
      currentIndex: 0,
      selectedIndex: null,
      correctCount: 0,
      isPractice,
      finished: false,
      shardsEarned: 0,
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
      setQuestionTimeLeft(VIETNAM_QUIZ_SECONDS_PER_QUESTION);
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

    const totalCorrect = quizSession.correctCount;
    const earned = quizSession.isPractice
      ? 0
      : totalCorrect * VIETNAM_SHARDS_PER_CORRECT;

    setQuizSession((prev) =>
      prev ? { ...prev, finished: true, shardsEarned: earned } : null
    );

    if (!quizSession.isPractice) {
      const currentCycle = getDaily6AMCycleKey();
      onUpdateUser((prev) => {
        const curState = normalizeVietnamChroniclesState(
          prev.vietnamChronicles,
          currentCycle
        );
        if (curState.lastAttemptCycleKey === currentCycle) {
          return {};
        }
        return {
          vietnamShards: (prev.vietnamShards ?? 0) + earned,
          vietnamChronicles: {
            cycleKey: currentCycle,
            lastAttemptCycleKey: currentCycle,
            lastAttemptCorrect: totalCorrect,
            lastAttemptShardsEarned: earned,
            totalDailyRuns: (curState.totalDailyRuns ?? 0) + 1,
            quizCompleted: true,
            quizCorrectCount: totalCorrect,
            quizShardsEarned: earned,
            questionIds: quizSession.questions.map((q) => q.id),
          },
        };
      });
      if (earned > 0) {
        setFeedbackMsg(
          `Hoàn thành 10 câu hỏi! Bạn nhận được +${earned.toLocaleString('vi-VN')} Mảnh Việt Nam.`
        );
      }
    }
  };

  const handleExchangePlayer = (item: VietnamChroniclesCatalogItem) => {
    soundService.playClick();
    if (ownedSet.has(item.player.id)) {
      setFeedbackMsg(`${item.player.name} đã có trong kho cầu thủ CLB!`);
      return;
    }
    if (vietnamShards < item.shardCost) {
      setFeedbackMsg(
        `Chưa đủ Mảnh Việt Nam! Cần ${item.shardCost} mảnh (hiện có ${vietnamShards} mảnh).`
      );
      return;
    }

    onUpdateUser((prev) => {
      const curShards = prev.vietnamShards ?? 0;
      const curOwned = prev.ownedPlayerIds ?? [];
      if (curShards < item.shardCost || curOwned.includes(item.player.id)) {
        return {};
      }
      // Strictly untradeable: only add to ownedPlayerIds, NEVER to tradeablePlayerIds
      return {
        vietnamShards: curShards - item.shardCost,
        ownedPlayerIds: [...curOwned, item.player.id],
      };
    });

    setInspectedItem(null);
    setWalkoutRewardCard(item.player);
  };

  const filteredCatalog = useMemo(() => {
    return VIETNAM_CHRONICLES_CATALOG.filter((item) => {
      if (posFilter === 'ALL') return true;
      const pos = item.player.position;
      if (posFilter === 'ATT') return ['ST', 'CF', 'LW', 'RW'].includes(pos);
      if (posFilter === 'MID') return ['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos);
      if (posFilter === 'DEF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
      return pos === 'GK';
    });
  }, [posFilter]);

  const currentQuestion = quizSession
    ? quizSession.questions[quizSession.currentIndex]
    : null;

  return (
    <div
      className={
        embedded
          ? 'relative w-full h-full bg-[#090305] flex flex-col overflow-hidden select-none font-cruyff text-white'
          : 'fixed inset-0 z-50 bg-[#090305] flex flex-col overflow-hidden select-none font-cruyff text-white'
      }
    >
      {!embedded && (
        <TopSectionHeader
          title="BIÊN NIÊN SỬ VIỆT NAM"
          subtitle="10 Câu Hỏi Bóng Đá VN Mỗi Ngày (5s/Câu) · Đổi Sao Việt Nam (+33 OVR RenderZ)"
          user={user}
          onBack={onClose}
          onGoHome={onClose}
          onClickGems={onOpenShop}
          onClickTickets={onOpenTickets}
        />
      )}

      {/* Event Heritage Banner */}
      <div className="bg-gradient-to-r from-[#2b040a] via-[#5c0814] to-[#2b040a] border-b border-yellow-400/50 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-[#160306] border border-yellow-400/80 flex items-center justify-center shrink-0">
              <img
                src={VIETNAM_CREST_URL}
                alt="Đội tuyển Việt Nam"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  SỰ KIỆN ĐẶC BIỆT
                </span>
                <span className="px-2 py-0.5 bg-rose-950 border border-rose-300/60 text-rose-100 font-black text-[10px] uppercase tracking-wider">
                  TẤT CẢ CẦU THỦ KHÔNG GIAO DỊCH ĐƯỢC
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-1 truncate">
                Mỗi câu đúng +50 Mảnh Việt Nam · Bộ sưu tập đã mở khóa:{' '}
                <strong className="text-yellow-300 tabular-nums">
                  {ownedVietnamCount}/{VIETNAM_CHRONICLES_CATALOG.length}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 bg-[#160306] border border-yellow-400/75 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
              <div className="leading-tight">
                <div className="text-[10px] uppercase text-amber-200 font-bold tracking-wider">
                  Mảnh Việt Nam
                </div>
                <div className="font-mono font-black text-base text-yellow-300 tabular-nums">
                  {vietnamShards.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2 bg-[#160306] border border-red-400/45 leading-tight">
              <div className="text-[10px] uppercase text-rose-200 font-bold tracking-wider">
                Làm Mới 06:00 Sáng
              </div>
              <div className="font-mono font-black text-sm text-white tabular-nums">
                {resetCountdown}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#120407] border-b border-white/15 px-4 sm:px-6 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-2 max-w-2xl">
          <button
            type="button"
            onClick={() => {
              soundService.playTabSwitch();
              setActiveTab('quiz');
            }}
            className={`py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'quiz'
                ? 'border-yellow-400 text-yellow-300 bg-red-950/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Hỏi Đáp 10 Câu (5s/Câu)</span>
            {!playedToday && (
              <span className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[9px] font-black">
                MỚI
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playTabSwitch();
              setActiveTab('exchange');
            }}
            className={`py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'exchange'
                ? 'border-yellow-400 text-yellow-300 bg-red-950/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span>Đổi Cầu Thủ ({VIETNAM_CHRONICLES_CATALOG.length})</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider text-center py-2 px-4 border-b border-yellow-200 shrink-0">
          {feedbackMsg}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#130306] via-[#0b0305] to-[#050203]">
        <div className="max-w-7xl mx-auto">
          {/* TAB 1: DAILY 10-QUESTION QUIZ */}
          {activeTab === 'quiz' && (
            <div className="max-w-3xl mx-auto space-y-5">
              {!quizSession ? (
                <div className="bg-[#180509] border-2 border-yellow-400/75 p-5 sm:p-7 space-y-5 shadow-[0_0_32px_rgba(185,28,28,0.28)]">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-yellow-300 block">
                        THỬ THÁCH KIẾN THỨC BÓNG ĐÁ VIỆT NAM
                      </span>
                      <h2 className="font-black text-2xl sm:text-3xl text-white uppercase italic">
                        10 CÂU HỎI RANDOM HẰNG NGÀY
                      </h2>
                    </div>
                    <img
                      src={VIETNAM_CREST_URL}
                      alt="VFF"
                      className="w-14 h-14 object-contain shrink-0"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center tabular-nums">
                    <div className="bg-black/50 border border-yellow-400/35 p-3">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        Số Câu Mỗi Ngày
                      </div>
                      <div className="font-black text-xl text-white mt-0.5">
                        {VIETNAM_QUIZ_QUESTIONS_PER_DAY} Câu Random
                      </div>
                    </div>
                    <div className="bg-black/50 border border-rose-400/45 p-3">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        Thời Gian Mỗi Câu
                      </div>
                      <div className="font-black text-xl text-rose-300 mt-0.5">
                        {VIETNAM_QUIZ_SECONDS_PER_QUESTION} Giây / Câu
                      </div>
                    </div>
                    <div className="bg-black/50 border border-amber-400/55 p-3">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">
                        Thưởng Mỗi Câu Đúng
                      </div>
                      <div className="font-black text-xl text-yellow-300 mt-0.5">
                        +{VIETNAM_SHARDS_PER_CORRECT} Mảnh VN
                      </div>
                    </div>
                  </div>

                  {!playedToday ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        Trả lời đúng càng nhiều càng nhận nhiều{' '}
                        <strong className="text-yellow-300">Mảnh Việt Nam</strong> (tối đa{' '}
                        <strong className="text-yellow-300">500 Mảnh/ngày</strong>). Sau khi hết{' '}
                        {VIETNAM_QUIZ_SECONDS_PER_QUESTION} giây hệ thống sẽ tự khóa câu hiện tại.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleStartQuiz(false)}
                        className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 border-2 border-yellow-300 text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        <span>BẮT ĐẦU 10 CÂU HÔM NAY (NHẬN MẢNH VIỆT NAM)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      <div className="bg-emerald-950/60 border border-emerald-400/60 p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-300 font-black text-sm uppercase">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Hôm Nay Đã Hoàn Thành Lượt Nhận Mảnh</span>
                          </div>
                          <p className="text-xs text-slate-200 mt-1 tabular-nums">
                            Kết quả hôm nay:{' '}
                            <strong className="text-white">
                              {vnState.lastAttemptCorrect ?? 0}/{VIETNAM_QUIZ_QUESTIONS_PER_DAY} câu đúng
                            </strong>{' '}
                            · Đã nhận{' '}
                            <strong className="text-yellow-300">
                              +{(vnState.lastAttemptShardsEarned ?? 0).toLocaleString('vi-VN')} Mảnh Việt Nam
                            </strong>
                          </p>
                        </div>
                        <div className="px-3 py-1.5 bg-black/70 border border-cyan-400/50 text-center">
                          <div className="text-[9px] uppercase text-cyan-300 font-bold">
                            Lượt Mới Lúc 06:00
                          </div>
                          <div className="font-mono font-black text-sm text-white tabular-nums">
                            {resetCountdown}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleStartQuiz(true)}
                          className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/30 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 text-cyan-300" />
                          <span>LUYỆN TẬP THÊM (0 MẢNH)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundService.playClick();
                            setActiveTab('exchange');
                          }}
                          className="py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-200 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>ĐI ĐỔI CẦU THỦ VIỆT NAM →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : quizSession.finished ? (
                /* QUIZ FINISHED SUMMARY */
                <div className="bg-[#180509] border-2 border-yellow-400 p-6 sm:p-8 text-center space-y-5 shadow-[0_0_32px_rgba(250,204,21,0.22)]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/15 border border-yellow-400 text-yellow-300 text-xs font-black uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {quizSession.isPractice
                        ? 'KẾT QUẢ LUYỆN TẬP (KHÔNG CỘNG MẢNH)'
                        : 'HOÀN THÀNH THỬ THÁCH HẰNG NGÀY'}
                    </span>
                  </div>

                  <div className="font-mono font-black text-4xl sm:text-5xl text-white tabular-nums">
                    {quizSession.correctCount} / {quizSession.questions.length}
                  </div>
                  <p className="text-sm text-slate-200">
                    Số câu trả lời đúng về Bóng Đá Việt Nam
                  </p>

                  <div className="max-w-sm mx-auto bg-black/60 border border-yellow-400/60 p-4">
                    <div className="text-[11px] uppercase text-amber-200 font-bold">
                      Mảnh Việt Nam Nhận Được
                    </div>
                    <div className="font-mono font-black text-3xl text-yellow-300 mt-1 tabular-nums">
                      +{quizSession.shardsEarned.toLocaleString('vi-VN')} Mảnh
                    </div>
                    <div className="text-xs text-slate-400 mt-1 tabular-nums">
                      Tổng hiện có: {vietnamShards.toLocaleString('vi-VN')} Mảnh Việt Nam
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setQuizSession(null);
                      }}
                      className="py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/30 text-white font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      QUAY LẠI TRANG CHÍNH
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setQuizSession(null);
                        setActiveTab('exchange');
                      }}
                      className="py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-200 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      ĐỔI CẦU THỦ BẰNG MẢNH →
                    </button>
                  </div>
                </div>
              ) : (
                /* ACTIVE QUESTION SCREEN */
                currentQuestion && (
                  <div className="bg-[#180509] border-2 border-yellow-400/80 p-5 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs uppercase tabular-nums">
                          CÂU {quizSession.currentIndex + 1} / {quizSession.questions.length}
                        </span>
                        {quizSession.isPractice && (
                          <span className="px-2 py-1 bg-zinc-800 border border-white/25 text-slate-300 text-[10px] font-bold uppercase">
                            Luyện Tập (0 Mảnh)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 tabular-nums">
                        <span className="text-xs font-bold text-yellow-300">
                          Đúng: {quizSession.correctCount} (
                          {quizSession.isPractice
                            ? '0 Mảnh'
                            : `+${quizSession.correctCount * VIETNAM_SHARDS_PER_CORRECT} Mảnh`}
                          )
                        </span>
                        <span
                          className={`px-3 py-1 font-mono font-black text-sm border ${
                            questionTimeLeft <= 2
                              ? 'bg-rose-600 border-rose-300 text-white animate-pulse'
                              : 'bg-black/80 border-yellow-400 text-yellow-300'
                          }`}
                        >
                          {questionTimeLeft}s
                        </span>
                      </div>
                    </div>

                    {/* 5-second visual countdown bar */}
                    <div className="w-full h-2 bg-black/70 border border-white/15 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          questionTimeLeft <= 2 ? 'bg-rose-500' : 'bg-yellow-400'
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (questionTimeLeft / VIETNAM_QUIZ_SECONDS_PER_QUESTION) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <h3 className="font-black text-lg sm:text-xl text-white leading-snug">
                      {currentQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQuestion.options.map((opt, idx) => {
                        const answered = quizSession.selectedIndex !== null;
                        const isSelected = quizSession.selectedIndex === idx;
                        const isRight = idx === currentQuestion.correctIndex;

                        let btnCls =
                          'bg-black/60 hover:bg-red-950/70 border-white/25 text-white';
                        if (answered) {
                          if (isRight) {
                            btnCls =
                              'bg-emerald-900/80 border-emerald-400 text-emerald-100';
                          } else if (isSelected) {
                            btnCls = 'bg-rose-950/90 border-rose-400 text-rose-200';
                          } else {
                            btnCls = 'bg-black/40 border-white/10 text-slate-400';
                          }
                        }

                        const letter = ['A', 'B', 'C', 'D'][idx];
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={answered}
                            onClick={() => handleAnswerOption(idx)}
                            className={`p-3.5 border text-left transition-all flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${btnCls}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 shrink-0 bg-white/10 border border-white/25 flex items-center justify-center font-mono font-black text-xs">
                                {letter}
                              </span>
                              <span className="font-bold text-sm leading-snug">
                                {opt}
                              </span>
                            </div>
                            {answered && isRight && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            {answered && isSelected && !isRight && (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSession.selectedIndex !== null && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/15">
                        <div className="text-xs font-bold">
                          {quizSession.selectedIndex === -1 ? (
                            <span className="text-rose-300">
                              Hết {VIETNAM_QUIZ_SECONDS_PER_QUESTION} giây! Đáp án đúng:{' '}
                              <strong className="text-emerald-300">
                                {currentQuestion.options[currentQuestion.correctIndex]}
                              </strong>
                            </span>
                          ) : quizSession.selectedIndex === currentQuestion.correctIndex ? (
                            <span className="text-emerald-300">
                              Chính xác!{' '}
                              {quizSession.isPractice
                                ? '(Luyện tập 0 Mảnh)'
                                : `+${VIETNAM_SHARDS_PER_CORRECT} Mảnh Việt Nam`}
                            </span>
                          ) : (
                            <span className="text-rose-300">
                              Chưa chính xác! Đáp án đúng:{' '}
                              <strong className="text-emerald-300">
                                {currentQuestion.options[currentQuestion.correctIndex]}
                              </strong>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleNextOrFinish}
                          className="py-2.5 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                        >
                          {quizSession.currentIndex + 1 >= quizSession.questions.length
                            ? 'HOÀN TẤT & TỔNG KẾT →'
                            : 'CÂU TIẾP THEO →'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 2: SHARD EXCHANGE (>250 SHARDS, UNTRADEABLE) */}
          {activeTab === 'exchange' && (
            <div className="space-y-4">
              <div className="bg-[#180509] border border-yellow-400/50 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-200 leading-relaxed">
                    <strong className="text-yellow-300 uppercase">
                      QUY TẮC CHỈ SỐ &amp; GIAO DỊCH:
                    </strong>{' '}
                    OVR &amp; vị trí giữ chuẩn theo <strong className="text-white">RenderZ FC Mobile</strong> và cộng thêm{' '}
                    <strong className="text-yellow-300">+33 OVR</strong>. Mọi thẻ đều có giá đổi{' '}
                    <strong className="text-amber-300">từ 2.600 Mảnh Việt Nam trở lên</strong> và{' '}
                    <strong className="text-rose-300">KHÔNG GIAO DỊCH ĐƯỢC</strong> trên Thị Trường Chuyển Nhượng.
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      { id: 'ALL', label: 'Tất Cả' },
                      { id: 'ATT', label: 'Tiền Đạo' },
                      { id: 'MID', label: 'Tiền Vệ' },
                      { id: 'DEF', label: 'Hậu Vệ' },
                      { id: 'GK', label: 'Thủ Môn' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        soundService.playTabSwitch();
                        setPosFilter(f.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-black uppercase border cursor-pointer transition-colors ${
                        posFilter === f.id
                          ? 'bg-yellow-400 text-slate-950 border-yellow-200'
                          : 'bg-black/60 text-slate-300 border-white/20 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCatalog.map((item) => {
                  const isOwned = ownedSet.has(item.player.id);
                  const canAfford = vietnamShards >= item.shardCost;
                  return (
                    <div
                      key={item.player.id}
                      className="bg-[#140407] border border-yellow-400/45 hover:border-yellow-300 transition-all p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="px-2 py-0.5 bg-rose-950 border border-rose-400/60 text-rose-200 font-black text-[9px] uppercase tracking-wider">
                          KHÔNG GIAO DỊCH
                        </span>
                        <span className="px-2 py-0.5 bg-black/80 border border-amber-400/50 text-amber-200 font-mono font-bold text-[10px] tabular-nums">
                          RenderZ {item.renderzBaseOvr} + 33
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          soundService.playClick();
                          setInspectedItem(item);
                        }}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <FCCard player={item.player} size="md" showStats={false} />
                        <div className="mt-2 text-center">
                          <h4 className="font-black text-base text-white uppercase group-hover:text-yellow-300 transition-colors">
                            {item.player.name}
                          </h4>
                          <p className="text-[11px] text-amber-200/80 truncate max-w-[220px]">
                            {item.eraLabel}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 bg-black/60 border border-white/10 p-2 text-center font-mono text-[10px] tabular-nums">
                        <div>
                          <span className="text-slate-400 block">PAC</span>
                          <span className="text-white font-black">{item.player.pac}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">SHO</span>
                          <span className="text-white font-black">{item.player.sho}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">PAS</span>
                          <span className="text-white font-black">{item.player.pas}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            soundService.playClick();
                            setInspectedItem(item);
                          }}
                          className="w-full py-1.5 bg-black/70 hover:bg-white/10 border border-white/20 text-slate-200 font-bold text-[11px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Xem Chỉ Số Chi Tiết</span>
                        </button>

                        {isOwned ? (
                          <div className="w-full py-2.5 bg-emerald-950/75 border border-emerald-400/60 text-emerald-300 font-black text-xs uppercase text-center flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ĐÃ SỞ HỮU TRONG CLB</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleExchangePlayer(item)}
                            className={`w-full py-2.5 px-3 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                              canAfford
                                ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:brightness-105 text-slate-950 border-white'
                                : 'bg-zinc-900 text-slate-400 border-white/20 hover:border-rose-400/50'
                            }`}
                          >
                            {canAfford ? (
                              <Star className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="tabular-nums">
                              ĐỔI {item.shardCost.toLocaleString('vi-VN')} MẢNH VIỆT NAM
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Player Modal */}
      {inspectedItem && (
        <div
          onClick={() => setInspectedItem(null)}
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#120407] border-2 border-yellow-400 p-5 flex flex-col items-center gap-3 text-center"
          >
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-[10px] font-black uppercase tracking-wider">
              <span className="px-2 py-0.5 bg-rose-950 border border-rose-400/70 text-rose-200">
                KHÔNG GIAO DỊCH ĐƯỢC
              </span>
              <span className="px-2 py-0.5 bg-amber-950 border border-yellow-400/70 text-yellow-200 tabular-nums">
                RenderZ {inspectedItem.renderzBaseOvr} + 33 = {inspectedItem.player.ovr} OVR
              </span>
            </div>

            <FCCard player={inspectedItem.player} size="hero" showStats={true} />

            <div className="font-black text-xl text-white uppercase">
              {inspectedItem.player.fullName || inspectedItem.player.name}
            </div>
            <div className="text-xs text-amber-200 tabular-nums">
              {inspectedItem.player.position} · {inspectedItem.player.club} ·{' '}
              {inspectedItem.player.height} · Chân thuận: {inspectedItem.player.foot}
            </div>

            <div className="w-full grid grid-cols-6 gap-1.5 bg-black/70 border border-white/15 p-2.5 text-center tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">PAC</div>
                <div className="font-black text-sm text-yellow-300">
                  {inspectedItem.player.pac}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">SHO</div>
                <div className="font-black text-sm text-yellow-300">
                  {inspectedItem.player.sho}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PAS</div>
                <div className="font-black text-sm text-yellow-300">
                  {inspectedItem.player.pas}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DRI</div>
                <div className="font-black text-sm text-yellow-300">
                  {inspectedItem.player.dri}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DEF</div>
                <div className="font-black text-sm text-yellow-300">
                  {inspectedItem.player.def}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PHY</div>
                <div className="font-black text-sm text-yellow-300">
                  {inspectedItem.player.phy}
                </div>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/25 text-white font-black text-xs uppercase cursor-pointer"
              >
                Đóng
              </button>
              {ownedSet.has(inspectedItem.player.id) ? (
                <div className="py-2.5 bg-emerald-950 border border-emerald-400 text-emerald-300 font-black text-xs uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã Sở Hữu</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleExchangePlayer(inspectedItem)}
                  className="py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase cursor-pointer tabular-nums"
                >
                  Đổi {inspectedItem.shardCost.toLocaleString('vi-VN')} Mảnh
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Walkout Reveal when exchanging a Vietnam Chronicles player */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`BIÊN NIÊN SỬ VIỆT NAM · ${walkoutRewardCard.name.toUpperCase()} (${walkoutRewardCard.ovr} OVR)`}
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
