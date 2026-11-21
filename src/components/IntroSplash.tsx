import React, { useRef, useState } from 'react';
import { Volume2, VolumeX, SkipForward, Play } from 'lucide-react';
import { soundService } from '../services/sound';

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const startPlayback = () => {
    setHasStarted(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {
        // Fallback if muted required
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleVideoEnded = () => {
    soundService.playStartPrompt();
    onComplete();
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playClick();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none font-cruyff">
      <video
        ref={videoRef}
        src="/assets/aistudio/logo__1__699d1d8d.mp4"
        className="w-full h-full object-contain max-w-5xl"
        playsInline
        onEnded={handleVideoEnded}
        autoPlay
        muted={isMuted}
      />

      {/* Control overlay */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10 font-cruyff">
        <button
          onClick={toggleSound}
          className="p-3 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full border border-white/20 text-white transition-all hover:scale-105 active:scale-95"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-yellow-400" />}
        </button>

        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-5 py-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full border border-white/20 text-white font-cruyff font-bold text-sm tracking-wider uppercase hover:border-yellow-400 hover:text-yellow-400 transition-all active:scale-95"
        >
          <span>Bỏ qua</span>
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* If browser prevented autoplay with sound, show quick tap prompt */}
      {!hasStarted && (
        <div 
          onClick={startPlayback}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer group font-cruyff"
        >
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(234,179,8,0.5)]">
            <Play className="w-9 h-9 text-yellow-400 fill-yellow-400 ml-1" />
          </div>
          <span className="mt-4 font-cruyff font-bold text-lg tracking-widest text-white uppercase group-hover:text-yellow-400 transition-colors">
            Chạm để xem EA SPORTS Intro
          </span>
        </div>
      )}

      {/* FC Brand watermark bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-xs font-cruyff tracking-wider uppercase">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>EA SPORTS FC™ MOBILE 26</span>
      </div>
    </div>
  );
};
