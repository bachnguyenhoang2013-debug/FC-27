import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import { PackTier } from './PackOpeningModal';
import { TopSectionHeader } from './TopSectionHeader';
import { FCCard } from './FCCard';
import { baresiBallonDor102, STARTER_OWNED_IDS } from '../data/mockData';
import { soundService } from '../services/sound';

export interface BallonDorStreakStep {
  step: number;
  title: string;
  rewardLabel: string;
  subLabel: string;
  costGems: number;
  rewardType: 'coins' | 'gems' | 'tickets' | 'pack' | 'baresi';
  rewardAmount?: number;
  packTier?: PackTier;
  packTitle?: string;
  iconSrc: string;
}

export const BALLON_DOR_STREAK_STEPS: BallonDorStreakStep[] = [
  {
    step: 1,
    title: 'BƯỚC 01',
    rewardLabel: '+500 Xu',
    subLabel: 'Ngân sách CLB khởi đầu',
    costGems: 0,
    rewardType: 'coins',
    rewardAmount: 500,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 2,
    title: 'BƯỚC 02',
    rewardLabel: '+50 Kim Cương',
    subLabel: 'Quà Kim Cương miễn phí',
    costGems: 0,
    rewardType: 'gems',
    rewardAmount: 50,
    iconSrc: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  },
  {
    step: 3,
    title: 'BƯỚC 03',
    rewardLabel: '+1 Vé Quay',
    subLabel: 'Vé Quay Siêu Sao',
    costGems: 0,
    rewardType: 'tickets',
    rewardAmount: 1,
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    step: 4,
    title: 'BƯỚC 04',
    rewardLabel: 'Cầu Thủ Hỗn Hợp 83+ OVR',
    subLabel: "Gói Ballon d'Or 83+",
    costGems: 500,
    rewardType: 'pack',
    packTier: 'MIXED_83_PLUS',
    packTitle: "CHUỖI BALLON D'OR · CẦU THỦ HỖN HỢP 83+ OVR",
    iconSrc: '/assets/aistudio/Ballon_Dor_pack_23a61757.png',
  },
  {
    step: 5,
    title: 'BƯỚC 05',
    rewardLabel: '+5.000 Xu',
    subLabel: 'Ngân sách CLB nâng cao',
    costGems: 0,
    rewardType: 'coins',
    rewardAmount: 5000,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 6,
    title: 'BƯỚC 06',
    rewardLabel: '+100 Kim Cương',
    subLabel: 'Quà Kim Cương miễn phí',
    costGems: 0,
    rewardType: 'gems',
    rewardAmount: 100,
    iconSrc: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  },
  {
    step: 7,
    title: 'BƯỚC 07',
    rewardLabel: '+2 Vé Quay',
    subLabel: 'Vé Quay Siêu Sao',
    costGems: 0,
    rewardType: 'tickets',
    rewardAmount: 2,
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    step: 8,
    title: 'BƯỚC 08',
    rewardLabel: 'Cầu Thủ Hỗn Hợp 86+ OVR',
    subLabel: "Gói Ballon d'Or 86+",
    costGems: 1000,
    rewardType: 'pack',
    packTier: 'MIXED_86_PLUS',
    packTitle: "CHUỖI BALLON D'OR · CẦU THỦ HỖN HỢP 86+ OVR",
    iconSrc: '/assets/aistudio/Ballon_Dor_pack_23a61757.png',
  },
  {
    step: 9,
    title: 'BƯỚC 09',
    rewardLabel: '+10.000 Xu',
    subLabel: 'Ngân sách chuyển nhượng',
    costGems: 0,
    rewardType: 'coins',
    rewardAmount: 10000,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 10,
    title: 'BƯỚC 10',
    rewardLabel: '+200 Kim Cương',
    subLabel: 'Quà Kim Cương miễn phí',
    costGems: 0,
    rewardType: 'gems',
    rewardAmount: 200,
    iconSrc: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  },
  {
    step: 11,
    title: 'BƯỚC 11',
    rewardLabel: '+3 Vé Quay',
    subLabel: 'Vé Quay Siêu Sao',
    costGems: 0,
    rewardType: 'tickets',
    rewardAmount: 3,
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    step: 12,
    title: 'BƯỚC 12',
    rewardLabel: 'Cầu Thủ Hỗn Hợp 90+ OVR',
    subLabel: "Gói Ballon d'Or 90+ (Walkout)",
    costGems: 5000,
    rewardType: 'pack',
    packTier: 'MIXED_90_PLUS',
    packTitle: "CHUỖI BALLON D'OR · CẦU THỦ HỖN HỢP 90+ OVR",
    iconSrc: '/assets/aistudio/Ballon_Dor_pack_23a61757.png',
  },
  {
    step: 13,
    title: 'BƯỚC 13',
    rewardLabel: '+100.000 Xu',
    subLabel: 'Tiếp tế ngân sách lớn',
    costGems: 0,
    rewardType: 'coins',
    rewardAmount: 100000,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 14,
    title: 'BƯỚC 14',
    rewardLabel: '+500 Kim Cương',
    subLabel: 'Quà Kim Cương miễn phí',
    costGems: 0,
    rewardType: 'gems',
    rewardAmount: 500,
    iconSrc: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  },
  {
    step: 15,
    title: 'BƯỚC 15',
    rewardLabel: '+5 Vé Quay',
    subLabel: 'Vé Quay Siêu Sao',
    costGems: 0,
    rewardType: 'tickets',
    rewardAmount: 5,
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    step: 16,
    title: 'BƯỚC 16',
    rewardLabel: 'Cầu Thủ Hỗn Hợp 94+ OVR',
    subLabel: "Gói Ballon d'Or 94+ (Walkout)",
    costGems: 7500,
    rewardType: 'pack',
    packTier: 'MIXED_94_PLUS',
    packTitle: "CHUỖI BALLON D'OR · CẦU THỦ HỖN HỢP 94+ OVR",
    iconSrc: '/assets/aistudio/Ballon_Dor_pack_23a61757.png',
  },
  {
    step: 17,
    title: 'BƯỚC 17',
    rewardLabel: '+200.000 Xu',
    subLabel: 'Quỹ huấn luyện toàn đội',
    costGems: 0,
    rewardType: 'coins',
    rewardAmount: 200000,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 18,
    title: 'BƯỚC 18',
    rewardLabel: '+1.000 Kim Cương',
    subLabel: 'Quà Kim Cương miễn phí',
    costGems: 0,
    rewardType: 'gems',
    rewardAmount: 1000,
    iconSrc: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  },
  {
    step: 19,
    title: 'BƯỚC 19',
    rewardLabel: '+7 Vé Quay',
    subLabel: 'Vé Quay Siêu Sao',
    costGems: 0,
    rewardType: 'tickets',
    rewardAmount: 7,
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    step: 20,
    title: 'BƯỚC 20',
    rewardLabel: 'Cầu Thủ Hỗn Hợp 98+ OVR',
    subLabel: "Gói Ballon d'Or 98+ (Walkout)",
    costGems: 10000,
    rewardType: 'pack',
    packTier: 'MIXED_98_PLUS',
    packTitle: "CHUỖI BALLON D'OR · CẦU THỦ HỖN HỢP 98+ OVR",
    iconSrc: '/assets/aistudio/Ballon_Dor_pack_23a61757.png',
  },
  {
    step: 21,
    title: 'BƯỚC 21',
    rewardLabel: '+500.000 Xu',
    subLabel: 'Kho báu Xu CLB',
    costGems: 0,
    rewardType: 'coins',
    rewardAmount: 500000,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 22,
    title: 'BƯỚC 22',
    rewardLabel: '+1.000 Kim Cương',
    subLabel: 'Quà Kim Cương miễn phí',
    costGems: 0,
    rewardType: 'gems',
    rewardAmount: 1000,
    iconSrc: '/assets/aistudio/currencysmall_CASH_b2121428.png',
  },
  {
    step: 23,
    title: 'BƯỚC 23',
    rewardLabel: '+9 Vé Quay',
    subLabel: 'Vé Quay Siêu Sao',
    costGems: 0,
    rewardType: 'tickets',
    rewardAmount: 9,
    iconSrc: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
  },
  {
    step: 24,
    title: 'BƯỚC 24',
    rewardLabel: '+1 Xu',
    subLabel: 'Chìa khóa mở khóa Franco Baresi 102',
    costGems: 20000,
    rewardType: 'coins',
    rewardAmount: 1,
    iconSrc: '/assets/aistudio/currencysmall_COIN_ec777114.png',
  },
  {
    step: 25,
    title: 'BƯỚC 25 · CUỐI',
    rewardLabel: 'Franco Baresi 102 OVR',
    subLabel: "CB · Ballon d'Or Icons (Miễn Phí)",
    costGems: 0,
    rewardType: 'baresi',
    iconSrc: '/assets/aistudio/baresi_100_ovr_ballon_dor_166dab27.png',
  },
];

interface BallonDorStreakModalProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenRewardPack: (tier: PackTier, customName: string) => void;
  onOpenFixedWalkout: (player: PlayerCard, customTitle: string) => void;
  onClickGems?: () => void;
  onClickTickets?: () => void;
  onClickShards?: () => void;
  onClose: () => void;
}

export const BallonDorStreakModal: React.FC<BallonDorStreakModalProps> = ({
  user,
  onUpdateUser,
  onOpenRewardPack,
  onOpenFixedWalkout,
  onClickGems,
  onClickTickets,
  onClickShards,
  onClose,
}) => {
  const [notice, setNotice] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);

  const claimedSteps = useMemo(
    () => new Set(user.ballonDorStreakClaimedSteps ?? []),
    [user.ballonDorStreakClaimedSteps]
  );

  const nextAvailableStep = useMemo(() => {
    for (const s of BALLON_DOR_STREAK_STEPS) {
      if (!claimedSteps.has(s.step)) return s.step;
    }
    return BALLON_DOR_STREAK_STEPS.length + 1;
  }, [claimedSteps]);

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 2800);
  };

  const handleClaimStep = (item: BallonDorStreakStep) => {
    if (claimedSteps.has(item.step)) {
      soundService.playClick();
      showToast(`Bạn đã nhận phần thưởng ${item.title} rồi!`, 'error');
      return;
    }

    if (item.step !== nextAvailableStep) {
      soundService.playClick();
      showToast(
        `Hãy nhận lần lượt từng bước theo chuỗi! Bước tiếp theo là Bước ${String(
          nextAvailableStep
        ).padStart(2, '0')}.`,
        'error'
      );
      return;
    }

    if (item.costGems > 0 && user.gems < item.costGems) {
      soundService.playTrophy();
      showToast(
        `Không đủ Kim Cương! Cần thêm ${(item.costGems - user.gems).toLocaleString(
          'vi-VN'
        )} Kim Cương để mở ${item.title}.`,
        'error'
      );
      return;
    }

    const nextClaimed = Array.from(
      new Set([...(user.ballonDorStreakClaimedSteps ?? []), item.step])
    );

    if (item.rewardType === 'coins') {
      soundService.playCoins();
      onUpdateUser((prev) => ({
        gems: prev.gems - item.costGems,
        coins: prev.coins + (item.rewardAmount ?? 0),
        ballonDorStreakClaimedSteps: nextClaimed,
      }));
      showToast(
        `${item.title}: Nhận thành công ${(item.rewardAmount ?? 0).toLocaleString('vi-VN')} Xu!`
      );
      return;
    }

    if (item.rewardType === 'gems') {
      soundService.playCoins();
      onUpdateUser((prev) => ({
        gems: prev.gems - item.costGems + (item.rewardAmount ?? 0),
        ballonDorStreakClaimedSteps: nextClaimed,
      }));
      showToast(
        `${item.title}: Nhận thành công +${(item.rewardAmount ?? 0).toLocaleString(
          'vi-VN'
        )} Kim Cương!`
      );
      return;
    }

    if (item.rewardType === 'tickets') {
      soundService.playCoins();
      onUpdateUser((prev) => ({
        gems: prev.gems - item.costGems,
        tickets: (prev.tickets ?? 0) + (item.rewardAmount ?? 0),
        ballonDorStreakClaimedSteps: nextClaimed,
      }));
      showToast(`${item.title}: Nhận thành công +${item.rewardAmount ?? 0} Vé Quay!`);
      return;
    }

    if (item.rewardType === 'pack' && item.packTier) {
      soundService.playPackTear();
      onUpdateUser((prev) => ({
        gems: prev.gems - item.costGems,
        ballonDorStreakClaimedSteps: nextClaimed,
      }));
      onClose();
      onOpenRewardPack(item.packTier, item.packTitle ?? item.rewardLabel);
      return;
    }

    if (item.rewardType === 'baresi') {
      soundService.playPackTear();
      try {
        confetti({
          particleCount: 120,
          spread: 95,
          origin: { y: 0.55 },
          colors: ['#f5d97e', '#d4af37', '#ffffff', '#b45309'],
        });
      } catch {
        // ignore
      }
      onUpdateUser((prev) => {
        const curOwned = prev.ownedPlayerIds?.length
          ? prev.ownedPlayerIds
          : STARTER_OWNED_IDS;
        return {
          ownedPlayerIds: Array.from(new Set([...curOwned, baresiBallonDor102.id])),
          ballonDorStreakClaimedSteps: nextClaimed,
        };
      });
      onClose();
      onOpenFixedWalkout(
        baresiBallonDor102,
        "CHUỖI BALLON D'OR · FRANCO BARESI 102 OVR"
      );
    }
  };

  const completedCount = claimedSteps.size;

  return (
    <div className="fixed inset-0 z-50 bg-[#070503] text-white flex flex-col overflow-hidden select-none font-cruyff">
      {/* Ballon d'Or Streak Stadium Backdrop */}
      <img
        src="/assets/aistudio/Ballon_Dor_streak_pack_fbe4e574.png"
        alt="Ballon d'Or Streak Backdrop"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0804]/90 via-[#090704]/80 to-[#040302]/95 pointer-events-none" />

      {/* Notice Toast */}
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
        title="CHUỖI BALLON D'OR"
        subtitle="Mở khóa lần lượt 25 phần thưởng liên hoàn · Đích đến Franco Baresi 102 OVR miễn phí"
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        onClickGems={onClickGems}
        onClickTickets={onClickTickets}
        onClickShards={onClickShards}
      />

      {/* Main Scrollable Body */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Top Grand Prize Banner: Franco Baresi 102 OVR */}
          <div className="relative border border-[#d4af37]/70 bg-gradient-to-r from-[#140e06]/95 via-[#221809]/90 to-[#110c05]/95 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden">
            <img
              src="/assets/aistudio/Ballon_Dor_streak_pack_fbe4e574.png"
              alt="Ballon d'Or Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
            />
            <div className="relative z-10 flex items-center gap-4">
              <FCCard
                player={baresiBallonDor102}
                size="sm"
                showStats={false}
                className="shrink-0"
              />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#f5d97e]">
                  PHẦN THƯỞNG CUỐI CHUỖI · BƯỚC 25/25 MIỄN PHÍ
                </div>
                <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                  FRANCO BARESI 102 OVR · CB BALLON D&apos;OR
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/85 mt-1 max-w-xl">
                  Nhận lần lượt từ Bước 01 đến Bước 24 để mở khóa huyền thoại Franco Baresi 102 OVR hoàn toàn miễn phí kèm hiệu ứng Walkout.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                  <span className="text-[#fbe59b] font-bold">
                    Tiến độ: {completedCount}/{BALLON_DOR_STREAK_STEPS.length} Bước
                  </span>
                  <span aria-hidden="true" className="text-white/35">
                    ·
                  </span>
                  <span className="text-cyan-300 font-bold">
                    Kim Cương hiện có: {user.gems.toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-stretch sm:items-end gap-2 shrink-0 w-full md:w-auto">
              <div className="w-full md:w-64 h-2.5 bg-black/70 border border-[#d4af37]/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#b8891e] via-[#f5d97e] to-amber-300 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((completedCount / BALLON_DOR_STREAK_STEPS.length) * 100)
                    )}%`,
                  }}
                />
              </div>
              {nextAvailableStep <= BALLON_DOR_STREAK_STEPS.length ? (
                <button
                  type="button"
                  onClick={() => {
                    const nextItem = BALLON_DOR_STREAK_STEPS.find(
                      (s) => s.step === nextAvailableStep
                    );
                    if (nextItem) handleClaimStep(nextItem);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#fbe59b] to-[#c49523] hover:brightness-110 text-black font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-[#fff4cc]"
                >
                  <span>
                    NHẬN NHANH BƯỚC {String(nextAvailableStep).padStart(2, '0')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="px-4 py-2 bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ĐÃ HOÀN TẤT CHUỖI 25/25</span>
                </div>
              )}
            </div>
          </div>

          {/* 25-Step Sequential Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {BALLON_DOR_STREAK_STEPS.map((item) => {
              const isClaimed = claimedSteps.has(item.step);
              const isNext = item.step === nextAvailableStep;
              const isBaresiStep = item.rewardType === 'baresi';

              return (
                <div
                  key={item.step}
                  className={`flex flex-col justify-between border transition-all rounded-none ${
                    isClaimed
                      ? 'bg-emerald-950/25 border-emerald-400/50 opacity-80'
                      : isNext
                      ? 'bg-gradient-to-b from-[#2b1e0a] via-[#171106] to-[#0a0804] border-[#fbe59b] shadow-[0_0_24px_rgba(212,175,55,0.28)]'
                      : isBaresiStep
                      ? 'bg-gradient-to-b from-[#241908] via-[#130d04] to-[#080603] border-[#d4af37]/75'
                      : 'bg-[#0e0b07]/90 border-white/15'
                  }`}
                >
                  {/* Header Band */}
                  <div
                    className={`px-3 py-2 border-b flex items-center justify-between text-xs font-cruyff font-black uppercase tracking-wider ${
                      isClaimed
                        ? 'bg-emerald-900/55 border-emerald-400/35 text-emerald-200'
                        : isNext
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#fbe59b] border-[#fff1bd] text-black'
                        : 'bg-white/5 border-white/10 text-amber-200/80'
                    }`}
                  >
                    <span>{item.title}</span>
                    <span className="font-mono text-[10px]">
                      {item.costGems === 0
                        ? 'MIỄN PHÍ'
                        : `${item.costGems.toLocaleString('vi-VN')} KC`}
                    </span>
                  </div>

                  {/* Artwork & Reward */}
                  <div className="p-3.5 flex-1 flex flex-col items-center justify-center text-center min-h-[168px]">
                    {isBaresiStep ? (
                      <div className="mb-2">
                        <FCCard player={baresiBallonDor102} size="sm" showStats={false} />
                      </div>
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center mb-2.5">
                        <img
                          src={item.iconSrc}
                          alt={item.rewardLabel}
                          referrerPolicy="no-referrer"
                          className={`max-w-full max-h-full object-contain ${
                            item.rewardType === 'pack'
                              ? 'drop-shadow-[0_6px_14px_rgba(234,179,8,0.45)]'
                              : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]'
                          }`}
                        />
                      </div>
                    )}

                    <div className="font-cruyff font-black text-sm text-white uppercase leading-snug">
                      {item.rewardLabel}
                    </div>
                    <p className="text-[11px] text-amber-100/75 mt-1 leading-snug">
                      {item.subLabel}
                    </p>
                  </div>

                  {/* Action Footer */}
                  <button
                    type="button"
                    disabled={isClaimed || !isNext}
                    onClick={() => handleClaimStep(item)}
                    className={`w-full py-2.5 px-3 border-t font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors rounded-none tabular-nums ${
                      isClaimed
                        ? 'bg-emerald-950/75 border-emerald-400/35 text-emerald-300 cursor-default'
                        : isNext
                        ? 'bg-gradient-to-r from-[#d4af37] via-[#fbe59b] to-[#c49523] hover:brightness-110 border-[#fff1bd] text-black cursor-pointer'
                        : 'bg-black/60 border-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isClaimed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ĐÃ NHẬN</span>
                      </>
                    ) : isNext ? (
                      item.costGems === 0 ? (
                        <span>NHẬN MIỄN PHÍ</span>
                      ) : (
                        <>
                          <img
                            src="/assets/aistudio/currencysmall_CASH_b2121428.png"
                            alt="Kim Cương"
                            className="w-4 h-4 object-contain"
                          />
                          <span>{item.costGems.toLocaleString('vi-VN')}</span>
                        </>
                      )
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>MỞ BƯỚC {String(item.step - 1).padStart(2, '0')}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
