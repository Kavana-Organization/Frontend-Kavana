import { cn } from '@/lib/utils';

/**
 * Section: pengelompok informasi dengan judul, keterangan, dan aksi.
 * Dipakai menggantikan tumpukan kartu (docs/DESIGN.md §8).
 */
export function Section({
  id,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  dense = false,
}) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section id={id} className={cn('flex flex-col', className)}>
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-2.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold leading-tight text-[var(--text-strong)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[13px] leading-snug text-[var(--text-muted)]">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className={cn(dense ? 'pt-2' : 'pt-4', contentClassName)}>
        {children}
      </div>
    </section>
  );
}

export default Section;
