import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  Eye,
  Lock,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
  Coins,
} from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  signatureArchivePlayers,
  totyFeaturedPlayers,
  kakaBallonDor106,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
} from '../data/mockData';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { soundService } from '../services/sound';
import { resolvePlayerWithUtotyUpgrade } from '../utils/utotyUpgrade';
import {
  addOwnedPlayerCopies,
  removeOwnedPlayerCopies,
} from '../utils/squadUtils';

const SIGNATURE_REQUIRED_SLOTS = 5;
const SIGNATURE_MIN_OVR = 103;
const SIGNATURE_TOKEN_COST = 1;
const KAKA_GINGA_REQUIRED_ID = 'ginga_kaka_106';
const KAKA_SHARD_COST = 1000;

interface SignatureArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  initialTab?: 'hub' | 'journey';
  embedded?: boolean;
}

export const SignatureArchiveModal: React.FC<SignatureArchiveModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  initialTab = 'hub',
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'journey'>(initialTab);
  const [inspectedCard, setInspectedCard] = useState<PlayerCard | null>(null);
  const [walkoutRewardCard, setWalkoutRewardCard] = useState<PlayerCard | null>(null);

  // Available 106 OVR signature exchange targets
  const exchangeTargetCards = useMemo(
    () => signatureArchivePlayers.filter((p) => p.ovr === 106),
    []
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    exchangeTargetCards[0]?.id || 'ultimate_icon_hugo_sanchez_106'
  );

  const selectedTargetCard = useMemo(
    () =>
      exchangeTargetCards.find((p) => p.id === selectedTargetId) ||
      exchangeTargetCards[0] ||
      signatureArchivePlayers[0],
    [exchangeTargetCards, selectedTargetId]
  );

  const isKakaBallonDorTarget = selectedTargetCard.id === kakaBallonDor106.id;

  const [toast, setToast] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  const notify = (text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3000);
  };

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

  const isSelectedTargetOwned = ownedSet.has(selectedTargetCard.id);
  const userSignatureTokens = user.signatureTokens ?? 0;
  const userTotyShards = user.totyShards ?? 0;
  const hasEnoughTokens = userSignatureTokens >= SIGNATURE_TOKEN_COST;
  const hasEnoughShardsForKaka = userTotyShards >= KAKA_SHARD_COST;

  // 5 slots for Signature exchange (generic 103+ targets)
  const [slots, setSlots] = useState<Array<string | null>>(() =>
    Array(SIGNATURE_REQUIRED_SLOTS).fill(null)
  );
  // Dedicated 1 slot for Kaká 106 Ginga when exchanging Kaká 106 Ballon d'Or
  const [kakaGingaSlotted, setKakaGingaSlotted] = useState<boolean>(false);

  const kakaGingaCard = useMemo(
    () => totyFeaturedPlayers.find((p) => p.id === KAKA_GINGA_REQUIRED_ID) || null,
    []
  );
  const isKakaGingaOwned = ownedSet.has(KAKA_GINGA_REQUIRED_ID);
  const isKakaGingaLockedInStarter =
    isKakaGingaOwned && starterSet.has(KAKA_GINGA_REQUIRED_ID);
  const isKakaGingaAvailableInBench =
    isKakaGingaOwned && !starterSet.has(KAKA_GINGA_REQUIRED_ID);
  const effectiveKakaGingaSlotted = kakaGingaSlotted && isKakaGingaAvailableInBench;

  // Count how many 103+ players are currently locked in Starting XI
  const lockedStarterCards = useMemo(() => {
    const seen = new Set<string>();
    const list: PlayerCard[] = [];
    for (const raw of totyFeaturedPlayers) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      if (raw.id === selectedTargetCard.id) continue;
      if (!ownedSet.has(raw.id) || !starterSet.has(raw.id)) continue;
      const resolved = resolvePlayerWithUtotyUpgrade(raw, user.utotyUpgradedIds);
      if (resolved.ovr >= SIGNATURE_MIN_OVR) {
        list.push(resolved);
      }
    }
    return list;
  }, [selectedTargetCard.id, ownedSet, starterSet, user.utotyUpgradedIds]);

  // Eligible reserve/bench cards: ANY card in inventory with OVR >= 103 not in Starting XI
  const eligibleCards = useMemo(() => {
    const seen = new Set<string>();
    const result: PlayerCard[] = [];
    for (const raw of totyFeaturedPlayers) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      if (raw.id === selectedTargetCard.id) continue;
      if (!ownedSet.has(raw.id)) continue;
      if (starterSet.has(raw.id)) continue;
      const resolved = resolvePlayerWithUtotyUpgrade(raw, user.utotyUpgradedIds);
      if (resolved.ovr >= SIGNATURE_MIN_OVR) {
        result.push(resolved);
      }
    }
    return result.sort((a, b) => a.ovr - b.ovr || a.name.localeCompare(b.name));
  }, [selectedTargetCard.id, ownedSet, starterSet, user.utotyUpgradedIds]);

  const eligibleMap = useMemo(
    () => new Map(eligibleCards.map((c) => [c.id, c])),
    [eligibleCards]
  );

  const filledCount = useMemo(() => slots.filter(Boolean).length, [slots]);

  const handleToggleCard = (card: PlayerCard) => {
    soundService.playClick();
    if (isKakaBallonDorTarget) {
      if (card.id !== KAKA_GINGA_REQUIRED_ID) return;
      setKakaGingaSlotted((prev) => !prev);
      return;
    }
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
          `Đã điền đủ ${SIGNATURE_REQUIRED_SLOTS}/${SIGNATURE_REQUIRED_SLOTS} ô (5 Cầu Thủ 103+ OVR)! Chạm vào một ô đã điền để đổi thẻ khác.`,
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
    if (isKakaBallonDorTarget) {
      setKakaGingaSlotted(false);
      return;
    }
    setSlots(Array(SIGNATURE_REQUIRED_SLOTS).fill(null));
  };

  const handleAutoFill = () => {
    soundService.playClick();
    if (isKakaBallonDorTarget) {
      if (isKakaGingaAvailableInBench) {
        setKakaGingaSlotted(true);
        notify('Đã điền thẻ 106 Kaká Ginga vào bàn trao đổi!');
      } else if (isKakaGingaLockedInStarter) {
        notify(
          'Kaká 106 Ginga đang thi đấu trong Đội Hình Chính! Hãy đưa xuống Dự Bị để sử dụng trao đổi.',
          'error'
        );
      } else {
        notify(
          'Bạn chưa sở hữu thẻ 106 Kaká Ginga trong Kho CLB!',
          'error'
        );
      }
      return;
    }

    const picked = eligibleCards.slice(0, SIGNATURE_REQUIRED_SLOTS);
    const nextSlots: Array<string | null> = Array.from(
      { length: SIGNATURE_REQUIRED_SLOTS },
      (_, idx) => picked[idx]?.id ?? null
    );
    setSlots(nextSlots);
    const count = nextSlots.filter(Boolean).length;
    if (count === SIGNATURE_REQUIRED_SLOTS) {
      notify(
        `Đã tự động điền đủ ${SIGNATURE_REQUIRED_SLOTS} cầu thủ 103+ OVR (ưu tiên thẻ có OVR thấp nhất trước)!`
      );
    } else {
      notify(
        `Đã điền ${count}/${SIGNATURE_REQUIRED_SLOTS} ô. Bạn cần đủ ${SIGNATURE_REQUIRED_SLOTS} cầu thủ 103+ OVR ngoài Đội Hình Chính để hoàn tất trao đổi!`,
        'error'
      );
    }
  };

  // Quick purchase for 1 Token Chữ Ký with 2,000 gems if player has 0 tokens
  const handleBuySignatureTokenWithGems = () => {
    const costGems = 2000;
    if ((user.gems ?? 0) < costGems) {
      soundService.playClick();
      notify(`Bạn cần ít nhất ${costGems.toLocaleString()} Kim Cương để mua 1 Token Chữ Ký!`, 'error');
      return;
    }
    soundService.playCoins();
    onUpdateUser((prev) => ({
      gems: Math.max(0, (prev.gems ?? 0) - costGems),
      signatureTokens: (prev.signatureTokens ?? 0) + 1,
    }));
    notify(`Đã mua thành công +1 Token Chữ Ký bằng ${costGems.toLocaleString()} Kim Cương!`, 'success');
  };

  const handleConfirmExchange = () => {
    if (isSelectedTargetOwned) {
      soundService.playClick();
      notify(
        `Bạn đã sở hữu Siêu Phẩm Chữ Ký ${selectedTargetCard.name} (106 OVR) trong Kho CLB rồi!`,
        'error'
      );
      return;
    }

    if (!hasEnoughTokens) {
      soundService.playClick();
      notify(
        `Bạn cần ít nhất 1 Token Chữ Ký để trao đổi cầu thủ này (Hiện có: ${userSignatureTokens})!`,
        'error'
      );
      return;
    }

    if (isKakaBallonDorTarget) {
      if (!effectiveKakaGingaSlotted) {
        soundService.playClick();
        notify(
          isKakaGingaLockedInStarter
            ? 'Hãy đưa 106 Kaká Ginga xuống Dự Bị trước khi trao đổi!'
            : 'Vui lòng chọn thẻ 106 Kaká Ginga vào bàn trao đổi!',
          'error'
        );
        return;
      }
      if (!hasEnoughShardsForKaka) {
        soundService.playClick();
        notify(
          `Bạn cần đủ ${KAKA_SHARD_COST.toLocaleString('vi-VN')} Mảnh để đổi Kaká 106 Ballon d'Or (Hiện có: ${userTotyShards.toLocaleString('vi-VN')})!`,
          'error'
        );
        return;
      }

      soundService.playPackOpenFanfare();
      try {
        confetti({
          particleCount: 95,
          spread: 95,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onUpdateUser((prev) => {
        if (
          (prev.signatureTokens ?? 0) < SIGNATURE_TOKEN_COST ||
          (prev.totyShards ?? 0) < KAKA_SHARD_COST
        ) {
          return {};
        }
        const existingOwned = Array.isArray(prev.ownedPlayerIds)
          ? prev.ownedPlayerIds
          : STARTER_OWNED_IDS;
        if (!existingOwned.includes(KAKA_GINGA_REQUIRED_ID)) {
          return {};
        }
        const nextOwned = addOwnedPlayerCopies(
          removeOwnedPlayerCopies(existingOwned, [{ playerId: KAKA_GINGA_REQUIRED_ID, count: 1 }]),
          [kakaBallonDor106.id]
        );

        const existingTradeable = Array.isArray(prev.tradeablePlayerIds)
          ? prev.tradeablePlayerIds
          : [];
        const nextTradeable = existingTradeable.filter(
          (id) =>
            id !== kakaBallonDor106.id &&
            (id !== KAKA_GINGA_REQUIRED_ID || nextOwned.includes(KAKA_GINGA_REQUIRED_ID))
        );

        const existingBench = Array.isArray(prev.benchIds) ? prev.benchIds : [];
        const nextBench = nextOwned.includes(KAKA_GINGA_REQUIRED_ID)
          ? existingBench
          : existingBench.filter((id) => id !== KAKA_GINGA_REQUIRED_ID);

        return {
          signatureTokens: Math.max(0, (prev.signatureTokens ?? 0) - SIGNATURE_TOKEN_COST),
          totyShards: Math.max(0, (prev.totyShards ?? 0) - KAKA_SHARD_COST),
          ownedPlayerIds: nextOwned,
          tradeablePlayerIds: nextTradeable,
          benchIds: nextBench,
        };
      });

      setKakaGingaSlotted(false);
      setWalkoutRewardCard(selectedTargetCard);
      return;
    }

    if (filledCount < SIGNATURE_REQUIRED_SLOTS) {
      soundService.playClick();
      notify(
        `Vui lòng chọn đủ 5 cầu thủ 103+ OVR vào bàn trao đổi (${filledCount}/${SIGNATURE_REQUIRED_SLOTS})!`,
        'error'
      );
      return;
    }

    const sacrificedIds = new Set(
      slots.filter((id): id is string => Boolean(id))
    );
    if (sacrificedIds.size < SIGNATURE_REQUIRED_SLOTS) {
      notify(`Số lượng thẻ hợp lệ chưa đủ 5 cầu thủ 103+!`, 'error');
      return;
    }

    soundService.playPackOpenFanfare();
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onUpdateUser((prev) => {
      const existingOwned = Array.isArray(prev.ownedPlayerIds)
        ? prev.ownedPlayerIds
        : STARTER_OWNED_IDS;
      const nextOwned = addOwnedPlayerCopies(
        removeOwnedPlayerCopies(
          existingOwned,
          Array.from(sacrificedIds).map((playerId) => ({ playerId, count: 1 }))
        ),
        [selectedTargetCard.id]
      );
      const remainingSet = new Set(nextOwned);

      const existingTradeable = Array.isArray(prev.tradeablePlayerIds)
        ? prev.tradeablePlayerIds
        : [];
      const nextTradeable = existingTradeable.filter(
        (id) =>
          id !== selectedTargetCard.id &&
          (!sacrificedIds.has(id) || remainingSet.has(id))
      );

      const existingBench = Array.isArray(prev.benchIds) ? prev.benchIds : [];
      const nextBench = existingBench.filter(
        (id) => !sacrificedIds.has(id) || remainingSet.has(id)
      );

      return {
        signatureTokens: Math.max(0, (prev.signatureTokens ?? 0) - SIGNATURE_TOKEN_COST),
        ownedPlayerIds: nextOwned,
        tradeablePlayerIds: nextTradeable,
        benchIds: nextBench,
      };
    });

    setSlots(Array(SIGNATURE_REQUIRED_SLOTS).fill(null));
    setWalkoutRewardCard(selectedTargetCard);
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        embedded
          ? 'relative w-full h-full flex items-center justify-center select-none overflow-hidden font-cruyff animate-fadeIn'
          : 'fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden font-cruyff animate-fadeIn'
      }
    >
      {/* Background with luxury marble & gold fabric drape */}
      <img
        src="/assets/aistudio/background_s__ki_n_ch__k__5a8a6232.png"
        alt="Background Sự Kiện Chữ Ký"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/80 pointer-events-none" />

      {/* Main Container */}
      <div
        className={
          embedded
            ? 'relative z-10 w-full h-full flex flex-col p-2.5 sm:p-5 overflow-hidden'
            : 'relative z-10 w-full h-full max-w-7xl max-h-screen flex flex-col p-2.5 sm:p-5 overflow-hidden'
        }
      >
        {/* Top Header Bar */}
        <div className="relative flex items-center justify-between gap-3 p-3 sm:p-4 rounded-none bg-black/75 backdrop-blur-md border border-[#d4af37]/80 shadow-[0_4px_24px_rgba(212,175,55,0.25)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {activeTab === 'journey' ? (
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveTab('hub');
                }}
                className="px-2.5 py-1.5 bg-[#1a140a] hover:bg-[#2e2311] border border-[#d4af37] text-[#fbe59b] font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
                <span className="hidden sm:inline">Về Tổng Quan Sự Kiện</span>
                <span className="sm:hidden">Quay Lại</span>
              </button>
            ) : null}

            <img
              src="/assets/aistudio/logo_s__ki_n_ch__k__27373b1c.png"
              alt="Logo Sự Kiện Chữ Ký"
              className="h-11 sm:h-13 w-auto object-contain shrink-0 drop-shadow-[0_2px_10px_rgba(212,175,55,0.45)]"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-[#d4af37]/20 to-[#fbe59b]/10 border border-[#d4af37]/70 text-[#fbe59b] font-black text-[10px] sm:text-xs uppercase tracking-wider">
                  SỰ KIỆN CHỮ KÝ · SIGNATURE ARCHIVE
                </span>
                <span className="px-2 py-0.5 bg-amber-400/20 text-[#fff5d0] border border-[#fbe59b] font-bold text-[10px] uppercase">
                  106 OVR ICONS
                </span>
              </div>
              <h1 className="font-black text-base sm:text-xl text-[#fff5d0] uppercase tracking-wide truncate mt-0.5">
                {activeTab === 'hub'
                  ? 'HÀNH TRÌNH CHỮ KÝ & BỘ SƯU TẬP HUYỀN THOẠI 106 OVR'
                  : `HÀNH TRÌNH CHỮ KÝ · TRAO ĐỔI ${selectedTargetCard.name.toUpperCase()} (106 OVR)`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Signature Tokens display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/85 border border-[#d4af37]/70 text-[#fbe59b] shadow">
              <img
                src="/assets/aistudio/token_ch__k__7d3f14d9.png"
                alt="Token Chữ Ký"
                className="w-5 h-5 object-contain shrink-0 drop-shadow"
              />
              <div className="flex flex-col text-right leading-none">
                <span className="text-[9px] uppercase tracking-wider text-[#d4af37] font-bold">
                  Token Chữ Ký
                </span>
                <span className="font-mono text-xs sm:text-sm font-black text-[#fff5d0]">
                  {userSignatureTokens.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quick buy 1 token if player has 0 tokens */}
            {userSignatureTokens === 0 && (
              <button
                type="button"
                onClick={handleBuySignatureTokenWithGems}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-yellow-400/80 text-yellow-200 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-yellow-300" />
                <span>Mua 1 Token (2.000 KC)</span>
              </button>
            )}

            {/* Close Button */}
            {!embedded && (
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  onClose();
                }}
                className="p-1.5 sm:p-2 bg-black/80 hover:bg-red-950/80 border border-[#d4af37]/60 hover:border-red-400 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-[#fbe59b]" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('hub');
            }}
            className={`px-4 py-2 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'hub'
                ? 'bg-gradient-to-r from-[#d4af37] via-[#fbe59b] to-[#d4af37] text-black border border-[#fff5d0] shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                : 'bg-black/60 hover:bg-black/80 text-[#d4af37] border border-[#d4af37]/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>TỔNG QUAN SỰ KIỆN CHỮ KÝ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('journey');
            }}
            className={`px-4 py-2 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'journey'
                ? 'bg-gradient-to-r from-[#d4af37] via-[#fbe59b] to-[#d4af37] text-black border border-[#fff5d0] shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                : 'bg-black/60 hover:bg-black/80 text-[#d4af37] border border-[#d4af37]/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>HÀNH TRÌNH CHỮ KÝ (TRAO ĐỔI CẦU THỦ 106)</span>
            <span className="px-1.5 py-0.2 bg-black/60 text-[#fbe59b] text-[10px] font-mono border border-[#d4af37]/60">
              1 TOKEN + 5 THẺ 103+
            </span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="relative flex-1 mt-3 overflow-y-auto pr-1">
          {activeTab === 'hub' ? (
            /* ========================================================= */
            /* VIEW 1: ENTRANCE HÀNH TRÌNH CHỮ KÝ & TỔNG HỢP CẦU THỦ     */
            /* ========================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-4">
              {/* LEFT COLUMN (5 Cols): KHUNG ẢNH ENTRANCE HÀNH TRÌNH CHỮ KÝ */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div
                  onClick={() => {
                    soundService.playClick();
                    setActiveTab('journey');
                  }}
                  className="group relative rounded-none border-2 border-[#d4af37] bg-black/80 hover:border-[#fff5d0] shadow-[0_0_30px_rgba(212,175,55,0.35)] transition-all cursor-pointer overflow-hidden flex flex-col"
                >
                  {/* Decorative glowing overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 pointer-events-none" />

                  {/* Khung ảnh entrance hành trình chữ ký asset */}
                  <div className="relative w-full aspect-[4/5] overflow-hidden flex items-center justify-center bg-[#0d0905]">
                    <img
                      src="/assets/aistudio/khung_h_nh_tr_nh_ch__k__33d33e87.png"
                      alt="Khung Hành Trình Chữ Ký"
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />

                    {/* Live Badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-black/85 border border-[#d4af37] text-[#fbe59b] font-cruyff font-black text-xs uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>HÀNH TRÌNH CHỮ KÝ</span>
                    </div>

                    {/* Reward Badge */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-cruyff font-black text-xs uppercase tracking-wider border border-[#fff5d0]">
                      <span>{exchangeTargetCards.length} SIÊU SAO 106 OVR</span>
                    </div>
                  </div>

                  {/* Bottom Action Area with provided Gold Button Asset */}
                  <div className="relative z-20 p-4 bg-gradient-to-b from-[#140e06] to-[#080502] border-t border-[#d4af37]/70 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="font-cruyff font-black text-lg text-[#fff5d0] uppercase tracking-wide">
                          HÀNH TRÌNH CHỮ KÝ
                        </h2>
                        <p className="text-xs text-[#d4b872]">
                          Trao đổi lấy {exchangeTargetCards.length} Siêu Sao Huyền Thoại Chữ Ký 106 OVR
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-[#1a1205] border border-[#d4af37] text-[#fbe59b] text-xs font-mono font-bold">
                        1 Token + Điều Kiện Thẻ
                      </span>
                    </div>

                    {/* Gold Button using user asset */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundService.playClick();
                        setActiveTab('journey');
                      }}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-[#2a1b02] font-cruyff font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-[0_4px_16px_rgba(212,175,55,0.4)]"
                      style={{
                        backgroundImage:
                          'url(/assets/aistudio/n_t_nh_n_token_ho_c_c_u_th__ch__k_._024d7314.png)',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <span>VÀO HÀNH TRÌNH CHỮ KÝ ({exchangeTargetCards.length} SIÊU PHẨM 106)</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Event Highlights & Rules Card */}
                <div className="p-3.5 bg-black/70 border border-[#d4af37]/50 text-xs text-[#e6d5a8] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-black text-[#fbe59b] uppercase tracking-wider">
                    <Award className="w-4 h-4 text-[#d4af37]" />
                    <span>QUY TẮC TRAO ĐỔI CẦU THỦ CHỮ KÝ</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#d8c799]">
                    <li>
                      <strong>Siêu Sao Signature Archive (7 thẻ):</strong> 1 Token Chữ Ký + 5 Cầu Thủ có OVR 103+ bất kì trong kho.
                    </li>
                    <li>
                      <strong>Kaká 106 Ballon d&apos;Or (Chữ Ký):</strong> 106 Kaká Ginga + 1.000 Mảnh + 1 Token Chữ Ký.
                    </li>
                    <li>
                      <strong>{exchangeTargetCards.length} Siêu Phẩm 106 OVR:</strong> Casillas (GK), Stam (CB), Kompany (CB), Ashley Cole (LB), Park Ji-sung (CM), Donovan (CAM), Hugo Sánchez (ST), Kaká Ballon d&apos;Or (CAM).
                    </li>
                    <li>
                      Cầu thủ nhận được là phiên bản Huyền Thoại Tối Thượng Không Giao Dịch kèm Animation mở thẻ Chữ Ký.
                    </li>
                  </ul>
                </div>
              </div>

              {/* RIGHT COLUMN (7 Cols): TỔNG HỢP TOÀN BỘ CẦU THỦ CHỮ KÝ */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="p-3.5 bg-black/80 border border-[#d4af37]/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="/assets/aistudio/token_ch__k__7d3f14d9.png"
                      alt="Signature Token"
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    <div>
                      <h2 className="font-cruyff font-black text-sm sm:text-base text-[#fff5d0] uppercase tracking-wider">
                        TỔNG HỢP TOÀN BỘ CẦU THỦ CHỮ KÝ (106 OVR)
                      </h2>
                      <p className="text-[11px] text-[#cbb37a]">
                        Bộ sưu tập Siêu Sao & Huyền Thoại sở hữu chữ ký vàng độc quyền
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#1c1305] border border-[#d4af37] text-[#fbe59b] font-mono font-bold text-xs">
                    {signatureArchivePlayers.length} CẦU THỦ
                  </span>
                </div>

                {/* List of Signature Players */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {signatureArchivePlayers.map((player) => {
                    const isOwned = ownedSet.has(player.id);
                    return (
                      <div
                        key={player.id}
                        className={`relative p-3.5 border transition-all flex flex-col justify-between gap-3 ${
                          selectedTargetId === player.id
                            ? 'bg-gradient-to-b from-[#241a0b]/90 via-black/85 to-black/95 border-[#fbe59b] shadow-[0_0_24px_rgba(212,175,55,0.35)]'
                            : 'bg-black/80 border-[#d4af37]/50 hover:border-[#d4af37]'
                        }`}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1 text-[10px] font-black uppercase">
                          <span className="px-2 py-0.5 bg-[#1a1205] text-[#d4af37] border border-[#d4af37]/60">
                            {player.ovr} OVR · {player.position}
                          </span>

                          <span
                            className={`px-2 py-0.5 border ${
                              isOwned
                                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                                : 'bg-red-950/60 border-red-500/60 text-red-200'
                            }`}
                          >
                            {isOwned ? 'ĐÃ SỞ HỮU' : 'CHƯA SỞ HỮU'}
                          </span>
                        </div>

                        {/* Player Card & Stats Center */}
                        <div className="flex items-center gap-3">
                          <div className="w-24 sm:w-28 shrink-0 flex items-center justify-center">
                            <FCCard
                              player={player}
                              size="sm"
                              showStats={false}
                            />
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {player.nationFlag ? (
                                <img
                                  src={player.nationFlag}
                                  alt={player.nation}
                                  className="w-4 h-3 object-contain shrink-0"
                                />
                              ) : null}
                              <span className="font-cruyff font-black text-sm text-[#fff5d0] truncate">
                                {player.name}
                              </span>
                            </div>

                            <div className="font-mono text-xs font-bold text-[#d4af37]">
                              {player.position} · {player.ovr} OVR · {player.nation}
                            </div>

                            {/* Mini 6 Stats */}
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono mt-1 text-slate-300">
                              <div className="bg-black/60 px-1 py-0.5 border border-white/10 text-center">
                                <span className="text-zinc-500 text-[9px] mr-1">
                                  {player.position === 'GK' ? 'DIV' : 'PAC'}
                                </span>
                                <span className="font-bold text-[#fbe59b]">
                                  {player.pac}
                                </span>
                              </div>
                              <div className="bg-black/60 px-1 py-0.5 border border-white/10 text-center">
                                <span className="text-zinc-500 text-[9px] mr-1">
                                  {player.position === 'GK' ? 'HAN' : 'SHO'}
                                </span>
                                <span className="font-bold text-[#fbe59b]">
                                  {player.sho}
                                </span>
                              </div>
                              <div className="bg-black/60 px-1 py-0.5 border border-white/10 text-center">
                                <span className="text-zinc-500 text-[9px] mr-1">
                                  {player.position === 'GK' ? 'KIC' : 'PAS'}
                                </span>
                                <span className="font-bold text-[#fbe59b]">
                                  {player.pas}
                                </span>
                              </div>
                              <div className="bg-black/60 px-1 py-0.5 border border-white/10 text-center">
                                <span className="text-zinc-500 text-[9px] mr-1">
                                  {player.position === 'GK' ? 'REF' : 'DRI'}
                                </span>
                                <span className="font-bold text-[#fbe59b]">
                                  {player.dri}
                                </span>
                              </div>
                              <div className="bg-black/60 px-1 py-0.5 border border-white/10 text-center">
                                <span className="text-zinc-500 text-[9px] mr-1">
                                  {player.position === 'GK' ? 'SPE' : 'DEF'}
                                </span>
                                <span className="font-bold text-[#fbe59b]">
                                  {player.def}
                                </span>
                              </div>
                              <div className="bg-black/60 px-1 py-0.5 border border-white/10 text-center">
                                <span className="text-zinc-500 text-[9px] mr-1">
                                  {player.position === 'GK' ? 'POS' : 'PHY'}
                                </span>
                                <span className="font-bold text-[#fbe59b]">
                                  {player.phy}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#d4af37]/40">
                          <button
                            type="button"
                            onClick={() => {
                              soundService.playClick();
                              setInspectedCard(player);
                            }}
                            className="flex-1 py-1 px-2 bg-black/60 hover:bg-black/90 border border-[#d4af37]/60 text-[#fbe59b] font-cruyff font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem Thẻ</span>
                          </button>

                          {player.ovr === 106 && (
                            <button
                              type="button"
                              onClick={() => {
                                soundService.playClick();
                                setSelectedTargetId(player.id);
                                setActiveTab('journey');
                              }}
                              className="flex-1 py-1 px-2 bg-gradient-to-r from-[#d4af37] to-[#fbe59b] hover:brightness-110 text-black font-cruyff font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border border-[#fff5d0]"
                            >
                              <span>Đổi Thẻ Này</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* VIEW 2: HÀNH TRÌNH CHỮ KÝ - TRAO ĐỔI CẦU THỦ 106 OVR      */
            /* ========================================================= */
            <div className="flex flex-col gap-4 pb-6">
              {/* TARGET SELECTION HORIZONTAL STRIP */}
              <div className="p-3.5 bg-black/85 border border-[#d4af37]/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#d4af37]" />
                    <span className="font-cruyff font-black text-xs sm:text-sm text-[#fbe59b] uppercase tracking-wider">
                      CHỌN CẦU THỦ CHỮ KÝ MUỐN ĐỔI ({exchangeTargetCards.length} SIÊU SAO 106 OVR)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#d4b872]">
                    Bấm thẻ bên dưới để chọn mục tiêu đổi
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {exchangeTargetCards.map((target) => {
                    const isSelected = target.id === selectedTargetCard.id;
                    const isOwned = ownedSet.has(target.id);
                    return (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          soundService.playClick();
                          setSelectedTargetId(target.id);
                        }}
                        className={`p-2 border flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-amber-950/70 border-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.4)]'
                            : 'bg-black/60 border-[#d4af37]/40 hover:border-[#d4af37]'
                        }`}
                      >
                        <div className="w-16 h-22 flex items-center justify-center pointer-events-none">
                          <FCCard player={target} size="xs" showStats={false} />
                        </div>
                        <div className="w-full text-center">
                          <div className="font-black text-xs text-[#fff5d0] truncate leading-tight">
                            {target.name}
                          </div>
                          <div className="text-[10px] font-mono text-[#d4af37] font-bold">
                            {target.position} · {target.ovr}
                          </div>
                        </div>
                        {isOwned && (
                          <div className="absolute top-1 right-1 px-1 py-0.2 bg-emerald-950 border border-emerald-400 text-emerald-300 text-[8px] font-bold">
                            ✓ Có
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Header Box for Selected Target */}
              <div className="relative p-4 sm:p-5 bg-black/85 border-2 border-[#d4af37] shadow-[0_0_32px_rgba(212,175,55,0.35)] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 sm:w-28 shrink-0">
                    <FCCard
                      player={selectedTargetCard}
                      size="sm"
                      showStats={false}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black text-xs uppercase border border-[#fff5d0]">
                        {selectedTargetCard.position} · {selectedTargetCard.ovr} OVR
                      </span>
                      <span className="px-2 py-0.5 bg-[#1a1205] border border-[#d4af37] text-[#fbe59b] font-mono text-xs font-bold">
                        {isKakaBallonDorTarget
                          ? '106 KAKÁ GINGA + 1.000 MẢNH + 1 TOKEN'
                          : '1 TOKEN + 5 CẦU THỦ 103+'}
                      </span>
                      {isSelectedTargetOwned && (
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-bold text-xs uppercase">
                          ĐÃ SỞ HỮU
                        </span>
                      )}
                    </div>
                    <h2 className="font-cruyff font-black text-xl sm:text-2xl text-[#fff5d0] uppercase tracking-wide mt-1">
                      TRAO ĐỔI {selectedTargetCard.name.toUpperCase()} (106 OVR)
                      {isKakaBallonDorTarget ? " · BALLON D'OR" : ''}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#d4b872] mt-0.5">
                      Khung thẻ chữ ký vàng độc quyền ({selectedTargetCard.nation}) · Huyền Thoại Tối Thượng không giao dịch
                    </p>
                  </div>
                </div>

                {/* Requirements Checklist and Actions */}
                <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                  <div className="flex flex-wrap items-center justify-center gap-2.5 bg-black/80 px-3 py-1.5 border border-[#d4af37]/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <img
                        src="/assets/aistudio/token_ch__k__7d3f14d9.png"
                        alt="Token"
                        className="w-4 h-4 object-contain"
                      />
                      <span className={hasEnoughTokens ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {userSignatureTokens} / {SIGNATURE_TOKEN_COST} Token Chữ Ký {hasEnoughTokens ? '✓' : ''}
                      </span>
                    </div>
                    <span className="text-zinc-600">|</span>
                    {isKakaBallonDorTarget ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
                            alt="Mảnh Trao Đổi"
                            className="w-4 h-4 object-contain"
                          />
                          <span className={hasEnoughShardsForKaka ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {userTotyShards.toLocaleString('vi-VN')} / {KAKA_SHARD_COST.toLocaleString('vi-VN')} Mảnh {hasEnoughShardsForKaka ? '✓' : ''}
                          </span>
                        </div>
                        <span className="text-zinc-600">|</span>
                        <div className="flex items-center gap-1.5">
                          <span className={effectiveKakaGingaSlotted ? 'text-emerald-400 font-bold' : 'text-yellow-300 font-bold'}>
                            {effectiveKakaGingaSlotted ? '1' : '0'} / 1 Kaká 106 Ginga {effectiveKakaGingaSlotted ? '✓' : ''}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className={filledCount === SIGNATURE_REQUIRED_SLOTS ? 'text-emerald-400 font-bold' : 'text-yellow-300 font-bold'}>
                          {filledCount} / {SIGNATURE_REQUIRED_SLOTS} Thẻ 103+ {filledCount === SIGNATURE_REQUIRED_SLOTS ? '✓' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="px-3 py-1.5 bg-[#241a0b] hover:bg-[#382811] border border-[#d4af37] text-[#fbe59b] font-cruyff font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>
                        {isKakaBallonDorTarget
                          ? 'Tự Động Điền Kaká 106 Ginga'
                          : 'Tự Động Điền (5 Thẻ 103+)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearSlots}
                      disabled={isKakaBallonDorTarget ? !effectiveKakaGingaSlotted : filledCount === 0}
                      className="px-2.5 py-1.5 bg-black/60 hover:bg-black/90 disabled:opacity-40 border border-white/20 text-slate-300 font-cruyff font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Làm Mới</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Starter XI lock warning if applicable */}
              {isKakaBallonDorTarget ? (
                isKakaGingaLockedInStarter && (
                  <div className="p-3 bg-amber-950/70 border border-amber-500/70 text-amber-200 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      Thẻ <strong>106 Kaká Ginga</strong> của bạn hiện đang thi đấu trong{' '}
                      <strong>Đội Hình Chính</strong>. Hãy vào mục <strong>Đội Hình</strong> chuyển sang Dự Bị để dùng cho trao đổi Kaká 106 Ballon d&apos;Or!
                    </span>
                  </div>
                )
              ) : (
                lockedStarterCards.length > 0 && (
                  <div className="p-3 bg-amber-950/70 border border-amber-500/70 text-amber-200 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      Bạn đang có <strong>{lockedStarterCards.length}</strong> cầu thủ
                      103+ OVR đang thi đấu trong <strong>Đội Hình Chính</strong>. Để bảo vệ
                      đội hình, hãy vào mục <strong>Đội Hình</strong> chuyển họ ra ghế dự bị
                      nếu muốn dùng để trao đổi!
                    </span>
                  </div>
                )
              )}

              {/* Exchange Altar */}
              {isKakaBallonDorTarget ? (
                <div className="p-4 bg-black/85 border border-[#d4af37]/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#d4af37]" />
                      <span className="font-cruyff font-black text-xs sm:text-sm text-[#fbe59b] uppercase tracking-wider">
                        BÀN TRAO ĐỔI KAKÁ 106 BALLON D&apos;OR: 106 KAKÁ GINGA + 1.000 MẢNH + 1 TOKEN CHỮ KÝ
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Slot 1: 106 Kaká Ginga */}
                    <div
                      onClick={() => {
                        if (effectiveKakaGingaSlotted) {
                          soundService.playClick();
                          setKakaGingaSlotted(false);
                        } else if (isKakaGingaAvailableInBench) {
                          soundService.playClick();
                          setKakaGingaSlotted(true);
                        }
                      }}
                      className={`relative min-h-[175px] p-3 border transition-all flex flex-col items-center justify-center gap-2 ${
                        effectiveKakaGingaSlotted
                          ? 'bg-gradient-to-b from-amber-950/40 via-black to-black border-amber-400/90 shadow-[0_0_15px_rgba(250,204,21,0.25)] cursor-pointer hover:border-red-400 group'
                          : isKakaGingaAvailableInBench
                          ? 'bg-emerald-950/20 border-dashed border-emerald-400/60 hover:border-emerald-300 cursor-pointer'
                          : 'bg-black/60 border-dashed border-[#d4af37]/40 text-[#d4af37]/70'
                      }`}
                    >
                      {effectiveKakaGingaSlotted && kakaGingaCard ? (
                        <>
                          <div className="pointer-events-none flex items-center justify-center">
                            <FCCard player={kakaGingaCard} size="xs" showStats={false} />
                          </div>
                          <span className="text-[11px] font-black text-emerald-300 uppercase">
                            ✓ Đã Đặt 106 Kaká Ginga
                          </span>
                          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-200 font-cruyff font-black text-xs uppercase tracking-wider transition-opacity">
                            <X className="w-5 h-5 mr-1" /> Gỡ Ra
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-1.5">
                          <Plus className="w-6 h-6 text-[#d4af37]/70" />
                          <span className="font-cruyff font-black text-xs text-[#fff5d0] uppercase">
                            1x Kaká 106 Ginga
                          </span>
                          <span className="text-[11px] text-[#d4b872]">
                            {isKakaGingaAvailableInBench
                              ? 'Bấm để đặt vào bàn trao đổi'
                              : isKakaGingaLockedInStarter
                              ? 'Đang ở Đội Hình Chính'
                              : 'Chưa sở hữu ở Kho Dự Bị'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Slot 2: 1,000 Mảnh */}
                    <div
                      className={`min-h-[175px] p-3 border flex flex-col items-center justify-center gap-2 ${
                        hasEnoughShardsForKaka
                          ? 'bg-emerald-950/25 border-emerald-400/80'
                          : 'bg-rose-950/20 border-rose-500/50'
                      }`}
                    >
                      <img
                        src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
                        alt="Mảnh Trao Đổi"
                        className="w-12 h-12 object-contain drop-shadow"
                      />
                      <span className="font-cruyff font-black text-xs text-[#fff5d0] uppercase">
                        1.000 Mảnh
                      </span>
                      <span
                        className={`font-mono text-xs font-black tabular-nums ${
                          hasEnoughShardsForKaka ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {userTotyShards.toLocaleString('vi-VN')} / 1.000 {hasEnoughShardsForKaka ? '✓' : ''}
                      </span>
                    </div>

                    {/* Slot 3: 1 Token Chữ Ký */}
                    <div
                      className={`min-h-[175px] p-3 border flex flex-col items-center justify-center gap-2 ${
                        hasEnoughTokens
                          ? 'bg-emerald-950/25 border-emerald-400/80'
                          : 'bg-rose-950/20 border-rose-500/50'
                      }`}
                    >
                      <img
                        src="/assets/aistudio/token_ch__k__7d3f14d9.png"
                        alt="Token Chữ Ký"
                        className="w-12 h-12 object-contain drop-shadow"
                      />
                      <span className="font-cruyff font-black text-xs text-[#fff5d0] uppercase">
                        1 Token Chữ Ký
                      </span>
                      <span
                        className={`font-mono text-xs font-black tabular-nums ${
                          hasEnoughTokens ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {userSignatureTokens} / 1 {hasEnoughTokens ? '✓' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Confirmation Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#d4af37]/40">
                    <div className="text-xs text-[#d4b872]">
                      {isSelectedTargetOwned ? (
                        <span className="text-emerald-400 font-bold">
                          ✓ Bạn đã sở hữu {selectedTargetCard.name} 106 Ballon d&apos;Or trong Kho CLB!
                        </span>
                      ) : !hasEnoughTokens ? (
                        <span className="text-red-400 font-bold">
                          ✗ Thiếu Token Chữ Ký (Cần 1 Token · Hiện có: {userSignatureTokens}).
                        </span>
                      ) : !hasEnoughShardsForKaka ? (
                        <span className="text-red-400 font-bold">
                          ✗ Cần đủ 1.000 Mảnh (Hiện có: {userTotyShards.toLocaleString('vi-VN')} Mảnh).
                        </span>
                      ) : !effectiveKakaGingaSlotted ? (
                        <span>
                          Vui lòng đặt thẻ <strong>106 Kaká Ginga</strong> vào bàn trao đổi.
                        </span>
                      ) : (
                        <span className="text-[#fbe59b] font-bold">
                          ✓ Đã đủ điều kiện! Bấm xác nhận để nhận Kaká 106 Ballon d&apos;Or.
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmExchange}
                      disabled={
                        !effectiveKakaGingaSlotted ||
                        !hasEnoughShardsForKaka ||
                        !hasEnoughTokens ||
                        isSelectedTargetOwned
                      }
                      className="w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 text-[#2a1b02] font-cruyff font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[0_4px_20px_rgba(212,175,55,0.45)]"
                      style={{
                        backgroundImage:
                          'url(/assets/aistudio/n_t_nh_n_token_ho_c_c_u_th__ch__k_._024d7314.png)',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>XÁC NHẬN ĐỔI KAKÁ 106 BALLON D&apos;OR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-black/85 border border-[#d4af37]/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#d4af37]" />
                      <span className="font-cruyff font-black text-xs sm:text-sm text-[#fbe59b] uppercase tracking-wider">
                        BÀN TRAO ĐỔI: 1 TOKEN CHỮ KÝ + 5 Ô CẦU THỦ 103+ OVR
                      </span>
                    </div>
                    <span className="text-xs text-[#d4b872]">
                      Chạm vào ô để gỡ thẻ ra khỏi bàn trao đổi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                    {slots.map((slotId, idx) => {
                      const slottedCard = slotId ? eligibleMap.get(slotId) : null;
                      return (
                        <div
                          key={idx}
                          onClick={() => slotId && handleRemoveSlot(idx)}
                          className={`relative aspect-[3/4] p-1.5 border transition-all flex flex-col items-center justify-center ${
                            slottedCard
                              ? 'bg-gradient-to-b from-amber-950/40 via-black to-black border-amber-400/90 shadow-[0_0_15px_rgba(250,204,21,0.25)] cursor-pointer hover:border-red-400 group'
                              : 'bg-black/60 border-dashed border-[#d4af37]/40 text-[#d4af37]/60'
                          }`}
                        >
                          {slottedCard ? (
                            <>
                              <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                <FCCard
                                  player={slottedCard}
                                  size="xs"
                                  showStats={false}
                                />
                              </div>
                              {/* Hover Remove Badge */}
                              <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-200 font-cruyff font-black text-xs uppercase tracking-wider transition-opacity">
                                <X className="w-5 h-5 mr-1" /> Gỡ Ra
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center gap-1 pointer-events-none">
                              <Plus className="w-5 h-5 text-[#d4af37]/60" />
                              <span className="font-mono text-xs font-black text-[#d4af37]/80">
                                Ô #{idx + 1}
                              </span>
                              <span className="font-mono text-[10px] text-[#fbe59b]/60">
                                103+ OVR
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Big Golden Confirmation Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#d4af37]/40">
                    <div className="text-xs text-[#d4b872]">
                      {isSelectedTargetOwned ? (
                        <span className="text-emerald-400 font-bold">
                          ✓ Bạn đã sở hữu {selectedTargetCard.name} 106 OVR trong Kho CLB!
                        </span>
                      ) : !hasEnoughTokens ? (
                        <span className="text-red-400 font-bold">
                          ✗ Bạn cần 1 Token Chữ Ký (Hiện có: {userSignatureTokens} Token).
                        </span>
                      ) : filledCount < SIGNATURE_REQUIRED_SLOTS ? (
                        <span>
                          Còn thiếu{' '}
                          <strong>
                            {SIGNATURE_REQUIRED_SLOTS - filledCount}
                          </strong>{' '}
                          cầu thủ 103+ OVR để tiến hành trao đổi.
                        </span>
                      ) : (
                        <span className="text-[#fbe59b] font-bold">
                          ✓ Đã đủ 1 Token Chữ Ký & 5/5 thẻ 103+ OVR! Bấm xác nhận để nhận {selectedTargetCard.name} 106.
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmExchange}
                      disabled={
                        filledCount < SIGNATURE_REQUIRED_SLOTS ||
                        !hasEnoughTokens ||
                        isSelectedTargetOwned
                      }
                      className="w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 text-[#2a1b02] font-cruyff font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[0_4px_20px_rgba(212,175,55,0.45)]"
                      style={{
                        backgroundImage:
                          'url(/assets/aistudio/n_t_nh_n_token_ho_c_c_u_th__ch__k_._024d7314.png)',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>XÁC NHẬN ĐỔI {selectedTargetCard.name.toUpperCase()} (106 OVR)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Eligible Reserve Inventory Picker */}
              <div className="p-4 bg-black/85 border border-[#d4af37]/80 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#d4af37]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#d4af37]" />
                    <span className="font-cruyff font-black text-xs sm:text-sm text-[#fbe59b] uppercase tracking-wider">
                      {isKakaBallonDorTarget
                        ? `CHỌN THẺ 106 KAKÁ GINGA TRONG KHO DỰ BỊ (${isKakaGingaAvailableInBench ? 1 : 0} THẺ HỢP LỆ)`
                        : `CHỌN CẦU THỦ 103+ OVR TRONG KHO DỰ BỊ (${eligibleCards.length} THẺ HỢP LỆ)`}
                    </span>
                  </div>
                  <span className="text-xs text-[#d4b872]">
                    Chạm thẻ để thêm/bỏ khỏi bàn trao đổi
                  </span>
                </div>

                {isKakaBallonDorTarget ? (
                  isKakaGingaAvailableInBench && kakaGingaCard ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      <div
                        onClick={() => handleToggleCard(kakaGingaCard)}
                        className={`relative p-1.5 border transition-all cursor-pointer flex flex-col items-center ${
                          effectiveKakaGingaSlotted
                            ? 'bg-amber-950/70 border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                            : 'bg-black/60 border-white/15 hover:border-[#d4af37]'
                        }`}
                      >
                        <div className="w-full flex items-center justify-center pointer-events-none">
                          <FCCard player={kakaGingaCard} size="xs" showStats={false} />
                        </div>
                        <div className="w-full mt-1 px-1 text-center">
                          <div className="font-bold text-[10px] text-white truncate">
                            {kakaGingaCard.name}
                          </div>
                          <div className="font-mono text-[9px] text-[#fbe59b]">
                            {kakaGingaCard.position} · {kakaGingaCard.ovr} OVR
                          </div>
                        </div>
                        {effectiveKakaGingaSlotted && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 text-black flex items-center justify-center text-xs font-black shadow">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-[#d4af37]/75 font-cruyff">
                      {isKakaGingaLockedInStarter
                        ? 'Thẻ 106 Kaká Ginga đang ở Đội Hình Chính. Hãy chuyển xuống Dự Bị trong Đội Hình để trao đổi!'
                        : 'Bạn chưa có thẻ 106 Kaká Ginga trong kho dự bị. Hãy chiêu mộ từ Vé Quay Ginga hoặc Gói 100+ Ginga!'}
                    </div>
                  )
                ) : eligibleCards.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#d4af37]/70 font-cruyff">
                    Bạn hiện chưa có cầu thủ nào từ 103+ OVR ở kho dự bị ngoài Đội
                    Hình Chính. Hãy mở gói vé quay hoặc kiểm tra lại đội hình!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {eligibleCards.map((card) => {
                      const isSlotted = slots.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleToggleCard(card)}
                          className={`relative p-1 border transition-all cursor-pointer flex flex-col items-center ${
                            isSlotted
                              ? 'bg-amber-950/70 border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                              : 'bg-black/60 border-white/15 hover:border-[#d4af37]'
                          }`}
                        >
                          <div className="w-full flex items-center justify-center pointer-events-none">
                            <FCCard player={card} size="xs" showStats={false} />
                          </div>

                          <div className="w-full mt-1 px-1 text-center">
                            <div className="font-bold text-[10px] text-white truncate">
                              {card.name}
                            </div>
                            <div className="font-mono text-[9px] text-[#fbe59b]">
                              {card.position} · {card.ovr} OVR
                            </div>
                          </div>

                          {isSlotted && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 text-black flex items-center justify-center text-xs font-black shadow">
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-60 px-5 py-2.5 border shadow-[0_8px_32px_rgba(0,0,0,0.8)] font-cruyff font-bold text-xs uppercase tracking-wider flex items-center gap-2 animate-bounce ${
            toast.tone === 'success'
              ? 'bg-[#181106] border-emerald-400 text-emerald-300'
              : 'bg-red-950 border-red-500 text-red-200'
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      {/* Inspect Card Modal */}
      {inspectedCard && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setInspectedCard(null)}
        >
          <div
            className="relative max-w-sm w-full bg-[#140e06] border-2 border-[#d4af37] p-5 flex flex-col items-center gap-3.5 shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInspectedCard(null)}
              className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-36 flex items-center justify-center">
              <FCCard player={inspectedCard} size="md" showStats={false} />
            </div>

            <div className="text-center">
              <div className="font-cruyff font-black text-lg text-[#fff5d0]">
                {inspectedCard.fullName || inspectedCard.name}
              </div>
              <div className="text-xs text-[#d4af37] font-mono mt-0.5">
                {inspectedCard.position} · {inspectedCard.ovr} OVR · {inspectedCard.nation}
              </div>
            </div>

            <div className="px-3 py-1 bg-amber-950/70 border border-yellow-400/60 text-[11px] font-black text-yellow-200 uppercase text-center">
              {inspectedCard.id === kakaBallonDor106.id
                ? 'Yêu cầu đổi: 106 Kaká Ginga + 1.000 Mảnh + 1 Token Chữ Ký'
                : 'Yêu cầu đổi: 1 Token Chữ Ký + 5 Cầu Thủ 103+ OVR Bất Kì'}
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-2">
              {inspectedCard.ovr === 106 && (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setSelectedTargetId(inspectedCard.id);
                    setActiveTab('journey');
                    setInspectedCard(null);
                  }}
                  className="py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Chọn Đổi Thẻ Này
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectedCard(null)}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer col-span-1"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walkout animation for Signature Player */}
      {walkoutRewardCard && (
        <PackOpeningModal
          fixedPlayer={walkoutRewardCard}
          packTier="UTOTY"
          packTheme="UTOTY"
          packName={`HÀNH TRÌNH CHỮ KÝ · ${walkoutRewardCard.name} (${walkoutRewardCard.ovr} OVR · KHÔNG GIAO DỊCH)`}
          isTicketSpin={false}
          autoStartWalkout={true}
          isIconChroniclesExchange={true}
          skipResourceBonus={true}
          onClose={() => setWalkoutRewardCard(null)}
          onPlayerClaimed={() => {
            setWalkoutRewardCard(null);
          }}
        />
      )}
    </div>
  );
};
