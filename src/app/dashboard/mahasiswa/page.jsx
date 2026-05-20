'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight, ArrowDownRight, CalendarDays, UploadCloud, AlertTriangle,
  MessageSquareText, Plus, CheckCircle2, Clock, FileText, GraduationCap,
  Settings, MapPin, UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { removeAcademicTitles } from '@/lib/validators';

const APPROVED_STATUSES = new Set(['approved', 'disetujui']);
const WAITING_STATUSES = new Set(['waiting', 'pending', 'menunggu']);
const REJECTED_STATUSES = new Set(['rejected', 'ditolak']);
const SIDANG_TONE_CLASSES = {
  green: 'border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]',
  peach: 'border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] text-[hsl(var(--ctp-peach))]',
  yellow: 'border-[hsl(var(--ctp-yellow)/0.35)] bg-[hsl(var(--ctp-yellow)/0.12)] text-[hsl(var(--ctp-yellow))]',
  blue: 'border-[hsl(var(--ctp-blue)/0.35)] bg-[hsl(var(--ctp-blue)/0.12)] text-[hsl(var(--ctp-blue))]',
};

function normalizeStatus(value) {
  return String(value || '').toLowerCase();
}

function isApprovedStatus(value) {
  return APPROVED_STATUSES.has(normalizeStatus(value));
}

function isWaitingStatus(value) {
  return WAITING_STATUSES.has(normalizeStatus(value));
}

function isRejectedStatus(value) {
  return REJECTED_STATUSES.has(normalizeStatus(value));
}

function getFirstRecord(value) {
  if (Array.isArray(value)) return value[0] || null;
  if (Array.isArray(value?.data)) return value.data[0] || null;
  if (value?.data && typeof value.data === 'object') return value.data;
  if (value?.sidang && typeof value.sidang === 'object') return value.sidang;
  if (value?.jadwal && typeof value.jadwal === 'object') return value.jadwal;
  return value || null;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return '-';
  const raw = String(value);
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getSidangStatus({ sidang, laporanStatus, approvedCount }) {
  if (sidang?.tanggal || sidang?.tanggal_sidang || sidang?.waktu || sidang?.waktu_sidang || sidang?.ruangan) {
    return {
      label: 'Sudah dijadwalkan',
      description: 'Jadwal sidang sudah ditentukan oleh koordinator.',
      tone: 'green',
    };
  }
  if (approvedCount < 8) {
    return {
      label: 'Belum memenuhi syarat',
      description: `Minimal 8 bimbingan disetujui. Saat ini ${approvedCount}/8.`,
      tone: 'peach',
    };
  }
  if (!isApprovedStatus(laporanStatus)) {
    return {
      label: 'Menunggu laporan disetujui',
      description: 'Jadwal sidang aktif setelah laporan sidang disetujui.',
      tone: 'yellow',
    };
  }
  return {
    label: 'Belum dijadwalkan',
    description: 'Syarat sudah terpenuhi, menunggu koordinator membuat jadwal sidang.',
    tone: 'blue',
  };
}

// ==========================================
// HELPER: Compute status distribution from real bimbingan data
// ==========================================
function computeStatusDistribution(bimbinganList) {
  let approved = 0;
  let pending = 0;
  let rejected = 0;

  bimbinganList.forEach((b) => {
    if (isApprovedStatus(b.status)) approved++;
    else if (isRejectedStatus(b.status)) rejected++;
    else pending++;
  });

  return [
    { name: 'Disetujui', v: approved },
    { name: 'Menunggu', v: pending },
    { name: 'Ditolak', v: rejected },
  ];
}

// ==========================================
// COMPONENTS
// ==========================================
function RiskBadge({ risk }) {
  const map = {
    low: 'bg-[hsl(var(--ctp-green)/0.14)] text-[hsl(var(--ctp-green))] border-[hsl(var(--ctp-green)/0.3)]',
    medium: 'bg-[hsl(var(--ctp-yellow)/0.14)] text-[hsl(var(--ctp-yellow))] border-[hsl(var(--ctp-yellow)/0.3)]',
    high: 'bg-[hsl(var(--ctp-red)/0.14)] text-[hsl(var(--ctp-red))] border-[hsl(var(--ctp-red)/0.3)]',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[risk] || map.low}`}>
      {risk}
    </span>
  );
}

function StatusPill({ label }) {
  const base = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]';
  if (label === 'approved' || label === 'disetujui') {
    return (
      <span className={`${base} border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.12)] text-[hsl(var(--ctp-green))]`}>
        <CheckCircle2 className="h-3.5 w-3.5" /> Disetujui
      </span>
    );
  }
  if (label === 'rejected' || label === 'ditolak') {
    return (
      <span className={`${base} border-[hsl(var(--ctp-red)/0.35)] bg-[hsl(var(--ctp-red)/0.12)] text-[hsl(var(--ctp-red))]`}>
        <AlertTriangle className="h-3.5 w-3.5" /> Ditolak
      </span>
    );
  }
  return (
    <span className={`${base} border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)] text-[hsl(var(--ctp-peach))]`}>
      <Clock className="h-3.5 w-3.5" /> Menunggu
    </span>
  );
}

function StatCard({ title, value, delta, dir, sub }) {
  const Icon = dir === 'up' ? ArrowUpRight : ArrowDownRight;
  const deltaCls = dir === 'down' ? 'text-[hsl(var(--ctp-green))]' : 'text-[hsl(var(--ctp-peach))]';

  return (
    <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
      <CardHeader className="pb-2">
        <CardDescription className="text-[hsl(var(--ctp-subtext0))]">{title}</CardDescription>
        <CardTitle className="text-[hsl(var(--ctp-text))] text-2xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-sm ${deltaCls}`}>
          <Icon className="h-4 w-4" />
          <span className="font-medium">{delta}</span>
          <span className="text-[hsl(var(--ctp-subtext0))] font-normal">{sub}</span>
        </div>
        <span className="h-8 w-8 rounded-xl border border-[hsl(var(--ctp-overlay0)/0.5)] bg-[hsl(var(--ctp-surface1)/0.6)]" />
      </CardContent>
    </Card>
  );
}

// ==========================================
// MAIN DASHBOARD
// ==========================================
export default function MahasiswaDashboard() {
  const router = useRouter();
  const { user, role, setUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [laporanData, setLaporanData] = useState(null);
  const [sidangData, setSidangData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentFilter, setDocumentFilter] = useState('all');

  const loadDashboard = useCallback(async () => {
    try {
      const [profileRes, bimbinganRes, laporanRes, sidangRes] = await Promise.all([
        mahasiswaAPI.getProfile(),
        mahasiswaAPI.getMyBimbingan(),
        mahasiswaAPI.getMyLaporan().catch(() => ({ ok: false })),
        mahasiswaAPI.getMySidang().catch(() => ({ ok: false })),
      ]);
      if (profileRes.ok) { setProfile(profileRes.data); setUser(profileRes.data); }
      if (bimbinganRes.ok) {
        setBimbinganList(Array.isArray(bimbinganRes.data) ? bimbinganRes.data : bimbinganRes.data?.data || []);
      }
      if (laporanRes.ok) {
        setLaporanData(getFirstRecord(laporanRes.data));
      }
      if (sidangRes.ok) {
        setSidangData(getFirstRecord(sidangRes.data));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadDashboard();
  }, [loadDashboard, role, router]);

  const displayName = removeAcademicTitles(user?.nama || profile?.nama || 'Mahasiswa');
  const approvedCount = bimbinganList.filter((b) => isApprovedStatus(b.status)).length;
  const pendingCount = bimbinganList.filter((b) => isWaitingStatus(b.status)).length;
  const totalBimbingan = bimbinganList.length;
  const pembimbingName = [profile?.dosen_nama, profile?.dosen_nama_2].filter(Boolean).join(' & ')
    || profile?.dosen_pembimbing
    || 'Belum ada pembimbing';

  const statusDistData = useMemo(() => computeStatusDistribution(bimbinganList), [bimbinganList]);

  // Laporan status from real API
  const laporanStatus = laporanData?.status || laporanData?.status_laporan || 'belum';
  const sidangStatus = getSidangStatus({ sidang: sidangData, laporanStatus, approvedCount });
  const sidangDate = sidangData?.tanggal_sidang || sidangData?.tanggal || sidangData?.date;
  const sidangTime = sidangData?.waktu_sidang || sidangData?.waktu || sidangData?.time;
  const sidangRoom = sidangData?.ruangan || sidangData?.room;
  const sidangPenguji = sidangData?.penguji_nama || sidangData?.nama_penguji || sidangData?.penguji;
  const documentItems = useMemo(() => {
    const items = [
      {
        type: 'proposal',
        title: 'Proposal',
        status: profile?.proposal_status || profile?.status_proposal || 'belum',
        tag: 'Proposal',
        href: '/dashboard/mahasiswa/proposal',
      },
      {
        type: 'laporan',
        title: 'Laporan Sidang',
        status: laporanStatus,
        tag: 'Laporan',
        href: '/dashboard/mahasiswa/laporan',
      },
    ];

    return documentFilter === 'all'
      ? items
      : items.filter((item) => item.type === documentFilter);
  }, [documentFilter, laporanStatus, profile?.proposal_status, profile?.status_proposal]);

  const recentActivity = useMemo(() => {
    return bimbinganList.slice(0, 5).map((b, i) => ({
      id: b.id || `B-${i}`,
      actor: displayName,
      action: isApprovedStatus(b.status) ? 'Disetujui' : isWaitingStatus(b.status) ? 'Menunggu review' : 'Revisi',
      target: b.topik || b.catatan || `Bimbingan ke-${i + 1}`,
      when: b.tanggal ? b.tanggal.slice(0, 10) : '-',
      risk: isRejectedStatus(b.status) ? 'high' : isWaitingStatus(b.status) ? 'medium' : 'low',
    }));
  }, [bimbinganList, displayName]);

  const guidanceSummary = useMemo(() => {
    const progressPct = totalBimbingan > 0 ? Math.min(100, Math.round((approvedCount / 8) * 100)) : 0;
    return [
      {
        name: profile?.track || 'Proyek / Internship',
        desc: `${approvedCount} dari 8 sesi bimbingan diselesaikan`,
        progress: progressPct,
        owner: pembimbingName,
        status: progressPct >= 50 ? 'On track' : 'At risk',
      },
    ];
  }, [profile, approvedCount, totalBimbingan, pembimbingName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Bimbingan selesai" value={`${approvedCount}/8`} delta={`+${approvedCount}`} dir="up" sub="total disetujui" />
        <StatCard title="Menunggu review" value={String(pendingCount)} delta={pendingCount > 0 ? `+${pendingCount}` : '0'} dir="up" sub="butuh respon dosen" />
        <StatCard title="Total bimbingan" value={String(totalBimbingan)} delta={`+${totalBimbingan}`} dir="up" sub="sesi tercatat" />
        <StatCard title="Track" value={profile?.track || '-'} delta="" dir="up" sub={profile?.angkatan ? `Angkatan ${profile.angkatan}` : ''} />
      </div>

      {/* Top workflow row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Today / Upcoming Sessions */}
        <Card className="xl:col-span-3 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <CalendarDays className="h-4 w-4" /> Bimbingan terjadwal
              </CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Sesi yang perlu kamu jalani.</CardDescription>
            </div>
            <Link href="/dashboard/mahasiswa/bimbingan">
              <Button variant="secondary" className="ctp-focus h-9 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)]">
                <Plus className="h-4 w-4 mr-2" /> Catat
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {bimbinganList.length === 0 ? (
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-6 text-center">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--ctp-overlay1))]" />
                <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada sesi bimbingan</p>
              </div>
            ) : (
              bimbinganList.slice(0, 3).map((s, i) => (
                <div key={s.id || i} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[hsl(var(--ctp-subtext1))]">{s.tanggal ? s.tanggal.slice(0, 10) : '-'}</span>
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold text-[hsl(var(--ctp-text))]">{s.topik || s.catatan || `Sesi ke-${i + 1}`}</div>
                    </div>
                    <div className="shrink-0"><StatusPill label={s.status} /></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Jadwal Sidang */}
        <Card className="xl:col-span-3 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <CalendarDays className="h-4 w-4" /> Jadwal Sidang
              </CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Informasi sidang dari koordinator.</CardDescription>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${SIDANG_TONE_CLASSES[sidangStatus.tone] || SIDANG_TONE_CLASSES.blue}`}>
              {sidangStatus.label}
            </span>
          </CardHeader>
          <CardContent>
            {sidangData?.tanggal || sidangData?.tanggal_sidang || sidangData?.waktu || sidangData?.ruangan ? (
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-4 space-y-3">
                <div>
                  <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Tanggal & waktu</p>
                  <p className="mt-1 text-sm font-semibold text-[hsl(var(--ctp-text))]">
                    {formatDate(sidangDate)} · {formatTime(sidangTime)}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.28)] bg-[hsl(var(--ctp-surface0)/0.28)] p-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-[hsl(var(--ctp-blue))]" />
                    <div>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Ruangan</p>
                      <p className="text-sm font-medium text-[hsl(var(--ctp-text))]">{sidangRoom || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.28)] bg-[hsl(var(--ctp-surface0)/0.28)] p-3">
                    <UserCheck className="mt-0.5 h-4 w-4 text-[hsl(var(--ctp-teal))]" />
                    <div>
                      <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Penguji</p>
                      <p className="text-sm font-medium text-[hsl(var(--ctp-text))]">{sidangPenguji || '-'}</p>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/mahasiswa/hasil">
                  <Button variant="secondary" className="ctp-focus h-9 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)]">
                    <FileText className="h-4 w-4 mr-2" /> Lihat detail
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-6 text-center">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--ctp-overlay1))]" />
                <p className="text-sm font-semibold text-[hsl(var(--ctp-text))]">{sidangStatus.label}</p>
                <p className="mt-1 text-xs text-[hsl(var(--ctp-subtext0))]">{sidangStatus.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reviews / Documents */}
        <Card className="xl:col-span-3 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <UploadCloud className="h-4 w-4" /> Dokumen
              </CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Status proposal dan laporan kamu.</CardDescription>
            </div>
            <Select value={documentFilter} onValueChange={setDocumentFilter}>
              <SelectTrigger className="ctp-focus h-9 w-[120px] rounded-2xl border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] text-[hsl(var(--ctp-text))]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.95)]">
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="laporan">Laporan</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentItems.map((d) => (
              <div key={d.title} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[hsl(var(--ctp-text))] truncate">{d.title}</span>
                      <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))]">{d.tag}</Badge>
                    </div>
                  </div>
                  <StatusPill label={d.status} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--ctp-subtext0))]">Status: <span className="text-[hsl(var(--ctp-subtext1))] font-medium">{d.status}</span></span>
                  <Link href={d.href}>
                    <Button variant="secondary" className="ctp-focus h-8 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)] text-[hsl(var(--ctp-text))]">
                      <MessageSquareText className="h-4 w-4 mr-2" /> Lihat
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card className="xl:col-span-3 bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
                <GraduationCap className="h-4 w-4" /> Progres bimbingan
              </CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Ringkasan progres dan pembimbing.</CardDescription>
            </div>
            <Button variant="secondary" className="ctp-focus h-9 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)]">
              <Settings className="h-4 w-4 text-[hsl(var(--ctp-subtext1))]" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {guidanceSummary.map((p) => {
              const statusCls =
                p.status === 'At risk'
                  ? 'text-[hsl(var(--ctp-peach))] border-[hsl(var(--ctp-peach)/0.35)] bg-[hsl(var(--ctp-peach)/0.12)]'
                  : 'text-[hsl(var(--ctp-green))] border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.12)]';
              return (
                <div key={p.name} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[hsl(var(--ctp-text))]">{p.name}</div>
                      <div className="truncate text-xs text-[hsl(var(--ctp-subtext0))]">{p.desc}</div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${statusCls}`}>{p.status}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[hsl(var(--ctp-subtext0))]">
                      <span>{p.owner}</span>
                      <span className="text-[hsl(var(--ctp-subtext1))] font-medium">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="mt-2" />
                  </div>
                </div>
              );
            })}

            {/* Deadline compliance mini-stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Approved</div>
                <div className="mt-1 text-lg font-semibold text-[hsl(var(--ctp-green))]">{approvedCount}</div>
              </div>
              <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Pending</div>
                <div className="mt-1 text-lg font-semibold text-[hsl(var(--ctp-peach))]">{pendingCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-1 gap-4">
        {/* Status distribution chart - REAL DATA */}
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-[hsl(var(--ctp-text))]">Status bimbingan</CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Distribusi status semua sesi.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalBimbingan === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-center">
                <FileText className="w-10 h-10 text-[hsl(var(--ctp-overlay1))] mb-3" />
                <p className="text-sm text-[hsl(var(--ctp-subtext0))]">Belum ada data bimbingan</p>
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistData} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--ctp-subtext0))', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="v" fill="hsl(var(--ctp-teal)/0.55)" radius={[10, 10, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Next session mini-card */}
            <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[hsl(var(--ctp-text))]">Aksi cepat</div>
                  <div className="text-xs text-[hsl(var(--ctp-subtext0))]">Upload proposal atau catat bimbingan</div>
                </div>
                <Link href="/dashboard/mahasiswa/bimbingan">
                  <Button className="ctp-focus rounded-2xl bg-[hsl(var(--ctp-blue)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-blue)/0.28)] border border-[hsl(var(--ctp-blue)/0.30)]" variant="secondary">
                    Mulai
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Table */}
      {recentActivity.length > 0 && (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-[hsl(var(--ctp-text))]">Aktivitas bimbingan terbaru</CardTitle>
              <CardDescription className="text-[hsl(var(--ctp-subtext0))]">Upload, review, jadwal — semua tercatat.</CardDescription>
            </div>
            <Link href="/dashboard/mahasiswa/bimbingan">
              <Button variant="secondary" className="ctp-focus h-9 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)]">
                <ArrowUpRight className="h-4 w-4 mr-2 text-[hsl(var(--ctp-subtext1))]" />
                <span className="text-[hsl(var(--ctp-text))]">Lihat semua</span>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--ctp-overlay0)/0.25)]">
                    <TableHead className="text-[hsl(var(--ctp-subtext0))]">ID</TableHead>
                    <TableHead className="text-[hsl(var(--ctp-subtext0))]">Aksi</TableHead>
                    <TableHead className="text-[hsl(var(--ctp-subtext0))]">Detail</TableHead>
                    <TableHead className="text-[hsl(var(--ctp-subtext0))]">Risk</TableHead>
                    <TableHead className="text-[hsl(var(--ctp-subtext0))]">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((a) => (
                    <TableRow key={a.id} className="border-[hsl(var(--ctp-overlay0)/0.22)] hover:bg-[hsl(var(--ctp-surface0)/0.35)]">
                      <TableCell className="font-mono text-xs text-[hsl(var(--ctp-subtext1))]">{a.id}</TableCell>
                      <TableCell>
                        <Badge className="rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface1)/0.35)] text-[hsl(var(--ctp-text))]">{a.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[hsl(var(--ctp-subtext1))]">{a.target}</TableCell>
                      <TableCell><RiskBadge risk={a.risk} /></TableCell>
                      <TableCell className="text-sm text-[hsl(var(--ctp-subtext0))]">{a.when}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

    </motion.div>
  );
}
