'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardCheck, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Upload } from 'lucide-react';
import { toast } from '@/lib/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth-store';
import { mahasiswaAPI } from '@/lib/api';

const STATUS_LABEL = {
  pending: { label: 'Menunggu Review', color: 'ctp-yellow', Icon: Clock },
  approved: { label: 'Disetujui', color: 'ctp-green', Icon: CheckCircle2 },
  rejected: { label: 'Ditolak', color: 'ctp-red', Icon: XCircle },
  needs_revision: { label: 'Perlu Diperbaiki', color: 'ctp-peach', Icon: AlertTriangle },
};

const HASIL_LABEL = {
  lulus: { label: 'Lulus (Tanpa Revisi)', color: 'ctp-green' },
  lulus_revisi: { label: 'Lulus dengan Revisi', color: 'ctp-yellow' },
  tidak_lulus: { label: 'Tidak Lulus', color: 'ctp-red' },
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
  const revisiList = useMemo(() => Array.isArray(data.revisi) ? data.revisi : [], [data.revisi]);
  const latestRevisi = revisiList[0] || null;
  const hasilSidang = sidang?.hasil_sidang || null;
  const isLulusRevisi = hasilSidang === 'lulus_revisi';

  const canSubmit = isLulusRevisi && (
    !latestRevisi || ['rejected', 'needs_revision'].includes(String(latestRevisi.status || '').toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file_url.trim()) {
      toast.error('File revisi wajib diisi (URL Drive atau hasil upload)');
      return;
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[hsl(var(--ctp-lavender)/0.3)] border-t-[hsl(var(--ctp-lavender))] rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = 'bg-[hsl(var(--ctp-mantle)/0.5)] border-[hsl(var(--ctp-overlay0)/0.45)] text-[hsl(var(--ctp-text))]';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Banner hasil sidang */}
      {!sidang ? (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardContent className="pt-6 text-sm text-[hsl(var(--ctp-subtext0))] flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Belum ada catatan sidang. Halaman ini akan aktif setelah Anda menjalani sidang.
          </CardContent>
        </Card>
      ) : (
        <Card
          className={
            hasilSidang
              ? `bg-[hsl(var(--${HASIL_LABEL[hasilSidang]?.color})/0.10)] border-[hsl(var(--${HASIL_LABEL[hasilSidang]?.color})/0.40)] ctp-ring`
              : 'bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring'
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <ClipboardCheck className="h-4 w-4" /> Hasil Sidang Anda
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
              {hasilSidang
                ? HASIL_LABEL[hasilSidang]?.label || hasilSidang
                : 'Hasil sidang belum diset oleh penguji.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-[hsl(var(--ctp-subtext1))] md:grid-cols-2">
            <div><span className="text-[hsl(var(--ctp-subtext0))]">Tanggal:</span> {formatDateTime(sidang.tanggal)} {sidang.waktu ? `· ${String(sidang.waktu).slice(0,5)}` : ''}</div>
            <div><span className="text-[hsl(var(--ctp-subtext0))]">Ruangan:</span> {sidang.ruangan || '-'}</div>
            <div><span className="text-[hsl(var(--ctp-subtext0))]">Pembimbing:</span> {sidang.dosen_nama || '-'}</div>
            <div><span className="text-[hsl(var(--ctp-subtext0))]">Penguji:</span> {sidang.penguji_nama || '-'}</div>
            {sidang.catatan_sidang ? (
              <div className="md:col-span-2 rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.45)] p-3">
                <span className="text-[hsl(var(--ctp-subtext0))]">Catatan Sidang:</span>
                <p className="mt-1 whitespace-pre-line">{sidang.catatan_sidang}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Form upload revisi */}
      {isLulusRevisi ? (
        <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
              <Upload className="h-4 w-4" /> Submit Revisi
            </CardTitle>
            <CardDescription className="text-[hsl(var(--ctp-subtext0))]">
              {data.is_kelompok
                ? 'Submit revisi akan mewakili seluruh anggota kelompok proyek Anda.'
                : 'Submit revisi laporan/luaran Anda di sini.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canSubmit ? (
              <div className="rounded-xl border border-[hsl(var(--ctp-yellow)/0.40)] bg-[hsl(var(--ctp-yellow)/0.10)] px-3 py-2 text-xs text-[hsl(var(--ctp-yellow))] inline-flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                {latestRevisi
                  ? (String(latestRevisi.status) === 'pending'
                      ? 'Revisi terbaru sedang menunggu review dosen.'
                      : 'Revisi sudah disetujui — tidak perlu submit ulang.')
                  : 'Hasil sidang belum mensyaratkan revisi.'}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label className="text-[hsl(var(--ctp-subtext1))]">URL File Revisi (Drive / GCS)</Label>
                  <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://drive.google.com/..." className={inputCls} />
                </div>
                <div>
                  <Label className="text-[hsl(var(--ctp-subtext1))]">URL Luaran (Opsional)</Label>
                  <Input value={form.file_luaran} onChange={(e) => setForm({ ...form, file_luaran: e.target.value })} placeholder="https://..." className={inputCls} />
                </div>
                <div>
                  <Label className="text-[hsl(var(--ctp-subtext1))]">Ringkasan Perubahan</Label>
                  <Textarea rows={3} value={form.catatan_mahasiswa} onChange={(e) => setForm({ ...form, catatan_mahasiswa: e.target.value })} placeholder="Jelaskan poin perubahan dari catatan sidang" className={inputCls} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting} className="rounded-2xl bg-[hsl(var(--ctp-green)/0.20)] text-[hsl(var(--ctp-text))] border border-[hsl(var(--ctp-green)/0.35)]">
                    {submitting ? 'Mengirim...' : 'Submit Revisi'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Riwayat revisi */}
      <Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--ctp-text))]">
            <FileText className="h-4 w-4" /> Riwayat Revisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revisiList.length === 0 ? (
            <p className="text-sm text-[hsl(var(--ctp-subtext0))] py-4 text-center">Belum ada submit revisi.</p>
          ) : (
            <div className="space-y-2">
              {revisiList.map((r) => {
                const st = STATUS_LABEL[r.status] || STATUS_LABEL.pending;
                const Icon = st.Icon;
                return (
                  <div key={r.id} className="rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-mantle)/0.35)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge className={`rounded-xl border bg-[hsl(var(--${st.color})/0.12)] text-[hsl(var(--${st.color}))] border-[hsl(var(--${st.color})/0.35)]`}>
                            <Icon className="h-3 w-3 mr-1" /> {st.label}
                          </Badge>
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">Ronde {r.revision_round}</span>
                          <span className="text-xs text-[hsl(var(--ctp-subtext0))]">· {formatDateTime(r.submitted_at)}</span>
                        </div>
                        {r.catatan_mahasiswa ? (
                          <p className="text-sm text-[hsl(var(--ctp-text))] whitespace-pre-line">{r.catatan_mahasiswa}</p>
                        ) : null}
                        {r.catatan_dosen ? (
                          <div className="mt-2 rounded-xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-base)/0.40)] p-2">
                            <p className="text-xs text-[hsl(var(--ctp-subtext0))]">Catatan Dosen{r.reviewer_nama ? ` (${r.reviewer_nama})` : ''}:</p>
                            <p className="text-sm text-[hsl(var(--ctp-text))] whitespace-pre-line">{r.catatan_dosen}</p>
                          </div>
                        ) : null}
                        {r.file_url ? (
                          <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-[hsl(var(--ctp-blue))] hover:underline mt-1 inline-block">
                            Lihat file revisi
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
