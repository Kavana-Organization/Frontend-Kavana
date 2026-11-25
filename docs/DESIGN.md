# DESIGN.md: Arah Desain Kavana

Dokumen ini adalah sumber arah desain (R-37 antislop). Semua pekerjaan UI membaca
dokumen ini lebih dulu, lalu `antislop` sebagai filter.

Dasar keputusan: `docs/UIUX_RESEARCH.md` (pedoman GOV.UK, W3C, Carbon, Fluent, dan
riset dasbor akademik). Setiap aturan di bawah yang berasal dari rujukan diberi
penanda nomor temuan (T-1 sampai T-6).

Status: **draft arah**, menunggu persetujuan pemilik produk sebelum implementasi.

---

## 1. Produk ini apa, dan siapa yang memakainya

Kavana **bukan SaaS komersial**. Tidak ada pricing, tidak ada funnel pendaftaran
publik, tidak ada akuisisi pengguna. Ini **sistem operasional akademik internal**
Program Studi D4 Teknik Informatika ULBI: satu tempat untuk menjalankan alur
bimbingan Proyek 1/2/3 dan Internship, dari pengajuan proposal sampai revisi sidang.

Konsekuensi yang mengikat semua keputusan desain:

| Kenyataan | Implikasi desain |
|---|---|
| Pengguna terikat peran dan tidak bisa memilih peran | Navigasi, kepadatan, dan warna status mengikuti peran, bukan satu tampilan generik |
| Dipakai berulang, bukan sekali lihat | Prioritas: efisiensi dan konsistensi, bukan kesan pertama yang dramatis |
| Dosen memakai 5-20 menit sambil mengajar atau di sela rapat | Informasi paling penting harus terbaca tanpa klik: siapa, tahap apa, butuh apa |
| Mahasiswa sering dari ponsel, malam hari | Halaman mahasiswa harus lapang, tombol besar, satu aksi jelas |
| Koordinator dan kaprodi memakai untuk memantau dan memutuskan | Butuh tampilan lintas mahasiswa, filter, dan ekspor; bukan form |
| Admin memakai untuk memperbaiki data | Tabel padat, edit cepat, konfirmasi yang jelas |
| Jaringan kampus tidak selalu cepat | Bobot halaman dan jumlah permintaan ikut jadi bagian desain |
| Sebagian pengguna berusia lanjut dan tidak akrab istilah teknis | Ukuran teks, kontras, dan bahasa kerja mengalahkan kepadatan informasi |

**Klasifikasi untuk keperluan desain:** ini produk *internal operations*, dengan
kualitas visual setara produk SaaS modern, tetapi pola interaksinya mengikuti
perangkat lunak administrasi: tabel, status, antrean tugas, dan audit.

---

## 2. Masalah inti yang harus diselesaikan desain

Bukan soal selera, tapi tiga pertanyaan pengguna yang sekarang belum dijawab cepat:

1. **"Apa yang harus saya kerjakan sekarang?"** Dashboard hari ini menjawab dengan
   angka ringkasan, bukan daftar tugas yang menunggu.
2. **"Mahasiswa ini ada di tahap mana?"** Status tersebar di beberapa menu
   (proposal, bimbingan, laporan, sidang, revisi), bukan satu garis tahap.
3. **"Apakah aksi saya berhasil?"** Beberapa aksi butuh refresh manual, dan
   beberapa status tampil beda antar halaman.

Arah desain di bawah ini menjawab ketiganya secara struktural.

## 2.1 Yang dipertahankan: shell aplikasi

Keputusan pemilik produk (24 Nov 2026): **konsep shell yang ada sekarang tidak
diganti**. Perombakan hanya menyentuh token, tipografi, jarak, warna, dan state di
dalamnya.

Yang **tetap** seperti sekarang:
- Header atas (topbar): judul halaman, aksi global, tombol tema, menu profil.
- Sidebar dengan perilaku collapse dan grup menu yang bisa dibuka-tutup (dropdown).
- Struktur menu per peran dari `src/lib/menu-groups.js` dan `getMenuHref`.
- Breadcrumb, `PageHeader` (judul + subjudul), dan pola halaman daftar-ke-detail.
- Tombol WhatsApp mengambang dan letak notifikasi.

Yang **boleh** berubah: warna, jenis huruf, radius, ketebalan garis, jarak, gaya
tombol dan tabel, label status, serta cara state kosong/memuat/galat ditampilkan.

Konsekuensi: tidak ada perubahan struktur informasi, tidak ada menu baru, tidak ada
pola navigasi baru. Pengguna yang sudah hafal letak menu tidak perlu belajar ulang.

---

## 3. Dials (wajib, dipegang dari halaman pertama sampai terakhir)

| Dial | Nilai | Alasan |
|---|---|---|
| **ENERGY** | 1 (tenang) | Alat kerja harian; energi tinggi melelahkan setelah 30 menit. Kesan pertama bukan tujuan |
| **RHYTHM** | 2 (konsisten dengan beberapa jeda) | Konsistensi membantu pengguna berpindah antar peran; variasi hanya pada halaman yang memang beda tujuan (landing, verifikasi publik) |
| **MOTION** | 1 (hanya umpan balik) | Animasi hanya untuk menjelaskan perubahan state, bukan dekorasi |

Catatan T-2: dasbor operasional (dosen, mahasiswa, admin) berbeda dari dasbor
analitis (koordinator, kaprodi). Yang operasional menampilkan antrean dan status;
yang analitis boleh memakai maksimal dua grafik.

Landing publik memakai **ENERGY 2 / RHYTHM 2 / MOTION 2** karena tugasnya berbeda:
menjelaskan produk kepada orang luar.

---

## 4. Identitas: "Papan Kerja Akademik" (dossier, bukan dashboard SaaS)

Motif yang membuat Kavana tidak bisa ditukar dengan produk lain:

1. **Tahap sebagai struktur utama.** Alur akademik prodi adalah rangkaian tahap yang
   diketahui semua orang: track, proposal, pembimbing, bimbingan, laporan, sidang,
   revisi. Tahap ini muncul sebagai garis mendatar pada halaman peran mana pun, dan
   posisi mahasiswa ditandai di garis itu. Ini motif identitas, bukan hiasan.
2. **Kertas dan tinta, bukan kaca dan cahaya.** Permukaan solid dengan garis tipis
   sebagai pemisah, seperti berkas akademik. Tanpa blur, tanpa glow, tanpa gradien
   dekoratif, tanpa pola grid di latar.
3. **Cap status.** Status ditampilkan sebagai label kecil dengan huruf kapital
   terbatas, seperti stempel berkas: `MENUNGGU`, `DISETUJUI`, `REVISI`. Bukan pill
   berwarna-warni dengan ikon. Status tidak pernah dibedakan hanya oleh warna
   (WCAG 1.4.1, T-4): teks status dan bentuk garis tepi adalah pembeda utama, warna
   hanya lapis ketiga.
4. **Satu aksen yang berarti "perlu tindakan".** Warna aksen hanya muncul pada hal
   yang menunggu keputusan pengguna. Kalau tidak ada yang perlu dikerjakan, halaman
   terlihat tenang. Ini membuat warna punya arti, bukan sekadar merek.

Yang **tidak** dipakai, beserta alasannya:

| Dilarang | Alasan |
|---|---|
| Gradien dekoratif, glow, orb, mesh | Menggantikan hierarki nyata dengan efek |
| Kartu untuk setiap potongan informasi | Membuat semuanya terlihat setara; tabel dan bagian berlabel lebih cepat dibaca |
| Sudut sangat bulat (radius besar di semua elemen) | Menghapus perbedaan antara input, tombol, dan panel |
| Ikon Lucide default hanya karena tersedia | Ikon dipakai hanya kalau benar-benar membantu pengenalan menu atau status |
| Angka contoh atau statistik karangan | Pengguna akademik langsung tahu angkanya salah |
| Animasi masuk-muncul di dalam aplikasi | Menambah waktu tunggu tanpa informasi |

---

## 5. Palet

Rasio 60/30/10: netral kertas, netral tinta, aksen.

| Peran | Nilai (light) | Nilai (dark) | Dipakai untuk |
|---|---|---|---|
| Kertas (latar halaman) | `#F7F6F3` | `#12161C` | Latar |
| Kertas terangkat (panel) | `#FFFFFF` | `#1A2028` | Tabel, panel, form |
| Tinta (teks utama) | `#141C26` | `#E8EBEF` | Judul, angka penting |
| Tinta lembut (teks sekunder) | `#4A5563` | `#9AA5B4` | Label, keterangan |
| Garis | `#DCD8D0` | `#2B333D` | Pemisah, batas tabel |
| Tinta aksi (tombol utama) | `#1B2A3D` | `#E8EBEF` | Tombol utama |
| Aksen "penanda" | `#B4551F` (ochre) | `#E08A4E` | Butuh tindakan, tenggat, sorotan antrean |
| Sukses | `#2F6B4F` | `#6FBF95` | Disetujui, selesai |
| Peringatan | `#8A6A00` | `#D9B24C` | Menunggu, hampir tenggat |
| Bahaya | `#A3271F` | `#E4796F` | Ditolak, gagal, hapus |

Aturan pakai:
- Aksen tidak dipakai untuk tombol utama. Tombol utama memakai tinta, supaya aksen
  tetap berarti "ini menunggu kamu".
- Warna status hanya untuk status, tidak untuk dekorasi.
- Hijau dan merah tidak dipakai dalam bentuk murni. Sukses memakai hijau kebiruan,
  bahaya memakai merah kecokelatan, agar tetap terbedakan oleh buta warna merah-hijau
  (WCAG 1.4.1, T-4).
- Setiap pasangan teks/latar wajib lolos WCAG AA (4.5:1 teks normal, 3:1 teks besar),
  diuji di kedua tema.

---

## 6. Tipografi

Batasan dari T-6: serif bukan faktor keterbacaan yang terbukti, tetapi familiaritas
berpengaruh. Karena itu serif **hanya** dipakai di tempat teks dibaca sebagai
dokumen, bukan di tempat tabel dan form dipindai setiap hari.

| Peran | Font | Alasan |
|---|---|---|
| Judul di halaman publik dan dokumen (landing, panduan, luaran, laporan) | **Newsreader** (serif) | Memberi bobot institusional pada teks yang dibaca, bukan dipindai; T-6 |
| Seluruh teks aplikasi: judul halaman, tabel, form, tombol | **Public Sans** | Familiar, netral, terbaca di 13-14px, konsisten untuk pengguna harian; T-6 |
| Angka identitas (NPM, NIDN, tanggal, kredit sesi) | **JetBrains Mono** | Angka sejajar kolom dan tidak tertukar 0/O, 1/l; praktik Carbon dan Fluent |

Aturan:
- Skala terbatas: 12, 13, 14, 16, 20, 26, 34 px. Tidak ada ukuran di luar skala.
- Judul halaman aplikasi dibedakan lewat ukuran dan bobot, bukan lewat keluarga font.
- Huruf kapital berjarak lebar hanya untuk label bagian (maksimal 1 baris per bagian).
- Tanpa `font-black`. Bobot maksimum 700 untuk judul, 600 untuk label.
- Angka penting memakai `tabular-nums` agar kolom tidak bergoyang.

---

## 7. Spasi, radius, dan kepadatan

- Skala spasi kelipatan 4: 4, 8, 12, 16, 24, 32, 48.
- Radius: kontrol 6px, panel 10px, dialog 12px. Tidak ada elemen berbentuk pill,
  kecuali chip filter yang memang satu baris.
- Dua tingkat kepadatan, dipilih berdasarkan tugas, bukan selera (angka mengikuti
  praktik tabel Carbon dan Fluent, T-5):
  - **Padat** (dosen, koordinator, kaprodi, admin): tinggi baris tabel 40px, header
    tabel 40px, padding sel horizontal 12px, teks 13px.
  - **Lapang** (mahasiswa, halaman publik): tinggi baris 56px, padding 16-24px,
    teks 14-16px.
- Di ponsel, tidak ada tabel yang digeser horizontal: tabel menjadi daftar baris
  dengan label per field, tinggi baris minimal 44px (T-4, T-5).
- Target sentuh: minimal 32px di desktop, 44px di ponsel (WCAG 2.2 SC 2.5.8).

---

## 8. Aturan komponen

- **Bagian, bukan kartu.** Informasi dikelompokkan dengan judul bagian, garis
  pemisah, dan latar panel. Kartu hanya untuk satu hal yang benar-benar berdiri
  sendiri (misalnya ringkasan tahap saat ini).
- **Tabel adalah warga utama.** Setiap daftar punya: kolom status, kolom aksi yang
  jelas, pengurutan, dan versi kartu untuk ponsel (pola `data-label` yang sudah ada).
- **Panel "Perlu tindakan Anda"** selalu berada di posisi yang sama pada halaman
  peran, berisi maksimal 5 item teratas dengan tombol langsung ke aksinya.
- **Status memakai satu kamus.** Daftar status, label Indonesia, dan warnanya
  didefinisikan sekali di kode (`src/lib/status.js`) dan dipakai semua halaman.
- **Status tidak boleh bergantung pada warna.** `StatusStamp` selalu berisi teks
  (misalnya `MENUNGGU`) dan bentuk pembeda: garis tepi penuh untuk status final,
  garis putus-putus untuk status yang menunggu, tanpa tepi untuk status netral.
  Ini syarat WCAG 1.4.1 dan tetap terbaca saat dicetak hitam putih (T-4).
- **Badge tidak interaktif.** Badge status tidak bisa difokus atau diklik; aksi
  selalu berupa tombol terpisah dengan nama objek ("Setujui bimbingan Ani").
- **Formulir**: label di atas field, teks bantuan di bawah label, pesan galat di
  bawah field, tombol utama di kanan bawah, dan ringkasan galat di atas form saat
  submit gagal.
- **Setiap tampilan data wajib punya tiga state**: kosong (dengan penjelasan apa
  yang belum ada dan apa langkah berikutnya), memuat (skeleton sesuai bentuk
  kontennya, bukan spinner di tengah), dan galat (pesan penyebab + tombol coba lagi).

---

## 9. Motion

- Durasi 120-180ms, easing standar, hanya untuk: buka/tutup panel, perubahan status,
  umpan balik tombol, dan perpindahan fokus.
- Tanpa animasi masuk untuk konten, tanpa parallax, tanpa scroll reveal di aplikasi.
- `prefers-reduced-motion: reduce` mematikan semua transisi non-esensial.
- Skeleton memakai denyut lambat yang juga berhenti saat reduced motion.

---

## 10. Suara penulisan (bahasa Indonesia kerja)

- Kalimat pendek, kata kerja di depan: "Setujui bimbingan", "Unduh laporan",
  "Ajukan sidang".
- Sebut akibat, bukan sifat: "Mahasiswa tidak bisa mengajukan sidang sebelum 8 sesi
  disetujui", bukan "Pastikan progres optimal".
- Dilarang: "seamless", "terintegrasi" sebagai pujian kosong, "powerful", "solusi
  digital", "revolusioner", dan em dash dalam teks.
- Kosakata domain dipakai apa adanya: proposal, bimbingan, logbook, revisi, sidang,
  pembimbing, penguji, kaprodi, koordinator, track, angkatan.
- Kesalahan sistem ditulis dari sudut pengguna: apa yang gagal, apa yang bisa
  dilakukan, dan apakah datanya aman.

---

## 11. Tema

Dua tema (terang dan gelap) wajib berjalan penuh. Terang adalah default karena
dipakai di ruang kelas dan kantor pada siang hari. Gelap bukan versi "tech", tapi
inversi kertas-tinta dengan kontras yang sama. Toggle tema yang ada dipertahankan.

---

## 12. Uji terima desain (dipakai setiap fase)

1. Tanpa melihat nama produk, apakah tampilan ini masih terasa milik prodi, bukan
   template dashboard mana pun?
2. Apakah pengguna baru tahu aksi berikutnya dalam 10 detik pada halaman perannya?
3. Apakah setiap status punya arti yang sama di semua halaman?
4. Apakah halaman bertahan pada 360px, 768px, 1280px, keyboard saja, dan kedua tema?
5. Apakah setiap angka yang tampil berasal dari data nyata?
6. Apakah status masih terbaca benar saat dicetak hitam putih atau dilihat oleh
   pengguna buta warna (T-4)?
7. Apakah tabel bertahan pada 360px tanpa geser horizontal (T-5)?
