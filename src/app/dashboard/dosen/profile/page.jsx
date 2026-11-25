import { redirect } from 'next/navigation';

// Profil hanya punya satu halaman: /dashboard/profile.
// Halaman peran ini dulu menampilkan data tanda tangan sendiri, sekarang
// diarahkan agar tidak ada dua sumber kebenaran.
export default function DosenProfileRedirect() {
  redirect('/dashboard/profile');
}
