import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { UserProfile } from '../types/game';
import { soundService } from '../services/sound';
import { useLanguage } from '../i18n/language';
import {
  useLibertadoresAssets,
  LIBERTADORES_TOKEN_SMALL_FALLBACK,
} from '../data/libertadoresAssets';

export interface FramelessResourceStripProps {
  user: UserProfile;
  compact?: boolean;
  onClickGems?: () => void;
  onClickTickets?: () => void;
  onClickShards?: () => void;
  onClickClubTokens?: () => void;
  onClickUnlockTickets?: () => void;
}

export const FramelessResourceStrip: React.FC<FramelessResourceStripProps> = ({
  user,
  compact = false,
  onClickGems,
  onClickTickets,
  onClickShards,
  onClickClubTokens,
  onClickUnlockTickets,
}) => {
  const { locale, t } = useLanguage();
  const { getAsset: getLibertadoresAsset } = useLibertadoresAssets();
  return (
    <div
      className={`flex items-center ${
        compact ? 'gap-3 sm:gap-4' : 'gap-3.5 sm:gap-5'
      } flex-wrap justify-end text-white select-none`}
    >
      {/* 1. Xu (Coins) */}
      <div
        className="flex items-center gap-1.5 whitespace-nowrap shrink-0"
        title={t('Xu (Coins)', 'Coins')}
      >
        <img
          src="/assets/aistudio/currencysmall_COIN_ec777114.png"
          alt="Coins"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
          {user.coins.toLocaleString(locale)}
        </span>
      </div>

      {/* 2. Kim Cương (Gems) */}
      <button
        type="button"
        onClick={() => {
          if (onClickGems) {
            soundService.playClick();
            onClickGems();
          }
        }}
        className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
          onClickGems ? 'cursor-pointer hover:opacity-85 transition-opacity' : 'cursor-default'
        }`}
        title="Kim Cương"
      >
        <img
          src="/assets/aistudio/currencysmall_CASH_b2121428.png"
          alt="Kim Cương"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
          {user.gems.toLocaleString('vi-VN')}
        </span>
        {onClickGems && (
          <span className="w-4 h-4 rounded-none bg-white text-slate-950 font-sans font-black text-[11px] leading-none flex items-center justify-center">
            +
          </span>
        )}
      </button>

      {/* 3. Token TOTY */}
      <div
        className="hidden sm:flex items-center gap-1.5 whitespace-nowrap shrink-0"
        title="Token TOTY"
      >
        <img
          src="/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png"
          alt="Token TOTY"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
          {(user.totyTokens ?? 0).toLocaleString('vi-VN')}
        </span>
      </div>

      {/* 4. Mảnh Siêu Sao TOTY */}
      <button
        type="button"
        onClick={() => {
          if (onClickShards) {
            soundService.playClick();
            onClickShards();
          }
        }}
        className={`hidden md:flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
          onClickShards ? 'cursor-pointer hover:opacity-85 transition-opacity' : 'cursor-default'
        }`}
        title="Mảnh Trao Đổi Ngôi Sao"
      >
        <img
          src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
          alt="Mảnh Trao Đổi"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
          {(user.totyShards ?? 0).toLocaleString('vi-VN')}
        </span>
      </button>

      {/* 5. Token Câu Lạc Bộ */}
      <button
        type="button"
        onClick={() => {
          if (onClickClubTokens) {
            soundService.playClick();
            onClickClubTokens();
          }
        }}
        className={`hidden lg:flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
          onClickClubTokens ? 'cursor-pointer hover:opacity-85 transition-opacity' : 'cursor-default'
        }`}
        title="Token Câu Lạc Bộ"
      >
        <img
          src="/assets/aistudio/club_token_908dbb4a.png"
          alt="Token CLB"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
          {(user.clubTokens ?? 0).toLocaleString('vi-VN')}
        </span>
      </button>

      {/* 6. Vé Quay */}
      <button
        type="button"
        onClick={() => {
          if (onClickTickets) {
            soundService.playClick();
            onClickTickets();
          }
        }}
        className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
          onClickTickets ? 'cursor-pointer hover:opacity-85 transition-opacity' : 'cursor-default'
        }`}
        title="Vé Quay"
      >
        <img
          src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
          alt="Vé Quay"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
          {(user.tickets ?? 0).toLocaleString('vi-VN')}
        </span>
        {onClickTickets && (
          <span className="w-4 h-4 rounded-none bg-white text-slate-950 font-sans font-black text-[11px] leading-none flex items-center justify-center">
            +
          </span>
        )}
      </button>

      {/* 7. Vé Mở Khóa Trước Sự Kiện */}
      <button
        type="button"
        onClick={() => {
          if (onClickUnlockTickets) {
            soundService.playClick();
            onClickUnlockTickets();
          }
        }}
        className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
          onClickUnlockTickets
            ? 'cursor-pointer hover:opacity-85 transition-opacity'
            : 'cursor-default'
        }`}
        title={t('Vé Mở Khóa Trước Sự Kiện', 'Event Early Unlock Ticket')}
      >
        <img
          src={getLibertadoresAsset('unlockTicket')}
          alt="Vé Mở Khóa"
          referrerPolicy="no-referrer"
          className="w-5 h-5 object-contain shrink-0"
        />
        <span className="font-mono font-bold text-xs sm:text-sm text-[#f5d97e] tabular-nums">
          {(user.unlockTickets ?? 0).toLocaleString(locale)}
        </span>
      </button>

      {/* 8. Token CONMEBOL Libertadores */}
      {(user.libertadoresTokens ?? 0) > 0 && (
        <div
          className="flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Token CONMEBOL Libertadores"
        >
          <img
            src={getLibertadoresAsset('tokenSmall')}
            alt="Token Libertadores"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
            }}
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="font-mono font-bold text-xs sm:text-sm text-[#fbe59b] tabular-nums">
            {(user.libertadoresTokens ?? 0).toLocaleString(locale)}
          </span>
        </div>
      )}

      {/* 9. Token Hiệp Phụ */}
      {(user.extraTimeTokens ?? 0) > 0 && (
        <div
          className="flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Token Hiệp Phụ"
        >
          <img
            src="/assets/aistudio/currencysmall_hi_p_ph__0bf0c435.png"
            alt="Token Hiệp Phụ"
            referrerPolicy="no-referrer"
            className="w-5 h-5 object-contain shrink-0"
          />
          <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300 tabular-nums">
            {(user.extraTimeTokens ?? 0).toLocaleString(locale)}
          </span>
        </div>
      )}
    </div>
  );
};

export interface TopSectionHeaderProps {
  title: string;
  subtitle?: string;
  titleLogo?: React.ReactNode;
  user: UserProfile;
  onBack: () => void;
  onGoHome?: () => void;
  backLabel?: string;
  onClickGems?: () => void;
  onClickTickets?: () => void;
  onClickShards?: () => void;
  onClickClubTokens?: () => void;
  onClickUnlockTickets?: () => void;
  extraRight?: React.ReactNode;
}

export const TopSectionHeader: React.FC<TopSectionHeaderProps> = ({
  title,
  subtitle,
  titleLogo,
  user,
  onBack,
  onGoHome,
  backLabel,
  onClickGems,
  onClickTickets,
  onClickShards,
  onClickClubTokens,
  onClickUnlockTickets,
  extraRight,
}) => {
  const { t } = useLanguage();
  const handleHome = onGoHome || onBack;

  return (
    <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 bg-slate-950/95 border-b border-white/25 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none font-cruyff">
      {/* Left: Back Button + Section Logo + Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            onBack();
          }}
          className="h-9 px-2.5 bg-white/5 hover:bg-white/15 border border-white/30 text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0 rounded-none"
          title={backLabel || t('Quay lại', 'Back')}
        >
          <ChevronLeft className="w-5 h-5" />
          {backLabel && (
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              {backLabel}
            </span>
          )}
        </button>

        {titleLogo && <div className="shrink-0 flex items-center">{titleLogo}</div>}

        <div className="min-w-0">
          <h1 className="font-cruyff font-black text-lg sm:text-2xl text-white uppercase tracking-wider truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-300 truncate leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Frameless Resource Row + Extra Controls + Main Screen (Home) Button */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
        <FramelessResourceStrip
          user={user}
          compact
          onClickGems={onClickGems}
          onClickTickets={onClickTickets}
          onClickShards={onClickShards}
          onClickClubTokens={onClickClubTokens}
          onClickUnlockTickets={onClickUnlockTickets}
        />

        {extraRight}

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            handleHome();
          }}
          className="h-9 px-3 bg-white/5 hover:bg-emerald-500/20 border border-white/35 hover:border-emerald-300 text-white flex items-center gap-2 transition-colors cursor-pointer shrink-0 rounded-none"
          title={t('Về Màn Hình Chính', 'Return to Main Menu')}
        >
          <img
            src="/assets/aistudio/headerbar_HOME_46aea045.png"
            alt={t('Màn hình chính', 'Main Menu')}
            referrerPolicy="no-referrer"
            className="w-4 h-4 object-contain filter invert opacity-95"
          />
          <span className="text-xs font-cruyff font-bold uppercase tracking-wider whitespace-nowrap">
            {t('Màn Hình Chính', 'Main Menu')}
          </span>
        </button>
      </div>
    </header>
  );
};
