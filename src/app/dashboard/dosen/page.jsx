'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  RefreshCw,
  Users,
} from 'lucide-react';
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
import { EmptyState, ErrorState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { dosenAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { formatAcademicDate } from '@/lib/status-tone';

const PENDING_BIMBINGAN = new Set(['pending', 'waiting', 'menunggu']);
const PENDING_LAPORAN = new Set(['submitted', 'pending', 'waiting', 'menunggu']);

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function parseTimestamp(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function buildQueueItems({ bimbinganList, laporanList, stats, roleNamespace }) {
  const items = [];

  (Array.isArray(laporanList) ? laporanList : []).forEach((item) => {
    const status = normalizeStatus(item?.status);
    if (!PENDING_LAPORAN.has(status)) return;
    const rawDate = item?.submitted_at || item?.created_at || item?.updated_at || item?.tanggal;
    const isProyek = String(item?.track || '').toLowerCase().includes('proyek');
    const name = isProyek
      ? (item?.kelompok_nama || item?.mahasiswa_nama || 'Kelompok Proyek')
      : (item?.mahasiswa_nama || '-');

    items.push({
      key: `laporan-${item?.id || name}-${rawDate || ''}`,
      type: 'laporan',
      typeLabel: 'Laporan Sidang',
      priorityRank: 0,
      timestamp: parseTimestamp(rawDate),
      dateLabel: rawDate ? formatAcademicDate(rawDate) : 'Menunggu',
      title: name,
      detail: item?.judul || 'Menunggu persetujuan laporan sidang',
      meta: item?.mahasiswa_npm || item?.npm || (isProyek ? 'Kelompok Proyek' : '-'),
      status: status || 'pending',
      href: `/dashboard/${roleNamespace}/laporan-approve`,
      actionLabel: 'Tinjau Laporan',
    });
  });

  (Array.isArray(bimbinganList) ? bimbinganList : []).forEach((item, idx) => {
    const status = normalizeStatus(item?.status);
    if (!PENDING_BIMBINGAN.has(status)) return;
    const rawDate = item?.created_at || item?.tanggal;
    const isProyek = String(item?.track || '').toLowerCase().includes('proyek') && Boolean(item?.kelompok_id);
    const name = isProyek
      ? (item?.kelompok_nama || `Kelompok ${item.kelompok_id}`)
      : (item?.mahasiswa_nama || '-');

    items.push({
      key: `bimbingan-${item?.id || name}-${rawDate || ''}`,
      type: 'bimbingan',
      typeLabel: 'Logbook Bimbingan',
      priorityRank: 1,
      timestamp: parseTimestamp(rawDate),
      dateLabel: rawDate || item?.tanggal ? formatAcademicDate(rawDate || item?.tanggal) : 'Menunggu',
      title: name,
      detail: item?.topik || item?.kegiatan || `Catatan Bimbingan ke-${item?.minggu_ke || idx + 1}`,
      meta: `Bimbingan ke-${item?.minggu_ke || idx + 1}${item?.npm ? ` · ${item.npm}` : ''}`,
      status: status || 'pending',
      href: `/dashboard/${roleNamespace}/bimbingan-approve`,
      actionLabel: 'Tinjau Bimbingan',
    });
  });

  items.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.priorityRank - b.priorityRank;
  });

  if (items.length > 0) return items;

  const pendingLaporan = Number(stats?.pending_laporan) || 0;
  const pendingBimbingan = Number(stats?.pending_bimbingan) || 0;

  if (pendingLaporan > 0) {
    items.push({
      key: 'summary-laporan',
      type: 'laporan',
      typeLabel: 'Laporan Sidang',
      priorityRank: 0,
      timestamp: 0,
      dateLabel: 'Menunggu',
      title: `${pendingLaporan} laporan sidang menunggu persetujuan`,
      detail: 'Tinjau berkas laporan dan luaran proyek sebelum penjadwalan sidang.',
      meta: 'Prioritas Sidang',
      status: 'pending',
      href: `/dashboard/${roleNamespace}/laporan-approve`,
      actionLabel: 'Buka Antrean Laporan',
    });
  }

  if (pendingBimbingan > 0) {
    items.push({
      key: 'summary-bimbingan',
      type: 'bimbingan',
      typeLabel: 'Logbook Bimbingan',
      priorityRank: 1,
      timestamp: 1,
      dateLabel: 'Menunggu',
      title: `${pendingBimbingan} sesi bimbingan menunggu persetujuan`,
      detail: 'Verifikasi catatan logbook bimbingan mahasiswa agar progres 8 sesi tetap berjalan.',
      meta: 'Antrean Bimbingan',
      status: 'pending',
      href: `/dashboard/${roleNamespace}/bimbingan-approve`,
      actionLabel: 'Buka Antrean Bimbingan',
    });
  }

  return items;
}

export default function DosenDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState('all');
  const [widgetErrors, setWidgetErrors] = useState({
    queue: false,
    mahasiswa: false,
  });

  const roleNamespace = useMemo(() => {
    const segments = String(pathname || '').split('/').filter(Boolean);
    return segments[1] || 'dosen';
  }, [pathname]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, mhsRes, bimbinganRes, laporanRes] = await Promise.all([
        dosenAPI.getStats().catch(() => ({ ok: false })),
        dosenAPI.getMahasiswaBimbingan().catch(() => ({ ok: false })),
        dosenAPI.getBimbinganList().catch(() => ({ ok: false })),
        dosenAPI.getLaporanList().catch(() => ({ ok: false })),
      ]);

      if (statsRes?.ok) setStats(statsRes.data);
      if (mhsRes?.ok) {
        setMahasiswaList(Array.isArray(mhsRes.data) ? mhsRes.data : mhsRes.data?.data || []);
        setWidgetErrors((prev) => ({ ...prev, mahasiswa: false }));
      } else {
        setWidgetErrors((prev) => ({ ...prev, mahasiswa: true }));
      }

      if (bimbinganRes?.ok) {
        setBimbinganList(Array.isArray(bimbinganRes.data) ? bimbinganRes.data : bimbinganRes.data?.data || []);
      }
      if (laporanRes?.ok) {
        setLaporanList(Array.isArray(laporanRes.data) ? laporanRes.data : laporanRes.data?.data || []);
      }
      setWidgetErrors((prev) => ({
        ...prev,
        queue: !statsRes?.ok && !bimbinganRes?.ok && !laporanRes?.ok,
      }));
    } catch (err) {
      console.error('Error loading dosen dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role && !['dosen', 'penguji'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [loadDashboard, role, router]);

  const queueItems = useMemo(
    () => buildQueueItems({ bimbinganList, laporanList, stats, roleNamespace }),
    [bimbinganList, laporanList, stats, roleNamespace]
  );

  const filteredQueueItems = useMemo(() => {
    if (queueFilter === 'all') return queueItems;
    return queueItems.filter((item) => item.type === queueFilter);
  }, [queueItems, queueFilter]);

  const totalMhs = stats?.total_mahasiswa ?? mahasiswaList.length ?? 0;
  const pendingBimbingan =
    stats?.pending_bimbingan ??
    bimbinganList.filter((b) => PENDING_BIMBINGAN.has(normalizeStatus(b?.status))).length;
  const pendingLaporan =
    stats?.pending_laporan ??
    laporanList.filter((l) => PENDING_LAPORAN.has(normalizeStatus(l?.status))).length;
  const mingguIni = stats?.bimbingan_minggu_ini ?? 0;

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard dosen" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Dosen · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Inbox kerja dosen: tinjau antrean logbook bimbingan dan laporan sidang dari pengajuan terlama."
      >
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/${roleNamespace}/bimbingan-approve`}>
              <MessageSquare className="h-4 w-4" />
              <span>Approve Bimbingan</span>
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/dashboard/${roleNamespace}/laporan-approve`}>
              <FileText className="h-4 w-4" />
              <span>Approve Laporan</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* DB-2: High-density Queue-first Inbox */}
      <Card variant="muted" data-testid="dosen-queue-card" data-source="dosenAPI.getBimbinganList + dosenAPI.getLaporanList">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <span>Antrean Tinjauan Teratas</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Diurutkan dari pengajuan terlama agar proses ACC dan revisi mahasiswa tidak tertunda.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0" role="group" aria-label="Filter kategori antrean">
            {[
              { id: 'all', label: `Semua (${queueItems.length})` },
              { id: 'bimbingan', label: 'Logbook' },
              { id: 'laporan', label: 'Laporan' },
            ].map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="xs"
                variant={queueFilter === tab.id ? 'default' : 'outline'}
                aria-pressed={queueFilter === tab.id}
                onClick={() => setQueueFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
            <span className="rounded-md border border-[var(--line)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-medium text-[var(--text-body)] font-mono tabular-nums">
              {queueItems.length} menunggu
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {widgetErrors.queue ? (
            <ErrorState
              title="Antrean tinjauan gagal dimuat"
              description="Data antrean logbook dan laporan belum dapat diambil. Widget lain tetap dapat digunakan."
              onRetry={loadDashboard}
            />
          ) : filteredQueueItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Semua antrean sudah ditinjau"
              description="Tidak ada catatan logbook bimbingan atau laporan sidang yang menunggu persetujuan saat ini."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/${roleNamespace}/bimbingan-approve`}>Riwayat Bimbingan</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/${roleNamespace}/laporan-approve`}>Riwayat Laporan</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
              {filteredQueueItems.slice(0, 8).map((item, idx) => (
                <div
                  key={item.key}
                  data-testid="dosen-queue-item"
                  className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-muted)]">
                        #{idx + 1}
                      </span>
                      <span className="rounded-md border border-[var(--line)] bg-[var(--surface-sunken)] px-2 py-0.5 text-xs font-medium text-[var(--text-strong)]">
                        {item.typeLabel}
                      </span>
                      <StatusBadge status={item.status} label="Menunggu" />
                      <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {item.dateLabel}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-strong)] break-words">
                      {item.title}
                    </p>
                    <p className="text-sm text-[var(--text-body)] break-words">
                      {item.detail}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums break-words">
                      {item.meta}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                      <Link href={item.href}>
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bordered Metric Strip (no icon tiles, no fabricated deltas) */}
      <div
        data-testid="dosen-metric-strip"
        data-source="dosenAPI.getStats"
        className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden"
      >
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Bimbingan Menunggu</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {pendingBimbingan}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Laporan Menunggu</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {pendingLaporan}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Mahasiswa Bimbingan</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalMhs}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Sesi Minggu Ini</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {mingguIni}
          </p>
        </div>
      </div>

      {/* High-density Supervised-student summary (44px compact rows per §6.6 & §8) */}
      <Card variant="muted" data-testid="dosen-students-card" data-source="dosenAPI.getMahasiswaBimbingan">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Users className="h-4 w-4 shrink-0" />
              <span>Ringkasan Mahasiswa Bimbingan</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Progres logbook 8 sesi dan status akademik mahasiswa bimbingan Anda.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
            <Link href={`/dashboard/${roleNamespace}/mahasiswa-bimbingan`}>
              <span>Lihat Semua</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {widgetErrors.mahasiswa ? (
            <ErrorState
              title="Daftar mahasiswa bimbingan gagal dimuat"
              description="Tidak dapat memuat daftar mahasiswa saat ini."
              onRetry={loadDashboard}
            />
          ) : mahasiswaList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada mahasiswa bimbingan"
              description="Daftar mahasiswa bimbingan akan muncul setelah penempatan pembimbing oleh koordinator."
            />
          ) : (
            <Table stackOnMobile density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead className="w-[120px]">NPM</TableHead>
                  <TableHead className="w-[140px]">Track</TableHead>
                  <TableHead className="w-[120px]">Logbook</TableHead>
                  <TableHead className="w-[130px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mahasiswaList.slice(0, 6).map((m, i) => {
                  const count = Number(m.bimbingan_count) || 0;
                  return (
                    <TableRow key={m.id || i}>
                      <TableCell data-label="Mahasiswa" className="font-medium text-[var(--text-strong)] whitespace-normal break-words">
                        {m.nama || `Mahasiswa ${i + 1}`}
                      </TableCell>
                      <TableCell data-label="NPM" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                        {m.npm || '-'}
                      </TableCell>
                      <TableCell data-label="Track" className="text-sm text-[var(--text-body)]">
                        {m.track || '-'}
                      </TableCell>
                      <TableCell data-label="Logbook" className="font-mono text-xs tabular-nums text-[var(--text-body)]">
                        {count}/8 sesi
                      </TableCell>
                      <TableCell data-label="Status" className="sm:text-right">
                        <StatusBadge
                          status={count >= 8 ? 'completed' : m.status || 'active'}
                          label={count >= 8 ? 'Selesai' : m.status || 'Aktif'}
                        />
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
