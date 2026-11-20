'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState, ErrorState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI } from '@/lib/api';

export default function MonitoringPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'board' (PG-2)

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await kaprodiAPI.getStats?.()) || { ok: true, data: {} };
      if (res.ok) {
        setStats(res.data || {});
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
    if (role && !['kaprodi', 'koordinator'].includes(role)) {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [loadData, role, router]);

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat data monitoring program studi" />;
  }

  const byStatus = stats?.by_status || {};
  const totalMahasiswa = Number(stats?.total_mahasiswa) || 0;
  const totalDosen = Number(stats?.total_dosen) || 0;
  const belumTrack = Number(byStatus['Menunggu Track'] ?? stats?.belum_track) || 0;
  const sudahTrack = Number(stats?.proyek) + Number(stats?.internship) || Math.max(0, totalMahasiswa - belumTrack);
  const proposalPending = Number(byStatus['Proposal Pending'] ?? stats?.proposal_pending) || 0;
  const dalamBimbingan = Number(byStatus['Sedang Bimbingan'] ?? stats?.dalam_bimbingan) || 0;
  const siapSidang = Number(byStatus['Siap Sidang'] ?? stats?.siap_sidang) || 0;
  const lulus = Number(byStatus['Lulus'] ?? stats?.lulus_semester_ini ?? stats?.lulus) || 0;
  const kelulusan = totalMahasiswa ? Math.round((lulus / totalMahasiswa) * 100) : 0;

  const stages = [
    { name: 'Belum Track', count: belumTrack, total: totalMahasiswa || 1, status: 'pending', label: 'Menunggu' },
    { name: 'Memilih Track', count: sudahTrack, total: totalMahasiswa || 1, status: 'terjadwal', label: 'Terjadwal' },
    { name: 'Proposal Pending', count: proposalPending, total: totalMahasiswa || 1, status: 'pending', label: 'Menunggu' },
    { name: 'Sedang Bimbingan', count: dalamBimbingan, total: totalMahasiswa || 1, status: 'active', label: 'Aktif' },
    { name: 'Siap Sidang', count: siapSidang, total: totalMahasiswa || 1, status: 'approved', label: 'ACC' },
    { name: 'Lulus', count: lulus, total: totalMahasiswa || 1, status: 'completed', label: 'Selesai' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Progres Mahasiswa Prodi"
        subtitle="Pantau sebaran tahap alur bimbingan mahasiswa dari pemilihan track hingga sidang selesai."
      >
        {/* PG-2: Tabel Status vs Board Toggle */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Mode tampilan alur bimbingan">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'outline'}
            aria-pressed={viewMode === 'table'}
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
            <span>Tabel Status</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'board' ? 'default' : 'outline'}
            aria-pressed={viewMode === 'board'}
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Board Tahapan</span>
          </Button>
        </div>
      </PageHeader>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Mahasiswa</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalMahasiswa}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Dosen</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {totalDosen}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)]">Tingkat Kelulusan</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {kelulusan}%
          </p>
        </div>
      </div>

      {loadError ? (
        <ErrorState
          title="Gagal memuat data monitoring prodi"
          description="Terjadi kendala saat mengambil statistik monitoring mahasiswa."
          onRetry={loadData}
        />
      ) : (
        <Card variant="muted" data-testid="monitoring-stages-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Rekap Progres Tahap Mahasiswa</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Persentase mahasiswa pada setiap tahap alur proyek dan internship.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalMahasiswa === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Belum ada data monitoring mahasiswa untuk dipantau"
                description="Rekap progres tahap akademik akan tampil setelah terdapat mahasiswa aktif di program studi."
              />
            ) : viewMode === 'board' ? (
              <div
                data-testid="monitoring-stage-board"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {stages.map((s, idx) => {
                  const pct = Math.min(100, Math.max(0, Math.round((s.count / s.total) * 100)));
                  return (
                    <div
                      key={s.name}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                          Tahap 0{idx + 1}
                        </span>
                        <StatusBadge status={s.status} label={s.label} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-strong)]">{s.name}</p>
                        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[var(--text-strong)]">
                          {s.count}{' '}
                          <span className="text-xs font-normal text-[var(--text-muted)]">
                            mahasiswa ({pct}%)
                          </span>
                        </p>
                      </div>
                      <Progress
                        value={pct}
                        aria-label={`Progres ${s.name}`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {stages.map((s) => {
                  const pct = Math.min(100, Math.max(0, Math.round((s.count / s.total) * 100)));
                  return (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--text-strong)]">{s.name}</span>
                          <StatusBadge status={s.status} label={s.label} />
                        </div>
                        <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                          {s.count} mahasiswa ({pct}%)
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        aria-label={`Progres ${s.name}`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
