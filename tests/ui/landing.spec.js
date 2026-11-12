const { test, expect } = require('@playwright/test');
const { expectNoCriticalPageError, expectNoHorizontalOverflow } = require('../helpers/ui');

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

  test('renders hero with headline, two CTAs, and real product screenshot', async ({ page }) => {
    await page.goto('/');

    // Hero headline
    const headline = page.getByRole('heading', {
      name: /proposal, bimbingan, sidang, dan revisi d4 teknik informatika dalam satu alur/i,
    });
    await expect(headline).toBeVisible();

    // Two CTAs
    const registerCta = page.getByRole('link', { name: /daftar akun/i }).first();
    await expect(registerCta).toBeVisible();
    await expect(registerCta).toHaveAttribute('href', '/register');

    const loginCta = page.getByRole('link', { name: /masuk sistem/i }).first();
    await expect(loginCta).toBeVisible();
    await expect(loginCta).toHaveAttribute('href', '/login');

    // Real product screenshot
    const heroImage = page.locator('img[src*="mahasiswa.png"]').first();
    await expect(heroImage).toBeVisible();
  });

  test('renders horizontal academic pipeline with 8 stages and acting roles', async ({ page }) => {
    await page.goto('/');

    const pipelineSection = page.locator('#alur');
    await expect(pipelineSection).toBeVisible();

    const expectedStages = [
      { stage: /registrasi/i, role: /mahasiswa/i },
      { stage: /track/i, role: /mahasiswa/i },
      { stage: /proposal/i, role: /mahasiswa/i },
      { stage: /validasi/i, role: /pengelola prodi/i },
      { stage: /bimbingan 8 sesi/i, role: /mahasiswa & dosen/i },
      { stage: /laporan/i, role: /mahasiswa & dosen/i },
      { stage: /sidang/i, role: /penguji & koordinator/i },
      { stage: /revisi/i, role: /mahasiswa & dosen/i },
    ];

    for (const item of expectedStages) {
      await expect(pipelineSection.getByRole('heading', { name: item.stage })).toBeVisible();
      await expect(pipelineSection.getByText(item.role).first()).toBeVisible();
    }
  });

  test('renders role tabs with screenshots and 4 concrete capabilities each', async ({ page }) => {
    await page.goto('/');

    const peranSection = page.locator('#peran');
    await expect(peranSection).toBeVisible();

    // Tab 1: Mahasiswa (active by default)
    await expect(peranSection.getByRole('tab', { name: /mahasiswa/i })).toBeVisible();
    const mahasiswaTabPanel = peranSection.getByRole('tabpanel');
    await expect(mahasiswaTabPanel.locator('img[src*="mahasiswa.png"]')).toBeVisible();
    const mahasiswaCaps = mahasiswaTabPanel.locator('li');
    await expect(mahasiswaCaps).toHaveCount(4);

    // Tab 2: Dosen
    const dosenTab = peranSection.getByRole('tab', { name: /^dosen/i });
    await dosenTab.click();
    await expect(dosenTab).toHaveAttribute('data-state', 'active');
    await expect(mahasiswaTabPanel.locator('img[src*="dosen.png"]')).toBeVisible();
    const dosenCaps = mahasiswaTabPanel.locator('li');
    await expect(dosenCaps).toHaveCount(4);

    // Tab 3: Pengelola Prodi
    const pengelolaTab = peranSection.getByRole('tab', { name: /pengelola prodi/i });
    await pengelolaTab.click();
    await expect(pengelolaTab).toHaveAttribute('data-state', 'active');
    await expect(mahasiswaTabPanel.locator('img[src*="koordinator.png"]')).toBeVisible();
    const pengelolaCaps = mahasiswaTabPanel.locator('li');
    await expect(pengelolaCaps).toHaveCount(4);
  });

  test('renders FAQ teaser with link to /faq-sistem', async ({ page }) => {
    await page.goto('/');

    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();

    const faqLink = faqSection.getByRole('link', { name: /faq sistem/i });
    await expect(faqLink).toBeVisible();
    await expect(faqLink).toHaveAttribute('href', '/faq-sistem');
  });

  test('renders footer with CAMPUS_CONTACT and public resource links', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer#kontak');
    await expect(footer).toBeVisible();

    // Campus contact details
    await expect(footer).toContainText(/Jl\. Sariasih/i);
    await expect(footer).toContainText(/support@kavana\.my\.id/i);
    await expect(footer).toContainText(/\+62 851 7993 5117/i);

    // Resource links
    const expectedLinks = [
      { text: /panduan pengguna/i, href: '/panduan-pengguna' },
      { text: /faq sistem/i, href: '/faq-sistem' },
      { text: /kebijakan privasi/i, href: '/kebijakan-privasi' },
      { text: /syarat layanan/i, href: '/syarat-layanan' },
      { text: /luaran proyek 1/i, href: '/luaran-proyek-1' },
      { text: /luaran proyek 2/i, href: '/luaran-proyek-2' },
      { text: /luaran proyek 3/i, href: '/luaran-proyek-3' },
    ];

    for (const item of expectedLinks) {
      const link = footer.getByRole('link', { name: item.text });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', item.href);
    }
  });

  test('ResourcePageShell provides back link to / and 72ch document layout', async ({ page }) => {
    await page.goto('/panduan-pengguna');

    const backLink = page.getByRole('link', { name: /kembali ke beranda/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');

    const mainContainer = page.locator('main.max-w-\\[72ch\\]');
    await expect(mainContainer).toBeVisible();
  });
});
