import { Page } from '@playwright/test';
import path from 'path';

/**
 * Wait for API call to complete
 */
export const waitForApiCall = async (
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> => {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
};

/**
 * Upload a test video file
 */
export const uploadTestVideo = async (
  page: Page,
  filePath: string = path.join(__dirname, '../fixtures/test-video.mp4')
): Promise<void> => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  
  // Wait for file to be processed
  await page.waitForTimeout(500);
};

/**
 * Fill split settings form
 */
export const fillSplitSettings = async (
  page: Page,
  options: {
    segmentCount?: number;
    minDuration?: number;
    maxDuration?: number;
  } = {}
): Promise<void> => {
  const { segmentCount = 5, minDuration = 5, maxDuration = 60 } = options;

  if (segmentCount) {
    await page.fill('input[type="number"]:nth-of-type(1)', segmentCount.toString());
  }
  if (minDuration) {
    await page.fill('input[type="number"]:nth-of-type(2)', minDuration.toString());
  }
  if (maxDuration) {
    await page.fill('input[type="number"]:nth-of-type(3)', maxDuration.toString());
  }
};

/**
 * Click split button and wait for processing
 */
export const splitVideo = async (page: Page): Promise<void> => {
  await page.click('button:has-text("Split Video")');
  await waitForApiCall(page, '/api/videos/split', 60000); // Video processing can take time
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = async (page: Page) => {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
    };
  });
};

/**
 * Mock API response
 */
export const mockApiResponse = async (
  page: Page,
  url: string | RegExp,
  response: any,
  status: number = 200
): Promise<void> => {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
};
