import * as React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Info,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATUS_TONE,
  getStatusTone,
  DEFAULT_STATUS_LABELS,
} from '@/lib/status-tone';

const TONE_STYLES = {
  success:
    'border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))] dark:border-[hsl(var(--ctp-green)/0.3)] dark:bg-[hsl(var(--ctp-green)/0.15)] dark:text-[hsl(var(--ctp-green))]',
  warning:
    'border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] text-[hsl(var(--ctp-peach))] dark:border-[hsl(var(--ctp-peach)/0.3)] dark:bg-[hsl(var(--ctp-peach)/0.15)] dark:text-[hsl(var(--ctp-peach))]',
  danger:
    'border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))] dark:border-[hsl(var(--ctp-red)/0.3)] dark:bg-[hsl(var(--ctp-red)/0.15)] dark:text-[hsl(var(--ctp-red))]',
  info:
    'border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))] dark:border-[hsl(var(--ctp-blue)/0.3)] dark:bg-[hsl(var(--ctp-blue)/0.15)] dark:text-[hsl(var(--ctp-blue))]',
  neutral:
    'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--text-muted)]',
};

function renderToneIcon(tone, normalizedStatus, CustomIcon) {
  if (CustomIcon) {
    return <CustomIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }
  switch (tone) {
    case 'success':
      return (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      );
    case 'warning':
      return <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    case 'danger':
      return <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    case 'info':
      return normalizedStatus === 'terjadwal' ? (
        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      );
    case 'neutral':
    default:
      return <CircleDot className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }
}

export function StatusBadge({
  status,
  label,
  icon: CustomIcon,
  className,
  ...props
}) {
  const normalized = String(status ?? '').trim().toLowerCase();
  const tone = STATUS_TONE[status] ?? getStatusTone(status);
  const text = label ?? DEFAULT_STATUS_LABELS[normalized] ?? status ?? '';

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium w-fit shrink-0 select-none',
        TONE_STYLES[tone] ?? TONE_STYLES.neutral,
        className
      )}
      {...props}
    >
      {renderToneIcon(tone, normalized, CustomIcon)}
      <span>{text}</span>
    </span>
  );
}

export default StatusBadge;
