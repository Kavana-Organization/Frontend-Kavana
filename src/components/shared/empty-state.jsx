import * as React from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-sunken)]/50 p-6 text-center',
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          className="mb-2 h-5 w-5 text-[var(--text-muted)] shrink-0"
          aria-hidden="true"
        />
      )}
      {title && (
        <h3 className="text-sm font-semibold text-[var(--text-strong)]">
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex items-center justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
