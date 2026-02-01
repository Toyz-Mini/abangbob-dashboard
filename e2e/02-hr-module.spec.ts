import { test, expect } from '@playwright/test';

test.describe('HR & Staff Portal', () => {

    test('Staff Portal Dashboard loads', async ({ page }) => {
        await page.goto('/staff-portal');
        // Expect redirection to login if not authenticated, or dashboard if public
        // Just checking it doesn't 404
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('HR Dashboard loads', async ({ page }) => {
        await page.goto('/hr');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('Attendance Analytics loads', async ({ page }) => {
        await page.goto('/hr/attendance-analytics');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('Leave Calendar loads', async ({ page }) => {
        await page.goto('/hr/leave-calendar');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

});
