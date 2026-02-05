import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

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
    numSegments: number = 5,
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
   * Split video into random segments
   */
  async splitVideo(
    inputPath: string,
    videoId: string,
    options: {
      numSegments?: number;
      minDuration?: number;
      maxDuration?: number;
    } = {}
  ): Promise<VideoSegment[]> {
    const metadata = await this.getVideoMetadata(inputPath);
    const {
      numSegments = 5,
      minDuration = 5,
      maxDuration = 60
    } = options;

    const segments = this.generateRandomSegments(
      metadata.duration,
      numSegments,
      minDuration,
      maxDuration
    );

    const videoSegments: VideoSegment[] = [];
    const videoDir = path.join(this.processedDir, videoId);
    await fs.mkdir(videoDir, { recursive: true });

    // Process segments sequentially to avoid overwhelming the system
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentId = uuidv4();
      const outputPath = path.join(videoDir, `segment-${i + 1}-${segmentId}.mp4`);

      await this.extractSegment(inputPath, segment.start, segment.end, outputPath);

      videoSegments.push({
        id: segmentId,
        startTime: segment.start,
        endTime: segment.end,
        duration: segment.end - segment.start,
        filePath: outputPath
      });
    }

    logger.info(`Successfully created ${videoSegments.length} segments for video ${videoId}`);
    return videoSegments;
  }

  /**
   * Extract a single segment from video
   */
  private async extractSegment(
    inputPath: string,
    startTime: number,
    endTime: number,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', () => {
          logger.debug(`Segment extracted: ${outputPath}`);
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
