import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Info, RotateCcw, X } from 'lucide-react';
import { soundService } from '../services/sound';
import { resourceRewardAnimService } from '../services/resourceRewardAnim';
import { PlayerCard, UserProfile } from '../types/game';
import { STARTER_OWNED_IDS } from '../data/mockData';
import {
  GINGA_ASSETS,
  garrinchaGingaBox106,
  gingaAllPlayers,
} from '../data/gingaData';
import { FCCard } from './FCCard';
import { ClubBadge, NationBadge, PositionBadge } from './WalkoutBadges';
import { addOwnedPlayerCopies } from '../utils/squadUtils';

export const VAN_DER_SAR_BOX_TURN_COSTS: readonly number[] = [
  2000, // Lượt 1
  2800, // Lượt 2
  3800, // Lượt 3
  5000, // Lượt 4
  6500, // Lượt 5
  8200, // Lượt 6
  10000, // Lượt 7
  12000, // Lượt 8
  14500, // Lượt 9
  17500, // Lượt 10
  21000, // Lượt 11
  25000, // Lượt 12
];

export type VanDerSarBoxRewardTier = 'gold' | 'normal';

export type VanDerSarBoxRewardKind =
  | 'box_ginga_garrincha'
  | 'elite_player_plus_shards'
  | 'player_96_100'
  | 'tickets'
  | 'gems'
  | 'coins'
  | 'shards'
  | 'gingaTokens'
  | 'clubTokens';

export interface VanDerSarBoxRewardDef {
  id: string;
  tier: VanDerSarBoxRewardTier;
  kind: VanDerSarBoxRewardKind;
  title: string;
  countText: string;
  amount: number;
  iconUrl: string;
  weight: number;
}

export const VAN_DER_SAR_BOX_REWARDS: readonly VanDerSarBoxRewardDef[] = [
  // 3 PHẦN THƯỞNG GOLD
  {
    id: 'ginga_box_gold_1',
    tier: 'gold',
    kind: 'box_ginga_garrincha',
    title: 'Garrincha Ginga (106 OVR · RW · Không GD)',
    countText: '106 RW',
    amount: 1,
    iconUrl: '/assets/aistudio/106_garrincha_ginga_box_6df09a67.png',
    weight: 4,
  },
  {
    id: 'ginga_box_gold_2',
    tier: 'gold',
    kind: 'tickets',
    title: '25 Vé Quay',
    countText: 'x25',
    amount: 25,
    iconUrl: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
    weight: 7,
  },
  {
    id: 'ginga_box_gold_3',
    tier: 'gold',
    kind: 'elite_player_plus_shards',
    title: 'Cầu Thủ Ginga 101–105 OVR + 200 Mảnh Ginga',
    countText: '101-105',
    amount: 200,
    iconUrl: GINGA_ASSETS.frameA,
    weight: 8,
  },

  // 9 PHẦN THƯỞNG NORMAL
  {
    id: 'ginga_box_norm_1',
    tier: 'normal',
    kind: 'tickets',
    title: '15 Vé Quay',
    countText: 'x15',
    amount: 15,
    iconUrl: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
    weight: 12,
  },
  {
    id: 'ginga_box_norm_2',
    tier: 'normal',
    kind: 'coins',
    title: '5.000.000 Xu',
    countText: 'x5,000,000',
    amount: 5000000,
    iconUrl: '/assets/aistudio/currencysmall_COIN_ec777114.png',
    weight: 16,
  },
  {
    id: 'ginga_box_norm_3',
    tier: 'normal',
    kind: 'tickets',
    title: '5 Vé Quay',
    countText: 'x5',
    amount: 5,
    iconUrl: '/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png',
    weight: 18,
  },
  {
    id: 'ginga_box_norm_4',
    tier: 'normal',
    kind: 'gingaTokens',
    title: '700 Token Ginga',
    countText: 'x700',
    amount: 700,
    iconUrl: GINGA_ASSETS.pointIcon,
    weight: 16,
  },
  {
    id: 'ginga_box_norm_5',
    tier: 'normal',
    kind: 'clubTokens',
    title: '500 Token Câu Lạc Bộ',
    countText: 'x500',
    amount: 500,
    iconUrl: '/assets/aistudio/club_token_908dbb4a.png',
    weight: 18,
  },
  {
    id: 'ginga_box_norm_6',
    tier: 'normal',
    kind: 'player_96_100',
    title: 'Cầu Thủ Ginga 96–100 OVR (Không GD)',
    countText: '96-100',
    amount: 1,
    iconUrl: GINGA_ASSETS.frameBC,
    weight: 15,
  },
  {
    id: 'ginga_box_norm_7',
    tier: 'normal',
    kind: 'gems',
    title: '5.000 Kim Cương',
    countText: 'x5,000',
    amount: 5000,
    iconUrl: '/assets/aistudio/currencysmall_CASH_b2121428.png',
    weight: 12,
  },
  {
    id: 'ginga_box_norm_8',
    tier: 'normal',
    kind: 'shards',
    title: '150 Mảnh Ginga',
    countText: 'x150',
    amount: 150,
    iconUrl: GINGA_ASSETS.shardsIcon,
    weight: 16,
  },
  {
    id: 'ginga_box_norm_9',
    tier: 'normal',
    kind: 'coins',
    title: '2.000.000 Xu',
    countText: 'x2,000,000',
    amount: 2000000,
    iconUrl: '/assets/aistudio/currencysmall_COIN_ec777114.png',
    weight: 18,
  },
];

interface PendingBoxResult {
  reward: VanDerSarBoxRewardDef;
  awardedPlayer?: PlayerCard;
  turnNumber: number;
}

export interface VanDerSarBoxSectionProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenShop: () => void;
}

export const VanDerSarBoxSection: React.FC<VanDerSarBoxSectionProps> = ({
  user,
  onUpdateUser,
  onOpenShop,
}) => {
  const [phase, setPhase] = useState<
    'idle' | 'shooting' | 'toty_video1' | 'toty_video2' | 'reward_popup'
  >('idle');
  const [pendingResult, setPendingResult] = useState<PendingBoxResult | null>(null);
  const [isBtnPressed, setIsBtnPressed] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [noticeText, setNoticeText] = useState<string | null>(null);
  const [totyCurrentTime, setTotyCurrentTime] = useState<number>(0);
  const drawLockRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const totyVideo1Ref = useRef<HTMLVideoElement | null>(null);
  const totyVideo2Ref = useRef<HTMLVideoElement | null>(null);
  const totyRafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (totyRafRef.current) cancelAnimationFrame(totyRafRef.current);
      soundService.stopAllPackAnimationAudio();
      resourceRewardAnimService.setSuppressed('vds_box', false);
      soundService.resumeBgmAfterPack();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'shooting') return;
    const vid = videoRef.current;
    if (!vid) return;

    vid.currentTime = 0;
    const playPromise = vid.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [phase, pendingResult]);

  // TOTY Walkout Video 1 (Blurred fade-in/out Nation -> Position -> Icons Club timing, identical to PackOpeningModal)
  useEffect(() => {
    if (phase !== 'toty_video1') {
      if (totyRafRef.current) cancelAnimationFrame(totyRafRef.current);
      setTotyCurrentTime(0);
      return;
    }

    soundService.playGingaWalkoutIntro();
    const startWallMs = performance.now();
    const vid = totyVideo1Ref.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }

    const updateTimeline = () => {
      const videoSec = totyVideo1Ref.current ? totyVideo1Ref.current.currentTime : 0;
      const wallSec = (performance.now() - startWallMs) / 1000;
      setTotyCurrentTime(videoSec > 0.05 ? videoSec : wallSec);
      totyRafRef.current = requestAnimationFrame(updateTimeline);
    };

    totyRafRef.current = requestAnimationFrame(updateTimeline);
    return () => {
      if (totyRafRef.current) cancelAnimationFrame(totyRafRef.current);
    };
  }, [phase]);

  // Ginga Walkout Video 2 (Looping Ginga tunnel + Garrincha 106 card reveal)
  useEffect(() => {
    if (phase !== 'toty_video2') return;
    soundService.playGingaLoopOnce();
    const vid = totyVideo2Ref.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
    try {
      confetti({
        particleCount: 130,
        spread: 100,
        origin: { y: 0.52 },
      });
    } catch {
      // ignore
    }
  }, [phase]);

  const claimedIds = useMemo(() => {
    const validIds = new Set(VAN_DER_SAR_BOX_REWARDS.map((r) => r.id));
    return (user.gingaBoxClaimedIds ?? []).filter((id) => validIds.has(id));
  }, [user.gingaBoxClaimedIds]);

  const claimedSet = useMemo(() => new Set(claimedIds), [claimedIds]);
  const turnsCompleted = Math.min(12, claimedIds.length);
  const isAllClaimed = turnsCompleted >= 12;
  const currentTurnCost =
    VAN_DER_SAR_BOX_TURN_COSTS[Math.min(11, turnsCompleted)] ?? 25000;

  const markBoxPlayerUntradeable = (card: PlayerCard): PlayerCard => ({
    ...card,
    isExchangeExclusive: true,
    isUntradeableOnly: true,
    isTradeable: false,
    priceEstimate: 'Không giao dịch',
  });

  const pickRandomElitePlayer = (): PlayerCard => {
    const pool = gingaAllPlayers.filter(
      (p) => p.ovr >= 101 && p.ovr <= 105 && !p.isUntradeableOnly
    );
    const chosen = pool[Math.floor(Math.random() * pool.length)] || gingaAllPlayers[1] || gingaAllPlayers[0];
    return markBoxPlayerUntradeable(chosen);
  };

  const pickRandom96To100Player = (): PlayerCard => {
    const pool = gingaAllPlayers.filter(
      (p) => p.ovr >= 96 && p.ovr <= 100 && !p.isUntradeableOnly
    );
    const chosen = pool[Math.floor(Math.random() * pool.length)] || gingaAllPlayers[4] || gingaAllPlayers[0];
    return markBoxPlayerUntradeable(chosen);
  };

  const handleDrawTurn = () => {
    if (drawLockRef.current || phase !== 'idle') return;

    if (isAllClaimed) {
      setNoticeText('Bạn đã nhận trọn bộ 12/12 phần thưởng Box Ginga!');
      setTimeout(() => setNoticeText(null), 2600);
      return;
    }

    if (user.gems < currentTurnCost) {
      soundService.playClick();
      setNoticeText(
        `Cần ${currentTurnCost.toLocaleString('vi-VN')} Kim Cương cho Lượt ${
          turnsCompleted + 1
        }/12!`
      );
      setTimeout(() => setNoticeText(null), 2800);
      onOpenShop();
      return;
    }

    const remainingRewards = VAN_DER_SAR_BOX_REWARDS.filter(
      (r) => !claimedSet.has(r.id)
    );
    if (remainingRewards.length === 0) return;

    drawLockRef.current = true;
    resourceRewardAnimService.setSuppressed('vds_box', true);
    soundService.playConfirmSelection();

    // Weighted random draw without replacement
    const totalWeight = remainingRewards.reduce((acc, r) => acc + r.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = remainingRewards[remainingRewards.length - 1];
    for (const candidate of remainingRewards) {
      roll -= candidate.weight;
      if (roll <= 0) {
        chosen = candidate;
        break;
      }
    }

    let awardedPlayer: PlayerCard | undefined;
    if (chosen.kind === 'box_ginga_garrincha') {
      awardedPlayer = garrinchaGingaBox106;
    } else if (chosen.kind === 'elite_player_plus_shards') {
      awardedPlayer = pickRandomElitePlayer();
    } else if (chosen.kind === 'player_96_100') {
      awardedPlayer = pickRandom96To100Player();
    }

    const turnNum = turnsCompleted + 1;
    const spent = currentTurnCost;

    onUpdateUser((prev) => {
      const nextClaimed = Array.from(
        new Set([...(prev.gingaBoxClaimedIds ?? []), chosen.id])
      );
      const existingOwned = prev.ownedPlayerIds?.length
        ? prev.ownedPlayerIds
        : STARTER_OWNED_IDS;
      const nextOwned = awardedPlayer
        ? addOwnedPlayerCopies(existingOwned, [awardedPlayer.id])
        : [...existingOwned];
      const nextTradeable = new Set(prev.tradeablePlayerIds ?? []);
      if (awardedPlayer) {
        nextTradeable.delete(awardedPlayer.id);
      }

      return {
        gems: prev.gems - spent + (chosen.kind === 'gems' ? chosen.amount : 0),
        coins: prev.coins + (chosen.kind === 'coins' ? chosen.amount : 0),
        tickets: (prev.tickets ?? 0) + (chosen.kind === 'tickets' ? chosen.amount : 0),
        gingaShards:
          (prev.gingaShards ?? 0) +
          (chosen.kind === 'shards' || chosen.kind === 'elite_player_plus_shards'
            ? chosen.amount
            : 0),
        gingaTokens:
          (prev.gingaTokens ?? 0) + (chosen.kind === 'gingaTokens' ? chosen.amount : 0),
        clubTokens:
          (prev.clubTokens ?? 0) + (chosen.kind === 'clubTokens' ? chosen.amount : 0),
        ownedPlayerIds: nextOwned,
        tradeablePlayerIds: Array.from(nextTradeable),
        gingaBoxClaimedIds: nextClaimed,
      };
    });

    soundService.pauseBgmForPack();
    setPendingResult({
      reward: chosen,
      awardedPlayer,
      turnNumber: turnNum,
    });
    setPhase('shooting');
  };

  const handleShotComplete = () => {
    if (pendingResult?.reward.kind === 'box_ginga_garrincha') {
      setPhase('toty_video1');
      return;
    }

    setPhase('reward_popup');
    soundService.playTrophy();
    if (pendingResult?.reward.tier === 'gold') {
      try {
        confetti({
          particleCount: 110,
          spread: 95,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleTotyVideo1Ended = () => {
    setTotyCurrentTime(0);
    setPhase('toty_video2');
  };

  const getTotyFadingStyle = (
    start: number,
    end: number,
    fadeInDuration: number = 0.5,
    fadeOutDuration: number = 0.5
  ) => {
    if (totyCurrentTime < start || totyCurrentTime > end) {
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
    if (totyCurrentTime < start + fadeInDuration) {
      const progress = (totyCurrentTime - start) / fadeInDuration;
      opacity = Math.max(0, Math.min(1, progress));
      blur = (1 - progress) * 12;
      scale = 1.15 - progress * 0.15;
    } else if (totyCurrentTime > end - fadeOutDuration) {
      const progress = (end - totyCurrentTime) / fadeOutDuration;
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

  const vdsNationStyle = getTotyFadingStyle(1.0, 2.5, 0.45, 0.4);
  const vdsPositionStyle = getTotyFadingStyle(2.7, 4.2, 0.45, 0.4);
  const vdsClubStyle = getTotyFadingStyle(4.4, 6.0, 0.45, 0.4);

  const handleFinishTotyWalkout = () => {
    soundService.playClick();
    soundService.stopAllPackAnimationAudio();
    soundService.playTrophy();
    setPhase('reward_popup');
  };

  const handleClaimPopupClose = () => {
    soundService.playConfirmSelection();
    soundService.stopAllPackAnimationAudio();
    soundService.resumeBgmAfterPack();
    setPhase('idle');
    setPendingResult(null);
    drawLockRef.current = false;
    setTimeout(() => {
      resourceRewardAnimService.setSuppressed('vds_box', false);
    }, 120);
  };

  const handleResetBox = () => {
    if (!isAllClaimed) return;
    soundService.playClick();
    onUpdateUser({ gingaBoxClaimedIds: [] });
  };

  const boxVideoSrc =
    pendingResult?.reward.tier === 'gold'
      ? '/assets/aistudio/animation_box_gold_1ef933ca.mp4'
      : '/assets/aistudio/animation_box_normal_37025496.mp4';

  return (
    <div className="relative flex-1 min-w-0 flex flex-col justify-between overflow-hidden select-none font-cruyff bg-[#03140b]">
      {/* 1. UNMODIFIED OFFICIAL GINGA BOX BACKGROUND */}
      <img
        src={GINGA_ASSETS.boxBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/65 pointer-events-none z-0" />

      {noticeText && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[95] px-5 py-2 bg-slate-950/90 text-white font-cruyff font-bold text-xs sm:text-sm uppercase tracking-wider">
          {noticeText}
        </div>
      )}

      {/* TOP TITLE ROW */}
      <div className="relative z-10 px-4 sm:px-6 pt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-white tracking-wide drop-shadow">
            Box Ginga · Garrincha 106 OVR
          </h2>
          <span className="px-2 py-0.5 bg-rose-950/90 border border-rose-400/70 text-rose-200 text-[10px] font-black uppercase">
            KHÔNG GIAO DỊCH
          </span>
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setShowInfoModal(true);
            }}
            className="w-7 h-7 rounded-full border-2 border-white/80 hover:border-white bg-white/10 flex items-center justify-center text-white cursor-pointer"
            title="Thông tin 12 lượt mở"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs sm:text-sm font-bold text-white/90">
          Lượt đã mở: <span className="font-mono font-black">{turnsCompleted}/12</span>
        </div>
      </div>

      {/* MAIN CONTENT: LEFT GARRINCHA PORTRAIT + COMPACT DRAW BUTTON | RIGHT 12-TILE BOARD */}
      <div className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 px-4 sm:px-6 py-2 items-center overflow-y-auto xl:overflow-hidden">
        {/* LEFT: GARRINCHA BOX HERO + DRAW BUTTON */}
        <div className="xl:col-span-5 flex flex-row items-center justify-center gap-2 sm:gap-3 min-h-[300px] sm:min-h-[380px] xl:min-h-[430px]">
          <div className="relative flex flex-col items-center justify-center shrink min-w-0">
            <img
              src="/assets/aistudio/106_garrincha_ginga_box_6df09a67.png"
              alt="Garrincha 106 Ginga Box"
              className="h-[290px] sm:h-[370px] lg:h-[410px] xl:h-[430px] w-auto object-contain pointer-events-none select-none drop-shadow-[0_14px_32px_rgba(250,204,21,0.48)]"
            />
            <div className="absolute -left-2 bottom-2">
              <FCCard player={garrinchaGingaBox106} size="xs" showStats={false} />
            </div>
          </div>

          {/* SMALLER OFFICIAL DRAW BUTTON PLACED BESIDE PLAYER IMAGE (128x96 = 4:3) */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            {isAllClaimed ? (
              <button
                type="button"
                onClick={handleResetBox}
                className="relative w-32 sm:w-36 aspect-[4/3] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <img
                  src="/assets/aistudio/box_TOTY26_BG_BTN_NORMAL_2b37f590.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                />
                <span className="relative z-10 flex items-center gap-1 font-cruyff font-black text-[11px] sm:text-xs uppercase text-[#0A1E52]">
                  <RotateCcw className="w-3 h-3" />
                  <span>Làm Mới</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onPointerDown={() => setIsBtnPressed(true)}
                onPointerUp={() => setIsBtnPressed(false)}
                onPointerLeave={() => setIsBtnPressed(false)}
                onClick={handleDrawTurn}
                className="relative w-32 sm:w-36 aspect-[4/3] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <img
                  src={
                    isBtnPressed
                      ? '/assets/aistudio/box_TOTY26_BG_BTN_PRESS_01593156.png'
                      : '/assets/aistudio/box_TOTY26_BG_BTN_NORMAL_2b37f590.png'
                  }
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                />
                <div className="relative z-10 flex items-center gap-1 font-cruyff font-black text-[#0A1E52] text-xs sm:text-sm">
                  <img
                    src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                    alt="Kim Cương"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="font-mono tabular-nums">
                    {currentTurnCost.toLocaleString('vi-VN')}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: 12 REWARD TILES (3 GOLD ON GINGA PREMIUM FRAME + 9 NORMAL ON GINGA NORMAL FRAME) */}
        <div className="xl:col-span-7 flex flex-col items-center justify-center gap-2.5">
          <div className="w-full grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {VAN_DER_SAR_BOX_REWARDS.map((item) => {
              const isClaimed = claimedSet.has(item.id);
              const tileSrc =
                item.tier === 'gold'
                  ? GINGA_ASSETS.rewardFramePremium
                  : GINGA_ASSETS.rewardFrameNormal;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundService.playClick();
                    setShowInfoModal(true);
                  }}
                  className={`relative aspect-[30/23] flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.03] ${
                    isClaimed ? 'opacity-45' : ''
                  }`}
                >
                  {/* Unmodified Official Ginga Reward Frame PNG */}
                  <img
                    src={tileSrc}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
                  />

                  {/* Reward Icon + Count Text */}
                  <div className="relative z-10 flex flex-col items-center justify-center px-2 pt-0.5">
                    {item.kind === 'box_ginga_garrincha' ? (
                      <div className="scale-[0.64] sm:scale-[0.7] -my-5 pointer-events-none">
                        <FCCard
                          player={garrinchaGingaBox106}
                          size="xs"
                          showStats={false}
                        />
                      </div>
                    ) : (
                      <>
                        <img
                          src={item.iconUrl}
                          alt={item.title}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-contain pointer-events-none select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
                        />
                        <span className="mt-0.5 font-cruyff font-black text-[11px] sm:text-xs leading-none text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]">
                          {item.countText}
                        </span>
                      </>
                    )}
                  </div>

                  {isClaimed && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-slate-950/75 flex items-center justify-center text-white">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative w-full max-w-2xl aspect-[46/5] flex items-center justify-center">
            <img
              src="/assets/aistudio/box_TOTY26_BG_REMOVE_8820e905.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
            />
            <span className="relative z-10 text-xs sm:text-sm font-cruyff font-bold text-white tracking-wide px-4 text-center">
              Phần thưởng đã nhận không lặp lại · Mọi cầu thủ Box Ginga Không Giao Dịch ({12 - turnsCompleted}/12 còn lại)
            </span>
          </div>
        </div>
      </div>

      {/* INFO MODAL (12 TURN COSTS & ODDS) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#042414] border border-emerald-400/40 p-5 max-h-[86vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cruyff font-black text-lg text-white uppercase">
                Thông Tin Box Ginga · Garrincha 106 OVR (12 Lượt)
              </h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center py-2 bg-black/35 border border-emerald-400/25">
              <FCCard player={garrinchaGingaBox106} size="md" showStats={true} />
            </div>

            <div>
              <div className="text-xs font-bold uppercase text-emerald-200 mb-2">
                Giá Kim Cương từng lượt (Tất cả cầu thủ nhận từ Box Ginga đều KHÔNG GIAO DỊCH ĐƯỢC):
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {VAN_DER_SAR_BOX_TURN_COSTS.map((cost, idx) => (
                  <div
                    key={idx}
                    className={`p-2 text-center border text-xs ${
                      idx < turnsCompleted
                        ? 'bg-white/5 border-white/10 text-white/40 line-through'
                        : idx === turnsCompleted
                        ? 'bg-sky-400/25 border-white text-white font-black'
                        : 'bg-black/30 border-white/15 text-slate-200'
                    }`}
                  >
                    <div>Lượt {idx + 1}</div>
                    <div className="font-mono font-bold">
                      {cost.toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 100% UNMODIFIED ORIGINAL UPLOADED BOX VIDEO (GOLD OR NORMAL) */}
      {phase === 'shooting' && pendingResult && (
        <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={boxVideoSrc}
            autoPlay
            playsInline
            onEnded={handleShotComplete}
            onError={handleShotComplete}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* GINGA WALKOUT PHASE 1 FOR GARRINCHA 106 OVR */}
      {phase === 'toty_video1' && pendingResult && (
        <div className="fixed inset-0 z-[115] bg-black flex items-center justify-center overflow-hidden select-none">
          <video
            ref={totyVideo1Ref}
            src={GINGA_ASSETS.videoWalkoutIntro}
            autoPlay
            muted
            playsInline
            onEnded={handleTotyVideo1Ended}
            onError={handleTotyVideo1Ended}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* WALKOUT OVERLAYS: Nation, Position & Club */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div style={vdsNationStyle}>
              <NationBadge
                nation={garrinchaGingaBox106.nation}
                flagUrl={garrinchaGingaBox106.nationFlag}
              />
            </div>
            <div style={vdsPositionStyle}>
              <PositionBadge position={garrinchaGingaBox106.position} />
            </div>
            <div style={vdsClubStyle}>
              <ClubBadge
                club={garrinchaGingaBox106.club}
                logoUrl={garrinchaGingaBox106.clubLogo}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleTotyVideo1Ended}
            className="absolute top-6 right-6 z-20 px-4 py-2 bg-black/65 hover:bg-black/85 border border-white/25 text-white font-cruyff font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Bỏ Qua &gt;&gt;
          </button>
        </div>
      )}

      {/* GINGA WALKOUT PHASE 2 FOR GARRINCHA 106 OVR */}
      {phase === 'toty_video2' && pendingResult && (
        <div
          onClick={handleFinishTotyWalkout}
          className="fixed inset-0 z-[115] bg-black flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
        >
          <video
            ref={totyVideo2Ref}
            src={GINGA_ASSETS.videoStageLoop}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          <div
            className="animate-loop-entry-flash absolute inset-0 pointer-events-none z-10 mix-blend-screen"
            style={{
              background:
                'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(16,185,129,0.58) 34%, rgba(250,204,21,0.32) 62%, transparent 82%)',
            }}
          />

          <div className="relative z-15 flex flex-col items-center justify-center gap-4 px-4">
            <div className="font-cruyff font-black text-2xl sm:text-4xl text-yellow-300 uppercase tracking-widest text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
              BIỂU TƯỢNG BOX GINGA · 106 OVR!
            </div>

            <div className="relative flex flex-col items-center">
              <div
                className="animate-walkout-flare-overlay absolute -inset-10 rounded-full pointer-events-none z-0"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.68) 38%, rgba(16,185,129,0.28) 68%, transparent 80%)',
                  filter: 'blur(18px)',
                }}
              />
              <div className="relative z-10 flex flex-col items-center animate-walkout-glow-fade">
                <FCCard
                  player={garrinchaGingaBox106}
                  size="hero"
                  showStats={true}
                />
                <div
                  className="animate-walkout-flare-overlay absolute inset-6 rounded-3xl pointer-events-none mix-blend-screen"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.88) 0%, rgba(254,240,138,0.5) 45%, transparent 75%)',
                  }}
                />
              </div>
            </div>

            <div className="font-cruyff font-bold text-sm sm:text-base text-white/95 uppercase tracking-widest bg-black/65 px-5 py-2 border border-white/20">
              Chạm vào màn hình để tiếp tục
            </div>
          </div>
        </div>
      )}

      {/* GINGA POST-ANIMATION REWARD POPUP */}
      {phase === 'reward_popup' && pendingResult && (
        <div
          onClick={handleClaimPopupClose}
          className="fixed inset-0 z-[110] bg-black/80 flex flex-col items-center justify-center select-none cursor-pointer"
        >
          {/* Full-width horizontal Ginga reward banner */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full min-h-[250px] sm:min-h-[330px] py-8 sm:py-10 flex flex-col items-center justify-center overflow-hidden"
          >
            <img
              src={GINGA_ASSETS.boxRewardPopupBanner}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
            />

            <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="font-cruyff font-black text-xl sm:text-2xl text-slate-950 uppercase tracking-wider drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                {pendingResult.reward.title}
              </div>

              {pendingResult.awardedPlayer ? (
                <FCCard
                  player={pendingResult.awardedPlayer}
                  size="md"
                  showStats={true}
                />
              ) : (
                <div className="relative w-44 aspect-[30/23] flex flex-col items-center justify-center">
                  <img
                    src={
                      pendingResult.reward.tier === 'gold'
                        ? GINGA_ASSETS.rewardFramePremium
                        : GINGA_ASSETS.rewardFrameNormal
                    }
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  />
                  <img
                    src={pendingResult.reward.iconUrl}
                    alt={pendingResult.reward.title}
                    className="relative z-10 w-16 h-16 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]"
                  />
                  <span className="relative z-10 mt-1 font-cruyff font-black text-sm text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]">
                    {pendingResult.reward.countText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Pure box_TOTY26_BG_BTN_NORMAL Claim Button (128x96 = 4:3) */}
          <button
            type="button"
            onPointerDown={() => setIsBtnPressed(true)}
            onPointerUp={() => setIsBtnPressed(false)}
            onPointerLeave={() => setIsBtnPressed(false)}
            onClick={handleClaimPopupClose}
            className="relative mt-2 w-36 sm:w-40 aspect-[4/3] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <img
              src={
                isBtnPressed
                  ? '/assets/aistudio/box_TOTY26_BG_BTN_PRESS_01593156.png'
                  : '/assets/aistudio/box_TOTY26_BG_BTN_NORMAL_2b37f590.png'
              }
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            <span className="relative z-10 font-cruyff font-black text-xs uppercase text-[#0A1E52] tracking-wider">
              Tiếp Tục
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
