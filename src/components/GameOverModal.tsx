import { BookOpen } from 'lucide-react';
import { GameOverSummary } from '../game/types';

interface GameOverModalProps {
  summary: GameOverSummary;
  onPlayAgain: () => void;
  onOpenGallery: () => void;
  onBackToTitle: () => void;
}

export function GameOverModal({
  summary,
  onPlayAgain,
  onOpenGallery,
  onBackToTitle,
}: GameOverModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
      className="absolute inset-0 z-30 flex items-center justify-center p-5 bg-[#241714]/60"
    >
      <div className="w-full max-w-[330px] rounded-2xl bg-[#FFFDF9] border-2 border-[#3D2720] shadow-xl p-5 animate-modal-in">
        {/* Header */}
        <div className="text-center">
          {summary.isNewRecord ? (
            <p className="text-xs font-bold text-[#C26A0B] tracking-wide">
              刷新個人最高紀錄
            </p>
          ) : (
            <p className="text-xs font-medium text-[#8A6B5A]">
              本局烘焙結算
            </p>
          )}
          <h2
            id="gameover-title"
            className="font-display text-2xl font-bold text-[#3D2720] mt-0.5"
          >
            {summary.floor >= 20
              ? '皇家法式蛋糕塔'
              : summary.floor >= 10
              ? '人氣甜點塔完成'
              : '美味開張小塔'}
          </h2>
        </div>

        {/* Miniature Visual Cake Tower Silhouette */}
        <div
          className="mt-4 py-3 px-4 rounded-xl bg-[#FDF6EA] border border-[#E8D5C4] flex flex-col items-center justify-end min-h-[116px]"
          aria-label="本局蛋糕塔縮圖"
        >
          <div className="flex flex-col-reverse items-center w-full gap-[2px]">
            {/* Mini stand plate */}
            <div className="w-28 h-1.5 rounded-full bg-[#3D2720]/20 mt-0.5" />
            {summary.stackedPreview.map((layer, idx) => (
              <div
                key={idx}
                className="h-[6px] rounded-[2px] border border-[#3D2720]/70 transition-none"
                style={{
                  width: `${Math.max(12, Math.round(layer.widthRatio * 108))}px`,
                  backgroundColor: layer.style.spongeColor,
                  boxShadow: layer.isPerfect
                    ? '0 0 0 1px rgba(229, 154, 43, 0.7)'
                    : undefined,
                }}
                title={layer.style.nameZh}
              />
            ))}
          </div>
          {summary.floor > summary.stackedPreview.length - 1 && (
            <span className="mt-1.5 text-[11px] text-[#8A6B5A] tabular-nums">
              展示頂部 {summary.stackedPreview.length} 層 · 共 {summary.floor} 層
            </span>
          )}
        </div>

        {/* 3-Column Tabular Stats (no pills, clean hairline dividers) */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-[#E8D5C4] text-center">
          <div className="px-1">
            <div className="text-[11px] font-medium text-[#8A6B5A]">總得分</div>
            <div className="text-xl font-bold text-[#3D2720] tabular-nums mt-0.5">
              {summary.score.toLocaleString()}
            </div>
          </div>
          <div className="px-1">
            <div className="text-[11px] font-medium text-[#8A6B5A]">堆疊高度</div>
            <div className="text-xl font-bold text-[#3D2720] tabular-nums mt-0.5">
              {summary.floor} 層
            </div>
          </div>
          <div className="px-1">
            <div className="text-[11px] font-medium text-[#8A6B5A]">最高連擊</div>
            <div className="text-xl font-bold text-[#C26A0B] tabular-nums mt-0.5">
              ×{summary.maxCombo}
            </div>
          </div>
        </div>

        {/* Best Record Comparison */}
        <div className="mt-3 pt-2.5 border-t border-[#E8D5C4] flex items-center justify-center gap-2 text-xs text-[#6D4C3D] tabular-nums">
          <span>歷史最佳 {summary.bestScore.toLocaleString()} 分</span>
          <span aria-hidden="true">·</span>
          <span>{summary.bestFloor} 層</span>
        </div>

        {/* Newly Unlocked Cake Notification */}
        {summary.newlyUnlocked.length > 0 && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-[#FEF6E6] border border-[#E59A2B]/50 text-center">
            <div className="text-[11px] font-bold text-[#C26A0B]">
              新解鎖甜點圖鑑
            </div>
            <div className="text-xs font-semibold text-[#3D2720] mt-0.5">
              {summary.newlyUnlocked.map((c) => c.nameZh).join('、')}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#D94E5A] hover:bg-[#C63D49] active:scale-[0.98] text-[#FFFDF9] font-bold text-base border-2 border-[#3D2720] transition-transform cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
          >
            再疊一次
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenGallery}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FBF2E3] hover:bg-[#F5E6D0] text-[#3D2720] font-semibold text-xs border border-[#D8C1AD] flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#3D2720]"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C26A0B]" />
              <span>甜點圖鑑</span>
            </button>
            <button
              type="button"
              onClick={onBackToTitle}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FBF2E3] hover:bg-[#F5E6D0] text-[#6D4C3D] hover:text-[#3D2720] font-semibold text-xs border border-[#D8C1AD] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#3D2720]"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
