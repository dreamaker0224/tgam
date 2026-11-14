import { CakeStyle } from '../game/types';

interface CakeSwatchSvgProps {
  style: CakeStyle;
  locked?: boolean;
  className?: string;
}

export function CakeSwatchSvg({ style, locked = false, className = 'w-14 h-10' }: CakeSwatchSvgProps) {
  if (locked) {
    return (
      <svg viewBox="0 0 64 44" className={className} aria-hidden="true">
        <rect
          x="6"
          y="10"
          width="52"
          height="28"
          rx="5"
          fill="#E8D5C4"
          stroke="#B59B86"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text
          x="32"
          y="29"
          textAnchor="middle"
          fill="#8A705E"
          fontSize="14"
          fontWeight="700"
        >
          ?
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 44" className={className} aria-hidden="true">
      {/* Topping */}
      {style.id === 'chiffon' || style.id === 'millefeuille' ? (
        <>
          <ellipse cx="35" cy="9" rx="4.5" ry="2.2" transform="rotate(-20 35 9)" fill="#5B9A5D" stroke="#3D2720" strokeWidth="1.2" />
          <path d="M27 12 Q27 4 32 3 Q37 4 37 12 Z" fill={style.accentColor} stroke="#3D2720" strokeWidth="1.3" />
        </>
      ) : style.id === 'macaron' ? (
        <circle cx="32" cy="9" r="2.8" fill="#F2BD49" stroke="#3D2720" strokeWidth="1.2" />
      ) : style.id === 'opera' ? (
        <rect x="27" y="7" width="10" height="4" fill="#F5C44E" stroke="#3D2720" strokeWidth="1.2" />
      ) : (
        <circle cx="32" cy="9" r="3.5" fill={style.accentColor} stroke="#3D2720" strokeWidth="1.2" />
      )}

      {/* Cake body */}
      <rect
        x="6"
        y="12"
        width="52"
        height="26"
        rx="5"
        fill={style.spongeColor}
        stroke="#3D2720"
        strokeWidth="2"
      />
      {/* Middle filling */}
      <rect x="7" y="23" width="50" height="5" fill={style.fillingColor} />
      {/* Top cream / glaze */}
      <path
        d="M8 13 H56 V19 Q48 23 40 19 Q32 23 24 19 Q16 23 8 19 Z"
        fill={style.creamColor}
      />
      {/* Re-stroke outer border cleanly */}
      <rect
        x="6"
        y="12"
        width="52"
        height="26"
        rx="5"
        fill="none"
        stroke="#3D2720"
        strokeWidth="2"
      />
    </svg>
  );
}
