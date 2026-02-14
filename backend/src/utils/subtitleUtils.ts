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
 * Merge word-level segments (e.g. from AssemblyAI/Deepgram) into phrase-level cues
 * for readable subtitles (roughly 1–2 lines, 3–5 seconds max per cue).
 */
export function mergeSubtitleSegments(
  segments: SubtitleSegment[],
  options: { maxWordsPerCue?: number; maxDurationSec?: number; minDurationSec?: number } = {}
): SubtitleSegment[] {
  const { maxWordsPerCue = 10, maxDurationSec = 5, minDurationSec = 0.3 } = options;
  if (!segments.length) return [];

  const isWordLevel =
    segments.length > 5 &&
    segments.every((s) => s.end - s.start < 1.5 && (s.text?.split(/\s+/).length ?? 1) <= 2);
  if (!isWordLevel) {
    return segments.filter((s) => s.text.trim().length > 0);
  }

  const merged: SubtitleSegment[] = [];
  let acc: { start: number; end: number; words: string[] } = {
    start: segments[0].start,
    end: segments[0].end,
    words: [segments[0].text.trim()].filter(Boolean),
  };

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const wordCount = acc.words.length + (seg.text?.trim() ? seg.text.trim().split(/\s+/).length : 0);
    const duration = seg.end - acc.start;

    if (
      wordCount <= maxWordsPerCue &&
      duration <= maxDurationSec &&
      seg.start - acc.end <= 0.5
    ) {
      acc.end = seg.end;
      if (seg.text?.trim()) acc.words.push(seg.text.trim());
    } else {
      if (acc.words.length > 0 && acc.end - acc.start >= minDurationSec) {
        merged.push({
          start: acc.start,
          end: acc.end,
          text: acc.words.join(' '),
        });
      }
      acc = {
        start: seg.start,
        end: seg.end,
        words: seg.text?.trim() ? [seg.text.trim()] : [],
      };
    }
  }
  if (acc.words.length > 0 && acc.end - acc.start >= minDurationSec) {
    merged.push({ start: acc.start, end: acc.end, text: acc.words.join(' ') });
  }
  return merged;
}

/**
 * Convert segments to SRT content.
 */
export function segmentsToSrt(segments: SubtitleSegment[]): string {
  const merged = mergeSubtitleSegments(segments);
  return merged
    .map(
      (s, i) =>
        `${i + 1}\n${formatSrtTime(s.start)} --> ${formatSrtTime(s.end)}\n${s.text.trim()}\n`
    )
    .join('\n');
}

/**
 * Convert segments to WebVTT content.
 */
export function segmentsToVtt(segments: SubtitleSegment[]): string {
  const merged = mergeSubtitleSegments(segments);
  const header = 'WEBVTT\n\n';
  const body = merged
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
Style: Default,Arial,28,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = merged.map((s) => {
    const text = s.text.trim().replace(/\n/g, '\\N').replace(/\r/g, '');
    return `Dialogue: 0,${formatAssTime(s.start)},${formatAssTime(s.end)},Default,,0,0,0,,${text}`;
  });
  return header + lines.join('\n');
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
