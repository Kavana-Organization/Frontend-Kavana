import LandingPage from '@/components/landing/landing-page';

const SITE_URL = 'https://kavana.my.id';

export const metadata = {
  title: {
    absolute: 'Kavana — Sistem Bimbingan Online D4 Teknik Informatika ULBI',
  },
  description:
    'Kavana membantu mahasiswa, dosen pembimbing, koordinator, dan kaprodi mengelola bimbingan Proyek & Internship: pengajuan proposal, logbook bimbingan, laporan sidang, revisi, hingga jadwal sidang.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Kavana',
    title: 'Kavana — Sistem Bimbingan Online D4 Teknik Informatika ULBI',
    description:
      'Platform bimbingan online untuk mahasiswa, dosen pembimbing, koordinator, dan kaprodi Program Studi D4 Teknik Informatika ULBI.',
  },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kavana',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  inLanguage: 'id-ID',
  description:
    'Sistem bimbingan online Program Studi D4 Teknik Informatika ULBI untuk mengelola proposal, logbook bimbingan, laporan sidang, revisi, dan jadwal sidang.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
    description: 'Digunakan secara internal oleh Program Studi D4 Teknik Informatika ULBI.',
  },
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'Program Studi D4 Teknik Informatika ULBI',
    url: SITE_URL,
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
