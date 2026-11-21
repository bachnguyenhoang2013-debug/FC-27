import { totyFeaturedPlayers } from '../data/mockData';
import { ApexPlayerInit } from '../engine/apexMatchEngine';
import { PlayerCard } from '../types/game';
import { resolvePixelPlayerProfile } from './pixelPlayerData';

const SLOT_COMPATIBLE_POS: Record<string, string[]> = {
  GK: ['GK'],
  LB: ['LB', 'LWB', 'CB', 'LM'],
  RB: ['RB', 'RWB', 'CB', 'RM'],
  CB: ['CB', 'CDM', 'LB', 'RB'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  CDM: ['CDM', 'CM', 'CB'],
  CM: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  CAM: ['CAM', 'CM', 'CF', 'RW', 'LW'],
  LM: ['LM', 'LW', 'CAM', 'LB'],
  RM: ['RM', 'RW', 'CAM', 'RB'],
  LW: ['LW', 'LM', 'ST', 'CF', 'CAM'],
  RW: ['RW', 'RM', 'ST', 'CF', 'CAM'],
  CF: ['CF', 'ST', 'CAM', 'LW', 'RW'],
  ST: ['ST', 'CF', 'LW', 'RW'],
};

const normalizeNameKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function playerCardToApexInit(params: {
  card: PlayerCard;
  idPrefix: string;
  idx: number;
  slotPos: string;
  baseX: number;
  baseY: number;
  effOvr: number;
  jerseyNumber: number;
  trainBoost?: number;
  isGk?: boolean;
}): ApexPlayerInit {
  const {
    card,
    idPrefix,
    idx,
    slotPos,
    baseX,
    baseY,
    effOvr,
    jerseyNumber,
    trainBoost = 0,
    isGk = false,
  } = params;
  const ovrDelta = effOvr - card.ovr;
  const trainBonus = Math.round(trainBoost * 0.6);
  const pixelProfile = resolvePixelPlayerProfile({
    ...card,
    position: isGk ? 'GK' : slotPos || card.position,
    ovr: effOvr,
    number: card.pixelData?.jerseyNumber,
  });

  return {
    id: `${idPrefix}_${idx}_${card.id}`,
    cardId: card.id,
    cardType: card.cardType,
    league: card.league,
    avatarUrl: card.avatarUrl,
    customFrameUrl: card.customFrameUrl,
    frameIncludesPortrait: card.frameIncludesPortrait,
    club: card.club,
    clubLogo: card.clubLogo,
    nation: card.nation,
    nationFlag: card.nationFlag,
    skillMoves: card.skillMoves,
    weakFoot: card.weakFoot,
    pixelProfile: {
      skinTone: pixelProfile.skinTone,
      hairTone: pixelProfile.hairTone,
      hairStyle: pixelProfile.hairStyle,
      bootTone: pixelProfile.bootTone,
      hasBeard: pixelProfile.hasBeard,
      hasHeadband: pixelProfile.hasHeadband,
      headbandColor: pixelProfile.headbandColor,
      heightScale: pixelProfile.heightScale,
      skillMoveName: pixelProfile.skillMoveName,
    },
    name: card.name,
    shortName: card.name.split(' ').pop() || card.name,
    number: isGk ? 1 : pixelProfile.jerseyNumber || jerseyNumber,
    pos: isGk ? 'GK' : slotPos || card.position,
    ovr: effOvr,
    pac: Math.max(44, (card.pac ?? effOvr) + ovrDelta + trainBonus),
    sho: Math.max(42, (card.sho ?? effOvr) + ovrDelta + trainBonus),
    pas: Math.max(44, (card.pas ?? effOvr) + ovrDelta + trainBonus),
    dri: Math.max(44, (card.dri ?? effOvr) + ovrDelta + trainBonus),
    def: Math.max(40, (card.def ?? effOvr) + ovrDelta + trainBonus),
    phy: Math.max(44, (card.phy ?? effOvr) + ovrDelta + trainBonus),
    baseX,
    baseY,
    isGk,
  };
}

export interface RealCardBotSquadSlot {
  slotPos: string;
  baseX: number;
  baseY: number;
  jerseyNumber: number;
  isGk: boolean;
}

export const DEFAULT_BOT_SLOTS: RealCardBotSquadSlot[] = [
  { slotPos: 'LW', baseX: 70, baseY: 20, jerseyNumber: 11, isGk: false },
  { slotPos: 'ST', baseX: 76, baseY: 50, jerseyNumber: 9, isGk: false },
  { slotPos: 'RW', baseX: 70, baseY: 80, jerseyNumber: 7, isGk: false },
  { slotPos: 'CM', baseX: 52, baseY: 30, jerseyNumber: 8, isGk: false },
  { slotPos: 'CDM', baseX: 42, baseY: 50, jerseyNumber: 6, isGk: false },
  { slotPos: 'CM', baseX: 52, baseY: 70, jerseyNumber: 10, isGk: false },
  { slotPos: 'LB', baseX: 26, baseY: 16, jerseyNumber: 3, isGk: false },
  { slotPos: 'CB', baseX: 24, baseY: 38, jerseyNumber: 4, isGk: false },
  { slotPos: 'CB', baseX: 24, baseY: 62, jerseyNumber: 5, isGk: false },
  { slotPos: 'RB', baseX: 26, baseY: 84, jerseyNumber: 2, isGk: false },
  { slotPos: 'GK', baseX: 7, baseY: 50, jerseyNumber: 1, isGk: true },
];

export function pickRealCardBotSquad(params: {
  tierIndex: number;
  botMinOvr: number;
  botMaxOvr: number;
}): {
  cards: PlayerCard[];
  apexStarters: ApexPlayerInit[];
  squadOvr: number;
} {
  const { tierIndex, botMinOvr, botMaxOvr } = params;
  const targetMid = Math.round((botMinOvr + botMaxOvr) * 0.5);
  const beginnerNerf = tierIndex === 0 ? 18 : tierIndex === 1 ? 11 : tierIndex === 2 ? 5 : 0;

  // Deduplicate pool while keeping diverse OVR versions when needed, preferring matching OVR range
  const usedNames = new Set<string>();
  const usedIds = new Set<string>();
  const chosenCards: PlayerCard[] = [];

  for (let i = 0; i < DEFAULT_BOT_SLOTS.length; i++) {
    const slot = DEFAULT_BOT_SLOTS[i];
    const compatList = SLOT_COMPATIBLE_POS[slot.slotPos] || [slot.slotPos];

    const scoreCandidate = (p: PlayerCard, strictOvr: boolean): boolean => {
      if (usedIds.has(p.id) || usedNames.has(normalizeNameKey(p.name))) return false;
      if (slot.isGk && p.position !== 'GK') return false;
      if (!slot.isGk && p.position === 'GK') return false;
      if (strictOvr && (p.ovr < botMinOvr - 4 || p.ovr > botMaxOvr + 4)) return false;
      return true;
    };

    let candidates = totyFeaturedPlayers.filter(
      (p) => scoreCandidate(p, true) && compatList.includes(p.position)
    );
    if (candidates.length === 0) {
      candidates = totyFeaturedPlayers.filter(
        (p) => scoreCandidate(p, false) && compatList.includes(p.position)
      );
    }
    if (candidates.length === 0) {
      candidates = totyFeaturedPlayers.filter((p) => scoreCandidate(p, false));
    }

    // Weight by how close the card's OVR is to the tier target + exact position bonus
    const ranked = candidates
      .map((p) => {
        const posPenalty = p.position === slot.slotPos ? 0 : compatList.indexOf(p.position) * 2.5 + 3;
        const ovrDist = Math.abs(p.ovr - targetMid);
        return { p, distScore: ovrDist + posPenalty + Math.random() * 6 };
      })
      .sort((a, b) => a.distScore - b.distScore);

    const pickPool = ranked.slice(0, Math.min(8, ranked.length));
    const picked =
      pickPool[Math.floor(Math.random() * pickPool.length)]?.p || totyFeaturedPlayers[i % totyFeaturedPlayers.length];

    usedIds.add(picked.id);
    usedNames.add(normalizeNameKey(picked.name));
    chosenCards.push(picked);
  }

  const apexStarters: ApexPlayerInit[] = chosenCards.map((card, idx) => {
    const slot = DEFAULT_BOT_SLOTS[idx];
    const gkExtraNerf = slot.isGk ? 14 : 0;
    const clampedBaseOvr = Math.max(
      botMinOvr - 2,
      Math.min(botMaxOvr + 2, card.ovr)
    );
    const effOvr = Math.max(58, clampedBaseOvr - beginnerNerf - gkExtraNerf);

    return playerCardToApexInit({
      card,
      idPrefix: 'bot',
      idx,
      slotPos: slot.slotPos,
      baseX: slot.baseX,
      baseY: slot.baseY,
      effOvr,
      jerseyNumber: slot.jerseyNumber,
      isGk: slot.isGk,
    });
  });

  const avgDisplayOvr = Math.round(
    chosenCards.reduce((sum, c) => sum + Math.max(botMinOvr, Math.min(botMaxOvr, c.ovr)), 0) /
      Math.max(1, chosenCards.length)
  );

  return {
    cards: chosenCards,
    apexStarters,
    squadOvr: Math.max(botMinOvr, Math.min(botMaxOvr, avgDisplayOvr)),
  };
}
