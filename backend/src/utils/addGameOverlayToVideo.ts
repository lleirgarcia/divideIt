/**
 * Overlay the space-invaders loop video (nave vs marcianos, never wins) on a segment.
 * The game loops for the full duration of the segment. Position: bottom-right corner.
 * Uses spawn so the script always finishes when FFmpeg exits (no hang at 100%).
 */

import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import { logger } from './logger';
import { getOverlayDimensions } from './spaceInvadersOverlay';

const PADDING = 20;
const GAME_VIDEO_NAME = 'space_invaders_loop.mp4';

function getGameOverlayPath(): string {
  const assetsDir = path.resolve(__dirname, '../../assets');
  return path.join(assetsDir, GAME_VIDEO_NAME);
}

/** Parse HH:MM:SS.ms or MM:SS.ms to seconds */
function timemarkToSeconds(t: string): number {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Extract time= from ffmpeg stderr (e.g. "time=00:01:23.45") */
function parseTimeFromStderr(line: string): number | null {
  const m = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
  return m ? timemarkToSeconds(m[1]) : null;
}

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
  const absoluteOutTmp = path.join(path.dirname(absoluteOut), 'tmp_' + path.basename(absoluteOut));

  const { width: ow, height: oh } = getOverlayDimensions();
  // Scale to 75% so the game is clearly visible in the corner (was 50%, too small on vertical video)
  const owScaled = Math.floor(ow * 0.75);
  const ohScaled = Math.floor(oh * 0.75);
  const overlayFilter = `[1:v]scale=${owScaled}:${ohScaled}[ov];[0:v][ov]overlay=main_w-overlay_w-${PADDING}:main_h-overlay_h-${PADDING}[out]`;

  let mainDurationSec = 0;
  try {
    const meta = await new Promise<{ format: { duration?: string | number } }>((res, rej) => {
      ffmpeg.ffprobe(absoluteInput, (err, data) => (err ? rej(err) : res(data as any)));
    });
    const d = meta?.format?.duration;
    if (d != null) mainDurationSec = typeof d === 'number' ? d : parseFloat(String(d)) || 0;
    if (mainDurationSec <= 0 && meta?.format?.duration) mainDurationSec = timemarkToSeconds(String(meta.format.duration));
  } catch {
    // ignore
  }

  // Limit output duration to main video length so FFmpeg stops (overlay has -stream_loop -1 and would otherwise never end).
  const durationArg = mainDurationSec > 0 ? ['-t', String(mainDurationSec)] : [];

  // Write to tmp_<name>.mp4 first; rename to final only after ffprobe OK (avoids leaving corrupt output if killed).
  // Use libx264 only (no VideoToolbox) to avoid hang/corruption; low memory.
  const args = [
    '-nostdin',
    '-i', absoluteInput,
    '-stream_loop', '-1', '-i', absoluteGame,
    '-filter_complex', overlayFilter,
    '-map', '[out]', '-map', '0:a?',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-threads', '1', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart',
    ...durationArg,
    '-y', absoluteOutTmp,
  ];

  return new Promise((resolve, reject) => {
    let lastPercent = -1;
    const stderrChunks: string[] = [];
    logger.info('Adding game overlay (libx264, low memory)...');
    console.log('Adding game overlay. Re-encoding video — wait for progress.');

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrChunks.push(text);
      const lines = text.split('\n');
      for (const line of lines) {
        const sec = parseTimeFromStderr(line);
        if (sec != null && mainDurationSec > 0) {
          const pct = Math.min(100, Math.round((sec / mainDurationSec) * 100));
          if (pct >= 0 && pct !== lastPercent && (pct % 10 === 0 || pct >= 100)) {
            lastPercent = pct;
            if (lastPercent > 100) return;
            const msg = `  Progress: ${pct}%`;
            logger.info(msg);
            console.log(msg);
          }
        }
      }
    });

    proc.on('close', async (code, signal) => {
      if (code !== 0) {
        const stderrTail = stderrChunks.join('').trim().split('\n').filter(Boolean).slice(-25).join('\n');
        const err = signal ? `killed (${signal})` : `exit code ${code}`;
        logger.error(`Game overlay error: ${err}`);
        if (stderrTail) {
          console.error('FFmpeg stderr (last lines):\n' + stderrTail);
          logger.error('FFmpeg stderr: ' + stderrTail.replace(/\n/g, ' '));
        }
        try { await fs.unlink(absoluteOutTmp); } catch { /* ignore */ }
        reject(
          new Error(
            stderrTail
              ? `FFmpeg failed (${err}). Last output:\n${stderrTail}`
              : `FFmpeg failed: ${err}. If you got SIGKILL, run in Terminal.app/iTerm.`
          )
        );
        return;
      }
      // Verify .tmp is valid (e.g. has moov atom) before renaming to final path
      try {
        await new Promise<void>((res, rej) => {
          ffmpeg.ffprobe(absoluteOutTmp, (err, data) => {
            if (err) return rej(err);
            const dur = data?.format?.duration;
            const hasVideo = data?.streams?.some((s: { codec_type?: string }) => s.codec_type === 'video');
            if (!hasVideo || (dur != null && Number(dur) <= 0)) return rej(new Error('Output has no valid video'));
            res();
          });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error(`Output invalid or corrupt: ${msg}`);
        try { await fs.unlink(absoluteOutTmp); } catch { /* ignore */ }
        reject(
          new Error(
            msg.includes('moov') || msg.includes('Invalid data')
              ? `Output MP4 incomplete (moov not found). FFmpeg may have been interrupted. Original unchanged. Re-run the overlay.`
              : `Output file is corrupt or invalid. Original was not modified.`
          )
        );
        return;
      }
      try {
        await fs.rename(absoluteOutTmp, absoluteOut);
      } catch (renameErr) {
        try { await fs.unlink(absoluteOutTmp); } catch { /* ignore */ }
        reject(new Error(`Could not rename temp file: ${renameErr}`));
        return;
      }
      logger.info(`Game overlay added: ${path.basename(absoluteOut)}`);
      console.log('Done.');
      resolve(absoluteOut);
    });
    proc.on('error', (err) => {
      logger.error(`Game overlay error: ${err.message}`);
      reject(err);
    });
  });
}
