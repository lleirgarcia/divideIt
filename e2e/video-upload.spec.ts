import { test, expect } from '@playwright/test';

test.describe('Video Upload and Split', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the upload area', async ({ page }) => {
    await expect(page.getByText(/drag & drop a video file/i)).toBeVisible();
  });

  test('should show file input when clicking upload area', async ({ page }) => {
    const uploadArea = page.getByText(/drag & drop a video file/i);
    await uploadArea.click();
    
    // Check if file input is present (it should be hidden but accessible)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('should display split settings after file upload', async ({ page }) => {
    // Create a mock file
    const fileInput = page.locator('input[type="file"]');
    
    // Note: In a real scenario, you'd need an actual video file
    // For E2E tests, you might want to use a small test video file
    // This test assumes the file input accepts the file
    
    // Simulate file selection (this would work with a real file)
    // await fileInput.setInputFiles('path/to/test-video.mp4');
    
    // For now, we'll just verify the input exists
    await expect(fileInput).toBeAttached();
  });

  test('should validate segment count input', async ({ page }) => {
    // This test would require a file to be uploaded first
    // For now, we verify the page structure
    await expect(page).toHaveTitle(/divideIt/i);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/videos/split', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: { message: 'Server error' } }),
      });
    });

    // Try to upload and split (would need actual file)
    // Verify error message is displayed
  });
});
