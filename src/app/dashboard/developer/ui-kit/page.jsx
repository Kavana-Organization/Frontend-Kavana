'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Section } from '@/components/ui/section';
import { ActionPanel } from '@/components/ui/action-panel';
import { DataTable } from '@/components/ui/data-table';
import { FormShell, Field } from '@/components/ui/form-shell';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { Inbox } from 'lucide-react';

const TOKEN_SWATCHES = [
  { name: 'Kertas halaman', value: 'var(--surface-page)' },
  { name: 'Kertas terangkat', value: 'var(--surface-raised)' },
  { name: 'Kertas tenggelam', value: 'var(--surface-sunken)' },
  { name: 'Tinta', value: 'var(--text-strong)' },
  { name: 'Tinta lembut', value: 'var(--text-muted)' },
  { name: 'Garis', value: 'var(--line)' },
  { name: 'Aksi (navy)', value: 'var(--accent)' },
  { name: 'Penanda (ochre)', value: 'var(--mark)' },
  { name: 'Sukses', value: 'var(--status-success)' },
  { name: 'Peringatan', value: 'var(--status-warning)' },
  { name: 'Bahaya', value: 'var(--status-danger)' },
  { name: 'Info', value: 'var(--status-info)' },
];

const STATUS_DEMO = [
  'menunggu',
  'approved',
  'revisi',
  'rejected',
  'lulus',
  'terjadwal',
  'unknown',
];

const MAHASISWA = [
  { id: 1, nama: 'Roni Andarsyah', npm: '714240001', track: 'Proyek 3', tahap: 'Bimbingan', status: 'menunggu' },
  { id: 2, nama: 'Anisa Rahmawati Kusumaningrum Wulandari', npm: '714240002', track: 'Internship', tahap: 'Proposal', status: 'approved' },
  { id: 3, nama: 'Bayu Pratama', npm: '714240003', track: 'Proyek 2', tahap: 'Sidang', status: 'terjadwal' },
  { id: 4, nama: 'Citra Dewi', npm: '714240004', track: 'Proyek 1', tahap: 'Revisi', status: 'revisi' },
];

const ACTIONS = [
  { id: 1, title: 'Bimbingan menunggu persetujuan', meta: 'Anisa R. K. W. · sesi 6 · 2 hari lalu', href: '#', actionLabel: 'Tinjau' },
  { id: 2, title: 'Laporan sidang menunggu', meta: 'Bayu Pratama · Proyek 2', href: '#', actionLabel: 'Tinjau' },
  { id: 3, title: 'Proposal perlu validasi', meta: '4 mahasiswa angkatan 2024', href: '#', actionLabel: 'Lihat' },
  { id: 4, title: 'Revisi belum diunggah', meta: 'Citra Dewi · tenggat 3 hari', href: '#', actionLabel: 'Ingatkan' },
  { id: 5, title: 'Jadwal sidang belum ada penguji', meta: '2 mahasiswa siap sidang', href: '#', actionLabel: 'Atur' },
  { id: 6, title: 'Data mahasiswa tidak lengkap', meta: '3 akun tanpa nomor HP', href: '#', actionLabel: 'Perbaiki' },
];

const COLUMNS = [
  { key: 'nama', header: 'Mahasiswa', width: '32%' },
  { key: 'npm', header: 'NPM', className: 'font-mono text-[12px]' },
  { key: 'track', header: 'Track', mobileHidden: true },
  { key: 'tahap', header: 'Tahap', mobileHidden: true },
  {
    key: 'status',
    header: 'Status',
    sortable: false,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'aksi',
    header: 'Aksi',
    sortable: false,
    align: 'right',
    render: () => (
      <Button size="xs" variant="outline">
        Tinjau
      </Button>
    ),
  },
];

export default function UiKitPage() {
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  return (
    <div className="flex flex-col gap-8 pb-16">
      <PageHeader
        title="Kit UI (alat review)"
        subtitle="Halaman sementara untuk memeriksa token, cap status, tabel, antrean, dan formulir sebelum dipakai di dasbor peran."
      />

      <Section
        title="Palet"
        description="Rasio 60/30/10. Aksen penanda hanya untuk hal yang menunggu tindakan."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TOKEN_SWATCHES.map((swatch) => (
            <div key={swatch.name} className="flex items-center gap-2 rounded-lg border border-[var(--line)] p-2">
              <span
                className="h-8 w-8 shrink-0 rounded-md border border-[var(--line)]"
                style={{ background: swatch.value }}
                aria-hidden="true"
              />
              <span className="min-w-0 text-[12px] text-[var(--text-body)]">
                <span className="block truncate font-medium text-[var(--text-strong)]">
                  {swatch.name}
                </span>
                <span className="block truncate font-mono text-[11px] text-[var(--text-muted)]">
                  {swatch.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Cap status"
        description="Teks dan bentuk adalah pembeda utama. Menunggu memakai garis putus-putus, status final memakai garis penuh."
      >
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_DEMO.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
          <StatusBadge status="approved" label="Disetujui Kaprodi" />
        </div>
      </Section>

      <Section
        title="Antrean tindakan"
        description="Maksimal lima item terlihat, sisanya dihitung."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ActionPanel items={ACTIONS} />
          <ActionPanel items={[]} />
        </div>
      </Section>

      <Section
        title="Tabel kepadatan staf"
        description="Header 40px, baris 40px, padding sel 12px. Klik header untuk mengurutkan."
      >
        <DataTable columns={COLUMNS} rows={MAHASISWA} caption="Contoh daftar mahasiswa bimbingan" density="staff" />
      </Section>

      <Section
        title="Tabel kepadatan mahasiswa"
        description="Baris 56px, kolom teknis disembunyikan di ponsel, tabel berubah menjadi daftar."
      >
        <DataTable
          columns={COLUMNS}
          rows={MAHASISWA.slice(0, 2)}
          caption="Contoh daftar dengan kepadatan lapang"
          density="student"
        />
      </Section>

      <Section title="Tabel kosong dan memuat">
        <div className="grid gap-4 lg:grid-cols-2">
          <DataTable
            columns={COLUMNS}
            rows={[]}
            caption="Contoh keadaan kosong"
            empty={
              <EmptyState
                icon={Inbox}
                title="Belum ada bimbingan"
                description="Sesi bimbingan yang diajukan mahasiswa akan muncul di sini."
              />
            }
          />
          <DataTable columns={COLUMNS} rows={[]} loading loadingRows={4} caption="Contoh keadaan memuat" />
        </div>
      </Section>

      <Section title="Formulir" description="Label di atas field, galat di bawah field, tombol menempel di ponsel.">
        <div className="max-w-xl">
          <FormShell
            title="Catatan bimbingan"
            description="Contoh kerangka formulir dengan ringkasan galat."
            submitLabel="Simpan catatan"
            error={error}
            submitting={submitting}
            onSubmit={() => {
              if (!error) {
                setError('Catatan wajib diisi minimal 20 karakter.');
                return;
              }
              setSubmitting(true);
              setTimeout(() => setSubmitting(false), 900);
            }}
            onCancel={() => setError('')}
          >
            <Field label="Judul sesi" htmlFor="kit-judul" required hint="Contoh: Revisi bab 3 dan 4.">
              <Input id="kit-judul" placeholder="Tulis judul sesi" />
            </Field>
            <Field label="Catatan untuk mahasiswa" htmlFor="kit-catatan" error={error}>
              <Input id="kit-catatan" placeholder="Tulis catatan" />
            </Field>
          </FormShell>
        </div>
      </Section>
    </div>
  );
}
