const { test, expect } = require('@playwright/test');
const { expectNoCriticalPageError } = require('../helpers/ui');

test.describe('Landing page', () => {
  test('landing page can be opened and shows Kavana entry points', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText(/kavana/i);
    await expectNoCriticalPageError(page);

    await expect(page.getByRole('button', { name: /masuk|login/i }).first()).toBeVisible();
  });

  test('can navigate to login page from public page', async ({ page }) => {
    await page.goto('/');

    const loginEntry = page.getByRole('link', { name: /masuk|login/i }).first();
    if (await loginEntry.count()) {
      await loginEntry.click();
    } else {
      await page.getByRole('button', { name: /masuk|login/i }).first().click();
    }

    await expect(page).toHaveURL(/login/);
    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
  });
});
