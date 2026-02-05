# Quick Start Guide

Get divideIt up and running in minutes!

## Prerequisites Check

```bash
# Check Node.js version (should be 20+)
node --version

# Check npm version
npm --version

# Check FFmpeg installation
ffmpeg -version
```

If FFmpeg is not installed:
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation Steps

### 1. Install Dependencies

```bash
# From project root
npm install
```

This installs dependencies for both backend and frontend (using npm workspaces).

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults should work)
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env.local
# Edit .env.local if needed (defaults should work)
```

### 3. Start Development Servers

From project root:
```bash
npm run dev
```

This starts:
- Backend API: http://localhost:3001
- Frontend App: http://localhost:3000

## First Use

1. Open http://localhost:3000 in your browser
2. Upload a video file (MP4, MOV, or AVI)
3. Configure split settings:
   - Number of segments (default: 5)
   - Min duration (default: 5 seconds)
   - Max duration (default: 60 seconds)
4. Click "Split Video"
5. Wait for processing (depends on video size)
6. Download segments from the list

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

**Backend:** Edit `backend/.env`:
```env
PORT=3002
```

**Frontend:** Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### FFmpeg Not Found

Ensure FFmpeg is in your PATH:
```bash
which ffmpeg
```

If not found, add FFmpeg to your PATH or specify in `backend/.env`:
```env
FFMPEG_PATH=/path/to/ffmpeg
FFPROBE_PATH=/path/to/ffprobe
```

### File Upload Fails

- Check file size (max 500MB)
- Verify file format (MP4, MOV, AVI)
- Check backend logs: `backend/logs/combined.log`

## Docker Quick Start

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
