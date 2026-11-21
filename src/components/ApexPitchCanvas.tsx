import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Footprints,
  Monitor,
  Repeat,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import {
  ApexButtonAction,
  ApexControlInput,
  ApexMatchState,
  ApexPlayerInit,
  ApexSetPieceType,
  ApexSfxTrigger,
  createInitialApexMatchState,
  getAttackDir,
  isPointInOwnHalf,
  screenInputToWorldDir,
  stepApexMatch,
} from '../engine/apexMatchEngine';
import { renderFullApexFrame } from '../engine/retroSprites';
import { soundService } from '../services/sound';

interface ApexPitchCanvasProps {
  mode: 'bot' | 'pvp';
  controlMode?: 'pc' | 'mobile';
  onChangeControlMode?: (mode: 'pc' | 'mobile') => void;
  userTeamName: string;
  userTeamLogo?: string;
  oppTeamName: string;
  oppTeamLogo?: string;
  userOvr: number;
  oppOvr: number;
  p1Starters: ApexPlayerInit[];
  p2Starters: ApexPlayerInit[];
  botTierIndex: number;
  pvpServerState: ApexMatchState | null;
  onSendPvpInput?: (input: ApexControlInput) => void;
  onBotMatchComplete: (userGoals: number, oppGoals: number, scorerCardIds?: string[]) => void;
  onPauseRequestExit?: () => void;
}

const formatMatchTimer = (secondsLeft: number): string => {
  const s = Math.max(0, Math.ceil(secondsLeft));
  const mins = Math.floor(s / 60);
  const rem = String(s % 60).padStart(2, '0');
  return `${mins}:${rem}`;
};

export const ApexPitchCanvas: React.FC<ApexPitchCanvasProps> = ({
  mode,
  controlMode: controlModeProp,
  onChangeControlMode,
  userTeamName,
  userTeamLogo,
  oppTeamName,
  oppTeamLogo,
  userOvr,
  oppOvr,
  p1Starters,
  p2Starters,
  botTierIndex,
  pvpServerState,
  onSendPvpInput,
  onBotMatchComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [localControlMode, setLocalControlMode] = useState<'pc' | 'mobile'>(() => {
    if (controlModeProp) return controlModeProp;
    try {
      const saved = localStorage.getItem('fc_control_mode');
      if (saved === 'mobile' || saved === 'pc') return saved;
    } catch {
      // ignore storage failure
    }
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'mobile';
    }
    return 'pc';
  });

  const isMobileControlsRef = useRef(localControlMode === 'mobile');
  useEffect(() => {
    isMobileControlsRef.current = localControlMode === 'mobile';
  }, [localControlMode]);

  useEffect(() => {
    if (controlModeProp) {
      setLocalControlMode(controlModeProp);
    }
  }, [controlModeProp]);

  const handleToggleControlMode = () => {
    const next: 'pc' | 'mobile' = localControlMode === 'mobile' ? 'pc' : 'mobile';
    setLocalControlMode(next);
    try {
      localStorage.setItem('fc_control_mode', next);
    } catch {
      // ignore storage failure
    }
    onChangeControlMode?.(next);
  };

  // Local simulation state for Bot mode
  const botStateRef = useRef<ApexMatchState | null>(null);
  if (mode === 'bot' && !botStateRef.current) {
    botStateRef.current = createInitialApexMatchState({
      p1Starters,
      p2Starters,
      isBotOpp: true,
      botTierIndex,
    });
  }

  // Latest PvP state received from authoritative server
  const pvpStateRef = useRef<ApexMatchState | null>(pvpServerState);
  useEffect(() => {
    if (mode === 'pvp' && pvpServerState) {
      pvpStateRef.current = pvpServerState;
    }
  }, [mode, pvpServerState]);

  // Smooth Client Camera centered on active selected player
  const smoothCamRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });

  // Input Tracking (WASD + IJKL + Touch Joystick & 4 FC Mobile circular buttons)
  const keysDownRef = useRef<Set<string>>(new Set());
  const touchJoyRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const touchShootHoldRef = useRef(false);
  const touchHoldActionRef = useRef<'I' | 'J' | 'L' | null>(null);
  const keyHoldActionRef = useRef<'I' | 'J' | 'L' | null>(null);
  const pendingActionRef = useRef<ApexButtonAction | null>(null);
  const btnSwipeRef = useRef<{
    btn: 'I' | 'J' | 'K' | 'L';
    startX: number;
    startY: number;
    canHoldCharge: boolean;
    holdTimer: number | null;
    holdStarted: boolean;
    triggered: boolean;
  } | null>(null);
  const [activeSwipeHint, setActiveSwipeHint] = useState<{
    btn: 'I' | 'J' | 'K' | 'L';
    text: string;
    tone: string;
  } | null>(null);

  // Virtual Joystick visual knob state
  const [joyActive, setJoyActive] = useState(false);
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyBaseRef = useRef<{ cx: number; cy: number; maxR: number } | null>(null);

  // HUD mirror state (~15fps UI sync for broadcast scoreboard, active player strip, charge ring, banners)
  const [hudSnap, setHudSnap] = useState<{
    p1Score: number;
    p2Score: number;
    p1SlideAttempts: number;
    p1SlideSuccess: number;
    p2SlideAttempts: number;
    p2SlideSuccess: number;
    p1SkillAttempts: number;
    p1SkillSuccess: number;
    p2SkillAttempts: number;
    p2SkillSuccess: number;
    p1Shots: number;
    p2Shots: number;
    possessionPct: number;
    playSecondsLeft: number;
    half: 1 | 2;
    phase: ApexMatchState['phase'];
    userHasBall: boolean;
    ballInAir: boolean;
    inOwnHalf: boolean;
    setPieceType: ApexSetPieceType;
    setPieceSide: 'p1' | 'p2';
    setPieceTimer: number;
    setPieceCorner: 'top' | 'bottom' | null;
    banner: ApexMatchState['banner'];
    goalActive: boolean;
    goalScorer: string;
    goalScorerAvatar?: string;
    goalScorerOvr?: number;
    goalScorerPos?: string;
    goalScorerCardType?: string;
    goalScorerClub?: string;
    goalScorerClubLogo?: string;
    goalSide: 'p1' | 'p2';
    attackingRight: boolean;
    activeName: string;
    activePos: string;
    activeOvr: number;
    activeAvatarUrl?: string;
    activeCardType?: string;
    activeClubLogo?: string;
    activeSkillMoves?: number;
    activeStamina: number;
    activeSkillCooldown: number;
    activeChargePower: number;
    activeChargeKind?: 'pass' | 'through' | 'shoot';
    activeYellowCards: number;
    supportActive: boolean;
  }>({
    p1Score: 0,
    p2Score: 0,
    p1SlideAttempts: 0,
    p1SlideSuccess: 0,
    p2SlideAttempts: 0,
    p2SlideSuccess: 0,
    p1SkillAttempts: 0,
    p1SkillSuccess: 0,
    p2SkillAttempts: 0,
    p2SkillSuccess: 0,
    p1Shots: 0,
    p2Shots: 0,
    possessionPct: 50,
    playSecondsLeft: 90,
    half: 1,
    phase: 'intro',
    userHasBall: true,
    ballInAir: false,
    inOwnHalf: true,
    setPieceType: 'none',
    setPieceSide: 'p1',
    setPieceTimer: 0,
    setPieceCorner: null,
    banner: null,
    goalActive: false,
    goalScorer: '',
    goalScorerAvatar: undefined,
    goalScorerOvr: undefined,
    goalScorerPos: undefined,
    goalScorerCardType: undefined,
    goalScorerClub: undefined,
    goalScorerClubLogo: undefined,
    goalSide: 'p1',
    attackingRight: true,
    activeName: p1Starters[1]?.shortName || 'ST',
    activePos: p1Starters[1]?.pos || 'ST',
    activeOvr: p1Starters[1]?.ovr || userOvr,
    activeAvatarUrl: p1Starters[1]?.avatarUrl,
    activeCardType: p1Starters[1]?.cardType,
    activeClubLogo: p1Starters[1]?.clubLogo,
    activeSkillMoves: p1Starters[1]?.skillMoves,
    activeStamina: 100,
    activeSkillCooldown: 0,
    activeChargePower: 0,
    activeChargeKind: undefined,
    activeYellowCards: 0,
    supportActive: false,
  });

  const botDoneRef = useRef(false);
  const lastBannerIdRef = useRef<string>('');
  const lastSfxCountRef = useRef(0);

  const triggerSfxList = (list: ApexSfxTrigger[]) => {
    for (const s of list) {
      if (s === 'whistle_short') soundService.playWhistleShort();
      else if (s === 'whistle_long') soundService.playWhistleLong(false);
      else if (s === 'whistle_triple') soundService.playWhistleLong(true);
      else if (s === 'kick_pass') soundService.playKickBall(0.48);
      else if (s === 'kick_shot') soundService.playKickBall(0.95);
      else if (s === 'post_hit') soundService.playPostHit();
      else if (s === 'goal') {
        soundService.playGoalCheer();
        soundService.playTrophy();
      } else if (s === 'card') {
        soundService.playWhistleLong(false);
      }
    }
  };

  // Keyboard Listeners (WASD + I J K L)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        ['w', 'a', 's', 'd', 'i', 'j', 'k', 'l', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
          k
        )
      ) {
        e.preventDefault();
      }
      if (!keysDownRef.current.has(k)) {
        const cur = mode === 'bot' ? botStateRef.current : pvpStateRef.current;
        const isSetPiece = cur && cur.setPiece.type !== 'none';
        const owner = cur?.players.find((p) => p.id === cur.ball.ownerId);
        const userHas = !isSetPiece && owner?.side === 'p1';

        if (k === 'i') {
          if (userHas) keyHoldActionRef.current = 'I';
          else pendingActionRef.current = 'I';
        } else if (k === 'j') {
          if (userHas) keyHoldActionRef.current = 'J';
          else pendingActionRef.current = 'J';
        } else if (k === 'k') {
          pendingActionRef.current = 'K';
        } else if (k === 'e') {
          pendingActionRef.current = 'RAINBOW';
        } else if (k === 'q') {
          pendingActionRef.current = 'SKILL_KNOCKON';
        } else if (k === 'c') {
          pendingActionRef.current = 'SKILL_STOP';
        } else if (k === 'u') {
          pendingActionRef.current = 'PASS_LOFT';
        } else if (k === 'o') {
          pendingActionRef.current = 'PASS_LONG_LOFT';
        } else if (k === 'y') {
          pendingActionRef.current = 'GK_RUSH';
        } else if (k === 'r') {
          pendingActionRef.current = 'SHOT_CHIP';
        } else if (k === 'f') {
          pendingActionRef.current = 'SHOT_CURVE';
        } else if (k === 'v') {
          pendingActionRef.current = 'SHOT_POWER_LONG';
        } else if (k === 'l') {
          const canChargeShot =
            userHas && owner && !isPointInOwnHalf(owner.x, 'p1', cur?.half || 1);
          if (canChargeShot) {
            keyHoldActionRef.current = 'L';
          } else {
            pendingActionRef.current = 'L';
          }
        }
      }
      keysDownRef.current.add(k);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysDownRef.current.delete(k);
      if (k === 'i' && keyHoldActionRef.current === 'I') keyHoldActionRef.current = null;
      if (k === 'j' && keyHoldActionRef.current === 'J') keyHoldActionRef.current = null;
      if (k === 'l' && keyHoldActionRef.current === 'L') keyHoldActionRef.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mode]);

  // Main 60 FPS Render & Physics / PvP Input Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAcc = 0;
    let pvpSendAcc = 0;

    const getMergedInput = (consumeAction: boolean): ApexControlInput => {
      const keys = keysDownRef.current;
      let mx = touchJoyRef.current.dx;
      let my = touchJoyRef.current.dy;
      if (keys.has('w') || keys.has('arrowup')) my -= 1;
      if (keys.has('s') || keys.has('arrowdown')) my += 1;
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
      const mag = Math.hypot(mx, my);
      if (mag > 1) {
        mx /= mag;
        my /= mag;
      }

      const act = pendingActionRef.current;
      if (consumeAction) pendingActionRef.current = null;
      const holdAct = touchHoldActionRef.current ?? keyHoldActionRef.current;

      return {
        moveX: mx,
        moveY: my,
        shootHold: keys.has('l') || touchShootHoldRef.current || holdAct === 'L',
        holdAction: holdAct,
        action: act,
      };
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      let activeState: ApexMatchState | null = null;
      const liveInputSnapshot = getMergedInput(false);

      if (mode === 'bot' && botStateRef.current) {
        const st = botStateRef.current;
        const inp = getMergedInput(true);
        stepApexMatch(st, dt, inp);
        if (st.sfxQueue.length > 0) {
          triggerSfxList(st.sfxQueue.splice(0, st.sfxQueue.length));
        }
        if (st.phase === 'outro' && st.phaseTimer <= 0.05 && !botDoneRef.current) {
          botDoneRef.current = true;
          onBotMatchComplete(st.p1Score, st.p2Score, st.p1GoalScorerCardIds);
        }
        activeState = st;
      } else if (mode === 'pvp') {
        activeState = pvpStateRef.current;
        pvpSendAcc += dt;
        if (onSendPvpInput && (pvpSendAcc >= 0.033 || pendingActionRef.current !== null)) {
          pvpSendAcc = 0;
          onSendPvpInput(getMergedInput(true));
        }
        if (activeState && activeState.sfxQueue.length > 0) {
          if (activeState.sfxQueue.length !== lastSfxCountRef.current) {
            triggerSfxList(activeState.sfxQueue);
            lastSfxCountRef.current = activeState.sfxQueue.length;
          }
        } else {
          lastSfxCountRef.current = 0;
        }
      }

      // Render Canvas with crisp high-DPI backing pixel resolution
      const canvas = canvasRef.current;
      const wrap = wrapperRef.current;
      if (canvas && wrap && activeState) {
        const rect = wrap.getBoundingClientRect();
        const cw = Math.max(190, Math.floor(rect.width));
        const ch = Math.max(110, Math.floor(rect.height));
        const dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
        const targetW = Math.floor(cw * dpr);
        const targetH = Math.floor(ch * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        // Camera centers smoothly on active selected P1 player (or corner box during corner kick)
        const activeP1 = activeState.players[activeState.p1ActiveIdx];
        let targetCamX = activeState.camera.x;
        let targetCamY = activeState.camera.y;

        if (activeState.goalCelebration?.active) {
          const cel = activeState.goalCelebration;
          const scorerEnt = cel.scorerId
            ? activeState.players.find((pl) => pl.id === cel.scorerId)
            : activeState.players.find(
                (pl) => pl.side === cel.side && (pl.name === cel.scorer || pl.shortName === cel.scorer)
              );
          if (scorerEnt) {
            targetCamX = scorerEnt.x;
            targetCamY = scorerEnt.y;
          } else {
            targetCamX = activeState.ball.x;
            targetCamY = activeState.ball.y;
          }
        } else if (activeState.setPiece.type === 'corner') {
          const crossedLeft = activeState.setPiece.x < 50;
          const aimX = activeState.setPiece.aimX ?? (crossedLeft ? 12 : 88);
          const aimY = activeState.setPiece.aimY ?? 50;
          targetCamX = (crossedLeft ? 10 : 90) * 0.55 + aimX * 0.45;
          targetCamY = 48 * 0.65 + aimY * 0.35;
        } else if (activeState.setPiece.type !== 'none') {
          targetCamX = activeState.setPiece.x;
          targetCamY = activeState.setPiece.y;
        } else if (activeP1 && !activeP1.sentOff && activeState.phase !== 'intro') {
          const leadX = Math.max(-9, Math.min(9, activeP1.vx * 0.65));
          const leadY = Math.max(-7, Math.min(7, activeP1.vy * 0.52));
          if (activeState.ball.ownerId) {
            targetCamX = Math.max(14, Math.min(86, activeP1.x * 0.62 + activeState.ball.x * 0.38 + leadX));
            targetCamY = Math.max(16, Math.min(84, activeP1.y * 0.62 + activeState.ball.y * 0.38 + leadY));
          } else {
            targetCamX = Math.max(14, Math.min(86, activeP1.x * 0.44 + activeState.ball.x * 0.56 + leadX * 0.5));
            targetCamY = Math.max(16, Math.min(84, activeP1.y * 0.44 + activeState.ball.y * 0.56 + leadY * 0.5));
          }
        }

        const camLerp = Math.min(1, dt * 8.2);
        smoothCamRef.current.x += (targetCamX - smoothCamRef.current.x) * camLerp;
        smoothCamRef.current.y += (targetCamY - smoothCamRef.current.y) * camLerp;

        const aimWorld = screenInputToWorldDir(liveInputSnapshot.moveX, liveInputSnapshot.moveY);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.imageSmoothingEnabled = false;
          renderFullApexFrame(
            ctx,
            activeState,
            cw,
            ch,
            now / 1000,
            smoothCamRef.current,
            aimWorld,
            isMobileControlsRef.current
          );
        }

        hudSyncAcc += dt;
        if (hudSyncAcc >= 0.06) {
          hudSyncAcc = 0;
          const owner = activeState.players.find((p) => p.id === activeState.ball.ownerId);
          const userHasBall = owner?.side === 'p1';
          const refEntity = owner || activeState.players[activeState.p1ActiveIdx];
          const inOwnHalf = refEntity
            ? isPointInOwnHalf(refEntity.x, 'p1', activeState.half)
            : true;

          if (activeState.banner && activeState.banner.id !== lastBannerIdRef.current) {
            lastBannerIdRef.current = activeState.banner.id;
          }

          const p1Act = activeState.players[activeState.p1ActiveIdx];
          const possPct =
            activeState.totalPlayTicks > 0
              ? Math.round((activeState.p1PossTicks / activeState.totalPlayTicks) * 100)
              : 50;

          const goalCel = activeState.goalCelebration;
          const scorerEntity = goalCel?.active
            ? (goalCel.scorerId
                ? activeState.players.find((pl) => pl.id === goalCel.scorerId)
                : activeState.players.find(
                    (pl) =>
                      pl.side === goalCel.side &&
                      (pl.name === goalCel.scorer || pl.shortName === goalCel.scorer)
                  ))
            : undefined;

          setHudSnap({
            p1Score: activeState.p1Score,
            p2Score: activeState.p2Score,
            p1SlideAttempts: activeState.p1SlideAttempts,
            p1SlideSuccess: activeState.p1SlideSuccess,
            p2SlideAttempts: activeState.p2SlideAttempts,
            p2SlideSuccess: activeState.p2SlideSuccess,
            p1SkillAttempts: activeState.p1SkillAttempts,
            p1SkillSuccess: activeState.p1SkillSuccess,
            p2SkillAttempts: activeState.p2SkillAttempts,
            p2SkillSuccess: activeState.p2SkillSuccess,
            p1Shots: activeState.p1Shots,
            p2Shots: activeState.p2Shots,
            possessionPct: possPct,
            playSecondsLeft: activeState.playSecondsLeft,
            half: activeState.half,
            phase: activeState.phase,
            userHasBall,
            ballInAir:
              !activeState.ball.ownerId &&
              activeState.ball.z > 0.62 &&
              activeState.ball.z <= 5.2,
            inOwnHalf,
            setPieceType: activeState.setPiece.type,
            setPieceSide: activeState.setPiece.side,
            setPieceTimer: activeState.setPiece.timer,
            setPieceCorner:
              activeState.setPiece.type === 'corner'
                ? activeState.setPiece.pipCornerSide || 'top'
                : null,
            banner: activeState.banner,
            goalActive: Boolean(goalCel?.active),
            goalScorer: scorerEntity?.name || goalCel?.scorer || '',
            goalScorerAvatar: scorerEntity?.avatarUrl,
            goalScorerOvr: scorerEntity?.ovr,
            goalScorerPos: scorerEntity?.pos,
            goalScorerCardType: scorerEntity?.cardType,
            goalScorerClub: scorerEntity?.club,
            goalScorerClubLogo: scorerEntity?.clubLogo,
            goalSide: goalCel?.side || 'p1',
            attackingRight: getAttackDir('p1', activeState.half) === 1,
            activeName: p1Act?.shortName || 'Cầu Thủ',
            activePos: p1Act?.pos || 'CM',
            activeOvr: p1Act?.ovr || userOvr,
            activeAvatarUrl: p1Act?.avatarUrl,
            activeCardType: p1Act?.cardType,
            activeClubLogo: p1Act?.clubLogo,
            activeSkillMoves: p1Act?.skillMoves,
            activeStamina: Math.round(p1Act?.stamina ?? 100),
            activeSkillCooldown: p1Act?.skillCooldown ?? 0,
            activeChargePower: p1Act?.chargePower ?? 0,
            activeChargeKind: p1Act?.chargeKind,
            activeYellowCards: p1Act?.yellowCards ?? 0,
            supportActive: activeState.p1SupportTimer > 0,
          });
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [mode, onBotMatchComplete, onSendPvpInput, userOvr]);

  // Context-Sensitive FC Mobile Action Labels (Corner / Throw-in / Free Kick / Possession / Defending & Aerial Header)
  const isUserCorner = hudSnap.setPieceType === 'corner' && hudSnap.setPieceSide === 'p1';
  const isUserThrow = hudSnap.setPieceType === 'throw_in' && hudSnap.setPieceSide === 'p1';
  const isUserFreeKick =
    (hudSnap.setPieceType === 'free_kick' || hudSnap.setPieceType === 'offside') &&
    hudSnap.setPieceSide === 'p1';

  const btnLabels = isUserCorner
    ? {
        I: { label: 'TẠT XOÁY', sub: 'I', isShootHold: false },
        J: { label: 'CHUYỀN NGẮN', sub: 'J', isShootHold: false },
        K: { label: 'CHỌN ĐIỂM', sub: localControlMode === 'mobile' ? 'Cần' : 'WASD', isShootHold: false },
        L: { label: 'TẠT MẠNH', sub: 'L', isShootHold: false },
      }
    : isUserThrow
    ? {
        I: { label: 'NÉM MẠNH', sub: 'I', isShootHold: false },
        J: { label: 'NÉM BIÊN', sub: 'J', isShootHold: false },
        K: { label: 'CHỜ...', sub: `${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s`, isShootHold: false },
        L: { label: 'NÉM XA', sub: 'L', isShootHold: false },
      }
    : isUserFreeKick
    ? {
        I: { label: 'CHỌC BỔNG', sub: 'I', isShootHold: false },
        J: { label: 'ĐÁ BỔNG', sub: 'J', isShootHold: false },
        K: { label: 'CHỈNH HƯỚNG', sub: localControlMode === 'mobile' ? 'Cần' : 'WASD', isShootHold: false },
        L: { label: 'SÚT BỔNG', sub: 'L', isShootHold: false },
      }
    : hudSnap.userHasBall
    ? {
        I: { label: 'CHỌC KHE', sub: 'I', isShootHold: true },
        J: { label: 'CHUYỀN', sub: 'J', isShootHold: true },
        K: { label: 'ROULETTE', sub: 'K', isShootHold: false },
        L: hudSnap.inOwnHalf
          ? { label: 'PHÁ BÓNG', sub: 'L', isShootHold: false }
          : { label: 'SÚT', sub: localControlMode === 'mobile' ? 'Giữ' : 'Giữ L', isShootHold: true },
      }
    : {
        I: { label: 'HỖ TRỢ', sub: 'I', isShootHold: false },
        J: { label: 'ĐỔI NGƯỜI', sub: 'J', isShootHold: false },
        K: { label: 'TẤC BÓNG', sub: 'K', isShootHold: false },
        L: hudSnap.ballInAir
          ? { label: 'ĐÁNH ĐẦU', sub: 'L', isShootHold: false }
          : { label: 'XOẠC BÓNG', sub: 'L', isShootHold: false },
      };

  const clearBtnSwipeTimer = () => {
    if (btnSwipeRef.current?.holdTimer !== null && btnSwipeRef.current?.holdTimer !== undefined) {
      window.clearTimeout(btnSwipeRef.current.holdTimer);
      btnSwipeRef.current.holdTimer = null;
    }
  };

  const handleBtnPointerDown = (
    btn: 'I' | 'J' | 'K' | 'L',
    canHoldCharge: boolean,
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    clearBtnSwipeTimer();
    setActiveSwipeHint(null);

    let holdTimer: number | null = null;
    if (canHoldCharge && (btn === 'I' || btn === 'J' || btn === 'L')) {
      holdTimer = window.setTimeout(() => {
        const cur = btnSwipeRef.current;
        if (cur && cur.btn === btn && !cur.triggered) {
          cur.holdStarted = true;
          touchHoldActionRef.current = btn;
          touchShootHoldRef.current = btn === 'L';
        }
      }, 95);
    }

    btnSwipeRef.current = {
      btn,
      startX: e.clientX,
      startY: e.clientY,
      canHoldCharge,
      holdTimer,
      holdStarted: false,
      triggered: false,
    };
  };

  const handleBtnPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const sw = btnSwipeRef.current;
    if (!sw || sw.triggered) return;

    const dx = e.clientX - sw.startX;
    const dy = e.clientY - sw.startY;
    const distMoved = Math.hypot(dx, dy);
    const thresh = sw.btn === 'K' ? 16 : 17;
    if (distMoved < thresh) return;

    let matchedAction: ApexButtonAction | null = null;
    let hintText = '';
    let hintTone = 'border-emerald-400';

    if (sw.btn === 'K') {
      if (dy <= -thresh && -dy >= Math.abs(dx) * 0.72) {
        matchedAction = 'RAINBOW';
        hintText = 'RAINBOW!';
        hintTone = 'border-pink-400 shadow-[0_0_24px_rgba(244,114,182,0.8)] -translate-y-1';
      } else if (dy >= thresh && dy >= Math.abs(dx) * 0.72) {
        matchedAction = 'SKILL_KNOCKON';
        hintText = 'ĐẨY DÀI!';
        hintTone = 'border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.8)] translate-y-1';
      } else if (dx <= -thresh && -dx > Math.abs(dy) * 0.72) {
        matchedAction = 'SKILL_STOP';
        hintText = 'DỪNG GẤP!';
        hintTone = 'border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.8)] -translate-x-1';
      }
    } else if (sw.btn === 'J') {
      if (dy <= -thresh && -dy >= Math.abs(dx) * 0.75) {
        matchedAction = 'PASS_LOFT';
        hintText = 'BỔNG!';
        hintTone = 'border-sky-300 shadow-[0_0_22px_rgba(125,211,252,0.8)] -translate-y-1';
      } else if (Math.abs(dx) >= thresh) {
        matchedAction = 'PASS_LONG_LOFT';
        hintText = 'BỔNG XA!';
        hintTone = 'border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.8)]';
      }
    } else if (sw.btn === 'I') {
      if (!hudSnap.userHasBall && dy <= -thresh && -dy >= Math.abs(dx) * 0.75) {
        matchedAction = 'GK_RUSH';
        hintText = 'GK DÂNG!';
        hintTone = 'border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.8)] -translate-y-1';
      }
    } else if (sw.btn === 'L') {
      if (dy <= -thresh && -dy >= Math.abs(dx) * 0.75) {
        matchedAction = 'SHOT_CHIP';
        hintText = 'SÚT BỔNG!';
        hintTone = 'border-cyan-300 shadow-[0_0_22px_rgba(56,189,248,0.85)] -translate-y-1';
      } else if (dy >= thresh && dy >= Math.abs(dx) * 0.75) {
        matchedAction = 'SHOT_CURVE';
        hintText = 'CURVE!';
        hintTone = 'border-emerald-300 shadow-[0_0_22px_rgba(74,222,128,0.85)] translate-y-1';
      } else if (Math.abs(dx) >= thresh) {
        matchedAction = 'SHOT_POWER_LONG';
        hintText = 'SÚT XA!';
        hintTone = 'border-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.9)]';
      }
    }

    if (matchedAction) {
      sw.triggered = true;
      clearBtnSwipeTimer();
      if (sw.holdStarted) {
        touchHoldActionRef.current = null;
        touchShootHoldRef.current = false;
      }
      pendingActionRef.current = matchedAction;
      setActiveSwipeHint({ btn: sw.btn, text: hintText, tone: hintTone });
    }
  };

  const handleBtnPointerEnd = () => {
    const sw = btnSwipeRef.current;
    clearBtnSwipeTimer();
    if (sw) {
      if (sw.holdStarted) {
        if (touchHoldActionRef.current === sw.btn) {
          touchHoldActionRef.current = null;
          touchShootHoldRef.current = false;
        }
      } else if (!sw.triggered) {
        pendingActionRef.current = sw.btn;
      }
    }
    btnSwipeRef.current = null;
    window.setTimeout(() => setActiveSwipeHint(null), 110);
  };

  const handleJoyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = Math.max(18, rect.width * 0.34);
    joyBaseRef.current = { cx, cy, maxR };
    setJoyActive(true);
    updateJoyFromPoint(e.clientX, e.clientY, cx, cy, maxR);
  };

  const updateJoyFromPoint = (px: number, py: number, cx: number, cy: number, maxR: number) => {
    const dx = px - cx;
    const dy = py - cy;
    const d = Math.hypot(dx, dy);
    const clampedD = Math.min(maxR, d);
    const ang = Math.atan2(dy, dx);
    const kx = d > 1 ? Math.cos(ang) * clampedD : 0;
    const ky = d > 1 ? Math.sin(ang) * clampedD : 0;
    setJoyKnob({ x: kx, y: ky });
    touchJoyRef.current = { dx: kx / maxR, dy: ky / maxR };
  };

  const handleJoyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joyActive || !joyBaseRef.current) return;
    updateJoyFromPoint(
      e.clientX,
      e.clientY,
      joyBaseRef.current.cx,
      joyBaseRef.current.cy,
      joyBaseRef.current.maxR
    );
  };

  const handleJoyPointerUp = () => {
    setJoyActive(false);
    setJoyKnob({ x: 0, y: 0 });
    touchJoyRef.current = { dx: 0, dy: 0 };
    joyBaseRef.current = null;
  };

  const isMobileControls = localControlMode === 'mobile';
  const shootArcRadius = 35;
  const shootArcCircumference = 2 * Math.PI * shootArcRadius;
  const shootChargeOffset =
    shootArcCircumference * (1 - Math.min(1, Math.max(0, hudSnap.activeChargePower)));

  const p1TopStar = [...p1Starters].sort((a, b) => b.ovr - a.ovr)[0];
  const p2Pool =
    mode === 'pvp' && pvpServerState?.players && pvpServerState.players.length >= 22
      ? pvpServerState.players.slice(11, 22)
      : p2Starters;
  const p2TopStar = [...p2Pool].sort((a, b) => b.ovr - a.ovr)[0];

  const getTierFrameStyle = (cardType?: string) => {
    if (cardType === 'GINGA') return 'border-emerald-400 bg-gradient-to-b from-emerald-900/70 to-slate-950';
    if (cardType === 'UTOTY') return 'border-cyan-300 bg-gradient-to-b from-sky-900/70 to-slate-950';
    if (cardType === 'BALLON_DOR') return 'border-amber-300 bg-gradient-to-b from-amber-800/70 to-slate-950';
    if (cardType === 'HERO') return 'border-purple-400 bg-gradient-to-b from-indigo-900/70 to-slate-950';
    return 'border-emerald-400/50 bg-gradient-to-b from-slate-800 to-slate-950';
  };

  return (
    <div
      ref={wrapperRef}
      className="relative mx-auto w-[96%] max-w-[1140px] min-w-[280px] aspect-video rounded-xl overflow-hidden border border-emerald-400/35 bg-[#06150d] shadow-[0_0_40px_rgba(0,0,0,0.85)] select-none touch-none transition-all duration-200"
    >
      {/* 2D FC Mobile Broadcast Isometric Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* TOP-LEFT EA FC MOBILE BROADCAST SCOREBOARD */}
      <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-20 pointer-events-none flex flex-col gap-1 origin-top-left scale-[0.72] sm:scale-[0.88] md:scale-100">
        <div className="relative flex items-stretch rounded-lg overflow-hidden bg-slate-950/90 border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.68)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-emerald-400 via-cyan-300 to-rose-400 opacity-85" />
          {/* Half & Clock Pill + FC Mobile Match Minute */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-emerald-500 to-emerald-600 text-slate-950 font-black">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider opacity-90">
              H{hudSnap.half}
            </span>
            <span className="font-mono text-xs sm:text-sm tabular-nums tracking-tight">
              {formatMatchTimer(hudSnap.playSecondsLeft)}
            </span>
            <span className="hidden sm:inline-block px-1 py-[1px] rounded bg-slate-950/20 text-[9px] font-mono tabular-nums">
              {Math.min(90, Math.max(0, Math.round(90 - hudSnap.playSecondsLeft)))}&apos;
            </span>
          </div>

          {/* Home Team (User) */}
          <div className="flex items-center gap-1.5 pl-2.5 pr-2 py-1 border-l border-white/10">
            <span className="w-1 h-4 rounded-full bg-blue-500" />
            {userTeamLogo && (
              <img src={userTeamLogo} alt="" className="w-4 h-4 object-contain hidden sm:block" />
            )}
            <span className="font-black text-[11px] sm:text-xs text-white uppercase max-w-[68px] sm:max-w-[92px] truncate">
              {userTeamName}
            </span>
          </div>

          {/* Scoreline */}
          <div className="flex items-center px-2.5 py-1 bg-slate-900/95 border-x border-white/10 font-black text-sm sm:text-base text-white tabular-nums">
            <span>{hudSnap.p1Score}</span>
            <span className="mx-1 text-slate-500">-</span>
            <span>{hudSnap.p2Score}</span>
          </div>

          {/* Away Team (Opp) */}
          <div className="flex items-center gap-1.5 pl-2 pr-2.5 py-1">
            <span className="font-black text-[11px] sm:text-xs text-slate-200 uppercase max-w-[68px] sm:max-w-[92px] truncate">
              {oppTeamName}
            </span>
            {oppTeamLogo && (
              <img src={oppTeamLogo} alt="" className="w-4 h-4 object-contain hidden sm:block" />
            )}
            <span className="w-1 h-4 rounded-full bg-rose-500" />
          </div>

          {/* Attack Direction Tag */}
          <div className="hidden sm:flex items-center px-2 bg-slate-900/90 border-l border-white/10 text-[10px] font-black text-emerald-400">
            {hudSnap.attackingRight ? 'ATK →' : '← ATK'}
          </div>
        </div>

        {/* Compact FC Mobile Match Stats Strip (Possession, Skill & Slide-Tackle Accuracy) */}
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950/78 border border-white/10 text-[10px] font-bold text-slate-200 backdrop-blur-sm w-fit">
          <span className="text-cyan-300">KS: {hudSnap.possessionPct}%</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-300">
            Skill: {hudSnap.p1SkillAttempts} (
            {hudSnap.p1SkillAttempts > 0
              ? `${Math.round((hudSnap.p1SkillSuccess / hudSnap.p1SkillAttempts) * 100)}%`
              : '0%'}
            )
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-300">
            Xoạc: {hudSnap.p1SlideAttempts} (
            {hudSnap.p1SlideAttempts > 0
              ? `${Math.round((hudSnap.p1SlideSuccess / hudSnap.p1SlideAttempts) * 100)}%`
              : '0%'}
            )
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-rose-300">
            Đ.Thủ Xoạc: {hudSnap.p2SlideAttempts} (
            {hudSnap.p2SlideAttempts > 0
              ? `${Math.round((hudSnap.p2SlideSuccess / hudSnap.p2SlideAttempts) * 100)}%`
              : '0%'}
            )
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">OVR {userOvr}-{oppOvr}</span>
        </div>

        {/* Desktop Keyboard Hint Pill (PC Mode only) */}
        {!isMobileControls && (
          <div className="flex flex-wrap items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/75 border border-white/10 text-[9px] sm:text-[10px] font-bold text-slate-300 backdrop-blur-sm w-fit max-w-[660px]">
            <span>
              <strong className="text-emerald-300 font-mono">WASD</strong>{' '}
              {isUserCorner ? 'Chỉnh điểm' : 'Chạy'}
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <strong className="text-yellow-300 font-mono">I</strong> {btnLabels.I.label}
              {!hudSnap.userHasBall && '/Y:GK Dâng'}
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <strong className="text-sky-300 font-mono">J</strong> {btnLabels.J.label}
              {hudSnap.userHasBall && ' (U:Bổng/O:Xa)'}
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <strong className="text-emerald-300 font-mono">K</strong> {btnLabels.K.label}
              {hudSnap.userHasBall && ' (E:Rainbow/Q:Đẩy/C:Dừng)'}
            </span>
            <span className="text-slate-600">·</span>
            <span>
              <strong className="text-rose-300 font-mono">L</strong> {btnLabels.L.label}
              {hudSnap.userHasBall && ' (R:Chip/F:Curve/V:Sút Xa)'}
            </span>
          </div>
        )}
      </div>

      {/* TOP-RIGHT QUICK CONTROL MODE SWITCH (PC / ĐIỆN THOẠI) */}
      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-30 flex items-center gap-2 origin-top-right scale-[0.78] sm:scale-90 md:scale-100">
        <button
          type="button"
          onClick={handleToggleControlMode}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-950/88 hover:bg-slate-900 border border-white/20 text-[9px] sm:text-[11px] font-black uppercase text-white flex items-center gap-1 shadow-lg backdrop-blur-md cursor-pointer"
          title="Chuyển chế độ điều khiển PC / Điện thoại"
        >
          {isMobileControls ? (
            <>
              <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span>Điện Thoại</span>
            </>
          ) : (
            <>
              <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300" />
              <span>PC (Phím)</span>
            </>
          )}
        </button>
      </div>

      {/* FC MOBILE ACTIVE PLAYER CARD STRIP (Card Portrait, Pos/OVR, Skill Stars, Stamina) */}
      <div
        className={`absolute z-20 pointer-events-none ${
          isMobileControls
            ? 'top-[52px] left-1.5 origin-top-left scale-[0.7] sm:scale-[0.86] md:scale-100 sm:top-[62px] sm:left-2.5'
            : 'bottom-2.5 left-2.5 origin-bottom-left scale-[0.76] sm:scale-[0.9] md:scale-100'
        }`}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-950/88 border border-white/15 shadow-2xl backdrop-blur-md">
          {/* Card Portrait + OVR/POS Thumbnail */}
          <div
            className={`relative w-10 h-12 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center ${getTierFrameStyle(
              hudSnap.activeCardType
            )}`}
          >
            {hudSnap.activeAvatarUrl && (
              <img
                src={hudSnap.activeAvatarUrl}
                alt={hudSnap.activeName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1 py-[1px] flex items-center justify-between text-[8px] font-black leading-none">
              <span className="text-white tabular-nums">{hudSnap.activeOvr}</span>
              <span className="text-emerald-300 uppercase">{hudSnap.activePos}</span>
            </div>
          </div>

          <div className="flex flex-col min-w-[92px]">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[11px] font-black uppercase text-white truncate max-w-[82px]">
                  {hudSnap.activeName}
                </span>
                {hudSnap.activeYellowCards >= 1 && (
                  <span
                    className="inline-block w-2 h-2.5 rounded-[1px] bg-yellow-400 border border-black shrink-0"
                    title="Đã nhận thẻ vàng"
                  />
                )}
              </div>
              {hudSnap.activeClubLogo && (
                <img
                  src={hudSnap.activeClubLogo}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5 mt-0.5">
              {hudSnap.userHasBall ? (
                <span
                  className={`text-[8px] font-black uppercase px-1.5 py-[1px] rounded ${
                    hudSnap.activeSkillCooldown <= 0
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {hudSnap.activeSkillCooldown <= 0
                    ? `SKILL ${hudSnap.activeSkillMoves ?? 4}★`
                    : `${hudSnap.activeSkillCooldown.toFixed(1)}s`}
                </span>
              ) : (
                <span className="text-[8px] font-black uppercase text-sky-300">
                  {hudSnap.supportActive ? '2ND PRESS' : 'PHÒNG NGỰ'}
                </span>
              )}
              {hudSnap.activeChargePower > 0.03 && (
                <span
                  className={`text-[8px] font-mono font-black px-1 py-[1px] rounded ${
                    hudSnap.activeChargePower >= (hudSnap.activeChargeKind === 'shoot' ? 0.92 : 0.85)
                      ? 'bg-rose-500/35 text-rose-200 border border-rose-400/60'
                      : hudSnap.activeChargePower < 0.26
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                  }`}
                >
                  {hudSnap.activeChargeKind === 'pass' || hudSnap.activeChargeKind === 'through'
                    ? hudSnap.activeChargePower >= 0.85
                      ? 'BAY CAO!'
                      : hudSnap.activeChargePower < 0.26
                      ? 'CHUYỀN NHẸ'
                      : 'CHUYỀN CHUẨN'
                    : hudSnap.activeChargePower >= 0.93
                    ? 'VỌT XÀ!'
                    : hudSnap.activeChargePower >= 0.84
                    ? 'SÚT UY LỰC!'
                    : hudSnap.activeChargePower >= 0.48
                    ? 'ĐẶT LÒNG!'
                    : 'SÚT NHẸ'}
                </span>
              )}
            </div>

            {/* Stamina Bar */}
            <div className="mt-1 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  hudSnap.activeStamina > 65
                    ? 'bg-emerald-400'
                    : hudSnap.activeStamina > 42
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(12, Math.min(100, hudSnap.activeStamina))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SET PIECE LIVE COUNTDOWN / CORNER / FREE-KICK AIMING PILL (Top-Center below banners) */}
      {(hudSnap.setPieceType === 'corner' ||
        hudSnap.setPieceType === 'throw_in' ||
        hudSnap.setPieceType === 'free_kick' ||
        hudSnap.setPieceType === 'offside') &&
        !hudSnap.goalActive && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-25 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-full bg-slate-950/92 border border-emerald-400/60 text-[10px] sm:text-[11px] font-black uppercase text-emerald-200 shadow-xl flex items-center gap-2 whitespace-nowrap backdrop-blur-md">
              {hudSnap.setPieceType === 'corner' ? (
                <span>
                  {hudSnap.setPieceSide === 'p1'
                    ? `PHẠT GÓC (${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s) · ${
                        isMobileControls ? 'Kéo Cần' : 'WASD'
                      } chọn điểm rơi · I Xoáy / J Ngắn / L Căng`
                    : `ĐỐI THỦ PHẠT GÓC · ${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s`}
                </span>
              ) : hudSnap.setPieceType === 'throw_in' ? (
                <span>
                  {hudSnap.setPieceSide === 'p1'
                    ? `NÉM BIÊN (${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s) · J Ném ngắn / I Ném mạnh`
                    : `ĐỐI THỦ CHUẨN BỊ NÉM BIÊN (${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s)`}
                </span>
              ) : (
                <span>
                  {hudSnap.setPieceSide === 'p1'
                    ? `ĐÁ PHẠT BỔNG (${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s) · J/I Chuyền bổng · L Sút xoáy bổng (bấm Sút để Đánh Đầu!)`
                    : `ĐỐI THỦ ĐÁ PHẠT BỔNG (${Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s)`}
                </span>
              )}
            </div>
          </div>
        )}

      {/* CONTEXTUAL AIRBORNE HEADER PROMPT (When ball is airborne in reach & user is contesting) */}
      {(hudSnap.phase === 'half1' || hudSnap.phase === 'half2') &&
        hudSnap.ballInAir &&
        !hudSnap.userHasBall &&
        !hudSnap.goalActive &&
        hudSnap.setPieceType === 'none' && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-25 pointer-events-none">
            <div className="px-3.5 py-1 rounded-full bg-amber-950/92 border border-amber-300/75 text-[10px] sm:text-[11px] font-black uppercase text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.45)] flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md animate-pulse">
              <span>BÓNG BỔNG · BẤM {isMobileControls ? 'SÚT' : 'L'} ĐỂ ĐÁNH ĐẦU!</span>
            </div>
          </div>
        )}

      {/* FC MOBILE Corner-Flag Tactical PiP Box (PC Mode) */}
      {hudSnap.setPieceCorner && !isMobileControls && (
        <div className="absolute bottom-20 left-3 z-25 w-28 h-24 rounded-lg bg-[#146c31] border border-emerald-300/60 shadow-2xl overflow-hidden pointer-events-none hidden sm:flex flex-col items-center justify-center">
          <div className="text-[9px] font-black bg-slate-950/85 text-emerald-300 px-1.5 py-0.5 uppercase tracking-wider w-full text-center">
            PHẠT GÓC · {Math.max(0, hudSnap.setPieceTimer).toFixed(1)}s
          </div>
          <svg viewBox="0 0 80 60" className="w-full h-full">
            <rect width="80" height="60" fill="#177a38" />
            <path d="M0 10 L80 48" stroke="#fff" strokeWidth="2.5" />
            <path d="M55 0 L20 60" stroke="#fff" strokeWidth="2" />
            <line x1="40" y1="30" x2="40" y2="8" stroke="#fff" strokeWidth="2.5" />
            <polygon points="40,8 55,14 40,20" fill="#4ade80" />
            <circle cx="44" cy="34" r="4" fill="#fff" stroke="#000" strokeWidth="1" />
          </svg>
        </div>
      )}

      {/* FC MOBILE BROADCAST "GOAL!" CELEBRATION OVERLAY WITH SCORER CARD REVEAL */}
      {hudSnap.goalActive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-slate-950/50 backdrop-blur-[2px]">
          <div className="flex items-stretch rounded-xl overflow-hidden border border-emerald-400/80 shadow-[0_0_55px_rgba(34,197,94,0.65)] bg-slate-950/95 scale-[0.54] sm:scale-[0.76] md:scale-95">
            {hudSnap.goalScorerAvatar ? (
              <div
                className={`relative w-20 sm:w-24 shrink-0 border-r border-emerald-400/40 overflow-hidden flex items-center justify-center ${getTierFrameStyle(
                  hudSnap.goalScorerCardType
                )}`}
              >
                <img
                  src={hudSnap.goalScorerAvatar}
                  alt={hudSnap.goalScorer}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
                {hudSnap.goalScorerOvr && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/85 text-white font-black text-[10px] leading-none">
                    {hudSnap.goalScorerOvr} {hudSnap.goalScorerPos}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex flex-col items-center justify-center px-5 py-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950">
                <span className="font-black italic text-lg leading-none tracking-tight">FC MOBILE</span>
                <span className="font-black text-[10px] uppercase tracking-widest mt-1 opacity-90">
                  ĐẤU ĐỈNH CAO
                </span>
              </div>
            )}
            <div className="px-6 sm:px-8 py-4 text-center flex flex-col items-center justify-center">
              <div className="font-black italic text-4xl sm:text-6xl tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-200 to-emerald-400 drop-shadow-[0_4px_16px_rgba(34,197,94,0.75)]">
                GOAL!
              </div>
              <div className="mt-1.5 px-4 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                {hudSnap.goalScorerClubLogo && (
                  <img
                    src={hudSnap.goalScorerClubLogo}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 object-contain"
                  />
                )}
                <span>
                  {hudSnap.goalSide === 'p1' ? userTeamName : oppTeamName} · {hudSnap.goalScorer}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FC MOBILE KICKOFF / HALFTIME / FULL-TIME BROADCAST SUMMARY CARD */}
      {(hudSnap.phase === 'intro' || hudSnap.phase === 'halftime' || hudSnap.phase === 'outro') &&
        !hudSnap.goalActive && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-slate-950/48 backdrop-blur-[2px]">
            <div className="w-[88%] max-w-[390px] rounded-xl overflow-hidden border border-emerald-400/50 bg-slate-950/94 shadow-[0_12px_40px_rgba(0,0,0,0.85)] text-center scale-[0.52] sm:scale-[0.76] md:scale-95">
              <div className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                {hudSnap.phase === 'intro'
                  ? 'EA FC MOBILE · ĐỘI HÌNH RA SÂN'
                  : hudSnap.phase === 'halftime'
                  ? 'NGHỈ GIỮA HIỆP · ĐỔI SÂN'
                  : 'HẾT GIỜ · KẾT QUẢ CHUNG CUỘC'}
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between gap-2">
                <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  {p1TopStar?.avatarUrl ? (
                    <div
                      className={`relative w-12 h-14 rounded-lg border overflow-hidden ${getTierFrameStyle(
                        p1TopStar.cardType
                      )}`}
                    >
                      <img
                        src={p1TopStar.avatarUrl}
                        alt={p1TopStar.shortName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] font-black text-emerald-300">
                        {p1TopStar.ovr} {p1TopStar.pos}
                      </span>
                    </div>
                  ) : (
                    userTeamLogo && (
                      <img src={userTeamLogo} alt="" className="w-7 h-7 object-contain" />
                    )
                  )}
                  <span className="text-[11px] sm:text-xs font-black text-white uppercase truncate max-w-full">
                    {userTeamName}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 font-black text-xl sm:text-2xl text-emerald-300 tabular-nums shrink-0">
                  {hudSnap.p1Score} - {hudSnap.p2Score}
                </div>
                <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  {p2TopStar?.avatarUrl ? (
                    <div
                      className={`relative w-12 h-14 rounded-lg border overflow-hidden ${getTierFrameStyle(
                        p2TopStar.cardType
                      )}`}
                    >
                      <img
                        src={p2TopStar.avatarUrl}
                        alt={p2TopStar.shortName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[8px] font-black text-rose-300">
                        {p2TopStar.ovr} {p2TopStar.pos}
                      </span>
                    </div>
                  ) : (
                    oppTeamLogo && (
                      <img src={oppTeamLogo} alt="" className="w-7 h-7 object-contain" />
                    )
                  )}
                  <span className="text-[11px] sm:text-xs font-black text-slate-200 uppercase truncate max-w-full">
                    {oppTeamName}
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 bg-slate-900/90 border-t border-white/10 text-[10px] font-bold text-slate-300">
                {hudSnap.phase === 'intro' ? (
                  <div className="flex items-center justify-center gap-3">
                    <span>Kiểm soát: {hudSnap.possessionPct}%</span>
                    <span className="text-slate-600">·</span>
                    <span>45s / Hiệp</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div>
                      <div className="text-[9px] uppercase text-slate-400">Kiểm soát</div>
                      <div className="font-mono text-cyan-300">
                        {hudSnap.possessionPct}%-{100 - hudSnap.possessionPct}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-slate-400">Cú sút</div>
                      <div className="font-mono text-emerald-300">
                        {hudSnap.p1Shots} - {hudSnap.p2Shots}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-slate-400">Skill</div>
                      <div className="font-mono text-sky-300">
                        {hudSnap.p1SkillAttempts > 0
                          ? `${Math.round((hudSnap.p1SkillSuccess / hudSnap.p1SkillAttempts) * 100)}%`
                          : '0%'}
                        {' · '}
                        {hudSnap.p2SkillAttempts > 0
                          ? `${Math.round((hudSnap.p2SkillSuccess / hudSnap.p2SkillAttempts) * 100)}%`
                          : '0%'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-slate-400">Xoạc bóng</div>
                      <div className="font-mono text-amber-300">
                        {hudSnap.p1SlideAttempts} - {hudSnap.p2SlideAttempts}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* WHISTLE / FOUL / CARD / OFFSIDE / THROW-IN FC BROADCAST BANNER */}
      {hudSnap.banner &&
        !hudSnap.goalActive &&
        hudSnap.phase !== 'intro' &&
        hudSnap.phase !== 'halftime' &&
        hudSnap.phase !== 'outro' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div
            className={`px-5 py-2 rounded-lg border shadow-2xl text-center backdrop-blur-md ${
              hudSnap.banner.tone === 'red'
                ? 'bg-red-950/92 border-red-400 text-red-100'
                : hudSnap.banner.tone === 'yellow'
                ? 'bg-amber-950/92 border-yellow-300 text-yellow-200'
                : hudSnap.banner.tone === 'offside'
                ? 'bg-indigo-950/92 border-cyan-300 text-cyan-100'
                : 'bg-slate-950/90 border-emerald-400/60 text-white'
            }`}
          >
            <div className="font-black text-xs sm:text-base uppercase tracking-wider flex items-center justify-center gap-2">
              {hudSnap.banner.tone === 'yellow' && (
                <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-yellow-400 border border-black" />
              )}
              {hudSnap.banner.tone === 'red' && (
                <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-red-500 border border-black" />
              )}
              <span>{hudSnap.banner.title}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold opacity-90">{hudSnap.banner.subtitle}</div>
          </div>
        </div>
      )}

      {/* MOBILE MODE: FC MOBILE VIRTUAL THUMBSTICK + 4 CIRCULAR SWIPE ICON BUTTONS */}
      {isMobileControls && (
        <>
          <div
            onPointerDown={handleJoyPointerDown}
            onPointerMove={handleJoyPointerMove}
            onPointerUp={handleJoyPointerUp}
            onPointerCancel={handleJoyPointerUp}
            className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-30 w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] md:w-24 md:h-24 rounded-full bg-slate-950/45 border-2 border-white/35 backdrop-blur-[2px] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl"
          >
            <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border border-emerald-300/25 pointer-events-none" />
            <div
              style={{
                transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
              }}
              className="absolute w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-b from-white to-slate-300 border-2 border-emerald-400/80 shadow-[0_4px_16px_rgba(0,0,0,0.65)] pointer-events-none"
            />
          </div>

          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-30 w-[152px] h-[126px] sm:w-[186px] sm:h-[154px] md:w-[210px] md:h-[176px] pointer-events-none">
            {/* TOP-RIGHT (Red Rim): L — SÚT (↑Bổng / ↓Curve / ↔Sút Xa) / ĐÁNH ĐẦU / XOẠC */}
            <button
              type="button"
              onPointerDown={(e) => handleBtnPointerDown('L', btnLabels.L.isShootHold, e)}
              onPointerMove={handleBtnPointerMove}
              onPointerUp={handleBtnPointerEnd}
              onPointerCancel={handleBtnPointerEnd}
              className={`pointer-events-auto absolute top-0 right-1 w-[48px] h-[48px] sm:w-[58px] sm:h-[58px] md:w-[66px] md:h-[66px] rounded-full bg-slate-950/82 border-2 shadow-[0_0_20px_rgba(244,63,94,0.45)] flex flex-col items-center justify-center text-white font-black active:scale-95 transition-all backdrop-blur-sm cursor-pointer ${
                activeSwipeHint?.btn === 'L' ? activeSwipeHint.tone : 'border-rose-400/90'
              }`}
            >
              {hudSnap.activeChargePower > 0.02 && hudSnap.activeChargeKind === 'shoot' && (
                <svg
                  viewBox="0 0 80 80"
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r={shootArcRadius}
                    fill="none"
                    stroke={
                      hudSnap.activeChargePower >= 0.86
                        ? '#ef4444'
                        : hudSnap.activeChargePower >= 0.48
                        ? '#4ade80'
                        : '#f59e0b'
                    }
                    strokeWidth="5"
                    strokeDasharray={shootArcCircumference}
                    strokeDashoffset={shootChargeOffset}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {hudSnap.userHasBall && !hudSnap.inOwnHalf && (
                <span className="text-[5.5px] sm:text-[7.5px] leading-none text-amber-200/85 mb-0.5">
                  ↑↓↔
                </span>
              )}
              {hudSnap.userHasBall ? (
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" />
              ) : (
                <Footprints className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" />
              )}
              <span className="text-[6.5px] sm:text-[9.5px] leading-tight text-center px-0.5">
                {activeSwipeHint?.btn === 'L' ? activeSwipeHint.text : btnLabels.L.label}
              </span>
            </button>

            {/* MID-LEFT (Gold Rim): I — CHỌC KHE / HỖ TRỢ (↑Thủ Môn Dâng Cao) */}
            <button
              type="button"
              onPointerDown={(e) => handleBtnPointerDown('I', btnLabels.I.isShootHold, e)}
              onPointerMove={handleBtnPointerMove}
              onPointerUp={handleBtnPointerEnd}
              onPointerCancel={handleBtnPointerEnd}
              className={`pointer-events-auto absolute top-3.5 left-0.5 sm:top-4 sm:left-1 w-[46px] h-[46px] sm:w-[56px] sm:h-[56px] md:w-[64px] md:h-[64px] rounded-full bg-slate-950/82 border-2 shadow-[0_0_18px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center text-white font-black active:scale-95 transition-all backdrop-blur-sm cursor-pointer ${
                activeSwipeHint?.btn === 'I' ? activeSwipeHint.tone : 'border-amber-400/90'
              }`}
            >
              {hudSnap.activeChargePower > 0.02 && hudSnap.activeChargeKind === 'through' && (
                <svg
                  viewBox="0 0 80 80"
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r={shootArcRadius}
                    fill="none"
                    stroke={
                      hudSnap.activeChargePower >= 0.85
                        ? '#ef4444'
                        : hudSnap.activeChargePower >= 0.26
                        ? '#4ade80'
                        : '#f59e0b'
                    }
                    strokeWidth="5"
                    strokeDasharray={shootArcCircumference}
                    strokeDashoffset={shootChargeOffset}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {!hudSnap.userHasBall && (
                <span className="text-[7px] sm:text-[8px] leading-none text-cyan-300/90 mb-0.5">
                  ↑GK
                </span>
              )}
              {hudSnap.userHasBall ? (
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              ) : (
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              )}
              <span className="text-[8.5px] sm:text-[10px] leading-tight text-center px-0.5">
                {activeSwipeHint?.btn === 'I' ? activeSwipeHint.text : btnLabels.I.label}
              </span>
            </button>

            {/* BOTTOM-LEFT (Blue Rim): J — CHUYỀN (↑Chuyền Bổng / ↔Bổng Xa) / ĐỔI NGƯỜI */}
            <button
              type="button"
              onPointerDown={(e) => handleBtnPointerDown('J', btnLabels.J.isShootHold, e)}
              onPointerMove={handleBtnPointerMove}
              onPointerUp={handleBtnPointerEnd}
              onPointerCancel={handleBtnPointerEnd}
              className={`pointer-events-auto absolute bottom-0.5 left-0 w-[46px] h-[46px] sm:w-[56px] sm:h-[56px] md:w-[64px] md:h-[64px] rounded-full bg-slate-950/82 border-2 shadow-[0_0_18px_rgba(56,189,248,0.45)] flex flex-col items-center justify-center text-white font-black active:scale-95 transition-all backdrop-blur-sm cursor-pointer ${
                activeSwipeHint?.btn === 'J' ? activeSwipeHint.tone : 'border-sky-400/90'
              }`}
            >
              {hudSnap.activeChargePower > 0.02 && hudSnap.activeChargeKind === 'pass' && (
                <svg
                  viewBox="0 0 80 80"
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r={shootArcRadius}
                    fill="none"
                    stroke={
                      hudSnap.activeChargePower >= 0.85
                        ? '#ef4444'
                        : hudSnap.activeChargePower >= 0.26
                        ? '#38bdf8'
                        : '#f59e0b'
                    }
                    strokeWidth="5"
                    strokeDasharray={shootArcCircumference}
                    strokeDashoffset={shootChargeOffset}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {hudSnap.userHasBall && (
                <span className="text-[7px] sm:text-[8px] leading-none text-sky-200/90 mb-0.5">
                  ↑↔
                </span>
              )}
              {hudSnap.userHasBall ? (
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300" />
              ) : (
                <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300" />
              )}
              <span className="text-[8.5px] sm:text-[10px] leading-tight text-center px-0.5">
                {activeSwipeHint?.btn === 'J' ? activeSwipeHint.text : btnLabels.J.label}
              </span>
            </button>

            {/* LARGE BOTTOM-RIGHT (Emerald Rim): K — ROULETTE / ↑RAINBOW / ↓ĐẨY DÀI / ←DỪNG GẤP / TẤC BÓNG */}
            <button
              type="button"
              onPointerDown={(e) => handleBtnPointerDown('K', false, e)}
              onPointerMove={handleBtnPointerMove}
              onPointerUp={handleBtnPointerEnd}
              onPointerCancel={handleBtnPointerEnd}
              className={`pointer-events-auto absolute bottom-0 right-0.5 w-[54px] h-[54px] sm:w-[66px] sm:h-[66px] md:w-[74px] md:h-[74px] rounded-full bg-slate-950/84 border-[2.5px] sm:border-[3px] flex flex-col items-center justify-center text-white font-black active:scale-95 transition-all backdrop-blur-sm cursor-pointer ${
                activeSwipeHint?.btn === 'K'
                  ? activeSwipeHint.tone
                  : 'border-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.55)]'
              }`}
            >
              {hudSnap.userHasBall && (
                <span
                  className={`text-[7px] sm:text-[8.5px] font-black uppercase leading-none mb-0.5 ${
                    activeSwipeHint?.btn === 'K' ? 'text-pink-300' : 'text-amber-300/90'
                  }`}
                >
                  ↑↓←
                </span>
              )}
              {hudSnap.userHasBall ? (
                <Sparkles
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    activeSwipeHint?.btn === 'K' ? 'text-pink-300' : 'text-emerald-300'
                  }`}
                />
              ) : (
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              )}
              <span className="text-[8.5px] sm:text-[10.5px] leading-tight text-center px-0.5">
                {activeSwipeHint?.btn === 'K' ? activeSwipeHint.text : btnLabels.K.label}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
