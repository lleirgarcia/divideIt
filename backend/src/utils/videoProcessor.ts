import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { transcriptionService } from '../services/transcriptionService';
import { summarizationService } from '../services/summarizationService';
import { addTitleToVideo } from './videoTextOverlayCanvas';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface VideoSegment {
  startTime: number;
  endTime: number;
  duration: number;
  outputPath: string;
}

/**
 * Gets video metadata using FFprobe
 * 
 * Extracts video information including duration, dimensions, format, and file size.
 * Uses FFprobe (part of FFmpeg) to analyze the video file.
 * 
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<VideoMetadata>} Promise resolving to video metadata
 * @throws {Error} If video file cannot be read or has no video stream
 * 
 * @example
 * const metadata = await getVideoMetadata('./uploads/video.mp4');
 * console.log(`Duration: ${metadata.duration}s, Resolution: ${metadata.width}x${metadata.height}`);
 */
export const getVideoMetadata = (videoPath: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        format: metadata.format.format_name || 'unknown',
        size: metadata.format.size || 0
      });
    });
  });
};

/**
 * Generates random non-overlapping segments for video splitting
 * 
 * Creates random time segments within the video duration, ensuring:
 * - Segments don't overlap significantly (threshold: 50% of min duration)
 * - All segments fit within video duration
 * - Segments are sorted by start time
 * - Actual segment count may be less than requested if video is too short
 * 
 * @param {number} duration - Total video duration in seconds
 * @param {number} segmentCount - Number of segments to create (1-20)
 * @param {number} [minSegmentDuration=5] - Minimum duration for each segment in seconds
 * @param {number} [maxSegmentDuration=60] - Maximum duration for each segment in seconds
 * @returns {Array<{startTime: number, endTime: number, duration: number}>} Array of segment objects
 * 
 * @example
 * const segments = generateRandomSegments(120, 5, 5, 60);
 * // Returns: [{startTime: 10.5, endTime: 25.3, duration: 14.8}, ...]
 */
export const generateRandomSegments = (
  duration: number,
  segmentCount: number,
  minSegmentDuration: number = 5,
  maxSegmentDuration: number = 60
): Array<{ startTime: number; endTime: number; duration: number }> => {
  const segments: Array<{ startTime: number; endTime: number; duration: number }> = [];
  const usedTimes: number[] = [];

  // Ensure we don't exceed video duration
  const maxPossibleSegments = Math.floor(duration / minSegmentDuration);
  const actualSegmentCount = Math.min(segmentCount, maxPossibleSegments);

  for (let i = 0; i < actualSegmentCount; i++) {
    let attempts = 0;
    let segmentCreated = false;

    while (!segmentCreated && attempts < 100) {
      attempts++;
      
      // Generate random start time
      const maxStartTime = duration - minSegmentDuration;
      const startTime = Math.random() * maxStartTime;
      
      // Generate random duration within constraints
      const segmentDuration = Math.min(
        Math.random() * (maxSegmentDuration - minSegmentDuration) + minSegmentDuration,
        duration - startTime
      );
      
      const endTime = startTime + segmentDuration;

      // Check if this segment overlaps significantly with existing segments
      const hasOverlap = usedTimes.some(usedTime => {
        const overlapThreshold = minSegmentDuration * 0.5;
        return Math.abs(usedTime - startTime) < overlapThreshold;
      });

      if (!hasOverlap && segmentDuration >= minSegmentDuration) {
        segments.push({
          startTime: Math.round(startTime * 100) / 100,
          endTime: Math.round(endTime * 100) / 100,
          duration: Math.round(segmentDuration * 100) / 100
        });
        usedTimes.push(startTime);
        segmentCreated = true;
      }
    }
  }

  // Sort segments by start time
  return segments.sort((a, b) => a.startTime - b.startTime);
};

/**
 * Splits a video file into multiple segments using FFmpeg
 * 
 * Processes segments sequentially to avoid overwhelming the system.
 * Each segment is extracted with optimized encoding settings:
 * - Video codec: H.264 (libx264)
 * - Audio codec: AAC
 * - Preset: fast (balance between speed and quality)
 * - CRF: 23 (good quality)
 * - Fast start: enabled for web playback
 * 
 * @param {string} inputPath - Path to the input video file
 * @param {string} outputDir - Directory to save output segments
 * @param {Array<{startTime: number, endTime: number, duration: number}>} segments - Array of segment definitions
 * @returns {Promise<VideoSegment[]>} Promise resolving to array of created segments with file paths
 * @throws {Error} If FFmpeg processing fails for any segment
 * 
 * @example
 * const segments = [{startTime: 0, endTime: 10, duration: 10}, ...];
 * const outputSegments = await splitVideo('./video.mp4', './output', segments);
 */
export const splitVideo = async (
  inputPath: string,
  outputDir: string,
  segments: Array<{ startTime: number; endTime: number; duration: number }>
): Promise<VideoSegment[]> => {
  await fs.mkdir(outputDir, { recursive: true });

  const outputSegments: VideoSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const outputPath = path.join(outputDir, `segment_${i + 1}_${uuidv4()}.mp4`);

    console.log(`\n🎞️  Processing segment ${i + 1}/${segments.length}`);
    console.log(`   Time range: ${segment.startTime.toFixed(2)}s - ${segment.endTime.toFixed(2)}s`);
    console.log(`   Duration: ${segment.duration.toFixed(2)}s`);
    console.log(`   Output: ${outputPath}`);

    await new Promise<void>((resolve, reject) => {
      // Target resolution for 9:16 format (1080x1920 - Full HD vertical)
      const targetWidth = 1080;
      const targetHeight = 1920;

      ffmpeg(inputPath)
        .setStartTime(segment.startTime)
        .setDuration(segment.duration)
        .videoFilters([
          // Scale video to fit within 9:16 area while maintaining aspect ratio
          // This ensures no part of the video is cropped
          `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
          // Add black bars (padding) to fill remaining space and center the video
          // This maintains the entire image visible within the 9:16 frame
          `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`
        ])
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`   ⏳ FFmpeg started processing segment ${i + 1} (converting to 9:16, preserving full image)`);
          logger.info(`Processing segment ${i + 1}: ${commandLine}`);
        })
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          if (percent % 25 === 0) { // Log every 25% to avoid spam
            console.log(`   📊 Segment ${i + 1} progress: ${percent}%`);
          }
          logger.debug(`Segment ${i + 1} progress: ${percent}%`);
        })
        .on('end', async () => {
          console.log(`   ✅ Segment ${i + 1} completed successfully! (9:16 format, ${targetWidth}x${targetHeight}, full image preserved)`);
          logger.info(`Segment ${i + 1} completed: ${outputPath}`);
          
          // Transcribe the segment and save to .txt file
          try {
            console.log(`   🎤 Transcribing segment ${i + 1}...`);
            const transcription = await transcriptionService.transcribe(outputPath, {});
            
            // Create .txt file with same name as video
            const txtPath = outputPath.replace(/\.mp4$/, '.txt');
            await fs.writeFile(txtPath, transcription.text, 'utf-8');
            
            console.log(`   📝 Transcription saved: ${txtPath}`);
            logger.info(`Transcription saved for segment ${i + 1}: ${txtPath}`);
            
            // Summarize the transcription and save to _summary.txt file
            try {
              if (summarizationService.isAvailable() && transcription.text.trim().length > 0) {
                console.log(`   📊 Summarizing segment ${i + 1}...`);
                const summaryPath = outputPath.replace(/\.mp4$/, '_summary.txt');
                await summarizationService.summarizeFile(txtPath, summaryPath, {
                  maxLength: 100,
                  style: 'concise'
                });
                console.log(`   ✅ Summary saved: ${summaryPath}`);
                logger.info(`Summary saved for segment ${i + 1}: ${summaryPath}`);
                
                // Generate social media content (description + title) for TikTok/Instagram
                try {
                  console.log(`   📱 Generating social media content for segment ${i + 1}...`);
                  const socialContent = await summarizationService.generateSocialMediaContentFromFile(txtPath, {
                    maxLength: 150,
                    language: 'en' // Always generate in English
                  });
                  console.log(`   ✅ Social media content saved:`);
                  console.log(`      - Description: ${path.basename(socialContent.descriptionPath)}`);
                  console.log(`      - Title: ${path.basename(socialContent.titlePath)}`);
                  logger.info(`Social media content saved for segment ${i + 1}`);
                  
                  // Add title overlay to video in the top black bar area
                  try {
                    console.log(`   🎬 Adding title overlay to video segment ${i + 1}...`);
                    
                    // Create backup of original video before adding title (to prevent duplicate overlays)
                    const originalBackupPath = outputPath.replace(/\.mp4$/, '_original_no_title.mp4');
                    try {
                      await fs.copyFile(outputPath, originalBackupPath);
                      logger.info(`Created backup of original video: ${path.basename(originalBackupPath)}`);
                    } catch (backupError) {
                      logger.warn(`Failed to create backup: ${backupError}`);
                    }
                    
                    const videoWithTitlePath = await addTitleToVideo(outputPath, socialContent.titlePath);
                    
                    // Replace original video with version that has title
                    await fs.rename(videoWithTitlePath, outputPath);
                    
                    console.log(`   ✅ Title overlay added to video: ${path.basename(outputPath)}`);
                    logger.info(`Title overlay added to segment ${i + 1}: ${outputPath}`);
                  } catch (overlayError) {
                    // Log error but don't fail the entire process
                    console.warn(`   ⚠️  Failed to add title overlay to segment ${i + 1}: ${overlayError instanceof Error ? overlayError.message : 'Unknown error'}`);
                    logger.warn(`Failed to add title overlay to segment ${i + 1}: ${overlayError}`);
                  }
                } catch (socialError) {
                  // Log error but don't fail the entire process
                  console.warn(`   ⚠️  Failed to generate social media content for segment ${i + 1}: ${socialError instanceof Error ? socialError.message : 'Unknown error'}`);
                  logger.warn(`Failed to generate social media content for segment ${i + 1}: ${socialError}`);
                }
              }
            } catch (summaryError) {
              // Log error but don't fail the entire process
              console.warn(`   ⚠️  Failed to summarize segment ${i + 1}: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`);
              logger.warn(`Failed to summarize segment ${i + 1}: ${summaryError}`);
            }
          } catch (transcriptionError) {
            // Log error but don't fail the entire process
            console.warn(`   ⚠️  Failed to transcribe segment ${i + 1}: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`);
            logger.warn(`Failed to transcribe segment ${i + 1}: ${transcriptionError}`);
          }
          
          resolve();
        })
        .on('error', (err) => {
          console.error(`   ❌ Error processing segment ${i + 1}: ${err.message}`);
          logger.error(`Error processing segment ${i + 1}: ${err.message}`);
          reject(new Error(`Failed to process segment ${i + 1}: ${err.message}`));
        })
        .run();
    });

    outputSegments.push({
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration: segment.duration,
      outputPath
    });
  }

  console.log(`\n🎉 All ${outputSegments.length} segments processed successfully!`);

  return outputSegments;
};

/**
 * Cleans up temporary files by deleting them
 * 
 * Attempts to delete each file in the provided array.
 * Logs warnings for files that cannot be deleted but doesn't throw errors.
 * Useful for cleaning up uploaded videos and temporary processing files.
 * 
 * @param {string[]} filePaths - Array of file paths to delete
 * @returns {Promise<void>} Promise that resolves when cleanup is complete
 * 
 * @example
 * await cleanupFiles(['./uploads/temp1.mp4', './uploads/temp2.mp4']);
 */
export const cleanupFiles = async (filePaths: string[]): Promise<void> => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to cleanup file ${filePath}: ${error}`);
    }
  }
};
