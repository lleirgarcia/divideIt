# divideIt User Guide

Welcome to divideIt! This guide will help you get started with splitting videos into random segments for social media content.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Advanced Features](#advanced-features)
4. [Best Practices](#best-practices)
5. [Tips & Tricks](#tips--tricks)
6. [FAQ](#faq)

## Getting Started

### Prerequisites

Before using divideIt, ensure you have:

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A video file in MP4, MOV, or AVI format
- Video file size under 500MB

### Accessing the Application

1. **Development**: Navigate to `http://localhost:3000` after starting the development server
2. **Production**: Visit your deployed application URL

## Basic Usage

### Step 1: Upload Your Video

1. **Drag and Drop**: Simply drag your video file onto the upload area
2. **Click to Select**: Click the upload area to open your file browser
3. **Supported Formats**: MP4, MOV, or AVI files up to 500MB

**What happens**: The video file is uploaded and validated. You'll see the filename and file size displayed.

### Step 2: Configure Split Settings

After uploading, you'll see three configuration options:

#### Number of Segments
- **Range**: 1-20 segments
- **Default**: 5 segments
- **Recommendation**: 
  - Short videos (< 2 minutes): 3-5 segments
  - Medium videos (2-5 minutes): 5-10 segments
  - Long videos (> 5 minutes): 10-20 segments

#### Minimum Segment Duration
- **Range**: 1-300 seconds
- **Default**: 5 seconds
- **Recommendation**: 
  - TikTok/Reels: 5-15 seconds
  - YouTube Shorts: 15-60 seconds
  - Instagram Reels: 15-90 seconds

#### Maximum Segment Duration
- **Range**: 1-300 seconds
- **Default**: 60 seconds
- **Recommendation**: 
  - TikTok: 15-60 seconds
  - Reels: 15-90 seconds
  - YouTube Shorts: 15-60 seconds

**Important**: Ensure your video duration is longer than the minimum segment duration!

### Step 3: Split the Video

1. Click the **"Split Video"** button
2. Wait for processing (progress indicator will show)
3. Processing time depends on:
   - Video file size
   - Number of segments
   - Video resolution
   - Your system performance

**Typical Processing Times**:
- Small video (< 50MB): 30 seconds - 2 minutes
- Medium video (50-200MB): 2-5 minutes
- Large video (200-500MB): 5-15 minutes

### Step 4: Download Segments

Once processing completes:

1. **View Segments**: A list of all generated segments appears
2. **Preview**: Click on a segment to preview it in the video player
3. **Download**: Click the download button for any segment
4. **Segment Info**: Each segment shows:
   - Segment number
   - Start time (in original video)
   - End time (in original video)
   - Duration

## Advanced Features

### Understanding Random Segments

divideIt generates segments randomly, which means:

- **Non-overlapping**: Segments won't significantly overlap
- **Random timing**: Each segment starts at a random point
- **Varied lengths**: Segments vary within your min/max duration range
- **Sorted**: Segments are sorted by start time for easy navigation

### Segment Generation Algorithm

The algorithm ensures:
- Segments don't overlap by more than 50% of the minimum duration
- All segments fit within the video duration
- Segments are distributed throughout the video
- Maximum number of segments based on video length and minimum duration

### Video Player Controls

The built-in video player supports:
- Play/Pause
- Seek through the video
- Volume control
- Fullscreen mode
- Time display

## Best Practices

### Video Preparation

1. **Format**: Use MP4 format for best compatibility
2. **Resolution**: 
   - TikTok: 1080x1920 (vertical)
   - Reels: 1080x1920 (vertical) or 1080x1080 (square)
   - YouTube Shorts: 1080x1920 (vertical)
3. **Aspect Ratio**: Match your target platform
4. **File Size**: Keep under 500MB for faster processing

### Segment Configuration

**For TikTok**:
- Segments: 5-10
- Min Duration: 5 seconds
- Max Duration: 60 seconds

**For Instagram Reels**:
- Segments: 5-10
- Min Duration: 15 seconds
- Max Duration: 90 seconds

**For YouTube Shorts**:
- Segments: 3-5
- Min Duration: 15 seconds
- Max Duration: 60 seconds

### Processing Tips

1. **Be Patient**: Large videos take time to process
2. **Don't Close**: Keep the browser tab open during processing
3. **Check Settings**: Verify settings before splitting
4. **Test First**: Try with a small video first to understand the process

## Tips & Tricks

### Creating Multiple Variations

1. Upload the same video multiple times
2. Use different segment counts each time
3. Vary min/max durations
4. Download all variations for different platforms

### Optimizing for Social Media

1. **Vertical Videos**: Best for TikTok, Reels, Shorts
2. **Square Videos**: Good for Instagram feed
3. **Horizontal Videos**: Better for YouTube Shorts (landscape)

### Segment Selection Strategy

- **Highlights**: Use shorter segments (5-15s) for highlights
- **Full Scenes**: Use longer segments (30-60s) for complete scenes
- **Variety**: Mix segment lengths for diverse content

### File Management

- **Naming**: Segments are automatically named with timestamps
- **Organization**: Download and organize segments immediately
- **Storage**: Segments are temporary - download before closing

## FAQ

### How long does processing take?

Processing time varies:
- Small videos (< 50MB): 30 seconds - 2 minutes
- Medium videos (50-200MB): 2-5 minutes
- Large videos (200-500MB): 5-15 minutes

Factors affecting speed:
- Video resolution
- Number of segments
- System performance
- Server load

### Can I choose specific segments?

Currently, divideIt generates random segments. Future versions may include manual segment selection.

### What happens if processing fails?

- Check your internet connection
- Verify file format (MP4, MOV, AVI)
- Ensure file size is under 500MB
- Try with a smaller video first
- Check browser console for errors

### Can I process multiple videos at once?

Currently, divideIt processes one video at a time. Batch processing may be added in future versions.

### Are my videos stored permanently?

No. Videos and segments are temporary:
- Original videos are deleted after processing
- Segments are available for download but may be cleaned up
- Download segments immediately to keep them

### What video formats are supported?

- **MP4** (recommended)
- **MOV** (QuickTime)
- **AVI** (Audio Video Interleave)

### Maximum file size?

500MB per video file.

### Can I change settings after uploading?

Yes! You can adjust segment count and duration settings before clicking "Split Video".

### Why are segments random?

Random segments help create diverse, engaging content without manual editing. Each split produces unique segments.

### How do I know if a segment is good?

Preview segments using the built-in video player before downloading.

### Can I re-split a video?

Yes! Upload the same video again with different settings to generate new segments.

### Is there a limit on how many times I can split videos?

Rate limits apply:
- General API: 100 requests per 15 minutes
- Upload endpoint: 10 requests per hour

### Troubleshooting

**Video won't upload**:
- Check file format (MP4, MOV, AVI)
- Verify file size (< 500MB)
- Check browser console for errors

**Processing takes too long**:
- Large videos take time - be patient
- Check your internet connection
- Try with a smaller video first

**Segments not downloading**:
- Check your browser's download settings
- Ensure pop-up blocker isn't blocking downloads
- Try a different browser

**Error messages**:
- Read the error message carefully
- Check file format and size
- Verify settings are within allowed ranges
- Try refreshing the page

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the [API Documentation](../docs/api/openapi.yaml)
3. Open an issue on GitHub
4. Check the browser console for detailed error messages

## Next Steps

- Read the [API Documentation](../docs/api/openapi.yaml) for programmatic access
- Check [ARCHITECTURE.md](../ARCHITECTURE.md) for technical details
- See [CONTRIBUTING.md](../CONTRIBUTING.md) to contribute improvements

Happy video splitting! 🎬
