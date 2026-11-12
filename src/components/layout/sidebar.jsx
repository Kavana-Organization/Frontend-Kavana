'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LifeBuoy, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { MENU_CONFIG, ROLE_LABEL, ROLE_DASHBOARD_ROUTE } from '@/lib/constants';
import { groupMenu, KAPRODI_KOORDINATOR_MENU_IDS } from '@/lib/menu-groups';
import { kaprodiAPI } from '@/lib/api';
import { removeAcademicTitles } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarGroup } from '@/components/layout/sidebar-group';

const ROLE_BADGE_STYLE = {
  mahasiswa: 'border-[hsl(var(--ctp-blue)/0.25)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))]',
  dosen: 'border-[hsl(var(--ctp-green)/0.25)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]',
  koordinator: 'border-[hsl(var(--ctp-teal)/0.25)] bg-[hsl(var(--ctp-teal)/0.12)] text-[hsl(var(--ctp-teal))]',
  kaprodi: 'border-[hsl(var(--ctp-mauve)/0.25)] bg-[hsl(var(--ctp-mauve)/0.12)] text-[hsl(var(--ctp-mauve))]',
  penguji: 'border-[hsl(var(--ctp-peach)/0.25)] bg-[hsl(var(--ctp-peach)/0.12)] text-[hsl(var(--ctp-peach))]',
  admin: 'border-[hsl(var(--ctp-red)/0.25)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))]',
  developer: 'border-[hsl(var(--ctp-mauve)/0.25)] bg-[hsl(var(--ctp-mauve)/0.12)] text-[hsl(var(--ctp-mauve))]',
};

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

/**
 * Longest-prefix active href matching per §5.1:
 * - Standalone dashboard root matches pathname === href exactly.
 * - All other items match pathname === item.href || pathname.startsWith(item.href + '/').
 * - Longest matching href wins.
 */
function resolveActiveHref(role, pathname, standaloneItems = [], groups = []) {
  if (!pathname) return '';

  const dashboardHref = ROLE_DASHBOARD_ROUTE[role] || (role ? `/dashboard/${role}` : '/dashboard');
  if (pathname === dashboardHref) {
    return dashboardHref;
  }

  let bestMatch = '';
  const evaluate = (item) => {
    if (!item?.href || item.href === dashboardHref) return;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > bestMatch.length) {
        bestMatch = item.href;
      }
    }
  };

  for (const item of standaloneItems) {
    evaluate(item);
  }
  for (const group of groups) {
    for (const item of group.items || []) {
      evaluate(item);
    }
  }

  return bestMatch;
}

function findGroupIdByHref(groups, targetHref) {
  if (!targetHref) return null;
  for (const group of groups) {
    if (group.items?.some((item) => item.href === targetHref)) {
      return group.id;
    }
  }
  return null;
}

function computeDefaultOpenIds(groups = [], activeGroupId = null) {
  const initial = {};
  for (const group of groups) {
    initial[group.id] = Boolean(group.defaultOpen) || (activeGroupId === group.id);
  }
  return initial;
}

/**
 * Manages multi-open group state and localStorage persistence.
 * Safe against blocked/failing storage without throwing.
 */
export function useSidebarGroups(role, groups = [], activeHref = '') {
  const activeGroupId = useMemo(
    () => findGroupIdByHref(groups, activeHref),
    [groups, activeHref]
  );

  const [openIds, setOpenIds] = useState(() =>
    computeDefaultOpenIds(groups, activeGroupId)
  );

  // When role or groups become available, initialize/sync state
  useEffect(() => {
    if (!role || !groups || groups.length === 0) return;

    let stored = null;
    try {
      const storageKey = `kavana-sidebar-groups:${role}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          stored = parsed;
        }
      }
    } catch {
      // Storage blocked or quota exceeded: ignore
    }

    setOpenIds((prev) => {
      const next = {};
      for (const group of groups) {
        if (stored && typeof stored[group.id] === 'boolean') {
          next[group.id] = stored[group.id];
        } else if (typeof prev[group.id] === 'boolean') {
          next[group.id] = prev[group.id];
        } else {
          next[group.id] = Boolean(group.defaultOpen);
        }
      }
      if (activeGroupId && next[activeGroupId] !== undefined) {
        next[activeGroupId] = true;
      }
      return next;
    });
  }, [role, groups, activeGroupId]);

  // When active group changes (navigation), auto-open it without closing others
  useEffect(() => {
    if (!activeGroupId) return;

    setOpenIds((prev) => {
      if (prev[activeGroupId] === true) return prev;
      const next = { ...prev, [activeGroupId]: true };
      try {
        localStorage.setItem(`kavana-sidebar-groups:${role}`, JSON.stringify(next));
      } catch {
        // Storage blocked or quota exceeded
      }
      return next;
    });
  }, [role, activeGroupId]);

  const handleToggle = useCallback(
    (groupId) => {
      setOpenIds((prev) => {
        const next = {
          ...prev,
          [groupId]: !prev[groupId],
        };
        try {
          localStorage.setItem(`kavana-sidebar-groups:${role}`, JSON.stringify(next));
        } catch {
          // Storage blocked or quota exceeded
        }
        return next;
      });
    },
    [role]
  );

  return { openIds, onToggle: handleToggle };
}

export function SidebarContent({
  role,
  collapsed = false,
  onToggle,
  onItemClick,
  notificationStats = {},
}) {
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

  const menuStructure = useMemo(() => {
    const hideIds =
      role === 'kaprodi' && !hasKoordinatorRole
        ? KAPRODI_KOORDINATOR_MENU_IDS
        : undefined;
    return groupMenu(role, MENU_CONFIG[role] || [], { hideIds });
  }, [role, hasKoordinatorRole]);

  const activeHref = useMemo(
    () =>
      resolveActiveHref(
        role,
        pathname,
        menuStructure.standalone,
        menuStructure.groups
      ),
    [role, pathname, menuStructure]
  );

  const { openIds, onToggle: handleGroupToggle } = useSidebarGroups(
    role,
    menuStructure.groups,
    activeHref
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

  /**
   * Keyboard navigation per §5.1:
   * ArrowDown/ArrowUp moves between visible interactive elements.
   * Home/End jump to first/last.
   */
  const handleNavKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;

    const nav = e.currentTarget;
    const elements = Array.from(
      nav.querySelectorAll('a[href], button[data-testid^="sidebar-group-"]')
    ).filter((el) => {
      return el.offsetParent !== null && !el.disabled && el.getAttribute('aria-hidden') !== 'true';
    });

    if (elements.length === 0) return;

    const currentIndex = elements.indexOf(document.activeElement);
    let nextIndex = 0;

    if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = elements.length - 1;
    } else if (e.key === 'ArrowDown') {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % elements.length;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex === -1 ? elements.length - 1 : (currentIndex - 1 + elements.length) % elements.length;
    }

    e.preventDefault();
    elements[nextIndex]?.focus();
  };

  const getGroupBadgeCount = (group) => {
    if (!group.pendingKeys || !notificationStats) return 0;
    return group.pendingKeys.reduce(
      (sum, key) => sum + (Number(notificationStats[key]) || 0),
      0
    );
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-[var(--line)] px-3 py-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)]">
            <Image
              src="/D4TI.png"
              alt="D4TI"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              priority
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold tracking-tight text-[var(--text-strong)]">
                Kavana
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                Dashboard Akademik
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items with §5.1 Keyboard Traversal */}
      <nav
        onKeyDown={handleNavKeyDown}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-3"
      >
        {/* Primary Standalone Item (e.g. Dashboard) */}
        <div className="space-y-0.5">
          {menuStructure.standalone.map((item) => {
            const isActive = item.href === activeHref;
            const Icon = item.icon;

            if (collapsed) {
              return (
                <div key={item.id} className="flex justify-center py-0.5">
                  <Link
                    href={item.href}
                    data-testid={`sidebar-link-${item.id}`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => onItemClick?.()}
                    className={cn(
                      'ctp-focus grid h-10 w-10 place-items-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'
                    )}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                data-testid={`sidebar-link-${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onItemClick?.()}
                className={cn(
                  'ctp-focus group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                    : 'text-[var(--text-body)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-strong)]'
                    )}
                    strokeWidth={1.75}
                  />
                )}
                <span className="truncate flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Groups Divider */}
        {menuStructure.groups.length > 0 && (
          <div className={cn('my-2 h-px bg-[var(--line)]', collapsed && 'mx-1')} />
        )}

        {/* Collapsible Groups */}
        <div className="space-y-1">
          {menuStructure.groups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              openIds={openIds}
              onToggle={handleGroupToggle}
              collapsed={collapsed}
              activeHref={activeHref}
              badgeCount={getGroupBadgeCount(group)}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </nav>

      {/* Footer: User Identity, Support, Logout, Collapse Toggle (§5.1) */}
      <div className="border-t border-[var(--line)] px-2.5 py-3 space-y-2">
        {/* User Identity Block */}
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-1.5 py-1',
            collapsed && 'justify-center px-0'
          )}
        >
          <span
            className={cn(
              'grid shrink-0 place-items-center rounded-lg border text-xs font-semibold',
              ROLE_BADGE_STYLE[role] || ROLE_BADGE_STYLE.mahasiswa,
              collapsed ? 'h-9 w-9' : 'h-8 w-8'
            )}
          >
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p
                className="truncate text-xs font-semibold text-[var(--text-strong)]"
                title={displayName}
              >
                {displayName}
              </p>
              <p
                className="truncate text-[11px] text-[var(--text-muted)]"
                title={roleLabel}
              >
                {roleLabel}
              </p>
            </div>
          )}
        </div>

        {/* Action Links & Buttons */}
        <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center')}>
          {/* Support Link */}
          {collapsed ? (
            <Link
              href="/dashboard/support"
              data-testid="sidebar-link-support"
              title="Support"
              aria-label="Support"
              onClick={() => onItemClick?.()}
              className="ctp-focus grid h-10 w-10 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            >
              <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
          ) : (
            <Link
              href="/dashboard/support"
              data-testid="sidebar-link-support"
              onClick={() => onItemClick?.()}
              className="ctp-focus flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-body)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
            >
              <LifeBuoy className="h-[18px] w-[18px] text-[var(--text-muted)]" strokeWidth={1.75} />
              <span>Support</span>
            </Link>
          )}

          {/* Logout Button */}
          {collapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              data-testid="sidebar-logout"
              title="Logout"
              aria-label="Logout"
              className="ctp-focus grid h-10 w-10 place-items-center rounded-lg text-[hsl(var(--ctp-red))] transition-colors hover:bg-[hsl(var(--ctp-red)/0.12)]"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              data-testid="sidebar-logout"
              className="ctp-focus flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--ctp-red))] transition-colors hover:bg-[hsl(var(--ctp-red)/0.12)]"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span>Logout</span>
            </button>
          )}

          {/* Collapse Toggle with >= 44 px hit area */}
          {onToggle && (
            collapsed ? (
              <button
                type="button"
                onClick={onToggle}
                data-testid="sidebar-collapse-toggle"
                aria-label="Perluas sidebar"
                className="ctp-focus grid h-11 w-11 place-items-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
              >
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                data-testid="sidebar-collapse-toggle"
                aria-label="Ciutkan sidebar"
                className="ctp-focus flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
              >
                <ChevronLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                <span>Ciutkan sidebar</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Sidebar (Sheet - 288 px / w-72)
export function MobileSidebar({ role, notificationStats = {} }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-lg text-[var(--text-strong)] h-10 w-10"
          aria-label="Buka menu sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-r border-[var(--line)] bg-[var(--surface-raised)] p-0"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent
          role={role}
          collapsed={false}
          onItemClick={() => setOpen(false)}
          notificationStats={notificationStats}
        />
      </SheetContent>
    </Sheet>
  );
}

// Desktop Sidebar (collapsible - w-16 / w-[272px])
export function DesktopSidebar({ role, notificationStats = {} }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative sticky top-0 hidden h-screen flex-shrink-0 self-start border-r border-[var(--line)] bg-[var(--surface-raised)] transition-all duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-[272px]'
      )}
    >
      <SidebarContent
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        notificationStats={notificationStats}
      />
    </aside>
  );
}
