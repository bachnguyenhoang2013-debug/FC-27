import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PlayerCard, UserProfile } from '../types/game';
import { TopSectionHeader } from './TopSectionHeader';
import {
  STAR_SHARD_LARGE_ICON,
  TotyShardsSection,
} from './TotyShardsSection';
import { FCCard } from './FCCard';
import { PixelPlayerCardPanel } from './PixelPlayerCardPanel';
import { PackOpeningModal } from './PackOpeningModal';

interface TotyShardsModalProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onClickGems?: () => void;
  onClickTickets?: () => void;
  onOpenMyTeam?: () => void;
  onClose: () => void;
}

export const TotyShardsModal: React.FC<TotyShardsModalProps> = ({
  user,
  onUpdateUser,
  onClickGems,
  onClickTickets,
  onClose,
}) => {
  const [notice, setNotice] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [inspectedPlayer, setInspectedPlayer] = useState<PlayerCard | null>(null);
  const [claimedSuperstar, setClaimedSuperstar] = useState<PlayerCard | null>(null);

  const handleShowToast = (text: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050b16] text-white flex flex-col overflow-hidden select-none font-cruyff">
      {/* Stadium Star Signings Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.18),_rgba(7,13,26,0.94)_58%,_#040812_100%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-500/15 via-cyan-500/5 to-transparent pointer-events-none" />

      {notice && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[75] px-5 py-2.5 rounded-full border font-bold text-sm shadow-2xl ${
            notice.tone === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-rose-950/95 border-rose-400 text-rose-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      <TopSectionHeader
        title="TRAO ĐỔI MẢNH · STAR SIGNINGS"
        subtitle="Ký hợp đồng siêu sao bằng Mảnh Trao Đổi & phân tách thẻ dự bị"
        titleLogo={
          <img
            src={STAR_SHARD_LARGE_ICON}
            alt="Mảnh Trao Đổi"
            className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.65)]"
          />
        }
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        onClickGems={onClickGems}
        onClickTickets={onClickTickets}
      />

      <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-5 flex items-start justify-center">
        <TotyShardsSection
          user={user}
          onUpdateUser={onUpdateUser}
          onInspectPlayer={(player) => setInspectedPlayer(player)}
          onClaimedPlayerReveal={(player) => setClaimedSuperstar(player)}
          onShowToast={handleShowToast}
        />
      </div>

      {/* Inspect Player Modal */}
      {inspectedPlayer && (
        <div
          onClick={() => setInspectedPlayer(null)}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#071021] border border-cyan-400/45 p-6 flex flex-col items-center shadow-2xl"
          >
            <div className="w-full flex items-center justify-between border-b border-white/15 pb-3 mb-4">
              <h3 className="font-cruyff font-black text-lg uppercase text-cyan-200">
                CHI TIẾT CẦU THỦ
              </h3>
              <button
                type="button"
                onClick={() => setInspectedPlayer(null)}
                className="p-1.5 rounded-full border border-white/20 hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <FCCard player={inspectedPlayer} size="lg" showStats={true} />
            <div className="mt-3 text-center">
              <div className="font-cruyff font-black text-lg text-emerald-300 uppercase">
                {inspectedPlayer.fullName || inspectedPlayer.name}
              </div>
              <div className="text-xs text-slate-300">
                {selectedPlayerPosLine(inspectedPlayer)}
              </div>
            </div>
            <PixelPlayerCardPanel player={inspectedPlayer} className="mt-3 w-full" />
          </div>
        </div>
      )}

      {/* Seasonal Contract Signing Walkout Reveal */}
      {claimedSuperstar && (
        <PackOpeningModal
          fixedPlayer={claimedSuperstar}
          isContractSigning={true}
          isTicketSpin={false}
          skipResourceBonus={true}
          packName={`KÝ HỢP ĐỒNG THÀNH CÔNG · ${claimedSuperstar.name}`}
          onClose={() => setClaimedSuperstar(null)}
          onPlayerClaimed={() => setClaimedSuperstar(null)}
        />
      )}
    </div>
  );
};

function selectedPlayerPosLine(p: PlayerCard): string {
  return `${p.position} · OVR ${p.ovr} · ${p.club}`;
}
