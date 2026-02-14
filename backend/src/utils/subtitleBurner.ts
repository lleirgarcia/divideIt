import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger';
import { parseSrt, segmentsToAss } from './subtitleUtils';
import { generateSubtitleCueImage } from './videoTextOverlayCanvas';

/** Escape text for FFmpeg drawtext: commas must be escaped so the filter chain is not split */
function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .replace(/\n/g, ' ')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Burn subtitles using drawtext (no libass). Commas in enable='between(t,a,b)' are escaped.
 */
async function burnWithDrawtext(
  absoluteVideoPath: string,
  tempOutputPath: string,
  segments: Array<{ start: number; end: number; text: string }>
): Promise<boolean> {
  if (segments.length === 0) return false;
  const maxCues = 80;
  const cues = segments.slice(0, maxCues);

  const filterParts = cues.map((s) => {
    const start = Number(s.start).toFixed(3);
    const end = Number(s.end).toFixed(3);
    const text = escapeDrawtext(s.text.trim());
    return `drawtext=text='${text}':enable='between(t\\,${start}\\,${end})':x=(w-text_w)/2:y=h-180:fontsize=32:fontcolor=white:borderw=2:bordercolor=black@0.9:box=1:boxcolor=black@0.75:boxborderw=12`;
  });
  const filterStr = filterParts.join(',');

  return new Promise((resolve) => {
    ffmpeg(absoluteVideoPath)
      .videoFilters([filterStr])
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a copy',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
      ])
      .output(tempOutputPath)
      .on('end', () => {
        logger.info('Drawtext subtitle burn succeeded');
        resolve(true);
      })
      .on('error', (err) => {
        logger.warn(`Drawtext subtitle burn failed: ${err.message}`);
        resolve(false);
      })
      .run();
  });
}

/**
 * Burn subtitles by generating one PNG per cue with Canvas and overlaying with FFmpeg.
 * Works on any FFmpeg (no libass/drawtext required). Used when other methods fail.
 */
async function burnWithCanvasOverlay(
  absoluteVideoPath: string,
  tempOutputPath: string,
  segments: Array<{ start: number; end: number; text: string }>,
  videoWidth: number,
  videoHeight: number
): Promise<boolean> {
  const maxCues = 40;
  const cues = segments.slice(0, maxCues);
  const baseDir = path.dirname(absoluteVideoPath);
  const pngPaths: string[] = [];

  try {
    for (let i = 0; i < cues.length; i++) {
      const s = cues[i];
      const pngPath = path.join(baseDir, `_sub_cue_${i}.png`);
      await generateSubtitleCueImage(s.text.trim(), pngPath, videoWidth, videoHeight);
      pngPaths.push(pngPath);
    }

    const filterParts: string[] = [];
    for (let i = 0; i < cues.length; i++) {
      const s = cues[i];
      const start = Number(s.start).toFixed(3);
      const end = Number(s.end).toFixed(3);
      const prev = i === 0 ? '[0:v]' : `[v${i}]`;
      const curr = `[${i + 1}:v]`;
      const next = i === cues.length - 1 ? '[out]' : `[v${i + 1}]`;
      filterParts.push(
        `${prev}${curr}overlay=x=(w-overlay_w)/2:y=h-overlay_h-180:enable='between(t\\,${start}\\,${end})'${next}`
      );
    }
    const filterStr = filterParts.join(';');
    logger.info(`Canvas overlay: ${cues.length} cues, filter length ${filterStr.length}`);

    return new Promise((resolve) => {
      const cmd = ffmpeg(absoluteVideoPath);
      pngPaths.forEach((p) => cmd.input(p));
      cmd
        .complexFilter([filterStr])
        .outputOptions([
          '-map', '[out]',
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p',
        ])
        .output(tempOutputPath)
        .on('end', () => resolve(true))
        .on('error', (err) => {
          logger.warn(`Canvas overlay subtitle burn failed: ${err.message}`);
          resolve(false);
        })
        .run();
    });
  } finally {
    for (const p of pngPaths) {
      fs.unlink(p).catch(() => {});
    }
  }
}

function getVideoDimensions(videoPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const v = metadata.streams?.find((s) => s.codec_type === 'video');
      if (!v) {
        reject(new Error('No video stream'));
        return;
      }
      resolve({ width: v.width || 1080, height: v.height || 1920 });
    });
  });
}

/**
 * Burn SRT subtitles into the video. Tries subtitles filter (libass) first;
 * then drawtext; then Canvas+overlay (works on any FFmpeg).
 *
 * @param videoPath - Path to the video file (will be replaced by the version with subtitles)
 * @param srtPath - Path to the SRT file
 * @returns Path to the video with burned subtitles, or videoPath unchanged if all methods fail
 */
export async function burnSubtitlesIntoVideo(
  videoPath: string,
  srtPath: string
): Promise<string> {
  const absoluteVideoPath = path.resolve(videoPath);
  const absoluteSrtPath = path.resolve(srtPath);

  let srtContent: string;
  try {
    srtContent = await fs.readFile(absoluteSrtPath, 'utf-8');
  } catch {
    logger.warn(`SRT file not found for burning: ${srtPath}`);
    return videoPath;
  }

  const segments = parseSrt(srtContent);
  if (segments.length === 0) {
    logger.warn(`No subtitle cues found in ${srtPath}`);
    return videoPath;
  }

  const tempOutputPath = absoluteVideoPath.replace(/\.mp4$/, '_with_subs.mp4');

  /** Try burning with subtitles filter (libass) using the given subtitle file path */
  const trySubtitlesFilterWithFile = (subPath: string, label: string): Promise<string | null> =>
    new Promise((resolve) => {
      const escaped = subPath.replace(/\\/g, '/').replace(/'/g, "'\\''");
      ffmpeg(absoluteVideoPath)
        .videoFilters([`subtitles='${escaped}'`])
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a copy',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
        ])
        .output(tempOutputPath)
        .on('start', () => logger.info(`Burning subtitles (${label}): ${path.basename(videoPath)}`))
        .on('end', async () => {
          try {
            await fs.rename(tempOutputPath, absoluteVideoPath);
            logger.info(`Subtitles burned into ${path.basename(videoPath)}`);
            resolve(absoluteVideoPath);
          } catch (err) {
            logger.warn(`Failed to replace video: ${err}`);
            try {
              await fs.unlink(tempOutputPath);
            } catch {
              // ignore
            }
            resolve(null);
          }
        })
        .on('error', async (err) => {
          logger.warn(`Subtitles filter failed (${label}): ${err.message}`);
          try {
            await fs.unlink(tempOutputPath);
          } catch {
            // ignore
          }
          resolve(null);
        })
        .run();
    });

  // 1) Prefer ASS (we control position: bottom center, MarginV=80)
  const assPath = absoluteVideoPath.replace(/\.mp4$/, '_temp_subs.ass');
  try {
    await fs.writeFile(assPath, segmentsToAss(segments), 'utf-8');
    const result = await trySubtitlesFilterWithFile(assPath, 'libass+ASS');
    await fs.unlink(assPath).catch(() => {});
    if (result !== null) {
      logger.info('Subtitles burned with ASS + libass');
      return result;
    }
  } catch (e) {
    logger.warn(`ASS burn failed: ${e}`);
    await fs.unlink(assPath).catch(() => {});
  }

  // 2) Try SRT with subtitles filter
  const resultSrt = await trySubtitlesFilterWithFile(absoluteSrtPath, 'libass+SRT');
  if (resultSrt !== null) return resultSrt;

  // 3) Fallback: drawtext (no libass)
  logger.info('Trying drawtext fallback for subtitles');
  let drawtextOk = await burnWithDrawtext(absoluteVideoPath, tempOutputPath, segments);
  if (drawtextOk) {
    try {
      await fs.rename(tempOutputPath, absoluteVideoPath);
      logger.info(`Subtitles burned into ${path.basename(videoPath)} (drawtext)`);
      return absoluteVideoPath;
    } catch (err) {
      logger.warn(`Failed to replace video: ${err}`);
      try {
        await fs.unlink(tempOutputPath);
      } catch {
        // ignore
      }
    }
  }

  // 4) Fallback: Canvas + overlay (works on any FFmpeg, no libass/drawtext)
  logger.info('Trying Canvas+overlay for subtitles (no libass/drawtext required)');
  let dimensions: { width: number; height: number };
  try {
    dimensions = await getVideoDimensions(absoluteVideoPath);
  } catch (e) {
    logger.warn(`Could not get video dimensions: ${e}`);
    return videoPath;
  }
  const canvasOk = await burnWithCanvasOverlay(
    absoluteVideoPath,
    tempOutputPath,
    segments,
    dimensions.width,
    dimensions.height
  );
  if (!canvasOk) {
    return videoPath;
  }
  try {
    await fs.rename(tempOutputPath, absoluteVideoPath);
    logger.info(`Subtitles burned into ${path.basename(videoPath)} (Canvas+overlay)`);
    return absoluteVideoPath;
  } catch (err) {
    logger.warn(`Failed to replace video with subtitled version: ${err}`);
    try {
      await fs.unlink(tempOutputPath);
    } catch {
      // ignore
    }
    return videoPath;
  }
}
