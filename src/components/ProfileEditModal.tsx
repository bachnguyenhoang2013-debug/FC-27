import React, { useState, useRef } from 'react';
import { X, Upload, Check, User, Shield, Link2, Sparkles, Smartphone } from 'lucide-react';
import { UserProfile } from '../types/game';
import { soundService } from '../services/sound';

interface ProfileEditModalProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
}

const PRESET_LOGOS: Array<{ id: string; label: string; url: string }> = [
  {
    id: 'toty_trophy',
    label: 'Huy Hiệu TOTY',
    url: '/assets/aistudio/logo_ph_n_th__ng_f69e6fc7.png',
  },
  {
    id: 'yamal_utoty',
    label: 'Lamine Yamal',
    url: '/assets/aistudio/yamal_1774940153864_9bc47f4d.png',
  },
  {
    id: 'mbappe_utoty',
    label: 'Kylian Mbappé',
    url: '/assets/aistudio/mbappe_1788598916516_8be31f4e.png',
  },
  {
    id: 'vinicius_utoty',
    label: 'Vinícius Jr',
    url: '/assets/aistudio/vini_1788599077315_6b5059eb.png',
  },
  {
    id: 'bellingham_utoty',
    label: 'Jude Bellingham',
    url: '/assets/aistudio/bellingham_1788599153830_2747044f.png',
  },
  {
    id: 'salah_utoty',
    label: 'Mohamed Salah',
    url: '/assets/aistudio/salah_1776955391592_35069a27.png',
  },
  {
    id: 'palmer_toty',
    label: 'Cole Palmer',
    url: '/assets/aistudio/cole_palmer_1774940479375_9d3af8bf.png',
  },
  {
    id: 'musiala_toty',
    label: 'Jamal Musiala',
    url: '/assets/aistudio/musiala_1788599210234_6037a4f7.png',
  },
  {
    id: 'pl_arsenal',
    label: 'Arsenal FC',
    url: 'https://crests.football-data.org/57.png',
  },
  {
    id: 'pl_mancity',
    label: 'Man City',
    url: 'https://crests.football-data.org/65.png',
  },
  {
    id: 'pl_liverpool',
    label: 'Liverpool FC',
    url: 'https://crests.football-data.org/64.png',
  },
  {
    id: 'pl_chelsea',
    label: 'Chelsea FC',
    url: 'https://crests.football-data.org/61.png',
  },
  {
    id: 'pl_manutd',
    label: 'Man United',
    url: 'https://crests.football-data.org/66.png',
  },
  {
    id: 'll_realmadrid',
    label: 'Real Madrid',
    url: 'https://crests.football-data.org/86.png',
  },
  {
    id: 'll_barca',
    label: 'FC Barcelona',
    url: 'https://crests.football-data.org/81.png',
  },
  {
    id: 'bl_bayern',
    label: 'Bayern Munich',
    url: 'https://crests.football-data.org/5.png',
  },
  {
    id: 'club_lyon',
    label: 'Olympique Lyonnais',
    url: '/assets/aistudio/olympique_lyonnias_club_81951f92.png',
  },
  {
    id: 'club_hamburg',
    label: 'Hamburger SV',
    url: '/assets/aistudio/hamburg_club_676dff15.png',
  },
  {
    id: 'club_porto',
    label: 'FC Porto',
    url: '/assets/aistudio/porto_club_fac28ab9.png',
  },
  {
    id: 'club_galatasaray',
    label: 'Galatasaray',
    url: '/assets/aistudio/galatasaray_club_5eb9269b.png',
  },
  {
    id: 'club_monaco',
    label: 'AS Monaco',
    url: '/assets/aistudio/monaco_club_b1e39bdb.png',
  },
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  onUpdateUser,
  onClose,
}) => {
  const [username, setUsername] = useState<string>(user.username || 'HLV Trưởng');
  const [teamName, setTeamName] = useState<string>(user.teamName || 'FC UTOTY');
  const [teamLogo, setTeamLogo] = useState<string>(user.teamLogo);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Resize cleanly on offscreen canvas so localStorage stays compact & fast
        const maxDim = 256;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const optimized = canvas.toDataURL('image/png', 0.92);
          setTeamLogo(optimized);
          setErrorMsg(null);
          soundService.playClick();
        } else {
          setTeamLogo(dataUrl);
          setErrorMsg(null);
        }
      };
      img.onerror = () => {
        setErrorMsg('Không thể đọc tệp ảnh này. Hãy thử ảnh khác.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    soundService.playClick();
    setTeamLogo(trimmed);
    setCustomUrl('');
    setErrorMsg(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanTeam = teamName.trim();

    if (cleanUser.length < 2) {
      setErrorMsg('Tên người chơi cần có ít nhất 2 ký tự.');
      return;
    }
    if (cleanTeam.length < 2) {
      setErrorMsg('Tên đội bóng cần có ít nhất 2 ký tự.');
      return;
    }

    soundService.playCoins();
    onUpdateUser({
      username: cleanUser.slice(0, 24),
      teamName: cleanTeam.slice(0, 26),
      teamLogo,
    });
    setErrorMsg(null);
    setSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-cruyff"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-950 border border-yellow-400/50 rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh] overflow-y-auto text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-yellow-400 bg-zinc-900 shrink-0">
              <img
                src={teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                alt="Logo của tôi"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-cruyff font-black text-xl sm:text-2xl text-white uppercase italic tracking-wide">
                CÀI ĐẶT ẢNH ĐẠI DIỆN & TÊN CỦA TÔI
              </h2>
              <p className="text-xs text-gray-400">
                Tùy chỉnh Logo CLB, Tên HLV và Tên Đội Bóng hiển thị trên toàn hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-5">
          {/* Live Profile Header Preview */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/75 via-zinc-900 to-zinc-950 border border-yellow-400/35 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-yellow-400 bg-zinc-900 flex items-center justify-center">
                  <img
                    src={teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                    alt="Xem trước Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-yellow-400 text-black font-mono font-black text-[10px] leading-none tabular-nums">
                  LV.{user.level}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cruyff font-black text-base sm:text-lg text-white uppercase tracking-wide">
                    {username.trim() || 'HLV TRƯỞNG'}
                  </span>
                  <span className="text-[11px] text-emerald-300 font-mono flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    {user.deviceId || 'Thiết bị'}
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  <span>{teamName.trim() || 'FC UTOTY'}</span>
                  <span className="mx-1.5 text-gray-500">·</span>
                  <span className="text-yellow-400 font-bold tabular-nums">OVR {user.ovr}</span>
                </div>
              </div>
            </div>

            <span className="text-[11px] uppercase tracking-wider text-yellow-300/90 font-bold">
              Xem trước hồ sơ
            </span>
          </div>

          {/* Name Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="profile-username-input"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-300"
              >
                <User className="w-3.5 h-3.5" />
                <span>Tên Của Tôi (Tên HLV)</span>
              </label>
              <input
                id="profile-username-input"
                type="text"
                maxLength={24}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên HLV của bạn..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/20 focus:border-yellow-400 focus:outline-none text-sm font-bold text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-teamname-input"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Tên Đội Bóng (CLB)</span>
              </label>
              <input
                id="profile-teamname-input"
                type="text"
                maxLength={26}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nhập tên CLB của bạn..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/20 focus:border-emerald-400 focus:outline-none text-sm font-bold text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Image Upload & Custom URL */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-cruyff font-black text-sm uppercase text-white tracking-wider">
                  THAY ĐỔI ẢNH ĐẠI DIỆN / LOGO CỦA TÔI
                </h3>
                <p className="text-xs text-gray-400">
                  Tải ảnh trực tiếp từ máy của bạn hoặc chọn từ bộ sưu tập Logo & Siêu Sao bên dưới
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>Tải Ảnh Từ Thiết Bị</span>
              </button>
            </div>

            {/* Optional Direct Image URL */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Hoặc dán đường dẫn ảnh (https://...) vào đây"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-white/15 focus:border-yellow-400 focus:outline-none text-xs text-white placeholder:text-gray-500"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!customUrl.trim()}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold uppercase text-yellow-300 transition-colors"
              >
                Áp Dụng
              </button>
            </div>

            {/* Preset Gallery */}
            <div className="pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-2">
                Chọn nhanh Logo CLB & Siêu Sao TOTY:
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_LOGOS.map((preset) => {
                  const isSelected = teamLogo === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setTeamLogo(preset.url);
                        setErrorMsg(null);
                      }}
                      title={preset.label}
                      className={`relative p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all aspect-square ${
                        isSelected
                          ? 'bg-yellow-400/20 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.45)] scale-105'
                          : 'bg-zinc-900/90 border-white/10 hover:border-white/35'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 object-contain"
                      />
                      <span className="text-[9px] text-gray-300 truncate w-full text-center">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Đã lưu ảnh đại diện và tên mới thành công!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 font-cruyff font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 text-zinc-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>LƯU ẢNH & TÊN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
