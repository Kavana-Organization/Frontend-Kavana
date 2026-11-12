const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const STATUS_TONE_PATH = path.resolve('src/lib/status-tone.js');
const STATUS_BADGE_PATH = path.resolve('src/components/shared/status-badge.jsx');
const FIELD_PATH = path.resolve('src/components/ui/field.jsx');
const EMPTY_STATE_PATH = path.resolve('src/components/shared/empty-state.jsx');
const LOADING_STATE_PATH = path.resolve('src/components/shared/loading-state.jsx');
const PAGE_HEADER_PATH = path.resolve('src/components/layout/page-header.jsx');
const PAGE_HEADER_ANIMATED_PATH = path.resolve('src/components/layout/page-header-animated.jsx');

test.describe('Task 4: Shared Components Specifications', () => {
  test.describe('1. status-tone.js contracts', () => {
    test('module exists and exports STATUS_TONE map and getStatusTone / resolveStatusTone helper', async () => {
      expect(fs.existsSync(STATUS_TONE_PATH), 'src/lib/status-tone.js must exist').toBe(true);
      const mod = await import('../../src/lib/status-tone.js');
      expect(mod.STATUS_TONE).toBeDefined();
      expect(typeof mod.STATUS_TONE).toBe('object');
      expect(typeof mod.getStatusTone).toBe('function');
    });

    test('STATUS_TONE maps all required keys correctly', async () => {
      const { STATUS_TONE, getStatusTone } = await import('../../src/lib/status-tone.js');

      const expectedMappings = {
        approved: 'success',
        disetujui: 'success',
        active: 'success',
        lulus: 'success',
        waiting: 'warning',
        pending: 'warning',
        menunggu: 'warning',
        lulus_revisi: 'warning',
        rejected: 'danger',
        ditolak: 'danger',
        revoked: 'danger',
        tidak_lulus: 'danger',
        terjadwal: 'info',
      };

      for (const [key, expectedTone] of Object.entries(expectedMappings)) {
        expect(STATUS_TONE[key], `STATUS_TONE[${key}] must be ${expectedTone}`).toBe(expectedTone);
        expect(getStatusTone(key), `getStatusTone(${key}) must resolve to ${expectedTone}`).toBe(expectedTone);
      }
    });

    test('getStatusTone normalizes input case, trims whitespace, and defaults unknown values to neutral', async () => {
      const { getStatusTone, resolveStatusTone } = await import('../../src/lib/status-tone.js');

      // Case normalization
      expect(getStatusTone('APPROVED')).toBe('success');
      expect(getStatusTone('DiSeTuJuI')).toBe('success');
      expect(getStatusTone('  menunggu  ')).toBe('warning');
      expect(getStatusTone('LULUS_REVISI')).toBe('warning');
      expect(getStatusTone('Terjadwal')).toBe('info');
      expect(getStatusTone('REJECTED')).toBe('danger');

      // Unknown keys and fallbacks
      expect(getStatusTone('unknown_status')).toBe('neutral');
      expect(getStatusTone('')).toBe('neutral');
      expect(getStatusTone(null)).toBe('neutral');
      expect(getStatusTone(undefined)).toBe('neutral');

      // resolveStatusTone alias if provided
      if (resolveStatusTone) {
        expect(resolveStatusTone('active')).toBe('success');
        expect(resolveStatusTone('invalid')).toBe('neutral');
      }
    });
  });

  test.describe('2. StatusBadge component specification', () => {
    test('status-badge.jsx exists, uses 6px radius, semantic tone colors, and Lucide icons', () => {
      expect(fs.existsSync(STATUS_BADGE_PATH), 'status-badge.jsx must exist').toBe(true);
      const content = fs.readFileSync(STATUS_BADGE_PATH, 'utf8');

      // Must import or resolve status tone
      expect(content).toMatch(/status-tone|STATUS_TONE|getStatusTone/);

      // Must use semantic Lucide icons (never color alone)
      expect(content).toMatch(/CheckCircle2/);
      expect(content).toMatch(/Clock/);
      expect(content).toMatch(/XCircle/);
      expect(content).toMatch(/Calendar|Info/);
      expect(content).toMatch(/CircleDot|MinusCircle/);

      // Radius 6px: rounded-md
      expect(content).toContain('rounded-md');

      // High-contrast semantic tokens
      expect(content).toContain('--ctp-green');
      expect(content).toMatch(/--ctp-peach|--ctp-yellow/);
      expect(content).toContain('--ctp-red');
      expect(content).toContain('--ctp-blue');
      expect(content).toMatch(/--surface-sunken|--text-muted/);

      // No banned arbitrary slop
      expect(content).not.toMatch(/rounded-\[/);
      expect(content).not.toMatch(/backdrop-blur/);
      expect(content).not.toMatch(/hover:-translate-y/);
    });
  });

  test.describe('3. Field component specification', () => {
    test('field.jsx exists, generates ids via useId, wires a11y attributes, and renders hint/error', () => {
      expect(fs.existsSync(FIELD_PATH), 'field.jsx must exist').toBe(true);
      const content = fs.readFileSync(FIELD_PATH, 'utf8');

      expect(content).toContain('useId');
      expect(content).toContain('aria-describedby');
      expect(content).toContain('aria-invalid');
      expect(content).toContain('role="alert"');
      expect(content).toContain('--text-strong');
      expect(content).toContain('--text-muted');
      expect(content).toContain('--ctp-red');
    });
  });

  test.describe('4. EmptyState component specification', () => {
    test('empty-state.jsx exists, uses compact dashed styling, and supports icon/action slots', () => {
      expect(fs.existsSync(EMPTY_STATE_PATH), 'empty-state.jsx must exist').toBe(true);
      const content = fs.readFileSync(EMPTY_STATE_PATH, 'utf8');

      expect(content).toContain('rounded-xl');
      expect(content).toContain('border-dashed');
      expect(content).toContain('--line');
      expect(content).toContain('--surface-sunken');
      expect(content).toContain('--text-strong');
      expect(content).toContain('--text-muted');

      // No banned arbitrary slop or tinted icon square
      expect(content).not.toMatch(/rounded-\[/);
      expect(content).not.toMatch(/backdrop-blur/);
    });
  });

  test.describe('5. LoadingState component specification', () => {
    test('loading-state.jsx exists, uses role=status, aria-live=polite, sr-only label, and skeletons', () => {
      expect(fs.existsSync(LOADING_STATE_PATH), 'loading-state.jsx must exist').toBe(true);
      const content = fs.readFileSync(LOADING_STATE_PATH, 'utf8');

      expect(content).toContain('role="status"');
      expect(content).toContain('aria-live="polite"');
      expect(content).toContain('sr-only');
      expect(content).toContain('animate-pulse');
      expect(content).toContain('--surface-sunken');
      expect(content).toContain('dashboard');
      expect(content).toContain('table');
      expect(content).toContain('form');
    });
  });

  test.describe('6. PageHeader and PageHeaderAnimated specification', () => {
    test('page-header.jsx has flat design, 20px title, breadcrumb support, and no Ringkasan Halaman eyebrow', () => {
      expect(fs.existsSync(PAGE_HEADER_PATH), 'page-header.jsx must exist').toBe(true);
      const content = fs.readFileSync(PAGE_HEADER_PATH, 'utf8');

      // No Ringkasan Halaman
      expect(content).not.toContain('Ringkasan Halaman');

      // Flat layout: no backdrop-blur, no shadow-[0_, no rounded-[
      expect(content).not.toContain('backdrop-blur');
      expect(content).not.toMatch(/shadow-\[0_/);
      expect(content).not.toMatch(/rounded-\[/);
      expect(content).not.toContain('font-black');

      // Preserves dashboard-title test id and uses 20px font-semibold
      expect(content).toContain('data-testid="dashboard-title"');
      expect(content).toMatch(/text-\[20px\]|text-xl/);
      expect(content).toContain('font-semibold');
      expect(content).toContain('--text-strong');
      expect(content).toContain('--line');

      // Breadcrumb support
      expect(content).toContain('breadcrumb');
    });

    test('page-header-animated.jsx is a thin alias with zero Framer Motion animations', () => {
      expect(fs.existsSync(PAGE_HEADER_ANIMATED_PATH), 'page-header-animated.jsx must exist').toBe(true);
      const content = fs.readFileSync(PAGE_HEADER_ANIMATED_PATH, 'utf8');

      expect(content).not.toContain('framer-motion');
      expect(content).not.toContain('motion.');
      expect(content).toContain('PageHeader');
    });
  });
});
