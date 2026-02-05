import { VideoSegment } from '@/store/videoStore';

/**
 * Mock video file fixtures
 */
export const mockVideoFiles = {
  small: {
    name: 'small-video.mp4',
    size: 1024 * 1024 * 5, // 5MB
    type: 'video/mp4',
  },
  medium: {
    name: 'medium-video.mp4',
    size: 1024 * 1024 * 50, // 50MB
    type: 'video/mp4',
  },
  large: {
    name: 'large-video.mp4',
    size: 1024 * 1024 * 200, // 200MB
    type: 'video/mp4',
  },
  mov: {
    name: 'video.mov',
    size: 1024 * 1024 * 30, // 30MB
    type: 'video/quicktime',
  },
};

/**
 * Mock video segments fixtures
 */
export const mockSegments: Record<string, VideoSegment[]> = {
  fiveSegments: [
    {
      segmentNumber: 1,
      startTime: 0,
      endTime: 10,
      duration: 10,
      downloadUrl: '/api/videos/segments/segment-1',
    },
    {
      segmentNumber: 2,
      startTime: 10,
      endTime: 20,
      duration: 10,
      downloadUrl: '/api/videos/segments/segment-2',
    },
    {
      segmentNumber: 3,
      startTime: 20,
      endTime: 30,
      duration: 10,
      downloadUrl: '/api/videos/segments/segment-3',
    },
    {
      segmentNumber: 4,
      startTime: 30,
      endTime: 40,
      duration: 10,
      downloadUrl: '/api/videos/segments/segment-4',
    },
    {
      segmentNumber: 5,
      startTime: 40,
      endTime: 50,
      duration: 10,
      downloadUrl: '/api/videos/segments/segment-5',
    },
  ],
  threeSegments: [
    {
      segmentNumber: 1,
      startTime: 0,
      endTime: 20,
      duration: 20,
      downloadUrl: '/api/videos/segments/segment-1',
    },
    {
      segmentNumber: 2,
      startTime: 20,
      endTime: 40,
      duration: 20,
      downloadUrl: '/api/videos/segments/segment-2',
    },
    {
      segmentNumber: 3,
      startTime: 40,
      endTime: 60,
      duration: 20,
      downloadUrl: '/api/videos/segments/segment-3',
    },
  ],
};

/**
 * Mock API responses
 */
export const mockApiResponses = {
  success: {
    success: true,
    data: {
      originalVideo: {
        filename: 'test-video.mp4',
        duration: 60,
        metadata: {
          duration: 60,
          width: 1920,
          height: 1080,
          format: 'mp4',
          size: 1024 * 1024 * 50,
        },
      },
      segments: mockSegments.fiveSegments,
      totalSegments: 5,
    },
  },
  error: {
    success: false,
    error: {
      message: 'Failed to process video',
      code: 'PROCESSING_ERROR',
    },
  },
};
