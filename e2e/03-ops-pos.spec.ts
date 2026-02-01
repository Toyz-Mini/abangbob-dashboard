import { test, expect } from '@playwright/test';

test.describe('POS & Operations', () => {

    test('POS Page loads', async ({ page }) => {
        await page.goto('/pos');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('KDS (Kitchen Display) loads', async ({ page }) => {
        await page.goto('/kds');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('Order Display loads', async ({ page }) => {
        await page.goto('/order-display');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

    test('Inventory loads', async ({ page }) => {
        await page.goto('/inventory');
        await expect(page).not.toHaveTitle(/404|Not Found/i);
    });

});
