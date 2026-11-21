import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Swords,
  Users,
  Clock,
  Star,
  Gift,
  History,
  Wifi,
  WifiOff,
  Smile,
  Mic,
  Sliders,
  Bot,
  Send,
  CheckCircle2,
  Play,
  FastForward,
  Ticket,
} from 'lucide-react';
import {
  UserProfile,
  PlayerCard,
  FormationConfig,
  FormationSlot,
  TacticalPlayStyleId,
  RankedIncomingInvite,
  RankedOnlineCoachSummary,
} from '../types/game';
import { soundService } from '../services/sound';
import { GINGA_ASSETS } from '../data/gingaData';
import { availableFormations } from '../data/formationsData';
import { FCCard } from './FCCard';
import { useEuro2024Assets } from '../data/euro2024Assets';
import {
  SubstitutePillButton,
  CommentatorBelowStatsBanner,
} from './GameUiIcons';
import {
  getDaily6AMCycleKey,
  normalizeGingaState,
  formatTodayVN,
  normalizeIconChroniclesDaily,
} from '../utils/dateUtils';
import {
  isBundesligaPlayer,
  normalizeBundesligaState,
} from '../data/bundesligaData';
import { totyFeaturedPlayers } from '../data/mockData';
import {
  RANKED_ASSETS,
  RANKED_TIERS,
  normalizeRankedSeasonState,
  resolveRankFromStars,
  applyRankedMatchOutcome,
  generateRandomRankedBot,
  formatRankedSeasonCountdown,
  RankedOutcomeSummary,
} from '../data/rankedData';
import {
  TACTICAL_PLAYSTYLES,
  getPlayStyleDef,
  evaluatePlayStyleMatchup,
} from '../data/playStylesData';
import { normalizeKickoffState } from '../data/kickoffData';
import { normalizeStarPassState } from './StarPassModal';
import {
  getCanonicalPlayerNameKey,
  getEffectiveStarterOvr,
  computeSquadOvr,
} from '../utils/squadUtils';
import { evaluateManagerBonus } from '../data/managersData';
import { ApexPitchCanvas } from './ApexPitchCanvas';
import {
  ApexControlInput,
  ApexMatchState,
  ApexPlayerInit,
} from '../engine/apexMatchEngine';
import {
  pickRealCardBotSquad,
  playerCardToApexInit,
} from '../utils/apexCardRoster';

interface RankedModeModalProps {
  user: UserProfile;
  starters: PlayerCard[];
  bench: PlayerCard[];
  activeFormation: FormationConfig;
  onUpdateSquad: (
    newStarters: PlayerCard[],
    newBench: PlayerCard[],
    formationId: string,
    ovr: number
  ) => void;
  onUpdateUser: (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onSelectPlayStyle: (style: TacticalPlayStyleId) => void;
  onOpenMyTeam: () => void;
  pendingInviteToAccept?: RankedIncomingInvite | null;
  onClearPendingInvite?: () => void;
  pendingDirectInviteTarget?: { connId: string; username: string } | null;
  onClearPendingDirectInvite?: () => void;
  onClose: () => void;
}

interface PitchEntity {
  id: string;
  cardId?: string;
  name: string;
  shortName: string;
  pos: string;
  ovr: number;
  x: number;
  y: number;
  stamina: number;
  isGk?: boolean;
}

interface CommentaryLine {
  id: string;
  minute: number;
  text: string;
  tone: 'normal' | 'danger' | 'goal' | 'tactic' | 'emoji';
}

interface MatchOpponentInfo {
  coachName: string;
  teamName: string;
  badgeUrl: string;
  ovr: number;
  rankLabel: string;
  rankLogoUrl: string;
  isBot: boolean;
}

interface FloatingEmojiItem {
  id: string;
  emoji: string;
  label: string;
  coachName: string;
  isSelf: boolean;
}

type MentalityOption = 'defensive' | 'balanced' | 'attacking';
type PressingOption = 'low' | 'medium' | 'high';
type AttackFocusOption = 'mixed' | 'wings' | 'center' | 'long_shot';

const EMOJI_PRESETS = [
  { emoji: '⚽', label: 'Ginga!' },
  { emoji: '🔥', label: 'Bùng nổ!' },
  { emoji: '👏', label: 'Hay lắm!' },
  { emoji: '😎', label: 'Tự tin!' },
  { emoji: '⚡', label: 'Tấn công!' },
  { emoji: '🛡️', label: 'Chắc chắn!' },
  { emoji: '😂', label: 'Haha!' },
  { emoji: '😡', label: 'Căng rồi!' },
  { emoji: '😭', label: 'Tiếc quá!' },
  { emoji: '🙏', label: 'May mắn!' },
];

const mapSlotToHorizontalPitch = (slot: FormationSlot, isGk: boolean) => {
  if (isGk || slot.pos === 'GK') return { x: 7, y: 50 };
  const hx = Math.max(18, Math.min(78, 18 + ((90 - slot.y) / 72) * 58));
  const hy = Math.max(12, Math.min(88, slot.x));
  return { x: hx, y: hy };
};

const clampVal = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const RankedModeModal: React.FC<RankedModeModalProps> = ({
  user,
  starters,
  bench,
  activeFormation,
  onUpdateSquad,
  onUpdateUser,
  onSelectPlayStyle,
  onOpenMyTeam,
  pendingInviteToAccept,
  onClearPendingInvite,
  pendingDirectInviteTarget,
  onClearPendingDirectInvite,
  onClose,
}) => {
  const [lobbyTab, setLobbyTab] = useState<'lobby' | 'rewards' | 'history'>('lobby');
  const [phase, setPhase] = useState<'lobby' | 'searching' | 'playing' | 'result'>('lobby');
  const [matchMode, setMatchMode] = useState<'pvp' | 'bot'>('bot');
  const [rankedSubMode, setRankedSubMode] = useState<'manager' | 'apex'>('apex');
  const rankedSubModeRef = useRef<'manager' | 'apex'>('apex');
  useEffect(() => {
    rankedSubModeRef.current = rankedSubMode;
  }, [rankedSubMode]);

  const [apexPvpState, setApexPvpState] = useState<ApexMatchState | null>(null);
  const [apexMatchStarters, setApexMatchStarters] = useState<{
    p1: ApexPlayerInit[];
    p2: ApexPlayerInit[];
    botTierIndex: number;
  } | null>(null);

  // WebSocket & Online Presence State
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [myConnId, setMyConnId] = useState<string>('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState<RankedOnlineCoachSummary[]>([]);
  const [modalInvite, setModalInvite] = useState<RankedIncomingInvite | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Live Match State
  const [opponent, setOpponent] = useState<MatchOpponentInfo | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [minute, setMinute] = useState(1);
  const [userScore, setUserScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [userShots, setUserShots] = useState(0);
  const [oppShots, setOppShots] = useState(0);
  const [userPossessionPct, setUserPossessionPct] = useState(50);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [userEntities, setUserEntities] = useState<PitchEntity[]>([]);
  const [oppEntities, setOppEntities] = useState<PitchEntity[]>([]);
  const [commentary, setCommentary] = useState<CommentaryLine[]>([]);
  const [goalBanner, setGoalBanner] = useState<{
    scorer: string;
    side: 'user' | 'opp';
  } | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiItem[]>([]);

  // Live Coaching, Formation & Substitutions (aligned with CareerModeModal)
  const { getAsset: getEuroAsset } = useEuro2024Assets();
  const [mentality, setMentality] = useState<MentalityOption>('balanced');
  const [pressing, setPressing] = useState<PressingOption>('medium');
  const [attackFocus, setAttackFocus] = useState<AttackFocusOption>('mixed');
  const [matchFormation, setMatchFormation] = useState<FormationConfig>(activeFormation);
  const [matchStarters, setMatchStarters] = useState<PlayerCard[]>(starters);
  const [matchBench, setMatchBench] = useState<PlayerCard[]>(bench);
  const [livePlayStyleId, setLivePlayStyleId] = useState<TacticalPlayStyleId>(() =>
    getPlayStyleDef(user.playStyle).id
  );
  const [showSubDrawer, setShowSubDrawer] = useState(false);
  const [selectedPitchIdx, setSelectedPitchIdx] = useState<number | null>(null);
  const [subsMade, setSubsMade] = useState(0);
  const lastEmojiAtRef = useRef<number>(0);

  useEffect(() => {
    if (user.playStyle) {
      setLivePlayStyleId(getPlayStyleDef(user.playStyle).id);
    }
  }, [user.playStyle]);

  const activeMatchPlayStyle = useMemo(
    () => getPlayStyleDef(livePlayStyleId),
    [livePlayStyleId]
  );

  const featuredSquadStar = useMemo(() => {
    const pool = matchStarters.length > 0 ? matchStarters : starters;
    return [...pool].sort((a, b) => b.ovr - a.ovr)[0] || starters[0];
  }, [matchStarters, starters]);

  // Final Result Summary
  const [outcomeSummary, setOutcomeSummary] = useState<{
    ranked: RankedOutcomeSummary;
    gingaTokensEarned: number;
    userGoals: number;
    oppGoals: number;
    isBot: boolean;
    opponent: MatchOpponentInfo;
  } | null>(null);

  const matchFinalizedRef = useRef(false);
  const managerBundesligaGoalsRef = useRef(0);
  const opponentRef = useRef<MatchOpponentInfo | null>(null);
  useEffect(() => {
    opponentRef.current = opponent;
  }, [opponent]);
  const botEngineRef = useRef<{
    secondsLeft: number;
    totalTicks: number;
    possTicks: number;
    possession: 'user' | 'opp';
    ballPos: { x: number; y: number };
    userScore: number;
    oppScore: number;
    userShots: number;
    oppShots: number;
    userEntities: PitchEntity[];
    oppEntities: PitchEntity[];
    oppStyle: TacticalPlayStyleId;
  } | null>(null);

  const [nowTickMs, setNowTickMs] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTickMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const cycleKey = getDaily6AMCycleKey();
  const gingaState = useMemo(
    () => normalizeGingaState(user.gingaState, cycleKey),
    [user.gingaState, cycleKey]
  );
  const rankedState = useMemo(
    () => normalizeRankedSeasonState(user.rankedState, nowTickMs),
    [user.rankedState, nowTickMs]
  );
  const rankInfo = useMemo(
    () => resolveRankFromStars(rankedState.totalStars, rankedState.hasReachedChampion),
    [rankedState.totalStars, rankedState.hasReachedChampion]
  );

  const seasonCountdown = useMemo(
    () => formatRankedSeasonCountdown(rankedState.seasonEndsAt, nowTickMs),
    [rankedState.seasonEndsAt, nowTickMs]
  );

  const currentPlayStyle = useMemo(() => getPlayStyleDef(user.playStyle), [user.playStyle]);

  const showNotice = useCallback((msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((cur) => (cur === msg ? null : cur));
    }, 3400);
  }, []);

  const JERSEY_NUMS = [11, 9, 7, 8, 6, 10, 3, 4, 5, 2, 1];

  const buildMyApexStarters = useCallback((): ApexPlayerInit[] => {
    const trainBoost = Math.max(0, user.trainingLevel ?? 0);
    return starters.slice(0, 11).map((p, idx) => {
      const slot = activeFormation.slots[idx] || activeFormation.slots[0];
      const isGk = idx === 10 || slot.pos === 'GK';
      const effectivePos = isGk ? 'GK' : slot.pos || p.position;
      const coords = mapSlotToHorizontalPitch(slot, isGk);
      const effOvr = getEffectiveStarterOvr(p, effectivePos, user.trainingLevel);
      return playerCardToApexInit({
        card: p,
        idPrefix: 'u',
        idx,
        slotPos: effectivePos,
        baseX: coords.x,
        baseY: coords.y,
        effOvr,
        jerseyNumber: JERSEY_NUMS[idx] ?? idx + 1,
        trainBoost,
        isGk,
      });
    });
  }, [starters, activeFormation, user.trainingLevel]);

  const buildMyWsProfile = useCallback((overrideSubMode?: 'manager' | 'apex') => {
    const chosenMode = overrideSubMode ?? rankedSubModeRef.current;
    const apexList = buildMyApexStarters();
    return {
      clientId: user.deviceId || user.username,
      username: user.username,
      teamName: user.teamName,
      teamLogo: user.teamLogo,
      ovr: user.ovr,
      tierIndex: rankInfo.tierIndex,
      rankLabel: rankInfo.fullLabel,
      rankLogoUrl: rankInfo.logoUrl,
      careerMatches: user.careerMatchesPlayed ?? 0,
      rankedWins: rankedState.wins,
      rankedDraws: rankedState.draws,
      rankedLosses: rankedState.losses,
      formationName: activeFormation.name,
      rankedSubMode: chosenMode,
      starters: apexList.map((ap) => ({
        id: ap.id,
        name: ap.name,
        shortName: ap.shortName,
        pos: ap.pos,
        ovr: ap.ovr,
        baseX: ap.baseX,
        baseY: ap.baseY,
        isGk: ap.isGk,
        number: ap.number,
        pac: ap.pac,
        sho: ap.sho,
        pas: ap.pas,
        dri: ap.dri,
        def: ap.def,
        phy: ap.phy,
        cardId: ap.cardId,
        cardType: ap.cardType,
        league: ap.league,
        avatarUrl: ap.avatarUrl,
        customFrameUrl: ap.customFrameUrl,
        frameIncludesPortrait: ap.frameIncludesPortrait,
        club: ap.club,
        clubLogo: ap.clubLogo,
        nation: ap.nation,
        nationFlag: ap.nationFlag,
        skillMoves: ap.skillMoves,
        weakFoot: ap.weakFoot,
        pixelProfile: ap.pixelProfile,
      })),
    };
  }, [
    buildMyApexStarters,
    user.deviceId,
    user.username,
    user.teamName,
    user.teamLogo,
    user.ovr,
    user.careerMatchesPlayed,
    rankInfo.tierIndex,
    rankInfo.fullLabel,
    rankInfo.logoUrl,
    rankedState.wins,
    rankedState.draws,
    rankedState.losses,
    activeFormation,
  ]);

  const buildMyPitchEntities = useCallback((): PitchEntity[] => {
    return starters.slice(0, 11).map((p, idx) => {
      const slot = activeFormation.slots[idx] || activeFormation.slots[0];
      const isGk = idx === 10 || slot.pos === 'GK';
      const effectivePos = isGk ? 'GK' : slot.pos || p.position;
      const coords = mapSlotToHorizontalPitch(slot, isGk);
      return {
        id: `u_${idx}_${p.id}`,
        cardId: p.id,
        name: p.name,
        shortName: p.name.split(' ').pop() || p.name,
        pos: effectivePos,
        ovr: getEffectiveStarterOvr(p, effectivePos, user.trainingLevel),
        x: coords.x,
        y: coords.y,
        stamina: 100,
        isGk,
      };
    });
  }, [starters, activeFormation, user.trainingLevel]);

  const countBundesligaGoalIds = useCallback(
    (cardIds?: string[]): number => {
      if (!cardIds || cardIds.length === 0) return 0;
      const cardPool = new Map<string, PlayerCard>();
      totyFeaturedPlayers.forEach((p) => cardPool.set(p.id, p));
      starters.forEach((p) => cardPool.set(p.id, p));
      bench.forEach((p) => cardPool.set(p.id, p));
      matchStarters.forEach((p) => cardPool.set(p.id, p));
      matchBench.forEach((p) => cardPool.set(p.id, p));
      let count = 0;
      for (const rawId of cardIds) {
        if (!rawId) continue;
        const direct = cardPool.get(rawId);
        if (isBundesligaPlayer(direct)) {
          count += 1;
          continue;
        }
        if (rawId.includes('bundesliga_')) {
          count += 1;
        }
      }
      return count;
    },
    [starters, bench, matchStarters, matchBench]
  );

  const finalizeMatch = useCallback(
    (
      finalUserGoals: number,
      finalOppGoals: number,
      oppInfo: MatchOpponentInfo,
      isBot: boolean,
      scorerCardIds?: string[]
    ) => {
      if (matchFinalizedRef.current) return;
      matchFinalizedRef.current = true;

      const result: 'W' | 'D' | 'L' =
        finalUserGoals > finalOppGoals ? 'W' : finalUserGoals < finalOppGoals ? 'L' : 'D';

      const todayStr = formatTodayVN();
      const summary = applyRankedMatchOutcome(
        user.rankedState,
        result,
        {
          opponentName: oppInfo.coachName,
          opponentTeamName: oppInfo.teamName,
          opponentLogo: oppInfo.badgeUrl,
          opponentOvr: oppInfo.ovr,
          isBot,
          userGoals: finalUserGoals,
          oppGoals: finalOppGoals,
          dateStr: todayStr,
        },
        Date.now()
      );

      const curCycle = getDaily6AMCycleKey();
      const curGingaPreview = normalizeGingaState(user.gingaState, curCycle);
      const canGetGinga = curGingaPreview.matchesPlayedToday < 5;
      const gingaBonus = canGetGinga
        ? result === 'W'
          ? 200
          : result === 'D'
          ? 100
          : 50
        : 0;

      if (result === 'W' || summary.promotedTier) {
        soundService.playTrophy();
        try {
          confetti({
            particleCount: summary.promotedTier ? 120 : 70,
            spread: 85,
            origin: { y: 0.58 },
          });
        } catch {
          // ignore
        }
      } else {
        soundService.playCoins();
      }

      onUpdateUser((prev) => {
        const latestCycle = getDaily6AMCycleKey();
        const prevGinga = normalizeGingaState(prev.gingaState, latestCycle);
        const allowGinga = prevGinga.matchesPlayedToday < 5;
        const awardedGinga = allowGinga
          ? result === 'W'
            ? 200
            : result === 'D'
            ? 100
            : 50
          : 0;

        const curKo = normalizeKickoffState(prev.kickoffState);
        const curSp = normalizeStarPassState(prev.starPass);
        const curIconsDaily = normalizeIconChroniclesDaily(prev.iconChroniclesDaily, latestCycle);
        const curBundesliga = normalizeBundesligaState(prev.bundesligaState, latestCycle);
        const bundesligaGoalsScored =
          scorerCardIds !== undefined
            ? countBundesligaGoalIds(scorerCardIds)
            : managerBundesligaGoalsRef.current;

        return {
          gems: (prev.gems ?? 0) + summary.totalGemsAwarded,
          tickets: (prev.tickets ?? 0) + summary.totalTicketsAwarded,
          gingaTokens: (prev.gingaTokens ?? 0) + awardedGinga,
          h2hRank: summary.nextRank.fullLabel,
          h2hCups: summary.nextRankedState.totalStars * 1000,
          rankedState: summary.nextRankedState,
          gingaState: allowGinga
            ? {
                ...prevGinga,
                matchesPlayedToday: prevGinga.matchesPlayedToday + 1,
              }
            : prevGinga,
          bundesligaState:
            bundesligaGoalsScored > 0
              ? {
                  ...curBundesliga,
                  goalsScoredToday: curBundesliga.goalsScoredToday + bundesligaGoalsScored,
                }
              : curBundesliga,
          kickoffState: {
            ...curKo,
            rankedMatches: (curKo.rankedMatches ?? 0) + 1,
          },
          iconChroniclesDaily: {
            ...curIconsDaily,
            rankedMatchesPlayed: curIconsDaily.rankedMatchesPlayed + 1,
          },
          starPass: {
            ...curSp,
            points: curSp.points + (result === 'W' ? 25 : result === 'D' ? 15 : 10),
          },
        };
      });

      setOutcomeSummary({
        ranked: summary,
        gingaTokensEarned: gingaBonus,
        userGoals: finalUserGoals,
        oppGoals: finalOppGoals,
        isBot,
        opponent: oppInfo,
      });
      setPhase('result');
    },
    [countBundesligaGoalIds, onUpdateUser, user.gingaState, user.rankedState]
  );

  const finalizeMatchRef = useRef(finalizeMatch);
  useEffect(() => {
    finalizeMatchRef.current = finalizeMatch;
  }, [finalizeMatch]);

  const spawnFloatingEmoji = useCallback(
    (item: FloatingEmojiItem) => {
      setFloatingEmojis((prev) => [...prev.slice(-4), item]);
      window.setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((e) => e.id !== item.id));
      }, 2800);
    },
    []
  );

  // Connect to /ws/ranked WebSocket when modal mounts
  useEffect(() => {
    let closed = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ranked`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (closed) {
          ws.close();
          return;
        }
        setWsConnected(true);
        const profile = buildMyWsProfile();
        ws.send(JSON.stringify({ type: 'presence:hello', profile }));

        if (pendingInviteToAccept) {
          const invMode = pendingInviteToAccept.fromProfile.rankedSubMode === 'apex' ? 'apex' : 'manager';
          setRankedSubMode(invMode);
          rankedSubModeRef.current = invMode;
          ws.send(
            JSON.stringify({
              type: 'invite:accept',
              fromConnId: pendingInviteToAccept.fromConnId,
              profile: buildMyWsProfile(invMode),
            })
          );
          onClearPendingInvite?.();
        } else if (pendingDirectInviteTarget) {
          ws.send(
            JSON.stringify({
              type: 'invite:send',
              targetConnId: pendingDirectInviteTarget.connId,
              profile,
            })
          );
          onClearPendingDirectInvite?.();
        }
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (!msg || typeof msg.type !== 'string') return;

          if (msg.type === 'welcome' && typeof msg.connId === 'string') {
            setMyConnId(msg.connId);
            return;
          }

          if (msg.type === 'presence:update') {
            setOnlineCount(Number(msg.onlineCount) || 0);
            setQueueCount(Number(msg.queueCount) || 0);
            if (Array.isArray(msg.onlinePlayers)) {
              setOnlinePlayers(msg.onlinePlayers);
            }
            return;
          }

          if (msg.type === 'invite:received' && msg.fromProfile) {
            soundService.playTrophy();
            setModalInvite({
              inviteId: String(msg.inviteId || `inv_${Date.now()}`),
              fromConnId: String(msg.fromConnId || ''),
              reason: msg.reason === 'queue' ? 'queue' : 'direct',
              createdAt: Number(msg.createdAt) || Date.now(),
              fromProfile: {
                username: msg.fromProfile.username || 'HLV Online',
                teamName: msg.fromProfile.teamName || 'Online FC',
                teamLogo: msg.fromProfile.teamLogo || RANKED_ASSETS.amateur[0],
                ovr: Number(msg.fromProfile.ovr) || 85,
                rankLabel: msg.fromProfile.rankLabel || 'Tập Sự · Cấp 1',
                rankLogoUrl: msg.fromProfile.rankLogoUrl || RANKED_ASSETS.amateur[0],
                rankedSubMode: msg.fromProfile.rankedSubMode === 'apex' ? 'apex' : 'manager',
              },
            });
            return;
          }

          if (msg.type === 'invite:sent') {
            showNotice(`Đã gửi lời mời đấu xếp hạng tới ${msg.targetUsername || 'HLV Online'}!`);
            return;
          }

          if (msg.type === 'invite:declined') {
            showNotice(`HLV ${msg.byUsername || 'Đối thủ'} đã từ chối lời mời.`);
            return;
          }

          if (msg.type === 'invite:expired') {
            showNotice(msg.message || 'Lời mời đã hết hạn.');
            return;
          }

          if (msg.type === 'invite:cancelled' && typeof msg.fromConnId === 'string') {
            setModalInvite((cur) => (cur && cur.fromConnId === msg.fromConnId ? null : cur));
            return;
          }

          if (msg.type === 'match:found' && msg.opponent) {
            soundService.playPackOpenFanfare();
            matchFinalizedRef.current = false;
            managerBundesligaGoalsRef.current = 0;
            setModalInvite(null);
            setMatchMode('pvp');
            const isApexMatch = msg.rankedSubMode === 'apex';
            setRankedSubMode(isApexMatch ? 'apex' : 'manager');
            rankedSubModeRef.current = isApexMatch ? 'apex' : 'manager';
            setApexPvpState(null);
            if (isApexMatch) {
              const mine = buildMyApexStarters();
              setApexMatchStarters({ p1: mine, p2: mine, botTierIndex: rankInfo.tierIndex });
            }
            const opp: MatchOpponentInfo = {
              coachName: msg.opponent.coachName || 'HLV Online',
              teamName: msg.opponent.teamName || 'Online FC',
              badgeUrl: msg.opponent.badgeUrl || RANKED_ASSETS.amateur[0],
              ovr: Number(msg.opponent.ovr) || 85,
              rankLabel: msg.opponent.rankLabel || 'Tập Sự · Cấp 1',
              rankLogoUrl: msg.opponent.rankLogoUrl || RANKED_ASSETS.amateur[0],
              isBot: false,
            };
            setOpponent(opp);
            setSecondsLeft(isApexMatch ? 90 : 60);
            setMinute(1);
            setUserScore(0);
            setOppScore(0);
            setUserShots(0);
            setOppShots(0);
            setUserPossessionPct(50);
            setBallPos({ x: 50, y: 50 });
            setUserEntities(buildMyPitchEntities());
            setOppEntities([]);
            setMatchFormation(activeFormation);
            setMatchStarters(starters);
            setMatchBench(bench);
            setLivePlayStyleId(getPlayStyleDef(user.playStyle).id);
            setMentality('balanced');
            setPressing('medium');
            setAttackFocus('mixed');
            setSubsMade(0);
            setSelectedPitchIdx(null);
            setShowSubDrawer(false);
            setFloatingEmojis([]);
            setGoalBanner(null);
            setOutcomeSummary(null);
            setCommentary([
              {
                id: `start_${Date.now()}`,
                minute: 1,
                text: `KẾT NỐI PvP THÀNH CÔNG! Trận ${isApexMatch ? 'Đấu Đỉnh Cao' : 'Đấu Xếp Hạng'} giữa ${user.teamName} và ${opp.teamName} (${opp.coachName}) chuẩn bị giao bóng!`,
                tone: 'tactic',
              },
            ]);
            setPhase('playing');
            return;
          }

          if (msg.type === 'apex:tick' && msg.state) {
            setApexPvpState(msg.state as ApexMatchState);
            return;
          }

          if (msg.type === 'match:tick') {
            setSecondsLeft(Number(msg.secondsLeft) ?? 0);
            setMinute(Number(msg.minute) || 1);
            setUserScore(Number(msg.userScore) || 0);
            setOppScore(Number(msg.oppScore) || 0);
            setUserShots(Number(msg.userShots) || 0);
            setOppShots(Number(msg.oppShots) || 0);
            setUserPossessionPct(Number(msg.userPossessionPct) || 50);
            if (msg.ballPos) setBallPos(msg.ballPos);
            if (Array.isArray(msg.userEntities)) setUserEntities(msg.userEntities);
            if (Array.isArray(msg.oppEntities)) setOppEntities(msg.oppEntities);
            if (msg.commentary && msg.commentary.text) {
              setCommentary((prev) => [msg.commentary, ...prev].slice(0, 24));
            }
            if (msg.goalBanner) {
              soundService.playTrophy();
              setGoalBanner(msg.goalBanner);
              window.setTimeout(() => setGoalBanner(null), 2600);
            }
            return;
          }

          if (msg.type === 'match:tactic_alert' && msg.text) {
            setCommentary((prev) =>
              [
                {
                  id: `tac_${Date.now()}_${Math.random()}`,
                  minute: Number(msg.minute) || 1,
                  text: msg.text,
                  tone: 'tactic' as const,
                },
                ...prev,
              ].slice(0, 24)
            );
            return;
          }

          if (msg.type === 'match:emoji' && msg.emoji) {
            const isSelfEmoji = Boolean(msg.isSelf);
            const coachLabel = msg.coachName || (isSelfEmoji ? user.username : 'Đối thủ');
            const msgMin = Number(msg.minute) || 1;
            spawnFloatingEmoji({
              id: msg.id || `emj_${Date.now()}`,
              emoji: msg.emoji,
              label: msg.label || '',
              coachName: coachLabel,
              isSelf: isSelfEmoji,
            });
            setCommentary((prev) =>
              [
                {
                  id: `emj_log_${Date.now()}_${Math.random()}`,
                  minute: msgMin,
                  text: `${msg.emoji} ${coachLabel}: ${msg.label || 'Gửi biểu cảm!'}`,
                  tone: 'emoji' as const,
                },
                ...prev,
              ].slice(0, 24)
            );
            return;
          }

          if (msg.type === 'match:end') {
            const uScore = Number(msg.userScore) || 0;
            const oScore = Number(msg.oppScore) || 0;
            const isForfeitWin = Boolean(msg.forfeitWin);
            setUserScore(uScore);
            setOppScore(oScore);
            if (isForfeitWin) {
              showNotice(`Đối thủ đã thoát trận — Bạn được xử thắng ${uScore} - ${oScore}!`);
            }
            const curOpp = opponentRef.current;
            if (curOpp) {
              const scorerIds = Array.isArray(msg.userGoalScorerCardIds)
                ? (msg.userGoalScorerCardIds as string[])
                : [];
              finalizeMatchRef.current(uScore, oScore, curOpp, false, scorerIds);
            }
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!closed) setWsConnected(false);
      };
    } catch {
      setWsConnected(false);
    }

    const handlePageExit = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close(1000, 'page_exit');
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('beforeunload', handlePageExit);
    window.addEventListener('pagehide', handlePageExit);

    return () => {
      closed = true;
      window.removeEventListener('beforeunload', handlePageExit);
      window.removeEventListener('pagehide', handlePageExit);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search timer & auto-hint
  useEffect(() => {
    if (phase !== 'searching') {
      setSearchSeconds(0);
      return;
    }
    const id = window.setInterval(() => {
      setSearchSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Start Local Bot Match (Full 2D Pitch Simulation aligned with server.ts rules)
  const startBotRankedMatch = () => {
    soundService.playClick();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'queue:leave' }));
    }

    const bot = generateRandomRankedBot(rankInfo.tierIndex, rankInfo.step);
    const realBotSquad = pickRealCardBotSquad({
      tierIndex: rankInfo.tierIndex,
      botMinOvr: rankInfo.tier.botMinOvr,
      botMaxOvr: rankInfo.tier.botMaxOvr,
    });
    const oppInfo: MatchOpponentInfo = {
      coachName: bot.coachName,
      teamName: bot.teamName,
      badgeUrl: bot.badgeUrl,
      ovr: rankedSubModeRef.current === 'apex' ? realBotSquad.squadOvr : bot.ovr,
      rankLabel: bot.rankLabel,
      rankLogoUrl: bot.rankLogoUrl,
      isBot: true,
    };

    const uEntities = buildMyPitchEntities();
    const oEntities: PitchEntity[] = realBotSquad.apexStarters.map((rp, idx) => ({
      id: `bot_${idx}`,
      name: rp.name,
      shortName: rp.shortName,
      pos: rp.pos,
      ovr: rp.ovr,
      x: 100 - rp.baseX,
      y: 100 - rp.baseY,
      stamina: 100,
      isGk: rp.isGk,
    }));

    if (rankedSubModeRef.current === 'apex') {
      const p1Init = buildMyApexStarters();
      matchFinalizedRef.current = false;
      managerBundesligaGoalsRef.current = 0;
      setMatchMode('bot');
      setOpponent(oppInfo);
      setApexPvpState(null);
      setApexMatchStarters({
        p1: p1Init,
        p2: realBotSquad.apexStarters,
        botTierIndex: rankInfo.tierIndex,
      });
      setOutcomeSummary(null);
      setPhase('playing');
      return;
    }

    const styles: TacticalPlayStyleId[] = [
      'tiki_taka',
      'phong_ngu',
      'phan_cong',
      'high_press',
      'tat_canh_danh_dau',
      'don_le',
    ];
    const oppStyle = styles[Math.floor(Math.random() * styles.length)];
    const matchup = evaluatePlayStyleMatchup(user.playStyle, oppStyle);

    matchFinalizedRef.current = false;
    managerBundesligaGoalsRef.current = 0;
    setMatchMode('bot');
    setOpponent(oppInfo);
    setSecondsLeft(60);
    setMinute(1);
    setUserScore(0);
    setOppScore(0);
    setUserShots(0);
    setOppShots(0);
    setUserPossessionPct(50);
    setBallPos({ x: 50, y: 50 });
    setUserEntities(uEntities);
    setOppEntities(oEntities);
    setMatchFormation(activeFormation);
    setMatchStarters(starters);
    setMatchBench(bench);
    setLivePlayStyleId(getPlayStyleDef(user.playStyle).id);
    setMentality('balanced');
    setPressing('medium');
    setAttackFocus('mixed');
    setSubsMade(0);
    setSelectedPitchIdx(null);
    setShowSubDrawer(false);
    setFloatingEmojis([]);
    setGoalBanner(null);
    setOutcomeSummary(null);

    botEngineRef.current = {
      secondsLeft: 60,
      totalTicks: 0,
      possTicks: 0,
      possession: Math.random() < 0.5 ? 'user' : 'opp',
      ballPos: { x: 50, y: 50 },
      userScore: 0,
      oppScore: 0,
      userShots: 0,
      oppShots: 0,
      userEntities: uEntities,
      oppEntities: oEntities,
      oppStyle,
    };

    setCommentary([
      {
        id: `bot_start_${Date.now()}`,
        minute: 1,
        text: `Trọng tài nổi còi bắt đầu trận Đấu Xếp Hạng vs ${oppInfo.teamName} (OVR ${oppInfo.ovr})! ${matchup.detail}`,
        tone: 'tactic',
      },
    ]);
    setPhase('playing');
  };

  // Bot 60-second tick loop (pauses cleanly while substitution drawer is open, matching CareerModeModal)
  const mentalityRef = useRef(mentality);
  const pressingRef = useRef(pressing);
  const attackFocusRef = useRef(attackFocus);
  const matchFormationRef = useRef(matchFormation);
  const livePlayStyleIdRef = useRef(livePlayStyleId);
  useEffect(() => {
    mentalityRef.current = mentality;
    pressingRef.current = pressing;
    attackFocusRef.current = attackFocus;
    matchFormationRef.current = matchFormation;
    livePlayStyleIdRef.current = livePlayStyleId;
  }, [mentality, pressing, attackFocus, matchFormation, livePlayStyleId]);

  useEffect(() => {
    if (
      phase !== 'playing' ||
      matchMode !== 'bot' ||
      rankedSubMode === 'apex' ||
      !opponent ||
      showSubDrawer
    )
      return;

    const timer = window.setInterval(() => {
      const eng = botEngineRef.current;
      if (!eng) return;

      eng.secondsLeft = Math.max(0, eng.secondsLeft - 1);
      eng.totalTicks += 1;
      const curMin = Math.min(90, Math.max(1, Math.ceil(((60 - eng.secondsLeft) / 60) * 90)));

      const userStyleDef = getPlayStyleDef(livePlayStyleIdRef.current);
      const matchup = evaluatePlayStyleMatchup(userStyleDef.id, eng.oppStyle);
      const botMgrBonus = evaluateManagerBonus({
        activeManager: user.activeManager,
        formationId: matchFormationRef.current.id,
        playStyleId: userStyleDef.id,
      }).totalBonus;

      const uAvg =
        eng.userEntities.reduce((s, e) => s + e.ovr * (0.78 + 0.22 * (e.stamina / 100)), 0) / 11 +
        botMgrBonus;
      const oAvg =
        eng.oppEntities.reduce((s, e) => s + e.ovr * (0.78 + 0.22 * (e.stamina / 100)), 0) / 11;

      const curMentality = mentalityRef.current;
      const curPress = pressingRef.current;
      const curFocus = attackFocusRef.current;

      const uAtt =
        uAvg +
        userStyleDef.engine.attBonus +
        matchup.ovrSwing * 0.5 +
        (curMentality === 'attacking' ? 2.5 : curMentality === 'defensive' ? -2 : 0);
      const uDef =
        uAvg +
        userStyleDef.engine.defBonus +
        (curMentality === 'defensive' ? 2.8 : curMentality === 'attacking' ? -2 : 0) +
        (curPress === 'high' ? 1.2 : 0);

      const ovrDelta = (uAtt + uDef) * 0.5 - oAvg;
      const uWinBallProb = clampVal(
        0.5 + ovrDelta * 0.024 + userStyleDef.engine.possWinBonus,
        0.18,
        0.84
      );

      if (Math.random() < 0.48) {
        eng.possession = Math.random() < uWinBallProb ? 'user' : 'opp';
      }
      if (eng.possession === 'user') eng.possTicks += 1;

      let cText = '';
      let cTone: CommentaryLine['tone'] = 'normal';
      let gBanner: { scorer: string; side: 'user' | 'opp' } | null = null;

      if (eng.possession === 'user') {
        const push =
          (curMentality === 'attacking' ? 15 : curMentality === 'balanced' ? 11.5 : 8.5) +
          clampVal(ovrDelta * 0.28, -3.5, 4.5);
        eng.ballPos.x = clampVal(eng.ballPos.x + push + (Math.random() * 8 - 3), 15, 92);
        if (curFocus === 'wings') {
          const wing = Math.random() < 0.5 ? 18 : 82;
          eng.ballPos.y = clampVal(eng.ballPos.y * 0.4 + wing * 0.6, 10, 90);
        } else if (curFocus === 'center') {
          eng.ballPos.y = clampVal(eng.ballPos.y * 0.45 + 50 * 0.55 + (Math.random() * 14 - 7), 24, 76);
        } else {
          eng.ballPos.y = clampVal(eng.ballPos.y + (Math.random() * 24 - 12), 14, 86);
        }

        const attackers = eng.userEntities.filter((e) => !e.isGk);
        const carrier = attackers[Math.floor(Math.random() * Math.min(5, attackers.length))] || eng.userEntities[0];
        const oppGk = eng.oppEntities.find((e) => e.isGk) || eng.oppEntities[10];
        const shootThresh = curFocus === 'long_shot' ? 68 : 77;

        if (
          eng.ballPos.x >= shootThresh &&
          Math.random() < clampVal(0.46 + userStyleDef.engine.shootProbBonus + ovrDelta * 0.02, 0.2, 0.75)
        ) {
          eng.userShots += 1;
          const goalProb = clampVal(
            0.27 +
              userStyleDef.engine.goalConvBonus +
              matchup.goalProbSwing +
              (carrier.ovr * 0.5 + uAtt * 0.5 - ((oppGk?.ovr || oAvg) * 0.55 + oAvg * 0.45)) * 0.022,
            0.09,
            0.72
          );
          if (Math.random() < goalProb) {
            eng.userScore += 1;
            const cIdx = eng.userEntities.findIndex((e) => e.id === carrier.id);
            const cCard =
              (carrier.cardId ? matchStarters.find((c) => c.id === carrier.cardId) : undefined) ||
              (cIdx >= 0 ? matchStarters[cIdx] : undefined);
            if (isBundesligaPlayer(cCard) || (carrier.cardId || '').includes('bundesliga_')) {
              managerBundesligaGoalsRef.current += 1;
            }
            gBanner = { scorer: `${carrier.shortName} (${curMin}')`, side: 'user' };
            cText = `VÀOOOOO!! ${carrier.name} (${user.teamName}) dứt điểm chuẩn xác hạ gục ${oppGk?.shortName || opponent.teamName}!`;
            cTone = 'goal';
            eng.ballPos = { x: 50, y: 50 };
            eng.possession = 'opp';
          } else {
            cText = `CỨU THUA! Thủ môn ${oppGk?.shortName || opponent.teamName} cản phá pha dứt điểm của ${carrier.shortName}!`;
            cTone = 'danger';
            eng.ballPos = { x: 88, y: clampVal(eng.ballPos.y, 36, 64) };
            eng.possession = 'opp';
          }
        } else {
          cText = `${carrier.shortName} (${user.teamName}) dẫn bóng triển khai tấn công sát vòng cấm.`;
        }
      } else {
        const push = 11.5 + clampVal(-ovrDelta * 0.28, -3.5, 4.5);
        eng.ballPos.x = clampVal(eng.ballPos.x - push - (Math.random() * 8 - 3), 8, 85);
        eng.ballPos.y = clampVal(eng.ballPos.y + (Math.random() * 24 - 12), 14, 86);

        const attackers = eng.oppEntities.filter((e) => !e.isGk);
        const carrier = attackers[Math.floor(Math.random() * Math.min(5, attackers.length))] || eng.oppEntities[0];
        const uGk = eng.userEntities.find((e) => e.isGk) || eng.userEntities[10];

        if (eng.ballPos.x <= 23 && Math.random() < clampVal(0.45 - ovrDelta * 0.02, 0.18, 0.72)) {
          eng.oppShots += 1;
          const goalProb = clampVal(
            0.25 +
              userStyleDef.engine.concedeMod -
              matchup.goalProbSwing +
              (carrier.ovr * 0.5 + oAvg * 0.5 - ((uGk?.ovr || uDef) * 0.55 + uDef * 0.45)) * 0.022,
            0.07,
            0.68
          );
          if (Math.random() < goalProb) {
            eng.oppScore += 1;
            gBanner = { scorer: `${carrier.shortName} (${curMin}')`, side: 'opp' };
            cText = `VÀOOOOO!! ${carrier.name} (${opponent.teamName}) ghi bàn mở khoảng trống vào lưới ${user.teamName}!`;
            cTone = 'goal';
            eng.ballPos = { x: 50, y: 50 };
            eng.possession = 'user';
          } else {
            cText = `XUẤT SẮC! ${uGk?.shortName || 'Thủ môn'} bay người cứu thua cho ${user.teamName}!`;
            cTone = 'danger';
            eng.ballPos = { x: 12, y: clampVal(eng.ballPos.y, 36, 64) };
            eng.possession = 'user';
          }
        } else {
          cText = `${carrier.shortName} (${opponent.teamName}) đang tổ chức lên bóng phản công nhanh.`;
        }
      }

      const shiftU =
        (curMentality === 'attacking' ? 9 : curMentality === 'defensive' ? -7 : 0) +
        (eng.possession === 'user' ? 11 : -8);
      eng.userEntities = eng.userEntities.map((ent, idx) => {
        if (ent.isGk || idx === 10) {
          return {
            ...ent,
            x: clampVal(eng.ballPos.x < 35 ? 11 : 6, 3.5, 13.5),
            y: clampVal(50 + (eng.ballPos.y - 50) * 0.3, 34, 66),
          };
        }
        const slot = matchFormationRef.current.slots[idx] || matchFormationRef.current.slots[0];
        const base = mapSlotToHorizontalPitch(slot, false);
        return {
          ...ent,
          pos: slot.pos || ent.pos,
          x: clampVal(base.x + shiftU + (eng.ballPos.x - base.x) * 0.22 + (Math.random() * 5 - 2.5), 16, 92),
          y: clampVal(base.y + (eng.ballPos.y - base.y) * 0.2 + (Math.random() * 5 - 2.5), 8, 92),
          stamina: Math.max(
            25,
            ent.stamina - (curPress === 'high' ? 1.0 : 0.7) * userStyleDef.engine.staminaDrainMult
          ),
        };
      });

      const shiftO = eng.possession === 'opp' ? -11 : 8;
      const oppFb = [
        { x: 70, y: 20 },
        { x: 76, y: 50 },
        { x: 70, y: 80 },
        { x: 52, y: 30 },
        { x: 42, y: 50 },
        { x: 52, y: 70 },
        { x: 26, y: 16 },
        { x: 24, y: 38 },
        { x: 24, y: 62 },
        { x: 26, y: 84 },
        { x: 7, y: 50 },
      ];
      eng.oppEntities = eng.oppEntities.map((ent, idx) => {
        if (ent.isGk || idx === 10) {
          return {
            ...ent,
            x: clampVal(eng.ballPos.x > 65 ? 89 : 94, 86.5, 96.5),
            y: clampVal(50 + (eng.ballPos.y - 50) * 0.3, 34, 66),
          };
        }
        const sBase = oppFb[idx] || oppFb[0];
        const mx = 100 - sBase.x;
        const my = 100 - sBase.y;
        return {
          ...ent,
          x: clampVal(mx + shiftO + (eng.ballPos.x - mx) * 0.22 + (Math.random() * 5 - 2.5), 8, 84),
          y: clampVal(my + (eng.ballPos.y - my) * 0.2 + (Math.random() * 5 - 2.5), 8, 92),
          stamina: Math.max(25, ent.stamina - 0.75),
        };
      });

      setSecondsLeft(eng.secondsLeft);
      setMinute(curMin);
      setUserScore(eng.userScore);
      setOppScore(eng.oppScore);
      setUserShots(eng.userShots);
      setOppShots(eng.oppShots);
      setUserPossessionPct(Math.round((eng.possTicks / Math.max(1, eng.totalTicks)) * 100));
      setBallPos({ ...eng.ballPos });
      setUserEntities([...eng.userEntities]);
      setOppEntities([...eng.oppEntities]);
      if (cText) {
        setCommentary((prev) =>
          [{ id: `b_${eng.secondsLeft}`, minute: curMin, text: cText, tone: cTone }, ...prev].slice(0, 24)
        );
      }
      if (gBanner) {
        soundService.playTrophy();
        setGoalBanner(gBanner);
        window.setTimeout(() => setGoalBanner(null), 2600);
      }

      if (eng.secondsLeft <= 0) {
        window.clearInterval(timer);
        finalizeMatch(eng.userScore, eng.oppScore, opponent, true);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, matchMode, opponent, showSubDrawer, user.teamName, user.activeManager, finalizeMatch]);

  const handleUseMatchSkipPass = () => {
    if (phase === 'playing' && matchMode === 'pvp') {
      showNotice('Không thể dùng Vé Pass Trận Đấu trong trận PvP Online!');
      return;
    }
    const ownedPasses = user.matchSkipPasses ?? 0;
    if (ownedPasses < 1) {
      soundService.playClick();
      showNotice('Bạn chưa có Vé Pass Trận Đấu! Mua tại Cửa Hàng với giá 1.000 Kim Cương.');
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && phase === 'searching') {
      wsRef.current.send(JSON.stringify({ type: 'queue:leave' }));
    }

    let oppInfo: MatchOpponentInfo;
    if (phase === 'playing' && opponent && opponent.isBot) {
      oppInfo = opponent;
    } else {
      const bot = generateRandomRankedBot(rankInfo.tierIndex, rankInfo.step);
      oppInfo = {
        coachName: bot.coachName,
        teamName: bot.teamName,
        badgeUrl: bot.badgeUrl,
        ovr: bot.ovr,
        rankLabel: bot.rankLabel,
        rankLogoUrl: bot.rankLogoUrl,
        isBot: true,
      };
    }

    setShowSubDrawer(false);
    setOpponent(oppInfo);
    setMatchMode('bot');
    onUpdateUser((prev) => ({
      matchSkipPasses: Math.max(0, (prev.matchSkipPasses ?? 0) - 1),
    }));

    const oppGoals = phase === 'playing' ? oppScore : Math.random() < 0.35 ? 1 : 0;
    const winGoals =
      phase === 'playing'
        ? Math.max(userScore, oppScore + 2)
        : oppGoals + (user.ovr >= oppInfo.ovr ? 3 : 2);
    setUserScore(winGoals);
    setOppScore(oppGoals);
    if (phase !== 'playing') {
      managerBundesligaGoalsRef.current = 0;
    }
    const activeLineup = phase === 'playing' ? matchStarters : starters;
    const hasOutfieldBundesliga = activeLineup
      .slice(0, 10)
      .some((p) => isBundesligaPlayer(p));
    if (hasOutfieldBundesliga) {
      const addedGoals = Math.max(0, winGoals - (phase === 'playing' ? userScore : 0));
      managerBundesligaGoalsRef.current += addedGoals;
    }
    matchFinalizedRef.current = false;
    finalizeMatch(winGoals, oppGoals, oppInfo, true);
  };

  const handleJoinPvpQueue = () => {
    soundService.playClick();
    if (!wsConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showNotice('Chưa kết nối máy chủ PvP! Bạn có thể chọn "Đấu Bot Xếp Hạng" ngay lập tức.');
      return;
    }
    const profile = buildMyWsProfile();
    wsRef.current.send(JSON.stringify({ type: 'queue:join', profile }));
    setPhase('searching');
  };

  const handleCancelQueue = () => {
    soundService.playClick();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'queue:leave' }));
    }
    setPhase('lobby');
  };

  const handleSendInvite = (targetConnId: string) => {
    soundService.playClick();
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showNotice('Kết nối trực tuyến đang tạm gián đoạn.');
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        type: 'invite:send',
        targetConnId,
        profile: buildMyWsProfile(),
      })
    );
  };

  const handleAcceptModalInvite = (inv: RankedIncomingInvite) => {
    soundService.playClick();
    setModalInvite(null);
    const invMode = inv.fromProfile.rankedSubMode === 'apex' ? 'apex' : 'manager';
    setRankedSubMode(invMode);
    rankedSubModeRef.current = invMode;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'invite:accept',
          fromConnId: inv.fromConnId,
          profile: buildMyWsProfile(invMode),
        })
      );
    }
  };

  const handleDeclineModalInvite = (inv: RankedIncomingInvite) => {
    soundService.playClick();
    setModalInvite(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'invite:decline',
          inviteId: inv.inviteId,
          fromConnId: inv.fromConnId,
          byUsername: user.username,
        })
      );
    }
  };

  const handleLiveTacticChange = (
    nextMentality: MentalityOption,
    nextPressing: PressingOption,
    nextFocus: AttackFocusOption,
    noticeText: string
  ) => {
    soundService.playClick();
    setMentality(nextMentality);
    setPressing(nextPressing);
    setAttackFocus(nextFocus);

    if (matchMode === 'pvp' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'match:tactic',
          mentality: nextMentality,
          pressing: nextPressing,
          attackFocus: nextFocus,
          noticeText: `HLV ${user.username} điều chỉnh: ${noticeText}`,
        })
      );
    } else if (matchMode === 'bot') {
      setCommentary((prev) =>
        [
          {
            id: `btac_${Date.now()}`,
            minute,
            text: `Chiến thuật cập nhật: ${noticeText}`,
            tone: 'tactic' as const,
          },
          ...prev,
        ].slice(0, 24)
      );
    }
  };

  const handleSelectLivePlayStyle = (nextId: TacticalPlayStyleId) => {
    if (nextId === livePlayStyleId) return;
    soundService.playClick();
    setLivePlayStyleId(nextId);
    onSelectPlayStyle(nextId);
    const def = getPlayStyleDef(nextId);

    if (matchMode === 'pvp' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'match:tactic',
          mentality,
          pressing,
          attackFocus,
          noticeText: `HLV ${user.username} đổi sang Phong Cách ${def.name}!`,
        })
      );
    } else if (matchMode === 'bot') {
      const oppStyle = botEngineRef.current?.oppStyle || 'phong_ngu';
      const matchupNow = evaluatePlayStyleMatchup(nextId, oppStyle);
      setCommentary((prev) =>
        [
          {
            id: `ps_sw_${Date.now()}`,
            minute,
            text: `HLV ${user.teamName} đổi sang Phong Cách ${def.name}! (${matchupNow.summaryText})`,
            tone: 'tactic' as const,
          },
          ...prev,
        ].slice(0, 24)
      );
    }
  };

  const handleChangeFormationInMatch = (formationId: string) => {
    const found = availableFormations.find((f) => f.id === formationId);
    if (!found) return;
    soundService.playClick();
    setMatchFormation(found);

    const summary = computeSquadOvr({
      starters: matchStarters,
      formation: found,
      trainingLevel: user.trainingLevel ?? 0,
      activeManager: user.activeManager,
      playStyleId: livePlayStyleId,
    });
    onUpdateSquad(matchStarters, matchBench, found.id, summary.totalOvr);

    const updatedBaseSlots = found.slots.slice(0, 11).map((slot, idx) => {
      const isGk = idx === 10 || slot.pos === 'GK';
      const coords = mapSlotToHorizontalPitch(slot, isGk);
      return {
        baseX: coords.x,
        baseY: coords.y,
        pos: isGk ? 'GK' : slot.pos,
      };
    });

    if (matchMode === 'pvp' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'match:tactic',
          mentality,
          pressing,
          attackFocus,
          formationName: found.name,
          updatedBaseSlots,
          noticeText: `HLV ${user.username} đổi sơ đồ sang ${found.name}!`,
        })
      );
    } else {
      if (botEngineRef.current) {
        botEngineRef.current.userEntities = botEngineRef.current.userEntities.map((ent, idx) => {
          const slot = found.slots[idx] || found.slots[0];
          const isGk = idx === 10 || slot.pos === 'GK';
          const effectivePos = isGk ? 'GK' : slot.pos;
          const coords = mapSlotToHorizontalPitch(slot, isGk);
          const p = matchStarters[idx] || matchStarters[0];
          return {
            ...ent,
            pos: effectivePos,
            ovr: p ? getEffectiveStarterOvr(p, effectivePos, user.trainingLevel) : ent.ovr,
            x: coords.x,
            y: coords.y,
            isGk,
          };
        });
        setUserEntities([...botEngineRef.current.userEntities]);
      }
      setCommentary((prev) =>
        [
          {
            id: `tac_f_${Date.now()}`,
            minute,
            text: `Thay đổi sơ đồ chiến thuật ngay trên sân: ${user.teamName} chuyển sang hệ thống ${found.name}!`,
            tone: 'tactic' as const,
          },
          ...prev,
        ].slice(0, 24)
      );
    }
  };

  const handleSendEmoji = (preset: { emoji: string; label: string }) => {
    const now = Date.now();
    if (now - lastEmojiAtRef.current < 900) return;
    lastEmojiAtRef.current = now;
    soundService.playClick();

    if (matchMode === 'pvp' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'match:emoji',
          emoji: preset.emoji,
          label: preset.label,
        })
      );
    } else {
      spawnFloatingEmoji({
        id: `local_${now}`,
        emoji: preset.emoji,
        label: preset.label,
        coachName: user.username,
        isSelf: true,
      });
      setCommentary((prev) =>
        [
          {
            id: `emj_self_${now}`,
            minute,
            text: `${preset.emoji} ${user.username}: ${preset.label}`,
            tone: 'emoji' as const,
          },
          ...prev,
        ].slice(0, 24)
      );

      // Contextual Bot Emoji Reply in Bot Ranked Mode
      if (opponent) {
        const delayMs = 850 + Math.floor(Math.random() * 700);
        const replyOptions =
          userScore > oppScore
            ? [
                { emoji: '😡', label: 'Chưa xong đâu!' },
                { emoji: '⚡', label: 'Phản công!' },
                { emoji: '👏', label: 'Đá hay đấy!' },
              ]
            : userScore < oppScore
            ? [
                { emoji: '😎', label: 'Quá mượt!' },
                { emoji: '🔥', label: 'Ginga!' },
                { emoji: '😂', label: 'Không dễ ăn đâu!' },
              ]
            : [
                { emoji: '⚽', label: 'Đá đẹp nhé!' },
                { emoji: '🔥', label: 'Căng thẳng quá!' },
                { emoji: '🛡️', label: 'Thử xem!' },
              ];
        const botReply = replyOptions[Math.floor(Math.random() * replyOptions.length)];
        const oppName = opponent.coachName;
        const replyMin = minute;
        window.setTimeout(() => {
          spawnFloatingEmoji({
            id: `bot_emj_${Date.now()}`,
            emoji: botReply.emoji,
            label: botReply.label,
            coachName: oppName,
            isSelf: false,
          });
          setCommentary((prev) =>
            [
              {
                id: `emj_bot_${Date.now()}`,
                minute: replyMin,
                text: `${botReply.emoji} ${oppName}: ${botReply.label}`,
                tone: 'emoji' as const,
              },
              ...prev,
            ].slice(0, 24)
          );
        }, delayMs);
      }
    }
  };

  const handleConfirmSubstitution = (benchIdx: number) => {
    if (selectedPitchIdx === null || subsMade >= 5) return;
    const outStarter = matchStarters[selectedPitchIdx];
    const inPlayer = matchBench[benchIdx];
    if (!outStarter || !inPlayer) return;

    const inNameKey = getCanonicalPlayerNameKey(inPlayer);
    const hasDuplicateOnPitch = matchStarters.some(
      (st, idx) => idx !== selectedPitchIdx && getCanonicalPlayerNameKey(st) === inNameKey
    );
    if (hasDuplicateOnPitch) {
      soundService.playTrophy();
      setCommentary((prev) => [
        {
          id: `dup_sub_${Date.now()}`,
          minute,
          text: `Không thể tung ${inPlayer.name} vào sân vì đã có thẻ trùng tên trong đội hình chính!`,
          tone: 'tactic',
        },
        ...prev,
      ]);
      return;
    }

    soundService.playCoins();
    const nextStarters = [...matchStarters];
    const nextBench = [...matchBench];
    nextStarters[selectedPitchIdx] = inPlayer;
    nextBench[benchIdx] = outStarter;

    setMatchStarters(nextStarters);
    setMatchBench(nextBench);

    const summary = computeSquadOvr({
      starters: nextStarters,
      formation: matchFormation,
      trainingLevel: user.trainingLevel ?? 0,
      activeManager: user.activeManager,
      playStyleId: livePlayStyleId,
    });
    onUpdateSquad(nextStarters, nextBench, matchFormation.id, summary.totalOvr);

    const nextSubs = subsMade + 1;
    setSubsMade(nextSubs);
    const targetIdx = selectedPitchIdx;
    setSelectedPitchIdx(null);
    setShowSubDrawer(false);

    const slotPos = matchFormation.slots[targetIdx]?.pos;
    const isGk = targetIdx === 10 || slotPos === 'GK';
    const effectiveSlotPos = isGk ? 'GK' : slotPos;
    const effectiveInOvr = getEffectiveStarterOvr(
      inPlayer,
      effectiveSlotPos,
      user.trainingLevel
    );

    if (matchMode === 'pvp' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'match:sub',
          slotIdx: targetIdx,
          outPlayerName: outStarter.name,
          inPlayer: {
            cardId: inPlayer.id,
            name: inPlayer.name,
            shortName: inPlayer.name.split(' ').pop() || inPlayer.name,
            ovr: effectiveInOvr,
          },
        })
      );
    } else if (botEngineRef.current) {
      const target = botEngineRef.current.userEntities[targetIdx];
      if (target) {
        botEngineRef.current.userEntities[targetIdx] = {
          ...target,
          id: `u_${inPlayer.id}_${targetIdx}_${Date.now()}`,
          cardId: inPlayer.id,
          name: inPlayer.name,
          shortName: inPlayer.name.split(' ').pop() || inPlayer.name,
          ovr: effectiveInOvr,
          stamina: 100,
          isGk,
        };
        setUserEntities([...botEngineRef.current.userEntities]);
      }
      setCommentary((prev) =>
        [
          {
            id: `sub_${Date.now()}`,
            minute,
            text: `THAY NGƯỜI (${nextSubs}/5): ${inPlayer.name} (OVR ${inPlayer.ovr}) vào sân thay cho ${outStarter.name} với 100% thể lực!`,
            tone: 'tactic' as const,
          },
          ...prev,
        ].slice(0, 24)
      );
    }
  };

  const otherOnlinePlayers = onlinePlayers.filter((p) => p.connId !== myConnId);

  return (
    <div className="fixed inset-0 z-50 bg-[#050816] flex flex-col overflow-hidden select-none font-cruyff text-white animate-fadeIn">
      {/* Ranked Official Background */}
      <img
        src={RANKED_ASSETS.background}
        alt="Đấu Xếp Hạng"
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b1f]/85 via-[#0a112b]/55 to-[#040714]/95 pointer-events-none" />

      {/* Top Ranked Header Bar */}
      <header className="relative z-10 px-4 sm:px-6 py-3 bg-slate-950/90 border-b-2 border-indigo-400/60 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={rankInfo.logoUrl}
            alt={rankInfo.fullLabel}
            className="w-11 h-11 object-contain drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-wider text-white">
                ĐẤU XẾP HẠNG · H2H ONLINE
              </h2>
              <span
                className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${
                  wsConnected
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-400 text-amber-300'
                } flex items-center gap-1`}
              >
                {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {wsConnected ? `${onlineCount} HLV Online` : 'Chế Độ Bot / Reconnecting'}
              </span>
            </div>
            <div className="text-[11px] text-indigo-200 flex items-center gap-3 flex-wrap mt-0.5">
              <span>
                Hạng hiện tại: <strong className="text-yellow-300">{rankInfo.fullLabel}</strong> ·{' '}
                <strong className="font-mono">{rankedState.totalStars}★</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-cyan-300 font-mono">
                <Clock className="w-3 h-3" /> Mùa {rankedState.seasonNumber} còn {seasonCountdown}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/75 border border-emerald-400/50 rounded-full text-xs font-bold">
            <img src={GINGA_ASSETS.pointIcon} alt="Token Ginga" className="w-4 h-4 object-contain" />
            <span className="text-emerald-200">
              Thưởng Ginga hôm nay:{' '}
              <strong className="text-yellow-300 font-mono">{gingaState.matchesPlayedToday}/5 trận</strong>
            </span>
          </div>
          {phase === 'lobby' && (
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                onOpenMyTeam();
              }}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-400/60 text-xs font-black uppercase rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-yellow-300" />
              Đội Hình ({user.ovr})
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              if (phase === 'searching') handleCancelQueue();
              onClose();
            }}
            aria-label="Đóng Đấu Xếp Hạng"
            className="w-9 h-9 rounded-full bg-red-600/90 hover:bg-red-500 text-white border-2 border-white/85 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Incoming PvP Invitation Banner inside Modal */}
      {modalInvite && phase === 'lobby' && (
        <div className="relative z-20 mx-4 sm:mx-6 mt-3 p-3 bg-gradient-to-r from-cyan-950/95 via-indigo-950/95 to-slate-950/95 border-2 border-cyan-300 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <img
              src={modalInvite.fromProfile.teamLogo}
              alt=""
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-contain bg-black/50 p-1 border border-white/20"
            />
            <div>
              <div className="text-xs font-black text-cyan-300 uppercase">
                Lời mời {modalInvite.fromProfile.rankedSubMode === 'apex' ? 'Đấu Đỉnh Cao (3/4 Arcade)' : 'Quản Lý H2H'} từ HLV {modalInvite.fromProfile.username}
              </div>
              <div className="text-xs text-white">
                {modalInvite.fromProfile.teamName} · OVR {modalInvite.fromProfile.ovr} ·{' '}
                {modalInvite.fromProfile.rankLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAcceptModalInvite(modalInvite)}
              className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase rounded cursor-pointer"
            >
              Chấp Nhận Đấu Ngay
            </button>
            <button
              type="button"
              onClick={() => handleDeclineModalInvite(modalInvite)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded cursor-pointer"
            >
              Từ Chối
            </button>
          </div>
        </div>
      )}

      {/* Status Notice Toast */}
      {statusBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[75] px-5 py-2.5 bg-indigo-950/95 border-2 border-cyan-300 text-cyan-100 text-xs font-black uppercase rounded-lg shadow-2xl">
          {statusBanner}
        </div>
      )}

      {/* LOBBY NAVIGATION BAR */}
      {phase === 'lobby' && (
        <nav className="relative z-10 grid grid-cols-3 bg-slate-950/75 border-b border-white/15">
          <button
            type="button"
            onClick={() => {
              soundService.playTabSwitch();
              setLobbyTab('lobby');
            }}
            className={`py-2.5 font-black text-xs sm:text-sm uppercase tracking-wider border-b-4 cursor-pointer flex items-center justify-center gap-2 ${
              lobbyTab === 'lobby'
                ? 'border-yellow-400 text-yellow-300 bg-indigo-500/20'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" /> Sảnh Đấu Hạng
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playTabSwitch();
              setLobbyTab('rewards');
            }}
            className={`py-2.5 font-black text-xs sm:text-sm uppercase tracking-wider border-b-4 cursor-pointer flex items-center justify-center gap-2 ${
              lobbyTab === 'rewards'
                ? 'border-yellow-400 text-yellow-300 bg-indigo-500/20'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" /> Lộ Trình & Quà Thăng Hạng
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playTabSwitch();
              setLobbyTab('history');
            }}
            className={`py-2.5 font-black text-xs sm:text-sm uppercase tracking-wider border-b-4 cursor-pointer flex items-center justify-center gap-2 ${
              lobbyTab === 'history'
                ? 'border-yellow-400 text-yellow-300 bg-indigo-500/20'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" /> Lịch Sử ({rankedState.recentMatches.length})
          </button>
        </nav>
      )}

      {/* MAIN CONTENT BODY */}
      <main
        className={`relative z-10 flex-1 overflow-y-auto ${
          phase === 'playing' && rankedSubMode === 'apex' ? 'p-2 sm:p-3' : 'p-4 sm:p-6'
        }`}
      >
        <div
          className={`mx-auto ${
            phase === 'playing' && rankedSubMode === 'apex' ? 'max-w-[1620px] w-full' : 'max-w-7xl'
          }`}
        >
          {/* ---------------- LOBBY: MAIN ---------------- */}
          {phase === 'lobby' && lobbyTab === 'lobby' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 Cols: Rank Hero, Matchmaking & Tactical Card */}
              <div className="lg:col-span-7 space-y-4">
                {/* Current Rank Progression Card */}
                <section className="p-5 rounded-2xl bg-slate-950/90 border-2 border-yellow-400/70 backdrop-blur-md flex flex-col sm:flex-row items-center gap-5 shadow-[0_0_32px_rgba(234,179,8,0.18)]">
                  <div className="relative shrink-0 flex flex-col items-center">
                    <img
                      src={rankInfo.logoUrl}
                      alt={rankInfo.fullLabel}
                      className="w-28 h-28 object-contain drop-shadow-[0_0_24px_rgba(250,204,21,0.5)]"
                    />
                    <span className="mt-1 px-2.5 py-0.5 bg-yellow-400 text-slate-950 font-black text-[10px] uppercase rounded">
                      MÙA {rankedState.seasonNumber}
                    </span>
                  </div>

                  <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
                        Bậc Xếp Hạng Hiện Tại
                      </div>
                      <h3 className={`font-black text-2xl sm:text-3xl uppercase ${rankInfo.tier.accentText}`}>
                        {rankInfo.fullLabel}
                      </h3>
                    </div>

                    {/* 3 Stars Row */}
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      {[0, 1, 2].map((idx) => (
                        <Star
                          key={idx}
                          className={`w-7 h-7 transition-all ${
                            idx < rankInfo.starsInStep
                              ? 'text-yellow-300 fill-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.85)]'
                              : 'text-slate-700 fill-slate-900'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs font-mono font-bold text-slate-300">
                        Tổng {rankedState.totalStars}★ · Chuỗi thắng {rankedState.winStreak}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-black/55 p-2.5 rounded-xl border border-white/10 text-xs">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Thắng / Hòa / Bại</div>
                        <div className="font-mono font-black text-white">
                          {rankedState.wins} / {rankedState.draws} / {rankedState.losses}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Thưởng / Trận Thắng</div>
                        <div className="font-mono font-black text-cyan-300">
                          +{rankInfo.tier.winGems} Gems
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Thưởng Lễ Hội Ginga</div>
                        <div className="font-mono font-black text-emerald-300">
                          +200 / +100 / +50
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* PlayStyle Quick Bar */}
                <section className="p-4 rounded-2xl bg-slate-950/85 border border-indigo-400/45 space-y-2.5 backdrop-blur-md">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentPlayStyle.iconUrl}
                        alt={currentPlayStyle.name}
                        className="w-8 h-8 object-contain"
                      />
                      <div>
                        <div className="text-xs font-black text-yellow-300 uppercase">
                          Lối Đá: {currentPlayStyle.name} · Sơ đồ {activeFormation.name}
                        </div>
                        <div className="text-[11px] text-slate-300">{currentPlayStyle.tagline}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {TACTICAL_PLAYSTYLES.map((ps) => {
                      const active = ps.id === currentPlayStyle.id;
                      return (
                        <button
                          key={ps.id}
                          type="button"
                          onClick={() => {
                            soundService.playClick();
                            onSelectPlayStyle(ps.id);
                          }}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            active
                              ? 'bg-indigo-600/40 border-yellow-300 text-yellow-200'
                              : 'bg-black/50 border-white/10 text-slate-300 hover:border-white/30'
                          }`}
                        >
                          <img src={ps.iconUrl} alt={ps.shortName} className="w-6 h-6 object-contain" />
                          <span className="text-[10px] font-black leading-tight">{ps.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Sub-Mode Selector: Đấu Đỉnh Cao (Arcade 3/4) vs Quản Lý H2H */}
                <section className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-400/45 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setRankedSubMode('apex');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      rankedSubMode === 'apex'
                        ? 'bg-gradient-to-r from-emerald-950/90 to-cyan-950/80 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                        : 'bg-black/50 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black uppercase text-yellow-300 flex items-center gap-1.5">
                        <span>ĐẤU ĐỈNH CAO</span>
                        <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 text-[9px] font-black">
                          MỚI · 90S
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
                        Phong cách FC Mobile 11v11 · Minimap, Skill, Lực sút &amp; WASD / Touch
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setRankedSubMode('manager');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      rankedSubMode === 'manager'
                        ? 'bg-gradient-to-r from-indigo-950/90 to-slate-900 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.28)]'
                        : 'bg-black/50 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/60 flex items-center justify-center shrink-0">
                      <Sliders className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black uppercase text-cyan-300">
                        QUẢN LÝ H2H · 60S
                      </div>
                      <div className="text-[11px] text-slate-300 leading-tight mt-0.5">
                        Chỉ đạo chiến thuật &amp; thay người trực tiếp trên sa bàn 11v11
                      </div>
                    </div>
                  </button>
                </section>

                {/* Active 11 Player Cards Lineup Strip for Đấu Đỉnh Cao */}
                {rankedSubMode === 'apex' && (
                  <section className="p-3 rounded-2xl bg-slate-950/88 border border-emerald-400/35 space-y-2 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-black uppercase text-emerald-300">
                        Đội Hình Thẻ Ra Sân Đấu Đỉnh Cao ({starters.slice(0, 11).length} Thẻ · OVR {user.ovr})
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          onOpenMyTeam();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-[10px] font-black uppercase text-emerald-200 cursor-pointer"
                      >
                        Đổi Thẻ Đội Hình
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-1.5">
                      {starters.slice(0, 11).map((p, idx) => {
                        const slot = activeFormation.slots[idx] || activeFormation.slots[0];
                        const posLabel = idx === 10 || slot.pos === 'GK' ? 'GK' : slot.pos || p.position;
                        const effOvr = getEffectiveStarterOvr(p, posLabel, user.trainingLevel);
                        return (
                          <div
                            key={`${p.id}_${idx}`}
                            className="relative rounded-lg bg-slate-900/90 border border-white/15 overflow-hidden flex flex-col items-center p-1 text-center"
                            title={`${p.name} (${posLabel} · OVR ${effOvr})`}
                          >
                            <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-slate-950">
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover object-top"
                              />
                              <span className="absolute top-0.5 left-0.5 px-1 rounded bg-slate-950/85 text-[8px] font-black text-yellow-300 tabular-nums">
                                {effOvr}
                              </span>
                            </div>
                            <span className="mt-0.5 text-[8px] font-black text-emerald-300 uppercase leading-none">
                              {posLabel}
                            </span>
                            <span className="text-[8px] font-bold text-white truncate w-full leading-tight">
                              {p.name.split(' ').pop() || p.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Match Launch Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleJoinPvpQueue}
                    className="py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-slate-950 font-black text-sm uppercase tracking-wider border-2 border-white shadow-[0_0_28px_rgba(56,189,248,0.45)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <Swords className="w-5 h-5" />
                    <div className="text-left">
                      <div>TÌM ĐỐI THỦ ONLINE</div>
                      <div className="text-[10px] font-bold opacity-80">
                        Ghép PvP thực tế ({queueCount} đang tìm)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={startBotRankedMatch}
                    className="py-4 px-5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider border-2 border-white shadow-[0_0_28px_rgba(250,204,21,0.45)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <Bot className="w-5 h-5" />
                    <div className="text-left">
                      <div>ĐẤU BOT XẾP HẠNG</div>
                      <div className="text-[10px] font-bold opacity-80">
                        OVR {rankInfo.tier.botMinOvr}–{rankInfo.tier.botMaxOvr} · Vào sân ngay
                      </div>
                    </div>
                  </button>
                </div>

                {/* Match Skip Pass Action Card */}
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-400/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
                      <img
                        src="/assets/aistudio/currencysmall_passticket_75e07c6d.png"
                        alt="Vé Pass"
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-300 uppercase flex items-center gap-2">
                        <span>VÉ PASS TRẬN ĐẤU XẾP HẠNG</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-400/20 border border-emerald-400/40 font-mono text-[10px] text-white tabular-nums">
                          Đang có: {user.matchSkipPasses ?? 0} Vé
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Bỏ qua trận đấu & nhận thắng +1★, Kim Cương, Token Ginga & điểm Star Pass ngay (1.000 Gems/Vé tại Cửa Hàng).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseMatchSkipPass}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      (user.matchSkipPasses ?? 0) >= 1
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                        : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20'
                    }`}
                  >
                    <FastForward className="w-4 h-4" />
                    <span>PASS TRẬN (1 VÉ)</span>
                  </button>
                </div>
              </div>

              {/* Right 5 Cols: Online Coaches Challenge Board */}
              <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-cyan-400/45 backdrop-blur-md flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-300" />
                      <div>
                        <h3 className="font-black text-sm sm:text-base uppercase text-white">
                          HLV Đang Trực Tuyến ({otherOnlinePlayers.length})
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Mời trực tiếp bất kỳ HLV nào vào trận H2H Real-Time
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendInvite('broadcast')}
                      disabled={!wsConnected}
                      className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/35 disabled:opacity-40 border border-cyan-400/60 text-cyan-200 font-black text-[10px] uppercase rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" /> Mời Tất Cả
                    </button>
                  </div>

                  {otherOnlinePlayers.length === 0 ? (
                    <div className="py-10 text-center space-y-2 bg-black/35 rounded-xl border border-white/10 px-4">
                      <Users className="w-8 h-8 text-slate-500 mx-auto" />
                      <div className="text-xs font-bold text-slate-300">
                        Chưa có HLV nào khác đang mở Sảnh Xếp Hạng lúc này
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Bạn có thể bấm &ldquo;Đấu Bot Xếp Hạng&rdquo; để leo hạng và nhận thưởng ngay, hoặc chờ đối thủ online!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {otherOnlinePlayers.map((p) => (
                        <div
                          key={p.connId}
                          className="p-2.5 rounded-xl bg-black/55 border border-white/10 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={p.teamLogo || RANKED_ASSETS.amateur[0]}
                              alt={p.teamName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 object-contain bg-white/5 p-1 rounded shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-white truncate">
                                {p.username} · <span className="text-yellow-300">OVR {p.ovr}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {p.teamName} · {p.rankLabel}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={p.inMatch}
                            onClick={() => handleSendInvite(p.connId)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shrink-0 cursor-pointer ${
                              p.inMatch
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                            }`}
                          >
                            {p.inMatch ? 'Đang Đấu' : 'Thách Đấu'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/40 flex items-center gap-3 text-xs">
                  <img src={GINGA_ASSETS.pointIcon} alt="" className="w-7 h-7 object-contain shrink-0" />
                  <div className="text-emerald-100">
                    Mỗi trận Đấu Xếp Hạng (PvP hoặc Bot) tặng thêm{' '}
                    <strong className="text-yellow-300">+200 Thắng / +100 Hòa / +50 Thua Token Ginga</strong>{' '}
                    (tối đa 5 trận/ngày).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- LOBBY: REWARDS ROADMAP ---------------- */}
          {phase === 'lobby' && lobbyTab === 'rewards' && (
            <section className="p-5 rounded-2xl bg-slate-950/90 border-2 border-yellow-400/50 backdrop-blur-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
                <div>
                  <h3 className="font-black text-lg uppercase text-yellow-300">
                    Lộ Trình 6 Cấp Bậc & Quà Thăng Hạng Mùa {rankedState.seasonNumber}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Mỗi bậc gồm 3 cấp (9★ mỗi bậc). Đạt Nhà Vô Địch không bị rớt hạng và nhận +800 Gems mỗi trận thắng!
                  </p>
                </div>
                <img
                  src={RANKED_ASSETS.rewardFrame}
                  alt="Khung Phần Thưởng"
                  className="h-12 object-contain hidden sm:block"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {RANKED_TIERS.map((tier) => {
                  const reached = rankInfo.tierIndex >= tier.index;
                  const claimed = rankedState.claimedTierRewards.includes(tier.id);
                  const current = rankInfo.tierIndex === tier.index;
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-xl border-2 flex flex-col justify-between gap-3 ${
                        current
                          ? 'bg-indigo-950/90 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                          : reached
                          ? 'bg-emerald-950/50 border-emerald-400/60'
                          : 'bg-slate-900/80 border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={tier.logos[0]}
                          alt={tier.name}
                          className="w-14 h-14 object-contain shrink-0"
                        />
                        <div>
                          <div className={`font-black text-base uppercase ${tier.accentText}`}>
                            {tier.name}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Yêu cầu: <strong className="font-mono">{tier.minTotalStars}★</strong> · Bot OVR{' '}
                            {tier.botMinOvr}–{tier.botMaxOvr}
                          </div>
                          <div className="text-[11px] text-cyan-300 font-bold">
                            Thắng trận: +{tier.winGems} Kim Cương
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/55 border border-white/10 flex items-center justify-between text-xs">
                        {tier.uniquePromotionReward ? (
                          <>
                            <span className="font-bold text-yellow-200">
                              Quà thăng bậc: +{tier.uniquePromotionReward.tickets} Vé · +
                              {tier.uniquePromotionReward.gems.toLocaleString('vi-VN')} Gems
                            </span>
                            {claimed ? (
                              <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Đã Nhận
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold text-[10px] rounded uppercase">
                                Chưa Mở
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">Hạng khởi đầu mùa giải mới</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---------------- LOBBY: HISTORY ---------------- */}
          {phase === 'lobby' && lobbyTab === 'history' && (
            <section className="p-5 rounded-2xl bg-slate-950/90 border border-indigo-400/45 backdrop-blur-md space-y-3">
              <h3 className="font-black text-lg uppercase text-white">
                Lịch Sử Đấu Xếp Hạng Gần Đây
              </h3>
              {rankedState.recentMatches.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Bạn chưa hoàn thành trận Đấu Xếp Hạng nào trong mùa {rankedState.seasonNumber}.
                </div>
              ) : (
                <div className="space-y-2">
                  {rankedState.recentMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded font-black flex items-center justify-center ${
                            m.result === 'W'
                              ? 'bg-emerald-500 text-slate-950'
                              : m.result === 'D'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {m.result}
                        </span>
                        <img
                          src={m.opponentLogo || RANKED_ASSETS.amateur[0]}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <div className="font-black text-white">
                            {user.teamName} {m.userGoals} - {m.oppGoals} {m.opponentTeamName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {m.opponentName} (OVR {m.opponentOvr}) · {m.isBot ? 'Bot' : 'PvP Online'} ·{' '}
                            {m.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono font-black">
                        <span
                          className={
                            m.starDelta > 0
                              ? 'text-yellow-300'
                              : m.starDelta < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {m.starDelta > 0 ? `+${m.starDelta}★` : `${m.starDelta}★`}
                        </span>
                        {m.gemsEarned > 0 && (
                          <span className="text-cyan-300">+{m.gemsEarned} Gems</span>
                        )}
                        {m.ticketsEarned > 0 && (
                          <span className="text-emerald-300">+{m.ticketsEarned} Vé</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ---------------- SEARCHING PvP ---------------- */}
          {phase === 'searching' && (
            <section className="max-w-lg mx-auto mt-10 p-6 rounded-2xl bg-slate-950/95 border-2 border-cyan-400 text-center space-y-5 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-300 flex items-center justify-center animate-pulse">
                <Swords className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-black text-xl uppercase text-white">
                  ĐANG TÌM ĐỐI THỦ XẾP HẠNG ONLINE...
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Hệ thống đang ghép HLV cùng hạng · Thời gian chờ:{' '}
                  <strong className="font-mono text-cyan-300">{searchSeconds}s</strong>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={startBotRankedMatch}
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                >
                  Đấu Bot Hạng Ngay ({rankInfo.tier.botMinOvr}–{rankInfo.tier.botMaxOvr} OVR)
                </button>
                <button
                  type="button"
                  onClick={handleCancelQueue}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Hủy Tìm Trận
                </button>
              </div>
            </section>
          )}

          {/* ---------------- LIVE ĐẤU ĐỈNH CAO (ARCADE 3/4 ISOMETRIC, BOT & PvP) ---------------- */}
          {phase === 'playing' && opponent && rankedSubMode === 'apex' && apexMatchStarters && (
            <div className="space-y-2 w-full">
              <header className="mx-auto w-[96%] max-w-[1140px] min-w-[280px] flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-yellow-400/45 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <img src={rankInfo.logoUrl} alt="" className="w-5 h-5 object-contain" />
                  <span className="text-xs font-black uppercase text-yellow-300">
                    ĐẤU ĐỈNH CAO · {opponent.isBot ? 'BOT XẾP HẠNG' : 'PvP ONLINE'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-cyan-300 uppercase">
                    {user.teamName} (OVR {user.ovr})
                  </span>
                  <span className="text-slate-400">VS</span>
                  <span className="text-rose-300 uppercase">
                    {opponent.teamName} (OVR {opponent.ovr})
                  </span>
                </div>
                {opponent.isBot && (user.matchSkipPasses ?? 0) >= 1 && (
                  <button
                    type="button"
                    onClick={handleUseMatchSkipPass}
                    className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Pass ({user.matchSkipPasses})</span>
                  </button>
                )}
              </header>

              <ApexPitchCanvas
                mode={matchMode}
                controlMode={user.controlMode}
                onChangeControlMode={(nextMode) => onUpdateUser({ controlMode: nextMode })}
                userTeamName={user.teamName}
                userTeamLogo={user.teamLogo}
                oppTeamName={opponent.teamName}
                oppTeamLogo={opponent.badgeUrl}
                userOvr={user.ovr}
                oppOvr={opponent.ovr}
                p1Starters={apexMatchStarters.p1}
                p2Starters={apexMatchStarters.p2}
                botTierIndex={apexMatchStarters.botTierIndex}
                pvpServerState={apexPvpState}
                onSendPvpInput={(inp: ApexControlInput) => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        type: 'apex:input',
                        moveX: inp.moveX,
                        moveY: inp.moveY,
                        shootHold: inp.shootHold,
                        holdAction: inp.holdAction ?? null,
                        action: inp.action,
                      })
                    );
                  }
                }}
                onBotMatchComplete={(uGoals, oGoals, scorerCardIds) => {
                  finalizeMatch(uGoals, oGoals, opponent, true, scorerCardIds ?? []);
                }}
              />
            </div>
          )}

          {/* ---------------- LIVE 2D PITCH MATCH (ALIGNED WITH CAREER MODE + EMOJI CHAT) ---------------- */}
          {phase === 'playing' && opponent && rankedSubMode === 'manager' && (
            <div className="relative flex flex-col gap-2.5">
              {/* TOP SCOREBOARD & LIVE COUNTDOWN HUD */}
              <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  <img
                    src={rankInfo.logoUrl}
                    alt=""
                    className="w-6 h-6 object-contain shrink-0"
                  />
                  <span className="text-xs font-bold uppercase text-cyan-300">
                    ĐẤU XẾP HẠNG · {opponent.isBot ? 'BOT HẠNG' : 'PvP ONLINE'}
                  </span>
                </div>

                {/* Center Scoreboard with Live OVR Comparison */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={user.teamLogo || RANKED_ASSETS.amateur[0]}
                      alt={user.teamName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 object-contain"
                    />
                    <div className="text-right leading-tight">
                      <span className="font-cruyff font-black text-sm sm:text-base text-cyan-300 uppercase block">
                        {user.teamName}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-yellow-300 tabular-nums">
                        OVR{' '}
                        {Math.round(
                          userEntities.reduce((a, p) => a + p.ovr, 0) /
                            Math.max(1, userEntities.length)
                        ) +
                          evaluateManagerBonus({
                            activeManager: user.activeManager,
                            formationId: matchFormation.id,
                            playStyleId: livePlayStyleId,
                          }).totalBonus || user.ovr}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-1 rounded-xl bg-black border border-yellow-400/60 font-mono font-black text-xl sm:text-2xl text-white tabular-nums">
                    {userScore} - {oppScore}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-left leading-tight">
                      <span className="font-cruyff font-black text-sm sm:text-base text-rose-300 uppercase block">
                        {opponent.teamName}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-amber-300 tabular-nums">
                        OVR {opponent.ovr} · {opponent.rankLabel}
                      </span>
                    </div>
                    <img
                      src={opponent.badgeUrl || RANKED_ASSETS.amateur[0]}
                      alt={opponent.teamName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>

                {/* Real-Time Countdown + Match Minute + Live Bot Match Skip Pass */}
                <div className="flex items-center gap-2">
                  {opponent.isBot && (user.matchSkipPasses ?? 0) >= 1 && (
                    <button
                      type="button"
                      onClick={handleUseMatchSkipPass}
                      title="Dùng 1 Vé Pass Trận Đấu để thắng nhanh trận Bot Xếp Hạng"
                      className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer tabular-nums"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>Pass ({user.matchSkipPasses})</span>
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-400/20 border border-yellow-400/60 font-mono text-xs sm:text-sm font-bold text-yellow-300">
                    <Clock className="w-4 h-4 text-yellow-300" />
                    <span>{minute}&apos;</span>
                    <span>·</span>
                    <span>Còn {secondsLeft}s</span>
                  </div>
                </div>
              </header>

              {/* MAIN WORKSPACE: 11v11 PITCH (LEFT 8 COLS) + CORNER COMMENTATOR & PLAYER STATS CARD (RIGHT 4 COLS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
                {/* 11v11 INTERACTIVE FOOTBALL PITCH */}
                <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-emerald-900 min-h-[340px] sm:min-h-[410px] aspect-[16/10]">
                  {/* Alternating Mowed Grass Stripes (Career Mode Styling) */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, #146c43 0%, #146c43 10%, #198754 10%, #198754 20%)',
                    }}
                  />

                  {/* Official Pitch Markings */}
                  <div className="absolute inset-3 border-2 border-white/70 pointer-events-none">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 -translate-x-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-28 sm:h-28 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />

                    {/* Left Penalty Area (User GK Zone) */}
                    <div className="absolute left-0 top-[26%] bottom-[26%] w-[15%] border-y-2 border-r-2 border-white/75 bg-emerald-950/15" />
                    <div className="absolute left-0 top-[38%] bottom-[38%] w-[6%] border-y-2 border-r-2 border-white/60" />

                    {/* Right Penalty Area (Opponent GK Zone) */}
                    <div className="absolute right-0 top-[26%] bottom-[26%] w-[15%] border-y-2 border-l-2 border-white/75 bg-emerald-950/15" />
                    <div className="absolute right-0 top-[38%] bottom-[38%] w-[6%] border-y-2 border-l-2 border-white/60" />
                  </div>

                  {/* GOAL CELEBRATION OVERLAY */}
                  {goalBanner && (
                    <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                      <div className="px-8 py-4 rounded-2xl bg-slate-950/95 border-2 border-yellow-400 text-center shadow-[0_0_45px_rgba(250,204,21,0.75)]">
                        <div className="font-cruyff font-black text-3xl sm:text-4xl text-yellow-300 uppercase italic tracking-wider">
                          VÀOOOOO!! BÀN THẮNG!
                        </div>
                        <div className="text-sm text-white font-bold mt-1">
                          {goalBanner.side === 'user' ? user.teamName : opponent.teamName} ·{' '}
                          {goalBanner.scorer}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FLOATING EMOJI SPEECH BUBBLES (USER BOTTOM-LEFT, OPPONENT TOP-RIGHT) */}
                  <div className="absolute bottom-3 left-3 z-35 flex flex-col items-start gap-1.5 pointer-events-none">
                    {floatingEmojis
                      .filter((em) => em.isSelf)
                      .map((em) => (
                        <div
                          key={em.id}
                          className="px-3 py-1.5 rounded-2xl bg-cyan-950/95 border-2 border-cyan-300 shadow-[0_6px_22px_rgba(34,211,238,0.45)] flex items-center gap-2 animate-bounce"
                        >
                          <span className="text-xl sm:text-2xl leading-none">{em.emoji}</span>
                          <div className="leading-tight">
                            <span className="block text-[9px] font-black uppercase text-cyan-300">
                              {em.coachName}
                            </span>
                            <span className="block text-xs font-black text-white">{em.label}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="absolute top-3 right-3 z-35 flex flex-col items-end gap-1.5 pointer-events-none">
                    {floatingEmojis
                      .filter((em) => !em.isSelf)
                      .map((em) => (
                        <div
                          key={em.id}
                          className="px-3 py-1.5 rounded-2xl bg-rose-950/95 border-2 border-rose-300 shadow-[0_6px_22px_rgba(244,63,94,0.45)] flex items-center gap-2 animate-bounce"
                        >
                          <div className="leading-tight text-right">
                            <span className="block text-[9px] font-black uppercase text-rose-300">
                              {em.coachName}
                            </span>
                            <span className="block text-xs font-black text-white">{em.label}</span>
                          </div>
                          <span className="text-xl sm:text-2xl leading-none">{em.emoji}</span>
                        </div>
                      ))}
                  </div>

                  {/* 11 OPPONENT PLAYERS (RED/AMBER MARKERS) */}
                  {oppEntities.map((ent) => (
                    <div
                      key={ent.id}
                      style={{ left: `${ent.x}%`, top: `${ent.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-700 ease-out pointer-events-none flex flex-col items-center"
                    >
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-black shadow-md ${
                          ent.isGk
                            ? 'bg-amber-500 text-zinc-950 border-white'
                            : 'bg-rose-600 text-white border-white/90'
                        }`}
                      >
                        {ent.pos.slice(0, 3)}
                      </div>
                      <span className="mt-0.5 px-1 rounded bg-black/75 text-[9px] text-rose-100 font-semibold whitespace-nowrap leading-tight">
                        {ent.shortName}
                      </span>
                    </div>
                  ))}

                  {/* 11 USER PLAYERS (CLICKABLE ROYAL BLUE / CYAN MARKERS + STAMINA BAR) */}
                  {userEntities.map((ent, idx) => (
                    <button
                      type="button"
                      key={ent.id}
                      onClick={() => {
                        if (subsMade >= 5) return;
                        soundService.playClick();
                        setSelectedPitchIdx(idx);
                        setShowSubDrawer(true);
                      }}
                      style={{ left: `${ent.x}%`, top: `${ent.y}%` }}
                      title={`Chạm để thay ${ent.name}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-25 transition-all duration-700 ease-out flex flex-col items-center cursor-pointer group"
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-black shadow-lg group-hover:scale-115 transition-transform ${
                          ent.isGk
                            ? 'bg-yellow-400 text-zinc-950 border-white'
                            : 'bg-blue-600 text-white border-cyan-300'
                        }`}
                      >
                        {ent.pos.slice(0, 3)}
                      </div>
                      <span className="mt-0.5 px-1.5 rounded bg-slate-950/90 text-[9px] text-cyan-200 font-bold whitespace-nowrap leading-tight border border-cyan-400/30">
                        {ent.shortName}
                      </span>
                      {!ent.isGk && (
                        <div className="w-7 h-1 bg-black/70 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full ${
                              ent.stamina > 60
                                ? 'bg-emerald-400'
                                : ent.stamina > 38
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${ent.stamina}%` }}
                          />
                        </div>
                      )}
                    </button>
                  ))}

                  {/* THE MATCH BALL */}
                  <div
                    style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-700 ease-out pointer-events-none"
                  >
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 border-zinc-900 shadow-[0_0_12px_rgba(255,255,255,0.95)] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    </div>
                  </div>
                </div>

                {/* CORNER PANEL: LIVE COMMENTATOR + CAREER-STYLE PLAYER STATS BANNER */}
                <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 min-h-0">
                  {/* Top: Corner Live Commentator */}
                  <div className="flex-1 rounded-2xl bg-slate-950/90 border border-cyan-400/35 p-3.5 flex flex-col min-h-[210px] max-h-[320px] overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-yellow-400" />
                        <span className="font-cruyff font-black text-sm text-white uppercase italic tracking-wide">
                          BÌNH LUẬN VIÊN TRỰC TIẾP
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-cyan-300 font-bold">
                        LIVE · {minute}&apos;
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 mt-2.5 pr-1">
                      {commentary.map((line, idx) => (
                        <div
                          key={line.id}
                          className={`p-2 rounded-lg text-xs leading-snug ${
                            line.tone === 'emoji'
                              ? 'bg-amber-500/20 border border-amber-300/60 text-amber-100 font-bold'
                              : idx === 0
                              ? line.tone === 'goal'
                                ? 'bg-yellow-400/20 border border-yellow-400/60 text-yellow-200 font-bold'
                                : line.tone === 'tactic'
                                ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-100 font-semibold'
                                : 'bg-white/10 border border-white/15 text-white font-semibold'
                              : 'bg-white/5 text-slate-300 opacity-80'
                          }`}
                        >
                          <span className="font-mono font-bold text-yellow-300 mr-1.5">
                            {line.minute}&apos;
                          </span>
                          <span>{line.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Directly Below Commentator: Live Stats & Star Card Banner */}
                  {featuredSquadStar && (
                    <CommentatorBelowStatsBanner
                      featuredPlayerName={`${featuredSquadStar.name} (${featuredSquadStar.ovr})`}
                      featuredPlayerAvatar={
                        featuredSquadStar.cardType === 'EURO_2024'
                          ? getEuroAsset(featuredSquadStar.id, featuredSquadStar.avatarUrl)
                          : featuredSquadStar.avatarUrl || featuredSquadStar.customFrameUrl || ''
                      }
                      possessionUser={userPossessionPct}
                      shotsText={`${userShots} - ${oppShots}`}
                      tacticLabel={
                        mentality === 'attacking'
                          ? 'Tấn công'
                          : mentality === 'defensive'
                          ? 'Phòng ngự'
                          : 'Cân bằng'
                      }
                    />
                  )}
                </div>
              </div>

              {/* EMOJI MESSENGER BAR (NHẮN TIN BẰNG EMOJI TRỰC TIẾP TRONG TRẬN) */}
              <div className="px-3 sm:px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-400/35 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <Smile className="w-4 h-4 text-yellow-300" />
                  <span className="font-cruyff font-black text-xs uppercase text-yellow-300 tracking-wide">
                    Nhắn Tin Emoji:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {EMOJI_PRESETS.map((em) => (
                    <button
                      key={em.emoji}
                      type="button"
                      onClick={() => handleSendEmoji(em)}
                      title={em.label}
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-cyan-500/30 border border-white/15 hover:border-cyan-300 text-xs font-bold text-white flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                    >
                      <span className="text-base leading-none">{em.emoji}</span>
                      <span className="hidden sm:inline text-[10px] text-slate-200">{em.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTTOM LIVE TACTICAL DECK & "THAY CẦU THỦ" BUTTON (ALIGNED WITH CAREER MODE) */}
              <footer className="px-3 sm:px-4 py-2 rounded-2xl bg-slate-950/90 border border-white/15 flex flex-wrap items-center justify-between gap-2 shrink-0">
                {/* 0. Live Tactical Playstyle Switcher */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  <span className="text-[10px] text-yellow-300 font-bold uppercase mr-0.5 hidden xl:inline">
                    Phong cách:
                  </span>
                  {TACTICAL_PLAYSTYLES.map((st) => {
                    const isCur = st.id === activeMatchPlayStyle.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectLivePlayStyle(st.id)}
                        title={`${st.name}: ${st.tagline}`}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                          isCur
                            ? 'bg-yellow-400 text-slate-950'
                            : 'bg-white/10 text-slate-200 hover:bg-white/15'
                        }`}
                      >
                        <img src={st.iconUrl} alt="" className="w-4 h-4 object-contain" />
                        <span className="hidden sm:inline">{st.shortName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 1. Mentality Controls */}
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'defensive', label: 'Phòng ngự' },
                      { id: 'balanced', label: 'Cân bằng' },
                      { id: 'attacking', label: 'Tấn công' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        handleLiveTacticChange(m.id, pressing, attackFocus, m.label)
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap cursor-pointer ${
                        mentality === m.id
                          ? 'bg-yellow-400 text-zinc-950'
                          : 'bg-white/10 text-slate-200 hover:bg-white/15'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* 2. Pressing, Focus & Quick Formation Switcher */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-bold uppercase hidden md:inline">
                    Áp sát:
                  </span>
                  {(
                    [
                      { id: 'low', label: 'Thấp' },
                      { id: 'medium', label: 'Vừa' },
                      { id: 'high', label: 'Gegenpress' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        handleLiveTacticChange(mentality, p.id, attackFocus, `Áp sát ${p.label}`)
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap cursor-pointer ${
                        pressing === p.id
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <select
                    value={attackFocus}
                    onChange={(e) => {
                      const nextFocus = e.target.value as AttackFocusOption;
                      const labelMap: Record<AttackFocusOption, string> = {
                        mixed: 'Đa dạng',
                        wings: 'Đánh biên',
                        center: 'Trung lộ',
                        long_shot: 'Sút xa',
                      };
                      handleLiveTacticChange(
                        mentality,
                        pressing,
                        nextFocus,
                        `Hướng tấn công: ${labelMap[nextFocus]}`
                      );
                    }}
                    aria-label="Hướng lên bóng"
                    className="bg-slate-900 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-cyan-300 font-bold cursor-pointer"
                  >
                    <option value="mixed">Hướng: Đa dạng</option>
                    <option value="wings">Hướng: Đánh biên</option>
                    <option value="center">Hướng: Trung lộ</option>
                    <option value="long_shot">Hướng: Sút xa</option>
                  </select>

                  <select
                    value={matchFormation.id}
                    onChange={(e) => handleChangeFormationInMatch(e.target.value)}
                    aria-label="Đổi sơ đồ chiến thuật trực tiếp"
                    className="bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-yellow-300 font-bold cursor-pointer"
                  >
                    {availableFormations.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Uploaded Blank Cream-Gold Pill Button overlaid with "THAY CẦU THỦ" */}
                <SubstitutePillButton
                  label="THAY CẦU THỦ"
                  subCountText={`${5 - subsMade}/5`}
                  disabled={subsMade >= 5}
                  onClick={() => {
                    soundService.playClick();
                    if (selectedPitchIdx === null) setSelectedPitchIdx(1);
                    setShowSubDrawer(true);
                  }}
                />
              </footer>

              {/* LIVE SUBSTITUTION MODAL DRAWER (2-COLUMN FCCard DRAWER ALIGNED WITH CAREER MODE) */}
              {showSubDrawer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-yellow-400/50 p-5 shadow-2xl flex flex-col max-h-[86vh]">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                      <div>
                        <h3 className="font-cruyff font-black text-xl text-white uppercase italic">
                          THAY CẦU THỦ TRỰC TIẾP ({subsMade}/5 LƯỢT ĐÃ DÙNG)
                        </h3>
                        <p className="text-xs text-slate-300">
                          {matchMode === 'bot'
                            ? 'Đồng hồ trận đấu đang tạm dừng · Chọn 1 cầu thủ trên sân và 1 cầu thủ dự bị để thay người'
                            : 'Trận PvP trực tuyến đang tiếp tục · Chọn 1 cầu thủ trên sân và 1 cầu thủ dự bị để thay người'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSubDrawer(false)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
                      {/* Step 1: Select On-Pitch Starter */}
                      <div>
                        <div className="text-xs font-bold uppercase text-cyan-300 mb-2">
                          1. Chọn thẻ cầu thủ rời sân (Đang đá chính)
                        </div>
                        <div className="space-y-2">
                          {matchStarters.map((p, idx) => {
                            const ent = userEntities[idx];
                            const isSelected = selectedPitchIdx === idx;
                            return (
                              <button
                                type="button"
                                key={`${p.id}_pitch_${idx}`}
                                onClick={() => setSelectedPitchIdx(idx)}
                                className={`w-full px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2.5 text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-cyan-500/25 border-cyan-300 text-white font-bold shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="shrink-0">
                                    <FCCard player={p} size="pitch" showStats={false} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate">
                                      <strong className="font-mono text-yellow-300 mr-1.5">
                                        {matchFormation.slots[idx]?.pos || p.position}
                                      </strong>
                                      {p.name}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      OVR {p.ovr} · {p.club}
                                    </div>
                                  </div>
                                </div>
                                <span className="font-mono text-[11px] text-emerald-300 shrink-0">
                                  Thể lực {Math.round(ent?.stamina ?? 100)}%
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step 2: Select Bench Player */}
                      <div>
                        <div className="text-xs font-bold uppercase text-yellow-300 mb-2">
                          2. Chọn thẻ cầu thủ vào sân (Dự bị 100% thể lực)
                        </div>
                        <div className="space-y-2">
                          {matchBench.map((bPlayer, bIdx) => (
                            <button
                              type="button"
                              key={`${bPlayer.id}_sub_${bIdx}`}
                              disabled={selectedPitchIdx === null || subsMade >= 5}
                              onClick={() => handleConfirmSubstitution(bIdx)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-yellow-400/20 border border-white/15 hover:border-yellow-400 text-left flex items-center justify-between gap-2.5 text-xs transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="shrink-0">
                                  <FCCard player={bPlayer} size="pitch" showStats={false} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate">
                                    <span className="font-mono text-yellow-300 mr-1.5">
                                      {bPlayer.position}
                                    </span>
                                    {bPlayer.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    OVR {bPlayer.ovr} · PAC {bPlayer.pac} · SHO {bPlayer.sho}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded bg-yellow-400 text-zinc-950 font-bold uppercase text-[10px] shrink-0">
                                Vào sân
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------- MATCH RESULT SUMMARY ---------------- */}
          {phase === 'result' && outcomeSummary && (
            <section className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-950/95 border-2 border-yellow-400 text-center space-y-5 shadow-[0_0_45px_rgba(250,204,21,0.3)]">
              <div className="flex items-center justify-center gap-4">
                <img
                  src={outcomeSummary.ranked.nextRank.logoUrl}
                  alt={outcomeSummary.ranked.nextRank.fullLabel}
                  className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                />
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-cyan-300">
                  KẾT QUẢ ĐẤU XẾP HẠNG ({outcomeSummary.isBot ? 'BOT HẠNG' : 'PvP ONLINE'})
                </div>
                <h3 className="font-black text-3xl sm:text-4xl text-white uppercase mt-1">
                  {user.teamName} {outcomeSummary.userGoals} - {outcomeSummary.oppGoals}{' '}
                  {outcomeSummary.opponent.teamName}
                </h3>
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-yellow-400/50 text-xs font-black text-yellow-300">
                  {outcomeSummary.ranked.nextRank.fullLabel} ·{' '}
                  {outcomeSummary.ranked.starDelta > 0
                    ? `+${outcomeSummary.ranked.starDelta}★`
                    : outcomeSummary.ranked.protectedAtChampionFloor
                    ? '0★ (Bảo vệ Nhà Vô Địch)'
                    : `${outcomeSummary.ranked.starDelta}★`}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-black/60 p-4 rounded-xl border border-white/15">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Kim Cương</div>
                  <div className="font-mono font-black text-lg text-cyan-300">
                    +{outcomeSummary.ranked.totalGemsAwarded.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Vé Quay Thăng Hạng</div>
                  <div className="font-mono font-black text-lg text-yellow-300">
                    +{outcomeSummary.ranked.totalTicketsAwarded}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Token Ginga</div>
                  <div className="font-mono font-black text-lg text-emerald-300">
                    +{outcomeSummary.gingaTokensEarned}
                  </div>
                </div>
              </div>

              {outcomeSummary.ranked.unlockedPromotionRewards.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/75 border border-emerald-400 text-xs text-emerald-200 font-bold">
                  🎉 THĂNG BẬC MỚI! Mở khóa quà{' '}
                  {outcomeSummary.ranked.unlockedPromotionRewards
                    .map((r) => `${r.tierName} (+${r.tickets} Vé, +${r.gems} Gems)`)
                    .join(', ')}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={startBotRankedMatch}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl border border-white cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" /> Đấu Bot Tiếp Theo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setPhase('lobby');
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase rounded-xl border border-white/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-yellow-300" /> Về Sảnh Xếp Hạng
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
