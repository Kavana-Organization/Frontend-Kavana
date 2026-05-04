'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, RotateCcw, ArrowRightCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const filtered = list.filter(m => !search || (m.nama||'').toLowerCase().includes(search.toLowerCase()) || (m.npm||'').includes(search));

  const stats = {
    proyek: list.filter(m => m.track?.includes('proyek')).length,
    internship: list.filter(m => m.track?.includes('internship')).length,
    noTrack: list.filter(m => !m.track).length,
    repeat: list.filter(m => m.repeat_required).length,
  };

  const openDialog = (mode, mahasiswa) => {
    setDialogMode(mode);
    setSelectedMahasiswa(mahasiswa);
    setSelectedTrack(mode === 'repeat' ? (mahasiswa.repeat_track || '') : (mahasiswa.next_allowed_track || ''));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setSelectedMahasiswa(null);
    setSelectedTrack('');
  };

  const resetDialogState = () => {
    setDialogOpen(false);
    setSelectedMahasiswa(null);
    setSelectedTrack('');
  };

  const submitRepeatAction = async () => {
    if (!selectedMahasiswa) return;
    if ((dialogMode === 'repeat' || dialogMode === 'next') && !selectedTrack) {
      toast.error('Track wajib dipilih');
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-5">
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Total</p><p className="text-2xl font-bold text-[hsl(var(--ctp-text))]">{list.length}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Proyek</p><p className="text-2xl font-bold text-[hsl(var(--ctp-blue))]">{stats.proyek}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Internship</p><p className="text-2xl font-bold text-[hsl(var(--ctp-mauve))]">{stats.internship}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Belum Pilih</p><p className="text-2xl font-bold text-[hsl(var(--ctp-peach))]">{stats.noTrack}</p></CardContent></Card>
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring"><CardContent className="pt-6"><p className="text-xs text-[hsl(var(--ctp-subtext0))]">Wajib Ulang</p><p className="text-2xl font-bold text-[hsl(var(--ctp-red))]">{stats.repeat}</p></CardContent></Card>
      </div>

      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]"><Users className="h-4 w-4" /> Rekap Mahasiswa</CardTitle>
          <Input placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className="w-64 bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]" />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12"><Users className="h-10 w-10 mx-auto text-[hsl(var(--ctp-overlay1))] mb-3" /><p className="text-sm text-[hsl(var(--ctp-subtext0))]">Tidak ada data</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[hsl(var(--ctp-overlay0)/0.35)]">
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Mahasiswa</th>
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">NPM</th>
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Jalur</th>
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Track</th>
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Status Akademik</th>
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Proposal</th>
                  <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Pembimbing</th>
                  {isKaprodi ? <th className="text-left py-2 px-3 text-xs text-[hsl(var(--ctp-subtext0))] font-medium">Aksi</th> : null}
                </tr></thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id || i} className="border-b border-[hsl(var(--ctp-surface1)/0.35)]">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[hsl(var(--ctp-lavender)/0.20)] text-[hsl(var(--ctp-text))] flex items-center justify-center text-xs font-bold">{getInitials(m.nama)}</div>
                          <span className="font-medium text-[hsl(var(--ctp-text))]">{m.nama || '-'}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[hsl(var(--ctp-subtext0))]">{m.npm || '-'}</td>
                      <td className="py-2 px-3">
                        <Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">
                          {JALUR_LABELS[m.jalur] || 'Regular'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3"><Badge className="rounded-xl bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-subtext1))] border border-[hsl(var(--ctp-overlay0)/0.35)]">{formatTrack(m.track)}</Badge></td>
                      <td className="py-2 px-3">
                        <Badge className={`rounded-xl ${getRepeatBadge(m).className}`}>
                          {getRepeatBadge(m).label}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-[hsl(var(--ctp-subtext0))] capitalize">{m.status_proposal || '-'}</td>
                      <td className="py-2 px-3 text-[hsl(var(--ctp-subtext0))]">{m.dosen_nama || '-'}</td>
                      {isKaprodi ? (
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => openDialog('repeat', m)}
                              className="rounded-xl bg-[hsl(var(--ctp-red)/0.16)] text-[hsl(var(--ctp-red))] hover:bg-[hsl(var(--ctp-red)/0.24)] border border-[hsl(var(--ctp-red)/0.28)]"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Set Repeat
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => openDialog('next', m)}
                              className="rounded-xl bg-[hsl(var(--ctp-blue)/0.16)] text-[hsl(var(--ctp-blue))] hover:bg-[hsl(var(--ctp-blue)/0.24)] border border-[hsl(var(--ctp-blue)/0.28)]"
                            >
                              <ArrowRightCircle className="h-3.5 w-3.5 mr-1" />
                              Izin Lanjut
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={saving}
                              onClick={() => clearRepeatStatus(m)}
                              className="rounded-xl bg-[hsl(var(--ctp-green)/0.16)] text-[hsl(var(--ctp-green))] hover:bg-[hsl(var(--ctp-green)/0.24)] border border-[hsl(var(--ctp-green)/0.28)]"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                              Clear
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="border-[hsl(var(--ctp-overlay0)/0.45)] bg-[hsl(var(--ctp-surface0))] text-[hsl(var(--ctp-text))]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'repeat' ? 'Set Wajib Ulang' : 'Set Izin Lanjut'}
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
