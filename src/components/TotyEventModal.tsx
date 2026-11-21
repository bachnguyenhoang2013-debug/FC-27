import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  UserProfile,
  PlayerCard,
} from '../types/game';
import { FCCard } from './FCCard';
import { PackOpeningModal, PackTier } from './PackOpeningModal';
import { soundService } from '../services/sound';
import { TopSectionHeader } from './TopSectionHeader';
import { TotyShardsSection } from './TotyShardsSection';
import { IconsChroniclesSection } from './IconsChroniclesSection';
import { FutureStarsEventChapter } from './FutureStarsEventChapter';

export type TotyChapterId =
  | 'shards'
  | 'icons_chronicles'
  | 'future_stars';

interface TotyEventModalProps {
  user: UserProfile;
  starters: PlayerCard[];
  initialChapter?: TotyChapterId;
  onUpdateUser: (updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)) => void;
  onOpenRewardPack: (tier: PackTier, customName: string) => void;
  onGoToCareer: () => void;
  onGoToTickets: () => void;
  onGoToFutureStarsTickets: () => void;
  onGoToMyTeam: () => void;
  onClose: () => void;
  onGoHome?: () => void;
}

const CHAPTERS: Array<{
  id: TotyChapterId;
  label: string;
  subtitle: string;
  bgSrc: string;
  chapterNum?: string;
}> = [
  {
    id: 'shards',
    chapterNum: 'MẢNH',
    label: 'Trao đổi mảnh',
    subtitle: 'Phân tách cầu thủ dự bị lấy Mảnh Siêu Sao & đổi cầu thủ OVR cao',
    bgSrc: '/assets/aistudio/draft_TOTY26_BG_c07ec164.png',
  },
  {
    id: 'icons_chronicles',
    chapterNum: 'ICONS',
    label: 'Biên Niên Sử Icons',
    subtitle: 'Đổi 6 cầu thủ 90+ nhận 1 trong 5 Huyền Thoại Classics 95 OVR',
    bgSrc: '/assets/aistudio/draft_TOTY26_BG_c07ec164.png',
  },
  {
    id: 'future_stars',
    chapterNum: 'FS',
    label: 'Future Stars',
    subtitle: 'Restart 06:00 sáng · Tập luyện Flashback, Đấu Đội A (70) & B (85) nhận 1 Vé FS',
    bgSrc: '/assets/aistudio/Background_m_c_v__quay_Future_Stars_336ec779.png',
  },
];

export const TotyEventModal: React.FC<TotyEventModalProps> = ({
  user,
  starters,
  initialChapter = 'shards',
  onUpdateUser,
  onOpenRewardPack,
  onGoToTickets,
  onGoToFutureStarsTickets,
  onClose,
  onGoHome,
}) => {
  const [activeChapter, setActiveChapter] = useState<TotyChapterId>(initialChapter ?? 'shards');
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [selectedCard, setSelectedCard] = useState<PlayerCard | null>(null);
  const [claimedCraftWinner, setClaimedCraftWinner] = useState<PlayerCard | null>(null);

  // Horizontal drag-to-scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);

  const currentChapterConfig =
    CHAPTERS.find((c) => c.id === activeChapter) || CHAPTERS[0];

  const totyShards = user.totyShards ?? 0;
  const fsCycleKey = 'fs_cycle_key';
  const hasUnclaimedFutureStarsDaily =
    user.futureStarsDaily?.cycleKey !== fsCycleKey || !user.futureStarsDaily?.rewardClaimed;

  const showToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 2800);
  };

  const handleSelectChapter = (chapterId: TotyChapterId) => {
    soundService.playTabSwitch();
    setActiveChapter(chapterId);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleScrollBy = (delta: number) => {
    soundService.playClick();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Mouse drag-to-swipe handlers
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  const onWheelHorizontal = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none font-cruyff">
      {/* FULLSCREEN CHAPTER BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentChapterConfig.bgSrc}
          alt={currentChapterConfig.label}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/80 pointer-events-none" />
      </div>

      {/* TOAST NOTIFICATION */}
      {notice && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[70] px-5 py-2.5 rounded-none font-bold text-sm shadow-2xl flex items-center gap-2 ${
            notice.tone === 'success'
              ? 'bg-yellow-400 text-black border border-yellow-200'
              : 'bg-rose-600 text-white border border-rose-300'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* TOP SECTION HEADER */}
      <TopSectionHeader
        title="SỰ KIỆN ĐẶC BIỆT"
        subtitle={currentChapterConfig.subtitle}
        titleLogo={
          <img
            src="/assets/aistudio/logo_m_n_h_nh_ch_nh_m_c_s__ki_n_39a90bc3.png"
            alt="Sự Kiện"
            className="h-8 w-auto object-contain"
          />
        }
        user={user}
        onBack={onClose}
        onGoHome={onGoHome || onClose}
        onClickTickets={onGoToTickets}
        onClickShards={() => handleSelectChapter('shards')}
      />

      {/* CHAPTER TABS BAR */}
      <div className="relative z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/25 flex flex-col shrink-0">
        <div className="bg-slate-900/95 border-b border-white/20 p-2.5 flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleSelectChapter('shards')}
            className="py-2 px-6 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow"
          >
            <img
              src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
              alt="Mảnh Trao Đổi"
              className="w-4 h-4 object-contain"
            />
            <span>TRAO ĐỔI MẢNH NGÔI SAO ({totyShards.toLocaleString('vi-VN')} MẢNH)</span>
          </button>
        </div>

        <div className="px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center border border-white/25 divide-x divide-white/25 bg-black/60">
            {CHAPTERS.map((chap) => {
              const isActive = activeChapter === chap.id;
              const isFsTab = chap.id === 'future_stars';
              const showFreeBadge = isFsTab && hasUnclaimedFutureStarsDaily;
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => handleSelectChapter(chap.id)}
                  className={`px-3 py-1.5 font-cruyff font-black text-xs uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer rounded-none ${
                    isActive
                      ? isFsTab
                        ? 'bg-cyan-300 text-slate-950'
                        : 'bg-yellow-400 text-black'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {chap.chapterNum ? (
                    <span className="opacity-75 font-mono text-[10px]">{chap.chapterNum}</span>
                  ) : null}
                  <span>{chap.label}</span>
                  {showFreeBadge ? (
                    <span
                      className={`text-[9px] font-mono font-black px-1 py-0.5 ${
                        isActive ? 'bg-black text-yellow-300' : 'bg-yellow-400 text-black'
                      }`}
                    >
                      1 VÉ
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleScrollBy(-460)}
              className="p-1.5 bg-black/70 hover:bg-white/15 border border-white/25 text-white transition-colors cursor-pointer rounded-none"
              title="Trượt sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollBy(460)}
              className="p-1.5 bg-black/70 hover:bg-white/15 border border-white/25 text-white transition-colors cursor-pointer rounded-none"
              title="Trượt sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CHAPTER CONTENT CANVAS */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onWheel={onWheelHorizontal}
        className="relative z-10 flex-1 overflow-x-auto overflow-y-auto px-4 sm:px-8 py-4 flex items-start gap-6 cursor-grab active:cursor-grabbing scroll-smooth"
      >
        {activeChapter === 'shards' && (
          <div className="w-full">
            <TotyShardsSection
              user={user}
              onUpdateUser={onUpdateUser}
              onInspectPlayer={(p) => setSelectedCard(p)}
              onClaimedPlayerReveal={(p) => setClaimedCraftWinner(p)}
              onShowToast={showToast}
            />
          </div>
        )}

        {activeChapter === 'icons_chronicles' && (
          <IconsChroniclesSection
            user={user}
            onUpdateUser={onUpdateUser}
            onGoToTickets={() => {
              onClose();
              onGoToTickets();
            }}
            onShowToast={showToast}
          />
        )}

        {activeChapter === 'future_stars' && (
          <FutureStarsEventChapter
            user={user}
            starters={starters}
            onUpdateUser={onUpdateUser}
            onOpenFutureStarsPack={(tier, customName) => {
              onClose();
              onOpenRewardPack(tier, customName);
            }}
            onGoToFutureStarsSpin={() => {
              onClose();
              onGoToFutureStarsTickets();
            }}
            onInspectPlayer={(p) => setSelectedCard(p)}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* FOOTER STATUS BAR */}
      <footer className="relative z-20 px-5 py-2 bg-black/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
        <div className="flex items-center gap-4 font-mono tabular-nums flex-wrap">
          <span>
            Mảnh: <strong className="text-yellow-300">{totyShards.toLocaleString('vi-VN')}</strong>
          </span>
          <span>
            OVR Đội bóng: <strong className="text-yellow-300">{user.ovr}</strong>
          </span>
        </div>
        <span className="text-[11px] text-yellow-300 font-bold uppercase tracking-wider">
          Kéo / Vuốt ngang màn hình để khám phá các chương sự kiện
        </span>
      </footer>

      {/* CLAIMED PLAYER SEASONAL CONTRACT WALKOUT */}
      {claimedCraftWinner && (
        <PackOpeningModal
          fixedPlayer={claimedCraftWinner}
          isContractSigning={true}
          isTicketSpin={false}
          skipResourceBonus={true}
          packName={`KÝ HỢP ĐỒNG THÀNH CÔNG · ${claimedCraftWinner.name}`}
          onClose={() => setClaimedCraftWinner(null)}
          onPlayerClaimed={() => setClaimedCraftWinner(null)}
        />
      )}

      {/* PLAYER DETAIL POPOVER */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-none bg-zinc-950 border border-yellow-400/60 p-5 flex flex-col items-center gap-4 shadow-2xl"
          >
            <div className="w-full flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-cruyff font-black text-lg text-yellow-300 uppercase italic">
                THÔNG TIN THẺ CẦU THỦ
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="p-1.5 rounded-none bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <FCCard player={selectedCard} size="hero" showStats={true} />
            <div className="text-center">
              <div className="font-cruyff font-black text-xl text-white uppercase">
                {selectedCard.fullName || selectedCard.name}
              </div>
              <div className="text-xs text-gray-300 mt-0.5">
                {selectedCard.club} · {selectedCard.nation} · Vị trí {selectedCard.position}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
