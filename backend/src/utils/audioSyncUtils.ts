/**
 * General utilities to align subtitle timestamps with the actual video timeline.
 * Works for any video: detects when sound/speech starts (leading silence or not),
 * shifts the subtitle timeline to match, and clamps to video duration.
 */

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { logger } from './logger';
import type { SubtitleSegment } from './subtitleUtils';

/** Minimum offset (seconds) to apply; avoid tiny shifts that could be noise. */
const MIN_OFFSET_SEC = 0.3;

/**
 * Detect when the first sound (end of leading silence) occurs in a video/audio file.
 * Uses FFmpeg silencedetect: if there is leading silence 0..T, returns T; otherwise 0.
 */
export function getFirstSoundTime(filePath: string): Promise<number> {
  const absolutePath = path.resolve(filePath);
  return new Promise((resolve) => {
    let stderr = '';
    ffmpeg(absolutePath)
      .outputOptions([
        '-af', 'silencedetect=n=-50dB:d=0.5',
        '-f', 'null',
      ])
      .output('-')
      .on('stderr', (line: string) => {
        stderr += line + '\n';
      })
      .on('end', () => {
        const firstSound = parseFirstSoundFromSilencedetect(stderr);
        resolve(firstSound);
      })
      .on('error', (err) => {
        logger.warn(`Silencedetect failed for ${path.basename(filePath)}: ${err.message}, assuming 0`);
        resolve(0);
      })
      .run();
  });
}

/**
 * Parse FFmpeg silencedetect stderr for the first moment when sound starts.
 * - If the first event is "silence_end: T", we had leading silence 0..T, return T.
 * - If the first event is "silence_start: X" with X > 0, sound was from 0, return 0.
 * - If the first event is "silence_start: 0", the next "silence_end: T" is when sound starts, return T.
 */
function parseFirstSoundFromSilencedetect(stderr: string): number {
  const lines = stderr.split('\n');
  let seenSilenceStartZero = false;
  for (const line of lines) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    const endMatch = line.match(/silence_end:\s*([\d.]+)/);
    if (startMatch) {
      const t = parseFloat(startMatch[1]);
      if (t <= 0) seenSilenceStartZero = true;
      else return 0; // First silence starts after 0 => sound from start
    }
    if (endMatch) {
      const t = parseFloat(endMatch[1]);
      // First silence_end is end of leading silence (sound starts at t)
      if (t > 0) return t;
      if (seenSilenceStartZero) return t;
    }
  }
  return 0;
}

/**
 * Get video duration in seconds (from first video stream).
 */
export function getVideoDuration(filePath: string): Promise<number> {
  const absolutePath = path.resolve(filePath);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(absolutePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
      if (!videoStream?.duration) {
        const dur = metadata.format?.duration;
        resolve(typeof dur === 'number' ? dur : 0);
        return;
      }
      resolve(Number(videoStream.duration) || metadata.format?.duration || 0);
    });
  });
}

/**
 * Align subtitle segments to the video timeline in a general way:
 * 1. Detect when sound actually starts in the video (leading silence or from 0).
 * 2. Compute offset = firstSoundTime - firstSubtitleStart (positive or negative).
 * 3. Shift all segments by that offset so subtitles match when the user speaks.
 * 4. Clamp to [0, duration] and drop segments that end up entirely out of range.
 * Works for any video regardless of where speech starts (0s, 5s, 13s, etc.).
 */
export async function alignSubtitleSegmentsToVideo(
  segments: SubtitleSegment[],
  videoPath: string
): Promise<SubtitleSegment[]> {
  if (!segments.length) return segments;
  const absolutePath = path.resolve(videoPath);

  const [firstSoundTime, duration] = await Promise.all([
    getFirstSoundTime(absolutePath),
    getVideoDuration(absolutePath).catch(() => 0),
  ]);

  const firstStart = segments[0].start;
  let offset = firstSoundTime - firstStart;
  if (Math.abs(offset) < MIN_OFFSET_SEC) return clampSegmentsToDuration(segments, duration);

  const aligned: SubtitleSegment[] = [];
  for (const s of segments) {
    let start = s.start + offset;
    let end = s.end + offset;
    if (end <= 0 || start >= (duration || Infinity)) continue;
    start = Math.max(0, start);
    end = duration > 0 ? Math.min(duration, end) : end;
    if (start >= end) continue;
    aligned.push({ start, end, text: s.text });
  }
  logger.info(
    `Subtitle alignment: first sound at ${firstSoundTime.toFixed(1)}s, offset ${offset >= 0 ? '+' : ''}${offset.toFixed(1)}s, duration ${duration.toFixed(1)}s`
  );
  return aligned.length ? aligned : segments;
}

/** Clamp segment start/end to [0, duration] and drop invalid ones. */
function clampSegmentsToDuration(segments: SubtitleSegment[], duration: number): SubtitleSegment[] {
  if (!duration || duration <= 0) return segments;
  return segments
    .map((s) => ({
      start: Math.max(0, s.start),
      end: Math.min(duration, s.end),
      text: s.text,
    }))
    .filter((s) => s.end > s.start);
}
