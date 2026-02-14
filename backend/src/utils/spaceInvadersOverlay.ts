/**
 * Space-invaders style 2D animation for video overlay.
 * Ship vs aliens — the ship never finishes all aliens (attention loop).
 * Renders frames to PNG for encoding to a looping MP4.
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

/** Alien type: 0-4 for different colors and shapes. */
const ALIEN_TYPES = [
  { fill: '#4ade80', stroke: '#22c55e' },   // 0 green
  { fill: '#f87171', stroke: '#ef4444' },   // 1 red
  { fill: '#a78bfa', stroke: '#8b5cf6' },   // 2 purple
  { fill: '#fb923c', stroke: '#ea580c' },   // 3 orange
  { fill: '#22d3ee', stroke: '#06b6d4' },   // 4 cyan
];

interface Alien {
  x: number;
  y: number;
  alive: boolean;
  explosionFrame: number;
  phase: number;
  vx: number;
  type: number; // 0-4
}

interface Bullet {
  x: number;
  y: number;
}

export function getOverlayDimensions(): { width: number; height: number } {
  return { width: W, height: H };
}

/**
 * Render one frame of the game. State is mutated for next frame.
 */
function renderFrame(
  ctx: CanvasRenderingContext2D,
  frameIndex: number,
  aliens: Alien[],
  bullets: Bullet[],
  shipX: number,
  alienDx: number
): void {
  const t = frameIndex;

  // Background (space)
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  // Grid of stars (subtle)
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 17 + t) % W;
    const sy = (i * 23 + t * 2) % H;
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Aliens: multiple rows, multiple types (color + shape)
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
    const t = ALIEN_TYPES[a.type % ALIEN_TYPES.length];
    ctx.fillStyle = t.fill;
    ctx.strokeStyle = t.stroke;
    const x = a.x;
    const y = a.y;
    if (a.type % 5 === 2) {
      // Type 2: purple classic
      ctx.fillRect(x, y, ALIEN_W, ALIEN_H);
      ctx.strokeRect(x, y, ALIEN_W, ALIEN_H);
    } else if (a.type % 5 === 3) {
      // Type 3: body + antenna
      ctx.fillRect(x, y, ALIEN_W, ALIEN_H);
      ctx.strokeRect(x, y, ALIEN_W, ALIEN_H);
      ctx.fillStyle = t.stroke;
      ctx.fillRect(x + ALIEN_W / 2 - 1, y - 3, 2, 4);
    } else if (a.type % 5 === 4) {
      // Type 4: diamond-ish (squashed)
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

  // Bullets
  ctx.fillStyle = '#fbbf24';
  bullets.forEach((b) => {
    ctx.fillRect(b.x - 2, b.y, 4, 8);
  });

  // Ship (bottom center, slight movement)
  const shipW = 28;
  const shipH = 14;
  const shipY = H - shipH - 12;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(shipX + shipW / 2, shipY);
  ctx.lineTo(shipX + shipW, shipY + shipH);
  ctx.lineTo(shipX + shipW / 2, shipY + shipH - 4);
  ctx.lineTo(shipX, shipY + shipH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke();
}

/** Ship direction state: -1 = left, 1 = right; min 2s per direction. */
const SHIP_DIR_MIN_FRAMES = 60; // 2 seconds at 30 fps
const SHIP_SPEED = 0.85;
const SHIP_MARGIN = 4;
const SHIP_W = 28;

/**
 * Advance game state one frame. Returns updated state.
 */
function advanceState(
  frameIndex: number,
  aliens: Alien[],
  bullets: Bullet[],
  shipX: number,
  alienDx: number,
  shipDir: number,
  shipDirFrames: number
): { aliens: Alien[]; bullets: Bullet[]; shipX: number; alienDx: number; shipDir: number; shipDirFrames: number } {
  const newAliens = aliens.map((a) => ({ ...a }));
  let newDx = alienDx;
  const alienW = ALIEN_W;
  const alienH = ALIEN_H;
  const bulletSpeed = 2;
  const maxKills = 20; // ship never wins (more aliens, so allow more kills but always leave several)
  const currentKills = newAliens.filter((a) => !a.alive && a.explosionFrame === 0).length;

  // Update explosion frames
  newAliens.forEach((a) => {
    if (a.explosionFrame > 0) {
      a.explosionFrame++;
      if (a.explosionFrame > 8) {
        a.alive = false;
        a.explosionFrame = 0;
      }
    }
  });

  // Move bullets up (slower)
  const newBullets = bullets
    .map((b) => ({ x: b.x, y: b.y - bulletSpeed }))
    .filter((b) => b.y > -10);

  // Ship: full horizontal range, random left/right with minimum 2 seconds per direction
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
  let newShipX = shipX + newShipDir * SHIP_SPEED;
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

  // Alien movement: long horizontal drifts, change direction only every many frames
  const moveSpeed = 1.0;
  const margin = 4;
  const xMin = margin;
  const xMax = W - alienW - margin;
  const directionChangeFrames = 60; // each alien gets new direction every ~60 frames (long drifts)
  newAliens.forEach((a, i) => {
    if (!a.alive || a.explosionFrame > 0) return;
    // Stagger direction change per alien so they don't all flip at once (more free, random)
    const alienPhase = (frameIndex + Math.floor(a.phase) + i * 19) % directionChangeFrames;
    if (alienPhase === 0) {
      const r = seeded(a.phase + frameIndex * 0.1 + i * 31);
      a.vx = (r * 2 - 1) * moveSpeed;
    }
    a.x += a.vx;
    // Bounce off edges (reverse and clamp so movement stays free but on screen)
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

  // Collision: bullets vs aliens (only allow maxKills so ship never wins)
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

  // Spawn new bullet less often (slower pace, ship never wins)
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

/**
 * Build initial aliens: 4 rows × 6 = 24, mixed types (0-4).
 */
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
        type: idx % ALIEN_TYPES.length,
      });
      idx++;
    });
  });
  return aliens;
}

/**
 * Generate all frames and save as PNGs in outDir. Returns path to first frame pattern.
 */
export async function generateFrames(outDir: string): Promise<string> {
  await fs.mkdir(outDir, { recursive: true });
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  let aliens = initialAliens();
  let bullets: Bullet[] = [];
  let shipX = 160 - 14;
  let alienDx = 2;
  let shipDir = 1; // start moving right
  let shipDirFrames = 0;

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    renderFrame(ctx, f, aliens, bullets, shipX, alienDx);
    const buf = canvas.toBuffer('image/png');
    const framePath = path.join(outDir, `frame_${String(f).padStart(4, '0')}.png`);
    await fs.writeFile(framePath, buf);

    const next = advanceState(f, aliens, bullets, shipX, alienDx, shipDir, shipDirFrames);
    aliens = next.aliens;
    bullets = next.bullets;
    shipX = next.shipX;
    alienDx = next.alienDx;
    shipDir = next.shipDir;
    shipDirFrames = next.shipDirFrames;
  }

  return path.join(outDir, 'frame_%04d.png');
}
