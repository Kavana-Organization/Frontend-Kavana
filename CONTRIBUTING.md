# Panduan Berkontribusi (Contributing Guidelines)

Terima kasih telah tertarik untuk berkontribusi pada proyek Kavana! Kami menyambut baik segala bentuk kontribusi mulai dari pelaporan *bug*, perbaikan kode, hingga penambahan dokumentasi.

## Cara Berkontribusi

### 1. Pelaporan Bug (Bug Reports)
Jika Anda menemukan *bug*, pastikan terlebih dahulu bahwa isu tersebut belum pernah dilaporkan sebelumnya di halaman *Issues*. Jika belum, silakan buat *Issue* baru dengan menyertakan:
- Deskripsi jelas mengenai *bug*.
- Langkah-langkah untuk mereproduksi *bug* (*steps to reproduce*).
- Ekspektasi perilaku aplikasi dan apa yang sebenarnya terjadi.
- Informasi lingkungan (versi sistem operasi, browser, versi Node.js, dll).

### 2. Permintaan Fitur (Feature Requests)
Untuk mengusulkan fitur baru, buatlah *Issue* baru dengan format:
- Motivasi/Masalah: Mengapa fitur ini dibutuhkan?
- Usulan Solusi: Bagaimana cara fitur ini bekerja menurut Anda?
- Alternatif: Apakah ada alternatif lain yang sudah dipertimbangkan?

### 3. Mengirimkan Pull Request (PR)

1. **Fork repositori ini** dan *clone* secara lokal di komputer Anda.
2. **Buat branch baru** untuk fitur atau *bugfix* Anda:
   ```bash
   git checkout -b fitur/nama-fitur-anda
   # atau
   git checkout -b fix/nama-bug-anda
   ```
3. **Terapkan perubahan Anda**. Pastikan kode yang ditulis mengikuti standar koding proyek (linting) dan tidak merusak fungsionalitas yang ada (jalankan pengujian/testing jika tersedia).
4. **Lakukan commit** dengan pesan yang jelas (menggunakan konvensi *Conventional Commits* sangat disarankan, contoh: `feat: menambahkan login Google` atau `fix: memperbaiki error CORS di API`).
5. **Push branch Anda** ke fork Anda:
   ```bash
   git push origin fitur/nama-fitur-anda
   ```
6. **Buka Pull Request** di repositori utama. Deskripsikan perubahan Anda secara mendetail di kolom deskripsi PR.

## Standar Kode (Code Standards)
- **Frontend**: Gunakan pola desain React fungsional dengan Hooks. Ikuti aturan ESLint dan Prettier yang sudah disiapkan.
- **Backend**: Pastikan respons API konsisten, tambahkan try-catch untuk *error handling*, dan tulis kode secara modular.
- **Testing**: Jika perubahan Anda mencakup alur baru, pertimbangkan untuk menambahkan atau memperbarui *test cases* di modul testing Selenium.

## Kode Etik (Code of Conduct)
Harap perhatikan bahwa seluruh partisipan proyek ini diharapkan mematuhi [Code of Conduct](./CODE_OF_CONDUCT.md) kami demi menjaga lingkungan komunitas yang sehat dan inklusif.

Sekali lagi, terima kasih atas waktu dan dedikasi Anda untuk mengembangkan Kavana!
