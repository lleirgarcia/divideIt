# Troubleshooting Guide

This guide helps you resolve common issues with divideIt.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Runtime Issues](#runtime-issues)
3. [Video Processing Issues](#video-processing-issues)
4. [API Issues](#api-issues)
5. [Frontend Issues](#frontend-issues)
6. [Docker Issues](#docker-issues)
7. [Performance Issues](#performance-issues)
8. [Error Messages](#error-messages)

## Installation Issues

### Node.js Version Issues

**Problem**: `Error: Node.js version X.X.X is not supported`

**Solution**:
```bash
# Check your Node.js version
node --version

# Should be 20 or higher. If not, update Node.js:
# macOS (using Homebrew)
brew install node@20

# Or download from nodejs.org
```

### FFmpeg Not Found

**Problem**: `FFmpeg not found` or `Error: spawn ffmpeg ENOENT`

**Solution**:

**macOS**:
```bash
brew install ffmpeg
# Verify installation
ffmpeg -version
```

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install ffmpeg
# Verify installation
ffmpeg -version
```

**Windows**:
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract and add to PATH
3. Or use Chocolatey: `choco install ffmpeg`

**Docker**:
FFmpeg should be included in the Docker image. If not, check the Dockerfile.

### Dependency Installation Fails

**Problem**: `npm install` fails with errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Reinstall
npm install
```

**If using yarn**:
```bash
yarn install --force
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solution**:

**Option 1: Change Port**
```bash
# Edit backend/.env
PORT=3002

# Edit frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**Option 2: Kill Process Using Port**
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## Runtime Issues

### Server Won't Start

**Problem**: Backend server fails to start

**Solution**:
1. Check environment variables:
   ```bash
   cd backend
   cat .env
   ```

2. Verify required directories exist:
   ```bash
   mkdir -p uploads processed logs
   ```

3. Check logs:
   ```bash
   tail -f logs/combined.log
   ```

4. Verify FFmpeg is accessible:
   ```bash
   which ffmpeg
   ffmpeg -version
   ```

### Frontend Won't Connect to Backend

**Problem**: Frontend shows "Failed to connect" or CORS errors

**Solution**:
1. Verify backend is running:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Check CORS configuration in `backend/src/server.ts`:
   ```typescript
   origin: process.env.FRONTEND_URL || 'http://localhost:3000'
   ```

3. Verify environment variables:
   ```bash
   # Frontend .env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   
   # Backend .env
   FRONTEND_URL=http://localhost:3000
   ```

4. Check browser console for specific errors

### Environment Variables Not Loading

**Problem**: Environment variables not being read

**Solution**:
1. Ensure `.env` files exist:
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

2. Restart the server after changing `.env` files

3. Verify variables are loaded:
   ```bash
   # Backend
   node -e "require('dotenv').config(); console.log(process.env.PORT)"
   ```

## Video Processing Issues

### File Upload Fails

**Problem**: "Invalid file type" or upload fails

**Solution**:
1. **Check file format**:
   - Supported: MP4, MOV, AVI
   - Verify file extension matches format

2. **Check file size**:
   - Maximum: 500MB
   - Check: `ls -lh your-video.mp4`

3. **Verify MIME type**:
   ```bash
   file your-video.mp4
   ```

4. **Check file isn't corrupted**:
   - Try playing the video in a media player
   - Re-export if corrupted

### Processing Takes Too Long

**Problem**: Video processing seems stuck

**Solution**:
1. **Check processing time**:
   - Small videos (< 50MB): 30s - 2min
   - Medium videos (50-200MB): 2-5min
   - Large videos (200-500MB): 5-15min

2. **Monitor logs**:
   ```bash
   tail -f backend/logs/combined.log
   ```

3. **Check system resources**:
   ```bash
   # CPU and memory usage
   top
   # Or
   htop
   ```

4. **Reduce video size**:
   - Lower resolution
   - Compress video before uploading
   - Reduce number of segments

### Segments Not Generated

**Problem**: Processing completes but no segments appear

**Solution**:
1. **Check video duration**:
   - Video must be longer than minimum segment duration
   - Example: 3-second video can't have 5-second segments

2. **Verify settings**:
   - Minimum duration < Maximum duration
   - Segment count is reasonable for video length

3. **Check logs for errors**:
   ```bash
   grep -i error backend/logs/combined.log
   ```

4. **Check processed directory**:
   ```bash
   ls -la backend/processed/
   ```

### FFmpeg Processing Errors

**Problem**: FFmpeg errors in logs

**Solution**:
1. **Update FFmpeg**:
   ```bash
   # macOS
   brew upgrade ffmpeg
   
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get upgrade ffmpeg
   ```

2. **Check FFmpeg codecs**:
   ```bash
   ffmpeg -codecs | grep h264
   ```

3. **Verify video file**:
   ```bash
   ffprobe your-video.mp4
   ```

4. **Check disk space**:
   ```bash
   df -h
   ```

### Segments Are Corrupted

**Problem**: Downloaded segments won't play

**Solution**:
1. **Check segment file**:
   ```bash
   file segment_1_*.mp4
   ffprobe segment_1_*.mp4
   ```

2. **Verify download completed**:
   - Check file size
   - Re-download if incomplete

3. **Check browser**:
   - Try different browser
   - Clear browser cache

## API Issues

### Rate Limit Exceeded

**Problem**: `429 Too Many Requests`

**Solution**:
1. **Wait**: Rate limits reset after the window period
   - General API: 15 minutes
   - Upload endpoint: 1 hour

2. **Check limits**:
   - General: 100 requests/15min
   - Upload: 10 requests/hour

3. **Reduce requests**: Batch operations or wait between requests

### 400 Bad Request

**Problem**: API returns 400 errors

**Solution**:
1. **Check request format**:
   ```bash
   # Verify multipart/form-data
   curl -X POST http://localhost:3001/api/videos/split \
     -F "video=@test.mp4" \
     -F "segmentCount=5"
   ```

2. **Validate parameters**:
   - segmentCount: 1-20
   - minSegmentDuration: 1-300
   - maxSegmentDuration: 1-300

3. **Check file**:
   - Valid format (MP4, MOV, AVI)
   - Under 500MB
   - Not corrupted

### 404 Not Found

**Problem**: Segment download returns 404

**Solution**:
1. **Verify filename**:
   - Check segment filename from API response
   - Ensure URL is correct

2. **Check file exists**:
   ```bash
   ls -la backend/processed/*/segment_*.mp4
   ```

3. **File may have been cleaned up**:
   - Download segments immediately after processing
   - Files are temporary

### 500 Internal Server Error

**Problem**: Server errors

**Solution**:
1. **Check logs**:
   ```bash
   tail -f backend/logs/combined.log
   tail -f backend/logs/error.log
   ```

2. **Check disk space**:
   ```bash
   df -h
   ```

3. **Check permissions**:
   ```bash
   ls -la backend/uploads backend/processed
   ```

4. **Restart server**:
   ```bash
   # Stop server (Ctrl+C)
   # Restart
   npm run dev:backend
   ```

## Frontend Issues

### Page Won't Load

**Problem**: Blank page or errors

**Solution**:
1. **Check browser console**:
   - Open DevTools (F12)
   - Look for errors in Console tab

2. **Verify frontend is running**:
   ```bash
   curl http://localhost:3000
   ```

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Check Next.js build**:
   ```bash
   cd frontend
   npm run build
   ```

### Video Upload Doesn't Work

**Problem**: Can't upload video file

**Solution**:
1. **Check browser compatibility**:
   - Chrome, Firefox, Safari, Edge (latest versions)
   - Update browser if outdated

2. **Check file**:
   - Format: MP4, MOV, AVI
   - Size: Under 500MB

3. **Check network**:
   - Verify internet connection
   - Check if backend is accessible

4. **Check browser console**:
   - Look for JavaScript errors
   - Check Network tab for failed requests

### Segments Don't Download

**Problem**: Download button doesn't work

**Solution**:
1. **Check browser settings**:
   - Pop-up blocker may be blocking downloads
   - Check download permissions

2. **Try direct link**:
   - Right-click download button → "Copy link"
   - Paste in new tab

3. **Check browser console**:
   - Look for errors
   - Check Network tab

4. **Try different browser**

## Docker Issues

### Container Won't Start

**Problem**: Docker containers fail to start

**Solution**:
1. **Check Docker is running**:
   ```bash
   docker ps
   ```

2. **Check logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Rebuild containers**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### FFmpeg Not Available in Container

**Problem**: FFmpeg errors in Docker

**Solution**:
1. **Check Dockerfile**:
   ```dockerfile
   RUN apt-get update && apt-get install -y ffmpeg
   ```

2. **Rebuild image**:
   ```bash
   docker-compose build backend
   ```

3. **Verify in container**:
   ```bash
   docker exec -it divideit-backend ffmpeg -version
   ```

### Volume Mount Issues

**Problem**: Files not persisting or permissions errors

**Solution**:
1. **Check volume mounts**:
   ```bash
   docker-compose config
   ```

2. **Fix permissions**:
   ```bash
   sudo chown -R $USER:$USER backend/uploads backend/processed backend/logs
   ```

3. **Check directory exists**:
   ```bash
   mkdir -p backend/uploads backend/processed backend/logs
   ```

## Performance Issues

### Slow Processing

**Problem**: Videos take too long to process

**Solution**:
1. **Optimize video before upload**:
   - Lower resolution (1080p instead of 4K)
   - Compress video
   - Use efficient codec (H.264)

2. **Reduce segments**:
   - Fewer segments = faster processing

3. **Check system resources**:
   ```bash
   # CPU usage
   top
   
   # Disk I/O
   iostat
   ```

4. **Use faster storage**:
   - SSD instead of HDD
   - Local storage instead of network

### High Memory Usage

**Problem**: Server uses too much memory

**Solution**:
1. **Process videos sequentially** (already implemented)

2. **Limit concurrent requests**:
   - Use rate limiting
   - Queue system (future feature)

3. **Clean up old files**:
   ```bash
   # Remove old processed files
   find backend/processed -type f -mtime +7 -delete
   ```

4. **Monitor memory**:
   ```bash
   free -h
   # Or
   docker stats
   ```

## Error Messages

### Common Error Messages and Solutions

**"No video file provided"**
- Ensure file is selected before submitting
- Check file input is working

**"Invalid file type"**
- Use MP4, MOV, or AVI format
- Check file extension matches format

**"File too large"**
- Compress video or use smaller file
- Maximum size: 500MB

**"Video duration is less than minimum segment duration"**
- Increase video length or decrease minimum duration
- Minimum duration must be less than video length

**"Unable to generate valid segments"**
- Video may be too short for requested settings
- Adjust segment count or duration constraints

**"Failed to process video"**
- Check FFmpeg installation
- Verify video file isn't corrupted
- Check logs for detailed error

**"Rate limit exceeded"**
- Wait before making more requests
- Reduce request frequency

## Getting Additional Help

If you've tried the solutions above and still have issues:

1. **Check Logs**:
   ```bash
   # Backend logs
   tail -f backend/logs/combined.log
   tail -f backend/logs/error.log
   
   # Docker logs
   docker-compose logs -f
   ```

2. **Enable Debug Mode**:
   ```bash
   # Backend .env
   LOG_LEVEL=debug
   ```

3. **Check System Requirements**:
   - Node.js 20+
   - FFmpeg installed
   - Sufficient disk space
   - Adequate memory

4. **Create Issue**:
   - Include error messages
   - System information
   - Steps to reproduce
   - Log excerpts

5. **Community Support**:
   - GitHub Discussions
   - Check existing issues
   - Review documentation

## Prevention Tips

1. **Regular Maintenance**:
   - Clean up old processed files
   - Monitor disk space
   - Update dependencies regularly

2. **Monitoring**:
   - Set up log monitoring
   - Monitor system resources
   - Track error rates

3. **Testing**:
   - Test with small videos first
   - Verify settings before processing
   - Test after updates

4. **Backup**:
   - Download segments immediately
   - Keep original videos
   - Backup configuration
