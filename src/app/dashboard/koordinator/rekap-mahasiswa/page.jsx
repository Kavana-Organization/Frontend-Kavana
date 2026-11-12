'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRightCircle, BadgeCheck, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { flexRender } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  useLegacyTable as useReactTable,
} from '@tanstack/react-table/legacy';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI, koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const TRACK_OPTIONS = [
  { value: 'proyek1', label: 'Proyek 1' },
  { value: 'proyek2', label: 'Proyek 2' },
  { value: 'proyek3', label: 'Proyek 3' },
  { value: 'internship1', label: 'Internship 1' },
  { value: 'internship2', label: 'Internship 2' },
];

const TRACK_LABELS = Object.fromEntries(TRACK_OPTIONS.map((item) => [item.value, item.label]));
const JALUR_LABELS = { regular: 'Regular', rpl: 'RPL' };

function formatTrack(track) {
  return TRACK_LABELS[track] || track || 'Belum';
}

function getRepeatBadge(mahasiswa) {
  if (mahasiswa.repeat_required && mahasiswa.repeat_track) {
    return {
      status: 'rejected',
      label: `Wajib Ulang ${formatTrack(mahasiswa.repeat_track)}`,
    };
  }

  if (mahasiswa.next_allowed_track) {
    return {
      status: 'terjadwal',
      label: `Izin Lanjut ${formatTrack(mahasiswa.next_allowed_track)}`,
    };
  }

  return {
    status: 'approved',
    label: 'Normal',
  };
}

const REKAP_COLUMNS = [
  {
    id: 'mahasiswa',
    accessorFn: (mahasiswa) => mahasiswa.nama || '',
    header: 'Mahasiswa',
    meta: { label: 'Mahasiswa' },
    cell: ({ row }) => (
      <span className="font-medium text-[var(--text-strong)] whitespace-normal break-words">
        {row.original.nama || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'npm',
    header: 'NPM',
    meta: { label: 'NPM' },
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
        {row.original.npm || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'jalur',
    header: 'Jalur',
    meta: { label: 'Jalur' },
    cell: ({ row }) => (
      <Badge variant="outline">{JALUR_LABELS[row.original.jalur] || 'Regular'}</Badge>
    ),
  },
  {
    accessorKey: 'track',
    header: 'Track',
    meta: { label: 'Track' },
    cell: ({ row }) => <Badge variant="secondary">{formatTrack(row.original.track)}</Badge>,
  },
  {
    id: 'status_akademik',
    accessorFn: (mahasiswa) =>
      `${mahasiswa.repeat_track || ''} ${mahasiswa.next_allowed_track || ''} ${(mahasiswa.converted_tracks || []).join(' ')}`,
    header: 'Status Akademik',
    meta: { label: 'Status Akademik' },
    cell: ({ row }) => {
      const repeatBadge = getRepeatBadge(row.original);
      return (
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={repeatBadge.status} label={repeatBadge.label} />
          {(row.original.converted_tracks || []).map((track) => (
            <StatusBadge
              key={track}
              status="approved"
              label={`Konversi ${formatTrack(track)}`}
            />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'status_proposal',
    header: 'Proposal',
    meta: { label: 'Proposal' },
    cell: ({ row }) =>
      row.original.status_proposal ? (
        <StatusBadge status={row.original.status_proposal} />
      ) : (
        <span className="text-xs text-[var(--text-muted)]">-</span>
      ),
  },
  {
    accessorKey: 'dosen_nama',
    header: 'Pembimbing',
    meta: { label: 'Pembimbing' },
    cell: ({ row }) => (
      <span className="text-sm text-[var(--text-body)] whitespace-normal break-words">
        {row.original.dosen_nama || '-'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Aksi',
    meta: { label: 'Aksi' },
    enableGlobalFilter: false,
    cell: ({ row, table }) => {
      const { clearRepeatStatus, isKaprodi, openDialog, saving } = table.options.meta;
      if (!isKaprodi) return null;

      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openDialog('repeat', row.original)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Set Repeat</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openDialog('next', row.original)}
          >
            <ArrowRightCircle className="h-3.5 w-3.5" />
            <span>Izin Lanjut</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => clearRepeatStatus(row.original)}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
          {row.original.jalur === 'rpl' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openDialog('conversion', row.original)}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>Konversi</span>
            </Button>
          ) : null}
        </div>
      );
    },
  },
];

export default function RekapMahasiswaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('repeat');
  const [selectedMahasiswa, setSelectedMahasiswa] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [conversionNote, setConversionNote] = useState('');
  const [saving, setSaving] = useState(false);

  const isKaprodi = role === 'kaprodi';

  const pageTitle = useMemo(() => {
    if (isKaprodi) return 'Rekap & Validasi Akhir Mahasiswa';
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || 'Rekap Mahasiswa';
  }, [isKaprodi, pathname]);

  const loadData = useCallback(async () => {
    try {
      const res = role === 'kaprodi'
        ? await kaprodiAPI.getMahasiswaList({ grouped: false })
        : await koordinatorAPI.getMahasiswaList({ grouped: false });
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!role) return;
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [loadData, role, router]);

  const stats = {
    proyek: list.filter((m) => m.track?.includes('proyek')).length,
    internship: list.filter((m) => m.track?.includes('internship')).length,
    noTrack: list.filter((m) => !m.track).length,
    repeat: list.filter((m) => m.repeat_required).length,
    converted: list.filter((m) => Array.isArray(m.converted_tracks) && m.converted_tracks.length > 0).length,
  };

  const openDialog = (mode, mahasiswa) => {
    setDialogMode(mode);
    setSelectedMahasiswa(mahasiswa);
    if (mode === 'repeat') setSelectedTrack(mahasiswa.repeat_track || '');
    else if (mode === 'next') setSelectedTrack(mahasiswa.next_allowed_track || '');
    else setSelectedTrack('');
    setConversionNote('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setSelectedMahasiswa(null);
    setSelectedTrack('');
    setConversionNote('');
  };

  const resetDialogState = () => {
    setDialogOpen(false);
    setSelectedMahasiswa(null);
    setSelectedTrack('');
    setConversionNote('');
  };

  const submitRepeatAction = async () => {
    if (!selectedMahasiswa) return;
    if ((dialogMode === 'repeat' || dialogMode === 'next' || dialogMode === 'conversion') && !selectedTrack) {
      toast.error('Track wajib dipilih');
      return;
    }

    if (dialogMode === 'conversion') {
      if (selectedMahasiswa.jalur !== 'rpl') {
        toast.error('Konversi hanya berlaku untuk mahasiswa RPL');
        return;
      }

      setSaving(true);
      try {
        const res = await kaprodiAPI.convertMahasiswaTrack({
          mahasiswa_id: selectedMahasiswa.id,
          track: selectedTrack,
          note: conversionNote,
        });
        if (!res.ok) {
          toast.error(res.error || 'Gagal mencatat konversi');
          return;
        }
        toast.success(res.data?.message || 'Konversi track berhasil dicatat');
        resetDialogState();
        await loadData();
      } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan jaringan');
      } finally {
        setSaving(false);
      }
      return;
    }

    const payload = { mahasiswa_id: selectedMahasiswa.id, repeat_required: false };
    if (dialogMode === 'repeat') {
      payload.repeat_required = true;
      payload.repeat_track = selectedTrack;
    } else if (dialogMode === 'next') {
      payload.next_allowed_track = selectedTrack;
    }

    setSaving(true);
    try {
      const res = await kaprodiAPI.setMahasiswaRepeatStatus(payload);
      if (!res.ok) {
        toast.error(res.error || 'Gagal memperbarui status repeat');
        return;
      }
      toast.success(res.data?.message || 'Status mahasiswa berhasil diperbarui');
      resetDialogState();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const clearRepeatStatus = async (mahasiswa) => {
    setSaving(true);
    try {
      const res = await kaprodiAPI.setMahasiswaRepeatStatus({
        mahasiswa_id: mahasiswa.id,
        repeat_required: false,
      });
      if (!res.ok) {
        toast.error(res.error || 'Gagal membersihkan status repeat');
        return;
      }
      toast.success(res.data?.message || 'Status repeat berhasil dibersihkan');
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const table = useReactTable({
    data: list,
    columns: isKaprodi ? REKAP_COLUMNS : REKAP_COLUMNS.filter((column) => column.id !== 'actions'),
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: { clearRepeatStatus, isKaprodi, openDialog, saving },
  });

  if (loading) {
    return <LoadingState variant="table" label="Memuat rekap mahasiswa" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={
          isKaprodi
            ? 'Pantau rekapitulasi track, validasi akhir status ulang, dan konversi jalur RPL mahasiswa prodi.'
            : 'Rekapitulasi track, status proposal, dan dosen pembimbing mahasiswa.'
        }
      />

      {/* Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {list.length}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Proyek</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {stats.proyek}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Internship</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-mauve))] font-mono tabular-nums">
            {stats.internship}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Belum Pilih</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {stats.noTrack}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Wajib Ulang</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-red))] font-mono tabular-nums">
            {stats.repeat}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Konversi RPL</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {stats.converted}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <Users className="h-4 w-4 shrink-0" />
            <span>Rekap Mahasiswa</span>
          </CardTitle>
          <div className="w-full sm:w-72">
            <Field label="Cari mahasiswa">
              {(a11y) => (
                <Input
                  {...a11y}
                  name="search"
                  placeholder="Nama, NPM, track, atau pembimbing..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                />
              )}
            </Field>
          </div>
        </CardHeader>
        <CardContent>
          {table.getRowModel().rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={isKaprodi ? 'Belum ada data rekap mahasiswa untuk dipantau' : 'Tidak ada data mahasiswa'}
              description="Data mahasiswa akan tampil di sini atau coba sesuaikan kata kunci pencarian Anda."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        data-label={cell.column.columnDef.meta?.label || String(cell.column.columnDef.header || '')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-[var(--surface-raised)] border-[var(--line)] text-[var(--text-strong)]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'repeat'
                ? 'Set Wajib Ulang'
                : dialogMode === 'conversion'
                  ? 'Konversi Track RPL'
                  : 'Set Izin Lanjut'}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-muted)]">
              {selectedMahasiswa
                ? `${selectedMahasiswa.nama} (${selectedMahasiswa.npm})`
                : 'Pilih track yang akan diterapkan ke mahasiswa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              {dialogMode === 'repeat'
                ? 'Mahasiswa akan dikunci hanya ke track ulang ini sampai dinyatakan selesai.'
                : dialogMode === 'conversion'
                  ? 'Track yang dikonversi akan dicatat sebagai selesai, sehingga mahasiswa RPL bisa mengambil track berikutnya dan tidak bisa memilih track ini lagi.'
                  : 'Mahasiswa akan diizinkan mengambil track ini setelah repeat selesai, tetapi tetap harus menunggu periodenya aktif.'}
            </p>
            <Field label="Track Akademik" required>
              {(a11y) => (
                <Select name="track" value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger
                    id={a11y.id}
                    aria-describedby={a11y['aria-describedby']}
                    className="w-full bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                  >
                    <SelectValue placeholder="Pilih track" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)] text-[var(--text-strong)]">
                    {TRACK_OPTIONS.map((track) => (
                      <SelectItem key={track.value} value={track.value}>
                        {track.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
            {dialogMode === 'conversion' ? (
              <Field label="Catatan Konversi (Opsional)">
                {(a11y) => (
                  <Textarea
                    {...a11y}
                    name="conversion_note"
                    value={conversionNote}
                    onChange={(event) => setConversionNote(event.target.value)}
                    placeholder="Catatan konversi, contoh: Konversi berdasarkan portofolio/rekognisi Proyek 1"
                    rows={3}
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                  />
                )}
              </Field>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
              Batal
            </Button>
            <Button type="button" onClick={submitRepeatAction} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
