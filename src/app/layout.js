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
  title: 'Kavana - Sistem Bimbingan Online',
  description:
    'Platform terintegrasi untuk mahasiswa, dosen pembimbing, dan koordinator. Kelola proses bimbingan Proyek & Internship secara digital.',
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
