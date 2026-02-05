import { VideoMetadata, VideoSegment } from '../../services/videoService';
import path from 'path';
import fs from 'fs/promises';

/**
 * Test video fixtures directory
 */
export const FIXTURES_DIR = path.join(__dirname, '../../../__fixtures__');

/**
 * Ensure fixtures directory exists
 */
export const ensureFixturesDir = async (): Promise<void> => {
  try {
    await fs.mkdir(FIXTURES_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
};

/**
 * Create a minimal valid MP4 file for testing
 * Note: This creates a very small, valid MP4 header structure
 */
export const createTestVideoFile = async (
  filename: string = 'test-video.mp4',
  _duration: number = 10
): Promise<string> => {
  await ensureFixturesDir();
  const filePath = path.join(FIXTURES_DIR, filename);
  
  // Create a minimal MP4 file structure
  // This is a simplified approach - in real scenarios, you'd use ffmpeg to generate test videos
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
  ]);

  await fs.writeFile(filePath, mp4Header);
  return filePath;
};

/**
 * Clean up test video files
 */
export const cleanupTestFiles = async (filePaths: string[]): Promise<void> => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore
    }
  }
};

/**
 * Mock video metadata fixtures
 */
export const mockVideoMetadata: Record<string, VideoMetadata> = {
  shortVideo: {
    duration: 30,
    width: 1280,
    height: 720,
    format: 'mp4',
    size: 1024 * 1024 * 5, // 5MB
  },
  longVideo: {
    duration: 300,
    width: 1920,
    height: 1080,
    format: 'mp4',
    size: 1024 * 1024 * 100, // 100MB
  },
  verticalVideo: {
    duration: 60,
    width: 1080,
    height: 1920,
    format: 'mp4',
    size: 1024 * 1024 * 20, // 20MB
  },
};

/**
 * Mock video segments fixtures
 */
export const mockVideoSegments: Record<string, VideoSegment[]> = {
  fiveSegments: Array.from({ length: 5 }, (_, i) => ({
    id: `segment-${i + 1}`,
    startTime: i * 10,
    endTime: (i + 1) * 10,
    duration: 10,
    filePath: `/processed/video-123/segment-${i + 1}-${Date.now()}.mp4`,
  })),
  threeSegments: Array.from({ length: 3 }, (_, i) => ({
    id: `segment-${i + 1}`,
    startTime: i * 20,
    endTime: (i + 1) * 20,
    duration: 20,
    filePath: `/processed/video-123/segment-${i + 1}-${Date.now()}.mp4`,
  })),
};
