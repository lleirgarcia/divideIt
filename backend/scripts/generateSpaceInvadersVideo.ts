/**
 * Generates the space-invaders loop video (ship vs aliens, never wins).
 * Run from repo root: npx tsx backend/scripts/generateSpaceInvadersVideo.ts
 * Output: backend/assets/space_invaders_loop.mp4
 */

import path from 'path';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import { generateFrames } from '../src/utils/spaceInvadersOverlay';
import os from 'os';

const FPS = 30;
const ASSETS_DIR = path.resolve(__dirname, '../assets');

async function main() {
  const tmpDir = path.join(os.tmpdir(), `space-invaders-${Date.now()}`);
  console.log('Generating frames...');
  const pattern = await generateFrames(tmpDir);
  console.log('Encoding video with FFmpeg...');
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  const outPath = path.join(ASSETS_DIR, 'space_invaders_loop.mp4');

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(pattern)
      .inputOptions([`-framerate`, String(FPS)])
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset fast',
        '-crf 18',
        '-movflags +faststart',
      ])
      .output(outPath)
      .on('start', (cmd) => console.log('FFmpeg:', cmd))
      .on('end', () => {
        console.log('Done:', outPath);
        resolve();
      })
      .on('error', (err) => reject(err))
      .run();
  });

  // Cleanup temp frames
  const files = await fs.readdir(tmpDir);
  for (const f of files) {
    await fs.unlink(path.join(tmpDir, f));
  }
  await fs.rmdir(tmpDir);
  console.log('Temp frames removed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
