'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, RotateCcw, ArrowRightCircle, ShieldCheck, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI, koordinatorAPI } from '@/lib/api';

function getInitials(n) { return (n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

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
      label: `Wajib Ulang ${formatTrack(mahasiswa.repeat_track)}`,
      className: 'bg-[hsl(var(--ctp-red)/0.16)] text-[hsl(var(--ctp-red))] border border-[hsl(var(--ctp-red)/0.28)]',
    };
  }

  if (mahasiswa.next_allowed_track) {
    return {
      label: `Izin Lanjut ${formatTrack(mahasiswa.next_allowed_track)}`,
      className: 'bg-[hsl(var(--ctp-blue)/0.16)] text-[hsl(var(--ctp-blue))] border border-[hsl(var(--ctp-blue)/0.28)]',
    };
  }

  return {
    label: 'Normal',
    className: 'bg-[hsl(var(--ctp-green)/0.16)] text-[hsl(var(--ctp-green))] border border-[hsl(var(--ctp-green)/0.28)]',
  };
}

const REKAP_COLUMNS = [
  {
    id: 'mahasiswa',
    accessorFn: (mahasiswa) => mahasiswa.nama || '',
    header: 'Mahasiswa',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--ctp-lavender)/0.20)] text-xs font-bold text-[hsl(var(--ctp-text))]">
          {getInitials(row.original.nama)}
        </div>
        <span className="font-medium text-[hsl(var(--ctp-text))]">{row.original.nama || '-'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'npm',
    header: 'NPM',
    cell: ({ row }) => <span className="text-[hsl(var(--ctp-subtext0))]">{row.original.npm || '-'}</span>,
  },
  {
    accessorKey: 'jalur',
    header: 'Jalur',
    cell: ({ row }) => (
      <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
        {JALUR_LABELS[row.original.jalur] || 'Regular'}
      </Badge>
    ),
  },
  {
    accessorKey: 'track',
    header: 'Track',
    cell: ({ row }) => (
      <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))]">
        {formatTrack(row.original.track)}
      </Badge>
    ),
  },
  {
    id: 'status_akademik',
    accessorFn: (mahasiswa) => `${mahasiswa.repeat_track || ''} ${mahasiswa.next_allowed_track || ''} ${(mahasiswa.converted_tracks || []).join(' ')}`,
    header: 'Status Akademik',
    cell: ({ row }) => {
      const repeatBadge = getRepeatBadge(row.original);
      return (
        <div className="flex flex-wrap gap-1.5">
          <Badge className={`rounded-xl ${repeatBadge.className}`}>{repeatBadge.label}</Badge>
          {(row.original.converted_tracks || []).map((track) => (
            <Badge
              key={track}
              className="rounded-xl border border-[hsl(var(--ctp-green)/0.28)] bg-[hsl(var(--ctp-green)/0.16)] text-[hsl(var(--ctp-green))]"
            >
              Konversi {formatTrack(track)}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'status_proposal',
    header: 'Proposal',
    cell: ({ row }) => <span className="capitalize text-[hsl(var(--ctp-subtext0))]">{row.original.status_proposal || '-'}</span>,
  },
  {
    accessorKey: 'dosen_nama',
    header: 'Pembimbing',
    cell: ({ row }) => <span className="text-[hsl(var(--ctp-subtext0))]">{row.original.dosen_nama || '-'}</span>,
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableGlobalFilter: false,
    cell: ({ row, table }) => {
      const { clearRepeatStatus, isKaprodi, openDialog, saving } = table.options.meta;
      if (!isKaprodi) return null;

      return (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => openDialog('repeat', row.original)}
            className="rounded-xl border border-[hsl(var(--ctp-red)/0.28)] bg-[hsl(var(--ctp-red)/0.16)] text-[hsl(var(--ctp-red))] hover:bg-[hsl(var(--ctp-red)/0.24)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Set Repeat
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openDialog('next', row.original)}
            className="rounded-xl border border-[hsl(var(--ctp-blue)/0.28)] bg-[hsl(var(--ctp-blue)/0.16)] text-[hsl(var(--ctp-blue))] hover:bg-[hsl(var(--ctp-blue)/0.24)]"
          >
            <ArrowRightCircle className="h-3.5 w-3.5" />
            Izin Lanjut
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => clearRepeatStatus(row.original)}
            className="rounded-xl border border-[hsl(var(--ctp-green)/0.28)] bg-[hsl(var(--ctp-green)/0.16)] text-[hsl(var(--ctp-green))] hover:bg-[hsl(var(--ctp-green)/0.24)]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Clear
          </Button>
          {row.original.jalur === 'rpl' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => openDialog('conversion', row.original)}
              className="rounded-xl border border-[hsl(var(--ctp-green)/0.28)] bg-[hsl(var(--ctp-green)/0.16)] text-[hsl(var(--ctp-green))] hover:bg-[hsl(var(--ctp-green)/0.24)]"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Konversi
            </Button>
          ) : null}
        </div>
      );
    },
  },
];

export default function RekapMahasiswaPage() {
  const router = useRouter();
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

  const loadData = useCallback(async () => {
    try {
      const res = role === 'kaprodi'
        ? await kaprodiAPI.getMahasiswaList({ grouped: false })
        : await koordinatorAPI.getMahasiswaList({ grouped: false });
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => {
    if (!role) return;
    if (role && !['koordinator','kaprodi'].includes(role)) { router.replace(`/dashboard/${role}`); return; }
    loadData();
  }, [loadData, role, router]);

  const stats = {
    proyek: list.filter(m => m.track?.includes('proyek')).length,
    internship: list.filter(m => m.track?.includes('internship')).length,
    noTrack: list.filter(m => !m.track).length,
    repeat: list.filter(m => m.repeat_required).length,
    converted: list.filter(m => Array.isArray(m.converted_tracks) && m.converted_tracks.length > 0).length,
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-6">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total</p><p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{list.length}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Proyek</p><p className="text-2xl font-bold text-[hsl(var(--ctp-blue))]">{stats.proyek}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Internship</p><p className="text-2xl font-bold text-[hsl(var(--ctp-mauve))]">{stats.internship}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Belum Pilih</p><p className="text-2xl font-bold text-[hsl(var(--ctp-peach))]">{stats.noTrack}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Wajib Ulang</p><p className="text-2xl font-bold text-[hsl(var(--ctp-red))]">{stats.repeat}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Konversi RPL</p><p className="text-2xl font-bold text-[hsl(var(--ctp-green))]">{stats.converted}</p></CardContent></Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><Users className="h-4 w-4" /> Rekap Mahasiswa</CardTitle>
          <Input
            aria-label="Cari mahasiswa berdasarkan nama, NPM, track, atau pembimbing"
            placeholder="Cari mahasiswa..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64 border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-mantle)/0.5)] text-[hsl(var(--ctp-text))]"
          />
        </CardHeader>
        <CardContent>
          {table.getRowModel().rows.length === 0 ? (
            <div className="text-center py-12"><Users className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" /><p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada data</p></div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-[hsl(var(--ctp-overlay0)/0.35)]">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs text-[hsl(var(--ctp-subtext0))]">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-[hsl(var(--ctp-surface1)/0.35)]">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0))] text-[hsl(var(--ctp-text))]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'repeat'
                ? 'Set Wajib Ulang'
                : dialogMode === 'conversion'
                  ? 'Konversi Track RPL'
                  : 'Set Izin Lanjut'}
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--ctp-subtext0))]">
              {selectedMahasiswa
                ? `${selectedMahasiswa.nama} (${selectedMahasiswa.npm})`
                : 'Pilih track yang akan diterapkan ke mahasiswa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-[hsl(var(--ctp-subtext0))]">
              {dialogMode === 'repeat'
                ? 'Mahasiswa akan dikunci hanya ke track ulang ini sampai dinyatakan selesai.'
                : dialogMode === 'conversion'
                  ? 'Track yang dikonversi akan dicatat sebagai selesai, sehingga mahasiswa RPL bisa mengambil track berikutnya dan tidak bisa memilih track ini lagi.'
                  : 'Mahasiswa akan diizinkan mengambil track ini setelah repeat selesai, tetapi tetap harus menunggu periodenya aktif.'}
            </p>
            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
              <SelectTrigger className="bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]">
                <SelectValue placeholder="Pilih track" />
              </SelectTrigger>
              <SelectContent className="border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0))] text-[hsl(var(--ctp-text))]">
                {TRACK_OPTIONS.map((track) => (
                  <SelectItem key={track.value} value={track.value}>
                    {track.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dialogMode === 'conversion' ? (
              <textarea
                value={conversionNote}
                onChange={(event) => setConversionNote(event.target.value)}
                placeholder="Catatan konversi, contoh: Konversi berdasarkan portofolio/rekognisi Proyek 1"
                rows={3}
                className="w-full rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-mantle)/0.5)] px-3 py-2 text-sm text-[hsl(var(--ctp-text))] outline-none placeholder:text-[hsl(var(--ctp-subtext0))]"
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={closeDialog}
              disabled={saving}
              className="rounded-2xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-overlay0)/0.35)]"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={submitRepeatAction}
              disabled={saving}
              className="rounded-2xl bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-lavender)/0.30)] border border-[hsl(var(--ctp-lavender)/0.35)]"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
