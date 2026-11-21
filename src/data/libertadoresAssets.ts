import { useState, useEffect } from 'react';

export const LIBERTADORES_TOKEN_SMALL_FALLBACK =
  '/assets/aistudio/currencysmall_conmebol_libertadores_TOKEN_bc407b18.png';
export const LIBERTADORES_TOKEN_LARGE_FALLBACK =
  '/assets/aistudio/currencylarge_conmebol_libertadores_TOKEN_35860ba9.png';

/**
 * Exact, untouched CONMEBOL Libertadores & Early Unlock Ticket assets
 * uploaded by the user in /public/assets/aistudio/ and /public/assets/aistudio/libertadores/.
 */
export const LIBERTADORES_FALLBACK_ASSETS = {
  tokenSmall: LIBERTADORES_TOKEN_SMALL_FALLBACK,
  tokenLarge: LIBERTADORES_TOKEN_LARGE_FALLBACK,
  unlockTicket: '/assets/aistudio/v__m__kh_a_tr__c_s__ki_n_27573358.png',
  entranceBanner: '/assets/aistudio/entrance_conmebol_libertadores_c9e630da.png',
  eventLogo: '/assets/aistudio/logo_conmebol_libertadores_4052c782.png',
  minigameLogo: '/assets/aistudio/logo_minigame_conmebol_libertadores_64f86adc.png',
  rewardBoxLogo: '/assets/aistudio/logo_ph_n_th__ng_conmebol_libertadores_310a3077.png',
  bgMain: '/assets/aistudio/background_ch__ng_ch_nh_83c2dfd0.png',
  bgChapter2: '/assets/aistudio/background_ch__ng_2_5bb119b7.png',
  bgChapter3: '/assets/aistudio/background_ch__ng_3_86d72f45.png',
  bgRewards: '/assets/aistudio/background_ch__ng_ph_n_th__ng_b53b631d.png',
  triviaIntroBanner: '/assets/aistudio/_nh_gi_i_thi_u_ch__ng_3_69aabb3a.png',
  questFrame: '/assets/aistudio/khung_nhi_m_v__34beb230.png',
  milestoneFrame: '/assets/aistudio/khung_nh_n_ph_n_th__ng_m_c_2513af90.png',
  storePack: '/assets/aistudio/storepack_5c9df418.png',
  storeOffer30k:
    '/assets/aistudio/g_i_c_a_h_ng_conmebol_libertadores_30000_kim_c__ng_54d3ec32.png',
  cardFrame: '/assets/aistudio/backgrounds_CONMEBOL_LIBERTADORES_card_f512eb70.png',
  videoWalkoutIntro:
    '/assets/aistudio/animation_conmebol_libertadores_qu_c_gia__v__tr___c_u_l_c_b__fa560086.mp4',
  videoStageLoop:
    '/assets/aistudio/animation_conmebol_libertadores_loop_2baa5968.mp4',
  audioWalkoutIntro:
    '/assets/aistudio/_m_thanh_animation_conmebol_libertadores_qu_c_gia__v__tr___c_u_l_c_b__d0f82a7d.mp3',
  audioStageLoop:
    '/assets/aistudio/_m_thanh_animation_conmebol_libertadores_loop_l_n___u_315b7b52.mp3',
  lib_hulk_106: '/assets/aistudio/hulk_conmebol_libertadores_88ab1840.png',
  lib_riquelme_105: '/assets/aistudio/riquelme_conmebol_libertadores_1ef75720.png',
  lib_ze_roberto_104: '/assets/aistudio/ze_roberto_conmebol_libertadores_17555fdf.png',
  lib_milito_103: '/assets/aistudio/milito_conmebol_libertadores_fd286104.png',
  lib_pato_102: '/assets/aistudio/alexandre_pato_conmebol_libertadores_3607b014.png',
  lib_maicon_106: '/assets/aistudio/106_ovr_rb_maicon_0a8029b4.png',
  lib_carlos_alberto_105: '/assets/aistudio/105_ovr_alberto_carlos_f9164e93.png',
  lib_marcelo_104: '/assets/aistudio/104_ovr_marcelo_6cc6a750.png',
  lib_ramires_103: '/assets/aistudio/103_ovr_ramires_9ae339d6.png',
  lib_tevez_102: '/assets/aistudio/102_tevez_bd73437e.png',
} as const;

export type LibertadoresAssetKey = keyof typeof LIBERTADORES_FALLBACK_ASSETS;

const LIBERTADORES_UPDATED_EVENT = 'fc_libertadores_assets_updated';

let resolvedLibCache: Record<string, string> = {};
let hasFetchedInitialLib = false;
let inflightLibFetch: Promise<Record<string, string>> | null = null;

export async function refreshLibertadoresAssetsStatus(): Promise<Record<string, string>> {
  if (inflightLibFetch) return inflightLibFetch;
  inflightLibFetch = fetch('/api/libertadores-assets/status')
    .then((r) =>
      r.ok && (r.headers.get('content-type') || '').includes('application/json')
        ? r.json()
        : { resolved: {} }
    )
    .then((data: { resolved?: Record<string, string> }) => {
      if (data && data.resolved && typeof data.resolved === 'object') {
        resolvedLibCache = data.resolved;
      }
      hasFetchedInitialLib = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(LIBERTADORES_UPDATED_EVENT));
      }
      return resolvedLibCache;
    })
    .catch(() => {
      hasFetchedInitialLib = true;
      return resolvedLibCache;
    })
    .finally(() => {
      inflightLibFetch = null;
    });
  return inflightLibFetch;
}

export function getLibertadoresAssetUrl(
  key: LibertadoresAssetKey | string,
  customFallback?: string
): string {
  const customOverride = resolvedLibCache[key];
  if (customOverride && customOverride.startsWith('/assets/aistudio/')) {
    return customOverride;
  }
  const builtIn = (LIBERTADORES_FALLBACK_ASSETS as Record<string, string>)[key];
  if (builtIn) return builtIn;
  return customFallback ?? '';
}

export function useLibertadoresAssets() {
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    if (!hasFetchedInitialLib) {
      void refreshLibertadoresAssetsStatus();
    }
    const onUpdated = () => setTick((t) => t + 1);
    let lastFocusRefresh = 0;
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastFocusRefresh > 4000) {
        lastFocusRefresh = now;
        void refreshLibertadoresAssetsStatus();
      }
    };
    window.addEventListener(LIBERTADORES_UPDATED_EVENT, onUpdated);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.removeEventListener(LIBERTADORES_UPDATED_EVENT, onUpdated);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, []);

  return {
    getAsset: getLibertadoresAssetUrl,
    customCount: Object.keys(resolvedLibCache).length,
    refresh: refreshLibertadoresAssetsStatus,
  };
}
