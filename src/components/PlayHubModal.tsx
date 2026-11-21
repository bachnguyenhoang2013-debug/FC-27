import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { TopSectionHeader } from './TopSectionHeader';
import { soundService } from '../services/sound';
import { useLibertadoresAssets } from '../data/libertadoresAssets';
import {
  isLibertadoresEventUnlocked,
  getLibertadoresOfficialUnlockMs,
  formatCountdownToTargetMs,
  getDaily6AMCycleKey,
} from '../utils/dateUtils';
import {
  BUNDESLIGA_ASSETS,
  BUNDESLIGA_DAILY_GOAL_TARGET,
  normalizeBundesligaState,
} from '../data/bundesligaData';

export type PlayHubTab = 'events' | 'ranked' | 'career';

interface PlayHubModalProps {
  user: UserProfile;
  initialTab?: PlayHubTab;
  onOpenTotyEvent: () => void;
  onOpenFutureStarsEvent: () => void;
  onOpenLibertadoresEvent?: () => void;
  onOpenVietnamChroniclesEvent?: () => void;
  onOpenBundesligaEvent?: () => void;
  onOpenRankedMode: () => void;
  onOpenCareerMode: (tab?: 'standings' | 'fixtures' | 'rewards') => void;
  onOpenShop: () => void;
  onOpenTickets: () => void;
  onClose: () => void;
}

export const PlayHubModal: React.FC<PlayHubModalProps> = ({
  user,
  initialTab = 'events',
  onOpenTotyEvent,
  onOpenFutureStarsEvent,
  onOpenLibertadoresEvent,
  onOpenVietnamChroniclesEvent,
  onOpenBundesligaEvent,
  onOpenRankedMode,
  onOpenCareerMode,
  onOpenShop,
  onOpenTickets,
  onClose,
}) => {
  const [activePart, setActivePart] = useState<PlayHubTab>(initialTab);
  const blState = normalizeBundesligaState(user.bundesligaState, getDaily6AMCycleKey());
  const { getAsset: getLibertadoresAsset } = useLibertadoresAssets();
  const nowMs = Date.now();
  const libertadoresUnlocked = isLibertadoresEventUnlocked(user.libertadoresState, nowMs);
  const libertadoresCountdown = formatCountdownToTargetMs(
    getLibertadoresOfficialUnlockMs(new Date(nowMs)),
    nowMs
  );

  const rankedStars = user.rankedState?.totalStars ?? 0;
  const rankedWins = user.rankedState?.wins ?? 0;
  const rankedLosses = user.rankedState?.losses ?? 0;
  const careerPlayed = user.careerMatchesPlayed ?? 0;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col overflow-hidden select-none font-cruyff">
      {/* Top Section Header (Frameless Resources + Back + Main Screen) */}
      <TopSectionHeader
        title="CHƠI"
        subtitle="Chọn bảng Sự Kiện · Đấu Xếp Hạng · Đấu Sự Nghiệp"
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        onClickGems={onOpenShop}
        onClickTickets={onOpenTickets}
      />

      {/* 3 NÚT BẢNG CHIA PHẦN (CÓ VIỀN NGĂN CÁCH, GÓC NHỌN, KHÔNG LOGO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/30 border-b border-white/30 bg-slate-950 shrink-0">
        {/* BẢNG 1: SỰ KIỆN */}
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActivePart('events');
          }}
          className={`relative h-28 sm:h-36 overflow-hidden text-left p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer rounded-none group ${
            activePart === 'events'
              ? 'ring-2 ring-inset ring-yellow-400'
              : 'opacity-80 hover:opacity-100'
          }`}
        >
          <img
            src="/assets/aistudio/_nh_m__m_c_v__quay_b5c6b29b.png"
            alt="Bảng Sự Kiện"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/35 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-300 block">
              PHẦN 01 · CHIẾN DỊCH ĐẶC BIỆT
            </span>
            <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
              SỰ KIỆN
            </h2>
          </div>
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="text-slate-200 font-medium">TOTY 26 · Future Stars · Libertadores</span>
            <span
              className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase rounded-none ${
                activePart === 'events'
                  ? 'bg-yellow-400 text-slate-950 border-yellow-200'
                  : 'bg-slate-950/80 text-white border-white/35'
              }`}
            >
              {activePart === 'events' ? 'ĐANG HIỂN THỊ' : 'XEM BẢNG'}
            </span>
          </div>
        </button>

        {/* BẢNG 2: ĐẤU XẾP HẠNG */}
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActivePart('ranked');
          }}
          className={`relative h-28 sm:h-36 overflow-hidden text-left p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer rounded-none group ${
            activePart === 'ranked'
              ? 'ring-2 ring-inset ring-cyan-400'
              : 'opacity-80 hover:opacity-100'
          }`}
        >
          <img
            src="/assets/aistudio/default_KEYMATCHCUSTOM_MEDIUM_BG_21d60d22.png"
            alt="Bảng Đấu Xếp Hạng"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-cyan-950/65 to-slate-950/40 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 block">
              PHẦN 02 · ĐỐI KHÁNG PVP
            </span>
            <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
              ĐẤU XẾP HẠNG
            </h2>
          </div>
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="text-cyan-200 font-mono font-bold tabular-nums">
              {rankedStars} SAO XẾP HẠNG
            </span>
            <span
              className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase rounded-none ${
                activePart === 'ranked'
                  ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                  : 'bg-slate-950/80 text-white border-white/35'
              }`}
            >
              {activePart === 'ranked' ? 'ĐANG HIỂN THỊ' : 'XEM BẢNG'}
            </span>
          </div>
        </button>

        {/* BẢNG 3: ĐẤU SỰ NGHIỆP */}
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActivePart('career');
          }}
          className={`relative h-28 sm:h-36 overflow-hidden text-left p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer rounded-none group ${
            activePart === 'career'
              ? 'ring-2 ring-inset ring-emerald-400'
              : 'opacity-80 hover:opacity-100'
          }`}
        >
          <img
            src="/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_BG__1__87671226.png"
            alt="Bảng Đấu Sự Nghiệp"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-emerald-950/65 to-slate-950/40 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300 block">
              PHẦN 03 · MÙA GIẢI CLB
            </span>
            <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
              ĐẤU SỰ NGHIỆP
            </h2>
          </div>
          <div className="relative z-10 flex items-center justify-between text-xs">
            <span className="text-emerald-200 font-mono font-bold tabular-nums">
              NGOẠI HẠNG ANH · 38 VÒNG
            </span>
            <span
              className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase rounded-none ${
                activePart === 'career'
                  ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                  : 'bg-slate-950/80 text-white border-white/35'
              }`}
            >
              {activePart === 'career' ? 'ĐANG HIỂN THỊ' : 'XEM BẢNG'}
            </span>
          </div>
        </button>
      </div>

      {/* NỘI DUNG HIỂN THỊ THEO NÚT BẢNG ĐÃ CHỌN (GÓC NHỌN, CHỈ VIỀN, KHÔNG LOGO) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
          {activePart === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/25 border border-white/30 bg-slate-900/50 rounded-none">
              {/* Sự kiện 1: TOTY 26 */}
              <div className="relative min-h-[300px] sm:min-h-[340px] p-6 flex flex-col justify-between overflow-hidden rounded-none">
                <img
                  src="/assets/aistudio/_nh_m__m_c_v__quay_b5c6b29b.png"
                  alt="Sự Kiện TOTY 26"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/50 pointer-events-none" />

                <div className="relative z-10 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-300 block">
                    CHIẾN DỊCH CHÍNH THỨC
                  </span>
                  <h3 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                    TEAM OF THE YEAR 2026
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                    Hoàn thành bài tập kỹ năng, đá trận đấu sự kiện TOTY mỗi ngày để thu thập Token TOTY
                    ({(user.totyTokens ?? 0).toLocaleString('vi-VN')} Token hiện có) và mở mốc thưởng lớn.
                  </p>
                </div>

                <div className="relative z-10 pt-6 space-y-3">
                  <div className="grid grid-cols-2 divide-x divide-white/20 border border-white/25 bg-slate-950/90 text-center py-2 font-mono text-xs tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">TOKEN TOTY</span>
                      <span className="text-yellow-300 font-black">{user.totyTokens ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">MẢNH SIÊU SAO</span>
                      <span className="text-amber-300 font-black">{user.totyShards ?? 0}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onOpenTotyEvent();
                    }}
                    className="w-full py-3.5 px-5 rounded-none bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-200 font-cruyff font-black text-sm sm:text-base uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    VÀO SỰ KIỆN TOTY 26 →
                  </button>
                </div>
              </div>

              {/* Sự kiện 2: Future Stars */}
              <div className="relative min-h-[300px] sm:min-h-[340px] p-6 flex flex-col justify-between overflow-hidden rounded-none">
                <img
                  src="/assets/aistudio/Background_m_c_v__quay_Future_Stars_336ec779.png"
                  alt="Sự Kiện Future Stars"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/50 pointer-events-none" />

                <div className="relative z-10 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300 block">
                    NGÔI SAO TƯƠNG LAI
                  </span>
                  <h3 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                    FUTURE STARS 2026
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                    Vượt qua chuỗi bài tập huấn luyện & thử thách tài năng trẻ để nhận Vé Future Stars
                    và mở khóa dàn sao trẻ OVR 98–104.
                  </p>
                </div>

                <div className="relative z-10 pt-6 space-y-3">
                  <div className="grid grid-cols-2 divide-x divide-white/20 border border-white/25 bg-slate-950/90 text-center py-2 font-mono text-xs tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">VÉ FUTURE STARS</span>
                      <span className="text-cyan-300 font-black">{user.futureStarsTickets ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">ĐỘI HÌNH HIỆN TẠI</span>
                      <span className="text-white font-black">OVR {user.ovr}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onOpenFutureStarsEvent();
                    }}
                    className="w-full py-3.5 px-5 rounded-none bg-cyan-400 hover:bg-cyan-300 text-slate-950 border border-cyan-200 font-cruyff font-black text-sm sm:text-base uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    VÀO SỰ KIỆN FUTURE STARS →
                  </button>
                </div>
              </div>

              {/* Sự kiện 3: CONMEBOL Libertadores */}
              <div className="relative min-h-[300px] sm:min-h-[340px] p-5 sm:p-6 flex flex-col justify-between overflow-hidden rounded-none bg-[#070503]">
                <img
                  src={getLibertadoresAsset('bgMain')}
                  alt="CONMEBOL Libertadores Background"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <img
                        src={getLibertadoresAsset('eventLogo')}
                        alt="Logo Libertadores"
                        className="w-8 h-8 object-contain shrink-0"
                      />
                      <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#f5d97e]">
                        {libertadoresUnlocked ? 'ĐÃ MỞ KHÓA · 4 CHƯƠNG' : 'MỞ KHÓA LÚC 11/11'}
                      </span>
                    </div>
                    <h3 className="font-cruyff font-black text-xl sm:text-2xl text-[#fbe59b] uppercase tracking-wide">
                      CONMEBOL LIBERTADORES
                    </h3>
                    <p className="text-xs text-[#e6d5b8] leading-relaxed">
                      {libertadoresUnlocked
                        ? 'Chinh phục 4 chương Chính, Luyện Tập, Trivia 5 giây & Phần Thưởng để đổi Pack Nam Mỹ 90+.'
                        : `Sự kiện tự động mở ngày 11/11 (${libertadoresCountdown}). Dùng 1 Vé Mở Khóa để vào trước!`}
                    </p>
                  </div>

                  <img
                    src={getLibertadoresAsset('entranceBanner')}
                    alt="Entrance CONMEBOL Libertadores"
                    referrerPolicy="no-referrer"
                    className="h-32 sm:h-36 w-auto object-contain shrink-0 pointer-events-none"
                  />
                </div>

                <div className="relative z-10 pt-4 space-y-3">
                  <div className="grid grid-cols-2 divide-x divide-[#d4af37]/30 border border-[#d4af37]/45 bg-[#090704]/90 text-center py-2 font-mono text-xs tabular-nums">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[#bda373] block text-[10px] uppercase">VÉ MỞ KHÓA</span>
                      <span className="inline-flex items-center gap-1 text-[#f5d97e] font-black">
                        <img
                          src={getLibertadoresAsset('unlockTicket')}
                          alt=""
                          className="w-4 h-4 object-contain"
                        />
                        {user.unlockTickets ?? 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[#bda373] block text-[10px] uppercase">TOKEN LIBERTADORES</span>
                      <span className="inline-flex items-center gap-1 text-[#f5d97e] font-black">
                        <img
                          src={getLibertadoresAsset('tokenSmall')}
                          alt=""
                          className="w-4 h-4 object-contain"
                        />
                        {(user.libertadoresTokens ?? 0).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {onOpenLibertadoresEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        onOpenLibertadoresEvent();
                      }}
                      className="w-full py-3.5 px-5 rounded-none bg-gradient-to-r from-[#c89b2b] via-[#e8c668] to-[#b8891e] hover:brightness-110 text-[#090603] border border-[#fbe59b] font-cruyff font-black text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {libertadoresUnlocked
                        ? 'VÀO CONMEBOL LIBERTADORES →'
                        : 'MỞ KHÓA SỚM / XEM 11/11 →'}
                    </button>
                  )}
                </div>
              </div>

              {onOpenVietnamChroniclesEvent && (
                <div className="relative min-h-[260px] p-5 sm:p-6 flex flex-col justify-between overflow-hidden rounded-none bg-gradient-to-br from-[#2a040a] via-[#4a0812] to-[#120306] md:col-span-3 border-t border-yellow-400/45">
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src="/assets/aistudio/vietnam_club_1d2bebf2.png"
                        alt="Biên Niên Sử Việt Nam"
                        className="w-12 h-12 object-contain shrink-0"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-300 block">
                          SỰ KIỆN DI SẢN · KHÔNG GIAO DỊCH
                        </span>
                        <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                          BIÊN NIÊN SỬ VIỆT NAM (+33 OVR RENDERZ)
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
                          Trả lời 10 câu hỏi random mỗi ngày (5 giây/câu) nhận +50 Mảnh Việt Nam/câu và đổi dàn sao Việt Nam giá trên 250 Mảnh.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        onOpenVietnamChroniclesEvent();
                      }}
                      className="py-3 px-5 rounded-none bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:brightness-105 text-slate-950 border border-yellow-100 font-cruyff font-black text-sm uppercase tracking-wider transition-all cursor-pointer shrink-0"
                    >
                      VÀO BIÊN NIÊN SỬ VIỆT NAM ({(user.vietnamShards ?? 0).toLocaleString('vi-VN')} MẢNH) →
                    </button>
                  </div>
                </div>
              )}

              {onOpenBundesligaEvent && (
                <div className="relative min-h-[220px] p-5 sm:p-6 flex flex-col justify-between overflow-hidden rounded-none bg-gradient-to-br from-[#2e0509] via-[#1c0407] to-black md:col-span-3 border-t border-red-500/50">
                  <img
                    src={BUNDESLIGA_ASSETS.bg2}
                    alt="Bundesliga"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
                  />
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={BUNDESLIGA_ASSETS.eventLogo}
                        alt="Bundesliga"
                        className="w-12 h-12 object-contain shrink-0"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-300 block">
                          CHƯƠNG BUNDESLIGA · LÀM MỚI 06:00 HẰNG NGÀY
                        </span>
                        <h3 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                          BUNDESLIGA · NHIỆM VỤ 5 BÀN THẮNG
                        </h3>
                        <p className="text-xs sm:text-sm text-red-100/90 mt-1">
                          Mỗi ngày sử dụng 1 cầu thủ Bundesliga ghi 5 bàn thắng để nhận ngay 1 Gói Pack 88+ Cầu Thủ Bundesliga.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        onOpenBundesligaEvent();
                      }}
                      className="py-3 px-5 rounded-none bg-gradient-to-r from-red-600 via-rose-500 to-red-700 hover:brightness-110 text-white border border-red-300 font-cruyff font-black text-sm uppercase tracking-wider transition-all cursor-pointer shrink-0"
                    >
                      VÀO BUNDESLIGA ({Math.min(BUNDESLIGA_DAILY_GOAL_TARGET, blState.goalsScoredToday)}/{BUNDESLIGA_DAILY_GOAL_TARGET} BÀN) →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePart === 'ranked' && (
            <div className="relative border border-white/30 bg-slate-900/60 p-6 sm:p-8 rounded-none overflow-hidden">
              <img
                src="/assets/aistudio/default_KEYMATCHCUSTOM_MEDIUM_BG_21d60d22.png"
                alt="Đấu Xếp Hạng"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60 pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300 block">
                    CHẾ ĐỘ ĐỐI KHÁNG XẾP HẠNG TRỰC TUYẾN
                  </span>
                  <h3 className="font-cruyff font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
                    ĐẤU XẾP HẠNG FC MOBILE
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    So tài chiến thuật cùng các đối thủ ngang tầm OVR, tích lũy Sao Xếp Hạng qua các bậc
                    từ Nghiệp Dư lên Huyền Thoại FC Champion để nhận Kim Cương, Xu và Vé Quay cuối mùa.
                  </p>

                  <div className="grid grid-cols-3 divide-x divide-white/25 border border-white/30 bg-slate-950/90 text-center py-3 font-mono tabular-nums">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">TỔNG SAO</span>
                      <span className="text-base font-black text-cyan-300">{rankedStars}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">OVR CLB</span>
                      <span className="text-base font-black text-yellow-300">{user.ovr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">THẮNG / THUA</span>
                      <span className="text-base font-black text-emerald-300">
                        {rankedWins}W - {rankedLosses}L
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-3 border border-white/25 bg-slate-950/90 p-5 rounded-none">
                  <div className="text-xs text-slate-300 space-y-1 border-b border-white/15 pb-3">
                    <div className="font-bold text-white uppercase">THƯỞNG THĂNG HẠNG & TRẬN THẮNG</div>
                    <div>+Sao Xếp Hạng · +Kim Cương · +Vé Quay mốc hạng</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onOpenRankedMode();
                    }}
                    className="w-full py-4 px-6 rounded-none bg-cyan-400 hover:bg-cyan-300 text-slate-950 border border-cyan-200 font-cruyff font-black text-base sm:text-lg uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    VÀO ĐẤU XẾP HẠNG NGAY →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePart === 'career' && (
            <div className="grid grid-cols-1 max-w-2xl mx-auto border border-white/30 bg-slate-900/50 rounded-none">
              {/* Sự Nghiệp Ngoại Hạng Anh */}
              <div className="relative min-h-[300px] p-6 flex flex-col justify-between overflow-hidden rounded-none">
                <img
                  src="/assets/aistudio/default_KEYMATCHCUSTOM_DIFFICULTY_BG__1__87671226.png"
                  alt="Ngoại Hạng Anh"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50 pointer-events-none" />

                <div className="relative z-10 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300 block">
                    38 VÒNG ĐẤU CHÍNH THỨC
                  </span>
                  <h3 className="font-cruyff font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                    SỰ NGHIỆP NGOẠI HẠNG ANH
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Dẫn dắt {user.teamName} chinh phục ngôi vương Premier League qua 38 vòng đấu kịch tính
                    (45 giây/trận), điều chỉnh chiến thuật và thay người trực tiếp trên sân.
                  </p>
                </div>

                <div className="relative z-10 pt-6 space-y-3">
                  <div className="grid grid-cols-2 divide-x divide-white/20 border border-white/25 bg-slate-950/90 text-center py-2 font-mono text-xs tabular-nums">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">TRẬN ĐÃ ĐẤU</span>
                      <span className="text-emerald-300 font-black">{careerPlayed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">OVR ĐỘI HÌNH</span>
                      <span className="text-yellow-300 font-black">{user.ovr}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      onOpenCareerMode('standings');
                    }}
                    className="w-full py-3.5 px-5 rounded-none bg-emerald-400 hover:bg-emerald-300 text-slate-950 border border-emerald-200 font-cruyff font-black text-sm sm:text-base uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    VÀO SỰ NGHIỆP NGOẠI HẠNG ANH →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
