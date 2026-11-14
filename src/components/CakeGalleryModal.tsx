import { X } from 'lucide-react';
import { CAKE_STYLES } from '../game/cakeCatalog';
import { CakeStyleId } from '../game/types';
import { CakeSwatchSvg } from './CakeSwatchSvg';

interface CakeGalleryModalProps {
  unlockedCakes: CakeStyleId[];
  onClose: () => void;
}

export function CakeGalleryModal({ unlockedCakes, onClose }: CakeGalleryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#241714]/65"
    >
      <div className="w-full max-w-[350px] max-h-[86%] flex flex-col rounded-2xl bg-[#FFFDF9] border-2 border-[#3D2720] shadow-xl animate-modal-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8D5C4]">
          <div>
            <h2 id="gallery-title" className="font-display text-lg font-bold text-[#3D2720]">
              法式甜點圖鑑
            </h2>
            <p className="text-xs text-[#8A6B5A] tabular-nums">
              已解鎖 {unlockedCakes.length} / {CAKE_STYLES.length} 款手工蛋糕
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉圖鑑"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6D4C3D] hover:text-[#3D2720] hover:bg-[#FBF2E3] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-[#E8D5C4]">
          {CAKE_STYLES.map((cake) => {
            const isUnlocked = unlockedCakes.includes(cake.id);
            return (
              <div key={cake.id} className="py-3 flex items-center gap-3.5">
                <div className="shrink-0">
                  <CakeSwatchSvg style={cake} locked={!isUnlocked} className="w-16 h-11" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#3D2720] truncate">
                      {isUnlocked ? cake.nameZh : '未解鎖甜點'}
                    </h3>
                    <span className="text-[11px] font-medium text-[#8A6B5A] tabular-nums whitespace-nowrap shrink-0">
                      {cake.unlockFloor === 1 ? '初始款式' : `第 ${cake.unlockFloor} 層`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#B57B56] italic truncate">
                    {isUnlocked ? cake.nameFr : '達到指定樓層自動解鎖'}
                  </p>
                  {isUnlocked && (
                    <p className="text-xs text-[#6D4C3D] mt-0.5 leading-snug">
                      {cake.descriptionZh}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer action */}
        <div className="px-5 py-3 border-t border-[#E8D5C4] bg-[#FDF8F0]">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#3D2720] hover:bg-[#2C1B16] text-[#FFFDF9] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D94E5A]"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
