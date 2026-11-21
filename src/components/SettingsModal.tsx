import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Music,
  Monitor,
  Globe,
  LogOut,
  X,
  ShieldCheck,
  RotateCcw,
  Check,
  UserCog,
  DownloadCloud,
  Loader2,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { useLanguage } from '../i18n/language';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
  onResetStarter?: () => void;
  onOpenProfileEdit?: () => void;
  username: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onLogout,
  onResetStarter,
  onOpenProfileEdit,
  username,
}) => {
  const { lang, setLang, t } = useLanguage();
  const [sfxEnabled, setSfxEnabled] = useState(!soundService.getMuted());
  const [bgmVolume, setBgmVolume] = useState<number>(Math.round(soundService.getBgmVolume() * 100));
  const [fps60, setFps60] = useState(true);
  const [graphics, setGraphics] = useState<'Standard' | 'Ultra'>('Ultra');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [cfZipLoading, setCfZipLoading] = useState(false);
  const [cfZipMessage, setCfZipMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = soundService.subscribe(() => {
      setSfxEnabled(!soundService.getMuted());
      setBgmVolume(Math.round(soundService.getBgmVolume() * 100));
    });
    return unsub;
  }, []);

  const handleToggleSfx = () => {
    const isMuted = soundService.toggleMute();
    setSfxEnabled(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBgmVolume(val);
    soundService.setBgmVolume(val / 100);
  };

  const handleDownloadCloudflareZip = async () => {
    if (cfZipLoading) return;
    soundService.playClick();
    setCfZipLoading(true);
    setCfZipMessage(null);
    try {
      const resp = await fetch('/api/export/cloudflare-zip');
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok || !contentType.includes('application/zip')) {
        setCfZipMessage(
          t(
            'Bản hiện tại đang chạy trực tiếp trên nền tảng tĩnh Cloudflare.',
            'Running directly on Cloudflare static build.'
          )
        );
        setCfZipLoading(false);
        return;
      }
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'fc-mobile-26-cloudflare.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      soundService.playTrophy();
      setCfZipMessage(
        t(
          'Đã tải fc-mobile-26-cloudflare.zip! Hãy kéo-thả thẳng file này vào Cloudflare.',
          'Downloaded fc-mobile-26-cloudflare.zip! Drag & drop straight into Cloudflare.'
        )
      );
    } catch {
      setCfZipMessage(
        t(
          'Không thể đóng gói lúc này, vui lòng thử lại sau giây lát.',
          'Unable to package right now, please try again shortly.'
        )
      );
    } finally {
      setCfZipLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-cruyff">
      <div className="w-full max-w-lg bg-zinc-950 border border-yellow-400/30 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto font-cruyff">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-cruyff font-black text-xl text-white uppercase italic tracking-wider">
                {t('CÀI ĐẶT TRÒ CHƠI (SETTINGS)', 'GAME SETTINGS')}
              </h2>
              <p className="text-xs text-gray-400 font-cruyff">
                {t('Tài khoản:', 'Account:')}{' '}
                <span className="text-white font-bold">{username}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="mt-4 space-y-3">
          {/* 1-Click Pre-built Cloudflare Direct Upload ZIP */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-zinc-900 border border-cyan-400/45 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <DownloadCloud className="w-5 h-5 text-cyan-300 shrink-0" />
                <div>
                  <div className="font-cruyff font-black text-sm text-cyan-200 uppercase">
                    {t(
                      'Tải Gói .ZIP Up Thẳng Lên Cloudflare',
                      'Download Direct Cloudflare .ZIP Bundle'
                    )}
                  </div>
                  <div className="text-xs text-gray-300">
                    {t(
                      'Bản đã build sẵn — kéo-thả trực tiếp vào Upload Assets không cần gõ lệnh',
                      'Pre-built static bundle — drag & drop directly into Cloudflare Upload Assets'
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={cfZipLoading}
                onClick={handleDownloadCloudflareZip}
                className="shrink-0 px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {cfZipLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('Đang tạo...', 'Building...')}</span>
                  </>
                ) : (
                  <span>{t('Tải .ZIP', 'Get .ZIP')}</span>
                )}
              </button>
            </div>
            {cfZipMessage && (
              <div className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 rounded-lg px-3 py-1.5">
                {cfZipMessage}
              </div>
            )}
          </div>

          {onOpenProfileEdit && (
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                onClose();
                onOpenProfileEdit();
              }}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-zinc-900 border border-yellow-400/45 hover:border-yellow-300 flex items-center justify-between text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <UserCog className="w-5 h-5 text-yellow-400 shrink-0" />
                <div>
                  <div className="font-cruyff font-bold text-sm text-yellow-300 uppercase">
                    {t('Cài Đặt Ảnh Đại Diện & Tên Của Tôi', 'Edit Club Crest & Manager Name')}
                  </div>
                  <div className="text-xs text-gray-300">
                    {t(
                      'Đổi Logo CLB, tải ảnh từ máy và chỉnh sửa tên HLV / CLB',
                      'Change Club Crest, upload custom avatar, and edit Coach / Club name'
                    )}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-yellow-400 text-black font-cruyff font-black text-xs uppercase">
                {t('Mở', 'Open')}
              </span>
            </button>
          )}

          {/* Background Music Volume Slider */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-yellow-400/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-cruyff font-bold text-sm text-white">
                    {t(
                      'Nhạc Nền Trò Chơi Mới (FC Mobile Soundtrack)',
                      'Game Soundtrack (FC Mobile BGM)'
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t(
                      'Tự động tạm dừng khi mở gói & phát tiếp sau khi mở xong',
                      'Auto-pauses during pack walkouts and resumes afterwards'
                    )}
                  </div>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-yellow-300 tabular-nums">
                {sfxEnabled ? `${bgmVolume}%` : t('TẮT', 'OFF')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sfxEnabled ? bgmVolume : 0}
              onChange={handleVolumeChange}
              aria-label={t('Điều chỉnh âm lượng nhạc nền', 'Background music volume')}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-yellow-400"
            />
          </div>

          {/* Audio Mute/SFX Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              {sfxEnabled ? (
                <Volume2 className="w-5 h-5 text-yellow-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div className="font-cruyff font-bold text-sm text-white">
                  {t('Âm thanh & Hiệu ứng (Master Audio)', 'Master Audio & Sound Effects')}
                </div>
                <div className="text-xs text-gray-400">
                  {t(
                    'Bật / tắt toàn bộ nhạc nền và hiệu ứng mở gói thẻ',
                    'Toggle all background music and pack opening sound effects'
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSfx}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                sfxEnabled ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-black shadow-md" />
            </button>
          </div>

          {/* 60 FPS */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-cruyff font-bold text-sm text-white">
                  {t('Chế độ 60 FPS Mượt Mà', 'Smooth 60 FPS Mode')}
                </div>
                <div className="text-xs text-gray-400">
                  {t(
                    'Tối ưu hóa khung hình mượt mà cho thiết bị',
                    'Optimize frame rate smoothness for your device'
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setFps60(!fps60);
              }}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                fps60 ? 'bg-emerald-400 justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-black shadow-md" />
            </button>
          </div>

          {/* Graphics Quality */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="font-cruyff font-bold text-sm text-white">
                {t('Đồ Họa Sân Cỏ & Ánh Sáng', 'Pitch & Stadium Graphics')}
              </div>
              <div className="text-xs text-gray-400">
                {t('Chất lượng hiển thị TOTY 2026', 'TOTY 2026 visual rendering quality')}
              </div>
            </div>
            <div className="flex gap-2">
              {(['Standard', 'Ultra'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setGraphics(mode);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold transition-all cursor-pointer ${
                    graphics === mode
                      ? 'bg-yellow-400 text-black shadow-md'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  {mode === 'Standard'
                    ? t('Tiêu Chuẩn', 'Standard')
                    : t('Cực Cao (Ultra)', 'Ultra')}
                </button>
              ))}
            </div>
          </div>

          {/* Display Language synced globally */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="font-cruyff font-bold text-sm text-white">
                {t('Ngôn ngữ hiển thị', 'Display Language')}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setLang('vi');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold cursor-pointer ${
                  lang === 'vi' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setLang('en');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-cruyff font-bold cursor-pointer ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Starter Account Reset (OVR 60-80 & Fresh Resources) */}
          {onResetStarter && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/35 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-cruyff font-bold text-sm text-amber-300 uppercase">
                    {t(
                      'Khởi Tạo Lại Tài Khoản Người Mới (OVR 60–80)',
                      'Reset Starter Club Account (OVR 60–80)'
                    )}
                  </div>
                  <div className="text-[11px] text-gray-300">
                    {t(
                      'Đặt lại tài nguyên khởi điểm (50,000 Xu, 500 Gems, 3 Vé) và đội hình tân thủ OVR 60–80.',
                      'Reset starting resources (50,000 Coins, 500 Gems, 3 Tickets) and rookie squad OVR 60–80.'
                    )}
                  </div>
                </div>
              </div>

              {resetDone ? (
                <div className="py-2 px-3 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>
                    {t(
                      'Đã đặt lại tài nguyên & đội hình tân thủ OVR 60–80!',
                      'Starter resources & OVR 60–80 squad restored!'
                    )}
                  </span>
                </div>
              ) : !confirmReset ? (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setConfirmReset(true);
                  }}
                  className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {t('Đặt Lại Về Tân Thủ (OVR 60–80)', 'Reset to Rookie Squad (OVR 60–80)')}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playCoins();
                      onResetStarter();
                      setConfirmReset(false);
                      setResetDone(true);
                    }}
                    className="flex-1 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-cruyff font-black text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {t('Xác Nhận Đặt Lại', 'Confirm Reset')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 font-cruyff font-bold text-xs uppercase cursor-pointer"
                  >
                    {t('Hủy', 'Cancel')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Account Logout Action */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-cruyff font-bold text-sm uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>
                {t(
                  'ĐĂNG XUẤT (TRỞ VỀ MÀN HÌNH ĐĂNG NHẬP)',
                  'SIGN OUT (RETURN TO LOGIN SCREEN)'
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Build info */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>EA Anti-Cheat &amp; Security OK</span>
          </div>
          <span>Build: 2026.02.UTOTY_PL_CAREER</span>
        </div>
      </div>
    </div>
  );
};
