import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

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
 * Get video metadata using ffmpeg
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
 * Generate random segments for video splitting
 * @param duration Total video duration in seconds
 * @param segmentCount Number of segments to create
 * @param minSegmentDuration Minimum duration for each segment in seconds
 * @param maxSegmentDuration Maximum duration for each segment in seconds
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
 * Split video into segments
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

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(segment.startTime)
        .setDuration(segment.duration)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset fast',
          '-crf 23',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info(`Processing segment ${i + 1}: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`Segment ${i + 1} progress: ${Math.round(progress.percent || 0)}%`);
        })
        .on('end', () => {
          logger.info(`Segment ${i + 1} completed: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
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

  return outputSegments;
};

/**
 * Clean up temporary files
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
