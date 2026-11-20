'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Database, Settings, Shield, UserCog, Users } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState, ErrorState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuthStore } from '@/store/auth-store';
import { adminAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';

const FALLBACK_ROLE_DISTRIBUTION = [
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
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [widgetErrors, setWidgetErrors] = useState({
    stats: false,
    users: false,
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats().catch(() => ({ ok: false })),
        adminAPI.getAllUsers?.().catch(() => ({ ok: false })) ?? Promise.resolve({ ok: false }),
      ]);

      if (statsRes?.ok) {
        setStats(statsRes.data);
        setWidgetErrors((prev) => ({ ...prev, stats: false }));
      } else {
        setWidgetErrors((prev) => ({ ...prev, stats: true }));
      }

      if (usersRes?.ok) {
        const data = usersRes.data;
        const rows = Array.isArray(data)
          ? data
          : [...(data?.mahasiswa || []), ...(data?.dosen || [])];
        setUsers(rows);
        setWidgetErrors((prev) => ({ ...prev, users: false }));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role && role !== 'admin') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [loadDashboard, role, router]);

  const totalUsers = stats?.total_users || users.length || 0;
  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const totalDosen = stats?.total_dosen || 0;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [u.nama, u.email, u.npm, u.nidn]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    });
  }, [users, roleFilter, search]);

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard admin" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Admin · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Pengelolaan data utilitarian: direktori pengguna, filter peran, statistik sistem, dan master data dosen."
      />

      {/* Metric Strip */}
      <div
        data-testid="admin-metric-strip"
        data-source="adminAPI.getStats"
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

      {/* DB-6: Utilitarian User & Role Management Table directly on Admin Dashboard */}
      <Card variant="muted" data-testid="admin-quick-users-card" data-source="adminAPI.getAllUsers">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Shield className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>Direktori Cepat Pengguna & Role</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Cari dan filter pengguna lintas peran, atau buka Kelola Users untuk aksi edit profil dan reset password.
            </CardDescription>
            <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Filter cepat role">
              {['all', 'mahasiswa', 'dosen', 'koordinator', 'kaprodi', 'admin'].map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="xs"
                  variant={roleFilter === r ? 'default' : 'outline'}
                  aria-pressed={roleFilter === r}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'all' ? 'Semua' : r.charAt(0).toUpperCase() + r.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <Field label="Cari pengguna">
                {(a11y) => (
                  <Input
                    {...a11y}
                    name="adminDashboardSearch"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nama, email, NPM, NIDN..."
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                  />
                )}
              </Field>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/dashboard/admin/kelola-users">
                <span>Kelola Lengkap</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Tidak ada ringkasan pengguna pada filter ini"
              description="Buka menu Kelola Users untuk mengelola seluruh akun pengguna dan peran."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/admin/kelola-users">Buka Kelola Users</Link>
                </Button>
              }
            />
          ) : (
            <Table stackOnMobile density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama & Email</TableHead>
                  <TableHead className="w-[130px]">Role</TableHead>
                  <TableHead className="w-[150px]">NPM / NIDN</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.slice(0, 6).map((u, idx) => (
                  <TableRow key={u.id || idx}>
                    <TableCell data-label="Nama & Email" className="whitespace-normal break-words">
                      <p className="font-medium text-[var(--text-strong)]">{u.nama || '-'}</p>
                      <p className="text-xs text-[var(--text-muted)] break-all">{u.email || '-'}</p>
                    </TableCell>
                    <TableCell data-label="Role">
                      <Badge variant="outline" className="capitalize">
                        {u.role || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell data-label="NPM / NIDN" className="font-mono text-xs tabular-nums text-[var(--text-body)]">
                      {u.npm || u.nidn || '-'}
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge
                        status={u.is_active !== false ? 'active' : 'revoked'}
                        label={u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      />
                    </TableCell>
                    <TableCell data-label="Aksi" className="sm:text-right">
                      <Button asChild variant="outline" size="xs">
                        <Link href="/dashboard/admin/kelola-users">Kelola</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chart + System Operational Metrics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card variant="muted" className="xl:col-span-2 min-w-0" data-source="adminAPI.getStats">
          <CardHeader>
            <CardTitle className="text-[var(--text-strong)]">Distribusi Role Pengguna</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Jumlah pengguna per role di sistem (satuan: Pengguna).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {widgetErrors.stats ? (
              <ErrorState title="Statistik distribusi role gagal dimuat" onRetry={loadDashboard} />
            ) : (
              <>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={FALLBACK_ROLE_DISTRIBUTION} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
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
                      <Bar dataKey="v" name="Pengguna" fill="hsl(var(--ctp-blue)/0.75)" radius={[6, 6, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Contoh data</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="muted" className="min-w-0" data-source="adminAPI.getStats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Database className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <span>Ringkasan Operasional</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Status antrean akademik dan akun sistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
              {[
                { label: 'Proposal Menunggu', val: stats?.proposal_pending ?? 0 },
                { label: 'Bimbingan Aktif', val: stats?.bimbingan_aktif ?? 0 },
                { label: 'Laporan Menunggu', val: stats?.laporan_pending ?? 0 },
                { label: 'Sidang Terjadwal', val: stats?.sidang_scheduled ?? 0 },
                { label: 'Akun Nonaktif', val: stats?.users_inactive ?? 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="font-mono font-medium tabular-nums text-[var(--text-strong)]">{item.val}</span>
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
            desc: 'Kelola semua pengguna dan peran sistem',
            href: '/dashboard/admin/kelola-users',
            icon: Users,
          },
          {
            title: 'Kelola Dosen',
            desc: 'Kelola data master dosen pembimbing',
            href: '/dashboard/admin/kelola-dosen',
            icon: UserCog,
          },
          {
            title: 'Pengaturan',
            desc: 'Konfigurasi sistem dan akun',
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
