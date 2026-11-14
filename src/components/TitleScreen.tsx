import { BookOpen, Volume2, VolumeX } from 'lucide-react';
import titleArt from '../assets/images/title_patisserie_art_1794634998261.jpg';

interface TitleScreenProps {
  bestScore: number;
  bestFloor: number;
  unlockedCount: number;
  totalCakes: number;
  isMuted: boolean;
  onStart: () => void;
  onOpenGallery: () => void;
  onToggleMute: () => void;
}

export function TitleScreen({
  bestScore,
  bestFloor,
  unlockedCount,
  totalCakes,
  isMuted,
  onStart,
  onOpenGallery,
  onToggleMute,
}: TitleScreenProps) {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#FDF6EA]">
      {/* Illustrated Patisserie Key-Art Backdrop with CSS fallback */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FDF6EA] via-[#F5E3CE] to-[#3D2720]">
        <img
          src={titleArt}
          alt="法式甜點屋店面插畫"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center select-none"
        />
      </div>

      {/* Top bar: subtle mute button aligned cleanly */}
      <div className="relative z-10 flex items-center justify-end px-4 pt-3">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? '開啟音效' : '靜音'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#FFFDF9]/90 text-[#3D2720] border border-[#3D2720]/20 shadow-sm hover:bg-[#FFFDF9] active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Bespoke Inline SVG Title Lockup positioned over the calm cream top pediment */}
      <div className="relative z-10 flex flex-col items-center px-6 -mt-6 pointer-events-none select-none">
        <div className="w-full max-w-[310px] py-2 px-3 rounded-2xl bg-[#FFFDF9]/80 border border-[#3D2720]/10 shadow-sm text-center">
          <svg
            viewBox="0 0 280 84"
            className="w-full h-auto mx-auto"
            role="img"
            aria-label="La Petite Pâtisserie 法式蛋糕疊疊樂"
          >
            {/* Delicate French whisk / ribbon flourish */}
            <path
              d="M42 15 H108 M172 15 H238"
              stroke="#B57B56"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle cx="140" cy="15" r="4" fill="#D94E5A" />
            <circle cx="126" cy="15" r="2" fill="#E59A2B" />
            <circle cx="154" cy="15" r="2" fill="#E59A2B" />

            <text
              x="140"
              y="44"
              textAnchor="middle"
              fill="#3D2720"
              fontFamily="'Fraunces', Georgia, serif"
              fontSize="24"
              fontWeight="700"
              letterSpacing="0.5"
            >
              Cake Stack
            </text>
            <text
              x="140"
              y="70"
              textAnchor="middle"
              fill="#9E2B3D"
              fontFamily="'Noto Sans TC', sans-serif"
              fontSize="20"
              fontWeight="700"
              letterSpacing="2"
            >
              法式蛋糕疊疊樂
            </text>
          </svg>
        </div>
      </div>

      {/* Spacer letting the storefront & pedestal artwork breathe */}
      <div className="flex-1" />

      {/* Bottom Scrim & Primary Controls */}
      <div className="relative z-10 px-6 pb-7 pt-16 bg-gradient-to-t from-[#241714]/95 via-[#241714]/75 to-transparent flex flex-col items-center gap-3.5">
        {bestScore > 0 && (
          <div className="flex items-center gap-2.5 text-sm font-medium text-[#FCEBD5] tabular-nums">
            <span>最高紀錄 {bestScore.toLocaleString()} 分</span>
            <span aria-hidden="true" className="text-[#E59A2B]">·</span>
            <span>{bestFloor} 層</span>
          </div>
        )}

        <button
          type="button"
          onClick={onStart}
          className="w-full max-w-[290px] min-h-[52px] px-6 py-3 rounded-xl bg-[#D94E5A] hover:bg-[#C63D49] active:scale-[0.98] text-[#FFFDF9] font-bold text-lg tracking-wide shadow-lg border-2 border-[#3D2720] transition-transform cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFFDF9]"
        >
          開始疊蛋糕
        </button>

        <button
          type="button"
          onClick={onOpenGallery}
          className="min-h-[44px] px-5 py-2 rounded-lg bg-[#FFFDF9]/15 hover:bg-[#FFFDF9]/25 text-[#FFFDF9] text-sm font-medium border border-[#FFFDF9]/25 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FFFDF9]"
        >
          <BookOpen className="w-4 h-4 text-[#F5C469]" />
          <span>甜點圖鑑 ({unlockedCount}/{totalCakes})</span>
        </button>

        <p className="text-xs text-[#E8D5C4]/90 tracking-wide text-center">
          點擊螢幕或空白鍵投放 · P 暫停
        </p>
      </div>
    </div>
  );
}
