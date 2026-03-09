/**
 * Space-invaders style 2D animation for video overlay.
 * Ship vs aliens — the ship never finishes all aliens (attention loop).
 * Renders frames to PNG for encoding to a looping MP4.
 * Supports multiple themes with different colors and speeds.
 */

import { createCanvas } from 'canvas';
import path from 'path';
import fs from 'fs/promises';

const W = 320;
const H = 200;
const FPS = 30;
const TOTAL_FRAMES = 1800; // 60 seconds
const ALIEN_W = 14;
const ALIEN_H = 10;

/** Deterministic pseudo-random in [0, 1] from seed (same frame => same sequence). */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export interface GameTheme {
  name: string;
  bgColor: string;
  starColor: string;
  shipColor: string;
  shipStrokeColor: string;
  bulletColor: string;
  alienTypes: Array<{ fill: string; stroke: string }>;
  shipSpeed: number;
  alienMoveSpeed: number;
  bulletSpeed: number;
}

export const THEMES: Record<string, GameTheme> = {
  classic: {
    name: 'classic',
    bgColor: '#0a0a1a',
    starColor: 'rgba(255,255,255,0.4)',
    shipColor: '#38bdf8',
    shipStrokeColor: 'rgba(255,255,255,0.6)',
    bulletColor: '#fbbf24',
    alienTypes: [
      { fill: '#4ade80', stroke: '#22c55e' },
      { fill: '#f87171', stroke: '#ef4444' },
      { fill: '#a78bfa', stroke: '#8b5cf6' },
      { fill: '#fb923c', stroke: '#ea580c' },
      { fill: '#22d3ee', stroke: '#06b6d4' },
    ],
    shipSpeed: 0.85,
    alienMoveSpeed: 1.0,
    bulletSpeed: 2,
  },
  neon: {
    name: 'neon',
    bgColor: '#000000',
    starColor: 'rgba(255,255,255,0.7)',
    shipColor: '#ff00ff',
    shipStrokeColor: 'rgba(255,100,255,0.9)',
    bulletColor: '#00ffff',
    alienTypes: [
      { fill: '#ff1493', stroke: '#ff69b4' },
      { fill: '#00ff41', stroke: '#39ff14' },
      { fill: '#ff6600', stroke: '#ff9900' },
      { fill: '#ffff00', stroke: '#ffe600' },
      { fill: '#00cfff', stroke: '#00bfff' },
    ],
    shipSpeed: 1.4,
    alienMoveSpeed: 1.6,
    bulletSpeed: 3,
  },
  fire: {
    name: 'fire',
    bgColor: '#0d0000',
    starColor: 'rgba(255,120,50,0.4)',
    shipColor: '#ff3300',
    shipStrokeColor: 'rgba(255,150,50,0.8)',
    bulletColor: '#ffcc00',
    alienTypes: [
      { fill: '#ff2200', stroke: '#cc1100' },
      { fill: '#ff6600', stroke: '#dd4400' },
      { fill: '#ffaa00', stroke: '#cc8800' },
      { fill: '#ff4466', stroke: '#cc2244' },
      { fill: '#ff8800', stroke: '#dd6600' },
    ],
    shipSpeed: 1.0,
    alienMoveSpeed: 1.2,
    bulletSpeed: 2.5,
  },
  ice: {
    name: 'ice',
    bgColor: '#000d1a',
    starColor: 'rgba(180,220,255,0.5)',
    shipColor: '#e0f7fa',
    shipStrokeColor: 'rgba(150,220,255,0.8)',
    bulletColor: '#80deea',
    alienTypes: [
      { fill: '#b3e5fc', stroke: '#81d4fa' },
      { fill: '#e1f5fe', stroke: '#b3e5fc' },
      { fill: '#80deea', stroke: '#4dd0e1' },
      { fill: '#a5f3fc', stroke: '#67e8f9' },
      { fill: '#cfd8dc', stroke: '#b0bec5' },
    ],
    shipSpeed: 0.6,
    alienMoveSpeed: 0.7,
    bulletSpeed: 1.5,
  },
  gold: {
    name: 'gold',
    bgColor: '#0a0800',
    starColor: 'rgba(255,220,80,0.4)',
    shipColor: '#ffd700',
    shipStrokeColor: 'rgba(255,200,50,0.9)',
    bulletColor: '#fff176',
    alienTypes: [
      { fill: '#ffd700', stroke: '#ffb300' },
      { fill: '#ffb300', stroke: '#ff8f00' },
      { fill: '#ffe57f', stroke: '#ffd740' },
      { fill: '#cd853f', stroke: '#a0522d' },
      { fill: '#ffecb3', stroke: '#ffe082' },
    ],
    shipSpeed: 1.1,
    alienMoveSpeed: 1.3,
    bulletSpeed: 2.2,
  },
};

interface Alien {
  x: number;
  y: number;
  alive: boolean;
  explosionFrame: number;
  phase: number;
  vx: number;
  type: number;
}

interface Bullet {
  x: number;
  y: number;
}

export function getOverlayDimensions(): { width: number; height: number } {
  return { width: W, height: H };
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  aliens: Alien[],
  bullets: Bullet[],
  shipX: number,
  alienDx: number,
  theme: GameTheme
): void {
  const t = frameIndex;

  ctx.fillStyle = theme.bgColor;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = theme.starColor;
  for (let i = 0; i < 30; i++) {
    const sx = (i * 17 + t) % W;
    const sy = (i * 23 + t * 2) % H;
    ctx.fillRect(sx, sy, 1, 1);
  }

  aliens.forEach((a, i) => {
    if (!a.alive && a.explosionFrame === 0) return;
    if (a.explosionFrame > 0) {
      const r = a.explosionFrame * 2.5;
      ctx.fillStyle = `rgba(255, 180, 50, ${1 - a.explosionFrame / 8})`;
      ctx.beginPath();
      ctx.arc(a.x + ALIEN_W / 2, a.y + ALIEN_H / 2, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const alienType = theme.alienTypes[a.type % theme.alienTypes.length];
    ctx.fillStyle = alienType.fill;
    ctx.strokeStyle = alienType.stroke;
    const x = a.x;
    const y = a.y;
    if (a.type % 5 === 2) {
      ctx.fillRect(x, y, ALIEN_W, ALIEN_H);
      ctx.strokeRect(x, y, ALIEN_W, ALIEN_H);
    } else if (a.type % 5 === 3) {
      ctx.fillRect(x, y, ALIEN_W, ALIEN_H);
      ctx.strokeRect(x, y, ALIEN_W, ALIEN_H);
      ctx.fillStyle = alienType.stroke;
      ctx.fillRect(x + ALIEN_W / 2 - 1, y - 3, 2, 4);
    } else if (a.type % 5 === 4) {
      ctx.beginPath();
      ctx.moveTo(x + ALIEN_W / 2, y);
      ctx.lineTo(x + ALIEN_W, y + ALIEN_H / 2);
      ctx.lineTo(x + ALIEN_W / 2, y + ALIEN_H);
      ctx.lineTo(x, y + ALIEN_H / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(x, y, ALIEN_W, ALIEN_H);
      ctx.strokeRect(x, y, ALIEN_W, ALIEN_H);
    }
    ctx.fillStyle = '#1e293b';
    const eyeOff = a.type % 5 === 4 ? 2 : 0;
    ctx.fillRect(x + 3 + eyeOff, y + 2, 2, 2);
    ctx.fillRect(x + ALIEN_W - 5 - eyeOff, y + 2, 2, 2);
  });

  ctx.fillStyle = theme.bulletColor;
  bullets.forEach((b) => {
    ctx.fillRect(b.x - 2, b.y, 4, 8);
  });

  const shipW = 28;
  const shipH = 14;
  const shipY = H - shipH - 12;
  ctx.fillStyle = theme.shipColor;
  ctx.beginPath();
  ctx.moveTo(shipX + shipW / 2, shipY);
  ctx.lineTo(shipX + shipW, shipY + shipH);
  ctx.lineTo(shipX + shipW / 2, shipY + shipH - 4);
  ctx.lineTo(shipX, shipY + shipH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = theme.shipStrokeColor;
  ctx.stroke();
}

const SHIP_DIR_MIN_FRAMES = 60;
const SHIP_MARGIN = 4;
const SHIP_W = 28;

function advanceState(
  frameIndex: number,
  aliens: Alien[],
  bullets: Bullet[],
  shipX: number,
  alienDx: number,
  shipDir: number,
  shipDirFrames: number,
  theme: GameTheme
): { aliens: Alien[]; bullets: Bullet[]; shipX: number; alienDx: number; shipDir: number; shipDirFrames: number } {
  const newAliens = aliens.map((a) => ({ ...a }));
  let newDx = alienDx;
  const alienW = ALIEN_W;
  const alienH = ALIEN_H;
  const maxKills = 20;
  const currentKills = newAliens.filter((a) => !a.alive && a.explosionFrame === 0).length;

  newAliens.forEach((a) => {
    if (a.explosionFrame > 0) {
      a.explosionFrame++;
      if (a.explosionFrame > 8) {
        a.alive = false;
        a.explosionFrame = 0;
      }
    }
  });

  const newBullets = bullets
    .map((b) => ({ x: b.x, y: b.y - theme.bulletSpeed }))
    .filter((b) => b.y > -10);

  let newShipDir = shipDir;
  let newShipDirFrames = shipDirFrames + 1;
  if (newShipDirFrames >= SHIP_DIR_MIN_FRAMES) {
    const r = seeded(frameIndex * 13 + 7);
    if (r < 0.15) {
      newShipDir = -1;
      newShipDirFrames = 0;
    } else if (r < 0.3) {
      newShipDir = 1;
      newShipDirFrames = 0;
    }
  }
  const shipXMin = SHIP_MARGIN;
  const shipXMax = W - SHIP_W - SHIP_MARGIN;
  let newShipX = shipX + newShipDir * theme.shipSpeed;
  if (newShipX < shipXMin) {
    newShipX = shipXMin;
    newShipDir = 1;
    newShipDirFrames = 0;
  }
  if (newShipX > shipXMax) {
    newShipX = shipXMax;
    newShipDir = -1;
    newShipDirFrames = 0;
  }
  newShipX = Math.max(shipXMin, Math.min(shipXMax, newShipX));

  const moveSpeed = theme.alienMoveSpeed;
  const margin = 4;
  const xMin = margin;
  const xMax = W - alienW - margin;
  const directionChangeFrames = 60;
  newAliens.forEach((a, i) => {
    if (!a.alive || a.explosionFrame > 0) return;
    const alienPhase = (frameIndex + Math.floor(a.phase) + i * 19) % directionChangeFrames;
    if (alienPhase === 0) {
      const r = seeded(a.phase + frameIndex * 0.1 + i * 31);
      a.vx = (r * 2 - 1) * moveSpeed;
    }
    a.x += a.vx;
    if (a.x < xMin) {
      a.x = xMin;
      a.vx = Math.abs(a.vx) * 0.85;
    }
    if (a.x > xMax) {
      a.x = xMax;
      a.vx = -Math.abs(a.vx) * 0.85;
    }
  });
  const aliveAliens = newAliens.filter((a) => a.alive && a.explosionFrame === 0);
  if (aliveAliens.length > 0) {
    const leftmost = Math.min(...aliveAliens.map((a) => a.x));
    const rightmost = Math.max(...aliveAliens.map((a) => a.x + alienW));
    if (rightmost >= W - margin && newDx > 0) newDx = -newDx;
    if (leftmost <= margin && newDx < 0) newDx = -newDx;
  }

  let killsThisFrame = 0;
  newBullets.forEach((bullet) => {
    if (currentKills + killsThisFrame >= maxKills) return;
    for (const alien of newAliens) {
      if (!alien.alive || alien.explosionFrame > 0) continue;
      if (
        bullet.x >= alien.x - 2 &&
        bullet.x <= alien.x + alienW + 2 &&
        bullet.y <= alien.y + alienH &&
        bullet.y + 8 >= alien.y
      ) {
        alien.explosionFrame = 1;
        bullet.y = -100;
        killsThisFrame++;
        break;
      }
    }
  });

  if (frameIndex % 28 === 4) {
    newBullets.push({ x: newShipX + 14, y: H - 26 });
  }

  return {
    aliens: newAliens,
    bullets: newBullets,
    shipX: newShipX,
    alienDx: newDx,
    shipDir: newShipDir,
    shipDirFrames: newShipDirFrames,
  };
}

function initialAliens(): Alien[] {
  const rowsY = [26, 40, 54, 68];
  const startXs = [10, 58, 106, 154, 202, 250];
  const aliens: Alien[] = [];
  let idx = 0;
  rowsY.forEach((rowY, ri) => {
    startXs.forEach((x, ci) => {
      const p = seeded(idx) * 100;
      aliens.push({
        x: ci % 2 === 0 ? x : x + 8,
        y: rowY,
        alive: true,
        explosionFrame: 0,
        phase: p,
        vx: (seeded(p + 1) * 2 - 1) * 1.0,
        type: idx % 5,
      });
      idx++;
    });
  });
  return aliens;
}

export async function generateFrames(outDir: string, theme: GameTheme = THEMES.classic): Promise<string> {
  await fs.mkdir(outDir, { recursive: true });
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  let aliens = initialAliens();
  let bullets: Bullet[] = [];
  let shipX = 160 - 14;
  let alienDx = 2;
  let shipDir = 1;
  let shipDirFrames = 0;

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    renderFrame(ctx, f, aliens, bullets, shipX, alienDx, theme);
    const buf = canvas.toBuffer('image/png');
    const framePath = path.join(outDir, `frame_${String(f).padStart(4, '0')}.png`);
    await fs.writeFile(framePath, buf);

    const next = advanceState(f, aliens, bullets, shipX, alienDx, shipDir, shipDirFrames, theme);
    aliens = next.aliens;
    bullets = next.bullets;
    shipX = next.shipX;
    alienDx = next.alienDx;
    shipDir = next.shipDir;
    shipDirFrames = next.shipDirFrames;
  }

  return path.join(outDir, 'frame_%04d.png');
}
