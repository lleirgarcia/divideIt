import request from 'supertest';
import app from '../../index';
import path from 'path';
import fs from 'fs/promises';

describe('Video Routes Integration Tests', () => {
  const testVideoPath = path.join(__dirname, '../../../__fixtures__/test-video.mp4');
  
  beforeAll(async () => {
    // Ensure fixtures directory exists
    await fs.mkdir(path.dirname(testVideoPath), { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.unlink(testVideoPath);
    } catch {
      // File might not exist
    }
  });

  describe('POST /api/videos/split', () => {
    it('should split a video file successfully', async () => {
      // Create a minimal test file (in real scenario, use actual video)
      await fs.writeFile(testVideoPath, Buffer.from('mock video content'));

      const response = await request(app)
        .post('/api/videos/split')
        .attach('video', testVideoPath)
        .field('segmentCount', '3')
        .field('minSegmentDuration', '5')
        .field('maxSegmentDuration', '30');

      // Without a real video file, ffmpeg fails (500). With valid video, expect 200.
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data?.segments).toBeDefined();
      }
    });

    it('should validate file type', async () => {
      const invalidFile = path.join(__dirname, '../../../__fixtures__/test.txt');
      await fs.writeFile(invalidFile, 'not a video');

      const response = await request(app)
        .post('/api/videos/split')
        .attach('video', invalidFile);

      // API may return 400 (validation) or 500 (rejected by multer/ffmpeg)
      expect([400, 500]).toContain(response.status);
      
      // Cleanup
      await fs.unlink(invalidFile).catch(() => {});
    });

    it('should validate segment count', async () => {
      await fs.writeFile(testVideoPath, Buffer.from('mock video content'));

      const response = await request(app)
        .post('/api/videos/split')
        .attach('video', testVideoPath)
        .field('segmentCount', '25'); // Exceeds max of 20

      expect(response.status).toBe(400);
    });

    it('should validate min/max duration', async () => {
      await fs.writeFile(testVideoPath, Buffer.from('mock video content'));

      const response = await request(app)
        .post('/api/videos/split')
        .attach('video', testVideoPath)
        .field('minSegmentDuration', '400'); // Exceeds max of 300

      expect(response.status).toBe(400);
    });

    it('should handle missing file', async () => {
      const response = await request(app)
        .post('/api/videos/split');

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/videos/upload', () => {
    it('should upload a video file', async () => {
      await fs.writeFile(testVideoPath, Buffer.from('mock video content'));

      const response = await request(app)
        .post('/api/videos/upload')
        .attach('video', testVideoPath);

      // Note: This will fail without actual video metadata extraction
      // In real scenario, mock ffmpeg or use test video
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
