# Backend Engineer Agent - Context & Updates

This file tracks all updates, decisions, and changes made by or related to the Backend Engineer Agent.

---

## Agent Configuration

**Created:** 2026-02-05  
**Status:** Active  
**Mode:** Auto (∞ Agent)  
**Permissions:** Full access - all file operations, command execution, and changes

---

## Updates Log

### 2026-02-05 - Video Title Overlay Feature (Implemented)
- **Action:** Added functionality to overlay title text on video segments in the top black bar area
- **Details:**
  - Created `videoTextOverlayCanvas.ts` utility for adding text overlays to videos
  - Uses Node.js Canvas library to generate text images (PNG)
  - Uses FFmpeg `overlay` filter to composite text image onto video
  - Text is positioned in the top black bar area (12% from top) to avoid overlapping with video content
  - Integrated into automatic video processing pipeline - titles are added automatically after social media content generation
  - Added endpoint: `POST /api/videos/add-title/:filename` for adding titles to existing videos
  - Added dependency: `canvas` package for text image generation
  - **Solution:** Uses Canvas + overlay filter instead of subtitles filter, works with standard FFmpeg installations (no libass required)
  - Successfully tested and working

### 2026-02-05 - Automatic Summarization for Transcriptions
- **Action:** Added automatic summarization service that creates summary files for each transcription
- **Details:**
  - Created `summarizationService.ts` using OpenAI GPT-3.5-turbo for text summarization
  - Updated `splitVideo()` in both `videoProcessor.ts` and `videoService.ts` to automatically summarize transcriptions
  - Each transcription now automatically generates a matching `_summary.txt` file
  - File naming: `segment_N_uuid.txt` → `segment_N_uuid_summary.txt`
  - Supports multiple summary styles: concise, detailed, bullet-points
  - Added endpoint: `POST /api/videos/summarize/:filename` for summarizing existing transcriptions
  - Summary errors are logged but don't fail the video processing

### 2026-02-05 - Automatic Transcription for Processed Segments
- **Action:** Modified video processing to automatically transcribe each segment and save as .txt file
- **Details:**
  - Updated `splitVideo()` in `videoProcessor.ts` to transcribe each segment after creation
  - Updated `splitVideo()` in `videoService.ts` to transcribe each segment after creation
  - Each processed video segment now automatically generates a matching .txt file with transcription
  - File naming: `segment_N_uuid.mp4` → `segment_N_uuid.txt`
  - Transcription errors are logged but don't fail the video processing
  - Text files are saved in the same directory as the video segments

### 2026-02-05 - Video Transcription Feature Added
- **Action:** Implemented speech-to-text transcription service for videos
- **Details:**
  - Created `transcriptionService.ts` with support for multiple providers (OpenAI Whisper, AssemblyAI, Deepgram)
  - Added transcription endpoints: `/api/videos/transcribe` and `/api/videos/transcribe-segment/:filename`
  - Automatic audio extraction from video files using FFmpeg
  - Support for 100+ languages with auto-detection
  - Added dependencies: `axios` and `form-data`
  - Created comprehensive documentation in `backend/docs/TRANSCRIPTION.md`
  - Service automatically selects available provider based on API keys in environment

### 2026-02-05 - Video Format Conversion to 9:16 (Updated - Full Image Preservation)
- **Action:** Updated video processing to convert all segments to 9:16 aspect ratio while preserving entire video image
- **Details:**
  - Modified `extractSegment()` method in `videoService.ts` to convert videos to 9:16 format
  - Updated `splitVideo()` function in `videoProcessor.ts` with 9:16 conversion
  - Target resolution: 1080x1920 (Full HD vertical) - standard for TikTok, Instagram Reels, YouTube Shorts
  - Uses FFmpeg filters: scale with `force_original_aspect_ratio=decrease` + pad (black bars)
  - **Important:** Maintains entire video image visible - no cropping, uses letterbox/pillarbox instead
  - All processed video segments now output in 9:16 format with full image preserved
  - Maintains video quality with optimized encoding settings (H.264, CRF 23, AAC audio)

### 2026-02-05 - Google Drive Integration (Implemented)
- **Action:** Added complete Google Drive integration for uploading and sharing video segments
- **Details:**
  - Created `googleDriveService.ts` service for Google Drive API operations
  - Implemented OAuth2 authentication flow with refresh token support
  - Added file upload functionality with support for folders and public sharing
  - Created `googleDriveRoutes.ts` with comprehensive API endpoints:
    - `GET /api/google-drive/auth-url` - Get OAuth2 authorization URL
    - `GET /api/google-drive/oauth/callback` - Handle OAuth callback and exchange code for tokens
    - `POST /api/google-drive/set-token` - Set refresh token for authentication
    - `POST /api/google-drive/upload` - Upload single file to Google Drive
    - `POST /api/google-drive/upload-multiple` - Upload multiple files
    - `POST /api/google-drive/upload-segment` - Upload video segment with automatic sharing
    - `POST /api/google-drive/share` - Share files with specific permissions
    - `POST /api/google-drive/create-folder` - Create folders in Google Drive
    - `GET /api/google-drive/status` - Check service status and authentication
  - Added dependency: `googleapis` package
  - Updated environment variables in `.env.example` with Google Drive credentials
  - Integrated routes into main server (`src/index.ts`)
  - Service automatically refreshes access tokens using refresh token
  - Supports file search in processed directories when videoId is not provided
  - Frontend component created for user-friendly Google Drive uploads
  - Updated README with comprehensive Google Drive setup instructions

### 2026-02-05 - Initial Setup
- **Action:** Verified and confirmed Backend Engineer Agent configuration
- **Details:** 
  - Agent file exists at `.cursor/agents/backend-agent.md`
  - Agent JSON metadata exists at `.cursor/agents/backend-agent.json`
  - Agent is configured with full permissions for autonomous operation
  - Created context tracking file for future updates

---

## Project Context

**Project:** divideIt  
**Description:** A web project where uploading a video file (.mov or .mp4 mainly) can split the video into different parts, in a random way without AI, for the purpose to upload it to reels, TikTok or YouTube shorts.

---

## Key Responsibilities

The Backend Engineer Agent handles:
- Design and implement RESTful API architecture
- Set up proper database schema and migrations
- Implement authentication and authorization
- Add input validation and error handling
- Set up environment configuration
- Create API documentation
- Implement logging and monitoring
- Add security best practices (CORS, rate limiting, etc.)
- Set up testing framework
- Configure CI/CD for backend services

---

## Architecture Decisions

### Current Backend Stack
Based on existing project structure:
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js (inferred from structure)
- **Testing:** Jest
- **Containerization:** Docker
- **CI/CD:** GitHub Actions

### API Design
- RESTful API architecture
- Health check endpoints
- Video processing endpoints
- Error handling middleware
- Rate limiting middleware
- Input validation middleware

### Video Processing
- **Output Format:** All processed segments are converted to 9:16 aspect ratio (1080x1920)
- **Conversion Method:** FFmpeg scale + pad (black bars) to preserve entire video image
  - Scales video to fit within 9:16 frame (`force_original_aspect_ratio=decrease`)
  - Adds black bars (letterbox/pillarbox) to fill remaining space and center video
  - **No cropping** - entire original image is preserved and visible
- **Codec:** H.264 video (libx264) with AAC audio
- **Quality:** CRF 23 (good quality balance)
- **Optimization:** Fast start enabled for web playback, yuv420p pixel format for compatibility

---

## Implementation Notes

### Current Backend Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware (error, rate limit, validation)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   └── utils/           # Utility functions (logger, file utils, video processor)
├── __tests__/           # Test files
├── Dockerfile           # Container configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

### Key Files
- `src/server.ts` - Main server entry point
- `src/routes/videoRoutes.ts` - Video processing endpoints
- `src/routes/googleDriveRoutes.ts` - Google Drive integration endpoints
- `src/routes/healthRoutes.ts` - Health check endpoints
- `src/services/videoService.ts` - Video processing business logic
- `src/services/googleDriveService.ts` - Google Drive API service
- `src/utils/videoProcessor.ts` - Video manipulation utilities
- `src/middleware/` - Security and validation middleware

---

## Future Tasks

- [ ] Review and enhance API documentation (OpenAPI/Swagger)
- [ ] Implement comprehensive authentication/authorization if needed
- [ ] Add database schema and migrations if persistence is required
- [ ] Enhance monitoring and logging capabilities
- [ ] Expand test coverage
- [ ] Optimize video processing performance
- [ ] Add support for additional video formats if needed
- [x] Implement video transcription (speech-to-text) feature
- [ ] Add transcription caching to avoid re-processing
- [ ] Add batch transcription support for multiple segments

---

## Important Notes

- **Video Format:** All processed video segments MUST be in 9:16 aspect ratio (1080x1920) for TikTok, Instagram Reels, and YouTube Shorts compatibility
- **Image Preservation:** The entire original video image is preserved - no cropping is performed. Black bars (letterbox/pillarbox) are added as needed to fit the 9:16 format
- The backend should handle video file uploads efficiently
- Video processing should be optimized for performance
- Security is critical - ensure proper file validation and sanitization
- Rate limiting should prevent abuse
- Error handling should be comprehensive and user-friendly
- All configurations should be production-ready
