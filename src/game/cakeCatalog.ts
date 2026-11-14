import { CakeStyle, CakeStyleId, PersistentData } from './types';

export const CAKE_STYLES: CakeStyle[] = [
  {
    id: 'chiffon',
    nameZh: '香草草莓戚風',
    nameFr: 'Chiffon aux Fraises',
    descriptionZh: '蓬鬆金黃海綿蛋糕夾入鮮奶油與新鮮草莓切片。',
    unlockFloor: 1,
    height: 36,
    spongeColor: '#F3C779',
    spongeShade: '#E0AC56',
    creamColor: '#FFFDF8',
    fillingColor: '#D94E5A',
    accentColor: '#D94E5A',
    crumbColors: ['#F3C779', '#FFFDF8', '#D94E5A'],
  },
  {
    id: 'millefeuille',
    nameZh: '法式草莓千層派',
    nameFr: 'Mille-Feuille Parisien',
    descriptionZh: '焦糖酥皮層層堆疊卡士達香草餡，撒上細緻糖粉。',
    unlockFloor: 5,
    height: 36,
    spongeColor: '#DF9F53',
    spongeShade: '#B8772E',
    creamColor: '#FFF5DA',
    fillingColor: '#F7E4B2',
    accentColor: '#C83E4D',
    crumbColors: ['#DF9F53', '#FFF5DA', '#B8772E'],
  },
  {
    id: 'macaron',
    nameZh: '覆盆子玫瑰馬卡龍',
    nameFr: 'Macaron Framboise',
    descriptionZh: '酥脆蕾絲裙邊杏仁餅殼，包裹絲滑玫瑰覆盆子甘納許。',
    unlockFloor: 10,
    height: 34,
    spongeColor: '#EB8391',
    spongeShade: '#D35E6F',
    creamColor: '#FFF0F2',
    fillingColor: '#9E2B3D',
    accentColor: '#E59A2B',
    crumbColors: ['#EB8391', '#FFF0F2', '#E59A2B'],
  },
  {
    id: 'opera',
    nameZh: '宇治抹茶歌劇院',
    nameFr: 'Opéra au Matcha',
    descriptionZh: '醇厚黑巧克力鏡面搭配京都抹茶杏仁海綿與金箔點綴。',
    unlockFloor: 15,
    height: 36,
    spongeColor: '#8CA868',
    spongeShade: '#6E8A4B',
    creamColor: '#3B231A',
    fillingColor: '#F6F1DE',
    accentColor: '#E8AF38',
    crumbColors: ['#8CA868', '#3B231A', '#E8AF38'],
  },
  {
    id: 'montblanc',
    nameZh: '焦糖海鹽蒙布朗',
    nameFr: 'Mont-Blanc Caramel',
    descriptionZh: '綿密法式栗子泥條紋交織海鹽焦糖淋醬與烤榛果碎。',
    unlockFloor: 20,
    height: 36,
    spongeColor: '#B57B56',
    spongeShade: '#8F5938',
    creamColor: '#E59A2B',
    fillingColor: '#FFF7EA',
    accentColor: '#F5C469',
    crumbColors: ['#B57B56', '#E59A2B', '#FFF7EA'],
  },
  {
    id: 'forest',
    nameZh: '皇家藍莓黑森林',
    nameFr: 'Forêt Bleue Royale',
    descriptionZh: '濃郁法芙娜可可蛋糕佐馬斯卡彭鮮奶油與野生藍莓。',
    unlockFloor: 25,
    height: 36,
    spongeColor: '#56342A',
    spongeShade: '#3D221A',
    creamColor: '#FFFDF8',
    fillingColor: '#506299',
    accentColor: '#4A5D96',
    crumbColors: ['#56342A', '#FFFDF8', '#506299'],
  },
];

export function getCakeStyleForFloor(floor: number): CakeStyle {
  if (floor < 5) return CAKE_STYLES[0];
  if (floor < 10) return CAKE_STYLES[1];
  if (floor < 15) return CAKE_STYLES[2];
  if (floor < 20) return CAKE_STYLES[3];
  if (floor < 25) return CAKE_STYLES[4];
  // Above floor 25: cycle through royal & artisan classics every 3 floors
  const cycleIndex = Math.floor((floor - 25) / 3) % CAKE_STYLES.length;
  // Start cycle with forest (index 5)
  return CAKE_STYLES[(5 + cycleIndex) % CAKE_STYLES.length];
}

const STORAGE_KEY = 'la_petite_patisserie_save_v1';

export function loadPersistentData(): PersistentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        bestScore: 0,
        bestFloor: 0,
        unlockedCakes: ['chiffon'],
        isMuted: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistentData>;
    const unlocked: CakeStyleId[] = Array.isArray(parsed.unlockedCakes)
      ? parsed.unlockedCakes
      : ['chiffon'];
    if (!unlocked.includes('chiffon')) unlocked.unshift('chiffon');
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      bestFloor: typeof parsed.bestFloor === 'number' ? parsed.bestFloor : 0,
      unlockedCakes: unlocked,
      isMuted: Boolean(parsed.isMuted),
    };
  } catch {
    return {
      bestScore: 0,
      bestFloor: 0,
      unlockedCakes: ['chiffon'],
      isMuted: false,
    };
  }
}

export function savePersistentData(data: PersistentData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
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

export interface DrawCakeOptions {
  leftSliced?: boolean;
  rightSliced?: boolean;
  isTopmost?: boolean;
}

/**
 * Draws an artisanal 2D patisserie cake centered horizontally at (cx, topY)
 * with any arbitrary clipped width. Sliced edges render crisp bakery cross-sections!
 */
export function drawPatisserieCake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  width: number,
  height: number,
  style: CakeStyle,
  opts: DrawCakeOptions = {}
): void {
  if (width <= 1) return;

  const left = cx - width / 2;
  const { leftSliced = false, rightSliced = false } = opts;
  const rLeft = leftSliced ? 1.5 : 6;
  const rRight = rightSliced ? 1.5 : 6;
  const ink = '#3D2720';

  ctx.save();

  // Clipping path for clean cross-section edges
  roundedPath(ctx, left, topY, width, height, rLeft, rRight, rRight * 0.7, rLeft * 0.7);
  ctx.save();
  ctx.clip();

  if (style.id === 'chiffon') {
    // Golden sponge body
    ctx.fillStyle = style.spongeColor;
    ctx.fillRect(left, topY, width, height);

    // Warm baked bottom shade
    ctx.fillStyle = style.spongeShade;
    ctx.fillRect(left, topY + height - 6, width, 6);

    // Middle strawberry jam & cream ribbon
    ctx.fillStyle = style.fillingColor;
    ctx.fillRect(left, topY + height * 0.56, width, 4.5);
    ctx.fillStyle = style.creamColor;
    ctx.fillRect(left, topY + height * 0.45, width, 4.5);

    // Top fluffy whipped cream with scalloped drip waves
    ctx.fillStyle = style.creamColor;
    ctx.beginPath();
    ctx.moveTo(left, topY);
    ctx.lineTo(left + width, topY);
    ctx.lineTo(left + width, topY + 11);
    const waveCount = Math.max(2, Math.round(width / 22));
    const waveW = width / waveCount;
    for (let i = waveCount - 1; i >= 0; i--) {
      const wx = left + i * waveW;
      const drop = i % 2 === 0 ? 15 : 11;
      ctx.quadraticCurveTo(wx + waveW * 0.5, topY + drop, wx, topY + 10);
    }
    ctx.closePath();
    ctx.fill();

    // Soft sponge crumbs dots
    ctx.fillStyle = 'rgba(160, 102, 34, 0.25)';
    for (let px = left + 10; px < left + width - 8; px += 18) {
      ctx.beginPath();
      ctx.arc(px, topY + height * 0.76, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style.id === 'millefeuille') {
    // Three crisp puff pastry bands & two custard layers
    const bandH = height / 5;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? style.spongeColor : style.creamColor;
      ctx.fillRect(left, topY + i * bandH, width, bandH + 0.5);
      if (i % 2 === 0) {
        ctx.fillStyle = style.spongeShade;
        ctx.fillRect(left, topY + (i + 1) * bandH - 2, width, 2);
      }
    }
    // Icing sugar top glaze with dark chocolate feathering stripes
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(left, topY, width, 7);
    ctx.fillStyle = '#6D3F2A';
    for (let sx = left + 8; sx < left + width - 4; sx += 16) {
      ctx.fillRect(sx, topY + 2, 7, 2);
    }
  } else if (style.id === 'macaron') {
    // Top shell
    ctx.fillStyle = style.spongeColor;
    ctx.fillRect(left, topY, width, height * 0.36);
    // Gloss highlight on top shell
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.fillRect(left + 4, topY + 2.5, Math.max(0, width - 8), 3);
    // Ruffled pied (top)
    ctx.fillStyle = style.spongeShade;
    ctx.fillRect(left, topY + height * 0.33, width, 3.5);
    // Rich ganache filling
    ctx.fillStyle = style.creamColor;
    ctx.fillRect(left, topY + height * 0.36, width, height * 0.28);
    ctx.fillStyle = style.fillingColor;
    ctx.fillRect(left, topY + height * 0.46, width, height * 0.1);
    // Bottom shell & pied
    ctx.fillStyle = style.spongeShade;
    ctx.fillRect(left, topY + height * 0.64, width, 3.5);
    ctx.fillStyle = style.spongeColor;
    ctx.fillRect(left, topY + height * 0.68, width, height * 0.32);
  } else if (style.id === 'opera') {
    // Dark chocolate mirror glaze on top
    ctx.fillStyle = style.creamColor;
    ctx.fillRect(left, topY, width, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(left + 6, topY + 2, Math.max(0, width - 12), 2);
    // Matcha sponge & cream bands
    ctx.fillStyle = style.spongeColor;
    ctx.fillRect(left, topY + 8, width, 8);
    ctx.fillStyle = style.fillingColor;
    ctx.fillRect(left, topY + 16, width, 6);
    ctx.fillStyle = style.creamColor;
    ctx.fillRect(left, topY + 22, width, 4);
    ctx.fillStyle = style.spongeShade;
    ctx.fillRect(left, topY + 26, width, height - 26);
  } else if (style.id === 'montblanc') {
    // Cream core base
    ctx.fillStyle = style.fillingColor;
    ctx.fillRect(left, topY, width, height);
    // Horizontal woven chestnut ribbons
    const stripes = 4;
    const sh = height / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? style.spongeColor : style.spongeShade;
      ctx.fillRect(left, topY + i * sh + 1.5, width, sh - 2.5);
    }
    // Caramel glaze top drip
    ctx.fillStyle = style.creamColor;
    ctx.beginPath();
    ctx.moveTo(left, topY);
    ctx.lineTo(left + width, topY);
    ctx.lineTo(left + width, topY + 8);
    const waveCount = Math.max(2, Math.round(width / 20));
    const waveW = width / waveCount;
    for (let i = waveCount - 1; i >= 0; i--) {
      const wx = left + i * waveW;
      ctx.quadraticCurveTo(wx + waveW * 0.5, topY + (i % 2 === 0 ? 13 : 8), wx, topY + 7);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    // Royal Blueberry Black Forest
    ctx.fillStyle = style.spongeColor;
    ctx.fillRect(left, topY, width, height);
    ctx.fillStyle = style.spongeShade;
    ctx.fillRect(left, topY + height - 5, width, 5);
    // Mascarpone cream center band + blueberry compote
    ctx.fillStyle = style.creamColor;
    ctx.fillRect(left, topY + height * 0.42, width, 7);
    ctx.fillStyle = style.fillingColor;
    ctx.fillRect(left, topY + height * 0.57, width, 4);
    // Snowy cream top
    ctx.fillStyle = style.creamColor;
    ctx.fillRect(left, topY, width, 8);
  }

  // Subtle sliced cross-section highlight if cut
  if (leftSliced) {
    ctx.fillStyle = 'rgba(255, 250, 240, 0.35)';
    ctx.fillRect(left, topY, 2.5, height);
  }
  if (rightSliced) {
    ctx.fillStyle = 'rgba(61, 39, 32, 0.14)';
    ctx.fillRect(left + width - 2.5, topY, 2.5, height);
  }

  ctx.restore(); // end clip

  // Crisp hand-drawn cocoa ink outline
  roundedPath(ctx, left, topY, width, height, rLeft, rRight, rRight * 0.7, rLeft * 0.7);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Toppings sitting delicately above topY (only if wide enough)
  if (width >= 26) {
    drawCakeToppings(ctx, cx, topY, width, style);
  }

  ctx.restore();
}

function drawCakeToppings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  width: number,
  style: CakeStyle
): void {
  const ink = '#3D2720';
  const count = Math.max(1, Math.min(4, Math.floor((width - 14) / 36)));
  const span = Math.max(0, width - 34);

  for (let i = 0; i < count; i++) {
    const tx = count === 1 ? cx : cx - span / 2 + (span * i) / (count - 1);

    if (style.id === 'chiffon' || style.id === 'millefeuille') {
      // Cute strawberry + tiny mint leaf
      ctx.fillStyle = '#5B9A5D';
      ctx.beginPath();
      ctx.ellipse(tx + 4, topY - 4, 4.5, 2.2, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = style.accentColor;
      ctx.beginPath();
      ctx.moveTo(tx - 5, topY);
      ctx.quadraticCurveTo(tx - 5, topY - 9, tx, topY - 10);
      ctx.quadraticCurveTo(tx + 5, topY - 9, tx + 5, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Strawberry highlight dot
      ctx.fillStyle = '#FFE4E6';
      ctx.beginPath();
      ctx.arc(tx - 1.5, topY - 5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (style.id === 'macaron') {
      // Tiny edible gold pearl & rose petal dot
      ctx.fillStyle = '#F2BD49';
      ctx.beginPath();
      ctx.arc(tx, topY - 2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    } else if (style.id === 'opera') {
      // Gold leaf square
      if (i === Math.floor(count / 2)) {
        ctx.fillStyle = '#F5C44E';
        ctx.fillRect(tx - 5, topY - 4, 10, 4);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(tx - 5, topY - 4, 10, 4);
      }
    } else if (style.id === 'montblanc') {
      // Candied chestnut / caramel pearl
      ctx.fillStyle = '#C97B42';
      ctx.beginPath();
      ctx.arc(tx, topY - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      // Wild blueberry cluster
      ctx.fillStyle = '#4A5D96';
      ctx.beginPath();
      ctx.arc(tx, topY - 3.5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#B8C6EE';
      ctx.beginPath();
      ctx.arc(tx - 1.2, topY - 4.8, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
