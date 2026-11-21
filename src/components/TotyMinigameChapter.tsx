import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Clock, RotateCcw, CheckCircle2, Trophy, HelpCircle } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import { totyFeaturedPlayers } from '../data/mockData';
import { soundService } from '../services/sound';
import { getTodayDateKey, formatTodayVN } from '../utils/dateUtils';

interface TotyMinigameChapterProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onShowToast: (text: string, tone?: 'success' | 'error') => void;
}

type FlashcardGameState = 'IDLE' | 'MEMORIZE' | 'PLAYING' | 'FINISHED';

interface FlashcardTile {
  uid: string;
  pairId: string;
  player: PlayerCard;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface FlashcardRewardTier {
  rank: 'S' | 'A' | 'B' | 'C';
  label: string;
  maxSeconds: number | null;
  timeRangeText: string;
  tokens: number;
}

export const FLASHCARD_REWARD_TIERS: FlashcardRewardTier[] = [
  {
    rank: 'S',
    label: 'Hạng S · Siêu Tốc',
    maxSeconds: 18,
    timeRangeText: '≤ 18 giây',
    tokens: 80,
  },
  {
    rank: 'A',
    label: 'Hạng A · Xuất Sắc',
    maxSeconds: 30,
    timeRangeText: '19 – 30 giây',
    tokens: 60,
  },
  {
    rank: 'B',
    label: 'Hạng B · Khá',
    maxSeconds: 45,
    timeRangeText: '31 – 45 giây',
    tokens: 40,
  },
  {
    rank: 'C',
    label: 'Hạng C · Hoàn Thành',
    maxSeconds: null,
    timeRangeText: '> 45 giây',
    tokens: 25,
  },
];

export function getFlashcardRewardForTime(seconds: number): FlashcardRewardTier {
  if (seconds <= 18) return FLASHCARD_REWARD_TIERS[0];
  if (seconds <= 30) return FLASHCARD_REWARD_TIERS[1];
  if (seconds <= 45) return FLASHCARD_REWARD_TIERS[2];
  return FLASHCARD_REWARD_TIERS[3];
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const TotyMinigameChapter: React.FC<TotyMinigameChapterProps> = ({
  user,
  onUpdateUser,
  onShowToast,
}) => {
  const todayKey = getTodayDateKey();
  const minigameTickets = user.minigameTickets ?? 0;
  const claimedFreeToday = user.lastMinigameTicketDate === todayKey;

  const [gameState, setGameState] = useState<FlashcardGameState>('IDLE');
  const [tiles, setTiles] = useState<FlashcardTile[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isCheckingPair, setIsCheckingPair] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [finalTier, setFinalTier] = useState<FlashcardRewardTier | null>(null);

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const memorizeTimeoutRef = useRef<number | null>(null);
  const pairTimeoutRef = useRef<number | null>(null);

  // Pool of iconic TOTY/UTOTY players with distinct portraits for clean flashcard matching
  const flashcardPool = useMemo(() => {
    const highOvr = totyFeaturedPlayers.filter((p) => p.ovr >= 94);
    return highOvr.length >= 8 ? highOvr : totyFeaturedPlayers.slice(0, 12);
  }, []);

  const clearAllTimers = () => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (memorizeTimeoutRef.current !== null) {
      window.clearTimeout(memorizeTimeoutRef.current);
      memorizeTimeoutRef.current = null;
    }
    if (pairTimeoutRef.current !== null) {
      window.clearTimeout(pairTimeoutRef.current);
      pairTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const handleClaimDailyFreeTicket = () => {
    soundService.playClick();
    const currentToday = getTodayDateKey();
    if (user.lastMinigameTicketDate === currentToday) {
      onShowToast('Bạn đã nhận 1 Vé Minigame miễn phí hôm nay rồi! Hãy quay lại vào ngày mai.', 'error');
      return;
    }
    soundService.playCoins();
    onUpdateUser({
      minigameTickets: (user.minigameTickets ?? 0) + 1,
      lastMinigameTicketDate: currentToday,
    });
    onShowToast('Đã nhận +1 Vé Minigame Miễn Phí hôm nay!');
  };

  const handleStartFlashcardGame = () => {
    soundService.playClick();
    if (gameState === 'PLAYING' || gameState === 'MEMORIZE') return;

    if (minigameTickets < 1) {
      onShowToast(
        claimedFreeToday
          ? 'Bạn đã hết Vé Minigame hôm nay! Mỗi ngày hệ thống tặng 1 Vé Minigame miễn phí.'
          : 'Hãy bấm "Nhận 1 Vé Free Hôm Nay" ở khung bên trái trước khi bắt đầu!',
        'error'
      );
      return;
    }

    clearAllTimers();

    // Deduct 1 Minigame ticket immediately upon starting round
    onUpdateUser({
      minigameTickets: Math.max(0, minigameTickets - 1),
    });

    // Pick 6 distinct superstars -> 12 flashcards (6 pairs)
    const chosenPlayers = shuffleArray(flashcardPool).slice(0, 6);
    const deck: FlashcardTile[] = shuffleArray(
      chosenPlayers.flatMap((player) => [
        {
          uid: `${player.id}_a`,
          pairId: player.id,
          player,
          isFlipped: true, // Shown briefly during 1.5s memorize phase
          isMatched: false,
        },
        {
          uid: `${player.id}_b`,
          pairId: player.id,
          player,
          isFlipped: true,
          isMatched: false,
        },
      ])
    );

    setTiles(deck);
    setSelectedIndices([]);
    setIsCheckingPair(false);
    setElapsedMs(0);
    setMovesCount(0);
    setFinalTier(null);
    setGameState('MEMORIZE');

    memorizeTimeoutRef.current = window.setTimeout(() => {
      setTiles((prev) => prev.map((t) => ({ ...t, isFlipped: false })));
      setGameState('PLAYING');
      startTimeRef.current = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);
    }, 1500);
  };

  const handleFlipCard = (idx: number) => {
    if (gameState !== 'PLAYING' || isCheckingPair) return;
    const target = tiles[idx];
    if (!target || target.isFlipped || target.isMatched) return;

    soundService.playClick();

    const nextTiles = tiles.map((t, i) => (i === idx ? { ...t, isFlipped: true } : t));
    const nextSelected = [...selectedIndices, idx];
    setTiles(nextTiles);
    setSelectedIndices(nextSelected);

    if (nextSelected.length === 2) {
      const [firstIdx, secondIdx] = nextSelected;
      const firstTile = nextTiles[firstIdx];
      const secondTile = nextTiles[secondIdx];
      setMovesCount((c) => c + 1);

      if (firstTile.pairId === secondTile.pairId) {
        // Pair matched!
        soundService.playCoins();
        const updatedTiles = nextTiles.map((t, i) =>
          i === firstIdx || i === secondIdx ? { ...t, isMatched: true, isFlipped: true } : t
        );
        setTiles(updatedTiles);
        setSelectedIndices([]);

        const allMatched = updatedTiles.every((t) => t.isMatched);
        if (allMatched) {
          if (timerIntervalRef.current !== null) {
            window.clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          const finalElapsedMs = Math.max(100, Date.now() - startTimeRef.current);
          const finalSec = Math.round((finalElapsedMs / 1000) * 10) / 10;
          const rewardTier = getFlashcardRewardForTime(finalSec);

          setElapsedMs(finalElapsedMs);
          setFinalTier(rewardTier);
          setGameState('FINISHED');

          soundService.playPackOpenFanfare();
          try {
            confetti({
              particleCount: 90,
              spread: 85,
              origin: { y: 0.58 },
            });
          } catch {}

          onUpdateUser({
            totyTokens: (user.totyTokens ?? 0) + rewardTier.tokens,
          });
          onShowToast(
            `Hoàn thành sau ${finalSec.toFixed(1)}s (${rewardTier.label})! Nhận +${rewardTier.tokens} Token TOTY!`
          );
        }
      } else {
        // Mismatch -> flip back after brief 550ms peek
        setIsCheckingPair(true);
        pairTimeoutRef.current = window.setTimeout(() => {
          setTiles((prev) =>
            prev.map((t, i) =>
              i === firstIdx || i === secondIdx ? { ...t, isFlipped: false } : t
            )
          );
          setSelectedIndices([]);
          setIsCheckingPair(false);
        }, 550);
      }
    }
  };

  const elapsedSecondsDisplay = (elapsedMs / 1000).toFixed(1);
  const matchedPairsCount = tiles.filter((t) => t.isMatched).length / 2;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="shrink-0 flex items-stretch gap-6"
    >
      {/* ================================================================= */}
      {/* PANEL 1: CHAPTER 5 BANNER, DAILY FREE TICKET & TIME REWARD TABLE   */}
      {/* ================================================================= */}
      <div className="shrink-0 w-[90vw] max-w-[470px] rounded-none bg-slate-950/90 backdrop-blur-md border-2 border-yellow-400/60 p-5 flex flex-col justify-between gap-4 shadow-2xl">
        {/* Untouched Minigame Header Banner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/minigameicon_S10_TOTY26_83c86f52.png"
                alt="TOTY Minigame"
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-contain shrink-0"
              />
              <div>
                <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider block">
                  Chương 5 · Sự Kiện TOTY 26
                </span>
                <h2 className="font-cruyff font-black text-xl text-white uppercase italic leading-tight">
                  MINIGAME LẬT THẺ FLASHCARD
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-blue-950/90 border border-cyan-400/50 font-mono text-xs font-black text-cyan-200 tabular-nums shrink-0">
              <img
                src="/assets/aistudio/v__minigame_ch__ng_5_4a6d531e.png"
                alt="Vé Minigame"
                referrerPolicy="no-referrer"
                className="w-5 h-5 object-contain"
              />
              <span>{minigameTickets} Vé</span>
            </div>
          </div>

          <div className="rounded-none overflow-hidden border border-yellow-400/45 bg-black/60 shadow-lg">
            <img
              src="/assets/aistudio/minigamebanner_S10_TOTY26_b2a0f35e.png"
              alt="TOTY Minigame Banner"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain block pointer-events-none select-none"
            />
          </div>
        </div>

        {/* Daily Free Ticket Box */}
        <div className="p-3.5 rounded-none bg-blue-950/60 border border-cyan-400/35 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/v__minigame_ch__ng_5_4a6d531e.png"
              alt="Vé Minigame Miễn Phí"
              referrerPolicy="no-referrer"
              className="w-11 h-11 object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="font-cruyff font-black text-sm text-white uppercase">
                Vé Minigame Miễn Phí Mỗi Ngày
              </div>
              <p className="text-xs text-cyan-200/90 mt-0.5">
                {claimedFreeToday
                  ? `Đã nhận vé ngày ${formatTodayVN()} · Làm mới 00:00 ngày mai`
                  : 'Nhận 1 Vé Minigame miễn phí mỗi ngày để mở bàn Flashcard'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={claimedFreeToday}
            onClick={handleClaimDailyFreeTicket}
            className={`px-4 py-2.5 rounded-none font-cruyff font-black text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
              claimedFreeToday
                ? 'bg-white/10 text-gray-400 border border-white/10 cursor-default'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg active:scale-95 cursor-pointer'
            }`}
          >
            {claimedFreeToday ? 'Đã Nhận Hôm Nay' : 'Nhận 1 Vé Free'}
          </button>
        </div>

        {/* Time-based Token TOTY Payout Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="font-bold uppercase tracking-wider text-yellow-300">
              Mốc Thưởng Token TOTY Theo Thời Gian
            </span>
            <span className="font-mono tabular-nums text-gray-400">6 cặp thẻ · 12 ô</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FLASHCARD_REWARD_TIERS.map((tier) => (
              <div
                key={tier.rank}
                className="px-3 py-2 rounded-none bg-black/55 border border-white/12 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-cruyff font-bold text-xs text-white">{tier.label}</div>
                  <div className="font-mono text-[11px] text-gray-400 tabular-nums">
                    {tier.timeRangeText}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono font-black text-xs text-yellow-300 tabular-nums shrink-0">
                  <img
                    src="/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png"
                    alt="Token TOTY"
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 object-contain"
                  />
                  <span>+{tier.tokens}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PANEL 2: INTERACTIVE 4x3 FLASHCARD MEMORY BOARD                    */}
      {/* ================================================================= */}
      <div className="shrink-0 w-[92vw] max-w-[620px] rounded-none bg-gradient-to-b from-blue-950/90 via-slate-950/95 to-black border-2 border-yellow-400/65 p-5 flex flex-col justify-between gap-4 shadow-2xl">
        {/* Top Board HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
          <div>
            <h3 className="font-cruyff font-black text-lg sm:text-xl text-white uppercase italic">
              BÀN LẬT THẺ TRÍ NHỚ SIÊU SAO TOTY
            </h3>
            <p className="text-xs text-gray-300">
              {gameState === 'MEMORIZE'
                ? 'Hãy ghi nhớ nhanh vị trí 6 cặp cầu thủ trên bàn!'
                : gameState === 'PLAYING'
                ? 'Lật 2 thẻ giống nhau nhanh nhất để nhận tối đa 80 Token TOTY!'
                : gameState === 'FINISHED'
                ? 'Đã ghép hoàn tất toàn bộ 6 cặp cầu thủ!'
                : 'Sử dụng 1 Vé Minigame để bắt đầu lượt lật thẻ tính giờ'}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
            <div className="px-3 py-1.5 rounded-none bg-black/65 border border-yellow-400/40 flex items-center gap-1.5 text-yellow-300 font-bold">
              <Clock className="w-4 h-4" />
              <span>{elapsedSecondsDisplay}s</span>
            </div>
            <div className="px-3 py-1.5 rounded-none bg-black/65 border border-white/15 text-cyan-200 font-bold">
              Cặp: {matchedPairsCount}/6 · Lượt: {movesCount}
            </div>
          </div>
        </div>

        {/* Active Board or Idle/Victory State */}
        {gameState === 'IDLE' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 gap-4 bg-black/45 rounded-none border border-white/10">
            <img
              src="/assets/aistudio/minigameicon_S10_TOTY26_83c86f52.png"
              alt="Flashcard TOTY"
              referrerPolicy="no-referrer"
              className="w-20 h-20 object-contain drop-shadow-[0_8px_20px_rgba(234,179,8,0.35)]"
            />
            <div className="max-w-md space-y-1.5">
              <h4 className="font-cruyff font-black text-xl text-white uppercase italic">
                SẴN SÀNG THỬ THÁCH TRÍ NHỚ TOTY
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Bạn sẽ có <strong className="text-yellow-300">1.5 giây</strong> xem trước vị trí 12 thẻ
                cầu thủ (6 cặp). Ghép đúng toàn bộ càng nhanh, lượng{' '}
                <strong className="text-yellow-300">Token TOTY</strong> nhận về càng lớn!
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartFlashcardGame}
              className="px-6 py-3 rounded-none bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 text-black font-cruyff font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-lg active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
            >
              <img
                src="/assets/aistudio/v__minigame_ch__ng_5_4a6d531e.png"
                alt="Vé Minigame"
                referrerPolicy="no-referrer"
                className="w-5 h-5 object-contain"
              />
              <span>Dùng 1 Vé Bắt Đầu Chơi</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-3">
            {/* 4x3 Flashcard Grid */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {tiles.map((tile, idx) => {
                const faceUp = tile.isFlipped || tile.isMatched;
                return (
                  <button
                    key={tile.uid}
                    type="button"
                    disabled={faceUp || gameState !== 'PLAYING'}
                    onClick={() => handleFlipCard(idx)}
                    className={`relative h-24 sm:h-28 rounded-none border transition-all duration-150 overflow-hidden flex flex-col items-center justify-center p-1.5 select-none ${
                      tile.isMatched
                        ? 'bg-gradient-to-b from-amber-500/30 via-yellow-900/40 to-zinc-950 border-yellow-400 shadow-[0_0_16px_rgba(234,179,8,0.35)] cursor-default'
                        : faceUp
                        ? 'bg-gradient-to-b from-blue-900/90 to-zinc-950 border-cyan-300 cursor-default scale-[1.02]'
                        : 'bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-950 border-yellow-400/35 hover:border-yellow-300 hover:scale-[1.02] active:scale-95 cursor-pointer'
                    }`}
                  >
                    {faceUp ? (
                      <>
                        <div className="w-full flex items-center justify-between px-1 text-[10px] font-mono font-black leading-none tabular-nums">
                          <span className="text-yellow-300">{tile.player.ovr}</span>
                          <span className="text-cyan-200">{tile.player.position}</span>
                        </div>
                        <img
                          src={tile.player.avatarUrl}
                          alt={tile.player.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (tile.player.avatarFallbackUrl) {
                              e.currentTarget.src = tile.player.avatarFallbackUrl;
                            }
                          }}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain my-0.5 pointer-events-none"
                        />
                        <span className="w-full text-center font-cruyff font-bold text-[10px] sm:text-xs text-white truncate px-1">
                          {tile.player.name}
                        </span>
                        {tile.isMatched && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute bottom-1 right-1" />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <img
                          src="/assets/aistudio/minigameicon_S10_TOTY26_83c86f52.png"
                          alt="TOTY Card Back"
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 sm:w-12 sm:h-12 object-contain pointer-events-none"
                        />
                        <span className="font-cruyff font-bold text-[10px] text-yellow-200/85 uppercase tracking-wider">
                          TOTY 26
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Summary / Play Again Bar when Finished */}
            {gameState === 'FINISHED' && finalTier ? (
              <div className="p-3 rounded-none bg-amber-500/15 border border-yellow-400/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-yellow-300 shrink-0" />
                  <div>
                    <div className="font-cruyff font-black text-sm text-yellow-300 uppercase">
                      {finalTier.label} · Thời gian {elapsedSecondsDisplay}s · Nhận +{finalTier.tokens} Token TOTY
                    </div>
                    <div className="text-xs text-gray-200">
                      Token TOTY đã được cộng trực tiếp vào tài khoản của bạn!
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartFlashcardGame}
                  className="px-4 py-2 rounded-none bg-yellow-400 hover:bg-yellow-300 text-black font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Chơi Tiếp (1 Vé)</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-gray-300 px-1">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Mẹo: Hoàn thành trong 18 giây đầu để đạt Hạng S (+80 Token TOTY)</span>
                </span>
                <span className="font-mono tabular-nums text-yellow-300 font-bold">
                  Token hiện có: {(user.totyTokens ?? 0).toLocaleString('vi-VN')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
