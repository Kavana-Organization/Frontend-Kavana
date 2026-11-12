'use client';

import { useCallback, useMemo, useState, useSyncExternalStore, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Moon, Sun, User, Settings, LogOut, Maximize2, Minimize2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { DesktopSidebar, MobileSidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TITLE_MAP, ROLE_LABEL, ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import { API_BASE_URL, getToken, invalidateApiCache, notificationAPI } from '@/lib/api';
import { subscribeRealtimeUpdates, subscribeServerRealtimeUpdates, payloadTouchesPrefixes } from '@/lib/realtime';
import { removeAcademicTitles } from '@/lib/validators';
import { Button } from '@/components/ui/button';
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
  return useMemo(
    () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );
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

export function DashboardLayout({ children, allowedRoles = [] }) {
  const role = useAuthStore((s) => s.role);
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

  // Initial fetch notifikasi sekali saat role siap. Tidak ada polling berkala —
  // refresh notifikasi mengikuti event realtime yang menyentuh /api/notifications/.
  useEffect(() => {
    if (!currentRole) return;
    const timer = window.setTimeout(() => {
      loadNotificationStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentRole, loadNotificationStats]);

  // Refresh dashboard murni event-driven. Tidak ada `setInterval`.
  // Saat event realtime tiba: invalidate cache prefix yang relevan, lalu remount
  // konten halaman aktif agar `loadData()`-nya dijalankan ulang.
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
        <div className="flex min-h-screen bg-transparent">
          {/* Desktop Sidebar */}
          <DesktopSidebar role={currentRole} notificationStats={notificationStats} />

          {/* Main Content */}
          <main className="min-w-0 flex-1 pb-10">
            {/* Top Navbar */}
            <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[var(--line)] bg-[var(--surface-raised)] px-4 lg:px-6">
              {/* Left: Mobile Sheet Trigger + Breadcrumb */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">
                  <MobileSidebar role={currentRole} notificationStats={notificationStats} />
                </div>
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">{ROLE_LABEL[currentRole] || 'Dashboard'}</span>
                  <span aria-hidden="true" className="text-[var(--text-muted)]">/</span>
                  <span data-testid="dashboard-title" className="truncate font-medium text-[var(--text-strong)]">{pageTitle}</span>
                </nav>
              </div>

              {/* Right: Date (plain muted text at xl), Notifications bell (44px target), Theme toggle, User menu */}
              <div className="flex items-center gap-2">
                {isHydrated && todayDate && (
                  <span className="mr-1 hidden text-xs text-[var(--text-muted)] tabular-nums xl:block">
                    {todayDate}
                  </span>
                )}

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ctp-focus relative h-11 w-11 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] hover:bg-[var(--surface-sunken)]"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4 text-[var(--text-muted)]" />
                      {totalNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--ctp-red))] px-1 text-[10px] font-bold text-white leading-none">
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
                      aria-label="Menu pengguna"
                      className="ctp-focus h-11 gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] pl-2 pr-3 hover:bg-[var(--surface-sunken)]"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[hsl(var(--ctp-blue)/0.25)] bg-[hsl(var(--ctp-blue)/0.12)] text-xs font-bold text-[hsl(var(--ctp-blue))]">
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

            {/* Page Content */}
            <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6">
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
