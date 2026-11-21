import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Award,
  Users,
  ChevronRight,
  Zap,
  ArrowLeftRight,
  Sliders,
  Sparkles,
  Check,
  Compass,
  CheckCircle2,
  PackageOpen,
  Dumbbell,
  TrendingUp,
  Clock,
  Crown,
  ShieldAlert,
  ShieldCheck,
  Swords,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { PixelPlayerCardPanel } from './PixelPlayerCardPanel';
import {
  PlayerCard,
  FormationConfig,
  TeamTactics,
  SetPieceRoles,
  ClubDailyProgress,
  ClubKeyMatchHistoryEntry,
  TacticalPlayStyleId,
  UserProfile,
  ManagerConfig,
  ManagerTierId,
} from '../types/game';
import { availableFormations } from '../data/formationsData';
import {
  TACTICAL_PLAYSTYLES,
  PLAYSTYLE_MAP,
  getPlayStyleDef,
} from '../data/playStylesData';
import {
  MANAGER_CATALOG,
  MANAGER_CARD_FRAME_URL,
  MANAGER_CONTRACT_OPTIONS,
  MANAGER_TIER_META,
  getManagerContractGemCost,
  evaluateManagerBonus,
  formatRemainingContract,
} from '../data/managersData';
import {
  computeSquadOvr,
  getCanonicalPlayerNameKey,
  getEffectiveStarterOvr,
  getOwnedCopyCountMap,
  getPositionPenalty,
  WRONG_POSITION_OVR_PENALTY,
} from '../utils/squadUtils';
import { FCCard } from './FCCard';
import { ClubKeyMatchSection } from './ClubKeyMatchSection';
import { TopSectionHeader } from './TopSectionHeader';
import { DAILY_MAX_CLUB_MATCHES } from '../data/clubKeyMatchData';
import { getDaily6AMCycleKey, normalizeClubDaily } from '../utils/dateUtils';

export const MAX_TRAINING_LEVEL = 200;

export const getSingleTrainingCost = (currentLevel: number): number => {
  return (20000 + currentLevel * 8000) * 6 * 5;
};

export const getMultiTrainingCost = (currentLevel: number, count: number): number => {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getSingleTrainingCost(currentLevel + i);
  }
  return total;
};

export type MyTeamTabId = 'lineup' | 'club' | 'training' | 'tactics' | 'roles';

interface MyTeamModalProps {
  onClose: () => void;
  user?: UserProfile;
  initialTab?: MyTeamTabId;
  userTeamName?: string;
  teamOvr: number;
  userCoins: number;
  clubTokens?: number;
  userTickets?: number;
  clubDaily?: ClubDailyProgress;
  ownedPlayerIds?: string[];
  trainingLevel: number;
  ownedPlayers: PlayerCard[];
  initialStarters: PlayerCard[];
  initialBench: PlayerCard[];
  activeFormationId: string;
  onSaveSquad: (
    starters: PlayerCard[],
    bench: PlayerCard[],
    formationId: string,
    newTeamOvr: number
  ) => void;
  onUpgradeTraining: (
    nextTrainingLevel: number,
    coinCost: number,
    newTeamOvr: number
  ) => void;
  onUpdateUser?: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onCompleteClubMatch?: (entry: ClubKeyMatchHistoryEntry) => void;
  onExchangeClubReward?: (
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
  playStyle?: TacticalPlayStyleId;
  onSelectPlayStyle?: (style: TacticalPlayStyleId) => void;
}

type SquadSlotTarget = {
  type: 'starter' | 'bench' | 'reserve';
  index: number;
  player: PlayerCard;
};

export const MyTeamModal: React.FC<MyTeamModalProps> = ({
  onClose,
  user,
  initialTab = 'lineup',
  userTeamName = 'FC Mobile VN',
  teamOvr: initialTeamOvr,
  userCoins,
  clubTokens = 0,
  userTickets = 0,
  clubDaily,
  ownedPlayerIds,
  trainingLevel,
  ownedPlayers,
  initialStarters,
  initialBench,
  activeFormationId,
  onSaveSquad,
  onUpgradeTraining,
  onUpdateUser,
  onCompleteClubMatch,
  onExchangeClubReward,
  playStyle,
  onSelectPlayStyle,
}) => {
  const [activeTab, setActiveTab] = useState<MyTeamTabId>(initialTab);
  const [selectedPlayStyleId, setSelectedPlayStyleId] = useState<TacticalPlayStyleId>(
    () => getPlayStyleDef(playStyle ?? user?.playStyle).id
  );
  const activePlayStyle = useMemo(
    () => getPlayStyleDef(selectedPlayStyleId),
    [selectedPlayStyleId]
  );

  const handlePickPlayStyle = (nextId: TacticalPlayStyleId) => {
    soundService.playClick();
    setSelectedPlayStyleId(nextId);
    onSelectPlayStyle?.(nextId);
    const def = getPlayStyleDef(nextId);
    showToast(`Đã kích hoạt Phong Cách Chơi: ${def.name}`);
  };

  const normalizedClubDaily = useMemo(
    () => normalizeClubDaily(clubDaily, getDaily6AMCycleKey()),
    [clubDaily]
  );
  const remainingClubMatches = Math.max(
    0,
    DAILY_MAX_CLUB_MATCHES - normalizedClubDaily.matchesPlayed
  );
  const resolvedOwnedIds = useMemo(
    () => ownedPlayerIds ?? ownedPlayers.map((p) => p.id),
    [ownedPlayerIds, ownedPlayers]
  );

  // Active Formation from 19 available formations
  const [selectedFormation, setSelectedFormation] = useState<FormationConfig>(
    () => availableFormations.find((f) => f.id === activeFormationId) || availableFormations[0]
  );
  const [showFormationPicker, setShowFormationPicker] = useState<boolean>(false);
  const [formationFilter, setFormationFilter] = useState<'ALL' | 'Tấn công' | 'Cân bằng' | 'Phòng thủ'>('ALL');

  const [starters, setStarters] = useState<PlayerCard[]>(initialStarters);
  const [bench, setBench] = useState<PlayerCard[]>(initialBench);

  const ownedCopyCounts = useMemo(
    () => getOwnedCopyCountMap(resolvedOwnedIds),
    [resolvedOwnedIds]
  );

  // Reserves pool: owned copies not currently placed in starters or bench
  const { reserves, reserveSpareCounts, totalReserveCopies } = useMemo(() => {
    const usedCounts = new Map<string, number>();
    starters.forEach((s) => usedCounts.set(s.id, (usedCounts.get(s.id) ?? 0) + 1));
    bench.forEach((b) => usedCounts.set(b.id, (usedCounts.get(b.id) ?? 0) + 1));

    const spareMap = new Map<string, number>();
    const uniqueReserves: PlayerCard[] = [];
    const seen = new Set<string>();
    let totalSpare = 0;

    ownedPlayers.forEach((p) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      const totalOwned = ownedCopyCounts.get(p.id) ?? 1;
      const used = usedCounts.get(p.id) ?? 0;
      const spare = Math.max(0, totalOwned - used);
      if (spare > 0) {
        spareMap.set(p.id, spare);
        uniqueReserves.push(p);
        totalSpare += spare;
      }
    });

    uniqueReserves.sort((a, b) => b.ovr - a.ovr);
    return { reserves: uniqueReserves, reserveSpareCounts: spareMap, totalReserveCopies: totalSpare };
  }, [ownedPlayers, ownedCopyCounts, starters, bench]);

  const [swapSelection, setSwapSelection] = useState<SquadSlotTarget | null>(null);
  const [dragSource, setDragSource] = useState<SquadSlotTarget | null>(null);
  const dragSourceRef = useRef<SquadSlotTarget | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [selectedManagerTier, setSelectedManagerTier] = useState<'ALL' | ManagerTierId>('ALL');
  const [selectedContractDays, setSelectedContractDays] = useState<number>(7);
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNowTickMs(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const [inspectedPlayer, setInspectedPlayer] = useState<PlayerCard>(
    initialStarters[1] || initialStarters[0]
  );

  // Tactics State
  const [tactics, setTactics] = useState<TeamTactics>({
    mentality: 'balanced',
    speed: 2,
    passing: 2,
    positioning: 'free',
    crossing: 2,
    pressure: 2,
    aggression: 2,
    width: 2,
    offsideTrap: false,
  });

  // Roles State
  const [roles, setRoles] = useState<SetPieceRoles>(() => ({
    captainId: starters[1]?.id || starters[0]?.id,
    shortFreeKickId: starters[3]?.id || starters[0]?.id,
    longFreeKickId: starters[4]?.id || starters[0]?.id,
    penaltyId: starters[1]?.id || starters[0]?.id,
    leftCornerId: starters[4]?.id || starters[0]?.id,
    rightCornerId: starters[2]?.id || starters[0]?.id,
  }));

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const clampedTrainingLevel = Math.min(MAX_TRAINING_LEVEL, Math.max(0, trainingLevel));
  const isMaxTrainingLevel = clampedTrainingLevel >= MAX_TRAINING_LEVEL;
  const trainingOvrBonus = Math.floor(clampedTrainingLevel / 5);

  const squadOvrSummary = useMemo(
    () =>
      computeSquadOvr({
        starters,
        formation: selectedFormation,
        trainingLevel: clampedTrainingLevel,
        activeManager: user?.activeManager,
        playStyleId: selectedPlayStyleId,
        fallbackOvr: initialTeamOvr,
        nowMs: nowTickMs,
      }),
    [
      starters,
      selectedFormation,
      clampedTrainingLevel,
      user?.activeManager,
      selectedPlayStyleId,
      initialTeamOvr,
      nowTickMs,
    ]
  );

  const baseTeamOvr = squadOvrSummary.baseAvgOvr;
  const managerOvrBonus = squadOvrSummary.managerBonus.totalBonus;
  const currentTeamOvr = squadOvrSummary.totalOvr;

  const singleLevelCost = getSingleTrainingCost(clampedTrainingLevel);
  const stepsInCycle = isMaxTrainingLevel ? 5 : clampedTrainingLevel % 5;
  const levelsToNextOvr = isMaxTrainingLevel
    ? 0
    : Math.min(5 - stepsInCycle, MAX_TRAINING_LEVEL - clampedTrainingLevel);
  const milestoneCost =
    levelsToNextOvr > 0 ? getMultiTrainingCost(clampedTrainingLevel, levelsToNextOvr) : 0;

  const handleTrainLevels = (deltaLevels: number) => {
    if (clampedTrainingLevel >= MAX_TRAINING_LEVEL) {
      soundService.playClick();
      showToast(`Đã đạt cấp huấn luyện tối đa (Cấp ${MAX_TRAINING_LEVEL}/${MAX_TRAINING_LEVEL})!`);
      return;
    }
    const allowedDelta = Math.min(deltaLevels, MAX_TRAINING_LEVEL - clampedTrainingLevel);
    if (allowedDelta <= 0) return;

    const cost = getMultiTrainingCost(clampedTrainingLevel, allowedDelta);
    if (userCoins < cost) {
      soundService.playClick();
      showToast(
        `Không đủ Xu! Cần ${cost.toLocaleString('vi-VN')} Xu (Hiện có ${userCoins.toLocaleString('vi-VN')} Xu).`
      );
      return;
    }
    const nextLevel = Math.min(MAX_TRAINING_LEVEL, clampedTrainingLevel + allowedDelta);
    const nextBonus = Math.floor(nextLevel / 5);
    const nextOvr = baseTeamOvr + nextBonus + managerOvrBonus;

    if (nextLevel >= MAX_TRAINING_LEVEL) {
      soundService.playPackOpenFanfare();
      showToast(
        `Đạt Cấp Huấn Luyện Tối Đa ${MAX_TRAINING_LEVEL}/${MAX_TRAINING_LEVEL}! Toàn đội tăng tối đa +${nextBonus} OVR (Team OVR ${nextOvr})!`
      );
    } else if (nextBonus > trainingOvrBonus) {
      soundService.playPackOpenFanfare();
      showToast(
        `Đột phá Huấn Luyện Cấp ${nextLevel}! Toàn đội tăng lên +${nextBonus} OVR (Team OVR ${nextOvr})!`
      );
    } else {
      soundService.playConfirmSelection();
      showToast(
        `Đã nâng Huấn Luyện Toàn Đội lên Cấp ${nextLevel}/${MAX_TRAINING_LEVEL} (Còn ${5 - (nextLevel % 5)} cấp nữa +1 OVR)!`
      );
    }
    onUpgradeTraining(nextLevel, cost, nextOvr);
  };

  // Total Team Chemistry calculation
  const totalChemistry = useMemo(() => {
    let matches = 0;
    starters.forEach((p, idx) => {
      const slotPos = selectedFormation.slots[idx]?.pos;
      if (slotPos === p.position) matches += 1;
      else if (
        (slotPos === 'CF' && p.position === 'ST') ||
        (slotPos === 'ST' && p.position === 'CF') ||
        (slotPos === 'LW' && p.position === 'LM') ||
        (slotPos === 'LM' && p.position === 'LW') ||
        (slotPos === 'RW' && p.position === 'RM') ||
        (slotPos === 'RM' && p.position === 'RW') ||
        (slotPos === 'LWB' && p.position === 'LB') ||
        (slotPos === 'RWB' && p.position === 'RB') ||
        (slotPos === 'CAM' && p.position === 'CM') ||
        (slotPos === 'CDM' && p.position === 'CM') ||
        (slotPos === 'CM' && (p.position === 'CAM' || p.position === 'CDM'))
      ) {
        matches += 0.85;
      } else {
        matches += 0.5;
      }
    });
    return Math.min(100, Math.round((matches / 11) * 100));
  }, [starters, selectedFormation]);

  const persistSquad = (
    nextStarters: PlayerCard[],
    nextBench: PlayerCard[],
    nextFormationId: string
  ) => {
    const nextForm =
      availableFormations.find((f) => f.id === nextFormationId) || selectedFormation;
    const summary = computeSquadOvr({
      starters: nextStarters,
      formation: nextForm,
      trainingLevel: clampedTrainingLevel,
      activeManager: user?.activeManager,
      playStyleId: selectedPlayStyleId,
      fallbackOvr: initialTeamOvr,
      nowMs: Date.now(),
    });
    onSaveSquad(nextStarters, nextBench, nextFormationId, summary.totalOvr);
  };

  // SHARED SWAPPING HELPER FOR BOTH CLICK-SWAP AND DRAG-AND-DROP
  const executePlayerSwap = (source: SquadSlotTarget, target: SquadSlotTarget) => {
    if (source.type === target.type && source.index === target.index) {
      setSwapSelection(null);
      return;
    }
    if (source.type === 'reserve' && target.type === 'reserve') {
      setSwapSelection(null);
      return;
    }

    const newStarters = [...starters];
    const newBench = [...bench];
    const player = target.player;
    const index = target.index;
    let toastMessage = '';

    if (source.type === 'starter' && target.type === 'starter') {
      const temp = newStarters[source.index];
      newStarters[source.index] = newStarters[index];
      newStarters[index] = temp;
      toastMessage = `Đã đổi vị trí: ${source.player.name} ⇄ ${player.name}`;
    } else if (source.type === 'starter' && target.type === 'bench') {
      newStarters[source.index] = bench[index];
      newBench[index] = source.player;
      toastMessage = `Thay người: ${player.name} (VÀO SÂN) ⇄ ${source.player.name} (DỰ BỊ)`;
    } else if (source.type === 'bench' && target.type === 'starter') {
      newBench[source.index] = starters[index];
      newStarters[index] = source.player;
      toastMessage = `Thay người: ${source.player.name} (VÀO SÂN) ⇄ ${player.name} (DỰ BỊ)`;
    } else if (source.type === 'bench' && target.type === 'bench') {
      const temp = newBench[source.index];
      newBench[source.index] = newBench[index];
      newBench[index] = temp;
      toastMessage = `Đã đổi vị trí dự bị: ${source.player.name} ⇄ ${player.name}`;
    } else if (source.type === 'starter' && target.type === 'reserve') {
      newStarters[source.index] = player;
      toastMessage = `Đưa vào sân: ${player.name} ⇄ ${source.player.name}`;
    } else if (source.type === 'reserve' && target.type === 'starter') {
      newStarters[index] = source.player;
      toastMessage = `Đưa vào sân: ${source.player.name} ⇄ ${player.name}`;
    } else if (source.type === 'bench' && target.type === 'reserve') {
      newBench[source.index] = player;
      toastMessage = `Đưa lên ghế dự bị: ${player.name} ⇄ ${source.player.name}`;
    } else if (source.type === 'reserve' && target.type === 'bench') {
      newBench[index] = source.player;
      toastMessage = `Đưa lên ghế dự bị: ${source.player.name} ⇄ ${player.name}`;
    }

    const seenStarterNames = new Set<string>();
    for (const st of newStarters) {
      if (!st) continue;
      const nameKey = getCanonicalPlayerNameKey(st);
      if (seenStarterNames.has(nameKey)) {
        soundService.playTrophy();
        showToast(
          `Không thể xếp 2 thẻ trùng tên (${st.name}) cùng lúc trong đội hình chính!`
        );
        setSwapSelection(null);
        return;
      }
      seenStarterNames.add(nameKey);
    }

    soundService.playConfirmSelection();
    if (toastMessage) {
      showToast(toastMessage);
    }

    setStarters(newStarters);
    setBench(newBench);
    setInspectedPlayer(target.type === 'starter' ? newStarters[index] : player);
    setSwapSelection(null);
    persistSquad(newStarters, newBench, selectedFormation.id);
  };

  // SWAPPING MECHANIC (Starter <-> Starter / Bench / Reserve)
  const handlePlayerSlotClick = (
    type: 'starter' | 'bench' | 'reserve',
    index: number,
    player: PlayerCard
  ) => {
    soundService.playSelection();
    setInspectedPlayer(player);

    if (!swapSelection) {
      setSwapSelection({ type, index, player });
      showToast(`Đã chọn: ${player.name} (${player.position}) — Chạm hoặc kéo thả để đổi!`);
      return;
    }

    if (swapSelection.type === type && swapSelection.index === index) {
      setSwapSelection(null);
      return;
    }

    executePlayerSwap(swapSelection, { type, index, player });
  };

  const handleCardDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    target: SquadSlotTarget
  ) => {
    dragSourceRef.current = target;
    setDragSource(target);
    setInspectedPlayer(target.player);
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify({ type: target.type, index: target.index, id: target.player.id })
      );
    } catch {
      // ignore dataTransfer restrictions in nested frames
    }
  };

  const handleCardDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    slotKey: string
  ) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      // ignore
    }
    if (dragOverKey !== slotKey) {
      setDragOverKey(slotKey);
    }
  };

  const handleCardDrop = (
    e: React.DragEvent<HTMLDivElement>,
    target: SquadSlotTarget
  ) => {
    e.preventDefault();
    setDragOverKey(null);
    const activeSrc = dragSourceRef.current || dragSource;
    dragSourceRef.current = null;
    setDragSource(null);
    if (!activeSrc) return;
    executePlayerSwap(activeSrc, target);
  };

  const handleCardDragEnd = () => {
    dragSourceRef.current = null;
    setDragSource(null);
    setDragOverKey(null);
  };

  const handleHireOrRenewManager = (mgr: ManagerConfig, days: number) => {
    const currentGems = user?.gems ?? 0;
    const gemCost = getManagerContractGemCost(mgr, days);
    if (currentGems < gemCost) {
      soundService.playClick();
      showToast(
        `Không đủ Kim Cương! Cần ${gemCost.toLocaleString('vi-VN')} Kim Cương để ký hợp đồng ${days} ngày với ${mgr.name}.`
      );
      return;
    }

    const now = Date.now();
    const isSameCurrentActive =
      user?.activeManager?.managerId === mgr.id && user.activeManager.expiresAt > now;
    const baseStartMs = isSameCurrentActive ? user!.activeManager!.expiresAt : now;
    const nextContract = {
      managerId: mgr.id,
      hiredAt: isSameCurrentActive ? user!.activeManager!.hiredAt : now,
      expiresAt: baseStartMs + days * 24 * 60 * 60 * 1000,
      contractDays: isSameCurrentActive
        ? (user!.activeManager!.contractDays || 0) + days
        : days,
    };

    const previewEval = evaluateManagerBonus({
      activeManager: nextContract,
      formationId: selectedFormation.id,
      playStyleId: selectedPlayStyleId,
      nowMs: now,
    });

    soundService.playPackOpenFanfare();
    if (onUpdateUser) {
      onUpdateUser((prev) => ({
        gems: Math.max(0, (prev.gems ?? 0) - gemCost),
        activeManager: nextContract,
      }));
    }

    showToast(
      isSameCurrentActive
        ? `Gia hạn thành công HLV ${mgr.name} thêm ${days} ngày (-${gemCost.toLocaleString('vi-VN')} Kim Cương)! Đang tăng +${previewEval.totalBonus} OVR.`
        : `Đã bổ nhiệm HLV ${mgr.name} (${days} ngày · -${gemCost.toLocaleString('vi-VN')} Kim Cương)! Đội hình nhận ngay +${previewEval.totalBonus} OVR.`
    );
  };

  // AUTO BEST XI strictly from user's owned club roster
  const handleAutoBestXI = () => {
    soundService.playPackOpenFanfare();
    const uniqueMap = new Map<string, PlayerCard>();
    [...ownedPlayers, ...starters, ...bench].forEach((p) => {
      if (!uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
      }
    });
    const allAvailable = Array.from(uniqueMap.values()).sort((a, b) => b.ovr - a.ovr);
    const assignedIds = new Set<string>();
    const assignedNameKeys = new Set<string>();
    const bestStarters: PlayerCard[] = [];

    const canAssignStarter = (p: PlayerCard) =>
      !assignedIds.has(p.id) && !assignedNameKeys.has(getCanonicalPlayerNameKey(p));

    // First lock GK into slot 10 (or any GK slot) so GK never ends up outfield if avoidable
    selectedFormation.slots.forEach((slot) => {
      const exactMatch = allAvailable.find(
        (p) => canAssignStarter(p) && p.position === slot.pos
      );
      if (exactMatch) {
        bestStarters.push(exactMatch);
        assignedIds.add(exactMatch.id);
        assignedNameKeys.add(getCanonicalPlayerNameKey(exactMatch));
      } else {
        // Adjacent fallback before arbitrary pick
        const adjacent = allAvailable.find((p) => {
          if (!canAssignStarter(p)) return false;
          if (slot.pos === 'GK') return p.position === 'GK';
          if (p.position === 'GK') return false;
          if ((slot.pos === 'LW' || slot.pos === 'LM') && (p.position === 'LW' || p.position === 'LM' || p.position === 'ST')) return true;
          if ((slot.pos === 'RW' || slot.pos === 'RM') && (p.position === 'RW' || p.position === 'RM' || p.position === 'ST')) return true;
          if ((slot.pos === 'CAM' || slot.pos === 'CDM' || slot.pos === 'CM') && (p.position === 'CM' || p.position === 'CAM' || p.position === 'CDM')) return true;
          if ((slot.pos === 'LWB' || slot.pos === 'LB') && (p.position === 'LB' || p.position === 'CB')) return true;
          if ((slot.pos === 'RWB' || slot.pos === 'RB') && (p.position === 'RB' || p.position === 'CB')) return true;
          return false;
        });
        const chosen =
          adjacent ||
          allAvailable.find((p) => canAssignStarter(p) && (slot.pos === 'GK' ? true : p.position !== 'GK')) ||
          allAvailable.find((p) => canAssignStarter(p)) ||
          allAvailable.find((p) => !assignedIds.has(p.id)) ||
          allAvailable[0];
        bestStarters.push(chosen);
        assignedIds.add(chosen.id);
        assignedNameKeys.add(getCanonicalPlayerNameKey(chosen));
      }
    });

    const remainingForBench = allAvailable
      .filter((p) => !assignedIds.has(p.id))
      .slice(0, 7);

    setStarters(bestStarters);
    setBench(remainingForBench);
    setSwapSelection(null);
    persistSquad(bestStarters, remainingForBench, selectedFormation.id);
    showToast(`Đã xếp Đội Hình Tối Ưu từ ${allAvailable.length} cầu thủ đang sở hữu!`);
  };

  const getPosSuitabilityBadge = (slotPos: string, playerPos: string) => {
    if (slotPos === playerPos) {
      return { text: slotPos, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/60' };
    }
    const isAdjacent =
      (slotPos === 'CF' && playerPos === 'ST') ||
      (slotPos === 'ST' && playerPos === 'CF') ||
      (slotPos === 'LW' && playerPos === 'LM') ||
      (slotPos === 'LM' && playerPos === 'LW') ||
      (slotPos === 'RW' && playerPos === 'RM') ||
      (slotPos === 'RM' && playerPos === 'RW') ||
      (slotPos === 'LWB' && playerPos === 'LB') ||
      (slotPos === 'RWB' && playerPos === 'RB') ||
      (slotPos === 'CAM' && playerPos === 'CM') ||
      (slotPos === 'CDM' && playerPos === 'CM') ||
      (slotPos === 'CM' && (playerPos === 'CAM' || playerPos === 'CDM'));
    if (isAdjacent) {
      return { text: `${slotPos}*`, color: 'text-amber-400 bg-amber-500/20 border-amber-400/60' };
    }
    return { text: `${slotPos}!`, color: 'text-rose-400 bg-rose-500/20 border-rose-400/60' };
  };

  const filteredFormations = useMemo(() => {
    if (formationFilter === 'ALL') return availableFormations;
    return availableFormations.filter((f) => f.type === formationFilter);
  }, [formationFilter]);

  const headerUser: UserProfile = user || {
    username: userTeamName,
    level: 1,
    exp: 0,
    maxExp: 100,
    ovr: currentTeamOvr,
    teamName: userTeamName,
    teamLogo: '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png',
    coins: userCoins,
    gems: 0,
    tickets: userTickets,
    fcPoints: 0,
    energy: 100,
    maxEnergy: 100,
    vsaRank: 'Pro',
    vsaFans: 0,
    h2hRank: 'Pro',
    h2hCups: 0,
    loginMethod: 'device',
    deviceId: 'local',
    clubTokens,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center select-none overflow-hidden font-cruyff">
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[70] px-5 py-2.5 rounded-none bg-yellow-400 text-slate-950 border border-yellow-200 font-cruyff font-black text-xs sm:text-sm shadow-2xl">
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden font-cruyff">
        {/* TOP SECTION HEADER (FRAMELESS RESOURCES TOP-RIGHT + BACK + MAIN SCREEN) */}
        <TopSectionHeader
          title={`ĐỘI HÌNH · OVR ${currentTeamOvr}`}
          subtitle={`Sơ đồ ${selectedFormation.name} · Ăn ý ${totalChemistry}/100 · Kho ${ownedPlayers.length} cầu thủ${
            squadOvrSummary.wrongPositionCount > 0
              ? ` · ${squadOvrSummary.wrongPositionCount} lệch vị trí (-${WRONG_POSITION_OVR_PENALTY} OVR)`
              : ''
          }${
            squadOvrSummary.managerBonus.isActive
              ? ` · HLV +${squadOvrSummary.managerBonus.totalBonus} OVR`
              : ''
          }`}
          user={headerUser}
          onBack={onClose}
          onGoHome={onClose}
          onClickClubTokens={() => setActiveTab('club')}
          extraRight={
            <button
              type="button"
              onClick={handleAutoBestXI}
              className="h-9 px-3 rounded-none bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-200 font-cruyff font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
              title="Tự động xếp đội hình mạnh nhất từ cầu thủ đang sở hữu"
            >
              ĐỘI HÌNH TỐI ƯU
            </button>
          }
        />

        {/* BORDER-DIVIDED SUB-NAVIGATION BAR (SHARP CORNERS, NO LOGOS) */}
        <div className="bg-slate-950 border-b border-white/25 flex flex-wrap items-stretch justify-between shrink-0">
          <div className="flex items-stretch divide-x divide-white/25 overflow-x-auto">
            {[
              { id: 'lineup' as const, label: 'SƠ ĐỒ & THAY NGƯỜI' },
              {
                id: 'club' as const,
                label: `CÂU LẠC BỘ (${remainingClubMatches}/${DAILY_MAX_CLUB_MATCHES})`,
              },
              {
                id: 'training' as const,
                label: `HUẤN LUYỆN TOÀN ĐỘI (CẤP ${trainingLevel})`,
              },
              {
                id: 'tactics' as const,
                label: `PHONG CÁCH & CHIẾN THUẬT (${activePlayStyle.shortName})`,
              },
              { id: 'roles' as const, label: 'ĐÁ PHẠT & ĐỘI TRƯỞNG' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundService.playTabSwitch();
                    setActiveTab(tab.id);
                  }}
                  className={`px-4 py-2.5 rounded-none text-xs font-cruyff font-black uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowFormationPicker(true);
              }}
              className="px-4 py-2.5 rounded-none text-xs font-cruyff font-black uppercase tracking-wider transition-colors whitespace-nowrap bg-transparent text-yellow-300 hover:bg-yellow-500/15 cursor-pointer"
            >
              ĐỔI SƠ ĐỒ ({selectedFormation.name})
            </button>
          </div>

          {swapSelection && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/15 border-l border-yellow-400/50 text-yellow-300 text-xs font-cruyff font-bold">
              <span>Đang chọn: {swapSelection.player.name} — Chạm cầu thủ khác để đổi</span>
              <button
                type="button"
                onClick={() => setSwapSelection(null)}
                className="ml-2 text-white hover:text-rose-400 uppercase font-black cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ===================== TAB 1: PITCH & SUBSTITUTES ===================== */}
          {activeTab === 'lineup' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full items-start">
              {/* LEFT: FOOTBALL PITCH WITH 11 INTERACTIVE PLAYERS (7 cols) */}
              <div className="lg:col-span-7 flex flex-col items-center gap-3">
                {/* Active Playstyle Strip Above Pitch */}
                <div className="w-full p-3 bg-zinc-900/95 border border-yellow-400/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={activePlayStyle.iconUrl}
                      alt={activePlayStyle.name}
                      className="w-11 h-11 object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">
                        PHONG CÁCH CHƠI ĐANG ÁP DỤNG TRONG TRẬN ĐẤU
                      </div>
                      <div className="font-cruyff font-black text-sm sm:text-base text-white uppercase truncate">
                        {activePlayStyle.name} — <span className="text-slate-300 font-normal normal-case text-xs">{activePlayStyle.tagline}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playTabSwitch();
                      setActiveTab('tactics');
                    }}
                    className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-xs uppercase tracking-wider cursor-pointer shrink-0 transition-colors"
                  >
                    ĐỔI PHONG CÁCH &amp; XEM ĐIỂM MẠNH/YẾU
                  </button>
                </div>

                <div className="relative w-full aspect-[4/5] min-h-[560px] sm:min-h-[640px] max-h-[680px] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)] bg-emerald-950">
                  <img
                    src="/assets/aistudio/ic_launcher_background_efb9615c.png"
                    alt="Pitch Field"
                    className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.15]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

                  <div className="absolute inset-4 border-2 border-white/35 pointer-events-none rounded-lg">
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/35" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white/35 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white/35 rounded-b-md" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-10 border-b-2 border-x-2 border-white/25 rounded-b-sm" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white/35 rounded-t-md" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 border-t-2 border-x-2 border-white/25 rounded-t-sm" />
                  </div>

                  {selectedFormation.slots.map((slot, index) => {
                    const player = starters[index] || starters[0];
                    if (!player) return null;
                    const isSelectedForSwap =
                      swapSelection?.type === 'starter' && swapSelection.index === index;
                    const isInspected = inspectedPlayer?.id === player.id;
                    const isDragSourceHere =
                      dragSource?.type === 'starter' && dragSource.index === index;
                    const isDropHovered = dragOverKey === `starter_${index}`;
                    const badge = getPosSuitabilityBadge(slot.pos, player.position);
                    const posPenalty = getPositionPenalty(player.position, slot.pos);
                    const effectiveStarterOvr = getEffectiveStarterOvr(
                      player,
                      slot.pos,
                      clampedTrainingLevel
                    );
                    const boostedPlayer =
                      effectiveStarterOvr !== player.ovr
                        ? {
                            ...player,
                            baseOvr: player.baseOvr ?? player.ovr,
                            ovr: effectiveStarterOvr,
                          }
                        : player;

                    return (
                      <div
                        key={slot.slotId}
                        style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                        draggable
                        onDragStart={(e) =>
                          handleCardDragStart(e, { type: 'starter', index, player })
                        }
                        onDragOver={(e) => handleCardDragOver(e, `starter_${index}`)}
                        onDragLeave={() =>
                          setDragOverKey((cur) => (cur === `starter_${index}` ? null : cur))
                        }
                        onDrop={(e) => handleCardDrop(e, { type: 'starter', index, player })}
                        onDragEnd={handleCardDragEnd}
                        onClick={() => handlePlayerSlotClick('starter', index, player)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col items-center ${
                          isDragSourceHere
                            ? 'opacity-45 scale-95 z-10'
                            : isDropHovered
                            ? 'scale-120 z-45'
                            : isSelectedForSwap
                            ? 'scale-120 z-40'
                            : isInspected
                            ? 'scale-110 z-30'
                            : 'hover:scale-110 z-20'
                        }`}
                      >
                        <div
                          className={`relative rounded-xl transition-all ${
                            isDropHovered
                              ? 'ring-2 ring-emerald-400 shadow-[0_0_26px_rgba(52,211,153,0.95)] bg-emerald-400/20'
                              : isSelectedForSwap
                              ? 'ring-2 ring-yellow-300 shadow-[0_0_26px_rgba(250,204,21,0.95)] bg-yellow-400/20'
                              : isInspected
                              ? 'ring-2 ring-yellow-400/80 shadow-[0_0_18px_rgba(234,179,8,0.65)]'
                              : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)]'
                          }`}
                        >
                          <FCCard
                            player={boostedPlayer}
                            size="pitch"
                            showStats={false}
                          />
                          {posPenalty < 0 && (
                            <span
                              title={`Lệch vị trí (${player.position} đang đá ${slot.pos}): trừ ${WRONG_POSITION_OVR_PENALTY} OVR`}
                              className="absolute -top-2 -right-2 z-20 px-1.5 py-0.5 bg-rose-600 text-white border border-rose-200 font-mono font-black text-[9px] leading-none shadow-md tabular-nums"
                            >
                              {posPenalty} OVR
                            </span>
                          )}
                        </div>

                        {/* Position Suitability Tag below full player card */}
                        <div className="-mt-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/90 border border-white/20 shadow-md">
                          <span
                            className={`px-1 rounded text-[8px] font-black uppercase border leading-tight ${badge.color}`}
                          >
                            {slot.pos}
                          </span>
                          <span className="font-cruyff font-bold text-[9px] text-white max-w-[48px] truncate leading-tight">
                            {player.name.split(' ').pop()}
                          </span>
                        </div>

                        {isSelectedForSwap && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center animate-bounce shadow-md z-20">
                            <ArrowLeftRight className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 w-full px-2 mt-2 text-[11px] text-gray-400 font-cruyff">
                  <span>Kéo thả hoặc chạm thẻ để đổi vị trí · Sai vị trí: -5 OVR</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Đúng vị trí
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Vị trí phụ (-5)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400" /> Lệch vị trí (-5)
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT: BENCH, RESERVES & INSPECTED PLAYER CARD (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3.5">
                {/* 1. BENCH (7 SLOTS) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/15 shadow-xl">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-yellow-400" />
                      <h3 className="font-cruyff font-black text-xs sm:text-sm text-white uppercase italic tracking-wide">
                        GHẾ DỰ BỊ CHIẾN LƯỢC ({bench.length} CẦU THỦ)
                      </h3>
                    </div>
                    <span className="text-[11px] text-gray-400 font-cruyff">Kéo thả hoặc chạm để thay</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {bench.map((player, bIdx) => {
                      const isSelected =
                        swapSelection?.type === 'bench' && swapSelection.index === bIdx;
                      const isInspected = inspectedPlayer?.id === player.id;
                      const isDragSourceHere =
                        dragSource?.type === 'bench' && dragSource.index === bIdx;
                      const isDropHovered = dragOverKey === `bench_${bIdx}`;
                      return (
                        <div
                          key={`${player.id}_bench_${bIdx}`}
                          draggable
                          onDragStart={(e) =>
                            handleCardDragStart(e, { type: 'bench', index: bIdx, player })
                          }
                          onDragOver={(e) => handleCardDragOver(e, `bench_${bIdx}`)}
                          onDragLeave={() =>
                            setDragOverKey((cur) => (cur === `bench_${bIdx}` ? null : cur))
                          }
                          onDrop={(e) =>
                            handleCardDrop(e, { type: 'bench', index: bIdx, player })
                          }
                          onDragEnd={handleCardDragEnd}
                          onClick={() => handlePlayerSlotClick('bench', bIdx, player)}
                          className={`p-1 rounded-xl cursor-grab active:cursor-grabbing transition-all flex flex-col items-center ${
                            isDragSourceHere
                              ? 'opacity-45 scale-95 bg-black/40 border border-white/20'
                              : isDropHovered
                              ? 'bg-emerald-400/25 border-2 border-emerald-400 scale-105'
                              : isSelected
                              ? 'bg-yellow-400/25 border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.7)] scale-105'
                              : isInspected
                              ? 'bg-white/15 border border-yellow-400/60'
                              : 'bg-black/50 hover:bg-black/80 border border-white/10'
                          }`}
                        >
                          <FCCard player={player} size="pitch" showStats={false} />
                          <span className="font-cruyff font-bold text-[9px] text-white truncate max-w-full text-center mt-0.5">
                            {player.position} · {player.name.split(' ').pop()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. RESERVES / UNLOCKED PACK PLAYERS */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/25 shadow-xl">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <PackageOpen className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-cruyff font-black text-xs text-emerald-300 uppercase italic tracking-wide">
                        KHO CẦU THỦ CÂU LẠC BỘ ({totalReserveCopies} DỰ TRỮ)
                      </h3>
                    </div>
                    <span className="text-[10px] text-gray-400">Kéo thả lên sân hoặc dự bị</span>
                  </div>

                  {reserves.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 text-center">
                      Toàn bộ cầu thủ sở hữu đang nằm trong Đội hình chính & Dự bị. Hãy mở thêm Vé Quay để chiêu mộ cầu thủ mới!
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {reserves.map((player, rIdx) => {
                        const isSelected =
                          swapSelection?.type === 'reserve' && swapSelection.index === rIdx;
                        const isInspected = inspectedPlayer?.id === player.id;
                        const isDragSourceHere =
                          dragSource?.type === 'reserve' && dragSource.index === rIdx;
                        const isDropHovered = dragOverKey === `reserve_${rIdx}`;
                        const spareQty = reserveSpareCounts.get(player.id) ?? 1;
                        return (
                          <div
                            key={`${player.id}_res_${rIdx}`}
                            draggable
                            onDragStart={(e) =>
                              handleCardDragStart(e, { type: 'reserve', index: rIdx, player })
                            }
                            onDragOver={(e) => handleCardDragOver(e, `reserve_${rIdx}`)}
                            onDragLeave={() =>
                              setDragOverKey((cur) => (cur === `reserve_${rIdx}` ? null : cur))
                            }
                            onDrop={(e) =>
                              handleCardDrop(e, { type: 'reserve', index: rIdx, player })
                            }
                            onDragEnd={handleCardDragEnd}
                            onClick={() => handlePlayerSlotClick('reserve', rIdx, player)}
                            className={`relative p-1 rounded-xl cursor-grab active:cursor-grabbing transition-all flex flex-col items-center ${
                              isDragSourceHere
                                ? 'opacity-45 scale-95 bg-black/40 border border-white/20'
                                : isDropHovered
                                ? 'bg-emerald-400/25 border-2 border-emerald-400 scale-105'
                                : isSelected
                                ? 'bg-emerald-400/25 border-2 border-emerald-400 scale-105'
                                : isInspected
                                ? 'bg-white/15 border border-emerald-400/60'
                                : 'bg-black/50 hover:bg-black/80 border border-white/10'
                            }`}
                          >
                            {spareQty > 1 && (
                              <span className="absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 font-mono font-black text-[9px] tabular-nums shadow">
                                x{spareQty}
                              </span>
                            )}
                            <FCCard player={player} size="pitch" showStats={false} />
                            <span className="font-cruyff font-bold text-[9px] text-white truncate max-w-full text-center mt-0.5">
                              {player.position} · {player.name.split(' ').pop()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. INSPECTED PLAYER RENDERZ DETAILS */}
                {inspectedPlayer && (() => {
                  const starterSlotIdx = starters.findIndex((s) => s.id === inspectedPlayer.id);
                  const inspectedSlotPos =
                    starterSlotIdx >= 0 ? selectedFormation.slots[starterSlotIdx]?.pos : undefined;
                  const inspectedPenalty = getPositionPenalty(
                    inspectedPlayer.position,
                    inspectedSlotPos
                  );
                  return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-950/40 via-zinc-900 to-black border border-yellow-400/50 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="font-cruyff font-black text-xs text-yellow-300 uppercase tracking-wider">
                          CHI TIẾT CẦU THỦ
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {inspectedPenalty < 0 && inspectedSlotPos && (
                          <span className="px-2 py-0.5 bg-rose-600/90 border border-rose-300 text-white font-mono font-black text-[10px] tabular-nums">
                            {inspectedSlotPos}: {inspectedPenalty} OVR
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded font-cruyff font-black text-[10px] uppercase tracking-wider border ${
                            (user?.tradeablePlayerIds ?? []).includes(inspectedPlayer.id)
                              ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-400/50 text-rose-200'
                          }`}
                        >
                          {(user?.tradeablePlayerIds ?? []).includes(inspectedPlayer.id)
                            ? 'GIAO DỊCH ĐƯỢC'
                            : 'KHÔNG GIAO DỊCH'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-mono font-bold text-xs tabular-nums">
                          OVR {inspectedPlayer.ovr + inspectedPenalty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <FCCard player={inspectedPlayer} size="sm" showStats={false} />
                      <div className="flex-1 space-y-1 text-xs font-cruyff">
                        <h4 className="font-cruyff font-black text-base text-white uppercase italic leading-tight">
                          {inspectedPlayer.name}
                        </h4>
                        <div className="text-[11px] text-gray-300">
                          {inspectedPlayer.club} · {inspectedPlayer.nation}
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          {!inspectedPlayer.id.startsWith('shop_featured_') && (
                            <span>
                              Kỹ thuật:{' '}
                              <strong className="text-yellow-400">
                                {'★'.repeat(inspectedPlayer.skillMoves)}
                              </strong>
                            </span>
                          )}
                          <span>
                            Chân yếu:{' '}
                            <strong className="text-yellow-400">
                              {'★'.repeat(inspectedPlayer.weakFoot)}
                            </strong>
                          </span>
                        </div>
                        {inspectedPlayer.workRate && (
                          <div className="text-[11px] text-gray-300">
                            Công/Thủ:{' '}
                            <strong className="text-emerald-400">{inspectedPlayer.workRate}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1 mt-2.5 p-2 rounded-xl bg-black/60 border border-white/10 text-center font-cruyff">
                      <div>
                        <span className="block font-black text-xs text-yellow-300">
                          {inspectedPlayer.pac}
                        </span>
                        <span className="block text-[8px] text-gray-400 uppercase">PAC</span>
                      </div>
                      <div>
                        <span className="block font-black text-xs text-yellow-300">
                          {inspectedPlayer.sho}
                        </span>
                        <span className="block text-[8px] text-gray-400 uppercase">SHO</span>
                      </div>
                      <div>
                        <span className="block font-black text-xs text-yellow-300">
                          {inspectedPlayer.pas}
                        </span>
                        <span className="block text-[8px] text-gray-400 uppercase">PAS</span>
                      </div>
                      <div>
                        <span className="block font-black text-xs text-yellow-300">
                          {inspectedPlayer.dri}
                        </span>
                        <span className="block text-[8px] text-gray-400 uppercase">DRI</span>
                      </div>
                      <div>
                        <span className="block font-black text-xs text-yellow-300">
                          {inspectedPlayer.def}
                        </span>
                        <span className="block text-[8px] text-gray-400 uppercase">DEF</span>
                      </div>
                      <div>
                        <span className="block font-black text-xs text-yellow-300">
                          {inspectedPlayer.phy}
                        </span>
                        <span className="block text-[8px] text-gray-400 uppercase">PHY</span>
                      </div>
                    </div>

                    <PixelPlayerCardPanel
                      player={inspectedPlayer}
                      hideSkillStats={inspectedPlayer.id.startsWith('shop_featured_')}
                      className="mt-2.5 text-left"
                    />
                  </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ===================== TAB 1.5: TEAM TRAINING (HUẤN LUYỆN TOÀN ĐỘI) ===================== */}
          {activeTab === 'training' && (
            <div className="max-w-5xl mx-auto space-y-5">
              {/* Top Hero Training Control Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/85 via-zinc-900 to-zinc-950 border-2 border-emerald-400/55 shadow-[0_0_35px_rgba(16,185,129,0.2)] space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase italic tracking-wide">
                        TRUNG TÂM HUẤN LUYỆN TOÀN ĐỘI
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Nâng cấp huấn luyện bằng <strong className="text-yellow-300">Xu (Coins)</strong> cho toàn bộ cầu thủ trong đội.{' '}
                        <strong className="text-emerald-300">
                          Cứ mỗi 5 cấp tăng +1 OVR toàn đội · Tối đa Cấp {MAX_TRAINING_LEVEL} (+40 OVR)!
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-black/60 border border-emerald-400/50 text-center">
                      <span className="text-[10px] text-emerald-300 uppercase font-bold block">
                        CẤP HUẤN LUYỆN
                      </span>
                      <span className="font-mono font-black text-xl text-white tabular-nums">
                        Cấp {clampedTrainingLevel} / {MAX_TRAINING_LEVEL}
                      </span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-yellow-400/20 border border-yellow-400 text-center">
                      <span className="text-[10px] text-yellow-200 uppercase font-bold block">
                        TĂNG OVR TOÀN ĐỘI
                      </span>
                      <span className="font-mono font-black text-xl text-yellow-300 tabular-nums">
                        +{trainingOvrBonus} OVR
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5-Level Cycle Progress Bar toward next +1 OVR */}
                <div className="p-4 rounded-xl bg-black/55 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isMaxTrainingLevel
                          ? `Đã hoàn tất cấp huấn luyện tối đa (Cấp ${MAX_TRAINING_LEVEL}/${MAX_TRAINING_LEVEL})`
                          : `Tiến trình đến mốc +${trainingOvrBonus + 1} OVR tiếp theo (Cấp ${Math.min(
                              MAX_TRAINING_LEVEL,
                              Math.floor(clampedTrainingLevel / 5) * 5 + 5
                            )})`}
                      </span>
                    </span>
                    <span className="font-mono font-black text-emerald-300 tabular-nums">
                      {isMaxTrainingLevel
                        ? `TỐI ĐA ${MAX_TRAINING_LEVEL} / ${MAX_TRAINING_LEVEL} CẤP`
                        : `${stepsInCycle} / 5 cấp (Còn ${levelsToNextOvr} cấp nữa +1 OVR)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((stepIdx) => {
                      const active = isMaxTrainingLevel || stepIdx < stepsInCycle;
                      const cycleBase = isMaxTrainingLevel
                        ? MAX_TRAINING_LEVEL - 5
                        : Math.floor(clampedTrainingLevel / 5) * 5;
                      const stepLevelNumber = cycleBase + stepIdx + 1;
                      return (
                        <div
                          key={stepIdx}
                          className={`h-9 rounded-lg border flex items-center justify-center font-mono text-xs font-black tabular-nums transition-all ${
                            active
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-zinc-950 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                              : stepIdx === 4
                              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-300'
                              : 'bg-zinc-900/90 border-white/10 text-gray-400'
                          }`}
                        >
                          {stepIdx === 4 ? `Cấp ${stepLevelNumber} (+1 OVR)` : `Cấp ${stepLevelNumber}`}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-300 tabular-nums">
                    <span>
                      OVR Đội Gốc: <strong className="text-white">{baseTeamOvr}</strong> + Huấn Luyện:{' '}
                      <strong className="text-emerald-300">+{trainingOvrBonus}</strong> ={' '}
                      <strong className="text-yellow-300 text-sm">TEAM OVR {currentTeamOvr}</strong>
                    </span>
                    <span>
                      Số dư hiện tại:{' '}
                      <strong className="text-yellow-300 font-mono">
                        {userCoins.toLocaleString('vi-VN')} Xu
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Upgrade Action Buttons with Coins */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled={isMaxTrainingLevel || userCoins < singleLevelCost}
                    onClick={() => handleTrainLevels(1)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 transition-all ${
                      !isMaxTrainingLevel && userCoins >= singleLevelCost
                        ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 border-yellow-200 text-zinc-950 hover:scale-[1.01] active:scale-98 cursor-pointer shadow-[0_6px_22px_rgba(234,179,8,0.35)]'
                        : 'bg-zinc-900 border-white/10 text-gray-500 cursor-not-allowed opacity-65'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-cruyff font-black text-base uppercase">
                        {isMaxTrainingLevel ? 'ĐÃ ĐẠT CẤP TỐI ĐA (200/200)' : 'HUẤN LUYỆN +1 CẤP'}
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          !isMaxTrainingLevel && userCoins >= singleLevelCost
                            ? 'text-zinc-800'
                            : 'text-gray-500'
                        }`}
                      >
                        {isMaxTrainingLevel
                          ? `Toàn đội đã nhận tối đa +${trainingOvrBonus} OVR`
                          : `Nâng từ Cấp ${clampedTrainingLevel} → Cấp ${clampedTrainingLevel + 1}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/85 text-yellow-300 font-mono font-black text-xs sm:text-sm tabular-nums shrink-0">
                      <img
                        src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                        alt="Coin"
                        className="w-4 h-4 object-contain"
                      />
                      <span>
                        {isMaxTrainingLevel ? 'MAX 200' : `${singleLevelCost.toLocaleString('vi-VN')} Xu`}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isMaxTrainingLevel || userCoins < milestoneCost}
                    onClick={() => handleTrainLevels(levelsToNextOvr)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 transition-all ${
                      !isMaxTrainingLevel && userCoins >= milestoneCost
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 border-emerald-200 text-zinc-950 hover:scale-[1.01] active:scale-98 cursor-pointer shadow-[0_6px_22px_rgba(16,185,129,0.35)]'
                        : 'bg-zinc-900 border-white/10 text-gray-500 cursor-not-allowed opacity-65'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-cruyff font-black text-base uppercase">
                        {isMaxTrainingLevel
                          ? 'HOÀN THÀNH ĐỘT PHÁ (CẤP 200)'
                          : `ĐỘT PHÁ MỐC +1 OVR (+${levelsToNextOvr} CẤP)`}
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          !isMaxTrainingLevel && userCoins >= milestoneCost
                            ? 'text-zinc-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {isMaxTrainingLevel
                          ? `Team OVR đạt ${currentTeamOvr}`
                          : `Lên thẳng Cấp ${clampedTrainingLevel + levelsToNextOvr} (Team OVR ${
                              baseTeamOvr + trainingOvrBonus + 1
                            })`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/85 text-emerald-300 font-mono font-black text-xs sm:text-sm tabular-nums shrink-0">
                      <img
                        src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                        alt="Coin"
                        className="w-4 h-4 object-contain"
                      />
                      <span>
                        {isMaxTrainingLevel ? 'MAX 200' : `${milestoneCost.toLocaleString('vi-VN')} Xu`}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Squad Training Roster Preview (11 Starters) */}
              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-white/15 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <h4 className="font-cruyff font-black text-sm sm:text-base text-white uppercase italic">
                    HIỆU QUẢ HUẤN LUYỆN TRÊN ĐỘI HÌNH CHÍNH (11 CẦU THỦ)
                  </h4>
                  <span className="text-xs text-emerald-300 font-mono font-bold tabular-nums">
                    Tất cả cầu thủ nhận +{trainingOvrBonus} OVR khi thi đấu
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {starters.map((player, idx) => (
                    <div
                      key={`${player.id}_train_${idx}`}
                      className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center text-center gap-1"
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold tabular-nums">
                        <span className="text-gray-400">{player.position}</span>
                        <span className="text-emerald-300">
                          {player.ovr} → <strong className="text-yellow-300">{player.ovr + trainingOvrBonus}</strong>
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-white/20 my-0.5">
                        <img
                          src={
                            player.avatarUrl ||
                            player.customFrameUrl ||
                            '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                          }
                          alt={player.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const fb =
                              '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
                            if (
                              !e.currentTarget.src.endsWith(
                                '_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                              )
                            ) {
                              e.currentTarget.src = fb;
                            }
                          }}
                        />
                      </div>
                      <span className="font-cruyff font-bold text-xs text-white truncate w-full">
                        {player.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: MANAGERS, PLAYSTYLES & TACTICS ===================== */}
          {activeTab === 'tactics' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* SECTION A: MANAGERS / COACHES & GEM CONTRACTS (+0..10 OVR) */}
              {(() => {
                const mgrBonus = squadOvrSummary.managerBonus;
                const activeMgr = mgrBonus.manager;
                const activeMgrStyle = activeMgr
                  ? getPlayStyleDef(activeMgr.favoritePlayStyleId)
                  : null;
                const firstUnmatchedFormId = activeMgr?.favoriteFormationIds[0];
                const recommendedFormObj = firstUnmatchedFormId
                  ? availableFormations.find((f) => f.id === firstUnmatchedFormId)
                  : null;
                const filteredManagers =
                  selectedManagerTier === 'ALL'
                    ? MANAGER_CATALOG
                    : MANAGER_CATALOG.filter((m) => m.tier === selectedManagerTier);

                return (
                  <div className="p-5 bg-zinc-950 border-2 border-cyan-400/60 shadow-2xl space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center shrink-0">
                          <Crown className="w-6 h-6 text-cyan-300" />
                        </div>
                        <div>
                          <h3 className="font-cruyff font-black text-xl sm:text-2xl text-cyan-300 uppercase italic tracking-wide">
                            HUẤN LUYỆN VIÊN TRƯỞNG &amp; HỢP ĐỒNG (+0 ĐẾN +10 OVR)
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                            Thuê HLV bằng <strong className="text-cyan-300">Kim Cương</strong> theo thời hạn hợp đồng và áp dụng đúng <strong className="text-yellow-300">Phong Cách + Sơ Đồ yêu thích</strong> của HLV để nhận tối đa +10 OVR toàn đội.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/70 border border-cyan-400/40 font-mono text-xs tabular-nums">
                        <img
                          src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                          alt="Kim Cương"
                          className="w-4 h-4 object-contain"
                        />
                        <span className="text-cyan-200 font-black">
                          {(user?.gems ?? 0).toLocaleString('vi-VN')} Kim Cương
                        </span>
                      </div>
                    </div>

                    {/* ACTIVE MANAGER SPOTLIGHT */}
                    {activeMgr && (mgrBonus.isActive || mgrBonus.isExpired) ? (
                      <div className="p-4 bg-gradient-to-r from-slate-900 via-cyan-950/35 to-slate-900 border border-cyan-400/50 flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-24 h-28 shrink-0 flex items-center justify-center">
                          <img
                            src={MANAGER_CARD_FRAME_URL}
                            alt="Khung HLV"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          />
                          <img
                            src={activeMgr.portraitUrl}
                            alt={activeMgr.name}
                            referrerPolicy="no-referrer"
                            className="relative z-10 w-16 h-16 object-contain -mt-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                          />
                          <span className="absolute bottom-1.5 z-20 px-1.5 py-0.5 bg-black/90 text-[9px] font-mono font-black text-yellow-300">
                            {activeMgr.rating}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-cruyff font-black text-lg text-white uppercase">
                                  {activeMgr.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 border text-[10px] font-black uppercase ${
                                    MANAGER_TIER_META[activeMgr.tier].badgeBgClass
                                  }`}
                                >
                                  {activeMgr.tierLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {activeMgr.philosophy}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="px-3 py-1.5 bg-black/75 border border-yellow-400/60 text-center">
                                <div className="text-[10px] text-slate-300 uppercase">
                                  ĐANG CỘNG
                                </div>
                                <div className="font-mono font-black text-lg text-yellow-300 tabular-nums">
                                  +{mgrBonus.totalBonus} / +{activeMgr.maxOvrBonus} OVR
                                </div>
                              </div>
                              <div
                                className={`px-3 py-1.5 border text-center font-mono text-xs ${
                                  mgrBonus.isExpired
                                    ? 'bg-rose-950/70 border-rose-400 text-rose-200'
                                    : 'bg-emerald-950/60 border-emerald-400/60 text-emerald-200'
                                }`}
                              >
                                <div className="flex items-center gap-1 justify-center text-[10px] uppercase">
                                  <Clock className="w-3 h-3" />
                                  <span>Hợp đồng</span>
                                </div>
                                <div className="font-black">
                                  {mgrBonus.isExpired
                                    ? 'Đã hết hạn'
                                    : formatRemainingContract(mgrBonus.remainingMs)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* OVR BONUS BREAKDOWN & QUICK APPLY */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="p-2.5 bg-black/55 border border-white/15 flex items-center justify-between">
                              <span className="text-slate-300">Cơ bản HLV:</span>
                              <span className="font-mono font-black text-emerald-300 tabular-nums">
                                +{mgrBonus.baseBonus} OVR
                              </span>
                            </div>

                            <div
                              className={`p-2.5 border flex items-center justify-between gap-2 ${
                                mgrBonus.playStyleMatched
                                  ? 'bg-emerald-950/45 border-emerald-400/50'
                                  : 'bg-amber-950/35 border-amber-400/45'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] text-slate-300">
                                  Phong cách gợi ý:
                                </div>
                                <div className="font-bold text-white truncate">
                                  {activeMgrStyle?.shortName} (
                                  {mgrBonus.playStyleMatched
                                    ? `+${mgrBonus.playStyleBonus}`
                                    : `0/+${activeMgr.ovrBreakdown.playStyleMatch}`}{' '}
                                  OVR)
                                </div>
                              </div>
                              {!mgrBonus.playStyleMatched && (
                                <button
                                  type="button"
                                  onClick={() => handlePickPlayStyle(activeMgr.favoritePlayStyleId)}
                                  className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] uppercase cursor-pointer shrink-0"
                                >
                                  ÁP DỤNG
                                </button>
                              )}
                            </div>

                            <div
                              className={`p-2.5 border flex items-center justify-between gap-2 ${
                                mgrBonus.formationMatched
                                  ? 'bg-emerald-950/45 border-emerald-400/50'
                                  : 'bg-amber-950/35 border-amber-400/45'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] text-slate-300">
                                  Sơ đồ yêu thích:
                                </div>
                                <div className="font-bold text-white truncate">
                                  {recommendedFormObj?.name || activeMgr.favoriteFormationIds[0]} (
                                  {mgrBonus.formationMatched
                                    ? `+${mgrBonus.formationBonus}`
                                    : `0/+${activeMgr.ovrBreakdown.formationMatch}`}{' '}
                                  OVR)
                                </div>
                              </div>
                              {!mgrBonus.formationMatched && recommendedFormObj && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundService.playClick();
                                    setSelectedFormation(recommendedFormObj);
                                    persistSquad(starters, bench, recommendedFormObj.id);
                                    showToast(
                                      `Đã chuyển sang sơ đồ yêu thích của HLV: ${recommendedFormObj.name}`
                                    );
                                  }}
                                  className="px-2 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] uppercase cursor-pointer shrink-0"
                                >
                                  ÁP DỤNG
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-slate-900/80 border border-white/15 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Chưa có Huấn Luyện Viên nào đang cầm quyền. Hãy chọn thời hạn hợp đồng và bổ nhiệm HLV bên dưới để nhận thêm từ <strong className="text-yellow-300">+0 đến +10 OVR</strong>.
                        </span>
                      </div>
                    )}

                    {/* CONTRACT DURATION & TIER FILTERS */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/75 p-3 border border-white/15">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase text-cyan-300 mr-1">
                          Thời hạn hợp đồng:
                        </span>
                        {MANAGER_CONTRACT_OPTIONS.map((opt) => {
                          const isSelected = selectedContractDays === opt.days;
                          return (
                            <button
                              key={opt.days}
                              type="button"
                              onClick={() => {
                                soundService.playClick();
                                setSelectedContractDays(opt.days);
                              }}
                              className={`px-3 py-1.5 text-xs font-cruyff font-black uppercase border transition-colors cursor-pointer whitespace-nowrap ${
                                isSelected
                                  ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                                  : 'bg-black/60 text-slate-300 border-white/15 hover:border-cyan-400/50'
                              }`}
                            >
                              {opt.label}
                              {opt.badge ? ` (${opt.badge})` : ''}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: 'ALL', label: `Tất cả (${MANAGER_CATALOG.length})` },
                            { id: 'legendary', label: 'Huyền Thoại (+10)' },
                            { id: 'elite', label: 'Tinh Anh (+8)' },
                            { id: 'gold', label: 'Vàng (+6)' },
                            { id: 'silver', label: 'Bạc (+4)' },
                          ] as Array<{ id: 'ALL' | ManagerTierId; label: string }>
                        ).map((tierTab) => {
                          const isTierActive = selectedManagerTier === tierTab.id;
                          return (
                            <button
                              key={tierTab.id}
                              type="button"
                              onClick={() => {
                                soundService.playClick();
                                setSelectedManagerTier(tierTab.id);
                              }}
                              className={`px-2.5 py-1.5 text-[11px] font-cruyff font-black uppercase border transition-colors cursor-pointer whitespace-nowrap ${
                                isTierActive
                                  ? 'bg-yellow-400 text-slate-950 border-yellow-200'
                                  : 'bg-black/50 text-slate-300 border-white/15 hover:border-white/40'
                              }`}
                            >
                              {tierTab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* MANAGER MARKET GRID (ALL 30 PORTRAITS WITH KHUNG THẺ HLV) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                      {filteredManagers.map((mgr) => {
                        const tierMeta = MANAGER_TIER_META[mgr.tier];
                        const gemCost = getManagerContractGemCost(mgr, selectedContractDays);
                        const canAfford = (user?.gems ?? 0) >= gemCost;
                        const isCurrentlyHired =
                          mgrBonus.isActive && mgrBonus.manager?.id === mgr.id;
                        const styleDef = getPlayStyleDef(mgr.favoritePlayStyleId);
                        const styleMatchedNow = selectedPlayStyleId === mgr.favoritePlayStyleId;
                        const formMatchedNow = mgr.favoriteFormationIds.includes(
                          selectedFormation.id
                        );
                        const favFormNames = mgr.favoriteFormationIds.map((fid) => {
                          const found = availableFormations.find((f) => f.id === fid);
                          return { id: fid, name: found ? found.name : fid, found };
                        });

                        return (
                          <div
                            key={mgr.id}
                            className={`p-3.5 bg-zinc-900/95 border flex flex-col justify-between gap-3 transition-colors ${
                              isCurrentlyHired
                                ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.22)]'
                                : `${tierMeta.borderClass} hover:border-white/50`
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Card Frame + Portrait */}
                              <div className="relative w-20 h-24 shrink-0 flex items-center justify-center">
                                <img
                                  src={MANAGER_CARD_FRAME_URL}
                                  alt="Khung thẻ HLV"
                                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                />
                                <img
                                  src={mgr.portraitUrl}
                                  alt={mgr.name}
                                  referrerPolicy="no-referrer"
                                  className="relative z-10 w-14 h-14 object-contain -mt-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                                />
                                <span className="absolute bottom-1 z-20 px-1.5 bg-black/90 text-[9px] font-mono font-black text-white tabular-nums">
                                  {mgr.rating}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`text-[10px] font-black uppercase ${tierMeta.textClass}`}
                                  >
                                    {mgr.tierLabel}
                                  </span>
                                  <span className="text-[11px] font-mono font-black text-yellow-300 tabular-nums">
                                    Max +{mgr.maxOvrBonus} OVR
                                  </span>
                                </div>
                                <h4 className="font-cruyff font-black text-sm text-white uppercase truncate">
                                  {mgr.name}
                                </h4>
                                <div className="text-[10px] text-slate-400">
                                  {mgr.nationality} · Cơ bản +{mgr.ovrBreakdown.base} / Sơ đồ +
                                  {mgr.ovrBreakdown.formationMatch} / Lối đá +
                                  {mgr.ovrBreakdown.playStyleMatch}
                                </div>
                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                                  {mgr.philosophy}
                                </p>
                              </div>
                            </div>

                            {/* Hints: Favorite Playstyle & Favorite Formations (clickable to quick-apply) */}
                            <div className="space-y-1.5 pt-2 border-t border-white/10 text-[11px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">Phong cách:</span>
                                <button
                                  type="button"
                                  onClick={() => handlePickPlayStyle(mgr.favoritePlayStyleId)}
                                  className={`flex items-center gap-1 font-bold cursor-pointer hover:underline ${
                                    styleMatchedNow ? 'text-emerald-300' : 'text-yellow-300'
                                  }`}
                                  title="Bấm để áp dụng phong cách gợi ý này"
                                >
                                  <img
                                    src={styleDef.iconUrl}
                                    alt={styleDef.shortName}
                                    className="w-4 h-4 object-contain"
                                  />
                                  <span>{styleDef.shortName}</span>
                                  {styleMatchedNow && <Check className="w-3 h-3" />}
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span
                                  className={`${
                                    formMatchedNow ? 'text-emerald-300 font-bold' : 'text-slate-400'
                                  }`}
                                >
                                  Sơ đồ hợp:
                                </span>
                                <div className="flex flex-wrap items-center gap-1 justify-end">
                                  {favFormNames.map((ff) => {
                                    const isCur = selectedFormation.id === ff.id;
                                    return (
                                      <button
                                        key={ff.id}
                                        type="button"
                                        onClick={() => {
                                          if (!ff.found) return;
                                          soundService.playClick();
                                          setSelectedFormation(ff.found);
                                          persistSquad(starters, bench, ff.found.id);
                                          showToast(`Đã áp dụng sơ đồ: ${ff.name}`);
                                        }}
                                        className={`px-1.5 py-0.5 border text-[10px] font-mono cursor-pointer transition-colors ${
                                          isCur
                                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                                            : 'bg-black/60 border-white/15 text-slate-200 hover:border-cyan-300'
                                        }`}
                                      >
                                        {ff.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Contract Hire / Renew Button */}
                            <button
                              type="button"
                              onClick={() => handleHireOrRenewManager(mgr, selectedContractDays)}
                              className={`w-full py-2 px-3 border font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isCurrentlyHired
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-400 text-emerald-200'
                                  : canAfford
                                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-200'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300 border-white/15'
                              }`}
                            >
                              <span>
                                {isCurrentlyHired
                                  ? `GIA HẠN +${selectedContractDays} NGÀY`
                                  : `THUÊ HLV (${selectedContractDays} NGÀY)`}
                              </span>
                              <span className="flex items-center gap-1 font-mono tabular-nums">
                                <img
                                  src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                                  alt="Gems"
                                  className="w-3.5 h-3.5 object-contain"
                                />
                                <span>{gemCost.toLocaleString('vi-VN')}</span>
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* SECTION B: 6 TACTICAL PLAYSTYLES ("PHONG CÁCH CHƠI") WITH STRENGTHS, WEAKNESSES & COUNTERS */}
              <div className="p-5 bg-zinc-950 border-2 border-yellow-400/60 shadow-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
                  <div>
                    <h3 className="font-cruyff font-black text-xl sm:text-2xl text-yellow-300 uppercase italic tracking-wide">
                      PHONG CÁCH CHƠI (6 TRIẾT LÝ CHIẾN THUẬT TRẬN ĐẤU)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      Mỗi phong cách mang lại điểm mạnh, điểm yếu và tính tương khắc trực tiếp trong Đấu Sự Nghiệp, Đấu Xếp Hạng và CLB Tâm Điểm.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-yellow-300 font-bold uppercase">
                    <img
                      src={activePlayStyle.iconUrl}
                      alt={activePlayStyle.name}
                      className="w-7 h-7 object-contain"
                    />
                    <span>Đang dùng: {activePlayStyle.name}</span>
                  </div>
                </div>

                {/* 6 Golden Emblem Selector Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {TACTICAL_PLAYSTYLES.map((style) => {
                    const isSelected = activePlayStyle.id === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handlePickPlayStyle(style.id)}
                        className={`p-3.5 text-center transition-all flex flex-col items-center justify-between gap-2 border-2 cursor-pointer ${
                          isSelected
                            ? 'bg-yellow-400/15 border-yellow-400 shadow-[0_0_24px_rgba(250,204,21,0.28)]'
                            : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/15 hover:border-yellow-400/40'
                        }`}
                      >
                        <img
                          src={style.iconUrl}
                          alt={style.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                        />
                        <div>
                          <div
                            className={`font-cruyff font-black text-xs sm:text-sm uppercase tracking-wide ${
                              isSelected ? 'text-yellow-300' : 'text-white'
                            }`}
                          >
                            {style.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                            {style.tagline}
                          </div>
                        </div>
                        <span
                          className={`w-full py-1 text-[10px] font-cruyff font-black uppercase tracking-wider ${
                            isSelected
                              ? 'bg-yellow-400 text-slate-950'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {isSelected ? 'ĐANG ÁP DỤNG' : 'CHỌN PHONG CÁCH'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Playstyle Deep Breakdown: Philosophy + Strengths + Weaknesses + Counter Matchups */}
                <div className="p-4 sm:p-5 bg-slate-900/90 border border-white/15 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={activePlayStyle.iconUrl}
                        alt={activePlayStyle.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                          TRIẾT LÝ VẬN HÀNH TRÊN SÂN
                        </div>
                        <h4 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase italic">
                          {activePlayStyle.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
                          {activePlayStyle.philosophy}
                        </p>
                      </div>
                    </div>

                    {/* Recommended Formations Quick Apply */}
                    <div className="shrink-0 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                        Sơ đồ phát huy tối đa:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activePlayStyle.recommendedFormations.map((fName) => {
                          const matchedForm = availableFormations.find(
                            (f) => f.name.toLowerCase() === fName.toLowerCase()
                          );
                          const isCurrentForm = selectedFormation.name === fName;
                          return (
                            <button
                              key={fName}
                              type="button"
                              onClick={() => {
                                if (!matchedForm) return;
                                soundService.playClick();
                                setSelectedFormation(matchedForm);
                                persistSquad(starters, bench, matchedForm.id);
                                showToast(`Đã áp dụng sơ đồ phù hợp: ${matchedForm.name}`);
                              }}
                              className={`px-2.5 py-1 text-xs font-mono font-bold border transition-colors cursor-pointer ${
                                isCurrentForm
                                  ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                                  : 'bg-black/50 text-cyan-200 border-cyan-400/40 hover:border-cyan-300'
                              }`}
                            >
                              {fName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Strengths vs Weaknesses Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* STRENGTHS */}
                    <div className="p-4 bg-emerald-950/35 border border-emerald-400/40 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-300 font-cruyff font-black text-sm uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>ĐIỂM MẠNH TRONG TRẬN ĐẤU</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-100 leading-relaxed">
                        {activePlayStyle.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-black mt-0.5">+</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* WEAKNESSES */}
                    <div className="p-4 bg-rose-950/35 border border-rose-400/40 space-y-2.5">
                      <div className="flex items-center gap-2 text-rose-300 font-cruyff font-black text-sm uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>ĐIỂM YẾU &amp; RỦI RO CHIẾN THUẬT</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-100 leading-relaxed">
                        {activePlayStyle.weaknesses.map((wk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-400 font-black mt-0.5">−</span>
                            <span>{wk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Counter Matchup Row (Khắc chế & Bị khắc chế) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-black/45 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-300">
                        <Swords className="w-4 h-4" />
                        <span>Khắc chế hiệu quả (+1.8 OVR):</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {activePlayStyle.strongAgainst.map((targetId) => {
                          const target = PLAYSTYLE_MAP[targetId];
                          return (
                            <div
                              key={targetId}
                              className="flex items-center gap-1.5 text-xs font-bold text-white"
                            >
                              <img
                                src={target.iconUrl}
                                alt={target.name}
                                className="w-6 h-6 object-contain"
                              />
                              <span>{target.shortName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-black/45 border border-rose-500/30 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-rose-300">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Dễ bị khắc chế bởi (-1.8 OVR):</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {activePlayStyle.weakAgainst.map((counterId) => {
                          const counter = PLAYSTYLE_MAP[counterId];
                          return (
                            <div
                              key={counterId}
                              className="flex items-center gap-1.5 text-xs font-bold text-white"
                            >
                              <img
                                src={counter.iconUrl}
                                alt={counter.name}
                                className="w-6 h-6 object-contain"
                              />
                              <span>{counter.shortName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/90 border border-yellow-400/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-cruyff font-black text-lg text-white uppercase italic">
                      THÁI ĐỘ NHẬP CUỘC BỔ TRỢ (TEAM MENTALITY)
                    </h3>
                    <p className="text-xs text-gray-400 font-cruyff">
                      Kết hợp cùng Phong Cách Chơi {activePlayStyle.name} để tinh chỉnh cự ly dâng cao của 11 cầu thủ.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold uppercase border border-yellow-400/40">
                    {tactics.mentality.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'attacking',
                      name: 'TẤN CÔNG (ATTACKING)',
                      desc: 'Dâng cao toàn đội hình, áp sát quyết liệt, tiền vệ tích cực xâm nhập vòng cấm.',
                    },
                    {
                      id: 'balanced',
                      name: 'CÂN BẰNG (BALANCED)',
                      desc: 'Giữ cự ly đội hình chuẩn mực, kiểm soát bóng an toàn và phản công khi có khoảng trống.',
                    },
                    {
                      id: 'defensive',
                      name: 'PHÒNG NGỰ (DEFENSIVE)',
                      desc: 'Lùi sâu phòng ngự chặt chẽ, bảo vệ tuyệt đối khung thành và phản công nhanh.',
                    },
                  ].map((m) => {
                    const isSelected = tactics.mentality === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          soundService.playClick();
                          setTactics({
                            ...tactics,
                            mentality: m.id as TeamTactics['mentality'],
                          });
                          showToast(`Đã chọn lối chơi: ${m.name}`);
                        }}
                        className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }`}
                      >
                        <span className="font-cruyff font-black text-sm uppercase tracking-wide block mb-1">
                          {m.name}
                        </span>
                        <p
                          className={`text-[11px] leading-relaxed ${
                            isSelected ? 'text-black/80' : 'text-gray-400'
                          }`}
                        >
                          {m.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-cruyff">
                    <span className="text-gray-300 font-bold uppercase">
                      Tốc độ triển khai (Build-up Speed)
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {tactics.speed === 1
                        ? 'Chậm (Kiểm soát)'
                        : tactics.speed === 2
                        ? 'Cân bằng'
                        : 'Chớp nhoáng (Fast)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={tactics.speed}
                    onChange={(e) => setTactics({ ...tactics, speed: Number(e.target.value) })}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-cruyff">
                    <span className="text-gray-300 font-bold uppercase">
                      Kiểu chuyền bóng (Passing)
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {tactics.passing === 1
                        ? 'Ngắn (Tiki-taka)'
                        : tactics.passing === 2
                        ? 'Hỗn hợp'
                        : 'Phất bóng dài'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={tactics.passing}
                    onChange={(e) => setTactics({ ...tactics, passing: Number(e.target.value) })}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-cruyff">
                    <span className="text-gray-300 font-bold uppercase">
                      Áp sát phòng ngự (Pressure)
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {tactics.pressure === 1
                        ? 'Thấp (Thận trọng)'
                        : tactics.pressure === 2
                        ? 'Trung bình'
                        : 'Gegenpress tầm cao'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={tactics.pressure}
                    onChange={(e) => setTactics({ ...tactics, pressure: Number(e.target.value) })}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-cruyff">
                    <span className="text-gray-300 font-bold uppercase">
                      Quyết liệt tranh bóng (Aggression)
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {tactics.aggression === 1
                        ? 'Bọc lót thận trọng'
                        : tactics.aggression === 2
                        ? 'Chặt chẽ'
                        : 'Tắc bóng quyết liệt'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={tactics.aggression}
                    onChange={(e) =>
                      setTactics({ ...tactics, aggression: Number(e.target.value) })
                    }
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-cruyff flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Chiến thuật thi đấu được lưu tự động và áp dụng cho Chế Độ Sự Nghiệp Premier League!</span>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: SET PIECE ROLES ===================== */}
          {activeTab === 'roles' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-white/10">
                <h3 className="font-cruyff font-black text-lg text-white uppercase italic mb-1">
                  PHÂN CÔNG VAI TRÒ & CÁC TÌNH HUỐNG CỐ ĐỊNH
                </h3>
                <p className="text-xs text-gray-400 font-cruyff">
                  Chỉ định các cầu thủ chuyên trách đá phạt đền, đá phạt hàng rào, phạt góc và đội trưởng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { roleKey: 'captainId', label: 'Đội Trưởng (Captain)', currentId: roles.captainId },
                  { roleKey: 'penaltyId', label: 'Phạt Đền (Penalties)', currentId: roles.penaltyId },
                  { roleKey: 'shortFreeKickId', label: 'Đá Phạt Gần (Short FK)', currentId: roles.shortFreeKickId },
                  { roleKey: 'longFreeKickId', label: 'Đá Phạt Xa (Long FK)', currentId: roles.longFreeKickId },
                  { roleKey: 'leftCornerId', label: 'Phạt Góc Trái', currentId: roles.leftCornerId },
                  { roleKey: 'rightCornerId', label: 'Phạt Góc Phải', currentId: roles.rightCornerId },
                ].map((item) => {
                  const assignedPlayer =
                    starters.find((p) => p.id === item.currentId) || starters[0];
                  if (!assignedPlayer) return null;
                  return (
                    <div
                      key={item.roleKey}
                      className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col justify-between space-y-3"
                    >
                      <span className="font-cruyff font-bold text-xs uppercase text-yellow-300">
                        {item.label}
                      </span>

                      <div className="flex items-center gap-3 p-2 rounded-xl bg-black/60 border border-white/10">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-yellow-400/60 bg-zinc-800">
                          <img
                            src={
                              assignedPlayer.avatarUrl ||
                              assignedPlayer.customFrameUrl ||
                              '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                            }
                            alt={assignedPlayer.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const fb =
                                '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
                              if (
                                !e.currentTarget.src.endsWith(
                                  '_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                                )
                              ) {
                                e.currentTarget.src = fb;
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-cruyff font-bold text-sm text-white">
                            {assignedPlayer.name}
                          </div>
                          <div className="text-[11px] text-yellow-400 font-bold">
                            {assignedPlayer.position} · OVR {assignedPlayer.ovr}
                          </div>
                        </div>
                      </div>

                      <select
                        value={item.currentId}
                        onChange={(e) => {
                          soundService.playClick();
                          setRoles({ ...roles, [item.roleKey]: e.target.value });
                          showToast(`Đã chỉ định: ${item.label}`);
                        }}
                        className="w-full bg-zinc-800 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-cruyff focus:outline-none focus:border-yellow-400"
                      >
                        {starters.map((p, pIdx) => (
                          <option key={`${p.id}_opt_${pIdx}`} value={p.id}>
                            {p.name} ({p.position} {p.ovr})
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 5: CÂU LẠC BỘ (2 TRẬN NỔI BẬT / NGÀY & ĐỔI TOKEN CLB) ===================== */}
          {activeTab === 'club' && (
            <ClubKeyMatchSection
              userTeamName={userTeamName}
              currentTeamOvr={currentTeamOvr}
              starters={starters}
              clubTokens={clubTokens}
              userTickets={userTickets}
              clubDaily={clubDaily}
              ownedPlayerIds={resolvedOwnedIds}
              userPlayStyle={selectedPlayStyleId}
              onSelectPlayStyle={handlePickPlayStyle}
              onCompleteMatch={(entry) => {
                onCompleteClubMatch?.(entry);
              }}
              onExchangeReward={(kind) => {
                onExchangeClubReward?.(kind);
              }}
            />
          )}
        </div>

        {/* FORMATION PICKER MODAL OVERLAY (ALL 19 FORMATIONS WITH MINI TACTICAL BOARD) */}
        {showFormationPicker && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-zinc-950 border border-yellow-400/50 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-cruyff font-black text-xl text-white uppercase italic">
                    CHỌN SƠ ĐỒ ĐỘI HÌNH ({availableFormations.length} SƠ ĐỒ CHIẾN THUẬT)
                  </h3>
                </div>
                <button
                  onClick={() => setShowFormationPicker(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 my-3 overflow-x-auto pb-1">
                {(['ALL', 'Tấn công', 'Cân bằng', 'Phòng thủ'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      soundService.playClick();
                      setFormationFilter(cat);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-cruyff font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                      formationFilter === cat
                        ? 'bg-yellow-400 text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                    }`}
                  >
                    {cat === 'ALL' ? `Tất Cả (${availableFormations.length})` : cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
                {filteredFormations.map((f) => {
                  const isCurrent = selectedFormation.id === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        soundService.playClick();
                        setSelectedFormation(f);
                        persistSquad(starters, bench, f.id);
                        setShowFormationPicker(false);
                        showToast(`Đã chuyển sang sơ đồ: ${f.name}`);
                      }}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-yellow-400/20 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                          : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-cruyff font-black text-base text-white uppercase italic">
                            {f.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              f.type === 'Tấn công'
                                ? 'bg-rose-500/20 text-rose-300'
                                : f.type === 'Phòng thủ'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {f.type}
                          </span>
                        </div>

                        {/* Mini 11-dot tactical schematic */}
                        <div className="relative w-full h-24 rounded-lg bg-emerald-950/90 border border-emerald-500/30 mb-2 overflow-hidden">
                          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/20" />
                          {f.slots.map((s) => (
                            <span
                              key={s.slotId}
                              style={{ left: `${s.x}%`, top: `${s.y}%` }}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                                s.pos === 'GK'
                                  ? 'bg-amber-400'
                                  : isCurrent
                                  ? 'bg-yellow-300'
                                  : 'bg-emerald-400'
                              }`}
                            />
                          ))}
                        </div>

                        <p className="text-[11px] text-gray-400 font-cruyff line-clamp-2">
                          {f.description}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-yellow-400 font-bold uppercase">
                        <span>11 Vị trí</span>
                        {isCurrent ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đang dùng
                          </span>
                        ) : (
                          <span>Chọn sơ đồ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
