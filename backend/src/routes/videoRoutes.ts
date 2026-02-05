import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import {
  getVideoMetadata,
  generateRandomSegments,
  splitVideo,
  cleanupFiles,
  VideoSegment
} from '../utils/videoProcessor';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import fs from 'fs/promises';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const allowedExts = ['.mp4', '.mov', '.avi'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MOV, and AVI files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Validation schema
const splitVideoSchema = z.object({
  segmentCount: z.number().int().min(1).max(20).optional().default(5),
  minSegmentDuration: z.number().min(1).max(300).optional().default(5),
  maxSegmentDuration: z.number().min(1).max(300).optional().default(60)
});

/**
 * POST /api/videos/upload
 * Upload a video file
 */
router.post('/upload', uploadRateLimiter, upload.single('video'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      throw createError('No video file provided', 400);
    }

    const videoPath = req.file.path;
    
    try {
      const metadata = await getVideoMetadata(videoPath);
      
      res.json({
        success: true,
        data: {
          fileId: path.basename(videoPath, path.extname(videoPath)),
          filename: req.file.originalname,
          path: videoPath,
          metadata
        }
      });
    } catch (error) {
      // Clean up uploaded file if metadata extraction fails
      await fs.unlink(videoPath).catch(() => {});
      throw createError(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/videos/split
 * Split an uploaded video into random segments
 */
router.post('/split', uploadRateLimiter, upload.single('video'), async (req: Request, res: Response, next) => {
  let videoPath: string | undefined;
  let outputDir: string | undefined;

  try {
    if (!req.file) {
      throw createError('No video file provided', 400);
    }

    videoPath = req.file.path;

    // Validate request body
    const validation = splitVideoSchema.safeParse({
      segmentCount: req.body.segmentCount ? parseInt(req.body.segmentCount) : undefined,
      minSegmentDuration: req.body.minSegmentDuration ? parseFloat(req.body.minSegmentDuration) : undefined,
      maxSegmentDuration: req.body.maxSegmentDuration ? parseFloat(req.body.maxSegmentDuration) : undefined
    });

    if (!validation.success) {
      await fs.unlink(videoPath).catch(() => {});
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { segmentCount, minSegmentDuration, maxSegmentDuration } = validation.data;

    // Get video metadata
    const metadata = await getVideoMetadata(videoPath);

    if (metadata.duration < minSegmentDuration) {
      await fs.unlink(videoPath).catch(() => {});
      throw createError(`Video duration (${metadata.duration}s) is less than minimum segment duration (${minSegmentDuration}s)`, 400);
    }

    // Generate random segments
    const segments = generateRandomSegments(
      metadata.duration,
      segmentCount,
      minSegmentDuration,
      maxSegmentDuration
    );

    if (segments.length === 0) {
      await fs.unlink(videoPath).catch(() => {});
      throw createError('Unable to generate valid segments for this video', 400);
    }

    // Create output directory
    const fileId = path.basename(videoPath, path.extname(videoPath));
    outputDir = path.join('processed', fileId);
    await fs.mkdir(outputDir, { recursive: true });

    // Split video
    logger.info(`Splitting video into ${segments.length} segments`);
    const outputSegments = await splitVideo(videoPath, outputDir, segments);

    // Prepare response
    const responseSegments: Array<{
      segmentNumber: number;
      startTime: number;
      endTime: number;
      duration: number;
      downloadUrl: string;
    }> = outputSegments.map((segment, index) => ({
      segmentNumber: index + 1,
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration: segment.duration,
      downloadUrl: `/api/videos/download/${path.basename(segment.outputPath)}`
    }));

    res.json({
      success: true,
      data: {
        originalVideo: {
          filename: req.file.originalname,
          duration: metadata.duration,
          metadata
        },
        segments: responseSegments,
        totalSegments: segments.length
      }
    });
  } catch (error) {
    // Cleanup on error
    if (videoPath) {
      await fs.unlink(videoPath).catch(() => {});
    }
    if (outputDir) {
      await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
    }
    next(error);
  }
});

/**
 * GET /api/videos/download/:filename
 * Download a processed video segment
 */
router.get('/download/:filename', async (req: Request, res: Response, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('processed', filename.split('_')[1] || '', filename);

    try {
      await fs.access(filePath);
      res.download(filePath, (err) => {
        if (err) {
          logger.error(`Error downloading file ${filename}: ${err.message}`);
          if (!res.headersSent) {
            next(createError('Failed to download file', 500));
          }
        }
      });
    } catch {
      throw createError('File not found', 404);
    }
  } catch (error) {
    next(error);
  }
});

export { router as videoRoutes };
