import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Swords,
  MessageSquare,
  Check,
  X,
  Trash2,
  Copy,
  RefreshCw,
  Send,
  Shield,
} from 'lucide-react';
import { UserProfile } from '../types/game';
import { TopSectionHeader } from './TopSectionHeader';
import { soundService } from '../services/sound';

export const MAX_FRIENDS = 50;

export interface SocialCoachPresence {
  userKey: string;
  username: string;
  clientId: string;
  teamName: string;
  teamLogo: string;
  ovr: number;
  rankLabel: string;
  rankLogoUrl: string;
  matchesPlayed?: number;
  lastSeenAt: number;
  online: boolean;
  connId: string | null;
  inQueue: boolean;
  inMatch: boolean;
}

export interface IncomingFriendRequestItem {
  id: string;
  createdAt: number;
  from: SocialCoachPresence;
}

export interface OutgoingFriendRequestItem {
  id: string;
  createdAt: number;
  to: SocialCoachPresence;
}

export interface DirectMessageItem {
  id: string;
  fromKey: string;
  toKey: string;
  fromUsername: string;
  text: string;
  createdAt: number;
}

interface FriendsModalProps {
  user: UserProfile;
  presenceProfile: Record<string, unknown>;
  syncRevision?: number;
  onChallengeFriend: (targetConnId: string, friendUsername: string) => void;
  onRefreshBadge?: (incomingCount: number) => void;
  onClose: () => void;
  onGoHome: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  user,
  presenceProfile,
  syncRevision = 0,
  onChallengeFriend,
  onRefreshBadge,
  onClose,
  onGoHome,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'discover'>('friends');
  const [friends, setFriends] = useState<SocialCoachPresence[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingFriendRequestItem[]>([]);
  const [directory, setDirectory] = useState<SocialCoachPresence[]>([]);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [searchResults, setSearchResults] = useState<SocialCoachPresence[] | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [directAddInput, setDirectAddInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [selectedChatFriend, setSelectedChatFriend] = useState<SocialCoachPresence | null>(null);
  const [chatText, setChatText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const meKey = useMemo(() => String(user.username || '').trim().toLowerCase(), [user.username]);
  const myClientId = String(presenceProfile.clientId || user.username || '');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3200);
  }, []);

  const applyServerSnapshot = useCallback(
    (data: {
      friends?: SocialCoachPresence[];
      incomingRequests?: IncomingFriendRequestItem[];
      outgoingRequests?: OutgoingFriendRequestItem[];
      directory?: SocialCoachPresence[];
      messages?: DirectMessageItem[];
      notice?: string;
    }) => {
      if (Array.isArray(data.friends)) setFriends(data.friends);
      if (Array.isArray(data.incomingRequests)) {
        setIncomingRequests(data.incomingRequests);
        onRefreshBadge?.(data.incomingRequests.length);
      }
      if (Array.isArray(data.outgoingRequests)) setOutgoingRequests(data.outgoingRequests);
      if (Array.isArray(data.directory)) setDirectory(data.directory);
      if (Array.isArray(data.messages)) setMessages(data.messages);
      if (data.notice) showToast(data.notice);
    },
    [onRefreshBadge, showToast]
  );

  const syncWithServer = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/friends/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: presenceProfile }),
      });
      const data = await resp.json();
      if (resp.ok && data?.ok) {
        applyServerSnapshot(data);
      }
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false);
    }
  }, [presenceProfile, applyServerSnapshot]);

  useEffect(() => {
    syncWithServer();
  }, [syncWithServer, syncRevision]);

  const activeChatMessages = useMemo(() => {
    if (!selectedChatFriend) return [];
    const fKey = selectedChatFriend.userKey;
    return messages.filter(
      (m) =>
        (m.fromKey === meKey && m.toKey === fKey) ||
        (m.fromKey === fKey && m.toKey === meKey)
    );
  }, [messages, meKey, selectedChatFriend]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages.length, selectedChatFriend]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundService.playClick();
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    try {
      const resp = await fetch(
        `/api/friends/search?me=${encodeURIComponent(user.username)}&q=${encodeURIComponent(q)}`
      );
      const data = await resp.json();
      if (resp.ok && Array.isArray(data.results)) {
        setSearchResults(data.results);
      }
    } catch {
      showToast('Không thể tìm kiếm lúc này. Hãy thử lại!');
    }
  };

  const handleSendFriendRequest = async (targetUsername: string) => {
    const cleanTarget = targetUsername.trim();
    if (!cleanTarget) {
      showToast('Vui lòng nhập Tên HLV hoặc Mã Thiết Bị cần kết bạn!');
      return;
    }
    if (friends.length >= MAX_FRIENDS) {
      showToast(`Danh sách bạn bè đã đạt tối đa ${MAX_FRIENDS}/${MAX_FRIENDS} người!`);
      return;
    }
    soundService.playClick();
    try {
      const resp = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromProfile: presenceProfile,
          targetUsername: cleanTarget,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        showToast(data?.message || 'Không gửi được lời mời kết bạn.');
        return;
      }
      applyServerSnapshot(data);
      setDirectAddInput('');
    } catch {
      showToast('Lỗi kết nối máy chủ khi gửi lời mời kết bạn.');
    }
  };

  const handleRespondRequest = async (
    requestId: string,
    action: 'accept' | 'decline' | 'cancel'
  ) => {
    if (action === 'accept' && friends.length >= MAX_FRIENDS) {
      showToast(`Danh sách bạn bè đã đạt tối đa ${MAX_FRIENDS}/${MAX_FRIENDS} người!`);
      return;
    }
    soundService.playClick();
    try {
      const resp = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          requestId,
          action,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        showToast(data?.message || 'Không thể xử lý yêu cầu lúc này.');
        return;
      }
      applyServerSnapshot(data);
      if (action === 'accept') {
        soundService.playCoins();
        showToast('Đã chấp nhận lời mời kết bạn!');
      } else if (action === 'decline') {
        showToast('Đã từ chối lời mời kết bạn.');
      } else {
        showToast('Đã thu hồi lời mời kết bạn.');
      }
    } catch {
      showToast('Không thể xử lý yêu cầu lúc này.');
    }
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    soundService.playClick();
    try {
      const resp = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          friendUsername,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.ok) {
        applyServerSnapshot(data);
        if (selectedChatFriend?.username === friendUsername) {
          setSelectedChatFriend(null);
        }
        showToast(`Đã xóa HLV ${friendUsername} khỏi danh sách bạn bè.`);
      }
    } catch {
      showToast('Không thể xóa bạn lúc này.');
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatFriend || !chatText.trim()) return;
    const textToSend = chatText.trim();
    setChatText('');
    soundService.playClick();
    try {
      const resp = await fetch('/api/friends/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUsername: user.username,
          toUsername: selectedChatFriend.username,
          text: textToSend,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.ok) {
        applyServerSnapshot(data);
      }
    } catch {
      showToast('Không gửi được tin nhắn.');
    }
  };

  const handleCopyTag = async (val: string, label: string) => {
    soundService.playClick();
    try {
      await navigator.clipboard.writeText(val);
      showToast(`Đã sao chép ${label}: ${val}`);
    } catch {
      showToast(`${label}: ${val}`);
    }
  };

  const friendKeySet = useMemo(() => new Set(friends.map((f) => f.userKey)), [friends]);
  const outgoingKeySet = useMemo(
    () => new Set(outgoingRequests.map((r) => r.to.userKey)),
    [outgoingRequests]
  );

  const renderStatusBadge = (coach: SocialCoachPresence) => {
    const unplayed = (coach.matchesPlayed ?? 0) === 0;
    return (
      <span className="inline-flex items-center gap-1">
        {coach.inMatch ? (
          <span className="px-2 py-0.5 rounded-none bg-amber-500/20 border border-amber-400 text-amber-300 font-mono font-black text-[10px] uppercase">
            ĐANG THI ĐẤU
          </span>
        ) : coach.inQueue ? (
          <span className="px-2 py-0.5 rounded-none bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 font-mono font-black text-[10px] uppercase">
            ĐANG TÌM TRẬN
          </span>
        ) : coach.online ? (
          <span className="px-2 py-0.5 rounded-none bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-black text-[10px] uppercase">
            TRỰC TUYẾN
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-none bg-slate-800 border border-white/15 text-slate-400 font-mono font-bold text-[10px] uppercase">
            NGOẠI TUYẾN
          </span>
        )}
        {unplayed && !coach.inMatch && (
          <span className="px-1.5 py-0.5 rounded-none bg-sky-500/15 border border-sky-400/45 text-sky-300 font-mono font-bold text-[10px] uppercase">
            CHƯA CHƠI
          </span>
        )}
      </span>
    );
  };

  const displayedDiscoverList = searchResults !== null ? searchResults : directory;

  return (
    <div className="fixed inset-0 z-50 bg-[#04091D] flex flex-col font-cruyff select-none overflow-hidden text-white">
      {/* Stadium Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/assets/aistudio/draft_TOTY26_BG_c07ec164.png"
          alt=""
          className="w-full h-full object-cover opacity-25"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 25%, rgba(56,189,248,0.18) 0%, rgba(4,9,29,0.92) 60%, #020617 100%)',
          }}
        />
      </div>

      {/* Top Header */}
      <TopSectionHeader
        title="BẠN BÈ & GIAO HỮU TRỰC TUYẾN"
        subtitle="Kết nối Huấn Luyện Viên thực, nhắn tin chiến thuật và gửi lời mời Thách Đấu PvP thời gian thực"
        user={user}
        onBack={onClose}
        onGoHome={onGoHome}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 rounded-none bg-gradient-to-r from-cyan-400 via-emerald-300 to-yellow-300 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl border border-white">
          {toastMsg}
        </div>
      )}

      {/* Sub-navigation & My Coach Identity Strip */}
      <div className="relative z-10 px-4 sm:px-6 py-3 bg-slate-950/95 border-b border-white/25 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Sharp Tab Bar with Logo Next to Text */}
        <div className="flex items-stretch border border-white/30 divide-x divide-white/25 rounded-none bg-[#07112B]">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('friends');
            }}
            className={`px-4 py-2.5 rounded-none flex items-center gap-2 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-colors ${
              activeTab === 'friends'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>
              BẠN BÈ ({friends.length}/{MAX_FRIENDS})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('requests');
            }}
            className={`px-4 py-2.5 rounded-none flex items-center gap-2 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>LỜI MỜI ({incomingRequests.length})</span>
            {incomingRequests.length > 0 && activeTab !== 'requests' && (
              <span className="px-1.5 py-0.2 rounded-none bg-rose-500 text-white font-mono text-[10px] font-black">
                MỚI
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setActiveTab('discover');
            }}
            className={`px-4 py-2.5 rounded-none flex items-center gap-2 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-colors ${
              activeTab === 'discover'
                ? 'bg-emerald-400 text-slate-950'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>TÌM BẠN &amp; HLV MÁY CHỦ ({directory.length})</span>
          </button>
        </div>

        {/* My Coach Info + Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-none bg-slate-900 border border-cyan-400/50 flex items-center gap-2 text-xs">
            <Shield className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="text-slate-400 uppercase font-bold">Tên HLV của bạn:</span>
            <strong className="font-mono text-cyan-200">{user.username}</strong>
            <button
              type="button"
              onClick={() => handleCopyTag(user.username, 'Tên HLV')}
              className="p-1 rounded-none bg-white/10 hover:bg-white/20 text-cyan-200 cursor-pointer"
              title="Sao chép Tên HLV"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              syncWithServer();
            }}
            className="px-3 py-2 rounded-none bg-white/10 hover:bg-white/20 border border-white/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-300' : ''}`} />
            <span>LÀM MỚI</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* TAB 1: FRIENDS LIST + DIRECT CHAT */}
          {activeTab === 'friends' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 cols: Friends Roster */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-300" />
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      DANH SÁCH BẠN BÈ ({friends.length}/{MAX_FRIENDS})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('discover')}
                    className="px-3 py-1 rounded-none bg-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>THÊM BẠN MỚI</span>
                  </button>
                </div>

                {friends.length === 0 ? (
                  <div className="p-8 rounded-none bg-slate-950/85 border border-white/20 text-center space-y-3">
                    <Users className="w-10 h-10 text-cyan-400/60 mx-auto" />
                    <div className="font-black text-base uppercase text-white">
                      CHƯA CÓ HUẤN LUYỆN VIÊN NÀO TRONG DANH SÁCH BẠN BÈ (TỐI ĐA {MAX_FRIENDS} BẠN BÈ)
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Chuyển sang tab <strong className="text-emerald-300">TÌM BẠN &amp; HLV MÁY CHỦ</strong> để xem toàn bộ Huấn Luyện Viên trên máy chủ (kể cả HLV chưa chơi trận nào) hoặc nhập Tên HLV để kết bạn!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('discover')}
                      className="px-5 py-2.5 rounded-none bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      MỞ DANH BẠ HLV MÁY CHỦ
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {friends.map((friend) => {
                      const isChatSelected = selectedChatFriend?.userKey === friend.userKey;
                      return (
                        <div
                          key={friend.userKey}
                          className={`p-3.5 rounded-none border transition-colors flex flex-wrap items-center justify-between gap-3 ${
                            isChatSelected
                              ? 'bg-cyan-950/50 border-cyan-300'
                              : 'bg-slate-950/85 border-white/20 hover:border-cyan-400/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-none bg-slate-900 border border-white/25 flex items-center justify-center p-1 shrink-0 relative">
                              <img
                                src={friend.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                                alt={friend.teamName}
                                className="w-full h-full object-contain"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-none border border-slate-950 ${
                                  friend.online ? 'bg-emerald-400' : 'bg-slate-600'
                                }`}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-base text-white truncate">
                                  {friend.username}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-none bg-yellow-400 text-slate-950 font-mono font-black text-[11px]">
                                  OVR {friend.ovr}
                                </span>
                                {renderStatusBadge(friend)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                                <span className="truncate">{friend.teamName}</span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                                  <img
                                    src={friend.rankLogoUrl || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                                    alt=""
                                    className="w-4 h-4 object-contain"
                                  />
                                  {friend.rankLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                soundService.playClick();
                                setSelectedChatFriend(friend);
                              }}
                              className="px-3 py-2 rounded-none bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/60 text-cyan-200 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>NHẮN TIN</span>
                            </button>

                            <button
                              type="button"
                              disabled={!friend.online || !friend.connId || friend.inMatch}
                              onClick={() => {
                                if (friend.connId) {
                                  soundService.playClick();
                                  onChallengeFriend(friend.connId, friend.username);
                                }
                              }}
                              className={`px-3 py-2 rounded-none font-black text-xs uppercase flex items-center gap-1.5 border ${
                                friend.online && friend.connId && !friend.inMatch
                                  ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 border-white cursor-pointer hover:brightness-110'
                                  : 'bg-white/5 text-slate-500 border-white/15 cursor-not-allowed'
                              }`}
                            >
                              <Swords className="w-3.5 h-3.5" />
                              <span>THÁCH ĐẤU</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFriend(friend.username)}
                              className="p-2 rounded-none bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 cursor-pointer"
                              title="Xóa bạn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right 5 cols: Real-time Direct Chat Box */}
              <div className="lg:col-span-5 flex flex-col h-[460px] rounded-none bg-slate-950/90 border border-white/25">
                <div className="p-3 border-b border-white/20 bg-[#081330] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-300" />
                    <span className="font-black text-xs uppercase tracking-wider text-white">
                      {selectedChatFriend
                        ? `TRÒ CHUYỆN CÙNG HLV ${selectedChatFriend.username}`
                        : 'KÊNH NHẮN TIN BẠN BÈ'}
                    </span>
                  </div>
                  {selectedChatFriend && renderStatusBadge(selectedChatFriend)}
                </div>

                {!selectedChatFriend ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                    Chọn nút <strong className="text-cyan-300 mx-1">NHẮN TIN</strong> cạnh một người bạn để trò chuyện trực tiếp hoặc hẹn đá giao hữu PvP.
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {activeChatMessages.length === 0 ? (
                        <div className="text-center text-xs text-slate-500 py-8">
                          Hãy gửi lời chào đầu tiên tới HLV {selectedChatFriend.username}!
                        </div>
                      ) : (
                        activeChatMessages.map((m) => {
                          const isMine = m.fromKey === meKey;
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[82%] px-3 py-2 rounded-none border text-xs ${
                                  isMine
                                    ? 'bg-cyan-400/20 border-cyan-300/60 text-cyan-50'
                                    : 'bg-slate-800/90 border-white/20 text-white'
                                }`}
                              >
                                <div className="font-bold text-[10px] text-amber-300 mb-0.5">
                                  {isMine ? 'Bạn' : m.fromUsername}
                                </div>
                                <div className="break-words">{m.text}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    <form
                      onSubmit={handleSendChatMessage}
                      className="p-2.5 border-t border-white/20 flex items-stretch gap-2 bg-slate-900"
                    >
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder={`Nhắn cho ${selectedChatFriend.username}...`}
                        maxLength={240}
                        className="flex-1 px-3 py-2 rounded-none bg-slate-950 border border-white/25 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-none bg-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>GỬI</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INCOMING & OUTGOING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incoming */}
              <div className="p-4 rounded-none bg-slate-950/90 border border-white/25 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-amber-300">
                    LỜI MỜI KẾT BẠN NHẬN ĐƯỢC ({incomingRequests.length})
                  </h3>
                </div>

                {incomingRequests.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Hiện chưa có lời mời kết bạn mới nào.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-none bg-slate-900 border border-amber-400/40 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={req.from.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                            alt=""
                            className="w-10 h-10 object-contain bg-slate-950 p-1 border border-white/20 rounded-none"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white">
                                {req.from.username}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-none bg-yellow-400 text-slate-950 font-mono font-black text-[10px]">
                                OVR {req.from.ovr}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {req.from.teamName} · {req.from.rankLabel}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondRequest(req.id, 'accept')}
                            className="px-3 py-1.5 rounded-none bg-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ĐỒNG Ý</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondRequest(req.id, 'decline')}
                            className="px-3 py-1.5 rounded-none bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/50 text-rose-200 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>TỪ CHỐI</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing */}
              <div className="p-4 rounded-none bg-slate-950/90 border border-white/25 space-y-3">
                <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                  <Send className="w-4 h-4 text-cyan-300" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-cyan-300">
                    LỜI MỜI ĐÃ GỬI ({outgoingRequests.length})
                  </h3>
                </div>

                {outgoingRequests.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Bạn chưa gửi lời mời kết bạn nào đang chờ phản hồi.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-none bg-slate-900 border border-white/20 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={req.to.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                            alt=""
                            className="w-10 h-10 object-contain bg-slate-950 p-1 border border-white/20 rounded-none"
                          />
                          <div>
                            <div className="font-black text-sm text-white">
                              {req.to.username}{' '}
                              <span className="text-yellow-300 font-mono text-xs">
                                (OVR {req.to.ovr})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">{req.to.teamName}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRespondRequest(req.id, 'cancel')}
                          className="px-3 py-1.5 rounded-none bg-white/10 hover:bg-white/20 border border-white/25 text-slate-200 font-black text-xs uppercase cursor-pointer"
                        >
                          THU HỒI
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVER & ADD COACHES */}
          {activeTab === 'discover' && (
            <div className="space-y-5">
              {/* Direct Add + Search Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-none bg-slate-950/90 border border-cyan-400/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-cyan-300">
                      KẾT BẠN TRỰC TIẾP BẰNG TÊN HLV HOẶC MÃ THIẾT BỊ
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTag(myClientId, 'Mã Thiết Bị')}
                      className="text-[11px] text-amber-300 hover:underline font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Mã của bạn: {myClientId.slice(0, 12)}
                    </button>
                  </div>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      value={directAddInput}
                      onChange={(e) => setDirectAddInput(e.target.value)}
                      placeholder="Nhập chính xác Tên HLV người chơi..."
                      className="flex-1 px-3 py-2.5 rounded-none bg-slate-900 border border-white/25 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendFriendRequest(directAddInput)}
                      className="px-4 py-2.5 rounded-none bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>GỬI KẾT BẠN</span>
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleSearch}
                  className="p-4 rounded-none bg-slate-950/90 border border-white/25 space-y-2.5"
                >
                  <div className="font-black text-xs uppercase tracking-wider text-slate-200">
                    TÌM KIẾM TRONG DANH BẠ MÁY CHỦ FC MOBILE VN
                  </div>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo Tên HLV hoặc Tên Câu Lạc Bộ..."
                      className="flex-1 px-3 py-2.5 rounded-none bg-slate-900 border border-white/25 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-none bg-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>TÌM KIẾM</span>
                    </button>
                    {searchResults !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults(null);
                        }}
                        className="px-3 py-2.5 rounded-none bg-white/10 border border-white/20 text-xs font-bold uppercase cursor-pointer"
                      >
                        XÓA LỌC
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Online & Registered Real Coaches Directory */}
              <div className="p-4 rounded-none bg-slate-950/90 border border-white/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {searchResults !== null
                        ? `KẾT QUẢ TÌM KIẾM (${displayedDiscoverList.length})`
                        : `HUẤN LUYỆN VIÊN TRÊN MÁY CHỦ (${displayedDiscoverList.length})`}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Tính cả Huấn Luyện Viên chưa chơi trận nào &amp; ngoại tuyến · Tối đa {MAX_FRIENDS} bạn bè
                  </span>
                </div>

                {displayedDiscoverList.length === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="font-black text-sm uppercase text-slate-300">
                      CHƯA CÓ HLV KHÁC TRONG DANH SÁCH NÀY
                    </div>
                    <p className="text-xs text-slate-400 max-w-lg mx-auto">
                      Mở trò chơi trên một trình duyệt hoặc thiết bị khác và đặt Tên HLV để xuất hiện trực tiếp trong danh bạ thời gian thực và kết bạn / thách đấu PvP!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedDiscoverList.map((coach) => {
                      const alreadyFriend = friendKeySet.has(coach.userKey);
                      const pendingOut = outgoingKeySet.has(coach.userKey);
                      return (
                        <div
                          key={coach.userKey}
                          className="p-3.5 rounded-none bg-slate-900 border border-white/20 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={coach.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                              alt=""
                              className="w-11 h-11 object-contain bg-slate-950 p-1 border border-white/20 rounded-none shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-black text-sm text-white truncate">
                                  {coach.username}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-none bg-yellow-400 text-slate-950 font-mono font-black text-[10px]">
                                  OVR {coach.ovr}
                                </span>
                                {renderStatusBadge(coach)}
                              </div>
                              <div className="text-xs text-slate-400 truncate mt-0.5">
                                {coach.teamName} · {coach.rankLabel}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {alreadyFriend ? (
                              <span className="px-2.5 py-1.5 rounded-none bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-[11px] uppercase">
                                BẠN BÈ
                              </span>
                            ) : pendingOut ? (
                              <span className="px-2.5 py-1.5 rounded-none bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-[11px] uppercase">
                                ĐÃ GỬI
                              </span>
                            ) : friends.length >= MAX_FRIENDS ? (
                              <span className="px-2.5 py-1.5 rounded-none bg-slate-800 border border-white/20 text-slate-400 font-black text-[11px] uppercase">
                                ĐẦY {MAX_FRIENDS}/{MAX_FRIENDS}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendFriendRequest(coach.username)}
                                className="px-3 py-1.5 rounded-none bg-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>KẾT BẠN</span>
                              </button>
                            )}

                            {coach.online && coach.connId && !coach.inMatch && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundService.playClick();
                                  onChallengeFriend(coach.connId!, coach.username);
                                }}
                                className="px-2.5 py-1.5 rounded-none bg-amber-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase flex items-center gap-1 cursor-pointer"
                                title="Thách đấu PvP ngay"
                              >
                                <Swords className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
