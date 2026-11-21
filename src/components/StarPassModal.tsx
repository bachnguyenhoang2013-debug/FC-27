import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Crown,
  Lock,
  Sparkles,
  Trophy,
  Gift,
  ChevronRight,
} from 'lucide-react';
import { PlayerCard, StarPassState, UserProfile } from '../types/game';
import { STARTER_OWNED_IDS } from '../data/mockData';
import {
  dybalaGinga104,
  gilbertoSilvaGinga106,
  spGingaPlayers,
  GINGA_ASSETS,
} from '../data/gingaData';
import { FCCard } from './FCCard';
import { TopSectionHeader } from './TopSectionHeader';
import { soundService } from '../services/sound';
import { useLanguage } from '../i18n/language';
import { addOwnedPlayerCopies } from '../utils/squadUtils';

export const STAR_PASS_SEASON_NUMBER = 2;
export const STAR_PASS_MAX_LEVEL = 60;
export const STAR_PASS_STEP_POINTS = 160;
export const PREMIUM_STAR_PASS_COST_GEMS = 25000;

export const normalizeStarPassState = (sp?: StarPassState): StarPassState => {
  if (!sp || (sp.seasonNumber ?? 1) !== STAR_PASS_SEASON_NUMBER) {
    return {
      seasonNumber: STAR_PASS_SEASON_NUMBER,
      points: 0,
      isPremium: false,
      claimedFreeLevels: [],
      claimedPremiumLevels: [],
    };
  }
  return {
    seasonNumber: STAR_PASS_SEASON_NUMBER,
    points: Math.max(0, sp.points ?? 0),
    isPremium: Boolean(sp.isPremium),
    claimedFreeLevels: Array.isArray(sp.claimedFreeLevels) ? sp.claimedFreeLevels : [],
    claimedPremiumLevels: Array.isArray(sp.claimedPremiumLevels) ? sp.claimedPremiumLevels : [],
  };
};

export const getRequiredPointsForStarPassLevel = (level: number): number => {
  if (level <= 1) return 0;
  return (level - 1) * STAR_PASS_STEP_POINTS;
};

export const getCurrentStarPassLevel = (points: number): number => {
  const lvl = Math.floor(Math.max(0, points) / STAR_PASS_STEP_POINTS) + 1;
  return Math.min(STAR_PASS_MAX_LEVEL, Math.max(1, lvl));
};

export type StarPassRewardKind =
  | 'coins'
  | 'gems'
  | 'tickets'
  | 'shards'
  | 'clubTokens'
  | 'pack_85_94'
  | 'pack_95_plus'
  | 'player';

export interface StarPassRewardItem {
  kind: StarPassRewardKind;
  amount: number;
  label: string;
  labelEn?: string;
  subLabel: string;
  subLabelEn?: string;
  iconUrl?: string;
  playerCard?: PlayerCard;
}

export interface StarPassTierNode {
  level: number;
  requiredPoints: number;
  freeReward: StarPassRewardItem;
  premiumReward: StarPassRewardItem;
}

const gingaSp10Card = spGingaPlayers[0];
const gingaSp20Card = spGingaPlayers[1];
const gingaSp30Card = spGingaPlayers[2];
const gingaSp45Card = spGingaPlayers[3];

const buildStarPassTiers60 = (): StarPassTierNode[] => {
  const tiers: StarPassTierNode[] = [];
  const coinIcon = '/assets/aistudio/currencysmall_COIN_ec777114.png';
  const gemIcon = '/assets/aistudio/currencysmall_CASH_b2121428.png';
  const ticketIcon = '/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png';
  const shardIcon = GINGA_ASSETS.shardsIcon;
  const clubTokenIcon = '/assets/aistudio/club_token_908dbb4a.png';
  const pack9099Icon = '/assets/aistudio/storepack_S11_d9617be0.png';
  const pack100Icon = '/assets/aistudio/storepack_S11_F_676265b6.png';

  for (let level = 1; level <= STAR_PASS_MAX_LEVEL; level++) {
    const requiredPoints = getRequiredPointsForStarPassLevel(level);
    const tierScale = Math.floor((level - 1) / 10); // 0..5

    // Grand Finale Level 60
    if (level === 60) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'player',
          amount: 1,
          label: 'Dybala 104',
          labelEn: '104 Dybala',
          subLabel: 'Ginga Cấp 60 · Không GD',
          subLabelEn: 'Level 60 Free · Untradeable',
          playerCard: dybalaGinga104,
        },
        premiumReward: {
          kind: 'player',
          amount: 1,
          label: 'Gilberto Silva 106 (CM)',
          labelEn: '106 Gilberto Silva (CM)',
          subLabel: 'Ginga Icons · Không GD',
          subLabelEn: 'Ginga Icons · Untradeable',
          playerCard: gilbertoSilvaGinga106,
        },
      });
      continue;
    }

    // Major Player Milestones on Premium Track (10, 20, 30, 45) & 100+ Pack on Level 50
    if (level === 10) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'gems',
          amount: 500,
          label: '500 Gems',
          subLabel: 'Mốc Cấp 10',
          iconUrl: gemIcon,
        },
        premiumReward: {
          kind: 'player',
          amount: 1,
          label: `${gingaSp10Card.name} ${gingaSp10Card.ovr}`,
          labelEn: `${gingaSp10Card.name} ${gingaSp10Card.ovr}`,
          subLabel: 'Ginga · Không GD',
          subLabelEn: 'Ginga · Untradeable',
          playerCard: gingaSp10Card,
        },
      });
      continue;
    }

    if (level === 20) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'pack_95_plus',
          amount: 1,
          label: 'Gói 95+ OVR',
          labelEn: '95+ OVR Pack',
          subLabel: 'Mốc Cấp 20 · Không GD',
          subLabelEn: 'Level 20 Milestone',
          iconUrl: pack100Icon,
        },
        premiumReward: {
          kind: 'player',
          amount: 1,
          label: `${gingaSp20Card.name} ${gingaSp20Card.ovr}`,
          labelEn: `${gingaSp20Card.name} ${gingaSp20Card.ovr}`,
          subLabel: 'Ginga · Không GD',
          subLabelEn: 'Ginga · Untradeable',
          playerCard: gingaSp20Card,
        },
      });
      continue;
    }

    if (level === 30) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'pack_95_plus',
          amount: 1,
          label: 'Gói 95+ OVR',
          labelEn: '95+ OVR Pack',
          subLabel: 'Mốc Cấp 30 · Không GD',
          subLabelEn: 'Level 30 Milestone',
          iconUrl: pack100Icon,
        },
        premiumReward: {
          kind: 'player',
          amount: 1,
          label: `${gingaSp30Card.name} ${gingaSp30Card.ovr}`,
          labelEn: `${gingaSp30Card.name} ${gingaSp30Card.ovr}`,
          subLabel: 'Ginga · Không GD',
          subLabelEn: 'Ginga · Untradeable',
          playerCard: gingaSp30Card,
        },
      });
      continue;
    }

    if (level === 40) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'gems',
          amount: 1200,
          label: '1,200 Gems',
          labelEn: '1,200 Gems',
          subLabel: 'Mốc Cấp 40',
          subLabelEn: 'Level 40 Milestone',
          iconUrl: gemIcon,
        },
        premiumReward: {
          kind: 'pack_95_plus',
          amount: 1,
          label: 'Gói 95+ OVR',
          labelEn: '95+ OVR Pack',
          subLabel: 'Siêu Gói Cấp 40',
          subLabelEn: 'Level 40 Super Pack',
          iconUrl: pack100Icon,
        },
      });
      continue;
    }

    if (level === 45) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'pack_95_plus',
          amount: 1,
          label: 'Gói 95+ OVR',
          labelEn: '95+ OVR Pack',
          subLabel: 'Mốc Cấp 45',
          subLabelEn: 'Level 45 Milestone',
          iconUrl: pack100Icon,
        },
        premiumReward: {
          kind: 'player',
          amount: 1,
          label: `${gingaSp45Card.name} ${gingaSp45Card.ovr}`,
          labelEn: `${gingaSp45Card.name} ${gingaSp45Card.ovr}`,
          subLabel: 'Ginga · Không GD',
          subLabelEn: 'Ginga · Untradeable',
          playerCard: gingaSp45Card,
        },
      });
      continue;
    }

    if (level === 50) {
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'tickets',
          amount: 8,
          label: '8 Vé Quay',
          labelEn: '8 Spin Tickets',
          subLabel: 'Mốc Cấp 50',
          subLabelEn: 'Level 50 Milestone',
          iconUrl: ticketIcon,
        },
        premiumReward: {
          kind: 'pack_95_plus',
          amount: 1,
          label: 'Gói 95+ OVR',
          labelEn: '95+ OVR Pack',
          subLabel: 'Siêu Gói Cấp 50',
          subLabelEn: 'Level 50 Super Pack',
          iconUrl: pack100Icon,
        },
      });
      continue;
    }

    // Every other multiple of 5 (5, 15, 25, 35, 55)
    if (level % 5 === 0) {
      const ticketBonus = 4 + tierScale * 2;
      tiers.push({
        level,
        requiredPoints,
        freeReward: {
          kind: 'pack_85_94',
          amount: 1,
          label: 'Gói 85-94 OVR',
          labelEn: '85-94 OVR Pack',
          subLabel: `Mốc Cấp ${level}`,
          subLabelEn: `Level ${level} Milestone`,
          iconUrl: pack9099Icon,
        },
        premiumReward: {
          kind: 'tickets',
          amount: ticketBonus,
          label: `${ticketBonus} Vé Quay`,
          labelEn: `${ticketBonus} Spin Tickets`,
          subLabel: 'Đại Tiệc Vé Quay',
          subLabelEn: 'Ticket Bonanza',
          iconUrl: ticketIcon,
        },
      });
      continue;
    }

    // Standard cycling levels (1,2,3,4, 6,7,8,9, ...)
    const mod = level % 5; // 1, 2, 3, or 4
    let freeReward: StarPassRewardItem;
    let premiumReward: StarPassRewardItem;

    if (mod === 1) {
      const freeCoins = (150 + tierScale * 120) * 1000;
      const premTickets = 2 + Math.floor(tierScale / 2) + (level > 40 ? 2 : 1);
      freeReward = {
        kind: 'coins',
        amount: freeCoins,
        label: `${freeCoins.toLocaleString('en-US')} Xu`,
        subLabel: 'Ngân Sách CLB',
        iconUrl: coinIcon,
      };
      premiumReward = {
        kind: 'tickets',
        amount: premTickets,
        label: `${premTickets} Vé Quay`,
        subLabel: 'Vé Siêu Sao',
        iconUrl: ticketIcon,
      };
    } else if (mod === 2) {
      const freeGems = 150 + tierScale * 75;
      const premCoins = (400 + tierScale * 250) * 1000;
      freeReward = {
        kind: 'gems',
        amount: freeGems,
        label: `${freeGems.toLocaleString('en-US')} Gems`,
        subLabel: 'Kim Cương',
        iconUrl: gemIcon,
      };
      premiumReward = {
        kind: 'coins',
        amount: premCoins,
        label: `${premCoins.toLocaleString('en-US')} Xu`,
        subLabel: 'Kho Báu Xu',
        iconUrl: coinIcon,
      };
    } else if (mod === 3) {
      const freeTickets = 1 + Math.floor(tierScale / 2);
      const premGems = 300 + tierScale * 150;
      freeReward = {
        kind: 'tickets',
        amount: freeTickets,
        label: `${freeTickets} Vé Quay`,
        subLabel: 'Vé Siêu Sao',
        iconUrl: ticketIcon,
      };
      premiumReward = {
        kind: 'gems',
        amount: premGems,
        label: `${premGems.toLocaleString('en-US')} Gems`,
        subLabel: 'Kim Cương VIP',
        iconUrl: gemIcon,
      };
    } else {
      // mod === 4: alternate Shards & Club Tokens
      if (level % 2 === 0) {
        const freeShards = 20 + tierScale * 10;
        const premShards = 50 + tierScale * 20;
        freeReward = {
          kind: 'shards',
          amount: freeShards,
          label: `${freeShards} Mảnh Ginga`,
          labelEn: `${freeShards} Ginga Shards`,
          subLabel: 'Lễ Hội Ginga',
          iconUrl: shardIcon,
        };
        premiumReward = {
          kind: 'shards',
          amount: premShards,
          label: `${premShards} Mảnh Ginga`,
          labelEn: `${premShards} Ginga Shards`,
          subLabel: 'Lễ Hội Ginga',
          iconUrl: shardIcon,
        };
      } else {
        const freeClub = 200 + tierScale * 80;
        const premClub = 400 + tierScale * 140;
        freeReward = {
          kind: 'clubTokens',
          amount: freeClub,
          label: `${freeClub} Token CLB`,
          subLabel: 'Đội Hình CLB',
          iconUrl: clubTokenIcon,
        };
        premiumReward = {
          kind: 'clubTokens',
          amount: premClub,
          label: `${premClub} Token CLB`,
          subLabel: 'Đội Hình CLB',
          iconUrl: clubTokenIcon,
        };
      }
    }

    tiers.push({
      level,
      requiredPoints,
      freeReward,
      premiumReward,
    });
  }

  return tiers;
};

export const STAR_PASS_TIERS: StarPassTierNode[] = buildStarPassTiers60();

export const countUnclaimedStarPassRewards = (rawSp?: StarPassState): number => {
  const sp = normalizeStarPassState(rawSp);
  let count = 0;
  for (const tier of STAR_PASS_TIERS) {
    if (sp.points >= tier.requiredPoints) {
      if (!sp.claimedFreeLevels.includes(tier.level)) count += 1;
      if (sp.isPremium && !sp.claimedPremiumLevels.includes(tier.level)) count += 1;
    }
  }
  return count;
};

interface StarPassModalProps {
  user: UserProfile;
  onUpdateUser: (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenRewardPack: (tier: 'STARPASS_85_94' | 'STARPASS_95_PLUS', customName?: string) => void;
  onGoToCareer: () => void;
  onGoToRanked: () => void;
  onClose: () => void;
  onGoHome: () => void;
}

export const StarPassModal: React.FC<StarPassModalProps> = ({
  user,
  onUpdateUser,
  onOpenRewardPack,
  onGoToCareer,
  onGoToRanked,
  onClose,
  onGoHome,
}) => {
  const { isEn, locale, t } = useLanguage();
  const starPass = useMemo(() => normalizeStarPassState(user.starPass), [user.starPass]);
  const currentLevel = useMemo(() => getCurrentStarPassLevel(starPass.points), [starPass.points]);
  const unclaimedCount = useMemo(() => countUnclaimedStarPassRewards(starPass), [starPass]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [celebratedPlayers, setCelebratedPlayers] = useState<PlayerCard[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const nextLevelPoints =
    currentLevel >= STAR_PASS_MAX_LEVEL
      ? getRequiredPointsForStarPassLevel(STAR_PASS_MAX_LEVEL)
      : getRequiredPointsForStarPassLevel(currentLevel + 1);
  const currentFloorPoints = getRequiredPointsForStarPassLevel(currentLevel);
  const levelProgressPct =
    currentLevel >= STAR_PASS_MAX_LEVEL
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((starPass.points - currentFloorPoints) / STAR_PASS_STEP_POINTS) * 100
            )
          )
        );

  const handleUnlockPremium = () => {
    if (starPass.isPremium) return;
    if (user.gems < PREMIUM_STAR_PASS_COST_GEMS) {
      soundService.playClick();
      showToast(
        `Cần ${PREMIUM_STAR_PASS_COST_GEMS.toLocaleString('vi-VN')} Kim Cương để mở khóa Premium Star Pass!`
      );
      return;
    }

    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 110, spread: 90, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const sp = normalizeStarPassState(prev.starPass);
      if (sp.isPremium || prev.gems < PREMIUM_STAR_PASS_COST_GEMS) return {};
      return {
        gems: prev.gems - PREMIUM_STAR_PASS_COST_GEMS,
        starPass: {
          ...sp,
          isPremium: true,
        },
      };
    });
    showToast('Đã kích hoạt PREMIUM STAR PASS! Bạn có thể nhận toàn bộ nhánh thưởng Vàng!');
  };

  const applyRewardListToUser = (rewards: StarPassRewardItem[]) => {
    let coinsDelta = 0;
    let gemsDelta = 0;
    let ticketsDelta = 0;
    let shardsDelta = 0;
    let clubTokensDelta = 0;
    const unlockedCards: PlayerCard[] = [];
    const packsToOpen: Array<{ tier: 'STARPASS_85_94' | 'STARPASS_95_PLUS'; name: string }> = [];

    for (const r of rewards) {
      if (r.kind === 'coins') coinsDelta += r.amount;
      else if (r.kind === 'gems') gemsDelta += r.amount;
      else if (r.kind === 'tickets') ticketsDelta += r.amount;
      else if (r.kind === 'shards') shardsDelta += r.amount;
      else if (r.kind === 'clubTokens') clubTokensDelta += r.amount;
      else if (r.kind === 'pack_85_94')
        packsToOpen.push({
          tier: 'STARPASS_85_94',
          name: t('Gói Star Pass 85-94 OVR', 'Star Pass 85-94 OVR Pack'),
        });
      else if (r.kind === 'pack_95_plus')
        packsToOpen.push({
          tier: 'STARPASS_95_PLUS',
          name: t('Gói Star Pass 95+ OVR', 'Star Pass 95+ OVR Pack'),
        });
      else if (r.kind === 'player' && r.playerCard) unlockedCards.push(r.playerCard);
    }

    return {
      coinsDelta,
      gemsDelta,
      ticketsDelta,
      shardsDelta,
      clubTokensDelta,
      unlockedCards,
      packsToOpen,
    };
  };

  const handleClaimSingle = (level: number, track: 'free' | 'premium') => {
    const tier = STAR_PASS_TIERS.find((t) => t.level === level);
    if (!tier) return;
    if (starPass.points < tier.requiredPoints) return;
    if (track === 'premium' && !starPass.isPremium) {
      soundService.playClick();
      showToast('Hãy mở khóa Premium Star Pass để nhận phần thưởng nhánh Cao Cấp!');
      return;
    }

    const alreadyClaimed =
      track === 'free'
        ? starPass.claimedFreeLevels.includes(level)
        : starPass.claimedPremiumLevels.includes(level);
    if (alreadyClaimed) return;

    const reward = track === 'free' ? tier.freeReward : tier.premiumReward;
    const deltas = applyRewardListToUser([reward]);

    if (deltas.unlockedCards.length > 0) {
      soundService.playPackOpenFanfare();
      try {
        confetti({ particleCount: 120, spread: 95, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      setCelebratedPlayers(deltas.unlockedCards);
    } else {
      soundService.playCoins();
    }

    onUpdateUser((prev) => {
      const sp = normalizeStarPassState(prev.starPass);
      const nextFree =
        track === 'free' && !sp.claimedFreeLevels.includes(level)
          ? [...sp.claimedFreeLevels, level]
          : sp.claimedFreeLevels;
      const nextPrem =
        track === 'premium' && !sp.claimedPremiumLevels.includes(level)
          ? [...sp.claimedPremiumLevels, level]
          : sp.claimedPremiumLevels;
      const nextOwned = addOwnedPlayerCopies(
        prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS,
        deltas.unlockedCards.map((c) => c.id)
      );

      return {
        coins: prev.coins + deltas.coinsDelta,
        gems: prev.gems + deltas.gemsDelta,
        tickets: (prev.tickets ?? 0) + deltas.ticketsDelta,
        gingaShards: (prev.gingaShards ?? 0) + deltas.shardsDelta,
        clubTokens: (prev.clubTokens ?? 0) + deltas.clubTokensDelta,
        ownedPlayerIds: nextOwned,
        starPass: {
          ...sp,
          claimedFreeLevels: nextFree,
          claimedPremiumLevels: nextPrem,
        },
      };
    });

    if (deltas.packsToOpen.length > 0) {
      onOpenRewardPack(deltas.packsToOpen[0].tier, deltas.packsToOpen[0].name);
    } else {
      const rName = isEn && reward.labelEn ? reward.labelEn : reward.label;
      showToast(
        t(
          `Đã nhận phần thưởng Cấp ${level}: ${rName}!`,
          `Claimed Level ${level} reward: ${rName}!`
        )
      );
    }
  };

  const handleClaimAll = () => {
    const claimableRewards: StarPassRewardItem[] = [];
    const newFreeIds: number[] = [];
    const newPremIds: number[] = [];

    for (const tier of STAR_PASS_TIERS) {
      if (starPass.points < tier.requiredPoints) continue;
      if (!spHas(starPass.claimedFreeLevels, tier.level)) {
        claimableRewards.push(tier.freeReward);
        newFreeIds.push(tier.level);
      }
      if (starPass.isPremium && !spHas(starPass.claimedPremiumLevels, tier.level)) {
        claimableRewards.push(tier.premiumReward);
        newPremIds.push(tier.level);
      }
    }

    if (claimableRewards.length === 0) return;

    const deltas = applyRewardListToUser(claimableRewards);
    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 130, spread: 100, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const sp = normalizeStarPassState(prev.starPass);
      const nextOwned = addOwnedPlayerCopies(
        prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS,
        deltas.unlockedCards.map((c) => c.id)
      );

      return {
        coins: prev.coins + deltas.coinsDelta,
        gems: prev.gems + deltas.gemsDelta,
        tickets: (prev.tickets ?? 0) + deltas.ticketsDelta,
        gingaShards: (prev.gingaShards ?? 0) + deltas.shardsDelta,
        clubTokens: (prev.clubTokens ?? 0) + deltas.clubTokensDelta,
        ownedPlayerIds: nextOwned,
        starPass: {
          ...sp,
          claimedFreeLevels: Array.from(new Set([...sp.claimedFreeLevels, ...newFreeIds])),
          claimedPremiumLevels: Array.from(
            new Set([...sp.claimedPremiumLevels, ...newPremIds])
          ),
        },
      };
    });

    if (deltas.unlockedCards.length > 0) {
      setCelebratedPlayers(deltas.unlockedCards);
    } else if (deltas.packsToOpen.length > 0) {
      onOpenRewardPack(deltas.packsToOpen[0].tier, deltas.packsToOpen[0].name);
    } else {
      showToast(
        t(
          `Đã nhận tất cả ${claimableRewards.length} mốc thưởng Star Pass!`,
          `Claimed all ${claimableRewards.length} Star Pass rewards!`
        )
      );
    }
  };

  function spHas(arr: number[], lvl: number) {
    return arr.includes(lvl);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#03140b] flex flex-col font-cruyff select-none overflow-hidden text-white">
      {/* Ambient Emerald + Samba Gold Ginga Stadium Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={GINGA_ASSETS.bg}
          alt=""
          className="w-full h-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 18% 45%, rgba(16,185,129,0.28) 0%, rgba(4,47,30,0.88) 52%, #020b06 100%)',
          }}
        />
      </div>

      {/* Top Section Header */}
      <TopSectionHeader
        title={t('GINGA STAR PASS · MÙA 2', 'GINGA STAR PASS · SEASON 2')}
        subtitle={t(
          'Tích lũy Star Point nhận Dybala 104 (Miễn Phí) & Gilberto Silva 106 CM (Cao Cấp) — Tất cả cầu thủ Không Giao Dịch',
          'Earn Star Points for Free 104 Dybala & Premium 106 Gilberto Silva CM — All players Untradeable'
        )}
        user={user}
        onBack={onClose}
        onGoHome={onGoHome}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl border border-white/60">
          {toastMsg}
        </div>
      )}

      {/* Top Control & Progress Bar Strip */}
      <div className="relative z-10 px-4 sm:px-6 py-3 bg-[#03140b]/92 border-b border-emerald-400/25 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Current Star Pass Level + Progress */}
        <div className="flex items-center gap-3.5 min-w-[260px] flex-1 max-w-xl">
          <div className="relative w-13 h-13 rounded-none bg-gradient-to-br from-emerald-400/25 via-green-700/35 to-amber-400/25 border border-emerald-300/65 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
            <img
              src={GINGA_ASSETS.miniPassLogo}
              alt="Ginga Star Pass"
              className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(250,204,21,0.65)]"
            />
            <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.2 rounded-none bg-yellow-400 text-slate-950 font-mono font-black text-[10px] border border-white/60">
              LV.{currentLevel}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-black uppercase tracking-wider text-cyan-200">
                {t('CẤP ĐỘ STAR PASS', 'STAR PASS LEVEL')} {currentLevel}/{STAR_PASS_MAX_LEVEL}
              </span>
              <span className="font-mono font-black text-yellow-300 tabular-nums">
                {starPass.points.toLocaleString(locale)} / {nextLevelPoints.toLocaleString(locale)} Star Point
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 border border-white/15 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-yellow-400 transition-all duration-500"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
              <span>
                {t('Đấu Sự Nghiệp:', 'Career:')}{' '}
                <strong className="text-emerald-300">
                  {t('+70~210 SP/trận', '+70~210 SP/match')}
                </strong>
              </span>
              <span>·</span>
              <span>
                {t('Đấu Xếp Hạng:', 'Ranked:')}{' '}
                <strong className="text-fuchsia-300">
                  {t('+90~260 SP/trận', '+90~260 SP/match')}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Claim All + Unlock Premium Pass */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={unclaimedCount === 0}
            onClick={handleClaimAll}
            className={`px-4 py-2.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
              unclaimedCount > 0
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-300 text-slate-950 border-white shadow-[0_0_22px_rgba(52,211,153,0.5)] hover:brightness-110'
                : 'bg-white/5 text-slate-500 border-white/15 cursor-not-allowed'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>
              {t('NHẬN TẤT CẢ', 'CLAIM ALL')} ({unclaimedCount})
            </span>
          </button>

          {starPass.isPremium ? (
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-yellow-400 text-yellow-300 font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-yellow-300" />
              <span>{t('ĐÃ KÍCH HOẠT PREMIUM PASS', 'PREMIUM PASS ACTIVE')}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUnlockPremium}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 border border-yellow-100 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(251,191,36,0.45)] flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Crown className="w-4 h-4" />
              <span>{t('MỞ PREMIUM PASS', 'UNLOCK PREMIUM')}</span>
              <span className="px-2 py-0.5 bg-slate-950/90 text-rose-300 font-mono text-xs flex items-center gap-1 tabular-nums">
                <img
                  src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                  alt=""
                  className="w-3.5 h-3.5 object-contain"
                />
                {PREMIUM_STAR_PASS_COST_GEMS.toLocaleString(locale)}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Content: Left Bellingham Spotlight + Right Horizontal 20-Level Track */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
        {/* LEFT COLUMN: FEATURED GINGA STAR PASS SPOTLIGHT (4 cols) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-emerald-400/20 bg-gradient-to-b from-[#062916]/90 via-[#04180d]/95 to-black p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Giant Gilberto Silva & Dybala Cutout Backdrop */}
          <img
            src="/assets/aistudio/106_gilberto_silva_ginga_960b23ec.png"
            alt="Gilberto Silva Ginga"
            className="absolute -right-6 bottom-10 h-[72%] object-contain opacity-40 pointer-events-none select-none drop-shadow-[0_12px_30px_rgba(16,185,129,0.45)]"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/15 border border-emerald-300/50 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                <img
                  src={GINGA_ASSETS.miniPassLogo}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
                <span>GINGA MINI PASS · ĐÃ RESET MÙA MỚI</span>
              </div>
              <span className="px-2 py-1 bg-rose-950/90 border border-rose-400/60 text-rose-200 text-[9px] font-black uppercase">
                KHÔNG GIAO DỊCH
              </span>
            </div>

            <h2 className="font-cruyff font-black text-2xl sm:text-3xl uppercase italic tracking-wide text-white leading-none">
              DYBALA 104 &amp; GILBERTO SILVA 106 CM
            </h2>
            <p className="text-xs text-amber-300 font-bold uppercase tracking-wider mt-1.5">
              CẤP 60 MIỄN PHÍ: 104 DYBALA (CAM) · CẤP 60 CAO CẤP: 106 GILBERTO SILVA (CM)
            </p>

            {/* Featured Cards Showcase */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex flex-col items-center">
                <FCCard player={dybalaGinga104} size="sm" showStats={false} />
                <span className="mt-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-300/50 text-[10px] font-black uppercase text-emerald-200">
                  Cấp 60 Free · 104 CAM
                </span>
              </div>
              <div className="flex flex-col items-center">
                <FCCard player={gilbertoSilvaGinga106} size="sm" showStats={false} />
                <span className="mt-1 px-2 py-0.5 bg-amber-400/20 border border-amber-300/65 text-[10px] font-black uppercase text-amber-200">
                  Cấp 60 Premium · 106 CM
                </span>
              </div>
            </div>
          </div>

          {/* Quick Match Mode Shortcuts to Earn Star Points */}
          <div className="relative z-10 mt-5 pt-3 border-t border-white/15 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
              CÀY STAR POINT NHANH TỪ CÁC TRẬN ĐẤU:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onGoToCareer();
                }}
                className="p-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-black text-xs uppercase text-emerald-300">ĐẤU SỰ NGHIỆP</div>
                  <div className="text-[10px] text-slate-300">+70 ~ 210 SP / trận</div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onGoToRanked();
                }}
                className="p-2.5 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/50 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-black text-xs uppercase text-fuchsia-300">ĐẤU XẾP HẠNG</div>
                  <div className="text-[10px] text-slate-300">+90 ~ 260 SP / trận</div>
                </div>
                <ChevronRight className="w-4 h-4 text-fuchsia-300 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 60-LEVEL HORIZONTAL FC MOBILE STAR PASS TRACK (8 cols) */}
        <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-black text-sm uppercase tracking-wider text-white">
                CHUỖI PHẦN THƯỞNG STAR PASS (60 CẤP ĐỘ)
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Vuốt hoặc cuộn ngang để xem toàn bộ chuỗi mốc 1 → 60
            </span>
          </div>

          {/* Horizontal Scrollable Dual Track */}
          <div className="flex-1 overflow-x-auto overflow-y-auto pb-3">
            <div className="inline-flex items-stretch gap-3 min-w-max pr-4">
              {/* Track Row Labels Sticky Column */}
              <div className="sticky left-0 z-20 w-28 shrink-0 flex flex-col justify-between bg-slate-950/95 border border-white/20 p-2.5 shadow-xl">
                <div className="h-[168px] flex flex-col items-center justify-center text-center border-b border-amber-400/30 pb-2">
                  <Crown className="w-6 h-6 text-yellow-400 mb-1" />
                  <span className="font-black text-xs uppercase text-yellow-300 tracking-wider">
                    PREMIUM PASS
                  </span>
                  <span className="text-[10px] text-amber-200/80 mt-0.5">
                    {starPass.isPremium ? 'Đã mở khóa' : 'Nhánh Cao Cấp'}
                  </span>
                </div>

                <div className="py-1.5 text-center font-mono font-black text-[11px] uppercase text-cyan-300">
                  CẤP ĐỘ
                </div>

                <div className="h-[168px] flex flex-col items-center justify-center text-center border-t border-cyan-400/30 pt-2">
                  <img
                    src={GINGA_ASSETS.miniPassLogo}
                    alt="Free Pass"
                    className="w-7 h-7 object-contain mb-1"
                  />
                  <span className="font-black text-xs uppercase text-emerald-200 tracking-wider">
                    GINGA FREE
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Nhánh Miễn Phí</span>
                </div>
              </div>

              {/* 20 Tier Columns */}
              {STAR_PASS_TIERS.map((tier) => {
                const isReached = starPass.points >= tier.requiredPoints;
                const freeClaimed = starPass.claimedFreeLevels.includes(tier.level);
                const premClaimed = starPass.claimedPremiumLevels.includes(tier.level);
                const canClaimFree = isReached && !freeClaimed;
                const canClaimPrem = isReached && starPass.isPremium && !premClaimed;

                return (
                  <div
                    key={tier.level}
                    className={`w-36 shrink-0 flex flex-col justify-between border transition-all ${
                      tier.level === 60 || tier.level % 10 === 0
                        ? 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-cyan-950/60 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.28)]'
                        : isReached
                        ? 'bg-slate-900/90 border-cyan-400/50'
                        : 'bg-slate-950/75 border-white/15 opacity-85'
                    }`}
                  >
                    {/* TOP CELL: PREMIUM REWARD */}
                    <div className="h-[168px] p-2 flex flex-col items-center justify-between border-b border-white/10 relative">
                      {!starPass.isPremium && (
                        <Lock className="w-3.5 h-3.5 text-amber-300/70 absolute top-2 right-2" />
                      )}

                      <div className="flex-1 flex items-center justify-center">
                        {tier.premiumReward.playerCard ? (
                          <FCCard
                            player={tier.premiumReward.playerCard}
                            size="pitch"
                            showStats={false}
                          />
                        ) : (
                          <div className="relative w-24 aspect-[30/23] flex items-center justify-center">
                            <img
                              src={GINGA_ASSETS.rewardFramePremium}
                              alt=""
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                            />
                            <img
                              src={tier.premiumReward.iconUrl}
                              alt={tier.premiumReward.label}
                              className="relative z-10 w-12 h-12 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="w-full text-center">
                        <div className="font-black text-xs text-amber-200 truncate">
                          {isEn && tier.premiumReward.labelEn
                            ? tier.premiumReward.labelEn
                            : tier.premiumReward.label}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mb-1">
                          {isEn && tier.premiumReward.subLabelEn
                            ? tier.premiumReward.subLabelEn
                            : tier.premiumReward.subLabel}
                        </div>

                        {premClaimed ? (
                          <div className="w-full py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> {t('ĐÃ NHẬN', 'CLAIMED')}
                          </div>
                        ) : canClaimPrem ? (
                          <button
                            type="button"
                            onClick={() => handleClaimSingle(tier.level, 'premium')}
                            className="w-full py-1 bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 text-[10px] font-black uppercase cursor-pointer hover:brightness-110"
                          >
                            {t('NHẬN NGAY', 'CLAIM')}
                          </button>
                        ) : (
                          <div className="w-full py-1 bg-white/5 text-slate-500 text-[10px] font-bold uppercase">
                            {!starPass.isPremium
                              ? t('CẦN PREMIUM', 'PREMIUM')
                              : `${tier.requiredPoints} SP`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MIDDLE LEVEL BADGE */}
                    <div
                      className={`py-1.5 px-2 text-center font-mono font-black text-xs flex items-center justify-center gap-1 ${
                        isReached
                          ? 'bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 text-yellow-300'
                          : 'bg-black/60 text-slate-400'
                      }`}
                    >
                      <span>
                        {t('CẤP', 'LV.')} {tier.level}
                      </span>
                      <span className="text-[10px] opacity-75">({tier.requiredPoints} SP)</span>
                    </div>

                    {/* BOTTOM CELL: FREE REWARD */}
                    <div className="h-[168px] p-2 flex flex-col items-center justify-between border-t border-white/10">
                      <div className="flex-1 flex items-center justify-center">
                        {tier.freeReward.playerCard ? (
                          <FCCard
                            player={tier.freeReward.playerCard}
                            size="pitch"
                            showStats={false}
                          />
                        ) : (
                          <div className="relative w-24 aspect-[30/23] flex items-center justify-center">
                            <img
                              src={GINGA_ASSETS.rewardFrameNormal}
                              alt=""
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                            />
                            <img
                              src={tier.freeReward.iconUrl}
                              alt={tier.freeReward.label}
                              className="relative z-10 w-12 h-12 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="w-full text-center">
                        <div className="font-black text-xs text-white truncate">
                          {isEn && tier.freeReward.labelEn
                            ? tier.freeReward.labelEn
                            : tier.freeReward.label}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mb-1">
                          {isEn && tier.freeReward.subLabelEn
                            ? tier.freeReward.subLabelEn
                            : tier.freeReward.subLabel}
                        </div>

                        {freeClaimed ? (
                          <div className="w-full py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" /> {t('ĐÃ NHẬN', 'CLAIMED')}
                          </div>
                        ) : canClaimFree ? (
                          <button
                            type="button"
                            onClick={() => handleClaimSingle(tier.level, 'free')}
                            className="w-full py-1 bg-gradient-to-r from-cyan-400 to-emerald-300 text-slate-950 text-[10px] font-black uppercase cursor-pointer hover:brightness-110"
                          >
                            {t('NHẬN NGAY', 'CLAIM')}
                          </button>
                        ) : (
                          <div className="w-full py-1 bg-white/5 text-slate-500 text-[10px] font-bold uppercase">
                            {tier.requiredPoints} SP
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CELEBRATORY SUPERSTAR UNLOCK OVERLAY */}
      {celebratedPlayers.length > 0 && (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-950 border-2 border-yellow-400 p-6 text-center flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(250,204,21,0.4)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>PHẦN THƯỞNG CẦU THỦ STAR PASS</span>
            </div>
            <h3 className="font-cruyff font-black text-2xl text-white uppercase italic">
              CHIÊU MỘ THÀNH CÔNG VÀO CÂU LẠC BỘ!
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
              {celebratedPlayers.map((pl) => (
                <FCCard key={pl.id} player={pl} size="md" />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setCelebratedPlayers([]);
              }}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-cruyff font-black text-sm uppercase tracking-wider cursor-pointer hover:brightness-110"
            >
              TUYỆT VỜI · ĐỒNG Ý
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
