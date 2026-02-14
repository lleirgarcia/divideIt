# Space-Invaders Game Overlay (Nave vs Marcianos)

A 2D animation overlay for video segments: ship at the bottom shoots at aliens; the ship **never** finishes all aliens, so the loop keeps viewers watching.

## Generate the overlay video (one-time)

From the **backend** directory:

```bash
npx tsx scripts/generateSpaceInvadersVideo.ts
```

This creates `backend/assets/space_invaders_loop.mp4` (60 seconds, 30 fps, 320×200). The video is then used when adding the overlay to a segment.

## Add overlay to a segment

**API**

```http
POST /api/videos/add-game-overlay/:filename
```

- `filename`: e.g. `segment_1_uuid.mp4`
- Query or body: `videoId` (optional; if omitted, the backend searches in `processed/`)

The overlay is placed at the **bottom-right** of the segment and loops for the full duration. The segment file is overwritten with the version that includes the game.

**Example**

```bash
curl -X POST "http://localhost:3051/api/videos/add-game-overlay/segment_1_abc123.mp4?videoId=506f892d-1d07-437a-b6c5-0aa559a18a4c"
```

## Implementation

- **Frame generation**: `backend/src/utils/spaceInvadersOverlay.ts` — Canvas-based 2D game (ship, aliens, bullets, explosions). Max 6 aliens killed so 2 always remain.
- **Encode**: `backend/scripts/generateSpaceInvadersVideo.ts` — Writes PNG sequence, then FFmpeg to MP4.
- **Overlay**: `backend/src/utils/addGameOverlayToVideo.ts` — FFmpeg overlay with `-stream_loop -1` so the 60s game video repeats for the whole segment.

## Asset location

- Generated video: `backend/assets/space_invaders_loop.mp4`
- If the file is missing, the add-game-overlay endpoint returns an error and instructs to run the generator script.
