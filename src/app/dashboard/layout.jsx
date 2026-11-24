import { DashboardLayout } from '@/components/layout/dashboard-layout';

// Seluruh halaman dashboard berada di balik autentikasi: jangan diindeks.
export const metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function DashboardRootLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
