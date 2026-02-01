import { test, expect } from '@playwright/test';

const publicUrls = [
  '/order-online',
  '/order-online/menu',
  '/order-online/checkout',
  '/order-online/auth',
  '/order-online/success',
  '/verify-email-required',
  '/pending-approval',
  '/verification-success',
  '/verification-failed',
  '/notifications',
  '/help',
  '/complete-profile',
  '/reset-password'
];

test.describe('Public & Order Full Coverage', () => {
  for (const url of publicUrls) {
    test(`Checking page: ${url}`, async ({ page }) => {
      const response = await page.goto(url);
      
      // Special handling for dynamic routes or redirects
      // If a page redirects (e.g. to login), it's considered success (3xx code) or 200 on new page
      // But we strictly want to avoid 404 or 500
      expect(response?.status(), `Page ${url} returned status ${response?.status()}`).toBeLessThan(400);

      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
  }
});
