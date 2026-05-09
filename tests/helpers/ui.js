const { expect } = require('@playwright/test');

async function expectNoCriticalPageError(page) {
  await expect(page.locator('body')).not.toContainText(/application error|internal server error|404|500/i);
}

async function expectNoHorizontalOverflow(page) {
  const hasOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 8;
  });
  expect(hasOverflow).toBeFalsy();
}

async function expectVisibleByText(page, patterns) {
  for (const pattern of patterns) {
    if (await page.getByText(pattern).first().isVisible().catch(() => false)) {
      return;
    }
  }
  throw new Error(`Tidak ada teks yang terlihat dari kandidat: ${patterns.join(', ')}`);
}

module.exports = {
  expectNoCriticalPageError,
  expectNoHorizontalOverflow,
  expectVisibleByText,
};
