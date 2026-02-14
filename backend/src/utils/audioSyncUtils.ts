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

/** Silence detection filter; same params for first-sound and full intervals. */
const SILENCE_OPTS = ['-af', 'silencedetect=n=-50dB:d=0.5', '-f', 'null'];

function runSilencedetect(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  return new Promise((resolve, reject) => {
    let stderr = '';
    ffmpeg(absolutePath)
      .outputOptions(SILENCE_OPTS)
      .output('-')
      .on('stderr', (line: string) => {
        stderr += line + '\n';
      })
      .on('end', () => resolve(stderr))
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Detect when the first sound (end of leading silence) occurs in a video/audio file.
 * Uses FFmpeg silencedetect: if there is leading silence 0..T, returns T; otherwise 0.
 */
export function getFirstSoundTime(filePath: string): Promise<number> {
  return runSilencedetect(filePath)
    .then((stderr) => parseFirstSoundFromSilencedetect(stderr))
    .catch((err) => {
      logger.warn(`Silencedetect failed for ${path.basename(filePath)}: ${err.message}, assuming 0`);
      return 0;
    });
}

/**
 * Get all silence intervals [start, end] in seconds. Used to trim subtitles so they only show during speech.
 */
export function getSilenceIntervals(filePath: string): Promise<Array<[number, number]>> {
  return runSilencedetect(filePath)
    .then((stderr) => parseAllSilenceIntervals(stderr))
    .catch((err) => {
      logger.warn(`Silencedetect failed for ${path.basename(filePath)}: ${err.message}`);
      return [];
    });
}

/**
 * Parse full silencedetect output into ordered [start, end] pairs for each silence.
 */
function parseAllSilenceIntervals(stderr: string): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  let lastStart: number | null = null;
  const lines = stderr.split('\n');
  for (const line of lines) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    const endMatch = line.match(/silence_end:\s*([\d.]+)/);
    if (startMatch) lastStart = parseFloat(startMatch[1]);
    if (endMatch && lastStart !== null) {
      pairs.push([lastStart, parseFloat(endMatch[1])]);
      lastStart = null;
    }
  }
  return pairs;
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

/** Minimum duration (seconds) for a cue after trimming to avoid flicker. */
const MIN_CUE_DURATION = 0.2;

/**
 * Trim subtitle segments so they only appear during speech (not during silence).
 * Each cue is trimmed to the part that overlaps "sound" (non-silence); if a cue spans
 * speech-silence-speech we keep only the single longest speech part to avoid duplicating text.
 * If a cue falls entirely in detected silence we keep it unchanged so we don't lose content.
 */
export async function trimSegmentsToSoundOnly(
  segments: SubtitleSegment[],
  videoPath: string
): Promise<SubtitleSegment[]> {
  if (!segments.length) return segments;
  const absolutePath = path.resolve(videoPath);
  const [silenceIntervals, duration] = await Promise.all([
    getSilenceIntervals(absolutePath),
    getVideoDuration(absolutePath).catch(() => 0),
  ]);
  if (!silenceIntervals.length) return clampSegmentsToDuration(segments, duration);

  const soundIntervals = buildSoundIntervals(silenceIntervals, duration);
  const result: SubtitleSegment[] = [];
  for (const seg of segments) {
    const subRanges = intersect(seg.start, seg.end, soundIntervals);
    if (subRanges.length === 0) {
      result.push(seg);
      continue;
    }
    const best = subRanges.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
    if (best[1] - best[0] >= MIN_CUE_DURATION) {
      result.push({ start: best[0], end: best[1], text: seg.text });
    } else {
      result.push(seg);
    }
  }
  logger.info(`Subtitle trim: ${segments.length} cues (only during speech, no duplicate text)`);
  return result;
}

/** Build [start, end] intervals where there is sound (complement of silence in [0, duration]). */
function buildSoundIntervals(silence: Array<[number, number]>, duration: number): Array<[number, number]> {
  const sound: Array<[number, number]> = [];
  let t = 0;
  const sorted = [...silence].sort((a, b) => a[0] - b[0]);
  for (const [s, e] of sorted) {
    if (t < s) sound.push([t, Math.min(s, duration)]);
    t = Math.max(t, e);
  }
  if (t < duration) sound.push([t, duration]);
  return sound;
}

/** Intersect [a, b] with sound intervals; return list of [start, end] sub-ranges. */
function intersect(a: number, b: number, soundIntervals: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const [s, e] of soundIntervals) {
    const start = Math.max(a, s);
    const end = Math.min(b, e);
    if (end > start) out.push([start, end]);
  }
  return out;
}

/** Minimum duration (seconds) for a silence cue in the SRT (avoid tiny gaps). */
const MIN_SILENCE_CUE_DURATION = 0.3;

/**
 * Add silence segments (empty text) between speech segments so the SRT covers the full timeline.
 * Speech segments keep their text; silence intervals become cues with empty text.
 * When burned, only cues with text are shown, so the file defines every second (speech or silence).
 */
export async function addSilenceSegments(
  speechSegments: SubtitleSegment[],
  videoPath: string
): Promise<SubtitleSegment[]> {
  if (!speechSegments.length) return speechSegments;
  const absolutePath = path.resolve(videoPath);
  const [silenceIntervals, duration] = await Promise.all([
    getSilenceIntervals(absolutePath),
    getVideoDuration(absolutePath).catch(() => 0),
  ]);
  if (!duration || duration <= 0 || !silenceIntervals.length) return speechSegments;

  const sortedSilence = [...silenceIntervals].sort((a, b) => a[0] - b[0]);
  const silenceSegments: SubtitleSegment[] = [];
  for (const [s, e] of sortedSilence) {
    const start = Math.max(0, s);
    const end = Math.min(duration, e);
    if (end - start >= MIN_SILENCE_CUE_DURATION) silenceSegments.push({ start, end, text: '' });
  }
  const combined = [...speechSegments, ...silenceSegments].sort((a, b) => a.start - b.start);
  logger.info(`SRT timeline: ${speechSegments.length} speech + ${silenceSegments.length} silence cues`);
  return combined;
}
