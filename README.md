# divideIt

A web application for splitting videos into random segments, perfect for creating content for Reels, TikTok, and YouTube Shorts. Upload your video (MP4, MOV, or AVI) and let divideIt automatically generate random segments with customizable duration settings.

## Features

- 🎬 **Video Upload**: Support for MP4, MOV, and AVI formats (up to 1GB)
- ✂️ **Random Segmentation**: Automatically generates random video segments without AI
- ⚙️ **Customizable Settings**: Control number of segments, min/max duration
- 📥 **Easy Download**: Download individual segments with one click
- 🎤 **Automatic Transcription**: Each processed segment is automatically transcribed to text (.txt file)
- 📝 **Text Files**: Matching .txt files are generated alongside each video segment
- 📊 **Automatic Summarization**: Each transcription is automatically summarized using AI (GPT-3.5)
- ✨ **Summary Files**: Matching `_summary.txt` files are generated for quick content overview
- 📱 **Social Media Content**: Automatic generation of TikTok/Instagram Reels descriptions and titles
- 🎬 **Title Overlay**: Titles are automatically overlaid on videos in the top black bar area
- ☁️ **Google Drive Integration**: Upload and share video segments directly to Google Drive
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- 🌙 **Dark Mode**: Manual toggle with system preference detection
- ♿ **Accessibility**: WCAG compliant with full keyboard navigation and screen reader support
- 🚀 **Production Ready**: Docker support, CI/CD, comprehensive testing
- 🔍 **SEO Optimized**: Metadata, Open Graph tags, and structured data

## Tech Stack

### Backend
- **Node.js** with **Express** and **TypeScript**
- **FFmpeg** for video processing
- **OpenAI Whisper API** for automatic speech-to-text transcription
- **Winston** for logging
- **Jest** for unit and integration testing
- **Supertest** for API testing
- **Zod** for validation

### Frontend
- **Next.js 14** with **React 18** (App Router)
- **TypeScript** with strict mode
- **Tailwind CSS** for styling with dark mode support
- **Zustand** for state management
- **React Player** for video playback (lazy loaded)
- **React Dropzone** for file uploads
- **Accessibility**: WCAG compliant with ARIA labels and keyboard navigation
- **SEO**: Comprehensive metadata, Open Graph, and structured data
- **Performance**: Code splitting, lazy loading, and optimizations
- **Testing**: Jest, React Testing Library, and Playwright with comprehensive coverage

### DevOps
- **Docker** and **Docker Compose** (development, staging, production)
- **Multi-stage Docker builds** with security best practices
- **GitHub Actions** CI/CD pipelines (testing, staging, production)
- **Prometheus & Grafana** for monitoring and metrics
- **Health check endpoints** with detailed system metrics
- **Terraform** infrastructure as code for AWS
- **Automated deployment scripts** with rollback support
- **Backup and disaster recovery** procedures
- **Secrets management** configuration
- **Nginx** reverse proxy with SSL support
- Automated test coverage reporting

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
PORT=3051
NODE_ENV=development
FRONTEND_URL=http://localhost:3050
LOG_LEVEL=info

# Google Drive Integration (optional)
# See Google Drive Setup section below for instructions
GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token_here
```

Frontend: Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3051
```

### Google Drive Setup (Optional)

To enable Google Drive integration for uploading and sharing video segments:

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Drive API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3051/api/google-drive/oauth/callback`
   - Copy the Client ID and Client Secret

4. **Configure Backend**:
   - Add credentials to your `.env` file:
     ```env
     GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
     GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
     GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
     ```

5. **Get Refresh Token**:
   - Start your backend server
   - Visit: `http://localhost:3051/api/google-drive/auth-url`
   - Copy the `authUrl` and open it in your browser
   - Complete the OAuth flow
   - Copy the `refreshToken` from the callback response
   - Add it to your `.env` file:
     ```env
     GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token_here
     ```

6. **Restart Backend**:
   - Restart your backend server to load the new credentials

Now you can upload video segments to Google Drive directly from the application!

## Running the Application

### Development Mode

From the root directory:
```bash
npm run dev
```

This starts both backend (http://localhost:3051) and frontend (http://localhost:3050).

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

#### Uso interno (solo localhost)
Para usar divideIt como herramienta interna, sin exponer a internet. Backend y frontend en puertos poco usados, solo accesibles desde tu máquina:

```bash
# Levantar (backend en 18081, frontend en 18080)
docker compose -f docker-compose.internal.yml up -d --build

# O usar el script
./scripts/run-internal.sh
```

Abrir en el navegador: **http://127.0.0.1:18080**

- **Frontend:** http://127.0.0.1:18080  
- **Backend API:** http://127.0.0.1:18081  
- **Health:** http://127.0.0.1:18081/api/health  

Los servicios escuchan solo en `127.0.0.1`, no en la red local.

```bash
# Ver logs
docker compose -f docker-compose.internal.yml logs -f

# Parar
docker compose -f docker-compose.internal.yml down
```

#### Development
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Staging
```bash
docker-compose -f docker-compose.staging.yml up -d
```

#### Production
```bash
# Set environment variables first
export BACKEND_PORT=3001
export FRONTEND_PORT=3000
export GRAFANA_PASSWORD=your_secure_password

# Start production stack with monitoring
docker-compose -f docker-compose.prod.yml up -d
```

### DevOps & Deployment

#### Deployment Scripts

Deploy to different environments:
```bash
# Development
./scripts/deploy/deploy.sh development

# Staging
./scripts/deploy/deploy.sh staging

# Production
./scripts/deploy/deploy.sh production
```

Health checks:
```bash
./scripts/deploy/health-check.sh [environment]
```

Rollback:
```bash
./scripts/deploy/rollback.sh [environment] [backup-timestamp]
```

#### Backup & Recovery

Create backup:
```bash
./scripts/backup/backup.sh
```

Restore from backup:
```bash
./scripts/backup/restore.sh [backup-name]
```

Disaster recovery:
```bash
./scripts/backup/disaster-recovery.sh
```

#### Monitoring

Access monitoring dashboards:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (default: admin/admin)
- **Metrics Endpoint**: http://localhost:3001/api/metrics

#### CI/CD

The project includes GitHub Actions workflows:
- **CI** (`.github/workflows/ci.yml`): Runs on every push/PR
- **Deploy Staging** (`.github/workflows/deploy-staging.yml`): Deploys to staging on push to `develop`
- **Deploy Production** (`.github/workflows/deploy-production.yml`): Deploys to production on version tags

#### Infrastructure as Code

Terraform configurations are available in `terraform/`:
```bash
cd terraform
terraform init
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

See [terraform/README.md](terraform/README.md) for details.

#### Secrets Management

Secrets should never be committed. See [secrets/README.md](secrets/README.md) for:
- Secret storage strategies
- Rotation procedures
- Best practices

## Usage

1. **Upload Video**: Drag and drop or click to select a video file (MP4, MOV, or AVI)
2. **Configure Settings**:
   - Number of segments (1-20)
   - Minimum segment duration (seconds)
   - Maximum segment duration (seconds)
3. **Split Video**: Click "Split Video" to process
4. **Download Segments**: Download individual segments from the list
5. **Upload to Google Drive** (optional): Click "Upload to Drive" to share segments on Google Drive

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[User Guide](docs/USER_GUIDE.md)** - Step-by-step tutorials and usage instructions
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation with examples
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Solutions to common issues
- **[Code Examples](docs/EXAMPLES.md)** - Practical code samples and integrations
- **[OpenAPI Specification](docs/api/openapi.yaml)** - OpenAPI 3.0 API specification
- **[Architecture Documentation](ARCHITECTURE.md)** - System design and architecture
- **[Contributing Guide](CONTRIBUTING.md)** - Guidelines for contributors
- **[Quick Start Guide](QUICKSTART.md)** - Get started in minutes

### Quick API Reference

**Health Check**
```
GET /api/health
```

**Upload and Split Video**
```
POST /api/videos/split
Content-Type: multipart/form-data

Body:
- video: File (required)
- segmentCount: number (optional, default: 5, min: 1, max: 20)
- minSegmentDuration: number (optional, default: 5, min: 1, max: 300)
- maxSegmentDuration: number (optional, default: 60, min: 1, max: 300)
```

**Download Segment**
```
GET /api/videos/download/:filename
```

**Google Drive Upload**
```
POST /api/google-drive/upload-segment
Body: {
  segmentPath: string,
  videoId?: string,
  folderId?: string,
  makePublic?: boolean
}
```

**Google Drive Status**
```
GET /api/google-drive/status
```

For complete API documentation, see [API Reference](docs/API_REFERENCE.md).

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
│   │   │   ├── ui/        # Reusable UI components
│   │   │   └── __tests__/ # Component tests
│   │   ├── services/       # API services
│   │   └── store/          # State management (Zustand)
│   └── public/             # Static assets
├── .github/
│   └── workflows/          # CI/CD pipelines
├── e2e/                    # End-to-end tests (Playwright)
├── docker-compose.yml      # Docker configuration
├── TESTING.md              # Comprehensive testing guide
└── README.md
```

## Testing

The project includes comprehensive testing with multiple testing frameworks:

- **Jest** - Unit and integration tests
- **Playwright** - End-to-end (E2E) and visual regression tests
- **Testing Library** - React component testing

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all

# Backend tests only
cd backend && npm test
cd backend && npm run test:coverage

# Frontend tests only
cd frontend && npm test
cd frontend && npm run test:coverage
```

### Test Coverage

The project maintains minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Coverage reports are generated automatically and uploaded to Codecov in CI/CD.

For detailed testing documentation, see [TESTING.md](TESTING.md).

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

For detailed troubleshooting help, see the [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

### Quick Fixes

**FFmpeg not found**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

**Port already in use**
Change ports in `.env` files or docker-compose.yml

**Large file uploads**
Maximum file size is 1GB. Compress videos before uploading if needed.

## Roadmap

- [ ] User authentication
- [ ] Video preview before splitting
- [ ] Batch processing
- [x] Cloud storage integration (Google Drive)
- [ ] Video effects and filters
- [ ] Export to different formats
- [ ] Social media direct upload

## Support

- **Documentation**: Check the [docs](docs/) directory for comprehensive guides
- **Issues**: Open an issue on [GitHub](https://github.com/your-username/divideIt/issues)
- **Questions**: See [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for common solutions
- **API Help**: Review [API Reference](docs/API_REFERENCE.md) for detailed API documentation
