'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  hint,
  error,
  required,
  id: idProp,
  className,
  children,
}) {
  const generatedId = React.useId();
  const id = idProp || generatedId;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const a11y = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': Boolean(error) || undefined,
  };

  let controlNode = null;
  if (typeof children === 'function') {
    controlNode = children(a11y);
  } else if (React.isValidElement(children)) {
    controlNode = React.cloneElement(children, {
      id: children.props.id ?? a11y.id,
      'aria-describedby':
        children.props['aria-describedby'] ?? a11y['aria-describedby'],
      'aria-invalid': children.props['aria-invalid'] ?? a11y['aria-invalid'],
    });
  } else {
    controlNode = children;
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--text-strong)]"
        >
          {label}
          {required && (
            <span
              className="ml-1 text-[hsl(var(--ctp-red))]"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      {controlNode}

      {hint && (
        <p id={hintId} className="text-xs text-[var(--text-muted)]">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[hsl(var(--ctp-red))]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default Field;
