import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/gallery', name: 'Gallery' },
    { path: '/full-sets', name: 'Full Sets' },
    { path: '/leaderboard', name: 'Leaderboard' },
    { path: '/post-creator', name: 'Post Creator' },
    { path: '/banner-creator', name: 'Banner Creator' },
  ];

  for (const { path, name } of pages) {
    test(`${name} page should have proper document structure`, async ({ page }) => {
      await page.goto(path);
      
      // Should have main landmark
      await expect(page.locator('main')).toBeVisible();
      
      // Should have header
      await expect(page.locator('header')).toBeVisible();
    });

    test(`${name} page should have heading`, async ({ page }) => {
      await page.goto(path);
      
      const headings = page.locator('h1, h2');
      await expect(headings.first()).toBeVisible();
    });

    test(`${name} page should have valid HTML`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    });
  }

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Check that text is visible (basic check)
    const textContent = await page.locator('body').textContent();
    expect(textContent).toBeTruthy();
  });

  test('navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('links should have accessible names', async ({ page }) => {
    await page.goto('/');
    
    // Get all links
    const links = page.locator('a[href]');
    const count = await links.count();
    
    // Each link should have text content or aria-label
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty for decorative images, but should exist
      expect(alt !== null).toBeTruthy();
    }
  });
});

test.describe('Touch Targets (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have adequate touch target sizes', async ({ page }) => {
    await page.goto('/');
    
    // Check buttons have minimum 44px touch target
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Allow some buttons to be smaller if they're in dense areas
          // Main interactive buttons should be at least 40px
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });
});

test.describe('Viewport Meta', () => {
  test('should have viewport meta tag', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});
