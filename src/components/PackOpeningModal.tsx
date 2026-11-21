import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, ChevronRight, X, CheckCircle2, Info, SkipForward } from 'lucide-react';
import { soundService } from '../services/sound';
import { resourceRewardAnimService } from '../services/resourceRewardAnim';
import { PlayerCard, TicketSpinTheme } from '../types/game';
import {
  totyFeaturedPlayers,
  utotyIconsPlayers,
  futureStarsPlayers,
  laligaPlayers,
  euro2024Players,
  conmebolLibertadoresPlayers,
} from '../data/mockData';
import {
  gingaPlayers,
  gingaAllPlayers,
  gingaWeek1BAllPlayers,
  GINGA_ASSETS,
} from '../data/gingaData';
import { bundesligaAllPlayers, BUNDESLIGA_ASSETS } from '../data/bundesligaData';
import {
  championsJuventusAllPlayers,
  CHAMPIONS_JUVENTUS_ASSETS,
} from '../data/championsJuventusData';
import { useLibertadoresAssets } from '../data/libertadoresAssets';
import { NationBadge, PositionBadge, ClubBadge } from './WalkoutBadges';
import { FCCard } from './FCCard';
import {
  filterTotyBasePool,
  filterNationalOfferPool,
  filterStarter97OfferPool,
  filterSouthAmerica90PlusPool,
  filterConmebolLibertadoresSeasonPool,
  filterMixed100To103Pool,
  filterPremierLeagueOfferPool,
  filterFutureStarsOfferPool,
  filterBundesliga88PlusPool,
  isBundesligaCard,
  isChampionsJuventusCard,
  drawWeightedPlayer,
  drawPlayerFromTicket,
  drawNormalTotyFromTicket,
  drawFutureStarsFromTicket,
  drawGingaFromTicket,
  drawGingaWeek1BFromTicket,
  drawBundesligaFromTicket,
  drawChampionsJuventusFromTicket,
  drawLibertadoresFromTicket,
  drawGuaranteedPoolPlayerForTheme,
} from '../utils/packOdds';
import { PackOddsModal } from './PackOddsModal';

export type PackTier =
  | 'A'
  | 'B'
  | 'C'
  | 'UTOTY'
  | 'TOTY_90_95'
  | 'TOTY_100'
  | 'STARPASS_85_94'
  | 'STARPASS_95_PLUS'
  | 'MIXED_83_PLUS'
  | 'MIXED_86_PLUS'
  | 'MIXED_90_PLUS'
  | 'MIXED_94_PLUS'
  | 'MIXED_98_PLUS'
  | 'MIXED_90_99'
  | 'MIXED_100_PLUS'
  | 'FUTURE_STARS_90_95'
  | 'FRANCE_90_100'
  | 'ARGENTINA_90_100'
  | 'NETHERLANDS_90_100'
  | 'ITALY_90_100'
  | 'SPAIN_90_100'
  | 'ENGLAND_90_100'
  | 'BRAZIL_90_100'
  | 'PORTUGAL_90_100'
  | 'PREMIER_LEAGUE_90_100'
  | 'FUTURE_STARS_90_100'
  | 'STARTER_97'
  | 'CONMEBOL_SOUTH_AMERICA_90_PLUS'
  | 'CONMEBOL_100_103'
  | 'CONMEBOL_2_102_PLUS'
  | 'GINGA_100_OVR'
  | 'GINGA_92_106'
  | 'GINGA_PACK_A'
  | 'BUNDESLIGA_88_PLUS';

interface PackOpeningModalProps {
  onClose: () => void;
  onPlayerClaimed: (player: PlayerCard, resources: { coins: number; gems: number; tokens: number }) => void;
  onMultiplePlayersClaimed?: (players: PlayerCard[], resources: { coins: number; gems: number; tokens: number }) => void;
  packTier?: PackTier;
  packTheme?: TicketSpinTheme;
  packName?: string;
  isTicketSpin?: boolean;
  spinCount?: 1 | 10;
  initialTicketsOpenedBeforeSpin?: number;
  ticketsRemaining?: number;
  onUseTicket?: (count: number) => boolean;
  fixedPlayer?: PlayerCard;
  autoStartWalkout?: boolean;
  skipResourceBonus?: boolean;
  isIconChroniclesExchange?: boolean;
  isContractSigning?: boolean;
}

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({
  onClose,
  onPlayerClaimed,
  onMultiplePlayersClaimed,
  packTier = 'GINGA_92_106',
  packTheme = 'GINGA',
  packName,
  isTicketSpin = true,
  spinCount = 1,
  initialTicketsOpenedBeforeSpin = 0,
  ticketsRemaining = 0,
  onUseTicket,
  fixedPlayer,
  autoStartWalkout = false,
  skipResourceBonus = false,
  isIconChroniclesExchange = false,
  isContractSigning = false,
}) => {
  const effectiveTheme: TicketSpinTheme = fixedPlayer
    ? fixedPlayer.cardType === 'CHAMPIONS_JUVENTUS'
      ? 'CHAMPIONS_JUVENTUS'
      : fixedPlayer.cardType === 'BUNDESLIGA'
      ? 'BUNDESLIGA'
      : fixedPlayer.cardType === 'GINGA' || fixedPlayer.cardType === 'GINGA_ICON'
      ? 'GINGA'
      : fixedPlayer.cardType === 'CONMEBOL_LIBERTADORES'
      ? 'LIBERTADORES'
      : fixedPlayer.cardType === 'FUTURE_STARS'
      ? 'FUTURE_STARS'
      : fixedPlayer.cardType === 'TOTY' ||
        fixedPlayer.cardType === 'TOTY26_HM' ||
        fixedPlayer.cardType === 'TOTY_ICON'
      ? 'TOTY'
      : 'UTOTY'
    : packTheme;
  const { getAsset: getLibAsset } = useLibertadoresAssets();
  const [currentSpinCount, setCurrentSpinCount] = useState<1 | 10>(spinCount);
  const cumulativeTicketsRef = useRef<number>(initialTicketsOpenedBeforeSpin + spinCount);
  const isFranceOfferPack = !isTicketSpin && packTier === 'FRANCE_90_100';
  const isArgentinaOfferPack = !isTicketSpin && packTier === 'ARGENTINA_90_100';
  const isNetherlandsOfferPack = !isTicketSpin && packTier === 'NETHERLANDS_90_100';
  const isItalyOfferPack = !isTicketSpin && packTier === 'ITALY_90_100';
  const isSpainOfferPack = !isTicketSpin && packTier === 'SPAIN_90_100';
  const isEnglandOfferPack = !isTicketSpin && packTier === 'ENGLAND_90_100';
  const isBrazilOfferPack = !isTicketSpin && packTier === 'BRAZIL_90_100';
  const isPortugalOfferPack = !isTicketSpin && packTier === 'PORTUGAL_90_100';
  const isPremierLeagueOfferPack = !isTicketSpin && packTier === 'PREMIER_LEAGUE_90_100';
  const isFutureStarsOfferPack = !isTicketSpin && packTier === 'FUTURE_STARS_90_100';
  const isStarter97OfferPack = !isTicketSpin && packTier === 'STARTER_97';
  const isConmebol90PlusPack = !isTicketSpin && packTier === 'CONMEBOL_SOUTH_AMERICA_90_PLUS';
  const isConmebol100To103Pack = !isTicketSpin && packTier === 'CONMEBOL_100_103';
  const isConmebol2Pack = !isTicketSpin && packTier === 'CONMEBOL_2_102_PLUS';
  const isConmebolPack = isConmebol90PlusPack || isConmebol100To103Pack || isConmebol2Pack;
  const isGinga100Pack = !isTicketSpin && packTier === 'GINGA_100_OVR';
  const isGinga92Pack = !isTicketSpin && packTier === 'GINGA_92_106';
  const isGingaPackA = !isTicketSpin && packTier === 'GINGA_PACK_A';
  const isGingaStorePack = isGinga100Pack || isGinga92Pack || isGingaPackA;
  const isBundesliga88PlusPack = !isTicketSpin && packTier === 'BUNDESLIGA_88_PLUS';
  const isBallonDorStreakPack =
    !isTicketSpin &&
    (packTier === 'MIXED_83_PLUS' ||
      packTier === 'MIXED_86_PLUS' ||
      packTier === 'MIXED_90_PLUS' ||
      packTier === 'MIXED_94_PLUS' ||
      packTier === 'MIXED_98_PLUS');
  const isStoreOfferPackB =
    isFranceOfferPack ||
    isArgentinaOfferPack ||
    isNetherlandsOfferPack ||
    isItalyOfferPack ||
    isSpainOfferPack ||
    isEnglandOfferPack ||
    isBrazilOfferPack ||
    isPortugalOfferPack ||
    isPremierLeagueOfferPack ||
    isFutureStarsOfferPack ||
    isStarter97OfferPack ||
    isConmebolPack ||
    isGingaStorePack ||
    isBundesliga88PlusPack;
  const isJuventusPack =
    !isIconChroniclesExchange &&
    ((isTicketSpin && effectiveTheme === 'CHAMPIONS_JUVENTUS') ||
      effectiveTheme === 'CHAMPIONS_JUVENTUS');
  const isBundesligaPack =
    !isIconChroniclesExchange &&
    !isJuventusPack &&
    ((isTicketSpin && effectiveTheme === 'BUNDESLIGA') ||
      effectiveTheme === 'BUNDESLIGA' ||
      isBundesliga88PlusPack);
  const isGingaWeek1BPack =
    !isIconChroniclesExchange &&
    !isBundesligaPack &&
    !isJuventusPack &&
    effectiveTheme === 'GINGA_W1B';
  const isGingaPack =
    !isIconChroniclesExchange &&
    !isBundesligaPack &&
    !isJuventusPack &&
    (effectiveTheme === 'GINGA' || effectiveTheme === 'GINGA_W1B' || isGingaStorePack);
  const isFutureStarsPack =
    (!isStoreOfferPackB &&
      !isJuventusPack &&
      ((isTicketSpin && effectiveTheme === 'FUTURE_STARS') ||
        effectiveTheme === 'FUTURE_STARS' ||
        packTier === 'FUTURE_STARS_90_95')) ||
    isFutureStarsOfferPack;

  useEffect(() => {
    resourceRewardAnimService.setSuppressed('player_pack', true);
    return () => {
      resourceRewardAnimService.setSuppressed('player_pack', false);
    };
  }, []);

  // Helper to generate a single roll
  const rollSingle = (tier: PackTier): { player: PlayerCard; tier: PackTier } => {
    const totyOnly = filterTotyBasePool(totyFeaturedPlayers);

    if (isTicketSpin) {
      if (packTheme === 'CHAMPIONS_JUVENTUS') {
        return drawChampionsJuventusFromTicket(
          [
            ...totyFeaturedPlayers,
            ...futureStarsPlayers,
            ...euro2024Players,
            ...laligaPlayers,
            ...gingaAllPlayers,
            ...bundesligaAllPlayers,
          ],
          championsJuventusAllPlayers
        );
      }
      if (packTheme === 'BUNDESLIGA') {
        return drawBundesligaFromTicket(
          [
            ...totyFeaturedPlayers,
            ...futureStarsPlayers,
            ...euro2024Players,
            ...laligaPlayers,
            ...gingaAllPlayers,
            ...championsJuventusAllPlayers,
          ],
          bundesligaAllPlayers
        );
      }
      if (packTheme === 'GINGA_W1B') {
        return drawGingaWeek1BFromTicket(totyFeaturedPlayers, gingaWeek1BAllPlayers);
      }
      if (packTheme === 'GINGA') {
        return drawGingaFromTicket(totyFeaturedPlayers, gingaAllPlayers);
      }
      if (packTheme === 'LIBERTADORES') {
        return drawLibertadoresFromTicket(totyFeaturedPlayers);
      }
      if (packTheme === 'FUTURE_STARS') {
        return drawFutureStarsFromTicket(totyFeaturedPlayers, futureStarsPlayers);
      }
      if (packTheme === 'TOTY') {
        return drawNormalTotyFromTicket(totyFeaturedPlayers);
      }
      return drawPlayerFromTicket(totyFeaturedPlayers);
    }

    if (tier === 'BUNDESLIGA_88_PLUS') {
      const allBundesligaCandidates = [
        ...bundesligaAllPlayers,
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ];
      const bl88Pool = filterBundesliga88PlusPool(allBundesligaCandidates);
      const picked = drawWeightedPlayer(
        bl88Pool.length > 0 ? bl88Pool : bundesligaAllPlayers,
        'A'
      );
      return {
        player: { ...picked, isUntradeableOnly: true, isTradeable: false },
        tier: picked.ovr >= 102 ? 'A' : 'B',
      };
    }

    if (tier === 'CONMEBOL_SOUTH_AMERICA_90_PLUS') {
      const allPool = [
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...laligaPlayers,
      ];
      const saPool = filterSouthAmerica90PlusPool(allPool);
      const picked = drawWeightedPlayer(saPool.length > 0 ? saPool : totyOnly, 'B');
      return {
        player: picked,
        tier: picked.ovr >= 100 ? 'A' : 'B',
      };
    }

    if (tier === 'CONMEBOL_2_102_PLUS') {
      const libPool = filterConmebolLibertadoresSeasonPool(totyFeaturedPlayers);
      const picked = drawWeightedPlayer(
        libPool.length > 0 ? libPool : conmebolLibertadoresPlayers,
        'A'
      );
      return {
        player: picked,
        tier: 'A',
      };
    }

    if (tier === 'CONMEBOL_100_103') {
      const allPool = [
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ];
      const mixed100To103 = filterMixed100To103Pool(allPool);
      const picked = drawWeightedPlayer(mixed100To103.length > 0 ? mixed100To103 : totyOnly, 'A');
      return {
        player: picked,
        tier: 'A',
      };
    }

    if (tier === 'GINGA_100_OVR') {
      const ginga100 = gingaAllPlayers.filter((p) => p.ovr >= 100);
      const picked = drawWeightedPlayer(ginga100.length > 0 ? ginga100 : gingaAllPlayers, 'A');
      return {
        player: picked,
        tier: picked.ovr >= 102 ? 'A' : 'B',
      };
    }

    if (tier === 'GINGA_92_106') {
      const ginga92 = gingaAllPlayers.filter((p) => p.ovr >= 92);
      const picked = drawWeightedPlayer(ginga92.length > 0 ? ginga92 : gingaAllPlayers, 'B');
      return {
        player: picked,
        tier: picked.ovr >= 102 ? 'A' : 'B',
      };
    }

    if (tier === 'GINGA_PACK_A') {
      const picked = drawWeightedPlayer(gingaPlayers, 'A');
      return {
        player: picked,
        tier: 'A',
      };
    }

    if (tier === 'STARTER_97') {
      const starterPool = filterStarter97OfferPool(totyFeaturedPlayers);
      const chosen = starterPool.length > 0 ? starterPool : totyOnly.filter((p) => p.ovr === 97);
      const picked = chosen[Math.floor(Math.random() * chosen.length)] || totyOnly[0];
      return {
        player: picked,
        tier: 'B',
      };
    }

    if (
      tier === 'FRANCE_90_100' ||
      tier === 'ARGENTINA_90_100' ||
      tier === 'NETHERLANDS_90_100' ||
      tier === 'ITALY_90_100' ||
      tier === 'SPAIN_90_100' ||
      tier === 'ENGLAND_90_100' ||
      tier === 'BRAZIL_90_100' ||
      tier === 'PORTUGAL_90_100'
    ) {
      const countryKey =
        tier === 'FRANCE_90_100'
          ? 'FRANCE'
          : tier === 'ARGENTINA_90_100'
          ? 'ARGENTINA'
          : tier === 'NETHERLANDS_90_100'
          ? 'NETHERLANDS'
          : tier === 'ITALY_90_100'
          ? 'ITALY'
          : tier === 'SPAIN_90_100'
          ? 'SPAIN'
          : tier === 'ENGLAND_90_100'
          ? 'ENGLAND'
          : tier === 'BRAZIL_90_100'
          ? 'BRAZIL'
          : 'PORTUGAL';
      const natPool = filterNationalOfferPool(totyFeaturedPlayers, countryKey);
      return {
        player: drawWeightedPlayer(natPool.length > 0 ? natPool : totyOnly, 'B'),
        tier: 'B',
      };
    }

    if (tier === 'PREMIER_LEAGUE_90_100') {
      const plPool = filterPremierLeagueOfferPool(totyFeaturedPlayers);
      return {
        player: drawWeightedPlayer(plPool.length > 0 ? plPool : totyOnly, 'B'),
        tier: 'B',
      };
    }

    if (tier === 'FUTURE_STARS_90_100') {
      const fsPool = filterFutureStarsOfferPool(futureStarsPlayers);
      return {
        player: drawWeightedPlayer(fsPool.length > 0 ? fsPool : futureStarsPlayers, 'B'),
        tier: 'B',
      };
    }

    if (tier === 'FUTURE_STARS_90_95') {
      const fs9095 = futureStarsPlayers.filter((p) => p.ovr >= 90 && p.ovr <= 95);
      const chosen = fs9095.length > 0 ? fs9095 : futureStarsPlayers;
      return {
        player: drawWeightedPlayer(chosen, 'B'),
        tier: 'B',
      };
    }

    if (tier === 'TOTY_90_95') {
      const pool9095 = totyOnly.filter((p) => p.ovr >= 90 && p.ovr <= 95);
      const chosen = pool9095.length > 0 ? pool9095 : totyOnly.filter((p) => p.ovr >= 91);
      return {
        player: drawWeightedPlayer(chosen, 'A'),
        tier: 'A',
      };
    }

    if (tier === 'STARPASS_85_94') {
      const seen = new Set<string>();
      const all8594 = [
        ...gingaAllPlayers,
        ...totyFeaturedPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (
          p.isExchangeExclusive ||
          p.isUntradeableOnly ||
          p.ovr < 85 ||
          p.ovr > 94 ||
          seen.has(p.id)
        )
          return false;
        seen.add(p.id);
        return true;
      });
      const chosen =
        all8594.length > 0 ? all8594 : totyOnly.filter((p) => p.ovr >= 85 && p.ovr <= 94);
      const picked = drawWeightedPlayer(chosen.length > 0 ? chosen : totyOnly, 'B');
      return {
        player: { ...picked, isUntradeableOnly: true, isTradeable: false },
        tier: picked.ovr >= 90 ? 'B' : 'C',
      };
    }

    if (tier === 'STARPASS_95_PLUS') {
      const seen = new Set<string>();
      const all95Plus = [
        ...gingaAllPlayers,
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.isExchangeExclusive || p.isUntradeableOnly || p.ovr < 95 || seen.has(p.id))
          return false;
        seen.add(p.id);
        return true;
      });
      const chosen =
        all95Plus.length > 0 ? all95Plus : totyOnly.filter((p) => p.ovr >= 95);
      const picked = drawWeightedPlayer(chosen.length > 0 ? chosen : totyOnly, 'A');
      return {
        player: { ...picked, isUntradeableOnly: true, isTradeable: false },
        tier: picked.ovr >= 100 ? 'A' : 'B',
      };
    }

    if (tier === 'MIXED_90_99') {
      const seen = new Set<string>();
      const all9099 = [
        ...totyFeaturedPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.isExchangeExclusive || p.ovr < 90 || p.ovr > 99 || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      const chosen =
        all9099.length > 0 ? all9099 : totyOnly.filter((p) => p.ovr >= 90 && p.ovr <= 99);
      return {
        player: drawWeightedPlayer(chosen.length > 0 ? chosen : totyOnly, 'B'),
        tier: 'B',
      };
    }

    if (
      tier === 'MIXED_83_PLUS' ||
      tier === 'MIXED_86_PLUS' ||
      tier === 'MIXED_90_PLUS' ||
      tier === 'MIXED_94_PLUS' ||
      tier === 'MIXED_98_PLUS'
    ) {
      const minOvr =
        tier === 'MIXED_83_PLUS'
          ? 83
          : tier === 'MIXED_86_PLUS'
          ? 86
          : tier === 'MIXED_90_PLUS'
          ? 90
          : tier === 'MIXED_94_PLUS'
          ? 94
          : 98;
      const seen = new Set<string>();
      const mixedPool = [
        ...gingaAllPlayers,
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (
          p.isExchangeExclusive ||
          p.isUntradeableOnly ||
          p.cardType === 'VIETNAM_CHRONICLES' ||
          p.ovr < minOvr ||
          seen.has(p.id)
        ) {
          return false;
        }
        seen.add(p.id);
        return true;
      });
      const chosen = mixedPool.length > 0 ? mixedPool : totyOnly.filter((p) => p.ovr >= minOvr);
      const picked = drawWeightedPlayer(
        chosen.length > 0 ? chosen : totyOnly,
        minOvr >= 98 ? 'A' : 'B'
      );
      return {
        player: picked,
        tier: picked.ovr >= 100 ? 'A' : picked.ovr >= 90 ? 'B' : 'C',
      };
    }

    if (tier === 'MIXED_100_PLUS') {
      const seen = new Set<string>();
      const allCandidates = [
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.ovr < 100 || p.isExchangeExclusive || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      const chosen = allCandidates.length > 0 ? allCandidates : totyOnly.filter((p) => p.ovr >= 100);
      return {
        player: drawWeightedPlayer(chosen.length > 0 ? chosen : totyOnly, 'A'),
        tier: 'A',
      };
    }

    if (tier === 'TOTY_100') {
      const pool100 = totyOnly.filter((p) => p.ovr === 100);
      const chosen = pool100.length > 0 ? pool100 : totyOnly.filter((p) => p.ovr >= 100);
      const picked = chosen[Math.floor(Math.random() * chosen.length)] || totyOnly[0];
      return {
        player: picked,
        tier: 'UTOTY',
      };
    }

    const pool =
      tier === 'C'
        ? totyOnly.filter((p) => p.ovr <= 80)
        : tier === 'B'
        ? totyOnly.filter((p) => p.ovr >= 81 && p.ovr <= 90)
        : tier === 'UTOTY'
        ? totyOnly.filter((p) => p.ovr >= 100)
        : totyOnly.filter((p) => p.ovr >= 91);
    const chosenPool = pool.length > 0 ? pool : totyOnly;
    const picked = drawWeightedPlayer(chosenPool, tier === 'UTOTY' ? 'A' : tier);
    return {
      player: picked,
      tier: tier === 'UTOTY' ? 'A' : tier === 'B' && picked.ovr < 90 ? 'C' : tier,
    };
  };

  const stampTradeable = (
    card: PlayerCard,
    fromTicket: boolean,
    pityMilestone?: 'POOL_B_20' | 'POOL_A_250'
  ): PlayerCard => ({
    ...card,
    isTradeable: card.isUntradeableOnly ? false : fromTicket ? Math.random() < 0.1 : false,
    ...(pityMilestone ? { pityMilestone } : {}),
  });

  const buildDrawBatch = (
    tier: PackTier,
    count: number,
    beforeSpinCount?: number
  ): Array<{ player: PlayerCard; tier: PackTier }> => {
    if (!isTicketSpin && tier === 'CONMEBOL_100_103') {
      // Pack CONMEBOL Libertadores 1: 1 cầu thủ 100-103 hỗn hợp + 1 cầu thủ CONMEBOL Libertadores 102-106 (Cửa hàng: 0% giao dịch)
      const mixedDraw = rollSingle('CONMEBOL_100_103');
      const conmebolDraw = rollSingle('CONMEBOL_2_102_PLUS');
      return [
        { ...mixedDraw, player: stampTradeable(mixedDraw.player, false) },
        { ...conmebolDraw, player: stampTradeable(conmebolDraw.player, false) },
      ];
    }
    const list: Array<{ player: PlayerCard; tier: PackTier }> = [];
    const forceUntradeableStarPass = tier === 'STARPASS_85_94' || tier === 'STARPASS_95_PLUS';
    for (let i = 0; i < count; i++) {
      const drawn = rollSingle(tier);
      const stamped = stampTradeable(drawn.player, forceUntradeableStarPass ? false : isTicketSpin);
      list.push({
        ...drawn,
        player: forceUntradeableStarPass
          ? { ...stamped, isUntradeableOnly: true, isTradeable: false }
          : stamped,
      });
    }

    // Mốc bảo hiểm Vé Quay: Mỗi 20 vé tặng +1 cầu thủ Pool B, mỗi 250 vé tặng +1 cầu thủ Pool A (10% tỷ lệ giao dịch)
    if (isTicketSpin && typeof beforeSpinCount === 'number') {
      const afterSpinCount = beforeSpinCount + count;
      const bonusPoolBCount =
        Math.floor(afterSpinCount / 20) - Math.floor(beforeSpinCount / 20);
      const bonusPoolACount =
        Math.floor(afterSpinCount / 250) - Math.floor(beforeSpinCount / 250);

      const extraPools = {
        futureStarsPool: futureStarsPlayers,
        gingaPool: gingaAllPlayers,
        gingaW1BPool: gingaWeek1BAllPlayers,
        bundesligaPool: bundesligaAllPlayers,
        juventusPool: championsJuventusAllPlayers,
      };

      for (let b = 0; b < bonusPoolBCount; b++) {
        const guaranteedB = drawGuaranteedPoolPlayerForTheme(
          packTheme,
          'B',
          totyFeaturedPlayers,
          extraPools
        );
        list.push({
          player: stampTradeable(guaranteedB.player, true, 'POOL_B_20'),
          tier: guaranteedB.tier,
        });
      }

      for (let a = 0; a < bonusPoolACount; a++) {
        const guaranteedA = drawGuaranteedPoolPlayerForTheme(
          packTheme,
          'A',
          totyFeaturedPlayers,
          extraPools
        );
        list.push({
          player: stampTradeable(guaranteedA.player, true, 'POOL_A_250'),
          tier: guaranteedA.tier,
        });
      }
    }

    return list;
  };

  // Roll results: either fixedPlayer (exchange walkout), 2-card CONMEBOL_100_103, or 1 / 10 random players (+ pity bonus)
  const [drawResults, setDrawResults] = useState<Array<{ player: PlayerCard; tier: PackTier }>>(() => {
    if (fixedPlayer) {
      return [{ player: { ...fixedPlayer, isTradeable: Boolean(fixedPlayer.isTradeable) }, tier: 'A' }];
    }
    return buildDrawBatch(
      packTier,
      spinCount,
      isTicketSpin ? initialTicketsOpenedBeforeSpin : undefined
    );
  });

  // Prioritize Tier A > Tier B > Tier C, CONMEBOL Libertadores feature card in CONMEBOL_100_103, then highest OVR
  const tierPriority = (t: PackTier) =>
    t === 'A' ||
    t === 'UTOTY' ||
    t === 'MIXED_100_PLUS' ||
    t === 'STARPASS_95_PLUS' ||
    t === 'CONMEBOL_2_102_PLUS' ||
    t === 'CONMEBOL_100_103' ||
    t === 'GINGA_PACK_A' ||
    t === 'GINGA_100_OVR' ||
    t === 'BUNDESLIGA_88_PLUS'
      ? 3
      : t === 'B' || t === 'STARPASS_85_94' || t === 'GINGA_92_106'
      ? 2
      : 1;
  const bestDraw =
    [...drawResults].sort((a, b) => {
      const pDiff = tierPriority(b.tier) - tierPriority(a.tier);
      if (pDiff !== 0) return pDiff;
      if (isConmebol100To103Pack) {
        const aLib = a.player.cardType === 'CONMEBOL_LIBERTADORES' ? 1 : 0;
        const bLib = b.player.cardType === 'CONMEBOL_LIBERTADORES' ? 1 : 0;
        if (bLib !== aLib) return bLib - aLib;
      }
      if (b.player.ovr !== a.player.ovr) return b.player.ovr - a.player.ovr;
      const aLibTie = a.player.cardType === 'CONMEBOL_LIBERTADORES' ? 1 : 0;
      const bLibTie = b.player.cardType === 'CONMEBOL_LIBERTADORES' ? 1 : 0;
      return bLibTie - aLibTie;
    })[0] || drawResults[0];
  const bestPlayer = bestDraw.player;
  const isIconChroniclesExchangeBest =
    Boolean(isIconChroniclesExchange) ||
    bestPlayer.id.startsWith('ultimate_icon_') ||
    bestPlayer.id.startsWith('chronicles_icon_') ||
    bestPlayer.id.startsWith('classics_icon_') ||
    bestPlayer.id.startsWith('ballon_dor_') ||
    bestPlayer.id.startsWith('ronaldo_chronicles_') ||
    bestPlayer.cardType === 'CLASSICS' ||
    bestPlayer.cardType === 'BALLON_DOR' ||
    bestPlayer.cardType === 'RONALDO_CHRONICLES' ||
    bestPlayer.cardType === 'VIETNAM_CHRONICLES';
  const useFutureStarsMedia = bestPlayer.cardType === 'FUTURE_STARS';
  const isLaligaBest = bestPlayer.cardType === 'LALIGA';
  const isConmebolBest = bestPlayer.cardType === 'CONMEBOL_LIBERTADORES';
  const isGingaBest = bestPlayer.cardType === 'GINGA' || bestPlayer.cardType === 'GINGA_ICON';
  const isBundesligaBest =
    bestPlayer.cardType === 'BUNDESLIGA' || isBundesligaCard(bestPlayer);
  const isJuventusBest =
    bestPlayer.cardType === 'CHAMPIONS_JUVENTUS' || isChampionsJuventusCard(bestPlayer);
  const isTotyHmBest = bestPlayer.cardType === 'TOTY26_HM';
  const isUtotyIconsBest =
    bestPlayer.cardType === 'UTOTY_ICONS' ||
    bestPlayer.cardType === 'TOTY_ICON' ||
    bestPlayer.cardType === 'UTOTY_ICON' ||
    bestPlayer.cardType === 'CLASSICS' ||
    bestPlayer.cardType === 'GINGA_ICON';
  const useFutureStarsAudio =
    useFutureStarsMedia ||
    isIconChroniclesExchangeBest ||
    isBundesligaBest ||
    isLaligaBest;

  const [showOddsModal, setShowOddsModal] = useState<boolean>(false);

  // Store packs & Spin tickets strictly NEVER grant TOTY tokens, Club tokens, or Gems (Coins + Player Cards only)
  const totalResources = skipResourceBonus
    ? { coins: 0, gems: 0, tokens: 0 }
    : drawResults.reduce(
        (acc, cur) => {
          const tier = cur.tier;
          const isTopTier =
            tier === 'A' ||
            tier === 'UTOTY' ||
            tier === 'MIXED_100_PLUS' ||
            tier === 'STARPASS_95_PLUS' ||
            tier === 'GINGA_PACK_A' ||
            tier === 'GINGA_100_OVR' ||
            tier === 'BUNDESLIGA_88_PLUS';
          const c = isTopTier ? 350000 : tier === 'B' || tier === 'STARPASS_85_94' || tier === 'GINGA_92_106' ? 120000 : 35000;
          return {
            coins: acc.coins + c,
            gems: 0,
            tokens: 0,
          };
        },
        { coins: 0, gems: 0, tokens: 0 }
      );

  // Vé quay / Ký hợp đồng bật ngay video hợp đồng (có âm thanh); Gói C từ Cửa Hàng chuyển thẳng kết quả; trao đổi thẻ nhảy thẳng video1
  const [phase, setPhase] = useState<'pack_breathing' | 'contract_video' | 'video1' | 'video2' | 'revealed'>(() =>
    autoStartWalkout
      ? 'video1'
      : isTicketSpin || isContractSigning
      ? 'contract_video'
      : packTier === 'C'
      ? 'revealed'
      : 'pack_breathing'
  );
  const [isOpeningPack, setIsOpeningPack] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isContractExiting, setIsContractExiting] = useState<boolean>(false);
  const [contractMutedFallback, setContractMutedFallback] = useState<boolean>(false);
  const openTimerRef = useRef<number | null>(null);
  const contractExitTimerRef = useRef<number | null>(null);
  const contractVideoRef = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const hasPlayedLoopAudioRef = useRef<boolean>(false);

  // Pause background music while opening player pack, resume & stop pack audio once finished
  useEffect(() => {
    soundService.pauseBgmForPack();
    return () => {
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
      }
      if (contractExitTimerRef.current) {
        window.clearTimeout(contractExitTimerRef.current);
      }
      soundService.stopAllPackAnimationAudio();
      soundService.resumeBgmAfterPack();
    };
  }, []);

  useEffect(() => {
    if (phase === 'contract_video') {
      const vid = contractVideoRef.current;
      if (vid) {
        vid.currentTime = 0;
        vid.muted = false;
        vid.volume = 1;
        vid
          .play()
          .then(() => {
            setContractMutedFallback(false);
          })
          .catch(() => {
            vid.muted = true;
            setContractMutedFallback(true);
            vid.play().catch(() => {});
          });
      }
      return () => {
        if (contractVideoRef.current) {
          contractVideoRef.current.pause();
        }
      };
    }

    if (phase === 'video1') {
      if (isJuventusBest) {
        soundService.playJuventusWalkoutIntro();
      } else if (isConmebolBest) {
        soundService.playConmebolWalkoutIntro();
      } else if (isGingaBest) {
        soundService.playGingaWalkoutIntro();
      } else if (useFutureStarsAudio) {
        soundService.playFutureStarsWalkoutIntro();
      } else {
        soundService.playPackWalkoutIntro();
      }

      const startWallMs = performance.now();
      if (video1Ref.current) {
        video1Ref.current.currentTime = 0;
        video1Ref.current.play().catch(() => {});
      }

      const trackTime = () => {
        const videoSec = video1Ref.current ? video1Ref.current.currentTime : 0;
        const wallSec = (performance.now() - startWallMs) / 1000;
        setCurrentTime(videoSec > 0.05 ? videoSec : wallSec);
        animFrameRef.current = requestAnimationFrame(trackTime);
      };
      animFrameRef.current = requestAnimationFrame(trackTime);
    }

    if (phase === 'video2') {
      if (!hasPlayedLoopAudioRef.current) {
        hasPlayedLoopAudioRef.current = true;
        if (isJuventusBest) {
          soundService.playJuventusLoopOnce();
        } else if (isConmebolBest) {
          soundService.playConmebolLoopOnce();
        } else if (isGingaBest) {
          soundService.playGingaLoopOnce();
        } else if (useFutureStarsAudio) {
          soundService.playFutureStarsLoopOnce();
        } else {
          soundService.playPackLoopOnce();
        }
      }
      if (video2Ref.current) {
        video2Ref.current.currentTime = 0;
        video2Ref.current.play().catch(() => {});
      }
    }

    if (phase === 'revealed') {
      if (!hasPlayedLoopAudioRef.current) {
        soundService.playPackOpenFanfare();
      }
      try {
        confetti({
          particleCount: currentSpinCount === 10 ? 150 : 95,
          spread: currentSpinCount === 10 ? 120 : 90,
          origin: { y: 0.55 },
          colors:
            isJuventusBest || isJuventusPack
              ? ['#ffffff', '#facc15', '#d4af37', '#18181b', '#eab308']
              : isBundesligaBest || isBundesligaPack
              ? ['#dc2626', '#ef4444', '#ffffff', '#facc15', '#991b1b']
              : isGingaBest || isGingaPack
              ? ['#22c55e', '#facc15', '#38bdf8', '#ffffff', '#10b981']
              : isConmebolBest || isConmebolPack
              ? ['#f5d97e', '#d4af37', '#b6821f', '#ffffff', '#78500d']
              : useFutureStarsMedia || isFutureStarsPack
              ? ['#38BDF8', '#E879F9', '#C084FC', '#FFFFFF', '#FDE047']
              : ['#EAB308', '#F59E0B', '#3B82F6', '#FFFFFF', '#EC4899'],
        });
      } catch {}
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    phase,
    currentSpinCount,
    useFutureStarsAudio,
    useFutureStarsMedia,
    isConmebolBest,
    isConmebolPack,
    isGingaBest,
    isGingaPack,
    isBundesligaBest,
    isBundesligaPack,
    isJuventusBest,
    isJuventusPack,
    isFutureStarsPack,
  ]);

  // Handle user tapping the breathing pack
  const handleOpenBreathingPack = () => {
    if (isFlashing || isOpeningPack) return;
    soundService.playPackOpenAnimationSfx();
    soundService.playPackTear();

    setIsOpeningPack(true);
    setIsFlashing(true);

    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
    }

    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      setIsOpeningPack(false);
      setIsFlashing(false);

      // Quy tắc: Gói C không có video walkout; Gói B và Gói A phát walkout animation
      if (packTier === 'C' || bestDraw.tier === 'C') {
        setPhase('revealed');
        return;
      }

      setCurrentTime(0);
      setPhase('video1');
    }, 1000);
  };

  const handleContractVideoComplete = () => {
    if (isContractExiting) return;
    if (contractVideoRef.current) {
      contractVideoRef.current.pause();
    }
    setIsContractExiting(true);
    if (contractExitTimerRef.current) {
      window.clearTimeout(contractExitTimerRef.current);
    }
    contractExitTimerRef.current = window.setTimeout(() => {
      contractExitTimerRef.current = null;
      setIsContractExiting(false);
      if (!fixedPlayer && (packTier === 'C' || bestDraw.tier === 'C')) {
        setPhase('revealed');
        return;
      }
      setCurrentTime(0);
      setPhase('video1');
    }, 220);
  };

  const handleVideo1Ended = () => {
    setPhase('video2');
  };

  const handleSkipVideo1 = () => {
    soundService.playClick();
    setPhase('video2');
  };

  const handleVideo2Click = () => {
    soundService.playClick();
    setPhase('revealed');
  };

  const handleCloseModal = () => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (contractExitTimerRef.current) {
      window.clearTimeout(contractExitTimerRef.current);
      contractExitTimerRef.current = null;
    }
    soundService.stopAllPackAnimationAudio();
    onClose();
  };

  const handleClaim = () => {
    // Người chơi nhận xong -> tắt ngay toàn bộ âm thanh animation loop / walkout
    soundService.stopAllPackAnimationAudio();
    soundService.playConfirmSelection();
    soundService.playCoins();
    if (drawResults.length > 1 && onMultiplePlayersClaimed) {
      onMultiplePlayersClaimed(
        drawResults.map((d) => d.player),
        totalResources
      );
    } else {
      onPlayerClaimed(bestPlayer, totalResources);
    }
    onClose();
  };

  const handleSpinAgain = (count: 1 | 10) => {
    if (onUseTicket) {
      const success = onUseTicket(count);
      if (!success) return;
    }
    soundService.stopAllPackAnimationAudio();
    hasPlayedLoopAudioRef.current = false;
    setCurrentTime(0);
    if (!isTicketSpin) {
      soundService.playPackTear();
    }

    // Claim previous batch
    if (drawResults.length > 1 && onMultiplePlayersClaimed) {
      onMultiplePlayersClaimed(
        drawResults.map((d) => d.player),
        totalResources
      );
    } else {
      onPlayerClaimed(bestPlayer, totalResources);
    }

    // Roll new batch (tracking cumulative ticket milestones 20 & 250)
    const before = cumulativeTicketsRef.current;
    cumulativeTicketsRef.current = before + count;
    const newList = buildDrawBatch(packTier, count, isTicketSpin ? before : undefined);
    setCurrentSpinCount(count);
    setDrawResults(newList);
    setPhase(isTicketSpin ? 'contract_video' : 'pack_breathing');
  };

  const getFadingStyle = (
    start: number,
    end: number,
    fadeInDuration: number = 0.45,
    fadeOutDuration: number = 0.45
  ) => {
    if (currentTime < start || currentTime > end) {
      return {
        opacity: 0,
        pointerEvents: 'none' as const,
        transform: 'scale(0.9)',
        filter: 'blur(12px)',
        display: 'none',
      };
    }
    let opacity = 1;
    let blur = 0;
    let scale = 1;
    if (currentTime < start + fadeInDuration) {
      const progress = (currentTime - start) / fadeInDuration;
      opacity = Math.max(0, Math.min(1, progress));
      blur = (1 - progress) * 12;
      scale = 1.15 - progress * 0.15;
    } else if (currentTime > end - fadeOutDuration) {
      const progress = (end - currentTime) / fadeOutDuration;
      opacity = Math.max(0, Math.min(1, progress));
      blur = (1 - progress) * 12;
      scale = 0.85 + progress * 0.15;
    }
    return {
      opacity,
      filter: `blur(${blur}px)`,
      transform: `scale(${scale})`,
      transition: 'transform 0.05s linear, opacity 0.05s linear',
      pointerEvents: 'none' as const,
    };
  };

  // Sync Nation -> Position -> Club timing cleanly:
  // - Champions: Juventus: Quốc gia 1.75s, Vị trí 3.75s, Câu lạc bộ 5.0s
  // - CONMEBOL Libertadores: Quốc gia 1.6s, Vị trí 3.2s, Câu lạc bộ 4.8s
  // - Bundesliga, Ginga 26, Future Stars & Biên Niên Sử Icons Exchange: 1.0s / 2.7s / 4.4s
  // - UTOTY: 1.5s / 3.5s / 5.0s
  const nationStyle = isJuventusBest
    ? getFadingStyle(1.75, 3.45, 0.35, 0.3)
    : isConmebolBest
    ? getFadingStyle(1.6, 3.05, 0.32, 0.28)
    : isGingaBest ||
      isBundesligaBest ||
      isLaligaBest ||
      useFutureStarsMedia ||
      isIconChroniclesExchangeBest
    ? getFadingStyle(1.0, 2.5, 0.45, 0.4)
    : getFadingStyle(1.5, 3.3, 0.6, 0.5);
  const positionStyle = isJuventusBest
    ? getFadingStyle(3.75, 4.85, 0.3, 0.25)
    : isConmebolBest
    ? getFadingStyle(3.2, 4.65, 0.32, 0.28)
    : isGingaBest ||
      isBundesligaBest ||
      isLaligaBest ||
      useFutureStarsMedia ||
      isIconChroniclesExchangeBest
    ? getFadingStyle(2.7, 4.2, 0.45, 0.4)
    : getFadingStyle(3.5, 4.8, 0.5, 0.5);
  const clubStyle = isJuventusBest
    ? getFadingStyle(5.0, 6.65, 0.35, 0.3)
    : isConmebolBest
    ? getFadingStyle(4.8, 6.4, 0.32, 0.3)
    : isGingaBest ||
      isBundesligaBest ||
      isLaligaBest ||
      useFutureStarsMedia ||
      isIconChroniclesExchangeBest
    ? getFadingStyle(4.4, 6.0, 0.45, 0.4)
    : getFadingStyle(5.0, 6.6, 0.5, 0.5);

  const displayName =
    packName ||
    (isJuventusPack
      ? currentSpinCount === 10
        ? 'MỞ 10 VÉ QUAY CHAMPIONS: JUVENTUS'
        : bestDraw.tier === 'A'
        ? 'GÓI A CHAMPIONS: JUVENTUS 102–106 OVR (1%)'
        : bestDraw.tier === 'B'
        ? 'GÓI B CHAMPIONS: JUVENTUS 92–101 OVR (25%)'
        : 'GÓI C HỖN HỢP DƯỚI 91 OVR (74% - KHÔNG ANIMATION)'
      : isBundesligaPack
      ? isBundesliga88PlusPack
        ? 'GÓI PACK 88+ CẦU THỦ BUNDESLIGA'
        : currentSpinCount === 10
        ? 'MỞ 10 VÉ QUAY BUNDESLIGA'
        : bestDraw.tier === 'A'
        ? 'GÓI A BUNDESLIGA 102–106 OVR (1%)'
        : bestDraw.tier === 'B'
        ? 'GÓI B BUNDESLIGA 92–101 OVR (25%)'
        : 'GÓI C HỖN HỢP DƯỚI 91 OVR (74% - KHÔNG ANIMATION)'
      : isGingaPack
      ? isGinga100Pack
        ? 'PACK CẦU THỦ 100+ OVR GINGA'
        : isGinga92Pack
        ? 'PACK GINGA 92–106 OVR'
        : isGingaPackA
        ? 'PACK GÓI A GINGA ICONS (102–106)'
        : currentSpinCount === 10
        ? isGingaWeek1BPack
          ? 'MỞ 10 VÉ QUAY GINGA TUẦN 1 B'
          : 'MỞ 10 VÉ QUAY GINGA TUẦN 1 A'
        : bestDraw.tier === 'A'
        ? isGingaWeek1BPack
          ? 'GÓI A GINGA TUẦN 1 B 102–106 OVR (1%)'
          : 'GÓI A GINGA TUẦN 1 A 102–106 OVR (1%)'
        : bestDraw.tier === 'B'
        ? 'GÓI B CẦU THỦ NAM MỸ GINGA 92–101 OVR (24%)'
        : 'GÓI C CẦU THỦ NAM MỸ GINGA -90 OVR (75% - KHÔNG ANIMATION)'
      : isFutureStarsPack
      ? packTier === 'FUTURE_STARS_90_95'
        ? 'GÓI TRAO ĐỔI FUTURE STARS (OVR 90-95)'
        : currentSpinCount === 10
        ? 'MỞ 10 VÉ QUAY FUTURE STARS'
        : bestDraw.tier === 'A'
        ? 'GÓI A FUTURE STARS SIÊU SAO (1%)'
        : bestDraw.tier === 'B'
        ? 'GÓI B FUTURE STARS TINH ANH (19%)'
        : 'GÓI C MÙA TOTY (80% - KHÔNG ANIMATION)'
      : currentSpinCount === 10
      ? packTheme === 'TOTY'
        ? 'MỞ 10 VÉ QUAY TOTY BÌNH THƯỜNG'
        : 'MỞ 10 VÉ QUAY TOTY 2026'
      : packTier === 'CONMEBOL_SOUTH_AMERICA_90_PLUS'
      ? 'PACK CẦU THỦ NAM MỸ 90+ · CONMEBOL LIBERTADORES'
      : packTier === 'CONMEBOL_100_103'
      ? 'PACK CONMEBOL LIBERTADORES 1 (100–103 HỖN HỢP + LIBERTADORES 102–106)'
      : packTier === 'CONMEBOL_2_102_PLUS'
      ? 'PACK CONMEBOL LIBERTADORES 2 (102+ OVR)'
      : packTier === 'STARTER_97'
      ? 'GÓI CẦU THỦ KHỞI ĐẦU 97 OVR (ČECH · FLORENZI · RIBÉRY)'
      : packTier === 'NETHERLANDS_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ HÀ LAN (OVR 90–100)'
      : packTier === 'ITALY_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ ITALY (OVR 90–100)'
      : packTier === 'SPAIN_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ TÂY BAN NHA (OVR 90–100)'
      : packTier === 'ENGLAND_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ ANH (OVR 90–100)'
      : packTier === 'BRAZIL_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ BRAZIL (OVR 90–100)'
      : packTier === 'PORTUGAL_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ BỒ ĐÀO NHA (OVR 90–100)'
      : packTier === 'FRANCE_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ PHÁP (OVR 90–100)'
      : packTier === 'ARGENTINA_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ ARGENTINA (OVR 90–100)'
      : packTier === 'PREMIER_LEAGUE_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ PREMIER LEAGUE (OVR 90–100)'
      : packTier === 'FUTURE_STARS_90_100'
      ? 'GÓI ƯU ĐÃI CẦU THỦ FUTURE STARS (OVR 90–100)'
      : packTier === 'MIXED_83_PLUS'
      ? 'GÓI CẦU THỦ HỖN HỢP 83+ OVR'
      : packTier === 'MIXED_86_PLUS'
      ? 'GÓI CẦU THỦ HỖN HỢP 86+ OVR'
      : packTier === 'MIXED_90_PLUS'
      ? 'GÓI CẦU THỦ HỖN HỢP 90+ OVR'
      : packTier === 'MIXED_94_PLUS'
      ? 'GÓI CẦU THỦ HỖN HỢP 94+ OVR'
      : packTier === 'MIXED_98_PLUS'
      ? 'GÓI CẦU THỦ HỖN HỢP 98+ OVR'
      : packTier === 'MIXED_90_99'
      ? 'GÓI CẦU THỦ HỖN HỢP 90-99'
      : packTier === 'MIXED_100_PLUS'
      ? 'GÓI PACK HỖN HỢP 100+ OVR'
      : packTier === 'TOTY_90_95'
      ? 'GÓI CHÀO MỪNG TOTY (OVR 90-95)'
      : packTier === 'TOTY_100'
      ? 'GÓI QUÀ CẦU THỦ 100 OVR'
      : packTier === 'C'
      ? 'GÓI C TIÊU CHUẨN (OVR 60-80)'
      : isTicketSpin
      ? bestDraw.tier === 'A'
        ? packTheme === 'TOTY'
          ? 'GÓI A TOTY BÌNH THƯỜNG 100-104 OVR (1% TỶ LỆ VÉ)'
          : 'GÓI A TOTY & TOTY26_HM 100-104 OVR (1% TỶ LỆ VÉ)'
        : bestDraw.tier === 'B'
        ? packTheme === 'TOTY'
          ? 'GÓI B TOTY BÌNH THƯỜNG 90-99 OVR (24% TỶ LỆ VÉ)'
          : 'GÓI B TOTY 90-99 OVR (24% TỶ LỆ VÉ)'
        : 'GÓI C DƯỚI 90 OVR (75% - KHÔNG ANIMATION)'
      : 'GÓI CẦU THỦ UTOTY & TOTY26_HM');

  const video1Src =
    isJuventusBest
      ? CHAMPIONS_JUVENTUS_ASSETS.videoWalkoutIntro
      : isConmebolBest
      ? getLibAsset('videoWalkoutIntro')
      : isGingaBest
      ? GINGA_ASSETS.videoWalkoutIntro
      : isLaligaBest
      ? '/assets/aistudio/animation_laliga_qu_c_gia__v__tr__v__c_u_l_c_b__d32f3d2f.mp4'
      : isIconChroniclesExchangeBest || isBundesligaBest
      ? '/assets/aistudio/animation_qu_c_gia__v__tr__v__c_u_l_c_b__a7214ee8.mp4'
      : useFutureStarsMedia
      ? '/assets/aistudio/animation_Future_Stars_qu_c_gia__v__tr__v__c_u_l_c_b__62c58534.mp4'
      : '/assets/aistudio/packopening_TOTY26_1_2f4b198d.mp4';

  const video2Src =
    isJuventusBest
      ? CHAMPIONS_JUVENTUS_ASSETS.videoStageLoop
      : isConmebolBest
      ? getLibAsset('videoStageLoop')
      : isGingaBest
      ? GINGA_ASSETS.videoStageLoop
      : isLaligaBest
      ? '/assets/aistudio/animtion_loop_laliga_79d83897.mp4'
      : isIconChroniclesExchangeBest || isBundesligaBest
      ? '/assets/aistudio/animation_loop_ee25c834.mp4'
      : useFutureStarsMedia
      ? '/assets/aistudio/animation_Future_Stars_loop_452bd904.mp4'
      : '/assets/aistudio/packopening_TOTY26_2_752636b2.mp4';

  // Determine first top index for 10x highlight
  const bestDrawIndex = drawResults.findIndex((item) => item.player.id === bestPlayer.id);

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center select-none overflow-hidden font-cruyff animate-fadeIn">
      {/* ----------------- FULLSCREEN WHITE FLASH OVERLAY ----------------- */}
      {isFlashing && (
        <div className="fixed inset-0 z-[75] bg-white animate-screen-flash pointer-events-none" />
      )}

      {/* ----------------- PHASE 0B: CONTRACT VIDEO (2X ENLARGED UN-CROPPED STAGE + SMOOTH FAST TRANSITION) ----------------- */}
      {phase === 'contract_video' && (
        <div className="relative w-full h-full flex items-center justify-center bg-[#030712] p-1 sm:p-3 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.16),_rgba(3,7,18,0.96)_72%)]" />

          <div
            className={`relative z-10 w-[98vw] sm:w-[95vw] max-w-[1440px] h-[88vh] sm:h-[92vh] rounded-2xl overflow-hidden bg-black border border-cyan-400/25 shadow-[0_0_65px_rgba(34,211,238,0.24)] flex items-center justify-center ${
              isContractExiting ? 'animate-contract-exit' : 'animate-contract-enter'
            }`}
          >
            <video
              ref={contractVideoRef}
              src="/assets/aistudio/animation_h_p___ng_6f208198.mp4"
              autoPlay
              playsInline
              preload="auto"
              onEnded={handleContractVideoComplete}
              onError={handleContractVideoComplete}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            {contractMutedFallback && (
              <button
                type="button"
                onClick={() => {
                  const vid = contractVideoRef.current;
                  if (vid) {
                    vid.muted = false;
                    vid.volume = 1;
                    vid.play().catch(() => {});
                  }
                  setContractMutedFallback(false);
                }}
                className="px-3.5 py-2 rounded-full bg-emerald-500 text-slate-950 font-cruyff font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Bật Âm Thanh
              </button>
            )}
            {!isContractSigning && (
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setShowOddsModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/70 hover:bg-black/90 border border-cyan-400/60 text-cyan-200 hover:text-white transition-all text-xs font-cruyff font-black uppercase tracking-wider backdrop-blur-md shadow-lg cursor-pointer"
                title="Xem bảng tỷ lệ"
              >
                <Info className="w-4 h-4 text-cyan-300" />
                <span>Tỷ Lệ</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                handleCloseModal();
              }}
              className="p-2 rounded-full bg-black/70 hover:bg-black/90 border border-white/25 text-white cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              handleContractVideoComplete();
            }}
            className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 border border-white/30 text-white font-cruyff font-bold text-xs uppercase tracking-wider backdrop-blur-md cursor-pointer transition-all"
          >
            <span>Bỏ qua</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ----------------- PHASE 0: PACK BREATHING ANIMATION ----------------- */}
      {phase === 'pack_breathing' && (
        <div
          onClick={handleOpenBreathingPack}
          className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer overflow-hidden p-4 group"
        >
          {/* Ambient Lighting Backdrop */}
          {isJuventusPack ? (
            <>
              <img
                src={CHAMPIONS_JUVENTUS_ASSETS.bg}
                alt="Champions Juventus Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/85 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-amber-400/20 rounded-full blur-[110px] pointer-events-none group-hover:bg-yellow-300/25 transition-all" />
            </>
          ) : isBundesligaPack ? (
            <>
              <img
                src={BUNDESLIGA_ASSETS.bg2}
                alt="Bundesliga Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/85 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-red-600/25 rounded-full blur-[110px] pointer-events-none group-hover:bg-red-500/30 transition-all" />
            </>
          ) : isGingaPack ? (
            <>
              <img
                src={GINGA_ASSETS.bg}
                alt="Ginga 26 Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/80 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-emerald-500/20 rounded-full blur-[110px] pointer-events-none group-hover:bg-yellow-400/25 transition-all" />
            </>
          ) : isFutureStarsPack ? (
            <>
              <img
                src="/assets/aistudio/Background_m_c_v__quay_Future_Stars_336ec779.png"
                alt="Future Stars Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-black/45 to-black/90 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-fuchsia-500/20 rounded-full blur-[110px] pointer-events-none group-hover:bg-cyan-400/25 transition-all" />
            </>
          ) : isConmebolPack ? (
            <>
              <img
                src={getLibAsset('bgRewards')}
                alt="CONMEBOL Libertadores Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/90 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-amber-500/20 rounded-full blur-[110px] pointer-events-none" />
            </>
          ) : isBallonDorStreakPack ? (
            <>
              <img
                src="/assets/aistudio/Ballon_Dor_streak_pack_fbe4e574.png"
                alt="Ballon d'Or Streak Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/90 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-amber-500/20 rounded-full blur-[110px] pointer-events-none" />
            </>
          ) : (
            <>
              <img
                src={GINGA_ASSETS.boxBg}
                alt="Ginga 26 Carnival Backdrop"
                className="absolute inset-0 w-full h-full object-cover opacity-55 animate-ginga-drift pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.28)_0%,_rgba(0,0,0,0.92)_78%)] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-400/25 transition-all" />
            </>
          )}

          {/* Top buttons: Odds Info + Close button */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundService.playClick();
                setShowOddsModal(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/70 hover:bg-black/90 border transition-all text-xs font-cruyff font-black uppercase tracking-wider backdrop-blur-md shadow-lg active:scale-95 ${
                isFutureStarsPack
                  ? 'border-cyan-400/60 text-cyan-200 hover:text-white shadow-cyan-500/15'
                  : 'border-yellow-400/60 text-yellow-300 hover:text-white shadow-yellow-500/10'
              }`}
              title="Xem bảng tỷ lệ"
            >
              <Info
                className={`w-4 h-4 ${
                  isFutureStarsPack ? 'text-cyan-300' : 'text-yellow-400'
                }`}
              />
              <span>Tỷ Lệ</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundService.playClick();
                handleCloseModal();
              }}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-gray-300 hover:text-white transition-all active:scale-95"
              title="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* THE CONTINUOUSLY BREATHING PACK (Pack info hidden during animation for suspense) */}
          <div className="relative z-20 flex items-center justify-center my-2">
            <div
              className={`relative ${
                isOpeningPack
                  ? 'animate-pack-glow-vanish'
                  : 'animate-pack-breathe group-hover:scale-105 transition-transform duration-300'
              }`}
            >
              {isJuventusPack ? (
                <div className="relative flex flex-col items-center">
                  <img
                    src="/assets/aistudio/pack_juventus_and_bundesliga_676265b6.png"
                    alt="Pack"
                    className="w-60 sm:w-76 md:w-88 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(250,204,21,0.85)] select-none pointer-events-none"
                  />
                </div>
              ) : isBundesligaPack ? (
                <div className="relative flex flex-col items-center">
                  <img
                    src="/assets/aistudio/pack_juventus_and_bundesliga_676265b6.png"
                    alt="Pack"
                    className="w-60 sm:w-76 md:w-88 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(220,38,38,0.85)] select-none pointer-events-none"
                  />
                </div>
              ) : isGingaPack ? (
                <div className="relative flex flex-col items-center">
                  <img
                    src={
                      isGingaWeek1BPack
                        ? '/assets/aistudio/pack_juventus_and_bundesliga_676265b6.png'
                        : GINGA_ASSETS.frameA
                    }
                    alt="Pack"
                    className="w-60 sm:w-76 md:w-88 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(34,197,94,0.85)] select-none pointer-events-none"
                  />
                </div>
              ) : isConmebolPack ? (
                <img
                  src={getLibAsset('storePack')}
                  alt="Pack"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain select-none pointer-events-none"
                />
              ) : isStarter97OfferPack ? (
                <div className="relative flex flex-col items-center justify-center px-6 py-5 bg-gradient-to-b from-amber-500/20 via-indigo-950/90 to-slate-950 border-2 border-amber-300/75 shadow-[0_0_55px_rgba(250,204,21,0.5)] select-none pointer-events-none">
                  <div className="flex items-end justify-center">
                    <img
                      src="/assets/aistudio/cech_97_ovr_e37ae560.png"
                      alt="Petr Čech 97"
                      className="w-32 sm:w-40 h-40 sm:h-48 object-contain -mr-8 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
                    />
                    <img
                      src="/assets/aistudio/ribery_97_ovr_1c56c6eb.png"
                      alt="Franck Ribéry 97"
                      className="w-40 sm:w-48 h-48 sm:h-56 object-contain z-10 drop-shadow-[0_12px_26px_rgba(250,204,21,0.55)]"
                    />
                    <img
                      src="/assets/aistudio/florenzi_97_ovr_e5047792.png"
                      alt="Alessandro Florenzi 97"
                      className="w-32 sm:w-40 h-40 sm:h-48 object-contain -ml-8 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
                    />
                  </div>
                </div>
              ) : isNetherlandsOfferPack ? (
                <img
                  src="/assets/aistudio/storepack_ANS26_NLD_PACK_F_33706c6f.png"
                  alt="Gói Cầu Thủ Hà Lan OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(249,115,22,0.75)] select-none pointer-events-none"
                />
              ) : isItalyOfferPack ? (
                <img
                  src="/assets/aistudio/storepack_ANS26_ITA_PACK_F_f8ed357d.png"
                  alt="Gói Cầu Thủ Italy OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(16,185,129,0.75)] select-none pointer-events-none"
                />
              ) : isSpainOfferPack ? (
                <img
                  src="/assets/aistudio/storepack_ANS26_ESP_PACK_F_ab76c063.png"
                  alt="Gói Cầu Thủ Tây Ban Nha OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(234,179,8,0.75)] select-none pointer-events-none"
                />
              ) : isEnglandOfferPack ? (
                <img
                  src="/assets/aistudio/storepack_ANS26_ENG_PACK_F_924d2e02.png"
                  alt="Gói Cầu Thủ Anh OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(244,63,94,0.75)] select-none pointer-events-none"
                />
              ) : isBrazilOfferPack ? (
                <img
                  src="/assets/aistudio/storepack_ANS26_BRA_PACK_F_4bab219d.png"
                  alt="Gói Cầu Thủ Brazil OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(250,204,21,0.75)] select-none pointer-events-none"
                />
              ) : isPortugalOfferPack ? (
                <img
                  src="/assets/aistudio/storepack_ANS26_PRT_PACK_F_4cb3ea30.png"
                  alt="Gói Cầu Thủ Bồ Đào Nha OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(220,38,38,0.75)] select-none pointer-events-none"
                />
              ) : isPremierLeagueOfferPack ? (
                <img
                  src="/assets/aistudio/g_i__u___i_c_u_th__premier_league_ovr_90-100_ac276e83.png"
                  alt="Gói Cầu Thủ Premier League OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(168,85,247,0.75)] select-none pointer-events-none"
                />
              ) : isFutureStarsOfferPack ? (
                <img
                  src="/assets/aistudio/g_i__u___i_c_u_th__Future_Stars_ovr_90-100_b8742a43.png"
                  alt="Gói Cầu Thủ Future Stars OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(56,189,248,0.75)] select-none pointer-events-none"
                />
              ) : isFranceOfferPack ? (
                <img
                  src="/assets/aistudio/g_i__u___i_c_u_th__ph_p_ovr_90-100_772347b0.png"
                  alt="Gói Cầu Thủ Pháp OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(59,130,246,0.75)] select-none pointer-events-none"
                />
              ) : isArgentinaOfferPack ? (
                <img
                  src="/assets/aistudio/g_i__u___i_c_u_th__argentina_ovr_90-100_348297dd.png"
                  alt="Gói Cầu Thủ Argentina OVR 90-100"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(56,189,248,0.75)] select-none pointer-events-none"
                />
              ) : isFutureStarsPack ? (
                <img
                  src="/assets/aistudio/storepack_S11_d9617be0.png"
                  alt="Pack Future Stars"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(34,211,238,0.65)] select-none pointer-events-none"
                />
              ) : isBallonDorStreakPack ? (
                <img
                  src="/assets/aistudio/Ballon_Dor_pack_23a61757.png"
                  alt="Ballon d'Or Mixed Pack"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_45px_rgba(234,179,8,0.72)] select-none pointer-events-none"
                />
              ) : (
                <img
                  src="/assets/aistudio/storepack_S11_F_676265b6.png"
                  alt="FC Mobile Store Pack"
                  className="w-64 sm:w-80 md:w-96 max-h-[52vh] object-contain filter drop-shadow-[0_0_40px_rgba(234,179,8,0.6)] select-none pointer-events-none"
                />
              )}

              {currentSpinCount === 10 && (
                <div
                  className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-xl text-white font-black text-base font-mono border-2 shadow-2xl ${
                    isJuventusPack
                      ? 'bg-gradient-to-r from-zinc-900 to-amber-600 border-yellow-300'
                      : isFutureStarsPack
                      ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-600 border-cyan-300'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 border-yellow-400'
                  }`}
                >
                  10 VÉ
                </div>
              )}
            </div>
          </div>

          {/* Glowing Tap to Open Call-to-Action */}
          <div className="relative z-20 flex flex-col items-center mt-6">
            {isJuventusPack ? (
              <div className="relative h-14 w-72 sm:w-84 flex items-center justify-center animate-pulse">
                <img
                  src={CHAMPIONS_JUVENTUS_ASSETS.btnBg}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_0_30px_rgba(234,179,8,0.7)]"
                />
                <div className="relative z-10 flex items-center gap-2 font-cruyff font-black text-base sm:text-xl text-slate-950 uppercase tracking-widest">
                  <Sparkles className="w-5 h-5" />
                  <span>{currentSpinCount === 10 ? 'CHẠM ĐỂ MỞ 10 VÉ' : 'CHẠM ĐỂ BÓC GÓI'}</span>
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
            ) : (
              <div
                className={`px-8 py-3.5 rounded-2xl font-cruyff font-black text-lg sm:text-xl uppercase tracking-widest flex items-center gap-3 animate-pulse ${
                  isFutureStarsPack
                    ? 'bg-gradient-to-r from-cyan-300 via-white to-pink-300 text-indigo-950 shadow-[0_0_35px_rgba(56,189,248,0.75)]'
                    : 'bg-gradient-to-r from-yellow-500/90 via-amber-400/95 to-yellow-500/90 text-black shadow-[0_0_35px_rgba(234,179,8,0.7)]'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>{currentSpinCount === 10 ? 'CHẠM ĐỂ MỞ 10 VÉ' : 'CHẠM ĐỂ BÓC GÓI'}</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </div>
            )}
            <p className="text-xs text-gray-200 font-cruyff tracking-wider uppercase mt-3 drop-shadow">
              Nhấn bất kỳ đâu để xé gói cầu thủ
            </p>
          </div>
        </div>
      )}

      {/* ----------------- PHASE 1: VIDEO 1 (WALKOUT HINTS FOR BEST PLAYER) ----------------- */}
      {phase === 'video1' && (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden animate-stage-enter">
          {(isGingaBest || isGingaPack) && (
            <>
              <img
                src={GINGA_ASSETS.bg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-55 animate-ginga-drift pointer-events-none select-none"
              />
              <div className="animate-ginga-stage-glow absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.28)_0%,_rgba(234,179,8,0.16)_38%,_rgba(0,0,0,0.85)_82%)] pointer-events-none" />
            </>
          )}
          <video
            ref={video1Ref}
            src={video1Src}
            autoPlay
            muted
            playsInline
            onEnded={handleVideo1Ended}
            className="relative z-10 w-full h-full object-contain max-w-6xl"
          />

          {/* WALKOUT OVERLAYS - STRICTLY NO FRAME, NO BORDER, NO NAME */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-15">
            {/* Nation Flag */}
            <div style={nationStyle}>
              <NationBadge nation={bestPlayer.nation} flagUrl={bestPlayer.nationFlag} />
            </div>

            {/* Position Typography */}
            <div style={positionStyle}>
              <PositionBadge position={bestPlayer.position} />
            </div>

            {/* Club Crest */}
            <div style={clubStyle}>
              <ClubBadge club={bestPlayer.club} logoUrl={bestPlayer.clubLogo} />
            </div>
          </div>

          {/* Skip Button Top Right */}
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={handleSkipVideo1}
              className={`flex items-center gap-2 px-5 py-2.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full border font-cruyff font-bold text-sm tracking-widest uppercase transition-all hover:scale-105 active:scale-95 pointer-events-auto ${
                isJuventusBest || isJuventusPack
                  ? 'border-yellow-300/80 text-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                  : isGingaBest || isGingaPack
                  ? 'border-emerald-400/80 text-yellow-300 shadow-[0_0_20px_rgba(34,197,94,0.45)]'
                  : useFutureStarsMedia
                  ? 'border-cyan-400/60 text-cyan-200 shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                  : 'border-yellow-400/50 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
              }`}
            >
              <span>Bỏ qua</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Bottom Live Hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/70 border border-white/10 backdrop-blur-md text-xs font-cruyff tracking-widest text-white/80 uppercase tabular-nums">
            <span>{displayName} · {currentTime.toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* ----------------- PHASE 2: VIDEO 2 (STAGE LOOP & TAP TO REVEAL) ----------------- */}
      {phase === 'video2' && (
        <div
          onClick={handleVideo2Click}
          className="relative w-full h-full flex items-center justify-center cursor-pointer group overflow-hidden"
        >
          {(isGingaBest || isGingaPack) && (
            <>
              <img
                src={GINGA_ASSETS.boxBg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-45 animate-ginga-drift pointer-events-none select-none"
              />
              <div className="animate-ginga-stage-glow absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.28)_0%,_rgba(250,204,21,0.18)_42%,_rgba(0,0,0,0.85)_84%)] pointer-events-none" />
            </>
          )}
          <video
            ref={video2Ref}
            src={video2Src}
            autoPlay
            muted
            loop
            playsInline
            className="relative z-10 w-full h-full object-contain max-w-6xl"
          />

          {/* Stage-wide glow & fade flash right at the start of the loop */}
          {(isIconChroniclesExchangeBest ||
            isBundesligaBest ||
            isJuventusBest ||
            isGingaBest ||
            isConmebolBest ||
            isLaligaBest ||
            isTotyHmBest ||
            isUtotyIconsBest) && (
            <div
              className="animate-loop-entry-flash absolute inset-0 pointer-events-none z-10 mix-blend-screen"
              style={{
                background:
                  isIconChroniclesExchangeBest || isBundesligaBest
                    ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(45,212,191,0.58) 32%, rgba(250,204,21,0.28) 60%, transparent 82%)'
                    : isJuventusBest
                    ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.95) 0%, rgba(250,204,21,0.62) 32%, rgba(212,175,55,0.28) 60%, transparent 82%)'
                    : isGingaBest
                    ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(34,197,94,0.62) 34%, rgba(250,204,21,0.34) 62%, transparent 82%)'
                    : isConmebolBest
                    ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(212,175,55,0.68) 32%, rgba(182,130,31,0.34) 60%, transparent 82%)'
                    : isLaligaBest
                    ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(244,63,94,0.62) 34%, rgba(250,204,21,0.28) 62%, transparent 82%)'
                    : isUtotyIconsBest
                    ? 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(250,204,21,0.58) 34%, rgba(59,130,246,0.28) 62%, transparent 82%)'
                    : 'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(192,132,252,0.62) 32%, rgba(250,204,21,0.3) 60%, transparent 82%)',
              }}
            />
          )}

          {/* After Nation, Position & Club: Player card reveal */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-15">
            <div className="relative flex flex-col items-center">
              {/* Luminous burst aura that brightens at start of loop and fades smoothly */}
              <div
                className="animate-walkout-flare-overlay absolute -inset-10 rounded-full pointer-events-none z-0"
                style={{
                  background: isJuventusBest
                    ? 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(250,204,21,0.78) 36%, rgba(212,175,55,0.38) 66%, transparent 84%)'
                    : isGingaBest
                    ? 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(34,197,94,0.82) 36%, rgba(250,204,21,0.45) 66%, transparent 84%)'
                    : isTotyHmBest
                    ? 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(192,132,252,0.84) 36%, rgba(250,204,21,0.46) 66%, transparent 84%)'
                    : useFutureStarsMedia
                    ? 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.7) 38%, rgba(232,121,249,0.35) 68%, transparent 82%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.68) 38%, rgba(59,130,246,0.25) 68%, transparent 80%)',
                  filter: 'blur(18px)',
                }}
              />

              {/* Player Card: brightens up at start of loop and fades smoothly back to normal */}
              <div
                className={`relative z-10 flex flex-col items-center ${
                  isTotyHmBest ? 'animate-walkout-glow-fade-totyhm' : 'animate-walkout-glow-fade'
                }`}
              >
                <FCCard player={bestPlayer} size="hero" showStats={true} />
                <div
                  className="animate-walkout-flare-overlay absolute inset-6 rounded-3xl pointer-events-none mix-blend-screen"
                  style={{
                    background: isTotyHmBest
                      ? 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.95) 0%, rgba(216,180,254,0.65) 45%, transparent 76%)'
                      : useFutureStarsMedia
                      ? 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.9) 0%, rgba(165,243,252,0.5) 45%, transparent 75%)'
                      : 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.88) 0%, rgba(254,240,138,0.5) 45%, transparent 75%)',
                  }}
                />
              </div>

              {!bestPlayer.frameIsComplete && (
                <div
                  className={`relative z-10 mt-3 px-6 py-2 rounded-xl bg-black/85 border backdrop-blur-md ${
                    isTotyHmBest
                      ? 'border-purple-400/80 shadow-[0_0_28px_rgba(168,85,247,0.55)]'
                      : useFutureStarsMedia
                      ? 'border-cyan-400/75 shadow-[0_0_28px_rgba(56,189,248,0.55)]'
                      : 'border-yellow-400/70 shadow-[0_0_28px_rgba(234,179,8,0.5)]'
                  }`}
                >
                  <span
                    className={`font-cruyff font-black text-xl uppercase tracking-widest italic ${
                      useFutureStarsMedia ? 'text-cyan-200' : 'text-yellow-300'
                    }`}
                  >
                    {bestPlayer.name} · {bestPlayer.position} {bestPlayer.ovr}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Tap Prompt */}
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-end pb-12 z-20 pointer-events-none">
            <div
              className={`px-8 py-4 rounded-2xl bg-black/80 backdrop-blur-md border animate-pulse flex items-center gap-3 ${
                useFutureStarsMedia
                  ? 'border-cyan-400/70 shadow-[0_0_40px_rgba(56,189,248,0.6)]'
                  : 'border-yellow-400/60 shadow-[0_0_40px_rgba(234,179,8,0.6)]'
              }`}
            >
              <Sparkles
                className={`w-6 h-6 ${
                  useFutureStarsMedia ? 'text-cyan-300' : 'text-yellow-400'
                }`}
              />
              <span
                className={`font-cruyff font-black text-xl sm:text-2xl uppercase tracking-widest ${
                  useFutureStarsMedia ? 'text-cyan-200' : 'text-yellow-300'
                }`}
              >
                {currentSpinCount === 10 ? 'CHẠM ĐỂ XEM ĐỦ 10 CẦU THỦ' : 'CHẠM ĐỂ XEM PHẦN THƯỞNG'}
              </span>
              <Sparkles
                className={`w-6 h-6 ${
                  useFutureStarsMedia ? 'text-cyan-300' : 'text-yellow-400'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PHASE 3: REVEAL ALL ACQUIRED CARDS & RESOURCES ----------------- */}
      {phase === 'revealed' && (
        <>
          {(isJuventusPack || (bestDraw.tier !== 'C' && isJuventusBest)) && (
            <>
              <img
                src={CHAMPIONS_JUVENTUS_ASSETS.bg}
                alt="Champions Juventus Stadium"
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/90 pointer-events-none" />
            </>
          )}
          {(isBundesligaPack || (bestDraw.tier !== 'C' && isBundesligaBest)) && (
            <>
              <img
                src={BUNDESLIGA_ASSETS.bg2}
                alt="Bundesliga Stadium"
                className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/90 pointer-events-none" />
            </>
          )}
          {(isGingaPack || (bestDraw.tier !== 'C' && isGingaBest)) && (
            <>
              <img
                src={GINGA_ASSETS.bg}
                alt="Ginga 26 Stadium"
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/85 pointer-events-none" />
            </>
          )}
          {(isFutureStarsPack || (bestDraw.tier !== 'C' && useFutureStarsMedia)) && (
            <>
              <img
                src="/assets/aistudio/Background_m_c_v__quay_Future_Stars_336ec779.png"
                alt="Future Stars Stadium"
                className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/70 via-black/65 to-black/90 pointer-events-none" />
            </>
          )}
          <div className="relative z-10 max-w-5xl w-full p-4 sm:p-6 flex flex-col items-center font-cruyff overflow-y-auto max-h-[95vh]">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all z-30"
            >
              <X className="w-6 h-6" />
            </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Trophy
              className={`w-6 h-6 ${
                isFutureStarsPack ? 'text-cyan-300' : 'text-yellow-400'
              }`}
            />
            <h2 className="font-cruyff font-black text-2xl sm:text-3xl tracking-widest text-white uppercase italic drop-shadow-md text-center">
              {!isTicketSpin
                ? displayName
                : isJuventusPack
                ? currentSpinCount === 10
                  ? 'KẾT QUẢ MỞ 10 VÉ QUAY CHAMPIONS: JUVENTUS'
                  : 'PHẦN THƯỞNG VÉ QUAY CHAMPIONS: JUVENTUS'
                : isBundesligaPack
                ? currentSpinCount === 10
                  ? 'KẾT QUẢ MỞ 10 VÉ QUAY BUNDESLIGA'
                  : 'PHẦN THƯỞNG VÉ QUAY BUNDESLIGA'
                : isGingaPack
                ? currentSpinCount === 10
                  ? 'KẾT QUẢ MỞ 10 VÉ QUAY GINGA 26'
                  : 'PHẦN THƯỞNG VÉ QUAY GINGA 26'
                : isFutureStarsPack
                ? currentSpinCount === 10
                  ? 'KẾT QUẢ MỞ 10 VÉ FUTURE STARS'
                  : 'PHẦN THƯỞNG VÉ QUAY FUTURE STARS'
                : currentSpinCount === 10
                ? 'KẾT QUẢ MỞ 10 VÉ QUAY TOTY'
                : 'PHẦN THƯỞNG MỞ VÉ TOTY 2026'}
            </h2>
            <Sparkles
              className={`w-6 h-6 ${
                isFutureStarsPack ? 'text-fuchsia-300' : 'text-yellow-400'
              }`}
            />
          </div>

          <p
            className={`font-cruyff font-bold tracking-wider text-xs sm:text-sm mb-4 uppercase text-center ${
              isFutureStarsPack ? 'text-cyan-200' : 'text-yellow-300'
            }`}
          >
            {isTicketSpin && drawResults.some((d) => Boolean(d.player.pityMilestone))
              ? `Chúc mừng bạn nhận ${drawResults.length} cầu thủ (Bao gồm Quà Mốc Bảo Hiểm ${drawResults
                  .filter((d) => Boolean(d.player.pityMilestone))
                  .map((d) => (d.player.pityMilestone === 'POOL_A_250' ? '250 Vé Pool A' : '20 Vé Pool B'))
                  .join(' + ')}) & ${totalResources.coins.toLocaleString('vi-VN')} Xu!`
              : isTicketSpin && drawResults.length > 1
              ? `Chúc mừng bạn đã nhận ${drawResults.length} cầu thủ và ${totalResources.coins.toLocaleString('vi-VN')} Xu!`
              : !isTicketSpin && drawResults.length === 2
              ? `Chúc mừng bạn đã nhận 2 cầu thủ: ${drawResults.map((d) => `${d.player.name} (${d.player.ovr})`).join(' & ')}!`
              : `Chúc mừng bạn đã nhận ${bestPlayer.name} (OVR ${bestPlayer.ovr}) · ${
                  bestPlayer.isTradeable ? 'GIAO DỊCH ĐƯỢC' : 'KHÔNG GIAO DỊCH'
                }!`}
          </p>

          {/* ================= MULTI TICKET SPIN (10x OR 1x WITH PITY BONUS) REVEAL DISPLAY ================= */}
          {isTicketSpin && (currentSpinCount === 10 || drawResults.length > 1) ? (
            <div className="w-full flex flex-col items-center gap-4">
              {/* Cards Grid */}
              <div
                className={`grid gap-3 w-full justify-items-center ${
                  drawResults.length <= 3
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-3xl'
                    : 'grid-cols-2 sm:grid-cols-5'
                }`}
              >
                {drawResults.map((item, idx) => {
                  const isTop = idx === bestDrawIndex;
                  const pity = item.player.pityMilestone;
                  const itemIsFs = item.player.cardType === 'FUTURE_STARS';
                  const itemIsJuventus = item.player.cardType === 'CHAMPIONS_JUVENTUS';
                  return (
                    <div
                      key={`${item.player.id}_${idx}`}
                      className={`relative p-1.5 rounded-2xl flex flex-col items-center transition-all hover:scale-105 ${
                        pity === 'POOL_A_250'
                          ? 'bg-gradient-to-b from-amber-300/35 to-yellow-600/20 border-2 border-yellow-300 shadow-[0_0_28px_rgba(250,204,21,0.65)] scale-105'
                          : pity === 'POOL_B_20'
                          ? 'bg-gradient-to-b from-cyan-400/30 to-emerald-500/15 border-2 border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.5)] scale-105'
                          : isTop
                          ? itemIsJuventus
                            ? 'bg-gradient-to-b from-amber-300/30 to-zinc-800/40 border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.5)] scale-105'
                            : itemIsFs
                            ? 'bg-gradient-to-b from-cyan-400/30 to-fuchsia-500/15 border-2 border-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.5)] scale-105'
                            : 'bg-gradient-to-b from-yellow-400/30 to-amber-500/10 border-2 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.5)] scale-105'
                          : 'bg-zinc-900/70 border border-white/10'
                      }`}
                    >
                      {pity ? (
                        <div
                          className={`absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase z-20 shadow-md whitespace-nowrap ${
                            pity === 'POOL_A_250'
                              ? 'bg-yellow-300 text-black'
                              : 'bg-cyan-300 text-slate-950'
                          }`}
                        >
                          {pity === 'POOL_A_250' ? 'MỐC 250 VÉ · POOL A' : 'MỐC 20 VÉ · POOL B'}
                        </div>
                      ) : (
                        isTop && (
                          <div
                            className={`absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase z-20 shadow-md ${
                              itemIsJuventus
                                ? 'bg-amber-300 text-slate-950'
                                : itemIsFs
                                ? 'bg-cyan-300 text-indigo-950'
                                : 'bg-yellow-400 text-black'
                            }`}
                          >
                            BEST OVR
                          </div>
                        )
                      )}
                      <FCCard player={item.player} size="sm" showStats={false} />
                      {item.player.frameIsComplete ? (
                        <div className="text-center mt-1 w-full px-1">
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-cruyff font-black uppercase tracking-wider border ${
                              item.player.isTradeable
                                ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
                                : 'bg-rose-950/75 border-rose-500/50 text-rose-300'
                            }`}
                          >
                            {item.player.isTradeable ? 'GIAO DỊCH ĐƯỢC' : 'KHÔNG GIAO DỊCH'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center mt-1 w-full px-1 space-y-0.5">
                          <span className="font-cruyff font-black text-xs text-white truncate block">
                            {item.player.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold block tabular-nums ${
                              itemIsJuventus
                                ? 'text-amber-300'
                                : itemIsFs
                                ? 'text-cyan-300'
                                : 'text-yellow-400'
                            }`}
                          >
                            {item.player.position} · OVR {item.player.ovr}
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-cruyff font-black uppercase tracking-wider border ${
                              item.player.isTradeable
                                ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
                                : 'bg-rose-950/75 border-rose-500/50 text-rose-300'
                            }`}
                          >
                            {item.player.isTradeable ? 'GIAO DỊCH ĐƯỢC' : 'KHÔNG GIAO DỊCH'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Resources Ribbon */}
              <div
                className={`w-full p-3 rounded-2xl bg-zinc-900/90 border flex flex-wrap items-center justify-around gap-3 shadow-lg tabular-nums ${
                  isFutureStarsPack ? 'border-cyan-400/35' : 'border-yellow-400/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                    alt="Coins"
                    className="w-6 h-6 object-contain"
                  />
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Tổng Xu Thưởng Kèm</span>
                    <span className="font-mono font-bold text-sm text-yellow-400">
                      +{totalResources.coins.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-cruyff font-bold text-emerald-300 uppercase">
                  Giao dịch được: {drawResults.filter((d) => d.player.isTradeable).length}/{drawResults.length} thẻ (Tỷ lệ 10%)
                </div>
              </div>

              {/* Actions Footer */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 mt-1">
                {ticketsRemaining >= 1 && (
                  <button
                    onClick={() => handleSpinAgain(1)}
                    className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2"
                  >
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="Ticket"
                      className="w-5 h-5 object-contain"
                    />
                    <span>MỞ TIẾP 1 VÉ</span>
                  </button>
                )}

                {ticketsRemaining >= 10 && (
                  <button
                    onClick={() => handleSpinAgain(10)}
                    className={`flex-1 max-w-sm py-3 px-4 rounded-xl font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 ${
                      isGingaPack
                        ? 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.45)]'
                        : isFutureStarsPack
                        ? 'bg-gradient-to-r from-cyan-300 via-white to-pink-300 text-indigo-950 shadow-[0_0_20px_rgba(56,189,248,0.45)]'
                        : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                    }`}
                  >
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="Ticket"
                      className="w-5 h-5 object-contain"
                    />
                    <span>MỞ TIẾP 10 VÉ (CÒN {ticketsRemaining})</span>
                  </button>
                )}

                <button
                  onClick={handleClaim}
                  className="flex-1 max-w-sm py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>NHẬN TẤT CẢ {drawResults.length} CẦU THỦ</span>
                </button>
              </div>
            </div>
          ) : !isTicketSpin && drawResults.length === 2 ? (
            /* ================= DUAL 2-CARD CONMEBOL LIBERTADORES 1 REVEAL DISPLAY ================= */
            <div className="w-full max-w-4xl flex flex-col items-center gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                {drawResults.map((item, idx) => {
                  const isLibCard = item.player.cardType === 'CONMEBOL_LIBERTADORES';
                  return (
                    <div
                      key={`${item.player.id}_dual_${idx}`}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2.5 ${
                        isLibCard
                          ? 'bg-gradient-to-b from-[#291d09]/95 via-[#130d05]/95 to-black border-[#e6c35c] shadow-[0_0_32px_rgba(230,195,92,0.4)]'
                          : 'bg-zinc-900/90 border-cyan-400/55 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
                      }`}
                    >
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-cruyff font-black uppercase tracking-wider border ${
                          isLibCard
                            ? 'bg-[#e6c35c] text-[#120c04] border-[#fff3bd]'
                            : 'bg-cyan-400/20 text-cyan-200 border-cyan-400/60'
                        }`}
                      >
                        {isLibCard
                          ? 'CẦU THỦ CONMEBOL LIBERTADORES (102–106)'
                          : 'CẦU THỦ HỖN HỢP ĐA MÙA (100–103)'}
                      </span>

                      <FCCard player={item.player} size="md" showStats={true} />

                      <div className="text-center space-y-1">
                        <div className="font-cruyff font-black text-lg text-white uppercase tracking-wide">
                          {item.player.name}
                        </div>
                        <div className="text-xs font-mono font-bold text-[#fbe59b]">
                          {item.player.position} · OVR {item.player.ovr} · {item.player.club}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 font-cruyff font-black text-[10px] uppercase tracking-wider">
                          KHÔNG GIAO DỊCH
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full p-3.5 rounded-2xl bg-zinc-900/90 border border-[#d4af37]/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                    alt="Coins"
                    className="w-6 h-6 object-contain"
                  />
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">
                      Tổng Xu Thưởng Kèm (x2 Thẻ)
                    </span>
                    <span className="font-mono font-bold text-sm text-yellow-400">
                      +{totalResources.coins.toLocaleString('vi-VN')} Xu
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  className="py-3 px-8 rounded-xl bg-gradient-to-r from-[#b8841e] via-[#e6c35c] to-[#b8841e] hover:brightness-110 border border-[#fff3bd] text-[#120c04] font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 shadow-[0_0_25px_rgba(230,195,92,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>NHẬN CẢ 2 CẦU THỦ</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= SINGLE 1-PACK REVEAL DISPLAY ================= */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full max-w-3xl">
              {/* Left: Card Display */}
              <div className="md:col-span-6 flex justify-center">
                <FCCard player={bestPlayer} size="hero" showStats={true} />
              </div>

              {/* Right: Breakdown */}
              <div className="md:col-span-6 flex flex-col gap-3">
                <div
                  className={`p-4 rounded-2xl bg-zinc-900/90 border shadow-xl space-y-3 tabular-nums ${
                    isFutureStarsPack ? 'border-cyan-400/45' : 'border-yellow-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <span className="font-cruyff font-bold text-xs uppercase text-gray-300">
                      TÀI NGUYÊN THU NHẬN
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-cruyff font-black uppercase tracking-wider ${
                        bestPlayer.isTradeable
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                      }`}
                    >
                      {bestPlayer.isTradeable ? 'GIAO DỊCH ĐƯỢC' : 'KHÔNG GIAO DỊCH'}
                    </span>
                  </div>

                  {/* 1. Player Card */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-black text-xs ${
                          bestPlayer.cardType === 'FUTURE_STARS'
                            ? 'bg-cyan-400/20 border-cyan-300 text-cyan-200'
                            : 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                        }`}
                      >
                        {bestPlayer.ovr}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{bestPlayer.name}</div>
                        <div className="text-[11px] text-gray-400">
                          {bestPlayer.position} · {bestPlayer.club}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase ${
                        bestPlayer.cardType === 'EURO_2024'
                          ? 'text-emerald-300'
                          : bestPlayer.cardType === 'LALIGA'
                          ? 'text-rose-300'
                          : bestPlayer.cardType === 'FUTURE_STARS'
                          ? 'text-cyan-300'
                          : bestPlayer.cardType === 'TOTY26_HM'
                          ? 'text-purple-300'
                          : 'text-yellow-400'
                      }`}
                    >
                      {bestPlayer.cardType === 'VIETNAM_CHRONICLES'
                        ? 'Mùa Biên Niên Sử Việt Nam'
                        : bestPlayer.cardType === 'RONALDO_CHRONICLES'
                        ? 'Mùa Biên Niên Sử Ronaldo'
                        : bestPlayer.cardType === 'BALLON_DOR'
                        ? "Mùa Ballon d'Or"
                        : bestPlayer.cardType === 'CHAMPIONS_JUVENTUS'
                        ? 'Mùa Champions: Juventus'
                        : bestPlayer.cardType === 'BUNDESLIGA'
                        ? 'Mùa Bundesliga'
                        : bestPlayer.cardType === 'GINGA_ICON'
                        ? 'Mùa Ginga Icons (2026)'
                        : bestPlayer.cardType === 'GINGA'
                        ? 'Mùa Ginga 26'
                        : bestPlayer.cardType === 'CONMEBOL_LIBERTADORES'
                        ? 'Mùa CONMEBOL Libertadores'
                        : bestPlayer.cardType === 'EURO_2024'
                        ? bestPlayer.ovr >= 100
                          ? 'Mùa EURO 2024 (Gói A)'
                          : 'Mùa EURO 2024 (Gói B)'
                        : bestPlayer.cardType === 'LALIGA'
                        ? 'Mùa LALIGA EA SPORTS'
                        : bestPlayer.cardType === 'FUTURE_STARS'
                        ? bestPlayer.ovr >= 100
                          ? 'Mùa Future Stars (Gói A)'
                          : 'Mùa Future Stars (Gói B)'
                        : bestPlayer.cardType === 'TOTY26_HM'
                        ? 'Mùa TOTY26_HM (100+ OVR)'
                        : bestPlayer.cardType === 'UTOTY_ICONS'
                        ? 'Mùa UTOTY Icons'
                        : bestPlayer.cardType === 'TOTY_ICON' || bestPlayer.cardType === 'UTOTY_ICON'
                        ? 'Mùa TOTY Icons'
                        : bestPlayer.cardType === 'CLASSICS'
                        ? 'Mùa Classics Icons'
                        : bestPlayer.cardType === 'UTOTY' || bestPlayer.isUtotyUpgraded
                        ? 'Mùa UTOTY'
                        : bestPlayer.ovr >= 90
                        ? 'Mùa TOTY'
                        : 'Dưới 90 OVR (Gói C)'}
                    </span>
                  </div>

                  {/* 2. Coins */}
                  {!skipResourceBonus && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/assets/aistudio/currencysmall_COIN_ec777114.png"
                          alt="Coin"
                          className="w-7 h-7 object-contain"
                        />
                        <div>
                          <div className="font-bold text-sm text-yellow-300">Tiền Vàng (Coins)</div>
                          <div className="text-[10px] text-gray-400">Dùng nâng cấp & mua sắm</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-yellow-400 text-sm">
                        +{totalResources.coins.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {isTicketSpin && ticketsRemaining >= 1 && (
                    <button
                      onClick={() => handleSpinAgain(1)}
                      className={`flex-1 py-3.5 px-4 rounded-xl font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 ${
                        isGingaPack
                          ? 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.45)]'
                          : isFutureStarsPack
                          ? 'bg-gradient-to-r from-cyan-300 via-white to-pink-300 text-indigo-950 shadow-[0_0_20px_rgba(56,189,248,0.45)]'
                          : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                      }`}
                    >
                      <img
                        src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                        alt="Ticket"
                        className="w-5 h-5 object-contain"
                      />
                      <span>MỞ TIẾP 1 VÉ (CÒN {ticketsRemaining})</span>
                    </button>
                  )}

                  {isTicketSpin && ticketsRemaining >= 10 && (
                    <button
                      onClick={() => handleSpinAgain(10)}
                      className={`flex-1 py-3.5 px-4 rounded-xl font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 shadow-md flex items-center justify-center gap-2 ${
                        isGingaPack
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 text-slate-950'
                          : isFutureStarsPack
                          ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-white'
                          : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black'
                      }`}
                    >
                      <img
                        src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                        alt="Ticket"
                        className="w-5 h-5 object-contain"
                      />
                      <span>MỞ 10 VÉ</span>
                    </button>
                  )}

                  <button
                    onClick={handleClaim}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>LĨNH & NHẬN</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      )}

      {/* PACK ODDS MODAL */}
      {showOddsModal && (
        <PackOddsModal
          packTier={
            !isTicketSpin
              ? packTier
              : bestDraw.tier === 'B' || bestDraw.tier === 'C'
              ? bestDraw.tier
              : 'A'
          }
          packTheme={effectiveTheme}
          onClose={() => setShowOddsModal(false)}
        />
      )}
    </div>
  );
};
