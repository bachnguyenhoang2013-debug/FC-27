import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, Plus, RotateCcw, Eye, ArrowRight } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  classicsIconsPlayers,
  totyFeaturedPlayers,
  futureStarsPlayers,
  euro2024Players,
  laligaPlayers,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
} from '../data/mockData';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';
import { resolvePlayerWithUtotyUpgrade } from '../utils/utotyUpgrade';

const REQUIRED_SLOT_COUNT = 6;
const MIN_FODDER_OVR = 90;

interface IconsChroniclesSectionProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onGoToShop?: () => void;
  onGoToTickets?: () => void;
  onShowToast?: (text: string, tone?: 'success' | 'error') => void;
}

export const IconsChroniclesSection: React.FC<IconsChroniclesSectionProps> = ({
  user,
  onUpdateUser,
  onGoToShop,
  onGoToTickets,
  onShowToast,
}) => {
  const [slots, setSlots] = useState<Array<string | null>>(() =>
    Array(REQUIRED_SLOT_COUNT).fill(null)
  );
  // null = random 1 of 5 (prioritizing unowned Classics Icons); string = specific targeted Classics Icon ID
  const [targetLegendId, setTargetLegendId] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<PlayerCard | null>(null);
  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(null);
  const [localToast, setLocalToast] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  const notify = (text: string, tone: 'success' | 'error' = 'success') => {
    if (onShowToast) {
      onShowToast(text, tone);
    } else {
      setLocalToast({ text, tone });
      setTimeout(() => setLocalToast(null), 2800);
    }
  };

  const ownedSet = useMemo(
    () => new Set(user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS),
    [user.ownedPlayerIds]
  );

  const starterSet = useMemo(
    () =>
      new Set(
        user.starterIds?.length === 11 ? user.starterIds : STARTER_STARTER_IDS
      ),
    [user.starterIds]
  );

  const classicsIdSet = useMemo(
    () => new Set(classicsIconsPlayers.map((p) => p.id)),
    []
  );

  const ownedClassicsCount = useMemo(
    () => classicsIconsPlayers.filter((p) => ownedSet.has(p.id)).length,
    [ownedSet]
  );

  // Eligible 90+ OVR reserve cards (excludes active 11-man Starting XI, Box Van Der Sar, and Classics 95 Icons)
  const eligibleReserve90Plus = useMemo(() => {
    const seen = new Set<string>();
    const catalog = [
      ...totyFeaturedPlayers,
      ...futureStarsPlayers,
      ...euro2024Players,
      ...laligaPlayers,
    ];
    const result: PlayerCard[] = [];
    for (const raw of catalog) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      if (
        raw.id === 'box_sig_van_der_sar_105' ||
        raw.id === 'box_ginga_garrincha_106' ||
        raw.isUntradeableOnly
      )
        continue;
      if (classicsIdSet.has(raw.id)) continue;
      if (!ownedSet.has(raw.id)) continue;
      if (starterSet.has(raw.id)) continue;
      const resolved = resolvePlayerWithUtotyUpgrade(raw, user.utotyUpgradedIds);
      if (resolved.ovr >= MIN_FODDER_OVR) {
        result.push(resolved);
      }
    }
    return result.sort((a, b) => a.ovr - b.ovr || a.name.localeCompare(b.name));
  }, [ownedSet, starterSet, classicsIdSet, user.utotyUpgradedIds]);

  const eligibleMap = useMemo(
    () => new Map(eligibleReserve90Plus.map((c) => [c.id, c])),
    [eligibleReserve90Plus]
  );

  // Sanitize slots whenever inventory updates
  useEffect(() => {
    setSlots((prev) => {
      const used = new Set<string>();
      return prev.map((id) => {
        if (!id || used.has(id) || !eligibleMap.has(id)) return null;
        used.add(id);
        return id;
      });
    });
  }, [eligibleMap]);

  const filledCount = useMemo(() => slots.filter(Boolean).length, [slots]);
  const isExchangeReady = filledCount === REQUIRED_SLOT_COUNT;

  const selectedTargetCard = useMemo(
    () =>
      targetLegendId
        ? classicsIconsPlayers.find((p) => p.id === targetLegendId) || null
        : null,
    [targetLegendId]
  );

  const handleToggleFodder = (card: PlayerCard) => {
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
          'Đã điền đủ 6/6 ô cầu thủ 90+! Bấm vào một ô trên bàn trao đổi nếu muốn đổi thẻ khác.',
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
    setSlots(Array(REQUIRED_SLOT_COUNT).fill(null));
  };

  const handleAutoFill = () => {
    soundService.playClick();
    const picked = eligibleReserve90Plus.slice(0, REQUIRED_SLOT_COUNT);
    const nextSlots: Array<string | null> = Array.from(
      { length: REQUIRED_SLOT_COUNT },
      (_, idx) => picked[idx]?.id ?? null
    );
    setSlots(nextSlots);
    const count = nextSlots.filter(Boolean).length;
    if (count === REQUIRED_SLOT_COUNT) {
      notify('Đã tự động điền đủ 6 cầu thủ dự bị OVR 90+ (ưu tiên OVR thấp nhất)!');
    } else {
      notify(
        `Đã điền ${count}/6 ô. Bạn cần thêm ${REQUIRED_SLOT_COUNT - count} cầu thủ dự bị OVR 90+ để hoàn tất trao đổi!`,
        'error'
      );
    }
  };

  const handleConfirmExchange = () => {
    if (!isExchangeReady) {
      soundService.playClick();
      notify('Vui lòng chọn đủ 6 cầu thủ dự bị OVR 90+ vào các ô trao đổi!', 'error');
      return;
    }

    const sacrificedIds = new Set(slots.filter((id): id is string => Boolean(id)));
    if (sacrificedIds.size < REQUIRED_SLOT_COUNT) {
      notify('Số lượng cầu thủ trao đổi chưa đủ 6 thẻ hợp lệ!', 'error');
      return;
    }

    // Determine awarded Classics 95 OVR Icon
    let wonLegend: PlayerCard;
    if (selectedTargetCard) {
      wonLegend = selectedTargetCard;
    } else {
      const unownedPool = classicsIconsPlayers.filter((p) => !ownedSet.has(p.id));
      const drawPool = unownedPool.length > 0 ? unownedPool : classicsIconsPlayers;
      wonLegend =
        drawPool[Math.floor(Math.random() * drawPool.length)] ||
        classicsIconsPlayers[0];
    }

    const currentOwned = user.ownedPlayerIds?.length
      ? user.ownedPlayerIds
      : STARTER_OWNED_IDS;
    const nextOwned = currentOwned.filter((id) => !sacrificedIds.has(id));
    if (!nextOwned.includes(wonLegend.id)) {
      nextOwned.push(wonLegend.id);
    }

    const nextBench = (user.benchIds ?? []).filter((id) => !sacrificedIds.has(id));
    const nextUpgraded = (user.utotyUpgradedIds ?? []).filter(
      (id) => !sacrificedIds.has(id)
    );

    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.52 } });
    } catch {
      // ignore
    }

    onUpdateUser({
      ownedPlayerIds: nextOwned,
      benchIds: nextBench,
      utotyUpgradedIds: nextUpgraded,
    });

    setSlots(Array(REQUIRED_SLOT_COUNT).fill(null));
    setWalkoutRewardCard(wonLegend);
    notify(
      `Trao đổi Biên Niên Sử thành công! Bạn nhận được Huyền Thoại ${wonLegend.name} (95 OVR · Classics)!`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-cruyff">
      {localToast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 border font-bold text-sm rounded-none ${
            localToast.tone === 'success'
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-rose-950 border-rose-400 text-rose-200'
          }`}
        >
          {localToast.text}
        </div>
      )}

      {/* 1. HERO BANNER & 5 CLASSICS 95 OVR LEGENDS SHOWCASE */}
      <section className="relative bg-slate-950 border-2 border-teal-400/75 p-4 sm:p-6 overflow-hidden shadow-[0_0_36px_rgba(45,212,191,0.18)]">
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(circle at 18% 20%, rgba(45,212,191,0.35), transparent 52%), radial-gradient(circle at 85% 80%, rgba(250,204,21,0.28), transparent 55%)',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/khung_th__classics_6d23269c.png"
                alt="Classics Frame"
                className="w-14 h-14 object-contain drop-shadow-[0_0_14px_rgba(45,212,191,0.6)]"
              />
              <img
                src="/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png"
                alt="Icons"
                className="absolute -bottom-1 -right-1 w-6 h-6 object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-teal-300">
                Biên Niên Sử Icons · Mùa Thẻ Classics 95 OVR
              </div>
              <h2 className="font-black text-xl sm:text-2xl text-white uppercase italic tracking-wide mt-0.5">
                TRAO ĐỔI 6 CẦU THỦ 90+ NHẬN 1 TRONG 5 HUYỀN THOẠI CLASSICS
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Bộ sưu tập Classics 95 OVR: Andrey Arshavin · Dani Alves · Mesut Özil · Dida · Arjen Robben · Đã sở hữu {ownedClassicsCount}/5
              </p>
            </div>
          </div>

          {/* Draw Mode Selector: Random 1-of-5 vs Target Legend */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setTargetLegendId(null);
              }}
              className={`py-2 px-3.5 text-xs font-black uppercase tracking-wider border transition-colors cursor-pointer rounded-none ${
                targetLegendId === null
                  ? 'bg-teal-400 text-slate-950 border-white shadow-[0_0_18px_rgba(45,212,191,0.45)]'
                  : 'bg-slate-900/90 text-teal-200 border-teal-400/50 hover:bg-slate-800'
              }`}
            >
              Ngẫu Nhiên 1 Trong 5 {targetLegendId === null ? '✓' : ''}
            </button>
            {selectedTargetCard && (
              <span className="text-xs text-yellow-300 font-bold uppercase tracking-wider px-2">
                Đang chọn nhận: {selectedTargetCard.name} (95 OVR)
              </span>
            )}
          </div>
        </div>

        {/* 5 Classics Legends Showcase Row */}
        <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {classicsIconsPlayers.map((legend) => {
            const isOwned = ownedSet.has(legend.id);
            const isTargeted = targetLegendId === legend.id;
            return (
              <div
                key={legend.id}
                onClick={() => {
                  soundService.playClick();
                  setTargetLegendId((prev) => (prev === legend.id ? null : legend.id));
                }}
                className={`group relative flex flex-col items-center p-3 border transition-all cursor-pointer ${
                  isTargeted
                    ? 'bg-teal-950/60 border-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.3)]'
                    : 'bg-slate-900/75 border-white/15 hover:border-teal-300/80 hover:bg-slate-900'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  <span>
                    {legend.position} · {legend.nation}
                  </span>
                  <span className={isOwned ? 'text-emerald-300' : 'text-amber-300'}>
                    {isOwned ? 'Đã có' : '95 OVR'}
                  </span>
                </div>

                <FCCard player={legend} size="sm" showStats={false} />

                <div className="mt-2 text-center w-full">
                  <div className="font-black text-sm text-white uppercase italic truncate">
                    {legend.name}
                  </div>
                  <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                    PAC {legend.pac} · SHO {legend.sho} · PAS {legend.pas} · DRI {legend.dri}
                  </div>
                </div>

                <div className="mt-2.5 w-full grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playClick();
                      setInspectedCard(legend);
                    }}
                    className="py-1.5 px-2 bg-black/60 hover:bg-white/10 border border-white/20 text-[10px] font-bold uppercase text-slate-200 flex items-center justify-center gap-1 cursor-pointer rounded-none"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Chi tiết</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playClick();
                      setTargetLegendId((prev) => (prev === legend.id ? null : legend.id));
                    }}
                    className={`py-1.5 px-2 border text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer rounded-none ${
                      isTargeted
                        ? 'bg-yellow-400 text-slate-950 border-yellow-200'
                        : 'bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 border-teal-400/50'
                    }`}
                  >
                    {isTargeted ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Đã chọn</span>
                      </>
                    ) : (
                      <span>Chọn thẻ</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. 6-SLOT 90+ OVR EXCHANGE WORKBENCH */}
      <section className="bg-slate-950 border-2 border-yellow-400/75 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-white/15">
          <div>
            <h3 className="font-black text-lg sm:text-xl text-yellow-300 uppercase italic tracking-wide">
              BÀN TRAO ĐỔI BIÊN NIÊN SỬ · YÊU CẦU 6 CẦU THỦ OVR 90+
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Đã điền {filledCount}/{REQUIRED_SLOT_COUNT} cầu thủ OVR 90+ · 11 cầu thủ Đội Hình Chính được khóa bảo vệ an toàn · Kho dự bị khả dụng: {eligibleReserve90Plus.length} thẻ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFill}
              className="py-2 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-colors rounded-none"
            >
              Tự Động Điền (6 Thẻ 90+)
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

        {/* 6 Fodder Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {slots.map((cardId, idx) => {
            const slottedCard = cardId ? eligibleMap.get(cardId) || null : null;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (slottedCard) {
                    handleRemoveSlot(idx);
                  }
                }}
                className={`min-h-[168px] p-2.5 border-2 flex flex-col items-center justify-between transition-all ${
                  slottedCard
                    ? 'bg-emerald-950/35 border-emerald-400 cursor-pointer hover:bg-rose-950/35 hover:border-rose-400'
                    : 'bg-slate-900/65 border-dashed border-yellow-400/45'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Ô #{idx + 1}</span>
                  <span className={slottedCard ? 'text-emerald-300' : 'text-yellow-300'}>
                    {slottedCard ? `OVR ${slottedCard.ovr}` : '90+ OVR'}
                  </span>
                </div>

                {slottedCard ? (
                  <>
                    <div className="my-1">
                      <FCCard player={slottedCard} size="xs" showStats={false} />
                    </div>
                    <div className="w-full text-center">
                      <div className="text-xs font-black text-white uppercase truncate">
                        {slottedCard.name}
                      </div>
                      <div className="text-[10px] text-rose-300 font-bold uppercase mt-0.5">
                        Chạm để gỡ ra
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                    <div className="w-10 h-10 border border-yellow-400/50 bg-yellow-400/10 flex items-center justify-center text-yellow-300 mb-2">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Chọn cầu thủ
                    </span>
                    <span className="text-[10px] text-yellow-300/90 uppercase mt-0.5">
                      Yêu cầu 90+ OVR
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirm Exchange CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15">
          <div className="text-xs text-slate-300">
            {selectedTargetCard ? (
              <span>
                Phần thưởng khi hoàn tất:{' '}
                <strong className="text-yellow-300 uppercase">
                  {selectedTargetCard.name} (95 OVR · Classics Icon)
                </strong>
              </span>
            ) : (
              <span>
                Phần thưởng khi hoàn tất:{' '}
                <strong className="text-teal-300 uppercase">
                  1 Trong 5 Huyền Thoại Classics 95 OVR (Arshavin, Dani Alves, Özil, Dida, Robben)
                </strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmExchange}
            disabled={!isExchangeReady}
            className={`w-full sm:w-auto py-3 px-6 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-none ${
              isExchangeReady
                ? 'bg-gradient-to-r from-teal-300 via-yellow-300 to-amber-400 hover:brightness-105 text-slate-950 border border-white shadow-[0_0_28px_rgba(45,212,191,0.5)] cursor-pointer active:scale-98'
                : 'bg-slate-800 text-slate-400 border border-white/15 cursor-not-allowed'
            }`}
          >
            <span>
              {selectedTargetCard
                ? `TRAO ĐỔI NHẬN ${selectedTargetCard.name.toUpperCase()} (${filledCount}/6)`
                : `TRAO ĐỔI NHẬN 1 TRONG 5 HUYỀN THOẠI (${filledCount}/6)`}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* 3. RESERVE 90+ OVR PLAYER PICKER */}
      <section className="bg-slate-950 border border-white/20 p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/15">
          <div>
            <h4 className="font-black text-base sm:text-lg text-white uppercase italic">
              KHO CẦU THỦ DỰ BỊ OVR 90+ KHẢ DỤNG ({eligibleReserve90Plus.length} THẺ)
            </h4>
            <p className="text-xs text-slate-400">
              Bấm vào thẻ cầu thủ bên dưới để thêm hoặc gỡ khỏi 6 ô trao đổi (sắp xếp từ OVR thấp đến cao)
            </p>
          </div>
        </div>

        {eligibleReserve90Plus.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Hiện chưa có cầu thủ dự bị OVR 90+ ngoài Đội Hình Chính để đưa vào bàn trao đổi.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {onGoToTickets && (
                <button
                  type="button"
                  onClick={onGoToTickets}
                  className="py-2 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                >
                  Mở Vé Quay Săn Cầu Thủ 90+
                </button>
              )}
              {onGoToShop && (
                <button
                  type="button"
                  onClick={onGoToShop}
                  className="py-2 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                >
                  Vào Cửa Hàng Mở Gói 90–100
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {eligibleReserve90Plus.map((card) => {
              const slotIdx = slots.indexOf(card.id);
              const isSelected = slotIdx !== -1;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleToggleFodder(card)}
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
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* INSPECTED CLASSICS LEGEND STATS MODAL */}
      {inspectedCard && (
        <div
          onClick={() => setInspectedCard(null)}
          className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-950 border-2 border-teal-400 p-5 flex flex-col items-center gap-3 text-center rounded-none shadow-[0_0_45px_rgba(45,212,191,0.35)]"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-teal-300">
              Biên Niên Sử Icons · Mùa Thẻ Classics 95 OVR
            </div>
            <FCCard player={inspectedCard} size="hero" showStats={true} />
            <div className="font-black text-xl text-white uppercase italic">
              {inspectedCard.fullName || inspectedCard.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {inspectedCard.ovr} · Vị trí {inspectedCard.position} · Quốc tịch {inspectedCard.nation} · Kỹ thuật {inspectedCard.skillMoves}★ · Chân không thuận {inspectedCard.weakFoot}★
            </div>
            <div className="w-full grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setTargetLegendId(inspectedCard.id);
                  setInspectedCard(null);
                }}
                className="py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
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

      {/* WALKOUT REVEAL MODAL ON EXCHANGE COMPLETION */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packName={`BIÊN NIÊN SỬ ICONS · ${walkoutRewardCard.name} (95 OVR CLASSICS)`}
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
