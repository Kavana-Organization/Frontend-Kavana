import Link from 'next/link';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResourcePageShell({
  title,
  subtitle,
  updatedLabel,
  children,
}) {
  return (
    <main className="mx-auto w-full max-w-[72ch] px-4 py-10 sm:px-6 lg:py-14">
      <div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text-body)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </Button>
      </div>

      <header className="mt-8 border-b border-[var(--line)] pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)] sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-base leading-relaxed text-[var(--text-muted)]">
            {subtitle}
          </p>
        ) : null}
        {updatedLabel ? (
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <Clock3 className="h-3.5 w-3.5" />
            <span>Terakhir diperbarui: {updatedLabel}</span>
          </div>
        ) : null}
      </header>

      <div className="mt-8 space-y-8 text-[var(--text-body)]">
        {children}
      </div>
    </main>
  );
}
