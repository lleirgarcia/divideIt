# Architecture Documentation

## Overview

divideIt is a full-stack web application built with a modern architecture separating concerns between frontend and backend services.

## System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/HTTPS
       │
┌──────▼─────────────────────────────────┐
│         Frontend (Next.js)              │
│  ┌──────────────────────────────────┐   │
│  │  React Components                │   │
│  │  - VideoUploader                 │   │
│  │  - VideoPlayer                   │   │
│  │  - SegmentsList                  │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  State Management (Zustand)      │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  API Client (Axios)               │   │
│  └──────────────┬───────────────────┘   │
└─────────────────┼───────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────┐
│      Backend (Express/Node.js)          │
│  ┌──────────────────────────────────┐   │
│  │  API Routes                      │   │
│  │  - /api/health                   │   │
│  │  - /api/videos/split             │   │
│  │  - /api/videos/download/:file    │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Middleware                       │   │
│  │  - Error Handling                 │   │
│  │  - Rate Limiting                  │   │
│  │  - File Upload (Multer)            │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Video Processor                  │   │
│  │  - FFmpeg Integration             │   │
│  │  - Segment Generation             │   │
│  └──────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────▼─────────┐
        │   File System     │
        │  - uploads/       │
        │  - processed/     │
        └───────────────────┘
```

## Backend Architecture

### Layers

1. **Routes Layer**: Handle HTTP requests and responses
2. **Middleware Layer**: Authentication, validation, error handling
3. **Service Layer**: Business logic and video processing
4. **Utils Layer**: Helper functions and utilities

### Key Components

#### Video Processing Flow

1. **Upload**: File received via multipart/form-data
2. **Validation**: File type and size validation
3. **Metadata Extraction**: Get video duration, dimensions using FFprobe
4. **Segment Generation**: Generate random time segments
5. **Video Splitting**: Use FFmpeg to extract segments
6. **Response**: Return segment URLs for download

#### Random Segment Algorithm

The algorithm generates non-overlapping random segments:
- Random start time within video duration
- Random duration within min/max constraints
- Avoids significant overlap with existing segments
- Sorts segments by start time

## Frontend Architecture

### Component Structure

```
App
├── Layout (Root)
│   ├── Header
│   └── Main Content
│       ├── VideoUploader
│       │   ├── Dropzone
│       │   └── Split Settings Form
│       ├── VideoPlayer
│       └── SegmentsList
│           └── SegmentItem (multiple)
```

### State Management

Using Zustand for global state:
- Video file and URL
- Processing status
- Generated segments
- Error messages

### API Communication

- Axios client configured with base URL
- Error handling with toast notifications
- File upload with FormData
- Download handling with blob responses

## Data Flow

### Upload and Split Flow

```
User Action
    ↓
VideoUploader Component
    ↓
FormData Creation
    ↓
API Request (POST /api/videos/split)
    ↓
Backend: File Upload (Multer)
    ↓
Backend: Metadata Extraction (FFprobe)
    ↓
Backend: Segment Generation
    ↓
Backend: Video Splitting (FFmpeg)
    ↓
Backend: Response with Segment URLs
    ↓
Frontend: Update State (Zustand)
    ↓
UI Update: Show Segments List
```

## Security Considerations

1. **File Upload Validation**
   - File type whitelist
   - File size limits
   - Filename sanitization

2. **Rate Limiting**
   - General API: 100 requests/15min
   - Upload endpoint: 10 requests/hour

3. **CORS Configuration**
   - Restricted to frontend URL
   - Credentials enabled

4. **Error Handling**
   - No sensitive information in errors
   - Proper HTTP status codes
   - Logging for debugging

## Performance Optimizations

1. **Video Processing**
   - FFmpeg presets for faster encoding
   - Parallel processing potential (future)
   - Temporary file cleanup

2. **Frontend**
   - Next.js automatic code splitting
   - Image optimization
   - Lazy loading components

3. **Caching**
   - Static assets caching
   - API response caching (future)

## Scalability Considerations

### Current Limitations

- Single server processing
- File system storage
- No queue system

### Future Improvements

1. **Horizontal Scaling**
   - Load balancer
   - Multiple backend instances
   - Shared storage (S3, etc.)

2. **Processing Queue**
   - Redis/RabbitMQ for job queue
   - Worker processes
   - Progress tracking

3. **Storage**
   - Cloud storage (AWS S3, etc.)
   - CDN for segment delivery
   - Automatic cleanup policies

## Deployment Architecture

### Docker Setup

- Separate containers for frontend and backend
- Volume mounts for persistent storage
- Health checks for monitoring
- Environment variable configuration

### CI/CD Pipeline

1. **Test Phase**: Run linting and tests
2. **Build Phase**: Build Docker images
3. **Deploy Phase**: Push to registry (future)
4. **Health Check**: Verify deployment

## Monitoring and Logging

### Logging

- Winston for structured logging
- File-based logs (development)
- Log levels: error, warn, info, debug

### Health Checks

- `/api/health` endpoint
- Docker health checks
- Uptime monitoring

## Technology Choices

### Why FFmpeg?

- Industry standard for video processing
- Cross-platform support
- Extensive format support
- Command-line interface

### Why Next.js?

- Server-side rendering capabilities
- Excellent developer experience
- Built-in optimizations
- React ecosystem

### Why Express?

- Minimal and flexible
- Large ecosystem
- Easy middleware integration
- TypeScript support

## Future Enhancements

1. **User Management**
   - Authentication system
   - User accounts
   - History tracking

2. **Advanced Features**
   - Video preview
   - Custom segment selection
   - Batch processing
   - Format conversion

3. **Infrastructure**
   - Kubernetes deployment
   - Auto-scaling
   - Monitoring dashboard
   - Analytics
