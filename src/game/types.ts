export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type CakeStyleId =
  | 'chiffon'
  | 'millefeuille'
  | 'macaron'
  | 'opera'
  | 'montblanc'
  | 'forest';

export interface CakeStyle {
  id: CakeStyleId;
  nameZh: string;
  nameFr: string;
  descriptionZh: string;
  unlockFloor: number;
  height: number;
  spongeColor: string;
  spongeShade: string;
  creamColor: string;
  fillingColor: string;
  accentColor: string;
  crumbColors: string[];
}

export interface StackedCake {
  id: number;
  x: number; // center x in world coordinates
  y: number; // top y in world coordinates
  width: number;
  height: number;
  style: CakeStyle;
  isPerfect: boolean;
  squash: number; // 0..1 decaying squash-and-stretch animation
  perfectGlow: number; // 0..1 decaying golden aura
  leftSliced: boolean;
  rightSliced: boolean;
}

export interface PendulumCake {
  phase: 'SWINGING' | 'DROPPING';
  swingTime: number;
  angle: number;
  maxAngle: number;
  angularSpeed: number;
  ropeLength: number;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  style: CakeStyle;
  tilt: number; // visual tilt that eases to 0 during fall
}

export interface FallingScrap {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  rotVel: number;
  style: CakeStyle;
  leftSliced: boolean;
  rightSliced: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'circle' | 'star' | 'crumb';
  rotation: number;
  rotVel: number;
}

export interface FloatingCallout {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface HudSnapshot {
  score: number;
  floor: number;
  combo: number;
  maxCombo: number;
  currentCake: CakeStyle;
  unlockedInRun: CakeStyleId[];
  newUnlockBanner: CakeStyle | null;
}

export interface GameOverSummary {
  score: number;
  floor: number;
  maxCombo: number;
  isNewRecord: boolean;
  bestScore: number;
  bestFloor: number;
  stackedPreview: Array<{
    widthRatio: number;
    style: CakeStyle;
    isPerfect: boolean;
  }>;
  newlyUnlocked: CakeStyle[];
}

export interface PersistentData {
  bestScore: number;
  bestFloor: number;
  unlockedCakes: CakeStyleId[];
  isMuted: boolean;
}
