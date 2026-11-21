import {
  ClubDailyProgress,
  ConmebolLibertadoresState,
  Euro2024DailyProgress,
  ExtraTimeState,
  GingaState,
  IconChroniclesDailyProgress,
  RonaldoChroniclesState,
  TotyDailyStreakState,
  VietnamChroniclesState,
} from '../types/game';

/**
 * Returns daily cycle key YYYY-MM-DD that resets every morning at 06:00:00 local time.
 * Any time before 06:00 AM belongs to the previous day's 06:00 AM cycle.
 */
export function getDaily6AMCycleKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Unified daily key across all daily activities & events — resets at 06:00 AM local time.
 */
export function getTodayDateKey(now: Date = new Date()): string {
  return getDaily6AMCycleKey(now);
}

export function formatTodayVN(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Alias for 06:00 AM cycle key used by Future Stars & EURO 2024 daily events.
 */
export function getFutureStarsCycleKey(now: Date = new Date()): string {
  return getDaily6AMCycleKey(now);
}

/**
 * Returns local timestamp (ms) of the start of the active 06:00:00 AM daily cycle.
 */
export function getStartOfCurrent6AMCycleMs(now: Date = new Date()): number {
  const anchor = new Date(now);
  anchor.setHours(6, 0, 0, 0);
  if (now.getTime() < anchor.getTime()) {
    anchor.setDate(anchor.getDate() - 1);
  }
  return anchor.getTime();
}

export const TOTY_STREAK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalizes TOTY 7-Day Daily Streak:
 * - Resets the entire 7-day streak every 7 days (anchored to 06:00 AM).
 * - Each day resets at 06:00 AM via getDaily6AMCycleKey().
 */
export function normalizeTotyDailyStreak(
  raw?: TotyDailyStreakState | null,
  nowMs: number = Date.now()
): TotyDailyStreakState {
  if (
    !raw ||
    !raw.eventStartedAt ||
    !raw.eventEndsAt ||
    nowMs >= raw.eventEndsAt
  ) {
    const startMs = getStartOfCurrent6AMCycleMs(new Date(nowMs));
    return {
      eventStartedAt: startMs,
      eventEndsAt: startMs + TOTY_STREAK_DURATION_MS,
      claimedDays: 0,
      lastClaimCycleKey: '',
    };
  }
  return {
    eventStartedAt: raw.eventStartedAt,
    eventEndsAt: raw.eventEndsAt,
    claimedDays: Math.max(0, Math.min(7, raw.claimedDays ?? 0)),
    lastClaimCycleKey: raw.lastClaimCycleKey ?? '',
  };
}

/**
 * Formats remaining time until the 7-day TOTY Daily Streak full reset.
 */
export function formatSevenDayCountdown(
  endsAtMs: number,
  nowMs: number = Date.now()
): string {
  const diffSec = Math.max(0, Math.floor((endsAtMs - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = String(Math.floor((diffSec % 86400) / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  if (days > 0) {
    return `${days} ngày ${hours}:${mins}:${secs}`;
  }
  return `${hours}:${mins}:${secs}`;
}

/**
 * Normalizes EURO 2024 daily progress against the active 06:00 AM cycle key.
 */
export function normalizeEuro2024Daily(
  raw?: Euro2024DailyProgress | null,
  cycleKey: string = getDaily6AMCycleKey()
): Euro2024DailyProgress {
  if (!raw || raw.cycleKey !== cycleKey) {
    return {
      cycleKey,
      euroSpinsOpened: 0,
      careerMatchesPlayed: 0,
      totyTokensEarned: 0,
      rewardClaimed: false,
    };
  }
  return {
    cycleKey,
    euroSpinsOpened: Math.max(0, raw.euroSpinsOpened ?? 0),
    careerMatchesPlayed: Math.max(0, raw.careerMatchesPlayed ?? 0),
    totyTokensEarned: Math.max(0, raw.totyTokensEarned ?? 0),
    rewardClaimed: Boolean(raw.rewardClaimed),
    lastRewardTickets: raw.lastRewardTickets,
  };
}

/**
 * Normalizes Club Key Match daily progress (2 matches/day, resets at 06:00 AM local time).
 */
export function normalizeClubDaily(
  raw?: ClubDailyProgress | null,
  cycleKey: string = getDaily6AMCycleKey()
): ClubDailyProgress {
  if (!raw || raw.cycleKey !== cycleKey) {
    return {
      cycleKey,
      matchesPlayed: 0,
      history: [],
    };
  }
  return {
    cycleKey,
    matchesPlayed: Math.max(0, Math.min(2, raw.matchesPlayed ?? 0)),
    history: Array.isArray(raw.history) ? raw.history.slice(0, 2) : [],
  };
}

/**
 * Normalizes Icon Chronicles Chapters 3 & 4 daily progress (resets daily at 06:00 AM local time).
 */
export function normalizeIconChroniclesDaily(
  raw?: IconChroniclesDailyProgress | null,
  cycleKey: string = getDaily6AMCycleKey()
): IconChroniclesDailyProgress {
  if (!raw || raw.cycleKey !== cycleKey) {
    return {
      cycleKey,
      quizLegendId: undefined,
      quizCompleted: false,
      quizCorrectCount: 0,
      quizRemainingSeconds: 0,
      quizTokensEarned: 0,
      rankedMatchesPlayed: 0,
      momentsClaimed: false,
    };
  }
  return {
    cycleKey,
    quizLegendId: raw.quizLegendId,
    quizCompleted: Boolean(raw.quizCompleted),
    quizCorrectCount: Math.max(0, raw.quizCorrectCount ?? 0),
    quizRemainingSeconds: Math.max(0, raw.quizRemainingSeconds ?? 0),
    quizTokensEarned: Math.max(0, raw.quizTokensEarned ?? 0),
    rankedMatchesPlayed: Math.max(0, raw.rankedMatchesPlayed ?? 0),
    momentsClaimed: Boolean(raw.momentsClaimed),
  };
}

/**
 * Returns HH:MM:SS remaining until the next 06:00:00 AM local reset.
 */
export function getCountdownToNext6AM(now: Date = new Date()): string {
  const nextReset = new Date(now);
  nextReset.setHours(6, 0, 0, 0);
  if (now.getTime() >= nextReset.getTime()) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  const diffSec = Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / 1000));
  const hours = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

/**
 * Returns YYYY-MM-DD local calendar date key that resets strictly at 00:00:00 (midnight).
 */
export function getMidnightDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns HH:MM:SS remaining until the next 00:00:00 local midnight reset.
 */
export function getCountdownToNextMidnight(now: Date = new Date()): string {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const diffSec = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  const hours = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

/**
 * Official auto-unlock date for CONMEBOL Libertadores: 00:00:00 on November 11 (11/11) of the active year.
 */
export function getLibertadoresOfficialUnlockMs(now: Date = new Date()): number {
  const year = now.getFullYear();
  return new Date(year, 10, 11, 0, 0, 0, 0).getTime();
}

export function isLibertadoresEventUnlocked(
  state?: ConmebolLibertadoresState | null,
  nowMs: number = Date.now()
): boolean {
  if (state?.unlockedEarly) return true;
  return nowMs >= getLibertadoresOfficialUnlockMs(new Date(nowMs));
}

export function formatCountdownToTargetMs(
  targetMs: number,
  nowMs: number = Date.now()
): string {
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = String(Math.floor((diffSec % 86400) / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');
  if (days > 0) {
    return `${days} ngày ${hours}:${mins}:${secs}`;
  }
  return `${hours}:${mins}:${secs}`;
}

/**
 * Normalizes CONMEBOL Libertadores state:
 * - Preserves unlockedEarly, totalTrainingRolls, claimedStreakMilestones, and currentBasketOffer across days
 * - Resets dailyCareerMatches, dailyTrainingClaimed, and daily Trivia progress every 06:00 AM cycle
 */
export function normalizeLibertadoresState(
  raw?: ConmebolLibertadoresState | null,
  cycleKey: string = getDaily6AMCycleKey()
): ConmebolLibertadoresState {
  if (!raw) {
    return {
      unlockedEarly: false,
      cycleKey,
      dailyCareerMatches: 0,
      dailyTrainingClaimed: false,
      totalTrainingRolls: 0,
      claimedStreakMilestones: [],
      triviaCompleted: false,
      triviaAnsweredCount: 0,
      triviaCorrectCount: 0,
      triviaTokensEarned: 0,
      triviaQuestionIds: [],
      currentBasketOffer: null,
    };
  }

  const isSameCycle = raw.cycleKey === cycleKey;
  return {
    unlockedEarly: Boolean(raw.unlockedEarly),
    cycleKey,
    dailyCareerMatches: isSameCycle ? Math.max(0, raw.dailyCareerMatches ?? 0) : 0,
    dailyTrainingClaimed: isSameCycle ? Boolean(raw.dailyTrainingClaimed) : false,
    lastTrainingRollAmount: isSameCycle ? raw.lastTrainingRollAmount : undefined,
    totalTrainingRolls: Math.max(0, raw.totalTrainingRolls ?? 0),
    claimedStreakMilestones: Array.isArray(raw.claimedStreakMilestones)
      ? raw.claimedStreakMilestones
      : [],
    triviaCompleted: isSameCycle ? Boolean(raw.triviaCompleted) : false,
    triviaAnsweredCount: isSameCycle ? Math.max(0, raw.triviaAnsweredCount ?? 0) : 0,
    triviaCorrectCount: isSameCycle ? Math.max(0, raw.triviaCorrectCount ?? 0) : 0,
    triviaTokensEarned: isSameCycle ? Math.max(0, raw.triviaTokensEarned ?? 0) : 0,
    triviaQuestionIds:
      isSameCycle && Array.isArray(raw.triviaQuestionIds) ? raw.triviaQuestionIds : [],
    currentBasketOffer: raw.currentBasketOffer ?? null,
  };
}

/**
 * Normalizes Ginga 26 event state:
 * - Daily match progress (max 5 matches/day) & randomized Festival daily requests reset strictly at 06:00 AM (`cycleKey`).
 * - 7-day Ginga streak allows 1 claim per 06:00 AM cycle (`lastStreakClaimDate === cycleKey`) and resets every 7 days anchored to 06:00 AM.
 */
export function normalizeGingaState(
  raw?: GingaState | null,
  cycleKey: string = getDaily6AMCycleKey(),
  nowMs: number = Date.now()
): GingaState {
  const defaultStartMs = getStartOfCurrent6AMCycleMs(new Date(nowMs));
  if (!raw) {
    return {
      cycleKey,
      matchesPlayedToday: 0,
      claimedMilestones: [],
      streakDaysClaimed: [],
      lastStreakClaimDate: '',
      streakCycleStartedAt: defaultStartMs,
      dailyQuestClaimedIds: [],
      excessTokensExchangedCount: 0,
    };
  }

  const isSameCycle = raw.cycleKey === cycleKey;
  const startMs = raw.streakCycleStartedAt || defaultStartMs;
  const streakExpired = nowMs - startMs >= TOTY_STREAK_DURATION_MS;
  const completedPreviousWeek =
    (raw.streakDaysClaimed?.length ?? 0) >= 7 && raw.lastStreakClaimDate !== cycleKey;
  const shouldResetStreakWeek = streakExpired || completedPreviousWeek;

  return {
    cycleKey,
    matchesPlayedToday: isSameCycle ? Math.max(0, Math.min(5, raw.matchesPlayedToday ?? 0)) : 0,
    claimedMilestones: Array.isArray(raw.claimedMilestones) ? raw.claimedMilestones : [],
    streakDaysClaimed: shouldResetStreakWeek
      ? []
      : Array.isArray(raw.streakDaysClaimed)
      ? raw.streakDaysClaimed
      : [],
    lastStreakClaimDate: shouldResetStreakWeek ? '' : raw.lastStreakClaimDate ?? '',
    streakCycleStartedAt: shouldResetStreakWeek ? defaultStartMs : startMs,
    dailyQuestClaimedIds: isSameCycle && Array.isArray(raw.dailyQuestClaimedIds)
      ? raw.dailyQuestClaimedIds
      : [],
    excessTokensExchangedCount: Math.max(0, raw.excessTokensExchangedCount ?? 0),
  };
}

export const RONALDO_CHRONICLES_CLUB_ORDER = [
  'sporting',
  'man_utd',
  'real_madrid',
  'juventus',
  'al_nassr',
] as const;

const RONALDO_CARD_ID_TO_CLUB_ID: Record<string, string> = {
  ronaldo_chronicles_sporting_100: 'sporting',
  ronaldo_chronicles_manutd_100: 'man_utd',
  ronaldo_chronicles_realmadrid_100: 'real_madrid',
  ronaldo_chronicles_juventus_100: 'juventus',
  ronaldo_chronicles_alnassr_100: 'al_nassr',
};

export function normalizeRonaldoChroniclesState(
  raw?: RonaldoChroniclesState | null,
  ownedPlayerIds?: string[]
): RonaldoChroniclesState {
  const claimedSet = new Set<string>(
    Array.isArray(raw?.claimedClubIds) ? raw.claimedClubIds : []
  );
  if (Array.isArray(ownedPlayerIds)) {
    for (const playerId of ownedPlayerIds) {
      const clubId = RONALDO_CARD_ID_TO_CLUB_ID[playerId];
      if (clubId) claimedSet.add(clubId);
    }
  }
  const orderedClaimed = RONALDO_CHRONICLES_CLUB_ORDER.filter((id) =>
    claimedSet.has(id)
  );
  return {
    claimedClubIds: [...orderedClaimed],
    lastAttemptCycleKey: raw?.lastAttemptCycleKey ?? '',
    lastAttemptClubId: raw?.lastAttemptClubId,
    lastAttemptCorrect: raw?.lastAttemptCorrect,
    lastAttemptPassed: raw?.lastAttemptPassed,
  };
}

/**
 * Normalizes Vietnam Chronicles daily 10-question quiz state (resets daily at 06:00 AM local time).
 */
export function normalizeVietnamChroniclesState(
  raw?: VietnamChroniclesState | null,
  cycleKey: string = getDaily6AMCycleKey()
): VietnamChroniclesState {
  if (!raw) {
    return {
      cycleKey,
      lastAttemptCycleKey: '',
      lastAttemptCorrect: 0,
      lastAttemptShardsEarned: 0,
      totalDailyRuns: 0,
      quizCompleted: false,
      quizCorrectCount: 0,
      quizShardsEarned: 0,
      questionIds: [],
    };
  }
  const playedToday =
    raw.lastAttemptCycleKey === cycleKey ||
    (Boolean(raw.quizCompleted) && raw.cycleKey === cycleKey);
  const correct = playedToday
    ? Math.max(0, raw.lastAttemptCorrect ?? raw.quizCorrectCount ?? 0)
    : 0;
  const shards = playedToday
    ? Math.max(0, raw.lastAttemptShardsEarned ?? raw.quizShardsEarned ?? 0)
    : 0;
  return {
    cycleKey,
    lastAttemptCycleKey: playedToday ? cycleKey : '',
    lastAttemptCorrect: correct,
    lastAttemptShardsEarned: shards,
    totalDailyRuns: Math.max(0, raw.totalDailyRuns ?? (playedToday ? 1 : 0)),
    quizCompleted: playedToday,
    quizCorrectCount: correct,
    quizShardsEarned: shards,
    questionIds: playedToday && Array.isArray(raw.questionIds) ? raw.questionIds : [],
  };
}

/**
 * Normalizes Extra Time (Hiệp Phụ) state:
 * - Resets Daily 1-of-3 Pick & Daily 20-Question Premier League Quest every 06:00 AM (`cycleKey`).
 * - Preserves Special Pick active unpicked/picked session across cycle, and tracks daily free Special Pick cycle key.
 */
export function normalizeExtraTimeState(
  raw?: ExtraTimeState | null,
  cycleKey: string = getDaily6AMCycleKey()
): ExtraTimeState {
  if (!raw) {
    return {
      cycleKey,
      dailyPickOptions: [],
      dailyPickChosenIndex: null,
      dailyPickClaimed: false,
      specialFreeUsedCycleKey: '',
      specialPickOptions: [],
      specialPickChosenIndex: null,
      specialPickClaimed: false,
      questCompleted: false,
      questAnsweredCount: 0,
      questCorrectCount: 0,
      questTokensEarned: 0,
      questQuestionIds: [],
    };
  }

  const isSameCycle = raw.cycleKey === cycleKey;
  return {
    cycleKey,
    dailyPickOptions: isSameCycle && Array.isArray(raw.dailyPickOptions) ? raw.dailyPickOptions : [],
    dailyPickChosenIndex:
      isSameCycle && typeof raw.dailyPickChosenIndex === 'number'
        ? raw.dailyPickChosenIndex
        : null,
    dailyPickClaimed: isSameCycle ? Boolean(raw.dailyPickClaimed) : false,
    specialFreeUsedCycleKey: raw.specialFreeUsedCycleKey ?? '',
    specialPickOptions: Array.isArray(raw.specialPickOptions) ? raw.specialPickOptions : [],
    specialPickChosenIndex:
      typeof raw.specialPickChosenIndex === 'number' ? raw.specialPickChosenIndex : null,
    specialPickClaimed: Boolean(raw.specialPickClaimed),
    questCompleted: isSameCycle ? Boolean(raw.questCompleted) : false,
    questAnsweredCount: isSameCycle ? Math.max(0, raw.questAnsweredCount ?? 0) : 0,
    questCorrectCount: isSameCycle ? Math.max(0, raw.questCorrectCount ?? 0) : 0,
    questTokensEarned: isSameCycle ? Math.max(0, raw.questTokensEarned ?? 0) : 0,
    questQuestionIds:
      isSameCycle && Array.isArray(raw.questQuestionIds) ? raw.questQuestionIds : [],
  };
}
