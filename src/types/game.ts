export type TicketSpinTheme =
  | 'GINGA'
  | 'GINGA_W1B'
  | 'LIBERTADORES'
  | 'CONMEBOL_LIBERTADORES'
  | 'UTOTY'
  | 'TOTY'
  | 'FUTURE_STARS'
  | 'VAN_DER_SAR_BOX'
  | 'BUNDESLIGA'
  | 'CHAMPIONS_JUVENTUS';

export interface PlayerCard {
  id: string;
  name: string;
  ovr: number;
  position: 'ST' | 'LW' | 'RW' | 'CF' | 'CAM' | 'CM' | 'CDM' | 'LM' | 'RM' | 'LWB' | 'RWB' | 'CB' | 'LB' | 'RB' | 'GK';
  club: string;
  clubLogo?: string;
  nation: string;
  nationFlag?: string;
  league?: string;
  cardType:
    | 'GINGA'
    | 'GINGA_ICON'
    | 'UTOTY'
    | 'UTOTY_ICON'
    | 'UTOTY_ICONS'
    | 'TOTY'
    | 'TOTY_ICON'
    | 'TOTY26_HM'
    | 'CLASSICS'
    | 'FUTURE_STARS'
    | 'LALIGA'
    | 'EURO_2024'
    | 'CONMEBOL_LIBERTADORES'
    | 'BALLON_DOR'
    | 'RONALDO_CHRONICLES'
    | 'VIETNAM_CHRONICLES'
    | 'BUNDESLIGA'
    | 'CHAMPIONS_JUVENTUS'
    | 'WELCOME'
    | 'HERO'
    | 'BASE';
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  avatarUrl: string;
  skillMoves: number;
  weakFoot: number;
  foot?: 'Trái' | 'Phải' | 'Cả hai';
  workRate?: string;
  height?: string;
  skillBoost?: string;
  traits?: string[];
  priceEstimate?: string;
  fullName?: string;
  avatarFallbackUrl?: string;
  isCollected?: boolean;
  isUtotyUpgraded?: boolean;
  baseOvr?: number;
  isExchangeExclusive?: boolean;
  clubExchangeCost?: number;
  /** Optional player-specific custom card frame PNG path */
  customFrameUrl?: string;
  /** True when customFrameUrl already contains the player portrait (do not render separate cutout or silhouette) */
  frameIncludesPortrait?: boolean;
  /** True when customFrameUrl already bakes OVR rating and position text into the frame */
  hideOvrAndPos?: boolean;
  /** True when customFrameUrl already contains all visuals (OVR, POS, name, badges) so FCCard renders only the frame */
  frameIsComplete?: boolean;
  /** Strictly untradeable card (excluded from Transfer Market buy/sell & Shard redeem) */
  isUntradeableOnly?: boolean;
  /** True if this player can be sold on the Transfer Market; false/undefined = Untradeable */
  isTradeable?: boolean;
  /** Optional pity milestone marker when granted by 20-spin Pool B or 250-spin Pool A guarantee */
  pityMilestone?: 'POOL_B_20' | 'POOL_A_250';
  /** Synchronized pixel player appearance & skill profile used inside Đấu Đỉnh Cao */
  pixelData?: {
    skinTone: string;
    hairTone: string;
    hairStyle: 'short' | 'fade' | 'curly' | 'afro' | 'long' | 'ponytail' | 'bald' | 'spiky';
    hairLabel: string;
    bootTone: string;
    bootLabel: string;
    hasBeard?: boolean;
    hasHeadband?: boolean;
    headbandColor?: string;
    jerseyNumber: number;
    skillMoveName: string;
    heightScale: number;
  };
}

export interface FormationSlot {
  slotId: string;
  pos: string;
  x: number;
  y: number;
}

export interface FormationConfig {
  id: string;
  name: string;
  type: 'Tấn công' | 'Cân bằng' | 'Phòng thủ';
  description: string;
  slots: FormationSlot[];
}

export type ManagerTierId = 'silver' | 'gold' | 'elite' | 'legendary';

export interface ManagerOvrBreakdown {
  base: number;
  formationMatch: number;
  playStyleMatch: number;
}

export interface ManagerConfig {
  id: string;
  name: string;
  nationality: string;
  tier: ManagerTierId;
  tierLabel: string;
  stars: number;
  rating: number;
  portraitUrl: string;
  favoritePlayStyleId: TacticalPlayStyleId;
  favoriteFormationIds: string[];
  philosophy: string;
  baseDailyGemCost: number;
  ovrBreakdown: ManagerOvrBreakdown;
  maxOvrBonus: number;
}

export interface ManagerContractState {
  managerId: string;
  hiredAt: number;
  expiresAt: number;
  contractDays: number;
}

export interface TeamTactics {
  mentality: 'attacking' | 'balanced' | 'defensive';
  speed: number; // 1: Chậm, 2: Cân bằng, 3: Nhanh
  passing: number; // 1: Ngắn (Tiki-taka), 2: Hỗn hợp, 3: Phất dài
  positioning: 'organized' | 'free';
  crossing: number; // 1: Thấp, 2: Bình thường, 3: Cao
  pressure: number; // 1: Nhẹ, 2: Trung lộ, 3: Gegenpress
  aggression: number; // 1: Thận trọng, 2: Quyết liệt
  width: number; // 1: Hẹp, 2: Vừa, 3: Rộng
  offsideTrap: boolean;
}

export interface SetPieceRoles {
  captainId: string;
  shortFreeKickId: string;
  longFreeKickId: string;
  penaltyId: string;
  leftCornerId: string;
  rightCornerId: string;
}

export type CraftLeagueId = 'premier_league' | 'laliga' | 'bundesliga' | 'ligue_1';
export type CraftPositionId = 'ATT' | 'MID' | 'DEF';

export interface CraftCardDrop {
  kind: 'league' | 'position';
  id: CraftLeagueId | CraftPositionId;
}

export interface CraftInventory {
  leagues: Record<CraftLeagueId, number>;
  positions: Record<CraftPositionId, number>;
}

export interface PendingCraftState {
  leagueId: CraftLeagueId;
  positionId: CraftPositionId;
  candidateIds: [string, string];
}

export interface FutureStarsDailyProgress {
  cycleKey: string;
  trainingCompleted: boolean;
  matchACompleted: boolean;
  matchBCompleted: boolean;
  rewardClaimed: boolean;
}

export interface Euro2024DailyProgress {
  cycleKey: string;
  euroSpinsOpened: number;
  careerMatchesPlayed: number;
  totyTokensEarned: number;
  rewardClaimed: boolean;
  lastRewardTickets?: number;
}

export interface TotyDailyStreakState {
  eventStartedAt: number;
  eventEndsAt: number;
  claimedDays: number; // 0..7
  lastClaimCycleKey: string;
}

export type ClubKeyMatchDifficultyId =
  | 'amateur'
  | 'professional'
  | 'world_class'
  | 'legendary';

export interface ClubKeyMatchHistoryEntry {
  id: string;
  opponentId: string;
  opponentName: string;
  difficultyId: ClubKeyMatchDifficultyId;
  difficultyLabel: string;
  userGoals: number;
  oppGoals: number;
  result: 'W' | 'D' | 'L';
  tokensEarned: number;
  coinsEarned: number;
  playedAt: string;
}

export interface ClubDailyProgress {
  cycleKey: string;
  matchesPlayed: number; // 0..2 per 06:00 AM daily cycle
  history: ClubKeyMatchHistoryEntry[];
}

export interface RankedOnlineCoachSummary {
  connId: string;
  clientId: string;
  username: string;
  teamName: string;
  teamLogo: string;
  ovr: number;
  rankLabel: string;
  rankLogoUrl: string;
  inQueue: boolean;
  inMatch: boolean;
  rankedSubMode?: 'manager' | 'apex';
}

export interface RankedIncomingInvite {
  inviteId: string;
  fromConnId: string;
  reason: 'direct' | 'queue';
  createdAt: number;
  fromProfile: {
    username: string;
    teamName: string;
    teamLogo: string;
    ovr: number;
    rankLabel: string;
    rankLogoUrl: string;
    rankedSubMode?: 'manager' | 'apex';
  };
}

export type RankedTierId =
  | 'amateur'
  | 'pro'
  | 'talent'
  | 'world'
  | 'legendary'
  | 'champion';

export interface RankedMatchHistoryItem {
  id: string;
  date: string;
  opponentName: string;
  opponentTeamName: string;
  opponentLogo: string;
  opponentOvr: number;
  isBot: boolean;
  userGoals: number;
  oppGoals: number;
  result: 'W' | 'D' | 'L';
  starDelta: number;
  gemsEarned: number;
  ticketsEarned: number;
}

export interface RankedSeasonState {
  seasonNumber: number;
  seasonStartedAt: number;
  seasonEndsAt: number;
  totalStars: number;
  highestStars: number;
  hasReachedChampion: boolean;
  claimedTierRewards: RankedTierId[];
  wins: number;
  draws: number;
  losses: number;
  winStreak: number;
  recentMatches: RankedMatchHistoryItem[];
}

export interface IconChroniclesDailyProgress {
  cycleKey: string;
  quizLegendId?: string;
  quizCompleted: boolean;
  quizCorrectCount: number;
  quizRemainingSeconds: number;
  quizTokensEarned: number;
  rankedMatchesPlayed: number;
  momentsClaimed: boolean;
}

export interface RonaldoChroniclesState {
  claimedClubIds: string[];
  lastAttemptCycleKey: string;
  lastAttemptClubId?: string;
  lastAttemptCorrect?: number;
  lastAttemptPassed?: boolean;
}

export interface VietnamChroniclesState {
  cycleKey: string;
  lastAttemptCycleKey?: string;
  lastAttemptCorrect?: number;
  lastAttemptShardsEarned?: number;
  totalDailyRuns?: number;
  quizCompleted?: boolean;
  quizCorrectCount?: number;
  quizShardsEarned?: number;
  questionIds?: string[];
}

export interface KickoffEventState {
  startedAt: number;
  claimedQuestIds: string[];
  claimedDayRewards: number[];
  spinsOpened?: number;
  careerMatches?: number;
  rankedMatches?: number;
  clubMatches?: number;
  squadEdits?: number;
  trainingUpgrades?: number;
  shopActions?: number;
  playStyleChanges?: number;
  iconActions?: number;
  totyTokensEarned?: number;
}

export interface LibertadoresBasketOffer {
  id: string;
  rewardType: 'gems' | 'tickets' | 'coins';
  rewardAmount: number;
  label: string;
  costTokens: number;
  purchased: boolean;
}

export interface ConmebolLibertadoresState {
  unlockedEarly: boolean;
  cycleKey: string;
  dailyCareerMatches: number;
  dailyTrainingClaimed: boolean;
  lastTrainingRollAmount?: number;
  totalTrainingRolls: number;
  claimedStreakMilestones: number[];
  triviaCompleted: boolean;
  triviaAnsweredCount: number;
  triviaCorrectCount: number;
  triviaTokensEarned: number;
  triviaQuestionIds?: string[];
  currentBasketOffer?: LibertadoresBasketOffer | null;
}

export interface BundesligaDailyProgress {
  cycleKey: string;
  goalsScoredToday: number;
  rewardClaimedToday: boolean;
}

export interface UserProfile {
  username: string;
  level: number;
  exp: number;
  maxExp: number;
  ovr: number;
  teamName: string;
  teamLogo: string;
  coins: number;
  gems: number;
  tickets: number;
  fcPoints: number;
  energy: number;
  maxEnergy: number;
  vsaRank: string;
  vsaFans: number;
  h2hRank: string;
  h2hCups: number;
  loginMethod: 'device';
  deviceId: string;
  deviceName?: string;
  controlMode?: 'pc' | 'mobile';
  starterVersion?: number;
  ownedPlayerIds?: string[];
  tradeablePlayerIds?: string[];
  calendarUnlockTicketClaimed?: boolean;
  starterIds?: string[];
  benchIds?: string[];
  activeFormationId?: string;
  totyTokens?: number;
  careerMatchesPlayed?: number;
  ticketsOpenedCount?: number;
  totyClaimedIds?: string[];
  craftInventory?: CraftInventory;
  pendingCraft?: PendingCraftState | null;
  trainingLevel?: number;
  totyShards?: number;
  minigameTickets?: number;
  lastMinigameTicketDate?: string;
  lastMailboxClaimDate?: string;
  claimedMailIds?: string[];
  redeemedCodes?: string[];
  futureStarsTickets?: number;
  futureStarsDaily?: FutureStarsDailyProgress;
  futureStarsExchangeCount?: number;
  dailyCheckInClaimed?: boolean;
  claimedQuestIds?: string[];
  savedQuests?: DailyQuest[];
  utotyUpgradedIds?: string[];
  euro2024Daily?: Euro2024DailyProgress;
  totyDailyStreak?: TotyDailyStreakState;
  dailyResetCycleKey?: string;
  rankedState?: RankedSeasonState;
  clubTokens?: number;
  clubDaily?: ClubDailyProgress;
  starPass?: StarPassState;
  vanDerSarBoxClaimedIds?: string[];
  gingaBoxClaimedIds?: string[];
  playStyle?: TacticalPlayStyleId;
  iconTokens?: number;
  iconChroniclesDaily?: IconChroniclesDailyProgress;
  ronaldoChronicles?: RonaldoChroniclesState;
  vietnamShards?: number;
  vietnamChronicles?: VietnamChroniclesState;
  kickoffState?: KickoffEventState;
  calendarClaimedDates?: string[];
  unlockTickets?: number;
  libertadoresTokens?: number;
  libertadoresTickets?: number;
  libertadoresState?: ConmebolLibertadoresState;
  signatureTokens?: number;
  gingaTokens?: number;
  gingaShards?: number;
  gingaTickets?: number;
  gingaState?: GingaState;
  matchSkipPasses?: number;
  activeManager?: ManagerContractState | null;
  ballonDorStreakClaimedSteps?: number[];
  bundesligaState?: BundesligaDailyProgress;
  extraTimeTokens?: number;
  extraTime?: ExtraTimeState;
  shardWatchlistIds?: string[];
}

export interface ExtraTimePickOption {
  id: string;
  kind: 'player' | 'coins' | 'shards';
  packTierLabel?: 'Gói C' | 'Gói B' | 'Gói A';
  playerId?: string;
  amount?: number;
  label: string;
}

export interface ExtraTimeState {
  cycleKey: string;
  dailyPickOptions: ExtraTimePickOption[];
  dailyPickChosenIndex: number | null;
  dailyPickClaimed: boolean;
  specialFreeUsedCycleKey?: string;
  specialPickOptions: ExtraTimePickOption[];
  specialPickChosenIndex: number | null;
  specialPickClaimed: boolean;
  questCompleted: boolean;
  questAnsweredCount: number;
  questCorrectCount: number;
  questTokensEarned: number;
  questQuestionIds: string[];
}

export interface GingaState {
  cycleKey: string;
  matchesPlayedToday: number;
  claimedMilestones: number[];
  streakDaysClaimed: number[];
  lastStreakClaimDate: string;
  streakCycleStartedAt?: number;
  dailyQuestClaimedIds?: string[];
  excessTokensExchangedCount?: number;
}

export type TacticalPlayStyleId =
  | 'tiki_taka'
  | 'phong_ngu'
  | 'phan_cong'
  | 'high_press'
  | 'tat_canh_danh_dau'
  | 'don_le';

export interface StarPassState {
  seasonNumber: number;
  points: number;
  isPremium: boolean;
  claimedFreeLevels: number[];
  claimedPremiumLevels: number[];
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'packs' | 'tickets' | 'resources' | 'special';
  description: string;
  costType: 'gems' | 'coins' | 'free';
  costAmount: number;
  rewardType: 'pack' | 'tickets' | 'gingaTickets' | 'coins' | 'energy' | 'gems' | 'libertadoresTokens' | 'signatureTokens' | 'matchSkipPasses' | 'extraTimeTokens';
  rewardAmount: number;
  packTier?:
    | 'A'
    | 'B'
    | 'C'
    | 'UTOTY'
    | 'TOTY_90_95'
    | 'TOTY_100'
    | 'MIXED_83_PLUS'
    | 'MIXED_86_PLUS'
    | 'MIXED_90_PLUS'
    | 'MIXED_94_PLUS'
    | 'MIXED_98_PLUS'
    | 'MIXED_90_99'
    | 'MIXED_100_PLUS'
    | 'FUTURE_STARS_90_95'
    | 'FRANCE_90_100'
    | 'ARGENTINA_90_100'
    | 'NETHERLANDS_90_100'
    | 'ITALY_90_100'
    | 'SPAIN_90_100'
    | 'ENGLAND_90_100'
    | 'BRAZIL_90_100'
    | 'PORTUGAL_90_100'
    | 'PREMIER_LEAGUE_90_100'
    | 'FUTURE_STARS_90_100'
    | 'STARTER_97'
    | 'CONMEBOL_SOUTH_AMERICA_90_PLUS'
    | 'CONMEBOL_100_103'
    | 'CONMEBOL_2_102_PLUS'
    | 'GINGA_100_OVR'
    | 'GINGA_92_106'
    | 'GINGA_PACK_A';
  badge?: string;
  badgeColor?: string;
  image?: string;
  isFullCardArt?: boolean;
  featured?: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  reward: { type: 'coins' | 'gems' | 'pass'; amount: number };
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
}

export interface MailItem {
  id: string;
  title: string;
  sender: string;
  date: string;
  content: string;
  rewards: {
    coins?: number;
    gems?: number;
    fcPoints?: number;
    tickets?: number;
    playerId?: string;
    playerLabel?: string;
  };
  claimed: boolean;
}

export interface PremierLeagueClub {
  id: string;
  name: string;
  shortName: string;
  ovr: number;
  primaryColor: string;
  secondaryColor: string;
  badgeUrl: string;
  stadium: string;
  starPlayer: string;
  roster: Array<{
    name: string;
    pos: string;
    ovr: number;
  }>;
}

export interface CareerStandingRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  form: Array<'W' | 'D' | 'L'>;
}

export interface CareerFixture {
  matchday: number;
  homeClubId: string;
  awayClubId: string;
  homeGoals?: number;
  awayGoals?: number;
  played: boolean;
}

export interface CareerSeasonState {
  seasonNumber: number;
  currentMatchday: number; // 1 to 38, 39 = season completed
  userClubId: string;
  standings: CareerStandingRow[];
  fixtures: CareerFixture[][]; // 38 matchdays, each with 10 matches
  seasonRewardClaimed: boolean;
  totalGoalsScored: number;
  topScorerName: string;
  topScorerGoals: number;
}
