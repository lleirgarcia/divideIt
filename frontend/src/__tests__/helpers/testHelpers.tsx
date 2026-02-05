import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { useVideoStore } from '@/store/videoStore';

/**
 * Create a mock video file for testing
 */
export const createMockVideoFile = (
  name: string = 'test-video.mp4',
  size: number = 1024 * 1024 * 10, // 10MB
  type: string = 'video/mp4'
): File => {
  const blob = new Blob(['mock video content'], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

/**
 * Mock video segments for testing
 */
export const createMockSegments = (count: number = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    segmentNumber: i + 1,
    startTime: i * 10,
    endTime: (i + 1) * 10,
    duration: 10,
    downloadUrl: `/api/videos/segments/segment-${i + 1}`,
  }));
};

/**
 * Reset video store before each test.
 * No-op when store is mocked (e.g. getState or reset not available).
 */
export const resetVideoStore = () => {
  const state = useVideoStore?.getState?.();
  if (state?.reset) state.reset();
};

/**
 * Set up video store with mock data
 */
export const setupVideoStore = (overrides: Partial<ReturnType<typeof useVideoStore.getState>> = {}) => {
  const store = useVideoStore.getState();
  if (overrides.videoFile) {
    store.setVideoFile(overrides.videoFile);
  }
  if (overrides.segments) {
    store.setSegments(overrides.segments);
  }
  if (overrides.isProcessing !== undefined) {
    store.setIsProcessing(overrides.isProcessing);
  }
  if (overrides.error !== undefined) {
    store.setError(overrides.error);
  }
};

/**
 * Custom render function with providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock API responses
 */
export const mockApiResponse = <T>(data: T, status: number = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  });
};

/**
 * Mock API error
 */
export const mockApiError = (message: string, status: number = 500) => {
  const error: any = new Error(message);
  error.response = {
    data: { error: { message } },
    status,
    statusText: 'Internal Server Error',
  };
  return Promise.reject(error);
};
