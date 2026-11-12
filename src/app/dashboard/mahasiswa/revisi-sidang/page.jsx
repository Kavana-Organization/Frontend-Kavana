'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardCheck, FileText, Clock, Upload, ExternalLink } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';
import { getGoogleDriveLinkError } from '@/lib/validation';

const HASIL_LABEL = {
  lulus: { label: 'Lulus (Tanpa Revisi)', statusKey: 'approved' },
  lulus_revisi: { label: 'Lulus dengan Revisi', statusKey: 'pending' },
  tidak_lulus: { label: 'Tidak Lulus', statusKey: 'rejected' },
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function RevisiSidangPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ sidang: null, is_kelompok: false, revisi: [] });
  const [form, setForm] = useState({ file_url: '', file_luaran: '', catatan_mahasiswa: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role && role !== 'mahasiswa') {
      router.replace(`/dashboard/${role}`);
      return;
    }
    loadData();
  }, [role, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await mahasiswaAPI.getMyRevisi();
      if (res.ok) setData(res.data || { sidang: null, is_kelompok: false, revisi: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sidang = data.sidang;
  const revisiList = useMemo(() => (Array.isArray(data.revisi) ? data.revisi : []), [data.revisi]);
  const latestRevisi = revisiList[0] || null;
  const hasilSidang = sidang?.hasil_sidang || null;
  const isLulusRevisi = hasilSidang === 'lulus_revisi';

  const canSubmit =
    isLulusRevisi &&
    (!latestRevisi || ['rejected', 'needs_revision'].includes(String(latestRevisi.status || '').toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file_url.trim()) {
      toast.error('Link revisi wajib diisi');
      return;
    }
    const revisiLinkError = getGoogleDriveLinkError(form.file_url, 'Link revisi');
    if (revisiLinkError) {
      toast.error(revisiLinkError);
      return;
    }
    if (form.file_luaran.trim()) {
      const luaranLinkError = getGoogleDriveLinkError(form.file_luaran, 'Link luaran revisi');
      if (luaranLinkError) {
        toast.error(luaranLinkError);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await mahasiswaAPI.submitRevisi({
        file_url: form.file_url.trim(),
        file_luaran: form.file_luaran.trim() || undefined,
        catatan_mahasiswa: form.catatan_mahasiswa.trim() || undefined,
      });
      if (res.ok) {
        toast.success(res.data?.message || 'Revisi berhasil disubmit');
        setForm({ file_url: '', file_luaran: '', catatan_mahasiswa: '' });
        await loadData();
      } else {
        toast.error(res.error || 'Gagal submit revisi');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState variant="form" label="Memuat data revisi" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        title="Revisi Sidang"
        subtitle="Tinjau catatan perbaikan sidang dan unggah berkas revisi yang disetujui penguji."
      />

      {/* Banner hasil sidang */}
      {!sidang ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Belum Ada Catatan Sidang"
          description="Halaman ini akan aktif dan menampilkan catatan penguji setelah Anda menjalani sidang proyek atau magang."
        />
      ) : (
        <Card variant="muted">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
                  <ClipboardCheck className="h-4 w-4" /> Hasil Sidang Anda
                </CardTitle>
                <CardDescription className="text-[var(--text-muted)]">
                  {hasilSidang ? HASIL_LABEL[hasilSidang]?.label || hasilSidang : 'Hasil sidang belum ditetapkan oleh penguji.'}
                </CardDescription>
              </div>
              {hasilSidang && (
                <StatusBadge
                  status={HASIL_LABEL[hasilSidang]?.statusKey || 'pending'}
                  label={HASIL_LABEL[hasilSidang]?.label || hasilSidang}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 text-sm text-[var(--text-body)] sm:grid-cols-2">
              <div>
                <span className="text-[var(--text-muted)]">Tanggal:</span>{' '}
                <span className="font-mono tabular-nums font-medium text-[var(--text-strong)]">
                  {formatDateTime(sidang.tanggal)} {sidang.waktu ? `· ${String(sidang.waktu).slice(0, 5)}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Ruangan:</span>{' '}
                <span className="font-medium text-[var(--text-strong)]">{sidang.ruangan || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Pembimbing:</span>{' '}
                <span className="font-medium text-[var(--text-strong)]">{sidang.dosen_nama || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Penguji:</span>{' '}
                <span className="font-medium text-[var(--text-strong)]">{sidang.penguji_nama || '-'}</span>
              </div>
            </div>

            {sidang.catatan_sidang && (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3.5">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Catatan Sidang Penguji:
                </span>
                <p className="mt-1 text-sm text-[var(--text-strong)] whitespace-pre-line break-words">
                  {sidang.catatan_sidang}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form upload revisi */}
      {isLulusRevisi && (
        <Card variant="muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
              <Upload className="h-4 w-4" /> Submit Berkas Revisi
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)]">
              {data.is_kelompok
                ? 'Submit revisi akan mewakili seluruh anggota tim kelompok proyek Anda.'
                : 'Unggah berkas perbaikan naskah laporan dan luaran proyek Anda.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canSubmit ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4 flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                <Clock className="h-4 w-4 shrink-0 text-[hsl(var(--ctp-peach))]" />
                <span>
                  {latestRevisi
                    ? String(latestRevisi.status) === 'pending'
                      ? 'Revisi terbaru sedang menunggu review dan persetujuan dosen penguji.'
                      : 'Revisi sidang Anda sudah disetujui — tidak perlu mengirim ulang.'
                    : 'Hasil sidang belum mensyaratkan pengajuan revisi.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="URL File Revisi (Google Drive)" required hint="Tautan berkas perbaikan naskah laporan (Google Drive).">
                  <Input
                    value={form.file_url}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    placeholder="https://drive.google.com/drive/..."
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                  />
                </Field>

                <Field label="URL Luaran (Opsional)" hint="Tautan perubahan artefak atau repositori jika ada revisi luaran.">
                  <Input
                    value={form.file_luaran}
                    onChange={(e) => setForm({ ...form, file_luaran: e.target.value })}
                    placeholder="https://drive.google.com/drive/..."
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)] min-h-[44px]"
                  />
                </Field>

                <Field label="Ringkasan Perubahan" hint="Jelaskan poin perbaikan yang telah Anda lakukan sesuai catatan penguji.">
                  <Textarea
                    rows={3}
                    value={form.catatan_mahasiswa}
                    onChange={(e) => setForm({ ...form, catatan_mahasiswa: e.target.value })}
                    placeholder="Jelaskan poin perubahan dari catatan sidang"
                    className="bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-strong)]"
                  />
                </Field>

                <div className="flex justify-end pt-2 border-t border-[var(--line)]">
                  <Button type="submit" disabled={submitting} className="min-h-[44px]">
                    <Upload className="h-4 w-4 mr-1.5" />
                    <span>{submitting ? 'Mengirim...' : 'Submit Revisi'}</span>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Riwayat revisi */}
      <Card variant="muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-strong)]">
            <FileText className="h-4 w-4" /> Riwayat Revisi
          </CardTitle>
          <CardDescription className="text-[var(--text-muted)]">
            Daftar pengajuan perbaikan yang telah dikirimkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revisiList.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada submit revisi"
              description="Riwayat pengajuan perbaikan naskah sidang akan dicatat di sini."
            />
          ) : (
            <div className="space-y-3">
              {revisiList.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs font-semibold text-[var(--text-strong)] font-mono tabular-nums">
                        Ronde {r.revision_round}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                      {formatDateTime(r.submitted_at)}
                    </span>
                  </div>

                  {r.catatan_mahasiswa && (
                    <p className="text-sm text-[var(--text-strong)] whitespace-pre-line break-words">
                      {r.catatan_mahasiswa}
                    </p>
                  )}

                  {r.catatan_dosen && (
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] p-3">
                      <p className="text-xs font-medium text-[var(--text-muted)]">
                        Catatan Penguji{r.reviewer_nama ? ` (${r.reviewer_nama})` : ''}:
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--text-strong)] whitespace-pre-line break-words">
                        {r.catatan_dosen}
                      </p>
                    </div>
                  )}

                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline pt-1"
                    >
                      <span>Lihat berkas revisi</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
