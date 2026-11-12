# UI Baseline Report (Task 1)

Date: 2026-11-12
Branch: `ui/redesign-2026-11`
Node: v26.5.0
Platform: win32 (Windows)

---

## 1. Slop Check Baseline (`scripts/slop-check.mjs`)

Starting slop detection count: **66 hits** across **19 files**.

### Pattern Breakdown

| Pattern | Hits | Allowed Exceptions |
| --- | --- | --- |
| `backdrop-blur` | 8 | Dialog / sheet / alert-dialog overlays permitted |
| `rounded-[` | 16 | None |
| `font-black` | 9 | None |
| `bg-gradient-to-` | 6 | None |
| `ctp-grid` | 3 | None |
| `ctp-noise` | 3 | None |
| `hover:-translate-y` | 9 | None |
| `shadow-[0_` | 11 | None |
| `Ringkasan Halaman` | 1 | None |
| **Total** | **66** | |

### Files with Starting Slop Hits

1. `src/app/dashboard/profile/page.jsx` (1 hit)
2. `src/app/forgot-password/page.jsx` (1 hit)
3. `src/app/globals.css` (4 hits)
4. `src/app/layout.js` (2 hits)
5. `src/app/login/page.jsx` (3 hits)
6. `src/app/luaran-proyek-1/page.jsx` (5 hits)
7. `src/app/luaran-proyek-2/page.jsx` (5 hits)
8. `src/app/luaran-proyek-3/page.jsx` (5 hits)
9. `src/app/page.jsx` (9 hits)
10. `src/app/register/page.jsx` (3 hits)
11. `src/app/verify/bimbingan/[token]/page.jsx` (1 hit)
12. `src/components/layout/dashboard-layout.jsx` (8 hits)
13. `src/components/layout/page-header.jsx` (5 hits)
14. `src/components/public/resource-page-shell.jsx` (2 hits)
15. `src/components/shared/floating-whatsapp.jsx` (6 hits)
16. `src/components/ui/button.jsx` (2 hits)
17. `src/components/ui/checkbox.jsx` (1 hit)
18. `src/components/ui/sidebar.jsx` (2 hits)
19. `src/components/ui/tooltip.jsx` (1 hit)

---

## 2. Playwright Test Suite Baseline Numbers

Executed with `npx playwright test` with conditional Next.js dev server on `http://localhost:3000`.

### Summary by Project

| Project | Total | Passed | Failed | Skipped | Status |
| --- | --- | --- | --- | --- | --- |
| `unit` | 0 | 0 | 0 | 0 | Configured for subsequent tasks |
| `api` | 30 | 0 | 0 | 30 | Dependent on live/seeded backend |
| `e2e-desktop` | 336 | 117 | 15 | 204 | UI & academic flow baseline |
| `e2e-mobile` | 96 | 13 | 3 | 80 | Mobile smoke suite |
| **Total Suite** | **462** | **130** | **18** | **314** | Baseline recorded |

---

## 3. Visual Baseline Snapshots (`tests/ui/visual-baseline.spec.js`)

Visual baseline snapshots captured and passing: **66 snapshot files** on `e2e-desktop`.

### Routes Covered (11 static/public & auth routes)
- `/` (landing)
- `/panduan-pengguna`
- `/faq-sistem`
- `/kebijakan-privasi`
- `/syarat-layanan`
- `/luaran-proyek-1`
- `/luaran-proyek-2`
- `/luaran-proyek-3`
- `/login`
- `/register`
- `/forgot-password`

### Viewports & Themes Covered (3 viewports × 2 themes per route)
- Desktop: 1440 × 900 (light & dark)
- Tablet: 768 × 1024 (light & dark)
- Mobile: 375 × 812 (light & dark)

Snapshot storage: `tests/ui/visual-baseline.spec.js-snapshots/`

---

## 4. Known Failures Reference (49 Known Failures by Title)

Per QA comprehensive baseline (`QA_REPORT.md` / `kavana-ui-redesign-plan.md` §1), 49 known failures exist prior to this redesign across the test suite projects. Acceptance criterion across all redesign tasks is **no new failures against this baseline**.

1. `[e2e-desktop]` `tests/academic-flow/admin-management.spec.js` › Admin management › admin dapat membuka seluruh subhalaman manajemen
2. `[e2e-desktop]` `tests/e2e/full-flow.spec.js` › Full flow › dosen login, membuka dashboard, lalu logout kembali ke login
3. `[e2e-desktop]` `tests/qa-comprehensive/auth-all-roles.spec.js` › Auth all roles › Developer device enrollment
4. `[e2e-desktop]` `tests/qa-comprehensive/error-handling.spec.js` › Error handling › POST to a GET-only endpoint returns 404 or 405
5. `[e2e-desktop]` `tests/qa-comprehensive/frontend-pages.spec.js` › Frontend pages › Login page has developer device section
6. `[e2e-desktop]` `tests/qa-comprehensive/frontend-pages.spec.js` › Frontend pages › Register page renders all fields
7. `[e2e-desktop]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET / returns API OK message
8. `[e2e-desktop]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET /ping returns pong
9. `[e2e-desktop]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET /live returns liveness status
10. `[e2e-desktop]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET /docs returns Swagger UI
11. `[e2e-desktop]` `tests/security-basic/rbac.spec.js` › RBAC basic › dosen cannot access admin endpoint with valid test token
12. `[e2e-desktop]` `tests/security-basic/validation.spec.js` › Validation basic › register form handles invalid email format without creating account
13. `[e2e-desktop]` `tests/ui/admin-dashboard.spec.js` › Admin dashboard › admin can access system management dashboard
14. `[e2e-mobile]` `tests/ui/admin-dashboard.spec.js` › Admin dashboard › admin can access system management dashboard
15. `[e2e-desktop]` `tests/ui/auth.spec.js` › Authentication UI › register page exposes expected registration fields when available
16. `[e2e-mobile]` `tests/ui/auth.spec.js` › Authentication UI › register page exposes expected registration fields when available
17. `[e2e-desktop]` `tests/ui/dosen-dashboard.spec.js` › Dosen dashboard › dosen can open dashboard and see supervision context
18. `[e2e-mobile]` `tests/ui/dosen-dashboard.spec.js` › Dosen dashboard › dosen can open dashboard and see supervision context
19. `[api]` `tests/qa-comprehensive/rbac-cross-role.spec.js` › RBAC cross-role › Admin cannot access /api/dosen/profile
20. `[api]` `tests/qa-comprehensive/rbac-cross-role.spec.js` › RBAC cross-role › Admin cannot access /api/dosen/bimbingan
21. `[api]` `tests/qa-comprehensive/rbac-cross-role.spec.js` › RBAC cross-role › Admin cannot access /api/developer/health
22. `[e2e-desktop]` `tests/qa-comprehensive/rbac-cross-role.spec.js` › RBAC cross-role › Admin cannot access /api/dosen/profile
23. `[e2e-desktop]` `tests/qa-comprehensive/rbac-cross-role.spec.js` › RBAC cross-role › Admin cannot access /api/dosen/bimbingan
24. `[e2e-desktop]` `tests/qa-comprehensive/rbac-cross-role.spec.js` › RBAC cross-role › Admin cannot access /api/developer/health
25. `[api]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET /docs returns Swagger UI
26. `[api]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET / returns API OK message
27. `[api]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET /live returns liveness status
28. `[api]` `tests/qa-comprehensive/health-api.spec.js` › Health API › GET /ping returns pong
29. `[e2e-mobile]` `tests/qa-comprehensive/frontend-pages.spec.js` › Frontend pages › Login page has developer device section
30. `[e2e-mobile]` `tests/qa-comprehensive/frontend-pages.spec.js` › Frontend pages › Register page renders all fields
31. `[e2e-mobile]` `tests/ui/responsive.spec.js` › Responsive UI › mahasiswa dashboard and forms stay usable on configured viewport
32. `[e2e-mobile]` `tests/ui/responsive.spec.js` › Responsive UI › login page stays usable on configured viewport
33. `[e2e-mobile]` `tests/ui/responsive.spec.js` › Responsive UI › public landing page does not overflow on configured viewport
34. `[e2e-mobile]` `tests/ui/auth.spec.js` › Authentication UI › empty login submit stays on login and shows validation or error state
35. `[e2e-mobile]` `tests/ui/auth.spec.js` › Authentication UI › invalid email format cannot pass login flow
36. `[e2e-mobile]` `tests/ui/auth.spec.js` › Authentication UI › register rejects empty required fields without creating production data
37. `[e2e-mobile]` `tests/ui/forgot-password.spec.js` › Forgot password › halaman lupa password terbuka dan menampilkan form email
38. `[e2e-mobile]` `tests/ui/forgot-password.spec.js` › Forgot password › email tidak valid tidak memicu permintaan OTP
39. `[e2e-mobile]` `tests/ui/forgot-password.spec.js` › Forgot password › email tidak terdaftar tidak lolos ke step OTP
40. `[e2e-mobile]` `tests/ui/forgot-password.spec.js` › Forgot password › tautan kembali ke login berfungsi
41. `[e2e-mobile]` `tests/ui/forgot-password.spec.js` › Forgot password › login page menyediakan tautan lupa password
42. `[e2e-mobile]` `tests/ui/kaprodi-dashboard.spec.js` › Kaprodi dashboard › kaprodi can access monitoring and coordinator-level menus
43. `[e2e-mobile]` `tests/ui/koordinator-dashboard.spec.js` › Koordinator dashboard › koordinator can access coordinator menus
44. `[e2e-mobile]` `tests/ui/mahasiswa-dashboard.spec.js` › Mahasiswa dashboard › mahasiswa dashboard shows core academic widgets
45. `[e2e-mobile]` `tests/ui/penguji-dashboard.spec.js` › Penguji dashboard › penguji dapat membuka seluruh subhalaman bimbingan dan sidang
46. `[e2e-mobile]` `tests/security-basic/validation.spec.js` › Validation basic › register form handles invalid email format without creating account
47. `[api]` `tests/qa-comprehensive/security-checks.spec.js` › Security checks › Developer device lock rejects unauthorized device
48. `[e2e-desktop]` `tests/qa-comprehensive/security-checks.spec.js` › Security checks › Developer device lock rejects unauthorized device
49. `[api]` `tests/security-basic/rbac.spec.js` › RBAC basic › dosen cannot access admin endpoint with valid test token

Acceptance criterion across all redesign tasks: **No new failures against this baseline**.

---

## Task 17 — Accessibility Closure Audit (2026-11-12)

Automated accessibility verification added in [`tests/ui/accessibility.spec.js`](../tests/ui/accessibility.spec.js) using `@axe-core/playwright`, Pixel 5 coarse-pointer target checks, and keyboard-only interaction walkthroughs.

### Step 1 — `@axe-core/playwright` Audit Results (0 Serious / 0 Critical Gate)

- **Coverage:** 58 unique routes across 12 public/auth routes (`/`, `/panduan-pengguna`, `/faq-sistem`, `/kebijakan-privasi`, `/syarat-layanan`, `/luaran-proyek-1..3`, `/verify/bimbingan/mock-token`, `/login`, `/register`, `/forgot-password`), 7 authenticated roles (`mahasiswa` 10 routes, `dosen` 5, `penguji` 3, `koordinator` 8, `kaprodi` 4, `admin` 5, `developer` 8), and 3 shared dashboard routes (`/dashboard/{profile,settings,support}`), audited in both `light` and `dark` themes (`116` total route-theme scans on `e2e-desktop`).
- **Baseline Issues Found & Fixed:**
  - `color-contrast` (light & dark): Adjusted `--ctp-subtext0`, light semantic hues (`--ctp-green`, `--ctp-peach`, `--ctp-teal`, `--ctp-mauve`, `--ctp-red`, `--ctp-blue`), and dark `--destructive` / `--ctp-red` / `--ctp-blue` in `src/app/globals.css`; updated `TONE_STYLES` in `src/components/shared/status-badge.jsx`, `ROLE_BADGE_STYLE` in `src/components/layout/sidebar.jsx`, user avatar badge in `src/components/layout/dashboard-layout.jsx`, pipeline badges and locked-stage opacity in `src/app/dashboard/mahasiswa/page.jsx`, active filter count opacity in `revisi-monitoring` and `kelola-users`, and dark CTA text (`text-[var(--accent-foreground)]`) in `src/app/page.jsx`, `src/app/login/page.jsx`, `src/app/register/page.jsx`, and `src/app/forgot-password/page.jsx`.
  - `label-content-name-mismatch`: Replaced overriding `aria-label` attributes with `.sr-only` context inside visible-text triggers in `src/app/page.jsx` (brand link) and `src/components/layout/dashboard-layout.jsx` (user menu button).
  - `button-name` & `aria-progressbar-name`: Added `aria-label="Filter dokumen"` on `SelectTrigger` in `src/app/dashboard/mahasiswa/page.jsx` and `aria-label="Progres sesi bimbingan"` on `Progress` in `src/app/dashboard/mahasiswa/bimbingan/page.jsx`.
  - Mobile heading hierarchy: Moved visible `<h1>` to form card titles in `src/app/login/page.jsx` and `src/app/register/page.jsx` so `<1024px` viewports retain a visible primary heading.
- **Final Axe Gate Result:** **0 serious, 0 critical** violations across all 58 routes in both `light` and `dark` modes.

### Step 2 — 44 px Coarse Pointer Target Audit (`e2e-mobile`, Pixel 5 `393x851`, `hasTouch: true`)

- **Coverage:** 13 representative public, auth, verification, and dashboard role routes (`/`, `/login`, `/register`, `/forgot-password`, `/dashboard/mahasiswa`, `/dashboard/mahasiswa/bimbingan`, `/dashboard/dosen/bimbingan-approve`, `/dashboard/penguji/sidang`, `/dashboard/koordinator/jadwal-sidang`, `/dashboard/kaprodi/kelola-koordinator`, `/dashboard/admin/kelola-users`, `/dashboard/developer/devices`, `/dashboard/support`).
- **Fixes Applied:** Added `[@media(pointer:coarse)]:min-h-11` / `[@media(pointer:coarse)]:min-w-11` hit targets on `TabsTrigger` (`src/components/ui/tabs.jsx`), `DialogPrimitive.Close` (`src/components/ui/dialog.jsx`), `SheetPrimitive.Close` (`src/components/ui/sheet.jsx`), brand & footer links (`src/app/page.jsx`), auth back/helper links & password visibility toggles (`src/app/login/page.jsx`, `src/app/register/page.jsx`, `src/app/forgot-password/page.jsx`), terms label (`src/app/register/page.jsx`), and table row detail button (`src/app/dashboard/dosen/bimbingan-approve/page.jsx`). Exempts inline prose `<a style="display:inline">` links inside running `<p>/<li>/<label>` text and checkboxes whose associated `<label>` exceeds `44px`.
- **Final Result:** **0 coarse-pointer target violations** across all 13 audited routes on Pixel 5.

### Step 3 — Automated Keyboard-Only Walkthrough (`e2e-desktop`)

1. **`/login` traversal:** `login-email` -> `Tab` -> `login-password` -> `Tab` -> password visibility toggle (`Enter` switches `type="password"` to `"text"`) -> `Tab` -> `login-submit`. **Passed.**
2. **Sidebar navigation & rail flyout:** `ArrowDown` / `ArrowUp` / `Home` / `End` item movement, `Space` group expand/collapse (`aria-expanded`), rail collapse toggle + `Enter` opening `Popover` flyout + `Escape` closing and restoring focus to rail trigger. **Passed.**
3. **Controlled `Dialog` focus trap & `Escape` restoration (`/dashboard/koordinator/kelola-periode`):** Focused `Buat Periode`, opened modal via `Enter`, verified 10 `Tab` presses stay trapped inside `[role="dialog"]`, pressed `Escape`, verified dialog closes and focus returns to `Buat Periode` via `DialogFocusCapture` + `onCloseAutoFocus` in `src/components/ui/dialog.jsx`. **Passed.**
4. **Table row action & `Sheet` detail drawer (`/dashboard/dosen/bimbingan-approve`):** Focused row action `Lihat detail bimbingan`, opened right `Sheet` via `Enter`, verified `Tab` focus moves inside drawer, pressed `Escape`, verified sheet closes and focus returns to row action button via `SheetFocusCapture` + `onCloseAutoFocus` in `src/components/ui/sheet.jsx`. **Passed.**


