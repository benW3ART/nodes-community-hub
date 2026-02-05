import { test, expect } from '@playwright/test';

test.describe('Banner Creator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/banner-creator');
  });

  test('should show connect wallet prompt', async ({ page }) => {
    await expect(page.getByText(/Connect Your Wallet/i)).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByText(/Banner Creator/i)).toBeVisible();
  });

  test('should have description text', async ({ page }) => {
    await expect(page.getByText(/header banners/i)).toBeVisible();
  });

  test('should load without errors', async ({ page }) => {
    const response = await page.goto('/banner-creator');
    expect(response?.status()).toBe(200);
  });
});
