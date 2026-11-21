import React from 'react';
import { Mail, Gift, Check, X, Coins, Sparkles, Lock, Clock } from 'lucide-react';
import { MailItem } from '../types/game';
import { soundService } from '../services/sound';

interface MailboxModalProps {
  mailList: MailItem[];
  claimedToday: boolean;
  onClose: () => void;
  onClaimReward: (mailId: string) => void;
}

export const MailboxModal: React.FC<MailboxModalProps> = ({
  mailList,
  claimedToday,
  onClose,
  onClaimReward,
}) => {
  const unreadCount = mailList.filter((m) => !m.claimed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none font-cruyff">
      <div className="w-full max-w-2xl bg-zinc-950 border border-yellow-400/30 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] font-cruyff">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="font-cruyff font-black text-xl text-white uppercase italic tracking-wider">
                HỘP TIN & PHẦN THƯỞNG
              </h2>
              <p className="text-xs text-gray-400 tabular-nums">
                Còn <span className="text-yellow-400 font-bold">{unreadCount}</span> thư chưa nhận · Giới hạn nhận:{' '}
                <span className="text-amber-300 font-bold">{claimedToday ? '1/1' : '0/1'} lần/ngày</span>
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

        {/* Single-Use & Daily 1-Claim Rule Banner */}
        <div
          className={`mt-3 px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            claimedToday
              ? 'bg-amber-950/40 border-amber-400/40 text-amber-200'
              : 'bg-emerald-950/35 border-emerald-400/35 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {claimedToday
                ? 'Bạn đã nhận quà Hộp Tin hôm nay (1 lần/ngày, làm mới lúc 06:00 sáng). Mỗi tin nhắn chỉ sử dụng 1 lần!'
                : 'Mỗi tin nhắn trong Hộp Tin chỉ được sử dụng đúng 1 lần duy nhất (tối đa 1 thư/ngày, reset lúc 06:00 sáng).'}
            </span>
          </div>
          <span className="font-mono font-bold tabular-nums shrink-0">
            {claimedToday ? '1/1 HÔM NAY' : '0/1 HÔM NAY'}
          </span>
        </div>

        {/* Weekend Gift Banner */}
        <div className="mt-3 rounded-xl overflow-hidden border border-yellow-400/40 shadow-lg">
          <img
            src="/assets/aistudio/inbox_WEEKEND_GIFT_BANNER_260903_f827e810.png"
            alt="Weekend Gift Banner"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover max-h-32"
          />
        </div>

        {/* Mail List */}
        <div className="mt-3 space-y-3 overflow-y-auto pr-1">
          {mailList.map((mail) => (
            <div
              key={mail.id}
              className={`p-4 rounded-xl border transition-all ${
                mail.claimed
                  ? 'bg-white/5 border-white/5 opacity-60'
                  : 'bg-zinc-900 border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Gift className={`w-5 h-5 mt-1 shrink-0 ${mail.claimed ? 'text-gray-500' : 'text-yellow-400'}`} />
                  <div>
                    <h3 className="font-cruyff font-bold text-sm text-white">{mail.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span>{mail.sender}</span>
                      <span>·</span>
                      <span>{mail.date}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-300 leading-relaxed">
                      {mail.content}
                    </p>

                    {/* Rewards Preview */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-3 tabular-nums">
                      {mail.rewards.coins ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs font-mono font-bold text-yellow-300">
                          <Coins className="w-3.5 h-3.5" />
                          <span>+{mail.rewards.coins.toLocaleString('vi-VN')} Xu</span>
                        </div>
                      ) : null}
                      {mail.rewards.gems ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-mono font-bold text-blue-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+{mail.rewards.gems.toLocaleString('vi-VN')} Kim Cương</span>
                        </div>
                      ) : null}
                      {mail.rewards.tickets ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-xs font-mono font-bold text-rose-300">
                          <img
                            src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                            alt="Vé Quay"
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-3.5 object-contain"
                          />
                          <span>+{mail.rewards.tickets} Vé Quay</span>
                        </div>
                      ) : null}
                      {mail.rewards.playerId ? (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/50 text-xs font-cruyff font-bold text-indigo-200">
                          <img
                            src="/assets/aistudio/97_gift_ronaldinho_3cf3e463.png"
                            alt={mail.rewards.playerLabel || 'Quà Cầu Thủ'}
                            referrerPolicy="no-referrer"
                            className="w-6 h-7 object-contain shrink-0"
                          />
                          <span>+{mail.rewards.playerLabel || 'Thẻ Cầu Thủ Đặc Biệt'}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {mail.claimed ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 font-semibold whitespace-nowrap">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Đã nhận (1/1)
                    </span>
                  ) : claimedToday && !mail.rewards.playerId ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-lg bg-white/10 border border-white/10 text-gray-400 font-cruyff font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap"
                      title="Hộp tin chỉ được nhận 1 lần mỗi ngày"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Nhận Ngày Mai</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (mail.claimed) return;
                        if (mail.rewards.playerId) {
                          soundService.playPackTear();
                        } else {
                          soundService.playCoins();
                        }
                        onClaimReward(mail.id);
                      }}
                      className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-cruyff font-bold text-xs uppercase tracking-wider active:scale-95 shadow-md shadow-yellow-500/20 cursor-pointer whitespace-nowrap"
                    >
                      Nhận Quà
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
