'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Plus, LifeBuoy, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { MENU_CONFIG, ROLE_LABEL, ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import { kaprodiAPI } from '@/lib/api';
import { removeAcademicTitles } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const KAPRODI_KOORDINATOR_MENU_IDS = new Set([
  'separator-koordinator',
  'kelola-periode',
  'validasi-proposal',
  'approve-pembimbing',
  'daftar-mahasiswa',
  'jadwal-sidang',
]);

function parseRoles(rawRoles) {
  if (!rawRoles) return [];
  if (Array.isArray(rawRoles)) {
    return rawRoles
      .map((role) => String(role).trim().toLowerCase())
      .filter(Boolean);
  }
  return String(rawRoles)
    .split(',')
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
}

function resolveKaprodiHasKoordinatorRole(user) {
  if (!user) return null;
  if (typeof user.is_koordinator === 'boolean') return user.is_koordinator;

  const roles = parseRoles(user.roles);
  if (roles.length > 0) {
    return roles.includes('koordinator');
  }

  return null;
}

function filterMenuByRole(role, menuItems, hasKoordinatorRole) {
  if (role !== 'kaprodi' || hasKoordinatorRole) return menuItems;
  return menuItems.filter((item) => !KAPRODI_KOORDINATOR_MENU_IDS.has(item.id));
}

function getMenuHref(role, menuId) {
  if (menuId === 'dashboard') return ROLE_DASHBOARD_ROUTE[role];
  if (menuId === 'profile') return '/dashboard/profile';
  if (menuId === 'settings') return '/dashboard/settings';
  const rolePrefix = ROLE_DASHBOARD_ROUTE[role];
  return `${rolePrefix}/${menuId}`;
}

function SidebarContent({ role, collapsed, onToggle, onItemClick }) {
  const pathname = usePathname();
  const { user, logout, setUser } = useAuthStore();
  const [kaprodiRoleFromApi, setKaprodiRoleFromApi] = useState(null);
  const kaprodiRoleFromStore = resolveKaprodiHasKoordinatorRole(user);

  useEffect(() => {
    if (role !== 'kaprodi') return;

    let isMounted = true;

    const loadKaprodiProfile = async () => {
      const result = await kaprodiAPI.getProfile();
      if (!isMounted) return;

      if (result.ok && result.data) {
        setUser(result.data);
        const hasKoordinatorRole = resolveKaprodiHasKoordinatorRole(result.data);
        setKaprodiRoleFromApi(hasKoordinatorRole ?? false);
        return;
      }

      setKaprodiRoleFromApi(false);
    };

    loadKaprodiProfile();

    return () => {
      isMounted = false;
    };
  }, [role, setUser]);

  const hasKoordinatorRole =
    role !== 'kaprodi'
      ? true
      : (kaprodiRoleFromApi ?? kaprodiRoleFromStore ?? false);

  const menuItems = useMemo(
    () => filterMenuByRole(role, MENU_CONFIG[role] || [], hasKoordinatorRole),
    [role, hasKoordinatorRole]
  );
  const normalizedName = removeAcademicTitles(user?.nama || 'User');
  const displayName = normalizedName.split(',')[0]?.trim() || normalizedName;
  const roleLabel = ROLE_LABEL[role] || role;
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-full flex-col">
        {/* Brand */}
        <div className={cn("flex items-center gap-2 border-b border-[hsl(var(--ctp-surface1))] px-4 py-5", collapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[hsl(var(--ctp-blue)/0.18)] bg-[linear-gradient(135deg,hsl(var(--ctp-blue)/0.14),hsl(var(--ctp-teal)/0.12))] shadow-[0_8px_24px_-18px_hsl(var(--ctp-sapphire)/0.45)]">
              <Image
                src="/D4TI.png"
                alt="D4TI"
                width={26}
                height={26}
                className="h-[26px] w-[26px] object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <div className="leading-tight min-w-0">
                <div className="text-sm font-bold tracking-tight text-[hsl(var(--ctp-text))]">Kavana</div>
                <div className="text-[11px] text-[hsl(var(--ctp-subtext0))]">Dashboard Akademik</div>
              </div>
            )}
          </div>
          {onToggle && !collapsed && (
            <button
              onClick={onToggle}
              className="ctp-focus rounded-lg p-1.5 text-[hsl(var(--ctp-subtext0))] hover:bg-[hsl(var(--ctp-surface0))] hover:text-[hsl(var(--ctp-text))] transition-colors"
              aria-label="Collapse sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          )}
          {onToggle && collapsed && (
            <button
              onClick={onToggle}
              className="absolute -right-3 top-6 z-10 grid h-6 w-6 place-items-center rounded-full border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base))] text-[hsl(var(--ctp-subtext0))] shadow-md transition-colors hover:bg-[hsl(var(--ctp-crust))] hover:text-[hsl(var(--ctp-text))]"
              aria-label="Expand sidebar"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>

        {/* Quick Create */}
        {!collapsed && (
          <div className="border-b border-[hsl(var(--ctp-surface1))] px-4 py-4">
            <Button
              className="w-full justify-center gap-2 rounded-2xl border border-[hsl(var(--ctp-blue)/0.18)] bg-[linear-gradient(135deg,hsl(var(--ctp-blue)/0.16),hsl(var(--ctp-teal)/0.12))] text-[hsl(var(--ctp-text))] hover:bg-[linear-gradient(135deg,hsl(var(--ctp-blue)/0.22),hsl(var(--ctp-teal)/0.16))]"
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
              Akses Cepat
            </Button>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--ctp-overlay1))]">
              Menu
            </div>
          )}
          <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
            {menuItems.map((item) => {
              // Separator
              if (item.id.startsWith('separator')) {
                if (collapsed) {
                  return <div key={item.id} className="w-6 h-px bg-[hsl(var(--ctp-surface1))] my-2" />;
                }
                return (
                  <div key={item.id} className="pt-3 pb-1">
                    <div className="h-px bg-[hsl(var(--ctp-surface1))] mx-2 mb-2" />
                    <div className="px-3 text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--ctp-overlay1))]">
                      {item.label}
                    </div>
                  </div>
                );
              }

              const href = getMenuHref(role, item.id);
              const isActive = pathname === href;
              const Icon = item.icon;

              /* ---- COLLAPSED ---- */
              if (collapsed) {
                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={() => onItemClick?.()}
                    title={item.label}
                    className={cn(
                      'ctp-focus grid h-10 w-10 place-items-center rounded-2xl transition-colors',
                      isActive
                        ? 'bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-blue))] shadow-sm'
                        : 'text-[hsl(var(--ctp-subtext0))] hover:bg-[hsl(var(--ctp-crust))] hover:text-[hsl(var(--ctp-subtext1))]'
                    )}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px]" />}
                  </Link>
                );
              }

              /* ---- EXPANDED ---- */
              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={() => onItemClick?.()}
                  className={cn(
                    'ctp-focus group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-text))] font-medium shadow-sm'
                      : 'text-[hsl(var(--ctp-subtext1))] hover:bg-[hsl(var(--ctp-crust))] hover:text-[hsl(var(--ctp-text))]'
                  )}
                >
                  {Icon && (
                    <Icon className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-[hsl(var(--ctp-blue))]" : "text-[hsl(var(--ctp-overlay1))] group-hover:text-[hsl(var(--ctp-subtext1))]"
                    )} />
                  )}
                  <span className="flex-1 min-w-0 truncate text-left" title={item.label}>{item.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--ctp-blue))]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[hsl(var(--ctp-surface1))] px-3 py-4">

          {/* User info */}
          <div className={cn('mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2', collapsed && 'justify-center px-0')}>
            <span className={cn(
              "grid shrink-0 place-items-center rounded-2xl border border-[hsl(var(--ctp-blue)/0.18)] bg-[linear-gradient(135deg,hsl(var(--ctp-blue)/0.2),hsl(var(--ctp-teal)/0.16))] text-sm font-bold text-[hsl(var(--ctp-text))]",
              collapsed ? "h-10 w-10" : "h-9 w-9"
            )}>
              {initials}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--ctp-text))] truncate" title={displayName}>{displayName}</p>
                <p className="text-[10px] text-[hsl(var(--ctp-overlay1))] truncate" title={roleLabel}>{roleLabel}</p>
              </div>
            )}
          </div>

          <div className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
            {[
              { label: 'Support', icon: LifeBuoy, href: '/dashboard/support' },
              { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
            ].map((item) =>
              collapsed ? (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  className="ctp-focus grid h-10 w-10 place-items-center rounded-2xl text-[hsl(var(--ctp-subtext0))] transition-colors hover:bg-[hsl(var(--ctp-crust))] hover:text-[hsl(var(--ctp-subtext1))]"
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </Link>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="ctp-focus flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[hsl(var(--ctp-subtext0))] transition-colors hover:bg-[hsl(var(--ctp-crust))] hover:text-[hsl(var(--ctp-text))]"
                >
                  <item.icon className="h-[18px] w-[18px] text-[hsl(var(--ctp-overlay1))]" />
                  <span>{item.label}</span>
                </Link>
              )
            )}
            {collapsed ? (
              <button
                onClick={handleLogout}
                title="Logout"
                className="ctp-focus grid h-10 w-10 place-items-center rounded-2xl text-[hsl(var(--ctp-red))] transition-colors hover:bg-[hsl(var(--ctp-red)/0.10)]"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="ctp-focus flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[hsl(var(--ctp-red))] transition-colors hover:bg-[hsl(var(--ctp-red)/0.10)]"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
    </div>
  );
}

// Mobile Sidebar (Sheet)
export function MobileSidebar({ role }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl text-[hsl(var(--ctp-text))]" aria-label="Buka menu sidebar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.96)] p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent role={role} collapsed={false} onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Desktop Sidebar (collapsible)
export function DesktopSidebar({ role }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative sticky top-0 hidden h-screen flex-shrink-0 self-start border-r border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.82)] backdrop-blur-xl transition-all duration-200 lg:flex',
        collapsed ? 'w-[76px]' : 'w-[272px]'
      )}
    >
      <SidebarContent role={role} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
    </aside>
  );
}
