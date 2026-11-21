import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  FastForward,
  Trophy,
  Clock,
  CheckCircle2,
  Shield,
  Swords,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ClubDailyProgress,
  ClubKeyMatchDifficultyId,
  ClubKeyMatchHistoryEntry,
  PlayerCard,
  TacticalPlayStyleId,
} from '../types/game';
import {
  TACTICAL_PLAYSTYLES,
  evaluatePlayStyleMatchup,
  getOpponentPlayStyle,
  getPlayStyleDef,
} from '../data/playStylesData';
import {
  CLUB_DIFFICULTIES,
  CLUB_EXCHANGE_ITEMS,
  CLUB_KEY_MATCH_ASSETS,
  DAILY_MAX_CLUB_MATCHES,
  FeaturedMatchClub,
  getDailyFeaturedKeyMatch,
} from '../data/clubKeyMatchData';
import { totyFeaturedPlayers } from '../data/mockData';
import {
  getCountdownToNext6AM,
  getDaily6AMCycleKey,
  normalizeClubDaily,
} from '../utils/dateUtils';
import { soundService } from '../services/sound';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';

interface ClubKeyMatchSectionProps {
  userTeamName: string;
  currentTeamOvr: number;
  starters: PlayerCard[];
  clubTokens: number;
  userTickets: number;
  clubDaily?: ClubDailyProgress;
  ownedPlayerIds: string[];
  userPlayStyle?: TacticalPlayStyleId;
  onSelectPlayStyle?: (style: TacticalPlayStyleId) => void;
  onCompleteMatch: (entry: ClubKeyMatchHistoryEntry) => void;
  onExchangeReward: (
    rewardKind:
      | 'ticket_1'
      | 'ticket_5'
      | 'thuram_102'
      | 'suker_101'
      | 'kane_104'
      | 'mbappe_103'
      | 'yamal_102'
      | 'messi_102'
      | 'rodri_102'
  ) => void;
}

interface LiveMatchEvent {
  minute: number;
  side: 'user' | 'opp' | 'info';
  text: string;
  isGoal?: boolean;
}

const ClubShieldBadge: React.FC<{
  club: FeaturedMatchClub;
  sizeClass?: string;
}> = ({ club, sizeClass = 'w-14 h-14' }) => {
  return (
    <div
      className={`relative ${sizeClass} flex items-center justify-center shrink-0 select-none`}
    >
      <img
        src={CLUB_KEY_MATCH_ASSETS.clubFrame}
        alt={club.name}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
      <svg
        viewBox="0 0 64 64"
        className="relative z-10 w-[68%] h-[68%] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
      >
        <defs>
          <clipPath id={`shield_${club.id}`}>
            <path d="M32 4 L56 12 V30 C56 46 44 56 32 60 C20 56 8 46 8 30 V12 Z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#shield_${club.id})`}>
          <rect x="0" y="0" width="32" height="64" fill={club.primaryColor} />
          <rect x="32" y="0" width="32" height="64" fill={club.secondaryColor} />
          <rect x="0" y="0" width="64" height="64" fill="rgba(0,0,0,0.18)" />
        </g>
        <path
          d="M32 4 L56 12 V30 C56 46 44 56 32 60 C20 56 8 46 8 30 V12 Z"
          fill="none"
          stroke="#FDE047"
          strokeWidth="2.8"
        />
        <text
          x="32"
          y="37"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="15"
          fontWeight="900"
          fontFamily="Barlow Condensed, sans-serif"
          stroke="#000000"
          strokeWidth="2.5"
          paintOrder="stroke"
        >
          {club.shortName}
        </text>
      </svg>
    </div>
  );
};

export const ClubKeyMatchSection: React.FC<ClubKeyMatchSectionProps> = ({
  userTeamName,
  currentTeamOvr,
  starters,
  clubTokens,
  userTickets,
  clubDaily,
  ownedPlayerIds,
  userPlayStyle,
  onSelectPlayStyle,
  onCompleteMatch,
  onExchangeReward,
}) => {
  const [nowTick, setNowTick] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cycleKey = useMemo(() => getDaily6AMCycleKey(nowTick), [nowTick]);
  const countdown6AM = useMemo(() => getCountdownToNext6AM(nowTick), [nowTick]);
  const normalizedDaily = useMemo(
    () => normalizeClubDaily(clubDaily, cycleKey),
    [clubDaily, cycleKey]
  );

  const { todayMatch, nextMatch } = useMemo(
    () => getDailyFeaturedKeyMatch(cycleKey),
    [cycleKey]
  );

  const [selectedSide, setSelectedSide] = useState<'home' | 'away'>('home');
  const [selectedDiffId, setSelectedDiffId] =
    useState<ClubKeyMatchDifficultyId>('professional');
  const [pressedDiffId, setPressedDiffId] =
    useState<ClubKeyMatchDifficultyId | null>(null);

  const selectedOpponent: FeaturedMatchClub =
    selectedSide === 'home' ? todayMatch.homeClub : todayMatch.awayClub;

  const selectedDifficulty = useMemo(
    () =>
      CLUB_DIFFICULTIES.find((d) => d.id === selectedDiffId) ||
      CLUB_DIFFICULTIES[1],
    [selectedDiffId]
  );

  const matchesRemaining = Math.max(
    0,
    DAILY_MAX_CLUB_MATCHES - normalizedDaily.matchesPlayed
  );

  // Live Match Simulation State Machine (45 seconds real-time = 90 match minutes)
  const CLUB_MATCH_DURATION_SECONDS = 45;
  const [matchState, setMatchState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>(
    'IDLE'
  );
  const [matchMinute, setMatchMinute] = useState<number>(0);
  const [matchSecondsLeft, setMatchSecondsLeft] = useState<number>(45);
  const [userGoals, setUserGoals] = useState<number>(0);
  const [oppGoals, setOppGoals] = useState<number>(0);
  const [liveMentality, setLiveMentality] = useState<
    'defensive' | 'balanced' | 'attacking'
  >('balanced');
  const [livePlayStyleId, setLivePlayStyleId] = useState<TacticalPlayStyleId>(
    () => getPlayStyleDef(userPlayStyle).id
  );
  useEffect(() => {
    if (userPlayStyle) {
      setLivePlayStyleId(getPlayStyleDef(userPlayStyle).id);
    }
  }, [userPlayStyle]);

  const activeUserStyle = useMemo(
    () => getPlayStyleDef(livePlayStyleId),
    [livePlayStyleId]
  );
  const oppPlayStyle = useMemo(
    () =>
      getPlayStyleDef(
        getOpponentPlayStyle(selectedOpponent.name, selectedDifficulty.opponentOvr)
      ),
    [selectedOpponent.name, selectedDifficulty.opponentOvr]
  );
  const styleMatchup = useMemo(
    () => evaluatePlayStyleMatchup(activeUserStyle.id, oppPlayStyle.id),
    [activeUserStyle.id, oppPlayStyle.id]
  );

  const [matchEvents, setMatchEvents] = useState<LiveMatchEvent[]>([]);
  const [finishedSummary, setFinishedSummary] =
    useState<ClubKeyMatchHistoryEntry | null>(null);

  const liveMentalityRef = useRef(liveMentality);
  useEffect(() => {
    liveMentalityRef.current = liveMentality;
  }, [liveMentality]);

  const livePlayStyleRef = useRef<TacticalPlayStyleId>(livePlayStyleId);
  useEffect(() => {
    livePlayStyleRef.current = livePlayStyleId;
  }, [livePlayStyleId]);

  const handleChangeClubPlayStyle = (nextId: TacticalPlayStyleId) => {
    if (nextId === livePlayStyleId) return;
    soundService.playClick();
    setLivePlayStyleId(nextId);
    onSelectPlayStyle?.(nextId);
    if (matchState === 'PLAYING') {
      const nextDef = getPlayStyleDef(nextId);
      setMatchEvents((prev) => [
        {
          minute: Math.max(1, matchMinute),
          side: 'info',
          text: `HLV ${userTeamName} chuyển sang phong cách ${nextDef.name} (${nextDef.tagline})!`,
        },
        ...prev.slice(0, 7),
      ]);
    }
  };

  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchResolvedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // Exchange Reward Celebration Modal & Walkout Modal (Icons Exchange Animation for Ballon d'Or)
  const [celebrationCard, setCelebrationCard] = useState<PlayerCard | null>(
    null
  );
  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(
    null
  );

  const thuramCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.thuram102.id
      ) || totyFeaturedPlayers[0],
    []
  );
  const sukerCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.suker101.id
      ) || totyFeaturedPlayers[0],
    []
  );
  const yamalCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.yamal102.id
      ) || totyFeaturedPlayers[0],
    []
  );
  const messiCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.messi102.id
      ) || totyFeaturedPlayers[0],
    []
  );
  const rodriCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.rodri102.id
      ) || totyFeaturedPlayers[0],
    []
  );
  const mbappeCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.mbappe103.id
      ) || totyFeaturedPlayers[0],
    []
  );
  const kaneCard = useMemo(
    () =>
      totyFeaturedPlayers.find(
        (p) => p.id === CLUB_EXCHANGE_ITEMS.kane104.id
      ) || totyFeaturedPlayers[0],
    []
  );

  const ownsThuram = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.thuram102.id);
  const ownsSuker = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.suker101.id);
  const ownsYamal = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.yamal102.id);
  const ownsMessi = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.messi102.id);
  const ownsRodri = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.rodri102.id);
  const ownsMbappe = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.mbappe103.id);
  const ownsKane = ownedPlayerIds.includes(CLUB_EXCHANGE_ITEMS.kane104.id);

  const pickUserScorer = (): string => {
    const attackers = starters.filter((p) =>
      ['ST', 'CF', 'LW', 'RW', 'CAM', 'CM', 'LM', 'RM'].includes(p.position)
    );
    const pool = attackers.length > 0 ? attackers : starters;
    if (pool.length === 0) return 'Đội trưởng CLB';
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked.name;
  };

  const pickOppScorer = (opp: FeaturedMatchClub): string => {
    const list = opp.keyPlayers;
    return list[Math.floor(Math.random() * Math.min(4, list.length))] || opp.name;
  };

  const finalizeMatch = (
    finalUserGoals: number,
    finalOppGoals: number,
    opp: FeaturedMatchClub,
    diff: typeof selectedDifficulty
  ) => {
    if (matchResolvedRef.current) return;
    matchResolvedRef.current = true;
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    const result: 'W' | 'D' | 'L' =
      finalUserGoals > finalOppGoals
        ? 'W'
        : finalUserGoals === finalOppGoals
        ? 'D'
        : 'L';

    const tokensEarned =
      result === 'W'
        ? diff.winTokens
        : result === 'D'
        ? diff.drawTokens
        : diff.lossTokens;
    const coinsEarned =
      result === 'W'
        ? diff.winCoins
        : result === 'D'
        ? diff.drawCoins
        : diff.lossCoins;

    const nowStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const entry: ClubKeyMatchHistoryEntry = {
      id: `club_match_${Date.now()}`,
      opponentId: opp.id,
      opponentName: opp.name,
      difficultyId: diff.id,
      difficultyLabel: diff.label,
      userGoals: finalUserGoals,
      oppGoals: finalOppGoals,
      result,
      tokensEarned,
      coinsEarned,
      playedAt: nowStr,
    };

    setMatchMinute(90);
    setMatchSecondsLeft(0);
    setMatchState('FINISHED');
    setFinishedSummary(entry);

    if (result === 'W') {
      soundService.playTrophy();
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    } else {
      soundService.playCoins();
    }

    onCompleteMatch(entry);
  };

  const handleStartKeyMatch = () => {
    if (matchesRemaining <= 0 || matchState === 'PLAYING') return;
    soundService.playStartPrompt();

    matchResolvedRef.current = false;
    setFinishedSummary(null);
    setMatchMinute(0);
    setMatchSecondsLeft(CLUB_MATCH_DURATION_SECONDS);
    setUserGoals(0);
    setOppGoals(0);
    setMatchState('PLAYING');

    const opp = selectedOpponent;
    const diff = selectedDifficulty;
    const oppStyleAtStart = getPlayStyleDef(
      getOpponentPlayStyle(opp.name, diff.opponentOvr)
    );
    const userStyleAtStart = getPlayStyleDef(livePlayStyleRef.current);
    const startMatchup = evaluatePlayStyleMatchup(
      userStyleAtStart.id,
      oppStyleAtStart.id
    );

    setMatchEvents([
      {
        minute: 1,
        side: 'info',
        text: `Khai cuộc (45s): ${userTeamName} (${userStyleAtStart.shortName}) vs ${opp.name} (${oppStyleAtStart.shortName}) · ${startMatchup.summaryText}`,
      },
    ]);

    let elapsedSec = 0;
    let curUserG = 0;
    let curOppG = 0;

    simTimerRef.current = setInterval(() => {
      elapsedSec += 1;
      const curMin = Math.min(90, elapsedSec * 2);
      const nextSecLeft = Math.max(0, CLUB_MATCH_DURATION_SECONDS - elapsedSec);
      const uStyle = getPlayStyleDef(livePlayStyleRef.current);
      const oStyle = getPlayStyleDef(
        getOpponentPlayStyle(opp.name, diff.opponentOvr)
      );
      const curMatchup = evaluatePlayStyleMatchup(uStyle.id, oStyle.id);
      const staminaLatePenalty =
        elapsedSec >= 33 && uStyle.engine.staminaDrainMult > 1.25 ? -0.008 : 0;

      const ovrDelta =
        currentTeamOvr +
        (uStyle.engine.attBonus + uStyle.engine.defBonus) * 0.5 +
        curMatchup.ovrSwing -
        diff.opponentOvr;
      const mentality = liveMentalityRef.current;

      const userAtkMod =
        (mentality === 'attacking' ? 0.016 : mentality === 'defensive' ? -0.009 : 0) +
        uStyle.engine.goalConvBonus * 0.18 +
        uStyle.engine.shootProbBonus * 0.14 +
        curMatchup.goalProbSwing * 0.32 +
        staminaLatePenalty;
      const oppAtkMod =
        (mentality === 'attacking' ? 0.011 : mentality === 'defensive' ? -0.011 : 0) +
        uStyle.engine.concedeMod * 0.22 -
        curMatchup.goalProbSwing * 0.25;

      // Scaled across 45 real-time seconds (~1.8–2.2 expected goals per team depending on OVR, Playstyle & mentality)
      const userGoalProb = Math.max(
        0.012,
        Math.min(0.12, 0.044 + ovrDelta * 0.0019 + userAtkMod)
      );
      const oppGoalProb = Math.max(
        0.009,
        Math.min(0.105, 0.037 - ovrDelta * 0.0017 + oppAtkMod)
      );

      const rollU = Math.random();
      const rollO = Math.random();

      if (rollU < userGoalProb) {
        curUserG += 1;
        const scorer = pickUserScorer();
        soundService.playCoins();
        setUserGoals(curUserG);
        setMatchEvents((prev) => [
          {
            minute: Math.min(90, curMin),
            side: 'user',
            isGoal: true,
            text: `VÀOOO! ${scorer} tỏa sáng từ hệ thống ${uStyle.shortName}, nâng tỷ số lên ${curUserG}–${curOppG} cho ${userTeamName}!`,
          },
          ...prev.slice(0, 7),
        ]);
      } else if (rollO < oppGoalProb) {
        curOppG += 1;
        const scorer = pickOppScorer(opp);
        setOppGoals(curOppG);
        setMatchEvents((prev) => [
          {
            minute: Math.min(90, curMin),
            side: 'opp',
            isGoal: true,
            text: `Bàn thắng cho ${opp.name} (${oStyle.shortName})! ${scorer} lập công đưa tỷ số thành ${curUserG}–${curOppG}.`,
          },
          ...prev.slice(0, 7),
        ]);
      } else if (elapsedSec === 23) {
        setMatchEvents((prev) => [
          {
            minute: 45,
            side: 'info',
            text: `Hiệp 2 bắt đầu! Tỷ số tạm thời ${userTeamName} ${curUserG} – ${curOppG} ${opp.name}.`,
          },
          ...prev.slice(0, 7),
        ]);
      } else if (elapsedSec % 6 === 0) {
        const scorer = pickUserScorer();
        const oppPlayer = pickOppScorer(opp);
        const styleLine =
          uStyle.commentaryBuildUp[elapsedSec % uStyle.commentaryBuildUp.length] ||
          `${scorer} đi bóng tốc độ tạo sức ép lên hàng thủ ${opp.name}!`;
        const dangerText =
          Math.random() < 0.56
            ? `${styleLine} (${scorer})`
            : `${oppPlayer} (${opp.name} · ${oStyle.shortName}) tung cú dứt điểm nguy hiểm nhưng hàng thủ ${userTeamName} bọc lót kịp thời!`;
        setMatchEvents((prev) => [
          {
            minute: curMin,
            side: 'info',
            text: dangerText,
          },
          ...prev.slice(0, 7),
        ]);
      }

      if (elapsedSec >= CLUB_MATCH_DURATION_SECONDS) {
        finalizeMatch(curUserG, curOppG, opp, diff);
      } else {
        setMatchMinute(curMin);
        setMatchSecondsLeft(nextSecLeft);
      }
    }, 1000);
  };

  const handleInstantFinish = () => {
    if (matchState !== 'PLAYING') return;
    soundService.playClick();
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    const opp = selectedOpponent;
    const diff = selectedDifficulty;
    const remainingTicks = Math.max(1, matchSecondsLeft);
    const uStyle = getPlayStyleDef(livePlayStyleRef.current);
    const oStyle = getPlayStyleDef(
      getOpponentPlayStyle(opp.name, diff.opponentOvr)
    );
    const curMatchup = evaluatePlayStyleMatchup(uStyle.id, oStyle.id);
    const ovrDelta =
      currentTeamOvr +
      (uStyle.engine.attBonus + uStyle.engine.defBonus) * 0.5 +
      curMatchup.ovrSwing -
      diff.opponentOvr;
    const mentality = liveMentalityRef.current;

    const userAtkMod =
      (mentality === 'attacking' ? 0.016 : mentality === 'defensive' ? -0.009 : 0) +
      uStyle.engine.goalConvBonus * 0.18 +
      curMatchup.goalProbSwing * 0.32;
    const oppAtkMod =
      (mentality === 'attacking' ? 0.011 : mentality === 'defensive' ? -0.011 : 0) +
      uStyle.engine.concedeMod * 0.22 -
      curMatchup.goalProbSwing * 0.25;

    const userGoalProb = Math.max(
      0.012,
      Math.min(0.12, 0.044 + ovrDelta * 0.0019 + userAtkMod)
    );
    const oppGoalProb = Math.max(
      0.009,
      Math.min(0.105, 0.037 - ovrDelta * 0.0017 + oppAtkMod)
    );

    let finalU = userGoals;
    let finalO = oppGoals;
    for (let i = 0; i < remainingTicks; i++) {
      if (Math.random() < userGoalProb) finalU += 1;
      else if (Math.random() < oppGoalProb) finalO += 1;
    }
    setUserGoals(finalU);
    setOppGoals(finalO);
    finalizeMatch(finalU, finalO, opp, diff);
  };

  const handleTriggerExchange = (
    kind:
      | 'ticket_1'
      | 'ticket_5'
      | 'thuram_102'
      | 'suker_101'
      | 'kane_104'
      | 'mbappe_103'
      | 'yamal_102'
      | 'messi_102'
      | 'rodri_102'
  ) => {
    if (kind === 'thuram_102') {
      if (ownsThuram || clubTokens < CLUB_EXCHANGE_ITEMS.thuram102.costTokens) {
        soundService.playClick();
        return;
      }
      soundService.playPackOpenFanfare();
      confetti({ particleCount: 95, spread: 75, origin: { y: 0.55 } });
      onExchangeReward('thuram_102');
      setCelebrationCard(thuramCard);
      return;
    }

    if (kind === 'suker_101') {
      if (ownsSuker || clubTokens < CLUB_EXCHANGE_ITEMS.suker101.costTokens) {
        soundService.playClick();
        return;
      }
      soundService.playPackOpenFanfare();
      confetti({ particleCount: 95, spread: 75, origin: { y: 0.55 } });
      onExchangeReward('suker_101');
      setCelebrationCard(sukerCard);
      return;
    }

    if (kind === 'yamal_102') {
      if (ownsYamal || clubTokens < CLUB_EXCHANGE_ITEMS.yamal102.costTokens) {
        soundService.playClick();
        return;
      }
      onExchangeReward('yamal_102');
      setWalkoutRewardCard(yamalCard);
      return;
    }

    if (kind === 'messi_102') {
      if (ownsMessi || clubTokens < CLUB_EXCHANGE_ITEMS.messi102.costTokens) {
        soundService.playClick();
        return;
      }
      onExchangeReward('messi_102');
      setWalkoutRewardCard(messiCard);
      return;
    }

    if (kind === 'rodri_102') {
      if (ownsRodri || clubTokens < CLUB_EXCHANGE_ITEMS.rodri102.costTokens) {
        soundService.playClick();
        return;
      }
      onExchangeReward('rodri_102');
      setWalkoutRewardCard(rodriCard);
      return;
    }

    if (kind === 'mbappe_103') {
      if (ownsMbappe || clubTokens < CLUB_EXCHANGE_ITEMS.mbappe103.costTokens) {
        soundService.playClick();
        return;
      }
      onExchangeReward('mbappe_103');
      setWalkoutRewardCard(mbappeCard);
      return;
    }

    if (kind === 'kane_104') {
      if (ownsKane || clubTokens < CLUB_EXCHANGE_ITEMS.kane104.costTokens) {
        soundService.playClick();
        return;
      }
      onExchangeReward('kane_104');
      setWalkoutRewardCard(kaneCard);
      return;
    }

    const needed = kind === 'ticket_5' ? 250 : 50;
    if (clubTokens < needed) {
      soundService.playClick();
      return;
    }
    soundService.playCoins();
    onExchangeReward(kind);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      {/* ===================================================================== */}
      {/* 1. DAILY FEATURED MATCH BANNER & OPPONENT CLUB SELECTOR               */}
      {/* ===================================================================== */}
      <section className="relative rounded-2xl overflow-hidden border border-cyan-400/50 shadow-[0_12px_40px_rgba(0,0,0,0.65)] bg-slate-950">
        <img
          src={CLUB_KEY_MATCH_ASSETS.mediumBg}
          alt="Sân vận động Trận Đấu Nổi Bật"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/65 to-slate-950/95 pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-6 space-y-5">
          {/* Top Info Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-semibold">
                <span>{todayMatch.competition}</span>
                <span aria-hidden="true">·</span>
                <span>Sân {todayMatch.stadium}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cập nhật 06:00 sáng sau {countdown6AM}</span>
                </span>
              </div>
              <h3 className="font-cruyff font-black text-2xl sm:text-3xl text-white tracking-wide">
                {todayMatch.headline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Chọn 1 trong 2 CLB tâm điểm hôm nay làm đối thủ, điều chỉnh độ khó để nhận Token Câu Lạc Bộ (tối đa 2 trận mỗi ngày).
              </p>
            </div>

            {/* Balances & Remaining Daily Plays */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-cyan-400/45 flex items-center gap-2.5">
                <img
                  src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                  alt="Token CLB"
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 object-contain"
                />
                <div>
                  <span className="block text-[10px] text-cyan-200 font-semibold">
                    Token Câu Lạc Bộ
                  </span>
                  <span className="font-mono font-black text-lg text-white tabular-nums leading-none">
                    {clubTokens.toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-amber-400/45 text-right">
                <span className="block text-[10px] text-amber-200 font-semibold">
                  Lượt Đấu Hôm Nay
                </span>
                <span className="font-mono font-black text-lg text-amber-300 tabular-nums leading-none">
                  {matchesRemaining} / {DAILY_MAX_CLUB_MATCHES} trận
                </span>
              </div>
            </div>
          </div>

          {/* 2-Club Featured Matchup Cards (Left & Right Stadium Popup Backgrounds) */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-stretch">
            {/* HOME FEATURED CLUB (LEFT ASSET) */}
            <button
              type="button"
              disabled={matchState === 'PLAYING'}
              onClick={() => {
                soundService.playClick();
                setSelectedSide('home');
              }}
              className={`md:col-span-5 relative rounded-2xl overflow-hidden p-4 sm:p-5 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[188px] border-2 ${
                selectedSide === 'home'
                  ? 'border-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.35)] scale-[1.01]'
                  : 'border-white/15 hover:border-white/40 opacity-85 hover:opacity-100'
              }`}
            >
              <img
                src={CLUB_KEY_MATCH_ASSETS.leftTeamBg}
                alt={todayMatch.homeClub.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/35 pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClubShieldBadge club={todayMatch.homeClub} sizeClass="w-14 h-14" />
                  <div>
                    <span className="text-xs text-cyan-200 font-semibold block">
                      CLB Chủ Nhà · {todayMatch.homeClub.country}
                    </span>
                    <h4 className="font-cruyff font-black text-xl sm:text-2xl text-white leading-tight">
                      {todayMatch.homeClub.name}
                    </h4>
                  </div>
                </div>

                {selectedSide === 'home' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 whitespace-nowrap shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đối thủ đã chọn</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 whitespace-nowrap shrink-0">
                    Chạm để chọn đấu
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
                <span className="truncate">
                  Ngôi sao: {todayMatch.homeClub.keyPlayers.slice(0, 3).join(' · ')}
                </span>
                <span className="font-mono font-bold text-yellow-300 tabular-nums shrink-0">
                  Đội hình gốc OVR {todayMatch.homeClub.baseOvr}
                </span>
              </div>
            </button>

            {/* CENTER VS DIVIDER */}
            <div className="md:col-span-1 flex flex-row md:flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-11 h-11 rounded-full bg-slate-900 border border-cyan-400/60 flex items-center justify-center font-cruyff font-black text-base text-cyan-300 shadow-lg">
                VS
              </div>
              <span className="text-[11px] text-slate-400 text-center">
                Tâm điểm 06:00
              </span>
            </div>

            {/* AWAY FEATURED CLUB (RIGHT ASSET) */}
            <button
              type="button"
              disabled={matchState === 'PLAYING'}
              onClick={() => {
                soundService.playClick();
                setSelectedSide('away');
              }}
              className={`md:col-span-5 relative rounded-2xl overflow-hidden p-4 sm:p-5 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[188px] border-2 ${
                selectedSide === 'away'
                  ? 'border-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.35)] scale-[1.01]'
                  : 'border-white/15 hover:border-white/40 opacity-85 hover:opacity-100'
              }`}
            >
              <img
                src={CLUB_KEY_MATCH_ASSETS.rightTeamBg}
                alt={todayMatch.awayClub.name}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/35 pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClubShieldBadge club={todayMatch.awayClub} sizeClass="w-14 h-14" />
                  <div>
                    <span className="text-xs text-cyan-200 font-semibold block">
                      CLB Đội Khách · {todayMatch.awayClub.country}
                    </span>
                    <h4 className="font-cruyff font-black text-xl sm:text-2xl text-white leading-tight">
                      {todayMatch.awayClub.name}
                    </h4>
                  </div>
                </div>

                {selectedSide === 'away' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 whitespace-nowrap shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đối thủ đã chọn</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 whitespace-nowrap shrink-0">
                    Chạm để chọn đấu
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
                <span className="truncate">
                  Ngôi sao: {todayMatch.awayClub.keyPlayers.slice(0, 3).join(' · ')}
                </span>
                <span className="font-mono font-bold text-yellow-300 tabular-nums shrink-0">
                  Đội hình gốc OVR {todayMatch.awayClub.baseOvr}
                </span>
              </div>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
            <span>
              Đội của bạn: <strong className="text-white">{userTeamName}</strong> (Team OVR{' '}
              <strong className="text-yellow-300 tabular-nums">{currentTeamOvr}</strong>) sẽ đối đầu trực tiếp với{' '}
              <strong className="text-cyan-300">{selectedOpponent.name}</strong>
            </span>
            <span>
              Tâm điểm ngày mai (06:00): {nextMatch.homeClub.name} vs {nextMatch.awayClub.name}
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. DIFFICULTY SELECTOR & LIVE KEY MATCH SIMULATION                    */}
      {/* ===================================================================== */}
      <section className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-xl">
        <img
          src={CLUB_KEY_MATCH_ASSETS.difficultyBg}
          alt="Chọn Độ Khó Trận Cầu Tâm Điểm"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/65 to-slate-950/90 pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white tracking-wide">
                Chọn Độ Khó &amp; Phần Thưởng Token CLB
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Độ khó càng cao, lượng Token Câu Lạc Bộ và Xu nhận được sau mỗi trận càng lớn.
              </p>
            </div>
            <div className="text-xs text-slate-300 font-mono tabular-nums">
              Đối thủ đang chọn: <strong className="text-cyan-300">{selectedOpponent.name}</strong> · Độ khó{' '}
              <strong className="text-yellow-300">{selectedDifficulty.label}</strong>
            </div>
          </div>

          {/* 4 Difficulty Tiles using NOR / PRESS / SEL uploaded textures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {CLUB_DIFFICULTIES.map((diff) => {
              const isSelected = selectedDiffId === diff.id;
              const isPressed = pressedDiffId === diff.id;
              const tileBg = isSelected
                ? CLUB_KEY_MATCH_ASSETS.tileSelected
                : isPressed
                ? CLUB_KEY_MATCH_ASSETS.tilePressed
                : CLUB_KEY_MATCH_ASSETS.tileNormal;

              return (
                <button
                  key={diff.id}
                  type="button"
                  disabled={matchState === 'PLAYING'}
                  onMouseDown={() => setPressedDiffId(diff.id)}
                  onMouseUp={() => setPressedDiffId(null)}
                  onMouseLeave={() => setPressedDiffId(null)}
                  onClick={() => {
                    soundService.playClick();
                    setSelectedDiffId(diff.id);
                  }}
                  className={`relative rounded-2xl overflow-hidden p-4 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[196px] border-2 ${
                    isSelected
                      ? `${diff.accentBorder} shadow-[0_0_24px_rgba(34,211,238,0.28)] scale-[1.01]`
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={tileBg}
                    alt={diff.label}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/70 pointer-events-none" />

                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-cruyff font-black text-lg ${diff.accentText}`}>
                        {diff.label}
                      </span>
                      <span className="font-mono font-bold text-xs text-white tabular-nums">
                        OVR {diff.opponentOvr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{diff.subtitle}</p>
                  </div>

                  <div className="relative z-10 mt-4 pt-3 border-t border-white/15 space-y-1.5 text-xs font-mono tabular-nums">
                    <div className="flex items-center justify-between text-white">
                      <span className="font-sans text-slate-300">Thắng trận:</span>
                      <span className="inline-flex items-center gap-1 font-black text-yellow-300">
                        <img
                          src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                          alt="Token"
                          className="w-3.5 h-3.5 object-contain"
                        />
                        +{diff.winTokens} Token
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-200">
                      <span className="font-sans text-slate-400">Hòa / Thua:</span>
                      <span>
                        +{diff.drawTokens} / +{diff.lossTokens} Token
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-300">
                      <span className="font-sans text-slate-400">Thưởng thắng:</span>
                      <span>+{diff.winCoins.toLocaleString('vi-VN')} Xu</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tactical Playstyle Matchup & Quick Switcher */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-yellow-400/35 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeUserStyle.iconUrl}
                  alt={activeUserStyle.name}
                  className="w-9 h-9 object-contain shrink-0"
                />
                <div className="text-xs">
                  <span className="text-yellow-300 font-bold uppercase block">
                    Phong Cách Của Bạn: {activeUserStyle.name}
                  </span>
                  <span
                    className={
                      styleMatchup.advantage === 'user'
                        ? 'text-emerald-300 font-semibold'
                        : styleMatchup.advantage === 'opp'
                        ? 'text-rose-300 font-semibold'
                        : 'text-slate-300'
                    }
                  >
                    {styleMatchup.summaryText}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-right">
                <div>
                  <span className="text-slate-400 block">Phong cách {selectedOpponent.name}</span>
                  <span className="font-bold text-cyan-300 uppercase">{oppPlayStyle.name}</span>
                </div>
                <img
                  src={oppPlayStyle.iconUrl}
                  alt={oppPlayStyle.name}
                  className="w-8 h-8 object-contain shrink-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {TACTICAL_PLAYSTYLES.map((st) => {
                const isCur = st.id === activeUserStyle.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleChangeClubPlayStyle(st.id)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-cruyff font-bold uppercase flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                      isCur
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                        : 'bg-black/45 text-slate-200 border-white/15 hover:border-yellow-400/45'
                    }`}
                  >
                    <img src={st.iconUrl} alt="" className="w-4 h-4 object-contain" />
                    <span>{st.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Match Control & Live Scoreboard Panel */}
          {matchState === 'IDLE' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/85 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="font-cruyff font-black text-lg text-white">
                  {userTeamName} (OVR {currentTeamOvr}) vs {selectedOpponent.name} (OVR{' '}
                  {selectedDifficulty.opponentOvr} · {selectedDifficulty.label})
                </div>
                <div className="x-0 text-xs text-slate-300 tabular-nums">
                  {matchesRemaining > 0
                    ? `Thời lượng 45 giây · Thắng nhận ngay +${selectedDifficulty.winTokens} Token CLB & +${selectedDifficulty.winCoins.toLocaleString('vi-VN')} Xu · Còn ${matchesRemaining}/2 trận hôm nay`
                    : `Bạn đã hoàn thành đủ 2/2 trận đấu nổi bật hôm nay. Lượt mới mở lại lúc 06:00 sáng (${countdown6AM}).`}
                </div>
              </div>

              <button
                type="button"
                disabled={matchesRemaining <= 0}
                onClick={handleStartKeyMatch}
                className={`px-6 py-3 rounded-xl font-cruyff font-black text-sm tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
                  matchesRemaining > 0
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer shadow-[0_6px_24px_rgba(34,211,238,0.35)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {matchesRemaining > 0
                    ? `Đá Trận Tâm Điểm 45s (${DAILY_MAX_CLUB_MATCHES - matchesRemaining + 1}/${DAILY_MAX_CLUB_MATCHES})`
                    : 'Đã Hết Lượt Hôm Nay (2/2)'}
                </span>
              </button>
            </div>
          )}

          {matchState !== 'IDLE' && (
            <div className="p-5 rounded-2xl bg-slate-950/95 border border-cyan-400/50 space-y-4">
              {/* Live Scoreboard */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-300 block">Đội Của Bạn</span>
                    <span className="font-cruyff font-black text-base sm:text-lg text-white">
                      {userTeamName}
                    </span>
                  </div>
                </div>

                <div className="text-center px-4">
                  <div className="text-xs font-mono text-cyan-300 tabular-nums mb-0.5">
                    {matchState === 'FINISHED'
                      ? 'HẾT GIỜ · 90’ (45s)'
                      : `TRỰC TIẾP · ${matchMinute}’ (Còn ${matchSecondsLeft}s)`}
                  </div>
                  <div className="font-mono font-black text-3xl sm:text-4xl text-yellow-300 tabular-nums tracking-wider">
                    {userGoals} : {oppGoals}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Độ khó {selectedDifficulty.label}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-cyan-300 block">Đối Thủ Tâm Điểm</span>
                    <span className="font-cruyff font-black text-base sm:text-lg text-white">
                      {selectedOpponent.name}
                    </span>
                  </div>
                  <ClubShieldBadge club={selectedOpponent} sizeClass="w-11 h-11" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (matchMinute / 90) * 100)}%` }}
                />
              </div>

              {/* Tactical Controls During Match */}
              {matchState === 'PLAYING' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10">
                    {(
                      [
                        { id: 'defensive', label: 'Phòng Thủ' },
                        { id: 'balanced', label: 'Cân Bằng' },
                        { id: 'attacking', label: 'Tấn Công' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setLiveMentality(m.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          liveMentality === m.id
                            ? 'bg-cyan-400 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleInstantFinish}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Tua Nhanh Kết Quả 90’</span>
                  </button>
                </div>
              )}

              {/* Finished Reward Summary */}
              {matchState === 'FINISHED' && finishedSummary && (
                <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-400/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="font-cruyff font-black text-base text-white">
                      {finishedSummary.result === 'W'
                        ? 'Chiến Thắng Thuyết Phục!'
                        : finishedSummary.result === 'D'
                        ? 'Trận Cầu Kịch Tính Chia Điểm!'
                        : 'Hoàn Thành Trận Đấu Tâm Điểm!'}
                    </div>
                    <div className="text-xs text-slate-200 tabular-nums">
                      Đã cộng trực tiếp{' '}
                      <strong className="text-cyan-300">
                        +{finishedSummary.tokensEarned} Token CLB
                      </strong>{' '}
                      và{' '}
                      <strong className="text-yellow-300">
                        +{finishedSummary.coinsEarned.toLocaleString('vi-VN')} Xu
                      </strong>{' '}
                      vào tài khoản của bạn.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setMatchState('IDLE');
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-cruyff font-black text-xs tracking-wider whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    {matchesRemaining > 0
                      ? `Tiếp Tục (Còn ${matchesRemaining} Trận Hôm Nay)`
                      : 'Hoàn Tất 2/2 Trận Hôm Nay'}
                  </button>
                </div>
              )}

              {/* Commentary Feed */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {matchEvents.map((ev, idx) => (
                  <div
                    key={`${ev.minute}_${idx}`}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 tabular-nums ${
                      ev.isGoal && ev.side === 'user'
                        ? 'bg-emerald-500/20 text-emerald-200 font-semibold'
                        : ev.isGoal && ev.side === 'opp'
                        ? 'bg-rose-500/20 text-rose-200 font-semibold'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-bold text-yellow-300 w-8 shrink-0">
                      {ev.minute}’
                    </span>
                    <span>{ev.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's 2-Match History Log */}
          {normalizedDaily.history.length > 0 && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 tabular-nums">
              <span className="font-semibold text-white">Kết quả hôm nay:</span>
              <div className="flex flex-wrap items-center gap-4">
                {normalizedDaily.history.map((h, i) => (
                  <span key={h.id}>
                    Trận {i + 1}: vs {h.opponentName} ({h.difficultyLabel}) ·{' '}
                    <strong
                      className={
                        h.result === 'W'
                          ? 'text-emerald-300'
                          : h.result === 'D'
                          ? 'text-amber-300'
                          : 'text-rose-300'
                      }
                    >
                      {h.userGoals}–{h.oppGoals}
                    </strong>{' '}
                    (+{h.tokensEarned} Token CLB)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. CLUB TOKEN EXCHANGE SHOP (50 TOKEN TICKET · THURAM 102 · SUKER 101) */}
      {/* ===================================================================== */}
      <section className="p-5 sm:p-6 rounded-2xl bg-zinc-900/95 border border-yellow-400/40 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center shrink-0">
              <img
                src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                alt="Token CLB"
                referrerPolicy="no-referrer"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white tracking-wide">
                Cửa Hàng Trao Đổi Token Câu Lạc Bộ
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Dùng Token Câu Lạc Bộ tích lũy mỗi ngày để đổi Vé Quay, bộ đôi TOTY HM và bộ ba Siêu Sao Ballon d&apos;Or độc quyền.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="text-slate-300">
              Đang có:{' '}
              <strong className="text-cyan-300 text-sm">
                {clubTokens.toLocaleString('vi-VN')} Token CLB
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300">
              Vé Quay:{' '}
              <strong className="text-rose-300 text-sm">
                {userTickets.toLocaleString('vi-VN')} Vé
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* ITEM 1: 1 SPIN TICKET = 50 CLUB TOKENS */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-white/15 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
                <span>Vật Phẩm Quay Thẻ</span>
                <span className="font-mono tabular-nums">Không giới hạn lượt đổi</span>
              </div>

              <div className="h-56 rounded-xl bg-gradient-to-b from-rose-950/45 via-slate-900 to-slate-950 border border-white/10 flex flex-col items-center justify-center p-4">
                <img
                  src={CLUB_KEY_MATCH_ASSETS.spinTicketIcon}
                  alt="1 Vé Quay Sự Kiện"
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 object-contain drop-shadow-[0_8px_24px_rgba(244,63,94,0.45)]"
                />
                <h4 className="font-cruyff font-black text-xl text-white mt-3">
                  1 Vé Quay Sự Kiện
                </h4>
                <p className="text-xs text-slate-400 text-center mt-0.5">
                  Dùng mở thẻ UTOTY, EURO 2024, LaLiga &amp; Future Stars
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={clubTokens < 50}
                onClick={() => handleTriggerExchange('ticket_1')}
                className={`w-full py-3 px-4 rounded-xl font-cruyff font-black text-sm flex items-center justify-between transition-all whitespace-nowrap ${
                  clubTokens >= 50
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-98 cursor-pointer shadow-md'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Đổi 1 Vé Quay</span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <img
                    src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                    alt="Token"
                    className="w-4 h-4 object-contain"
                  />
                  50 Token
                </span>
              </button>

              <button
                type="button"
                disabled={clubTokens < 250}
                onClick={() => handleTriggerExchange('ticket_5')}
                className={`w-full py-2.5 px-4 rounded-xl font-cruyff font-bold text-xs flex items-center justify-between transition-all whitespace-nowrap border ${
                  clubTokens >= 250
                    ? 'bg-slate-900 hover:bg-slate-800 border-amber-400/50 text-amber-300 cursor-pointer'
                    : 'bg-slate-900/50 border-white/5 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>Đổi Nhanh 5 Vé Quay</span>
                <span className="font-mono tabular-nums">250 Token</span>
              </button>
            </div>
          </div>

          {/* ITEM 2: TOTY HM SUKER 101 OVR = 3,000 CLUB TOKENS */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-purple-400/40 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                <span>TOTY Honorable Mentions · ST</span>
                <span className="font-mono text-yellow-300 tabular-nums">OVR 101</span>
              </div>

              <div className="py-2 rounded-xl bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 border border-white/10 flex flex-col items-center justify-center">
                <FCCard player={sukerCard} size="md" showStats={true} />
                <div className="mt-2 text-center px-3">
                  <h4 className="font-cruyff font-black text-lg text-white">
                    TOTY HM Davor Šuker (101 OVR)
                  </h4>
                  <p className="text-xs text-slate-400 tabular-nums">
                    PAC {sukerCard.pac} · SHO {sukerCard.sho} · DRI {sukerCard.dri} · Chân trái sát thủ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
                <span>Tiến độ tích lũy</span>
                <span className="text-cyan-300">
                  {Math.min(3000, clubTokens).toLocaleString('vi-VN')} / 3.000 Token
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-cyan-400"
                  style={{ width: `${Math.min(100, (clubTokens / 3000) * 100)}%` }}
                />
              </div>

              <button
                type="button"
                disabled={ownsSuker || clubTokens < 3000}
                onClick={() => handleTriggerExchange('suker_101')}
                className={`w-full py-3 px-4 rounded-xl font-cruyff font-black text-sm flex items-center justify-between transition-all whitespace-nowrap ${
                  ownsSuker
                    ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 cursor-default'
                    : clubTokens >= 3000
                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 text-white hover:brightness-110 active:scale-98 cursor-pointer shadow-lg'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{ownsSuker ? 'Đã Sở Hữu Trong CLB' : 'Trao Đổi Šuker 101'}</span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  {!ownsSuker && (
                    <img
                      src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                      alt="Token"
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  {ownsSuker ? '1/1' : '3.000 Token'}
                </span>
              </button>
            </div>
          </div>

          {/* ITEM 3: TOTY HM THURAM 102 OVR = 5,000 CLUB TOKENS */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-yellow-400/55 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-yellow-300 font-semibold">
                <span>TOTY Honorable Mentions · RB</span>
                <span className="font-mono text-yellow-300 tabular-nums">OVR 102</span>
              </div>

              <div className="py-2 rounded-xl bg-gradient-to-b from-blue-950/50 via-purple-950/35 to-slate-950 border border-white/10 flex flex-col items-center justify-center">
                <FCCard player={thuramCard} size="md" showStats={true} />
                <div className="mt-2 text-center px-3">
                  <h4 className="font-cruyff font-black text-lg text-white">
                    TOTY HM Lilian Thuram (102 OVR)
                  </h4>
                  <p className="text-xs text-slate-400 tabular-nums">
                    PAC {thuramCard.pac} · DEF {thuramCard.def} · PHY {thuramCard.phy} · Hậu vệ thép Pháp
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
                <span>Tiến độ tích lũy</span>
                <span className="text-cyan-300">
                  {Math.min(5000, clubTokens).toLocaleString('vi-VN')} / 5.000 Token
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-cyan-400"
                  style={{ width: `${Math.min(100, (clubTokens / 5000) * 100)}%` }}
                />
              </div>

              <button
                type="button"
                disabled={ownsThuram || clubTokens < 5000}
                onClick={() => handleTriggerExchange('thuram_102')}
                className={`w-full py-3 px-4 rounded-xl font-cruyff font-black text-sm flex items-center justify-between transition-all whitespace-nowrap ${
                  ownsThuram
                    ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 cursor-default'
                    : clubTokens >= 5000
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-cyan-400 text-slate-950 hover:brightness-110 active:scale-98 cursor-pointer shadow-lg'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{ownsThuram ? 'Đã Sở Hữu Trong CLB' : 'Trao Đổi Thuram 102'}</span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  {!ownsThuram && (
                    <img
                      src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                      alt="Token"
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  {ownsThuram ? '1/1' : '5.000 Token'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* BALLON D'OR CLUB TOKEN REWARDS SECTION */}
        <div className="pt-4 border-t border-amber-400/25 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/khung_th__c_u_th__ballon_dor_fefecb94.png"
                alt="Ballon d'Or"
                className="w-7 h-7 object-contain shrink-0"
              />
              <div>
                <h4 className="font-cruyff font-black text-lg text-amber-200 tracking-wide">
                  Phần Thưởng Cầu Thủ Ballon d&apos;Or Câu Lạc Bộ
                </h4>
                <p className="text-xs text-slate-400">
                  Mở khóa trực tiếp bằng Token CLB kèm hiệu ứng Walkout Biên Niên Sử Icons (không giao dịch).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {[
              {
                kind: 'messi_102' as const,
                card: messiCard,
                owned: ownsMessi,
                cost: CLUB_EXCHANGE_ITEMS.messi102.costTokens,
                subtitle: `SHO ${messiCard.sho} · PAS ${messiCard.pas} · DRI ${messiCard.dri} · Huyền thoại Inter Miami`,
                buttonText: 'Trao Đổi Messi 102',
                borderClass: 'border-amber-400/55',
                gradientButton:
                  'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950',
              },
              {
                kind: 'rodri_102' as const,
                card: rodriCard,
                owned: ownsRodri,
                cost: CLUB_EXCHANGE_ITEMS.rodri102.costTokens,
                subtitle: `PAS ${rodriCard.pas} · DEF ${rodriCard.def} · PHY ${rodriCard.phy} · Quả Bóng Vàng 2024`,
                buttonText: 'Trao Đổi Rodri 102',
                borderClass: 'border-amber-400/55',
                gradientButton:
                  'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950',
              },
              {
                kind: 'yamal_102' as const,
                card: yamalCard,
                owned: ownsYamal,
                cost: CLUB_EXCHANGE_ITEMS.yamal102.costTokens,
                subtitle: `PAC ${yamalCard.pac} · DRI ${yamalCard.dri} · PAS ${yamalCard.pas} · Thần đồng Barcelona`,
                buttonText: 'Trao Đổi Yamal 102',
                borderClass: 'border-amber-400/45',
                gradientButton:
                  'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950',
              },
              {
                kind: 'mbappe_103' as const,
                card: mbappeCard,
                owned: ownsMbappe,
                cost: CLUB_EXCHANGE_ITEMS.mbappe103.costTokens,
                subtitle: `PAC ${mbappeCard.pac} · SHO ${mbappeCard.sho} · DRI ${mbappeCard.dri} · Siêu tiền đạo Real Madrid`,
                buttonText: 'Trao Đổi Mbappé 103',
                borderClass: 'border-yellow-400/55',
                gradientButton:
                  'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 text-slate-950',
              },
              {
                kind: 'kane_104' as const,
                card: kaneCard,
                owned: ownsKane,
                cost: CLUB_EXCHANGE_ITEMS.kane104.costTokens,
                subtitle: `SHO ${kaneCard.sho} · PAS ${kaneCard.pas} · PHY ${kaneCard.phy} · Chủ nhân Quả Bóng Vàng`,
                buttonText: 'Trao Đổi Harry Kane 104',
                borderClass: 'border-yellow-300/75 shadow-[0_0_24px_rgba(251,191,36,0.16)]',
                gradientButton:
                  'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-slate-950',
              },
            ].map((item) => (
              <div
                key={item.kind}
                className={`p-5 rounded-2xl bg-slate-950 border ${item.borderClass} flex flex-col justify-between gap-4`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span>Ballon d&apos;Or · {item.card.position}</span>
                    <span className="font-mono text-yellow-200 tabular-nums">
                      OVR {item.card.ovr}
                    </span>
                  </div>

                  <div className="py-2 rounded-xl bg-gradient-to-b from-amber-950/35 via-slate-900 to-slate-950 border border-white/10 flex flex-col items-center justify-center">
                    <FCCard player={item.card} size="md" showStats={true} />
                    <div className="mt-2 text-center px-3">
                      <h4 className="font-cruyff font-black text-lg text-white">
                        Ballon d&apos;Or {item.card.name} ({item.card.ovr} OVR)
                      </h4>
                      <p className="text-xs text-slate-400 tabular-nums">{item.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
                    <span>Tiến độ tích lũy</span>
                    <span className="text-amber-300">
                      {Math.min(item.cost, clubTokens).toLocaleString('vi-VN')} /{' '}
                      {item.cost.toLocaleString('vi-VN')} Token
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500"
                      style={{
                        width: `${Math.min(100, (clubTokens / item.cost) * 100)}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={item.owned || clubTokens < item.cost}
                    onClick={() => handleTriggerExchange(item.kind)}
                    className={`w-full py-3 px-4 rounded-xl font-cruyff font-black text-sm flex items-center justify-between transition-all whitespace-nowrap ${
                      item.owned
                        ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 cursor-default'
                        : clubTokens >= item.cost
                        ? `${item.gradientButton} hover:brightness-110 active:scale-98 cursor-pointer shadow-lg`
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {item.owned ? 'Đã Sở Hữu Trong CLB' : item.buttonText}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      {!item.owned && (
                        <img
                          src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                          alt="Token"
                          className="w-4 h-4 object-contain"
                        />
                      )}
                      {item.owned ? '1/1' : `${item.cost.toLocaleString('vi-VN')} Token`}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* CELEBRATION MODAL WHEN UNLOCKING THURAM 102 OR SUKER 101              */}
      {/* ===================================================================== */}
      {celebrationCard && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-yellow-400/60 p-6 text-center space-y-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setCelebrationCard(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-300">
              <Sparkles className="w-4 h-4" />
              <span>Chiêu Mộ Huyền Thoại Câu Lạc Bộ Thành Công</span>
            </div>

            <h4 className="font-cruyff font-black text-2xl text-white">
              {celebrationCard.name} · OVR {celebrationCard.ovr}
            </h4>

            <div className="flex justify-center py-2">
              <FCCard player={celebrationCard} size="lg" showStats={true} />
            </div>

            <p className="text-xs text-slate-300">
              Thẻ cầu thủ đã được chuyển vào Kho Cầu Thủ CLB trong Đội Hình. Bạn có thể đưa ngay vào Đội Hình Chính tại mục Sơ Đồ &amp; Thay Người!
            </p>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCelebrationCard(null);
              }}
              className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-sm cursor-pointer transition-colors"
            >
              Xác Nhận &amp; Đưa Vào CLB
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* WALKOUT REVEAL MODAL FOR BALLON D'OR (ICONS EXCHANGE ANIMATION)       */}
      {/* ===================================================================== */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`BALLON D'OR CÂU LẠC BỘ · ${walkoutRewardCard.name} (${walkoutRewardCard.ovr} OVR)`}
          isTicketSpin={false}
          autoStartWalkout={true}
          skipResourceBonus={true}
          isIconChroniclesExchange={true}
          ticketsRemaining={userTickets}
          spinCount={1}
          onUseTicket={() => false}
          onClose={() => setWalkoutRewardCard(null)}
          onPlayerClaimed={() => setWalkoutRewardCard(null)}
        />
      )}
    </div>
  );
};
