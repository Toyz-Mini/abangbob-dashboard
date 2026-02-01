import { test, expect } from '@playwright/test';

test.describe('Public & Auth Pages', () => {
  
  test('Landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AbangBob|POS|Dashboard/i);
  });

  test('Login page loads and has inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Daftar|Register/i })).toBeVisible();
  });

  test('Forgot Password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    // Using a more specific selector to avoid ambiguity
    await expect(page.locator('h1, h2, h3').filter({ hasText: /reset|forgot|lupa/i }).first()).toBeVisible();
  });

  test('POS Login page loads', async ({ page }) => {
    await page.goto('/pos-login');
    // Check for "Cashier Mode" text or the PIN pad container
    await expect(page.getByText('Cashier Mode')).toBeVisible();
  });

  test('Manager Login page loads', async ({ page }) => {
    await page.goto('/manager-login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

});
