import * as React from 'react';
import { cn } from '@/lib/utils';

export function LoadingState({
  label = 'Memuat data',
  variant = 'dashboard',
  className,
  ...props
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="loading-state"
      data-variant={variant}
      className={cn('w-full', className)}
      {...props}
    >
      <span className="sr-only">{label}</span>

      {variant === 'table' && (
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--surface-sunken)]" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-lg bg-[var(--surface-sunken)]"
              />
            ))}
          </div>
        </div>
      )}

      {variant === 'form' && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-sunken)]" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-[var(--surface-sunken)]" />
            </div>
          ))}
          <div className="h-10 w-28 animate-pulse rounded-lg bg-[var(--surface-sunken)] pt-2" />
        </div>
      )}

      {(variant === 'dashboard' ||
        (variant !== 'table' && variant !== 'form')) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 w-full animate-pulse rounded-lg bg-[var(--surface-sunken)]"
              />
            ))}
          </div>
          <div className="h-64 w-full animate-pulse rounded-lg bg-[var(--surface-sunken)]" />
        </div>
      )}
    </div>
  );
}

export default LoadingState;
