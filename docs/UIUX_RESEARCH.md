# Riset Dasar Keputusan UI/UX Kavana

Tujuan: memastikan arah desain di `docs/DESIGN.md` dan rencana di
`docs/UIUX_REDESIGN_PLAN.md` bukan selera, melainkan keputusan yang punya dasar.

Metode: 6 pencarian literatur dan pedoman sistem desain, difokuskan pada tiga hal
yang relevan untuk Kavana: (1) sistem internal untuk staf, (2) dasbor akademik di
perguruan tinggi, (3) batasan aksesibilitas dan kepadatan tabel yang bisa diukur.
Rujukan berupa pedoman resmi (GOV.UK, W3C), sistem desain perusahaan (IBM Carbon,
Microsoft Fluent), artikel riset (NN/g), serta dua studi akademik tentang dasbor
kemajuan studi.

---

## Ringkasan: lima temuan yang mengubah rencana

| # | Temuan | Akibat pada rencana |
|---|---|---|
| T-1 | Layanan internal harus dinilai dengan standar yang sama dengan layanan publik, tetapi pola "satu hal per halaman" tidak cocok karena staf perlu berpindah tugas dengan cepat | Dasbor peran berbentuk **antrean tugas di satu layar**, bukan wizard bertahap |
| T-2 | Dasbor punya dua jenis berbeda: operasional (butuh cepat, tanpa eksplorasi) dan analitis (untuk keputusan) | Grafik hanya untuk kaprodi dan koordinator. Dosen dan mahasiswa mendapat **daftar**, bukan grafik |
| T-3 | Studi dasbor kemajuan akademik menunjukkan manfaat terbesar pada pemantauan tahap dan pengurangan waktu akses data | Motif "garis tahap akademik" dipertahankan sebagai struktur utama, bukan hiasan |
| T-4 | Pedoman aksesibilitas melarang status yang dibedakan hanya dengan warna; warna merah-hijau murni bermasalah bagi buta warna | Status wajib punya **teks + bentuk/garis**, warna hanya pendukung |
| T-5 | Serif bukan faktor keterbacaan yang signifikan, tetapi **familiaritas** berpengaruh; pemahaman teks di layar lebih baik dengan sans | Serif dibatasi pada halaman publik dan dokumen. Di dalam aplikasi: sans saja |

---

## T-1. Sistem internal: standar tinggi, tetapi pola interaksi berbeda

GOV.UK Service Manual, "Services for government users", menyatakan layanan internal
harus memenuhi standar yang sama dengan layanan publik (memenuhi kebutuhan pengguna,
aman, aksesibel, mudah diubah), dan secara eksplisit menyebut bahwa pengguna sistem
administrasi "might need to repeat and switch between tasks quickly", sehingga
pendekatan satu hal per halaman tidak selalu tepat.

- Sumber: https://www.gov.uk/service-manual/design/services-for-government-users
- Turunan yang dipakai: kualitas visual tidak boleh lebih rendah hanya karena
  penggunanya staf. Sebaliknya, pola interaksi mengikuti pekerjaan berulang.
- Keputusan: **jangan** memecah alur persetujuan bimbingan menjadi wizard
  multi-layar. Satu layar antrean dengan aksi per baris lebih cepat.

GOV.UK Design System untuk tabel juga menegaskan tabel dipakai untuk membandingkan
informasi, tidak pernah untuk tata letak, dan wajib punya caption sebagai konteks.

- Sumber: https://design-system.service.gov.uk/components/table/
- Keputusan: daftar mahasiswa, proposal, dan bimbingan memakai tabel sungguhan
  dengan caption, bukan kumpulan kartu.

## T-2. Dasbor operasional berbeda dari dasbor analitis

NN/g membedakan dasbor operasional (informasi kritis untuk keputusan cepat, tanpa
eksplorasi) dari dasbor analitis (untuk analisis dan keputusan yang tidak mendesak),
dan menekankan bahwa dasbor dibaca sekilas sehingga representasi kuantitatif harus
memakai panjang dan posisi, bukan luas atau warna saja.

- Sumber: https://www.nngroup.com/articles/dashboards-preattentive/
- Keputusan:
  - **Dosen** = operasional: antrean "menunggu persetujuanmu", tanpa grafik.
  - **Mahasiswa** = operasional + progres: tahap sekarang, sisa sesi, dokumen kurang.
  - **Koordinator dan kaprodi** = analitis: distribusi tahap, kesiapan sidang,
    tren per angkatan. Grafik boleh, maksimal dua per halaman.
  - **Admin** = operasional data: daftar masalah data, bukan ringkasan pemasaran.

## T-3. Bukti dari sistem kemajuan akademik yang sejenis

Studi APMIS di College of Engineering UPLB (2026) merancang sistem pemantauan
kemajuan akademik dengan dasbor business intelligence untuk tiga peran (kantor
sekretariat, penasihat, mahasiswa). Hasil pengujian: SUS 95 (OCS), 86,25 (penasihat),
92,50 (mahasiswa), dengan penurunan waktu akses data ringkasan dari 90 menit menjadi
0,23 menit, dan waktu tinjau penasihat turun 95%.

- Sumber: https://ieomsociety.org/proceedings/bangkok2026/31.pdf
- Yang diambil: pemantauan **tahap** per mahasiswa adalah inti nilai sistem seperti
  ini, dan mahasiswa juga memperoleh manfaat dari melihat posisinya sendiri.
- Yang tidak diambil: meniru dasbor BI yang penuh grafik untuk semua peran.

Studi Silvola dkk. (University of Oulu) menemukan penasihat akademik menilai dasbor
paling berguna untuk **persiapan dan pemantauan**, bukan sebagai pemicu intervensi
otomatis, dan mereka mengalami kesulitan menafsirkan visualisasi yang rumit
(bar dan radar plot rencana studi).

- Sumber: https://ceur-ws.org/Vol-3383/FLAIEC22_paper_5575.pdf
- Keputusan: untuk dosen, tampilkan **daftar dan kalimat**, bukan radar atau donat.
  Interpretasi grafik adalah biaya kognitif yang tidak dibayar oleh pengguna sibuk.

## T-4. Status tidak boleh hanya warna

WCAG 2.2 SC 1.4.1 (Level A) melarang warna sebagai satu-satunya pembeda informasi,
dan menjelaskan bahwa pasangan warna yang juga berbeda terang (kontras minimal 3:1)
baru dianggap sebagai pembeda tambahan. Pedoman komponen badge Red Hat dan Dell
menambahkan: badge harus disertai teks, tidak boleh interaktif, dan tidak boleh
mengandalkan warna saja; MDN juga memperingatkan metafora lampu lalu lintas
merah-hijau murni karena buta warna merah-hijau.

- Sumber:
  - https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
  - https://ux.redhat.com/elements/badge/accessibility/
  - https://www.delldesignsystem.com/components/badge/
  - https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Use_of_color
- Keputusan: komponen `StatusStamp` = **teks kapital berbahasa Indonesia** + bentuk
  pembeda (garis tepi penuh untuk status final, garis putus-putus untuk menunggu)
  + warna sebagai lapis ketiga. Warna memakai hijau kebiruan dan merah kecokelatan,
  bukan hijau dan merah murni.

Target sentuh: WCAG 2.2 SC 2.5.8 mensyaratkan minimal 24x24 px CSS, dan praktik
umum menetapkan 44 px untuk layar sentuh.

- Sumber: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Keputusan: tombol dan kontrol minimal 32 px di desktop, 44 px di ponsel; baris
  tabel di ponsel minimal 44 px.

## T-5. Kepadatan tabel: angka konkret, bukan perkiraan

IBM Carbon menyediakan lima ukuran baris data table (24 sampai 64 px) dengan header
tetap, dan Microsoft Fluent menyebut tinggi baris umum 40, 48, 56, atau 64 px, header
40 px, padding horizontal sel 12 px, header tidak boleh di tengah, angka desimal
konsisten, dan font monospace dipakai untuk rujukan teknis.

- Sumber:
  - https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines
  - https://developer.microsoft.com/en-us/azure-devops/components/table
- Keputusan: header tabel 40 px, padding sel 12 px, tinggi baris **40 px untuk staf**
  dan **56 px untuk mahasiswa**, serta `tabular-nums` dan mono untuk NPM/NIDN/tanggal.
  Header rata kiri, tidak pernah di tengah.
- Catatan praktik: pengubah tabel menjadi daftar baris di ponsel (bukan tabel yang
  digeser horizontal) sejalan dengan pola `data-label` yang sudah ada di Kavana.

## T-6. Tipografi: serif bukan soal keterbacaan, tetapi soal familiaritas

Tinjauan literatur sistematis atas 42 studi empiris (2000-2025) menyimpulkan serif
bukan faktor keterbacaan yang signifikan, tidak ada satu ukuran atau jenis huruf yang
optimal untuk semua orang, dan **familiaritas** adalah faktor yang signifikan.
Eksperimen Millhagen dkk. (2026, N=132) menemukan pemahaman lebih tinggi saat membaca
di layar dan tidak ada interaksi antara media dan jenis huruf.

- Sumber:
  - https://journals.uc.edu/index.php/vl/article/download/8855/7099/13208
  - https://www.tandfonline.com/doi/full/10.1080/0144929X.2026.2678378
- Keputusan (mengubah usulan awal): **serif hanya untuk halaman publik dan dokumen**
  (landing, panduan, luaran proyek, laporan), karena di sana teks dibaca sebagai
  dokumen. Di dalam aplikasi memakai satu keluarga sans, karena pengguna memindai
  tabel dan form setiap hari, dan familiaritas membantu.

---

## Yang tetap dipertahankan dari rencana awal

- Arah "Papan Kerja Akademik": didukung T-1, T-2, T-3.
- Palet kertas-tinta dengan satu aksen "penanda": didukung T-2 (warna untuk kategori
  dan perhatian, bukan hiasan) dan T-4 (warna bukan satu-satunya sinyal).
- Larangan gradien dekoratif, glow, dan kartu untuk setiap potongan informasi:
  didukung T-2 dan pedoman tabel GOV.UK.
- Dua tingkat kepadatan: didukung T-5 dengan angka pasti.

## Yang dikoreksi dari rencana awal

| Sebelum | Sesudah | Alasan |
|---|---|---|
| Serif untuk judul di seluruh aplikasi | Serif hanya di halaman publik dan dokumen | T-6: familiaritas dan pemindaian tabel lebih penting di aplikasi |
| Grafik ringkasan di semua dasbor | Grafik hanya untuk koordinator dan kaprodi | T-2: dasbor operasional tidak butuh grafik |
| P1 dikerjakan penuh tanpa backend | P1a (frontend, memakai `/stats` yang sudah ada) lalu P1b (3 endpoint daftar read-only) | Hasil audit kode: keempat `/stats` saat ini hanya mengembalikan angka, belum ada daftar item untuk antrean |
| Pencarian global memakai pustaka baru | Ditulis sendiri dengan Dialog Radix yang sudah terpasang | Menghindari dependensi dan bobot tambahan untuk jaringan kampus |

## Rujukan lengkap

1. GOV.UK Service Manual. Services for government users.
   https://www.gov.uk/service-manual/design/services-for-government-users
2. GOV.UK Design System. Table component.
   https://design-system.service.gov.uk/components/table/
3. Page Laubheimer. Dashboards: Making Charts and Graphs Easier to Understand. NN/g, 2017.
   https://www.nngroup.com/articles/dashboards-preattentive/
4. Garfin dkk. Designing an Academic Progress Monitoring Information System for
   Engineering Education: A Case Study at UPLB. IEOM, 2026.
   https://ieomsociety.org/proceedings/bangkok2026/31.pdf
5. Silvola dkk. Implementing a learning analytics dashboard to support academic
   advising practice. FLAIEC, 2022. https://ceur-ws.org/Vol-3383/FLAIEC22_paper_5575.pdf
6. IBM Carbon Design System. Data table guidelines.
   https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines
7. Microsoft. Table component, Formula Design System.
   https://developer.microsoft.com/en-us/azure-devops/components/table
8. W3C WAI. Understanding SC 2.5.8 Target Size (Minimum).
   https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
9. W3C WAI. Understanding SC 1.4.1 Use of Color.
   https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
10. Red Hat Design System. Badge accessibility.
    https://ux.redhat.com/elements/badge/accessibility/
11. Dell Design System. Badge.
    https://www.delldesignsystem.com/components/badge/
12. MDN. Use of color (WCAG).
    https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Use_of_color
13. Ho Sang & Petrarca. Beyond (Type)Face Value: A Systematic Literature Review
    Examining Design Factors Influencing the Legibility and Readability of
    Typography. Visible Language, 2025.
    https://journals.uc.edu/index.php/vl/article/download/8855/7099/13208
14. Millhagen dkk. Just the font types? Effects of serif vs. sans-serif font types on
    text comprehension in screen vs. paper reading. 2026.
    https://www.tandfonline.com/doi/full/10.1080/0144929X.2026.2678378
15. Polyxd docs. Dense software (praktik kepadatan B2B, rujukan sekunder).
    https://polyxd.com/docs/dense-software/
