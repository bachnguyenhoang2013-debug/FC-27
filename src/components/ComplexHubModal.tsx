import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { UserProfile } from '../types/game';
import { TopSectionHeader } from './TopSectionHeader';
import { ExtraTimeSection } from './ExtraTimeSection';
import {
  ConmebolLibertadoresModal,
  FeaturedEventDestination,
} from './ConmebolLibertadoresModal';
import { SignatureArchiveModal } from './SignatureArchiveModal';
import { VietnamChroniclesModal } from './VietnamChroniclesModal';
import { RonaldoChroniclesChapter } from './RonaldoChroniclesChapter';
import { BundesligaEventModal } from './BundesligaEventModal';
import { PackTier } from './PackOpeningModal';
import { EXTRA_TIME_ASSETS } from '../data/extraTimeData';
import {
  BUNDESLIGA_ASSETS,
  BUNDESLIGA_DAILY_GOAL_TARGET,
  normalizeBundesligaState,
} from '../data/bundesligaData';
import { useLibertadoresAssets } from '../data/libertadoresAssets';
import { VIETNAM_CREST_URL } from '../data/vietnamChroniclesData';
import { RONALDO_CHRONICLES_FRAME } from '../data/ronaldoChroniclesData';
import {
  getDaily6AMCycleKey,
  isLibertadoresEventUnlocked,
  normalizeRonaldoChroniclesState,
  normalizeVietnamChroniclesState,
} from '../utils/dateUtils';
import { soundService } from '../services/sound';

export type ComplexSectionId =
  | 'extra_time'
  | 'bundesliga'
  | 'libertadores'
  | 'signature'
  | 'vietnam'
  | 'ronaldo';

interface ComplexHubModalProps {
  user: UserProfile;
  initialSection?: ComplexSectionId;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onOpenPackTier: (tier: PackTier, customName?: string) => void;
  onGoToCareer: () => void;
  onGoToShop: () => void;
  onGoToShopGiftcode: () => void;
  onGoToTickets: () => void;
  onGoToBundesligaSpin?: () => void;
  onNavigateFeaturedEvent: (dest: FeaturedEventDestination) => void;
  onClose: () => void;
  onGoHome?: () => void;
}

export const ComplexHubModal: React.FC<ComplexHubModalProps> = ({
  user,
  initialSection = 'extra_time',
  onUpdateUser,
  onOpenPackTier,
  onGoToCareer,
  onGoToShop,
  onGoToShopGiftcode,
  onGoToTickets,
  onGoToBundesligaSpin,
  onNavigateFeaturedEvent,
  onClose,
  onGoHome,
}) => {
  const [activeSection, setActiveSection] =
    useState<ComplexSectionId>(initialSection);
  const { getAsset: getLibertadoresAsset } = useLibertadoresAssets();

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const activeCycle = getDaily6AMCycleKey();
  const libUnlocked = isLibertadoresEventUnlocked(
    user.libertadoresState,
    Date.now()
  );
  const vnNormalized = useMemo(
    () => normalizeVietnamChroniclesState(user.vietnamChronicles, activeCycle),
    [user.vietnamChronicles, activeCycle]
  );
  const vnQuizPending = vnNormalized.lastAttemptCycleKey !== activeCycle;
  const ronaldoClaimedCount = useMemo(
    () =>
      normalizeRonaldoChroniclesState(
        user.ronaldoChronicles,
        user.ownedPlayerIds
      ).claimedClubIds.length,
    [user.ronaldoChronicles, user.ownedPlayerIds]
  );
  const bundesligaNormalized = useMemo(
    () => normalizeBundesligaState(user.bundesligaState, activeCycle),
    [user.bundesligaState, activeCycle]
  );
  const bundesligaClaimable =
    bundesligaNormalized.goalsScoredToday >= BUNDESLIGA_DAILY_GOAL_TARGET &&
    !bundesligaNormalized.rewardClaimedToday;

  const entrances: Array<{
    id: ComplexSectionId;
    title: string;
    subtitle: string;
    iconUrl: string;
    badge?: string;
    accentClass: string;
    activeClass: string;
  }> = [
    {
      id: 'extra_time',
      title: 'Hiệp Phụ',
      subtitle: `${(user.extraTimeTokens ?? 0).toLocaleString('vi-VN')} Token · Lựa Chọn & Quest PL`,
      iconUrl: EXTRA_TIME_ASSETS.tokenSmall,
      badge: 'CHÍNH',
      accentClass: 'text-cyan-300',
      activeClass:
        'bg-gradient-to-r from-cyan-950/95 via-sky-900/80 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.28)]',
    },
    {
      id: 'bundesliga',
      title: 'Bundesliga',
      subtitle: `${Math.min(BUNDESLIGA_DAILY_GOAL_TARGET, bundesligaNormalized.goalsScoredToday)}/${BUNDESLIGA_DAILY_GOAL_TARGET} Bàn Hôm Nay · Pack 88+`,
      iconUrl: BUNDESLIGA_ASSETS.eventLogo,
      badge: bundesligaClaimable ? 'NHẬN QUÀ' : 'MỚI',
      accentClass: 'text-red-300',
      activeClass:
        'bg-gradient-to-r from-[#3a070d] via-[#220408] to-slate-950 border-red-500 shadow-[0_0_18px_rgba(220,38,38,0.35)]',
    },
    {
      id: 'libertadores',
      title: 'CONMEBOL Libertadores',
      subtitle: libUnlocked
        ? `${(user.libertadoresTokens ?? 0).toLocaleString('vi-VN')} LIB Token`
        : 'Sự kiện Nam Mỹ · Mở 11/11',
      iconUrl: getLibertadoresAsset('eventLogo'),
      accentClass: 'text-[#fbe59b]',
      activeClass:
        'bg-gradient-to-r from-[#261a07] via-[#1a1205] to-slate-950 border-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.28)]',
    },
    {
      id: 'signature',
      title: 'Trao Đổi Chữ Ký',
      subtitle: `${(user.signatureTokens ?? 0).toLocaleString('vi-VN')} Token · Icons 106 OVR`,
      iconUrl: '/assets/aistudio/logo_s__ki_n_ch__k__27373b1c.png',
      accentClass: 'text-[#f3d37a]',
      activeClass:
        'bg-gradient-to-r from-[#241708] via-[#170e06] to-slate-950 border-[#f3d37a] shadow-[0_0_18px_rgba(243,211,122,0.25)]',
    },
    {
      id: 'vietnam',
      title: 'Biên Niên Sử Việt Nam',
      subtitle: `${(user.vietnamShards ?? 0).toLocaleString('vi-VN')} Mảnh VN`,
      iconUrl: VIETNAM_CREST_URL,
      badge: vnQuizPending ? 'MỚI' : undefined,
      accentClass: 'text-yellow-300',
      activeClass:
        'bg-gradient-to-r from-[#5a0b16] via-[#2c050b] to-slate-950 border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.28)]',
    },
    {
      id: 'ronaldo',
      title: 'Biên Niên Sử Ronaldo',
      subtitle: `${ronaldoClaimedCount}/5 CLB Huyền Thoại (100 OVR)`,
      iconUrl: RONALDO_CHRONICLES_FRAME,
      accentClass: 'text-amber-300',
      activeClass:
        'bg-gradient-to-r from-amber-950/90 via-zinc-900 to-slate-950 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.28)]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-cruyff">
      <TopSectionHeader
        title="KHU PHỨC HỢP · TRUNG TÂM SỰ KIỆN"
        subtitle="Hiệp Phụ · Bundesliga · CONMEBOL Libertadores · Trao Đổi Chữ Ký · Biên Niên Sử Việt Nam · Biên Niên Sử Ronaldo"
        user={user}
        onBack={onClose}
        onGoHome={onGoHome || onClose}
        onClickGems={onGoToShop}
        onClickTickets={onGoToTickets}
      />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT VERTICAL SIDEBAR OF ENTRANCES (Broadcast Dark-Glass Hub) */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/12 bg-[#050a14] p-3 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto">
          <div className="hidden md:flex items-center justify-between px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10">
            <span>TRUNG TÂM SỰ KIỆN</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 tabular-nums">
              6 CHƯƠNG
            </span>
          </div>

          {entrances.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'extra_time') {
                    soundService.playSelection();
                  } else {
                    soundService.playOpenEvent();
                  }
                  setActiveSection(item.id);
                }}
                className={`relative min-w-[205px] md:min-w-0 md:w-full p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer shrink-0 overflow-hidden ${
                  isActive
                    ? item.activeClass
                    : 'bg-[#0b1322]/90 hover:bg-[#101c31] border-white/10 hover:border-white/25'
                }`}
              >
                {isActive && (
                  <span className="hidden md:block absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-black/65 border border-white/15 flex items-center justify-center shrink-0">
                    <img
                      src={item.iconUrl}
                      alt={item.title}
                      className="w-6 h-6 object-contain pointer-events-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-black text-xs uppercase tracking-wider truncate ${
                          isActive ? item.accentClass : 'text-white'
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.2 rounded-sm text-[8px] font-black uppercase shrink-0 ${
                            item.badge === 'CHÍNH'
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-emerald-400 text-slate-950'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 truncate mt-0.5 tabular-nums">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? item.accentClass : 'text-slate-500'
                  }`}
                />
              </button>
            );
          })}
        </aside>

        {/* RIGHT MAIN EVENT CONTENT PANE */}
        <section className="flex-1 min-w-0 min-h-0 overflow-hidden bg-slate-950 relative">
          {activeSection === 'extra_time' && (
            <ExtraTimeSection user={user} onUpdateUser={onUpdateUser} />
          )}

          {activeSection === 'bundesliga' && (
            <BundesligaEventModal
              embedded
              user={user}
              onUpdateUser={onUpdateUser}
              onOpenPackTier={onOpenPackTier}
              onGoToBundesligaSpin={onGoToBundesligaSpin || onGoToTickets}
              onClose={onClose}
            />
          )}

          {activeSection === 'libertadores' && (
            <ConmebolLibertadoresModal
              embedded
              user={user}
              initialChapter="main"
              onUpdateUser={onUpdateUser}
              onOpenPackTier={onOpenPackTier}
              onGoToCareer={onGoToCareer}
              onGoToShopGiftcode={onGoToShopGiftcode}
              onNavigateFeaturedEvent={onNavigateFeaturedEvent}
              onClose={onClose}
            />
          )}

          {activeSection === 'signature' && (
            <SignatureArchiveModal
              embedded
              isOpen={true}
              user={user}
              onUpdateUser={onUpdateUser}
              onClose={onClose}
              initialTab="hub"
            />
          )}

          {activeSection === 'vietnam' && (
            <VietnamChroniclesModal
              embedded
              user={user}
              initialTab="quiz"
              onUpdateUser={onUpdateUser}
              onOpenShop={onGoToShop}
              onOpenTickets={onGoToTickets}
              onClose={onClose}
            />
          )}

          {activeSection === 'ronaldo' && (
            <div className="relative w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-950">
              <img
                src="/assets/aistudio/background_bi_n_ni_n_s__icons_144336ee.png"
                alt="Biên Niên Sử Ronaldo Background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-35"
              />
              <div className="relative z-10 max-w-6xl mx-auto">
                <RonaldoChroniclesChapter
                  user={user}
                  onUpdateUser={onUpdateUser}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
