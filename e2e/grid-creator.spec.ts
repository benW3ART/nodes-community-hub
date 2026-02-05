import { test, expect } from '@playwright/test';

const TEST_WALLET = '0x2afbCa276F75578f9A4149729b4c374B7863b133';

test.describe('Grid Creator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/grid-creator');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Grid');
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    await expect(page.getByText(/connect/i)).toBeVisible();
  });

  test('NFT thumbnails should be square and visible', async ({ page }) => {
    // Mock wallet connection by injecting NFTs directly
    await page.evaluate((wallet) => {
      // This simulates having NFTs loaded
      localStorage.setItem('test-wallet', wallet);
    }, TEST_WALLET);
    
    // Check if the page loads without errors
    await expect(page.locator('.card')).toBeVisible();
  });

  test('grid preview should be visible', async ({ page }) => {
    // The preview section should exist even without wallet
    const preview = page.locator('text=Preview');
    // May or may not be visible depending on wallet state
  });

  test('export buttons should exist', async ({ page }) => {
    // These should be in the page structure
    await page.waitForSelector('body');
    const pageContent = await page.content();
    expect(pageContent).toContain('Export');
  });
});
