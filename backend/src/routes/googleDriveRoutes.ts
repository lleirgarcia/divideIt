import { Router, Request, Response } from 'express';
import { googleDriveService } from '../services/googleDriveService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

const router = Router();

// Lazy initialization - initialize when first needed
let isInitialized = false;

const initializeGoogleDrive = () => {
  if (isInitialized && googleDriveService.isInitialized()) {
    return true;
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3051/api/google-drive/oauth/callback';
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    logger.warn('Google Drive credentials not configured. Google Drive features will be unavailable.');
    return false;
  }

  googleDriveService.initialize({
    clientId,
    clientSecret,
    redirectUri,
    refreshToken
  });

  isInitialized = true;
  return true;
};

/**
 * Get Google Drive OAuth2 authorization URL
 * 
 * @route GET /api/google-drive/auth-url
 * @returns {Object} Authorization URL
 */
router.get('/auth-url', (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const authUrl = googleDriveService.getAuthUrl();
    
    res.json({
      success: true,
      data: {
        authUrl
      }
    });
  } catch (error: any) {
    logger.error(`Failed to get auth URL: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Handle OAuth2 callback and exchange code for tokens
 * 
 * @route GET /api/google-drive/oauth/callback
 * @param {string} code - Authorization code from Google
 * @returns {Object} Access token and refresh token
 */
router.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      throw createError('Authorization code is required', 400);
    }

    const tokens = await googleDriveService.getTokensFromCode(code);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'Authentication successful. Save the refresh token in your .env file as GOOGLE_DRIVE_REFRESH_TOKEN'
      }
    });
  } catch (error: any) {
    logger.error(`OAuth callback failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Set refresh token for authentication
 * 
 * @route POST /api/google-drive/set-token
 * @param {string} refreshToken - Refresh token from Google OAuth
 * @returns {Object} Success message
 */
router.post('/set-token', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const schema = z.object({
      refreshToken: z.string().min(1)
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    googleDriveService.setRefreshToken(validation.data.refreshToken);

    res.json({
      success: true,
      data: {
        message: 'Refresh token set successfully'
      }
    });
  } catch (error: any) {
    logger.error(`Failed to set refresh token: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Upload a file to Google Drive
 * 
 * @route POST /api/google-drive/upload
 * @param {string} filePath - Path to file to upload (relative to processed directory)
 * @param {string} [fileName] - Optional custom file name
 * @param {string} [folderId] - Optional Google Drive folder ID
 * @param {boolean} [makePublic=false] - Whether to make file publicly accessible
 * @returns {Object} Upload result with file ID and links
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const schema = z.object({
      filePath: z.string().min(1),
      fileName: z.string().optional(),
      folderId: z.string().optional(),
      makePublic: z.boolean().optional().default(false)
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { filePath, fileName, folderId, makePublic } = validation.data;

    // Resolve file path - could be relative to processed directory or absolute
    let fullPath: string;
    if (path.isAbsolute(filePath)) {
      fullPath = filePath;
    } else {
      // Try processed directory first
      const processedPath = path.join(process.cwd(), 'processed', filePath);
      try {
        await fs.access(processedPath);
        fullPath = processedPath;
      } catch {
        // Try uploads directory
        const uploadsPath = path.join(process.cwd(), 'uploads', filePath);
        try {
          await fs.access(uploadsPath);
          fullPath = uploadsPath;
        } catch {
          throw createError(`File not found: ${filePath}`, 404);
        }
      }
    }

    // Verify file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw createError(`File not found: ${fullPath}`, 404);
    }

    const result = await googleDriveService.uploadFile(fullPath, fileName, folderId, makePublic);

    logger.info(`File uploaded to Google Drive: ${result.fileId}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Failed to upload file to Google Drive: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Upload multiple files to Google Drive
 * 
 * @route POST /api/google-drive/upload-multiple
 * @param {string[]} filePaths - Array of file paths to upload
 * @param {string} [folderId] - Optional Google Drive folder ID
 * @param {boolean} [makePublic=false] - Whether to make files publicly accessible
 * @returns {Object} Array of upload results
 */
router.post('/upload-multiple', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const schema = z.object({
      filePaths: z.array(z.string().min(1)),
      folderId: z.string().optional(),
      makePublic: z.boolean().optional().default(false)
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { filePaths, folderId, makePublic } = validation.data;

    // Resolve all file paths
    const resolvedPaths: string[] = [];
    for (const filePath of filePaths) {
      let fullPath: string;
      if (path.isAbsolute(filePath)) {
        fullPath = filePath;
      } else {
        const processedPath = path.join(process.cwd(), 'processed', filePath);
        try {
          await fs.access(processedPath);
          fullPath = processedPath;
        } catch {
          const uploadsPath = path.join(process.cwd(), 'uploads', filePath);
          try {
            await fs.access(uploadsPath);
            fullPath = uploadsPath;
          } catch {
            logger.warn(`File not found, skipping: ${filePath}`);
            continue;
          }
        }
      }
      resolvedPaths.push(fullPath);
    }

    if (resolvedPaths.length === 0) {
      throw createError('No valid files found to upload', 404);
    }

    const results = await googleDriveService.uploadFiles(resolvedPaths, folderId, makePublic);

    logger.info(`Uploaded ${results.length} files to Google Drive`);

    res.json({
      success: true,
      data: {
        uploaded: results.length,
        results
      }
    });
  } catch (error: any) {
    logger.error(`Failed to upload files to Google Drive: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Share a file on Google Drive
 * 
 * @route POST /api/google-drive/share
 * @param {string} fileId - Google Drive file ID
 * @param {string} type - Permission type: 'user', 'anyone', or 'domain'
 * @param {string} role - Permission role: 'reader', 'writer', or 'commenter'
 * @param {string} [emailAddress] - Email address (required if type is 'user')
 * @returns {Object} Share result with shareable link
 */
router.post('/share', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const schema = z.object({
      fileId: z.string().min(1),
      type: z.enum(['user', 'anyone', 'domain']),
      role: z.enum(['reader', 'writer', 'commenter']),
      emailAddress: z.string().email().optional()
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { fileId, type, role, emailAddress } = validation.data;

    if (type === 'user' && !emailAddress) {
      throw createError('emailAddress is required when type is "user"', 400);
    }

    const result = await googleDriveService.shareFile(fileId, type, role, emailAddress);

    logger.info(`File shared: ${fileId}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Failed to share file: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Upload video segment and share it
 * Also uploads associated files (summary.txt, transcription.txt) if they exist
 * 
 * @route POST /api/google-drive/upload-segment
 * @param {string} segmentPath - Path to segment file (relative to processed directory)
 * @param {string} [videoId] - Video ID to find segment in processed directory
 * @param {string} [folderId] - Optional Google Drive folder ID
 * @param {boolean} [makePublic=true] - Whether to make file publicly accessible
 * @param {boolean} [includeSummary=true] - Whether to upload summary.txt file if it exists
 * @param {boolean} [includeTranscription=false] - Whether to upload transcription.txt file if it exists
 * @returns {Object} Upload and share result
 */
router.post('/upload-segment', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const schema = z.object({
      segmentPath: z.string().min(1),
      videoId: z.string().optional(),
      folderId: z.string().optional(),
      folderName: z.string().min(1).optional(),
      makePublic: z.boolean().optional().default(true),
      includeSummary: z.boolean().optional().default(true),
      includeTranscription: z.boolean().optional().default(false)
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { segmentPath, videoId, folderId, folderName, makePublic, includeSummary, includeTranscription } = validation.data;

    // Resolve segment path
    let fullPath: string;
    let segmentDir: string;
    
    if (path.isAbsolute(segmentPath)) {
      fullPath = segmentPath;
      segmentDir = path.dirname(fullPath);
    } else if (videoId) {
      fullPath = path.join(process.cwd(), 'processed', videoId, segmentPath);
      segmentDir = path.join(process.cwd(), 'processed', videoId);
    } else {
      // Search in processed directories
      const processedDir = path.join(process.cwd(), 'processed');
      try {
        const dirs = await fs.readdir(processedDir);
        let found = false;
        for (const dir of dirs) {
          const testPath = path.join(processedDir, dir, segmentPath);
          try {
            await fs.access(testPath);
            fullPath = testPath;
            segmentDir = path.join(processedDir, dir);
            found = true;
            break;
          } catch {
            // Continue searching
          }
        }
        if (!found) {
          throw createError(`Segment file not found: ${segmentPath}`, 404);
        }
      } catch {
        throw createError(`Segment file not found: ${segmentPath}`, 404);
      }
    }

    // Verify file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw createError(`Segment file not found: ${fullPath}`, 404);
    }

    // Ensure we're uploading the final video (with title), not the original backup
    if (fullPath.includes('_original_no_title.mp4')) {
      const finalVideoPath = fullPath.replace('_original_no_title.mp4', '.mp4');
      try {
        await fs.access(finalVideoPath);
        fullPath = finalVideoPath;
        logger.info(`Using final video version (with title): ${path.basename(finalVideoPath)}`);
      } catch {
        throw createError('Only final video files (with title overlay) should be uploaded', 400);
      }
    }

    let targetFolderId: string | undefined = folderId;
    if (!targetFolderId && folderName) {
      try {
        targetFolderId = await googleDriveService.getOrCreateFolderInDivideIt(folderName);
        logger.info(`Using custom folder in divideIt: ${folderName} (${targetFolderId})`);
      } catch (error: any) {
        logger.warn(`Failed to get/create folder by name, falling back: ${error.message}`);
      }
    }
    if (!targetFolderId && videoId) {
      try {
        targetFolderId = await googleDriveService.getVideoFolder(videoId);
        logger.info(`Using video folder in divideIt: ${videoId} (${targetFolderId})`);
      } catch (error: any) {
        logger.warn(`Failed to get video folder, uploading to root: ${error.message}`);
      }
    }

    const uploadResults: any[] = [];
    const shareResults: any[] = [];

    // Upload video file
    const videoUploadResult = await googleDriveService.uploadFile(
      fullPath,
      path.basename(fullPath),
      targetFolderId,
      makePublic
    );
    uploadResults.push(videoUploadResult);

    // Share video file if makePublic is true
    if (makePublic) {
      const videoShareResult = await googleDriveService.shareFile(videoUploadResult.fileId, 'anyone', 'reader');
      shareResults.push(videoShareResult);
    }

    // Upload summary.txt file if it exists and includeSummary is true
    if (includeSummary) {
      const baseName = path.basename(fullPath, path.extname(fullPath));
      const summaryPath = path.join(segmentDir, `${baseName}_summary.txt`);
      
      try {
        await fs.access(summaryPath);
        const summaryUploadResult = await googleDriveService.uploadFile(
          summaryPath,
          path.basename(summaryPath),
          targetFolderId,
          makePublic
        );
        uploadResults.push(summaryUploadResult);
        
        if (makePublic) {
          const summaryShareResult = await googleDriveService.shareFile(summaryUploadResult.fileId, 'anyone', 'reader');
          shareResults.push(summaryShareResult);
        }
        
        logger.info(`Summary file uploaded: ${summaryPath}`);
      } catch {
        logger.debug(`Summary file not found: ${summaryPath}`);
      }
    }

    // Upload transcription.txt file if it exists and includeTranscription is true
    if (includeTranscription) {
      const baseName = path.basename(fullPath, path.extname(fullPath));
      const transcriptionPath = path.join(segmentDir, `${baseName}.txt`);
      
      try {
        await fs.access(transcriptionPath);
        const transcriptionUploadResult = await googleDriveService.uploadFile(
          transcriptionPath,
          path.basename(transcriptionPath),
          targetFolderId,
          makePublic
        );
        uploadResults.push(transcriptionUploadResult);
        
        if (makePublic) {
          const transcriptionShareResult = await googleDriveService.shareFile(transcriptionUploadResult.fileId, 'anyone', 'reader');
          shareResults.push(transcriptionShareResult);
        }
        
        logger.info(`Transcription file uploaded: ${transcriptionPath}`);
      } catch {
        logger.debug(`Transcription file not found: ${transcriptionPath}`);
      }
    }

    logger.info(`Segment and associated files uploaded to Google Drive: ${uploadResults.length} files`);

    res.json({
      success: true,
      data: {
        video: {
          upload: videoUploadResult,
          share: shareResults[0] || null
        },
        summary: includeSummary && uploadResults.length > 1 ? {
          upload: uploadResults[1],
          share: shareResults[1] || null
        } : null,
        transcription: includeTranscription && uploadResults.length > (includeSummary ? 2 : 1) ? {
          upload: uploadResults[includeSummary ? 2 : 1],
          share: shareResults[includeSummary ? 2 : 1] || null
        } : null,
        allUploads: uploadResults,
        allShares: shareResults
      }
    });
  } catch (error: any) {
    logger.error(`Failed to upload segment to Google Drive: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Create a folder in Google Drive
 * 
 * @route POST /api/google-drive/create-folder
 * @param {string} folderName - Name of the folder to create
 * @param {string} [parentFolderId] - Optional parent folder ID
 * @returns {Object} Folder ID
 */
router.post('/create-folder', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const schema = z.object({
      folderName: z.string().min(1),
      parentFolderId: z.string().optional()
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw createError(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { folderName, parentFolderId } = validation.data;

    const folderId = await googleDriveService.createFolder(folderName, parentFolderId);

    res.json({
      success: true,
      data: {
        folderId,
        folderName
      }
    });
  } catch (error: any) {
    logger.error(`Failed to create folder: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

/**
 * Check Google Drive service status
 * 
 * @route GET /api/google-drive/status
 * @returns {Object} Service status
 */
router.get('/status', (req: Request, res: Response) => {
  const configured = !!(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET
  );
  
  // Try to initialize if not already initialized
  const initialized = configured && initializeGoogleDrive() && googleDriveService.isInitialized();
  
  res.json({
    success: true,
    data: {
      initialized,
      configured,
      authenticated: !!process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    }
  });
});

/**
 * Upload all processed videos from /processed directory
 * 
 * @route POST /api/google-drive/upload-all-processed
 * @returns {Object} Upload results for all videos
 */
router.post('/upload-all-processed', async (req: Request, res: Response) => {
  try {
    if (!initializeGoogleDrive()) {
      throw createError('Google Drive service not configured', 503);
    }

    const processedDir = path.join(process.cwd(), 'processed');
    const results: any[] = [];
    let totalUploaded = 0;
    let totalFailed = 0;

    try {
      // Get all video folders
      const entries = await fs.readdir(processedDir, { withFileTypes: true });
      const videoFolders = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      if (videoFolders.length === 0) {
        return res.json({
          success: true,
          data: {
            message: 'No processed videos found',
            videosProcessed: 0,
            totalUploaded: 0,
            totalFailed: 0,
            results: []
          }
        });
      }

      // Process each video folder
      for (const videoId of videoFolders) {
        const videoDir = path.join(processedDir, videoId);
        const files = await fs.readdir(videoDir);
        
        // Filter only final video files (not _original_no_title)
        const videoFiles = files.filter(file => 
          file.endsWith('.mp4') && !file.includes('_original_no_title')
        ).sort();

        const videoResult = {
          videoId,
          segments: [],
          uploaded: 0,
          failed: 0
        };

        // Upload each segment
        for (const filename of videoFiles) {
          try {
            // Get video folder in Google Drive
            const targetFolderId = await googleDriveService.getVideoFolder(videoId);
            
            // Resolve file paths
            const fullPath = path.join(videoDir, filename);
            const baseName = path.basename(fullPath, path.extname(fullPath));
            const summaryPath = path.join(videoDir, `${baseName}_summary.txt`);

            // Upload video
            const videoUploadResult = await googleDriveService.uploadFile(
              fullPath,
              filename,
              targetFolderId,
              true // makePublic
            );
            await googleDriveService.shareFile(videoUploadResult.fileId, 'anyone', 'reader');

            // Upload summary if exists
            let summaryUploadResult = null;
            try {
              await fs.access(summaryPath);
              summaryUploadResult = await googleDriveService.uploadFile(
                summaryPath,
                path.basename(summaryPath),
                targetFolderId,
                true
              );
              await googleDriveService.shareFile(summaryUploadResult.fileId, 'anyone', 'reader');
            } catch {
              // Summary not found, skip
            }

            videoResult.segments.push({
              filename,
              success: true,
              videoLink: videoUploadResult.webViewLink,
              summaryLink: summaryUploadResult?.webViewLink || null
            });
            videoResult.uploaded++;
            totalUploaded++;
          } catch (error: any) {
            videoResult.segments.push({
              filename,
              success: false,
              error: error.message
            });
            videoResult.failed++;
            totalFailed++;
          }
        }

        results.push(videoResult);
      }

      logger.info(`Uploaded all processed videos: ${totalUploaded} segments from ${videoFolders.length} videos`);

      res.json({
        success: true,
        data: {
          videosProcessed: videoFolders.length,
          totalUploaded,
          totalFailed,
          results
        }
      });
    } catch (error: any) {
      logger.error(`Failed to upload all processed videos: ${error.message}`);
      throw createError(`Failed to upload all processed videos: ${error.message}`, 500);
    }
  } catch (error: any) {
    logger.error(`Failed to upload all processed videos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

export { router as googleDriveRoutes };
