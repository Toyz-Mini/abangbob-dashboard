import { test, expect } from '@playwright/test';

const staffUrls = [
  '/staff-portal',
  '/staff-portal/attendance',
  '/staff-portal/schedule',
  '/staff-portal/payslip',
  '/staff-portal/training',
  '/staff-portal/salary-advance',
  '/staff-portal/ot-claim',
  '/staff-portal/requests',
  '/staff-portal/profile',
  '/staff-portal/issue',
  '/staff-portal/swap-shift',
  '/staff-portal/leave',
  '/staff-portal/leave/apply',
  '/staff-portal/claims',
  '/staff-portal/claims/new',
  '/staff-portal/checklist',
  '/staff-portal/checklist/history'
];

test.describe('Staff Portal Full Coverage', () => {
  for (const url of staffUrls) {
    test(`Checking page: ${url}`, async ({ page }) => {
      const response = await page.goto(url);
      
      // Check for 200 OK
      expect(response?.status(), `Page ${url} returned status ${response?.status()}`).toBeLessThan(400);

      // Check for visual crash
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
  }
});
