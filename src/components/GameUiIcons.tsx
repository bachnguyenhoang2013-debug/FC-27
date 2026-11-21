import React from 'react';

/**
 * Logo Cửa Hàng: Minimalist pale-gold shopping cart icon (#F5DE83)
 */
export const StoreCartLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M2.5 4H5.2L7.4 14.2C7.58 15.05 8.33 15.65 9.2 15.65H17.8C18.62 15.65 19.34 15.1 19.56 14.31L21.4 7.5H6.1"
      stroke="#F5DE83"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.2 7.5H20.8L19.1 13.8H8.4L7.2 7.5Z"
      fill="#F5DE83"
      fillOpacity="0.92"
    />
    <circle cx="9.5" cy="19.2" r="1.8" fill="#F5DE83" />
    <circle cx="17.5" cy="19.2" r="1.8" fill="#F5DE83" />
  </svg>
);

/**
 * Logo Đội Hình: Red metallic 3D training cone with 3 red stars below
 */
export const SquadConeLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="coneRedGrad" x1="10" y1="3" x2="26" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF5A52" />
        <stop offset="48%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
      <linearGradient id="coneBaseGrad" x1="4" y1="20" x2="32" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="55%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#650A0A" />
      </linearGradient>
    </defs>
    {/* Base diamond plate */}
    <polygon points="18,18.5 31,22.5 18,26.8 5,22.5" fill="url(#coneBaseGrad)" />
    {/* Cone body */}
    <path d="M15.8 4.2C16.3 3.2 19.7 3.2 20.2 4.2L25.6 21.8C23.2 23.2 12.8 23.2 10.4 21.8L15.8 4.2Z" fill="url(#coneRedGrad)" />
    {/* Subtle highlight */}
    <path d="M16.9 4.8L13.5 21.4C14.6 21.8 15.8 22 17 22L17.9 4.8H16.9Z" fill="#FCA5A5" fillOpacity="0.38" />
    {/* 3 Red Stars underneath */}
    <polygon points="8.5,27.2 9.4,29.1 11.5,29.4 10,30.8 10.4,32.9 8.5,31.9 6.6,32.9 7,30.8 5.5,29.4 7.6,29.1" fill="#EF4444" />
    <polygon points="18,28.8 19.1,31 21.5,31.3 19.7,33 20.2,35.3 18,34.2 15.8,35.3 16.3,33 14.5,31.3 16.9,31" fill="#EF4444" />
    <polygon points="27.5,27.2 28.4,29.1 30.5,29.4 29,30.8 29.4,32.9 27.5,31.9 25.6,32.9 26,30.8 24.5,29.4 26.6,29.1" fill="#EF4444" />
  </svg>
);

/**
 * Logo Phần Thưởng Sau Trận Đấu: 3D Gold Gift Box with Ribbon & White 5-point Star
 */
export const RewardGiftBoxIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="giftGoldFront" x1="12" y1="22" x2="44" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="55%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </linearGradient>
      <linearGradient id="giftGoldSide" x1="38" y1="22" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#CA8A04" />
        <stop offset="100%" stopColor="#713F12" />
      </linearGradient>
      <linearGradient id="giftRibbon" x1="20" y1="8" x2="44" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    {/* Top Ribbon Bow */}
    <path d="M31 20C24 10 15 12 17 19C18.5 23 26 22 31 20Z" fill="url(#giftRibbon)" stroke="#FEF08A" strokeWidth="1" />
    <path d="M33 20C40 10 49 12 47 19C45.5 23 38 22 33 20Z" fill="url(#giftRibbon)" stroke="#FEF08A" strokeWidth="1" />
    {/* Lid */}
    <polygon points="10,21 38,18 54,23 26,27" fill="#FEF08A" />
    <polygon points="10,21 26,27 26,33 10,27" fill="#FACC15" />
    <polygon points="26,27 54,23 54,29 26,33" fill="#CA8A04" />
    {/* Box Body */}
    <polygon points="12,28 38,33 38,57 12,51" fill="url(#giftGoldFront)" />
    <polygon points="38,33 52,28 52,51 38,57" fill="url(#giftGoldSide)" />
    {/* Vertical Ribbon Stripe */}
    <polygon points="43,31 47,29.5 47,53 43,54.8" fill="#FEF08A" fillOpacity="0.7" />
    {/* Front White 5-Point Star */}
    <polygon
      points="25,35 27.2,40.2 32.8,40.7 28.5,44.4 29.8,49.9 25,47 20.2,49.9 21.5,44.4 17.2,40.7 22.8,40.2"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Nút Chơi (chưa ghi tên lên ảnh): Hexagonal-pointed golden button with >> top-left and > bottom-right
 */
export const CareerPlayButton: React.FC<{
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ label = 'CHƠI', onClick, disabled = false, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative group inline-flex items-center justify-center px-10 py-3.5 cursor-pointer select-none transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
  >
    <svg
      viewBox="0 0 260 68"
      className="absolute inset-0 w-full h-full drop-shadow-[0_6px_20px_rgba(234,179,8,0.45)]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="careerPlayGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7CC" />
          <stop offset="35%" stopColor="#FDE068" />
          <stop offset="70%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>
      </defs>
      <polygon
        points="22,3 238,3 257,34 238,65 22,65 3,34"
        fill="url(#careerPlayGold)"
        stroke="#FFFFFF"
        strokeOpacity="0.65"
        strokeWidth="2"
      />
      {/* Top-left >> arrows matching reference */}
      <polygon points="24,12 29,16 24,20" fill="#18181B" />
      <polygon points="31,12 36,16 31,20" fill="#18181B" />
      {/* Bottom-right > arrow matching reference */}
      <polygon points="231,47 236,51 231,55" fill="#18181B" />
    </svg>
    <span className="relative z-10 font-cruyff font-black text-xl sm:text-2xl tracking-wider uppercase italic text-zinc-950 whitespace-nowrap">
      {label}
    </span>
  </button>
);

/**
 * Nút Thay Cầu Thủ: Uses untouched /assets/aistudio/draft_TOTY26_BTN_62974508.png with overlaid label
 */
export const SubstitutePillButton: React.FC<{
  label?: string;
  subCountText?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ label = 'THAY CẦU THỦ', subCountText, onClick, disabled = false, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex items-center justify-center px-6 py-2.5 cursor-pointer select-none transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
  >
    <img
      src="/assets/aistudio/draft_TOTY26_BTN_62974508.png"
      alt=""
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none drop-shadow-[0_4px_14px_rgba(234,179,8,0.4)]"
    />
    <span className="relative z-10 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-950 whitespace-nowrap flex items-center gap-1.5">
      <span>{label}</span>
      {subCountText && <span className="font-mono text-[11px] font-bold opacity-80">({subCountText})</span>}
    </span>
  </button>
);

/**
 * Nút Hoàn Thành: Pale mint-cyan pill (#DFFDFB) with overlaid bold dark text
 */
export const CompletePillButton: React.FC<{
  label?: string;
  onClick: () => void;
  className?: string;
}> = ({ label = 'HOÀN THÀNH', onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative inline-flex items-center justify-center px-10 py-3 rounded-full bg-[#DFFDFB] hover:bg-[#c8faf6] border border-white/80 shadow-[0_6px_24px_rgba(223,253,251,0.35)] cursor-pointer select-none transition-transform duration-150 hover:scale-105 active:scale-95 ${className}`}
  >
    <span className="font-cruyff font-black text-base sm:text-lg uppercase tracking-wider text-zinc-950 whitespace-nowrap">
      {label}
    </span>
  </button>
);

/**
 * Ảnh cầu thủ mục sự nghiệp bên dưới phần bình luận viên:
 * Left: Featured Premier League player portrait over red/white stripes + maroon plate
 * Right: Premier League purple/green panel (/assets/aistudio/itemexchange_EXTRA_TIME_TOKEN_59197a13.png) with 3 white live stat bars
 */
export const CommentatorBelowStatsBanner: React.FC<{
  featuredPlayerName: string;
  featuredPlayerAvatar: string;
  possessionUser: number;
  shotsText: string;
  tacticLabel: string;
}> = ({
  featuredPlayerName,
  featuredPlayerAvatar,
  possessionUser,
  shotsText,
  tacticLabel,
}) => (
  <div className="w-full rounded-xl overflow-hidden border border-white/20 shadow-lg grid grid-cols-12 h-32 shrink-0 bg-zinc-900">
    {/* Left 5 cols: Red & white vertical stripes + player cutout + dark maroon bottom bar */}
    <div
      className="col-span-5 relative flex flex-col justify-end overflow-hidden"
      style={{
        background:
          'repeating-linear-gradient(90deg, #DC2626 0px, #DC2626 12px, #F8FAFC 12px, #F8FAFC 24px)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15 pointer-events-none" />
      <img
        src={featuredPlayerAvatar}
        alt={featuredPlayerName}
        referrerPolicy="no-referrer"
        className="relative z-10 w-24 h-24 mx-auto object-contain object-bottom scale-125 translate-y-1 drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]"
        onError={(e) => {
          const fb = '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
          if (!e.currentTarget.src.endsWith('_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png')) {
            e.currentTarget.src = fb;
          }
        }}
      />
      <div className="relative z-20 bg-[#5B0E14] px-2 py-1 text-center border-t border-white/20">
        <span className="block font-cruyff font-bold text-[10px] text-white uppercase tracking-wider truncate">
          {featuredPlayerName}
        </span>
      </div>
    </div>

    {/* Right 7 cols: Premier League green-purple card + 3 white live stat bars */}
    <div className="col-span-7 relative p-2.5 flex flex-col justify-center gap-1.5 overflow-hidden">
      <img
        src="/assets/aistudio/itemexchange_EXTRA_TIME_TOKEN_59197a13.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />
      <div className="relative z-10 bg-white/95 rounded px-2 py-1 flex items-center justify-between text-[10px] text-zinc-900 font-bold shadow-sm">
        <span className="truncate">Kiểm soát bóng</span>
        <span className="font-mono text-purple-900">{possessionUser}% - {100 - possessionUser}%</span>
      </div>
      <div className="relative z-10 bg-white/95 rounded px-2 py-1 flex items-center justify-between text-[10px] text-zinc-900 font-bold shadow-sm">
        <span className="truncate">Dứt điểm (Đội nhà - Khách)</span>
        <span className="font-mono text-purple-900">{shotsText}</span>
      </div>
      <div className="relative z-10 bg-white/95 rounded px-2 py-1 flex items-center justify-between text-[10px] text-zinc-900 font-bold shadow-sm">
        <span className="truncate">Chiến thuật</span>
        <span className="text-emerald-700 uppercase truncate max-w-[92px]">{tacticLabel}</span>
      </div>
    </div>
  </div>
);

/**
 * Logo Tập Luyện Future Stars: 3D Iridescent Crystal Training Cone on Glass Diamond Base
 */
export const FutureStarsTrainingLogo: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsConeBody" x1="40" y1="8" x2="40" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="32%" stopColor="#93C5FD" />
        <stop offset="56%" stopColor="#F9A8D4" />
        <stop offset="82%" stopColor="#E0E7FF" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>
      <linearGradient id="fsConeBaseTop" x1="12" y1="48" x2="68" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="50%" stopColor="#F5D0FE" />
        <stop offset="100%" stopColor="#93C5FD" />
      </linearGradient>
      <linearGradient id="fsConeBaseRim" x1="8" y1="54" x2="72" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    {/* Crystal Base Thickness */}
    <polygon points="8,55 40,68 72,55 72,59 40,73 8,59" fill="url(#fsConeBaseRim)" />
    {/* Crystal Base Top Plate */}
    <polygon
      points="40,44 72,55 40,68 8,55"
      fill="url(#fsConeBaseTop)"
      stroke="#FFFFFF"
      strokeWidth="1.4"
    />
    {/* Elliptical Base Reflection Ring */}
    <ellipse cx="40" cy="54" rx="18" ry="6.5" fill="#C084FC" fillOpacity="0.35" stroke="#60A5FA" strokeWidth="1" />
    {/* Iridescent Crystal Cone */}
    <path
      d="M38.2 9.5C38.8 7.8 41.2 7.8 41.8 9.5L56.5 52.5C51.5 57.5 28.5 57.5 23.5 52.5L38.2 9.5Z"
      fill="url(#fsConeBody)"
      stroke="#E0F2FE"
      strokeWidth="1.3"
    />
    {/* Refractive Bands inside Cone */}
    <path d="M31.5 29.5C36.5 31.8 43.5 31.8 48.5 29.5L51.5 38.5C45 41.5 35 41.5 28.5 38.5L31.5 29.5Z" fill="#FDF2F8" fillOpacity="0.65" />
    <path d="M27.2 42C34 45.2 46 45.2 52.8 42L55.2 49.5C47.5 53.5 32.5 53.5 24.8 49.5L27.2 42Z" fill="#DBEAFE" fillOpacity="0.55" />
    {/* Specular Left Glass Highlight */}
    <path d="M39.3 11L28.5 51.5C30.8 52.8 33.2 53.4 35.5 53.6L40.2 11H39.3Z" fill="#FFFFFF" fillOpacity="0.72" />
  </svg>
);

/**
 * Logo Trận Đấu Future Stars: 3D Split Iridescent Crystal Football Pitch (Blue Top & Pink/Pearl Bottom)
 */
export const FutureStarsMatchLogo: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsPitchTop" x1="16" y1="10" x2="60" y2="39" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="55%" stopColor="#7DD3FC" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="fsPitchBottom" x1="16" y1="41" x2="60" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="48%" stopColor="#FCE7F3" />
        <stop offset="100%" stopColor="#FEF9C3" />
      </linearGradient>
      <linearGradient id="fsPrismSide" x1="58" y1="12" x2="65" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="45%" stopColor="#2563EB" />
        <stop offset="70%" stopColor="#DB2777" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>
    </defs>
    {/* Right 3D Prism Depth Edges */}
    <rect x="57" y="12" width="6.5" height="25.5" rx="2.5" fill="url(#fsPrismSide)" />
    <rect x="57" y="42.5" width="6.5" height="25.5" rx="2.5" fill="url(#fsPrismSide)" />

    {/* Top Crystal Half-Pitch */}
    <rect
      x="16"
      y="11"
      width="44"
      height="26.5"
      rx="4"
      fill="url(#fsPitchTop)"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Top Penalty Box & Goal Box */}
    <path d="M27 11V21.5H49V11" stroke="#1E40AF" strokeOpacity="0.65" strokeWidth="1.8" />
    <path d="M33 11V16.2H43V11" stroke="#FFFFFF" strokeWidth="1.5" />
    {/* Top Center Semi-Circle */}
    <path d="M30.5 37.5A7.5 7.5 0 0 1 45.5 37.5" stroke="#1E3A8A" strokeOpacity="0.65" strokeWidth="1.8" />

    {/* Bottom Crystal Half-Pitch */}
    <rect
      x="16"
      y="42.5"
      width="44"
      height="26.5"
      rx="4"
      fill="url(#fsPitchBottom)"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Bottom Center Semi-Circle */}
    <path d="M30.5 42.5A7.5 7.5 0 0 0 45.5 42.5" stroke="#86198F" strokeOpacity="0.65" strokeWidth="1.8" />
    {/* Bottom Penalty Box & Goal Box */}
    <path d="M27 69V58.5H49V69" stroke="#1E40AF" strokeOpacity="0.55" strokeWidth="1.8" />
    <path d="M33 69V63.8H43V69" stroke="#FFFFFF" strokeWidth="1.5" />
  </svg>
);

/**
 * Logo Phần Quà Future Stars: 3D Isometric Crystal Gift Box with White 5-Point Star
 */
export const FutureStarsGiftLogo: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsGiftFront" x1="14" y1="26" x2="48" y2="66" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="48%" stopColor="#E879F9" />
        <stop offset="100%" stopColor="#FEF3C7" />
      </linearGradient>
      <linearGradient id="fsGiftSide" x1="48" y1="26" x2="68" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="55%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#9333EA" />
      </linearGradient>
      <linearGradient id="fsGiftLidTop" x1="12" y1="18" x2="68" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="55%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#F5D0FE" />
      </linearGradient>
    </defs>
    {/* Lower Box Front Face */}
    <polygon
      points="15,31 49,35 49,64 15,59"
      fill="url(#fsGiftFront)"
      stroke="#E0F2FE"
      strokeWidth="1.4"
    />
    {/* Lower Box Right Side Face */}
    <polygon
      points="49,35 67,30 67,58 49,64"
      fill="url(#fsGiftSide)"
      stroke="#E0F2FE"
      strokeWidth="1.4"
    />
    {/* Right Face Crystal Ribbon */}
    <polygon points="56,33 61,31.6 61,60 56,61.6" fill="#FFFFFF" fillOpacity="0.42" />
    {/* Lid Top */}
    <polygon
      points="12,21 33,17 69,21 49,26"
      fill="url(#fsGiftLidTop)"
      stroke="#FFFFFF"
      strokeWidth="1.4"
    />
    {/* Lid Front Rim */}
    <polygon
      points="12,21 49,26 49,35 12,30"
      fill="#60A5FA"
      fillOpacity="0.88"
      stroke="#FFFFFF"
      strokeWidth="1.3"
    />
    {/* Lid Side Rim */}
    <polygon
      points="49,26 69,21 69,30 49,35"
      fill="#818CF8"
      fillOpacity="0.9"
      stroke="#E0F2FE"
      strokeWidth="1.3"
    />
    {/* Front White 5-Point Star */}
    <polygon
      points="31.5,34 34.4,41.6 42.5,42.1 36.1,47 38.2,54.8 31.5,50.3 24.8,54.8 26.9,47 20.5,42.1 28.6,41.6"
      fill="#FFFFFF"
      stroke="#2563EB"
      strokeWidth="1.4"
    />
  </svg>
);

/**
 * Logo Trao Đổi Future Stars: 3D Iridescent Crystal Shield with Left & Right Exchange Arrows
 */
export const FutureStarsExchangeLogo: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fsShieldFace" x1="20" y1="10" x2="60" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="38%" stopColor="#93C5FD" />
        <stop offset="68%" stopColor="#FBCFE8" />
        <stop offset="100%" stopColor="#FEFCE8" />
      </linearGradient>
      <linearGradient id="fsShieldBevel" x1="48" y1="12" x2="68" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
    </defs>
    {/* 3D Right Crystal Shield Bevel */}
    <path
      d="M40 9L56 21L67 16L63 54L40 71L44 68L59 52L63 19L54 23L40 12V9Z"
      fill="url(#fsShieldBevel)"
    />
    {/* Main Crystal Shield Face */}
    <path
      d="M38 10L24 21L14 17L18 54L38 70L59 54L63 17L53 21L38 10Z"
      fill="url(#fsShieldFace)"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Inner Glass Rim */}
    <path
      d="M38 14.5L25.5 24L18 21L21.5 51.5L38 65L55 51.5L58.5 21L51 24L38 14.5Z"
      stroke="#60A5FA"
      strokeOpacity="0.55"
      strokeWidth="1.2"
    />
    {/* Left-Pointing Upper Arrow */}
    <polygon
      points="22,34 31,25 31,30.5 43,30.5 43,37.5 31,37.5 31,43"
      fill="#FFFFFF"
      stroke="#3B82F6"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Right-Pointing Lower Arrow */}
    <polygon
      points="55,44 46,35 46,40.5 34,40.5 34,47.5 46,47.5 46,53"
      fill="#FFFFFF"
      stroke="#8B5CF6"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

