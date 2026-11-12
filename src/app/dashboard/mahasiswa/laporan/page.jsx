'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { getGoogleDriveLinkError } from '@/lib/validation';

const SUBMITTED_STATUSES = new Set(['pending', 'submitted', 'approved']);

function parseLuaranPayload(value) {
  if (!value || typeof value !== 'string') {
    return { luaranLink: '', links: [] };
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const links = Object.entries(parsed)
        .map(([label, url]) => ({ label, url: String(url || '').trim() }))
        .filter((link) => link.url);
      return { luaranLink: '', links };
    }
  } catch {
    // Legacy data stores luaran as a single URL.
  }

  return {
    luaranLink: value,
    links: [{ label: 'Buka Luaran', url: value }],
  };
}

export default function LaporanPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [hasLaporan, setHasLaporan] = useState(false);
  const [existingLaporan, setExistingLaporan] = useState(null);
  const [prereqProposal, setPrereqProposal] = useState(false);
  const [prereqBimbingan, setPrereqBimbingan] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [track, setTrack] = useState('');
  const [form, setForm] = useState({
    judul: '',
    laporanLink: '',
    luaranLink: '',
  });

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    try {
      const lapRes = await mahasiswaAPI.getMyLaporan();
      if (lapRes.ok && Array.isArray(lapRes.data) && lapRes.data.length > 0) {
        const latest = lapRes.data[0];
        const isCompletedSubmission =
          SUBMITTED_STATUSES.has(String(latest.status || '').toLowerCase()) &&
          latest.file_url &&
          latest.file_luaran;

        setExistingLaporan(latest);
        const parsedLuaran = parseLuaranPayload(latest.file_luaran || '');
        setForm((current) => ({
          ...current,
          laporanLink: latest.file_url || '',
          luaranLink: parsedLuaran.luaranLink,
        }));

        if (isCompletedSubmission) {
          setHasLaporan(true);
          setLoading(false);
          return;
        }
      }
      const profileRes = await mahasiswaAPI.getProfile();
      if (profileRes.ok) {
        const p = (profileRes.data?.data && typeof profileRes.data.data === 'object')
          ? profileRes.data.data
          : (profileRes.data || {});
        const activeEnrollment = Array.isArray(p.enrollments)
          ? p.enrollments.find(
              (item) => String(item.status || '').toLowerCase() === 'active'
            )
          : null;
        setTrack(p.track || activeEnrollment?.track || '');
        setPrereqProposal(p.status_proposal === 'approved');
        setForm((current) => ({
          ...current,
          judul: p.judul_proyek || p.judul_proposal || '',
        }));
      }
      const bimRes = await mahasiswaAPI.getMyBimbingan();
      if (bimRes.ok) {
        const rawBim = Array.isArray(bimRes.data)
          ? bimRes.data
          : Array.isArray(bimRes.data?.data)
          ? bimRes.data.data
          : [];
        setPrereqBimbingan(
          rawBim.filter((b) => b.status === 'approved').length || 0
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    if (!prereqProposal) {
      toast.error('Proposal harus disetujui sebelum submit sidang');
      return;
    }
    if (prereqBimbingan < 8) {
      toast.error('Minimal 8 bimbingan disetujui sebelum submit sidang');
      return;
    }
    if (!form.laporanLink.trim()) {
      toast.error('Link laporan wajib diisi');
      return;
    }
    if (!form.luaranLink.trim()) {
      toast.error('Link luaran proyek wajib diisi');
      return;
    }
    const laporanLinkError = getGoogleDriveLinkError(form.laporanLink, 'Link laporan sidang');
    if (laporanLinkError) {
      toast.error(laporanLinkError);
      return;
    }
    const luaranLinkError = getGoogleDriveLinkError(form.luaranLink, 'Link luaran proyek');
    if (luaranLinkError) {
      toast.error(luaranLinkError);
      return;
    }
    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.submitLaporan({
        judul: form.judul,
        file_url: form.laporanLink,
        file_luaran: form.luaranLink,
      });
      if (res.ok) {
        toast.success('Laporan dan luaran proyek berhasil disubmit');
        router.push('/dashboard/mahasiswa');
      } else {
        toast.error(res.error || 'Gagal submit');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState variant="form" label="Memuat berkas sidang" />;
  }

  if (hasLaporan) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <PageHeader
          title="Upload Laporan Sidang"
          subtitle="Status penyerahan berkas naskah laporan sidang dan luaran proyek."
        />
        <Card variant="muted">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--ctp-green))] mb-3" />
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">
              Berkas Sidang Sudah Disubmit
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md">
              Laporan sidang dan luaran proyek Anda telah tercatat sebagai syarat verifikasi maju sidang.
            </p>
            <div className="mt-3">
              <StatusBadge status={existingLaporan?.status || 'submitted'} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {existingLaporan?.file_url ? (
                <a
                  href={existingLaporan.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--surface-sunken)] min-h-[44px]"
                >
                  <span>Buka Laporan</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
              {parseLuaranPayload(existingLaporan?.file_luaran || '').links.map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--surface-sunken)] min-h-[44px]"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Upload Laporan Sidang"
        subtitle="Unggah tautan laporan sidang dan luaran proyek sebagai syarat sebelum sidang dijadwalkan."
      />

      {/* Prerequisites indicator */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card variant="muted">
          <CardContent className="flex items-center gap-3 p-4">
            {prereqProposal ? (
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ctp-green))] shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--ctp-red))] shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)] font-medium">Syarat 1: Proposal</p>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {prereqProposal ? 'Sudah Disetujui' : 'Belum Disetujui'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="muted">
          <CardContent className="flex items-center gap-3 p-4">
            {prereqBimbingan >= 8 ? (
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--ctp-green))] shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--ctp-peach))] shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)] font-medium">Syarat 2: Bimbingan</p>
              <p className="text-sm font-semibold text-[var(--text-strong)] font-mono tabular-nums">
                {prereqBimbingan}/8 Sesi Disetujui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <FileText className="h-4 w-4" /> Formulir Berkas Sidang
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Unggah tautan naskah laporan sidang dan luaran proyek (Google Drive) yang dapat diakses oleh dosen pembimbing dan penguji.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Judul" required>
              <Input
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Judul laporan sidang"
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <Field label="Link Laporan Sidang" required hint="Pastikan akses Google Drive disetel 'Siapa saja yang memiliki link dapat melihat'.">
              <Input
                value={form.laporanLink}
                onChange={(e) => setForm({ ...form, laporanLink: e.target.value })}
                placeholder="https://drive.google.com/drive/..."
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <Field label="Link Luaran Proyek" required hint="Tautan repositori, video demo, atau artefak proyek yang disyaratkan.">
              <Input
                value={form.luaranLink}
                onChange={(e) => setForm({ ...form, luaranLink: e.target.value })}
                placeholder="https://drive.google.com/drive/..."
                className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
              />
            </Field>

            <div className="flex gap-3 pt-3 border-t border-[var(--line)]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/mahasiswa')}
                className="min-h-[44px]"
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="min-h-[44px]">
                <Upload className="h-4 w-4 mr-1.5" />
                <span>{submitting ? 'Mengirim...' : 'Submit Berkas Sidang'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
