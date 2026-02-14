/**
 * Subtitle utilities: convert transcription segments to SRT/VTT and merge word-level cues.
 */

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Format seconds as SRT timestamp: HH:MM:SS,mmm
 */
function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Format seconds as VTT timestamp: HH:MM:SS.mmm
 */
function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Expand phrase-level segments into word-level by splitting text and interpolating time.
 * Produces one cue per word (or short token) for karaoke-style / word-by-word subtitles.
 */
function expandToWordLevel(segments: SubtitleSegment[]): SubtitleSegment[] {
  const result: SubtitleSegment[] = [];
  const minCueDuration = 0.2;

  for (const s of segments) {
    const text = s.text.trim();
    if (!text) continue;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    if (words.length === 1) {
      result.push({ start: s.start, end: s.end, text: words[0] });
      continue;
    }
    const duration = s.end - s.start;
    const step = duration / words.length;
    for (let i = 0; i < words.length; i++) {
      const start = s.start + i * step;
      const end = i === words.length - 1 ? s.end : s.start + (i + 1) * step;
      if (end - start >= minCueDuration) {
        result.push({ start, end, text: words[i] });
      } else {
        const last = result[result.length - 1];
        if (last && last.end - last.start < 2) {
          last.end = end;
          last.text = last.text + ' ' + words[i];
        } else {
          result.push({ start, end: start + minCueDuration, text: words[i] });
        }
      }
    }
  }
  return result;
}

/**
 * Normalize segments to word-level: if any segment has multiple words, expand all to one word per segment (with interpolated times).
 */
function normalizeToWordLevel(segments: SubtitleSegment[]): SubtitleSegment[] {
  const filtered = segments.filter((s) => s.text.trim().length > 0);
  if (!filtered.length) return [];
  const hasPhrases = filtered.some((s) => s.text.trim().split(/\s+/).length > 1);
  if (!hasPhrases) return filtered;
  return expandToWordLevel(filtered);
}

/**
 * Merge word-level segments into cues of 5 words per cue (min and max 5 when possible).
 * Always normalizes to word-level first, then merges. Only outputs a cue when we have at least minWordsPerCue words (except at the end).
 */
export function mergeSubtitleSegments(
  segments: SubtitleSegment[],
  options: { maxWordsPerCue?: number; minWordsPerCue?: number; maxDurationSec?: number; minDurationSec?: number; maxGapSec?: number } = {}
): SubtitleSegment[] {
  const { maxWordsPerCue = 5, minWordsPerCue = 5, maxDurationSec = 5, minDurationSec = 0.2, maxGapSec = 1 } = options;
  if (!segments.length) return [];

  const wordLevel = normalizeToWordLevel(segments);
  if (!wordLevel.length) return [];

  const merged: SubtitleSegment[] = [];
  let acc: { start: number; end: number; words: string[] } = {
    start: wordLevel[0].start,
    end: wordLevel[0].end,
    words: [wordLevel[0].text.trim()].filter(Boolean),
  };

  for (let i = 1; i < wordLevel.length; i++) {
    const seg = wordLevel[i];
    const extraWords = seg.text?.trim() ? seg.text.trim().split(/\s+/).length : 0;
    const wordCount = acc.words.length + extraWords;
    const duration = seg.end - acc.start;
    const gap = seg.start - acc.end;

    if (wordCount <= maxWordsPerCue && duration <= maxDurationSec && gap <= maxGapSec) {
      acc.end = seg.end;
      if (seg.text?.trim()) acc.words.push(seg.text.trim());
    } else {
      if (acc.words.length >= minWordsPerCue && acc.end - acc.start >= minDurationSec) {
        merged.push({
          start: acc.start,
          end: acc.end,
          text: acc.words.join(' '),
        });
        acc = {
          start: seg.start,
          end: seg.end,
          words: seg.text?.trim() ? [seg.text.trim()] : [],
        };
      } else {
        acc.end = seg.end;
        if (seg.text?.trim()) acc.words.push(seg.text.trim());
      }
    }
  }
  if (acc.words.length > 0 && acc.end - acc.start >= minDurationSec) {
    merged.push({ start: acc.start, end: acc.end, text: acc.words.join(' ') });
  }
  return merged;
}

/**
 * Convert segments to SRT content (with merge to 5 words per cue).
 */
export function segmentsToSrt(segments: SubtitleSegment[]): string {
  const merged = mergeSubtitleSegments(segments);
  return formatSegmentsToSrtRaw(merged);
}

/**
 * Format segments to SRT as-is (no merge). Use when segments already include silence cues (empty text).
 */
export function formatSegmentsToSrtRaw(segments: SubtitleSegment[]): string {
  return segments
    .map(
      (s, i) =>
        `${i + 1}\n${formatSrtTime(s.start)} --> ${formatSrtTime(s.end)}\n${s.text.trim()}\n`
    )
    .join('\n');
}

/**
 * Convert segments to WebVTT content (with merge to 5 words per cue).
 */
export function segmentsToVtt(segments: SubtitleSegment[]): string {
  const merged = mergeSubtitleSegments(segments);
  return formatSegmentsToVttRaw(merged);
}

/**
 * Format segments to WebVTT as-is (no merge). Use when segments already include silence cues (empty text).
 */
export function formatSegmentsToVttRaw(segments: SubtitleSegment[]): string {
  const header = 'WEBVTT\n\n';
  const body = segments
    .map(
      (s) =>
        `${formatVttTime(s.start)} --> ${formatVttTime(s.end)}\n${s.text.trim()}\n`
    )
    .join('\n');
  return header + body;
}

/**
 * Format seconds as ASS timestamp (H:MM:SS.cc - centiseconds)
 */
function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Convert segments to ASS file content (for subtitles filter with full style control).
 * Positioned at bottom center (Alignment=2, MarginV) for the red-zone area.
 */
export function segmentsToAss(segments: SubtitleSegment[]): string {
  const merged = mergeSubtitleSegments(segments);
  const header = `[Script Info]
Title: divideIt subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,10,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,65,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = merged.map((s) => {
    const text = s.text.trim().replace(/\n/g, '\\N').replace(/\r/g, '');
    return `Dialogue: 0,${formatAssTime(s.start)},${formatAssTime(s.end)},Default,,0,0,0,,${text}`;
  });
  return header + lines.join('\n');
}

/** Main subtitle line: MarginV=65 (~35px tall). Previous line just above with ~6px gap => MarginV=106. */
const ASS_PREVIOUS_MARGIN_V = 106;
const ASS_PREVIOUS_FONTSIZE = 5;
/** ASS PrimaryColour for previous line: &HAABBGGRR — 80 = ~50% transparent white. */
const ASS_PREVIOUS_COLOUR = '&H80FFFFFF';

/**
 * ASS content with two lines: current (main) and previous (small, 10px above).
 * While current segment is shown, the previous segment's text appears above in half size.
 */
export function segmentsToAssWithPreviousLine(segments: SubtitleSegment[]): string {
  if (!segments.length) return segmentsToAss(segments);
  const header = `[Script Info]
Title: divideIt subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,10,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,65,1
Style: Previous,Arial,${ASS_PREVIOUS_FONTSIZE},${ASS_PREVIOUS_COLOUR},&H800000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,${ASS_PREVIOUS_MARGIN_V},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const dialogueLines: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const text = s.text.trim().replace(/\n/g, '\\N').replace(/\r/g, '');
    if (i > 0) {
      const prevText = segments[i - 1].text.trim().replace(/\n/g, '\\N').replace(/\r/g, '');
      dialogueLines.push(`Dialogue: 0,${formatAssTime(s.start)},${formatAssTime(s.end)},Previous,,0,0,0,,${prevText}`);
    }
    dialogueLines.push(`Dialogue: 0,${formatAssTime(s.start)},${formatAssTime(s.end)},Default,,0,0,0,,${text}`);
  }
  return header + dialogueLines.join('\n');
}

/** Parse SRT timestamp "00:00:01,234" (HH:MM:SS,mmm) to seconds */
function srtTimestampToSeconds(s: string): number {
  const trimmed = s.trim();
  const comma = trimmed.indexOf(',');
  const timePart = comma >= 0 ? trimmed.slice(0, comma) : trimmed;
  const msPart = comma >= 0 ? parseInt(trimmed.slice(comma + 1), 10) || 0 : 0;
  const parts = timePart.split(':').map((p) => parseInt(p, 10) || 0);
  const h = parts.length >= 3 ? parts[0] : 0;
  const m = parts.length >= 3 ? parts[1] : parts[0] ?? 0;
  const sec = parts.length >= 3 ? parts[2] : parts[1] ?? 0;
  return h * 3600 + m * 60 + sec + msPart / 1000;
}

/**
 * Parse SRT file content into segments (for drawtext fallback).
 */
export function parseSrt(srtContent: string): SubtitleSegment[] {
  const blocks = srtContent.split(/\n\s*\n/).filter((b) => b.trim());
  const segments: SubtitleSegment[] = [];

  for (const block of blocks) {
    const lines = block.trim().split(/\n/);
    if (lines.length < 3) continue;
    const match = lines[1].match(/([\d:]+,\d{1,3})\s*-->\s*([\d:]+,\d{1,3})/);
    if (!match) continue;
    const start = srtTimestampToSeconds(match[1]);
    const end = srtTimestampToSeconds(match[2]);
    const text = lines.slice(2).join(' ').trim();
    if (text) segments.push({ start, end, text });
  }
  return segments;
}
