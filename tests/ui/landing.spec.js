const { test, expect } = require('@playwright/test');
const { expectNoCriticalPageError } = require('../helpers/ui');

// Landing memakai link "Masuk"; sebagian halaman lain memakai button.
// Locator dibuat toleran agar test tidak rapuh terhadap perubahan elemen.
const loginEntryLocator = (page) =>
  page
    .getByRole('link', { name: /masuk|login/i })
    .or(page.getByRole('button', { name: /masuk|login/i }))
    .first();

test.describe('Landing page', () => {
  test('landing page can be opened and shows Kavana entry points', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toContainText(/kavana/i);
    await expectNoCriticalPageError(page);

    await expect(loginEntryLocator(page)).toBeVisible();
  });

  test('can navigate to login page from public page', async ({ page }) => {
    await page.goto('/');

    await loginEntryLocator(page).click();

    await expect(page).toHaveURL(/login/);
    await expect(page.getByLabel(/email atau npm/i)).toBeVisible();
  });
});
