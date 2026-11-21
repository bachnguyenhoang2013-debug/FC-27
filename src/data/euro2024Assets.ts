import { useState, useEffect } from 'react';

/**
 * Centralized untouched asset paths & live resolver for
 * "Ôn lại kỷ niệm: EURO 2024" & EURO 2024 Ticket Spin.
 * Zero modification to any user-uploaded image, video, or audio file.
 */
export const EURO2024_ASSETS = {
  background: '/assets/aistudio/euro2024/bg_euro2024.png',
  pack: '/assets/aistudio/euro2024/pack_euro2024.png',
  cardFrame: '/assets/aistudio/euro2024/frame_100_105.png',
  frame100_105: '/assets/aistudio/euro2024/frame_100_105.png',
  frame90_99: '/assets/aistudio/euro2024/frame_90_99.png',
  iconSmall: '/assets/aistudio/euro2024/icon_small.png',
  iconLarge: '/assets/aistudio/euro2024/icon_large.png',
  claimButton: '/assets/aistudio/euro2024/claim_button.png',
  questFrame: '/assets/aistudio/euro2024/quest_frame.png',
  chainRewardFrame: '/assets/aistudio/euro2024/chain_reward_frame.png',
  videoWalkoutIntro: '/assets/aistudio/euro2024/video_walkout_intro.mp4',
  videoStageLoop: '/assets/aistudio/euro2024/video_stage_loop.mp4',
  audioWalkoutIntro: '/assets/aistudio/euro2024/audio_walkout_intro.mp3',
  audioStageLoop: '/assets/aistudio/euro2024/audio_stage_loop.mp3',
  // 25 Untouched EURO 2024 Player Portraits
  euro24_yamal: '/assets/aistudio/euro2024/yamal_104.png',
  euro24_rodri: '/assets/aistudio/euro2024/rodri_104.png',
  euro24_fabian_ruiz: '/assets/aistudio/euro2024/fabian_ruiz_103.png',
  euro24_olmo: '/assets/aistudio/euro2024/olmo_103.png',
  euro24_musiala: '/assets/aistudio/euro2024/musiala_102.png',
  euro24_nico_williams: '/assets/aistudio/euro2024/nico_williams_102.png',
  euro24_cucurella: '/assets/aistudio/euro2024/cucurella_101.png',
  euro24_saliba: '/assets/aistudio/euro2024/saliba_101.png',
  euro24_gakpo: '/assets/aistudio/euro2024/gakpo_100.png',
  euro24_maignan: '/assets/aistudio/euro2024/maignan_100.png',
  euro24_akanji: '/assets/aistudio/euro2024/akanji_99.png',
  euro24_xhaka: '/assets/aistudio/euro2024/xhaka_99.png',
  euro24_walker: '/assets/aistudio/euro2024/walker_98.png',
  euro24_bellingham: '/assets/aistudio/euro2024/bellingham_98.png',
  euro24_mamardashvili: '/assets/aistudio/euro2024/mamardashvili_97.png',
  euro24_kane: '/assets/aistudio/euro2024/kane_96.png',
  euro24_kroos: '/assets/aistudio/euro2024/kroos_96.png',
  euro24_saka: '/assets/aistudio/euro2024/saka_95.png',
  euro24_guler: '/assets/aistudio/euro2024/guler_95.png',
  euro24_kante: '/assets/aistudio/euro2024/kante_94.png',
  euro24_diogo_costa: '/assets/aistudio/euro2024/diogo_costa_94.png',
  euro24_guehi: '/assets/aistudio/euro2024/guehi_93.png',
  euro24_de_vrij: '/assets/aistudio/euro2024/de_vrij_92.png',
  euro24_de_bruyne: '/assets/aistudio/euro2024/de_bruyne_91.png',
  euro24_yildiz: '/assets/aistudio/euro2024/yildiz_90.png',
  fallbackPortrait: '/assets/aistudio/_nh_c_u_th__n_u_kh_ng_hi_n_th_____c_e141ec44.png',
} as const;

export type Euro2024AssetKey = keyof typeof EURO2024_ASSETS | string;

const EURO2024_UPDATED_EVENT = 'fc_euro2024_assets_updated';

let resolvedCache: Record<string, string> = {};
let hasFetchedInitial = false;
let inflightFetch: Promise<Record<string, string>> | null = null;

export async function refreshEuro2024AssetsStatus(): Promise<Record<string, string>> {
  if (inflightFetch) return inflightFetch;
  inflightFetch = fetch('/api/euro2024-assets/status')
    .then((r) =>
      r.ok && (r.headers.get('content-type') || '').includes('application/json')
        ? r.json()
        : { resolved: {} }
    )
    .then((data: { resolved?: Record<string, string> }) => {
      if (data && data.resolved && typeof data.resolved === 'object') {
        resolvedCache = data.resolved;
      }
      hasFetchedInitial = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EURO2024_UPDATED_EVENT));
      }
      return resolvedCache;
    })
    .catch(() => {
      hasFetchedInitial = true;
      return resolvedCache;
    })
    .finally(() => {
      inflightFetch = null;
    });
  return inflightFetch;
}

export function getEuro2024AssetUrl(key: Euro2024AssetKey, explicitFallback?: string): string {
  if (resolvedCache[key]) {
    return resolvedCache[key];
  }
  const builtIn = (EURO2024_ASSETS as Record<string, string>)[key];
  if (builtIn) {
    return builtIn;
  }
  if (explicitFallback !== undefined) {
    return explicitFallback;
  }
  return '';
}

export function hasCustomEuro2024Asset(key: Euro2024AssetKey): boolean {
  if (resolvedCache[key]) return true;
  if (key === 'fallbackPortrait') return false;
  return Boolean((EURO2024_ASSETS as Record<string, string>)[key]);
}

export function getEuro2024CustomCount(): number {
  const keys = new Set<string>([
    ...Object.keys(EURO2024_ASSETS).filter((k) => k !== 'fallbackPortrait'),
    ...Object.keys(resolvedCache),
  ]);
  return keys.size;
}

export function useEuro2024Assets() {
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    if (!hasFetchedInitial) {
      void refreshEuro2024AssetsStatus();
    }
    const onUpdated = () => setTick((t) => t + 1);
    let lastFocusRefresh = 0;
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastFocusRefresh > 4000) {
        lastFocusRefresh = now;
        void refreshEuro2024AssetsStatus();
      }
    };
    window.addEventListener(EURO2024_UPDATED_EVENT, onUpdated);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.removeEventListener(EURO2024_UPDATED_EVENT, onUpdated);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, []);

  return {
    getAsset: getEuro2024AssetUrl,
    hasCustom: hasCustomEuro2024Asset,
    customCount: getEuro2024CustomCount(),
    refresh: refreshEuro2024AssetsStatus,
  };
}
