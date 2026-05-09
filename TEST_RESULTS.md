# Hasil Automated Testing Kavana

## Ringkasan Eksekusi

- Tool: Playwright Test
- Command:

```bash
npm run test:e2e
```

- Target frontend: `https://kavana.my.id`
- Target backend: `https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana`
- Project browser:
  - Desktop Chrome
  - Mobile Chrome / Pixel 5
  - Mobile Safari / iPhone 12

## Hasil Akhir

```txt
48 passed
177 skipped
0 failed
```

Status: semua test yang aktif berhasil dijalankan.

## Test yang Berhasil

- Landing page dapat dibuka.
- Navigasi ke halaman login berhasil.
- Halaman login menampilkan field email/NPM dan password.
- Halaman login tetap aman saat input kosong atau format invalid.
- Halaman register menampilkan field utama.
- Halaman register menolak input kosong/invalid.
- Protected route dashboard redirect ke login saat belum login.
- Responsive smoke test untuk landing dan login berhasil di desktop dan mobile.
- Basic validation test tidak menyebabkan aplikasi crash.

## Test yang Di-skip

Sebagian besar test di-skip karena alasan keamanan dan kondisi environment:

- Credential testing per role masih placeholder.
- Login role mahasiswa/dosen/koordinator/kaprodi/admin belum bisa dijalankan tanpa akun testing khusus.
- Test mutation sengaja di-skip agar tidak mengubah data production.
- Backend deploy sedang mengembalikan status 5xx untuk beberapa endpoint API, sehingga assertion unauthorized tidak bisa dinilai dengan valid.
- Turnstile aktif di login production, sehingga test login valid butuh testing key atau environment testing khusus.

## Area yang Di-skip Karena Butuh Akun Testing

- Dashboard mahasiswa.
- Dashboard dosen.
- Dashboard koordinator.
- Dashboard kaprodi.
- Dashboard admin.
- Login valid per role.
- Logout setelah login.
- RBAC dengan token role valid.
- Responsive dashboard mahasiswa.

## Area yang Di-skip Karena Mengubah Data

- Submit proposal valid.
- Create/update kelompok proyek.
- Approve/reject proposal.
- Assign pembimbing.
- Create bimbingan valid.
- Submit laporan sidang valid.
- Create jadwal sidang.
- Validasi bentrok jadwal sidang.
- Input nilai sidang.
- Submit revisi sidang.
- Admin management mutation.

## API Test

API test sudah dibuat untuk:

- Health/status discovery.
- Auth API validation.
- Proposal API unauthorized validation.
- Bimbingan API unauthorized validation.
- Laporan API unauthorized validation.
- Jadwal sidang API unauthorized validation.
- Notification API unauthorized validation.
- Admin API unauthorized validation.

Catatan: pada saat test dijalankan, beberapa endpoint backend mengembalikan `500/503`, sehingga test API yang membutuhkan backend sehat otomatis di-skip.

## Kesimpulan

Setup Playwright sudah siap untuk alpha testing. Test smoke, validation, protected route, dan responsive dasar sudah berjalan tanpa gagal. Untuk mengaktifkan test flow akademik penuh, perlu dibuat environment testing/staging dengan akun testing per role dan seed data khusus agar test tidak menyentuh data production.

## Rekomendasi Lanjutan

- Buat akun testing khusus untuk mahasiswa, dosen, koordinator, kaprodi, dan admin.
- Siapkan database staging atau seed data testing.
- Gunakan Cloudflare Turnstile testing key untuk E2E.
- Jalankan API test ulang setelah backend deploy sehat.
- Tambahkan GitHub Actions untuk menjalankan `npm run test:e2e` otomatis.
- Tambahkan test load dengan k6 dan security baseline dengan OWASP ZAP jika dibutuhkan.
