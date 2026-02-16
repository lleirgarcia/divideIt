import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { transcriptionService } from './transcriptionService';
import { summarizationService } from './summarizationService';
import { addTitleToVideo } from '../utils/videoTextOverlayCanvas';
import { mergeSubtitleSegments, formatSegmentsToSrtRaw, formatSegmentsToVttRaw } from '../utils/subtitleUtils';
import { burnSubtitlesIntoVideo } from '../utils/subtitleBurner';
import { alignSubtitleSegmentsToVideo, trimSegmentsToSoundOnly, addSilenceSegments } from '../utils/audioSyncUtils';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  filePath: string;
}

export class VideoService {
  private uploadsDir = path.join(process.cwd(), 'uploads');
  private processedDir = path.join(process.cwd(), 'processed');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directories', error);
    }
  }

  /**
   * Get video metadata using ffprobe
   */
  async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
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
  }

  /**
   * Generate random time segments for video splitting
   */
  private generateRandomSegments(
    duration: number,
    numSegments: number = 3,
    minDuration: number = 5,
    maxDuration: number = 60
  ): Array<{ start: number; end: number }> {
    const segments: Array<{ start: number; end: number }> = [];
    const usedTimes = new Set<number>();
    
    // Ensure minDuration and maxDuration are within video duration
    const actualMinDuration = Math.min(minDuration, duration / 2);
    const actualMaxDuration = Math.min(maxDuration, duration);

    for (let i = 0; i < numSegments; i++) {
      let start: number;
      let attempts = 0;
      const maxAttempts = 100;

      // Find a random start time that doesn't overlap significantly
      do {
        const maxStart = duration - actualMinDuration;
        start = Math.random() * maxStart;
        attempts++;
      } while (usedTimes.has(Math.floor(start)) && attempts < maxAttempts);

      usedTimes.add(Math.floor(start));

      // Random duration between min and max
      const segmentDuration = actualMinDuration + 
        Math.random() * (actualMaxDuration - actualMinDuration);
      const end = Math.min(start + segmentDuration, duration);

      segments.push({ start, end });
    }

    // Sort segments by start time
    segments.sort((a, b) => a.start - b.start);

    return segments;
  }

  /**
   * Split video into random segments.
   * Uses a timestamp-based folder (YYYYMMDD_HHmmss) and clip1.mp4, clip2.mp4, ... for output files.
   */
  async splitVideo(
    inputPath: string,
    _videoId: string,
    options: {
      numSegments?: number;
      minDuration?: number;
      maxDuration?: number;
    } = {}
  ): Promise<{ segments: VideoSegment[]; videoId: string }> {
    const metadata = await this.getVideoMetadata(inputPath);
    const {
      numSegments = 3,
      minDuration = 5,
      maxDuration = 60
    } = options;

    const segments = this.generateRandomSegments(
      metadata.duration,
      numSegments,
      minDuration,
      maxDuration
    );

    const now = new Date();
    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const videoDir = path.join(this.processedDir, timestamp);
    await fs.mkdir(videoDir, { recursive: true });

    const videoSegments: VideoSegment[] = [];

    // Process segments sequentially to avoid overwhelming the system
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const outputPath = path.join(videoDir, `clip${i + 1}.mp4`);

      await this.extractSegment(inputPath, segment.start, segment.end, outputPath);

      // Transcribe the segment and save to .txt file
      try {
        logger.info(`Transcribing segment ${i + 1}...`);
        const transcription = await transcriptionService.transcribe(outputPath, {}); // no language = original language, no translation
        
        // Create .txt file with same name as video
        const txtPath = outputPath.replace(/\.mp4$/, '.txt');
        await fs.writeFile(txtPath, transcription.text, 'utf-8');
        
        logger.info(`Transcription saved for segment ${i + 1}: ${txtPath}`);

        // Align, trim to speech only, merge 5 words, add silence cues (full timeline), burn only text
        if (transcription.segments?.length) {
          try {
            const aligned = await alignSubtitleSegmentsToVideo(transcription.segments, outputPath);
            const trimmed = await trimSegmentsToSoundOnly(aligned, outputPath);
            const merged = mergeSubtitleSegments(trimmed);
            const withSilence = await addSilenceSegments(merged, outputPath);
            const srtPath = outputPath.replace(/\.mp4$/, '.srt');
            await fs.writeFile(srtPath, formatSegmentsToSrtRaw(withSilence), 'utf-8');
            await fs.writeFile(outputPath.replace(/\.mp4$/, '.vtt'), formatSegmentsToVttRaw(withSilence), 'utf-8');
            logger.info(`Subtitles saved for segment ${i + 1}: ${srtPath}`);
            await burnSubtitlesIntoVideo(outputPath, srtPath);
            logger.info(`MP4 created with embedded subtitles for segment ${i + 1}`);
          } catch (subErr) {
            logger.warn(`Subtitle write or burn failed for segment ${i + 1}: ${subErr}`);
          }
        }

        // Summarize the transcription and save to _summary.txt file
        try {
          if (summarizationService.isAvailable() && transcription.text.trim().length > 0) {
            logger.info(`Summarizing segment ${i + 1}...`);
            const summaryPath = outputPath.replace(/\.mp4$/, '_summary.txt');
            await summarizationService.summarizeFile(txtPath, summaryPath, {
              maxLength: 100,
              style: 'concise',
              language: 'es'
            });
            logger.info(`Summary saved for segment ${i + 1}: ${summaryPath}`);
            
            // Generate social media content (description + title) for TikTok/Instagram
            try {
              logger.info(`Generating social media content for segment ${i + 1}...`);
              const socialContent = await summarizationService.generateSocialMediaContentFromFile(txtPath, {
                maxLength: 150,
                language: 'es'
              });
              logger.info(`Social media content saved for segment ${i + 1}: ${socialContent.descriptionPath} and ${socialContent.titlePath}`);
              
              // Add title overlay to video in the top black bar area
              try {
                logger.info(`Adding title overlay to video segment ${i + 1}...`);
                
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
                
                logger.info(`Title overlay added to segment ${i + 1}: ${outputPath}`);
              } catch (overlayError) {
                // Log error but don't fail the entire process
                logger.warn(`Failed to add title overlay to segment ${i + 1}: ${overlayError instanceof Error ? overlayError.message : 'Unknown error'}`);
              }
            } catch (socialError) {
              // Log error but don't fail the entire process
              logger.warn(`Failed to generate social media content for segment ${i + 1}: ${socialError instanceof Error ? socialError.message : 'Unknown error'}`);
            }
          }
        } catch (summaryError) {
          // Log error but don't fail the entire process
          logger.warn(`Failed to summarize segment ${i + 1}: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`);
        }
      } catch (transcriptionError) {
        // Log error but don't fail the entire process
        logger.warn(`Failed to transcribe segment ${i + 1}: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`);
      }

      videoSegments.push({
        id: String(i + 1),
        startTime: segment.start,
        endTime: segment.end,
        duration: segment.end - segment.start,
        filePath: outputPath
      });
    }

    logger.info(`Successfully created ${videoSegments.length} segments for video ${timestamp}`);
    return { segments: videoSegments, videoId: timestamp };
  }

  /**
   * Extract a single segment from video and convert to 9:16 format
   * 
   * Converts video to vertical 9:16 aspect ratio (1080x1920) suitable for
   * TikTok, Instagram Reels, and YouTube Shorts.
   * Maintains the entire video image visible by scaling and adding black bars (letterbox/pillarbox).
   */
  private async extractSegment(
    inputPath: string,
    startTime: number,
    endTime: number,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Target resolution for 9:16 format (1080x1920 - Full HD vertical)
      const targetWidth = 1080;
      const targetHeight = 1920;

      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
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
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
        .output(outputPath)
        .on('end', () => {
          logger.debug(`Segment extracted and converted to 9:16 (${targetWidth}x${targetHeight}) with full image preserved: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          logger.error(`Error extracting segment: ${err.message}`);
          reject(new Error(`Failed to extract segment: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Delete video and all its segments
   */
  async deleteVideo(videoId: string, originalFilePath: string): Promise<void> {
    try {
      const videoDir = path.join(this.processedDir, videoId);
      
      // Delete segments directory
      await fs.rm(videoDir, { recursive: true, force: true });
      
      // Delete original file
      await fs.unlink(originalFilePath).catch(() => {
        // Ignore if file doesn't exist
      });

      logger.info(`Deleted video ${videoId} and all segments`);
    } catch (error) {
      logger.error(`Error deleting video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Get segment file path
   */
  getSegmentPath(videoId: string, segmentId: string): string | null {
    const videoDir = path.join(this.processedDir, videoId);
    // Segment files are named: segment-{index}-{segmentId}.mp4
    // We need to find the file that contains the segmentId
    return path.join(videoDir, `segment-*-${segmentId}.mp4`);
  }
}

export const videoService = new VideoService();
