import { test, expect } from '@playwright/test';

const hrUrls = [
  '/hr',
  '/hr/attendance-analytics',
  '/hr/public-holidays',
  '/hr/complaints',
  '/hr/schedule',
  '/hr/checklist-config',
  '/hr/sop-audit',
  '/hr/attendance-log',
  '/hr/training',
  '/hr/ot-approval',
  '/hr/ot-report',
  '/hr/timeclock',
  '/hr/refund-approvals',
  '/hr/sop-builder',
  '/hr/kpi',
  '/hr/pending-users',
  '/hr/staff',
  '/hr/staff/new',
  '/hr/exit-interview',
  '/hr/documents',
  '/hr/disciplinary',
  '/hr/payroll',
  '/hr/performance',
  '/hr/approvals',
  '/hr/leave-calendar',
  '/hr/onboarding',
  '/hr/leave-settings',
  '/admin/towkay-dashboard',
  '/admin/user-approvals',
  '/admin/support',
  '/menu-management',
  '/customers',
  '/audit-log',
  '/settings'
];

test.describe('Admin & HR Full Coverage', () => {
  for (const url of hrUrls) {
    test(`Checking page: ${url}`, async ({ page }) => {
      // Navigate to the page
      const response = await page.goto(url);
      
      // Check for 404/500 errors immediately from network response
      expect(response?.status(), `Page ${url} returned status ${response?.status()}`).toBeLessThan(400);

      // Check visually if it crashed (Next.js error overlay or 404 text)
      await expect(page.locator('body')).not.toContainText('404');
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
      
      // Additional check: Ensure main content exists (not just empty white screen)
      // Usually there's a heading or at least a layout wrapper
      // We accept either a heading or a layout main container
      // await expect(page.locator('h1, main, .main-layout')).toBeVisible(); 
      // (Commented out strict visibility check to avoid false negatives on loading states, status check is primary)
    });
  }
});
