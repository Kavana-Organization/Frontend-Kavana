'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Collapsible, Popover } from 'radix-ui';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SidebarGroup component implementing PRD v1.2 §6.2 (NAV-2, NAV-3, NAV-4) & §6.7 (A11Y-2, A11Y-5):
 * - Collapsible accordion in expanded mode with 1 px left guide line and active child indicator on parent group.
 * - Radix Popover flyout in 72 px rail mode with 120 ms hover-intent AND keyboard-focusable tooltip label (A11Y-5).
 */
export function SidebarGroup({
  group,
  openIds = {},
  onToggle,
  collapsed = false,
  activeHref = '',
  badgeCount = 0,
  onItemClick,
}) {
  const isOpen = Boolean(openIds[group.id]);
  const groupHasActive = Boolean(group.items?.some((item) => item.href === activeHref));

  // Collapsed rail Popover state & hover-intent timer
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setFlyoutOpen(true);
      }, 120);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        setFlyoutOpen(false);
      }, 150);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  /* -------------------------------------------------------------
   * COLLAPSED RAIL MODE (72 px) — NAV-3 & A11Y-5
   * ------------------------------------------------------------- */
  if (collapsed) {
    const GroupIcon = group.items?.[0]?.icon;

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex justify-center py-0.5"
      >
        <Popover.Root open={flyoutOpen} onOpenChange={setFlyoutOpen}>
          <Popover.Trigger asChild>
            <button
              ref={triggerRef}
              type="button"
              data-testid={`sidebar-group-${group.id}`}
              aria-label={group.label}
              aria-expanded={flyoutOpen}
              onClick={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                setFlyoutOpen((prev) => !prev);
              }}
              className={cn(
                'peer ctp-focus relative grid h-10 w-10 place-items-center rounded-lg transition-colors',
                groupHasActive
                  ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'
              )}
            >
              {GroupIcon && <GroupIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              {groupHasActive && (
                <span
                  data-testid={`sidebar-group-active-dot-${group.id}`}
                  aria-hidden="true"
                  className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                />
              )}
              {badgeCount > 0 && (
                <span
                  data-testid={`sidebar-group-badge-${group.id}`}
                  className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--ctp-red))] px-1 text-[10px] font-bold leading-none text-white"
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          </Popover.Trigger>
          {/* Keyboard focus tooltip when flyout is closed (A11Y-5) */}
          {!flyoutOpen && (
            <div
              role="tooltip"
              data-testid={`sidebar-tooltip-${group.id}`}
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-medium text-[var(--text-strong)] opacity-0 shadow-overlay transition-opacity peer-focus-visible:opacity-100"
            >
              {group.label}
            </div>
          )}
          <Popover.Portal>
            <Popover.Content
              side="right"
              align="start"
              sideOffset={8}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onEscapeKeyDown={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                setFlyoutOpen(false);
                triggerRef.current?.focus();
              }}
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                triggerRef.current?.focus();
              }}
              className="z-50 min-w-[200px] rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-overlay outline-none"
            >
              <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span className="truncate">{group.label}</span>
                {badgeCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--ctp-red))] px-1 text-[10px] font-bold leading-none text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <div className="my-1.5 h-px bg-[var(--line)]" />
              <div className="space-y-0.5">
                {group.items?.map((item) => {
                  const isActive = item.href === activeHref;
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      data-testid={`sidebar-link-${item.id}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        setFlyoutOpen(false);
                        onItemClick?.();
                      }}
                      className={cn(
                        'ctp-focus group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                          : 'text-[var(--text-body)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'
                      )}
                    >
                      {ItemIcon && (
                        <ItemIcon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0',
                            isActive
                              ? 'text-[var(--accent)]'
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-strong)]'
                          )}
                          strokeWidth={1.75}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * EXPANDED ACCORDION MODE (264 px) — NAV-2 & NAV-4
   * ------------------------------------------------------------- */
  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={() => onToggle?.(group.id)}
      className="w-full"
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          data-testid={`sidebar-group-${group.id}`}
          data-has-active={groupHasActive ? 'true' : 'false'}
          aria-expanded={isOpen}
          aria-controls={`sidebar-group-content-${group.id}`}
          className={cn(
            'ctp-focus group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
            groupHasActive && !isOpen
              ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent)]'
              : groupHasActive
                ? 'text-[var(--accent)] hover:bg-[var(--surface-sunken)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]'
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate text-left">
            {groupHasActive && (
              <span
                data-testid={`sidebar-group-active-dot-${group.id}`}
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
              />
            )}
            <span className="truncate">{group.label}</span>
          </span>
          <div className="ml-2 flex shrink-0 items-center gap-1.5">
            {badgeCount > 0 && (
              <span
                data-testid={`sidebar-group-badge-${group.id}`}
                className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--ctp-red))] px-1 text-[10px] font-bold leading-none text-white"
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-150',
                isOpen ? 'rotate-0' : '-rotate-90'
              )}
              aria-hidden="true"
            />
          </div>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content
        id={`sidebar-group-content-${group.id}`}
        className="overflow-hidden"
      >
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--line)] pl-2.5">
          {group.items?.map((item) => {
            const isActive = item.href === activeHref;
            const ItemIcon = item.icon;
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
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-strong)]'
                    )}
                    strokeWidth={1.75}
                  />
                )}
                <span className="truncate flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
