import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronRight,
  Clock,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { UserProfile } from '../types/game';
import {
  KICKOFF_ASSETS,
  KICKOFF_DAY_STAR_POINTS_REWARD,
  KICKOFF_DAYS,
  KICKOFF_QUEST_GEMS_REWARD,
  KICKOFF_QUEST_STAR_POINTS_REWARD,
  KICKOFF_QUESTS_PER_DAY,
  KickoffActionRoute,
  KickoffQuestConfig,
  formatKickoffCountdown,
  getKickoffDayUnlockTimestamp,
  getNextLockedKickoffDayInfo,
  isKickoffCompleted,
  isKickoffDayUnlocked,
  normalizeKickoffState,
} from '../data/kickoffData';
import { TopSectionHeader } from './TopSectionHeader';
import { useLanguage } from '../i18n/language';

interface KickoffModalProps {
  user: UserProfile;
  onUpdateUser: (
    updater: Partial<UserProfile> | ((prev: UserProfile) => Partial<UserProfile>)
  ) => void;
  onNavigateAction: (route: KickoffActionRoute) => void;
  onClose: () => void;
}

export const KickoffModal: React.FC<KickoffModalProps> = ({
  user,
  onUpdateUser,
  onNavigateAction,
  onClose,
}) => {
  const { isEn, locale, t } = useLanguage();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const claimLockRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const kickoffState = useMemo(
    () => normalizeKickoffState(user.kickoffState, nowMs),
    [user.kickoffState, nowMs]
  );

  // Default selected day: first unlocked day that hasn't claimed its daily milestone reward yet
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const initSt = normalizeKickoffState(user.kickoffState);
    const claimedDays = new Set(initSt.claimedDayRewards);
    for (const dCfg of KICKOFF_DAYS) {
      if (isKickoffDayUnlocked(initSt, dCfg.day) && !claimedDays.has(dCfg.day)) {
        return dCfg.day;
      }
    }
    for (let d = KICKOFF_DAYS.length; d >= 1; d--) {
      if (isKickoffDayUnlocked(initSt, d)) return d;
    }
    return 1;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const claimedQuestSet = useMemo(
    () => new Set(kickoffState.claimedQuestIds),
    [kickoffState.claimedQuestIds]
  );
  const claimedDaySet = useMemo(
    () => new Set(kickoffState.claimedDayRewards),
    [kickoffState.claimedDayRewards]
  );

  const activeDayConfig = useMemo(
    () => KICKOFF_DAYS.find((d) => d.day === selectedDay) || KICKOFF_DAYS[0],
    [selectedDay]
  );

  const isSelectedDayUnlocked = isKickoffDayUnlocked(
    kickoffState,
    activeDayConfig.day,
    nowMs
  );
  const selectedDayUnlockAt = getKickoffDayUnlockTimestamp(
    kickoffState,
    activeDayConfig.day
  );
  const selectedDayRemainingMs = Math.max(0, selectedDayUnlockAt - nowMs);

  const nextLockedInfo = useMemo(
    () => getNextLockedKickoffDayInfo(kickoffState, nowMs),
    [kickoffState, nowMs]
  );

  const completedQuestsInSelectedDay = useMemo(() => {
    let count = 0;
    for (const q of activeDayConfig.quests) {
      const claimed = claimedQuestSet.has(q.id);
      const prog = Math.min(q.target, Math.max(0, q.getProgress(user, kickoffState)));
      if (claimed || prog >= q.target) {
        count += 1;
      }
    }
    return count;
  }, [activeDayConfig, claimedQuestSet, user, kickoffState]);

  const isSelectedDayMilestoneClaimed = claimedDaySet.has(activeDayConfig.day);
  const canClaimSelectedDayMilestone =
    isSelectedDayUnlocked &&
    completedQuestsInSelectedDay >= KICKOFF_QUESTS_PER_DAY &&
    !isSelectedDayMilestoneClaimed;

  const totalClaimedDaysCount = claimedDaySet.size;

  const handleClaimSingleQuest = (quest: KickoffQuestConfig) => {
    if (!isSelectedDayUnlocked) return;
    const lockKey = `quest_${quest.id}`;
    if (claimLockRef.current.has(lockKey) || claimedQuestSet.has(quest.id)) return;

    const prog = Math.min(quest.target, Math.max(0, quest.getProgress(user, kickoffState)));
    if (prog < quest.target) return;

    claimLockRef.current.add(lockKey);
    soundService.playCoins();

    onUpdateUser((prev) => {
      const curKickoff = normalizeKickoffState(prev.kickoffState);
      if (curKickoff.claimedQuestIds.includes(quest.id)) {
        return {};
      }
      const curSp = prev.starPass ?? {
        seasonNumber: 1,
        points: 0,
        isPremium: false,
        claimedFreeLevels: [],
        claimedPremiumLevels: [],
      };
      const nextKickoff = {
        ...curKickoff,
        claimedQuestIds: [...curKickoff.claimedQuestIds, quest.id],
      };
      return {
        gems: prev.gems + KICKOFF_QUEST_GEMS_REWARD,
        starPass: {
          ...curSp,
          points: (curSp.points ?? 0) + KICKOFF_QUEST_STAR_POINTS_REWARD,
        },
        kickoffState: nextKickoff,
      };
    });

    try {
      confetti({ particleCount: 55, spread: 65, origin: { y: 0.65 } });
    } catch {
      // ignore
    }

    showToast(
      t(
        `Đã nhận thưởng nhiệm vụ: +${KICKOFF_QUEST_GEMS_REWARD} Kim Cương & +${KICKOFF_QUEST_STAR_POINTS_REWARD} Star Point!`,
        `Quest claimed: +${KICKOFF_QUEST_GEMS_REWARD} Gems & +${KICKOFF_QUEST_STAR_POINTS_REWARD} Star Points!`
      )
    );
  };

  const handleClaimDayMilestone = () => {
    const dayNum = activeDayConfig.day;
    const lockKey = `day_${dayNum}`;
    if (
      !canClaimSelectedDayMilestone ||
      claimLockRef.current.has(lockKey) ||
      claimedDaySet.has(dayNum)
    ) {
      return;
    }

    claimLockRef.current.add(lockKey);
    soundService.playPackOpenFanfare();

    // Also auto-claim any unclaimed completed quests in this day so all 5 quests + day reward are cleanly marked claimed
    let newlyClaimedQuestsCount = 0;
    const questIdsToEnsure = activeDayConfig.quests.map((q) => q.id);

    onUpdateUser((prev) => {
      const curKickoff = normalizeKickoffState(prev.kickoffState);
      if (curKickoff.claimedDayRewards.includes(dayNum)) {
        return {};
      }

      const prevClaimedQuests = new Set(curKickoff.claimedQuestIds);
      const mergedQuestIds = [...curKickoff.claimedQuestIds];
      for (const qId of questIdsToEnsure) {
        if (!prevClaimedQuests.has(qId)) {
          prevClaimedQuests.add(qId);
          mergedQuestIds.push(qId);
          newlyClaimedQuestsCount += 1;
        }
      }

      const nextKickoff = {
        ...curKickoff,
        claimedQuestIds: mergedQuestIds,
        claimedDayRewards: [...curKickoff.claimedDayRewards, dayNum],
      };

      const curSp = prev.starPass ?? {
        seasonNumber: 1,
        points: 0,
        isPremium: false,
        claimedFreeLevels: [],
        claimedPremiumLevels: [],
      };

      const milestone = activeDayConfig.milestoneReward;
      const bonusQuestGems = newlyClaimedQuestsCount * KICKOFF_QUEST_GEMS_REWARD;
      const bonusQuestSp = newlyClaimedQuestsCount * KICKOFF_QUEST_STAR_POINTS_REWARD;
      const milestoneStarPoints = milestone.starPoints ?? KICKOFF_DAY_STAR_POINTS_REWARD;

      const updated: Partial<UserProfile> = {
        gems:
          prev.gems +
          bonusQuestGems +
          (milestone.type === 'gems' ? milestone.amount : 0),
        coins:
          prev.coins + (milestone.type === 'coins' ? milestone.amount : 0),
        tickets:
          (prev.tickets ?? 0) +
          (milestone.type === 'tickets' ? milestone.amount : 0),
        starPass: {
          ...curSp,
          points: (curSp.points ?? 0) + bonusQuestSp + milestoneStarPoints,
        },
        kickoffState: nextKickoff,
      };

      if (isKickoffCompleted(nextKickoff)) {
        setTimeout(() => {
          onClose();
        }, 1600);
      }

      return updated;
    });

    try {
      confetti({ particleCount: 110, spread: 90, origin: { y: 0.55 } });
    } catch {
      // ignore
    }

    const rLabel =
      isEn && activeDayConfig.milestoneReward.labelEn
        ? activeDayConfig.milestoneReward.labelEn
        : activeDayConfig.milestoneReward.label;
    showToast(
      t(
        `Chúc mừng! Đã nhận Phần Thưởng Ngày ${dayNum}: ${rLabel}!`,
        `Congratulations! Claimed Day ${dayNum} Reward: ${rLabel}!`
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden font-cruyff select-none">
      {/* Stadium Background */}
      <img
        src="/assets/aistudio/2026-01-15_TOTY__2048__97ef4195.jpg"
        alt="Mục Khởi Động"
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-zinc-950/88 to-black/96 pointer-events-none" />

      {/* Top Section Header */}
      <TopSectionHeader
        title={t('KHỞI ĐỘNG TÂN THỦ · 7 NGÀY', '7-DAY NEW PLAYER KICKOFF')}
        subtitle={t(
          'Mở khóa ngày tiếp theo mỗi 6 giờ · Mỗi phần thưởng ngày tặng kèm +50 Star Point',
          'Next day unlocks every 6 hours · Every daily reward includes +50 Star Points'
        )}
        user={user}
        onBack={onClose}
        onGoHome={onClose}
        extraRight={
          <div className="flex items-center gap-2 flex-wrap">
            {nextLockedInfo ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-amber-950/90 border border-amber-400/60 text-[11px] font-mono font-bold text-amber-200 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {t(`Mở Ngày ${nextLockedInfo.nextDay}:`, `Day ${nextLockedInfo.nextDay} in:`)}{' '}
                  {formatKickoffCountdown(nextLockedInfo.remainingMs)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-emerald-950/90 border border-emerald-400/60 text-[11px] font-bold text-emerald-300 uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Đã mở đủ 7/7 Ngày', 'All 7/7 Days Unlocked')}</span>
              </div>
            )}

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-zinc-900 border border-sky-400/50 text-xs font-mono font-bold text-sky-200 tabular-nums">
              <img
                src={KICKOFF_ASSETS.starPassIcon}
                alt="Star Point"
                className="w-4 h-4 object-contain"
              />
              <span>{(user.starPass?.points ?? 0).toLocaleString(locale)} SP</span>
            </div>
          </div>
        }
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="relative z-30 mx-auto mt-2 px-4 py-2 rounded-none bg-emerald-500 text-slate-950 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl">
          {toastMessage}
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-3 flex flex-col gap-3.5 max-w-7xl mx-auto w-full">
        {/* 7-DAY HORIZONTAL SELECTOR STRIP */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {KICKOFF_DAYS.map((dCfg) => {
            const unlocked = isKickoffDayUnlocked(kickoffState, dCfg.day, nowMs);
            const dayClaimed = claimedDaySet.has(dCfg.day);
            const isSelected = dCfg.day === activeDayConfig.day;
            const unlockAt = getKickoffDayUnlockTimestamp(kickoffState, dCfg.day);
            const remMs = Math.max(0, unlockAt - nowMs);

            let readyQuestsInTab = 0;
            let doneQuestsInTab = 0;
            if (unlocked) {
              for (const q of dCfg.quests) {
                const isQClaimed = claimedQuestSet.has(q.id);
                const p = Math.min(q.target, Math.max(0, q.getProgress(user, kickoffState)));
                if (isQClaimed || p >= q.target) doneQuestsInTab += 1;
                if (!isQClaimed && p >= q.target) readyQuestsInTab += 1;
              }
            }
            const dayMilestoneReady =
              unlocked && doneQuestsInTab >= KICKOFF_QUESTS_PER_DAY && !dayClaimed;
            const hasClaimable = readyQuestsInTab > 0 || dayMilestoneReady;

            return (
              <button
                key={dCfg.day}
                type="button"
                onClick={() => {
                  soundService.playTabSwitch();
                  setSelectedDay(dCfg.day);
                }}
                className={`relative p-2.5 rounded-none border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-400/25 via-zinc-900 to-zinc-950 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)]'
                    : unlocked
                    ? 'bg-zinc-950/90 hover:bg-zinc-900 border-white/25 hover:border-yellow-400/60'
                    : 'bg-zinc-950/60 border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-cruyff font-black text-xs sm:text-sm uppercase italic ${
                      isSelected ? 'text-yellow-300' : 'text-white'
                    }`}
                  >
                    {t('NGÀY', 'DAY')} {dCfg.day}
                  </span>
                  {dayClaimed ? (
                    <span className="w-4 h-4 rounded-none bg-emerald-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : !unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : hasClaimable ? (
                    <span className="px-1 py-0.2 rounded-none bg-emerald-400 text-slate-950 font-mono text-[9px] font-black">
                      {t('QUÀ', 'CLAIM')}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1">
                  <span className="text-[10px] font-cruyff font-bold text-amber-200 block truncate">
                    {isEn && dCfg.milestoneReward.shortBadgeEn
                      ? dCfg.milestoneReward.shortBadgeEn
                      : dCfg.milestoneReward.shortBadge}
                  </span>
                  {unlocked ? (
                    <span className="text-[10px] font-mono text-slate-300 tabular-nums">
                      {dayClaimed
                        ? t('Hoàn tất 5/5', 'Done 5/5')
                        : `${t('Nhiệm vụ', 'Quests')}: ${doneQuestsInTab}/5`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-300/90 tabular-nums">
                      {formatKickoffCountdown(remMs)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* MAIN 12-COLUMN SPLIT: DAILY MILESTONE SHOWCASE CARD (LEFT 4) + 5 QUESTS (RIGHT 8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
          {/* LEFT 4 COLUMNS: DAILY MILESTONE REWARD CARD WITH UPLOADED ARTWORK */}
          <div className="lg:col-span-4 rounded-none bg-zinc-950/95 border-2 border-yellow-400/75 p-4 flex flex-col justify-between relative overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.18)]">
            <div>
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/15">
                <div>
                  <span className="text-[10px] font-cruyff font-bold uppercase tracking-widest text-yellow-300 block">
                    {t(
                      `PHẦN THƯỞNG NGÀY THỨ ${activeDayConfig.day}`,
                      `DAY ${activeDayConfig.day} MILESTONE REWARD`
                    )}
                  </span>
                  <h3 className="font-cruyff font-black text-lg sm:text-xl text-white uppercase italic">
                    {isEn && activeDayConfig.titleEn
                      ? activeDayConfig.titleEn
                      : activeDayConfig.title}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-none bg-yellow-400/20 border border-yellow-400/60 font-mono text-xs font-black text-yellow-300 tabular-nums">
                  {totalClaimedDaysCount}/7 {t('Ngày', 'Days')}
                </span>
              </div>

              {/* Uploaded Vertical Reward Card Art (Untouched) */}
              <div className="my-3.5 flex flex-col items-center">
                <div className="relative w-44 sm:w-48 aspect-[5/8] border-2 border-yellow-400/80 shadow-[0_12px_35px_rgba(0,0,0,0.85)] overflow-hidden bg-black">
                  <img
                    src={activeDayConfig.milestoneReward.cardImageUrl}
                    alt={activeDayConfig.milestoneReward.label}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-2.5 text-center space-y-1">
                    <span className="font-cruyff font-black text-xs sm:text-sm text-yellow-300 uppercase tracking-wider block drop-shadow">
                      {isEn && activeDayConfig.milestoneReward.labelEn
                        ? activeDayConfig.milestoneReward.labelEn
                        : activeDayConfig.milestoneReward.label}
                    </span>
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 bg-sky-950/90 border border-sky-400/60 text-[11px] font-mono font-black text-sky-200 tabular-nums">
                      <img
                        src={KICKOFF_ASSETS.starPassIcon}
                        alt="Star Point"
                        className="w-3.5 h-3.5 object-contain"
                      />
                      <span>+{activeDayConfig.milestoneReward.starPoints} Star Point</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress & Milestone Claim CTA */}
            <div className="space-y-2.5 pt-2 border-t border-white/15">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  {t(
                    `Tiến độ nhiệm vụ Ngày ${activeDayConfig.day}:`,
                    `Day ${activeDayConfig.day} Quest Progress:`
                  )}
                </span>
                <span className="font-mono font-black text-yellow-300 tabular-nums">
                  {completedQuestsInSelectedDay}/{KICKOFF_QUESTS_PER_DAY}{' '}
                  {t('Nhiệm Vụ', 'Quests')}
                </span>
              </div>

              <div className="w-full h-2.5 bg-white/10 overflow-hidden border border-white/15">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-amber-300 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (completedQuestsInSelectedDay / KICKOFF_QUESTS_PER_DAY) * 100
                    )}%`,
                  }}
                />
              </div>

              {!isSelectedDayUnlocked ? (
                <div className="w-full py-2.5 px-3 bg-zinc-900 border border-amber-400/40 text-center text-xs font-mono font-bold text-amber-300 tabular-nums flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    {t(
                      `Mở khóa sau ${formatKickoffCountdown(selectedDayRemainingMs)} (6 giờ/ngày)`,
                      `Unlocks in ${formatKickoffCountdown(selectedDayRemainingMs)} (6h/day)`
                    )}
                  </span>
                </div>
              ) : isSelectedDayMilestoneClaimed ? (
                <div className="w-full py-2.5 px-3 bg-emerald-500/20 border border-emerald-400/60 text-center text-xs font-cruyff font-black uppercase tracking-wider text-emerald-300 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {t(
                      `ĐÃ NHẬN PHẦN THƯỞNG NGÀY ${activeDayConfig.day}`,
                      `DAY ${activeDayConfig.day} REWARD CLAIMED`
                    )}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canClaimSelectedDayMilestone}
                  onClick={handleClaimDayMilestone}
                  className={`w-full py-2.5 px-4 rounded-none font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canClaimSelectedDayMilestone
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-950 border border-white shadow-[0_0_24px_rgba(250,204,21,0.55)] hover:brightness-105 active:scale-98 cursor-pointer'
                      : 'bg-white/10 text-slate-400 border border-white/15 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>
                    {canClaimSelectedDayMilestone
                      ? `${t('NHẬN', 'CLAIM')} ${
                          isEn && activeDayConfig.milestoneReward.shortBadgeEn
                            ? activeDayConfig.milestoneReward.shortBadgeEn
                            : activeDayConfig.milestoneReward.shortBadge
                        }`
                      : t('HOÀN THÀNH ĐỦ 5 NHIỆM VỤ ĐỂ NHẬN', 'COMPLETE ALL 5 QUESTS TO CLAIM')}
                  </span>
                </button>
              )}

              <p className="text-[11px] text-slate-400 leading-snug text-center">
                {t(
                  `Mỗi phần thưởng ngày tặng kèm +${KICKOFF_DAY_STAR_POINTS_REWARD} Star Point · Mỗi nhiệm vụ thưởng +${KICKOFF_QUEST_GEMS_REWARD} Kim Cương & +${KICKOFF_QUEST_STAR_POINTS_REWARD} Star Point.`,
                  `Each daily reward grants +${KICKOFF_DAY_STAR_POINTS_REWARD} Star Points · Each quest grants +${KICKOFF_QUEST_GEMS_REWARD} Gems & +${KICKOFF_QUEST_STAR_POINTS_REWARD} Star Points.`
                )}
              </p>
            </div>
          </div>

          {/* RIGHT 8 COLUMNS: 5 QUESTS OF SELECTED DAY USING UPLOADED QUEST FRAME */}
          <div className="lg:col-span-8 rounded-none bg-zinc-950/95 border-2 border-white/20 p-4 flex flex-col justify-between gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/15">
              <div>
                <h3 className="font-cruyff font-black text-base sm:text-lg text-white uppercase italic">
                  {t(
                    `5 NHIỆM VỤ NGÀY THỨ ${activeDayConfig.day}`,
                    `5 QUESTS · DAY ${activeDayConfig.day}`
                  )}
                </h3>
                <span className="text-xs text-slate-300">
                  {t('Hoàn thành cả 5 nhiệm vụ để mở khóa ', 'Complete all 5 quests to unlock ')}
                  <strong className="text-yellow-300">
                    {isEn && activeDayConfig.milestoneReward.labelEn
                      ? activeDayConfig.milestoneReward.labelEn
                      : activeDayConfig.milestoneReward.label}
                  </strong>
                </span>
              </div>

              {!isSelectedDayUnlocked && (
                <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-400/50 text-amber-200 font-mono text-xs font-bold tabular-nums">
                  {t('Mở sau:', 'Unlocks in:')} {formatKickoffCountdown(selectedDayRemainingMs)}
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between gap-2.5">
              {activeDayConfig.quests.map((quest, idx) => {
                const isClaimed = claimedQuestSet.has(quest.id);
                const rawProg = Math.max(0, quest.getProgress(user, kickoffState));
                const currentProg = isClaimed
                  ? quest.target
                  : Math.min(quest.target, rawProg);
                const isCompleted = isClaimed || currentProg >= quest.target;
                const pct = Math.min(100, Math.round((currentProg / quest.target) * 100));

                return (
                  <div
                    key={quest.id}
                    className={`p-3 rounded-none border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isClaimed
                        ? 'bg-emerald-950/25 border-emerald-500/35'
                        : isCompleted && isSelectedDayUnlocked
                        ? 'bg-amber-950/35 border-yellow-400/80 shadow-[0_0_16px_rgba(250,204,21,0.18)]'
                        : 'bg-zinc-900/85 border-white/15'
                    }`}
                  >
                    {/* Left Info + Progress */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-mono text-[10px] font-black uppercase shrink-0">
                          {t('NV', 'Q')} {idx + 1}
                        </span>
                        <h4 className="font-cruyff font-black text-sm sm:text-base text-white truncate">
                          {quest.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-300 truncate">{quest.subtitle}</p>

                      {/* Progress Bar + Fixed Rewards (+200 Gems & +400 Star Point) */}
                      <div className="flex flex-wrap items-center gap-3 pt-0.5">
                        <div className="flex items-center gap-2 min-w-[150px] flex-1 max-w-xs">
                          <div className="flex-1 h-2 bg-black/80 border border-white/15 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-400' : 'bg-yellow-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-yellow-300 tabular-nums shrink-0">
                            {currentProg}/{quest.target}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950/85 border border-rose-400/45 text-[11px] font-mono font-bold text-rose-200 tabular-nums">
                            <img
                              src={KICKOFF_ASSETS.gemSmallIcon}
                              alt="Gems"
                              className="w-3.5 h-3.5 object-contain"
                            />
                            +{KICKOFF_QUEST_GEMS_REWARD}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-950/85 border border-sky-400/45 text-[11px] font-mono font-bold text-sky-200 tabular-nums">
                            <img
                              src={KICKOFF_ASSETS.starPassIcon}
                              alt="Star Point"
                              className="w-3.5 h-3.5 object-contain"
                            />
                            +{KICKOFF_QUEST_STAR_POINTS_REWARD} SP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Plate Framed by Uploaded Kickoff Quest Frame PNG */}
                    <div className="shrink-0 flex items-center justify-end">
                      {!isSelectedDayUnlocked ? (
                        <div className="relative w-44 h-11 flex items-center justify-center opacity-55 select-none">
                          <img
                            src={KICKOFF_ASSETS.questFrame}
                            alt=""
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                          />
                          <span className="relative z-10 font-cruyff font-black text-xs uppercase text-zinc-900 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>{t('Chưa Mở', 'Locked')}</span>
                          </span>
                        </div>
                      ) : isClaimed ? (
                        <div className="w-44 h-11 bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center gap-1.5 text-emerald-300 font-cruyff font-black text-xs uppercase">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t('ĐÃ NHẬN', 'CLAIMED')}</span>
                        </div>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handleClaimSingleQuest(quest)}
                          className="relative w-44 h-11 flex items-center justify-center hover:brightness-105 active:scale-95 transition-all cursor-pointer drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                        >
                          <img
                            src={KICKOFF_ASSETS.questFrame}
                            alt=""
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                          />
                          <span className="relative z-10 font-cruyff font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-950">
                            {t('NHẬN THƯỞNG', 'CLAIM REWARD')}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundService.playClick();
                            onNavigateAction(quest.actionRoute);
                          }}
                          className="relative w-44 h-11 flex items-center justify-center hover:brightness-105 active:scale-95 transition-all cursor-pointer opacity-95"
                        >
                          <img
                            src={KICKOFF_ASSETS.questFrame}
                            alt=""
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                          />
                          <span className="relative z-10 font-cruyff font-black text-xs uppercase tracking-wider text-zinc-950 flex items-center gap-1">
                            <span>{quest.actionLabel}</span>
                            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
