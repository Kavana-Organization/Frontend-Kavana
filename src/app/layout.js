import './globals.css';
import { Public_Sans, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { FloatingWhatsApp } from '@/components/shared/floating-whatsapp';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  metadataBase: new URL('https://kavana.my.id'),
  title: {
    default: 'Kavana — Sistem Bimbingan Online D4 Teknik Informatika ULBI',
    template: '%s | Kavana',
  },
  description:
    'Kavana adalah platform bimbingan online Program Studi D4 Teknik Informatika ULBI untuk mengelola proposal, logbook bimbingan, laporan sidang, revisi, dan penjadwalan sidang mahasiswa secara digital.',
  applicationName: 'Kavana',
  keywords: [
    'Kavana',
    'bimbingan online',
    'sistem bimbingan skripsi',
    'D4 Teknik Informatika ULBI',
    'bimbingan proyek akhir',
    'manajemen sidang',
    'logbook bimbingan mahasiswa',
  ],
  authors: [{ name: 'Program Studi D4 Teknik Informatika ULBI', url: 'https://kavana.my.id' }],
  creator: 'Program Studi D4 Teknik Informatika ULBI',
  publisher: 'Universitas Logistik dan Bisnis Internasional',
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Kavana',
    title: 'Kavana — Sistem Bimbingan Online D4 Teknik Informatika ULBI',
    description:
      'Platform bimbingan online untuk mahasiswa, dosen pembimbing, koordinator, dan kaprodi: proposal, logbook bimbingan, laporan sidang, revisi, dan jadwal sidang.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kavana — Sistem Bimbingan Online D4 Teknik Informatika ULBI',
    description:
      'Platform bimbingan online Program Studi D4 Teknik Informatika ULBI.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/D4TI.png', type: 'image/png' },
    ],
    apple: '/D4TI.png',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Kavana',
  alternateName: 'Kavana ULBI',
  url: 'https://kavana.my.id',
  logo: 'https://kavana.my.id/D4TI.png',
  description:
    'Sistem bimbingan online Program Studi D4 Teknik Informatika, Universitas Logistik dan Bisnis Internasional (ULBI).',
  parentOrganization: {
    '@type': 'CollegeOrUniversity',
    name: 'Universitas Logistik dan Bisnis Internasional (ULBI)',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jl. Sariasih No.54, Sarijadi, Kec. Sukasari',
    addressLocality: 'Bandung',
    addressRegion: 'Jawa Barat',
    postalCode: '40151',
    addressCountry: 'ID',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@kavana.my.id',
    areaServed: 'ID',
    availableLanguage: ['id'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kavana',
  url: 'https://kavana.my.id',
  inLanguage: 'id-ID',
  publisher: {
    '@type': 'Organization',
    name: 'Program Studi D4 Teknik Informatika ULBI',
  },
};

const themeScript = `
  (function() {
    var fallbackTheme = 'light';
    try {
      var t = localStorage.getItem('kavana-theme') || fallbackTheme;
      if (t === 'system') {
        t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(t);
    } catch(e) {
      document.documentElement.classList.add('light');
    }
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`scroll-smooth ${publicSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <div className="relative z-10">
          <Providers>{children}</Providers>
          <FloatingWhatsApp />
        </div>
      </body>
    </html>
  );
}
