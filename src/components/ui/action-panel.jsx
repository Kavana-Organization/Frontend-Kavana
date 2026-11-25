import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ActionPanel: daftar hal yang menunggu keputusan pengguna pada halaman perannya.
 * Batas 5 item supaya tetap terbaca sekilas (docs/UIUX_RESEARCH.md T-2).
 */
export function ActionPanel({
  title = 'Perlu tindakan Anda',
  items = [],
  limit = 5,
  emptyText = 'Tidak ada yang menunggu keputusan Anda saat ini.',
  footer,
  className,
}) {
  const visibleItems = items.slice(0, limit);
  const remaining = items.length - visibleItems.length;

  return (
    <section
      aria-labelledby="action-panel-title"
      className={cn(
        'flex flex-col rounded-lg border border-[var(--line)] bg-[var(--surface-raised)]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-1 rounded-full bg-[var(--mark)]"
          />
          <h2
            id="action-panel-title"
            className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[var(--text-strong)]"
          >
            {title}
          </h2>
        </div>
        <span className="shrink-0 rounded-md bg-[var(--mark-soft)] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--mark-strong)]">
          {items.length}
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-4 text-[13px] text-[var(--text-muted)]">
          <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{emptyText}</span>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {visibleItems.map((item) => {
            const content = (
              <>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13px] font-medium text-[var(--text-strong)]">
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="truncate text-[12px] text-[var(--text-muted)]">
                      {item.meta}
                    </span>
                  )}
                </span>
                {item.actionLabel && (
                  <span className="shrink-0 text-[12px] font-semibold text-[var(--mark-strong)]">
                    {item.actionLabel}
                  </span>
                )}
              </>
            );

            const itemClass =
              'flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-sunken)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]';

            return (
              <li key={item.id ?? item.title}>
                {item.href ? (
                  <Link href={item.href} className={itemClass}>
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={cn(itemClass, 'w-full text-left')}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(footer || remaining > 0) && (
        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-2 text-[12px] text-[var(--text-muted)]">
          <span>
            {remaining > 0
              ? `${remaining} item lain menunggu`
              : null}
          </span>
          {footer}
        </div>
      )}
    </section>
  );
}

export default ActionPanel;
