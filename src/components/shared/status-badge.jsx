import * as React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Info,
  CircleDot,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATUS_TONE,
  getStatusTone,
  DEFAULT_STATUS_LABELS,
} from '@/lib/status-tone';

const TONE_STYLES = {
  success: 'status-stamp--success',
  warning: 'status-stamp--warning',
  danger: 'status-stamp--danger',
  info: 'status-stamp--info',
  neutral: 'status-stamp--neutral',
};

const REVISI_STATUS_KEYS = new Set(['revisi', 'needs_revision', 'lulus_revisi']);

function renderToneIcon(tone, normalizedStatus, resolvedLabel, CustomIcon) {
  if (CustomIcon) {
    return <CustomIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }
  const normalizedLabel = String(resolvedLabel || '').trim().toLowerCase();
  if (REVISI_STATUS_KEYS.has(normalizedStatus) || normalizedLabel.includes('revisi')) {
    return <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
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
        'status-stamp',
        TONE_STYLES[tone] ?? TONE_STYLES.neutral,
        className
      )}
      {...props}
    >
      {renderToneIcon(tone, normalized, text, CustomIcon)}
      <span>{text}</span>
    </span>
  );
}

export default StatusBadge;
