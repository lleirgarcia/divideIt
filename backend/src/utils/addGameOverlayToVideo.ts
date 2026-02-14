/**
 * Overlay the space-invaders loop video (nave vs marcianos, never wins) on a segment.
 * The game loops for the full duration of the segment. Position: bottom-right corner.
 */

import path from 'path';
import fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import { logger } from './logger';
import { getOverlayDimensions } from './spaceInvadersOverlay';

const PADDING = 20;
const GAME_VIDEO_NAME = 'space_invaders_loop.mp4';

/**
 * Resolve path to the pre-rendered game overlay video.
 */
function getGameOverlayPath(): string {
  const assetsDir = path.resolve(__dirname, '../../assets');
  return path.join(assetsDir, GAME_VIDEO_NAME);
}

/**
 * Add the space-invaders game overlay to a video segment.
 * Overlay is placed at bottom-right and loops for the whole duration.
 *
 * @param inputPath - Segment video path
 * @param outputPath - Output path (default: input with _with_game.mp4)
 * @returns Output video path
 */
export async function addGameOverlayToVideo(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  const gamePath = getGameOverlayPath();
  try {
    await fs.access(gamePath);
  } catch {
    throw new Error(
      `Game overlay video not found at ${gamePath}. Run: npx tsx backend/scripts/generateSpaceInvadersVideo.ts`
    );
  }

  const out = outputPath || inputPath.replace(/\.mp4$/, '_with_game.mp4');
  const absoluteInput = path.resolve(inputPath);
  const absoluteGame = path.resolve(gamePath);
  const absoluteOut = path.resolve(out);

  const { width: ow, height: oh } = getOverlayDimensions();
  // Bottom-right with padding: x = main_w - overlay_w - PADDING, y = main_h - overlay_h - PADDING
  const overlayFilter = `[0:v][1:v]overlay=main_w-overlay_w-${PADDING}:main_h-overlay_h-${PADDING}[out]`;

  return new Promise((resolve, reject) => {
    ffmpeg(absoluteInput)
      .input(absoluteGame)
      .inputOptions(['-stream_loop', '-1']) // loop overlay for full main duration
      .complexFilter([overlayFilter])
      .outputOptions([
        '-map [out]',
        '-map 0:a?',
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a copy',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
      ])
      .output(absoluteOut)
      .on('start', (cmd) => logger.info(`Adding game overlay: ${cmd}`))
      .on('end', () => {
        logger.info(`Game overlay added: ${path.basename(absoluteOut)}`);
        resolve(absoluteOut);
      })
      .on('error', (err) => {
        logger.error(`Game overlay error: ${err.message}`);
        reject(new Error(`Failed to add game overlay: ${err.message}`));
      })
      .run();
  });
}
