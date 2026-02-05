import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import {
  getVideoMetadata,
  generateRandomSegments,
  splitVideo
} from '../utils/videoProcessor';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { transcriptionService } from '../services/transcriptionService';
import { summarizationService } from '../services/summarizationService';
import { addTextOverlayToVideo } from '../utils/videoTextOverlayCanvas';
import fs from 'fs/promises';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  }
});

// Validation schema
const splitVideoSchema = z.object({
  segmentCount: z.number().int().min(1).max(20).optional().default(5),
  minSegmentDuration: z.number().min(1).max(300).optional().default(5),
  maxSegmentDuration: z.number().min(1).max(300).optional().default(60)
});

/**
 * Upload a video file
 * 
 * Uploads a video file and returns metadata without processing.
 * Useful for two-step upload and split workflow.
 * 
 * @route POST /api/videos/upload
 * @param {File} video - Video file (multipart/form-data)
 * @returns {Object} Upload response with file ID and metadata
 * @throws {400} If no file provided or file is invalid
 * @throws {429} If rate limit exceeded
 * 
 * @example
 * POST /api/videos/upload
 * FormData: { video: File }
 * Response: {
 *   success: true,
 *   data: {
 *     fileId: 'uuid',
 *     filename: 'video.mp4',
 *     path: 'uploads/uuid.mp4',
 *     metadata: { duration: 120, ... }
 *   }
 * }
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
 * Upload and split video into random segments
 * 
 * Uploads a video file and immediately splits it into random segments.
 * This is a single-step operation combining upload and processing.
 * 
 * Processing flow:
 * 1. Upload and validate video file
 * 2. Extract video metadata using FFprobe
 * 3. Generate random non-overlapping segments
 * 4. Extract segments using FFmpeg
 * 5. Return segment information with download URLs
 * 
 * @route POST /api/videos/split
 * @param {File} video - Video file (multipart/form-data, required)
 * @param {number} [segmentCount=3] - Number of segments (1-20, optional)
 * @param {number} [minSegmentDuration=5] - Minimum segment duration in seconds (1-300, optional)
 * @param {number} [maxSegmentDuration=60] - Maximum segment duration in seconds (1-300, optional)
 * @returns {Object} Split response with original video info and segments
 * @throws {400} If file invalid, parameters invalid, or video too short
 * @throws {413} If file exceeds 1GB limit
 * @throws {429} If rate limit exceeded
 * @throws {500} If processing fails
 * 
 * @example
 * POST /api/videos/split
 * FormData: {
 *   video: File,
 *   segmentCount: '3',
 *   minSegmentDuration: '5',
 *   maxSegmentDuration: '60'
 * }
 * Response: {
 *   success: true,
 *   data: {
 *     originalVideo: { filename: '...', duration: 120, ... },
 *     segments: [{ segmentNumber: 1, startTime: 10, ... }, ...],
 *     totalSegments: 3
 *   }
 * }
 */
router.post('/split', uploadRateLimiter, upload.single('video'), async (req: Request, res: Response, next) => {
  let videoPath: string | undefined;
  let outputDir: string | undefined;

  try {
    console.log('🎬 ===== VIDEO SPLIT REQUEST STARTED =====');
    console.log('📤 Received video split request');
    
    if (!req.file) {
      throw createError('No video file provided', 400);
    }

    videoPath = req.file.path;
    console.log(`📁 Video file: ${req.file.originalname}`);
    console.log(`📂 Saved to: ${videoPath}`);
    console.log(`📊 File size: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB`);

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
    console.log(`⚙️  Split settings:`);
    console.log(`   - Segment count: ${segmentCount}`);
    console.log(`   - Min duration: ${minSegmentDuration}s`);
    console.log(`   - Max duration: ${maxSegmentDuration}s`);

    // Get video metadata
    console.log('🔍 Extracting video metadata...');
    const metadata = await getVideoMetadata(videoPath);
    console.log(`✅ Video metadata extracted:`);
    console.log(`   - Duration: ${metadata.duration.toFixed(2)}s`);
    console.log(`   - Resolution: ${metadata.width}x${metadata.height}`);
    console.log(`   - Format: ${metadata.format}`);
    console.log(`   - Size: ${(metadata.size / (1024 * 1024)).toFixed(2)} MB`);

    if (metadata.duration < minSegmentDuration) {
      await fs.unlink(videoPath).catch(() => {});
      throw createError(`Video duration (${metadata.duration}s) is less than minimum segment duration (${minSegmentDuration}s)`, 400);
    }

    // Generate random segments
    console.log('🎲 Generating random segments...');
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

    console.log(`✅ Generated ${segments.length} segments:`);
    segments.forEach((seg, idx) => {
      console.log(`   Segment ${idx + 1}: ${seg.startTime.toFixed(2)}s - ${seg.endTime.toFixed(2)}s (${seg.duration.toFixed(2)}s)`);
    });

    // Create output directory
    const fileId = path.basename(videoPath, path.extname(videoPath));
    outputDir = path.join('processed', fileId);
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Output directory created: ${outputDir}`);

    // Split video
    console.log(`✂️  Starting video split process...`);
    logger.info(`Splitting video into ${segments.length} segments`);
    const outputSegments = await splitVideo(videoPath, outputDir, segments);
    console.log(`✅ Video split completed successfully!`);
    console.log(`📦 Created ${outputSegments.length} segment files`);

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

    console.log('📤 Sending response to client...');
    console.log(`✅ ===== VIDEO SPLIT COMPLETED SUCCESSFULLY =====`);
    console.log(`   Total segments: ${responseSegments.length}`);
    console.log(`   Original video: ${req.file.originalname}`);
    console.log(`   Video duration: ${metadata.duration.toFixed(2)}s`);
    console.log('===========================================\n');

    res.json({
      success: true,
      data: {
        videoId: fileId, // Add videoId to response
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
    console.error('❌ ===== VIDEO SPLIT FAILED =====');
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('===================================\n');
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
 * Download a processed video segment
 * 
 * Serves a processed video segment file for download.
 * Files are stored in the processed directory organized by video ID.
 * 
 * @route GET /api/videos/download/:filename
 * @param {string} filename - Segment filename (e.g., 'segment_1_uuid.mp4')
 * @returns {File} Video segment file (video/mp4)
 * @throws {404} If segment file not found
 * 
 * @example
 * GET /api/videos/download/segment_1_a1b2c3d4.mp4
 * Response: Binary video file
 */
router.get('/download/:filename', async (req: Request, res: Response, next) => {
  try {
    const filename = req.params.filename;
    const videoId = req.query.videoId as string | undefined;

    let filePath: string;
    if (videoId) {
      filePath = path.join(process.cwd(), 'processed', videoId, filename);
    } else {
      // Fallback: search in processed directories
      const processedDir = path.join(process.cwd(), 'processed');
      const dirs = await fs.readdir(processedDir).catch(() => []);
      let found = false;
      filePath = path.join(processedDir, filename.split('_')[1] || '', filename);
      for (const dir of dirs) {
        const testPath = path.join(processedDir, dir, filename);
        try {
          await fs.access(testPath);
          filePath = testPath;
          found = true;
          break;
        } catch {
          // continue
        }
      }
      if (!found) {
        throw createError('File not found', 404);
      }
    }

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

/**
 * Get segment summary (written content) text
 *
 * @route GET /api/videos/segment-summary
 * @param {string} videoId - Video ID (processed folder name)
 * @param {string} filename - Segment filename (e.g. segment_1_uuid.mp4)
 * @returns {Object} { summary: string }
 */
router.get('/segment-summary', async (req: Request, res: Response, next) => {
  try {
    const videoId = req.query.videoId as string;
    const filename = req.query.filename as string;

    if (!videoId || !filename) {
      throw createError('videoId and filename are required', 400);
    }

    const baseName = path.basename(filename, path.extname(filename));
    const summaryPath = path.join(process.cwd(), 'processed', videoId, `${baseName}_summary.txt`);

    try {
      const summary = await fs.readFile(summaryPath, 'utf-8');
      res.json({ success: true, data: { summary } });
    } catch {
      res.json({ success: true, data: { summary: '' } });
    }
  } catch (error) {
    next(error);
  }
});

// Validation schema for transcription
const transcribeSchema = z.object({
  language: z.string().optional(),
  prompt: z.string().optional(),
  responseFormat: z.enum(['json', 'text', 'srt', 'verbose_json', 'vtt']).optional(),
  temperature: z.number().min(0).max(1).optional()
});

/**
 * Transcribe a video or audio file
 * 
 * Extracts audio from video (if needed) and transcribes it to text.
 * Supports multiple transcription providers (OpenAI Whisper, AssemblyAI, Deepgram).
 * 
 * @route POST /api/videos/transcribe
 * @param {File} video - Video or audio file (multipart/form-data, required)
 * @param {string} [language] - Language code (ISO 639-1, e.g., 'en', 'es', 'fr'). Auto-detect if not provided
 * @param {string} [prompt] - Context prompt to improve accuracy
 * @param {string} [responseFormat] - Response format: 'json', 'text', 'srt', 'verbose_json', 'vtt'
 * @param {number} [temperature] - Temperature (0-1), lower = more deterministic
 * @returns {Object} Transcription result with text and metadata
 * @throws {400} If no file provided or file is invalid
 * @throws {500} If transcription fails
 * 
 * @example
 * POST /api/videos/transcribe
 * FormData: {
 *   video: File,
 *   language: 'en',
 *   prompt: 'This is a tutorial about video editing'
 * }
 * Response: {
 *   success: true,
 *   data: {
 *     text: 'Hello, this is the transcribed text...',
 *     language: 'en',
 *     duration: 120.5,
 *     provider: 'openai'
 *   }
 * }
 */
router.post('/transcribe', uploadRateLimiter, upload.single('video'), async (req: Request, res: Response, next) => {
  let videoPath: string | undefined;

  try {
    if (!req.file) {
      throw createError('No video or audio file provided', 400);
    }

    videoPath = req.file.path;
    logger.info(`Transcribing file: ${req.file.originalname}`);

    // Validate optional parameters
    const validation = transcribeSchema.safeParse({
      language: req.body.language,
      prompt: req.body.prompt,
      responseFormat: req.body.responseFormat,
      temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined
    });

    if (!validation.success) {
      await fs.unlink(videoPath).catch(() => {});
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const options = validation.data;

    // Transcribe the video/audio
    const result = await transcriptionService.transcribe(videoPath, options);

    logger.info(`Transcription completed: ${result.text.substring(0, 50)}...`);

    res.json({
      success: true,
      data: {
        text: result.text,
        language: result.language,
        duration: result.duration,
        segments: result.segments,
        provider: transcriptionService.getCurrentProvider()
      }
    });
  } catch (error) {
    if (videoPath) {
      await fs.unlink(videoPath).catch(() => {});
    }
    next(error);
  }
});

/**
 * Transcribe a specific video segment
 * 
 * Transcribes a processed video segment by filename.
 * Useful for getting transcriptions of individual segments after splitting.
 * 
 * @route POST /api/videos/transcribe-segment/:filename
 * @param {string} filename - Segment filename (e.g., 'segment_1_uuid.mp4')
 * @param {string} [language] - Language code (ISO 639-1). Auto-detect if not provided
 * @param {string} [prompt] - Context prompt to improve accuracy
 * @returns {Object} Transcription result with text and metadata
 * @throws {404} If segment file not found
 * @throws {500} If transcription fails
 * 
 * @example
 * POST /api/videos/transcribe-segment/segment_1_a1b2c3d4.mp4?language=en
 * Response: {
 *   success: true,
 *   data: {
 *     text: 'Transcribed segment text...',
 *     language: 'en',
 *     duration: 15.3,
 *     provider: 'openai'
 *   }
 * }
 */
router.post('/transcribe-segment/:filename', async (req: Request, res: Response, next) => {
  try {
    const filename = req.params.filename;
    const videoId = req.body.videoId || req.query.videoId;
    
    let filePath: string | undefined;
    
    if (videoId) {
      // Use provided video ID
      filePath = path.join('processed', videoId as string, filename);
    } else {
      // Try to find the file by searching in processed directories
      // This is a fallback for when videoId is not provided
      const processedDir = path.join(process.cwd(), 'processed');
      try {
        const dirs = await fs.readdir(processedDir);
        
        for (const dir of dirs) {
          const testPath = path.join(processedDir, dir, filename);
          try {
            await fs.access(testPath);
            filePath = testPath;
            break;
          } catch {
            // Continue searching
          }
        }
      } catch {
        // processed directory doesn't exist
      }
      
      if (!filePath) {
        throw createError('Segment file not found. Please provide videoId parameter.', 404);
      }
    }

    // Check if file exists
    if (!filePath) {
      throw createError('Segment file not found', 404);
    }
    
    try {
      await fs.access(filePath);
    } catch {
      throw createError('Segment file not found', 404);
    }

    logger.info(`Transcribing segment: ${filename}`);

    // Validate optional parameters
    const validation = transcribeSchema.safeParse({
      language: req.body.language || req.query.language,
      prompt: req.body.prompt || req.query.prompt,
      responseFormat: req.body.responseFormat || req.query.responseFormat,
      temperature: req.body.temperature || req.query.temperature ? parseFloat(req.body.temperature || req.query.temperature as string) : undefined
    });

    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const options = validation.data;

    // Transcribe the segment
    const result = await transcriptionService.transcribe(filePath, options);

    logger.info(`Segment transcription completed: ${result.text.substring(0, 50)}...`);

    res.json({
      success: true,
      data: {
        segmentFilename: filename,
        text: result.text,
        language: result.language,
        duration: result.duration,
        segments: result.segments,
        provider: transcriptionService.getCurrentProvider()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get available transcription providers
 * 
 * Returns list of transcription providers that are configured and available.
 * 
 * @route GET /api/videos/transcription-providers
 * @returns {Object} List of available providers
 * 
 * @example
 * GET /api/videos/transcription-providers
 * Response: {
 *   success: true,
 *   data: {
 *     available: ['openai', 'assemblyai'],
 *     current: 'openai'
 *   }
 * }
 */
router.get('/transcription-providers', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      available: transcriptionService.getAvailableProviders(),
      current: transcriptionService.getCurrentProvider()
    }
  });
});

// Validation schema for summarization
const summarizeSchema = z.object({
  maxLength: z.number().min(10).max(500).optional(),
  language: z.string().optional(),
  style: z.enum(['concise', 'detailed', 'bullet-points']).optional()
});

/**
 * Summarize a transcription text file
 * 
 * Summarizes an existing .txt file and creates a _summary.txt file.
 * Useful for summarizing transcriptions that were created before automatic summarization was added.
 * 
 * @route POST /api/videos/summarize/:filename
 * @param {string} filename - Transcription filename (e.g., 'segment_1_uuid.txt')
 * @param {string} [videoId] - Video ID (optional, will search if not provided)
 * @param {number} [maxLength=100] - Maximum length of summary in words (10-500)
 * @param {string} [language] - Language for summary (ISO 639-1 code)
 * @param {string} [style=concise] - Summary style: 'concise', 'detailed', or 'bullet-points'
 * @returns {Object} Summary result with file path
 * @throws {404} If transcription file not found
 * @throws {500} If summarization fails
 * 
 * @example
 * POST /api/videos/summarize/segment_1_uuid.txt?videoId=abc123&maxLength=150&style=bullet-points
 * Response: {
 *   success: true,
 *   data: {
 *     transcriptionFile: 'segment_1_uuid.txt',
 *     summaryFile: 'segment_1_uuid_summary.txt',
 *     summary: 'Summary text...'
 *   }
 * }
 */
router.post('/summarize/:filename', async (req: Request, res: Response, next) => {
  try {
    const filename = req.params.filename;
    const videoId = req.body.videoId || req.query.videoId;
    
    if (!filename.endsWith('.txt')) {
      throw createError('Filename must be a .txt file', 400);
    }
    
    let txtFilePath: string | undefined;
    
    if (videoId) {
      // Use provided video ID
      txtFilePath = path.join('processed', videoId as string, filename);
    } else {
      // Try to find the file by searching in processed directories
      const processedDir = path.join(process.cwd(), 'processed');
      try {
        const dirs = await fs.readdir(processedDir);
        
        for (const dir of dirs) {
          const testPath = path.join(processedDir, dir, filename);
          try {
            await fs.access(testPath);
            txtFilePath = testPath;
            break;
          } catch {
            // Continue searching
          }
        }
      } catch {
        // processed directory doesn't exist
      }
      
      if (!txtFilePath) {
        throw createError('Transcription file not found. Please provide videoId parameter.', 404);
      }
    }

    // Check if file exists
    if (!txtFilePath) {
      throw createError('Transcription file not found', 404);
    }
    
    try {
      await fs.access(txtFilePath);
    } catch {
      throw createError('Transcription file not found', 404);
    }

    // Validate optional parameters
    const validation = summarizeSchema.safeParse({
      maxLength: req.body.maxLength || req.query.maxLength ? parseInt(req.body.maxLength || req.query.maxLength as string) : undefined,
      language: req.body.language || req.query.language,
      style: req.body.style || req.query.style
    });

    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const options = validation.data;

    // Summarize the file
    const summaryPath = txtFilePath.replace(/\.txt$/, '_summary.txt');
    await summarizationService.summarizeFile(txtFilePath, summaryPath, {
      maxLength: options.maxLength || 100,
      language: options.language,
      style: options.style || 'concise'
    });

    // Read the summary to return it
    const summary = await fs.readFile(summaryPath, 'utf-8');

    logger.info(`Summary created for ${filename}`);

    res.json({
      success: true,
      data: {
        transcriptionFile: filename,
        summaryFile: path.basename(summaryPath),
        summary: summary,
        summaryPath: summaryPath
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generate social media content (description + title) for a transcription file
 * 
 * Generates optimized content for TikTok and Instagram Reels:
 * - Engaging description with hashtag suggestions
 * - Short catchy title (5-7 words)
 * 
 * @route POST /api/videos/social-media/:filename
 * @param {string} filename - Transcription filename (e.g., 'segment_1_uuid.txt')
 * @param {string} [videoId] - Video ID (optional, will search if not provided)
 * @param {number} [maxLength=150] - Maximum length of description in words (50-300)
 * @param {string} [language] - Language for content (ISO 639-1 code)
 * @returns {Object} Social media content with description and title
 * @throws {404} If transcription file not found
 * @throws {500} If generation fails
 * 
 * @example
 * POST /api/videos/social-media/segment_1_uuid.txt?videoId=abc123&maxLength=150
 * Response: {
 *   success: true,
 *   data: {
 *     transcriptionFile: 'segment_1_uuid.txt',
 *     descriptionFile: 'segment_1_uuid_social_description.txt',
 *     titleFile: 'segment_1_uuid_social_title.txt',
 *     description: 'Engaging description with hashtags...',
 *     title: 'Short Catchy Title Here'
 *   }
 * }
 */
router.post('/social-media/:filename', async (req: Request, res: Response, next) => {
  try {
    const filename = req.params.filename;
    const videoId = req.body.videoId || req.query.videoId;
    
    if (!filename.endsWith('.txt')) {
      throw createError('Filename must be a .txt file', 400);
    }
    
    let txtFilePath: string | undefined;
    
    if (videoId) {
      // Use provided video ID
      txtFilePath = path.join('processed', videoId as string, filename);
    } else {
      // Try to find the file by searching in processed directories
      const processedDir = path.join(process.cwd(), 'processed');
      try {
        const dirs = await fs.readdir(processedDir);
        
        for (const dir of dirs) {
          const testPath = path.join(processedDir, dir, filename);
          try {
            await fs.access(testPath);
            txtFilePath = testPath;
            break;
          } catch {
            // Continue searching
          }
        }
      } catch {
        // processed directory doesn't exist
      }
      
      if (!txtFilePath) {
        throw createError('Transcription file not found. Please provide videoId parameter.', 404);
      }
    }

    // Check if file exists
    if (!txtFilePath) {
      throw createError('Transcription file not found', 404);
    }
    
    try {
      await fs.access(txtFilePath);
    } catch {
      throw createError('Transcription file not found', 404);
    }

    // Validate optional parameters
    const maxLength = req.body.maxLength || req.query.maxLength 
      ? parseInt(req.body.maxLength || req.query.maxLength as string) 
      : 150;
    
    if (maxLength < 50 || maxLength > 300) {
      throw createError('maxLength must be between 50 and 300', 400);
    }

    const language = req.body.language || req.query.language;

    // Generate social media content
    const result = await summarizationService.generateSocialMediaContentFromFile(txtFilePath, {
      maxLength,
      language
    });

    logger.info(`Social media content created for ${filename}`);

    res.json({
      success: true,
      data: {
        transcriptionFile: filename,
        descriptionFile: path.basename(result.descriptionPath),
        titleFile: path.basename(result.titlePath),
        description: result.content.description,
        title: result.content.title,
        descriptionPath: result.descriptionPath,
        titlePath: result.titlePath
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Add title overlay to a video segment
 * 
 * Adds the title text as an overlay in the top black bar area of the video.
 * Reads the title from the corresponding _social_title.txt file.
 * 
 * @route POST /api/videos/add-title/:filename
 * @param {string} filename - Video filename (e.g., 'segment_1_uuid.mp4')
 * @param {string} [videoId] - Video ID (optional, will search if not provided)
 * @param {string} [titleText] - Custom title text (optional, will use _social_title.txt if not provided)
 * @returns {Object} Result with path to video with title overlay
 * @throws {404} If video or title file not found
 * @throws {500} If overlay fails
 * 
 * @example
 * POST /api/videos/add-title/segment_1_uuid.mp4?videoId=abc123
 * Response: {
 *   success: true,
 *   data: {
 *     originalVideo: 'segment_1_uuid.mp4',
 *     videoWithTitle: 'segment_1_uuid.mp4',
 *     message: 'Title overlay added successfully'
 *   }
 * }
 */
router.post('/add-title/:filename', async (req: Request, res: Response, next) => {
  try {
    const filename = req.params.filename;
    const videoId = req.body.videoId || req.query.videoId;
    const customTitle = req.body.titleText || req.query.titleText;
    
    if (!filename.endsWith('.mp4')) {
      throw createError('Filename must be a .mp4 file', 400);
    }
    
    let videoPath: string | undefined;
    
    if (videoId) {
      // Use provided video ID
      videoPath = path.join('processed', videoId as string, filename);
    } else {
      // Try to find the file by searching in processed directories
      const processedDir = path.join(process.cwd(), 'processed');
      try {
        const dirs = await fs.readdir(processedDir);
        
        for (const dir of dirs) {
          const testPath = path.join(processedDir, dir, filename);
          try {
            await fs.access(testPath);
            videoPath = testPath;
            break;
          } catch {
            // Continue searching
          }
        }
      } catch {
        // processed directory doesn't exist
      }
      
      if (!videoPath) {
        throw createError('Video file not found. Please provide videoId parameter.', 404);
      }
    }

    // Check if video file exists
    if (!videoPath) {
      throw createError('Video file not found', 404);
    }
    
    try {
      await fs.access(videoPath);
    } catch {
      throw createError('Video file not found', 404);
    }

    let titleText: string;
    let titleFilePath: string | undefined;

    if (customTitle) {
      // Use custom title text
      titleText = customTitle;
    } else {
      // Try to find title file
      const basePath = videoPath.replace(/\.mp4$/, '');
      titleFilePath = `${basePath}_social_title.txt`;
      
      try {
        await fs.access(titleFilePath);
        titleText = await fs.readFile(titleFilePath, 'utf-8').then(text => text.trim());
        
        if (!titleText) {
          throw createError('Title file is empty', 400);
        }
      } catch {
        throw createError(`Title file not found. Expected: ${path.basename(titleFilePath)}. You can provide custom title via titleText parameter.`, 404);
      }
    }

    // Check if there's a backup of the original video without title
    // This prevents adding multiple titles on top of each other
    const originalBackupPath = videoPath.replace(/\.mp4$/, '_original_no_title.mp4');
    let sourceVideoPath = videoPath;
    
    try {
      // Check if backup exists - use it as source to avoid duplicate overlays
      await fs.access(originalBackupPath);
      sourceVideoPath = originalBackupPath;
      logger.info(`Using original backup video without title: ${path.basename(originalBackupPath)}`);
    } catch {
      // No backup exists - create one from current video before adding title
      // This ensures we can replace titles without duplication
      try {
        await fs.copyFile(videoPath, originalBackupPath);
        logger.info(`Created backup of original video: ${path.basename(originalBackupPath)}`);
        sourceVideoPath = originalBackupPath;
      } catch (backupError) {
        // If backup fails, continue with current video (may have existing titles)
        logger.warn(`Failed to create backup, using current video: ${backupError}`);
        sourceVideoPath = videoPath;
      }
    }

    // Create temporary output path
    const tempOutputPath = videoPath.replace(/\.mp4$/, '_with_title_temp.mp4');

    // Add title overlay - positioned in top black bar, centered horizontally
    // Use sourceVideoPath (original backup if exists) to avoid duplicate overlays
    await addTextOverlayToVideo(sourceVideoPath, tempOutputPath, {
      text: titleText,
      position: 'top',
      fontSize: 56, // Larger for better visibility
      fontColor: 'white',
      backgroundColor: 'black',
      backgroundColorOpacity: 0.8, // More opaque background for better readability
      padding: 25, // More padding for better visibility
      fontWeight: 'bold', // Bold font for better visibility
      x: 0.5 // Center horizontally
    });

    // Replace original video with version that has title
    await fs.rename(tempOutputPath, videoPath);

    logger.info(`Title overlay added to video: ${filename}`);

    res.json({
      success: true,
      data: {
        originalVideo: filename,
        videoWithTitle: filename,
        title: titleText,
        message: 'Title overlay added successfully. Original video has been updated.'
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as videoRoutes };
