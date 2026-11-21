import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Lock } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  totyFeaturedPlayers,
  toty26HmExchangePlayers,
  futureStarsPlayers,
  euro2024Players,
  laligaPlayers,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
} from '../data/mockData';
import { FCCard } from './FCCard';
import { PackOpeningModal } from './PackOpeningModal';
import { TopSectionHeader } from './TopSectionHeader';
import { TotyShardsSection } from './TotyShardsSection';
import { IconsChroniclesSection } from './IconsChroniclesSection';
import { soundService } from '../services/sound';
import {
  isEligibleToty99Plus,
  resolvePlayerWithUtotyUpgrade,
  toUtotyUpgradedCard,
} from '../utils/utotyUpgrade';
import { getMarketBuyPrice } from './TransferMarketModal';

interface UtotyExchangeModalProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onExchangePlayer: (playerId: string) => void;
  onGoToTickets: () => void;
  onGoToMarket: () => void;
  onGoToMyTeam: () => void;
  onOpenRisingTalent?: () => void;
  onClickGems?: () => void;
  onGoHome?: () => void;
  onClose: () => void;
}

type ExchangeSubTab = 'toty_hm' | 'icons_chronicles' | 'utoty_upgrade' | 'shards';
type FilterMode = 'all' | 'ready' | 'upgraded';

interface TotyHmExchangeConfig {
  id: string;
  targetPlayerId: string;
  title: string;
  clubSubtitle: string;
  requirementLabel: string;
  requiredOvrs: number[];
}

const TOTY_HM_EXCHANGES: TotyHmExchangeConfig[] = [
  {
    id: 'hm_ex_ronaldo_104',
    targetPlayerId: 'toty26_hm_ronaldo_mu',
    title: 'RONALDO · MAN UTD (104 OVR)',
    clubSubtitle: 'Manchester United · ST · TOTY26 HM',
    requirementLabel: '3 cầu thủ 102+ OVR',
    requiredOvrs: [102, 102, 102],
  },
  {
    id: 'hm_ex_messi_103',
    targetPlayerId: 'toty26_hm_messi_barca',
    title: 'MESSI · BARCELONA (103 OVR)',
    clubSubtitle: 'FC Barcelona · RW · TOTY26 HM',
    requirementLabel: '3 cầu thủ 102+ OVR',
    requiredOvrs: [102, 102, 102],
  },
  {
    id: 'hm_ex_iniesta_103',
    targetPlayerId: 'toty26_hm_iniesta',
    title: 'INIESTA · BARCELONA (103 OVR)',
    clubSubtitle: 'FC Barcelona · CM · TOTY26 HM',
    requirementLabel: '2 cầu thủ 102+ & 1 cầu thủ 101+ OVR',
    requiredOvrs: [102, 102, 101],
  },
  {
    id: 'hm_ex_ramos_102',
    targetPlayerId: 'toty26_hm_ramos',
    title: 'RAMOS · REAL MADRID (102 OVR)',
    clubSubtitle: 'Real Madrid · CB · TOTY26 HM',
    requirementLabel: '2 cầu thủ 101+ OVR',
    requiredOvrs: [101, 101],
  },
];

export const UtotyExchangeModal: React.FC<UtotyExchangeModalProps> = ({
  user,
  onUpdateUser,
  onExchangePlayer,
  onGoToTickets,
  onGoToMarket,
  onGoToMyTeam,
  onOpenRisingTalent,
  onClickGems,
  onGoHome,
  onClose,
}) => {
  const [subTab, setSubTab] = useState<ExchangeSubTab>('toty_hm');
  const [shardInspectedPlayer, setShardInspectedPlayer] = useState<PlayerCard | null>(null);
  const [notice, setNotice] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 2800);
  };

  const ownedSet = useMemo(
    () =>
      new Set(user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS),
    [user.ownedPlayerIds]
  );
  const upgradedSet = useMemo(
    () => new Set(user.utotyUpgradedIds ?? []),
    [user.utotyUpgradedIds]
  );
  const starterSet = useMemo(
    () =>
      new Set(
        user.starterIds?.length === 11 ? user.starterIds : STARTER_STARTER_IDS
      ),
    [user.starterIds]
  );

  // =========================================================================
  // SUB-TAB 1: TRAO ĐỔI CẦU THỦ TOTY HM ĐỘC QUYỀN (RONALDO, MESSI, INIESTA, RAMOS)
  // =========================================================================
  const [activeHmExchangeId, setActiveHmExchangeId] = useState<string>(
    TOTY_HM_EXCHANGES[0].id
  );
  const [hmExchangeSlots, setHmExchangeSlots] = useState<Array<string | null>>(
    () => Array(TOTY_HM_EXCHANGES[0].requiredOvrs.length).fill(null)
  );
  const [exchangedHmWalkoutCard, setExchangedHmWalkoutCard] =
    useState<PlayerCard | null>(null);
  const [signedShardWalkoutCard, setSignedShardWalkoutCard] =
    useState<PlayerCard | null>(null);

  const activeHmExchangeConfig = useMemo(
    () =>
      TOTY_HM_EXCHANGES.find((c) => c.id === activeHmExchangeId) ||
      TOTY_HM_EXCHANGES[0],
    [activeHmExchangeId]
  );

  const activeHmTargetPlayer = useMemo(
    () =>
      toty26HmExchangePlayers.find(
        (p) => p.id === activeHmExchangeConfig.targetPlayerId
      ) || toty26HmExchangePlayers[0],
    [activeHmExchangeConfig]
  );

  const eligibleHmFodderCards = useMemo(() => {
    const seen = new Set<string>();
    const allCatalog = [
      ...totyFeaturedPlayers,
      ...futureStarsPlayers,
      ...euro2024Players,
      ...laligaPlayers,
    ];
    const result: PlayerCard[] = [];
    for (const raw of allCatalog) {
      if (seen.has(raw.id)) continue;
      seen.add(raw.id);
      if (
        raw.id === 'box_sig_van_der_sar_105' ||
        raw.id === 'box_ginga_garrincha_106' ||
        raw.isUntradeableOnly
      )
        continue;
      if (!ownedSet.has(raw.id)) continue;
      if (starterSet.has(raw.id)) continue;
      if (raw.id === activeHmExchangeConfig.targetPlayerId) continue;
      const resolved = resolvePlayerWithUtotyUpgrade(raw, user.utotyUpgradedIds);
      if (resolved.ovr >= 101) {
        result.push(resolved);
      }
    }
    return result.sort((a, b) => a.ovr - b.ovr || a.name.localeCompare(b.name));
  }, [
    ownedSet,
    starterSet,
    activeHmExchangeConfig.targetPlayerId,
    user.utotyUpgradedIds,
  ]);

  const eligibleHmFodderMap = useMemo(
    () => new Map(eligibleHmFodderCards.map((p) => [p.id, p])),
    [eligibleHmFodderCards]
  );

  useEffect(() => {
    setHmExchangeSlots((prev) => {
      const reqLen = activeHmExchangeConfig.requiredOvrs.length;
      const next = Array.from({ length: reqLen }, (_, idx) => {
        const id = prev[idx] ?? null;
        if (!id) return null;
        const card = eligibleHmFodderMap.get(id);
        if (!card || card.ovr < activeHmExchangeConfig.requiredOvrs[idx]) {
          return null;
        }
        return id;
      });
      const used = new Set<string>();
      return next.map((id) => {
        if (!id || used.has(id)) return null;
        used.add(id);
        return id;
      });
    });
  }, [activeHmExchangeConfig, eligibleHmFodderMap]);

  const handleSelectHmExchangeTarget = (config: TotyHmExchangeConfig) => {
    soundService.playClick();
    setActiveHmExchangeId(config.id);
    setHmExchangeSlots(Array(config.requiredOvrs.length).fill(null));
  };

  const handleToggleHmFodderCard = (card: PlayerCard) => {
    soundService.playClick();
    setHmExchangeSlots((prev) => {
      const existingIdx = prev.indexOf(card.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = null;
        return copy;
      }

      const emptyIndices = activeHmExchangeConfig.requiredOvrs
        .map((minOvr, idx) => ({ minOvr, idx }))
        .filter(({ minOvr, idx }) => prev[idx] === null && card.ovr >= minOvr)
        .sort((a, b) => b.minOvr - a.minOvr || a.idx - b.idx);

      if (emptyIndices.length === 0) {
        showToast(
          `Cầu thủ ${card.name} (OVR ${card.ovr}) chưa đạt mức OVR của ô trống còn lại hoặc các ô đã đầy!`,
          'error'
        );
        return prev;
      }

      const copy = [...prev];
      copy[emptyIndices[0].idx] = card.id;
      return copy;
    });
  };

  const handleAutoFillHmExchange = () => {
    soundService.playClick();
    const reqOrder = activeHmExchangeConfig.requiredOvrs
      .map((minOvr, idx) => ({ minOvr, idx }))
      .sort((a, b) => b.minOvr - a.minOvr || a.idx - b.idx);

    const used = new Set<string>();
    const nextSlots: Array<string | null> = Array(
      activeHmExchangeConfig.requiredOvrs.length
    ).fill(null);

    for (const { minOvr, idx } of reqOrder) {
      const match = eligibleHmFodderCards.find(
        (p) => !used.has(p.id) && p.ovr >= minOvr
      );
      if (match) {
        nextSlots[idx] = match.id;
        used.add(match.id);
      }
    }

    setHmExchangeSlots(nextSlots);
    const filledCount = nextSlots.filter(Boolean).length;
    if (filledCount === activeHmExchangeConfig.requiredOvrs.length) {
      showToast(
        `Đã tự động điền đủ ${filledCount} cầu thủ cho ${activeHmTargetPlayer.name}!`
      );
    } else {
      showToast(
        `Đã điền ${filledCount}/${activeHmExchangeConfig.requiredOvrs.length} ô. Bạn cần thêm cầu thủ dự bị đạt mốc OVR yêu cầu!`,
        'error'
      );
    }
  };

  const isHmExchangeReady = useMemo(() => {
    if (hmExchangeSlots.length !== activeHmExchangeConfig.requiredOvrs.length) {
      return false;
    }
    const seen = new Set<string>();
    for (let i = 0; i < activeHmExchangeConfig.requiredOvrs.length; i++) {
      const id = hmExchangeSlots[i];
      if (!id || seen.has(id)) return false;
      seen.add(id);
      const card = eligibleHmFodderMap.get(id);
      if (!card || card.ovr < activeHmExchangeConfig.requiredOvrs[i]) {
        return false;
      }
    }
    return true;
  }, [hmExchangeSlots, activeHmExchangeConfig, eligibleHmFodderMap]);

  const handleConfirmHmExchange = () => {
    if (!isHmExchangeReady) {
      soundService.playClick();
      showToast(
        'Hãy chọn đủ các cầu thủ đạt yêu cầu OVR vào các ô trao đổi trước!',
        'error'
      );
      return;
    }

    const sacrificedSet = new Set(
      hmExchangeSlots.filter((id): id is string => Boolean(id))
    );
    const currentOwned = user.ownedPlayerIds?.length
      ? user.ownedPlayerIds
      : STARTER_OWNED_IDS;
    const nextOwned = currentOwned.filter((id) => !sacrificedSet.has(id));
    if (!nextOwned.includes(activeHmTargetPlayer.id)) {
      nextOwned.push(activeHmTargetPlayer.id);
    }

    const nextBench = (user.benchIds ?? []).filter(
      (id) => !sacrificedSet.has(id)
    );
    const nextUtotyUpgraded = (user.utotyUpgradedIds ?? []).filter(
      (id) => !sacrificedSet.has(id)
    );

    soundService.playPackOpenFanfare();
    try {
      confetti({ particleCount: 110, spread: 95, origin: { y: 0.55 } });
    } catch {
      // ignore
    }

    onUpdateUser({
      ownedPlayerIds: nextOwned,
      benchIds: nextBench,
      utotyUpgradedIds: nextUtotyUpgraded,
    });

    setHmExchangeSlots(Array(activeHmExchangeConfig.requiredOvrs.length).fill(null));
    setExchangedHmWalkoutCard(activeHmTargetPlayer);
    showToast(
      `Trao đổi thành công! Đã nhận ${activeHmTargetPlayer.name} (${activeHmTargetPlayer.ovr} OVR · TOTY26 HM)!`
    );
  };

  // =========================================================================
  // SUB-TAB 2: NÂNG CẤP SIÊU SAO UTOTY (+2 OVR TỪ THẺ TOTY 99+)
  // =========================================================================
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [justUpgradedId, setJustUpgradedId] = useState<string | null>(null);

  const eligibleBaseCards = useMemo(() => {
    const list = totyFeaturedPlayers.filter((card) => isEligibleToty99Plus(card));
    return [...list].sort((a, b) => {
      const aReady =
        ownedSet.has(a.id) && !upgradedSet.has(a.id)
          ? 2
          : upgradedSet.has(a.id)
          ? 1
          : 0;
      const bReady =
        ownedSet.has(b.id) && !upgradedSet.has(b.id)
          ? 2
          : upgradedSet.has(b.id)
          ? 1
          : 0;
      if (bReady !== aReady) return bReady - aReady;
      return b.ovr - a.ovr;
    });
  }, [ownedSet, upgradedSet]);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    () => eligibleBaseCards[0]?.id ?? 'utoty_mbappe_103'
  );

  const selectedBaseCard: PlayerCard = useMemo(() => {
    return (
      eligibleBaseCards.find((c) => c.id === selectedPlayerId) ||
      eligibleBaseCards[0] ||
      totyFeaturedPlayers[0]
    );
  }, [eligibleBaseCards, selectedPlayerId]);

  const selectedUpgradedCard = useMemo(
    () => toUtotyUpgradedCard(selectedBaseCard),
    [selectedBaseCard]
  );

  const filteredUtotyList = useMemo(() => {
    return eligibleBaseCards.filter((c) => {
      if (filterMode === 'ready') {
        return ownedSet.has(c.id) && !upgradedSet.has(c.id);
      }
      if (filterMode === 'upgraded') {
        return upgradedSet.has(c.id);
      }
      return true;
    });
  }, [eligibleBaseCards, filterMode, ownedSet, upgradedSet]);

  const isSelectedOwned = ownedSet.has(selectedBaseCard.id);
  const isSelectedUpgraded = upgradedSet.has(selectedBaseCard.id);
  const isSelectedInLineup = starterSet.has(selectedBaseCard.id);
  const canExchangeSelected = isSelectedOwned && !isSelectedUpgraded;

  const handleConfirmUtotyUpgrade = () => {
    if (!canExchangeSelected) return;
    soundService.playPackOpenFanfare();
    try {
      confetti({
        particleCount: 110,
        spread: 95,
        origin: { y: 0.52 },
      });
    } catch {
      // ignore
    }
    onExchangePlayer(selectedBaseCard.id);
    setJustUpgradedId(selectedBaseCard.id);
    setTimeout(() => setJustUpgradedId(null), 2600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-cruyff">
      <img
        src="/assets/aistudio/2026-01-15_TOTY__2048__97ef4195.jpg"
        alt="Trao Đổi Cầu Thủ Sự Kiện TOTY"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/85 to-black/95 pointer-events-none" />

      {notice && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[75] px-5 py-2.5 border font-bold text-sm rounded-none ${
            notice.tone === 'success'
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-rose-950 border-rose-400 text-rose-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Top Section Header */}
      <TopSectionHeader
        title="TRAO ĐỔI CẦU THỦ SỰ KIỆN TOTY & ICONS"
        subtitle="Biên Niên Sử Icons (Classics 95), Trao đổi TOTY HM, Nâng cấp UTOTY (+2 OVR) & Trao đổi Mảnh"
        user={user}
        onBack={onClose}
        onGoHome={onGoHome || onClose}
        onClickGems={onClickGems}
        onClickTickets={onGoToTickets}
        onClickShards={() => setSubTab('shards')}
      />

      {/* TOP EXCHANGE BAR */}
      <div className="relative z-20 w-full grid grid-cols-2 lg:grid-cols-5 border-b border-white/25 divide-x divide-y lg:divide-y-0 divide-white/25 bg-slate-900/95 shrink-0">
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setSubTab('toty_hm');
          }}
          className={`py-3 px-2.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none whitespace-nowrap ${
            subTab === 'toty_hm'
              ? 'bg-emerald-950/75 text-emerald-300 border-b-2 border-emerald-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          TRAO ĐỔI TOTY HM (102–104)
        </button>
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setSubTab('icons_chronicles');
          }}
          className={`py-3 px-2.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none whitespace-nowrap flex items-center justify-center gap-1.5 ${
            subTab === 'icons_chronicles'
              ? 'bg-teal-950/85 text-teal-200 border-b-2 border-teal-300'
              : 'bg-teal-500/10 text-teal-200 hover:text-white hover:bg-teal-500/20'
          }`}
        >
          <img
            src="/assets/aistudio/khung_th__classics_6d23269c.png"
            alt=""
            className="w-4 h-4 object-contain shrink-0"
          />
          <span>BIÊN NIÊN SỬ ICONS (95)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setSubTab('utoty_upgrade');
          }}
          className={`py-3 px-2.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none whitespace-nowrap ${
            subTab === 'utoty_upgrade'
              ? 'bg-emerald-950/75 text-emerald-300 border-b-2 border-emerald-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          NÂNG CẤP UTOTY (+2 OVR)
        </button>
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setSubTab('shards');
          }}
          className={`py-3 px-2.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none whitespace-nowrap ${
            subTab === 'shards'
              ? 'bg-amber-950/80 text-yellow-300 border-b-2 border-yellow-400'
              : 'bg-amber-500/10 text-yellow-200 hover:text-yellow-100 hover:bg-amber-500/20'
          }`}
        >
          TRAO ĐỔI MẢNH ({(user.totyShards ?? 0).toLocaleString('vi-VN')} MẢNH)
        </button>
        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            if (onOpenRisingTalent) {
              onOpenRisingTalent();
            }
          }}
          className="col-span-2 lg:col-span-1 py-3 px-2.5 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-none whitespace-nowrap bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 hover:text-white border-b-2 border-cyan-400/70"
        >
          TÀI NĂNG SÁNG GIÁ (85–100) →
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
        {subTab === 'icons_chronicles' ? (
          <IconsChroniclesSection
            user={user}
            onUpdateUser={onUpdateUser}
            onGoToTickets={() => {
              onClose();
              onGoToTickets();
            }}
            onShowToast={showToast}
          />
        ) : subTab === 'shards' ? (
          <TotyShardsSection
            user={user}
            onUpdateUser={onUpdateUser}
            onInspectPlayer={(p) => setShardInspectedPlayer(p)}
            onClaimedPlayerReveal={(p) => setSignedShardWalkoutCard(p)}
            onShowToast={showToast}
          />
        ) : subTab === 'toty_hm' ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 border border-white/25 divide-y lg:divide-y-0 lg:divide-x divide-white/25 bg-slate-950/90">
            {/* LEFT 5 COLS: 4 TOTY HM TARGET SUPERSTARS */}
            <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col gap-3 rounded-none">
              <div className="border-b border-white/20 pb-2.5">
                <h2 className="font-cruyff font-black text-lg text-white uppercase tracking-wide">
                  CHỌN HUYỀN THOẠI CẦN TRAO ĐỔI
                </h2>
                <p className="text-xs text-slate-300">
                  Ronaldo 104 · Messi 103 · Iniesta 103 · Ramos 102
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TOTY_HM_EXCHANGES.map((cfg) => {
                  const cardObj = toty26HmExchangePlayers.find(
                    (p) => p.id === cfg.targetPlayerId
                  );
                  if (!cardObj) return null;
                  const isSelected = activeHmExchangeId === cfg.id;
                  const alreadyOwned = ownedSet.has(cardObj.id);

                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => handleSelectHmExchangeTarget(cfg)}
                      className={`p-3 border flex flex-col items-center justify-between text-center transition-colors cursor-pointer rounded-none ${
                        isSelected
                          ? 'bg-amber-950/40 border-yellow-400'
                          : 'bg-black/60 border-white/20 hover:border-white/50'
                      }`}
                    >
                      <FCCard player={cardObj} size="sm" showStats={false} />
                      <div className="mt-2 w-full">
                        <div className="font-cruyff font-black text-xs text-white uppercase truncate">
                          {cardObj.name} · {cardObj.ovr} OVR
                        </div>
                        <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                          {cfg.requirementLabel}
                        </div>
                        <div
                          className={`mt-2 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-none ${
                            alreadyOwned
                              ? 'border-emerald-400/50 bg-emerald-950/40 text-emerald-300'
                              : isSelected
                              ? 'border-yellow-300 bg-yellow-400 text-slate-950'
                              : 'border-white/20 bg-white/5 text-slate-300'
                          }`}
                        >
                          {alreadyOwned
                            ? 'ĐÃ SỞ HỮU'
                            : isSelected
                            ? 'ĐANG CHỌN'
                            : 'CHỌN TRAO ĐỔI'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT 7 COLS: SQUAD BUILDER SLOTS + FODDER POOL */}
            <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between gap-4 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 pb-3">
                <div>
                  <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                    {activeHmExchangeConfig.clubSubtitle}
                  </span>
                  <h3 className="font-cruyff font-black text-xl text-white uppercase">
                    {activeHmExchangeConfig.title} · {activeHmExchangeConfig.requirementLabel}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillHmExchange}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-xs font-cruyff font-bold uppercase tracking-wider text-yellow-300 cursor-pointer rounded-none"
                  >
                    Tự Động Điền
                  </button>
                  <button
                    type="button"
                    disabled={!isHmExchangeReady}
                    onClick={handleConfirmHmExchange}
                    className={`px-4 py-2 border font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-colors rounded-none ${
                      isHmExchangeReady
                        ? 'bg-yellow-400 hover:bg-yellow-300 border-yellow-200 text-slate-950 cursor-pointer shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                        : 'bg-slate-900 border-white/20 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    TRAO ĐỔI NGAY ({activeHmTargetPlayer.name})
                  </button>
                </div>
              </div>

              {/* Requirement Slots */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeHmExchangeConfig.requiredOvrs.map((reqOvr, idx) => {
                  const slottedId = hmExchangeSlots[idx];
                  const slottedCard = slottedId
                    ? eligibleHmFodderMap.get(slottedId) || null
                    : null;

                  return (
                    <div
                      key={`slot_${idx}`}
                      onClick={() => {
                        if (slottedCard) handleToggleHmFodderCard(slottedCard);
                      }}
                      className={`p-3 border min-h-[175px] flex flex-col items-center justify-center text-center transition-colors rounded-none ${
                        slottedCard
                          ? 'bg-emerald-950/35 border-emerald-400 cursor-pointer'
                          : 'bg-black/60 border-dashed border-white/30'
                      }`}
                    >
                      {slottedCard ? (
                        <>
                          <FCCard player={slottedCard} size="sm" showStats={false} />
                          <span className="mt-1 text-xs font-bold text-emerald-300 truncate max-w-full">
                            {slottedCard.name} (OVR {slottedCard.ovr})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Chạm để gỡ khỏi ô
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono font-black text-lg text-yellow-300 tabular-nums">
                            {reqOvr}+ OVR
                          </span>
                          <span className="text-xs text-slate-400 mt-1">
                            Chọn 1 cầu thủ dự bị từ danh sách bên dưới
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Eligible Reserve Fodder Pool */}
              <div className="border-t border-white/20 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span>
                    Kho dự bị đạt OVR 101+ (Đã bảo vệ 11 cầu thủ Đá Chính):{' '}
                    <strong className="text-yellow-300 tabular-nums">
                      {eligibleHmFodderCards.length} thẻ
                    </strong>
                  </span>
                  {hmExchangeSlots.some(Boolean) && (
                    <button
                      type="button"
                      onClick={() =>
                        setHmExchangeSlots(
                          Array(activeHmExchangeConfig.requiredOvrs.length).fill(null)
                        )
                      }
                      className="text-xs text-rose-300 hover:text-rose-200 underline cursor-pointer"
                    >
                      Xóa tất cả ô
                    </button>
                  )}
                </div>

                {eligibleHmFodderCards.length === 0 ? (
                  <div className="p-4 border border-white/15 bg-black/50 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 rounded-none">
                    <span>
                      Chưa có cầu thủ dự bị OVR 101+ ngoài đội hình chính. Hãy mở Vé Quay hoặc mua trên Chuyển Nhượng!
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToTickets();
                        }}
                        className="px-3 py-1.5 border border-yellow-400/60 text-yellow-300 text-xs font-bold uppercase cursor-pointer rounded-none"
                      >
                        Mở Vé Quay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGoToMarket();
                        }}
                        className="px-3 py-1.5 border border-emerald-400/60 text-emerald-300 text-xs font-bold uppercase cursor-pointer rounded-none"
                      >
                        Chuyển Nhượng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[160px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
                    {eligibleHmFodderCards.map((card) => {
                      const isSlotted = hmExchangeSlots.includes(card.id);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleToggleHmFodderCard(card)}
                          className={`p-2 border text-left flex items-center gap-2 transition-colors cursor-pointer rounded-none ${
                            isSlotted
                              ? 'bg-emerald-950/50 border-emerald-400'
                              : 'bg-black/65 border-white/20 hover:border-yellow-400/70'
                          }`}
                        >
                          <img
                            src={
                              card.avatarUrl ||
                              card.customFrameUrl ||
                              '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                            }
                            alt={card.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-black text-yellow-300 tabular-nums">
                              OVR {card.ovr} · {card.position}
                            </div>
                            <div className="text-xs font-bold text-white truncate">
                              {card.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Exchange Bar */}
              <button
                type="button"
                disabled={!isHmExchangeReady}
                onClick={handleConfirmHmExchange}
                className={`w-full py-3.5 px-4 border font-cruyff font-black text-sm uppercase tracking-wider transition-colors rounded-none ${
                  isHmExchangeReady
                    ? 'bg-yellow-400 hover:bg-yellow-300 border-yellow-200 text-slate-950 cursor-pointer'
                    : 'bg-slate-900 border-white/15 text-slate-500 cursor-not-allowed'
                }`}
              >
                XÁC NHẬN TRAO ĐỔI NHẬN {activeHmTargetPlayer.name} ({activeHmTargetPlayer.ovr} OVR)
              </button>
            </div>
          </div>
        ) : (
          /* SUB-TAB 2: NÂNG CẤP SIÊU SAO UTOTY (+2 OVR) */
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 border border-white/25 divide-y lg:divide-y-0 lg:divide-x divide-white/25 bg-slate-950/90">
            {/* LEFT 5 COLS: 13 ELIGIBLE TOTY 99+ PLAYERS */}
            <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col gap-3 rounded-none">
              <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-2.5">
                <h2 className="font-cruyff font-black text-base uppercase text-white">
                  DANH SÁCH CẦU THỦ TOTY 99+ ({filteredUtotyList.length})
                </h2>
                <div className="flex items-center border border-white/25 divide-x divide-white/25 bg-black/60">
                  {(
                    [
                      { id: 'all', label: 'Tất Cả' },
                      { id: 'ready', label: 'Đủ ĐK' },
                      { id: 'upgraded', label: 'Đã Nâng' },
                    ] as Array<{ id: FilterMode; label: string }>
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setFilterMode(f.id);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase cursor-pointer rounded-none ${
                        filterMode === f.id
                          ? 'bg-yellow-400 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[470px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                {filteredUtotyList.map((baseCard) => {
                  const isOwned = ownedSet.has(baseCard.id);
                  const isUpgraded = upgradedSet.has(baseCard.id);
                  const isSelected = selectedBaseCard.id === baseCard.id;

                  return (
                    <button
                      key={baseCard.id}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setSelectedPlayerId(baseCard.id);
                      }}
                      className={`p-2.5 border text-left flex items-center gap-2.5 transition-colors cursor-pointer rounded-none ${
                        isSelected
                          ? 'bg-amber-950/45 border-yellow-400'
                          : 'bg-black/60 border-white/20 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={
                          baseCard.avatarUrl ||
                          baseCard.customFrameUrl ||
                          '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png'
                        }
                        alt={baseCard.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 object-contain shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-cruyff font-bold text-xs text-white truncate">
                          {baseCard.name}
                        </div>
                        <div className="font-mono text-[11px] text-yellow-300 tabular-nums">
                          {baseCard.ovr} → {baseCard.ovr + 2} OVR
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">
                          {isUpgraded
                            ? 'Đã nâng UTOTY'
                            : isOwned
                            ? 'Sẵn sàng nâng cấp'
                            : 'Chưa sở hữu'}
                        </div>
                      </div>
                      {!isOwned && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT 7 COLS: BEFORE -> AFTER UTOTY COMPARISON */}
            <div className="lg:col-span-7 p-5 flex flex-col justify-between gap-5 rounded-none">
              <div className="border-b border-white/20 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Nâng Cấp Miễn Phí Khi Sở Hữu Thẻ Gốc 99+
                  </span>
                  <h3 className="font-cruyff font-black text-xl text-white uppercase">
                    {selectedBaseCard.name} · OVR {selectedBaseCard.ovr} → UTOTY OVR{' '}
                    {selectedUpgradedCard.ovr}
                  </h3>
                </div>
                {isSelectedInLineup && (
                  <span className="text-xs text-emerald-300 font-bold uppercase">
                    Tự động cập nhật trong Đội Hình Chính
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 border border-white/20 divide-y sm:divide-y-0 sm:divide-x divide-white/20 bg-black/50">
                <div className="p-4 flex flex-col items-center">
                  <span className="text-xs font-bold uppercase text-slate-300 mb-2">
                    THẺ GỐC TOTY ({selectedBaseCard.ovr} OVR)
                  </span>
                  <FCCard player={selectedBaseCard} size="md" showStats={true} />
                  <span className="mt-2.5 text-xs font-mono font-bold text-slate-300 tabular-nums">
                    Giá chuyển nhượng: {getMarketBuyPrice(selectedBaseCard).toLocaleString('vi-VN')} Xu
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center bg-amber-950/20">
                  <span className="text-xs font-bold uppercase text-yellow-300 mb-2">
                    THẺ NÂNG CẤP UTOTY ({selectedUpgradedCard.ovr} OVR · +2 TẤT CẢ CHỈ SỐ)
                  </span>
                  <FCCard player={selectedUpgradedCard} size="md" showStats={true} />
                  <span className="mt-2.5 text-xs font-mono font-bold text-yellow-300 tabular-nums">
                    Giá chuyển nhượng: {getMarketBuyPrice(selectedUpgradedCard).toLocaleString('vi-VN')} Xu (Giữ nguyên)
                  </span>
                </div>
              </div>

              {justUpgradedId === selectedBaseCard.id && (
                <div className="p-3 border border-emerald-400 bg-emerald-950/50 text-emerald-200 text-xs font-bold uppercase text-center rounded-none">
                  Đã nâng cấp thành công {selectedUpgradedCard.name} lên UTOTY {selectedUpgradedCard.ovr} OVR!
                </div>
              )}

              {isSelectedUpgraded ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToMyTeam();
                  }}
                  className="w-full py-3.5 border border-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 font-cruyff font-black text-sm uppercase tracking-wider cursor-pointer rounded-none"
                >
                  ĐÃ NÂNG CẤP UTOTY · XEM TRONG ĐỘI HÌNH
                </button>
              ) : canExchangeSelected ? (
                <button
                  type="button"
                  onClick={handleConfirmUtotyUpgrade}
                  className="w-full py-3.5 border border-yellow-200 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-sm uppercase tracking-wider cursor-pointer rounded-none"
                >
                  TRAO ĐỔI NÂNG CẤP LÊN UTOTY {selectedUpgradedCard.ovr} OVR
                </button>
              ) : (
                <div className="grid grid-cols-2 divide-x divide-white/25 border border-white/25">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToTickets();
                    }}
                    className="py-3 bg-slate-900 hover:bg-slate-800 text-yellow-300 font-cruyff font-bold text-xs uppercase tracking-wider cursor-pointer rounded-none"
                  >
                    Săn Thẻ Gốc Ở Vé Quay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToMarket();
                    }}
                    className="py-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-cruyff font-bold text-xs uppercase tracking-wider cursor-pointer rounded-none"
                  >
                    Mua Trên Chuyển Nhượng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inspected Shard Player Popover */}
      {shardInspectedPlayer && (
        <div
          onClick={() => setShardInspectedPlayer(null)}
          className="fixed inset-0 z-[72] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full bg-slate-950 border border-yellow-400/60 p-5 flex flex-col items-center gap-3 text-center rounded-none"
          >
            <FCCard player={shardInspectedPlayer} size="lg" showStats={true} />
            <div className="font-cruyff font-black text-xl text-white uppercase">
              {shardInspectedPlayer.fullName || shardInspectedPlayer.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {shardInspectedPlayer.ovr} · {shardInspectedPlayer.position} · {shardInspectedPlayer.club}
            </div>
            <button
              type="button"
              onClick={() => setShardInspectedPlayer(null)}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}

      {/* Walkout Pack Modal when TOTY HM Exchange succeeds */}
      {exchangedHmWalkoutCard && (
        <PackOpeningModal
          fixedPlayer={exchangedHmWalkoutCard}
          packTier="UTOTY"
          packName={`TRAO ĐỔI THÀNH CÔNG · ${exchangedHmWalkoutCard.name} (${exchangedHmWalkoutCard.ovr} OVR)`}
          isTicketSpin={false}
          skipResourceBonus={true}
          ticketsRemaining={user.tickets ?? 0}
          spinCount={1}
          onUseTicket={() => false}
          onClose={() => setExchangedHmWalkoutCard(null)}
          onPlayerClaimed={() => setExchangedHmWalkoutCard(null)}
        />
      )}

      {/* Seasonal Contract Signing Walkout Modal for Shards */}
      {signedShardWalkoutCard && (
        <PackOpeningModal
          fixedPlayer={signedShardWalkoutCard}
          isContractSigning={true}
          isTicketSpin={false}
          skipResourceBonus={true}
          packName={`KÝ HỢP ĐỒNG THÀNH CÔNG · ${signedShardWalkoutCard.name}`}
          onClose={() => setSignedShardWalkoutCard(null)}
          onPlayerClaimed={() => setSignedShardWalkoutCard(null)}
        />
      )}
    </div>
  );
};
