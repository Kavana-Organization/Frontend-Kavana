'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
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
import { dosenAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

export default function MahasiswaBimbinganPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['mahasiswa-bimbingan'] || 'Mahasiswa Bimbingan';
  }, [pathname]);

  useEffect(() => {
    if (role && !['dosen', 'penguji', 'koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const res = await dosenAPI.getMahasiswaBimbingan();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = list.filter(
    (m) =>
      !search ||
      (m.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.npm || '').includes(search)
  );

  if (loading) {
    return <LoadingState variant="table" label="Memuat daftar mahasiswa bimbingan" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Pantau progres bimbingan dan jalur akademik mahasiswa bimbingan Anda."
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
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-mauve))] font-mono tabular-nums">
            {list.filter((m) => m.track?.includes('internship')).length}
          </p>
        </div>
      </div>

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <Users className="h-4 w-4 shrink-0" />
            <span>Daftar Mahasiswa</span>
          </CardTitle>
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
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead className="w-[120px]">NPM</TableHead>
                  <TableHead className="w-[150px]">Track</TableHead>
                  <TableHead className="w-[110px]">Bimbingan</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m, i) => (
                  <TableRow key={m.id || i}>
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
                    <TableCell data-label="Status">
                      <StatusBadge status={m.status || 'active'} label={m.status || 'Aktif'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
