'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * FormShell: kerangka formulir dengan label di atas field, ringkasan galat di
 * atas, dan tombol aksi yang menempel di bawah pada ponsel (docs/DESIGN.md §8).
 */
export function FormShell({
  title,
  description,
  children,
  submitLabel = 'Simpan',
  submitVariant = 'default',
  onSubmit,
  onCancel,
  cancelLabel = 'Batal',
  submitting = false,
  error,
  footerNote,
  className,
}) {
  const errorId = React.useId();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting) return;
    onSubmit?.(event);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        'flex flex-col rounded-lg border border-[var(--line)] bg-[var(--surface-raised)]',
        className
      )}
    >
      {(title || description) && (
        <div className="border-b border-[var(--line)] px-4 py-3">
          {title && (
            <h2 className="text-[15px] font-semibold text-[var(--text-strong)]">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}

      {error && (
        <div
          id={errorId}
          role="alert"
          className="mx-4 mt-4 flex items-start gap-2 rounded-md border border-[hsl(var(--ctp-red)/0.45)] bg-[hsl(var(--ctp-red)/0.08)] px-3 py-2 text-[13px] text-[hsl(var(--ctp-red))]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 py-4">{children}</div>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3 sm:static">
        <span className="text-[12px] text-[var(--text-muted)]">{footerNote}</span>
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" variant={submitVariant} disabled={submitting}>
            {submitting ? 'Menyimpan...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Field: label di atas, teks bantuan di bawah label, galat di bawah field. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}) {
  const errorId = React.useId();

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium text-[var(--text-strong)]"
        >
          {label}
          {required && (
            <span className="ml-1 text-[var(--mark-strong)]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {hint && (
        <p className="text-[12px] text-[var(--text-muted)]" id={`${errorId}-hint`}>
          {hint}
        </p>
      )}
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id: children.props.id ?? htmlFor,
            'aria-describedby': error ? errorId : hint ? `${errorId}-hint` : undefined,
            'aria-invalid': error ? true : undefined,
          })
        : children}
      {error && (
        <p id={errorId} className="text-[12px] font-medium text-[hsl(var(--ctp-red))]">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormShell;
