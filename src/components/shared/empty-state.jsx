import * as React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Terjadi kendala saat mengambil data dari server. Silakan coba lagi.',
  onRetry,
  retryLabel = 'Coba Lagi',
  className,
  ...props
}) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.06)] p-6 text-center',
        className
      )}
      {...props}
    >
      <AlertTriangle
        className="mb-2 h-5 w-5 text-[hsl(var(--ctp-red))] shrink-0"
        aria-hidden="true"
      />
      <h3 className="text-sm font-semibold text-[var(--text-strong)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">{description}</p>
      )}
      {onRetry && (
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{retryLabel}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export function ForbiddenState({
  title = 'Akses Tidak Diizinkan',
  description = 'Akun Anda tidak memiliki izin untuk mengakses halaman atau fitur ini.',
  action,
  className,
  ...props
}) {
  return (
    <div
      role="alert"
      data-slot="forbidden-state"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.06)] p-6 text-center',
        className
      )}
      {...props}
    >
      <ShieldAlert
        className="mb-2 h-5 w-5 text-[hsl(var(--ctp-peach))] shrink-0"
        aria-hidden="true"
      />
      <h3 className="text-sm font-semibold text-[var(--text-strong)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">{description}</p>
      )}
      {action && <div className="mt-4 flex items-center justify-center">{action}</div>}
    </div>
  );
}

export default EmptyState;
