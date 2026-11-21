import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import { totyFeaturedPlayers, STARTER_OWNED_IDS, STARTER_STARTER_IDS } from '../data/mockData';
import { FCCard } from './FCCard';
import { PixelPlayerCardPanel } from './PixelPlayerCardPanel';
import { TopSectionHeader } from './TopSectionHeader';
import { soundService } from '../services/sound';
import { resolvePlayerWithUtotyUpgrade } from '../utils/utotyUpgrade';
import {
  addOwnedPlayerCopies,
  getOwnedCopyCountMap,
  removeOwnedPlayerCopies,
} from '../utils/squadUtils';

interface TransferMarketModalProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenMyTeam: () => void;
  onClose: () => void;
}

const ATT_POS = new Set(['ST', 'CF', 'LW', 'RW']);
const MID_POS = new Set(['CAM', 'CM', 'CDM', 'LM', 'RM']);
const DEF_POS = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']);

export function getMarketBuyPrice(player: PlayerCard): number {
  const ovr = player.isUtotyUpgraded
    ? typeof player.baseOvr === 'number'
      ? player.baseOvr
      : player.id === 'star_pass_bellingham_103' ||
        player.id === 'ginga_dybala_104' ||
        player.id === 'ginga_gilberto_silva_106' ||
        player.id === 'box_ginga_garrincha_106'
      ? player.ovr
      : player.ovr - 2
    : player.ovr;
  const iconMultiplier =
    player.cardType === 'UTOTY_ICON' ||
    player.cardType === 'TOTY_ICON' ||
    (player.club || '').toLowerCase().includes('icon')
      ? 1.25
      : 1.0;

  let base = 40000;
  if (ovr <= 70) {
    base = 25000 + Math.max(0, ovr - 60) * 3500;
  } else if (ovr <= 75) {
    base = 62000 + (ovr - 70) * 7500;
  } else if (ovr <= 80) {
    base = 105000 + (ovr - 75) * 24000;
  } else if (ovr <= 85) {
    base = 240000 + (ovr - 80) * 75000;
  } else if (ovr <= 89) {
    base = 650000 + (ovr - 85) * 280000;
  } else if (ovr <= 94) {
    base = 2200000 + (ovr - 90) * 950000;
  } else if (ovr <= 99) {
    base = 7500000 + (ovr - 95) * 3400000;
  } else {
    base = 28000000 + (ovr - 100) * 13500000;
  }

  return Math.round((base * iconMultiplier) / 1000) * 1000;
}

export function getMarketSellPrice(player: PlayerCard): number {
  return Math.round((getMarketBuyPrice(player) * 0.75) / 1000) * 1000;
}

export const TransferMarketModal: React.FC<TransferMarketModalProps> = ({
  user,
  onUpdateUser,
  onOpenMyTeam,
  onClose,
}) => {
  const [marketTab, setMarketTab] = useState<'buy' | 'sell'>('buy');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ATT' | 'MID' | 'DEF' | 'GK'>('ALL');
  const [ovrFilter, setOvrFilter] = useState<
    'ALL' | 'CONMEBOL' | '95+' | '90-94' | '80-89' | '60-79'
  >('ALL');
  const [sortBy, setSortBy] = useState<'ovr_desc' | 'price_asc' | 'price_desc'>('ovr_desc');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'TRADEABLE' | 'UNTRADEABLE'>('ALL');
  const [selectedPlayerRaw, setSelectedPlayer] = useState<PlayerCard>(
    () => totyFeaturedPlayers.find((p) => !p.isUntradeableOnly) || totyFeaturedPlayers[0]
  );
  const [toast, setToast] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const marketCatalog = useMemo(() => {
    const upgradedSet = new Set(user.utotyUpgradedIds ?? []);
    return totyFeaturedPlayers.map((p) => resolvePlayerWithUtotyUpgrade(p, upgradedSet));
  }, [user.utotyUpgradedIds]);

  const selectedPlayer = useMemo(
    () =>
      marketCatalog.find((p) => p.id === selectedPlayerRaw.id) ||
      marketCatalog.find((p) => !p.isUntradeableOnly) ||
      marketCatalog[0],
    [marketCatalog, selectedPlayerRaw.id]
  );

  const ownedIdsList = useMemo(
    () => (user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS),
    [user.ownedPlayerIds]
  );

  const ownedCopyCounts = useMemo(
    () => getOwnedCopyCountMap(ownedIdsList),
    [ownedIdsList]
  );

  const ownedSet = useMemo(() => {
    return new Set(ownedIdsList);
  }, [ownedIdsList]);

  const tradeableSet = useMemo(() => {
    return new Set(user.tradeablePlayerIds ?? []);
  }, [user.tradeablePlayerIds]);

  const starterSet = useMemo(() => {
    return new Set(user.starterIds?.length === 11 ? user.starterIds : STARTER_STARTER_IDS);
  }, [user.starterIds]);

  const showNotice = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 2600);
  };

  const filteredListings = useMemo(() => {
    const source =
      marketTab === 'buy'
        ? marketCatalog.filter((p) => !p.isUntradeableOnly)
        : marketCatalog.filter((p) => ownedSet.has(p.id));

    const q = searchQuery.trim().toLowerCase();

    return source
      .filter((p) => {
        if (q) {
          const matchName =
            p.name.toLowerCase().includes(q) ||
            (p.fullName && p.fullName.toLowerCase().includes(q)) ||
            p.club.toLowerCase().includes(q) ||
            p.nation.toLowerCase().includes(q) ||
            (p.league && p.league.toLowerCase().includes(q));
          if (!matchName) return false;
        }

        if (roleFilter === 'ATT' && !ATT_POS.has(p.position)) return false;
        if (roleFilter === 'MID' && !MID_POS.has(p.position)) return false;
        if (roleFilter === 'DEF' && !DEF_POS.has(p.position)) return false;
        if (roleFilter === 'GK' && p.position !== 'GK') return false;

        if (ovrFilter === 'CONMEBOL' && p.cardType !== 'CONMEBOL_LIBERTADORES') return false;
        if (ovrFilter === '95+' && p.ovr < 95) return false;
        if (ovrFilter === '90-94' && (p.ovr < 90 || p.ovr > 94)) return false;
        if (ovrFilter === '80-89' && (p.ovr < 80 || p.ovr > 89)) return false;
        if (ovrFilter === '60-79' && p.ovr > 79) return false;

        if (marketTab === 'sell') {
          const canTrade = tradeableSet.has(p.id) && !p.isUntradeableOnly;
          if (tradeFilter === 'TRADEABLE' && !canTrade) return false;
          if (tradeFilter === 'UNTRADEABLE' && canTrade) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (marketTab === 'sell') {
          const aTrade = tradeableSet.has(a.id) && !a.isUntradeableOnly ? 1 : 0;
          const bTrade = tradeableSet.has(b.id) && !b.isUntradeableOnly ? 1 : 0;
          if (bTrade !== aTrade) return bTrade - aTrade;
        }
        if (sortBy === 'price_asc') return getMarketBuyPrice(a) - getMarketBuyPrice(b);
        if (sortBy === 'price_desc') return getMarketBuyPrice(b) - getMarketBuyPrice(a);
        return b.ovr - a.ovr;
      });
  }, [marketTab, marketCatalog, ownedSet, tradeableSet, searchQuery, roleFilter, ovrFilter, sortBy, tradeFilter]);

  const handleBuyPlayer = (player: PlayerCard) => {
    soundService.playClick();
    if (player.isUntradeableOnly) {
      showNotice(
        `${player.name} là Cầu Thủ Không Giao Dịch độc quyền Trao Đổi Tối Thượng — không thể mua trên TTCN!`,
        'error'
      );
      return;
    }

    const price = getMarketBuyPrice(player);
    if (user.coins < price) {
      soundService.playTrophy();
      showNotice(
        `Không đủ Xu! Cần thêm ${(price - user.coins).toLocaleString('vi-VN')} Xu để chiêu mộ ${player.name}.`,
        'error'
      );
      return;
    }

    const nextOwned = addOwnedPlayerCopies(ownedIdsList, [player.id]);
    const nextTradeable = Array.from(new Set([...(user.tradeablePlayerIds ?? []), player.id]));

    soundService.playConfirmSelection();
    onUpdateUser({
      coins: user.coins - price,
      ownedPlayerIds: nextOwned,
      tradeablePlayerIds: nextTradeable,
    });
    setSelectedPlayer(player);
    const nextCopies = (ownedCopyCounts.get(player.id) ?? 0) + 1;
    showNotice(
      `Chiêu mộ thành công ${player.name} (OVR ${player.ovr} · Đang có x${nextCopies}) với giá ${price.toLocaleString('vi-VN')} Xu!`
    );
  };

  const handleSellPlayer = (player: PlayerCard) => {
    soundService.playClick();
    const currentCopies = ownedCopyCounts.get(player.id) ?? 0;
    if (currentCopies <= 0) return;

    if (!tradeableSet.has(player.id) || player.isUntradeableOnly) {
      showNotice(
        `${player.name} là Cầu Thủ Không Giao Dịch — không thể bán trên Thị Trường Chuyển Nhượng!`,
        'error'
      );
      return;
    }

    if (starterSet.has(player.id) && currentCopies <= 1) {
      showNotice(
        `${player.name} đang nằm trong 11 cầu thủ Đá Chính! Hãy thay ra ghế dự bị trước khi bán.`,
        'error'
      );
      return;
    }

    if (ownedIdsList.length <= 11) {
      showNotice('CLB cần giữ tối thiểu 11 cầu thủ để thi đấu!', 'error');
      return;
    }

    const sellValue = getMarketSellPrice(player);
    const nextOwned = removeOwnedPlayerCopies(ownedIdsList, [{ playerId: player.id, count: 1 }]);
    const remainingCopies = Math.max(0, currentCopies - 1);
    const nextTradeable =
      remainingCopies === 0
        ? Array.from(tradeableSet).filter((id) => id !== player.id)
        : Array.from(tradeableSet);
    const nextBench =
      remainingCopies === 0
        ? (user.benchIds || []).filter((id) => id !== player.id)
        : user.benchIds || [];
    const nextUtotyUpgraded =
      remainingCopies === 0
        ? (user.utotyUpgradedIds || []).filter((id) => id !== player.id)
        : user.utotyUpgradedIds || [];

    soundService.playConfirmSelection();
    onUpdateUser({
      coins: user.coins + sellValue,
      ownedPlayerIds: nextOwned,
      tradeablePlayerIds: nextTradeable,
      benchIds: nextBench,
      utotyUpgradedIds: nextUtotyUpgraded,
    });
    showNotice(`Đã bán 1 thẻ ${player.name} thu về +${sellValue.toLocaleString('vi-VN')} Xu!`);
  };

  const selectedBuyPrice = getMarketBuyPrice(selectedPlayer);
  const selectedSellPrice = getMarketSellPrice(selectedPlayer);
  const selectedOwnedCount = ownedCopyCounts.get(selectedPlayer.id) ?? 0;
  const isSelectedOwned = selectedOwnedCount > 0;
  const isSelectedTradeable =
    tradeableSet.has(selectedPlayer.id) && !selectedPlayer.isUntradeableOnly;
  const isSelectedStarterLocked =
    starterSet.has(selectedPlayer.id) && selectedOwnedCount <= 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none font-cruyff">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-5 py-2.5 rounded-none font-bold text-sm shadow-2xl border ${
            toast.tone === 'success'
              ? 'bg-emerald-500 text-slate-950 border-emerald-200'
              : 'bg-rose-600 text-white border-rose-300'
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Section Header */}
      <TopSectionHeader
        title="CHUYỂN NHƯỢNG"
        subtitle="Mua sắm cầu thủ bằng Xu và bán cầu thủ dự bị"
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        extraRight={
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onClose();
              onOpenMyTeam();
            }}
            className="h-9 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 font-cruyff font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-none"
          >
            ĐỘI HÌNH · OVR {user.ovr}
          </button>
        }
      />

      {/* Border-Divided Top Tabs (No Logos, Sharp Corners) */}
      <div className="grid grid-cols-2 divide-x divide-white/25 border-b border-white/25 bg-slate-950 shrink-0">
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setMarketTab('buy');
          }}
          className={`py-3 px-4 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none relative ${
            marketTab === 'buy'
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>DANH SÁCH MUA ({totyFeaturedPlayers.length})</span>
          {marketTab === 'buy' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setMarketTab('sell');
          }}
          className={`py-3 px-4 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none relative ${
            marketTab === 'sell'
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>CẦU THỦ CLB & BÁN ({ownedSet.size})</span>
          {marketTab === 'sell' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-400" />
          )}
        </button>
      </div>

      {/* Filter Toolbar (Sharp Corners, Divided Borders) */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-white/20 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên cầu thủ, CLB..."
            className="pl-9 pr-3 py-1.5 rounded-none bg-slate-950 border border-white/25 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 w-48 sm:w-60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center divide-x divide-white/25 border border-white/25 bg-slate-950 rounded-none">
            {(['ALL', 'ATT', 'MID', 'DEF', 'GK'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-none text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  roleFilter === role
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {role === 'ALL' ? 'TẤT CẢ' : role}
              </button>
            ))}
          </div>

          <select
            value={ovrFilter}
            onChange={(e) => setOvrFilter(e.target.value as typeof ovrFilter)}
            className="px-3 py-1.5 rounded-none bg-slate-950 border border-white/25 text-xs text-white font-mono cursor-pointer"
          >
            <option value="ALL">MỌI OVR</option>
            <option value="CONMEBOL">MÙA CONMEBOL (102-106)</option>
            <option value="95+">OVR 95 - 106</option>
            <option value="90-94">OVR 90 - 94</option>
            <option value="80-89">OVR 80 - 89</option>
            <option value="60-79">OVR 60 - 79</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 rounded-none bg-slate-950 border border-white/25 text-xs text-white cursor-pointer"
          >
            <option value="ovr_desc">OVR Cao → Thấp</option>
            <option value="price_asc">Giá Thấp → Cao</option>
            <option value="price_desc">Giá Cao → Thấp</option>
          </select>

          {marketTab === 'sell' && (
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value as typeof tradeFilter)}
              className="px-3 py-1.5 rounded-none bg-slate-950 border border-amber-400/50 text-xs text-amber-200 font-bold cursor-pointer"
            >
              <option value="ALL">MỌI TRẠNG THÁI GD</option>
              <option value="TRADEABLE">GIAO DỊCH ĐƯỢC</option>
              <option value="UNTRADEABLE">KHÔNG GIAO DỊCH</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        <div className="lg:col-span-8 overflow-y-auto p-4 space-y-2 border-r border-white/20">
          {filteredListings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 border border-white/15">
              <p className="text-sm font-bold uppercase tracking-wider">
                Không tìm thấy cầu thủ phù hợp bộ lọc
              </p>
            </div>
          ) : (
            filteredListings.map((player) => {
              const buyPrice = getMarketBuyPrice(player);
              const sellPrice = getMarketSellPrice(player);
              const owned = ownedSet.has(player.id);
              const isTradeable = tradeableSet.has(player.id) && !player.isUntradeableOnly;
              const inStartingXI = starterSet.has(player.id);
              const active = selectedPlayer.id === player.id;
              const canAfford = user.coins >= buyPrice;

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    soundService.playClick();
                    setSelectedPlayer(player);
                  }}
                  className={`p-3 rounded-none border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-400'
                      : 'bg-slate-900/75 hover:bg-slate-900 border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FCCard player={player} size="sm" showStats={false} className="!w-16 !h-16" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cruyff font-black text-sm sm:text-base text-white uppercase truncate">
                          {player.name}
                        </span>
                        <span className="font-mono text-xs font-black text-yellow-300 tabular-nums">
                          · {player.position} · OVR {player.ovr}
                        </span>
                        {player.cardType === 'CONMEBOL_LIBERTADORES' && (
                          <span className="px-1.5 py-0.5 bg-[#2a1d08] border border-[#d4af37]/70 text-[10px] font-cruyff font-black text-[#fce8a6] uppercase">
                            CONMEBOL LIBERTADORES
                          </span>
                        )}
                        {owned && (
                          <span
                            className={`px-1.5 py-0.5 border text-[10px] font-cruyff font-black uppercase ${
                              isTradeable
                                ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-400/55 text-rose-200'
                            }`}
                          >
                            {isTradeable ? 'GIAO DỊCH ĐƯỢC' : 'KHÔNG GIAO DỊCH'}
                          </span>
                        )}
                        {inStartingXI && (
                          <span className="text-cyan-300 text-[11px] font-bold uppercase">
                            · ĐÁ CHÍNH
                          </span>
                        )}
                        {!inStartingXI && owned && (
                          <span className="text-emerald-300 text-[11px] font-bold uppercase">
                            · ĐÃ SỞ HỮU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {player.club} · {player.nation} · PAC {player.pac} · SHO {player.sho} · PAS{' '}
                        {player.pas}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-[10px] text-slate-400 uppercase block">
                        {marketTab === 'buy'
                          ? 'Giá Mua (Giao Dịch)'
                          : isTradeable
                          ? 'Giá Bán (75%)'
                          : 'Không Giao Dịch'}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-black ${
                          marketTab === 'sell' && !isTradeable
                            ? 'text-slate-500 line-through'
                            : 'text-yellow-300'
                        }`}
                      >
                        {(marketTab === 'buy' ? buyPrice : sellPrice).toLocaleString('vi-VN')} XU
                      </span>
                    </div>

                    {marketTab === 'buy' ? (
                      <div className="flex items-center gap-2">
                        {owned && (
                          <span className="px-2 py-1.5 rounded-none border border-emerald-400/50 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono font-bold uppercase tabular-nums">
                            x{ownedCopyCounts.get(player.id) ?? 1}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyPlayer(player);
                          }}
                          className={`px-3.5 py-2 rounded-none font-cruyff font-black text-xs uppercase tracking-wider transition-colors border cursor-pointer ${
                            canAfford
                              ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200'
                              : 'bg-slate-900 text-slate-400 border-white/20'
                          }`}
                        >
                          MUA NGAY
                        </button>
                      </div>
                    ) : !isTradeable ? (
                      <span className="px-3 py-2 rounded-none border border-rose-400/45 bg-rose-950/60 text-rose-200 text-[11px] font-bold uppercase">
                        KHÔNG GIAO DỊCH
                      </span>
                    ) : inStartingXI && (ownedCopyCounts.get(player.id) ?? 1) <= 1 ? (
                      <span className="px-3 py-2 rounded-none border border-cyan-400/50 bg-cyan-500/10 text-cyan-300 text-[11px] font-bold uppercase">
                        ĐANG ĐÁ CHÍNH
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellPlayer(player);
                        }}
                        className="px-3.5 py-2 rounded-none bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-200 font-cruyff font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        BÁN NGAY
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Selected Player Inspector */}
        <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-950 flex flex-col justify-between overflow-y-auto gap-4">
          <div className="flex flex-col items-center text-center border border-white/20 p-4 bg-slate-900/50 rounded-none">
            <FCCard player={selectedPlayer} size="lg" showStats={true} />
            <h3 className="mt-2 font-cruyff font-black text-xl text-white uppercase">
              {selectedPlayer.fullName || selectedPlayer.name}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedPlayer.club} · {selectedPlayer.nation} · Thuận chân {selectedPlayer.foot || 'Phải'}
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-y divide-white/20 border border-white/25 font-mono text-center tabular-nums rounded-none">
            {[
              { label: 'TỐC ĐỘ', val: selectedPlayer.pac },
              { label: 'SÚT', val: selectedPlayer.sho },
              { label: 'CHUYỀN', val: selectedPlayer.pas },
              { label: 'RÊ BÓNG', val: selectedPlayer.dri },
              { label: 'PHÒNG THỦ', val: selectedPlayer.def },
              { label: 'THỂ LỰC', val: selectedPlayer.phy },
            ].map((st) => (
              <div key={st.label} className="p-2.5 bg-slate-900/70 rounded-none">
                <span className="text-[10px] text-slate-400 block">{st.label}</span>
                <span className="text-sm font-black text-yellow-300">{st.val}</span>
              </div>
            ))}
          </div>

          <PixelPlayerCardPanel player={selectedPlayer} />

          <div className="p-4 rounded-none bg-slate-900/80 border border-white/25 space-y-3">
            {selectedPlayer.isUtotyUpgraded && typeof selectedPlayer.baseOvr === 'number' && (
              <div className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-400/40 text-[11px] font-bold text-amber-200 text-center uppercase tracking-wide">
                Thẻ nâng cấp UTOTY · Giá chuyển nhượng giữ nguyên theo TOTY {selectedPlayer.baseOvr} OVR
              </div>
            )}
            <div className="flex items-center justify-between text-xs font-mono tabular-nums border-b border-white/15 pb-2">
              <span className="text-slate-400">Giá mua thị trường:</span>
              <span className="text-yellow-300 font-black">
                {selectedBuyPrice.toLocaleString('vi-VN')} Xu
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-slate-400">Giá bán lại (75%):</span>
              <span className="text-emerald-300 font-bold">
                {selectedSellPrice.toLocaleString('vi-VN')} Xu
              </span>
            </div>

            {isSelectedOwned && (
              <div
                className={`px-2.5 py-1.5 border text-[11px] font-bold text-center uppercase tracking-wider ${
                  isSelectedTradeable
                    ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300'
                    : 'bg-rose-950/75 border-rose-400/55 text-rose-200'
                }`}
              >
                {isSelectedTradeable
                  ? `Đang có x${selectedOwnedCount} · GIAO DỊCH ĐƯỢC`
                  : `Đang có x${selectedOwnedCount} · KHÔNG GIAO DỊCH`}
              </div>
            )}

            {marketTab === 'buy' || !isSelectedOwned ? (
              selectedPlayer.isUntradeableOnly ? (
                <div className="w-full py-2.5 px-3 rounded-none bg-rose-950/70 border border-rose-400/55 text-rose-200 text-xs text-center font-bold uppercase">
                  Độc quyền Trao Đổi Tối Thượng · Không Giao Dịch
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBuyPlayer(selectedPlayer)}
                  className={`w-full py-3 rounded-none font-cruyff font-black text-sm uppercase tracking-wider border transition-colors cursor-pointer ${
                    user.coins >= selectedBuyPrice
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200'
                      : 'bg-slate-900 text-slate-400 border-white/20'
                  }`}
                >
                  CHIÊU MỘ · {selectedBuyPrice.toLocaleString('vi-VN')} XU
                </button>
              )
            ) : !isSelectedTradeable ? (
              <div className="w-full py-2.5 px-3 rounded-none bg-rose-950/70 border border-rose-400/55 text-rose-200 text-xs text-center font-bold uppercase">
                Cầu thủ Không Giao Dịch — Không thể bán
              </div>
            ) : isSelectedStarterLocked ? (
              <div className="w-full py-2.5 px-3 rounded-none bg-cyan-500/10 border border-cyan-400/50 text-cyan-200 text-xs text-center font-bold uppercase">
                Cầu thủ đang đá chính trong Đội Hình
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSellPlayer(selectedPlayer)}
                className="w-full py-3 rounded-none bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-200 font-cruyff font-black text-sm uppercase tracking-wider transition-colors cursor-pointer"
              >
                BÁN 1 THẺ NHẬN +{selectedSellPrice.toLocaleString('vi-VN')} XU
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
