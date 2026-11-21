import React, { useState, useMemo } from 'react';
import { X, Sparkles, Info, Search } from 'lucide-react';
import { PackTier } from './PackOpeningModal';
import { TicketSpinTheme } from '../types/game';
import {
  totyFeaturedPlayers,
  utotyIconsPlayers,
  futureStarsPlayers,
  laligaPlayers,
  euro2024Players,
} from '../data/mockData';
import { gingaAllPlayers, gingaWeek1BAllPlayers } from '../data/gingaData';
import { bundesligaAllPlayers } from '../data/bundesligaData';
import { championsJuventusAllPlayers } from '../data/championsJuventusData';
import {
  calculatePackOdds,
  filterNationalOfferPool,
  filterStarter97OfferPool,
  filterPremierLeagueOfferPool,
  filterFutureStarsOfferPool,
  filterNormalTotyPool,
  filterTotyBasePool,
  filterConmebolLibertadoresSeasonPool,
  filterConmebol100To103Pool,
  filterSouthAmerica90PlusPool,
  filterBundesliga88PlusPool,
  filterBundesligaMixedUnder91Pool,
} from '../utils/packOdds';
import { useEuro2024Assets } from '../data/euro2024Assets';
import { useLibertadoresAssets } from '../data/libertadoresAssets';
import { soundService } from '../services/sound';
import { resolveClubCrestUrls } from '../utils/clubCrests';

interface PackOddsModalProps {
  packTier?: PackTier;
  packTheme?: TicketSpinTheme;
  onClose: () => void;
}

export const PackOddsModal: React.FC<PackOddsModalProps> = ({
  packTier = 'A',
  packTheme = 'CONMEBOL_LIBERTADORES',
  onClose,
}) => {
  const { getAsset: getEuroAsset } = useEuro2024Assets();
  const { getAsset: getLibAsset } = useLibertadoresAssets();
  const normalizedInitialTheme: TicketSpinTheme =
    packTheme === 'UTOTY' || packTheme === 'TOTY' || packTheme === 'FUTURE_STARS'
      ? 'GINGA'
      : packTheme;
  const [activeTheme, setActiveTheme] = useState<TicketSpinTheme>(normalizedInitialTheme);
  const [selectedTier, setSelectedTier] = useState<PackTier | 'ALL'>(packTier);
  const [searchQuery, setSearchQuery] = useState('');

  const isJuventus = activeTheme === 'CHAMPIONS_JUVENTUS';
  const isBundesliga = activeTheme === 'BUNDESLIGA';
  const isGingaW1B = activeTheme === 'GINGA_W1B';
  const isGinga = activeTheme === 'GINGA' || isGingaW1B;
  const isFutureStars = activeTheme === 'FUTURE_STARS';
  const isNormalToty = activeTheme === 'TOTY';

  // Pool for this pack & theme
  const pool = useMemo(() => {
    const totyOnly = filterTotyBasePool(totyFeaturedPlayers);

    if (selectedTier === 'BUNDESLIGA_88_PLUS') {
      return filterBundesliga88PlusPool([
        ...bundesligaAllPlayers,
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ]);
    }

    if (selectedTier === 'GINGA_100_OVR') {
      return gingaAllPlayers.filter((p) => p.ovr >= 100);
    }

    if (selectedTier === 'GINGA_92_106') {
      return gingaAllPlayers.filter((p) => p.ovr >= 92);
    }

    if (selectedTier === 'GINGA_PACK_A') {
      return gingaAllPlayers.filter((p) => p.ovr >= 102);
    }

    if (selectedTier === 'CONMEBOL_2_102_PLUS') {
      return filterConmebolLibertadoresSeasonPool(totyFeaturedPlayers);
    }

    if (selectedTier === 'CONMEBOL_100_103') {
      return filterConmebol100To103Pool([
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ]);
    }

    if (selectedTier === 'CONMEBOL_SOUTH_AMERICA_90_PLUS') {
      return filterSouthAmerica90PlusPool([
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...laligaPlayers,
      ]);
    }

    if (selectedTier === 'STARTER_97') {
      return filterStarter97OfferPool(totyFeaturedPlayers);
    }

    if (selectedTier === 'FRANCE_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'FRANCE');
    }

    if (selectedTier === 'ARGENTINA_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'ARGENTINA');
    }

    if (selectedTier === 'NETHERLANDS_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'NETHERLANDS');
    }

    if (selectedTier === 'ITALY_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'ITALY');
    }

    if (selectedTier === 'SPAIN_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'SPAIN');
    }

    if (selectedTier === 'ENGLAND_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'ENGLAND');
    }

    if (selectedTier === 'BRAZIL_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'BRAZIL');
    }

    if (selectedTier === 'PORTUGAL_90_100') {
      return filterNationalOfferPool(totyFeaturedPlayers, 'PORTUGAL');
    }

    if (selectedTier === 'PREMIER_LEAGUE_90_100') {
      return filterPremierLeagueOfferPool(totyFeaturedPlayers);
    }

    if (selectedTier === 'FUTURE_STARS_90_100') {
      return filterFutureStarsOfferPool(futureStarsPlayers);
    }

    if (selectedTier === 'STARPASS_85_94') {
      const seen = new Set<string>();
      return [
        ...totyFeaturedPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.isExchangeExclusive || p.ovr < 85 || p.ovr > 94 || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }

    if (selectedTier === 'STARPASS_95_PLUS') {
      const seen = new Set<string>();
      return [
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.isExchangeExclusive || p.ovr < 95 || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }

    if (selectedTier === 'MIXED_90_99') {
      const seen = new Set<string>();
      return [
        ...totyFeaturedPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.isExchangeExclusive || p.ovr < 90 || p.ovr > 99 || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }

    if (
      selectedTier === 'MIXED_83_PLUS' ||
      selectedTier === 'MIXED_86_PLUS' ||
      selectedTier === 'MIXED_90_PLUS' ||
      selectedTier === 'MIXED_94_PLUS' ||
      selectedTier === 'MIXED_98_PLUS'
    ) {
      const minOvr =
        selectedTier === 'MIXED_83_PLUS'
          ? 83
          : selectedTier === 'MIXED_86_PLUS'
          ? 86
          : selectedTier === 'MIXED_90_PLUS'
          ? 90
          : selectedTier === 'MIXED_94_PLUS'
          ? 94
          : 98;
      const seen = new Set<string>();
      return [
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
    }

    if (selectedTier === 'MIXED_100_PLUS') {
      const seen = new Set<string>();
      return [
        ...totyFeaturedPlayers,
        ...utotyIconsPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
      ].filter((p) => {
        if (p.isExchangeExclusive || p.ovr < 100 || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }

    if (isNormalToty) {
      const normalPool = filterNormalTotyPool(totyFeaturedPlayers);
      if (selectedTier === 'C') {
        return totyOnly.filter((p) => p.ovr < 90);
      } else if (selectedTier === 'B') {
        return normalPool.filter((p) => p.ovr >= 90 && p.ovr <= 99);
      } else if (selectedTier === 'A') {
        return normalPool.filter((p) => p.ovr >= 100 && p.ovr <= 104);
      }
      return [...normalPool, ...totyOnly.filter((p) => p.ovr < 90)];
    }

    if (isFutureStars) {
      if (selectedTier === 'C') {
        return totyOnly.filter((p) => p.ovr <= 80);
      } else if (selectedTier === 'B') {
        return futureStarsPlayers.filter((p) => p.ovr >= 90 && p.ovr <= 95);
      } else if (selectedTier === 'A') {
        return futureStarsPlayers.filter((p) => p.ovr >= 96);
      }
      return [...futureStarsPlayers, ...totyOnly.filter((p) => p.ovr <= 80)];
    }

    if (isJuventus) {
      const mixedUnder91 = filterBundesligaMixedUnder91Pool([
        ...totyFeaturedPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
        ...gingaAllPlayers,
        ...bundesligaAllPlayers,
      ]);
      if (selectedTier === 'C') {
        return mixedUnder91;
      } else if (selectedTier === 'B') {
        return championsJuventusAllPlayers.filter((p) => p.ovr >= 92 && p.ovr <= 101);
      } else if (selectedTier === 'A') {
        return championsJuventusAllPlayers.filter((p) => p.ovr >= 102 && p.ovr <= 106);
      }
      return [...championsJuventusAllPlayers, ...mixedUnder91];
    }

    if (isBundesliga) {
      const mixedUnder91 = filterBundesligaMixedUnder91Pool([
        ...totyFeaturedPlayers,
        ...futureStarsPlayers,
        ...euro2024Players,
        ...laligaPlayers,
        ...gingaAllPlayers,
      ]);
      if (selectedTier === 'C') {
        return mixedUnder91;
      } else if (selectedTier === 'B') {
        return bundesligaAllPlayers.filter((p) => p.ovr >= 92 && p.ovr <= 101);
      } else if (selectedTier === 'A') {
        return bundesligaAllPlayers.filter((p) => p.ovr >= 102 && p.ovr <= 106);
      }
      return [...bundesligaAllPlayers, ...mixedUnder91];
    }

    if (isGinga) {
      const gingaSource = isGingaW1B ? gingaWeek1BAllPlayers : gingaAllPlayers;
      const gingaPackCPool = gingaSource.filter((p) => p.ovr < 90);
      if (selectedTier === 'C') {
        return gingaPackCPool;
      } else if (selectedTier === 'B') {
        return gingaSource.filter((p) => p.ovr >= 92 && p.ovr <= 101);
      } else if (selectedTier === 'A') {
        return gingaSource.filter((p) => p.ovr >= 102 && p.ovr <= 106);
      }
      return gingaSource;
    }

    // UTOTY / TOTY26_HM: 75% C (< 90) · 24% B (90-99) · 1% A (100-104)
    if (selectedTier === 'C') {
      return totyOnly.filter((p) => p.ovr < 90);
    } else if (selectedTier === 'B') {
      return totyOnly.filter((p) => p.ovr >= 90 && p.ovr <= 99);
    } else if (selectedTier === 'A' || selectedTier === 'UTOTY') {
      return totyOnly.filter((p) => p.ovr >= 100 && p.ovr <= 104);
    }
    return totyOnly;
  }, [
    selectedTier,
    isJuventus,
    isBundesliga,
    isGinga,
    isGingaW1B,
    isFutureStars,
    isNormalToty,
  ]);

  const { items, brackets } = useMemo(() => {
    const tierToCalc: PackTier = selectedTier === 'ALL' ? 'A' : selectedTier;
    return calculatePackOdds(pool, tierToCalc, activeTheme);
  }, [pool, selectedTier, activeTheme]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.player.name.toLowerCase().includes(q) ||
        (item.player.fullName && item.player.fullName.toLowerCase().includes(q)) ||
        item.player.club.toLowerCase().includes(q) ||
        item.player.nation.toLowerCase().includes(q) ||
        item.player.position.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-cruyff select-none animate-fadeIn">
      <div
        className={`relative w-full max-w-3xl bg-zinc-950 border rounded-2xl flex flex-col max-h-[92vh] overflow-hidden ${
          isJuventus
            ? 'border-amber-300/65 shadow-[0_0_50px_rgba(251,191,36,0.28)]'
            : isFutureStars
            ? 'border-cyan-400/60 shadow-[0_0_50px_rgba(56,189,248,0.28)]'
            : 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.25)]'
        }`}
      >
        {/* Header HUD */}
        <header className="px-5 py-4 bg-zinc-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                isJuventus
                  ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-zinc-800 shadow-amber-400/30'
                  : isBundesliga
                  ? 'bg-gradient-to-br from-red-500 via-rose-600 to-red-800 shadow-red-500/30'
                  : isGinga
                  ? 'bg-gradient-to-br from-emerald-400 via-yellow-400 to-green-600 shadow-emerald-500/25'
                  : isFutureStars
                  ? 'bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-purple-600 shadow-cyan-500/25'
                  : 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-yellow-500/20'
              }`}
            >
              <img
                src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                alt="Voucher"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h3 className="font-cruyff font-black text-lg text-white uppercase italic tracking-wide flex items-center gap-2">
                <span>
                  {selectedTier === 'GINGA_100_OVR'
                    ? 'TỶ LỆ PACK CẦU THỦ 100+ OVR GINGA'
                    : selectedTier === 'GINGA_92_106'
                    ? 'TỶ LỆ PACK GINGA 92–106 OVR'
                    : selectedTier === 'GINGA_PACK_A'
                    ? 'TỶ LỆ PACK GÓI A GINGA ICONS (102–106)'
                    : selectedTier === 'CONMEBOL_2_102_PLUS'
                    ? 'TỶ LỆ GÓI CONMEBOL LIBERTADORES 2 (102+ · MÙA LIBERTADORES)'
                    : selectedTier === 'CONMEBOL_100_103'
                    ? 'TỶ LỆ GÓI CONMEBOL LIBERTADORES 1 (1 HỖN HỢP 100–103 + 1 LIBERTADORES 102–106)'
                    : selectedTier === 'CONMEBOL_SOUTH_AMERICA_90_PLUS'
                    ? 'TỶ LỆ GÓI CẦU THỦ NAM MỸ 90+ (CONMEBOL LIBERTADORES)'
                    : selectedTier === 'STARTER_97'
                    ? 'TỶ LỆ GÓI CẦU THỦ KHỞI ĐẦU 97 OVR (ČECH · FLORENZI · RIBÉRY)'
                    : selectedTier === 'NETHERLANDS_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ HÀ LAN (OVR 90–100)'
                    : selectedTier === 'ITALY_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ ITALY (OVR 90–100)'
                    : selectedTier === 'SPAIN_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ TÂY BAN NHA (OVR 90–100)'
                    : selectedTier === 'ENGLAND_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ ANH (OVR 90–100)'
                    : selectedTier === 'BRAZIL_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ BRAZIL (OVR 90–100)'
                    : selectedTier === 'PORTUGAL_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ BỒ ĐÀO NHA (OVR 90–100)'
                    : selectedTier === 'FRANCE_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ PHÁP (OVR 90–100)'
                    : selectedTier === 'ARGENTINA_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ ARGENTINA (OVR 90–100)'
                    : selectedTier === 'PREMIER_LEAGUE_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ PREMIER LEAGUE (OVR 90–100)'
                    : selectedTier === 'MIXED_83_PLUS'
                    ? "TỶ LỆ GÓI CẦU THỦ HỖN HỢP 83+ OVR (CHUỖI BALLON D'OR)"
                    : selectedTier === 'MIXED_86_PLUS'
                    ? "TỶ LỆ GÓI CẦU THỦ HỖN HỢP 86+ OVR (CHUỖI BALLON D'OR)"
                    : selectedTier === 'MIXED_90_PLUS'
                    ? "TỶ LỆ GÓI CẦU THỦ HỖN HỢP 90+ OVR (CHUỖI BALLON D'OR)"
                    : selectedTier === 'MIXED_94_PLUS'
                    ? "TỶ LỆ GÓI CẦU THỦ HỖN HỢP 94+ OVR (CHUỖI BALLON D'OR)"
                    : selectedTier === 'MIXED_98_PLUS'
                    ? "TỶ LỆ GÓI CẦU THỦ HỖN HỢP 98+ OVR (CHUỖI BALLON D'OR)"
                    : selectedTier === 'FUTURE_STARS_90_100'
                    ? 'TỶ LỆ GÓI CẦU THỦ FUTURE STARS (OVR 90–100)'
                    : selectedTier === 'BUNDESLIGA_88_PLUS'
                    ? 'TỶ LỆ GÓI PACK 88+ CẦU THỦ BUNDESLIGA'
                    : isJuventus
                    ? 'TỶ LỆ VÉ QUAY CHAMPIONS: JUVENTUS'
                    : isBundesliga
                    ? 'TỶ LỆ VÉ QUAY BUNDESLIGA'
                    : isGingaW1B
                    ? 'TỶ LỆ VÉ QUAY GINGA TUẦN 1 B'
                    : isGinga
                    ? 'TỶ LỆ VÉ QUAY GINGA TUẦN 1 A'
                    : isNormalToty
                    ? 'TỶ LỆ VÉ QUAY TOTY BÌNH THƯỜNG (≤104 OVR)'
                    : isFutureStars
                    ? 'TỶ LỆ VÉ QUAY FUTURE STARS'
                    : 'TỶ LỆ VÉ QUAY UTOTY 2026'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                    isJuventus
                      ? 'bg-amber-300/20 text-amber-200 border-amber-300/60'
                      : isBundesliga
                      ? 'bg-red-500/25 text-red-200 border-red-400/60'
                      : isGinga
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
                      : isFutureStars
                      ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40'
                      : 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
                  }`}
                >
                  CHÍNH THỨC
                </span>
              </h3>
              <p
                className={`text-xs font-bold ${
                  isJuventus
                    ? 'text-amber-200'
                    : isBundesliga
                    ? 'text-red-300'
                    : isGinga
                    ? 'text-emerald-300'
                    : isFutureStars
                    ? 'text-cyan-300'
                    : 'text-yellow-400'
                }`}
              >
                {isJuventus
                  ? 'Gói C (Hỗn hợp <91 OVR): 74% · Gói B (Juventus 92-101): 25% · Gói A (Juventus 102-106): 1%'
                  : isBundesliga
                  ? 'Gói C (Hỗn hợp <91 OVR): 74% · Gói B (Bundesliga 92-101): 25% · Gói A (Bundesliga 102-106): 1%'
                  : isGinga
                  ? 'Gói C (Hỗn hợp -91 OVR): 75% · Gói B (Nam Mỹ Ginga 92-101): 24% · Gói A (Ginga 102-106): 1%'
                  : isNormalToty
                  ? 'Gói C (<90 OVR): 75% · Gói B (TOTY 90-99): 24% · Gói A (TOTY 100-104): 1%'
                  : isFutureStars
                  ? 'Gói C: 80% (Mùa TOTY) · Gói B: 19% (FS 90-95) · Gói A: 1% (FS 96-104)'
                  : 'Gói C (<90 OVR): 75% · Gói B (90-99 OVR): 24% · Gói A (100-104 OVR): 1%'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch between Champions: Juventus, Bundesliga, Ginga & CONMEBOL Odds */}
            <div className="flex flex-wrap items-center p-1 rounded-xl bg-black/60 border border-white/10 gap-0.5">
              <button
                onClick={() => {
                  soundService.playTabSwitch();
                  setActiveTheme('CHAMPIONS_JUVENTUS');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                  isJuventus
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                JUVENTUS
              </button>
              <button
                onClick={() => {
                  soundService.playTabSwitch();
                  setActiveTheme('BUNDESLIGA');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                  isBundesliga
                    ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                BUNDESLIGA
              </button>
              <button
                onClick={() => {
                  soundService.playTabSwitch();
                  setActiveTheme('GINGA');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                  activeTheme === 'GINGA'
                    ? 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-green-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                GINGA 1 A
              </button>
              <button
                onClick={() => {
                  soundService.playTabSwitch();
                  setActiveTheme('GINGA_W1B');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                  isGingaW1B
                    ? 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-green-500 text-slate-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                GINGA 1 B
              </button>
              <button
                onClick={() => {
                  soundService.playTabSwitch();
                  setActiveTheme('CONMEBOL_LIBERTADORES');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                  activeTheme === 'CONMEBOL_LIBERTADORES'
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                CONMEBOL LIB.
              </button>
            </div>

            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Global Ticket Odds Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-white/10">
          {isJuventus ? (
            <div className="grid grid-cols-3 gap-2 tabular-nums">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-center">
                <span className="text-[10px] font-black text-amber-400 block uppercase">
                  Gói C (Hỗn Hợp &lt;91 OVR)
                </span>
                <span className="text-lg font-mono font-black text-amber-300">74.00%</span>
                <span className="text-[9px] text-gray-300 block">
                  Cầu thủ hỗn hợp dưới 91 OVR · Không Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-amber-300/45 text-center">
                <span className="text-[10px] font-black text-amber-200 block uppercase">
                  Gói B (Juventus 92-101)
                </span>
                <span className="text-lg font-mono font-black text-white">25.00%</span>
                <span className="text-[9px] text-amber-100 block font-bold">
                  10 Thẻ Champions: Juventus 92-101 OVR
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-300/75 shadow-[0_0_15px_rgba(251,191,36,0.3)] text-center">
                <span className="text-[10px] font-black text-yellow-300 block uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gói A (Juventus 102-106)
                </span>
                <span className="text-lg font-mono font-black text-yellow-300">1.00%</span>
                <span className="text-[9px] text-amber-100 block font-bold">
                  Chiellini · Buffon · Del Piero · Pirlo · Nedvěd
                </span>
              </div>
            </div>
          ) : isBundesliga ? (
            <div className="grid grid-cols-3 gap-2 tabular-nums">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-center">
                <span className="text-[10px] font-black text-amber-400 block uppercase">
                  Gói C (Hỗn Hợp &lt;91 OVR)
                </span>
                <span className="text-lg font-mono font-black text-amber-300">74.00%</span>
                <span className="text-[9px] text-gray-300 block">
                  Cầu thủ hỗn hợp dưới 91 OVR · Không Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-400/55 text-center">
                <span className="text-[10px] font-black text-red-300 block uppercase">
                  Gói B (Bundesliga 92-101)
                </span>
                <span className="text-lg font-mono font-black text-white">25.00%</span>
                <span className="text-[9px] text-red-200 block font-bold">
                  10 Thẻ Bundesliga 92-101 OVR
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-600/20 border border-yellow-400/65 shadow-[0_0_15px_rgba(220,38,38,0.3)] text-center">
                <span className="text-[10px] font-black text-yellow-300 block uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gói A (Bundesliga 102-106)
                </span>
                <span className="text-lg font-mono font-black text-yellow-300">1.00%</span>
                <span className="text-[9px] text-red-100 block font-bold">
                  Kimmich · Olise · Mittelstädt · Kane · Nusa
                </span>
              </div>
            </div>
          ) : isGinga ? (
            <div className="grid grid-cols-3 gap-2 tabular-nums">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-center">
                <span className="text-[10px] font-black text-amber-400 block uppercase">
                  Gói C (Hỗn Hợp -91 OVR)
                </span>
                <span className="text-lg font-mono font-black text-amber-300">75.00%</span>
                <span className="text-[9px] text-gray-300 block">
                  Cầu thủ hỗn hợp OVR ≤ 91 · Không Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-400/55 text-center">
                <span className="text-[10px] font-black text-emerald-300 block uppercase">
                  Gói B (Nam Mỹ 92-101)
                </span>
                <span className="text-lg font-mono font-black text-white">24.00%</span>
                <span className="text-[9px] text-emerald-200 block font-bold">
                  Cầu thủ Nam Mỹ Ginga 92-101 OVR
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/65 shadow-[0_0_15px_rgba(234,179,8,0.25)] text-center">
                <span className="text-[10px] font-black text-yellow-300 block uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gói A (Ginga 102-106)
                </span>
                <span className="text-lg font-mono font-black text-yellow-300">1.00%</span>
                <span className="text-[9px] text-emerald-100 block font-bold">
                  {isGingaW1B
                    ? 'Pizarro · Marcelo · Batistuta · Muñoz · Lucas Paquetá'
                    : 'Kaká · Mascherano · Valverde · Caicedo · Martinelli'}
                </span>
              </div>
            </div>
          ) : isFutureStars ? (
            <div className="grid grid-cols-3 gap-2 tabular-nums">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-center">
                <span className="text-[10px] font-black text-amber-400 block uppercase">
                  Gói C (60-80)
                </span>
                <span className="text-lg font-mono font-black text-amber-300">80.00%</span>
                <span className="text-[9px] text-gray-400 block">
                  Cầu thủ mùa TOTY · Không Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-950/45 border border-cyan-400/50 text-center">
                <span className="text-[10px] font-black text-cyan-300 block uppercase">
                  Gói B (FS 90-95)
                </span>
                <span className="text-lg font-mono font-black text-white">19.00%</span>
                <span className="text-[9px] text-cyan-200/80 block font-bold">
                  Future Stars · Có Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/60 shadow-[0_0_15px_rgba(217,70,239,0.25)] text-center">
                <span className="text-[10px] font-black text-fuchsia-300 block uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gói A (FS 96-104)
                </span>
                <span className="text-lg font-mono font-black text-fuchsia-200">1.00%</span>
                <span className="text-[9px] text-fuchsia-200/90 block font-bold">
                  Siêu Sao FS · Có Animation
                </span>
              </div>
            </div>
          ) : (
            /* TOTY / UTOTY: 75% C (<90) · 24% B (90-99) · 1% A (100-104) */
            <div className="grid grid-cols-3 gap-2 tabular-nums">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-center">
                <span className="text-[10px] font-black text-amber-400 block uppercase">
                  Gói C (Dưới 90 OVR)
                </span>
                <span className="text-lg font-mono font-black text-amber-300">75.00%</span>
                <span className="text-[9px] text-gray-400 block">
                  Cầu thủ OVR &lt; 90 · Không Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-400/40 text-center">
                <span className="text-[10px] font-black text-slate-200 block uppercase">
                  Gói B (90-99 OVR)
                </span>
                <span className="text-lg font-mono font-black text-white">24.00%</span>
                <span className="text-[9px] text-cyan-200/80 block font-bold">
                  TOTY Tinh Anh · Có Animation
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-400/60 shadow-[0_0_15px_rgba(234,179,8,0.2)] text-center">
                <span className="text-[10px] font-black text-yellow-400 block uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gói A (100-104 OVR)
                </span>
                <span className="text-lg font-mono font-black text-yellow-300">1.00%</span>
                <span className="text-[9px] text-yellow-200/80 block font-bold">
                  UTOTY · Icon · TOTY26_HM
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 flex flex-wrap items-center gap-2 border-b border-white/5 bg-zinc-950">
          <button
            onClick={() => {
              soundService.playTabSwitch();
              setSelectedTier('A');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              selectedTier === 'A'
                ? isFutureStars
                  ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-slate-950 shadow-md'
                  : 'bg-yellow-400 text-black shadow-md shadow-yellow-500/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            Chi tiết Gói A (1%)
          </button>
          <button
            onClick={() => {
              soundService.playTabSwitch();
              setSelectedTier('B');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              selectedTier === 'B'
                ? isFutureStars
                  ? 'bg-cyan-400 text-slate-950 shadow-md'
                  : 'bg-slate-300 text-black shadow-md shadow-slate-400/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {isJuventus
              ? 'Chi tiết Gói B · Juventus (25%)'
              : isBundesliga
              ? 'Chi tiết Gói B · Bundesliga (25%)'
              : isGinga
              ? 'Chi tiết Gói B · Ginga (24%)'
              : isFutureStars
              ? 'Chi tiết Gói B (19%)'
              : 'Chi tiết Gói B · 90-99 (24%)'}
          </button>
          <button
            onClick={() => {
              soundService.playTabSwitch();
              setSelectedTier('C');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              selectedTier === 'C'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {isJuventus || isBundesliga
              ? 'Chi tiết Gói C · <91 OVR (74%)'
              : isGinga
              ? 'Chi tiết Gói C · -91 OVR (75%)'
              : isFutureStars
              ? 'Chi tiết Gói C · TOTY (80%)'
              : 'Chi tiết Gói C · <90 OVR (75%)'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isFutureStars
                ? 'bg-cyan-500/10 border-cyan-400/35'
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}
          >
            <Info
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isFutureStars ? 'text-cyan-300' : 'text-yellow-400'
              }`}
            />
            <div className="text-xs text-gray-300 leading-relaxed">
              <span
                className={`font-bold uppercase block mb-0.5 ${
                  isFutureStars ? 'text-cyan-300' : 'text-yellow-300'
                }`}
              >
                {isJuventus
                  ? 'QUY TẮC VÉ QUAY CHAMPIONS: JUVENTUS:'
                  : isBundesliga
                  ? 'QUY TẮC VÉ QUAY BUNDESLIGA:'
                  : isGingaW1B
                  ? 'QUY TẮC VÉ QUAY GINGA TUẦN 1 B:'
                  : isGinga
                  ? 'QUY TẮC VÉ QUAY GINGA TUẦN 1 A:'
                  : isFutureStars
                  ? 'QUY TẮC VÉ QUAY FUTURE STARS:'
                  : 'QUY TẮC VÉ QUAY TOTY 2026:'}
              </span>
              {isJuventus
                ? 'Vé Quay Champions: Juventus áp dụng tỷ lệ: Gói A (1%) gồm Chiellini 106, Buffon 105, Del Piero 104, Pirlo 103, Nedvěd 102. Gói B (25%) gồm các cầu thủ Champions: Juventus 92–101 OVR. Gói C (74%) gồm các cầu thủ hỗn hợp dưới 91 OVR (không animation). Walkout riêng hiển thị Quốc gia 1.75s · Vị trí 3.75s · Câu lạc bộ 5.0s.'
                : isBundesliga
                ? 'Vé Quay Bundesliga áp dụng tỷ lệ: Gói A (1%) gồm các cầu thủ Bundesliga 102–106 OVR (Kimmich, Olise, Mittelstädt, Kane, Nusa). Gói B (25%) gồm các cầu thủ Bundesliga 92–101 OVR. Gói C (74%) gồm các cầu thủ hỗn hợp dưới 91 OVR (không animation).'
                : isGingaW1B
                ? 'Vé Quay Ginga Tuần 1 B sử dụng Vé Quay bình thường: Gói A (1%) gồm 106 Pizarro, 105 Marcelo, 104 Batistuta, 103 Muñoz, 102 Lucas Paquetá. Gói B (24%) gồm các cầu thủ Nam Mỹ Ginga 92–101 OVR. Cả Gói A & Gói B đều phát Animation & Âm thanh Walkout Ginga độc quyền! Gói C (75%) gồm các cầu thủ hỗn hợp ≤ 91 OVR (không animation).'
                : isGinga
                ? 'Vé Quay Ginga Tuần 1 A sử dụng Vé Quay bình thường: Gói A (1%) gồm 106 Kaká, 105 Mascherano, 104 Valverde, 103 Caicedo, 102 Gabriel Martinelli. Gói B (24%) gồm các cầu thủ Nam Mỹ Ginga 92–101 OVR. Cả Gói A & Gói B đều phát Animation & Âm thanh Walkout Ginga độc quyền! Gói C (75%) gồm các cầu thủ hỗn hợp ≤ 91 OVR (không animation).'
                : isFutureStars
                ? 'Ở Vé Quay Future Stars, Gói C (80%) mở ra các cầu thủ mùa TOTY (OVR 60–80, không có animation). Gói B (19%, OVR 90–95) và Gói A (1%, OVR 96–104) đều xuất hiện Animation & Âm thanh Future Stars độc quyền!'
                : 'Vé quay TOTY & UTOTY áp dụng tỷ lệ chuẩn: Gói C (dưới 90 OVR) 75% không animation, Gói B (90–99 OVR) 24% có animation, và Gói A (100–104 OVR) 1% bao gồm UTOTY, Icon và mùa thẻ mới TOTY26_HM với animation Walkout!'}
            </div>
          </div>

          {/* OVR Tier Brackets Summary */}
          <div>
            <h4 className="font-cruyff font-bold text-xs uppercase text-gray-400 tracking-wider mb-2.5">
              TỶ LỆ THEO NHÓM CHỈ SỐ (OVR BRACKETS)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {brackets.map((b, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${b.color}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-xs uppercase tracking-wide">{b.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold">
                      {b.badge}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xs font-mono font-bold opacity-80">{b.ovrRange}</span>
                    <span className="text-xl font-black font-mono">{b.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-current rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, b.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar for Individual Players */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-cruyff font-bold text-xs uppercase text-gray-400 tracking-wider">
                CHI TIẾT TỶ LỆ TỪNG CẦU THỦ ({filteredItems.length} THẺ)
              </h4>
              <span className="text-[10px] text-gray-500">Sắp xếp: OVR cao ➔ thấp</span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên cầu thủ, vị trí, câu lạc bộ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/60"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredItems.map((item, idx) => (
                <div
                  key={`${item.player.id}_odds_${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        item.player.ovr >= 100
                          ? 'bg-amber-500/25 border border-amber-400 text-amber-300'
                          : item.player.ovr >= 90
                          ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-300'
                          : item.player.ovr >= 81
                          ? 'bg-slate-400/20 border border-slate-300 text-slate-200'
                          : 'bg-amber-700/20 border border-amber-600 text-amber-400'
                      }`}
                    >
                      {item.player.ovr}
                    </div>

                    <img
                      src={
                        (item.player.cardType === 'CONMEBOL_LIBERTADORES'
                          ? getLibAsset(item.player.id, item.player.avatarUrl)
                          : item.player.cardType === 'EURO_2024'
                          ? getEuroAsset(item.player.id, item.player.avatarUrl)
                          : item.player.avatarUrl) ||
                        item.player.customFrameUrl ||
                        '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                      }
                      alt={item.player.name}
                      className="w-6 h-6 object-contain shrink-0"
                      onError={(e) => {
                        const fallback =
                          '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
                        if (
                          !e.currentTarget.src.endsWith(
                            '_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                          )
                        ) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />

                    {item.player.nationFlag && (
                      <img
                        src={item.player.nationFlag}
                        alt={item.player.nation}
                        className="w-4 h-3 object-cover rounded-xs shrink-0"
                      />
                    )}

                    {(() => {
                      const crestUrls = resolveClubCrestUrls(
                        item.player.club,
                        item.player.clubLogo,
                        item.player.club === 'Icons' ||
                          item.player.cardType === 'TOTY_ICON' ||
                          item.player.cardType === 'UTOTY_ICON' ||
                          item.player.cardType === 'UTOTY_ICONS' ||
                          item.player.cardType === 'CLASSICS' ||
                          item.player.cardType === 'GINGA_ICON'
                      );
                      return crestUrls.length > 0 ? (
                        <img
                          src={crestUrls[0]}
                          alt={item.player.club}
                          className="w-3.5 h-3.5 object-contain shrink-0"
                          onError={(e) => {
                            const nextIdx = Number(e.currentTarget.dataset.fallbackIdx || '0') + 1;
                            if (nextIdx < crestUrls.length) {
                              e.currentTarget.dataset.fallbackIdx = String(nextIdx);
                              e.currentTarget.src = crestUrls[nextIdx];
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      ) : null;
                    })()}

                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">
                          {item.player.name}
                        </span>
                        {item.player.cardType === 'CHAMPIONS_JUVENTUS' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-300/70 text-[9px] font-black text-amber-200 uppercase shrink-0">
                            CHAMPIONS: JUVENTUS
                          </span>
                        )}
                        {item.player.cardType === 'BUNDESLIGA' && (
                          <span className="px-1.5 py-0.5 rounded bg-red-600/25 border border-red-400/70 text-[9px] font-black text-red-200 uppercase shrink-0">
                            BUNDESLIGA
                          </span>
                        )}
                        {item.player.cardType === 'GINGA_ICON' && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-yellow-300/70 text-[9px] font-black text-yellow-200 uppercase shrink-0">
                            GINGA ICON
                          </span>
                        )}
                        {item.player.cardType === 'GINGA' && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-[9px] font-black text-emerald-200 uppercase shrink-0">
                            GINGA 26
                          </span>
                        )}
                        {item.player.cardType === 'CONMEBOL_LIBERTADORES' && (
                          <span className="px-1.5 py-0.5 rounded bg-[#2a1d08] border border-[#d4af37]/70 text-[9px] font-black text-[#fce8a6] uppercase shrink-0">
                            CONMEBOL LIBERTADORES
                          </span>
                        )}
                        {item.player.cardType === 'UTOTY_ICONS' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-300/25 border border-amber-200/60 text-[9px] font-black text-amber-100 uppercase shrink-0">
                            UTOTY ICONS
                          </span>
                        )}
                        {item.player.cardType === 'TOTY26_HM' && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/25 border border-purple-400/50 text-[9px] font-black text-purple-200 uppercase shrink-0">
                            TOTY26_HM
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {item.player.position} · {item.player.club}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`font-mono font-black text-xs ${
                        item.player.ovr >= 100
                          ? 'text-amber-400'
                          : item.player.ovr >= 95
                          ? 'text-yellow-300'
                          : 'text-gray-300'
                      }`}
                    >
                      {item.percent}%
                    </span>
                    <span className="block text-[9px] text-gray-500 uppercase">
                      {item.player.ovr >= 102 ? 'Cực hiếm' : item.player.ovr >= 98 ? 'Hiếm' : 'Tiêu chuẩn'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-4 bg-zinc-900/90 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Tổng cộng: <strong className="text-white">{items.length}</strong> cầu thủ trong gói này
          </span>
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-cruyff font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-yellow-500/20 cursor-pointer"
          >
            ĐÃ HIỂU
          </button>
        </footer>
      </div>
    </div>
  );
};
