import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundService } from '../services/sound';
import {
  ResourceRewardBundle,
  resourceRewardAnimService,
} from '../services/resourceRewardAnim';
import {
  getLibertadoresAssetUrl,
  LIBERTADORES_TOKEN_LARGE_FALLBACK,
} from '../data/libertadoresAssets';

interface ResourceDisplayItem {
  key: string;
  label: string;
  amount: number;
  iconUrl: string;
  fallbackIconUrl?: string;
}

export const ResourcePackOpeningModal: React.FC = () => {
  const [bundle, setBundle] = useState<ResourceRewardBundle | null>(null);
  const [phase, setPhase] = useState<'breathing' | 'glowing_out' | 'revealed'>(
    'breathing'
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return resourceRewardAnimService.subscribe((next) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setBundle(next);
      if (next) {
        setPhase('breathing');
        soundService.pauseBgmForPack();
      } else {
        soundService.stopAllPackAnimationAudio();
        soundService.resumeBgmAfterPack();
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const items: ResourceDisplayItem[] = useMemo(() => {
    if (!bundle) return [];
    const list: ResourceDisplayItem[] = [];

    if (bundle.gems && bundle.gems > 0) {
      list.push({
        key: 'gems',
        label: 'Kim Cương',
        amount: bundle.gems,
        iconUrl: '/assets/aistudio/currencysmall_CASH_b2121428.png',
      });
    }

    if (bundle.coins && bundle.coins > 0) {
      list.push({
        key: 'coins',
        label: 'Coin',
        amount: bundle.coins,
        iconUrl: '/assets/aistudio/currencysmall_COIN_ec777114.png',
      });
    }

    if (bundle.totyTokens && bundle.totyTokens > 0) {
      list.push({
        key: 'totyTokens',
        label: 'Token TOTY',
        amount: bundle.totyTokens,
        iconUrl: '/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png',
      });
    }

    if (bundle.clubTokens && bundle.clubTokens > 0) {
      list.push({
        key: 'clubTokens',
        label: 'Token CLB',
        amount: bundle.clubTokens,
        iconUrl: '/assets/aistudio/club_token_908dbb4a.png',
      });
    }

    if (bundle.libertadoresTokens && bundle.libertadoresTokens > 0) {
      list.push({
        key: 'libertadoresTokens',
        label: 'Token CONMEBOL Libertadores',
        amount: bundle.libertadoresTokens,
        iconUrl: getLibertadoresAssetUrl('tokenLarge'),
        fallbackIconUrl: LIBERTADORES_TOKEN_LARGE_FALLBACK,
      });
    }

    if (bundle.unlockTickets && bundle.unlockTickets > 0) {
      list.push({
        key: 'unlockTickets',
        label: 'Vé Mở Khóa Sự Kiện',
        amount: bundle.unlockTickets,
        iconUrl: getLibertadoresAssetUrl('unlockTicket'),
        fallbackIconUrl: '/assets/aistudio/v__m__kh_a_tr__c_s__ki_n_27573358.png',
      });
    }

    if (bundle.tickets && bundle.tickets > 0) {
      list.push({
        key: 'tickets',
        label: 'Vé Quay',
        amount: bundle.tickets,
        iconUrl: '/assets/aistudio/currencylarge_FESTIVE_DRAFT_VOUCHER_6e95ca19.png',
      });
    }

    return list;
  }, [bundle]);

  if (!bundle || items.length === 0) return null;

  const handleClickPack = () => {
    if (phase !== 'breathing') return;
    soundService.playPackOpenAnimationSfx();
    soundService.playPackTear();
    setPhase('glowing_out');

    timerRef.current = window.setTimeout(() => {
      soundService.playCoins();
      setPhase('revealed');
      timerRef.current = null;
    }, 1000);
  };

  const handleContinue = () => {
    soundService.playConfirmSelection();
    soundService.stopAllPackAnimationAudio();
    resourceRewardAnimService.dismissCurrent();
  };

  return (
    <div
      onClick={phase === 'breathing' ? handleClickPack : undefined}
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden select-none font-cruyff ${
        phase === 'breathing' ? 'cursor-pointer' : ''
      }`}
    >
      {/* BACKGROUND PACK */}
      <img
        src="/assets/aistudio/draft_TOTY26_BG_c07ec164.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
      />

      {/* BƯỚC 1 & 2: MỖI ẢNH PACK LỚN LÊN NHỎ XUỐNG -> NHẤN CHUỘT SÁNG LÊN RỒI BIẾN MẤT */}
      {(phase === 'breathing' || phase === 'glowing_out') && (
        <div className="relative z-10 flex items-center justify-center">
          <img
            src="/assets/aistudio/storepack_S11_F_676265b6.png"
            alt="Pack"
            className={`w-64 sm:w-80 md:w-96 max-h-[56vh] object-contain pointer-events-none select-none ${
              phase === 'breathing'
                ? 'animate-pack-breathe'
                : 'animate-pack-glow-vanish'
            }`}
          />
        </div>
      )}

      {/* BƯỚC 3: HIỂN THỊ ẢNH TÀI NGUYÊN KÈM SỐ LƯỢNG TÀI NGUYÊN + NÚT TIẾP TỤC Ở BÊN DƯỚI */}
      {phase === 'revealed' && (
        <div className="relative z-10 flex flex-col items-center justify-center px-4 animate-resource-pop-in">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex flex-col items-center justify-center text-center"
              >
                <img
                  src={item.iconUrl}
                  alt={item.label}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (
                      item.fallbackIconUrl &&
                      e.currentTarget.src !== window.location.origin + item.fallbackIconUrl
                    ) {
                      e.currentTarget.src = item.fallbackIconUrl;
                    }
                  }}
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.65)] pointer-events-none select-none"
                />
                <div className="mt-3 font-mono font-black text-2xl sm:text-4xl text-white tabular-nums drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]">
                  x{item.amount.toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="mt-7 px-9 py-2.5 rounded-full bg-gradient-to-r from-[#E0F2FE] via-white to-[#BAE6FD] hover:brightness-105 text-[#0A1E52] border-2 border-sky-300 font-cruyff font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_6px_22px_rgba(56,189,248,0.45)] cursor-pointer active:scale-95 transition-transform"
          >
            Tiếp tục
          </button>
        </div>
      )}
    </div>
  );
};
