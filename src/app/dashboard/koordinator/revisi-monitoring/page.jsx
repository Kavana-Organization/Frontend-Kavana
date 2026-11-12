'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const STATUS_BADGE_MAP = {
  belum_submit: { status: 'belum_submit', label: 'Belum Submit' },
  pending: { status: 'pending', label: 'Menunggu Review' },
  approved: { status: 'approved', label: 'Disetujui' },
  rejected: { status: 'rejected', label: 'Ditolak' },
  needs_revision: { status: 'lulus_revisi', label: 'Perlu Diperbaiki' },
};

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'belum_submit', label: 'Belum Submit' },
  { id: 'pending', label: 'Menunggu Review' },
  { id: 'approved', label: 'Approved' },
];

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function MonitoringRevisiPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [tab, setTab] = useState('all');

  const pageTitle = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    const segment = segments[segments.length - 1];
    return TITLE_MAP[segment] || TITLE_MAP['revisi-monitoring'] || 'Monitoring Revisi';
  }, [pathname]);

  useEffect(() => {
    if (role && !['koordinator', 'kaprodi'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await koordinatorAPI.getRevisiMonitoring();
      if (res.ok) setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (tab === 'all') return list;
    return list.filter((row) => String(row.revisi_status || '').toLowerCase() === tab);
  }, [list, tab]);

  const counts = useMemo(() => {
    const c = { belum_submit: 0, pending: 0, approved: 0, rejected: 0, needs_revision: 0 };
    for (const row of list) {
      const s = String(row.revisi_status || 'belum_submit').toLowerCase();
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [list]);

  if (loading) {
    return <LoadingState variant="table" label="Memuat monitoring revisi" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle="Pantau progres revisi pascasidang mahasiswa atau kelompok yang lulus dengan revisi."
      />

      <Card variant="muted">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Monitoring Revisi Sidang</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Status revisi pasca sidang dari mahasiswa/kelompok yang lulus dengan revisi.
            </CardDescription>
          </div>
          <div role="group" aria-label="Filter status revisi" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const active = tab === t.id;
              const count = t.id === 'all' ? list.length : (counts[t.id] || 0);
              return (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  aria-pressed={active}
                  onClick={() => setTab(t.id)}
                >
                  <span>{t.label}</span>
                  <span className="font-mono text-xs tabular-nums opacity-95">({count})</span>
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Tidak ada data pada filter ini"
              description="Belum ada pengajuan revisi sidang dengan status yang dipilih."
            />
          ) : (
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa / Kelompok</TableHead>
                  <TableHead>Judul Proyek</TableHead>
                  <TableHead>Pembimbing</TableHead>
                  <TableHead className="w-[100px]">Ronde</TableHead>
                  <TableHead className="w-[160px]">Last Submit</TableHead>
                  <TableHead className="w-[160px]">Last Review</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, idx) => {
                  const keyStatus = String(row.revisi_status || 'belum_submit').toLowerCase();
                  const badgeInfo = STATUS_BADGE_MAP[keyStatus] || STATUS_BADGE_MAP.belum_submit;

                  return (
                    <TableRow key={`${row.kelompok_id || row.mahasiswa_id || idx}:${row.sidang_id}`}>
                      <TableCell data-label="Mahasiswa / Kelompok" className="whitespace-normal break-words font-medium text-[var(--text-strong)]">
                        {row.display_nama || '-'}
                      </TableCell>
                      <TableCell data-label="Judul Proyek" className="whitespace-normal break-words text-[var(--text-body)]">
                        {row.judul_proyek || '-'}
                      </TableCell>
                      <TableCell data-label="Pembimbing" className="whitespace-normal break-words text-sm text-[var(--text-body)]">
                        {row.dosen_nama || '-'}
                      </TableCell>
                      <TableCell data-label="Ronde" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        Ronde {row.revisi_round || 0}
                      </TableCell>
                      <TableCell data-label="Last Submit" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {formatDateTime(row.last_submitted_at)}
                      </TableCell>
                      <TableCell data-label="Last Review" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {formatDateTime(row.last_reviewed_at)}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge status={badgeInfo.status} label={badgeInfo.label} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
