import React, { useState, useEffect, useMemo } from 'react';
import { PlayerCard } from '../types/game';
import { useEuro2024Assets } from '../data/euro2024Assets';
import {
  useLibertadoresAssets,
  LIBERTADORES_TOKEN_SMALL_FALLBACK,
} from '../data/libertadoresAssets';
import { resolveClubCrestUrls } from '../utils/clubCrests';
import { VIETNAM_CHRONICLES_FRAME_DATA_URI } from '../data/vietnamChroniclesData';

const FALLBACK_PLAYER_AVATAR =
  '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png';
const ICON_CREST_URL =
  '/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png';

interface FCCardProps {
  player: PlayerCard;
  size?: 'pitch' | 'xs' | 'draft' | 'sm' | 'md' | 'lg' | 'hero';
  showStats?: boolean;
  className?: string;
  onClick?: () => void;
}

export const FCCard: React.FC<FCCardProps> = ({
  player,
  size = 'md',
  className = '',
  onClick,
}) => {
  const { getAsset: getEuroAsset } = useEuro2024Assets();
  const { getAsset: getLibAsset } = useLibertadoresAssets();
  const [imgErrorStage, setImgErrorStage] = useState<number>(0);
  const [clubImgStage, setClubImgStage] = useState<number>(0);

  const isFutureStars = player.cardType === 'FUTURE_STARS';
  const isUtotyIcons = player.cardType === 'UTOTY_ICONS';
  const isClassics = player.cardType === 'CLASSICS';
  const isLaliga = player.cardType === 'LALIGA';
  const isEuro2024 = player.cardType === 'EURO_2024';
  const isConmebolLibertadores = player.cardType === 'CONMEBOL_LIBERTADORES';
  const isBallonDor = player.cardType === 'BALLON_DOR';
  const isRonaldoChronicles = player.cardType === 'RONALDO_CHRONICLES';
  const isVietnamChronicles = player.cardType === 'VIETNAM_CHRONICLES';
  const isGingaIcon = player.cardType === 'GINGA_ICON';
  const isGinga = player.cardType === 'GINGA' || isGingaIcon;
  const isWelcome = player.cardType === 'WELCOME';
  const isTotyHm = player.cardType === 'TOTY26_HM';
  const isTotyIcon =
    player.cardType === 'UTOTY_ICON' || player.cardType === 'TOTY_ICON';
  const isUpgradedUtoty = Boolean(player.isUtotyUpgraded);

  const clubLower = (player.club || '').toLowerCase();
  const isIconCard =
    isClassics ||
    isUtotyIcons ||
    isTotyIcon ||
    isGingaIcon ||
    clubLower.includes('icon') ||
    clubLower.includes('legend');

  const clubCrestUrls = useMemo(
    () => resolveClubCrestUrls(player.club, player.clubLogo, isIconCard),
    [player.club, player.clubLogo, isIconCard]
  );

  const customEuroPortrait = isEuro2024 ? getEuroAsset(player.id, '') : '';
  const customLibPortrait = isConmebolLibertadores ? getLibAsset(player.id, '') : '';

  useEffect(() => {
    setImgErrorStage(0);
  }, [player.id, player.avatarUrl, customEuroPortrait, customLibPortrait]);

  useEffect(() => {
    setClubImgStage(0);
  }, [player.id, player.club, player.clubLogo, isIconCard]);

  if (size === 'pitch' || size === 'xs' || size === 'draft') {
    const outerClass =
      size === 'pitch'
        ? 'w-[70px] h-[70px] sm:w-[84px] sm:h-[84px]'
        : size === 'draft'
        ? 'w-[134px] h-[134px] sm:w-[154px] sm:h-[154px]'
        : 'w-[84px] h-[84px] sm:w-[96px] sm:h-[96px]';
    const scaleClass =
      size === 'pitch'
        ? 'scale-[0.4861] sm:scale-[0.5833]'
        : size === 'draft'
        ? 'scale-[0.9306] sm:scale-[1.0694]'
        : 'scale-[0.5833] sm:scale-[0.6667]';

    return (
      <div
        onClick={onClick}
        className={`relative select-none shrink-0 ${outerClass} ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div
          className={`w-[144px] h-[144px] origin-top-left ${scaleClass} pointer-events-none`}
        >
          <FCCard
            player={player}
            size="sm"
            showStats={false}
            className="!w-[144px] !h-[144px] hover:!scale-100"
          />
        </div>
      </div>
    );
  }

  const hasCustomFrame = Boolean(player.customFrameUrl);

  const getCardFrame = () => {
    if (player.customFrameUrl) {
      return player.customFrameUrl;
    }
    if (isUpgradedUtoty) {
      return '/assets/aistudio/khung_th__UTOTY_197a5b09.png';
    }
    if (isUtotyIcons) {
      return '/assets/aistudio/UTOTY_Icons_bfeb6ab6.png';
    }
    if (isClassics) {
      return '/assets/aistudio/khung_th__classics_6d23269c.png';
    }
    if (isTotyHm) {
      return '/assets/aistudio/backgrounds_TOTY26_HM_b1b0286b.png';
    }
    if (isWelcome) {
      return '/assets/aistudio/welcome_card_73ceda00.png';
    }
    if (isConmebolLibertadores) {
      return getLibAsset('cardFrame');
    }
    if (isBallonDor) {
      return '/assets/aistudio/khung_th__c_u_th__ballon_dor_fefecb94.png';
    }
    if (isRonaldoChronicles) {
      return '/assets/aistudio/khung_th__bi_n_ni_n_s__ronaldo_f3992fff.png';
    }
    if (isVietnamChronicles) {
      return VIETNAM_CHRONICLES_FRAME_DATA_URI;
    }
    if (isGinga) {
      return player.ovr >= 102
        ? '/assets/aistudio/khung_th__c_u_th__ginga_g_i_a_69452143.png'
        : '/assets/aistudio/khung_th__c_u_th__ginga_g_i_b_v__c_4028dd25.png';
    }
    if (isEuro2024) {
      return player.ovr >= 100
        ? getEuroAsset('frame100_105')
        : getEuroAsset('frame90_99');
    }
    if (isLaliga) {
      return '/assets/aistudio/POTM_LaLiga_Card_8bfc3918.png';
    }
    if (isFutureStars) {
      if (player.ovr >= 100) {
        return '/assets/aistudio/khung_th__c_u_th__ovr_100__0cf0427c.png';
      }
      return '/assets/aistudio/khung_th__c_u_th__99-_f1ce2665.png';
    }
    if (isTotyIcon) {
      return '/assets/aistudio/khung_th__c_u_th__huy_n_tho_i_8b108d78.png';
    }
    if (player.ovr >= 90) {
      return '/assets/aistudio/khung_th__c_u_th__tr_n_90_ovr_314a4ad0.png';
    }
    return '/assets/aistudio/khung_th__c_u_th__ovr_th_p___n_ovr_90_a4f2d4b3.png';
  };

  const frameSrc =
    getCardFrame() ||
    '/assets/aistudio/khung_th__c_u_th__tr_n_90_ovr_314a4ad0.png';

  const sizeClasses = {
    sm: 'w-32 h-32 sm:w-36 sm:h-36',
    md: 'w-48 h-48 sm:w-56 sm:h-56',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
    hero: 'w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96',
  };

  const isHeroOrLg = size === 'lg' || size === 'hero';

  // Exact typography color per sketch season
  const getTypographyStyle = (): { color: string; textShadow: string } => {
    if (isGinga) {
      // Mùa thẻ Ginga: chữ màu nâu đen, không viền chữ
      return {
        color: '#2B180C',
        textShadow: 'none',
      };
    }
    if (isVietnamChronicles) {
      // Biên Niên Sử Việt Nam: chữ màu trắng, không viền chữ
      return {
        color: '#FFFFFF',
        textShadow: 'none',
      };
    }
    if (hasCustomFrame || isBallonDor || isRonaldoChronicles) {
      // Xóa viền chữ trên các thẻ khung đặc biệt / Ballon d'Or / Ronaldo Chronicles
      return {
        color: '#FFFDF5',
        textShadow: 'none',
      };
    }
    if (isTotyIcon || isUtotyIcons) {
      // TOTY Icons & UTOTY Icons: Deep Antique Bronze-Espresso (#3B2A0A)
      return {
        color: '#3B2A0A',
        textShadow: '0 1px 0 rgba(255,255,255,0.35)',
      };
    }
    if (isWelcome) {
      // Welcome Card: Deep FC Forest-Emerald (#064E3B) on white/silver surface
      return {
        color: '#064E3B',
        textShadow: '0 1px 0 rgba(255,255,255,0.75)',
      };
    }
    if (isClassics) {
      // Classics: Deep Emerald-Teal (#0B4648)
      return {
        color: '#0B4648',
        textShadow: '0 1px 0 rgba(255,255,255,0.38)',
      };
    }
    if (isFutureStars) {
      if (player.ovr >= 100) {
        // Future Stars Gói A (100+): Deep Royal Navy (#082A72)
        return {
          color: '#082A72',
          textShadow: '0 1px 0 rgba(255,255,255,0.45)',
        };
      }
      // Future Stars Gói B (<100): Electric Cobalt Blue (#0C21B5)
      return {
        color: '#0C21B5',
        textShadow: '0 1px 0 rgba(255,255,255,0.55)',
      };
    }
    if (isUpgradedUtoty || isEuro2024 || isLaliga) {
      // UTOTY, EURO 2024 (Gói A & B), LaLiga: Pure Crisp White (#FFFFFF)
      return {
        color: '#FFFFFF',
        textShadow: isUpgradedUtoty
          ? '0 2px 6px rgba(0,0,0,0.55)'
          : '0 2px 5px rgba(0,0,0,0.82)',
      };
    }
    if (isConmebolLibertadores) {
      return {
        color: '#FCE8A6',
        textShadow: '0 2px 5px rgba(0,0,0,0.92)',
      };
    }
    // TOTY Thường (90+), TOTY Gói C (<90), TOTY HM: Warm Champagne Gold (#F3DCA6)
    return {
      color: '#F3DCA6',
      textShadow: '0 2px 5px rgba(0,0,0,0.88)',
    };
  };

  const typoStyle = getTypographyStyle();
  const isBoxGarrincha = player.id === 'box_ginga_garrincha_106';
  const ovrPosStyle = isBoxGarrincha
    ? {
        color: '#FFFFFF',
        textShadow: '0 2px 5px rgba(0,0,0,0.45)',
      }
    : typoStyle;

  // Resolve portrait URL with clean fallback chain (uses FALLBACK_PLAYER_AVATAR directly)
  const getPlayerImageSrc = (): string | null => {
    const customSeasonPortrait = customEuroPortrait || customLibPortrait;
    if (imgErrorStage === 0) {
      if (customSeasonPortrait) return customSeasonPortrait;
      if (!player.avatarUrl) {
        return FALLBACK_PLAYER_AVATAR;
      }
      return player.avatarUrl;
    }
    if (imgErrorStage === 1) {
      if (
        customSeasonPortrait &&
        player.avatarUrl &&
        player.avatarUrl !== customSeasonPortrait
      ) {
        return player.avatarUrl;
      }
      if (
        player.avatarFallbackUrl &&
        player.avatarFallbackUrl !== player.avatarUrl
      ) {
        return player.avatarFallbackUrl;
      }
      return FALLBACK_PLAYER_AVATAR;
    }
    if (imgErrorStage === 2) {
      return FALLBACK_PLAYER_AVATAR;
    }
    return null;
  };

  const currentImgSrc = getPlayerImageSrc();

  // Badge dimensions scaled cleanly per card size
  const flagSizeClass = isHeroOrLg
    ? 'w-7 h-[18px] sm:w-8 sm:h-5'
    : size === 'md'
    ? 'w-5 h-3.5'
    : 'w-3.5 h-2.5';

  const crestSizeClass = isHeroOrLg
    ? 'w-6 h-6 sm:w-7 sm:h-7'
    : size === 'md'
    ? 'w-4 h-4 sm:w-[18px] sm:h-[18px]'
    : 'w-3 h-3';

  // Mini Nation Flag SVG
  const renderMiniFlag = () => {
    const nation = (player.nation || '').toLowerCase();
    const cls = `${flagSizeClass} rounded-[1.5px] shadow-sm overflow-hidden shrink-0`;

    if (nation.includes('pháp') || nation.includes('france')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#002654" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#CE1126" />
        </svg>
      );
    }
    if (nation.includes('anh') || nation.includes('england')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#FFFFFF" />
          <rect x="13" width="4" height="20" fill="#CE1124" />
          <rect y="8" width="30" height="4" fill="#CE1124" />
        </svg>
      );
    }
    if (nation.includes('đan mạch') || nation.includes('denmark')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#C8102E" />
          <rect x="9" width="3.5" height="20" fill="#FFFFFF" />
          <rect y="8.2" width="30" height="3.5" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation.includes('croatia')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#FF0000" />
          <rect y="6.6" width="30" height="6.6" fill="#FFFFFF" />
          <rect y="13.2" width="30" height="6.8" fill="#171796" />
          <rect x="12.5" y="5.5" width="5" height="6" fill="#FF0000" />
        </svg>
      );
    }
    if (nation === 'ý' || nation.includes('italy')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#009246" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#CE2B37" />
        </svg>
      );
    }
    if (nation.includes('na uy') || nation.includes('norway')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#BA0C2F" />
          <rect x="8" width="5" height="20" fill="#FFFFFF" />
          <rect y="7" width="30" height="5" fill="#FFFFFF" />
          <rect x="9.5" width="2" height="20" fill="#00205B" />
          <rect y="8.5" width="30" height="2" fill="#00205B" />
        </svg>
      );
    }
    if (nation.includes('hà lan') || nation.includes('netherlands')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#AE1C28" />
          <rect y="6.6" width="30" height="6.6" fill="#FFFFFF" />
          <rect y="13.2" width="30" height="6.8" fill="#21468B" />
        </svg>
      );
    }
    if (nation.includes('tây ban nha') || nation.includes('spain')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="5" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
          <rect y="15" width="30" height="5" fill="#AA151B" />
        </svg>
      );
    }
    if (nation.includes('brazil')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#009739" />
          <polygon points="15,2 27,10 15,18 3,10" fill="#FEDD00" />
          <circle cx="15" cy="10" r="4.5" fill="#012169" />
        </svg>
      );
    }
    if (nation.includes('bồ đào nha') || nation.includes('portugal')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="12" height="20" fill="#006600" />
          <rect x="12" width="18" height="20" fill="#DA251D" />
          <circle cx="12" cy="10" r="3.5" fill="#FFFF00" />
        </svg>
      );
    }
    if (nation.includes('đức') || nation.includes('germany')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#000000" />
          <rect y="6.6" width="30" height="6.6" fill="#DD0000" />
          <rect y="13.2" width="30" height="6.8" fill="#FFCE00" />
        </svg>
      );
    }
    if (nation.includes('việt nam') || nation.includes('vietnam')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#DA251D" />
          <polygon
            points="15,4 16.5,8 21,8 17.5,11 19,15 15,12.5 11,15 12.5,11 9,8 13.5,8"
            fill="#FFFF00"
          />
        </svg>
      );
    }
    if (nation === 'nga' || nation.includes('russia')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#FFFFFF" />
          <rect y="6.6" width="30" height="6.7" fill="#0039A6" />
          <rect y="13.3" width="30" height="6.7" fill="#D52B1E" />
        </svg>
      );
    }
    if (nation.includes('ai cập') || nation.includes('egypt')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#CE1126" />
          <rect y="6.6" width="30" height="6.6" fill="#FFFFFF" />
          <rect y="13.2" width="30" height="6.8" fill="#000000" />
        </svg>
      );
    }
    if (nation.includes('senegal')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#00853F" />
          <rect x="10" width="10" height="20" fill="#FDEF42" />
          <rect x="20" width="10" height="20" fill="#E31B23" />
        </svg>
      );
    }
    if (nation.includes('uruguay')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#FFFFFF" />
          <rect y="2.5" width="30" height="2.5" fill="#0038A8" />
          <rect y="7.5" width="30" height="2.5" fill="#0038A8" />
          <rect y="12.5" width="30" height="2.5" fill="#0038A8" />
          <rect y="17.5" width="30" height="2.5" fill="#0038A8" />
          <rect width="11" height="10" fill="#FFFFFF" />
          <circle cx="5.5" cy="5" r="2.5" fill="#FCD116" />
        </svg>
      );
    }
    if (nation.includes('thổ nhĩ kỳ') || nation.includes('turkey')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#E30A17" />
          <circle cx="12" cy="10" r="4.5" fill="#FFFFFF" />
          <circle cx="13.5" cy="10" r="3.5" fill="#E30A17" />
          <circle cx="17.5" cy="10" r="1.4" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation.includes('bỉ') || nation.includes('belgium')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#000000" />
          <rect x="10" width="10" height="20" fill="#FFD90C" />
          <rect x="20" width="10" height="20" fill="#EF3340" />
        </svg>
      );
    }
    if (nation.includes('thụy sĩ') || nation.includes('switzerland')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#D52B1E" />
          <rect x="13" y="4" width="4" height="12" fill="#FFFFFF" />
          <rect x="9" y="8" width="12" height="4" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation.includes('georgia') || nation.includes('gruzia')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#FFFFFF" />
          <rect x="13" width="4" height="20" fill="#FF0000" />
          <rect y="8" width="30" height="4" fill="#FF0000" />
        </svg>
      );
    }
    if (nation.includes('ma-rốc') || nation.includes('ma rốc') || nation.includes('morocco')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#C1272D" />
          <polygon
            points="15,5 16.5,9.5 21,9.5 17.3,12.2 18.7,16.5 15,13.8 11.3,16.5 12.7,12.2 9,9.5 13.5,9.5"
            fill="none"
            stroke="#006233"
            strokeWidth="1.4"
          />
        </svg>
      );
    }
    if (nation.includes('cameroon')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#007A5E" />
          <rect x="10" width="10" height="20" fill="#CE1126" />
          <rect x="20" width="10" height="20" fill="#FCD116" />
          <circle cx="15" cy="10" r="2.2" fill="#FCD116" />
        </svg>
      );
    }
    if (nation.includes('nigeria')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#008751" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#008751" />
        </svg>
      );
    }
    if (nation.includes('hàn quốc') || nation.includes('korea')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#FFFFFF" />
          <circle cx="15" cy="10" r="5" fill="#CD2E3A" />
          <path
            d="M10,10 A5,5 0 0,0 20,10 A2.5,2.5 0 0,0 15,10 A2.5,2.5 0 0,1 10,10 Z"
            fill="#0047A0"
          />
        </svg>
      );
    }
    if (nation.includes('nhật') || nation.includes('japan')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#FFFFFF" />
          <circle cx="15" cy="10" r="5.5" fill="#BC002D" />
        </svg>
      );
    }
    if (nation === 'úc' || nation.includes('australia')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#00008B" />
          <rect width="14" height="10" fill="#012169" />
          <path d="M0,0 L14,10 M14,0 L0,10" stroke="#FFFFFF" strokeWidth="1.8" />
          <rect x="5.8" width="2.4" height="10" fill="#FFFFFF" />
          <rect y="3.8" width="14" height="2.4" fill="#FFFFFF" />
          <rect x="6.3" width="1.4" height="10" fill="#C8102E" />
          <rect y="4.3" width="14" height="1.4" fill="#C8102E" />
          <circle cx="7" cy="15" r="1.8" fill="#FFFFFF" />
          <circle cx="22" cy="6" r="1.1" fill="#FFFFFF" />
          <circle cx="25" cy="10" r="1.1" fill="#FFFFFF" />
          <circle cx="22" cy="14" r="1.1" fill="#FFFFFF" />
          <circle cx="19" cy="10.5" r="1.1" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation === 'mỹ' || nation.includes('hoa kỳ') || nation.includes('usa') || nation.includes('united states')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#FFFFFF" />
          <rect y="0" width="30" height="2.8" fill="#B22234" />
          <rect y="5.6" width="30" height="2.8" fill="#B22234" />
          <rect y="11.2" width="30" height="2.8" fill="#B22234" />
          <rect y="16.8" width="30" height="3.2" fill="#B22234" />
          <rect width="13" height="11" fill="#3C3B6E" />
          <circle cx="4" cy="3.5" r="1" fill="#FFFFFF" />
          <circle cx="9" cy="3.5" r="1" fill="#FFFFFF" />
          <circle cx="6.5" cy="5.8" r="1" fill="#FFFFFF" />
          <circle cx="4" cy="8" r="1" fill="#FFFFFF" />
          <circle cx="9" cy="8" r="1" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation.includes('ukraine')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="10" fill="#0057B7" />
          <rect y="10" width="30" height="10" fill="#FFD700" />
        </svg>
      );
    }
    if (nation.includes('hungary')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.7" fill="#CE2939" />
          <rect y="6.7" width="30" height="6.6" fill="#FFFFFF" />
          <rect y="13.3" width="30" height="6.7" fill="#477050" />
        </svg>
      );
    }
    if (nation.includes('ba lan') || nation.includes('poland')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="10" fill="#FFFFFF" />
          <rect y="10" width="30" height="10" fill="#DC143C" />
        </svg>
      );
    }
    if (nation.includes('séc') || nation.includes('czech')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="10" fill="#FFFFFF" />
          <rect y="10" width="30" height="10" fill="#D7141A" />
          <polygon points="0,0 15,10 0,20" fill="#11457E" />
        </svg>
      );
    }
    if (nation.includes('mexico')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#006847" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#CE1126" />
          <circle cx="15" cy="10" r="2.2" fill="#8B5A2B" />
        </svg>
      );
    }
    if (nation.includes('ả rập') || nation.includes('saudi')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="20" fill="#006C35" />
          <rect x="7" y="7" width="16" height="2.2" rx="1" fill="#FFFFFF" />
          <rect x="9" y="13" width="12" height="1.4" rx="0.7" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation.includes('bờ biển ngà') || nation.includes('ivory') || nation.includes('côte')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#F77F00" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#009E60" />
        </svg>
      );
    }
    if (nation.includes('colombia')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="10" fill="#FCD116" />
          <rect y="10" width="30" height="5" fill="#003893" />
          <rect y="15" width="30" height="5" fill="#CE1126" />
        </svg>
      );
    }
    if (nation.includes('ecuador')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="10" fill="#FFD100" />
          <rect y="10" width="30" height="5" fill="#034EA2" />
          <rect y="15" width="30" height="5" fill="#ED1C24" />
          <circle cx="15" cy="10" r="2.2" fill="#8B5A2B" />
        </svg>
      );
    }
    if (nation.includes('chile')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="10" fill="#FFFFFF" />
          <rect y="10" width="30" height="10" fill="#D52B1E" />
          <rect width="10" height="10" fill="#0039A6" />
          <circle cx="5" cy="5" r="2" fill="#FFFFFF" />
        </svg>
      );
    }
    if (nation.includes('paraguay')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#D52B1E" />
          <rect y="6.6" width="30" height="6.6" fill="#FFFFFF" />
          <rect y="13.2" width="30" height="6.8" fill="#0038A8" />
          <circle cx="15" cy="10" r="2" fill="#FCD116" />
        </svg>
      );
    }
    if (nation.includes('peru') || nation.includes('perú')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="10" height="20" fill="#D91023" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#D91023" />
        </svg>
      );
    }
    if (nation.includes('venezuela')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#FCE300" />
          <rect y="6.6" width="30" height="6.6" fill="#00247D" />
          <rect y="13.2" width="30" height="6.8" fill="#CF142B" />
        </svg>
      );
    }
    if (nation.includes('bolivia')) {
      return (
        <svg viewBox="0 0 30 20" className={cls}>
          <rect width="30" height="6.6" fill="#D52B1E" />
          <rect y="6.6" width="30" height="6.6" fill="#F9E300" />
          <rect y="13.2" width="30" height="6.8" fill="#007934" />
        </svg>
      );
    }
    // Default Argentina
    return (
      <svg viewBox="0 0 30 20" className={cls}>
        <rect width="30" height="6.6" fill="#75AADB" />
        <rect y="6.6" width="30" height="6.6" fill="#FFFFFF" />
        <rect y="13.2" width="30" height="6.8" fill="#75AADB" />
        <circle cx="15" cy="10" r="2" fill="#F6B40E" />
      </svg>
    );
  };

  // Authentic League Emblem for Center Bottom Slot using Official Uploaded Assets
  const renderMiniLeague = () => {
    const league = (player.league || '').toLowerCase();
    const club = clubLower;
    const cls = `${crestSizeClass} object-contain shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] select-none`;

    // CONMEBOL Libertadores (check first so Atlético Mineiro never falls through to LaLiga's 'atlético')
    if (
      isConmebolLibertadores ||
      league.includes('libertadores') ||
      league.includes('conmebol') ||
      club.includes('mineiro') ||
      club.includes('boca juniors') ||
      club.includes('palmeiras') ||
      club.includes('racing club') ||
      club.includes('são paulo') ||
      club.includes('sao paulo')
    ) {
      return (
        <img
          src={getLibAsset('tokenSmall')}
          alt="CONMEBOL Libertadores"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
          }}
          className={cls}
        />
      );
    }

    // Premier League
    if (
      league.includes('premier') ||
      club.includes('liverpool') ||
      club.includes('manchester') ||
      club.includes('man city') ||
      club.includes('man utd') ||
      club.includes('arsenal') ||
      club.includes('chelsea') ||
      club.includes('tottenham') ||
      club.includes('aston villa') ||
      club.includes('newcastle') ||
      club.includes('crystal palace') ||
      club.includes('everton') ||
      club.includes('ipswich') ||
      club.includes('brighton') ||
      club.includes('west ham')
    ) {
      return (
        <img
          src="/assets/aistudio/Premier_League_ad9034c5.png"
          alt="Premier League"
          className={cls}
        />
      );
    }

    // Bundesliga
    if (
      league.includes('bundesliga') ||
      club.includes('bayern') ||
      club.includes('leverkusen') ||
      club.includes('dortmund') ||
      club.includes('leipzig') ||
      club.includes('union berlin') ||
      club.includes('hamburg') ||
      club.includes('hsv') ||
      club.includes('heidenheim') ||
      club.includes('frankfurt') ||
      club.includes('stuttgart') ||
      club.includes('werder') ||
      club.includes('bremen')
    ) {
      return (
        <img
          src="/assets/aistudio/Bundesliga_6ac485c7.png"
          alt="Bundesliga"
          className={cls}
        />
      );
    }

    // Serie C
    if (
      league.includes('serie c') ||
      club.includes('ravenna') ||
      club.includes('ravena')
    ) {
      return (
        <img
          src="/assets/aistudio/serie_c_eade5a33.png"
          alt="Serie C"
          className={cls}
        />
      );
    }

    // Serie A
    if (
      league.includes('serie a') ||
      club.includes('ac milan') ||
      club.includes('inter milan') ||
      club.includes('juventus') ||
      club.includes('napoli') ||
      club.includes('roma') ||
      club.includes('como') ||
      club.includes('atalanta') ||
      club.includes('lazio') ||
      club.includes('fiorentina') ||
      club.includes('frosinone')
    ) {
      return (
        <img
          src="/assets/aistudio/Seria_A_4fdc6599.png"
          alt="Serie A"
          className={cls}
        />
      );
    }

    // LaLiga
    if (
      league.includes('la liga') ||
      league.includes('laliga') ||
      club.includes('real madrid') ||
      club.includes('barcelona') ||
      club.includes('atletico') ||
      club.includes('atlético') ||
      club.includes('athletic') ||
      club.includes('betis') ||
      club.includes('villarreal') ||
      club.includes('valencia') ||
      club.includes('real sociedad') ||
      club.includes('girona')
    ) {
      return (
        <img
          src="/assets/aistudio/La_Liga_bcae3f8f.png"
          alt="LaLiga"
          className={cls}
        />
      );
    }

    // Ligue 1
    if (
      league.includes('ligue 1') ||
      club.includes('psg') ||
      club.includes('paris') ||
      club.includes('marseille') ||
      club.includes('monaco') ||
      club.includes('lille') ||
      club.includes('lyon')
    ) {
      return (
        <img
          src="/assets/aistudio/Ligue_1_719d10f0.png"
          alt="Ligue 1"
          className={cls}
        />
      );
    }

    // MLS
    if (
      league.includes('mls') ||
      club.includes('nashville') ||
      club.includes('inter miami')
    ) {
      return (
        <svg viewBox="0 0 32 32" className={cls} aria-label="MLS">
          <path
            d="M4 4h24v13c0 6.5-5 10.2-12 12.5C9 27.2 4 23.5 4 17V4z"
            fill="#0A1931"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path d="M5 17h22v0c0 5.6-4.3 8.8-11 11-6.7-2.2-11-5.4-11-11z" fill="#C8102E" />
          <text
            x="16"
            y="14"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="7.5"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            MLS
          </text>
        </svg>
      );
    }

    // International / Rest of World
    return (
      <img
        src="/assets/aistudio/International_45a3b78e.png"
        alt="International"
        className={cls}
      />
    );
  };

  // Mini Club Crest for Right Bottom Slot — Strictly Official Club Logos First
  const renderMiniClub = () => {
    const cls = `${crestSizeClass} object-contain shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] select-none`;

    const activeCrestUrl = clubCrestUrls[clubImgStage];
    if (activeCrestUrl) {
      return (
        <img
          src={activeCrestUrl}
          alt={player.club}
          referrerPolicy="no-referrer"
          className={cls}
          onError={() => {
            setClubImgStage((prev) => prev + 1);
          }}
        />
      );
    }

    return <img src={ICON_CREST_URL} alt={player.club} className={cls} />;
  };

  // Nameplate font size adaptive to character count so names stay bold, upright & single-line
  const nameLen = (player.name || '').length;
  const nameplateSizeClass = isHeroOrLg
    ? nameLen > 15
      ? 'text-sm sm:text-base md:text-lg'
      : nameLen > 11
      ? 'text-base sm:text-lg md:text-xl'
      : 'text-lg sm:text-xl md:text-2xl'
    : size === 'md'
    ? nameLen > 15
      ? 'text-[10.5px] sm:text-xs'
      : nameLen > 11
      ? 'text-xs sm:text-sm'
      : 'text-sm sm:text-[15px]'
    : nameLen > 14
    ? 'text-[7.5px] sm:text-[8.5px]'
    : nameLen > 10
    ? 'text-[8.5px] sm:text-[9.5px]'
    : 'text-[9.5px] sm:text-[10.5px]';

  return (
    <div
      onClick={onClick}
      className={`relative select-none ${sizeClasses[size]} shrink-0 transition-transform duration-300 hover:scale-[1.03] ${className}`}
      style={{
        filter: isUtotyIcons
          ? 'drop-shadow(0 10px 25px rgba(0,0,0,0.65))'
          : isClassics
          ? 'drop-shadow(0 10px 26px rgba(45,212,191,0.4))'
          : isUpgradedUtoty
          ? 'drop-shadow(0 12px 28px rgba(250,204,21,0.48))'
          : isTotyHm
          ? undefined
          : isConmebolLibertadores
          ? 'drop-shadow(0 10px 26px rgba(212,175,55,0.45))'
          : isGinga
          ? 'drop-shadow(0 10px 26px rgba(34,197,94,0.45))'
          : isRonaldoChronicles
          ? 'drop-shadow(0 10px 28px rgba(234,179,8,0.45))'
          : isVietnamChronicles
          ? 'drop-shadow(0 10px 28px rgba(220,38,38,0.48))'
          : isWelcome
          ? 'drop-shadow(0 10px 24px rgba(16,185,129,0.38))'
          : isEuro2024
          ? 'drop-shadow(0 10px 26px rgba(16,185,129,0.42))'
          : isLaliga
          ? 'drop-shadow(0 10px 25px rgba(244,63,94,0.45))'
          : isFutureStars
          ? 'drop-shadow(0 10px 25px rgba(56,189,248,0.42))'
          : 'drop-shadow(0 10px 25px rgba(0,0,0,0.65))',
      }}
    >
      {/* 1. Official FC Card Frame Background */}
      <img
        src={frameSrc}
        alt="Card Frame"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
      />

      {/* 2. Large Heroic Player Cutout with Smooth Bottom Fade into Nameplate */}
      {!player.frameIncludesPortrait &&
        (() => {
          const isPackC = player.ovr < 90 && !isWelcome;
          const isMissingAvatarAsset = currentImgSrc === FALLBACK_PLAYER_AVATAR;
          const isIShowSpeedCutout = Boolean(
            currentImgSrc && currentImgSrc.includes('ishowspeed_')
          );
          const isWelcomeBasePortrait =
            isWelcome && !isIShowSpeedCutout && !isMissingAvatarAsset;
          const isLocalDynamicRender = Boolean(
            currentImgSrc &&
              currentImgSrc.startsWith('/assets/aistudio/') &&
              !isMissingAvatarAsset
          );
          const isFullTorsoCutout = Boolean(
            currentImgSrc &&
              (currentImgSrc.includes('jonathan_david_toty') ||
                currentImgSrc.includes('frimpong_toty') ||
                currentImgSrc.includes('gavi_toty'))
          );
          const isTallHeadCutout = Boolean(
            currentImgSrc && currentImgSrc.includes('gakpo_toty')
          );
          const isSportingRonaldoCutout = Boolean(
            currentImgSrc && currentImgSrc.includes('ronaldo_sporting_lisbon')
          );
          const nameLower = (player.name || '').trim().toLowerCase();
          const isEightyPercentLegend =
            player.id === 'chronicles_icon_david_luiz_97' ||
            (!isLocalDynamicRender && nameLower === 'david luiz');
          const isSeventyPercentPortrait =
            !isPackC &&
            !isWelcome &&
            !isEightyPercentLegend &&
            Boolean(
              currentImgSrc &&
                (currentImgSrc.includes('futbin.com') ||
                  currentImgSrc.includes('fotmob.com'))
            );

          const clipPathValue =
            hasCustomFrame || isVietnamChronicles
              ? 'inset(4.5% 19.5% 24.5% 19.5% round 4px 36% 0 0)'
              : isWelcome
              ? 'inset(5% 19.2% 38.2% 19.2% round 10px 10px 0 0)'
              : isUpgradedUtoty
              ? 'inset(2% 10% 25.5% 10% round 10px 10px 0 0)'
              : isEuro2024
              ? 'inset(3.5% 20% 25% 20% round 10px 10px 0 0)'
              : isLaliga
              ? 'inset(3% 17.5% 25% 17.5% round 8px 8px 0 0)'
              : isFutureStars && player.ovr < 100
              ? 'inset(3.5% 19.5% 25% 19.5% round 8px 8px 0 0)'
              : 'inset(3.5% 17.5% 25% 17.5% round 10px 10px 0 0)';

          const maskGradient = isWelcome
            ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 58.5%, rgba(0,0,0,0) 62%)'
            : isPackC && !isLocalDynamicRender && !isMissingAvatarAsset
            ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 72%)'
            : isUpgradedUtoty
            ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 73.5%)'
            : 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 59%, rgba(0,0,0,0) 74.2%)';

          return (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                clipPath: clipPathValue,
                WebkitMaskImage: maskGradient,
                maskImage: maskGradient,
              }}
            >
              <div
                className={`absolute flex items-end justify-center ${
                  isWelcomeBasePortrait
                    ? 'top-[6.5%] left-[21%] w-[60%] h-[55.3%]'
                    : isWelcome
                    ? 'top-[6.5%] left-[19%] w-[62%] h-[55.3%]'
                    : isPackC && !isLocalDynamicRender && !isMissingAvatarAsset
                    ? 'top-[1.5%] left-[18%] w-[64%] h-[56%]'
                    : isUpgradedUtoty
                    ? 'top-[6.5%] left-[20%] w-[64%] h-[65%]'
                    : isEuro2024
                    ? 'top-[7.5%] left-[19%] w-[64%] h-[65%]'
                    : isLaliga
                    ? 'top-[7%] left-[20%] w-[64%] h-[65%]'
                    : 'top-[7%] left-[19%] w-[65%] h-[65%]'
                }`}
              >
                {currentImgSrc ? (
                  <img
                    src={currentImgSrc}
                    alt={player.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-contain ${
                      isMissingAvatarAsset ? 'object-center opacity-95' : 'object-bottom'
                    } ${
                      isMissingAvatarAsset
                        ? ''
                        : isWelcome || isTotyHm || isUtotyIcons || isClassics || isTotyIcon
                        ? 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.32)]'
                        : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]'
                    } ${
                      isMissingAvatarAsset
                        ? isWelcome
                          ? 'scale-[2.05] origin-center translate-y-[11%]'
                          : 'scale-[1.75] origin-center translate-y-[2%]'
                        : isIShowSpeedCutout
                        ? 'scale-[1.06] origin-bottom translate-y-[2%]'
                        : isWelcomeBasePortrait
                        ? 'scale-[0.86] origin-bottom'
                        : isVietnamChronicles
                        ? isSeventyPercentPortrait
                          ? 'scale-[0.70] origin-center translate-y-[9.5%]'
                          : 'scale-[1.14] origin-bottom translate-y-[13.5%]'
                        : isPackC && !isLocalDynamicRender
                        ? 'scale-[0.70] origin-bottom'
                        : isSportingRonaldoCutout
                        ? 'scale-[1.45] origin-bottom translate-y-[28%]'
                        : isFullTorsoCutout
                        ? 'scale-[1.20] origin-bottom translate-y-[12%]'
                        : isTallHeadCutout
                        ? 'scale-[1.20] origin-bottom translate-y-[22%]'
                        : isSeventyPercentPortrait || isEightyPercentLegend
                        ? 'scale-[1.20] origin-center translate-y-[9.5%]'
                        : 'scale-[1.20] origin-bottom translate-y-[13.5%]'
                    } transition-transform duration-300`}
                    onError={() => {
                      setImgErrorStage((prev) => prev + 1);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-end justify-center pb-[1%]">
                    <svg
                      viewBox="0 0 100 105"
                      className={`${isPackC ? 'w-[70%]' : 'w-[58%]'} h-auto opacity-95`}
                    >
                      <circle cx="50" cy="34" r="19" fill="#4B4B4B" />
                      <path
                        d="M15 102 L15 80 C15 64 31 58 50 58 C69 58 85 64 85 80 L85 102 Z"
                        fill="#4B4B4B"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* 3. Top-Left Cluster: Upright OVR + Position ONLY (matches all 12 sketches) */}
      {!player.hideOvrAndPos && (
        <div
          className={`absolute z-20 flex flex-col items-center leading-none pointer-events-none ${
            isUpgradedUtoty
              ? 'top-[10.5%] left-[19.5%]'
              : isEuro2024
              ? 'top-[11%] left-[21.5%]'
              : isFutureStars && player.ovr < 100
              ? 'top-[10.8%] left-[22%]'
              : 'top-[10.8%] left-[20%]'
          }`}
        >
          <span
            className={`font-cruyff font-black not-italic tracking-tight tabular-nums leading-[0.92] ${
              isHeroOrLg
                ? 'text-4xl sm:text-[42px]'
                : size === 'md'
                ? 'text-[22px] sm:text-2xl'
                : 'text-[15px] sm:text-base'
            }`}
            style={ovrPosStyle}
          >
            {player.ovr}
          </span>

          <span
            className={`font-cruyff font-black not-italic uppercase tracking-tight mt-0.5 leading-none ${
              isHeroOrLg
                ? 'text-base sm:text-lg'
                : size === 'md'
                ? 'text-[11px] sm:text-xs'
                : 'text-[8px] sm:text-[9px]'
            }`}
            style={ovrPosStyle}
          >
            {player.position}
          </span>
        </div>
      )}

      {/* 3b. Boosted OVR overlay badge for full-frame cards that already bake base OVR into artwork */}
      {(player.hideOvrAndPos || player.frameIsComplete) &&
        player.baseOvr !== undefined &&
        player.ovr !== player.baseOvr && (
          <div
            className={`absolute z-30 pointer-events-none flex items-center justify-center bg-black/82 border border-white/35 backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.85)] ${
              isHeroOrLg
                ? 'top-[8.2%] left-[13.5%] w-[27%] h-[18%] rounded-xl'
                : size === 'md'
                ? 'top-[8.2%] left-[13.5%] w-[27%] h-[18%] rounded-xl'
                : 'top-[8%] left-[13%] w-[28%] h-[18.5%] rounded-lg'
            }`}
          >
            <span
              className={`font-cruyff font-black not-italic tabular-nums leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
                isHeroOrLg
                  ? 'text-4xl sm:text-[42px]'
                  : size === 'md'
                  ? 'text-2xl sm:text-[26px]'
                  : 'text-[16px] sm:text-[18px]'
              }`}
            >
              {player.ovr}
            </span>
          </div>
        )}

      {/* 4. Upright Condensed Uppercase Nameplate (matches all 12 sketches) */}
      {!player.frameIsComplete && (
        <div
          className={`absolute z-20 text-center flex items-center justify-center pointer-events-none ${
            isEuro2024 || isWelcome || (isFutureStars && player.ovr < 100)
              ? 'inset-x-[19.5%]'
              : 'inset-x-[17%]'
          } ${
            player.hideOvrAndPos
              ? isHeroOrLg
                ? 'top-[66.5%]'
                : size === 'md'
                ? 'top-[66.2%]'
                : 'top-[65.8%]'
              : isWelcome
              ? isHeroOrLg
                ? 'top-[64.5%]'
                : size === 'md'
                ? 'top-[64.2%]'
                : 'top-[63.8%]'
              : isHeroOrLg
              ? 'top-[63.5%]'
              : size === 'md'
              ? 'top-[63.2%]'
              : 'top-[62.8%]'
          }`}
        >
          <h4
            className={`font-cruyff font-black uppercase not-italic tracking-tight truncate max-w-full leading-none ${nameplateSizeClass}`}
            style={typoStyle}
            title={player.fullName || player.name}
          >
            {player.name}
          </h4>
        </div>
      )}

      {/* 5. Authentic Bottom Badge Row (Icons & CONMEBOL Libertadores: 2-slot around center 50% divider; Club/Event: 3-slot) */}
      {!player.frameIsComplete &&
        (isIconCard || isConmebolLibertadores ? (
          <div className="absolute top-[73.6%] h-[7.6%] inset-x-0 z-20 pointer-events-none">
            {/* Left of center 50% vertical divider: Nation Flag */}
            <div className="absolute left-[29.5%] w-[16.5%] inset-y-0 flex items-center justify-center">
              {player.nationFlag ? (
                <img
                  src={player.nationFlag}
                  alt={player.nation}
                  className={`${flagSizeClass} object-cover rounded-[1.5px] shadow-sm`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                renderMiniFlag()
              )}
            </div>

            {/* Right of center 50% vertical divider: Icon Shield Crest or Club Crest */}
            <div className="absolute left-[54%] w-[16.5%] inset-y-0 flex items-center justify-center">
              {isIconCard ? (
                <img
                  src={ICON_CREST_URL}
                  alt="Icons"
                  className={`${crestSizeClass} object-contain drop-shadow-sm select-none`}
                />
              ) : (
                renderMiniClub()
              )}
            </div>
          </div>
        ) : (
          <div
            className={`absolute ${
              isWelcome
                ? 'top-[75.0%]'
                : isUpgradedUtoty
                ? 'top-[73.2%]'
                : 'top-[74.2%]'
            } h-[7.4%] inset-x-0 z-20 pointer-events-none`}
          >
            {/* Left slot: Nation Flag */}
            <div className="absolute left-[25%] w-[14.5%] inset-y-0 flex items-center justify-center">
              {player.nationFlag ? (
                <img
                  src={player.nationFlag}
                  alt={player.nation}
                  className={`${flagSizeClass} object-cover rounded-[1.5px] shadow-sm`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                renderMiniFlag()
              )}
            </div>

            {/* Center slot: League Emblem (left clean on TOTY26_HM to match Olise sketch) */}
            {!isTotyHm && (
              <div className="absolute left-[42%] w-[16%] inset-y-0 flex items-center justify-center">
                {renderMiniLeague()}
              </div>
            )}

            {/* Right slot: Club Crest */}
            <div className="absolute left-[60%] w-[15%] inset-y-0 flex items-center justify-center">
              {renderMiniClub()}
            </div>
          </div>
        ))}
    </div>
  );
};
