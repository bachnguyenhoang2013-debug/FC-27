import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Check, Eye, Lock, Plus, RotateCcw, ShieldAlert } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  ultimateExchangeIconsPlayers,
  totyFeaturedPlayers,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
} from '../data/mockData';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';
import { resolvePlayerWithUtotyUpgrade } from '../utils/utotyUpgrade';

const REQUIRED_SLOTS = 5;
const MIN_EXCHANGE_OVR = 101;

interface UltimateIconsExchangeSectionProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onGoToShop?: () => void;
  onGoToTickets?: () => void;
}

export const UltimateIconsExchangeSection: React.FC<
  UltimateIconsExchangeSectionProps
> = ({ user, onUpdateUser, onGoToShop, onGoToTickets }) => {
  const ownedSet = useMemo(
    () =>
      new Set(
        user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS
      ),
    [user.ownedPlayerIds]
  );

  const starterSet = useMemo(
    () =>
      new Set(
        user.starterIds?.length === 11 ? user.starterIds : STARTER_STARTER_IDS
      ),
    [user.starterIds]
  );

  const tradeableSet = useMemo(
    () => new Set(user.tradeablePlayerIds ?? []),
    [user.tradeablePlayerIds]
  );

  const ultimateIdSet = useMemo(
    () => new Set(ultimateExchangeIconsPlayers.map((p) => p.id)),
    []
  );

  // Default target to first unowned Ultimate Icon, or first card if all owned
  const [selectedTargetId, setSelectedTargetId] = useState<string>(() => {
    const firstUnowned = ultimateExchangeIconsPlayers.find(
      (p) => !ownedSet.has(p.id)
    );
    return (
      firstUnowned?.id ||
      ultimateExchangeIconsPlayers[0]?.id ||
      'ultimate_icon_david_luiz_104'
    );
  });

  const selectedTargetCard = useMemo(
    () =>
      ultimateExchangeIconsPlayers.find((p) => p.id === selectedTargetId) ||
      ultimateExchangeIconsPlayers[0],
    [selectedTargetId]
  );

  const requiredSlots = REQUIRED_SLOTS;

  const [slots, setSlots] = useState<Array<string | null>>(() =>
    Array(requiredSlots).fill(null)
  );
  const [inspectedCard, setInspectedCard] = useState<PlayerCard | null>(null);
  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(
    null
  );
  const [toast, setToast] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  const notify = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3000);
  };

  // Count how many 101+ players are locked inside Starting XI
  const lockedStarterCards = useMemo(() => {
    const seen = new Set<string>();
    const list: PlayerCard[] = [];
    for (const raw of totyFeaturedPlayers) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      if (ultimateIdSet.has(raw.id)) continue;
      if (
        raw.id === 'box_sig_van_der_sar_105' ||
        raw.id === 'box_ginga_garrincha_106' ||
        raw.isUntradeableOnly
      )
        continue;
      if (!ownedSet.has(raw.id) || !starterSet.has(raw.id)) continue;
      const resolved = resolvePlayerWithUtotyUpgrade(raw, user.utotyUpgradedIds);
      if (resolved.ovr >= MIN_EXCHANGE_OVR) {
        list.push(resolved);
      }
    }
    return list;
  }, [ownedSet, starterSet, ultimateIdSet, user.utotyUpgradedIds]);

  // Eligible reserve/bench cards: ANY player OVR 101+ (5 slots)
  const eligibleCards = useMemo(() => {
    const seen = new Set<string>();
    const result: PlayerCard[] = [];
    for (const raw of totyFeaturedPlayers) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      if (ultimateIdSet.has(raw.id)) continue;
      if (
        raw.id === 'box_sig_van_der_sar_105' ||
        raw.id === 'box_ginga_garrincha_106' ||
        raw.isUntradeableOnly
      )
        continue;
      if (!ownedSet.has(raw.id)) continue;
      if (starterSet.has(raw.id)) continue;
      const resolved = resolvePlayerWithUtotyUpgrade(raw, user.utotyUpgradedIds);
      if (resolved.ovr >= MIN_EXCHANGE_OVR) {
        result.push(resolved);
      }
    }
    return result.sort((a, b) => a.ovr - b.ovr || a.name.localeCompare(b.name));
  }, [ownedSet, starterSet, ultimateIdSet, user.utotyUpgradedIds]);

  const eligibleMap = useMemo(
    () => new Map(eligibleCards.map((c) => [c.id, c])),
    [eligibleCards]
  );

  // Resize & sanitize slots when inventory changes
  useEffect(() => {
    setSlots((prev) => {
      const used = new Set<string>();
      const validKept: string[] = [];
      for (const id of prev) {
        if (id && !used.has(id) && eligibleMap.has(id)) {
          used.add(id);
          validKept.push(id);
          if (validKept.length >= requiredSlots) break;
        }
      }
      return Array.from(
        { length: requiredSlots },
        (_, idx) => validKept[idx] ?? null
      );
    });
  }, [eligibleMap, requiredSlots]);

  const isTargetAlreadyOwned = Boolean(
    selectedTargetCard && ownedSet.has(selectedTargetCard.id)
  );

  const ownedUltimateCount = useMemo(
    () =>
      ultimateExchangeIconsPlayers.filter((p) => ownedSet.has(p.id)).length,
    [ownedSet]
  );

  const filledCount = useMemo(() => slots.filter(Boolean).length, [slots]);
  const isExchangeReady =
    filledCount === requiredSlots && !isTargetAlreadyOwned;

  const requirementShortLabel = '5 Cầu Thủ 101+ OVR Bất Kì';

  const handleToggleCard = (card: PlayerCard) => {
    soundService.playClick();
    setSlots((prev) => {
      const existingIdx = prev.indexOf(card.id);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = null;
        return next;
      }
      const emptyIdx = prev.findIndex((id) => id === null);
      if (emptyIdx === -1) {
        notify(
          `Đã điền đủ ${requiredSlots}/${requiredSlots} ô (${requirementShortLabel})! Bấm vào một ô trên bàn trao đổi nếu muốn đổi thẻ khác.`,
          'error'
        );
        return prev;
      }
      const next = [...prev];
      next[emptyIdx] = card.id;
      return next;
    });
  };

  const handleRemoveSlot = (slotIdx: number) => {
    soundService.playClick();
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const handleClearSlots = () => {
    soundService.playClick();
    setSlots(Array(requiredSlots).fill(null));
  };

  const handleAutoFill = () => {
    soundService.playClick();
    const picked = eligibleCards.slice(0, requiredSlots);
    const nextSlots: Array<string | null> = Array.from(
      { length: requiredSlots },
      (_, idx) => picked[idx]?.id ?? null
    );
    setSlots(nextSlots);
    const count = nextSlots.filter(Boolean).length;
    if (count === requiredSlots) {
      notify(
        `Đã tự động điền đủ ${requiredSlots} thẻ (${requirementShortLabel}, ưu tiên OVR thấp nhất trước)!`
      );
    } else {
      notify(
        `Đã điền ${count}/${requiredSlots} ô. Bạn cần đủ ${requirementShortLabel} ngoài Đội Hình Chính để trao đổi!`,
        'error'
      );
    }
  };

  const handleConfirmUltimateExchange = () => {
    if (!selectedTargetCard) return;

    if (isTargetAlreadyOwned) {
      soundService.playClick();
      notify(
        `Bạn đã sở hữu ${selectedTargetCard.name} (${selectedTargetCard.ovr} OVR · Tối Thượng) trong Kho CLB! Hãy chọn Huyền Thoại Tối Thượng khác.`,
        'error'
      );
      return;
    }

    if (filledCount < requiredSlots) {
      soundService.playClick();
      notify(
        `Vui lòng chọn đủ ${requirementShortLabel} vào bàn trao đổi (${filledCount}/${requiredSlots})!`,
        'error'
      );
      return;
    }

    const sacrificedIds = new Set(
      slots.filter((id): id is string => Boolean(id))
    );
    if (sacrificedIds.size < requiredSlots) {
      notify(
        `Số lượng thẻ hợp lệ chưa đủ ${requiredSlots} (${requirementShortLabel})!`,
        'error'
      );
      return;
    }

    const wonCard: PlayerCard = {
      ...selectedTargetCard,
      isTradeable: false,
      isUntradeableOnly: true,
    };

    soundService.playPackOpenFanfare();
    try {
      confetti({
        particleCount: 150,
        spread: 115,
        origin: { y: 0.52 },
        colors: ['#FDE047', '#F59E0B', '#FFFFFF', '#10B981', '#38BDF8'],
      });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const curOwned = prev.ownedPlayerIds?.length
        ? prev.ownedPlayerIds
        : STARTER_OWNED_IDS;
      if (curOwned.includes(wonCard.id)) return {};
      const nextOwned = curOwned.filter((id) => !sacrificedIds.has(id));
      nextOwned.push(wonCard.id);

      const nextBench = (prev.benchIds ?? []).filter(
        (id) => !sacrificedIds.has(id)
      );
      const nextUpgraded = (prev.utotyUpgradedIds ?? []).filter(
        (id) => !sacrificedIds.has(id)
      );
      // Strictly untradeable: remove sacrificed cards from tradeablePlayerIds and NEVER add wonCard.id
      const nextTradeable = (prev.tradeablePlayerIds ?? []).filter(
        (id) => !sacrificedIds.has(id) && id !== wonCard.id
      );

      return {
        ownedPlayerIds: nextOwned,
        benchIds: nextBench,
        utotyUpgradedIds: nextUpgraded,
        tradeablePlayerIds: nextTradeable,
      };
    });

    setSlots(Array(requiredSlots).fill(null));
    setWalkoutRewardCard(wonCard);

    // Switch default target to next unowned Ultimate Icon if available
    const nextUnowned = ultimateExchangeIconsPlayers.find(
      (p) => p.id !== wonCard.id && !ownedSet.has(p.id)
    );
    if (nextUnowned) {
      setSelectedTargetId(nextUnowned.id);
    }

    notify(
      `Trao Đổi Tối Thượng thành công! Nhận ${wonCard.name} (${wonCard.ovr} OVR · Khung Riêng · Không Giao Dịch)!`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-cruyff">
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 border font-bold text-sm rounded-none ${
            toast.tone === 'success'
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-rose-950 border-rose-400 text-rose-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* 1. HERO SHOWCASE: 6 ULTIMATE ICONS (104 OVR & 106 HUGO SÁNCHEZ) WITH EXCLUSIVE CUSTOM FRAMES */}
      <section className="relative bg-slate-950 border-2 border-yellow-400/85 p-4 sm:p-6 overflow-hidden shadow-[0_0_42px_rgba(250,204,21,0.22)]">
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            background:
              'radial-gradient(circle at 16% 25%, rgba(16,185,129,0.28), transparent 50%), radial-gradient(circle at 50% 15%, rgba(59,130,246,0.28), transparent 52%), radial-gradient(circle at 86% 80%, rgba(250,204,21,0.32), transparent 55%)',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/khung_th__hugo_sanchez_106_ovr_21f92b85.png"
                alt="Khung Trao Đổi Tối Thượng"
                className="w-14 h-14 object-contain drop-shadow-[0_0_16px_rgba(250,204,21,0.65)]"
              />
              <img
                src="/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png"
                alt="Icons"
                className="absolute -bottom-1 -right-1 w-6 h-6 object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-300">
                  Biên Niên Sử Icons · Trao Đổi Tối Thượng
                </span>
                <span className="px-2 py-0.5 bg-rose-950/90 border border-rose-500/70 text-rose-200 text-[10px] font-black uppercase tracking-wider">
                  KHÔNG GIAO DỊCH
                </span>
              </div>
              <h2 className="font-black text-xl sm:text-2xl text-white uppercase italic tracking-wide mt-0.5">
                TRAO ĐỔI TỐI THƯỢNG · HUYỀN THOẠI 104 OVR (5 CẦU THỦ 101+ BẤT KÌ)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Bộ {ultimateExchangeIconsPlayers.length} Huyền Thoại Tối Thượng khung quốc kỳ độc quyền: David Luiz · Zidane · Al-Owairan · Touré · Cahill (104 OVR) · Yêu cầu 5 cầu thủ 101+ bất kì · Đã sở hữu {ownedUltimateCount}/{ultimateExchangeIconsPlayers.length}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
              Yêu cầu hiện tại: {requirementShortLabel}
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-yellow-300">
              Đang chọn đổi: {selectedTargetCard?.name} ({selectedTargetCard?.ovr} OVR ·{' '}
              {selectedTargetCard?.position})
            </span>
          </div>
        </div>

        {/* 5 Ultimate Cards Grid */}
        <div className="relative z-10 mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {ultimateExchangeIconsPlayers.map((legend) => {
            const isOwned = ownedSet.has(legend.id);
            const isSelected = selectedTargetId === legend.id;
            return (
              <div
                key={legend.id}
                onClick={() => {
                  soundService.playClick();
                  setSelectedTargetId(legend.id);
                }}
                className={`relative flex flex-col items-center p-3 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-950/55 via-slate-900/90 to-slate-950 border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.38)]'
                    : 'bg-slate-900/80 border-white/15 hover:border-yellow-400/75 hover:bg-slate-900'
                }`}
              >
                <div className="w-full flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider mb-2">
                  <span className="px-2 py-0.5 bg-amber-400/15 border border-amber-300/50 text-amber-200">
                    KHUNG RIÊNG · {legend.nation}
                  </span>
                  <span
                    className={
                      isOwned
                        ? 'px-2 py-0.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                        : 'px-2 py-0.5 bg-rose-950/90 border border-rose-500/60 text-rose-200'
                    }
                  >
                    {isOwned ? 'ĐÃ SỞ HỮU' : 'KHÔNG GIAO DỊCH'}
                  </span>
                </div>

                <FCCard player={legend} size="sm" showStats={false} />

                <div className="mt-3 text-center w-full">
                  <div className="font-black text-base text-white uppercase italic truncate">
                    {legend.name}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                    {legend.ovr} OVR · {legend.position} · Yêu cầu 5 Thẻ 101+
                  </div>
                </div>

                <div className="mt-2.5 w-full grid grid-cols-6 gap-1 bg-slate-950/90 border border-white/10 p-1.5 text-center tabular-nums">
                  <div>
                    <div className="text-[9px] text-slate-400">PAC</div>
                    <div className="font-black text-xs text-yellow-300">
                      {legend.pac}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">SHO</div>
                    <div className="font-black text-xs text-yellow-300">
                      {legend.sho}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">PAS</div>
                    <div className="font-black text-xs text-yellow-300">
                      {legend.pas}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">DRI</div>
                    <div className="font-black text-xs text-yellow-300">
                      {legend.dri}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">DEF</div>
                    <div className="font-black text-xs text-yellow-300">
                      {legend.def}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">PHY</div>
                    <div className="font-black text-xs text-yellow-300">
                      {legend.phy}
                    </div>
                  </div>
                </div>

                <div className="mt-3 w-full grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playClick();
                      setInspectedCard(legend);
                    }}
                    className="py-1.5 px-2 bg-black/70 hover:bg-white/10 border border-white/20 text-xs font-bold uppercase text-slate-200 flex items-center justify-center gap-1 cursor-pointer rounded-none"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi Tiết</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playClick();
                      setSelectedTargetId(legend.id);
                    }}
                    className={`py-1.5 px-2 border text-xs font-black uppercase flex items-center justify-center gap-1 cursor-pointer rounded-none ${
                      isSelected
                        ? 'bg-yellow-400 text-slate-950 border-white'
                        : 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border-amber-400/50'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đang Chọn</span>
                      </>
                    ) : (
                      <span>Chọn Đổi</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. DYNAMIC 10-SLOT OR 15-SLOT ULTIMATE EXCHANGE WORKBENCH */}
      <section className="bg-slate-950 border-2 border-amber-400/80 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-white/15">
          <div>
            <h3 className="font-black text-lg sm:text-xl text-yellow-300 uppercase italic tracking-wide">
              BÀN TRAO ĐỔI TỐI THƯỢNG · YÊU CẦU 5 CẦU THỦ 101+ OVR BẤT KÌ
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Đã điền {filledCount}/{requiredSlots} cầu thủ 101+ OVR · Chấp nhận MỌI vị trí và mùa thẻ từ 101 OVR trở lên ngoài Đội Hình Chính · Kho dự bị khả dụng: {eligibleCards.length} thẻ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFill}
              className="py-2 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-colors rounded-none"
            >
              Tự Động Điền (5 Cầu Thủ 101+)
            </button>
            {filledCount > 0 && (
              <button
                type="button"
                onClick={handleClearSlots}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-white/25 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer rounded-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm Trống</span>
              </button>
            )}
          </div>
        </div>

        {/* Workbench Layout: 10 or 15 Slots -> Selected Target Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {slots.map((cardId, idx) => {
              const slottedCard = cardId
                ? eligibleMap.get(cardId) || null
                : null;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (slottedCard) {
                      handleRemoveSlot(idx);
                    }
                  }}
                  className={`min-h-[146px] p-2 border-2 flex flex-col items-center justify-between transition-all ${
                    slottedCard
                      ? 'bg-emerald-950/35 border-emerald-400 cursor-pointer hover:bg-rose-950/35 hover:border-rose-400'
                      : 'bg-slate-900/70 border-dashed border-yellow-400/55'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-300">Ô #{idx + 1}</span>
                    <span
                      className={
                        slottedCard ? 'text-emerald-300' : 'text-yellow-300'
                      }
                    >
                      {slottedCard ? `OVR ${slottedCard.ovr}` : '101+ OVR'}
                    </span>
                  </div>

                  {slottedCard ? (
                    <>
                      <div className="my-1">
                        <FCCard
                          player={slottedCard}
                          size="xs"
                          showStats={false}
                        />
                      </div>
                      <div className="w-full text-center">
                        <div className="text-[11px] font-black text-white uppercase truncate">
                          {slottedCard.name}
                        </div>
                        <div className="text-[9px] text-rose-300 font-bold uppercase">
                          {slottedCard.position} · Chạm gỡ
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                      <div className="w-8 h-8 border border-yellow-400/60 bg-yellow-400/10 flex items-center justify-center text-yellow-300 mb-1.5">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase leading-tight">
                        Cầu Thủ 101+
                      </span>
                      <span className="text-[9px] text-yellow-300 uppercase mt-0.5">
                        Mọi mùa 101+
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1 flex items-center justify-center py-1">
            <div className="w-10 h-10 bg-yellow-400/20 border border-yellow-400 text-yellow-300 flex items-center justify-center">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Target Output Preview */}
          <div className="lg:col-span-3 bg-gradient-to-b from-amber-950/45 via-slate-900 to-slate-950 border-2 border-yellow-400 p-4 flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-2">
              <span className="text-yellow-300">PHẦN THƯỞNG NHẬN</span>
              <span className="text-rose-300">KHÔNG GIAO DỊCH</span>
            </div>
            {selectedTargetCard && (
              <>
                <FCCard
                  player={selectedTargetCard}
                  size="md"
                  showStats={false}
                />
                <div className="mt-2.5 font-black text-base text-white uppercase italic">
                  {selectedTargetCard.name} ({selectedTargetCard.ovr} OVR)
                </div>
                <div className="text-xs text-slate-300">
                  {selectedTargetCard.position} · {selectedTargetCard.nation} · Khung Riêng
                </div>
                <div className="mt-1.5 px-2.5 py-0.5 bg-yellow-400/15 border border-yellow-400/50 text-[10px] font-black text-yellow-200 uppercase">
                  Đã điền {filledCount}/{requiredSlots}
                </div>
              </>
            )}
          </div>
        </div>

        {lockedStarterCards.length > 0 && (
          <div className="p-3 bg-amber-950/40 border border-amber-400/50 flex items-center gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              Bạn đang có <strong>{lockedStarterCards.length}</strong> thẻ phù hợp (
              {lockedStarterCards.map((p) => `${p.name} ${p.ovr}`).join(', ')}) nằm trong{' '}
              <strong>11 Đá Chính</strong> nên được khóa bảo vệ. Nếu muốn dùng để trao đổi, hãy đưa xuống Dự Bị trong mục <strong>Đội Hình</strong>.
            </span>
          </div>
        )}

        {/* Confirm CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15">
          <div className="text-xs text-slate-300">
            {isTargetAlreadyOwned ? (
              <span className="text-emerald-300 font-bold uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Bạn đã sở hữu {selectedTargetCard?.name} ({selectedTargetCard?.ovr} OVR). Hãy chọn Huyền Thoại Tối Thượng khác ở phía trên!
              </span>
            ) : (
              <span>
                Hoàn tất trao đổi ({requirementShortLabel}) sẽ nhận ngay:{' '}
                <strong className="text-yellow-300 uppercase">
                  {selectedTargetCard?.name} ({selectedTargetCard?.ovr} OVR · {selectedTargetCard?.position} · Không Giao Dịch)
                </strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmUltimateExchange}
            disabled={!isExchangeReady}
            className={`w-full sm:w-auto py-3 px-6 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-none ${
              isExchangeReady
                ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 hover:brightness-105 text-slate-950 border border-white shadow-[0_0_28px_rgba(250,204,21,0.55)] cursor-pointer active:scale-98'
                : 'bg-slate-800 text-slate-400 border border-white/15 cursor-not-allowed'
            }`}
          >
            <span>
              {isTargetAlreadyOwned
                ? `ĐÃ SỞ HỮU ${selectedTargetCard?.name.toUpperCase()}`
                : `TRAO ĐỔI NHẬN ${selectedTargetCard?.name.toUpperCase()} (${filledCount}/${requiredSlots})`}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* 3. ELIGIBLE RESERVE PICKER */}
      <section className="bg-slate-950 border border-white/20 p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/15">
          <div>
            <h4 className="font-black text-base sm:text-lg text-white uppercase italic">
              KHO CẦU THỦ DỰ BỊ 101+ KHẢ DỤNG ({eligibleCards.length} THẺ)
            </h4>
            <p className="text-xs text-slate-400">
              Chọn 5 cầu thủ OVR 101+ bất kỳ bên dưới để đưa vào bàn Trao Đổi Tối Thượng
            </p>
          </div>
        </div>

        {eligibleCards.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Hiện chưa có cầu thủ OVR 101+ ngoài Đội Hình Chính để đưa vào bàn trao đổi.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {onGoToTickets && (
                <button
                  type="button"
                  onClick={onGoToTickets}
                  className="py-2 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                >
                  Quay Vé UTOTY / TOTY Icons 102–104
                </button>
              )}
              {onGoToShop && (
                <button
                  type="button"
                  onClick={onGoToShop}
                  className="py-2 px-4 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                >
                  Mở Gói CONMEBOL 102+ Tại Cửa Hàng
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {eligibleCards.map((card) => {
              const slotIdx = slots.indexOf(card.id);
              const isSelected = slotIdx !== -1;
              const isTrade = tradeableSet.has(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleToggleCard(card)}
                  className={`relative p-2 border flex flex-col items-center text-center transition-all cursor-pointer rounded-none ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.35)]'
                      : 'bg-slate-900/80 border-white/15 hover:border-yellow-300'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1 z-20 px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[9px] font-black uppercase">
                      Ô #{slotIdx + 1}
                    </span>
                  )}
                  <FCCard player={card} size="xs" showStats={false} />
                  <span className="mt-1.5 text-[11px] font-black text-white uppercase truncate w-full">
                    {card.name}
                  </span>
                  <span className="text-[10px] text-yellow-300 font-bold tabular-nums">
                    OVR {card.ovr} · {card.position}
                  </span>
                  <span
                    className={`mt-0.5 text-[9px] font-bold uppercase ${
                      isTrade ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {isTrade ? 'GD Được' : 'Không GD'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* INSPECTED ULTIMATE ICON MODAL */}
      {inspectedCard && (
        <div
          onClick={() => setInspectedCard(null)}
          className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-950 border-2 border-yellow-400 p-5 flex flex-col items-center gap-3 text-center rounded-none shadow-[0_0_45px_rgba(250,204,21,0.35)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-300">
                Trao Đổi Tối Thượng · Khung Riêng
              </span>
              <span className="px-2 py-0.5 bg-rose-950 border border-rose-500/70 text-rose-200 text-[10px] font-black uppercase">
                KHÔNG GIAO DỊCH
              </span>
            </div>
            <FCCard player={inspectedCard} size="hero" showStats={true} />
            <div className="font-black text-xl text-white uppercase italic">
              {inspectedCard.fullName || inspectedCard.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {inspectedCard.ovr} · Vị trí {inspectedCard.position} · Quốc tịch{' '}
              {inspectedCard.nation} · Kỹ thuật {inspectedCard.skillMoves}★ · Chân không thuận{' '}
              {inspectedCard.weakFoot}★
            </div>
            <div className="px-3 py-1 bg-amber-950/75 border border-yellow-400/60 text-[11px] font-black text-yellow-200 uppercase">
              Yêu cầu đổi: 5 Cầu Thủ 101+ OVR Bất Kì
            </div>
            <div className="w-full grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setSelectedTargetId(inspectedCard.id);
                  setInspectedCard(null);
                }}
                className="py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
              >
                Chọn Đổi Huyền Thoại Này
              </button>
              <button
                type="button"
                onClick={() => setInspectedCard(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer rounded-none"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALKOUT REVEAL MODAL ON ULTIMATE EXCHANGE COMPLETION */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`TRAO ĐỔI TỐI THƯỢNG · ${walkoutRewardCard.name} (${walkoutRewardCard.ovr} OVR · KHÔNG GIAO DỊCH)`}
          isTicketSpin={false}
          autoStartWalkout={true}
          skipResourceBonus={true}
          isIconChroniclesExchange={true}
          ticketsRemaining={user.tickets ?? 0}
          spinCount={1}
          onUseTicket={() => false}
          onClose={() => setWalkoutRewardCard(null)}
          onPlayerClaimed={() => setWalkoutRewardCard(null)}
        />
      )}
    </div>
  );
};
