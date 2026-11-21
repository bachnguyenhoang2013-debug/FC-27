/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LanguageProvider } from './i18n/language';
import { IntroSplash } from './components/IntroSplash';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { ResourcePackOpeningModal } from './components/ResourcePackOpeningModal';
import { resourceRewardAnimService } from './services/resourceRewardAnim';
import {
  initialUserProfile,
  initialQuests,
  initialMail,
  STARTER_OWNED_IDS,
  STARTER_STARTER_IDS,
  STARTER_BENCH_IDS,
  LEGACY_STARTER_IDS,
  ALL_WELCOME_RANDOM_POOL_IDS,
  pickDistinctRandomIds,
  generateRandomWelcomeSquad,
  totyFeaturedPlayers,
  DEFAULT_CRAFT_INVENTORY,
} from './data/mockData';
import { UserProfile, DailyQuest, MailItem } from './types/game';
import {
  getDaily6AMCycleKey,
  formatTodayVN,
  normalizeEuro2024Daily,
  normalizeTotyDailyStreak,
  normalizeClubDaily,
  normalizeIconChroniclesDaily,
  normalizeLibertadoresState,
  normalizeVietnamChroniclesState,
  normalizeExtraTimeState,
} from './utils/dateUtils';
import {
  normalizeRankedSeasonState,
  resolveRankFromStars,
  createInitialRankedSeasonState,
} from './data/rankedData';
import {
  createInitialKickoffState,
  normalizeKickoffState,
} from './data/kickoffData';
import { normalizeBundesligaState } from './data/bundesligaData';
import { normalizeStarPassState } from './components/StarPassModal';
import { resolvePlayerWithUtotyUpgrade } from './utils/utotyUpgrade';
import {
  addOwnedPlayerCopies,
  computeUserTeamOvrFromState,
  dedupeStartersByPlayerName,
} from './utils/squadUtils';

const buildResolvedPlayerMap = (utotyUpgradedIds?: string[]) => {
  const upgradedSet = new Set(utotyUpgradedIds ?? []);
  const map = new Map<string, (typeof totyFeaturedPlayers)[number]>();
  totyFeaturedPlayers.forEach((p) => {
    if (!map.has(p.id)) {
      map.set(p.id, resolvePlayerWithUtotyUpgrade(p, upgradedSet));
    }
  });
  return map;
};

type AppScreen = 'intro' | 'login' | 'home';

const hydrateQuestsFromStorage = (
  savedQuests?: DailyQuest[],
  claimedQuestIds?: string[]
): DailyQuest[] => {
  const claimedSet = new Set(claimedQuestIds ?? []);
  const savedMap = new Map<string, DailyQuest>();
  if (Array.isArray(savedQuests)) {
    savedQuests.forEach((q) => {
      if (q && q.id) savedMap.set(q.id, q);
    });
  }
  return initialQuests.map((baseQuest) => {
    const saved = savedMap.get(baseQuest.id);
    const isClaimed = Boolean(saved?.claimed || claimedSet.has(baseQuest.id));
    const progress = saved
      ? Math.min(baseQuest.maxProgress, Math.max(baseQuest.progress, saved.progress))
      : baseQuest.progress;
    const completed = Boolean(
      isClaimed || saved?.completed || progress >= baseQuest.maxProgress
    );
    return {
      ...baseQuest,
      progress: isClaimed ? baseQuest.maxProgress : progress,
      completed,
      claimed: isClaimed,
    };
  });
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('intro');
  const [user, setUser] = useState<UserProfile>(() => {
    const currentCycleKey = getDaily6AMCycleKey();
    let localDeviceId = localStorage.getItem('fc_device_id');
    if (!localDeviceId) {
      localDeviceId = 'FC-DEV-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('fc_device_id', localDeviceId);
    }
    const defaultDeviceUsername = 'HLV_' + localDeviceId.slice(-4);

    const saved = localStorage.getItem('fc_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const resolvedUsername =
          !parsed.username || parsed.username === 'HLV_TanThu'
            ? defaultDeviceUsername
            : parsed.username;
        const resolvedDeviceId =
          !parsed.deviceId || parsed.deviceId === 'FC-DEV-88492'
            ? localDeviceId
            : parsed.deviceId;

        if (!parsed.starterVersion || parsed.starterVersion < 2) {
          localStorage.removeItem('fc_shop_claimed_free');
          const welcomeSquad = generateRandomWelcomeSquad();
          const migrated: UserProfile = {
            ...initialUserProfile,
            username: resolvedUsername,
            deviceId: resolvedDeviceId,
            deviceName: parsed.deviceName,
            loginMethod: 'device',
            starterVersion: 4,
            ovr: 80,
            ownedPlayerIds: welcomeSquad.ownedPlayerIds,
            tradeablePlayerIds: [],
            starterIds: welcomeSquad.starterIds,
            benchIds: welcomeSquad.benchIds,
            activeFormationId: '4-3-3-attack',
            dailyResetCycleKey: currentCycleKey,
            dailyCheckInClaimed: false,
            claimedQuestIds: [],
            savedQuests: initialQuests,
            euro2024Daily: normalizeEuro2024Daily(null, currentCycleKey),
            clubTokens: 0,
            clubDaily: normalizeClubDaily(null, currentCycleKey),
            iconTokens: 0,
            iconChroniclesDaily: normalizeIconChroniclesDaily(null, currentCycleKey),
            totyDailyStreak: normalizeTotyDailyStreak(null),
            rankedState: createInitialRankedSeasonState(1),
            h2hRank: 'Tập Sự · Cấp 1',
            h2hCups: 0,
            kickoffState: createInitialKickoffState(),
            calendarClaimedDates: [],
            unlockTickets: 0,
            libertadoresTokens: 0,
            libertadoresState: normalizeLibertadoresState(null, currentCycleKey),
            signatureTokens: 0,
          };
          localStorage.setItem('fc_user_profile', JSON.stringify(migrated));
          return migrated;
        }

        // Upgrade starterVersion 2/3 -> 4:
        // - Untouched v2 starter accounts get the full 23-player random 80 OVR Welcome squad (11 starters + 7 bench + 5 reserves).
        // - Existing v3 accounts automatically receive +5 additional random 80 OVR Welcome starter reserves in their club inventory.
        let migratedOwnedIds: string[] | undefined = parsed.ownedPlayerIds;
        let migratedStarterIds: string[] | undefined = parsed.starterIds;
        let migratedBenchIds: string[] | undefined = parsed.benchIds;
        let migratedOvr: number | undefined = parsed.ovr;

        if (parsed.starterVersion < 3) {
          const legacySet = new Set(LEGACY_STARTER_IDS);
          const welcomeSquad = generateRandomWelcomeSquad();
          const existingOwned: string[] = Array.isArray(parsed.ownedPlayerIds)
            ? parsed.ownedPlayerIds
            : [];
          const hasNonLegacyCards = existingOwned.some((id) => !legacySet.has(id));

          if (
            !hasNonLegacyCards &&
            (parsed.ticketsOpenedCount ?? 0) === 0 &&
            (parsed.careerMatchesPlayed ?? 0) === 0
          ) {
            migratedOwnedIds = welcomeSquad.ownedPlayerIds;
            migratedStarterIds = welcomeSquad.starterIds;
            migratedBenchIds = welcomeSquad.benchIds;
            migratedOvr = 80;
          } else {
            const keptOwned = existingOwned.filter((id) => !legacySet.has(id));
            migratedOwnedIds = addOwnedPlayerCopies(
              keptOwned,
              welcomeSquad.ownedPlayerIds
            );
            if (Array.isArray(parsed.starterIds) && parsed.starterIds.length === 11) {
              const usedInLineup = new Set<string>();
              const nextStarters: string[] = parsed.starterIds.map(
                (id: string, idx: number) => {
                  if (!legacySet.has(id)) {
                    usedInLineup.add(id);
                    return id;
                  }
                  const replacement =
                    welcomeSquad.starterIds[idx] || 'welcome_st_ishowspeed_80';
                  usedInLineup.add(replacement);
                  return replacement;
                }
              );
              migratedStarterIds = nextStarters;
              const ovrById = new Map(totyFeaturedPlayers.map((p) => [p.id, p.ovr]));
              const avgBase = Math.round(
                nextStarters.reduce((s, id) => s + (ovrById.get(id) ?? 80), 0) / 11
              );
              const trainBonus = Math.floor((parsed.trainingLevel ?? 0) / 5);
              migratedOvr = Math.max(parsed.ovr ?? 80, avgBase + trainBonus);
            } else {
              migratedStarterIds = welcomeSquad.starterIds;
            }
            if (Array.isArray(parsed.benchIds) && parsed.benchIds.length > 0) {
              const starterLookup = new Set(migratedStarterIds);
              const usedBench = new Set<string>(starterLookup);
              migratedBenchIds = parsed.benchIds.map((id: string, idx: number) => {
                if (!legacySet.has(id) && !usedBench.has(id)) {
                  usedBench.add(id);
                  return id;
                }
                const candidate =
                  welcomeSquad.benchIds[idx] ||
                  welcomeSquad.ownedPlayerIds.find((wId) => !usedBench.has(wId)) ||
                  id;
                usedBench.add(candidate);
                return candidate;
              });
            } else {
              migratedBenchIds = welcomeSquad.benchIds;
            }
          }
        } else if (parsed.starterVersion < 4) {
          const existingOwned: string[] = Array.isArray(parsed.ownedPlayerIds)
            ? parsed.ownedPlayerIds
            : [];
          const usedWelcomeSet = new Set<string>(existingOwned);
          const extraStarterReserves = pickDistinctRandomIds(
            ALL_WELCOME_RANDOM_POOL_IDS,
            5,
            usedWelcomeSet
          );
          migratedOwnedIds = addOwnedPlayerCopies(
            existingOwned,
            extraStarterReserves
          );
        }

        // Global 06:00 AM daily reset check across all daily events & activities
        const isSameDailyCycle = parsed.dailyResetCycleKey === currentCycleKey;
        const parsedClaimedQuests =
          isSameDailyCycle && Array.isArray(parsed.claimedQuestIds)
            ? parsed.claimedQuestIds
            : [];
        const hydratedQuests = isSameDailyCycle
          ? hydrateQuestsFromStorage(parsed.savedQuests, parsedClaimedQuests)
          : hydrateQuestsFromStorage(initialQuests, []);

        const hydratedUser: UserProfile = {
          ...initialUserProfile,
          ...parsed,
          starterVersion: 4,
          ovr: migratedOvr ?? parsed.ovr ?? 80,
          username: resolvedUsername,
          deviceId: resolvedDeviceId,
          teamLogo: parsed.teamLogo || initialUserProfile.teamLogo,
          loginMethod: 'device',
          tickets: parsed.tickets ?? initialUserProfile.tickets,
          ownedPlayerIds: migratedOwnedIds?.length ? migratedOwnedIds : STARTER_OWNED_IDS,
          starterIds: migratedStarterIds?.length === 11 ? migratedStarterIds : STARTER_STARTER_IDS,
          benchIds: migratedBenchIds?.length ? migratedBenchIds : STARTER_BENCH_IDS,
          activeFormationId: parsed.activeFormationId || '4-3-3-attack',
          totyTokens: parsed.totyTokens ?? 0,
          careerMatchesPlayed: parsed.careerMatchesPlayed ?? 0,
          ticketsOpenedCount: parsed.ticketsOpenedCount ?? 0,
          totyClaimedIds: Array.isArray(parsed.totyClaimedIds) ? parsed.totyClaimedIds : [],
          craftInventory: {
            leagues: {
              ...DEFAULT_CRAFT_INVENTORY.leagues,
              ...(parsed.craftInventory?.leagues || {}),
            },
            positions: {
              ...DEFAULT_CRAFT_INVENTORY.positions,
              ...(parsed.craftInventory?.positions || {}),
            },
          },
          pendingCraft: parsed.pendingCraft ?? null,
          trainingLevel: parsed.trainingLevel ?? 0,
          totyShards: parsed.totyShards ?? 0,
          minigameTickets: parsed.minigameTickets ?? 0,
          lastMinigameTicketDate: parsed.lastMinigameTicketDate ?? '',
          lastMailboxClaimDate: parsed.lastMailboxClaimDate ?? '',
          claimedMailIds: Array.isArray(parsed.claimedMailIds) ? parsed.claimedMailIds : [],
          dailyResetCycleKey: currentCycleKey,
          dailyCheckInClaimed: isSameDailyCycle ? Boolean(parsed.dailyCheckInClaimed) : false,
          claimedQuestIds: isSameDailyCycle
            ? Array.from(
                new Set([
                  ...parsedClaimedQuests,
                  ...hydratedQuests.filter((q) => q.claimed).map((q) => q.id),
                ])
              )
            : [],
          savedQuests: hydratedQuests,
          redeemedCodes: Array.isArray(parsed.redeemedCodes) ? parsed.redeemedCodes : [],
          utotyUpgradedIds: Array.isArray(parsed.utotyUpgradedIds) ? parsed.utotyUpgradedIds : [],
          vanDerSarBoxClaimedIds: Array.isArray(parsed.vanDerSarBoxClaimedIds)
            ? parsed.vanDerSarBoxClaimedIds
            : [],
          gingaBoxClaimedIds: Array.isArray(parsed.gingaBoxClaimedIds)
            ? parsed.gingaBoxClaimedIds
            : [],
          starPass: normalizeStarPassState(parsed.starPass),
          clubTokens: parsed.clubTokens ?? 0,
          clubDaily: normalizeClubDaily(parsed.clubDaily, currentCycleKey),
          iconTokens: parsed.iconTokens ?? 0,
          iconChroniclesDaily: normalizeIconChroniclesDaily(
            parsed.iconChroniclesDaily,
            currentCycleKey
          ),
          euro2024Daily: normalizeEuro2024Daily(parsed.euro2024Daily, currentCycleKey),
          totyDailyStreak: normalizeTotyDailyStreak(parsed.totyDailyStreak),
          rankedState: normalizeRankedSeasonState(parsed.rankedState),
          kickoffState: normalizeKickoffState(parsed.kickoffState),
          calendarClaimedDates: Array.isArray(parsed.calendarClaimedDates)
            ? parsed.calendarClaimedDates
            : [],
          unlockTickets: parsed.unlockTickets ?? 0,
          libertadoresTokens: parsed.libertadoresTokens ?? 0,
          libertadoresState: normalizeLibertadoresState(
            parsed.libertadoresState,
            currentCycleKey
          ),
          signatureTokens: Math.max(parsed.signatureTokens ?? 0, 1),
          vietnamShards: parsed.vietnamShards ?? 0,
          vietnamChronicles: normalizeVietnamChroniclesState(
            parsed.vietnamChronicles,
            currentCycleKey
          ),
          matchSkipPasses: parsed.matchSkipPasses ?? 0,
          activeManager: parsed.activeManager ?? null,
          ballonDorStreakClaimedSteps: Array.isArray(parsed.ballonDorStreakClaimedSteps)
            ? parsed.ballonDorStreakClaimedSteps
            : [],
          extraTimeTokens: parsed.extraTimeTokens ?? 0,
          extraTime: normalizeExtraTimeState(parsed.extraTime, currentCycleKey),
          bundesligaState: normalizeBundesligaState(parsed.bundesligaState, currentCycleKey),
        };
        const rkInfo = resolveRankFromStars(
          hydratedUser.rankedState?.totalStars ?? 0,
          hydratedUser.rankedState?.hasReachedChampion ?? false
        );
        hydratedUser.h2hRank = rkInfo.fullLabel;
        hydratedUser.h2hCups = hydratedUser.rankedState?.totalStars ?? 0;
        const resolvedMap = buildResolvedPlayerMap(hydratedUser.utotyUpgradedIds);
        hydratedUser.starterIds = dedupeStartersByPlayerName(
          hydratedUser.starterIds ?? STARTER_STARTER_IDS,
          [
            ...(hydratedUser.benchIds ?? []),
            ...(hydratedUser.ownedPlayerIds ?? []),
            ...STARTER_OWNED_IDS,
          ],
          resolvedMap
        );
        hydratedUser.ovr = computeUserTeamOvrFromState(
          hydratedUser,
          resolvedMap
        ).totalOvr;

        localStorage.setItem('fc_user_profile', JSON.stringify(hydratedUser));
        return hydratedUser;
      } catch {
        const welcomeSquad = generateRandomWelcomeSquad();
        const freshFallback: UserProfile = {
          ...initialUserProfile,
          username: defaultDeviceUsername,
          deviceId: localDeviceId,
          starterVersion: 4,
          ovr: 80,
          ownedPlayerIds: welcomeSquad.ownedPlayerIds,
          tradeablePlayerIds: [],
          starterIds: welcomeSquad.starterIds,
          benchIds: welcomeSquad.benchIds,
          dailyResetCycleKey: currentCycleKey,
          clubTokens: 0,
          clubDaily: normalizeClubDaily(null, currentCycleKey),
          iconTokens: 0,
          iconChroniclesDaily: normalizeIconChroniclesDaily(null, currentCycleKey),
          euro2024Daily: normalizeEuro2024Daily(null, currentCycleKey),
          totyDailyStreak: normalizeTotyDailyStreak(null),
          rankedState: createInitialRankedSeasonState(1),
          h2hRank: 'Tập Sự · Cấp 1',
          h2hCups: 0,
          kickoffState: createInitialKickoffState(),
          unlockTickets: 0,
          libertadoresTokens: 0,
          libertadoresState: normalizeLibertadoresState(null, currentCycleKey),
          signatureTokens: 0,
          vietnamShards: 0,
          vietnamChronicles: normalizeVietnamChroniclesState(null, currentCycleKey),
          gingaBoxClaimedIds: [],
          starPass: normalizeStarPassState(undefined),
          matchSkipPasses: 0,
          activeManager: null,
          ballonDorStreakClaimedSteps: [],
          extraTimeTokens: 0,
          extraTime: normalizeExtraTimeState(null, currentCycleKey),
          bundesligaState: normalizeBundesligaState(null, currentCycleKey),
        };
        freshFallback.ovr = computeUserTeamOvrFromState(
          freshFallback,
          buildResolvedPlayerMap(freshFallback.utotyUpgradedIds)
        ).totalOvr;
        localStorage.setItem('fc_user_profile', JSON.stringify(freshFallback));
        return freshFallback;
      }
    }
    const welcomeSquad = generateRandomWelcomeSquad();
    const freshUser: UserProfile = {
      ...initialUserProfile,
      username: defaultDeviceUsername,
      deviceId: localDeviceId,
      starterVersion: 4,
      ovr: 80,
      ownedPlayerIds: welcomeSquad.ownedPlayerIds,
      tradeablePlayerIds: [],
      starterIds: welcomeSquad.starterIds,
      benchIds: welcomeSquad.benchIds,
      dailyResetCycleKey: currentCycleKey,
      clubTokens: 0,
      clubDaily: normalizeClubDaily(null, currentCycleKey),
      iconTokens: 0,
      iconChroniclesDaily: normalizeIconChroniclesDaily(null, currentCycleKey),
      euro2024Daily: normalizeEuro2024Daily(null, currentCycleKey),
      totyDailyStreak: normalizeTotyDailyStreak(null),
      rankedState: createInitialRankedSeasonState(1),
      h2hRank: 'Tập Sự · Cấp 1',
      h2hCups: 0,
      kickoffState: createInitialKickoffState(),
      calendarClaimedDates: [],
      unlockTickets: 0,
      libertadoresTokens: 0,
      libertadoresState: normalizeLibertadoresState(null, currentCycleKey),
      signatureTokens: 0,
      vietnamShards: 0,
      vietnamChronicles: normalizeVietnamChroniclesState(null, currentCycleKey),
      gingaBoxClaimedIds: [],
      starPass: normalizeStarPassState(undefined),
      matchSkipPasses: 0,
      activeManager: null,
      ballonDorStreakClaimedSteps: [],
      extraTimeTokens: 0,
      extraTime: normalizeExtraTimeState(null, currentCycleKey),
      bundesligaState: normalizeBundesligaState(null, currentCycleKey),
    };
    freshUser.ovr = computeUserTeamOvrFromState(
      freshUser,
      buildResolvedPlayerMap(freshUser.utotyUpgradedIds)
    ).totalOvr;
    localStorage.setItem('fc_user_profile', JSON.stringify(freshUser));
    return freshUser;
  });

  const [quests, setQuests] = useState<DailyQuest[]>(() =>
    hydrateQuestsFromStorage(user.savedQuests, user.claimedQuestIds)
  );

  // Register coach on server directory immediately on app mount (even before login/playing any match)
  useEffect(() => {
    const rk = resolveRankFromStars(
      user.rankedState?.totalStars ?? 0,
      user.rankedState?.hasReachedChampion ?? false
    );
    const rankedPlayed =
      (user.rankedState?.wins ?? 0) +
      (user.rankedState?.draws ?? 0) +
      (user.rankedState?.losses ?? 0);
    const totalMatchesPlayed = (user.careerMatchesPlayed ?? 0) + rankedPlayed;
    fetch('/api/friends/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          clientId: user.deviceId || user.username,
          username: user.username,
          teamName: user.teamName,
          teamLogo: user.teamLogo,
          ovr: user.ovr,
          tierIndex: rk.tierIndex,
          rankLabel: rk.fullLabel,
          rankLogoUrl: rk.logoUrl,
          matchesPlayed: totalMatchesPlayed,
        },
      }),
    }).catch(() => {
      // ignore transient network errors
    });
  }, [
    user.username,
    user.deviceId,
    user.teamName,
    user.teamLogo,
    user.ovr,
    user.careerMatchesPlayed,
    user.rankedState?.wins,
    user.rankedState?.draws,
    user.rankedState?.losses,
    user.rankedState?.totalStars,
    user.rankedState?.hasReachedChampion,
  ]);

  // Live 06:00 AM watcher: automatically resets all daily activities & events if the clock crosses 06:00 AM
  useEffect(() => {
    const check6AMReset = () => {
      const activeCycle = getDaily6AMCycleKey();
      const nowMs = Date.now();
      setUser((prev) => {
        const rankedExpired =
          Boolean(prev.rankedState) && nowMs >= (prev.rankedState?.seasonEndsAt ?? 0);
        const streakExpired =
          Boolean(prev.totyDailyStreak) && nowMs >= (prev.totyDailyStreak?.eventEndsAt ?? 0);
        const syncedOvrNow = computeUserTeamOvrFromState(
          prev,
          buildResolvedPlayerMap(prev.utotyUpgradedIds),
          nowMs
        ).totalOvr;
        const managerOvrChanged = syncedOvrNow !== prev.ovr;

        if (
          prev.dailyResetCycleKey === activeCycle &&
          !rankedExpired &&
          !streakExpired &&
          !managerOvrChanged
        ) {
          return prev;
        }
        const nextRanked = normalizeRankedSeasonState(prev.rankedState, nowMs);
        const nextStreak = normalizeTotyDailyStreak(prev.totyDailyStreak, nowMs);
        const rkInfo = resolveRankFromStars(
          nextRanked.totalStars,
          nextRanked.hasReachedChampion
        );

        if (
          prev.dailyResetCycleKey === activeCycle &&
          (rankedExpired || streakExpired || managerOvrChanged)
        ) {
          const updatedTimersOnly: UserProfile = {
            ...prev,
            ovr: syncedOvrNow,
            totyDailyStreak: nextStreak,
            rankedState: nextRanked,
            h2hRank: rkInfo.fullLabel,
            h2hCups: nextRanked.totalStars,
          };
          localStorage.setItem('fc_user_profile', JSON.stringify(updatedTimersOnly));
          return updatedTimersOnly;
        }

        const resetQuests = hydrateQuestsFromStorage(initialQuests, []);
        setQuests(resetQuests);
        const updated: UserProfile = {
          ...prev,
          ovr: syncedOvrNow,
          dailyResetCycleKey: activeCycle,
          dailyCheckInClaimed: false,
          claimedQuestIds: [],
          savedQuests: resetQuests,
          clubDaily: normalizeClubDaily(null, activeCycle),
          iconChroniclesDaily: normalizeIconChroniclesDaily(null, activeCycle),
          euro2024Daily: normalizeEuro2024Daily(null, activeCycle),
          libertadoresState: normalizeLibertadoresState(prev.libertadoresState, activeCycle),
          vietnamChronicles: normalizeVietnamChroniclesState(
            prev.vietnamChronicles,
            activeCycle
          ),
          totyDailyStreak: nextStreak,
          rankedState: nextRanked,
          h2hRank: rkInfo.fullLabel,
          h2hCups: nextRanked.totalStars,
        };
        localStorage.setItem('fc_user_profile', JSON.stringify(updated));
        return updated;
      });
    };

    check6AMReset();
    const interval = setInterval(check6AMReset, 15000);
    return () => clearInterval(interval);
  }, []);

  const prevResourcesRef = useRef({
    coins: user.coins ?? 0,
    gems: user.gems ?? 0,
    totyTokens: user.totyTokens ?? 0,
    clubTokens: user.clubTokens ?? 0,
    libertadoresTokens: user.libertadoresTokens ?? 0,
    unlockTickets: user.unlockTickets ?? 0,
    tickets: (user.tickets ?? 0) + (user.futureStarsTickets ?? 0),
    screen: currentScreen,
  });

  useEffect(() => {
    const prev = prevResourcesRef.current;
    const curCoins = user.coins ?? 0;
    const curGems = user.gems ?? 0;
    const curTotyTokens = user.totyTokens ?? 0;
    const curClubTokens = user.clubTokens ?? 0;
    const curLibertadoresTokens = user.libertadoresTokens ?? 0;
    const curUnlockTickets = user.unlockTickets ?? 0;
    const curTickets = (user.tickets ?? 0) + (user.futureStarsTickets ?? 0);

    // Only play pack animation during active gameplay on the home screen (not during login hydration)
    if (currentScreen === 'home' && prev.screen === 'home') {
      const coinsGain = Math.max(0, curCoins - prev.coins);
      const gemsGain = Math.max(0, curGems - prev.gems);
      const totyTokensGain = Math.max(0, curTotyTokens - prev.totyTokens);
      const clubTokensGain = Math.max(0, curClubTokens - prev.clubTokens);
      const libertadoresTokensGain = Math.max(
        0,
        curLibertadoresTokens - prev.libertadoresTokens
      );
      const unlockTicketsGain = Math.max(0, curUnlockTickets - prev.unlockTickets);
      const ticketsGain = Math.max(0, curTickets - prev.tickets);

      if (
        coinsGain > 0 ||
        gemsGain > 0 ||
        totyTokensGain > 0 ||
        clubTokensGain > 0 ||
        libertadoresTokensGain > 0 ||
        unlockTicketsGain > 0 ||
        ticketsGain > 0
      ) {
        resourceRewardAnimService.enqueue({
          coins: coinsGain,
          gems: gemsGain,
          totyTokens: totyTokensGain,
          clubTokens: clubTokensGain,
          libertadoresTokens: libertadoresTokensGain,
          unlockTickets: unlockTicketsGain,
          tickets: ticketsGain,
        });
      }
    }

    prevResourcesRef.current = {
      coins: curCoins,
      gems: curGems,
      totyTokens: curTotyTokens,
      clubTokens: curClubTokens,
      libertadoresTokens: curLibertadoresTokens,
      unlockTickets: curUnlockTickets,
      tickets: curTickets,
      screen: currentScreen,
    };
  }, [
    user.coins,
    user.gems,
    user.totyTokens,
    user.clubTokens,
    user.libertadoresTokens,
    user.unlockTickets,
    user.tickets,
    user.futureStarsTickets,
    currentScreen,
  ]);

  const claimedMailSet = new Set(user.claimedMailIds ?? []);
  const hasClaimedSupplyMail =
    claimedMailSet.has('m_toty_supply') ||
    Array.from(claimedMailSet).some((id) => id.startsWith('daily_inbox_'));

  const supplyInboxMail: MailItem = {
    id: 'm_toty_supply',
    title: 'Quà Tiếp Tế Hộp Tin TOTY 26',
    sender: 'Ban Điều Hành Sự Kiện TOTY',
    date: formatTodayVN(),
    content:
      'Quà tiếp tế đặc biệt dành cho Huấn Luyện Viên! Lưu ý: Mỗi tin nhắn trong hòm thư chỉ được sử dụng đúng 1 lần duy nhất (hàng ngày làm mới lượt lúc 06:00 sáng).',
    rewards: { coins: 35000, gems: 100, tickets: 1 },
    claimed: hasClaimedSupplyMail,
  };

  const mailList: MailItem[] = [
    supplyInboxMail,
    ...initialMail.map((m) => ({
      ...m,
      claimed: claimedMailSet.has(m.id),
    })),
  ];

  const handleIntroComplete = () => {
    setCurrentScreen('login');
  };

  const handleLoginSuccess = (loginData: Partial<UserProfile>) => {
    const activeCycle = getDaily6AMCycleKey();
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        ...loginData,
        loginMethod: 'device',
        starterVersion: 2,
        dailyResetCycleKey: prev.dailyResetCycleKey || activeCycle,
        clubDaily: normalizeClubDaily(prev.clubDaily, activeCycle),
        euro2024Daily: normalizeEuro2024Daily(prev.euro2024Daily, activeCycle),
        libertadoresState: normalizeLibertadoresState(prev.libertadoresState, activeCycle),
        vietnamChronicles: normalizeVietnamChroniclesState(
          prev.vietnamChronicles,
          activeCycle
        ),
        totyDailyStreak: normalizeTotyDailyStreak(prev.totyDailyStreak),
        kickoffState: normalizeKickoffState(prev.kickoffState),
        starPass: normalizeStarPassState(loginData.starPass ?? prev.starPass),
        gingaBoxClaimedIds: Array.isArray(loginData.gingaBoxClaimedIds)
          ? loginData.gingaBoxClaimedIds
          : Array.isArray(prev.gingaBoxClaimedIds)
          ? prev.gingaBoxClaimedIds
          : [],
      };
      localStorage.setItem('fc_user_profile', JSON.stringify(updated));
      return updated;
    });
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  const handleUpdateUser = (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => {
    setUser((prev) => {
      const activeCycle = getDaily6AMCycleKey();
      const patch = typeof updater === 'function' ? updater(prev) : updater;
      const merged: UserProfile = {
        ...prev,
        ...patch,
        loginMethod: 'device',
        starterVersion: prev.starterVersion ?? 4,
        dailyResetCycleKey: activeCycle,
      };

      const ovrInputsChanged =
        patch.starterIds !== undefined ||
        patch.activeFormationId !== undefined ||
        patch.trainingLevel !== undefined ||
        patch.playStyle !== undefined ||
        patch.activeManager !== undefined ||
        patch.utotyUpgradedIds !== undefined ||
        patch.ovr !== undefined;

      if (ovrInputsChanged) {
        const resolvedMap = buildResolvedPlayerMap(merged.utotyUpgradedIds);
        if (patch.starterIds !== undefined && Array.isArray(merged.starterIds)) {
          merged.starterIds = dedupeStartersByPlayerName(
            merged.starterIds,
            [
              ...(merged.benchIds ?? []),
              ...(merged.ownedPlayerIds ?? []),
              ...STARTER_OWNED_IDS,
            ],
            resolvedMap
          );
        }
        merged.ovr = computeUserTeamOvrFromState(merged, resolvedMap).totalOvr;
      }

      // Automatically track positive TOTY Token gains toward EURO 2024 Challenge 3 ("Nhận ít nhất 10 token TOTY")
      const prevTokens = prev.totyTokens ?? 0;
      const nextTokens = merged.totyTokens ?? 0;
      const tokenGain = Math.max(0, nextTokens - prevTokens);

      const baseEuroDaily = normalizeEuro2024Daily(merged.euro2024Daily, activeCycle);

      const patchManuallyUpdatedTokensEarned =
        patch.euro2024Daily !== undefined &&
        patch.euro2024Daily.totyTokensEarned !== (prev.euro2024Daily?.totyTokensEarned ?? 0);

      merged.euro2024Daily =
        tokenGain > 0 && !patchManuallyUpdatedTokensEarned
          ? {
              ...baseEuroDaily,
              totyTokensEarned: baseEuroDaily.totyTokensEarned + tokenGain,
            }
          : baseEuroDaily;

      merged.clubDaily = normalizeClubDaily(merged.clubDaily, activeCycle);
      merged.libertadoresState = normalizeLibertadoresState(
        merged.libertadoresState,
        activeCycle
      );

      // Automatically track activity deltas for the 7-Day New Player Kickoff Event
      const baseKickoff = normalizeKickoffState(merged.kickoffState);
      const prevSpins = prev.ticketsOpenedCount ?? 0;
      const nextSpins = merged.ticketsOpenedCount ?? 0;
      const spinGain = Math.max(0, nextSpins - prevSpins);

      const prevCareer = prev.careerMatchesPlayed ?? 0;
      const nextCareer = merged.careerMatchesPlayed ?? 0;
      const careerGain = Math.max(0, nextCareer - prevCareer);

      const prevRankedPlayed =
        (prev.rankedState?.wins ?? 0) +
        (prev.rankedState?.draws ?? 0) +
        (prev.rankedState?.losses ?? 0);
      const nextRankedPlayed =
        (merged.rankedState?.wins ?? 0) +
        (merged.rankedState?.draws ?? 0) +
        (merged.rankedState?.losses ?? 0);
      const rankedGain = Math.max(0, nextRankedPlayed - prevRankedPlayed);

      const prevClubPlayed = prev.clubDaily?.matchesPlayed ?? 0;
      const nextClubPlayed = merged.clubDaily?.matchesPlayed ?? 0;
      const clubGain = Math.max(0, nextClubPlayed - prevClubPlayed);

      const prevTraining = prev.trainingLevel ?? 0;
      const nextTraining = merged.trainingLevel ?? 0;
      const trainingGain = Math.max(0, nextTraining - prevTraining);

      const squadChanged =
        (patch.starterIds !== undefined &&
          JSON.stringify(patch.starterIds) !== JSON.stringify(prev.starterIds)) ||
        (patch.activeFormationId !== undefined &&
          patch.activeFormationId !== prev.activeFormationId);

      const playStyleChanged =
        patch.playStyle !== undefined && patch.playStyle !== prev.playStyle;

      const iconActionOccurred =
        (merged.iconTokens ?? 0) > (prev.iconTokens ?? 0) ||
        (Boolean(merged.iconChroniclesDaily?.quizCompleted) &&
          !Boolean(prev.iconChroniclesDaily?.quizCompleted));

      const redeemedCodeAdded =
        (merged.redeemedCodes?.length ?? 0) > (prev.redeemedCodes?.length ?? 0);

      merged.kickoffState = {
        ...baseKickoff,
        spinsOpened: (baseKickoff.spinsOpened ?? 0) + spinGain,
        careerMatches: (baseKickoff.careerMatches ?? 0) + careerGain,
        rankedMatches: (baseKickoff.rankedMatches ?? 0) + rankedGain,
        clubMatches: (baseKickoff.clubMatches ?? 0) + clubGain,
        trainingUpgrades: (baseKickoff.trainingUpgrades ?? 0) + trainingGain,
        squadEdits: (baseKickoff.squadEdits ?? 0) + (squadChanged ? 1 : 0),
        playStyleChanges:
          (baseKickoff.playStyleChanges ?? 0) + (playStyleChanged ? 1 : 0),
        iconActions: (baseKickoff.iconActions ?? 0) + (iconActionOccurred ? 1 : 0),
        shopActions: (baseKickoff.shopActions ?? 0) + (redeemedCodeAdded ? 1 : 0),
        totyTokensEarned: (baseKickoff.totyTokensEarned ?? 0) + tokenGain,
      };

      localStorage.setItem('fc_user_profile', JSON.stringify(merged));
      return merged;
    });
  };

  const handleUpdateQuests = (
    updater: DailyQuest[] | ((prev: DailyQuest[]) => DailyQuest[])
  ) => {
    setQuests((prevQuests) => {
      const rawNext = typeof updater === 'function' ? updater(prevQuests) : updater;
      const prevClaimed = new Set(
        prevQuests.filter((q) => q.claimed).map((q) => q.id)
      );
      const lockedNext = rawNext.map((q) =>
        prevClaimed.has(q.id) ? { ...q, completed: true, claimed: true } : q
      );

      setUser((prevUser) => {
        const mergedClaimedIds = Array.from(
          new Set([
            ...(prevUser.claimedQuestIds ?? []),
            ...lockedNext.filter((q) => q.claimed).map((q) => q.id),
          ])
        );
        const nextUser: UserProfile = {
          ...prevUser,
          claimedQuestIds: mergedClaimedIds,
          savedQuests: lockedNext,
        };
        localStorage.setItem('fc_user_profile', JSON.stringify(nextUser));
        return nextUser;
      });

      return lockedNext;
    });
  };

  const handleResetStarterAccount = () => {
    const activeCycle = getDaily6AMCycleKey();
    localStorage.removeItem('fc_premier_league_career_v2');
    localStorage.removeItem('fc_shop_claimed_free');
    setQuests(initialQuests);
    setUser((prev) => {
      const welcomeSquad = generateRandomWelcomeSquad();
      const resetUser: UserProfile = {
        ...initialUserProfile,
        username: prev.username,
        deviceId: prev.deviceId,
        deviceName: prev.deviceName,
        loginMethod: 'device',
        starterVersion: 4,
        ovr: 80,
        ownedPlayerIds: welcomeSquad.ownedPlayerIds,
        tradeablePlayerIds: [],
        starterIds: welcomeSquad.starterIds,
        benchIds: welcomeSquad.benchIds,
        activeFormationId: '4-3-3-attack',
        totyTokens: 0,
        careerMatchesPlayed: 0,
        ticketsOpenedCount: 0,
        totyClaimedIds: [],
        craftInventory: {
          leagues: { ...DEFAULT_CRAFT_INVENTORY.leagues },
          positions: { ...DEFAULT_CRAFT_INVENTORY.positions },
        },
        pendingCraft: null,
        trainingLevel: 0,
        totyShards: 0,
        minigameTickets: 0,
        lastMinigameTicketDate: '',
        lastMailboxClaimDate: '',
        claimedMailIds: [],
        dailyResetCycleKey: activeCycle,
        dailyCheckInClaimed: false,
        claimedQuestIds: [],
        savedQuests: initialQuests,
        redeemedCodes: [],
        clubTokens: 0,
        clubDaily: normalizeClubDaily(null, activeCycle),
        euro2024Daily: normalizeEuro2024Daily(null, activeCycle),
        totyDailyStreak: normalizeTotyDailyStreak(null),
        rankedState: createInitialRankedSeasonState(1),
        h2hRank: 'Tập Sự · Cấp 1',
        h2hCups: 0,
        kickoffState: createInitialKickoffState(),
        calendarClaimedDates: [],
        unlockTickets: 0,
        libertadoresTokens: 0,
        libertadoresState: normalizeLibertadoresState(null, activeCycle),
        signatureTokens: 0,
        vietnamShards: 0,
        vietnamChronicles: normalizeVietnamChroniclesState(null, activeCycle),
        gingaBoxClaimedIds: [],
        starPass: normalizeStarPassState(undefined),
        matchSkipPasses: 0,
        activeManager: null,
        ballonDorStreakClaimedSteps: [],
        extraTimeTokens: 0,
        extraTime: normalizeExtraTimeState(null, activeCycle),
      };
      resetUser.ovr = computeUserTeamOvrFromState(
        resetUser,
        buildResolvedPlayerMap(resetUser.utotyUpgradedIds)
      ).totalOvr;
      localStorage.setItem('fc_user_profile', JSON.stringify(resetUser));
      return resetUser;
    });
  };

  return (
    <LanguageProvider>
      <div className="w-screen h-screen overflow-hidden bg-black text-white select-none font-cruyff">
        {currentScreen === 'intro' && (
          <IntroSplash onComplete={handleIntroComplete} />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            currentUser={user}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {currentScreen === 'home' && (
          <>
            <HomeScreen
              user={user}
              onUpdateUser={handleUpdateUser}
              onResetStarterAccount={handleResetStarterAccount}
              onLogout={handleLogout}
              quests={quests}
              onUpdateQuests={handleUpdateQuests}
              mailList={mailList}
            />
            <ResourcePackOpeningModal />
          </>
        )}
      </div>
    </LanguageProvider>
  );
}
