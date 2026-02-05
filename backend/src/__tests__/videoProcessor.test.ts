import { generateRandomSegments } from '../utils/videoProcessor';

describe('Video Processor', () => {
  describe('generateRandomSegments', () => {
    it('should generate segments within video duration', () => {
      const duration = 100;
      const segments = generateRandomSegments(duration, 5, 5, 20);

      expect(segments.length).toBeLessThanOrEqual(5);
      segments.forEach(segment => {
        expect(segment.startTime).toBeGreaterThanOrEqual(0);
        expect(segment.endTime).toBeLessThanOrEqual(duration);
        expect(segment.duration).toBeGreaterThanOrEqual(5);
        expect(segment.duration).toBeLessThanOrEqual(20);
      });
    });

    it('should respect minimum segment duration', () => {
      const duration = 50;
      const segments = generateRandomSegments(duration, 10, 10, 15);

      segments.forEach(segment => {
        expect(segment.duration).toBeGreaterThanOrEqual(10);
      });
    });

    it('should not exceed video duration', () => {
      const duration = 30;
      const segments = generateRandomSegments(duration, 20, 5, 10);

      segments.forEach(segment => {
        expect(segment.endTime).toBeLessThanOrEqual(duration);
      });
    });

    it('should return empty array if duration is too short', () => {
      const duration = 2;
      const segments = generateRandomSegments(duration, 5, 5, 10);

      expect(segments.length).toBe(0);
    });

    it('should sort segments by start time', () => {
      const duration = 100;
      const segments = generateRandomSegments(duration, 5, 5, 20);

      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].startTime).toBeGreaterThanOrEqual(segments[i - 1].startTime);
      }
    });
  });
});
