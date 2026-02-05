import { test, expect } from '@playwright/test';

test.describe('Full Sets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/full-sets');
  });

  test('should show connect wallet prompt when not connected', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Connect Your Wallet' })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByText(/Full Set Tracker/i)).toBeVisible();
  });

  test('should show description about Inner States', async ({ page }) => {
    await expect(page.getByText(/7 Inner States/i)).toBeVisible();
  });

  test('should have wallet connect button', async ({ page }) => {
    // RainbowKit button should be present
    const connectButton = page.locator('button').filter({ hasText: /connect/i });
    await expect(connectButton.first()).toBeVisible();
  });
});

test.describe('Full Sets - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/full-sets');
    
    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have accessible button labels', async ({ page }) => {
    await page.goto('/full-sets');
    
    // Menu button should have aria-label
    const menuButton = page.getByRole('button', { name: /toggle menu/i });
    if (await menuButton.isVisible()) {
      expect(await menuButton.getAttribute('aria-label')).toBeTruthy();
    }
  });
});
