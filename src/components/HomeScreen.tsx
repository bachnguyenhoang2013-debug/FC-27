import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Trophy,
  TrendingUp,
  ChevronRight,
  Volume2,
  VolumeX,
  Music,
  Swords,
  Gift,
  Smartphone,
  Info,
  ArrowLeftRight,
  Star,
  Users,
} from 'lucide-react';
import { soundService } from '../services/sound';
import {
  UserProfile,
  DailyQuest,
  MailItem,
  PlayerCard,
  TicketSpinTheme,
  FormationSlot,
  RankedIncomingInvite,
  ClubKeyMatchHistoryEntry,
  TacticalPlayStyleId,
} from '../types/game';
import {
  totyFeaturedPlayers,
  classicsIconsPlayers,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
  STARTER_BENCH_IDS,
} from '../data/mockData';
import { availableFormations } from '../data/formationsData';
import { getPlayStyleDef } from '../data/playStylesData';
import {
  addOwnedPlayerCopies,
  computeSquadOvr,
  getCanonicalPlayerNameKey,
  getPositionPenalty,
} from '../utils/squadUtils';
import { evaluateManagerBonus } from '../data/managersData';
import {
  GINGA_ASSETS,
  gingaPlayers,
  gingaPackBPlayers,
  GINGA_MILESTONES,
  getDailyGingaQuests,
} from '../data/gingaData';
import {
  BUNDESLIGA_ASSETS,
  BUNDESLIGA_DAILY_GOAL_TARGET,
  normalizeBundesligaState,
} from '../data/bundesligaData';
import { CHAMPIONS_JUVENTUS_ASSETS } from '../data/championsJuventusData';
import { PackOpeningModal, PackTier } from './PackOpeningModal';
import { MyTeamModal, MAX_TRAINING_LEVEL, MyTeamTabId } from './MyTeamModal';
import { MailboxModal } from './MailboxModal';
import { QuestsModal } from './QuestsModal';
import { FriendsModal } from './FriendsModal';
import { SettingsModal } from './SettingsModal';
import { ProfileEditModal } from './ProfileEditModal';
import { FCCard } from './FCCard';
import { PlayerAlbumModal } from './PlayerAlbumModal';
import { PackOddsModal } from './PackOddsModal';
import { ShopModal, TopStoreTab } from './ShopModal';
import { TicketSpinSection } from './TicketSpinSection';
import { CareerModeModal } from './CareerModeModal';
import { GingaEventModal, GingaChapterId } from './GingaEventModal';
import { TotyShardsModal } from './TotyShardsModal';
import { ComplexHubModal, ComplexSectionId } from './ComplexHubModal';
import type { FeaturedEventDestination } from './ConmebolLibertadoresModal';
import { EXTRA_TIME_ASSETS } from '../data/extraTimeData';
import {
  BallonDorStreakModal,
  BALLON_DOR_STREAK_STEPS,
} from './BallonDorStreakModal';
import { TransferMarketModal } from './TransferMarketModal';
import { RankedModeModal } from './RankedModeModal';
import {
  StarPassModal,
  PREMIUM_STAR_PASS_COST_GEMS,
  countUnclaimedStarPassRewards,
  getCurrentStarPassLevel,
  normalizeStarPassState,
} from './StarPassModal';
import { IconsModal } from './IconsModal';
import { KickoffModal } from './KickoffModal';
import {
  KICKOFF_ASSETS,
  KickoffActionRoute,
  countReadyKickoffClaims,
  formatKickoffCountdown,
  getNextLockedKickoffDayInfo,
  isKickoffCompleted,
  normalizeKickoffState,
} from '../data/kickoffData';
import { SquadConeLogo, StoreCartLogo, CareerPlayButton } from './GameUiIcons';
import {
  RANKED_ASSETS,
  normalizeRankedSeasonState,
  resolveRankFromStars,
  formatRankedSeasonCountdown,
} from '../data/rankedData';
import { normalizeCraftInventory } from './CraftingCardBadge';
import {
  getTodayDateKey,
  getDaily6AMCycleKey,
  getFutureStarsCycleKey,
  normalizeTotyDailyStreak,
  normalizeClubDaily,
  normalizeGingaState,
  normalizeLibertadoresState,
  isLibertadoresEventUnlocked,
} from '../utils/dateUtils';
import { getCalendarRewardForDate } from '../data/calendarData';
import {
  CLUB_KEY_MATCH_ASSETS,
  DAILY_MAX_CLUB_MATCHES,
  getDailyFeaturedKeyMatch,
} from '../data/clubKeyMatchData';
import {
  useLibertadoresAssets,
  LIBERTADORES_TOKEN_SMALL_FALLBACK,
} from '../data/libertadoresAssets';
import { resolvePlayerWithUtotyUpgrade } from '../utils/utotyUpgrade';
import { useLanguage } from '../i18n/language';

interface HomeScreenProps {
  user: UserProfile;
  onUpdateUser: (
    updated: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onResetStarterAccount?: () => void;
  onLogout: () => void;
  quests: DailyQuest[];
  onUpdateQuests: (
    quests: DailyQuest[] | ((prev: DailyQuest[]) => DailyQuest[])
  ) => void;
  mailList: MailItem[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onUpdateUser,
  onResetStarterAccount,
  onLogout,
  quests,
  onUpdateQuests,
  mailList,
}) => {
  const { locale, t } = useLanguage();
  // Modals
  const { getAsset: getLibertadoresAsset } = useLibertadoresAssets();
  const [showPackOpening, setShowPackOpening] = useState(false);
  const [fixedWalkoutModal, setFixedWalkoutModal] = useState<{
    player: PlayerCard;
    title?: string;
  } | null>(null);
  const [selectedPackTier, setSelectedPackTier] = useState<PackTier>('GINGA_92_106');
  const [selectedPackCustomName, setSelectedPackCustomName] = useState<string | undefined>(undefined);
  const [isTicketSpinMode, setIsTicketSpinMode] = useState(true);
  const [ticketSpinTheme, setTicketSpinTheme] = useState<TicketSpinTheme>('GINGA');
  const [selectedPackTheme, setSelectedPackTheme] = useState<TicketSpinTheme>('GINGA');
  const [oddsModalTheme, setOddsModalTheme] = useState<TicketSpinTheme>('GINGA');
  const [spinCount, setSpinCount] = useState<1 | 10>(1);
  const [spinCountBeforeBatch, setSpinCountBeforeBatch] = useState<number>(0);
  const [showShop, setShowShop] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<TopStoreTab>('recommended');
  const [showGingaEvent, setShowGingaEvent] = useState(false);
  const [gingaInitialChapter, setGingaInitialChapter] = useState<GingaChapterId>('main');
  const [showShardExchange, setShowShardExchange] = useState(false);
  const [showComplexHub, setShowComplexHub] = useState(false);
  const [complexInitialSection, setComplexInitialSection] =
    useState<ComplexSectionId>('extra_time');
  const openComplexSection = (section: ComplexSectionId = 'extra_time') => {
    setComplexInitialSection(section);
    setShowComplexHub(true);
  };
  const [showBallonDorStreak, setShowBallonDorStreak] = useState(false);
  const [showTransferMarket, setShowTransferMarket] = useState(false);
  const [showOddsModalForTier, setShowOddsModalForTier] = useState<PackTier | null>(null);
  const [showMyTeam, setShowMyTeam] = useState(false);
  const [myTeamInitialTab, setMyTeamInitialTab] = useState<MyTeamTabId>('lineup');
  const openMyTeamWithTab = (tab: MyTeamTabId = 'lineup') => {
    setMyTeamInitialTab(tab);
    setShowMyTeam(true);
    onUpdateUser((prev) => {
      const curKo = normalizeKickoffState(prev.kickoffState);
      return {
        kickoffState: {
          ...curKo,
          squadEdits: (curKo.squadEdits ?? 0) + 1,
        },
      };
    });
  };
  const normalizedClubDaily = useMemo(
    () => normalizeClubDaily(user.clubDaily, getDaily6AMCycleKey()),
    [user.clubDaily]
  );
  const remainingClubMatches = Math.max(
    0,
    DAILY_MAX_CLUB_MATCHES - normalizedClubDaily.matchesPlayed
  );
  const todayFeaturedClubMatch = useMemo(
    () => getDailyFeaturedKeyMatch(normalizedClubDaily.cycleKey),
    [normalizedClubDaily.cycleKey]
  );
  const [showCareer, setShowCareer] = useState(false);
  const [showRanked, setShowRanked] = useState(false);
  const [incomingRankedInvite, setIncomingRankedInvite] = useState<RankedIncomingInvite | null>(
    null
  );
  const [pendingRankedInviteToAccept, setPendingRankedInviteToAccept] =
    useState<RankedIncomingInvite | null>(null);
  const [pendingDirectInviteTarget, setPendingDirectInviteTarget] = useState<{
    connId: string;
    username: string;
  } | null>(null);
  const homeRankedWsRef = useRef<WebSocket | null>(null);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [incomingFriendReqCount, setIncomingFriendReqCount] = useState(0);
  const [friendsSyncRev, setFriendsSyncRev] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showStarPass, setShowStarPass] = useState(false);
  const [showIconsModal, setShowIconsModal] = useState(false);
  const [iconsInitialChapter, setIconsInitialChapter] = useState<
    'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ultimate' | 'ronaldo'
  >('ch1');
  const [showKickoff, setShowKickoff] = useState(false);
  const [kickoffNowMs, setKickoffNowMs] = useState<number>(() => Date.now());
  const [careerInitialTab, setCareerInitialTab] = useState<
    'standings' | 'fixtures' | 'rewards'
  >('standings');

  const kickoffState = useMemo(
    () => normalizeKickoffState(user.kickoffState, kickoffNowMs),
    [user.kickoffState, kickoffNowMs]
  );
  const kickoffFinished = useMemo(
    () => isKickoffCompleted(kickoffState),
    [kickoffState]
  );
  const kickoffReadyCount = useMemo(
    () => (kickoffFinished ? 0 : countReadyKickoffClaims(user, kickoffNowMs)),
    [user, kickoffFinished, kickoffNowMs]
  );
  const kickoffNextUnlock = useMemo(
    () => (kickoffFinished ? null : getNextLockedKickoffDayInfo(kickoffState, kickoffNowMs)),
    [kickoffState, kickoffFinished, kickoffNowMs]
  );

  useEffect(() => {
    if (kickoffFinished) return;
    const id = setInterval(() => {
      setKickoffNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [kickoffFinished]);

  const handleKickoffNavigate = (route: KickoffActionRoute) => {
    setShowKickoff(false);
    switch (route) {
      case 'tickets':
        setTicketSpinTheme('GINGA');
        setActiveTab('tickets');
        break;
      case 'career':
        setCareerInitialTab('standings');
        setShowCareer(true);
        break;
      case 'ranked':
        setShowRanked(true);
        break;
      case 'team':
        openMyTeamWithTab('lineup');
        break;
      case 'tactics':
        openMyTeamWithTab('tactics');
        break;
      case 'club':
        openMyTeamWithTab('club');
        break;
      case 'shop':
        setShowShop(true);
        break;
      case 'star_pass':
        setShowStarPass(true);
        break;
      case 'icons':
        setShowIconsModal(true);
        break;
      case 'toty':
      case 'ginga':
        setGingaInitialChapter('main');
        setShowGingaEvent(true);
        break;
      default:
        break;
    }
  };

  const starPassState = useMemo(() => normalizeStarPassState(user.starPass), [user.starPass]);
  const starPassLevel = useMemo(
    () => getCurrentStarPassLevel(starPassState.points),
    [starPassState.points]
  );
  const starPassUnclaimedCount = useMemo(
    () => countUnclaimedStarPassRewards(starPassState),
    [starPassState]
  );

  const normalizedRanked = useMemo(
    () => normalizeRankedSeasonState(user.rankedState),
    [user.rankedState]
  );
  const currentRankInfo = useMemo(
    () =>
      resolveRankFromStars(
        normalizedRanked.totalStars,
        normalizedRanked.hasReachedChampion
      ),
    [normalizedRanked.totalStars, normalizedRanked.hasReachedChampion]
  );

  // Synchronous single-use locks to block rapid double-clicks before state settles
  const dailyClaimLockRef = useRef<boolean>(Boolean(user.dailyCheckInClaimed));
  const claimedMailLockRef = useRef<Set<string>>(new Set(user.claimedMailIds ?? []));
  const claimedQuestLockRef = useRef<Set<string>>(
    new Set([
      ...(user.claimedQuestIds ?? []),
      ...quests.filter((q) => q.claimed).map((q) => q.id),
    ])
  );

  useEffect(() => {
    dailyClaimLockRef.current = Boolean(user.dailyCheckInClaimed);
  }, [user.dailyCheckInClaimed]);

  useEffect(() => {
    claimedMailLockRef.current = new Set(user.claimedMailIds ?? []);
  }, [user.claimedMailIds]);

  useEffect(() => {
    claimedQuestLockRef.current = new Set([
      ...(user.claimedQuestIds ?? []),
      ...quests.filter((q) => q.claimed).map((q) => q.id),
    ]);
  }, [user.claimedQuestIds, quests]);

  const claimedCalendarLockRef = useRef<Set<string>>(
    new Set(user.calendarClaimedDates ?? [])
  );
  useEffect(() => {
    claimedCalendarLockRef.current = new Set(user.calendarClaimedDates ?? []);
  }, [user.calendarClaimedDates]);

  const [todayMidnightKey, setTodayMidnightKey] = useState<string>(() =>
    getDaily6AMCycleKey()
  );
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextKey = getDaily6AMCycleKey();
      setTodayMidnightKey((prev) => (prev === nextKey ? prev : nextKey));
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const dailyClaimed = Boolean(user.dailyCheckInClaimed);

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<'home' | 'tickets' | 'career' | 'team' | 'store'>('home');

  // Hero showcase player index (Ginga 26 Showcase starting with 106 OVR Kaká)
  const gingaHeroShowcase = useMemo(
    () => [...gingaPlayers, ...gingaPackBPlayers],
    []
  );
  const [heroPlayerIndex, setHeroPlayerIndex] = useState(0);
  const heroPlayer = useMemo(
    () =>
      gingaHeroShowcase[heroPlayerIndex % gingaHeroShowcase.length] || gingaPlayers[0],
    [gingaHeroShowcase, heroPlayerIndex]
  );

  // Resolve user's owned club roster, 11 starters, 7 bench, and active formation
  const playerById = useMemo(() => {
    const upgradedSet = new Set(user.utotyUpgradedIds ?? []);
    const map = new Map<string, PlayerCard>();
    totyFeaturedPlayers.forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, resolvePlayerWithUtotyUpgrade(p, upgradedSet));
      }
    });
    return map;
  }, [user.utotyUpgradedIds]);

  const ownedPlayers = useMemo(() => {
    const ids = user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS;
    const seen = new Set<string>();
    const list: PlayerCard[] = [];
    ids.forEach((id) => {
      const card = playerById.get(id);
      if (card && !seen.has(card.id)) {
        seen.add(card.id);
        list.push(card);
      }
    });
    if (list.length < 18) {
      STARTER_OWNED_IDS.forEach((id) => {
        const card = playerById.get(id);
        if (card && !seen.has(card.id)) {
          seen.add(card.id);
          list.push(card);
        }
      });
    }
    return list;
  }, [user.ownedPlayerIds, playerById]);

  const { starters, bench } = useMemo(() => {
    const used = new Set<string>();
    const usedStarterNames = new Set<string>();
    const starterIds = user.starterIds?.length === 11 ? user.starterIds : STARTER_STARTER_IDS;
    const resolvedStarters: PlayerCard[] = [];

    starterIds.forEach((id) => {
      const card = playerById.get(id);
      if (!card || used.has(card.id)) return;
      const nameKey = getCanonicalPlayerNameKey(card);
      if (usedStarterNames.has(nameKey)) return;
      used.add(card.id);
      usedStarterNames.add(nameKey);
      resolvedStarters.push(card);
    });

    while (resolvedStarters.length < 11) {
      const fallback =
        ownedPlayers.find(
          (p) => !used.has(p.id) && !usedStarterNames.has(getCanonicalPlayerNameKey(p))
        ) ||
        ownedPlayers.find((p) => !used.has(p.id)) ||
        totyFeaturedPlayers[0];
      used.add(fallback.id);
      usedStarterNames.add(getCanonicalPlayerNameKey(fallback));
      resolvedStarters.push(fallback);
    }

    const benchIds = user.benchIds?.length ? user.benchIds : STARTER_BENCH_IDS;
    const resolvedBench: PlayerCard[] = [];
    benchIds.forEach((id) => {
      const card = playerById.get(id);
      if (card && !used.has(card.id)) {
        used.add(card.id);
        resolvedBench.push(card);
      }
    });

    while (resolvedBench.length < 7) {
      const fallback = ownedPlayers.find((p) => !used.has(p.id));
      if (!fallback) break;
      used.add(fallback.id);
      resolvedBench.push(fallback);
    }

    return { starters: resolvedStarters, bench: resolvedBench };
  }, [user.starterIds, user.benchIds, ownedPlayers, playerById]);

  const { iconsChroniclesReady, ownedClassicsCount } = useMemo(() => {
    const starterIdSet = new Set(starters.map((p) => p.id));
    const classicsIdSet = new Set(classicsIconsPlayers.map((p) => p.id));
    const eligibleReserveCount = ownedPlayers.filter(
      (p) =>
        !starterIdSet.has(p.id) &&
        p.id !== 'box_sig_van_der_sar_105' &&
        p.id !== 'box_ginga_garrincha_106' &&
        !p.isUntradeableOnly &&
        !classicsIdSet.has(p.id) &&
        p.ovr >= 90
    ).length;
    const ownedClassics = ownedPlayers.filter((p) => classicsIdSet.has(p.id)).length;
    return {
      iconsChroniclesReady: eligibleReserveCount >= 6,
      ownedClassicsCount: ownedClassics,
    };
  }, [ownedPlayers, starters]);

  const activeFormation = useMemo(() => {
    return (
      availableFormations.find((f) => f.id === user.activeFormationId) || availableFormations[0]
    );
  }, [user.activeFormationId]);

  const homePresencePayload = useMemo(() => {
    const mapSlotHoriz = (slot: FormationSlot, isGk: boolean) => {
      if (isGk || slot.pos === 'GK') return { x: 7, y: 50 };
      const hx = Math.max(18, Math.min(78, 18 + ((90 - slot.y) / 72) * 58));
      const hy = Math.max(12, Math.min(88, slot.x));
      return { x: hx, y: hy };
    };
    const trainingBonusOvr = Math.floor(
      Math.min(MAX_TRAINING_LEVEL, user.trainingLevel ?? 0) / 5
    );
    return {
      clientId: user.deviceId || user.username,
      username: user.username,
      teamName: user.teamName,
      teamLogo: user.teamLogo,
      ovr: user.ovr,
      tierIndex: currentRankInfo.tierIndex,
      rankLabel: currentRankInfo.fullLabel,
      rankLogoUrl: currentRankInfo.logoUrl,
      matchesPlayed:
        (user.careerMatchesPlayed ?? 0) +
        normalizedRanked.wins +
        normalizedRanked.draws +
        normalizedRanked.losses,
      formationName: activeFormation.name,
      starters: starters.slice(0, 11).map((p, idx) => {
        const slot = activeFormation.slots[idx] || activeFormation.slots[0];
        const isGk = idx === 10 || slot.pos === 'GK';
        const coords = mapSlotHoriz(slot, isGk);
        const effOvr = Math.max(40, p.ovr + trainingBonusOvr + getPositionPenalty(p.position, slot.pos));
        return {
          id: p.id,
          name: p.name,
          shortName: p.name.split(' ').pop() || p.name,
          pos: slot.pos,
          ovr: effOvr,
          baseX: coords.x,
          baseY: coords.y,
          isGk,
        };
      }),
    };
  }, [
    user.deviceId,
    user.username,
    user.teamName,
    user.teamLogo,
    user.ovr,
    user.trainingLevel,
    user.careerMatchesPlayed,
    normalizedRanked.wins,
    normalizedRanked.draws,
    normalizedRanked.losses,
    currentRankInfo.tierIndex,
    currentRankInfo.fullLabel,
    currentRankInfo.logoUrl,
    activeFormation,
    starters,
  ]);

  const homePresencePayloadRef = useRef(homePresencePayload);
  useEffect(() => {
    homePresencePayloadRef.current = homePresencePayload;
    if (
      homeRankedWsRef.current &&
      homeRankedWsRef.current.readyState === WebSocket.OPEN &&
      !showRanked
    ) {
      homeRankedWsRef.current.send(
        JSON.stringify({
          type: 'presence:hello',
          profile: homePresencePayload,
        })
      );
    }
  }, [homePresencePayload, showRanked]);

  // Background presence WebSocket while outside RankedModeModal so Ranked invitations pop up anywhere!
  useEffect(() => {
    if (showRanked) {
      if (homeRankedWsRef.current) {
        try {
          homeRankedWsRef.current.close();
        } catch {
          // ignore
        }
        homeRankedWsRef.current = null;
      }
      return;
    }

    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let consecutiveFailures = 0;

    const connectIdlePresence = () => {
      if (closed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/ranked`;
      try {
        const ws = new WebSocket(wsUrl);
        homeRankedWsRef.current = ws;

        ws.onopen = () => {
          consecutiveFailures = 0;
          if (closed) {
            ws.close();
            return;
          }
          ws.send(
            JSON.stringify({
              type: 'presence:hello',
              profile: homePresencePayloadRef.current,
            })
          );
        };

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(String(ev.data));
            if (!data || typeof data.type !== 'string') return;

            if (data.type === 'invite:received' && data.fromProfile) {
              soundService.playTrophy();
              setIncomingRankedInvite({
                inviteId: String(data.inviteId || `inv_${Date.now()}`),
                fromConnId: String(data.fromConnId || ''),
                reason: data.reason === 'queue' ? 'queue' : 'direct',
                createdAt: Number(data.createdAt) || Date.now(),
                fromProfile: {
                  username: data.fromProfile.username || 'HLV Online',
                  teamName: data.fromProfile.teamName || 'Online FC',
                  teamLogo: data.fromProfile.teamLogo || RANKED_ASSETS.amateur[0],
                  ovr: Number(data.fromProfile.ovr) || 85,
                  rankLabel: data.fromProfile.rankLabel || 'Đấu Hạng Online',
                  rankLogoUrl: data.fromProfile.rankLogoUrl || RANKED_ASSETS.amateur[0],
                },
              });
              return;
            }

            if (data.type === 'invite:cancelled' && typeof data.fromConnId === 'string') {
              setIncomingRankedInvite((cur) =>
                cur && cur.fromConnId === data.fromConnId ? null : cur
              );
              return;
            }

            if (data.type === 'friends:request_received') {
              soundService.playTrophy();
              setFriendsSyncRev((r) => r + 1);
              const sender = data.from?.username || 'Một HLV';
              setToastMessage(`Lời mời kết bạn mới từ HLV ${sender}!`);
              setTimeout(() => setToastMessage(null), 3200);
              return;
            }

            if (data.type === 'friends:updated') {
              setFriendsSyncRev((r) => r + 1);
              return;
            }

            if (data.type === 'friends:message_received') {
              setFriendsSyncRev((r) => r + 1);
              if (data.message?.fromUsername) {
                setToastMessage(
                  `Tin nhắn mới từ bạn bè HLV ${data.message.fromUsername}: "${String(
                    data.message.text || ''
                  ).slice(0, 42)}"`
                );
                setTimeout(() => setToastMessage(null), 3200);
              }
              return;
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          consecutiveFailures += 1;
          if (!closed && consecutiveFailures < 2) {
            retryTimer = setTimeout(connectIdlePresence, 3000);
          }
        };
      } catch {
        // ignore
      }
    };

    connectIdlePresence();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (homeRankedWsRef.current) {
        try {
          homeRankedWsRef.current.close();
        } catch {
          // ignore
        }
        homeRankedWsRef.current = null;
      }
    };
  }, [showRanked]);

  // Sync persistent Friends badge count with backend directory
  useEffect(() => {
    let cancelled = false;
    fetch('/api/friends/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: homePresencePayloadRef.current }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok && Array.isArray(data.incomingRequests)) {
          setIncomingFriendReqCount(data.incomingRequests.length);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [friendsSyncRev, user.username, user.teamName, user.ovr]);

  const handleChallengeFriend = (targetConnId: string, friendUsername: string) => {
    soundService.playClick();
    setShowFriends(false);
    setPendingDirectInviteTarget({ connId: targetConnId, username: friendUsername });
    setShowRanked(true);
  };

  const handleAcceptGlobalRankedInvite = (invite: RankedIncomingInvite) => {
    soundService.playClick();
    setIncomingRankedInvite(null);
    setPendingRankedInviteToAccept(invite);
    setShowGingaEvent(false);
    setShowShop(false);
    setShowMyTeam(false);
    setShowCareer(false);
    setShowTransferMarket(false);
    setShowComplexHub(false);
    setShowAlbum(false);
    setShowMailbox(false);
    setShowQuests(false);
    setShowFriends(false);
    setShowSettings(false);
    setShowProfileEdit(false);
    setShowStarPass(false);
    setShowIconsModal(false);
    setShowRanked(true);
  };

  const handleDeclineGlobalRankedInvite = (invite: RankedIncomingInvite) => {
    soundService.playClick();
    setIncomingRankedInvite(null);
    if (homeRankedWsRef.current && homeRankedWsRef.current.readyState === WebSocket.OPEN) {
      homeRankedWsRef.current.send(
        JSON.stringify({
          type: 'invite:decline',
          inviteId: invite.inviteId,
          fromConnId: invite.fromConnId,
          byUsername: user.username,
        })
      );
    }
  };

  // Sound & BGM Volume state
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [bgmVolume, setBgmVolume] = useState<number>(Math.round(soundService.getBgmVolume() * 100));
  const [showVolumePopover, setShowVolumePopover] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    soundService.startBgm();
    const unsub = soundService.subscribe(() => {
      setIsMuted(soundService.getMuted());
      setBgmVolume(Math.round(soundService.getBgmVolume() * 100));
    });
    return () => {
      unsub();
      soundService.stopBgm();
    };
  }, []);

  // Pause BGM during pack opening and resume right after
  useEffect(() => {
    if (showPackOpening) {
      soundService.pauseBgmForPack();
    } else {
      soundService.resumeBgmAfterPack();
    }
  }, [showPackOpening]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleToggleSound = () => {
    const nextMuted = soundService.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleHeaderVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBgmVolume(val);
    soundService.setBgmVolume(val / 100);
  };

  const handleNextHeroPlayer = () => {
    soundService.playClick();
    setHeroPlayerIndex((prev) => (prev + 1) % gingaHeroShowcase.length);
  };

  const handleClaimMail = (mailId: string) => {
    if (claimedMailLockRef.current.has(mailId) || (user.claimedMailIds ?? []).includes(mailId)) {
      showToast('Tin nhắn này đã được sử dụng (chỉ được nhận 1 lần duy nhất)!');
      return;
    }

    const mail = mailList.find((m) => m.id === mailId);
    if (!mail || mail.claimed) {
      showToast('Tin nhắn này đã được sử dụng (1/1)!');
      return;
    }

    const rewardPlayerId = mail.rewards.playerId;
    const rewardPlayer = rewardPlayerId
      ? totyFeaturedPlayers.find((p) => p.id === rewardPlayerId)
      : undefined;

    const currentToday = getTodayDateKey();
    if (!rewardPlayerId && user.lastMailboxClaimDate === currentToday) {
      showToast('Hộp tin chỉ được nhận 1 lần mỗi ngày! Vui lòng quay lại vào ngày mai.');
      return;
    }

    claimedMailLockRef.current.add(mailId);

    const coinsToAdd = mail.rewards.coins || 0;
    const gemsToAdd = mail.rewards.gems || 0;
    const fcPointsToAdd = mail.rewards.fcPoints || 0;
    const ticketsToAdd = mail.rewards.tickets || 0;

    onUpdateUser((prev) => {
      if (
        (prev.claimedMailIds ?? []).includes(mailId) ||
        (!rewardPlayerId && prev.lastMailboxClaimDate === currentToday)
      ) {
        return {};
      }
      const nextClaimedIds = Array.from(new Set([...(prev.claimedMailIds ?? []), mailId]));
      const curOwned = prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS;
      const nextOwned = rewardPlayerId
        ? addOwnedPlayerCopies(curOwned, [rewardPlayerId])
        : curOwned;
      return {
        coins: prev.coins + coinsToAdd,
        gems: prev.gems + gemsToAdd,
        fcPoints: prev.fcPoints + fcPointsToAdd,
        tickets: (prev.tickets ?? 0) + ticketsToAdd,
        ownedPlayerIds: nextOwned,
        lastMailboxClaimDate: rewardPlayerId ? prev.lastMailboxClaimDate : currentToday,
        claimedMailIds: nextClaimedIds,
      };
    });

    if (rewardPlayer) {
      setShowMailbox(false);
      soundService.playPackTear();
      setFixedWalkoutModal({
        player: rewardPlayer,
        title: 'MỪNG KỶ NIỆM RONALDINHO TRỞ LẠI · 97 OVR',
      });
      showToast(`Đã nhận quà đặc biệt: ${rewardPlayer.name} ${rewardPlayer.ovr} OVR!`);
      return;
    }

    showToast(
      `Đã nhận quà Hộp Tin (1/1): +${coinsToAdd.toLocaleString('vi-VN')} Xu${
        gemsToAdd ? `, +${gemsToAdd} Gems` : ''
      }${ticketsToAdd ? `, +${ticketsToAdd} Vé Quay` : ''}!`
    );
  };

  const handleClaimQuest = (questId: string) => {
    if (
      claimedQuestLockRef.current.has(questId) ||
      (user.claimedQuestIds ?? []).includes(questId)
    ) {
      showToast('Nhiệm vụ này đã được nhận thưởng (chỉ được sử dụng 1 lần)!');
      return;
    }

    const q = quests.find((item) => item.id === questId);
    if (!q || q.claimed || !q.completed) return;

    claimedQuestLockRef.current.add(questId);

    const nextQuests = quests.map((item) =>
      item.id === questId ? { ...item, completed: true, claimed: true } : item
    );
    onUpdateQuests(nextQuests);

    onUpdateUser((prev) => {
      if ((prev.claimedQuestIds ?? []).includes(questId)) return {};
      const nextClaimedQuestIds = Array.from(
        new Set([...(prev.claimedQuestIds ?? []), questId])
      );
      return {
        coins: q.reward.type === 'coins' ? prev.coins + q.reward.amount : prev.coins,
        gems: q.reward.type === 'gems' ? prev.gems + q.reward.amount : prev.gems,
        claimedQuestIds: nextClaimedQuestIds,
        savedQuests: nextQuests,
      };
    });

    showToast('Đã nhận thưởng nhiệm vụ hàng ngày (1/1)!');
  };

  const handleClaimCalendarToday = () => {
    const now = new Date();
    const midnightKey = getDaily6AMCycleKey(now);
    setTodayMidnightKey(midnightKey);

    if (
      claimedCalendarLockRef.current.has(midnightKey) ||
      (user.calendarClaimedDates ?? []).includes(midnightKey)
    ) {
      showToast(
        t(
          'Bạn đã nhận quà Lịch hôm nay rồi! Vui lòng chờ đến 06:00 sáng để nhận ngày tiếp theo.',
          'You already claimed today’s Calendar reward! Wait until 06:00 AM for the next day.'
        )
      );
      return;
    }

    claimedCalendarLockRef.current.add(midnightKey);
    const reward = getCalendarRewardForDate(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    onUpdateUser((prev) => {
      if ((prev.calendarClaimedDates ?? []).includes(midnightKey)) return {};
      const nextClaimedDates = Array.from(
        new Set([...(prev.calendarClaimedDates ?? []), midnightKey])
      );
      return {
        gems: reward.type === 'gems' ? prev.gems + reward.amount : prev.gems,
        coins: reward.type === 'coins' ? prev.coins + reward.amount : prev.coins,
        tickets:
          reward.type === 'tickets'
            ? (prev.tickets ?? 0) + reward.amount
            : prev.tickets,
        unlockTickets: (prev.unlockTickets ?? 0) + (reward.bonusUnlockTickets ?? 0),
        calendarClaimedDates: nextClaimedDates,
      };
    });

    showToast(
      t(
        `Đã mở Quà Lịch Hôm Nay: +${reward.labelVi}${
          reward.bonusUnlockTickets ? ` & +${reward.bonusUnlockTickets} Vé Mở Khóa CONMEBOL!` : '!'
        }`,
        `Claimed Today’s Calendar Gift: +${reward.labelEn}!`
      )
    );
  };

  const handleClaimCalendarUnlockTicket = () => {
    if (user.calendarUnlockTicketClaimed) {
      showToast('Bạn đã nhận Vé Mở Khóa CONMEBOL Libertadores từ Lịch rồi!');
      return;
    }
    soundService.playTrophy();
    onUpdateUser((prev) => {
      if (prev.calendarUnlockTicketClaimed) return {};
      return {
        unlockTickets: (prev.unlockTickets ?? 0) + 1,
        calendarUnlockTicketClaimed: true,
      };
    });
    showToast('Đã nhận Quà Lịch Đặc Biệt: +1 Vé Mở Khóa CONMEBOL Libertadores!');
  };

  const advanceQuestProgress = (questId: string, delta: number) => {
    onUpdateQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.id !== questId || q.claimed) return q;
        const nextProgress = Math.min(q.maxProgress, q.progress + delta);
        return {
          ...q,
          progress: nextProgress,
          completed: nextProgress >= q.maxProgress,
        };
      })
    );
  };

  // Open single (1) or 10 ticket spin (prioritizes Vé Future Stars when spinning Future Stars)
  const handleSpinWithTicket = (count: 1 | 10, rawTheme: TicketSpinTheme = ticketSpinTheme) => {
    soundService.playClick();
    const theme: TicketSpinTheme =
      rawTheme === 'UTOTY' || rawTheme === 'TOTY' || rawTheme === 'FUTURE_STARS'
        ? 'GINGA'
        : rawTheme;
    const currentTickets = user.tickets ?? 0;

    const prevOpened = user.ticketsOpenedCount ?? 0;

    if (theme === 'LIBERTADORES') {
      const curLib = user.libertadoresTickets ?? user.tickets ?? 0;
      if (curLib < count) {
        soundService.playTrophy();
        showToast(`Không đủ Vé Quay Libertadores! Cần ${count} vé, hiện có ${curLib} vé.`);
        return;
      }
      setSpinCountBeforeBatch(prevOpened);
      onUpdateUser({
        libertadoresTickets: Math.max(0, (user.libertadoresTickets ?? 0) - count),
        tickets: user.libertadoresTickets !== undefined ? user.tickets : Math.max(0, (user.tickets ?? 0) - count),
        ticketsOpenedCount: prevOpened + count,
      });
    } else {
      if (currentTickets < count) {
        soundService.playTrophy();
        showToast(
          `Không đủ Vé Quay! Cần ${count} vé, bạn đang có ${currentTickets} vé. Hãy mua thêm trong Cửa Hàng hoặc đá Sự Nghiệp!`
        );
        setShowShop(true);
        return;
      }

      setSpinCountBeforeBatch(prevOpened);
      onUpdateUser((prev) => ({
        tickets: (prev.tickets ?? 0) - count,
        ticketsOpenedCount: (prev.ticketsOpenedCount ?? 0) + count,
      }));
    }

    advanceQuestProgress('q2', count);
    setSpinCount(count);
    setIsTicketSpinMode(true);
    setSelectedPackTheme(theme);
    setSelectedPackTier('A');
    setSelectedPackCustomName(undefined);
    setShowPackOpening(true);
  };

  const handleUseTicketInModal = (count: number): boolean => {
    const currentTickets = user.tickets ?? 0;
    const currentFsTickets = user.futureStarsTickets ?? 0;

    if (selectedPackTheme === 'LIBERTADORES') {
      const curLib = user.libertadoresTickets ?? currentTickets;
      if (curLib < count) {
        showToast(`Bạn không đủ ${count} Vé Quay Libertadores! Hãy mua thêm tại Cửa Hàng.`);
        setShowShop(true);
        return false;
      }
      onUpdateUser((prev) => ({
        libertadoresTickets:
          prev.libertadoresTickets !== undefined
            ? Math.max(0, prev.libertadoresTickets - count)
            : prev.libertadoresTickets,
        tickets:
          prev.libertadoresTickets !== undefined
            ? prev.tickets
            : Math.max(0, (prev.tickets ?? 0) - count),
        ticketsOpenedCount: (prev.ticketsOpenedCount ?? 0) + count,
      }));
      advanceQuestProgress('q2', count);
      return true;
    }

    if (selectedPackTheme === 'FUTURE_STARS') {
      const totalAvailable = currentFsTickets + currentTickets;
      if (totalAvailable < count) {
        showToast(`Bạn không đủ ${count} Vé Future Stars! Hãy chơi Sự Kiện Future Stars hoặc mua thêm tại Cửa Hàng.`);
        setShowShop(true);
        return false;
      }
      const deductFs = Math.min(currentFsTickets, count);
      const deductNormal = count - deductFs;
      onUpdateUser({
        futureStarsTickets: currentFsTickets - deductFs,
        tickets: currentTickets - deductNormal,
        ticketsOpenedCount: (user.ticketsOpenedCount ?? 0) + count,
      });
      advanceQuestProgress('q2', count);
      return true;
    }

    if (currentTickets < count) {
      showToast(`Bạn không đủ ${count} Vé Quay! Hãy mua thêm tại Cửa Hàng.`);
      setShowShop(true);
      return false;
    }
    onUpdateUser((prev) => ({
      tickets: (prev.tickets ?? 0) - count,
      ticketsOpenedCount: (prev.ticketsOpenedCount ?? 0) + count,
    }));
    advanceQuestProgress('q2', count);
    return true;
  };

  const handleOpenPackTierFromShop = (tier: PackTier, customName?: string) => {
    setSelectedPackTheme(
      tier === 'BUNDESLIGA_88_PLUS'
        ? 'BUNDESLIGA'
        : tier === 'FUTURE_STARS_90_95'
        ? 'FUTURE_STARS'
        : tier.startsWith('GINGA')
        ? 'GINGA'
        : 'UTOTY'
    );
    setSelectedPackTier(tier);
    setSelectedPackCustomName(customName);
    setIsTicketSpinMode(false);
    setSpinCount(1);
    setShowPackOpening(true);
  };

  const handlePlayerClaimedFromPack = (
    newPlayer: PlayerCard,
    resources: { coins: number; gems: number; tokens: number }
  ) => {
    onUpdateUser((prev) => {
      const curOwned = prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS;
      const nextOwned = addOwnedPlayerCopies(curOwned, [newPlayer.id]);
      const nextTradeable = new Set(prev.tradeablePlayerIds ?? []);
      if (newPlayer.isTradeable === true) {
        nextTradeable.add(newPlayer.id);
      }
      return {
        ownedPlayerIds: nextOwned,
        tradeablePlayerIds: Array.from(nextTradeable),
        coins: prev.coins + resources.coins,
      };
    });
    const tradeLabel = newPlayer.isTradeable ? ' [GIAO DỊCH ĐƯỢC]' : ' [KHÔNG GIAO DỊCH]';
    showToast(
      resources.coins > 0
        ? `Đã chiêu mộ ${newPlayer.name} (OVR ${newPlayer.ovr})${tradeLabel} & +${resources.coins.toLocaleString('vi-VN')} Xu!`
        : `Đã chiêu mộ ${newPlayer.name} (OVR ${newPlayer.ovr})${tradeLabel}!`
    );
  };

  const handleMultiplePlayersClaimed = (
    players: PlayerCard[],
    resources: { coins: number; gems: number; tokens: number }
  ) => {
    onUpdateUser((prev) => {
      const curOwned = prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS;
      const nextOwned = addOwnedPlayerCopies(
        curOwned,
        players.map((p) => p.id)
      );
      const nextTradeable = new Set(prev.tradeablePlayerIds ?? []);
      players.forEach((p) => {
        if (p.isTradeable === true) {
          nextTradeable.add(p.id);
        }
      });
      return {
        ownedPlayerIds: nextOwned,
        tradeablePlayerIds: Array.from(nextTradeable),
        coins: prev.coins + resources.coins,
      };
    });
    const tradeableCount = players.filter((p) => p.isTradeable).length;
    showToast(
      players.length >= 10
        ? `Đã nhận ${players.length} cầu thủ (${tradeableCount} thẻ giao dịch được) & +${resources.coins.toLocaleString('vi-VN')} Xu!`
        : `Đã nhận ${players.length} cầu thủ (${players.map((p) => `${p.name} ${p.ovr}`).join(' & ')}) +${resources.coins.toLocaleString('vi-VN')} Xu!`
    );
  };

  const handleSaveSquad = (
    nextStarters: PlayerCard[],
    nextBench: PlayerCard[],
    nextFormationId: string,
    newTeamOvr: number
  ) => {
    onUpdateUser({
      starterIds: nextStarters.map((p) => p.id),
      benchIds: nextBench.map((p) => p.id),
      activeFormationId: nextFormationId,
      ovr: newTeamOvr,
    });
    advanceQuestProgress('q4', 1);
  };

  const handleUpgradeTraining = (
    nextTrainingLevel: number,
    coinCost: number,
    newTeamOvr: number
  ) => {
    const clampedLevel = Math.min(MAX_TRAINING_LEVEL, Math.max(0, nextTrainingLevel));
    onUpdateUser({
      coins: Math.max(0, user.coins - coinCost),
      trainingLevel: clampedLevel,
      ovr: newTeamOvr,
    });
  };

  const handleClaimCareerRewards = (rewards: {
    coins: number;
    gems: number;
    goalsScored: number;
    bundesligaGoalsScored?: number;
    playedMatch: boolean;
    matchResult?: 'W' | 'D' | 'L';
    starPointsEarned?: number;
  }) => {
    const cycleKey = getDaily6AMCycleKey();
    const previewGinga = normalizeGingaState(user.gingaState, cycleKey);
    const gingaMatchBonus =
      rewards.playedMatch && previewGinga.matchesPlayedToday < 5
        ? rewards.matchResult === 'W'
          ? 200
          : rewards.matchResult === 'D'
          ? 100
          : 50
        : 0;

    onUpdateUser((prev) => {
      const curCycleKey = getDaily6AMCycleKey();
      const curLib = normalizeLibertadoresState(prev.libertadoresState, curCycleKey);
      const curGinga = normalizeGingaState(prev.gingaState, curCycleKey);
      const curBundesliga = normalizeBundesligaState(prev.bundesligaState, curCycleKey);
      const curSp = normalizeStarPassState(prev.starPass);
      const canCreditGinga = rewards.playedMatch && curGinga.matchesPlayedToday < 5;
      const earnedGingaTokens = canCreditGinga
        ? rewards.matchResult === 'W'
          ? 200
          : rewards.matchResult === 'D'
          ? 100
          : 50
        : 0;
      const blGoalsAdd = Math.max(0, rewards.bundesligaGoalsScored ?? 0);

      return {
        coins: prev.coins + rewards.coins,
        gems: prev.gems + rewards.gems,
        gingaTokens: (prev.gingaTokens ?? 0) + earnedGingaTokens,
        careerMatchesPlayed: (prev.careerMatchesPlayed ?? 0) + (rewards.playedMatch ? 1 : 0),
        level: rewards.playedMatch ? prev.level + (Math.random() < 0.35 ? 1 : 0) : prev.level,
        starPass: rewards.starPointsEarned
          ? {
              ...curSp,
              points: curSp.points + rewards.starPointsEarned,
            }
          : curSp,
        libertadoresState: rewards.playedMatch
          ? {
              ...curLib,
              dailyCareerMatches: curLib.dailyCareerMatches + 1,
            }
          : curLib,
        gingaState: canCreditGinga
          ? {
              ...curGinga,
              matchesPlayedToday: curGinga.matchesPlayedToday + 1,
            }
          : curGinga,
        bundesligaState:
          blGoalsAdd > 0
            ? {
                ...curBundesliga,
                goalsScoredToday: curBundesliga.goalsScoredToday + blGoalsAdd,
              }
            : curBundesliga,
      };
    });

    if (rewards.playedMatch) {
      onUpdateQuests((prevQuests) =>
        prevQuests.map((q) => {
          if (q.id === 'q3' && !q.claimed) {
            const p = Math.min(q.maxProgress, q.progress + 1);
            return { ...q, progress: p, completed: p >= q.maxProgress };
          }
          if (q.id === 'q5' && !q.claimed && rewards.goalsScored > 0) {
            const p = Math.min(q.maxProgress, q.progress + rewards.goalsScored);
            return { ...q, progress: p, completed: p >= q.maxProgress };
          }
          return q;
        })
      );
    }

    const gingaLabel = gingaMatchBonus > 0 ? `, +${gingaMatchBonus} Token Ginga` : '';
    showToast(
      `Thưởng Sự Nghiệp: +${rewards.coins.toLocaleString('vi-VN')} Xu, +${rewards.gems} Gems${gingaLabel}!`
    );
  };

  const handleClaimDailyBonus = () => {
    if (dailyClaimLockRef.current || user.dailyCheckInClaimed) {
      showToast('Điểm danh hằng ngày chỉ được sử dụng 1 lần duy nhất!');
      return;
    }
    dailyClaimLockRef.current = true;
    soundService.playCoins();
    onUpdateUser((prev) => {
      if (prev.dailyCheckInClaimed) return {};
      return {
        coins: prev.coins + 50000,
        gems: prev.gems + 150,
        tickets: (prev.tickets ?? 0) + 1,
        dailyCheckInClaimed: true,
      };
    });
    showToast('Điểm danh hàng ngày (1/1): +50,000 Xu, +150 Kim Cương & +1 Vé Quay!');
  };

  const handleCompleteClubMatch = (entry: ClubKeyMatchHistoryEntry) => {
    const cycleKey = getDaily6AMCycleKey();
    onUpdateUser((prev) => {
      const curClub = normalizeClubDaily(prev.clubDaily, cycleKey);
      if (curClub.matchesPlayed >= DAILY_MAX_CLUB_MATCHES) {
        return {};
      }
      return {
        clubTokens: (prev.clubTokens ?? 0) + entry.tokensEarned,
        coins: prev.coins + entry.coinsEarned,
        clubDaily: {
          cycleKey,
          matchesPlayed: curClub.matchesPlayed + 1,
          history: [entry, ...curClub.history].slice(0, 6),
        },
      };
    });

    onUpdateQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.id === 'q3' && !q.claimed) {
          const p = Math.min(q.maxProgress, q.progress + 1);
          return { ...q, progress: p, completed: p >= q.maxProgress };
        }
        if (q.id === 'q5' && !q.claimed && entry.userGoals > 0) {
          const p = Math.min(q.maxProgress, q.progress + entry.userGoals);
          return { ...q, progress: p, completed: p >= q.maxProgress };
        }
        return q;
      })
    );

    showToast(
      `Câu Lạc Bộ (${entry.userGoals}-${entry.oppGoals} vs ${entry.opponentName}): +${entry.tokensEarned} Token CLB & +${entry.coinsEarned.toLocaleString('vi-VN')} Xu!`
    );
  };

  const handleExchangeClubReward = (
    kind:
      | 'ticket_1'
      | 'ticket_5'
      | 'thuram_102'
      | 'suker_101'
      | 'kane_104'
      | 'mbappe_103'
      | 'yamal_102'
      | 'messi_102'
      | 'rodri_102'
  ) => {
    const currentTokens = user.clubTokens ?? 0;
    if (kind === 'ticket_1' || kind === 'ticket_5') {
      const ticketDelta = kind === 'ticket_5' ? 5 : 1;
      const cost = kind === 'ticket_5' ? 250 : 50;
      if (currentTokens < cost) {
        soundService.playClick();
        showToast(
          `Không đủ Token CLB! Cần ${cost.toLocaleString('vi-VN')} Token CLB (Hiện có ${currentTokens.toLocaleString('vi-VN')}).`
        );
        return;
      }
      soundService.playCoins();
      onUpdateUser((prev) => {
        if ((prev.clubTokens ?? 0) < cost) return {};
        return {
          clubTokens: (prev.clubTokens ?? 0) - cost,
          tickets: (prev.tickets ?? 0) + ticketDelta,
        };
      });
      showToast(
        `Đổi thành công +${ticketDelta} Vé Quay với ${cost.toLocaleString('vi-VN')} Token CLB!`
      );
      return;
    }

    const rewardMap = {
      thuram_102: {
        id: 'toty26_hm_thuram_102',
        cost: 5000,
        label: 'TOTY HM Lilian Thuram (102 OVR · RB)',
      },
      suker_101: {
        id: 'toty26_hm_suker_101',
        cost: 3000,
        label: 'TOTY HM Davor Šuker (101 OVR · ST)',
      },
      yamal_102: {
        id: 'ballon_dor_yamal_102',
        cost: 5000,
        label: "Ballon d'Or Lamine Yamal (102 OVR · RW)",
      },
      messi_102: {
        id: 'ballon_dor_messi_102',
        cost: 5000,
        label: "Ballon d'Or Lionel Messi (102 OVR · RW)",
      },
      rodri_102: {
        id: 'ballon_dor_rodri_102',
        cost: 5000,
        label: "Ballon d'Or Rodri (102 OVR · CDM)",
      },
      mbappe_103: {
        id: 'ballon_dor_mbappe_103',
        cost: 7000,
        label: "Ballon d'Or Kylian Mbappé (103 OVR · ST)",
      },
      kane_104: {
        id: 'ballon_dor_kane_104',
        cost: 10000,
        label: "Ballon d'Or Harry Kane (104 OVR · ST)",
      },
    } as const;

    const { id: targetPlayerId, cost, label: playerLabel } = rewardMap[kind];

    const ownedSet = new Set(
      user.ownedPlayerIds?.length ? user.ownedPlayerIds : STARTER_OWNED_IDS
    );
    if (ownedSet.has(targetPlayerId)) {
      soundService.playClick();
      showToast(`Bạn đã sở hữu ${playerLabel} trong Đội Hình!`);
      return;
    }
    if (currentTokens < cost) {
      soundService.playClick();
      showToast(
        `Không đủ Token CLB! Cần ${cost.toLocaleString('vi-VN')} Token CLB để đổi ${playerLabel}.`
      );
      return;
    }

    soundService.playPackOpenFanfare();
    onUpdateUser((prev) => {
      if ((prev.clubTokens ?? 0) < cost) return {};
      const nextOwned = new Set(
        prev.ownedPlayerIds?.length ? prev.ownedPlayerIds : STARTER_OWNED_IDS
      );
      if (nextOwned.has(targetPlayerId)) return {};
      nextOwned.add(targetPlayerId);
      return {
        clubTokens: (prev.clubTokens ?? 0) - cost,
        ownedPlayerIds: Array.from(nextOwned),
      };
    });
    showToast(`Chiêu mộ thành công ${playerLabel} vào Đội Hình!`);
  };

  const todayKey = getTodayDateKey();
  const claimedMailboxToday = user.lastMailboxClaimDate === todayKey;
  const unreadMailCount = mailList.filter((m) => !m.claimed).length;
  const availableMailboxClaimsToday = claimedMailboxToday ? 0 : Math.min(1, unreadMailCount);
  const readyQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;
  const calendarClaimedToday = (user.calendarClaimedDates ?? []).includes(todayMidnightKey);
  const calendarUnlockGiftPending = !user.calendarUnlockTicketClaimed;
  const totalQuestsBadgeCount =
    readyQuestsCount + (calendarClaimedToday ? 0 : 1) + (calendarUnlockGiftPending ? 1 : 0);

  const totyReadyCount = useMemo(() => {
    const claimed = new Set(user.totyClaimedIds ?? []);
    const matches = user.careerMatchesPlayed ?? 0;
    const tOpened = user.ticketsOpenedCount ?? 0;
    const inv = normalizeCraftInventory(user.craftInventory);
    const hasLeague = Object.values(inv.leagues).some((c) => c > 0);
    const hasPos = Object.values(inv.positions).some((c) => c > 0);
    const streak = normalizeTotyDailyStreak(user.totyDailyStreak);

    let count = 0;
    if (streak.claimedDays < 7 && streak.lastClaimCycleKey !== todayKey) count += 1;
    if (matches >= 10 && !claimed.has('welcome_10_matches_90_95')) count += 1;
    if (matches >= 5 && !claimed.has('reward_play_5')) count += 1;
    if (matches >= 15 && !claimed.has('reward_play_15')) count += 1;
    if (tOpened >= 10 && !claimed.has('reward_tickets_10')) count += 1;
    if (user.ovr >= 80 && !claimed.has('reward_ovr_80')) count += 1;
    if (user.pendingCraft || (hasLeague && hasPos)) count += 1;
    if (user.lastMinigameTicketDate !== todayKey || (user.minigameTickets ?? 0) > 0) count += 1;
    const fsCycle = getFutureStarsCycleKey();
    if (user.futureStarsDaily?.cycleKey !== fsCycle || !user.futureStarsDaily?.rewardClaimed) {
      count += 1;
    }
    return count;
  }, [
    user.totyDailyStreak,
    user.totyClaimedIds,
    user.careerMatchesPlayed,
    user.ticketsOpenedCount,
    user.ovr,
    user.craftInventory,
    user.pendingCraft,
    user.lastMinigameTicketDate,
    user.minigameTickets,
    user.futureStarsDaily,
    todayKey,
  ]);

  const gingaReadyCount = useMemo(() => {
    const cycle = getDaily6AMCycleKey();
    const gs = normalizeGingaState(user.gingaState, cycle);
    const tokens = user.gingaTokens ?? 0;
    const dailyQuests = getDailyGingaQuests(cycle);
    const claimedQuests = gs.dailyQuestClaimedIds ?? [];
    const claimedMilestones = gs.claimedMilestones ?? [];
    let ready = 0;
    if ((gs.streakDaysClaimed ?? []).length < 7 && gs.lastStreakClaimDate !== cycle) ready += 1;
    dailyQuests.forEach((q) => {
      if (!claimedQuests.includes(q.id) && q.getProgress(user, gs.matchesPlayedToday ?? 0) >= q.target) {
        ready += 1;
      }
    });
    GINGA_MILESTONES.forEach((m) => {
      if (!claimedMilestones.includes(m.id) && tokens >= m.tokensRequired) {
        ready += 1;
      }
    });
    return ready;
  }, [user]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-black flex flex-col justify-between text-white font-cruyff">
      {/* Background Graphic: Animated Ginga 26 Carnival Stadium Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={GINGA_ASSETS.bg}
          alt="FC Mobile Ginga 26 Background"
          className="w-full h-full object-cover animate-ginga-drift"
        />
        <img
          src={GINGA_ASSETS.boxBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/70" />
      </div>

      {/* GLOBAL REAL-TIME RANKED MATCH INVITATION MESSAGE */}
      {!showRanked && incomingRankedInvite && (
        <div className="fixed top-16 right-4 sm:right-6 z-[95] w-[92vw] max-w-md rounded-none bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border-2 border-cyan-300 shadow-[0_14px_45px_rgba(34,211,238,0.5)] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/15 pb-2">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-cyan-300" />
              <span className="font-cruyff font-black text-xs uppercase tracking-wider text-cyan-300">
                TIN NHẮN LỜI MỜI ĐẤU XẾP HẠNG
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDeclineGlobalRankedInvite(incomingRankedInvite)}
              className="text-gray-400 hover:text-white cursor-pointer text-xs font-bold px-1.5"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={
                incomingRankedInvite.fromProfile.teamLogo ||
                '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'
              }
              alt={incomingRankedInvite.fromProfile.teamName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-contain rounded-none bg-white/10 p-1 border border-yellow-400/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-cruyff font-black text-base text-white uppercase truncate">
                HLV {incomingRankedInvite.fromProfile.username}
              </div>
              <div className="text-xs text-purple-200 truncate">
                {incomingRankedInvite.fromProfile.teamName} ·{' '}
                <strong className="text-yellow-300 font-mono">
                  OVR {incomingRankedInvite.fromProfile.ovr}
                </strong>{' '}
                · {incomingRankedInvite.fromProfile.rankLabel}
              </div>
              <p className="text-xs text-cyan-200 font-semibold mt-0.5">
                {incomingRankedInvite.reason === 'queue'
                  ? 'Đang muốn chơi Đấu Xếp Hạng cùng bạn ngay bây giờ!'
                  : 'Đã gửi cho bạn một lời mời thách đấu trong Đấu Xếp Hạng!'}
              </p>
            </div>
            <img
              src={incomingRankedInvite.fromProfile.rankLogoUrl || RANKED_ASSETS.amateur[0]}
              alt=""
              className="w-10 h-10 object-contain shrink-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleDeclineGlobalRankedInvite(incomingRankedInvite)}
              className="py-2 rounded-none bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-cruyff font-bold uppercase text-gray-200 cursor-pointer transition-colors"
            >
              Từ Chối
            </button>
            <button
              type="button"
              onClick={() => handleAcceptGlobalRankedInvite(incomingRankedInvite)}
              className="py-2 rounded-none bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 text-xs font-cruyff font-black uppercase tracking-wider cursor-pointer shadow-lg transition-transform active:scale-95"
            >
              Chấp Nhận Đấu Ngay
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-none bg-gradient-to-r from-yellow-500 to-amber-500 border border-yellow-200 text-black font-cruyff font-bold text-sm shadow-[0_0_30px_rgba(234,179,8,0.7)] flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER HUD (RAZOR-SHARP FRAMES + LOGO NEXT TO TEXT + FRIENDS NEXT TO QUESTS) */}
      <header className="relative z-20 flex flex-wrap items-center justify-between px-3 sm:px-5 py-2 bg-black/85 backdrop-blur-md border-b border-white/20 gap-2">
        {/* Left: User Logo & Profile Box */}
        <button
          type="button"
          onClick={() => {
            soundService.playOpenSection();
            setShowProfileEdit(true);
          }}
          title="Nhấn vào logo của tôi để cài đặt ảnh đại diện và tên"
          className="flex items-center gap-2.5 p-1 rounded-none bg-white/5 hover:bg-white/10 border border-white/20 hover:border-yellow-400 cursor-pointer transition-all active:scale-98 group text-left"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-none overflow-hidden border border-yellow-400/80 bg-zinc-900 flex items-center justify-center">
              <img
                src={user.teamLogo || '/assets/aistudio/logo_t_p_s__c_p_1_5beda3ca.png'}
                alt="Logo của tôi"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-none bg-yellow-400 text-black font-cruyff font-black text-[10px] leading-tight tabular-nums">
              {user.level}
            </span>
          </div>

          <div className="flex flex-col leading-tight pr-2">
            <div className="flex items-center gap-1.5">
              <span className="font-cruyff font-black text-sm text-white uppercase tracking-wide">
                {user.username}
              </span>
              <span className="px-1.5 py-0.2 rounded-none bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[9px] font-cruyff font-bold flex items-center gap-0.5">
                <Smartphone className="w-2.5 h-2.5" /> {user.deviceId || 'Thiết bị'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-cruyff text-gray-300">
              <span>{user.teamName}</span>
              <span className="text-yellow-400 font-bold tabular-nums"> · OVR {user.ovr}</span>
            </div>
          </div>
        </button>

        {/* Center: Currencies HUD */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* 1. Coins */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-zinc-950/95 border border-yellow-500/40 text-xs font-mono font-bold text-yellow-300">
            <img
              src="/assets/aistudio/currencysmall_COIN_ec777114.png"
              alt="Coins"
              className="w-4 h-4 object-contain"
            />
            <span>{user.coins.toLocaleString('vi-VN')}</span>
          </div>

          {/* 2. Gems */}
          <div
            onClick={() => {
              soundService.playOpenSection();
              setShowShop(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-zinc-950/95 border border-red-500/40 text-xs font-mono font-bold text-red-400 cursor-pointer hover:border-red-400 transition-colors"
            title="Kim Cương (Dùng mua gói, Star Pass 25.000 Gems và vé quay trong Cửa Hàng)"
          >
            <img
              src="/assets/aistudio/currencysmall_CASH_b2121428.png"
              alt="Diamond"
              className="w-4 h-4 object-contain"
            />
            <span>{user.gems.toLocaleString('vi-VN')}</span>
          </div>

          {/* 3. Token Ginga */}
          <div
            onClick={() => {
              soundService.playOpenEvent();
              setGingaInitialChapter('main');
              setShowGingaEvent(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-emerald-950/85 border border-emerald-400/55 hover:border-emerald-300 text-xs font-mono font-bold text-emerald-300 cursor-pointer transition-all tabular-nums"
            title="Token Ginga (Chạm để vào Sự Kiện Ginga)"
          >
            <img
              src={GINGA_ASSETS.pointIcon}
              alt="Token Ginga"
              className="w-4 h-4 object-contain"
            />
            <span>{(user.gingaTokens ?? 0).toLocaleString('vi-VN')} GINGA</span>
          </div>

          {/* 3b. Mảnh Ginga */}
          <div
            onClick={() => {
              soundService.playOpenEvent();
              setGingaInitialChapter('main');
              setShowGingaEvent(true);
            }}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-zinc-950/95 border border-amber-400/50 hover:border-yellow-300 text-xs font-mono font-bold text-amber-300 cursor-pointer transition-all tabular-nums"
            title="Mảnh Ginga (Đổi Mảnh tại Sự Kiện Ginga)"
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {(user.gingaShards ?? 0).toLocaleString(locale)} {t('MẢNH', 'SHARDS')}
            </span>
          </div>

          {/* 3c. Token Câu Lạc Bộ */}
          <div
            onClick={() => {
              soundService.playOpenSection();
              openMyTeamWithTab('club');
            }}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-cyan-950/90 border border-cyan-400/55 hover:border-cyan-300 text-xs font-mono font-bold text-cyan-200 cursor-pointer transition-all tabular-nums"
            title={t('Token Câu Lạc Bộ', 'Club Tokens')}
          >
            <img
              src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
              alt="Club Token"
              className="w-4 h-4 object-contain"
            />
            <span>
              {(user.clubTokens ?? 0).toLocaleString(locale)} {t('CLB', 'CLUB')}
            </span>
          </div>

          {/* 4. Vé Quay */}
          <div
            onClick={() => {
              soundService.playOpenSection();
              setActiveTab('tickets');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-gradient-to-r from-red-950/90 via-zinc-950 to-rose-950/85 border border-red-500/55 hover:border-red-400 text-xs font-mono font-bold text-rose-300 cursor-pointer active:scale-95 transition-all"
            title={t(
              'Vé Quay Siêu Sao (Chạm để vào Mục Mở Vé)',
              'Superstar Spin Tickets (Tap to open Spin Hub)'
            )}
          >
            <img
              src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
              alt="Tickets"
              className="w-4 h-4 object-contain"
            />
            <span>
              {(user.tickets ?? 0).toLocaleString(locale)} {t('VÉ', 'TIX')}
            </span>
            <span className="w-4 h-4 rounded-none bg-red-600 text-white flex items-center justify-center text-[11px] ml-0.5 font-sans font-black">
              +
            </span>
          </div>

          {/* 4b. Vé Mở Khóa Trước Sự Kiện */}
          <div
            onClick={() => {
              soundService.playOpenEvent();
              openComplexSection('libertadores');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-gradient-to-r from-[#1c1306] via-[#0d0904] to-[#261a08] border border-[#d4af37]/75 hover:border-[#fbe59b] text-xs font-mono font-bold text-[#f5d97e] cursor-pointer active:scale-95 transition-all tabular-nums"
            title={t(
              'Vé Mở Khóa Trước Sự Kiện (Chạm để mở CONMEBOL Libertadores)',
              'Early Event Unlock Ticket (Tap for CONMEBOL Libertadores)'
            )}
          >
            <img
              src={getLibertadoresAsset('unlockTicket')}
              alt="Vé Mở Khóa"
              referrerPolicy="no-referrer"
              className="w-4 h-4 object-contain"
            />
            <span>
              {(user.unlockTickets ?? 0).toLocaleString(locale)} {t('MỞ KHÓA', 'PASS')}
            </span>
          </div>

          {/* 4c. Token CONMEBOL Libertadores */}
          {((user.libertadoresTokens ?? 0) > 0 ||
            isLibertadoresEventUnlocked(user.libertadoresState, kickoffNowMs)) && (
            <div
              onClick={() => {
                soundService.playOpenEvent();
                openComplexSection('libertadores');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#120c04] border border-[#d4af37]/65 hover:border-[#fbe59b] text-xs font-mono font-bold text-[#fbe59b] cursor-pointer transition-all tabular-nums"
              title="Token CONMEBOL Libertadores"
            >
              <img
                src={getLibertadoresAsset('tokenSmall')}
                alt="Token Libertadores"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = LIBERTADORES_TOKEN_SMALL_FALLBACK;
                }}
                className="w-4 h-4 object-contain shrink-0"
              />
              <span>{(user.libertadoresTokens ?? 0).toLocaleString(locale)} LIB</span>
            </div>
          )}

          {/* 5. Energy */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-none bg-zinc-950/95 border border-amber-500/40 text-xs font-mono font-bold text-amber-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>
              {user.energy}/{user.maxEnergy}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Controls (Logo next to text, Friends right next to Quests) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              soundService.playOpenSection();
              setShowAlbum(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-400/80 text-yellow-300 transition-all active:scale-95 cursor-pointer"
            title={t('Album Bộ Sưu Tập UTOTY', 'UTOTY Player Album')}
          >
            <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="font-cruyff font-black text-[11px] uppercase tracking-wider">
              Album
            </span>
          </button>

          {/* KHỞI ĐỘNG 7 NGÀY (Tự động kết thúc khi hoàn thành đủ nhiệm vụ 7 ngày) */}
          {!kickoffFinished && (
            <button
              onClick={() => {
                soundService.playOpenEvent();
                setShowKickoff(true);
              }}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 hover:from-amber-400/45 hover:to-yellow-500/40 border border-yellow-300 text-yellow-200 transition-all active:scale-95 cursor-pointer shadow-[0_0_14px_rgba(250,204,21,0.3)]"
              title={t(
                'Mục Khởi Động Tân Thủ 7 Ngày (Mở khóa mỗi 6 giờ)',
                '7-Day New Player Kickoff (Unlocks every 6 hours)'
              )}
            >
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
              <span className="font-cruyff font-black text-[11px] uppercase tracking-wider text-yellow-200">
                {t('Khởi Động', 'Kickoff')}
              </span>
              {kickoffReadyCount > 0 ? (
                <span className="px-1 py-0.2 rounded-none bg-emerald-400 text-slate-950 font-mono text-[10px] font-black tabular-nums">
                  {kickoffReadyCount}
                </span>
              ) : (
                <span className="px-1 py-0.2 rounded-none bg-yellow-400 text-slate-950 font-mono text-[9px] font-black tabular-nums">
                  {kickoffState.claimedDayRewards.length}/7
                </span>
              )}
            </button>
          )}

          {/* KHU PHỨC HỢP (ĐẶT BÊN TRÁI MỤC NHIỆM VỤ) */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              openComplexSection('extra_time');
            }}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-gradient-to-r from-cyan-950/90 via-sky-900/80 to-indigo-950/90 hover:brightness-115 border border-cyan-300/85 text-cyan-100 transition-all active:scale-95 cursor-pointer shadow-[0_0_14px_rgba(34,211,238,0.28)]"
            title={t(
              'Khu Phức Hợp (Hiệp Phụ · CONMEBOL · Chữ Ký · BNS Việt Nam · BNS Ronaldo)',
              'Complex Hub (Extra Time · CONMEBOL · Signature · VN & Ronaldo Chronicles)'
            )}
          >
            <img
              src={EXTRA_TIME_ASSETS.tokenSmall}
              alt="Khu Phức Hợp"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="font-cruyff font-black text-[11px] uppercase tracking-wider">
              {t('Khu Phức Hợp', 'Complex Hub')}
            </span>
          </button>

          {/* NHIỆM VỤ */}
          <button
            onClick={() => {
              soundService.playOpenSection();
              setShowQuests(true);
            }}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-400/70 text-emerald-200 transition-all active:scale-95 cursor-pointer"
            title={t('Nhiệm vụ hàng ngày', 'Daily Quests')}
          >
            <img
              src="/assets/aistudio/headerbar_ACTIVITIES_7da2bf18.png"
              alt="Quests"
              className="w-4 h-4 object-contain filter invert opacity-95 shrink-0"
            />
            <span className="font-cruyff font-black text-[11px] uppercase tracking-wider">
              {t('Nhiệm Vụ', 'Quests')}
            </span>
            {totalQuestsBadgeCount > 0 && (
              <span className="px-1 py-0.2 rounded-none bg-emerald-400 text-slate-950 font-mono text-[10px] font-black tabular-nums">
                {totalQuestsBadgeCount}
              </span>
            )}
          </button>

          {/* BẠN BÈ (ĐẶT NGAY KẾ BÊN NHIỆM VỤ) */}
          <button
            onClick={() => {
              soundService.playOpenSection();
              setShowFriends(true);
            }}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-cyan-950/85 hover:bg-cyan-900/90 border border-cyan-400/75 text-cyan-200 transition-all active:scale-95 cursor-pointer"
            title={t('Bạn Bè & HLV Online', 'Friends & Online Coaches')}
          >
            <Users className="w-4 h-4 text-cyan-300 shrink-0" />
            <span className="font-cruyff font-black text-[11px] uppercase tracking-wider">
              {t('Bạn Bè', 'Friends')}
            </span>
            {incomingFriendReqCount > 0 && (
              <span className="px-1 py-0.2 rounded-none bg-rose-500 text-white font-mono text-[10px] font-black tabular-nums">
                {incomingFriendReqCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundService.playOpenSection();
              setShowMailbox(true);
            }}
            className="relative p-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/20 text-gray-200 transition-all hover:border-yellow-400 active:scale-95 cursor-pointer"
            title="Hộp thư"
          >
            <img
              src="/assets/aistudio/headerbar_INBOX_49949725.png"
              alt="Inbox"
              className="w-4 h-4 object-contain filter invert opacity-90"
            />
            {availableMailboxClaimsToday > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-none bg-rose-500 text-white font-cruyff text-[10px] font-black flex items-center justify-center tabular-nums">
                {availableMailboxClaimsToday}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => {
                soundService.playClick();
                setShowVolumePopover((prev) => !prev);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/20 text-gray-200 transition-all hover:border-yellow-400 active:scale-95 cursor-pointer"
              title="Điều chỉnh âm lượng nhạc nền"
            >
              {isMuted || bgmVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-gray-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-yellow-400" />
              )}
              <span className="hidden xl:inline font-mono text-[10px] font-bold text-yellow-300">
                {isMuted ? '0%' : `${bgmVolume}%`}
              </span>
            </button>

            {showVolumePopover && (
              <div className="absolute right-0 mt-2 w-64 p-3.5 rounded-none bg-zinc-950/95 backdrop-blur-xl border-2 border-yellow-400/60 shadow-[0_10px_35px_rgba(0,0,0,0.85)] z-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-yellow-400" />
                    <span className="font-cruyff font-bold text-xs text-white uppercase tracking-wide">
                      Nhạc Nền Game
                    </span>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase transition-colors ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {isMuted ? 'Đang tắt' : `${bgmVolume}%`}
                  </button>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : bgmVolume}
                  onChange={handleHeaderVolumeChange}
                  aria-label="Âm lượng nhạc nền"
                  className="w-full h-2 rounded-none appearance-none cursor-pointer bg-zinc-800 accent-yellow-400"
                />

                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>FC Mobile 26 Soundtrack</span>
                  <button
                    onClick={() => setShowVolumePopover(false)}
                    className="text-yellow-400 hover:text-yellow-300 font-bold uppercase"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              soundService.playOpenSection();
              setShowSettings(true);
            }}
            className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 border border-white/20 text-gray-200 transition-all hover:border-yellow-400 active:scale-95 cursor-pointer"
            title="Cài đặt"
          >
            <img
              src="/assets/aistudio/headerbar_SETTING_7888905b.png"
              alt="Setting"
              className="w-4 h-4 object-contain filter invert opacity-90"
            />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT (RAZOR-SHARP FRAMES, DISPLAY IMAGES FOR EVERY SECTION, LOGO NEXT TO TEXT, RANKED CENTERED BETWEEN CAREER & MY TEAM) */}
      <main className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-3 flex flex-col justify-start">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch my-auto">
            {/* LEFT COLUMN (5 Cols): TRUNG TÂM SỰ KIỆN ĐỘC QUYỀN (GINGA 26 · BALLON D'OR · BUNDESLIGA) */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-xl p-4 sm:p-5 bg-[#041a0d] border border-emerald-400/75 shadow-[0_0_32px_rgba(16,185,129,0.24)] relative overflow-hidden group">
              <div className="h-[2px] absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-400 via-yellow-300 to-teal-400 z-20" />
              {/* Event Home Display Banner Images (Ginga Map & Box Background + Kaka Hero) */}
              <img
                src={GINGA_ASSETS.mapBg}
                alt="Sự Kiện Ginga 26"
                className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-700 pointer-events-none select-none"
              />
              <img
                src={GINGA_ASSETS.boxBg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none select-none"
              />
              <img
                src="/assets/aistudio/kaka_1792074947594_5d502268.png"
                alt="Kaká Ginga Icon"
                className="absolute -right-8 top-10 h-64 object-contain opacity-35 pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-[#041d0f]/60 to-black/75 pointer-events-none" />

              {/* Top Header: Ginga Event Emblem Placed Right Next to Title */}
              <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-400/35">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={GINGA_ASSETS.pointIcon}
                    alt="GINGA 26"
                    className="h-8 sm:h-9 w-8 sm:w-9 object-contain shrink-0 pointer-events-none select-none drop-shadow-[0_0_10px_rgba(250,204,21,0.55)]"
                  />
                  <div className="min-w-0">
                    <h2 className="font-cruyff font-black text-base sm:text-lg text-white uppercase italic tracking-wider leading-none truncate">
                      {t('SỰ KIỆN GINGA 26', 'GINGA 26 EVENT')}
                    </h2>
                    <span className="text-[10px] font-cruyff font-bold text-yellow-300 uppercase tracking-widest block mt-0.5 truncate">
                      {t(
                        'GINGA ICONS · LỄ HỘI · CHUỖI 7 NGÀY',
                        'GINGA ICONS · FESTIVAL · 7-DAY STREAK'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {gingaReadyCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-cruyff font-black text-[10px] uppercase">
                      {gingaReadyCount} {t('QUÀ', 'GIFTS')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNextHeroPlayer}
                    className="px-2 py-1 rounded bg-black/70 hover:bg-emerald-400/20 border border-yellow-400/60 text-[10px] font-cruyff text-yellow-300 font-bold uppercase flex items-center gap-0.5 cursor-pointer transition-colors"
                  >
                    <span>{t('Đổi sao', 'Next Star')}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Centerpiece Hero Player Card */}
              <div className="relative z-10 my-2 flex items-center justify-center">
                <FCCard player={heroPlayer} size="hero" showStats={true} />
              </div>

              {/* Event Action Controls */}
              <div className="relative z-10 flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenEvent();
                    setGingaInitialChapter('main');
                    setShowGingaEvent(true);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-105 border border-white/80 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-98 shadow-[0_0_22px_rgba(52,211,153,0.4)] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={GINGA_ASSETS.pointIcon}
                      alt="Ginga"
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span>
                      {t('VÀO TRUNG TÂM SỰ KIỆN GINGA 26', 'ENTER GINGA 26 EVENT HUB')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playOpenEvent();
                      setTicketSpinTheme('GINGA');
                      setActiveTab('tickets');
                    }}
                    className="py-2 px-2.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900/90 border border-emerald-400/65 text-emerald-100 font-cruyff font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="Vé Quay"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span className="truncate">
                      {t('VÉ QUAY GINGA', 'GINGA SPIN')} ({(user.tickets ?? 0).toLocaleString(locale)})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playOpenEvent();
                      setGingaInitialChapter('festival');
                      setShowGingaEvent(true);
                    }}
                    className="py-2 px-2.5 rounded-lg bg-teal-950/90 hover:bg-teal-900/90 border border-teal-300/65 text-teal-100 font-cruyff font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                    <span className="truncate">{t('LỄ HỘI GINGA', 'FESTIVAL')}</span>
                  </button>
                </div>

                {/* CHUỖI BALLON D'OR ENTRANCE */}
                {(() => {
                  const claimedCount = (user.ballonDorStreakClaimedSteps ?? []).length;
                  const totalCount = BALLON_DOR_STREAK_STEPS.length;
                  const completed = claimedCount >= totalCount;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playOpenEvent();
                        setShowBallonDorStreak(true);
                      }}
                      className="relative w-full p-2.5 rounded-none bg-gradient-to-r from-[#130d04] via-[#281b07] to-[#0d0903] hover:brightness-110 border border-[#d4af37]/90 text-[#fbe59b] transition-all active:scale-98 overflow-hidden flex items-center justify-between gap-2 cursor-pointer shadow-[0_0_18px_rgba(212,175,55,0.28)] group"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-45 transition-opacity pointer-events-none"
                        style={{
                          backgroundImage: `url('/assets/aistudio/Ballon_Dor_streak_pack_fbe4e574.png')`,
                        }}
                      />
                      <div className="relative z-10 flex items-center gap-2.5 min-w-0 text-left">
                        <div className="w-10 h-10 bg-black/70 border border-[#d4af37]/80 flex items-center justify-center shrink-0">
                          <img
                            src="/assets/aistudio/Ballon_Dor_pack_23a61757.png"
                            alt="Chuỗi Ballon d'Or"
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 object-contain pointer-events-none"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-cruyff font-black text-xs sm:text-sm text-[#fbe59b] uppercase tracking-wider truncate leading-tight">
                              CHUỖI BALLON D&apos;OR
                            </span>
                          </div>
                          <div className="font-mono text-[10px] font-bold text-amber-100/90 truncate leading-tight mt-0.5 tabular-nums">
                            {claimedCount}/{totalCount} BƯỚC · FRANCO BARESI 102 OVR
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-1 shrink-0">
                        <span className="px-2 py-1 bg-gradient-to-r from-[#d4af37] via-[#fbe59b] to-[#b8891e] text-[#090703] border border-[#fff4cc] font-cruyff font-black text-[10px] uppercase tracking-wider shadow">
                          {completed ? 'HOÀN TẤT' : 'VÀO'}
                        </span>
                      </div>
                    </button>
                  );
                })()}

                {/* SỰ KIỆN BUNDESLIGA ENTRANCE (5 BÀN/NGÀY -> PACK 88+ BUNDESLIGA) */}
                {(() => {
                  const blState = normalizeBundesligaState(user.bundesligaState, getDaily6AMCycleKey());
                  const canClaimBl =
                    blState.goalsScoredToday >= BUNDESLIGA_DAILY_GOAL_TARGET && !blState.rewardClaimedToday;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playOpenEvent();
                        openComplexSection('bundesliga');
                      }}
                      className="relative w-full p-2.5 rounded-none bg-gradient-to-r from-[#230609] via-[#4a0b12] to-[#120305] hover:brightness-110 border border-red-500/85 text-red-100 transition-all active:scale-98 overflow-hidden flex items-center justify-between gap-2 cursor-pointer shadow-[0_0_18px_rgba(220,38,38,0.28)] group"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-35 group-hover:opacity-50 transition-opacity pointer-events-none"
                        style={{
                          backgroundImage: `url('${BUNDESLIGA_ASSETS.bg1}')`,
                        }}
                      />
                      <div className="relative z-10 flex items-center gap-2.5 min-w-0 text-left">
                        <div className="w-10 h-10 bg-black/70 border border-red-400/80 flex items-center justify-center shrink-0 p-1">
                          <img
                            src={BUNDESLIGA_ASSETS.eventLogo}
                            alt="Bundesliga"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-cruyff font-black text-xs sm:text-sm text-white uppercase tracking-wider truncate block leading-tight">
                            {t('SỰ KIỆN BUNDESLIGA', 'BUNDESLIGA EVENT')}
                          </span>
                          <div className="font-mono text-[10px] font-bold text-red-200 truncate leading-tight mt-0.5 tabular-nums">
                            {Math.min(blState.goalsScoredToday, BUNDESLIGA_DAILY_GOAL_TARGET)}/
                            {BUNDESLIGA_DAILY_GOAL_TARGET} BÀN HÔM NAY · PACK 88+
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-1 shrink-0">
                        <span
                          className={`px-2 py-1 border font-cruyff font-black text-[10px] uppercase tracking-wider shadow ${
                            canClaimBl
                              ? 'bg-emerald-400 text-slate-950 border-emerald-200 animate-pulse'
                              : blState.rewardClaimedToday
                              ? 'bg-zinc-900 text-emerald-300 border-emerald-400/60'
                              : 'bg-red-600 text-white border-red-300'
                          }`}
                        >
                          {canClaimBl ? 'NHẬN PACK' : blState.rewardClaimedToday ? 'ĐÃ NHẬN' : 'VÀO'}
                        </span>
                      </div>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* RIGHT COLUMN (7 Cols): [ĐẤU SỰ NGHIỆP | ĐẤU XẾP HẠNG | ĐỘI HÌNH] + VÉ QUAY (ĐẶT XÍCH XUỐNG DƯỚI ĐỂ DỄ NHẤN) + 5 FEATURE TILES */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
              {/* ROW 1: 3-COLUMN CORE ROW — [1. ĐẤU SỰ NGHIỆP] | [2. ĐẤU XẾP HẠNG (Ở GIỮA)] | [3. ĐỘI HÌNH] */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
                {/* COL 1 (LEFT): ĐẤU SỰ NGHIỆP */}
                <div
                  onClick={() => {
                    soundService.playOpenSection();
                    setCareerInitialTab('standings');
                    setShowCareer(true);
                  }}
                  className="relative min-h-[205px] p-3.5 rounded-none bg-zinc-950 border-2 border-emerald-400/80 hover:border-yellow-400 transition-all text-left flex flex-col justify-between group overflow-hidden shadow-[0_0_24px_rgba(16,185,129,0.2)] cursor-pointer active:scale-[0.99]"
                >
                  <img
                    src="/assets/aistudio/_nh_m_n_h_nh_ch_nh_m_c___u_s__nghi_p_a3fc1f80.png"
                    alt="Career Mode"
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/75 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1.5 border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Swords className="w-5 h-5 text-emerald-300 shrink-0" />
                      <h3 className="font-cruyff font-black text-sm sm:text-base text-white uppercase italic tracking-wide truncate group-hover:text-emerald-300 transition-colors">
                        {t('ĐẤU SỰ NGHIỆP', 'CAREER MODE')}
                      </h3>
                    </div>
                  </div>

                  <div className="relative z-10 my-2">
                    <span className="text-[10px] font-cruyff font-bold text-emerald-300 uppercase tracking-wider block">
                      PREMIER LEAGUE · 38 VÒNG ĐẤU
                    </span>
                    <p className="text-[11px] text-gray-200 font-cruyff mt-1 leading-snug">
                      {t(
                        'Đá giải Ngoại Hạng Anh nhận Xu X3, Vé Quay & Star Point mở chuỗi Star Pass!',
                        'Play Premier League fixtures for 3X Coins, Tickets & Star Pass Points!'
                      )}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-1.5 pt-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      {t('Xu X3 · Star Pass', '3X Coins · Star Pass')}
                    </span>
                    <span className="px-2.5 py-1 rounded-none bg-emerald-500/25 border border-emerald-300 text-emerald-200 font-cruyff font-black text-[11px] uppercase flex items-center gap-1">
                      <span>{t('VÀO ĐẤU', 'PLAY')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* COL 2 (CENTER / MIDDLE): ĐẤU XẾP HẠNG */}
                <div
                  onClick={() => {
                    soundService.playOpenSection();
                    setShowRanked(true);
                  }}
                  className="relative min-h-[205px] p-3.5 rounded-none bg-zinc-950 border-2 border-cyan-300 hover:border-yellow-400 transition-all text-left flex flex-col justify-between group overflow-hidden shadow-[0_0_28px_rgba(34,211,238,0.3)] cursor-pointer active:scale-[0.99]"
                >
                  <img
                    src="/assets/aistudio/_nh_m_n_h_nh_ch_nh_m_c___u_x_p_h_ng_18ab3244.png"
                    alt="Ranked Mode"
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-slate-950/55 to-slate-950/75 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1.5 border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={currentRankInfo.logoUrl}
                        alt={currentRankInfo.fullLabel}
                        className="w-6 h-6 object-contain shrink-0"
                      />
                      <h3 className="font-cruyff font-black text-sm sm:text-base text-white uppercase italic tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                        {t('ĐẤU XẾP HẠNG', 'RANKED RIVALS')}
                      </h3>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-none bg-cyan-400 text-slate-950 text-[9px] font-cruyff font-black uppercase shrink-0">
                      {t('MÙA', 'S')}{normalizedRanked.seasonNumber}
                    </span>
                  </div>

                  <div className="relative z-10 my-2">
                    <div className="font-cruyff font-black text-sm text-yellow-300 uppercase italic truncate">
                      {currentRankInfo.fullLabel}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-black/75 border border-yellow-400/50">
                      {[0, 1, 2].map((idx) => (
                        <Star
                          key={idx}
                          className={`w-3 h-3 ${
                            idx < currentRankInfo.starsInStep
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                      {currentRankInfo.extraChampionStars > 0 && (
                        <span className="ml-1 text-[10px] font-cruyff font-black text-rose-300 tabular-nums">
                          +{currentRankInfo.extraChampionStars}★
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-cyan-100/90 font-cruyff mt-1 tabular-nums">
                      Reset: {formatRankedSeasonCountdown(normalizedRanked.seasonEndsAt)} · PvP Online &amp; Emoji
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-1.5 pt-1">
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      +{currentRankInfo.isChampion ? '800' : '400'} {t('Gems/Thắng', 'Gems/Win')}
                    </span>
                    <span className="px-2.5 py-1 rounded-none bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-cruyff font-black text-[11px] uppercase flex items-center gap-1">
                      <span>{t('LEO HẠNG', 'RANK UP')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* COL 3 (RIGHT): ĐỘI HÌNH */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    soundService.playOpenSection();
                    openMyTeamWithTab('lineup');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      soundService.playOpenSection();
                      openMyTeamWithTab('lineup');
                    }
                  }}
                  className="relative min-h-[205px] p-3.5 rounded-none bg-zinc-950 border-2 border-blue-400/80 hover:border-yellow-400 transition-all text-left flex flex-col justify-between group overflow-hidden shadow-[0_0_24px_rgba(59,130,246,0.25)] cursor-pointer active:scale-[0.99]"
                >
                  <img
                    src="/assets/aistudio/_nh_m_n_h_nh_ch_nh_m_c___i_h_nh_741b5b87.png"
                    alt="Đội Hình"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-slate-950/50 to-slate-950/75 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1.5 border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <SquadConeLogo className="w-5 h-5 shrink-0" />
                      <h3 className="font-cruyff font-black text-sm sm:text-base text-white uppercase italic tracking-wide truncate group-hover:text-yellow-300 transition-colors">
                        {t('ĐỘI HÌNH', 'MY SQUAD')}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-none bg-yellow-400 text-slate-950 font-cruyff font-black text-xs tabular-nums shrink-0">
                      OVR {user.ovr}
                    </span>
                  </div>

                  <div className="relative z-10 my-2 space-y-1">
                    <span className="text-[10px] font-cruyff font-bold text-blue-200 uppercase tracking-wider block">
                      {t('SƠ ĐỒ', 'FORMATION')} {activeFormation.name} ·{' '}
                      {getPlayStyleDef(user.playStyle).name.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getPlayStyleDef(user.playStyle).iconUrl}
                        alt={getPlayStyleDef(user.playStyle).name}
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="text-[11px] text-yellow-300 font-cruyff font-bold truncate">
                        {t('Phong cách:', 'Playstyle:')} {getPlayStyleDef(user.playStyle).name}
                      </span>
                    </div>
                    {(() => {
                      const mgrEval = evaluateManagerBonus({
                        activeManager: user.activeManager,
                        formationId: activeFormation.id,
                        playStyleId: user.playStyle,
                      });
                      if (mgrEval.isActive && mgrEval.manager) {
                        return (
                          <p className="text-[10px] text-emerald-300 font-cruyff font-bold truncate">
                            HLV {mgrEval.manager.name} (+{mgrEval.totalBonus} OVR)
                          </p>
                        );
                      }
                      return (
                        <p className="text-[10px] text-gray-200 font-cruyff leading-snug">
                          {t('CLB hôm nay', 'Club Match')} (
                          {todayFeaturedClubMatch.todayMatch.homeClub.shortName} vs{' '}
                          {todayFeaturedClubMatch.todayMatch.awayClub.shortName}): {remainingClubMatches}/
                          {DAILY_MAX_CLUB_MATCHES}
                        </p>
                      );
                    })()}
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundService.playClick();
                          openMyTeamWithTab('club');
                        }}
                        className="px-2 py-1 rounded-none bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-cruyff font-black text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <img
                          src={CLUB_KEY_MATCH_ASSETS.clubTokenIcon}
                          alt=""
                          className="w-3 h-3 object-contain"
                        />
                        <span>{t('CLB 45s', 'CLUB 45s')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundService.playOpenSection();
                          openMyTeamWithTab('tactics');
                        }}
                        className="px-2 py-1 rounded-none bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-[10px] uppercase cursor-pointer"
                      >
                        {t('PHONG CÁCH', 'TACTICS')}
                      </button>
                    </div>
                    <span className="px-2.5 py-1 rounded-none bg-blue-500/30 border border-blue-300 text-blue-100 font-cruyff font-black text-[11px] uppercase flex items-center gap-1">
                      <span>{t('SƠ ĐỒ', 'LINEUP')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 2 (SHIFTED DOWN): VÉ QUAY SIÊU SAO (DRAFT) DISPLAY PANEL */}
              <div className="relative z-20 p-3.5 sm:p-4 rounded-none bg-zinc-950 border-2 border-yellow-400/75 hover:border-yellow-300 transition-all overflow-hidden shadow-[0_0_24px_rgba(59,130,246,0.25)]">
                <img
                  src="/assets/aistudio/_nh_m__m_c_v__quay_b5c6b29b.png"
                  alt="Superstar Spin"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-blue-950/80 to-slate-950/88 pointer-events-none" />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/15">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                      alt="Tickets"
                      className="w-6 h-6 object-contain shrink-0"
                    />
                    <div>
                      <h3 className="font-cruyff font-black text-base sm:text-lg text-white uppercase italic tracking-wider leading-none">
                        {t('VÉ QUAY SIÊU SAO (DRAFT)', 'SUPERSTAR TICKET DRAFT')}
                      </h3>
                      <span className="text-[10px] font-cruyff text-cyan-200 font-bold uppercase tracking-wider">
                        {t(
                          `Đang có ${(user.tickets ?? 0).toLocaleString(locale)} Vé Quay`,
                          `Owned: ${(user.tickets ?? 0).toLocaleString(locale)} Tickets`
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setOddsModalTheme(
                          ticketSpinTheme === 'UTOTY' ||
                            ticketSpinTheme === 'TOTY' ||
                            ticketSpinTheme === 'FUTURE_STARS'
                            ? 'GINGA'
                            : ticketSpinTheme
                        );
                        setShowOddsModalForTier('A');
                      }}
                      className="px-2 py-1 rounded-none bg-black/75 hover:bg-white/10 border border-yellow-400/50 text-[10px] font-cruyff font-bold uppercase text-yellow-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>{t('Tỷ Lệ', 'Odds')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playOpenSection();
                        setActiveTab('tickets');
                      }}
                      className="px-3 py-1 rounded-none bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-cruyff font-black text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('Vào Vé Quay', 'Open Draft')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pool Quick-Select Buttons with Logo Next to Text */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playOpenSection();
                      setTicketSpinTheme('BUNDESLIGA');
                      setActiveTab('tickets');
                    }}
                    className="py-1.5 px-2 rounded-none bg-red-950/95 hover:bg-red-900 border border-red-400/85 text-red-100 font-cruyff font-black text-[11px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <img
                      src={BUNDESLIGA_ASSETS.eventLogo}
                      alt="Bundesliga"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span className="truncate">BUNDESLIGA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playOpenSection();
                      setTicketSpinTheme('CHAMPIONS_JUVENTUS');
                      setActiveTab('tickets');
                    }}
                    className="py-1.5 px-2 rounded-none bg-zinc-900/95 hover:bg-zinc-800 border border-amber-300/85 text-amber-200 font-cruyff font-black text-[11px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <img
                      src={CHAMPIONS_JUVENTUS_ASSETS.clubLogo}
                      alt="Champions Juventus"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span className="truncate">JUVENTUS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playOpenSection();
                      setTicketSpinTheme('GINGA');
                      setActiveTab('tickets');
                    }}
                    className="py-1.5 px-2 rounded-none bg-emerald-950/95 hover:bg-emerald-900 border border-emerald-400/75 text-emerald-300 font-cruyff font-black text-[11px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <img
                      src="/assets/aistudio/khung_th__c_u_th__ginga_g_i_a_69452143.png"
                      alt="Ginga Tuần 1 A"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span className="truncate">GINGA 1 A</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playOpenSection();
                      setTicketSpinTheme('GINGA_W1B');
                      setActiveTab('tickets');
                    }}
                    className="py-1.5 px-2 rounded-none bg-emerald-950/95 hover:bg-emerald-900 border border-yellow-300/80 text-yellow-200 font-cruyff font-black text-[11px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <img
                      src="/assets/aistudio/106_pizarro_d83d24ce.png"
                      alt="Ginga Tuần 1 B"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span className="truncate">GINGA 1 B</span>
                  </button>
                </div>

                {/* Quick 1-Ticket & 10-Ticket Spin Triggers */}
                <div className="relative z-10 grid grid-cols-2 gap-2.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleSpinWithTicket(1)}
                    className="py-1.5 px-3 rounded-none bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:brightness-105 border border-yellow-100 text-slate-950 font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer active:scale-98"
                  >
                    <span>{t('MỞ NGAY 1 VÉ', 'SPIN 1 TICKET')}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <img
                        src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                        alt=""
                        className="w-3.5 h-3.5 object-contain"
                      />
                      1
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpinWithTicket(10)}
                    className="py-1.5 px-3 rounded-none bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 hover:brightness-105 border border-white text-slate-950 font-cruyff font-black text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer active:scale-98"
                  >
                    <span>{t('MỞ NGAY 10 VÉ', 'SPIN 10 TICKETS')}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <img
                        src="/assets/aistudio/currencysmall_FESTIVE_DRAFT_VOUCHER_920d4673.png"
                        alt=""
                        className="w-3.5 h-3.5 object-contain"
                      />
                      10
                    </span>
                  </button>
                </div>
              </div>

              {/* ROW 3: 5-COLUMN DISPLAY STRIP */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {/* 1. STAR PASS GINGA */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenSection();
                    setShowStarPass(true);
                  }}
                  className="relative p-3 rounded-none bg-[#03140b] border-2 border-emerald-400/80 hover:border-yellow-300 transition-all text-left flex flex-col justify-between group active:scale-[0.98] cursor-pointer overflow-hidden min-h-[104px]"
                >
                  <img
                    src="/assets/aistudio/104_dybala_ginga_eaed30b7.png"
                    alt="Dybala 104 Star Pass Ginga"
                    className="absolute -right-2 -bottom-1 h-20 object-contain opacity-60 pointer-events-none select-none group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#03140b]/92 via-emerald-950/75 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src="/assets/aistudio/popup_GINGA26_MINIPASS_LOGO_dedeaa84.png"
                        alt="Ginga Star Pass"
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="font-cruyff font-black text-xs sm:text-sm text-white uppercase italic truncate">
                        STAR PASS
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-none bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tabular-nums shrink-0">
                      {starPassUnclaimedCount > 0
                        ? `${starPassUnclaimedCount} ${t('QUÀ', 'GIFTS')}`
                        : `LV.${starPassLevel}`}
                    </span>
                  </div>

                  <div className="relative z-10 mt-2">
                    <span className="text-[10px] text-emerald-200 font-cruyff font-bold block truncate">
                      {t('Mùa Ginga · Không GD', 'Ginga Season · Untradeable')}
                    </span>
                    <span className="text-[9px] text-amber-200 font-cruyff block truncate">
                      Dybala 104 &amp; Gilberto Silva 106
                    </span>
                  </div>
                </button>

                {/* 2. MỤC ICONS */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenEvent();
                    setShowIconsModal(true);
                  }}
                  className="relative p-3 rounded-none bg-zinc-950 border-2 border-teal-300/85 hover:border-yellow-300 transition-all text-left flex flex-col justify-between group active:scale-[0.98] cursor-pointer overflow-hidden min-h-[104px]"
                >
                  <img
                    src="/assets/aistudio/khung_th__classics_6d23269c.png"
                    alt="Classics 95 OVR"
                    className="absolute -right-2 -bottom-2 h-20 object-contain opacity-60 pointer-events-none select-none group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-teal-950/70 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src="/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png"
                        alt="Icons"
                        className="w-5 h-5 object-contain shrink-0"
                      />
                      <span className="font-cruyff font-black text-xs sm:text-sm text-white uppercase italic truncate">
                        ICONS
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-none text-[9px] font-black uppercase tabular-nums shrink-0 ${
                        iconsChroniclesReady
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-teal-300 text-slate-950'
                      }`}
                    >
                      {iconsChroniclesReady
                        ? t('ĐỦ 6 THẺ', 'READY')
                        : `${ownedClassicsCount}/5`}
                    </span>
                  </div>

                  <div className="relative z-10 mt-2">
                    <span className="text-[10px] text-teal-200 font-cruyff font-bold block truncate">
                      {t('Biên Niên Sử Classics 95', 'Icon Chronicles 95–97')}
                    </span>
                    <span className="text-[9px] text-amber-200 font-cruyff block truncate">
                      {t('Đổi 6 cầu thủ 90+ → 1/5 Icons', 'Exchange 6x 90+ → 1/5 Icons')}
                    </span>
                  </div>
                </button>

                {/* 3. TRAO ĐỔI MẢNH — STAR SIGNINGS ENTRANCE */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenSection();
                    setShowShardExchange(true);
                  }}
                  className="relative p-3 rounded-lg bg-[#081022] border-2 border-cyan-400/80 hover:border-emerald-300 transition-all text-left flex flex-col justify-between group active:scale-[0.98] cursor-pointer overflow-hidden min-h-[104px] shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                >
                  <img
                    src="/assets/aistudio/_nh_h_p___ng_2bfd946d.png"
                    alt="Trao Đổi Mảnh — Star Signings"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none select-none group-hover:scale-105 transition-transform duration-500"
                  />
                  <img
                    src="/assets/aistudio/currencylarge_STAR_SHARD_3dbbba71.png"
                    alt=""
                    className="absolute -right-2 -bottom-2 w-14 h-14 object-contain opacity-35 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050b16]/95 via-[#07162a]/70 to-black/65 pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
                        alt="Mảnh Ngôi Sao"
                        className="w-4 h-4 object-contain shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                      />
                      <span className="font-cruyff font-black text-xs sm:text-sm text-white uppercase italic truncate">
                        {t('TRAO ĐỔI MẢNH', 'STAR SIGNINGS')}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-[9px] font-black uppercase tabular-nums shrink-0">
                      {(user.totyShards ?? 0).toLocaleString(locale)}
                    </span>
                  </div>

                  <div className="relative z-10 mt-2">
                    <span className="text-[10px] text-cyan-300 font-cruyff font-bold block truncate">
                      {t('Ký Hợp Đồng Ngôi Sao', 'Sign Star Players')}
                    </span>
                    <span className="text-[9px] text-emerald-200 font-cruyff block truncate">
                      {t('Phân tách & chiêu mộ mọi mùa thẻ', 'Release & sign across seasons')}
                    </span>
                  </div>
                </button>

                {/* 4. CHUYỂN NHƯỢNG */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenSection();
                    setShowTransferMarket(true);
                  }}
                  className="relative p-3 rounded-none bg-zinc-950 border-2 border-emerald-400/75 hover:border-emerald-300 transition-all text-left flex flex-col justify-between group active:scale-[0.98] cursor-pointer overflow-hidden min-h-[104px]"
                >
                  <img
                    src="/assets/aistudio/draft_TOTY26_BG_c07ec164.png"
                    alt="Transfer Market"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none select-none group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-emerald-950/60 to-black/75 pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span className="font-cruyff font-black text-xs sm:text-sm text-white uppercase italic truncate">
                      {t('CHUYỂN NHƯỢNG', 'MARKET')}
                    </span>
                  </div>

                  <div className="relative z-10 mt-2">
                    <span className="text-[10px] text-emerald-300 font-cruyff font-bold block truncate">
                      {t('Mua & Bán Cầu Thủ', 'Buy & Sell Players')}
                    </span>
                    <span className="text-[9px] text-gray-300 font-cruyff block truncate">
                      {t('Giao dịch tự do bằng Xu', 'Trade freely with Coins')}
                    </span>
                  </div>
                </button>

                {/* 5. CỬA HÀNG */}
                <button
                  type="button"
                  onClick={() => {
                    soundService.playOpenSection();
                    setShowShop(true);
                  }}
                  className="relative p-3 rounded-none bg-zinc-950 border-2 border-amber-400/80 hover:border-yellow-300 transition-all text-left flex flex-col justify-between group active:scale-[0.98] cursor-pointer overflow-hidden min-h-[104px]"
                >
                  <img
                    src="/assets/aistudio/storepack_S11_d9617be0.png"
                    alt="Store"
                    className="absolute -right-2 -bottom-2 h-20 object-contain opacity-50 pointer-events-none select-none group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-amber-950/55 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-1.5">
                    <StoreCartLogo className="w-4 h-4 shrink-0" />
                    <span className="font-cruyff font-black text-xs sm:text-sm text-white uppercase italic truncate">
                      {t('CỬA HÀNG', 'STORE')}
                    </span>
                  </div>

                  <div className="relative z-10 mt-2">
                    <span className="text-[10px] text-yellow-300 font-cruyff font-bold block truncate">
                      {t('Gói Hạng A, B, C & Vé', 'Tier A, B, C Packs & Tickets')}
                    </span>
                    <span className="text-[9px] text-gray-300 font-cruyff block truncate">
                      {t('Mở gói bằng Kim Cương', 'Open packs with Gems')}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

        {/* NEW PLAYER 7-DAY KICKOFF BANNER */}
        {!kickoffFinished && (
          <div className="max-w-7xl mx-auto w-full mt-2.5 flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-none bg-gradient-to-r from-amber-950/90 via-zinc-950 to-slate-950 border-2 border-yellow-400/75 shadow-[0_0_22px_rgba(250,204,21,0.2)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-none border border-yellow-400/80 overflow-hidden shrink-0 bg-black">
                <img
                  src={KICKOFF_ASSETS.ticketRewardArt}
                  alt="Kickoff"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-cruyff font-black uppercase text-yellow-300 tracking-wider">
                    {t(
                      `MỤC KHỞI ĐỘNG 7 NGÀY (${kickoffState.claimedDayRewards.length}/7 NGÀY):`,
                      `7-DAY KICKOFF (${kickoffState.claimedDayRewards.length}/7 DAYS):`
                    )}
                  </span>
                  {kickoffNextUnlock && (
                    <span className="px-1.5 py-0.5 bg-amber-400/15 border border-amber-400/40 font-mono text-[10px] font-bold text-amber-200 tabular-nums">
                      {t(
                        `Mở Ngày ${kickoffNextUnlock.nextDay} sau ${formatKickoffCountdown(kickoffNextUnlock.remainingMs)}`,
                        `Day ${kickoffNextUnlock.nextDay} in ${formatKickoffCountdown(kickoffNextUnlock.remainingMs)}`
                      )}
                    </span>
                  )}
                </div>
                <span className="text-gray-200 font-cruyff block truncate mt-0.5">
                  {t(
                    'Hoàn thành 5 nhiệm vụ/ngày (+200 Gems & +400 SP/NV) · Mỗi phần thưởng ngày nhận kèm +50 Star Point!',
                    'Complete 5 quests/day (+200 Gems & +400 SP/quest) · Every daily reward also grants +50 Star Points!'
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playOpenEvent();
                setShowKickoff(true);
              }}
              className="relative w-44 h-9 flex items-center justify-center hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <img
                src={KICKOFF_ASSETS.questFrame}
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
              <span className="relative z-10 font-cruyff font-black text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-1">
                <span>
                  {kickoffReadyCount > 0
                    ? t(`NHẬN QUÀ (${kickoffReadyCount})`, `CLAIM (${kickoffReadyCount})`)
                    : t('VÀO KHỞI ĐỘNG', 'OPEN KICKOFF')}
                </span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </button>
          </div>
        )}

        {/* Quick Daily Login Reward Ribbon */}
        <div className="max-w-7xl mx-auto w-full mt-2 flex items-center justify-between p-2.5 rounded-none bg-gradient-to-r from-yellow-500/20 via-black/90 to-zinc-950 border border-yellow-400/40">
          <div className="flex items-center gap-2.5">
            <Gift className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="text-xs">
              <span className="font-cruyff font-bold uppercase text-yellow-300">
                {t(
                  'ĐIỂM DANH HÀNG NGÀY (RESET 06:00 SÁNG):',
                  'DAILY CHECK-IN (RESETS 06:00 AM):'
                )}
              </span>
              <span className="text-gray-300 font-cruyff ml-2">
                {t(
                  'Nhận ngay 50,000 Xu, 150 Kim Cương và 1 Vé Quay hỗ trợ hôm nay!',
                  'Claim 50,000 Coins, 150 Gems, and 1 Spin Ticket today!'
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={dailyClaimed ? undefined : handleClaimDailyBonus}
            disabled={dailyClaimed}
            className={`px-4 py-1.5 rounded-none font-cruyff font-bold text-xs uppercase tracking-wider transition-all shrink-0 ${
              dailyClaimed
                ? 'bg-white/10 text-gray-400 border border-white/15 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black border border-yellow-200 active:scale-95 cursor-pointer'
            }`}
          >
            {dailyClaimed ? t('Đã Nhận (1/1)', 'Claimed (1/1)') : t('Nhận Thưởng', 'Claim')}
          </button>
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <footer className="relative z-20 bg-black/95 backdrop-blur-md border-t-2 border-white/20 px-2 sm:px-4 py-1.5 font-cruyff">
        <div className="max-w-7xl mx-auto grid grid-cols-4 sm:grid-cols-7 border border-white/20 divide-x divide-y sm:divide-y-0 divide-white/20 bg-zinc-950/90">
          {/* 1. KHU PHỨC HỢP (BÊN TRÁI MỤC NHIỆM VỤ) */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              openComplexSection('extra_time');
            }}
            className="relative flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-cyan-300 hover:text-white hover:bg-cyan-500/15 cursor-pointer"
          >
            <img
              src={EXTRA_TIME_ASSETS.tokenSmall}
              alt="Khu Phức Hợp"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              {t('Khu Phức Hợp', 'Complex')}
            </span>
          </button>

          {/* 2. NHIỆM VỤ */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              setShowQuests(true);
            }}
            className="relative flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-emerald-300 hover:text-white hover:bg-emerald-500/15 cursor-pointer"
          >
            <img
              src="/assets/aistudio/headerbar_ACTIVITIES_7da2bf18.png"
              alt="Quests"
              className="w-4 h-4 object-contain filter invert opacity-95 shrink-0"
            />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              {t('Nhiệm Vụ', 'Quests')}
            </span>
            {readyQuestsCount > 0 && (
              <span className="px-1 py-0.2 rounded-none bg-emerald-400 text-slate-950 font-mono text-[9px] font-black">
                {readyQuestsCount}
              </span>
            )}
          </button>

          {/* 3. STAR PASS */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              setShowStarPass(true);
            }}
            className="relative flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-sky-200 hover:text-yellow-300 hover:bg-sky-500/15 cursor-pointer"
          >
            <img
              src="/assets/aistudio/popup_GINGA26_MINIPASS_LOGO_dedeaa84.png"
              alt="Star Pass"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              Star Pass
            </span>
            {starPassUnclaimedCount > 0 && (
              <span className="px-1 py-0.2 rounded-none bg-rose-500 text-white font-mono text-[9px] font-black">
                {starPassUnclaimedCount}
              </span>
            )}
          </button>

          {/* 4. MỤC ICONS */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenEvent();
              setShowIconsModal(true);
            }}
            className="relative flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-teal-200 hover:text-yellow-300 hover:bg-teal-500/15 cursor-pointer"
          >
            <img
              src="/assets/aistudio/logo_c_u_l_c_b__cho_c_c_huy_n_tho_i_5adb0da5.png"
              alt="Icons"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              Icons
            </span>
            {iconsChroniclesReady && (
              <span className="px-1 py-0.2 rounded-none bg-emerald-400 text-slate-950 font-mono text-[9px] font-black">
                95
              </span>
            )}
          </button>

          {/* 5. TRAO ĐỔI MẢNH */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              setShowShardExchange(true);
            }}
            className="flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-cyan-200 hover:text-white hover:bg-cyan-500/15 cursor-pointer"
          >
            <img
              src="/assets/aistudio/currencysmall_STAR_SHARD_c104eb5a.png"
              alt="Mảnh Ngôi Sao"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              {t('Trao Đổi Mảnh', 'Star Signings')}
            </span>
          </button>

          {/* 6. CHUYỂN NHƯỢNG */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              setShowTransferMarket(true);
            }}
            className="flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-emerald-300 hover:text-white hover:bg-emerald-500/15 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              {t('Chuyển Nhượng', 'Market')}
            </span>
          </button>

          {/* 7. CỬA HÀNG */}
          <button
            type="button"
            onClick={() => {
              soundService.playOpenSection();
              setShowShop(true);
            }}
            className="flex flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-none transition-all text-amber-300 hover:text-white hover:bg-amber-500/15 cursor-pointer"
          >
            <StoreCartLogo className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-cruyff font-black uppercase tracking-wider truncate">
              {t('Cửa Hàng', 'Store')}
            </span>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {activeTab === 'tickets' && (
        <TicketSpinSection
          user={user}
          onUpdateUser={onUpdateUser}
          ticketsCount={user.tickets ?? 0}
          futureStarsTicketsCount={user.futureStarsTickets ?? 0}
          spinTheme={ticketSpinTheme}
          onChangeSpinTheme={setTicketSpinTheme}
          onSpin={(count, theme) => handleSpinWithTicket(count, theme)}
          onOpenShop={() => setShowShop(true)}
          onOpenExchange={() => setShowShardExchange(true)}
          onOpenAlbum={() => setShowAlbum(true)}
          onOpenOdds={(theme) => {
            setOddsModalTheme(theme);
            setShowOddsModalForTier('A');
          }}
          onClose={() => setActiveTab('home')}
          onGoHome={() => setActiveTab('home')}
        />
      )}

      {showPackOpening && (
        <PackOpeningModal
          packTier={selectedPackTier}
          packTheme={selectedPackTheme}
          packName={selectedPackCustomName}
          isTicketSpin={isTicketSpinMode}
          spinCount={spinCount}
          initialTicketsOpenedBeforeSpin={spinCountBeforeBatch}
          ticketsRemaining={
            selectedPackTheme === 'LIBERTADORES'
              ? user.libertadoresTickets ?? user.tickets ?? 0
              : selectedPackTheme === 'FUTURE_STARS'
              ? (user.futureStarsTickets ?? 0) + (user.tickets ?? 0)
              : user.tickets ?? 0
          }
          onUseTicket={handleUseTicketInModal}
          onClose={() => setShowPackOpening(false)}
          onPlayerClaimed={handlePlayerClaimedFromPack}
          onMultiplePlayersClaimed={handleMultiplePlayersClaimed}
        />
      )}

      {fixedWalkoutModal && (
        <PackOpeningModal
          fixedPlayer={fixedWalkoutModal.player}
          packTier="UTOTY"
          packTheme="UTOTY"
          packName={fixedWalkoutModal.title}
          isTicketSpin={false}
          autoStartWalkout={true}
          isIconChroniclesExchange={true}
          skipResourceBonus={true}
          onClose={() => setFixedWalkoutModal(null)}
          onPlayerClaimed={() => {}}
        />
      )}

      {showGingaEvent && (
        <GingaEventModal
          user={user}
          initialChapter={gingaInitialChapter}
          onUpdateUser={onUpdateUser}
          onOpenPackTier={(tier, customName) => {
            handleOpenPackTierFromShop(tier, customName);
          }}
          onGoToCareer={() => setShowCareer(true)}
          onGoToRanked={() => setShowRanked(true)}
          onGoToSpin={() => {
            setShowGingaEvent(false);
            setTicketSpinTheme('GINGA');
            setActiveTab('tickets');
          }}
          onClose={() => setShowGingaEvent(false)}
        />
      )}

      {showShardExchange && (
        <TotyShardsModal
          user={user}
          onUpdateUser={onUpdateUser}
          onClickGems={() => {
            setShowShardExchange(false);
            setShopInitialTab('recommended');
            setShowShop(true);
          }}
          onClickTickets={() => {
            setShowShardExchange(false);
            setActiveTab('tickets');
          }}
          onOpenMyTeam={() => {
            setShowShardExchange(false);
            setMyTeamInitialTab('lineup');
            setShowMyTeam(true);
          }}
          onClose={() => setShowShardExchange(false)}
        />
      )}

      {showTransferMarket && (
        <TransferMarketModal
          user={user}
          onUpdateUser={onUpdateUser}
          onOpenMyTeam={() => setShowMyTeam(true)}
          onClose={() => setShowTransferMarket(false)}
        />
      )}

      {showRanked && (
        <RankedModeModal
          user={user}
          starters={starters}
          bench={bench}
          activeFormation={activeFormation}
          onUpdateSquad={(newStarters: PlayerCard[], newBench: PlayerCard[], formationId: string) => {
            const nextForm =
              availableFormations.find((f) => f.id === formationId) || activeFormation;
            const summary = computeSquadOvr({
              starters: newStarters,
              formation: nextForm,
              trainingLevel: user.trainingLevel ?? 0,
              activeManager: user.activeManager,
              playStyleId: user.playStyle,
              fallbackOvr: user.ovr,
            });
            handleSaveSquad(newStarters, newBench, formationId, summary.totalOvr);
          }}
          onUpdateUser={onUpdateUser}
          onSelectPlayStyle={(nextStyle: TacticalPlayStyleId) => {
            onUpdateUser(() => ({ playStyle: nextStyle }));
          }}
          onOpenMyTeam={() => {
            setMyTeamInitialTab('tactics');
            setShowMyTeam(true);
          }}
          pendingInviteToAccept={pendingRankedInviteToAccept}
          onClearPendingInvite={() => setPendingRankedInviteToAccept(null)}
          pendingDirectInviteTarget={pendingDirectInviteTarget}
          onClearPendingDirectInvite={() => setPendingDirectInviteTarget(null)}
          onClose={() => {
            setPendingRankedInviteToAccept(null);
            setPendingDirectInviteTarget(null);
            setShowRanked(false);
          }}
        />
      )}

      {showCareer && (
        <CareerModeModal
          user={user}
          starters={starters}
          bench={bench}
          activeFormation={activeFormation}
          initialTab={careerInitialTab}
          onUpdateSquad={(newStarters, newBench, formationId) => {
            const nextForm =
              availableFormations.find((f) => f.id === formationId) || activeFormation;
            const summary = computeSquadOvr({
              starters: newStarters,
              formation: nextForm,
              trainingLevel: user.trainingLevel ?? 0,
              activeManager: user.activeManager,
              playStyleId: user.playStyle,
              fallbackOvr: user.ovr,
            });
            handleSaveSquad(newStarters, newBench, formationId, summary.totalOvr);
          }}
          onUpdateUser={onUpdateUser}
          onOpenShop={() => {
            setShowCareer(false);
            setShopInitialTab('tickets');
            setShowShop(true);
          }}
          onClaimCareerRewards={handleClaimCareerRewards}
          onGoToTickets={() => {
            setShowCareer(false);
            setActiveTab('tickets');
          }}
          onSelectPlayStyle={(nextStyle: TacticalPlayStyleId) => {
            onUpdateUser(() => ({ playStyle: nextStyle }));
          }}
          onClose={() => {
            setCareerInitialTab('standings');
            setShowCareer(false);
          }}
        />
      )}

      {showShop && (
        <ShopModal
          user={user}
          initialTopTab={shopInitialTab}
          onUpdateUser={onUpdateUser}
          onClose={() => {
            setShopInitialTab('recommended');
            setShowShop(false);
          }}
          onOpenTickets={() => {
            setShowShop(false);
            setActiveTab('tickets');
          }}
          onOpenShards={() => {
            setShowShop(false);
            setShowShardExchange(true);
          }}
          onOpenPackTierDirectly={(tier) => {
            handleOpenPackTierFromShop(tier);
          }}
          onOpenPackDirectly={() => {
            handleSpinWithTicket(1);
          }}
          onOpenWalkoutForPlayer={(player, title) => {
            setFixedWalkoutModal({ player, title });
          }}
        />
      )}

      {showComplexHub && (
        <ComplexHubModal
          user={user}
          initialSection={complexInitialSection}
          onUpdateUser={onUpdateUser}
          onOpenPackTier={(tier, customName) => {
            handleOpenPackTierFromShop(tier, customName);
          }}
          onGoToCareer={() => {
            setShowComplexHub(false);
            setCareerInitialTab('standings');
            setShowCareer(true);
          }}
          onGoToShop={() => {
            setShowComplexHub(false);
            setShopInitialTab('recommended');
            setShowShop(true);
          }}
          onGoToShopGiftcode={() => {
            setShowComplexHub(false);
            setShopInitialTab('giftcode');
            setShowShop(true);
          }}
          onGoToTickets={() => {
            setShowComplexHub(false);
            setActiveTab('tickets');
          }}
          onGoToBundesligaSpin={() => {
            setShowComplexHub(false);
            setTicketSpinTheme('BUNDESLIGA');
            setActiveTab('tickets');
          }}
          onNavigateFeaturedEvent={(dest: FeaturedEventDestination) => {
            setShowComplexHub(false);
            switch (dest) {
              case 'toty26':
              case 'future_stars':
                setGingaInitialChapter('main');
                setShowGingaEvent(true);
                break;
              case 'icons':
                setShowIconsModal(true);
                break;
              case 'star_pass':
                setShowStarPass(true);
                break;
              case 'shop_conmebol':
                setShopInitialTab('packs');
                setShowShop(true);
                break;
            }
          }}
          onClose={() => setShowComplexHub(false)}
          onGoHome={() => {
            setShowComplexHub(false);
            setActiveTab('home');
          }}
        />
      )}

      {showBallonDorStreak && (
        <BallonDorStreakModal
          user={user}
          onUpdateUser={onUpdateUser}
          onOpenRewardPack={(tier, customName) => {
            handleOpenPackTierFromShop(tier, customName);
          }}
          onOpenFixedWalkout={(player, customTitle) => {
            setFixedWalkoutModal({ player, title: customTitle });
          }}
          onClickGems={() => {
            setShowBallonDorStreak(false);
            setShopInitialTab('recommended');
            setShowShop(true);
          }}
          onClickTickets={() => {
            setShowBallonDorStreak(false);
            setActiveTab('tickets');
          }}
          onClose={() => setShowBallonDorStreak(false)}
        />
      )}

      {showMyTeam && (
        <MyTeamModal
          user={user}
          onClose={() => {
            setMyTeamInitialTab('lineup');
            setShowMyTeam(false);
          }}
          initialTab={myTeamInitialTab}
          userTeamName={user.teamName}
          teamOvr={user.ovr}
          userCoins={user.coins}
          clubTokens={user.clubTokens ?? 0}
          userTickets={user.tickets ?? 0}
          clubDaily={user.clubDaily}
          ownedPlayerIds={user.ownedPlayerIds}
          trainingLevel={user.trainingLevel ?? 0}
          ownedPlayers={ownedPlayers}
          initialStarters={starters}
          initialBench={bench}
          activeFormationId={activeFormation.id}
          playStyle={user.playStyle}
          onSelectPlayStyle={(nextStyle: TacticalPlayStyleId) => {
            onUpdateUser(() => ({ playStyle: nextStyle }));
          }}
          onSaveSquad={handleSaveSquad}
          onUpgradeTraining={handleUpgradeTraining}
          onUpdateUser={onUpdateUser}
          onCompleteClubMatch={handleCompleteClubMatch}
          onExchangeClubReward={handleExchangeClubReward}
        />
      )}



      {showStarPass && (
        <StarPassModal
          user={user}
          onUpdateUser={onUpdateUser}
          onOpenRewardPack={(tier, customName) => {
            handleOpenPackTierFromShop(tier, customName);
          }}
          onGoToCareer={() => {
            setShowStarPass(false);
            setCareerInitialTab('standings');
            setShowCareer(true);
          }}
          onGoToRanked={() => {
            setShowStarPass(false);
            setShowRanked(true);
          }}
          onClose={() => setShowStarPass(false)}
          onGoHome={() => {
            setShowStarPass(false);
            setActiveTab('home');
          }}
        />
      )}

      {showIconsModal && (
        <IconsModal
          user={user}
          onUpdateUser={onUpdateUser}
          initialChapter={iconsInitialChapter}
          onGoToShop={() => {
            setShowIconsModal(false);
            setIconsInitialChapter('ch1');
            setShowShop(true);
          }}
          onGoToTickets={() => {
            setShowIconsModal(false);
            setIconsInitialChapter('ch1');
            setTicketSpinTheme('CHAMPIONS_JUVENTUS');
            setActiveTab('tickets');
          }}
          onGoToRanked={() => {
            setShowIconsModal(false);
            setIconsInitialChapter('ch1');
            setShowRanked(true);
          }}
          onClose={() => {
            setShowIconsModal(false);
            setIconsInitialChapter('ch1');
          }}
          onGoHome={() => {
            setShowIconsModal(false);
            setIconsInitialChapter('ch1');
            setActiveTab('home');
          }}
        />
      )}

      {showAlbum && (
        <PlayerAlbumModal
          utotyUpgradedIds={user.utotyUpgradedIds}
          onClose={() => setShowAlbum(false)}
          onOpenIconsModal={() => {
            setShowAlbum(false);
            setIconsInitialChapter('ch1');
            setShowIconsModal(true);
          }}
          onOpenUltimateIconsExchange={() => {
            setShowAlbum(false);
            setIconsInitialChapter('ultimate');
            setShowIconsModal(true);
          }}
          onOpenConmebolShopPacks={() => {
            setShowAlbum(false);
            setShopInitialTab('packs');
            setShowShop(true);
          }}
          onOpenGingaSpin={() => {
            setShowAlbum(false);
            setTicketSpinTheme('GINGA');
            setActiveTab('tickets');
          }}
          onOpenGingaW1BSpin={() => {
            setShowAlbum(false);
            setTicketSpinTheme('GINGA_W1B');
            setActiveTab('tickets');
          }}
          onOpenBundesligaSpin={() => {
            setShowAlbum(false);
            setTicketSpinTheme('BUNDESLIGA');
            setActiveTab('tickets');
          }}
          onOpenJuventusSpin={() => {
            setShowAlbum(false);
            setTicketSpinTheme('CHAMPIONS_JUVENTUS');
            setActiveTab('tickets');
          }}
          onOpenRonaldoChronicles={() => {
            setShowAlbum(false);
            openComplexSection('ronaldo');
          }}
          onOpenVietnamChronicles={() => {
            setShowAlbum(false);
            openComplexSection('vietnam');
          }}
        />
      )}

      {showMailbox && (
        <MailboxModal
          mailList={mailList}
          claimedToday={claimedMailboxToday}
          onClose={() => setShowMailbox(false)}
          onClaimReward={handleClaimMail}
        />
      )}

      {showQuests && (
        <QuestsModal
          quests={quests}
          calendarClaimedDates={user.calendarClaimedDates ?? []}
          calendarUnlockTicketClaimed={Boolean(user.calendarUnlockTicketClaimed)}
          initialTab={
            (!calendarClaimedToday || calendarUnlockGiftPending) && readyQuestsCount === 0
              ? 'calendar'
              : 'quests'
          }
          onClose={() => setShowQuests(false)}
          onClaimQuest={handleClaimQuest}
          onClaimCalendarToday={handleClaimCalendarToday}
          onClaimCalendarUnlockTicket={handleClaimCalendarUnlockTicket}
        />
      )}

      {showFriends && (
        <FriendsModal
          user={user}
          presenceProfile={homePresencePayload}
          syncRevision={friendsSyncRev}
          onChallengeFriend={handleChallengeFriend}
          onRefreshBadge={(count) => setIncomingFriendReqCount(count)}
          onClose={() => setShowFriends(false)}
          onGoHome={() => {
            setShowFriends(false);
            setActiveTab('home');
          }}
        />
      )}

      {showProfileEdit && (
        <ProfileEditModal
          user={user}
          onUpdateUser={(updated) => {
            onUpdateUser(updated);
            showToast('Đã cập nhật ảnh đại diện và tên của bạn!');
          }}
          onClose={() => setShowProfileEdit(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          username={user.username}
          onClose={() => setShowSettings(false)}
          onOpenProfileEdit={() => setShowProfileEdit(true)}
          onResetStarter={onResetStarterAccount}
          onLogout={onLogout}
        />
      )}

      {showKickoff && !kickoffFinished && (
        <KickoffModal
          user={user}
          onUpdateUser={onUpdateUser}
          onNavigateAction={handleKickoffNavigate}
          onClose={() => setShowKickoff(false)}
        />
      )}

      {showOddsModalForTier && (
        <PackOddsModal
          packTier={showOddsModalForTier === 'UTOTY' ? 'A' : showOddsModalForTier}
          packTheme={oddsModalTheme}
          onClose={() => setShowOddsModalForTier(null)}
        />
      )}
    </div>
  );
};
