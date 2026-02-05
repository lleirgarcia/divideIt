import { Request, Response } from 'express';
import { VideoMetadata, VideoSegment } from '../../services/videoService';

/**
 * Create a mock Express request object
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    file: undefined,
    files: undefined,
    ...overrides,
  } as Partial<Request>;
};

/**
 * Create a mock Express response object
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Create mock video metadata
 */
export const createMockVideoMetadata = (overrides: Partial<VideoMetadata> = {}): VideoMetadata => {
  return {
    duration: 120,
    width: 1920,
    height: 1080,
    format: 'mp4',
    size: 1024 * 1024 * 50, // 50MB
    ...overrides,
  };
};

/**
 * Create mock video segments
 */
export const createMockVideoSegments = (count: number = 5): VideoSegment[] => {
  const segments: VideoSegment[] = [];
  const duration = 120;
  const segmentDuration = duration / count;

  for (let i = 0; i < count; i++) {
    const startTime = i * segmentDuration;
    const endTime = (i + 1) * segmentDuration;
    
    segments.push({
      id: `segment-${i + 1}`,
      startTime,
      endTime,
      duration: endTime - startTime,
      filePath: `/processed/video-123/segment-${i + 1}-${Date.now()}.mp4`,
    });
  }

  return segments;
};

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create a mock file object
 */
export const createMockFile = (
  name: string = 'test-video.mp4',
  size: number = 1024 * 1024 * 10, // 10MB
  type: string = 'video/mp4'
): File => {
  const blob = new Blob(['mock video content'], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
