'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileText, MessageSquare, User, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
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
import { EmptyState, ErrorState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function MahasiswaBimbinganPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const roleNamespace = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    return segments[1] || 'dosen';
  }, [pathname]);

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['mahasiswa-bimbingan'] || 'Mahasiswa Bimbingan';
  }, [pathname]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dosenAPI.getMahasiswaBimbingan();
      if (res.ok) {
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setList(rows);
        setSelectedId((prev) => prev ?? (rows[0]?.id ?? rows[0]?.npm ?? null));
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role && !['dosen', 'penguji', 'koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [loadData, role, router]);

  const filtered = useMemo(
    () =>
      list.filter(
        (m) =>
          !search ||
          (m.nama || '').toLowerCase().includes(search.toLowerCase()) ||
          (m.npm || '').includes(search)
      ),
    [list, search]
  );

  const selectedStudent = useMemo(() => {
    if (filtered.length === 0) return null;
    return (
      filtered.find((m) => (m.id ?? m.npm) === selectedId) ||
      filtered[0]
    );
  }, [filtered, selectedId]);

  if (loading) {
    return <LoadingState variant="table" label="Memuat daftar mahasiswa bimbingan" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Split view: pilih mahasiswa pada daftar di kiri untuk meninjau detail progres bimbingan di kanan."
      />

      {/* Compact Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border border-[var(--line)] rounded-xl bg-[var(--surface-raised)]">
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Mahasiswa</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {list.length}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Proyek</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {list.filter((m) => m.track?.includes('proyek')).length}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Internship</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-teal))] font-mono tabular-nums">
            {list.filter((m) => m.track?.includes('internship')).length}
          </p>
        </div>
      </div>

      {loadError ? (
        <ErrorState
          title="Gagal memuat daftar mahasiswa bimbingan"
          description="Terjadi kendala saat mengambil data mahasiswa bimbingan dari server."
          onRetry={loadData}
        />
      ) : (
        /* PG-1: Split View — Daftar (Left) & Detail (Right) */
        <div
          data-testid="mahasiswa-bimbingan-split-view"
          className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start"
        >
          {/* Left Pane: Student Directory Table */}
          <Card variant="muted" className="lg:col-span-2 min-w-0">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Daftar Mahasiswa</span>
                </CardTitle>
                <CardDescription className="text-[var(--text-muted)]">
                  Klik baris mahasiswa untuk menampilkan detail progres di panel kanan.
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Field label="Cari mahasiswa">
                  {(a11y) => (
                    <Input
                      {...a11y}
                      placeholder="Nama atau NPM..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                    />
                  )}
                </Field>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Tidak ada mahasiswa ditemukan"
                  description="Coba ubah kata kunci pencarian atau tunggu penetapan mahasiswa bimbingan."
                />
              ) : (
                <Table stackOnMobile density="compact">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahasiswa</TableHead>
                      <TableHead className="w-[120px]">NPM</TableHead>
                      <TableHead className="w-[140px]">Track</TableHead>
                      <TableHead className="w-[110px]">Bimbingan</TableHead>
                      <TableHead className="w-[130px] text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((m, i) => {
                      const rowId = m.id ?? m.npm ?? i;
                      const isSelected =
                        selectedStudent && (selectedStudent.id ?? selectedStudent.npm) === rowId;
                      return (
                        <TableRow
                          key={rowId}
                          data-state={isSelected ? 'selected' : undefined}
                          onClick={() => setSelectedId(rowId)}
                          className="cursor-pointer"
                        >
                          <TableCell data-label="Mahasiswa" className="whitespace-normal break-words font-medium text-[var(--text-strong)]">
                            {m.nama || '-'}
                          </TableCell>
                          <TableCell data-label="NPM" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                            {m.npm || '-'}
                          </TableCell>
                          <TableCell data-label="Track" className="text-sm text-[var(--text-body)]">
                            {m.track || '-'}
                          </TableCell>
                          <TableCell data-label="Bimbingan" className="font-mono text-xs tabular-nums text-[var(--text-body)]">
                            {m.bimbingan_count || 0}/8
                          </TableCell>
                          <TableCell data-label="Status" className="sm:text-right">
                            <StatusBadge status={m.status || 'active'} label={m.status || 'Aktif'} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Right Pane: Selected Student Detail Panel (PG-1) */}
          <Card
            variant="muted"
            data-testid="mahasiswa-detail-pane"
            className="min-w-0"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-strong)]">
                <User className="h-4 w-4 shrink-0" />
                <span>Detail Mahasiswa</span>
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Ringkasan progres bimbingan dan akses cepat tinjauan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedStudent ? (
                <EmptyState
                  icon={User}
                  title="Pilih mahasiswa"
                  description="Pilih salah satu mahasiswa dari daftar untuk melihat detail bimbingan."
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-strong)] break-words">
                          {selectedStudent.nama || '-'}
                        </h3>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-[var(--text-muted)]">
                          NPM: {selectedStudent.npm || '-'}
                        </p>
                      </div>
                      <StatusBadge
                        status={selectedStudent.status || 'active'}
                        label={selectedStudent.status || 'Aktif'}
                      />
                    </div>
                    <dl className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--line)] text-xs">
                      <div>
                        <dt className="text-[var(--text-muted)]">Jalur / Track</dt>
                        <dd className="mt-0.5 font-medium text-[var(--text-strong)]">
                          {selectedStudent.track || '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--text-muted)]">Sesi Disetujui</dt>
                        <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[var(--text-strong)]">
                          {selectedStudent.bimbingan_count || 0}/8 sesi
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* 8-Slot Progress */}
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-muted)]">Progres Logbook 8 Sesi</span>
                      <span className="font-mono font-semibold tabular-nums text-[var(--text-strong)]">
                        {Math.min(100, Math.round(((Number(selectedStudent.bimbingan_count) || 0) / 8) * 100))}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, Math.round(((Number(selectedStudent.bimbingan_count) || 0) / 8) * 100))}
                      aria-label={`Progres bimbingan ${selectedStudent.nama || 'mahasiswa'}`}
                    />
                    <div className="grid grid-cols-8 gap-1 pt-1">
                      {Array.from({ length: 8 }, (_, idx) => {
                        const done = idx < (Number(selectedStudent.bimbingan_count) || 0);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'h-2 rounded-sm',
                              done
                                ? 'bg-[hsl(var(--ctp-green))]'
                                : 'bg-[var(--surface-sunken)] border border-[var(--line)]'
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Review Actions */}
                  <div className="space-y-2">
                    <Button asChild variant="outline" size="sm" className="w-full justify-between">
                      <Link href={`/dashboard/${roleNamespace}/bimbingan-approve`}>
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Tinjau Logbook Bimbingan</span>
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full justify-between">
                      <Link href={`/dashboard/${roleNamespace}/laporan-approve`}>
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Tinjau Laporan Sidang</span>
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full justify-between">
                      <Link href={`/dashboard/${roleNamespace}/revisi-approve`}>
                        <span className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4" />
                          <span>Tinjau Revisi Sidang</span>
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
