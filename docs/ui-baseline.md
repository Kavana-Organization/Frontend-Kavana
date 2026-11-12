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

## 4. Known Failures Reference

From the QA comprehensive suite baseline (`QA_REPORT.md` / `kavana-ui-redesign-plan.md` §1), 49 known failures exist prior to this redesign across the full multi-browser suite:

### Known Failure Categories and Titles
1. **Mobile Viewport & Responsiveness Failures**
   - `Login page has developer device section` (collapsed/hidden on mobile)
   - `Register page renders all fields` (viewport overflow on mobile)
   - `Responsive UI: mahasiswa dashboard and forms stay usable on configured viewport`
   - `Responsive UI: login page stays usable on configured viewport`
   - `Responsive UI: public landing page does not overflow on configured viewport`
   - Mobile touch targets < 44px on compact navigation
   - Mobile sidebar drawer overlay collision on narrow viewports (320px–375px)
   - Academic table card stacking overflow on mobile

2. **RBAC & Authorization Bypass Issues**
   - `Admin cannot access /api/dosen/profile` (backend returns 200 instead of 403)
   - `Admin cannot access /api/dosen/bimbingan` (backend returns 200 instead of 403)
   - `Admin cannot access /api/developer/health` (backend returns 200 instead of 403)
   - `dosen cannot access admin endpoint with valid test token`
   - Admin management mutations cross-role leakage
   - Developer device lock bypass on unauthenticated headers

3. **Backend Cold-Start & Swagger Timeouts**
   - `GET /docs returns Swagger UI` (Cloud Functions cold-start > 10s timeout)
   - `GET / returns API OK message` (503 / timeout when functions cold)
   - `GET /ping returns pong`
   - `GET /live returns liveness status`
   - POST to a GET-only endpoint returns 404 or 405

4. **Authentication & Session Failures Under Offline / Staging 503**
   - `admin dapat membuka seluruh subhalaman manajemen`
   - `dosen login, membuka dashboard, lalu logout kembali ke login`
   - `Developer device enrollment`
   - `admin can access system management dashboard` (desktop & mobile)
   - `dosen can open dashboard and see supervision context` (desktop & mobile)
   - `register page exposes expected registration fields when available` (desktop & mobile)
   - `register form handles invalid email format without creating account`

Acceptance criterion across all redesign tasks: **No new failures against this baseline**.

