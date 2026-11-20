'use client';

import { useCallback, useMemo, useState, useSyncExternalStore, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Maximize2,
  Minimize2,
  Search,
  ArrowRight,
  Shield,
  LifeBuoy,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { DesktopSidebar, MobileSidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MENU_CONFIG, TITLE_MAP, ROLE_LABEL, ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import { getMenuHref, KAPRODI_KOORDINATOR_MENU_IDS } from '@/lib/menu-groups';
import { formatAcademicDate } from '@/lib/status-tone';
import { API_BASE_URL, getToken, invalidateApiCache, notificationAPI } from '@/lib/api';
import { subscribeRealtimeUpdates, subscribeServerRealtimeUpdates, payloadTouchesPrefixes } from '@/lib/realtime';
import { removeAcademicTitles } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function useTheme() {
  const resolveTheme = useCallback((value) => {
    if (value === 'dark' || value === 'light') return value;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return resolveTheme(localStorage.getItem('kavana-theme'));
  });

  const applyTheme = useCallback((t, animate = true) => {
    const root = document.documentElement;
    if (animate) {
      root.classList.add('theme-transition');
      setTimeout(() => root.classList.remove('theme-transition'), 400);
    }
    root.classList.remove('light', 'dark');
    root.classList.add(t === 'dark' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    applyTheme(theme, false);
  }, [theme, applyTheme]);

  const setTheme = (t) => {
    const nextTheme = t === 'dark' ? 'dark' : 'light';
    setThemeState(nextTheme);
    localStorage.setItem('kavana-theme', nextTheme);
  };

  return { theme, setTheme };
}

function useFullscreen() {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const handler = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return { isFull, toggle };
}

function useFormattedDate() {
  return useMemo(() => `${formatAcademicDate(new Date())} · WIB`, []);
}

const LIVE_REFRESH_DEBOUNCE = 250;
const NOTIFICATION_PREFIXES = ['/api/notifications'];

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

const NOTIFICATION_LABELS = {
  'mahasiswa-bimbingan': 'Bimbingan menunggu persetujuan',
  'bimbingan-approve': 'Bimbingan menunggu persetujuan',
  'laporan-approve': 'Laporan sidang menunggu review',
  'validasi-proposal': 'Proposal menunggu validasi',
  'approve-pembimbing': 'Mahasiswa belum di-assign pembimbing',
  'upload-proposal': 'Proposal perlu revisi',
  proposal: 'Proposal perlu revisi',
  'upload-laporan-sidang': 'Laporan sidang perlu revisi',
  laporan: 'Laporan sidang perlu revisi',
  'bimbingan-online': 'Update bimbingan online',
  bimbingan: 'Update bimbingan online',
  'nilai-hasil-akhir': 'Update sidang/hasil akhir',
  hasil: 'Update sidang/hasil akhir',
  'revisi-sidang': 'Revisi sidang perlu tindak lanjut',
  'revisi-approve': 'Revisi sidang menunggu review',
  'jadwal-sidang': 'Jadwal sidang aktif',
  'kelola-users': 'User perlu perhatian admin',
};

const NOTIFICATION_ROUTE_OVERRIDES = {
  mahasiswa: {
    'upload-proposal': 'proposal',
    'upload-laporan-sidang': 'laporan',
    'bimbingan-online': 'bimbingan',
    'nilai-hasil-akhir': 'hasil',
    'proyek-internship': 'track',
  },
  dosen: {
    'mahasiswa-bimbingan': 'bimbingan-approve',
  },
  penguji: {
    'mahasiswa-bimbingan': 'bimbingan-approve',
    'jadwal-sidang': 'sidang',
    hasil: 'sidang',
  },
  koordinator: {
    'mahasiswa-bimbingan': 'bimbingan-approve',
  },
  kaprodi: {
    'mahasiswa-bimbingan': 'bimbingan-approve',
  },
  admin: {
    'validasi-proposal': 'monitoring',
    'laporan-approve': 'monitoring',
    'jadwal-sidang': 'monitoring',
  },
};

function getNotificationHref(role, menuId) {
  const rolePrefix = ROLE_DASHBOARD_ROUTE[role];
  if (!rolePrefix) return null;
  const resolvedMenuId = NOTIFICATION_ROUTE_OVERRIDES[role]?.[menuId] || menuId;
  if (resolvedMenuId === 'profile') return '/dashboard/profile';
  if (resolvedMenuId === 'settings') return '/dashboard/settings';
  return `${rolePrefix}/${resolvedMenuId}`;
}

function formatNotificationKey(key) {
  return key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function shouldDelayRealtimeRefresh() {
  if (typeof document === 'undefined') return false;

  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName;
  return (
    activeElement.isContentEditable
    || tagName === 'INPUT'
    || tagName === 'TEXTAREA'
    || tagName === 'SELECT'
  );
}

function resolveAvailableRoles(currentRole, storeRoles, user) {
  const set = new Set();
  if (currentRole) set.add(String(currentRole).toLowerCase());
  if (Array.isArray(storeRoles)) {
    storeRoles.forEach((r) => {
      if (r && ROLE_DASHBOARD_ROUTE[String(r).toLowerCase()]) {
        set.add(String(r).toLowerCase());
      }
    });
  }
  if (Array.isArray(user?.roles)) {
    user.roles.forEach((r) => {
      if (r && ROLE_DASHBOARD_ROUTE[String(r).toLowerCase()]) {
        set.add(String(r).toLowerCase());
      }
    });
  } else if (typeof user?.roles === 'string') {
    user.roles.split(',').forEach((r) => {
      const clean = r.trim().toLowerCase();
      if (clean && ROLE_DASHBOARD_ROUTE[clean]) set.add(clean);
    });
  }
  if (user?.is_koordinator && set.has('kaprodi')) {
    set.add('koordinator');
  }
  return Array.from(set);
}

export function DashboardLayout({ children, allowedRoles = [] }) {
  const role = useAuthStore((s) => s.role);
  const storeRoles = useAuthStore((s) => s.roles);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currentRole = role || null;
  const pathname = usePathname();
  const router = useRouter();
  const displayName = removeAcademicTitles(user?.nama || 'User');
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const { theme, setTheme } = useTheme();
  const { isFull, toggle: toggleFullscreen } = useFullscreen();
  const todayDate = useFormattedDate();
  const isHydrated = useIsHydrated();
  const [notificationStats, setNotificationStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Quick search (Ctrl/Cmd+K) state — NAV-8
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableRoles = useMemo(
    () => resolveAvailableRoles(currentRole, storeRoles, user),
    [currentRole, storeRoles, user]
  );

  // Build searchable menu & page index for current role — NAV-8
  const searchableItems = useMemo(() => {
    if (!currentRole) return [];
    const hideKoordinatorOnKaprodi =
      currentRole === 'kaprodi' && user?.is_koordinator === false;
    const rawMenu = (MENU_CONFIG[currentRole] || []).filter(
      (item) =>
        item?.id &&
        !item.id.startsWith('separator') &&
        !(hideKoordinatorOnKaprodi && KAPRODI_KOORDINATOR_MENU_IDS.has(item.id))
    );
    const items = rawMenu.map((item) => ({
      id: item.id,
      label: item.label,
      href: getMenuHref(currentRole, item.id),
      icon: item.icon,
      category: ROLE_LABEL[currentRole] || 'Menu',
    }));
    if (!items.some((i) => i.href === '/dashboard/support')) {
      items.push({
        id: 'support',
        label: 'Pusat Bantuan & FAQ',
        href: '/dashboard/support',
        icon: LifeBuoy,
        category: 'Bantuan',
      });
    }
    return items;
  }, [currentRole, user?.is_koordinator]);

  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchableItems;
    return searchableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchableItems, searchQuery]);

  // Ctrl+K / Cmd+K shortcut listener — NAV-8
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRoleSwitch = (nextRole) => {
    if (!nextRole || nextRole === currentRole) return;
    try {
      sessionStorage.setItem('userRole', nextRole);
    } catch {
      // ignore storage errors
    }
    useAuthStore.setState({ role: nextRole });
    const targetHref = ROLE_DASHBOARD_ROUTE[nextRole] || `/dashboard/${nextRole}`;
    router.push(targetHref);
  };

  const pageTitle = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === currentRole || lastSegment === 'dashboard') {
      return TITLE_MAP.dashboard || 'Ringkasan Kegiatan';
    }
    return TITLE_MAP[lastSegment] || 'Dashboard';
  }, [pathname, currentRole]);

  const loadNotificationStats = useCallback(
    async ({ silent = false } = {}) => {
      if (!currentRole) return;
      if (!silent) setIsNotificationLoading(true);
      setNotificationError('');

      const result = await notificationAPI.getStats();
      const listResult = await notificationAPI.getAll?.({ limit: 8, unread: true });

      if (result.ok && result.data && typeof result.data === 'object') {
        setNotificationStats(result.data);
      } else if (!silent) {
        setNotificationError(result.error || 'Gagal memuat notifikasi');
      }
      if (listResult?.ok) {
        const rows = Array.isArray(listResult.data?.data) ? listResult.data.data : [];
        setNotifications(rows);
      }

      if (!silent) setIsNotificationLoading(false);
    },
    [currentRole]
  );

  useEffect(() => {
    if (!currentRole) return;
    const timer = window.setTimeout(() => {
      loadNotificationStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentRole, loadNotificationStats]);

  useEffect(() => {
    if (!currentRole) return;

    let pendingPayload = null;
    let lastRefreshAt = 0;

    const applyRefresh = (payload) => {
      const now = Date.now();
      if (now - lastRefreshAt < LIVE_REFRESH_DEBOUNCE) {
        pendingPayload = payload;
        return;
      }
      lastRefreshAt = now;
      pendingPayload = null;

      const prefixes = Array.isArray(payload?.prefixes) && payload.prefixes.length > 0
        ? payload.prefixes
        : null;
      if (prefixes) {
        invalidateApiCache(prefixes, { broadcast: false });
      }
      setRefreshVersion((prev) => prev + 1);

      if (!prefixes || payloadTouchesPrefixes(payload, NOTIFICATION_PREFIXES)) {
        loadNotificationStats({ silent: true });
      }
    };

    const requestRefresh = (payload) => {
      if (document.visibilityState !== 'visible' || shouldDelayRealtimeRefresh()) {
        pendingPayload = payload;
        return;
      }
      applyRefresh(payload);
    };

    const flushPending = () => {
      if (
        pendingPayload
        && !shouldDelayRealtimeRefresh()
        && document.visibilityState === 'visible'
      ) {
        applyRefresh(pendingPayload);
      }
    };

    const unsubscribe = subscribeRealtimeUpdates((payload) => {
      requestRefresh(payload || {});
    });
    const unsubscribeServer = subscribeServerRealtimeUpdates({
      baseUrl: API_BASE_URL,
      token: getToken(),
      onEvent: (payload) => requestRefresh(payload || {}),
    });

    window.addEventListener('focus', flushPending);
    document.addEventListener('visibilitychange', flushPending);

    return () => {
      unsubscribe();
      unsubscribeServer();
      window.removeEventListener('focus', flushPending);
      document.removeEventListener('visibilitychange', flushPending);
    };
  }, [currentRole, loadNotificationStats]);

  const notificationItems = useMemo(() => {
    const detailedItems = notifications.map((item) => ({
      key: `notification:${item.id}`,
      id: item.id,
      count: 1,
      label: item.title || NOTIFICATION_LABELS[item.action_key] || formatNotificationKey(item.type || 'notifikasi'),
      description: item.message || '',
      href: item.action_url || getNotificationHref(currentRole, item.action_key),
      isPersistent: true,
    }));

    const persistentActionKeys = new Set(notifications.map((item) => item.action_key).filter(Boolean));
    const statsItems = Object.entries(notificationStats)
      .map(([key, value]) => ({
        key,
        count: Number(value) || 0,
        label: NOTIFICATION_LABELS[key] || formatNotificationKey(key),
        href: getNotificationHref(currentRole, key),
      }))
      .filter((item) => !persistentActionKeys.has(item.key))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    return [...detailedItems, ...statsItems];
  }, [notificationStats, notifications, currentRole]);

  const totalNotifications = useMemo(
    () => notificationItems.reduce((sum, item) => sum + item.count, 0),
    [notificationItems]
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleNotificationClick = async (item) => {
    if (item.isPersistent && item.id) {
      await notificationAPI.markRead?.(item.id);
      setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));
      loadNotificationStats({ silent: true });
    }
    if (item.href) router.push(item.href);
  };

  const handleMarkAllNotificationsRead = async () => {
    await notificationAPI.markAllRead?.();
    setNotifications([]);
    loadNotificationStats({ silent: true });
  };

  const displayedTheme = isHydrated ? theme : 'light';
  const ThemeIcon = displayedTheme === 'dark' ? Moon : Sun;
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const themeLabel = displayedTheme === 'dark' ? 'Dark' : 'Light';

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <TooltipProvider delayDuration={300}>
        <div className="flex min-h-screen min-h-[100dvh] bg-transparent">
          {/* Desktop Sidebar (264px expanded / 72px collapsed) */}
          <DesktopSidebar role={currentRole} notificationStats={notificationStats} />

          {/* Main Content */}
          <main className="min-w-0 flex-1 pb-10">
            {/* Sticky 56px Top Header (NAV-8 & §6.6) */}
            <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[var(--line)] bg-[var(--surface-raised)] px-4 lg:px-6">
              {/* Left: Mobile Sheet Trigger + Breadcrumb */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">
                  <MobileSidebar role={currentRole} notificationStats={notificationStats} />
                </div>
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="truncate text-[var(--text-muted)]">{ROLE_LABEL[currentRole] || 'Dashboard'}</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">/</span>
                  <span data-testid="dashboard-title" className="truncate font-medium text-[var(--text-strong)]">{pageTitle}</span>
                </nav>
              </div>

              {/* Right: Quick Search (Ctrl+K), Role Switcher (if multi-role), Date, Notifications, Theme, User menu */}
              <div className="flex items-center gap-2">
                {isHydrated && todayDate && (
                  <span className="mr-1 hidden text-xs text-[var(--text-muted)] font-mono tabular-nums xl:block">
                    {todayDate}
                  </span>
                )}

                {/* Quick Search Trigger (Ctrl/Cmd+K) — NAV-8 */}
                <Button
                  type="button"
                  variant="ghost"
                  data-testid="quick-search-trigger"
                  aria-label="Cari menu atau halaman (Ctrl+K)"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(true);
                  }}
                  className="ctp-focus h-11 gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-2.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-strong)]"
                >
                  <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">Cari menu...</span>
                  <kbd className="hidden rounded border border-[var(--line)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] md:inline-block">
                    Ctrl+K
                  </kbd>
                </Button>

                {/* Multi-Role Switcher — NAV-7 */}
                {availableRoles.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        data-testid="role-switcher"
                        aria-label="Ganti peran aktif"
                        className="ctp-focus h-11 gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-2.5 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface-sunken)]"
                      >
                        <Shield className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                        <span className="hidden sm:inline">{ROLE_LABEL[currentRole] || currentRole}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-1 shadow-overlay"
                    >
                      <DropdownMenuLabel className="px-3 py-1.5 text-xs text-[var(--text-muted)]">
                        Peran Tersedia
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[var(--line)]" />
                      {availableRoles.map((r) => (
                        <DropdownMenuItem
                          key={r}
                          data-testid={`role-switch-item-${r}`}
                          onClick={() => handleRoleSwitch(r)}
                          className="cursor-pointer justify-between rounded-lg px-3 py-2 text-sm text-[var(--text-strong)]"
                        >
                          <span>{ROLE_LABEL[r] || r}</span>
                          {r === currentRole && (
                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Notifications"
                      className="ctp-focus relative h-11 w-11 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:bg-[var(--surface-sunken)]"
                    >
                      <Bell className="h-4 w-4 text-[var(--text-muted)]" />
                      {totalNotifications > 0 && (
                        <span aria-hidden="true" className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--ctp-red))] px-1 text-[10px] font-bold text-white leading-none">
                          {totalNotifications > 99 ? '99+' : totalNotifications}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-1 shadow-overlay"
                  >
                    <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-semibold text-[var(--text-strong)]">Notifikasi</span>
                      <span className="text-xs text-[var(--text-muted)]">{totalNotifications} belum selesai</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--line)]" />

                    {isNotificationLoading ? (
                      <div role="status" aria-live="polite" className="px-3 py-4 text-sm text-[var(--text-muted)]">Memuat notifikasi...</div>
                    ) : null}

                    {!isNotificationLoading && notificationItems.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-[var(--text-muted)]">Tidak ada notifikasi baru.</div>
                    ) : null}

                    {!isNotificationLoading && notificationItems.map((item) => (
                      <DropdownMenuItem
                        key={item.key}
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--text-strong)] focus:bg-[hsl(var(--ctp-surface0)/0.50)]"
                        onClick={() => handleNotificationClick(item)}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block line-clamp-1">{item.label}</span>
                            {item.description ? (
                              <span className="mt-0.5 block line-clamp-2 text-xs text-[var(--text-muted)]">{item.description}</span>
                            ) : null}
                          </span>
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-[hsl(var(--ctp-red)/0.15)] px-1.5 text-xs font-semibold text-[hsl(var(--ctp-red))]">
                            {item.count}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}

                    {notificationError ? (
                      <>
                        <DropdownMenuSeparator className="bg-[var(--line)]" />
                        <div role="alert" aria-live="polite" className="px-3 py-2 text-xs text-[hsl(var(--ctp-red))]">{notificationError}</div>
                      </>
                    ) : null}

                    <DropdownMenuSeparator className="bg-[var(--line)]" />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] focus:bg-[hsl(var(--ctp-surface0)/0.50)]"
                      onClick={() => loadNotificationStats()}
                    >
                      Muat ulang notifikasi
                    </DropdownMenuItem>
                    {notifications.length > 0 ? (
                      <DropdownMenuItem
                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] focus:bg-[hsl(var(--ctp-surface0)/0.50)]"
                        onClick={handleMarkAllNotificationsRead}
                      >
                        Tandai semua dibaca
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Theme toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ctp-focus h-11 w-11 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:bg-[var(--surface-sunken)]"
                      onClick={() => setTheme(nextTheme)}
                      aria-label="Toggle theme"
                    >
                      <ThemeIcon className="h-4 w-4 text-[var(--text-muted)]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)] shadow-overlay">
                    <p className="text-xs">Tema: {themeLabel}</p>
                  </TooltipContent>
                </Tooltip>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="ctp-focus h-11 gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] pl-2 pr-3 hover:bg-[var(--surface-sunken)]"
                    >
                      <span className="sr-only">Menu pengguna: </span>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[hsl(var(--ctp-blue)/0.25)] bg-[hsl(var(--ctp-blue)/0.12)] text-xs font-bold text-blue-800 dark:text-blue-200">
                        {initials}
                      </span>
                      <span className="hidden text-sm font-medium text-[var(--text-strong)] sm:inline">{displayName.split(' ')[0]}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-1 shadow-overlay">
                    <DropdownMenuLabel className="px-3 py-2">
                      <p className="text-sm font-semibold text-[var(--text-strong)]">{displayName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{ROLE_LABEL[currentRole] || 'User'}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--line)]" />
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-strong)] focus:bg-[hsl(var(--ctp-surface0)/0.50)]"
                      onClick={() => router.push('/dashboard/profile')}
                    >
                      <User className="h-4 w-4 text-[var(--text-muted)]" /> Profil Saya
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-strong)] focus:bg-[hsl(var(--ctp-surface0)/0.50)]"
                      onClick={() => router.push('/dashboard/settings')}
                    >
                      <Settings className="h-4 w-4 text-[var(--text-muted)]" /> Pengaturan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-strong)] focus:bg-[hsl(var(--ctp-surface0)/0.50)]"
                      onClick={toggleFullscreen}
                    >
                      {isFull ? (
                        <>
                          <Minimize2 className="h-4 w-4 text-[var(--text-muted)]" /> Keluar Layar Penuh
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4 text-[var(--text-muted)]" /> Layar Penuh
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--line)]" />
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--ctp-red))] focus:bg-[hsl(var(--ctp-red)/0.12)]"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Quick Search Modal (Ctrl/Cmd+K) — NAV-8 */}
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogContent
                data-testid="quick-search-dialog"
                className="max-w-md border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-strong)]"
              >
                <DialogHeader>
                  <DialogTitle>Navigasi Cepat</DialogTitle>
                  <DialogDescription className="text-[var(--text-muted)]">
                    Cari dan buka halaman pada ruang kerja {ROLE_LABEL[currentRole] || 'Anda'}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Field label="Cari menu atau halaman">
                    {(a11y) => (
                      <Input
                        {...a11y}
                        name="quickSearch"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ketik nama menu, mis. Bimbingan, Sidang, Profil..."
                        className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                      />
                    )}
                  </Field>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)]/50">
                    {filteredSearchItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                        Tidak ada menu yang cocok dengan pencarian Anda.
                      </p>
                    ) : (
                      filteredSearchItems.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={`${item.id}-${item.href}`}
                            type="button"
                            data-testid={`quick-search-item-${item.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              router.push(item.href);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm text-[var(--text-strong)] transition-colors hover:bg-[var(--surface-raised)]"
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              {ItemIcon && (
                                <ItemIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                              )}
                              <span className="truncate font-medium">{item.label}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Page Content — 24px desktop, 16px mobile padding (§6.6) */}
            <div className="mx-auto max-w-[1280px] p-4 lg:p-6">
              <div key={`${pathname}:${refreshVersion}`} className="space-y-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </AuthGuard>
  );
}
