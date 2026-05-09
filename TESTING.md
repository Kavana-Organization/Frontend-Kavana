# Automated Testing Kavana

Dokumentasi ini menjelaskan setup Playwright untuk alpha testing aplikasi Kavana. Frontend berada di repository ini, sedangkan backend berada di repository berbeda dan dites melalui URL deploy.

## Target Environment

- Frontend deploy: `https://kavana.my.id`
- Backend deploy: `https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana`
- UI test selalu memakai `FRONTEND_URL`.
- API test selalu memakai `BACKEND_URL`.
- Backend tidak dijalankan otomatis dari Playwright.

## Setup

1. Install dependency:

```bash
npm install
```

2. Copy environment:

```bash
cp .env.example .env
```

3. Isi credential testing khusus di `.env`.

Jangan memakai akun production asli. Semua credential default di `.env.example` adalah placeholder dan akan membuat test role otomatis di-skip.

## Environment Variable

Minimal:

```env
FRONTEND_URL=https://kavana.my.id
BACKEND_URL=https://asia-southeast2-renzip-478811.cloudfunctions.net/kavana
TURNSTILE_TEST_MODE=true
```

Credential role testing:

```env
TEST_MAHASISWA_EMAIL=mahasiswa.test@example.com
TEST_MAHASISWA_PASSWORD=password123
TEST_DOSEN_EMAIL=dosen.test@example.com
TEST_DOSEN_PASSWORD=password123
TEST_KOORDINATOR_EMAIL=koordinator.test@example.com
TEST_KOORDINATOR_PASSWORD=password123
TEST_KAPRODI_EMAIL=kaprodi.test@example.com
TEST_KAPRODI_PASSWORD=password123
TEST_ADMIN_EMAIL=admin.test@example.com
TEST_ADMIN_PASSWORD=password123
```

Data fixture:

```env
TEST_NPM=123456789
TEST_PRODI=D4 Teknik Informatika
TEST_ANGKATAN=2023
TEST_PROPOSAL_TITLE=Proposal Testing Kavana
TEST_PROPOSAL_DRIVE_LINK=https://drive.google.com/drive/folders/test-proposal
TEST_LAPORAN_TITLE=Laporan Sidang Testing Kavana
TEST_LAPORAN_DRIVE_LINK=https://drive.google.com/drive/folders/test-laporan
TEST_LUARAN_DRIVE_LINK=https://drive.google.com/drive/folders/test-luaran
TEST_BIMBINGAN_TOPIC=Progress pengembangan fitur testing
TEST_BIMBINGAN_NOTE=Catatan bimbingan otomatis dari Playwright
TEST_TRACK=PROYEK_1
TEST_JALUR=REGULAR
```

## Commands

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
npm run test:e2e:report
```

## Playwright Config

File: `playwright.config.js`

- `baseURL` memakai `FRONTEND_URL`.
- Timeout default 30 detik.
- Retry minimal 1 kali.
- HTML reporter aktif.
- Screenshot hanya saat gagal.
- Video disimpan saat gagal.
- Trace aktif saat retry pertama.
- Project:
  - Desktop Chrome
  - Mobile Chrome / Pixel 5
  - Mobile Safari / iPhone 12

## Struktur Test

```txt
tests/
├─ helpers/
│  ├─ auth.js
│  ├─ env.js
│  ├─ selectors.js
│  ├─ ui.js
│  └─ api.js
├─ fixtures/
│  └─ test-data.js
├─ ui/
├─ academic-flow/
├─ api/
└─ security-basic/
```

## Coverage Awal

- Smoke test landing page.
- Auth UI validation.
- Protected route redirect.
- Dashboard role-based test untuk mahasiswa, dosen, koordinator, kaprodi, admin.
- Responsive test untuk landing, login, dashboard, dan form mahasiswa.
- Academic flow page test: track, kelompok, proposal, assign pembimbing, bimbingan, laporan sidang, jadwal sidang, nilai, revisi.
- API test: health discovery, auth validation, unauthorized protected endpoint, proposal, bimbingan, laporan, jadwal sidang, notification, admin.
- Security basic: auth protection, RBAC dasar, input validation.

## Test yang Di-skip

Test berikut sengaja dibuat `test.skip()` sampai ada akun testing dan seed data yang aman:

- Submit proposal valid.
- Create/update kelompok.
- Approve/reject proposal.
- Assign pembimbing.
- Create bimbingan valid.
- Submit laporan sidang valid.
- Create jadwal sidang dan conflict validation.
- Input nilai sidang.
- Submit revisi sidang.
- Admin management mutation.

Alasannya: test tersebut mengubah state live dan tidak boleh dijalankan di production tanpa akun/data testing khusus.

## Cloudflare Turnstile

Login memakai Cloudflare Turnstile. Automated test tidak boleh membypass production security secara hardcoded.

Rekomendasi:

- Pakai environment staging/testing dengan Cloudflare Turnstile testing key.
- Aktifkan `TURNSTILE_TEST_MODE=true` hanya di environment testing.
- Sediakan akun testing per role.
- Jika Turnstile aktif di production dan tidak memakai testing key, test login UI/API role akan di-skip atau gagal di validasi Turnstile.

## Selector Stability

Beberapa test memakai label dan teks UI yang sudah ada. Untuk membuat test lebih stabil, disarankan menambahkan `data-testid` tanpa mengubah tampilan:

- `data-testid="login-email"`
- `data-testid="login-password"`
- `data-testid="login-submit"`
- `data-testid="dashboard-title"`
- `data-testid="proposal-form"`
- `data-testid="bimbingan-form"`
- `data-testid="jadwal-sidang-form"`

## Cara Menambah Test Baru

- Pakai helper `tests/helpers/env.js` untuk URL dan credential.
- Pakai helper `tests/helpers/api.js` untuk endpoint backend.
- Untuk test mutation live, buat `test.skip()` dulu.
- Jangan hardcode URL deploy di spec.
- Jangan memakai akun production asli.
- Prioritaskan assertion yang sesuai behavior user, bukan detail CSS.

## Catatan Backend

Backend berada di repository terpisah dan tidak diubah oleh setup ini. API test hanya memanggil backend deploy. Jika backend menyediakan seed command, jalankan seed di environment testing terpisah sebelum mengaktifkan test mutation.

## Rekomendasi Lanjutan

- Buat database staging khusus untuk E2E.
- Buat seed akun testing per role.
- Tambahkan GitHub Actions untuk menjalankan Playwright pada PR.
- Tambahkan k6 untuk load/stress test.
- Tambahkan OWASP ZAP baseline scan untuk security regression.
