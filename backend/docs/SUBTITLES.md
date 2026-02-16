# Subtitle Generation (Speech-Synced Subtitles)

## Overview

Processed video segments get **speech-synced subtitles** derived from the same transcription used for the .txt and summary. Subtitles are generated in two ways:

1. **Sidecar files** (always): `.srt` and `.vtt` next to each segment, synced to what is being said.
2. **Burned-in** (optional): Subtitles can be burned into the video when FFmpeg is built with **libass**.

## How It Works

1. **Transcription** returns timestamped segments (from OpenAI Whisper `verbose_json`, or AssemblyAI/Deepgram word-level data).
2. **Phrase merging**: Word-level segments (e.g. from AssemblyAI/Deepgram) are merged into readable phrase-level cues (~3–5 seconds, ~10 words max).
3. **SRT and VTT** are written next to each segment: `segment_N_uuid.srt`, `segment_N_uuid.vtt`.
4. **Burning** (if available): FFmpeg’s `subtitles` filter burns the SRT into the video. If libass is not available, burning is skipped and the sidecar files are still produced.

## File Structure

After processing, each segment can have:

- `segment_N_uuid.mp4` – Video (with title overlay and, when possible, burned subtitles)
- `segment_N_uuid.txt` – Full transcription
- `segment_N_uuid.srt` – Subtitle file (SRT)
- `segment_N_uuid.vtt` – Subtitle file (WebVTT)
- `segment_N_uuid_summary.txt` – Summary
- `clipN_caption.txt` – Caption / social description
- `segment_N_uuid_social_title.txt` – Title used for overlay

## Using Subtitles

- **YouTube / TikTok / Instagram**: Upload the `.srt` or `.vtt` as a caption track, or use the version with burned-in subtitles if available.
- **Players**: Most players (VLC, browser `<video>` with track, etc.) can load the `.srt` or `.vtt` file alongside the video.
- **Burned-in**: If burning succeeded, the same text is already visible on the video; sidecar files remain useful for accessibility and re-use.

## Burning (incrustar en el video)

Incrustar los subtítulos en el propio video se hace en dos pasos:

1. **Primero** se intenta el filtro **subtitles** (requiere FFmpeg con **libass**). Da el mejor resultado.
2. **Si falla** (por ejemplo en instalaciones sin libass), se usa el filtro **drawtext**, que no requiere libass y funciona con cualquier FFmpeg.

Así, los subtítulos se incrustan en el video siempre que sea posible, sin depender de libass. Los archivos `.srt` y `.vtt` se generan en todos los casos.

- **Con libass**: `ffmpeg -filters | grep subtitles` debe listar el filtro.
- **Sin libass**: se usa drawtext automáticamente (texto blanco con borde negro, centrado abajo).

## If your FFmpeg has no libass or drawtext

Many Homebrew FFmpeg builds (e.g. macOS) are compiled **without libass** and **without drawtext**. In that case the burner uses **Canvas + overlay**:

1. Each subtitle cue is rendered as a PNG with Node Canvas (same style as the title overlay).
2. FFmpeg’s **overlay** filter (always present) shows each PNG at the right time with `enable=between(t,start,end)`.
3. No libass or drawtext is required; the final MP4 has subtitles burned in.

So subtitles are burned in all environments. To get libass/drawtext (smaller filter graph, no temp PNGs), install FFmpeg with libass and freetype (e.g. `brew reinstall ffmpeg` and check `brew options ffmpeg` for `--with-libass` if available).

## Technical Details

- **Utils**: `backend/src/utils/subtitleUtils.ts` – `segmentsToSrt()`, `segmentsToVtt()`, `segmentsToAss()`, `mergeSubtitleSegments()`.
- **Burning**: `backend/src/utils/subtitleBurner.ts` – `burnSubtitlesIntoVideo(videoPath, srtPath)`. Tries in order: ASS (libass), SRT (libass), drawtext, then Canvas+overlay.
- **Integration**: `videoProcessor.ts` and `videoService.ts` write SRT/VTT after transcription, then call the burner so the MP4 is created with embedded subtitles.
