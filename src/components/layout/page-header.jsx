import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  children,
  className,
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 pb-4 border-b border-[var(--line)] sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]"
          >
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <React.Fragment key={item.href || index}>
                  {index > 0 && (
                    <span
                      className="text-[var(--text-muted)]/50"
                      aria-hidden="true"
                    >
                      /
                    </span>
                  )}
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-[var(--text-strong)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? 'font-medium text-[var(--text-strong)]'
                          : undefined
                      }
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        <h1
          data-testid="dashboard-title"
          className="text-[20px] font-semibold leading-[1.2] text-[var(--text-strong)]"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 sm:gap-3">
          {children}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
