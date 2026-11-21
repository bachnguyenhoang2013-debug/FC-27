// Shared Deterministic 3/4 Isometric Arcade Football Engine ("Đấu Đỉnh Cao")
// Used by both Client Bot Mode (60 FPS) and Authoritative PvP WebSocket Server (30 Hz).

export type ApexTeamSide = 'p1' | 'p2';

export type ApexMatchPhase =
  | 'intro'
  | 'half1'
  | 'halftime'
  | 'half2'
  | 'outro';

export type ApexAnimState =
  | 'idle'
  | 'run'
  | 'kick'
  | 'header'
  | 'slide'
  | 'roulette'
  | 'rainbow'
  | 'fallen'
  | 'gk_dive'
  | 'celebrate';

export type ApexSetPieceType =
  | 'none'
  | 'kickoff'
  | 'throw_in'
  | 'corner'
  | 'goal_kick'
  | 'free_kick'
  | 'offside';

export type ApexButtonAction =
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'RAINBOW'
  | 'SKILL_KNOCKON'
  | 'SKILL_STOP'
  | 'PASS_LOFT'
  | 'PASS_LONG_LOFT'
  | 'GK_RUSH'
  | 'SHOT_CHIP'
  | 'SHOT_CURVE'
  | 'SHOT_POWER_LONG';

export interface ApexPlayerInit {
  id: string;
  name: string;
  shortName: string;
  number: number;
  pos: string;
  ovr: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  baseX: number; // 0..100 when attacking right (+X)
  baseY: number; // 0..100
  isGk: boolean;
  cardId?: string;
  cardType?: string;
  league?: string;
  avatarUrl?: string;
  customFrameUrl?: string;
  frameIncludesPortrait?: boolean;
  club?: string;
  clubLogo?: string;
  nation?: string;
  nationFlag?: string;
  skillMoves?: number;
  weakFoot?: number;
  pixelProfile?: {
    skinTone: string;
    hairTone: string;
    hairStyle: string;
    bootTone: string;
    hasBeard?: boolean;
    hasHeadband?: boolean;
    headbandColor?: string;
    heightScale?: number;
    skillMoveName?: string;
  };
}

export interface ApexPlayerEntity extends ApexPlayerInit {
  side: ApexTeamSide;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingAngle: number; // radians in world space
  animState: ApexAnimState;
  animFrame: number; // advances continuously
  animTimer: number; // lock duration for kick/slide/fallen/dive
  stamina: number; // 0..100
  yellowCards: number;
  sentOff: boolean;
  skillCooldown: number;
  tackleCooldown: number;
  invulnTimer: number;
  chargePower: number; // 0..1 while holding pass/through/shoot
  chargeKind?: 'pass' | 'through' | 'shoot';
  powerWindupTimer?: number;
  powerWindupAimX?: number;
  powerWindupAimY?: number;
}

export interface ApexBallState {
  x: number;
  y: number;
  z: number; // height >= 0
  vx: number;
  vy: number;
  vz: number;
  ownerId: string | null;
  lastTouchSide: ApexTeamSide;
  lastTouchName: string;
  lastTouchPlayerId?: string | null;
  lastPassFromSide: ApexTeamSide | null;
  lastPassWasForward: boolean;
  offsideCandidateId: string | null;
  pickupLockTimer: number;
  kickKind?: 'pass' | 'through' | 'shot' | 'clear' | 'finesse' | 'powershot';
  kickTimer?: number;
  kickFromX?: number;
  kickFromY?: number;
  kickTargetId?: string | null;
  kickStrength?: number; // 0..1 original charge power
  finesseCurveSign?: 1 | -1;
  spinRate?: number; // visual & Magnus rotation intensity (rad/s boost)
}

export interface ApexRefereeState {
  x: number;
  y: number;
  facingAngle: number;
  animFrame: number;
  cardShown: 'none' | 'yellow' | 'red';
  cardTimer: number;
}

export interface ApexBannerEvent {
  id: string;
  title: string;
  subtitle: string;
  tone: 'goal' | 'whistle' | 'yellow' | 'red' | 'offside' | 'setpiece';
  timer: number;
  side?: ApexTeamSide;
}

export interface ApexPitchCallout {
  text: string;
  tone: 'green' | 'red' | 'gold' | 'cyan';
  x: number;
  y: number;
  timer: number;
}

export type ApexSfxTrigger =
  | 'whistle_short'
  | 'whistle_long'
  | 'whistle_triple'
  | 'kick_pass'
  | 'kick_shot'
  | 'post_hit'
  | 'goal'
  | 'card';

export interface ApexControlInput {
  moveX: number; // screen-space horizontal (-1..1)
  moveY: number; // screen-space vertical (-1..1)
  shootHold: boolean; // holding L / SÚT button while attacking in opp half
  holdAction?: 'I' | 'J' | 'L' | null; // generalized hold-to-charge for I/J/L
  action: ApexButtonAction | null; // discrete press pulse
}

export interface ApexMatchState {
  phase: ApexMatchPhase;
  phaseTimer: number; // countdown inside intro/halftime/outro
  playSecondsLeft: number; // 90 down to 0 (45 per half)
  half: 1 | 2;
  p1Score: number;
  p2Score: number;
  p1GoalScorerCardIds: string[];
  p2GoalScorerCardIds: string[];
  p1Shots: number;
  p2Shots: number;
  p1SlideAttempts: number;
  p1SlideSuccess: number;
  p2SlideAttempts: number;
  p2SlideSuccess: number;
  p1SkillAttempts: number;
  p1SkillSuccess: number;
  p2SkillAttempts: number;
  p2SkillSuccess: number;
  p1PossTicks: number;
  totalPlayTicks: number;
  p1ActiveIdx: number;
  p2ActiveIdx: number;
  p1SupportTimer: number;
  p2SupportTimer: number;
  p1GkRushTimer: number;
  p2GkRushTimer: number;
  p1HoldShoot: boolean;
  p2HoldShoot: boolean;
  p1HoldAction: 'I' | 'J' | 'L' | null;
  p2HoldAction: 'I' | 'J' | 'L' | null;
  isBotOpp: boolean;
  botTierIndex: number; // 0..5
  botDecisionTimer: number;
  botDribbleDir: { x: number; y: number };
  setPiece: {
    type: ApexSetPieceType;
    side: ApexTeamSide;
    x: number;
    y: number;
    timer: number;
    maxTimer?: number;
    aimX?: number;
    aimY?: number;
    pipCornerSide?: 'top' | 'bottom';
  };
  kickoffProtectTimer: number;
  gkHoldTimer: number;
  goalCelebration: {
    active: boolean;
    side: ApexTeamSide;
    scorer: string;
    scorerId?: string | null;
    timer: number;
  } | null;
  banner: ApexBannerEvent | null;
  pitchCallout: ApexPitchCallout | null;
  sfxQueue: ApexSfxTrigger[];
  camera: { x: number; y: number };
  ball: ApexBallState;
  referee: ApexRefereeState;
  players: ApexPlayerEntity[]; // 0..10 = p1, 11..21 = p2
  lastPasserId: string | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);

export const screenInputToWorldDir = (ix: number, iy: number): { wx: number; wy: number } => {
  // Exact inverse of balanced FC Mobile stadium isometric projection:
  // sx ~ dx*1.38 + dy*0.12, sy ~ -dx*0.045 + dy*1.04
  const rawX = ix * 0.722 - iy * 0.083;
  const rawY = ix * 0.031 + iy * 0.958;
  const mag = Math.hypot(rawX, rawY);
  if (mag < 0.05) return { wx: 0, wy: 0 };
  return { wx: rawX / mag, wy: rawY / mag };
};

export const getAttackDir = (side: ApexTeamSide, half: 1 | 2): 1 | -1 => {
  // Half 1: p1 attacks +1 (right), p2 attacks -1 (left)
  // Half 2: swap ends! p1 attacks -1 (left), p2 attacks +1 (right)
  if (half === 1) return side === 'p1' ? 1 : -1;
  return side === 'p1' ? -1 : 1;
};

export const isPointInOwnHalf = (x: number, side: ApexTeamSide, half: 1 | 2): boolean => {
  const atkDir = getAttackDir(side, half);
  return atkDir === 1 ? x < 50 : x > 50;
};

const getGoalXForSideDefending = (side: ApexTeamSide, half: 1 | 2): number => {
  const atkDir = getAttackDir(side, half);
  return atkDir === 1 ? 1.8 : 98.2;
};

const getHomeCoords = (p: ApexPlayerInit, side: ApexTeamSide, half: 1 | 2): { x: number; y: number } => {
  const atkDir = getAttackDir(side, half);
  if (atkDir === 1) {
    return { x: p.baseX, y: p.baseY };
  }
  return { x: 100 - p.baseX, y: 100 - p.baseY };
};

const pickDefaultAttackerIdx = (players: ApexPlayerEntity[], side: ApexTeamSide): number => {
  const offset = side === 'p1' ? 0 : 11;
  let best = offset + 1;
  let bestX = -1;
  for (let i = 0; i < 10; i++) {
    const p = players[offset + i];
    if (p && !p.sentOff && p.baseX > bestX) {
      bestX = p.baseX;
      best = offset + i;
    }
  }
  return best;
};

const placeFormationForKickoff = (state: ApexMatchState, kickoffSide: ApexTeamSide) => {
  state.ball = {
    x: 50,
    y: 50,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    ownerId: null,
    lastTouchSide: kickoffSide,
    lastTouchName: '',
    lastPassFromSide: null,
    lastPassWasForward: false,
    offsideCandidateId: null,
    pickupLockTimer: 0.25,
    kickKind: undefined,
    kickTimer: 0,
    kickTargetId: null,
  };

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (p.sentOff) continue;
    const home = getHomeCoords(p, p.side, state.half);
    const atkDir = getAttackDir(p.side, state.half);
    // Keep everyone strictly inside their own half before kickoff
    let kx = home.x;
    let ky = home.y;
    if (p.isGk) {
      kx = getGoalXForSideDefending(p.side, state.half);
    } else if (atkDir === 1) {
      kx = Math.min(46.0, kx * 0.68);
    } else {
      kx = Math.max(54.0, 100 - (100 - kx) * 0.68);
    }

    // Enforce FIFA center-circle clearance (>= 14 units) for opposing team on kickoff!
    if (p.side !== kickoffSide && !p.isGk) {
      const dx = kx - 50;
      const dy = ky - 50;
      const d = Math.hypot(dx, dy);
      if (d < 14.5) {
        const pushDirX = d > 0.1 ? dx / d : atkDir === 1 ? -1 : 1;
        const pushDirY = d > 0.1 ? dy / d : 0;
        kx = clamp(50 + pushDirX * 14.8, 8, 92);
        ky = clamp(50 + pushDirY * 14.8, 8, 92);
        if (atkDir === 1) kx = Math.min(43.5, kx);
        else kx = Math.max(56.5, kx);
      }
    }

    p.x = kx;
    p.y = ky;
    p.vx = 0;
    p.vy = 0;
    p.facingAngle = atkDir === 1 ? 0 : Math.PI;
    p.animState = 'idle';
    p.animTimer = 0;
    p.chargePower = 0;
    p.chargeKind = undefined;
    p.powerWindupTimer = 0;
  }

  // Place designated kickoff taker right at center spot
  const takerIdx = pickDefaultAttackerIdx(state.players, kickoffSide);
  const taker = state.players[takerIdx];
  if (taker && !taker.sentOff) {
    taker.x = 50 - getAttackDir(kickoffSide, state.half) * 0.9;
    taker.y = 50;
    state.ball.ownerId = taker.id;
    state.ball.lastTouchSide = kickoffSide;
    state.ball.lastTouchName = taker.shortName;
    state.ball.lastTouchPlayerId = taker.id;
    if (kickoffSide === 'p1') state.p1ActiveIdx = takerIdx;
    else state.p2ActiveIdx = takerIdx - 11;
  }

  state.kickoffProtectTimer = 1.65;
  state.gkHoldTimer = 0;
  state.p1GkRushTimer = 0;
  state.p2GkRushTimer = 0;
  state.referee.x = 48;
  state.referee.y = 38;
};

/**
 * Ensures clear breathing space around goalkeeper when catching/picking up the ball or on goal kicks.
 */
const enforceGkSafetySpacing = (
  state: ApexMatchState,
  gk: ApexPlayerEntity,
  minRadius: number = 14.5
) => {
  for (const opp of state.players) {
    if (opp.sentOff || opp.side === gk.side) continue;
    const dx = opp.x - gk.x;
    const dy = opp.y - gk.y;
    const d = Math.hypot(dx, dy);
    if (d < minRadius) {
      const atkTowardMid = gk.x < 50 ? 1 : -1;
      const nx = d > 0.2 ? dx / d : atkTowardMid;
      const ny = d > 0.2 ? dy / d : 0;
      opp.x = clamp(gk.x + nx * (minRadius + 0.5), 5, 95);
      opp.y = clamp(gk.y + ny * (minRadius + 0.5), 6, 94);
      opp.vx = 0;
      opp.vy = 0;
    }
  }
};

export function createInitialApexMatchState(params: {
  p1Starters: ApexPlayerInit[];
  p2Starters: ApexPlayerInit[];
  isBotOpp: boolean;
  botTierIndex?: number;
}): ApexMatchState {
  const buildSide = (list: ApexPlayerInit[], side: ApexTeamSide): ApexPlayerEntity[] =>
    Array.from({ length: 11 }, (_, idx) => {
      const s = list[idx] || list[0];
      const atkDir = getAttackDir(side, 1);
      const x = atkDir === 1 ? s.baseX : 100 - s.baseX;
      const y = atkDir === 1 ? s.baseY : 100 - s.baseY;
      return {
        ...s,
        side,
        x,
        y,
        vx: 0,
        vy: 0,
        facingAngle: atkDir === 1 ? 0 : Math.PI,
        animState: 'idle',
        animFrame: idx * 0.4,
        animTimer: 0,
        stamina: 100,
        yellowCards: 0,
        sentOff: false,
        skillCooldown: 0,
        tackleCooldown: 0,
        invulnTimer: 0,
        chargePower: 0,
      };
    });

  const players = [
    ...buildSide(params.p1Starters, 'p1'),
    ...buildSide(params.p2Starters, 'p2'),
  ];

  const state: ApexMatchState = {
    phase: 'intro',
    phaseTimer: 2.5,
    playSecondsLeft: 90,
    half: 1,
    p1Score: 0,
    p2Score: 0,
    p1GoalScorerCardIds: [],
    p2GoalScorerCardIds: [],
    p1Shots: 0,
    p2Shots: 0,
    p1SlideAttempts: 0,
    p1SlideSuccess: 0,
    p2SlideAttempts: 0,
    p2SlideSuccess: 0,
    p1SkillAttempts: 0,
    p1SkillSuccess: 0,
    p2SkillAttempts: 0,
    p2SkillSuccess: 0,
    p1PossTicks: 0,
    totalPlayTicks: 0,
    p1ActiveIdx: 1,
    p2ActiveIdx: 1,
    p1SupportTimer: 0,
    p2SupportTimer: 0,
    p1GkRushTimer: 0,
    p2GkRushTimer: 0,
    p1HoldShoot: false,
    p2HoldShoot: false,
    p1HoldAction: null,
    p2HoldAction: null,
    isBotOpp: params.isBotOpp,
    botTierIndex: clamp(params.botTierIndex ?? 1, 0, 5),
    botDecisionTimer: 0.25,
    botDribbleDir: { x: -1, y: 0 },
    setPiece: {
      type: 'none',
      side: 'p1',
      x: 50,
      y: 50,
      timer: 0,
    },
    kickoffProtectTimer: 1.65,
    gkHoldTimer: 0,
    goalCelebration: null,
    banner: {
      id: 'intro_h1',
      title: 'TRẬN ĐẤU ĐỈNH CAO',
      subtitle: 'CÒI KHAI CUỘC · HIỆP 1 (45s)',
      tone: 'whistle',
      timer: 2.5,
    },
    pitchCallout: null,
    sfxQueue: ['whistle_long'],
    camera: { x: 50, y: 50 },
    ball: {
      x: 50,
      y: 50,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      ownerId: null,
      lastTouchSide: 'p1',
      lastTouchName: '',
      lastPassFromSide: null,
      lastPassWasForward: false,
      offsideCandidateId: null,
      pickupLockTimer: 0,
    },
    referee: {
      x: 49,
      y: 38,
      facingAngle: Math.PI / 2,
      animFrame: 0,
      cardShown: 'none',
      cardTimer: 0,
    },
    players,
    lastPasserId: null,
  };

  placeFormationForKickoff(state, 'p1');
  return state;
}

const getOwner = (state: ApexMatchState): ApexPlayerEntity | null => {
  if (!state.ball.ownerId) return null;
  return state.players.find((p) => p.id === state.ball.ownerId) || null;
};

const getActivePlayerForSide = (state: ApexMatchState, side: ApexTeamSide): ApexPlayerEntity => {
  const offset = side === 'p1' ? 0 : 11;
  const idx = side === 'p1' ? state.p1ActiveIdx : state.p2ActiveIdx;
  const p = state.players[offset + clamp(idx, 0, 10)];
  if (p && !p.sentOff) return p;
  for (let i = 0; i < 11; i++) {
    if (!state.players[offset + i].sentOff) {
      if (side === 'p1') state.p1ActiveIdx = i;
      else state.p2ActiveIdx = i;
      return state.players[offset + i];
    }
  }
  return state.players[offset];
};

export const findClosestPlayerIdx = (
  state: ApexMatchState,
  side: ApexTeamSide,
  x: number,
  y: number,
  excludeLocalIdx?: number,
  allowGk: boolean = false
): number => {
  const offset = side === 'p1' ? 0 : 11;
  let bestLocal = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 11; i++) {
    const p = state.players[offset + i];
    if (!p || p.sentOff) continue;
    if (!allowGk && p.isGk) continue;
    if (excludeLocalIdx !== undefined && i === excludeLocalIdx) continue;
    const d = dist(p.x, p.y, x, y);
    if (d < bestDist) {
      bestDist = d;
      bestLocal = i;
    }
  }
  return bestLocal;
};

const autoSwitchOnPossessionLoss = (
  state: ApexMatchState,
  lostSide: ApexTeamSide,
  excludeGlobalIdx?: number
) => {
  const offset = lostSide === 'p1' ? 0 : 11;
  const excludeLocal =
    excludeGlobalIdx !== undefined && excludeGlobalIdx >= offset && excludeGlobalIdx < offset + 11
      ? excludeGlobalIdx - offset
      : undefined;
  let nextIdx = findClosestPlayerIdx(state, lostSide, state.ball.x, state.ball.y, excludeLocal, false);
  const candidate = state.players[offset + nextIdx];
  if (!candidate || candidate.animState === 'fallen' || candidate.sentOff) {
    nextIdx = findClosestPlayerIdx(state, lostSide, state.ball.x, state.ball.y, nextIdx, false);
  }
  if (lostSide === 'p1') state.p1ActiveIdx = nextIdx;
  else state.p2ActiveIdx = nextIdx;
};

export interface ApexPassThroughPreview {
  passTarget: ApexPlayerEntity | null;
  passLocalIdx: number;
  throughTarget: ApexPlayerEntity | null;
  throughLocalIdx: number;
  throughLeadX: number;
  throughLeadY: number;
}

export const findBestPassTarget = (
  state: ApexMatchState,
  passer: ApexPlayerEntity,
  aimX: number,
  aimY: number
): { target: ApexPlayerEntity | null; localIdx: number } => {
  const offset = passer.side === 'p1' ? 0 : 11;
  const aimMag = Math.hypot(aimX, aimY);
  const dirX = aimMag > 0.1 ? aimX / aimMag : Math.cos(passer.facingAngle);
  const dirY = aimMag > 0.1 ? aimY / aimMag : Math.sin(passer.facingAngle);

  let bestTarget: ApexPlayerEntity | null = null;
  let bestLocal = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < 11; i++) {
    const mate = state.players[offset + i];
    if (!mate || mate.sentOff || mate.id === passer.id) continue;
    const dx = mate.x - passer.x;
    const dy = mate.y - passer.y;
    const d = Math.hypot(dx, dy);
    if (d < 2 || d > 68) continue;

    const dot = (dx / d) * dirX + (dy / d) * dirY;
    const score = dot * 36 - d * 0.45 + (mate.isGk ? -14 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestTarget = mate;
      bestLocal = i;
    }
  }
  return { target: bestTarget, localIdx: bestLocal };
};

export const computePassAndThroughTargets = (
  state: ApexMatchState,
  passer: ApexPlayerEntity,
  aimX: number,
  aimY: number
): ApexPassThroughPreview => {
  const atkDir = getAttackDir(passer.side, state.half);
  const hasAim = Math.hypot(aimX, aimY) > 0.1;
  const passAimX = hasAim ? aimX : Math.cos(passer.facingAngle);
  const passAimY = hasAim ? aimY : Math.sin(passer.facingAngle);
  const passRes = findBestPassTarget(state, passer, passAimX, passAimY);

  const tbAimX = hasAim ? aimX : atkDir;
  const tbAimY = hasAim ? aimY : 0;
  const offset = passer.side === 'p1' ? 0 : 11;
  const tbMag = Math.max(0.01, Math.hypot(tbAimX, tbAimY));
  const tbDirX = tbAimX / tbMag;
  const tbDirY = tbAimY / tbMag;

  let tbTarget: ApexPlayerEntity | null = null;
  let tbLocal = 0;
  let bestTbScore = -Infinity;

  for (let i = 0; i < 11; i++) {
    const mate = state.players[offset + i];
    if (!mate || mate.sentOff || mate.id === passer.id || mate.isGk) continue;
    const dx = mate.x - passer.x;
    const dy = mate.y - passer.y;
    const d = Math.hypot(dx, dy);
    if (d < 3 || d > 72) continue;

    const dot = (dx / d) * tbDirX + (dy / d) * tbDirY;
    const forwardBonus = (mate.x - passer.x) * atkDir > 0 ? 6 : -6;
    const paceBonus = (mate.pac - 75) * 0.15;
    const score = dot * 34 - d * 0.35 + forwardBonus + paceBonus;
    if (score > bestTbScore) {
      bestTbScore = score;
      tbTarget = mate;
      tbLocal = i;
    }
  }

  const throughLeadX = tbTarget
    ? clamp(tbTarget.x + atkDir * 12 + tbDirX * 4, 4, 96)
    : clamp(passer.x + atkDir * 22, 4, 96);
  const throughLeadY = tbTarget
    ? clamp(tbTarget.y + tbDirY * 6 + (tbTarget.y - passer.y) * 0.15, 7, 93)
    : clamp(passer.y + tbDirY * 14, 7, 93);

  return {
    passTarget: passRes.target,
    passLocalIdx: passRes.localIdx,
    throughTarget: tbTarget,
    throughLocalIdx: tbLocal,
    throughLeadX,
    throughLeadY,
  };
};

const checkIsReceiverOffside = (
  state: ApexMatchState,
  passer: ApexPlayerEntity,
  receiver: ApexPlayerEntity
): boolean => {
  if (passer.side !== receiver.side) return false;
  const atkDir = getAttackDir(passer.side, state.half);
  // Must be in opponent's half
  if (isPointInOwnHalf(receiver.x, passer.side, state.half)) return false;
  // Must be strictly ahead of the ball at the moment of the pass
  const aheadOfBall = atkDir === 1 ? receiver.x > passer.x + 1.2 : receiver.x < passer.x - 1.2;
  if (!aheadOfBall) return false;

  // Count opposing players (including GK) ahead of or level with receiver toward goal
  const oppOffset = passer.side === 'p1' ? 11 : 0;
  let oppCloserOrEqual = 0;
  for (let i = 0; i < 11; i++) {
    const opp = state.players[oppOffset + i];
    if (!opp || opp.sentOff) continue;
    const isCloserToGoal =
      atkDir === 1 ? opp.x >= receiver.x - 0.8 : opp.x <= receiver.x + 0.8;
    if (isCloserToGoal) oppCloserOrEqual += 1;
  }
  return oppCloserOrEqual < 2;
};

const executeKickToTarget = (
  state: ApexMatchState,
  passer: ApexPlayerEntity,
  targetX: number,
  targetY: number,
  baseSpeed: number,
  loftVz: number,
  accuracyRating: number,
  isPass: boolean,
  targetId?: string,
  kickKind: 'pass' | 'through' | 'shot' | 'clear' | 'finesse' | 'powershot' = isPass ? 'pass' : 'shot',
  kickStrength: number = 0.65
) => {
  const dx = targetX - passer.x;
  const dy = targetY - passer.y;
  const kickDist = Math.hypot(dx, dy);
  const extraShotDist = !isPass && kickKind !== 'clear' ? Math.max(0, kickDist - 14) : 0;
  const effAccuracy = accuracyRating - extraShotDist * 0.78;
  const distJitterBoost = extraShotDist * (kickKind === 'powershot' ? 0.0072 : 0.0055);
  const jitter =
    accuracyRating >= 99.5
      ? 0.008
      : clamp((105 - effAccuracy) * 0.0024 + distJitterBoost, 0.005, 0.38);
  const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * jitter;

  state.ball.ownerId = null;
  state.ball.pickupLockTimer = kickStrength < 0.26 ? 0.05 : 0.12;
  state.kickoffProtectTimer = 0;
  state.gkHoldTimer = 0;
  state.ball.vx = Math.cos(ang) * baseSpeed;
  state.ball.vy = Math.sin(ang) * baseSpeed;
  state.ball.vz = loftVz;
  state.ball.lastTouchSide = passer.side;
  state.ball.lastTouchName = passer.shortName;
  state.ball.lastTouchPlayerId = passer.id;
  state.ball.kickKind = kickKind;
  state.ball.kickStrength = kickStrength;
  state.ball.finesseCurveSign = undefined;
  state.ball.spinRate = kickKind === 'finesse' ? 14 : undefined;
  state.ball.kickTimer =
    kickKind === 'through'
      ? 1.15
      : kickKind === 'finesse'
      ? 0.96
      : kickKind === 'pass'
      ? 0.9
      : 0.78;
  state.ball.kickFromX = passer.x;
  state.ball.kickFromY = passer.y;
  state.ball.kickTargetId = targetId ?? null;
  passer.animState = 'kick';
  passer.animTimer = 0.24;
  passer.facingAngle = ang;
  passer.chargePower = 0;
  passer.chargeKind = undefined;
  passer.powerWindupTimer = 0;
  state.lastPasserId = passer.id;

  if (isPass && targetId) {
    const receiver = state.players.find((p) => p.id === targetId);
    const atkDir = getAttackDir(passer.side, state.half);
    state.ball.lastPassFromSide = passer.side;
    state.ball.lastPassWasForward = receiver
      ? atkDir === 1
        ? receiver.x > passer.x
        : receiver.x < passer.x
      : false;
    state.ball.offsideCandidateId =
      receiver && checkIsReceiverOffside(state, passer, receiver) ? receiver.id : null;
  } else {
    state.ball.lastPassFromSide = null;
    state.ball.offsideCandidateId = null;
  }
  state.sfxQueue.push(loftVz > 4.5 || baseSpeed > 34 ? 'kick_shot' : 'kick_pass');
};

const enforceSetPieceRadius = (
  state: ApexMatchState,
  sideAllowed: ApexTeamSide,
  cx: number,
  cy: number,
  minRadius: number
) => {
  for (const p of state.players) {
    if (p.sentOff || p.side === sideAllowed || p.isGk) continue;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < minRadius) {
      const fallbackX = cx < 50 ? 1 : -1;
      const nx = d > 0.2 ? dx / d : fallbackX;
      const ny = d > 0.2 ? dy / d : 0;
      p.x = clamp(cx + nx * (minRadius + 0.5), 4, 96);
      p.y = clamp(cy + ny * (minRadius + 0.5), 6, 94);
      p.vx = 0;
      p.vy = 0;
    }
  }
};

const setupCornerFormation = (
  state: ApexMatchState,
  atkSide: ApexTeamSide,
  cornerX: number,
  cornerY: number
) => {
  const crossedLeft = cornerX < 50;
  const boxCenterX = crossedLeft ? 12 : 88;
  const goalLineX = crossedLeft ? 2.4 : 97.6;
  const defSide: ApexTeamSide = atkSide === 'p1' ? 'p2' : 'p1';
  const atkOffset = atkSide === 'p1' ? 0 : 11;
  const defOffset = defSide === 'p1' ? 0 : 11;

  // Pick taker
  const takerLocal = findClosestPlayerIdx(state, atkSide, cornerX, cornerY, undefined, false);
  const taker = state.players[atkOffset + takerLocal];
  if (taker) {
    taker.x = cornerX;
    taker.y = cornerY;
    taker.vx = 0;
    taker.vy = 0;
    taker.facingAngle = Math.atan2(50 - cornerY, boxCenterX - cornerX);
    if (atkSide === 'p1') state.p1ActiveIdx = takerLocal;
    else state.p2ActiveIdx = takerLocal;
  }

  // Position attackers in box + 1 short option
  const atkSlots: Array<[number, number]> = [
    [crossedLeft ? 8.5 : 91.5, cornerY < 50 ? 14 : 86], // short pass option
    [crossedLeft ? 9 : 91, 44], // front post / center
    [crossedLeft ? 12 : 88, 50], // penalty spot
    [crossedLeft ? 9.5 : 90.5, 57], // far post
    [crossedLeft ? 18 : 82, 48], // edge of box
    [crossedLeft ? 22 : 78, cornerY < 50 ? 36 : 64], // rebound runner
  ];
  let slotIdx = 0;
  for (let i = 0; i < 11; i++) {
    const p = state.players[atkOffset + i];
    if (!p || p.sentOff || i === takerLocal) continue;
    if (p.isGk) {
      p.x = getGoalXForSideDefending(atkSide, state.half);
      p.y = 50;
    } else if (slotIdx < atkSlots.length) {
      p.x = atkSlots[slotIdx][0];
      p.y = atkSlots[slotIdx][1];
      slotIdx += 1;
    } else {
      p.x = crossedLeft ? 44 : 56;
      p.y = 35 + ((i * 11) % 35);
    }
    p.vx = 0;
    p.vy = 0;
    p.animState = 'idle';
    p.facingAngle = crossedLeft ? Math.PI : 0;
  }

  // Position defending GK & defenders inside box
  const defSlots: Array<[number, number]> = [
    [crossedLeft ? 6.5 : 93.5, 45],
    [crossedLeft ? 7.5 : 92.5, 55],
    [crossedLeft ? 11.5 : 88.5, 47],
    [crossedLeft ? 12.5 : 87.5, 54],
    [crossedLeft ? 15.5 : 84.5, cornerY < 50 ? 28 : 72],
    [crossedLeft ? 17.5 : 82.5, 50],
  ];
  let dSlot = 0;
  let bestDefLocal = 1;
  for (let i = 0; i < 11; i++) {
    const p = state.players[defOffset + i];
    if (!p || p.sentOff) continue;
    if (p.isGk) {
      p.x = goalLineX;
      p.y = 50;
    } else if (dSlot < defSlots.length) {
      if (dSlot === 2) bestDefLocal = i;
      p.x = defSlots[dSlot][0];
      p.y = defSlots[dSlot][1];
      dSlot += 1;
    } else {
      p.x = crossedLeft ? 34 : 66;
      p.y = 40 + ((i * 9) % 25);
    }
    p.vx = 0;
    p.vy = 0;
    p.animState = 'idle';
    p.facingAngle = crossedLeft ? 0 : Math.PI;
  }
  if (defSide === 'p1') state.p1ActiveIdx = bestDefLocal;
  else state.p2ActiveIdx = bestDefLocal;
};

const triggerSetPiece = (
  state: ApexMatchState,
  type: ApexSetPieceType,
  side: ApexTeamSide,
  x: number,
  y: number,
  title: string,
  subtitle: string,
  tone: ApexBannerEvent['tone'],
  pipCornerSide?: 'top' | 'bottom'
) => {
  const sx = clamp(x, 3, 97);
  const sy = clamp(y, 5, 95);
  const duration =
    type === 'corner'
      ? 5.0
      : type === 'throw_in'
      ? 3.0
      : type === 'offside' || type === 'free_kick'
      ? 1.7
      : 1.5;
  const crossedLeft = sx < 50;

  state.setPiece = {
    type,
    side,
    x: sx,
    y: sy,
    timer: duration,
    maxTimer: duration,
    aimX: type === 'corner' ? (crossedLeft ? 12 : 88) : sx,
    aimY: type === 'corner' ? 50 : sy,
    pipCornerSide,
  };
  state.ball.ownerId = null;
  state.ball.x = sx;
  state.ball.y = sy;
  state.ball.z = 0;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.vz = 0;
  state.ball.offsideCandidateId = null;
  state.kickoffProtectTimer = 0;
  state.gkHoldTimer = 0;

  const takerLocal = findClosestPlayerIdx(state, side, sx, sy, undefined, type === 'goal_kick');
  const offset = side === 'p1' ? 0 : 11;
  const taker = state.players[offset + takerLocal];

  if (type === 'corner') {
    setupCornerFormation(state, side, sx, sy);
  } else if (type === 'throw_in') {
    if (taker) {
      taker.x = sx;
      taker.y = sy;
      taker.vx = 0;
      taker.vy = 0;
      taker.facingAngle = sy < 50 ? Math.PI / 2 : -Math.PI / 2;
      if (side === 'p1') state.p1ActiveIdx = takerLocal;
      else state.p2ActiveIdx = takerLocal;
    }
    enforceSetPieceRadius(state, side, sx, sy, 8.5);
  } else if (type === 'goal_kick') {
    if (taker) {
      taker.x = sx;
      taker.y = sy;
      taker.vx = 0;
      taker.vy = 0;
      enforceGkSafetySpacing(state, taker, 18.5);
    }
  } else {
    if (taker) {
      taker.x = sx;
      taker.y = sy;
      taker.vx = 0;
      taker.vy = 0;
    }
    enforceSetPieceRadius(state, side, sx, sy, 10.5);
  }

  state.banner = {
    id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    subtitle,
    tone,
    timer: type === 'corner' ? 2.4 : 2.0,
    side,
  };
  state.sfxQueue.push('whistle_short');
};

const BOT_SLIDE_TRIGGER_RATES = [0.12, 0.17, 0.22, 0.28, 0.34, 0.40];

const performSlideTackle = (
  state: ApexMatchState,
  tackler: ApexPlayerEntity,
  moveDirX: number,
  moveDirY: number
) => {
  if (tackler.tackleCooldown > 0 || tackler.animTimer > 0) return;
  const dirX = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirX : Math.cos(tackler.facingAngle);
  const dirY = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirY : Math.sin(tackler.facingAngle);
  const mag = Math.max(0.01, Math.hypot(dirX, dirY));
  const nx = dirX / mag;
  const ny = dirY / mag;

  tackler.animState = 'slide';
  tackler.animTimer = 0.42;
  tackler.tackleCooldown = 0.95;
  tackler.facingAngle = Math.atan2(ny, nx);
  const slideSpd = 15.5 + (tackler.pac - 70) * 0.08;
  tackler.vx = nx * slideSpd;
  tackler.vy = ny * slideSpd;

  if (tackler.side === 'p1') state.p1SlideAttempts += 1;
  else state.p2SlideAttempts += 1;

  const owner = getOwner(state);
  const ballDist = dist(tackler.x, tackler.y, state.ball.x, state.ball.y);
  if (ballDist < 5.6) {
    if (!owner) {
      // Won loose ball cleanly via slide!
      if (tackler.side === 'p1') state.p1SlideSuccess += 1;
      else state.p2SlideSuccess += 1;
      state.ball.ownerId = tackler.id;
      state.ball.lastTouchSide = tackler.side;
      state.ball.lastTouchName = tackler.shortName;
      state.ball.lastTouchPlayerId = tackler.id;
      autoSwitchOnPossessionLoss(state, tackler.side === 'p1' ? 'p2' : 'p1');
      return;
    }
    if (owner.side !== tackler.side) {
      // Protected GK holding the ball cannot be tackled!
      if (owner.isGk) return;

      // Explicit Slide Tackle Success Rate based on DEF/PHY vs DRI/PHY & Bot tier
      const statDiff =
        (tackler.def * 0.65 + tackler.phy * 0.35 - (owner.dri * 0.6 + owner.phy * 0.4)) * 0.022;
      const slideSuccessProb =
        tackler.side === 'p2' && state.isBotOpp
          ? clamp(0.34 + state.botTierIndex * 0.08 + statDiff, 0.22, 0.84)
          : clamp(0.56 + statDiff, 0.28, 0.94);

      if (owner.invulnTimer > 0) {
        if (Math.random() < 0.2) {
          issueFoulAndCard(state, tackler, owner, true);
        }
        return;
      }
      if (Math.random() < slideSuccessProb) {
        if (tackler.side === 'p1') state.p1SlideSuccess += 1;
        else state.p2SlideSuccess += 1;
        const ownerGlobalIdx = state.players.indexOf(owner);
        const lostSide = owner.side;
        owner.animState = 'fallen';
        owner.animTimer = 0.45;
        state.ball.ownerId = tackler.id;
        state.ball.lastTouchSide = tackler.side;
        state.ball.lastTouchName = tackler.shortName;
        state.ball.lastTouchPlayerId = tackler.id;
        state.sfxQueue.push('kick_pass');
        autoSwitchOnPossessionLoss(state, lostSide, ownerGlobalIdx);
      } else if (Math.random() < 0.42) {
        issueFoulAndCard(state, tackler, owner, true);
      }
    }
  }
};

const performStandingTackle = (state: ApexMatchState, tackler: ApexPlayerEntity) => {
  if (tackler.tackleCooldown > 0 || tackler.animTimer > 0) return;
  tackler.animState = 'kick';
  tackler.animTimer = 0.22;
  tackler.tackleCooldown = 0.48;

  const owner = getOwner(state);
  const ballDist = dist(tackler.x, tackler.y, state.ball.x, state.ball.y);
  if (ballDist < 4.5 && (!owner || owner.side !== tackler.side)) {
    if (owner && (owner.invulnTimer > 0 || owner.isGk)) return;
    const winProb = owner
      ? clamp(0.58 + (tackler.def - owner.dri) * 0.022, 0.22, 0.92)
      : 0.96;
    if (Math.random() < winProb) {
      let lostSide: ApexTeamSide | null = null;
      let ownerGlobalIdx = -1;
      if (owner) {
        lostSide = owner.side;
        ownerGlobalIdx = state.players.indexOf(owner);
        owner.vx = 0;
        owner.vy = 0;
      }
      state.ball.ownerId = tackler.id;
      state.ball.lastTouchSide = tackler.side;
      state.ball.lastTouchName = tackler.shortName;
      state.ball.lastTouchPlayerId = tackler.id;
      state.sfxQueue.push('kick_pass');
      if (lostSide) {
        autoSwitchOnPossessionLoss(state, lostSide, ownerGlobalIdx);
      }
    } else if (owner && Math.random() < 0.06) {
      issueFoulAndCard(state, tackler, owner, false);
    }
  }
};

const issueFoulAndCard = (
  state: ApexMatchState,
  offender: ApexPlayerEntity,
  victim: ApexPlayerEntity,
  isSlide: boolean
) => {
  victim.animState = 'fallen';
  victim.animTimer = 1.1;
  victim.vx = 0;
  victim.vy = 0;

  const giveRedDirect = isSlide && Math.random() < 0.03;
  const giveYellow = giveRedDirect || (isSlide ? Math.random() < 0.34 : Math.random() < 0.14);
  let cardLabel: 'none' | 'yellow' | 'red' = 'none';

  if (giveRedDirect || (giveYellow && offender.yellowCards >= 1)) {
    offender.yellowCards = 2;
    offender.sentOff = true;
    cardLabel = 'red';
    state.sfxQueue.push('card');
  } else if (giveYellow) {
    offender.yellowCards = 1;
    cardLabel = 'yellow';
    state.sfxQueue.push('card');
  }

  state.referee.cardShown = cardLabel;
  state.referee.cardTimer = 2.0;
  state.referee.x = clamp(victim.x + 2.5, 6, 94);
  state.referee.y = clamp(victim.y - 2.5, 6, 94);

  const bannerTitle =
    cardLabel === 'red'
      ? 'THẺ ĐỎ · TRUẤT QUYỀN!'
      : cardLabel === 'yellow'
      ? 'THẺ VÀNG · PHẠM LỖI!'
      : 'THỔI PHẠT!';
  const tone: ApexBannerEvent['tone'] =
    cardLabel === 'red' ? 'red' : cardLabel === 'yellow' ? 'yellow' : 'setpiece';

  triggerSetPiece(
    state,
    'free_kick',
    victim.side,
    victim.x,
    victim.y,
    bannerTitle,
    `${offender.shortName} phạm lỗi với ${victim.shortName} · Đá phạt trực tiếp`,
    tone
  );
};

const fireActionForSide = (
  state: ApexMatchState,
  side: ApexTeamSide,
  action: ApexButtonAction,
  moveDirX: number,
  moveDirY: number,
  shotPower: number = 0.72
) => {
  const owner = getOwner(state);
  const sideHasBall = owner?.side === side;
  const active = getActivePlayerForSide(state, side);
  const offset = side === 'p1' ? 0 : 11;

  if (sideHasBall && owner) {
    // Switch control to owner if teammate had ball
    if (side === 'p1') state.p1ActiveIdx = state.players.indexOf(owner);
    else state.p2ActiveIdx = state.players.indexOf(owner) - 11;

    const atkDir = getAttackDir(side, state.half);
    const goalTargetX = atkDir === 1 ? 99.2 : 0.8;
    const inOwnHalf = isPointInOwnHalf(owner.x, side, state.half);

    const preview = computePassAndThroughTargets(state, owner, moveDirX, moveDirY);

    if (action === 'J') {
      // PASS + Power Curve + Automatic Lofted Ball Arc on Long Passes!
      const pwr = clamp(shotPower, 0.12, 1);
      const isWeakPass = pwr < 0.26;
      const isOverPass = pwr >= 0.85;
      const passDist = preview.passTarget
        ? dist(owner.x, owner.y, preview.passTarget.x, preview.passTarget.y)
        : isOverPass
        ? 26
        : 16;
      const isLongPass = passDist >= 18;
      if (isWeakPass) {
        state.pitchCallout = {
          text: 'CHUYỀN NHẸ!',
          tone: 'red',
          x: owner.x,
          y: owner.y,
          timer: 1.0,
        };
      } else if (isOverPass) {
        state.pitchCallout = {
          text: 'QUÁ LỰC · BANH BAY CAO!',
          tone: 'gold',
          x: owner.x,
          y: owner.y,
          timer: 1.15,
        };
      }

      if (preview.passTarget) {
        const longFactor = clamp((passDist - 17) / 24, 0, 1);
        const basePassSpd = isWeakPass
          ? clamp(13.5 + pwr * 22 + (owner.pas - 70) * 0.14, 13, 21)
          : isOverPass
          ? clamp(33 + (pwr - 0.85) * 30 + (owner.pas - 65) * 0.22, 33, 44)
          : clamp(
              22 + pwr * 14 + longFactor * 6.5 + (owner.pas - 60) * 0.24 + (owner.ovr - 75) * 0.12,
              22,
              40
            );
        const autoLongLoft =
          isLongPass && !isWeakPass
            ? clamp(5.8 + longFactor * 4.6 + (pwr >= 0.68 ? 1.0 : 0), 5.8, 10.8)
            : pwr > 0.65
            ? 1.25
            : 0.18;
        const passLoftVz = isOverPass
          ? Math.max(autoLongLoft, 5.8 + (pwr - 0.85) * 24)
          : autoLongLoft;
        const passAcc = isOverPass
          ? owner.pas * 0.52 - (pwr - 0.85) * 95
          : isWeakPass
          ? owner.pas * 0.72
          : owner.pas * 0.76 + owner.ovr * 0.24;
        const overDx = isOverPass ? (preview.passTarget.x - owner.x) * 0.26 : 0;
        const overDy = isOverPass ? (preview.passTarget.y - owner.y) * 0.26 : 0;
        executeKickToTarget(
          state,
          owner,
          preview.passTarget.x + preview.passTarget.vx * (isLongPass ? 0.34 : 0.24) + overDx,
          preview.passTarget.y + preview.passTarget.vy * (isLongPass ? 0.34 : 0.24) + overDy,
          basePassSpd,
          passLoftVz,
          passAcc,
          true,
          preview.passTarget.id,
          'pass',
          pwr
        );
        if (side === 'p1') state.p1ActiveIdx = preview.passLocalIdx;
        else state.p2ActiveIdx = preview.passLocalIdx;
      } else {
        executeKickToTarget(
          state,
          owner,
          owner.x + Math.cos(owner.facingAngle) * (isOverPass ? 26 : isWeakPass ? 9 : 16),
          owner.y + Math.sin(owner.facingAngle) * (isOverPass ? 26 : isWeakPass ? 9 : 16),
          isWeakPass ? 15 : isOverPass ? 35 : 24,
          isOverPass ? 6.2 : 0.18,
          owner.pas,
          false,
          undefined,
          'pass',
          pwr
        );
      }
      return;
    }

    if (action === 'I') {
      // THROUGH BALL (Chọc khe) + Power Curve + Lofted Aerial Arc on Long Through Balls!
      const pwr = clamp(shotPower, 0.12, 1);
      const isWeakTb = pwr < 0.26;
      const isOverTb = pwr >= 0.85;
      const tbDist = dist(owner.x, owner.y, preview.throughLeadX, preview.throughLeadY);
      const isLongTb = tbDist >= 18;
      if (isWeakTb) {
        state.pitchCallout = {
          text: 'CHỌC KHE NHẸ!',
          tone: 'red',
          x: owner.x,
          y: owner.y,
          timer: 1.0,
        };
      } else if (isOverTb) {
        state.pitchCallout = {
          text: 'QUÁ LỰC · BANH BAY CAO!',
          tone: 'gold',
          x: owner.x,
          y: owner.y,
          timer: 1.15,
        };
      }

      if (preview.throughTarget) {
        const longFactor = clamp((tbDist - 17) / 24, 0, 1);
        const tbSpeed = isWeakTb
          ? clamp(15.5 + pwr * 22 + (owner.pas - 70) * 0.14, 15, 22.5)
          : isOverTb
          ? clamp(36 + (pwr - 0.85) * 32 + (owner.pas - 65) * 0.22, 36, 48)
          : clamp(
              25 + pwr * 15 + longFactor * 5.5 + (owner.pas - 60) * 0.28 + (owner.ovr - 75) * 0.13,
              25,
              43
            );
        const autoTbLoft =
          isLongTb && !isWeakTb
            ? clamp(6.0 + longFactor * 4.6 + pwr * 0.8, 6.0, 11.0)
            : isWeakTb
            ? 0.25
            : 1.05 + pwr * 1.15;
        const tbVz = isOverTb ? Math.max(autoTbLoft, 6.4 + (pwr - 0.85) * 26) : autoTbLoft;
        const tbAcc = isOverTb
          ? owner.pas * 0.54 - (pwr - 0.85) * 90
          : owner.pas * 0.76 + owner.ovr * 0.24;
        executeKickToTarget(
          state,
          owner,
          preview.throughLeadX + (isOverTb ? atkDir * 8 : 0),
          preview.throughLeadY,
          tbSpeed,
          tbVz,
          tbAcc,
          true,
          preview.throughTarget.id,
          'through',
          pwr
        );
        if (side === 'p1') state.p1ActiveIdx = preview.throughLocalIdx;
        else state.p2ActiveIdx = preview.throughLocalIdx;
      } else {
        executeKickToTarget(
          state,
          owner,
          preview.throughLeadX + (isOverTb ? atkDir * 8 : 0),
          preview.throughLeadY,
          isWeakTb ? 16 : isOverTb ? 37 : 28.5,
          isOverTb ? 6.2 : isLongTb && !isWeakTb ? 4.4 : 1.0,
          owner.pas,
          false,
          undefined,
          'through',
          pwr
        );
      }
      return;
    }

    if (action === 'K' || action === 'RAINBOW') {
      // FC MOBILE SKILL MOVE (Roulette 360° or Swipe-Up Rainbow Flick) with identical duel pass-through rate!
      const isRainbow = action === 'RAINBOW';
      if (owner.skillCooldown <= 0 && owner.animTimer <= 0) {
        const starBoost = (owner.skillMoves ?? 3) >= 5 ? 2.2 : (owner.skillMoves ?? 3) >= 4 ? 1.1 : 0;
        const dx = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirX : atkDir;
        const dy = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirY : (owner.y < 50 ? 0.35 : -0.35);
        const mag = Math.max(0.01, Math.hypot(dx, dy));
        const nx = dx / mag;
        const ny = dy / mag;

        // Check nearest opposing outfield defender challenging within skill duel range
        const oppOffset = side === 'p1' ? 11 : 0;
        let nearestDef: ApexPlayerEntity | null = null;
        let minDefDist = Infinity;
        for (let i = 0; i < 11; i++) {
          const def = state.players[oppOffset + i];
          if (!def || def.sentOff || def.isGk || def.animState === 'fallen') continue;
          const d = dist(owner.x, owner.y, def.x, def.y);
          if (d < 7.8 && d < minDefDist) {
            minDefDist = d;
            nearestDef = def;
          }
        }

        owner.skillCooldown = 1.25;
        owner.stamina = Math.max(30, owner.stamina - 6);
        owner.chargePower = 0;
        owner.chargeKind = undefined;

        const skillAnim: ApexAnimState = isRainbow ? 'rainbow' : 'roulette';
        const skillDur = isRainbow ? 0.52 : 0.46;

        if (nearestDef) {
          if (side === 'p1') state.p1SkillAttempts += 1;
          else state.p2SkillAttempts += 1;

          const atkSkillRating =
            owner.dri * 0.52 +
            owner.pac * 0.18 +
            owner.ovr * 0.30 +
            ((owner.skillMoves ?? 3) - 3) * 5.5;
          const defReadRating =
            nearestDef.def * 0.52 + nearestDef.phy * 0.24 + nearestDef.ovr * 0.24;
          const botTierMod =
            nearestDef.side === 'p2' && state.isBotOpp ? (state.botTierIndex - 2) * 0.04 : 0;
          const skillSuccessProb = clamp(
            0.54 + (atkSkillRating - defReadRating) * 0.015 - botTierMod,
            0.22,
            0.91
          );

          if (Math.random() < skillSuccessProb) {
            if (side === 'p1') state.p1SkillSuccess += 1;
            else state.p2SkillSuccess += 1;
            const burst = clamp(
              13.5 + (owner.dri - 60) * 0.22 + (owner.pac - 60) * 0.12 + starBoost,
              12.5,
              24.5
            );
            owner.vx = nx * burst;
            owner.vy = ny * burst;
            owner.facingAngle = Math.atan2(ny, nx);
            owner.invulnTimer = clamp(0.6 + (owner.dri - 65) * 0.016 + starBoost * 0.05, 0.5, 1.25);
            owner.animState = skillAnim;
            owner.animTimer = skillDur;

            // Ankle-break nearby challenging defenders!
            for (let i = 0; i < 11; i++) {
              const def = state.players[oppOffset + i];
              if (!def || def.sentOff || def.isGk) continue;
              const dd = dist(owner.x, owner.y, def.x, def.y);
              if (dd < 5.4 + starBoost * 0.25) {
                if (dd < 3.6) {
                  def.animState = 'fallen';
                  def.animTimer = 0.52;
                } else {
                  def.animTimer = 0.42;
                }
                def.vx *= 0.15;
                def.vy *= 0.15;
              }
            }
            state.pitchCallout = {
              text: `${isRainbow ? 'RAINBOW FLICK!' : 'ROULETTE!'} (${Math.round(skillSuccessProb * 100)}%)`,
              tone: isRainbow ? 'gold' : 'green',
              x: owner.x,
              y: owner.y,
              timer: 1.2,
            };
          } else {
            // Defender anticipates & wins possession cleanly!
            const ownerGlobalIdx = state.players.indexOf(owner);
            const defLocalIdx = state.players.indexOf(nearestDef) - oppOffset;
            owner.animState = 'fallen';
            owner.animTimer = 0.34;
            owner.invulnTimer = 0;
            owner.vx *= 0.2;
            owner.vy *= 0.2;
            nearestDef.animState = 'kick';
            nearestDef.animTimer = 0.2;
            state.ball.ownerId = nearestDef.id;
            state.ball.lastTouchSide = nearestDef.side;
            state.ball.lastTouchName = nearestDef.shortName;
            state.ball.lastTouchPlayerId = nearestDef.id;
            state.sfxQueue.push('kick_pass');
            if (nearestDef.side === 'p1') state.p1ActiveIdx = defLocalIdx;
            else state.p2ActiveIdx = defLocalIdx;
            autoSwitchOnPossessionLoss(state, owner.side, ownerGlobalIdx);
            state.pitchCallout = {
              text: 'SKILL BỊ BẮT BÀI!',
              tone: 'red',
              x: owner.x,
              y: owner.y,
              timer: 1.2,
            };
          }
        } else {
          // Open space Roulette 360° or Rainbow Flick dribble
          const burst = clamp(
            12.5 + (owner.dri - 60) * 0.22 + (owner.pac - 60) * 0.12 + starBoost,
            11.5,
            23.5
          );
          owner.vx = nx * burst;
          owner.vy = ny * burst;
          owner.facingAngle = Math.atan2(ny, nx);
          owner.invulnTimer = clamp(0.5 + (owner.dri - 65) * 0.016 + starBoost * 0.05, 0.46, 1.2);
          owner.animState = skillAnim;
          owner.animTimer = skillDur;
          state.pitchCallout = {
            text: isRainbow ? 'RAINBOW FLICK!' : 'ROULETTE 360°',
            tone: 'cyan',
            x: owner.x,
            y: owner.y,
            timer: 0.9,
          };
        }
      }
      return;
    }

    if (action === 'PASS_LOFT' || action === 'PASS_LONG_LOFT') {
      const isFarLoft = action === 'PASS_LONG_LOFT';
      let chosenTarget = preview.passTarget;
      let chosenLocalIdx = preview.passLocalIdx;

      if (isFarLoft) {
        // Pick furthest open forward/switching teammate (>= 18 units away if possible)
        let bestFarScore = -Infinity;
        const aimX = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirX : atkDir;
        const aimY = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirY : 0;
        const aMag = Math.max(0.01, Math.hypot(aimX, aimY));
        for (let i = 0; i < 11; i++) {
          const mate = state.players[offset + i];
          if (!mate || mate.sentOff || mate.isGk || mate.id === owner.id) continue;
          const d = dist(owner.x, owner.y, mate.x, mate.y);
          if (d < 6) continue;
          const dot = ((mate.x - owner.x) * (aimX / aMag) + (mate.y - owner.y) * (aimY / aMag)) / d;
          const farBonus = d >= 18 ? 1.8 : 0;
          const forwardBonus = atkDir * (mate.x - owner.x) * 0.035;
          const score = dot * 1.45 + d * 0.055 + farBonus + forwardBonus;
          if (score > bestFarScore) {
            bestFarScore = score;
            chosenTarget = mate;
            chosenLocalIdx = i;
          }
        }
      }

      if (chosenTarget) {
        const passDist = dist(owner.x, owner.y, chosenTarget.x, chosenTarget.y);
        const speed = isFarLoft
          ? clamp(27 + passDist * 0.32 + (owner.pas - 65) * 0.18, 27, 44)
          : clamp(20 + passDist * 0.34 + (owner.pas - 65) * 0.18, 20, 36);
        const loftVz = isFarLoft
          ? clamp(6.9 + Math.max(0, passDist - 16) * 0.21, 6.9, 11.4)
          : clamp(4.9 + passDist * 0.16, 4.9, 8.2);
        executeKickToTarget(
          state,
          owner,
          chosenTarget.x + chosenTarget.vx * 0.34,
          chosenTarget.y + chosenTarget.vy * 0.34,
          speed,
          loftVz,
          owner.pas * 0.78 + owner.ovr * 0.22,
          true,
          chosenTarget.id,
          'pass',
          isFarLoft ? 0.8 : 0.7
        );
        if (side === 'p1') state.p1ActiveIdx = chosenLocalIdx;
        else state.p2ActiveIdx = chosenLocalIdx;
      } else {
        const flyDist = isFarLoft ? 32 : 20;
        executeKickToTarget(
          state,
          owner,
          clamp(owner.x + Math.cos(owner.facingAngle) * flyDist, 4, 96),
          clamp(owner.y + Math.sin(owner.facingAngle) * flyDist, 5, 95),
          isFarLoft ? 34 : 25,
          isFarLoft ? 8.8 : 6.0,
          owner.pas,
          false,
          undefined,
          'pass',
          isFarLoft ? 0.8 : 0.7
        );
      }
      state.pitchCallout = {
        text: isFarLoft ? 'CHUYỀN BỔNG XA!' : 'CHUYỀN BỔNG!',
        tone: isFarLoft ? 'gold' : 'cyan',
        x: owner.x,
        y: owner.y,
        timer: 1.05,
      };
      return;
    }

    if (action === 'SKILL_KNOCKON') {
      if (owner.skillCooldown <= 0 && owner.animTimer <= 0) {
        const dx = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirX : Math.cos(owner.facingAngle);
        const dy = Math.abs(moveDirX) + Math.abs(moveDirY) > 0.1 ? moveDirY : Math.sin(owner.facingAngle);
        const mag = Math.max(0.01, Math.hypot(dx, dy));
        const nx = dx / mag;
        const ny = dy / mag;
        const burst = clamp(14.5 + (owner.pac - 65) * 0.16, 14, 21.5);

        owner.skillCooldown = 0.75;
        owner.stamina = Math.max(30, owner.stamina - 4);
        owner.vx = nx * burst;
        owner.vy = ny * burst;
        owner.facingAngle = Math.atan2(ny, nx);
        owner.animState = 'kick';
        owner.animTimer = 0.18;
        owner.invulnTimer = 0.42;
        owner.chargePower = 0;
        owner.chargeKind = undefined;

        state.ball.ownerId = null;
        state.ball.pickupLockTimer = 0.22;
        state.ball.x = clamp(owner.x + nx * 1.45, 2, 98);
        state.ball.y = clamp(owner.y + ny * 1.45, 3, 97);
        state.ball.vx = nx * (burst * 1.15);
        state.ball.vy = ny * (burst * 1.15);
        state.ball.vz = 0.42;
        state.ball.lastTouchSide = owner.side;
        state.ball.lastTouchName = owner.shortName;
        state.ball.lastTouchPlayerId = owner.id;
        state.ball.kickKind = undefined;
        state.lastPasserId = owner.id;
        state.sfxQueue.push('kick_pass');
        state.pitchCallout = {
          text: 'ĐẨY BÓNG DÀI!',
          tone: 'cyan',
          x: owner.x,
          y: owner.y,
          timer: 0.95,
        };
      }
      return;
    }

    if (action === 'SKILL_STOP') {
      if (owner.skillCooldown <= 0 && owner.animTimer <= 0) {
        owner.skillCooldown = 0.65;
        owner.vx = 0;
        owner.vy = 0;
        owner.animState = 'idle';
        owner.animTimer = 0.18;
        owner.invulnTimer = 0.4;
        owner.chargePower = 0;
        owner.chargeKind = undefined;
        state.ball.vx = 0;
        state.ball.vy = 0;
        state.ball.vz = 0;
        state.ball.x = clamp(owner.x + Math.cos(owner.facingAngle) * 1.12, 1.5, 98.5);
        state.ball.y = clamp(owner.y + Math.sin(owner.facingAngle) * 1.12, 2.8, 97.2);
        state.pitchCallout = {
          text: 'DỪNG BÓNG GẤP!',
          tone: 'green',
          x: owner.x,
          y: owner.y,
          timer: 0.95,
        };
      }
      return;
    }

    if (action === 'GK_RUSH') {
      if (side === 'p1') state.p1GkRushTimer = 3.0;
      else state.p2GkRushTimer = 3.0;
      const gk = state.players.find((pl) => pl.side === side && pl.isGk);
      state.pitchCallout = {
        text: 'THỦ MÔN DÂNG CAO!',
        tone: 'cyan',
        x: gk?.x ?? 10,
        y: gk?.y ?? 50,
        timer: 1.15,
      };
      return;
    }

    if (action === 'SHOT_CHIP') {
      const distToGoal = Math.max(4, Math.hypot(goalTargetX - owner.x, 50 - owner.y));
      const chipDistSpread = Math.max(0, distToGoal - 14) * 0.16;
      const chipMissPad = Math.min(3.8, Math.max(0, distToGoal - 16) * 0.12);
      const chipY = clamp(
        50 + moveDirY * 4.2 + (Math.random() - 0.5) * (1.4 + chipDistSpread),
        45.6 - chipMissPad,
        54.4 + chipMissPad
      );
      const chipSpd = clamp(21 + (owner.sho - 65) * 0.16 + distToGoal * 0.18, 21, 33);
      const chipVz = clamp(6.5 + distToGoal * 0.11, 6.5, 9.8);
      if (side === 'p1') state.p1Shots += 1;
      else state.p2Shots += 1;
      executeKickToTarget(
        state,
        owner,
        goalTargetX,
        chipY,
        chipSpd,
        chipVz,
        owner.sho * 0.78 + owner.ovr * 0.22,
        false,
        undefined,
        'shot',
        0.68
      );
      state.pitchCallout = {
        text: 'SÚT BỔNG (CHIP)!',
        tone: 'cyan',
        x: owner.x,
        y: owner.y,
        timer: 1.05,
      };
      return;
    }

    if (action === 'SHOT_CURVE') {
      const curveDist = Math.max(4, Math.hypot(goalTargetX - owner.x, 50 - owner.y));
      const curveSpread = Math.max(0, curveDist - 16) * 0.15;
      const curveMissPad = Math.min(3.5, Math.max(0, curveDist - 18) * 0.11);
      const farCornerY =
        Math.abs(moveDirY) > 0.1
          ? moveDirY < 0
            ? 45.7
            : 54.3
          : owner.y < 50
          ? 54.3
          : 45.7;
      const curveSign: 1 | -1 = owner.y < 50 ? 1 : -1;
      const initialAimY = clamp(
        farCornerY - curveSign * 2.8 + (Math.random() - 0.5) * curveSpread,
        44.0 - curveMissPad,
        56.0 + curveMissPad
      );
      const curveSpd = clamp(34 + (owner.sho - 65) * 0.28 + (owner.ovr - 75) * 0.12, 34, 52);
      if (side === 'p1') state.p1Shots += 1;
      else state.p2Shots += 1;
      executeKickToTarget(
        state,
        owner,
        goalTargetX,
        initialAimY,
        curveSpd,
        clamp(1.9 + (owner.ovr - 75) * 0.03, 1.85, 2.7),
        owner.sho * 0.78 + owner.ovr * 0.22 + 8,
        false,
        undefined,
        'finesse',
        0.78
      );
      state.ball.finesseCurveSign = curveSign;
      state.ball.spinRate = 24;
      state.pitchCallout = {
        text: 'XOÁY CỨA LÒNG!',
        tone: 'green',
        x: owner.x,
        y: owner.y,
        timer: 1.05,
      };
      return;
    }

    if (action === 'SHOT_POWER_LONG') {
      if (!owner.powerWindupTimer || owner.powerWindupTimer <= 0) {
        const longDist = Math.max(4, Math.hypot(goalTargetX - owner.x, 50 - owner.y));
        const distSpread = 3.2 + Math.max(0, longDist - 14) * 0.24;
        const missMargin = Math.min(5.2, Math.max(0, longDist - 14) * 0.16);
        const aimY = clamp(
          50 + moveDirY * 4.4 + (Math.random() - 0.5) * distSpread,
          44.8 - missMargin,
          55.2 + missMargin
        );
        owner.powerWindupTimer = 0.34;
        owner.powerWindupAimX = goalTargetX;
        owner.powerWindupAimY = aimY;
        owner.vx *= 0.2;
        owner.vy *= 0.2;
        owner.animState = 'kick';
        owner.animTimer = 0.36;
        owner.facingAngle = Math.atan2(aimY - owner.y, goalTargetX - owner.x);
        owner.chargePower = 0;
        owner.chargeKind = undefined;
        state.pitchCallout = {
          text: 'LẤY ĐÀ SÚT XA...',
          tone: 'gold',
          x: owner.x,
          y: owner.y,
          timer: 0.65,
        };
      }
      return;
    }

    if (action === 'L') {
      if (inOwnHalf) {
        // PHÁ BÓNG (Clearance upfield!)
        const clearY = clamp(50 + (moveDirY || (Math.random() - 0.5)) * 26, 12, 88);
        const clearX = clamp(owner.x + atkDir * 38, 4, 96);
        executeKickToTarget(
          state,
          owner,
          clearX,
          clearY,
          clamp(30 + (owner.phy - 60) * 0.25, 28, 44),
          6.8,
          owner.pas * 0.5 + owner.def * 0.5,
          false,
          undefined,
          'clear',
          0.72
        );
      } else {
        // FC MOBILE SÚT: Weak (<0.26 easy steal), Finesse (0.48..0.82), Power Shot (0.82..0.90), Overpower (>=0.90 hits goalpost & ricochets out!)
        const pwr = clamp(shotPower, 0.12, 1);
        const isWeakShot = pwr < 0.26;
        const isSweetSpot = pwr >= 0.48 && pwr < 0.82;
        const isRocket = pwr >= 0.82 && pwr < 0.90;
        const isOverpowerPost = pwr >= 0.90;

        if (isWeakShot) {
          state.pitchCallout = {
            text: 'SÚT QUÁ NHẸ!',
            tone: 'red',
            x: owner.x,
            y: owner.y,
            timer: 1.0,
          };
        } else if (isOverpowerPost) {
          state.pitchCallout = {
            text: 'QUÁ LỰC!',
            tone: 'gold',
            x: owner.x,
            y: owner.y,
            timer: 1.0,
          };
        }

        const chosenPostY =
          Math.abs(moveDirY) > 0.1
            ? moveDirY < 0
              ? 45.4
              : 54.6
            : owner.y <= 50
            ? 45.4
            : 54.6;

        const lShotDist = Math.max(4, Math.hypot(goalTargetX - owner.x, 50 - owner.y));
        const distExtraSpread = Math.max(0, lShotDist - 14) * 0.16;
        const maxMissPad = Math.min(4.6, Math.max(0, lShotDist - 16) * 0.14);
        const spreadScale = isSweetSpot ? 0.09 : isRocket ? 0.13 : 0.155;
        const aimOffsetY =
          moveDirY * 4.4 +
          (Math.random() - 0.5) * (clamp((108 - owner.sho) * spreadScale, 0.22, 4.2) + distExtraSpread);
        const targetY = isOverpowerPost
          ? chosenPostY
          : clamp(50 + aimOffsetY, 45.5 - maxMissPad, 54.5 + maxMissPad);
        const shotGoalX = isOverpowerPost
          ? atkDir === 1
            ? 98.5
            : 1.5
          : goalTargetX;

        const speed = isWeakShot
          ? clamp(16 + pwr * 26 + (owner.sho - 65) * 0.2, 16, 24.5)
          : clamp(
              28 +
                pwr * 22 +
                (owner.sho - 65) * 0.36 +
                (owner.ovr - 75) * 0.12 +
                (isRocket || isOverpowerPost ? 6.0 : 0),
              27,
              64
            );
        const postShotDist = Math.max(4, Math.hypot(shotGoalX - owner.x, targetY - owner.y));
        const postEstT = clamp(postShotDist / speed, 0.1, 0.95);
        const vz = isOverpowerPost
          ? clamp((1.2 + 7.5 * postEstT * postEstT) / Math.max(0.16, postEstT), 1.7, 7.2)
          : isWeakShot
          ? 0.55
          : isRocket
          ? 1.9 + pwr * 2.1
          : 1.35 + pwr * 2.2;

        if (side === 'p1') state.p1Shots += 1;
        else state.p2Shots += 1;
        executeKickToTarget(
          state,
          owner,
          shotGoalX,
          targetY,
          speed,
          vz,
          isOverpowerPost
            ? 100
            : owner.sho * 0.74 + owner.ovr * 0.26 + (isSweetSpot ? 9 : 0),
          false,
          undefined,
          isRocket || isOverpowerPost ? 'powershot' : isSweetSpot ? 'finesse' : 'shot',
          pwr
        );
      }
    }
    return;
  }

  // DEFENDING CONTROLS (!sideHasBall)
  if (action === 'J' || action === 'PASS_LOFT' || action === 'PASS_LONG_LOFT') {
    // ĐỔI NGƯỜI (Switch to player closest to ball, excluding current if pressing repeatedly)
    const curLocal = side === 'p1' ? state.p1ActiveIdx : state.p2ActiveIdx;
    const closest = findClosestPlayerIdx(state, side, state.ball.x, state.ball.y, undefined, false);
    const nextIdx =
      closest === curLocal
        ? findClosestPlayerIdx(state, side, state.ball.x, state.ball.y, curLocal, false)
        : closest;
    if (side === 'p1') state.p1ActiveIdx = nextIdx;
    else state.p2ActiveIdx = nextIdx;
    return;
  }

  if (action === 'GK_RUSH') {
    // THỦ MÔN DÂNG CAO CHẶN BANH (Rush GK out for 3.0s)
    if (side === 'p1') state.p1GkRushTimer = 3.0;
    else state.p2GkRushTimer = 3.0;
    const gk = state.players.find((pl) => pl.side === side && pl.isGk);
    state.pitchCallout = {
      text: 'THỦ MÔN DÂNG CAO!',
      tone: 'cyan',
      x: gk?.x ?? 10,
      y: gk?.y ?? 50,
      timer: 1.15,
    };
    return;
  }

  if (action === 'I') {
    // HỖ TRỢ (2nd defender AI press for 1.8s)
    if (side === 'p1') state.p1SupportTimer = 1.8;
    else state.p2SupportTimer = 1.8;
    return;
  }

  if (action === 'K' || action === 'RAINBOW' || action === 'SKILL_KNOCKON' || action === 'SKILL_STOP') {
    // TẤC BÓNG (Standing Tackle)
    performStandingTackle(state, active);
    return;
  }

  if (action === 'L' || action === 'SHOT_CHIP' || action === 'SHOT_CURVE' || action === 'SHOT_POWER_LONG') {
    const ballDist = dist(active.x, active.y, state.ball.x, state.ball.y);
    const inOwnHalf = isPointInOwnHalf(active.x, side, state.half);

    // 1. AERIAL HEADER: when ball is flying overhead in the air & user presses Shoot near the ball!
    if (!owner && !active.sentOff && state.ball.z > 0.62 && state.ball.z <= 5.2 && ballDist < 7.2) {
      const atkDir = getAttackDir(side, state.half);
      // Leap toward ball spot so head visually meets the ball
      active.x = clamp(active.x + (state.ball.x - active.x) * 0.52, 1.5, 98.5);
      active.y = clamp(active.y + (state.ball.y - active.y) * 0.52, 2.8, 97.2);
      state.ball.x = clamp(active.x + atkDir * 0.4, 1.2, 98.8);
      state.ball.y = active.y;
      state.ball.z = clamp(state.ball.z, 1.05, 2.15);

      if (inOwnHalf) {
        const clearY = clamp(50 + (moveDirY || (Math.random() - 0.5)) * 28, 12, 88);
        const clearX = clamp(active.x + atkDir * 36, 4, 96);
        executeKickToTarget(
          state,
          active,
          clearX,
          clearY,
          clamp(30 + (active.phy - 60) * 0.26, 28, 44),
          5.6,
          active.def * 0.5 + active.phy * 0.5,
          false,
          undefined,
          'clear',
          0.74
        );
        active.animState = 'header';
        active.animTimer = 0.44;
        state.pitchCallout = {
          text: 'ĐÁNH ĐẦU PHÁ BÓNG!',
          tone: 'cyan',
          x: active.x,
          y: active.y,
          timer: 1.05,
        };
        return;
      }

      const goalTargetX = atkDir === 1 ? 99.2 : 0.8;
      const headDist = Math.max(4, Math.hypot(goalTargetX - active.x, 50 - active.y));
      const headSpread = Math.max(0, headDist - 12) * 0.14;
      const targetY = clamp(
        50 + moveDirY * 4.4 + (Math.random() - 0.5) * (1.8 + headSpread),
        45.2,
        54.8
      );
      const headerSpd = clamp(
        35 + (active.sho - 65) * 0.34 + (active.phy - 70) * 0.18 + (active.ovr - 75) * 0.12,
        34,
        58
      );
      if (side === 'p1') state.p1Shots += 1;
      else state.p2Shots += 1;
      executeKickToTarget(
        state,
        active,
        goalTargetX,
        targetY,
        headerSpd,
        action === 'SHOT_CHIP' ? 4.4 : 1.45,
        active.sho * 0.7 + active.phy * 0.2 + active.ovr * 0.1,
        false,
        undefined,
        action === 'SHOT_CURVE' ? 'finesse' : 'shot',
        0.78
      );
      if (action === 'SHOT_CURVE') {
        state.ball.finesseCurveSign = active.y < 50 ? 1 : -1;
        state.ball.spinRate = 18;
      }
      active.animState = 'header';
      active.animTimer = 0.44;
      state.pitchCallout = {
        text: 'ĐÁNH ĐẦU!!',
        tone: 'gold',
        x: active.x,
        y: active.y,
        timer: 1.1,
      };
      return;
    }

    // 2. Ground one-touch volley if loose ball right beside active attacker in opponent half
    if (!owner && !active.sentOff && !inOwnHalf && state.ball.z <= 0.62 && ballDist < 4.5) {
      const atkDir = getAttackDir(side, state.half);
      const goalTargetX = atkDir === 1 ? 99.2 : 0.8;
      const targetY = clamp(50 + moveDirY * 4.4 + (Math.random() - 0.5) * 2.2, 45.5, 54.5);
      const volleySpd = clamp(36 + (active.sho - 65) * 0.38 + (active.ovr - 75) * 0.14, 34, 60);
      if (side === 'p1') state.p1Shots += 1;
      else state.p2Shots += 1;
      executeKickToTarget(
        state,
        active,
        goalTargetX,
        targetY,
        volleySpd,
        1.7,
        active.sho * 0.75 + active.ovr * 0.25,
        false,
        undefined,
        'shot'
      );
      return;
    }
    // 3. XOẠC BÓNG (Slide Tackle)
    performSlideTackle(state, active, moveDirX, moveDirY);
    void offset;
  }
};

const stepBotAi = (state: ApexMatchState, dt: number): ApexControlInput => {
  // Scales gently for beginner tiers (0..1) up to Champion (5)
  const tier = state.botTierIndex;
  const tierSkills = [0.40, 0.52, 0.65, 0.78, 0.90, 1.00];
  const skillFactor = tierSkills[tier] ?? 0.52;
  const botIdx = findClosestPlayerIdx(state, 'p2', state.ball.x, state.ball.y, undefined, false);
  const owner = getOwner(state);

  if (owner?.side === 'p2') {
    state.p2ActiveIdx = state.players.indexOf(owner) - 11;
    const carrier = owner;
    const atkDir = getAttackDir('p2', state.half);
    const goalX = atkDir === 1 ? 98.5 : 1.5;
    const distToGoal = Math.abs(goalX - carrier.x);

    state.botDecisionTimer -= dt;
    if (state.botDecisionTimer <= 0) {
      state.botDecisionTimer = clamp(0.68 - tier * 0.10, 0.15, 0.68);
      // Shoot when inside striking zone! Higher-tier bots bend finesse shots from wide angles
      if (distToGoal < 24 + tier * 2.0 && Math.random() < 0.28 + tier * 0.10) {
        const aimY = (Math.random() - 0.5) * 0.9;
        const useCurve = tier >= 2 && Math.abs(carrier.y - 50) > 8 && Math.random() < 0.42;
        return {
          moveX: atkDir,
          moveY: aimY,
          shootHold: false,
          action: useCurve ? 'SHOT_CURVE' : 'L', // Shoot / Finesse Curve!
        };
      }
      // Check nearest P1 presser
      const p1ClosestIdx = findClosestPlayerIdx(state, 'p1', carrier.x, carrier.y);
      const presser = state.players[p1ClosestIdx];
      const pressDist = presser ? dist(presser.x, presser.y, carrier.x, carrier.y) : 99;
      if (pressDist < 6.0) {
        const roll = Math.random();
        if (roll < 0.30 * skillFactor) {
          return { moveX: atkDir, moveY: (Math.random() - 0.5) * 0.8, shootHold: false, action: 'I' };
        }
        if (roll < 0.70) {
          return { moveX: atkDir, moveY: (Math.random() - 0.5) * 1.1, shootHold: false, action: 'J' };
        }
        if (tier >= 1) {
          return { moveX: atkDir, moveY: (Math.random() - 0.5) * 0.7, shootHold: false, action: 'K' };
        }
      }
      state.botDribbleDir = {
        x: atkDir,
        y: clamp((50 - carrier.y) * 0.04 + (Math.random() - 0.5) * 0.65, -0.7, 0.7),
      };
    }

    return {
      moveX: state.botDribbleDir.x * skillFactor,
      moveY: state.botDribbleDir.y * skillFactor,
      shootHold: false,
      action: null,
    };
  }

  // Bot Defending: press ball carrier with slide tackle rate & standing tackle scaling
  state.p2ActiveIdx = botIdx;
  const activeBot = getActivePlayerForSide(state, 'p2');
  const dx = state.ball.x - activeBot.x;
  const dy = state.ball.y - activeBot.y;
  const d = Math.max(0.01, Math.hypot(dx, dy));

  let action: ApexButtonAction | null = null;
  state.botDecisionTimer -= dt;
  if (state.botDecisionTimer <= 0) {
    state.botDecisionTimer = clamp(0.65 - tier * 0.095, 0.16, 0.65);
    const botSlideRate = clamp(
      (BOT_SLIDE_TRIGGER_RATES[tier] ?? 0.17) + (activeBot.def - 75) * 0.002,
      0.08,
      0.45
    );
    if (d < 4.2 && Math.random() < 0.32 + tier * 0.11) {
      action = 'K'; // standing tackle
    } else if (
      d >= 2.8 &&
      d < 6.4 &&
      activeBot.tackleCooldown <= 0 &&
      Math.random() < botSlideRate
    ) {
      action = 'L'; // Bot slide tackle!
    } else if (tier >= 1 && Math.random() < 0.18 + tier * 0.04) {
      action = 'I'; // teammate support press
    }
  }

  return {
    moveX: (dx / d) * skillFactor,
    moveY: (dy / d) * skillFactor,
    shootHold: false,
    action,
  };
};

const stepNonActivePlayersAI = (state: ApexMatchState, dt: number) => {
  const owner = getOwner(state);
  const supportP1Idx =
    state.p1SupportTimer > 0
      ? findClosestPlayerIdx(state, 'p1', state.ball.x, state.ball.y, state.p1ActiveIdx, false)
      : -1;
  const supportP2Idx =
    state.p2SupportTimer > 0
      ? findClosestPlayerIdx(state, 'p2', state.ball.x, state.ball.y, state.p2ActiveIdx, false)
      : -1;

  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (p.sentOff) continue;

    const isP1 = p.side === 'p1';
    const isBotP2 = !isP1 && state.isBotOpp;
    const localIdx = isP1 ? i : i - 11;
    const activeLocal = isP1 ? state.p1ActiveIdx : state.p2ActiveIdx;
    const isControlled = localIdx === activeLocal;
    if (isControlled) continue;

    if (p.animTimer > 0) continue;

    const atkDir = getAttackDir(p.side, state.half);

    // Goalkeeper logic (reduced reaction & speed for Bot GK; rush sweeper if GK_RUSH triggered!)
    if (p.isGk) {
      const goalX = getGoalXForSideDefending(p.side, state.half);
      const isRushingOut = (isP1 ? state.p1GkRushTimer : state.p2GkRushTimer) > 0 && owner?.side !== p.side;
      const oppDribblerInBox =
        owner &&
        owner.side !== p.side &&
        !owner.isGk &&
        Math.abs(owner.x - goalX) <= 16.5 &&
        owner.y >= 24.5 &&
        owner.y <= 75.5 &&
        dist(p.x, p.y, owner.x, owner.y) <= 9.5;
      const targetY = isRushingOut
        ? state.ball.y
        : oppDribblerInBox
        ? clamp(50 + (state.ball.y - 50) * 0.68, 39.0, 61.0)
        : clamp(50 + (state.ball.y - 50) * (isBotP2 ? 0.34 : 0.44), 45.0, 55.0);
      const targetX = isRushingOut
        ? clamp(state.ball.x, 2, 98)
        : oppDribblerInBox
        ? clamp(goalX + atkDir * clamp(Math.abs(state.ball.x - goalX) * 0.56, 1.6, 9.5), 2, 98)
        : clamp(goalX + atkDir * (Math.abs(state.ball.x - goalX) < 18 ? 2.1 : 0.7), 2, 98);

      // Dive save if fast ball coming straight at own goal!
      const ballHeadingMyWay =
        (atkDir === 1 && state.ball.vx < -14 && state.ball.x < 18) ||
        (atkDir === -1 && state.ball.vx > 14 && state.ball.x > 82);
      const diveTriggerDist = isBotP2 ? 8.2 : 10.0;
      if (ballHeadingMyWay && dist(p.x, p.y, state.ball.x, state.ball.y) < diveTriggerDist && p.tackleCooldown <= 0) {
        const baseGkSkill = clamp(0.24 + (p.ovr - 75) * 0.022 + (p.phy - 70) * 0.01, 0.22, 0.94);
        const gkSkill = isBotP2
          ? clamp(baseGkSkill * (0.40 + state.botTierIndex * 0.065), 0.10, 0.54)
          : baseGkSkill;
        if (Math.random() < gkSkill) {
          p.animState = 'gk_dive';
          p.animTimer = 0.55;
          p.tackleCooldown = isBotP2 ? 1.45 : 1.15;
          const dy = clamp(state.ball.y - p.y, -5, 5);
          p.vy = dy * (isBotP2 ? 3.2 : 4.2);
          p.vx = 0;
        } else {
          p.tackleCooldown = 0.45;
        }
      } else {
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.3) {
          const baseGkSpd = clamp(5.4 + (p.pac - 55) * 0.09 + (p.ovr - 75) * 0.055, 5.4, 10.4);
          const gkSpd = isBotP2
            ? baseGkSpd * (oppDribblerInBox ? 0.88 + state.botTierIndex * 0.06 : 0.56 + state.botTierIndex * 0.06)
            : isRushingOut
            ? baseGkSpd * 1.48
            : oppDribblerInBox
            ? baseGkSpd * 1.16
            : baseGkSpd;
          p.vx = (dx / d) * gkSpd;
          p.vy = (dy / d) * gkSpd;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.facingAngle = Math.atan2(dy, dx);
          p.animState = 'run';
          p.animFrame += dt * (isRushingOut ? 9 : 6);
        } else {
          p.vx = 0;
          p.vy = 0;
          p.animState = 'idle';
        }
      }
      continue;
    }

    // Outfield Teammate/Defender AI (All 11 players actively move!)
    const home = getHomeCoords(p, p.side, state.half);
    const teamHasBall = owner?.side === p.side;
    const isSupporter = isP1 ? localIdx === supportP1Idx : localIdx === supportP2Idx;

    let tx = home.x;
    let ty = home.y;

    if (isSupporter) {
      tx = state.ball.x;
      ty = state.ball.y;
    } else if (teamHasBall && owner) {
      // Smarter FC Mobile attacking runs: forwards surge into through-ball channels, cut into box on crosses, and midfielders build passing triangles
      const isAttackerRole = p.baseX >= 62;
      const isMidfieldSupport = p.baseX >= 36 && p.baseX < 62;
      const oppGoalX = atkDir === 1 ? 98.8 : 1.2;
      const ownerInFinalThird = Math.abs(owner.x - oppGoalX) < 34;
      const ownerWide = Math.abs(owner.y - 50) > 17;
      const pushBoost = isAttackerRole ? 21 : isMidfieldSupport ? 15 : 11;
      let desiredX = home.x + atkDir * pushBoost + (state.ball.x - 50) * 0.4;
      let boxTargetY: number | null = null;

      if (ownerInFinalThird && isAttackerRole) {
        // Dynamic near-post, penalty-spot, and far-post box runs for cut-backs & aerial headers
        if (ownerWide) {
          const sameSide = (home.y - 50) * (owner.y - 50) > 0;
          desiredX = oppGoalX - atkDir * (sameSide ? 13.5 : 10.5);
          boxTargetY = sameSide ? 50 + (owner.y < 50 ? -7.5 : 7.5) : 50 + (owner.y < 50 ? 9.5 : -9.5);
        } else {
          desiredX = oppGoalX - atkDir * (Math.abs(home.y - 50) < 12 ? 12.0 : 15.0);
          boxTargetY = clamp(50 + (home.y - 50) * 0.45, 34, 66);
        }
      } else if (isMidfieldSupport && Math.abs(owner.x - home.x) < 16) {
        // Step into open diagonal support angle ahead or beside ball carrier
        desiredX = owner.x + atkDir * (Math.abs(home.y - owner.y) > 14 ? 8.5 : 5.5);
      }

      if (isAttackerRole) {
        // Find opponent's 2nd deepest player to hold an intelligent onside shoulder line
        const oppOff = isP1 ? 11 : 0;
        const oppXs: number[] = [];
        for (let j = 0; j < 11; j++) {
          const op = state.players[oppOff + j];
          if (op && !op.sentOff) oppXs.push(op.x);
        }
        oppXs.sort((a, b) => (atkDir === 1 ? b - a : a - b));
        const offsideLine = oppXs[1] ?? (atkDir === 1 ? 84 : 16);
        desiredX =
          atkDir === 1
            ? Math.min(desiredX, Math.max(state.ball.x + 2, offsideLine - 1.1))
            : Math.max(desiredX, Math.min(state.ball.x - 2, offsideLine + 1.1));
      }
      tx = clamp(desiredX, 6, 94);
      const wideLanePull = Math.abs(home.y - 50) > 16 ? (home.y - 50) * 0.18 : 0;
      const triangleSpreadY =
        isMidfieldSupport && Math.abs(home.y - owner.y) < 10
          ? home.y < 50
            ? -8.5
            : 8.5
          : 0;
      ty =
        boxTargetY !== null
          ? clamp(boxTargetY, 12, 88)
          : clamp(home.y + (state.ball.y - home.y) * 0.18 + wideLanePull + triangleSpreadY, 7, 93);
    } else {
      const ownGoalX = getGoalXForSideDefending(p.side, state.half);
      const ballInDangerZone = Math.abs(state.ball.x - ownGoalX) < 24;
      const ballPull = (state.ball.x - home.x) * (ballInDangerZone ? 0.42 : 0.34);
      const compactShift = (ownGoalX - home.x) * (ballInDangerZone ? 0.18 : 0.12);
      tx = clamp(home.x - atkDir * 9 + ballPull + compactShift, 6, 94);
      const verticalCompact = ballInDangerZone ? (50 - home.y) * 0.14 : 0;
      ty = clamp(home.y + (state.ball.y - home.y) * 0.38 + verticalCompact, 7, 93);
    }

    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    const botPaceMod = isBotP2 ? 0.72 + state.botTierIndex * 0.055 : 1;
    const offBallStamMod = clamp(0.88 + (p.stamina / 100) * 0.12, 0.88, 1);
    const spd =
      clamp(4.7 + (p.pac - 60) * 0.115 + (p.ovr - 75) * 0.068, 4.7, 12.1) *
      (isSupporter ? 1.14 : 0.86) *
      botPaceMod *
      offBallStamMod;
    if (d > 0.8) {
      p.vx = (dx / d) * spd;
      p.vy = (dy / d) * spd;
      p.x = clamp(p.x + p.vx * dt, 2.5, 97.5);
      p.y = clamp(p.y + p.vy * dt, 5.5, 94.5);
      p.facingAngle = Math.atan2(p.vy, p.vx);
      p.animState = 'run';
      p.animFrame += dt * (5.5 + spd * 0.28);
      p.stamina = Math.min(100, p.stamina + dt * (isSupporter ? 0.4 : 1.4));
    } else {
      p.vx = 0;
      p.vy = 0;
      p.animState = 'idle';
      p.animFrame += dt * 2.5;
      p.stamina = Math.min(100, p.stamina + dt * 3.4);
    }
  }
};

export function stepApexMatch(
  state: ApexMatchState,
  dtRaw: number,
  p1Input: ApexControlInput,
  p2InputOverride?: ApexControlInput
): void {
  const dt = clamp(dtRaw, 0.005, 0.06);

  if (state.banner) {
    state.banner.timer -= dt;
    if (state.banner.timer <= 0) state.banner = null;
  }
  if (state.pitchCallout) {
    state.pitchCallout.timer -= dt;
    if (state.pitchCallout.timer <= 0) state.pitchCallout = null;
  }
  if (state.referee.cardTimer > 0) {
    state.referee.cardTimer -= dt;
    if (state.referee.cardTimer <= 0) state.referee.cardShown = 'none';
  }

  // Non-active phases: intro, halftime, outro
  if (state.phase === 'intro' || state.phase === 'halftime' || state.phase === 'outro') {
    state.phaseTimer -= dt;
    state.camera.x += (state.ball.x - state.camera.x) * Math.min(1, dt * 6);
    state.camera.y += (state.ball.y - state.camera.y) * Math.min(1, dt * 6);
    if (state.phaseTimer <= 0) {
      if (state.phase === 'intro') {
        state.phase = 'half1';
      } else if (state.phase === 'halftime') {
        state.half = 2;
        state.phase = 'half2';
        placeFormationForKickoff(state, 'p2');
        state.banner = {
          id: 'kickoff_h2',
          title: 'HIỆP 2 BẮT ĐẦU!',
          subtitle: 'ĐỔI SÂN · PHÁT BÓNG TIẾP TỤC',
          tone: 'whistle',
          timer: 2.0,
        };
        state.sfxQueue.push('whistle_long');
      }
    }
    return;
  }

  // Goal Celebration freeze & reset
  if (state.goalCelebration && state.goalCelebration.active) {
    state.goalCelebration.timer -= dt;
    const cel = state.goalCelebration;
    const scorerEnt = cel.scorerId
      ? state.players.find((pl) => pl.id === cel.scorerId)
      : state.players.find((pl) => pl.side === cel.side && (pl.name === cel.scorer || pl.shortName === cel.scorer));
    if (scorerEnt) {
      state.camera.x += (scorerEnt.x - state.camera.x) * Math.min(1, dt * 6.5);
      state.camera.y += (scorerEnt.y - state.camera.y) * Math.min(1, dt * 6.5);
    }
    for (const p of state.players) {
      if (!p.sentOff && p.side === state.goalCelebration.side && !p.isGk) {
        p.animState = 'celebrate';
        p.animFrame += dt * 9;
      }
    }
    if (state.goalCelebration.timer <= 0) {
      const concededSide: ApexTeamSide = state.goalCelebration.side === 'p1' ? 'p2' : 'p1';
      state.goalCelebration = null;
      placeFormationForKickoff(state, concededSide);
    }
    return;
  }

  // Interactive Set Piece Mode (Throw-in Wait / Corner Kick Aiming / Goal Kick / Free Kick / Offside)
  if (state.setPiece.type !== 'none') {
    state.setPiece.timer -= dt;
    const spSide = state.setPiece.side;
    const spInput = spSide === 'p1' ? p1Input : p2InputOverride || { moveX: 0, moveY: 0, shootHold: false, action: null };

    if (state.setPiece.type === 'corner') {
      const crossedLeft = state.setPiece.x < 50;
      // Allow attacking player to aim target circle in box!
      const { wx, wy } =
        spSide === 'p2' && state.isBotOpp
          ? { wx: 0, wy: 0 }
          : screenInputToWorldDir(spInput.moveX, spInput.moveY);
      const minAimX = crossedLeft ? 4 : 76;
      const maxAimX = crossedLeft ? 24 : 96;
      const curAimX = state.setPiece.aimX ?? (crossedLeft ? 12 : 88);
      const curAimY = state.setPiece.aimY ?? 50;
      state.setPiece.aimX = clamp(curAimX + wx * 18 * dt, minAimX, maxAimX);
      state.setPiece.aimY = clamp(curAimY + wy * 22 * dt, 22, 78);

      const boxFocusX = crossedLeft ? 12 : 88;
      state.camera.x += (boxFocusX - state.camera.x) * Math.min(1, dt * 6);
      state.camera.y += (48 - state.camera.y) * Math.min(1, dt * 6);

      const takerLocal = findClosestPlayerIdx(state, spSide, state.setPiece.x, state.setPiece.y, undefined, false);
      const offset = spSide === 'p1' ? 0 : 11;
      const taker = state.players[offset + takerLocal];

      const botCornerTrigger = spSide === 'p2' && state.isBotOpp && state.setPiece.timer <= 2.3;
      const userCornerAct = !(spSide === 'p2' && state.isBotOpp) && state.setPiece.timer <= 4.55 ? spInput.action : null;

      if (userCornerAct === 'J') {
        // Short pass corner!
        if (taker) {
          const { target, localIdx } = findBestPassTarget(state, taker, crossedLeft ? 1 : -1, state.setPiece.y < 50 ? 0.8 : -0.8);
          if (target) {
            executeKickToTarget(state, taker, target.x, target.y, 22, 0.3, taker.pas, true, target.id);
            if (spSide === 'p1') state.p1ActiveIdx = localIdx;
            else state.p2ActiveIdx = localIdx;
          }
        }
        state.setPiece.type = 'none';
        return;
      }

      if (userCornerAct === 'I' || userCornerAct === 'L' || botCornerTrigger || state.setPiece.timer <= 0) {
        const tx = state.setPiece.aimX ?? boxFocusX;
        const ty = state.setPiece.aimY ?? 50;
        const isDriven = userCornerAct === 'L';
        if (taker) {
          taker.x = state.setPiece.x;
          taker.y = state.setPiece.y;
          executeKickToTarget(
            state,
            taker,
            tx,
            ty,
            isDriven ? 34 : 26,
            isDriven ? 3.2 : 6.8,
            taker.pas,
            false
          );
          // Auto-switch to nearest attacking teammate around the cross target!
          const headerIdx = findClosestPlayerIdx(state, spSide, tx, ty, takerLocal, false);
          if (spSide === 'p1') state.p1ActiveIdx = headerIdx;
          else state.p2ActiveIdx = headerIdx;
        }
        state.setPiece.type = 'none';
        return;
      }
      return;
    }

    if (state.setPiece.type === 'throw_in') {
      enforceSetPieceRadius(state, spSide, state.setPiece.x, state.setPiece.y, 8.5);
      state.camera.x += (state.setPiece.x - state.camera.x) * Math.min(1, dt * 6);
      state.camera.y += (state.setPiece.y - state.camera.y) * Math.min(1, dt * 6);

      const { wx, wy } =
        spSide === 'p2' && state.isBotOpp
          ? { wx: getAttackDir('p2', state.half), wy: state.setPiece.y < 50 ? 0.6 : -0.6 }
          : screenInputToWorldDir(spInput.moveX, spInput.moveY);

      const botThrowTrigger = spSide === 'p2' && state.isBotOpp && state.setPiece.timer <= 0.65;
      const userThrowTrigger =
        !(spSide === 'p2' && state.isBotOpp) &&
        state.setPiece.timer <= 2.2 &&
        (spInput.action === 'J' || spInput.action === 'I' || spInput.action === 'L');

      if (userThrowTrigger || botThrowTrigger || state.setPiece.timer <= 0) {
        const takerLocal = findClosestPlayerIdx(state, spSide, state.setPiece.x, state.setPiece.y, undefined, false);
        const offset = spSide === 'p1' ? 0 : 11;
        const taker = state.players[offset + takerLocal];
        if (taker) {
          taker.x = state.setPiece.x;
          taker.y = state.setPiece.y;
          const atkDir = getAttackDir(spSide, state.half);
          const aimVecX = Math.hypot(wx, wy) > 0.1 ? wx : atkDir * 0.5;
          const aimVecY = Math.hypot(wx, wy) > 0.1 ? wy : state.setPiece.y < 50 ? 1 : -1;
          const { target, localIdx } = findBestPassTarget(state, taker, aimVecX, aimVecY);
          if (target) {
            const throwSpd = spInput.action === 'I' ? 28 : 22;
            executeKickToTarget(state, taker, target.x, target.y, throwSpd, 2.2, taker.pas, false);
            if (spSide === 'p1') state.p1ActiveIdx = localIdx;
            else state.p2ActiveIdx = localIdx;
          } else {
            state.ball.ownerId = taker.id;
          }
        }
        state.setPiece.type = 'none';
        return;
      }
      return;
    }

    // Goal kick / Free kick / Offside wait & lofted execution
    if (state.setPiece.type === 'goal_kick') {
      const takerLocal = findClosestPlayerIdx(state, spSide, state.setPiece.x, state.setPiece.y, undefined, true);
      const gk = state.players[(spSide === 'p1' ? 0 : 11) + takerLocal];
      if (gk) enforceGkSafetySpacing(state, gk, 18.5);
    } else {
      enforceSetPieceRadius(state, spSide, state.setPiece.x, state.setPiece.y, 10.5);
    }
    state.camera.x += (state.setPiece.x - state.camera.x) * Math.min(1, dt * 7);
    state.camera.y += (state.setPiece.y - state.camera.y) * Math.min(1, dt * 7);

    const isFreeOrOffside = state.setPiece.type === 'free_kick' || state.setPiece.type === 'offside';
    const userFkTrigger =
      isFreeOrOffside &&
      !(spSide === 'p2' && state.isBotOpp) &&
      state.setPiece.timer <= (state.setPiece.maxTimer || 1.6) - 0.18 &&
      (spInput.action === 'J' ||
        spInput.action === 'I' ||
        spInput.action === 'L' ||
        spInput.action === 'PASS_LOFT' ||
        spInput.action === 'PASS_LONG_LOFT' ||
        spInput.action === 'SHOT_CHIP' ||
        spInput.action === 'SHOT_CURVE');

    if (userFkTrigger || state.setPiece.timer <= 0) {
      const takerLocal = findClosestPlayerIdx(
        state,
        spSide,
        state.setPiece.x,
        state.setPiece.y,
        undefined,
        state.setPiece.type === 'goal_kick'
      );
      const offset = spSide === 'p1' ? 0 : 11;
      const taker = state.players[offset + takerLocal];
      if (taker) {
        taker.x = state.setPiece.x;
        taker.y = state.setPiece.y;
        const atkDir = getAttackDir(spSide, state.half);
        if (state.setPiece.type === 'goal_kick') {
          executeKickToTarget(
            state,
            taker,
            clamp(taker.x + atkDir * 34, 15, 85),
            34 + Math.random() * 32,
            32,
            6.8,
            taker.pas,
            false
          );
        } else {
          // Lofted Free Kick / Offside Restart! Soaring aerial ball upfield or lofted shot toward goal!
          const goalX = atkDir === 1 ? 99.0 : 1.0;
          const distToGoal = Math.hypot(goalX - taker.x, 50 - taker.y);
          const inShootRange = !isPointInOwnHalf(taker.x, spSide, state.half) && distToGoal < 38;
          const isShotChoice =
            spInput.action === 'L' ||
            spInput.action === 'SHOT_CURVE' ||
            spInput.action === 'SHOT_CHIP' ||
            (!userFkTrigger && inShootRange && Math.random() < 0.55);

          if (isShotChoice && inShootRange) {
            const aimY = clamp(50 + spInput.moveY * 4.4 + (Math.random() - 0.5) * 2.8, 45.2, 54.8);
            const fkSpd = clamp(29 + distToGoal * 0.25 + (taker.sho - 70) * 0.22, 29, 44);
            const fkVz = clamp(6.6 + distToGoal * 0.08, 6.6, 9.6);
            if (spSide === 'p1') state.p1Shots += 1;
            else state.p2Shots += 1;
            executeKickToTarget(
              state,
              taker,
              goalX,
              aimY,
              fkSpd,
              fkVz,
              taker.sho * 0.78 + taker.ovr * 0.22 + 5,
              false,
              undefined,
              'finesse',
              0.78
            );
            state.ball.finesseCurveSign = taker.y < 50 ? 1 : -1;
            state.ball.spinRate = 18;
            state.pitchCallout = {
              text: 'ĐÁ PHẠT BỔNG XOÁY!',
              tone: 'gold',
              x: taker.x,
              y: taker.y,
              timer: 1.2,
            };
          } else {
            const { wx, wy } =
              spSide === 'p2' && state.isBotOpp
                ? { wx: atkDir, wy: 0 }
                : screenInputToWorldDir(spInput.moveX, spInput.moveY);
            const aimX = Math.hypot(wx, wy) > 0.1 ? wx : atkDir;
            const aimY = Math.hypot(wx, wy) > 0.1 ? wy : taker.y < 50 ? 0.2 : -0.2;
            const { target, localIdx } = findBestPassTarget(state, taker, aimX, aimY);
            const tx = target ? target.x + atkDir * 4 : clamp(taker.x + atkDir * 28, 8, 92);
            const ty = target ? target.y : clamp(taker.y + (taker.y < 50 ? 8 : -8), 14, 86);
            const fkDist = Math.hypot(tx - taker.x, ty - taker.y);
            const fkSpd = clamp(23 + fkDist * 0.36, 23, 38);
            const fkVz = clamp(6.9 + fkDist * 0.095, 6.9, 10.6);
            executeKickToTarget(
              state,
              taker,
              tx,
              ty,
              fkSpd,
              fkVz,
              taker.pas * 0.78 + taker.ovr * 0.22,
              Boolean(target),
              target?.id,
              'pass',
              0.76
            );
            state.ball.spinRate = 11;
            if (target) {
              if (spSide === 'p1') state.p1ActiveIdx = localIdx;
              else state.p2ActiveIdx = localIdx;
            }
            state.pitchCallout = {
              text: 'ĐÁ PHẠT BỔNG!',
              tone: 'cyan',
              x: taker.x,
              y: taker.y,
              timer: 1.15,
            };
          }
        }
      }
      state.setPiece.type = 'none';
    }
    return;
  }

  // Active Match Clock Countdown (45s Half 1 + 45s Half 2 = 90s Total)
  state.playSecondsLeft = Math.max(0, state.playSecondsLeft - dt);
  state.totalPlayTicks += 1;

  if (state.half === 1 && state.playSecondsLeft <= 45) {
    state.phase = 'halftime';
    state.phaseTimer = 2.8;
    state.banner = {
      id: 'ht_whistle',
      title: 'HẾT HIỆP 1 · NGHỈ GIỮA HIỆP',
      subtitle: `TỈ SỐ: ${state.p1Score} - ${state.p2Score}`,
      tone: 'whistle',
      timer: 2.8,
    };
    state.sfxQueue.push('whistle_long');
    return;
  }

  if (state.half === 2 && state.playSecondsLeft <= 0) {
    state.phase = 'outro';
    state.phaseTimer = 2.6;
    state.banner = {
      id: 'ft_whistle',
      title: 'HẾT GIỜ · CÒI MÃN CUỘC!',
      subtitle: `KẾT QUẢ CHUNG CUỘC: ${state.p1Score} - ${state.p2Score}`,
      tone: 'whistle',
      timer: 2.6,
    };
    state.sfxQueue.push('whistle_triple');
    return;
  }

  // Update timers & kickoff/GK spacing protection
  if (state.p1SupportTimer > 0) state.p1SupportTimer = Math.max(0, state.p1SupportTimer - dt);
  if (state.p2SupportTimer > 0) state.p2SupportTimer = Math.max(0, state.p2SupportTimer - dt);
  if (state.p1GkRushTimer > 0) state.p1GkRushTimer = Math.max(0, state.p1GkRushTimer - dt);
  if (state.p2GkRushTimer > 0) state.p2GkRushTimer = Math.max(0, state.p2GkRushTimer - dt);
  if (state.ball.pickupLockTimer > 0) state.ball.pickupLockTimer = Math.max(0, state.ball.pickupLockTimer - dt);
  if (state.ball.kickTimer && state.ball.kickTimer > 0) {
    state.ball.kickTimer = Math.max(0, state.ball.kickTimer - dt);
    if (state.ball.kickTimer <= 0) {
      state.ball.kickTargetId = null;
    }
  }

  if (state.kickoffProtectTimer > 0) {
    state.kickoffProtectTimer = Math.max(0, state.kickoffProtectTimer - dt);
    const kickOwner = getOwner(state);
    if (kickOwner) {
      enforceSetPieceRadius(state, kickOwner.side, 50, 50, 13.5);
    }
  }

  for (const p of state.players) {
    if (p.animTimer > 0) {
      p.animTimer = Math.max(0, p.animTimer - dt);
      if (
        p.animTimer <= 0 &&
        (p.animState === 'kick' ||
          p.animState === 'header' ||
          p.animState === 'slide' ||
          p.animState === 'roulette' ||
          p.animState === 'rainbow' ||
          p.animState === 'fallen' ||
          p.animState === 'gk_dive')
      ) {
        p.animState = 'idle';
      }
    }
    if (p.skillCooldown > 0) p.skillCooldown = Math.max(0, p.skillCooldown - dt);
    if (p.tackleCooldown > 0) p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);

    // Power Long Shot windup progression ("lấy đà sút xa")
    if (p.powerWindupTimer && p.powerWindupTimer > 0) {
      const curBallOwner = getOwner(state);
      if (curBallOwner?.id !== p.id || p.sentOff || p.animState === 'fallen') {
        p.powerWindupTimer = 0;
      } else {
        p.powerWindupTimer -= dt;
        p.vx *= 0.72;
        p.vy *= 0.72;
        if (p.powerWindupTimer <= 0) {
          p.powerWindupTimer = 0;
          const atkDir = getAttackDir(p.side, state.half);
          const aimX = p.powerWindupAimX ?? (atkDir === 1 ? 99.2 : 0.8);
          const aimY = p.powerWindupAimY ?? 50;
          const dGoal = Math.max(4, Math.hypot(aimX - p.x, aimY - p.y));
          const longSpd = clamp(54 + (p.sho - 65) * 0.42 + (p.ovr - 75) * 0.16, 52, 74);
          const longAcc = clamp(p.sho * 0.62 - Math.max(0, dGoal - 14) * 0.72, 16, 68);
          const longVz = clamp(1.7 + dGoal * 0.048, 1.7, 3.85);
          if (p.side === 'p1') state.p1Shots += 1;
          else state.p2Shots += 1;
          executeKickToTarget(
            state,
            p,
            aimX,
            aimY,
            longSpd,
            longVz,
            longAcc,
            false,
            undefined,
            'powershot',
            0.88
          );
          state.pitchCallout = {
            text: 'SÚT XA UY LỰC!',
            tone: 'gold',
            x: p.x,
            y: p.y,
            timer: 1.1,
          };
        }
      }
    }
  }

  const p2Input: ApexControlInput = state.isBotOpp
    ? stepBotAi(state, dt)
    : p2InputOverride || { moveX: 0, moveY: 0, shootHold: false, action: null };

  // Process Active Player Control for P1 & P2
  const handleControlledSide = (
    side: ApexTeamSide,
    input: ApexControlInput,
    isWorldBotDir: boolean
  ) => {
    const active = getActivePlayerForSide(state, side);
    const owner = getOwner(state);
    if (owner?.side === side && owner.id !== active.id) {
      // Ensure cursor stays on ball owner!
      const ownerIdx = state.players.indexOf(owner);
      if (side === 'p1') state.p1ActiveIdx = ownerIdx;
      else state.p2ActiveIdx = ownerIdx - 11;
    } else if (owner && owner.side !== side && active.animState === 'fallen') {
      autoSwitchOnPossessionLoss(state, side, state.players.indexOf(active));
    }

    const controlled = getActivePlayerForSide(state, side);
    const { wx, wy } = isWorldBotDir
      ? { wx: input.moveX, wy: input.moveY }
      : screenInputToWorldDir(input.moveX, input.moveY);

    if (controlled.animTimer <= 0) {
      const hasBall = owner?.id === controlled.id;
      const staminaScale = clamp(0.86 + (controlled.stamina / 100) * 0.14, 0.86, 1);
      const spd =
        clamp(
          4.9 + (controlled.pac - 60) * 0.12 + (controlled.ovr - 75) * 0.072,
          4.9,
          12.6
        ) *
        (hasBall ? clamp(0.82 + (controlled.dri - 70) * 0.0042, 0.78, 0.98) : 1.03) *
        (controlled.invulnTimer > 0 ? 1.26 : 1) *
        staminaScale;

      if (Math.hypot(wx, wy) > 0.05) {
        const mag = Math.hypot(wx, wy);
        const nx = wx / mag;
        const ny = wy / mag;
        controlled.vx = nx * spd;
        controlled.vy = ny * spd;
        controlled.x = clamp(controlled.x + controlled.vx * dt, 1.5, 98.5);
        controlled.y = clamp(controlled.y + controlled.vy * dt, 2.8, 97.2);
        controlled.facingAngle = Math.atan2(ny, nx);
        controlled.animState = 'run';
        controlled.animFrame += dt * (6 + spd * 0.28);
        controlled.stamina = Math.max(30, controlled.stamina - dt * 0.75);
      } else {
        controlled.vx = 0;
        controlled.vy = 0;
        controlled.animState = 'idle';
        controlled.animFrame += dt * 2.5;
        controlled.stamina = Math.min(100, controlled.stamina + dt * 3.4);
      }
    } else if (controlled.animState === 'slide') {
      controlled.x = clamp(controlled.x + controlled.vx * dt, 1.5, 98.5);
      controlled.y = clamp(controlled.y + controlled.vy * dt, 2.8, 97.2);
      controlled.vx *= 0.91;
      controlled.vy *= 0.91;
    } else if (controlled.animState === 'roulette') {
      controlled.x = clamp(controlled.x + controlled.vx * dt, 1.5, 98.5);
      controlled.y = clamp(controlled.y + controlled.vy * dt, 2.8, 97.2);
      controlled.vx *= 0.96;
      controlled.vy *= 0.96;
      controlled.animFrame += dt * 16;
    } else if (controlled.animState === 'rainbow') {
      controlled.x = clamp(controlled.x + controlled.vx * dt, 1.5, 98.5);
      controlled.y = clamp(controlled.y + controlled.vy * dt, 2.8, 97.2);
      controlled.vx *= 0.97;
      controlled.vy *= 0.97;
      controlled.animFrame += dt * 15;
    } else if (controlled.animState === 'header') {
      controlled.x = clamp(controlled.x + controlled.vx * dt * 0.45, 1.5, 98.5);
      controlled.y = clamp(controlled.y + controlled.vy * dt * 0.45, 2.8, 97.2);
      controlled.vx *= 0.9;
      controlled.vy *= 0.9;
      controlled.animFrame += dt * 12;
    }

    const isSwipeAction =
      input.action === 'PASS_LOFT' ||
      input.action === 'PASS_LONG_LOFT' ||
      input.action === 'SHOT_CHIP' ||
      input.action === 'SHOT_CURVE' ||
      input.action === 'SHOT_POWER_LONG' ||
      input.action === 'GK_RUSH';

    // If a swipe gesture fired, cleanly abort any partial hold-charge so it doesn't double-fire!
    if (isSwipeAction) {
      if (side === 'p1') {
        state.p1HoldAction = null;
        state.p1HoldShoot = false;
      } else {
        state.p2HoldAction = null;
        state.p2HoldShoot = false;
      }
      if (owner?.side === side) {
        owner.chargePower = 0;
        owner.chargeKind = undefined;
      }
    }

    // Unified Hold-to-Charge for Pass (J), Through Ball (I), and Shoot (L in opp half)
    const activeHold: 'I' | 'J' | 'L' | null = isSwipeAction
      ? null
      : input.holdAction ?? (input.shootHold ? 'L' : null);
    const isChargingShoot =
      activeHold === 'L' &&
      owner?.side === side &&
      owner &&
      !isPointInOwnHalf(owner.x, side, state.half);
    const isChargingPass =
      (activeHold === 'J' || activeHold === 'I') && owner?.side === side && owner;

    const prevHoldAct = isSwipeAction
      ? null
      : (side === 'p1' ? state.p1HoldAction : state.p2HoldAction) ??
        ((side === 'p1' ? state.p1HoldShoot : state.p2HoldShoot) ? 'L' : null);

    if ((isChargingShoot || isChargingPass) && owner) {
      const rate = activeHold === 'L' ? 1.45 : 1.38;
      owner.chargeKind = activeHold === 'J' ? 'pass' : activeHold === 'I' ? 'through' : 'shoot';
      owner.chargePower = clamp(owner.chargePower + dt * rate, 0.14, 1);
      if (side === 'p1') {
        state.p1HoldAction = activeHold;
        state.p1HoldShoot = activeHold === 'L';
      } else {
        state.p2HoldAction = activeHold;
        state.p2HoldShoot = activeHold === 'L';
      }
      if (owner.chargePower >= 1) {
        // Max charge auto-fire (Overpowered!)
        fireActionForSide(state, side, activeHold!, wx, wy, 1);
        if (side === 'p1') {
          state.p1HoldAction = null;
          state.p1HoldShoot = false;
        } else {
          state.p2HoldAction = null;
          state.p2HoldShoot = false;
        }
      }
    } else if (prevHoldAct && activeHold !== prevHoldAct) {
      // Released Pass / Through / Shoot button!
      if (side === 'p1') {
        state.p1HoldAction = null;
        state.p1HoldShoot = false;
      } else {
        state.p2HoldAction = null;
        state.p2HoldShoot = false;
      }
      if (owner?.side === side && owner.chargePower > 0.05) {
        fireActionForSide(state, side, prevHoldAct, wx, wy, owner.chargePower);
      } else if (owner?.side === side) {
        owner.chargePower = 0;
        owner.chargeKind = undefined;
      }
    } else if (owner && owner.side === side && !activeHold) {
      owner.chargePower = 0;
      owner.chargeKind = undefined;
    }

    if (input.action) {
      fireActionForSide(state, side, input.action, wx, wy, 0.65);
    }
  };

  handleControlledSide('p1', p1Input, false);
  handleControlledSide('p2', p2Input, state.isBotOpp);

  // Move all non-active AI players + GK
  stepNonActivePlayersAI(state, dt);

  // Move Ball & Check Collisions / Rules
  const curOwner = getOwner(state);
  if (curOwner && !curOwner.sentOff) {
    if (curOwner.side === 'p1') state.p1PossTicks += 1;
    // Enforce GK safety spacing while goalkeeper holds the ball + auto release cleanly!
    let gkReleased = false;
    if (curOwner.isGk) {
      enforceGkSafetySpacing(state, curOwner, 14.0);
      if (state.gkHoldTimer > 0) state.gkHoldTimer = Math.max(0, state.gkHoldTimer - dt);
      const isBotGk = curOwner.side === 'p2' && state.isBotOpp;
      if ((isBotGk && state.gkHoldTimer <= 1.2) || state.gkHoldTimer <= 0) {
        const atkDir = getAttackDir(curOwner.side, state.half);
        // Prefer open forward outlet for crisp fast counter-attack distribution
        const teamOff = curOwner.side === 'p1' ? 0 : 11;
        const oppOff = curOwner.side === 'p1' ? 11 : 0;
        let counterTarget: ApexPlayerEntity | null = null;
        let counterLocalIdx = 0;
        let bestCounterScore = -Infinity;
        for (let j = 0; j < 11; j++) {
          const mate = state.players[teamOff + j];
          if (!mate || mate.sentOff || mate.isGk || mate.id === curOwner.id) continue;
          const forwardGain = (mate.x - curOwner.x) * atkDir;
          if (forwardGain < 14 || forwardGain > 54) continue;
          let minOppDist = 999;
          for (let k = 0; k < 11; k++) {
            const opp = state.players[oppOff + k];
            if (opp && !opp.sentOff) {
              minOppDist = Math.min(minOppDist, dist(mate.x, mate.y, opp.x, opp.y));
            }
          }
          if (minOppDist < 7.5) continue;
          const score = forwardGain * 0.55 + Math.min(20, minOppDist) * 1.4;
          if (score > bestCounterScore) {
            bestCounterScore = score;
            counterTarget = mate;
            counterLocalIdx = j;
          }
        }
        if (counterTarget) {
          const passDist = dist(curOwner.x, curOwner.y, counterTarget.x, counterTarget.y);
          executeKickToTarget(
            state,
            curOwner,
            counterTarget.x,
            counterTarget.y,
            clamp(24 + passDist * 0.35, 24, 38),
            passDist > 30 ? 4.4 : 2.1,
            curOwner.pas,
            true,
            counterTarget.id
          );
          if (curOwner.side === 'p1') state.p1ActiveIdx = counterLocalIdx;
          else state.p2ActiveIdx = counterLocalIdx;
        } else {
          const { target, localIdx } = findBestPassTarget(
            state,
            curOwner,
            atkDir,
            (Math.random() - 0.5) * 0.8
          );
          if (target) {
            executeKickToTarget(state, curOwner, target.x, target.y, 26, 2.0, curOwner.pas, true, target.id);
            if (curOwner.side === 'p1') state.p1ActiveIdx = localIdx;
            else state.p2ActiveIdx = localIdx;
          } else {
            executeKickToTarget(state, curOwner, clamp(curOwner.x + atkDir * 35, 15, 85), 50, 30, 5.2, curOwner.pas, false);
          }
        }
        gkReleased = true;
      }
    }

    if (!gkReleased) {
      // Dribble ball right at carrier's feet (360° orbit during Roulette, overhead flick arc during Rainbow Flick!)
      const isRoulette = curOwner.animState === 'roulette';
      const isRainbow = curOwner.animState === 'rainbow';
      const spinProgress = isRoulette ? clamp(1 - curOwner.animTimer / 0.46, 0, 1) : 0;
      const rainbowProg = isRainbow ? clamp(1 - curOwner.animTimer / 0.52, 0, 1) : 0;
      const carryAngle = isRoulette
        ? curOwner.facingAngle + spinProgress * Math.PI * 2
        : curOwner.facingAngle;
      const dribbleDist = isRainbow
        ? -0.75 + rainbowProg * 2.55
        : isRoulette
        ? 1.55
        : 1.38;
      const rawBallX = curOwner.x + Math.cos(carryAngle) * dribbleDist;
      const rawBallY = curOwner.y + Math.sin(carryAngle) * dribbleDist;
      state.ball.x = clamp(rawBallX, 1.4, 98.6);
      state.ball.y = clamp(rawBallY, 2.6, 97.4);
      state.ball.z = isRainbow ? Math.sin(rainbowProg * Math.PI) * 3.15 : 0;
      state.ball.vx = curOwner.vx;
      state.ball.vy = curOwner.vy;
      state.ball.vz = 0;

      // GK claims ball when rushing out OR when opponent dribbler gets too close inside the penalty box!
      const oppSide: ApexTeamSide = curOwner.side === 'p1' ? 'p2' : 'p1';
      const oppGk = state.players.find((pl) => pl.side === oppSide && pl.isGk);
      const oppRushTimer = oppSide === 'p1' ? state.p1GkRushTimer : state.p2GkRushTimer;
      const oppGoalX = getGoalXForSideDefending(oppSide, state.half);
      const inOppPenaltyBox =
        Math.abs(state.ball.x - oppGoalX) <= 16.5 &&
        state.ball.y >= 24.5 &&
        state.ball.y <= 75.5;
      const canGkClaim = oppRushTimer > 0 || inOppPenaltyBox;
      const gkClaimRadius = oppRushTimer > 0 ? 3.25 : 2.9;
      if (
        oppGk &&
        !oppGk.sentOff &&
        !curOwner.isGk &&
        canGkClaim &&
        oppGk.tackleCooldown <= 0 &&
        curOwner.invulnTimer <= 0 &&
        dist(oppGk.x, oppGk.y, state.ball.x, state.ball.y) < gkClaimRadius
      ) {
        state.ball.ownerId = oppGk.id;
        state.ball.lastTouchSide = oppGk.side;
        state.ball.lastTouchName = oppGk.shortName;
        state.ball.lastTouchPlayerId = oppGk.id;
        state.ball.pickupLockTimer = 0.25;
        curOwner.powerWindupTimer = 0;
        oppGk.animState = 'gk_dive';
        oppGk.animTimer = 0.42;
        oppGk.tackleCooldown = 0.7;
        state.gkHoldTimer = 2.6;
        if (oppGk.side === 'p1') state.p1GkRushTimer = 0;
        else state.p2GkRushTimer = 0;
        enforceGkSafetySpacing(state, oppGk, 14.0);
        state.sfxQueue.push('kick_pass');
        state.pitchCallout = {
          text: 'THỦ MÔN CẢN PHÁ!',
          tone: 'cyan',
          x: oppGk.x,
          y: oppGk.y,
          timer: 1.1,
        };
        return;
      }

      // Dribbling across any endline (biên ngang):
      // - Inside goal mouth (45.4..54.6) -> Goal for the attacking side facing that goal!
      // - Outside goal mouth:
      //   * If player dribbles across their OWN team's endline -> Corner kick for the opponent!
      //   * If attacker dribbles across the OPPONENT'S endline -> Goal kick for the defending side!
      const dribbledRightEndline = rawBallX >= 98.8 && curOwner.vx > 0.25;
      const dribbledLeftEndline = rawBallX <= 1.2 && curOwner.vx < -0.25;

      if ((dribbledRightEndline || dribbledLeftEndline) && !curOwner.sentOff) {
        const crossedLeft = dribbledLeftEndline;
        const defendingSide: ApexTeamSide =
          state.half === 1 ? (crossedLeft ? 'p1' : 'p2') : crossedLeft ? 'p2' : 'p1';
        const scoringSide: ApexTeamSide = defendingSide === 'p1' ? 'p2' : 'p1';

        if (rawBallY > 45.4 && rawBallY < 54.6) {
          if (scoringSide === 'p1') state.p1Score += 1;
          else state.p2Score += 1;
          state.ball.x = crossedLeft ? 0.4 : 99.6;
          state.ball.y = rawBallY;
          state.goalCelebration = {
            active: true,
            side: scoringSide,
            scorer: curOwner.side === scoringSide ? curOwner.name : 'Phản lưới',
            scorerId: curOwner.side === scoringSide ? curOwner.id : null,
            timer: 2.35,
          };
          state.banner = {
            id: `goal_${Date.now()}`,
            title: 'GOAL!! VÀOOOOO!!',
            subtitle: `${curOwner.shortName} đưa bóng qua vạch vôi! (${state.p1Score} - ${state.p2Score})`,
            tone: 'goal',
            timer: 2.35,
            side: scoringSide,
          };
          state.sfxQueue.push('goal');
          return;
        }

        if (curOwner.side === defendingSide) {
          const cornerY = rawBallY < 50 ? 6 : 94;
          const cornerX = crossedLeft ? 3.5 : 96.5;
          triggerSetPiece(
            state,
            'corner',
            scoringSide,
            cornerX,
            cornerY,
            'PHẠT GÓC!',
            `${curOwner.shortName} rê bóng ra biên ngang sân nhà`,
            'setpiece',
            rawBallY < 50 ? 'top' : 'bottom'
          );
        } else {
          const gkX = crossedLeft ? 6.5 : 93.5;
          triggerSetPiece(
            state,
            'goal_kick',
            defendingSide,
            gkX,
            50,
            'PHÁT BÓNG LÊN',
            `${curOwner.shortName} đưa bóng hết biên ngang đối thủ`,
            'setpiece'
          );
        }
        return;
      }
    }
  } else {
    state.ball.ownerId = null;
    // Free flight ball physics (+ authentic FC Mobile Finesse Magnus bend & spin!)
    if (state.ball.kickKind === 'finesse' && (state.ball.kickTimer ?? 0) > 0.08) {
      const curveSign = state.ball.finesseCurveSign ?? (state.ball.y < 50 ? 1 : -1);
      const curveAccel = state.ball.finesseCurveSign ? 14.2 : 6.8;
      state.ball.vy += curveSign * curveAccel * dt;
    }
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;
    state.ball.z += state.ball.vz * dt;
    if (state.ball.z > 0 || state.ball.vz !== 0) {
      state.ball.vz -= 15 * dt;
    }
    if (state.ball.z <= 0) {
      state.ball.z = 0;
      if (state.ball.vz < -2.2) {
        state.ball.vz = -state.ball.vz * 0.45;
      } else {
        state.ball.vz = 0;
      }
    }
    const friction = state.ball.z > 0.2 ? 0.992 : 0.968;
    state.ball.vx *= Math.pow(friction, dt * 30);
    state.ball.vy *= Math.pow(friction, dt * 30);

    // Responsive Loose Ball Pickup / Steal & Reduced Bot GK Catch Magnetism
    if (state.ball.z < 3.5) {
      const ballSpd = Math.hypot(state.ball.vx, state.ball.vy);
      let bestPickIdx = -1;
      let bestScore = Infinity;

      for (let i = 0; i < state.players.length; i++) {
        const p = state.players[i];
        if (p.sentOff || p.animState === 'fallen') continue;
        // Brief lock only on kicker so pass/clearance doesn't re-stick immediately; everyone else steals eagerly!
        if (state.ball.pickupLockTimer > 0 && p.id === state.lastPasserId) continue;

        // Lofted long passes soar overhead above intermediate midfielders/defenders!
        if (state.ball.z > 1.95 && !p.isGk) {
          const isTargetReceiver = p.id === state.ball.kickTargetId;
          if (!isTargetReceiver || state.ball.z > 2.6) continue;
        }

        const isP1 = p.side === 'p1';
        const isBotGk = !isP1 && state.isBotOpp && p.isGk;
        const localIdx = isP1 ? i : i - 11;
        const isActiveCtrl = localIdx === (isP1 ? state.p1ActiveIdx : state.p2ActiveIdx);

        // Weak pass / weak shot is much easier for opponents to step in and intercept!
        const isWeakBall =
          (state.ball.kickStrength ?? 1) < 0.26 ||
          ((state.ball.kickKind === 'pass' || state.ball.kickKind === 'through') && ballSpd < 20.5);
        const oppWeakInterceptBonus =
          isWeakBall && !p.isGk && p.side !== state.ball.lastTouchSide ? 1.15 : 0;

        const isGkRush = p.isGk && (isP1 ? state.p1GkRushTimer : state.p2GkRushTimer) > 0;
        const reach = p.isGk
          ? isGkRush
            ? 3.85
            : isBotGk
            ? 2.2
            : 3.25
          : (isActiveCtrl ? 3.35 : 2.95) + oppWeakInterceptBonus;
        const d = dist(p.x, p.y, state.ball.x, state.ball.y);
        if (d >= reach) continue;

        if (isBotGk && ballSpd > 25 && p.tackleCooldown <= 0) {
          const catchProb = clamp(0.28 + state.botTierIndex * 0.08, 0.28, 0.68);
          if (Math.random() > catchProb) {
            p.tackleCooldown = 0.45;
            // Occasional fingertip parry out toward the byline -> triggers corner kick naturally!
            if (Math.random() < 0.28) {
              state.ball.vx = -state.ball.vx * 0.35;
              state.ball.vy += (Math.random() >= 0.5 ? 1 : -1) * (10 + Math.random() * 8);
              state.ball.vz = 1.8;
              state.ball.lastTouchSide = p.side;
              state.ball.lastTouchName = p.shortName;
              state.ball.lastTouchPlayerId = p.id;
              p.animState = 'gk_dive';
              p.animTimer = 0.42;
              state.sfxQueue.push('kick_pass');
            }
            continue;
          }
          // Fast/power shots rebound or parry out on occasion like FC Mobile!
          if ((state.ball.kickKind === 'powershot' || ballSpd > 30) && Math.random() < 0.42) {
            state.ball.vx = -state.ball.vx * 0.42;
            state.ball.vy += (Math.random() - 0.5) * 14;
            state.ball.vz = 2.4;
            state.ball.lastTouchSide = p.side;
            state.ball.lastTouchName = p.shortName;
            state.ball.lastTouchPlayerId = p.id;
            p.tackleCooldown = 0.55;
            p.animState = 'gk_dive';
            p.animTimer = 0.45;
            state.sfxQueue.push('kick_pass');
            continue;
          }
        } else if (isBotGk && ballSpd > 25 && p.tackleCooldown > 0) {
          continue;
        }

        const score =
          d -
          (isActiveCtrl ? 0.75 : 0) -
          oppWeakInterceptBonus * 1.1 -
          (p.pac - 75) * 0.015 -
          (p.phy - 75) * 0.015;
        if (score < bestScore) {
          bestScore = score;
          bestPickIdx = i;
        }
      }

      if (bestPickIdx >= 0) {
        const p = state.players[bestPickIdx];
        // Check Offside!
        if (state.ball.offsideCandidateId === p.id && state.ball.lastPassFromSide === p.side) {
          const defendingSide: ApexTeamSide = p.side === 'p1' ? 'p2' : 'p1';
          triggerSetPiece(
            state,
            'offside',
            defendingSide,
            p.x,
            p.y,
            'VIỆT VỊ!!',
            `${p.shortName} đứng dưới hàng phòng ngự cuối cùng`,
            'offside'
          );
          return;
        }

        state.ball.ownerId = p.id;
        state.ball.lastTouchSide = p.side;
        state.ball.lastTouchName = p.shortName;
        state.ball.lastTouchPlayerId = p.id;
        state.ball.offsideCandidateId = null;
        state.ball.kickTimer = 0;
        state.ball.kickTargetId = null;
        state.ball.vz = 0;
        if (p.isGk) {
          enforceGkSafetySpacing(state, p, 14.5);
          state.gkHoldTimer = 2.6;
        }
        if (p.side === 'p1') state.p1GkRushTimer = 0;
        else state.p2GkRushTimer = 0;
        if (p.side === 'p1') {
          state.p1ActiveIdx = bestPickIdx;
          autoSwitchOnPossessionLoss(state, 'p2');
        } else {
          state.p2ActiveIdx = bestPickIdx - 11;
          autoSwitchOnPossessionLoss(state, 'p1');
        }
      }
    }

    // Check Goalpost / Goal / Endline / Touchline
    // Touchlines: y < 2.4 or y > 97.6
    if (state.ball.y < 2.4 || state.ball.y > 97.6) {
      const throwSide: ApexTeamSide = state.ball.lastTouchSide === 'p1' ? 'p2' : 'p1';
      triggerSetPiece(
        state,
        'throw_in',
        throwSide,
        clamp(state.ball.x, 5, 95),
        state.ball.y < 50 ? 3.2 : 96.8,
        'NÉM BIÊN!',
        `Quyền ném biên thuộc về ${throwSide === 'p1' ? 'đội bạn' : 'đối thủ'}`,
        'setpiece'
      );
      return;
    }

    // Goalpost metallic clank & directional outward ricochet (smaller posts at x=1.5 / 98.5, y=45.4 & 54.6)
    const nearLeftPostX = state.ball.x <= 2.35 && state.ball.x >= -0.5;
    const nearRightPostX = state.ball.x >= 97.65 && state.ball.x <= 100.5;
    const hitTopPostY = state.ball.y >= 44.3 && state.ball.y <= 46.15;
    const hitBotPostY = state.ball.y >= 53.85 && state.ball.y <= 55.7;

    if ((nearLeftPostX || nearRightPostX) && (hitTopPostY || hitBotPostY) && state.ball.z < 2.75) {
      const inVx = state.ball.vx;
      const inVy = state.ball.vy;
      const inSpd = Math.max(18, Math.hypot(inVx, inVy));
      const postY = hitTopPostY ? 45.4 : 54.6;
      const outYSign = hitTopPostY ? -1 : 1; // Deflect strictly away from goal mouth!
      const goingTowardPostGoal = nearLeftPostX ? inVx < -0.5 : inVx > 0.5;

      if (goingTowardPostGoal) {
        const sameSideCross = inVy * outYSign;
        if (sameSideCross > 2.5) {
          // Outward-angled shot -> clips post and glances wide out past the endline!
          state.ball.vx = inVx * 0.44;
          state.ball.vy = outYSign * clamp(inSpd * 0.64 + Math.abs(inVy) * 0.32, 15, 36);
          state.ball.x = nearLeftPostX ? 1.85 : 98.15;
          state.ball.y = postY + outYSign * 1.25;
        } else if (sameSideCross < -2.5) {
          // Cross-goal shot into far post -> cannons diagonally out toward the wing/corner!
          state.ball.vx = -inVx * 0.42;
          state.ball.vy = outYSign * clamp(inSpd * 0.68, 16, 38);
          state.ball.x = nearLeftPostX ? 2.45 : 97.55;
          state.ball.y = postY + outYSign * 1.15;
        } else {
          // Straight blast into front of post -> rebounds sharply outward away from goal!
          state.ball.vx = -inVx * 0.54;
          state.ball.vy = outYSign * clamp(inSpd * 0.52, 14, 30) + inVy * 0.25;
          state.ball.x = nearLeftPostX ? 2.55 : 97.45;
          state.ball.y = postY + outYSign * 1.05;
        }
        state.ball.vz = Math.max(1.8, Math.abs(state.ball.vz) * 0.42 + 1.9);
        state.ball.kickKind = undefined;
        state.ball.kickTimer = 0;
        state.sfxQueue.push('post_hit');
        state.pitchCallout = {
          text: 'DỘI CỘT DỌC!',
          tone: 'gold',
          x: nearLeftPostX ? 2.5 : 97.5,
          y: postY,
          timer: 1.15,
        };
      }
    }

    // Left / Right Endlines (x < 1.2 or x > 98.8)
    if (state.ball.x < 1.2 || state.ball.x > 98.8) {
      const isGoalMouth = state.ball.y > 45.4 && state.ball.y < 54.6 && state.ball.z < 2.55;
      const crossedLeft = state.ball.x < 50;
      const defendingSide: ApexTeamSide =
        state.half === 1 ? (crossedLeft ? 'p1' : 'p2') : crossedLeft ? 'p2' : 'p1';
      const scoringSide: ApexTeamSide = defendingSide === 'p1' ? 'p2' : 'p1';

      if (isGoalMouth) {
        const scorer = state.ball.lastTouchName || (scoringSide === 'p1' ? 'Tiền Đạo' : 'Đối Thủ');
        const scorerEntity = state.ball.lastTouchPlayerId
          ? state.players.find((pl) => pl.id === state.ball.lastTouchPlayerId)
          : state.players.find((pl) => pl.side === scoringSide && pl.shortName === scorer);
        const scorerCardKey = scorerEntity?.cardId || scorerEntity?.id || '';
        if (scoringSide === 'p1') {
          state.p1Score += 1;
          if (scorerCardKey) state.p1GoalScorerCardIds.push(scorerCardKey);
        } else {
          state.p2Score += 1;
          if (scorerCardKey) state.p2GoalScorerCardIds.push(scorerCardKey);
        }
        state.goalCelebration = {
          active: true,
          side: scoringSide,
          scorer: scorerEntity?.name || scorer,
          scorerId: scorerEntity?.id ?? null,
          timer: 2.35,
        };
        state.banner = {
          id: `goal_${Date.now()}`,
          title: 'GOAL!! VÀOOOOO!!',
          subtitle: `${scorer} ghi bàn tuyệt đẹp! (${state.p1Score} - ${state.p2Score})`,
          tone: 'goal',
          timer: 2.35,
          side: scoringSide,
        };
        state.sfxQueue.push('goal');
        return;
      }

      // Corner kick vs Goal kick:
      // - Corner kick is awarded ONLY when the defending side last touched/dribbled/threw/kicked the ball over their own endline!
      // - If the attacking side knocks/kicks/throws it over the opponent's endline -> Goal kick for the defending side.
      const isDefenderLastTouch = state.ball.lastTouchSide === defendingSide;

      if (isDefenderLastTouch) {
        const cornerY = state.ball.y < 50 ? 6 : 94;
        const cornerX = crossedLeft ? 3.5 : 96.5;
        triggerSetPiece(
          state,
          'corner',
          scoringSide,
          cornerX,
          cornerY,
          'PHẠT GÓC!',
          `Phạt góc cho ${scoringSide === 'p1' ? 'đội bạn' : 'đối thủ'}`,
          'setpiece',
          state.ball.y < 50 ? 'top' : 'bottom'
        );
      } else {
        const gkX = crossedLeft ? 6.5 : 93.5;
        triggerSetPiece(
          state,
          'goal_kick',
          defendingSide,
          gkX,
          50,
          'PHÁT BÓNG LÊN',
          'Thủ môn phát bóng từ vạch 5m50',
          'setpiece'
        );
      }
      return;
    }
  }

  // Referee patrols near ball without getting in the way
  const refTargetX = clamp(state.ball.x - 4, 10, 90);
  const refTargetY = clamp(state.ball.y - 10, 10, 90);
  const rdx = refTargetX - state.referee.x;
  const rdy = refTargetY - state.referee.y;
  const rd = Math.hypot(rdx, rdy);
  if (rd > 2) {
    state.referee.x += (rdx / rd) * 11 * dt;
    state.referee.y += (rdy / rd) * 11 * dt;
    state.referee.facingAngle = Math.atan2(rdy, rdx);
    state.referee.animFrame += dt * 7;
  }

  // Wide dynamic camera with directional velocity lookahead & aerial ball tracking
  const p1Act = getActivePlayerForSide(state, 'p1');
  const camLeadX = p1Act ? clamp(p1Act.vx * 0.65, -9, 9) : 0;
  const camLeadY = p1Act ? clamp(p1Act.vy * 0.52, -7, 7) : 0;
  const camTargetX = p1Act
    ? state.ball.ownerId
      ? clamp(p1Act.x * 0.62 + state.ball.x * 0.38 + camLeadX, 14, 86)
      : clamp(p1Act.x * 0.44 + state.ball.x * 0.56 + camLeadX * 0.5, 14, 86)
    : state.ball.x;
  const camTargetY = p1Act
    ? state.ball.ownerId
      ? clamp(p1Act.y * 0.62 + state.ball.y * 0.38 + camLeadY, 16, 84)
      : clamp(p1Act.y * 0.44 + state.ball.y * 0.56 + camLeadY * 0.5, 16, 84)
    : state.ball.y;
  state.camera.x += (camTargetX - state.camera.x) * Math.min(1, dt * 6.5);
  state.camera.y += (camTargetY - state.camera.y) * Math.min(1, dt * 6.5);
}

/**
 * Projects full authoritative ApexMatchState from server P1 space into client screen space.
 * For P2, flips (100 - x, 100 - y) & angles by PI so BOTH P1 and P2 attack in familiar orientation!
 */
export function projectApexStateForSide(
  state: ApexMatchState,
  side: ApexTeamSide
): ApexMatchState {
  if (side === 'p1') return state;
  const flipX = (x: number) => 100 - x;
  const flipY = (y: number) => 100 - y;
  const flipAng = (a: number) => a + Math.PI;
  const flipSide = (s: ApexTeamSide): ApexTeamSide => (s === 'p1' ? 'p2' : 'p1');

  return {
    ...state,
    p1Score: state.p2Score,
    p2Score: state.p1Score,
    p1GoalScorerCardIds: state.p2GoalScorerCardIds,
    p2GoalScorerCardIds: state.p1GoalScorerCardIds,
    p1Shots: state.p2Shots,
    p2Shots: state.p1Shots,
    p1SlideAttempts: state.p2SlideAttempts,
    p1SlideSuccess: state.p2SlideSuccess,
    p2SlideAttempts: state.p1SlideAttempts,
    p2SlideSuccess: state.p1SlideSuccess,
    p1SkillAttempts: state.p2SkillAttempts,
    p1SkillSuccess: state.p2SkillSuccess,
    p2SkillAttempts: state.p1SkillAttempts,
    p2SkillSuccess: state.p1SkillSuccess,
    p1PossTicks: state.totalPlayTicks - state.p1PossTicks,
    p1ActiveIdx: state.p2ActiveIdx,
    p2ActiveIdx: state.p1ActiveIdx,
    camera: { x: flipX(state.camera.x), y: flipY(state.camera.y) },
    ball: {
      ...state.ball,
      x: flipX(state.ball.x),
      y: flipY(state.ball.y),
      vx: -state.ball.vx,
      vy: -state.ball.vy,
      lastTouchSide: flipSide(state.ball.lastTouchSide),
      lastPassFromSide: state.ball.lastPassFromSide ? flipSide(state.ball.lastPassFromSide) : null,
      kickFromX: state.ball.kickFromX !== undefined ? flipX(state.ball.kickFromX) : undefined,
      kickFromY: state.ball.kickFromY !== undefined ? flipY(state.ball.kickFromY) : undefined,
    },
    referee: {
      ...state.referee,
      x: flipX(state.referee.x),
      y: flipY(state.referee.y),
      facingAngle: flipAng(state.referee.facingAngle),
    },
    setPiece: {
      ...state.setPiece,
      side: flipSide(state.setPiece.side),
      x: flipX(state.setPiece.x),
      y: flipY(state.setPiece.y),
      aimX: state.setPiece.aimX !== undefined ? flipX(state.setPiece.aimX) : undefined,
      aimY: state.setPiece.aimY !== undefined ? flipY(state.setPiece.aimY) : undefined,
    },
    goalCelebration: state.goalCelebration
      ? { ...state.goalCelebration, side: flipSide(state.goalCelebration.side) }
      : null,
    banner: state.banner
      ? {
          ...state.banner,
          side: state.banner.side ? flipSide(state.banner.side) : undefined,
        }
      : null,
    pitchCallout: state.pitchCallout
      ? {
          ...state.pitchCallout,
          x: flipX(state.pitchCallout.x),
          y: flipY(state.pitchCallout.y),
        }
      : null,
    // Reorder players so indices 0..10 = viewing user ('p1'), 11..21 = viewing opponent ('p2')
    players: [
      ...state.players.slice(11, 22).map((p) => ({
        ...p,
        side: 'p1' as ApexTeamSide,
        x: flipX(p.x),
        y: flipY(p.y),
        vx: -p.vx,
        vy: -p.vy,
        facingAngle: flipAng(p.facingAngle),
      })),
      ...state.players.slice(0, 11).map((p) => ({
        ...p,
        side: 'p2' as ApexTeamSide,
        x: flipX(p.x),
        y: flipY(p.y),
        vx: -p.vx,
        vy: -p.vy,
        facingAngle: flipAng(p.facingAngle),
      })),
    ],
  };
}
