'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  UploadCloud,
  FileText,
  MapPin,
  UserCheck,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { mahasiswaAPI } from '@/lib/api';
import { removeAcademicTitles } from '@/lib/validators';
import { cn } from '@/lib/utils';

const APPROVED_STATUSES = new Set(['approved', 'disetujui']);
const WAITING_STATUSES = new Set(['waiting', 'pending', 'menunggu']);
const REJECTED_STATUSES = new Set(['rejected', 'ditolak']);

const API_TRACK_LABELS = {
  proyek1: 'Proyek 1',
  proyek2: 'Proyek 2',
  proyek3: 'Proyek 3',
  'proyek-1': 'Proyek 1',
  'proyek-2': 'Proyek 2',
  'proyek-3': 'Proyek 3',
  internship1: 'Internship 1',
  internship2: 'Internship 2',
  'internship-1': 'Internship 1',
  'internship-2': 'Internship 2',
};

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
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
      statusKey: 'terjadwal',
    };
  }
  if (approvedCount < 8) {
    return {
      label: 'Belum memenuhi syarat',
      description: `Minimal 8 bimbingan disetujui. Saat ini ${approvedCount}/8.`,
      statusKey: 'pending',
    };
  }
  if (!isApprovedStatus(laporanStatus)) {
    return {
      label: 'Menunggu laporan disetujui',
      description: 'Jadwal sidang aktif setelah laporan sidang disetujui.',
      statusKey: 'menunggu',
    };
  }
  return {
    label: 'Belum dijadwalkan',
    description: 'Syarat sudah terpenuhi, menunggu koordinator membuat jadwal sidang.',
    statusKey: 'info',
  };
}

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
      if (profileRes.ok) {
        setProfile(profileRes.data);
        setUser(profileRes.data);
      }
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

  const laporanStatus = laporanData?.status || laporanData?.status_laporan || 'belum';
  const sidangStatus = getSidangStatus({ sidang: sidangData, laporanStatus, approvedCount });
  const sidangDate = sidangData?.tanggal_sidang || sidangData?.tanggal || sidangData?.date;
  const sidangTime = sidangData?.waktu_sidang || sidangData?.waktu || sidangData?.time;
  const sidangRoom = sidangData?.ruangan || sidangData?.room;
  const sidangPenguji = sidangData?.penguji_nama || sidangData?.nama_penguji || sidangData?.penguji;

  // =========================================================================
  // STEP 1: "Langkah berikutnya" prominent action block
  // =========================================================================
  const nextStep = useMemo(() => {
    // 1. Track selection
    if (!profile?.track) {
      return {
        stepNumber: 'Langkah 1 dari 7',
        title: 'Pilih Track Akademik',
        description: 'Tentukan jalur Proyek atau Internship untuk memulai alur akademik semester ini.',
        statusKey: 'draft',
        statusLabel: 'Perlu Tindakan',
        cta: { label: 'Pilih Track', href: '/dashboard/mahasiswa/track' },
      };
    }

    // 2. Proposal
    const propStatus = normalizeStatus(profile?.proposal_status || profile?.status_proposal);
    if (!propStatus || propStatus === 'none' || propStatus === 'belum') {
      return {
        stepNumber: 'Langkah 3 dari 7',
        title: 'Ajukan Proposal Proyek',
        description: 'Unggah proposal proyek untuk ditinjau dan divalidasi oleh koordinator program studi.',
        statusKey: 'draft',
        statusLabel: 'Perlu Tindakan',
        cta: { label: 'Unggah Proposal', href: '/dashboard/mahasiswa/proposal' },
      };
    }
    if (propStatus === 'pending') {
      return {
        stepNumber: 'Langkah 3 dari 7',
        title: 'Proposal Sedang Ditinjau',
        description: 'Proposal Anda sedang ditinjau oleh koordinator prodi. Dosen pembimbing akan ditetapkan setelah proposal disetujui.',
        statusKey: 'pending',
        statusLabel: 'Menunggu Review',
        cta: { label: 'Cek Status Proposal', href: '/dashboard/mahasiswa/proposal' },
      };
    }
    if (propStatus === 'rejected') {
      return {
        stepNumber: 'Langkah 3 dari 7',
        title: 'Perbaiki dan Ajukan Ulang Proposal',
        description: 'Proposal Anda memerlukan perbaikan sesuai catatan koordinator prodi.',
        statusKey: 'rejected',
        statusLabel: 'Revisi Diperlukan',
        cta: { label: 'Perbaiki Proposal', href: '/dashboard/mahasiswa/proposal' },
      };
    }

    // 3. Bimbingan 8 sesi
    if (approvedCount < 8) {
      return {
        stepNumber: 'Langkah 5 dari 7',
        title: 'Lengkapi 8 Sesi Bimbingan',
        description: `Minimal 8 sesi bimbingan disetujui sebagai syarat maju sidang. Saat ini ${approvedCount}/8 sesi telah disetujui${pendingCount > 0 ? ` (${pendingCount} sesi menunggu review dosen)` : ''}.`,
        statusKey: approvedCount === 0 ? 'draft' : 'pending',
        statusLabel: `${approvedCount}/8 Disetujui`,
        cta: { label: 'Catat Bimbingan', href: '/dashboard/mahasiswa/bimbingan' },
      };
    }

    // 4. Laporan Sidang
    if (!isApprovedStatus(laporanStatus)) {
      if (!laporanData || laporanStatus === 'belum') {
        return {
          stepNumber: 'Langkah 6 dari 7',
          title: 'Unggah Berkas Laporan Sidang',
          description: 'Persyaratan 8 bimbingan telah terpenuhi! Segera unggah tautan naskah laporan sidang dan luaran proyek Anda.',
          statusKey: 'draft',
          statusLabel: 'Siap Maju Sidang',
          cta: { label: 'Unggah Laporan', href: '/dashboard/mahasiswa/laporan' },
        };
      }
      if (isWaitingStatus(laporanStatus) || laporanStatus === 'submitted') {
        return {
          stepNumber: 'Langkah 6 dari 7',
          title: 'Menunggu Persetujuan Laporan',
          description: 'Berkas laporan sidang dan luaran proyek Anda telah terkirim dan sedang menunggu persetujuan dosen pembimbing.',
          statusKey: 'pending',
          statusLabel: 'Menunggu Persetujuan',
          cta: { label: 'Lihat Status Laporan', href: '/dashboard/mahasiswa/laporan' },
        };
      }
      return {
        stepNumber: 'Langkah 6 dari 7',
        title: 'Perbaiki Berkas Laporan Sidang',
        description: 'Laporan sidang memerlukan perbaikan sebelum dapat diproses ke penjadwalan sidang.',
        statusKey: 'rejected',
        statusLabel: 'Revisi Laporan',
        cta: { label: 'Perbaiki Laporan', href: '/dashboard/mahasiswa/laporan' },
      };
    }

    // 5. Sidang Schedule
    if (sidangData?.tanggal || sidangData?.tanggal_sidang || sidangData?.waktu || sidangData?.ruangan) {
      return {
        stepNumber: 'Langkah 7 dari 7',
        title: 'Persiapkan Pelaksanaan Sidang',
        description: `Sidang telah dijadwalkan pada ${formatDate(sidangDate)} pukul ${formatTime(sidangTime)} di ruangan ${sidangRoom || '-'}.`,
        statusKey: 'terjadwal',
        statusLabel: 'Sidang Terjadwal',
        cta: { label: 'Lihat Detail Sidang', href: '/dashboard/mahasiswa/hasil' },
      };
    }

    return {
      stepNumber: 'Langkah 7 dari 7',
      title: 'Menunggu Penjadwalan Sidang',
      description: 'Seluruh berkas laporan dan syarat bimbingan telah disetujui. Menunggu koordinator program studi menetapkan jadwal sidang.',
      statusKey: 'info',
      statusLabel: 'Syarat Sidang Lengkap',
      cta: { label: 'Pantau Jadwal Sidang', href: '/dashboard/mahasiswa/hasil' },
    };
  }, [profile, approvedCount, pendingCount, laporanStatus, laporanData, sidangData, sidangDate, sidangTime, sidangRoom]);

  // =========================================================================
  // STEP 2: Pipeline Strip (Track, Kelompok, Proposal, Pembimbing, Bimbingan x/8, Laporan, Jadwal Sidang)
  // States: selesai, berjalan, terkunci
  // =========================================================================
  const pipelineStages = useMemo(() => {
    // 1. Track
    const trackDone = Boolean(profile?.track);
    const s1 = {
      name: 'Track',
      state: trackDone ? 'selesai' : 'berjalan',
      detail: profile?.track ? (API_TRACK_LABELS[profile.track] || profile.track) : 'Belum dipilih',
    };

    // 2. Kelompok
    const isInternship = String(profile?.track || '').includes('internship');
    const hasGroup = Boolean(
      profile?.kelompok_id || profile?.id_kelompok || profile?.kelompok ||
      profile?.nama_kelompok || profile?.has_kelompok || profile?.status_proposal
    );
    let s2State = 'terkunci';
    if (trackDone) {
      if (isInternship || hasGroup) s2State = 'selesai';
      else s2State = 'berjalan';
    }
    const s2 = {
      name: 'Kelompok',
      state: s2State,
      detail: isInternship ? 'Individu' : hasGroup ? 'Terbentuk' : 'Belum',
    };

    // 3. Proposal
    const propStatus = normalizeStatus(profile?.proposal_status || profile?.status_proposal);
    const propApproved = isApprovedStatus(propStatus);
    let s3State = 'terkunci';
    if (s2State === 'selesai' || trackDone) {
      if (propApproved) s3State = 'selesai';
      else if (propStatus === 'pending' || propStatus === 'rejected') s3State = 'berjalan';
      else if (s2State === 'selesai') s3State = 'berjalan';
      else s3State = 'terkunci';
    }
    const s3 = {
      name: 'Proposal',
      state: s3State,
      detail: propApproved ? 'Disetujui' : propStatus === 'pending' ? 'Review' : propStatus === 'rejected' ? 'Revisi' : 'Belum',
    };

    // 4. Pembimbing
    const hasPembimbing = Boolean(
      (profile?.dosen_nama && profile?.dosen_nama !== '-') ||
      (profile?.dosen_pembimbing && profile?.dosen_pembimbing !== '-') ||
      profile?.dosen_id
    );
    let s4State = 'terkunci';
    if (s3State === 'selesai') {
      if (hasPembimbing) s4State = 'selesai';
      else s4State = 'berjalan';
    } else if (propStatus === 'pending') {
      s4State = 'berjalan';
    }
    const s4 = {
      name: 'Pembimbing',
      state: s4State,
      detail: hasPembimbing ? 'Ditetapkan' : 'Belum',
    };

    // 5. Bimbingan x/8
    let s5State = 'terkunci';
    if (s4State === 'selesai' || hasPembimbing) {
      if (approvedCount >= 8) s5State = 'selesai';
      else s5State = 'berjalan';
    }
    const s5 = {
      name: `Bimbingan ${approvedCount}/8`,
      state: s5State,
      detail: `${approvedCount}/8 sesi`,
    };

    // 6. Laporan
    const lapApproved = isApprovedStatus(laporanStatus);
    let s6State = 'terkunci';
    if (s5State === 'selesai' || approvedCount >= 8) {
      if (lapApproved) s6State = 'selesai';
      else if (laporanData && (laporanStatus === 'submitted' || laporanStatus === 'pending')) s6State = 'berjalan';
      else s6State = 'berjalan';
    }
    const s6 = {
      name: 'Laporan',
      state: s6State,
      detail: lapApproved ? 'Disetujui' : (laporanData?.file_url ? 'Diajukan' : 'Belum'),
    };

    // 7. Jadwal Sidang
    const hasSidangSchedule = Boolean(
      sidangData?.tanggal || sidangData?.tanggal_sidang || sidangData?.waktu || sidangData?.ruangan
    );
    let s7State = 'terkunci';
    if (s6State === 'selesai' || lapApproved) {
      if (hasSidangSchedule) s7State = 'selesai';
      else s7State = 'berjalan';
    }
    const s7 = {
      name: 'Jadwal Sidang',
      state: s7State,
      detail: hasSidangSchedule ? 'Terjadwal' : 'Menunggu',
    };

    return [s1, s2, s3, s4, s5, s6, s7];
  }, [profile, approvedCount, laporanStatus, laporanData, sidangData]);

  // Documents summary
  const documentItems = useMemo(() => {
    const items = [
      {
        type: 'proposal',
        title: 'Proposal',
        status: profile?.proposal_status || profile?.status_proposal || 'belum',
        href: '/dashboard/mahasiswa/proposal',
      },
      {
        type: 'laporan',
        title: 'Laporan Sidang',
        status: laporanStatus,
        href: '/dashboard/mahasiswa/laporan',
      },
    ];

    return documentFilter === 'all'
      ? items
      : items.filter((item) => item.type === documentFilter);
  }, [documentFilter, laporanStatus, profile?.proposal_status, profile?.status_proposal]);

  // Activity list
  const recentActivity = useMemo(() => {
    return bimbinganList.slice(0, 5).map((b, i) => ({
      id: b.id || `B-${i + 1}`,
      actor: displayName,
      status: b.status || 'pending',
      action: isApprovedStatus(b.status) ? 'Disetujui' : isWaitingStatus(b.status) ? 'Menunggu review' : 'Revisi',
      target: b.topik || b.catatan || `Bimbingan ke-${i + 1}`,
      when: b.tanggal ? b.tanggal.slice(0, 10) : '-',
    }));
  }, [bimbinganList, displayName]);

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat dashboard mahasiswa" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Dashboard Mahasiswa"
        subtitle="Pantau alur akademik, bimbingan proyek, dan jadwal sidang Anda dalam satu sistem terintegrasi."
      />

      {/* ========================================================================= */}
      {/* STEP 1: First Block "Langkah berikutnya" Action Block                      */}
      {/* ========================================================================= */}
      <Card
        data-testid="next-step-card"
        className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] font-mono">
                Langkah berikutnya · {nextStep.stepNumber}
              </span>
              <StatusBadge status={nextStep.statusKey} label={nextStep.statusLabel} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-strong)] break-words">
              {nextStep.title}
            </h2>
            <p className="text-sm text-[var(--text-body)] max-w-2xl break-words">
              {nextStep.description}
            </p>
          </div>
          <div className="shrink-0 pt-2 sm:pt-0">
            <Button asChild className="w-full sm:w-auto font-medium min-h-[44px]">
              <Link href={nextStep.cta.href}>
                <span>{nextStep.cta.label}</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 2: Pipeline Strip                                                    */}
      {/* ========================================================================= */}
      <Card variant="muted" className="p-4 sm:p-5" data-testid="pipeline-strip">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Alur Akademik Mahasiswa
          </span>
          <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
            {pipelineStages.filter((s) => s.state === 'selesai').length}/7 Selesai
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {pipelineStages.map((stage, idx) => {
            const isDone = stage.state === 'selesai';
            const isActive = stage.state === 'berjalan';
            const isLocked = stage.state === 'terkunci';
            return (
              <div
                key={stage.name}
                data-testid={`pipeline-stage-${idx + 1}`}
                className={cn(
                  'flex flex-col justify-between rounded-lg border p-2.5 min-w-0 transition-colors',
                  isDone && 'border-[hsl(var(--ctp-green)/0.35)] bg-[hsl(var(--ctp-green)/0.06)]',
                  isActive && 'border-[hsl(var(--ctp-blue)/0.4)] bg-[hsl(var(--ctp-blue)/0.08)]',
                  isLocked && 'border-[var(--line)] bg-[var(--surface-sunken)]/50'
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--text-muted)]">
                    0{idx + 1}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
                      isDone && 'bg-[hsl(var(--ctp-green)/0.15)] text-emerald-800 dark:text-emerald-200',
                      isActive && 'bg-[hsl(var(--ctp-blue)/0.15)] text-blue-800 dark:text-blue-200',
                      isLocked && 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
                    )}
                  >
                    {stage.state}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-strong)] truncate" title={stage.name}>
                  {stage.name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5" title={stage.detail}>
                  {stage.detail}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* STEP 3: Bordered Metric Strip (No icons, no deltas, tabular-nums)         */}
      {/* ========================================================================= */}
      <div
        data-testid="metric-strip"
        className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border border-[var(--line)] rounded-xl bg-[var(--surface-raised)]"
      >
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Total Bimbingan</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)] font-mono tabular-nums">
            {totalBimbingan}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Disetujui</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-green))] font-mono tabular-nums">
            {approvedCount}
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Menunggu</p>
          <p className="mt-1 text-2xl font-semibold text-[hsl(var(--ctp-peach))] font-mono tabular-nums">
            {pendingCount}
          </p>
        </div>
        <div className="p-4 sm:p-5 min-w-0">
          <p className="text-xs font-medium text-[var(--text-muted)]">Dosen Pembimbing</p>
          <p className="mt-1 text-sm sm:text-base font-semibold text-[var(--text-strong)] truncate" title={pembimbingName}>
            {pembimbingName}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 4: 8-Slot Segmented Progress Bar (Replaces Recharts BarChart)        */}
      {/* ========================================================================= */}
      <Card variant="muted" data-testid="bimbingan-segmented-progress">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[var(--text-strong)]">Progres Sesi Bimbingan</CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              Syarat minimal maju sidang: 8 sesi bimbingan disetujui ({approvedCount}/8 selesai).
            </CardDescription>
          </div>
          <Link href="/dashboard/mahasiswa/bimbingan">
            <Button variant="secondary" size="sm" className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-1.5" /> Catat Sesi
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="progressbar"
            aria-valuenow={approvedCount}
            aria-valuemin={0}
            aria-valuemax={8}
            aria-label="Progres 8 sesi bimbingan"
            className="grid grid-cols-8 gap-1.5 sm:gap-2"
          >
            {Array.from({ length: 8 }, (_, i) => {
              const isApproved = i < approvedCount;
              const isPending = !isApproved && i < (approvedCount + pendingCount);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'h-3 w-full rounded-md transition-colors',
                      isApproved
                        ? 'bg-[hsl(var(--ctp-green))]'
                        : isPending
                        ? 'bg-[hsl(var(--ctp-peach))]'
                        : 'bg-[var(--surface-sunken)] border border-[var(--line)]'
                    )}
                  />
                  <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                    {i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--line)]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--ctp-green))]" />
              <span>Disetujui ({approvedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--ctp-peach))]" />
              <span>Menunggu review ({pendingCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--surface-sunken)] border border-[var(--line)]" />
              <span>Belum diambil ({Math.max(0, 8 - approvedCount - pendingCount)})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle row: Upcoming Sessions, Jadwal Sidang, Dokumen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Jadwal Sidang */}
        <Card variant="muted">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                <CalendarDays className="h-4 w-4" /> Jadwal Sidang
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">Status penetapan dari koordinator.</CardDescription>
            </div>
            <StatusBadge status={sidangStatus.statusKey} label={sidangStatus.label} />
          </CardHeader>
          <CardContent>
            {sidangData?.tanggal || sidangData?.tanggal_sidang || sidangData?.waktu || sidangData?.ruangan ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4 space-y-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Tanggal & waktu</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-strong)] font-mono tabular-nums">
                    {formatDate(sidangDate)} · {formatTime(sidangTime)}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] flex items-start gap-2 p-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 text-[hsl(var(--ctp-blue))] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-muted)]">Ruangan</p>
                      <p className="text-sm font-medium text-[var(--text-strong)] truncate">{sidangRoom || '-'}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] flex items-start gap-2 p-2.5">
                    <UserCheck className="mt-0.5 h-4 w-4 text-[hsl(var(--ctp-teal))] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--text-muted)]">Penguji</p>
                      <p className="text-sm font-medium text-[var(--text-strong)] truncate">{sidangPenguji || '-'}</p>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/mahasiswa/hasil" className="inline-block">
                  <Button variant="secondary" size="sm" className="min-h-[44px]">
                    <FileText className="h-4 w-4 mr-2" /> Detail Hasil Sidang
                  </Button>
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title={sidangStatus.label}
                description={sidangStatus.description}
              />
            )}
          </CardContent>
        </Card>

        {/* Dokumen Status */}
        <Card variant="muted">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                <UploadCloud className="h-4 w-4" /> Dokumen
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">Status proposal dan laporan.</CardDescription>
            </div>
            <Select value={documentFilter} onValueChange={setDocumentFilter}>
              <SelectTrigger aria-label="Filter dokumen" className="h-9 w-[110px] bg-[var(--surface-sunken)] border-[var(--line)] text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--surface-raised)] border-[var(--line)]">
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="laporan">Laporan</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentItems.map((d) => (
              <div
                key={d.title}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-strong)] truncate">{d.title}</p>
                  <div className="mt-1">
                    <StatusBadge status={d.status} />
                  </div>
                </div>
                <Link href={d.href}>
                  <Button variant="secondary" size="sm" className="min-h-[44px]">
                    Lihat
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sesi Terakhir / Quick View */}
        <Card variant="muted">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                <CalendarDays className="h-4 w-4" /> Bimbingan Terakhir
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">Sesi tercatat terbaru Anda.</CardDescription>
            </div>
            <Link href="/dashboard/mahasiswa/bimbingan">
              <Button variant="secondary" size="sm" className="min-h-[44px]">
                Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {bimbinganList.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Belum ada sesi bimbingan"
                description="Catat sesi bimbingan pertama Anda bersama dosen pembimbing."
                action={
                  <Link href="/dashboard/mahasiswa/bimbingan">
                    <Button size="sm" className="min-h-[44px]">Catat bimbingan</Button>
                  </Link>
                }
              />
            ) : (
              bimbinganList.slice(0, 3).map((s, i) => (
                <div
                  key={s.id || i}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      {s.tanggal ? s.tanggal.slice(0, 10) : '-'}
                    </span>
                    <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-strong)]">
                      {s.topik || s.catatan || `Sesi ke-${i + 1}`}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* STEP 4 (cont): Activity Table using Table stackOnMobile & StatusBadge    */}
      {/* ========================================================================= */}
      {recentActivity.length > 0 && (
        <Card variant="muted" data-testid="bimbingan-activity-card">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-[var(--text-strong)]">Aktivitas Bimbingan Terbaru</CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                Riwayat sesi bimbingan dan status verifikasi dosen pembimbing.
              </CardDescription>
            </div>
            <Link href="/dashboard/mahasiswa/bimbingan">
              <Button variant="secondary" size="sm" className="min-h-[44px]">
                Lihat semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table stackOnMobile>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="w-[140px]">Aksi</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell data-label="ID" className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                      {a.id}
                    </TableCell>
                    <TableCell data-label="Aksi" className="font-medium text-[var(--text-strong)]">
                      {a.action}
                    </TableCell>
                    <TableCell data-label="Detail" className="text-sm text-[var(--text-body)] break-words">
                      {a.target}
                    </TableCell>
                    <TableCell data-label="Status">
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell data-label="Waktu" className="text-xs text-[var(--text-muted)] tabular-nums sm:text-right">
                      {a.when}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
