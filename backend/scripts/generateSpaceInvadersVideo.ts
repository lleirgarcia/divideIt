/**
 * Generates all space-invaders theme loop videos.
 * Run from backend/: npx tsx scripts/generateSpaceInvadersVideo.ts
 * Output: backend/assets/space_invaders_<theme>.mp4
 */

import path from 'path';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import { generateFrames, THEMES } from '../src/utils/spaceInvadersOverlay';
import os from 'os';

const FPS = 30;
const ASSETS_DIR = path.resolve(__dirname, '../assets');

async function encodeVideo(framesPattern: string, outPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(framesPattern)
      .inputOptions([`-framerate`, String(FPS)])
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset fast',
        '-crf 18',
        '-movflags +faststart',
      ])
      .output(outPath)
      .on('start', (cmd) => console.log('  FFmpeg:', cmd))
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

async function main() {
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  for (const [themeName, theme] of Object.entries(THEMES)) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Generating theme: ${themeName}`);
    console.log('='.repeat(50));

    const tmpDir = path.join(os.tmpdir(), `space-invaders-${themeName}-${Date.now()}`);
    console.log('  Generating frames...');
    const pattern = await generateFrames(tmpDir, theme);

    const outPath = path.join(ASSETS_DIR, `space_invaders_${themeName}.mp4`);
    console.log('  Encoding video...');
    await encodeVideo(pattern, outPath);
    console.log(`  Done: ${outPath}`);

    // Cleanup temp frames
    const files = await fs.readdir(tmpDir);
    for (const f of files) await fs.unlink(path.join(tmpDir, f));
    await fs.rmdir(tmpDir);
  }

  // Keep backward-compat: copy classic as the default name
  const classicPath = path.join(ASSETS_DIR, 'space_invaders_classic.mp4');
  const defaultPath = path.join(ASSETS_DIR, 'space_invaders_loop.mp4');
  await fs.copyFile(classicPath, defaultPath);
  console.log(`\nCopied classic → space_invaders_loop.mp4 (backward compat)`);
  console.log('\nAll themes generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
