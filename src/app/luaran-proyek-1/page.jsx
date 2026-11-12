import { BookOpenText, CheckCircle2, FileText, LayoutPanelTop, Megaphone } from 'lucide-react';
import ResourcePageShell from '@/components/public/resource-page-shell';
import { Badge } from '@/components/ui/badge';
import { PROJECT_OUTPUTS } from '@/lib/constants';

export const metadata = {
  title: 'Luaran Proyek 1 - Kavana',
  description: 'Representasi luaran Proyek 1 untuk aplikasi Kavana.',
};

const OUTPUT_ICONS = [LayoutPanelTop, FileText, BookOpenText, Megaphone];

export default function LuaranProyekSatuPage() {
  const project = PROJECT_OUTPUTS.project1;

  return (
    <ResourcePageShell
      title={project.title}
      subtitle={project.summary}
      updatedLabel="16 April 2026"
    >
      <article className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Fokus Tahap Awal
        </p>
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-strong)]">
          Luaran Proyek 1 diposisikan sebagai paket demo aplikasi yang siap dipresentasikan.
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-body)]">
          Halaman ini merangkum apa yang sudah bisa ditunjukkan pada tahap proyek pertama:
          tampilan publik, alur aplikasi inti, serta ruang artefak akademik yang akan
          diturunkan menjadi draft buku dan poster. Komponen CRUD tetap dapat dilihat
          sebagai nilai tambah saat dosen melakukan pemeriksaan langsung.
        </p>
      </article>

      <div className="grid gap-4 sm:grid-cols-2">
        {project.deliverables.map((item, index) => {
          const Icon = OUTPUT_ICONS[index] || CheckCircle2;

          return (
            <article
              key={item.title}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-sunken)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <Badge variant="outline" className="border-[var(--line)] text-xs font-medium">
                  {item.status}
                </Badge>
              </div>

              <h3 className="mt-4 text-base font-bold text-[var(--text-strong)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.description}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Cakupan yang Sudah Bisa Ditunjukkan
          </p>
          <ul className="mt-4 space-y-2.5">
            {project.implementedScope.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--text-body)]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Catatan Akademik
          </p>
          <ul className="mt-4 space-y-2.5">
            {project.academicNotes.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-[var(--text-body)]">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </ResourcePageShell>
  );
}
