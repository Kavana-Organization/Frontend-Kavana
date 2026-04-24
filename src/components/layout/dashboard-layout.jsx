'use client';

import { useCallback, useMemo, useState, useSyncExternalStore, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Moon, Sun, User, Settings, LogOut, CalendarDays, Maximize2, Minimize2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { DesktopSidebar, MobileSidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TITLE_MAP, ROLE_LABEL, ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import { notificationAPI } from '@/lib/api';
import { subscribeRealtimeUpdates } from '@/lib/realtime';
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

const iconBtnCls = "ctp-focus h-10 w-10 rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.82)] shadow-[0_1px_0_hsl(0_0%_100%/0.45)_inset] transition-colors hover:bg-[hsl(var(--ctp-crust))]";
const LIVE_REFRESH_INTERVAL = 20000;
const LIVE_REFRESH_DEBOUNCE = 3500;

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

const NOTIFICATION_LABELS = {
  'mahasiswa-bimbingan': 'Bimbingan menunggu persetujuan',
  'laporan-approve': 'Laporan sidang menunggu review',
  'validasi-proposal': 'Proposal menunggu validasi',
  'approve-pembimbing': 'Mahasiswa belum di-assign pembimbing',
  proposal: 'Proposal perlu revisi',
  laporan: 'Laporan perlu revisi',
};

function getNotificationHref(role, menuId) {
  const rolePrefix = ROLE_DASHBOARD_ROUTE[role];
  if (!rolePrefix) return null;
  if (menuId === 'profile') return '/dashboard/profile';
  if (menuId === 'settings') return '/dashboard/settings';
  return `${rolePrefix}/${menuId}`;
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
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  const pageTitle = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return TITLE_MAP[lastSegment] || 'Dashboard';
  }, [pathname]);

  const loadNotificationStats = useCallback(
    async ({ silent = false } = {}) => {
      if (!currentRole) return;
      if (!silent) setIsNotificationLoading(true);
      setNotificationError('');

      const result = await notificationAPI.getStats();

      if (result.ok && result.data && typeof result.data === 'object') {
        setNotificationStats(result.data);
      } else if (!silent) {
        setNotificationError(result.error || 'Gagal memuat notifikasi');
      }

      if (!silent) setIsNotificationLoading(false);
    },
    [currentRole]
  );

  useEffect(() => {
    if (!currentRole) return;
    const initialFetch = setTimeout(() => loadNotificationStats(), 0);
    const interval = setInterval(() => loadNotificationStats({ silent: true }), 60000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [currentRole, loadNotificationStats]);

  useEffect(() => {
    if (!currentRole) return;

    let pendingRefresh = false;
    let lastRefreshAt = 0;

    const applyRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < LIVE_REFRESH_DEBOUNCE) return;
      lastRefreshAt = now;
      pendingRefresh = false;
      setRefreshVersion((prev) => prev + 1);
      loadNotificationStats({ silent: true });
    };

    const requestRefresh = () => {
      if (document.visibilityState !== 'visible') {
        pendingRefresh = true;
        return;
      }

      if (shouldDelayRealtimeRefresh()) {
        pendingRefresh = true;
        return;
      }

      applyRefresh();
    };

    const flushPendingRefresh = () => {
      if (pendingRefresh && !shouldDelayRealtimeRefresh() && document.visibilityState === 'visible') {
        applyRefresh();
      }
    };

    const unsubscribeRealtime = subscribeRealtimeUpdates(() => {
      requestRefresh();
    });

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      requestRefresh();
    }, LIVE_REFRESH_INTERVAL);

    window.addEventListener('focus', flushPendingRefresh);
    document.addEventListener('visibilitychange', flushPendingRefresh);

    return () => {
      unsubscribeRealtime();
      window.clearInterval(interval);
      window.removeEventListener('focus', flushPendingRefresh);
      document.removeEventListener('visibilitychange', flushPendingRefresh);
    };
  }, [currentRole, loadNotificationStats]);

  const notificationItems = useMemo(() => {
    return Object.entries(notificationStats)
      .map(([key, value]) => ({
        key,
        count: Number(value) || 0,
        label: NOTIFICATION_LABELS[key] || formatNotificationKey(key),
        href: getNotificationHref(currentRole, key),
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [notificationStats, currentRole]);

  const totalNotifications = useMemo(
    () => notificationItems.reduce((sum, item) => sum + item.count, 0),
    [notificationItems]
  );

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
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
          <DesktopSidebar role={currentRole} />

          {/* Main Content */}
          <main className="min-w-0 flex-1 pb-10">
            {/* Top Navbar */}
            <header className="sticky top-0 z-20 px-4 pt-4 lg:px-6 lg:pt-5">
              <div className="soft-panel rounded-[30px] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  {/* Mobile hamburger */}
                  <div className="lg:hidden">
                    <MobileSidebar role={currentRole} />
                  </div>

                  {/* Page title + date */}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-subtext0))]">
                      {ROLE_LABEL[currentRole] || 'Dashboard'}
                    </div>
                    <div className="truncate text-lg font-black tracking-tight text-[hsl(var(--ctp-text))]">{pageTitle}</div>
                    <div className="hidden text-sm text-[hsl(var(--ctp-subtext0))] md:block">
                      Fokus pada pekerjaan yang masih menunggu tindak lanjut hari ini.
                    </div>
                  </div>

                  {/* Date (desktop) */}
                  {isHydrated && todayDate && (
                    <div className="mr-1 hidden items-center gap-2 rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.72)] px-3 py-2 text-xs text-[hsl(var(--ctp-subtext0))] xl:flex">
                      <CalendarDays className="h-3.5 w-3.5 text-[hsl(var(--ctp-blue))]" />
                      {todayDate}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Theme toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={iconBtnCls}
                          onClick={() => setTheme(nextTheme)}
                          aria-label="Toggle theme"
                        >
                          <ThemeIcon className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)] text-[hsl(var(--ctp-text))]">
                        <p className="text-xs">Tema: {themeLabel}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Fullscreen */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`${iconBtnCls} hidden md:inline-flex`}
                          onClick={toggleFullscreen}
                          aria-label="Toggle fullscreen"
                        >
                          {isFull
                            ? <Minimize2 className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />
                            : <Maximize2 className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />
                          }
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-2xl border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)] text-[hsl(var(--ctp-text))]">
                        <p className="text-xs">{isFull ? 'Exit Fullscreen' : 'Fullscreen'}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Notifications */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`${iconBtnCls} relative`}
                          aria-label="Notifications"
                        >
                          <Bell className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />
                          {totalNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[hsl(var(--ctp-red))] text-[10px] font-bold text-white leading-4 text-center">
                              {totalNotifications > 99 ? '99+' : totalNotifications}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-80 rounded-[24px] border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)] p-1 shadow-[0_24px_50px_-34px_hsl(var(--ctp-sapphire)/0.38)] backdrop-blur-xl"
                      >
                        <DropdownMenuLabel className="px-3 py-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Notifikasi</span>
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">{totalNotifications} belum selesai</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[hsl(var(--ctp-overlay0)/0.25)]" />

                        {isNotificationLoading ? (
                          <div className="px-3 py-4 text-sm text-[hsl(var(--ctp-subtext0))]">Memuat notifikasi...</div>
                        ) : null}

                        {!isNotificationLoading && notificationItems.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada notifikasi baru.</div>
                        ) : null}

                        {!isNotificationLoading && notificationItems.map((item) => (
                          <DropdownMenuItem
                            key={item.key}
                            className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface0)/0.50)] cursor-pointer"
                            onClick={() => item.href && router.push(item.href)}
                          >
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="line-clamp-2">{item.label}</span>
                              <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md bg-[hsl(var(--ctp-red)/0.15)] text-[hsl(var(--ctp-red))] text-xs font-semibold">
                                {item.count}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}

                        {notificationError ? (
                          <>
                            <DropdownMenuSeparator className="bg-[hsl(var(--ctp-overlay0)/0.25)]" />
                            <div className="px-3 py-2 text-xs text-[hsl(var(--ctp-red))]">{notificationError}</div>
                          </>
                        ) : null}

                        <DropdownMenuSeparator className="bg-[hsl(var(--ctp-overlay0)/0.25)]" />
                        <DropdownMenuItem
                          className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--ctp-subtext1))] focus:bg-[hsl(var(--ctp-surface0)/0.50)] cursor-pointer"
                          onClick={() => loadNotificationStats()}
                        >
                          Muat ulang notifikasi
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="ctp-focus h-10 gap-2 rounded-2xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.82)] pl-1.5 pr-2 shadow-[0_1px_0_hsl(0_0%_100%/0.45)_inset] hover:bg-[hsl(var(--ctp-crust))]"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[hsl(var(--ctp-lavender)/0.25)] border border-[hsl(var(--ctp-lavender)/0.40)] text-[10px] font-bold text-[hsl(var(--ctp-text))]">
                            {initials}
                          </span>
                          <span className="hidden sm:inline text-sm text-[hsl(var(--ctp-text))] font-medium">{displayName.split(' ')[0]}</span>
                          <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--ctp-overlay1))]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-[24px] border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)] p-1 shadow-[0_24px_50px_-34px_hsl(var(--ctp-sapphire)/0.38)] backdrop-blur-xl">
                        <DropdownMenuLabel className="px-3 py-2">
                          <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{displayName}</p>
                          <p className="text-xs text-[hsl(var(--ctp-subtext0))]">{ROLE_LABEL[currentRole] || 'User'}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[hsl(var(--ctp-overlay0)/0.25)]" />
                        <DropdownMenuItem
                          className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface0)/0.50)] cursor-pointer gap-2"
                          onClick={() => router.push('/dashboard/profile')}
                        >
                          <User className="h-4 w-4 text-[hsl(var(--ctp-subtext0))]" /> Profil Saya
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--ctp-text))] focus:bg-[hsl(var(--ctp-surface0)/0.50)] cursor-pointer gap-2"
                          onClick={() => router.push('/dashboard/settings')}
                        >
                          <Settings className="h-4 w-4 text-[hsl(var(--ctp-subtext0))]" /> Pengaturan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[hsl(var(--ctp-overlay0)/0.25)]" />
                        <DropdownMenuItem
                          className="rounded-lg px-3 py-2 text-sm text-[hsl(var(--ctp-red))] focus:bg-[hsl(var(--ctp-red)/0.12)] cursor-pointer gap-2"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" /> Keluar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="px-4 pt-5 lg:px-6">
              <div key={`${pathname}:${refreshVersion}`}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </AuthGuard>
  );
}
