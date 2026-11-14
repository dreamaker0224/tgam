interface PauseModalProps {
  score: number;
  floor: number;
  onResume: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

export function PauseModal({
  score,
  floor,
  onResume,
  onRestart,
  onBackToTitle,
}: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-[#241714]/55"
    >
      <div className="w-full max-w-[310px] rounded-2xl bg-[#FFFDF9] border-2 border-[#3D2720] shadow-xl p-6 animate-modal-in text-center">
        <p className="text-xs font-semibold text-[#8A6B5A] tracking-wide">
          目前進度
        </p>
        <h2
          id="pause-title"
          className="font-display text-2xl font-bold text-[#3D2720] mt-1"
        >
          甜點屋暫停中
        </h2>

        <div className="mt-3 flex items-center justify-center gap-3 text-sm text-[#6D4C3D] tabular-nums">
          <span>得分 {score.toLocaleString()}</span>
          <span aria-hidden="true">·</span>
          <span>高度 {floor} 層</span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#D94E5A] hover:bg-[#C63D49] active:scale-[0.98] text-[#FFFDF9] font-bold text-base border-2 border-[#3D2720] transition-transform cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
          >
            繼續遊戲
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#FBF2E3] hover:bg-[#F5E6D0] text-[#3D2720] font-semibold text-sm border border-[#D8C1AD] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#3D2720]"
          >
            重新開始
          </button>
          <button
            type="button"
            onClick={onBackToTitle}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl text-[#6D4C3D] hover:text-[#3D2720] hover:bg-[#FBF2E3]/60 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#3D2720]"
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
