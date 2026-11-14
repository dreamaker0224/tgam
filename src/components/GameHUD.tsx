import { Pause, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export function GameHUD({ hud, isMuted, onToggleMute, onPause }: GameHUDProps) {
  return (
    <>
      {/* Low-occlusion perimeter HUD (pointer-events: none wrapper, no backdrop-filter) */}
      <header className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-start justify-between px-4 pt-3 select-none">
        {/* Left: Clean unboxed metrics with tabular-nums */}
        <div className="flex flex-col gap-0.5 text-[#3D2720]">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-3xl font-bold leading-none tabular-nums drop-shadow-[0_1px_0_rgba(255,253,249,0.9)]">
              {hud.score.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-[#6D4C3D] tabular-nums">
              {hud.floor} 層
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#6D4C3D]">
            <span>{hud.currentCake.nameZh}</span>
            {hud.combo >= 2 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#C26A0B] tabular-nums">
                  連擊 ×{hud.combo}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: >= 44px touch controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? '開啟音效' : '靜音'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FFFDF9]/90 border border-[#3D2720]/15 text-[#3D2720] shadow-xs hover:bg-[#FFFDF9] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label="暫停遊戲"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#FFFDF9]/90 border border-[#3D2720]/15 text-[#3D2720] shadow-xs hover:bg-[#FFFDF9] active:scale-95 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Non-intrusive New Cake Tier Unlock Notification */}
      {hud.newUnlockBanner && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-16 left-1/2 z-20 animate-toast-in px-4 py-2 rounded-xl bg-[#FFFDF9] border-2 border-[#E59A2B] shadow-md text-center whitespace-nowrap"
        >
          <div className="text-[11px] font-bold text-[#C26A0B] tracking-wide">
            新甜點解鎖
          </div>
          <div className="text-sm font-bold text-[#3D2720]">
            {hud.newUnlockBanner.nameZh}
          </div>
        </div>
      )}
    </>
  );
}
