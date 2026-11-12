import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, children, className }) {
  return (
    <header className={cn('flex flex-col gap-4 rounded-[28px] border border-[hsl(var(--ctp-surface1)/0.9)] bg-[hsl(var(--ctp-base)/0.8)] px-5 py-5 shadow-[0_1px_0_hsl(0_0%_100%/0.45)_inset,0_20px_40px_-34px_hsl(var(--ctp-sapphire)/0.35)] backdrop-blur-xl sm:flex-row sm:flex-wrap sm:items-end sm:justify-between lg:mb-8', className)}>
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-subtext0))]">
          Ringkasan Halaman
        </p>
        <h1 data-testid="dashboard-title" className="text-2xl font-black leading-tight tracking-tight text-[hsl(var(--ctp-text))] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-sm leading-relaxed text-[hsl(var(--ctp-subtext0))] sm:text-base">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
          {children}
        </div>
      )}
    </header>
  );
}
