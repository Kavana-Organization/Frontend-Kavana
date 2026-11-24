const SITE_URL = 'https://kavana.my.id';

// Hanya halaman publik. Halaman dashboard, login, dan tautan verifikasi
// bertoken sengaja tidak dimasukkan karena tidak boleh diindeks.
const PUBLIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/panduan-pengguna', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/faq-sistem', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/luaran-proyek-1', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/luaran-proyek-2', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/luaran-proyek-3', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/kebijakan-privasi', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/syarat-layanan', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap() {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
