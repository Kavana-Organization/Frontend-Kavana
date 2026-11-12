'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserCheck, UserPlus, Users } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
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
import { DashboardDialog } from '@/components/shared/dashboard-dialog';
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

function isProyekKelompok(item) {
  return String(item?.track || '').includes('proyek') && Array.isArray(item?.anggota) && item.anggota.length > 1;
}

export default function ApprovePembimbingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [mahasiswa, setMahasiswa] = useState([]);
  const [dosen, setDosen] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedDosen, setSelectedDosen] = useState('');

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['approve-pembimbing'] || 'Assign Pembimbing';
  }, [pathname]);

  useEffect(() => {
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [mRes, dRes] = await Promise.all([
        koordinatorAPI.getMahasiswaList(),
        koordinatorAPI.getDosenList(),
      ]);
      if (mRes.ok) setMahasiswa(Array.isArray(mRes.data) ? mRes.data : []);
      if (dRes.ok) setDosen(Array.isArray(dRes.data) ? dRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDosen) {
      toast.error('Pilih dosen');
      return;
    }
    try {
      const res = await koordinatorAPI.assignDosen(modal, selectedDosen);
      if (res.ok) {
        toast.success('Dosen berhasil ditugaskan!');
        setModal(null);
        loadData();
      } else {
        toast.error(res.error || 'Gagal');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    }
  };

  const needAssign = mahasiswa.filter((m) => !m.dosen_id && m.status_proposal === 'approved');
  const assigned = mahasiswa.filter((m) => !!m.dosen_id);
  const selectedMahasiswa = mahasiswa.find((item) => item.id === modal);

  if (loading) {
    return <LoadingState variant="table" label="Memuat data penugasan pembimbing" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Tetapkan dosen pembimbing bagi mahasiswa atau kelompok yang proposalnya telah disetujui."
      />

      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {mahasiswa.length}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Belum Ditugaskan</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {needAssign.length}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Sudah Ditugaskan</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {assigned.length}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Penugasan Pembimbing</span>
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Daftar mahasiswa dan kelompok proyek yang menunggu penetapan pembimbing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needAssign.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Semua mahasiswa sudah memiliki pembimbing"
              description="Tidak ada mahasiswa dengan proposal disetujui yang belum memiliki dosen pembimbing."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead className="w-[150px]">NPM</TableHead>
                  <TableHead className="w-[130px]">Track</TableHead>
                  <TableHead>Usulan Pembimbing</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needAssign.map((m) => {
                  const kelompok = isProyekKelompok(m);
                  const displayName = kelompok ? (m.kelompok_nama || 'Kelompok Proyek') : (m.nama || '-');
                  const anggotaNama = (m.anggota || []).map((anggota) => anggota.nama).join(' • ');
                  const anggotaNpm = (m.anggota || []).map((anggota) => anggota.npm).join(' • ');

                  return (
                    <TableRow key={m.id}>
                      <TableCell data-label="Mahasiswa / Kelompok" className="whitespace-normal break-words">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-[var(--text-strong)]">{displayName}</span>
                          {kelompok ? (
                            <Badge variant="outline">
                              <Users className="h-3 w-3" />
                              <span>Kelompok</span>
                            </Badge>
                          ) : null}
                        </div>
                        {kelompok && anggotaNama ? (
                          <p className="mt-1 text-xs text-[var(--text-muted)] break-words">{anggotaNama}</p>
                        ) : null}
                      </TableCell>
                      <TableCell data-label="NPM" className="whitespace-normal break-words font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {kelompok ? (anggotaNpm || '-') : (m.npm || '-')}
                      </TableCell>
                      <TableCell data-label="Track" className="text-sm text-[var(--text-body)]">
                        {m.track || '-'}
                      </TableCell>
                      <TableCell data-label="Usulan Pembimbing" className="whitespace-normal break-words text-sm text-[var(--text-body)]">
                        {m.usulan_dosen_nama || '-'}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status="pending" label="Menunggu" />
                      </TableCell>
                      <TableCell data-label="Aksi" className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setModal(m.id);
                            setSelectedDosen('');
                          }}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Assign</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DashboardDialog
        open={!!modal}
        onOpenChange={(open) => !open && setModal(null)}
        title="Pilih Dosen Pembimbing"
      >
        <h3 className="mb-3 text-lg font-semibold text-[var(--text-strong)]">Pilih Dosen Pembimbing</h3>
        <div className="space-y-4">
          {isProyekKelompok(selectedMahasiswa) ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-sm text-[var(--text-strong)]">
              <p className="font-medium break-words">{selectedMahasiswa?.kelompok_nama || 'Kelompok Proyek'}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)] break-words">
                {(selectedMahasiswa?.anggota || []).map((anggota) => `${anggota.nama} (${anggota.npm})`).join(' • ')}
              </p>
            </div>
          ) : null}
          {selectedMahasiswa?.usulan_dosen_nama ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] px-3.5 py-2 text-sm text-[var(--text-strong)] break-words">
              Usulan mahasiswa: <span className="font-medium text-[var(--accent)]">{selectedMahasiswa?.usulan_dosen_nama}</span>
            </div>
          ) : null}

          <Field label="Dosen Pembimbing" required>
            {(a11y) => (
              <Select name="dosen_id" value={selectedDosen} onValueChange={setSelectedDosen}>
                <SelectTrigger
                  id={a11y.id}
                  aria-describedby={a11y['aria-describedby']}
                  className="w-full bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                >
                  <SelectValue placeholder="-- Pilih Dosen --" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                  {dosen.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button type="button" onClick={handleAssign}>
              Tugaskan
            </Button>
          </div>
        </div>
      </DashboardDialog>
    </div>
  );
}
