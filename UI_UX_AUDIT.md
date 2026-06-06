# UI/UX Audit Report - Kavana Frontend

Audit date: 2026-06-02  
Scope: `src/app`, `src/components`, and supporting UI/constants used by pages.  
Verification: `npm run lint` completed with no ESLint warnings or errors.

## Cross-Cutting Findings

- Several dashboard and modal forms use visual `<Label>` text without `htmlFor`/`id`, so screen readers and click-to-focus behavior are inconsistent.
- Touch targets are often below the 44x44px mobile recommendation. `src/components/ui/button.jsx` defines `sm`, `xs`, `icon`, and `icon-sm` below 44px.
- Loading states are visually present but usually not announced with `role="status"` or `aria-live`.
- Some dashboards show static/demo chart data while other cards use API data, which can mislead dosen, koordinator, and admin users.
- Public auth flows are generally approachable, but Turnstile fallback text exposes developer configuration details in the login screen.
- Role-based reuse through route re-exports keeps implementation small, but several kaprodi/koordinator/penguji pages inherit dosen wording and UX assumptions.
- Contrast check found `--ctp-overlay1` below WCAG AA for normal text in both light and dark surfaces. `--ctp-subtext0` in light mode barely passes.

## Detailed Audit

### Root Layout — `src/app/layout.js`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- `FloatingWhatsApp` is rendered globally → lines 36-37 → Hide it on authenticated dashboard/auth routes or make it route-aware so it does not cover mobile controls.
- Decorative global overlays are always present → lines 33-34 → Confirm they do not reduce readability on dense academic tables; allow app pages to disable them.

**What's Working Well:**
- Indonesian language is set correctly with `<html lang="id">` on line 28.
- Theme is applied before hydration to reduce theme flash, lines 11-24.

### Global Styling — `src/app/globals.css`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- `--ctp-overlay1` has insufficient contrast on base/surface backgrounds → lines 71 and 134 → Use a darker light-mode value and lighter dark-mode value for captions, helper text, and labels.
- Heading letter spacing is globally negative → line 207 → Use `letter-spacing: 0` for readability and consistency, especially in dense academic screens.
- Several large rounded surfaces exceed the compact product UI style → common `rounded-[28px]` usage → Reduce section/card radii where these are not repeated cards or modals.

**What's Working Well:**
- Theme tokens are centralized and support both light and dark modes.
- Focus outlines use a consistent tokenized ring style.

### Landing Page — `src/app/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- Above-the-fold stats are placeholder-like trust signals → lines 147-153 and `src/lib/constants.js` lines 208-212 → Replace "Data Resmi/Sedang Validasi" style copy with concrete outcomes or remove until real metrics exist.
- CTA choices are clear, but role intent is not explicit enough for first-time users → lines 133-144 → Label the secondary CTA as guidance for mahasiswa/dosen or add role-specific microcopy near the CTA row.

**What's Working Well:**
- The hero immediately communicates that Kavana manages proposal, bimbingan, sidang, and revisi workflows.
- Navigation and mobile menu are straightforward, with an accessible menu toggle.

### Public Content Constants — `src/lib/constants.js`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- `MENU_CONFIG` supports `penguji`, but admin user management does not count or style `penguji` → lines 53-64, 104-110, 129, 179 → Keep role definitions synchronized across constants and admin pages.
- `TITLE_MAP` gives consistent titles but does not cover role-specific reused pages well → lines 138-172 → Add role-aware page subtitle/title overrides for kaprodi, koordinator, and penguji re-exported pages.

**What's Working Well:**
- Role navigation is centralized, which is good for maintaining role-specific information architecture.

### Login Page — `src/app/login/page.jsx`
**Overall Rating:** 🔴 Critical Issue

**Issues Found:**
- Production users can see developer configuration copy when Turnstile is missing → lines 375-384 → Replace with a production-safe message such as "Verifikasi keamanan belum tersedia. Coba muat ulang atau hubungi admin."
- Submit is blocked until Turnstile token exists, but there is no retry/recovery CTA when the widget fails → lines 345-397 → Add a reload/retry action and inline help text.
- Turnstile error feedback is only text under the widget → lines 388-390 → Add `aria-live="polite"` and ensure the message is announced.

**What's Working Well:**
- Identifier/password labels are visible and the submit button clearly shows loading state.
- Password visibility toggle uses an `aria-label`.

### Register Page — `src/app/register/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- OTP inputs have no programmatic labels → lines 55-70 → Add `aria-label`, `name`, and `autoComplete="one-time-code"` to each input or use a grouped OTP component.
- Required fields are validated but not consistently marked visually → lines 413-528 → Add required markers or helper text consistently.
- Terms/privacy text is not linked → lines 523-525 → Link to `/syarat-layanan` and `/kebijakan-privasi`.
- Select/input controls use 40px height → lines 426-528 → Increase mobile touch height to at least 44px.

**What's Working Well:**
- The flow is logically split into account creation and OTP verification.
- Password guidance is stronger here than in forgot-password/settings.

### Forgot Password Page — `src/app/forgot-password/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- OTP inputs have no accessible labels → lines 81-100 → Add `aria-label`, `name`, and `autoComplete="one-time-code"`.
- Labels are visual only and not bound to inputs → lines 271, 359, 380 → Add `id` to inputs and `htmlFor` to labels.
- Password requirement says minimum 6 characters → lines 182 and 393 → Align with register/admin minimum of 8 characters.
- Eye toggle buttons lack explicit accessible labels → lines 369-375 → Add `aria-label` values for show/hide password.

**What's Working Well:**
- Step indicator gives clear progress through email, OTP, reset, and done states.

### Dashboard Layout — `src/components/layout/dashboard-layout.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Header subtitle is generic for every role/page → lines 383-390 → Use page-specific context so dosen, mahasiswa, admin, and developer users understand the current workflow.
- Header icon buttons use 40px targets → line 87 and lines 406-449 → Increase touch targets to 44px on mobile.
- Notification loading/error text is not announced → lines 470-488 → Add `aria-live` or `role="status"`.
- Profile/settings dropdown routes may duplicate role-specific profile pages → lines 544 and 550 → Normalize whether profile is shared or role-specific.

**What's Working Well:**
- Header actions are visually consistent and grouped predictably.
- Notification dropdown exposes both unread state and timestamps.

### Sidebar — `src/components/layout/sidebar.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Collapsed sidebar expand button is only 24px → lines 151-156 → Increase to at least 44px or provide a larger hit area.
- Mobile sidebar trigger inherits a 36px icon button → line 312 and `button.jsx` line 27 → Increase mobile touch target.
- Active state only matches exact paths → line 186 → Use `pathname === href || pathname.startsWith(href + "/")` so nested/detail pages keep their parent active.
- Section label text is very small and low contrast → lines 164-165 → Use stronger contrast or remove nonessential label.

**What's Working Well:**
- Active navigation has a clear visual indicator in expanded mode.
- Role-based menu items are cleanly sourced from constants.

### Page Header — `src/components/layout/page-header.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Eyebrow text is always "Ringkasan Halaman" → lines 7-9 → Make it optional or page-specific.
- Header is styled as a large floating card → line 5 → Use a flatter full-width section for dense operational dashboards.

**What's Working Well:**
- Title and subtitle API is simple and consistent.

### Page Header Animated — `src/components/layout/page-header-animated.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Motion is applied without checking reduced-motion preference → lines 8-11 → Respect `prefers-reduced-motion`.

**What's Working Well:**
- Animation is subtle and scoped.

### Button Primitive — `src/components/ui/button.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- `xs`, `sm`, `icon`, and `icon-sm` sizes are below 44px → lines 24-29 → Add responsive mobile sizing or avoid these sizes for primary mobile actions.

**What's Working Well:**
- Variants are centralized and visually consistent.

### Dashboard Dialog — `src/components/shared/dashboard-dialog.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Close button is disabled by default → line 23 → Provide a visible close action consistently, especially for longer forms.
- Header is screen-reader-only → lines 29-32 → Good for accessibility, but users may lack visual context if the child content does not include a clear title.

**What's Working Well:**
- Dialog structure uses accessible Radix primitives.

### Confirm Action Dialog — `src/components/shared/confirm-action-dialog.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- No major issue found.

**What's Working Well:**
- Confirmation, loading lock, and destructive variant are implemented cleanly.

### Floating WhatsApp — `src/components/shared/floating-whatsapp.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Message input uses placeholder-only labeling → lines 69-75 → Add an accessible label or `aria-label`.
- Send button is icon-only without label → lines 76-83 → Add `aria-label="Kirim pesan WhatsApp"`.
- Widget appears globally through root layout → `src/app/layout.js` lines 36-37 → Hide it on app screens where it can obstruct workflows.

**What's Working Well:**
- Main floating trigger has an accessible label and a large touch target.

### Public Resource Shell — `src/components/public/resource-page-shell.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- "Kembali ke Beranda" points to `/#contact` → lines 19-22 → Change to `/` or change text to "Kontak" if the anchor is intentional.
- Content is wrapped in large cards for every legal/resource page → lines 25-42 → Consider a simpler document layout for readability.

**What's Working Well:**
- Public pages share a consistent shell and return navigation.

### Panduan Pengguna — `src/app/panduan-pengguna/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Guide content is high-level and lacks direct role pathways → lines 15-41 → Add specific links for mahasiswa registration, dosen approval, and koordinator scheduling flows.

**What's Working Well:**
- Copy is concise and uses role-based sections.

### FAQ Sistem — `src/app/faq-sistem/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- FAQ answers are useful but short → lines 15-39 → Add entries for Turnstile/login issues, proposal validation, and sidang scheduling.

**What's Working Well:**
- Accordion pattern is appropriate and keeps the page easy to scan.

### Kebijakan Privasi — `src/app/kebijakan-privasi/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Current privacy copy does not clearly mention tracker data such as IP, browser, language, screen resolution, timezone, and auth events → lines 15-37 → Add a transparent section for device/page visit/auth event tracking.

**What's Working Well:**
- The page is short, readable, and grouped by policy topic.

### Syarat Layanan — `src/app/syarat-layanan/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- No major UI issue found.

**What's Working Well:**
- Conditions are clear and appropriate for academic system use.

### Luaran Proyek 1 — `src/app/luaran-proyek-1/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- Dense cards use large radius and visual weight → line 44 → Reduce card styling if this page should read like documentation.

**What's Working Well:**
- Content is structured with clear headings and updated-date metadata.

### Luaran Proyek 2 — `src/app/luaran-proyek-2/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- No major issue beyond the shared resource shell/card style.

**What's Working Well:**
- Page content is readable and scoped.

### Luaran Proyek 3 — `src/app/luaran-proyek-3/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- No major issue beyond the shared resource shell/card style.

**What's Working Well:**
- Page content is concise and easy to skim.

### Bimbingan Verification Page — `src/app/verify/bimbingan/[token]/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Raw error messages may be displayed directly → lines 28 and 67 → Map technical errors into user-safe verification messages.
- Small hint text may be hard to read → line 155 → Increase size/contrast.

**What's Working Well:**
- Verification status is visually clear and the signed data rows are easy to understand.

### Auth Guard — `src/components/auth/auth-guard.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Guard returns `null` during loading/redirect → lines 51-52 → Show a minimal loading status to avoid a blank screen.
- Non-401 auth check failures are silently ignored → line 35 → Surface a recoverable error state if the session check cannot complete.

**What's Working Well:**
- Unauthorized users are redirected based on role access rules.

### Mahasiswa Dashboard — `src/app/dashboard/mahasiswa/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status text → lines 307-311 → Add `role="status"` and hidden text.
- Empty bimbingan state lacks an inline CTA → lines 348-352 → Add "Catat bimbingan" inside the empty state.
- Document actions use small buttons → line 460 → Use 44px touch targets on mobile.
- Chart has no accessible text/table fallback → lines 538-546 → Add a short summary or visually hidden data table.

**What's Working Well:**
- KPI cards and sections are tailored to student progress and use approachable copy.

### Mahasiswa Bimbingan — `src/app/dashboard/mahasiswa/bimbingan/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner is visual-only → lines 177-180 → Add accessible loading status.
- Edit icon button is icon-only and small → line 285 → Add `aria-label` and increase target size.
- Dialog labels are not bound to fields → lines 303, 312, 316 → Add `htmlFor`/`id`.

**What's Working Well:**
- Business rules for adding/editing bimbingan are surfaced through clear toast feedback.

### Mahasiswa Proposal — `src/app/dashboard/mahasiswa/proposal/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Several labels are not programmatically associated with controls → lines 263, 269, 281, 284, 300, 316 → Add `htmlFor`/`id`.
- Select controls use 40px height → lines 286 and 302 → Increase to 44px on mobile.

**What's Working Well:**
- Required fields are visually marked and prerequisite messaging is clear.

### Mahasiswa Laporan — `src/app/dashboard/mahasiswa/laporan/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status → line 127 → Add `role="status"`.
- Upload labels are visual-only → lines 193-195 → Bind labels to inputs.

**What's Working Well:**
- Prerequisite validation helps students understand why upload may be blocked.

### Mahasiswa Track — `src/app/dashboard/mahasiswa/track/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner is visual-only → lines 159-162 → Add accessible status text.
- Dialog field labels are not bound → lines 337, 351, 360 → Add `htmlFor`/`id`.
- Very small badge text can hurt readability → lines 288-297 → Increase text size where badges carry important status.

**What's Working Well:**
- Eligibility and warning messaging are practical for student decision-making.

### Mahasiswa Kelompok — `src/app/dashboard/mahasiswa/kelompok/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status → lines 84-87 → Add `role="status"`.
- Join-code input is placeholder-driven → around line 194 → Add a persistent label and helper text.

**What's Working Well:**
- The create/join group flow is understandable and gives students a clear next action.

### Mahasiswa Hasil — `src/app/dashboard/mahasiswa/hasil/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- Loading spinner has no accessible status → line 63 → Add `role="status"`.

**What's Working Well:**
- Status summary is simple, focused, and appropriate for students.

### Mahasiswa Revisi Sidang — `src/app/dashboard/mahasiswa/revisi-sidang/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Form labels are visual-only → lines 194, 198, 202 → Add `htmlFor`/`id`.
- Loading spinner has no accessible status → lines 115-118 → Add `role="status"`.

**What's Working Well:**
- Warning text gives useful context before uploading revision files.

### Mahasiswa Profile — `src/app/dashboard/mahasiswa/profile/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- This page duplicates the shared dashboard profile route and can diverge visually → line 1 path and page content → Consolidate profile UX or intentionally route roles to the same component.
- Labels are visual-only → lines 68-71 → Add `htmlFor`/`id`.

**What's Working Well:**
- Profile content is simple and not overloaded.

### Shared Dashboard Profile — `src/app/dashboard/profile/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Password policy requires only 6 characters → line 179 → Align with 8-character requirement from register/admin user management.
- Form labels are not consistently programmatic → lines around 140-190 → Add `htmlFor`/`id`.

**What's Working Well:**
- Shared profile approach can reduce role duplication if used consistently.

### Shared Settings — `src/app/dashboard/settings/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Password validation allows minimum 6 characters → lines 93 and 236 → Align with the stronger 8-character policy.
- Settings are shared by several roles through re-export but copy is not role-specific → re-exported by dosen/mahasiswa/koordinator/kaprodi/admin → Add neutral account-security wording.

**What's Working Well:**
- Account settings are centralized instead of being duplicated across every role.

### Dosen Dashboard — `src/app/dashboard/dosen/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status → lines 82-86 → Add `role="status"`.
- Workload chart uses static `chartData` → lines 23-26 and 150-158 → Use API data or label it as sample data.

**What's Working Well:**
- Quick actions match common lecturer workflows: validation, bimbingan approval, and laporan approval.

### Dosen Mahasiswa Bimbingan — `src/app/dashboard/dosen/mahasiswa-bimbingan/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status → line 39 → Add `role="status"`.
- Search input is placeholder-only → line 52 → Add a visible or screen-reader label.

**What's Working Well:**
- The page keeps lecturer review scope focused on supervised students.

### Dosen Bimbingan Approve — `src/app/dashboard/dosen/bimbingan-approve/page.jsx`
**Overall Rating:** 🔴 Critical Issue

**Issues Found:**
- Approve/reject buttons are small icon-only controls without accessible labels → lines 270-275 → Add `aria-label`, tooltips, and larger target size.
- Approval can be triggered without confirmation → lines 270-275 → Add confirmation for final approval/rejection actions.
- Rejection note textarea has no label binding → line 308 → Add `id`, `htmlFor`, and validation helper text.

**What's Working Well:**
- Signature QR image has useful alt text and the approval data is visually scannable.

### Dosen Laporan Approve — `src/app/dashboard/dosen/laporan-approve/page.jsx`
**Overall Rating:** 🔴 Critical Issue

**Issues Found:**
- Approve/reject buttons are small icon-only controls without accessible labels → lines 215-220 → Add labels, tooltips, and larger touch targets.
- Approval/rejection lacks a confirmation step → lines 215-220 → Use `ConfirmActionDialog`.
- Rejection textarea is unlabeled → line 242 → Add a label and helper copy.

**What's Working Well:**
- Table layout is compact and efficient for lecturers reviewing many submissions.

### Dosen Revisi Approve — `src/app/dashboard/dosen/revisi-approve/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Select and textarea labels are not bound to form controls → lines 184-198 → Add `htmlFor`/`id`.
- Review action is important but has no confirmation → around line 161 → Confirm before changing revision status.

**What's Working Well:**
- Review flow separates selecting status from entering feedback.

### Dosen Profile — `src/app/dashboard/dosen/profile/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status → lines 77-80 → Add `role="status"`.
- Labels are visual-only → lines 147, 156, 160, 164, 175 → Add `htmlFor`/`id`.

**What's Working Well:**
- Signature readiness banner is clear and appropriate for lecturer approval workflows.

### Koordinator Dashboard — `src/app/dashboard/koordinator/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Loading spinner has no accessible status → lines 75-79 → Add `role="status"`.
- Stage distribution chart uses static data → lines 20-23 and 102-110 → Replace with backend data or explicitly label as example data.

**What's Working Well:**
- Quick actions match koordinator responsibilities: proposal validation, scheduling, and period management.

### Koordinator Validasi Proposal — `src/app/dashboard/koordinator/validasi-proposal/page.jsx`
**Overall Rating:** 🔴 Critical Issue

**Issues Found:**
- Approve/reject buttons are 32px high → lines 184 and 193 → Increase touch target to 44px.
- Approval can be submitted without confirmation → lines 184-193 → Add confirmation for final proposal decisions.
- Rejection note textarea is unlabeled → line 219 → Add label binding and minimum reason guidance.

**What's Working Well:**
- Proposal cards provide useful academic context before decisions.

### Koordinator Approve Pembimbing — `src/app/dashboard/koordinator/approve-pembimbing/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Dosen select is not bound to a label → line 204 → Add `id`/`htmlFor`.
- Assignment action has no confirmation → line 219 → Confirm before assigning/changing pembimbing.

**What's Working Well:**
- The page keeps assignment decisions centered on one student/proposal at a time.

### Koordinator Jadwal Sidang — `src/app/dashboard/koordinator/jadwal-sidang/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Many labels are not programmatically associated with inputs/selects → lines 540, 581, 601, 610, 621, 677, 690 → Add `htmlFor`/`id` consistently.
- Scheduling form is long and could overload first-time coordinators → lines 540-699 → Group fields into Sidang, Ruang/Waktu, Penguji, and Catatan sections.

**What's Working Well:**
- Helper text for scheduling constraints is useful and contextual.

### Koordinator Kelola Periode — `src/app/dashboard/koordinator/kelola-periode/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Labels are visual-only → lines 401, 411, 427, 450, 465, 475, 485 → Add `htmlFor`/`id`.
- Loading spinner is visual-only → lines 266-269 → Add accessible status text.

**What's Working Well:**
- Ending a period is protected by `ConfirmActionDialog`.

### Koordinator Rekap Mahasiswa — `src/app/dashboard/koordinator/rekap-mahasiswa/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Search input is placeholder-only → line 224 → Add visible or screen-reader label.
- Loading spinner is visual-only → line 208 → Add `role="status"`.

**What's Working Well:**
- Table headings are clear and support scanning student records.

### Koordinator Revisi Monitoring — `src/app/dashboard/koordinator/revisi-monitoring/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- Loading spinner is visual-only → lines 76-79 → Add accessible status text.

**What's Working Well:**
- Empty state is clear and the page scope is easy to understand.

### Kaprodi Dashboard — `src/app/dashboard/kaprodi/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- Loading spinner is visual-only → lines 87-91 → Add `role="status"`.

**What's Working Well:**
- Dashboard uses backend-derived trend data and gives kaprodi high-level program monitoring actions.

### Kaprodi Kelola Koordinator — `src/app/dashboard/kaprodi/kelola-koordinator/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Search input is placeholder-only → lines 154-158 → Add a label.
- Semester toggle group lacks a programmatic group label → lines 203-215 → Use `role="group"` and an accessible label.
- Loading spinner is visual-only → lines 139-142 → Add `role="status"`.

**What's Working Well:**
- Unassign action is protected by confirmation.

### Kaprodi Daftar Dosen — `src/app/dashboard/kaprodi/daftar-dosen/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Search input is placeholder-only → line 54 → Add a visible or screen-reader label.
- Empty state gives no next action → line 58 → Add guidance to contact admin or check filters.

**What's Working Well:**
- The page is intentionally simple and easy to scan.

### Kaprodi Monitoring — `src/app/dashboard/kaprodi/monitoring/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Progress bars have no accessible value text → lines 71-72 → Add `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, or use the shared `Progress` primitive with labels.

**What's Working Well:**
- Monitoring is concise and suited to high-level program review.

### Admin Dashboard — `src/app/dashboard/admin/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Role distribution chart uses static data → lines 20-23 and 101-109 → Use real `stats` data.
- System information is hardcoded → lines 123-139 → Source this from the health endpoint or clearly mark it as static application metadata.
- Loading spinner has no accessible status → lines 75-79 → Add `role="status"`.

**What's Working Well:**
- Admin dashboard keeps high-level system metrics and management shortcuts visible.

### Admin Kelola Users — `src/app/dashboard/admin/kelola-users/page.jsx`
**Overall Rating:** 🔴 Critical Issue

**Issues Found:**
- `penguji` is missing from `ROLE_COLORS` → line 27 → Add `penguji` so admin can manage every allowed role.
- `roleCounts` excludes `penguji` → lines 125-132 → Include penguji count and filter visibility.
- Search input is placeholder-only → line 281 → Add a label.
- Edit/password dialog labels are not bound to fields → lines 407-482 → Add `htmlFor`/`id`.
- Activate/deactivate action has no confirmation → lines 134-147 and 362-370 → Confirm before changing account access.

**What's Working Well:**
- Delete action is protected with `ConfirmActionDialog`.
- Admin password requirement is stronger than the shared profile/settings pages.

### Admin Kelola Dosen — `src/app/dashboard/admin/kelola-dosen/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Search input is placeholder-only → line 62 → Add a label.
- Create modal labels are visual-only → lines 86-88 → Add `htmlFor`/`id`.
- Empty state lacks a direct create CTA → line 68 → Add "Tambah dosen" inside the empty state.

**What's Working Well:**
- The page has a narrow, understandable admin task scope.

### Admin Monitoring — `src/app/dashboard/admin/monitoring/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Search input is placeholder-only → line 173 → Add a label.
- Raw JSON audit details are hard to scan → line 216 → Render key/value rows or expandable structured details.

**What's Working Well:**
- Audit log parsing is separated into helper logic, making a better UI easier to add.

### Penguji Dashboard — `src/app/dashboard/penguji/page.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- Loading spinner is visual-only → lines 100-104 → Add `role="status"`.
- Empty state could include date/filter context → lines 134-138 → Add "Tidak ada sidang yang ditugaskan saat ini" with current filter/date context.

**What's Working Well:**
- Dashboard correctly scopes sidang data to the current penguji.

### Penguji Sidang — `src/app/dashboard/penguji/sidang/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Review form fields are not label-bound → lines 297, 299, 312, 313 → Add `htmlFor`/`id`.
- Loading spinner is visual-only → lines 171-174 → Add accessible status text.

**What's Working Well:**
- Penguji task flow is focused on assigned sidang and assessment actions.

### Developer Center — `src/app/dashboard/developer/developer-client.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Turnstile can show "Off/Issue" while synthetic test passes if runtime `turnstile_enabled` is false/missing → lines 188-193 and 637 → Align synthetic and health status semantics, or display "Off" as neutral when Turnstile is intentionally disabled.
- Revoke device is destructive but has no confirmation → lines 464-467 → Use `ConfirmActionDialog`.
- Clear Redis prefix is destructive but has no confirmation → lines 489-494 → Use `ConfirmActionDialog`.
- Loading spinner has no accessible status → lines 609-613 → Add `role="status"`.

**What's Working Well:**
- Auth trackers are split into page visit and auth event summaries, which matches the desired tracker model.
- System cards are compact and useful for technical users.

### Developer Wrapper Pages — `src/app/dashboard/developer/*.jsx`
**Overall Rating:** 🟢 Good

**Issues Found:**
- `page.jsx`, `health/page.jsx`, `audit-logs/page.jsx`, `auth-logs/page.jsx`, `auth-trackers/page.jsx`, `devices/page.jsx`, `redis-cache/page.jsx`, and `permission-matrix/page.jsx` are thin wrappers around `DeveloperClient` → line 3-4 in each file → Keep route wrappers thin, but ensure page metadata/title is mode-specific.

**What's Working Well:**
- Mode-based wrapper routes avoid duplicating developer UI logic.

### Support Page — `src/app/dashboard/support/page.jsx`
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- Password guidance says minimum 6 characters → line 43 → Align with the stronger 8-character policy.
- Support route is generic and not role-personalized → lines 60-224 → Add role-specific FAQ entries for mahasiswa, dosen, koordinator, and penguji.

**What's Working Well:**
- FAQ, email copy, and resource links give users multiple support paths.

### Re-Exported Role Routes — multiple files
**Overall Rating:** 🟡 Needs Improvement

**Issues Found:**
- `src/app/dashboard/penguji/revisi-approve/page.jsx`, `penguji/mahasiswa-bimbingan/page.jsx`, `penguji/laporan-approve/page.jsx`, `penguji/bimbingan-approve/page.jsx` re-export dosen pages → line 1 in each file → Review labels and empty states so penguji does not see lecturer-only assumptions.
- `src/app/dashboard/koordinator/laporan-approve/page.jsx`, `koordinator/mahasiswa-bimbingan/page.jsx`, `koordinator/bimbingan-approve/page.jsx`, `koordinator/revisi-approve/page.jsx`, `koordinator/profile/page.jsx` re-export dosen pages → line 1 in each file → Add role-aware page titles/subtitles and permission hints.
- `src/app/dashboard/kaprodi/*` re-exports many koordinator/dosen pages → line 1 in each wrapper → Add kaprodi-level framing so these pages feel like monitoring/oversight, not operational staff pages.
- `src/app/dashboard/admin/settings/page.jsx`, `dosen/settings/page.jsx`, `koordinator/settings/page.jsx`, `kaprodi/settings/page.jsx`, `mahasiswa/settings/page.jsx` re-export shared settings → line 1 → Keep shared settings, but fix shared password policy and neutral copy once.

**What's Working Well:**
- Re-exporting reduces duplicate code and keeps behavior consistent across related roles.

## Summary Table

| Page | Rating | # Issues | Priority |
|------|--------|----------|----------|
| Login | 🔴 Critical Issue | 3 | High |
| Admin Kelola Users | 🔴 Critical Issue | 5 | High |
| Dosen Bimbingan Approve | 🔴 Critical Issue | 3 | High |
| Dosen Laporan Approve | 🔴 Critical Issue | 3 | High |
| Koordinator Validasi Proposal | 🔴 Critical Issue | 3 | High |
| Register | 🟡 Needs Improvement | 4 | High |
| Forgot Password | 🟡 Needs Improvement | 4 | High |
| Dashboard Layout + Sidebar | 🟡 Needs Improvement | 8 | High |
| Developer Center | 🟡 Needs Improvement | 4 | High |
| Mahasiswa Core Pages | 🟡 Needs Improvement | 15 | Medium |
| Dosen Core Pages | 🟡 Needs Improvement | 9 | Medium |
| Koordinator Core Pages | 🟡 Needs Improvement | 13 | Medium |
| Kaprodi Core Pages | 🟡 Needs Improvement | 6 | Medium |
| Admin Core Pages | 🟡 Needs Improvement | 8 | Medium |
| Penguji Core Pages | 🟡 Needs Improvement | 4 | Medium |
| Public Legal/Resource Pages | 🟡 Needs Improvement | 6 | Low |
| Landing Page | 🟢 Good | 2 | Low |
| FAQ/Syarat/Luaran Pages | 🟢 Good | 3 | Low |

## Top 5 Critical Fixes

1. Fix production login Turnstile UX: remove developer `.env.local` copy, add retry/recovery, and announce errors accessibly.
2. Fix admin role coverage for `penguji` in `kelola-users` so admin can manage all intended roles.
3. Add accessible labels, larger touch targets, and confirmations to approval/rejection flows for dosen and koordinator.
4. Replace static dashboard charts/system metadata with real API data or label them clearly as examples.
5. Standardize password policy and form accessibility across register, forgot-password, profile, settings, and admin dialogs.

## Quick Wins

- Add `penguji` to `ROLE_COLORS` and `roleCounts` in `src/app/dashboard/admin/kelola-users/page.jsx`.
- Change login Turnstile fallback copy to user-safe production language.
- Add `aria-label` to icon-only approve/edit/send buttons.
- Add `role="status"` and visually hidden loading text to all spinner-only states.
- Bind `Label` components to inputs with `htmlFor`/`id` in modal forms.
- Link register terms/privacy text to `/syarat-layanan` and `/kebijakan-privasi`.
- Change `ResourcePageShell` back link from `/#contact` to `/`.
- Update sidebar active matching to include nested routes.
- Increase mobile icon/button hit areas to at least 44x44px.
- Add confirmations for device revoke, Redis prefix clear, proposal approval, and bimbingan/laporan approval.

## Recommendations for Role-Based UX Improvements

- **Mahasiswa:** Prioritize plain-language progress, clear prerequisites, and direct CTAs inside empty states. Students should always see "what to do next" on proposal, bimbingan, laporan, and revisi pages.
- **Dosen:** Keep tables compact, but make approval actions explicit and protected. Add decision summaries before final approval/rejection so lecturers can review context quickly.
- **Koordinator:** Group long operational forms into academic workflow sections: periode, mahasiswa/proposal, jadwal, penguji, and catatan. This reduces scheduling errors.
- **Kaprodi:** Reframe reused pages as oversight/monitoring pages. Use copy like "monitoring", "rekap", and "validasi akhir" rather than operational dosen/koordinator wording.
- **Penguji:** Keep the sidang assessment flow narrow. Avoid exposing unrelated bimbingan/dosen assumptions in re-exported pages unless penguji truly needs those capabilities.
- **Admin:** Admin can access and manage kaprodi, koordinator, dosen, mahasiswa, and penguji. The UI should show all these roles consistently in filters, counts, colors, and forms.
- **Developer:** Keep system health technical, but differentiate "disabled by configuration" from "issue". This avoids false alarms like Turnstile showing issue while synthetic tests pass.
