// Modern 2D FC Mobile Broadcast Isometric Pitch & Multi-Frame Arcade Renderer

import {
  ApexMatchState,
  ApexPlayerEntity,
  computePassAndThroughTargets,
  findClosestPlayerIdx,
} from './apexMatchEngine';

export interface IsoScreenPoint {
  x: number;
  y: number;
}

export interface PitchProjection {
  cw: number;
  ch: number;
  camX: number;
  camY: number;
  zoom: number;
}

/**
 * Converts world coordinates (0..100, 0..100, height z) into smooth FC Mobile 3/4 broadcast perspective.
 */
export function worldToIso(
  wx: number,
  wy: number,
  wz: number,
  proj: PitchProjection
): IsoScreenPoint {
  const dx = wx - proj.camX;
  const dy = wy - proj.camY;
  const sx = proj.cw * 0.5 + (dx * 1.38 + dy * 0.12) * proj.zoom;
  const sy = proj.ch * 0.5 + (-dx * 0.045 + dy * 1.04) * proj.zoom - wz * proj.zoom * 1.12;
  return { x: sx, y: sy };
}

function drawIsoPoly(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number, number?]>,
  proj: PitchProjection
) {
  if (pts.length === 0) return;
  ctx.beginPath();
  const p0 = worldToIso(pts[0][0], pts[0][1], pts[0][2] ?? 0, proj);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < pts.length; i++) {
    const pi = worldToIso(pts[i][0], pts[i][1], pts[i][2] ?? 0, proj);
    ctx.lineTo(pi.x, pi.y);
  }
  ctx.closePath();
}

function drawIsoLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  proj: PitchProjection
) {
  const a = worldToIso(x1, y1, z1, proj);
  const b = worldToIso(x2, y2, z2, proj);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

const CROWD_PALETTE = [
  '#e2e8f0',
  '#38bdf8',
  '#22c55e',
  '#facc15',
  '#ef4444',
  '#94a3b8',
  '#f8fafc',
  '#60a5fa',
];

function drawPerimeterAndCrowd(ctx: CanvasRenderingContext2D, proj: PitchProjection, timeSec: number) {
  // Modern stadium technical concrete/turf surround
  drawIsoPoly(
    ctx,
    [
      [-12, -16],
      [112, -16],
      [112, 116],
      [-12, 116],
    ],
    proj
  );
  ctx.fillStyle = '#07130d';
  ctx.fill();

  // Outer pitch turf apron
  drawIsoPoly(
    ctx,
    [
      [-5.5, -4.5],
      [105.5, -4.5],
      [105.5, 104.5],
      [-5.5, 104.5],
    ],
    proj
  );
  ctx.fillStyle = '#0f4e27';
  ctx.fill();

  // Modern Stadium Crowd Stands (sleek layered spectators with occasional flashbulbs)
  const stepX = 3.0;
  const rowsTop = [-7.8, -10.8, -13.8];
  const rowsBot = [106.2, 109.2, 112.2];

  const drawRow = (wy: number, rowIdx: number) => {
    for (let wx = -5; wx <= 105; wx += stepX) {
      const pt = worldToIso(wx, wy, 0, proj);
      if (pt.x < -20 || pt.x > proj.cw + 20 || pt.y < -20 || pt.y > proj.ch + 20) continue;
      const hash = Math.abs(Math.floor(wx * 17 + rowIdx * 37));
      const cheerOffset = Math.sin(timeSec * 5.2 + hash) > 0.72 ? -1.8 : 0;
      const s = Math.max(3.4, proj.zoom * 0.34);
      ctx.fillStyle = CROWD_PALETTE[hash % CROWD_PALETTE.length];
      ctx.beginPath();
      ctx.roundRect(pt.x - s * 0.48, pt.y - s + cheerOffset, s * 0.96, s * 0.85, 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - s * 1.18 + cheerOffset, Math.max(0.8, s * 0.28), 0, Math.PI * 2);
      ctx.fill();

      // Subtle stadium camera flashbulbs in crowd stands
      if (Math.sin(timeSec * 14.5 + hash * 3.7) > 0.992) {
        ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - s * 1.05 + cheerOffset, Math.max(1.8, s * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  rowsTop.forEach((wy, idx) => drawRow(wy, idx));
  rowsBot.forEach((wy, idx) => drawRow(wy, idx + 4));

  // Sleek Glowing FC Mobile LED Ad Boards along top touchline
  const ads = [
    { x1: 4, x2: 26, bg: '#090d16', accent: '#22c55e', txt: 'EA SPORTS FC' },
    { x1: 28, x2: 49, bg: '#0b1528', accent: '#38bdf8', txt: 'FC MOBILE' },
    { x1: 51, x2: 72, bg: '#111827', accent: '#facc15', txt: 'ĐẤU ĐỈNH CAO' },
    { x1: 74, x2: 96, bg: '#0a1f16', accent: '#4ade80', txt: 'GINGA 26' },
  ];
  for (const ad of ads) {
    drawIsoPoly(
      ctx,
      [
        [ad.x1, -2.4, 0],
        [ad.x2, -2.4, 0],
        [ad.x2, -2.4, 2.0],
        [ad.x1, -2.4, 2.0],
      ],
      proj
    );
    ctx.fillStyle = ad.bg;
    ctx.fill();
    ctx.strokeStyle = ad.accent;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const mid = worldToIso((ad.x1 + ad.x2) * 0.5, -2.4, 1.0, proj);
    if (mid.x > -60 && mid.x < proj.cw + 60 && mid.y > -30 && mid.y < proj.ch + 30) {
      ctx.save();
      ctx.font = `900 ${Math.max(8, Math.round(proj.zoom * 0.6))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ad.accent;
      ctx.fillText(ad.txt, mid.x, mid.y);
      ctx.restore();
    }
  }

  // Team Dugout Canopies & Technical Coaching Boxes along top touchline
  const dugouts = [
    { x1: 31, x2: 44, trim: '#3b82f6', label: 'HOME BENCH' },
    { x1: 56, x2: 69, trim: '#ef4444', label: 'AWAY BENCH' },
  ];
  for (const dg of dugouts) {
    // Glass & steel bench canopy
    drawIsoPoly(
      ctx,
      [
        [dg.x1, -5.0, 0],
        [dg.x2, -5.0, 0],
        [dg.x2, -4.4, 2.3],
        [dg.x1, -4.4, 2.3],
      ],
      proj
    );
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = dg.trim;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Dashed technical area box on turf apron
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 3]);
    drawIsoPoly(
      ctx,
      [
        [dg.x1 + 1, 0.3],
        [dg.x2 - 1, 0.3],
        [dg.x2 - 1, 1.9],
        [dg.x1 + 1, 1.9],
      ],
      proj
    );
    ctx.stroke();
    ctx.restore();
  }
}

function drawStadiumFloodlights(ctx: CanvasRenderingContext2D, proj: PitchProjection, timeSec: number) {
  // 4 Corner Floodlight Towers + 3 Grandstand Roof Pods casting soft FC Mobile night match glow
  const cornerTowers: Array<{ wx: number; wy: number; aimX: number; aimY: number; warm: boolean }> = [
    { wx: -7.5, wy: -8.5, aimX: 20, aimY: 22, warm: false },
    { wx: 107.5, wy: -8.5, aimX: 80, aimY: 22, warm: true },
    { wx: -7.5, wy: 108.5, aimX: 22, aimY: 76, warm: true },
    { wx: 107.5, wy: 108.5, aimX: 78, aimY: 76, warm: false },
  ];

  ctx.save();
  for (const tw of cornerTowers) {
    const base = worldToIso(tw.wx, tw.wy, 0, proj);
    const head = worldToIso(tw.wx, tw.wy, 13.5, proj);
    const target = worldToIso(tw.aimX, tw.aimY, 0, proj);

    // Volumetric diagonal floodlight beam onto pitch
    const beamGrad = ctx.createLinearGradient(head.x, head.y, target.x, target.y);
    beamGrad.addColorStop(0, tw.warm ? 'rgba(254, 249, 195, 0.26)' : 'rgba(224, 242, 254, 0.26)');
    beamGrad.addColorStop(0.45, tw.warm ? 'rgba(254, 240, 138, 0.08)' : 'rgba(186, 230, 253, 0.08)');
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = beamGrad;
    const beamSpread = Math.max(48, proj.zoom * 6.5);
    ctx.beginPath();
    ctx.moveTo(head.x - 10, head.y);
    ctx.lineTo(head.x + 10, head.y);
    ctx.lineTo(target.x + beamSpread, target.y + beamSpread * 0.45);
    ctx.lineTo(target.x - beamSpread, target.y - beamSpread * 0.45);
    ctx.closePath();
    ctx.fill();

    // Only draw tower mast & LED head if near/inside viewport
    if (base.x > -140 && base.x < proj.cw + 140 && base.y > -140 && base.y < proj.ch + 160) {
      // Steel lattice mast
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = Math.max(2.8, proj.zoom * 0.24);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(base.x - 4, base.y);
      ctx.lineTo(head.x, head.y);
      ctx.moveTo(base.x + 4, base.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();

      // LED Luminaire Rig Panel
      const rigW = Math.max(22, proj.zoom * 2.2);
      const rigH = Math.max(12, proj.zoom * 1.15);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(head.x - rigW * 0.5, head.y - rigH * 0.5, rigW, rigH, 3);
      ctx.fill();
      ctx.stroke();

      // Crisp Glowing LED Lamp Bulbs (3x2 grid)
      const pulse = 0.88 + Math.sin(timeSec * 3.1 + tw.wx) * 0.12;
      for (let gx = 0; gx < 3; gx++) {
        for (let gy = 0; gy < 2; gy++) {
          const lx = head.x - rigW * 0.3 + gx * (rigW * 0.3);
          const ly = head.y - rigH * 0.2 + gy * (rigH * 0.4);
          ctx.fillStyle = `rgba(255, 255, 240, ${pulse.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(lx, ly, Math.max(1.8, proj.zoom * 0.18), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Soft lens flare halo around floodlight bank
      const flareR = Math.max(24, proj.zoom * 2.8);
      const flare = ctx.createRadialGradient(head.x, head.y, 2, head.x, head.y, flareR);
      flare.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      flare.addColorStop(0.45, tw.warm ? 'rgba(254, 240, 138, 0.18)' : 'rgba(186, 230, 253, 0.18)');
      flare.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = flare;
      ctx.beginPath();
      ctx.arc(head.x, head.y, flareR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Grandstand overhead LED Roof Floodlight Pods along top stadium edge (always visible across camera pan!)
  const roofPodsX = [16, 38, 50, 62, 84];
  for (const rpx of roofPodsX) {
    const pod = worldToIso(rpx, -14.2, 8.2, proj);
    if (pod.x < -80 || pod.x > proj.cw + 80) continue;
    const turfTarget = worldToIso(rpx, 20, 0, proj);
    const podBeam = ctx.createLinearGradient(pod.x, pod.y, turfTarget.x, turfTarget.y);
    podBeam.addColorStop(0, 'rgba(224, 242, 254, 0.16)');
    podBeam.addColorStop(1, 'rgba(224, 242, 254, 0)');
    ctx.fillStyle = podBeam;
    ctx.beginPath();
    ctx.moveTo(pod.x - 14, pod.y);
    ctx.lineTo(pod.x + 14, pod.y);
    ctx.lineTo(turfTarget.x + 56, turfTarget.y);
    ctx.lineTo(turfTarget.x - 56, turfTarget.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(pod.x - 10, pod.y - 4, 20, 7);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(pod.x - 8, pod.y - 2, 4, 3);
    ctx.fillRect(pod.x - 2, pod.y - 2, 4, 3);
    ctx.fillRect(pod.x + 4, pod.y - 2, 4, 3);
  }
  ctx.restore();
}

export function drawIsoPitch(ctx: CanvasRenderingContext2D, proj: PitchProjection, timeSec: number) {
  ctx.fillStyle = '#06150d';
  ctx.fillRect(0, 0, proj.cw, proj.ch);

  drawPerimeterAndCrowd(ctx, proj, timeSec);

  // Authentic FC Mobile mowed grass vertical stripes (16 crisp wide turf bands!)
  const cols = 16;
  for (let cx = 0; cx < cols; cx++) {
    const x1 = (cx / cols) * 100;
    const x2 = ((cx + 1) / cols) * 100;
    const isDark = cx % 2 === 0;
    drawIsoPoly(
      ctx,
      [
        [x1, 0],
        [x2, 0],
        [x2, 100],
        [x1, 100],
      ],
      proj
    );
    ctx.fillStyle = isDark ? '#157034' : '#1b853f';
    ctx.fill();
  }

  // Subtle cross-cut horizontal turf weave for broadcast stadium realism
  const rows = 10;
  for (let ry = 0; ry < rows; ry += 2) {
    const y1 = (ry / rows) * 100;
    const y2 = ((ry + 1) / rows) * 100;
    drawIsoPoly(
      ctx,
      [
        [1.2, y1],
        [98.8, y1],
        [98.8, y2],
        [1.2, y2],
      ],
      proj
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.032)';
    ctx.fill();
  }

  // Goal-mouth & Penalty-spot natural turf wear shading
  for (const gx of [4.2, 95.8]) {
    const wearPt = worldToIso(gx, 50, 0, proj);
    ctx.fillStyle = 'rgba(120, 92, 46, 0.14)';
    ctx.beginPath();
    ctx.ellipse(wearPt.x, wearPt.y, Math.max(12, proj.zoom * 2.1), Math.max(16, proj.zoom * 3.1), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stadium floodlight center radial sheen + crisp night-arena vignette
  const midPt = worldToIso(50, 50, 0, proj);
  const rad = proj.cw * 0.72;
  const glow = ctx.createRadialGradient(midPt.x, midPt.y, rad * 0.05, midPt.x, midPt.y, rad);
  glow.addColorStop(0, 'rgba(187, 247, 208, 0.11)');
  glow.addColorStop(0.6, 'rgba(134, 239, 172, 0.04)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, proj.cw, proj.ch);

  // Crisp White Pitch Markings across expanded touchlines & endlines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(1.8, proj.zoom * 0.14);

  // Outer Pitch Boundary
  drawIsoPoly(
    ctx,
    [
      [1.2, 2.4],
      [98.8, 2.4],
      [98.8, 97.6],
      [1.2, 97.6],
    ],
    proj
  );
  ctx.stroke();

  // Halfway Line
  drawIsoLine(ctx, 50, 2.4, 0, 50, 97.6, 0, proj);

  // Center Circle
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const pt = worldToIso(50 + Math.cos(a) * 10.2, 50 + Math.sin(a) * 14.5, 0, proj);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();

  // Center spot
  const cDot = worldToIso(50, 50, 0, proj);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cDot.x, cDot.y, Math.max(2.4, proj.zoom * 0.24), 0, Math.PI * 2);
  ctx.fill();

  // Left Penalty Box + 6-yard Box (centered neatly around compact 45.4..54.6 goal)
  drawIsoPoly(
    ctx,
    [
      [1.2, 25.0],
      [16.2, 25.0],
      [16.2, 75.0],
      [1.2, 75.0],
    ],
    proj
  );
  ctx.stroke();
  drawIsoPoly(
    ctx,
    [
      [1.2, 38.2],
      [6.5, 38.2],
      [6.5, 61.8],
      [1.2, 61.8],
    ],
    proj
  );
  ctx.stroke();

  // Right Penalty Box + 6-yard Box
  drawIsoPoly(
    ctx,
    [
      [98.8, 25.0],
      [83.8, 25.0],
      [83.8, 75.0],
      [98.8, 75.0],
    ],
    proj
  );
  ctx.stroke();
  drawIsoPoly(
    ctx,
    [
      [98.8, 38.2],
      [93.5, 38.2],
      [93.5, 61.8],
      [98.8, 61.8],
    ],
    proj
  );
  ctx.stroke();

  // Penalty Box D-Arcs (outside 18-yard boxes!)
  ctx.beginPath();
  let startedL = false;
  for (let i = 0; i <= 28; i++) {
    const a = -0.82 + (i / 28) * 1.64;
    const px = 11.4 + Math.cos(a) * 7.4;
    const py = 50 + Math.sin(a) * 10.6;
    if (px < 16.2) continue;
    const pt = worldToIso(px, py, 0, proj);
    if (!startedL) {
      ctx.moveTo(pt.x, pt.y);
      startedL = true;
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  }
  ctx.stroke();

  ctx.beginPath();
  let startedR = false;
  for (let i = 0; i <= 28; i++) {
    const a = Math.PI - 0.82 + (i / 28) * 1.64;
    const px = 88.6 + Math.cos(a) * 7.4;
    const py = 50 + Math.sin(a) * 10.6;
    if (px > 83.8) continue;
    const pt = worldToIso(px, py, 0, proj);
    if (!startedR) {
      ctx.moveTo(pt.x, pt.y);
      startedR = true;
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  }
  ctx.stroke();

  // Corner Arcs
  const cornerArcSpecs: Array<{ cx: number; cy: number; a1: number; a2: number }> = [
    { cx: 1.2, cy: 2.4, a1: 0, a2: Math.PI / 2 },
    { cx: 98.8, cy: 2.4, a1: Math.PI / 2, a2: Math.PI },
    { cx: 98.8, cy: 97.6, a1: Math.PI, a2: Math.PI * 1.5 },
    { cx: 1.2, cy: 97.6, a1: Math.PI * 1.5, a2: Math.PI * 2 },
  ];
  for (const ca of cornerArcSpecs) {
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = ca.a1 + (i / 10) * (ca.a2 - ca.a1);
      const pt = worldToIso(ca.cx + Math.cos(a) * 2.2, ca.cy + Math.sin(a) * 2.9, 0, proj);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }

  // Penalty Spots
  const lPen = worldToIso(11.8, 50, 0, proj);
  const rPen = worldToIso(88.2, 50, 0, proj);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(lPen.x, lPen.y, Math.max(2, proj.zoom * 0.2), 0, Math.PI * 2);
  ctx.arc(rPen.x, rPen.y, Math.max(2, proj.zoom * 0.2), 0, Math.PI * 2);
  ctx.fill();

  // 4 Animated Corner Flags (waving gently in stadium breeze)
  const corners: Array<[number, number]> = [
    [1.2, 2.4],
    [98.8, 2.4],
    [1.2, 97.6],
    [98.8, 97.6],
  ];
  for (const [cx, cy] of corners) {
    const base = worldToIso(cx, cy, 0, proj);
    const top = worldToIso(cx, cy, 2.8, proj);
    const wave = Math.sin(timeSec * 5.2 + cx * 0.25 + cy * 0.15) * 2.1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(top.x + 8.5, top.y + 2.6 + wave);
    ctx.lineTo(top.x, top.y + 6);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawGoal3D(
  ctx: CanvasRenderingContext2D,
  goalSide: 'left' | 'right',
  proj: PitchProjection,
  ripplePhase: number = 0
) {
  const gx = goalSide === 'left' ? 1.2 : 98.8;
  const rippleShift = ripplePhase > 0 ? Math.sin(ripplePhase * 18) * 0.35 : 0;
  const backX = (goalSide === 'left' ? -0.5 : 100.5) + (goalSide === 'left' ? -Math.abs(rippleShift) : Math.abs(rippleShift));
  const y1 = 45.4;
  const y2 = 54.6;
  const h = 2.55;
  const backH = h * 0.84;

  const drawNetFace = (pts: Array<[number, number, number]>) => {
    drawIsoPoly(ctx, pts, proj);
    ctx.fillStyle = ripplePhase > 0 ? 'rgba(74, 222, 128, 0.22)' : 'rgba(255, 255, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = ripplePhase > 0 ? 'rgba(134, 239, 172, 0.72)' : 'rgba(226, 232, 240, 0.42)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  drawNetFace([
    [backX, y1, 0],
    [backX, y2, 0],
    [backX, y2, backH],
    [backX, y1, backH],
  ]);
  drawNetFace([
    [gx, y1, 0],
    [backX, y1, 0],
    [backX, y1, backH],
    [gx, y1, h],
  ]);
  drawNetFace([
    [gx, y2, 0],
    [backX, y2, 0],
    [backX, y2, backH],
    [gx, y2, h],
  ]);
  drawNetFace([
    [gx, y1, h],
    [gx, y2, h],
    [backX, y2, backH],
    [backX, y1, backH],
  ]);

  // Authentic FC Mobile Crisp White Net Mesh Grid Lines across back, sides, and roof
  ctx.save();
  ctx.strokeStyle = ripplePhase > 0 ? 'rgba(187, 247, 208, 0.58)' : 'rgba(241, 245, 249, 0.38)';
  ctx.lineWidth = Math.max(0.75, proj.zoom * 0.065);

  // Back net vertical & horizontal cords
  const backCols = 9;
  for (let i = 1; i < backCols; i++) {
    const ny = y1 + (i / backCols) * (y2 - y1);
    drawIsoLine(ctx, backX, ny, 0, backX, ny, backH, proj);
    drawIsoLine(ctx, gx, ny, h, backX, ny, backH, proj);
  }
  const backRows = 4;
  for (let r = 1; r < backRows; r++) {
    const nz = (r / backRows) * backH;
    const frontNz = (r / backRows) * h;
    drawIsoLine(ctx, backX, y1, nz, backX, y2, nz, proj);
    drawIsoLine(ctx, gx, y1, frontNz, backX, y1, nz, proj);
    drawIsoLine(ctx, gx, y2, frontNz, backX, y2, nz, proj);
  }
  // Side & roof depth cross-cords
  const depthSteps = 3;
  for (let d = 1; d < depthSteps; d++) {
    const t = d / depthSteps;
    const nx = gx + (backX - gx) * t;
    const topZ = h + (backH - h) * t;
    drawIsoLine(ctx, nx, y1, 0, nx, y1, topZ, proj);
    drawIsoLine(ctx, nx, y2, 0, nx, y2, topZ, proj);
    drawIsoLine(ctx, nx, y1, topZ, nx, y2, topZ, proj);
  }
  ctx.restore();

  // Crisp White Metal Frame Posts & Crossbar with Ground Shadow & Corner Brackets
  drawIsoPoly(
    ctx,
    [
      [gx, y1, 0],
      [backX, y1, 0],
      [backX, y2, 0],
      [gx, y2, 0],
    ],
    proj
  );
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fill();

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = Math.max(2.4, proj.zoom * 0.22);
  drawIsoLine(ctx, gx, y1, 0, gx, y1, h, proj);
  drawIsoLine(ctx, gx, y2, 0, gx, y2, h, proj);
  drawIsoLine(ctx, gx, y1, h, gx, y2, h, proj);
  // Subtle metallic highlight down crossbar & posts
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(1.0, proj.zoom * 0.08);
  drawIsoLine(ctx, gx, y1, h, gx, y2, h, proj);

  ctx.lineWidth = Math.max(1.5, proj.zoom * 0.13);
  ctx.strokeStyle = '#cbd5e1';
  drawIsoLine(ctx, gx, y1, h, backX, y1, backH, proj);
  drawIsoLine(ctx, gx, y2, h, backX, y2, backH, proj);
  drawIsoLine(ctx, backX, y1, 0, backX, y1, backH, proj);
  drawIsoLine(ctx, backX, y2, 0, backX, y2, backH, proj);
  drawIsoLine(ctx, backX, y1, 0, backX, y2, 0, proj);
}

/**
 * Draws FC Mobile tactical double-ring ground cursor, directional arrow, stamina ring,
 * 2nd-defender ring, overhead marker, active name tag, and curved shot-power bar.
 */
export function drawActivePlayerCursor(
  ctx: CanvasRenderingContext2D,
  screenPt: IsoScreenPoint,
  player: ApexPlayerEntity,
  isUserActive: boolean,
  hasBall: boolean,
  zoom: number,
  isSupporter: boolean = false
) {
  const rx = Math.max(10.0, zoom * 1.12);
  const ry = rx * 0.58;

  if (isUserActive || hasBall || isSupporter) {
    ctx.save();
    ctx.translate(screenPt.x, screenPt.y + 2);

    const ringColor = isSupporter
      ? '#f59e0b'
      : isUserActive
      ? hasBall
        ? '#4ade80'
        : '#38bdf8'
      : '#fb7185';

    // Outer translucent ground aura
    ctx.fillStyle = isSupporter
      ? 'rgba(245, 158, 11, 0.16)'
      : isUserActive
      ? hasBall
        ? 'rgba(74, 222, 128, 0.18)'
        : 'rgba(56, 189, 248, 0.16)'
      : 'rgba(251, 113, 133, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Primary FC Mobile tactical ellipse
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = isUserActive ? 2.4 : 1.9;
    if (isSupporter) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isUserActive) {
      // Stamina arc around bottom-front rim
      const stamFrac = Math.max(0.15, Math.min(1, player.stamina / 100));
      ctx.strokeStyle = stamFrac > 0.55 ? '#86efac' : '#fde047';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.78, ry * 0.78, 0, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * stamFrac);
      ctx.stroke();

      // Forward facing directional pointer wedge on ring
      const fx = Math.cos(player.facingAngle);
      const fy = Math.sin(player.facingAngle);
      const sx = fx * 1.38 + fy * 0.12;
      const sy = -fx * 0.045 + fy * 1.04;
      const scrAng = Math.atan2(sy, sx);
      const tipX = Math.cos(scrAng) * (rx + 5.5);
      const tipY = Math.sin(scrAng) * (ry + 3.5);
      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        Math.cos(scrAng - 0.34) * (rx - 1),
        Math.sin(scrAng - 0.34) * (ry - 1)
      );
      ctx.lineTo(
        Math.cos(scrAng + 0.34) * (rx - 1),
        Math.sin(scrAng + 0.34) * (ry - 1)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // FC Mobile compact OVR + Name pill under active player or 2ND Defender tag
  if (isUserActive) {
    const label = `${player.ovr} ${player.shortName}`;
    ctx.save();
    ctx.font = `900 ${Math.max(9, Math.round(zoom * 0.68))}px sans-serif`;
    const tw = Math.min(98, Math.max(46, ctx.measureText(label).width + 12));
    const px = screenPt.x - tw * 0.5;
    const py = screenPt.y + ry + 3;
    ctx.fillStyle = 'rgba(9, 13, 22, 0.84)';
    ctx.beginPath();
    ctx.roundRect(px, py, tw, 13.5, 4);
    ctx.fill();
    if (player.ovr >= 100) {
      ctx.strokeStyle = hasBall ? 'rgba(74, 222, 128, 0.8)' : 'rgba(250, 204, 21, 0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = hasBall ? '#86efac' : '#7dd3fc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, screenPt.x, py + 7, tw - 4);
    ctx.restore();
  } else if (isSupporter) {
    ctx.save();
    ctx.font = '900 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(screenPt.x - 14, screenPt.y + ry + 2, 28, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('HỖ TRỢ', screenPt.x, screenPt.y + ry + 11);
    ctx.restore();
  }

  // Overhead FC Mobile triangular player selector
  if (isUserActive) {
    const headY = screenPt.y - Math.max(30, zoom * 3.45);
    const sz = Math.max(6.5, zoom * 0.48);
    ctx.save();
    ctx.fillStyle = hasBall ? '#4ade80' : '#38bdf8';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(screenPt.x, headY);
    ctx.lineTo(screenPt.x - sz, headY - sz * 1.15);
    ctx.lineTo(screenPt.x + sz, headY - sz * 1.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Pass / Through / Shot Power Gauge right below active player (Weak / Sweet-spot / Overpower Loft zones)
  if (player.chargePower > 0.02) {
    const barW = Math.max(46, zoom * 3.7);
    const barH = Math.max(7, zoom * 0.48);
    const bx = screenPt.x - barW / 2;
    const by = screenPt.y + ry + 19;

    ctx.save();
    ctx.fillStyle = 'rgba(9, 13, 22, 0.92)';
    ctx.beginPath();
    ctx.roundRect(bx - 2, by - 2, barW + 4, barH + 4, 4);
    ctx.fill();

    // Danger overpower segment highlight at far right (>85%)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(bx + barW * 0.85, by, barW * 0.15, barH);

    const pwr = Math.min(1, player.chargePower);
    const fillW = barW * pwr;
    const grad = ctx.createLinearGradient(bx, by, bx + barW, by);
    if (player.chargeKind === 'pass' || player.chargeKind === 'through') {
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.28, '#38bdf8');
      grad.addColorStop(0.84, '#4ade80');
      grad.addColorStop(1, '#ef4444');
    } else {
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.28, '#22c55e');
      grad.addColorStop(0.84, '#eab308');
      grad.addColorStop(1, '#ef4444');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(3, fillW), barH, 2.5);
    ctx.fill();

    // Weak threshold (~26%) & Sweet-spot / Overpower markers (~85%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx + barW * 0.26, by);
    ctx.lineTo(bx + barW * 0.26, by + barH);
    ctx.moveTo(bx + barW * 0.85, by - 1);
    ctx.lineTo(bx + barW * 0.85, by + barH + 1);
    ctx.stroke();

    // Micro zone hint text
    const kindTxt =
      pwr >= (player.chargeKind === 'shoot' ? 0.92 : 0.85)
        ? 'BAY CAO!'
        : pwr < 0.26
        ? 'NHẸ'
        : player.chargeKind === 'pass'
        ? 'CHUYỀN'
        : player.chargeKind === 'through'
        ? 'CHỌC KHE'
        : pwr >= 0.48
        ? 'ĐẶT LÒNG'
        : 'SÚT';
    ctx.font = '900 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = pwr >= 0.85 ? '#fca5a5' : pwr < 0.26 ? '#fde68a' : '#86efac';
    ctx.fillText(kindTxt, screenPt.x, by + barH + 9);
    ctx.restore();
  }
}

function drawPitchArrow(
  ctx: CanvasRenderingContext2D,
  fromPt: IsoScreenPoint,
  toPt: IsoScreenPoint,
  color: string,
  dashed: boolean,
  tag: string,
  zoom: number
) {
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const len = Math.hypot(dx, dy);
  if (len < 16) return;

  const ang = Math.atan2(dy, dx);
  const startOffset = 10;
  const endOffset = 8;
  const sx = fromPt.x + Math.cos(ang) * startOffset;
  const sy = fromPt.y + Math.sin(ang) * startOffset;
  const ex = toPt.x - Math.cos(ang) * endOffset;
  const ey = toPt.y - Math.sin(ang) * endOffset;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2.6, zoom * 0.21);
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([7, 5]);

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.setLineDash([]);
  const headLen = Math.max(9, zoom * 0.7);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(ang - 0.46), ey - headLen * Math.sin(ang - 0.46));
  ctx.lineTo(ex - headLen * Math.cos(ang + 0.46), ey - headLen * Math.sin(ang + 0.46));
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(toPt.x, toPt.y, Math.max(7, zoom * 0.56), 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner crisp diamond pulse on intended receiver
  ctx.beginPath();
  ctx.arc(toPt.x, toPt.y, Math.max(3, zoom * 0.26), 0, Math.PI * 2);
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;

  if (tag) {
    ctx.font = `900 ${Math.max(10, Math.round(zoom * 0.72))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.beginPath();
    ctx.roundRect(toPt.x - 10, toPt.y - 23, 20, 14, 4);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(tag, toPt.x, toPt.y - 12);
  }
  ctx.restore();
}

function drawPassAndThroughArrows(
  ctx: CanvasRenderingContext2D,
  state: ApexMatchState,
  proj: PitchProjection,
  aimWx: number,
  aimWy: number
) {
  const owner = state.players.find((p) => p.id === state.ball.ownerId);
  const activeP1 = state.players[state.p1ActiveIdx];
  const isP1SetPieceThrow =
    (state.setPiece.type === 'throw_in' || state.setPiece.type === 'free_kick') &&
    state.setPiece.side === 'p1';

  const passer = owner?.side === 'p1' ? owner : isP1SetPieceThrow ? activeP1 : null;
  if (!passer || passer.sentOff) return;

  const preview = computePassAndThroughTargets(state, passer, aimWx, aimWy);
  const fromPt = worldToIso(passer.x, passer.y, 0.1, proj);

  if (preview.throughTarget) {
    const leadPt = worldToIso(preview.throughLeadX, preview.throughLeadY, 0.1, proj);
    const runnerPt = worldToIso(preview.throughTarget.x, preview.throughTarget.y, 0.1, proj);
    ctx.save();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(runnerPt.x, runnerPt.y);
    ctx.lineTo(leadPt.x, leadPt.y);
    ctx.stroke();
    ctx.restore();

    drawPitchArrow(ctx, fromPt, leadPt, 'rgba(250, 204, 21, 0.94)', true, 'I', proj.zoom);
  }

  if (preview.passTarget) {
    const passPt = worldToIso(preview.passTarget.x, preview.passTarget.y, 0.1, proj);
    drawPitchArrow(ctx, fromPt, passPt, 'rgba(56, 189, 248, 0.95)', false, 'J', proj.zoom);
  }
}

function drawKickFlightEffects(
  ctx: CanvasRenderingContext2D,
  state: ApexMatchState,
  proj: PitchProjection,
  timeSec: number
) {
  const activeP1 = state.players[state.p1ActiveIdx];
  // 1. Live FC Mobile Shot Aim Cone when holding L / SÚT
  if (activeP1 && !activeP1.sentOff && activeP1.chargePower > 0.03) {
    const pwr = Math.min(1, activeP1.chargePower);
    const len = 8 + pwr * 12;
    const endX = activeP1.x + Math.cos(activeP1.facingAngle) * len;
    const endY = activeP1.y + Math.sin(activeP1.facingAngle) * len;
    const startPt = worldToIso(activeP1.x, activeP1.y, 0.1, proj);
    const endPt = worldToIso(endX, endY, 0.1, proj);
    ctx.save();
    const grad = ctx.createLinearGradient(startPt.x, startPt.y, endPt.x, endPt.y);
    grad.addColorStop(0, 'rgba(74, 222, 128, 0.85)');
    grad.addColorStop(0.65, 'rgba(250, 204, 21, 0.9)');
    grad.addColorStop(1, pwr > 0.85 ? 'rgba(239, 68, 68, 0.95)' : 'rgba(250, 204, 21, 0.25)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(3, proj.zoom * 0.26);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startPt.x, startPt.y);
    ctx.lineTo(endPt.x, endPt.y);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Pass & Through-Ball Launch Shockwave + Flight Path + Receiver Target Ring
  const kickTimer = state.ball.kickTimer ?? 0;
  const kickKind = state.ball.kickKind;
  if (state.ball.ownerId || kickTimer <= 0 || !kickKind) return;

  const isThrough = kickKind === 'through';
  const isPass = kickKind === 'pass';
  if (!isThrough && !isPass) return;

  const maxDur = isThrough ? 1.15 : 0.9;
  const progress = Math.max(0, Math.min(1, 1 - kickTimer / maxDur));
  const primaryRgb = isThrough ? '250, 204, 21' : '56, 189, 248';
  const accentHex = isThrough ? '#4ade80' : '#7dd3fc';

  // Expanding turf shockwave ring at the passer's launch spot
  if (state.ball.kickFromX !== undefined && state.ball.kickFromY !== undefined && progress < 0.72) {
    const originPt = worldToIso(state.ball.kickFromX, state.ball.kickFromY, 0.05, proj);
    const ringAlpha = Math.max(0, 1 - progress / 0.72) * 0.82;
    const ringR = Math.max(10, proj.zoom * (0.9 + progress * 2.3));
    ctx.save();
    ctx.strokeStyle = `rgba(${primaryRgb}, ${ringAlpha.toFixed(3)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(originPt.x, originPt.y, ringR, ringR * 0.56, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing tracer beam from launch spot to current ball position
    const ballGroundPt = worldToIso(state.ball.x, state.ball.y, 0.05, proj);
    const beamGrad = ctx.createLinearGradient(originPt.x, originPt.y, ballGroundPt.x, ballGroundPt.y);
    beamGrad.addColorStop(0, `rgba(${primaryRgb}, 0.05)`);
    beamGrad.addColorStop(1, `rgba(${primaryRgb}, ${(0.65 * (1 - progress)).toFixed(3)})`);
    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = isThrough ? 3.0 : 2.4;
    if (isThrough) ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(originPt.x, originPt.y);
    ctx.lineTo(ballGroundPt.x, ballGroundPt.y);
    ctx.stroke();
    ctx.restore();
  }

  // Pulsing receiver lock ring under intended pass/through receiver
  if (state.ball.kickTargetId) {
    const targetMate = state.players.find((pl) => pl.id === state.ball.kickTargetId);
    if (targetMate && !targetMate.sentOff) {
      const targetPt = worldToIso(targetMate.x, targetMate.y, 0.05, proj);
      const pulse = 1 + Math.sin(timeSec * 14) * 0.14;
      const tr = Math.max(11, proj.zoom * 1.15) * pulse;
      ctx.save();
      ctx.strokeStyle = accentHex;
      ctx.fillStyle = `rgba(${primaryRgb}, 0.15)`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash(isThrough ? [4, 3] : []);
      ctx.beginPath();
      ctx.ellipse(targetPt.x, targetPt.y + 1, tr, tr * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawSetPieceOverlays(
  ctx: CanvasRenderingContext2D,
  state: ApexMatchState,
  proj: PitchProjection,
  timeSec: number
) {
  if (state.setPiece.type === 'corner') {
    const tx = state.setPiece.aimX ?? (state.setPiece.x < 50 ? 12 : 88);
    const ty = state.setPiece.aimY ?? 50;
    const cornerPt = worldToIso(state.setPiece.x, state.setPiece.y, 0.2, proj);
    const targetPt = worldToIso(tx, ty, 0.1, proj);

    const pulse = 1 + Math.sin(timeSec * 7) * 0.12;
    const r = Math.max(14, proj.zoom * 1.45) * pulse;
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(targetPt.x, targetPt.y, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(targetPt.x - r * 0.6, targetPt.y);
    ctx.lineTo(targetPt.x + r * 0.6, targetPt.y);
    ctx.moveTo(targetPt.x, targetPt.y - r * 0.42);
    ctx.lineTo(targetPt.x, targetPt.y + r * 0.42);
    ctx.stroke();

    const midX = (state.setPiece.x + tx) * 0.5;
    const midY = (state.setPiece.y + ty) * 0.5;
    const ctrlPt = worldToIso(midX, midY, 10.5, proj);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(cornerPt.x, cornerPt.y);
    ctx.quadraticCurveTo(ctrlPt.x, ctrlPt.y, targetPt.x, targetPt.y);
    ctx.stroke();
    ctx.restore();
  } else if (state.setPiece.type === 'throw_in') {
    const spPt = worldToIso(state.setPiece.x, state.setPiece.y, 0.1, proj);
    const maxT = state.setPiece.maxTimer || 3.0;
    const frac = Math.max(0, Math.min(1, state.setPiece.timer / maxT));
    const r = Math.max(16, proj.zoom * 1.3);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(spPt.x, spPt.y - 34, Math.max(6, r * 0.6), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(
      spPt.x,
      spPt.y - 34,
      Math.max(6, r * 0.6),
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * frac
    );
    ctx.stroke();

    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.max(0, state.setPiece.timer).toFixed(1)}s`, spPt.x, spPt.y - 30);
    ctx.restore();
  } else if (state.setPiece.type === 'free_kick' || state.setPiece.type === 'offside') {
    const spPt = worldToIso(state.setPiece.x, state.setPiece.y, 0.15, proj);
    const maxT = state.setPiece.maxTimer || 1.6;
    const frac = Math.max(0, Math.min(1, state.setPiece.timer / maxT));
    const r = Math.max(15, proj.zoom * 1.25);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(spPt.x, spPt.y - 30, Math.max(6, r * 0.54), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(spPt.x, spPt.y - 30, Math.max(6, r * 0.54), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();

    // Upward lofted free-kick arc guide pointing toward attacking target
    const atkDir =
      state.half === 1
        ? state.setPiece.side === 'p1'
          ? 1
          : -1
        : state.setPiece.side === 'p1'
        ? -1
        : 1;
    const previewTx = Math.max(4, Math.min(96, state.setPiece.x + atkDir * 24));
    const previewTy = 50 + (state.setPiece.y - 50) * 0.45;
    const targetPt = worldToIso(previewTx, previewTy, 0.1, proj);
    const midPt = worldToIso((state.setPiece.x + previewTx) * 0.5, (state.setPiece.y + previewTy) * 0.5, 9.2, proj);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(spPt.x, spPt.y);
    ctx.quadraticCurveTo(midPt.x, midPt.y, targetPt.x, targetPt.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '900 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(`PHẠT BỔNG ${Math.max(0, state.setPiece.timer).toFixed(1)}s`, spPt.x, spPt.y - 44);
    ctx.restore();
  }
}

/**
 * Draws multi-frame 2D FC Arcade player sprite with kit stripes, jersey number, GK gloves,
 * personalized pixel appearance (hairstyle, beard, headband, boots, height), & Roulette 360° animation.
 */
export function drawRetroPlayerSprite(
  ctx: CanvasRenderingContext2D,
  screenPt: IsoScreenPoint,
  player: ApexPlayerEntity,
  zoom: number,
  isReferee: boolean = false
) {
  if (player.sentOff) return;
  const heightMult = !isReferee && player.pixelProfile?.heightScale ? player.pixelProfile.heightScale : 1.0;
  const h = Math.max(20.5, zoom * 2.52) * heightMult;
  const w = h * 0.58;

  const isP1 = player.side === 'p1';
  const kitPrimary = isReferee
    ? '#111827'
    : player.isGk
    ? isP1
      ? '#f97316'
      : '#10b981'
    : isP1
    ? '#2563eb'
    : '#dc2626';
  const kitAccent = isReferee
    ? '#facc15'
    : player.isGk
    ? '#0f172a'
    : isP1
    ? '#93c5fd'
    : '#fde047';
  const kitShorts = isReferee
    ? '#09090b'
    : player.isGk
    ? '#0f172a'
    : isP1
    ? '#f8fafc'
    : '#1e293b';
  const idSeed = (player.cardId || player.name || player.id)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const skinTones = ['#f1c27d', '#c68642', '#8d5524', '#e0ac69'];
  const hairTones = ['#18181b', '#27272a', '#451a03', '#713f12', '#d4d4d8'];
  const prof = !isReferee ? player.pixelProfile : undefined;
  const skinTone = prof?.skinTone || skinTones[idSeed % skinTones.length];
  const hairTone = prof?.hairTone || hairTones[(idSeed >> 2) % hairTones.length];
  const hairStyle = prof?.hairStyle || 'short';
  const bootTone =
    prof?.bootTone ||
    (player.ovr >= 103 ? '#facc15' : player.ovr >= 98 ? '#38bdf8' : '#09090b');

  const frameIdx = Math.floor(player.animFrame) % 4;
  const cos = Math.cos(player.facingAngle);
  const faceRight = cos >= -0.05;

  const isRoulette = !isReferee && player.animState === 'roulette';
  const isRainbow = !isReferee && player.animState === 'rainbow';
  const isHeader = !isReferee && player.animState === 'header';
  const isPowerWindup = !isReferee && (player.powerWindupTimer ?? 0) > 0;
  const rouletteProgress = isRoulette
    ? player.animTimer > 0
      ? Math.max(0, Math.min(1, 1 - player.animTimer / 0.46))
      : (player.animFrame * 0.14) % 1
    : 0;
  const rainbowProgress = isRainbow
    ? player.animTimer > 0
      ? Math.max(0, Math.min(1, 1 - player.animTimer / 0.52))
      : (player.animFrame * 0.13) % 1
    : 0;
  const headerProgress = isHeader
    ? player.animTimer > 0
      ? Math.max(0, Math.min(1, 1 - player.animTimer / 0.44))
      : (player.animFrame * 0.14) % 1
    : 0;
  const rainbowJumpLift = isRainbow ? -Math.sin(rainbowProgress * Math.PI) * h * 0.22 : 0;
  const headerJumpLift = isHeader ? -Math.sin(headerProgress * Math.PI) * h * 0.42 : 0;
  const rouletteTheta = rouletteProgress * Math.PI * 2;
  const rouletteFacingSign = Math.cos(rouletteTheta) >= 0 ? 1 : -1;
  const rouletteWidthScale = isRoulette
    ? Math.max(0.32, Math.abs(Math.cos(rouletteTheta)))
    : 1;

  ctx.save();
  ctx.translate(screenPt.x, screenPt.y);

  // Subtle metallic pitch glow under elite 100+ OVR cards
  if (!isReferee && player.ovr >= 100) {
    const eliteColor =
      player.cardType === 'GINGA'
        ? 'rgba(74, 222, 128, 0.24)'
        : player.cardType === 'UTOTY'
        ? 'rgba(56, 189, 248, 0.24)'
        : 'rgba(250, 204, 21, 0.24)';
    ctx.fillStyle = eliteColor;
    ctx.beginPath();
    ctx.ellipse(0, 1, w * 0.72, w * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft Ground Shadow (shrinks smoothly when leaping during Header or Rainbow Flick)
  const jumpShadowScale = isHeader
    ? 1 - Math.sin(headerProgress * Math.PI) * 0.36
    : isRainbow
    ? 1 - Math.sin(rainbowProgress * Math.PI) * 0.25
    : 1;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 1, w * 0.58 * jumpShadowScale, w * 0.24 * jumpShadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rainbow Flick Glowing Overhead Trail & Ground Heel-Flick Dust!
  if (isRainbow) {
    const dir = faceRight ? 1 : -1;
    ctx.save();
    const arcGrad = ctx.createLinearGradient(-w * 1.1 * dir, -h * 0.6, w * 1.25 * dir, -h * 1.25);
    arcGrad.addColorStop(0, '#f472b6');
    arcGrad.addColorStop(0.5, '#facc15');
    arcGrad.addColorStop(1, '#38bdf8');
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = Math.max(2.2, zoom * 0.19);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w * 0.9 * dir, -h * 0.22);
    ctx.quadraticCurveTo(0, -h * 1.75, w * 1.15 * dir, -h * 0.38);
    ctx.stroke();

    // Glowing trailing dot along overhead rainbow curve
    const qt = rainbowProgress;
    const bxArc =
      (1 - qt) * (1 - qt) * (-w * 0.9 * dir) +
      2 * (1 - qt) * qt * 0 +
      qt * qt * (w * 1.15 * dir);
    const byArc =
      (1 - qt) * (1 - qt) * (-h * 0.22) +
      2 * (1 - qt) * qt * (-h * 1.75) +
      qt * qt * (-h * 0.38);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(bxArc, byArc, Math.max(2.4, zoom * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 360° Roulette Swirl Ring & Sparkles around feet
  if (isRoulette) {
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = Math.max(2.0, zoom * 0.16);
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      w * 1.12,
      w * 0.52,
      0,
      rouletteTheta - Math.PI * 1.35,
      rouletteTheta
    );
    ctx.stroke();

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = Math.max(1.6, zoom * 0.12);
    ctx.beginPath();
    ctx.ellipse(
      0,
      -h * 0.36,
      w * 0.92,
      w * 0.38,
      0,
      rouletteTheta,
      rouletteTheta + Math.PI * 1.15
    );
    ctx.stroke();

    const sparkX = Math.cos(rouletteTheta) * w * 1.08;
    const sparkY = Math.sin(rouletteTheta) * w * 0.48 - 2;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, Math.max(2.2, zoom * 0.17), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // High-speed sprint / Skill move turf dust puffs
  if (!isReferee && (player.invulnTimer > 0 || (player.animState === 'run' && Math.hypot(player.vx, player.vy) > 10.5))) {
    const dir = faceRight ? -1 : 1;
    ctx.fillStyle = player.invulnTimer > 0 ? 'rgba(74, 222, 128, 0.45)' : 'rgba(226, 232, 240, 0.34)';
    ctx.beginPath();
    ctx.arc(dir * w * 0.55, -2, 2.2, 0, Math.PI * 2);
    ctx.arc(dir * w * 0.78, -4.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fallen Pose (detailed kit, socks, boots & head)
  if (player.animState === 'fallen') {
    ctx.fillStyle = skinTone;
    ctx.fillRect(-h * 0.42, -w * 0.35, h * 0.18, w * 0.28);
    ctx.fillStyle = hairTone;
    ctx.fillRect(-h * 0.43, -w * 0.37, h * 0.14, w * 0.1);
    ctx.fillStyle = kitPrimary;
    ctx.fillRect(-h * 0.24, -w * 0.4, h * 0.34, w * 0.38);
    ctx.fillStyle = kitAccent;
    ctx.fillRect(-h * 0.24, -w * 0.4, h * 0.06, w * 0.38);
    ctx.fillStyle = kitShorts;
    ctx.fillRect(h * 0.1, -w * 0.36, h * 0.24, w * 0.32);
    ctx.fillStyle = skinTone;
    ctx.fillRect(h * 0.32, -w * 0.34, h * 0.08, w * 0.24);
    ctx.fillStyle = kitPrimary;
    ctx.fillRect(h * 0.37, -w * 0.34, h * 0.06, w * 0.24);
    ctx.fillStyle = bootTone;
    ctx.fillRect(h * 0.43, -w * 0.34, h * 0.1, w * 0.24);
    ctx.restore();
    return;
  }

  // Sliding Tackle Pose + Richer Kit, Cleat Studs & Grass Spray
  if (player.animState === 'slide') {
    const dir = faceRight ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.fillStyle = 'rgba(134, 239, 172, 0.62)';
    ctx.beginPath();
    ctx.arc(-h * 0.35, -2, 3.2, 0, Math.PI * 2);
    ctx.arc(-h * 0.5, -5.5, 2.3, 0, Math.PI * 2);
    ctx.arc(h * 0.38, -2, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Torso with stripe + collar trim
    ctx.fillStyle = 'rgba(9,13,22,0.35)';
    ctx.fillRect(-h * 0.35, -h * 0.29, h * 0.36, h * 0.2);
    ctx.fillStyle = kitPrimary;
    ctx.fillRect(-h * 0.34, -h * 0.28, h * 0.34, h * 0.18);
    ctx.fillStyle = kitAccent;
    ctx.fillRect(-h * 0.33, -h * 0.28, h * 0.06, h * 0.18);
    ctx.fillRect(-h * 0.22, -h * 0.21, h * 0.22, h * 0.04);

    // Head + eye + hair highlight
    ctx.fillStyle = skinTone;
    ctx.fillRect(-h * 0.45, -h * 0.37, h * 0.16, h * 0.16);
    ctx.fillStyle = hairTone;
    ctx.fillRect(-h * 0.46, -h * 0.39, h * 0.17, h * 0.065);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-h * 0.34, -h * 0.32, 2, 2);

    // Shorts + sock + ankle wrap + studded boot
    ctx.fillStyle = kitShorts;
    ctx.fillRect(0, -h * 0.23, h * 0.22, h * 0.15);
    ctx.fillStyle = kitAccent;
    ctx.fillRect(0, -h * 0.23, h * 0.22, h * 0.03);
    ctx.fillStyle = skinTone;
    ctx.fillRect(h * 0.2, -h * 0.2, h * 0.11, h * 0.1);
    ctx.fillStyle = kitPrimary;
    ctx.fillRect(h * 0.3, -h * 0.2, h * 0.11, h * 0.1);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(h * 0.4, -h * 0.2, h * 0.03, h * 0.1);
    ctx.fillStyle = bootTone;
    ctx.fillRect(h * 0.43, -h * 0.22, h * 0.11, h * 0.12);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(h * 0.52, -h * 0.21, 1.5, 2.5);
    ctx.fillRect(h * 0.52, -h * 0.14, 1.5, 2.5);
    ctx.restore();
    return;
  }

  // GK Dive Pose
  if (player.animState === 'gk_dive') {
    const dir = player.vy >= 0 ? 1 : -1;
    ctx.rotate(dir * 1.15);
  }

  const flipX = (faceRight ? 1 : -1) * (isRoulette ? rouletteFacingSign : 1);
  ctx.scale(flipX * rouletteWidthScale, 1);
  if (rainbowJumpLift !== 0 || headerJumpLift !== 0) {
    ctx.translate(0, rainbowJumpLift + headerJumpLift);
  }
  if (isHeader) {
    // Athletic airborne head-snap tilt forward toward direction of travel
    const lean = Math.sin(headerProgress * Math.PI) * 0.3;
    ctx.rotate(lean);
  }

  let lLegDx = -w * 0.22;
  let rLegDx = w * 0.06;
  let lLegH = h * 0.22;
  let rLegH = h * 0.22;
  let armRaise = 0;

  if (isHeader) {
    // Tucked airborne header legs & outstretched balance arms
    lLegDx = -w * 0.3;
    rLegDx = w * 0.14;
    lLegH = h * 0.15;
    rLegH = h * 0.14;
    armRaise = -h * 0.22;
  } else if (isRainbow) {
    // Rainbow Flick heel-scoop crouch -> airborne flick kick -> landing stride!
    if (rainbowProgress < 0.32) {
      lLegDx = -w * 0.36;
      rLegDx = -w * 0.08;
      lLegH = h * 0.18;
      rLegH = h * 0.24;
      armRaise = -h * 0.08;
    } else if (rainbowProgress < 0.75) {
      lLegDx = -w * 0.24;
      rLegDx = w * 0.26;
      lLegH = h * 0.21;
      rLegH = h * 0.16;
      armRaise = -h * 0.16;
    } else {
      lLegDx = -w * 0.18;
      rLegDx = w * 0.16;
      lLegH = h * 0.23;
      rLegH = h * 0.2;
      armRaise = -h * 0.06;
    }
  } else if (isRoulette) {
    // Marseille Roulette alternating drag & pivot stance!
    const swing = Math.sin(rouletteTheta * 2);
    lLegDx = -w * 0.28 + swing * w * 0.18;
    rLegDx = w * 0.14 - swing * w * 0.18;
    lLegH = h * (0.21 + Math.max(0, swing) * 0.04);
    rLegH = h * (0.21 + Math.max(0, -swing) * 0.04);
    armRaise = -h * 0.11;
  } else if (player.animState === 'run') {
    const strides = [
      { ldx: -w * 0.34, rdx: w * 0.18, lh: h * 0.19, rh: h * 0.23 },
      { ldx: -w * 0.14, rdx: w * 0.02, lh: h * 0.24, rh: h * 0.18 },
      { ldx: w * 0.18, rdx: -w * 0.34, lh: h * 0.23, rh: h * 0.19 },
      { ldx: w * 0.02, rdx: -w * 0.14, lh: h * 0.18, rh: h * 0.24 },
    ];
    const st = strides[frameIdx];
    lLegDx = st.ldx;
    rLegDx = st.rdx;
    lLegH = st.lh;
    rLegH = st.rh;
  } else if (isPowerWindup) {
    // Deep backswing coil before unleashing Power Long Shot!
    lLegDx = w * 0.12;
    rLegDx = -w * 0.36;
    lLegH = h * 0.23;
    rLegH = h * 0.16;
    armRaise = -h * 0.18;
  } else if (player.animState === 'kick') {
    lLegDx = -w * 0.26;
    rLegDx = w * 0.3;
    rLegH = h * 0.16;
  } else if (player.animState === 'celebrate') {
    armRaise = frameIdx % 2 === 0 ? -h * 0.28 : -h * 0.16;
  }

  // Legs: Thigh compression liner, Muscular calf shadow, Knee joint fold, Shin-guard ridge, Ribbed Sock Cuff & Ankle Tape
  ctx.fillStyle = skinTone;
  ctx.fillRect(lLegDx, -lLegH, w * 0.19, lLegH * 0.65);
  ctx.fillRect(rLegDx, -rLegH, w * 0.19, rLegH * 0.65);
  // Subtle under-short compression thigh trim on high-OVR cards
  if (!isReferee && player.ovr >= 96) {
    ctx.fillStyle = kitShorts;
    ctx.fillRect(lLegDx, -lLegH * 1.02, w * 0.19, Math.max(1.4, h * 0.032));
    ctx.fillRect(rLegDx, -rLegH * 1.02, w * 0.19, Math.max(1.4, h * 0.032));
  }
  // Subtle calf muscle shadow + knee joint highlight contour
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(lLegDx, -lLegH * 0.92, w * 0.06, lLegH * 0.34);
  ctx.fillRect(rLegDx, -rLegH * 0.92, w * 0.06, lLegH * 0.34);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(lLegDx + w * 0.04, -lLegH * 0.78, w * 0.1, Math.max(1.2, h * 0.024));
  ctx.fillRect(rLegDx + w * 0.04, -rLegH * 0.78, w * 0.1, Math.max(1.2, h * 0.024));

  // Socks + ribbed fold cuff + shin-guard contour highlight
  ctx.fillStyle = kitPrimary;
  ctx.fillRect(lLegDx, -lLegH * 0.54, w * 0.2, lLegH * 0.38);
  ctx.fillRect(rLegDx, -rLegH * 0.54, w * 0.2, rLegH * 0.38);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(lLegDx, -lLegH * 0.56, w * 0.2, Math.max(1.1, h * 0.018));
  ctx.fillRect(rLegDx, -rLegH * 0.56, w * 0.2, Math.max(1.1, h * 0.018));
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(lLegDx + w * 0.05, -lLegH * 0.4, w * 0.08, lLegH * 0.18);
  ctx.fillRect(rLegDx + w * 0.05, -rLegH * 0.4, w * 0.08, lLegH * 0.18);
  // Folded double sock stripes
  ctx.fillStyle = kitAccent;
  ctx.fillRect(lLegDx, -lLegH * 0.52, w * 0.2, Math.max(1.2, h * 0.024));
  ctx.fillRect(rLegDx, -rLegH * 0.52, w * 0.2, Math.max(1.2, h * 0.024));
  ctx.fillRect(lLegDx, -lLegH * 0.43, w * 0.2, Math.max(1.0, h * 0.018));
  ctx.fillRect(rLegDx, -rLegH * 0.43, w * 0.2, Math.max(1.0, h * 0.018));

  // Crisp white ankle wrap tape + Achilles heel cushion pad above boots
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(lLegDx, -5.5, w * 0.19, 1.8);
  ctx.fillRect(rLegDx, -5.5, w * 0.19, 1.8);
  ctx.fillStyle = kitAccent;
  ctx.fillRect(lLegDx - 0.5, -5.8, w * 0.05, 1.6);
  ctx.fillRect(rLegDx - 0.5, -5.8, w * 0.05, 1.6);

  // Detailed two-tone pro cleats with toe-cap accent, soleplate edge, heel tab & 3-stud outsole
  const activeBoot = isReferee ? '#09090b' : bootTone;
  ctx.fillStyle = activeBoot;
  ctx.fillRect(lLegDx - 1, -4, w * 0.28, 4);
  ctx.fillRect(rLegDx - 1, -4, w * 0.28, 4);
  // Brighter toe-cap & soleplate highlight + heel tab & lace stripe
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(lLegDx + w * 0.17, -3.7, w * 0.09, 2.2);
  ctx.fillRect(rLegDx + w * 0.17, -3.7, w * 0.09, 2.2);
  ctx.fillStyle = isReferee ? '#3f3f46' : kitAccent;
  ctx.fillRect(lLegDx - 1, -5.2, w * 0.06, 1.3);
  ctx.fillRect(rLegDx - 1, -5.2, w * 0.06, 1.3);
  ctx.fillRect(lLegDx + w * 0.05, -3.5, w * 0.13, 1.2);
  ctx.fillRect(rLegDx + w * 0.05, -3.5, w * 0.13, 1.2);
  // Boot lace micro dots & pro soleplate studs
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(lLegDx + w * 0.07, -3.5, Math.max(1.1, w * 0.03), 0.9);
  ctx.fillRect(lLegDx + w * 0.12, -3.5, Math.max(1.1, w * 0.03), 0.9);
  ctx.fillRect(rLegDx + w * 0.07, -3.5, Math.max(1.1, w * 0.03), 0.9);
  ctx.fillRect(rLegDx + w * 0.12, -3.5, Math.max(1.1, w * 0.03), 0.9);
  // Soleplate rim + metal studs
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(lLegDx - 1, -1.2, w * 0.27, 0.9);
  ctx.fillRect(rLegDx - 1, -1.2, w * 0.27, 0.9);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(lLegDx, -1, w * 0.06, 1.3);
  ctx.fillRect(lLegDx + w * 0.09, -1, w * 0.06, 1.3);
  ctx.fillRect(lLegDx + w * 0.18, -1, w * 0.06, 1.3);
  ctx.fillRect(rLegDx, -1, w * 0.06, 1.3);
  ctx.fillRect(rLegDx + w * 0.09, -1, w * 0.06, 1.3);
  ctx.fillRect(rLegDx + w * 0.18, -1, w * 0.06, 1.3);

  // Shorts with drawstring waist highlight, double pixel side stripe, hem slit & mini crest
  ctx.fillStyle = kitShorts;
  ctx.fillRect(-w * 0.34, -h * 0.44, w * 0.68, h * 0.21);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(-w * 0.34, -h * 0.44, w * 0.68, h * 0.028);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-w * 0.02, -h * 0.425, w * 0.04, Math.max(1.2, h * 0.022));
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(-w * 0.03, -h * 0.31, w * 0.06, h * 0.08);
  ctx.fillRect(-w * 0.34, -h * 0.26, w * 0.68, h * 0.03);
  ctx.fillStyle = kitAccent;
  ctx.fillRect(-w * 0.34, -h * 0.43, w * 0.065, h * 0.19);
  ctx.fillRect(w * 0.275, -h * 0.43, w * 0.065, h * 0.19);
  if (!isReferee) {
    ctx.fillRect(w * 0.18, -h * 0.31, w * 0.09, h * 0.035);
  }

  // Jersey Torso with FC Mobile vertical kit stripes, chest sheen, V-collar skin notch, crest & outline
  const bounce = isRoulette
    ? -Math.abs(Math.sin(rouletteTheta)) * 2.4
    : isRainbow
    ? -Math.sin(rainbowProgress * Math.PI) * 1.4
    : player.animState === 'run' && frameIdx % 2 === 1
    ? -1.6
    : 0;
  ctx.fillStyle = 'rgba(9, 13, 22, 0.44)';
  ctx.fillRect(-w * 0.39, -h * 0.75 + bounce, w * 0.78, h * 0.35);
  ctx.fillStyle = kitPrimary;
  ctx.fillRect(-w * 0.37, -h * 0.74 + bounce, w * 0.74, h * 0.33);
  // Vertical jersey pattern stripes + chest horizontal accent bar + subtle sash & tucked belt shadow
  ctx.fillStyle = isP1 && !isReferee && !player.isGk ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.14)';
  ctx.fillRect(-w * 0.22, -h * 0.74 + bounce, w * 0.12, h * 0.33);
  ctx.fillRect(w * 0.1, -h * 0.74 + bounce, w * 0.12, h * 0.33);
  if (!isReferee) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(-w * 0.37, -h * 0.62 + bounce, w * 0.74, Math.max(1.2, h * 0.025));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(-w * 0.06, -h * 0.74 + bounce, w * 0.12, h * 0.33);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(-w * 0.32, -h * 0.73 + bounce, w * 0.64, h * 0.055);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(-w * 0.37, -h * 0.51 + bounce, w * 0.74, h * 0.1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
  ctx.fillRect(-w * 0.37, -h * 0.435 + bounce, w * 0.74, Math.max(1.2, h * 0.025));

  // V-neck collar, inner neckline notch + micro label tag, shoulder piping & dual-side breathable mesh trim
  ctx.fillStyle = kitAccent;
  ctx.fillRect(-w * 0.22, -h * 0.75 + bounce, w * 0.44, h * 0.055);
  ctx.fillRect(-w * 0.07, -h * 0.7 + bounce, w * 0.14, h * 0.035);
  ctx.fillStyle = skinTone;
  ctx.fillRect(-w * 0.055, -h * 0.74 + bounce, w * 0.11, h * 0.032);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w * 0.022, -h * 0.712 + bounce, w * 0.044, Math.max(1.0, h * 0.015));
  ctx.fillStyle = kitAccent;
  ctx.fillRect(-w * 0.37, -h * 0.68 + bounce, w * 0.075, h * 0.23);
  ctx.fillRect(w * 0.295, -h * 0.68 + bounce, w * 0.06, h * 0.23);
  // Ventilated mesh micro-dots along jersey flanks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(-w * 0.35, -h * 0.63 + bounce, Math.max(1.0, w * 0.03), Math.max(1.0, h * 0.02));
  ctx.fillRect(-w * 0.35, -h * 0.56 + bounce, Math.max(1.0, w * 0.03), Math.max(1.0, h * 0.02));
  ctx.fillRect(w * 0.315, -h * 0.63 + bounce, Math.max(1.0, w * 0.03), Math.max(1.0, h * 0.02));
  ctx.fillRect(w * 0.315, -h * 0.56 + bounce, Math.max(1.0, w * 0.03), Math.max(1.0, h * 0.02));

  // Micro Club Crest Pixel Badge on left chest (or Referee pocket card badge)
  if (isReferee) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(w * 0.12, -h * 0.67 + bounce, w * 0.11, h * 0.075);
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(w * 0.14, -h * 0.68 + bounce, w * 0.11, h * 0.068);
    ctx.fillStyle = kitAccent;
    ctx.fillRect(w * 0.16, -h * 0.665 + bounce, w * 0.07, h * 0.038);
  }

  // Short sleeves with shoulder piping seam, cuff trim, raglan highlight & sleeve badge dot
  ctx.fillStyle = kitPrimary;
  ctx.fillRect(-w * 0.49, -h * 0.73 + bounce, w * 0.15, h * 0.115);
  ctx.fillRect(w * 0.34, -h * 0.73 + bounce, w * 0.15, h * 0.115);
  ctx.fillStyle = kitAccent;
  ctx.fillRect(-w * 0.49, -h * 0.73 + bounce, w * 0.15, Math.max(1.2, h * 0.025));
  ctx.fillRect(w * 0.34, -h * 0.73 + bounce, w * 0.15, Math.max(1.2, h * 0.025));
  ctx.fillRect(-w * 0.49, -h * 0.63 + bounce, w * 0.15, Math.max(1.0, h * 0.018));
  ctx.fillRect(w * 0.34, -h * 0.63 + bounce, w * 0.15, Math.max(1.0, h * 0.018));
  if (!isReferee) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w * 0.44, -h * 0.68 + bounce, Math.max(1.4, w * 0.045), Math.max(1.4, h * 0.022));
  }

  // Captain armband for 104+ OVR icons/stars
  if (!isReferee && player.ovr >= 104) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(w * 0.34, -h * 0.65 + bounce, w * 0.15, Math.max(2.0, h * 0.038));
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(w * 0.38, -h * 0.645 + bounce, w * 0.06, Math.max(1.2, h * 0.022));
  }

  // Arms with athletic wrist tape / compression sleeve / two-tone finger-save GK gloves
  const armY = -h * 0.62 + bounce + armRaise;
  ctx.fillStyle = !isReferee && (player.isGk || player.ovr >= 101) ? kitPrimary : skinTone;
  ctx.fillRect(-w * 0.47, armY, w * 0.13, h * (player.isGk ? 0.1 : 0.07));
  ctx.fillRect(w * 0.34, armY - (player.animState === 'kick' ? 4 : 0), w * 0.13, h * (player.isGk ? 0.1 : 0.07));
  ctx.fillStyle = skinTone;
  ctx.fillRect(-w * 0.47, armY + h * (player.isGk ? 0.08 : 0.045), w * 0.13, h * 0.115);
  ctx.fillRect(w * 0.34, armY - (player.animState === 'kick' ? 4 : 0) + h * (player.isGk ? 0.08 : 0.045), w * 0.13, h * 0.115);
  // Subtle forearm muscle shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(-w * 0.47, armY + h * 0.06, w * 0.05, h * 0.07);
  ctx.fillRect(w * 0.34, armY + h * 0.06 - (player.animState === 'kick' ? 4 : 0), w * 0.05, h * 0.07);
  if (player.isGk && !isReferee) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w * 0.49, armY + h * 0.088, w * 0.17, h * 0.026);
    ctx.fillRect(w * 0.32, armY + h * 0.088 - (player.animState === 'kick' ? 4 : 0), w * 0.17, h * 0.026);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-w * 0.5, armY + h * 0.114, w * 0.18, h * 0.082);
    ctx.fillRect(w * 0.32, armY + h * 0.114 - (player.animState === 'kick' ? 4 : 0), w * 0.18, h * 0.082);
    // Finger-save cuff, dark palm grip pad & tip details
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-w * 0.49, armY + h * 0.168, w * 0.16, h * 0.026);
    ctx.fillRect(w * 0.33, armY + h * 0.168 - (player.animState === 'kick' ? 4 : 0), w * 0.16, h * 0.026);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w * 0.45, armY + h * 0.132, w * 0.08, h * 0.024);
    ctx.fillRect(w * 0.37, armY + h * 0.132 - (player.animState === 'kick' ? 4 : 0), w * 0.08, h * 0.024);
  } else if (!isReferee && (player.ovr >= 98 || idSeed % 2 === 0)) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-w * 0.475, armY + h * 0.105, w * 0.14, h * 0.024);
    ctx.fillRect(w * 0.335, armY + h * 0.105 - (player.animState === 'kick' ? 4 : 0), w * 0.14, h * 0.024);
  }

  // Neck shadow + Head + Ear silhouette + Warm Cheek + Eye Glint + Mouth/Jaw Shadow + Highlighted Hair
  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.fillRect(-w * 0.1, -h * 0.77 + bounce, w * 0.2, h * 0.04);
  ctx.fillStyle = skinTone;
  ctx.fillRect(-w * 0.21, -h * 0.96 + bounce, w * 0.42, h * 0.22);
  // Ear rim highlight + cheekbone warmth + jaw depth + mouth & nose pixel detail
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(-w * 0.21, -h * 0.94 + bounce, w * 0.085, h * 0.17);
  ctx.fillRect(-w * 0.23, -h * 0.89 + bounce, w * 0.035, h * 0.06);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(-w * 0.225, -h * 0.885 + bounce, Math.max(1.0, w * 0.02), h * 0.03);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(-w * 0.14, -h * 0.76 + bounce, w * 0.28, Math.max(1.0, h * 0.015));
  ctx.fillRect(w * 0.088, -h * 0.842 + bounce, Math.max(1.2, w * 0.042), Math.max(1.2, h * 0.018));
  ctx.fillRect(w * 0.03, -h * 0.805 + bounce, w * 0.11, Math.max(1.0, h * 0.016));
  ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
  ctx.fillRect(-w * 0.03, -h * 0.845 + bounce, w * 0.075, h * 0.024);

  // Expressive Pixel Eyes (white sclera + dark iris pupil + glint pixel + angled eyebrows)
  const activeHairTone = isReferee ? '#18181b' : hairTone;
  ctx.fillStyle = activeHairTone;
  ctx.fillRect(-w * 0.01, -h * 0.918 + bounce, w * 0.09, Math.max(1.0, h * 0.018));
  ctx.fillRect(w * 0.11, -h * 0.915 + bounce, w * 0.09, Math.max(1.0, h * 0.018));
  const eyeSz = Math.max(1.5, w * 0.085);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(w * 0.005, -h * 0.89 + bounce, eyeSz * 0.5, eyeSz);
  ctx.fillRect(w * 0.125, -h * 0.89 + bounce, eyeSz * 0.5, eyeSz);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(w * 0.02, -h * 0.89 + bounce, eyeSz * 0.85, eyeSz);
  ctx.fillRect(w * 0.14, -h * 0.89 + bounce, eyeSz * 0.85, eyeSz);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(w * 0.022, -h * 0.89 + bounce, Math.max(0.9, eyeSz * 0.34), Math.max(0.9, eyeSz * 0.34));
  ctx.fillRect(w * 0.142, -h * 0.89 + bounce, Math.max(0.9, eyeSz * 0.34), Math.max(0.9, eyeSz * 0.34));

  if (prof?.hasBeard && !isReferee) {
    ctx.fillStyle = hairTone;
    ctx.fillRect(-w * 0.19, -h * 0.8 + bounce, w * 0.38, h * 0.062);
    ctx.fillRect(w * 0.12, -h * 0.84 + bounce, w * 0.07, h * 0.05);
  }

  if (isReferee || hairStyle === 'short' || hairStyle === 'fade') {
    ctx.fillStyle = activeHairTone;
    ctx.fillRect(-w * 0.23, -h * 1.01 + bounce, w * 0.46, h * (hairStyle === 'fade' ? 0.085 : 0.1));
    ctx.fillRect(-w * 0.22, -h * 0.94 + bounce, w * 0.05, h * 0.045);
    if (hairStyle === 'fade') {
      ctx.fillStyle = skinTone;
      ctx.fillRect(-w * 0.23, -h * 0.95 + bounce, w * 0.09, h * 0.035);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-w * 0.16, -h * 1.01 + bounce, w * 0.32, Math.max(1.2, h * 0.022));
  } else if (hairStyle === 'spiky') {
    ctx.fillStyle = activeHairTone;
    ctx.fillRect(-w * 0.23, -h * 1.01 + bounce, w * 0.46, h * 0.09);
    ctx.fillRect(-w * 0.17, -h * 1.065 + bounce, w * 0.1, h * 0.06);
    ctx.fillRect(-w * 0.03, -h * 1.08 + bounce, w * 0.1, h * 0.075);
    ctx.fillRect(w * 0.1, -h * 1.055 + bounce, w * 0.09, h * 0.05);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-w * 0.02, -h * 1.07 + bounce, w * 0.06, h * 0.025);
  } else if (hairStyle === 'curly') {
    ctx.fillStyle = activeHairTone;
    ctx.fillRect(-w * 0.27, -h * 1.03 + bounce, w * 0.54, h * 0.13);
    ctx.fillRect(-w * 0.22, -h * 1.06 + bounce, w * 0.44, h * 0.04);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(-w * 0.18, -h * 1.06 + bounce, w * 0.16, h * 0.025);
    ctx.fillRect(w * 0.04, -h * 1.05 + bounce, w * 0.14, h * 0.025);
  } else if (hairStyle === 'afro') {
    ctx.fillStyle = activeHairTone;
    ctx.fillRect(-w * 0.31, -h * 1.05 + bounce, w * 0.62, h * 0.17);
    ctx.fillRect(-w * 0.24, -h * 1.09 + bounce, w * 0.48, h * 0.05);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-w * 0.18, -h * 1.08 + bounce, w * 0.34, h * 0.03);
  } else if (hairStyle === 'long' || hairStyle === 'ponytail') {
    ctx.fillStyle = activeHairTone;
    ctx.fillRect(-w * 0.25, -h * 1.02 + bounce, w * 0.5, h * 0.11);
    // Flowing back lock / ponytail tail + hair tie band
    ctx.fillRect(-w * 0.36, -h * 0.93 + bounce, w * 0.16, h * 0.21);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(-w * 0.16, -h * 1.02 + bounce, w * 0.3, h * 0.025);
    if (hairStyle === 'ponytail') {
      ctx.fillStyle = prof?.headbandColor || '#facc15';
      ctx.fillRect(-w * 0.27, -h * 0.93 + bounce, w * 0.07, h * 0.04);
    }
  } else if (hairStyle === 'bald') {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(-w * 0.1, -h * 0.955 + bounce, w * 0.16, h * 0.025);
  }

  if (prof?.hasHeadband && !isReferee) {
    ctx.fillStyle = prof.headbandColor || '#f8fafc';
    ctx.fillRect(-w * 0.23, -h * 0.93 + bounce, w * 0.46, Math.max(1.8, h * 0.042));
  }

  // Chest/Back Jersey Number with crisp drop-shadow (unflipped!)
  if (!isReferee && player.number > 0) {
    ctx.scale(flipX, 1);
    ctx.font = `900 ${Math.max(8, Math.round(h * 0.21))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(9, 13, 22, 0.72)';
    ctx.fillText(String(player.number), 1, -h * 0.55 + bounce);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.fillText(String(player.number), 0, -h * 0.56 + bounce);
  }

  // Aerial Header Forehead Contact Shockwave Ring
  if (isHeader && headerProgress > 0.12 && headerProgress < 0.82) {
    const waveR = Math.max(1, w * (0.45 + headerProgress * 0.75));
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = Math.max(1.6, zoom * 0.14);
    ctx.beginPath();
    ctx.arc(w * 0.22, -h * 0.92 + bounce, waveR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Skill Move / Power Windup Neon Aura
  if ((player.invulnTimer > 0 || isPowerWindup || isHeader) && !isReferee) {
    ctx.strokeStyle = isHeader
      ? '#38bdf8'
      : isPowerWindup
      ? '#f97316'
      : isRainbow
      ? '#f472b6'
      : isRoulette
      ? '#fde047'
      : '#4ade80';
    ctx.lineWidth = isPowerWindup || isHeader ? 2.5 : 2.1;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.46, w * 0.74, h * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders the exact Đấu Đỉnh Cao pixel sprite onto a card preview canvas.
 */
export function drawPixelPlayerCardPreview(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  params: {
    id: string;
    name: string;
    pos: string;
    ovr: number;
    cardType?: string;
    number: number;
    isGk?: boolean;
    pixelProfile?: ApexPlayerEntity['pixelProfile'];
    animMode: 'idle' | 'run' | 'roulette' | 'rainbow';
    timeSec: number;
  }
) {
  ctx.clearRect(0, 0, cw, ch);

  // Subtle FC Mobile pitch grass mini-stage backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, ch);
  bg.addColorStop(0, '#0b2217');
  bg.addColorStop(0.62, '#144d2a');
  bg.addColorStop(1, '#196938');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);

  // Subtle turf pitch stripes
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(cw * 0.25, ch * 0.55, cw * 0.25, ch * 0.45);
  ctx.fillRect(cw * 0.75, ch * 0.55, cw * 0.25, ch * 0.45);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, ch * 0.62);
  ctx.lineTo(cw, ch * 0.62);
  ctx.stroke();

  const skillCycle =
    params.animMode === 'roulette'
      ? 0.46 - ((params.timeSec * 0.72) % 0.46)
      : params.animMode === 'rainbow'
      ? 0.52 - ((params.timeSec * 0.68) % 0.52)
      : 0;

  const mockEntity: ApexPlayerEntity = {
    id: params.id,
    cardId: params.id,
    cardType: params.cardType,
    name: params.name,
    shortName: params.name,
    number: params.number,
    pos: params.pos,
    ovr: params.ovr,
    pac: 90,
    sho: 90,
    pas: 90,
    dri: 90,
    def: 80,
    phy: 85,
    baseX: 50,
    baseY: 50,
    isGk: Boolean(params.isGk || params.pos === 'GK'),
    pixelProfile: params.pixelProfile,
    side: 'p1',
    x: 50,
    y: 50,
    vx: params.animMode === 'idle' ? 0 : 12,
    vy: 0,
    facingAngle: 0,
    animState: params.animMode,
    animFrame: params.timeSec * (params.animMode === 'roulette' || params.animMode === 'rainbow' ? 7 : params.animMode === 'run' ? 8 : 2),
    animTimer: skillCycle,
    stamina: 100,
    yellowCards: 0,
    sentOff: false,
    skillCooldown: 0,
    tackleCooldown: 0,
    invulnTimer: params.animMode === 'roulette' || params.animMode === 'rainbow' ? 0.5 : 0,
    chargePower: 0,
  };

  drawRetroPlayerSprite(
    ctx,
    { x: cw * 0.5, y: ch * 0.86 },
    mockEntity,
    Math.min(cw, ch) * 0.29,
    false
  );
}

export function drawRefereeCardIndicator(
  ctx: CanvasRenderingContext2D,
  refPt: IsoScreenPoint,
  card: 'yellow' | 'red',
  zoom: number
) {
  const h = Math.max(20, zoom * 2.35);
  ctx.save();
  ctx.fillStyle = card === 'red' ? '#ef4444' : '#facc15';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.fillRect(refPt.x + 6, refPt.y - h * 1.18, 8, 11);
  ctx.strokeRect(refPt.x + 6, refPt.y - h * 1.18, 8, 11);
  ctx.restore();
}

export function drawIsoBall(
  ctx: CanvasRenderingContext2D,
  state: ApexMatchState,
  proj: PitchProjection,
  timeSec: number = 0
) {
  const ballZ = Math.max(0, Number.isFinite(state.ball.z) ? state.ball.z : 0);
  const groundPt = worldToIso(state.ball.x, state.ball.y, 0, proj);
  const airPt = worldToIso(state.ball.x, state.ball.y, ballZ, proj);
  const baseRadius = Math.max(3.3, proj.zoom * 0.35);
  const aerialScale = Math.max(0.5, 1 + Math.min(0.45, ballZ * 0.095));
  const radius = Math.max(2.5, baseRadius * aerialScale);

  const ballSpd = Math.hypot(state.ball.vx, state.ball.vy);
  const kickKind = state.ball.kickKind;
  const kickTimer = state.ball.kickTimer ?? 0;
  const isLoftedAir = !state.ball.ownerId && ballZ > 0.65;
  const isLoftedPass =
    isLoftedAir && (kickKind === 'pass' || kickKind === 'through' || kickKind === 'clear');

  // Ground shadow shrinks & softens smoothly with height z
  const shadowScale = Math.max(0.34, 1 - ballZ * 0.085);
  const shadowAlpha = Math.max(0.16, 0.44 - ballZ * 0.05);
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(
    groundPt.x,
    groundPt.y + 1,
    baseRadius * 1.1 * shadowScale,
    baseRadius * 0.56 * shadowScale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // FC Mobile Airborne Drop-Zone Ring, Predicted Header Spot & Vertical Altitude Guide
  if (isLoftedAir) {
    ctx.save();
    const activeP1 = state.players[state.p1ActiveIdx];
    const headerWindowReady =
      ballZ <= 5.2 &&
      activeP1 &&
      !activeP1.sentOff &&
      Math.hypot(activeP1.x - state.ball.x, activeP1.y - state.ball.y) < 8.5;
    const ringColor = headerWindowReady
      ? 'rgba(250, 204, 21, 0.9)'
      : kickKind === 'through'
      ? 'rgba(250, 204, 21, 0.62)'
      : kickKind === 'finesse'
      ? 'rgba(74, 222, 128, 0.62)'
      : kickKind === 'clear'
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(56, 189, 248, 0.68)';
    const pulse = 1 + Math.sin(timeSec * 12) * 0.12;
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = headerWindowReady ? 1.9 : 1.3;
    ctx.setLineDash(headerWindowReady ? [4, 2] : [3, 2.5]);
    ctx.beginPath();
    ctx.ellipse(
      groundPt.x,
      groundPt.y + 1,
      Math.max(1, baseRadius * 1.85 * pulse),
      Math.max(0.6, baseRadius * 0.94 * pulse),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.setLineDash([]);

    if (headerWindowReady) {
      ctx.font = `900 ${Math.max(9, Math.round(proj.zoom * 0.65))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(groundPt.x - 28, groundPt.y + 8, 56, 13, 4);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillText('ĐÁNH ĐẦU!', groundPt.x, groundPt.y + 17.5);
    }

    // Vertical altitude tether line connecting ground shadow to airborne ball
    ctx.strokeStyle =
      kickKind === 'through'
        ? 'rgba(250, 204, 21, 0.25)'
        : kickKind === 'finesse'
        ? 'rgba(74, 222, 128, 0.24)'
        : 'rgba(186, 230, 253, 0.25)';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(groundPt.x, groundPt.y);
    ctx.lineTo(airPt.x, airPt.y);
    ctx.stroke();
    ctx.restore();
  }

  // Color-coded animated comet trail, Magnus Curved Shot Arc & sparkle beads!
  if (!state.ball.ownerId && (ballSpd > 8 || isLoftedAir)) {
    const isThrough = kickKind === 'through' && kickTimer > 0;
    const isPass = kickKind === 'pass' && kickTimer > 0;
    const isPowerShot = kickKind === 'powershot' && kickTimer > 0;
    const isFinesse = kickKind === 'finesse' && kickTimer > 0;
    const trailSteps = isPowerShot
      ? 6
      : isFinesse
      ? 7
      : isLoftedPass || isThrough
      ? 6
      : isPass
      ? 4
      : ballSpd > 25
      ? 4
      : 0;

    if (trailSteps > 0) {
      const tailFactor = isPowerShot
        ? 0.13
        : isFinesse
        ? 0.165
        : isLoftedPass
        ? 0.14
        : isThrough
        ? 0.11
        : isPass
        ? 0.085
        : 0.07;
      const tailPt = worldToIso(
        state.ball.x - state.ball.vx * tailFactor,
        state.ball.y - state.ball.vy * tailFactor,
        Math.max(0, state.ball.z - state.ball.vz * (tailFactor * 0.78)),
        proj
      );

      const headX = airPt.x;
      const headY = airPt.y - radius * 0.4;
      const curveSign = state.ball.finesseCurveSign ?? (state.ball.y < 50 ? 1 : -1);
      // Perpendicular curve offset so Finesse/Curve shots visibly whip in an arc!
      const tdx = headX - tailPt.x;
      const tdy = headY - tailPt.y;
      const tLen = Math.max(1, Math.hypot(tdx, tdy));
      const perpX = -tdy / tLen;
      const perpY = tdx / tLen;
      const curveBow = isFinesse ? -curveSign * Math.max(10, proj.zoom * 1.55) : 0;
      const ctrlX = (tailPt.x + headX) * 0.5 + perpX * curveBow;
      const ctrlY = (tailPt.y + headY) * 0.5 + perpY * curveBow;

      ctx.save();
      const grad = ctx.createLinearGradient(tailPt.x, tailPt.y, headX, headY);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      if (isPowerShot) {
        grad.addColorStop(0.45, 'rgba(249, 115, 22, 0.72)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.95)');
      } else if (isFinesse) {
        grad.addColorStop(0.3, 'rgba(34, 211, 238, 0.52)');
        grad.addColorStop(0.7, 'rgba(74, 222, 128, 0.82)');
        grad.addColorStop(1, 'rgba(187, 247, 208, 0.96)');
      } else if (isThrough) {
        grad.addColorStop(0.45, 'rgba(74, 222, 128, 0.52)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0.92)');
      } else if (isLoftedPass || isPass) {
        grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.48)');
        grad.addColorStop(1, 'rgba(224, 242, 254, 0.94)');
      } else {
        grad.addColorStop(
          1,
          ballSpd > 42 ? 'rgba(250, 204, 21, 0.78)' : 'rgba(255, 255, 255, 0.58)'
        );
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth =
        baseRadius *
        (isPowerShot ? 1.75 : isFinesse ? 1.65 : isLoftedPass ? 1.55 : isThrough ? 1.5 : 1.25);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailPt.x, tailPt.y);
      if (isFinesse) {
        ctx.quadraticCurveTo(ctrlX, ctrlY, headX, headY);
      } else {
        ctx.lineTo(headX, headY);
      }
      ctx.stroke();

      // Animated motion beads trailing behind curved/lofted/power trajectories
      for (let i = 1; i <= trailSteps; i++) {
        const u = 1 - i / (trailSteps + 1); // 0 = tailPt, 1 = head
        let bxBead: number;
        let byBead: number;
        if (isFinesse) {
          bxBead = (1 - u) * (1 - u) * tailPt.x + 2 * (1 - u) * u * ctrlX + u * u * headX;
          byBead = (1 - u) * (1 - u) * tailPt.y + 2 * (1 - u) * u * ctrlY + u * u * headY;
        } else {
          const f = (i / (trailSteps + 1)) * tailFactor;
          const beadPt = worldToIso(
            state.ball.x - state.ball.vx * f,
            state.ball.y - state.ball.vy * f,
            Math.max(0, state.ball.z - state.ball.vz * (f * 0.78)),
            proj
          );
          bxBead = beadPt.x;
          byBead = beadPt.y - radius * 0.35;
        }
        const alpha = (1 - i / (trailSteps + 1)) * (isFinesse || isLoftedPass ? 0.88 : 0.75);
        ctx.fillStyle = isPowerShot
          ? `rgba(251, 146, 60, ${alpha.toFixed(2)})`
          : isFinesse
          ? `rgba(74, 222, 128, ${alpha.toFixed(2)})`
          : isThrough
          ? `rgba(250, 204, 21, ${alpha.toFixed(2)})`
          : isLoftedPass || isPass
          ? `rgba(125, 211, 252, ${alpha.toFixed(2)})`
          : `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(bxBead, byBead, Math.max(0.5, baseRadius * (0.48 - i * 0.05)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Spinning Multi-Panel Football with strictly 90° perpendicular seams & orthogonal patches
  const bx = airPt.x;
  const by = airPt.y - radius * 0.4;
  const extraSpin = !state.ball.ownerId && kickKind === 'finesse' ? state.ball.spinRate ?? 18 : 0;
  const spinDir =
    extraSpin > 0 && state.ball.finesseCurveSign
      ? state.ball.finesseCurveSign
      : state.ball.vx >= 0
      ? 1
      : -1;
  const spinAng =
    state.ball.ownerId || ballSpd > 0.5
      ? timeSec * (3.5 + ballSpd * 0.55 + extraSpin) * spinDir
      : 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();

  // Subtle spherical shading
  const ballShade = ctx.createRadialGradient(
    bx - radius * 0.28,
    by - radius * 0.3,
    radius * 0.15,
    bx,
    by,
    radius
  );
  ballShade.addColorStop(0, '#ffffff');
  ballShade.addColorStop(0.75, '#e2e8f0');
  ballShade.addColorStop(1, '#94a3b8');
  ctx.fillStyle = ballShade;
  ctx.fillRect(bx - radius, by - radius, radius * 2, radius * 2);

  // Rotate around center & draw exact 90° perpendicular cross seams + orthogonal square blocks
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(spinAng);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(1.05, radius * 0.21);
  ctx.lineCap = 'butt';
  ctx.beginPath();
  // Horizontal seam
  ctx.moveTo(-radius * 1.1, 0);
  ctx.lineTo(radius * 1.1, 0);
  // Vertical seam strictly 90 degrees perpendicular
  ctx.moveTo(0, -radius * 1.1);
  ctx.lineTo(0, radius * 1.1);
  ctx.stroke();

  // Right-angled orthogonal dark center square & 4 perpendicular edge ticks
  ctx.fillStyle = '#0f172a';
  const cSq = radius * 0.36;
  ctx.fillRect(-cSq * 0.5, -cSq * 0.5, cSq, cSq);

  const eSq = radius * 0.32;
  ctx.fillRect(-eSq * 0.5, -radius * 1.02, eSq, eSq * 0.72);
  ctx.fillRect(-eSq * 0.5, radius * 1.02 - eSq * 0.72, eSq, eSq * 0.72);
  ctx.fillRect(-radius * 1.02, -eSq * 0.5, eSq * 0.72, eSq);
  ctx.fillRect(radius * 1.02 - eSq * 0.72, -eSq * 0.5, eSq * 0.72, eSq);
  ctx.restore();

  // Glossy specular shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
  ctx.beginPath();
  ctx.arc(bx - radius * 0.3, by - radius * 0.32, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = isLoftedPass ? 'rgba(56, 189, 248, 0.9)' : '#0f172a';
  ctx.lineWidth = isLoftedPass ? 1.55 : 1.35;
  ctx.beginPath();
  ctx.arc(bx, by, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Magnus spinning air-swirl arcs orbiting the ball on Curve / Finesse shots!
  if (!state.ball.ownerId && kickKind === 'finesse' && kickTimer > 0.08) {
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)';
    ctx.lineWidth = Math.max(1.5, radius * 0.24);
    ctx.beginPath();
    ctx.arc(bx, by, radius * 1.62, spinAng, spinAng + Math.PI * 1.05);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.82)';
    ctx.lineWidth = Math.max(1.25, radius * 0.2);
    ctx.beginPath();
    ctx.arc(bx, by, radius * 1.98, spinAng + Math.PI, spinAng + Math.PI * 1.95);
    ctx.stroke();
    ctx.restore();
  }

  // Power-shot sonic ring shockwave in flight!
  if (!state.ball.ownerId && kickKind === 'powershot' && kickTimer > 0.35) {
    ctx.save();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(bx, by, radius * 1.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draws the FC Mobile Minimap Radar showing all 22 players, active highlight, and ball.
 */
function drawFcMobileRadar(
  ctx: CanvasRenderingContext2D,
  state: ApexMatchState,
  cw: number,
  ch: number,
  isMobileControls: boolean
) {
  const isCompactTopRight = ch < 300 || (isMobileControls && cw < 540);
  const rw = isCompactTopRight ? (ch < 210 ? 70 : ch < 260 ? 86 : 104) : 148;
  const rh = isCompactTopRight ? (ch < 210 ? 34 : ch < 260 ? 42 : 50) : 72;
  const rx = isCompactTopRight ? cw - rw - 6 : (cw - rw) * 0.5;
  const ry = isCompactTopRight ? (ch < 210 ? 28 : ch < 260 ? 34 : 42) : ch - rh - 10;

  ctx.save();
  // Radar dark-glass backdrop
  ctx.fillStyle = 'rgba(6, 17, 12, 0.72)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 8);
  ctx.fill();
  ctx.stroke();

  // Radar pitch outline & lines
  const pad = 5;
  const px = rx + pad;
  const py = ry + pad;
  const pw = rw - pad * 2;
  const ph = rh - pad * 2;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(px, py, pw, ph);
  // Halfway line
  ctx.beginPath();
  ctx.moveTo(px + pw * 0.5, py);
  ctx.lineTo(px + pw * 0.5, py + ph);
  ctx.stroke();
  // Center circle
  ctx.beginPath();
  ctx.arc(px + pw * 0.5, py + ph * 0.5, Math.max(1.2, ph * 0.16), 0, Math.PI * 2);
  ctx.stroke();
  // Boxes
  ctx.strokeRect(px, py + ph * 0.22, pw * 0.16, ph * 0.56);
  ctx.strokeRect(px + pw * 0.84, py + ph * 0.22, pw * 0.16, ph * 0.56);

  const activeP1 = state.players[state.p1ActiveIdx];
  for (const p of state.players) {
    if (p.sentOff) continue;
    const dotX = px + (p.x / 100) * pw;
    const dotY = py + (p.y / 100) * ph;
    const isAct = activeP1?.id === p.id;
    ctx.fillStyle =
      p.side === 'p1'
        ? p.isGk
          ? '#fb923c'
          : '#38bdf8'
        : p.isGk
        ? '#34d399'
        : '#f87171';
    ctx.beginPath();
    ctx.arc(dotX, dotY, isAct ? 3.2 : 2.1, 0, Math.PI * 2);
    ctx.fill();
    if (isAct) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  }

  // Glowing white ball dot
  const bx = px + (state.ball.x / 100) * pw;
  const by = py + (state.ball.y / 100) * ph;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(bx, by, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function renderFullApexFrame(
  ctx: CanvasRenderingContext2D,
  state: ApexMatchState,
  cw: number,
  ch: number,
  timeSec: number,
  camOverride?: { x: number; y: number },
  aimWorld?: { wx: number; wy: number },
  isMobileControls: boolean = false
) {
  // Dynamic zoomed FC Mobile Tele-Broadcast pitch view for wide 16:9 viewport & larger camera pan
  const zoom = Math.max(6.2, Math.min(14.5, cw / 54));
  const proj: PitchProjection = {
    cw,
    ch,
    camX: camOverride ? camOverride.x : state.camera.x,
    camY: camOverride ? camOverride.y : state.camera.y,
    zoom,
  };

  drawIsoPitch(ctx, proj, timeSec);
  drawSetPieceOverlays(ctx, state, proj, timeSec);
  drawPassAndThroughArrows(ctx, state, proj, aimWorld?.wx ?? 0, aimWorld?.wy ?? 0);
  drawKickFlightEffects(ctx, state, proj, timeSec);

  // Depth-sort all players + referee + ball + goals by screen Y
  type DrawItem = { sortY: number; draw: () => void };
  const items: DrawItem[] = [];

  const goalRippleLeft =
    state.goalCelebration?.active && state.ball.x < 50 ? timeSec : 0;
  const goalRippleRight =
    state.goalCelebration?.active && state.ball.x >= 50 ? timeSec : 0;

  const leftGoalPt = worldToIso(1.2, 50, 0, proj);
  items.push({
    sortY: leftGoalPt.y,
    draw: () => drawGoal3D(ctx, 'left', proj, goalRippleLeft),
  });

  const rightGoalPt = worldToIso(98.8, 50, 0, proj);
  items.push({
    sortY: rightGoalPt.y,
    draw: () => drawGoal3D(ctx, 'right', proj, goalRippleRight),
  });

  const ownerId = state.ball.ownerId;
  const activeP1 = state.players[state.p1ActiveIdx];
  const supportP1Local =
    state.p1SupportTimer > 0
      ? findClosestPlayerIdx(state, 'p1', state.ball.x, state.ball.y, state.p1ActiveIdx, false)
      : -1;
  const supportP1Id = supportP1Local >= 0 ? state.players[supportP1Local]?.id : undefined;

  for (const p of state.players) {
    if (p.sentOff) continue;
    const pt = worldToIso(p.x, p.y, 0, proj);
    const isUserAct = activeP1?.id === p.id;
    const hasBall = ownerId === p.id;
    const isSupporter = supportP1Id === p.id;
    items.push({
      sortY: pt.y,
      draw: () => {
        drawActivePlayerCursor(ctx, pt, p, isUserAct, hasBall, zoom, isSupporter);
        drawRetroPlayerSprite(ctx, pt, p, zoom, false);
      },
    });
  }

  // Referee entity
  const refPt = worldToIso(state.referee.x, state.referee.y, 0, proj);
  const refAsPlayer: ApexPlayerEntity = {
    id: 'ref',
    name: 'Trọng Tài',
    shortName: 'REF',
    number: 0,
    pos: 'REF',
    ovr: 90,
    pac: 85,
    sho: 50,
    pas: 50,
    dri: 50,
    def: 50,
    phy: 80,
    baseX: 50,
    baseY: 50,
    isGk: false,
    side: 'p1',
    x: state.referee.x,
    y: state.referee.y,
    vx: 0,
    vy: 0,
    facingAngle: state.referee.facingAngle,
    animState: 'run',
    animFrame: state.referee.animFrame,
    animTimer: 0,
    stamina: 100,
    yellowCards: 0,
    sentOff: false,
    skillCooldown: 0,
    tackleCooldown: 0,
    invulnTimer: 0,
    chargePower: 0,
  };
  items.push({
    sortY: refPt.y,
    draw: () => {
      drawRetroPlayerSprite(ctx, refPt, refAsPlayer, zoom, true);
      if (state.referee.cardShown !== 'none') {
        drawRefereeCardIndicator(ctx, refPt, state.referee.cardShown, zoom);
      }
    },
  });

  // Ball
  const ballGround = worldToIso(state.ball.x, state.ball.y, 0, proj);
  items.push({
    sortY: ballGround.y + 0.5,
    draw: () => drawIsoBall(ctx, state, proj, timeSec),
  });

  items.sort((a, b) => a.sortY - b.sortY);
  for (const item of items) {
    item.draw();
  }

  // Stadium Floodlights & Night-Match Atmospheric Glow
  drawStadiumFloodlights(ctx, proj, timeSec);

  // On-pitch FC Mobile floating callout (Skill success / intercepted / overpowered / weak)
  if (state.pitchCallout && state.pitchCallout.timer > 0) {
    const co = state.pitchCallout;
    const rise = Math.max(0, 1.2 - co.timer) * 16;
    const alpha = Math.min(1, co.timer * 2.2);
    const pt = worldToIso(co.x, co.y, 4.2, proj);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${Math.max(10, Math.round(proj.zoom * 0.82))}px sans-serif`;
    const tw = Math.max(66, ctx.measureText(co.text).width + 16);
    const px = pt.x - tw * 0.5;
    const py = pt.y - 26 - rise;
    ctx.fillStyle =
      co.tone === 'green'
        ? 'rgba(6, 78, 59, 0.92)'
        : co.tone === 'red'
        ? 'rgba(127, 29, 29, 0.92)'
        : co.tone === 'gold'
        ? 'rgba(113, 63, 18, 0.92)'
        : 'rgba(12, 74, 110, 0.92)';
    ctx.strokeStyle =
      co.tone === 'green'
        ? '#4ade80'
        : co.tone === 'red'
        ? '#fb7185'
        : co.tone === 'gold'
        ? '#facc15'
        : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px, py, tw, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(co.text, pt.x, py + 9.5);
    ctx.restore();
  }

  // FC Mobile Minimap Radar overlay
  drawFcMobileRadar(ctx, state, cw, ch, isMobileControls);
}
