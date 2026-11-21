import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { PlayerCard } from '../types/game';
import { resolvePixelPlayerProfile } from '../utils/pixelPlayerData';
import { drawPixelPlayerCardPreview } from '../engine/retroSprites';

interface PixelPlayerCardPanelProps {
  player: PlayerCard;
  compact?: boolean;
  hideSkillStats?: boolean;
  className?: string;
}

export const PixelPlayerCardPanel: React.FC<PixelPlayerCardPanelProps> = ({
  player,
  compact = false,
  hideSkillStats,
  className = '',
}) => {
  const suppressSkill = hideSkillStats ?? player.id.startsWith('shop_featured_');
  const [animMode, setAnimMode] = useState<'idle' | 'run' | 'roulette' | 'rainbow'>(
    suppressSkill ? 'idle' : 'roulette'
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const profile = useMemo(() => resolvePixelPlayerProfile(player), [player]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const startTs = performance.now();
    const cssW = compact ? 48 : 76;
    const cssH = compact ? 56 : 92;
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const drawFrame = (now: number) => {
      const timeSec = (now - startTs) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      drawPixelPlayerCardPreview(ctx, cssW, cssH, {
        id: player.id,
        name: player.name,
        pos: player.position,
        ovr: player.ovr,
        cardType: player.cardType,
        number: profile.jerseyNumber,
        isGk: player.position === 'GK',
        pixelProfile: {
          skinTone: profile.skinTone,
          hairTone: profile.hairTone,
          hairStyle: profile.hairStyle,
          bootTone: profile.bootTone,
          hasBeard: profile.hasBeard,
          hasHeadband: profile.hasHeadband,
          headbandColor: profile.headbandColor,
          heightScale: profile.heightScale,
          skillMoveName: profile.skillMoveName,
        },
        animMode,
        timeSec,
      });

      if (animMode !== 'idle') {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(performance.now());
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [player.id, player.name, player.position, player.ovr, player.cardType, profile, animMode]);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2.5 px-2.5 py-2 bg-slate-950/90 border-t border-white/15 ${className}`}
      >
        <canvas
          ref={canvasRef}
          width={48}
          height={56}
          className="w-12 h-14 border border-emerald-400/40 shrink-0"
        />
        <div className="flex-1 min-w-0 text-[10px] leading-snug">
          <div className="flex items-center justify-between gap-1">
            <span className="font-cruyff font-black text-emerald-300 uppercase truncate">
              {suppressSkill
                ? `Pixel #${profile.jerseyNumber}`
                : `Pixel #${profile.jerseyNumber} · ${profile.skillMoveName}`}
            </span>
            <span className="font-mono font-bold text-yellow-300 shrink-0">
              {profile.apexSpeedMs}m/s
            </span>
          </div>
          <div className="text-slate-300 truncate mt-0.5">
            {profile.hairLabel} · Giày {profile.bootLabel}
          </div>
          {!suppressSkill && (
            <div className="text-sky-300 font-mono font-bold mt-0.5">
              Tỉ lệ Roulette: {profile.rouletteBasePct}%
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-xl bg-gradient-to-br from-emerald-950/45 via-slate-950 to-slate-900 border border-emerald-400/35 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-cruyff font-black text-[11px] uppercase tracking-wider text-emerald-300">
            DỮ LIỆU PIXEL · ĐẤU ĐỈNH CAO
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 font-mono font-black text-[10px] text-emerald-200">
          ÁO #{profile.jerseyNumber}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <canvas
            ref={canvasRef}
            width={76}
            height={92}
            className="w-[76px] h-[92px] rounded-lg border border-emerald-400/50 shadow-inner"
          />
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[92px]">
            {(
              suppressSkill
                ? ([
                    { id: 'idle', label: 'Đứng' },
                    { id: 'run', label: 'Chạy' },
                  ] as const)
                : ([
                    { id: 'idle', label: 'Đứng' },
                    { id: 'run', label: 'Chạy' },
                    { id: 'roulette', label: 'Roulette' },
                    { id: 'rainbow', label: 'Rainbow' },
                  ] as const)
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAnimMode(m.id)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                  animMode === m.id
                    ? 'bg-emerald-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5 text-[11px]">
          {!suppressSkill && (
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
              <span className="text-slate-400">Skill sân cỏ</span>
              <span className="font-black text-yellow-300">{profile.skillMoveName}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
            <span className="text-slate-400">Kiểu tóc</span>
            <span className="font-bold text-white flex items-center gap-1.5 truncate">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                style={{ backgroundColor: profile.hairTone }}
              />
              <span className="truncate">{profile.hairLabel}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
            <span className="text-slate-400">Tông da & Giày</span>
            <span className="font-bold text-slate-200 flex items-center gap-1.5 truncate">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                style={{ backgroundColor: profile.skinTone }}
              />
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm border border-white/40 shrink-0"
                style={{ backgroundColor: profile.bootTone }}
              />
              <span className="truncate">{profile.bootLabel}</span>
            </span>
          </div>
          <div className={`grid ${suppressSkill ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5 pt-0.5`}>
            <div className="px-2 py-1 rounded bg-black/45 border border-white/10 text-center">
              <span className="block text-[9px] text-slate-400 uppercase">Tốc độ sân</span>
              <span className="font-mono font-black text-xs text-cyan-300">
                {profile.apexSpeedMs} m/s
              </span>
            </div>
            {!suppressSkill && (
              <div className="px-2 py-1 rounded bg-black/45 border border-white/10 text-center">
                <span className="block text-[9px] text-slate-400 uppercase">Tỉ lệ Roulette</span>
                <span className="font-mono font-black text-xs text-emerald-300">
                  {profile.rouletteBasePct}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
