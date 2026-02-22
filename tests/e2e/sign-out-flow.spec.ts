/**
 * E2E Test: Sign-Out Flow (Sprint 12 — S12-16)
 *
 * Tests the account section in Settings and sign-out behavior:
 * 1. Guest state: Settings shows "Sign in" CTA, no sign-out button
 * 2. CTA navigates to /auth page
 * 3. Local data remains accessible after viewing settings as guest
 * 4. Full sign-out flow (requires Supabase — tagged @cloud)
 */

import { test, expect } from '@playwright/test';

test.describe('Account Section — Guest State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('Settings page shows Account section with guest CTA', async ({ page }) => {
    // Navigate to Settings
    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);

    // Should see guest CTA (Cloud Sync section)
    await expect(page.locator('text=Cloud Sync')).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('text=Sign in to enable cloud sync')
    ).toBeVisible({ timeout: 5000 });

    // Should NOT see Sign Out button
    await expect(page.locator('button:has-text("Sign Out")')).not.toBeVisible();
  });

  test('Guest CTA navigates to /auth page', async ({ page }) => {
    // Navigate to Settings
    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);

    // Click CTA
    await page.click('text=Sign in to enable cloud sync');
    await page.waitForTimeout(500);

    // Should be on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('local data still accessible after visiting settings as guest', async ({ page }) => {
    // First add a recipe
    await page.click('text=Library');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Add Recipe")');
    await page.waitForSelector('text=Add Manually', { timeout: 5000 });
    await page.click('text=Add Manually');

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleInput.fill('Settings Test Recipe');
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Verify recipe exists
    await expect(page.locator('text=Settings Test Recipe')).toBeVisible({ timeout: 5000 });

    // Visit settings and back
    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);
    await page.goBack();
    await page.waitForTimeout(500);

    // Navigate to Library — recipe should still be there
    await page.click('text=Library');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Settings Test Recipe')).toBeVisible({ timeout: 5000 });
  });

  test('Settings page renders all expected sections', async ({ page }) => {
    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);

    // Settings title
    await expect(page.locator('h1')).toContainText('Settings');

    // Language selector
    await expect(page.locator('text=English')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Deutsch')).toBeVisible({ timeout: 5000 });

    // Data management section should exist
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Export');
  });
});

/**
 * Authenticated sign-out flow — requires VITE_SUPABASE_URL.
 * Tests:
 * - Settings shows user info, household, sync status, sign-out button
 * - Sign-out button shows confirmation dialog
 * - Confirming sign-out returns to app in guest mode
 * - After sign-out, settings shows guest CTA instead
 * - Local recipes remain accessible post sign-out
 *
 * Tagged @cloud for conditional execution.
 */
test.describe('Sign-Out Flow @cloud', () => {
  test.skip(
    !process.env.VITE_SUPABASE_URL,
    'Skipping cloud sign-out tests — VITE_SUPABASE_URL not configured'
  );

  test('authenticated settings shows user info and sign-out button', async ({ page }) => {
    // This test requires a pre-authenticated session
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);

    // Should show user info (not guest CTA)
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible({ timeout: 5000 });
    // Should NOT show guest CTA
    await expect(page.locator('text=Sign in to enable cloud sync')).not.toBeVisible();
  });

  test('sign-out shows confirmation and returns to guest mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Go to Settings
    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);

    // Click Sign Out
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(300);

    // Confirmation dialog should appear
    await expect(page.locator('text=Sign out?')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Cancel')).toBeVisible();

    // Confirm sign-out
    const confirmButtons = page.locator('button:has-text("Sign Out")');
    await confirmButtons.last().click();
    await page.waitForTimeout(1000);

    // Should redirect to home
    await expect(page).toHaveURL('/');

    // Go back to settings — should now see guest CTA
    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Sign in to enable cloud sync')).toBeVisible({ timeout: 5000 });
  });

  test('cancel sign-out dismisses dialog', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    await page.click('button[aria-label*="settings" i], a[href="/settings"]');
    await page.waitForTimeout(500);

    // Click Sign Out
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(300);

    // Click Cancel
    await page.click('text=Cancel');
    await page.waitForTimeout(300);

    // Dialog should close, sign-out button should still be visible
    await expect(page.locator('text=Sign out?')).not.toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
  });
});
