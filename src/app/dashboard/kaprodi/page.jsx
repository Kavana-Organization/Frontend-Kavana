'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { kaprodiAPI } from '@/lib/api';

export default function KaprodiDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [totalKoordinator, setTotalKoordinator] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'kaprodi') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [role, router]);

  const loadDashboard = async () => {
    try {
      const [statsRes, koordinatorRes] = await Promise.all([
        kaprodiAPI.getStats(),
        kaprodiAPI.getKoordinatorList(),
      ]);

      if (statsRes.ok) setStats(statsRes.data);
      if (koordinatorRes.ok) {
        const koordinatorList = Array.isArray(koordinatorRes.data) ? koordinatorRes.data : [];
        const activeKoordinator = koordinatorList.filter((k) => Boolean(k?.is_koordinator)).length;
        setTotalKoordinator(activeKoordinator);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const totalDosen = stats?.total_dosen || 0;
  const lulusSemesterIni = stats?.lulus_semester_ini || 0;
  const kelulusan = totalMahasiswa ? Math.round((lulusSemesterIni / totalMahasiswa) * 100) : 0;

  const trendData = useMemo(() => {
    const byAngkatan = stats?.by_angkatan || {};
    return Object.entries(byAngkatan)
      .map(([angkatan, count]) => ({ name: String(angkatan), v: Number(count) || 0 }))
      .sort((a, b) => Number(a.name) - Number(b.name));
  }, [stats]);

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard kepala prodi" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Kepala Prodi · Monitoring & Rekap Prodi"
        subtitle="Pantau capaian kelulusan, sebaran angkatan, dan penugasan koordinator program studi."
      />

      {/* Metric Strip */}
      <div
        data-testid="kaprodi-metric-strip"
        className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden"
      >
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Mahasiswa</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalMahasiswa}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Dosen Pembimbing</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {totalDosen}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Koordinator Aktif</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalKoordinator}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Tingkat Kelulusan</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {kelulusan}%
          </p>
        </div>
      </div>

      {/* Chart + Overview */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card variant="muted" className="xl:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle className="text-[var(--text-strong)]">Rekap Distribusi Angkatan</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Jumlah mahasiswa aktif per angkatan yang tercatat pada sistem prodi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Belum ada data sebaran angkatan untuk dipantau"
                description="Grafik distribusi angkatan akan tampil otomatis setelah data mahasiswa termuat."
              />
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="v" fill="hsl(var(--ctp-sapphire)/0.65)" radius={[8, 8, 4, 4]} maxBarSize={96} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="muted" className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Rekap Program Studi</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Ringkasan pengawasan akademik semester berjalan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
              <div className="flex items-center justify-between text-sm text-[var(--text-strong)]">
                <span className="text-[var(--text-muted)]">Tingkat kelulusan</span>
                <span className="font-mono font-semibold tabular-nums">{kelulusan}%</span>
              </div>
              <Progress
                value={kelulusan}
                aria-label="Tingkat kelulusan program studi"
                aria-valuenow={kelulusan}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2"
              />
            </div>

            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
              {[
                { label: 'Mahasiswa Terdaftar', val: totalMahasiswa },
                { label: 'Dosen Pembimbing', val: totalDosen },
                { label: 'Koordinator Aktif', val: totalKoordinator },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 px-3.5 py-3">
                  <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-base font-semibold text-[var(--text-strong)] font-mono tabular-nums">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: 'Kelola Koordinator',
            desc: 'Tetapkan koordinator semester dan validasi wewenang',
            href: '/dashboard/kaprodi/kelola-koordinator',
            icon: Shield,
          },
          {
            title: 'Rekap & Daftar Dosen',
            desc: 'Pantau beban bimbingan dosen program studi',
            href: '/dashboard/kaprodi/daftar-dosen',
            icon: Users,
          },
          {
            title: 'Monitoring Mahasiswa',
            desc: 'Pantau progres tahap akademik seluruh mahasiswa',
            href: '/dashboard/kaprodi/monitoring',
            icon: BarChart3,
          },
        ].map((action) => (
          <Link key={action.title} href={action.href} className="block min-w-0">
            <Card variant="muted" className="h-full transition-colors hover:border-[var(--accent)]">
              <CardContent className="flex items-center justify-between gap-3 pt-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-strong)]">
                    <action.icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    <span className="truncate">{action.title}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] break-words">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
