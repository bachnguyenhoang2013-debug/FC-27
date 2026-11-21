import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  Globe,
  Smartphone,
  ChevronRight,
  Sparkles,
  Wifi,
  CheckCircle2,
  Laptop,
  Languages,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { UserProfile } from '../types/game';
import { AppLanguage, LANGUAGE_OPTIONS, useLanguage } from '../i18n/language';
import { GINGA_ASSETS } from '../data/gingaData';

interface LoginScreenProps {
  onLoginSuccess: (user: Partial<UserProfile>) => void;
  currentUser: UserProfile;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, currentUser }) => {
  const { lang, setLang, t } = useLanguage();

  // Device ID persisted in localStorage tied strictly to this device
  const [deviceId] = useState<string>(() => {
    const saved = localStorage.getItem('fc_device_id');
    if (saved) return saved;
    const newId = 'FC-DEV-' + Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem('fc_device_id', newId);
    return newId;
  });

  // Detect current hardware/browser device details
  const [deviceInfo, setDeviceInfo] = useState<{ os: string; browser: string; label: string }>({
    os: 'Mobile Device',
    browser: 'Web Browser',
    label: 'Current Device',
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    let os = t('Thiết bị di động', 'Mobile Device');
    if (/Windows/i.test(ua)) os = t('Máy tính Windows', 'Windows PC');
    else if (/Macintosh|Mac OS X/i.test(ua)) os = t('Máy tính Mac (macOS)', 'Mac (macOS)');
    else if (/iPhone/i.test(ua)) os = 'Apple iPhone (iOS)';
    else if (/iPad/i.test(ua)) os = 'Apple iPad (iPadOS)';
    else if (/Android/i.test(ua)) os = t('Điện thoại Android', 'Android Phone');
    else if (/Linux/i.test(ua)) os = t('Hệ máy Linux', 'Linux System');

    let browser = 'Chrome';
    if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';

    setDeviceInfo({
      os,
      browser,
      label: `${os} (${browser})`,
    });
  }, [lang, t]);

  const [controlMode, setControlMode] = useState<'pc' | 'mobile'>(() => {
    const saved = localStorage.getItem('fc_control_mode');
    if (saved === 'mobile' || saved === 'pc') return saved;
    if (currentUser.controlMode === 'mobile' || currentUser.controlMode === 'pc') {
      return currentUser.controlMode;
    }
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);
    return isTouchDevice ? 'mobile' : 'pc';
  });

  const [server, setServer] = useState<'VN' | 'SEA' | 'GLOBAL'>('VN');
  const [showServerModal, setShowServerModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState<0 | 1 | 2 | 3>(0);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());

  const handleSelectControlMode = (mode: 'pc' | 'mobile') => {
    soundService.playClick();
    setControlMode(mode);
    localStorage.setItem('fc_control_mode', mode);
  };

  const servers = [
    {
      id: 'VN',
      name: t('Việt Nam (VN-01)', 'Vietnam (VN-01)'),
      ping: '12 ms',
      status: t('Rất mượt', 'Optimal'),
    },
    {
      id: 'SEA',
      name: t('Đông Nam Á (Singapore)', 'Southeast Asia (Singapore)'),
      ping: '24 ms',
      status: t('Mượt', 'Smooth'),
    },
    {
      id: 'GLOBAL',
      name: t('Toàn Cầu (Global-US)', 'Global (US-East)'),
      ping: '115 ms',
      status: t('Bình thường', 'Normal'),
    },
  ];

  const activeLangOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === lang) || LANGUAGE_OPTIONS[0];

  const loadingText =
    loadingStep === 0
      ? t('Đang kiểm tra kết nối thiết bị...', 'Checking device connection...')
      : loadingStep === 1
      ? t(`Xác thực thiết bị [${deviceId}]...`, `Authenticating device [${deviceId}]...`)
      : loadingStep === 2
      ? t(
          'Đồng bộ tài khoản & sự kiện GINGA 26...',
          'Syncing club profile & GINGA 26 event...'
        )
      : t('Hoàn tất! Đang vào trò chơi...', 'Complete! Entering stadium...');

  const handleToggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectLanguage = (nextLang: AppLanguage) => {
    soundService.playClick();
    setLang(nextLang);
    setShowLanguageModal(false);
  };

  const startEntrySequence = () => {
    soundService.playStartPrompt();
    setIsLoading(true);
    setLoadingProgress(15);
    setLoadingStep(0);

    const timer1 = setTimeout(() => {
      setLoadingProgress(45);
      setLoadingStep(1);
    }, 700);

    const timer2 = setTimeout(() => {
      setLoadingProgress(80);
      setLoadingStep(2);
    }, 1500);

    const timer3 = setTimeout(() => {
      setLoadingProgress(100);
      setLoadingStep(3);
    }, 2300);

    const timer4 = setTimeout(() => {
      const username =
        !currentUser.username || currentUser.username === 'HLV_TanThu'
          ? (lang === 'en' ? 'Coach_' : 'HLV_') + deviceId.slice(-4)
          : currentUser.username;
      localStorage.setItem('fc_control_mode', controlMode);
      onLoginSuccess({
        username,
        loginMethod: 'device',
        deviceId,
        deviceName: deviceInfo.label,
        controlMode,
      });
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const handleStartGame = () => {
    if (isLoading) return;
    startEntrySequence();
  };

  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden select-none bg-black flex flex-col justify-between font-cruyff">
      {/* Background Ginga 26 Artwork + Animated Drift */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={GINGA_ASSETS.boxBg}
          alt="Ginga 26 Login Background"
          className="w-full h-full object-cover object-center animate-ginga-drift"
        />
        <img
          src={GINGA_ASSETS.bg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-screen pointer-events-none"
        />
        {/* Dynamic vignette and emerald/gold Ginga lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.18)_0%,_transparent_55%,_rgba(0,0,0,0.75)_100%)]" />

        {/* Grid lines texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Bar: Server selector, Language selector, Device status, Sound toggle */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4">
        {/* Left: Server Info + Language Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setShowServerModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-xs font-cruyff text-gray-200 transition-all hover:border-yellow-400 active:scale-95 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Globe className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-bold text-white tracking-wide">
              {servers.find((s) => s.id === server)?.name}
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold tabular-nums">
              {servers.find((s) => s.id === server)?.ping}
            </span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </button>

          {/* Language Selector Button in Login Top Bar */}
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setShowLanguageModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md border border-yellow-400/50 text-xs font-cruyff text-white transition-all hover:border-yellow-300 active:scale-95 cursor-pointer shadow-[0_0_16px_rgba(250,204,21,0.18)]"
          >
            <Languages className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="text-gray-300 uppercase tracking-wider font-bold">
              {t('Ngôn ngữ:', 'Language:')}
            </span>
            <img
              src={activeLangOption.flagUrl}
              alt={activeLangOption.label}
              className="w-4 h-3 object-cover rounded-[2px] shrink-0"
            />
            <span className="font-black text-yellow-300 tracking-wide">
              {activeLangOption.label}
            </span>
            <ChevronRight className="w-3 h-3 text-yellow-300/80" />
          </button>
        </div>

        {/* Right: Device status & Sound toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[11px] font-mono text-gray-300 tabular-nums">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {t('Thiết bị đang dùng:', 'Active Device:')} {deviceId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white transition-all hover:border-yellow-400 hover:scale-105 active:scale-95 cursor-pointer"
            title={
              isMuted
                ? t('Bật âm thanh', 'Unmute audio')
                : t('Tắt âm thanh', 'Mute audio')
            }
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-yellow-400" />
            )}
          </button>
        </div>
      </div>

      {/* Center Branding & Tap to Start */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto px-4 text-center">
        {/* Official FC Mobile Season Kicker */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-emerald-400/50 mb-3 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-cruyff font-bold text-xs tracking-widest text-yellow-300 uppercase">
            {t('GINGA 26 · JOGA BONITO · SỰ KIỆN MỚI', 'GINGA 26 · JOGA BONITO · NEW EVENT')}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        </div>

        {/* FC Mobile Main Logo */}
        <div className="flex flex-col items-center select-none">
          <div className="flex items-center gap-3.5">
            {/* Green FC Triangle */}
            <div className="w-13 h-13 bg-emerald-500 flex items-center justify-center fc-clip-btn shadow-[0_0_25px_rgba(16,185,129,0.7)]">
              <span className="font-cruyff text-3xl font-black text-black italic -skew-x-6">FC</span>
            </div>
            <div className="text-left leading-none">
              <span className="block font-cruyff font-bold text-xs tracking-[0.25em] text-gray-300 uppercase">
                EA SPORTS™
              </span>
              <h1 className="font-cruyff font-black text-4xl sm:text-5xl tracking-tight text-white uppercase italic drop-shadow-lg">
                FC MOBILE
              </h1>
            </div>
          </div>

          {/* Ginga 26 Subheading */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-400" />
            <span className="font-cruyff font-black text-sm sm:text-base tracking-[0.3em] uppercase fc-gold-text">
              GINGA 26 · CARNIVAL EDITION
            </span>
            <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-400" />
          </div>
        </div>

        {/* Big Tap to Continue CTA Button */}
        <div className="mt-10 sm:mt-12 flex flex-col items-center">
          <button
            type="button"
            onClick={handleStartGame}
            disabled={isLoading}
            className="group relative px-10 py-4.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-cruyff font-black text-xl sm:text-2xl tracking-wider uppercase transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:shadow-[0_0_50px_rgba(245,158,11,0.9)] overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 shimmer-bg pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <span>{t('CHẠM ĐỂ BẮT ĐẦU', 'TAP TO START')}</span>
              <ChevronRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <p className="mt-3 text-xs font-cruyff tracking-widest text-gray-300 uppercase animate-pulse">
            {t(
              'Tài khoản đã gắn kết với thiết bị này',
              'Account securely linked to this device'
            )}
          </p>
        </div>
      </div>

      {/* Bottom Area: DEVICE-BOUND LOGIN MODE + INLINE LANGUAGE SWITCHER */}
      <div className="relative z-20 pb-5 px-4 sm:px-6 max-w-xl mx-auto w-full">
        <div className="bg-black/80 backdrop-blur-lg border border-yellow-400/40 rounded-2xl p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-cruyff text-xs font-bold text-gray-300 uppercase tracking-widest block">
                  {t('ĐĂNG NHẬP THIẾT BỊ ĐANG DÙNG', 'DEVICE ACCOUNT SIGN-IN')}
                </span>
                <span className="text-[11px] text-emerald-400 font-bold font-mono">
                  {t('Đã liên kết thiết bị thành công', 'Device Bound & Verified')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-yellow-300 tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{deviceId}</span>
            </div>
          </div>

          {/* Device details card */}
          <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                {/iPhone|Android|Mobile|di động/i.test(deviceInfo.os) ? (
                  <Smartphone className="w-5 h-5" />
                ) : (
                  <Laptop className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="font-cruyff font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{deviceInfo.label}</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {t(
                    'Tiến độ, vé quay và đội bóng được tự động lưu vĩnh viễn trên thiết bị này.',
                    'Progress, spin tickets, and squad data are permanently saved on this device.'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inline Language Selector Row inside Login Card */}
          <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-cruyff font-bold text-gray-200 uppercase tracking-wider">
              <Languages className="w-4 h-4 text-yellow-400" />
              <span>{t('Ngôn ngữ trò chơi', 'Game Language')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10">
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleSelectLanguage(opt.code)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-cruyff font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={opt.flagUrl}
                      alt={opt.label}
                      className="w-4 h-3 object-cover rounded-[2px]"
                    />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile / PC Play Mode Selector Row inside Login Card */}
          <div className="mt-2.5 p-2.5 rounded-xl bg-white/5 border border-emerald-400/25 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-cruyff font-bold text-gray-200 uppercase tracking-wider">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>{t('Chế độ điều khiển', 'Play Mode')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => handleSelectControlMode('pc')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-cruyff font-bold transition-all cursor-pointer ${
                  controlMode === 'pc'
                    ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{t('Máy Tính (PC)', 'PC')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectControlMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-cruyff font-bold transition-all cursor-pointer ${
                  controlMode === 'mobile'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t('Điện Thoại', 'Mobile')}</span>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleStartGame}
            disabled={isLoading}
            className="w-full mt-3.5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-black font-cruyff font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-98 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 stroke-[2.5]" />
            <span>
              {t('ĐĂNG NHẬP VỚI THIẾT BỊ NÀY', 'SIGN IN WITH THIS DEVICE')}
            </span>
          </button>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-400 px-2 font-cruyff">
          <span>
            {t(
              'EA SPORTS FC™ Mobile 26 · Bản quyền Electronic Arts Inc.',
              'EA SPORTS FC™ Mobile 26 · © Electronic Arts Inc.'
            )}
          </span>
          <div className="flex gap-3">
            <span className="hover:text-yellow-400 cursor-pointer">
              {t('Điều khoản', 'Terms')}
            </span>
            <span className="hover:text-yellow-400 cursor-pointer">
              {t('Bảo mật', 'Privacy')}
            </span>
          </div>
        </div>
      </div>

      {/* Loading Modal with Authentic FC Triangle Loading Video */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center select-none font-cruyff">
          <div className="relative w-64 h-48 flex items-center justify-center">
            <video
              src="/assets/aistudio/loading__2__1446a32e.mp4"
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>

          <div className="w-80 sm:w-96 mt-6 px-4">
            <div className="flex justify-between items-center mb-1 text-xs font-cruyff font-bold text-gray-300 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {loadingText}
              </span>
              <span className="text-yellow-400 font-mono font-bold tabular-nums">
                {loadingProgress}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <p className="mt-3 text-center text-[11px] text-gray-400 font-cruyff tracking-wider">
              {t(
                'Đang tải dữ liệu hồ sơ và đội hình đã lưu trên thiết bị này...',
                'Loading saved club profile and squad data on this device...'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Server Selection Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-cruyff">
          <div className="w-full max-w-md bg-zinc-900 border border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cruyff font-bold text-lg text-white uppercase tracking-wide">
                  {t('Chọn Máy Chủ FC Mobile', 'Select FC Mobile Server')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                className="text-gray-400 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {servers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setServer(s.id as 'VN' | 'SEA' | 'GLOBAL');
                    setShowServerModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    server === s.id
                      ? 'bg-yellow-400/15 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="font-cruyff font-bold text-sm text-white">{s.name}</div>
                    <div className="text-xs text-gray-400 font-cruyff">{s.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                      {s.ping}
                    </span>
                    {server === s.id && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-cruyff">
          <div className="w-full max-w-md bg-zinc-900 border border-yellow-400/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Languages className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-cruyff font-bold text-lg text-white uppercase tracking-wide">
                    {t('Chọn Ngôn Ngữ · Language', 'Select Language · Ngôn Ngữ')}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {t(
                      'Thay đổi ngôn ngữ hiển thị toàn trò chơi',
                      'Switch display language across the game'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="text-gray-400 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleSelectLanguage(opt.code)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-400/15 border-yellow-400 text-white shadow-[0_0_18px_rgba(250,204,21,0.22)]'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={opt.flagUrl}
                        alt={opt.label}
                        className="w-8 h-6 object-cover rounded border border-white/20 shrink-0"
                      />
                      <div>
                        <div className="font-cruyff font-black text-base text-white">
                          {opt.nativeName}
                        </div>
                        <div className="text-xs text-gray-400">{opt.regionLabel}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
