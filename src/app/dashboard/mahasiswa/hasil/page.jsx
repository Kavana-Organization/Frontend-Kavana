'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

const STATE_CONFIG = {
  'belum-proposal': { label: 'Belum Submit Proposal', statusKey: 'draft', desc: 'Silakan pilih track dan ajukan berkas proposal proyek.' },
  'proposal-pending': { label: 'Proposal Sedang Direview', statusKey: 'pending', desc: 'Proposal sedang ditinjau oleh koordinator program studi.' },
  'proposal-rejected': { label: 'Proposal Ditolak', statusKey: 'rejected', desc: 'Proposal memerlukan perbaikan sesuai catatan koordinator.' },
  'bimbingan': { label: 'Dalam Proses Bimbingan', statusKey: 'info', desc: 'Lengkapi minimal 8 sesi bimbingan bersama dosen pembimbing.' },
  'belum-laporan': { label: 'Siap Submit Laporan Sidang', statusKey: 'terjadwal', desc: 'Syarat 8 bimbingan telah terpenuhi. Segera unggah laporan sidang.' },
  'laporan-pending': { label: 'Laporan Sedang Direview', statusKey: 'pending', desc: 'Menunggu persetujuan naskah laporan sidang dari dosen pembimbing.' },
  'sidang-lulus': { label: 'LULUS SIDANG', statusKey: 'approved', desc: 'Selamat! Anda telah dinyatakan lulus dalam sidang proyek/magang.' },
  'sidang-tidak-lulus': { label: 'Tidak Lulus Sidang', statusKey: 'rejected', desc: 'Silakan berkonsultasi dengan koordinator dan dosen pembimbing untuk jadwal ulang.' },
};

export default function HasilPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bimbinganCount, setBimbinganCount] = useState(0);
  const [sidang, setSidang] = useState(null);
  const [state, setState] = useState('belum-proposal');

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const [profileRes, bimRes, sidangRes] = await Promise.all([
        mahasiswaAPI.getProfile(),
        mahasiswaAPI.getMyBimbingan(),
        mahasiswaAPI.getMySidang().catch(() => ({ ok: false })),
      ]);
      const p = (profileRes.data?.data && typeof profileRes.data.data === 'object')
        ? profileRes.data.data
        : (profileRes.data || {});
      const rawBim = Array.isArray(bimRes.data)
        ? bimRes.data
        : Array.isArray(bimRes.data?.data)
        ? bimRes.data.data
        : [];
      const sData = (sidangRes.data?.data && typeof sidangRes.data.data === 'object')
        ? sidangRes.data.data
        : (sidangRes.data || null);

      if (profileRes.ok) setProfile(p);
      if (bimRes.ok) setBimbinganCount(rawBim.filter((b) => b.status === 'approved').length);
      if (sidangRes.ok && sData) setSidang(sData);

      if (!p.status_proposal || p.status_proposal === 'none') {
        setState('belum-proposal');
      } else if (p.status_proposal === 'pending') {
        setState('proposal-pending');
      } else if (p.status_proposal === 'rejected') {
        setState('proposal-rejected');
      } else if (p.status_proposal === 'approved') {
        const approved = rawBim.filter((b) => b.status === 'approved').length;
        if (approved < 8) {
          setState('bimbingan');
        } else if (sidangRes.ok && sData?.hasil) {
          setState(sData.hasil === 'lulus' ? 'sidang-lulus' : 'sidang-tidak-lulus');
        } else {
          setState('belum-laporan');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState variant="dashboard" label="Memuat hasil akhir" />;
  }

  const cfg = STATE_CONFIG[state] || STATE_CONFIG['belum-proposal'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Nilai & Hasil Akhir"
        subtitle="Status kelulusan sidang, nilai akhir, dan ringkasan pemenuhan syarat akademik."
      />

      {/* Status banner */}
      <Card variant="muted" className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Status Akademik
              </span>
              <StatusBadge status={cfg.statusKey} label={cfg.label} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-strong)] break-words">
              {cfg.label}
            </h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xl break-words">
              {cfg.desc}
            </p>
          </div>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Proposal',
            ok: profile?.status_proposal === 'approved',
            sub: profile?.status_proposal || '-',
          },
          {
            title: 'Bimbingan',
            ok: bimbinganCount >= 8,
            sub: `${bimbinganCount}/8 disetujui`,
          },
          {
            title: 'Laporan',
            ok: ['submitted', 'approved'].includes(sidang?.laporan_status),
            sub: sidang?.laporan_status || '-',
          },
          {
            title: 'Sidang',
            ok: sidang?.hasil === 'lulus',
            sub: sidang?.hasil || '-',
          },
        ].map((item) => (
          <Card variant="muted" key={item.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--text-muted)]">{item.title}</p>
                {item.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--ctp-green))]" />
                ) : (
                  <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                )}
              </div>
              <p className="text-sm font-semibold text-[var(--text-strong)] mt-2 capitalize font-mono tabular-nums">
                {item.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dosen info */}
      {profile?.dosen_nama && (
        <Card variant="muted">
          <CardContent className="flex items-center gap-3.5 p-5">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-strong)] flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">Dosen Pembimbing</p>
              <p className="text-sm font-semibold text-[var(--text-strong)] truncate mt-0.5" title={profile.dosen_nama}>
                {profile.dosen_nama}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
