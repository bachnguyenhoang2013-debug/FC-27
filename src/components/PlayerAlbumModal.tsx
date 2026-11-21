import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Trophy, 
  Sparkles, 
  Filter, 
  ChevronRight, 
  Star, 
  Compass, 
  Shield, 
  Zap, 
  Flame, 
  DollarSign,
  Maximize2
} from 'lucide-react';
import { PlayerCard } from '../types/game';
import { totyFeaturedPlayers } from '../data/mockData';
import { FCCard } from './FCCard';
import { PixelPlayerCardPanel } from './PixelPlayerCardPanel';
import { soundService } from '../services/sound';
import { resolvePlayerWithUtotyUpgrade } from '../utils/utotyUpgrade';
import {
  useLibertadoresAssets,
  LIBERTADORES_TOKEN_SMALL_FALLBACK,
} from '../data/libertadoresAssets';
import { resolveClubCrestUrls } from '../utils/clubCrests';
import { BUNDESLIGA_ASSETS } from '../data/bundesligaData';
import { CHAMPIONS_JUVENTUS_ASSETS } from '../data/championsJuventusData';

interface PlayerAlbumModalProps {
  utotyUpgradedIds?: string[];
  onClose: () => void;
  onOpenIconsModal?: () => void;
  onOpenUltimateIconsExchange?: () => void;
  onOpenConmebolShopPacks?: () => void;
  onOpenGingaSpin?: () => void;
  onOpenGingaW1BSpin?: () => void;
  onOpenBundesligaSpin?: () => void;
  onOpenJuventusSpin?: () => void;
  onOpenRonaldoChronicles?: () => void;
  onOpenVietnamChronicles?: () => void;
}

export const PlayerAlbumModal: React.FC<PlayerAlbumModalProps> = ({
  utotyUpgradedIds,
  onClose,
  onOpenIconsModal,
  onOpenUltimateIconsExchange,
  onOpenConmebolShopPacks,
  onOpenGingaSpin,
  onOpenGingaW1BSpin,
  onOpenBundesligaSpin,
  onOpenJuventusSpin,
  onOpenRonaldoChronicles,
  onOpenVietnamChronicles,
}) => {
  const { getAsset: getLibAsset } = useLibertadoresAssets();
  const catalogPlayers = useMemo(() => {
    const upgradedSet = new Set(utotyUpgradedIds ?? []);
    return totyFeaturedPlayers
      .filter((p) => p.cardType !== 'WELCOME' || p.id === 'welcome_st_ishowspeed_80')
      .map((p) => resolvePlayerWithUtotyUpgrade(p, upgradedSet));
  }, [utotyUpgradedIds]);

  const [selectedTier, setSelectedTier] = useState<
    | 'all'
    | 'CHAMPIONS_JUVENTUS'
    | 'BUNDESLIGA'
    | 'GINGA'
    | 'CONMEBOL_LIBERTADORES'
    | 'BALLON_DOR'
    | 'RONALDO_CHRONICLES'
    | 'VIETNAM_CHRONICLES'
    | 'CLASSICS'
    | 'TOTY26_HM'
    | 'FUTURE_STARS'
    | 'A'
    | 'B'
    | 'C'
  >('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingPlayerId, setInspectingPlayerId] = useState<string>(
    totyFeaturedPlayers[0]?.id ?? ''
  );

  const inspectingPlayer = useMemo(
    () => catalogPlayers.find((p) => p.id === inspectingPlayerId) || catalogPlayers[0] || null,
    [catalogPlayers, inspectingPlayerId]
  );

  // Filter players based on tier, position, and search query
  const filteredPlayers = useMemo(() => {
    return catalogPlayers.filter((p) => {
      // Tier filter
      if (selectedTier === 'CHAMPIONS_JUVENTUS' && p.cardType !== 'CHAMPIONS_JUVENTUS')
        return false;
      if (selectedTier === 'BUNDESLIGA' && p.cardType !== 'BUNDESLIGA') return false;
      if (selectedTier === 'GINGA' && p.cardType !== 'GINGA' && p.cardType !== 'GINGA_ICON')
        return false;
      if (selectedTier === 'CONMEBOL_LIBERTADORES' && p.cardType !== 'CONMEBOL_LIBERTADORES')
        return false;
      if (selectedTier === 'BALLON_DOR' && p.cardType !== 'BALLON_DOR') return false;
      if (selectedTier === 'RONALDO_CHRONICLES' && p.cardType !== 'RONALDO_CHRONICLES')
        return false;
      if (selectedTier === 'VIETNAM_CHRONICLES' && p.cardType !== 'VIETNAM_CHRONICLES')
        return false;
      if (selectedTier === 'CLASSICS' && p.cardType !== 'CLASSICS') return false;
      if (selectedTier === 'TOTY26_HM' && p.cardType !== 'TOTY26_HM') return false;
      if (selectedTier === 'FUTURE_STARS' && p.cardType !== 'FUTURE_STARS') return false;
      if (selectedTier === 'A' && p.ovr < 100) return false;
      if (selectedTier === 'B' && (p.ovr < 90 || p.ovr > 99)) return false;
      if (selectedTier === 'C' && p.ovr >= 90) return false;

      // Position filter
      if (selectedPosition !== 'all') {
        if (selectedPosition === 'FWD' && !['ST', 'RW', 'LW', 'CF'].includes(p.position)) return false;
        if (selectedPosition === 'MID' && !['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p.position)) return false;
        if (selectedPosition === 'DEF' && !['CB', 'LB', 'RB'].includes(p.position)) return false;
        if (selectedPosition === 'GK' && p.position !== 'GK') return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchFullName = p.fullName?.toLowerCase().includes(query) || false;
        const matchClub = p.club.toLowerCase().includes(query);
        const matchNation = p.nation.toLowerCase().includes(query);
        const matchLeague = p.league?.toLowerCase().includes(query) || false;
        if (!matchName && !matchFullName && !matchClub && !matchNation && !matchLeague) return false;
      }

      return true;
    });
  }, [catalogPlayers, selectedTier, selectedPosition, searchQuery]);

  const juventusCount = catalogPlayers.filter(
    (p) => p.cardType === 'CHAMPIONS_JUVENTUS'
  ).length;
  const bundesligaCount = catalogPlayers.filter((p) => p.cardType === 'BUNDESLIGA').length;
  const gingaCount = catalogPlayers.filter(
    (p) => p.cardType === 'GINGA' || p.cardType === 'GINGA_ICON'
  ).length;
  const conmebolCount = catalogPlayers.filter(
    (p) => p.cardType === 'CONMEBOL_LIBERTADORES'
  ).length;
  const ballonDorCount = catalogPlayers.filter((p) => p.cardType === 'BALLON_DOR').length;
  const ronaldoChroniclesCount = catalogPlayers.filter(
    (p) => p.cardType === 'RONALDO_CHRONICLES'
  ).length;
  const vietnamChroniclesCount = catalogPlayers.filter(
    (p) => p.cardType === 'VIETNAM_CHRONICLES'
  ).length;
  const classicsCount = catalogPlayers.filter((p) => p.cardType === 'CLASSICS').length;
  const toty26HmCount = catalogPlayers.filter((p) => p.cardType === 'TOTY26_HM').length;
  const futureStarsCount = catalogPlayers.filter((p) => p.cardType === 'FUTURE_STARS').length;
  const tierCountA = catalogPlayers.filter((p) => p.ovr >= 100).length;
  const tierCountB = catalogPlayers.filter((p) => p.ovr >= 90 && p.ovr <= 99).length;
  const tierCountC = catalogPlayers.filter((p) => p.ovr < 90).length;

  const handleSelectPlayer = (player: PlayerCard) => {
    soundService.playClick();
    setInspectingPlayerId(player.id);
  };

  const handleOpenPackForPlayer = (player: PlayerCard) => {
    soundService.playClick();
    if (player.cardType === 'CHAMPIONS_JUVENTUS' && onOpenJuventusSpin) {
      onOpenJuventusSpin();
      return;
    }
    if (player.cardType === 'BUNDESLIGA' && onOpenBundesligaSpin) {
      onOpenBundesligaSpin();
      return;
    }
    if (player.id.startsWith('ginga_w1b_')) {
      if (onOpenGingaW1BSpin) {
        onOpenGingaW1BSpin();
      } else if (onOpenGingaSpin) {
        onOpenGingaSpin();
      }
      return;
    }
    if ((player.cardType === 'GINGA' || player.cardType === 'GINGA_ICON') && onOpenGingaSpin) {
      onOpenGingaSpin();
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-cruyff select-none overflow-hidden animate-fadeIn">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img
          src="/assets/aistudio/draft_TOTY26_BG_c07ec164.png"
          alt="Stadium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950 to-black" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl h-[92vh] bg-zinc-950/95 border border-yellow-500/40 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col overflow-hidden">
        
        {/* Header HUD */}
        <header className="px-4 sm:px-6 py-3.5 bg-black/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 rounded-xl overflow-hidden border border-yellow-400/60 shadow-lg flex items-center justify-center bg-black">
              <img
                src="/assets/aistudio/_nh_thu_nh__mu__th__UTOTY_Trong_album_d367c95c.png"
                alt="Mùa thẻ UTOTY"
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase italic tracking-wider">
                  ALBUM BỘ SƯU TẬP UTOTY
                </h2>
                <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 text-[10px] font-bold uppercase tracking-widest border border-yellow-400/40">
                  MÙA THẺ UTOTY 2026
                </span>
              </div>
              <p className="text-xs text-gray-400 font-cruyff">
                Tổng hợp {totyFeaturedPlayers.length} cầu thủ mùa giải Ultimate Team of the Year 26
              </p>
            </div>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold font-mono">
              Icon/Vàng: {tierCountA}
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-500/10 border border-slate-400/30 text-slate-300 text-xs font-bold font-mono">
              Bạc: {tierCountB}
            </div>
            <div className="px-3 py-1 rounded-lg bg-amber-700/10 border border-amber-600/30 text-amber-300 text-xs font-bold font-mono">
              Đồng: {tierCountC}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all ml-2"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Filter Toolbar */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Tier Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all ${
                selectedTier === 'all'
                  ? 'bg-yellow-400 text-black shadow-md shadow-yellow-500/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Tất cả ({totyFeaturedPlayers.length})
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('CHAMPIONS_JUVENTUS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'CHAMPIONS_JUVENTUS'
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-zinc-900/95 text-amber-200 border border-amber-300/55 hover:bg-amber-500/20'
              }`}
            >
              <img
                src={CHAMPIONS_JUVENTUS_ASSETS.clubLogo}
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Juventus ({juventusCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('BUNDESLIGA');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'BUNDESLIGA'
                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-700 text-white font-black shadow-md'
                  : 'bg-red-600/15 text-red-200 border border-red-400/50 hover:bg-red-600/25'
              }`}
            >
              <img
                src={BUNDESLIGA_ASSETS.eventLogo}
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Bundesliga ({bundesligaCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('GINGA');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'GINGA'
                  ? 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-green-500 text-slate-950 font-black shadow-md'
                  : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/50 hover:bg-emerald-500/25'
              }`}
            >
              <img
                src="/assets/aistudio/khung_th__c_u_th__ginga_g_i_a_69452143.png"
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Ginga 26 ({gingaCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('CONMEBOL_LIBERTADORES');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'CONMEBOL_LIBERTADORES'
                  ? 'bg-gradient-to-r from-[#f8de88] via-[#d4af37] to-[#9b6c19] text-[#140d04] font-black shadow-md'
                  : 'bg-[#2a1d08]/90 text-[#fce8a6] border border-[#d4af37]/60 hover:bg-[#3a280b]'
              }`}
            >
              <img
                src={getLibAsset('cardFrame')}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                }}
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>CONMEBOL Libertadores ({conmebolCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('BALLON_DOR');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'BALLON_DOR'
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-amber-500/15 text-amber-200 border border-amber-400/50 hover:bg-amber-500/25'
              }`}
            >
              <img
                src="/assets/aistudio/khung_th__c_u_th__ballon_dor_fefecb94.png"
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Ballon d&apos;Or ({ballonDorCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('RONALDO_CHRONICLES');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'RONALDO_CHRONICLES'
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-zinc-300 text-slate-950 font-black shadow-md'
                  : 'bg-zinc-900/95 text-amber-200 border border-amber-400/55 hover:bg-amber-500/20'
              }`}
            >
              <img
                src="/assets/aistudio/khung_th__bi_n_ni_n_s__ronaldo_f3992fff.png"
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Biên Niên Sử Ronaldo ({ronaldoChroniclesCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('VIETNAM_CHRONICLES');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'VIETNAM_CHRONICLES'
                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-yellow-400 text-white font-black shadow-md'
                  : 'bg-red-950/90 text-yellow-200 border border-yellow-400/55 hover:bg-red-900/80'
              }`}
            >
              <img
                src="/assets/aistudio/vietnam_club_1d2bebf2.png"
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Biên Niên Sử Việt Nam ({vietnamChroniclesCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('CLASSICS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'CLASSICS'
                  ? 'bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-300 text-slate-950 font-black shadow-md'
                  : 'bg-teal-500/15 text-teal-200 border border-teal-300/50 hover:bg-teal-500/25'
              }`}
            >
              <img
                src="/assets/aistudio/khung_th__classics_6d23269c.png"
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>Classics Icons ({classicsCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('TOTY26_HM');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedTier === 'TOTY26_HM'
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 text-white font-black shadow-md'
                  : 'bg-purple-500/15 text-purple-200 border border-purple-400/45 hover:bg-purple-500/25'
              }`}
            >
              <img
                src="/assets/aistudio/backgrounds_TOTY26_HM_b1b0286b.png"
                alt=""
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span>TOTY26_HM ({toty26HmCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('FUTURE_STARS');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                selectedTier === 'FUTURE_STARS'
                  ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-500 text-indigo-950 font-black'
                  : 'bg-fuchsia-500/15 text-cyan-200 border border-cyan-400/40 hover:bg-fuchsia-500/25'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Future Stars ({futureStarsCount})</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('A');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                selectedTier === 'A'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black'
                  : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gói A (100-104+)</span>
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('B');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedTier === 'B'
                  ? 'bg-slate-200 text-black font-black'
                  : 'bg-slate-500/10 text-slate-300 border border-slate-400/30 hover:bg-slate-500/20'
              }`}
            >
              Gói B (90-99)
            </button>
            <button
              onClick={() => {
                soundService.playTabSwitch();
                setSelectedTier('C');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedTier === 'C'
                  ? 'bg-amber-600 text-white font-black'
                  : 'bg-amber-800/20 text-amber-300 border border-amber-700/40 hover:bg-amber-800/30'
              }`}
            >
              Gói C (&lt;90 OVR)
            </button>
          </div>

          {/* Position Quick Filter & Search Bar */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Position Select */}
            <select
              value={selectedPosition}
              onChange={(e) => {
                soundService.playTabSwitch();
                setSelectedPosition(e.target.value);
              }}
              className="bg-zinc-800 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-cruyff focus:outline-none focus:border-yellow-400"
            >
              <option value="all">Mọi vị trí</option>
              <option value="FWD">Tiền đạo (ST/RW/LW/CF)</option>
              <option value="MID">Tiền vệ (CAM/CM/CDM)</option>
              <option value="DEF">Hậu vệ (CB/LB/RB)</option>
              <option value="GK">Thủ môn (GK)</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[160px] sm:min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, CLB, quốc gia..."
                className="w-full bg-zinc-800/90 border border-white/15 focus:border-yellow-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-400 font-cruyff focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body: Left Grid (Album Cards) + Right Inspection Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT: Grid of Cards (7 or 8 columns on large screen) */}
          <div className="lg:col-span-8 p-4 overflow-y-auto border-r border-white/10 flex flex-col justify-between">
            {filteredPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Search className="w-12 h-12 text-gray-600 mb-2" />
                <p className="text-gray-400 font-cruyff text-sm">Không tìm thấy cầu thủ nào phù hợp bộ lọc</p>
                <button
                  onClick={() => {
                    setSelectedTier('all');
                    setSelectedPosition('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-yellow-400 text-black font-cruyff font-bold text-xs"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
                {filteredPlayers.map((player, idx) => {
                  const isSelected = inspectingPlayer?.id === player.id;
                  return (
                    <div
                      key={`${player.id}_album_${idx}`}
                      onClick={() => handleSelectPlayer(player)}
                      className={`relative cursor-pointer transition-all p-1.5 rounded-2xl flex flex-col items-center ${
                        isSelected
                          ? 'bg-yellow-400/20 border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105'
                          : 'hover:bg-white/5 border border-transparent hover:border-white/20'
                      }`}
                    >
                      <FCCard player={player} size="sm" showStats={false} />
                      <div className="text-center mt-1 w-full px-1">
                        <span className="font-cruyff font-bold text-xs text-white truncate block">
                          {player.name}
                        </span>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                          <span className="text-yellow-400 font-bold">{player.position}</span>
                          <span>·</span>
                          <span className="truncate max-w-[80px]">{player.club}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Detailed RenderZ Inspection Drawer */}
          {inspectingPlayer ? (
            <div className="lg:col-span-4 p-4 sm:p-6 bg-zinc-900/60 overflow-y-auto flex flex-col justify-between">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
                    <span className="font-cruyff font-bold text-xs uppercase tracking-widest text-yellow-300">
                      CHI TIẾT CHỈ SỐ RENDERZ
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs font-bold">
                    OVR {inspectingPlayer.ovr}
                  </span>
                </div>

                {/* Central Card Display */}
                <div className="flex justify-center my-3">
                  <FCCard player={inspectingPlayer} size="md" showStats={true} />
                </div>

                {/* Full Player Info Box */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2 mt-4 text-xs font-cruyff">
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 uppercase">Họ và Tên</span>
                    <span className="font-bold text-white text-sm">{inspectingPlayer.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 uppercase">Câu Lạc Bộ</span>
                    <div className="flex items-center gap-1.5 font-bold text-yellow-300">
                      {(() => {
                        const isIcon =
                          inspectingPlayer.club.toLowerCase().includes('icon') ||
                          inspectingPlayer.cardType === 'TOTY_ICON' ||
                          inspectingPlayer.cardType === 'UTOTY_ICON' ||
                          inspectingPlayer.cardType === 'UTOTY_ICONS' ||
                          inspectingPlayer.cardType === 'CLASSICS' ||
                          inspectingPlayer.cardType === 'GINGA_ICON';
                        const crestUrls = resolveClubCrestUrls(
                          inspectingPlayer.club,
                          inspectingPlayer.clubLogo,
                          isIcon
                        );
                        return crestUrls.length > 0 ? (
                          <img
                            src={crestUrls[0]}
                            alt={inspectingPlayer.club}
                            className="w-4 h-4 object-contain"
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
                      <span>{inspectingPlayer.club}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 uppercase">Quốc Tịch</span>
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      {inspectingPlayer.nationFlag && (
                        <img
                          src={inspectingPlayer.nationFlag}
                          alt={inspectingPlayer.nation}
                          className="w-4 h-3 object-cover rounded-xs"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <span>{inspectingPlayer.nation}</span>
                    </div>
                  </div>
                  {inspectingPlayer.league && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 uppercase">Giải Đấu</span>
                      <span className="font-bold text-gray-300">{inspectingPlayer.league}</span>
                    </div>
                  )}
                  {!inspectingPlayer.id.startsWith('shop_featured_') && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 uppercase">Kỹ Thuật (Skill Moves)</span>
                      <span className="font-bold text-yellow-400">
                        {'★'.repeat(inspectingPlayer.skillMoves)}{'☆'.repeat(5 - inspectingPlayer.skillMoves)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400 uppercase">Chân Không Thuận (WF)</span>
                    <span className="font-bold text-yellow-400">
                      {'★'.repeat(inspectingPlayer.weakFoot)}{'☆'.repeat(5 - inspectingPlayer.weakFoot)}
                    </span>
                  </div>
                  {inspectingPlayer.foot && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 uppercase">Chân Thuận</span>
                      <span className="font-bold text-white">{inspectingPlayer.foot}</span>
                    </div>
                  )}
                  {inspectingPlayer.workRate && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 uppercase">Tỷ Lệ Hoạt Động (Workrate)</span>
                      <span className="font-bold text-emerald-400">{inspectingPlayer.workRate}</span>
                    </div>
                  )}
                  {inspectingPlayer.priceEstimate && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-400 uppercase">Giá Thị Trường Ước Tính</span>
                      <span className="font-mono font-bold text-yellow-400">{inspectingPlayer.priceEstimate}</span>
                    </div>
                  )}
                </div>

                {/* RenderZ Detailed Stat Bars */}
                <div className="mt-4 p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
                  <span className="font-cruyff font-bold text-[11px] text-gray-300 uppercase tracking-widest block mb-2">
                    CHỈ SỐ THÀNH PHẦN (FC STATS)
                  </span>
                  
                  {/* PAC */}
                  <div>
                    <div className="flex justify-between text-xs font-cruyff mb-1">
                      <span className="text-gray-400">Tốc Độ (PAC)</span>
                      <span className="font-bold font-mono text-yellow-300">{inspectingPlayer.pac}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, inspectingPlayer.pac)}%` }} />
                    </div>
                  </div>

                  {/* SHO */}
                  <div>
                    <div className="flex justify-between text-xs font-cruyff mb-1">
                      <span className="text-gray-400">Dứt Điểm (SHO)</span>
                      <span className="font-bold font-mono text-yellow-300">{inspectingPlayer.sho}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, inspectingPlayer.sho)}%` }} />
                    </div>
                  </div>

                  {/* PAS */}
                  <div>
                    <div className="flex justify-between text-xs font-cruyff mb-1">
                      <span className="text-gray-400">Chuyền Bóng (PAS)</span>
                      <span className="font-bold font-mono text-yellow-300">{inspectingPlayer.pas}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, inspectingPlayer.pas)}%` }} />
                    </div>
                  </div>

                  {/* DRI */}
                  <div>
                    <div className="flex justify-between text-xs font-cruyff mb-1">
                      <span className="text-gray-400">Rê Bóng (DRI)</span>
                      <span className="font-bold font-mono text-yellow-300">{inspectingPlayer.dri}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, inspectingPlayer.dri)}%` }} />
                    </div>
                  </div>

                  {/* DEF */}
                  <div>
                    <div className="flex justify-between text-xs font-cruyff mb-1">
                      <span className="text-gray-400">Phòng Ngự (DEF)</span>
                      <span className="font-bold font-mono text-yellow-300">{inspectingPlayer.def}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, inspectingPlayer.def)}%` }} />
                    </div>
                  </div>

                  {/* PHY */}
                  <div>
                    <div className="flex justify-between text-xs font-cruyff mb-1">
                      <span className="text-gray-400">Thể Lực (PHY)</span>
                      <span className="font-bold font-mono text-yellow-300">{inspectingPlayer.phy}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, inspectingPlayer.phy)}%` }} />
                    </div>
                  </div>
                </div>

                <PixelPlayerCardPanel
                  player={inspectingPlayer}
                  hideSkillStats={inspectingPlayer.id.startsWith('shop_featured_')}
                  className="mt-4"
                />
              </div>

              {/* Spin / Exchange Shortcut only for special event cards */}
              {inspectingPlayer.id !== 'box_sig_van_der_sar_105' &&
                inspectingPlayer.id !== 'box_ginga_garrincha_106' &&
                (inspectingPlayer.cardType === 'CHAMPIONS_JUVENTUS' ||
                  inspectingPlayer.cardType === 'BUNDESLIGA' ||
                  inspectingPlayer.cardType === 'GINGA' ||
                  inspectingPlayer.cardType === 'GINGA_ICON' ||
                  inspectingPlayer.cardType === 'CONMEBOL_LIBERTADORES' ||
                  inspectingPlayer.cardType === 'RONALDO_CHRONICLES' ||
                  inspectingPlayer.cardType === 'VIETNAM_CHRONICLES' ||
                  inspectingPlayer.cardType === 'CLASSICS' ||
                  inspectingPlayer.cardType === 'TOTY26_HM' ||
                  inspectingPlayer.cardType === 'FUTURE_STARS' ||
                  ((inspectingPlayer.cardType === 'TOTY' ||
                    inspectingPlayer.cardType === 'UTOTY') &&
                    inspectingPlayer.ovr >= 90)) && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    {inspectingPlayer.cardType === 'CONMEBOL_LIBERTADORES' ? (
                      <div className="space-y-2">
                        <div className="w-full py-2.5 px-3 rounded-xl bg-[#1f1506] border border-[#d4af37]/60 text-center font-cruyff font-black text-[11px] uppercase tracking-wider text-[#fce8a6]">
                          CHƯA CÓ VÉ QUAY · CHỈ CÓ TRONG PACK, TTCH &amp; TRAO ĐỔI MẢNH
                        </div>
                        {onOpenConmebolShopPacks && (
                          <button
                            onClick={() => {
                              soundService.playClick();
                              onOpenConmebolShopPacks();
                            }}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#f8de88] via-[#d4af37] to-[#9b6c19] text-[#140d04] font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                          >
                            <img
                              src={getLibAsset('tokenSmall')}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                              }}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                            <span>MỞ GÓI CỬA HÀNG CONMEBOL LIBERTADORES</span>
                            <ChevronRight className="w-4 h-4 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    ) : inspectingPlayer.cardType === 'CLASSICS' ? (
                      onOpenIconsModal ? (
                        <button
                          onClick={() => {
                            soundService.playClick();
                            onOpenIconsModal();
                          }}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-300 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <img
                            src="/assets/aistudio/khung_th__classics_6d23269c.png"
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span>TRAO ĐỔI BIÊN NIÊN SỬ ICONS (6 CẦU THỦ 90+)</span>
                        </button>
                      ) : (
                        <div className="w-full py-3 px-4 rounded-xl bg-teal-950/75 border border-teal-400/50 text-center font-cruyff font-black text-xs uppercase tracking-wider text-teal-200">
                          SỞ HỮU QUA TRAO ĐỔI BIÊN NIÊN SỬ ICONS (6 CẦU THỦ 90+ · MỤC ICONS)
                        </div>
                      )
                    ) : inspectingPlayer.cardType === 'RONALDO_CHRONICLES' ? (
                      onOpenRonaldoChronicles ? (
                        <button
                          onClick={() => {
                            soundService.playClick();
                            onOpenRonaldoChronicles();
                          }}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(250,204,21,0.35)]"
                        >
                          <img
                            src="/assets/aistudio/khung_th__bi_n_ni_n_s__ronaldo_f3992fff.png"
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span>MỞ BIÊN NIÊN SỬ RONALDO (TRẢ LỜI &gt;7/10 CÂU)</span>
                          <ChevronRight className="w-4 h-4 stroke-[3]" />
                        </button>
                      ) : (
                        <div className="w-full py-3 px-4 rounded-xl bg-amber-950/75 border border-yellow-400/55 text-center font-cruyff font-black text-xs uppercase tracking-wider text-yellow-200">
                          SỞ HỮU QUA BIÊN NIÊN SỬ RONALDO (MỤC ICONS · &gt;7/10 CÂU HỎI)
                        </div>
                      )
                    ) : inspectingPlayer.cardType === 'VIETNAM_CHRONICLES' ? (
                      onOpenVietnamChronicles ? (
                        <button
                          onClick={() => {
                            soundService.playClick();
                            onOpenVietnamChronicles();
                          }}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 text-white font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.45)]"
                        >
                          <img
                            src="/assets/aistudio/vietnam_club_1d2bebf2.png"
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                          <span>MỞ BIÊN NIÊN SỬ VIỆT NAM (ĐỔI MẢNH VN · KHÔNG GIAO DỊCH)</span>
                          <ChevronRight className="w-4 h-4 stroke-[3]" />
                        </button>
                      ) : (
                        <div className="w-full py-3 px-4 rounded-xl bg-red-950/80 border border-yellow-400/55 text-center font-cruyff font-black text-xs uppercase tracking-wider text-yellow-200">
                          SỞ HỮU QUA SỰ KIỆN BIÊN NIÊN SỬ VIỆT NAM (KHÔNG GIAO DỊCH)
                        </div>
                      )
                    ) : inspectingPlayer.id === 'gift_ronaldinho_97' ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-indigo-950/80 border border-indigo-400/60 text-center font-cruyff font-black text-xs uppercase tracking-wider text-indigo-200">
                        QUÀ KỶ NIỆM TRONG HỘP TIN &amp; GIFTCODE SUPERPACK (KHÔNG GIAO DỊCH)
                      </div>
                    ) : inspectingPlayer.id.startsWith('shop_featured_') ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-purple-950/80 border border-purple-400/60 text-center font-cruyff font-black text-xs uppercase tracking-wider text-purple-200">
                        CHIÊU MỘ BẰNG MẢNH TẠI CỬA HÀNG · MỤC CẦU THỦ NỔI BẬT (KHÔNG GIAO DỊCH)
                      </div>
                    ) : inspectingPlayer.clubExchangeCost ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-amber-950/75 border border-amber-400/55 text-center font-cruyff font-black text-xs uppercase tracking-wider text-amber-200">
                        SỞ HỮU QUA TRAO ĐỔI {inspectingPlayer.clubExchangeCost.toLocaleString('vi-VN')} TOKEN CLB (MỤC ĐỘI HÌNH · CÂU LẠC BỘ)
                      </div>
                    ) : inspectingPlayer.id.startsWith('ultimate_icon_') ||
                      (inspectingPlayer.isUntradeableOnly && inspectingPlayer.customFrameUrl) ? (
                      <div className="space-y-2">
                        <div className="w-full py-2 px-3 rounded-xl bg-rose-950/75 border border-rose-400/55 text-center font-cruyff font-black text-[11px] uppercase tracking-wider text-rose-200">
                          KHÔNG GIAO DỊCH · KHUNG THẺ RIÊNG ĐỘC QUYỀN
                        </div>
                        {onOpenUltimateIconsExchange || onOpenIconsModal ? (
                          <button
                            onClick={() => {
                              soundService.playClick();
                              if (onOpenUltimateIconsExchange) {
                                onOpenUltimateIconsExchange();
                              } else if (onOpenIconsModal) {
                                onOpenIconsModal();
                              }
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(251,191,36,0.45)]"
                          >
                            <img
                              src={
                                inspectingPlayer.customFrameUrl ||
                                '/assets/aistudio/khung_th__zidane_104_ovr_8d9ba9ac.png'
                              }
                              alt=""
                              className="w-5 h-5 object-contain shrink-0"
                            />
                            <span>
                              {inspectingPlayer.ovr >= 106
                                ? 'TRAO ĐỔI TỐI THƯỢNG · 15 CẦU THỦ 102+'
                                : 'TRAO ĐỔI TỐI THƯỢNG · 10 HUYỀN THOẠI 102–104'}
                            </span>
                            <ChevronRight className="w-4 h-4 stroke-[3]" />
                          </button>
                        ) : (
                          <div className="w-full py-3 px-4 rounded-xl bg-amber-950/75 border border-yellow-400/60 text-center font-cruyff font-black text-xs uppercase tracking-wider text-yellow-200">
                            {inspectingPlayer.ovr >= 106
                              ? 'SỞ HỮU QUA TRAO ĐỔI TỐI THƯỢNG (15 CẦU THỦ 102+ · BIÊN NIÊN SỬ ICONS)'
                              : 'SỞ HỮU QUA TRAO ĐỔI TỐI THƯỢNG (10 HUYỀN THOẠI 102–104 · BIÊN NIÊN SỬ ICONS)'}
                          </div>
                        )}
                      </div>
                    ) : inspectingPlayer.isExchangeExclusive ? (
                      <div className="w-full py-3 px-4 rounded-xl bg-purple-950/75 border border-purple-400/50 text-center font-cruyff font-black text-xs uppercase tracking-wider text-purple-200">
                        {inspectingPlayer.clubExchangeCost
                          ? `SỞ HỮU QUA TRAO ĐỔI ${inspectingPlayer.clubExchangeCost.toLocaleString('vi-VN')} TOKEN CLB (MỤC ĐỘI HÌNH · CÂU LẠC BỘ)`
                          : 'SỞ HỮU QUA TRAO ĐỔI THẺ TOTY HM (CHƯƠNG 1 SỰ KIỆN TOTY)'}
                      </div>
                    ) : inspectingPlayer.cardType === 'CHAMPIONS_JUVENTUS' ||
                      inspectingPlayer.cardType === 'BUNDESLIGA' ||
                      inspectingPlayer.cardType === 'GINGA_ICON' ||
                      inspectingPlayer.cardType === 'GINGA' ? (
                      <button
                        onClick={() => handleOpenPackForPlayer(inspectingPlayer)}
                        className={`w-full py-3.5 px-4 rounded-xl font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                          inspectingPlayer.cardType === 'CHAMPIONS_JUVENTUS'
                            ? 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.45)]'
                            : inspectingPlayer.cardType === 'BUNDESLIGA'
                            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-700 text-white shadow-[0_0_25px_rgba(220,38,38,0.45)]'
                            : 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-green-500 text-slate-950 shadow-[0_0_25px_rgba(34,197,94,0.45)]'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {inspectingPlayer.cardType === 'CHAMPIONS_JUVENTUS'
                            ? 'MỞ VÉ QUAY CHAMPIONS: JUVENTUS ĐỂ SĂN'
                            : inspectingPlayer.cardType === 'BUNDESLIGA'
                            ? 'MỞ VÉ QUAY BUNDESLIGA ĐỂ SĂN'
                            : inspectingPlayer.id.startsWith('ginga_w1b_')
                            ? 'MỞ VÉ QUAY GINGA TUẦN 1 B ĐỂ SĂN'
                            : 'MỞ VÉ QUAY GINGA TUẦN 1 A ĐỂ SĂN'}
                        </span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    ) : (
                      <div className="w-full py-3 px-4 rounded-xl bg-slate-900/90 border border-sky-400/45 text-center font-cruyff font-black text-xs uppercase tracking-wider text-sky-200">
                        {inspectingPlayer.cardType === 'FUTURE_STARS'
                          ? 'SỞ HỮU QUA GÓI FUTURE STARS · THỊ TRƯỜNG CHUYỂN NHƯỢNG'
                          : 'SỞ HỮU QUA GÓI CỬA HÀNG · TRAO ĐỔI & THỊ TRƯỜNG CHUYỂN NHƯỢNG'}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="lg:col-span-4 p-6 flex items-center justify-center text-gray-500 text-xs font-cruyff">
              Chọn một cầu thủ từ danh sách để xem chi tiết chỉ số
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
