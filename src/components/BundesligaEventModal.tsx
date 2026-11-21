import React, { useMemo } from 'react';
import { CheckCircle2, Flame, Gift, ShieldAlert, Sparkles, Target, Ticket, X } from 'lucide-react';
import { UserProfile } from '../types/game';
import { PackTier } from './PackOpeningModal';
import {
  BUNDESLIGA_ASSETS,
  BUNDESLIGA_DAILY_GOAL_TARGET,
  bundesligaAllPlayers,
  isBundesligaPlayer,
  normalizeBundesligaState,
} from '../data/bundesligaData';
import {
  euro2024Players,
  futureStarsPlayers,
  laligaPlayers,
  totyFeaturedPlayers,
  utotyIconsPlayers,
} from '../data/mockData';
import { getDaily6AMCycleKey } from '../utils/dateUtils';
import { soundService } from '../services/sound';
import { FCCard } from './FCCard';

interface BundesligaEventModalProps {
  embedded?: boolean;
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenPackTier: (tier: PackTier, customName?: string) => void;
  onGoToBundesligaSpin?: () => void;
  onClose?: () => void;
}

export const BundesligaEventModal: React.FC<BundesligaEventModalProps> = ({
  embedded = false,
  user,
  onUpdateUser,
  onOpenPackTier,
  onGoToBundesligaSpin,
  onClose,
}) => {
  const activeCycle = getDaily6AMCycleKey();
  const blState = useMemo(
    () => normalizeBundesligaState(user.bundesligaState, activeCycle),
    [user.bundesligaState, activeCycle]
  );

  const starterBundesligaPlayers = useMemo(() => {
    const starterSet = new Set(user.starterIds || []);
    const allPool = [
      ...bundesligaAllPlayers,
      ...totyFeaturedPlayers,
      ...utotyIconsPlayers,
      ...futureStarsPlayers,
      ...euro2024Players,
      ...laligaPlayers,
    ];
    const seen = new Set<string>();
    return allPool.filter((p) => {
      if (!starterSet.has(p.id) || !isBundesligaPlayer(p) || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [user.starterIds]);

  const progressPct = Math.min(
    100,
    Math.round((blState.goalsScoredToday / BUNDESLIGA_DAILY_GOAL_TARGET) * 100)
  );
  const canClaimPack =
    blState.goalsScoredToday >= BUNDESLIGA_DAILY_GOAL_TARGET && !blState.rewardClaimedToday;

  const handleClaimDailyPack = () => {
    if (!canClaimPack) return;
    soundService.playConfirmSelection();
    onUpdateUser((prev) => {
      const current = normalizeBundesligaState(prev.bundesligaState, activeCycle);
      if (current.rewardClaimedToday || current.goalsScoredToday < BUNDESLIGA_DAILY_GOAL_TARGET) {
        return {};
      }
      return {
        bundesligaState: {
          cycleKey: activeCycle,
          goalsScoredToday: current.goalsScoredToday,
          rewardClaimedToday: true,
        },
      };
    });
    onOpenPackTier('BUNDESLIGA_88_PLUS', 'GÓI PACK 88+ CẦU THỦ BUNDESLIGA');
  };

  const innerContent = (
    <div className="relative w-full h-full overflow-y-auto bg-[#0f0305] text-white font-cruyff select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src={BUNDESLIGA_ASSETS.bg1}
          alt="Bundesliga Event Backdrop"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0306]/80 via-[#120306]/85 to-[#090203]/95" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Hero Banner (FC Mobile 26 Broadcast Framing) */}
        <div className="relative overflow-hidden rounded-xl border border-red-500/50 bg-gradient-to-r from-[#2c050a]/95 via-[#180408]/92 to-[#0d0205]/95 shadow-[0_14px_44px_rgba(220,38,38,0.22)] backdrop-blur-xl">
          <div className="h-[2px] absolute top-0 inset-x-0 bg-gradient-to-r from-red-500 via-amber-400 to-rose-500 z-20" />
          <img
            src={BUNDESLIGA_ASSETS.bg2}
            alt="Bundesliga Header"
            className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
          />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-5 sm:p-6">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={BUNDESLIGA_ASSETS.eventLogo}
                  alt="Bundesliga Logo"
                  className="w-12 h-12 rounded-lg object-contain bg-black/55 border border-red-400/50 p-1.5 shrink-0"
                />
                <div>
                  <span className="text-[11px] font-mono font-black uppercase tracking-widest text-red-300 block">
                    CHƯƠNG SỰ KIỆN ĐỘC QUYỀN · LÀM MỚI 06:00 HẰNG NGÀY
                  </span>
                  <h2 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase italic tracking-wide">
                    BUNDESLIGA · ĐỈNH CAO NƯỚC ĐỨC
                  </h2>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed max-w-2xl">
                Đưa ít nhất <strong className="text-yellow-300">1 cầu thủ Bundesliga</strong> vào
                đội hình xuất phát và trực tiếp ghi đủ{' '}
                <strong className="text-yellow-300">5 bàn thắng mỗi ngày</strong> ở các chế độ thi
                đấu để nhận miễn phí <strong className="text-white">Gói Pack 88+ Cầu Thủ Bundesliga</strong>!
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {onGoToBundesligaSpin && (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onGoToBundesligaSpin();
                    }}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-500 to-red-700 hover:brightness-110 text-white border border-red-300/70 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>MỞ VÉ QUAY BUNDESLIGA →</span>
                  </button>
                )}

                <div className="px-3.5 py-2 rounded-lg bg-black/65 border border-white/15 text-xs font-mono tabular-nums flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">Bàn thắng Bundesliga hôm nay:</span>
                  <strong className="text-yellow-300 text-sm">
                    {Math.min(BUNDESLIGA_DAILY_GOAL_TARGET, blState.goalsScoredToday)} /{' '}
                    {BUNDESLIGA_DAILY_GOAL_TARGET}
                  </strong>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <img
                src={BUNDESLIGA_ASSETS.welcomeImage}
                alt="Bundesliga Showcase Banner"
                className="w-full max-w-sm h-40 sm:h-48 rounded-lg object-cover border border-red-400/50 shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Daily 5-Goal Mission & Pack 88+ Reward Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Mission Tracker */}
          <div className="lg:col-span-7 rounded-xl border border-red-500/40 bg-black/70 backdrop-blur-md p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  <h3 className="font-cruyff font-black text-lg text-white uppercase tracking-wide">
                    NHIỆM VỤ GHI 5 BÀN BUNDESLIGA MỖI NGÀY
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase border ${
                    blState.rewardClaimedToday
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : blState.goalsScoredToday >= BUNDESLIGA_DAILY_GOAL_TARGET
                      ? 'bg-yellow-400/20 border-yellow-300 text-yellow-300 animate-pulse'
                      : 'bg-red-500/20 border-red-400/60 text-red-200'
                  }`}
                >
                  {blState.rewardClaimedToday
                    ? 'ĐÃ HOÀN THÀNH HÔM NAY'
                    : blState.goalsScoredToday >= BUNDESLIGA_DAILY_GOAL_TARGET
                    ? 'SẴN SÀNG NHẬN QUÀ'
                    : 'ĐANG TIẾN HÀNH'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống tự động cộng dồn mỗi bàn thắng do cầu thủ thuộc giải{' '}
                <span className="text-white font-bold">Bundesliga</span> ghi được trong{' '}
                <span className="text-red-300 font-bold">Đấu Xếp Hạng</span> (Đấu Đỉnh Cao / Chế Độ
                HLV) và <span className="text-emerald-300 font-bold">Đấu Sự Nghiệp</span>. Chu kỳ
                mới bắt đầu vào lúc <span className="text-yellow-300 font-mono font-bold">06:00</span>{' '}
                hằng ngày.
              </p>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-400 uppercase font-bold">Tiến Độ Bàn Thắng</span>
                  <span className="text-white font-black">
                    {Math.min(BUNDESLIGA_DAILY_GOAL_TARGET, blState.goalsScoredToday)} /{' '}
                    {BUNDESLIGA_DAILY_GOAL_TARGET} BÀN ({progressPct}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/15 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      blState.goalsScoredToday >= BUNDESLIGA_DAILY_GOAL_TARGET
                        ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-400'
                        : 'bg-gradient-to-r from-red-700 via-red-500 to-amber-400'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Active Bundesliga Starters Check */}
              <div className="p-3 rounded-lg bg-zinc-950/90 border border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Cầu Thủ Bundesliga Trong Đội Hình Xuất Phát:</span>
                  <span
                    className={`font-mono font-black ${
                      starterBundesligaPlayers.length > 0 ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {starterBundesligaPlayers.length} CẦU THỦ
                  </span>
                </div>

                {starterBundesligaPlayers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {starterBundesligaPlayers.map((p) => (
                      <div key={p.id} className="shrink-0">
                        <FCCard player={p} size="xs" showStats={false} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/35 border border-amber-500/40 rounded-lg p-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span>
                      Đội hình xuất phát hiện chưa có cầu thủ Bundesliga nào. Hãy quay Vé Quay
                      Bundesliga và đưa ít nhất 1 cầu thủ vào đội hình chính để ghi bàn tính nhiệm
                      vụ!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Daily Reward Box */}
          <div className="lg:col-span-5 rounded-xl border border-yellow-400/50 bg-gradient-to-b from-[#29060a]/95 via-[#180306]/95 to-black p-5 flex flex-col items-center justify-between text-center gap-4">
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-mono font-black uppercase text-yellow-300 tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                PHẦN THƯỞNG MỖI NGÀY
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600/30 border border-red-400/60 text-[10px] font-black uppercase text-red-200">
                PACK 88+ OVR
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 my-1">
              <div className="relative">
                <img
                  src="/assets/aistudio/pack_juventus_and_bundesliga_676265b6.png"
                  alt="Pack 88+ Bundesliga"
                  className="w-28 h-28 object-contain drop-shadow-[0_0_28px_rgba(220,38,38,0.75)]"
                />
                <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-2 animate-pulse" />
              </div>
              <h4 className="font-cruyff font-black text-lg text-white uppercase tracking-wide">
                GÓI PACK 88+ CẦU THỦ BUNDESLIGA
              </h4>
              <p className="text-xs text-slate-300 max-w-xs">
                Cam kết mở ra 1 cầu thủ thuộc giải Bundesliga có chỉ số từ 88 OVR trở lên (bao gồm cơ
                hội ra dàn sao 92–106 OVR).
              </p>
            </div>

            <button
              type="button"
              disabled={!canClaimPack}
              onClick={handleClaimDailyPack}
              className={`w-full py-3.5 px-5 rounded-lg font-cruyff font-black text-sm uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                blState.rewardClaimedToday
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 cursor-default'
                  : canClaimPack
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:brightness-110 text-slate-950 border-yellow-100 cursor-pointer shadow-[0_0_24px_rgba(250,204,21,0.45)]'
                  : 'bg-zinc-900 border-white/15 text-slate-400 cursor-not-allowed'
              }`}
            >
              {blState.rewardClaimedToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ĐÃ NHẬN PACK 88+ HÔM NAY</span>
                </>
              ) : canClaimPack ? (
                <>
                  <Gift className="w-4 h-4" />
                  <span>NHẬN GÓI PACK 88+ BUNDESLIGA</span>
                </>
              ) : (
                <span>
                  CẦN THÊM {Math.max(0, BUNDESLIGA_DAILY_GOAL_TARGET - blState.goalsScoredToday)}{' '}
                  BÀN THẮNG NỮA
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Full Bundesliga Card Roster Showcase (Zero Extra Card Data Overlay) */}
        <div className="rounded-xl border border-white/15 bg-black/60 backdrop-blur-md p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-cruyff font-black text-lg text-white uppercase tracking-wide">
                DANH SÁCH THẺ CẦU THỦ BUNDESLIGA (GÓI A &amp; GÓI B)
              </h3>
              <p className="text-xs text-slate-400">
                Gói A (1%): 102–106 OVR · Gói B (25%): 92–101 OVR · Gói C (74%): Cầu thủ hỗn hợp
                dưới 91 OVR
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-red-600/20 border border-red-400/50 text-[11px] font-mono font-black text-red-200 uppercase">
              {bundesligaAllPlayers.length} THẺ SỰ KIỆN
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 justify-items-center">
            {bundesligaAllPlayers.map((card) => (
              <div
                key={card.id}
                className="p-1.5 rounded-lg bg-zinc-950/80 border border-white/10 hover:border-red-400/60 transition-transform hover:scale-105"
              >
                <FCCard player={card} size="sm" showStats={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return innerContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-black/90 border-b border-red-500/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={BUNDESLIGA_ASSETS.eventLogo}
            alt="Bundesliga"
            className="w-7 h-7 object-contain"
          />
          <span className="font-cruyff font-black text-base text-white uppercase tracking-wider">
            CHƯƠNG BUNDESLIGA
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-2 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{innerContent}</div>
    </div>
  );
};
