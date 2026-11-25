# Rencana Perombakan UI/UX Kavana

Status: **rencana, belum ada implementasi**. Tidak ada satu pun komponen aplikasi
yang diubah. Dokumen arah desain ada di `docs/DESIGN.md`.

Tanggal: 2026-11-24
Basis kode: `New-Frontend` branch `main` (commit `46eacbd`)

---

## 1. Ringkasan

Masalahnya bukan "desainnya jelek". Masalahnya Kavana hari ini memakai bahasa visual
produk SaaS (kartu, pill, radius besar, metrik ringkasan) untuk pekerjaan yang
sebenarnya adalah **administrasi akademik berulang**. Akibatnya pengguna melihat
banyak informasi tanpa jawaban cepat atas tiga pertanyaan: apa yang harus saya
kerjakan, mahasiswa ini di tahap mana, apakah aksi saya berhasil.

Rekomendasi: arah **"Papan Kerja Akademik"** (lihat §3, opsi A), dikerjakan bertahap
dengan fondasi token lebih dulu, lalu halaman per peran.

---

## 2. Klasifikasi produk (ini yang membuat arah desain jadi jelas)

| Pertanyaan | Jawaban | Bukan |
|---|---|---|
| Siapa yang membayar? | Tidak ada. Ini sistem internal prodi | SaaS berlangganan |
| Bagaimana pengguna masuk? | Didaftarkan admin atau prodi, peran ditentukan sistem | Self-serve signup |
| Seberapa sering dipakai? | Harian, sepanjang semester | Sesekali |
| Apa pekerjaan utamanya? | Menjalankan dan memantau proses bimbingan sampai sidang | Menjelajah konten |
| Siapa pengguna terberatnya? | Dosen, koordinator, kaprodi, admin | Pengunjung publik |
| Apa ukuran keberhasilan UI? | Tugas selesai lebih cepat, salah status lebih sedikit | Konversi, waktu di halaman |

Kesimpulan: **produk operasional internal dengan standar kualitas visual produk
modern**. Bukan SaaS, bukan juga "aplikasi kampus" yang identik dengan tabel abu-abu
tanpa identitas. Keduanya salah arah, dan itu sebabnya arah desain terasa bingung.

---

## 3. Tiga arah desain yang mungkin, dan pilihannya

| | A. Papan Kerja Akademik | B. Ruang Baca | C. Studio Ujian |
|---|---|---|---|
| Metafora | Berkas dan papan kerja prodi | Perpustakaan yang tenang | Majalah editorial |
| Dials | ENERGY 1 / RHYTHM 2 / MOTION 1 | ENERGY 1 / RHYTHM 1 / MOTION 1 | ENERGY 3 / RHYTHM 3 / MOTION 2 |
| Tipografi | Serif untuk judul, sans humanis untuk isi | Sans saja, sangat tenang | Tipografi besar, kontras ekstrem |
| Struktur | Tahap akademik sebagai tulang punggung | Daftar dan teks panjang | Blok warna, komposisi asimetris |
| Kekuatan | Cepat menjawab "tahap mana" dan "apa berikutnya" | Nyaman untuk membaca lama | Berkesan, cocok untuk landing |
| Kelemahan | Butuh disiplin komponen baru | Terasa steril, lambat untuk entri data | Melelahkan untuk kerja 8 jam |
| Cocok untuk | Dosen, koordinator, kaprodi, admin | Mahasiswa yang membaca panduan | Landing publik saja |

**Pilihan: A untuk seluruh aplikasi**, dengan satu pengecualian: halaman mahasiswa
memakai kepadatan dan kelegaan ala B (tetap satu sistem warna dan tipografi).
Landing publik boleh meminjam energi C sebatas tipografi dan komposisi, tanpa
memakai pola slop.

Alasan penolakan:
- B murni: admin dan koordinator butuh kepadatan tabel, bukan ruang kosong.
- C murni: pengguna staf akan bertemu tipografi besar dan kontras tinggi setiap hari,
  itu melelahkan dan memperlambat pekerjaan.

---

## 4. Temuan audit UI sekarang (berbasis bukti, bukan selera)

Tingkat: **P1** = menghambat pekerjaan, **P2** = menghambat konsistensi, **P3** = polish.

| # | Tingkat | Temuan | Bukti | Aturan |
|---|---|---|---|---|
| F-01 | P1 | Halaman peran belum menjawab "apa yang harus saya kerjakan": dashboard memulai dengan metrik ringkasan, bukan antrean tugas | `dashboard/*/page.jsx` memakai metric strip + kartu ringkasan | C-3, R-05 |
| F-02 | P1 | 44 dari 81 halaman tidak memakai `LoadingState`/`EmptyState`/`ErrorState`, jadi state kosong dan galat tidak seragam | `grep -rl` menemukan 37 halaman yang memakainya | R-27 |
| F-03 | P1 | Status tidak satu kamus: label dan warna status ditulis ulang di banyak halaman | `StatusBadge` dipakai dengan nilai berbeda per halaman (`active`, `pending`, `approved`, `menunggu`, `DISETUJUI`, dst.) | R-31, R-39 |
| F-04 | P2 | Radius dasar `--radius: 1rem` membuat semua elemen membulat, sehingga input, tombol, dan panel tidak terbedakan | `globals.css` baris `--radius` dan `--radius-2xl`/`--radius-3xl` | R-11 |
| F-05 | P2 | Bahasa visual landing (gradien, noise, grid) berbeda dari aplikasi, padahal pengguna yang sama berpindah dari landing ke login ke dashboard | `app/page.jsx` vs `globe.css` utilitas `ctp-*` | R-20, R-05 |
| F-06 | P2 | Tidak ada pencarian global. Dosen dengan 20 mahasiswa harus menelusuri menu untuk menemukan satu nama | tidak ada `cmdk`/`CommandPalette` di `components/` | R-24, C-1 |
| F-07 | P2 | Tabel padat dan kartu bercampur tanpa aturan kapan memakai yang mana, sehingga halaman berbeda terasa dibuat orang berbeda | perbandingan `dashboard/kaprodi/*` dan `dashboard/mahasiswa/*` | R-14, R-05 |
| F-08 | P2 | Palet Catppuccin membawa 14 warna status, tetapi hanya sebagian yang dipakai konsisten, dan aksen biru dipakai untuk semua hal sehingga tidak lagi menandai apa pun | `globals.css` variabel `--ctp-*`, `--accent` dipakai di tombol, ikon, badge, garis | R-29, R-13 |
| F-09 | P3 | Tipografi `Public Sans` + `JetBrains Mono` tanpa pembeda antara judul dan isi selain ukuran | `app/layout.js` | R-06 |
| F-10 | P3 | Teks tombol masih ada yang generik ("Simpan", "Kirim") tanpa menyebut objek aksi | beberapa form di `dashboard/*` | R-15 |
| F-11 | P3 | Guard slop proyek sedang gagal karena 9 temuan `raw-hex` di `opengraph-image.jsx`, padahal file itu memang butuh hex (Satori tidak mengenal CSS variable) | `npm run guard` | R-33 (hindari pelanggaran palsu) |
| F-12 | P2 | Mobile: tabel sudah punya pola `data-label`, tetapi beberapa form panjang belum punya tombol lengket di bawah, jadi aksi utama tenggelam saat menggulir | halaman form `dashboard/*` | R-03 |

Catatan: 81 halaman dan 18.596 baris JSX adalah beban kerja nyata. Rombakan harus
bertahap; menulis ulang semuanya sekaligus berisiko merusak alur yang sekarang sudah
lolos uji.

---

## 5. Ruang lingkup

**Dirombak**
- Token desain: warna, tipografi, radius, spasi, kepadatan.
- Komponen inti: tombol, input, select, tabel, badge status, panel, dialog, tabs.
- Shell aplikasi: sidebar, header, breadcrumb, pencarian global.
- Dashboard lima peran (prioritas 1 sampai 5 di §6).
- Halaman daftar dan form yang paling sering dipakai.
- Landing publik diselaraskan dengan bahasa visual baru.

**Tidak disentuh di fase ini**
- Logika API, otorisasi, dan struktur rute. Perubahan hanya presentasi.
- Alur backend (SSO, upload file, backup). Itu rencana terpisah.
- SEO teknis yang sudah selesai (`robots`, `sitemap`, metadata, JSON-LD).
- Naskah akademik dan dokumen di `Docs-Kavana`.

---

## 6. Rencana bertahap

Setiap fase berakhir dengan antislop Delivery Gate dan `npm run guard` hijau.
Tidak ada fase yang boleh menumpuk utang ke fase berikutnya.

### Fase P0: Fondasi (tanpa mengubah tampilan berarti)
1. Perbaiki F-11: kecualikan `opengraph-image.jsx` dari aturan `raw-hex` di
   `scripts/slop-check.mjs`.
2. Tulis `docs/DESIGN.md` sebagai arah resmi (sudah dibuat, menunggu persetujuan).
3. Ganti token di `globals.css`: palet kertas-tinta, radius 6/10/12, skala teks,
   dua tingkat kepadatan, dan hapus utilitas dekoratif yang tidak dipakai
   (`ctp-grid`, `ctp-noise`).
4. Tambah `Newsreader` di `app/layout.js` untuk judul saja.
5. Buat kamus status tunggal `src/lib/status.js` (label, warna, ikon, urutan tahap).
6. Buat primitif baru: `Section`, `DataTable`, `ActionPanel`, `StatusStamp`,
   `EmptyStatePlus`, `FormShell` (dengan tombol lengket di ponsel).

**Terima:** halaman lama tetap berjalan dengan token baru, tidak ada regresi build,
kontras AA lolos di kedua tema.

### Fase P1: Dashboard lima peran
1. Susun ulang dashboard dengan urutan: panel "Perlu tindakan Anda", garis tahap
   akademik, lalu ringkasan.
2. Mahasiswa: tahap saat ini, sesi bimbingan menuju 8, dokumen yang kurang.
3. Dosen: antrean persetujuan bimbingan dan laporan, daftar mahasiswa bimbingan.
4. Koordinator: proposal menunggu validasi, periode aktif, kesiapan sidang.
5. Kaprodi: distribusi mahasiswa per tahap, mahasiswa siap sidang, penugasan penguji.
6. Admin: kesehatan data (akun nonaktif, data tidak lengkap), bukan metrik pemasaran.

**Terima:** pengguna baru bisa menyebut aksi berikutnya dalam 10 detik; dasbor tidak
memakai angka contoh; semua angka berasal dari API yang ada.

### Fase P2: Tabel, form, dan pencarian
1. Ganti tabel per halaman dengan `DataTable`: pengurutan, filter, kolom status,
   versi kartu di ponsel.
2. Pencarian global (mahasiswa, dosen, proposal, jadwal) dari header, dengan pintasan
   papan tombol dan hasil yang menghormati peran.
3. Seragamkan form: label, bantuan, galat, tombol lengket, konfirmasi aksi destruktif
   yang menyebut akibatnya.
4. Samakan kamus status di seluruh halaman (F-03).

**Terima:** tidak ada halaman daftar tanpa tiga state; tidak ada status yang labelnya
berbeda antar halaman; navigasi keyboard penuh.

### Fase P3: Halaman publik
1. Selaraskan landing dengan palet dan tipografi baru, tanpa pola slop.
2. Terapkan bahasa visual yang sama pada panduan, FAQ, luaran proyek, dan halaman
   verifikasi.
3. Perbaiki konsistensi state pada halaman login/register/forgot-password.

**Terima:** perpindahan landing ke login ke dashboard terasa satu produk.

### Fase P4: Verifikasi
1. Uji 360px, 768px, 1280px dengan data ekstrem (nama panjang, 0 data, 100 baris).
2. Uji keyboard dan `prefers-reduced-motion`.
3. Uji kedua tema pada setiap halaman yang diubah.
4. Jalankan Playwright yang ada, tambah skenario untuk antrean tugas dan kamus status.
5. Laporkan Delivery Gate per item dengan bukti.

---

## 7. Risiko dan cara menahannya

| Risiko | Dampak | Penahan |
|---|---|---|
| Rombakan menyentuh logika, bukan hanya tampilan | Bug alur akademik | Aturan keras: fase P0 sampai P3 hanya mengubah JSX, CSS, dan token. Logika API tidak disentuh |
| 81 halaman terlalu luas | Pekerjaan tidak selesai | Prioritas hanya halaman yang dipakai harian; halaman jarang dipakai ikut token baru tanpa disusun ulang |
| Perubahan token merusak kontras | Keluhan keterbacaan | Uji kontras otomatis di kedua tema pada setiap fase |
| Desain baru terasa "asing" bagi dosen | Penolakan pengguna | Kepadatan tetap, kosakata tetap, hanya struktur dan warna yang berubah. Uji ke 1 dosen dan 1 mahasiswa sebelum fase P2 |
| Waktu habis di fase P0 | Tidak ada hasil terlihat | P0 dibatasi maksimal dua hari kerja, dan tidak menambah dependensi baru |

---

## 8. Estimasi

| Fase | Perkiraan | Hasil terlihat |
|---|---|---|
| P0 Fondasi | 1 sampai 2 hari | Token dan primitif baru, tampilan belum berubah banyak |
| P1 Dashboard per peran | 3 sampai 4 hari | Perubahan paling terasa bagi pengguna |
| P2 Tabel, form, pencarian | 4 sampai 6 hari | Pekerjaan harian jauh lebih cepat |
| P3 Halaman publik | 2 hari | Satu bahasa visual dari landing sampai dashboard |
| P4 Verifikasi | 1 sampai 2 hari | Bukti uji dan laporan gate |

Total 11 sampai 16 hari kerja, bisa dipotong: P0 + P1 saja sudah menyelesaikan dua
dari tiga pertanyaan pengguna di §2.

---

## 9. Keputusan yang saya butuh sebelum mulai

1. **Arah**: setuju opsi A (Papan Kerja Akademik) dengan pengecualian halaman
   mahasiswa yang lebih lapang, atau ada yang ingin diubah?
2. **Palet**: setuju aksen "penanda" ochre untuk hal yang menunggu tindakan, atau
   prodi punya warna resmi yang wajib dipakai? (Kalau ada warna resmi ULBI, saya
   pakai itu sebagai aksen dan menyesuaikan seluruh tabel warna.)
3. **Tipografi**: setuju menambah serif hanya untuk judul (Newsreader), atau tetap
   sans semuanya demi keseragaman?
4. **Urutan**: mulai dari P0 + P1 (dashboard, dampak tercepat) atau P0 + P2 (tabel
   dan form, lebih banyak halaman tersentuh)?
5. **Uji pengguna**: siapa satu dosen dan satu mahasiswa yang bisa mencoba hasil P1
   sebelum kita lanjut ke P2?

Setelah empat jawaban pertama, saya mulai dari P0 dan berhenti lagi sebelum P1 untuk
menunjukkan hasil fondasi.
