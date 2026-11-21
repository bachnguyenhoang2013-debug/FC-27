import React, { useId } from 'react';
import {
  CraftCardDrop,
  CraftInventory,
  CraftLeagueId,
  CraftPositionId,
  PlayerCard,
} from '../types/game';
import { DEFAULT_CRAFT_INVENTORY } from '../data/mockData';

export interface CraftLeagueMeta {
  id: CraftLeagueId;
  shortLabel: string;
  fullName: string;
  leagueKey: string;
}

export interface CraftPositionMeta {
  id: CraftPositionId;
  code: CraftPositionId;
  shortLabel: string;
  fullName: string;
  positions: PlayerCard['position'][];
}

export const CRAFT_LEAGUE_LIST: CraftLeagueMeta[] = [
  {
    id: 'premier_league',
    shortLabel: 'Ngoại Hạng Anh',
    fullName: 'Thẻ Mùa Giải Ngoại Hạng Anh',
    leagueKey: 'Premier League',
  },
  {
    id: 'laliga',
    shortLabel: 'LaLiga',
    fullName: 'Thẻ Mùa Giải LaLiga',
    leagueKey: 'La Liga',
  },
  {
    id: 'bundesliga',
    shortLabel: 'Bundesliga',
    fullName: 'Thẻ Mùa Giải Bundesliga',
    leagueKey: 'Bundesliga',
  },
  {
    id: 'ligue_1',
    shortLabel: 'Ligue 1 Pháp',
    fullName: 'Thẻ Mùa Giải Ligue 1 Pháp',
    leagueKey: 'Ligue 1',
  },
];

export const CRAFT_POSITION_LIST: CraftPositionMeta[] = [
  {
    id: 'ATT',
    code: 'ATT',
    shortLabel: 'Tấn Công (ATT)',
    fullName: 'Thẻ Vị Trí Tấn Công (ATT)',
    positions: ['ST', 'CF', 'LW', 'RW'],
  },
  {
    id: 'MID',
    code: 'MID',
    shortLabel: 'Tiền Vệ (MID)',
    fullName: 'Thẻ Vị Trí Tiền Vệ (MID)',
    positions: ['CAM', 'CM', 'CDM', 'LM', 'RM'],
  },
  {
    id: 'DEF',
    code: 'DEF',
    shortLabel: 'Phòng Thủ (DEF)',
    fullName: 'Thẻ Vị Trí Phòng Thủ (DEF)',
    positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'GK'],
  },
];

export function normalizeCraftInventory(inv?: CraftInventory): CraftInventory {
  return {
    leagues: {
      ...DEFAULT_CRAFT_INVENTORY.leagues,
      ...(inv?.leagues || {}),
    },
    positions: {
      ...DEFAULT_CRAFT_INVENTORY.positions,
      ...(inv?.positions || {}),
    },
  };
}

export function getCraftCardLabel(drop: CraftCardDrop): string {
  if (drop.kind === 'league') {
    const found = CRAFT_LEAGUE_LIST.find((l) => l.id === drop.id);
    return found ? found.fullName : 'Thẻ Mùa Giải';
  }
  const found = CRAFT_POSITION_LIST.find((p) => p.id === drop.id);
  return found ? found.fullName : 'Thẻ Vị Trí';
}

export function rollRandomCraftCardDrop(): CraftCardDrop {
  // Khi chơi 1 trận đấu: tỷ lệ tặng Thẻ Mùa Giải là 40% và Thẻ Vị Trí là 60%
  if (Math.random() < 0.4) {
    const pick = CRAFT_LEAGUE_LIST[Math.floor(Math.random() * CRAFT_LEAGUE_LIST.length)];
    return { kind: 'league', id: pick.id };
  }
  const pick = CRAFT_POSITION_LIST[Math.floor(Math.random() * CRAFT_POSITION_LIST.length)];
  return { kind: 'position', id: pick.id };
}

/**
 * Trọng số nghịch đảo theo OVR (85 -> 100):
 * OVR càng cao thì trọng số và tỷ lệ rơi càng thấp.
 */
export function getCraftOvrWeight(ovr: number): number {
  const clamped = Math.max(85, Math.min(100, ovr));
  return Math.max(2, Math.round(Math.pow(102 - clamped, 2.65)));
}

export function filterPlayersForCraft(
  allPlayers: PlayerCard[],
  leagueId: CraftLeagueId,
  positionId: CraftPositionId
): PlayerCard[] {
  const leagueMeta = CRAFT_LEAGUE_LIST.find((l) => l.id === leagueId);
  const posMeta = CRAFT_POSITION_LIST.find((p) => p.id === positionId);
  if (!leagueMeta || !posMeta) return [];

  const posSet = new Set<string>(posMeta.positions);
  const seen = new Set<string>();
  const matched: PlayerCard[] = [];

  for (const p of allPlayers) {
    if (seen.has(p.id)) continue;
    if (p.ovr < 85 || p.ovr > 100) continue;
    if (p.league === leagueMeta.leagueKey && posSet.has(p.position)) {
      seen.add(p.id);
      matched.push(p);
    }
  }

  return matched.sort((a, b) => a.ovr - b.ovr);
}

function weightedPickOne(pool: PlayerCard[]): PlayerCard {
  const weights = pool.map((p) => getCraftOvrWeight(p.ovr));
  const total = weights.reduce((acc, w) => acc + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Lọc và chọn ra đúng 2 cầu thủ (OVR 85–100) khớp Mùa Giải & Vị Trí.
 */
export function pickTwoCraftCandidates(
  allPlayers: PlayerCard[],
  leagueId: CraftLeagueId,
  positionId: CraftPositionId
): [PlayerCard, PlayerCard] | null {
  let pool = filterPlayersForCraft(allPlayers, leagueId, positionId);

  // Fallback an toàn nếu thiếu (luôn đảm bảo đủ ít nhất 2 cầu thủ 85-100)
  if (pool.length < 2) {
    const posMeta = CRAFT_POSITION_LIST.find((p) => p.id === positionId);
    const posSet = new Set<string>(posMeta?.positions || []);
    pool = allPlayers.filter((p) => p.ovr >= 85 && p.ovr <= 100 && posSet.has(p.position));
  }
  if (pool.length < 2) {
    pool = allPlayers.filter((p) => p.ovr >= 85 && p.ovr <= 100);
  }
  if (pool.length < 2) return null;

  const first = weightedPickOne(pool);
  const remaining = pool.filter((p) => p.id !== first.id);
  const second = weightedPickOne(remaining);

  // Sắp xếp theo OVR tăng dần để hiển thị trực quan
  return first.ovr <= second.ovr ? [first, second] : [second, first];
}

export function getCandidateWinPercentages(
  p1: PlayerCard,
  p2: PlayerCard
): [number, number] {
  const w1 = getCraftOvrWeight(p1.ovr);
  const w2 = getCraftOvrWeight(p2.ovr);
  const sum = w1 + w2;
  const pct1 = Math.max(1, Math.min(99, Math.round((w1 / sum) * 100)));
  return [pct1, 100 - pct1];
}

export function drawWinnerFromTwoCandidates(
  p1: PlayerCard,
  p2: PlayerCard
): PlayerCard {
  const w1 = getCraftOvrWeight(p1.ovr);
  const w2 = getCraftOvrWeight(p2.ovr);
  const roll = Math.random() * (w1 + w2);
  return roll < w1 ? p1 : p2;
}

interface CraftingCardBadgeProps {
  kind: 'league' | 'position';
  id: CraftLeagueId | CraftPositionId;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
  selected?: boolean;
  className?: string;
}

export const CraftingCardBadge: React.FC<CraftingCardBadgeProps> = ({
  kind,
  id,
  size = 'md',
  count,
  selected = false,
  className = '',
}) => {
  const rawUid = useId().replace(/:/g, '');

  const sizeClasses =
    size === 'sm'
      ? 'w-12 h-14'
      : size === 'lg'
      ? 'w-20 h-24'
      : 'w-16 h-20';

  const shieldPath = 'M36 3 L67 13.5 L67 57.5 L36 69 L5 57.5 L5 13.5 Z';
  const innerPath = 'M36 6.2 L64 15.8 L64 55.2 L36 65.8 L8 55.2 L8 15.8 Z';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${sizeClasses} ${
        selected ? 'scale-105 drop-shadow-[0_0_16px_rgba(250,204,21,0.85)]' : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]'
      } transition-transform ${className}`}
    >
      <svg viewBox="0 0 72 72" className="w-full h-full overflow-visible">
        <defs>
          {/* Premier League Shield Gradient */}
          <linearGradient id={`pl_bg_${rawUid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B3DFF" />
            <stop offset="56%" stopColor="#260666" />
            <stop offset="100%" stopColor="#66C4EE" />
          </linearGradient>

          {/* LaLiga Shield Gradient */}
          <linearGradient id={`ll_bg_${rawUid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF594E" />
            <stop offset="58%" stopColor="#B81610" />
            <stop offset="100%" stopColor="#FF978F" />
          </linearGradient>

          {/* Bundesliga Shield Gradient */}
          <linearGradient id={`bl_bg_${rawUid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9E0B12" />
            <stop offset="60%" stopColor="#490206" />
            <stop offset="100%" stopColor="#C82931" />
          </linearGradient>

          {/* Ligue 1 Shield Gradient */}
          <linearGradient id={`l1_bg_${rawUid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E4BF0" />
            <stop offset="58%" stopColor="#041354" />
            <stop offset="100%" stopColor="#9A89F2" />
          </linearGradient>

          {/* Position (ATT / MID / DEF) Shield Gradient */}
          <linearGradient id={`pos_bg_${rawUid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B2BB8" />
            <stop offset="58%" stopColor="#040D42" />
            <stop offset="100%" stopColor="#72AAFA" />
          </linearGradient>

          {/* Metallic Gold-White Text Fill for ATT / MID / DEF */}
          <linearGradient id={`pos_txt_${rawUid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="48%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Subtle Diagonal Gloss */}
          <linearGradient id={`gloss_${rawUid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Crest Frame */}
        <path
          d={shieldPath}
          fill={
            kind === 'position'
              ? `url(#pos_bg_${rawUid})`
              : id === 'premier_league'
              ? `url(#pl_bg_${rawUid})`
              : id === 'laliga'
              ? `url(#ll_bg_${rawUid})`
              : id === 'bundesliga'
              ? `url(#bl_bg_${rawUid})`
              : `url(#l1_bg_${rawUid})`
          }
          stroke={selected ? '#FACC15' : 'rgba(255,255,255,0.68)'}
          strokeWidth={selected ? '2.6' : '1.6'}
          strokeLinejoin="round"
        />

        {/* Inner Bevel Line */}
        <path
          d={innerPath}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Top-left Glass Sheen */}
        <path d="M36 5 L65 15 L65 34 L7 44 L7 15 Z" fill={`url(#gloss_${rawUid})`} />

        {/* =============================================================== */}
        {/* CREST EMBLEMS                                                   */}
        {/* =============================================================== */}
        {kind === 'league' && id === 'premier_league' && (
          <image
            href="/assets/aistudio/Premier_League_ad9034c5.png"
            x="17"
            y="16"
            width="38"
            height="38"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {kind === 'league' && id === 'laliga' && (
          <image
            href="/assets/aistudio/La_Liga_bcae3f8f.png"
            x="17"
            y="16"
            width="38"
            height="38"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {kind === 'league' && id === 'bundesliga' && (
          <image
            href="/assets/aistudio/Bundesliga_6ac485c7.png"
            x="18"
            y="17"
            width="36"
            height="36"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {kind === 'league' && id === 'ligue_1' && (
          <image
            href="/assets/aistudio/Ligue_1_719d10f0.png"
            x="17"
            y="16"
            width="38"
            height="38"
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {kind === 'position' && (
          <text
            x="36"
            y="41.5"
            textAnchor="middle"
            fill={`url(#pos_txt_${rawUid})`}
            fontSize="16.5"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="0.8"
          >
            {id}
          </text>
        )}
      </svg>

      {typeof count === 'number' && (
        <span
          className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-black leading-none tabular-nums border ${
            count > 0
              ? 'bg-yellow-400 text-zinc-950 border-yellow-200 shadow-sm'
              : 'bg-zinc-900/95 text-zinc-400 border-white/15'
          }`}
        >
          x{count}
        </span>
      )}
    </div>
  );
};
