/**
 * One-off: add space-invaders game overlay to a segment file (in place).
 * Usage: npx tsx scripts/addGameOverlayToSegment.ts <path-to-segment.mp4>
 * Example: npx tsx scripts/addGameOverlayToSegment.ts processed/8274685e-5dae-401a-9921-ce07e60c5739/segment_1_804596f6-543d-4d8f-8ff4-fa6309b671e4.mp4
 */

import path from 'path';
import fs from 'fs/promises';
import { addGameOverlayToVideo } from '../src/utils/addGameOverlayToVideo';

async function main() {
  const relativePath = process.argv[2];
  if (!relativePath || !relativePath.endsWith('.mp4')) {
    console.error('Usage: npx tsx scripts/addGameOverlayToSegment.ts <path-to-segment.mp4>');
    process.exit(1);
  }
  const baseDir = path.resolve(__dirname, '..');
  const videoPath = path.resolve(baseDir, relativePath);
  try {
    await fs.access(videoPath);
  } catch {
    console.error('File not found:', videoPath);
    process.exit(1);
  }
  const tempOut = videoPath.replace(/\.mp4$/, '_game_temp.mp4');
  console.log('Adding game overlay to', path.basename(videoPath));
  console.log('(Re-encoding the whole video — progress every 10%. If you get SIGKILL, run in Terminal.app/iTerm instead of Cursor.)');
  await addGameOverlayToVideo(videoPath, tempOut);
  await fs.unlink(videoPath).catch(() => {});
  await fs.rename(tempOut, videoPath);
  // If input was _original_no_title.mp4, also copy overlay to main segment (segment_X_uuid.mp4) so the app shows the game
  const mainSegmentPath = videoPath.replace(/_original_no_title\.mp4$/, '.mp4');
  if (mainSegmentPath !== videoPath) {
    await fs.copyFile(videoPath, mainSegmentPath);
    console.log('Done. Segment updated (game in bottom-right). Copied to main segment:', path.basename(mainSegmentPath));
  } else {
    console.log('Done. Segment updated (game in bottom-right):', path.basename(videoPath));
  }
  console.log('Video path:', videoPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
