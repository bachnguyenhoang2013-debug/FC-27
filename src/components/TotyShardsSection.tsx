import React, { useState, useMemo, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Filter,
  Lock,
  Minus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  totyFeaturedPlayers,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
} from '../data/mockData';
import { FCCard } from './FCCard';
import { soundService } from '../services/sound';
import {
  addOwnedPlayerCopies,
  getOwnedCopyCountMap,
  removeOwnedPlayerCopies,
} from '../utils/squadUtils';

export const STAR_SHARD_SMALL_ICON = '/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png';
export const STAR_SHARD_LARGE_ICON = '/assets/aistudio/currencylarge_STAR_SHARD_3dbbba71.png';
export const STAR_SIGNINGS_BTN_BG = '/assets/aistudio/n_t_trao___i_m_nh_8ce58afb.png';
export const STAR_SIGNINGS_CONTRACT_IMG = '/assets/aistudio/_nh_h_p___ng_2bfd946d.png';

export type GalleryFilter =
  | 'ALL'
  | 'UTOTY_TOTY'
  | 'ICONS'
  | 'TOTY26_HM'
  | 'FUTURE_STARS'
  | 'EURO_2024'
  | 'LALIGA'
  | 'GINGA'
  | 'BUNDESLIGA'
  | 'CHAMPIONS'
  | 'CONMEBOL'
  | '85_92'
  | '93_98'
  | '99_PLUS';

interface TotyShardsSectionProps {
  user: UserProfile;
  defaultFilter?: GalleryFilter;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onInspectPlayer: (player: PlayerCard) => void;
  onClaimedPlayerReveal: (player: PlayerCard) => void;
  onShowToast: (text: string, tone?: 'success' | 'error') => void;
}

export const SHARD_YIELD_BRACKETS: Array<{ range: string; shards: number }> = [
  { range: 'OVR 60–74', shards: 5 },
  { range: 'OVR 75–79', shards: 10 },
  { range: 'OVR 80–84', shards: 20 },
  { range: 'OVR 85–89', shards: 45 },
  { range: 'OVR 90–92', shards: 90 },
  { range: 'OVR 93–95', shards: 150 },
  { range: 'OVR 96–98', shards: 220 },
  { range: 'OVR 99–101', shards: 320 },
  { range: 'OVR 102+', shards: 540 },
];

export function getPlayerShardYield(ovr: number): number {
  if (ovr >= 102) return 540;
  if (ovr >= 99) return 320;
  if (ovr >= 96) return 220;
  if (ovr >= 93) return 150;
  if (ovr >= 90) return 90;
  if (ovr >= 85) return 45;
  if (ovr >= 80) return 20;
  if (ovr >= 75) return 10;
  return 5;
}

/**
 * Loại trừ khỏi Trao Đổi Mảnh:
 * - Thẻ trao đổi (Exchange / Club Exchange / Star Pass / Giftcode / Box)
 * - Thẻ chữ ký (Signature Archive / sig_icon_ / Ballon d'Or signature)
 * - Thẻ biên niên sử (Ronaldo Chronicles / Vietnam Chronicles / Classics / Icon Chronicles)
 * - Thẻ khởi đầu (WELCOME / untradeable gift)
 */
export function isExcludedFromShardExchange(player: PlayerCard): boolean {
  if (
    player.isExchangeExclusive ||
    player.isUntradeableOnly ||
    player.clubExchangeCost !== undefined
  ) {
    return true;
  }
  if (
    player.cardType === 'RONALDO_CHRONICLES' ||
    player.cardType === 'VIETNAM_CHRONICLES' ||
    player.cardType === 'CLASSICS' ||
    player.cardType === 'WELCOME' ||
    player.cardType === 'BALLON_DOR'
  ) {
    return true;
  }
  if (player.league === 'Signature Archive') {
    return true;
  }
  const id = player.id;
  if (
    id.startsWith('sig_icon_') ||
    id.startsWith('chronicles_icon_') ||
    id.startsWith('ultimate_icon_') ||
    id.startsWith('sp_ginga_') ||
    id.startsWith('star_pass_') ||
    id.startsWith('toty26_hm_exchange_') ||
    id.startsWith('ballon_dor_') ||
    id.startsWith('giftcode_') ||
    id.startsWith('gift_') ||
    id.startsWith('shop_featured_') ||
    id.startsWith('starter_97_') ||
    id.startsWith('welcome_') ||
    id === 'box_sig_van_der_sar_105' ||
    id === 'box_ginga_garrincha_106'
  ) {
    return true;
  }
  return false;
}

const SHARD_PLAYER_COST_MULTIPLIER = 1.7;

export function getPlayerShardCost(player: PlayerCard): number {
  const ovr = player.ovr;
  const isIcon =
    player.cardType === 'UTOTY_ICON' ||
    player.cardType === 'TOTY_ICON' ||
    player.cardType === 'UTOTY_ICONS' ||
    player.cardType === 'CLASSICS' ||
    player.cardType === 'GINGA_ICON' ||
    (player.club || '').toLowerCase().includes('icon');
  let baseCost = 40;
  if (ovr < 75) {
    baseCost = 10;
  } else if (ovr < 80) {
    baseCost = 18;
  } else if (ovr < 85) {
    baseCost = 28;
  } else if (ovr <= 89) {
    baseCost = 35 + Math.max(0, ovr - 85) * 10;
  } else if (ovr <= 92) {
    baseCost = 90 + (ovr - 90) * 30;
  } else if (ovr <= 95) {
    baseCost = 190 + (ovr - 93) * 45;
  } else if (ovr <= 98) {
    baseCost = 350 + (ovr - 96) * 80;
  } else if (ovr <= 101) {
    baseCost = 620 + (ovr - 99) * 140;
  } else {
    baseCost = 1050 + (ovr - 102) * 175;
  }
  if (isIcon) {
    baseCost = baseCost * 1.1;
  }
  return Math.round((baseCost * SHARD_PLAYER_COST_MULTIPLIER) / 5) * 5;
}

const PROGRAM_FILTER_OPTIONS: Array<{ id: GalleryFilter; label: string }> = [
  { id: 'ALL', label: 'Tất cả mùa' },
  { id: 'GINGA', label: 'Ginga 26' },
  { id: 'BUNDESLIGA', label: 'Bundesliga' },
  { id: 'CHAMPIONS', label: 'Champions: Juventus' },
  { id: 'CONMEBOL', label: 'CONMEBOL Libertadores' },
  { id: 'UTOTY_TOTY', label: 'UTOTY / TOTY' },
  { id: 'ICONS', label: 'TOTY Icons' },
  { id: 'TOTY26_HM', label: 'TOTY HM' },
  { id: 'FUTURE_STARS', label: 'Future Stars' },
  { id: 'LALIGA', label: 'LALIGA EA SPORTS' },
  { id: 'EURO_2024', label: 'EURO 2024' },
];

const POSITION_ORDER = [
  'GK',
  'LWB',
  'LB',
  'CB',
  'RB',
  'RWB',
  'CDM',
  'CM',
  'CAM',
  'LM',
  'RM',
  'LW',
  'RW',
  'CF',
  'ST',
];

export const TotyShardsSection: React.FC<TotyShardsSectionProps> = ({
  user,
  defaultFilter = 'ALL',
  onUpdateUser,
  onInspectPlayer,
  onClaimedPlayerReveal,
  onShowToast,
}) => {
  const totyShards = user.totyShards ?? 0;
  const watchlistIds = useMemo(
    () => (Array.isArray(user.shardWatchlistIds) ? user.shardWatchlistIds : []),
    [user.shardWatchlistIds]
  );
  const watchlistSet = useMemo(() => new Set(watchlistIds), [watchlistIds]);

  const [activeTab, setActiveTab] = useState<'players' | 'my_players'>('players');
  const [sortOrder, setSortOrder] = useState<'ovr_desc' | 'ovr_asc'>('ovr_desc');
  const [watchlistOnly, setWatchlistOnly] = useState<boolean>(false);

  // Committed Search Filters (Tab 1)
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>(defaultFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [nationFilter, setNationFilter] = useState<string>('ALL');
  const [ovrMin, setOvrMin] = useState<string>('');
  const [ovrMax, setOvrMax] = useState<string>('');

  // Dedicated Search Modal state
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [activePicker, setActivePicker] = useState<'program' | 'position' | 'nation' | null>(null);
  const [draftName, setDraftName] = useState<string>('');
  const [draftOvrMin, setDraftOvrMin] = useState<string>('');
  const [draftOvrMax, setDraftOvrMax] = useState<string>('');
  const [draftProgram, setDraftProgram] = useState<GalleryFilter>('ALL');
  const [draftPosition, setDraftPosition] = useState<string>('ALL');
  const [draftNation, setDraftNation] = useState<string>('ALL');

  const [selectedCatalogPlayerId, setSelectedCatalogPlayerId] = useState<string | null>(null);

  // My Players release state: playerId -> count of copies selected to release
  const [selectedCopiesMap, setSelectedCopiesMap] = useState<Record<string, number>>({});
  const [focusedOwnedPlayerId, setFocusedOwnedPlayerId] = useState<string | null>(null);
  const [myPlayersAvailableOnly, setMyPlayersAvailableOnly] = useState<boolean>(false);

  // Dismantle Pack Opening Animation state (matches standard pack breathing -> tear + flash -> reveal)
  const [dismantlePackAnim, setDismantlePackAnim] = useState<{
    count: number;
    shards: number;
    phase: 'breathing' | 'revealed';
  } | null>(null);
  const [dismantleIsOpening, setDismantleIsOpening] = useState<boolean>(false);
  const [dismantleIsFlashing, setDismantleIsFlashing] = useState<boolean>(false);
  const dismantleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dismantleTimerRef.current) {
        window.clearTimeout(dismantleTimerRef.current);
      }
    };
  }, []);

  const ownedIdList = useMemo(
    () => (user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS),
    [user.ownedPlayerIds]
  );
  const ownedCopyCounts = useMemo(() => getOwnedCopyCountMap(ownedIdList), [ownedIdList]);
  const starterSet = useMemo(
    () => new Set(user.starterIds?.length === 11 ? user.starterIds : STARTER_STARTER_IDS),
    [user.starterIds]
  );

  const uniqueEligiblePlayers = useMemo(() => {
    const seen = new Set<string>();
    const list: PlayerCard[] = [];
    for (const p of totyFeaturedPlayers) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      if (!isExcludedFromShardExchange(p)) {
        list.push(p);
      }
    }
    return list;
  }, []);

  const availablePositions = useMemo(() => {
    const posSet = new Set<string>();
    uniqueEligiblePlayers.forEach((p) => {
      if (p.position) posSet.add(p.position.trim().toUpperCase());
    });
    return Array.from(posSet).sort((a, b) => {
      const ia = POSITION_ORDER.indexOf(a);
      const ib = POSITION_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [uniqueEligiblePlayers]);

  const availableNations = useMemo(() => {
    const nationSet = new Set<string>();
    uniqueEligiblePlayers.forEach((p) => {
      if (p.nation) nationSet.add(p.nation.trim());
    });
    return Array.from(nationSet).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [uniqueEligiblePlayers]);

  const playerById = useMemo(() => {
    const map = new Map<string, PlayerCard>();
    uniqueEligiblePlayers.forEach((p) => map.set(p.id, p));
    return map;
  }, [uniqueEligiblePlayers]);

  const openSearchModal = () => {
    soundService.playClick();
    setDraftName(searchQuery);
    setDraftOvrMin(ovrMin);
    setDraftOvrMax(ovrMax);
    setDraftProgram(galleryFilter);
    setDraftPosition(positionFilter);
    setDraftNation(nationFilter);
    setActivePicker(null);
    setShowSearchModal(true);
  };

  const applySearchModal = () => {
    soundService.playConfirmSelection();
    setSearchQuery(draftName.trim());
    setOvrMin(draftOvrMin.trim());
    setOvrMax(draftOvrMax.trim());
    setGalleryFilter(draftProgram);
    setPositionFilter(draftPosition);
    setNationFilter(draftNation);
    setShowSearchModal(false);
    setActivePicker(null);
  };

  const resetAllSearchFilters = () => {
    soundService.playClick();
    setDraftName('');
    setDraftOvrMin('');
    setDraftOvrMax('');
    setDraftProgram('ALL');
    setDraftPosition('ALL');
    setDraftNation('ALL');
    setActivePicker(null);
  };

  const clearCommittedSearchFilters = () => {
    soundService.playClick();
    setSearchQuery('');
    setOvrMin('');
    setOvrMax('');
    setGalleryFilter('ALL');
    setPositionFilter('ALL');
    setNationFilter('ALL');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(ovrMin.trim()) ||
    Boolean(ovrMax.trim()) ||
    galleryFilter !== 'ALL' ||
    positionFilter !== 'ALL' ||
    nationFilter !== 'ALL';

  // Tab 1 catalog list
  const shardRewardPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minVal = ovrMin.trim() ? Number(ovrMin) : null;
    const maxVal = ovrMax.trim() ? Number(ovrMax) : null;

    const list = uniqueEligiblePlayers.filter((p) => {
      if (watchlistOnly && !watchlistSet.has(p.id)) return false;
      if (galleryFilter === 'UTOTY_TOTY' && p.cardType !== 'UTOTY' && p.cardType !== 'TOTY')
        return false;
      if (
        galleryFilter === 'ICONS' &&
        p.cardType !== 'UTOTY_ICON' &&
        p.cardType !== 'UTOTY_ICONS' &&
        p.cardType !== 'TOTY_ICON'
      )
        return false;
      if (galleryFilter === 'TOTY26_HM' && p.cardType !== 'TOTY26_HM') return false;
      if (galleryFilter === 'FUTURE_STARS' && p.cardType !== 'FUTURE_STARS') return false;
      if (galleryFilter === 'EURO_2024' && p.cardType !== 'EURO_2024') return false;
      if (galleryFilter === 'LALIGA' && p.cardType !== 'LALIGA') return false;
      if (galleryFilter === 'GINGA' && p.cardType !== 'GINGA' && p.cardType !== 'GINGA_ICON')
        return false;
      if (galleryFilter === 'BUNDESLIGA' && p.cardType !== 'BUNDESLIGA') return false;
      if (galleryFilter === 'CHAMPIONS' && p.cardType !== 'CHAMPIONS_JUVENTUS') return false;
      if (galleryFilter === 'CONMEBOL' && p.cardType !== 'CONMEBOL_LIBERTADORES') return false;
      if (galleryFilter === '85_92' && (p.ovr < 85 || p.ovr > 92)) return false;
      if (galleryFilter === '93_98' && (p.ovr < 93 || p.ovr > 98)) return false;
      if (galleryFilter === '99_PLUS' && p.ovr < 99) return false;
      if (positionFilter !== 'ALL' && p.position.trim().toUpperCase() !== positionFilter)
        return false;
      if (nationFilter !== 'ALL' && p.nation.trim().toLowerCase() !== nationFilter.toLowerCase())
        return false;
      if (minVal !== null && !Number.isNaN(minVal) && p.ovr < minVal) return false;
      if (maxVal !== null && !Number.isNaN(maxVal) && p.ovr > maxVal) return false;
      if (q) {
        const match =
          p.name.toLowerCase().includes(q) ||
          (p.fullName && p.fullName.toLowerCase().includes(q)) ||
          p.position.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q) ||
          p.nation.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
    return list.sort((a, b) =>
      sortOrder === 'ovr_asc' ? a.ovr - b.ovr : b.ovr - a.ovr
    );
  }, [
    uniqueEligiblePlayers,
    galleryFilter,
    searchQuery,
    positionFilter,
    nationFilter,
    ovrMin,
    ovrMax,
    watchlistOnly,
    watchlistSet,
    sortOrder,
  ]);

  const selectedCatalogPlayer = useMemo(
    () => (selectedCatalogPlayerId ? playerById.get(selectedCatalogPlayerId) ?? null : null),
    [selectedCatalogPlayerId, playerById]
  );

  // Tab 2 owned players list with exact available copy counts
  const ownedExchangeEntries = useMemo(() => {
    const entries: Array<{
      player: PlayerCard;
      totalCopies: number;
      availableCopies: number;
      lockedByStarter: boolean;
      yieldPerCopy: number;
    }> = [];

    for (const p of uniqueEligiblePlayers) {
      const totalCopies = ownedCopyCounts.get(p.id) ?? 0;
      if (totalCopies <= 0) continue;
      const inStarter = starterSet.has(p.id);
      const availableCopies = inStarter ? Math.max(0, totalCopies - 1) : totalCopies;
      const lockedByStarter = inStarter && availableCopies === 0;
      if (myPlayersAvailableOnly && availableCopies === 0) continue;
      entries.push({
        player: p,
        totalCopies,
        availableCopies,
        lockedByStarter,
        yieldPerCopy: getPlayerShardYield(p.ovr),
      });
    }

    entries.sort((a, b) => {
      if (a.lockedByStarter !== b.lockedByStarter) return a.lockedByStarter ? 1 : -1;
      return sortOrder === 'ovr_asc'
        ? a.player.ovr - b.player.ovr
        : b.player.ovr - a.player.ovr;
    });
    return entries;
  }, [uniqueEligiblePlayers, ownedCopyCounts, starterSet, myPlayersAvailableOnly, sortOrder]);

  // Sanitized selection map clamped to currently available copies
  const sanitizedSelectedCopies = useMemo(() => {
    const next: Record<string, number> = {};
    for (const entry of ownedExchangeEntries) {
      const chosen = selectedCopiesMap[entry.player.id] ?? 0;
      const clamped = Math.min(entry.availableCopies, Math.max(0, chosen));
      if (clamped > 0) {
        next[entry.player.id] = clamped;
      }
    }
    return next;
  }, [ownedExchangeEntries, selectedCopiesMap]);

  const totalSelectedCopies = useMemo(
    () => Object.values(sanitizedSelectedCopies).reduce((sum, n) => sum + n, 0),
    [sanitizedSelectedCopies]
  );

  const totalPreviewShards = useMemo(() => {
    let total = 0;
    for (const [id, qty] of Object.entries(sanitizedSelectedCopies)) {
      const p = playerById.get(id);
      if (p) total += getPlayerShardYield(p.ovr) * qty;
    }
    return total;
  }, [sanitizedSelectedCopies, playerById]);

  const handleToggleWatchlist = (player: PlayerCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundService.playClick();
    if (watchlistSet.has(player.id)) {
      onUpdateUser({
        shardWatchlistIds: watchlistIds.filter((id) => id !== player.id),
      });
      return;
    }
    if (watchlistIds.length >= 50) {
      onShowToast('Danh sách Theo Dõi đã đạt giới hạn 50/50 cầu thủ!', 'error');
      return;
    }
    onUpdateUser({
      shardWatchlistIds: [...watchlistIds, player.id],
    });
  };

  const handleRedeemPlayerWithShards = (player: PlayerCard) => {
    soundService.playClick();
    const cost = getPlayerShardCost(player);
    if (totyShards < cost) {
      onShowToast(
        `Chưa đủ Mảnh Trao Đổi! Cần ${cost.toLocaleString('vi-VN')} Mảnh (Hiện có ${totyShards.toLocaleString('vi-VN')}).`,
        'error'
      );
      return;
    }

    soundService.playConfirmSelection();

    onUpdateUser((prev) => {
      const curOwned = prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS;
      const curShards = prev.totyShards ?? 0;
      if (curShards < cost) return {};
      return {
        totyShards: curShards - cost,
        ownedPlayerIds: addOwnedPlayerCopies(curOwned, [player.id]),
      };
    });

    onClaimedPlayerReveal(player);
    onShowToast(
      `Ký hợp đồng thành công ${player.name} (OVR ${player.ovr}) với ${cost.toLocaleString('vi-VN')} Mảnh!`
    );
  };

  const adjustSelectedCopies = (playerId: string, maxAvailable: number, delta: number, playerName: string) => {
    soundService.playClick();
    if (maxAvailable <= 0) {
      onShowToast(
        `${playerName} đang trong 11 cầu thủ Đá Chính! Hãy đưa xuống Dự Bị trong Đội Hình nếu muốn phân tách.`,
        'error'
      );
      return;
    }

    const currentQty = sanitizedSelectedCopies[playerId] ?? 0;
    const targetQty = Math.max(0, Math.min(maxAvailable, currentQty + delta));
    const actualDelta = targetQty - currentQty;
    if (actualDelta === 0) return;

    if (actualDelta > 0) {
      const remainingClubSize = ownedIdList.length - (totalSelectedCopies + actualDelta);
      if (remainingClubSize < 11) {
        onShowToast('CLB phải giữ tối thiểu 11 cầu thủ để thi đấu!', 'error');
        return;
      }
    }

    setSelectedCopiesMap((prev) => {
      const copy = { ...prev };
      if (targetQty <= 0) {
        delete copy[playerId];
      } else {
        copy[playerId] = targetQty;
      }
      return copy;
    });
    if (targetQty > 0) {
      setFocusedOwnedPlayerId(playerId);
    } else if (focusedOwnedPlayerId === playerId) {
      setFocusedOwnedPlayerId(null);
    }
  };

  const handleTileClickMyPlayers = (entry: {
    player: PlayerCard;
    availableCopies: number;
  }) => {
    const cur = sanitizedSelectedCopies[entry.player.id] ?? 0;
    if (entry.availableCopies <= 0) {
      adjustSelectedCopies(entry.player.id, 0, 1, entry.player.name);
      return;
    }
    if (cur === 0) {
      adjustSelectedCopies(entry.player.id, entry.availableCopies, 1, entry.player.name);
    } else if (focusedOwnedPlayerId !== entry.player.id && entry.availableCopies > 1) {
      soundService.playClick();
      setFocusedOwnedPlayerId(entry.player.id);
    } else {
      adjustSelectedCopies(entry.player.id, entry.availableCopies, -cur, entry.player.name);
    }
  };

  const handleAutoSelectRelease = () => {
    soundService.playClick();
    const maxRemovable = Math.max(0, ownedIdList.length - 11);
    if (maxRemovable <= 0) {
      onShowToast('CLB cần giữ tối thiểu 11 cầu thủ để thi đấu!', 'error');
      return;
    }

    // Prioritize extra duplicate copies first, then lowest OVR reserve cards
    const sortedCandidates = [...ownedExchangeEntries]
      .filter((e) => e.availableCopies > 0)
      .sort((a, b) => {
        const aDup = a.totalCopies > 1 ? 0 : 1;
        const bDup = b.totalCopies > 1 ? 0 : 1;
        if (aDup !== bDup) return aDup - bDup;
        return a.player.ovr - b.player.ovr;
      });

    if (sortedCandidates.length === 0) {
      onShowToast('Không có cầu thủ dự bị khả dụng để tự động chọn!', 'error');
      return;
    }

    const nextMap: Record<string, number> = {};
    let pickedTotal = 0;
    const cap = Math.min(maxRemovable, 12);
    let lastFocused: string | null = null;

    for (const entry of sortedCandidates) {
      if (pickedTotal >= cap) break;
      const spareOnly =
        entry.totalCopies > 1 && starterSet.has(entry.player.id)
          ? entry.availableCopies
          : entry.availableCopies;
      const take = Math.min(spareOnly, cap - pickedTotal);
      if (take > 0) {
        nextMap[entry.player.id] = take;
        pickedTotal += take;
        lastFocused = entry.player.id;
      }
    }

    setSelectedCopiesMap(nextMap);
    setFocusedOwnedPlayerId(lastFocused);
    onShowToast(`Đã tự động chọn ${pickedTotal} thẻ dự bị để phân tách!`);
  };

  const handleReleaseToShards = () => {
    soundService.playClick();
    if (totalSelectedCopies === 0) {
      onShowToast('Hãy chọn ít nhất 1 cầu thủ dự bị để phân tách nhận Mảnh!', 'error');
      return;
    }
    if (ownedIdList.length - totalSelectedCopies < 11) {
      onShowToast('CLB phải giữ tối thiểu 11 cầu thủ để thi đấu!', 'error');
      return;
    }

    const removals = Object.entries(sanitizedSelectedCopies).map(([playerId, count]) => ({
      playerId,
      count,
    }));
    const gainedShards = totalPreviewShards;
    const countReleased = totalSelectedCopies;

    const nextOwned = removeOwnedPlayerCopies(ownedIdList, removals);
    const remainingCounts = getOwnedCopyCountMap(nextOwned);

    const nextTradeable = (user.tradeablePlayerIds || []).filter(
      (id) => (remainingCounts.get(id) ?? 0) > 0
    );
    const nextBench = (user.benchIds || []).filter(
      (id) => (remainingCounts.get(id) ?? 0) > 0
    );

    onUpdateUser({
      ownedPlayerIds: nextOwned,
      tradeablePlayerIds: nextTradeable,
      benchIds: nextBench,
      totyShards: totyShards + gainedShards,
    });

    setSelectedCopiesMap({});
    setFocusedOwnedPlayerId(null);

    if (dismantleTimerRef.current) {
      window.clearTimeout(dismantleTimerRef.current);
      dismantleTimerRef.current = null;
    }
    setDismantleIsOpening(false);
    setDismantleIsFlashing(false);
    setDismantlePackAnim({
      count: countReleased,
      shards: gainedShards,
      phase: 'breathing',
    });

    onShowToast(
      `Phân tách thành công ${countReleased} thẻ · Nhận +${gainedShards.toLocaleString('vi-VN')} Mảnh Trao Đổi!`
    );
  };

  const triggerDismantlePackTear = () => {
    if (!dismantlePackAnim || dismantlePackAnim.phase !== 'breathing' || dismantleIsOpening) {
      return;
    }
    setDismantleIsOpening(true);
    soundService.playPackOpenAnimationSfx();
    soundService.playPackTear();
    setDismantleIsFlashing(true);

    if (dismantleTimerRef.current) {
      window.clearTimeout(dismantleTimerRef.current);
    }
    dismantleTimerRef.current = window.setTimeout(() => {
      dismantleTimerRef.current = null;
      setDismantleIsFlashing(false);
      setDismantleIsOpening(false);
      revealDismantlePack();
    }, 1000);
  };

  const revealDismantlePack = () => {
    if (dismantleTimerRef.current) {
      window.clearTimeout(dismantleTimerRef.current);
      dismantleTimerRef.current = null;
    }
    soundService.playPackOpenFanfare();
    soundService.playCoins();
    try {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.56 },
        colors: ['#22d3ee', '#34d399', '#facc15', '#ffffff'],
      });
    } catch {
      // ignore
    }
    setDismantlePackAnim((prev) => (prev ? { ...prev, phase: 'revealed' } : null));
  };

  const focusedEntry = useMemo(
    () =>
      focusedOwnedPlayerId
        ? ownedExchangeEntries.find(
            (e) =>
              e.player.id === focusedOwnedPlayerId &&
              (sanitizedSelectedCopies[e.player.id] ?? 0) > 0
          ) ?? null
        : null,
    [focusedOwnedPlayerId, ownedExchangeEntries, sanitizedSelectedCopies]
  );

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full max-w-[1380px] mx-auto flex flex-col rounded-2xl overflow-hidden border border-cyan-400/25 bg-gradient-to-b from-[#081020] via-[#060c18] to-[#041218] shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
    >
      {/* TOP CONTROL STRIP */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-[#091326]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* OVR Sort Pill */}
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setSortOrder((prev) => (prev === 'ovr_desc' ? 'ovr_asc' : 'ovr_desc'));
            }}
            className="h-9 px-4 rounded-full bg-[#0d1930] hover:bg-[#132240] border border-cyan-300/35 text-xs font-bold text-white flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <span>{sortOrder === 'ovr_desc' ? 'OVR ↓' : 'OVR ↑'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-300" />
          </button>

          {activeTab === 'players' && (
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setWatchlistOnly((prev) => !prev);
              }}
              className="h-9 px-3 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs font-bold tracking-wide text-slate-200 cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  watchlistOnly
                    ? 'bg-emerald-400 border-emerald-200 text-slate-950'
                    : 'bg-black/40 border-slate-400/70'
                }`}
              >
                {watchlistOnly && <Check className="w-3 h-3 stroke-[3]" />}
              </span>
              <span className="uppercase">THEO DÕI: {watchlistIds.length}/50</span>
            </button>
          )}

          {/* Shard Balance Pill */}
          <div className="h-9 px-3.5 rounded-full bg-[#060f1d] border border-cyan-400/40 flex items-center gap-2">
            <img
              src={STAR_SHARD_SMALL_ICON}
              alt="Mảnh Trao Đổi"
              className="w-4 h-4 object-contain"
            />
            <span className="font-mono font-black text-xs sm:text-sm text-cyan-300 tabular-nums">
              {totyShards.toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'players' ? (
            <button
              type="button"
              onClick={openSearchModal}
              style={{
                backgroundImage: `url('${STAR_SIGNINGS_BTN_BG}')`,
                backgroundSize: '100% 100%',
              }}
              className="h-9 px-6 rounded-full font-cruyff font-black text-xs text-slate-950 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 transition-all shadow-[0_0_18px_rgba(34,211,238,0.35)]"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>TÌM KIẾM</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setMyPlayersAvailableOnly((prev) => !prev);
              }}
              className={`h-9 px-4 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                myPlayersAvailableOnly
                  ? 'bg-cyan-400/20 border-cyan-300 text-cyan-200'
                  : 'bg-[#0b172c] border-cyan-400/50 text-white hover:bg-cyan-400/10'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-cyan-300" />
              <span>{myPlayersAvailableOnly ? 'CHỈ DỰ BỊ' : 'LỌC TẤT CẢ'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SEARCH FILTER CHIPS BAR */}
      {activeTab === 'players' && hasActiveFilters && (
        <div className="px-4 sm:px-6 py-2 bg-[#060d1b] border-b border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-bold text-slate-400 uppercase tracking-wider">Đang lọc:</span>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-cyan-500/30"
            >
              <span>Tên: {searchQuery}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {(ovrMin.trim() || ovrMax.trim()) && (
            <button
              type="button"
              onClick={() => {
                setOvrMin('');
                setOvrMax('');
              }}
              className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-cyan-500/30"
            >
              <span>
                OVR: {ovrMin.trim() || '—'} – {ovrMax.trim() || '—'}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}
          {galleryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setGalleryFilter('ALL')}
              className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-cyan-500/30"
            >
              <span>
                Mùa: {PROGRAM_FILTER_OPTIONS.find((o) => o.id === galleryFilter)?.label || galleryFilter}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}
          {positionFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setPositionFilter('ALL')}
              className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30"
            >
              <span>Vị trí: {positionFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {nationFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setNationFilter('ALL')}
              className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30"
            >
              <span>Quốc gia: {nationFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={clearCommittedSearchFilters}
            className="ml-auto text-[11px] font-bold text-rose-300 hover:underline cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* MAIN CONTENT BODY */}
      {activeTab === 'players' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 sm:p-5 min-h-[500px] max-h-[68vh] overflow-hidden">
          {/* PINNED LEFT CONTRACT ENTRANCE + SCROLLABLE CENTER PLAYER GRID */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col sm:flex-row gap-3.5 overflow-hidden">
            {/* Fixed Left Entrance Card (stays stationary when scrolling player grid) */}
            <div className="w-full sm:w-[172px] md:w-[190px] shrink-0 relative rounded-xl overflow-hidden border border-cyan-400/45 bg-[#091224] flex flex-col justify-between min-h-[168px] sm:min-h-[300px] shadow-[0_0_25px_rgba(34,211,238,0.14)]">
              <img
                src={STAR_SIGNINGS_CONTRACT_IMG}
                alt="Hợp Đồng Ngôi Sao"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050a14] via-[#060d1b]/35 to-transparent" />
              <div className="relative z-10 p-3 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-black/65 border border-cyan-400/45 text-[9px] font-black text-cyan-200 uppercase tracking-widest">
                  HỢP ĐỒNG
                </span>
                <img
                  src={STAR_SHARD_LARGE_ICON}
                  alt="Star Shard"
                  className="w-7 h-7 object-contain drop-shadow"
                />
              </div>
              <div className="relative z-10 p-3.5 space-y-2.5">
                <div>
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                    {hasActiveFilters || watchlistOnly ? 'KẾT QUẢ LỌC' : 'TẤT CẢ CẦU THỦ'}
                  </div>
                  <div className="font-mono font-black text-2xl sm:text-3xl text-white tabular-nums leading-tight">
                    {shardRewardPlayers.length.toLocaleString('vi-VN')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openSearchModal}
                  style={{
                    backgroundImage: `url('${STAR_SIGNINGS_BTN_BG}')`,
                    backgroundSize: '100% 100%',
                  }}
                  className="w-full h-9 rounded-full font-cruyff font-black text-xs text-slate-950 uppercase tracking-wider cursor-pointer hover:brightness-110 transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>TÌM KIẾM</span>
                </button>
              </div>
            </div>

            {/* Scrollable Player Grid (pulls all previous entrance-row players smoothly into normal rows) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {shardRewardPlayers.map((player) => {
                  const cost = getPlayerShardCost(player);
                  const ownedQty = ownedCopyCounts.get(player.id) ?? 0;
                  const isSelected = selectedCatalogPlayer?.id === player.id;
                  const isWatched = watchlistSet.has(player.id);
                  const canAfford = totyShards >= cost;

                  return (
                    <div
                      key={player.id}
                      onClick={() => {
                        soundService.playSelection();
                        setSelectedCatalogPlayerId(player.id);
                      }}
                      className={`relative rounded-xl p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#0b5c63] via-[#0a3c48] to-[#08222d] border-2 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.4)]'
                          : 'bg-[#10182b]/95 hover:bg-[#152038] border border-white/10 hover:border-cyan-400/45'
                      }`}
                    >
                      {/* Top badges row */}
                      <div className="w-full flex items-center justify-between mb-1">
                        {ownedQty > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 font-mono font-black text-[9px] text-cyan-200 tabular-nums">
                            x{ownedQty}
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatchlist(player, e)}
                          title={isWatched ? 'Bỏ theo dõi' : 'Thêm vào Theo dõi'}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                            isWatched
                              ? 'bg-amber-400/20 border-amber-300 text-amber-300'
                              : 'bg-black/40 border-white/25 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${isWatched ? 'fill-amber-300' : ''}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center">
                        <FCCard player={player} size="sm" showStats={false} />
                      </div>

                      {/* Shard cost footer */}
                      <div className="w-full pt-2 mt-1 border-t border-white/10 flex items-center justify-center gap-1.5">
                        <img
                          src={STAR_SHARD_SMALL_ICON}
                          alt="Mảnh"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span
                          className={`font-mono font-black text-xs sm:text-sm tabular-nums ${
                            canAfford ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {cost.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {shardRewardPlayers.length === 0 && (
                  <div className="col-span-full py-12 text-center text-sm text-slate-400">
                    Không tìm thấy cầu thủ phù hợp bộ lọc hiện tại.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: SELECTED PLAYER SIGNING PANEL (Shrunk & lifted KÝ HỢP ĐỒNG button) */}
          {selectedCatalogPlayer && (
            <div className="w-full lg:w-[272px] shrink-0 rounded-2xl bg-gradient-to-b from-[#0b1323] to-[#081a24] border border-emerald-400/55 p-3 flex flex-col gap-2 shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">
                  HỒ SƠ KÝ HỢP ĐỒNG
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCatalogPlayerId(null)}
                  className="p-0.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <FCCard player={selectedCatalogPlayer} size="sm" showStats={false} />
                <div className="mt-1.5 font-cruyff font-black text-sm text-white uppercase leading-tight">
                  {selectedCatalogPlayer.fullName || selectedCatalogPlayer.name}
                </div>
                <div className="text-[11px] text-slate-300">
                  {selectedCatalogPlayer.position} · OVR {selectedCatalogPlayer.ovr} · {selectedCatalogPlayer.club}
                </div>
                {(ownedCopyCounts.get(selectedCatalogPlayer.id) ?? 0) > 0 && (
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/45 text-[9px] font-bold text-cyan-200 uppercase">
                    Kho CLB: x{ownedCopyCounts.get(selectedCatalogPlayer.id)}
                  </span>
                )}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-2">
                {/* Watchlist Toggle Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-bold">Theo dõi cầu thủ</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={watchlistSet.has(selectedCatalogPlayer.id)}
                    onClick={(e) => handleToggleWatchlist(selectedCatalogPlayer, e)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      watchlistSet.has(selectedCatalogPlayer.id)
                        ? 'bg-emerald-400'
                        : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        watchlistSet.has(selectedCatalogPlayer.id)
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Cost Value Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-bold">Giá trị</span>
                  <div className="flex items-center gap-1.5">
                    <img
                      src={STAR_SHARD_SMALL_ICON}
                      alt="Mảnh"
                      className="w-4 h-4 object-contain"
                    />
                    <span className="font-mono font-black text-sm text-white tabular-nums">
                      {getPlayerShardCost(selectedCatalogPlayer).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Shrunk & Lifted Primary KÝ HỢP ĐỒNG CTA */}
                {(() => {
                  const cost = getPlayerShardCost(selectedCatalogPlayer);
                  const canAfford = totyShards >= cost;
                  return (
                    <button
                      type="button"
                      onClick={() => handleRedeemPlayerWithShards(selectedCatalogPlayer)}
                      style={{
                        backgroundImage: canAfford ? `url('${STAR_SIGNINGS_BTN_BG}')` : undefined,
                        backgroundSize: '100% 100%',
                      }}
                      className={`w-full h-9 rounded-full font-cruyff font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        canAfford
                          ? 'text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:brightness-110'
                          : 'bg-slate-800 border border-white/15 text-slate-400'
                      }`}
                    >
                      {canAfford
                        ? 'KÝ HỢP ĐỒNG'
                        : `THIẾU ${(cost - totyShards).toLocaleString('vi-VN')} MẢNH`}
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onInspectPlayer(selectedCatalogPlayer);
                  }}
                  className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-bold text-cyan-200 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chỉ số chi tiết</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: MY PLAYERS (PHÂN TÁCH MẢNH) */
        <div className="relative flex-1 flex flex-col justify-between min-h-[500px] max-h-[68vh]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {ownedExchangeEntries.map((entry) => {
                const selectedQty = sanitizedSelectedCopies[entry.player.id] ?? 0;
                const isSelected = selectedQty > 0;
                const displayYield =
                  entry.yieldPerCopy * (selectedQty > 0 ? selectedQty : 1);

                return (
                  <div
                    key={entry.player.id}
                    onClick={() => handleTileClickMyPlayers(entry)}
                    className={`relative rounded-xl p-2 flex flex-col items-center justify-between cursor-pointer transition-all select-none ${
                      entry.lockedByStarter
                        ? 'bg-[#0c1424]/75 border border-white/10 opacity-60'
                        : isSelected
                        ? 'bg-gradient-to-b from-[#0b4b52] to-[#09212a] border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                        : 'bg-[#10182b]/95 hover:bg-[#16213a] border border-white/10 hover:border-cyan-400/45'
                    }`}
                  >
                    {/* Top row badges */}
                    <div className="w-full flex items-center justify-between mb-1">
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : entry.totalCopies > 1 ? (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 font-mono font-black text-[9px] text-cyan-200 tabular-nums">
                          x{entry.totalCopies}
                        </span>
                      ) : (
                        <span />
                      )}

                      {entry.lockedByStarter ? (
                        <span
                          title="Đang đá chính"
                          className="w-5 h-5 rounded-full bg-black/50 border border-white/20 text-slate-300 flex items-center justify-center"
                        >
                          <Lock className="w-3 h-3" />
                        </span>
                      ) : isSelected && entry.availableCopies > 1 ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-mono font-black text-[9px] tabular-nums">
                          {selectedQty}/{entry.availableCopies}
                        </span>
                      ) : entry.availableCopies > 0 && starterSet.has(entry.player.id) ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-300/40 text-[9px] font-bold text-amber-200">
                          Dư {entry.availableCopies}
                        </span>
                      ) : null}
                    </div>

                    <FCCard player={entry.player} size="pitch" showStats={false} />

                    <div className="w-full pt-1.5 mt-1 border-t border-white/10 flex items-center justify-center gap-1">
                      <img
                        src={STAR_SHARD_SMALL_ICON}
                        alt="Mảnh"
                        className="w-3.5 h-3.5 object-contain shrink-0"
                      />
                      <span className="font-mono font-black text-xs text-white tabular-nums">
                        +{displayYield.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                );
              })}

              {ownedExchangeEntries.length === 0 && (
                <div className="col-span-full py-14 text-center text-sm text-slate-400">
                  Không có cầu thủ hợp lệ nào trong kho CLB để phân tách.
                </div>
              )}
            </div>
          </div>

          {/* Floating Copy Quantity Stepper when an item with multiple copies is focused */}
          {focusedEntry && focusedEntry.availableCopies > 1 && (
            <div className="mx-auto mb-2 px-4 py-2 rounded-2xl bg-[#1a2234]/95 border border-cyan-400/45 shadow-2xl flex items-center gap-4">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                {focusedEntry.player.name}
              </span>
              <button
                type="button"
                onClick={() =>
                  adjustSelectedCopies(
                    focusedEntry.player.id,
                    focusedEntry.availableCopies,
                    -1,
                    focusedEntry.player.name
                  )
                }
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center cursor-pointer hover:brightness-110"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              <span className="font-mono font-black text-base text-white tabular-nums min-w-[2.5rem] text-center">
                {sanitizedSelectedCopies[focusedEntry.player.id] ?? 0}/{focusedEntry.availableCopies}
              </span>
              <button
                type="button"
                onClick={() =>
                  adjustSelectedCopies(
                    focusedEntry.player.id,
                    focusedEntry.availableCopies,
                    1,
                    focusedEntry.player.name
                  )
                }
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center cursor-pointer hover:brightness-110"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {/* BOTTOM ACTION BAR FOR MY PLAYERS */}
          <div className="px-4 sm:px-6 py-2.5 bg-[#071122]/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300 tabular-nums">
              Đã chọn <strong className="text-emerald-300 font-mono">{totalSelectedCopies}</strong> thẻ · Kho CLB còn{' '}
              <strong className="text-white font-mono">
                {Math.max(0, ownedIdList.length - totalSelectedCopies)}
              </strong>{' '}
              thẻ (tối thiểu 11)
              {totalSelectedCopies > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCopiesMap({});
                    setFocusedOwnedPlayerId(null);
                  }}
                  className="ml-3 text-[11px] font-bold text-rose-300 hover:underline cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={handleAutoSelectRelease}
                className="h-10 px-5 rounded-full bg-[#0b162a] hover:bg-[#11203b] border border-cyan-400/55 text-xs font-cruyff font-black text-white uppercase tracking-wider cursor-pointer transition-colors"
              >
                TỰ ĐỘNG CHỌN
              </button>

              <button
                type="button"
                disabled={totalSelectedCopies === 0}
                onClick={handleReleaseToShards}
                style={{
                  backgroundImage:
                    totalSelectedCopies > 0 ? `url('${STAR_SIGNINGS_BTN_BG}')` : undefined,
                  backgroundSize: '100% 100%',
                }}
                className={`h-10 px-5 rounded-full font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all ${
                  totalSelectedCopies > 0
                    ? 'text-slate-950 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:brightness-110'
                    : 'bg-slate-800 border border-white/15 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>PHÂN TÁCH</span>
                <span className="h-4 w-px bg-black/25" />
                <img
                  src={STAR_SHARD_SMALL_ICON}
                  alt="Mảnh"
                  className="w-4 h-4 object-contain"
                />
                <span className="font-mono tabular-nums">
                  {totalPreviewShards.toLocaleString('vi-VN')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SEGMENTED TAB BAR */}
      <div className="grid grid-cols-2 border-t border-cyan-400/35 bg-[#0a1324]">
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveTab('players');
          }}
          className={`relative py-3.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'players'
              ? 'text-white bg-gradient-to-t from-cyan-500/15 to-transparent'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'players' && (
            <>
              <span className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-lime-300 via-emerald-400 to-cyan-400" />
              <span className="block mx-auto -mt-1.5 mb-0.5 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-emerald-400" />
            </>
          )}
          CẦU THỦ
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveTab('my_players');
          }}
          className={`relative py-3.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider border-l border-white/10 transition-colors cursor-pointer ${
            activeTab === 'my_players'
              ? 'text-white bg-gradient-to-t from-cyan-500/15 to-transparent'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'my_players' && (
            <>
              <span className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-lime-300 via-emerald-400 to-cyan-400" />
              <span className="block mx-auto -mt-1.5 mb-0.5 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-emerald-400" />
            </>
          )}
          CẦU THỦ CỦA TÔI
        </button>
      </div>

      {/* DEDICATED PLAYER SEARCH MODAL (FC Mobile Dark-Navy Filter Popup) */}
      {showSearchModal && (
        <div
          onClick={() => setShowSearchModal(false)}
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl p-[1.5px] rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-500 shadow-[0_0_55px_rgba(34,211,238,0.35)]"
          >
            <div className="rounded-[15px] bg-gradient-to-b from-[#0a162b] via-[#071222] to-[#050d1a] text-white overflow-hidden flex flex-col max-h-[88vh]">
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-white/10 bg-[#0d1c35]/70 flex items-center justify-between">
                <h3 className="font-cruyff font-black text-lg sm:text-xl uppercase tracking-wider text-white">
                  TÌM KIẾM
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setShowSearchModal(false);
                  }}
                  className="p-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Filter Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/10 px-5">
                {/* 1. Player Name */}
                <div className="py-3.5 flex items-center gap-3">
                  <div className="w-28 sm:w-36 shrink-0 font-cruyff font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                    TÊN CẦU THỦ
                  </div>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="NHẬP TÊN CẦU THỦ"
                    className="flex-1 min-w-0 h-10 px-4 rounded-full bg-[#131d31] border border-cyan-400/35 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setDraftName('');
                    }}
                    title="Xóa tên"
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer hover:brightness-110 shadow"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.3]" />
                  </button>
                </div>

                {/* 2. OVR Rating Min / Max */}
                <div className="py-3.5 flex items-center gap-3">
                  <div className="w-28 sm:w-36 shrink-0 font-cruyff font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                    CHỈ SỐ OVR
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={60}
                      max={106}
                      value={draftOvrMin}
                      onChange={(e) => setDraftOvrMin(e.target.value)}
                      placeholder="TỐI THIỂU"
                      className="w-full h-10 px-4 rounded-full bg-[#131d31] border border-cyan-400/35 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-300 tabular-nums"
                    />
                    <input
                      type="number"
                      min={60}
                      max={106}
                      value={draftOvrMax}
                      onChange={(e) => setDraftOvrMax(e.target.value)}
                      placeholder="TỐI ĐA"
                      className="w-full h-10 px-4 rounded-full bg-[#131d31] border border-cyan-400/35 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-300 tabular-nums"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setDraftOvrMin('');
                      setDraftOvrMax('');
                    }}
                    title="Xóa OVR"
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer hover:brightness-110 shadow"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.3]" />
                  </button>
                </div>

                {/* 3. Program / Season */}
                <div className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-cruyff font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                        CHƯƠNG TRÌNH
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 uppercase ${
                          draftProgram === 'ALL' ? 'text-slate-400' : 'text-emerald-300'
                        }`}
                      >
                        {draftProgram === 'ALL'
                          ? 'BẤT KỲ'
                          : PROGRAM_FILTER_OPTIONS.find((o) => o.id === draftProgram)?.label ||
                            draftProgram}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setActivePicker((prev) => (prev === 'program' ? null : 'program'));
                      }}
                      title="Chọn chương trình"
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer hover:brightness-110 shadow"
                    >
                      <Pencil className="w-4 h-4 stroke-[2.3]" />
                    </button>
                  </div>
                  {activePicker === 'program' && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {PROGRAM_FILTER_OPTIONS.map((opt) => {
                        const selected = draftProgram === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              soundService.playSelection();
                              setDraftProgram(opt.id);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${
                              selected
                                ? 'bg-gradient-to-r from-lime-300 to-cyan-300 text-slate-950'
                                : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200'
                            }`}
                          >
                            {opt.id === 'ALL' ? 'BẤT KỲ' : opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Position */}
                <div className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-cruyff font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                        VỊ TRÍ
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 uppercase ${
                          draftPosition === 'ALL' ? 'text-slate-400' : 'text-emerald-300'
                        }`}
                      >
                        {draftPosition === 'ALL' ? 'BẤT KỲ' : draftPosition}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setActivePicker((prev) => (prev === 'position' ? null : 'position'));
                      }}
                      title="Chọn vị trí"
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer hover:brightness-110 shadow"
                    >
                      <Pencil className="w-4 h-4 stroke-[2.3]" />
                    </button>
                  </div>
                  {activePicker === 'position' && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playSelection();
                          setDraftPosition('ALL');
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${
                          draftPosition === 'ALL'
                            ? 'bg-gradient-to-r from-lime-300 to-cyan-300 text-slate-950'
                            : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200'
                        }`}
                      >
                        BẤT KỲ
                      </button>
                      {availablePositions.map((pos) => {
                        const selected = draftPosition === pos;
                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => {
                              soundService.playSelection();
                              setDraftPosition(pos);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${
                              selected
                                ? 'bg-gradient-to-r from-lime-300 to-cyan-300 text-slate-950'
                                : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200'
                            }`}
                          >
                            {pos}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Nation */}
                <div className="py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-cruyff font-bold text-xs sm:text-sm uppercase tracking-wide text-white">
                        QUỐC GIA
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 uppercase ${
                          draftNation === 'ALL' ? 'text-slate-400' : 'text-emerald-300'
                        }`}
                      >
                        {draftNation === 'ALL' ? 'BẤT KỲ' : draftNation}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setActivePicker((prev) => (prev === 'nation' ? null : 'nation'));
                      }}
                      title="Chọn quốc gia"
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer hover:brightness-110 shadow"
                    >
                      <Pencil className="w-4 h-4 stroke-[2.3]" />
                    </button>
                  </div>
                  {activePicker === 'nation' && (
                    <div className="mt-3 max-h-40 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playSelection();
                          setDraftNation('ALL');
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${
                          draftNation === 'ALL'
                            ? 'bg-gradient-to-r from-lime-300 to-cyan-300 text-slate-950'
                            : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200'
                        }`}
                      >
                        BẤT KỲ
                      </button>
                      {availableNations.map((nation) => {
                        const selected = draftNation === nation;
                        return (
                          <button
                            key={nation}
                            type="button"
                            onClick={() => {
                              soundService.playSelection();
                              setDraftNation(nation);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer transition-colors ${
                              selected
                                ? 'bg-gradient-to-r from-lime-300 to-cyan-300 text-slate-950'
                                : 'bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200'
                            }`}
                          >
                            {nation}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="px-5 py-3.5 border-t border-white/10 bg-[#060f1e] grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={resetAllSearchFilters}
                  className="h-10 rounded-full bg-[#0a162b] hover:bg-[#102242] border border-cyan-400/55 font-cruyff font-black text-xs sm:text-sm text-white uppercase tracking-wider cursor-pointer transition-colors"
                >
                  ĐẶT LẠI TẤT CẢ
                </button>
                <button
                  type="button"
                  onClick={applySearchModal}
                  style={{
                    backgroundImage: `url('${STAR_SIGNINGS_BTN_BG}')`,
                    backgroundSize: '100% 100%',
                  }}
                  className="h-10 rounded-full font-cruyff font-black text-xs sm:text-sm text-slate-950 uppercase tracking-wider cursor-pointer hover:brightness-110 transition-all shadow-[0_0_22px_rgba(34,211,238,0.4)]"
                >
                  TÌM KIẾM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISMANTLE SHARD PACK OPENING ANIMATION OVERLAY (SAME AS STANDARD PACK OPENING WITH UTOTY & TOTY26 HM 100+ PACK ART) */}
      {dismantlePackAnim && (
        <div
          onClick={() => {
            if (dismantlePackAnim.phase === 'breathing') {
              triggerDismantlePackTear();
            } else {
              soundService.playClick();
              setDismantlePackAnim(null);
            }
          }}
          className="fixed inset-0 z-[92] bg-black/95 flex flex-col items-center justify-center p-4 select-none cursor-pointer overflow-hidden group animate-fadeIn"
        >
          {/* Fullscreen White Flash Overlay */}
          {dismantleIsFlashing && (
            <div className="fixed inset-0 z-[95] bg-white animate-screen-flash pointer-events-none" />
          )}

          {dismantlePackAnim.phase === 'breathing' ? (
            <>
              {/* Standard Pack Opening Ambient Backdrop */}
              <img
                src="/assets/aistudio/box_GINGA26_BG_WEEK1_d02efe7f.png"
                alt="Pack Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-55 animate-ginga-drift pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.28)_0%,_rgba(0,0,0,0.92)_78%)] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-400/25 transition-all" />

              {/* Top Close Button */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundService.playClick();
                    if (dismantleTimerRef.current) {
                      window.clearTimeout(dismantleTimerRef.current);
                      dismantleTimerRef.current = null;
                    }
                    setDismantleIsOpening(false);
                    setDismantleIsFlashing(false);
                    setDismantlePackAnim(null);
                  }}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Continuously Breathing UTOTY & TOTY26 HM 100+ Pack */}
              <div className="relative z-20 flex items-center justify-center my-2">
                <div
                  className={`relative ${
                    dismantleIsOpening
                      ? 'animate-pack-glow-vanish'
                      : 'animate-pack-breathe group-hover:scale-105 transition-transform duration-300'
                  }`}
                >
                  <img
                    src="/assets/aistudio/storepack_S11_F_676265b6.png"
                    alt="Gói Mảnh UTOTY & TOTY26 HM"
                    className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_40px_rgba(234,179,8,0.6)] select-none pointer-events-none"
                  />
                </div>
              </div>

              {/* Glowing Tap to Open Call-to-Action */}
              <div className="relative z-20 flex flex-col items-center mt-6">
                <div className="px-8 py-3.5 rounded-2xl font-cruyff font-black text-lg sm:text-xl uppercase tracking-widest flex items-center gap-3 animate-pulse bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_0_35px_rgba(234,179,8,0.7)]">
                  <Sparkles className="w-6 h-6" />
                  <span>CHẠM ĐỂ BÓC GÓI</span>
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </div>
                <p className="mt-4 text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest animate-bounce">
                  Nhấn bất kỳ đâu để xé gói...
                </p>
              </div>
            </>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full p-[1.5px] rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 shadow-[0_0_60px_rgba(34,211,238,0.45)] animate-stage-enter cursor-default"
            >
              <div className="rounded-[15px] bg-gradient-to-b from-[#0b182e] via-[#071122] to-[#040a15] p-6 flex flex-col items-center text-center gap-3">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-[10px] font-black text-cyan-200 uppercase tracking-widest">
                  PHÂN TÁCH THÀNH CÔNG
                </span>
                <div className="relative my-1">
                  <div className="absolute -inset-6 rounded-full bg-cyan-400/25 blur-xl pointer-events-none" />
                  <img
                    src={STAR_SHARD_LARGE_ICON}
                    alt="Mảnh Trao Đổi"
                    className="relative w-24 h-24 object-contain drop-shadow-[0_0_32px_rgba(34,211,238,0.85)]"
                  />
                </div>
                <div className="font-mono font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-300 tabular-nums">
                  +{dismantlePackAnim.shards.toLocaleString('vi-VN')} MẢNH
                </div>
                <p className="text-xs text-slate-300">
                  Đã mở gói từ{' '}
                  <strong className="text-white">{dismantlePackAnim.count}</strong> thẻ cầu thủ dự
                  bị · Tổng hiện có{' '}
                  <strong className="text-cyan-300 font-mono">
                    {totyShards.toLocaleString('vi-VN')}
                  </strong>{' '}
                  Mảnh
                </p>
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setDismantlePackAnim(null);
                  }}
                  style={{
                    backgroundImage: `url('${STAR_SIGNINGS_BTN_BG}')`,
                    backgroundSize: '100% 100%',
                  }}
                  className="mt-2 w-full max-w-[220px] h-10 rounded-full font-cruyff font-black text-xs text-slate-950 uppercase tracking-wider cursor-pointer hover:brightness-110 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
                >
                  NHẬN MẢNH
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
