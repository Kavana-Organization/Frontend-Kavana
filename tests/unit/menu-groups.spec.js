const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const MENU_GROUPS_PATH = path.resolve('src/lib/menu-groups.js');

test.describe('Task 6: Menu Grouping Module Specifications', () => {
  test('module exists and exports GROUP_DEFS, groupMenu, KAPRODI_KOORDINATOR_MENU_IDS, getMenuHref', async () => {
    expect(fs.existsSync(MENU_GROUPS_PATH), 'src/lib/menu-groups.js must exist').toBe(true);
    const mod = await import('../../src/lib/menu-groups.js');
    expect(mod.GROUP_DEFS).toBeDefined();
    expect(typeof mod.GROUP_DEFS).toBe('object');
    expect(typeof mod.groupMenu).toBe('function');
    expect(mod.KAPRODI_KOORDINATOR_MENU_IDS).toBeDefined();
    expect(mod.KAPRODI_KOORDINATOR_MENU_IDS instanceof Set).toBe(true);
    expect(typeof mod.getMenuHref).toBe('function');
  });

  test('getMenuHref generates expected URLs according to role routing conventions', async () => {
    const { getMenuHref } = await import('../../src/lib/menu-groups.js');

    expect(getMenuHref('mahasiswa', 'dashboard')).toBe('/dashboard/mahasiswa');
    expect(getMenuHref('dosen', 'dashboard')).toBe('/dashboard/dosen');
    expect(getMenuHref('koordinator', 'dashboard')).toBe('/dashboard/koordinator');
    expect(getMenuHref('kaprodi', 'dashboard')).toBe('/dashboard/kaprodi');
    expect(getMenuHref('penguji', 'dashboard')).toBe('/dashboard/penguji');
    expect(getMenuHref('admin', 'dashboard')).toBe('/dashboard/admin');
    expect(getMenuHref('developer', 'dashboard')).toBe('/dashboard/developer');

    // Global profile and settings routes
    expect(getMenuHref('mahasiswa', 'profile')).toBe('/dashboard/profile');
    expect(getMenuHref('dosen', 'profile')).toBe('/dashboard/profile');
    expect(getMenuHref('mahasiswa', 'settings')).toBe('/dashboard/settings');
    expect(getMenuHref('developer', 'settings')).toBe('/dashboard/settings');

    // Sub-routes under role prefix
    expect(getMenuHref('mahasiswa', 'track')).toBe('/dashboard/mahasiswa/track');
    expect(getMenuHref('dosen', 'bimbingan-approve')).toBe('/dashboard/dosen/bimbingan-approve');
    expect(getMenuHref('koordinator', 'kelola-periode')).toBe('/dashboard/koordinator/kelola-periode');
    expect(getMenuHref('kaprodi', 'manajemen-prodi')).toBe('/dashboard/kaprodi/manajemen-prodi');
  });

  test('GROUP_DEFS defines §5.2 specification for all seven roles with defaultOpen and pendingKeys', async () => {
    const { GROUP_DEFS } = await import('../../src/lib/menu-groups.js');
    const roles = ['mahasiswa', 'dosen', 'penguji', 'koordinator', 'kaprodi', 'admin', 'developer'];

    for (const role of roles) {
      expect(GROUP_DEFS[role], `GROUP_DEFS must define role: ${role}`).toBeDefined();
      expect(Array.isArray(GROUP_DEFS[role].standalone)).toBe(true);
      expect(GROUP_DEFS[role].standalone).toContain('dashboard');
      expect(Array.isArray(GROUP_DEFS[role].groups)).toBe(true);
      expect(GROUP_DEFS[role].groups.length).toBeGreaterThan(0);

      for (const group of GROUP_DEFS[role].groups) {
        expect(typeof group.id).toBe('string');
        expect(typeof group.label).toBe('string');
        expect(Array.isArray(group.ids)).toBe(true);
        expect(group.ids.length).toBeGreaterThan(0);
        expect(typeof group.defaultOpen).toBe('boolean');
        expect(Array.isArray(group.pendingKeys)).toBe(true);
      }
    }

    // Verify first group defaultOpen is true and subsequent groups are false
    for (const role of roles) {
      const groups = GROUP_DEFS[role].groups;
      expect(groups[0].defaultOpen, `First group of ${role} (${groups[0].id}) should have defaultOpen = true`).toBe(true);
      for (let i = 1; i < groups.length; i++) {
        expect(groups[i].defaultOpen, `Subsequent group of ${role} (${groups[i].id}) should have defaultOpen = false`).toBe(false);
      }
    }
  });

  test('Assertion (a): For every role, flattened output hrefs equal MENU_CONFIG minus separator entries with relative order preserved within groups', async () => {
    const { groupMenu, getMenuHref } = await import('../../src/lib/menu-groups.js');
    const { MENU_CONFIG } = await import('../../src/lib/constants.js');

    const roles = Object.keys(MENU_CONFIG);

    for (const role of roles) {
      const items = MENU_CONFIG[role];
      const nonSeparatorItems = items.filter((item) => !item.id.startsWith('separator'));
      const expectedHrefs = nonSeparatorItems.map((item) => item.href ?? getMenuHref(role, item.id));

      const { standalone, groups } = groupMenu(role, items);
      const flattenedItems = [...standalone, ...groups.flatMap((g) => g.items)];
      const flattenedHrefs = flattenedItems.map((item) => item.href);

      // (1) Same count
      expect(flattenedHrefs.length, `Role ${role} href count mismatch`).toBe(expectedHrefs.length);

      // (2) Same set of hrefs
      expect(new Set(flattenedHrefs), `Role ${role} href set mismatch`).toEqual(new Set(expectedHrefs));

      // (3) Relative order from MENU_CONFIG[role] preserved within every group
      for (const group of groups) {
        const originalIndices = group.items.map((item) => items.findIndex((orig) => orig.id === item.id));
        for (let i = 1; i < originalIndices.length; i++) {
          expect(
            originalIndices[i],
            `Group ${group.id} in role ${role} did not preserve relative order: item ${group.items[i].id} came after ${group.items[i - 1].id}`
          ).toBeGreaterThan(originalIndices[i - 1]);
        }
      }

      // (4) Deterministic across repeated calls
      const repeat1 = groupMenu(role, items);
      const repeat2 = groupMenu(role, items);
      const hrefs1 = [...repeat1.standalone, ...repeat1.groups.flatMap((g) => g.items)].map((i) => i.href);
      const hrefs2 = [...repeat2.standalone, ...repeat2.groups.flatMap((g) => g.items)].map((i) => i.href);
      expect(hrefs1).toEqual(flattenedHrefs);
      expect(hrefs2).toEqual(flattenedHrefs);
    }
  });

  test('Assertion (b): No group in groups is ever empty (group.items.length > 0)', async () => {
    const { groupMenu, KAPRODI_KOORDINATOR_MENU_IDS } = await import('../../src/lib/menu-groups.js');
    const { MENU_CONFIG } = await import('../../src/lib/constants.js');

    // Test with standard configs
    for (const [role, items] of Object.entries(MENU_CONFIG)) {
      const { groups } = groupMenu(role, items);
      for (const group of groups) {
        expect(group.items.length, `Group ${group.id} in role ${role} is empty`).toBeGreaterThan(0);
      }
    }

    // Test with hideIds filtering out an entire group
    const { groups: kaprodiFilteredGroups } = groupMenu('kaprodi', MENU_CONFIG.kaprodi, {
      hideIds: KAPRODI_KOORDINATOR_MENU_IDS,
    });
    for (const group of kaprodiFilteredGroups) {
      expect(group.items.length, `Kaprodi filtered group ${group.id} is empty`).toBeGreaterThan(0);
    }

    // Test with synthetic hideIds filtering out all items in mahasiswa persiapan-akademik
    const { groups: mhsFilteredGroups } = groupMenu('mahasiswa', MENU_CONFIG.mahasiswa, {
      hideIds: new Set(['track', 'kelompok', 'proposal']),
    });
    const persiapanGroup = mhsFilteredGroups.find((g) => g.id === 'persiapan-akademik');
    expect(persiapanGroup, 'persiapan-akademik must be omitted when all its items are hidden').toBeUndefined();
    for (const group of mhsFilteredGroups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  test('Assertion (c): No id falls into "Lainnya" for standard MENU_CONFIG, and unmapped synthetic items DO fall into "Lainnya"', async () => {
    const { groupMenu } = await import('../../src/lib/menu-groups.js');
    const { MENU_CONFIG } = await import('../../src/lib/constants.js');

    // Every standard role must have 0 items falling into "Lainnya"
    for (const [role, items] of Object.entries(MENU_CONFIG)) {
      const { groups } = groupMenu(role, items);
      const lainnyaGroup = groups.find((g) => g.id === 'lainnya' || g.label === 'Lainnya');
      expect(lainnyaGroup, `Role ${role} unexpectedly produced a "Lainnya" group`).toBeUndefined();
    }

    // Synthetic unmapped item must fall into trailing "Lainnya" group
    const syntheticItems = [
      ...MENU_CONFIG.mahasiswa,
      { id: 'custom-unmapped-feature', label: 'Fitur Tak Terpetakan' },
    ];
    const { groups: syntheticGroups } = groupMenu('mahasiswa', syntheticItems);
    const lainnyaGroup = syntheticGroups.find((g) => g.id === 'lainnya' || g.label === 'Lainnya');

    expect(lainnyaGroup, 'Unmapped item should create a trailing "Lainnya" group').toBeDefined();
    expect(lainnyaGroup.id).toBe('lainnya');
    expect(lainnyaGroup.label).toBe('Lainnya');
    expect(lainnyaGroup.defaultOpen).toBe(false);
    expect(lainnyaGroup.items.length).toBe(1);
    expect(lainnyaGroup.items[0].id).toBe('custom-unmapped-feature');
    expect(lainnyaGroup.items[0].href).toBe('/dashboard/mahasiswa/custom-unmapped-feature');
    expect(syntheticGroups[syntheticGroups.length - 1].id, '"Lainnya" must be the trailing group').toBe('lainnya');
  });

  test('Assertion (d): For Kaprodi with hideIds = KAPRODI_KOORDINATOR_MENU_IDS, "Otoritas Koordinator" is completely absent', async () => {
    const { groupMenu, KAPRODI_KOORDINATOR_MENU_IDS } = await import('../../src/lib/menu-groups.js');
    const { MENU_CONFIG } = await import('../../src/lib/constants.js');

    // With hideIds = KAPRODI_KOORDINATOR_MENU_IDS
    const filteredResult = groupMenu('kaprodi', MENU_CONFIG.kaprodi, {
      hideIds: KAPRODI_KOORDINATOR_MENU_IDS,
    });

    const otoritasGroup = filteredResult.groups.find(
      (g) => g.id === 'otoritas-koordinator' || g.label === 'Otoritas Koordinator'
    );
    expect(otoritasGroup, '"Otoritas Koordinator" group must be absent when koordinator role is not assigned').toBeUndefined();

    // Verify revisi-monitoring is preserved in manajemen-prodi (Pre-flight Ruling 4)
    const manajemenProdiGroup = filteredResult.groups.find((g) => g.id === 'manajemen-prodi');
    expect(manajemenProdiGroup).toBeDefined();
    expect(manajemenProdiGroup.items.map((i) => i.id)).toContain('revisi-monitoring');

    // Without hideIds, "Otoritas Koordinator" IS present with all 5 items
    const unfilteredResult = groupMenu('kaprodi', MENU_CONFIG.kaprodi);
    const unfilteredOtoritasGroup = unfilteredResult.groups.find(
      (g) => g.id === 'otoritas-koordinator' || g.label === 'Otoritas Koordinator'
    );
    expect(unfilteredOtoritasGroup, '"Otoritas Koordinator" must be present when not hidden').toBeDefined();
    expect(unfilteredOtoritasGroup.items.length).toBe(5);
    expect(unfilteredOtoritasGroup.items.map((i) => i.id)).toEqual([
      'kelola-periode',
      'validasi-proposal',
      'approve-pembimbing',
      'daftar-mahasiswa',
      'jadwal-sidang',
    ]);
  });

  test('Assertion (e): separator* entries never appear in standalone or any group items', async () => {
    const { groupMenu } = await import('../../src/lib/menu-groups.js');
    const { MENU_CONFIG } = await import('../../src/lib/constants.js');

    for (const [role, items] of Object.entries(MENU_CONFIG)) {
      const { standalone, groups } = groupMenu(role, items);

      for (const item of standalone) {
        expect(item.id.startsWith('separator'), `Standalone item ${item.id} in ${role} is a separator`).toBe(false);
      }

      for (const group of groups) {
        for (const item of group.items) {
          expect(item.id.startsWith('separator'), `Group item ${item.id} in group ${group.id} (${role}) is a separator`).toBe(false);
        }
      }
    }
  });

  test('groupMenu attaches defaultOpen and pendingKeys metadata on all group objects', async () => {
    const { groupMenu } = await import('../../src/lib/menu-groups.js');
    const { MENU_CONFIG } = await import('../../src/lib/constants.js');

    for (const [role, items] of Object.entries(MENU_CONFIG)) {
      const { groups } = groupMenu(role, items);
      for (const group of groups) {
        expect(group).toHaveProperty('id');
        expect(group).toHaveProperty('label');
        expect(group).toHaveProperty('defaultOpen');
        expect(typeof group.defaultOpen).toBe('boolean');
        expect(group).toHaveProperty('pendingKeys');
        expect(Array.isArray(group.pendingKeys)).toBe(true);
        expect(group).toHaveProperty('items');
        expect(Array.isArray(group.items)).toBe(true);
      }
    }
  });
});
