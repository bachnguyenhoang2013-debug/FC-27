import React, { useMemo } from 'react';
import { ArrowLeftRight, Clock, Info, Search, ShoppingCart } from 'lucide-react';
import { soundService } from '../services/sound';
import { PlayerCard, TicketSpinTheme, UserProfile } from '../types/game';
import {
  futureStarsPlayers,
  totyFeaturedPlayers,
} from '../data/mockData';
import { gingaPlayers, gingaWeek1BPoolA, GINGA_ASSETS } from '../data/gingaData';
import { bundesligaPoolA, BUNDESLIGA_ASSETS } from '../data/bundesligaData';
import {
  championsJuventusPoolA,
  CHAMPIONS_JUVENTUS_ASSETS,
} from '../data/championsJuventusData';
import { filterConmebolLibertadoresSeasonPool } from '../utils/packOdds';
import { FCCard } from './FCCard';
import { TopSectionHeader } from './TopSectionHeader';
import { VanDerSarBoxSection } from './VanDerSarBoxSection';

interface TicketSpinSectionProps {
  user?: UserProfile;
  onUpdateUser?: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  ticketsCount: number;
  futureStarsTicketsCount?: number;
  spinTheme: TicketSpinTheme;
  onChangeSpinTheme: (theme: TicketSpinTheme) => void;
  onSpin: (count: 1 | 10, theme: TicketSpinTheme) => void;
  onOpenShop: () => void;
  onOpenExchange?: () => void;
  onOpenAlbum?: () => void;
  onOpenOdds: (theme: TicketSpinTheme) => void;
  onClose?: () => void;
  onGoHome?: () => void;
}

export const TicketSpinSection: React.FC<TicketSpinSectionProps> = ({
  user,
  onUpdateUser,
  ticketsCount,
  futureStarsTicketsCount = 0,
  spinTheme,
  onChangeSpinTheme,
  onSpin,
  onOpenShop,
  onOpenExchange,
  onOpenAlbum,
  onOpenOdds,
  onClose,
  onGoHome,
}) => {
  const isVanDerSarBox = spinTheme === 'VAN_DER_SAR_BOX';
  const isJuventus = spinTheme === 'CHAMPIONS_JUVENTUS';
  const isBundesliga = spinTheme === 'BUNDESLIGA';
  const isGingaW1B = spinTheme === 'GINGA_W1B';
  const isGinga = spinTheme === 'GINGA' || isGingaW1B;
  const isLibertadores = spinTheme === 'LIBERTADORES';
  const isNormalToty = spinTheme === 'TOTY';
  const isFutureStars = spinTheme === 'FUTURE_STARS';
  const totalFutureStarsSpinTickets = futureStarsTicketsCount + ticketsCount;

  const handleReturnHome = onGoHome || onClose;

  const sidebarPools: Array<{
    id: TicketSpinTheme;
    shortTitle: string;
    tag: string;
    badge?: string;
    frameThumb: string;
    headerTitle: string;
    endsIn: string;
    poolBNote: string;
    poolANote: string;
  }> = [
    {
      id: 'CHAMPIONS_JUVENTUS',
      shortTitle: 'CHAMPIONS: JUVENTUS',
      tag: 'CHAMPIONS',
      badge: 'MỚI',
      frameThumb: '/assets/aistudio/106_Chiellini_9d033fce.png',
      headerTitle: 'Vòng Quay Champions: Juventus',
      endsIn: 'Champions: Juventus',
      poolBNote: 'Champions: Juventus 92-101 OVR (25% Tỷ lệ)',
      poolANote: 'Champions: Juventus 102-106 OVR (1% Tỷ lệ)',
    },
    {
      id: 'BUNDESLIGA',
      shortTitle: 'BUNDESLIGA',
      tag: 'SỰ KIỆN',
      badge: 'MỚI',
      frameThumb: BUNDESLIGA_ASSETS.eventLogo,
      headerTitle: 'Vòng Quay Bundesliga',
      endsIn: 'Sự kiện Bundesliga',
      poolBNote: 'Bundesliga 92-101 OVR (25% Tỷ lệ)',
      poolANote: 'Bundesliga 102-106 OVR (1% Tỷ lệ)',
    },
    {
      id: 'GINGA',
      shortTitle: 'GINGA TUẦN 1 A',
      tag: 'SỰ KIỆN',
      badge: 'MỚI',
      frameThumb: '/assets/aistudio/khung_th__c_u_th__ginga_g_i_a_69452143.png',
      headerTitle: 'Vòng Quay Ginga Tuần 1 A',
      endsIn: 'Sự kiện Ginga Tuần 1 A',
      poolBNote: '92-101 OVR (24% Tỷ lệ)',
      poolANote: 'Ginga Tuần 1 A 102-106 OVR (1% Tỷ lệ)',
    },
    {
      id: 'GINGA_W1B',
      shortTitle: 'GINGA TUẦN 1 B',
      tag: 'SỰ KIỆN',
      badge: 'MỚI',
      frameThumb: '/assets/aistudio/106_pizarro_d83d24ce.png',
      headerTitle: 'Vòng Quay Ginga Tuần 1 B',
      endsIn: 'Sự kiện Ginga Tuần 1 B',
      poolBNote: '92-101 OVR (24% Tỷ lệ)',
      poolANote: 'Ginga Tuần 1 B 102-106 OVR (1% Tỷ lệ)',
    },
    {
      id: 'LIBERTADORES',
      shortTitle: 'LIBERTADORES',
      tag: 'CÚ HÁM',
      badge: 'MỚI',
      frameThumb: '/assets/aistudio/backgrounds_CONMEBOL_LIBERTADORES_card_f512eb70.png',
      headerTitle: 'Vòng Quay CONMEBOL Libertadores',
      endsIn: 'Sự kiện CONMEBOL',
      poolBNote: '90-101 OVR (24% Tỷ lệ)',
      poolANote: 'Libertadores 102-106 (1% Tỷ lệ)',
    },
  ];

  const activePoolMeta =
    sidebarPools.find((p) => p.id === spinTheme) || sidebarPools[0];

  const showcasePlayers: PlayerCard[] = useMemo(() => {
    if (isJuventus) {
      return championsJuventusPoolA;
    }
    if (isBundesliga) {
      return bundesligaPoolA;
    }
    if (isGingaW1B) {
      return gingaWeek1BPoolA;
    }
    if (isGinga) {
      return gingaPlayers;
    }
    if (isLibertadores) {
      return filterConmebolLibertadoresSeasonPool(totyFeaturedPlayers).slice(0, 5);
    }
    if (isNormalToty) {
      const normals = totyFeaturedPlayers
        .filter((p) => !p.isExchangeExclusive && p.cardType === 'TOTY' && p.ovr <= 104)
        .sort((a, b) => b.ovr - a.ovr);
      const seen = new Set<string>();
      const top5: PlayerCard[] = [];
      for (const p of normals) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          top5.push(p);
        }
        if (top5.length >= 5) break;
      }
      return top5;
    }
    if (isFutureStars) {
      return [...futureStarsPlayers].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
    }
    return [...totyFeaturedPlayers].sort((a, b) => b.ovr - a.ovr).slice(0, 5);
  }, [isJuventus, isBundesliga, isGingaW1B, isGinga, isLibertadores, isNormalToty, isFutureStars]);

  const resolvePortrait = (player: PlayerCard) => {
    const fallbackAvatar =
      '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
    return player.avatarUrl || fallbackAvatar;
  };

  const content = (
    <div className="relative flex-1 w-full flex flex-col overflow-hidden select-none font-cruyff">
      {/* DYNAMIC EVENT / DRAFT BACKGROUND */}
      {isJuventus ? (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0a0a]">
          <img
            src={CHAMPIONS_JUVENTUS_ASSETS.bg}
            alt="Champions: Juventus Draft Backdrop"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/85" />
        </div>
      ) : isBundesliga ? (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#1a0406]">
          <img
            src={BUNDESLIGA_ASSETS.bg2}
            alt="Bundesliga Draft Backdrop"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/85" />
        </div>
      ) : isGinga ? (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#041d0f]">
          <img
            src={GINGA_ASSETS.bg}
            alt="Ginga 26 Draft Backdrop"
            className="w-full h-full object-cover opacity-80 animate-ginga-drift"
          />
          <img
            src={GINGA_ASSETS.boxBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />
        </div>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: isVanDerSarBox
              ? 'radial-gradient(circle at 55% 35%, #065F46 0%, #064E3B 58%, #022C22 100%)'
              : isFutureStars
              ? 'radial-gradient(circle at 60% 35%, #3B0764 0%, #0B1948 60%, #04091E 100%)'
              : 'radial-gradient(circle at 58% 35%, #13389E 0%, #0B2168 52%, #050E30 100%)',
          }}
        />
      )}

      {/* MAIN DRAFT WORKSPACE: LEFT VERTICAL POOL TABS + RIGHT SHOWCASE / VAN DER SAR BOX */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-4 sm:gap-5 px-4 sm:px-6 py-3 sm:py-3.5 overflow-y-auto lg:overflow-hidden">
        {/* LEFT SIDEBAR: VERTICAL DRAFT POOL CARDS + HOME SHORTCUT */}
        <aside className="w-full lg:w-54 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-1 lg:pb-0">
          {handleReturnHome && (
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                handleReturnHome();
              }}
              className="min-w-[155px] lg:min-w-0 w-full py-2.5 px-3 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 hover:brightness-105 text-slate-950 border-2 border-white flex items-center justify-center gap-2 font-cruyff font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(52,211,153,0.45)] cursor-pointer shrink-0"
            >
              <img
                src="/assets/aistudio/headerbar_HOME_46aea045.png"
                alt="Màn Hình Chính"
                className="w-4 h-4 object-contain shrink-0"
              />
              <span>MÀN HÌNH CHÍNH</span>
            </button>
          )}

          {/* Entrance Banner for Box Ginga (Garrincha 106 OVR) */}
          {user && onUpdateUser && (
            <button
              type="button"
              onClick={() => {
                soundService.playOpenSection();
                onChangeSpinTheme('VAN_DER_SAR_BOX');
              }}
              className={`relative min-w-[165px] lg:min-w-0 w-full h-19 sm:h-20 px-3 py-2 text-left flex items-center justify-between transition-all cursor-pointer border-2 shrink-0 overflow-hidden group ${
                isVanDerSarBox
                  ? 'border-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.5)]'
                  : 'border-emerald-400/60 hover:border-yellow-300/80 opacity-95 hover:opacity-100'
              }`}
              title="Box Ginga · Garrincha 106 OVR"
            >
              <img
                src="/assets/aistudio/entrance_box_ch_a_ghi_t_n_795966d4.png"
                alt="Box Ginga Entrance"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none select-none"
              />
              <div
                className={`absolute inset-0 pointer-events-none ${
                  isVanDerSarBox
                    ? 'bg-gradient-to-r from-black/85 via-black/50 to-emerald-950/35'
                    : 'bg-gradient-to-r from-black/88 via-black/55 to-black/25'
                }`}
              />
              <span className="relative z-10 flex flex-col justify-between h-full pr-1">
                <span className="inline-block w-fit px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                  BOX GINGA · 12 LƯỢT
                </span>
                <span className="font-cruyff font-black text-xs sm:text-sm uppercase tracking-wide text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  GARRINCHA 106 OVR
                </span>
              </span>
            </button>
          )}

          {sidebarPools.map((pool) => {
            const active = spinTheme === pool.id;
            return (
              <button
                key={pool.id}
                type="button"
                onClick={() => {
                  soundService.playTabSwitch();
                  onChangeSpinTheme(pool.id);
                }}
                className={`relative min-w-[165px] lg:min-w-0 w-full h-19 sm:h-20 px-3 py-2 text-left flex items-center justify-between transition-all cursor-pointer border-2 ${
                  active
                    ? 'bg-gradient-to-r from-[#0E337D] via-[#15459E] to-[#0D2763] border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.55)]'
                    : 'bg-[#091840]/85 hover:bg-[#0E245C] border-white/15 opacity-85 hover:opacity-100'
                }`}
              >
                {pool.badge && (
                  <span className="absolute -top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md">
                    {pool.badge}
                  </span>
                )}

                <div className="flex flex-col justify-between h-full pr-1">
                  <span
                    className={`font-cruyff font-black text-xs sm:text-sm uppercase tracking-wide leading-tight ${
                      active ? 'text-white' : 'text-amber-200/90'
                    }`}
                  >
                    {pool.shortTitle}
                  </span>
                  <span
                    className={`inline-block w-fit px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      active
                        ? 'bg-[#F3E3B4] text-slate-950'
                        : 'bg-black/45 text-amber-200/80 border border-white/15'
                    }`}
                  >
                    {pool.tag}
                  </span>
                </div>

                {pool.frameThumb ? (
                  <img
                    src={pool.frameThumb}
                    alt={pool.shortTitle}
                    className="w-11 h-14 object-contain shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]"
                  />
                ) : null}
              </button>
            );
          })}
        </aside>

        {/* RIGHT MAIN AREA: VAN DER SAR SIGNATURE BOX OR 5 TALL PLAYER SHOWCASE PANELS */}
        {isVanDerSarBox && user && onUpdateUser ? (
          <VanDerSarBoxSection
            user={user}
            onUpdateUser={onUpdateUser}
            onOpenShop={onOpenShop}
          />
        ) : (
          <div className="flex-1 flex flex-col justify-between min-w-0 gap-2.5">
            {/* Header Row: Draft Title + Info (Odds) + Entrance Banner to Van Der Sar Box */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2.5">
                  {isJuventus && (
                    <img
                      src={CHAMPIONS_JUVENTUS_ASSETS.logo}
                      alt="Champions Draft Logo"
                      className="h-8 sm:h-10 w-auto object-contain shrink-0"
                    />
                  )}
                  <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-white tracking-wide">
                    {activePoolMeta.headerTitle}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onOpenOdds(spinTheme);
                    }}
                    className="w-7 h-7 rounded-full border-2 border-white/75 hover:border-yellow-300 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    title="Xem bảng tỷ lệ chi tiết"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-cyan-200 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{activePoolMeta.endsIn}</span>
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="font-mono text-amber-200 tabular-nums flex items-center gap-1.5">
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="Vé Quay"
                      className="w-4 h-4 object-contain"
                    />
                    <span>Vé hiện có:</span>{' '}
                    <strong className={isGinga ? 'text-emerald-300' : 'text-yellow-300'}>
                      {isGinga
                        ? ticketsCount
                        : isLibertadores
                        ? user?.libertadoresTickets ?? ticketsCount
                        : isFutureStars
                        ? totalFutureStarsSpinTickets
                        : ticketsCount}
                    </strong>
                    {isGinga && (
                      <span className="ml-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[10px] font-cruyff font-bold">
                        Dùng Vé Quay bình thường
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Entrance Banner for Box Ginga (Garrincha 106 OVR) */}
              {user && onUpdateUser && (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenSection();
                    onChangeSpinTheme('VAN_DER_SAR_BOX');
                  }}
                  className="relative px-4 py-2 min-w-[220px] sm:min-w-[250px] h-14 border-2 border-yellow-300/85 hover:border-yellow-200 cursor-pointer shrink-0 flex items-center justify-between transition-transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  title="Mở Box Ginga · Garrincha 106 OVR"
                >
                  <img
                    src="/assets/aistudio/entrance_box_ch_a_ghi_t_n_795966d4.png"
                    alt="Box Ginga Garrincha 106"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/55 to-transparent pointer-events-none" />
                  <div className="relative z-10 text-left leading-tight">
                    <div className="text-[10px] font-black uppercase text-yellow-300 tracking-wider drop-shadow">
                      BOX GINGA · 12 LƯỢT
                    </div>
                    <div className="text-xs sm:text-sm font-black uppercase text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                      GARRINCHA 106 OVR
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* 5 TALL VERTICAL PLAYER SHOWCASE PANELS — 160% BACKDROP PORTRAIT & 160% PLAYER CARD */}
            <div className="relative flex-1 min-h-[345px] sm:min-h-[395px] flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-1">
              {showcasePlayers.map((player) => {
                if (player.frameIsComplete) {
                  return (
                    <div
                      key={player.id}
                      onClick={() => {
                        soundService.playClick();
                        onOpenOdds(spinTheme);
                      }}
                      className={`relative flex-1 min-w-[162px] sm:min-w-[182px] rounded-t-lg border-t border-x hover:border-yellow-300/80 overflow-hidden flex items-center justify-center p-3 cursor-pointer group transition-all ${
                        isJuventus
                          ? 'bg-gradient-to-b from-zinc-900/95 via-neutral-950/90 to-transparent border-amber-400/45'
                          : isGingaW1B
                          ? 'bg-gradient-to-b from-[#042414]/95 via-[#02160c]/85 to-transparent border-emerald-400/45'
                          : 'bg-gradient-to-b from-[#2b060a]/95 via-[#180406]/85 to-transparent border-red-400/35'
                      }`}
                    >
                      <div className="relative z-10 group-hover:scale-105 transition-transform">
                        <FCCard player={player} size="draft" showStats={false} />
                      </div>
                    </div>
                  );
                }

                const nameParts = player.name.trim().split(' ');
                const lastName = nameParts[nameParts.length - 1] || player.name;
                const firstName =
                  nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : player.club;

                return (
                  <div
                    key={player.id}
                    onClick={() => {
                      soundService.playClick();
                      onOpenOdds(spinTheme);
                    }}
                    className="relative flex-1 min-w-[162px] sm:min-w-[182px] rounded-t-lg bg-gradient-to-b from-[#09152E]/95 via-[#0E224D]/85 to-transparent border-t border-x border-cyan-200/30 hover:border-yellow-300/80 overflow-hidden flex flex-col justify-between p-3 cursor-pointer group transition-all"
                  >
                    {/* 160% Enlarged Action Portrait Backdrop (230x282 / sm:282x333) */}
                    <img
                      src={resolvePortrait(player)}
                      alt={player.name}
                      className="absolute -right-10 sm:-right-12 top-2 w-[230px] sm:w-[282px] h-[282px] sm:h-[333px] max-w-none object-contain opacity-90 group-hover:scale-105 transition-transform pointer-events-none select-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.88)]"
                      onError={(e) => {
                        e.currentTarget.src =
                          '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
                      }}
                    />

                    {/* Top-Left Name & Giant Gold OVR */}
                    <div className="relative z-10 pointer-events-none">
                      <div className="font-cruyff font-black text-xs sm:text-sm uppercase text-white tracking-wide leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                        {lastName}
                      </div>
                      <div className="text-[9px] uppercase text-slate-300 font-bold tracking-wider truncate max-w-[95px]">
                        {firstName}
                      </div>
                      <div className="mt-1 font-cruyff font-black text-4xl sm:text-5xl leading-none text-[#F5D78E] tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                        {player.ovr}
                      </div>
                    </div>

                    {/* Bottom Full Rendered FCCard at 160% Size (size="draft" = 134px / sm:154px) */}
                    <div className="relative z-10 mt-auto pt-4 flex items-end justify-start">
                      <FCCard player={player} size="draft" showStats={false} />
                    </div>
                  </div>
                );
              })}

              {/* "MORE / XEM THÊM" PILL BUTTON OVERLAY AT BOTTOM RIGHT OF SHOWCASE */}
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  if (onOpenAlbum) onOpenAlbum();
                  else onOpenOdds(spinTheme);
                }}
                className="absolute right-3 bottom-4 z-30 px-3.5 py-1.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-white/50 text-white font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xl cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-cyan-300" />
                <span>XEM THÊM</span>
              </button>
            </div>

            {/* POOL B & POOL A GUARANTEE BARS + 20 / 250 PITY MILESTONES + 10% TRADEABLE NOTE */}
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 bg-[#07143A]/90 border border-fuchsia-400/50 px-2.5 py-1">
                  <span className="text-fuchsia-300 font-black uppercase">Mốc 20 Vé:</span>
                  <strong className="font-mono text-white tabular-nums">
                    {(user?.ticketsOpenedCount ?? 0) % 20}/20
                  </strong>
                  <span className="text-yellow-300 font-bold">→ Tặng 1 Pool B</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#07143A]/90 border border-amber-400/55 px-2.5 py-1">
                  <span className="text-amber-300 font-black uppercase">Mốc 250 Vé:</span>
                  <strong className="font-mono text-white tabular-nums">
                    {(user?.ticketsOpenedCount ?? 0) % 250}/250
                  </strong>
                  <span className="text-yellow-300 font-bold">→ Tặng 1 Pool A</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-950/75 border border-emerald-400/45 px-2.5 py-1 text-emerald-200 font-bold">
                  <span>Tỷ lệ thẻ Giao Dịch Được:</span>
                  <strong className="font-mono text-emerald-300">10%</strong>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 ml-auto">
                <div className="flex items-center gap-2 bg-[#07143A]/90 border border-fuchsia-400/40 px-3 py-1 text-xs">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white font-black text-[10px] uppercase">
                    POOL B
                  </span>
                  <span className="text-slate-200 font-semibold">Nhóm Tinh Anh:</span>
                  <strong className="font-mono text-yellow-300">{activePoolMeta.poolBNote}</strong>
                </div>

                <div className="flex items-center gap-2 bg-[#07143A]/90 border border-amber-400/40 px-3 py-1 text-xs">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase">
                    POOL A
                  </span>
                  <span className="text-slate-200 font-semibold">Nhóm Siêu Sao:</span>
                  <strong className="font-mono text-yellow-300">{activePoolMeta.poolANote}</strong>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR: LEFT CIRCULAR EXCHANGE/STORE + RIGHT CHAMPAGNE GOLD 1x / 10x BUTTONS */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
              {/* Left Circular Shortcut Buttons: TRAO ĐỔI & CỬA HÀNG */}
              <div className="flex items-center gap-4">
                {onOpenExchange && (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onOpenExchange();
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-950/90 group-hover:bg-slate-900 border-2 border-cyan-300/60 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
                      <ArrowLeftRight className="w-5 h-5 text-cyan-200" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-100">
                      TRAO ĐỔI
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    onOpenShop();
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-950/90 group-hover:bg-slate-900 border-2 border-cyan-300/60 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
                    <ShoppingCart className="w-5 h-5 text-cyan-200" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-100">
                    CỬA HÀNG
                  </span>
                </button>
              </div>

              {/* Right Champagne-Gold Pill Spin Buttons: 1 VÉ & 10 VÉ */}
              <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-initial justify-end">
                <button
                  type="button"
                  onClick={() => onSpin(1, spinTheme)}
                  style={
                    isJuventus
                      ? {
                          backgroundImage: `url(${CHAMPIONS_JUVENTUS_ASSETS.btnBg})`,
                          backgroundSize: '100% 100%',
                        }
                      : undefined
                  }
                  className={`min-w-[190px] sm:min-w-[230px] h-13 px-5 rounded-full hover:brightness-105 text-slate-950 border border-white/70 shadow-[0_6px_22px_rgba(235,211,148,0.35)] flex items-center justify-between font-cruyff font-black text-sm sm:text-base uppercase tracking-wider cursor-pointer transition-transform active:scale-95 ${
                    isJuventus ? 'bg-amber-300' : 'bg-gradient-to-r from-[#F6E8BE] via-[#EBD394] to-[#DEC070]'
                  }`}
                >
                  <span className="flex-1 text-center">MỞ 1 VÉ</span>
                  <span className="h-6 w-[1px] bg-slate-950/25 mx-3" />
                  <span className="flex items-center gap-1.5 font-mono font-black tabular-nums">
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="1 Vé"
                      className="w-5 h-5 object-contain"
                    />
                    <span>1</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSpin(10, spinTheme)}
                  style={
                    isJuventus
                      ? {
                          backgroundImage: `url(${CHAMPIONS_JUVENTUS_ASSETS.btnBg})`,
                          backgroundSize: '100% 100%',
                        }
                      : undefined
                  }
                  className={`min-w-[195px] sm:min-w-[240px] h-13 px-5 rounded-full hover:brightness-105 text-slate-950 border border-white/70 shadow-[0_6px_22px_rgba(235,211,148,0.45)] flex items-center justify-between font-cruyff font-black text-sm sm:text-base uppercase tracking-wider cursor-pointer transition-transform active:scale-95 ${
                    isJuventus ? 'bg-amber-300' : 'bg-gradient-to-r from-[#F6E8BE] via-[#EBD394] to-[#DEC070]'
                  }`}
                >
                  <span className="flex-1 text-center">MỞ 10 VÉ</span>
                  <span className="h-6 w-[1px] bg-slate-950/25 mx-3" />
                  <span className="flex items-center gap-1.5 font-mono font-black tabular-nums">
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="10 Vé"
                      className="w-5 h-5 object-contain"
                    />
                    <span>10</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (user && onClose) {
    return (
      <div className="fixed inset-0 z-40 bg-[#04091E] flex flex-col overflow-hidden select-none font-cruyff">
        <TopSectionHeader
          title="VÉ QUAY & BOX GINGA"
          subtitle="Box Ginga (Garrincha 106) · Champions: Juventus · Bundesliga · Ginga 26 · Libertadores"
          user={user}
          onBack={onClose}
          backLabel="Quay lại"
          onGoHome={onGoHome || onClose}
          onClickGems={onOpenShop}
        />
        {content}
      </div>
    );
  }

  return content;
};
