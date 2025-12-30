import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // We need to check what the actual title is, typically "AbangBob Dashboard" or similar.
    // If uncertain, we can check for an element checking.
    await expect(page).toHaveTitle(/AbangBob|Login/);
});
