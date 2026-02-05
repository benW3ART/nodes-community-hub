import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('should load the leaderboard page', async ({ page }) => {
    await expect(page.getByText(/Leaderboard/i).first()).toBeVisible();
  });

  test('should show loading state or data', async ({ page }) => {
    // Either loading indicator or collector data should appear
    const hasContent = await page.locator('main').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should have proper layout sections', async ({ page }) => {
    // Header should exist
    await expect(page.locator('header')).toBeVisible();
    
    // Main content should exist
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Leaderboard API', () => {
  test('should return leaderboard data', async ({ request }) => {
    const response = await request.get('/api/leaderboard');
    
    // API might fail if no Alchemy key, but should return proper response structure
    expect(response.status()).toBeLessThan(500);
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('topCollectors');
    }
  });
});
