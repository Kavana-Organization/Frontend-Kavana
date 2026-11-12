import { MENU_CONFIG, ROLE_DASHBOARD_ROUTE } from './constants';

export const KAPRODI_KOORDINATOR_MENU_IDS = new Set([
  'separator-koordinator',
  'kelola-periode',
  'validasi-proposal',
  'approve-pembimbing',
  'daftar-mahasiswa',
  'jadwal-sidang',
]);

/**
 * Resolves the URL for a menu item given its role and menuId.
 *
 * @param {string} role - User role
 * @param {string} menuId - Menu item ID
 * @returns {string} Route URL
 */
export function getMenuHref(role, menuId) {
  if (menuId === 'dashboard') {
    return ROLE_DASHBOARD_ROUTE[role] || (role ? `/dashboard/${role}` : '/dashboard');
  }
  if (menuId === 'profile') return '/dashboard/profile';
  if (menuId === 'settings') return '/dashboard/settings';
  const rolePrefix = ROLE_DASHBOARD_ROUTE[role] || (role ? `/dashboard/${role}` : '/dashboard');
  return `${rolePrefix}/${menuId}`;
}

/**
 * Group definitions per §5.2 specification.
 * Each role defines standalone items and ordered groups.
 */
export const GROUP_DEFS = {
  mahasiswa: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'persiapan-akademik',
        label: 'Persiapan Akademik',
        ids: ['track', 'kelompok', 'proposal'],
        defaultOpen: true,
        pendingKeys: ['track', 'kelompok', 'proposal', 'upload-proposal'],
      },
      {
        id: 'bimbingan-dan-sidang',
        label: 'Bimbingan dan Sidang',
        ids: ['bimbingan', 'laporan', 'hasil', 'revisi-sidang'],
        defaultOpen: false,
        pendingKeys: [
          'bimbingan',
          'bimbingan-online',
          'laporan',
          'upload-laporan-sidang',
          'hasil',
          'nilai-hasil-akhir',
          'revisi-sidang',
        ],
      },
      {
        id: 'akun',
        label: 'Akun',
        ids: ['profile', 'settings'],
        defaultOpen: false,
        pendingKeys: [],
      },
    ],
  },
  dosen: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'bimbingan',
        label: 'Bimbingan',
        ids: ['mahasiswa-bimbingan', 'bimbingan-approve'],
        defaultOpen: true,
        pendingKeys: ['mahasiswa-bimbingan', 'bimbingan-approve'],
      },
      {
        id: 'sidang',
        label: 'Sidang',
        ids: ['laporan-approve', 'revisi-approve'],
        defaultOpen: false,
        pendingKeys: ['laporan-approve', 'revisi-approve'],
      },
      {
        id: 'akun',
        label: 'Akun',
        ids: ['profile', 'settings'],
        defaultOpen: false,
        pendingKeys: [],
      },
    ],
  },
  koordinator: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'periode-dan-proposal',
        label: 'Periode dan Proposal',
        ids: ['kelola-periode', 'validasi-proposal', 'approve-pembimbing'],
        defaultOpen: true,
        pendingKeys: ['kelola-periode', 'validasi-proposal', 'approve-pembimbing'],
      },
      {
        id: 'mahasiswa-dan-sidang',
        label: 'Mahasiswa dan Sidang',
        ids: ['daftar-mahasiswa', 'jadwal-sidang', 'revisi-monitoring'],
        defaultOpen: false,
        pendingKeys: ['daftar-mahasiswa', 'jadwal-sidang', 'revisi-monitoring'],
      },
      {
        id: 'dosen-pembimbing',
        label: 'Dosen Pembimbing',
        ids: ['mahasiswa-bimbingan', 'bimbingan-approve', 'laporan-approve', 'revisi-approve'],
        defaultOpen: false,
        pendingKeys: ['mahasiswa-bimbingan', 'bimbingan-approve', 'laporan-approve', 'revisi-approve'],
      },
      {
        id: 'akun',
        label: 'Akun',
        ids: ['profile', 'settings'],
        defaultOpen: false,
        pendingKeys: [],
      },
    ],
  },
  kaprodi: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'manajemen-prodi',
        label: 'Manajemen Prodi',
        ids: ['kelola-koordinator', 'daftar-dosen', 'monitoring', 'revisi-monitoring'],
        defaultOpen: true,
        pendingKeys: ['kelola-koordinator', 'daftar-dosen', 'monitoring', 'revisi-monitoring'],
      },
      {
        id: 'otoritas-koordinator',
        label: 'Otoritas Koordinator',
        ids: ['kelola-periode', 'validasi-proposal', 'approve-pembimbing', 'daftar-mahasiswa', 'jadwal-sidang'],
        defaultOpen: false,
        pendingKeys: ['kelola-periode', 'validasi-proposal', 'approve-pembimbing', 'daftar-mahasiswa', 'jadwal-sidang'],
      },
      {
        id: 'dosen-pembimbing',
        label: 'Dosen Pembimbing',
        ids: ['mahasiswa-bimbingan', 'bimbingan-approve', 'laporan-approve', 'revisi-approve'],
        defaultOpen: false,
        pendingKeys: ['mahasiswa-bimbingan', 'bimbingan-approve', 'laporan-approve', 'revisi-approve'],
      },
      {
        id: 'akun',
        label: 'Akun',
        ids: ['profile', 'settings'],
        defaultOpen: false,
        pendingKeys: [],
      },
    ],
  },
  penguji: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'sidang',
        label: 'Sidang',
        ids: ['sidang'],
        defaultOpen: true,
        pendingKeys: ['sidang', 'jadwal-sidang', 'hasil'],
      },
      {
        id: 'dosen-pembimbing',
        label: 'Dosen Pembimbing',
        ids: ['mahasiswa-bimbingan', 'bimbingan-approve', 'laporan-approve', 'revisi-approve'],
        defaultOpen: false,
        pendingKeys: ['mahasiswa-bimbingan', 'bimbingan-approve', 'laporan-approve', 'revisi-approve'],
      },
      {
        id: 'akun',
        label: 'Akun',
        ids: ['profile', 'settings'],
        defaultOpen: false,
        pendingKeys: [],
      },
    ],
  },
  admin: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'pengguna',
        label: 'Pengguna',
        ids: ['kelola-users', 'kelola-dosen'],
        defaultOpen: true,
        pendingKeys: ['kelola-users', 'kelola-dosen'],
      },
      {
        id: 'sistem',
        label: 'Sistem',
        ids: ['monitoring', 'settings'],
        defaultOpen: false,
        pendingKeys: ['monitoring'],
      },
    ],
  },
  developer: {
    standalone: ['dashboard'],
    groups: [
      {
        id: 'observabilitas',
        label: 'Observabilitas',
        ids: ['health', 'audit-logs', 'auth-logs', 'auth-trackers'],
        defaultOpen: true,
        pendingKeys: ['health', 'audit-logs', 'auth-logs', 'auth-trackers'],
      },
      {
        id: 'keamanan-dan-infrastruktur',
        label: 'Keamanan dan Infrastruktur',
        ids: ['devices', 'redis-cache', 'permission-matrix'],
        defaultOpen: false,
        pendingKeys: ['devices', 'redis-cache', 'permission-matrix'],
      },
      {
        id: 'sistem',
        label: 'Sistem',
        ids: ['settings'],
        defaultOpen: false,
        pendingKeys: [],
      },
    ],
  },
};

/**
 * Organizes a flat list of menu items into standalone items and collapsible groups.
 *
 * Rules:
 * 1. Separators (id starts with 'separator') and hidden items (opts.hideIds) are filtered out.
 * 2. Every output item has an `href` attached (item.href ?? getMenuHref(role, item.id)).
 * 3. Relative order of items from `items` is strictly preserved within every group.
 * 4. Empty groups (items.length === 0) are omitted entirely.
 * 5. Unmapped items fall into a trailing { id: 'lainnya', label: 'Lainnya', ... } group.
 *
 * @param {string} role - Current role
 * @param {Array<Object>} [items] - Flat menu items from MENU_CONFIG[role]
 * @param {Object} [opts] - Optional parameters
 * @param {Set<string>|Array<string>} [opts.hideIds] - IDs to filter out
 * @returns {{ standalone: Array<Object>, groups: Array<Object> }}
 */
export function groupMenu(role, items, opts = {}) {
  let rawItems = items;
  let options = opts;

  if (!Array.isArray(rawItems) && typeof rawItems === 'object' && rawItems !== null) {
    options = rawItems;
    rawItems = MENU_CONFIG[role] || [];
  } else if (rawItems === undefined) {
    rawItems = MENU_CONFIG[role] || [];
  }

  const hideIds = options?.hideIds;
  const isHidden = (id) => {
    if (!hideIds) return false;
    if (hideIds instanceof Set) return hideIds.has(id);
    if (Array.isArray(hideIds)) return hideIds.includes(id);
    if (typeof hideIds === 'object') return Boolean(hideIds[id]);
    return false;
  };

  // 1. Filter out separators and hidden items
  const filteredItems = rawItems.filter(
    (item) => typeof item?.id === 'string' && !item.id.startsWith('separator') && !isHidden(item.id)
  );

  const def = GROUP_DEFS[role] || { standalone: ['dashboard'], groups: [] };
  const standaloneIds = new Set(def.standalone || []);

  // 2. Identify standalone items and candidates for groups
  const standalone = [];
  const groupCandidates = [];

  for (const item of filteredItems) {
    const enriched = {
      ...item,
      href: item.href ?? getMenuHref(role, item.id),
    };

    if (standaloneIds.has(item.id)) {
      standalone.push(enriched);
    } else {
      groupCandidates.push(enriched);
    }
  }

  // 3. Map candidates into defined groups while preserving relative order from items
  const claimedGroupIds = new Set();
  const groups = [];

  for (const groupDef of def.groups || []) {
    const groupItemIds = new Set(groupDef.ids);
    const matchedItems = [];

    for (const item of groupCandidates) {
      if (groupItemIds.has(item.id)) {
        matchedItems.push(item);
        claimedGroupIds.add(item.id);
      }
    }

    if (matchedItems.length > 0) {
      groups.push({
        id: groupDef.id,
        label: groupDef.label,
        defaultOpen: Boolean(groupDef.defaultOpen),
        pendingKeys: groupDef.pendingKeys ? [...groupDef.pendingKeys] : [],
        items: matchedItems,
      });
    }
  }

  // 4. Any unclaimed non-separator item falls into a trailing "Lainnya" group
  const unmappedItems = groupCandidates.filter((item) => !claimedGroupIds.has(item.id));
  if (unmappedItems.length > 0) {
    groups.push({
      id: 'lainnya',
      label: 'Lainnya',
      defaultOpen: false,
      pendingKeys: [],
      items: unmappedItems,
    });
  }

  return { standalone, groups };
}
