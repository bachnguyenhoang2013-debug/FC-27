import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Lock,
  Clock,
  Mic,
  Sparkles,
  ChevronRight,
  RotateCcw,
  X,
  Trophy,
  Flame,
  Shield,
  Sliders,
} from 'lucide-react';
import {
  UserProfile,
  PlayerCard,
  FutureStarsDailyProgress,
} from '../types/game';
import {
  totyFeaturedPlayers,
  futureStarsPlayers,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
} from '../data/mockData';
import { FCCard } from './FCCard';
import { PackTier } from './PackOpeningModal';
import { soundService } from '../services/sound';
import {
  getFutureStarsCycleKey,
  getCountdownToNext6AM,
} from '../utils/dateUtils';
import {
  FutureStarsTrainingLogo,
  FutureStarsMatchLogo,
  FutureStarsGiftLogo,
  FutureStarsExchangeLogo,
} from './GameUiIcons';

interface FutureStarsEventChapterProps {
  user: UserProfile;
  starters: PlayerCard[];
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenFutureStarsPack: (tier: PackTier, customName: string) => void;
  onGoToFutureStarsSpin: () => void;
  onInspectPlayer: (player: PlayerCard) => void;
  onShowToast: (text: string, tone?: 'success' | 'error') => void;
}

interface FlashbackCardItem {
  uid: string;
  pairId: string;
  player: PlayerCard;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MiniPitchPlayer {
  id: string;
  name: string;
  pos: string;
  ovr: number;
  x: number;
  y: number;
  isGk: boolean;
}

type MatchOpponentTier = 'A_70' | 'B_85';

const FUTURE_STARS_SQUAD_NAMES: Array<{ name: string; pos: string; x: number; y: number; isGk: boolean }> = [
  { name: 'Esposito', pos: 'ST', x: 36, y: 50, isGk: false },
  { name: 'Doué', pos: 'LW', x: 41, y: 78, isGk: false },
  { name: 'Estevão', pos: 'RW', x: 41, y: 22, isGk: false },
  { name: 'Nico Paz', pos: 'CAM', x: 51, y: 50, isGk: false },
  { name: 'Zaïre-Emery', pos: 'CM', x: 58, y: 68, isGk: false },
  { name: 'Camara', pos: 'CDM', x: 61, y: 34, isGk: false },
  { name: 'Dorgu', pos: 'LB', x: 76, y: 82, isGk: false },
  { name: 'Cubarsí', pos: 'CB', x: 78, y: 60, isGk: false },
  { name: 'Huijsen', pos: 'CB', x: 78, y: 40, isGk: false },
  { name: 'Vušković', pos: 'RB', x: 76, y: 18, isGk: false },
  { name: 'Restes GK', pos: 'GK', x: 93, y: 50, isGk: true },
];

const USER_DEFAULT_SLOTS: Array<{ x: number; y: number; isGk: boolean }> = [
  { x: 62, y: 50, isGk: false },
  { x: 58, y: 22, isGk: false },
  { x: 58, y: 78, isGk: false },
  { x: 45, y: 34, isGk: false },
  { x: 42, y: 50, isGk: false },
  { x: 45, y: 66, isGk: false },
  { x: 24, y: 18, isGk: false },
  { x: 22, y: 38, isGk: false },
  { x: 22, y: 62, isGk: false },
  { x: 24, y: 82, isGk: false },
  { x: 7, y: 50, isGk: true },
];

function shuffleItems<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const clampNum = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const FutureStarsEventChapter: React.FC<FutureStarsEventChapterProps> = ({
  user,
  starters,
  onUpdateUser,
  onOpenFutureStarsPack,
  onGoToFutureStarsSpin,
  onInspectPlayer,
  onShowToast,
}) => {
  // Live 06:00 AM reset clock
  const [cycleKey, setCycleKey] = useState<string>(() => getFutureStarsCycleKey(new Date()));
  const [countdownText, setCountdownText] = useState<string>(() => getCountdownToNext6AM(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      setCycleKey(getFutureStarsCycleKey(now));
      setCountdownText(getCountdownToNext6AM(now));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Resolve current 06:00 AM daily progress
  const dailyProgress: FutureStarsDailyProgress = useMemo(() => {
    if (user.futureStarsDaily && user.futureStarsDaily.cycleKey === cycleKey) {
      return user.futureStarsDaily;
    }
    return {
      cycleKey,
      trainingCompleted: false,
      matchACompleted: false,
      matchBCompleted: false,
      rewardClaimed: false,
    };
  }, [user.futureStarsDaily, cycleKey]);

  const exchangeRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // STEP 1 MODAL: SIMPLE FLASHBACK TRAINING MINIGAME
  // ============================================================================
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [fbPhase, setFbPhase] = useState<'MEMORIZE' | 'PLAYING' | 'WON'>('MEMORIZE');
  const [fbCards, setFbCards] = useState<FlashbackCardItem[]>([]);
  const [fbSelected, setFbSelected] = useState<number[]>([]);
  const [fbLocked, setFbLocked] = useState(false);
  const [fbMoves, setFbMoves] = useState(0);
  const fbTimeoutRef = useRef<number | null>(null);

  const openTrainingDrill = () => {
    soundService.playClick();
    if (dailyProgress.trainingCompleted) {
      onShowToast('Bạn đã hoàn thành bài Tập Luyện hôm nay! Làm mới lúc 06:00 sáng.', 'error');
      return;
    }

    const chosen4 = shuffleItems(futureStarsPlayers).slice(0, 4);
    const deck: FlashbackCardItem[] = shuffleItems(
      chosen4.flatMap((p) => [
        { uid: `${p.id}_1`, pairId: p.id, player: p, isFlipped: true, isMatched: false },
        { uid: `${p.id}_2`, pairId: p.id, player: p, isFlipped: true, isMatched: false },
      ])
    );

    setFbCards(deck);
    setFbSelected([]);
    setFbLocked(true);
    setFbMoves(0);
    setFbPhase('MEMORIZE');
    setShowTrainingModal(true);

    if (fbTimeoutRef.current) window.clearTimeout(fbTimeoutRef.current);
    fbTimeoutRef.current = window.setTimeout(() => {
      setFbCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setFbLocked(false);
      setFbPhase('PLAYING');
    }, 1600);
  };

  useEffect(() => {
    return () => {
      if (fbTimeoutRef.current) window.clearTimeout(fbTimeoutRef.current);
    };
  }, []);

  const handleFlipTrainingCard = (index: number) => {
    if (fbPhase !== 'PLAYING' || fbLocked) return;
    const card = fbCards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    soundService.playClick();
    const updated = fbCards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
    const nextSel = [...fbSelected, index];
    setFbCards(updated);
    setFbSelected(nextSel);

    if (nextSel.length === 2) {
      setFbMoves((m) => m + 1);
      const [i1, i2] = nextSel;
      if (updated[i1].pairId === updated[i2].pairId) {
        soundService.playCoins();
        const matched = updated.map((c, idx) =>
          idx === i1 || idx === i2 ? { ...c, isMatched: true, isFlipped: true } : c
        );
        setFbCards(matched);
        setFbSelected([]);

        if (matched.every((c) => c.isMatched)) {
          setFbPhase('WON');
          soundService.playPackOpenFanfare();
          const nextDaily: FutureStarsDailyProgress = {
            ...dailyProgress,
            cycleKey,
            trainingCompleted: true,
          };
          onUpdateUser({
            coins: user.coins + 15000,
            futureStarsDaily: nextDaily,
          });
          onShowToast('Hoàn thành Tập Luyện Flashback! Mở khóa Trận Đấu Future Stars A (70 OVR) & +15,000 Xu!');
        }
      } else {
        setFbLocked(true);
        fbTimeoutRef.current = window.setTimeout(() => {
          setFbCards((prev) =>
            prev.map((c, idx) => (idx === i1 || idx === i2 ? { ...c, isFlipped: false } : c))
          );
          setFbSelected([]);
          setFbLocked(false);
        }, 700);
      }
    }
  };

  // ============================================================================
  // STEP 2 & 3 MODAL: 11v11 TACTICAL MATCH VS FUTURE STARS A (70 OVR) / B (85 OVR)
  // ============================================================================
  const [activeMatchTier, setActiveMatchTier] = useState<MatchOpponentTier | null>(null);
  const [matchSecondsLeft, setMatchSecondsLeft] = useState<number>(30);
  const [userGoals, setUserGoals] = useState<number>(0);
  const [oppGoals, setOppGoals] = useState<number>(0);
  const [tactic, setTactic] = useState<'attacking' | 'balanced' | 'defensive'>('balanced');
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [userEntities, setUserEntities] = useState<MiniPitchPlayer[]>([]);
  const [oppEntities, setOppEntities] = useState<MiniPitchPlayer[]>([]);
  const [commentary, setCommentary] = useState<string>(
    'Trọng tài nổi còi khai cuộc thử thách Future Stars!'
  );
  const [matchResultState, setMatchResultState] = useState<
    'PLAYING' | 'WIN' | 'PENALTY_WIN' | 'LOSE'
  >('PLAYING');

  const opponentTargetOvr = activeMatchTier === 'A_70' ? 70 : 85;
  const opponentTeamTitle =
    activeMatchTier === 'A_70' ? 'Future Stars A (70 OVR)' : 'Future Stars B (85 OVR)';

  const startFutureStarsMatch = (tier: MatchOpponentTier) => {
    soundService.playClick();
    if (tier === 'A_70') {
      if (!dailyProgress.trainingCompleted) {
        onShowToast('Hãy hoàn thành Bước 1: Tập Luyện Flashback trước!', 'error');
        return;
      }
      if (dailyProgress.matchACompleted) {
        onShowToast('Bạn đã vượt qua Future Stars A hôm nay rồi!', 'error');
        return;
      }
    } else {
      if (!dailyProgress.matchACompleted) {
        onShowToast('Hãy chiến thắng Trận Đấu Future Stars A (70 OVR) trước!', 'error');
        return;
      }
      if (dailyProgress.matchBCompleted) {
        onShowToast('Bạn đã vượt qua Future Stars B hôm nay rồi!', 'error');
        return;
      }
    }

    const targetOvr = tier === 'A_70' ? 70 : 85;
    const initialUserPlayers: MiniPitchPlayer[] = Array.from({ length: 11 }).map((_, idx) => {
      const card = starters[idx] || starters[0] || totyFeaturedPlayers[0];
      const isGk = card.position === 'GK' || idx === 10;
      const slot = USER_DEFAULT_SLOTS[idx] || { x: 40, y: 50, isGk };
      return {
        id: `u_${idx}_${card.id}`,
        name: card.name,
        pos: isGk ? 'GK' : card.position,
        ovr: card.ovr,
        x: isGk ? 7 : slot.x,
        y: isGk ? 50 : slot.y,
        isGk,
      };
    });

    const initialOppPlayers: MiniPitchPlayer[] = FUTURE_STARS_SQUAD_NAMES.map((item, idx) => ({
      id: `fs_opp_${idx}`,
      name: item.name,
      pos: item.pos,
      ovr: targetOvr,
      x: item.x,
      y: item.y,
      isGk: item.isGk,
    }));

    setUserEntities(initialUserPlayers);
    setOppEntities(initialOppPlayers);
    setBallPos({ x: 50, y: 50 });
    setMatchSecondsLeft(30);
    setUserGoals(0);
    setOppGoals(0);
    setTactic('balanced');
    setCommentary(
      `Trận đấu bắt đầu! ${user.teamName} (${user.ovr} OVR) đối đầu ${
        tier === 'A_70' ? 'Future Stars A (70 OVR)' : 'Future Stars B (85 OVR)'
      }!`
    );
    setMatchResultState('PLAYING');
    setActiveMatchTier(tier);
  };

  useEffect(() => {
    if (!activeMatchTier || matchResultState !== 'PLAYING') return;

    const interval = window.setInterval(() => {
      setMatchSecondsLeft((prevSec) => {
        if (prevSec <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prevSec - 1;
      });

      // Every 1 second: move 11v11 players (GK stays strictly inside penalty box) & compute attack/defense
      const ovrDiff = user.ovr - opponentTargetOvr;
      const tacticShift = tactic === 'attacking' ? 8 : tactic === 'defensive' ? -7 : 0;

      setBallPos((prevBall) => {
        const pushX = (Math.random() - 0.46) * 26 + clampNum(ovrDiff * 0.45, -10, 14) + tacticShift * 0.5;
        const nextX = clampNum(prevBall.x + pushX, 10, 90);
        const nextY = clampNum(prevBall.y + (Math.random() - 0.5) * 32, 16, 84);

        // Move user 11 players (GK stays inside left penalty box x: 4..14, y: 38..62)
        setUserEntities((prevList) =>
          prevList.map((p, idx) => {
            if (p.isGk) {
              return {
                ...p,
                x: clampNum(6 + (nextX < 28 ? 3 : 0), 5, 13),
                y: clampNum(50 + (nextY - 50) * 0.25, 38, 62),
              };
            }
            const base = USER_DEFAULT_SLOTS[idx] || { x: 42, y: 50 };
            const shift =
              (nextX - 50) * 0.28 + (tactic === 'attacking' ? 7 : tactic === 'defensive' ? -7 : 0);
            return {
              ...p,
              x: clampNum(base.x + shift + (Math.random() - 0.5) * 6, 16, 88),
              y: clampNum(base.y + (nextY - 50) * 0.18 + (Math.random() - 0.5) * 6, 10, 90),
            };
          })
        );

        // Move opponent 11 Future Stars players (GK stays inside right penalty box x: 87..95, y: 38..62)
        setOppEntities((prevList) =>
          prevList.map((p, idx) => {
            if (p.isGk) {
              return {
                ...p,
                x: clampNum(93 - (nextX > 72 ? 3 : 0), 87, 95),
                y: clampNum(50 + (nextY - 50) * 0.25, 38, 62),
              };
            }
            const base = FUTURE_STARS_SQUAD_NAMES[idx] || { x: 55, y: 50 };
            const shift = (nextX - 50) * 0.25;
            return {
              ...p,
              x: clampNum(base.x + shift + (Math.random() - 0.5) * 6, 12, 84),
              y: clampNum(base.y + (nextY - 50) * 0.18 + (Math.random() - 0.5) * 6, 10, 90),
            };
          })
        );

        // Scoring probability check
        const userScoreChance = clampNum(
          0.11 + ovrDiff * 0.0055 + (tactic === 'attacking' ? 0.035 : tactic === 'defensive' ? -0.02 : 0),
          0.04,
          0.28
        );
        const oppScoreChance = clampNum(
          0.075 - ovrDiff * 0.004 + (tactic === 'attacking' ? 0.025 : tactic === 'defensive' ? -0.025 : 0),
          0.02,
          0.2
        );

        if (nextX > 74 && Math.random() < userScoreChance) {
          const scorer =
            starters[Math.floor(Math.random() * Math.min(6, starters.length))]?.name || 'Tiền đạo CLB';
          soundService.playCoins();
          setUserGoals((g) => g + 1);
          setCommentary(`VÀOOO! ${scorer} dứt điểm hiểm hóc tung lưới ${opponentTeamTitle}!`);
          return { x: 50, y: 50 };
        }

        if (nextX < 26 && Math.random() < oppScoreChance) {
          const oppScorer = FUTURE_STARS_SQUAD_NAMES[Math.floor(Math.random() * 5)].name;
          setOppGoals((g) => g + 1);
          setCommentary(`Nguy hiểm! ${oppScorer} bên phía ${opponentTeamTitle} ghi bàn rút ngắn tỷ số!`);
          return { x: 50, y: 50 };
        }

        if (Math.random() < 0.35) {
          const lines = [
            `${user.teamName} đang phối hợp trung lộ áp sát vòng cấm Future Stars.`,
            `Các tài năng trẻ ${opponentTeamTitle} pressing rất rát ở khu vực giữa sân!`,
            `Thủ môn đang chỉ huy hàng phòng ngự bọc lót kín kẽ trong vòng cấm.`,
          ];
          setCommentary(lines[Math.floor(Math.random() * lines.length)]);
        }

        return { x: nextX, y: nextY };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeMatchTier, matchResultState, user.ovr, user.teamName, opponentTargetOvr, opponentTeamTitle, tactic, starters]);

  // Conclude match when timer hits 0
  useEffect(() => {
    if (!activeMatchTier || matchResultState !== 'PLAYING' || matchSecondsLeft > 0) return;

    const didWinRegular = userGoals > oppGoals;
    const isDraw = userGoals === oppGoals;
    // Penalty shootout tiebreaker weighted by OVR so draws cleanly resolve
    const wonPenalties = isDraw && Math.random() < clampNum(0.62 + (user.ovr - opponentTargetOvr) * 0.015, 0.35, 0.9);

    if (didWinRegular || wonPenalties) {
      const nextState = didWinRegular ? 'WIN' : 'PENALTY_WIN';
      setMatchResultState(nextState);
      soundService.playPackOpenFanfare();

      const bonusCoins = activeMatchTier === 'A_70' ? 25000 : 40000;
      const nextDaily: FutureStarsDailyProgress = {
        ...dailyProgress,
        cycleKey,
        matchACompleted: activeMatchTier === 'A_70' ? true : dailyProgress.matchACompleted,
        matchBCompleted: activeMatchTier === 'B_85' ? true : dailyProgress.matchBCompleted,
      };
      onUpdateUser({
        coins: user.coins + bonusCoins,
        futureStarsDaily: nextDaily,
      });
      setCommentary(
        didWinRegular
          ? `Hết giờ! Chiến thắng thuyết phục trước ${opponentTeamTitle}!`
          : `Hết giờ hòa kịch tính! ${user.teamName} giành chiến thắng trên chấm luân lưu 11m!`
      );
    } else {
      setMatchResultState('LOSE');
      setCommentary(
        `Hết giờ! ${opponentTeamTitle} giành chiến thắng. Hãy điều chỉnh chiến thuật và đá lại để vượt ải!`
      );
    }
  }, [
    activeMatchTier,
    matchResultState,
    matchSecondsLeft,
    userGoals,
    oppGoals,
    user.ovr,
    user.coins,
    user.teamName,
    opponentTargetOvr,
    opponentTeamTitle,
    dailyProgress,
    cycleKey,
    onUpdateUser,
  ]);

  // ============================================================================
  // STEP 4: CLAIM 1 FUTURE STARS TICKET
  // ============================================================================
  const canClaimDailyTicket =
    dailyProgress.trainingCompleted &&
    dailyProgress.matchACompleted &&
    dailyProgress.matchBCompleted &&
    !dailyProgress.rewardClaimed;

  const handleClaimDailyFutureStarsTicket = () => {
    if (!canClaimDailyTicket) return;
    soundService.playPackOpenFanfare();
    try {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#38BDF8', '#E879F9', '#C084FC', '#FFFFFF'],
      });
    } catch {}

    const nextDaily: FutureStarsDailyProgress = {
      ...dailyProgress,
      cycleKey,
      rewardClaimed: true,
    };

    onUpdateUser({
      futureStarsTickets: (user.futureStarsTickets ?? 0) + 1,
      futureStarsDaily: nextDaily,
    });

    onShowToast('Chúc mừng! Bạn đã nhận +1 Vé Future Stars hôm nay (làm mới lúc 06:00 sáng)!');
  };

  // ============================================================================
  // SECTION B: FUTURE STARS EXCHANGE -> GÓI CẦU THỦ FUTURE STARS 90-95
  // ============================================================================
  const [selectedFodderIds, setSelectedFodderIds] = useState<string[]>([]);

  // Reserve cards eligible for squad-building exchange: MUST have OVR 87+ and exclude active 11 starters
  const reserveExchangePool = useMemo(() => {
    const ownedIds = user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS;
    const starterSet = new Set(user.starterIds?.length ? user.starterIds : STARTER_STARTER_IDS);
    const map = new Map<string, PlayerCard>();
    totyFeaturedPlayers.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });

    const list: PlayerCard[] = [];
    ownedIds.forEach((id) => {
      if (starterSet.has(id)) return;
      const card = map.get(id);
      if (card && card.ovr >= 87) {
        list.push(card);
      }
    });
    return list.sort((a, b) => a.ovr - b.ovr);
  }, [user.ownedPlayerIds, user.starterIds]);

  const futureStars90to95Preview = useMemo(
    () => futureStarsPlayers.filter((p) => p.ovr >= 90 && p.ovr <= 95),
    []
  );

  // Clean up stale selected fodder IDs
  useEffect(() => {
    const validIds = new Set(reserveExchangePool.map((p) => p.id));
    setSelectedFodderIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [reserveExchangePool]);

  const toggleSelectFodder = (id: string) => {
    soundService.playClick();
    const targetCard = reserveExchangePool.find((p) => p.id === id);
    if (!targetCard || targetCard.ovr < 87) {
      onShowToast('Cầu thủ trao đổi phải có chỉ số từ 87+ OVR!', 'error');
      return;
    }
    setSelectedFodderIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) {
        onShowToast('Đã chọn đủ 3 cầu thủ 87+ OVR để trao đổi!', 'error');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAutoFillFodder = () => {
    soundService.playClick();
    if (reserveExchangePool.length < 3) {
      onShowToast(
        `Cần ít nhất 3 cầu thủ dự trữ có OVR 87+ (ngoài 11 đá chính). Hiện có ${reserveExchangePool.length} cầu thủ 87+ OVR!`,
        'error'
      );
      return;
    }
    setSelectedFodderIds(reserveExchangePool.slice(0, 3).map((p) => p.id));
    onShowToast('Đã tự động chọn 3 cầu thủ dự trữ 87+ OVR thấp nhất để trao đổi!');
  };

  const EXCHANGE_COIN_FEE = 40000;
  const EXCHANGE_TOKEN_COST = 80;

  const handleExchangeByPlayers = () => {
    soundService.playClick();
    const validSelected = reserveExchangePool.filter(
      (p) => selectedFodderIds.includes(p.id) && p.ovr >= 87
    );
    if (validSelected.length < 3) {
      onShowToast('Hãy chọn đủ 3 cầu thủ dự trữ đạt 87+ OVR để trao đổi Gói Future Stars 90–95!', 'error');
      return;
    }
    if (user.coins < EXCHANGE_COIN_FEE) {
      onShowToast(
        `Cần ${EXCHANGE_COIN_FEE.toLocaleString('vi-VN')} Xu phí trao đổi (Hiện có ${user.coins.toLocaleString('vi-VN')} Xu)!`,
        'error'
      );
      return;
    }

    const fodderSet = new Set(validSelected.slice(0, 3).map((p) => p.id));
    const currentOwned = user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS;
    const nextOwned = currentOwned.filter((id) => !fodderSet.has(id));
    const nextBench = (user.benchIds ?? []).filter((id) => !fodderSet.has(id));

    soundService.playPackTear();
    onUpdateUser({
      coins: user.coins - EXCHANGE_COIN_FEE,
      ownedPlayerIds: nextOwned,
      benchIds: nextBench,
      futureStarsExchangeCount: (user.futureStarsExchangeCount ?? 0) + 1,
    });
    setSelectedFodderIds([]);
    onOpenFutureStarsPack('FUTURE_STARS_90_95', 'GÓI TRAO ĐỔI FUTURE STARS (OVR 90-95)');
  };

  const handleExchangeByTokens = () => {
    soundService.playClick();
    const currentTokens = user.totyTokens ?? 0;
    if (currentTokens < EXCHANGE_TOKEN_COST) {
      onShowToast(
        `Chưa đủ Token sự kiện! Cần ${EXCHANGE_TOKEN_COST} Token TOTY (Hiện có ${currentTokens}).`,
        'error'
      );
      return;
    }

    soundService.playPackTear();
    onUpdateUser({
      totyTokens: currentTokens - EXCHANGE_TOKEN_COST,
      futureStarsExchangeCount: (user.futureStarsExchangeCount ?? 0) + 1,
    });
    onOpenFutureStarsPack('FUTURE_STARS_90_95', 'GÓI TRAO ĐỔI FUTURE STARS (OVR 90-95)');
  };

  const completedStepsCount =
    (dailyProgress.trainingCompleted ? 1 : 0) +
    (dailyProgress.matchACompleted ? 1 : 0) +
    (dailyProgress.matchBCompleted ? 1 : 0) +
    (dailyProgress.rewardClaimed ? 1 : 0);

  return (
    <>
      {/* ===================================================================== */}
      {/* PANEL 1: LỘ TRÌNH HÀNG NGÀY FUTURE STARS (LÀM MỚI 06:00 SÁNG)         */}
      {/* ===================================================================== */}
      <section className="shrink-0 w-[92vw] sm:w-[980px] rounded-none bg-indigo-950/80 backdrop-blur-md border-2 border-cyan-300/65 p-5 flex flex-col justify-between shadow-[0_0_40px_rgba(56,189,248,0.28)] relative overflow-hidden">
        <img
          src="/assets/aistudio/Background_m_c_v__quay_Future_Stars_336ec779.png"
          alt="Future Stars Background"
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/85 via-indigo-950/60 to-black/85 pointer-events-none" />

        {/* Header Row */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/25 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
                SỰ KIỆN FUTURE STARS HÀNG NGÀY · 1 LẦN CHƠI / NGÀY
              </span>
              <span className="text-white/40">·</span>
              <span className="text-xs font-mono font-bold text-pink-200 flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                Restart 06:00 sáng (còn {countdownText})
              </span>
            </div>
            <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase italic mt-0.5">
              LỘ TRÌNH TÀI NĂNG TRẺ FUTURE STARS ({completedStepsCount}/4)
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-black/65 border border-cyan-300/55">
              <img
                src="/assets/aistudio/storepack_S11_d9617be0.png"
                alt="Vé Future Stars"
                className="w-5 h-6 object-contain"
              />
              <div className="leading-tight">
                <span className="block text-[9px] text-cyan-200 uppercase font-bold">
                  Vé Future Stars
                </span>
                <span className="font-mono font-black text-sm text-white tabular-nums">
                  {user.futureStarsTickets ?? 0} VÉ
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                exchangeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
              }}
              className="px-3.5 py-2 rounded-none bg-gradient-to-r from-cyan-300 via-sky-200 to-pink-200 text-indigo-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <FutureStarsExchangeLogo className="w-5 h-5" />
              <span>Trao Đổi Gói 90–95</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Step Connected Daily Nodes */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-3.5 my-4">
          {/* NODE 1: TẬP LUYỆN FLASHBACK */}
          <div
            className={`rounded-none p-4 border flex flex-col justify-between transition-all ${
              dailyProgress.trainingCompleted
                ? 'bg-emerald-950/65 border-emerald-400/70'
                : 'bg-black/65 border-cyan-300/75 shadow-[0_0_24px_rgba(56,189,248,0.28)]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-cyan-200">
                <span>Ải 1 · Tập Luyện</span>
                {dailyProgress.trainingCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-yellow-300">Đang Mở</span>
                )}
              </div>
              <div className="my-3 flex justify-center">
                <FutureStarsTrainingLogo className="w-20 h-20 drop-shadow-[0_6px_18px_rgba(56,189,248,0.5)]" />
              </div>
              <h3 className="font-cruyff font-black text-base text-white uppercase italic text-center">
                MINIGAME FLASHBACK
              </h3>
              <p className="text-xs text-gray-300 text-center mt-1 leading-snug">
                Ghi nhớ & ghép 4 cặp sao trẻ Future Stars để hoàn thành buổi tập.
              </p>
            </div>

            <button
              type="button"
              disabled={dailyProgress.trainingCompleted}
              onClick={openTrainingDrill}
              className={`mt-3 w-full py-2.5 rounded-none font-black text-xs uppercase tracking-wider transition-all ${
                dailyProgress.trainingCompleted
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 cursor-default'
                  : 'bg-gradient-to-r from-cyan-300 to-sky-400 text-indigo-950 hover:brightness-110 active:scale-95 cursor-pointer shadow-md'
              }`}
            >
              {dailyProgress.trainingCompleted ? 'Đã Tập Luyện Hôm Nay' : 'Bắt Đầu Tập Luyện'}
            </button>
          </div>

          {/* NODE 2: TRẬN ĐẤU FUTURE STARS A (70 OVR) */}
          <div
            className={`rounded-none p-4 border flex flex-col justify-between transition-all ${
              dailyProgress.matchACompleted
                ? 'bg-emerald-950/65 border-emerald-400/70'
                : dailyProgress.trainingCompleted
                ? 'bg-black/65 border-cyan-300/75 shadow-[0_0_24px_rgba(56,189,248,0.28)]'
                : 'bg-black/45 border-white/15 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-cyan-200">
                <span>Ải 2 · Trận Đấu A</span>
                {dailyProgress.matchACompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : !dailyProgress.trainingCompleted ? (
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <span className="text-yellow-300">OVR 70</span>
                )}
              </div>
              <div className="my-3 flex justify-center">
                <FutureStarsMatchLogo className="w-20 h-20 drop-shadow-[0_6px_18px_rgba(232,121,249,0.45)]" />
              </div>
              <h3 className="font-cruyff font-black text-base text-white uppercase italic text-center">
                FUTURE STARS A (70 OVR)
              </h3>
              <p className="text-xs text-gray-300 text-center mt-1 leading-snug">
                Thi đấu 11v11 với đội hình các cầu thủ Future Stars A (OVR 70).
              </p>
            </div>

            <button
              type="button"
              disabled={!dailyProgress.trainingCompleted || dailyProgress.matchACompleted}
              onClick={() => startFutureStarsMatch('A_70')}
              className={`mt-3 w-full py-2.5 rounded-none font-black text-xs uppercase tracking-wider transition-all ${
                dailyProgress.matchACompleted
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 cursor-default'
                  : dailyProgress.trainingCompleted
                  ? 'bg-gradient-to-r from-cyan-300 via-sky-300 to-pink-300 text-indigo-950 hover:brightness-110 active:scale-95 cursor-pointer shadow-md'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed'
              }`}
            >
              {dailyProgress.matchACompleted
                ? 'Đã Thắng Đội A'
                : dailyProgress.trainingCompleted
                ? 'Đấu Future Stars A'
                : 'Cần Qua Ải Tập Luyện'}
            </button>
          </div>

          {/* NODE 3: TRẬN ĐẤU FUTURE STARS B (85 OVR) */}
          <div
            className={`rounded-none p-4 border flex flex-col justify-between transition-all ${
              dailyProgress.matchBCompleted
                ? 'bg-emerald-950/65 border-emerald-400/70'
                : dailyProgress.matchACompleted
                ? 'bg-black/65 border-fuchsia-400/80 shadow-[0_0_24px_rgba(232,121,249,0.32)]'
                : 'bg-black/45 border-white/15 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-pink-200">
                <span>Ải 3 · Trận Đấu B</span>
                {dailyProgress.matchBCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : !dailyProgress.matchACompleted ? (
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <span className="text-pink-300">OVR 85</span>
                )}
              </div>
              <div className="my-3 flex justify-center">
                <FutureStarsMatchLogo className="w-20 h-20 drop-shadow-[0_6px_18px_rgba(232,121,249,0.55)]" />
              </div>
              <h3 className="font-cruyff font-black text-base text-white uppercase italic text-center">
                FUTURE STARS B (85 OVR)
              </h3>
              <p className="text-xs text-gray-300 text-center mt-1 leading-snug">
                Thử thách cam go trước đội hình các cầu thủ Future Stars B (OVR 85).
              </p>
            </div>

            <button
              type="button"
              disabled={!dailyProgress.matchACompleted || dailyProgress.matchBCompleted}
              onClick={() => startFutureStarsMatch('B_85')}
              className={`mt-3 w-full py-2.5 rounded-none font-black text-xs uppercase tracking-wider transition-all ${
                dailyProgress.matchBCompleted
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 cursor-default'
                  : dailyProgress.matchACompleted
                  ? 'bg-gradient-to-r from-fuchsia-300 via-pink-300 to-cyan-300 text-indigo-950 hover:brightness-110 active:scale-95 cursor-pointer shadow-md'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed'
              }`}
            >
              {dailyProgress.matchBCompleted
                ? 'Đã Thắng Đội B'
                : dailyProgress.matchACompleted
                ? 'Đấu Future Stars B'
                : 'Cần Thắng Đội A'}
            </button>
          </div>

          {/* NODE 4: NHẬN 1 VÉ FUTURE STARS */}
          <div
            className={`rounded-none p-4 border flex flex-col justify-between transition-all ${
              dailyProgress.rewardClaimed
                ? 'bg-emerald-950/65 border-emerald-400/70'
                : canClaimDailyTicket
                ? 'bg-gradient-to-b from-cyan-950/90 to-fuchsia-950/85 border-2 border-cyan-300 shadow-[0_0_30px_rgba(56,189,248,0.5)]'
                : 'bg-black/55 border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-cyan-200">
                <span>Phần Quà Cuối</span>
                {dailyProgress.rewardClaimed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : canClaimDailyTicket ? (
                  <span className="text-emerald-300">Sẵn Sàng Nhận!</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                )}
              </div>
              <div className="my-3 flex items-center justify-center gap-2">
                <FutureStarsGiftLogo className="w-16 h-16 drop-shadow-[0_6px_18px_rgba(56,189,248,0.55)]" />
                <img
                  src="/assets/aistudio/storepack_S11_d9617be0.png"
                  alt="Pack Future Stars"
                  className="w-12 h-16 object-contain drop-shadow-[0_6px_14px_rgba(34,211,238,0.55)]"
                />
              </div>
              <h3 className="font-cruyff font-black text-base text-white uppercase italic text-center">
                +1 VÉ FUTURE STARS
              </h3>
              <p className="text-xs text-gray-300 text-center mt-1 leading-snug">
                Hoàn thành đủ Tập luyện, Đội A & Đội B để nhận 1 Vé Future Stars!
              </p>
            </div>

            {dailyProgress.rewardClaimed ? (
              <button
                type="button"
                onClick={onGoToFutureStarsSpin}
                className="mt-3 w-full py-2.5 rounded-none bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-indigo-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Mở Vé Future Stars Ngay
              </button>
            ) : (
              <button
                type="button"
                disabled={!canClaimDailyTicket}
                onClick={handleClaimDailyFutureStarsTicket}
                className={`mt-3 w-full py-2.5 rounded-none font-black text-xs uppercase tracking-wider transition-all ${
                  canClaimDailyTicket
                    ? 'bg-gradient-to-r from-yellow-300 via-cyan-200 to-pink-300 text-indigo-950 animate-pulse cursor-pointer shadow-lg'
                    : 'bg-white/10 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canClaimDailyTicket ? 'Nhận 1 Vé Future Stars' : `Tiến Độ (${completedStepsCount}/3 Ải)`}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Status Hint */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-cyan-100/90 bg-black/50 rounded-none px-3.5 py-2 border border-white/10">
          <span>
            Đội hình hiện tại của bạn: <strong className="text-yellow-300">OVR {user.ovr}</strong> ·
            Lượt chơi Future Stars được làm mới tự động vào <strong>06:00 sáng</strong> mỗi ngày.
          </span>
          <button
            type="button"
            onClick={onGoToFutureStarsSpin}
            className="text-cyan-300 hover:text-white font-black uppercase flex items-center gap-1 cursor-pointer"
          >
            <span>Đi tới Vé Quay Future Stars</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PANEL 2: TRAO ĐỔI FUTURE STARS -> GÓI CẦU THỦ FUTURE STARS 90-95       */}
      {/* ===================================================================== */}
      <section
        ref={exchangeRef}
        className="shrink-0 w-[92vw] sm:w-[880px] rounded-none bg-zinc-950/90 backdrop-blur-md border-2 border-fuchsia-400/65 p-5 flex flex-col justify-between shadow-[0_0_40px_rgba(217,70,239,0.25)] relative overflow-hidden"
      >
        <img
          src="/assets/aistudio/Background_m_c_v__quay_Future_Stars_336ec779.png"
          alt="Future Stars Exchange Background"
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-zinc-950/85 to-purple-950/85 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <FutureStarsExchangeLogo className="w-12 h-12 shrink-0 drop-shadow-[0_4px_12px_rgba(56,189,248,0.5)]" />
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-pink-300 block">
                PHẦN TRAO ĐỔI FUTURE STARS · CAM KẾT 100% OVR 90–95
              </span>
              <h3 className="font-cruyff font-black text-2xl text-white uppercase italic">
                TRAO ĐỔI GÓI CẦU THỦ FUTURE STARS (90–95 OVR)
              </h3>
            </div>
          </div>

          <div className="text-right text-xs text-gray-300 tabular-nums">
            Đã trao đổi:{' '}
            <strong className="text-cyan-300">{user.futureStarsExchangeCount ?? 0} lần</strong>
          </div>
        </div>

        {/* Main Exchange Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 my-3 flex-1 items-stretch">
          {/* Left 4 Cols: Pack Showcase & Pool Preview */}
          <div className="sm:col-span-4 rounded-none bg-black/60 border border-cyan-300/40 p-3.5 flex flex-col items-center justify-between text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
              Phần Thưởng Trao Đổi
            </span>

            <img
              src="/assets/aistudio/storepack_S11_d9617be0.png"
              alt="Gói Cầu Thủ Future Stars 90-95"
              className="w-28 sm:w-32 h-auto object-contain my-1 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]"
            />

            <div>
              <div className="font-cruyff font-black text-base text-white uppercase italic">
                GÓI FUTURE STARS 90–95
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Mở ra ngẫu nhiên 1 cầu thủ mùa Future Stars có OVR từ 90 đến 95 kèm animation riêng!
              </p>
            </div>

            {/* Clickable mini player list */}
            <div className="w-full pt-2 border-t border-white/10">
              <span className="block text-[10px] text-pink-200 uppercase font-bold mb-1">
                Danh sách 90–95 trong gói (nhấn xem):
              </span>
              <div className="flex flex-wrap justify-center gap-1">
                {futureStars90to95Preview.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onInspectPlayer(p)}
                    className="px-2 py-0.5 rounded-none bg-indigo-900/80 hover:bg-indigo-700 border border-cyan-300/40 text-[10px] font-bold text-white cursor-pointer transition-colors tabular-nums"
                  >
                    {p.name} ({p.ovr})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 8 Cols: Squad Fodder Exchange + Token Exchange */}
          <div className="sm:col-span-8 flex flex-col justify-between gap-3">
            {/* Option 1: Trade 3 Reserve Players (87+ OVR) + 40,000 Coins */}
            <div className="rounded-none bg-black/60 border border-white/15 p-3.5 flex flex-col gap-2.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-cruyff font-black text-sm sm:text-base text-cyan-200 uppercase italic">
                    CÁCH 1: ĐỔI 3 CẦU THỦ DỰ TRỮ (87+ OVR) + 40,000 XU ({selectedFodderIds.length}/3)
                  </h4>
                  <p className="text-[11px] text-gray-300">
                    Yêu cầu cầu thủ trao đổi phải đạt <strong className="text-yellow-300">87+ OVR</strong> (ngoài 11 cầu thủ đá chính).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillFodder}
                  className="px-3 py-1.5 rounded-none bg-indigo-800 hover:bg-indigo-700 border border-cyan-300/50 text-xs font-bold text-cyan-200 cursor-pointer transition-colors"
                >
                  Tự Động Chọn 3 Cầu Thủ (87+)
                </button>
              </div>

              {/* Reserve Players Strip */}
              {reserveExchangePool.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400 bg-black/40 rounded-none border border-white/5">
                  Kho dự trữ hiện chưa có cầu thủ đạt <strong className="text-yellow-300">87+ OVR</strong> ngoài 11 đá chính. Mở thêm vé hoặc dùng Cách 2 bên dưới!
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {reserveExchangePool.slice(0, 12).map((card) => {
                    const isPicked = selectedFodderIds.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => toggleSelectFodder(card.id)}
                        className={`shrink-0 px-2.5 py-2 rounded-none border text-left transition-all cursor-pointer w-32 ${
                          isPicked
                            ? 'bg-cyan-400/25 border-cyan-300 shadow-[0_0_14px_rgba(56,189,248,0.45)]'
                            : 'bg-zinc-900/90 border-white/15 hover:border-white/35'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black tabular-nums">
                          <span className="text-yellow-300">OVR {card.ovr}</span>
                          <span className="text-cyan-200">{card.position}</span>
                        </div>
                        <div className="font-bold text-xs text-white truncate mt-0.5">
                          {card.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {isPicked ? '✓ Đã chọn đổi' : card.club}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleExchangeByPlayers}
                className="mt-auto w-full py-2.5 rounded-none bg-gradient-to-r from-cyan-300 via-sky-200 to-pink-300 text-indigo-950 font-black text-xs sm:text-sm uppercase tracking-wider hover:brightness-105 active:scale-98 transition-all cursor-pointer shadow-md"
              >
                TRAO ĐỔI 3 CẦU THỦ (87+ OVR) + 40,000 XU → NHẬN GÓI FUTURE STARS 90–95
              </button>
            </div>

            {/* Option 2: Quick Exchange via Event Tokens */}
            <div className="rounded-none bg-indigo-950/65 border border-fuchsia-400/45 p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-cruyff font-black text-sm text-pink-200 uppercase italic">
                  CÁCH 2: TRAO ĐỔI NHANH BẰNG 80 TOKEN SỰ KIỆN
                </div>
                <div className="text-xs text-gray-300 tabular-nums">
                  Token hiện có: <strong className="text-yellow-300">{user.totyTokens ?? 0}</strong> ·
                  Mở ngay Gói Cầu Thủ Future Stars 90–95 không tốn cầu thủ dự trữ!
                </div>
              </div>
              <button
                type="button"
                onClick={handleExchangeByTokens}
                className="px-4 py-2.5 rounded-none bg-gradient-to-r from-fuchsia-400 to-cyan-300 text-indigo-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 shadow-md"
              >
                Đổi 80 Token Nhận Gói 90–95
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODAL TẬP LUYỆN: MINIGAME FLASHBACK ĐƠN GIẢN                          */}
      {/* ===================================================================== */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-none bg-zinc-950 border-2 border-cyan-300/75 p-5 flex flex-col gap-4 shadow-[0_0_50px_rgba(56,189,248,0.4)] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <FutureStarsTrainingLogo className="w-10 h-10" />
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block">
                    ẢI 1 · TẬP LUYỆN FUTURE STARS
                  </span>
                  <h3 className="font-cruyff font-black text-xl text-white uppercase italic">
                    MINIGAME FLASHBACK ĐƠN GIẢN
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrainingModal(false)}
                className="p-2 rounded-none bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-200 bg-indigo-950/70 px-3.5 py-2 rounded-none border border-cyan-400/30 tabular-nums">
              <span>
                {fbPhase === 'MEMORIZE'
                  ? 'Hãy ghi nhớ vị trí các cầu thủ Future Stars...'
                  : fbPhase === 'PLAYING'
                  ? 'Lật 2 thẻ giống nhau để ghép đủ 4 cặp sao trẻ!'
                  : 'Tuyệt vời! Bạn đã hoàn thành bài tập luyện hôm nay!'}
              </span>
              <span className="font-mono font-bold text-cyan-300">Lượt lật: {fbMoves}</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {fbCards.map((item, idx) => (
                <button
                  key={item.uid}
                  type="button"
                  onClick={() => handleFlipTrainingCard(idx)}
                  className={`aspect-square rounded-none border-2 flex flex-col items-center justify-center p-1.5 transition-all cursor-pointer overflow-hidden relative ${
                    item.isMatched
                      ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                      : item.isFlipped
                      ? 'bg-indigo-950 border-cyan-300'
                      : 'bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 border-cyan-300/45 hover:scale-105'
                  }`}
                >
                  {item.isFlipped || item.isMatched ? (
                    <>
                      <img
                        src={item.player.avatarUrl}
                        alt={item.player.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                      />
                      <span className="font-cruyff font-black text-[10px] sm:text-xs text-white truncate max-w-full mt-0.5">
                        {item.player.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-cyan-300">
                        OVR {item.player.ovr}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FutureStarsTrainingLogo className="w-9 h-9 opacity-90" />
                      <span className="text-[9px] font-black uppercase text-cyan-200 tracking-wider">
                        FUTURE
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {fbPhase === 'WON' && (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <span className="text-xs text-emerald-300 font-bold">
                  ✓ Đã mở khóa Trận Đấu Future Stars A (70 OVR) & nhận +15,000 Xu!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTrainingModal(false);
                    startFutureStarsMatch('A_70');
                  }}
                  className="px-4 py-2 rounded-none bg-gradient-to-r from-cyan-300 to-pink-300 text-indigo-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Đấu Đội A (70 OVR) Ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL TRẬN ĐẤU 11v11: FUTURE STARS A (70 OVR) & B (85 OVR)            */}
      {/* ===================================================================== */}
      {activeMatchTier && (
        <div className="fixed inset-0 z-[75] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="max-w-4xl w-full rounded-none bg-zinc-950 border-2 border-cyan-300/75 p-4 sm:p-5 flex flex-col gap-3 shadow-[0_0_55px_rgba(56,189,248,0.4)]">
            {/* Scoreboard Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/75 px-4 py-2.5 rounded-none border border-white/15 tabular-nums">
              <div className="flex items-center gap-2">
                <span className="font-cruyff font-black text-sm sm:text-base text-yellow-300 uppercase">
                  {user.teamName}
                </span>
                <span className="text-xs text-gray-400">(OVR {user.ovr})</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-2xl sm:text-3xl text-white">
                  {userGoals} - {oppGoals}
                </span>
                <span className="px-2.5 py-1 rounded-none bg-indigo-900 border border-cyan-300/50 font-mono text-xs font-bold text-cyan-200">
                  {matchSecondsLeft}s ({Math.min(90, (30 - matchSecondsLeft) * 3)}&apos;)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-cruyff font-black text-sm sm:text-base text-cyan-300 uppercase">
                  {opponentTeamTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMatchTier(null)}
                  className="p-1.5 rounded-none bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white ml-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 11v11 Pitch */}
            <div className="relative w-full h-64 sm:h-80 rounded-none overflow-hidden border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 select-none">
              {/* Pitch markings */}
              <div className="absolute inset-3 border-2 border-white/35 rounded-none pointer-events-none" />
              <div className="absolute inset-y-3 left-1/2 w-0.5 bg-white/35 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/35 pointer-events-none" />
              {/* Left & Right Penalty Boxes */}
              <div className="absolute left-3 top-[26%] bottom-[26%] w-[14%] border-r-2 border-y-2 border-white/35 pointer-events-none" />
              <div className="absolute right-3 top-[26%] bottom-[26%] w-[14%] border-l-2 border-y-2 border-white/35 pointer-events-none" />

              {/* User 11 Players */}
              {userEntities.map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 flex flex-col items-center pointer-events-none"
                >
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-black shadow-md ${
                      p.isGk
                        ? 'bg-amber-400 text-black border-white'
                        : 'bg-yellow-400 text-black border-zinc-950'
                    }`}
                  >
                    {p.pos}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-white bg-black/65 px-1 rounded-none mt-0.5 truncate max-w-[54px]">
                    {p.name}
                  </span>
                </div>
              ))}

              {/* Opponent 11 Future Stars Players */}
              {oppEntities.map((p) => (
                <div
                  key={p.id}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 flex flex-col items-center pointer-events-none"
                >
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-black shadow-md ${
                      p.isGk
                        ? 'bg-pink-400 text-indigo-950 border-white'
                        : 'bg-cyan-400 text-indigo-950 border-indigo-950'
                    }`}
                  >
                    {p.pos}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-cyan-100 bg-indigo-950/80 px-1 rounded-none mt-0.5 truncate max-w-[54px]">
                    {p.name}
                  </span>
                </div>
              ))}

              {/* Ball */}
              <div
                style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-black shadow-[0_0_12px_#fff] transition-all duration-700 pointer-events-none"
              />

              {/* Corner Commentator Box */}
              <div className="absolute bottom-2.5 right-2.5 max-w-xs bg-black/80 backdrop-blur-md border border-cyan-300/50 rounded-none px-3 py-2 flex items-start gap-2 pointer-events-none">
                <Mic className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white leading-snug">{commentary}</p>
              </div>
            </div>

            {/* Tactical Controls & Match Finish Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300 font-bold uppercase flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-300" /> Chiến thuật:
                </span>
                <button
                  type="button"
                  onClick={() => setTactic('attacking')}
                  className={`px-3 py-1.5 rounded-none text-xs font-black uppercase flex items-center gap-1 cursor-pointer ${
                    tactic === 'attacking'
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> Tấn Công
                </button>
                <button
                  type="button"
                  onClick={() => setTactic('balanced')}
                  className={`px-3 py-1.5 rounded-none text-xs font-black uppercase cursor-pointer ${
                    tactic === 'balanced'
                      ? 'bg-cyan-400 text-indigo-950'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  Cân Bằng
                </button>
                <button
                  type="button"
                  onClick={() => setTactic('defensive')}
                  className={`px-3 py-1.5 rounded-none text-xs font-black uppercase flex items-center gap-1 cursor-pointer ${
                    tactic === 'defensive'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> Phòng Thủ
                </button>
              </div>

              {matchResultState !== 'PLAYING' && (
                <div className="flex items-center gap-2">
                  {matchResultState === 'LOSE' ? (
                    <button
                      type="button"
                      onClick={() => startFutureStarsMatch(activeMatchTier)}
                      className="px-4 py-2 rounded-none bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Đá Lại Thử Thách
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveMatchTier(null)}
                      className="px-5 py-2 rounded-none bg-gradient-to-r from-emerald-400 to-cyan-300 text-indigo-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>
                        {matchResultState === 'PENALTY_WIN'
                          ? 'Thắng Luân Lưu · Tiếp Tục'
                          : 'Hoàn Thành Trận Đấu'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
