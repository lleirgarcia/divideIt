import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage should match baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('upload area should match baseline', async ({ page }) => {
    const uploadArea = page.locator('[data-testid="upload-area"]').or(
      page.getByText(/drag & drop/i).locator('..')
    );
    
    await expect(uploadArea).toHaveScreenshot('upload-area.png', {
      animations: 'disabled',
    });
  });

  test('should match baseline in dark mode', async ({ page }) => {
    // If dark mode is implemented, test it here
    // await page.emulateMedia({ colorScheme: 'dark' });
    // await expect(page).toHaveScreenshot('homepage-dark.png', {
    //   fullPage: true,
    //   animations: 'disabled',
    // });
  });

  test('should match baseline on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
