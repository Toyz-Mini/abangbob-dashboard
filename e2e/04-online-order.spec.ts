import { test, expect } from '@playwright/test';

test.describe('Online Ordering', () => {

    test('Online Menu loads', async ({ page }) => {
        await page.goto('/order-online/menu');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('Online Checkout loads', async ({ page }) => {
        await page.goto('/order-online/checkout');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

});
