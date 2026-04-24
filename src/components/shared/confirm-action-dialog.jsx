'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardDialog } from '@/components/shared/dashboard-dialog';

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title = 'Konfirmasi Aksi',
  description = 'Tindakan ini akan mengubah data dan tidak dapat dibatalkan.',
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  onConfirm,
  loading = false,
  tone = 'danger',
}) {
  const toneClass = tone === 'warning'
    ? 'border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] text-[hsl(var(--ctp-peach))]'
    : 'border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))]';

  const actionClass = tone === 'warning'
    ? 'bg-[hsl(var(--ctp-peach)/0.20)] hover:bg-[hsl(var(--ctp-peach)/0.30)] border-[hsl(var(--ctp-peach)/0.35)]'
    : 'bg-[hsl(var(--ctp-red)/0.20)] hover:bg-[hsl(var(--ctp-red)/0.30)] border-[hsl(var(--ctp-red)/0.35)]';

  return (
    <DashboardDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) onOpenChange(nextOpen);
      }}
      title={title}
      description={description}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${toneClass}`}>
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[hsl(var(--ctp-text))]">{title}</h3>
          <p className="text-sm text-[hsl(var(--ctp-subtext0))]">{description}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-2xl border text-[hsl(var(--ctp-text))] ${actionClass}`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </Button>
        </div>
      </div>
    </DashboardDialog>
  );
}
