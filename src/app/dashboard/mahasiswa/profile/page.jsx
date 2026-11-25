import { redirect } from 'next/navigation';

// Profil hanya punya satu halaman: /dashboard/profile.
export default function MahasiswaProfileRedirect() {
  redirect('/dashboard/profile');
}
