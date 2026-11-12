'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Database, Settings, UserCog, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
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
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const roleDistribution = [
  { name: 'Admin', v: 2 },
  { name: 'Kaprodi', v: 1 },
  { name: 'Koordinator', v: 3 },
  { name: 'Dosen', v: 12 },
  { name: 'Mahasiswa', v: 148 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'admin') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [role, router]);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getStats();
      if (res.ok) setStats(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = stats?.total_users || 0;
  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const totalDosen = stats?.total_dosen || 0;

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard admin" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Admin · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Pantau statistik pengguna, kondisi layanan sistem, dan akses cepat pengelolaan akun."
      />

      {/* Metric Strip */}
      <div
        data-testid="admin-metric-strip"
        className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden"
      >
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Users</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalUsers}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Mahasiswa</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-blue))] font-mono tabular-nums">
            {totalMahasiswa}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Dosen</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {totalDosen}
          </p>
        </div>
        <div className="bg-[var(--surface-raised)] p-4 sm:p-5 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Status Sistem</p>
          <div className="mt-2">
            <StatusBadge status="active" label="OK" />
          </div>
        </div>
      </div>

      {/* Chart + System info */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card variant="muted" className="xl:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle className="text-[var(--text-strong)]">Distribusi Role Pengguna</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Jumlah pengguna per role di sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistribution} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
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
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Database className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>System Info</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Status dan informasi sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3.5">
              <div className="flex items-center justify-between gap-2 text-sm text-[var(--text-strong)]">
                <span className="text-[var(--text-muted)]">Uptime</span>
                <span className="font-mono font-semibold tabular-nums text-[hsl(var(--ctp-green))]">
                  99.9%
                </span>
              </div>
              <Progress
                value={99.9}
                aria-label="Persentase uptime sistem"
                aria-valuenow={99.9}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2"
              />
            </div>

            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
              {[
                { label: 'API Version', val: 'v1.0' },
                { label: 'Env', val: 'Production' },
                { label: 'Database', val: 'MySQL' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="font-mono font-medium text-[var(--text-strong)]">{item.val}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: 'Kelola Users',
            desc: 'Manage semua pengguna sistem',
            href: '/dashboard/admin/kelola-users',
            icon: Users,
          },
          {
            title: 'Kelola Dosen',
            desc: 'Manage data dosen pembimbing',
            href: '/dashboard/admin/kelola-dosen',
            icon: UserCog,
          },
          {
            title: 'Pengaturan',
            desc: 'Konfigurasi sistem dan setting',
            href: '/dashboard/settings',
            icon: Settings,
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
