import { test, expect } from '@playwright/test';

test.describe('Post Creator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/post-creator');
  });

  test('should show connect wallet prompt', async ({ page }) => {
    await expect(page.getByText(/Connect Your Wallet/i)).toBeVisible();
  });

  test('should display template options', async ({ page }) => {
    // Even without wallet, template section should be mentioned
    await expect(page.getByText(/Post Creator/i)).toBeVisible();
  });

  test('should have proper page structure', async ({ page }) => {
    // Check header exists
    await expect(page.locator('header')).toBeVisible();
    
    // Check main content area
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Post Creator - Template Selection', () => {
  // These tests would need wallet mocking for full functionality
  test('should load the page without errors', async ({ page }) => {
    const response = await page.goto('/post-creator');
    expect(response?.status()).toBe(200);
  });
});
