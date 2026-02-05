# divideIt

A web application for splitting videos into random segments, perfect for creating content for Reels, TikTok, and YouTube Shorts. Upload your video (MP4, MOV, or AVI) and let divideIt automatically generate random segments with customizable duration settings.

## Features

- 🎬 **Video Upload**: Support for MP4, MOV, and AVI formats (up to 500MB)
- ✂️ **Random Segmentation**: Automatically generates random video segments without AI
- ⚙️ **Customizable Settings**: Control number of segments, min/max duration
- 📥 **Easy Download**: Download individual segments with one click
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- 🚀 **Production Ready**: Docker support, CI/CD, comprehensive testing

## Tech Stack

### Backend
- **Node.js** with **Express** and **TypeScript**
- **FFmpeg** for video processing
- **Winston** for logging
- **Jest** for testing
- **Zod** for validation

### Frontend
- **Next.js 14** with **React 18**
- **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Player** for video playback
- **React Dropzone** for file uploads

### DevOps
- **Docker** and **Docker Compose**
- **GitHub Actions** for CI/CD
- Health checks and monitoring

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- FFmpeg installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/divideIt.git
cd divideIt
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cp .env.example .env

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Configuration

Backend (`.env`):
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

Frontend: Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running the Application

### Development Mode

From the root directory:
```bash
npm run dev
```

This starts both backend (http://localhost:3001) and frontend (http://localhost:3000).

Or run separately:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Production Build

```bash
# Build both
npm run build

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm start
```

### Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Usage

1. **Upload Video**: Drag and drop or click to select a video file (MP4, MOV, or AVI)
2. **Configure Settings**:
   - Number of segments (1-20)
   - Minimum segment duration (seconds)
   - Maximum segment duration (seconds)
3. **Split Video**: Click "Split Video" to process
4. **Download Segments**: Download individual segments from the list

## API Documentation

### Health Check
```
GET /api/health
```

### Upload and Split Video
```
POST /api/videos/split
Content-Type: multipart/form-data

Body:
- video: File (required)
- segmentCount: number (optional, default: 5, min: 1, max: 20)
- minSegmentDuration: number (optional, default: 5, min: 1, max: 300)
- maxSegmentDuration: number (optional, default: 60, min: 1, max: 300)
```

### Download Segment
```
GET /api/videos/download/:filename
```

## Project Structure

```
divideIt/
├── backend/
│   ├── src/
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Entry point
│   ├── uploads/            # Uploaded videos
│   ├── processed/          # Processed segments
│   └── logs/               # Application logs
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── store/          # State management
│   └── public/             # Static assets
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docker-compose.yml      # Docker configuration
└── README.md
```

## Testing

```bash
# Run all tests
npm test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Test coverage
cd backend && npm run test:coverage
```

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured for both frontend and backend
- Prettier recommended (add if needed)

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

- **Branch Naming**: See [.github/BRANCH_NAMING.md](.github/BRANCH_NAMING.md)
- **Repository Settings**: See [.github/REPOSITORY_SETTINGS.md](.github/REPOSITORY_SETTINGS.md)
- **Security Policy**: See [SECURITY.md](SECURITY.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Troubleshooting

### FFmpeg not found
Ensure FFmpeg is installed and available in your PATH:
```bash
ffmpeg -version
```

### Port already in use
Change ports in `.env` files or docker-compose.yml

### Large file uploads
Increase file size limits in backend configuration if needed

## Roadmap

- [ ] User authentication
- [ ] Video preview before splitting
- [ ] Batch processing
- [ ] Cloud storage integration
- [ ] Video effects and filters
- [ ] Export to different formats
- [ ] Social media direct upload

## Support

For issues and questions, please open an issue on GitHub.
