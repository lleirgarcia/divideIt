---
name: Video Splitting Scripts Inventory
description: Complete inventory of all video splitting/dividing scripts for Instagram, TikTok, and YouTube in divideIt
type: project
---

# divideIt: Video Splitting Scripts Inventory

Complete catalog of all scripts related to splitting and dividing videos for social media platforms (Instagram, TikTok, YouTube).

## Overview

The project contains **7 TypeScript scripts** for video processing, located in `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/` and `/Users/lleirgarcia/projects/2026/divideIt/scripts/`.

All scripts use the `videoProcessor.ts` utility which defines **4 presets** with specific format, resolution, animation, and duration settings.

---

## Presets Configuration (Master Reference)

All splitting scripts use these preset configurations from `backend/src/utils/videoProcessor.ts`:

| Preset | Format | Resolution | Animation | Segment Duration | Output Folder Prefix |
|--------|--------|-----------|-----------|------------------|----------------------|
| **tiktok** | Vertical | 1080×1920 | Space Invaders | 30-50 seconds | `tiktok_` |
| **instagram** | Horizontal | 1920×1080 | None | 30-50 seconds | `instagram_` |
| **instagram_zoom** | Vertical | 1080×1920 | None | 30-50 seconds | `instagram_zoom_` |
| **youtube_shorts** | Vertical | 1080×1920 | None | 30-60 seconds | `youtube_shorts_` |

### Output Format Details:
- **Vertical**: 1080×1920 px (9:16) — ideal for TikTok, Instagram Reels, YouTube Shorts
- **Horizontal**: 1920×1080 px (16:9) — ideal for Instagram Feed posts
- **Animation**: Space Invaders overlay (4 random themes) or None
- **Codec**: H.264 video, AAC audio
- **Quality**: CRF 23 (good quality/size balance)

---

## Script Inventory

### 1. **splitIg.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/splitIg.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/splitIg.ts
```

**Purpose**: Generate Instagram-optimized clips (horizontal format, no animation) for the `aqualityguy` account.

**Details**:
- Presets: `instagram` only
- Format: Horizontal (1920×1080)
- Animation: None
- Segment count: Min 1, Max 20 (auto-limited by video duration)
- Segment duration: 30-50 seconds
- Output directory: `processed/aqualityguy/instagram_<timestamp>/`

**Input**:
- Reads the **most recent video** from `uploads/` directory (supports .mp4, .mov, .avi)

**Output**:
- Creates folder: `processed/aqualityguy/instagram_<YYYYMMDD_HHMMSS>/`
- Files: `clip1.mp4`, `clip2.mp4`, etc.
- Moves clips to: `automateUploads/clip_folder/aqualityguy/`
- Deletes original video from `uploads/` on success

**Console Output Example**:
```
Cuenta: aqualityguy
Video: my-video.mp4
Duracion: 180.5s  Resolucion: 1920x1080

============================================================
PRESET: instagram
  format=horizontal  animation=none  dur=30-50s
============================================================
  Carpeta: aqualityguy/instagram_20260315_144530
  Completado: processed/aqualityguy/instagram_20260315_144530/clip1.mp4

✅ instagram_20260315_144530 → automateUploads/clip_folder/aqualityguy/...
Listo.
```

---

### 2. **splitIgYt.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/splitIgYt.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/splitIgYt.ts
```

**Purpose**: Generate clips for **Instagram Reels (zoomed vertical)** and **YouTube Shorts** simultaneously for `aqualityguy` account.

**Details**:
- Presets: `instagram_zoom`, `youtube_shorts`
- Formats: Both vertical (1080×1920)
- Animation: None (both presets)
- Segment count: Up to 20 per preset
- Segment duration: 30-50s (instagram_zoom), 30-60s (youtube_shorts)
- Output directories:
  - `processed/aqualityguy/instagram_zoom_<timestamp>/`
  - `processed/aqualityguy/youtube_shorts_<timestamp>/`

**Input**:
- Reads the **most recent video** from `uploads/` directory

**Output**:
- Two separate folder hierarchies created
- Each contains multiple clip files
- All clips moved to `automateUploads/clip_folder/aqualityguy/`
- Original video deleted on success

**Console Output Example**:
```
Cuenta: aqualityguy
Video: my-video.mp4
Duracion: 180.5s  Resolucion: 1920x1080

============================================================
PRESET: instagram_zoom
  format=vertical  animation=none  dur=30-50s
============================================================
  Completado: processed/aqualityguy/instagram_zoom_20260315_144530/clip1.mp4

============================================================
PRESET: youtube_shorts
  format=vertical  animation=none  dur=30-60s
============================================================
  Completado: processed/aqualityguy/youtube_shorts_20260315_144530/clip1.mp4

Presets procesados.
Listo.
```

---

### 3. **splitAll.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/splitAll.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/splitAll.ts [--account aqualityguy|agenticcmonkey]
```

**Purpose**: Generate clips for **all 4 presets** (TikTok, Instagram, Instagram Zoom, YouTube Shorts) for a specified account.

**Details**:
- Presets: `tiktok`, `instagram`, `instagram_zoom`, `youtube_shorts` (all run sequentially)
- Accounts: `aqualityguy` (default), `agenticcmonkey`
- Output directories: `processed/<account>/<preset>_<timestamp>/`
- Each preset creates independent segment folders

**Input**:
- Takes account from `--account` flag (defaults to `aqualityguy`)
- Reads the **most recent video** from `uploads/` directory

**Output**:
- 4 separate folder hierarchies under `processed/<account>/`
- Total files: up to 80 clips (20 per preset max)
- All clips moved to `automateUploads/clip_folder/<account>/`
- Original video deleted on success

**Examples**:
```bash
# Default account (aqualityguy)
npx tsx scripts/splitAll.ts

# Specific account
npx tsx scripts/splitAll.ts --account agenticcmonkey
```

**Console Output Example**:
```
Cuenta: aqualityguy
Video: my-video.mp4
Duracion: 180.5s  Resolucion: 1920x1080

============================================================
PRESET: tiktok
  format=vertical  animation=space_invaders  dur=30-50s
============================================================
  Completado: processed/aqualityguy/tiktok_20260315_144530/clip1.mp4

============================================================
PRESET: instagram
  format=horizontal  animation=none  dur=30-50s
============================================================
  Completado: processed/aqualityguy/instagram_20260315_144530/clip1.mp4

[... instagram_zoom and youtube_shorts ...]

Presets procesados.
Listo.
```

---

### 4. **testAllPresets.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/testAllPresets.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/testAllPresets.ts [--account aqualityguy|agenticcmonkey]
```

**Purpose**: Test script — generates **1 segment per preset** (not 20) to quickly validate all preset configurations without heavy processing.

**Details**:
- Presets: `tiktok`, `instagram`, `instagram_zoom`, `youtube_shorts`
- Segment count: 1 per preset (or `max(10, maxPossible)` for testing)
- Accounts: `aqualityguy` (default), `agenticcmonkey`
- Output directories: `processed/<account>/<preset>_<timestamp>/`

**Use Case**:
- Quick validation of all 4 preset outputs
- Faster than `splitAll.ts` (generates fewer clips)
- Useful for previewing how each preset handles a video

**Examples**:
```bash
# Test with default account
npx tsx scripts/testAllPresets.ts

# Test with specific account
npx tsx scripts/testAllPresets.ts --account agenticcmonkey
```

---

### 5. **splitHorizontal.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/scripts/splitHorizontal.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt
npx tsx scripts/splitHorizontal.ts <video-path> [numSegments] [minDuration] [maxDuration]
```

**Purpose**: Generic horizontal (16:9) video splitter with custom parameters. Not account-specific, outputs to local `processed/` folder.

**Details**:
- Format: Horizontal (1920×1080)
- Animation: None
- Customizable: Number of segments, min/max duration
- Output directory: `processed/<YYYYMMDD_HHMMSS>/`

**Parameters**:
- `<video-path>` (required): Path to input video (must be .mp4)
- `[numSegments]` (optional, default 3): Number of clips to generate
- `[minDuration]` (optional, default 5): Minimum segment duration (seconds)
- `[maxDuration]` (optional, default 60): Maximum segment duration (seconds)

**Examples**:
```bash
# Generate 3 clips from uploads/my-video.mp4, each 5-60 seconds
npx tsx scripts/splitHorizontal.ts uploads/my-video.mp4

# Generate 5 clips, each 10-30 seconds
npx tsx scripts/splitHorizontal.ts uploads/my-video.mp4 5 10 30

# Generate 2 clips, each 15-45 seconds
npx tsx scripts/splitHorizontal.ts uploads/my-video.mp4 2 15 45
```

**Console Output Example**:
```
Video: my-video.mp4
Duracion: 180.50s — Resolucion original: 3840x2160
Formato de salida: horizontal (1920x1080)
Segmentos: 3, duracion 5s–60s

Listo. 3 clips en: /Users/lleirgarcia/projects/2026/divideIt/processed/20260315_144530
  clip1.mp4 — 12.45s → 42.10s
  clip2.mp4 — 65.30s → 98.20s
  clip3.mp4 — 120.15s → 155.80s
```

---

### 6. **addGameOverlayToSegment.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/addGameOverlayToSegment.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/addGameOverlayToSegment.ts <path-to-segment.mp4>
```

**Purpose**: Post-process a video segment to **add Space Invaders game overlay** (bottom-right corner). Modifies the file in-place.

**Details**:
- Adds randomly selected Space Invaders theme overlay
- Re-encodes entire video (expensive operation)
- Updates both the original segment and mirror copy (_original_no_title.mp4)
- Game overlay positioned in bottom-right corner

**Input**:
- Path to segment file (relative to backend directory)
- File must end with `.mp4`

**Output**:
- Original file updated with overlay
- If `_original_no_title.mp4` exists, also copies overlay version to main segment file
- Example: `processed/8274685e-5dae-401a-9921-ce07e60c5739/segment_1_804596f6.mp4`

**Examples**:
```bash
npx tsx scripts/addGameOverlayToSegment.ts processed/aqualityguy/tiktok_20260315_144530/clip1.mp4

npx tsx scripts/addGameOverlayToSegment.ts processed/8274685e-5dae-401a-9921-ce07e60c5739/segment_1_804596f6-543d-4d8f-8ff4-fa6309b671e4.mp4
```

**Console Output Example**:
```
Adding game overlay to clip1.mp4
(Re-encoding the whole video — progress every 10%. If you get SIGKILL, run in Terminal.app/iTerm instead of Cursor.)
Done. Segment updated (game in bottom-right): clip1.mp4
Video path: /Users/lleirgarcia/projects/2026/divideIt/backend/processed/aqualityguy/tiktok_20260315_144530/clip1.mp4
```

**Warning**: ⚠️ This is a **re-encoding operation** — can be slow and memory-intensive. Best run in Terminal.app or iTerm2 to avoid SIGKILL from resource limits.

---

### 7. **generateSpaceInvadersVideo.ts**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/generateSpaceInvadersVideo.ts`

**Command**:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/generateSpaceInvadersVideo.ts
```

**Purpose**: **Build system script** — generates all Space Invaders theme loop videos used by the animation overlay system.

**Details**:
- Generates theme videos: `classic`, `retro_neon`, `pixel_art`, `cyberpunk`
- Output: `backend/assets/space_invaders_<theme>.mp4`
- Also creates backward-compatible: `space_invaders_loop.mp4` (copy of classic)
- Uses temporary frame directory, cleans up after encoding
- Encodes at 30 FPS, H.264, CRF 18

**Output Files** (in `backend/assets/`):
- `space_invaders_classic.mp4`
- `space_invaders_retro_neon.mp4`
- `space_invaders_pixel_art.mp4`
- `space_invaders_cyberpunk.mp4`
- `space_invaders_loop.mp4` (backward-compat link to classic)

**Use Case**:
- Run during **project setup** or when Space Invaders theme is updated
- Assets are checked into version control, so not needed for daily use
- Each theme is randomly selected when applying game overlay to TikTok clips

**Console Output Example**:
```
==================================================
Generating theme: classic
==================================================
  Generating frames...
  Encoding video...
  Done: /Users/lleirgarcia/projects/2026/divideIt/backend/assets/space_invaders_classic.mp4

==================================================
Generating theme: retro_neon
==================================================
  ...

Copied classic → space_invaders_loop.mp4 (backward compat)

All themes generated.
```

---

## Utility Script

### 8. **get-refresh-token.sh**
**Location**: `/Users/lleirgarcia/projects/2026/divideIt/backend/scripts/get-refresh-token.sh`

**Command**:
```bash
bash /Users/lleirgarcia/projects/2026/divideIt/backend/scripts/get-refresh-token.sh
```

**Purpose**: Interactive script to obtain **Google Drive OAuth2 refresh token** for the upload automation system.

**Details**:
- Requires backend server running on port 3051
- Guides user through OAuth2 callback flow
- Stores refresh token in `.env` file

**Prerequisites**:
- Backend running: `npm run dev` in backend directory
- `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` set in `.env`

**Steps**:
1. Backend must be running on `http://localhost:3051`
2. Script fetches authorization URL from backend
3. User opens URL in browser, authorizes app
4. Browser redirects to callback URL with code
5. User pastes callback URL back into script
6. Script exchanges code for refresh token and stores it

---

## File Organization

```
divideIt/
├── backend/
│   ├── scripts/
│   │   ├── splitIg.ts              ← Instagram horizontal
│   │   ├── splitIgYt.ts            ← Instagram Zoom + YouTube Shorts
│   │   ├── splitAll.ts             ← All 4 presets
│   │   ├── testAllPresets.ts       ← Quick test (1 clip per preset)
│   │   ├── addGameOverlayToSegment.ts
│   │   ├── generateSpaceInvadersVideo.ts
│   │   ├── get-refresh-token.sh
│   │   └── ...
│   ├── src/utils/
│   │   └── videoProcessor.ts       ← Defines PRESETS, splitVideo()
│   └── assets/
│       ├── space_invaders_classic.mp4
│       ├── space_invaders_retro_neon.mp4
│       ├── space_invaders_pixel_art.mp4
│       ├── space_invaders_cyberpunk.mp4
│       └── space_invaders_loop.mp4
├── scripts/
│   ├── splitHorizontal.ts          ← Generic horizontal splitter
│   └── ...
└── [processed/]                    ← Output folder (created at runtime)
    ├── aqualityguy/
    │   ├── tiktok_20260315_144530/
    │   ├── instagram_20260315_144530/
    │   ├── instagram_zoom_20260315_144530/
    │   └── youtube_shorts_20260315_144530/
    └── agenticcmonkey/
        └── [same structure]
```

---

## Workflow Summary

### Quick Instagram Processing (Horizontal)
```bash
# Place video in backend/uploads/
# Run:
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/splitIg.ts
# → Creates processed/aqualityguy/instagram_*/clip*.mp4
# → Auto-moves to automateUploads/clip_folder/aqualityguy/
```

### All Formats for One Account
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/splitAll.ts --account agenticcmonkey
# → Creates 4 folders (tiktok_, instagram_, instagram_zoom_, youtube_shorts_)
# → Up to 20 clips per format
```

### Custom Horizontal Splitting
```bash
cd /Users/lleirgarcia/projects/2026/divideIt
npx tsx scripts/splitHorizontal.ts uploads/video.mp4 5 10 30
# → 5 clips, 10-30 seconds each
# → Outputs to processed/<timestamp>/clip*.mp4
```

### Add Game Overlay (Post-Processing)
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npx tsx scripts/addGameOverlayToSegment.ts processed/aqualityguy/tiktok_20260315_144530/clip1.mp4
# → Re-encodes clip with Space Invaders overlay
# → Random theme selection
# → Slower operation (full re-encode)
```

---

## Key Configuration Details

### Preset Parameters
```typescript
export const PRESETS: Record<Preset, PresetConfig> = {
  tiktok:          { outputFormat: 'vertical',   animation: 'space_invaders', minSegmentDuration: 30, maxSegmentDuration: 50, folderPrefix: 'tiktok_' },
  instagram:       { outputFormat: 'horizontal', animation: 'none',           minSegmentDuration: 30, maxSegmentDuration: 50, folderPrefix: 'instagram_' },
  instagram_zoom:  { outputFormat: 'vertical',   animation: 'none',           minSegmentDuration: 30, maxSegmentDuration: 50, folderPrefix: 'instagram_zoom_' },
  youtube_shorts:  { outputFormat: 'vertical',   animation: 'none',           minSegmentDuration: 30, maxSegmentDuration: 60, folderPrefix: 'youtube_shorts_' },
};
```

### Output Dimensions
- Vertical (9:16): **1080×1920 px**
- Horizontal (16:9): **1920×1080 px**

### FFmpeg Encoding
- Video codec: **H.264** (libx264)
- Audio codec: **AAC**
- CRF: **23** (quality/size balance)
- Preset: **fast** (encoding speed)
- Fast start: **enabled** (web playback optimization)

### Segment Generation
- Algorithm: Random non-overlapping segments
- Overlap threshold: 50% of minimum segment duration
- Auto-limited: Segments never exceed video duration
- Sorting: Segments sorted by start time

---

## Running Requirements

All scripts require:
1. **Node.js** with TypeScript support (`tsx` package installed)
2. **FFmpeg** and **FFprobe** (system binaries)
3. **dotenv** configuration (backend/.env)
4. Input video formats: `.mp4`, `.mov`, `.avi`

### For backend scripts:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt/backend
npm install  # if needed
npx tsx scripts/<script-name>.ts [args]
```

### For root-level scripts:
```bash
cd /Users/lleirgarcia/projects/2026/divideIt
npx tsx scripts/<script-name>.ts [args]
```

---

## Most-Used Scripts (Daily Workflow)

1. **`splitAll.ts`** — Main production script for batch processing all formats
2. **`splitIg.ts`** — Quick Instagram-only processing (most common social media format)
3. **`splitIgYt.ts`** — Instagram Reels + YouTube Shorts combo
4. **`testAllPresets.ts`** — Validation before full `splitAll.ts` run
5. **`addGameOverlayToSegment.ts`** — Post-processing for TikTok segments with game effects

---

**Last Updated**: 2026-03-15
**divideIt Version**: Main branch + `añadir-animacion` feature branch
