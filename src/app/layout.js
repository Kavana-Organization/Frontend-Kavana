import './globals.css';
import { Providers } from '@/components/providers';
import { FloatingWhatsApp } from '@/components/shared/floating-whatsapp';

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
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <div className="pointer-events-none fixed inset-0 ctp-noise opacity-60 z-0" />
        <div className="pointer-events-none fixed inset-0 ctp-grid opacity-40 z-0" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
          <FloatingWhatsApp />
        </div>
      </body>
    </html>
  );
}
