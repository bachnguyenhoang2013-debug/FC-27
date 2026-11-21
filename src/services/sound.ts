// Web Audio API Sound Synthesizer for FC Mobile Game Effects

import { CHAMPIONS_JUVENTUS_ASSETS } from '../data/championsJuventusData';
import { GINGA_ASSETS } from '../data/gingaData';
import { getLibertadoresAssetUrl } from '../data/libertadoresAssets';

const PACK_WALKOUT_INTRO_URL =
  '/assets/aistudio/animation__nh_v__tr___qu_c_gia_v__c_u_l_c_b__af7f42c4.mp3';
const PACK_ANIMATION_LOOP_URL = '/assets/aistudio/animation_loop_711e4e47.mp3';
const FUTURE_STARS_WALKOUT_INTRO_URL =
  '/assets/aistudio/_m_thanh_animation_Future_Stars_qu_c_gia__v__tr__v__c_u_l_c_b__804a098c.mp3';
const FUTURE_STARS_ANIMATION_LOOP_URL =
  '/assets/aistudio/_m_thanh_animation_Future_Stars__loop_ch__v_o_l_n___u_c762a19b.mp3';

const SFX_PACK_OPEN_URL = '/assets/aistudio/_m_thanh_animation_m__g_i_a5eeb3dc.mp3';
const SFX_BUTTON_URL = '/assets/aistudio/_m_thanh_m__n_t_3d9ed098.mp3';
const SFX_CONFIRM_SELECTION_URL =
  '/assets/aistudio/_m_thanh_khi_ho_n_th_nh_l_a_ch_n_4cdfc3ef.mp3';
const SFX_SELECTION_URL = '/assets/aistudio/_m_thanh_l_a_ch_n_dac38e88.mp3';
const SFX_OPEN_SECTION_URL = '/assets/aistudio/_m_thanh_m__c_c_m_c_23e83d39.mp3';
const SFX_OPEN_EVENT_URL = '/assets/aistudio/_m_thanh_m__s__ki_n_17cbb589.mp3';

const UI_SFX_URLS = [
  SFX_PACK_OPEN_URL,
  SFX_BUTTON_URL,
  SFX_CONFIRM_SELECTION_URL,
  SFX_SELECTION_URL,
  SFX_OPEN_SECTION_URL,
  SFX_OPEN_EVENT_URL,
];

const BGM_TRACK_URL = '/assets/aistudio/background_game_fdd1fa23.mp3';

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private sfxBufferPromises: Map<string, Promise<AudioBuffer | null>> = new Map();
  private sfxRawBytes: Map<string, ArrayBuffer> = new Map();
  private sfxPoolIndex: Map<string, number> = new Map();
  private sfxHtmlPools: Map<string, HTMLAudioElement[]> = new Map();
  private walkoutIntroAudio: HTMLAudioElement | null = null;
  private packLoopAudio: HTMLAudioElement | null = null;
  private futureStarsIntroAudio: HTMLAudioElement | null = null;
  private futureStarsLoopAudio: HTMLAudioElement | null = null;
  private juventusIntroAudio: HTMLAudioElement | null = null;
  private juventusIntroUrl: string = '';
  private juventusLoopAudio: HTMLAudioElement | null = null;
  private juventusLoopUrl: string = '';
  private conmebolIntroAudio: HTMLAudioElement | null = null;
  private conmebolIntroUrl: string = '';
  private conmebolLoopAudio: HTMLAudioElement | null = null;
  private conmebolLoopUrl: string = '';
  private gingaIntroAudio: HTMLAudioElement | null = null;
  private gingaIntroUrl: string = '';
  private gingaLoopAudio: HTMLAudioElement | null = null;
  private gingaLoopUrl: string = '';
  private bgmVolume: number = 0.5;
  private bgmShouldPlay: boolean = false;
  private bgmPausedForPack: boolean = false;
  private unlockBound: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    const savedMute = localStorage.getItem('fc_sound_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
    const savedVol = localStorage.getItem('fc_bgm_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!Number.isNaN(parsed)) {
        this.bgmVolume = Math.max(0, Math.min(1, parsed));
      }
    }
    if (typeof window !== 'undefined') {
      UI_SFX_URLS.forEach((url) => this.preloadSfxAsset(url));
    }
  }

  private preloadSfxAsset(url: string) {
    if (typeof window === 'undefined') return;
    if (!this.sfxHtmlPools.has(url)) {
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < 2; i++) {
        const el = new Audio(url);
        el.preload = 'auto';
        pool.push(el);
      }
      this.sfxHtmlPools.set(url, pool);
    }
    if (!this.sfxRawBytes.has(url)) {
      fetch(url)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buf) => {
          if (buf) {
            this.sfxRawBytes.set(url, buf);
            if (this.ctx) {
              void this.decodeSfxBuffer(url);
            }
          }
        })
        .catch(() => {});
    }
  }

  private decodeSfxBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.sfxBuffers.has(url)) {
      return Promise.resolve(this.sfxBuffers.get(url) ?? null);
    }
    const existing = this.sfxBufferPromises.get(url);
    if (existing) return existing;
    if (!this.ctx) return Promise.resolve(null);

    const loadAndDecode = async (): Promise<AudioBuffer | null> => {
      try {
        let raw = this.sfxRawBytes.get(url);
        if (!raw) {
          const res = await fetch(url);
          if (!res.ok) return null;
          raw = await res.arrayBuffer();
          this.sfxRawBytes.set(url, raw);
        }
        const decoded = await this.ctx!.decodeAudioData(raw.slice(0));
        this.sfxBuffers.set(url, decoded);
        return decoded;
      } catch {
        return null;
      }
    };

    const p = loadAndDecode();
    this.sfxBufferPromises.set(url, p);
    return p;
  }

  private getSfxVolume(multiplier: number = 1): number {
    if (this.isMuted) return 0;
    const base = this.bgmVolume > 0 ? Math.max(0.55, Math.min(1, this.bgmVolume + 0.25)) : 0.72;
    return Math.max(0, Math.min(1, base * multiplier));
  }

  private playSfxUrl(url: string, volumeMultiplier: number = 1) {
    if (this.isMuted || typeof window === 'undefined') return;
    this.initCtx();
    const vol = this.getSfxVolume(volumeMultiplier);
    if (vol <= 0) return;

    const cached = this.sfxBuffers.get(url);
    if (cached && this.ctx && this.ctx.state === 'running') {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = cached;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(0);
        return;
      } catch {
        // fallback to HTMLAudioElement below
      }
    }

    if (this.ctx) {
      void this.decodeSfxBuffer(url);
    }

    try {
      let pool = this.sfxHtmlPools.get(url);
      if (!pool) {
        this.preloadSfxAsset(url);
        pool = this.sfxHtmlPools.get(url);
      }
      if (pool && pool.length > 0) {
        const idx = this.sfxPoolIndex.get(url) ?? 0;
        const el = pool[idx % pool.length];
        this.sfxPoolIndex.set(url, (idx + 1) % pool.length);
        el.pause();
        el.currentTime = 0;
        el.volume = vol;
        el.play().catch(() => {});
      }
    } catch {
      // ignore playback failures prior to user interaction
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  private ensureBgmAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio(BGM_TRACK_URL);
      this.bgmAudio.loop = true;
      this.bgmAudio.preload = 'auto';
    }
    return this.bgmAudio;
  }

  private attachAutoplayUnlock() {
    if (this.unlockBound || typeof window === 'undefined') return;
    this.unlockBound = true;

    const unlock = () => {
      this.unlockBound = false;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      this.syncBgmPlayback();
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private syncBgmPlayback() {
    const audio = this.ensureBgmAudio();
    if (!audio) return;

    if (!this.bgmShouldPlay || this.bgmPausedForPack || this.isMuted || this.bgmVolume <= 0) {
      audio.pause();
      if (!this.bgmShouldPlay) {
        audio.currentTime = 0;
      }
      return;
    }

    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, this.bgmVolume));
    if (audio.paused) {
      audio.play().catch(() => {
        this.attachAutoplayUnlock();
      });
    }
  }

  public startBgm() {
    this.bgmShouldPlay = true;
    this.syncBgmPlayback();
    this.notifyListeners();
  }

  public stopBgm() {
    this.bgmShouldPlay = false;
    this.bgmPausedForPack = false;
    this.stopAllPackAnimationAudio();
    this.syncBgmPlayback();
    this.notifyListeners();
  }

  public pauseBgmForPack() {
    this.bgmPausedForPack = true;
    this.syncBgmPlayback();
    this.notifyListeners();
  }

  public resumeBgmAfterPack() {
    this.stopAllPackAnimationAudio();
    this.bgmPausedForPack = false;
    this.syncBgmPlayback();
    this.notifyListeners();
  }

  private getPackAudioVolume(): number {
    if (this.isMuted) return 0;
    return this.bgmVolume > 0 ? Math.min(1, Math.max(0.65, this.bgmVolume)) : 0.8;
  }

  private syncPackAudioVolume() {
    const vol = this.getPackAudioVolume();
    if (this.walkoutIntroAudio) {
      this.walkoutIntroAudio.volume = vol;
    }
    if (this.packLoopAudio) {
      this.packLoopAudio.volume = vol;
    }
    if (this.futureStarsIntroAudio) {
      this.futureStarsIntroAudio.volume = vol;
    }
    if (this.futureStarsLoopAudio) {
      this.futureStarsLoopAudio.volume = vol;
    }
    if (this.juventusIntroAudio) {
      this.juventusIntroAudio.volume = vol;
    }
    if (this.juventusLoopAudio) {
      this.juventusLoopAudio.volume = vol;
    }
    if (this.conmebolIntroAudio) {
      this.conmebolIntroAudio.volume = vol;
    }
    if (this.conmebolLoopAudio) {
      this.conmebolLoopAudio.volume = vol;
    }
    if (this.gingaIntroAudio) {
      this.gingaIntroAudio.volume = vol;
    }
    if (this.gingaLoopAudio) {
      this.gingaLoopAudio.volume = vol;
    }
  }

  public playPackWalkoutIntro() {
    this.stopAllPackAnimationAudio();
    if (!this.walkoutIntroAudio) {
      this.walkoutIntroAudio = new Audio(PACK_WALKOUT_INTRO_URL);
      this.walkoutIntroAudio.loop = false;
      this.walkoutIntroAudio.preload = 'auto';
    }
    this.walkoutIntroAudio.loop = false;
    this.walkoutIntroAudio.volume = this.getPackAudioVolume();
    this.walkoutIntroAudio.currentTime = 0;
    if (!this.isMuted) {
      this.walkoutIntroAudio.play().catch(() => {});
    }
  }

  public playPackLoopOnce() {
    this.stopAllPackAnimationAudio();
    if (!this.packLoopAudio) {
      this.packLoopAudio = new Audio(PACK_ANIMATION_LOOP_URL);
      this.packLoopAudio.loop = false;
      this.packLoopAudio.preload = 'auto';
    }
    // Bắt buộc loop = false: chỉ nghe 1 lần duy nhất khi mới phát animation loop
    this.packLoopAudio.loop = false;
    this.packLoopAudio.volume = this.getPackAudioVolume();
    this.packLoopAudio.currentTime = 0;
    if (!this.isMuted) {
      this.packLoopAudio.play().catch(() => {});
    }
  }

  public playFutureStarsWalkoutIntro() {
    this.stopAllPackAnimationAudio();
    if (!this.futureStarsIntroAudio) {
      this.futureStarsIntroAudio = new Audio(FUTURE_STARS_WALKOUT_INTRO_URL);
      this.futureStarsIntroAudio.loop = false;
      this.futureStarsIntroAudio.preload = 'auto';
    }
    this.futureStarsIntroAudio.loop = false;
    this.futureStarsIntroAudio.volume = this.getPackAudioVolume();
    this.futureStarsIntroAudio.currentTime = 0;
    if (!this.isMuted) {
      this.futureStarsIntroAudio.play().catch(() => {});
    }
  }

  public playFutureStarsLoopOnce() {
    this.stopAllPackAnimationAudio();
    if (!this.futureStarsLoopAudio) {
      this.futureStarsLoopAudio = new Audio(FUTURE_STARS_ANIMATION_LOOP_URL);
      this.futureStarsLoopAudio.loop = false;
      this.futureStarsLoopAudio.preload = 'auto';
    }
    // Bắt buộc loop = false: chỉ nghe 1 lần duy nhất khi mới vào màn loop Future Stars
    this.futureStarsLoopAudio.loop = false;
    this.futureStarsLoopAudio.volume = this.getPackAudioVolume();
    this.futureStarsLoopAudio.currentTime = 0;
    if (!this.isMuted) {
      this.futureStarsLoopAudio.play().catch(() => {});
    }
  }

  public playJuventusWalkoutIntro() {
    this.stopAllPackAnimationAudio();
    const targetUrl = CHAMPIONS_JUVENTUS_ASSETS.audioWalkoutIntro;
    if (!this.juventusIntroAudio || this.juventusIntroUrl !== targetUrl) {
      this.juventusIntroUrl = targetUrl;
      this.juventusIntroAudio = new Audio(targetUrl);
      this.juventusIntroAudio.loop = false;
      this.juventusIntroAudio.preload = 'auto';
    }
    this.juventusIntroAudio.loop = false;
    this.juventusIntroAudio.volume = this.getPackAudioVolume();
    this.juventusIntroAudio.currentTime = 0;
    if (!this.isMuted) {
      this.juventusIntroAudio.play().catch(() => {});
    }
  }

  public playJuventusLoopOnce() {
    this.stopAllPackAnimationAudio();
    const targetUrl = CHAMPIONS_JUVENTUS_ASSETS.audioStageLoop;
    if (!this.juventusLoopAudio || this.juventusLoopUrl !== targetUrl) {
      this.juventusLoopUrl = targetUrl;
      this.juventusLoopAudio = new Audio(targetUrl);
      this.juventusLoopAudio.loop = false;
      this.juventusLoopAudio.preload = 'auto';
    }
    this.juventusLoopAudio.loop = false;
    this.juventusLoopAudio.volume = this.getPackAudioVolume();
    this.juventusLoopAudio.currentTime = 0;
    if (!this.isMuted) {
      this.juventusLoopAudio.play().catch(() => {});
    }
  }

  public playConmebolWalkoutIntro() {
    this.stopAllPackAnimationAudio();
    const targetUrl = getLibertadoresAssetUrl('audioWalkoutIntro');
    if (!this.conmebolIntroAudio || this.conmebolIntroUrl !== targetUrl) {
      this.conmebolIntroUrl = targetUrl;
      this.conmebolIntroAudio = new Audio(targetUrl);
      this.conmebolIntroAudio.loop = false;
      this.conmebolIntroAudio.preload = 'auto';
    }
    this.conmebolIntroAudio.loop = false;
    this.conmebolIntroAudio.volume = this.getPackAudioVolume();
    this.conmebolIntroAudio.currentTime = 0;
    if (!this.isMuted) {
      this.conmebolIntroAudio.play().catch(() => {});
    }
  }

  public playConmebolLoopOnce() {
    this.stopAllPackAnimationAudio();
    const targetUrl = getLibertadoresAssetUrl('audioStageLoop');
    if (!this.conmebolLoopAudio || this.conmebolLoopUrl !== targetUrl) {
      this.conmebolLoopUrl = targetUrl;
      this.conmebolLoopAudio = new Audio(targetUrl);
      this.conmebolLoopAudio.loop = false;
      this.conmebolLoopAudio.preload = 'auto';
    }
    // Bắt buộc loop = false: chỉ phát âm thanh loop lần đầu khi vào màn loop CONMEBOL Libertadores
    this.conmebolLoopAudio.loop = false;
    this.conmebolLoopAudio.volume = this.getPackAudioVolume();
    this.conmebolLoopAudio.currentTime = 0;
    if (!this.isMuted) {
      this.conmebolLoopAudio.play().catch(() => {});
    }
  }

  public stopAllPackAnimationAudio() {
    if (this.walkoutIntroAudio) {
      this.walkoutIntroAudio.pause();
      this.walkoutIntroAudio.currentTime = 0;
    }
    if (this.packLoopAudio) {
      this.packLoopAudio.pause();
      this.packLoopAudio.currentTime = 0;
    }
    if (this.futureStarsIntroAudio) {
      this.futureStarsIntroAudio.pause();
      this.futureStarsIntroAudio.currentTime = 0;
    }
    if (this.futureStarsLoopAudio) {
      this.futureStarsLoopAudio.pause();
      this.futureStarsLoopAudio.currentTime = 0;
    }
    if (this.juventusIntroAudio) {
      this.juventusIntroAudio.pause();
      this.juventusIntroAudio.currentTime = 0;
    }
    if (this.juventusLoopAudio) {
      this.juventusLoopAudio.pause();
      this.juventusLoopAudio.currentTime = 0;
    }
    if (this.conmebolIntroAudio) {
      this.conmebolIntroAudio.pause();
      this.conmebolIntroAudio.currentTime = 0;
    }
    if (this.conmebolLoopAudio) {
      this.conmebolLoopAudio.pause();
      this.conmebolLoopAudio.currentTime = 0;
    }
    if (this.gingaIntroAudio) {
      this.gingaIntroAudio.pause();
      this.gingaIntroAudio.currentTime = 0;
    }
    if (this.gingaLoopAudio) {
      this.gingaLoopAudio.pause();
      this.gingaLoopAudio.currentTime = 0;
    }
  }

  public playGingaWalkoutIntro() {
    this.stopAllPackAnimationAudio();
    const targetUrl = GINGA_ASSETS.audioWalkoutIntro;
    if (!this.gingaIntroAudio || this.gingaIntroUrl !== targetUrl) {
      this.gingaIntroUrl = targetUrl;
      this.gingaIntroAudio = new Audio(targetUrl);
      this.gingaIntroAudio.loop = false;
      this.gingaIntroAudio.preload = 'auto';
    }
    this.gingaIntroAudio.loop = false;
    this.gingaIntroAudio.volume = this.getPackAudioVolume();
    this.gingaIntroAudio.currentTime = 0;
    if (!this.isMuted) {
      this.gingaIntroAudio.play().catch(() => {});
    }
  }

  public playGingaLoopOnce() {
    this.stopAllPackAnimationAudio();
    const targetUrl = GINGA_ASSETS.audioStageLoop;
    if (!this.gingaLoopAudio || this.gingaLoopUrl !== targetUrl) {
      this.gingaLoopUrl = targetUrl;
      this.gingaLoopAudio = new Audio(targetUrl);
      this.gingaLoopAudio.loop = false;
      this.gingaLoopAudio.preload = 'auto';
    }
    // Chỉ phát âm thanh loop lần đầu khi mới vào animation loop Ginga
    this.gingaLoopAudio.loop = false;
    this.gingaLoopAudio.volume = this.getPackAudioVolume();
    this.gingaLoopAudio.currentTime = 0;
    if (!this.isMuted) {
      this.gingaLoopAudio.play().catch(() => {});
    }
  }

  public isBgmPausedForPack(): boolean {
    return this.bgmPausedForPack;
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setBgmVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.bgmVolume = clamped;
    localStorage.setItem('fc_bgm_volume', String(clamped));
    if (clamped > 0 && this.isMuted) {
      this.isMuted = false;
      localStorage.setItem('fc_sound_muted', 'false');
    }
    this.syncBgmPlayback();
    this.syncPackAudioVolume();
    this.notifyListeners();
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        UI_SFX_URLS.forEach((url) => {
          void this.decodeSfxBuffer(url);
        });
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('fc_sound_muted', String(this.isMuted));
    if (!this.isMuted) {
      if (this.bgmVolume === 0) {
        this.bgmVolume = 0.5;
        localStorage.setItem('fc_bgm_volume', '0.5');
      }
      this.playClick();
    }
    this.syncBgmPlayback();
    this.syncPackAudioVolume();
    this.notifyListeners();
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('fc_sound_muted', String(muted));
    this.syncBgmPlayback();
    this.syncPackAudioVolume();
    this.notifyListeners();
  }

  public playClick() {
    this.playSfxUrl(SFX_BUTTON_URL, 0.92);
  }

  public playSelection() {
    this.playSfxUrl(SFX_SELECTION_URL, 0.95);
  }

  public playTabSwitch() {
    this.playSfxUrl(SFX_SELECTION_URL, 0.95);
  }

  public playConfirmSelection() {
    this.playSfxUrl(SFX_CONFIRM_SELECTION_URL, 1);
  }

  public playOpenSection() {
    this.playSfxUrl(SFX_OPEN_SECTION_URL, 1);
  }

  public playOpenEvent() {
    this.playSfxUrl(SFX_OPEN_EVENT_URL, 1);
  }

  public playPackOpenAnimationSfx() {
    this.playSfxUrl(SFX_PACK_OPEN_URL, 1);
  }

  public playCoins() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [1200, 1500, 1800, 2400].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.12);
      });
    } catch {}
  }

  public playStartPrompt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [392, 523.25, 659.25, 783.99]; // G C E G
      chords.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.6);
      });
    } catch {}
  }

  public playPackOpenFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Sub bass hit
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.4);
      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.6);

      // Fanfare chords
      const notes = [
        { f: 523.25, t: 0.1 }, // C5
        { f: 659.25, t: 0.2 }, // E5
        { f: 783.99, t: 0.3 }, // G5
        { f: 1046.50, t: 0.45 } // C6
      ];

      notes.forEach(({ f, t }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.7);
      });
    } catch {}
  }

  public playPackTear() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer for whoosh / tear sound
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.35);

      // Deep bass punch
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(160, now);
      sub.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.3);
    } catch {}
  }

  public playTrophy() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch {}
  }

  public playWhistleShort() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(2850, now);
      osc2.frequency.setValueAtTime(3040, now);

      lfo.frequency.setValueAtTime(36, now);
      lfoGain.gain.setValueAtTime(110, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.setValueAtTime(0.14, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(now + 0.26);
      osc1.stop(now + 0.26);
      osc2.stop(now + 0.26);
    } catch {}
  }

  public playWhistleLong(triple = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const bursts = triple
        ? [
            { offset: 0, dur: 0.2 },
            { offset: 0.26, dur: 0.2 },
            { offset: 0.54, dur: 0.52 },
          ]
        : [{ offset: 0, dur: 0.48 }];

      bursts.forEach(({ offset, dur }) => {
        const now = this.ctx!.currentTime + offset;
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        const lfo = this.ctx!.createOscillator();
        const lfoGain = this.ctx!.createGain();
        const gain = this.ctx!.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(2780, now);
        osc2.frequency.setValueAtTime(2980, now);

        lfo.frequency.setValueAtTime(42, now);
        lfoGain.gain.setValueAtTime(135, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
        gain.gain.setValueAtTime(0.15, now + dur - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx!.destination);

        lfo.start(now);
        osc1.start(now);
        osc2.start(now);
        lfo.stop(now + dur + 0.02);
        osc1.stop(now + dur + 0.02);
        osc2.stop(now + dur + 0.02);
      });
    } catch {}
  }

  public playKickBall(power: number = 0.6) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const p = Math.max(0.25, Math.min(1, power));
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + p * 70, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

      gain.gain.setValueAtTime(0.16 * p, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  public playPostHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {}
  }

  public playGoalCheer() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Crowd roar noise
      const len = Math.floor(this.ctx.sampleRate * 1.1);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.min(1, i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.16, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 1.1);

      // Retro arcade goal horn triad
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + 0.88);
      });
    } catch {}
  }
}

export const soundService = new SoundService();
