import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Calendar,
  Award,
  Mic,
  Sliders,
  Shield,
  Flame,
  RefreshCw,
  ArrowLeftRight,
  Clock,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Ticket,
  FastForward,
} from 'lucide-react';
import { soundService } from '../services/sound';
import {
  UserProfile,
  PlayerCard,
  FormationConfig,
  CareerSeasonState,
  PremierLeagueClub,
  CareerStandingRow,
  TacticalPlayStyleId,
} from '../types/game';
import { availableFormations } from '../data/formationsData';
import {
  TACTICAL_PLAYSTYLES,
  evaluatePlayStyleMatchup,
  getOpponentPlayStyle,
  getPlayStyleDef,
} from '../data/playStylesData';
import { isBundesligaPlayer } from '../data/bundesligaData';
import { useEuro2024Assets } from '../data/euro2024Assets';
import { FCCard } from './FCCard';
import { TopSectionHeader } from './TopSectionHeader';
import {
  getCanonicalPlayerNameKey,
  getEffectiveStarterOvr,
} from '../utils/squadUtils';
import { evaluateManagerBonus } from '../data/managersData';
import {
  USER_CLUB_ID,
  CAREER_OPPONENT_OVR_BOOST,
  getPremierLeagueClubs,
  createInitialCareerSeason,
  simulateAiFixture,
  sortStandings,
  calculateMatchRewards,
  getSeasonRewardForRank,
  SEASON_REWARD_TIERS,
  MatchRewardBreakdown,
} from '../data/premierLeagueData';
import {
  RewardGiftBoxIcon,
  CareerPlayButton,
  SubstitutePillButton,
  CompletePillButton,
  CommentatorBelowStatsBanner,
} from './GameUiIcons';

interface CareerModeModalProps {
  user: UserProfile;
  starters: PlayerCard[];
  bench: PlayerCard[];
  activeFormation: FormationConfig;
  initialTab?: 'standings' | 'fixtures' | 'rewards';
  onUpdateSquad: (newStarters: PlayerCard[], newBench: PlayerCard[], formationId: string) => void;
  onClaimCareerRewards: (rewards: {
    coins: number;
    gems: number;
    goalsScored: number;
    bundesligaGoalsScored?: number;
    playedMatch: boolean;
    matchResult?: 'W' | 'D' | 'L';
    starPointsEarned?: number;
  }) => void;
  onGoToTickets?: () => void;
  onSelectPlayStyle?: (style: TacticalPlayStyleId) => void;
  onUpdateUser?: (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenShop?: () => void;
  onClose: () => void;
  onGoHome?: () => void;
}

interface PitchEntity {
  id: string;
  name: string;
  shortName: string;
  pos: string;
  ovr: number;
  x: number; // 0..100 left to right
  y: number; // 0..100 top to bottom
  stamina: number; // 0..100
  isGk: boolean;
}

interface CommentaryLine {
  id: string;
  minute: number;
  text: string;
  tone: 'normal' | 'danger' | 'goal' | 'tactic';
}

const CAREER_STORAGE_KEY = 'fc_premier_league_career_v2';

// Helper: clamp value
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// Convert formation slot (vertical pitch: y=91 GK -> y=13 ST, x=16..84) to horizontal pitch coordinates
const mapUserSlotToHorizontal = (
  slot: { pos: string; x: number; y: number },
  isGk: boolean
): { x: number; y: number } => {
  if (isGk || slot.pos === 'GK') {
    return { x: 7, y: 50 };
  }
  // slot.y: 78 (CB) -> ~22, 50 (CM) -> ~40, 13 (ST) -> ~62
  const baseX = clamp(12 + ((90 - slot.y) / 80) * 52, 17, 68);
  const baseY = clamp(slot.x, 12, 88);
  return { x: baseX, y: baseY };
};

// Opponent standard 4-3-3 horizontal base positions (defending right goal at x=94, attacking left)
const OPP_BASE_SLOTS: Array<{ pos: string; x: number; y: number; isGk: boolean }> = [
  { pos: 'LW', x: 40, y: 80, isGk: false },
  { pos: 'ST', x: 35, y: 50, isGk: false },
  { pos: 'RW', x: 40, y: 20, isGk: false },
  { pos: 'CAM', x: 50, y: 50, isGk: false },
  { pos: 'CM', x: 57, y: 68, isGk: false },
  { pos: 'CDM', x: 62, y: 34, isGk: false },
  { pos: 'LB', x: 76, y: 82, isGk: false },
  { pos: 'CB', x: 78, y: 60, isGk: false },
  { pos: 'CB', x: 78, y: 40, isGk: false },
  { pos: 'RB', x: 76, y: 18, isGk: false },
  { pos: 'GK', x: 93, y: 50, isGk: true },
];

export const CareerModeModal: React.FC<CareerModeModalProps> = ({
  user,
  starters,
  bench,
  activeFormation,
  initialTab = 'standings',
  onUpdateSquad,
  onClaimCareerRewards,
  onGoToTickets,
  onSelectPlayStyle,
  onUpdateUser,
  onOpenShop,
  onClose,
  onGoHome,
}) => {
  // 20 Premier League Clubs synced with user's current club name, logo, and OVR
  const clubs = useMemo(
    () => getPremierLeagueClubs(user.teamName, user.teamLogo, user.ovr),
    [user.teamName, user.teamLogo, user.ovr]
  );

  const clubMap = useMemo(() => {
    const map = new Map<string, PremierLeagueClub>();
    clubs.forEach((c) => map.set(c.id, c));
    return map;
  }, [clubs]);

  // Persistent Career Season State (38 Matchdays)
  const [season, setSeason] = useState<CareerSeasonState>(() => {
    try {
      const raw = localStorage.getItem(CAREER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CareerSeasonState;
        if (parsed && Array.isArray(parsed.standings) && parsed.standings.length === 20 && parsed.fixtures?.length === 38) {
          return parsed;
        }
      }
    } catch {}
    return createInitialCareerSeason(1, getPremierLeagueClubs(user.teamName, user.teamLogo, user.ovr));
  });

  useEffect(() => {
    try {
      localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(season));
    } catch {}
  }, [season]);

  // Career Screen Mode: 'hub' | 'match' | 'post_match' | 'season_complete'
  const [screen, setScreen] = useState<'hub' | 'match' | 'post_match' | 'season_complete'>('hub');
  const [hubTab, setHubTab] = useState<'standings' | 'fixtures' | 'rewards'>(
    initialTab || 'standings'
  );
  const { getAsset: getEuroAsset } = useEuro2024Assets();
  const [selectedFixtureRound, setSelectedFixtureRound] = useState<number>(
    Math.min(38, season.currentMatchday)
  );

  // Sorted 20-team Premier League table
  const sortedStandings = useMemo(() => sortStandings(season.standings), [season.standings]);

  const userRank = useMemo(() => {
    const idx = sortedStandings.findIndex((r) => r.clubId === USER_CLUB_ID);
    return idx >= 0 ? idx + 1 : 20;
  }, [sortedStandings]);

  // Current matchday user fixture (if currentMatchday <= 38)
  const currentUserFixture = useMemo(() => {
    if (season.currentMatchday > 38) return null;
    const roundList = season.fixtures[season.currentMatchday - 1] || [];
    return (
      roundList.find(
        (f) => f.homeClubId === USER_CLUB_ID || f.awayClubId === USER_CLUB_ID
      ) || null
    );
  }, [season]);

  const opponentClub = useMemo(() => {
    if (!currentUserFixture) return clubs[1];
    const oppId =
      currentUserFixture.homeClubId === USER_CLUB_ID
        ? currentUserFixture.awayClubId
        : currentUserFixture.homeClubId;
    return clubMap.get(oppId) || clubs[1];
  }, [currentUserFixture, clubMap, clubs]);

  const isUserHome = currentUserFixture?.homeClubId === USER_CLUB_ID;

  // ============================================================================
  // LIVE 45-SECOND 11v11 MATCH ENGINE STATE
  // ============================================================================
  const [matchFormation, setMatchFormation] = useState<FormationConfig>(activeFormation);
  const [matchStarters, setMatchStarters] = useState<PlayerCard[]>(starters);
  const [matchBench, setMatchBench] = useState<PlayerCard[]>(bench);

  const [secondsLeft, setSecondsLeft] = useState<number>(45);
  const [userScore, setUserScore] = useState<number>(0);
  const [oppScore, setOppScore] = useState<number>(0);
  const [userShots, setUserShots] = useState<number>(0);
  const [oppShots, setOppShots] = useState<number>(0);
  const [userPossessionPct, setUserPossessionPct] = useState<number>(50);
  const userPossTicksRef = useRef<number>(1);
  const totalTicksRef = useRef<number>(2);

  // Live Tactics & Tactical Playstyle adjustable during the 45s match
  const [mentality, setMentality] = useState<'defensive' | 'balanced' | 'attacking'>('balanced');
  const [pressing, setPressing] = useState<'low' | 'medium' | 'high'>('medium');
  const [attackFocus, setAttackFocus] = useState<'center' | 'wings' | 'long_shot'>('center');
  const [livePlayStyleId, setLivePlayStyleId] = useState<TacticalPlayStyleId>(
    () => getPlayStyleDef(user.playStyle).id
  );
  useEffect(() => {
    if (user.playStyle) {
      setLivePlayStyleId(getPlayStyleDef(user.playStyle).id);
    }
  }, [user.playStyle]);

  const activeUserPlayStyle = useMemo(
    () => getPlayStyleDef(livePlayStyleId),
    [livePlayStyleId]
  );
  const oppPlayStyle = useMemo(
    () => getPlayStyleDef(getOpponentPlayStyle(opponentClub.name, opponentClub.ovr)),
    [opponentClub.name, opponentClub.ovr]
  );
  const careerStyleMatchup = useMemo(
    () => evaluatePlayStyleMatchup(activeUserPlayStyle.id, oppPlayStyle.id),
    [activeUserPlayStyle.id, oppPlayStyle.id]
  );

  const handleSelectCareerPlayStyle = (nextId: TacticalPlayStyleId) => {
    if (nextId === livePlayStyleId) return;
    soundService.playClick();
    setLivePlayStyleId(nextId);
    onSelectPlayStyle?.(nextId);
    if (screen === 'match') {
      const def = getPlayStyleDef(nextId);
      const curMin = Math.min(90, Math.max(1, (45 - secondsLeft) * 2));
      const matchupNow = evaluatePlayStyleMatchup(nextId, oppPlayStyle.id);
      setCommentary((prev) =>
        [
          {
            id: `ps_sw_${Date.now()}`,
            minute: curMin,
            text: `HLV ${user.teamName} đổi sang Phong Cách ${def.name}! (${matchupNow.summaryText})`,
            tone: 'tactic' as const,
          },
          ...prev,
        ].slice(0, 18)
      );
    }
  };

  // Substitution state (up to 5 subs per match)
  const [subsUsed, setSubsUsed] = useState<number>(0);
  const [showSubDrawer, setShowSubDrawer] = useState<boolean>(false);
  const [selectedPitchIdx, setSelectedPitchIdx] = useState<number | null>(null);

  // 22 Pitch Entities & Ball
  const [userEntities, setUserEntities] = useState<PitchEntity[]>([]);
  const [oppEntities, setOppEntities] = useState<PitchEntity[]>([]);
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [possessionSide, setPossessionSide] = useState<'user' | 'opp'>('user');
  const [goalBanner, setGoalBanner] = useState<{ scorer: string; side: 'user' | 'opp' } | null>(null);

  // Commentator feed
  const [commentary, setCommentary] = useState<CommentaryLine[]>([]);

  // Post-match reward breakdown
  const [lastMatchRewards, setLastMatchRewards] = useState<MatchRewardBreakdown | null>(null);
  const [lastEarnedStarPoints, setLastEarnedStarPoints] = useState<number>(0);
  const [matchFinishedTrigger, setMatchFinishedTrigger] = useState<boolean>(false);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const postMatchFinalizedRef = useRef<boolean>(false);
  const bundesligaGoalsRef = useRef<number>(0);

  // Initialize a fresh 45-second match
  const handleStartMatch = () => {
    if (!currentUserFixture || season.currentMatchday > 38) return;
    soundService.playStartPrompt();
    postMatchFinalizedRef.current = false;
    bundesligaGoalsRef.current = 0;
    setPassNotice(null);

    setMatchFormation(activeFormation);
    setMatchStarters(starters);
    setMatchBench(bench);
    setSecondsLeft(45);
    setUserScore(0);
    setOppScore(0);
    setUserShots(0);
    setOppShots(0);
    setUserPossessionPct(50);
    userPossTicksRef.current = 1;
    totalTicksRef.current = 2;
    setSubsUsed(0);
    setShowSubDrawer(false);
    setSelectedPitchIdx(null);
    setGoalBanner(null);
    setMatchFinishedTrigger(false);
    setBallPos({ x: 50, y: 50 });
    setPossessionSide('user');

    // Build 11 User Players (including +1 OVR per 5 Team Training levels & -5 OVR wrong-position penalty)
    const initUser: PitchEntity[] = activeFormation.slots.map((slot, idx) => {
      const p = starters[idx] || starters[0];
      const isGk = idx === 10 || slot.pos === 'GK';
      const effectivePos = isGk ? 'GK' : slot.pos;
      const coords = mapUserSlotToHorizontal(slot, isGk);
      return {
        id: `u_${p.id}_${idx}`,
        name: p.name,
        shortName: p.name.split(' ').pop() || p.name,
        pos: effectivePos,
        ovr: getEffectiveStarterOvr(p, effectivePos, user.trainingLevel),
        x: isGk ? clamp(coords.x, 4, 13) : coords.x,
        y: isGk ? clamp(coords.y, 35, 65) : coords.y,
        stamina: 100,
        isGk,
      };
    });

    // Build 11 Opponent Players
    const oppRoster = opponentClub.roster;
    const initOpp: PitchEntity[] = OPP_BASE_SLOTS.map((slot, idx) => {
      const r = oppRoster[idx] || { name: `${opponentClub.shortName} #${idx + 1}`, pos: slot.pos, ovr: opponentClub.ovr };
      return {
        id: `o_${opponentClub.id}_${idx}`,
        name: r.name,
        shortName: r.name,
        pos: slot.pos,
        ovr: r.ovr,
        x: slot.isGk ? clamp(slot.x, 87, 96) : slot.x,
        y: slot.isGk ? clamp(slot.y, 35, 65) : slot.y,
        stamina: 100,
        isGk: slot.isGk,
      };
    });

    setUserEntities(initUser);
    setOppEntities(initOpp);
    const startMgrBonus = evaluateManagerBonus({
      activeManager: user.activeManager,
      formationId: activeFormation.id,
      playStyleId: livePlayStyleId,
    }).totalBonus;
    const startUserOvr =
      Math.round(initUser.reduce((acc, p) => acc + p.ovr, 0) / Math.max(1, initUser.length)) +
      startMgrBonus;
    const ovrDiffStart = startUserOvr - opponentClub.ovr;
    const ovrVerdict =
      ovrDiffStart >= 4
        ? `Đội bạn vượt trội sức mạnh (OVR ${startUserOvr} vs ${opponentClub.ovr})!`
        : ovrDiffStart <= -4
        ? `Thử thách lớn khi ${opponentClub.name} có OVR ${opponentClub.ovr} cao hơn đội bạn (OVR ${startUserOvr})!`
        : `Hai đội có OVR cân bằng (${startUserOvr} vs ${opponentClub.ovr}), chiến thuật sẽ định đoạt trận đấu!`;

    setCommentary([
      {
        id: 'kickoff_0',
        minute: 1,
        text: `Khai cuộc vòng ${season.currentMatchday}/38! ${user.teamName} (${activeUserPlayStyle.shortName}) gặp ${opponentClub.name} (${oppPlayStyle.shortName}). ${careerStyleMatchup.summaryText} ${ovrVerdict}`,
        tone: 'tactic',
      },
    ]);

    setScreen('match');
  };

  // Refs so the 1-second tick always reads latest tactical & match values cleanly
  const liveStateRef = useRef({
    mentality,
    pressing,
    attackFocus,
    livePlayStyleId,
    matchFormation,
    matchStarters,
    userEntities,
    oppEntities,
    ballPos,
    possessionSide,
    secondsLeft,
    userScore,
    oppScore,
  });

  useEffect(() => {
    liveStateRef.current = {
      mentality,
      pressing,
      attackFocus,
      livePlayStyleId,
      matchFormation,
      matchStarters,
      userEntities,
      oppEntities,
      ballPos,
      possessionSide,
      secondsLeft,
      userScore,
      oppScore,
    };
  }, [
    mentality,
    pressing,
    attackFocus,
    livePlayStyleId,
    matchFormation,
    matchStarters,
    userEntities,
    oppEntities,
    ballPos,
    possessionSide,
    secondsLeft,
    userScore,
    oppScore,
  ]);

  // 1-SECOND TACTICAL MOVEMENT & PLAY-BY-PLAY SIMULATION LOOP
  useEffect(() => {
    if (screen !== 'match' || showSubDrawer) return;

    const timer = setInterval(() => {
      const st = liveStateRef.current;
      if (st.secondsLeft <= 0) return;

      const nextSeconds = st.secondsLeft - 1;
      const currentMinute = Math.min(90, Math.max(1, (45 - nextSeconds) * 2));

      // Compute average user live OVR weighted by stamina + active manager bonus
      const avgStamina =
        st.userEntities.reduce((acc, p) => acc + p.stamina, 0) / Math.max(1, st.userEntities.length);
      const uStyle = getPlayStyleDef(st.livePlayStyleId);
      const liveMgrBonus = evaluateManagerBonus({
        activeManager: user.activeManager,
        formationId: st.matchFormation.id,
        playStyleId: uStyle.id,
      }).totalBonus;
      const userBaseOvr =
        st.userEntities.reduce((acc, p) => acc + p.ovr, 0) / Math.max(1, st.userEntities.length) +
        liveMgrBonus;

      const oStyle = getPlayStyleDef(
        getOpponentPlayStyle(opponentClub.name, opponentClub.ovr)
      );
      const curMatchup = evaluatePlayStyleMatchup(uStyle.id, oStyle.id);

      const mentalityAttBonus =
        st.mentality === 'attacking' ? 4.5 : st.mentality === 'defensive' ? -2.5 : 1.0;
      const mentalityDefBonus =
        st.mentality === 'defensive' ? 4.5 : st.mentality === 'attacking' ? -3.0 : 1.0;
      const pressBonus = st.pressing === 'high' ? 3.2 : st.pressing === 'low' ? -1.5 : 1.0;
      const staminaPenalty = avgStamina < 55 ? -3.0 : avgStamina < 68 ? -1.0 : 0;

      const userAttPower =
        userBaseOvr +
        mentalityAttBonus +
        uStyle.engine.attBonus +
        curMatchup.ovrSwing +
        staminaPenalty +
        (isUserHome ? 1.2 : 0);
      const userDefPower =
        userBaseOvr +
        mentalityDefBonus +
        pressBonus +
        uStyle.engine.defBonus +
        curMatchup.ovrSwing * 0.65 +
        staminaPenalty;
      const oppPower = opponentClub.ovr;

      // Team OVR + Playstyle vs Opponent OVR strongly decides match dominance, shot frequency, and conversion
      const effectiveUserOvr = (userAttPower + userDefPower) * 0.5;
      const ovrDelta = effectiveUserOvr - oppPower;

      // Determine possession for this 1-second tick based on OVR difference & Playstyle possession bonus
      const winBallProb = clamp(
        0.50 + ovrDelta * 0.026 + uStyle.engine.possWinBonus,
        0.14,
        0.89
      );

      let nextPossession: 'user' | 'opp' = st.possessionSide;
      if (Math.random() < 0.46) {
        nextPossession = Math.random() < winBallProb ? 'user' : 'opp';
      }

      totalTicksRef.current += 1;
      if (nextPossession === 'user') userPossTicksRef.current += 1;
      setUserPossessionPct(
        Math.round((userPossTicksRef.current / Math.max(1, totalTicksRef.current)) * 100)
      );

      // Move ball according to possession, Playstyle ballPattern & attackFocus
      let nextBallX = st.ballPos.x;
      let nextBallY = st.ballPos.y;
      let newComment: CommentaryLine | null = null;

      if (nextPossession === 'user') {
        const ovrPushBoost = clamp(ovrDelta * 0.35, -4, 5);
        const patternPushMod =
          uStyle.engine.ballPattern === 'direct_counter'
            ? 5
            : uStyle.engine.ballPattern === 'short_center'
            ? 1
            : uStyle.engine.ballPattern === 'deep_block'
            ? -2
            : 2.5;
        const pushStep =
          (st.mentality === 'attacking' ? 16 : st.mentality === 'balanced' ? 12 : 9) +
          ovrPushBoost +
          patternPushMod;
        nextBallX = clamp(st.ballPos.x + pushStep + (Math.random() * 8 - 2), 18, 91);

        if (
          uStyle.engine.ballPattern === 'wide_cross' ||
          st.attackFocus === 'wings'
        ) {
          const targetWing = nextBallX >= 74 ? 50 : Math.random() < 0.5 ? 14 : 86;
          nextBallY = clamp(st.ballPos.y * 0.35 + targetWing * 0.65 + (Math.random() * 10 - 5), 10, 90);
        } else if (
          uStyle.engine.ballPattern === 'short_center' ||
          st.attackFocus === 'center'
        ) {
          nextBallY = clamp(st.ballPos.y * 0.4 + 50 * 0.6 + (Math.random() * 14 - 7), 26, 74);
        } else {
          nextBallY = clamp(st.ballPos.y + (Math.random() * 24 - 12), 18, 82);
        }

        const attackers = st.userEntities.filter((e) => !e.isGk);
        const carrier = attackers[Math.floor(Math.random() * Math.min(5, attackers.length))] || st.userEntities[0];

        // Shot check scaled by OVR advantage & Playstyle shootProbBonus
        const shootThreshold = st.attackFocus === 'long_shot' ? 68 : 76;
        const userShootProb = clamp(
          0.48 + ovrDelta * 0.022 + uStyle.engine.shootProbBonus,
          0.18,
          0.82
        );
        if (nextBallX >= shootThreshold && Math.random() < userShootProb) {
          setUserShots((s) => s + 1);
          const oppGk = st.oppEntities.find((e) => e.isGk) || st.oppEntities[10];
          const oppDefRating = (oppGk?.ovr || oppPower) * 0.55 + oppPower * 0.45;
          const userShotRating = carrier.ovr * 0.5 + userAttPower * 0.5;
          const goalChance = clamp(
            0.28 +
              (userShotRating - oppDefRating) * 0.024 +
              uStyle.engine.goalConvBonus +
              curMatchup.goalProbSwing,
            0.06,
            0.78
          );

          if (Math.random() < goalChance) {
            // USER SCORES!
            soundService.playTrophy();
            const carrierIdx = st.userEntities.findIndex((e) => e.id === carrier.id);
            const scorerCard =
              carrierIdx >= 0
                ? st.matchStarters[carrierIdx]
                : st.matchStarters.find((c) => c.name === carrier.name);
            if (isBundesligaPlayer(scorerCard)) {
              bundesligaGoalsRef.current += 1;
            }
            setUserScore((prev) => prev + 1);
            setGoalBanner({ scorer: `${carrier.shortName} (${currentMinute}')`, side: 'user' });
            setTimeout(() => setGoalBanner(null), 2200);
            const specialPhrase = uStyle.commentarySpecial[0] || '';
            newComment = {
              id: `c_${nextSeconds}_ug`,
              minute: currentMinute,
              text: `VÀOOOOO!! ${specialPhrase} ${carrier.name} (OVR ${carrier.ovr}) dứt điểm đẳng cấp hạ gục ${oppGk?.shortName || opponentClub.shortName}!`,
              tone: 'goal',
            };
            nextBallX = 50;
            nextBallY = 50;
            nextPossession = 'opp';
          } else {
            newComment = {
              id: `c_${nextSeconds}_us`,
              minute: currentMinute,
              text: `Không vào! Cú dứt điểm từ bài đánh ${uStyle.shortName} của ${carrier.shortName} (OVR ${carrier.ovr}) bị hàng thủ ${opponentClub.shortName} cản phá!`,
              tone: 'danger',
            };
            nextBallX = 88;
            nextBallY = clamp(nextBallY, 36, 64);
            nextPossession = 'opp';
          }
        } else {
          const buildPhrases = [
            ...uStyle.commentaryBuildUp,
            `${carrier.shortName} (OVR ${carrier.ovr}) dẫn bóng áp sát phần sân ${opponentClub.name} theo hệ thống ${uStyle.shortName}.`,
          ];
          newComment = {
            id: `c_${nextSeconds}_ub`,
            minute: currentMinute,
            text: buildPhrases[nextSeconds % buildPhrases.length],
            tone: 'normal',
          };
        }
      } else {
        // Opponent Possession (attacks from right x=90 toward left x=10)
        const oppOvrBoost = clamp(-ovrDelta * 0.35, -4, 5);
        const oppStep =
          (st.pressing === 'high' || uStyle.id === 'high_press' ? 10 : 14) + oppOvrBoost;
        nextBallX = clamp(st.ballPos.x - oppStep - (Math.random() * 7 - 2), 9, 84);
        nextBallY = clamp(st.ballPos.y + (Math.random() * 28 - 14), 14, 86);

        const oppAttackers = st.oppEntities.filter((e) => !e.isGk);
        const oppStar = oppAttackers[Math.floor(Math.random() * Math.min(4, oppAttackers.length))] || st.oppEntities[1];
        const userGk = st.userEntities.find((e) => e.isGk) || st.userEntities[10];

        // High press interception chance scaled by user OVR & Playstyle pressInterceptBonus
        const canHighIntercept = st.pressing === 'high' || uStyle.engine.pressInterceptBonus > 0.05;
        const pressInterceptProb = clamp(
          0.18 + ovrDelta * 0.012 + uStyle.engine.pressInterceptBonus,
          0.06,
          0.48
        );
        if (canHighIntercept && Math.random() < pressInterceptProb) {
          nextPossession = 'user';
          nextBallX = clamp(nextBallX + 14, 32, 72);
          newComment = {
            id: `c_${nextSeconds}_pr`,
            minute: currentMinute,
            text: `${uStyle.shortName} phát huy tác dụng! Cầu thủ ${user.teamName} vây ráp đoạt lại bóng ngay trên phần sân đối phương!`,
            tone: 'tactic',
          };
        } else if (nextBallX <= 23 && Math.random() < clamp(0.48 - ovrDelta * 0.022, 0.16, 0.76)) {
          setOppShots((s) => s + 1);
          const oppShotRating = oppStar.ovr * 0.5 + oppPower * 0.5;
          const userDefRating = userDefPower * 0.65 + (userGk?.ovr || 74) * 0.35;
          const oppGoalChance = clamp(
            0.26 +
              (oppShotRating - userDefRating) * 0.024 +
              uStyle.engine.concedeMod -
              curMatchup.goalProbSwing * 0.75,
            0.04,
            0.72
          );

          if (Math.random() < oppGoalChance) {
            // OPPONENT SCORES
            setOppScore((prev) => prev + 1);
            setGoalBanner({ scorer: `${oppStar.shortName} (${currentMinute}')`, side: 'opp' });
            setTimeout(() => setGoalBanner(null), 2200);
            newComment = {
              id: `c_${nextSeconds}_og`,
              minute: currentMinute,
              text: `BÀN THẮNG CHO ĐỘI BẠN! ${oppStar.name} (${opponentClub.shortName} · ${oStyle.shortName}) khai thác khoảng trống ghi bàn!`,
              tone: 'goal',
            };
            nextBallX = 50;
            nextBallY = 50;
            nextPossession = 'user';
          } else {
            newComment = {
              id: `c_${nextSeconds}_os`,
              minute: currentMinute,
              text: `CỨU THUA! Hệ thống ${uStyle.shortName} cùng thủ môn ${userGk?.shortName || 'đội nhà'} cản phá xuất sắc cú sút của ${oppStar.shortName}!`,
              tone: 'danger',
            };
            nextBallX = 12;
            nextBallY = clamp(nextBallY, 36, 64);
            nextPossession = 'user';
          }
        } else {
          const defPhrases = [
            `${opponentClub.name} (${oStyle.shortName}) gây sức ép qua chân ${oppStar.shortName}, hàng thủ ${user.teamName} đang bọc lót.`,
            `${oppStar.shortName} (OVR ${oppStar.ovr}) tìm khoảng trống trước vòng cấm nhưng hệ thống ${uStyle.shortName} kịp phong tỏa.`,
          ];
          newComment = {
            id: `c_${nextSeconds}_ob`,
            minute: currentMinute,
            text: defPhrases[nextSeconds % defPhrases.length],
            tone: 'normal',
          };
        }
      }

      // Update ALL 11 USER PLAYERS every 1 second (GK strictly clamped inside left penalty box!)
      const styleShift =
        uStyle.id === 'high_press'
          ? 7
          : uStyle.id === 'phong_ngu'
          ? -8
          : uStyle.id === 'tiki_taka'
          ? 3
          : 0;
      const mentalityShift =
        (st.mentality === 'attacking' ? 11 : st.mentality === 'defensive' ? -9 : 0) + styleShift;
      const possessionShiftUser = nextPossession === 'user' ? 14 : -10;

      const updatedUserEntities = st.userEntities.map((ent, idx) => {
        if (ent.isGk || idx === 10 || ent.pos === 'GK') {
          // STRICT PENALTY BOX MOVEMENT ONLY: x in [3.5, 13.5], y in [34, 66]
          const gkTargetX = nextBallX < 35 ? 11.5 : 6.0;
          const gkTargetY = 50 + (nextBallY - 50) * 0.32;
          return {
            ...ent,
            x: clamp(gkTargetX + (Math.random() * 2 - 1), 3.5, 13.5),
            y: clamp(gkTargetY + (Math.random() * 3 - 1.5), 34, 66),
          };
        }

        const slot = st.matchFormation.slots[idx] || st.matchFormation.slots[0];
        const base = mapUserSlotToHorizontal(slot, false);
        const attractToBallX = (nextBallX - base.x) * 0.25;
        const attractToBallY = (nextBallY - base.y) * 0.22;

        const targetX = clamp(
          base.x + mentalityShift + possessionShiftUser + attractToBallX + (Math.random() * 6 - 3),
          16,
          92
        );
        const targetY = clamp(
          base.y + attractToBallY + (Math.random() * 6 - 3),
          8,
          92
        );

        const baseDrain =
          (st.pressing === 'high' ? 1.25 : st.pressing === 'medium' ? 0.85 : 0.6) +
          (st.mentality === 'attacking' ? 0.3 : 0);
        const drain = baseDrain * uStyle.engine.staminaDrainMult;

        return {
          ...ent,
          x: targetX,
          y: targetY,
          stamina: Math.max(25, ent.stamina - drain),
        };
      });

      // Update ALL 11 OPPONENT PLAYERS every 1 second (GK strictly clamped inside right penalty box!)
      const possessionShiftOpp = nextPossession === 'opp' ? -15 : 9;
      const updatedOppEntities = st.oppEntities.map((ent, idx) => {
        if (ent.isGk || idx === 10 || ent.pos === 'GK') {
          // STRICT PENALTY BOX MOVEMENT ONLY: x in [86.5, 96.5], y in [34, 66]
          const gkTargetX = nextBallX > 65 ? 88.5 : 94.0;
          const gkTargetY = 50 + (nextBallY - 50) * 0.32;
          return {
            ...ent,
            x: clamp(gkTargetX + (Math.random() * 2 - 1), 86.5, 96.5),
            y: clamp(gkTargetY + (Math.random() * 3 - 1.5), 34, 66),
          };
        }

        const base = OPP_BASE_SLOTS[idx] || OPP_BASE_SLOTS[0];
        const attractX = (nextBallX - base.x) * 0.24;
        const attractY = (nextBallY - base.y) * 0.22;

        return {
          ...ent,
          x: clamp(base.x + possessionShiftOpp + attractX + (Math.random() * 6 - 3), 8, 84),
          y: clamp(base.y + attractY + (Math.random() * 6 - 3), 8, 92),
        };
      });

      setBallPos({ x: nextBallX, y: nextBallY });
      setPossessionSide(nextPossession);
      setUserEntities(updatedUserEntities);
      setOppEntities(updatedOppEntities);
      setSecondsLeft(nextSeconds);

      if (newComment) {
        setCommentary((prev) => [newComment!, ...prev].slice(0, 18));
      }

      if (nextSeconds <= 0) {
        setMatchFinishedTrigger(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, showSubDrawer, opponentClub, isUserHome, user.teamName, user.activeManager]);

  const finalizeCareerMatch = useCallback(
    (finalUserGoals: number, finalOppGoals: number) => {
      if (postMatchFinalizedRef.current) return;
      postMatchFinalizedRef.current = true;

      setUserScore(finalUserGoals);
      setOppScore(finalOppGoals);

      const matchdayNum = season.currentMatchday;

      // Calculate Match Rewards
      const rewards = calculateMatchRewards(
        finalUserGoals,
        finalOppGoals,
        opponentClub.ovr,
        matchdayNum
      );
      setLastMatchRewards(rewards);

      // Update all 10 Premier League fixtures in this matchday (1 user match + 9 simulated AI matches)
      setSeason((prev) => {
        const roundIdx = prev.currentMatchday - 1;
        if (roundIdx < 0 || roundIdx >= 38) return prev;

        const updatedFixtures = prev.fixtures.map((rList, rIdx) => {
          if (rIdx !== roundIdx) return rList;
          return rList.map((fix) => {
            if (fix.homeClubId === USER_CLUB_ID) {
              return {
                ...fix,
                homeGoals: finalUserGoals,
                awayGoals: finalOppGoals,
                played: true,
              };
            }
            if (fix.awayClubId === USER_CLUB_ID) {
              return {
                ...fix,
                homeGoals: finalOppGoals,
                awayGoals: finalUserGoals,
                played: true,
              };
            }
            const hClub = clubMap.get(fix.homeClubId);
            const aClub = clubMap.get(fix.awayClubId);
            const sim = simulateAiFixture(
              hClub?.ovr || 78 + CAREER_OPPONENT_OVR_BOOST,
              aClub?.ovr || 78 + CAREER_OPPONENT_OVR_BOOST
            );
            return {
              ...fix,
              homeGoals: sim.homeGoals,
              awayGoals: sim.awayGoals,
              played: true,
            };
          });
        });

        // Recompute standings from updated round
        const roundResults = updatedFixtures[roundIdx];
        const nextStandings: CareerStandingRow[] = prev.standings.map((row) => {
          const match = roundResults.find(
            (f) => f.homeClubId === row.clubId || f.awayClubId === row.clubId
          );
          if (!match || match.homeGoals === undefined || match.awayGoals === undefined) {
            return row;
          }
          const isHome = match.homeClubId === row.clubId;
          const gf = isHome ? match.homeGoals : match.awayGoals;
          const ga = isHome ? match.awayGoals : match.homeGoals;
          const won = gf > ga ? 1 : 0;
          const drawn = gf === ga ? 1 : 0;
          const lost = gf < ga ? 1 : 0;
          const pts = won * 3 + drawn;
          const formChar: 'W' | 'D' | 'L' = gf > ga ? 'W' : gf === ga ? 'D' : 'L';

          return {
            ...row,
            played: row.played + 1,
            won: row.won + won,
            drawn: row.drawn + drawn,
            lost: row.lost + lost,
            gf: row.gf + gf,
            ga: row.ga + ga,
            points: row.points + pts,
            form: [...row.form, formChar].slice(-5),
          };
        });

        return {
          ...prev,
          currentMatchday: prev.currentMatchday + 1,
          standings: nextStandings,
          fixtures: updatedFixtures,
          totalGoalsScored: prev.totalGoalsScored + finalUserGoals,
        };
      });

      const baseStarPts =
        finalUserGoals > finalOppGoals ? 150 : finalUserGoals === finalOppGoals ? 100 : 70;
      const earnedStarPts = baseStarPts + Math.min(4, finalUserGoals) * 15;
      setLastEarnedStarPoints(earnedStarPts);

      const matchOutcome: 'W' | 'D' | 'L' =
        finalUserGoals > finalOppGoals ? 'W' : finalUserGoals === finalOppGoals ? 'D' : 'L';

      // Credit match rewards + Star Pass points + Ginga daily match tokens immediately to user profile
      onClaimCareerRewards({
        coins: rewards.coins,
        gems: rewards.gems,
        goalsScored: finalUserGoals,
        bundesligaGoalsScored: bundesligaGoalsRef.current,
        playedMatch: true,
        matchResult: matchOutcome,
        starPointsEarned: earnedStarPts,
      });

      if (finalUserGoals > finalOppGoals) {
        soundService.playPackOpenFanfare();
        try {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        soundService.playCoins();
      }

      setScreen('post_match');
    },
    [season.currentMatchday, opponentClub.ovr, clubMap, onClaimCareerRewards]
  );

  // Finalize match when 45 seconds reach 0
  useEffect(() => {
    if (!matchFinishedTrigger || screen !== 'match') return;
    setMatchFinishedTrigger(false);
    finalizeCareerMatch(userScore, oppScore);
  }, [matchFinishedTrigger, screen, userScore, oppScore, finalizeCareerMatch]);

  // Use 1 Match Skip Pass (1,000 Gems in Shop) to skip & claim victory immediately
  const handleUseMatchSkipPass = () => {
    if (!currentUserFixture || season.currentMatchday > 38) return;
    const ownedPasses = user.matchSkipPasses ?? 0;
    if (ownedPasses < 1) {
      soundService.playClick();
      setPassNotice('Bạn chưa có Vé Pass Trận Đấu! Mua tại Cửa Hàng với giá 1.000 Kim Cương.');
      return;
    }
    setPassNotice(null);
    setShowSubDrawer(false);
    postMatchFinalizedRef.current = false;
    onUpdateUser?.((prev) => ({
      matchSkipPasses: Math.max(0, (prev.matchSkipPasses ?? 0) - 1),
    }));
    const oppG = screen === 'match' ? oppScore : Math.random() < 0.35 ? 1 : 0;
    const userG =
      screen === 'match'
        ? Math.max(userScore, oppScore + 2)
        : oppG + (user.ovr >= opponentClub.ovr ? 3 : 2);
    if (screen !== 'match') {
      bundesligaGoalsRef.current = 0;
    }
    const activeLineup = screen === 'match' ? matchStarters : starters;
    const hasOutfieldBundesliga = activeLineup
      .slice(0, 10)
      .some((p) => isBundesligaPlayer(p));
    if (hasOutfieldBundesliga) {
      const bonusGoals = Math.max(0, userG - (screen === 'match' ? userScore : 0));
      bundesligaGoalsRef.current += bonusGoals;
    }
    finalizeCareerMatch(userG, oppG);
  };

  // Live Tactical Change Handler (with Commentator announcement)
  const handleChangeMentality = (next: 'defensive' | 'balanced' | 'attacking') => {
    soundService.playClick();
    setMentality(next);
    const label =
      next === 'attacking' ? 'Tấn công tổng lực' : next === 'defensive' ? 'Phòng ngự phản công' : 'Cân bằng';
    const minute = Math.min(90, Math.max(1, (45 - secondsLeft) * 2));
    setCommentary((prev) => [
      {
        id: `tac_m_${Date.now()}`,
        minute,
        text: `Chỉ đạo từ đường biên! HLV ${user.username} chuyển lối chơi sang ${label}!`,
        tone: 'tactic',
      },
      ...prev,
    ]);
  };

  const handleChangeFormationInMatch = (formationId: string) => {
    const found = availableFormations.find((f) => f.id === formationId);
    if (!found) return;
    soundService.playClick();
    setMatchFormation(found);
    onUpdateSquad(matchStarters, matchBench, found.id);
    setUserEntities((prev) =>
      prev.map((ent, idx) => {
        const slot = found.slots[idx] || found.slots[0];
        const isGk = idx === 10 || slot.pos === 'GK';
        const effectivePos = isGk ? 'GK' : slot.pos;
        const p = matchStarters[idx] || matchStarters[0];
        return {
          ...ent,
          pos: effectivePos,
          ovr: p ? getEffectiveStarterOvr(p, effectivePos, user.trainingLevel) : ent.ovr,
          isGk,
        };
      })
    );
    const minute = Math.min(90, Math.max(1, (45 - secondsLeft) * 2));
    setCommentary((prev) => [
      {
        id: `tac_f_${Date.now()}`,
        minute,
        text: `Thay đổi sơ đồ chiến thuật ngay trên sân: ${user.teamName} chuyển sang hệ thống ${found.name}!`,
        tone: 'tactic',
      },
      ...prev,
    ]);
  };

  // Execute Live Player Substitution
  const handleConfirmSubstitution = (benchIdx: number) => {
    if (selectedPitchIdx === null || subsUsed >= 5) return;
    const outPlayer = matchStarters[selectedPitchIdx];
    const inPlayer = matchBench[benchIdx];
    if (!outPlayer || !inPlayer) return;

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

    // Prevent swapping a goalkeeper with an outfielder unless GK slot
    soundService.playCoins();
    const nextStarters = [...matchStarters];
    const nextBench = [...matchBench];
    nextStarters[selectedPitchIdx] = inPlayer;
    nextBench[benchIdx] = outPlayer;

    setMatchStarters(nextStarters);
    setMatchBench(nextBench);
    onUpdateSquad(nextStarters, nextBench, matchFormation.id);

    // Update pitch entity with 100% fresh stamina, team training bonus & position check
    setUserEntities((prev) =>
      prev.map((ent, idx) => {
        if (idx !== selectedPitchIdx) return ent;
        const slotPos = matchFormation.slots[idx]?.pos;
        const isGk = idx === 10 || slotPos === 'GK';
        const effectivePos = isGk ? 'GK' : slotPos;
        return {
          ...ent,
          id: `u_${inPlayer.id}_${idx}_${Date.now()}`,
          name: inPlayer.name,
          shortName: inPlayer.name.split(' ').pop() || inPlayer.name,
          ovr: getEffectiveStarterOvr(inPlayer, effectivePos, user.trainingLevel),
          stamina: 100,
          isGk,
        };
      })
    );

    const nextSubs = subsUsed + 1;
    setSubsUsed(nextSubs);
    setSelectedPitchIdx(null);
    setShowSubDrawer(false);

    const minute = Math.min(90, Math.max(1, (45 - secondsLeft) * 2));
    setCommentary((prev) => [
      {
        id: `sub_${Date.now()}`,
        minute,
        text: `THAY NGƯỜI (${nextSubs}/5): ${inPlayer.name} (OVR ${inPlayer.ovr}) vào sân thay cho ${outPlayer.name} với 100% thể lực!`,
        tone: 'tactic',
      },
      ...prev,
    ]);
  };

  // Claim End-of-Season Reward (after Matchday 38) and start next season
  const handleClaimSeasonEndAndAdvance = () => {
    const reward = getSeasonRewardForRank(userRank);
    soundService.playPackOpenFanfare();
    onClaimCareerRewards({
      coins: reward.coins,
      gems: reward.gems,
      goalsScored: 0,
      playedMatch: false,
    });
    const nextSeason = createInitialCareerSeason(season.seasonNumber + 1, clubs);
    setSeason(nextSeason);
    setSelectedFixtureRound(1);
    setScreen('hub');
  };

  const featuredSquadStar = useMemo(() => {
    return [...matchStarters].sort((a, b) => b.ovr - a.ovr)[0] || starters[0];
  }, [matchStarters, starters]);

  const currentMatchMinute = Math.min(90, Math.max(1, (45 - secondsLeft) * 2));

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden font-cruyff">
      {/* ===================================================================== */}
      {/* SCREEN 1: PREMIER LEAGUE CAREER HUB (STANDINGS, 38 ROUNDS & REWARDS)  */}
      {/* ===================================================================== */}
      {screen === 'hub' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Career Mode Roof Floodlights Background (/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_BG_87671226.png) */}
          <div className="absolute inset-0 z-0">
            <img
              src="/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_BG_87671226.png"
              alt="Premier League Career Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/55 to-black/90" />
          </div>

          {/* Top Section Header (Frameless Resources Top-Right + Back + Main Screen) */}
          <TopSectionHeader
            title="ĐẤU SỰ NGHIỆP · NGOẠI HẠNG ANH"
            subtitle={`Mùa giải ${season.seasonNumber} · ${
              season.currentMatchday <= 38
                ? `Vòng ${season.currentMatchday}/38`
                : 'Đã hoàn thành 38/38 vòng'
            } · Hạng #${userRank}/20`}
            user={user}
            onBack={onClose}
            onGoHome={onGoHome || onClose}
            onClickTickets={onGoToTickets}
          />

          {/* Border-Divided Sub-Nav Tabs (Sharp Corners, No Logos) */}
          <div className="relative z-20 grid grid-cols-1 sm:grid-cols-3 divide-x divide-y sm:divide-y-0 divide-white/25 border-b border-white/25 bg-slate-950/90 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundService.playTabSwitch();
                setHubTab('standings');
              }}
              className={`py-2.5 px-3 rounded-none text-xs font-cruyff font-black uppercase tracking-wider transition-colors cursor-pointer relative ${
                hubTab === 'standings'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>BẢNG XẾP HẠNG (20 CLB)</span>
              {hubTab === 'standings' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedFixtureRound(Math.min(38, season.currentMatchday));
                setHubTab('fixtures');
              }}
              className={`py-2.5 px-3 rounded-none text-xs font-cruyff font-black uppercase tracking-wider transition-colors cursor-pointer relative ${
                hubTab === 'fixtures'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>LỊCH 38 VÒNG ĐẤU</span>
              {hubTab === 'fixtures' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playTabSwitch();
                setHubTab('rewards');
              }}
              className={`py-2.5 px-3 rounded-none text-xs font-cruyff font-black uppercase tracking-wider transition-colors cursor-pointer relative ${
                hubTab === 'rewards'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>THƯỞNG GIẢI ĐẤU</span>
              {hubTab === 'rewards' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          </div>

          {/* Main Career Content Split */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">
              {/* LEFT 7 COLUMNS: STANDINGS / 38 FIXTURES / SEASON REWARDS INSIDE UPLOADED STADIUM FRAME */}
              <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-cyan-300/40 shadow-2xl flex flex-col min-h-[480px]">
                {/* Khung Bảng Xếp Hạng (/assets/aistudio/default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_LEF_3994f18d.png) */}
                <img
                  src="/assets/aistudio/default_KEYMATCHCUSTOM_LARGEPOPUP_TEAMBG_LEF_3994f18d.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                />
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none" />

                {hubTab === 'standings' && (
                  <div className="relative z-10 flex flex-col h-full p-4 sm:p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-2">
                      <div>
                        <h2 className="font-cruyff font-black text-lg sm:text-xl text-white uppercase italic">
                          BẢNG XẾP HẠNG PREMIER LEAGUE (38 VÒNG)
                        </h2>
                        <p className="text-xs text-slate-300">
                          Top 4 dự Champions League · Hạng 18–20 nhóm cuối bảng
                        </p>
                      </div>
                      <span className="font-mono text-xs text-cyan-300 font-bold">
                        Đã đấu {Math.min(38, season.currentMatchday - 1)}/38 trận
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 max-h-[58vh]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-950/95 text-slate-300 uppercase border-b border-white/15 z-10">
                          <tr>
                            <th className="py-2 px-2 w-8">#</th>
                            <th className="py-2 px-2">Câu lạc bộ</th>
                            <th className="py-2 px-1.5 text-center font-mono text-amber-300">OVR</th>
                            <th className="py-2 px-1.5 text-center font-mono">ST</th>
                            <th className="py-2 px-1.5 text-center font-mono">T</th>
                            <th className="py-2 px-1.5 text-center font-mono">H</th>
                            <th className="py-2 px-1.5 text-center font-mono">B</th>
                            <th className="py-2 px-1.5 text-center font-mono">HS</th>
                            <th className="py-2 px-2 text-right font-mono text-yellow-300">ĐIỂM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {sortedStandings.map((row, idx) => {
                            const rank = idx + 1;
                            const club = clubMap.get(row.clubId);
                            const isUser = row.clubId === USER_CLUB_ID;
                            const gd = row.gf - row.ga;
                            const clubOvr = isUser ? user.ovr : club?.ovr || 78;

                            const rankTextColor =
                              rank === 1
                                ? 'text-yellow-300 font-black'
                                : rank <= 4
                                ? 'text-cyan-300 font-bold'
                                : rank >= 18
                                ? 'text-rose-400 font-bold'
                                : 'text-slate-300';

                            return (
                              <tr
                                key={row.clubId}
                                className={`transition-colors ${
                                  isUser
                                    ? 'bg-cyan-500/20 font-bold text-white'
                                    : 'hover:bg-white/5 text-slate-200'
                                }`}
                              >
                                <td className={`py-2 px-2 font-mono ${rankTextColor}`}>{rank}</td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={club?.badgeUrl}
                                      alt={club?.name || ''}
                                      referrerPolicy="no-referrer"
                                      className="w-5 h-5 object-contain shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <span className="truncate max-w-[130px] sm:max-w-[180px]">
                                      {club?.name}
                                    </span>
                                    {isUser && (
                                      <span className="text-[10px] text-yellow-300 uppercase font-bold">
                                        · CLB Bạn
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-1.5 text-center font-mono font-bold text-amber-300 tabular-nums">
                                  {clubOvr}
                                </td>
                                <td className="py-2 px-1.5 text-center font-mono tabular-nums">{row.played}</td>
                                <td className="py-2 px-1.5 text-center font-mono text-emerald-300 tabular-nums">{row.won}</td>
                                <td className="py-2 px-1.5 text-center font-mono text-slate-300 tabular-nums">{row.drawn}</td>
                                <td className="py-2 px-1.5 text-center font-mono text-rose-300 tabular-nums">{row.lost}</td>
                                <td className="py-2 px-1.5 text-center font-mono tabular-nums">
                                  {gd > 0 ? `+${gd}` : gd}
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-yellow-300 text-sm tabular-nums">
                                  {row.points}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {hubTab === 'fixtures' && (
                  <div className="relative z-10 flex flex-col h-full p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/15 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-300" />
                        <h2 className="font-cruyff font-black text-lg text-white uppercase italic">
                          LỊCH THI ĐẤU VÒNG {selectedFixtureRound} / 38
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedFixtureRound((r) => Math.max(1, r - 1))}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                        >
                          Trước
                        </button>
                        <select
                          value={selectedFixtureRound}
                          onChange={(e) => setSelectedFixtureRound(Number(e.target.value))}
                          className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-xs text-white font-mono"
                        >
                          {Array.from({ length: 38 }, (_, i) => i + 1).map((r) => (
                            <option key={r} value={r}>
                              Vòng {r}/38
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setSelectedFixtureRound((r) => Math.min(38, r + 1))}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                        >
                          Sau
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[56vh]">
                      {(season.fixtures[selectedFixtureRound - 1] || []).map((fix, idx) => {
                        const home = clubMap.get(fix.homeClubId);
                        const away = clubMap.get(fix.awayClubId);
                        const involvesUser =
                          fix.homeClubId === USER_CLUB_ID || fix.awayClubId === USER_CLUB_ID;

                        return (
                          <div
                            key={`${fix.matchday}_${idx}`}
                            className={`px-3 py-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              involvesUser
                                ? 'bg-cyan-500/20 border-cyan-400/50 text-white'
                                : 'bg-slate-900/75 border-white/10 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 w-[42%] justify-end text-right">
                              <span className="font-bold truncate">{home?.name}</span>
                              <img
                                src={home?.badgeUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>

                            <div className="w-[16%] text-center font-mono font-bold">
                              {fix.played ? (
                                <span className="px-2 py-0.5 rounded bg-black/60 text-yellow-300">
                                  {fix.homeGoals} - {fix.awayGoals}
                                </span>
                              ) : (
                                <span className="text-slate-400">VS</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 w-[42%] justify-start">
                              <img
                                src={away?.badgeUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <span className="font-bold truncate">{away?.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hubTab === 'rewards' && (
                  <div className="relative z-10 flex flex-col h-full p-4 sm:p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-3">
                      <div className="flex items-center gap-2.5">
                        <RewardGiftBoxIcon className="w-9 h-9" />
                        <div>
                          <h2 className="font-cruyff font-black text-lg text-white uppercase italic">
                            CƠ CẤU GIẢI THƯỞNG MÙA GIẢI PREMIER LEAGUE
                          </h2>
                          <p className="text-xs text-slate-300">
                            Trao thưởng tổng kết sau khi khép lại đủ 38 vòng đấu
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto pr-1">
                      {SEASON_REWARD_TIERS.map((tier) => (
                        <div
                          key={tier.title}
                          className="p-3.5 rounded-xl bg-slate-900/85 border border-white/15 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <div className={`font-cruyff font-black text-base uppercase ${tier.badgeColor}`}>
                              {tier.rankRange} · {tier.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              Phần thưởng tổng kết mùa giải Ngoại Hạng Anh
                            </div>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-xs font-bold">
                            <span className="text-yellow-300">+{tier.coins.toLocaleString('vi-VN')} Xu</span>
                            <span className="text-rose-300">+{tier.gems.toLocaleString('vi-VN')} Gems</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT 5 COLUMNS: NEXT MATCHUP CLUB FRAMES + REWARD PREVIEW + PLAY BUTTON */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                {season.currentMatchday <= 38 ? (
                  <>
                    {/* Matchday Fixture Card with the 2 Uploaded Club Frames */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/85 border border-cyan-400/35 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div>
                          <span className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
                            TRẬN ĐẤU TIẾP THEO · VÒNG {season.currentMatchday}/38
                          </span>
                          <h3 className="font-cruyff font-black text-lg text-white uppercase italic">
                            {isUserHome ? user.teamName : opponentClub.name} · Sân {isUserHome ? 'Nhà' : opponentClub.stadium}
                          </h3>
                        </div>
                        <span className="font-mono text-xs text-yellow-300 font-bold">
                          45 GIÂY / TRẬN
                        </span>
                      </div>

                      {/* Two Club Frames using /assets/aistudio/myteam_FRAME_CLUB_9d6af476.png */}
                      <div className="grid grid-cols-11 gap-2 items-center">
                        {/* YOUR CLUB FRAME */}
                        <div className="col-span-5 relative rounded-xl overflow-hidden p-3.5 flex flex-col items-center text-center min-h-[168px] justify-between border border-cyan-400/40">
                          <img
                            src="/assets/aistudio/myteam_FRAME_CLUB_9d6af476.png"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          />
                          <span className="relative z-10 text-[10px] font-bold uppercase text-cyan-300">
                            CLB CỦA BẠN
                          </span>
                          <img
                            src={user.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                            alt={user.teamName}
                            referrerPolicy="no-referrer"
                            className="relative z-10 w-14 h-14 object-contain my-1.5 drop-shadow-md"
                          />
                          <div className="relative z-10">
                            <div className="font-cruyff font-black text-sm text-white uppercase truncate max-w-[120px]">
                              {user.teamName}
                            </div>
                            <div className="font-mono text-xs font-bold text-yellow-300 mt-0.5">
                              OVR {user.ovr} · Hạng #{userRank}
                            </div>
                          </div>
                        </div>

                        {/* VS Divider */}
                        <div className="col-span-1 flex flex-col items-center justify-center">
                          <span className="font-cruyff font-black text-lg text-yellow-400 italic">
                            VS
                          </span>
                        </div>

                        {/* OPPONENT CLUB FRAME */}
                        <div className="col-span-5 relative rounded-xl overflow-hidden p-3.5 flex flex-col items-center text-center min-h-[168px] justify-between border border-cyan-400/40">
                          <img
                            src="/assets/aistudio/myteam_FRAME_CLUB_9d6af476.png"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          />
                          <span className="relative z-10 text-[10px] font-bold uppercase text-rose-300">
                            CLB ĐỐI THỦ
                          </span>
                          {opponentClub.badgeUrl ? (
                            <img
                              src={opponentClub.badgeUrl}
                              alt={opponentClub.name}
                              referrerPolicy="no-referrer"
                              className="relative z-10 w-14 h-14 object-contain my-1.5 drop-shadow-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className="relative z-10">
                            <div className="font-cruyff font-black text-sm text-white uppercase truncate max-w-[120px]">
                              {opponentClub.name}
                            </div>
                            <div className="font-mono text-xs font-bold text-amber-300 mt-0.5">
                              OVR {opponentClub.ovr} · {opponentClub.starPlayer}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* OVR Power Balance Meter */}
                      <div className="p-3 rounded-xl bg-black/55 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono font-bold tabular-nums">
                          <span className="text-cyan-300">SỨC MẠNH BẠN: OVR {user.ovr}</span>
                          <span
                            className={
                              user.ovr > opponentClub.ovr + 2
                                ? 'text-emerald-400'
                                : user.ovr < opponentClub.ovr - 2
                                ? 'text-rose-400'
                                : 'text-yellow-300'
                            }
                          >
                            {user.ovr > opponentClub.ovr + 2
                              ? `ƯU THẾ +${user.ovr - opponentClub.ovr} OVR`
                              : user.ovr < opponentClub.ovr - 2
                              ? `BẤT LỢI ${user.ovr - opponentClub.ovr} OVR`
                              : 'CÂN TÀI CÂN SỨC'}
                          </span>
                          <span className="text-rose-300">ĐỐI THỦ: OVR {opponentClub.ovr}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-rose-950/90 overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                            style={{
                              width: `${clamp(50 + (user.ovr - opponentClub.ovr) * 2.5, 18, 82)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>
                            Sơ đồ: <strong className="text-white">{activeFormation.name}</strong>
                          </span>
                          <span className="text-slate-400">
                            OVR &amp; Phong cách chơi quyết định cầm bóng &amp; ghi bàn
                          </span>
                        </div>
                      </div>

                      {/* Playstyle Matchup & Quick Selector */}
                      <div className="p-3 rounded-xl bg-black/65 border border-yellow-400/35 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={activeUserPlayStyle.iconUrl}
                              alt={activeUserPlayStyle.name}
                              className="w-8 h-8 object-contain shrink-0"
                            />
                            <div className="min-w-0 text-xs">
                              <span className="text-yellow-300 font-bold uppercase block truncate">
                                Bạn: {activeUserPlayStyle.name}
                              </span>
                              <span
                                className={`text-[11px] block truncate ${
                                  careerStyleMatchup.advantage === 'user'
                                    ? 'text-emerald-300 font-semibold'
                                    : careerStyleMatchup.advantage === 'opp'
                                    ? 'text-rose-300 font-semibold'
                                    : 'text-slate-300'
                                }`}
                              >
                                {careerStyleMatchup.summaryText}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-right text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Đối thủ</span>
                              <span className="text-rose-300 font-bold uppercase">
                                {oppPlayStyle.shortName}
                              </span>
                            </div>
                            <img
                              src={oppPlayStyle.iconUrl}
                              alt={oppPlayStyle.name}
                              className="w-7 h-7 object-contain"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-1">
                          {TACTICAL_PLAYSTYLES.map((st) => {
                            const isCur = st.id === activeUserPlayStyle.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleSelectCareerPlayStyle(st.id)}
                                title={`${st.name}: ${st.tagline}`}
                                className={`py-1.5 px-1 rounded-lg border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                                  isCur
                                    ? 'bg-yellow-400 text-slate-950 border-yellow-200 font-black'
                                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-yellow-400/40'
                                }`}
                              >
                                <img
                                  src={st.iconUrl}
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                />
                                <span className="text-[9px] font-cruyff uppercase truncate max-w-full">
                                  {st.shortName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Match Reward Preview Box */}
                    <div className="p-4 rounded-2xl bg-slate-950/85 border border-yellow-400/35 flex items-center gap-3.5">
                      <RewardGiftBoxIcon className="w-12 h-12 shrink-0" />
                      <div className="flex-1 text-xs space-y-1">
                        <div className="font-cruyff font-black text-sm text-yellow-300 uppercase">
                          THƯỞNG TRẬN ĐẤU VÒNG {season.currentMatchday}
                        </div>
                        <div className="text-slate-200 font-mono">
                          Thắng: +
                          {(opponentClub.ovr >= 84 + CAREER_OPPONENT_OVR_BOOST
                            ? 140000
                            : 85000
                          ).toLocaleString('vi-VN')}{' '}
                          Xu · +{opponentClub.ovr >= 84 + CAREER_OPPONENT_OVR_BOOST ? 220 : 140} Gems
                        </div>
                        <div className="text-slate-400">
                          Hòa: +
                          {(opponentClub.ovr >= 84 + CAREER_OPPONENT_OVR_BOOST
                            ? 65000
                            : 40000
                          ).toLocaleString('vi-VN')}{' '}
                          Xu &amp; {opponentClub.ovr >= 84 + CAREER_OPPONENT_OVR_BOOST ? 90 : 60} Gems ·
                          Thưởng thêm +12,000 Xu mỗi bàn thắng!
                        </div>
                      </div>
                    </div>

                    {/* Play & Match Skip Pass Controls */}
                    <div className="flex flex-col items-center pt-1 gap-2.5">
                      <CareerPlayButton
                        label="CHƠI"
                        onClick={handleStartMatch}
                        className="w-full max-w-xs"
                      />

                      <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUseMatchSkipPass}
                          className={`flex-1 w-full py-2.5 px-4 rounded-xl border-2 font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer tabular-nums ${
                            (user.matchSkipPasses ?? 0) >= 1
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-950 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-amber-400/50'
                          }`}
                        >
                          <img
                            src="/assets/aistudio/currencysmall_passticket_75e07c6d.png"
                            alt="Vé Pass"
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span>PASS TRẬN ĐẤU (1 VÉ)</span>
                          <span className="px-2 py-0.5 rounded bg-black/25 text-[10px] font-mono">
                            Có: {user.matchSkipPasses ?? 0}
                          </span>
                        </button>

                        {(user.matchSkipPasses ?? 0) < 1 && onOpenShop && (
                          <button
                            type="button"
                            onClick={() => {
                              soundService.playClick();
                              onOpenShop();
                            }}
                            className="py-2.5 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] uppercase whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                          >
                            <img
                              src="/assets/aistudio/currencysmall_passticket_75e07c6d.png"
                              alt="Vé Pass"
                              className="w-4 h-4 object-contain"
                            />
                            Mua Vé (1.000 Gems)
                          </button>
                        )}
                      </div>

                      {passNotice && (
                        <div className="w-full px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-200 text-xs font-bold flex items-center justify-between gap-2">
                          <span>{passNotice}</span>
                          {onOpenShop && (
                            <button
                              type="button"
                              onClick={() => {
                                soundService.playClick();
                                onOpenShop();
                              }}
                              className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase shrink-0 cursor-pointer"
                            >
                              Mở Cửa Hàng
                            </button>
                          )}
                        </div>
                      )}

                      <span className="text-[11px] text-slate-400 text-center">
                        45 giây/trận · Điều chỉnh chiến thuật, HLV & thay cầu thủ trực tiếp mỗi giây
                      </span>
                    </div>
                  </>
                ) : (
                  /* SEASON COMPLETED (38/38 MATCHES PLAYED) */
                  <div className="p-6 rounded-2xl bg-slate-950/90 border border-yellow-400/60 shadow-2xl flex flex-col items-center text-center gap-4 my-auto">
                    <RewardGiftBoxIcon className="w-20 h-20" />
                    <div>
                      <span className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
                        TỔNG KẾT MÙA GIẢI {season.seasonNumber} (38/38 VÒNG)
                      </span>
                      <h3 className="font-cruyff font-black text-2xl sm:text-3xl text-yellow-300 uppercase italic mt-1">
                        HẠNG CHUNG CUỘC: #{userRank} / 20
                      </h3>
                      <p className="text-sm text-slate-200 mt-1">
                        {getSeasonRewardForRank(userRank).title} · Tổng bàn thắng: {season.totalGoalsScored}
                      </p>
                    </div>

                    <div className="w-full p-4 rounded-xl bg-white/5 border border-yellow-400/30 space-y-1.5 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Tiền thưởng mùa giải:</span>
                        <span className="text-yellow-300 font-bold">
                          +{getSeasonRewardForRank(userRank).coins.toLocaleString('vi-VN')} Xu
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Kim Cương:</span>
                        <span className="text-rose-300 font-bold">
                          +{getSeasonRewardForRank(userRank).gems.toLocaleString('vi-VN')} Gems
                        </span>
                      </div>
                    </div>

                    <CompletePillButton
                      label="NHẬN THƯỞNG & SANG MÙA MỚI"
                      onClick={handleClaimSeasonEndAndAdvance}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SCREEN 2: LIVE 45-SECOND 11v11 TACTICAL MATCH                         */}
      {/* ===================================================================== */}
      {screen === 'match' && (
        <div
          className="relative w-full h-full flex flex-col justify-between overflow-hidden p-2.5 sm:p-4 gap-2.5"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, #000A47 0%, #001B8F 58%, #0028BD 100%)',
          }}
        >
          {/* TOP SCOREBOARD & 45-SECOND TIMER HUD */}
          <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-slate-950/85 border border-white/15 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase text-cyan-300">
                PREMIER LEAGUE · VÒNG {season.currentMatchday}/38
              </span>
            </div>

            {/* Center Scoreboard with Live OVR Comparison */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={user.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                  alt={user.teamName}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 object-contain"
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
                    {opponentClub.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-amber-300 tabular-nums">
                    OVR {opponentClub.ovr}
                  </span>
                </div>
                {opponentClub.badgeUrl ? (
                  <img
                    src={opponentClub.badgeUrl}
                    alt={opponentClub.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
            </div>

            {/* 45s Real-Time Countdown + Match Minute + Live Skip Pass */}
            <div className="flex items-center gap-2">
              {(user.matchSkipPasses ?? 0) >= 1 && (
                <button
                  type="button"
                  onClick={handleUseMatchSkipPass}
                  title="Dùng 1 Vé Pass Trận Đấu để thắng nhanh & nhận trọn thưởng"
                  className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer tabular-nums"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Pass ({user.matchSkipPasses})</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-400/20 border border-yellow-400/60 font-mono text-xs sm:text-sm font-bold text-yellow-300">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>{currentMatchMinute}&apos;</span>
                <span>·</span>
                <span>Còn {secondsLeft}s</span>
              </div>
            </div>
          </header>

          {/* MAIN WORKSPACE: 11v11 PITCH (LEFT 8 COLS) + CORNER COMMENTATOR & PLAYER CARD (RIGHT 4 COLS) */}
          <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
            {/* 11v11 INTERACTIVE FOOTBALL PITCH */}
            <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-emerald-900 min-h-[300px]">
              {/* Alternating Mowed Grass Stripes */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #146c43 0%, #146c43 10%, #198754 10%, #198754 20%)',
                }}
              />

              {/* Official Pitch Markings (Penalty Boxes Strictly Highlighted for Goalkeepers) */}
              <div className="absolute inset-3 border-2 border-white/70 pointer-events-none">
                {/* Halfway Line & Center Circle */}
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-28 sm:h-28 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />

                {/* Left Penalty Area (User GK Zone: x <= 16%, y 28%..72%) */}
                <div className="absolute left-0 top-[26%] bottom-[26%] w-[15%] border-y-2 border-r-2 border-white/75 bg-emerald-950/15" />
                <div className="absolute left-0 top-[38%] bottom-[38%] w-[6%] border-y-2 border-r-2 border-white/60" />

                {/* Right Penalty Area (Opponent GK Zone: x >= 84%, y 28%..72%) */}
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
                      {goalBanner.side === 'user' ? user.teamName : opponentClub.name} · {goalBanner.scorer}
                    </div>
                  </div>
                </div>
              )}

              {/* 11 OPPONENT PLAYERS (RED/WHITE MARKERS) */}
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
                    {ent.pos}
                  </div>
                  <span className="mt-0.5 px-1 rounded bg-black/75 text-[9px] text-rose-100 font-semibold whitespace-nowrap leading-tight">
                    {ent.shortName}
                  </span>
                </div>
              ))}

              {/* 11 USER PLAYERS (ROYAL BLUE / CYAN MARKERS + STAMINA BAR) */}
              {userEntities.map((ent, idx) => (
                <button
                  type="button"
                  key={ent.id}
                  onClick={() => {
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
                    {ent.pos}
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

            {/* CORNER PANEL: LIVE COMMENTATOR + CAREER PLAYER STATS CARD DIRECTLY BELOW */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 min-h-0">
              {/* Top: Corner Live Commentator */}
              <div className="flex-1 rounded-2xl bg-slate-950/90 border border-cyan-400/35 p-3.5 flex flex-col min-h-[175px] overflow-hidden shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-yellow-400" />
                    <span className="font-cruyff font-black text-sm text-white uppercase italic tracking-wide">
                      BÌNH LUẬN VIÊN TRỰC TIẾP
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-300 font-bold">
                    LIVE · {currentMatchMinute}&apos;
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mt-2.5 pr-1">
                  {commentary.map((line, idx) => (
                    <div
                      key={line.id}
                      className={`p-2 rounded-lg text-xs leading-snug ${
                        idx === 0
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

              {/* Directly Below Commentator: Career Player & Live Stats Banner */}
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
            </div>
          </div>

          {/* BOTTOM LIVE TACTICAL DECK & "THAY CẦU THỦ" BUTTON */}
          <footer className="relative z-20 px-3 sm:px-4 py-2 rounded-2xl bg-slate-950/90 border border-white/15 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* 0. Live Tactical Playstyle Switcher (5 Golden Emblems) */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[10px] text-yellow-300 font-bold uppercase mr-0.5 hidden xl:inline">
                Phong cách:
              </span>
              {TACTICAL_PLAYSTYLES.map((st) => {
                const isCur = st.id === activeUserPlayStyle.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectCareerPlayStyle(st.id)}
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
                  onClick={() => handleChangeMentality(m.id)}
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

            {/* 2. Pressing & Focus */}
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
                  onClick={() => {
                    soundService.playClick();
                    setPressing(p.id);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap ${
                    pressing === p.id
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              {/* Quick Formation Switcher */}
              <select
                value={matchFormation.id}
                onChange={(e) => handleChangeFormationInMatch(e.target.value)}
                aria-label="Đổi sơ đồ chiến thuật trực tiếp"
                className="bg-slate-900 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-yellow-300 font-bold"
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
              subCountText={`${5 - subsUsed}/5`}
              disabled={subsUsed >= 5}
              onClick={() => {
                soundService.playClick();
                if (selectedPitchIdx === null) setSelectedPitchIdx(1);
                setShowSubDrawer(true);
              }}
            />
          </footer>

          {/* LIVE SUBSTITUTION MODAL DRAWER (PAUSES 45s CLOCK CLEANLY WHILE OPEN) */}
          {showSubDrawer && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-yellow-400/50 p-5 shadow-2xl flex flex-col max-h-[86vh]">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div>
                    <h3 className="font-cruyff font-black text-xl text-white uppercase italic">
                      THAY CẦU THỦ TRỰC TIẾP ({subsUsed}/5 LƯỢT ĐÃ DÙNG)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Đồng hồ trận đấu đang tạm dừng · Chọn 1 cầu thủ trên sân và 1 cầu thủ dự bị để thay người
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSubDrawer(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
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
                                    {matchFormation.slots[idx]?.pos}
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
                          disabled={selectedPitchIdx === null || subsUsed >= 5}
                          onClick={() => handleConfirmSubstitution(bIdx)}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-yellow-400/20 border border-white/15 hover:border-yellow-400 text-left flex items-center justify-between gap-2.5 text-xs transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0">
                              <FCCard player={bPlayer} size="pitch" showStats={false} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">
                                <span className="font-mono text-yellow-300 mr-1.5">{bPlayer.position}</span>
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

      {/* ===================================================================== */}
      {/* SCREEN 3: POST-MATCH REWARDS & "HOÀN THÀNH"                           */}
      {/* ===================================================================== */}
      {screen === 'post_match' && lastMatchRewards && (
        <div
          className="relative w-full h-full flex items-center justify-center p-4 overflow-y-auto"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, #001B8F 0%, #020617 75%)',
          }}
        >
          <div className="w-full max-w-xl rounded-3xl bg-slate-950/95 border border-cyan-300/40 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5">
            <RewardGiftBoxIcon className="w-20 h-20" />

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                KẾT THÚC TRẬN ĐẤU · VÒNG {season.currentMatchday - 1}/38 PREMIER LEAGUE
              </span>
              <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-yellow-300 uppercase italic mt-1">
                {lastMatchRewards.label}
              </h2>
              <p className="text-xs text-slate-300 mt-1">{lastMatchRewards.bonusNote}</p>
            </div>

            {/* Final Score Box */}
            <div className="w-full py-4 px-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around">
              <div className="flex flex-col items-center">
                <img
                  src={user.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                  alt={user.teamName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 object-contain mb-1"
                />
                <span className="font-bold text-xs text-white uppercase">{user.teamName}</span>
              </div>

              <div className="font-mono font-black text-3xl sm:text-4xl text-yellow-300">
                {userScore} - {oppScore}
              </div>

              <div className="flex flex-col items-center">
                {opponentClub.badgeUrl ? (
                  <img
                    src={opponentClub.badgeUrl}
                    alt={opponentClub.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 object-contain mb-1"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="font-bold text-xs text-white uppercase">{opponentClub.name}</span>
              </div>
            </div>

            {/* Earned Rewards List */}
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-yellow-400/30 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                    alt="Coins"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-slate-200 font-semibold">Tiền thưởng trận đấu</span>
                </div>
                <span className="font-mono font-bold text-yellow-300">
                  +{lastMatchRewards.coins.toLocaleString('vi-VN')} Xu
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                    alt="Gems"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-slate-200 font-semibold">Kim Cương</span>
                </div>
                <span className="font-mono font-bold text-rose-300">
                  +{lastMatchRewards.gems.toLocaleString('vi-VN')} Gems
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/aistudio/logo_star_pass_02de823e.png"
                    alt="Star Pass"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-cyan-200 font-bold">Điểm chuỗi Star Pass</span>
                </div>
                <span className="font-mono font-black text-cyan-300 tabular-nums">
                  +{lastEarnedStarPoints.toLocaleString('vi-VN')} Star Point
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-cyan-300">
                <span>Vị trí hiện tại trên BXH Premier League:</span>
                <strong className="font-mono text-sm tabular-nums">Hạng #{userRank} / 20</strong>
              </div>
            </div>

            {/* Pale Mint "HOÀN THÀNH" Button */}
            <CompletePillButton
              label="HOÀN THÀNH"
              onClick={() => {
                soundService.playClick();
                setScreen('hub');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
