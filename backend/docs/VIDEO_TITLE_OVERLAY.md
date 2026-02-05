# Video Title Overlay Feature

## Overview

The video title overlay feature adds text titles to video segments in the top black bar area (letterbox) without overlapping the video content. This is perfect for 9:16 format videos intended for TikTok and Instagram Reels.

## Requirements

### Node.js Canvas Library

The title overlay feature uses **Node.js Canvas** to generate text images and FFmpeg's `overlay` filter to composite them onto videos. This approach doesn't require libass and works with standard FFmpeg installations.

**Dependencies:**
- `canvas` package (installed via npm)
- FFmpeg with `overlay` filter support (standard in most installations)

**Install Canvas:**
```bash
cd backend
npm install canvas
```

The `canvas` package will be automatically installed when you run `npm install` in the backend directory.

## Usage

### Automatic Processing

When processing videos, titles are automatically added if:
1. Social media content is generated (description + title)
2. FFmpeg has libass support

### Manual API Usage

**POST** `/api/videos/add-title/:filename`

Add a title overlay to an existing video segment.

**Parameters:**
- `filename` - Video filename (e.g., `segment_1_uuid.mp4`)
- `videoId` - Video ID (optional, will search if not provided)
- `titleText` - Custom title text (optional, uses `_social_title.txt` if not provided)

**Example:**
```bash
curl -X POST "http://localhost:3051/api/videos/add-title/segment_1_uuid.mp4?videoId=abc123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalVideo": "segment_1_uuid.mp4",
    "videoWithTitle": "segment_1_uuid.mp4",
    "title": "Building a Web Page: Programming Journey",
    "message": "Title overlay added successfully. Original video has been updated."
  }
}
```

## How It Works

1. Reads title text from `_social_title.txt` file (or uses custom text)
2. Uses Node.js Canvas to generate a PNG image with the text
3. Creates text image with:
   - White text on semi-transparent black background
   - Centered horizontally
   - Positioned at 12% from top (in the black bar area for 9:16 videos)
   - Padding around text for readability
4. Uses FFmpeg `overlay` filter to composite the text image onto the video
5. Replaces original video with the version containing the title overlay

## Troubleshooting

### Error: "Cannot find module 'canvas'"

Install the canvas package:
```bash
cd backend
npm install canvas
```

Note: On some systems, canvas may require additional system dependencies. See [node-canvas installation guide](https://github.com/Automattic/node-canvas#compiling).

### Error: "Title file not found"

Ensure the `_social_title.txt` file exists for the video segment, or provide a custom title via the `titleText` parameter.

### Text not visible

- Check that the video has black bars (letterbox) at the top
- Verify the video is in 9:16 format
- Adjust position if needed (currently set to 12% from top)

## Technical Details

The implementation uses:
- **Node.js Canvas**: For generating text images programmatically
- **FFmpeg overlay filter**: For compositing the text image onto video
- **Temporary files**: PNG images are created temporarily and cleaned up after processing

This approach is:
- ✅ Compatible with standard FFmpeg installations
- ✅ No need for libass or special FFmpeg compilation
- ✅ Works across different operating systems
- ✅ Provides good control over text styling and positioning

## File Structure

After processing, each segment has:
- `segment_N_uuid.mp4` - Video with title overlay (if successful)
- `segment_N_uuid.txt` - Full transcription
- `segment_N_uuid_summary.txt` - Summary
- `segment_N_uuid_social_description.txt` - Social media description
- `segment_N_uuid_social_title.txt` - Title text used for overlay
