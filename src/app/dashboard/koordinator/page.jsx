'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Users,
} from 'lucide-react';
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
import { useAuthStore } from '@/store/auth-store';
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const stageData = [
  { name: 'Proposal', v: 12 },
  { name: 'Validasi', v: 8 },
  { name: 'Assign', v: 6 },
  { name: 'Aktif', v: 15 },
  { name: 'Selesai', v: 4 },
];

export default function KoordinatorDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'koordinator') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [role, router]);

  const loadDashboard = async () => {
    try {
      const res = await koordinatorAPI.getStats();
      if (res.ok) setStats(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalProposals = stats?.total_proposal || 0;
  const pendingProposals = stats?.pending_proposal || 0;
  const validatedProposals = Math.max(0, totalProposals - pendingProposals);
  const validatedPct = totalProposals > 0 ? Math.round((validatedProposals / totalProposals) * 100) : 0;
  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const assignedDosen = stats?.assigned_dosen || 0;

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard koordinator" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Koordinator · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Pantau validasi proposal, penugasan pembimbing, dan penjadwalan sidang program studi."
      />

      {/* Metric Strip */}
      <div
        data-testid="koordinator-metric-strip"
        className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden"
      >
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Proposal</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalProposals}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Proposal Menunggu</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {pendingProposals}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Mahasiswa Aktif</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalMahasiswa}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Dosen Pembimbing</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {assignedDosen}
          </p>
        </div>
      </div>

      {/* Chart + Compliance */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card variant="muted" className="xl:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle className="text-[var(--text-strong)]">Distribusi Tahap Mahasiswa</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Sebaran status dari proposal hingga selesai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
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
                  <Bar dataKey="v" fill="hsl(var(--ctp-blue)/0.65)" radius={[8, 8, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Contoh data</p>
          </CardContent>
        </Card>

        <Card variant="muted" className="min-w-0">
          <CardHeader>
            <CardTitle className="text-[var(--text-strong)]">Kepatuhan Validasi</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Progres pemeriksaan proposal yang sudah masuk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
              <div className="flex items-center justify-between text-sm text-[var(--text-strong)]">
                <span className="text-[var(--text-muted)]">Proposal tervalidasi</span>
                <span className="font-mono font-semibold tabular-nums">{validatedPct}%</span>
              </div>
              <Progress
                value={validatedPct}
                aria-label="Persentase proposal tervalidasi"
                aria-valuenow={validatedPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
              <div className="bg-[var(--surface-raised)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Perlu validasi</p>
                <p className="mt-1 text-lg font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
                  {pendingProposals}
                </p>
              </div>
              <div className="bg-[var(--surface-raised)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Tervalidasi</p>
                <p className="mt-1 text-lg font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
                  {validatedProposals}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: 'Validasi Proposal',
            desc: 'Tinjau dan setujui proposal masuk',
            href: '/dashboard/koordinator/validasi-proposal',
            icon: FileText,
          },
          {
            title: 'Assign Pembimbing',
            desc: 'Tetapkan dosen pembimbing mahasiswa',
            href: '/dashboard/koordinator/approve-pembimbing',
            icon: Users,
          },
          {
            title: 'Jadwal Sidang',
            desc: 'Atur jadwal dan penguji sidang',
            href: '/dashboard/koordinator/jadwal-sidang',
            icon: CalendarDays,
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
