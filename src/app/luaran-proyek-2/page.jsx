import { BarChart3, BookOpenText, CheckCircle2, Database, FileText, Megaphone } from 'lucide-react';
import ResourcePageShell from '@/components/public/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { PROJECT_OUTPUTS } from '@/lib/constants';

export const metadata = {
  title: 'Luaran Proyek 2 - Kavana',
  description: 'Representasi luaran Proyek 2 untuk aplikasi Kavana.',
};

const OUTPUT_ICONS = [Database, BookOpenText, FileText, Megaphone];

export default function LuaranProyekDuaPage() {
  const project = PROJECT_OUTPUTS.project2;

  return (
    <ResourcePageShell
      title={project.title}
      subtitle={project.summary}
      updatedLabel="8 Mei 2026"
    >
      <article>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-blue))]">
          Fokus Tahap Kedua
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[hsl(var(--ctp-text))]">
          Luaran Proyek 2 menekankan aplikasi CRUD RDBMS yang dapat diuji dan artefak riset yang lengkap.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[hsl(var(--ctp-subtext1))]">
          Paket luaran ini memosisikan aplikasi sebagai bukti implementasi teknis utama, sementara
          draft jurnal, laporan bermetodologi riset, dan poster menjadi pendukung akademik untuk
          menjelaskan masalah, pendekatan, hasil, serta evaluasi proyek.
        </p>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        {project.deliverables.map((item, index) => {
          const Icon = OUTPUT_ICONS[index] || CheckCircle2;

          return (
            <article
              key={item.title}
              className="rounded-[28px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-crust)/0.62)] p-5 shadow-[0_18px_40px_-34px_hsl(var(--ctp-sapphire)/0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--ctp-blue)/0.1)] text-[hsl(var(--ctp-blue))]">
                  <Icon className="h-5 w-5" />
                </span>
                <Badge className="rounded-full border border-[hsl(var(--ctp-green)/0.25)] bg-[hsl(var(--ctp-green)/0.12)] px-3 py-1 text-[11px] font-semibold text-[hsl(var(--ctp-green))]">
                  {item.status}
                </Badge>
              </div>

              <h3 className="mt-5 text-lg font-bold text-[hsl(var(--ctp-text))]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">{item.description}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.76)] p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-subtext0))]">
            <BarChart3 className="h-4 w-4" />
            Cakupan Luaran
          </p>
          <ul className="mt-4 space-y-3">
            {project.implementedScope.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                <CheckCircle2 className="mt-1 h-4 w-4 text-[hsl(var(--ctp-green))]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[28px] border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-base)/0.76)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ctp-subtext0))]">
            Catatan Akademik
          </p>
          <ul className="mt-4 space-y-3">
            {project.academicNotes.map((item) => (
              <li key={item} className="text-sm leading-7 text-[hsl(var(--ctp-subtext1))]">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </ResourcePageShell>
  );
}
