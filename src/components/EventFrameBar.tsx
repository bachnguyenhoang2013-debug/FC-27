import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { soundService } from '../services/sound';

export interface EventChapterTabItem {
  id: string;
  label: string;
  iconUrl?: string;
  subTag?: string;
  subTagTone?: 'emerald' | 'yellow' | 'cyan';
  subTagIcon?: React.ReactNode;
}

interface EventChapterTabsProps {
  tabs: EventChapterTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * FC Mobile Event chapter tab bar matching the rectangular matte-charcoal style
 * with crisp yellow rectangular outline on the active tab and optional dangling
 * countdown / status pointer tags beneath tabs.
 */
export const EventChapterTabs: React.FC<EventChapterTabsProps> = ({
  tabs,
  activeId,
  onSelect,
  className = '',
}) => {
  const hasAnySubTag = tabs.some((t) => Boolean(t.subTag));

  return (
    <nav
      className={`relative z-20 px-4 sm:px-6 pt-1 ${
        hasAnySubTag ? 'pb-7' : 'pb-3'
      } flex flex-wrap items-start gap-2 sm:gap-2.5 shrink-0 select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const toneText =
          tab.subTagTone === 'yellow'
            ? 'text-yellow-300'
            : tab.subTagTone === 'cyan'
            ? 'text-cyan-300'
            : 'text-[#4ade80]';

        return (
          <div key={tab.id} className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                soundService.playTabSwitch();
                onSelect(tab.id);
              }}
              className={`relative min-w-[120px] sm:min-w-[162px] h-10 sm:h-11 px-4 sm:px-5 rounded-none font-cruyff text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.45)] whitespace-nowrap ${
                isActive
                  ? 'bg-[#1d2023]/95 border-[1.5px] border-[#facc15] text-[#facc15] font-black shadow-[0_0_16px_rgba(250,204,21,0.28)]'
                  : 'bg-[#2a2d30]/95 hover:bg-[#363a3e] border border-white/10 text-[#b6bcc2] hover:text-white font-bold'
              }`}
            >
              {tab.iconUrl && (
                <img
                  src={tab.iconUrl}
                  alt=""
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0 pointer-events-none"
                />
              )}
              <span>{tab.label}</span>
            </button>

            {tab.subTag && (
              <div className="absolute -bottom-[22px] left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-b-[5px] border-b-[#38bdf8]" />
                <div
                  className={`px-2.5 py-[2px] bg-[#222528]/95 border border-white/15 shadow-md text-[10px] font-mono font-bold whitespace-nowrap flex items-center gap-1 tabular-nums ${toneText}`}
                >
                  {tab.subTagIcon}
                  <span>{tab.subTag}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

interface EventHeaderBarProps {
  title: string;
  subtitle?: string;
  iconUrl?: string;
  onBack: () => void;
  onGoHome?: () => void;
  rightContent?: React.ReactNode;
}

/**
 * Clean translucent FC Mobile Event top bar with circular dark `<` back button,
 * bold uppercase white event title, and floating right currencies + home action.
 */
export const EventHeaderBar: React.FC<EventHeaderBarProps> = ({
  title,
  subtitle,
  iconUrl,
  onBack,
  onGoHome,
  rightContent,
}) => {
  return (
    <header className="relative z-20 px-4 sm:px-6 pt-3 pb-2 bg-gradient-to-b from-black/75 via-black/40 to-transparent flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            onBack();
          }}
          aria-label="Quay lại"
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-lg backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.6]" />
        </button>

        {iconUrl && (
          <img
            src={iconUrl}
            alt=""
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
          />
        )}

        <div className="min-w-0">
          <h1 className="font-cruyff font-black text-xl sm:text-2xl md:text-[26px] text-white uppercase tracking-wide truncate leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] font-bold text-slate-200/85 truncate mt-0.5 drop-shadow">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap justify-end">
        {rightContent}

        {onGoHome && (
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onGoHome();
            }}
            title="Về Màn Hình Chính"
            className="w-9 h-9 rounded-full bg-black/45 hover:bg-black/75 border border-white/15 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <img
              src="/assets/aistudio/headerbar_HOME_46aea045.png"
              alt="Màn Hình Chính"
              referrerPolicy="no-referrer"
              className="w-4 h-4 object-contain filter invert opacity-95"
            />
          </button>
        )}
      </div>
    </header>
  );
};
