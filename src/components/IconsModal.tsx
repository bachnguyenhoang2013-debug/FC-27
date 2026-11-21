import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import {
  ultimateExchangeIconsPlayers,
  classicsIconsPlayers,
  iconChronicles97Players,
  utotyIconsPlayers,
  totyClassicIconsPlayers,
  STARTER_OWNED_IDS,
} from '../data/mockData';
import {
  ronaldoChroniclesPlayers,
} from '../data/ronaldoChroniclesData';
import { normalizeRonaldoChroniclesState } from '../utils/dateUtils';
import { TopSectionHeader } from './TopSectionHeader';
import { IconsChroniclesSection } from './IconsChroniclesSection';
import { IconChroniclesChapters } from './IconChroniclesChapters';
import { UltimateIconsExchangeSection } from './UltimateIconsExchangeSection';
import { RonaldoChroniclesChapter } from './RonaldoChroniclesChapter';
import { FCCard } from './FCCard';
import { soundService } from '../services/sound';

export type IconsChapterId =
  | 'ch1'
  | 'ch2'
  | 'ch3'
  | 'ch4'
  | 'ch5'
  | 'ultimate'
  | 'ronaldo';

interface IconsModalProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  initialChapter?: IconsChapterId;
  onGoToShop: () => void;
  onGoToTickets: () => void;
  onGoToRanked: () => void;
  onClose: () => void;
  onGoHome?: () => void;
}

export const IconsModal: React.FC<IconsModalProps> = ({
  user,
  onUpdateUser,
  initialChapter = 'ch1',
  onGoToShop,
  onGoToTickets,
  onGoToRanked,
  onClose,
  onGoHome,
}) => {
  const [activeChapter, setActiveChapter] = useState<IconsChapterId>(initialChapter);
  const [inspectedIcon, setInspectedIcon] = useState<PlayerCard | null>(null);

  useEffect(() => {
    setActiveChapter(initialChapter);
  }, [initialChapter]);

  const ownedSet = useMemo(
    () =>
      new Set(
        user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS
      ),
    [user.ownedPlayerIds]
  );

  const ronaldoClaimedCount = useMemo(
    () =>
      normalizeRonaldoChroniclesState(
        user.ronaldoChronicles,
        user.ownedPlayerIds
      ).claimedClubIds.length,
    [user.ronaldoChronicles, user.ownedPlayerIds]
  );

  const allIconsShowcase = useMemo(() => {
    const seen = new Set<string>();
    const list: PlayerCard[] = [];
    for (const p of [
      ...ronaldoChroniclesPlayers,
      ...ultimateExchangeIconsPlayers,
      ...classicsIconsPlayers,
      ...iconChronicles97Players,
      ...utotyIconsPlayers,
      ...totyClassicIconsPlayers,
    ]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      list.push(p);
    }
    return list;
  }, []);

  const iconTokens = user.iconTokens ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-cruyff">
      {/* Official Uploaded Icon Chronicles Background */}
      <img
        src="/assets/aistudio/background_bi_n_ni_n_s__icons_144336ee.png"
        alt="Biên Niên Sử Icons Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950/90 pointer-events-none" />

      <TopSectionHeader
        title="BIÊN NIÊN SỬ ICONS · CHƯƠNG HUYỀN THOẠI & TRAO ĐỔI TỐI THƯỢNG"
        subtitle={`Token Icon hiện có: ${iconTokens} · Biên Niên Sử Ronaldo đã chuyển sang Khu Phức Hợp (${ronaldoClaimedCount}/5 CLB) · Trao Đổi Tối Thượng 104–106 OVR`}
        user={user}
        onBack={onClose}
        onGoHome={onGoHome || onClose}
        onClickGems={onGoToShop}
        onClickTickets={onGoToTickets}
      />

      {/* 6 CHAPTERS NAVIGATION BAR (RONALDO CHRONICLES MOVED TO KHU PHỨC HỢP) */}
      <div className="relative z-20 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-white/25 divide-x divide-y lg:divide-y-0 divide-white/20 bg-slate-950/90 backdrop-blur-sm shrink-0">
        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('ch1');
          }}
          className={`py-2.5 px-3 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none ${
            activeChapter === 'ch1'
              ? 'bg-teal-950/90 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <img
            src="/assets/aistudio/khung_th__classics_6d23269c.png"
            alt="Chương 1"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="truncate">Chương 1: Classics 95</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('ch2');
          }}
          className={`py-2.5 px-3 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none ${
            activeChapter === 'ch2'
              ? 'bg-amber-950/90 text-yellow-300 border-b-2 border-yellow-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <img
            src="/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png"
            alt="Chương 2"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="truncate">Chương 2: Đền Đường</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('ch3');
          }}
          className={`py-2.5 px-3 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none ${
            activeChapter === 'ch3'
              ? 'bg-amber-950/90 text-amber-300 border-b-2 border-amber-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <img
            src="/assets/aistudio/logo_c_u_h_i_h_ng_ng_y_bi_n_ni_n_s__icons_6ca967f8.png"
            alt="Chương 3 Hành Trình"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="truncate">Chương 3: Hành Trình</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('ch4');
          }}
          className={`py-2.5 px-3 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none ${
            activeChapter === 'ch4'
              ? 'bg-amber-950/90 text-amber-300 border-b-2 border-amber-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <img
            src="/assets/aistudio/logo_tr_n___u_bi_n_ni_n_s__icons_06d8089b.png"
            alt="Chương 4 Khoảnh Khắc"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="truncate">Chương 4: Khoảnh Khắc</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('ch5');
          }}
          className={`py-2.5 px-3 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none ${
            activeChapter === 'ch5'
              ? 'bg-amber-950/90 text-yellow-300 border-b-2 border-yellow-400'
              : 'text-slate-200 hover:text-white hover:bg-white/10'
          }`}
        >
          <img
            src="/assets/aistudio/logo_ph_n_th__ng_bi_n_ni_n_s__icons_2e69c3ae.png"
            alt="Chương 5 Phần Thưởng"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="truncate">Chương 5: Phần Thưởng</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playTabSwitch();
            setActiveChapter('ultimate');
          }}
          className={`py-2.5 px-3 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-none ${
            activeChapter === 'ultimate'
              ? 'bg-gradient-to-r from-amber-950/95 via-yellow-900/90 to-amber-950/95 text-yellow-200 border-b-2 border-yellow-400'
              : 'bg-amber-950/40 text-amber-200 hover:text-white hover:bg-amber-900/50'
          }`}
        >
          <img
            src="/assets/aistudio/khung_th__zidane_104_ovr_8d9ba9ac.png"
            alt="Trao Đổi Tối Thượng"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="truncate">Trao Đổi Tối Thượng</span>
        </button>
      </div>

      {/* MAIN CHAPTER CONTENT */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
        {activeChapter === 'ch1' && (
          <IconsChroniclesSection
            user={user}
            onUpdateUser={onUpdateUser}
            onGoToShop={() => {
              onClose();
              onGoToShop();
            }}
            onGoToTickets={() => {
              onClose();
              onGoToTickets();
            }}
          />
        )}

        {activeChapter === 'ch2' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Ultimate Icons Exchange Featured Banner */}
            <div className="bg-slate-950/95 border-2 border-yellow-400/85 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex -space-x-2 shrink-0">
                  <img
                    src="/assets/aistudio/khung_th__hugo_sanchez_106_ovr_21f92b85.png"
                    alt="Hugo Sánchez Frame"
                    className="w-10 h-10 object-contain z-10"
                  />
                  <img
                    src="/assets/aistudio/khung_th__zidane_104_ovr_8d9ba9ac.png"
                    alt="Zidane Frame"
                    className="w-10 h-10 object-contain"
                  />
                  <img
                    src="/assets/aistudio/khung_th__cahill_104_ovr_386f0ed6.png"
                    alt="Cahill Frame"
                    className="w-10 h-10 object-contain"
                  />
                  <img
                    src="/assets/aistudio/khung_th__toure_104_ovr_8f9eca8a.png"
                    alt="Touré Frame"
                    className="w-10 h-10 object-contain"
                  />
                  <img
                    src="/assets/aistudio/khung_th__david_luiz_104_ovr_4e63c1ef.png"
                    alt="David Luiz Frame"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-base text-yellow-300 uppercase truncate">
                    TRAO ĐỔI TỐI THƯỢNG (104–106 OVR · KHUNG RIÊNG · KHÔNG GIAO DỊCH)
                  </div>
                  <p className="text-xs text-slate-300">
                    Đổi 10 Huyền Thoại 102–104 lấy Icon 104 (David Luiz, Zidane, Al-Owairan, Touré, Cahill) hoặc 15 Cầu Thủ 102+ lấy 106 Hugo Sánchez
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveChapter('ultimate');
                }}
                className="py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 cursor-pointer rounded-none"
              >
                <span>Trao Đổi Tối Thượng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-950/90 border border-white/15 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-white/15">
                <h3 className="font-black text-lg text-white uppercase">
                  ĐỀN ĐƯỜNG HUYỀN THOẠI ({allIconsShowcase.length} ICONS)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveChapter('ultimate')}
                    className="py-1.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                  >
                    Tới Trao Đổi Tối Thượng 104–106
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChapter('ch5')}
                    className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                  >
                    Tới Chương 5: Đổi Icon 97 OVR
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {allIconsShowcase.map((iconCard) => {
                  const isOwned = ownedSet.has(iconCard.id);
                  const isUltimate = Boolean(iconCard.customFrameUrl && iconCard.isUntradeableOnly);
                  return (
                    <div
                      key={iconCard.id}
                      onClick={() => {
                        soundService.playClick();
                        setInspectedIcon(iconCard);
                      }}
                      className={`p-3 bg-slate-900/90 border flex flex-col items-center text-center cursor-pointer transition-colors ${
                        isUltimate
                          ? 'border-yellow-400/75 hover:border-yellow-300'
                          : 'border-white/15 hover:border-yellow-400'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                        <span
                          className={
                            iconCard.cardType === 'RONALDO_CHRONICLES'
                              ? 'text-amber-300'
                              : isUltimate
                              ? 'text-yellow-300'
                              : ''
                          }
                        >
                          {iconCard.cardType === 'RONALDO_CHRONICLES'
                            ? 'RONALDO 100'
                            : isUltimate
                            ? 'TỐI THƯỢNG · KGD'
                            : iconCard.cardType === 'CLASSICS'
                            ? 'CLASSICS'
                            : 'ICONS'}
                        </span>
                        <span
                          className={
                            isOwned ? 'text-emerald-300' : 'text-slate-400'
                          }
                        >
                          {isOwned ? 'Đã có' : `${iconCard.ovr} OVR`}
                        </span>
                      </div>
                      <FCCard player={iconCard} size="sm" showStats={false} />
                      <div className="mt-2 font-black text-sm text-white uppercase truncate w-full">
                        {iconCard.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {iconCard.position} · {iconCard.nation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(activeChapter === 'ch3' ||
          activeChapter === 'ch4' ||
          activeChapter === 'ch5') && (
          <IconChroniclesChapters
            chapter={
              activeChapter === 'ch3' ? 3 : activeChapter === 'ch4' ? 4 : 5
            }
            user={user}
            onUpdateUser={onUpdateUser}
            onGoToRanked={() => {
              onClose();
              onGoToRanked();
            }}
            onSwitchChapter={(nextCh) =>
              setActiveChapter(
                nextCh === 3 ? 'ch3' : nextCh === 4 ? 'ch4' : 'ch5'
              )
            }
          />
        )}

        {activeChapter === 'ultimate' && (
          <UltimateIconsExchangeSection
            user={user}
            onUpdateUser={onUpdateUser}
            onGoToShop={() => {
              onClose();
              onGoToShop();
            }}
            onGoToTickets={() => {
              onClose();
              onGoToTickets();
            }}
          />
        )}

        {activeChapter === 'ronaldo' && (
          <RonaldoChroniclesChapter user={user} onUpdateUser={onUpdateUser} />
        )}
      </div>

      {inspectedIcon && (
        <div
          onClick={() => setInspectedIcon(null)}
          className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-950 border-2 border-yellow-400 p-5 flex flex-col items-center gap-3 text-center rounded-none"
          >
            {inspectedIcon.isUntradeableOnly && (
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                <span className="px-2 py-0.5 bg-rose-950/90 border border-rose-400/65 text-rose-200">
                  KHÔNG GIAO DỊCH
                </span>
                <span className="px-2 py-0.5 bg-amber-950/90 border border-yellow-400/70 text-yellow-200">
                  KHUNG THẺ RIÊNG · TRAO ĐỔI TỐI THƯỢNG
                </span>
              </div>
            )}
            <FCCard player={inspectedIcon} size="hero" showStats={true} />
            <div className="font-black text-xl text-white uppercase">
              {inspectedIcon.fullName || inspectedIcon.name}
            </div>
            <div className="text-xs text-slate-300 tabular-nums">
              OVR {inspectedIcon.ovr} · {inspectedIcon.position} ·{' '}
              {inspectedIcon.nation}
            </div>
            <div className="w-full grid grid-cols-6 gap-1.5 bg-slate-900 border border-white/15 p-2.5 text-center tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">PAC</div>
                <div className="font-black text-sm text-yellow-300">{inspectedIcon.pac}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">SHO</div>
                <div className="font-black text-sm text-yellow-300">{inspectedIcon.sho}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PAS</div>
                <div className="font-black text-sm text-yellow-300">{inspectedIcon.pas}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DRI</div>
                <div className="font-black text-sm text-yellow-300">{inspectedIcon.dri}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DEF</div>
                <div className="font-black text-sm text-yellow-300">{inspectedIcon.def}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PHY</div>
                <div className="font-black text-sm text-yellow-300">{inspectedIcon.phy}</div>
              </div>
            </div>
            {inspectedIcon.cardType === 'RONALDO_CHRONICLES' &&
            activeChapter !== 'ronaldo' ? (
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setInspectedIcon(null);
                  setActiveChapter('ronaldo');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
              >
                Tới Biên Niên Sử Ronaldo (Trả Lời &gt;7/10 Câu)
              </button>
            ) : (
              inspectedIcon.isUntradeableOnly &&
              inspectedIcon.cardType !== 'RONALDO_CHRONICLES' &&
              activeChapter !== 'ultimate' && (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setInspectedIcon(null);
                    setActiveChapter('ultimate');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                >
                  {inspectedIcon.ovr >= 106
                    ? 'Tới Trao Đổi Tối Thượng (15 Cầu Thủ 102+)'
                    : 'Tới Trao Đổi Tối Thượng (10 Huyền Thoại 102–104)'}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setInspectedIcon(null)}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
