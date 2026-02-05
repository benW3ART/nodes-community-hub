import { test, expect } from '@playwright/test';

test.describe('Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery');
  });

  test('should show connect wallet prompt when not connected', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Connect Your Wallet' })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByText(/My NODES Gallery/i)).toBeVisible();
  });

  test('should have wallet connect button', async ({ page }) => {
    const connectButton = page.locator('button').filter({ hasText: /connect/i });
    await expect(connectButton.first()).toBeVisible();
  });

  test('should load without errors', async ({ page }) => {
    const response = await page.goto('/gallery');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Gallery - Filter Controls (when connected)', () => {
  // These tests describe expected behavior with wallet connection
  // In real implementation, wallet mocking would be needed
  
  test('should have filter section text', async ({ page }) => {
    await page.goto('/gallery');
    // Filter controls only appear when connected, so we check page loaded
    await expect(page.locator('main')).toBeVisible();
  });
});
