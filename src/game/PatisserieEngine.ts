import { patisserieAudio } from './audio';
import {
  CAKE_STYLES,
  drawPatisserieCake,
  getCakeStyleForFloor,
  loadPersistentData,
  savePersistentData,
} from './cakeCatalog';
import {
  CakeStyle,
  CakeStyleId,
  FallingScrap,
  FloatingCallout,
  GameOverSummary,
  HudSnapshot,
  Particle,
  PendulumCake,
  StackedCake,
} from './types';

export const LOGICAL_WIDTH = 390;
const INITIAL_CAKE_WIDTH = 176;
const STAND_HEIGHT = 58;
const GRAVITY = 2200;
const INITIAL_DROP_VY = 200;

interface CutFlash {
  active: boolean;
  x: number;
  y: number;
  height: number;
  life: number;
  maxLife: number;
}

interface RingAura {
  active: boolean;
  x: number;
  y: number;
  width: number;
  life: number;
  maxLife: number;
  color: string;
}

interface MissedCake {
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
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onGameOver: (summary: GameOverSummary) => void;
}

export class PatisserieEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private logicalHeight = 693;
  private dpr = 1;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private running = false;
  private paused = false;

  // World & camera
  private cameraY = -600;
  private targetCameraY = -600;
  private pivotX = LOGICAL_WIDTH / 2;
  private targetPivotX = LOGICAL_WIDTH / 2;

  // Game state
  private stack: StackedCake[] = [];
  private pendulum: PendulumCake | null = null;
  private missedCake: MissedCake = {
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotVel: 0,
    style: CAKE_STYLES[0],
  };

  private score = 0;
  private floor = 0;
  private combo = 0;
  private maxCombo = 0;
  private unlockedInRun: Set<CakeStyleId> = new Set(['chiffon']);
  private newlyUnlockedThisRun: CakeStyle[] = [];
  private newUnlockBanner: CakeStyle | null = null;
  private bannerTimer = 0;

  // Juice & FX
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private claspOpen = 0; // 0..1 animation when releasing cake
  private endingTimer = -1;
  private ambientTime = 0;

  // Object pools
  private scraps: FallingScrap[] = [];
  private particles: Particle[] = [];
  private callouts: FloatingCallout[] = [];
  private cutFlashes: CutFlash[] = [];
  private ringAuras: RingAura[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.callbacks = callbacks;

    this.initPools();
    this.resize();
    this.resetWorld();
  }

  private initPools(): void {
    for (let i = 0; i < 16; i++) {
      this.scraps.push({
        active: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        rotVel: 0,
        style: CAKE_STYLES[0],
        leftSliced: false,
        rightSliced: false,
      });
    }
    for (let i = 0; i < 110; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#FFFDF8',
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        gravity: 400,
        shape: 'circle',
        rotation: 0,
        rotVel: 0,
      });
    }
    for (let i = 0; i < 10; i++) {
      this.callouts.push({
        active: false,
        x: 0,
        y: 0,
        vy: -55,
        text: '',
        color: '#E59A2B',
        life: 0,
        maxLife: 0.9,
        scale: 1,
      });
    }
    for (let i = 0; i < 6; i++) {
      this.cutFlashes.push({
        active: false,
        x: 0,
        y: 0,
        height: 36,
        life: 0,
        maxLife: 0.18,
      });
    }
    for (let i = 0; i < 6; i++) {
      this.ringAuras.push({
        active: false,
        x: 0,
        y: 0,
        width: 100,
        life: 0,
        maxLife: 0.45,
        color: '#E59A2B',
      });
    }
  }

  public resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    const width = Math.max(300, rect.width || LOGICAL_WIDTH);
    const height = Math.max(500, rect.height || 693);

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.logicalHeight = Math.round((LOGICAL_WIDTH * height) / width);

    this.canvas.width = Math.round(LOGICAL_WIDTH * this.dpr);
    this.canvas.height = Math.round(this.logicalHeight * this.dpr);

    this.updateTargetCamera(true);
    this.render();
  }

  private getInitialCameraY(): number {
    return -this.logicalHeight + 86;
  }

  private updateTargetCamera(snap = false): void {
    const topCake = this.stack[this.stack.length - 1];
    const topY = topCake ? topCake.y : -STAND_HEIGHT;
    const initialCam = this.getInitialCameraY();
    const desired = Math.min(initialCam, topY - this.logicalHeight * 0.62);
    this.targetCameraY = desired;
    if (snap) {
      this.cameraY = desired;
    }
  }

  public resetWorld(): void {
    const baseStyle = CAKE_STYLES[0];
    this.stack = [
      {
        id: 0,
        x: LOGICAL_WIDTH / 2,
        y: -STAND_HEIGHT - baseStyle.height,
        width: INITIAL_CAKE_WIDTH,
        height: baseStyle.height,
        style: baseStyle,
        isPerfect: false,
        squash: 0,
        perfectGlow: 0,
        leftSliced: false,
        rightSliced: false,
      },
    ];

    this.score = 0;
    this.floor = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.unlockedInRun = new Set(['chiffon']);
    this.newlyUnlockedThisRun = [];
    this.newUnlockBanner = null;
    this.bannerTimer = 0;

    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.claspOpen = 0;
    this.endingTimer = -1;
    this.missedCake.active = false;

    for (const s of this.scraps) s.active = false;
    for (const p of this.particles) p.active = false;
    for (const c of this.callouts) c.active = false;
    for (const f of this.cutFlashes) f.active = false;
    for (const r of this.ringAuras) r.active = false;

    this.pivotX = LOGICAL_WIDTH / 2;
    this.targetPivotX = LOGICAL_WIDTH / 2;
    this.updateTargetCamera(true);
    this.spawnNextPendulum(1);
    this.emitHud();
    this.render();
  }

  public startNewGame(): void {
    patisserieAudio.unlockAudio();
    this.resetWorld();
    this.paused = false;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.startLoop();
  }

  public startAmbientPreview(): void {
    // Renders the stationary starter cake & counter on background if needed
    this.resetWorld();
    this.running = false;
    this.stopLoop();
    this.render();
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (!paused && this.running) {
      this.lastTimestamp = performance.now();
      this.startLoop();
    }
  }

  public destroy(): void {
    this.running = false;
    this.stopLoop();
  }

  private startLoop(): void {
    if (this.rafId !== null) return;
    const tick = (now: number) => {
      if (!this.running) {
        this.rafId = null;
        return;
      }
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      if (!this.paused) {
        this.update(dt);
        this.render();
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // Edge-triggered drop action
  public triggerDrop(): void {
    if (!this.running || this.paused || this.endingTimer >= 0) return;
    if (!this.pendulum || this.pendulum.phase !== 'SWINGING') return;

    this.pendulum.phase = 'DROPPING';
    this.pendulum.vy = INITIAL_DROP_VY;
    this.claspOpen = 1;
    patisserieAudio.playRelease();
  }

  private spawnNextPendulum(nextFloor: number): void {
    const topCake = this.stack[this.stack.length - 1];
    const style = getCakeStyleForFloor(nextFloor);

    // Check if this style is newly unlocked in this run
    if (!this.unlockedInRun.has(style.id)) {
      this.unlockedInRun.add(style.id);
      this.newUnlockBanner = style;
      this.bannerTimer = 2.6;
      patisserieAudio.playUnlockCake();

      const saved = loadPersistentData();
      if (!saved.unlockedCakes.includes(style.id)) {
        saved.unlockedCakes.push(style.id);
        savePersistentData(saved);
        this.newlyUnlockedThisRun.push(style);
      }
    }

    // Smooth difficulty ramp
    const speedRamp = Math.min(1.9, nextFloor * 0.055);
    const angularSpeed = 1.72 + speedRamp;
    const maxAngle = Math.min(0.68, 0.54 + nextFloor * 0.004);
    const ropeLength = 174 + (nextFloor % 3 === 0 ? 10 : 0);

    // Subtle pivot bias toward tower center so severely offset stacks remain reachable
    this.targetPivotX = LOGICAL_WIDTH / 2 * 0.72 + topCake.x * 0.28;

    // Start pendulum from an alternating side near peak for crisp visual anticipation
    const startSide = nextFloor % 2 === 1 ? -1 : 1;
    const initialSwingTime = startSide > 0 ? Math.PI / (2 * angularSpeed) : (3 * Math.PI) / (2 * angularSpeed);

    const angle = maxAngle * Math.sin(initialSwingTime * angularSpeed);
    const pivotY = this.targetCameraY - 18;

    this.pendulum = {
      phase: 'SWINGING',
      swingTime: initialSwingTime,
      angle,
      maxAngle,
      angularSpeed,
      ropeLength,
      x: this.pivotX + Math.sin(angle) * ropeLength,
      y: pivotY + Math.cos(angle) * ropeLength,
      vy: 0,
      width: topCake.width,
      height: style.height,
      style,
      tilt: 0,
    };
  }

  private update(dt: number): void {
    this.ambientTime += dt;

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.newUnlockBanner = null;
        this.emitHud();
      }
    }

    // Hitstop freeze frame for heavy/perfect impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      // Still decay shake slightly
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 28);
      return;
    }

    // Smooth camera & pivot tracking
    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 6.5);
    this.pivotX += (this.targetPivotX - this.pivotX) * Math.min(1, dt * 4.5);
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 24);
    this.claspOpen = Math.max(0, this.claspOpen - dt * 3.5);

    // Decay squash & glow on stacked cakes
    for (let i = Math.max(0, this.stack.length - 8); i < this.stack.length; i++) {
      const layer = this.stack[i];
      if (layer.squash > 0) layer.squash = Math.max(0, layer.squash - dt * 6.5);
      if (layer.perfectGlow > 0) layer.perfectGlow = Math.max(0, layer.perfectGlow - dt * 2.2);
    }

    // Update pendulum
    if (this.pendulum) {
      const p = this.pendulum;
      const pivotY = this.cameraY - 18;

      if (p.phase === 'SWINGING') {
        p.swingTime += dt;
        p.angle = p.maxAngle * Math.sin(p.swingTime * p.angularSpeed);
        p.x = this.pivotX + Math.sin(p.angle) * p.ropeLength;
        p.y = pivotY + Math.cos(p.angle) * p.ropeLength;
        p.tilt = 0;
      } else {
        // DROPPING
        p.vy += GRAVITY * dt;
        p.y += p.vy * dt;
        p.tilt = 0;

        const topCake = this.stack[this.stack.length - 1];
        const landingTopY = topCake.y - p.height;

        if (p.y >= landingTopY) {
          p.y = landingTopY;
          this.resolveLanding(p, topCake);
        }
      }
    }

    // Update falling missed cake
    if (this.missedCake.active) {
      this.missedCake.vy += GRAVITY * dt;
      this.missedCake.x += this.missedCake.vx * dt;
      this.missedCake.y += this.missedCake.vy * dt;
      this.missedCake.rotation += this.missedCake.rotVel * dt;
      if (this.missedCake.y > this.cameraY + this.logicalHeight + 160) {
        this.missedCake.active = false;
      }
    }

    // Update ending timer
    if (this.endingTimer >= 0) {
      this.endingTimer -= dt;
      if (this.endingTimer <= 0) {
        this.endingTimer = -1;
        this.finishGame();
        return;
      }
    }

    // Update scraps
    const cullY = this.cameraY + this.logicalHeight + 140;
    for (const s of this.scraps) {
      if (!s.active) continue;
      s.vy += GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rotation += s.rotVel * dt;
      if (s.y > cullY) s.active = false;
    }

    // Update particles
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        pt.active = false;
        continue;
      }
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.rotation += pt.rotVel * dt;
      pt.alpha = 1 - pt.life / pt.maxLife;
    }

    // Update callouts
    for (const c of this.callouts) {
      if (!c.active) continue;
      c.life += dt;
      if (c.life >= c.maxLife) {
        c.active = false;
        continue;
      }
      c.y += c.vy * dt;
      c.vy *= Math.pow(0.25, dt);
    }

    // Update cut flashes
    for (const f of this.cutFlashes) {
      if (!f.active) continue;
      f.life += dt;
      if (f.life >= f.maxLife) f.active = false;
    }

    // Update ring auras
    for (const r of this.ringAuras) {
      if (!r.active) continue;
      r.life += dt;
      if (r.life >= r.maxLife) r.active = false;
    }
  }

  private resolveLanding(dropped: PendulumCake, topCake: StackedCake): void {
    const delta = dropped.x - topCake.x;
    const perfectTolerance = Math.min(7.5, Math.max(4.5, topCake.width * 0.08));

    if (Math.abs(delta) <= perfectTolerance) {
      // PERFECT ALIGNMENT!
      this.combo += 1;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      let finalWidth = topCake.width;
      let expanded = false;
      if (this.combo > 0 && this.combo % 5 === 0 && finalWidth < INITIAL_CAKE_WIDTH) {
        finalWidth = Math.min(INITIAL_CAKE_WIDTH, finalWidth + 12);
        expanded = true;
      }

      const newLayer: StackedCake = {
        id: this.stack.length,
        x: topCake.x,
        y: dropped.y,
        width: finalWidth,
        height: dropped.height,
        style: dropped.style,
        isPerfect: true,
        squash: 1,
        perfectGlow: 1,
        leftSliced: topCake.leftSliced && !expanded,
        rightSliced: topCake.rightSliced && !expanded,
      };
      this.stack.push(newLayer);
      this.floor += 1;
      this.score += 10 * this.combo + (expanded ? 25 : 0);

      this.hitstopTimer = 0.042;
      this.shakeIntensity = 2.5;

      this.spawnRingAura(newLayer.x, newLayer.y + newLayer.height / 2, newLayer.width, '#E59A2B');
      this.spawnParticles(newLayer.x, newLayer.y + 4, 18, ['#F5C44E', '#FFFDF8', dropped.style.accentColor], 'star');
      this.spawnCallout(
        newLayer.x,
        newLayer.y - 16,
        this.combo >= 2 ? `PERFECT ×${this.combo}` : 'PERFECT!',
        expanded ? '寬度回復 +12' : `+${10 * this.combo}`,
        '#D97706'
      );

      patisserieAudio.playPerfect(this.combo);
      if (expanded) {
        patisserieAudio.playExpandBonus();
      }

      this.pendulum = null;
      this.updateTargetCamera(false);
      this.spawnNextPendulum(this.floor + 1);
      this.emitHud();
      return;
    }

    // Check overlap
    const currLeft = dropped.x - dropped.width / 2;
    const currRight = dropped.x + dropped.width / 2;
    const prevLeft = topCake.x - topCake.width / 2;
    const prevRight = topCake.x + topCake.width / 2;

    const overlapLeft = Math.max(currLeft, prevLeft);
    const overlapRight = Math.min(currRight, prevRight);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 2.5) {
      // COMPLETE MISS -> GAME OVER
      this.pendulum = null;
      this.missedCake = {
        active: true,
        x: dropped.x,
        y: dropped.y,
        width: dropped.width,
        height: dropped.height,
        vx: delta >= 0 ? 75 : -75,
        vy: 140,
        rotation: 0,
        rotVel: delta >= 0 ? 2.6 : -2.6,
        style: dropped.style,
      };
      this.shakeIntensity = 7;
      this.endingTimer = 0.56;
      patisserieAudio.playGameOver();
      return;
    }

    // PARTIAL OVERLAP -> SLICE EXCESS!
    this.combo = 0;
    const newX = (overlapLeft + overlapRight) / 2;
    const cutLeft = currLeft < prevLeft;
    const cutRight = currRight > prevRight;

    const newLayer: StackedCake = {
      id: this.stack.length,
      x: newX,
      y: dropped.y,
      width: overlapWidth,
      height: dropped.height,
      style: dropped.style,
      isPerfect: false,
      squash: 0.78,
      perfectGlow: 0,
      leftSliced: cutLeft,
      rightSliced: cutRight,
    };
    this.stack.push(newLayer);
    this.floor += 1;
    this.score += 10;

    // Spawn falling scrap(s)
    if (cutLeft) {
      const scrapW = prevLeft - currLeft;
      const scrapX = currLeft + scrapW / 2;
      this.spawnScrap(scrapX, dropped.y, scrapW, dropped.height, -95, -55, -3.4, dropped.style, false, true);
      this.spawnCutFlash(prevLeft, dropped.y, dropped.height);
      this.spawnParticles(prevLeft, dropped.y + dropped.height * 0.5, 14, dropped.style.crumbColors, 'crumb');
    }
    if (cutRight) {
      const scrapW = currRight - prevRight;
      const scrapX = prevRight + scrapW / 2;
      this.spawnScrap(scrapX, dropped.y, scrapW, dropped.height, 95, -55, 3.4, dropped.style, true, false);
      this.spawnCutFlash(prevRight, dropped.y, dropped.height);
      this.spawnParticles(prevRight, dropped.y + dropped.height * 0.5, 14, dropped.style.crumbColors, 'crumb');
    }

    const sliceRatio = 1 - overlapWidth / dropped.width;
    this.shakeIntensity = 3.5;
    patisserieAudio.playLandAndSlice(sliceRatio);

    this.pendulum = null;
    this.updateTargetCamera(false);
    this.spawnNextPendulum(this.floor + 1);
    this.emitHud();
  }

  private finishGame(): void {
    this.running = false;
    this.stopLoop();

    const saved = loadPersistentData();
    const isNewRecord = this.score > saved.bestScore;
    if (isNewRecord) saved.bestScore = this.score;
    if (this.floor > saved.bestFloor) saved.bestFloor = this.floor;
    savePersistentData(saved);

    const previewSlice = this.stack.slice(-14).map((layer) => ({
      widthRatio: layer.width / INITIAL_CAKE_WIDTH,
      style: layer.style,
      isPerfect: layer.isPerfect,
    }));

    this.callbacks.onGameOver({
      score: this.score,
      floor: this.floor,
      maxCombo: this.maxCombo,
      isNewRecord,
      bestScore: saved.bestScore,
      bestFloor: saved.bestFloor,
      stackedPreview: previewSlice,
      newlyUnlocked: [...this.newlyUnlockedThisRun],
    });
  }

  private spawnScrap(
    x: number,
    y: number,
    width: number,
    height: number,
    vx: number,
    vy: number,
    rotVel: number,
    style: CakeStyle,
    leftSliced: boolean,
    rightSliced: boolean
  ): void {
    for (const s of this.scraps) {
      if (!s.active) {
        s.active = true;
        s.x = x;
        s.y = y;
        s.width = width;
        s.height = height;
        s.vx = vx;
        s.vy = vy;
        s.rotation = 0;
        s.rotVel = rotVel;
        s.style = style;
        s.leftSliced = leftSliced;
        s.rightSliced = rightSliced;
        return;
      }
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    count: number,
    colors: string[],
    shape: 'circle' | 'star' | 'crumb'
  ): void {
    let spawned = 0;
    for (const pt of this.particles) {
      if (!pt.active) {
        const angle = -Math.PI + Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 145;
        pt.active = true;
        pt.x = x + (Math.random() - 0.5) * 14;
        pt.y = y + (Math.random() - 0.5) * 10;
        pt.vx = Math.cos(angle) * speed;
        pt.vy = Math.sin(angle) * speed - 65;
        pt.size = shape === 'star' ? 4 + Math.random() * 4 : 2.5 + Math.random() * 3.5;
        pt.color = colors[Math.floor(Math.random() * colors.length)];
        pt.alpha = 1;
        pt.life = 0;
        pt.maxLife = 0.42 + Math.random() * 0.35;
        pt.gravity = shape === 'star' ? 180 : 620;
        pt.shape = shape;
        pt.rotation = Math.random() * Math.PI * 2;
        pt.rotVel = (Math.random() - 0.5) * 8;
        spawned++;
        if (spawned >= count) return;
      }
    }
  }

  private spawnCallout(x: number, y: number, text: string, subtext: string, color: string): void {
    for (const c of this.callouts) {
      if (!c.active) {
        c.active = true;
        c.x = Math.max(76, Math.min(LOGICAL_WIDTH - 76, x));
        c.y = y;
        c.vy = -52;
        c.text = text;
        c.subtext = subtext;
        c.color = color;
        c.life = 0;
        c.maxLife = 0.95;
        c.scale = 1;
        return;
      }
    }
  }

  private spawnCutFlash(x: number, y: number, height: number): void {
    for (const f of this.cutFlashes) {
      if (!f.active) {
        f.active = true;
        f.x = x;
        f.y = y;
        f.height = height;
        f.life = 0;
        f.maxLife = 0.18;
        return;
      }
    }
  }

  private spawnRingAura(x: number, y: number, width: number, color: string): void {
    for (const r of this.ringAuras) {
      if (!r.active) {
        r.active = true;
        r.x = x;
        r.y = y;
        r.width = width;
        r.life = 0;
        r.maxLife = 0.42;
        r.color = color;
        return;
      }
    }
  }

  private emitHud(): void {
    const currentCake = this.pendulum ? this.pendulum.style : getCakeStyleForFloor(this.floor + 1);
    this.callbacks.onHudUpdate({
      score: this.score,
      floor: this.floor,
      combo: this.combo,
      maxCombo: this.maxCombo,
      currentCake,
      unlockedInRun: Array.from(this.unlockedInRun),
      newUnlockBanner: this.newUnlockBanner,
    });
  }

  // ==================== RENDERING ====================

  private render(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Background sky / bakery atmosphere gradient based on height
    this.renderBackground(ctx);

    // Camera transform + shake
    const shakeX = this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;
    const shakeY = this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;

    ctx.save();
    ctx.translate(shakeX, -this.cameraY + shakeY);

    // Height milestone markers (5F, 10F, 15F...)
    this.renderHeightMarkers(ctx);

    // Wooden bakery counter & scalloped ceramic stand
    this.renderBakeryGroundAndStand(ctx);

    // Ring auras behind cakes
    this.renderRingAuras(ctx);

    // Stacked cakes (cull offscreen)
    const minVisY = this.cameraY - 80;
    const maxVisY = this.cameraY + this.logicalHeight + 80;

    for (let i = 0; i < this.stack.length; i++) {
      const layer = this.stack[i];
      if (layer.y > maxVisY || layer.y + layer.height < minVisY) continue;

      // Subtle squash and stretch on landing
      const squashAmt = layer.squash * 0.16;
      const scaleX = 1 + squashAmt;
      const scaleY = 1 - squashAmt;

      ctx.save();
      // Anchor squash at the bottom center of the layer
      const anchorY = layer.y + layer.height;
      ctx.translate(layer.x, anchorY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-layer.x, -anchorY);

      if (layer.perfectGlow > 0) {
        ctx.save();
        ctx.shadowColor = `rgba(229, 154, 43, ${layer.perfectGlow * 0.7})`;
        ctx.shadowBlur = 18 * layer.perfectGlow;
        drawPatisserieCake(ctx, layer.x, layer.y, layer.width, layer.height, layer.style, {
          leftSliced: layer.leftSliced,
          rightSliced: layer.rightSliced,
        });
        ctx.restore();
      } else {
        drawPatisserieCake(ctx, layer.x, layer.y, layer.width, layer.height, layer.style, {
          leftSliced: layer.leftSliced,
          rightSliced: layer.rightSliced,
        });
      }

      ctx.restore();
    }

    // Falling scraps
    for (const s of this.scraps) {
      if (!s.active) continue;
      ctx.save();
      ctx.translate(s.x, s.y + s.height / 2);
      ctx.rotate(s.rotation);
      drawPatisserieCake(ctx, 0, -s.height / 2, s.width, s.height, s.style, {
        leftSliced: s.leftSliced,
        rightSliced: s.rightSliced,
      });
      ctx.restore();
    }

    // Missed cake falling
    if (this.missedCake.active) {
      const m = this.missedCake;
      ctx.save();
      ctx.translate(m.x, m.y + m.height / 2);
      ctx.rotate(m.rotation);
      drawPatisserieCake(ctx, 0, -m.height / 2, m.width, m.height, m.style);
      ctx.restore();
    }

    // Pendulum ribbon & active cake
    this.renderPendulum(ctx);

    // Cut flashes & particles & floating callouts
    this.renderCutFlashes(ctx);
    this.renderParticles(ctx);
    this.renderCallouts(ctx);

    ctx.restore();
    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    // Smooth altitude progression 0..1 based on cameraY
    const altitude = Math.max(0, Math.min(1, (-this.cameraY - 400) / 1800));

    const grad = ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    if (altitude < 0.5) {
      const t = altitude * 2;
      grad.addColorStop(0, lerpColor('#FBF2E3', '#F7E3D7', t));
      grad.addColorStop(1, lerpColor('#FDF8F0', '#FBF1E6', t));
    } else {
      const t = (altitude - 0.5) * 2;
      grad.addColorStop(0, lerpColor('#F7E3D7', '#E7D8EB', t));
      grad.addColorStop(1, lerpColor('#FBF1E6', '#F8ECEF', t));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, this.logicalHeight);

    // Subtle striped wallpaper / sunlit vertical patisserie motif near ground
    const groundAlpha = Math.max(0, 1 - altitude * 1.8);
    if (groundAlpha > 0.02) {
      ctx.save();
      ctx.fillStyle = `rgba(229, 198, 168, ${0.14 * groundAlpha})`;
      for (let x = 16; x < LOGICAL_WIDTH; x += 44) {
        ctx.fillRect(x, 0, 18, this.logicalHeight);
      }

      // Soft arched French window silhouette in background (parallax)
      const parallaxY = -this.cameraY * 0.35;
      const winTop = this.logicalHeight - 540 + parallaxY;
      if (winTop < this.logicalHeight) {
        ctx.strokeStyle = `rgba(181, 138, 108, ${0.18 * groundAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(LOGICAL_WIDTH / 2, winTop + 120, 118, Math.PI, 0);
        ctx.lineTo(LOGICAL_WIDTH / 2 + 118, winTop + 340);
        ctx.lineTo(LOGICAL_WIDTH / 2 - 118, winTop + 340);
        ctx.closePath();
        ctx.stroke();

        // Cross mullions
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(LOGICAL_WIDTH / 2, winTop + 2);
        ctx.lineTo(LOGICAL_WIDTH / 2, winTop + 340);
        ctx.moveTo(LOGICAL_WIDTH / 2 - 118, winTop + 170);
        ctx.lineTo(LOGICAL_WIDTH / 2 + 118, winTop + 170);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Soft drifting gouache clouds at higher floors
    if (altitude > 0.15) {
      const cloudAlpha = Math.min(0.65, (altitude - 0.15) * 0.9);
      ctx.save();
      ctx.fillStyle = `rgba(255, 253, 249, ${cloudAlpha})`;
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 137 + this.ambientTime * (7 + i * 2)) % (LOGICAL_WIDTH + 120)) - 60;
        const cy = ((120 + i * 165 - this.cameraY * 0.25) % (this.logicalHeight + 80));
        const yPos = cy < -40 ? cy + this.logicalHeight + 80 : cy;
        drawSoftCloud(ctx, cx, yPos, 0.75 + (i % 2) * 0.25);
      }
      ctx.restore();
    }
  }

  private renderHeightMarkers(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const maxFloor = this.floor + 12;
    for (let f = 5; f <= maxFloor; f += 5) {
      const wy = -STAND_HEIGHT - f * 36 - 18;
      if (wy < this.cameraY - 30 || wy > this.cameraY + this.logicalHeight + 30) continue;

      ctx.strokeStyle = 'rgba(61, 39, 32, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(12, wy);
      ctx.lineTo(54, wy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(61, 39, 32, 0.34)';
      ctx.fillText(`${f}F`, 14, wy - 8);
    }
    ctx.restore();
  }

  private renderBakeryGroundAndStand(ctx: CanvasRenderingContext2D): void {
    if (0 < this.cameraY - 120) return;

    const ink = '#3D2720';
    ctx.save();

    // Warm oak bakery counter
    ctx.fillStyle = '#B87E52';
    ctx.fillRect(-20, 0, LOGICAL_WIDTH + 40, 200);
    ctx.fillStyle = '#9C663F';
    ctx.fillRect(-20, 0, LOGICAL_WIDTH + 40, 12);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(LOGICAL_WIDTH + 20, 0);
    ctx.stroke();

    // Soft cast shadow under porcelain stand
    ctx.fillStyle = 'rgba(61, 39, 32, 0.16)';
    ctx.beginPath();
    ctx.ellipse(LOGICAL_WIDTH / 2, 4, 72, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Porcelain pedestal cake stand (from y = 0 up to y = -STAND_HEIGHT)
    const cx = LOGICAL_WIDTH / 2;
    ctx.fillStyle = '#FFFDF9';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;

    // Stand foot & stem
    ctx.beginPath();
    ctx.moveTo(cx - 52, 0);
    ctx.quadraticCurveTo(cx - 32, -14, cx - 14, -22);
    ctx.lineTo(cx - 12, -44);
    ctx.lineTo(cx + 12, -44);
    ctx.lineTo(cx + 14, -22);
    ctx.quadraticCurveTo(cx + 32, -14, cx + 52, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stand plate top
    const plateW = INITIAL_CAKE_WIDTH + 44;
    ctx.fillStyle = '#FFFDF9';
    roundedPath(ctx, cx - plateW / 2, -STAND_HEIGHT, plateW, 15, 6, 6, 8, 8);
    ctx.fill();
    ctx.stroke();

    // Delicate scalloped gold trim on stand
    ctx.strokeStyle = '#E59A2B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - plateW / 2 + 10, -STAND_HEIGHT + 8);
    ctx.lineTo(cx + plateW / 2 - 10, -STAND_HEIGHT + 8);
    ctx.stroke();

    ctx.restore();
  }

  private renderPendulum(ctx: CanvasRenderingContext2D): void {
    const pivotY = this.cameraY - 18;
    const ink = '#3D2720';

    if (!this.pendulum) return;
    const p = this.pendulum;

    if (p.phase === 'SWINGING') {
      // Draw patisserie ribbon rope from pivot to hook
      ctx.save();
      const hookX = p.x;
      const hookY = p.y - 6;

      // Subtle rope shadow
      ctx.strokeStyle = 'rgba(61, 39, 32, 0.14)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(this.pivotX + 2, pivotY);
      ctx.lineTo(hookX + 2, hookY);
      ctx.stroke();

      // Cream & berry-red braided bakery twine
      ctx.strokeStyle = '#D94E5A';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(this.pivotX, pivotY);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      ctx.strokeStyle = '#FFFDF8';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.pivotX, pivotY);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Brass pastry clasp / tongs (level with the horizontal cake)
      ctx.translate(hookX, hookY);
      ctx.fillStyle = '#E59A2B';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.8;

      // Ring
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Two curved clasp arms holding the cake sides slightly
      const armSpread = 12 + this.claspOpen * 10;
      ctx.beginPath();
      ctx.moveTo(-3, 4);
      ctx.quadraticCurveTo(-armSpread, 8, -armSpread + 2, 13);
      ctx.moveTo(3, 4);
      ctx.quadraticCurveTo(armSpread, 8, armSpread - 2, 13);
      ctx.stroke();
      ctx.restore();

      // Subtle vertical aim guide dots directly below cake edges (very faint, tactile aid)
      ctx.save();
      ctx.strokeStyle = 'rgba(61, 39, 32, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + p.height + 8);
      ctx.lineTo(p.x, p.y + p.height + 90);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else {
      // Empty ribbon gently recoiling at top center after release
      ctx.save();
      const recoilLen = 58 - this.claspOpen * 22;
      ctx.strokeStyle = '#D94E5A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.pivotX, pivotY);
      ctx.lineTo(this.pivotX, pivotY + recoilLen);
      ctx.stroke();
      ctx.fillStyle = '#E59A2B';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(this.pivotX, pivotY + recoilLen, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw the swinging or dropping cake strictly horizontal
    drawPatisserieCake(ctx, p.x, p.y, p.width, p.height, p.style);
  }

  private renderRingAuras(ctx: CanvasRenderingContext2D): void {
    for (const r of this.ringAuras) {
      if (!r.active) continue;
      const t = r.life / r.maxLife;
      const alpha = (1 - t) * 0.85;
      const expand = t * 44;

      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3 * (1 - t) + 1;
      roundedPath(
        ctx,
        r.x - (r.width + expand) / 2,
        r.y - 18 - expand * 0.25,
        r.width + expand,
        36 + expand * 0.5,
        10,
        10,
        10,
        10
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCutFlashes(ctx: CanvasRenderingContext2D): void {
    for (const f of this.cutFlashes) {
      if (!f.active) continue;
      const alpha = 1 - f.life / f.maxLife;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 253, 249, ${alpha})`;
      ctx.lineWidth = 3.5 * alpha;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y - 14);
      ctx.lineTo(f.x, f.y + f.height + 16);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rotation);
      ctx.fillStyle = pt.color;

      if (pt.shape === 'star') {
        drawFourPointStar(ctx, 0, 0, pt.size);
      } else if (pt.shape === 'crumb') {
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size * 0.8);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, pt.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderCallouts(ctx: CanvasRenderingContext2D): void {
    for (const c of this.callouts) {
      if (!c.active) continue;
      const t = c.life / c.maxLife;
      const alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Main label
      ctx.font = '700 18px "Fraunces", "Noto Sans TC", serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#FFFDF9';
      ctx.strokeText(c.text, c.x, c.y);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, c.x, c.y);

      if (c.subtext) {
        ctx.font = '700 12px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFDF9';
        ctx.strokeText(c.subtext, c.x, c.y + 18);
        ctx.fillStyle = '#3D2720';
        ctx.fillText(c.subtext, c.x, c.y + 18);
      }

      ctx.restore();
    }
  }
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number
) {
  const maxR = Math.min(w / 2, h / 2);
  const rTL = Math.min(tl, maxR);
  const rTR = Math.min(tr, maxR);
  const rBR = Math.min(br, maxR);
  const rBL = Math.min(bl, maxR);

  ctx.beginPath();
  ctx.moveTo(x + rTL, y);
  ctx.lineTo(x + w - rTR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rTR);
  ctx.lineTo(x + w, y + h - rBR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rBR, y + h);
  ctx.lineTo(x + rBL, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rBL);
  ctx.lineTo(x, y + rTL);
  ctx.quadraticCurveTo(x, y, x + rTL, y);
  ctx.closePath();
}

function drawFourPointStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
  ctx.fill();
}

function drawSoftCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.arc(20, -6, 18, 0, Math.PI * 2);
  ctx.arc(40, 0, 16, 0, Math.PI * 2);
  ctx.arc(20, 6, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r1 = (a >> 16) & 255;
  const g1 = (a >> 8) & 255;
  const b1 = a & 255;
  const r2 = (b >> 16) & 255;
  const g2 = (b >> 8) & 255;
  const b2 = b & 255;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
