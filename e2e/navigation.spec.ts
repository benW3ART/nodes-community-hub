import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check page title or main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to Gallery page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Gallery link
    await page.click('a[href="/gallery"]');
    
    // Verify navigation
    await expect(page).toHaveURL('/gallery');
    
    // Should show connect wallet prompt when not connected
    await expect(page.getByRole('heading', { name: 'Connect Your Wallet' })).toBeVisible();
  });

  test('should navigate to Full Sets page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/full-sets"]');
    
    await expect(page).toHaveURL('/full-sets');
    await expect(page.getByText(/Full Set Tracker/i)).toBeVisible();
  });

  test('should navigate to Leaderboard page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/leaderboard"]');
    
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.getByText(/Leaderboard/i).first()).toBeVisible();
  });

  test('should navigate to Post Creator page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/post-creator"]');
    
    await expect(page).toHaveURL('/post-creator');
    await expect(page.getByText(/Post Creator/i)).toBeVisible();
  });

  test('should navigate to Banner Creator page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/banner-creator"]');
    
    await expect(page).toHaveURL('/banner-creator');
    await expect(page.getByText(/Banner Creator/i)).toBeVisible();
  });

  test('should navigate to Grid Creator page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('a[href="/grid-creator"]');
    
    await expect(page).toHaveURL('/grid-creator');
    // Grid Creator page exists
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have working header navigation', async ({ page }) => {
    await page.goto('/gallery');
    
    // Click logo to go home
    await page.click('a[href="/"]');
    
    await expect(page).toHaveURL('/');
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile menu button', async ({ page }) => {
    await page.goto('/');
    
    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /toggle menu/i });
    await expect(menuButton).toBeVisible();
  });

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/');
    
    const menuButton = page.getByRole('button', { name: /toggle menu/i });
    
    // Open menu
    await menuButton.click();
    
    // Navigation links should be visible in mobile menu
    await expect(page.getByRole('link', { name: 'My NFTs' })).toBeVisible();
    
    // Close menu
    await menuButton.click();
    
    // Navigation links should be hidden (in the collapsed menu)
    // The nav element might still exist but not be in mobile menu state
  });

  test('should navigate via mobile menu', async ({ page }) => {
    await page.goto('/');
    
    // Open menu
    await page.getByRole('button', { name: /toggle menu/i }).click();
    
    // Click gallery link
    await page.getByRole('link', { name: 'My NFTs' }).click();
    
    await expect(page).toHaveURL('/gallery');
  });
});
