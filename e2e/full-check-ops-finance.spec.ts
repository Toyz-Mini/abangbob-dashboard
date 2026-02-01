import { test, expect } from '@playwright/test';

const opsUrls = [
  '/pos',
  '/kds',
  '/order-display',
  '/inventory',
  '/production',
  '/delivery',
  '/equipment',
  '/recipes',
  '/promotions',
  '/outlets',
  '/finance',
  '/finance/tax-summary',
  '/finance/payroll',
  '/finance/reports'
];

test.describe('Operations & Finance Full Coverage', () => {
  for (const url of opsUrls) {
    test(`Checking page: ${url}`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status(), `Page ${url} returned status ${response?.status()}`).toBeLessThan(400);
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
  }
});
