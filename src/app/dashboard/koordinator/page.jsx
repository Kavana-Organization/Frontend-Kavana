'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FileText,
  UserCheck,
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
import { Button } from '@/components/ui/button';
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
import { koordinatorAPI } from '@/lib/api';
import { TITLE_MAP } from '@/lib/constants';
import { formatAcademicDate } from '@/lib/status-tone';

const FALLBACK_STAGE_DATA = [
  { name: 'Proposal', v: 12 },
  { name: 'Validasi', v: 8 },
  { name: 'Assign', v: 6 },
  { name: 'Aktif', v: 15 },
  { name: 'Selesai', v: 4 },
];

function detectSidangConflicts(sidangList = []) {
  const active = (Array.isArray(sidangList) ? sidangList : []).filter(
    (s) => String(s?.status || 'scheduled').toLowerCase() !== 'completed'
  );
  const slotMap = new Map();
  const conflicts = [];

  for (const item of active) {
    const dateKey = String(item?.tanggal || '').slice(0, 10);
    const timeKey = String(item?.waktu || '').slice(0, 5);
    if (!dateKey || !timeKey) continue;

    const roomKey = `room:${dateKey}:${timeKey}:${String(item?.ruangan || '').toLowerCase()}`;
    const pengujiKey = item?.penguji_id ? `penguji:${dateKey}:${timeKey}:${item.penguji_id}` : null;

    if (item?.ruangan && slotMap.has(roomKey)) {
      conflicts.push({
        id: `${item.id}-room`,
        reason: `Bentrok ruangan ${item.ruangan} pada ${formatAcademicDate(dateKey)} ${timeKey} WIB`,
        mahasiswa: item.mahasiswa_nama || item.display_nama || '-',
      });
    } else if (item?.ruangan) {
      slotMap.set(roomKey, item);
    }

    if (pengujiKey && slotMap.has(pengujiKey)) {
      conflicts.push({
        id: `${item.id}-penguji`,
        reason: `Penguji ${item.penguji_nama || ''} terjadwal ganda pada ${formatAcademicDate(dateKey)} ${timeKey} WIB`,
        mahasiswa: item.mahasiswa_nama || item.display_nama || '-',
      });
    } else if (pengujiKey) {
      slotMap.set(pengujiKey, item);
    }
  }

  return conflicts;
}

export default function KoordinatorDashboard() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [periodes, setPeriodes] = useState([]);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [sidangList, setSidangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [widgetErrors, setWidgetErrors] = useState({
    stats: false,
    periodes: false,
    mahasiswa: false,
    sidang: false,
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, jadwalRes, mhsRes, sidangRes] = await Promise.all([
        koordinatorAPI.getStats().catch(() => ({ ok: false })),
        koordinatorAPI.getJadwalList?.().catch(() => ({ ok: false })) ?? Promise.resolve({ ok: false }),
        koordinatorAPI.getMahasiswaList?.().catch(() => ({ ok: false })) ?? Promise.resolve({ ok: false }),
        koordinatorAPI.getAllSidang?.().catch(() => ({ ok: false })) ?? Promise.resolve({ ok: false }),
      ]);

      if (statsRes?.ok) {
        setStats(statsRes.data);
        setWidgetErrors((prev) => ({ ...prev, stats: false }));
      } else {
        setWidgetErrors((prev) => ({ ...prev, stats: true }));
      }

      if (jadwalRes?.ok) {
        setPeriodes(Array.isArray(jadwalRes.data) ? jadwalRes.data : []);
        setWidgetErrors((prev) => ({ ...prev, periodes: false }));
      }
      if (mhsRes?.ok) {
        setMahasiswaList(Array.isArray(mhsRes.data) ? mhsRes.data : []);
        setWidgetErrors((prev) => ({ ...prev, mahasiswa: false }));
      }
      if (sidangRes?.ok) {
        setSidangList(Array.isArray(sidangRes.data) ? sidangRes.data : []);
        setWidgetErrors((prev) => ({ ...prev, sidang: false }));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role && role !== 'koordinator') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [loadDashboard, role, router]);

  const totalProposals = stats?.total_proposal || 0;
  const pendingProposals = stats?.pending_proposal || 0;
  const validatedProposals = Math.max(0, totalProposals - pendingProposals);
  const validatedPct = totalProposals > 0 ? Math.round((validatedProposals / totalProposals) * 100) : 0;
  const totalMahasiswa = stats?.total_mahasiswa || 0;
  const assignedDosen = stats?.assigned_dosen || 0;

  const unassignedStudents = useMemo(
    () =>
      (Array.isArray(mahasiswaList) ? mahasiswaList : []).filter(
        (m) => m?.status_proposal === 'approved' && !m?.dosen_id
      ),
    [mahasiswaList]
  );

  const sidangConflicts = useMemo(() => detectSidangConflicts(sidangList), [sidangList]);

  const stageData = useMemo(() => {
    if (Array.isArray(mahasiswaList) && mahasiswaList.length > 0) {
      const counts = {
        Proposal: mahasiswaList.filter((m) => !m.status_proposal || m.status_proposal === 'pending').length,
        Validasi: mahasiswaList.filter((m) => m.status_proposal === 'approved').length,
        Assign: unassignedStudents.length,
        Aktif: mahasiswaList.filter((m) => Boolean(m.dosen_id)).length,
        Selesai: sidangList.filter((s) => String(s?.status || '').toLowerCase() === 'completed').length,
      };
      return Object.entries(counts).map(([name, v]) => ({ name, v }));
    }
    return FALLBACK_STAGE_DATA;
  }, [mahasiswaList, sidangList, unassignedStudents.length]);

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard koordinator" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Koordinator · ${TITLE_MAP.dashboard || 'Ringkasan Kegiatan'}`}
        subtitle="Kontrol operasional: pantau kalender periode aktif, penempatan pembimbing belum lengkap, dan pemeriksaan jadwal sidang."
      />

      {/* Metric Strip */}
      <div
        data-testid="koordinator-metric-strip"
        data-source="koordinatorAPI.getStats"
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

      {/* DB-4: 3-Column Operational Control Grid (Kalender Periode, Penempatan Belum Lengkap, Jadwal Sidang Bentrok) */}
      <div
        data-testid="koordinator-operational-grid"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* 1. Kalender Periode Akademik */}
        <Card variant="muted" className="min-w-0" data-source="koordinatorAPI.getJadwalList">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-strong)]">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>Kalender Periode</span>
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Status jadwal pembukaan track & semester.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="xs">
              <Link href="/dashboard/koordinator/kelola-periode">Kelola</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {periodes.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Belum ada periode aktif"
                description="Buka menu Kelola Periode untuk menjadwalkan periode proyek atau internship."
              />
            ) : (
              periodes.slice(0, 3).map((p) => {
                const isActive = String(p?.status || '').toLowerCase() === 'active' || p?.is_active;
                return (
                  <div
                    key={p.id || p.nama}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--text-strong)] truncate">
                        {p.nama || p.nama_periode || '-'}
                      </p>
                      <StatusBadge
                        status={isActive ? 'active' : 'completed'}
                        label={isActive ? 'Aktif' : 'Selesai'}
                      />
                    </div>
                    <p className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      {formatAcademicDate(p.start_date || p.tanggal_mulai)} —{' '}
                      {formatAcademicDate(p.end_date || p.tanggal_selesai)}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 2. Penempatan Pembimbing Belum Lengkap */}
        <Card variant="muted" className="min-w-0" data-source="koordinatorAPI.getMahasiswaList">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-strong)]">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Penempatan Pembimbing</span>
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Mahasiswa ACC proposal yang belum di-assign dosen.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="xs">
              <Link href="/dashboard/koordinator/approve-pembimbing">Assign</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {unassignedStudents.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Penempatan pembimbing lengkap"
                description="Seluruh mahasiswa dengan proposal ACC sudah memiliki dosen pembimbing."
              />
            ) : (
              unassignedStudents.slice(0, 3).map((m) => (
                <div
                  key={m.id || m.npm}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-strong)] truncate">
                      {m.kelompok_nama || m.nama || '-'}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-[var(--text-muted)] truncate">
                      {m.npm || '-'} · Usulan: {m.usulan_dosen_nama || '-'}
                    </p>
                  </div>
                  <StatusBadge status="pending" label="Menunggu" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 3. Pemeriksaan Jadwal Sidang & Bentrok */}
        <Card variant="muted" className="min-w-0" data-source="koordinatorAPI.getAllSidang">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-strong)]">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span>Jadwal Sidang & Bentrok</span>
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Deteksi bentrok ruangan atau penguji pada slot waktu sama.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="xs">
              <Link href="/dashboard/koordinator/jadwal-sidang">Jadwal</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sidangConflicts.length > 0 ? (
              sidangConflicts.map((c) => (
                <div
                  key={c.id}
                  role="alert"
                  className="rounded-xl border border-[hsl(var(--ctp-peach)/0.45)] bg-[hsl(var(--ctp-peach)/0.10)] p-3 text-xs text-[var(--text-strong)] space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[hsl(var(--ctp-peach))]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Jadwal Bentrok Terdeteksi</span>
                  </div>
                  <p className="break-words">{c.reason}</p>
                </div>
              ))
            ) : sidangList.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Tidak ada jadwal sidang bentrok"
                description="Belum ada sesi sidang terjadwal atau seluruh slot waktu bebas bentrok."
              />
            ) : (
              <div className="space-y-2">
                <div className="rounded-xl border border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.08)] px-3 py-2 text-xs text-[var(--text-strong)] flex items-center justify-between">
                  <span>0 bentrok jadwal terdeteksi</span>
                  <StatusBadge status="approved" label="Aman" />
                </div>
                {sidangList.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 text-xs space-y-0.5"
                  >
                    <p className="font-semibold text-[var(--text-strong)] truncate">
                      {s.mahasiswa_nama || s.display_nama || '-'}
                    </p>
                    <p className="font-mono tabular-nums text-[var(--text-muted)]">
                      {formatAcademicDate(s.tanggal)} · {String(s.waktu || '').slice(0, 5)} WIB · {s.ruangan || '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart + Companion Table + Compliance */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card variant="muted" className="xl:col-span-2 min-w-0" data-source="koordinatorAPI.getMahasiswaList">
          <CardHeader>
            <CardTitle className="text-[var(--text-strong)]">Distribusi Tahap Mahasiswa</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Sebaran status dari proposal hingga selesai (satuan: Mahasiswa).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {widgetErrors.stats ? (
              <ErrorState
                title="Gagal memuat statistik tahap mahasiswa"
                onRetry={loadDashboard}
              />
            ) : (
              <>
                <div className="h-[240px] w-full">
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
                      <Bar dataKey="v" name="Mahasiswa" fill="hsl(var(--ctp-blue)/0.75)" radius={[6, 6, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {mahasiswaList.length > 0 ? 'Data aktual mahasiswa aktif · Contoh data referensi' : 'Contoh data'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="muted" className="min-w-0" data-source="koordinatorAPI.getStats">
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
