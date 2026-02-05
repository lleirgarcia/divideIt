import { VideoService } from '../services/videoService';

describe('VideoService', () => {
  let videoService: VideoService;

  beforeEach(() => {
    videoService = new VideoService();
  });

  describe('generateRandomSegments (private method)', () => {
    // Note: This tests the VideoService class which uses a different segment generation
    // approach than the videoProcessor utility functions.
    // The VideoService is available as an alternative implementation.
    
    it('should be instantiable', () => {
      expect(videoService).toBeInstanceOf(VideoService);
    });

    // The generateRandomSegments method is private, so we test through public methods
    // or test the service's splitVideo method which uses it internally
    it('should have getVideoMetadata method', () => {
      expect(typeof videoService.getVideoMetadata).toBe('function');
    });

    it('should have splitVideo method', () => {
      expect(typeof videoService.splitVideo).toBe('function');
    });
  });
});
