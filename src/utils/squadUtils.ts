import {
  FormationConfig,
  ManagerContractState,
  PlayerCard,
  TacticalPlayStyleId,
  UserProfile,
} from '../types/game';
import { availableFormations } from '../data/formationsData';
import { evaluateManagerBonus, ManagerBonusEvaluation } from '../data/managersData';

export const WRONG_POSITION_OVR_PENALTY = 5;
export const MAX_TRAINING_LEVEL = 200;

export const getTrainingOvrBonus = (trainingLevel?: number): number => {
  const clamped = Math.min(MAX_TRAINING_LEVEL, Math.max(0, trainingLevel ?? 0));
  return Math.floor(clamped / 5);
};

export const getPositionPenalty = (
  playerPos?: string | null,
  slotPos?: string | null
): number => {
  if (!playerPos || !slotPos) return 0;
  return playerPos === slotPos ? 0 : -WRONG_POSITION_OVR_PENALTY;
};

export const isOutOfPosition = (
  playerPos?: string | null,
  slotPos?: string | null
): boolean => {
  return Boolean(playerPos && slotPos && playerPos !== slotPos);
};

export const getEffectiveStarterOvr = (
  player: Pick<PlayerCard, 'ovr' | 'position'>,
  slotPos?: string | null,
  trainingLevel?: number
): number => {
  const raw =
    player.ovr +
    getTrainingOvrBonus(trainingLevel) +
    getPositionPenalty(player.position, slotPos);
  return Math.max(40, raw);
};

export interface SquadOvrSummary {
  totalOvr: number;
  baseAvgOvr: number;
  rawAvgOvrWithoutPenalty: number;
  wrongPositionCount: number;
  totalPositionPenaltyOvr: number;
  trainingBonusOvr: number;
  managerBonus: ManagerBonusEvaluation;
}

export const computeSquadOvr = ({
  starters,
  formation,
  trainingLevel = 0,
  activeManager,
  playStyleId,
  fallbackOvr = 90,
  nowMs = Date.now(),
}: {
  starters: Array<PlayerCard | null | undefined>;
  formation?: FormationConfig | null;
  trainingLevel?: number;
  activeManager?: ManagerContractState | null;
  playStyleId?: TacticalPlayStyleId | string | null;
  fallbackOvr?: number;
  nowMs?: number;
}): SquadOvrSummary => {
  const validPairs: Array<{ player: PlayerCard; slotPos?: string }> = [];
  starters.forEach((p, idx) => {
    if (!p) return;
    validPairs.push({ player: p, slotPos: formation?.slots[idx]?.pos });
  });

  const trainingBonusOvr = getTrainingOvrBonus(trainingLevel);
  const managerBonus = evaluateManagerBonus({
    activeManager,
    formationId: formation?.id,
    playStyleId,
    nowMs,
  });

  if (validPairs.length === 0) {
    return {
      totalOvr: fallbackOvr + trainingBonusOvr + managerBonus.totalBonus,
      baseAvgOvr: fallbackOvr,
      rawAvgOvrWithoutPenalty: fallbackOvr,
      wrongPositionCount: 0,
      totalPositionPenaltyOvr: 0,
      trainingBonusOvr,
      managerBonus,
    };
  }

  let wrongPositionCount = 0;
  let totalPenaltySum = 0;
  let rawSum = 0;
  let adjustedSum = 0;

  for (const { player, slotPos } of validPairs) {
    const penalty = getPositionPenalty(player.position, slotPos);
    if (penalty < 0) {
      wrongPositionCount += 1;
      totalPenaltySum += penalty;
    }
    rawSum += player.ovr;
    adjustedSum += Math.max(40, player.ovr + penalty);
  }

  const rawAvgOvrWithoutPenalty = Math.round(rawSum / validPairs.length);
  const baseAvgOvr = Math.round(adjustedSum / validPairs.length);
  const totalOvr = Math.max(
    40,
    baseAvgOvr + trainingBonusOvr + managerBonus.totalBonus
  );

  return {
    totalOvr,
    baseAvgOvr,
    rawAvgOvrWithoutPenalty,
    wrongPositionCount,
    totalPositionPenaltyOvr: totalPenaltySum,
    trainingBonusOvr,
    managerBonus,
  };
};

export const computeUserTeamOvrFromState = (
  user: UserProfile,
  allPlayersMap: Map<string, PlayerCard>,
  nowMs: number = Date.now()
): SquadOvrSummary => {
  const formation =
    availableFormations.find((f) => f.id === user.activeFormationId) ||
    availableFormations[0];
  const starters = (user.starterIds || []).map((id) => allPlayersMap.get(id));
  return computeSquadOvr({
    starters,
    formation,
    trainingLevel: user.trainingLevel ?? 0,
    activeManager: user.activeManager,
    playStyleId: user.playStyle,
    fallbackOvr: user.ovr || 90,
    nowMs,
  });
};

const normalizeAsciiName = (raw: string): string =>
  (raw || '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const CANONICAL_PLAYER_NAME_ALIASES: Record<string, string> = {
  kimmich: 'joshua kimmich',
  olise: 'michael olise',
  kane: 'harry kane',
  upamecano: 'dayot upamecano',
  schlotterbeck: 'nico schlotterbeck',
  pavlovic: 'aleksandar pavlovic',
  grull: 'marco grull',
  nkunku: 'christopher nkunku',
  vandevoordt: 'maarten vandevoordt',
  nmecha: 'felix nmecha',
  gruda: 'brajan gruda',
  schick: 'patrik schick',
  nusa: 'antonio nusa',
  mittelstadt: 'maximilian mittelstadt',
  'aleix garcia': 'aleix garcia',
  chiellini: 'giorgio chiellini',
  buffon: 'gianluigi buffon',
  'del piero': 'alessandro del piero',
  pirlo: 'andrea pirlo',
  nedved: 'pavel nedved',
  bremer: 'gleison bremer',
  'kolo muani': 'randal kolo muani',
  yildiz: 'kenan yildiz',
  mckennie: 'weston mckennie',
  kelly: 'lloyd kelly',
  woltemade: 'nick woltemade',
  pinsoglio: 'carlo pinsoglio',
  kalulu: 'pierre kalulu',
  gatti: 'federico gatti',
  'f gatti': 'federico gatti',
  'k thuram': 'khephren thuram',
  mbappe: 'kylian mbappe',
  bellingham: 'jude bellingham',
  valverde: 'federico valverde',
  hakimi: 'achraf hakimi',
  garnacho: 'alejandro garnacho',
  zidane: 'zinedine zidane',
  'mac allister': 'alexis mac allister',
  'l messi': 'lionel messi',
  'e camavinga': 'eduardo camavinga',
  'r lewis': 'rico lewis',
  'j alvarez': 'julian alvarez',
  'c romero': 'cristian romero',
  'f chiesa': 'federico chiesa',
  'b guimaraes': 'bruno guimaraes',
  'e martinez': 'emiliano martinez',
  'vini jr': 'vinicius junior',
  'vinicius jr': 'vinicius junior',
  'h m son': 'son heung min',
  'heung min son': 'son heung min',
  'son heung min': 'son heung min',
  kaka: 'kaka',
  mascherano: 'javier mascherano',
  dybala: 'paulo dybala',
  garrincha: 'garrincha',
  batistuta: 'gabriel batistuta',
  marcelo: 'marcelo vieira',
  pizarro: 'claudio pizarro',
  munoz: 'daniel munoz',
  'lucas paqueta': 'lucas paqueta',
  mukhtar: 'hany mukhtar',
  paredes: 'leandro paredes',
  jackson: 'nicolas jackson',
};

export const getCanonicalPlayerNameKey = (
  player: Pick<PlayerCard, 'id' | 'name' | 'fullName'>
): string => {
  const idLower = (player.id || '').toLowerCase();
  const normName = normalizeAsciiName(player.name);
  const fullClean = normalizeAsciiName((player.fullName || '').replace(/\([^)]*\)/g, ''));

  if (
    idLower.startsWith('ronaldo_chronicles_') ||
    normName === 'cristiano ronaldo' ||
    normName === 'c ronaldo' ||
    (normName === 'ronaldo' && fullClean.includes('cristiano'))
  ) {
    return 'cristiano ronaldo';
  }
  if (normName === 'ronaldo nazario' || (normName === 'ronaldo' && fullClean.includes('nazario'))) {
    return 'ronaldo nazario';
  }
  if (normName === 'thuram' || normName === 'k thuram' || normName === 'khephren thuram') {
    return 'khephren thuram';
  }
  if (normName === 'e garcia' && (idLower.includes('welcome') || fullClean.includes('eric'))) {
    return 'eric garcia';
  }
  if (normName === 'l martinez') {
    if (fullClean.includes('lisandro')) return 'lisandro martinez';
    return 'lautaro martinez';
  }

  const aliased = CANONICAL_PLAYER_NAME_ALIASES[normName];
  if (aliased) return aliased;

  if (/^[a-z] /.test(normName) && fullClean) {
    const fullTokens = fullClean.split(' ');
    if (fullTokens.length >= 2) {
      return `${fullTokens[0]} ${fullTokens[fullTokens.length - 1]}`;
    }
  }

  return normName || fullClean || idLower;
};

export const dedupeStartersByPlayerName = (
  starterIds: string[],
  candidateIds: string[],
  playerById: Map<string, PlayerCard>
): string[] => {
  const usedNameKeys = new Set<string>();
  const usedIds = new Set<string>();
  const result: string[] = [];

  for (const id of starterIds) {
    const card = playerById.get(id);
    if (!card) continue;
    const key = getCanonicalPlayerNameKey(card);
    if (!usedIds.has(id) && !usedNameKeys.has(key)) {
      usedIds.add(id);
      usedNameKeys.add(key);
      result.push(id);
      continue;
    }
    const replacementId = candidateIds.find((candId) => {
      if (usedIds.has(candId)) return false;
      const cand = playerById.get(candId);
      if (!cand) return false;
      return !usedNameKeys.has(getCanonicalPlayerNameKey(cand));
    });
    if (replacementId) {
      const repCard = playerById.get(replacementId)!;
      usedIds.add(replacementId);
      usedNameKeys.add(getCanonicalPlayerNameKey(repCard));
      result.push(replacementId);
    } else {
      result.push(id);
    }
  }

  return result;
};

export const getOwnedCopyCountMap = (
  ownedPlayerIds?: string[]
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const id of ownedPlayerIds ?? []) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
};

export const addOwnedPlayerCopies = (
  existingOwnedIds: string[] | undefined,
  idsToAdd: string[]
): string[] => {
  const result = Array.isArray(existingOwnedIds) ? [...existingOwnedIds] : [];
  for (const id of idsToAdd) {
    if (id) result.push(id);
  }
  return result;
};

export const removeOwnedPlayerCopies = (
  existingOwnedIds: string[] | undefined,
  removals: Array<{ playerId: string; count?: number }>
): string[] => {
  const toRemove = new Map<string, number>();
  for (const entry of removals) {
    const qty = Math.max(0, Math.floor(entry.count ?? 1));
    if (qty > 0 && entry.playerId) {
      toRemove.set(entry.playerId, (toRemove.get(entry.playerId) ?? 0) + qty);
    }
  }
  const next: string[] = [];
  for (const id of existingOwnedIds ?? []) {
    const rem = toRemove.get(id) ?? 0;
    if (rem > 0) {
      toRemove.set(id, rem - 1);
    } else {
      next.push(id);
    }
  }
  return next;
};

