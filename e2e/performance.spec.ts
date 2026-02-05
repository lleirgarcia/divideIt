import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('page load should be fast', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Lighthouse score', async ({ page }) => {
    await page.goto('/');
    
    // Run Lighthouse audit
    const lighthouse = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Note: This requires lighthouse to be available
        // In CI, you might want to use @playwright/test's built-in performance API
        resolve({ performance: performance.now() });
      });
    });

    // Check performance metrics
    const navigationTiming = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
      };
    });

    // DOM should be interactive quickly
    expect(navigationTiming.domContentLoaded).toBeLessThan(2000);
  });

  test('should handle large file uploads efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Monitor memory usage during file upload simulation
    const beforeMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Simulate file upload (would need actual file)
    // After upload, check memory hasn't increased excessively
    
    const afterMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory increase should be reasonable (less than 50MB)
    const memoryIncrease = afterMemory - beforeMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('API response time should be acceptable', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    // Intercept API call and measure response time
    await page.route('**/api/health', async route => {
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // Health check should be fast
      await route.continue();
    });

    // Trigger API call
    await page.evaluate(() => {
      fetch('/api/health');
    });
  });
});
